import Vue, {VueConstructor} from "vue";

import AmbientService from "@/services/AmbientService";
import LocalDataService from "@/services/LocalDataService";
import DataService from "@/services/DataService";
import Vuetify from "vuetify/lib/framework";

declare module "vue/types/vue" {
    interface Vue {
        /**
         * Gateway to panels and notifications.
         */
        $ambientService: AmbientService;
        $localDataService: LocalDataService;
        $dataService: DataService;
        $eventHub: Vue;
        $appInsights: any;
        $mousetrap: any;

    }
}
