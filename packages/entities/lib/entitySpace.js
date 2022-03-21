const { Strings, Utils } = require("@graphminer/Utils");
const _ = require("lodash");
const EntityType = require("./entityType");
const Entity = require("./entity");
const ValueProperty = require("./valueProperty");

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

	get enforceSchema() {
		return this.settings.enforceSchema ?? true;
	}

	set enforceSchema(v) {
		if (Utils.isEmpty(v)) {
			throw new Error(Strings.IsNil("value", "EntitySpace.enforceSchema"));
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

	constructor() {}

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
	 *
	 * @param typeName
	 * @param instanceSpec
	 * @returns {Entity}
	 */
	static createInstanceFromSpecs(typeName, instanceSpec) {
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
			const instance = Entity.fromJSON(entityType, item);
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
	 * Deserializes the type coming from the store.
	 * @param json {*} Supposedly a serialized EntityType.
	 * @returns {null|EntityType}
	 */
	#deserializeEntityType(json) {
		if (Utils.isEmpty(json)) {
			return null;
		}
		if (json.typeName !== "EntityType") {
			return null;
		}
		const entityType = EntityType.fromJSON(json);
		entityType.space = this;
		return entityType;
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
		return jsonArray.map((u) => this.#deserializeEntityType(u)).filter((u) => !_.isNil(u));
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
	 * @param options {EntityType|string} The name of a type or an EntityType.
	 * @param valuePropertyName {string} The name of the value property.
	 * @param valueType {string} The type of the value.
	 * @returns {Promise<void>}
	 * @example
	 *
	 * personType.addValueType("Person", "age", "Number);
	 */
	async addValueProperty(options, valuePropertyName, valueType) {
		let entityType;
		if (_.isString(options)) {
			await this.checkEntityTypeIsInSchema(options);
			entityType = await this.getEntityType(options);
		} else {
			entityType = options;
		}
		if (!(entityType instanceof EntityType)) {
			throw new Error(Strings.ShoudBeType("options", "EntityType or name of an EntityType", "Entities.addValueProperty"));
		}
		const prop = new ValueProperty(valuePropertyName, valueType, entityType.name);
		entityType.addValueProperty(prop);
		await this.updateEntityType(entityType);
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
		const entityTypeName = await this.#getEntityTypeNameFromSpecs(entityTypeSpec);
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

	async countEntities() {
		this.ensureStoreMethodExists("countEntities");
		return await this.store.countEntities();
	}

	async validateEntityType(entityType) {
		// if exists it will be updated
		// const exists = await this.entityTypeExists(entityType.name);
		// if (exists) {
		// 	throw new Error(Strings.ExistsAlready(entityType.name, "Entities"));
		// }
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
		if (Utils.isEmpty(entityTypeSpec)) {
			throw new Error(Strings.IsNil("entityTypeName", "EntitySpace.checkEntityTypeIsInSchema"));
		}
		if (entityTypeSpec instanceof EntityType || _.isPlainObject(entityTypeSpec)) {
			entityTypeSpec = entityTypeSpec.name;
		}
		const found = await this.entityTypeExists(entityTypeSpec);
		if (!found) {
			throw new Error(Strings.TypeDoesNotExist(entityTypeSpec));
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
		// const entityTypeName = this.#getEntityTypeNameFromSpecs(entityTypeSpec)
		// if (Utils.isEmpty(entityTypeSpec)) {
		//     throw new Error(Strings.IsNil("entityTypeSpec", "EntitySpace.upsertInstance"))
		// }
		// if (Utils.isEmpty(instanceSpec)) {
		//     throw new Error(Strings.IsNil("instanceSpec", "EntitySpace.upsertInstance"))
		// }
		// if (this.enforceSchema) {
		//     const entityType = await this.getEntityType(entityTypeSpec);
		//     if (Utils.isEmpty(entityType)) {
		//         throw new Error(Strings.TypeDoesNotExist(_.isString(entityTypeSpec) ? entityTypeSpec : entityTypeSpec.name))
		//     }
		//     const instance = EntitySpace.createInstanceFromSpecs(entityType.name, instanceSpec)
		//     const data = instance.toJSON()
		//     await this.store.upsertInstance(entityType, data);
		// } else {
		//     Entity.untyped()
		//     // free insert of the instance
		//     let entityTypeName
		//     if (_.isString(entityTypeSpec)) {
		//         entityTypeName = entityTypeSpec
		//     } else if ((entityTypeSpec instanceof EntityType) || _.isPlainObject(entityTypeSpec)) {
		//         entityTypeName = entityTypeSpec.name
		//     } else {
		//         throw new Error(Strings.WrongArgument("entityTypeSpec", typeof entityTypeSpec, "EntityType or string", "EntitySpace.upsertInstance"))
		//     }
		//     if (Utils.isEmpty(entityTypeName)) {
		//         throw new Error(Strings.IsNil("entityTypeSpec", "EntitySpace.upsertInstance"))
		//     }
		//     const instance = EntitySpace.createInstanceFromSpecs(entityTypeName, instanceSpec)
		//     const data = instance.toJSON()
		//     // push it into the store
		//     await this.store.upsertInstance(entityTypeName, data);
		//     // don't specify the type here since it will be checked
		//     const entity = new Entity(null, data.name)
		//     entity.typeName = entityTypeName
		//     entity.space = this;
		//     return entity;
		// }
		// let instance;
		// // the instance is defined by a name
		// if (_.isString(instanceSpec)) {
		//
		// }
		// if (entityTypeSpec instanceof EntityType) {
		//     entityTypeSpec = entityTypeSpec.name;
		// }
		// await this.checkEntityTypeIsInSchema(entityTypeSpec);
		// const data = await this.mapDataToEntity(entityTypeSpec, instanceSpec);
		// // if not enforced the type is not added to the EntityTypes collection
		// // which is necessary for knowing which collections contain entities.
		// // In the default store you can have various collections unrelated to entities.
		// if (!this.settings.enforceSchema) {
		//     const exists = await this.entityTypeExists(entityTypeSpec);
		//     if (!exists) {
		//         await this.store.upsertEntityType(new EntityType(entityTypeSpec));
		//     }
		// }
		// await this.store.upsertInstance(entityTypeSpec, data);
		// return data.id;
		const entityTypeName = await this.#getEntityTypeNameFromSpecs(entityTypeSpec);
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

	async mapDataToEntity(entityTypeName, instanceData) {
		if (Utils.isEmpty(instanceData)) {
			throw new Error(Strings.IsNil("instanceData", "Entities"));
		}
		if (Utils.isEmpty(entityTypeName)) {
			throw new Error(Strings.IsNil("entityTypeName", "Entities"));
		}
		if (_.isString(instanceData)) {
			return {
				id: Utils.id(),
				name: instanceData,
				typeName: entityTypeName,
			};
		} else if (_.isPlainObject(instanceData)) {
			if (this.settings.enforceSchema) {
				const valueProps = await this.getValueProperties(entityTypeName);
				let data = {
					id: instanceData.id || Utils.id(),
					name: instanceData.name?.trim(),
					description: instanceData.description || null,
					typeName: entityTypeName,
				};
				for (let valueProp of valueProps) {
					if (instanceData[valueProp.name]) {
						data[valueProp.name] = instanceData[valueProp.name];
						// todo: check data type
					}
				}
				return data;
			} else {
				if (Utils.isEmpty(instanceData.id)) {
					instanceData.id = Utils.id();
				}
				instanceData.typeName = entityTypeName;
				return instanceData;
			}
		} else {
			if (instanceData.constructor) {
				return await this.mapDataToEntity(entityTypeName, JSON.parse(JSON.stringify(instanceData)));
			} else {
				throw new Error(Strings.Invalid(typeof instanceData, "Entities"));
			}
		}
	}

	async getValueProperties(entityTypeName) {
		this.ensureStoreMethodExists("getValueProperties");
		const found = await this.store.getValueProperties(entityTypeName);
		if (Utils.isEmpty(found)) {
			return [];
		}
		return found.map((p) => ValueProperty.fromJSON(p));
	}

	/**
	 *
	 * @param id
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
				return Entity.untyped(typeName, found);
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

	async getInstances(typeName) {
		const entityType = await this.getEntityType(typeName);

		if (Utils.isEmpty(entityType)) {
			return [];
		}
		const found = await this.store.getInstances(typeName);
		return found.map((e) => Entity.fromJSON(entityType, e));
	}

	/**
	 * Tries to make sense of the given data to get an entity type.
	 * @param entityTypeSpec {*|string|EntityType} A type name, a type or a serialized type.
	 * @param throwError {boolean} Throw if the specs can't be interpreted into an entity type name.
	 * @returns {string|null}
	 */
	#getEntityTypeNameFromSpecs(entityTypeSpec, throwError = true) {
		if (Utils.isEmpty(entityTypeSpec)) {
			if (throwError) {
				throw new Error("Can't turn the given entity type specification into an entity type.");
			}
			return null;
		} else if (entityTypeSpec instanceof EntityType) {
			return entityTypeSpec.name;
		} else if (_.isString(entityTypeSpec)) {
			return entityTypeSpec;
		} else if (_.isPlainObject(entityTypeSpec)) {
			return entityTypeSpec.typeName !== "EntityType" ? null : entityTypeSpec.name;
		} else {
			if (throwError) {
				throw new Error("Can't turn the given entity type specification into an entity type.");
			}
			return null;
		}
	}

	#detachEntity(entity) {
		if (Utils.isEmpty(entity)) {
			return;
		}
		if (entity instanceof Entity) {
			entity.space = null;
			if (entity.entityType) {
				entity.entityType.space = null;
			}
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
			this.#detachEntity(entitySpec);
			return entitySpec;
		}
		const entityTypeName = this.#getEntityTypeNameFromSpecs(entityTypeSpec, throwError);
		let entity;
		if (this.enforceSchema) {
			const entityType = await this.getEntityType(entityTypeName);
			if (Utils.isEmpty(entityType)) {
				throw new Error(Strings.TypeDoesNotExist(entityTypeName));
			}
			entity = Entity.typed(entityType, entitySpec);
		} else {
			entity = Entity.untyped(entityTypeName, entitySpec);
		}
		entity.space = null;
		this.#detachEntity(entity);
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
			return this.#deserializeEntityType(json);
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
		return this.#deserializeEntityType(json);
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
	 * Removes an instance.
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

	async updateInstance(instance) {}

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
		this.#validateSchema(json);

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

	/**
	 * Validates the given schema for import.
	 * Things like id, name, description are optional and the typeName of the elements will be inserted if missing.
	 * @param json {*} The schema array.
	 */
	#validateSchema(json) {
		const entityTypes = json.map((e) => e.name);
		for (const entityType of json) {
			if (entityType.typeName !== "EntityType") {
				throw new Error(`Schema error: there is an object that isn't an EntityType (found: ${entityType.typeName || "nil"}).`);
			}
			if (Utils.isEmpty(entityType.name)) {
				throw new Error("Schema error: there is an entity type without a name.");
			}
			if (Utils.isEmpty(entityType.id)) {
				// throw new Error("Schema error: there is an entity type without an id.");
				entityType.id = Utils.id();
			}
			if (entityType.objectProperties) {
				for (const prop of entityType.objectProperties) {
					if (!_.includes(entityTypes, prop.objectType)) {
						throw new Error(Strings.InvalidSchemaType(prop.objectType, prop.name, entityType.name));
					}
					if (Utils.isEmpty(prop.name)) {
						throw new Error(`Schema error: an object property of '${entityType.name}' does not have a name.`);
					}
					if (Utils.isEmpty(prop.id)) {
						throw new Error(`Schema error: an object property of '${entityType.name}' does not have an id.`);
					}
				}
			}
			if (entityType.valueProperties) {
				for (const prop of entityType.valueProperties) {
					if (!ValueProperty.isValueType(prop.valueType)) {
						throw new Error(Strings.InvalidSchemaType(prop.valueType, prop.name, entityType.name));
					}
					if (Utils.isEmpty(prop.name)) {
						throw new Error(`Schema error: a value property of '${entityType.name}' does not have a name.`);
					}
					if (Utils.isEmpty(prop.id)) {
						throw new Error(`Schema error: a value property of '${entityType.name}' does not have an id.`);
					}
				}
			}
		}
	}
}

module.exports = EntitySpace;
