const utils = require("@graphminer/utils");
const strings = utils.strings;

const EntityBase = require("./entityBase");

const _ = require("lodash");
const ObjectProperty = require("./objectProperty");
const EntityType = require("./entityType");

/**
 * Entity or instance defines a concrete piece of data based on a predefined type.
 */
class Entity extends EntityBase {
	/**
	 * @type EntityType
	 */
	entityType;
	/**
	 * @type *
	 */
	values;
	/**
	 * @type *
	 */
	objects;

	/**
	 * Creates a new instance.
	 * @constructor
	 * @param entityType {EntityType} An entity type.
	 * @param name {string} The name of the entity.
	 */
	constructor(entityType, name) {
		if (utils.isEmpty(entityType)) {
			super("Unknown", name);
			this.entityType = null;
		} else {
			const EntityType = require("./entityType");

			if (!(entityType instanceof EntityType)) {
				throw new Error(strings.ShoudBeType("entityType", "EntityType", "Entity"));
			}
			super(entityType.name, name);
			this.entityType = entityType;
		}

		this.values = {};
		this.objects = {};
	}

	/**
	 * A sealed entity means the type has not been assigned and the entity can't be altered.
	 * @returns {*}
	 */
	get isSealed() {
		return _.isNil(this.entityType);
	}

	/**
	 * Deserializes an entity.
	 * @param entityType {EntityType} An entity type.
	 * @param json {*} The data to deserialize.
	 * @returns {Entity}
	 */
	static fromJSON(entityType, json) {
		// if the type is nog given it creates a sealed/orphaned entity

		let e = new Entity(entityType, json.name);
		if (!utils.isEmpty(json.id)) {
			e.id = json.id;
		}
		if (utils.isEmpty(entityType)) {
			// data can't be checked against the schema
			e = _.assign(e, json);
		} else {
			const props = entityType.valueProperties;
			for (let p of props) {
				e.setValue(p.name, json[p.name]);
			}
			e.description = json.description;
		}
		return e;
	}

	/**
	 * Returns the value or object property.
	 * @param options {string|ValueProperty|ObjectProperty} The name of a value/object property, a ValueProperty or an ObjectProperty.
	 * @returns {*|null|string}
	 */
	get(options) {
		let found = this.getValue(options);
		if (!utils.isEmpty(found)) {
			return found;
		}
		return this.getObject(options);
	}

	/**
	 * Gets the value of the specified value property
	 * @param options {string|ValueProperty}
	 * @returns {*}
	 * @example
	 *
	 * const personType = new EntityType("Person");
	 * personType.addValueProperty("age","Number");
	 * const person = new Entity(personType, "Anna");
	 * person.setValue("age", 34);
	 * person.getValue("age");
	 */
	getValue(options) {
		const ValueProperty = require("./valueProperty");
		if (_.isString(options)) {
			const valuePropertyName = options;
			if (valuePropertyName === "description") {
				return this.description;
			}
			if (valuePropertyName === "id") {
				return this.id;
			}
			if (this.isSealed) {
				return this[valuePropertyName];
			} else {
				if (this.valuePropertyExists(valuePropertyName)) {
					return this.values[valuePropertyName];
				}
			}
		} else if (options instanceof ValueProperty) {
			const valuePropertyName = options.name;
			if (this.isSealed) {
				return this[valuePropertyName];
			} else {
				if (this.valuePropertyExists(valuePropertyName)) {
					return this.values[valuePropertyName];
				}
			}
		}
		return null;
	}

	/**
	 * Sets the value of the property.
	 * Note that the type is validated.
	 * @param valuePropertyName {string} The name of the property.
	 * @param value {*} The value to set.
	 */
	setValue(valuePropertyName, value) {
		if (this.isSealed) {
			throw new Error(strings.SealedEntity());
		}
		if (valuePropertyName === "description") {
			this.description = value;
		} else if (this.valuePropertyExists(valuePropertyName)) {
			this.#isValidValue(valuePropertyName, value);
			this.values[valuePropertyName] = value;
		} else {
			throw new Error(strings.MemberDoesNotExist(valuePropertyName, this.typeName));
		}
	}

	#isValidObject(objectPropertyName, obj) {
		const definition = this.entityType.getObjectProperty(objectPropertyName);
		const expectedType = definition.objectType;
		if (obj.typeName !== expectedType) {
			throw new Error(strings.ShoudBeType(objectPropertyName, expectedType, this.typeName));
		}
	}

	#isValidValue(valuePropertyName, value) {
		const definition = this.entityType.getValueProperty(valuePropertyName);
		const expectedType = definition.valueType;
		const isArrayType = expectedType.startsWith("[");
		let baseType = expectedType;
		if (isArrayType) {
			baseType = baseType.slice(1, -1);
		}
		const validator = this.#getValueValidator(baseType);
		if (isArrayType) {
			if (!_.isArray(value)) {
				throw new Error(strings.ShoudBeType(valuePropertyName, expectedType, this.typeName));
			}
			if (!_.every(value, validator)) {
				throw new Error(strings.ShoudBeType(valuePropertyName, expectedType, this.typeName));
			}
		} else {
			// we'll accept null and undefined
			if (_.isNil(value)) {
				return true;
			}
			if (!validator(value)) {
				throw new Error(strings.ShoudBeType(valuePropertyName, expectedType, this.typeName));
			}
		}
	}

	#getValueValidator(baseTypeName) {
		switch (baseTypeName.toLowerCase()) {
			case "number":
				return _.isNumber;
			case "string":
				return _.isString;
			case "boolean":
				return _.isBoolean;
			default:
				throw new Error(strings.Invalid(baseTypeName, "Entity.validateValue"));
		}
	}

	setObject(objectPropertyName, obj) {
		if (this.isSealed) {
			throw new Error(strings.SealedEntity());
		}
		if (this.objectPropertyExists(objectPropertyName)) {
			this.#isValidObject(objectPropertyName, obj);
			this.objects[objectPropertyName] = obj;
		} else {
			throw new Error(strings.MemberDoesNotExist(objectPropertyName, this.typeName));
		}
	}

	/**
	 * Returns the object for the given object property.
	 * @param options  {string|ObjectProperty} The name of the object property or an {@link ObjectProperty}.
	 * @returns {null|*}
	 */
	getObject(options) {
		if (_.isString(options)) {
			const objectPropertyName = options.toString().trim();
			if (this.isSealed) {
				return this[objectPropertyName];
			} else {
				if (this.objectPropertyExists(objectPropertyName)) {
					return this.objects[objectPropertyName];
				}
			}
			return null;
		} else if (options instanceof ObjectProperty) {
			return this.getObject(options.name);
		} else {
			throw new Error(strings.WrongArguments("Entity.getObject"));
		}
	}

	valuePropertyExists(valuePropertyName) {
		return !utils.isEmpty(_.find(this.entityType.valueProperties, { name: valuePropertyName }));
	}

	objectPropertyExists(objectPropertyName) {
		return !utils.isEmpty(_.find(this.entityType.objectProperties, { name: objectPropertyName }));
	}

	getValueProperty(valuePropertyName) {
		return this.entityType.getValueProperty(valuePropertyName);
	}

	getObjectProperty(objectPropertyName) {
		return this.entityType.getObjectProperty(objectPropertyName);
	}

	toJSON(includeObjects = false) {
		const m = super.toJSON();
		let props = this.entityType.valueProperties;
		for (let p of props) {
			m[p.name] = this.getValue(p.name);
		}
		if (includeObjects) {
			props = this.entityType.objectProperties;
			for (let p of props) {
				m[p.name] = this.getObject(p.name).toJSON();
			}
		}
		return m;
	}
}

module.exports = Entity;
