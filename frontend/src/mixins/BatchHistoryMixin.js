import BatchHistory from "@/components/history/batch/BatchHistory";

export default {
  methods: {
    viewHistory(obj) {
      this.$q.dialog({
        component: BatchHistory,
        obj,
      });
    },

  },
};
