import TaskHistory from "@/components/history/task/TaskHistory";

export default {
  methods: {
    viewHistory(obj) {
      this.$q.dialog({
        component: TaskHistory,
        obj,
      });
    },

  },
};
