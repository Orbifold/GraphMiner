import {DataManager, AppSettings} from "@graphminer/projects";
import {Store} from "vuex";
import {Utils} from "@graphminer/utils";
import vuetify from "@/plugins/vuetify";

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
        let settings = await this.dataManager.getAppSettings();
        if (Utils.isEmpty(settings)) {
            settings = new AppSettings();
            await this.dataManager.saveAppSettings(settings);
        }
        this.$store.commit("ambient/setAppSettings", settings);
        vuetify.framework.theme.dark = settings.theme === "dark";
        return this;
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

    async upsertWidget(widget) {
        return this.dataManager.upsertWidget(widget);
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

    async createDashboard(projectId, name) {
        const db = await this.dataManager.createDashboard(projectId, name);
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
            const widget = widgetTemplate.clone();
            const project = await this.getActiveProject();
            project.addWidget(widget, dashboardId);
            await this.dataManager.save(project);
            await this.setActiveProject(projectId);
        }
    }

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
}
