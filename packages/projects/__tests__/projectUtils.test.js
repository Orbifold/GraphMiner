const ProjectUtils = require("../lib/projectUtils");
const Project = require("../lib/project");


describe('ProjectUtils', () => {
    it("should parse for project info", function () {
        expect(ProjectUtils.getProjectFromSpecs("a")).toBeInstanceOf(Project)
        expect(ProjectUtils.getProjectFromSpecs("a").name).toEqual("a")
        expect(ProjectUtils.getProjectFromSpecs("a").description).toBeNull()

        expect(ProjectUtils.getProjectFromSpecs("a", "b").description).toEqual("b")
        expect(ProjectUtils.getProjectFromSpecs("a", "b").id).not.toBeNull()


    });
});
