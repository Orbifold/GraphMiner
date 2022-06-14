/*
 * Application settings.
 * */
class AppSettings {

    theme = "light"

    get id() {
        return "application-settings"
    }

    toJSON() {
        return {
            id: this.id,
            theme: this.theme
        }
    }

    static fromJSON(json) {
        const s = new AppSettings()
        s.theme = json.theme;
        return s
    }
}

module.exports = AppSettings;
