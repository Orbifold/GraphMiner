const Random = require("../lib/random");
const _ = require("lodash");
const lang = require("../lib/lang");
const {Dates, DateString, Strings, Utils} = require("@graphminer/utils");

describe("Random", () => {
	it("should generate random things", function () {
		let r = Random.generate("person");
		expect(r.length).toEqual(10);
		expect(_.every(Random.generate("word"), (w) => Utils.isDefined(w))).toBeTruthy();
	});
	it("should find synonyms", async function () {
		let found = await lang.synonyms("genius");
		expect(_.includes(found, "virtuoso")).toBeTruthy();
		found = await lang.synonyms("11");
		expect(_.includes(found, "eleven")).toBeTruthy();
	});
});
