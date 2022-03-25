const _ = require("lodash");
const TripleNode = require("./tripleNode");
const TripleEdge = require("./tripleEdge");
const INodeBase = require("./iNodeBase");
const { Utils, Strings } = require("@graphminer/Utils");
const TreeNode = require("./treeNode");
const Forest = require("./forest");

/**
 * Lightweight (directed) graph structure with some graph analytic methods.
 *
 */
class Graph {
	typeName;
	#groups;
	#edges;
	#nodes;

	/**
	 * Instantiates a new Graph.
	 * @param data {any} The given data is simply assigned to the instance, no checks performed.
	 */
	constructor(data = null) {
		this.typeName = "Graph";
		this.id = Utils.id();
		this.#groups = [];
		this.#edges = [];
		this.#nodes = [];
		if (!_.isNil(data)) {
			_.assign(this, data);
		}
	}

	/**
	 * Equivalent to instantiating a new Graph.
	 * @return {Graph}
	 */
	static get empty() {
		return new Graph();
	}

	/**
	 * The regex to detect a triple in pseudo-cypher.
	 * Things like this will be picked up
	 * - (a)-->(b)
	 * - (a:Person)-->(d)
	 * - (a:Thing{x:34})-->(c)
	 * The content of the nodes is handled separately by {@link TripleNode.parse}.
	 * @return {RegExp}
	 */
	static get regNoEdge() {
		return /\(([^->]+)\)(?=-->\(([^->]+)\))/gi;
	}

	/**
	 * The regex to detect a triple in pseudo-cypher.
	 * Things like this will be picked up
	 * - (a)-[v]->(b)
	 * - (a:Person)-[:AB]->(d)
	 * - (a:Thing{x:34})-[k:F{x:5}]->(c)
	 * The content of the node is handled separately by {@link TripleNode.parse}.
	 * The content of the edge is handled separately by {@link TripleEdge.parse}.
	 * @return {RegExp}
	 */
	static get regWithEdge() {
		return /\(([^->]+)\)(?=-\[([^->]+)\]->\(([^->]+)\))/gi;
	}

	/**
	 * Returns 'Graph' as type name for this instance.
	 */
	get typeName() {
		return this.typeName;
	}

	/**
	 * Returns a copy of the edges in this graph.
	 * The clone means that the node data cannot be altered by accessing them in this way.
	 * This ensures integrity since otherwise e.g. sourceId of the edges could be changed and break the graph.
	 * @return {IEdgeBase[]}
	 */
	get edges() {
		return _.clone(this.#edges);
	}

	/**
	 * Returns a copy of the nodes in this graph.
	 * The clone means that the node data cannot be altered by accessing them in this way.
	 * This ensures integrity since otherwise e.g. id of the node could be changed and break the graph.
	 * @return {INodeBase[]}
	 */
	get nodes() {
		return _.clone(this.#nodes);
	}

	get groups() {
		return _.clone(this.#groups);
	}

	get nodeCount() {
		return this.#nodes.length;
	}

	get edgeCount() {
		return this.#edges.length;
	}

	get groupCount() {
		return this.#groups.length;
	}

	static fromJSON(json) {
		if (json.typeName !== "Graph") {
			throw new Error(`Wrong deserialization data: ${json.typeName} passed to Graph.`);
		}
		let graph = new Graph();
		graph.id = json.id;
		graph.name = json.name;
		graph.description = json.description;
		graph.#nodes = json.nodes;
		graph.#edges = json.edges;
		graph.#groups = json.groups;

		return graph;
	}

	/**
	 *
	 * @returns {*}
	 * @param typeName
	 */
	static defaultEntityCreator(typeName = "Unknown") {
		return (u) => {
			const entity = {
				id: u?.data?.id || Utils.id(),
				name: u?.name || u.data?.name,
				description: u?.description,
				typeName: u?.type || u?.data?.typeName || typeName,
			};
			return _.assign(entity, u?.data);
		};
	}

	/**
	 *
	 * @param [u] {TripleEdge}
	 * @returns {*}
	 */
	static defaultLinkCreator(u = null) {
		const entity = {
			id: u?.data?.id || Utils.id(),
			name: u?.name || u?.data?.name,
			description: u?.description,
			typeName: u?.type || u?.data?.typeName || "ObjectProperty",
			sourceId: u?.data?.sourceId || Utils.id(),
			targetId: u?.data?.targetId || Utils.id(),
		};
		return _.assign(entity, u?.data);
	}

	/**
	 * Creates a graph from pseudo-cypher.
	 * @param pseudoCypher {string} Some pseudo-cypher graph definition.
	 * @param entityCreator? Optional function returning an entity for the given TripleNode. Falls back to {@link Graph.defaultEntityCreator} which relies on {@link GraphModels} for creating entities.
	 * @param edgeCreator? Optional function returning an edge entity for the given TripleEdge. Falls back to {@link Graph.defaultLinkCreator} which relies on {@link GraphModels} for creating entities.
	 */
	static fromPseudoCypher(pseudoCypher, entityCreator = null, edgeCreator = null) {
		if (Utils.isEmpty(pseudoCypher)) {
			return null;
		}
		let g = new Graph();

		g.description = pseudoCypher;

		const lines = pseudoCypher.split("\n").filter((l) => l.length > 0);

		let h;
		for (const line of lines) {
			h = Graph.parsePseudoCypherLine(line, entityCreator, edgeCreator);
			g.mergeGraph(h);
		}
		return g;
	}

	/**
	 * An alias for {@link Graph.fromPseudoCypher}.
	 * @param pseudoCypher
	 * @param entityCreator
	 * @param defaultEdgeCreator
	 * @return {Graph}
	 */
	static parse(pseudoCypher, entityCreator = null, defaultEdgeCreator = null) {
		return Graph.parsePseudoCypherLine(pseudoCypher, entityCreator, defaultEdgeCreator);
	}

	/**
	 * Parses a single line of pseudo-cypher to a graph.
	 * @param line
	 * @param entityCreator {Function|string}
	 * @param edgeCreator {Function|string}
	 * @return {Graph}
	 */
	static parsePseudoCypherLine(line, entityCreator = null, edgeCreator = null) {
		if (Utils.isEmpty(line)) {
			return null;
		}

		line = line.trim();
		if (_.isNil(entityCreator)) {
			entityCreator = Graph.defaultEntityCreator();
		} else {
			if (_.isString(entityCreator)) {
				entityCreator = Graph.defaultEntityCreator(entityCreator);
			}
			if (!_.isFunction(entityCreator)) {
				throw new Error(Strings.ShoudBeType("entityCreator", "Function", "Graph.parsePseudoCypher"));
			}
		}
		if (_.isNil(edgeCreator)) {
			edgeCreator = Graph.defaultLinkCreator;
		}
		let entity;
		let g = new Graph();

		/**
		 * Adds a node if needed.
		 */
		const checkAddNode = (entity) => {
			if (Utils.isEmpty(entity.id)) {
				throw new Error("Attempt to add a node without an id.");
			}
			if (!_.isString(entity.id)) {
				entity.id = entity.id.toString();
			}
			let found = g.getNodeById(entity.id);
			if (_.isNil(found)) {
				found = g.addNode(entity);
			}
			return found;
		};
		/**
		 * Adds an edge if needed.
		 * Bit tricky because this allows multiple edges with exactly the same characteristics,
		 * but that's also what happens in Neo4j.
		 */
		const checkAddEdge = (entity) => {
			let found = g.getEdgeById(entity.id);
			if (_.isNil(found)) {
				found = g.addEdge(entity);
			}
			return found;
		};
		// ===================================================================
		// Singleton
		// ===================================================================
		let found = TripleNode.parse(line);
		if (!_.isNil(found)) {
			entity = entityCreator(found);
			if (!_.isNil(entity)) {
				checkAddNode(entity);
			}
			return g;
		}
		// ===================================================================
		// (something)-->(something else)
		// ===================================================================
		// note  that the endpoint of a triple can be the start of the next and hence creates duplicates if we don't check

		found = line.matchAll(Graph.regNoEdge);
		if (!_.isNil(found)) {
			found = Array.from(found);
			let previousNode = null;
			let sourceNode;
			for (const duo of found) {
				if (_.isNil(previousNode)) {
					const f = TripleNode.parse(duo[1]);
					sourceNode = entityCreator(f);
				} else {
					sourceNode = previousNode;
				}
				const t = TripleNode.parse(duo[2]);
				const targetNode = entityCreator(t);
				if (!_.isNil(sourceNode) && !_.isNil(targetNode)) {
					const from = checkAddNode(sourceNode);
					const to = checkAddNode(targetNode);
					const edge = edgeCreator();
					edge.sourceId = from.id;
					edge.targetId = to.id;
					checkAddEdge(edge);
				}
				previousNode = targetNode;
			}
		}
		// ===================================================================
		// (something)-[edge]->(something else)
		// ===================================================================
		found = line.matchAll(Graph.regWithEdge);
		if (!_.isNil(found)) {
			found = Array.from(found);
			let previousNode = null;
			let sourceNode;
			for (const trio of found) {
				if (_.isNil(previousNode)) {
					const f = TripleNode.parse(trio[1]);
					sourceNode = entityCreator(f);
				} else {
					sourceNode = previousNode;
				}
				const between = TripleEdge.parse(trio[2]);
				const t = TripleNode.parse(trio[3]);

				const edge = edgeCreator(between);
				const targetNode = entityCreator(t);

				if (!_.isNil(sourceNode) && !_.isNil(edge) && !_.isNil(targetNode)) {
					const from = checkAddNode(sourceNode);
					edge.sourceId = from.id;
					const to = checkAddNode(targetNode);
					edge.targetId = to.id;
					checkAddEdge(edge);
				}
			}
		}
		return g;
	}

	/**
	 * Merges the given graph into this one.
	 * @param g
	 * @return {this<INodeBase, GroupBase, EdgeBase>}
	 */
	mergeGraph(g) {
		if (_.isNil(g)) {
			return this;
		}
		for (const n of g.nodes) {
			const found = this.getNodeById(n.id);
			if (_.isNil(found)) {
				this.addNode(n);
			}
		}
		for (const e of g.edges) {
			this.addEdge(e);
			const found = this.getEdgeById(e.id);
			if (_.isNil(found)) {
				this.addNode(e);
			}
		}
		return this;
	}

	/**
	 * Returns the flow starting at the specified node id.
	 * A flow is a full-length path to a leaf node.
	 * @param start {string|INodeBase} A node or node id part of this graph.
	 * @return The collection of paths.
	 */
	getFlows(start) {
		if (Utils.isEmpty(start)) {
			throw new Error("Specified nil in getFlows.");
		}
		let startNode;
		if (_.isString(start)) {
			startNode = this.getNodeById(start);
		} else {
			startNode = this.getNodeById(start.id);
		}

		if (_.isNil(startNode)) {
			throw new Error(`The specified node to trace the flows from is not part of the graph.`);
		}

		let paths = [];
		const visitor = (n, level, path, hasChildren) => {
			if (!hasChildren) {
				paths.push(path);
			}
		};
		this.dft(visitor, startNode);
		return paths;
	}

	clear() {
		this.typeName = "Graph";
		this.id = Utils.id();
		this.#groups = [];
		this.#edges = [];
		this.#nodes = [];
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			odes: this.#nodes,
			edges: this.#edges,
			groups: this.#groups,
		};
	}

	clone() {
		const clone = Graph.fromJSON(this.toJSON());
		clone.id = Utils.id();
		return clone;
	}

	getEdgesBetween(id1, id2, anyDirection = true) {
		if (anyDirection) {
			return this.#edges.filter((e) => (e.sourceId === id1 && e.targetId === id2) || (e.sourceId === id2 && e.targetId === id1));
		} else {
			return this.#edges.filter((e) => e.sourceId === id1 && e.targetId === id2);
		}
	}

	getEdge(sourceId, targetId) {
		return this.#edges.find((e) => e.sourceId === sourceId && e.targetId === targetId);
	}

	/**
	 * Returns whether the item with the specified id is part of this graph.
	 * @param id {string} The id of the node.
	 * @return {boolean}
	 */
	idExists(id) {
		if (Utils.isEmpty(id)) {
			throw new Error(Strings.IsNil("id", "Graph.idExists"));
		}
		return !_.isNil(this.getById(id));
	}

	/**
	 * Fetches the item in the graph with the specified id.
	 * @param id {string} An identifier.
	 * @return {any}
	 */
	getById(id) {
		let found = this.getNodeById(id);
		if (!_.isNil(found)) {
			return found;
		}
		found = this.getEdgeById(id);
		if (!_.isNil(found)) {
			return found;
		}
		found = this.getGroupById(id);
		if (!_.isNil(found)) {
			return found;
		}
		return null;
	}

	/**
	 * Returns whether there is at least one edge (in any direction) between the specified node id's.
	 * @param id1 {string} A node id.
	 * @param id2 {string} A node id.
	 * @return {boolean}
	 */
	areConnected(id1, id2) {
		return this.getEdgesBetween(id1, id2).length > 0;
	}

	/**
	 * Gets edges or nodes via their type name.
	 * @param typeName
	 * @return {any[]}
	 */
	getByTypeName(typeName) {
		if (Utils.isEmpty(typeName)) {
			throw new Error("Given nil typeName in getByTypeName.");
		}
		let coll = this.#nodes.filter((n) => n["typeName"] === typeName);
		coll = coll.concat(this.#edges.filter((n) => n["typeName"] === typeName));
		coll = coll.concat(this.#groups.filter((n) => n["typeName"] === typeName));
		return coll;
	}

	getNodesByTypeName(typeName) {
		return this.#nodes.filter((n) => n["typeName"] === typeName) || [];
	}

	getNodeById(id) {
		return this.#nodes.find((n) => n.id === id) || null;
	}

	getNodeByName(name) {
		return this.#nodes.find((n) => n["name"].toString().trim().toLowerCase() === name.trim().toLowerCase());
	}

	/**
	 * An extension of {@link getNodeByName} for a string of names.
	 * @param names {string[]} Node names.
	 * @return {INodeBase[]}
	 */
	getNodesByName(names) {
		return names.map((n) => this.getNodeByName(n));
	}

	findNode(predicate) {
		return this.#nodes.find(predicate);
	}

	findEdges(predicate) {
		return this.#edges.find(predicate);
	}

	filterNodes(predicate) {
		return this.#nodes.filter(predicate);
	}

	filterEdges(predicate) {
		return this.#edges.filter(predicate);
	}

	getEdgeById(id) {
		return this.#edges.find((e) => e.id === id);
	}

	getGroupById(id) {
		return this.#groups.find((n) => n.id === id);
	}

	/**
	 * Returns the edge with the specified node id as source.
	 * @param id {string} An id.
	 * @return {IEdgeBase[]}
	 */
	getOutgoingEdges(id) {
		return this.#edges.filter((e) => e.sourceId === id);
	}

	/**
	 * Returns the edge with the specified node id as target.
	 * @param id {string} An id.
	 * @return {IEdgeBase[]}
	 */
	getIncomingEdges(id) {
		return this.#edges.filter((e) => e.targetId === id);
	}

	/**
	 * Returns the nodes with an edge towards the specified id.
	 * @param id
	 * @return {any[]}
	 */
	getParents(id) {
		const coll = [];
		const node = this.getNodeById(id);
		if (_.isNil(node)) {
			return coll;
		}
		const edges = this.getIncomingEdges(id);
		const isInCollection = (n) => coll.filter((x) => x.id === n.id).length > 0;
		edges.forEach((e) => {
			const item = this.getNodeById(e.sourceId);
			if (!isInCollection(item)) {
				coll.push(item);
			}
		});
		return coll;
	}

	getChildren(something) {
		if (!_.isString(something)) {
			something = something.id;
		}
		const coll = [];
		const node = this.getNodeById(something);
		if (_.isNil(node)) {
			return coll;
		}
		const edges = this.getOutgoingEdges(something);
		const isInCollection = (n) => coll.filter((x) => x.id === n.id).length > 0;
		edges.forEach((e) => {
			const item = this.getNodeById(e.targetId);
			if (!isInCollection(item)) {
				coll.push(item);
			}
		});
		return coll;
	}

	getParentHierarchy(id) {
		const coll = [];
		const node = this.getNodeById(id);
		if (_.isNil(node)) {
			return coll;
		}
		let parent = node;
		while (!_.isNil(parent) && !_.isNil(parent.parentId)) {
			parent = this.getGroupById(parent.parentId);
			if (!_.isNil(parent)) {
				coll.push(parent);
			}
		}
		return coll;
	}

	toForest() {
		const tree = new Forest();
		const dic = {};
		this.#nodes.forEach((d) => {
			dic[d.id] = new TreeNode(d);
		});
		this.#nodes.forEach((d) => {
			if (!_.isNil(d.parentId)) {
				const parentNode = dic[d.parentId];
				const node = dic[d.id];
				if (!_.isNil(parentNode)) {
					parentNode.appendChild(node);
				}
			}
		});
		const roots = _.values(dic).filter((n) => n.isRoot);
		return Forest.fromRoots(roots);
	}

	/**
	 * Adds a node to the graph.
	 * @param node {any} A INodeBase instance or some data which can be converted to it.
	 */
	addNode(node) {
		if (Utils.isEmpty(node)) {
			throw new Error("Cannot add nil node to the graph.");
		}
		if (_.isString(node)) {
			node = {
				id: node,
				typeName: "Unknown",
			};
		} else if (_.isNumber(node)) {
			node = {
				id: node.toString(),
				typeName: "Unknown",
			};
		} else if (_.isObject(node)) {
			node = JSON.parse(JSON.stringify(node));
		}
		// at this point we give up
		if (!_.isPlainObject(node)) {
			throw new Error(Strings.ShoudBeType("node", "JSON", "Graph.addNode"));
		}
		if (Utils.isEmpty(node.id)) {
			node.id = Utils.id();
		}

		if (Utils.isEmpty(node.typeName)) {
			throw new Error(Strings.IsNil("typeName", "Graph.addNode"));
		}
		this.#nodes.push(node);

		return node;
	}

	/**
	 * Adds an edge to the graph.
	 * @param edge
	 * @return {any}
	 */
	addEdge(edge) {
		if (Utils.isEmpty(edge)) {
			throw new Error("Cannot add nil to the graph.");
		}

		if (!_.isPlainObject(edge)) {
			throw new Error(Strings.ShoudBeType("edge", "JSON", "Graph.addEdge"));
		}
		if (Utils.isEmpty(edge.typeName)) {
			throw new Error(Strings.IsNil("typeName", "Graph.addEdge"));
		}
		if (Utils.isEmpty(edge.sourceId)) {
			throw new Error(Strings.IsNil("sourceId", "Graph.addEdge"));
		}
		if (Utils.isEmpty(edge.targetId)) {
			throw new Error(Strings.IsNil("targetId", "Graph.addEdge"));
		}
		if (Utils.isEmpty(edge.id)) {
			edge.id = Utils.id();
		}

		this.#edges.push(edge);
		return edge;
	}

	/**
	 * Removes a node from the graph.
	 * @param dataOrNode
	 * @return {any}
	 */
	removeNode(dataOrNode) {
		if (Utils.isEmpty(dataOrNode)) {
			throw new Error("Cannot remove nil from graph.");
		}
		let node;
		if (_.isString(dataOrNode)) {
			// assuming the string is the id
			node = this.getNodeById(dataOrNode.toString());
			if (!_.isNil(node)) {
				return this.#removeNode(node);
			}
			return null;
		} else if (_.isPlainObject(dataOrNode)) {
			if (Utils.isEmpty(dataOrNode["id"])) {
				throw new Error("Cannot remove a node from the graph from something without an id.");
			}
			return this.#removeNode(dataOrNode);
		} else if (dataOrNode instanceof INodeBase) {
			return this.#removeNode(dataOrNode);
		} else {
			throw new Error("Don't know how to remove a node from the given object.");
		}
	}

	#removeNode(node) {
		const removals = _.remove(this.#nodes, { id: node.id });
		// only checking the edge if anything was actually removed
		if (!_.isNil(removals) && removals.length > 0) {
			const attachedEdgeIds = this.getIncomingEdges(node.id)
				.concat(this.getOutgoingEdges(node.id))
				.map((e) => e.id);
			_.remove(this.#edges, (e) => _.includes(attachedEdgeIds, e.id));
		}
		return removals;
	}

	/**
	 * Removes the given edge.
	 * @param dataOrEdge {any} A data blob or an edge instance.
	 * @return {any}
	 */
	removeEdge(dataOrEdge) {
		if (Utils.isEmpty(dataOrEdge)) {
			throw new Error("Cannot remove nil from graph.");
		}
		let edge;
		if (_.isString(dataOrEdge)) {
			// assuming the string is the id
			edge = this.getEdgeById(dataOrEdge.toString());
			if (!_.isNil(edge)) {
				return this.removeEdge(edge);
			}
			return null;
		} else if (_.isPlainObject(dataOrEdge)) {
			if (Utils.isEmpty(dataOrEdge["id"])) {
				throw new Error("Cannot remove an edge from the graph from something without an id.");
			}
			edge = this.getEdgeById(dataOrEdge["id"]);
			return this.removeEdge(edge);
		} else if (dataOrEdge instanceof LinkBase) {
			edge = dataOrEdge;
			if (Utils.isEmpty(edge.sourceId)) {
				throw new Error("Cannot remove an edge without a sourceId.");
			}
			if (Utils.isEmpty(edge.targetId)) {
				throw new Error("Cannot remove an edge without a targetId.");
			}
			return _.remove(this.#edges, (e) => e.sourceId === edge.sourceId && e.targetId === edge.targetId);
		} else {
			throw new Error("Don't know how to remove an edge from the given object.");
		}
	}

	/**
	 * Depth-first traversal starting at the specified node.
	 * @param visitor {(n: INodeBase, level: number,path:INodeBase[], hasChildren:boolean)=> void} A visiting function.
	 * @param startNode {INodeBase} The node to start the traversal from.
	 */
	dft(visitor, startNode) {
		if (_.isNil(startNode)) {
			throw new Error("No starting node specified for the traversal.");
		}
		const found = this.getNodeById(startNode.id);
		if (_.isNil(found)) {
			throw new Error("The starting node for the traversal is not part of the graph.");
		}
		const visitedIds = [];
		this.dftTraverse(startNode, visitor, visitedIds, 0);
	}

	/**
	 * Recursive DFT used by {@link dft}.
	 * @param node {INodeBase} The start of the DFT.
	 * @param visitor The visitor function.
	 * @param visitedIds {string[]} The id's already visited in order to prevent loops.
	 * @param level {number} The current depth.
	 * @param currentPath {INodeBase[]} The sequence of nodes used to reach the current node.
	 */
	dftTraverse(node, visitor, visitedIds, level = 0, currentPath = []) {
		if (_.includes(visitedIds, node.id)) {
			throw new Error("Graph contains loops, cannot perform a full traversal.");
		}
		const children = this.getChildren(node.id);
		currentPath.push(node);
		visitor(node, level, currentPath, children.length > 0);
		visitedIds.push(node.id);
		if (children.length > 0) {
			for (const child of children) {
				this.dftTraverse(child, visitor, visitedIds, level + 1, _.clone(currentPath));
			}
		}
	}
}

module.exports = Graph;
