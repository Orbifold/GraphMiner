const { Utils } = require("@graphminer/utils");

class Widget {
	id;
	name;
	description;

	code;
	position = null;

	constructor(name, description, code) {
		this.id = Utils.id();
		if (!Utils.isSimpleString(name)) {
			throw new Error("Should be a simple name.");
		}
		this.name = name;
		this.description = description;
		this.code = code;
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			code: this.code,
			position: this.position,
		};
	}

	static fromJSON(json) {
		const w = new Widget(json.name, json.description, json.code);
		if (json.id) {
			w.id = json.id;
		}
		return w;
	}

	clone() {
		const w = Widget.fromJSON(this.toJSON());
		w.id = Utils.id();
		return w;
	}
}

module.exports = Widget;
