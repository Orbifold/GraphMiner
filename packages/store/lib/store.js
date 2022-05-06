const {Strings, Utils} = require("@graphminer/utils");
// /ignore file coverage/

/*
 * Base class for storage implementations.
 * */
class Store {

    constructor() {
        if (this.constructor === Store) {
            throw new Error(Strings.AbstractClass("Store"));
        }
    }


    async init(context = null, settings = null) {
        throw new Error(Strings.NotImplementedAbstract())
    }


    async createCollection(specs) {
        throw new Error(Strings.NotImplementedAbstract())
    }


    async collectionExists(collectionName) {
        throw new Error(Strings.NotImplementedAbstract())
    }


    async insert(blob, collectionName) {
        throw new Error(Strings.NotImplementedAbstract())
    }


    async update(blob, collectionName, condition) {
        throw new Error(Strings.NotImplementedAbstract())
    }


    upsert(blob, collectionName, condition = null) {
        throw new Error(Strings.NotImplementedAbstract())
    }


    async find(specs, collectionName, sortField = null, limit = 10000) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async count(specs = {}, collectionName) {
        throw new Error(Strings.NotImplementedAbstract())
    }


    async findOne(specs = {}, collectionName) {
        throw new Error(Strings.NotImplementedAbstract())
    }


    remove(doc = {}, collectionName) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    removeWhere(specs = {}, collectionName) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    distinct(specs = {}, field, collectionName) {
        throw new Error(Strings.NotImplementedAbstract())
    }


    async removeCollection(collectionName) {
        throw new Error(Strings.NotImplementedAbstract())
    }

    async listCollections() {
        throw new Error(Strings.NotImplementedAbstract())
    }


    async random(collectionName) {
        throw new Error(Strings.NotImplementedAbstract())
    }
}

module.exports = Store;
