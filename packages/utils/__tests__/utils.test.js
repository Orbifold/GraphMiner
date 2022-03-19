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
    it("should render currency", function () {
        expect(utils.amountToMoneyFormat(12)).toEqual("US$12.00")
        expect(utils.amountToMoneyFormat(1, "EUR")).toEqual("€1.00")
        expect(utils.amountToMoneyFormat(null, "EUR")).toEqual("")
    });
    it("should render yes or no", function () {
        expect(utils.boolToYesNo("y")).toEqual("Yes")
        expect(utils.boolToYesNo("yep")).toEqual("Yes")
        expect(utils.boolToYesNo("nope")).toEqual("No")
    });
    it("should title-ize variables", function () {
        expect(utils.camelTypeToTitle("itWorks")).toEqual("It Works")
        expect(utils.camelTypeToTitle("v10")).toEqual("V10")
        expect(utils.camelTypeToTitle("WhatNot")).toEqual("What Not")
    });
    it("should get subfolder", function () {
        expect(utils.getSubFolders(["/a/b"], "/a")).toEqual(["b"])
        expect(utils.getSubFolders(["/a/b"])).toEqual(["a"])
        expect(utils.getSubFolders(["/A/a", "/A/b"], "/A")).toEqual(["a", "b"])
    });
    it("should format files sizes", function () {
        expect(utils.formatFileSize(1025)).toEqual("1KB")
        expect(utils.formatFileSize(1e10)).toEqual("9.31GB")
    });

    it("should get a JSON part", function () {
        expect(utils.getJsonPart({a: {b: 2}}, "a.b")).toEqual(2)
        expect(utils.getJsonPart({a: {b: 2}})).toEqual({a: {b: 2}})
        expect(utils.getJsonPart({a: {b: 2}}, "a.b.c")).toBeNull()
    });

    it("should deep replace", function () {
        let obj = {
            a: {
                b: 4,
                c: {r: "T"}
            }
        }
        expect(utils.deepReplace(obj, "s", "a")).toEqual({a: "s"})
        obj = {
            a: {
                b: 4,
                c: {r: "T"}
            }
        }
        expect(utils.deepReplace(obj, "s", "a.c")).toEqual({a: {b: 4, c: "s"}})
    });
    it("should get temp paths", function () {
        expect(utils.getTempFilePath().slice(-3)).toEqual("tmp")
        expect(utils.getTempFilePath(null, "abc").slice(-3)).toEqual("abc")
    });
});
