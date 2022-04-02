const { Utils, Strings } = require("@graphminer/Utils");
const EntityBase = require("./entityBase");
const _ = require("lodash");
const SpaceUtils = require("./spaceUtils");

/**
 * **Entity** or **instance** defines a concrete piece of data based on a predefined type.
 *
 * - You can set the values and objects (links, connections...) via the {@link setValue}, {@link setValues} and {@link setObject} methods.
 * - The instance is not saved if you change its attributes (values and links), you need to explicitly save it via {@link EntitySpace.upsertInstance} or {@link save}.
 */
class Entity extends EntityBase {
	/**
	 * The entity type of this instance.
	 * If nil this means an untyped instance and the values and links are not checked against the schema.
	 * @type EntityType|null
	 */
	entityType;
	/**
	 * @type *
	 */
	values;
	/**
	 * The object properties of this instance.
	 * A dictionary with the object property name as key and the value is an array of either entity id's or serialized entities if it's a detached instance.
	 * @type {{}}
	 */
	objects;

	/**
	 * Ths space this instance belongs to.
	 * - If is nil this is a floating instance.
	 * - A floating or detached instance can always be saved via {@link EntitySpace.upsertInstance}.
	 * @type EntitySpace
	 */
	space;

	/**
	 * An untyped entity has no schema, i.e. the {@link entityType} is nil.
	 * @returns {boolean}
	 */
	get isUntyped() {
		return _.isNil(this.entityType);
	}

	/**
	 * A typed entity has an {@link entityType}.
	 * @returns {boolean}
	 */
	get isTyped() {
		return !this.isUntyped;
	}

	/**
	 * You likely should not create an instance via this constructor,
	 * use {@link typed} or {@link untyped} instead.
	 *
	 * - This will create an untyped instance with {@link typeName} equal ot 'Unknown'.
	 * - You can still set the {@link entityType} after creating an instance via the the constructor but it's easier via the {@link typed} method.
	 * @constructor
	 */
	constructor() {
		super("Unknown", null);
		this.space = null;
		this.values = {};
		this.objects = {};
	}

	/**
	 * Creates a typed instance.
	 * - A typed instance has an {@link entityType} defined. All properties are defined via this entity type.
	 * - An untyped instance has no {@link entityType} and you can define value and object properties arbitrarily.
	 * @see untyped
	 * @param entityType {EntityType|string|*} An entity type, the name of a type or a serialized type.
	 * @param entitySpec {Entity|string|*} The specs of the instance.
	 * @returns {Entity}
	 */
	static typed(entityType, entitySpec = null) {
		if (Utils.isEmpty(entityType)) {
			throw new Error(Strings.IsNil("entityType", "Entity.typed"));
		}
		const EntityType = require("./entityType");

		if (!(entityType instanceof EntityType)) {
			throw new Error(Strings.ShoudBeType("entityType", "EntityType", "Entity"));
		}
		const entity = new Entity();
		entity.entityType = entityType;
		entity.typeName = entityType.name;
		entity.space = entityType.space;
		if (Utils.isDefined(entitySpec)) {
			if (_.isString(entitySpec)) {
				entity.name = entitySpec.toString().trim();
			} else if (_.isPlainObject(entitySpec)) {
				// can contain object props as well
				if (entitySpec.links) {
					throw new Error("Defining a typed entity with object properties is not possible through this method. Use the EntitySpace instead.");
				}
				// whatever remains are value props
				entity.setValues(entitySpec);
			} else if (_.isObject(entitySpec)) {
				// if toJSON is defined this will use it
				entity.setValues(JSON.parse(JSON.stringify(entitySpec)));
			} else {
				throw new Error("Not sure how to assign the instance data from the given object.");
			}
		}
		if (Utils.isEmpty(entity.id)) {
			entity.id = Utils.id();
		}
		return entity;
	}

	/**
	 * Creates an untyped instance.
	 * - Untyped does not mean without a type name. You need a type name but the schema of the type is undefined.
	 * @see typed
	 * @param typeName {string} The name of the type. Since it's just a name and not a full {@link EntityType} this instance will be without a schema. Values and links will not be checked.
	 * @param data {*} The properties to set on the instance.
	 */
	static untyped(typeName, data = null) {
		if (Utils.isEmpty(typeName)) {
			throw new Error(Strings.IsNil("entityType", "Entity.typed"));
		}
		if (!_.isString(typeName)) {
			throw new Error(Strings.ShoudBeType("typeName", "string", "Entity.untyped"));
		}
		const entity = new Entity();
		entity.entityType = null;
		entity.typeName = typeName;
		entity.space = null;

		if (Utils.isDefined(data)) {
			if (Utils.isDefined(data.id)) {
				entity.id = data.id;
			}
			if (_.isString(data)) {
				entity.name = data.toString().trim();
			} else if (_.isPlainObject(data)) {
				entity.setValues(data);
			} else if (_.isObject(data)) {
				// if toJSON is defined this will use it
				entity.setValues(JSON.parse(JSON.stringify(data)));
			} else {
				throw new Error("Not sure how to assign the instance data from the given object.");
			}
		}
		return entity;
	}

	/**
	 * Deserializes an entity.
	 * @param entityTypeSpec {EntityType|string|*} An entity type.
	 * @param json {*} The data to deserialize.
	 * @returns {Entity}
	 */
	static fromJSON(entityTypeSpec, json) {
		const typeName = SpaceUtils.getTypeNameFromSpecs(entityTypeSpec);

		let e = new Entity();
		e.typeName = typeName;
		e.name = json.name || null;
		if (!Utils.isEmpty(json.id)) {
			e.id = json.id;
		}
		// object props first
		if (json.links) {
			const links = json.links;
			// remove it so the value props can be assigned without this
			delete json.links;
			for (const link of links) {
				e.objects[link.name] = link.ids;
			}
		}
		if (Utils.isEmpty(entityTypeSpec) || _.isString(entityTypeSpec)) {
			// data can't be checked against the schema
			e = _.assign(e, json);
			e.entityType = null;
		} else {
			const props = entityTypeSpec.valueProperties;
			for (let p of props) {
				e.setValue(p.name, json[p.name], false);
			}
			e.description = json.description;
			e.name = json.name;
			e.space = entityTypeSpec.space;
			e.entityType = entityTypeSpec;
		}
		return e;
	}

	/**
	 * Returns the value or object property.
	 * @param propName {string|ValueProperty|ObjectProperty} The name of a value/object property, a ValueProperty or an ObjectProperty.
	 * @returns {*|null|string}
	 */
	async get(propName) {
		const keys = _.keys(this.values);
		if (_.includes(keys, propName)) {
			return this.getValue(propName);
		}
		if (this.space) {
			return await this.space.getObject(this, propName);
		}
	}

	/**
	 * Gets the value of the specified value property
	 * @param valuePropSpec {string|ValueProperty} The value property or name.
	 * @returns {*}
	 * @example
	 *
	 * const personType = new EntityType("Person");
	 * personType.addValueProperty("age","Number");
	 * const person = new Entity(personType, "Anna");
	 * person.setValue("age", 34);
	 * person.getValue("age");
	 */
	getValue(valuePropSpec) {
		const ValueProperty = require("./valueProperty");
		if (_.isString(valuePropSpec)) {
			const valuePropertyName = valuePropSpec;
			if (_.includes(["id", "name", "description"], valuePropertyName)) {
				return this[valuePropertyName];
			}

			if (this.isUntyped) {
				return this.values[valuePropertyName] || null;
			} else {
				if (this.valuePropertyExists(valuePropertyName)) {
					return this.values[valuePropertyName] || null;
				}
			}
		} else if (valuePropSpec instanceof ValueProperty) {
			const valuePropertyName = valuePropSpec.name;
			if (_.includes(["id", "name", "description"], valuePropertyName)) {
				return this[valuePropertyName];
			}
			if (this.isUntyped) {
				return this.values[valuePropertyName];
			} else {
				if (this.valuePropertyExists(valuePropertyName)) {
					return this.values[valuePropertyName];
				}
			}
		}
		return null;
	}

	/**
	 * Returns all values of this instance.
	 * @returns {*}
	 */
	getValues() {
		const def = {
			id: this.id,
			name: this.name,
			description: this.description,
		};
		return _.assign(def, this.values);
	}

	/**
	 * Sets the value of the property.
	 * Note that the type is validated.
	 * @param valuePropertyName {string} The name of the property.
	 * @param value {*} The value to set.
	 * @param throwError {boolean} Throw an error if the property does not exist.
	 * @param save {boolean} Whether to save the instance after setting the value.
	 */
	setValue(valuePropertyName, value, throwError = true) {
		SpaceUtils.isSimpleValue(value);
		if (this.isUntyped) {
			if (_.includes(["id", "name", "description"], valuePropertyName)) {
				this[valuePropertyName] = value;
			} else {
				this.values[valuePropertyName] = value;
			}
		} else {
			if (_.includes(["id", "name", "description"], valuePropertyName)) {
				this[valuePropertyName] = value;
			} else if (this.valuePropertyExists(valuePropertyName)) {
				this.#isValidValue(valuePropertyName, value);
				this.values[valuePropertyName] = value;
			} else {
				if (throwError) {
					throw new Error(Strings.MemberDoesNotExist(valuePropertyName, this.typeName));
				}
			}
		}
	}

	/**
	 * Saves this entity in the entity's space.
	 * If this instance is detached (not part of a space) it will have no effect.
	 * @returns {Promise<void>}
	 */
	async save() {
		try {
			if (this.space) {
				if (this.isTyped) {
					await this.space.upsertInstance(this.entityType.name, this);
				} else {
					await this.space.upsertInstance(this.typeName, this);
				}
			}
		} catch (e) {
			console.warn(e.message);
		}
	}

	/**
	 * Set multiple value properties by means of a plain object.
	 * @param data {*} The data to assign.
	 */
	setValues(data) {
		if (!_.isPlainObject(data)) {
			throw new Error(Strings.ShoudBeType("data", "plain object", "Entity.setValues"));
		}
		if (Utils.isEmpty(this.entityType)) {
			// untyped entity
			_.forEach(data, (v, k) => {
				// these are intrinsic and not defined via value properties
				if (_.includes(["id", "name", "description"], k)) {
					if (_.isNil(v) || _.isString(v)) {
						this[k] = v;
					} else {
						throw new Error("Can only assign a string to id, name or description.");
					}
				} else {
					SpaceUtils.isSimpleValue(v);
					this.values[k] = v;
				}
			});
		} else {
			_.forEach(data, (v, k) => {
				// these are intrinsic and not defined via value properties
				if (_.includes(["id", "name", "description"], k)) {
					if (_.isNil(v) || _.isString(v)) {
						this[k] = v;
					} else {
						throw new Error("Can only assign a string to id, name or description.");
					}
				} else {
					// ignore invalid ones and don't throw an error
					// save in the end in one go rather than one prop at a time
					this.setValue(k, v, false);
				}
			});
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
		const validator = SpaceUtils.getValueValidator(baseType);
		if (isArrayType) {
			if (!_.isArray(value)) {
				throw new Error(Strings.ShoudBeType(valuePropertyName, expectedType, this.typeName));
			}
			if (!_.every(value, validator)) {
				throw new Error(Strings.ShoudBeType(valuePropertyName, expectedType, this.typeName));
			}
		} else {
			// we'll accept null and undefined
			if (_.isNil(value)) {
				return true;
			}
			if (!validator(value)) {
				throw new Error(Strings.ShoudBeType(valuePropertyName, expectedType, this.typeName));
			}
		}
	}

	/**
	 * Creates a link to another instance.
	 * @param objectPropertySpec {ObjectProperty|string} An object property or name.
	 * @param instance {Entity} Another instance.
	 */
	setObject(objectPropertySpec, instance) {
		if (!(instance instanceof Entity)) {
			throw new Error(Strings.ShoudBeType("instance", "Entity", "Entity.setObject"));
		}
		const objPropName = SpaceUtils.getObjectNameFromSpecs(objectPropertySpec);
		if (this.isUntyped) {
			// SpaceUtils.isValidObject(objSpec);
		} else {
			// const entityType = this.entityType
			const objProperty = this.getObjectProperty(objPropName);
			SpaceUtils.isValidObject(instance, objProperty);
			if (this.objectPropertyExists(objectPropertySpec)) {
				SpaceUtils.isValidObject(objectPropertySpec, instance);
			} else {
				throw new Error(Strings.MemberDoesNotExist(objectPropertySpec, this.typeName));
			}
		}
		this.#pushObjectProperty(objPropName, instance);
	}

	#pushObjectProperty(objPropName, obj) {
		if (!_.isObject(obj)) {
			throw new Error(Strings.ShoudBeType("obj", "object", "Entity.#pushObjectProperty"));
		}
		if (_.isNil(this.objects[objPropName])) {
			this.objects[objPropName] = [];
		}
		// ensure it's not there yet
		const found = _.find(this.objects[objPropName], (u) => {
			if (_.isString(u)) {
				return u === obj.id;
			} else {
				return u.id === obj.id;
			}
		});
		if (_.isNil(found)) {
			if (this.space) {
				this.objects[objPropName].push(obj.id);
			} else {
				this.objects[objPropName].push(obj);
			}
		}
	}

	#removeObjectProperty(objPropName, id = null) {
		if (Utils.isEmpty(id)) {
			// clear the lot
			if (this.objects[objPropName]) {
				delete this.objects[objPropName];
			}
		} else {
			_.remove(this.objects[objPropName], (u) => (_.isString(u) ? u === id : u.id === id));
		}
	}

	removeObject(objectPropertySpec) {
		const objPropName = SpaceUtils.getObjectNameFromSpecs(objectPropertySpec);
		if (this.isUntyped) {
			this.#removeObjectProperty(objPropName);
		} else {
			if (this.objectPropertyExists(objectPropertySpec)) {
				this.#removeObjectProperty(objPropName);
			} else {
				throw new Error(Strings.MemberDoesNotExist(objectPropertySpec, this.typeName));
			}
		}
	}

	/**
	 * Returns the first object  for the given object property.
	 * @param objectPropertySpec  {string|ObjectProperty} The name of the object property or an {@link ObjectProperty}.
	 * @returns {null|*}
	 */
	getObject(objectPropertySpec) {
		const objPropertyName = SpaceUtils.getObjectNameFromSpecs(objectPropertySpec);
		return this.objects[objPropertyName]?.[0];
	}

	getObjects(objectPropertySpec = null) {
		if (Utils.isEmpty(objectPropertySpec)) {
			return this.objects;
		}
		const objPropertyName = SpaceUtils.getObjectNameFromSpecs(objectPropertySpec);
		return this.objects[objPropertyName] || [];
	}

	valuePropertyExists(valuePropertyName) {
		return !Utils.isEmpty(_.find(this.entityType.valueProperties, { name: valuePropertyName }));
	}

	objectPropertyExists(objectPropertyName) {
		return !Utils.isEmpty(_.find(this.entityType.objectProperties, { name: objectPropertyName }));
	}

	/**
	 * Returns the value property with the specified name.
	 *
	 * Note: this returns the definition, not the value. Use {@link getValue} to get a concrete value.
	 * @param valuePropertyName {string} The name of the property.
	 * @returns {ValueProperty}
	 */
	getValueProperty(valuePropertyName) {
		if (this.isTyped) {
			return this.entityType.getValueProperty(valuePropertyName);
		}
		return null;
	}

	/**
	 * Returns the object property with the specified name.
	 *
	 * Note: this returns the definition, not the value. Use {@link getObject} to get a concrete value.
	 * @param objectPropertyName {string} The name of the property.
	 * @returns {ObjectProperty}
	 */
	getObjectProperty(objectPropertyName) {
		if (this.isTyped) {
			return this.entityType.getObjectProperty(objectPropertyName);
		}
		return null;
	}

	/**
	 *
	 * @returns {*}
	 */
	toJSON() {
		const m = super.toJSON();
		if (Utils.isEmpty(this.entityType)) {
			_.assign(m, this.values);
			m.links = [];
			let def;
			const objNames = _.keys(this.objects);
			for (let name of objNames) {
				def = {
					name,
					ids: this.objects[name].map((u) => (_.isString(u) ? u : u.id)),
				};
				m.links.push(def);
			}
		} else {
			let props = this.entityType.valueProperties;
			for (let p of props) {
				m[p.name] = this.getValue(p.name);
			}
			props = this.entityType.objectProperties;
			m.links = [];
			let def;
			for (let p of props) {
				// maybe the prop is defined but not necessarily a link present
				if (Utils.isDefined(this.objects[p.name])) {
					def = {
						name: p.name,
						ids: this.objects[p.name].map((u) => (_.isString(u) ? u : u.id)),
					};
					m.links.push(def);
				}
			}
		}
		return m;
	}

	/** @inheritdoc */ clone() {
		const e = Entity.fromJSON(this.entityType, this.toJSON());
		e.id = Utils.id();
		return e;
	}
}

module.exports = Entity;
