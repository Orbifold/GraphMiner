const moment = require("moment");
const _ = require("lodash");
const utils = require("./");
const dates = require("./dates");
/*
 * Utilities related to durations.
 * */
class Durations {
    /**
     * Tries to make sense of the given object as a duration.
     * A number defaults to days.
     * Returns a standard format like '4d', '5w', '1m'.
     * @param obj {number|string} A string or a number, in which case the number is interpreted as a number of days.
     * @returns {string|null}
     */
    static parseDuration(obj) {
        if (_.isNil(obj)) {
            return null;
        }
        if (_.isString(obj)) {
            const weeks = /([+-]?([0-9]*[.])?[0-9]+)\s*(weeks|week|w)/.exec(obj);
            const days = /([+-]?([0-9]*[.])?[0-9]+)\s*(days|day|d)/.exec(obj);
            const months = /([+-]?([0-9]*[.])?[0-9]+)\s*(months|month|m)/.exec(obj);
            if (!_.isNil(weeks)) {
                return `${parseFloat(weeks[1].toString())}w`;
            } else if (!_.isNil(days)) {
                return `${parseFloat(days[1].toString())}d`;
            } else if (!_.isNil(months)) {
                return `${parseFloat(months[1].toString())}m`;
            } else {
                const num = parseFloat(obj.toString().trim());
                if (!_.isNaN(num)) {
                    return `${num}d`;
                }
                return null;
            }
        } else if (_.isNumber(obj)) {
            // number defaults to days
            return `${obj}d`;
        }
    }

    /**
     * Attempts to convert the given duration indication to a number representing days.
     * @param obj
     * @returns {number}
     */
    static durationToDays(obj) {
        const found = Durations.parseDuration(obj);
        if (_.isNil(found)) {
            return 0;
        }
        const unit = found.slice(-1);
        switch (unit) {
            case "d":
                return parseFloat(found);
            case "w":
                return parseFloat(found) * 7;
            case "m":
                return parseFloat(found) * 30; // yes, yes, why not 31 or 29...
        }
    }

    /**
     * Returns the number of days between the given dates.
     * @param from
     * @param to
     * @return {number}
     */
    static daysBetween(from, to) {
        let fromDate = dates.makeDate(from);
        let toDate = dates.makeDate(to);
        if (!utils.isEmpty(fromDate) && !utils.isEmpty(toDate)) {
            if (fromDate === toDate) {
                return 0;
            }
            const fromMoment = moment(fromDate);
            const toMoment = moment(toDate);
            return moment.duration(toMoment.diff(fromMoment)).asDays();
        }
        return Number.NaN;
    }
}

module.exports = Durations;
