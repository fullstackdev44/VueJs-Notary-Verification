const mongoose = require("mongoose");

const VendorsSchema = new mongoose.Schema(
  {
    vendor_name: {
        type: String,
    },
    vendor_secret_key: {
        type: String,
    },
    vendor_key: {
        type: String,
    },
    whitelabel: {
        type: Boolean,
    },
    whitelabel_baseurl: {
        type: String,
    },
    whitelabel_imageurl: {
        type: String,
    },
    whitelabel_imagetext: {
        type: String,
    },
    whitelabel_click_linkurl: {
        type: String,
    },
    whitelabel_selective: {
        type: Object,
    },
    hideUpgradeOptions: {
        type: Boolean,
    },
    enableManageSubscriptionSettings: {
        type: Boolean,
    },
    updatesAPIWebhookDetails: {
        type: Object,
    },
    proSubscriptionSettings: {
        type: Object,
    },
    openCallSettings: {
        type: Object,
    },
    newSessionCreationLoanSession: {
        type: String,
    },
    allowLSAApplication: {
        type: Boolean,
    },
    testingacc: {
        type: Boolean,
    },
    skipSessionCharges: {
        type: Boolean,
    },
    strictPrepareDocStage: {
        type: Boolean,
    },
    dontAllowRegistering: {
        type: Boolean,
    },
    hideInformationLinks: {
        type: Boolean,
    },
    dontSendCustomerEmails: {
        type: Boolean,
    },
    chargesPaidToNotaryFromBN: {
        type: Boolean,
    },
    sessionChargeOnBusinessUser: {
        type: Boolean,
    },
    expiryAt: {
        type: Date,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

module.exports = mongoose.model("Vendors", VendorsSchema);
