const mongoose = require("mongoose");

const BuyDCLogsSchema = new mongoose.Schema(
  {
    userId: {
      type: Object,
    },
    buyDCStripeSessionId: {
      type: String,
    },
    requestedAt: {
      type: Date,
    },
    certificateValidTill: {
      type: Date,
    },
    paymentDone: {
      type: Boolean,
    },
    updatedAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

module.exports = mongoose.model("BuyDCLogs", BuyDCLogsSchema);
