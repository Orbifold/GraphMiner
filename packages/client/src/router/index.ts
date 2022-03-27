import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import * as _ from "lodash";

import redirects from "@/router/redirects";
import mainRoutes from "@/router/mainRoutes";
import store from "@/store";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = mainRoutes.concat(redirects as any[]);

const router = new VueRouter({
	mode: "history",
	routes,
});

router.beforeEach(async (to, from, next) => {
	// todo: authentication
	next();
});
export default router;
