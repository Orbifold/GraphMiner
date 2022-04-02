<template>
  <v-container v-if="project !== null">
    <h1>Project {{ project.name }}</h1>
    <v-divider class="my-2"></v-divider>
    <v-row></v-row>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import {Utils} from "@graphminer/utils";
import VueBase from "@/views/vueBase";

@Component({})
export default class ProjectView extends VueBase {
  project = null;

  async mounted() {
    await this.ensureActiveProject();
    this.project = await this.$dataService.getActiveProject();
  }
}
</script>

<style scoped></style>
