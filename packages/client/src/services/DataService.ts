import {DataManager, AppSettings, Widget} from "@graphminer/projects";
import {Store} from "vuex";
import {Utils} from "@graphminer/utils";
import vuetify from "@/plugins/vuetify";

/*
* Global data service accessible via '$dataService' in Vue pages.
* These are business methods which can combine the redux store, the local storage and so on.
* If the data method only involves the storage it just passes the call to the DataManager.
* */
export default class DataService {
    /**
     *
     * @type {DataManager}
     */
    private dataManager: DataManager;
    isInitialized: boolean = false;
    private $store: Store<any>;

    async init($store) {
        if (this.isInitialized) {
            return this;
        }
        this.dataManager = await DataManager.browser();
        this.$store = $store;
        await this.loadAppSettings();
        return this;
    }

    /**
     * Loads the saved app settings or assigns the default.
     * @returns {Promise<void>}
     */
    async loadAppSettings() {
        let settings = await this.dataManager.getAppSettings();
        if (Utils.isEmpty(settings)) {
            settings = new AppSettings();
            await this.dataManager.saveAppSettings(settings);
            await this.dataManager.loadPredefinedWidgets();
        }
        this.$store.commit("ambient/setAppSettings", settings);
        vuetify.framework.theme.dark = settings.theme === "dark";
    }

    async resetWidgetTemplates() {

        await this.dataManager.removeAllWidgetTemplate();
        await this.dataManager.loadPredefinedWidgets();
    }

    async createProject(...projectSpecs) {
        return this.dataManager.createProject(...projectSpecs);
    }

    async removeProject(projectId) {
        return this.dataManager.removeProject(projectId);
    }

    async getAllProjects() {
        return this.dataManager.getAllProjects();
    }

    async getProjectNames() {
        return this.dataManager.getProjectNames();
    }

    async getAllDashboards() {
        return this.dataManager.getAllDashboards();
    }

    async getProject(projectId) {
        return this.dataManager.getProjectById(projectId);
    }

    async projectNameExists(projectName) {
        return this.dataManager.projectNameExists(projectName);
    }

    /**
     * The one and only place to switch project.
     * @param projectId
     * @returns {Promise<void>}
     */
    async setActiveProject(projectId) {
        const project = await this.dataManager.getProjectById(projectId);
        window["project"] = project;

        this.$store.commit("ambient/setProject", project);
    }

    async getActiveProject() {
        return this.$store.state.ambient.project;
    }

    async getSpaceAsGraphJson(projectId) {
        return this.dataManager.getSpaceAsGraphJson(projectId);
    }

    async upsertWidgetTemplate(widgetTemplate) {
        return this.dataManager.upsertWidgetTemplate(widgetTemplate);
    }

    async upsertProject(project) {
        if (this.$store.state.ambient.project?.id === project.id) {
            this.$store.commit("ambient/setProject", project);
        }
        return this.dataManager.upsertProject(project);
    }

    async getWidgetTemplateById(id) {
        return this.dataManager.getWidgetTemplateById(id);
    }

    async duplicateWidgetTemplate(templateId) {
        await this.dataManager.duplicateWidgetTemplate(templateId);
    }

    async addBlankWidgetTemplate() {
        return await this.dataManager.addBlankWidgetTemplate();
    }

    async createDashboard(projectId, name, description, color) {
        const db = await this.dataManager.createDashboard(projectId, name, description, color);
        // update the store
        await this.setActiveProject(projectId);
        return db;
    }

    /**
     *
     * @param projectId
     * @returns {Promise<Graph>}
     */
    async getGraph(projectId) {
        return await this.dataManager.getGraph(projectId);
    }

    async addWidget(projectId, dashboardId, widgetTemplateId) {
        const widgetTemplate = await this.getWidgetTemplateById(widgetTemplateId);

        if (widgetTemplate) {
            const widget = Widget.fromWidgetTemplate(widgetTemplate, dashboardId, projectId);
            const project = await this.getActiveProject();
            project.addWidget(widget, dashboardId);
            await this.dataManager.upsertProject(project);
            await this.setActiveProject(projectId);
        } else {
            throw new Error(`Could not find widget template with id '${widgetTemplateId}'.`);
        }
    }

    /**
     * Returns the name and id of all templates.
     * @returns {Promise<{name,id,description}>}
     */
    async getWidgetTemplates() {
        return await this.dataManager.getWidgetTemplates();
    }

    getAppSettings() {
        return this.$store.state.ambient.appSettings;
    }

    async saveAppSettings(appSettings) {
        this.$store.commit("ambient/setAppSettings", appSettings);
        await this.dataManager.saveAppSettings(appSettings);
    }

    async removeWidgetTemplate(templateId) {
        await this.dataManager.removeWidgetTemplate(templateId);
    }
}
