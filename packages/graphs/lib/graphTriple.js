const TripleNode = require("./tripleNode");
const TripleEdge = require("./tripleEdge");
const { Utils, Strings } = require("@graphminer/utils");

const _ = require("lodash");

class GraphTriple {
	edge;

	constructor(...args) {
		this.typeName = "GraphTriple";
		this.edge = null;
		switch (args.length) {
			case 1:
				this.source = TripleNode.parse(args[0]);
				break;
			case 2:
				this.source = TripleNode.parse(args[0]);
				if (_.isNil(this.source)) {
					throw new Error("Could not create a GraphTriple, the first argument is not a proper node definition.");
				}
				// edge or node in this case
				let found = TripleNode.parse(args[1]);
				if (_.isNil(found)) {
					found = TripleEdge.parse(args[1]);
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
				this.source = TripleNode.parse(args[0]);
				if (_.isNil(this.source)) {
					throw new Error("Could not create a GraphTriple, the first argument is not a proper node definition.");
				}
				this.edge = TripleEdge.parse(args[1]);
				if (_.isNil(this.edge)) {
					throw new Error("Could not create a GraphTriple, the second argument is not a proper edge definition.");
				}
				this.target = TripleNode.parse(args[2]);
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
				value = `[${v.map((u) => GraphTriple.toCypherDataValue(u)).join(", ")}]`;
			} else {
				value = GraphTriple.toCypherDataValue(v);
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
		tripleString = tripleString.trim();
		let triple;
		// ===================================================================
		// Singleton
		// ===================================================================
		let found = TripleNode.parse(tripleString);
		if (!_.isNil(found)) {
			triple = new GraphTriple();
			triple.source = found;
			return triple;
		}
		// ===================================================================
		// (something)-->(something else)
		// ===================================================================
		found = GraphTriple.regNoEdge.exec(tripleString);
		if (!_.isNil(found)) {
			const from = TripleNode.parse(found[1]);
			const to = TripleNode.parse(found[2]);
			if (!_.isNil(from) && !_.isNil(to)) {
				return new GraphTriple(from, to);
			}
		}
		// ===================================================================
		// (something)-[edge]->(something else)
		// ===================================================================
		found = GraphTriple.regWithEdge.exec(tripleString);
		if (!_.isNil(found)) {
			const from = TripleNode.parse(found[1]);
			const between = TripleEdge.parse(found[2]);
			const to = TripleNode.parse(found[3]);
			if (!_.isNil(from) && !_.isNil(between) && !_.isNil(to)) {
				return new GraphTriple(from, between, to);
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

module.exports = GraphTriple;
