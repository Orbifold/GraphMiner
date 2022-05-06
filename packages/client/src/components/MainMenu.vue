<template>
  <div style="border-bottom:1px solid #738fc2">
    <v-menu offset-y open-on-hover>
      <template v-slot:activator="{ on, attrs }">
        <v-btn class="primary lighten-2 white--text rounded-0 text-md-body-2" text small v-bind="attrs" width="130px" v-on="on"> Views</v-btn>
      </template>
      <v-list dense>
        <v-list-item v-for="(item, index) in menuItems" :key="index" link>
          <v-list-item-icon>
            <v-icon small>{{ item.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="text-md-body-2" @click="goto(item)">{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-menu offset-y open-on-hover>
      <template v-slot:activator="{ on, attrs }">
        <v-btn class="primary lighten-2 white--text rounded-0 text-md-body-2" text small v-bind="attrs" width="130px" v-on="on"> Help</v-btn>
      </template>
      <v-list dense>
        <v-list-group v-for="item in test" :key="item.title" v-model="item.active" :prepend-icon="item.action" no-action>
          <template v-slot:activator>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="text-md-body-2">{{ item.title }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>

          <v-list-item v-for="subItem in item.items" :key="subItem.title" @click="">
            <v-list-item-content>
              <v-list-item-title class="text-md-body-2">{{ subItem.title }}</v-list-item-title>
            </v-list-item-content>

            <v-list-item-action>
              <v-icon>{{ subItem.action }}</v-icon>
            </v-list-item-action>
          </v-list-item>
        </v-list-group>
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";

@Component({})
export default class MainMenu extends Vue {
  menuItems: any[] = [
    {
      title: "Projects",
      target: "Projects",
      icon: "$flask"
    },
    {
      title: "Ontology Designer",
      target: "OntologyDesigner",
      icon: "$brush"
    },
    {
      title: "Widget Manager",
      target: "Widgets",
      icon: "$widget"
    },
    {
      title: "Local Data",
      target: "LocalData",
      icon: "$grid"
    }
  ];
  test: any[] = [
    {
      title: "Documentation",
      active: true,
      items: [{title: "Entities"}, {title: "Database"}]
    }
  ];

  goto(item) {
    this.$router.push({name: item.target});
  }
}
</script>

<style scoped></style>
