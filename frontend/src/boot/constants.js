import constants from "src/constants";

export default async (context) => {
  const { Vue } = context;

  Vue.prototype.$constants = constants;
};
