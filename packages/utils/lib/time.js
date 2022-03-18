const _ = require("lodash");
const moment = require("moment");
const dates = require("./dates");
  class Time {
    /**
     * Returns true if the given timestamp is within the delta window.
     * @param d {*} A timestamp as a number string, e.g. Date.now.toString()
     * @param delta {number} The amount of seconds, meaning that the given timestamp should be in [d - delta, d + delta].
     */
    static isRecent(d, delta = 5) {
        if (_.isNil(d)) {
            return false;
        }
        const date = dates.makeDate(d.toString());
        return Math.abs(moment.duration(moment(new Date()).diff(moment(date))).seconds()) <= delta;
    }
}
module.exports = Time;
