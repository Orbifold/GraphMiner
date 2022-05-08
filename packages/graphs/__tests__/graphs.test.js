const {Utils, Strings} = require("@graphminer/utils");
const _ = require("lodash");
const Graph = require("../lib/graph");
const Tree = require("../lib/tree");
const GraphUtils = require("../lib/graphUtils");
const {NamedGraph} = require("../lib");


describe("Graphs", function () {
    it("should do the basics", function () {
        const g = new Graph();

        const n1 = g.addNode({typeName: "Thought"});
        expect(g.idExists(n1.id)).toBeTruthy();
        expect(g.nodeCount).toEqual(1);
        const thoughts = g.getByTypeName("Thought");
        expect(thoughts.length).toEqual(1);

        // has to be a NodeBase something
        expect(() => g.addNode({})).toThrow(Error);

        expect(() => g.addEdge(12)).toThrow(Error);
        expect(() => g.addEdge({})).toThrow(Error);
        expect(() => g.addEdge({x: 34})).toThrow(Error);
        expect(() => g.addEdge({typeName: "Thought"})).toThrow(Error);
        // expect(() => g.addEdge({sourceId: 12, targetId: 44})).toThrow(Error);
        // expect(() => g.addEdge({sourceId: 12, targetId: n1.id})).toThrow(Error);

        const n2 = g.addNode({typeName: "Thought"});
        expect(() => g.addEdge({typeName: GraphUtils.GenericLinkTypeName, sourceId: n2.id, targetId: n1.id})).not.toThrow(Error);
        expect(g.edgeCount).toEqual(1);
        expect(g.edges[0].sourceId).toEqual(n2.id);
        expect(g.getByTypeName(GraphUtils.GenericLinkTypeName).length).toEqual(1);

        const removals = g.removeNode(n2.id);
        expect(removals.length).toEqual(1);
        expect(removals[0].id).toEqual(n2.id);
        expect(g.edgeCount).toEqual(0);

        expect(() => g.removeNode({})).toThrow(Error);
        expect(() => g.removeNode(null)).toThrow(Error);
        expect(() => g.removeNode(6546)).toThrow(Error);
        expect(() => g.removeNode({typeName: ""})).toThrow(Error);
    });

    it("should add nodes via pseudo-cypher", function () {
        const g = new Graph();
        const a = g.addNode("(a)")
        const b = g.addNode("(b:{name:'Stan'})")
        g.addEdge("a", "b")
        expect(g.getNodeByName("Stan").id).toEqual(b.id)
        expect(g.getNodeByName("a").id).toEqual(a.id)

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
        expect(g.edges[0]["typeName"]).toEqual(GraphUtils.GenericLinkTypeName);
        expect(g.nodes[0]["name"]).toEqual("T");

        g = Graph.fromPseudoCypher("(T{id:1})-->(T{id:1})");
        // now we have a loop
        expect(g.nodeCount).toEqual(1);
        expect(g.edgeCount).toEqual(1);
        expect(g.edges[0]["typeName"]).toEqual(GraphUtils.GenericLinkTypeName);
        expect(g.nodes[0]["name"]).toEqual("T");

        g = Graph.fromPseudoCypher("(T1)-->(T2)-->(T3)");
        expect(g.nodeCount).toEqual(3);
        expect(g.edgeCount).toEqual(2);
        expect(g.edges[0]["typeName"]).toEqual(GraphUtils.GenericLinkTypeName);
        expect(g.nodes[0]["name"]).toEqual("T1");

        g = Graph.fromPseudoCypher("(T1{id:1})-->(T2)-->(T1{id:1})");
        expect(g.nodeCount).toEqual(2);
        expect(g.edgeCount).toEqual(2);
        expect(g.edges[0]["typeName"]).toEqual(GraphUtils.GenericLinkTypeName);
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
        expect(t1["effectiveWorkTime"]).toEqual(80);
        expect(t3["startTime"]).toEqual("05/15/21");
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

    it("should import the arrows format", function () {
        let g = Graph.fromArrows("a->b");
        expect(g.nodes.length).toEqual(2);
        expect(g.edges.length).toEqual(1);
        expect(g.nodes[0].id).toEqual("a");
        expect(g.nodes[1].id).toEqual("b");

        g = Graph.fromArrows(["a->b", ""]);
        expect(g.nodes.length).toEqual(2);
        expect(g.edges.length).toEqual(1);
        expect(g.nodes[0].id).toEqual("a");
        expect(g.nodes[1].id).toEqual("b");
    });

    it("should keep the graph simple", function () {
        // a simple graph does not have multiple edges between two nodes,
        // adding multiple times the same edge does not raise an error
        let g = Graph.fromArrows("a->a->a");
        expect(g.edges.length).toEqual(1);
        expect(g.nodes.length).toEqual(1);
        expect(g.hasLoops).toBeTruthy();
        expect(g.edgeExists("a", "a")).toBeTruthy();

        g = Graph.fromArrows(["a->b", "a->b"]);
        expect(g.edges.length).toEqual(1);
        expect(g.nodes.length).toEqual(2);
        expect(g.edgeExists("a", "b")).toBeTruthy();
        expect(g.edgeExists("a", "c")).not.toBeTruthy();
        expect(g.edgeExists("a", "a")).not.toBeTruthy();
        expect(g.hasLoops).toBeFalsy();
    });

    it("should get the adjacency list", function () {
        let g = Graph.fromArrows(["a->b", "b->a"]);
        let adj = g.toAdjacencyList();
        expect(adj).toEqual({a: ["b"], b: ["a"]});

        g = Graph.fromArrows(["a->b", "b->a", "b->c", "d"]);
        adj = g.toAdjacencyList();
        expect(adj).toEqual({a: ["b"], b: ["a", "c"], c: [], d: []});
    });

    it("should get cycles", function () {
        let g = Graph.fromArrows(["a->b->c->a", "d->d"]);
        expect(g.getCycle()).toEqual(["d", "d"]);
        expect(g.hasCycles).toBeTruthy();
        expect(g.isAcyclic).toBeFalsy();

        g = Graph.fromArrows(["a->b->c"]);
        expect(g.getCycle()).toBeNull();
        expect(g.hasCycles).toBeFalsy();
        expect(g.isAcyclic).toBeTruthy();
    });

    it("should import mtx", function () {
        const data = `
		%MatrixMarket and so on
		2 4 5
		1 2
		2 3
		3 4
		`;
        const g = Graph.fromMtx(data);
        expect(g.nodes.length).toEqual(4);
        expect(g.edges.length).toEqual(3);
        expect(() => {
            Graph.fromMtx("something");
        }).toThrow(Error);
    });

    it("should get degrees", function () {
        let g = Graph.fromArrows(`
		1->1
		1->2
		2->2
		`);
        expect(g.getDegrees()).toEqual({1: 3, 2: 3});

        g = Graph.fromArrows(`
		1->2
		1->2
		2->3
		`);
        expect(g.getDegrees()).toEqual({1: 1, 2: 2, 3: 1});

        g = Graph.fromArrows(`
		1->2
		1->3
		1->4
		1->5
		`);
        expect(g.getDegrees()).toEqual({1: 4, 2: 1, 3: 1, 4: 1, 5: 1});
    });

    it("should get the component of a node", function () {
        let g = Graph.fromArrows(`
		1->2->3->4
		5->6
		`);
        let c = g.getComponentOf("2");
        expect(c.map((u) => parseInt(u)).sort()).toEqual([1, 2, 3, 4]);

        c = g.getComponentOf("6");
        expect(c.map((u) => parseInt(u)).sort()).toEqual([5, 6]);

        // cycles and all
        g = Graph.fromArrows(`
		1->2->3->4->2
		5->6
		`);
        c = g.getComponentOf("2");
        expect(c.map((u) => parseInt(u)).sort()).toEqual([1, 2, 3, 4]);

        c = g.getComponentOf("6");
        expect(c.map((u) => parseInt(u)).sort()).toEqual([5, 6]);

        c = g.getComponentOf("36");
        expect(Utils.isEmpty(c)).toBeTruthy();
    });

    it("should do a dft", function () {
        let g = Graph.fromArrows(`
		1->2->4
		2->3->5
		`);
        const acc = [];
        const visitor = (n) => {
            acc.push(parseInt(n.id));
        };
        g.dft(visitor, g.getNodeById("1"));
        expect(acc.length).toEqual(5);
        expect(acc).toEqual([1, 2, 4, 3, 5]);
        // clear the acc
        acc.length = 0;
        g.bft(visitor, g.getNodeById("1"));
        expect(acc.length).toEqual(5);
        expect(acc).toEqual([1, 2, 4, 3, 5]);
    });

    it("should get components", function () {
        let g = Graph.fromArrows(`
		1->2
		3
		4->5
		`);
        let cs = g.getComponents();
        expect(cs.length).toEqual(3);
        g = Graph.fromArrows(`
		1->2->3->4
		2->5->3
		`);
        cs = g.getComponents();
        expect(cs.length).toEqual(1);
    });

    it("should fetch the karate club", function () {

        const g = NamedGraph.karateClub();
        expect(g.edges.length).toEqual(78);
        expect(g.nodes.length).toEqual(34);
    });

    it("should test for equality", function () {
        expect(GraphUtils.areEqual("a", "a")).toBeTruthy()
        expect(GraphUtils.areEqual("a", "b")).not.toBeTruthy()
        expect(GraphUtils.areEqual("a", 12)).not.toBeTruthy()
        expect(GraphUtils.areEqual(12, 12)).toBeTruthy()
        expect(GraphUtils.areEqual(12, false)).not.toBeTruthy()
        expect(GraphUtils.areEqual(false, false)).toBeTruthy()
        // not something areEqual understands as a node, edge or graph
        expect(GraphUtils.areEqual({x: 12}, {x: 12})).not.toBeTruthy()
        // interpreted as graphs or nodes
        expect(GraphUtils.areEqual({id: 12}, {id: 12})).toBeTruthy()
        // only the id is used
        expect(GraphUtils.areEqual({id: 12, name: "a"}, {id: 12, name: "b"})).toBeTruthy()
        expect(GraphUtils.areEqual({id: 11}, {id: 12})).not.toBeTruthy()

        expect(GraphUtils.areEqual({sourceId: 1, targetId: 2}, {sourceId: 1, targetId: 2})).toBeTruthy()
        expect(GraphUtils.areEqual({sourceId: 1, targetId: 2}, {sourceId: 1, targetId: 3})).not.toBeTruthy()
        expect(GraphUtils.areEqual({sourceId: 1, targetId: 2, name: "a"}, {sourceId: 1, targetId: 2})).not.toBeTruthy()
        // the label is not case-sensitive
        expect(GraphUtils.areEqual({sourceId: 1, targetId: 2, name: "a"}, {sourceId: 1, targetId: 2, name: "A"})).toBeTruthy()

        let g1 = new Graph();
        let g2 = g1;
        expect(GraphUtils.areEqual(g1, g2)).toBeTruthy()
        g2 = g1.clone();
        // clone generates a new id
        expect(GraphUtils.areEqual(g1, g2)).not.toBeTruthy()

    });
});
