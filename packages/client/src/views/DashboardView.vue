<template>
	<v-container v-if="dashboard">
		<v-row justify="space-between">
			<v-col
				><h1>
					{{ dashboard.name }}
				</h1></v-col
			>
			<v-col>
				<v-menu offset-y style="z-index: 20">
					<template v-slot:activator="{ on, attrs }">
						<v-btn color="primary" v-bind="attrs" v-on="on" depressed class="float-right"> Add Widget</v-btn>
					</template>
					<v-list>
						<v-list-item v-for="(item, index) in widgets" :key="index" @click="addWidget(item)">
							<v-list-item-title>{{ item.name }}</v-list-item-title>
						</v-list-item>
					</v-list>
				</v-menu>
			</v-col>
		</v-row>
		<v-row v-for="(block, i) in items" :key="i" v-if="items.length > 0">
			<v-col cols="6" v-for="(item, j) in block" :key="j">
				<div v-if="item.error !== null">{{ item.error }}</div>
				<ChartWidget v-else :data="item.data" :options="item.options"></ChartWidget>
			</v-col>
		</v-row>
	</v-container>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from "vue-property-decorator";
	import { Utils } from "@graphminer/utils";
	import VueBase from "@/views/vueBase";
	import * as _ from "lodash";
	import { NotificationType } from "@/shared/notificationType";
	import { Project, Dashboard } from "@graphminer/projects";
	import ChartWidget from "@/components/ChartWidget.vue";
	import WidgetInterpreter from "@/shared/WidgetInterpreter";
	// ===================================================================
	// todo: dynamic layout using Vue Grid Layout https://jbaysolutions.github.io/vue-grid-layout/guide/08-responsive-predefined-layouts.html
	// see also https://codepen.io/nyoung697/pen/BperoZ
	// ===================================================================
	@Component({
		components: { ChartWidget },
	})
	export default class DashboardView extends VueBase {
		dashboard: Dashboard = null;
		items: any = [];
		widgets: any[] = [];

		async mounted() {
			await this.ensureActiveProject();
			const dashboardId = this.$ambientService.getQueryParameter("dashboardId");
			if (Utils.isEmpty(dashboardId)) {
				this.$ambientService.notify("No dashboard id specified.", NotificationType.Error);
				await new Promise((r) => setTimeout(r, 2000));
				return this.$ambientService.navigateTo("Projects");
			}

			const found = _.find(this.project.dashboards, (d) => d.id === dashboardId);
			if (Utils.isEmpty(found)) {
				this.$ambientService.notify("The specified dashboard does not exist.", NotificationType.Error);
				await new Promise((r) => setTimeout(r, 2000));
				return this.$ambientService.navigateTo("Projects");
			}
			this.dashboard = found;
			await this.refresh();
		}

		async refresh() {
			this.widgets = await this.getWidgetTemplates();
			const g = await this.getGraph();

			const interpreter = new WidgetInterpreter(g);
			const widgets = this.dashboard.widgets;
			const result = interpreter.execute(widgets);
			if (result && result.length > 0) {
				const blocks = [];
				let currentBlock = [];
				while (result.length > 0) {
					if (currentBlock.length >= 2) {
						blocks.push(currentBlock);
						currentBlock = [];
					}
					const item = result.shift();
					currentBlock.push(item);
				}
				if (currentBlock.length > 0) {
					blocks.push(currentBlock);
				}
				this.items = blocks;
			} else {
				this.items = [];
			}
		}

		async getGraph() {
			await this.ensureActiveProject();
			return await this.$dataService.getGraph(this.project.id);
		}

		async addWidget(item) {
			await this.$dataService.addWidget(this.project.id, this.dashboard.id, item.id);
			await this.refresh();
		}

		async getWidgetTemplates() {
			return await this.$dataService.getWidgetTemplates();
		}
	}
</script>

<style scoped></style>
