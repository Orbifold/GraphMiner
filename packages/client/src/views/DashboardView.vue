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

    <v-row>

    </v-row>
    <GridLayout
        :layout="layout"
        :col-num="12"
        :row-height="30"
        :is-draggable="draggable"
        :is-resizable="resizable"
        :vertical-compact="true"
        :use-css-transforms="true"
        :responsive="responsive"
        @breakpoint-changed="breakpointChangedEvent"
    >
      <GridItem v-for="(item,i) in layout"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :i="item.i"
      >
        <div>
          <div v-if="item.obj.error !== null">{{ item.obj.error }}</div>
          <ChartWidget v-else :data="item.obj.data" :options="item.obj.options"></ChartWidget>
        </div>


      </GridItem>
    </GridLayout>
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
import {GridLayout, GridItem} from "vue-grid-layout";
// ===================================================================
// https://jbaysolutions.github.io/vue-grid-layout/guide/properties.html#gridlayout
// https://jbaysolutions.github.io/vue-grid-layout/guide/08-responsive-predefined-layouts.html
// see also https://codepen.io/nyoung697/pen/BperoZ
// ===================================================================


@Component({
  components: {ChartWidget, DashboardDialog, GridLayout, GridItem}
})
export default class DashboardView extends VueBase {
  dashboard: Dashboard = null;
  items: any = [];
  widgets: any[] = [];
  dashboardId: string = null;
layout:any[]=[];
  draggable: boolean = true;
  resizable: boolean = true;
  responsive: boolean = false;

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

  breakpointChangedEvent(newBreakpoint, newLayout) {
  }

  async refreshWidgets() {
    this.widgets = await this.getWidgetTemplates();
    const g = await this.getGraph();

    const interpreter = new WidgetInterpreter(g);
    const widgets = this.dashboard.widgets;
    const result = interpreter.execute(widgets);
    if (result && result.length > 0) {
      // const blocks = [];
      // let currentBlock = [];
      // while (result.length > 0) {
      //   if (currentBlock.length >= 2) {
      //     blocks.push(currentBlock);
      //     currentBlock = [];
      //   }
      //   const item = result.shift();
      //   currentBlock.push(item);
      // }
      // if (currentBlock.length > 0) {
      //   blocks.push(currentBlock);
      // }
      this.items = result;
      this.layout = result.map((u, i) => {
        return {
          x: 2 * i,
          y: i,
          w: 1,
          h: 1,
          i: i,
          obj: u
        };
      });
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

<style>
.vue-grid-layout {
  background: #fff;
}

.vue-grid-item:not(.vue-grid-placeholder) {
  background: #fff;
  border: 1px solid silver;
  border-radius: 5px;
  padding: 5px;
}

.vue-grid-item .resizing {
  opacity: 0.9;
}

.vue-grid-item .static {
  background: #cce;
}

.vue-grid-item .text {
  font-size: 24px;
  text-align: center;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  height: 100%;
  width: 100%;
}

.vue-grid-item .no-drag {
  height: 100%;
  width: 100%;
}

.vue-grid-item .minMax {
  font-size: 12px;
}

.vue-grid-item .add {
  cursor: pointer;
}

.vue-draggable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  top: 0;
  left: 0;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><circle cx='5' cy='5' r='5' fill='#999999'/></svg>") no-repeat;
  background-position: bottom right;
  padding: 0 8px 8px 0;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: pointer;
}
</style>
