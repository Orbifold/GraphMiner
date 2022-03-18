const utils = require("@graphminer/utils");
const strings = utils.strings;

const _ = require("lodash"),
	EntityType = require("./entityType");
const localStorage = require("@graphminer/store");
const Entity = require("./entity");
const ValueProperty = require("./valueProperty");
const EntityStore = require("./entityStore");

/**
 * Gateway to entities.
 * Strictly speaking an object-graph-mapper (OGM).
 * @example
 * // default saves things to ~/.graphminer/localStorage.json
 * const em = new EntitySpace();
 * await em.init();
 *
 * @example
 * // in-memory entity store
 * const em = new EntitySpace();
 * await em.init(null, "memory");
 */
class EntitySpace {
	#metadata;

	constructor() {
		this.#metadata = null;
	}

	get enforceSchema() {
		return this.settings.enforceSchema ?? true;
	}

	set enforceSchema(v) {
		if (utils.isEmpty(v)) {
			throw new Error(strings.IsNil("value", "EntitySpace.enforceSchema"));
		}
		this.settings.enforceSchema = v;
	}

	/**
	 * Returns an entity of the specified type with pseudo-random data.
	 * If no type is specified a random type will be generated.
	 * @param typeName? {string} Optional type of entity to create.
	 * @param amount? {number} The amount of entities to create. Default is one.
	 * @returns {EntityBase|[EntityBase]} If the amount is one a single entity is returned, otherwise and array of the specified type.
	 */
	async random(typeName = null, amount = 1) {
		this.ensureStoreMethodExists("randomInstance");

		const found = await this.store.randomInstance(typeName, amount);
		if (utils.isEmpty(found)) {
			return null;
		}
		return amount === 1 ? found[0] : found;
	}

	/**
	 * Fetches the names of the entity types.
	 * @returns {Promise<string[]>}
	 */
	async #getEntityTypeNames() {
		const types = await this.store.getEntityTypes();
		if (utils.isEmpty(types)) {
			return [];
		}
		return types.map((u) => u.name);
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
		const [amount, args] = utils.getArguments(options);
		if (!utils.isEmpty(this.store)) {
			console.warn("The EntitySpace was already initialized.");
			return;
		}
		let settings = {};
		let storage;
		const EntityStore = require("./entityStore");
		switch (amount) {
			case 0:
				storage = await localStorage.inMemory();
				this.store = new EntityStore(storage);
				break;
			case 1:
				if (_.isString(args[0])) {
					let storage = new localStorage();
					await storage.init(null, args[0]);

					const EntityStore = require("./entityStore");
					this.store = new EntityStore(storage);
				} else {
					const context = args[0];
					if (context.services) {
						this.store = context.services["entitiesStore"];
					} else {
						throw new Error("First argument should be a string defining the local storage or a GraphMiner context object.");
					}
				}
				break;
			case 2:
				storage = new localStorage();
				const context = args[0];
				settings = args[1];
				await storage.init(context, settings);
				this.store = new EntityStore(storage);
		}

		const defaults = {
			enforceSchema: true,
		};
		this.settings = _.assign(defaults, settings);
		await this.#ensureHasId();
	}

	async #ensureHasId() {
		const id = await this.getMetadata("id");
		if (utils.isEmpty(id)) {
			await this.store.setMetadata("id", utils.id());
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
			return await this.addEntityType(entityType);
		} else if (options instanceof EntityType) {
			const entityType = options;
			// upsert will overwrite but adding it causes an exception if already there
			const found = await this.getEntityType(entityType.name);
			if (!utils.isEmpty(found)) {
				throw new Error(strings.ExistsAlready(entityType.name, "Entities"));
			}
			await this.upsertEntityType(entityType);
			return entityType;
		} else {
			throw new Error(strings.WrongArguments("Entities.addEntityType"));
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
			throw new Error(strings.ShoudBeType("options", "EntityType or name of an EntityType", "Entities.addValueProperty"));
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
	 * Adds a new entity type.
	 * @param options {*|string} The name of a new type or an instance of {@link EntityType}.
	 * @returns {Promise<string>} The id of the entity type.
	 */
	async upsertEntityType(options) {
		this.ensureStoreMethodExists("upsertEntityType");
		if (_.isString(options)) {
			const exists = await this.entityTypeExists(options);
			if (exists) {
				throw new Error(strings.ExistsAlready(options, "Entities"));
			}
			const entityType = new EntityType(options);
			await this.store.upsertEntityType(entityType);
			return entityType.id;
		} else if (options instanceof EntityType) {
			const entityType = options;
			await this.validateEntityType(entityType);
			await this.store.upsertEntityType(entityType);
			return entityType.id;
		} else {
			throw new Error(strings.Invalid(typeof options, "Entities.upsertEntityType"));
		}
	}

	/**
	 * Adds an entity type from its JSON format.
	 * @param json {*} A serialized {@link EntityType}.
	 * @returns {Promise<string>} The id of the entity type.
	 */
	async addEntityTypeFromJson(json) {
		if (utils.isEmpty(json)) {
			throw new Error(strings.IsNil("Entities", "addEntityTypeFromJson"));
		}
		if (!_.isPlainObject(json)) {
			throw new Error(strings.ShoudBeType("json", "JSON", "Entities.addEntityTypeFromJson"));
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
		// 	throw new Error(strings.ExistsAlready(entityType.name, "Entities"));
		// }
		if (!this.settings.enforceSchema) {
			return;
		}
		const entityTypeNames = await this.#getEntityTypeNames();
		// checking the object props
		for (let def of entityType.objectProperties) {
			// if objectType is the same it represents a self-reference
			if (!_.includes(entityTypeNames, def.objectType) && entityType.name !== def.objectType) {
				throw new Error(strings.TypeDoesNotExist(def.objectType));
			}
		}
	}

	/**
	 * Checks whether the specified type already exists.
	 * @param entityTypeName {string} The type name.
	 * @returns {Promise<boolean>}
	 */
	async entityTypeExists(entityTypeName) {
		this.ensureStoreMethodExists("getEntityTypeByName");
		return !utils.isEmpty(await this.store.getEntityTypeByName(entityTypeName));
	}

	ensureStoreMethodExists(methodName) {
		if (utils.isEmpty(this.store)) {
			throw new Error(strings.IsNil("entitiesStore", "Entities"));
		}
		if (utils.isEmpty(methodName)) {
			throw new Error(strings.IsNil(methodName, "entitiesStore"));
		}
	}

	async checkEntityTypeIsInSchema(entityTypeName) {
		if (!this.settings.enforceSchema) {
			return;
		}
		const found = await this.entityTypeExists(entityTypeName);
		if (!found) {
			throw new Error(strings.TypeDoesNotExist(entityTypeName));
		}
	}

	async removeEntityType(entityTypeName, removeInstances = true) {
		const exists = await this.entityTypeExists(entityTypeName);
		if (!exists) {
			return;
		}
		this.ensureStoreMethodExists("removeEntityType");
		await this.store.removeEntityType(entityTypeName, removeInstances);
	}

	/**
	 * Adds an instance of the specified type.
	 * @param entityTypeName {string} The entity type.
	 * @param instanceData {*|string} The data or just the name of the instance.
	 * @returns {Promise<string|*>}
	 */
	async upsertInstance(entityTypeName, instanceData) {
		if (entityTypeName instanceof EntityType) {
			entityTypeName = entityTypeName.name;
		}
		await this.checkEntityTypeIsInSchema(entityTypeName);
		const data = await this.mapDataToEntity(entityTypeName, instanceData);
		// if not enforced the type is not added to the EntityTypes collection
		// which is necessary for knowing which collections contain entities.
		// In the default store you can have various collections unrelated to entities.
		if (!this.settings.enforceSchema) {
			const exists = await this.entityTypeExists(entityTypeName);
			if (!exists) {
				await this.store.upsertEntityType(new EntityType(entityTypeName));
			}
		}
		await this.store.upsertInstance(entityTypeName, data);
		return data.id;
	}

	async mapDataToEntity(entityTypeName, instanceData) {
		if (utils.isEmpty(instanceData)) {
			throw new Error(strings.IsNil("instanceData", "Entities"));
		}
		if (utils.isEmpty(entityTypeName)) {
			throw new Error(strings.IsNil("entityTypeName", "Entities"));
		}
		if (_.isString(instanceData)) {
			return {
				id: utils.id(),
				name: instanceData,
				typeName: entityTypeName,
			};
		} else if (_.isPlainObject(instanceData)) {
			if (this.settings.enforceSchema) {
				const valueProps = await this.getValueProperties(entityTypeName);
				let data = {
					id: instanceData.id || utils.id(),
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
				if (utils.isEmpty(instanceData.id)) {
					instanceData.id = utils.id();
				}
				instanceData.typeName = entityTypeName;
				return instanceData;
			}
		} else {
			if (instanceData.constructor) {
				return await this.mapDataToEntity(entityTypeName, JSON.parse(JSON.stringify(instanceData)));
			} else {
				throw new Error(strings.Invalid(typeof instanceData, "Entities"));
			}
		}
	}

	async getValueProperties(entityTypeName) {
		this.ensureStoreMethodExists("getValueProperties");
		const found = await this.store.getValueProperties(entityTypeName);
		if (utils.isEmpty(found)) {
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
		if (utils.isEmpty(found)) {
			return null;
		}
		const typeName = found.typeName;
		const entityType = await this.getEntityType(typeName);
		return Entity.fromJSON(entityType, found);
	}

	async getInstances(typeName) {
		const entityType = await this.getEntityType(typeName);

		if (utils.isEmpty(entityType)) {
			return [];
		}
		const found = await this.store.getInstances(typeName);
		return found.map((e) => Entity.fromJSON(entityType, e));
	}

	/**
	 * Returns the specified entity type.
	 * Note that this returns a clone and to update a type you
	 * need to use {@link upsertEntityType}.
	 * @param entityTypeName {string} The type name.
	 * @returns {Promise<null|EntityType>}
	 */
	async getEntityType(entityTypeName) {
		this.ensureStoreMethodExists("getEntityType");
		const json = await this.store.getEntityType(entityTypeName);
		if (utils.isEmpty(json)) {
			return null;
		}
		return EntityType.fromJSON(json);
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

	async updateEntityType(entityType) {
		if (utils.isEmpty(entityType)) {
			throw new Error(strings.IsNil("entityType", "Entities.updateEntityType"));
		}
		if (!(entityType instanceof EntityType)) {
			throw new Error(strings.ShoudBeType("entityType", "EntityType", "Entities.updateEntityType"));
		}
		const exists = await this.entityTypeExists(entityType.name);
		if (!exists) {
			throw new Error(strings.ExistsAlready(entityType.name, "Entities"));
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
		if (utils.isEmpty(json)) {
			throw new Error(strings.IsNil("json", "Entities.fromJSON"));
		}
		const typeName = json.typeName;
		const exists = await this.entityTypeExists(typeName);
		if (!exists) {
			throw new Error(strings.TypeDoesNotExist(typeName));
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
		if (utils.isEmpty(json)) {
			throw new Error(strings.IsNil("json", "EntitySpace.importInstances"));
		}
		if (!_.isArray(json)) {
			throw new Error(strings.ShoudBeType("json", "array", "EntitySpace.importInstances"));
		}
		if (replace) {
			this.ensureStoreMethodExists("clear");
			await this.store.clear(false, true);
		}
		for (const entity of json) {
			const entityTypeName = entity.typeName;
			if (utils.isEmpty(entityTypeName)) {
				throw new Error(strings.IsNil("entity.name", "EntitySpace.importInstances"));
			}
			await this.upsertInstance(entityTypeName, entity);
		}
	}

	async importEntitySpace(json, replace = false) {
		if (utils.isEmpty(json)) {
			throw new Error(strings.IsNil("json", "EntitySpace.importInstances"));
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
			if (utils.isEmpty(entityType.name)) {
				throw new Error("Schema error: there is an entity type without a name.");
			}
			if (utils.isEmpty(entityType.id)) {
				// throw new Error("Schema error: there is an entity type without an id.");
				entityType.id = utils.id();
			}
			if (entityType.objectProperties) {
				for (const prop of entityType.objectProperties) {
					if (!_.includes(entityTypes, prop.objectType)) {
						throw new Error(strings.InvalidSchemaType(prop.objectType, prop.name, entityType.name));
					}
					if (utils.isEmpty(prop.name)) {
						throw new Error(`Schema error: an object property of '${entityType.name}' does not have a name.`);
					}
					if (utils.isEmpty(prop.id)) {
						throw new Error(`Schema error: an object property of '${entityType.name}' does not have an id.`);
					}
				}
			}
			if (entityType.valueProperties) {
				for (const prop of entityType.valueProperties) {
					if (!ValueProperty.isValueType(prop.valueType)) {
						throw new Error(strings.InvalidSchemaType(prop.valueType, prop.name, entityType.name));
					}
					if (utils.isEmpty(prop.name)) {
						throw new Error(`Schema error: a value property of '${entityType.name}' does not have a name.`);
					}
					if (utils.isEmpty(prop.id)) {
						throw new Error(`Schema error: a value property of '${entityType.name}' does not have an id.`);
					}
				}
			}
		}
	}
}

module.exports = EntitySpace;
module.exports.Entity = Entity;
module.exports.EntityType = EntityType;
