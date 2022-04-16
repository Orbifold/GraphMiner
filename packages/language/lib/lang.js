const {Strings, Utils} = require("@graphminer/utils");
const _ = require("lodash");

class Lang {
    /**
     * Returns synonyms of the given word.
     * @param word
     * @returns {Promise<unknown>}
     */
    static async synonyms(word) {
        const natural = require("natural");

        if (_.isNil(word)) {
            return [];
        }
        if (!_.isString(word)) {
            throw new Error(Strings.ShoudBeType("word", "string", "Lang.synonyms"));
        }
        if (Utils.isEmpty(word)) {
            throw new Error(Strings.IsNil("word", "Lang.synonyms"));
        }
        const wn = new natural.WordNet();

        return new Promise((resolve, reject) => {
            let coll = [];
            wn.lookup(word, function (results) {
                results.forEach((result) => {
                    result.gloss; //?
                    coll = coll.concat(result.synonyms);
                });
                resolve(_.uniq(coll));
            });
        });
    }
}

module.exports = Lang;
