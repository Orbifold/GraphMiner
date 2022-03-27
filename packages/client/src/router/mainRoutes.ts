import LocalDataPage from "@/views/LocalDataPage.vue";
import OntologyDesigner from "@/views/OntologyDesigner.vue";

export default [
	{
		path: "/",
		name: "Home",
		component: LocalDataPage,
	},
	{
		path: "/ontologyDesigner",
		name: "Ontology Designer",
		component: OntologyDesigner,
	},
	{
		path: "/localData",
		name: "Local Data",
		component: LocalDataPage,
	},


];
