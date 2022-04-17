<template>
  <v-container v-if="project !== null">
    <DashboardDialog ref="dashboardDialog"></DashboardDialog>
    <v-row >
      <v-col v-if="project.image" cols="2" >
        <v-img :src="project.image" height="120" max-width="200"></v-img>
      </v-col>
      <v-col cols="8"
      >
        <h1>
          <v-icon color="primary8">$flask</v-icon>
          {{ project.name }}
        </h1>
        <div  class="truncated-text">{{ project.description }}</div>

      </v-col
      >
      <v-col >
        <v-btn @click="addNewDashboard" depressed color="success" class="float-right">New Dashboard</v-btn>
      </v-col>
    </v-row>

    <v-divider class="mt-2 mb-2"></v-divider>

    <v-row v-for="(block, i) in dashboards" :key="i">
      <v-col cols="3" md="3" v-for="(item, j) in block" :key="j">
        <v-card class="mx-auto" min-height="180" max-width="400" max-height="400" min-width="230" flat outlined>
          <div :style="{height: '10px','background-color':item.color}"></div>
          <v-card-title>
            <v-icon>$dashboard</v-icon>
            {{ item.name }}
          </v-card-title>
          <v-card-subtitle class="pb-0">
            <v-chip class="mt-2 mb-2" color="green darken" text-color="white" x-small>Dashboard</v-chip>
          </v-card-subtitle>
          <v-card-text class="text--primary">
            <div class="text-truncate"><i>{{ item.description }}</i></div>
          </v-card-text>

          <v-card-actions>
            <v-btn color="primary2" text @click="openDashboard(item.id)"> Open</v-btn>
            <v-spacer></v-spacer>
            <v-btn color="error" x-small icon depressed @click="deleteDashboard(item.id)" title="Delete this project">
              <v-icon>$bin</v-icon>
            </v-btn>
            <v-btn x-small icon depressed @click="editDashboard(item.id)" title="Edit this project">
              <v-icon>$pen</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component} from "vue-property-decorator";
import {Utils} from "@graphminer/utils";
import {Project, Dashboard} from "@graphminer/projects";
import VueBase from "@/views/vueBase";
import * as _ from "lodash";
import {Lang, Random} from "@graphminer/language";
import DashboardDialog from "@/dialogs/DashboardDialog.vue";

@Component({
  components: {DashboardDialog}
})
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
    this.$router.push({name: "Dashboard", query: {dashboardId: id}});
  }

  async addNewDashboard() {
    const info = await (this.$refs.dashboardDialog as any).newDashboard();
    if (Utils.isDefined(info)) {
      await this.$dataService.createDashboard(this.project.id, info.name, info.description, info.color);
      await this.refreshDashboards();
    }

  }

  async editDashboard(dashboardId) {

    const dashboard = this.project.getDashboardById(dashboardId);
    const info = await (this.$refs.dashboardDialog as any).editDashboard(dashboard);
    if (Utils.isDefined(info)) {
      dashboard.name = info.name;
      dashboard.description = info.description;
      dashboard.color = info.color;
      this.project.removeDashboard(dashboardId);
      this.project.dashboards.push(dashboard);
      await this.$dataService.upsertProject(this.project);
      await this.refreshDashboards();
    }
  }

  async deleteDashboard(dashboardId) {
    const yn = await this.$ambientService.confirm("Delete Dashboard", "Are you sure?");
    if (yn) {
      this.project.removeDashboard(dashboardId);
      await this.$dataService.upsertProject(this.project);
      await this.refreshDashboards();
    }
  }
}
</script>

<style scoped></style>
