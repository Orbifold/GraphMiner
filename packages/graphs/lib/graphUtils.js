const _ = require("lodash");
const { Utils, Strings } = require("@graphminer/Utils");

class GraphUtils {
	static GenericLinkTypeName = "Link";

	static getNodeFromSpecs(...nodeSpecs) {
		const [count, args] = Utils.getArguments(nodeSpecs);

		switch (count) {
			case 0:
				throw new Error("Could not turn the given input into a node definition.");
			case 1:
				let a = args[0];
				if (_.isObject(a) && !_.isPlainObject(a)) {
					return GraphUtils.getNodeFromSpecs(JSON.parse(JSON.stringify(a)));
				} else if (Utils.isStringOrNumber(a)) {
					return {
						id: a.toString().trim(),
						typeName: "Unknown",
					};
				} else if (_.isPlainObject(a)) {
					if (Utils.isDefined(a)) {
						if (Utils.isDefined(a.id) && Utils.isStringOrNumber(a.id)) {
							a.id = a.id.toString().trim();
						} else {
							a.id = Utils.id();
						}
						if (!Utils.isDefined(a.typeName) || !Utils.isStringOrNumber(a.typeName)) {
							a.typeName = "Unknown";
						}
						return a;
					}
				}
				break;
			case 2:
				let id = args[0];
				const name = args[1];
				if (Utils.isStringOrNumber(id)) {
					return {
						id: id.toString().trim(),
						name: name.toString().trim(),
						typeName: "Unknown",
					};
				}
				break;
		}
		throw new Error("Could not turn the given input into a node definition.");
	}

	/**
     * Tries to turn the given input into something that can be interpreted as an edge definition.

     *
     * @example
     * // using the helper function
     * const getEdge = (...e) => {
     * 			const found = GraphUtils.getEdgeFromSpecs(...e);
     * 			return [found.sourceId, found.targetId];
     * 		};
     * // all of the following will return ["1","2"]
     * getEdge(1,2);
     * getEdge("1->2");
     * getEdge({sourceId: 1, sourceId:2});
     *
     * @param edgeSpecs {*} An edge specification.
     */
	static getEdgeFromSpecs(...edgeSpecs) {
		const [count, args] = Utils.getArguments(edgeSpecs);
		let source, target, extra;
		switch (count) {
			case 0:
				throw new Error("Could not turn the given input into an edge definition.");
			case 1:
				return GraphUtils.getEdgeFromSpecsOneArgument(args[0]);
			case 2:
				source = args[0];
				target = args[1];
				if (Utils.isStringOrNumber(source) && Utils.isStringOrNumber(target)) {
					return {
						sourceId: source.toString(),
						targetId: target.toString(),
						typeName: GraphUtils.GenericLinkTypeName,
					};
				} else {
					throw new Error("Could not turn the given input into an edge definition.");
				}
			case 3:
				source = args[0];
				target = args[1];
				extra = args[2];
				let edge;
				if (Utils.isStringOrNumber(source) && Utils.isStringOrNumber(target)) {
					edge = {
						sourceId: source.toString(),
						targetId: target.toString(),
						typeName: GraphUtils.GenericLinkTypeName,
					};
				} else {
					throw new Error("Could not turn the given input into an edge definition.");
				}
				if (Utils.isStringOrNumber(extra)) {
					edge.name = extra.toString();
				} else if (_.isPlainObject(extra)) {
					_.assign(edge, extra);
				} else {
					throw new Error("Don't know how to assign the payload to the edge.");
				}
				return edge;
			default:
				throw new Error("Could not turn the given input into an edge definition.");
		}
	}

	/**
	 *
	 * @param edgeSpecs
	 * @param throwError
	 * @param returnArray
	 * @returns {string[]|{sourceId: string, targetId: string}|null|*[]|{sourceId: string, targetId: string}}
	 */
	static getEdgeFromSpecsOneArgument(edgeSpecs, throwError = true, returnArray = false) {
		if (Utils.isEmpty(edgeSpecs)) {
			if (throwError) {
				throw new Error("Could not turn the given input into an edge definition.");
			}
			return null;
		}
		if (_.isString(edgeSpecs)) {
			// something like 'a->b'
			if (edgeSpecs.indexOf("->") > -1) {
				const parts = edgeSpecs
					.split("->")
					.map((u) => u.trim())
					.filter((u) => u.length > 0); //?

				if (parts.length === 2) {
					const source = parts[0];
					const target = parts[1];
					if (Utils.isStringOrNumber(source) && Utils.isStringOrNumber(target)) {
						return returnArray
							? [source, target]
							: {
									sourceId: source.toString(),
									targetId: target.toString(),
									typeName: GraphUtils.GenericLinkTypeName,
							  };
					}
				}
			}
		} else if (_.isArray(edgeSpecs)) {
			if (edgeSpecs.length === 2) {
				const source = edgeSpecs[0];
				const target = edgeSpecs[1];
				if (Utils.isStringOrNumber(source) && Utils.isStringOrNumber(target)) {
					return returnArray
						? [source, target]
						: {
								sourceId: source.toString(),
								targetId: target.toString(),
								typeName: "GenericLink",
						  };
				}
			}
		} else if (_.isObject(edgeSpecs) || _.isPlainObject(edgeSpecs)) {
			if (edgeSpecs.sourceId && edgeSpecs.targetId && Utils.isStringOrNumber(edgeSpecs.sourceId) && Utils.isStringOrNumber(edgeSpecs.targetId)) {
				if (returnArray) {
					return [edgeSpecs.sourceId.toString(), edgeSpecs.targetId.toString()];
				} else {
					if (Utils.isUndefined(edgeSpecs.typeName)) {
						edgeSpecs.typeName = "Link";
					}
					return edgeSpecs;
				}
			}
		}
		if (throwError) {
			throw new Error("Could not turn the given input into an edge definition.");
		}
		return null;
	}
}

module.exports = GraphUtils;
