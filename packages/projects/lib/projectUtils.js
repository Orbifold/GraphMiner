const { Utils, Strings } = require("@graphminer/utils");
const _ = require("lodash");
const Project = require("./project");

class ProjectUtils {
	static getProjectFromSpecs(...projectSpecs) {
		const [count, args] = Utils.getArguments(projectSpecs);
		switch (count) {
			case 0:
				return null;
			case 1:
				if (_.isString(args[0])) {
					return new Project(args[0]);
				} else if (args[0] instanceof Project) {
					return args[0];
				} else {
					throw new Error("Don't know how to turn the given argument into a project.");
				}
			case 2:
				return new Project(args[0], args[1]);
			default:
				throw new Error("Don't know how to turn the given argument into a project.");
		}
	}
}

module.exports = ProjectUtils;
