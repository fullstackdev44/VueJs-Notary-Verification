const mongoose = require("mongoose");

const VendorLogsSchema = new mongoose.Schema(
  {
    vendor: {
      type: Object,
    },
    request_type: {
      type: String,
    },
    api_request_name: {
      type: String,
    },
    inbound_request_metadata: {
      type: Object,
    },
    request_details: {
      type: Object,
    },
    response_details: {
      type: Object,
    },
    sessionId: {
      type: Object,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

module.exports = mongoose.model("VendorLogs", VendorLogsSchema);
