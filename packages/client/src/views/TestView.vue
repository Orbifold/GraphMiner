<template>
  <v-container>
    <ChartWidget :data="data" :options="options"></ChartWidget>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import {Utils} from "@graphminer/utils";
import VueBase from "@/views/vueBase";
import ChartWidget from "@/components/ChartWidget.vue";


@Component({
  components: {ChartWidget}
})
export default class TestView extends VueBase {
  data: any = null;
  options: any = null;

  async mounted() {
    this.options = {
      chart: {
        height: 350,
        type: "pie",
        stacked: false
      },
      dataLabels: {
        enabled: false
      }

    };
    this.data = [4, 5, 1, 2, 3];
  }

}
</script>

<style scoped></style>
