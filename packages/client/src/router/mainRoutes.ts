import LocalDataView from "@/views/LocalDataView.vue";
import OntologyDesignerView from "@/views/OntologyDesignerView.vue";
import ProjectsView from "@/views/ProjectsView.vue";
import DoubleDataView from "@/views/DoubleDataView.vue";
import ExploreView from "@/views/ExploreView.vue";
import CreateWidgetView from "@/views/CreateWidgetView.vue";
import DashboardsView from "@/views/DashboardsView.vue";
import ProjectView from "@/views/ProjectView.vue";

export default [
	{
		path: "/",
		name: "Home",
		component: ProjectsView,
	},
	{
		path: "/ontologyDesigner",
		name: "OntologyDesigner",
		component: OntologyDesignerView,
	},
	{
		path: "/localData",
		name: "LocalData",
		component: LocalDataView,
	},
	{
		path: "/project",
		name: "Project",
		component: ProjectView,
	},
	{
		path: "/dashboards",
		name: "Dashboards",
		component: DashboardsView,
	},
	{
		path: "/double",
		name: "Double Data",
		component: DoubleDataView,
	},
	{
		path: "/explore",
		name: "Explore",
		component: ExploreView,
	},
	{
		path: "/createWidget",
		name: "CreateWidget",
		component: CreateWidgetView,
	},
	{
		path: "*",
		name: "Projects",
		component: ProjectsView,
	},
];
