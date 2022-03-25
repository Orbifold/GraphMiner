const EntityBase = require("./entityBase");
const _ = require("lodash");
const { Utils, Strings } = require("@graphminer/Utils");
const ValueProperty = require("./valueProperty");
const ObjectProperty = require("./objectProperty");
const Entity = require("./entity");

class EntityType extends EntityBase {
	/**
	 * @type [ValueProperty]
	 */
	#valueProperties;
	#objectProperties;

	space;

	/**
	 * Creates a new entity type (class).
	 *
	 * @param entityTypeName {string} The name of the new type.
	 */
	constructor(entityTypeName) {
		if (Utils.isEmpty(entityTypeName)) {
			throw new Error(Strings.IsNil("entityTypeName", "EntityType"));
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
		Utils.validateJsonIsForType(json, "EntityType");
		const e = new EntityType(json.name);
		if (!Utils.isEmpty(json.id)) {
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

	async addProperty(propertyName, propertyType) {
		if (ValueProperty.isValueType(propertyType)) {
			await this.addValueProperty(propertyName, propertyType);
		} else {
			this.addObjectProperty(propertyName, propertyType);
		}
	}

	addValueProperty(...options) {
		if (options.length === 0) {
			throw new Error(Strings.IsNil("options", "EntityType.addValueType"));
		} else if (options.length === 1) {
			const valueProperty = options[0];
			if (!(valueProperty instanceof ValueProperty)) {
				throw new Error(Strings.ShoudBeType(options, "ValueProperty or (name, type)", "EntityType.addValueType"));
			}
			this.#valueProperties.push(valueProperty);
		} else if (options.length === 2) {
			this.#addValuePropertyFromValues(options[0], options[1]);
		} else {
			throw new Error(Strings.WrongArguments("EntityType.addValueType"));
		}
	}

	/**
	 * Adds an object property to this type.
	 * @param options {ObjectProperty|(string,string)} Either an {@link ObjectProperty} or the name and type.
	 */
	addObjectProperty(...options) {
		if (options.length === 0) {
			throw new Error(Strings.IsNil("options", "EntityType.addObjectProperty"));
		} else if (options.length === 1) {
			const objectProperty = options[0];
			if (!(objectProperty instanceof ObjectProperty)) {
				throw new Error(Strings.ShoudBeType(options, "ObjectProperty or (name, type)", "EntityType.addObjectProperty"));
			}
			this.#objectProperties.push(objectProperty);
		} else if (options.length === 2) {
			this.#addObjectPropertyFromValues(options[0], options[1]);
		} else {
			throw new Error(Strings.WrongArguments("EntityType.addObjectProperty"));
		}
	}

	#addValuePropertyFromValues(propertyName, propertyType) {
		if (Utils.isEmpty(propertyName)) {
			throw new Error(Strings.IsNil("propertyName", "EntityType.addValueProperty"));
		}
		if (Utils.isEmpty(propertyType)) {
			throw new Error(Strings.IsNil("propertyType", "EntityType.addValueProperty"));
		}
		propertyType = _.capitalize(propertyType.toString().trim());
		if (!ValueProperty.isValueType(propertyType)) {
			throw new Error(Strings.Invalid(propertyType, "EntityType.addValueProperty"));
		}
		if (this.valuePropertyExists(propertyName)) {
			throw new Error(Strings.ExistsAlready(propertyName, propertyType));
		}
		const prop = new ValueProperty(propertyName, propertyType, this.name);
		this.#valueProperties.push(prop);
	}

	#addObjectPropertyFromValues(propertyName, objectType) {
		if (Utils.isEmpty(propertyName)) {
			throw new Error(Strings.IsNil("propertyName", "EntityType.addObjectProperty"));
		}

		if (Utils.isEmpty(objectType)) {
			throw new Error(Strings.IsNil("objectType", "EntityType.addObjectProperty"));
		}
		if (this.objectPropertyExists(propertyName)) {
			throw new Error(Strings.ExistsAlready(propertyName, "EntityType.addObjectProperty"));
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
		_.remove(this.#valueProperties, { name: propertyName });
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
	 * Creates an instance of the current entity type.
	 * - This adds the instance to the space where this EntityType resides.
	 * - If this EntityType is not part of a space an error is raised.
	 * @param instanceSpec {string|*} Either the name of the entity or the data to pass.
	 * @returns {Promise<Entity>}
	 */
	async createInstance(instanceSpec) {
		if (Utils.isEmpty(this.space)) {
			throw new Error("Cannot create an instance from a detached EntityType. Add it to an EntitySpace first.");
		}
		return this.space.createInstance(this, instanceSpec);
	}

	/**
	 * Creates an instance of the current type but does not add it to the space.
	 * @param instanceSpec
	 * @returns {Promise<Entity|null>}
	 */
	async createDetachedInstance(instanceSpec) {
		let instance = null;
		if (Utils.isEmpty(instanceSpec)) {
			return instance;
		} else if (_.isString(instanceSpec)) {
			instance = new Entity(this, instanceSpec);
		} else if (_.isPlainObject(instanceSpec)) {
			instance = Entity.fromJSON(this, instanceSpec);
		} else {
			throw new Error("Not sure how to create a detached instance from the given object.");
		}
		instance.space = null;
		return instance;
	}

	/** @inheritdoc */
	clone() {
		const e = EntityType.fromJSON(this.toJSON());
		// the clone should not have the identical id
		e.id = Utils.id();
		return e;
	}
}

module.exports = EntityType;
