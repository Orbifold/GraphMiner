const Predecessors = require("../lib/predecessors");
const Predecessor = require("../lib/predecessor");

const parsePredecessor = Predecessors.parsePredecessor;
const parsePredecessors = Predecessors.parsePredecessors;
describe("Durations", function () {
    it("should parse the predecessor", function () {
        expect(parsePredecessor(" ")).toBeNull();
        expect(parsePredecessor("20").id).toEqual(20);
        expect(parsePredecessor("20").delay).toBeNull();
        expect(parsePredecessor("20").type).toBeNull();

        const ex = {
            "4127SS +1d": {
                id: 4127,
                type: "SS",
                delay: "1d",
            },
            "7FS -31d": {
                id: 7,
                type: "FS",
                delay: "-31d",
            },
            "71FF +31d": {
                id: 71,
                type: "FF",
                delay: "31d",
            },
            "22": {
                id: 22,
                type: null,
                delay: null,
            },
            // "4127FS +2d":"4127FS +2d",
            // "4158":"4158",
            // "4308FS":"4308FS",
            // "4308SF +8d":"4308SF +8d",
            // "4321FF +67d":"4321FF +67d"
        };

        expect(parsePredecessor(" ")).toBeNull();
        expect(parsePredecessor("20").id).toEqual(20);
        expect(parsePredecessor("20").delay).toBeNull();
        expect(parsePredecessor("20").type).toBeNull();
        const values = Object.keys(ex);
        for (let i = 0; i < values.length; i++) {
            const input = values[i];
            const output = ex[input];
            expect(parsePredecessor(input)).toEqual(output);
        }
    });
    it("should parse arrays", function () {
        const found = parsePredecessors("11+2w, 11-2m"); //?
        expect(found.length).toEqual(2);
        expect(found[0]).toEqual(new Predecessor(11, null, "2w"));
        expect(found[1]).toEqual(new Predecessor(11, null, "-2m"));
        expect((found[1]).delayDays).toEqual(-60);
    });
});
