<template>
  <v-container>
    <ProjectDialog ref="projectDialog"></ProjectDialog>
    <v-row>
      <v-col cols="2"><h1>Projects</h1></v-col>
      <v-col>
        <v-btn @click="addNewProject" depressed color="success" class="float-right">New Project</v-btn>
      </v-col>
    </v-row>

    <v-divider class="mt-3 mb-3"></v-divider>
    <v-row v-for="(block, i) in data" :key="i">
      <v-col cols="3" md="3" v-for="(item, j) in block" :key="j">
        <v-card class="mx-auto" max-width="400" color="primary3 " flat>
          <v-card-title>{{ item.name }}</v-card-title>
          <v-card-subtitle class="pb-0">
            <v-chip class="mt-2 mb-2" color="primary2" text-color="white" x-small>Project</v-chip>
          </v-card-subtitle>
          <v-card-text class="text--primary">
            <div>{{ item.description }}</div>
          </v-card-text>

          <v-card-actions>
            <v-btn color="primary6" text @click="openProject(item.id)" title="Open this project to see more"> Open</v-btn>
            <v-btn color="secondary" text @click="exploreProject(item.id)" title="Explore the graph"> Explore</v-btn>
            <v-spacer></v-spacer>
            <v-btn color="error" x-small fab depressed @click="deleteProject(item.id)" title="Delete this project">
              <v-icon>$bin</v-icon>
            </v-btn>
            <v-btn color="white" x-small fab depressed @click="editProject(item.id)" title="Edit this project">
              <v-icon>$pen</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import {Utils} from "@graphminer/utils";
import {Lang, Random} from "@graphminer/language";
import VueBase from "@/views/vueBase";
import ProjectDialog from "@/dialogs/ProjectDialog.vue";

@Component({
  components: {
    ProjectDialog
  }
})
export default class ProjectsView extends VueBase {
  showRight: boolean = true;
  showLeft: boolean = true;
  data: any[][] = [];

  toggleRight() {
    this.showRight = !this.showRight;
  }

  toggleLeft() {
    this.showLeft = !this.showLeft;
  }

  async mounted() {
    await this.refresh();
  }


  async refresh() {
    const all = await this.$dataService.getAllProjects();
    const blocks = [];
    let currentBlock = [];
    while (all.length > 0) {
      if (currentBlock.length >= 4) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
      const item = all.shift();
      currentBlock.push(item);
    }
    if (currentBlock.length > 0) {
      blocks.push(currentBlock);
    }
    this.data = blocks;
  }

  async addNewProject() {
    const info = await (this.$refs.projectDialog as any).newProject();
    if (Utils.isDefined(info)) {
      await this.$dataService.createProject(info.name, info.description);
      await this.refresh();
    }

  }

  async exploreProject(projectId) {
    await this.$dataService.setActiveProject(projectId);
    await new Promise((r) => setTimeout(r, 500));
    this.$ambientService.navigateTo("Explore");
  }

  async openProject(projectId) {
    await this.$dataService.setActiveProject(projectId);
    await new Promise((r) => setTimeout(r, 500));
    this.$ambientService.navigateTo("Project");
  }

  async editProject(projectId) {
    const project = await this.$dataService.getProject(projectId);
    const info = await (this.$refs.projectDialog as any).editProject(project);
    if (Utils.isDefined(info)) {
      project.name = info.name;
      project.description = info.description;
      await this.$dataService.upsertProject(project);
      await this.refresh();
    }
  }

  async deleteProject(projectId) {
    const yn = await this.$ambientService.confirm("Delete Project", "Are you sure?");
    if (yn) {
      await this.$dataService.removeProject(projectId);
      await this.refresh();
    }
  }
}
</script>

<style scoped></style>
