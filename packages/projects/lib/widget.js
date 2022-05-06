const {Utils, Strings} = require("@graphminer/utils");
const WidgetTemplate = require("./widgetTemplate");
const DefaultLayout = {
    x: 0,
    y: 0,
    w: 6,
    h: 6,
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

    constructor(name, description, code, dashboardId, projectId, language = "js", renderer = "bar") {
        super(name, description, code, language, renderer);
        this.layout = _.clone(DefaultLayout);
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
        const w = new Widget(json.name, json.description, json.code, json.dashboardId, json.projectId, json.language, json.renderer);
        if (json.id) {
            w.id = json.id;
        }
        w.layout = json.layout || _.clone(DefaultLayout);
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
        const w = new Widget(template.name, template.description, template.code, dashboardId, projectId, template.language, template.renderer);
        w.layout = _.clone(DefaultLayout);
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
this.data = [
    {
        name: "A",
        data: _.range(12).map(u => Math.random() * 10)
    },
    {
        name: "B",
        data: _.range(12).map(u => Math.random() * 10)
    }
]
this.options = {
    chart: {
        height: "100%",
        width: "100%",
        type: "line"
    },
    stroke: {
        width: 1.3,
        curve: "smooth",
    },
    colors: ["#ff1245", "green"],
    yaxis: {labels: {show: false}}

}
