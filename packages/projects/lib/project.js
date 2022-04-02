const { Utils } = require("@graphminer/utils");
const Dashboard = require("./dashboard");

/*
 * Defines a GraphMiner project.
 * */
class Project {
	name;
	description = null;
	timestamp;
	dashboards = [];

	constructor(name = null, description = null) {
		this.id = Utils.id();
		this.name = name;
		this.description = description;
		this.timestamp = Date.now();
		this.dashboards = [];
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			timestamp: this.timestamp,
			dashboards: this.dashboards.map((d) => d.toJSON()),
		};
	}

	static fromJSON(json) {
		const p = new Project(json.name, json.description);
		p.timestamp = json.timestamp;
		if (Utils.isDefined(json.id)) {
			p.id = json.id;
		}
		if (Utils.isDefined(json.dashboards)) {
			p.dashboards = json.dashboards.map((d) => Dashboard.fromJSON(d));
		}
		return p;
	}
}

module.exports = Project;
