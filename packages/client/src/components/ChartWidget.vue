<template>
  <div>
    <apexchart     :options="options" :series="data"></apexchart>
  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";

@Component({
  components: {}
})
export default class ChartWidget extends Vue {
  @Prop() data: any;
  @Prop() options: any;
  google: any = null;
  chartData: any = [];
  chartOptions: any = null;

  mounted(){
    this.onNewData()
    this.onNewOptions()
  }
  @Watch("data")
  onNewData() {
    this.chartData = this.data || [];
  }

  @Watch("options")
  onNewOptions() {
    this.chartOptions = this.options || {};
  }


}
</script>

<style scoped>

</style>
