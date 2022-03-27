import { Store } from "vuex";
import Logger from "@/services/LoggerService";
import * as _ from "lodash";
import { VueRouter } from "vue-router/types/router";

export enum NotificationType {
	Error = "Error",
	Message = "Message",
	Warning = "Warning",
	Clear = "Clear",
}

/*
 * Mostly services delivered by the App.vue frame.
 */
export default class AmbientService {
	private $store: Store<any>;
	private $router: VueRouter;

	constructor($store, $router) {
		this.$store = $store;
		this.$router = $router;
	}

	getQueryParameter(name) {
		const u = new URLSearchParams(window.location.search);
		return u.get(name) || null;
	}

	/**
	 * Shows the about dialog.
	 */
	showAbout() {
		Logger.error("The 'showAbout' method of the ambientService has not been hooked up property by the application.");
	}

	/**
	 * Opens up the left drawer.
	 */
	showLeftDrawer() {
		Logger.error("The 'showLeftDrawer' method of the ambientService has not been hooked up property by the application.");
	}

	hideLeftDrawer() {
		Logger.error("The 'hideLeftDrawer' method of the ambientService has not been hooked up property by the application.");
	}

	showEntityPanel() {
		Logger.error("The 'showEntityPanel' method of the ambientService has not been hooked up property by the application.");
	}

	hideEntityPanel() {
		Logger.error("The 'hideEntityPanel' method of the ambientService has not been hooked up property by the application.");
	}

	toggleEntityPanel() {
		Logger.error("The 'toggleEntityPanel' method of the ambientService has not been hooked up property by the application.");
	}

	/**
	 * Re-loads the chart items for the current user in the left drawer.
	 */
	refreshToc() {
		Logger.error("The 'refreshToc' method of the ambientService has not been hooked up property by the application.");
	}

	/**
	 * Opens up the right drawer.
	 */
	showRightDrawer() {
		Logger.error("The 'showRightDrawer' method of the ambientService has not been hooked up property by the application.");
	}

	/**
	 * Displays a notification.
	 * @param text {string} The text to display.
	 * @param [timeout] {number} The timeout in milliseconds. Default is 2000.
	 * @param [notificationType] {NotificationType} The kind of message to show.
	 */
	notify(text: string, notificationType?: NotificationType, timeout?: number) {
		Logger.error("The 'notify' method of the ambientService has not been hooked up property by the application.");
	}

	quickTags() {
		Logger.error("The 'quickTags' method of the ambientService has not been hooked up property by the application.");
	}

	showSpinner(message: string = null) {
		Logger.error("The 'showSpinner' method of the ambientService has not been hooked up property by the application.");
	}

	shareChart(key: string) {
		Logger.error("The 'shareChart' method of the ambientService has not been hooked up property by the application.");
	}

	async setEntityDescription(): Promise<string> {
		Logger.error("The 'setEntityDescription' method of the ambientService has not been hooked up property by the application.");
		return null;
	}

	hideSpinner() {
		Logger.error("The 'hideSpinner' method of the ambientService has not been hooked up property by the application.");
	}

	showToolbar() {
		Logger.error("The 'showToolbar' method of the ambientService has not been hooked up property by the application.");
	}

	hideToolbar() {
		Logger.error("The 'hideToolbar' method of the ambientService has not been hooked up property by the application.");
	}

	async confirm(title: string, message: string): Promise<boolean> {
		Logger.error("The 'confirm' method of the ambientService has not been hooked up property by the application.");
		return false;
	}

	async showOverlay(): Promise<void> {
		Logger.error("The 'showOverlay' method of the ambientService has not been hooked up property by the application.");
	}

	async hideOverlay(): Promise<void> {
		Logger.error("The 'hideOverlay' method of the ambientService has not been hooked up property by the application.");
	}

	get graphMinerVersion() {
		return require("../../package.json").version;
	}

	get graphMinerDate() {
		return require("../../package.json").date;
	}

	get graphMinerName() {
		return require("../../package.json").friendlyName;
	}

	get graphMinerFullName() {
		return `${this.graphMinerName} v${this.graphMinerVersion}`;
	}

	get user() {
		return this.$store.state.ambient.user;
	}

	get isLoggedIn() {
		return this.$store.state.ambient.isLoggedIn;
	}

	get isAdmin() {
		return this.isLoggedIn && this.$store.state.ambient.user.isAdmin;
	}

	/**
	 * Navigates to the specified place.
	 * Ensures that place to go to is not the current one, which otherwise results in a Vue error.
	 * @param route {any} Can be a router spec or just a name.
	 */
	navigateTo(route: any) {
		// pushing the same name results in a Vue error
		this.$router.push(route).catch(() => {});
	}

	showHelp(name) {
		Logger.error("The 'showShortcuts' method of the ambientService has not been hooked up property by the application.");
	}

	askFor(question: string, info: string = null) {
		Logger.error("The 'askFor' method of the ambientService has not been hooked up property by the application.");
	}

	/**
	 * Goes to the search page and automatically searches for the given term.
	 * @param searchTerm {string} anything really
	 */
	gotoSearchFor(searchTerm: string) {
		this.navigateTo({ path: "/search", query: { q: searchTerm } });
	}
}
