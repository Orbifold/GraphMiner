const { LocalStorage } = require("@graphminer/store");
const { Utils, Strings } = require("@graphminer/utils");
const _ = require("lodash");
const WidgetTemplate = require("./widgetTemplate");
const WidgetCollectionName = "widgets";

class WidgetManager {
	constructor(storage) {
		this.storage = storage;
	}

	static async inMemory() {
		const storage = await LocalStorage.inMemory();
		return new WidgetManager(storage);
	}

	/**
	 * Returns the name and id of all templates.
	 * @returns {Promise<{name,id}>}
	 */
	async getWidgetTemplates() {
		const found = await this.storage.find({}, WidgetCollectionName);
		return found.map((w) => {
			return { id: w.id, name: w.name };
		});
	}

	async getWidgetTemplateById(id) {
		const found = await this.storage.findOne({ id }, WidgetCollectionName);
		if (Utils.isEmpty(found)) {
			return null;
		}
		return WidgetTemplate.fromJSON(found);
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

	async ensureTestWidget() {
		const found = await this.getWidgetTemplateById("test");
		if (Utils.isEmpty(found)) {
			await this.upsertWidget(WidgetTemplate.testWidget());
		}
	}
}

module.exports = WidgetManager;
