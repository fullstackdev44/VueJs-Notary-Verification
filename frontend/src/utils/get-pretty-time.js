import prettyMilliseconds from "pretty-ms";

const getPrettyTime = (tm, defaultV = "") => {
  if (!tm) return defaultV;
  return prettyMilliseconds(tm);
};

export default getPrettyTime;
