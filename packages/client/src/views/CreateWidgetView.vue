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
	import { WidgetTemplate } from "@graphminer/projects";
	import * as _ from "lodash";

	import { PrismEditor } from "vue-prism-editor";
	import "vue-prism-editor/dist/prismeditor.min.css";
	import { highlight, languages } from "prismjs/components/prism-core";
	import "prismjs/components/prism-clike";
	import "prismjs/components/prism-javascript";
	import "prismjs/themes/prism-tomorrow.css";
	import { NotificationType } from "@/shared/notificationType";
	import ChartWidget from "@/components/ChartWidget.vue";
	import WidgetInterpreter from "@/shared/WidgetInterpreter";
	import { Graph, RandomGraph } from "@graphminer/graphs";

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
		code: string = null;
		chartData: any = [];
		chartOptions: any = {};
		context: any = null;
		output: string = null;
		widgetName: string = null;
		widgetDescription: string = null;
		graph: Graph;
		private interpreter: WidgetInterpreter;
		private widget: WidgetTemplate;

		toggleRight() {
			this.showRight = !this.showRight;
		}

		toggleLeft() {
			this.showLeft = !this.showLeft;
		}

		mounted() {
			this.graph = RandomGraph.BalancedTree();
			this.interpreter = new WidgetInterpreter(this.graph);
			this.widget = WidgetTemplate.testWidget();
			this.code = this.widget.code;
			// this.refreshLoop();
			this.refresh();
		}

		refresh() {
			this.widget.code = this.code;
			const result = this.interpreter.execute([this.widget]);
			const r = result[0];
			if (Utils.isDefined(r.error)) {
				this.output = r.error;
			} else {
				this.chartOptions = r.options;
				this.chartData = r.data;
			}
		}

		async refreshLoop() {
			setInterval(() => {
				this.refresh();
			}, 1000);
		}

		highlighter(code) {
			return highlight(code, languages.js); // languages.<insert language> to return html with markup
		}

		async save() {
			if (Utils.isEmpty(this.widgetName)) {
				return this.$ambientService.notify("Empty name.", NotificationType.Error);
			}
			// if (!Utils.isSimpleString(this.widgetName)) {
			// 	return this.$ambientService.notify("The name is not a simple name.", NotificationType.Warning);
			// }
			const widget = new WidgetTemplate(this.widgetName, this.widgetDescription, this.code);

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
