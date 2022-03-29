const { Utils, Strings } = require("@graphminer/utils");
const { EntitySpace, LocalEntityStore } = require("@graphminer/entities");
const ProjectUtils = require("./projectUtils");
const Project = require("./project");
const ProjectManager = require("./projectManager");

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
	 */
	entitySpace;

	static async browser() {
		const space = await EntitySpace.browser();
		const storage = space.store.storage;
		// matters to use the same storage, seems LokiJS does not like multiple instances
		const pm = new ProjectManager(storage);
		return new DataManger(pm, space);
	}

	static async inMemory() {
		const space = await EntitySpace.inMemory();
		const storage = space.store.storage;
		// matters to use the same storage, seems LokiJS does not like multiple instances
		const pm = new ProjectManager(storage);
		return new DataManger(pm, space);
	}

	constructor(projectManager, entitySpace) {
		this.projectManager = projectManager;
		this.entitySpace = entitySpace;
	}

	async createProject(...projectSpecs) {
		return this.projectManager.createProject(...projectSpecs);
	}

	async getAllProjects() {
		return this.projectManager.getProjects();
	}
}

module.exports = DataManger;
