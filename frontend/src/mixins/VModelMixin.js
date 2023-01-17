export default {
  props: {
    value: {
      type: [String, Boolean, null, Array],
      required: true,
    },
  },
  computed: {
    syncValue: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit("input", v);
      },
    },
  },
};
