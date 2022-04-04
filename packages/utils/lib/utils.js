const strings = require("./strings");
const { faker } = require("@faker-js/faker");
const _ = require("lodash");
const moment = require("moment");
const fs = require("fs");
const os = require("os");
const path = require("path");

const DateOffsetRegex = /([0-9]+ *d(ays?)?)? *([-+]?[0-9]+ *h(ours?)?)? *([0-9]+ *m(in(utes?)?)?)?/;
// from here https://emailregex.com/
const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi;
const Utils = {
	/**
	 * Common validation rules.
	 * @example
	 * // If you use Vue
	 * <v-text-field :rules="validationRules.required"
	 *             label="First name"></v-text-field>
	 */
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
	 * @param [currency=USD] {string} The currency to append (e.g. EUR, JPY, USD...)
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
			const formatted = new Intl.NumberFormat("en-UK", { style: "currency", currency, maximumFractionDigits: 2 }).format(num); // adds comma and two decimals

			return `${formatted}`;
		} catch {
			return "";
		}
	},

	/**
	 * Turns the given value into 'Yes' or 'No'.
	 * @param b {any} Anything
	 * @returns {string}
	 */
	boolToYesNo(b) {
		if (_.isNil(b)) {
			return "No";
		}
		b = b.toString().trim().toLowerCase();
		if (_.includes(["yes", "y", "yep", "yah", "duh"], b)) {
			return "Yes";
		}
		if (_.includes(["no", "n", "nah", "nope"], b)) {
			return "No";
		}
		return !!b === true ? "Yes" : "No";
	},

	/**
	 * Turns a camel-type string into a title.
	 * @param name {string} Typically, a variable like e.g. "groupName".
	 * @returns {string}
	 */
	camelTypeToTitle(name) {
		if (this.isEmpty(name)) {
			return "";
		}
		const tp = name.replace(/([a-z])([A-Z])/g, "$1 $2");
		return tp.charAt(0).toUpperCase() + tp.slice(1);
	},

	/**
	 * Returns the sub-folder for the given level.
	 * @param paths {string[]}
	 * @param current
	 * @returns {*[]|*}
	 *
	 * @example
	 * // returns ["a","b"]
	 * getSubFolders(["/A/a", "/A/b"], "/A")
	 *
	 * // returns ["a"]
	 * getSubFolders(["/a/b"])
	 */
	getSubFolders(paths, current = "/") {
		if (this.isEmpty(paths)) {
			return [];
		}
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

	/**
	 * Returns a more human-readable file size from a raw amount.
	 * @param size {number} The raw files size.
	 * @returns {string}
	 *
	 * @example
	 *
	 * formatFileSize(1e10 ) // 9.31GB
	 */
	formatFileSize(size) {
		if (size > 1024 * 1024 * 1024 * 1024) {
			return (size / 1024 / 1024 / 1024 / 1024).toFixed(2) + "TB";
		} else if (size > 1024 * 1024 * 1024) {
			return (size / 1024 / 1024 / 1024).toFixed(2) + "GB";
		} else if (size > 1024 * 1024) {
			return (size / 1024 / 1024).toFixed(2) + "MB";
		} else if (size > 1024) {
			return (size / 1024).toFixed(0) + "KB";
		}
		return size.toString() + "B";
	},

	/**
	 * Turns thins like "3d-2h" into an ISO date format.
	 * @param expression {string}
	 * @returns {string}
	 *
	 * @example
	 * // depends on the current time and zone
	 * dateOffsetToISOString("1d -2h") // 2022-03-20T04:39:03.818Z
	 */
	dateOffsetToISOString(expression) {
		let match = undefined;
		if ((match = DateOffsetRegex.exec(expression))) {
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
	 * @param obj {*} Anything really.
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

	/**
	 * The negation of {@link isEmpty}.
	 * @param obj {*} Anything
	 * @returns {boolean}
	 */
	isDefined(obj) {
		return !this.isEmpty(obj);
	},

	/**
	 * An alias for {@link isEmpty}.
	 * @param obj {*} Anything.
	 * @returns {boolean}
	 */
	isUndefined(obj) {
		return this.isEmpty(obj);
	},

	/**
	 * Returns a globally unique identifier (UUID v4).
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
	getJsonPart(d, path) {
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
		return res || null;
	},

	/***
     * Replaces in object d the property path with obj.
     * If the path does not exist the value will not be created.
     @example
     const obj = {
            a: {
                b: 4,
                c: {r: "T"}
            }
        }
     deepReplace(obj, "s", "a") // give {a: "s"}

     * @param rootObject {Object} The object in which to replace at the given path.
     * @param path {String} Something like 'a.b.c'.
     * @param substitute {Object} The object which replaces the value.
     *

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

	/**
	 * Returns an OS-specific, temporary file path.
	 * @param [fileName=null] {string} If not given a random name will be generated.
	 * @param [extension="tmp"] {string} The extension to use.
	 * @returns {string}
	 */
	getTempFilePath(fileName = null, extension = "tmp") {
		const os = require("os");
		const tempDir = os.tmpdir();
		const path = require("path");
		if (this.isEmpty(fileName)) {
			fileName = this.randomId();
		}
		return path.join(tempDir, `${fileName}.${extension}`);
	},

	/**
	 * Creates a zero-size temporary file and returns the path.
	 * See also {@link getTempFilePath}.
	 * @param [fileName=null] {string} If not given a random name will be generated.
	 * @param [extension="tmp"] {string} The extension to use.
	 * @returns {string}
	 */
	createTempFile(fileName = null, extension = "tmp") {
		const filePath = this.getTempFilePath();
		fs.closeSync(fs.openSync(filePath, "w"));
		return filePath;
	},

	/**
	 * Deletes the specified file or directory.
	 * @param filePath {string} Path representing a file or a directory.
	 */
	deleteFileOrDirectory(filePath) {
		if (this.isEmpty(filePath)) {
			return;
		}
		if (fs.existsSync(filePath)) {
			if (this.isDirectory(filePath)) {
				fs.rmSync(filePath, { recursive: true, force: true });
			} else {
				fs.rmSync(filePath);
			}
		}
	},

	/**
	 * Returns whether the given path is a directory.
	 * @param somePath {string} Path to something.
	 * @returns {boolean}
	 */
	isDirectory(somePath) {
		if (this.isEmpty(somePath)) {
			return false;
		}
		return fs.lstatSync(somePath).isDirectory();
	},
	/**
	 * Generates a random identifier with default length 10.
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

	/**
	 * Generates a random integer.
	 * @param [from=0] {number} The start of the interval.
	 * @param [to=1e10] {number} The end of the interval.
	 * @returns {number}
	 */
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

	/**
	 * Throws an error if the given JSON does not have the correct attribute "typeName".
	 *
	 * @param json {*} Some serialized entity.
	 * @param typeName {string} The expected serialized type.
	 */
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
		const num = Utils.getNumber(d);
		if (_.isNaN(num)) {
			return NaN;
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
			return d.getTime();
		}
		const durations = require("./durations");

		const num = durations.durationToDays(d);
		if (_.isNaN(num)) {
			return NaN;
		}
		return num;
	},
	isInteger(i) {
		return this.getInteger(i) === i;
	},
	isPositiveInteger(i, allowZero = false) {
		if (allowZero) {
			return this.getInteger(i) === i && i >= 0;
		} else {
			return this.getInteger(i) === i && i > 0;
		}
	},

	/**
	 * Tests for integers within the specified interval.
	 * @param i {number}
	 * @param a
	 * @param b
	 * @param inclusiveEnd
	 * @param allowZero
	 * @returns {boolean}
	 */
	positiveNumberBetween(i, a, b, inclusiveEnd = true, allowZero = false) {
		if (!_.isNumber(i)) {
			throw new Error("Expected a number to test for.");
		}
		if (!_.isNumber(a)) {
			throw new Error("Expected a number for the start of the interval.");
		}
		if (!_.isNumber(b)) {
			throw new Error("Expected a number for the end of the interval.");
		}
		if (a >= b) {
			throw new Error("The start of the interval should be smaller than its end.");
		}
		if (allowZero && i === 0) {
			return true;
		}
		if (this.isPositiveInteger(i, allowZero)) {
			if (inclusiveEnd) {
				return a <= i && i <= b;
			} else {
				return a <= i && i < b;
			}
		}
		return false;
	},
	isStringOrNumber(u, allowNil = false) {
		if (!allowNil && _.isNil(u)) {
			return false;
		}
		return _.isString(u) || _.isNumber(u);
	},
	histogram(data, bins = 10) {
		if (bins === 1) {
			return [data.length];
		}
		const bin_width = (_.max(data) - _.min(data)) / (bins - 1);
		let min = Infinity;
		let max = -Infinity;

		for (const item of data) {
			if (item < min) min = item;
			else if (item > max) max = item;
		}

		// const bins = Math.ceil((max - min + 1) / bin_width);

		const histogram = new Array(bins).fill(0);

		for (const item of data) {
			histogram[Math.floor((item - min) / bin_width)]++;
		}
		return _.zip(_.range(min, max + bin_width, bin_width), histogram);
	},
	/**
	 * Checks that the given string can act as a simple (variable) name.
	 * Only alphanumeric and should not start with a number.
	 * @param s {string} Any string.
	 * @returns {boolean}
	 */
	isSimpleString(s) {
		if (Utils.isEmpty(s)) {
			return false;
		}
		if (!_.isString(s)) {
			return false;
		}
		return /^[a-zA-Z]([a-zA-Z0-9])*$/gi.test(s);
	},
	/**
	 * Safe evaluation of the given code in the specified context.
	 * @param code
	 * @param thisContext
	 * @returns {any}
	 */
	eval(code, thisContext) {
		let output;
		{
			let window = null;

			// global = null
			output = function () {
				try {
					eval(code);
					return null;
				} catch (e) {
					return "Error: " + e.message;
				}
			}.call(thisContext);
		}
		return output;
	},
};
module.exports = Utils;
