const {Utils, Strings} = require("@graphminer/utils");
const {LocalStorage} = require("@graphminer/store");
const Project = require("./project");
const ProjectUtils = require("./projectUtils");
const _ = require("lodash");
const Dashboard = require("./dashboard");
const Widget = require("./widget");
const {WidgetTemplate} = require("./index");

/*
 * Manages all the projects in the store.
 * */
class ProjectManager {
    static async inMemory() {
        const storage = await LocalStorage.inMemory();
        return new ProjectManager(storage);
    }

    get ProjectsCollectionName() {
        return "projects";
    }

    constructor(storage) {
        this.storage = storage;
    }

    /**
     * Returns all projects
     * @returns {Promise<Project[]>}
     */
    async getProjects() {
        const found = await this.storage.find({}, this.ProjectsCollectionName);
        if (Utils.isEmpty(found)) {
            return [];
        }
        return found.map((p) => Project.fromJSON(p));
    }

    /**
     * Creates a new project.
     * @param projectSpecs {*} Can be just a name or a Project instance or a name followed by a description.
     * @returns {Promise<Project|*>}
     */
    async createProject(...projectSpecs) {
        const project = ProjectUtils.getProjectFromSpecs(...projectSpecs);
        if (Utils.isUndefined(project)) {
            throw new Error("Don't know how to turn the given argument into a project.");
        }
        if (await this.projectIdExists(project.id)) {
            throw new Error(`A project with id '${project.id}' already exists.  Use 'upsertProject' to update an existing one.`);
        }
        if (await this.projectNameExists(project.name)) {
            throw new Error(`A project with name '${project.name}' already exists. Use 'upsertProject' to update an existing one.`);
        }
        await this.storage.insert(project.toJSON(), this.ProjectsCollectionName);
        return project;
    }

    /**
     * Returns the project with the specified id.
     * @param id {string} An id.
     * @returns {Promise<null|Project>}
     */
    async getProjectById(id) {
        if (Utils.isEmpty(id)) {
            throw new Error(Strings.IsNil("id", "DataManager.getProjectById"));
        }
        const found = await this.storage.findOne({id}, this.ProjectsCollectionName);
        if (found) {
            return Project.fromJSON(found);
        }
        return null;
    }

    async getProjectByName(name) {
        if (Utils.isEmpty(name)) {
            throw new Error(Strings.IsNil("name", "DataManager.getProjectByName"));
        }
        const found = await this.storage.findOne({name}, this.ProjectsCollectionName);
        if (found) {
            return Project.fromJSON(found);
        }
        return null;
    }

    async getProjectByDatabaseName(dbName) {
        if (Utils.isEmpty(dbName)) {
            throw new Error(Strings.IsNil("dbName", "DataManager.getProjectByDatabaseName"));
        }
        const found = await this.storage.findOne({databaseName: dbName}, this.ProjectsCollectionName);
        if (found) {
            return Project.fromJSON(found);
        }
        return null;
    }

    async removeProject(projectId) {
        if (Utils.isEmpty(projectId)) {
            throw new Error(Strings.IsNil("projectId", "DataManager.removeProject"));
        }
        await this.storage.removeWhere({id: projectId}, this.ProjectsCollectionName);
    }

    async upsertProject(...projectSpecs) {
        const project = ProjectUtils.getProjectFromSpecs(...projectSpecs);
        if (Utils.isUndefined(project)) {
            throw new Error("Don't know how to turn the given argument into a project.");
        }
        await this.storage.upsert(project.toJSON(), this.ProjectsCollectionName, {id: project.id});
        return project;
    }

    async projectIdExists(projectId) {
        if (Utils.isEmpty(projectId)) {
            throw new Error(Strings.IsNil("projectId", "DataManager.projectIdExists"));
        }
        const found = await this.storage.findOne({id: projectId}, this.ProjectsCollectionName);
        return Utils.isDefined(found);
    }

    async projectNameExists(projectName) {
        if (Utils.isEmpty(projectName)) {
            throw new Error(Strings.IsNil("projectName", "DataManager.projectNameExists"));
        }
        const found = await this.storage.findOne({name: {$regex: [projectName, "i"]}}, this.ProjectsCollectionName);
        return Utils.isDefined(found);
    }

    async getProjectNames() {
        const found = await this.storage.find({}, this.ProjectsCollectionName);
        return found.map((p) => p.name);
    }

    async getAllDashboards(projectId) {
        const p = await this.getProjectById(projectId);
        if (Utils.isEmpty(p)) {
            return [];
        }
        return p.dashboards;
    }

    async getDashboardById(projectId, dashboardId) {
        const p = await this.getProjectById(projectId);
        if (p) {
            return _.find(p.dashboards, (db) => db.id === dashboardId) || null;
        }
        return null;
    }

    async getAllWidgets(projectId, dashboardId) {
        const db = await this.getDashboardById(projectId, dashboardId);
        if (db) {
            return db.widgets;
        }
        return [];
    }

    /**
     *
     * @param db {Dashboard|string}
     * @param projectId
     * @param addTestWidget
     * @returns {Promise<void>}
     */
    async addDashboard(db, projectId) {
        const p = await this.getProjectById(projectId);
        if (p) {
            let found, dashboard;
            if (_.isString(db)) {
                found = p.getDashboardByName(db);
                if (found) {
                    throw new Error(`There already is a dashboard with the name '${db}'.`);
                }
                dashboard = new Dashboard(db);
            } else if (db instanceof Dashboard) {
                found = p.getDashboardById(db.id);
                if (found) {
                    throw new Error("There already is a dashboard with the specified id.");
                }
                found = p.getDashboardByName(db.name);
                if (found) {
                    throw new Error(`There already is a dashboard with the name '${db.name}'.`);
                }
                dashboard = db;
            } else {
                throw new Error(Strings.ShoudBeType("addDashboard", "string or Dashboard", "ProjectManager.addDashboard"));
            }

            p.dashboards.push(dashboard);
            await this.upsertProject(p);
            return dashboard;
        } else {
            throw new Error(`There is no project with id '${projectId}'.`);
        }
    }

    async upsertDashboard(db, projectId) {
        const p = await this.getProjectById(projectId);
        if (p) {
            let found = p.getDashboardById(db.id);
            if (found) {
                _.remove(p.dashboards, (b) => b.id === db.id);
            }
            p.dashboards.push(db);
            await this.upsertProject(p);
        } else {
            throw new Error(`There is no project with id '${projectId}'.`);
        }
    }

    async removeDashboard(projectId, dashboardId) {
        const p = await this.getProjectById(projectId);
        if (p) {
            p.removeDashboard(dashboardId);
            await this.upsertProject(p);
        } else {
            throw new Error(`There is no project with id '${projectId}'.`);
        }
    }

    async addWidget(widget, projectId, dashboardId) {
        if (!(widget instanceof WidgetTemplate)) {
            throw new Error(Strings.ShoudBeType("widget", "Widget", "ProjectManager.addWidget"));
        }
        const p = await this.getProjectById(projectId);
        if (p) {
            const db = p.getDashboardById(dashboardId);
            if (db) {
                let found = db.getWidgetById(widget.id);
                if (found) {
                    throw new Error("There already is a widget with the specified id.");
                }
                found = db.getWidgetByName(widget.name);
                if (found) {
                    throw new Error("There already is a widget with the specified name.");
                }
                db.widgets.push(widget);
            } else {
                throw new Error(`There is no dashboard with id '${dashboardId}'.`);
            }
            await this.upsertProject(p);
        } else {
            throw new Error(`There is no project with id '${projectId}'.`);
        }
    }

    async upsertWidget(widget, projectId, dashboardId) {
        const p = await this.getProjectById(projectId);
        if (p) {
            const db = p.getDashboardById(dashboardId);
            if (db) {
                db.removeWidgetById(widget.id);
                db.widgets.push(widget);
            } else {
                throw new Error(`There is no dashboard with id '${dashboardId}'.`);
            }
            await this.upsertProject(p);
        } else {
            throw new Error(`There is no project with id '${projectId}'.`);
        }
    }

    async removeWidget(widgetId, projectId, dashboardId) {
        const p = await this.getProjectById(projectId);
        if (p) {
            const db = p.getDashboardById(dashboardId);
            if (db) {
                db.removeWidgetById(widgetId);
            } else {
                throw new Error(`There is no dashboard with id '${dashboardId}'.`);
            }
            await this.upsertProject(p);
        } else {
            throw new Error(`There is no project with id '${projectId}'.`);
        }
    }

    async getWidgetById(widgetId, projectId, dashboardId) {
        const p = await this.getProjectById(projectId);
        if (p) {
            const db = p.getDashboardById(dashboardId);
            if (db) {
                return _.find(db.widgets, (w) => w.id === widgetId) || null;
            } else {
                throw new Error(`There is no dashboard with id '${dashboardId}'.`);
            }
        } else {
            throw new Error(`There is no project with id '${projectId}'.`);
        }
    }

    async getDashboardByName(name, projectId) {
        if (Utils.isEmpty(name)) {
            throw new Error(Strings.IsNil("name", "ProjectManager.getDashboardByName"));
        }
        const all = await this.getAllDashboards(projectId);
        return _.find(all, (db) => db.name === name) || null;
    }
}

module.exports = ProjectManager;
