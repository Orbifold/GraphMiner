const { Utils, Strings } = require("@graphminer/utils");
const WidgetTemplate = require("./widgetTemplate");
const DefaultLayout = {
	x: 0,
	y: 0,
	w: 2,
	h: 2,
	index: 0,
};

/*
 * A widget part of a dashboard.
 */
class Widget extends WidgetTemplate {
	/**
	 * Defines the layout within the dashboard.
	 */
	layout;

	dashboardId;
	projectId;

	constructor(name, description, code, dashboardId, projectId, type = "js") {
		super(name, description, code, type);
		this.layout = DefaultLayout;
		this.dashboardId = dashboardId;
		this.projectId = projectId;
	}

	toJSON() {
		const j = super.toJSON();
		j.typeName = "Widget";
		j.layout = this.layout;
		j.dashboardId = this.dashboardId;
		j.projectId = this.projectId;
		return j;
	}

	static fromJSON(json) {
		const w = new Widget(json.name, json.description, json.code, json.type);
		if (json.id) {
			w.id = json.id;
		}
		w.layout = json.layout || DefaultLayout;
		w.dashboardId = json.dashboardId;
		w.projectId = json.projectId;
		return w;
	}

	static fromWidgetTemplate(template, dashboardId = null, projectId = null) {
		if (Utils.isEmpty(template)) {
			throw new Error(Strings.IsNil("template", "Widget.fromWidgetTemplate"));
		}
		if (template.typeName !== "WidgetTemplate") {
			throw new Error(Strings.ShoudBeType("template", "WidgetTemplate", "Widget.fromWidgetTemplate"));
		}
		const w = new Widget(template.name, template.description, template.code, template.type);
		w.layout = DefaultLayout;
		w.dashboardId = dashboardId;
		w.projectId = dashboardId;
		return w;
	}

	clone() {
		const w = Widget.fromJSON(this.toJSON());
		w.id = Utils.id();
		return w;
	}
}

module.exports = Widget;
