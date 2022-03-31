const { Strings } = require("@graphminer/utils");

/**
 * Defines the minimal node members.
 * @interface
 */
class INodeBase {
	/**
	 * The group id defines the 'box' or set this node belongs to.
	 * In a graph visualization context this means that this node sits inside a box where the group node acts as the group-node.
	 * @type string|null
	 */
	groupId = null;

	/**
	 * The unique id of the node.
	 * @type string
	 */
	id;

	/**
	 * The (not necessarily unique) name of the node.
	 * @type {string|null}
	 */
	name = null;

	/**
	 * The node type.
	 * This attribute is mostly there for compatibility with the GraphMiner Entities framework.
	 * @type {string}
	 */
	typeName = "Unknown";

	toJSON() {
		throw new Error(Strings.InterfaceMethod());
	}
}

module.exports = INodeBase;
