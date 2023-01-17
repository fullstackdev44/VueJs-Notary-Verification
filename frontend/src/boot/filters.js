export default async ({ Vue }) => {
  Vue.filter("capitalize", (value) => {
    if (!value) return "";
    value = value.toString();
    return value.charAt(0).toUpperCase() + value.slice(1);
  });
  Vue.filter("percent", (value) => {
    if (!value) return "0.00";
    value = (100.0 * value).toFixed(2);
    return `${value}%`;
  });
};
