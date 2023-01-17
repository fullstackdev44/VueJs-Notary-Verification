const EmailAuthStatus = {
  Unknown: "Unknown",
  Success: "Success",
  Failed: "Failed",
  InvalidCredential: "InvalidCredential",
};

export default EmailAuthStatus;
export const EmailAuthStatusToColor = {
  Unknown: "warning",
  InvalidCredential: "negative",
  Failed: "negative",
  Success: "positive",
};
