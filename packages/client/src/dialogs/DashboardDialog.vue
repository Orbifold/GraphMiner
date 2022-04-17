<template>
  <v-dialog v-model="visible" persistent max-width="600px" @keydown.esc="cancel()">

    <v-card>
      <v-card-title class="primary">
        <v-icon style="margin-right: 10px; color: white">$dashboard</v-icon>
        <span style="color: white">Dashboard</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form"
            v-model="valid"
        >
          <v-container>
            <v-row>
              <v-col cols="11">
                <v-text-field label="Name" :rules="rules" v-model="dashboardName" @keydown.enter="done()" autofocus></v-text-field>
              </v-col>

            </v-row>
            <v-row>
              <v-col cols="11">
                <v-textarea label="Description" v-model="dashboardDescription"></v-textarea>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="8">
                <v-color-picker
                    v-model="dashboardColor"
                    label="Color"
                ></v-color-picker>


              </v-col>
              <v-col cols="4">
                <v-img label="Image" :src="dashboardColor" height="100" width="100"></v-img>
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
import {Utils,Colors} from "@graphminer/utils";
import {NotificationType} from "@/shared/notificationType";

@Component({})
export default class DashboardDialog extends Vue {
  visible: boolean = false;
  dashboardName: string = null;
  dashboardDescription: string = null;
  dashboardColor: string = null;
  resolve: any = null;
  reject: any = null;
  rules: any[] = [Utils.validationRules.required, Utils.validationRules.notEmpty];
  valid: boolean = true;
  isNewDashboard: boolean = true;
  originalProjectName: string = null;

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

  async done() {
    (this.$refs.form as any).validate();
    if (this.valid) {
      let names = await this.$dataService.getProjectNames();
      names = names.map(n => n.toLowerCase());
      if (!this.isNewDashboard) {
        _.remove(names, n => n === this.originalProjectName.toLowerCase());
      }
      if (_.includes(names, this.dashboardName.toLowerCase())) {
        return this.$ambientService.notify(`A project with name '${this.dashboardName}' already exists.`, NotificationType.Warning);
      } else {
        this.hide();
        this.resolve({
          name: this.dashboardName,
          description: this.dashboardDescription,
          color: _.isString(this.dashboardColor)? this.dashboardColor:this.dashboardColor["hex"]
        });
      }
    }
  }

  mounted() {
  }

  async newDashboard() {
    this.originalProjectName = "";
    this.dashboardName = "";
    this.dashboardDescription = "";
    this.dashboardColor = null;
    this.isNewDashboard = true;
    this.show();
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  async editDashboard(dashboard) {
    this.dashboardName = dashboard.name;
    this.originalProjectName = dashboard.name;
    this.dashboardDescription = dashboard.description;
    this.dashboardColor = dashboard.color;
    this.isNewDashboard = false;
    this.show();
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  randomColor() {
    this.dashboardColor = Colors.randomKnownColor();
  }
}
</script>
