const Durations = require("./durations");
const Predecessor = require("./predecessor");
const Utils = require("./utils");
const _ = require("lodash");

/*
 * Utilities related to predecessor data.
 * */
 class Predecessors {
    /**
     * Parses the given string (something like '12FS - 5d') to a structure.
     * @param obj
     * @returns {object} A predecessor blob.
     */
    static parsePredecessor(obj) {
        if (_.isNil(obj)) {
            return null;
        }
        if (!_.isString(obj)) {
            throw new Error("Expected a string.");
        }
        obj = obj.trim();
        const found = /^(\d+)\s*(FF|SS|FS|SF)?(\s*([+\-])\s*(\d+)([dwmy]))?$/.exec(obj);
        if (_.isNil(found)) {
            return null;
        }
        const id = Utils.getInteger(found[1]);
        if (!_.isNaN(id)) {
            return new Predecessor(id, found[2] || null, Durations.parseDuration(found[3]) || null);
        }
        return null;
    }

    /**
     * Parses the given string of predecessors.
     * @param obj
     * @param separator
     * @return {any}
     */
    static parsePredecessors(obj, separator = ",") {
        if (_.isNil(obj)) {
            return null;
        }
        if (!_.isString(obj)) {
            throw new Error("Expected a string.");
        }
        const parts = obj
            .split(separator)
            .map((u) => u.trim())
            .filter((u) => u.length > 0); //?
        return parts.map((p) => Predecessors.parsePredecessor(p));
    }
}
module.exports = Predecessors
