import * as _ from "lodash";

export default {
	namespaced: true,
	state: {
		isLoggedIn: false,
		projectId: null,
	},
	mutations: {
		setLoggedIn(state, value) {
			state.isLoggedIn = value;
		},
		setProjectId(state, value) {
			state.projectId = value;
		},
	},
	actions: {},
	modules: {},
};
