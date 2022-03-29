const {Utils, Strings} = require("@graphminer/utils");
const {EntitySpace, LocalEntityStore} = require("@graphminer/entities");
const ProjectUtils = require("./projectUtils");
const Project = require("./project");
const LocalProjectManager = require("./localProjectManager");

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


	static async browser() {
		const localEntityStore = LocalEntityStore.browser()
	}

	constructor(projectManager, entitySpace) {
		this.projectManager = projectManager;
		this.entitySpace = entitySpace;
	}
}

module.exports = DataManger;
