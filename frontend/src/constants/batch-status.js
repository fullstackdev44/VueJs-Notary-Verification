export const BatchStatus = {
  Progress: "Progress",
  Finalized: "Finalized",
  Processing: "Processing",
  ProcessingFailed: "Processing Failed",
  Completed: "Completed",
};

export const BatchStatusToColor = {
  Processing: "warning",
  Progress: "info",
  "QA Ready": "secondary",
  "Processing Failed": "negative",
  "QA Approved": "positive",
  Completed: "primary",
  Finalized: "positive",
};
