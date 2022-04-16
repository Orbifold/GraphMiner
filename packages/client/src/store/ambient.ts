import * as _ from "lodash";

export default {
    namespaced: true,
    state: {
        isLoggedIn: false,
        project: null,
        appSettings: null
    },
    mutations: {
        setLoggedIn(state, value) {
            state.isLoggedIn = value;
        },
        setProject(state, value) {
            state.project = value;
        },
        setAppSettings(state, value) {
            state.appSettings = value;
        }
    },
    actions: {},
    modules: {}
};
