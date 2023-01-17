export default {
  computed: {
    statusStatis() {
      return this.batch?.statusStatis;
    },
    labelingStatis() {
      return this.batch?.labelingStatis;
    },
    all() {
      return this.statusStatis?.all ?? 1;
    },
    inProgress() {
      return this.statusStatis?.inProgress;
    },
    inProgressPer() {
      return this.inProgress / this.all;
    },
    qaProgress() {
      return this.statusStatis?.qaReady;
    },
    qaProgressPer() {
      return this.qaProgress / this.all;
    },
    rejection() {
      return this.labelingStatis?.rejection ?? 0;
    },
    rejectionPer() {
      return this.rejection / (this.labelingStatis?.labeling ?? 1);
    },
    correctionPer() {
      return this.labelingStatis?.correction / (this.labelingStatis?.labeling ?? 1);
    },
    allApproved() {
      return this.statusStatis?.allApproved;
    },

  },
  methods: {
    async loadBatch() {
      await this.$store.dispatch("batchs/load", this.$router?.currentRoute?.params?.batch);
    },
  },
};
