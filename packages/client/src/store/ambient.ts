import * as _ from "lodash";

export default {
	namespaced: true,
	state: {
		isLoggedIn: false,
		project: null,
	},
	mutations: {
		setLoggedIn(state, value) {
			state.isLoggedIn = value;
		},
		setProject(state, value) {
			state.project = value;
		},
	},
	actions: {},
	modules: {},
};
