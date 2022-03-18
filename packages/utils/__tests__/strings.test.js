const _ = require("lodash");
const utils = require("../");
const strings = require("../lib/strings");
const {faker}=require("@faker-js/faker")

describe("Strings", function () {
	it("should truncate long strings", function () {
		expect(strings.truncateLongString("abc", 3)).toEqual("abc");
		expect(strings.truncateLongString("abc", 2)).toEqual("ab...");
		expect(strings.truncateLongString("abcde", 1)).toEqual("a...");
		expect(() => {
			strings.truncateLongString("anv", null);
		}).toThrow(Error);
		expect(() => {
			strings.truncateLongString("anv", "a");
		}).toThrow(Error);
		expect(() => {
			strings.truncateLongString("anv", 0);
		}).toThrow(Error);
		expect(() => {
			strings.truncateLongString("anv", -4);
		}).toThrow(Error);
	});
	it("should generate letters", function () {
		const l = faker.datatype.number({ min: 1, max: 33 });
		const letters = strings.randomLetters(l);
		expect(letters.length).toEqual(l);
		expect(_.every(strings.randomLetters(100, false).split(""), (u) => u.toLowerCase() === u)).toBeTruthy();
	});
	it("should create a title from the camelcase", function () {
		expect(strings.camelToTitle("itShouldWork")).toEqual("It Should Work");
		expect(strings.camelToTitle("itShouldWork justLikeThat")).toEqual("It Should Work just Like That");
	});

	it("should parse arrays", function () {
		expect(strings.stringToStringArray("a,b")).toEqual(["a", "b"]);

		expect(strings.stringToStringArray("[1,2,5]")).toEqual(["1", "2", "5"]);
		expect(strings.stringToStringArray("[John: Miranda]", ":")).toEqual(["John", "Miranda"]);
		expect(strings.stringToStringArray("[Anna:   ]", ":", false)).toEqual(["Anna", ""]);

		expect(strings.stringToNumberArray("[1,2,5]")).toEqual([1, 2, 5]);
		expect(strings.stringToNumberArray("[1;25]", ";")).toEqual([1, 25]);
	});

	it("should convert csv", function () {
		const csv = "a,b\n1,3";
		expect(strings.csvToJson(csv)).toEqual([{ a: "1", b: "3" }]);
	});
	it("should truncate strings", function () {
		expect(strings.truncateLongString(null)).toBeNull();
		expect(strings.truncateLongString(undefined)).toBeNull();
		expect(strings.truncateLongString("some text")).toEqual("some text");
		expect(strings.truncateLongString("some text", 4, "...")).toEqual("some...");
		expect(strings.truncateLongString("1234   ", 4, "")).toEqual("1234");
	});
});
