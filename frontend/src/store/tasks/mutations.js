import Vue from "vue";

export function setTask(state, task) {
  state.task = task;
}
export function setTasks(state, tasks) {
  state.tasks = tasks;
}
export function setFilter(state, filter) {
  state.filter = filter;
}
export function toggle(state, expanded) {
  const messages = state.task?.messages?.map((message) => ({ ...message, expanded }));
  Vue.set(state.task, "messages", messages);
}
export function updateMessage(state, message) {
  const index = state?.task?.messages?.findIndex(({ id }) => message.id === id) ?? -1;
  if (index !== -1) {
    Vue.set(state.task.messages, index, message);
  }
}
