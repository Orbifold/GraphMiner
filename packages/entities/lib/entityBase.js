const {Utils, Strings} = require("@graphminer/Utils");


/**
 * Base class for entities.
 */
class EntityBase {
	/**
	 * The name of the element.
	 * The class inheriting from this base class defines the meaning of 'name'.
	 * @type string|null
	 */
	name;

	/**
	 * @type string|null
	 */
	description;

	/**
	 * @type string
	 */
	id;

	/**
	 * For time filtering and alike.
	 * @type number|null
	 */
	timestamp;

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
			throw new Error(Strings.AbstractClass("EntityBase"));
		}
		if (Utils.isEmpty(typeName)) {
			throw new Error(Strings.IsNil("typeName"));
		}
		this.typeName = typeName;
		this.id = Utils.id();
		this.name = name;
		this.description = null;
		this.timestamp = null;
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
		throw new Error(Strings.ForInheritors());
	}
}

module.exports = EntityBase;
