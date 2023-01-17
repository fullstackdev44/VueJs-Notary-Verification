import Vue from "vue";

export async function loads({ commit }) {
  const { data: batchs } = await Vue.axios.get("/batchs");
  commit("sets", batchs.map((item, index) => ({
    index: index + 1, ...item,
  })));
}

export async function load({ commit }, id = null) {
  const { data: batch } = await Vue.axios.get(`/batchs/${id}`);
  commit("set", batch);
}
