const {Utils, Strings} = require("@graphminer/utils");
const Graph = require("../graph");
const _ = require("lodash");

/*
 * Diverse random graph algorithms.
 * */
class RandomGraph {
    /**
     * Defines the way the algorithms create a node for a given index.
     * @param i {number} The index of the node.
     * @returns {{name: string, id: string}}
     */
    static nodeCreator = (i) => {
        return {id: i.toString(), name: i.toString(), typeName: "Unknown"};
    };

    /**
     * Defines the way the algorithms create an edge for a given edge.
     * @param i {number} Source index.
     * @param j {number} Target index.
     * @returns {{sourceId: string, targetId: string}}
     */
    static edgeCreator = (i, j) => {
        return {sourceId: i.toString(), targetId: j.toString()};
    };

    static generate(name = "Erdos", ...params) {
        let data;
        switch (name.toLowerCase()) {
            case "erdos":
            case "erdosrenyi":
            case "erdos-renyi":
            case "erdos renyi":
            case "erdos1":
                data = RandomGraph.ErdosRenyi.apply(this, params);
                break;
            case "gilbert":
            case "erdos2":
            case "erdosrenyigilbert":
                data = RandomGraph.ErdosRenyiGilbert.apply(this, params);
                break;
            case "tree":
            case "balanced-tree":
            case "balancedtree":
                data = RandomGraph.BalancedTree.apply(this, params);
                break;
            case "barabasi":
            case "barabasialbert":
            case "barabasi-albert":
                data = RandomGraph.BarabasiAlbert(this, params);
                break;
            case "smallworld":
            case "wattsstrogatz":
            case "wattsstrogatzbeta":
                data = RandomGraph.WattsStrogatzBeta(this, params);
                break;
            case "wattsstrogatzalpha":
                data = RandomGraph.WattsStrogatzAlpha(this, params);
                break;
            default:
                throw new Error(`Graph algorithm '${name}' is not supported.`);
        }
        const nodes = data.nodes;
        const edges = data.edges;
        const nodeDic = {};
        const graph = Graph.empty();
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            nodeDic[node.id] = graph.addNode(node.id);
        }
        for (let j = 0; j < edges.length; j++) {
            const edge = edges[j];
            try {
                graph.addEdge({
                    source: nodeDic[edge.source],
                    target: nodeDic[edge.target],
                    tag: edge,
                });
            } catch (e) {
                debugger;
            }
        }
        return graph;
    }

    /**
     * Simple balanced tree
     *
     * @memberof RandomGraph
     * @param {number} r number of children each node has
     * @param {number} h height of the tree
     */
    static BalancedTree(r = 3, h = 3) {
        let v = 1;
        const graph = {nodes: [RandomGraph.nodeCreator(0)], edges: []};
        let newLeaves = [],
            i,
            j,
            height,
            node,
            leaves;

        for (i = 0; i < r; i++) {
            ++v;
            node = RandomGraph.nodeCreator(v - 1);
            graph.nodes.push(node);
            newLeaves.push(node);
            graph.edges.push(RandomGraph.edgeCreator(0, v));
        }

        for (height = 1; height < h; height++) {
            leaves = newLeaves;
            newLeaves = [];
            for (j = 0; j < leaves.length; j++) {
                for (i = 0; i < r; i++) {
                    ++v;
                    node = RandomGraph.nodeCreator(v - 1);
                    newLeaves.push(node);
                    graph.nodes.push(node);
                    graph.edges.push(RandomGraph.edgeCreator(leaves[j].id, v - 1));
                }
            }
        }
        return graph;
    }

    /**
     * The Erdős–Rényi-Gilbert graph generator. The structure is defined by the fixed probability of having an edge between two nodes.
     * @see https://en.wikipedia.org/wiki/Erdős–Rényi_model
     * @memberof RandomGraph.ErdosRenyi
     * @param n {number} The number of nodes
     * @param p {number}  The probability of an edge between two nodes.
     */
    static ErdosRenyiGilbert(n = 30, p = 0.2) {
        const graph = {nodes: [], edges: []};
        let i, j;
        for (i = 0; i < n; i++) {
            graph.nodes.push(RandomGraph.nodeCreator(i));
            for (j = 0; j < i; j++) {
                if (Math.random() < p) {
                    graph.edges.push(i, j);
                }
            }
        }
        return graph;
    }

    /**
     * The Erdős–Rényi graph generator. The structure is defined by the fixed amount of edges.
     *
     * @see https://en.wikipedia.org/wiki/Erdős–Rényi_model * @memberof RandomGraph.ErdosRenyi
     * @param {number} n number of nodes
     * @param {number} M number of edges
     */
    static ErdosRenyi(n = 30, M = 30) {
        const graph    = {nodes: [], edges: []},
              tmpEdges = [];
        let i, j, k;
        for (i = 0; i < n; i++) {
            graph.nodes.push(RandomGraph.nodeCreator(i));
            for (j = i + 1; j < n; j++) {
                tmpEdges.push(RandomGraph.edgeCreator(i, j));
            }
        }
        // pick m random edges from tmpEdges
        k = tmpEdges.length - 1;
        for (i = 0; i < M; i++) {
            graph.edges.push(tmpEdges.splice(Math.floor(Math.random() * k), 1)[0]);
            k--;
        }
        return graph;
    }

    /**
     * Generates the 'Watts-Strogatz Small World Alpha' model.
     *
     * @see https://en.wikipedia.org/wiki/Watts–Strogatz_model
     * @param n {number}  number of nodes
     * @param k {number}  mean degree (even integer)
     * @param {number} alpha rewiring probability [0..1]
     */
    static WattsStrogatzAlpha(n = 30, k = 6, alpha = 0.54) {
        const graph = {nodes: [], edges: []};
        let i, j, edge;
        const p = Math.pow(10, -10);
        let ec = 0;
        const edge_lut = {},
              ids      = [],
              nk_half  = (n * k) / 2;
        let Rij, sumRij, r, pij;

        for (i = 0; i < n; i++) {
            graph.nodes.push(RandomGraph.nodeCreator(i));
            // create a lattice ring structure
            edge = RandomGraph.edgeCreator(i, (i + 1) % n);
            edge_lut[edge.source + "-" + edge.target] = edge;
            graph.edges.push(edge);
            ec++;
        }
        // Creating n * k / 2 edges
        while (ec < nk_half) {
            for (i = 0; i < n; i++) {
                ids.push(i);
            }
            while (ec < nk_half && ids.length > 0) {
                i = ids.splice(Math.floor(Math.random() * ids.length), 1)[0];
                Rij = [];
                sumRij = 0;
                for (j = 0; j < n; j++) {
                    Rij[j] = calculateRij(i, j);
                    sumRij += Rij[j];
                }
                r = Math.random();
                pij = 0;
                for (j = 0; j < n; j++) {
                    if (i !== j) {
                        pij += Rij[j] / sumRij;
                        if (r <= pij) {
                            edge = RandomGraph.edgeCreator(i, j);
                            graph.edges.push(edge);
                            ec++;
                            edge_lut[edge.source + "-" + edge.target] = edge;
                        }
                    }
                }
            }
        }

        return graph;

        function calculateRij(i, j) {
            if (i === j || edge_lut[i + "-" + j]) return 0;
            const mij = calculatemij(i, j);
            if (mij >= k) return 1;
            if (mij === 0) return p;
            return Math.pow(mij / k, alpha) * (1 - p) + p;
        }

        function calculatemij(i, j) {
            let mij = 0,
                l;
            for (l = 0; l < n; l++) {
                if (l !== i && l !== j && edge_lut[i + "-" + l] && edge_lut[j + "-" + l]) {
                    mij++;
                }
            }
            return mij;
        }
    }

    /**
     * Generates the 'Watts-Strogatz Small World Beta' model.
     * @see https://en.wikipedia.org/wiki/Watts–Strogatz_model
     * @memberof RandomGraph.WattsStrogatz
     * @param n {number}  number of nodes
     * @param K {number}  mean degree (even integer)
     * @param {number} beta rewiring probability [0..1]
     */
    static WattsStrogatzBeta(n = 30, K = 6, beta = 0.54) {
        const graph = {nodes: [], edges: []};
        let i, j, t, edge;
        const edge_lut = {};
        K = K >> 1; // divide by two
        for (i = 0; i < n; i++) {
            graph.nodes.push(RandomGraph.nodeCreator(i));
            // create a lattice ring structure
            for (j = 1; j <= K; j++) {
                edge = RandomGraph.edgeCreator(i, (i + j) % n);
                edge_lut[edge.sourceId + "-" + edge.targetId] = edge;
            }
        }
        // rewiring of edges
        for (i = 0; i < n; i++) {
            for (j = 1; j <= K; j++) {
                // for every pair of nodes
                if (Math.random() <= beta) {
                    do {
                        t = Math.floor(Math.random() * (n - 1));
                    } while (t === i || edge_lut[i + "-" + t]);
                    const j_ = (i + j) % n;
                    edge_lut[i + "-" + j_].targetId = t.toString(); // rewire
                    edge_lut[i + "-" + t] = edge_lut[i + "-" + j_];
                    delete edge_lut[i + "-" + j_];
                }
            }
        }
        graph.edges.push(..._.values(edge_lut));
        return graph;
    }

    /**
     * The Barabási–Albert model generates a scale-free network.
     * @see https://en.wikipedia.org/wiki/Barabási–Albert_model
     * @memberof RandomGraph
     * @param N {number}  total number of nodes  N  > 0
     * @param m0 {number}  m0 > 0 && m0 <  N
     * @param M {number}  M  > 0 && M  <= m0
     */
    static BarabasiAlbert(N = 30, m0 = 5, M = 3) {
        const graph    = {nodes: [], edges: []},
              edge_lut = {},
              degrees  = [];
        let i, j, edge, sum, s, m, r, p;
        // creating m0 nodes
        for (i = 0; i < m0; i++) {
            graph.nodes.push(RandomGraph.nodeCreator(i));
            degrees[i] = 0;
        }
        // Linking every node with each other (no self-loops)
        for (i = 0; i < m0; i++) {
            for (j = i + 1; j < m0; j++) {
                edge = RandomGraph.edgeCreator(i, j);
                edge_lut[edge.source + "-" + edge.target] = edge;
                graph.edges.push(edge);
                degrees[i]++;
                degrees[j]++;
            }
        }
        // Adding N - m0 nodes, each with M edges
        for (i = m0; i < N; i++) {
            graph.nodes.push(RandomGraph.nodeCreator(i));
            degrees[i] = 0;
            sum = 0; // sum of all nodes degrees
            for (j = 0; j < i; j++) sum += degrees[j];
            s = 0;
            for (m = 0; m < M; m++) {
                r = Math.random();
                p = 0;
                for (j = 0; j < i; j++) {
                    if (edge_lut[i + "-" + j] || edge_lut[j + "-" + i]) continue;
                    if (i === 1) p = 1;
                    else p += degrees[j] / sum + s / (i - m);

                    if (r <= p) {
                        s += degrees[j] / sum;
                        edge = RandomGraph.edgeCreator(i, j);
                        edge_lut[edge.source + "-" + edge.target] = edge;
                        graph.edges.push(edge);
                        degrees[i]++;
                        degrees[j]++;
                        break;
                    }
                }
            }
        }
        return graph;
    }
}

module.exports = RandomGraph;
