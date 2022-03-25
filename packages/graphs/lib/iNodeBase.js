const {Strings} = require("@graphminer/utils");

/**
 * @interface
 */
class INodeBase {
	parentId;

	toJSON() {
		throw new Error(Strings.InterfaceMethod());
	}
}

module.exports = INodeBase;
