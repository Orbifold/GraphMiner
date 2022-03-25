const { Utils, Strings } = require("@graphminer/utils");

const Graph = require("../lib/graph");
const TripleNode = require("../lib/tripleNode");
const TripleEdge = require("../lib/tripleEdge");
const Tree = require("../lib/tree");
const GraphTriple = require("../lib/graphTriple");

// file.only
describe("Graphs", function () {
	it("should do the basics", function () {
		const g = new Graph();

		const n1 = g.addNode({ typeName: "Thought" });
		expect(g.idExists(n1.id)).toBeTruthy();
		expect(g.nodeCount).toEqual(1);
		const thoughts = g.getByTypeName("Thought");
		expect(thoughts.length).toEqual(1);

		// has to be a NodeBase something
		expect(() => g.addNode({})).toThrow(Error);

		expect(() => g.addEdge(12)).toThrow(Error);
		expect(() => g.addEdge({})).toThrow(Error);
		expect(() => g.addEdge({ x: 34 })).toThrow(Error);
		expect(() => g.addEdge({ typeName: "Thought" })).toThrow(Error);
		expect(() => g.addEdge({ sourceId: 12, targetId: 44 })).toThrow(Error);
		expect(() => g.addEdge({ sourceId: 12, targetId: n1.id })).toThrow(Error);

		const n2 = g.addNode({ typeName: "Thought" });
		expect(() => g.addEdge({ typeName: "GenericLink", sourceId: n2.id, targetId: n1.id })).not.toThrow(Error);
		expect(g.edgeCount).toEqual(1);
		expect(g.edges[0].sourceId).toEqual(n2.id);
		expect(g.getByTypeName("GenericLink").length).toEqual(1);

		const removals = g.removeNode(n2.id);
		expect(removals.length).toEqual(1);
		expect(removals[0].id).toEqual(n2.id);
		expect(g.edgeCount).toEqual(0);

		expect(() => g.removeNode({})).toThrow(Error);
		expect(() => g.removeNode(null)).toThrow(Error);
		expect(() => g.removeNode(6546)).toThrow(Error);
		expect(() => g.removeNode({ typeName: "" })).toThrow(Error);
	});

	it("should parse a TripleNode", function () {
		let node = TripleNode.parse("h1");
		expect(node).not.toBeNull();
		expect(node.name).toEqual("h1");
		expect(node.type).toBeNull();
		expect(node.data).toBeNull();

		node = TripleNode.parse("h14:A");
		expect(node).not.toBeNull();
		expect(node.name).toEqual("h14");
		expect(node.type).toEqual("A");
		expect(node.data).toBeNull();

		expect(TripleNode.parse("")).toBeNull();
		expect(TripleNode.parse(null)).toBeNull();
		expect(TripleNode.parse("123a")).toBeNull();

		node = TripleNode.parse("h14:A{x:12}");
		expect(node).not.toBeNull();
		expect(node.name).toEqual("h14");
		expect(node.type).toEqual("A");
		expect(node.data).toEqual({ x: 12 });

		node = TripleNode.parse("cat{x:13}");
		expect(node).not.toBeNull();
		expect(node.name).toEqual("cat");
		expect(node.type).toBeNull();
		expect(node.data).toEqual({ x: 13 });

		node = TripleNode.parse(":Dog");
		expect(node).not.toBeNull();
		expect(node.name).toBeNull();
		expect(node.type).toEqual("Dog");
		expect(node.data).toEqual(null);

		node = TripleNode.parse(':Dog{color:"red"}');
		expect(node).not.toBeNull();
		expect(node.name).toBeNull();
		expect(node.type).toEqual("Dog");
		expect(node.data).toEqual({ color: "red" });

		node = TripleNode.parse("p:Process{u:[1,2], v:'t' }");
		expect(node.toCypher()).toEqual("(p:Process{u: [1, 2], v: 't'})");

		node.toCypher();
	});

	it("should parse a TripleEdge", function () {
		let edge = TripleEdge.parse("h1");
		expect(edge).not.toBeNull();
		expect(edge.name).toEqual("h1");
		expect(edge.type).toBeNull();
		expect(edge.data).toBeNull();

		edge = TripleEdge.parse("h14:A");
		expect(edge).not.toBeNull();
		expect(edge.name).toEqual("h14");
		expect(edge.type).toEqual("A");
		expect(edge.data).toBeNull();

		expect(TripleEdge.parse("")).toBeNull();
		expect(TripleEdge.parse(null)).toBeNull();
		expect(TripleEdge.parse("123a")).toBeNull();

		edge = TripleEdge.parse("h14:A{x:12}");
		expect(edge).not.toBeNull();
		expect(edge.name).toEqual("h14");
		expect(edge.type).toEqual("A");
		expect(edge.data).toEqual({ x: 12 });

		edge = TripleEdge.parse("cat{x:13}");
		expect(edge).not.toBeNull();
		expect(edge.name).toEqual("cat");
		expect(edge.type).toBeNull();
		expect(edge.data).toEqual({ x: 13 });

		edge = TripleEdge.parse("[:Dog]");
		expect(edge).not.toBeNull();
		expect(edge.name).toBeNull();
		expect(edge.type).toEqual("Dog");
		expect(edge.data).toEqual(null);

		edge = TripleEdge.parse('[:Dog{color:"red"}]');
		expect(edge).not.toBeNull();
		expect(edge.name).toBeNull();
		expect(edge.type).toEqual("Dog");
		expect(edge.data).toEqual({ color: "red" });

		edge = TripleEdge.parse("p:Process{u:[1,2], v:'t' }");
		expect(edge.toCypher()).toEqual("[p:Process{u: [1, 2], v: 't'}]");

		edge.toCypher(); //?
	});

	it("should parse a GraphTriple", function () {
		let triple = new GraphTriple("A", "B");
		expect(triple.edge).toEqual(null);
		expect(triple.source.name).toEqual("A");
		expect(triple.target.name).toEqual("B");

		triple = new GraphTriple("J");
		expect(triple.edge || null).toEqual(null);
		expect(triple.source.name).toEqual("J");
		expect(triple.target || null).toEqual(null);
		expect(triple.toCypher()).toEqual("(J)");

		triple = new GraphTriple("A", "d", "B");
		expect(triple.edge.name).toEqual("d");
		expect(triple.source.name).toEqual("A");
		expect(triple.target.name).toEqual("B");
		expect(triple.toCypher()).toEqual("(A)-[d]->(B)");

		triple = new GraphTriple("A", "d{k:34}", "B:Person");
		expect(triple.edge.name).toEqual("d");
		expect(triple.edge.data.k).toEqual(34);
		expect(triple.source.name).toEqual("A");
		expect(triple.target.name).toEqual("B");
		expect(triple.target.type).toEqual("Person");
		expect(triple.toCypher()).toEqual("(A)-[d{k: 34}]->(B:Person)");

		triple = GraphTriple.parse("A");
		expect(triple).not.toBeNull();
		expect(triple.source.name).toEqual("A");
		expect(triple.edge).toEqual(null);
		expect(triple.target || null).toEqual(null);

		triple = GraphTriple.parse("(A)-->(B)");
		expect(triple).not.toBeNull();
		expect(triple.source.name).toEqual("A");
		expect(triple.edge || null).toEqual(null);
		expect(triple.target.name).toEqual("B");

		triple = GraphTriple.parse("(A)-[:Thing]->(B)");
		expect(triple).not.toBeNull();
		expect(triple.source.name).toEqual("A");
		expect(triple.edge.type).toEqual("Thing");
		expect(triple.edge.name).toEqual(null);
		expect(triple.target.name).toEqual("B");
		expect(triple.toCypher()).toEqual("(A)-[:Thing]->(B)");
	});

	it("should create graphs from pseudo-cypher definitions", function () {
		let g = Graph.fromPseudoCypher("T");
		expect(g.nodeCount).toEqual(1);
		expect(g.nodes[0]["name"]).toEqual("T");
		expect(g.nodes[0]["typeName"] || null).not.toBeNull();

		// we can create loops
		g = Graph.fromPseudoCypher("(T)-->(T)");
		// there are two because the id not the same on generation
		expect(g.nodeCount).toEqual(2);
		expect(g.edgeCount).toEqual(1);
		expect(g.edges[0]["typeName"]).toEqual("ObjectProperty");
		expect(g.nodes[0]["name"]).toEqual("T");

		g = Graph.fromPseudoCypher("(T{id:1})-->(T{id:1})");
		// now we have a loop
		expect(g.nodeCount).toEqual(1);
		expect(g.edgeCount).toEqual(1);
		expect(g.edges[0]["typeName"]).toEqual("ObjectProperty");
		expect(g.nodes[0]["name"]).toEqual("T");

		g = Graph.fromPseudoCypher("(T1)-->(T2)-->(T3)");
		expect(g.nodeCount).toEqual(3);
		expect(g.edgeCount).toEqual(2);
		expect(g.edges[0]["typeName"]).toEqual("ObjectProperty");
		expect(g.nodes[0]["name"]).toEqual("T1");

		g = Graph.fromPseudoCypher("(T1{id:1})-->(T2)-->(T1{id:1})");
		expect(g.nodeCount).toEqual(2);
		expect(g.edgeCount).toEqual(2);
		expect(g.edges[0]["typeName"]).toEqual("ObjectProperty");
		expect(g.nodes[0]["name"]).toEqual("T1");

		g = Graph.fromPseudoCypher("(p:ProcessTask{duration: 33.2, name:'a'})");
		let node = g.getNodeByName("a");
		expect(node || null).not.toBeNull();
		expect(node["typeName"]).toEqual("ProcessTask");
		expect(node["duration"]).toEqual(33.2);

		g = Graph.fromPseudoCypher("(p{duration: 33.2, name:'a'})");
		node = g.getNodeByName("a");
		expect(node).not.toBeNull();
		expect(node["duration"]).not.toBeUndefined();
	});

	it("should turn an entity into pseudo-cypher", function () {
		const task = {
			typeName: "ProcessTask",
			id: 12,
			name: "T1",
		};
		expect(TripleNode.entityToCypher(task)).toEqual("(T1:ProcessTask{typeName: 'ProcessTask', id: 12, name: 'T1'})");
		const link = {
			typeName: "MyLink",
			x: 45,
			name: "c",
		};
		expect(TripleEdge.entityToCypher(link)).toEqual("[c:MyLink{typeName: 'MyLink', x: 45, name: 'c'}]");
	});

	it("should get the flows", function () {
		let g = Graph.fromPseudoCypher(`
			(T1)-->(T2{id:2})-->(T3)
			(T2{id:2})-->(T4)
		`);
		expect(g.nodeCount).toEqual(4);
		expect(g.edgeCount).toEqual(3);

		let coll = [];
		let paths = [];
		const getName = (n, level, path, hasChildren) => {
			coll.push(n["name"]);
			if (!hasChildren) {
				paths.push(path);
			}
		};
		let t1 = g.getNodeByName("T1");
		g.dft(getName, t1);
		expect(coll).toEqual(["T1", "T2", "T3", "T4"]);
		expect(paths.length).toEqual(2);
		// should be the same as the getFlows method
		paths = g.getFlows(t1).map((p) => p.map((u) => u.name));
		expect(paths).toEqual([
			["T1", "T2", "T3"],
			["T1", "T2", "T4"],
		]);
		// graph with cycle
		g = Graph.fromPseudoCypher(`
			(T1{id:1})-->(T2)-->(T3{id:3})
			(T3{id:3})-->(T1{id:1})
		`);
		t1 = g.getNodeByName("T1");
		expect(() => g.getFlows(t1)).toThrow(Error);
	});

	it("should parse complex structures", function () {
		let g = Graph.fromPseudoCypher(`		
            (T1:ProcessTask{id: 'T1', typeName: 'ProcessTask', effectiveWorkTime: 80, name: 'T1', startTime: '05/01/21', duration: 3})-[SL1:SolutionArtifactLink{name: 'SL1', typeName: 'SolutionArtifactLink', id: 'SL1', solutionDuration: 2.2, solutionWorkTime: 5.5}]->(T2:ProcessTask{id: 'T2', typeName: 'ProcessTask', name: 'T2', effectiveWorkTime: 71, startTime: '05/10/21', duration: 4})-->(T3:ProcessTask{id: 'T3', typeName: 'ProcessTask', name: 'T3', effectiveWorkTime: 6, startTime: '05/15/21', duration: 7})
		`);
		expect(g.nodeCount).toEqual(3);
		expect(g.edgeCount).toEqual(2);
		const t1 = g.getNodeByName("T1");
		const t2 = g.getNodeByName("T2");
		const t3 = g.getNodeByName("T3");
		const sl1 = g.getEdgeById("SL1");
		console.log(g.edges);
		expect(t1["effectiveWorkTime"]).toEqual(80);
		expect(t3["startTime"]).toEqual("05/15/21");
		// expect(sl1["solutionDuration"]).toEqual(2.2);
	});

	it("should use the custom creators", function () {
		const nCreator = (u) => {
			return {
				id: Utils.id(),
				typeName: "Artifact",
				name: u.name || Utils.randomLetter(),
				parentId: null,
			};
		};
		const eCreator = (u) => {
			return {
				id: Utils.id(),
				typeName: "ProcessLink",
				sourceId: null,
				targetId: null,
			};
		};
		const g = Graph.fromPseudoCypher("(a)-->(b)", nCreator, eCreator);
		expect(g.nodes.length).toEqual(2);
		expect(g.edges.length).toEqual(1);
		expect(g.nodes[0]["typeName"]).toEqual("Artifact");
		expect(g.edges[0]["typeName"]).toEqual("ProcessLink");
	});

	it("should convert a plain object to a cypher-like object", function () {
		let stuff = { a: 34, b: 23 };
		const c = GraphTriple.toCypherData(stuff);
		expect(c).toEqual("{a: 34, b: 23}");

		let e = { id: 1, name: "red", typeName: "A" };
		let s = TripleNode.entityToCypher(e);
		expect(s).toEqual("(red:A{id: 1, name: 'red', typeName: 'A'})");
		s = TripleNode.entityToCypher(e, "");
		expect(s).toEqual("(:A{id: 1, name: 'red', typeName: 'A'})");
		s = TripleNode.entityToCypher(e, "v");
		expect(s).toEqual("(v:A{id: 1, name: 'red', typeName: 'A'})");
	});
	it("should ", function () {
		const t = TripleNode.parse("(p:ProcessTask{duration: 33.2, name:'a'})");
		console.log(t);
		console.log(t.toEntity());
	});
});
