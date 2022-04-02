const Widget = require("./widget");

const { Utils } = require("@graphminer/utils");

class Dashboard {
	id;
	name;
	/**
	 *
	 * @type {Widget[]}
	 */
	widgets = [];

	constructor(name) {
		this.name = name;
		this.widgets = [];
		this.id=Utils.id();
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			widgets: this.widgets.map((w) => w.toJSON()),
		};
	}

	static fromJSON(json) {
		const d = new Dashboard(json.name);
		if (Utils.isDefined(json.id)) {
			d.id = json.id;
		}
		if (Utils.isDefined(json.widgets)) {
			d.widgets = json.widgets.map((w) => Widget.fromJSON(w));
		}
		return d;
	}
}

module.exports = Dashboard;
