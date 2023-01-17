import MessageStatus from "@/constants/message-status";

export function task(state) {
  return state.task;
}
export function tasks(state) {
  return state.tasks;
}
export function filter(state) {
  return state.filter;
}
export function appliedMessages(state) {
  return (
    state.task?.messages.filter(
      ({ status }) => status !== MessageStatus.Rejected && status !== MessageStatus.New
    ) ?? []
  );
}

export function messages(state) {
  const { filter: fil } = state;
  if (fil.messageStatus.length) {
    return (
      state.task?.messages?.filter(({ status }) => fil.messageStatus.includes(status)) ?? []
    );
  }
  return state.task?.messages ?? [];
}
