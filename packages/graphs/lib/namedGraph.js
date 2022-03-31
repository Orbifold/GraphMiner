const { Utils, Strings } = require("@graphminer/utils");
const Graph = require("./graph");

/*
 * Various named graphs.
 * The data is an export of NetworkX and the code to turn any NetworkX graph into a format digestible by GraphMiner is as follows:
 *
 * import networkx as nx
 * G = nx.karate_club_graph()
 * raw = nx.node_link_data(G)
 * nodes = [n["id"] for n in raw["nodes"]]
 * edges = [[e["source"], e["target"]] for e in raw["links"]]
 * print(nodes)
 * print(edges)
 * */
class NamedGraph {
	/**
	 * Returns the complete graph (K_n) of the specified size.
	 * @param [size=10] {number} The size of the graph
	 * @returns {Graph}
	 */
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

	/**
	 * Returns a path graph.
	 * @param [size=10] The size of the path.
	 * @returns {Graph}
	 */
	static path(size = 10) {
		if (Utils.isEmpty(size)) {
			throw new Error(Strings.IsNil("size", "NamedGraph.complete"));
		}
		if (!Utils.isInteger(size)) {
			throw new Error(Strings.ShoudBeType("size", "number", "NamedGraph.complete"));
		}
		// would give more than 5000 edges
		if (size > 1000) {
			throw new Error("The chain with more than 1000 nodes is too large.");
		}
		const g = Graph.empty();
		if (size === 0) {
			return g;
		}
		if (size === 1) {
			g.addNode("1");
			return g;
		}
		for (let i = 0; i < size - 1; i++) {
			g.addEdge(i, i + 1);
		}
		return g;
	}

	/**
	 * Zachary's karate club is a social network of a university karate club, described in the paper
	 * *"An Information Flow Model for Conflict and Fission in Small Groups"* by Wayne W. Zachary.
	 * @see https://en.wikipedia.org/wiki/Zachary%27s_karate_club
	 */
	static karateClub() {
		const nodes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33];
		const edges = [
			[0, 1],
			[0, 2],
			[0, 3],
			[0, 4],
			[0, 5],
			[0, 6],
			[0, 7],
			[0, 8],
			[0, 10],
			[0, 11],
			[0, 12],
			[0, 13],
			[0, 17],
			[0, 19],
			[0, 21],
			[0, 31],
			[1, 2],
			[1, 3],
			[1, 7],
			[1, 13],
			[1, 17],
			[1, 19],
			[1, 21],
			[1, 30],
			[2, 3],
			[2, 7],
			[2, 8],
			[2, 9],
			[2, 13],
			[2, 27],
			[2, 28],
			[2, 32],
			[3, 7],
			[3, 12],
			[3, 13],
			[4, 6],
			[4, 10],
			[5, 6],
			[5, 10],
			[5, 16],
			[6, 16],
			[8, 30],
			[8, 32],
			[8, 33],
			[9, 33],
			[13, 33],
			[14, 32],
			[14, 33],
			[15, 32],
			[15, 33],
			[18, 32],
			[18, 33],
			[19, 33],
			[20, 32],
			[20, 33],
			[22, 32],
			[22, 33],
			[23, 25],
			[23, 27],
			[23, 29],
			[23, 32],
			[23, 33],
			[24, 25],
			[24, 27],
			[24, 31],
			[25, 31],
			[26, 29],
			[26, 33],
			[27, 33],
			[28, 31],
			[28, 33],
			[29, 32],
			[29, 33],
			[30, 32],
			[30, 33],
			[31, 32],
			[31, 33],
			[32, 33],
		];
		return NamedGraph.createGraphFrom(nodes, edges);
	}

	static singletons(size) {
		const g = Graph.empty();
		_.range(size).forEach((i) => g.addNode(i));
		return g;
	}

	static createGraphFrom(nodes, edges) {
		const g = Graph.empty();
		nodes.forEach((i) => g.addNode(i.toString(), i.toString()));
		edges.forEach((e) => g.addEdge(e));
		return g;
	}
}

module.exports = NamedGraph;
