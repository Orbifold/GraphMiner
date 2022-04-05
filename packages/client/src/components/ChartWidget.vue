<template>
	<div v-if="data !== null">
		<apexchart :options="options" :series="data"></apexchart>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue, Watch } from "vue-property-decorator";
	// ===================================================================
	// See the Apexchart docs
	// https://apexcharts.com/docs/series/
	// ===================================================================
	@Component({
		components: {},
	})
	export default class ChartWidget extends Vue {
		@Prop() data: any;
		@Prop() options: any;
		chartData: any = [];
		chartOptions: any = {
			chart: {
				height: 350,
				type: "bar",
			},
		};

		mounted() {
			this.refresh();
		}

		refresh() {
			this.onNewData();
			this.onNewOptions();
		}

		@Watch("data")
		onNewData() {
			this.chartData = this.data || [];
		}

		@Watch("options")
		onNewOptions() {
			this.chartOptions = this.options || {
				chart: {
					height: 350,
					type: "bar",
				},
			};
		}
	}
</script>

<style scoped></style>
