<template>
  <v-container>
    <v-row justify="end">
      <v-col cols="4">
        <h1>Widget Template Editor <span v-if="isNew">[New]</span></h1>
      </v-col>
      <v-col cols="2" offset="6">
        <v-btn class="float-right mt-4" depressed small @click="gotoWidgetManager">Widget Manager</v-btn>

      </v-col>
    </v-row>

    <v-divider class="mb-3 mt-5"></v-divider>


    <v-row>
      <v-col cols="9">
        <div style="padding: 10px; ">
          <div ref="chartOutput">
            <ChartWidget style="border: 1px solid silver; border-radius: 5px; height: 30vh; padding: 10px;" ref="chart" :data="chartData" :options="chartOptions"></ChartWidget>
          </div>
          <div ref="mdOutput" class="markdown-output">
            <div v-html="mdOutput"></div>
          </div>
        </div>
        <div style="padding: 10px; ">
          <div ref="jsEditor">
            <prism-editor class="editor" v-model="code" :highlight="highlighter" line-numbers></prism-editor>
            <v-btn class="float-right mt-2" depressed color="primary" @click="refresh">Refresh Widget</v-btn>
          </div>
          <div ref="mdEditor">
            <v-textarea dense v-model="code" outlined label="Type here your markdown text." color="silver" height="30vh">

            </v-textarea>
          </div>
        </div>

      </v-col>
      <v-col cols="3" style="border-left:1px solid silver">
        <v-form>
          <v-text-field label="name" v-model="widgetName"></v-text-field>
          <v-text-field label="description" v-model="widgetDescription"></v-text-field>
          <v-btn depressed color="success" @click="save">Save</v-btn>

        </v-form>
        <div ref="errorOutput">
          <v-divider class="mb-3 mt-5"></v-divider>
          <div class="grey--text"><strong>Error Output:</strong></div>
          <div class="red--text" style="border:1px solid silver; border-radius: 5px; padding: 3px;min-height: 30px;">{{ errorOutput }}</div>
        </div>
        <div ref="logOutput">
          <v-divider class="mb-3 mt-5"></v-divider>
          <div class="grey--text"><strong>Console Output:</strong></div>
          <div class="grey--text" v-html="logOutput" style="border:1px solid silver; border-radius: 5px; padding: 3px;;min-height: 30px;">
          </div>
        </div>
        <v-divider class="mb-3 mt-5"></v-divider>
        <v-select label="Graph Dataset" outlined dense v-model="selectedGraph" :items="graphNames" @change="graphDataChanged"></v-select>
        <v-select label="Widget Type" outlined dense v-model="selectedRenderer" :items="renderers" @change="rendererChanged">
        </v-select>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import {Utils} from "@graphminer/utils";
import {WidgetTemplate} from "@graphminer/projects";
import * as _ from "lodash";
import {PrismEditor} from "vue-prism-editor";
import "vue-prism-editor/dist/prismeditor.min.css";
import {highlight, languages} from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
// import "prismjs/components/prism-markup";
// import "prismjs/components/prism-markdown";
import "prismjs/themes/prism-coy.min.css";
import {NotificationType} from "@/shared/notificationType";
import ChartWidget from "@/components/ChartWidget.vue";
import WidgetInterpreter from "@/shared/WidgetInterpreter";
import {Graph, RandomGraph} from "@graphminer/graphs";
import MarkdownIt from "markdown-it";

@Component({
  components: {
    PrismEditor,
    ChartWidget
  }
})
export default class WidgetEditorView extends Vue {
  graphNames: any[] = [
    {
      text: "Balance Tree",
      value: "balanced-tree"
    },
    {
      text: "Erdos Small",
      value: "erdos-small"
    }
  ];
  renderers: any[] = [
    {
      text: "Markdown",
      value: "markdown"
    },
    {
      text: "Line Chart",
      value: "line"
    },
    {
      text: "Bar Chart",
      value: "bar"
    },
    {
      text: "Pie Chart",
      value: "pie"
    }
  ];
  selectedGraph: string = "balanced-tree";
  showRight: boolean = true;
  showLeft: boolean = true;
  data: any[][] = [];
  code: string = null;
  chartData: any = [];
  chartOptions: any = {};
  context: any = null;
  errorOutput: string = null;
  logOutput: string = null;
  widgetName: string = null;
  widgetDescription: string = null;
  selectedRenderer: string = "bar";
  graph: Graph;
  private interpreter: WidgetInterpreter;
  private widget: WidgetTemplate;
  widgetId: string = null;
  language: string = "js";
  mdRenderer: MarkdownIt;
  mdOutput: string = "";

  toggleRight() {
    this.showRight = !this.showRight;
  }

  toggleLeft() {
    this.showLeft = !this.showLeft;
  }

  get isNew() {
    return _.isNil(this.widgetId);
  }

  async mounted() {
    this.mdRenderer = new MarkdownIt();

    this.widgetId = this.$ambientService.getQueryParameter("widgetId");
    if (Utils.isDefined(this.widgetId)) {
      await this.loadWidgetTemplate();
    } else {
      await this.loadStarterTemplate();
    }

    this.changeGraphData();

    this.refresh();
    setTimeout(() => {
      this.refresh();
    }, 500);
  }

  changeGraphData() {
    switch (this.selectedGraph) {
      case "balanced-tree":
        this.graph = RandomGraph.BalancedTree();
        break;
      case "erdos-small":
        this.graph = RandomGraph.ErdosRenyi(50, 50);
        break;
    }

    this.interpreter = new WidgetInterpreter(this.graph);
  }

  async loadStarterTemplate() {
    this.widget = WidgetTemplate.dummyWidget();
    this.widget.id = Utils.id();
    this.code = "";//this.widget.code;
    this.widgetName = this.widget.name;
    this.widgetDescription = this.widget.description;
  }

  async loadWidgetTemplate() {
    const widgetTemplate = await this.$dataService.getWidgetTemplateById(this.widgetId);
    if (_.isNil(widgetTemplate)) {
      return this.$ambientService.notify("The specified widget template does not exist", NotificationType.Error);
    }
    this.widget = widgetTemplate;
    this.widgetName = widgetTemplate.name;
    this.widgetDescription = widgetTemplate.description;
    this.code = widgetTemplate.code;
    this.selectedRenderer = widgetTemplate.renderer;
    this.rendererChanged();
  }

  refresh() {
    this.widget.code = this.code;
    const result = this.interpreter.execute([this.widget]);
    const r = result[0];
    if (Utils.isDefined(r.error)) {
      this.errorOutput = r.error;
      this.logOutput = "";
    } else {
      this.logOutput = r.log?.join("<br/>");
      this.errorOutput = "";
      this.chartOptions = r.options;
      this.chartData = r.data;
    }
  }

  async refreshLoop() {
    setInterval(() => {
      this.refresh();
    }, 1000);
  }

  highlighter(code) {
    // const lang = "js";
    // if (prism.languages[lang]) {
    //   return prism.highlight(code, prism.languages[lang], lang);
    // } else {
    //   return code;
    // }
    return highlight(code, languages.js);
  }

  async save() {
    if (Utils.isEmpty(this.widgetName)) {
      return this.$ambientService.notify("Empty name.", NotificationType.Error);
    }
    // if (!Utils.isSimpleString(this.widgetName)) {
    // 	return this.$ambientService.notify("The name is not a simple name.", NotificationType.Warning);
    // }
    const widgetTemplate = new WidgetTemplate(this.widgetName, this.widgetDescription, this.code, this.language, this.selectedRenderer);
    widgetTemplate.id = this.widget.id;
    await this.$dataService.upsertWidgetTemplate(widgetTemplate);
    this.$ambientService.notify("Saved", NotificationType.Message);
  }

  async getWidget() {
    const widget = await this.$dataService.getWidgetTemplateById("test");
    if (widget) {
      this.code = widget.code;
    }
  }

  async savePng() {
    const data = await (this.$refs.chart as any).getChartImageData();
    console.log(data.imgURI);
  }

  gotoWidgetManager() {
    this.$ambientService.navigateTo("Widgets");
  }

  graphDataChanged() {
    this.changeGraphData();
    this.refresh();
  }

  rendererChanged() {
    switch (this.selectedRenderer) {
      case "markdown":
        this.setEditor("md");
        break;
      default:
        this.setEditor("js");
    }
  }

  setEditor(language) {
    switch (language) {

      case "js":
        (this.$refs.jsEditor as HTMLDivElement).style.display = "block";
        (this.$refs.errorOutput as HTMLDivElement).style.display = "block";
        (this.$refs.logOutput as HTMLDivElement).style.display = "block";
        (this.$refs.mdEditor as HTMLDivElement).style.display = "none";
        (this.$refs.chartOutput as HTMLDivElement).style.display = "block";
        (this.$refs.mdOutput as HTMLDivElement).style.display = "none";
        this.language = "js";
        break;
      case "md":
        (this.$refs.jsEditor as HTMLDivElement).style.display = "none";
        (this.$refs.errorOutput as HTMLDivElement).style.display = "none";
        (this.$refs.logOutput as HTMLDivElement).style.display = "none";
        (this.$refs.mdEditor as HTMLDivElement).style.display = "block";
        (this.$refs.chartOutput as HTMLDivElement).style.display = "none";
        (this.$refs.mdOutput as HTMLDivElement).style.display = "block";
        this.language = "md";
        this.renderMarkdown();
        break;
    }
  }

  @Watch("code")
  onCodeChanged() {
    if (this.language === "md") {
      this.renderMarkdown();
    }
  }

  renderMarkdown() {
    this.mdOutput = this.mdRenderer.render(this.code);

  }
}
</script>

<style>
.editor {
  border-radius: 5px;
  border: 1px solid silver;
  background: #fff;
  min-height: 30vh;
  font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 5px;
}

.prism-editor__textarea:focus {
  outline: none;
}
</style>
