import sanitizeHTML from "sanitize-html";

export default async ({ Vue }) => {
  Vue.prototype.$sanitize = sanitizeHTML;
};
