const { Utils } = require("@graphminer/utils");

/*
 * Defines a GraphMiner project.
 * */
class Project {
	name;
	description = null;
	timestamp;

	constructor(name = null, description = null) {
		this.id = Utils.id();
		this.name = name;
		this.description = description;
		this.timestamp = Date.now();
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			timestamp: this.timestamp,
		};
	}

	static fromJSON(json) {
		const p = new Project(json.name, json.description);
		p.timestamp = json.timestamp;
		if (Utils.isDefined(json.id)) {
			p.id = json.id;
		}
		return p;
	}
}

module.exports = Project;
