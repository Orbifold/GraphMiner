const EntityBase = require("./entityBase");
const {Utils,Strings} = require("@graphminer/Utils");

const _ = require("lodash");

/**
 * An object property is like an edge between objects.
 * The name is the label on the edge and the object type is
 * the type of the target/sink.
 * The subject type is the type of the source and is set when the
 * property is added to a type.
 */
class ObjectProperty extends EntityBase {
	#objectType;
	#subjectType;

	/**
	 * Creates a new object property.
	 * @param propertyName {string} The name of the object property.
	 * @param objectType {string} The type of the object.
	 * @param [subjectType] {string} The parent or owner of this new property.
	 * @example
	 *
	 * const hasFriend = new ObjectProperty("hasFriend", "Person");
	 */
	constructor(propertyName, objectType, subjectType = null) {
		if (Utils.isEmpty(propertyName)) {
			throw new Error(Strings.IsNil("propertyName", "ObjectProperty"));
		}

		if (Utils.isEmpty(objectType)) {
			throw new Error(Strings.IsNil("objectType", "ObjectProperty"));
		}
		if (!_.isString(propertyName)) {
			throw new Error(Strings.WrongArgument("propertyName", typeof propertyName, "string", "ObjectProperty"));
		}
		if (!_.isString(objectType)) {
			throw new Error(Strings.WrongArgument("objectType", typeof objectType, "string", "ObjectProperty"));
		}
		// the subject is not an instance, using a string solves all sorts of circular references.
		if (!Utils.isEmpty(subjectType) && !_.isString(subjectType)) {
			throw new Error(Strings.WrongArgument("subjectType", typeof subjectType, "string", "ObjectProperty"));
		}
		super("ObjectProperty", propertyName);
		this.#objectType = objectType;
		this.#subjectType = subjectType;
	}

	/**
	 * Returns the object type of this property.
	 * @returns {string}
	 */
	get objectType() {
		return this.#objectType;
	}

	/**
	 * Sets the object type of this property.
	 * Note that the existence of the given type is not checked until it's added to the store.
	 * @param v {string} The type name.
	 */
	set objectType(v) {
		if (Utils.isEmpty(v)) {
			throw new Error(Strings.IsNil("objectType", "ObjectProperty"));
		}
		if (!_.isString(v)) {
			throw new Error(Strings.WrongArgument("objectType", typeof v, "string", "ObjectProperty.objectType"));
		}
		// whether the type exists will be checked when adding to the entities and if the schema is enforced
		this.#objectType = v;
	}

	/**
	 * Returns the type owning this value property.
	 * @returns {Strings}
	 */
	get subjectType() {
		return this.#subjectType;
	}

	/**
	 * Sets the type owning this property.
	 * @param v {string} The name of the type.
	 */
	set subjectType(v) {
		if (!Utils.isEmpty(v) && !_.isString(v)) {
			throw new Error(Strings.WrongArgument("subjectType", typeof v, "string", "ObjectProperty.subjectType"));
		}
		this.#subjectType = v;
	}

	/**
	 * Deserializes to an object property.
	 * @param json
	 * @returns {ObjectProperty}
	 */
	static fromJSON(json) {
		Utils.validateJsonIsForType(json, "ObjectProperty");
		const prop = new ObjectProperty(json.name, json.objectType, json.subjectType);
		if (!Utils.isEmpty(json.id)) {
			prop.id = json.id;
		}
		if (!Utils.isEmpty(json.description)) {
			prop.description = json.description;
		}

		return prop;
	}

	/**
	 * Validates the serialized object property.
	 * Note that this does not check cross-references,
	 * this can be done via {@link Entities.validate}
	 * @param json {*} A serialized object property.
	 */
	static validate(json) {
		if (Utils.isEmpty(json)) {
			throw new Error(Strings.IsNil("json", "ObjectProperty.validate"));
		}
		if (json.typeName !== "ObjectProperty") {
			throw new Error(Strings.WrongDeserializationType(json.typeName, "ObjectProperty"));
		}
		if (Utils.isEmpty(json.id)) {
			throw new Error(Strings.IsNil("id", "ObjectProperty.validate"));
		}
		if (Utils.isEmpty(json.objectType)) {
			throw new Error(Strings.IsNil("objectType", "ObjectProperty.validate"));
		}
		if (!_.isString(json.name)) {
			throw new Error(Strings.WrongArgument("propertyName", typeof json.name, "string", "ObjectProperty"));
		}
		if (!_.isString(json.objectType)) {
			throw new Error(Strings.WrongArgument("objectType", typeof json.objectType, "string", "ObjectProperty"));
		}

		// the subject type can be specified but will be ignored or set
	}

	/** @inheritdoc */
	clone() {
		const json = this.toJSON();
		const prop = ObjectProperty.fromJSON(json);
		prop.id = Utils.id();
		return prop;
	}

	/** @inheritdoc */
	toJSON() {
		const m = super.toJSON();
		m.objectType = this.#objectType;
		m.subjectType = this.#subjectType;
		return m;
	}
}

module.exports = ObjectProperty;
