const GraphUtils = require("../lib/graphUtils");

describe("GraphUtils", function () {
    it("should interpret diverse things as an edge specification", function () {
        const getEdge = (...e) => {
            const found = GraphUtils.getEdgeFromSpecs(...e);
            return [found.sourceId.toString(), found.targetId.toString()];
        };
        expect(getEdge(1, 2)).toEqual(["1", "2"]);
        expect(getEdge("1->2")).toEqual(["1", "2"]);
        expect(getEdge({sourceId: 1, targetId: 2})).toEqual(["1", "2"]);
        expect(() => getEdge(12)).toThrow(Error);
        expect(() => getEdge("")).toThrow(Error);
        expect(() => getEdge(true)).toThrow(Error);
        expect(() => getEdge(() => 7)).toThrow(Error);
        expect(() => getEdge([1, 2, 3])).toThrow(Error);
        expect(() => getEdge("4->4->4")).toThrow(Error);
        expect(() => getEdge("4->")).toThrow(Error);
    });

    it("should interpret diverse things as a node specification", function () {
        expect(GraphUtils.getNodeFromSpecs(12)).toEqual({id: "12", typeName: "Unknown"});
        expect(GraphUtils.getNodeFromSpecs(12, "a")).toEqual({id: "12", name: "a", typeName: "Unknown"});
        expect(GraphUtils.getNodeFromSpecs({id: 3})).toEqual({id: "3", typeName: "Unknown"});
    });
});
