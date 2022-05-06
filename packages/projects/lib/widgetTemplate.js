const {Utils} = require("@graphminer/utils");
const PredefinedWidgets = require("./widgetTemplates.json");
const _ = require("lodash");

/*
 * A widget template serves a starting point for an actual widget in a dashboard.
 */
class WidgetTemplate {
    id;
    name;
    description;
    code;
    /**
     * Defines how the widget code will be interpreted.
     * @type {string|null}
     */
    language = null;
    /**
     * What type of visualization will be rendered.
     * @type {string|null}
     */
    renderer = null;

    typeName = "WidgetTemplate";

    constructor(name, description, code, language = "js", renderer = "bar") {
        this.id = Utils.id();
        this.renderer = renderer;
        this.name = name;
        this.description = description;
        this.code = code;
        this.language = language;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            code: this.code,
            language: this.language,
            typeName: "WidgetTemplate",
            renderer: this.renderer
        };
    }

    static fromJSON(json) {
        const w = new WidgetTemplate(json.name, json.description, json.code, json.language, json.renderer);
        if (json.id) {
            w.id = json.id;
        }
        return w;
    }

    /**
     * Returns a blank or starter
     */
    static empty() {
        return new WidgetTemplate("New Widget Template", "Add some info about this template.", "// add your code")
    }

    clone() {
        const w = WidgetTemplate.fromJSON(this.toJSON());
        w.id = Utils.id();
        return w;
    }

    static dummyWidget() {
        const json = _.find(PredefinedWidgets, u => u.id === "dummy")
        return WidgetTemplate.fromJSON(json)
    }
}

module.exports = WidgetTemplate;
