import LocalDataView from "@/views/LocalDataView.vue";
import OntologyDesignerView from "@/views/OntologyDesignerView.vue";
import ProjectsView from "@/views/ProjectsView.vue";
import DoubleDataView from "@/views/DoubleDataView.vue";
import ExploreView from "@/views/ExploreView.vue";
import WidgetEditorView from "@/views/WidgetEditorView.vue";
import DashboardView from "@/views/DashboardView.vue";
import ProjectView from "@/views/ProjectView.vue";
import WidgetsView from "@/views/WidgetsView.vue";
import TestView from "@/views/TestView.vue";

export default [
    {
        path: "/",
        name: "Home",
        component: ProjectsView
    },
    {
        path: "/ontologyDesigner",
        name: "OntologyDesigner",
        component: OntologyDesignerView
    },
    {
        path: "/localData",
        name: "LocalData",
        component: LocalDataView
    },
    {
        path: "/project",
        name: "Project",
        component: ProjectView
    },

    {
        path: "/dashboard",
        name: "Dashboard",
        component: DashboardView
    },
    {
        path: "/double",
        name: "Double Data",
        component: DoubleDataView
    },
    {
        path: "/explore",
        name: "Explore",
        component: ExploreView
    },
    {
        path: "/widgetEditor",
        name: "WidgetEditor",
        component: WidgetEditorView
    },
    {
        path: "/widgets",
        name: "Widgets",
        component: WidgetsView
    },
    {
        path: "/test",
        name: "Test",
        component: TestView
    },
    {
        path: "*",
        name: "Projects",
        component: ProjectsView
    }
];
