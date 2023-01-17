import { date } from "quasar";
import DialogMixin from "./DialogMixin";

export default {
  props: {
    obj: {
      type: Object,
      required: true,
    },
    limit: {
      type: Number,
      default: 10,
    },
  },
  mixins: [DialogMixin],
  data() {
    return {
      page: 0,
      items: [],
    };
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async onLoad(index, done) {
      done(await this.loadData());
    },
    getDate(dateStr) {
      return date.formatDate(new Date(dateStr), "MMMM DD, YYYY hh:mm A");
    },
    async loadData() {
      const data = await this.getData();
      this.items.push(...data.data);
      if (data.data?.length) this.page += 1;
      return !data.data?.length;
    },
    async getData() {
      return {
        data: [],
      };
    },
  },
};
