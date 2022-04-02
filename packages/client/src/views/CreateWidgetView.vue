<template>
	<v-container>
		<h1>Create Widget</h1>
		<v-divider class="mb-3"></v-divider>
		<v-row>
			<v-col cols="6">
				<prism-editor class="editor" v-model="code" :highlight="highlighter" line-numbers></prism-editor>
			</v-col>
			<v-col cols="6">
				<div>
					<GChart :settings="{ packages: ['bar'] }" :data="chartData" :options="chartOptions" :createChart="(el, google) => new google.charts.Bar(el)" @ready="onChartReady" />
				</div>
			</v-col>
			<v-row>
				<v-col>
					<div class="float-right">
						<v-btn depressed color="primary" @click="getWidget">Get Widget</v-btn>
						<v-btn depressed color="success" @click="save">Save</v-btn>
					</div>
				</v-col>
			</v-row>
		</v-row>
		<v-row class="red--text">{{ output }}</v-row>
	</v-container>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from "vue-property-decorator";
	import { Utils } from "@graphminer/utils";
	import { Widget } from "@graphminer/projects";

	import { PrismEditor } from "vue-prism-editor";
	import "vue-prism-editor/dist/prismeditor.min.css";
	import { highlight, languages } from "prismjs/components/prism-core";
	import "prismjs/components/prism-clike";
	import "prismjs/components/prism-javascript";
	import "prismjs/themes/prism-tomorrow.css";
	import { GChart } from "vue-google-charts";
	import { NotificationType } from "@/shared/notificationType";

	@Component({
		components: {
			PrismEditor,
			GChart,
		},
	})
	export default class CreateWidgetView extends Vue {
		showRight: boolean = true;
		showLeft: boolean = true;
		data: any[][] = [];
		code: string = `
		this.data = this.sampleData;
		this.options = this.sampleOptions;
		`;
		chartData: any = [];
		chartOptions: any = null;
		context: any = null;
		output: string = null;
		google: any = null;

		toggleRight() {
			this.showRight = !this.showRight;
		}

		toggleLeft() {
			this.showLeft = !this.showLeft;
		}

		mounted() {
			this.refreshLoop();
		}

		onChartReady(chart, google) {
			this.google = google;
		}

		getChartOptions() {
			if (!this.google || !this.google.charts.Bar) return null;
			// return this.chartsLib.charts.Bar.convertOptions(this.chartOptions);
			return this.google.charts.Bar.convertOptions(this.chartOptions);
		}

		async run() {
			let code = this.code;
			this.context = {
				sampleData: [
					["Year", "Sales", "Expenses", "Profit"],
					["2014", 1000, 400, 200],
					["2015", 1170, 460, 250],
					["2016", 660, 1120, 300],
					["2017", 1030, 540, 350],
				],
				sampleOptions: {
					chart: {
						title: "Sample Chart",
						subtitle: "The subtitle",
					},
					bars: "vertical", // Required for Material Bar Charts.
					hAxis: { format: "decimal" },
					height: 400,
					colors: ["#1b9e77", "#d95f02", "#7570b3"],
				},
			};
			let output;
			{
				let window = null;
				let global = null;
				(function () {
					try {
						return eval(code);
					} catch (e) {
						output = e;
					}
				}.call(this.context));
			}
			this.output = output;
		}

		async refreshLoop() {
			setInterval(() => {
				this.run().then(() => {
					this.chartData = this.context.data || [];
					this.chartOptions = this.context.options || {};
				});
			}, 1000);
		}

		highlighter(code) {
			return highlight(code, languages.js); // languages.<insert language> to return html with markup
		}

		async save() {
			const widget = new Widget("test", "Just a test.", "Bar", this.code);
			widget.id = "test";
			await this.$dataService.upsertWidget(widget);
			this.$ambientService.notify("Saved", NotificationType.Message);
		}

		async getWidget() {
			const widget = await this.$dataService.getWidgetById("test");
			if (widget) {
				this.code = widget.code;
			}
		}
	}
</script>

<style>
	.editor {
		background: #2d2d2d;
		color: #ccc;

		font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
		font-size: 14px;
		line-height: 1.5;
		padding: 5px;
	}

	.prism-editor__textarea:focus {
		outline: none;
	}
</style>
