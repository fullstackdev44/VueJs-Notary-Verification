export default {
  computed: {
    expanded: {
      get() {
        return this.message?.expanded ?? false;
      },
      set(v) {
        this.updateMessage({
          ...this.message,
          expanded: v,
        });
      },
    },
  },

};
