const EntityBase = require("./entityBase");
const utils = require("@graphminer/utils");
const EntityType = require("./entityType");
const strings = utils.strings;
const _ = require("lodash");

/**
 * A value property is equivalent to a standard data attribute.
 * When serialized this gives a simple key-value pair where the value is a
 * simple type (string, number...).
 *
 */
class ValueProperty extends EntityBase {
	#valueType;
	#subjectType;

	/**
	 * Creates a new value property.
	 * @constructor
	 * @param propertyName {string} The name of the property.
	 * @param valueType {string} The name of the type (String, Number...).
	 * @param [subjectType] {string} The type owning this property.
	 */
	constructor(propertyName, valueType, subjectType = null) {
		if (utils.isEmpty(propertyName)) {
			throw new Error(strings.IsNil("propertyName", "ValueProperty"));
		}
		// if (utils.isEmpty(subjectType)) {
		// 	throw new Error(strings.IsNil("subjectType", "ValueProperty"));
		// }
		if (utils.isEmpty(valueType)) {
			throw new Error(strings.IsNil("valueType", "ValueProperty"));
		}
		super("ValueProperty", propertyName);
		this.valueType = valueType;
		this.#subjectType = subjectType;
	}

	/**
	 * Returns the type owning this value property.
	 * @returns {strings}
	 */
	get subjectType() {
		return this.#subjectType;
	}

	/**
	 * Sets the type owning this property.
	 * @param v {string} The name of the type.
	 */
	set subjectType(v) {
		if (!utils.isEmpty(v) && !_.isString(v)) {
			throw new Error(strings.WrongArgument("subjectType", typeof v, "string", "ObjectProperty.subjectType"));
		}
		this.#subjectType = v;
	}

	/**
	 * Gets the type name of the value.
	 * @returns {string}
	 */
	get valueType() {
		return this.#valueType;
	}

	/**
	 * Sets the value type.
	 * @param v {string} The type name.
	 */
	set valueType(v) {
		this.#valueType = ValueProperty.formatValueType(v);
	}

	/**
	 * Deserializes to a value property.
	 * @param json {*} A serialized value property
	 * @returns {ValueProperty}
	 */
	static fromJSON(json) {
		utils.validateJsonIsForType(json, "ValueProperty");
		const prop = new ValueProperty(json.name, json.valueType, json.subjectType);
		if (!utils.isEmpty(json.id)) {
			prop.id = json.id;
		}
		if (!utils.isEmpty(json.description)) {
			prop.description = json.description;
		}

		return prop;
	}

	/**
	 * Validates the serialized value property.
	 * Note that this does not check cross-references,
	 * this can be done via {@link Entities.validate}
	 * @param json {*} A serialized value property.
	 */
	static validate(json) {
		// avoid circular reference
		const EntityType = require("./entityType");

		if (utils.isEmpty(json)) {
			throw new Error(strings.IsNil("json", "ValueProperty.validate"));
		}
		if (json.typeName !== "ValueProperty") {
			throw new Error(strings.WrongDeserializationType(json.typeName, "ValueProperty"));
		}
		if (utils.isEmpty(json.id)) {
			throw new Error(strings.IsNil("id", "ValueProperty.validate"));
		}
		if (utils.isEmpty(json.valueType)) {
			throw new Error(strings.IsNil("valueType", "ValueProperty.validate"));
		}
		if (!_.isString(json.name)) {
			throw new Error(strings.WrongArgument("propertyName", typeof json.name, "string", "ValueProperty"));
		}
		if (!ValueProperty.isValueType(json.valueType)) {
			throw new Error(strings.Invalid(json.valueType, "ValueProperty.validate"));
		}
	}

	static isValueType(propertyType) {
		if (utils.isEmpty(propertyType)) {
			return false;
		}
		if (!_.isString(propertyType)) {
			return false;
		}
		const simpleTypes = ["string", "number", "boolean", "bool"];
		const arrayTypes = simpleTypes.map((t) => `[${t}]`);
		const all = simpleTypes.concat(arrayTypes);
		return _.includes(all, propertyType.trim().toLowerCase());
	}

	/**
	 * Combines validation and formatting of a value type specification.
	 * @param valueTypeName {string} The name of a value type (String, [Number]...).
	 * @returns {string}
	 */
	static formatValueType(valueTypeName) {
		if (!ValueProperty.isValueType(valueTypeName)) {
			throw new Error(strings.InvalidValueType(valueTypeName));
		}
		const isArrayType = valueTypeName.startsWith("[");
		let baseType = valueTypeName;
		if (isArrayType) {
			baseType = baseType.slice(1, -1);
		}

		baseType = _.capitalize(baseType);
		if (baseType === "Bool") {
			baseType = "Boolean";
		}
		if (isArrayType) {
			return `[${baseType}]`;
		} else {
			return baseType;
		}
	}

	/** @inheritdoc */
	clone() {
		const json = this.toJSON();
		const prop = ValueProperty.fromJSON(json);
		prop.id = utils.id();
		return prop;
	}

	/** @inheritdoc */
	toJSON() {
		const m = super.toJSON();
		m.valueType = this.#valueType;
		m.subjectType = this.#subjectType;
		return m;
	}
}

module.exports = ValueProperty;
