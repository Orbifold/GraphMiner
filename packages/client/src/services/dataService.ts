import { DataManager } from "@graphminer/projects";
import { Store } from "vuex";

export default class DataService {
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

	/**
	 * The one and only place to switch project.
	 * @param projectId
	 * @returns {Promise<void>}
	 */
	async setActiveProject(projectId) {
		this.$store.commit("ambient/setProjectId", projectId);
		this.dataManager.setActiveProject(projectId);
	}

	async getSpaceAsGraphJson() {
		return this.dataManager.getSpaceAsGraphJson();
	}
}
