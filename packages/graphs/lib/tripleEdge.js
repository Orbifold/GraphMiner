const { Utils, Strings } = require("@graphminer/utils");

const _ = require("lodash");

/*
 * Part of simplified cypher, this represents things like
 * - l:Link
 * - [:Gen{x:5}]
 * */
class TripleEdge {
	constructor(name = null, type = null, data = null) {
		this.name = name;
		this.type = type;
		this.data = data;
	}

	/**
	 * Regex for singletons, things like (n:Thing{x:4}).
	 * @return {RegExp}
	 */
	static get regSingleton() {
		return /^\[([a-zA-Z_]+[a-zA-Z0-9_]*)?:?([a-zA-Z_]+[a-zA-Z0-9_]*)?({.*?})?\]$/gi;
	}

	get [Symbol.toStringTag]() {
		return this.name;
	}

	/**
	 * Parses the given input an tries to turn it into a TripleEdge.
	 * @param stuff {string|any} Something which can be interpreted as a TripleEdge.
	 * @return {any}
	 */
	static parse(stuff) {
		if (Utils.isEmpty(stuff)) {
			return null;
		}
		if (stuff instanceof TripleEdge) {
			return stuff;
		} else if (_.isString(stuff)) {
			stuff = stuff.trim();
			if (!stuff.startsWith("[")) {
				stuff = "[" + stuff;
			}
			if (!stuff.endsWith("]")) {
				stuff = stuff + "]";
			}

			const found = TripleEdge.regSingleton.exec(stuff);
			if (Utils.isEmpty(found)) {
				return null;
			}
			const tripleEdge = new TripleEdge();
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
		const GraphTriple = require("./graphTriple");

		if (!_.isPlainObject(entity)) {
			entity = JSON.parse(JSON.stringify(entity));
		}
		let typeName = entity.typeName;
		if (Utils.isEmpty(typeName)) {
			typeName = "GenericLink";
		}
		let name = entity.name;
		if (Utils.isEmpty(name)) {
			name = faker.lorem.word();
		}
		let data = GraphTriple.toCypherData(entity);
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
		const GraphTriple = require("./graphTriple");

		let s = `${this.name || ""}`;
		if (!_.isNil(this.type)) {
			s += `:${this.type}`;
		}
		if (!_.isNil(this.data)) {
			// the data is always a dictionary since otherwise the regex would not have picked it up

			s += GraphTriple.toCypherData(this.data);
		}
		return `[${s}]`;
	}
}

module.exports = TripleEdge;
