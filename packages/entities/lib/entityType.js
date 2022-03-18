const EntityBase = require("./entityBase");
const _ = require("lodash");
const utils = require("@graphminer/utils");
const ValueProperty = require("./valueProperty");
const ObjectProperty = require("./objectProperty");
const Entity = require("./entity");
const strings = utils.strings;

class EntityType extends EntityBase {
	/**
	 * @type [ValueProperty]
	 */
	#valueProperties;
	#objectProperties;

	/**
	 * Creates a new entity type (class).
	 *
	 * @param entityTypeName {string} The name of the new type.
	 */
	constructor(entityTypeName) {
		if (utils.isEmpty(entityTypeName)) {
			throw new Error(strings.IsNil("entityTypeName", "EntityType"));
		}
		super("EntityType", entityTypeName);
		this.#valueProperties = [];
		this.#objectProperties = [];
	}

	get valueProperties() {
		return _.clone(this.#valueProperties);
	}

	get objectProperties() {
		return _.clone(this.#objectProperties);
	}

	static fromJSON(json) {
		utils.validateJsonIsForType(json, "EntityType");
		const e = new EntityType(json.name);
		if (!utils.isEmpty(json.id)) {
			e.id = json.id;
		}
		e.description = json.description;
		for (let k in json.valueProperties) {
			const def = json.valueProperties[k];
			e.addValueProperty(def.name, def.valueType);
		}
		for (let k in json.objectProperties) {
			const def = json.objectProperties[k];
			e.addObjectProperty(def.name, def.objectType);
		}
		return e;
	}

	addProperty(propertyName, propertyType) {
		if (ValueProperty.isValueType(propertyType)) {
			this.addValueProperty(propertyName, propertyType);
		} else {
			this.addObjectProperty(propertyName, propertyType);
		}
	}

	addValueProperty(...options) {
		if (options.length === 0) {
			throw new Error(strings.IsNil("options", "EntityType.addValueType"));
		} else if (options.length === 1) {
			const valueProperty = options[0];
			if (!(valueProperty instanceof ValueProperty)) {
				throw new Error(strings.ShoudBeType(options, "ValueProperty or (name, type)", "EntityType.addValueType"));
			}
			this.#valueProperties.push(valueProperty);
		} else if (options.length === 2) {
			this.#addValuePropertyFromValues(options[0], options[1]);
		} else {
			throw new Error(strings.WrongArguments("EntityType.addValueType"));
		}
	}

	/**
	 * Adds an object property to this type.
	 * @param options {ObjectProperty|(string,string)} Either an {@link ObjectProperty} or the name and type.
	 */
	addObjectProperty(...options) {
		if (options.length === 0) {
			throw new Error(strings.IsNil("options", "EntityType.addObjectProperty"));
		} else if (options.length === 1) {
			const objectProperty = options[0];
			if (!(objectProperty instanceof ObjectProperty)) {
				throw new Error(strings.ShoudBeType(options, "ObjectProperty or (name, type)", "EntityType.addObjectProperty"));
			}
			this.#objectProperties.push(objectProperty);
		} else if (options.length === 2) {
			this.#addObjectPropertyFromValues(options[0], options[1]);
		} else {
			throw new Error(strings.WrongArguments("EntityType.addObjectProperty"));
		}
	}

	#addValuePropertyFromValues(propertyName, propertyType) {
		if (utils.isEmpty(propertyName)) {
			throw new Error(strings.IsNil("propertyName", "EntityType.addValueProperty"));
		}
		if (utils.isEmpty(propertyType)) {
			throw new Error(strings.IsNil("propertyType", "EntityType.addValueProperty"));
		}
		propertyType = _.capitalize(propertyType.toString().trim());
		if (!ValueProperty.isValueType(propertyType)) {
			throw new Error(strings.Invalid(propertyType, "EntityType.addValueProperty"));
		}
		if (this.valuePropertyExists(propertyName)) {
			throw new Error(strings.ExistsAlready(propertyName, propertyType));
		}
		const prop = new ValueProperty(propertyName, propertyType, this.name);
		this.#valueProperties.push(prop);
	}

	#addObjectPropertyFromValues(propertyName, objectType) {
		if (utils.isEmpty(propertyName)) {
			throw new Error(strings.IsNil("propertyName", "EntityType.addObjectProperty"));
		}

		if (utils.isEmpty(objectType)) {
			throw new Error(strings.IsNil("objectType", "EntityType.addObjectProperty"));
		}
		if (this.objectPropertyExists(propertyName)) {
			throw new Error(strings.ExistsAlready(propertyName, "EntityType.addObjectProperty"));
		}
		const prop = new ObjectProperty(propertyName, objectType, this.name);
		this.#objectProperties.push(prop);
	}

	getValueProperty(valuePropertyName) {
		if (this.valuePropertyExists(valuePropertyName)) {
			return _.find(this.#valueProperties, { name: valuePropertyName }).clone();
		}
		return null;
	}

	getObjectProperty(objectPropertyName) {
		if (this.objectPropertyExists(objectPropertyName)) {
			return _.find(this.#objectProperties, { name: objectPropertyName }).clone();
		}
		return null;
	}

	removeValueProperty(propertyName) {
		delete this.#valueProperties[propertyName];
	}

	removeObjectProperty(propertyName) {
		delete this.#objectProperties[propertyName];
	}

	valuePropertyExists(propertyName) {
		return _.some(this.#valueProperties, { name: propertyName });
	}

	objectPropertyExists(propertyName) {
		return _.some(this.#objectProperties, { name: propertyName });
	}

	toJSON() {
		const m = super.toJSON();
		m.valueProperties = this.#valueProperties.map((p) => p.toJSON());
		m.objectProperties = this.#objectProperties.map((p) => p.toJSON());
		return m;
	}

	/**
	 * Returns an instance of the current entity type.
	 * @param options {string|*} Either the name of the entity or the data to pass.
	 * @returns {Entity}
	 */
	createInstance(options) {
		const Entity = require("./entity");
		let entityName;
		if (_.isString(options)) {
			entityName = options.toString().trim();
			return new Entity(this, entityName);
		} else if (_.isPlainObject(options)) {
			return Entity.fromJSON(this, options);
		} else {
			throw new Error(strings.WrongArguments("EntityType.createInstance"));
		}
	}
}

module.exports = EntityType;
