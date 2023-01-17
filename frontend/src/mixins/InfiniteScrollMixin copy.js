import { v4 as uuidV4 } from "uuid";

export default {
  props: {
    apiUrl: {
      type: String,
      required: true,
    },
    query: {
      type: Object,
      default() {
        return {};
      },
    },
    limit: {
      type: Number,
      default: 10,
    },
    fullLimit: {
      type: Number,
      default: null,
    },
    filter: {
      type: Function,
      default() {
        return null;
      },
    },
  },
  data() {
    return {
      page: 0,
      items: [],
      others: {},
      state: {
        loading: true,
        error: null,
      },
      meta: {
        limit: this.limit,
        page: 0,
        total: 0,
        sVersion: uuidV4(),
      },
    };
  },
  methods: {
    async onLoad(index, done) {
      done(await this.loadData());
    },
    async loadData() {
      const { data, others, meta } = await this.getData();
      this.items.push(...data);
      this.meta = meta;
      this.others = others;
      if (data?.length) this.meta.page += 1;
      return !data?.length;
    },
    async getData() {
      const { data } = await this.axios.get(this.apiUrl,
        {
          params: {
            query: this.query,
            meta: this.meta,
          },
        });
      return data;
    },
  },
};
