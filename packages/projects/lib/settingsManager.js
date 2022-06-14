const {LocalStorage} = require("@graphminer/store");
const {Utils, Strings} = require("@graphminer/utils");
const _ = require("lodash");
const WidgetTemplate = require("./widgetTemplate");
const AppSettings = require("./appSettings");

const SettingsCollectionName = "settings";

/*
 * Manages the application settings.
 * */
class SettingsManager {
    constructor(storage) {
        this.storage = storage;
    }

    /**
     * Returns an in-memory instance of the {@link SettingsManager}.
     * @returns {Promise<SettingsManager>}
     */
    static async inMemory() {
        const storage = await LocalStorage.inMemory();
        return new SettingsManager(storage);
    }

    /**
     * Returns the current app settings.
     * @returns {Promise<AppSettings|null>}
     */
    async getAppSettings() {
        const found = await this.storage.findOne({id: "application-settings"}, SettingsCollectionName);
        if (Utils.isEmpty(found)) {
            return null;
        }
        return AppSettings.fromJSON(found);
    }

    /**
     * Saves the given app settings.
     * @param appSettings {AppSettings} The app settings to save.
     * @returns {Promise<*>}
     */
    saveAppSettings(appSettings) {
        if (Utils.isEmpty(appSettings)) {
            throw new Error(Strings.IsNil("item", "SettingsManager.save"));
        }
        if (!_.isPlainObject(appSettings)) {
            appSettings = JSON.parse(JSON.stringify(appSettings));
        }
        this.storage.upsert(appSettings, SettingsCollectionName, {id: "application-settings"});
        return appSettings;
    }
}

module.exports = SettingsManager;
