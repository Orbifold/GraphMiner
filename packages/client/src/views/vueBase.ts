import { Component, Vue } from "vue-property-decorator";
import { Utils } from "@graphminer/utils";
import { Project, Dashboard } from "@graphminer/projects";

import { NotificationType } from "@/shared/notificationType";

/*
 * Most of the members here can be accessed via the services
 * but this base brings even more clarity in the code.
 * */

export default class VueBase extends Vue {
	/**
	 *
	 * @returns {Project}
	 */
	get project() {
		return this.$store.state.ambient.project;
	}

	/**
	 * Returns whether there currently is a logged in user.
	 * @return {boolean}
	 */
	get isLoggedIn() {
		// return this.$ambientService.isLoggedIn;
		return false;
	}

	/**
	 * Returns whether the current user has admin privileges.
	 * @return {any}
	 */
	get isAdmin() {
		// return this.$ambientService.isAdmin;
		return false;
	}

	/**
	 * Returns whether the loading process is ongoing.
	 * The loading consists of the user and his settings in the store.
	 * @return {boolean}
	 */
	get isLoading() {
		// return this.$ambientService.isLoading;
		return false;
	}

	/**
	 * Navigate to the specified route.
	 * For instance
	 *  - goto("Sankey")
	 *  - goto({name: "Gantt"})
	 *  - goto({name: "Gantt", query:{id:"132232"}})
	 * @param route {any} Similar to the Vue routing options, can be a route name or a route spec.
	 */
	goto(route: any) {
		this.$ambientService.navigateTo(route);
	}

	navigateTo(route: any) {
		this.$ambientService.navigateTo(route);
	}

	checkQueryString() {
		this.checkProjectIdInQueryString();
	}

	private checkProjectIdInQueryString() {
		const projectId = this.$ambientService.getQueryParameter("projectId");
		if (!Utils.isEmpty(projectId)) {
			this.$store.commit("ambient/setProjectId", projectId);
		}
	}

	/**
	 * Ensures that there is an active project in the store.
	 * @returns {Promise<any>}
	 */
	async ensureActiveProject() {
		if (Utils.isEmpty(this.project)) {
			// this.$ambientService.notify("Select a project first.", NotificationType.Error);
			// await new Promise((r) => setTimeout(r, 500));
			return this.$ambientService.navigateTo("Projects");
		}
	}
}
