const ArrowGraph = require("../lib/formats/arrowGraph");
const {JsonGraph} = require("../lib");
describe("ArrowGraph", function () {
    it("should parse", function () {

        let g = ArrowGraph.parse("a->b")
        expect(g.nodes.length).toEqual(2)
        expect(JsonGraph.nodeIdExists(g, "a")).toBeTruthy()
        expect(JsonGraph.nodeIdExists(g, "b")).toBeTruthy()

        g = ArrowGraph.parse("a->b->c")
        expect(g.nodes.length).toEqual(3)
        expect(g.edges.length).toEqual(2)
        expect(JsonGraph.nodeIdExists(g, "a")).toBeTruthy()
        expect(JsonGraph.nodeIdExists(g, "b")).toBeTruthy()
    });

});
