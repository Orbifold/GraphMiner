import { Graph } from "@graphminer/graphs";
import { Widget } from "@graphminer/projects";
import * as _ from "lodash";
import { Utils } from "@graphminer/utils";

export default class WidgetInterpreter {
	private readonly graph: Graph;

	constructor(graph) {
		this.graph = graph;
	}

	getContext() {
		const ar = _.range(30).map((u) => Utils.randomInteger(1, 100));
		return {
			sampleData: () => {
				return [
					{
						name: "Sample",
						data: ar,
					},
				];
			},
			sampleOptions: () => {
				return {
					chart: {
						height: 350,
						type: "bar",
					},
					xaxis: {
						type: "numeric",
					},
					title: {
						text: "",
					},
					theme: {
						palette: "palette6", // upto palette10
					},
				};
			},
			graph: this.graph,
			data: [],
			options: {},
		};
	}

	execute(widgets) {
		const ctx = this.getContext();
		// @ts-ignore
		global.Utils = Utils;
		const result = [];
		for (const widget of widgets) {
			const err = Utils.eval(widget.code, ctx);
			result.push({
				options: ctx.options,
				data: ctx.data,
				error: err,
			});
		}
		return result;
	}
}
