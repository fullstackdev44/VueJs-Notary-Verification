const mongoose = require("mongoose");

const OpenCallsSchema = new mongoose.Schema(
  {
    sessionid: {
        type: Object,
    },
    userId: {
        type: Object,
    },
    vendor: {
        type: Object,
    },
    openCallNumber: {
        type: Number,
    },
    category: {
        type: String,
    },
    openCallType: {
        type: String,
    },
    openCallState: {
        type: String,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

module.exports = mongoose.model("OpenCalls", OpenCallsSchema);
