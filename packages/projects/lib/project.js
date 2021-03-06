const {Utils, Strings} = require("@graphminer/utils");
const Dashboard = require("./dashboard");
const _ = require("lodash");

/*
 * Defines a GraphMiner project.
 * */
class Project {
    /**
     * The unique id of this project.
     * @type string
     */
    id;

    /**
     * The name of this project.
     * @type string
     */
    name;

    /**
     * A description of the project.
     * @type {string}
     */
    description = null;

    /**
     * When this project was created.
     * @type  number
     */
    timestamp;

    /**
     * The dashboard collection in this project.
     * @type {Dashboard[]}
     */
    dashboards = [];

    /**
     * The name of the database corresponds to the collection used in the storage.
     * @type {string|null}
     */
    databaseName = null;

    /**
     * The image URL used in the UI to brighten things up.
     * @type {string|null}
     */
    image = null;

    /**
     * Whether the entity space enforces an underlying schema.
     * @type {boolean}
     */
    hasSchema = false;

    constructor(name = null, description = null, image = null, hasSchema = false) {
        this.id = Utils.id();
        this.name = name;
        this.description = description;
        this.timestamp = Date.now();
        this.dashboards = [];
        this.databaseName = "DB" + Utils.randomId();
        this.image = image || "/connected.png";
        this.hasSchema = hasSchema;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            timestamp: this.timestamp,
            dashboards: this.dashboards.map((d) => d.toJSON()),
            databaseName: this.databaseName,
            image: this.image,
            hasSchema: this.hasSchema,
        };
    }

    static fromJSON(json) {
        const p = new Project(json.name, json.description);
        p.timestamp = json.timestamp;
        p.image = json.image;
        p.hasSchema = json.hasSchema;
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
            widget.layout = this.getNewCoordinates(dashboard);
            console.log(widget.layout);
            dashboard.widgets.push(widget);
        }
        return this;
    }

    getNewCoordinates(dashboard) {
        if (dashboard.widgets.length === 0) {
            return {
                x: 0,
                y: 0,
                index: 0,
                w: 6,
                h: 6
            }
        }
        const yMax = _.max(dashboard.widgets.map((w) => w.layout.y));
        const h = _.max(dashboard.widgets.filter((w) => w.layout.y === yMax).map((w) => w.layout.h));
        const maxIndex = _.max(dashboard.widgets.map(w => w.layout.index));
        return {
            x: 0,
            y: yMax + h,
            index: maxIndex + 1,
            w: 6,
            h: 6
        };
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
            // this.indexWidgets(db);
        }
        return this;
    }

    upsertWidget(widget) {
        const dashboardId = widget.dashboardId;
        const projectId = widget.projectId;
        if (Utils.isEmpty(dashboardId)) {
            throw new Error("Missing widget dashboard id.");
        }
        if (Utils.isEmpty(projectId)) {
            throw new Error("Missing widget project id.");
        }
        let db = this.getDashboardById(dashboardId);
        if (Utils.isEmpty(db)) {
            throw new Error("Dashboard does not exist.");
        }
        db.upsertWidget(widget);
    }

    addDashboard(spec) {
        if (_.isString(spec)) {
            const found = this.getDashboardByName(spec);
            if (found) {
                throw new Error(`There already is a dashboard with the name '${spec}'.`);
            }
            const db = new Dashboard(spec);
            this.dashboards.push(db);
            return this;
        } else if (spec instanceof Dashboard) {
            let found = this.getDashboardById(spec.id);
            if (found) {
                throw new Error(`There is already a dashboard with id '${spec.id}'.`);
            }
            this.dashboards.push(spec);
        } else {
            throw new Error(Strings.ShoudBeType("spec", "string or Dashboard", "Project.addDashboard"));
        }
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
