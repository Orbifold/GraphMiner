<template>
	<div>
		<v-toolbar flat outlined>
			<v-toolbar-title>Home</v-toolbar-title>
			<v-spacer></v-spacer>
			<v-btn icon @click="toggleLeft">
				<v-icon>mdi-chevron-left-box</v-icon>
			</v-btn>
			<v-btn icon @click="toggleRight">
				<v-icon>mdi-chevron-right-box</v-icon>
			</v-btn>
		</v-toolbar>

		<v-row style="height: calc(100vh - 150px)">
			<v-col v-if="showLeft" md="2" lg="2" sm="2" style="background-color: #18c426;" class="pa-0">
				<v-toolbar color="light-blue" light extended flat>
					<v-app-bar-nav-icon>
						<v-icon>$gears</v-icon>
					</v-app-bar-nav-icon>
					<v-toolbar-title class="white--text">
						Left
					</v-toolbar-title>
					<v-spacer></v-spacer>
					<v-btn icon>
						<v-icon>mdi-magnify</v-icon>
					</v-btn>
					<v-btn icon>
						<v-icon>mdi-view-module</v-icon>
					</v-btn>
					<template v-slot:extension>
						<v-btn fab color="cyan accent-2" bottom left absolute>
							<v-icon>mdi-plus</v-icon>
						</v-btn>
					</template>
				</v-toolbar>
			</v-col>
			<v-col style="background-color: #929292; " class="pa-0">
				<v-toolbar color="orange" flat dense>
					<v-toolbar-title class="white--text">
						Main
					</v-toolbar-title>
					<v-spacer></v-spacer>
					<v-btn icon>
						<v-icon>mdi-magnify</v-icon>
					</v-btn>
				</v-toolbar>
			</v-col>
			<v-col v-if="showRight" md="2" lg="2" sm="2" style="background-color: #ff00dd;" class="pa-0">
				<v-toolbar color="light-blue" light extended flat>
					<v-app-bar-nav-icon></v-app-bar-nav-icon>
					<v-toolbar-title class="white--text">
						Right
					</v-toolbar-title>
					<v-spacer></v-spacer>
					<v-btn icon>
						<v-icon>mdi-magnify</v-icon>
					</v-btn>
					<v-btn icon>
						<v-icon>mdi-view-module</v-icon>
					</v-btn>
					<template v-slot:extension>
						<v-btn fab color="cyan accent-2" bottom left absolute>
							<v-icon>mdi-plus</v-icon>
						</v-btn>
					</template>
				</v-toolbar>
			</v-col>
		</v-row>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from "vue-property-decorator";

	@Component({})
	export default class BlankPage extends Vue {
		showRight: boolean = true;
		showLeft: boolean = true;

		toggleRight() {
			this.showRight = !this.showRight;
		}

		toggleLeft() {
			this.showLeft = !this.showLeft;
		}
	}
</script>

<style scoped></style>
