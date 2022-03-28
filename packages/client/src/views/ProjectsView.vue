<template>
	<v-container>
		<h1>Projects</h1>
		<v-divider></v-divider>
		<v-row justify="space-around mt-5">
			<v-col cols="3" md="3">
				<v-card class="mx-auto" max-width="400" color="primary3 " flat>
					<v-card-title>Task Chain</v-card-title>
					<v-card-subtitle class="pb-0">
						<v-chip class="mt-2 mb-2" color="primary2" text-color="white" x-small>Testing</v-chip>
					</v-card-subtitle>
					<v-card-text class="text--primary">
						<div>A simple linear chain of tasks.</div>
					</v-card-text>

					<v-card-actions>
						<v-btn color="primary6" text> Open</v-btn>
						<v-btn color="secondary" text> Explore</v-btn>
					</v-card-actions>
				</v-card>
			</v-col>
		</v-row>
	</v-container>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from "vue-property-decorator";

	@Component({})
	export default class ProjectsView extends Vue {
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
