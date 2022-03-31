const _ = require("lodash");
const {EntitySpace, EntityType, Entity} = require("..");
const {faker} = require("@faker-js/faker");
const path = require("path");
const {Utils} = require("@graphminer/Utils");
const {LocalStorage} = require("@graphminer/store");
const EntityStore = require("../lib/entityStore");
const {NamedGraph} = require("@graphminer/graphs");


describe("Entities", function () {
	it("should create detached instances", async function () {
		// ===================================================================
		// first without schema
		// ===================================================================
		let space = await EntitySpace.inMemory();
		space.enforceSchema = false;
		let car = await space.createDetachedInstance("Car", "A");
		expect(car.typeName).toEqual("Car");
		expect(car.name).toEqual("A");
		expect(car.space).toBeNull();
		expect(car.id).not.toBeNull();
		expect(await space.countEntityTypes()).toEqual(0);
		// the instance is not in the space since it's detached
		expect(await space.countEntities()).toEqual(0);

		// can specify whatever you like since it's untyped
		car = await space.createDetachedInstance("Car", {id: "a", name: "A", color: "orange"});
		expect(car.name).toEqual("A");
		expect(car.id).toEqual("a");
		expect(await car.get("color")).toEqual("orange");

		// can also use EntityType even though the type will not be remembered
		let Car = new EntityType("Car");
		car = await space.createDetachedInstance(Car, {id: "b", name: "B", color: "blue"});
		expect(car.name).toEqual("B");
		expect(car.id).toEqual("b");
		expect(await car.get("color")).toEqual("blue");
		// can even add/save the type but it will not be used
		Car = await space.addEntityType("Car");
		car = await space.createInstance(Car, {id: "c", name: "C", color: "yellow"});
		expect(car.name).toEqual("C");
		expect(car.id).toEqual("c");
		expect(car.getValue("color")).toEqual("yellow");
		// now you have a type and an instance but their schema is not matched because the space does not enforce it
		expect(await space.countEntityTypes()).toEqual(1);
		expect(await space.countEntities()).toEqual(1);

		// finally, can also give an entity
		let Stuff = new EntityType("Stuff");
		const stuff = Entity.typed(Stuff, "stuff");

		stuff.entropy = 132;
		await space.createInstance(Stuff, stuff);
		// note that the type has not been added but the instance passed
		expect(await space.countEntityTypes()).toEqual(1);
		expect(await space.countEntities()).toEqual(2);

		// ===================================================================
		// with schema
		// ===================================================================
		space = await EntitySpace.inMemory();
		space.enforceSchema = true;

		// same statement as above but this time raises an error
		let hasThrown = false;
		try {
			await space.createDetachedInstance("Car", "A");
		} catch (e) {
			hasThrown = true;
		}
		expect(hasThrown).toBeTruthy();
		Car = await space.addEntityType("Car");
		car = await space.createDetachedInstance("Car", "A");

		expect(car.typeName).toEqual("Car");
		expect(car.name).toEqual("A");
		expect(car.space).toBeNull();
		expect(car.id).not.toBeNull();
		expect(await space.countEntityTypes()).toEqual(1);
		// the instance is not in the space since it's detached
		expect(await space.countEntities()).toEqual(0);
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
		expect(await found.get("title")).toEqual("Topology");

		await space.save();
		// load the space by simply giving the file
		space = new EntitySpace();
		// this will load the content
		await space.init(dbPath);
		expect(await space.countEntityTypes()).toEqual(1);
		await space.getInstances("Book");
		expect(await space.countEntities()).toEqual(1);

		found = await space.getInstanceById(book.id);
		expect(found).not.toBeNull();
		expect(await found.get("title")).toEqual("Topology");
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
		await entityType.addValueProperty("rooms", "number");
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
		await e.addValueProperty("Speed", "Number");
		await entities.upsertEntityType(e);
		e = await entities.getEntityType("Boat");
		// console.log(JSON.stringify(e));
		expect(e.valuePropertyExists("Speed")).toBeTruthy();
	});

	it("should create a Person entity", async function () {
		const space = await EntitySpace.inMemory();

		// create the type
		const personType = new EntityType("Person");
		await personType.addValueProperty("age", "Number");
		personType.addObjectProperty("wife", "Person");

		const person = await Entity.typed(personType, "Swa");
		await person.setValue("age", 33);
		const description = faker.lorem.sentence();
		await person.setValue("description", description);

		// should be possible to set something not defined by the schema
		let hasThrown = false;
		try {
			await person.setValue("abc", 5);
		} catch (e) {
			hasThrown = true;
		}
		expect(hasThrown).toBeTruthy();
		// setting wrong type should not work
		hasThrown = false;
		try {
			await person.setValue("age", "something");
		} catch (e) {
			hasThrown = true;
		}
		expect(hasThrown).toBeTruthy();

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
		await person.setObject("hasJob", job);
		await person.setObject("hasWife", wife);
	});

	it("should import/export the schema", async function () {
		const entities = await EntitySpace.inMemory();
		await entities.setMetadata("name", "test");
		await entities.setMetadata("id", "123");
		let personType = new EntityType("Person");
		await personType.addValueProperty("age", "Number");
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
	it("should work for entities without schema", async function () {
		const thing = await Entity.untyped("W", "A");
		expect(thing.isUntyped).toBeTruthy();
		await thing.setValue("s", 3, true, false);
		expect(thing.getValue("s")).toEqual(3);
		let hasThrown = false;
		try {
			await Entity.untyped(null, "A");
		} catch (e) {
			hasThrown = true;
		}
		expect(hasThrown).toBeTruthy();
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
		// console.log(JSON.stringify(found, null, 2));
	});

	it("should raise an error on double creation", async function () {
		const space = await EntitySpace.inMemory();
		space.enforceSchema = false;
		await space.createInstance("A", {id: "a", name: "a"});
	});
	it("should remove an instance", async function () {
		const space = await EntitySpace.inMemory();
		space.enforceSchema = false;
		const car = await space.createInstance("A", {id: "a", name: "a"});
		await space.removeInstance(car.id);
		const found = await space.getInstanceById(car.id);
		expect(found).toBeNull();
	});

	it("should update an instance", async function () {
		const space = await EntitySpace.inMemory();
		await space.addEntityType("A");
		await space.addValueProperty("A", "color", "string");
		const ins = await space.getInstances("A");
		const car = await space.createInstance("A", {id: "a", name: "a", color: "white"});
		let found = await space.getInstanceById(car.id);
		expect(found.name).toEqual("a");
		expect(found.getValue("color")).toEqual("white");
		expect(found.getValue("name")).toEqual("a");
		await space.upsertInstance("A", {id: "a", name: "a", color: "grey"});
		found = await space.getInstanceById(car.id);
		expect(found.name).toEqual("a");
		expect(found.getValue("color")).toEqual("grey");
		expect(found.getValue("name")).toEqual("a");
	});
	it("should connect instances", async function () {
		// ===================================================================
		// enforced schema
		// ===================================================================

		let space = await EntitySpace.inMemory();
		await space.addEntityType("Book");
		const Author = await space.addEntityType("Author");
		await space.addObjectProperty("Book", "hasAuthor", Author);
		const props = await space.getObjectProperties("Book");
		expect(props.length).toEqual(1);
		expect(props[0].name).toEqual("hasAuthor");
		expect(props[0].objectType).toEqual("Author");
		expect(props[0].subjectType).toEqual("Book");

		const topology = await space.createInstance("Book", "Topology");
		const dugundji = await space.createInstance("Author", "Dugundji");
		await space.connect(topology, "hasAuthor", dugundji);
		let book = await space.getInstanceById(topology.id);
		expect(book.objectPropertyExists("hasAuthor")).toBeTruthy();
	});
	it("should set a value property", async function () {
		let space = await EntitySpace.inMemory();
		await space.addEntityType("Book");
		const prop = await space.addValueProperty("Book", "author", "string");
		const topology = await space.createInstance("Book", "Topology");
		await space.setValue(topology, "author", "Dugundji");
		const ins = await space.getInstances("Book");
		expect(ins[0].getValue("author")).toEqual("Dugundji");
		expect(ins[0].getValue(prop)).toEqual("Dugundji");
		expect(await space.getValue(topology.id, "author")).toEqual("Dugundji");

		const vals = ins[0].getValues();
		const should = {
			id: topology.id,
			name: "Topology",
			author: "Dugundji",
			description: null,
		};
		expect(vals).toEqual(should);
	});
	it("should get/set the object", async function () {
		// ===================================================================
		// outside a space
		// ===================================================================
		const a = await Entity.untyped("A");
		const b = await Entity.untyped("B", "b");
		let hasThrown = false;
		try {
			a.setObject("link", "B");
		} catch (e) {
			hasThrown = true;
		}
		expect(hasThrown).toBeTruthy();
		await a.setObject("link", b);
		let found = await a.objects["link"];
		expect(found.length).toEqual(1);
		expect(found[0].name).toEqual("b");
		// ===================================================================
		// with space
		// ===================================================================
		let space = await EntitySpace.inMemory();
		await space.addEntityType("Book");
		await space.addEntityType("Author");
		await space.addObjectProperty("Book", "author", "Author");

		let book = await space.createInstance("Book", "MKS");
		let author = await space.createInstance("Author", "Wolfram");
		await space.setObject(book, "author", author);
		found = await space.getObject(book, "author");
		expect(found.name).toEqual("Wolfram");
	});
	it("should save the object property target if not present in the space", async function () {
		let space = await EntitySpace.inMemory();
		await space.addEntityType("Book");
		await space.addEntityType("Author");
		await space.addObjectProperty("Book", "author", "Author");
		let book = await space.createInstance("Book", "MKS");
		let author = await space.createDetachedInstance("Author", "Wolfram");
		await space.setObject(book, "author", author);
		// via the object prop the target was added to the space
		let found = await space.getInstanceById(author.id);
		expect(found).not.toBeNull();
		expect(found.name).toEqual("Wolfram");

		// removing via null is not working, should do via the removeObject method
		let hasThrown = false;
		try {
			await space.setObject(book, "author", null);
		} catch (e) {
			hasThrown = true;
		}
		expect(hasThrown).toBeTruthy();
		// but this works

		await space.removeObjectProperty("Book", "author");
		found = await space.getInstanceById(book.id);
		expect(await space.getObject(book, "author")).toBeNull();
	});

	it("should remove a value property", async function () {
		// ===================================================================
		// This demonstrates that removal of a value property maintains
		// integrity of the instance data by default.
		// ===================================================================
		const space = await EntitySpace.inMemory();
		await space.addEntityType("Book", {author: "string"});
		let Book = await space.getEntityType("Book");
		expect(Book.valueProperties.length).toEqual(1);
		expect(Book.valueProperties[0].name).toEqual("author");
		await space.createInstance("Book", {author: "A"});
		await space.createInstance("Book", {author: "B"});
		let books = await space.getInstances("Book");
		expect(books.length).toEqual(2);
		expect(books[0].getValue("author")).toEqual("A");
		//remove the value prop and update the instances
		await space.removeValueProperty("Book", "author");
		books = await space.getInstances("Book");
		// the value has gone from the instances by removing the property
		expect(books[0].getValue("author")).toBeNull();
		expect(books[1].getValue("author")).toBeNull();
		Book = await space.getEntityType("Book");
		expect(Book.valueProperties.length).toEqual(0);
	});

	it("should remove an object property", async function () {
		// ===================================================================
		// This demonstrates that removal of an object property maintains
		// integrity of the instance data by default.
		// ===================================================================
		const space = await EntitySpace.inMemory();
		await space.addEntityType("Book", {title: "string"});
		await space.addEntityType("Person", {country: "string"});
		await space.addObjectProperty("Book", "hasAuthor", "Person");
		let objProps = await space.getObjectProperties("Book");
		expect(objProps.length).toEqual(1);
		expect(objProps[0].name).toEqual("hasAuthor");
		expect(objProps[0].objectType).toEqual("Person");
		expect(objProps[0].subjectType).toEqual("Book");

		let person = await space.createInstance("Person", "Lancaster");
		let book = await space.createInstance("Book", "QFT");
		await space.connect(book, "hasAuthor", person);
		person = await space.getObject(book, "hasAuthor");
		expect(person.name).toEqual("Lancaster");

		// remove it
		await space.removeObjectProperty("Book", "hasAuthor");
		person = await space.getObject(book, "hasAuthor");
		// the instance has been updated automatically
		expect(person).toBeNull();
	});
	it("should switch databases", async function () {
		const space = await EntitySpace.inMemory();
		// in the default database
		await space.addEntityType("Book");
		await space.setDatabase("A");
		await space.addEntityType("Car");
		// the Book type sits in the default db
		let found = await space.getEntityType("Book");
		expect(found).toBeNull();
		// while the Car type sits in A
		await space.setDatabase("default");
		found = await space.getEntityType("A");
		expect(found).toBeNull();
	});

	it("should serialize untyped instances", function () {
		const target1 = Entity.untyped("B");
		const target2 = Entity.untyped("C");
		let e = Entity.untyped("A", {a: 1, b: 2});
		let json = e.toJSON();
		let d = Entity.fromJSON("A", json);
		expect(d.typeName).toEqual("A");
		expect(d.a).toEqual(1);
		expect(d.b).toEqual(2);
		expect(d.id).toEqual(e.id);
		expect(d.space).toBeNull();
		expect(d.entityType).toBeNull();

		e = Entity.untyped("A", {a: 1, b: 2});
		e.setObject("link1", target1);
		e.setObject("link1", target2);
		json = e.toJSON();
		d = Entity.fromJSON("A", json);
		expect(d.objects["link1"].length).toEqual(2);
		expect(d.objects["link1"][0]).toEqual(target1.id);
		expect(d.objects["link1"][1]).toEqual(target2.id);
	});

	it("should serialize typed instances", function () {
		const A = new EntityType("A");
		const B = new EntityType("B");
		const C = new EntityType("C");
		A.addObjectProperty("toB", "B");
		A.addObjectProperty("toC", "C");
		const a = Entity.typed(A);
		const b1 = Entity.typed(B);
		const b2 = Entity.typed(B);
		const c = Entity.typed(C);
		a.setObject("toB", b1);
		a.setObject("toB", b1);
		a.setObject("toB", b2);
		let json = a.toJSON();
		expect(json.links.length).toEqual(1);
		expect(_.find(json.links, {name: "toB"}).ids.length).toEqual(2);
		expect(_.find(json.links, {name: "toC"})).toBeUndefined();
		a.setObject("toC", c);
		json = a.toJSON();
		expect(_.find(json.links, {name: "toC"}).ids.length).toEqual(1);
	});
	it("should import a GraphMiner graph", async function () {
		let g = NamedGraph.path(3);
		let space = await EntitySpace.inMemory();
		await space.importGraph(g);
		let types = await space.getAllEntityTypes();
		expect(types.length).toEqual(0);
		expect(space.enforceSchema).toBeFalsy();
		let ins = await space.getAllInstances();
		expect(ins.length).toEqual(3);
		// it's indeed a path graph
		expect(ins[0].getObjects("link").length).toEqual(1);
		expect(ins[1].getObjects("link").length).toEqual(1);
		expect(ins[2].getObjects("link").length).toEqual(0);
	});
});
