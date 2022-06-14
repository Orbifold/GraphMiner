const {DataManager, WidgetTemplate} = require("../lib/");
const {faker} = require("@faker-js/faker")

describe("DataManager", function () {
    it("should crud projects", async function () {
        const man = await DataManager.inMemory();

        let name = faker.lorem.word()
        const p = await man.createProject(name);
        expect(p.name).toEqual(name)
        expect(await man.projectNameExists(name)).toBeTruthy()
        expect(await man.projectIdExists(p.id)).toBeTruthy()
        p.name = faker.lorem.word()
        await man.upsertProject(p)
        expect(await man.projectNameExists(name)).not.toBeTruthy()
        expect(await man.projectNameExists(p.name)).toBeTruthy()
        await man.removeProject(p.id)
        expect(await man.projectIdExists(p.id)).not.toBeTruthy()
    });

    it("should crud widget templates", async function () {
        const man = await DataManager.inMemory();

        let templates = await man.getWidgetTemplates()
        expect(templates.length).toEqual(0)
        await man.loadPredefinedWidgets()
        templates = await man.getWidgetTemplates()
        expect(templates.length).not.toEqual(0)
        templates.length//?

        const w = new WidgetTemplate();
        w.name = faker.name.findName()
        await man.upsertWidgetTemplate(w)
        expect(await man.widgetTemplateIdExists(w.id)).toBeTruthy()
        expect(await man.widgetTemplateIdExists("abc")).not.toBeTruthy()
        w.name = faker.lorem.word()
        await man.upsertWidgetTemplate(w)
        let found = await man.getWidgetTemplateById(w.id)
        expect(found.name).toEqual(w.name)
        await man.removeWidgetTemplate(w.id)
        expect(await man.widgetTemplateIdExists(w.id)).not.toBeTruthy()
    });

    it("should add a blank", async function () {
        const man = await DataManager.inMemory();
        let w = await man.addBlankWidgetTemplate()
        expect(w.name).toEqual("New Widget Template")

    });

    it("should duplicate a template", async function () {
        const man = await DataManager.inMemory();

        const w = new WidgetTemplate();
        w.name = faker.lorem.word(3)
        w.code = faker.lorem.text()
        await man.upsertWidgetTemplate(w)
        const d = await man.duplicateWidgetTemplate(w.id)
        expect(d.id).not.toEqual(w.id)
        expect(d.name).toEqual(d.name)
        expect(d.code).toEqual(d.code)


    });
});
