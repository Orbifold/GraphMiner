const { Utils, Strings } = require("@graphminer/utils");
const { EntitySpace, LocalEntityStore } = require("@graphminer/entities");
const { NamedGraph, RandomGraph } = require("@graphminer/graphs");
const ProjectUtils = require("./projectUtils");
const Project = require("./project");
const ProjectManager = require("./projectManager");
const WidgetManager = require("./widgetManager");
const Dashboard = require("./dashboard");

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

	/**
	 *
	 * @type {Project}
	 */
	activeProject = null;
	widgetManager;

	static async browser() {
		const space = await EntitySpace.browser();
		const storage = space.store.storage;
		// matters to use the same storage, seems LokiJS does not like multiple instances
		const pm = new ProjectManager(storage);
		const wm = new WidgetManager(storage);
		return new DataManger(pm, space, wm);
	}

	static async inMemory() {
		const space = await EntitySpace.inMemory();
		const storage = space.store.storage;
		// matters to use the same storage, seems LokiJS does not like multiple instances
		const pm = new ProjectManager(storage);
		return new DataManger(pm, space);
	}

	constructor(projectManager, entitySpace, widgetManager) {
		this.projectManager = projectManager;
		this.entitySpace = entitySpace;
		this.widgetManager = widgetManager;
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

	async upsertWidget(widget) {
		return this.widgetManager.upsertWidget(widget);
	}

	async getWidgetById(id) {
		return this.widgetManager.getWidgetById(id);
	}

	async getAllDashboards() {
		this.ensureActiveProject();
		return this.activeProject.dashboards || [];
	}

	ensureActiveProject() {
		if (Utils.isEmpty(this.activeProject)) {
			throw new Error("No active project.");
		}
	}

	async createDashboard(name) {
		this.ensureActiveProject();
		const db = new Dashboard(name);
		this.activeProject.dashboards.push(db);
		await this.save();
		return db;
	}

	async save() {
		if (this.activeProject) {
			await this.projectManager.upsertProject(this.activeProject);
		}
	}
}

module.exports = DataManger;
