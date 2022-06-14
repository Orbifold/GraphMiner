const {LocalStorage} = require("@graphminer/store");
const {Utils, Strings} = require("@graphminer/utils");
const _ = require("lodash");
const WidgetTemplate = require("./widgetTemplate");
const WidgetCollectionName = "widgets";
const PredefinedWidgets = require("./widgetTemplates.json");

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
     * @returns {Promise<[{name,id,description}]>}
     */
    async getWidgetTemplates() {
        const found = await this.storage.find({}, WidgetCollectionName);
        return found.map((w) => {
            return {id: w.id, name: w.name, description: w.description};
        });
    }

    async getWidgetTemplateById(id) {
        const found = await this.storage.findOne({id}, WidgetCollectionName);
        if (Utils.isEmpty(found)) {
            return null;
        }
        return WidgetTemplate.fromJSON(found);
    }

    async widgetTemplateIdExists(id) {
        const found = await this.getWidgetTemplateById(id)
        return Utils.isDefined(found)
    }

    async upsertWidgetTemplate(widgetTemplate) {
        if (Utils.isEmpty(widgetTemplate)) {
            throw new Error(Strings.IsNil("widget", "WidgetManager.upsertWidget"));
        }
        if (!_.isPlainObject(widgetTemplate)) {
            widgetTemplate = JSON.parse(JSON.stringify(widgetTemplate));
        }
        await this.storage.upsert(widgetTemplate, WidgetCollectionName, {id: widgetTemplate.id});
        return widgetTemplate
    }

    async removeAllWidgetTemplate() {
        await this.storage.removeWhere({}, WidgetCollectionName)
    }

    async addBlankWidgetTemplate() {
        const template = WidgetTemplate.empty()
        await this.upsertWidgetTemplate(template)
        return template;
    }

    async removeWidgetTemplate(templateId) {
        await this.storage.removeWhere({id: templateId}, WidgetCollectionName)
    }

    async duplicateWidgetTemplate(templateId) {
        const found = await this.getWidgetTemplateById(templateId)
        if (found) {
            found.id = Utils.id()
            found.name = this.duplicateName(found.name)
            await this.upsertWidgetTemplate(found);
            return found
        }
        return null;
    }

    /**
     * If the name is something like 'Item [3]' this will return 'Item [4]'.
     * If there is no number in square brackets '[2]' will be append to the name.
     * @param s
     * @returns {string|*}
     */
    duplicateName(s) {
        if (/\[(\d+)\]/gi.test(s)) {
            const f = Array.from(s.matchAll(/\[(\d+)\]/gi))//?
            s = s.replace(/\[\d+\]/gi, `[${parseInt(f[0][1]) + 1}]`)
            return s
        } else {
            return `${s} [2]`
        }
    }

    async ensureDummyWidget() {
        const found = await this.getWidgetTemplateById("dummy");
        if (Utils.isEmpty(found)) {
            await this.upsertWidgetTemplate(WidgetTemplate.dummyWidget());
        }
    }

    /**
     * Loads the predefined widget templates into the collection.
     * @returns {Promise<void>}
     */
    async loadPredefinedWidgets() {
        for (const predefinedWidget of PredefinedWidgets) {
            const widgetTemplate = WidgetTemplate.fromJSON(predefinedWidget);
            await this.upsertWidgetTemplate(widgetTemplate);
        }
    }
}

module.exports = WidgetManager;
