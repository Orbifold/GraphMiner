const { Utils, Strings } = require("@graphminer/utils");
const { LocalStorage } = require("@graphminer/store");
const Project = require("./project");
const ProjectUtils = require("./projectUtils");

class ProjectManager {
	static async inMemory() {
		const storage = await LocalStorage.inMemory();
		return new ProjectManager(storage);
	}

	get ProjectsCollectionName() {
		return "projects";
	}

	constructor(storage) {
		this.storage = storage;
	}

	async getProjects() {
		const found = await this.storage.find({}, this.ProjectsCollectionName);
		if (Utils.isEmpty(found)) {
			return [];
		}
		return found.map((p) => Project.fromJSON(p));
	}

	async createProject(...projectSpecs) {
		const project = ProjectUtils.getProjectFromSpecs(...projectSpecs);
		if (Utils.isUndefined(project)) {
			throw new Error("Don't know how to turn the given argument into a project.");
		}
		if (await this.projectIdExists(project.id)) {
			throw new Error(`A project with id '${project.id}' already exists.`);
		}
		await this.storage.insert(project.toJSON(), this.ProjectsCollectionName);
		return project;
	}

	async getProjectById(id) {
		if (Utils.isEmpty(id)) {
			throw new Error(Strings.IsNil("id", "DataManager.getProjectById"));
		}
		const found = await this.storage.findOne({ id }, this.ProjectsCollectionName);
		if (found) {
			return Project.fromJSON(found);
		}
		return null;
	}

	async removeProject(id) {
		if (Utils.isEmpty(id)) {
			throw new Error(Strings.IsNil("id", "DataManager.removeProject"));
		}
		await this.storage.removeWhere({ id }, this.ProjectsCollectionName);
	}

	async upsertProject(...projectSpecs) {
		const project = ProjectUtils.getProjectFromSpecs(...projectSpecs);
		if (Utils.isUndefined(project)) {
			throw new Error("Don't know how to turn the given argument into a project.");
		}
		await this.storage.upsert(project.toJSON(), this.ProjectsCollectionName, { id: project.id });
		return project;
	}

	async projectIdExists(id) {
		if (Utils.isEmpty(id)) {
			throw new Error(Strings.IsNil("id", "DataManager.projectIdExists"));
		}
		const found = await this.storage.findOne({ id }, this.ProjectsCollectionName);
		return Utils.isDefined(found);
	}

	async projectNameExists(projectName) {
		if (Utils.isEmpty(projectName)) {
			throw new Error(Strings.IsNil("projectName", "DataManager.projectNameExists"));
		}
		const found = await this.storage.findOne({ name: projectName }, this.ProjectsCollectionName);
		return Utils.isDefined(found);
	}
}

module.exports = ProjectManager;
