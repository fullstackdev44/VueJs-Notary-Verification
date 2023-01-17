<template>
  <q-btn
    v-bind="$props"
    :dense="dense"
    :color="color"
    :class="className"
    :disable="disable || submitting"
    :loading="submitting"
    @click.stop="onClick"
  >
    <template v-slot:loading>
      <q-spinner
        color="primary"
        size="3em" />
    </template>
    <slot />
  </q-btn>
</template>
<script>
export default {
  // eslint-disable-next-line vue/require-prop-types
  props: ["action", "dense", "color", "disable", "unelevated", "round", "label", "className", "icon", "outline", "iconRight"],
  data() {
    return {
      submitting: false,
    };
  },
  methods: {
    async onClick() {
      this.submitting = true;
      try {
        await this.action();
      } catch (error) {
        //
      }
      this.submitting = false;
    },
  },
};
</script>
