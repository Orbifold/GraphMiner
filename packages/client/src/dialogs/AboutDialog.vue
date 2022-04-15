<template>
  <v-dialog v-model="visible" persistent max-width="600px" @keydown.esc="hide()">
    <v-card>
      <v-card-title class="primary">
        <v-icon style="margin-right: 10px; color: white">mdi-information-outline</v-icon>
        <span style="color: white">About</span>
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <p>
                This is <strong>{{ name }}</strong> v{{ version }}, {{ date }}.
              </p>
              <p>For more information about GraphMiner, please contact</p>
            </v-col>
            <v-col cols="6">
              <p style="font-variant: small-caps">
                <v-icon>$mail</v-icon>
                <a target="_blank" href="mailto:info@orbifold.net" style="font-size: 14px; text-decoration: none"> Orbifold Consulting</a>
              </p>
              <p style="font-variant: small-caps">
                <v-icon>$link</v-icon>
                <a target="_blank" href="https://orbifold.net" style="font-size: 14px; text-decoration: none">Graphs & Networks</a>
              </p>
            </v-col>
            <v-col cols="6">
              <p style="font-variant: small-caps">
                <v-icon>$twitter</v-icon>
                <a target="_blank" href="https://twitter.com/theorbifold" style="font-size: 14px; text-decoration: none">Twitter</a>
              </p>
              <p style="font-variant: small-caps">
                <v-icon>$linkedin</v-icon>
                <a target="_blank" href="https://www.linkedin.com/in/francoisvanderseypen/" style="font-size: 14px; text-decoration: none">LinkedIn</a>
              </p>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <p>This application and all GraphMiner packages are licensed under GPL-3.0 and available on <a href="https://github.com/Orbifold/GraphMiner" target="_blank">Github</a>.</p>
              <p>For more information about the <strong>GraphMiner Enterprise version</strong>, please use the links above.</p>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="hide()">OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import * as _ from "lodash";

@Component({})
export default class AboutDialog extends Vue {
  visible: boolean = false;
  version: string = "";
  date: string = "";
  name: string = "";

  beforeMount() {
    this.version = this.$ambientService.graphMinerVersion;
    this.date = this.$ambientService.graphMinerDate;
    this.name = this.$ambientService.graphMinerName;
  }

  hide() {
    this.visible = false;
  }

  show() {
    this.visible = true;
  }

  mounted() {
  }
}
</script>
