const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.Types.ObjectId;

const sessionExportSchema = new mongoose.Schema(
    {
        requestedBy: {
            type: ObjectId,
            required: true,
        },
        recipients: {
            type: Array,
            required: true,
        },
        exportItems: {
            type: Object,
            default: {},
            required: true,
        },
        exportView: {
            type: String,
            enum: ["notaryDashboard", "notaryJournal", "businessSessions", "businessDocuments"],
            required: true,
        },
        status: {
            type: String,
            enum: ["init", "processing", "processed"],
            default: "init",
        },
        zipfile: String,
        deleted: Boolean,
    },
    {
        versionKey: false,
        timestamps: true,
    },
);

const sessionExportsModel = mongoose.model("sessionexports", sessionExportSchema);

module.exports = sessionExportsModel;
