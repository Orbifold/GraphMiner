const Entity = require("./entity");
const utils = require("@graphminer/utils");
const strings = utils.strings;
const EntityTypeCollectionName = "EntityTypes";
const EntityCollectionName = "Entities";
const MetadataCollectionName = "Metadata";
const _ = require("lodash");
const EntityType = require("./entityType");

/**
 * Manages the entities via the {@link LocalStorage}.
 * There is a collection 'EntityType' holding types and
 * a collection 'Entities' holding the entities.
 * Keeping different entities in one collection makes it easier to search
 * for them but if things grow out of hand it can be advantageous to keep different
 * entities in different collections together with an index of id-to-entityType.
 */
class EntityStore {
	constructor(storage) {
		this.storage = storage;
	}

	async clear(entityTypes = true, entities = true) {
		if (entities) {
			await this.storage.remove({}, EntityCollectionName);
		}
		if (entityTypes) {
			await this.storage.remove({}, EntityTypeCollectionName);
		}
	}

	async getEntityTypeByName(entityTypeName) {
		return await this.storage.findOne({ name: entityTypeName }, EntityTypeCollectionName);
	}

	/**
	 * Fetches the metadata of the store.
	 * @returns {Promise<void>}
	 */
	async getMetadata(name = null) {
		let metadata = await this.storage.findOne({ __id: "Metadata" }, MetadataCollectionName);
		if (utils.isEmpty(metadata)) {
			metadata = {};
		} else {
			// hidden identifier
			delete metadata["__id"];
		}
		if (utils.isEmpty(name)) {
			return metadata;
		} else {
			return metadata[name];
		}
	}

	async setMetadata(name, value) {
		const metadata = (await this.getMetadata()) || {};
		metadata[name] = value;
		metadata["__id"] = "Metadata";
		return await this.storage.upsert(metadata, MetadataCollectionName, { __id: "Metadata" });
	}

	async assignMetadata(metadata) {
		metadata["__id"] = "Metadata";
		return await this.storage.upsert(metadata, MetadataCollectionName, { __id: "Metadata" });
	}

	/**
	 * Upserts an entity type.
	 * @param obj {*|EntityType} An entity type (possibly serialized).
	 * @returns {Promise<void>}
	 */
	async upsertEntityType(obj) {
		let json;
		// if json, is it a serialized entity type?
		if (_.isPlainObject(obj)) {
			// this will validate the json
			utils.validateJsonIsForType(obj, "EntityType");
			json = obj;
		} else if (obj instanceof EntityType) {
			json = JSON.parse(JSON.stringify(obj));
		}
		await this.storage.upsert(json, EntityTypeCollectionName, { name: obj.name });
	}

	/**
	 * Returns all entity types.
	 * @returns {Promise<*>}
	 */
	async getEntityTypes() {
		return await this.storage.find({}, EntityTypeCollectionName);
	}

	async removeEntityType(entityTypeName, removeInstances = true) {
		await this.storage.remove({ name: entityTypeName }, EntityTypeCollectionName);
		if (removeInstances) {
			this.storage.remove({ typeName: entityTypeName }, EntityCollectionName);
		}
	}

	async removeInstance(id) {
		this.storage.remove({ id }, EntityCollectionName);
	}

	async removeInstances(entityTypeName) {
		this.storage.remove({ typeName: entityTypeName }, EntityCollectionName);
	}

	async getValueProperties(entityTypeName) {
		const found = await this.storage.findOne({ name: entityTypeName }, EntityTypeCollectionName);
		if (utils.isEmpty(found)) {
			return [];
		}
		return found.valueProperties;
	}

	/**
	 * Upserts an entity.
	 * @returns {Promise<void>}
	 * @param {*[]} options Either an {@link Entity} (possibly as JSON) or the entity type followed by the data to assign.
	 */
	async upsertInstance(...options) {
		let json;
		if (options.length === 0) {
			throw new Error(strings.IsNil("options", "Entities.upsertInstance"));
		} else if (options.length === 1) {
			if (options instanceof Entity) {
				json = JSON.parse(JSON.stringify(options));
			} else if (_.isPlainObject(options)) {
				json = options;
			} else {
				throw new Error(strings.ShoudBeType("options", "Entity or JSON", "Entities.upsertInstance"));
			}
		} else if (options.length === 2) {
			json = options[1];
			json.typeName = options[0];
		}
		this.validateInstance(json);
		await this.storage.upsert(json, EntityCollectionName, { id: json.id });
		// await this.storage.upsert(json, EntityCollectionName, (e) => {
		// 	return e.id === json.id;
		// });
	}

	validateInstance(instance) {
		if (utils.isEmpty(instance.typeName)) {
			throw new Error(strings.IsNil("typeName", "Entities.upsertInstance"));
		}
		if (utils.isEmpty(instance.id)) {
			instance.id = utils.id();
		}
	}

	async getInstanceById(id) {
		return await this.storage.findOne({ id }, EntityCollectionName);
	}

	async getInstances(typeName) {
		return await this.storage.find({ typeName }, EntityCollectionName);
	}

	async getEntityType(entityTypeName) {
		return await this.storage.findOne({ name: entityTypeName }, EntityTypeCollectionName);
	}

	async #getEntityTypeNames() {
		const types = await this.getEntityTypes();
		if (utils.isEmpty(types)) {
			return [];
		}
		return types.map((u) => u.name);
	}

	async countEntityTypes() {
		return await this.storage.count({}, EntityTypeCollectionName);
	}

	async countEntities() {
		return await this.storage.count({}, EntityCollectionName);
	}

	async countInstances(entityTypeName = null) {
		if (utils.isEmpty(entityTypeName)) {
			return await this.storage.count({}, EntityCollectionName);
		} else {
			return await this.storage.count({ typeName: entityTypeName }, EntityCollectionName);
		}
	}

	async randomInstance(entityTypeName = null, amount = 10) {
		let specs = {};
		if (!utils.isEmpty(entityTypeName)) {
			specs.name = entityTypeName;
		}
		return await this.storage.find(specs, EntityCollectionName, null, amount);
	}

	async save() {
		return await this.storage.save();
	}
}

module.exports = EntityStore;
