const WidgetTemplate = require("./widgetTemplate");
const _ = require("lodash");

const { Utils } = require("@graphminer/utils");

class Dashboard {
	id;
	name;
	description;
	/**
	 *
	 * @type {Widget[]}
	 */
	widgets = [];
	color;

	constructor(name, description = null, color = null) {
		this.name = name;
		this.description = description;
		this.widgets = [];
		this.id = Utils.id();
		this.color = color;
	}

	getWidgetById(widgetId) {
		return _.find(this.widgets, (w) => w.id === widgetId) || null;
	}

	getWidgetByName(name) {
		name = name.toString().trim();
		return _.find(this.widgets, (w) => w.name.toLowerCase() === name) || null;
	}

	removeWidgetById(widgetId) {
		_.remove(this.widgets, (w) => w.id === widgetId);
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			widgets: this.widgets.map((w) => w.toJSON()),
			color: this.color,
		};
	}

	static fromJSON(json) {
		const d = new Dashboard(json.name);
		d.color = json.color;
		d.description = json.description;
		if (Utils.isDefined(json.id)) {
			d.id = json.id;
		}
		if (Utils.isDefined(json.widgets)) {
			d.widgets = json.widgets.map((w) => WidgetTemplate.fromJSON(w));
		}
		return d;
	}
}

module.exports = Dashboard;
