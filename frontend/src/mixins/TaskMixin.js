import { mapGetters, mapMutations, mapActions } from "vuex";

export const getMessageCountByStatus = (messages, status) => messages?.filter(
  (message) => message.status === status,
)?.length ?? 0;

export default {
  data() {
    return {
      loading: false,
    };
  },
  computed: {
    ...mapGetters("tasks", ["task", "messages", "appliedMessages", "filter"]),
    messageStatus: {
      get() {
        return this.filter.messageStatus;
      },
      set(messageStatus) {
        this.setFilter({ ...this.filter, messageStatus });
      },
    },
  },
  methods: {
    ...mapMutations("tasks", ["setTask", "setFilter", "updateMessage", "toggle"]),
    ...mapActions("tasks", ["loadNew"]),
    getMessageCountByStatus(status) {
      return this.task?.messages?.filter((message) => message.status === status)?.length ?? 0;
    },
    async load() {
      this.loading = true;
      try {
        await this.$store.dispatch("tasks/load", this.$router?.currentRoute?.query?.task);
      } catch (error) {
        this.setTask(null);
      }
      this.loading = false;
    },
    async submitTask() {
      this.loading = true;
      try {
        await this.axios.post(`/tasks/${this.task.id}/submit`, {
          ...this.task,
          messages: this.task.messages.map(
            ({ id, folder, status }) => ({ id, folder: folder.id, status }),
          ),
        });
        await this.load();
      } catch (error) {
        this.setTask(null);
      }
      this.loading = false;
    },
  },
};
