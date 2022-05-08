const {Strings, Utils} = require("@graphminer/utils");
const _ = require("lodash");

/*
 * Utilities related to the JSON-graph format.
 * */
class JsonGraph {

    /**
     * Returns an empty JSON-graph.
     * @returns {{nodes: *[], edges: *[]}}
     */
    static empty() {
        return {
            nodes: [],
            edges: [],
            typeName: "Graph"
        }
    }

    /**
     * Returns whether the given object has the JSON-graph structure.
     * @param g
     * @returns {boolean}
     */
    static isJsonGraph(g) {
        if (Utils.isEmpty(g)) {
            return false;
        }
        return _.isPlainObject(g) && g.nodes && _.isArray(g.nodes) && g.edges && _.isArray(g.edges)

    }

    /**
     * Returns the graph `g` merged with `h`, both represented as JSON graphs (nodes and edges collections).
     *
     * Note that a clone is returned of the respective elements.
     * @param g {*} A JSON graph.
     * @param h {*} A JSON graph.
     */
    static mergeJsonGraphs(g, h) {
        if (!JsonGraph.isJsonGraph(g)) {
            throw new Error(Strings.ShoudBeType("g", "JSON Graph", "JsonGraph.mergeJsonGraphs"))
        }
        if (!JsonGraph.isJsonGraph(h)) {

            throw new Error(Strings.ShoudBeType("h", "JSON Graph", "JsonGraph.mergeJsonGraphs"))
        }
        const m = _.cloneDeep(g);
        // merging the nodes
        for (const n of h.nodes) {
            const found = _.find(m.nodes, u => u.id === n.id);
            if (!found) {
                m.nodes.push(_.clone(n))
            }
        }
        // merging the edges
        for (const e of h.edges) {
            if (!JsonGraph.edgeExists(m, e)) {
                m.edges.push(_.clone(e))
            }
        }
        return m;
    }

    static edgeExists(g, edge) {
        if (!JsonGraph.isEdge(edge)) {
            throw new Error(Strings.ShoudBeType("edge", "JSON Edge", "JsonGraph.edgeExists"))
        }
        if (Utils.isDefined(edge.id)) {
            const found = JsonGraph.getEdgeById(g, edge.id);
            if (found) {
                return true
            }
        }
        const sameEndpoints = _.filter(g.edges, u => u.sourceId === edge.sourceId && u.targetId === edge.targetId)
        if (sameEndpoints.length > 0) {
            if (Utils.isDefined(edge.name)) {
                const found = _.find(sameEndpoints, u => u.name?.toString().trim().toLowerCase() === edge.name.toString().trim().toLowerCase())
                if (found) {
                    return true
                }
            } else {
                const found = _.find(sameEndpoints, u => Utils.isUndefined(u.name))
                if (found) {
                    return true
                }
            }
        }
        return false
    }

    static getNodeById(g, id) {
        return _.find(g.nodes, u => u.id === id)
    }

    static getEdgeById(g, id) {
        return _.find(g.edges, u => u.id === id)
    }

    static addNode(g, node, check = true) {
        if (Utils.isStringOrNumber(node)) {
            // the given string is interpreted as id and name
            node = {
                id: node.toString().trim(),
                name: node.toString().trim()

            }
            return JsonGraph.addNode(g, node)
        }
        if (!_.isPlainObject(node)) {
            node = JSON.parse(JSON.stringify(node));
        }
        if (Utils.isEmpty(node.id)) {
            node.id = Utils.id()
        } else {
            node.id = node.id.toString()
        }
        if (Utils.isEmpty(node.typeName)) {
            node.typeName = "Unknown"
        }

        if (check) {
            let found = JsonGraph.getNodeById(g, node.id);
            if (_.isNil(found)) {
                found = JsonGraph.addNode(g, node, false);
            }
            return found;
        } else {
            g.nodes.push(node)
            return node
        }

    }

    static getEdge(g, sourceId, targetId, name = null) {
        const sameEndpoints = _.filter(g.edges, u => u.sourceId === sourceId && u.targetId === targetId)
        if (sameEndpoints.length > 0) {
            if (Utils.isDefined(name)) {
                const found = _.find(sameEndpoints, u => u.name?.toString().trim().toLowerCase() === name.toString().trim().toLowerCase())
                if (found) {
                    return found
                }
            } else {
                const found = _.find(sameEndpoints, u => Utils.isUndefined(u.name))
                if (found) {
                    return found
                }
            }
        }
        return null;
    }

    static isEdge(edge) {
        if (Utils.isEmpty(edge)) {
            return false
        }
        return _.isPlainObject(edge) && Utils.isDefined(edge.sourceId) && Utils.isDefined(edge.targetId)
    }

    static ensureNodesArePresent(g, edge) {
        if (Utils.isUndefined(edge)) {
            return;
        }
        if (_.isArray(edge)) {
            if (edge.length !== 2) {
                throw new Error("An edge represented as an array should consist of two items.")
            }
            JsonGraph.addNode(g, edge[0].toString())
            JsonGraph.addNode(g, edge[1].toString())
        } else if (_.isPlainObject(edge)) {
            JsonGraph.addNode(g, edge.sourceId)
            JsonGraph.addNode(g, edge.targetId)
        } else {
            JsonGraph.ensureNodesArePresent(g, JSON.parse(JSON.stringify(edge)))
        }
    }

    static nodeIdExists(g, id) {
        return Utils.isDefined(JsonGraph.getNodeById(g, id))
    }

    static addEdge(g, edge, check = true) {
        if (Utils.isUndefined(edge)) {
            return null;
        }

        if (_.isArray(edge)) {
            // a tuple interpreted as a couple of id's
            return JsonGraph.addEdge(g, {
                sourceId: edge[0].toString(),
                targetId: edge[1].toString(),
            })

        } else if (_.isPlainObject(edge)) {

            if (!JsonGraph.isEdge(edge)) {
                return null;
            }
            JsonGraph.ensureNodesArePresent(g, edge)

            if (Utils.isEmpty(edge.id)) {
                edge.id = Utils.id()
            }
            if (Utils.isEmpty(edge.typeName)) {
                edge.typeName = "Link"
            }

            if (check) {
                const found = JsonGraph.getEdge(g, edge.sourceId, edge.targetId, edge.name)
                if (found) {
                    return found
                } else {
                    return JsonGraph.addEdge(g, edge, false);
                }
            } else {
                g.edges.push(edge)
                return edge
            }
        } else {
            return JsonGraph.addEdge(g, JSON.parse(JSON.stringify(edge)), check)
        }


    }
}

module.exports = JsonGraph;
