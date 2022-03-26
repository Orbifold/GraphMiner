const { Utils, Strings } = require("@graphminer/utils");
const Graph = require("./graph");

class NamedGraph {
	static complete(size = 10) {
		if (Utils.isEmpty(size)) {
			throw new Error(Strings.IsNil("size", "NamedGraph.complete"));
		}
		if (!Utils.isInteger(size)) {
			throw new Error(Strings.ShoudBeType("size", "number", "NamedGraph.complete"));
		}
		// would give more than 5000 edges
		if (size > 100) {
			throw new Error("The complete graph with more than 100 nodes is too large.");
		}
		const g = Graph.empty();
		for (let i = 0; i < size; i++) {
			for (let j = 0; j < size; j++) {
				if (i !== j) {
					g.addEdge(i, j);
				}
			}
		}
		return g;
	}
}

module.exports = NamedGraph;
