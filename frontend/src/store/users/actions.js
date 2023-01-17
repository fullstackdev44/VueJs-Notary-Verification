import Vue from "vue";

export async function loadUsers({ commit }) {
  const { data: users } = await Vue.axios.get("/users/");
  commit("setUsers", users);
}

export async function loadCustomers({ commit }) {
  const { data: customers } = await Vue.axios.get("/users/customers");
  commit("setCustomers", customers);
}
