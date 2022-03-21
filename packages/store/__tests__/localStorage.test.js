const {LocalStorage} = require("..");
const _ = require("lodash");
const {Utils} = require("@graphminer/utils");
const loki = require("lokijs");
const path = require("path");
describe("LocalStorage", function () {
    it("should ensure that init is called", async function () {
        const storage = new LocalStorage();
        await expect(async () => {
            await storage.createCollection("something");
        }).rejects.toThrow(Error);
    });

    it("should not create an in-memory by default", async function () {
        const storage = new LocalStorage();
        await storage.init();
        expect(storage.isInMemory).not.toBeTruthy();
    });

    it("should do the basics", async function () {
        // get an in-memory db
        const storage = await LocalStorage.inMemory();
        expect(await storage.collectionExists("stuff")).toBeFalsy();
        // add the collection
        await storage.createCollection("stuff");
        expect(await storage.collectionExists("stuff")).toBeTruthy();

        await storage.insert({x: 23}, "stuff");
        expect(await storage.count({}, "stuff")).toEqual(1);
        await storage.removeWhere({x: 23}, "stuff");
        expect(await storage.count({}, "stuff")).toEqual(0);

        // even if not there this should work
        await storage.removeCollection("abc");
        let cols = await storage.listCollections();
        expect(cols.length).toEqual(1);
        await storage.createCollection("abc");
        cols = await storage.listCollections();
        expect(cols.length).toEqual(2);
        await storage.removeCollection("abc");
        cols = await storage.listCollections();
        expect(cols.length).toEqual(1);
    });

    it("should insert", async function () {
        const storage = await LocalStorage.inMemory();
        await expect(storage.insert(null, "stuff")).rejects.toThrow(Error);
        await expect(storage.insert({f: 3}, null)).rejects.toThrow(Error);
        await expect(storage.insert({}, "xyz")).rejects.toThrow(Error);
        await storage.insert({x: 4}, "uvw");
        expect(await storage.count({}, "uvw"));
    });

    it("should update", async function () {
        const storage = await LocalStorage.inMemory();
        await storage.insert({x: 4}, "uvw");
        await storage.update({x: 5}, "uvw", {x: 4});
        let doc = await storage.findOne({x: 5}, "uvw");
        expect(doc).toBeDefined();
        // console.log(doc);
    });

    it("should find one", async function () {
        const storage = await LocalStorage.inMemory();
        await storage.insert({x: 4, y: 4}, "uvw");
        await storage.insert({x: 4, y: 5}, "uvw");
        let doc = await storage.findOne({x: 4}, "uvw");
        expect(doc).not.toBeNull();
        doc = await storage.findOne({x: 4, u: 9}, "uvw");
        expect(doc).toBeNull();
        doc = await storage.findOne({x: 4, y: 5}, "uvw");
        expect(doc).not.toBeNull();
        // console.log(doc);
    });

    it("should find things", async function () {
        const storage = await LocalStorage.inMemory();
        for (const i of _.range(20)) {
            await storage.insert({x: i}, "uvw");
        }
        let found = await storage.find({x: {$lte: 5}}, "uvw");
        expect(found.length).toEqual(6);
        found = await storage.find({x: {$lte: 5}}, "uvw", null, 2);
        expect(found.length).toEqual(2);
        console.log(found);
    });

    it("should store on file", async function () {
        let storage = await LocalStorage.default();
        const collectionName = Utils.id();
        await storage.insert({id: 13, name: "Anna"}, collectionName);
        await storage.close();
        await new Promise((r) => setTimeout(r, 500));

        storage = await LocalStorage.default();
        console.log(await storage.listCollections());
        expect(await storage.collectionExists(collectionName)).toBeTruthy();
        expect(await storage.count({}, collectionName)).toEqual(1);
        expect((await storage.findOne({id: 13}, collectionName)).name).toEqual("Anna");
        await storage.close();
        await new Promise((r) => setTimeout(r, 500));
    }, 10000);

    // it("loki should autoload the database", async function () {
    //     function onLoaded() {
    //         let coll = db.getCollection("people");
    //         if (_.isNil(coll)) {
    //             coll = db.addCollection("people");
    //             console.log("Added the collection.");
    //         }
    //         coll.insert({id: Date.now()}, "people");
    //         console.log(coll.count());
    //         db.save();
    //         db.close();
    //     }
    //
    //     const homeDir = require("os").homedir();
    //     const db = new loki(path.join(homeDir, ".graphminer", "localStorage.json"), {
    //         autosave: true,
    //         autosaveInterval: 1000,
    //         autoload: true,
    //         autoloadCallback: onLoaded,
    //     });
    //     await new Promise((r) => setTimeout(r, 1000));
    //
    // }, 10000);

    it("should fall back to a GraphMiner storage", async function () {
        let storage = new LocalStorage();
        await storage.init(null, {autosaveInterval: 500});
        const id = Utils.id();
        await storage.insert({id}, "stuff");
        await storage.close();
        await new Promise((r) => setTimeout(r, 2000));

        storage = new LocalStorage();
        await storage.init(null, {x: 3});
        const found = await storage.findOne({id}, "stuff");
        expect(found).not.toBeNull();
    });

    it("should find using regex", async function () {
        const storage = await LocalStorage.inMemory();
        const stuff = _.range(20).map((i) => {
            return {
                id: i,
                name: `Item ${i}`,
            };
        });
        for (const item of stuff) {
            await storage.upsert(item, "Stuff", {i: item.id});
        }
        let found = await storage.find({name: {$regex: /item 10/i}}, "Stuff");
        expect(found.length).toEqual(1);
    });
    it("should remove things", async function () {

        const storage = await LocalStorage.inMemory();
        await storage.insert({a: 1, b: 2}, "A")
        let found = await storage.findOne({a: 1}, "A")
        expect(found.b).toEqual(2)
        await storage.removeWhere({a: 1}, "A")
        found = await storage.findOne({a: 1}, "A")
        expect(found).toBeNull()
    });

    it("should find an amount", async function () {
        const storage = await LocalStorage.inMemory();
        for (let i = 0; i < 100; i++) {
            await storage.insert({id: i, name: "Item " + i}, "Items")
        }
        const amount = Utils.randomInteger(1, 100)
        let items = await storage.find({}, "Items", null, amount)
        expect(items.length).toEqual(amount)
        console.log(`Expect ${amount} items:`, items)
    });
    it("should get distinct elements", async function () {
        const storage = await LocalStorage.inMemory();
        for (let i = 0; i < 100; i++) {
            await storage.insert({id: i, name: "Item " + i}, "Items")
            await storage.insert({id: i, name: "Item " + i}, "Items")
        }
        let items = await storage.find({}, "Items")
        expect(items.length).toEqual(200)
        let uniq = await storage.distinct({},"name","Items")
        expect(uniq.length).toEqual(100)

    });
});
