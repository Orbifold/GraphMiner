const {Utils, Strings} = require("@graphminer/utils");
const _ = require("lodash");

const {faker} = require("@faker-js/faker")
const GraphUtils = require("../graphUtils");
const JsonGraph = require("./jsonGraph");

/*
 * Part of pseudo-cypher, this represents a single node `(name:typeName{data})`.
 * The string representation can be
 * - p:Person{age:44}
 * - agent
 * - (c:Cat)
 * where the round parentheses are optional.
 *
 * The `parse` method returns a node from the string representation while the `toCypher` method does the inverse.
 *
 * @example
 *
 * node = PseudoCypherNode.parse("(a:Car)")
 * node = PseudoCypherNode.parse("(a:Car{u:2})")
 * node = new PseudoCypherNode("a", "car", {u: 34});
 * node.toCypher() // (a:car{u: 34})
 * */
class PseudoCypherNode {
    /**
     * The name of the node.
     * @type {string|null}
     */
    name;

    /**
     * The type of the node.
     * @type {string|null}
     */
    type;

    /**
     * The payload of the node.
     * @type {*|null}
     */
    data;

    get typeName() {
        return "PseudoCypherNode";
    }

    constructor(name = null, type = null, data = null) {
        this.name = name;
        this.type = type;
        this.data = data;
    }

    /**
     * Returns the regular expression to parse a pseudo-cypher node.
     * @returns {RegExp}
     */
    static get regex() {
        return /^\(([a-zA-Z_]+[a-zA-Z0-9_]*)?:?([a-zA-Z_]+[a-zA-Z0-9_]*)?({[^->]+})?\)$/gi;
    }

    /**
     * For debugging purposes.
     * @returns {string|null}
     */
    get [Symbol.toStringTag]() {
        return this.name;
    }

    /**
     * Parses the given input an tries to turn it into a PseudoCypherNode.
     * @param stuff {string|any} Something which can be interpreted as a PseudoCypherNode.
     * @return {any}
     */
    static parse(stuff) {
        if (Utils.isEmpty(stuff)) {
            return null;
        }
        if (stuff instanceof PseudoCypherNode) {
            return stuff;
        } else if (_.isNumber(stuff)) {
            return PseudoCypherNode.parse(stuff.toString());
        } else if (_.isBoolean(stuff)) {
            return PseudoCypherNode.parse(stuff.toString());
        } else if (_.isString(stuff)) {
            stuff = stuff.trim();
            if (!stuff.startsWith("(")) {
                stuff = "(" + stuff;
            }
            if (!stuff.endsWith(")")) {
                stuff = stuff + ")";
            }

            const found = PseudoCypherNode.regex.exec(stuff);
            if (Utils.isEmpty(found)) {
                return null;
            }
            const node = new PseudoCypherNode();
            node.name = found[1] || null;
            node.type = found[2] || null;
            if (!Utils.isEmpty(found[3])) {
                try {
                    // todo: consider jsonic (https://github.com/jsonicjs/jsonic)
                    eval("node.data=" + found[3]);
                } catch (e) {
                    return null;
                }
            } else {
                node.data = null;
            }

            return node;
        } else if (_.isPlainObject(stuff)) {
            const cypher = PseudoCypherNode.entityToCypher(stuff);
            return PseudoCypherNode.parse(cypher);
        }
        return null;
    }

    /**
     * Returns pseudo-cypher for the given entity.
     * @param entity {any} An entity.
     * @param variableName? {string} Optional name for the variable v in '(v:type{...})'. If not set the name of the entity is used and if the entity has no name a random name will be assigned.
     * @return {string}
     */
    static entityToCypher(entity, variableName = null) {
        if (!_.isPlainObject(entity)) {
            entity = JSON.parse(JSON.stringify(entity));
        }
        let typeName = entity.typeName || "";
        // if (Utils.isEmpty(typeName)) {
        //     typeName = "Thought";
        // }
        let name = _.isNil(variableName) ? entity.name : variableName;
        if (_.isNil(name)) {
            name = faker.lorem.word();
        }
        let data = PseudoCypherTriple.toCypherData(entity);
        return `(${name}:${typeName}${data})`;
    }

    /**
     * Returns the pseudo-node in plain object format.
     * @returns {*}
     */
    toEntity() {
        let d = {};
        if (!Utils.isEmpty(this.data)) {
            d = _.assign(d, this.data);
        }
        if (!Utils.isEmpty(this.type)) {
            d.typeName = this.type;
        }
        d.name = this.data?.name || this.name;
        return d;
    }

    /**
     * Returns the pseudo-node as pseudo-cypher.
     * @returns {string}
     */
    toCypher() {
        let s = `${this.name || ""}`;
        if (!_.isNil(this.type)) {
            s += `:${this.type}`;
        }
        if (!_.isNil(this.data)) {
            // the data is always a dictionary since otherwise the regex would not have picked it up

            s += PseudoCypherTriple.toCypherData(this.data);
        }
        return `(${s})`;
    }
}

/*
 * Part of simplified cypher, this represents things like
 * - l:Link
 * - [:Gen{x:5}]
 *
 * Note that this does not represent a triple like '(a)-[:label]->(b)'. See the {@link PseudoCypherTriple} method for this.
 * */
class PseudoCypherEdge {
    get typeName() {
        return "PseudoCypherEdge";
    }

    constructor(name = null, type = null, data = null) {
        this.name = name;
        this.type = type;
        this.data = data;
    }

    /**
     * Regex for singletons, things like (n:Thing{x:4}).
     * @return {RegExp}
     */
    static get regex() {
        return /^\[([a-zA-Z_]+[a-zA-Z0-9_]*)?:?([a-zA-Z_]+[a-zA-Z0-9_]*)?({.*?})?\]$/gi;
    }

    get [Symbol.toStringTag]() {
        return this.name;
    }

    /**
     * Parses the given input an tries to turn it into a PseudoCypherEdge.
     * @param stuff {string|any} Something which can be interpreted as a PseudoCypherEdge.
     * @return {any}
     */
    static parse(stuff) {
        if (Utils.isEmpty(stuff)) {
            return null;
        }
        if (stuff instanceof PseudoCypherEdge) {
            return stuff;
        } else if (_.isString(stuff)) {
            stuff = stuff.trim();
            if (!stuff.startsWith("[")) {
                stuff = "[" + stuff;
            }
            if (!stuff.endsWith("]")) {
                stuff = stuff + "]";
            }

            const found = PseudoCypherEdge.regex.exec(stuff);
            if (Utils.isEmpty(found)) {
                return null;
            }
            const tripleEdge = new PseudoCypherEdge();
            tripleEdge.name = found[1] || null;
            tripleEdge.type = found[2] || null;
            if (!Utils.isEmpty(found[3])) {
                try {
                    // todo: consider jsonic (https://github.com/jsonicjs/jsonic)
                    eval("tripleEdge.data=" + found[3]);
                } catch (e) {
                    return null;
                }
            } else {
                tripleEdge.data = null;
            }

            return tripleEdge;
        }
        return null;
    }

    /**
     * Returns pseudo-cypher for the given entity.
     * @param entity {any} An entity.
     * @see TripleNode.entityToCypher
     * @return {string}
     */
    static entityToCypher(entity) {

        if (!_.isPlainObject(entity)) {
            entity = JSON.parse(JSON.stringify(entity));
        }
        let typeName = entity.typeName;
        if (Utils.isEmpty(typeName)) {
            typeName = GraphUtils.GenericLinkTypeName;
        }
        let name = entity.name;
        if (Utils.isEmpty(name)) {
            name = faker.lorem.word();
        }
        let data = PseudoCypherTriple.toCypherData(entity);
        return `[${name}:${typeName}${data}]`;
    }

    toEntity() {
        let d = {};
        if (!Utils.isEmpty(this.data)) {
            d = _.assign(d, this.data);
        }
        if (!Utils.isEmpty(this.type)) {
            d.typeName = this.type;
        }
        d.name = this.data?.name || this.name;
        return d;
    }

    toCypher() {

        let s = `${this.name || ""}`;
        if (!_.isNil(this.type)) {
            s += `:${this.type}`;
        }
        if (!_.isNil(this.data)) {
            // the data is always a dictionary since otherwise the regex would not have picked it up

            s += PseudoCypherTriple.toCypherData(this.data);
        }
        return `[${s}]`;
    }
}

/*
 * Represents a standard SPO (Subject-Predicate-Object) triple.
 * Because 'Object' is a reserved word the endpoints are called 'source' and 'target'.
 * The predicate is called 'edge' and is of type @{link PseudoCypherEdge} while the endpoints are of type {@link PseudoCypherNode}.
 * */
class PseudoCypherTriple {
    edge;
    /**
     * @type PseudoCypherNode
     */
    source;

    /**
     * @type PseudoCypherNode
     */
    target;

    get typeName() {
        return "PseudoCypherTriple";
    }

    constructor(...args) {

        this.edge = null;
        switch (args.length) {
            case 1:
                this.source = PseudoCypherNode.parse(args[0]);
                break;
            case 2:
                this.source = PseudoCypherNode.parse(args[0]);
                if (_.isNil(this.source)) {
                    throw new Error("Could not create a GraphTriple, the first argument is not a proper node definition.");
                }
                // edge or node in this case
                let found = PseudoCypherNode.parse(args[1]);
                if (_.isNil(found)) {
                    found = PseudoCypherEdge.parse(args[1]);
                    if (_.isNil(found)) {
                        throw new Error("Could not create a GraphTriple, the second argument is not a proper edge or node definition.");
                    }
                    this.edge = found;
                } else {
                    this.target = found;
                    this.edge = null;
                }
                break;
            case 3:
                this.source = PseudoCypherNode.parse(args[0]);
                if (_.isNil(this.source)) {
                    throw new Error("Could not create a GraphTriple, the first argument is not a proper node definition.");
                }
                this.edge = PseudoCypherEdge.parse(args[1]);
                if (_.isNil(this.edge)) {
                    throw new Error("Could not create a GraphTriple, the second argument is not a proper edge definition.");
                }
                this.target = PseudoCypherNode.parse(args[2]);
                if (_.isNil(this.target)) {
                    throw new Error("Could not create a GraphTriple, the third argument is not a proper node definition.");
                }
        }
    }

    static get regNoEdge() {
        return /\((.*?)\)-->\((.*?)\)/gi;
    }

    static get regWithEdge() {
        return /\((.*?)\)-\[(.*?)\]->\((.*?)\)/gi;
    }

    get isSingleton() {
        return _.isNil(this.target);
    }

    get hasEdge() {
        return !_.isNil(this.edge);
    }

    get [Symbol.toStringTag]() {
        return this.source.name + "-->" + this.target.name;
    }

    get [Symbol.toStringTag]() {
        return this.typeName;
    }

    static entityToCypher(entity, variableName = null) {
        if (!_.isPlainObject(entity)) {
            entity = JSON.parse(JSON.stringify(entity));
        }
        if (Utils.isDefined(entity.sourceId)) {
            const sourceId = entity.sourceId.toString().trim();
            if (Utils.isDefined(entity.targetId)) {
                const targetId = entity.targetId.toString().trim();
                const source = `(u{id: ${sourceId})`
                const target = `(v{id: ${targetId})`
                delete entity.sourceId;
                delete entity.targetId;
                let data = {}
                if (Utils.isDefined(entity.id)) {
                    data.id = entity.id
                    delete entity.id
                }
                let name = null;
                if (Utils.isDefined(entity.name)) {
                    name = entity.name
                    delete entity.name
                }
                let typeName = null;
                if (Utils.isDefined(entity.typeName)) {
                    typeName = entity.typeName
                    delete entity.typeName
                }
                let edge = ""
                if (name) {
                    edge += name;
                }
                if (typeName) {
                    edge += `:${typeName}`
                }
                if (Utils.isEmpty(edge)) {
                    return `${source}-->${target}`
                } else {
                    // whatever remains is arbitrary data
                    _.assign(data, entity)
                    if (Utils.isDefined(data)) {
                        edge += JSON.stringify(data)
                    }
                    return edge
                }
            }
        }
        return null;
    }

    /**
     * Turns JSON-like values in a correct cypher-like format.
     * @param v {any} Anything.
     * @return {string}
     */
    static toCypherDataValue(v) {
        if (_.isString(v)) {
            return `'${v}'`;
        } else if (_.isArray(v)) {
            throw new Error("Cypher format does not allow complex properties.");
        } else if (_.isNumber(v)) {
            return `${v}`;
        } else if (_.isBoolean(v)) {
            return `${v.toString().toLowerCase()}`;
        } else if (_.isDate(v)) {
            return `${Dates.makeDate(v).getTime().toString()}`;
        }
        throw new Error(`Cypher data type for '${v}' is not handled yet.`);
    }

    /**
     * Turns a JSON-like blob into a cypher-like blob.
     * The two differ in the key's quotes.
     * @param data {any} A data blob.
     * @return {string}
     */
    static toCypherData(data) {
        let items = [];

        _.forEach(data, (v, k) => {
            let value;
            if (_.isArray(v)) {
                value = `[${v.map((u) => PseudoCypherTriple.toCypherDataValue(u)).join(", ")}]`;
            } else {
                value = PseudoCypherTriple.toCypherDataValue(v);
            }
            items.push(`${k}: ${value}`);
        });
        return `{${items.join(", ")}}`;
    }

    /**
     * Attempts to turn the pseudo-cypher of a single triple.
     * @param tripleString
     */
    static parse(tripleString) {

        if (Utils.isEmpty(tripleString)) {
            return null;
        }
        if (!_.isString(tripleString)) {
            return null
        }
        tripleString = tripleString.trim();
        let triple;
        // ===================================================================
        // Singleton
        // ===================================================================
        let found = PseudoCypherNode.parse(tripleString);
        if (!_.isNil(found)) {
            triple = new PseudoCypherTriple();
            triple.source = found;
            return triple;
        }
        // ===================================================================
        // (something)-->(something else)
        // ===================================================================
        found = PseudoCypherTriple.regNoEdge.exec(tripleString);
        if (!_.isNil(found)) {
            const from = PseudoCypherNode.parse(found[1]);
            const to = PseudoCypherNode.parse(found[2]);
            if (!_.isNil(from) && !_.isNil(to)) {
                return new PseudoCypherTriple(from, to);
            }
        }
        // ===================================================================
        // (something)-[edge]->(something else)
        // ===================================================================
        found = PseudoCypherTriple.regWithEdge.exec(tripleString);
        if (!_.isNil(found)) {
            const from = PseudoCypherNode.parse(found[1]);
            const between = PseudoCypherEdge.parse(found[2]);
            const to = PseudoCypherNode.parse(found[3]);
            if (!_.isNil(from) && !_.isNil(between) && !_.isNil(to)) {
                return new PseudoCypherTriple(from, between, to);
            }
        }
        return null;
    }

    toCypher() {
        if (this.isSingleton) {
            return this.source.toCypher();
        } else {
            if (this.hasEdge) {
                return `${this.source.toCypher()}-${this.edge.toCypher()}->${this.target.toCypher()}`;
            } else {
                return `${this.source.toCypher()}-->${this.target.toCypher()}`;
            }
        }
    }
}

/*
 * Gateway between pseudo-cypher and nodes, edges and graphs.
 **/
class PseudoCypher {
    /**
     * Returns a single node, if any, from the given pseudo-cypher representation.
     * @param input {string}
     */
    static parseNode(input) {
        if (Utils.isEmpty(input)) {
            return null;
        }
        const n = PseudoCypherNode.parse(input)
        if (n) {
            const e = n.toEntity();
            if (Utils.isEmpty(e.id)) {
                e.id = Utils.id()
            } else {
                e.id = e.id.toString();
            }
            if (Utils.isEmpty(e.typeName)) {
                e.typeName = "Unknown";
            }
            return e
        }
        return null;
    }

    /**
     * Returns a single edge, if any, from the given pseudo-cypher representation.
     * @param input {string}
     */
    static parseEdge(input) {
        if (Utils.isEmpty(input)) {
            return null;
        }
        const pe = PseudoCypherTriple.parse(input)
        if (pe) {
            const source = pe.source.toEntity()
            const target = pe.target.toEntity()
            if (Utils.isEmpty(source.id) || Utils.isEmpty(target.id)) {
                return null;
            }
            const e = {
                id: Utils.id(),
                sourceId: source.id.toString(),
                targetId: target.id.toString()
            }
            if (Utils.isDefined(pe.edge)) {
                e.name = pe.edge.name
                if (Utils.isEmpty(pe.edge.type)) {
                    e.typeName = GraphUtils.GenericLinkTypeName;
                } else {
                    e.typeName = pe.edge.type
                }
            } else {
                e.typeName = GraphUtils.GenericLinkTypeName;
            }


            return e
        }
        return null;
    }

    /**
     * Converts the node or edge (plain objects) into pseudo-cypher.
     * @param entity
     * @returns {null}
     */
    static entityToCypher(entity) {

    }

    /**
     * The regex to detect a triple in pseudo-cypher.
     * Things like this will be picked up
     * - (a)-->(b)
     * - (a:Person)-->(d)
     * - (a:Thing{x:34})-->(c)
     * The content of the nodes is handled separately by {@link PseudoCypherNode.parse}.
     * @return {RegExp}
     */
    static get regNoEdge() {
        return /\(([^->]+)\)(?=(-->|-\[\]->)\(([^->]+)\))/gi;
    }

    /**
     * The regex to detect a triple in pseudo-cypher.
     * Things like this will be picked up
     * - (a)-[v]->(b)
     * - (a:Person)-[:AB]->(d)
     * - (a:Thing{x:34})-[k:F{x:5}]->(c)
     * The content of the node is handled separately by {@link PseudoCypherNode.parse}.
     * The content of the edge is handled separately by {@link PseudoCypherEdge.parse}.
     * @return {RegExp}
     */
    static get regWithEdge() {
        return /\(([^->]+)\)(?=-\[([^->]+)\]->\(([^->]+)\))/gi;
    }

    /**
     *
     * @returns {*}
     * @param typeName
     */
    static defaultEntityCreator(typeName = "Unknown") {
        return (u) => {
            const entity = {
                id: u?.data?.id || Utils.id(),
                name: u?.name || u?.data?.name,
                description: u?.description,
                typeName: u?.type || u?.data?.typeName || typeName,
            };
            if (Utils.isEmpty(u?.name)) {
                u.name = u.id;
            }
            return _.assign(entity, u?.data);
        };
    }

    /**
     *
     * @param [u] {PseudoCypherEdge}
     * @returns {*}
     */
    static defaultLinkCreator(u = null) {
        const entity = {
            id: u?.data?.id.toString() || Utils.id(),
            name: u?.name || u?.data?.name,
            description: u?.description,
            typeName: u?.type || u?.data?.typeName || GraphUtils.GenericLinkTypeName,
            sourceId: u?.data?.sourceId || Utils.id(),
            targetId: u?.data?.targetId || Utils.id(),
        };
        _.assign(entity, u?.data);
        entity.id = entity.id.toString();
        return entity
    }

    /**
     * Returns a JSON-graph from the given pseudo-cypher.
     * @param input {string}
     * @param entityCreator
     * @param edgeCreator
     * @returns {{nodes: *[], edges: *[]}|null}
     */
    static parse(input, entityCreator = null, edgeCreator = null) {
        if (Utils.isEmpty(input)) {
            return null;
        }
        let g = JsonGraph.empty();

        g.description = input;

        const lines = input.split("\n").map(l => l.replaceAll("\t", "").trim()).filter((l) => l.length > 0);

        let h;
        for (const line of lines) {
            h = PseudoCypher.parsePseudoCypherLine(line, entityCreator, edgeCreator);
            g = JsonGraph.mergeJsonGraphs(g, h);
        }
        return g;
    }

    /**
     * Parses a single line of pseudo-cypher to a graph.
     * @param line
     * @param entityCreator {Function|string}
     * @param edgeCreator {Function|string}
     * @return {*} A JSON-graph.
     */
    static parsePseudoCypherLine(line, entityCreator = null, edgeCreator = null) {
        if (Utils.isEmpty(line)) {
            return null;
        }

        line = line.trim();
        if (_.isNil(entityCreator)) {
            entityCreator = PseudoCypher.defaultEntityCreator();
        } else {
            if (_.isString(entityCreator)) {
                entityCreator = PseudoCypher.defaultEntityCreator(entityCreator);
            }
            if (!_.isFunction(entityCreator)) {
                throw new Error(Strings.ShoudBeType("entityCreator", "Function", "Graph.parsePseudoCypher"));
            }
        }
        if (_.isNil(edgeCreator)) {
            edgeCreator = PseudoCypher.defaultLinkCreator;
        }
        let entity;
        let g = JsonGraph.empty()


        // ===================================================================
        // Singleton
        // ===================================================================
        let found = PseudoCypherNode.parse(line);
        if (!_.isNil(found)) {
            entity = entityCreator(found);
            if (!_.isNil(entity)) {
                JsonGraph.addNode(g, entity);
            }
            return g;
        }
        // ===================================================================
        // (something)-->(something else)
        // (something)-[]->(something else)
        // ===================================================================
        // note  that the endpoint of a triple can be the start of the next and hence creates duplicates if we don't check

        found = line.matchAll(PseudoCypher.regNoEdge);
        if (!_.isNil(found)) {
            found = Array.from(found);
            let previousNode = null;
            let sourceNode;
            for (const duo of found) {
                if (_.isNil(previousNode)) {
                    const f = PseudoCypherNode.parse(duo[1]);
                    sourceNode = entityCreator(f);
                } else {
                    sourceNode = previousNode;
                }

                const t = PseudoCypherNode.parse(duo[3]);
                const targetNode = entityCreator(t);
                if (!_.isNil(sourceNode) && !_.isNil(targetNode)) {
                    const from = JsonGraph.addNode(g, sourceNode);
                    const to = JsonGraph.addNode(g, targetNode);
                    const edge = edgeCreator();
                    edge.sourceId = from.id;
                    edge.targetId = to.id;
                    JsonGraph.addEdge(g, edge);
                }
                previousNode = targetNode;
            }
        }
        // ===================================================================
        // (something)-[edge]->(something else)
        // ===================================================================
        found = line.matchAll(PseudoCypher.regWithEdge);
        if (!_.isNil(found)) {
            found = Array.from(found);
            let previousNode = null;
            let sourceNode;
            for (const trio of found) {
                if (_.isNil(previousNode)) {
                    const f = PseudoCypherNode.parse(trio[1]);
                    sourceNode = entityCreator(f);
                } else {
                    sourceNode = previousNode;
                }
                const between = PseudoCypherEdge.parse(trio[2]);
                const t = PseudoCypherNode.parse(trio[3]);

                const edge = edgeCreator(between);

                const targetNode = entityCreator(t);

                if (!_.isNil(sourceNode) && !_.isNil(edge) && !_.isNil(targetNode)) {
                    const from = JsonGraph.addNode(g, sourceNode);
                    edge.sourceId = from.id;
                    const to = JsonGraph.addNode(g, targetNode);
                    edge.targetId = to.id;
                    JsonGraph.addEdge(g, edge);
                }
            }
        }
        return g;
    }
}

module.exports = {PseudoCypher, PseudoCypherNode, PseudoCypherEdge, PseudoCypherTriple};
