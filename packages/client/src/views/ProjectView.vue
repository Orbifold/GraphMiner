<template>
	<v-container v-if="project !== null">
		<v-row>
			<v-col cols="5"
				><h1>{{ project.name }}</h1></v-col
			>
			<v-col>
				<v-btn @click="addNewDashboard" depressed color="success" class="float-right">New Dashboard</v-btn>
			</v-col>
		</v-row>
		<v-row v-for="(block, i) in dashboards" :key="i">
			<v-col cols="3" md="3" v-for="(item, j) in block" :key="j">
				<v-card class="mx-auto" max-width="400" color="primary6 " flat>
					<v-card-title>{{ item.name }}</v-card-title>
					<v-card-subtitle class="pb-0">
						<v-chip class="mt-2 mb-2" color="green darken" text-color="white" x-small>Dashboard</v-chip>
					</v-card-subtitle>
					<v-card-text class="text--primary">
						<div>{{ item.description }}</div>
					</v-card-text>

					<v-card-actions>
						<v-btn color="primary2" text @click="openDashboard(item.id)"> Open</v-btn>
					</v-card-actions>
				</v-card>
			</v-col>
		</v-row>
	</v-container>
</template>

<script lang="ts">
	import { Component } from "vue-property-decorator";
	import { Utils } from "@graphminer/utils";
	import { Project, Dashboard } from "@graphminer/projects";
	import VueBase from "@/views/vueBase";
	import * as _ from "lodash";
	import { Lang, Random } from "@graphminer/language";

	@Component({})
	export default class ProjectView extends VueBase {
		dashboards: Dashboard[][] = [];

		async mounted() {
			await this.ensureActiveProject();
			await this.refreshDashboards();
		}

		async refreshDashboards() {
			// make sure you don't alter the data in the store and take a clone
			const all = _.clone(this.project.dashboards);
			const blocks = [];
			let currentBlock = [];
			while (all.length > 0) {
				if (currentBlock.length >= 4) {
					blocks.push(currentBlock);
					currentBlock = [];
				}
				const item = all.shift();
				currentBlock.push(item);
			}
			if (currentBlock.length > 0) {
				blocks.push(currentBlock);
			}
			this.dashboards = blocks;
		}

		async openDashboard(id) {
			this.$router.push({ name: "Dashboard", query: { dashboardId: id } });
		}

		async addNewDashboard() {
			await this.$dataService.createDashboard(this.project.id, `Dashboard ${Utils.titleCase(Random.noun())}`);
			await this.refreshDashboards();
		}
	}
</script>

<style scoped></style>
