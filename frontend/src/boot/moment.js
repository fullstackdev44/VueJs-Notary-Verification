import _ from "moment";

export default async (context) => {
  const { Vue } = context;

  Vue.prototype.$moment = _;
};
