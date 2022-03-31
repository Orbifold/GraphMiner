<template>
	<v-app>
		<ConfirmationDialog ref="confirmationDialog"></ConfirmationDialog>
		<AboutDialog ref="aboutDialog"></AboutDialog>
		<NotificationDialog ref="notificationDialog"></NotificationDialog>
		<v-app-bar app>
			<v-app-bar-nav-icon @click="leftDrawer = !leftDrawer"></v-app-bar-nav-icon>
			<v-toolbar-title>
				<div style="cursor: pointer" @click="goHome">
					<img src="/GraphMinerLogo.png" alt="GraphMiner Logo" style="width: 30px; float: left; margin: 0 5px 0 -20px" />
					GraphMiner
				</div>
			</v-toolbar-title>
			<v-spacer></v-spacer>
			<v-btn icon @click="rightDrawer = !rightDrawer">
				<v-icon>mdi-cogs</v-icon>
			</v-btn>
		</v-app-bar>
		<v-navigation-drawer v-model="leftDrawer" fixed left temporary></v-navigation-drawer>
		<v-navigation-drawer v-model="rightDrawer" fixed right temporary></v-navigation-drawer>
		<v-main>
			<MainMenu></MainMenu>

			<div>
				<v-fade-transition mode="out-in">
					<router-view v-if="isInitialized"></router-view>
				</v-fade-transition>
			</div>
		</v-main>
		<v-footer>
			<a href="https://orbifold.net" target="_blank" title="Thinking. Understanding. Creating.">&copy2022 Orbifold Consulting.</a>
			<a href="#" style="margin-left: 20px; cursor: pointer">Legal Statement</a>
			<a href="#" style="margin-left: 20px; cursor: pointer">Privacy</a>
			<a href="#" style="margin-left: 20px; cursor: pointer">Cookie Policy</a>
			<v-spacer></v-spacer>
			<a href="https://github.com/Orbifold/GraphMiner" target="_blank">v{{ version }}</a>
			<v-spacer></v-spacer>
			<a href="#" style="float: right; cursor: pointer" title="About" @click="showAbout">About</a>
		</v-footer>
	</v-app>
</template>

<script lang="ts">
	import { Component, Vue } from "vue-property-decorator";
	import ConfirmationDialog from "@/dialogs/ConfirmationDialog.vue";
	import AboutDialog from "@/dialogs/AboutDialog.vue";
	import MainMenu from "@/components/MainMenu.vue";
	import NotificationDialog from "@/dialogs/NotificationDialog.vue";
	import { NotificationType } from "@/shared/notificationType";

	@Component({
		components: { AboutDialog, MainMenu, ConfirmationDialog, NotificationDialog },
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
			this.$ambientService.navigateTo({ name: "Home" });
		}
	}
</script>

<style scoped>
	footer a {
		text-decoration: none;
		color: #696969;
		font-size: small;
	}
</style>
