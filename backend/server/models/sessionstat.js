const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.Types.ObjectId;

const SessionStatSchema = new mongoose.Schema(
  {
    sessionId: {
      type: ObjectId,
    },
    notaryUserId: {
      type: String,
    },
    customerUserId: {
      type: String,
    },
    notaryStat: {
      type: Object,
      default: {},
    },
    customerStat: {
      type: Object,
      default: {},
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

const SessionStatModel = mongoose.model("sessionstats", SessionStatSchema);

module.exports = SessionStatModel;
