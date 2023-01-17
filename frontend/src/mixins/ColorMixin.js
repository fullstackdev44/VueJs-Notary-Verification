export default {
  methods: {
    getStatusColor(status) {
      let statusColor = "primary";
      switch (status) {
        case "unsigned":
          statusColor = "blue";
          break;
        case "complete":
          statusColor = "teal";
          break;
        case "expired":
          statusColor = "grey-8";
          break;
        case "ready to sign":
          statusColor = "green";
          break;
        case "ready to pick up":
          statusColor = "orange";
          break;
        case "failed":
          statusColor = "red";
          break;
        default:
          statusColor;
      }
      return statusColor;
    },
    getSessionTypeColor(sessionType) {
      let sessionTypeColor = "pink-4";
      switch (sessionType) {
        case "loan_signing":
          sessionTypeColor = "info";
          break;
        default:
          sessionTypeColor;
      }
      return sessionTypeColor;
    },
    getSessionTypeText(sessionType) {
      let sessionTypeText = "GNW";
      switch (sessionType) {
        case "loan_signing":
          sessionTypeText = "Loan Signing";
          break;
        default:
          sessionTypeText;
      }
      return sessionTypeText;
    }
  },
};
