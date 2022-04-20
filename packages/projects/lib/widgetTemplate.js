const { Utils } = require("@graphminer/utils");

/*
 * A widget template serves a starting point for an actual widget in a dashboard.
 */
class WidgetTemplate {
	id;
	name;
	description;
	code;
	type = null;
	typeName = "WidgetTemplate";

	constructor(name, description, code, type = "js") {
		this.id = Utils.id();
		// if (!Utils.isSimpleString(name)) {
		// 	throw new Error("Should be a simple name.");
		// }
		this.name = name;
		this.description = description;
		this.code = code;
		this.type = type;
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			code: this.code,
			type: this.type,
			typeName: "WidgetTemplate",
		};
	}

	static fromJSON(json) {
		const w = new WidgetTemplate(json.name, json.description, json.code, json.type);
		if (json.id) {
			w.id = json.id;
		}
		return w;
	}

	clone() {
		const w = WidgetTemplate.fromJSON(this.toJSON());
		w.id = Utils.id();
		return w;
	}

	static testWidget() {
		const code = `
			this.data = this.sampleData();
			this.options = this.sampleOptions();
		`;
		const w = new WidgetTemplate("test", "Sample widget", code, "js");
		w.id = "test";
		return w;
	}
}

module.exports = WidgetTemplate;
