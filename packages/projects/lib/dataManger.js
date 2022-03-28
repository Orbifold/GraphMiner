const { Utils, Strings } = require("@graphminer/utils");
const { EntitySpace } = require("@graphminer/entities");
const ProjectUtils = require("./projectUtils");
const Project = require("./project");
const LocalProjectManager = require("./projectManager");

/*
 * Manages all data of GraphMiner client by extending the EntitySpace with
 * various project-related data.
 *
 *
 * */
class DataManger {
	/**
	 * Manages project info.
	 */
	projectManager;

	/**
	 * An instance of EntitySpace to manage the knowledge graph.
	 */
	entitySpace;

	static async inMemory(projectName = null) {
		const projectManager = await LocalProjectManager.inMemory();
		const entitySpace = Utils.isEmpty(projectName) ? null : await EntitySpace.inMemory(projectName);
		return new DataManger(projectManager, entitySpace);
	}

	constructor(projectManager, entitySpace) {
		this.projectManager = projectManager;
		this.entitySpace = entitySpace;
	}
}

module.exports = DataManger;
