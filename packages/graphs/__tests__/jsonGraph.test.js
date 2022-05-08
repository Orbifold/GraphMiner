const JsonGraph = require("../lib/formats/jsonGraph");
const _ = require("lodash");


describe("JsonGraph", function () {
    it("should merge JSON graphs", function () {
        const g = {
            nodes: [{id: "a"}, {id: "b"}], edges: [{sourceId: "a", targetId: "b"}]
        }
        const h1 = {
            nodes: [{id: "b"}, {id: "c"}], edges: [{sourceId: "b", targetId: "c"}]
        }
        const h2 = {
            nodes: [{id: "a"}, {id: "b"}], edges: [{sourceId: "a", targetId: "b", name: "K"}]
        }
        let m = JsonGraph.mergeJsonGraphs(g, h1)
        expect(m.nodes.length).toEqual(3)
        expect(m.edges.length).toEqual(2)

        m = JsonGraph.mergeJsonGraphs(g, h2)
        expect(m.nodes.length).toEqual(2)
        expect(m.edges.length).toEqual(2)
        // console.log(JSON.stringify(m))

    });
});
