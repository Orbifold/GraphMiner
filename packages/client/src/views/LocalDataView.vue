<template>
  <div>
    <v-toolbar flat outlined>
      <v-toolbar-title>IDE Layout</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="showLeft = !showLeft">
        <v-icon>$panelLeft</v-icon>
      </v-btn>
      <v-btn icon @click="showRight = !showRight">
        <v-icon>$panelRight</v-icon>
      </v-btn>
    </v-toolbar>
    <splitpanes style="height: calc(100vh - 190px)" @resized="columnResized">
      <pane :size="showLeft ? sizeLeft : 0" max-size="30" min-size="0">
        <v-toolbar color="warning" extended flat light>
          <v-app-bar-nav-icon>
            <v-icon>$gears</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title class="white--text"> Left</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon>
            <v-icon>$search</v-icon>
          </v-btn>
          <v-btn icon @click="showLeft = false">
            <v-icon>$close</v-icon>
          </v-btn>
          <template v-slot:extension>
            <v-btn absolute bottom color="cyan accent-2" fab left>
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
        </v-toolbar>
      </pane>
      <pane :size="middleSize">
        <v-toolbar color="primary" dense flat light>
          <v-app-bar-nav-icon>
            <v-icon>$gears</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title class="white--text"> Local Data</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="showTop = !showTop">
            <v-icon>$panelTop</v-icon>
          </v-btn>
          <v-btn icon @click="showBottom = !showBottom">
            <v-icon>$panelBottom</v-icon>
          </v-btn>
        </v-toolbar>
        <splitpanes horizontal @resized="rowResized">
          <pane :size="showTop ? sizeTop : 0" max-size="30" min-size="0">Top</pane>
          <pane :size="mainSize">
            <v-btn class="ma-1" color="success" depressed @click="refresh">Refresh</v-btn>
            <v-data-table :headers="headers" :items="data" :items-per-page="5" class="elevation-0"></v-data-table>
          </pane>
          <pane :size="showBottom ? sizeBottom : 0" max-size="30" min-size="0">Bottom</pane>
        </splitpanes>
      </pane>
      <pane :size="showRight ? sizeRight : 0" max-size="30" min-size="0">
        <v-toolbar color="primary" extended flat light>
          <v-app-bar-nav-icon>
            <v-icon>$gears</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title class="white--text"> Left</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon>
            <v-icon>$search</v-icon>
          </v-btn>
          <v-btn icon @click="showRight = !showRight">
            <v-icon>$close</v-icon>
          </v-btn>
          <template v-slot:extension>
            <v-btn absolute bottom color="cyan accent-2" fab left>
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
        </v-toolbar>
      </pane>
    </splitpanes>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import {Pane, Splitpanes} from "splitpanes";
import "splitpanes/dist/splitpanes.css";
import {EntitySpace} from "@graphminer/entities";
import {Utils} from "@graphminer/utils";

@Component({
  components: {Splitpanes, Pane},
})
export default class LocalDataView extends Vue {
  showRight: boolean = false;
  showLeft: boolean = false;
  showTop: boolean = false;
  showBottom: boolean = false;
  sizeLeft: number = 20;
  sizeRight: number = 20;
  sizeTop: number = 20;
  sizeBottom: number = 20;
  space: EntitySpace = null;
  headers: any[] = [
    {
      text: "Name",
      align: "start",
      sortable: false,
      value: "name",
    },
  ];
  data: any[] = [];


  get middleSize() {
    return 100 - (this.showRight ? this.sizeRight : 0) - (this.showLeft ? this.sizeLeft : 0);
  }

  get mainSize() {
    return 100 - (this.showTop ? this.sizeTop : 0) - (this.showBottom ? this.sizeBottom : 0);
  }

  async mounted() {

    await this.refresh();

  }

  async refresh() {
    this.data = await this.$dataService.getAllProjects();
  }


  columnResized(e) {
    this.sizeLeft = e[0].size;
    this.sizeRight = e[2].size;
  }

  rowResized(e) {
    this.sizeTop = e[0].size;
    this.sizeBottom = e[2].size;
  }
}
</script>

<style></style>
