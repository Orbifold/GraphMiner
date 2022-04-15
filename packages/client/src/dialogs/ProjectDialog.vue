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
              <v-col cols="11">
                <v-text-field label="Name" :rules="rules" v-model="projectName" @keydown.enter="done()" autofocus></v-text-field>
              </v-col>

            </v-row>
            <v-row>
              <v-col cols="11">
                <v-textarea label="Description" v-model="projectDescription"></v-textarea>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="8">
                <v-text-field label="Image URL" v-model="projectImage">
                  <template v-slot:append>
                    <v-btn icon small @click="randomImage">
                      <v-icon>$random</v-icon>
                    </v-btn>
                  </template>
                </v-text-field>

              </v-col>
              <v-col cols="4">
                <v-img label="Image" :src="projectImage" height="100" width="100"></v-img>
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
import {NotificationType} from "@/shared/notificationType";

@Component({})
export default class ProjectDialog extends Vue {
  visible: boolean = false;
  projectName: string = null;
  projectDescription: string = null;
  projectImage: string = null;
  resolve: any = null;
  reject: any = null;
  rules: any[] = [Utils.validationRules.required, Utils.validationRules.notEmpty];
  valid: boolean = true;
  isNewProject: boolean = true;
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
      if (!this.isNewProject) {
        _.remove(names, n => n === this.originalProjectName.toLowerCase());
      }
      if (_.includes(names, this.projectName.toLowerCase())) {
        return this.$ambientService.notify(`A project with name '${this.projectName}' already exists.`, NotificationType.Warning);
      } else {
        this.hide();
        this.resolve({
          name: this.projectName,
          description: this.projectDescription,
          image: this.projectImage
        });
      }
    }
  }

  mounted() {
  }

  async newProject() {
    this.originalProjectName = "";
    this.projectName = "";
    this.projectDescription = "";
    this.projectImage = "";
    this.isNewProject = true;
    this.show();
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  async editProject(project) {
    this.projectName = project.name;
    this.originalProjectName = project.name;
    this.projectDescription = project.description;
    this.projectImage = project.image;
    this.isNewProject = false;
    this.show();
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  randomImage() {
    this.projectImage = Utils.randomImageUrl();
  }
}
</script>
