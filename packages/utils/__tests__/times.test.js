const _ = require("lodash");
const moment = require("moment");
const time = require("../lib/time")

const isRecent = time.isRecent;
describe("Time", function () {
    it("should detect a recent timestamp", function () {
        const t1 = moment().add(3, "second").toDate();
        expect(isRecent(t1, 10)).toBeTruthy();
        const t2 = moment().add(10, "second").toDate();
        expect(isRecent(t2)).not.toBeTruthy();
        // enlarge the window
        expect(isRecent(t2, 10)).toBeTruthy();
        const t3 = moment().add(-4, "second").toDate();
        expect(isRecent(t3)).toBeTruthy();
        const t4 = moment().add(-11, "second").toDate();
        expect(isRecent(t4, 10)).not.toBeTruthy();
    });
});
