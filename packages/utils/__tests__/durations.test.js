const Durations = require("../lib/durations")
const parseDuration = Durations.parseDuration;
const durationToDays = Durations.durationToDays;
const daysBetween = Durations.daysBetween;
describe("Durations", function () {
    it("should parse duration", function () {
        expect(parseDuration(null)).toBeNull();
        expect(parseDuration("  ")).toBeNull();
        expect(parseDuration("3")).toEqual("3d");
        expect(parseDuration("-3")).toEqual("-3d");
        expect(parseDuration("+3")).toEqual("3d");
        expect(parseDuration(" 3  ")).toEqual("3d");
        expect(parseDuration(" 4w  ")).toEqual("4w");
        expect(parseDuration("12d")).toEqual("12d");
        expect(parseDuration("-02m")).toEqual("-2m");
        expect(parseDuration(23)).toEqual("23d");
    });
    it("should turn durations to days", function () {
        expect(durationToDays(23)).toEqual(23);
        expect(durationToDays("1m")).toEqual(30);
        expect(durationToDays("3w")).toEqual(21);
    });
    it("should count days between dates", function () {
        expect(daysBetween("01/10/20", "01/20/20")).toEqual(10);
        expect(daysBetween("01/20/20", "01/10/20")).toEqual(-10);
        expect(daysBetween("01/12/20", "01/12/20")).toEqual(0);
    });
});
