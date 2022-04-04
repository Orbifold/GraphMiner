<template>
  <v-container v-if="dashboard">
    <h1>{{ dashboard.name }}</h1>
    <v-row>
      <v-col cols="6">
        <ChartWidget v-if="data.length>0" :data="data" :options="options"></ChartWidget>
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

@Component({
  components: {ChartWidget}
})
export default class DashboardView extends VueBase {
  dashboard: Dashboard = null;
  data: any = [];
  options: any = {};

  async mounted() {
    await this.ensureActiveProject();
    const dashboardId = this.$ambientService.getQueryParameter("dashboardId");
    if (Utils.isEmpty(dashboardId)) {
      this.$ambientService.notify("No dashboard id specified.", NotificationType.Error);
      await new Promise(r => setTimeout(r, 2000));
      return this.$ambientService.navigateTo("Projects");
    }

    const found = _.find(this.project.dashboards, (d) => d.id === dashboardId);
    if (Utils.isEmpty(found)) {
      this.$ambientService.notify("The specified dashboard does not exist.", NotificationType.Error);
      await new Promise(r => setTimeout(r, 2000));
      return this.$ambientService.navigateTo("Projects");
    }
    this.dashboard = found;

    const g = await this.getGraph();
    let hist = g.degreeHistogram().map(u => Math.round(u[1]));
    console.log(hist);
    this.data = [{
      name: "degrees",
      data: hist
    }];
    this.options = {
      chart: {
        height: 350,
        type: "bar"
      },
      title: {
        text: 'Degree distribution'
      },
      theme: {
        palette: "palette6" // upto palette10
      }
    };
  }

  async getGraph() {
    await this.ensureActiveProject();
    return await this.$dataService.getGraph(this.project.id);
  }
}
</script>

<style scoped></style>
