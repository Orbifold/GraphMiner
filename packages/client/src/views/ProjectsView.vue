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
    <v-row >
      <v-card v-for="(item, i) in data" :key="i" class="mx-2 my-2" height="250" width="280"  flat outlined>
        <v-img @click="openProject(item.id)" style="cursor: pointer" title="Open this project"
            height="80"
            :src=" item.image"
        ></v-img>
        <v-card-title>
          <v-icon color="primary8" class="mr-2">$flask</v-icon>
          {{ item.name }}
        </v-card-title>
        <v-card-subtitle class="pb-0">
          <v-chip class="mt-2 mb-2" color="primary2" text-color="white" x-small>Project</v-chip>
        </v-card-subtitle>
        <v-card-text class="text--primary">
          <div class="text-truncate"><i>{{ item.description || "&nbsp;" }}</i></div>
        </v-card-text>

        <v-card-actions>
          <v-btn color="primary6" text @click="openProject(item.id)" title="Open this project to see more"> Open</v-btn>
          <v-btn color="primary6" text @click="exploreProject(item.id)" title="Explore the graph"> Explore</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="error" x-small icon depressed @click="deleteProject(item.id)" title="Delete this project">
            <v-icon>$bin</v-icon>
          </v-btn>
          <v-btn x-small icon depressed @click="editProject(item.id)" title="Edit this project">
            <v-icon>$pen</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
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
    // let blockCount = 4;
    // switch (this.$vuetify.breakpoint.name) {
    //   case "xs":
    //     blockCount = 1;
    //     break;
    //   case "sm":
    //     blockCount = 1;
    //     break;
    //   case "md":
    //     blockCount = 4;
    //     break;
    //   case "lg":
    //     blockCount = 4;
    //     break;
    //   case "xl":
    //     blockCount = 6;
    //     break;
    // }
    // const blocks = [];
    // let currentBlock = [];
    // while (all.length > 0) {
    //   if (currentBlock.length >= blockCount) {
    //     blocks.push(currentBlock);
    //     currentBlock = [];
    //   }
    //   const item = all.shift();
    //   currentBlock.push(item);
    // }
    // if (currentBlock.length > 0) {
    //   blocks.push(currentBlock);
    // }
    this.data = all;
  }

  async addNewProject() {
    const info = await (this.$refs.projectDialog as any).newProject();
    if (Utils.isDefined(info)) {
      await this.$dataService.createProject(info.name, info.description, info.image);
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
      project.image = info.image;
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
