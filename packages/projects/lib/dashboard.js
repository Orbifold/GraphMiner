const WidgetTemplate = require("./widgetTemplate");
const _ = require("lodash");

const { Utils, Strings } = require("@graphminer/utils");
const Widget = require("./widget");

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
	projectId;

	constructor(name, description = null, color = null, projectId = null) {
		this.name = name;
		this.description = description;
		this.widgets = [];
		this.id = Utils.id();
		this.color = color;
		this.projectId = projectId;
	}

	addWidget(widget) {
		if (Utils.isEmpty(widget)) {
			throw new Error(Strings.IsNil("widget", "Dashboard.addWidget"));
		}
		let found = this.getWidgetById(widget.id);
		if (found) {
			throw new Error("There is already a widget with this id.");
		}
		widget.projectId = this.projectId;
		widget.dashboardId = this.id;
		this.widgets.push(widget);
	}

	upsertWidget(widget) {
		if (Utils.isEmpty(widget)) {
			throw new Error(Strings.IsNil("widget", "Dashboard.addWidget"));
		}
		_.remove(this.widgets, (w) => w.id === widget.id);
		widget.projectId = this.projectId;
		widget.dashboardId = this.id;
		this.widgets.push(widget);
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
			projectId: this.projectId,
		};
	}

	static fromJSON(json) {
		const d = new Dashboard(json.name);
		d.color = json.color;
		d.description = json.description;
		d.projectId = json.projectId;
		if (Utils.isDefined(json.id)) {
			d.id = json.id;
		}
		if (Utils.isDefined(json.widgets)) {
			d.widgets = json.widgets.map((w) => Widget.fromJSON(w));
		}
		d.widgets.forEach((w) => {
			w.dashboardId = d.id;
			w.projectId = d.projectId;
		});
		return d;
	}
}

module.exports = Dashboard;
