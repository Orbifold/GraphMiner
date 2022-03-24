const { EntitySpace, EntityType } = require("../lib");
const { Utils } = require("@graphminer/utils");

describe("EntityTypes", function () {
	it("should get entity types", async function () {
		const space = await EntitySpace.inMemory();
		const particle = await space.addEntityType("Particle");
		let found = await space.getEntityType("Particle");
		expect(found.id).toEqual(particle.id);
		found = await space.getEntityType("abc");
		expect(found).toBeNull();
		found = await space.getEntityType(particle);
		expect(found.id).toEqual(particle.id);
		found = await space.getEntityType({ typeName: "EntityType", name: "Particle" });
		expect(found.id).toEqual(particle.id);
		// can use id or name
		found = await space.getEntityType({ typeName: "EntityType", id: particle.id });
		expect(found.id).toEqual(particle.id);
		// it has to be a serialized EntityType
		found = await space.getEntityType({ typeName: "A", name: "Particle" });
		expect(found).toBeNull();

		found = await space.getEntityType({});
		expect(found).toBeNull();
		found = await space.getEntityType(null);
		expect(found).toBeNull();
		found = await space.getEntityType(123);
		expect(found).toBeNull();

		found = await space.getEntityTypeById(particle.id);
		expect(found.id).toEqual(particle.id);
	});

	it("should remove types", async function () {
		const space = await EntitySpace.inMemory();
		expect(space.enforceSchema).toBeTruthy();
		const image = await space.addEntityType("Image");
		// something else ain't there
		let found = await space.getEntityType("Particle");
		expect(found).toBeNull();
		// but the image is
		found = await space.getEntityType("Image");
		expect(found).not.toBeNull();
		// remove it
		await space.removeEntityType(image);
		// now is gone
		found = await space.getEntityType("Image");
		expect(found).toBeNull();
		// can repeat it, will not harm
		await space.removeEntityType(image);
		// the reference is still there but that can't be fixed
		expect(image.space).toEqual(space);
	});

	it("should remove type and instances", async function () {
		const space = await EntitySpace.inMemory();
		const image = await space.addEntityType("Image");
		const selfie = await image.createInstance("Selfie");
		expect(selfie.space).toEqual(space);
		// remove the type and the related instance
		await space.removeEntityType("Image", true);

		expect(await space.instanceExists(selfie.id)).toBeFalsy();
		expect(await space.entityTypeExists("Image")).toBeFalsy();
	});

	it("should pick a random entity", async function () {
		const space = await EntitySpace.inMemory();
		const image = await space.addEntityType("Image");
		for (let i = 0; i < 100; i++) {
			await image.createInstance("Image " + i);
		}
		expect(await space.countEntities()).toEqual(100);
		const singleton = await space.randomInstances("Image");
		expect(singleton.length).toEqual(1);
		const amount = Utils.randomInteger(1, 20);
		const coll = await space.randomInstances("Image", amount);
		expect(coll.length).toEqual(amount);
	});

	it("should clone", function () {
		const type = new EntityType(Utils.randomId());
		type.addValueProperty("A", "number");
		type.addObjectProperty("link", "C");
		const clone = type.clone();
		expect(clone.name).toEqual(type.name);
		expect(clone.id).not.toEqual(type.id);
		expect(clone.valueProperties.length).toEqual(1);
		expect(clone.valueProperties[0].name).toEqual("A");
		expect(clone.valueProperties[0].valueType).toEqual("Number");
		expect(clone.objectProperties.length).toEqual(1);
		expect(clone.objectProperties[0].name).toEqual("link");
		expect(clone.objectProperties[0].objectType).toEqual("C");
	});
});
