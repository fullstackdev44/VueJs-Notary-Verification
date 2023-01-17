export default function state() {
  return {
    task: null,
    tasks: [],
    filter: {
      messageStatus: [],
      taskStatus: [],
      labelers: [],
      batchs: [],
    },
  };
}
