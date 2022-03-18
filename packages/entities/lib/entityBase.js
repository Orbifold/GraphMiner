const utils = require("@graphminer/utils");
const strings = utils.strings;

/**
 * Base class for entities.
 */
class EntityBase {
	/**
	 * Base class for entities and types.
	 * @abstract
	 * @constructor
	 * @param typeName {string} The name of the type.
	 * @param name {string} The name of the item.
	 * @see Entity
	 * @see EntityType
	 */
	constructor(typeName, name) {
		if (this.constructor === EntityBase) {
			throw new Error(strings.AbstractClass("EntityBase"));
		}
		if (utils.isEmpty(typeName)) {
			throw new Error(strings.IsNil("typeName"));
		}
		this.typeName = typeName;
		this.id = utils.id();
		this.name = name;
		this.description = null;
	}

	/**
	 * Serializes this item.
	 * Inheritors typically implement a static 'fromJSON' method to
	 * instantiate something from the outputted JSON.
	 *
	 *
	 * Note that 'JSON.stringify' calls this method internally.
	 * @example
	 * // to call the serialization automatically use
	 * JSON.stringify(JSON.parse(item))
	 * @returns {*}
	 */
	toJSON() {
		return {
			id: this.id,
			typeName: this.typeName,
			name: this.name,
			description: this.description,
		};
	}

	/**
	 * Returns a clone of this entity.
	 * Note that the id of the clone is changed.
	 * @returns EntityBase
	 */
	clone() {
		throw new Error(strings.ForInheritors());
	}
}

module.exports = EntityBase;
