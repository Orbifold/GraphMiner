const _ = require("lodash");
const {EntitySpace, EntityType, Entity} = require("..");
const {faker} = require("@faker-js/faker");
const path = require("path");
const {Utils} = require("@graphminer/Utils");
const {LocalStorage} = require("@graphminer/store");
const EntityStore = require("../lib/entityStore");


async function NewSpace() {
    const entities = new EntitySpace();
    const homedir = require("os").homedir();
    const dbPath = path.join(homedir, Utils.randomId() + ".json");
    await entities.init(null, {
        filePath: dbPath,
    });
    return [entities, dbPath];
}

describe("Entities", function () {
    it("should create detached instances", async function () {
        // ===================================================================
        // first without schema
        // ===================================================================
        let space = await EntitySpace.inMemory()
        space.enforceSchema = false
        let car = await space.createDetachedInstance("Car", "A")
        expect(car.typeName).toEqual("Car")
        expect(car.name).toEqual("A")
        expect(car.space).toBeNull()
        expect(car.id).not.toBeNull()
        expect(await space.countEntityTypes()).toEqual(0)
        // the instance is not in the space since it's detached
        expect(await space.countEntities()).toEqual(0)

        // can specify whatever you like since it's untyped
        car = await space.createDetachedInstance("Car", {id: "a", name: "A", color: "orange"})
        expect(car.name).toEqual("A")
        expect(car.id).toEqual("a")
        expect(car.get("color")).toEqual("orange")

        // can also use EntityType even though the type will not be remembered
        let Car = new EntityType("Car")
        car = await space.createDetachedInstance(Car, {id: "b", name: "B", color: "blue"})
        expect(car.name).toEqual("B")
        expect(car.id).toEqual("b")
        expect(car.get("color")).toEqual("blue")
        // can even add/save the type but it will not be used
        Car = await space.addEntityType("Car")
        car = await space.createInstance(Car, {id: "c", name: "C", color: "yellow"})
        expect(car.name).toEqual("C")
        expect(car.id).toEqual("c")
        expect(car.get("color")).toEqual("yellow")
        // now you have a type and an instance but their schema is not matched because the space does not enforce it
        expect(await space.countEntityTypes()).toEqual(1)
        expect(await space.countEntities()).toEqual(1)

        // finally, can also give an entity
        let Stuff = new EntityType("Stuff")
        const stuff = Entity.typed(Stuff, "stuff")

        stuff.entropy = 132
        await space.createInstance(Stuff, stuff)
        // note that the type has not been added but the instance passed
        expect(await space.countEntityTypes()).toEqual(1)
        expect(await space.countEntities()).toEqual(2)


        // ===================================================================
        // with schema
        // ===================================================================
        space = await EntitySpace.inMemory()
        space.enforceSchema = true

        // same statement as above but this time raises an error
        let hasThrown = false
        try {
            await space.createDetachedInstance("Car", "A")
        } catch (e) {
            hasThrown = true
        }
        expect(hasThrown).toBeTruthy()
        Car = await space.addEntityType("Car")
        car = await space.createDetachedInstance("Car", "A")

        expect(car.typeName).toEqual("Car")
        expect(car.name).toEqual("A")
        expect(car.space).toBeNull()
        expect(car.id).not.toBeNull()
        expect(await space.countEntityTypes()).toEqual(1)
        // the instance is not in the space since it's detached
        expect(await space.countEntities()).toEqual(0)
    });
    it("should use the options", async function () {
        let space = new EntitySpace();
        // init without arguments creates an in-memory entity space with default
        await space.init();
        expect(space.enforceSchema).toBeTruthy();
        expect(space.store instanceof EntityStore).toBeTruthy();
        expect(space.store instanceof EntityStore).toBeTruthy();
        expect(space.store.storage instanceof LocalStorage).toBeTruthy();
        expect(space.store.storage.isInMemory).toBeTruthy();

        space = new EntitySpace();
        let dbPath = Utils.getTempFilePath();
        // if the argument is a path to a file you get an on-disk space
        await space.init(dbPath);
        expect(space.store.storage.isInMemory).toBeFalsy();
        expect(space.store.storage.databasePath).toEqual(dbPath);
        expect(space.enforceSchema).toBeTruthy();
        Utils.deleteFileOrDirectory(dbPath);

        space = new EntitySpace();
        // this stores things in ~/.graphminer/LocalStorage.json
        await space.init("default");
        expect(space.store.storage.isInMemory).toBeFalsy();
        dbPath = LocalStorage.defaultDatabasePath;
        expect(space.store.storage.databasePath).toEqual(dbPath);
        Utils.deleteFileOrDirectory(dbPath);
    });
    it("should load an existing space in a file", async function () {
        // create a space
        let space = new EntitySpace();
        let dbPath = Utils.getTempFilePath();
        // if the argument is a path to a file you get an on-disk space
        await space.init(dbPath);
        const bookType = await space.addEntityType("Book");
        await space.addValueProperty(bookType, "title", "string");
        const book = await space.upsertInstance(bookType, {title: "Topology"});
        let found = await space.getInstanceById(book.id);
        expect(found).not.toBeNull();
        expect(found.get("title")).toEqual("Topology");

        await space.save();
        // load the space by simply giving the file
        space = new EntitySpace();
        // this will load the content
        await space.init(dbPath);
        expect(await space.countEntityTypes()).toEqual(1);
        expect(await space.countEntities()).toEqual(1);

        found = await space.getInstanceById(book.id);
        expect(found).not.toBeNull();
        expect(found.get("title")).toEqual("Topology");
        Utils.deleteFileOrDirectory(dbPath);
    });
    it("should add entity types", async function () {
        const entities = await EntitySpace.inMemory();
        await entities.upsertEntityType("Car");
        let found = await entities.getAllEntityTypes();
        expect(found.length).toEqual(1);
        expect(found[0] instanceof EntityType).toBeTruthy();
        expect(found[0].name).toEqual("Car");
    });

    it("should add instance without schema", async function () {
        const space = await EntitySpace.inMemory();
        space.enforceSchema = false;
        await space.upsertInstance("Car", {id: "4", name: "a"});
        let found = await space.getInstanceById("4");
        expect(found).not.toBeNull();
        expect(found.name).toEqual("a");
    });

    it("should not allow anything without a schema", async function () {
        const entities = await EntitySpace.inMemory();
        await expect(async () => {
            await entities.upsertInstance("Car", {id: 4, name: "a"});
        }).rejects.toThrow(Error);
    });

    it("should add value types", async function () {
        const entities = await EntitySpace.inMemory();
        const entityType = new EntityType("House");
        entityType.addValueProperty("rooms", "number");
        await entities.upsertEntityType(entityType);
        expect(await entities.countEntityTypes()).toEqual(1);
        let found = await entities.getEntityType("House");
        expect(found).not.toBeNull();
        expect(found.name).toBe("House");
    });

    it("should check object types", async function () {
        let entities = await EntitySpace.inMemory();

        let entityType = new EntityType("House");
        entityType.addObjectProperty("car", "Car");
        // type Car is not there
        await expect(async () => await entities.upsertEntityType(entityType)).rejects.toThrow(Error);

        // let's add it
        await entities.upsertEntityType("Car");
        // now works
        await entities.upsertEntityType(entityType);
        let found = await entities.getEntityType("House");

        // when schema is not enforced
        entities = await EntitySpace.inMemory();
        entities.enforceSchema = false;
        entityType = new EntityType("House");
        entityType.addObjectProperty("car", "CarUnchecked");
        await entities.upsertEntityType(entityType);
        found = await entities.getEntityType("House");
        // console.log(found.toJSON());
    });

    it("should add an entity type via json", async function () {
        const space = await EntitySpace.inMemory();
        const et = {
            typeName: "EntityType",
            name: "Screen",
            description: faker.lorem.sentence(),
            valueProperties: [
                {
                    name: "Size",
                    valueType: "number",
                },
            ],
        };
        let id = await space.addEntityTypeFromJson(et);
        let found = await space.getEntityType("Screen");
        expect(found).not.toBeNull();
        expect(found.description).toBe(et.description);
        await space.removeEntityType("Screen");
        found = await space.getEntityType("Screen");
        expect(found || null).toBeNull();

        // but the schema keeps checking
        const at = {
            name: "Screen",
            description: faker.lorem.sentence(),
            objectProperties: [
                {
                    name: "Vendor",
                    valueType: "Company",
                },
            ],
        };
        await expect(async () => await space.addEntityTypeFromJson(at)).rejects.toThrow(Error);
    });

    it("should remove an entity type", async function () {
        const space = await EntitySpace.inMemory();
        await space.upsertEntityType("Car");
        let car = await space.upsertInstance("Car", "Toyota");
        await space.upsertInstance("Car", "Ford");

        await space.removeEntityType("Car", false);
        let found = await space.getInstanceById(car.id);
        expect(found).not.toBeNull();

        await space.removeInstances("Car");
        found = await space.getInstanceById(car.id);
        expect(found).toBeNull();
    });

    it("should update an entity type", async function () {
        const entities = await EntitySpace.inMemory();
        await entities.upsertEntityType("Boat");
        let e = await entities.getEntityType("Boat");
        e.addValueProperty("Speed", "Number");
        await entities.upsertEntityType(e);
        e = await entities.getEntityType("Boat");
        // console.log(JSON.stringify(e));
        expect(e.valuePropertyExists("Speed")).toBeTruthy();
    });

    it("should create a Person entity", async function () {
        const space = await EntitySpace.inMemory();

        // create the type
        const personType = new EntityType("Person");
        personType.addValueProperty("age", "Number");
        personType.addObjectProperty("wife", "Person");

        const person = Entity.typed(personType, "Swa");
        person.setValue("age", 33);
        const description = faker.lorem.sentence();
        person.setValue("description", description);
        // should be possible to set something not defined by the schema
        expect(() => person.setValue("abc", 5)).toThrow(Error);
        // setting wrong type should not work
        expect(() => person.setValue("age", "something")).toThrow(Error);
        let json = person.toJSON();
        // will not be picked up by the schema
        json.x = 45;
        await space.upsertEntityType(personType);
        const e = await space.parseEntity(json);
        expect(e).not.toBeNull();
        expect(e.typeName).toEqual("Person");
        expect(e.getValue("age")).toEqual(33);
        expect(e.getValue("x") || null).toBeNull();
        expect(e.id).toEqual(person.id);
        expect(e.getValue("description")).toEqual(description);
    });

    it("should fetch random entities", async function () {
        const space = await EntitySpace.inMemory();

        // create the type
        const personType = await space.addEntityType("Person");
        for (let i = 0; i < 20; i++) {
            await space.upsertInstance("Person", `Person ${i}`);
        }

        let amount = _.sample(_.range(2, 20));
        let found = await space.randomInstances(null, amount);
        expect(found.length).toBe(amount);
        // the default is just one entity
        found = await space.randomInstances();
        expect(found[0].typeName).toBe("Person");
    });

    it("should fetch values", async function () {
        const entities = await EntitySpace.inMemory();

        let personType = await entities.addEntityType("Person");
        await entities.addValueProperty(personType, "age", "Number");
        personType = await entities.getEntityType("Person");
        expect(personType.valuePropertyExists("age"));
    });

    it("should create object properties", async function () {
        const entities = await EntitySpace.inMemory();

        let personType = await entities.addEntityType("Person");
        let jobType = await entities.addEntityType("Job");
        expect(await entities.countEntityTypes()).toEqual(2);
        personType.addObjectProperty("hasJob", "Job");
        personType.addObjectProperty("hasWife", "Person");
        await entities.upsertEntityType(personType);

        let person = await personType.createInstance("John");
        let wife = await personType.createInstance("Anna");
        let job = await jobType.createInstance("Cook");
        person.setObject("hasJob", job);
        person.setObject("hasWife", wife);
        // console.log(person.toJSON(true));
        console.log(JSON.stringify(await entities.exportSchema(), null, 4));
    });

    it("should import/export the schema", async function () {
        const entities = await EntitySpace.inMemory();
        await entities.setMetadata("name", "test");
        await entities.setMetadata("id", "123");
        let personType = new EntityType("Person");
        personType.addValueProperty("age", "Number");
        await entities.addEntityType(personType);

        let json = personType.toJSON();
        json.valueProperties.push({
            id: "26ea6dde-ae8a-467c-8036-c80d63090141",
            typeName: "ValueProperty",
            name: "country",
            valueType: "String",
        });
        await entities.importSchema([json]);

        let changed = await entities.getEntityType("Person");
        expect(changed.valuePropertyExists("country"));
        console.log(JSON.stringify(await entities.exportSchema(), null, 4));
    });
    it("should work for entities without schema", function () {
        const thing = Entity.untyped("W", "A");
        expect(thing.isUntyped).toBeTruthy();
        thing.setValue("s", 3)
        expect(thing.get("s")).toEqual(3)
        expect(() => Entity.untyped(null, "A")).toThrow(Error)

    });

    it("should check the given json", function () {
        expect(() => EntityType.fromJSON(null)).toThrow(Error);
        expect(() => EntityType.fromJSON({})).toThrow(Error);
        expect(() => EntityType.fromJSON({typeName: "A"})).toThrow(Error);
        expect(() => EntityType.fromJSON({typeName: "EntityType"})).toThrow(Error);
        // this should work though
        const found = EntityType.fromJSON({typeName: "EntityType", name: "A"});
        expect(found.name).toEqual("A");
        expect(found.typeName).toEqual("EntityType");
    });
    it("should manage metadata", async function () {
        const [entities, dbPath] = await NewSpace();
        let id = await entities.getMetadata("id");
        expect(id).not.toBeNull();

        await entities.setMetadata("id", "aa");
        expect(await entities.getMetadata("id")).toEqual("aa");

        const name = Utils.randomId();
        const val = Utils.randomId();
        await entities.setMetadata(name, val);
        expect(await entities.getMetadata(name)).toEqual(val);
        Utils.deleteFileOrDirectory(dbPath);
    });
    it("should import instances", async function () {
        const entities = await EntitySpace.inMemory();
        await entities.upsertEntityType("Book");

        const books = [
            {
                typeName: "Book",
                name: "A",
            },
            {
                typeName: "Book",
                name: "B",
            },
        ];

        await entities.importInstances(books);

        expect(await entities.countEntities()).toEqual(2);
        expect(await entities.countEntityTypes()).toEqual(1);
    });
    it("should import a space", async function () {
        const entities = await EntitySpace.inMemory();
        const space = {
            id: "a",
            name: "b",
            something: "c",
            entityTypes: [
                {
                    typeName: "EntityType",
                    name: "Planet",
                },
                {
                    typeName: "EntityType",
                    name: "Car",
                },
            ],
            entities: [
                {
                    typeName: "Planet",
                    name: "Uranus",
                    id: "u",
                },
            ],
        };
        await entities.importEntitySpace(space, true);
        expect(await entities.countEntities()).toEqual(1);
        expect(await entities.countEntityTypes()).toEqual(2);
        expect(await entities.getMetadata("name")).toEqual("b");
        let found = await entities.getEntityType("Planet");
        expect(found).not.toBeNull();
        found = await entities.getInstanceById("u");
        expect(found).not.toBeNull();
        expect(found.name).toEqual("Uranus");
    });
    it("should get instances", async function () {
        const space = await EntitySpace.inMemory();
        const entityType = await space.addEntityType("Color");
        const amount = Utils.randomInteger(1, 10);
        for (let i = 0; i < amount; i++) {
            await space.upsertInstance("Color", "Color " + i);
        }
        const found = await space.getInstances("Color");
        expect(found.length).toEqual(amount);
        console.log(JSON.stringify(found, null, 2));
    });

    it("should raise an error on double creation", async function () {
        const space = await EntitySpace.inMemory();
        space.enforceSchema = false;
        await space.createInstance("A", {id: "a", name: "a"})
    });
});
