const ValueProperty = require("../lib/ValueProperty");
const EntitySpace = require("../lib/entitySpace");

describe("ValueProperty", function () {
	it("should validate json", function () {
		let prop = {
			id: 1,
		};
		expect(() => ValueProperty.validate(prop)).toThrow(Error);
		prop = {
			id: "a",
			typeName: "",
		};
		expect(() => ValueProperty.validate(prop)).toThrow(Error);
		prop = {
			id: "a",
			typeName: "a",
		};
		expect(() => ValueProperty.validate(prop)).toThrow(Error);
		prop = {
			id: "a",
			typeName: "ValueProperty",
			name: "a",
			valueType: 3,
		};
		expect(() => ValueProperty.validate(prop)).toThrow(Error);
		prop = {
			id: "a",
			typeName: "ValueProperty",
			name: "a",
			valueType: "Cat",
		};
		expect(() => ValueProperty.validate(prop)).toThrow(Error);
		prop = {
			id: "a",
			typeName: "ValueProperty",
			name: "a",
			valueType: "[String]",
		};
		const p = ValueProperty.fromJSON(prop);
		expect(p.name).toEqual("a");
	});

	it("should serialize", function () {
		const prop = new ValueProperty("abc", "Boolean");
		prop.description = "info";
		const p = ValueProperty.fromJSON(prop.toJSON());
		expect(p.id).toEqual(prop.id);
		expect(p.name).toEqual(prop.name);
		expect(p.description).toEqual(prop.description);
		expect(p.objectType).toEqual(prop.objectType);
		expect(p.typeName).toEqual(prop.typeName);
	});

	it("should clone", function () {
		const prop = new ValueProperty("abc", "Bool");
		prop.description = "info";
		const p = prop.clone();
		expect(p.id).not.toEqual(prop.id);
		expect(p.name).toEqual(prop.name);
		expect(p.description).toEqual(prop.description);
		expect(p.objectType).toEqual(prop.objectType);
		expect(p.typeName).toEqual(prop.typeName);
	});
	it("should set the type", function () {
		const prop = new ValueProperty("abc", "Bool");
		expect(prop.valueType).toBe("Boolean");
		expect(() => {
			prop.valueType = 3;
		}).toThrow(Error);
		prop.valueType = "[Number]";
		expect(prop.valueType).toBe("[Number]");
	});
	it("should fetch the value properties", async function () {
		const space = await EntitySpace.inMemory();
		const Car = await space.addEntityType("Car");
		await space.addValueProperty("Car", "speed", "number");

		const props = await space.getValueProperties("Car");
		expect(props.length).toEqual(1);
		expect(props[0].name).toEqual("speed");
	});
});
