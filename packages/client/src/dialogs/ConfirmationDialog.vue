<template>
  <v-dialog v-model="isOpen" max-width="500" style="z-index: 100" @keydown.esc="cancel">
    <v-card>
      <v-toolbar dark color="primary" dense flat>
        <v-toolbar-title class="white--text">{{ title }}</v-toolbar-title>
      </v-toolbar>
      <v-card-text v-show="!!message" class="pa-4">{{ message }}</v-card-text>
      <v-card-actions class="pt-0">
        <v-spacer></v-spacer>
        <v-btn small color="grey" text @click.native="cancel">Cancel</v-btn>
        <v-btn small depressed color="error darken-1" @click.native="agree">Yes</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">

import {Component, Prop, Vue} from "vue-property-decorator";

@Component({})
export default class ConfirmationDialog extends Vue {
  isOpen: boolean = false;
  resolve: any = null;
  reject: any = null;
  message: string = null;
  title: string = null;

  open(title: string, message: string) {
    this.isOpen = true;
    this.title = title;
    this.message = message;
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  agree() {
    this.resolve(true);
    this.isOpen = false;
  }

  cancel() {
    this.resolve(false);
    this.isOpen = false;
  }
}
</script>
