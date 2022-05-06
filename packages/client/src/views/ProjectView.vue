<template>
  <v-container v-if="project !== null">
    <ProjectDialog ref="projectDialog"></ProjectDialog>
    <DashboardDialog ref="dashboardDialog"></DashboardDialog>
    <v-row>
      <v-col v-if="project.image" cols="2">
        <v-hover>
          <template v-slot:default="{ hover }">
            <v-img :src="project.image" height="120" max-width="200">
              <v-overlay
                  v-if="hover"
                  absolute
                  color="#036358"
              >
                <v-btn icon x-small @click="editProject">
                  <v-icon>$pen</v-icon>
                </v-btn>
              </v-overlay>
            </v-img>
          </template>
        </v-hover>
      </v-col>
      <v-col cols="7"
      >
        <h1>
          <v-icon color="primary8">$flask</v-icon>
          {{ project.name }}
          <v-btn color="error" x-small icon depressed @click="deleteProject" title="Delete this project">
            <v-icon>$bin</v-icon>
          </v-btn>
          <v-btn x-small icon depressed @click="editProject" title="Edit this project">
            <v-icon>$pen</v-icon>
          </v-btn>
        </h1>
        <div class="truncated-text">{{ project.description }}</div>

      </v-col
      >
      <v-col cols="2" class="d-flex flex-column">
        <v-btn @click="addNewDashboard" depressed small outlined color="success" class="float-right">
          <v-icon>$dashboard</v-icon>
          New Dashboard
        </v-btn>

        <v-btn @click="viewData" depressed small outlined color="success" class="float-right mt-2">
          <v-icon>$database</v-icon>
          Data
        </v-btn>
      </v-col>
    </v-row>

    <v-divider class="mt-2 mb-2"></v-divider>

    <v-row>
      <v-card v-for="(item, i) in dashboards" :key="i" class="mx-2 my-2" height="180" width="280" flat outlined>
        <div :style="{height: '10px','background-color':item.color}"></div>
        <v-card-title>
          <v-icon>$dashboard</v-icon>
          {{ item.name }}
        </v-card-title>
        <v-card-subtitle class="pb-0">
          <v-chip class="mt-2 mb-2" color="green darken" text-color="white" x-small>Dashboard</v-chip>
        </v-card-subtitle>
        <v-card-text class="text--primary">
          <div class="text-truncate"><i>{{ item.description || "&nbsp;" }}</i></div>
        </v-card-text>

        <v-card-actions>
          <v-btn color="primary6" text @click="openDashboard(item.id)"> Open</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="error" x-small icon depressed @click="deleteDashboard(item.id)" title="Delete this project">
            <v-icon>$bin</v-icon>
          </v-btn>
          <v-btn x-small icon depressed @click="editDashboard(item.id)" title="Edit this project">
            <v-icon>$pen</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component} from "vue-property-decorator";
import {Utils} from "@graphminer/utils";
import {Project, Dashboard} from "@graphminer/projects";
import VueBase from "@/views/vueBase";
import * as _ from "lodash";
import DashboardDialog from "@/dialogs/DashboardDialog.vue";
import ProjectDialog from "@/dialogs/ProjectDialog.vue";

@Component({
  components: {DashboardDialog, ProjectDialog}
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
    // const blocks = [];
    // let currentBlock = [];
    // while (all.length > 0) {
    //   if (currentBlock.length >= 4) {
    //     blocks.push(currentBlock);
    //     currentBlock = [];
    //   }
    //   const item = all.shift();
    //   currentBlock.push(item);
    // }
    // if (currentBlock.length > 0) {
    //   blocks.push(currentBlock);
    // }
    this.dashboards = all;
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

  viewData() {
    this.$ambientService.navigateTo("Explore");
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

  async editProject() {
    const project = await this.$dataService.getProject(this.project.id);
    const info = await (this.$refs.projectDialog as any).editProject(project);
    if (Utils.isDefined(info)) {
      project.name = info.name;
      project.description = info.description;
      project.image = info.image;
      this.$store.commit("ambient/setProject", project);
      await this.$dataService.upsertProject(project);

    }
  }

  async deleteProject() {
    const yn = await this.$ambientService.confirm("Delete Project", "Are you sure?");
    if (yn) {
      await this.$dataService.removeProject(this.project.id);
      this.$store.commit("ambient/setProject", null);
      this.navigateTo("Projects");
    }
  }
}
</script>

<style scoped></style>
