const _ = require("lodash");
const moment = require("moment");
const {Utils} = require("../")


describe('Diverse', function () {
	it('should generate a uuid', function () {
		expect(Utils.id().length).toEqual(36);
	});
});
