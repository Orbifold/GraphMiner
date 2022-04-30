<template>
  <v-container v-if="dashboard">
    <DashboardDialog ref="dashboardDialog"></DashboardDialog>
    <v-row justify="space-between">
      <v-col cols="2"
      >
        <h1>
          <v-icon>$dashboard</v-icon>
          {{ dashboard.name }}
          <v-btn color="error" x-small icon depressed @click="deleteDashboard" title="Delete this dashboard">
            <v-icon>$bin</v-icon>
          </v-btn>
          <v-btn x-small icon depressed @click="editDashboard" title="Edit this dashboard">
            <v-icon>$pen</v-icon>
          </v-btn>
          <v-btn x-small icon depressed @click="refreshWidgets" title="Refresh this dashboard">
            <v-icon>$refresh</v-icon>
          </v-btn>
        </h1>
        <div title="Back to the project page" style="cursor: pointer" @click="gotoProject">Project: {{ project.name }}</div>
      </v-col
      >
      <v-col>
        <div class="truncated-text"> {{ dashboard.description }}</div>
      </v-col>
      <v-col cols="2" class="d-flex flex-column">

        <v-switch v-model="editMode" label="Edit Mode" style="float:right"></v-switch>
        <v-menu offset-y style="z-index: 20" v-if="editMode" right>
          <template v-slot:activator="{ on, attrs }">
            <v-btn color="primary" v-bind="attrs" v-on="on" depressed class="float-right"> Add Widget</v-btn>
          </template>
          <v-list>
            <v-list-item v-for="(item, index) in widgetTemplates" :key="index" @click="addWidget(item)">
              <v-list-item-title>{{ item.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-col>
    </v-row>
    <v-divider class="mt-2 mb-2"></v-divider>


    <GridLayout
        :layout="layout"
        :col-num="12"
        :row-height="30"
        :is-draggable="draggable"
        :is-resizable="resizable"
        :vertical-compact="true"
        :use-css-transforms="true"
        :responsive="responsive"
        style="border:1px solid silver; height: 100vh"
    >
      <GridItem v-for="(item,i) in layout"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :i="item.i"
          :static="!editMode"
          @resized="resized"
          @moved="moved"
          style="display: flex; overflow: hidden;padding: 7px;"
      >
        <!--        <div style="background-color: #18c426; flex-grow: 1">-->

        <div v-if="item.obj.error !== null">{{ item.obj.error }}</div>
        <ChartWidget v-else :data="item.obj.data" :options="item.obj.options"></ChartWidget>


        <!--          <span>Widget {{ item.i }}</span>-->
        <div v-if="editMode" class="widget-delete">
          <button title="Delete this widget from the dashboard" style="  color:orangered; margin: 0 5px;z-index: 50;" @click="removeItem(item.i)"><i style="font-size: 30px; margin:0 4px" class="mdi mdi-delete"></i></button>
        </div>


      </GridItem>
    </GridLayout>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";
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
  widgetTemplates: any[] = [];
  dashboardId: string = null;
  widgets: any[] = [];
  layout: any[] = [];
  draggable: boolean = true;
  resizable: boolean = true;
  responsive: boolean = false;
  editMode: boolean = false;

  async mounted() {
    await this.ensureActiveProject();
    this.dashboardId = this.$ambientService.getQueryParameter("dashboardId");
    if (Utils.isEmpty(this.dashboardId)) {
      // this.$ambientService.notify("No dashboard id specified.", NotificationType.Error);
      // await new Promise((r) => setTimeout(r, 2000));
      return this.$ambientService.navigateTo("Projects");
    }


    await this.refreshTemplateList();
    await this.refreshWidgets();

    setTimeout(() => {
      this.refreshWidgets();
    }, 500);
  }


  async refreshTemplateList() {
    this.widgetTemplates = await this.getWidgetTemplates();
  }

  async refreshWidgets() {
    const found = _.find(this.project.dashboards, (d) => d.id === this.dashboardId);
    if (Utils.isEmpty(found)) {
      this.$ambientService.notify("The specified dashboard does not exist.", NotificationType.Error);
      await new Promise((r) => setTimeout(r, 2000));
      return this.$ambientService.navigateTo("Projects");
    }
    this.dashboard = found;
    this.widgets = this.dashboard.widgets;

    const g = await this.getGraph();

    const interpreter = new WidgetInterpreter(g);

    const result = interpreter.execute(this.widgets);
    if (result && result.length > 0) {

      this.layout = this.widgets.map((w, j) => {
        return {
          x: w.layout.x,
          y: w.layout.y,
          i: w.layout.index,
          w: w.layout.w,
          h: w.layout.h,
          obj: result[j]
        };
      });
    } else {
      this.widgets = [];
    }
  }

  @Watch("editMode")
  editModeChanged() {
    if (!this.editMode) {
      this.refreshWidgets();
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

  /**
   * Returns the name and id of all templates.
   * @returns {Promise<{name,id}>}
   */
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

  async resized(i, h, w, hpx, wpx) {
    await this.saveLayout();
  }

  async moved(i, x, y) {
    await this.saveLayout();
  }

  async saveLayout() {
    this.layout.forEach(l => {
      const w = this.getWidgetByIndex(l.i);
      w.layout = {
        index: l.i,
        x: l.x,
        y: l.y,
        w: l.w,
        h: l.h
      };
    });
    await this.$dataService.upsertProject(this.project);

  }

  getWidgetByIndex(index) {
    return _.find(this.widgets, w => w.layout.index === index);
  }


  async removeItem(index) {

    const coll = [];
    this.widgets.forEach(w => {
      if (w.layout.index !== index) {
        coll.push(w);
      }
    });
    this.widgets = coll;
    this.dashboard.widgets = coll;
    this.layout.splice(this.layout.map(item => item.i).indexOf(index), 1);

    await this.saveLayout();
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
