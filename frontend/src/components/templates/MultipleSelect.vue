<template>
  <q-select
    v-model="syncValue"
    filled
    :options="options"
    multiple
    dense
    emit-value
    map-options
    style="width: 200px"
  >
    <template v-slot:option="{ itemProps, itemEvents, opt, selected, toggleOption }">
      <q-item v-bind="itemProps" v-on="itemEvents">
        <q-item-section>
          <q-item-label v-html="opt.label" />
        </q-item-section>
        <q-item-section side>
          <q-toggle :value="selected" @input="toggleOption(opt)" />
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>
<script>
import VModelMixin from "@/mixins/VModelMixin";

export default {
  mixins: [VModelMixin],
  // eslint-disable-next-line vue/require-prop-types
  props: ["value", "options"],
};
</script>
