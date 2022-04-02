<template>
  <v-container v-if="dashboard">
    <h1>{{ dashboard.name }}</h1>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import {Utils} from "@graphminer/utils";
import VueBase from "@/views/vueBase";
import * as _ from "lodash";
import {NotificationType} from "@/shared/notificationType";
import {Project, Dashboard} from "@graphminer/projects";

@Component({})
export default class DashboardView extends VueBase {
  dashboard: Dashboard = null;

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

  }

}
</script>

<style scoped></style>
