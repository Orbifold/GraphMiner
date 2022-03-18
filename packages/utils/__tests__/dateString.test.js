const _ = require("lodash");
const moment = require("moment");
const DateString = require("../lib/dateString");

describe("DateString", function () {
	it("should get date offsets", function () {
		const date = new Date("06/14/2020");
		const plus2 = DateString.getDateOffset(date, 2);
		expect(plus2).toEqual("06/16/20");
		const minus2 = DateString.getDateOffset(date, -2);
		expect(minus2).toEqual("06/12/20");
		const plus2Months = DateString.getDateOffset("01/01/16", 2, "M"); //?
		expect(plus2Months).toEqual("03/01/16");
		expect(DateString.getDateOffset(null)).toEqual(null);
		expect(DateString.getDateOffset("")).toEqual(null);
	});

	it("should convert a number", function () {
		expect(DateString.numberToSimpleDateString(null)).toEqual(null);
		expect(DateString.numberToSimpleDateString(Date.now())).toEqual(moment().format("MM/DD/YY"));
		expect(DateString.numberToSimpleDateString("A")).toEqual(null);
	});

	it("should make dates", function () {
		expect(DateString.makeDate("05/12/23")).toEqual("05/12/23");
		expect(DateString.makeDate(new Date())).toEqual(moment().format("MM/DD/YY"));
		expect(DateString.makeDate(Date.now())).toEqual(moment().format("MM/DD/YY"));

		expect(DateString.getDateFromSimpleDate("11/30/10")).toEqual(new Date(2010, 10, 30));
	});

	it("should turn simple dates to numbers", function () {
		const num = DateString.simpleStringDateToNumber("09/06/68"); //?
		expect(num).toEqual(new Date("09/06/68").getTime()); //?
	});
	it("should test for valid string", function () {
		expect(DateString.isValidDateString("1/2/33")).toBeTruthy();
		expect(DateString.isValidDateString("01/02/33")).toBeTruthy();
		expect(DateString.isValidDateString("01/02/33")).toBeTruthy();
		expect(DateString.isValidDateString("31/02/33")).not.toBeTruthy();
		expect(DateString.isValidDateString("1/42/33")).not.toBeTruthy();
		expect(DateString.isValidDateString("1/0/33")).not.toBeTruthy();
		expect(DateString.isValidDateString("00/12/33")).not.toBeTruthy();
	});
	it("should make dates from numbers", function () {
		expect(DateString.isValidDateString(DateString.makeDate("1627281485796"))).toBeTruthy();
		expect(DateString.isValidDateString(DateString.makeDate(0))).toBeTruthy();
	});
	it("should ", function () {
		console.log(DateString.getDateFromSimpleDate("11/05/20"));
	});
});
