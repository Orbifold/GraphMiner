import LocalDataView from "@/views/LocalDataView.vue";
import OntologyDesignerView from "@/views/OntologyDesignerView.vue";
import ProjectsView from "@/views/ProjectsView.vue";
import DoubleDataView from "@/views/DoubleDataView.vue";
import ExploreView from "@/views/ExploreView.vue";

export default [
	{
		path: "/",
		name: "Home",
		component: ProjectsView,
	},
	{
		path: "/ontologyDesigner",
		name: "Ontology Designer",
		component: OntologyDesignerView,
	},
	{
		path: "/localData",
		name: "Local Data",
		component: LocalDataView,
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
		path: "*",
		name: "Projects",
		component: ProjectsView,
	},
];
