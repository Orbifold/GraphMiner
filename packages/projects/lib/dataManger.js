const {Utils, Strings} = require("@graphminer/utils");
const {EntitySpace, LocalEntityStore} = require("@graphminer/entities");
const {NamedGraph, RandomGraph} = require("@graphminer/graphs");
const ProjectUtils = require("./projectUtils");
const Project = require("./project");
const ProjectManager = require("./projectManager");
const WidgetManager = require("./widgetManager");
const Dashboard = require("./dashboard");
const SettingsManager = require("./settingsManager");
const Widget = require("./widget");

/*
 * Manages all data of GraphMiner client by extending the EntitySpace with
 * various project-related data.
 * In the Graphminer web-app this manager is wrapped in the DataService to combine with
 * redux-store actions. This manager is used by the Pyodide context to access and change data.
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
    /**
     * Manages the widget templates.
     * @type {WidgetManager}
     */
    widgetManager;
    /**
     * Manages the settings.
     * @type {SettingsManager}
     */
    settingsManager;

    //region Instantiation
    /**
     * Returns an instance of the {@link DataManger} suitable for the browser.
     * @returns {Promise<DataManger>}
     */
    static async browser() {
        const space = await EntitySpace.browser();
        const storage = space.store.storage;
        // matters to use the same storage, seems LokiJS does not like multiple instances
        const pm = new ProjectManager(storage);
        const wm = new WidgetManager(storage);
        const sm = new SettingsManager(storage);
        return new DataManger(pm, space, wm, sm);
    }

    /**
     * Returns an in-memory instance of the {@link DataManger}.
     * @returns {Promise<DataManger>}
     */
    static async inMemory() {
        const entitySpace = await EntitySpace.inMemory();
        const storage = entitySpace.store.storage;
        // matters to use the same storage, seems LokiJS does not like multiple instances
        const projectManager = new ProjectManager(storage);
        const widgetManager = new WidgetManager(storage);
        const settingsManager = new SettingsManager(storage);
        return new DataManger(projectManager, entitySpace, widgetManager, settingsManager);
    }

    /**
     * Instantiates a new DataManager with the given sub-manager.
     * Each manager can have an independent underlying storage or see the {@link inMemory} method
     * for how to use a shared storage.
     * @param projectManager {ProjectManager} The project manager.
     * @param entitySpace {EntitySpace} The entity space.
     * @param widgetManager {WidgetManager} The widget manager.
     * @param settingsManager {SettingsManager} The settings manager.
     */
    constructor(projectManager, entitySpace, widgetManager, settingsManager) {
        this.projectManager = projectManager;
        this.entitySpace = entitySpace;
        this.widgetManager = widgetManager;
        this.settingsManager = settingsManager;
    }

    //endregion

    //region Project Management
    async createProject(...projectSpecs) {
        await this.widgetManager.ensureDummyWidget();

        const project = await this.projectManager.createProject(...projectSpecs);

        // create the db
        await this.entitySpace.createDatabase(project.databaseName);
        // switch to the new db
        await this.entitySpace.setDatabase(project.databaseName);

        const g = RandomGraph.ErdosRenyi(200, 400);
        await this.entitySpace.importGraph(g);

        return project;
    }

    async getProjectById(projectId) {
        const found = this.projectManager.getProjectById(projectId);
        if (Utils.isEmpty(found)) {
            throw new Error(`Project '${projectId}' does not exist.`);
        }
        return found;
    }

    async getAllProjects() {
        return this.projectManager.getProjects();
    }

    async getProjectNames() {
        return this.projectManager.getProjectNames();
    }

    async removeProject(projectId) {
        const project = await this.projectManager.getProjectById(projectId);
        if (project) {
            await this.entitySpace.removeDatabase(project.databaseName);
            await this.projectManager.removeProject(projectId);
        }
    }

    async projectNameExists(projectName) {
        return await this.projectManager.projectNameExists(projectName);
    }

    /**
     * Returns true if the given id is a project id.
     * @param id {string} An id.
     * @returns {Promise<boolean>}
     */
    async projectIdExists(id) {
        return await this.projectManager.projectIdExists(id);
    }

    async upsertProject(project) {
        await this.projectManager.upsertProject(project);
    }


    //endregion

    //region Widget Templates
    /**
     * Returns the name and id of all templates.
     * @returns {Promise<[{name,id,description}]>}
     */
    async getWidgetTemplates() {
        return await this.widgetManager.getWidgetTemplates();
    }

    async removeAllWidgetTemplate() {
        await this.widgetManager.removeAllWidgetTemplate()
    }

    async upsertWidgetTemplate(widget) {
        return this.widgetManager.upsertWidgetTemplate(widget);
    }

    /**
     * Loads the predefined widget templates into the collection.
     * @returns {Promise<void>}
     */
    async loadPredefinedWidgets() {
        await this.widgetManager.loadPredefinedWidgets();
    }

    async getWidgetTemplateById(id) {
        return this.widgetManager.getWidgetTemplateById(id);
    }

    async widgetTemplateIdExists(id) {
        return this.widgetManager.widgetTemplateIdExists(id);
    }


    async duplicateWidgetTemplate(templateId) {
        return await this.widgetManager.duplicateWidgetTemplate(templateId)
    }

    async removeWidgetTemplate(templateId) {
        await this.widgetManager.removeWidgetTemplate(templateId)
    }

    async addBlankWidgetTemplate() {
        return await this.widgetManager.addBlankWidgetTemplate();
    }

    //endregion

    //region Entity Space
    async getSpaceAsGraphJson(projectId) {
        const exists = await this.projectManager.projectIdExists(projectId);
        if (!exists) {
            return null;
        }
        const project = await this.getProjectById(projectId);
        await this.entitySpace.setDatabase(project.databaseName);
        return await this.entitySpace.exportGraphJson();
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


    //endregion

    //region Dashboard
    async getAllDashboards(projectId) {
        const project = await this.getProjectById(projectId);
        return project.dashboards; //strongly typed
    }

    async createDashboard(projectId, name, description, color, addTestWidget = true) {
        const project = await this.getProjectById(projectId);
        const db = new Dashboard(name, description, color, project.id);
        if (addTestWidget) {
            const testWidgetTemplate = await this.widgetManager.getWidgetTemplateById("dummy");
            const widget = Widget.fromWidgetTemplate(testWidgetTemplate, db.id, project.id);
            db.addWidget(widget);
        }
        project.dashboards.push(db);
        await this.upsertProject(project);
        return db;
    }

    //endregion

    //region App Settings
    /**
     * Saves the given app settings.
     * @param appSettings {AppSettings} The app settings to save.
     * @returns {Promise<*>}
     */
    async saveAppSettings(appSettings) {
        return await this.settingsManager.saveAppSettings(appSettings);
    }

    async getAppSettings() {
        return await this.settingsManager.getAppSettings();
    }

    //endregion
}

module.exports = DataManger;
