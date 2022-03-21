const _ = require("lodash");
const {Strings, Utils} = require("@graphminer/utils");
// /ignore file coverage/
/*
 * Base class for storage implementations.
 * See the LocalEntityStore for the default one.
 * */
class EntityStore {
    constructor() {
        if (this.constructor === EntityStore) {
            throw new Error(Strings.AbstractClass("EntityStore"));
        }
    }

    async init() {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async clear(entityTypes = true, entities = true) {
        throw new Error(Strings.NotImplementedAbstract())
    }


    async getMetadata(name = null) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async setMetadata(name, value) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async assignMetadata(metadata) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async upsertEntityType(obj) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async getEntityTypes() {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async removeEntityType(entityTypeName, removeInstances = true) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async removeInstance(id) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async removeInstances(entityTypeName) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async getValueProperties(entityTypeName) {
        throw new Error(Strings.NotImplementedAbstract())
    }


    async upsertInstance(...options) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    validateInstance(instance) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async getInstanceById(id) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async getInstances(typeName) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async getEntityType(entityTypeName) {
        throw new Error(Strings.NotImplementedAbstract())
    }
    async getEntityTypeById(id) {
        throw new Error(Strings.NotImplementedAbstract())
    }


    async countEntityTypes() {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async countEntities() {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async countInstances(entityTypeName = null) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async randomInstances(entityTypeName = null, amount = 10) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async save() {
        throw new Error(Strings.NotImplementedAbstract())
    }
}

module.exports = EntityStore;
