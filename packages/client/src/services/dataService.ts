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
		this.$store.commit("ambient/setProjectId", projectId);
		this.dataManager.setActiveProject(projectId);
	}

	async getActiveProject() {
		return this.dataManager.activeProject;
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

	async createDashboard(name) {
		return await this.dataManager.createDashboard(name);
	}
}
