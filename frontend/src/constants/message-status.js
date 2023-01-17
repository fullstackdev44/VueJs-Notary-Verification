const MessageStatus = {
  Backlog: "Backlog",
  New: "New",
  Labeled: "Labeled",
  Approved: "Approved",
  Rejected: "Rejected",
  InProcessing: "In Processing",
  Failed: "Failed",
  Processed: "Processed",
};

export default MessageStatus;
export const MessageStatusToColor = {
  default: "info",
  Backlog: "grey",
  New: "info",
  Labeled: "secondary",
  Approved: "positive",
  Rejected: "negative",
  Pending: "warning",
  Processed: "primary",
  Finalized: "positive",
  "In Processing": "purple",
  Failed: "deep-orange",
};
