const { LocalStorage } = require("@graphminer/store");
const { Utils, Strings } = require("@graphminer/utils");
const _ = require("lodash");
const Widget = require("./widget");
const WidgetCollectionName = "widgets";

class WidgetManager {
	constructor(storage) {
		this.storage = storage;
	}

	static async inMemory() {
		const storage = await LocalStorage.inMemory();
		return new WidgetManager(storage);
	}

	async getAllWidgetNames() {
		const found = await this.storage.find({}, WidgetCollectionName);
		return found.map((w) => w.name);
	}

	async getWidgetById(id) {
		const found = await this.storage.findOne({ id }, WidgetCollectionName);
		if (Utils.isEmpty(found)) {
			return null;
		}
		return Widget.fromJSON(found);
	}

	async upsertWidget(widget) {
		if (Utils.isEmpty(widget)) {
			throw new Error(Strings.IsNil("widget", "WidgetManager.upsertWidget"));
		}
		if (!_.isPlainObject(widget)) {
			widget = JSON.parse(JSON.stringify(widget));
		}
		return this.storage.upsert(widget, WidgetCollectionName, { id: widget.id });
	}
}

module.exports = WidgetManager;
