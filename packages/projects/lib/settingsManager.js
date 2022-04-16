const {LocalStorage} = require("@graphminer/store");
const {Utils, Strings} = require("@graphminer/utils");
const _ = require("lodash");
const Widget = require("./widget");
const AppSettings = require("./appSettings");

const SettingsCollectionName = "settings";

class SettingsManager {
    constructor(storage) {
        this.storage = storage;
    }

    static async inMemory() {
        const storage = await LocalStorage.inMemory();
        return new SettingsManager(storage);
    }


    async getAppSettings() {
        const found = await this.storage.findOne({id: "application-settings"}, SettingsCollectionName);
        if (Utils.isEmpty(found)) {
            return null;
        }
        return AppSettings.fromJSON(found);
    }

    saveAppSettings(appSettings) {
        if (Utils.isEmpty(appSettings)) {
            throw new Error(Strings.IsNil("item", "SettingsManager.save"));
        }
        if (!_.isPlainObject(appSettings)) {
            appSettings = JSON.parse(JSON.stringify(appSettings));
        }
        return this.storage.upsert(appSettings, SettingsCollectionName, {id: "application-settings"});
    }


}

module.exports = SettingsManager;
