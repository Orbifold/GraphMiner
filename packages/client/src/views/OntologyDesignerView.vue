<template>
	<div>
		<!--<editor-fold desc="Dialogs">-->
		<v-dialog v-model="showDeleteDialog" max-width="400px" @keydown.enter="confirmedDeletePropertyValue">
			<v-card>
				<v-card-title class="text-body-1">Are you sure you want to delete this item?</v-card-title>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="blue darken-1" text @click="cancelDeletePropertyValue">Cancel</v-btn>
					<v-btn color="blue darken-1" text @click="confirmedDeletePropertyValue">OK</v-btn>
					<v-spacer></v-spacer>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<v-dialog v-model="showEditDialog" max-width="500px">
			<v-card>
				<v-card-title>
					<span class="text-h5">Value Property</span>
				</v-card-title>

				<v-card-text>
					<v-container v-if="valueProperty !== null">
						<v-row>
							<v-col cols="12" md="4" sm="6">
								<v-text-field v-model="valueProperty.name" autofocus label="Name" @keyup.enter="saveValueProperty"></v-text-field>
							</v-col>
							<v-col cols="12" md="4" sm="6">
								<v-select v-model="valueProperty.type" :items="dataTypes" label="Data Type" @keyup.enter="saveValueProperty"></v-select>
							</v-col>
						</v-row>
					</v-container>
				</v-card-text>

				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="blue darken-1" text @click="showEditDialog = false"> Cancel</v-btn>
					<v-btn color="blue darken-1" text @click="saveValueProperty"> Save</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<!--</editor-fold>-->
		<v-toolbar flat outlined>
			<v-toolbar-title>Ontology Designer</v-toolbar-title>
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
					<v-toolbar-title class="blue--text"></v-toolbar-title>
					<v-btn depressed small @click="addEntityType">
						<v-icon>$plus</v-icon>
						Add Type
					</v-btn>
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
						<div id="diagramHost" style="z-index: 2; border: 1px solid black; width: 100%; height: 80vh; cursor: auto; background-color: rgba(255, 255, 255, 0.53)">
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
						<v-btn v-if="nodeData !== null" color="success accent-2" depressed fab right title="Add a new value property" x-small @click="addValueProperty">
							<v-icon>$plus</v-icon>
						</v-btn>
						<v-btn v-if="nodeData !== null || linkData !== null" class="ml-2" color="error accent-2" depressed fab right title="Delete this entity type" x-small @click="deleteSelection">
							<v-icon>$bin</v-icon>
						</v-btn>
					</template>
				</v-toolbar>
				<div v-if="nodeData !== null" class="pa-2">
					<v-text-field v-model="nodeName" class="mt-2" label="Name" @blur="entityNameChanged" @keyup.enter="entityNameChanged"></v-text-field>
					<v-data-table :headers="propertyHeaders" :items="valueProperties" class="mt-2" hide-default-footer>
						<template v-slot:item.actions="{ item }">
							<v-icon class="mr-2" small @click="editPropertyValue(item)"> mdi-pencil</v-icon>
							<v-icon small @click="deletePropertyValue(item)"> mdi-delete</v-icon>
						</template>
					</v-data-table>
				</div>
				<div v-else-if="linkData !== null">
					<v-text-field v-model="linkName" class="mt-2" label="Name" @blur="linkNameChanged" @keyup.enter="linkNameChanged"></v-text-field>
				</div>
				<div v-else class="pa-2">
					<p>Click on an item to see its properties here.</p>
				</div>
			</pane>
		</splitpanes>
	</div>
</template>

<script lang="ts">
	import { Component, Vue } from "vue-property-decorator";
	import { Pane, Splitpanes } from "splitpanes";
	import "splitpanes/dist/splitpanes.css";
	import * as go from "gojs";
	import { Utils } from "@graphminer/utils";
	import * as _ from "lodash";

	const $ = go.GraphObject.make;
	@Component({
		components: { Splitpanes, Pane },
	})
	export default class OntologyDesignerView extends Vue {
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
		propertyHeaders: any[] = [
			{
				text: "Name",
				align: "start",
				sortable: false,
				value: "name",
			},
			{
				text: "Type",
				align: "start",
				sortable: false,
				value: "type",
			},
			{ text: "Actions", value: "actions", sortable: false },
		];
		nodeName: string = null;
		dataTypes: string[] = ["String", "Number", "Boolean"];
		private diagram: go.Diagram;
		private nodeData: any = null;
		private showDeleteDialog: boolean = false;
		private showEditDialog: boolean = false;
		private valueProperty: any = null;
		// endregion

		//region Properties
		private linkName: string = null;
		private linkData: any = null;

		get middleSize() {
			return 100 - (this.showRight ? this.sizeRight : 0) - (this.showLeft ? this.sizeLeft : 0);
		}

		get mainSize() {
			return 100 - (this.showTop ? this.sizeTop : 0) - (this.showBottom ? this.sizeBottom : 0);
		}

		// endregion

		//region Methods
		mounted() {
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
				"undoManager.isEnabled": true,
				"draggingTool.dragsLink": true,
				BackgroundSingleClicked: this.diagramCanvasClick,

				layout: $(go.LayeredDigraphLayout, {
					setsPortSpots: true,
				}),
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
			this.diagram.commandHandler.doKeyDown = () => {
				const e = this.diagram.lastInput;
				const cmd = this.diagram.commandHandler;
				if (e.key === "Del") {
					this.deleteSelection();
				} else {
					// call base method with no arguments
					go.CommandHandler.prototype.doKeyDown.call(cmd);
				}
			};
		}

		createGraphModel() {
			this.diagram.model = new go.GraphLinksModel({
				copiesArrays: true,
				copiesArrayObjects: true,
				nodeDataArray: [
					{
						key: "person",
						name: "Person",
						properties: [{ key: "name", name: "name", type: "String" }],
						methods: [],
					},
					{
						key: "car",
						name: "Car",
						properties: [{ name: "brand", type: "String" }],
						methods: [],
					},
				],
				linkDataArray: [{ from: "person", to: "car", name: "knows" }],
			});
		}

		createLinkTemplate() {
			this.diagram.linkTemplate = $(
				go.Link,
				{
					routing: go.Link.Bezier,
					click: this.linkClick,
				},
				// new go.Binding("isLayoutPositioned", "relationship", convertIsTreeLink),
				$(go.Shape),
				$(go.Shape, { toArrow: "Triangle", scale: 0.8, strokeWidth: 0 }),
				$(go.Shape, { fromArrow: "Circle", scale: 0.8, strokeWidth: 0 }),
				$(
					go.TextBlock, // show the path object name
					{ segmentOffset: new go.Point(0, 12) },
					new go.Binding("text", "name"),
				),
				// $(go.Shape, { scale: 1.3, fill: "red" },
				//   new go.Binding("fromArrow", "relationship", convertFromArrow)),
				// $(go.Shape, { scale: 1.3, fill: "white" },
				//   new go.Binding("toArrow", "relationship", convertToArrow))
			);
		}

		createNodeTemplate() {
			function convertVisibility(v) {
				switch (v) {
					case "public":
						return "+";
					case "private":
						return "-";
					case "protected":
						return "#";
					case "package":
						return "~";
					default:
						return v;
				}
			}

			var propertyTemplate = $(
				go.Panel,
				"Horizontal",
				// property visibility/access
				$(go.TextBlock, { isMultiline: false, editable: false, width: 12 }, new go.Binding("text", "visibility", convertVisibility)),
				// property name, underlined if scope=="class" to indicate static property
				$(go.TextBlock, { isMultiline: false, editable: true }, new go.Binding("text", "name").makeTwoWay(), new go.Binding("isUnderline", "scope", (s) => s[0] === "c")),
				// property type, if known
				$(go.TextBlock, "", new go.Binding("text", "type", (t) => (t ? ": " : ""))),
				$(go.TextBlock, { isMultiline: false, editable: true }, new go.Binding("text", "type").makeTwoWay()),
				// property default value, if any
				$(go.TextBlock, { isMultiline: false, editable: false }, new go.Binding("text", "default", (s) => (s ? " = " + s : ""))),
			);

			// the item template for methods
			var methodTemplate = $(
				go.Panel,
				"Horizontal",
				// method visibility/access
				$(go.TextBlock, { isMultiline: false, editable: false, width: 12 }, new go.Binding("text", "visibility", convertVisibility)),
				// method name, underlined if scope=="class" to indicate static method
				$(go.TextBlock, { isMultiline: false, editable: true }, new go.Binding("text", "name").makeTwoWay(), new go.Binding("isUnderline", "scope", (s) => s[0] === "c")),
				// method parameters
				$(
					go.TextBlock,
					"()",
					// this does not permit adding/editing/removing of parameters via inplace edits
					new go.Binding("text", "parameters", function (parr) {
						var s = "(";
						for (var i = 0; i < parr.length; i++) {
							var param = parr[i];
							if (i > 0) s += ", ";
							s += param.name + ": " + param.type;
						}
						return s + ")";
					}),
				),
				// method return type, if any
				$(go.TextBlock, "", new go.Binding("text", "type", (t) => (t ? ": " : ""))),
				$(go.TextBlock, { isMultiline: false, editable: true }, new go.Binding("text", "type").makeTwoWay()),
			);

			this.diagram.nodeTemplate = $(
				go.Node,
				"Auto",
				{
					locationSpot: go.Spot.Center,
					fromSpot: go.Spot.Default,
					toSpot: go.Spot.Default,
					click: this.entityClick,
				},
				$(go.Shape, "RoundedRectangle", {
					fill: "lightyellow",
					cursor: "pointer",
					portId: "",
					fromLinkable: true,
					fromLinkableSelfNode: true,
					fromLinkableDuplicates: true,
					toLinkable: true,
					toLinkableSelfNode: true,
					toLinkableDuplicates: true,
				}),

				$(
					go.Panel,
					"Table",
					{ defaultRowSeparatorStroke: "black" },
					// header
					$(
						go.TextBlock,
						{
							row: 0,
							columnSpan: 2,
							margin: 3,
							alignment: go.Spot.Center,
							font: "bold 12pt sans-serif",
							isMultiline: false,
							editable: true,
						},
						new go.Binding("text", "name").makeTwoWay(),
					),
					// properties
					$(go.TextBlock, "Properties", { row: 1, font: "italic 10pt sans-serif" }, new go.Binding("visible", "visible", (v) => !v).ofObject("PROPERTIES")),
					$(go.Panel, "Vertical", { name: "PROPERTIES" }, new go.Binding("itemArray", "properties"), {
						row: 1,
						margin: 3,
						stretch: go.GraphObject.Fill,
						defaultAlignment: go.Spot.Left,
						background: "lightyellow",
						itemTemplate: propertyTemplate,
					}),
					$("PanelExpanderButton", "PROPERTIES", { row: 1, column: 1, alignment: go.Spot.TopRight, visible: false }, new go.Binding("visible", "properties", (arr) => arr.length > 0)),
					// methods
					$(go.TextBlock, "Methods", { row: 2, font: "italic 10pt sans-serif" }, new go.Binding("visible", "visible", (v) => !v).ofObject("METHODS")),
					$(go.Panel, "Vertical", { name: "METHODS" }, new go.Binding("itemArray", "methods"), {
						row: 2,
						margin: 3,
						stretch: go.GraphObject.Fill,
						defaultAlignment: go.Spot.Left,
						background: "lightyellow",
						itemTemplate: methodTemplate,
					}),
					$("PanelExpanderButton", "METHODS", { row: 2, column: 1, alignment: go.Spot.TopRight, visible: false }, new go.Binding("visible", "methods", (arr) => arr.length > 0)),
				),
			);
		}

		addEntityType() {
			const key = Utils.randomInteger();
			this.diagram.model.addNodeData({
				key,
				name: "Entity " + key,
				properties: [{ name: "name", type: "String", visibility: "public" }],
				methods: [],
			});
		}

		entityClick(e, obj) {
			this.linkName = null;
			this.linkData = null;
			this.nodeName = obj.data.name;
			this.nodeData = obj.data;
			this.valueProperties = obj.data.properties;
		}

		editPropertyValue(property) {
			this.valueProperty = _.clone(property);
			this.showEditDialog = true;
		}

		deletePropertyValue(obj) {
			this.valueProperty = obj;
			this.showDeleteDialog = true;
		}

		saveEntity(data) {}

		cancelDeletePropertyValue() {
			this.showDeleteDialog = false;
		}

		getValuePropertiesExcludingCurrent() {
			const coll = [];
			for (const property of this.nodeData.properties) {
				if (property.key !== this.valueProperty.key) {
					coll.push({
						key: property.key,
						name: property.name,
						type: property.type,
					});
				}
			}
			return coll;
		}

		confirmedDeletePropertyValue() {
			const coll = this.getValuePropertiesExcludingCurrent();

			this.diagram.model.setDataProperty(this.nodeData, "properties", coll);
			this.valueProperties = coll;
			this.showDeleteDialog = false;
		}

		entityNameChanged() {
			this.diagram.model.setDataProperty(this.nodeData, "name", this.nodeName);
		}

		saveValueProperty() {
			if (this.valueProperty.key) {
				const coll = this.getValuePropertiesExcludingCurrent();
				coll.push({
					key: this.valueProperty.key,
					name: this.valueProperty.name,
					type: this.valueProperty.type,
				});
				this.diagram.model.setDataProperty(this.nodeData, "properties", coll);
				this.valueProperties = coll;
				this.showEditDialog = false;
			} else {
				this.valueProperties.push({
					key: Utils.id(),
					name: this.valueProperty.name,
					type: this.valueProperty.type,
				});
				this.diagram.model.setDataProperty(this.nodeData, "properties", _.clone(this.valueProperties));
				this.showEditDialog = false;
			}
		}

		addValueProperty() {
			this.valueProperty = {
				key: null,
				name: "",
				type: "String",
			};
			this.showEditDialog = true;
		}

		diagramCanvasClick() {
			this.nodeName = null;
			this.nodeData = null;
			this.linkName = null;
			this.linkData = null;
		}

		linkClick(e, obj) {
			this.nodeName = null;
			this.nodeData = null;
			this.linkName = obj.data.name;
			this.linkData = obj.data;
		}

		linkNameChanged() {
			this.diagram.model.setDataProperty(this.linkData, "name", this.linkName);
		}

		deleteSelection(confirm = true) {
			if (confirm) {
				const items = this.diagram.selection.toArray();
				if (items.length === 0) {
					return;
				}
				const nodes = items.filter((u) => u instanceof go.Node);
				const links = items.filter((u) => u instanceof go.Link);
				let message;
				if (links.length === 0) {
					if (nodes.length === 1) {
						message = `Deletion of one entity type.`;
					} else {
						message = `Deletion of ${nodes.length} entity types.`;
					}
				} else {
					if (nodes.length === 0) {
						if (links.length === 1) {
							message = "Deletion of a link.";
						} else {
							message = "Deletion of multiple links.";
						}
					} else {
						message = "Deletion of selection.";
					}
				}
				this.$ambientService.confirm("Are you sure?", message).then((yn) => {
					if (yn === true) {
						this.deleteSelection(false);
					}
				});
			} else {
				// ensures that the property panel is blank
				this.linkData = null;
				this.linkName = null;
				this.nodeData = null;
				this.nodeName = null;

				const items = this.diagram.selection.toArray();
				const nodes: go.Node[] = items.filter((u) => u instanceof go.Node) as go.Node[];
				const links: go.Link[] = items.filter((u) => u instanceof go.Link) as go.Link[];

				for (const node of nodes) {
					// the links are not automatically removed
					const connectedLinks = node.findLinksConnected().iterator;
					while (connectedLinks.next()) {
						const link = connectedLinks.value;
						if (
							!_.includes(
								links.map((l) => l.data.key),
								link.data.key,
							)
						) {
							links.push(link);
						}
					}
					this.diagram.model.removeNodeData(node.data);
				}
				for (const link of links) {
					(this.diagram.model as go.GraphLinksModel).removeLinkData(link.data);
				}
			}
		}

		//endregion
	}
</script>

<style scoped></style>
