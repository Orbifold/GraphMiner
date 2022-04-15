<template>
  <v-dialog v-model="visible" persistent max-width="600px" @keydown.esc="cancel()">

    <v-card>
      <v-card-title class="primary">
        <v-icon style="margin-right: 10px; color: white">mdi-information-outline</v-icon>
        <span style="color: white">Project</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form"
            v-model="valid"

        >
          <v-container>
            <v-row>
              <v-col cols="6">
                <v-text-field label="Name" :rules="rules" v-model="projectName"></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <v-text-field label="Description" v-model="projectDescription"></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="silver" text @click="cancel()">Cancel</v-btn>
        <v-btn color="success" depressed @click="done()">OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import * as _ from "lodash";
import {Utils} from "@graphminer/utils";

@Component({})
export default class ProjectDialog extends Vue {
  visible: boolean = false;
  projectName: string = null;
  projectDescription: string = null;
  resolve: any = null;
  reject: any = null;
  rules: any[] = [Utils.validationRules.required, Utils.validationRules.notEmpty];
  valid: boolean = true;

  hide() {
    this.visible = false;

  }

  show() {
    this.visible = true;

  }

  cancel() {
    this.hide();
    this.resolve(null);
  }

  done() {
    (this.$refs.form as any).validate();
    if (this.valid) {
      this.hide();
      this.resolve({
        name: this.projectName,
        description: this.projectDescription
      });
    }
  }

  mounted() {
  }

  async newProject() {
    this.projectName = "";
    this.projectDescription = "";
    this.show();
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  async editProject(project) {
    this.projectName = project.name;
    this.projectDescription = project.description;
    this.show();
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
</script>
