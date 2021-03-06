const { Strings, Utils } = require("@graphminer/Utils");
const _ = require("lodash");
const EntityType = require("./entityType");
const Entity = require("./entity");
const ValueProperty = require("./valueProperty");
const ObjectProperty = require("./objectProperty");
const SpaceUtils = require("./spaceUtils");
const assert = require("assert");
const { Graph } = require("@graphminer/graphs");

/**
 * Gateway to entities.
 *
 *
 * - Strictly speaking an object-graph-mapper (OGM).
 * - The spaces is partitioned in databases. This would correspond in e.g. Neo4j with separate database connections. There is always a default database in use if none specified.
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
	 * Returns the name of the active database.
	 * Note that a space always has a 'default' database.
	 * @returns {string|null}
	 */
	get database() {
		return this.#store.database;
	}

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
		// will be async but the local settings value will be used immediately
		this.#store.setMetadata("enforceSchema", v);
	}

	/**
	 * The underlying entity store.
	 * It's set via the {@link init} method once and cannot be altered during the lifetime of the space.
	 */
	get store() {
		return this.#store;
	}

	/**
	 * Creates an in-memory entity space.
	 * @returns {Promise<EntitySpace>}
	 */
	static async inMemory(spaceName = null) {
		const space = new EntitySpace();
		await space.init("memory");
		await space.setMetadata("name", spaceName);
		return space;
	}

	/**
	 * Creates a space in the browser (the Local Storage).
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
	 * @param [name="graphminer"] {string} The name of the local storage
	 * @returns {Promise<EntitySpace>}
	 */
	static async browser(name = "graphminer") {
		const space = new EntitySpace();
		await space.init(null, {
			env: "BROWSER",
			filePath: name ?? "graphminer",
		});
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
	 * Changes the active database.
	 * When using the local or browser store this is a simple name change. When using Neo4j or TigerGraph this leads to an async change of connection.
	 * @param v
	 * @returns {Promise<void>}
	 */
	async setDatabase(v) {
		if (Utils.isEmpty(v)) {
			this.#store.database = "default";
		} else {
			if (!Utils.isSimpleString(v)) {
				throw new Error("The name of a database should be a simple string (alphanumeric not starting with a number)");
			}
			const exists = await this.databaseExists(v);
			if (!exists) {
				throw new Error(`The database '${v}' does not exists.`);
			}
			v = v.trim();
			// in case it's 'Default' we'll be kind
			if (v.toLowerCase() === "default") {
				v = "default";
			}
			this.#store.database = v;
			// fetch the setting
			this.settings.enforceSchema = await this.#store.getMetadata("enforceSchema");
		}
	}

	/**
	 * Checks whether there is a database with the specified name.
	 * @param dbName {string} A simple (alphanumeric) name.
	 * @returns {Promise<boolean>}
	 */
	async databaseExists(dbName) {
		if (!Utils.isSimpleString(dbName)) {
			throw new Error("A database name should be alphanumeric and not start with a number.");
		}
		return this.#store.databaseExists(dbName);
	}

	/**
	 * Creates a database with the specified name.
	 * @param dbName {string} A simple (alphanumeric) name.
	 * @returns {Promise<void>}
	 */
	async createDatabase(dbName) {
		if (!Utils.isSimpleString(dbName)) {
			throw new Error("A database name should be alphanumeric and not start with a number.");
		}
		return this.#store.createDatabase(dbName);
	}

	/**
	 * Removes the database with the specified name.
	 * @param dbName {string} A simple (alphanumeric) name.
	 * @returns {Promise<void>}
	 */
	async removeDatabase(dbName) {
		if (!Utils.isSimpleString(dbName)) {
			throw new Error("A database name should be alphanumeric and not start with a number.");
		}
		return this.#store.removeDatabase(dbName);
	}

	/**
	 * Gets all registered databases.
	 * @returns {Promise<string[]>}
	 */
	async getDatabaseNames() {
		return this.#store.getDatabaseNames();
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
					await entityStore.ensureDefaultDatabaseExists();
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
				await entityStore.ensureDefaultDatabaseExists();
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
	 * @param entityTypeSpec {EntityType|string} Either the name of the type or an EntityType.
	 * @returns {Promise<EntityType>}
	 */
	async createEntityType(entityTypeSpec) {
		return await this.addEntityType(entityTypeSpec);
	}

	/**
	 * Adds a new entity type.
	 * @param entityTypeSpec {EntityType|string} Either the name of the type or an EntityType.
	 * @param valueProps
	 * @returns {Promise<EntityType>}
	 */
	async addEntityType(entityTypeSpec, valueProps = null) {
		let entityType = null;
		if (_.isString(entityTypeSpec)) {
			const entityTypeName = entityTypeSpec.toString().trim();
			entityType = new EntityType(entityTypeName);
		} else if (entityTypeSpec instanceof EntityType) {
			entityType = entityTypeSpec;
			// upsert will overwrite but adding it causes an exception if already there
			const found = await this.getEntityType(entityType.name);
			if (!Utils.isEmpty(found)) {
				throw new Error(Strings.ExistsAlready(entityType.name, "Entities"));
			}
		}
		if (entityType) {
			entityType.space = this;
			if (Utils.isDefined(valueProps)) {
				for (const name in valueProps) {
					entityType.addValueProperty(name, valueProps[name]);
				}
			}
			await this.store.upsertEntityType(entityType);
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
		assert(entityType.valueProperties[valuePropertyName] === undefined);
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
	 * Returns all instances in the current database.
	 * @returns {Promise<Entity[]>}
	 */
	async getAllInstances() {
		this.ensureStoreMethodExists("getEntities");
		const found = await this.store.getEntities();
		if (this.enforceSchema) {
			const types = await this.getAllEntityTypes();
			const coll = [];
			for (const json of found) {
				const type = _.find(types, (w) => w.name === json.typeName);
				if (type) {
					coll.push(Entity.fromJSON(type, json));
				}
			}
			return coll;
		} else {
			return found.map((u) => Entity.fromJSON(u.typeName, u));
		}
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
		return entity.getValue(valueName) || null;
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
		const objPropertyName = SpaceUtils.getObjectNameFromSpecs(objectSpec);
		if (Utils.isEmpty(objPropertyName)) {
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
		entity.setObject(objPropertyName, obj);
		if (entity.isTyped) {
			await this.upsertInstance(entity.entityType.name, entity);
		} else {
			await this.upsertInstance(entity.typeName, entity);
		}
	}

	/**
	 * Returns the instance connected via the specified object property.
	 * If there is more than one instance connected via the given object property this will return the first one. Use the {@link getObjects} method to get all targets.
	 * @see getObjects
	 * @param entitySpec {Entity} An instance.
	 * @param objSpec {ObjectProperty|string} An object property or name.
	 * @returns {Promise<Entity|null>}
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
		if (Utils.isEmpty(found)) {
			return null;
		}
		// maybe more than one but we return just one
		return await this.getInstanceById(found[0]);
	}

	/**
	 * Gets the target instances of a relation (object property).
	 * @see getObject
	 * @param entitySpec {Entity} An instance.
	 * @param objSpec {ObjectProperty|string} An object property or name.
	 * @returns {Promise<Entity[]|null>}
	 */
	async getObjects(entitySpec, objSpec) {
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
		if (Utils.isEmpty(found)) {
			return [];
		}
		const coll = [];
		for (const id of found) {
			const ins = await this.getInstanceById(id);
			if (ins) {
				coll.push(ins);
			}
		}
		return coll;
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
		return await this.#getInstanceFromJson(found);
	}

	async #getInstanceFromJson(json) {
		const typeName = json.typeName;
		if (this.enforceSchema) {
			const entityType = await this.getEntityType(typeName);
			// happens if the type has been removed but not the instance
			if (Utils.isEmpty(entityType)) {
				return Entity.untyped(typeName, json);
			} else {
				return Entity.fromJSON(entityType, json);
			}
		} else {
			const entity = Entity.fromJSON(typeName, json);
			entity.typeName = typeName;
			entity.space = this;
			return entity;
		}
	}

	/**
	 * Returns all instances.
	 * @param typeName {string|null}
	 * @returns {Promise<*[]|*>}
	 */
	async getInstances(typeName = null) {
		// todo: limit with count
		if (Utils.isDefined(typeName)) {
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
		} else {
			const found = await this.store.getInstances(typeName);
			const coll = [];
			for (const ins of found) {
				coll.push(await this.#getInstanceFromJson(ins));
			}
			return coll;
		}
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
			entity = Entity.typed(entityType, entitySpec);
		} else {
			entity = Entity.untyped(entityTypeName, entitySpec);
		}

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

	/**
	 * Updates the given entity type.
	 * @param entityType {EntityType} An entity type to update.
	 * @returns {Promise<void>}
	 */
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
	 * Exports the instances and their relations in a JSON structure with
	 * 'nodes' and 'edges' arrays. The export also includes the metadata assigned to the database.
	 * @returns {Promise<{nodes: *[], edges: *[]}>}
	 */
	async exportGraphJson() {
		const g = {
			nodes: [],
			edges: [],
		};
		// merge the metadata
		const meta = await this.getMetadata();
		_.assign(g, meta);
		const ins = (await this.getInstances()).map((e) => e.toJSON());
		for (const n of ins) {
			g.nodes.push(n);

			for (const link of n.links) {
				const ids = link.ids;
				for (const id of ids) {
					g.edges.push({
						sourceId: n.id,
						name: link.name,
						targetId: id,
					});
				}
			}
			// the linking should sit only in the edges collection
			delete n.links;
		}
		return g;
	}

	/**
	 * Imports a GraphMiner Graph.
	 * @param graph {Graph} A graph.
	 * @param clearSpace
	 */
	async importGraph(graph, clearSpace = true) {
		if (_.isNil(graph)) {
			throw new Error(Strings.IsNil("graph", "EntitySpace.importGraph"));
		}
		if (clearSpace) {
			await this.clear();
			this.enforceSchema = false;
		} else {
			if (this.enforceSchema) {
				throw new Error("Can't import a Graph when a schema is enforced since it likely has a different schema.");
			}
		}
		for (const node of graph.nodes) {
			await this.upsertInstance(node.typeName || "Unknown", node);
		}

		for (const edge of graph.edges) {
			await this.connect(edge.sourceId, "link", edge.targetId);
		}
	}

	/**
	 * Exports the knowledge graph as a GraphMiner Graph.
	 * @returns {Promise<Graph>}
	 */
	async exportGraph() {
		const g = Graph.empty();
		// assign the metadata
		const meta = await this.getMetadata();
		_.assign(g, meta);
		const ins = (await this.getInstances()).map((e) => e.toJSON());
		let links = [];
		for (const n of ins) {
			g.addNode(n);
			n.links.forEach((l) => (l.sourceId = n.id));
			links = links.concat(n.links);
			// the linking should sit only in the edges collection
			delete n.links;
		}
		for (const link of links) {
			const ids = link.ids;
			for (const id of ids) {
				g.addEdge({
					sourceId: link.sourceId,
					name: link.name,
					targetId: id,
				});
			}
		}
		return g;
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
		let links = [];
		const entityDic = {};
		for (const j of json) {
			const entityTypeName = j.typeName;
			if (Utils.isEmpty(entityTypeName)) {
				throw new Error(Strings.IsNil("entity.name", "EntitySpace.importInstances"));
			}
			// the 'links' attrib contains connections and needs to be handled after the instances are imported
			if (j.links) {
				// each link item looks like {name, ids} and is missing the source if we take it out
				j.links.forEach((link) => (link.sourceId = j.id));
				links = links.concat(j.links);
				delete j.links;
			}
			const entity = await this.upsertInstance(entityTypeName, j);
			entityDic[entity.id] = entity;
		}
		// now we can connect things
		for (const link of links) {
			for (const targetId of link.ids) {
				const target = entityDic[targetId];
				const source = entityDic[link.sourceId];
				if (Utils.isDefined(source) && Utils.isDefined(target)) {
					await this.connect(source, link.name, target);
				}
			}
		}
	}

	/**
	 * Imports an entity space.
	 * @param json {*} A serialized space.
	 * @param replace {boolean} If true the space will be cleared before import.
	 * @param [database=null] {string|null} If null the current database will be used, otherwise the given one will ingest the given data. If the database does not exist it will be created.
	 * @returns {Promise<void>}
	 */
	async importEntitySpace(json, replace = false, database = null) {
		let currentDatabase = this.database;
		if (Utils.isDefined(database)) {
			if (database !== currentDatabase) {
				const exists = await this.databaseExists(database);
				if (!exists) {
					await this.createDatabase(database);
				}
				await this.setDatabase(database);
			}
		}
		if (Utils.isEmpty(json)) {
			throw new Error(Strings.IsNil("json", "EntitySpace.importInstances"));
		}
		if (replace) {
			this.ensureStoreMethodExists("clear");
			await this.store.clear(true, true);
		}
		const schema = json.schema;
		delete json.schema;
		const instances = json.data;
		delete json.data;
		const metadata = json;
		// first the types
		await this.importSchema(schema, false);
		// the entities
		await this.importInstances(instances, false);
		// the metadata
		await this.store.assignMetadata(metadata);
		// set back the database before import
		if (currentDatabase !== this.database) {
			await this.setDatabase(currentDatabase);
		}
	}

	/**
	 * Returns all the metadata or the value of the specified name.
	 * @param [name=null] {string} Optional name of a key.
	 * @returns {Promise<*>}
	 */
	async getMetadata(name = null) {
		return await this.store.getMetadata(name);
	}

	/**
	 * Adds a key-value pair to the metadata.
	 * @param name {string} A key.
	 * @param value {*} A simple value (string, number...).
	 * @returns {Promise<*>}
	 */
	async setMetadata(name, value) {
		// will throw if a complex object is given
		SpaceUtils.isSimpleValue(value);
		return await this.store.setMetadata(name, value);
	}

	/**
	 * Saves the space if the underlying storage supports it.
	 * @returns {Promise<*>}
	 */
	async save() {
		if (this.store && this.store.save) {
			return await this.store.save();
		}
	}

	/**
	 * Creates an object link between the given instances.
	 * @param source {Entity|string} The source entity or id.
	 * @param relationSpec
	 * @param target {Entity|string} The target entity or id.
	 * @returns {Promise<void>}
	 */
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
		if (!Utils.isSimpleString(objectRelationName)) {
			throw new Error("The given relation specification is not valid.");
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

	/**
	 * Exports the current database.
	 * @returns {Promise<*>}
	 */
	async exportEntitySpace() {
		const exp = {};
		const metadata = await this.getMetadata();
		_.assign(exp, metadata);
		// exportSchema also exports metadata for import of schema only
		exp.schema = (await this.exportSchema()).entityTypes;
		exp.data = (await this.getAllInstances()).map((ins) => ins.toJSON());
		return exp;
	}

	/**
	 * Fetches the connections (object properties) between the given instances.
	 * @param sourceSpec {Entity|string|*} A source entity specification.
	 * @param targetSpec {Entity|string|*} A target entity specification.
	 * @param [name=null] {string|null} Optional name of the relation. If not specified all will be returned.
	 * @param fetchInstances {boolean} If true the instances will be added otherwise only the id's will be returned.
	 * @returns {Promise<*[]>}
	 */
	async getConnectionsBetween(sourceSpec, targetSpec, name = null, fetchInstances = false) {
		const sourceId = SpaceUtils.getIdFromSpecs(sourceSpec);
		const targetId = SpaceUtils.getIdFromSpecs(targetSpec);
		if (Utils.isEmpty(sourceId) || Utils.isEmpty(targetId)) {
			return [];
		}
		const source = await this.getInstanceById(sourceId);
		const target = await this.getInstanceById(targetId);
		if (Utils.isEmpty(source)) {
			return [];
		}
		let objs = source.getObjects();
		if (Utils.isEmpty(objs)) {
			return [];
		}
		let result = [];
		if (Utils.isDefined(name)) {
			if (Utils.isDefined(objs[name])) {
				const ids = objs[name].ids;
				if (_.includes(ids, targetId)) {
					const item = {
						name,
						sourceId,
						targetId,
					};
					if (fetchInstances) {
						item.source = source;
						item.target = target;
					}
					result.push(item);
				}
			}
		} else {
			const allNames = _.keys(objs);
			for (const name of allNames) {
				const ids = objs[name];
				for (const id of ids) {
					const link = {
						name,
						sourceId,
						targetId: id,
					};
					result.push(link);
					if (fetchInstances) {
						link.source = source;
						link.target = await this.getInstanceById(id);
					}
				}
			}
		}
		return result;
	}

	/**
	 * Returns whether the specified instances are connected.
	 * @param sourceSpec {Entity|string|*} A source entity specification.
	 * @param targetSpec {Entity|string|*} A target entity specification.
	 * @param bothDirections {boolean} If true both directions will be checked.
	 * @returns {Promise<boolean>}
	 */
	async areConnected(sourceSpec, targetSpec, bothDirections = false) {
		if (bothDirections) {
			const direct = await this.getConnectionsBetween(sourceSpec, targetSpec, null, false);
			const reverse = await this.getConnectionsBetween(targetSpec, sourceSpec, null, false);
			return direct.length > 0 || reverse.length > 0;
		} else {
			const all = await this.getConnectionsBetween(sourceSpec, targetSpec, null, false);
			return all.length > 0;
		}
	}

	/**
	 * Returns the names of the relations, if any, between the specified instances.
	 * @param sourceSpec {Entity|string|*} A source entity specification.
	 * @param targetSpec {Entity|string|*} A target entity specification.
	 * @param bothDirections {boolean} If true both directions will be checked.
	 * @returns {Promise<boolean>}
	 */
	async getConnectionNamesBetween(sourceSpec, targetSpec, bothDirections = false) {
		if (bothDirections) {
			const direct = await this.getConnectionsBetween(sourceSpec, targetSpec, null, false);
			const reverse = await this.getConnectionsBetween(targetSpec, sourceSpec, null, false);
			return _.uniq(direct.concat(reverse).map((c) => c.name));
		} else {
			const all = await this.getConnectionsBetween(sourceSpec, targetSpec, null, false);
			return _.uniq(all.map((c) => c.name));
		}
	}
}

module.exports = EntitySpace;
