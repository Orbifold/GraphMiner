const { Utils, Strings } = require("@graphminer/utils");
const { EntitySpace, LocalEntityStore } = require("@graphminer/entities");
const { NamedGraph, RandomGraph } = require("@graphminer/graphs");
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

	activeProject = null;

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

	async setActiveProject(projectId) {
		if (Utils.isEmpty(projectId)) {
			this.entitySpace.database = null;
			this.activeProject = null;
			return null;
		} else {
			const exists = await this.projectManager.projectIdExists(projectId);
			if (!exists) {
				throw new Error(`Project '${projectId}' does not exist.`);
			}
			const p = await this.projectManager.getProjectById(projectId);
			this.activeProject = p;
			await this.entitySpace.setDatabase(p.name);
			return p;
		}
	}

	async createProject(...projectSpecs) {
		const pr = await this.projectManager.createProject(...projectSpecs);

		// create the db
		await this.entitySpace.createDatabase(pr.name);

		// temporarily switch to that db to import data
		const db = this.entitySpace.database;
		await this.entitySpace.setDatabase(pr.name);

		const g = RandomGraph.ErdosRenyi(200, 400);
		await this.entitySpace.importGraph(g);
		// set back
		await this.entitySpace.setDatabase(db);
		return pr;
	}

	async getAllProjects() {
		return this.projectManager.getProjects();
	}

	async getSpaceAsGraphJson() {
		const exists = await this.projectManager.projectIdExists(this.activeProject.id);
		if (!exists) {
			return null;
		}
		return await this.entitySpace.exportGraphJson();
	}
}

module.exports = DataManger;
