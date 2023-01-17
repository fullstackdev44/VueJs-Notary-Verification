import Vue from "vue";

export async function load({ commit }, taskId = null) {
  const { data: task } = await Vue.axios.get(taskId ? `/tasks/one?task=${taskId}` : "/tasks/one");
  commit("setTask", task);
}
export async function loadTasks({ commit }) {
  const { data: tasks } = await Vue.axios.get("/tasks");
  commit("setTasks", tasks.map((item, index) => ({
    index: index + 1, ...item,
  })));
}
export async function loadNew({ commit }) {
  const { data: task } = await Vue.axios.get("/tasks/one?getNew=true");
  commit("setTask", task);
}
