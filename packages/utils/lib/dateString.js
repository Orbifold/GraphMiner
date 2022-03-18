/*
 * Utilities related to dates in the simple MM/DD/YY form
 * */
const moment = require("moment");

const Dates = require("./dates");
const Utils = require("./");
const _ = require("lodash");
/*
 * Utilities related to dates in the format "MM/DD/YY".
 * */
class DateString {
	/**
	 * Returns a date with the specified offset.
	 * @param d {any} Something like a date.
	 * @param delta {number} The offset. Can be positive or negative.
	 * @param unit {string} Day, week, month....
	 * @return {string}
	 */
	static getDateOffset(d, delta = 0, unit = "day") {
		if (_.isNil(d)) {
			return null;
		}
		const date = Dates.makeDate(d);

		let m = moment(date);
		if (!m.isValid()) {
			return null;
		}
		m.set({ hour: 12, minute: 0, second: 0 }); // ensures better offsets
		if (delta !== 0) {
			m = m.add(delta, unit);
		}
		return m.format("MM/DD/YY");
	}

	/**
	 * Return the date in MM/DD/YY format from the number representation.
	 * @param num
	 * @return {string | null}
	 */
	static numberToSimpleDateString(num) {
		if (_.isNil(num)) {
			return null;
		}
		const intNum = parseInt(num.toString());
		if (_.isNaN(intNum)) {
			return null;
		}
		const date = new Date(intNum);
		return moment(date).format("MM/DD/YY");
	}

	/**
	 * Returns a date in MM/DD/YY format form whatever is given.
	 * @param obj {any} Something date-like.
	 */
	static makeDate(obj) {
		const date = Dates.makeDate(obj);
		if (!Utils.isEmpty(date)) {
			return moment(date).format("MM/DD/YY");
		}
	}

	/**
	 * Returns an actual Date object from the simple date format.
	 * @param s {string} A simple date string.
	 * @return {Date}
	 */
	static getDateFromSimpleDate(s) {
		return Dates.makeDate(s);
	}

	/**
	 * Returns the simple string date as a number.
	 * @param s {string} A simple string date.
	 * @return {number}
	 */
	static simpleStringDateToNumber(s) {
		if (Utils.isEmpty(s)) {
			return Number.NaN;
		}
		const d = Dates.makeDate(s);
		if (Utils.isEmpty(d)) {
			return Number.NaN;
		}
		return d.getTime();
	}

	/**
	 * Returns now as a simple date string.
	 * @return {Date}
	 */
	static now() {
		return DateString.makeDate(new Date());
	}

	/**
	 * Returns now as a Unix timestamp.
	 * @return {number}
	 */
	static nowNumber() {
		return Date.now();
	}

	/**
	 * Returns whether the given object can be interpreted as a date-string of the format "MM/DD/YY".
	 * @param obj
	 * @return {boolean}
	 */
	static isValidDateString(obj) {
		const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
		if (!_.isString(obj)) {
			return false;
		} else if (!regex.test(obj.toString().trim())) {
			return false;
		}
		const parts = regex.exec(obj.toString().trim());
		const M = _.toNumber(parts[1]);
		const D = _.toNumber(parts[2]);
		const Y = _.toNumber(parts[3]);
		return D <= 31 && D > 0 && M <= 12 && M > 0 && Y > 0;
	}

	/**
	 * Creates an array of dates between the specified interval.
	 * @param startDate {any} The start of the interval.
	 * @param endDate {any} The end of the interval.
	 * @return {string[]}
	 */
	static makeDatesBetween(startDate, endDate) {
		return Dates.makeDatesBetween(startDate, endDate).map((d) => DateString.makeDate(d));
	}
}
module.exports = DateString;
