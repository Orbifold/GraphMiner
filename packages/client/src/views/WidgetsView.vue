<template>
  <v-container>

    <v-row justify="end">
      <v-col cols="3">
        <h1>Widget Templates</h1>
      </v-col>
      <v-col cols="2" offset="7">
        <v-btn class="float-right mt-3" depressed small @click="newWidgetTemplate">New Widget Template</v-btn>
      </v-col>
    </v-row>
    <v-divider class="mt-2 mb-6"></v-divider>

    <v-row>
      <v-card v-for="(item, i) in widgets" :key="i" class="mx-2 my-2" height="180" width="280" flat outlined>

        <v-card-title>
          <v-icon>$widget</v-icon>
          {{ item.name }}
        </v-card-title>
        <v-card-subtitle class="pb-0">
          <v-chip class="mt-2 mb-2" color="green darken" text-color="white" x-small>Widget</v-chip>
        </v-card-subtitle>
        <v-card-text class="text--primary">
          <div class="text-truncate"><i>{{ item.description || "&nbsp;" }}</i></div>
        </v-card-text>

        <v-card-actions>
          <v-btn color="primary6" text @click="editWidget(item.id)" title="Edit this widget"> Edit</v-btn>
          <v-btn color="primary6" text @click="duplicateWidget(item.id)" title="Duplicate this widget"> Duplicate</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="error" x-small icon depressed @click="deleteWidgetTemplate(item.id)" title="Delete this widget">
            <v-icon>$bin</v-icon>
          </v-btn>

        </v-card-actions>
      </v-card>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component} from "vue-property-decorator";
import {Utils} from "@graphminer/utils";
import {Project, WidgetTemplate} from "@graphminer/projects";
import VueBase from "@/views/vueBase";
import * as _ from "lodash";


@Component({
  components: {}
})
export default class WidgetsView extends VueBase {
  private widgets: WidgetTemplate[] = [];


  async mounted() {
    await this.refreshWidgets();
  }

  async refreshWidgets() {
    this.widgets = await this.$dataService.getWidgetTemplates();
  }

  editWidget(widgetId) {
    this.$ambientService.navigateTo({name: "WidgetEditor", query: {widgetId}});
  }

  async deleteWidgetTemplate(templateId) {
    const yn = await this.$ambientService.confirm("Delete Widget Template", "Are you sure?");
    if (yn) {
      await this.$dataService.removeWidgetTemplate(templateId);
      await this.refreshWidgets();
    }
  }

  async duplicateWidget(templateId) {
    await this.$dataService.duplicateWidgetTemplate(templateId);
    await this.refreshWidgets();
  }

  async newWidgetTemplate() {
    const t = await this.$dataService.addBlankWidgetTemplate();
    this.editWidget(t.id);

  }
}
</script>

<style>

</style>
