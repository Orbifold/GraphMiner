const { Dates, DateString, Strings, Utils } = require("@graphminer/utils");
const _ = require("lodash");
const { faker } = require("@faker-js/faker");

class Random {
	/**
	 * Returns a plain object with person attributes.
	 * @returns {{firstName: (*|string), lastName: (*|string), image: string, birthdate: *, nationality: (*|string), gender: (*|string), prefix: *, typeName: string, fullName: string}}
	 */
	static person() {
		const gender = faker.name.gender();
		const firstName = faker.name.firstName(gender);
		const lastName = faker.name.lastName(gender);
		const prefix = faker.name.prefix(gender);
		return {
			firstName,
			lastName,
			birthdate: DateString.makeDate(faker.date.between("1960-01-01", "2020-01-01")),
			nationality: faker.address.country(),
			image: faker.image.people(),
			fullName: `${prefix} ${firstName} ${lastName}`,
			prefix,
			gender,
			typeName: "Person",
		};
	}

	/**
	 * Returns a plain object with address attributes.
	 * @returns {{zip: string, country: (*|string), city: *, countryCode: *, latitude: *, typeName: string, addressLine: string, longitude: *}}
	 */
	static address() {
		return {
			addressLine: faker.address.streetAddress(),
			city: faker.address.city(),
			country: faker.address.country(),
			countryCode: faker.address.countryCode(),
			zip: faker.address.zipCode(),
			latitude: faker.address.latitude(),
			longitude: faker.address.longitude(),
			typeName: "Address",
		};
	}

	/**
	 * Returns a random noun.
	 * @returns {string}
	 */
	static word() {
		return faker.word.noun();
	}

	/**
	 * Returns a random noun.
	 * @returns {string}
	 */
	static noun() {
		return Random.word();
	}

	/**
	 * Returns a random verb.
	 * @returns {*}
	 */
	static verb() {
		return faker.word.verb();
	}

	/**
	 * Returns a random adjective (something adorning a noun).
	 * @returns {*}
	 */
	static adjective() {
		return faker.word.adjective();
	}

	/**
	 * Returns a random adverb (something adorning a verb).
	 * @returns {*}
	 */
	static adverb() {
		return faker.word.adverb();
	}

	/**
	 * Returns a random conjunction (something combining two sentence parts).
	 * @returns {*}
	 */
	static conjunction() {
		return faker.word.conjunction();
	}

	/**
	 * Returns a random interjection (some exclamation usually at the start of a sentence).
	 * @returns {*}
	 */
	static interjection() {
		return faker.word.interjection();
	}

	/**
	 * Generates various types of entity arrays.
	 * @param what
	 * @param amount
	 * @returns {*}
	 */
	static generate(what, amount = 10) {
		if (Utils.isEmpty(what)) {
			throw new Error(Strings.IsNil("what", "Random.generate"));
		}
		what = what.trim().toLowerCase();
		switch (what) {
			case "person":
				return _.range(amount).map((i) => Random.person());
			case "address":
				return _.range(amount).map((i) => Random.address());
			case "word":
			case "noun":
				return _.range(amount).map((i) => Random.word());
			case "verb":
				return _.range(amount).map((i) => Random.verb());
			case "adjective":
			case "adj":
				return _.range(amount).map((i) => Random.adjective());
			case "adverb":
			case "adv":
				return _.range(amount).map((i) => Random.adverb());
			default:
				throw new Error(`The type '${what}' to generate random data is not supported.`);
		}
	}
}

module.exports = Random;
