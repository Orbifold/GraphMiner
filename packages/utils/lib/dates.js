const moment = require("moment");

const Utils = require("./");
const _ = require("lodash");

/*
 * Utilities related to the JavaScript Date type.
 * */
class Dates {
   static  shortDate(d) {
        if (_.isNil(d)) {
            return "";
        }
        const date = Dates.makeDate(d)
        return moment(date).format("ll");
    }

    /**
     * Tries hard to turn the given thing into a Date object.
     * @param obj {any} Anything containing date info.
     * @return {Date}
     */
    static makeDate(obj) {
        if (_.isNil(obj)) {
            return null;
        } else if (_.isDate(obj)) {
            if (!_.isNaN((obj).getTime())) {
                return new Date((obj).getTime());
            }
            return null;
        } else if (_.isNumber(obj)) {
            const intNum = _.toNumber(obj);
            // if the number is negative it means it's an event before 1970
            // but from a business perspective this is not accepted
            if (!_.isNaN(intNum) && intNum >= 0 && _.isInteger(intNum)) {
                if (Dates.isValidDate(new Date(intNum))) {
                    return new Date(intNum);
                }
            }
            return null;
        } else if (_.isString(obj)) {
            if (Utils.isEmpty(obj)) {
                return null;
            }
            // number as a string?
            const num = _.toNumber(obj.trim()); //?
            if (!_.isNaN(num)) {
                if (num < 0) {
                    return null;
                }
                if (Dates.isValidDate(new Date(num))) {
                    return new Date(num);
                }
                return null;
            }
            if (Dates.isValidDate(new Date(obj.trim()))) {
                return new Date(obj.trim());
            }
            return null;
        } else {
            return null;
        }
    }

    /**
     * Return the Unix timestamp for the date.
     *
     * @param obj {any} Anything containing date info.
     * @return {null | number}
     */
    static dateToNumber(obj) {
        if (_.isNil(obj)) {
            return null;
        }
        if (!_.isDate(obj)) {
            obj = Dates.makeDate(obj);
        }
        if (_.isNil(obj) || !_.isDate(obj)) {
            return null;
        }

        return obj.getTime();
    }

    /**
     * Turns the given number to a Date if possible.
     * @param num {number} A number representing a Unix timestamp.
     * @return {null | Date}
     */
    static numberToDate(num) {
        if (_.isNil(num)) {
            return null;
        }
        const intNum = parseInt(num.toString().trim());
        if (_.isNaN(intNum)) {
            return null;
        }
        return new Date(intNum);
    }

    /**
     * Returns now as a Date instance.
     * @return {Date}
     */
    static now() {
        return new Date();
    }

    /**
     * Returns now as a Unix timestamp.
     * @return {number}
     */
    static nowNumber() {
        return Date.now();
    }

    /**
     * Returns whether the given object can be converted to a valid Date.
     * @param obj {any} Anything that can be potentially interpreted as a date.
     * @return {any}
     */
    static isValidDate(obj) {
        if (_.isNil(obj)) {
            return false;
        } else if (_.isDate(obj)) {
            return !_.isNaN((obj).getTime());
        } else if (_.isNumber(obj)) {
            const intNum = _.toNumber(obj);

            if (!_.isNaN(intNum) && intNum >= 0 && _.isInteger(intNum)) {
                return Dates.isValidDate(new Date(intNum));
            }
            return false;
        } else if (_.isString(obj)) {
            // number as a string?
            const num = _.toNumber(obj.trim()); //?
            if (!_.isNaN(num)) {
                console.log(num);
                if (num < 0) {
                    return false;
                }
                return Dates.isValidDate(new Date(num)); //?
            }
            return Dates.isValidDate(new Date(obj.trim()));
        } else {
            return false;
        }
    }

    /**
     * Creates an array of dates between the specified interval.
     * @param startDate {any} The start of the interval.
     * @param endDate {any} The end of the interval.
     * @return {Date[]}
     */
    static makeDatesBetween(startDate, endDate) {
        const from = Dates.makeDate(startDate);
        const to = Dates.makeDate(endDate);
        if (_.isNil(from)) {
            throw new Error(`Could not turn '${startDate}' into a starting date.`);
        }
        if (_.isNil(to)) {
            throw new Error(`Could not turn '${endDate}' into a starting date.`);
        }
        const startMoment = moment(from);
        const endMoment = moment(to);
        if (startMoment.toString() === endMoment.toString()) {
            return [startMoment.toDate()];
        } else if (startMoment > endMoment) {
            throw new Error("Cannot make an interval with the start date later than the end date.");
        }
        const coll = [];

        let current = startMoment.clone();
        while (current < endMoment) {
            coll.push(current);
            current = current.clone();
            current.add(1, "day");
        }
        return coll.map((m) => m.toDate());
    }
}

module.exports = Dates
