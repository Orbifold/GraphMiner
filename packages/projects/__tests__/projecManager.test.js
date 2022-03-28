const ProjectUtils = require("../lib/projectUtils");
const Project = require("../lib/project");
const LocalProjectManager = require("../lib/projectManager");
const { Utils } = require("@graphminer/utils");

describe("ProjectManager", () => {
	it("should crud a project", async function () {
		const man = await LocalProjectManager.inMemory();
		const projectName = Utils.randomId();
		const p = await man.createProject(projectName);

		const ps = await man.getProjects();
		expect(ps.length).toEqual(1);
		expect(await man.projectIdExists(p.id)).toBeTruthy();
		expect(await man.projectNameExists(p.name)).toBeTruthy();

		let found = await man.getProjectById(p.id);
		expect(found).not.toBeNull();
		expect(found.name).toEqual(p.name);

		//update
		found.name = Utils.randomId();
		await man.upsertProject(found);
		let updated = await man.getProjectById(p.id);
		expect(updated.name).toEqual(found.name);

		// remove
		await man.removeProject(found.id);
		expect(await man.projectIdExists(found.id)).toBeFalsy();
		const all = await man.getProjects();
		expect(all.length).toEqual(0);
	});
});
