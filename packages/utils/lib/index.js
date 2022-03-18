const strings = require("./strings");

const {faker} = require("@faker-js/faker");
const _ = require("lodash");
const moment = require("moment");
const fs = require("fs");
const DATEEXPR = /([0-9]+ *d(ays?)?)? *([0-9]+ *h(ours?)?)? *([0-9]+ *m(in(utes?)?)?)?/;
// from here https://emailregex.com/
const emailRegex =
          /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi;
const Utils = {
    validationRules: {
        required: (value) => !!value || "This attribute is required.",
        notEmpty: (value) => (value && value.toString().trim().length > 0) || "This attribute is required.",
        counter: (value) => (value && value.length >= 5) || "Min 5 characters",
        coherent: (value) => /^[a-zA-Z]+$/gi.test(value) || "Only upper and lower case letters are allowed for the name.",
        alphaNumeric: (value) => /^\w+$/gi.test(value) || "Only letters and numbers are allowed here.",
        text: (value) => /^[a-zA-Z\s]*$/gi.test(value) || "Only letters and white space are allowed for the name.",
        email: (value) => emailRegex.test(value) || "Not a valid email address",
    },
    /**
     * Proper formatting of money amount.
     * @param amount {any} Likely a number
     * @param currency? {string} The currency to append.
     * @return {string}
     */
    amountToMoneyFormat(amount, currency = "USD") {
        if (_.isNil(amount) || _.isNaN(amount)) {
            return "";
        }
        if (_.isNil(currency) || currency.toString().trim().length === 0) {
            currency = "USD";
        }
        try {
            // const symbol = (_.find(currencyList, { text: currency }) || {}).symbol || "";
            let num = parseFloat(amount.toString());
            if (_.isNaN(num)) {
                return "";
            }
            const formatted = new Intl.NumberFormat("en-UK", {style: "currency", currency, maximumFractionDigits: 2}).format(num); // adds comma and two decimals

            return `${formatted}`;
        } catch {
            return "";
        }
    },

    boolToYesNo(b) {
        if (_.isNil(b)) {
            return "No";
        }
        return b === true ? "Yes" : "No";
    },

    camelTypeToTitle(name) {
        if (this.isEmpty(name)) {
            return "";
        }
        const tp = name.replace(/([a-z])([A-Z])/g, "$1 $2");
        return tp.charAt(0).toUpperCase() + tp.slice(1);
    },

    getSubFolders(paths, current) {
        let items = paths;
        if (current === "/") {
            return _.uniq(
                items
                    .map((p) => p.split("/"))
                    .map((p) => p[1])
                    .filter((p) => p.length > 0),
            );
        }
        items = items.filter((p) => p.startsWith(current));
        items = items.map((p) => p.slice(current.length));
        items = items.map((p) => p.split("/"));
        items = items.filter((a) => a.length > 1);

        items = items.map((a) => a[1]);
        return _.uniq(items);
    },

    formatFileSize(size) {
        if (size > 1024 * 1024 * 1024 * 1024) {
            return (size / 1024 / 1024 / 1024 / 1024).toFixed(2) + " TB";
        } else if (size > 1024 * 1024 * 1024) {
            return (size / 1024 / 1024 / 1024).toFixed(2) + " GB";
        } else if (size > 1024 * 1024) {
            return (size / 1024 / 1024).toFixed(2) + " MB";
        } else if (size > 1024) {
            return (size / 1024).toFixed(0) + " KB";
        }
        return size.toString() + " B";
    },

    dateToISOString(expression) {
        let match = undefined;
        if ((match = DATEEXPR.exec(expression))) {
            const mom = new moment(new Date());
            const days = match[1] === undefined ? 0 : parseInt(match[1].split(" ")[0], 10);
            const hours = match[3] === undefined ? 0 : parseInt(match[3].split(" ")[0], 10);
            const minutes = match[5] === undefined ? 0 : parseInt(match[5].split(" ")[0], 10);
            mom.add(days, "days");
            mom.add(hours, "hours");
            mom.add(minutes, "minutes");
            return mom.toISOString();
        }

        const err = new Error("invalid construct value");
        err.message = "%fromNow expression is incorrect";
        throw err;
    },

    /**
     * Generic testing for diverse data types.
     * @param obj
     * @returns {boolean}
     */
    isEmpty(obj) {
        if (_.isNil(obj)) {
            return true;
        }
        if (_.isString(obj)) {
            return obj.toString().trim().length === 0;
        } else if (_.isArray(obj)) {
            return obj.length === 0;
        } else if (_.isNumber(obj)) {
            return _.isNaN(obj);
        } else if (_.isPlainObject(obj)) {
            return _.keys(obj).length === 0;
        } else if (_.isBoolean(obj)) {
            return false;
        } else {
            return false;
        }
    },

    isDefined(obj) {
        return !this.isEmpty(obj);
    },

    isUndefined(obj) {
        return this.isEmpty(obj);
    },

    /**
     * Returns a globally unique identifier.
     * @returns {string}
     * @example
     *
     * console.log(require("@graphminer/utils").id());
     * // 3ee5946e-9105-4270-b0ba-75bb3a434bf0
     */
    id() {
        return faker.datatype.uuid();
    },

    /**
     * Turn the given camel-cased string to title-case,
     * e.g. 'aBird' becomes 'A Bird'.
     * @param str {string} A camel-cased string.
     * @return {string}
     */
    titleCase(str) {
        let upper = true;
        let newStr = "";
        for (let i = 0, l = str.length; i < l; i++) {
            // Note that you can also check for all kinds of spaces  with
            // str[i].match(/\s/)
            if (str[i] === " ") {
                upper = true;
                newStr += str[i];
                continue;
            }
            newStr += upper ? str[i].toUpperCase() : str[i].toLowerCase();
            upper = false;
        }
        return newStr;
        // const regex = /^[a-z]{0,1}|\s\w/gi;
        //
        // str = str.toLowerCase();//?
        //
        // str.match(regex).forEach((char) => {
        // 	str = str.replace(char, char.toUpperCase());
        // });
        //
        // return str;
    },

    /***
     * Returns the property in the json from specified path.
     * @param d {object} A JSON object.
     * @param path {string} Path in the form "a.b.c".
     * @example
     * // using this object
     * {a:[1,2], b:{c:5}}
     * // you can access things via: a.1 or b.c
     *
     */
    getJsonPath: function (d, path) {
        if (path === "." || path === "/") {
            return d;
        }
        let res;
        if (this.isDefined(d)) {
            if (this.isDefined(path)) {
                if (path.indexOf(".") > 0) {
                    const split = path.split(".");
                    while (split.length > 0) {
                        d = d[split.shift()];
                    }
                    res = d;
                } else {
                    res = d[path];
                }
            } else {
                res = d;
            }
        } else {
            res = "[?]";
        }
        return res;
    },

    /***
     * Replaces in object d the property path with obj.
     * If the path does not exist the value will not be created.
     * @param rootObject {Object} The object in which to replace at the given path.
     * @param path {String} Something like 'a.b.c'.
     * @param substitute {Object} The object which replaces the value.
     */
    deepReplace(rootObject, substitute, path) {
        if (path === undefined) {
            path = "/";
        }
        if (path === "." || path === "/") {
            rootObject = substitute;
            return substitute;
        }
        if (this.isDefined(rootObject)) {
            if (this.isDefined(path)) {
                let walker = rootObject;
                if (path.indexOf(".") > 0) {
                    const split = path.split(".");
                    while (split.length > 1) {
                        walker = walker[split.shift()];
                    }
                    const lastProperty = split.shift();
                    if (walker.hasOwnProperty(lastProperty)) {
                        // if path exists
                        walker[lastProperty] = substitute;
                    }
                } else {
                    if (rootObject.hasOwnProperty(path)) {
                        rootObject[path] = substitute;
                    }
                }
            } else {
                rootObject = substitute;
            }
        } else {
            throw new Error("No object given to replace parts of.");
        }
        return rootObject;
    },

    getTempFilePath(fileName = null, extension = "tmp") {
        const os = require("os");
        const tempDir = os.tmpdir();
        const path = require("path");
        if (this.isEmpty(fileName)) {
            fileName = this.randomId();
        }
        return path.join(tempDir, `${fileName}.${extension}`);
    },

    createTempFile(fileName = null, extension = "tmp") {
        const filePath = this.getTempFilePath();
        fs.closeSync(fs.openSync(filePath, "w"));
        return filePath;
    },

    deleteFileOrDirectory(filePath) {
        if (fs.existsSync(filePath)) {
            if (this.isDirectory(filePath)) {
                fs.rmSync(filePath, {recursive: true, force: true});
            } else {
                fs.rmSync(filePath);
            }
        }
    },

    isDirectory(somePath) {
        return fs.lstatSync(somePath).isDirectory();
    },
    /**
     * Generates a random identifier with default length 10;
     * @param length {Number} The length of the identifier to be generated.
     * @param onlyLetters {boolean} if true will use only letters, otherwise letters and numbers are used.
     * @returns {string} The id in string format.
     * @see {@link id}
     */

    randomId(length = 10, onlyLetters = false) {
        if (this.isEmpty(length)) {
            length = 10;
        } else {
            if (!_.isNumber(length)) {
                throw new Error("Length specification in 'randomId' needs to be a number.");
            }
            length = parseInt(length.toString());
            if (_.isNaN(length)) {
                throw new Error("Length specification in 'randomId' needs to be a number.");
            }
            if (length < 1) {
                throw new Error("Cannot generate a randomId with length less than one.");
            }
        }
        // old version return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
        let result = "";
        const chars = onlyLetters ? "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" : "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (let i = length; i > 0; --i) {
            result += chars.charAt(Math.round(Math.random() * (chars.length - 1)));
        }
        return result;
    },

    randomInteger(from = 0, to = 1e10) {
        if (to - from < 1) {
            throw new Error("The bounds should be integers and differ by at least one.");
        }
        return Math.round(from + (to - from) * Math.random());
    },

    /**
     * Returns a random letter.
     * @return {string}
     * @param mixedCase? {boolean} Whether the letter can be either upper or lower cased. Defaults to true.
     */
    randomLetter(mixedCase = true) {
        const upper = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const lower = upper.toLowerCase();
        if (mixedCase) {
            return Math.random() < 0.5 ? upper : lower;
        } else {
            return lower;
        }
    },

    /**
     * Returns a string of random letters with the specified length.
     * @param length? {number} The length of the output, defaults to 10.
     * @param mixedCase? {boolean} Whether the letter can be either upper or lower cased. Defaults to true.
     * @return {any}
     */
    randomLetters(length = 10, mixedCase = true) {
        length = Math.max(1, Math.min(500, length));
        return _.range(length)
            .map((i) => this.randomLetter(mixedCase))
            .join("");
    },


    validateJsonIsForType(json, typeName) {
        if (_.isPlainObject(json)) {
            if (this.isEmpty(json.typeName)) {
                throw new Error(strings.IsNil("json.typeName", `${typeName}.fromJSON`));
            }
            if (json.typeName !== typeName) {
                throw new Error(strings.Invalid(json.typeName, `${typeName}.fromJSON`));
            }
            if (this.isEmpty(json.name)) {
                throw new Error(strings.IsNil("json.name", `${typeName}.fromJSON`));
            }
        } else {
            throw new Error(strings.ExpectedPlainObject(`${typeName}.fromJSON`));
        }
    },

    /**
     * Returns variable arguments in a format which can be more easily handled by downstream handlers.
     * @param options {any[]} the array of options
     * @returns {[number, any[]]} [length of options, array of options]
     *
     * @example
     * // give [2,[2,"a"]]
     * console.log(getArguments(2,"a"))
     */
    getArguments(options) {
        return [
            options.length,
            _.reduce(
                options,
                function (total, item) {
                    total.push(item);
                    return total;
                },
                [],
            ),
        ];
    },
    /**
     * An alias for {@link getFloat}.
     * @param d {any} Something like a number.
     * @return {number}
     */
    getNumber(d) {
        return Utils.getFloat(d);
    },

    /**
     * Attempts to get the number out of the given object.
     * @param d {any} Something like a number.
     * @return {number}
     */
    getInteger(d) {
        if (_.isNil(d)) {
            return NaN;
        }
        if (_.isNumber(d)) {
            return Math.round(d);
        }
        if (_.isDate(d)) {
            return (d).getTime();
        }
        const durations = require("./durations");

        const num = durations.durationToDays(d);
        if (_.isNaN(num)) {
            return 0;
        }
        return Math.round(num);
    },

    /**
     * Attempts to get the number out of the given object.
     * @param d {any} Something like a number.
     * @return {number}
     */
    getFloat(d) {
        if (_.isNil(d)) {
            return NaN;
        }
        if (_.isNumber(d)) {
            return d;
        }
        if (_.isDate(d)) {
            return (d).getTime();
        }
        const durations = require("./durations");

        const num = durations.durationToDays(d);
        if (_.isNaN(num)) {
            return NaN;
        }
        return num;
    }
};
module.exports = Utils;
