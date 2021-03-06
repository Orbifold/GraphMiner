import "@mdi/font/css/materialdesignicons.css";
import Vue from "vue";
import Vuetify from "vuetify/lib/framework";

Vue.use(Vuetify);

const vuetify = new Vuetify({
    theme: {
        dark: false,
        themes: {
            light: {
                primary: "#3e5d8c",
                secondary: "#5d8c3e",
                accent: "#8c3e5d",
                error: "#c03e3e",
                primary0: "#fffffe",
                primary1: "#dbe3ef",
                primary2: "#b8c7df",
                primary3: "#94acd0",
                primary4: "#7190c0",
                primary5: "#4e75b0",
                primary6: "#3e5d8d",
                primary7: "#2e466a",
                primary8: "#1f2e46",
                white: "#ffffff",
                silver: "#8f8f8f"
            }
        }
    },
    icons: {
        iconfont: "mdi",
        values: {
            brush: "mdi mdi-brush",
            grid: "mdi mdi-grid",
            gears: "mdi mdi-cogs",
            search: "mdi mdi-magnify",
            close: "mdi mdi-close",
            person: "mdi mdi-account",
            personCard: "mdi mdi-card-account-mail-outline",
            card: "mdi mdi-card-text-outline",
            cancel: "mdi mdi-cancel",
            stop: "mdi mdi-stop",
            exclamation: "mdi mdi-exclamation-thick",
            eye: "mdi mdi-eye",
            plus: "mdi mdi-plus",
            minus: "mdi mdi-minus",
            panelLeft: "mid mdi-dock-left",
            panelRight: "mid mdi-dock-right",
            panelTop: "mid mdi-dock-top",
            panelBottom: "mid mdi-dock-bottom",
            enter: "mdi mdi-application-import",
            exit: "mdi mdi-application-export",
            settings: "mdi mdi-application-cog",
            pdf: "mdi mdi-adobe-acrobat",
            alert: "mdi mdi-alert",
            anchor: "mdi mdi-anchor",
            cloud: "mdi mdi-apple-icloud",
            application: "mdi mdi-application",
            archive: "mdi mdi-archive",
            asterisk: "mdi mdi-asterisk",
            bookmark: "mdi mdi-bookmark",
            pen: "mdi mdi-border-color",
            stack: "mdi mdi-buffer",
            refresh: "mdi mdi-cached",
            calendar: "mdi mdi-calendar",
            chart: "mdi mdi-chart-areaspline",
            sankey: "mdi mdi-chart-sankey-variant",
            timeline: "mdi mdi-chart-timeline",
            check: "mdi mdi-check",
            cut: "mdi mdi-content-cut",
            copy: "mdi mdi-content-copy",
            paste: "mdi mdi-clipboard-outline",
            cube: "mdi mdi-cube",
            database: "mdi mdi-database",
            export: "mdi mdi-database-arrow-right-outline",
            bin: "mdi mdi-delete",
            unbin: "mdi mdi-delete-restore",
            random: "mdi mdi-dice-3",
            docker: "mdi mdi-docker",
            download: "mdi mdi-download",
            electron: "mdi mdi-electron-framework",
            mail: "mdi mdi-email-outline",
            happy: "mdi mdi-emoticon-happy-outline",
            sad: "mdi mdi-emoticon-sad-outline",
            frown: "mdi mdi-emoticon-frown-outline",
            tree: "mdi mdi-family-tree",
            document: "mdi mdi-file-document-outline",
            edit: "mdi mdi-file-edit-outline",
            treeView: "mdi mdi-file-tree",
            filter: "mdi mdi-filter",
            flag: "mdi mdi-flag",
            flash: "mdi mdi-flash",
            flask: "mdi mdi-flask",
            experiment: "mdi mdi-test-tube-empty",
            folder: "mdi mdi-folder-outline",
            gauge: "mdi mdi-gauge",
            graph: "mdi mdi-graph",
            heart: "mdi mdi-heart",
            help: "mdi mdi-help-circle-outline",
            tools: "mdi mdi-hammer-wrench",
            hex: "mdi mdi-hexagon-outline",
            history: "mdi mdi-history",
            home: "mdi mdi-home",
            info: "mdi mdi-information-outline",
            key: "mdi mdi-key",
            screen: "mdi mdi-laptop",
            layers: "mdi mdi-layers-triple-outline",
            link: "mdi mdi-link-variant",
            linkedin: "mdi mdi-linkedin",
            lock: "mdi mdi-lock-outline",
            unlock: "mdi mdi-lock-open-variant-outline",
            login: "mdi mdi-login",
            logout: "mdi mdi-logout",
            zoomin: "mdi mdi-magnify-plus-outline",
            zoomout: "mdi mdi-magnify-minus-outline",
            zoomFrame: "mdi mdi-magnify-scan",
            map: "mdi mdi-map-outline",
            marker: "mdi mdi-map-marker",
            menu: "mdi mdi-menu",
            themeToggle: "mdi mdi-theme-light-dark",
            azure: "mdi mdi-microsoft-azure",
            excel: "mdi mdi-file-excel-outline",
            word: "mdi mdi-file-word-outline",
            movie: "mdi mdi-movie-outline",
            js: "mdi mdi-nodejs",
            note: "mid mdi-note-outline",
            pin: "mdi mdi-pin",
            play: "mdi mdi-play-outline",
            powerpoint: "mdi mdi-presentation",
            pulse: "mdi mdi-pulse",
            puzzle: "mdi mdi-puzzle-outline",
            directedEdge: "mdi mdi-ray-start-arrow",
            edge: "mdi mdi-ray-start-end",
            node: "mdi mdi-checkbox-blank-circle-outline",
            rocket: "mdi mdi-rocket-launch-outline",
            learn: "mdi mdi-school",
            send: "mid mdi-send",
            server: "mdi mdi-server",
            share: "mdi mdi-share",
            shuffle: "mdi mdi-shuffle-variant",
            dead: "mdi mdi-skull-outline",
            sleep: "mdi mdi-sleep",
            speed: "mdi mdi-speedometer",
            star: "mdi mdi-star-outline",
            tag: "mdi mdi-tag-outline",
            thumbs: "mdi mdi-thumb-up-outline",
            twitter: "mdi mdi-twitter",
            widget: "mdi mdi-widgets",
            tune: "mdi mdi-tune-vertical",
            undo: "mdi mdi-undo",
            redo: "mdi mdi-redo",
            group: "mdi mdi-group",
            ungroup: "mdi mdi-ungroup",
            dashboard: "mdi mdi-view-dashboard-outline",
            tool: "mdi mdi-hammer"
        }
    }
});
export default vuetify;
