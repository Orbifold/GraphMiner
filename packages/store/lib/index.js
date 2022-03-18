const loki = require("lokijs");
const _ = require("lodash");
const utils = require("@graphminer/utils");
const path = require("path");
const fs = require("fs");
const { set } = require("lodash");
const strings = utils.strings;

/**
 * Default storage implementations used by GraphMiner and related plugins.
 *
 * - Lokijs is used for in-memory and file storage in JSON format.
 * - Loki is synchronous but the methods store implemented are async to ensure compatibility with e.g. MongoDB.
 * - Use a document store like MongoDB or CosmosDB for scale, performance and reliability. This lightweight implementation works well for prototyping ideas.
 *
 * @example
 * <caption>This creates an in-memory database, no need to call the `init` method in this case. It effectively creates a volatile document database.</caption>
 *
 * const storage = await LocalStorage.inMemory();
 *
 * @class LocalStorage
 * @see https://github.com/techfort/LokiJS
 */
class LocalStorage {
	/**
	 * Underlying Loki database handling effectively the storage.
	 * @type *
	 */
	#db;

	/**
	 * The settings of the database.
	 */
	settings;

	/**
	 * Whether the current instance is in-memory.
	 * @type {boolean}
	 */
	#inMemory = true;

	/**
	 * Creates a new storage instance.
	 * You need to call the {@link init} after instantiation.
	 */
	constructor() {}

	static get defaultDatabasePath() {
		const homeDir = require("os").homedir();
		return path.join(homeDir, ".graphminer", "localStorage.json");
	}

	/**
	 * Returns whether this is an in-memory instance.
	 * @returns {boolean}
	 */
	get isInMemory() {
		return this.#inMemory;
	}

	/**
	 * Return the path to where the database is stored.
	 * If this is an in-memory store it will return null;
	 * @returns {null|*}
	 */
	get databasePath() {
		if (this.isInMemory) {
			return null;
		}
		return this.settings.filePath;
	}

	/**
	 * Returns an in-memory storage instance.
	 * No need to call the {@link init} in this case.
	 * @returns {Promise<LocalStorage>}
	 * @async
	 * @example
	 *
	 * const storage = await LocalStorage.inMemory();
	 * await storage.createCollection("Cars");
	 */
	static async inMemory() {
		const storage = new LocalStorage();
		await storage.init(null, "memory");
		return storage;
	}

	/**
	 * Returns a default storage instance saving the data to disk in the user's directory under '.graphminer'.
	 * @returns {Promise<LocalStorage>}
	 * @async
	 * @example
	 *
	 * const storage = await LocalStorage.default();
	 * // note that the collection will be created on the fly:
	 * await storage.insert({name: "GraphMiner"}, "Info");
	 */
	static async default() {
		const storage = new LocalStorage();
		await storage.init(null, "default");
		return storage;
	}

	/**
	 * Checks that the db has been initialized.
	 */
	#ensureInit() {
		if (utils.isEmpty(this.#db)) {
			throw new Error("You need to call the 'init' method on the store before using it.");
		}
	}

	/**
	 * Create the Loki database for the given settings.
	 * @param settings
	 */
	#createDatabase(settings) {
		this.settings = settings;

		if (this.settings.env === "BROWSER") {
			this.#db = new loki(this.settings.filePath, settings);
		} else {
			const dirName = path.dirname(this.settings.filePath);
			fs.mkdirSync(dirName, { recursive: true });
			this.#db = new loki(settings.filePath, settings);
		}
	}

	#getInMemorySettings() {
		const homeDir = require("os").homedir();
		return {
			filePath: path.join(homeDir, ".graphminer", "inMemory.json"),
			autosave: false,
			autoload: false,
		};
	}

	#getDefaultSettings(resolve) {
		return {
			filePath: LocalStorage.defaultDatabasePath,
			autosave: true,
			autoload: true,
			autoloadCallback: () => {
				resolve();
			},
		};
	}

	#getBrowserSettings(resolve) {
		return {
			env: "BROWSER",
			filePath: "graphminer.json",
			autosave: true,
			autoload: true,
			autosaveInterval: 2000,
			autoloadCallback: () => {
				resolve();
			},
		};
	}

	/**
	 * Initializes this service.
	 * Note that the default is to store things in a file under '~/.graphminer/localStorage.json'.
	 * @param context {*} The GraphMiner context.
	 * @param settings {*} The original settings given.
	 * @returns {Promise<void>}
	 */
	async init(context = null, settings = null) {
		const that = this;
		if (_.isString(settings)) {
			switch (settings.toString().trim().toLowerCase()) {
				case "memory":
				case "in-memory":
					this.#inMemory = true;
					return this.#createDatabase(this.#getInMemorySettings());
				case "default":
				case "normal":
				case "standard":
					this.#inMemory = false;
					return new Promise((resolve, reject) => {
						this.#createDatabase(that.#getDefaultSettings(resolve));
					});
				case "browser":
					this.#inMemory = true;
					return new Promise((resolve, reject) => {
						this.#createDatabase(that.#getBrowserSettings(resolve));
					});
				// this.#db = new loki("stuff.db", {
				// 	env: "BROWSER",
				// 	autoload: true,
				// 	autosave: true,
				// 	autosaveInterval: 4000,
				// });
				//
				// let coll = this.#db.getCollection("users");
				// if (!coll) {
				// 	coll = this.#db.addCollection("users");
				// }
				// coll.insert({ name: utils.randomId() });
				// console.log(coll.find({}).map((u) => u.name));
				// return;
				default:
					this.#inMemory = false;
					return new Promise((resolve, reject) => {
						const finalSettings = that.#getDefaultSettings(resolve);
						finalSettings.filePath = settings;
						this.#createDatabase(finalSettings);
					});
			}
		} else {
			return new Promise((resolve, reject) => {
				const defaults = that.#getDefaultSettings(resolve);
				const options = _.assign(defaults, settings);
				this.#inMemory = utils.isEmpty(options.autosave) ? false : !options.autosave;
				if (this.#inMemory) {
					options.autoloadCallback = null;
					options.autoload = false;
					this.#db = new loki("inMemory.db");
					resolve();
				} else {
					this.#createDatabase(options);
				}
			});
		}
	}

	#validateSettings(settings) {
		let m = null;
		if (utils.isEmpty(settings.filePath)) {
			m = strings.IsNil("filePath", "LocalStorage");
		}

		return m;
	}

	/**
	 * Closes the database connection.
	 * @returns {Promise<void>}
	 */
	async close() {
		this.#ensureInit();
		if (!this.#inMemory) {
			this.#db.save();
		}
		this.#db.close();
		this.#db = null;
	}

	async save() {
		return new Promise((resolve, reject) => {
			this.#db.saveDatabase(function (err) {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	/**
	 * This method is not async.
	 * @param collectionName
	 * @param indexSpec
	 * @returns {*}
	 */
	#getCreateCollection(collectionName, indexSpec) {
		if (utils.isEmpty(collectionName)) {
			throw new Error("Cannot create or fetch an empty storage collection.");
		}
		let collection = this.#db.getCollection(collectionName);
		if (!collection) {
			if (!utils.isEmpty(indexSpec)) {
				let index = [];
				if (_.isArray(indexSpec)) {
					index = _.concat(index, indexSpec);
				} else if (_.isString(indexSpec)) {
					index.push(indexSpec);
				} else {
					throw new Error("When fetching/creating a storage collection a unique index can only be specified through an index name or an array of names.");
				}
				collection = this.#db.addCollection(collectionName, {
					unique: index,
				});
			} else {
				collection = this.#db.addCollection(collectionName);
			}
		}
		return collection;
	}

	/**
	 * Creates a document collection.
	 * @param specs
	 * @returns {Promise<*>}
	 */
	async createCollection(specs) {
		this.#ensureInit();
		if (_.isString(specs)) {
			specs = {
				collectionName: specs,
				storageName: specs,
			};
		} else {
			if (_.isNil(specs.collectionName)) {
				throw new Error("No collectionName specified.");
			}
			if (_.isNil(specs.storageName)) {
				specs.storageName = specs.collectionName;
			}
		}
		this.#getCreateCollection(specs.collectionName, specs.index);
	}

	/**
	 * Returns whether the specified collection exists.
	 * @param collectionName {string} The name of the collection.
	 * @returns {Promise<boolean>}
	 */
	async collectionExists(collectionName) {
		this.#ensureInit();
		let collection = this.#db.getCollection(collectionName);
		return !utils.isEmpty(collection);
	}

	/**
	 * Inserts a new document in the specified collection.
	 * @param blob {*} A document.
	 * @param collectionName {string} The name of the collection.
	 * @returns {Promise<void>}
	 */
	async insert(blob, collectionName) {
		this.#ensureInit();
		if (utils.isEmpty(collectionName)) {
			throw new Error(strings.IsNil("collectionName", "LocalStorage.insert"));
		}
		if (utils.isEmpty(blob)) {
			throw new Error(strings.IsNil("blob", "LocalStorage.insert"));
		}
		let collection = this.#getCreateCollection(collectionName);
		collection.insert(blob);
	}

	/**
	 * Updates some documents.
	 * @param blob
	 * @param collectionName
	 * @param condition
	 * @returns {Promise<void>}
	 */
	async update(blob, collectionName, condition) {
		this.#ensureInit();
		let collection = this.#getCreateCollection(collectionName);
		collection.findAndUpdate(condition, (found) => _.assign(found, blob));
	}

	/**
	 * Upserts the item.
	 * @param blob {*} The upserted data.
	 * @param collectionName {string} The name of the collection.
	 * @param condition {*} A predicate/condition filtering out what has to be updated.
	 * @returns {Promise<unknown>}
	 */
	upsert(blob, collectionName, condition = null) {
		this.#ensureInit();
		const that = this;
		if (_.isNil(condition)) {
			condition = {};
		}
		return new Promise(function (resolve, reject) {
			that.findOne(condition, collectionName).then(function (found) {
				let collection = that.#getCreateCollection(collectionName);
				if (!utils.isEmpty(found)) {
					collection.updateWhere(
						(e) => e.id === found.id,
						(e) => {
							return _.assign(e, blob);
						},
					);
					resolve();
				} else {
					collection.insert(blob);
					resolve();
				}
			});
		});
	}

	/**
	 * Returns documents satisfying the given conditions.
	 *
	 * @param specs {*} Mongo-like specs.
	 * @param collectionName {string} The name of the collection.
	 * @param [sortField=null] {string} Name of the field to sort on.
	 * @param [limit=1000] {number} The maximum amount to return.
	 * @returns {Promise<*>}
	 * @see http://mongoosejs.com/docs/api.html#model_Model.find
	 * @example
	 *
	 * // a specific item
	 * const found = await localStorage.find({id: 233}, "People");
	 * // top 10 of all people with a name like 'j', sorted by name
	 * const found = await localStorage.find({name: /j/i}, "People", "name", 10);
	 */
	async find(specs, collectionName, sortField = null, limit = 10000) {
		this.#ensureInit();
		let collection = this.#getCreateCollection(collectionName);
		let chain = collection.chain().find(specs);
		if (utils.isDefined(limit)) {
			chain = chain.limit(limit);
		}
		if (utils.isDefined(sortField)) {
			chain = chain.applySimpleSort(sortField);
		}
		const found = chain.data();
		if (utils.isEmpty(found)) {
			return null;
		}
		return this.#sanitize(found);
	}

	count(specs = {}, collectionName) {
		this.#ensureInit();
		let collection = this.#getCreateCollection(collectionName);
		let count;
		// count({}) return 0 instead of the real value
		if (_.keys(specs).length === 0) {
			count = collection.count();
		} else {
			count = collection.count(specs);
		}
		return Promise.resolve(count);
	}

	/**
	 * Returns a single document.
	 * @param specs {*}
	 * @param collectionName
	 * @returns {Promise<*|null>}
	 */
	async findOne(specs = {}, collectionName) {
		this.#ensureInit();
		if (utils.isEmpty(collectionName)) {
			throw new Error(strings.IsNil("collectionName", "LocalStorage.findOne"));
		}
		if (utils.isEmpty(specs)) {
			throw new Error(strings.IsNil("specs", "LocalStorage.findOne"));
		}

		let collection = this.#getCreateCollection(collectionName);
		const found = collection.findOne(specs);
		if (utils.isEmpty(found)) {
			return null;
		}
		return this.#sanitize(found);
	}

	/**
	 * Removes Loki-specified stuff from the documents.
	 * @param items {*} One or more results.
	 * @returns {null|*}
	 */
	#sanitize(...items) {
		if (items.length === 0) {
			return null;
		}
		if (items.length === 1) {
			if (_.isArray(items[0])) {
				return items[0].map((u) => this.#sanitize(u));
			}
			const w = Object.assign({}, items[0]);
			delete w["meta"];
			delete w["$loki"];
			return w;
		} else {
			return items.map((u) => this.#sanitize(u));
		}
	}

	/**
	 * Removes document from the specified collection.
	 * @param specs
	 * @param collectionName
	 */
	remove(specs = {}, collectionName) {
		this.#ensureInit();
		if (utils.isEmpty(collectionName)) {
			throw new Error(strings.IsNil("collectionName", "LocalStorage.remove"));
		}
		const collection = this.#getCreateCollection(collectionName);
		collection.removeWhere(specs);
		// const that = this;
		// return new Promise(function (resolve, reject) {
		// 	collection.chain().find(that.#mapSpecs(specs)).remove();
		// 	resolve();
		// });
	}

	distinct(specs = {}, field, collectionName) {
		this.#ensureInit();
		if (utils.isEmpty(collectionName)) {
			throw new Error(strings.IsNil("collectionName", "LocalStorage.distinct"));
		}
		if (utils.isEmpty(field)) {
			throw new Error(strings.IsNil("field", "LocalStorage.distinct"));
		}
		const that = this;
		return new Promise(function (resolve, reject) {
			const result = [];
			// todo: another awkward way to do distinct
			that.find(specs, collectionName).then(function (items) {
				for (let i = 0; i < items.length; i++) {
					const item = items[i][field];
					if (result.indexOf(item) === -1) {
						result.push(item);
					}
				}
				resolve(result);
			});
		});
	}

	/**
	 * Removes a collection.
	 * @param collectionName {string}
	 * @returns {Promise<void>}
	 */
	async removeCollection(collectionName) {
		this.#ensureInit();
		if (utils.isEmpty(collectionName)) {
			throw new Error(strings.IsNil("collectionName", "LocalStorage.removeCollection"));
		}
		this.#db.removeCollection(collectionName);
	}

	async listCollections() {
		this.#ensureInit();
		return this.#db.listCollections().map((c) => c.name);
	}

	/**
	 * Fetches a random item from the specified collection.
	 * @param collectionName {string} The name of the collection.
	 * @returns {Promise<(Object & LokiObj)[]>}
	 */
	async random(collectionName) {
		this.#ensureInit();
		const collection = this.#getCreateCollection(collectionName);
		const count = collection.count();
		if (count === 0) {
			return null;
		}
		const items = collection
			.chain()
			.find({})
			.offset(_.sample(_.range(count)))
			.limit(1)
			.data();
		return this.#sanitize(items);
	}
}

/**
 * @module LocalStorage
 */
module.exports = LocalStorage;
