const ObjectProperty = require("../lib/objectProperty");

describe("ObjectProperty", function () {
	it("should validate json", function () {
		let prop = {
			id: 1,
		};
		expect(() => ObjectProperty.validate(prop)).toThrow(Error);
		prop = {
			id: "a",
			typeName: "",
		};
		expect(() => ObjectProperty.validate(prop)).toThrow(Error);
		prop = {
			id: "a",
			typeName: "a",
		};
		expect(() => ObjectProperty.validate(prop)).toThrow(Error);
		prop = {
			id: "a",
			typeName: "ObjectProperty",
			name: "a",
			objectType: 3,
		};
		expect(() => ObjectProperty.validate(prop)).toThrow(Error);
		prop = {
			id: "a",
			typeName: "ObjectProperty",
			name: "a",
			objectType: "Cat",
		};
		const p = ObjectProperty.fromJSON(prop);
		expect(p.name).toEqual("a");
	});

	it("should serialize", function () {
		const prop = new ObjectProperty("abc", "Thing");
		prop.description = "info";
		const p = ObjectProperty.fromJSON(prop.toJSON());
		expect(p.id).toEqual(prop.id);
		expect(p.name).toEqual(prop.name);
		expect(p.description).toEqual(prop.description);
		expect(p.objectType).toEqual(prop.objectType);
		expect(p.typeName).toEqual(prop.typeName);
	});

	it("should clone", function () {
		const prop = new ObjectProperty("abc", "Thing");
		prop.description = "info";
		const p = prop.clone();
		expect(p.id).not.toEqual(prop.id);
		expect(p.name).toEqual(prop.name);
		expect(p.description).toEqual(prop.description);
		expect(p.objectType).toEqual(prop.objectType);
		expect(p.typeName).toEqual(prop.typeName);
	});
	it("should set the type", function () {
		const prop = new ObjectProperty("abc", "Thing");
		expect(prop.objectType).toBe("Thing");
		expect(() => {
			prop.objectType = 3;
		}).toThrow(Error);
		prop.objectType = "Cloud";
		expect(prop.objectType).toBe("Cloud");
	});
});
