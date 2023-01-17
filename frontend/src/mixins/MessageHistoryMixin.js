import MessageHistory from "@/components/history/message/MessageHistory";

export default {
  methods: {
    viewHistory(obj) {
      this.$q.dialog({
        component: MessageHistory,
        obj,
      });
    },

  },
};
