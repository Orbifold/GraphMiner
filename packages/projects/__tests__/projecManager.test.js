const ProjectUtils = require("../lib/projectUtils");
const Project = require("../lib/project");
const ProjectManager = require("../lib/projectManager");
const {Utils} = require("@graphminer/utils");
const WidgetTemplate = require("../lib/widgetTemplate");
const Dashboard = require("../lib/dashboard");
const Widget = require("../lib/widget");

describe("ProjectManager", () => {
    it("should crud a project", async function () {
        const man = await ProjectManager.inMemory();
        let projectName = Utils.randomId();
        let p = await man.createProject(projectName);

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

        // add widget
        projectName = Utils.randomId();
        p = await man.createProject(projectName);
        let db = new Dashboard("a");
        await man.addDashboard(db, p.id);
        found = await man.getDashboardById(p.id, db.id);
        expect(found.name).toEqual(db.name);
        let w = new WidgetTemplate("wa", "wb", "wc");
        await man.addWidget(w, p.id, db.id);
        found = await man.getWidgetById(w.id, p.id, db.id);
        expect(found.code).toEqual(w.code);
    });

    it("should manage project elements", function () {
        let p = new Project("a", "b");
        let json = p.toJSON();
        expect(json.databaseName).toEqual(p.databaseName);
        expect(json.name).toEqual("a");
        expect(json.description).toEqual("b");
        let db = p.addDashboard("d").getDashboardByName("d");
        json = p.toJSON();
        expect(json.dashboards.length).toEqual(1);
        expect(json.dashboards[0].name).toEqual("d");
        const w = new WidgetTemplate("g", "h", "m");
        p.addWidget(w, db.id);

        p.removeDashboard(db.id);
        json = p.toJSON();
        expect(json.dashboards.length).toEqual(0);
    });
    it("should get a project in various ways", async function () {
        const man = await ProjectManager.inMemory();
        let projectName = Utils.randomId();
        let p = await man.createProject(projectName);
        let found = await man.getProjectByName(projectName);
        expect(found).not.toBeNull();
        expect(found.id).toEqual(p.id);

        found = await man.getProjectByDatabaseName(p.databaseName);
        expect(found).not.toBeNull();
        expect(found.id).toEqual(p.id);
    });

    it("should crud a widget", async function () {
        const man = await ProjectManager.inMemory();
        let projectName = Utils.randomId();
        let p = await man.createProject(projectName);

        let dummyWidget = WidgetTemplate.dummyWidget();

        expect(dummyWidget.typeName).toEqual("WidgetTemplate");
        let w = Widget.fromWidgetTemplate(dummyWidget);
        expect(w.id).not.toEqual("dummy");
        let hasThrown = false;
        try {
            // missing dashboard
            await man.addWidget(w, p.id, "a");
        } catch (e) {
            hasThrown = true;
        }
        expect(hasThrown).toBeTruthy();
        let db = await man.addDashboard("a", p.id);
        let found = await man.getDashboardByName("a", p.id);
        expect(found.id).toEqual(db.id);
        await man.addWidget(w, p.id, db.id);
        found = await man.getDashboardById(p.id, db.id);
        expect(found.id).toEqual(db.id);
        found = await man.getWidgetById(w.id, p.id, db.id);
        expect(found.id).toEqual(w.id);

        w.name = "abc";
        await man.upsertWidget(w, p.id, db.id);
        found = await man.getWidgetById(w.id, p.id, db.id);
        expect(found.name).toEqual("abc");
        await man.removeWidget(w.id, p.id, db.id);
        found = await man.getWidgetById(w.id, p.id, db.id);
        expect(found).toBeNull();
    });
    it("should crud a dashboard", async function () {
        const man = await ProjectManager.inMemory();
        let projectName = Utils.randomId();
        let p = await man.createProject(projectName);

        let db = new Dashboard(Utils.randomId());
        let w = new Widget("a", "a");
        db.addWidget(w);
        p.addDashboard(db);
        let found = p.getDashboardById(db.id);
        expect(found.id).toEqual(db.id);
        found = p.getDashboardByName(db.name);
        expect(found.id).toEqual(db.id);
        await man.upsertProject(p);
        found = await man.getDashboardByName(db.name, p.id);
        expect(found.id).toEqual(db.id);
        await man.removeDashboard(p.id, db.id);
        found = await man.getProjectById(p.id);
        expect(found.dashboards.length).toEqual(0);
    });
});
