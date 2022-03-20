const Entity = require("./entity");
const {Utils, Strings} = require("@graphminer/Utils");

const _ = require("lodash");
const EntityType = require("./entityType");
const {LocalStorage} = require("@graphminer/store")
const EntityStore = require("./entityStore");

/**
 * The name of the collection storing the entity types.
 */
const EntityTypeCollectionName = "EntityTypes";
/**
 * The name of the collection storing the entities.
 */
const EntityCollectionName = "Entities";
/**
 * The name of the collection storing the metadata.
 */
const MetadataCollectionName = "Metadata";

/**
 * Manages the entities via the {@link LocalStorage}.
 *
 * - There is a collection 'EntityType' holding types and a collection 'Entities' holding the entities.
 * - Keeping different entities in one collection makes it easier to search for them but if things grow out of hand it can be advantageous to keep different entities in different collections together with an index of id-to-entityType.
 * - The store returns JSON, not strongly typed elements. The EntitySpace turns this JSON into actual elements.
 */
class LocalEntityStore extends EntityStore {
    /**
     * Ensures that the initialization doesn't happen multiple times.
     */
    #initialized = false;

    constructor() {
        super();
    }

    /**
     * Returns an in-memory space.
     * @returns {Promise<LocalEntityStore>}
     */
    static async inMemory() {
        const entityStore = new LocalEntityStore();
        entityStore.storage = await LocalStorage.inMemory();
        return entityStore
    }

    /**
     * Returns a space with file-based storage (under ~/.graphminer).
     * @returns {Promise<LocalEntityStore>}
     */
    static async default() {
        const entityStore = new LocalEntityStore();
        entityStore.storage = await LocalStorage.default();
        return entityStore
    }

    /**
     * Initializes this entity store.
     * @param context
     * @param settings
     * @returns {Promise<void>}
     */
    async init(context = null, settings = "memory") {
        if (this.#initialized) {
            console.warn("The LocalEntityStore was already initialized.")
            return
        }
        this.storage = new LocalStorage();
        await this.storage.init(context, settings)
        this.#initialized = true
    }

    /**
     * Clears this store.
     * @param entityTypes {boolean} If true the types will be cleared.
     * @param entities {boolean} If true the instances will be cleared.
     * @returns {Promise<void>}
     */
    async clear(entityTypes = true, entities = true) {
        if (entities) {
            await this.storage.removeWhere({}, EntityCollectionName);
        }
        if (entityTypes) {
            await this.storage.removeWhere({}, EntityTypeCollectionName);
        }
    }

    /**
     * Returns the EntityType with the specified id.
     * @param id {string} The id of the type.
     * @returns {Promise<null|*>}
     */
    async getEntityTypeById(id) {
        if (Utils.isEmpty(id)) {
            return null;
        }
        if (!_.isString(id)) {
            throw new Error(Strings.ShoudBeType("id", "string", "LocalEntityStore.getEntityTypeById"))
        }
        return await this.storage.findOne({id}, EntityTypeCollectionName);
    }

    /**
     * Fetches the metadata of the store.
     * @returns {Promise<void>}
     */
    async getMetadata(name = null) {
        let metadata = await this.storage.findOne({__id: "Metadata"}, MetadataCollectionName);
        if (Utils.isEmpty(metadata)) {
            metadata = {};
        } else {
            // hidden identifier
            delete metadata["__id"];
        }
        if (Utils.isEmpty(name)) {
            return metadata;
        } else {
            return metadata[name];
        }
    }

    async setMetadata(name, value) {
        const metadata = (await this.getMetadata()) || {};
        metadata[name] = value;
        metadata["__id"] = "Metadata";
        return await this.storage.upsert(metadata, MetadataCollectionName, {__id: "Metadata"});
    }

    async assignMetadata(metadata) {
        metadata["__id"] = "Metadata";
        return await this.storage.upsert(metadata, MetadataCollectionName, {__id: "Metadata"});
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
            Utils.validateJsonIsForType(obj, "EntityType");
            json = obj;
        } else if (obj instanceof EntityType) {
            json = JSON.parse(JSON.stringify(obj));
        }
        await this.storage.upsert(json, EntityTypeCollectionName, {name: obj.name});
    }

    /**
     * Returns all entity types.
     * @returns {Promise<*>}
     */
    async getEntityTypes() {
        return await this.storage.find({}, EntityTypeCollectionName);
    }

    /**
     * Removes the specified EntityType and optionally all related instances.
     * @param entityTypeName {string} The  type name.
     * @param removeInstances {boolean} Whether the instances with the specified type should also be removed.
     * @returns {Promise<void>}
     */
    async removeEntityType(entityTypeName, removeInstances = true) {
        if (Utils.isEmpty(entityTypeName)) {
            return
        }
        if (!_.isString(entityTypeName)) {
            throw new Error(Strings.ShoudBeType("entityTypeName", "string", "LocalEntityStore.removeEntityType"))
        }
        await this.storage.removeWhere({name: entityTypeName}, EntityTypeCollectionName);
        if (removeInstances) {
            await this.storage.removeWhere({typeName: entityTypeName}, EntityCollectionName);
        }
    }

    async removeInstance(id) {
        if(Utils.isEmpty(id)){
            return
        }
        this.storage.removeWhere({id}, EntityCollectionName);
    }

    async removeInstances(entityTypeName) {
        this.storage.removeWhere({typeName: entityTypeName}, EntityCollectionName);
    }

    async getValueProperties(entityTypeName) {
        const found = await this.storage.findOne({name: entityTypeName}, EntityTypeCollectionName);
        if (Utils.isEmpty(found)) {
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
        const [count, args] = Utils.getArguments(options)
        let json;
        switch (count) {
            case 0:
                throw new Error(Strings.IsNil("options", "Entities.upsertInstance"));

            case 1:
                const e = args[0];
                if (e instanceof Entity) {
                    json = JSON.parse(JSON.stringify(e));
                } else if (_.isPlainObject(e)) {
                    json = e;
                } else {
                    throw new Error(Strings.ShoudBeType("options", "Entity or JSON", "Entities.upsertInstance"));
                }
                break
            case 2:
                json = args[1];
                json.typeName = args[0];
                if(!_.isPlainObject(json)){
                    throw new Error(Strings.ShoudBeType("instance data","plain object","LocalEntityStore.upsertInstance"))
                }
                break
        }
        this.validateInstance(json);
        await this.storage.upsert(json, EntityCollectionName, {id: json.id});
        // await this.storage.upsert(json, EntityCollectionName, (e) => {
        // 	return e.id === json.id;
        // });
    }

    validateInstance(instance) {
        if (Utils.isEmpty(instance.typeName)) {
            throw new Error(Strings.IsNil("typeName", "Entities.upsertInstance"));
        }
        if (Utils.isEmpty(instance.id)) {
            instance.id = Utils.id();
        }
    }

    async getInstanceById(id) {
        return await this.storage.findOne({id}, EntityCollectionName);
    }

    async getInstances(typeName) {
        return await this.storage.find({typeName}, EntityCollectionName);
    }

    /**
     * Returns an entity type with the given name.
     * @param entityTypeSpec {*|string} The name of the type, an EntityType or a serialized EntityType
     * @returns {Promise<null|*>}
     */
    async getEntityType(entityTypeSpec) {
        if (Utils.isEmpty(entityTypeSpec)) {
            return null;
        }
        let entityTypeName = null;
        if ((entityTypeSpec instanceof EntityType) || _.isPlainObject(entityTypeSpec)) {
            if (entityTypeSpec.typeName !== "EntityType") {
                console.warn("Attempt to fetch an EntityType with the wrong type.")
                return null
            }
            entityTypeName = entityTypeSpec.name;
        } else if (_.isString(entityTypeSpec)) {
            entityTypeName = entityTypeSpec.toString().trim()
        }
        const found = await this.storage.findOne({name: entityTypeName}, EntityTypeCollectionName) ;
        return found|| null
    }

    async #getEntityTypeNames() {
        const types = await this.getEntityTypes();
        if (Utils.isEmpty(types)) {
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
        if (Utils.isEmpty(entityTypeName)) {
            return await this.storage.count({}, EntityCollectionName);
        } else {
            return await this.storage.count({typeName: entityTypeName}, EntityCollectionName);
        }
    }

    /**
     *
     * @param entityTypeName
     * @param amount
     * @returns {Promise<Entity[]>}
     */
    async randomInstances(entityTypeName = null, amount = 10) {
        let specs = {};
        if (!Utils.isEmpty(entityTypeName)) {
            specs.typeName = entityTypeName;
        }
        if (amount < 1) {
            throw new Error("The amount should be an integer larger than zero.")
        }
        const max = await this.storage.count({}, EntityCollectionName)
        if (amount >= max) {
            return await this.storage.find({}, EntityCollectionName)
        }
        const coll = [];
        for (let i = 0; i < amount; i++) {
            coll.push(await this.storage.random(EntityCollectionName))
        }
        return coll;
    }

    async save() {
        return await this.storage.save();
    }
}

module.exports = LocalEntityStore;
