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
		<splitpanes @resized="columnResized" style="height: calc(100vh - 165px)">
			<pane :size="showLeft ? sizeLeft : 0" min-size="0" max-size="30">
				<v-toolbar color="warning" light extended flat>
					<v-app-bar-nav-icon>
						<v-icon>$gears</v-icon>
					</v-app-bar-nav-icon>
					<v-toolbar-title class="white--text"> Left </v-toolbar-title>
					<v-spacer></v-spacer>
					<v-btn icon>
						<v-icon>$search</v-icon>
					</v-btn>
					<v-btn icon @click="showLeft = false">
						<v-icon>$close</v-icon>
					</v-btn>
					<template v-slot:extension>
						<v-btn fab color="cyan accent-2" bottom left absolute>
							<v-icon>mdi-plus</v-icon>
						</v-btn>
					</template>
				</v-toolbar>
			</pane>
			<pane :size="middleSize">
				<v-toolbar color="primary" light dense flat>
					<v-app-bar-nav-icon>
						<v-icon>$gears</v-icon>
					</v-app-bar-nav-icon>
					<v-toolbar-title class="white--text"> Main </v-toolbar-title>
					<v-spacer></v-spacer>
					<v-btn icon @click="showTop = !showTop">
						<v-icon>$panelTop</v-icon>
					</v-btn>
					<v-btn icon @click="showBottom = !showBottom">
						<v-icon>$panelBottom</v-icon>
					</v-btn>
				</v-toolbar>
				<splitpanes @resized="rowResized" horizontal>
					<pane :size="showTop ? sizeTop : 0" min-size="0" max-size="30">Top</pane>
					<pane :size="mainSize"> Main </pane>
					<pane :size="showBottom ? sizeBottom : 0" min-size="0" max-size="30">Bottom</pane>
				</splitpanes>
			</pane>
			<pane :size="showRight ? sizeRight : 0" min-size="0" max-size="30">
				<v-toolbar color="primary" light extended flat>
					<v-app-bar-nav-icon>
						<v-icon>$gears</v-icon>
					</v-app-bar-nav-icon>
					<v-toolbar-title class="white--text"> Left </v-toolbar-title>
					<v-spacer></v-spacer>
					<v-btn icon>
						<v-icon>$search</v-icon>
					</v-btn>
					<v-btn icon @click="showRight = !showRight">
						<v-icon>$close</v-icon>
					</v-btn>
					<template v-slot:extension>
						<v-btn fab color="cyan accent-2" bottom left absolute>
							<v-icon>mdi-plus</v-icon>
						</v-btn>
					</template>
				</v-toolbar>
			</pane>
		</splitpanes>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from "vue-property-decorator";
	import { Splitpanes, Pane } from "splitpanes";
	import "splitpanes/dist/splitpanes.css";

	@Component({
		components: { Splitpanes, Pane },
	})
	export default class BlankPage extends Vue {
		showRight: boolean = true;
		showLeft: boolean = true;
		showTop: boolean = true;
		showBottom: boolean = true;
		sizeLeft: number = 20;
		sizeRight: number = 20;
		sizeTop: number = 20;
		sizeBottom: number = 20;

		get middleSize() {
			return 100 - (this.showRight ? this.sizeRight : 0) - (this.showLeft ? this.sizeLeft : 0);
		}

		get mainSize() {
			return 100 - (this.showTop ? this.sizeTop : 0) - (this.showBottom ? this.sizeBottom : 0);
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
