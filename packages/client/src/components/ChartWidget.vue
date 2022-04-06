<template>
	<div v-if="data && options && options.chart && options.chart.type">
		<Chart :options="options" :series="data"></Chart>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue, Watch } from "vue-property-decorator";
	import { identity } from "lodash";
	import { Utils } from "@graphminer/utils";

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
		chartOptions: any = null;

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
			if (Utils.isEmpty(this.options)) {
				return;
			}
			this.chartOptions = this.options;
		}
	}
</script>

<style scoped></style>
