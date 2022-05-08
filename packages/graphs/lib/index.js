const INodeBase = require("./iNodeBase");

const Graph = require("./graph");
const RandomGraph = require("./graphData/randomGraph");
const NamedGraph = require("./graphData/namedGraph");
const {PseudoCypherEdge, PseudoCypherNode, PseudoCypher, PseudoCypherTriple} = require("./formats/pseudoCypher");
const JsonGraph = require("./formats/jsonGraph");
const ArrowGraph = require("./formats/arrowGraph");


module.exports = {
    INodeBase,
    PseudoCypherEdge,
    PseudoCypherNode,
    PseudoCypher,
    PseudoCypherTriple,
    Graph,
    RandomGraph,
    NamedGraph,
    JsonGraph,
    ArrowGraph
};
