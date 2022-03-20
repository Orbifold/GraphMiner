const moment = require("moment");
const {Dates, Time} = require("../");
const _ = require("lodash");



describe("Dates", function () {
	it("should convert to a number", function () {
		const nowString = moment(new Date()).format("MM/DD/YY");
		const nowNumber = Dates.dateToNumber(nowString);
		expect(_.isNumber(nowNumber)).toBeTruthy();
		expect(Dates.dateToNumber(null)).toEqual(null);
	});

	it("should make a date", function () {
		let date = new Date("05/22/2021");
		const num = date.getTime();
		let dd = Dates.makeDate(num);
		expect(dd).toEqual(date);
		expect(Dates.numberToDate(null)).toEqual(null);
		expect(Dates.numberToDate(num)).toEqual(date);
		expect(Dates.makeDate(null)).toEqual(null);

		expect(Time.isRecent(Dates.now())).toBeTruthy();
		expect(Time.isRecent(Dates.nowNumber())).toBeTruthy();

		date = new Date();
		dd = Dates.makeDate(date);
		expect(dd).toEqual(date);

		dd = Dates.makeDate(Date.parse("September 27, 1968"));
		// gives null because 1968 is before 1970 and gives a negative number which is not accepted
		expect(dd).toEqual(null);
	});

	it("should test for valid Dates", function () {
		expect(Dates.isValidDate("01/02/22")).toBeTruthy();
		expect(Dates.isValidDate("01/02/1968")).toBeTruthy();
		expect(Dates.isValidDate("01/02/19686565")).not.toBeTruthy();
		expect(Dates.isValidDate(new Date(2022, 12, 3))).toBeTruthy();
		expect(Dates.isValidDate(Date.now())).toBeTruthy();
		expect(Dates.isValidDate(-3)).not.toBeTruthy();
		expect(Dates.isValidDate(0.33)).not.toBeTruthy();
		expect(Dates.isValidDate(Number.NaN)).not.toBeTruthy();
	});
	it("should make Dates between", function () {
		let coll = Dates.makeDatesBetween("05/01/21", "05/21/21");
		expect(coll.length).toEqual(20);
		coll = Dates.makeDatesBetween("05/01/21", "05/01/21");
		expect(coll.length).toEqual(1);
	});
	it("should return a short date string", function () {
		let sd = Dates.shortDate(new Date(2020,11,1))
		expect(sd).toEqual("Dec 1, 2020")
	});
});
