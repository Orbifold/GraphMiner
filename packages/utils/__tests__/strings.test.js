const _ = require("lodash");
const utils = require("../");
const {Strings} = require("../");
const {faker}=require("@faker-js/faker")

describe("Strings", function () {
	it("should truncate long Strings", function () {
		expect(Strings.truncateLongString("abc", 3)).toEqual("abc");
		expect(Strings.truncateLongString("abc", 2)).toEqual("ab...");
		expect(Strings.truncateLongString("abcde", 1)).toEqual("a...");
		expect(() => {
			Strings.truncateLongString("anv", null);
		}).toThrow(Error);
		expect(() => {
			Strings.truncateLongString("anv", "a");
		}).toThrow(Error);
		expect(() => {
			Strings.truncateLongString("anv", 0);
		}).toThrow(Error);
		expect(() => {
			Strings.truncateLongString("anv", -4);
		}).toThrow(Error);
	});
	it("should generate letters", function () {
		const l = faker.datatype.number({ min: 1, max: 33 });
		const letters = Strings.randomLetters(l);
		expect(letters.length).toEqual(l);
		expect(_.every(Strings.randomLetters(100, false).split(""), (u) => u.toLowerCase() === u)).toBeTruthy();
	});
	it("should create a title from the camelcase", function () {
		expect(Strings.camelToTitle("itShouldWork")).toEqual("It Should Work");
		expect(Strings.camelToTitle("itShouldWork justLikeThat")).toEqual("It Should Work just Like That");
	});

	it("should parse arrays", function () {
		expect(Strings.stringToStringArray("a,b")).toEqual(["a", "b"]);

		expect(Strings.stringToStringArray("[1,2,5]")).toEqual(["1", "2", "5"]);
		expect(Strings.stringToStringArray("[John: Miranda]", ":")).toEqual(["John", "Miranda"]);
		expect(Strings.stringToStringArray("[Anna:   ]", ":", false)).toEqual(["Anna", ""]);

		expect(Strings.stringToNumberArray("[1,2,5]")).toEqual([1, 2, 5]);
		expect(Strings.stringToNumberArray("[1;25]", ";")).toEqual([1, 25]);
	});

	it("should convert csv", function () {
		const csv = "a,b\n1,3";
		expect(Strings.csvToJson(csv)).toEqual([{ a: "1", b: "3" }]);
	});
	it("should truncate Strings", function () {
		expect(Strings.truncateLongString(null)).toBeNull();
		expect(Strings.truncateLongString(undefined)).toBeNull();
		expect(Strings.truncateLongString("some text")).toEqual("some text");
		expect(Strings.truncateLongString("some text", 4, "...")).toEqual("some...");
		expect(Strings.truncateLongString("1234   ", 4, "")).toEqual("1234");
	});
});
