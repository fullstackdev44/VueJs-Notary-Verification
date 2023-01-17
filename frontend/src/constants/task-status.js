export const TaskStatus = {
  New: "New",
  Progress: "Progress",
  QaReady: "QA Ready",
  QaRejected: "QA Rejected",
  QaApproved: "QA Approved",
  AdminRejected: "Admin Rejected",
  AdminApproved: "Admin Approved",
  Processing: "Processing",
  Completed: "Completed",
};

export const TaskStatusToColor = {
  default: "warning",
  New: "warning",
  Progress: "info",
  "QA Ready": "secondary",
  Processing: "secondary",
  "QA Rejected": "negative",
  "QA Approved": "positive",
  Completed: "primary",
  "Admin Rejected": "negative",
  "Admin Approved": "positive",
};
