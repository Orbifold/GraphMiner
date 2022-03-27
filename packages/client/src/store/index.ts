import Vue from "vue";
import Vuex from "vuex";
import AmbientStore from "./ambient";

Vue.use(Vuex);
const store = new Vuex.Store({
	modules: {
		ambient: AmbientStore,
	 
	},
});
export default store;
