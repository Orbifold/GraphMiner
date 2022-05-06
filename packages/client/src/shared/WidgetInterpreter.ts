import {Graph} from "@graphminer/graphs";
import {WidgetTemplate} from "@graphminer/projects";
import * as _ from "lodash";
import {Utils} from "@graphminer/utils";
import {Random} from "@graphminer/language";
import MarkdownIt from "markdown-it";

export default class WidgetInterpreter {
    private readonly graph: Graph;
    private mdRenderer: MarkdownIt;

    constructor(graph) {
        this.graph = graph;
        this.mdRenderer = new MarkdownIt();
    }

    /**
     * Returns the context within which the JavaScript is executed.
     * @returns any
     */
    getJsContext() {
        const ar = _.range(30).map((u) => Utils.randomInteger(1, 100));
        return {

            sampleData: () => {
                return [
                    {
                        name: "Sample",
                        data: ar
                    }
                ];
            },
            sampleOptions: () => {
                return {
                    chart: {
                        height: "100%",
                        width: "100%",
                        type: "bar"
                    },
                    xaxis: {
                        type: "numeric"
                    },
                    title: {
                        text: "Test Widget"
                    },
                    theme: {
                        palette: "palette6" // upto palette10
                    }
                };
            },
            graph: this.graph,
            language: Random,
            data: [],
            options: {}
        };
    }

    execute(widgets) {
        const oldLog = console.log;
        const logMessages = [];
        console.log = function (message) {
            logMessages.push(message);
            oldLog.apply(console);
        };
        const ctx = this.getJsContext();
        // @ts-ignore
        global.Utils = Utils;
        // @ts-ignore
        global._ = _;
        const result = [];
        for (const widget of widgets) {
            try {
                switch (widget.language) {
                    case "js":
                        const err = Utils.eval(widget.code, ctx);
                        result.push({
                            options: ctx.options,
                            data: ctx.data,
                            error: err,
                            log: logMessages,
                            renderer: widget.renderer
                        });
                        break;
                    case "md":
                        result.push({
                            options: null,
                            data: this.mdRenderer.render(widget.code),
                            error: null,
                            log: null,
                            renderer: widget.renderer
                        });
                        break;
                }


            } catch (e) {
                result.push({
                    options: null,
                    data: null,
                    error: e.message,
                    log: logMessages
                });
            }
        }
        console.log = oldLog;
        return result;
    }
}
