<template>
  <div>
    <v-toolbar flat outlined>
      <v-toolbar-title>
        <v-icon>$flask</v-icon>
        {{ project.name }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="gotoProject" title="Go to the project page">
        <v-icon>$dashboard</v-icon>
      </v-btn>
      <v-btn icon @click="showLeft = !showLeft" title="Toggle the left side panel">
        <v-icon>$panelLeft</v-icon>
      </v-btn>
      <v-btn icon @click="showRight = !showRight" title="Toggle the right side panel">
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
          <v-toolbar-title class="blue--text"></v-toolbar-title>

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
            <div id="diagramHost" style="z-index: 2; border: 1px solid black; width: 100%; height: 80vh; cursor: auto; background-color: rgba(255, 255, 255, 0.9)">
              <canvas height="600" tabindex="0" width="800">This text is displayed if your browser does not support the Canvas HTML element.</canvas>
              <div style="overflow: auto; width: 800px; height: 600px; z-index: 1">
                <div style="width: 1px; height: 1px"></div>
              </div>
            </div>
          </pane>
          <pane :size="showBottom ? sizeBottom : 0" max-size="30" min-size="0">Bottom</pane>
        </splitpanes>
      </pane>
      <pane :size="showRight ? sizeRight : 0" max-size="30" min-size="0">
        <v-toolbar color="primary" flat>
          <v-toolbar-title class="white--text"> Properties</v-toolbar-title>
          <v-spacer></v-spacer>

          <v-btn icon @click="showRight = !showRight">
            <v-icon>$close</v-icon>
          </v-btn>
          <template v-slot:extension>
            <v-btn v-if="nodeData !== null" color="success accent-2" depressed fab right title="Add a new value property" x-small>
              <v-icon>$plus</v-icon>
            </v-btn>
            <v-btn v-if="nodeData !== null || linkData !== null" class="ml-2" color="error accent-2" depressed fab right title="Delete this entity type" x-small>
              <v-icon>$bin</v-icon>
            </v-btn>
          </template>
        </v-toolbar>

        <div class="pa-2">
          <p>WIP</p>
        </div>
      </pane>
    </splitpanes>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import {Pane, Splitpanes} from "splitpanes";
import "splitpanes/dist/splitpanes.css";
import * as go from "gojs";
import {Utils} from "@graphminer/utils";
import * as _ from "lodash";
import {NotificationType} from "@/shared/notificationType";
import VueBase from "@/views/vueBase";

const $ = go.GraphObject.make;

class ContinuousForceDirectedLayout extends go.ForceDirectedLayout {
  private _isObserving: Boolean = false;

  isFixed(v) {
    return v.node.isSelected;
  }

  // optimization: reuse the ForceDirectedNetwork rather than re-create it each time
  doLayout(coll) {
    if (!this._isObserving) {
      this._isObserving = true;
      // cacheing the network means we need to recreate it if nodes or links have been added or removed or relinked,
      // so we need to track structural model changes to discard the saved network.
      this.diagram.addModelChangedListener((e) => {
        // modelChanges include a few cases that we don't actually care about, such as
        // "nodeCategory" or "linkToPortId", but we'll go ahead and recreate the network anyway.
        // Also clear the network when replacing the model.
        if (e.modelChange !== "" || (e.change === go.ChangedEvent.Transaction && e.propertyName === "StartingFirstTransaction")) {
          this.network = null;
        }
      });
    }
    let net = this.network;
    if (net === null) {
      // the first time, just create the network as normal
      this.network = net = this.makeNetwork(coll);
    } else {
      // but on reuse we need to update the LayoutVertex.bounds for selected nodes
      this.diagram.nodes.each((n) => {
        const v = net.findVertex(n);
        if (v !== null) v.bounds = n.actualBounds;
      });
    }
    // now perform the normal layout
    super.doLayout(coll);
    // doLayout normally discards the LayoutNetwork by setting Layout.network to null;
    // here we remember it for next time
    this.network = net;
  }


}

@Component({
  components: {Splitpanes, Pane}
})
export default class ExploreView extends VueBase {
  // region Fields
  showRight: boolean = true;
  showLeft: boolean = false;
  showTop: boolean = false;
  showBottom: boolean = false;
  sizeLeft: number = 20;
  sizeRight: number = 20;
  sizeTop: number = 20;
  sizeBottom: number = 20;
  valueProperties: any[] = [];

  nodeName: string = null;
  dataTypes: string[] = ["String", "Number", "Boolean"];
  private diagram: go.Diagram;
  private nodeData: any = null;

  // endregion

  //region Properties
  private linkData: any = null;

  get middleSize() {
    return 100 - (this.showRight ? this.sizeRight : 0) - (this.showLeft ? this.sizeLeft : 0);
  }

  get mainSize() {
    return 100 - (this.showTop ? this.sizeTop : 0) - (this.showBottom ? this.sizeBottom : 0);
  }

  // endregion

  //region Methods
  async mounted() {
    await this.ensureActiveProject();
    this.createDiagram();
  }

  columnResized(e) {
    this.sizeLeft = e[0].size;
    this.sizeRight = e[2].size;
  }

  rowResized(e) {
    this.sizeTop = e[0].size;
    this.sizeBottom = e[2].size;
  }

  createDiagram() {
    /**
     * The main options of the diagram control.
     */
    const options = {
      initialAutoScale: go.Diagram.Uniform,
      contentAlignment: go.Spot.Center,
      "undoManager.isEnabled": true,
      "draggingTool.dragsLink": false,

      // layout: $(go.LayeredDigraphLayout, {
      // 	direction: 90,
      // 	layerSpacing: 10,
      // 	columnSpacing: 15,
      // 	setsPortSpots: false,
      // }),
      // layout: $(go.ForceDirectedLayout),
      layout: $(
          ContinuousForceDirectedLayout, // automatically spread nodes apart while dragging
          {defaultSpringLength: 180, defaultElectricalCharge: 140}
      ),
      // do an extra layout at the end of a move
      SelectionMoved: (e) => e.diagram.layout.invalidateLayout()
    };
    this.diagram = $(go.Diagram, document.getElementById("diagramHost") as HTMLDivElement, options);
    this.diagram.undoManager.isEnabled = true;
    this.diagram.maxScale = 3;
    this.diagram.minScale = 0.3;

    this.createNodeTemplate();
    this.createLinkTemplate();
    this.createGraphModel();
    this.createInteractions();
  }

  createInteractions() {
  }

  async createGraphModel() {
    const json = await this.$dataService.getSpaceAsGraphJson(this.project.id);
    const nodeData = json.nodes.map((n) => {
      return {
        key: n.id,
        name: n.name
      };
    });
    const linkData = json.edges.map((e) => {
      return {
        from: e.sourceId,
        to: e.targetId,
        name: e.name
      };
    });
    this.diagram.model = new go.GraphLinksModel({
      copiesArrays: true,
      copiesArrayObjects: true,
      nodeDataArray: nodeData,
      linkDataArray: linkData
    });
    window["model"] = this.diagram.model;
  }

  createLinkTemplate() {
    this.diagram.linkTemplate = $(
        go.Link, // the whole link panel
        {curve: go.Link.Bezier, toShortLength: 2},
        $(
            go.Shape, // the link shape
            {strokeWidth: 1.0, stroke: "#3e5d8c"}
        ),
        $(
            go.Shape, // the arrowhead
            {toArrow: "Standard", stroke: null, fill: "#6781FF"}
        )
    );
  }

  createNodeTemplate() {
    this.diagram.nodeTemplate = $(go.Node, go.Panel.Auto, {locationSpot: go.Spot.Center}, new go.Binding("location", "loc", go.Point.parse), $(go.Shape, {figure: "Circle", stroke: "#3e5d8c", fill: "#6781FF"}, new go.Binding("fill", "color")), $(go.TextBlock, {font: "bold 11pt sans-serif", stroke: "rgba(255,255,255,0.5)"}, new go.Binding("text", "name")));
  }

  gotoProject() {
    this.$ambientService.navigateTo("Project");
  }

  //endregion
}
</script>

<style scoped></style>
