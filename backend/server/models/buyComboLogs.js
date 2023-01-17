const mongoose = require("mongoose");

const BuyComboLogsSchema = new mongoose.Schema(
  {
    userId: {
      type: Object,
    },
    buyComboStripeSessionId: {
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

module.exports = mongoose.model("BuyComboLogs", BuyComboLogsSchema);
