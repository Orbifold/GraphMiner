const {Utils, Strings} = require("@graphminer/utils");
const Dashboard = require("./dashboard");
const _ = require("lodash");

/*
 * Defines a GraphMiner project.
 * */
class Project {
    name;
    description = null;
    timestamp;
    dashboards = [];
    /**
     *
     * @type {string|null}
     */
    databaseName = null;
    image = null;

    constructor(name = null, description = null, image = null) {
        this.id = Utils.id();
        this.name = name;
        this.description = description;
        this.timestamp = Date.now();
        this.dashboards = [];
        this.databaseName = "DB" + Utils.randomId();
        this.image = image || "/connected.png"
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            timestamp: this.timestamp,
            dashboards: this.dashboards.map((d) => d.toJSON()),
            databaseName: this.databaseName,
            image: this.image
        };
    }

    static fromJSON(json) {
        const p = new Project(json.name, json.description);
        p.timestamp = json.timestamp;
        p.image = json.image;
        if (Utils.isDefined(json.id)) {
            p.id = json.id;
        }
        if (Utils.isDefined(json.dashboards)) {
            p.dashboards = json.dashboards.map((d) => Dashboard.fromJSON(d));
        }
        if (Utils.isDefined(json.databaseName)) {
            p.databaseName = json.databaseName;
        }

        return p;
    }

    addWidget(widget, dashboardId) {
        if (Utils.isEmpty(widget)) {
            throw new Error(Strings.IsNil("widget", "Dashboard.addWidget"));
        }
        if (Utils.isEmpty(dashboardId)) {
            throw new Error(Strings.IsNil("dashboardId", "Dashboard.addWidget"));
        }

        const dashboard = _.find(this.dashboards, (d) => d.id === dashboardId);
        if (dashboard) {
            dashboard.widgets.push(widget);
        }
        return this;
    }

    getDashboardById(dashboardId) {
        if (Utils.isEmpty(dashboardId)) {
            throw new Error(Strings.IsNil("dashboardId", "Dashboard.getDashboardById"));
        }
        return _.find(this.dashboards, (d) => d.id === dashboardId) || null;
    }

    getDashboardByName(name) {
        if (Utils.isEmpty(name)) {
            throw new Error(Strings.IsNil("dashboardId", "Dashboard.getDashboardById"));
        }
        name = name.toString().trim().toLowerCase();
        return _.find(this.dashboards, (d) => d.name.toLowerCase() === name) || null;
    }

    removeWidget(widgetId, dashboardId) {
        if (Utils.isEmpty(widgetId)) {
            throw new Error(Strings.IsNil("widgetId", "Dashboard.removeWidget"));
        }
        if (Utils.isEmpty(dashboardId)) {
            throw new Error(Strings.IsNil("dashboardId", "Dashboard.removeWidget"));
        }
        const db = this.getDashboardById(dashboardId);
        if (db) {
            _.remove(db.widgets, (w) => w.id === widgetId);
        }
        return this;
    }

    addDashboard(name) {
        const found = this.getDashboardByName(name);
        if (found) {
            throw new Error(`There already is a dashboard with the name '${name}'.`);
        }
        const db = new Dashboard(name);
        this.dashboards.push(db);
        return this;
    }

    removeDashboard(dashboardId) {
        const found = this.getDashboardById(dashboardId);
        if (found) {
            _.remove(this.dashboards, (d) => d.id === dashboardId);
        }
        return this;
    }
}

module.exports = Project;
