const _ = require("lodash");
const {PseudoCypherNode, PseudoCypherEdge} = require("./formats/pseudoCypher");

const INodeBase = require("./iNodeBase");
const {Utils, Strings} = require("@graphminer/Utils");
const TreeNode = require("./treeNode");
const Forest = require("./forest");
const GraphUtils = require("./graphUtils");
const {PseudoCypher} = require("./formats/pseudoCypher");
const {ArrowGraph} = require("./index");
const MatrixMarket = require("./formats/matrixMarket");

/**
 * Lightweight (directed, multi, labelled) graph structure with some graph analytic methods.
 * - A node is something with an id.
 * - An edge is something with a sourceId and a targetId.
 * - The API can be used on its own, the only GraphMiner twist is the usage of 'typeName' in some place in order to handle serialization and compatibility with the GraphMiner EntitySpace.
 */
class Graph {
    #groups = [];
    /**
     * Internal edge collection.
     * An edge is just a plain object with at least an id, a source and a target.
     * The label or name is optional and can be used to differentiate edges between the same nodes.
     * @type Array
     */
    #edges = [];
    /**
     * Internal node collection.
     * A node is just a plain object with at least an id, a name and a typeName.
     * @type Array
     */
    #nodes = [];
    /**
     * Optional name of this graph.
     * @type string|null
     */
    name = null;
    /**
     * Optional description of this graph.
     * @type null|string
     */
    description = null;

    /**
     * The unique id of this graph.
     * @type string
     */
    id;

    /**
     * Instantiates a new Graph.
     * @param data {any} The given data is simply assigned to the instance, no checks performed.
     */
    constructor(data = null) {
        this.id = Utils.id();
        this.#groups = [];
        this.#edges = [];
        this.#nodes = [];
        if (!_.isNil(data)) {
            if (_.isString(data)) {
                data = {name: data}
            }
            _.assign(this, data);
        }
    }

    /**
     * Equivalent to instantiating a new Graph.
     * @return {Graph}
     */
    static empty() {
        return new Graph();
    }

    /**
     * Returns 'Graph' as type name for this instance.
     */
    get typeName() {
        return "Graph";
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
     * Creates a graph from pseudo-cypher.
     * @param pseudoCypher {string} Some pseudo-cypher graph definition.
     * @param entityCreator? Optional function returning an entity for the given PseudoCypherNode. Falls back to {@link Graph.defaultEntityCreator} which relies on {@link GraphModels} for creating entities.
     * @param edgeCreator? Optional function returning an edge entity for the given PseudoCypherEdge. Falls back to {@link Graph.defaultLinkCreator} which relies on {@link GraphModels} for creating entities.
     */
    static fromPseudoCypher(pseudoCypher, entityCreator = null, edgeCreator = null) {
        const jsonGraph = PseudoCypher.parse(pseudoCypher, entityCreator, edgeCreator)
        return Graph.fromJSON(jsonGraph);
    }

    /**
     * Creates a graph from the given edge array.
     *
     * @example
     *
     * Graph.fromEdgeArray([[1,2],[2,3])
     * Graph.fromEdgeArray(["1->2",[2,3])
     * Graph.fromEdgeArray(["1->2",["2","3"])
     *
     * @param edges
     * @returns {Graph|null}
     */
    static fromEdgeArray(edges) {
        const g = Graph.empty();
        if (_.isNil(edges)) {
            return null;
        }
        if (_.isArray(edges)) {
            if (edges.length === 0) {
                return g;
            }
            for (const a of edges) {
                // can be various things
                g.addEdge(a);
            }
        }
        return g;
    }

    /**
     * @see https://en.wikipedia.org/wiki/Trivial_Graph_Format
     * @param data
     */
    static fromTrivial(data) {
        // todo: trivial format
        throw new Error(Strings.NotImplementedMethod());
    }

    /**
     * @see https://en.wikipedia.org/wiki/Graph_Modelling_Language
     * @param data
     */
    static fromGml(data) {
        // todo: GML format
        throw new Error(Strings.NotImplementedMethod());
    }

    /**
     * Imports a graph from an arrow definition.
     *
     * @example
     *
     * Graph.fromArrows("a->b->c")
     * Graph.fromArrows(`
     * a->e
     * e->e
     * `)
     * Graph.fromArrows(["a->b->c","c->b"])
     * @param input {string|string[]}
     * @see ArrowGraph
     */
    static fromArrows(input) {
        const jsonGraph = ArrowGraph.parse(input)
        return Graph.fromJSON(jsonGraph);
    }

    /**
     * Imports the Matrix Market format.
     * @see https://networkrepository.com/mtx-matrix-market-format.html
     * @param data {string|string[]}
     */
    static fromMtx(data) {
        const jsonGraph = MatrixMarket.parse(data)
        const g = Graph.fromJSON(jsonGraph)
        g.description = "MTX import";
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
            // the method ensure that the graph remains simple and missing nodes are added
            this.addEdge(e);
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
            nodes: this.#nodes,
            edges: this.#edges,
            groups: this.#groups,
            typeName: "Graph"
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

    getEdges(id) {
        return this.#edges.filter((e) => e.targetId === id || e.sourceId === id);
    }

    getNeighbors(id) {
        return this.getParents(id).concat(this.getChildren(id));
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

    getChildren(id) {
        if (!_.isString(id)) {
            id = id.id;
        }
        const coll = [];
        const node = this.getNodeById(id);
        if (_.isNil(node)) {
            return coll;
        }
        const edges = this.getOutgoingEdges(id);
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
     * @param nodeSpec {any} A INodeBase instance or some data which can be converted to it.
     */
    addNode(...nodeSpec) {
        const node = GraphUtils.getNodeFromSpecs(...nodeSpec);
        if (!this.nodeIdExists(node.id)) {
            this.#nodes.push(node);
        }
        return node;
    }

    /**
     * Adds an edge to the graph.
     *
     * @example
     *
     * addEdge("1->2")
     * addEdge(1,2)
     * addEdge("a", "b")
     * addEdge([1,2])
     *
     * @param edgeSpec {*} An edge specification.
     * @return {any}
     */
    addEdge(...edgeSpec) {
        const edge = GraphUtils.getEdgeFromSpecs(...edgeSpec);
        if (!this.nodeIdExists(edge.sourceId)) {
            this.addNode(edge.sourceId);
        }
        if (!this.nodeIdExists(edge.targetId)) {
            this.addNode(edge.targetId);
        }
        // ensure the graph remains simple
        if (!this.edgeExists(edge)) {
            if (Utils.isEmpty(edge.id)) {
                edge.id = Utils.id();
            }
            this.#edges.push(edge);
        }
        return edge;
    }

    addEdges(...edges) {
        const [count, args] = Utils.getArguments(edges);
        switch (count) {
            case 0:
                return;
            case 1:
                return this.addEdge(args[0]);
            default:
                args.forEach((u) => this.addEdge(u));
                return this;
        }
    }

    nodeIdExists(id) {
        return Utils.isDefined(this.getNodeById(id));
    }

    get hasLoops() {
        return _.filter(this.#edges, (u) => u.sourceId === u.targetId).length > 0;
    }

    edgeExists(...edgeSpec) {
        // if just an id is given
        if (edgeSpec.length === 1 && _.isString(edgeSpec[0])) {
            return _.filter(this.#edges, (e) => e.id === edgeSpec[0].toString().trim()).length > 0;
        }
        const edge = GraphUtils.getEdgeFromSpecs(...edgeSpec);
        let sourceId = edge.sourceId;
        let targetId = edge.targetId;
        if (Utils.isEmpty(sourceId)) {
            throw new Error(Strings.ShoudBeType("edgeExists", "string or number", "Graph.edgeExists"));
        }
        if (Utils.isEmpty(targetId)) {
            throw new Error(Strings.ShoudBeType("edgeExists", "string or number", "Graph.edgeExists"));
        }
        sourceId = sourceId.toString().trim();
        targetId = targetId.toString().trim();
        return _.findIndex(this.#edges, {sourceId, targetId}) > -1;
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
        const removals = _.remove(this.#nodes, {id: node.id});
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
        this.#dftTraverse(startNode, visitor, visitedIds, 0);
    }

    bft(visitor, startNode) {
        const found = this.getNodeById(startNode.id);
        if (_.isNil(found)) {
            throw new Error("The starting node for the traversal is not part of the graph.");
        }
        const queue = [startNode];
        while (queue.length) {
            const currNode = queue.shift();
            visitor(currNode);
            const children = this.getChildren(currNode.id);
            queue.push(...children);
        }
    }

    /**
     * Recursive DFT used by {@link dft}.
     * @param node {INodeBase} The start of the DFT.
     * @param visitor The visitor function.
     * @param visitedIds {string[]} The id's already visited in order to prevent loops.
     * @param level {number} The current depth.
     * @param currentPath {INodeBase[]} The sequence of nodes used to reach the current node.
     */
    #dftTraverse(node, visitor, visitedIds, level = 0, currentPath = []) {
        if (_.includes(visitedIds, node.id)) {
            throw new Error("Graph contains loops, cannot perform a full traversal.");
        }
        const children = this.getChildren(node.id);
        currentPath.push(node);
        visitor(node, level, currentPath, children.length > 0);
        visitedIds.push(node.id);
        if (children.length > 0) {
            for (const child of children) {
                this.#dftTraverse(child, visitor, visitedIds, level + 1, _.clone(currentPath));
            }
        }
    }

    /**
     * This will return the shortest cycle, if any.
     * @returns {string[]|null}
     */
    getCycle() {
        // Copy the graph, converting all node references to String
        const adj = this.toAdjacencyList();

        let queue = Object.keys(adj).map((node) => [node]);
        while (queue.length) {
            const batch = [];
            for (const path of queue) {
                const parents = adj[path[0]] || [];
                for (const node of parents) {
                    if (node === path[path.length - 1]) return [node, ...path];
                    batch.push([node, ...path]);
                }
            }
            queue = batch;
        }
        return null;
    }

    get hasCycles() {
        return !_.isNil(this.getCycle());
    }

    get isAcyclic() {
        return !this.hasCycles;
    }

    /**
     * Returns the adjacency list of this graph.
     * @returns {{}}
     */
    toAdjacencyList() {
        const adj = {};
        for (const node of this.#nodes) {
            adj[node.id] = [];
        }
        for (const edge of this.#edges) {
            if (adj[edge.sourceId]) {
                adj[edge.sourceId].push(edge.targetId);
            } else {
                adj[edge.sourceId] = [edge.targetId];
            }
        }
        return adj;
    }

    /**
     * Returns a dictionary with for each node id its degree.
     * @returns {{}}
     */
    getDegrees() {
        const dic = {};
        // all nodes initially with degree zero
        this.#nodes.forEach((n) => (dic[n.id] = 0));
        this.#edges.forEach((e) => {
            dic[e.sourceId] += 1;
            dic[e.targetId] += 1;
        });
        return dic;
    }

    /**
     * Returns the degree of the specified node in the graph.
     * @param n {string|*} A node id or node.
     * @returns {number}
     */
    getDegree(n) {
        if (Utils.isUndefined(n)) {
            throw new Error(Strings.IsNil("n", "Graph.getDegree"));
        }

        const degrees = this.getDegrees();
        if (_.isString(n)) {
            return degrees[n]
        } else {
            return degrees[n.id];
        }
    }

    /**
     * Returns the maximum degree in this graph.
     * @returns {number}
     */
    get maxDegree() {
        return _.max(_.values(this.getDegrees()));
    }

    /**
     * Returns the minimum degree in this graph.
     * @returns {number}
     */
    get minDegree() {
        return _.min(_.values(this.getDegrees()));
    }

    /**
     * Returns an array representing the histogram of degrees.
     * @param bins {number} The amount of bins in the histogram.
     * @returns {[*]|any[]}
     */
    degreeHistogram(bins = 10) {
        const dg = this.getDegrees();

        const data = _.values(dg);
        return Utils.histogram(data, bins);
    }

    /**
     * Returns the component of the given id in the shape of node ids.
     * If the id is not in the graph an empty array is returned.
     * @param id {string} A node id.
     * @returns {*[]}
     */
    getComponentOf(id) {
        const component = [];
        if (!this.nodeIdExists(id)) {
            return component;
        }
        const queue = [id];
        const visited = new Set();

        while (queue.length > 0) {
            const current = queue.pop();

            if (!visited.has(current)) {
                component.push(current);
                visited.add(current);
                const neighbors = this.getNeighbors(current).map((n) => n.id);
                for (let neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        queue.push(neighbor);
                    }
                }
            }
        }

        return component;
    }

    /**
     * Returns the weakly connected components of this graph.
     * @returns {*[]} An array of arrays, each representing the id's of a component.
     */
    getComponents() {
        const all = this.nodes.map((n) => n.id);
        const components = [];
        while (all.length > 0) {
            const id = all.pop();
            const component = this.getComponentOf(id);
            components.push(component);
            _.pull(all, ...component);
        }
        return components;
    }
}

module.exports = Graph;
