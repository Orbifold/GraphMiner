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
					<ChartWidget :data="chartData" :options="chartOptions"></ChartWidget>
				</div>
			</v-col>
		</v-row>
		<v-row justify="space-between">
			<v-col>
				<div>
					<v-btn depressed color="primary" @click="getWidget">Get Widget</v-btn>
				</div>
			</v-col>
			<v-col>
				<v-btn depressed color="primary" @click="refresh">Refresh Widget</v-btn>
			</v-col>
		</v-row>
		<v-row class="red--text">{{ output }}</v-row>
		<v-divider></v-divider>

		<v-row justify="center">
			<div style="width: 60%; max-width: 500px">
				<v-form>
					<v-text-field label="name" v-model="widgetName"></v-text-field>
					<v-text-field label="description" v-model="widgetDescription"></v-text-field>
					<v-btn depressed color="success" @click="save">Save</v-btn>
				</v-form>
			</div>
		</v-row>
	</v-container>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from "vue-property-decorator";
	import { Utils } from "@graphminer/utils";
	import { Widget } from "@graphminer/projects";
	import * as _ from "lodash";

	import { PrismEditor } from "vue-prism-editor";
	import "vue-prism-editor/dist/prismeditor.min.css";
	import { highlight, languages } from "prismjs/components/prism-core";
	import "prismjs/components/prism-clike";
	import "prismjs/components/prism-javascript";
	import "prismjs/themes/prism-tomorrow.css";
	import { NotificationType } from "@/shared/notificationType";
	import ChartWidget from "@/components/ChartWidget.vue";

	@Component({
		components: {
			PrismEditor,
			ChartWidget,
		},
	})
	export default class CreateWidgetView extends Vue {
		showRight: boolean = true;
		showLeft: boolean = true;
		data: any[][] = [];
		code: string = `
		this.data = this.sampleData();
		this.options = this.sampleOptions();
		`;
		chartData: any = [];
		chartOptions: any = {
			chart: {
				height: 350,
				type: "bar",
			},
		};
		context: any = null;
		output: string = null;
		widgetName: string = null;
		widgetDescription: string = null;
		google: any = null;

		toggleRight() {
			this.showRight = !this.showRight;
		}

		toggleLeft() {
			this.showLeft = !this.showLeft;
		}

		mounted() {
			const ar = _.range(30).map((u) => Utils.randomInteger(1, 100));
			this.context = {
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
							text: "Degree distribution",
						},
						theme: {
							palette: "palette6", // upto palette10
						},
					};
				},
			};
			// this.refreshLoop();
			this.refresh();
		}

		async run() {
			let code = this.code;

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

		refresh() {
			this.run().then(() => {
				this.chartData = this.context.data || [];
				this.chartOptions = this.context.options || {};
			});
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
			if (Utils.isEmpty(this.widgetName)) {
				return this.$ambientService.notify("Empty name.", NotificationType.Error);
			}
			if (!Utils.isSimpleString(this.widgetName)) {
				return this.$ambientService.notify("The name is not a simple name.", NotificationType.Warning);
			}
			const widget = new Widget(this.widgetName, this.widgetDescription, "Bar", this.code);
			widget.id = this.widgetName;
			await this.$dataService.upsertWidget(widget);
			this.$ambientService.notify("Saved", NotificationType.Message);
		}

		async getWidget() {
			const widget = await this.$dataService.getWidgetTemplateById("test");
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
