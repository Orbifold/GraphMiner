const _ = require("lodash");
const {Utils} = require("../");

const getNumber = Utils.getNumber;
const getFloat = Utils.getFloat;
const isEmpty = Utils.isEmpty;
const getInteger = Utils.getInteger;

describe("Utils", function () {
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
        expect(Utils.titleCase(s)).toEqual("This Is It!");
        s = "wonderTime";
        expect(Utils.titleCase(s)).toEqual("Wondertime");
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
        expect(Utils.amountToMoneyFormat(12)).toEqual("US$12.00")
        expect(Utils.amountToMoneyFormat(1, "EUR")).toEqual("€1.00")
        expect(Utils.amountToMoneyFormat(null, "EUR")).toEqual("")
    });
    it("should render yes or no", function () {
        expect(Utils.boolToYesNo("y")).toEqual("Yes")
        expect(Utils.boolToYesNo("yep")).toEqual("Yes")
        expect(Utils.boolToYesNo("nope")).toEqual("No")
    });
    it("should title-ize variables", function () {
        expect(Utils.camelTypeToTitle("itWorks")).toEqual("It Works")
        expect(Utils.camelTypeToTitle("v10")).toEqual("V10")
        expect(Utils.camelTypeToTitle("WhatNot")).toEqual("What Not")
    });
    it("should get subfolder", function () {
        expect(Utils.getSubFolders(["/a/b"], "/a")).toEqual(["b"])
        expect(Utils.getSubFolders(["/a/b"])).toEqual(["a"])
        expect(Utils.getSubFolders(["/A/a", "/A/b"], "/A")).toEqual(["a", "b"])
    });
    it("should format files sizes", function () {
        expect(Utils.formatFileSize(1025)).toEqual("1KB")
        expect(Utils.formatFileSize(1e10)).toEqual("9.31GB")
    });

    it("should get a JSON part", function () {
        expect(Utils.getJsonPart({a: {b: 2}}, "a.b")).toEqual(2)
        expect(Utils.getJsonPart({a: {b: 2}})).toEqual({a: {b: 2}})
        expect(Utils.getJsonPart({a: {b: 2}}, "a.b.c")).toBeNull()
    });

    it("should deep replace", function () {
        let obj = {
            a: {
                b: 4,
                c: {r: "T"}
            }
        }
        expect(Utils.deepReplace(obj, "s", "a")).toEqual({a: "s"})
        obj = {
            a: {
                b: 4,
                c: {r: "T"}
            }
        }
        expect(Utils.deepReplace(obj, "s", "a.c")).toEqual({a: {b: 4, c: "s"}})
    });
    it("should get temp paths", function () {
        expect(Utils.getTempFilePath().slice(-3)).toEqual("tmp")
        expect(Utils.getTempFilePath(null, "abc").slice(-3)).toEqual("abc")
    });
});
