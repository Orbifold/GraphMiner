import { DataManager } from "@graphminer/projects";

export default class DataService {
	private dataManager: DataManager;
	isInitialized: boolean = false;

	async init() {
		if (this.isInitialized) {
			return this;
		}
		this.dataManager = await DataManager.browser();
		return this;
	}

	async createProject(...projectSpecs) {
		return this.dataManager.createProject(...projectSpecs);
	}

	async getAllProjects() {
		return this.dataManager.getAllProjects();
	}
}
