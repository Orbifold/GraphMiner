const {Utils, Strings} = require("@graphminer/utils");
const {EntitySpace, LocalEntityStore} = require("@graphminer/entities");
const {NamedGraph, RandomGraph} = require("@graphminer/graphs");
const ProjectUtils = require("./projectUtils");
const Project = require("./project");
const ProjectManager = require("./projectManager");
const WidgetManager = require("./widgetManager");
const Dashboard = require("./dashboard");
const SettingsManager = require("./settingsManager");

/*
 * Manages all data of GraphMiner client by extending the EntitySpace with
 * various project-related data.
 *
 *
 * */
class DataManger {
    /**
     * Manages project info.
     * @type ProjectManager
     */
    projectManager;

    /**
     * An instance of EntitySpace to manage the knowledge graph.
     * @type {EntitySpace}
     */
    entitySpace;

    widgetManager;
    settingsManager;

    static async browser() {
        const space = await EntitySpace.browser();
        const storage = space.store.storage;
        // matters to use the same storage, seems LokiJS does not like multiple instances
        const pm = new ProjectManager(storage);
        const wm = new WidgetManager(storage);
        const sm = new SettingsManager(storage);
        return new DataManger(pm, space, wm, sm);
    }

    static async inMemory() {
        const space = await EntitySpace.inMemory();
        const storage = space.store.storage;
        // matters to use the same storage, seems LokiJS does not like multiple instances
        const pm = new ProjectManager(storage);
        return new DataManger(pm, space);
    }

    constructor(projectManager, entitySpace, widgetManager, settingsManager) {
        this.projectManager = projectManager;
        this.entitySpace = entitySpace;
        this.widgetManager = widgetManager;
        this.settingsManager = settingsManager;
    }

    async createProject(...projectSpecs) {
        await this.widgetManager.ensureTestWidget();

        const project = await this.projectManager.createProject(...projectSpecs);

        // create the db
        await this.entitySpace.createDatabase(project.databaseName);
        // switch to the new db
        await this.entitySpace.setDatabase(project.databaseName);

        const g = RandomGraph.ErdosRenyi(200, 400);
        await this.entitySpace.importGraph(g);

        return project;
    }

    async removeProject(projectId) {
        const project = await this.projectManager.getProjectById(projectId)
        if (project) {
            await this.entitySpace.removeDatabase(project.databaseName);
            await this.projectManager.removeProject(projectId)
        }
    }

    async getAllProjects() {
        return this.projectManager.getProjects();
    }

    async getProjectNames() {
        return this.projectManager.getProjectNames();
    }

    async getSpaceAsGraphJson(projectId) {
        const exists = await this.projectManager.projectIdExists(projectId);
        if (!exists) {
            return null;
        }
        const project = await this.getProjectById(projectId);
        await this.entitySpace.setDatabase(project.databaseName);
        return await this.entitySpace.exportGraphJson();
    }

    async projectNameExists(projectName) {
        return await this.projectManager.projectNameExists(projectName)
    }

    async upsertWidget(widget) {
        return this.widgetManager.upsertWidget(widget);
    }

    async getWidgetTemplateById(id) {
        return this.widgetManager.getWidgetTemplateById(id);
    }

    async getProjectById(projectId) {
        const found = this.projectManager.getProjectById(projectId);
        if (Utils.isEmpty(found)) {
            throw new Error(`Project '${projectId}' does not exist.`);
        }
        return found;
    }

    async getAllDashboards(projectId) {
        const project = await this.getProjectById(projectId);
        return project.dashboards; //strongly typed
    }

    async createDashboard(projectId, name, description, color) {
        const project = await this.getProjectById(projectId);
        const db = new Dashboard(name, description, color);
        const widget = await this.widgetManager.getWidgetTemplateById("test");
        db.widgets.push(widget.clone());
        project.dashboards.push(db);
        await this.save(project);
        return db;
    }

    async save(project) {
        if (project) {
            await this.projectManager.upsertProject(project);
        }
    }

    async upsertProject(project) {
        await this.projectManager.upsertProject(project);

    }

    /**
     *
     * @param projectId
     * @returns {Promise<Graph>}
     */
    async getGraph(projectId) {
        const project = await this.getProjectById(projectId);
        await this.entitySpace.setDatabase(project.databaseName);
        return await this.entitySpace.exportGraph();
    }

    async getWidgetTemplates() {
        return await this.widgetManager.getWidgetTemplates();
    }

    async saveAppSettings(appSettings) {
        return await this.settingsManager.saveAppSettings(appSettings)
    }

    async getAppSettings() {
        return await this.settingsManager.getAppSettings()
    }
}

module.exports = DataManger;
