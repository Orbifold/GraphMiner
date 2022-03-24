const {Strings, Utils} = require("@graphminer/Utils");
const _ = require("lodash");
const EntityType = require("./entityType");
const Entity = require("./entity");
const ValueProperty = require("./valueProperty");
const ObjectProperty = require("./objectProperty");
const SpaceUtils = require("./utils");

/**
 * Gateway to entities.
 * Strictly speaking an object-graph-mapper (OGM).
 * @example
 * // default saves things to ~/.graphminer/localStorage.json
 * const em = await EntitySpace.default();
 *
 * @example
 * // in-memory entity store
 * const em = new EntitySpace.inMemory();
 */
class EntitySpace {
	#store;

	/**
	 * When the schema is enforced the instances are checked against their entity type.
	 * @returns {boolean}
	 */
	get enforceSchema() {
		return this.settings.enforceSchema ?? true;
	}

	/**
	 * This property is normally set once when the space is created.
	 * Changing this property on the fly might lead to inconsistencies.
	 */
	set enforceSchema(v) {
		if (Utils.isEmpty(v)) {
			throw new Error(Strings.IsNil("value", "EntitySpace.enforceSchema"));
		}
		if (!_.isBoolean(v)) {
			throw new Error(Strings.ShoudBeType("enforceSchema", "boolean", "EntitySpace.enforceSchema"));
		}
		this.settings.enforceSchema = v;
	}

	/**
	 * The underlying entity store.
	 * It's set via the {@link init} method once and cannot be altered during the lifetime of the space.
	 */
	get store() {
		return this.#store;
	}

	constructor() {
	}

	/**
	 * Creates an in-memory entity space.
	 * @returns {Promise<EntitySpace>}
	 */
	static async inMemory() {
		const space = new EntitySpace();
		await space.init("memory");
		return space;
	}

	/**
	 * Creates an instance for the given type name and specs.
	 * @param typeName {string} The type name.
	 * @param instanceSpec {string|Entity|*} A type name, a type or a serialized type.
	 * @returns {Entity}
	 */
	static createInstanceFromSpecs(typeName, instanceSpec) {
		if (Utils.isEmpty(typeName)) {
			throw new Error(Strings.IsNil("typeName", "EntitySpace.createInstanceFromSpecs"));
		}
		if (Utils.isEmpty(instanceSpec)) {
			throw new Error(Strings.IsNil("instanceSpec", "EntitySpace.createInstanceFromSpecs"));
		}
		if (!_.isString(typeName)) {
			throw new Error(Strings.ShoudBeType("enforceSchema", "string", "EntitySpace.createInstanceFromSpecs"));
		}
		let entity = null;
		if (instanceSpec instanceof Entity) {
			entity = instanceSpec;
		} else if (_.isPlainObject(instanceSpec)) {
			entity = new Entity(null, instanceSpec.name || null);
		} else if (_.isString(instanceSpec)) {
			entity = new Entity(null, instanceSpec);
		} else {
			throw new Error("Don't know how to turn given data into an instance.");
		}
		entity.typeName = typeName;
		entity.id = instanceSpec.id || Utils.id();
		return entity;
	}

	/**
	 * Returns a random set of entities of the specified type.
	 * - If no type is given the entity type will be random.
	 * - If the amount specified is larger than the total, all of the entities will be returned.
	 * @param entityTypeSpec? {string} Optional type of entity to create.
	 * @param amount? {number} The amount of entities to create. Default is one.
	 * @returns {EntityBase|[EntityBase]} If the amount is one a single entity is returned, otherwise and array of the specified type.
	 */
	async randomInstances(entityTypeSpec = null, amount = 1) {
		let entityTypeName = null;
		if (!Utils.isEmpty(entityTypeSpec)) {
			// throw new Error(Strings.IsNil("entityTypeName", "EntitySpace.random"))
			const entityType = await this.getEntityType(entityTypeSpec);
			if (Utils.isEmpty(entityType)) {
				throw new Error(Strings.TypeDoesNotExist(_.isString(entityTypeSpec) ? entityTypeSpec : entityTypeSpec.name));
			}
			entityTypeName = entityTypeSpec.name;
		}
		if (amount < 1) {
			throw new Error("The amount should be an integer larger than zero.");
		}

		this.ensureStoreMethodExists("randomInstances");

		const found = await this.store.randomInstances(entityTypeName, amount);
		if (Utils.isEmpty(found)) {
			return [];
		}
		const coll = [];
		for (const item of found) {
			const entityType = await this.getEntityType(item.typeName);
			const instance = await Entity.fromJSON(entityType, item);
			if (instance) {
				coll.push(instance);
			}
		}
		return coll;
	}

	/**
	 * Fetches the names of the entity types.
	 * @returns {Promise<string[]>}
	 */
	async #getEntityTypeNames() {
		const types = await this.store.getEntityTypes();
		if (Utils.isEmpty(types)) {
			return [];
		}
		return types.map((u) => u.name);
	}

	/**
	 * Turns the given set of JSON into EntityType instances.
	 * @param jsonArray {*[]} Supposedly an array of serialized EntityType.
	 * @returns {*[]|*}
	 */
	#deserializeEntityTypes(jsonArray) {
		if (Utils.isEmpty(jsonArray)) {
			return [];
		}
		return jsonArray.map((u) => SpaceUtils.deserializeEntityType(u, this)).filter((u) => !_.isNil(u));
	}

	/**
	 * Initializes this entity manager.
	 *
	 * - no parameter: this will create an in-memory store
	 * - one parameters: this can be a strings specifying the local storage or a GraphMiner context object (when using as part of the GraphMiner plugin mechanism)
	 * - two parameters: a GraphMiner context and additional settings

	 * @returns {Promise<void>}
	 *
	 * @example
	 * // in-memory space with defaults (schema enforced)
	 * const entities = new EntitySpace();
	 * await entities.init();
	 *
	 * @example
	 * // schema not enforced, properties and types are not checked
	 * const entities = new EntitySpace();
	 * await entities.init(null, {enforceSchema: false});
	 */
	async init(...options) {
		const [amount, args] = Utils.getArguments(options);
		if (!Utils.isEmpty(this.store)) {
			console.warn("The EntitySpace was already initialized.");
			return;
		}
		let settings = {};

		const LocalEntityStore = require("./localEntityStore");

		switch (amount) {
			case 0:
				this.#store = await LocalEntityStore.inMemory();
				break;
			case 1:
				if (_.isString(args[0])) {
					const entityStore = new LocalEntityStore();
					await entityStore.init(null, args[0]);
					this.#store = entityStore;
				} else {
					const context = args[0];
					if (context["services"]) {
						this.#store = context["services"]["entitiesStore"];
					} else {
						throw new Error("First argument should be a string defining the local storage or a GraphMiner context object.");
					}
				}
				break;
			case 2:
				const entityStore = new LocalEntityStore();
				const context = args[0];
				settings = args[1];
				await entityStore.init(context, settings);
				this.#store = entityStore;
		}

		const defaults = {
			enforceSchema: true,
		};
		this.settings = _.assign(defaults, settings);
		await this.#ensureHasId();
	}

	/**
	 * Ensures that this space has an id.
	 * @returns {Promise<void>}
	 */
	async #ensureHasId() {
		const id = await this.getMetadata("id");
		if (Utils.isEmpty(id)) {
			await this.store.setMetadata("id", Utils.id());
		}
	}

	/**
	 * Adds a new entity type.
	 * @param options {EntityType|string} Either the name of the type or an EntityType.
	 * @returns {Promise<EntityType>}
	 */
	async addEntityType(options) {
		if (_.isString(options)) {
			const entityTypeName = options.toString().trim();
			const entityType = new EntityType(entityTypeName);
			await this.addEntityType(entityType);
			return entityType;
		} else if (options instanceof EntityType) {
			const entityType = options;
			// upsert will overwrite but adding it causes an exception if already there
			const found = await this.getEntityType(entityType.name);
			if (!Utils.isEmpty(found)) {
				throw new Error(Strings.ExistsAlready(entityType.name, "Entities"));
			}
			await this.upsertEntityType(entityType);
			return entityType;
		} else {
			throw new Error(Strings.WrongArguments("Entities.addEntityType"));
		}
	}

	/**
	 * Adds a value property to the type.
	 *
	 * @see removeValueProperty
	 * @param entityTypeSpec {EntityType|string} The name of a type or an EntityType.
	 * @param valuePropertyName {string} The name of the value property.
	 * @param valueType {string} The type of the value.
	 * @returns {Promise<ValueProperty>}
	 * @example
	 *
	 * personType.addValueType("Person", "age", "Number);
	 */
	async addValueProperty(entityTypeSpec, valuePropertyName, valueType) {
		if (Utils.isEmpty(valuePropertyName)) {
			throw new Error(Strings.IsNil("valuePropertyName", "EntitySpace.valuePropertyName"));
		}
		if (!_.isString(valuePropertyName)) {
			throw new Error(Strings.ShoudBeType("valuePropertyName", "string", "EntitySpace.addValueProperty"));
		}
		const entityTypeName = SpaceUtils.getTypeNameFromSpecs(entityTypeSpec);
		const entityType = await this.getEntityType(entityTypeSpec);
		if (Utils.isEmpty(entityType)) {
			throw new Error(Strings.TypeDoesNotExist(entityTypeName));
		}
		const prop = new ValueProperty(valuePropertyName, valueType, entityType.name);
		await entityType.addValueProperty(prop);
		await this.updateEntityType(entityType);
		return prop;
	}

	/**
	 * Removes the specified value property and optionally updates all instances.
	 * @param entityTypeSpec {EntityType|string} The name of a type or an EntityType.
	 * @param valuePropertyName {string} The name of the value property.
	 * @param removeFromInstances {boolean} If true it will remove the value from instances having the specified type.
	 * @returns {Promise<void>}
	 */
	async removeValueProperty(entityTypeSpec, valuePropertyName, removeFromInstances = true) {
		const entityTypeName = await SpaceUtils.getTypeNameFromSpecs(entityTypeSpec);
		const entityType = await this.getEntityType(entityTypeSpec);
		if (Utils.isEmpty(entityType)) {
			throw new Error(Strings.TypeDoesNotExist(entityTypeName));
		}
		entityType.removeValueProperty(valuePropertyName);

		await this.upsertEntityType(entityType);
		if (removeFromInstances) {
			await this.store.removeFieldFromInstances(entityTypeName, valuePropertyName);
		}
	}

	/**
	 *
	 * @param entityTypeSpec {EntityType|string} The name of a type or an EntityType.
	 * @param objectPropertySpec {ObjectProperty|string} An object property or name.
	 * @param removeFromInstances {boolean} If true it will remove the link from instances having the specified type.
	 * @returns {Promise<void>}
	 */
	async removeObjectProperty(entityTypeSpec, objectPropertySpec, removeFromInstances = true) {
		const entityTypeName = await SpaceUtils.getTypeNameFromSpecs(entityTypeSpec);
		const entityType = await this.getEntityType(entityTypeSpec);
		if (Utils.isEmpty(entityType)) {
			throw new Error(Strings.TypeDoesNotExist(entityTypeName));
		}
		const objectPropertyName = SpaceUtils.getObjectNameFromSpecs(objectPropertySpec);
		entityType.removeObjectProperty(objectPropertyName);
		await this.upsertEntityType(entityType);
		if (removeFromInstances) {
			await this.store.removeLinkFromInstances(entityTypeName, objectPropertyName);
		}
	}

	/**
	 * Adds an object property to the given entity type..
	 * - To effectively create an object property (link, edge) between two instances, use the {@link setObject} or {@link connect} methods.
	 * @param entityTypeSpec
	 * @param objectPropertyName
	 * @param objectTypeSpec
	 * @returns {Promise<void>}
	 */
	async addObjectProperty(entityTypeSpec, objectPropertyName, objectTypeSpec) {
		if (Utils.isEmpty(objectPropertyName)) {
			throw new Error(Strings.IsNil("objectPropertyName", "EntitySpace.addObjectProperty"));
		}
		if (!_.isString(objectPropertyName)) {
			throw new Error(Strings.ShoudBeType("objectPropertyName", "string", "EntitySpace.addObjectProperty"));
		}

		const sourceEntityTypeName = SpaceUtils.getTypeNameFromSpecs(entityTypeSpec);
		const sourceEntityType = await this.getEntityType(entityTypeSpec);
		if (Utils.isEmpty(objectTypeSpec)) {
			throw new Error(Strings.TypeDoesNotExist(sourceEntityTypeName));
		}
		const targetTypeName = SpaceUtils.getTypeNameFromSpecs(objectTypeSpec);
		let objectProperty;
		if (this.enforceSchema) {
			const targetEntityType = await this.getEntityType(targetTypeName);
			if (Utils.isEmpty(targetEntityType)) {
				throw new Error(Strings.TypeDoesNotExist(targetTypeName));
			}
		}
		objectProperty = new ObjectProperty(objectPropertyName, targetTypeName, sourceEntityTypeName);
		sourceEntityType.addObjectProperty(objectProperty);
		await this.updateEntityType(sourceEntityType);
	}

	/**
	 * Returns all registered entity types.
	 * @returns {Promise<*>}
	 */
	async getAllEntityTypes() {
		this.ensureStoreMethodExists("getEntityTypes");
		const found = await this.store.getEntityTypes();
		return found.map((t) => EntityType.fromJSON(t));
	}

	/**
	 * Adds an instance to the store.
	 * - This will raise an error if an instance with the same id already exists. To update one, use the {@link upsertInstance} method.
	 * @see upsertInstance
	 * @param entityTypeSpec {string|EntityType} An entity type or type name.
	 * @param entitySpec {string|*} If a string is given this will be the name of the instance. If data is supplied it will be assigned to the instance.
	 * @returns {Promise<Entity>}
	 */
	async createInstance(entityTypeSpec, entitySpec) {
		const entityTypeName = await SpaceUtils.getTypeNameFromSpecs(entityTypeSpec);
		const entity = await this.createDetachedInstance(entityTypeSpec, entitySpec);
		if (this.enforceSchema) {
			const exists = await this.getEntityType(entityTypeName);
			if (!exists) {
				throw new Error(Strings.TypeDoesNotExist(entityTypeName));
			}
		}
		if (entity) {
			// difference between create and upsert is the error if already present
			const exists = await this.instanceExists(entity.id);
			if (exists) {
				throw new Error(`An instance with id '${entity.id}' already exists.`);
			}
			await this.store.upsertInstance(entity);
			entity.space = this;
			return entity;
		}
		return null;
	}

	/**
	 * Returns whether an instance with the given id exists.
	 * @param id {string} The id of an instance.
	 * @returns {Promise<boolean>}
	 */
	async instanceExists(id) {
		if (Utils.isEmpty(id)) {
			return false;
		}
		const found = await this.store.getInstanceById(id);
		return Utils.isDefined(found);
	}

	/**
	 * Adds a new entity type.
	 * @param options {*|string} The name of a new type or an instance of {@link EntityType}.
	 * @returns {Promise<EntityType>} The entity type.
	 */
	async upsertEntityType(options) {
		// todo: what happens with the instances when props are removed?
		this.ensureStoreMethodExists("upsertEntityType");
		if (_.isString(options)) {
			const exists = await this.entityTypeExists(options);
			if (exists) {
				throw new Error(Strings.ExistsAlready(options, "Entities"));
			}
			const entityType = new EntityType(options);
			await this.store.upsertEntityType(entityType);
			entityType.space = this;
			return entityType;
		} else if (options instanceof EntityType) {
			const entityType = options;
			await this.validateEntityType(entityType);
			await this.store.upsertEntityType(entityType);
			entityType.space = this;
			return entityType;
		} else {
			throw new Error(Strings.Invalid(typeof options, "Entities.upsertEntityType"));
		}
	}

	/**
	 * Adds an entity type from its JSON format.
	 * @param json {*} A serialized {@link EntityType}.
	 * @returns {Promise<string>} The id of the entity type.
	 */
	async addEntityTypeFromJson(json) {
		if (Utils.isEmpty(json)) {
			throw new Error(Strings.IsNil("Entities", "addEntityTypeFromJson"));
		}
		if (!_.isPlainObject(json)) {
			throw new Error(Strings.ShoudBeType("json", "JSON", "Entities.addEntityTypeFromJson"));
		}
		const entityType = EntityType.fromJSON(json);
		return await this.upsertEntityType(entityType);
	}

	/**
	 * Returns how many entity types are registered.
	 * @returns {Promise<number>}
	 */
	async countEntityTypes() {
		this.ensureStoreMethodExists("countEntityTypes");
		return await this.store.countEntityTypes();
	}

	/**
	 * Returns how many entities are in the space.
	 * @returns {Promise<number>}
	 */
	async countEntities() {
		this.ensureStoreMethodExists("countEntities");
		return await this.store.countEntities();
	}

	/**
	 * Ensures that the name is not already in the space.
	 * @param entityType
	 * @returns {Promise<void>}
	 */
	async validateEntityType(entityType) {
		// if exists it will be updated
		if (!this.settings.enforceSchema) {
			return;
		}
		const entityTypeNames = await this.#getEntityTypeNames();
		// checking the object props
		for (let def of entityType.objectProperties) {
			// if objectType is the same it represents a self-reference
			if (!_.includes(entityTypeNames, def.objectType) && entityType.name !== def.objectType) {
				throw new Error(Strings.TypeDoesNotExist(def.objectType));
			}
		}
	}

	/**
	 * Checks whether the specified type already exists.
	 * @param entityTypeSpec {string} The type, type name or serialized type.
	 * @returns {Promise<boolean>}
	 */
	async entityTypeExists(entityTypeSpec) {
		const found = await this.getEntityType(entityTypeSpec);
		return Utils.isDefined(found);
	}

	/**
	 * Checks that the underlying storage implements the specified method.
	 * @param methodName {string} A required method.
	 */
	ensureStoreMethodExists(methodName) {
		if (Utils.isEmpty(this.store)) {
			throw new Error(Strings.IsNil("entitiesStore", "Entities"));
		}
		if (Utils.isEmpty(methodName)) {
			throw new Error(Strings.IsNil(methodName, "entitiesStore"));
		}
		if (Utils.isEmpty(this.store[methodName])) {
			throw new Error(Strings.NotImplementedMethod(methodName, "the storage"));
		}
	}

	async checkEntityTypeIsInSchema(entityTypeSpec) {
		if (!this.settings.enforceSchema) {
			return;
		}
		const entityTypeName = SpaceUtils.getTypeNameFromSpecs(entityTypeSpec);
		const found = await this.entityTypeExists(entityTypeName);
		if (!found) {
			throw new Error(Strings.TypeDoesNotExist(entityTypeName));
		}
	}

	/**
	 * Removes the specified EntityType and optionally all related instances.
	 * @param entityTypeSpec {*|string|EntityType} The type, type name or the serialized type.
	 * @param removeInstances {boolean} Whether the instances with the specified type should also be removed.
	 * @returns {Promise<void>}
	 */
	async removeEntityType(entityTypeSpec, removeInstances = true) {
		if (Utils.isEmpty(entityTypeSpec)) {
			return;
		}
		const entityType = await this.getEntityType(entityTypeSpec);
		if (!entityType) {
			return;
		}
		this.ensureStoreMethodExists("removeEntityType");
		const entityTypeName = entityType.name;
		await this.store.removeEntityType(entityTypeName, removeInstances);
	}

	/**
	 * Clears the space of entity types and instances.
	 * @returns {Promise<void>}
	 */
	async clear() {
		this.ensureStoreMethodExists("clear");
		await this.store.clear();
	}

	/**
	 * Upserts an instance of the specified type.
	 *
	 * @see addInstance
	 * @param entityTypeSpec {string|EntityType} The entity type or type name.
	 * @param entitySpec {*|string} The entity, the entity data or just the name of the instance.
	 * @returns {Promise<Entity>}
	 */
	async upsertInstance(entityTypeSpec, entitySpec) {
		const entityTypeName = await SpaceUtils.getTypeNameFromSpecs(entityTypeSpec);
		const entity = await this.createDetachedInstance(entityTypeSpec, entitySpec);
		if (this.enforceSchema) {
			const exists = await this.getEntityType(entityTypeName);
			if (!exists) {
				throw new Error(Strings.TypeDoesNotExist(entityTypeName));
			}
		}
		if (entity) {
			await this.store.upsertInstance(entity);
			entity.space = this;
			return entity;
		}
		return null;
	}

	/**
	 * Returns the value properties of the specified type.
	 * @param entityTypeSpec {*|string|EntityType} An entity specification.
	 * @returns {Promise<ValueProperty>}
	 */
	async getValueProperties(entityTypeSpec) {
		const entityTypeName = await SpaceUtils.getTypeNameFromSpecs(entityTypeSpec);
		const entityType = await this.getEntityType(entityTypeName);
		if (Utils.isEmpty(entityType)) {
			throw new Error(Strings.TypeDoesNotExist(_.isString(entityTypeSpec) ? entityTypeSpec : entityTypeSpec.name));
		}
		this.ensureStoreMethodExists("getValueProperties");
		const found = await this.store.getValueProperties(entityTypeName);
		if (Utils.isEmpty(found)) {
			return [];
		}
		return found.map((p) => ValueProperty.fromJSON(p));
	}

	/**
	 * Returns the value of (value) property.
	 * @param entitySpec {Entity|string|*} An instance, an instance id or a serialized instance.
	 * @param valueSpec {ValueProperty|string|*} A value property, a name or a serialized value property.
	 * @returns {Promise<*>}
	 */
	async getValue(entitySpec, valueSpec) {
		const valueName = SpaceUtils.getValueNameFromSpecs(valueSpec);
		if (Utils.isEmpty(valueName)) {
			throw new Error("Can't turn the given specs into a value property.");
		}
		const entityId = SpaceUtils.getEntityIdFromSpecs(entitySpec);
		if (Utils.isEmpty(entityId)) {
			throw new Error("Can't turn the given entity specs into an entity id.");
		}
		const entity = await this.getInstanceById(entityId);
		if (Utils.isEmpty(entity)) {
			throw new Error("The entity was not found in the space.");
		}
		return entity.getValue(valueName);
	}

	/**
	 * Sets a (property) value on an instance.
	 * @param entitySpec {*|string|Entity} An entity, an id or a serialized entity.
	 * @param valueSpec {*|string|ValueProperty} A value property, a property name or a serialized value property.
	 * @param value {*} The value to set.
	 * @returns {Promise<void>}
	 */
	async setValue(entitySpec, valueSpec, value) {
		const valueName = SpaceUtils.getValueNameFromSpecs(valueSpec);
		if (Utils.isEmpty(valueName)) {
			throw new Error("Can't turn the given specs into a value property.");
		}
		const entityId = SpaceUtils.getEntityIdFromSpecs(entitySpec);
		if (Utils.isEmpty(entityId)) {
			throw new Error("Can't turn the given entity specs into an entity id.");
		}
		const entity = await this.getInstanceById(entityId);
		if (Utils.isEmpty(entity)) {
			throw new Error("The entity was not found in the space.");
		}
		await entity.setValue(valueName, value, true, false);
		if (entity.isTyped) {
			await this.upsertInstance(entity.entityType.name, entity);
		} else {
			await this.upsertInstance(entity.typeName, entity);
		}
	}

	/**
	 * Set the object property on the given instance.
	 * - This creates a link with another instance.
	 * - You can also use the {@link connect} method to link to instances.
	 * @see connect
	 * @param entitySpec {Entity} The instance.
	 * @param objectSpec {ObjectProperty|string} The object property or a name.
	 * @param objSpec {Entity} The instance to set.
	 * @param addObjectIfNotPresent {boolean} Whether the object should be added if not in the space.
	 * @returns {Promise<void>}
	 */
	async setObject(entitySpec, objectSpec, objSpec, addObjectIfNotPresent = true) {
		if (Utils.isEmpty(objSpec)) {
			throw new Error("Use the 'removeObject' method to delete an object property.");
		}
		const objName = SpaceUtils.getValueNameFromSpecs(objectSpec);
		if (Utils.isEmpty(objName)) {
			throw new Error("Can't turn the given specs into an object property.");
		}
		const entityId = SpaceUtils.getEntityIdFromSpecs(entitySpec);
		if (Utils.isEmpty(entityId)) {
			throw new Error("Can't turn the given entity specs into an entity id.");
		}
		const entity = await this.getInstanceById(entityId);
		if (Utils.isEmpty(entity)) {
			throw new Error("The entity was not found in the space.");
		}
		if (entity.space !== this) {
			throw new Error("The given instance is not part of this space.");
		}
		const objId = SpaceUtils.getIdFromSpecs(objSpec);
		let obj = await this.getInstanceById(objId);
		if (Utils.isEmpty(obj)) {
			if (addObjectIfNotPresent) {
				const typeName = SpaceUtils.getTypeNameFromSpecs(objSpec);
				obj = await this.createInstance(typeName, objSpec);
			} else {
				throw new Error("Target of the property does not exist.");
			}
		}

		entity.objects[objName] = objId;
		if (entity.isTyped) {
			await this.upsertInstance(entity.entityType.name, entity);
		} else {
			await this.upsertInstance(entity.typeName, entity);
		}
	}

	/**
	 * Returns the instance connected via the specified object property.
	 * @param entitySpec {Entity} An instance.
	 * @param objSpec {ObjectProperty|string} An object property or name.
	 * @returns {Promise<*|null>}
	 */
	async getObject(entitySpec, objSpec) {
		const objName = SpaceUtils.getObjectNameFromSpecs(objSpec);
		if (Utils.isEmpty(objName)) {
			throw new Error("Can't turn the given specs into an object property.");
		}
		const entityId = SpaceUtils.getEntityIdFromSpecs(entitySpec);
		if (Utils.isEmpty(entityId)) {
			throw new Error("Can't turn the given entity specs into an entity id.");
		}
		const entity = await this.getInstanceById(entityId);

		if (Utils.isEmpty(entity)) {
			throw new Error("The entity was not found in the space.");
		}
		if (Utils.isEmpty(entity.objects)) {
			return null;
		}
		const found = entity.objects[objName];
		if (_.isString(found)) {
			return await this.getInstanceById(found);
		} else {
			return Entity.fromJSON(found.typeName, found);
		}
	}

	/**
	 * Removes a link of the specified instance.
	 * @param entitySpec
	 * @param objPropSpec
	 * @returns {Promise<void>}
	 */
	async removeObject(entitySpec, objPropSpec) {
		const objName = SpaceUtils.getObjectNameFromSpecs(objPropSpec);
		if (Utils.isEmpty(objName)) {
			throw new Error("Can't turn the given specs into an object property.");
		}
		const entityId = SpaceUtils.getEntityIdFromSpecs(entitySpec);
		if (Utils.isEmpty(entityId)) {
			throw new Error("Can't turn the given entity specs into an entity id.");
		}
		const entity = await this.getInstanceById(entityId);
		await entity.removeObject(objName, true);
	}

	/**
	 * Returns the object properties of the given type.
	 * @param entityTypeSpec {EntityType|string|*} An EntityType, a name or a serialized type.
	 * @returns {Promise<ObjectProperty>}
	 */
	async getObjectProperties(entityTypeSpec) {
		const entityTypeName = await SpaceUtils.getTypeNameFromSpecs(entityTypeSpec);
		const entityType = await this.getEntityType(entityTypeName);
		if (Utils.isEmpty(entityType)) {
			throw new Error(Strings.TypeDoesNotExist(_.isString(entityTypeSpec) ? entityTypeSpec : entityTypeSpec.name));
		}
		this.ensureStoreMethodExists("getValueProperties");
		const found = await this.store.getObjectProperties(entityTypeName);
		if (Utils.isEmpty(found)) {
			return [];
		}
		return found.map((p) => ObjectProperty.fromJSON(p));
	}

	/**
	 * Returns the instance with the specified id.
	 * @param id {string} The id of the instance.
	 * @returns {Promise<Entity|null>}
	 */
	async getInstanceById(id) {
		const found = await this.store.getInstanceById(id);
		if (Utils.isEmpty(found)) {
			return null;
		}
		const typeName = found.typeName;
		if (this.enforceSchema) {
			const entityType = await this.getEntityType(typeName);
			// happens if the type has been removed but not the instance
			if (Utils.isEmpty(entityType)) {
				return await Entity.untyped(typeName, found);
			} else {
				return Entity.fromJSON(entityType, found);
			}
		} else {
			const entity = new Entity(null, null);
			_.assign(entity, found);
			entity.typeName = typeName;
			entity.space = this;
			return entity;
		}
	}

	/**
	 * Returns all instances.
	 * @param typeName {string}
	 * @returns {Promise<*[]|*>}
	 */
	async getInstances(typeName) {
		// todo: limit with count
		const entityType = await this.getEntityType(typeName);

		if (Utils.isEmpty(entityType)) {
			return [];
		}
		const found = await this.store.getInstances(typeName);
		const coll = [];
		for (const ins of found) {
			coll.push(await Entity.fromJSON(entityType, ins));
		}
		return coll;
	}

	/**
	 * Creates an instance from the given specifications without saving it to the store.
	 * @param entityTypeSpec
	 * @param entitySpec
	 * @param throwError
	 * @returns {Promise<Entity>}
	 */
	async createDetachedInstance(entityTypeSpec, entitySpec, throwError = true) {
		// if already an entity we just detach it
		if (entitySpec instanceof Entity) {
			SpaceUtils.detachEntity(entitySpec);
			return entitySpec;
		}
		const entityTypeName = SpaceUtils.getTypeNameFromSpecs(entityTypeSpec, throwError);
		let entity;
		if (this.enforceSchema) {
			const entityType = await this.getEntityType(entityTypeName);
			if (Utils.isEmpty(entityType)) {
				throw new Error(Strings.TypeDoesNotExist(entityTypeName));
			}
			// since detached, obviously shouldn't save it
			entity = await Entity.typed(entityType, entitySpec, false);
		} else {
			entity = await Entity.untyped(entityTypeName, entitySpec, false);
		}
		entity.space = null;
		SpaceUtils.detachEntity(entity);
		return entity;
	}

	/**
	 * Returns the specified entity type.
	 * @param entityTypeSpec {*|string|EntityType} The type, type name or the serialized type.
	 * @returns {Promise<null|EntityType>}
	 */
	async getEntityType(entityTypeSpec) {
		if (Utils.isEmpty(entityTypeSpec)) {
			return null;
		}
		if (entityTypeSpec instanceof EntityType) {
			return entityTypeSpec;
		} else if (_.isString(entityTypeSpec)) {
			this.ensureStoreMethodExists("getEntityType");
			const json = await this.store.getEntityType(entityTypeSpec);
			return SpaceUtils.deserializeEntityType(json, this);
		} else if (_.isPlainObject(entityTypeSpec)) {
			if (entityTypeSpec.typeName !== "EntityType") {
				return null;
			}
			// giving priority of the id over the name
			if (entityTypeSpec.id) {
				return this.getEntityTypeById(entityTypeSpec.id);
			}
			return this.getEntityType(entityTypeSpec.name);
		} else {
			return null;
		}
	}

	/**
	 * Return the EntityType with the specified id.
	 * @param id {string}
	 * @returns {Promise<EntityType|null>}
	 */
	async getEntityTypeById(id) {
		if (Utils.isEmpty(id)) {
			return null;
		}
		if (!_.isString(id)) {
			throw new Error(Strings.ShoudBeType("id", "string", "EntitySpace.getEntityTypeById"));
		}
		const json = await this.store.getEntityTypeById(id);
		return SpaceUtils.deserializeEntityType(json, this);
	}

	/**
	 * Removes all instances of the specified type.
	 * @param entityTypeName {string} The type to remove.
	 * @returns {Promise<void>}
	 */
	async removeInstances(entityTypeName) {
		this.ensureStoreMethodExists("removeInstances");
		await this.store.removeInstances(entityTypeName);
	}

	/**
	 * Removes the given instance or via the given instance id.
	 * @param entitySpec {string|Entity|*} The id of the instance, an entity or a serialized entity.
	 * @returns {Promise<void>}
	 */
	async removeInstance(entitySpec) {
		if (Utils.isEmpty(entitySpec)) {
			return;
		}
		this.ensureStoreMethodExists("removeInstance");
		if (_.isString(entitySpec)) {
			await this.store.removeInstance(entitySpec);
		} else if (entitySpec instanceof Entity || _.isPlainObject(entitySpec)) {
			await this.store.removeInstance(entitySpec.id);
		} else {
			throw new Error(Strings.WrongArgument("entitySpec", typeof entitySpec, "id or entity", "EntitySpace.removeInstance"));
		}
	}

	async updateEntityType(entityType) {
		if (Utils.isEmpty(entityType)) {
			throw new Error(Strings.IsNil("entityType", "Entities.updateEntityType"));
		}
		if (!(entityType instanceof EntityType)) {
			throw new Error(Strings.ShoudBeType("entityType", "EntityType", "Entities.updateEntityType"));
		}
		const exists = await this.entityTypeExists(entityType.name);
		if (!exists) {
			throw new Error(Strings.ExistsAlready(entityType.name, "Entities"));
		}
		await this.upsertEntityType(entityType);
	}

	/**
	 * Returns an entity from the given JSON provided the type is registered.
	 * @param json {*} A serialized entity.
	 * @returns {Promise<*>}
	 */
	async parseEntity(json) {
		if (Utils.isEmpty(json)) {
			throw new Error(Strings.IsNil("json", "Entities.fromJSON"));
		}
		const typeName = json.typeName;
		const exists = await this.entityTypeExists(typeName);
		if (!exists) {
			throw new Error(Strings.TypeDoesNotExist(typeName));
		}
		const entityType = await this.getEntityType(typeName);

		return Entity.fromJSON(entityType, json);
	}

	/**
	 * Exports the schema as JSON.
	 * @returns {Promise<*>}
	 * @see importSchema
	 */
	async exportSchema() {
		const metadata = await this.store.getMetadata();
		metadata.typeName = "EntitySpace";
		const json = {
			entityTypes: await this.store.getEntityTypes(),
		};
		return _.merge(json, metadata);
	}

	/**
	 * Imports the given schema.
	 * @param json {*} A schema definition.
	 * @param replace {boolean} Where the schema replaces the current one (if any) or is merged.
	 * @returns {Promise<void>}
	 * @see exportSchema
	 */
	async importSchema(json, replace = false) {
		if (replace) {
			this.ensureStoreMethodExists("clear");
			await this.store.clear(true, false);
		}
		SpaceUtils.validateSchema(json);

		for (const entityType of json) {
			await this.store.upsertEntityType(entityType);
		}
	}

	/**
	 * Imports the given instances into the store.
	 * @param json {*[]} An array of instances.
	 * @param replace
	 * @returns {Promise<void>}
	 */
	async importInstances(json, replace = false) {
		if (Utils.isEmpty(json)) {
			throw new Error(Strings.IsNil("json", "EntitySpace.importInstances"));
		}
		if (!_.isArray(json)) {
			throw new Error(Strings.ShoudBeType("json", "array", "EntitySpace.importInstances"));
		}
		if (replace) {
			this.ensureStoreMethodExists("clear");
			await this.store.clear(false, true);
		}
		for (const entity of json) {
			const entityTypeName = entity.typeName;
			if (Utils.isEmpty(entityTypeName)) {
				throw new Error(Strings.IsNil("entity.name", "EntitySpace.importInstances"));
			}
			await this.upsertInstance(entityTypeName, entity);
		}
	}

	async importEntitySpace(json, replace = false) {
		if (Utils.isEmpty(json)) {
			throw new Error(Strings.IsNil("json", "EntitySpace.importInstances"));
		}
		if (replace) {
			this.ensureStoreMethodExists("clear");
			await this.store.clear(true, true);
		}
		const entityTypes = json.entityTypes;
		delete json.entityTypes;
		const entities = json.entities;
		delete json.entities;
		const metadata = json;
		// first the types
		await this.importSchema(entityTypes, false);
		// the entities
		await this.importInstances(entities, false);
		// the metadata
		await this.store.assignMetadata(metadata);
	}

	async getMetadata(name = null) {
		return await this.store.getMetadata(name);
	}

	async setMetadata(name, value) {
		return await this.store.setMetadata(name, value);
	}

	async save() {
		if (this.store && this.store.save) {
			return await this.store.save();
		}
	}

	async connect(source, relationSpec, target) {
		const sourceId = SpaceUtils.getEntityIdFromSpecs(source);
		if (_.isNil(sourceId)) {
			throw new Error("Could not turn 'source' into an instance id.");
		}
		const targetId = SpaceUtils.getEntityIdFromSpecs(target);
		if (_.isNil(targetId)) {
			throw new Error("Could not turn 'target' into an instance id.");
		}
		const sourceEntity = await this.getInstanceById(sourceId);
		if (Utils.isEmpty(sourceEntity)) {
			throw new Error("Source instance does not exist.");
		}
		const targetEntity = await this.getInstanceById(targetId);
		if (Utils.isEmpty(targetEntity)) {
			throw new Error("Target instance does not exist.");
		}
		const objectRelationName = _.isString(relationSpec) ? relationSpec : relationSpec.name || null;
		if (Utils.isEmpty(objectRelationName)) {
			throw new Error("The given relation specification is not valid");
		}
		if (sourceEntity.entityType) {
			const objProp = sourceEntity.entityType.getObjectProperty(objectRelationName);
			if (Utils.isEmpty(objProp)) {
				throw new Error(`Cannot connect given instance with '${objectRelationName}', it does not exist on type '${sourceEntity.entityType.name}'. `);
			}
			sourceEntity.setObject(objectRelationName, targetEntity);
			await this.upsertInstance(sourceEntity.entityType, sourceEntity);
		} else {
			sourceEntity.setObject(objectRelationName, targetEntity);
			await this.upsertInstance(sourceEntity.typeName, sourceEntity);
		}
	}
}

module.exports = EntitySpace;
