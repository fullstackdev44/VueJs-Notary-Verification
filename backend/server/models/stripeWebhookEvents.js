const mongoose = require("mongoose");

const StripeWebhookEventsSchema = new mongoose.Schema(
  {
    stripeCustomerId: {
      type: String,
    },
    userId: {
      type: Object,
    },
    priceId: {
      type: String,
    },
    planName: {
      type: String,
    },
    fullRequest: {
      type: Object,
    },
    fullRequestType: {
      type: String,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

module.exports = mongoose.model("StripeWebhookEvents", StripeWebhookEventsSchema);
