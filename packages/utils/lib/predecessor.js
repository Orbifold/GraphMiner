const Utils = require("./utils");
const Durations = require("./durations");

/**
 * A simple structure holding predecessor information.
 */
class Predecessor {
    get delayDays() {
        if (Utils.isEmpty(this.delay)) {
            return 0;
        }
        return Durations.durationToDays(this.delay);
    }

    constructor(id, type, delay) {
        this.id = id;
        this.type = type
        this.delay = delay
    }
}

module.exports = Predecessor
