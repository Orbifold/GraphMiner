<template>
  <v-container v-if="dashboard">
    <DashboardDialog ref="dashboardDialog"></DashboardDialog>
    <v-row justify="space-between">
      <v-col cols="2"
      >
        <h1>
          <v-icon>$dashboard</v-icon>
          {{ dashboard.name }}
          <v-btn color="error" x-small icon depressed @click="deleteDashboard" title="Delete this project">
            <v-icon>$bin</v-icon>
          </v-btn>
          <v-btn x-small icon depressed @click="editDashboard" title="Edit this project">
            <v-icon>$pen</v-icon>
          </v-btn>
        </h1>
        <div title="Back to the project page" style="cursor: pointer" @click="gotoProject">Project: {{ project.name }}</div>
      </v-col
      >
      <v-col>
        <div class="truncated-text"> {{ dashboard.description }}</div>
      </v-col>
      <v-col cols="1">
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
    <v-divider class="mt-2 mb-2"></v-divider>
    <v-row v-for="(block, i) in items" :key="i" v-if="items.length > 0">
      <v-col cols="6" v-for="(item, j) in block" :key="j">
        <div v-if="item.error !== null">{{ item.error }}</div>
        <ChartWidget v-else :data="item.data" :options="item.options"></ChartWidget>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import {Utils} from "@graphminer/utils";
import VueBase from "@/views/vueBase";
import * as _ from "lodash";
import {NotificationType} from "@/shared/notificationType";
import {Project, Dashboard} from "@graphminer/projects";
import ChartWidget from "@/components/ChartWidget.vue";
import WidgetInterpreter from "@/shared/WidgetInterpreter";
import DashboardDialog from "@/dialogs/DashboardDialog.vue";
// ===================================================================
// todo: dynamic layout using Vue Grid Layout https://jbaysolutions.github.io/vue-grid-layout/guide/08-responsive-predefined-layouts.html
// see also https://codepen.io/nyoung697/pen/BperoZ
// ===================================================================
@Component({
  components: {ChartWidget, DashboardDialog}
})
export default class DashboardView extends VueBase {
  dashboard: Dashboard = null;
  items: any = [];
  widgets: any[] = [];
  dashboardId: string = null;

  async mounted() {
    await this.ensureActiveProject();
    this.dashboardId = this.$ambientService.getQueryParameter("dashboardId");
    if (Utils.isEmpty(this.dashboardId)) {
      this.$ambientService.notify("No dashboard id specified.", NotificationType.Error);
      await new Promise((r) => setTimeout(r, 2000));
      return this.$ambientService.navigateTo("Projects");
    }

    const found = _.find(this.project.dashboards, (d) => d.id === this.dashboardId);
    if (Utils.isEmpty(found)) {
      this.$ambientService.notify("The specified dashboard does not exist.", NotificationType.Error);
      await new Promise((r) => setTimeout(r, 2000));
      return this.$ambientService.navigateTo("Projects");
    }
    this.dashboard = found;
    await this.refreshWidgets();
  }

  async refreshWidgets() {
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
    await this.refreshWidgets();
  }

  async getWidgetTemplates() {
    return await this.$dataService.getWidgetTemplates();
  }

  gotoProject() {
    this.$ambientService.navigateTo("Project");
  }

  async editDashboard() {
    const dashboard = this.project.getDashboardById(this.dashboardId);
    const info = await (this.$refs.dashboardDialog as any).editDashboard(dashboard);
    if (Utils.isDefined(info)) {
      dashboard.name = info.name;
      dashboard.description = info.description;
      dashboard.color = info.color;
      this.project.removeDashboard(this.dashboardId);
      this.project.dashboards.push(dashboard);
      this.dashboard = dashboard;
      await this.$dataService.upsertProject(this.project);

    }
  }

  async deleteDashboard() {
    const yn = await this.$ambientService.confirm("Delete Dashboard", "Are you sure?");
    if (yn) {
      this.project.removeDashboard(this.dashboardId);
      await this.$dataService.upsertProject(this.project);
      this.$ambientService.navigateTo("Project");
    }
  }
}
</script>

<style scoped></style>
