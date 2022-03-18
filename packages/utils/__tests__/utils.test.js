const _ = require("lodash");
const utils = require("../")
const getNumber = utils.getNumber;
const getFloat = utils.getFloat;
const isEmpty = utils.isEmpty;
const getInteger = utils.getInteger;

describe("utils", function () {
    it("should resolve numbers", function () {
        expect(getNumber("44d")).toEqual(44);
        expect(getNumber("414")).toEqual(414);
        expect(getNumber(-3)).toEqual(-3);
        expect(getNumber("")).toEqual(0);
        expect(getNumber("d")).toEqual(0);
        expect(getNumber("-23d")).toEqual(-23);
        expect(getNumber(null)).toEqual(NaN);

        expect(getInteger(null)).toEqual(NaN);
        expect(getInteger(2.3)).toEqual(2);
        expect(getInteger("3.4")).toEqual(3);
        expect(getInteger(new Date())).toEqual(Date.now());
    });
    it("should title case things", function () {
        let s = "this is it!";
        expect(utils.titleCase(s)).toEqual("This Is It!");
        s = "wonderTime";
        expect(utils.titleCase(s)).toEqual("Wondertime");
    });
    it("should test for empty", function () {
        expect(isEmpty(0)).toBeFalsy();
        expect(isEmpty(1)).toBeFalsy();
        expect(isEmpty(true)).toBeFalsy();
        expect(isEmpty(false)).toBeFalsy();
        expect(isEmpty({x: 4})).toBeFalsy();
        expect(isEmpty({})).toBeTruthy();
        expect(isEmpty("   ")).toBeTruthy();
        expect(isEmpty(2.3)).toBeFalsy();
        expect(isEmpty(0.04)).toBeFalsy();
        expect(isEmpty(null)).toBeTruthy();
        expect(isEmpty(NaN)).toBeTruthy();
        expect(isEmpty([])).toBeTruthy();
        expect(isEmpty([1, 3])).not.toBeTruthy();
    });

    it("should get floats", function () {
        expect(getFloat("2d")).toEqual(2);
        expect(getFloat("2w")).toEqual(14);
        expect(getFloat("1.5m")).toEqual(45);
    });
});
