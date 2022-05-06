<template>
  <v-app>
    <ConfirmationDialog ref="confirmationDialog"></ConfirmationDialog>
    <AboutDialog ref="aboutDialog"></AboutDialog>
    <NotificationDialog ref="notificationDialog"></NotificationDialog>
    <v-app-bar app>
      <v-app-bar-nav-icon @click="leftDrawer = !leftDrawer"></v-app-bar-nav-icon>
      <v-toolbar-title>
        <div style="cursor: pointer" @click="goHome">
          <img src="/GraphMinerLogo.png" alt="GraphMiner Logo" style="width: 30px; float: left; margin: 0 5px 0 -20px"/>
          GraphMiner
        </div>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="rightDrawer = !rightDrawer">
        <v-icon>mdi-cogs</v-icon>
      </v-btn>
      <v-btn icon @click="toggleTheme">
        <v-icon>$themeToggle</v-icon>
      </v-btn>
    </v-app-bar>
    <v-navigation-drawer v-model="leftDrawer" fixed left temporary></v-navigation-drawer>
    <v-navigation-drawer v-model="rightDrawer" fixed right temporary>
      <div class=" my-2 mx-4">
        <h1>Settings</h1>
        <v-card elevation="0" outlined class="mt-2">
          <v-card-subtitle>Reset Widget Template Collection</v-card-subtitle>
          <v-card-text>
            This will replace the widget template collection with the predefined collection. All custom templates and changes will be lost through this action.
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" depressed small @click="resetWidgetTemplates">Reset WidgetTemplates</v-btn>
          </v-card-actions>
        </v-card>
      </div>

    </v-navigation-drawer>
    <v-main>
      <MainMenu></MainMenu>

      <div>
        <v-fade-transition mode="out-in">
          <router-view v-if="isInitialized"></router-view>
        </v-fade-transition>
      </div>
    </v-main>
    <v-footer>
      <a href="https://orbifold.net" target="_blank" title="Think. Visualize. Understand.">&copy2022 Orbifold Consulting</a>

      <v-spacer></v-spacer>
      <a href="https://github.com/Orbifold/GraphMiner" target="_blank">v{{ version }}</a>
      <v-spacer></v-spacer>
      <a href="#" style="float: right; cursor: pointer" title="About" @click="showAbout">About</a>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import ConfirmationDialog from "@/dialogs/ConfirmationDialog.vue";
import AboutDialog from "@/dialogs/AboutDialog.vue";
import MainMenu from "@/components/MainMenu.vue";
import NotificationDialog from "@/dialogs/NotificationDialog.vue";
import {NotificationType} from "@/shared/notificationType";
import vuetify from "@/plugins/vuetify";


@Component({
  components: {AboutDialog, MainMenu, ConfirmationDialog, NotificationDialog}
})
export default class App extends Vue {
  leftDrawer: boolean = null;
  rightDrawer: boolean = null;
  version: string = null;
  isInitialized: boolean = false;

  beforeMount() {
    this.version = this.$ambientService.graphMinerVersion;

  }


  mounted() {
    this.$ambientService.confirm = this.confirm;
    this.$ambientService.showAbout = this.showAbout;
    this.$ambientService.notify = this.showNotification;
    this.$dataService.init(this.$store).then(() => {
      this.isInitialized = true;
    });
  }


  async confirm(title: string, message: string) {
    return (this.$refs.confirmationDialog as any).show(title, message);
  }

  showAbout() {
    return (this.$refs.aboutDialog as any).show();
  }

  showNotification(text: string, type: NotificationType) {
    (this.$refs.notificationDialog as any).notify(text, type);
  }

  goHome() {
    this.$ambientService.navigateTo({name: "Home"});
  }

  toggleTheme() {
    vuetify.framework.theme.dark = !vuetify.framework.theme.dark;
    const appSettings = this.$dataService.getAppSettings();
    appSettings.theme = vuetify.framework.theme.dark ? "dark" : "light";
    this.$dataService.saveAppSettings(appSettings);
  }

  async resetWidgetTemplates() {
    await this.$dataService.resetWidgetTemplates();
    this.$ambientService.notify("The collection has been reset.");
  }
}
</script>

<style>

footer a {
  text-decoration: none;
  color: #696969;
  font-size: small;
}

.truncated-text {
  height: 200px;
  width: 90%;
  overflow: hidden;
  position: relative;
  line-height: 1.2em;
  max-height: 6em;
  text-align: justify;
  margin-right: -1em;
  padding-right: 1em;

  margin-bottom: 15px;
  font-size: small;
}

.truncated-text:before {
  content: '...';
  position: absolute;
  right: 0;
  bottom: 0;
}

.truncated-text:after {
  content: '';
  position: absolute;
  right: 0;
  width: 1em;
  height: 1em;
  margin-top: 0.2em;

}

.widget-delete {
  background-color: rgb(255 255 255);
  width: 50px;
  height: 50px;
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px solid orangered;
  border-radius: 100%;
}

.markdown-output {
  height: 30vh;
  border: 1px solid silver;
  border-radius: 5px;
  padding: 5px 15px;
  overflow: auto;
}
</style>
