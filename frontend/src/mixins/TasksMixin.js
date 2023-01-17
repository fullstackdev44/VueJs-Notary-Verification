import { mapGetters, mapMutations, mapActions } from "vuex";
import { uniq, uniqBy } from "lodash";

export const getTaskCountByStatus = (
  tasks, status,
) => tasks?.count?.[status] ?? 0;

export default {
  computed: {
    ...mapGetters("tasks", ["tasks", "filter"]),
    taskStatus: {
      get() {
        return this.filter.taskStatus;
      },
      set(taskStatus) {
        this.setFilter({ ...this.filter, taskStatus });
      },
    },
    labelersFilter: {
      get() {
        return this.filter.labelers;
      },
      set(labelers) {
        this.setFilter({ ...this.filter, labelers });
      },
    },
    batchsFilter: {
      get() {
        return this.filter.batchs;
      },
      set(batchs) {
        this.setFilter({ ...this.filter, batchs });
      },
    },
    statusTasks() {
      if (this.filter.taskStatus.length) {
        return this.tasks?.filter(({ status }) => this.filter.taskStatus.includes(status)) ?? [];
      }
      return this.tasks;
    },
    filteredTasks() {
      return this.tasks?.filter(({ status, assignedTo, batch }) => {
        if (
          this.filter?.taskStatus?.length &&
          !this.filter?.taskStatus?.includes(status)) return false;
        if (
          this.filter?.labelers?.length &&
          !this.filter?.labelers?.includes(assignedTo.email)) return false;
        if (
          this.filter?.batchs?.length &&
          !this.filter?.batchs?.includes(batch)) return false;
        return true;
      }) ?? [];
    },
    labelers() {
      return uniq(this.tasks.map(({ assignedTo }) => assignedTo?.email));
    },
    batchs() {
      return uniqBy(
        this.tasks.map(({ batch }, index) => ({ label: `Batch ${index + 1}`, value: batch })),
        "value",
      );
    },
  },
  methods: {
    ...mapMutations("tasks", ["setTasks", "setFilter"]),
    ...mapActions("tasks", ["loadTasks"]),
    getTaskCountByStatus(status) {
      return this.tasks?.count?.[status] ?? 0;
    },
  },
};
