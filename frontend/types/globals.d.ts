/**
 * Extends interfaces in Vue.js
 */

import constants from "src/constants";
import Vue, { ComponentOptions } from "vue";
import moment from "moment";
declare module "vue/types/vue" {
  interface Vue {
    $constants: typeof constants;
    $moment: moment.Moment;
  }
}
