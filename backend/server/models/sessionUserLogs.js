const mongoose = require("mongoose");

const SessionUserLogsSchema = new mongoose.Schema(
  {
    sessionid: {
        type: Object,
    },
    userId: {
        type: Object,
    },
    vendorId: {
        type: Object,
    },
    vendorDoc: {
        type: Object,
    },
    userDoc: {
        type: Object,
    },
    userType: {
        type: String,
    },
    actionType: {
        type: String,
    },
    actionStage: {
        type: String,
    },
    ip: {
        type: String,
    },
    browser: {
        type: String,
    },
    country: {
        type: String,
    },
    kbaAnswers: {
        type: Array,
    },
    isUserWitness: {
        type: Boolean,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

module.exports = mongoose.model("SessionUserLogs", SessionUserLogsSchema);
