import {DataManager} from "@graphminer/projects";
import {Store} from "vuex";

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
        return this;
    }

    async createProject(...projectSpecs) {
        return this.dataManager.createProject(...projectSpecs);
    }

    async getAllProjects() {
        return this.dataManager.getAllProjects();
    }

    async getAllDashboards() {
        return this.dataManager.getAllDashboards();
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

    async getSpaceAsGraphJson() {
        return this.dataManager.getSpaceAsGraphJson();
    }

    async upsertWidget(widget) {
        return this.dataManager.upsertWidget(widget);
    }

    async getWidgetById(id) {
        return this.dataManager.getWidgetById(id);
    }

    async createDashboard(projectId, name) {
        const db = await this.dataManager.createDashboard(projectId, name);
        // update the store
        await this.setActiveProject(projectId);
        return db;
    }
}
