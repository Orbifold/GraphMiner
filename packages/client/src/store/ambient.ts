import * as _ from "lodash";

export default {
	namespaced: true,
	state: {
		isLoggedIn: false,

		leftDrawerVisible: false,
		rightDrawerVisible: false,
		// whether the user ended up on CC via a shared chart link
		isSharedMode: false,
	},
	mutations: {
		setLoggedIn(state, value) {
			state.isLoggedIn = value;
		},
		setUserSettings(state, value) {
			state.user.settings = value;
		},

		setLeftDrawerVisible(state, value) {
			state.leftDrawerVisible = value;
		},
		setRightDrawerVisible(state, value) {
			state.rightDrawerVisible = value;
		},
	},
	actions: {},
	modules: {},
};
