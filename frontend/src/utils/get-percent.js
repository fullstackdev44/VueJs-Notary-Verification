const getPercent = (val, total, defaultV = "") => {
  if (!total) return defaultV;
  return `${((100.0 * val) / total).toFixed(2)}%`;
};

export default getPercent;
