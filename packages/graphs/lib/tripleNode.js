const { Utils, Strings } = require("@graphminer/utils");
const _ = require("lodash");
const { faker } = require("@faker-js/faker");

/*
 * Part of simplified cypher, this represents something like
 * - p:Person{age:44}
 * - agent
 * - (c:Cat)
 * */
class TripleNode {
	constructor(name = null, type = null, data = null) {
		this.name = name;
		this.type = type;
		this.data = data;
	}

	static get regSingleton() {
		return /^\(([a-zA-Z_]+[a-zA-Z0-9_]*)?:?([a-zA-Z_]+[a-zA-Z0-9_]*)?({[^->]+})?\)$/gi;
	}

	get [Symbol.toStringTag]() {
		return this.name;
	}

	/**
	 * Parses the given input an tries to turn it into a TripleNode.
	 * @param stuff {string|any} Something which can be interpreted as a TripleNode.
	 * @return {any}
	 */
	static parse(stuff) {
		if (Utils.isEmpty(stuff)) {
			return null;
		}
		if (stuff instanceof TripleNode) {
			return stuff;
		} else if (_.isString(stuff)) {
			stuff = stuff.trim();
			if (!stuff.startsWith("(")) {
				stuff = "(" + stuff;
			}
			if (!stuff.endsWith(")")) {
				stuff = stuff + ")";
			}

			const found = TripleNode.regSingleton.exec(stuff);
			if (Utils.isEmpty(found)) {
				return null;
			}
			const tripleNode = new TripleNode();
			tripleNode.name = found[1] || null;
			tripleNode.type = found[2] || null;
			if (!Utils.isEmpty(found[3])) {
				try {
					// todo: consider jsonic (https://github.com/jsonicjs/jsonic)
					eval("tripleNode.data=" + found[3]);
				} catch (e) {
					return null;
				}
			} else {
				tripleNode.data = null;
			}

			return tripleNode;
		} else if (_.isPlainObject(stuff)) {
			const cypher = TripleNode.entityToCypher(stuff);
			return TripleNode.parse(cypher);
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
		const GraphTriple = require("./graphTriple");
		if (!_.isPlainObject(entity)) {
			entity = JSON.parse(JSON.stringify(entity));
		}
		let typeName = entity.typeName;
		if (Utils.isEmpty(typeName)) {
			typeName = "Thought";
		}
		let name = _.isNil(variableName) ? entity.name : variableName;
		if (_.isNil(name)) {
			name = faker.lorem.word();
		}
		let data = GraphTriple.toCypherData(entity);
		return `(${name}:${typeName}${data})`;
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
		const GraphTriple = require("./graphTriple");
		let s = `${this.name || ""}`;
		if (!_.isNil(this.type)) {
			s += `:${this.type}`;
		}
		if (!_.isNil(this.data)) {
			// the data is always a dictionary since otherwise the regex would not have picked it up

			s += GraphTriple.toCypherData(this.data);
		}
		return `(${s})`;
	}
}

module.exports = TripleNode;
