import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";

import LocalDataService from "@/services/LocalDataService";
import AmbientService from "@/services/AmbientService";

import VueMousetrapPlugin from "vue-mousetrap/vue2";
import DataService from "@/services/dataService";

Vue.config.productionTip = false;

//==========================================================
// Global services
//==========================================================
// Logger.log(`Backend: ${process.env.VUE_APP_SERVER}`);

const localDataService = new LocalDataService();
const ds = new DataService();

Vue.prototype.$dataService = ds;
Vue.prototype.$ambientService = new AmbientService(store, router);
Vue.prototype.$localDataService = localDataService;
Vue.prototype.$eventHub = new Vue();

//==========================================================
// Plugins
//==========================================================
Vue.use(VueMousetrapPlugin);
//==========================================================
// Vue App
//==========================================================
new Vue({
	router,
	store,
	vuetify,
	render: (h) => h(App),
}).$mount("#app");
