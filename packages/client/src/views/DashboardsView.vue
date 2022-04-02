<template>
	<v-container>
		<v-row>
			<v-col cols="2"><h1>Projects</h1></v-col>
			<v-col>
				<v-btn @click="addDashboard" depressed color="success" class="float-right">New Dashboard</v-btn>
			</v-col>
		</v-row>

		<v-divider class="mt-3 mb-3"></v-divider>
		<v-row v-for="(block, i) in data" :key="i">
			<v-col cols="3" md="3" v-for="(item, j) in block" :key="j">
				<v-card class="mx-auto" max-width="400" color="primary3 " flat>
					<v-card-title>{{ item.name }}</v-card-title>
					<v-card-subtitle class="pb-0">
						<v-chip class="mt-2 mb-2" color="secondary" text-color="white" x-small>Dashboard</v-chip>
					</v-card-subtitle>
					<v-card-text class="text--primary">
						<div>{{ item.description }}</div>
					</v-card-text>

					<v-card-actions>
						<v-btn color="secondary" text @click="openDashboard(item.id)"> Open</v-btn>
					</v-card-actions>
				</v-card>
			</v-col>
		</v-row>
	</v-container>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from "vue-property-decorator";
	import { Utils } from "@graphminer/utils";
	import VueBase from "@/views/vueBase";

	@Component({})
	export default class DashboardsView extends VueBase {
		showRight: boolean = true;
		showLeft: boolean = true;
		data: any[][] = [];

		toggleRight() {
			this.showRight = !this.showRight;
		}

		toggleLeft() {
			this.showLeft = !this.showLeft;
		}

		async mounted() {
			await this.ensureActiveProject();
			await this.refresh();
		}

		async addDashboard() {
			await this.$dataService.createDashboard(`Dashboard${Utils.randomId()}`);
			await this.refresh();
		}

		async refresh() {
			const all = await this.$dataService.getAllDashboards();
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
			this.data = blocks;
		}

		async openDashboard(dashboardId) {}
	}
</script>

<style scoped></style>
