import aws from "aws-sdk";
// import { matchedData } from 'express-validator';
import _ from "lodash";
import mongoose from "mongoose";
// import signer from 'node-signpdf';
// import {plainAddPlaceholder} from 'node-signpdf/dist/helpers'
// import path from 'path';
// import { PDFDocument } from 'pdf-lib'
import emailer from "../middleware/emailer";
// const http = require('http');
import { DocumentModel } from "../models/documentsdata";
import { IdentityModel } from "../models/identitydata";
import { NewSessionModel } from "../models/newsessiondata";
// import { NotaryDataModel } from '../models/notarydata'
// import { PDFDroppedElementsModel } from '../models/pdfdroppedelementsdata'
// import { SessionDraftsModel } from '../models/sessiondraftsdata'
// // import { SessionModel } from '../models/sessiondata'
// import { SignaturesDataModel } from '../models/signaturesdata'
// import { dbBackup } from '../service/DbBackup';
const uuid = require("uuid");
// const fs = require('fs');
// import { v4 as uuidV4 } from 'uuid';
// const { XMLParser, XMLBuilder } = require('fast-xml-parser');
// const request = require('request');
// const util = require('util');
import dotenv from "dotenv";
import _ from "mongoose-paginate-v2";
import * as utils from "../middleware/utils";
dotenv.config();
const VendorLogs = require("../models/vendorLogs");
// // import mongoose from 'mongoose'
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const stripeTest = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST);
const User = require("../models/user");
// const DocumentTemplate = require('../models/documentTemplate');
const SessionUserLogs = require("../models/sessionUserLogs");
// const UserDetails = require('../models/userDetails');
// const SessionWitness = require('../models/sessionWitness');
// const UserNotaryRelation = require('../models/userNotaryRelation.js');
// const WitnessModel = require('../models/witness');
// const controller = require('./api');
const moment = require("moment");
// const glob = require('glob')
// const ffmpeg = require('fluent-ffmpeg');
// const exec = util.promisify(require('child_process').exec);
// const sharp = require('sharp')
const JSON5 = require("json5");
var hummus = require("hummus");

aws.config.update({
  apiVersion: "2006-03-01",
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey,
  region: process.env.AWSRegion,
});
const s3 = new aws.S3();

function localGetSignedUrl(fileKey) {
  if (!fileKey) {
    return "";
  }
  if (!_.isString(fileKey)) {
    return "";
  }
  try {
    const url = s3.getSignedUrl("getObject", {
      Bucket: process.env.AWSBucket,
      Key: fileKey,
      Expires: 60 * 60 * 24 * 7,
    });
    return url;
  } catch (error) {
    return "";
  }
}

const CREATE_NEW_SESSION_REQUIRED_KEYS = [
  "notarization_id",
  "customer_email",
  "customer_first_name",
  "customer_last_name",
  // "session_documents",
  "notarization_type",
];

exports.createNewSession = async (req, res) => {
  try {
    const vendor = req.vendor;
    const body = req.body;
    console.log("vendor inside", vendor);
    console.log("body", body);
    const vendorLogsDoc = new VendorLogs({
      vendor: vendor._id,
      request_type: "inbound",
      api_request_name: "createNewSession",
      inbound_request_metadata: {
        ip: String(req.ip),
        browser: req.headers["user-agent"],
        country: req.headers["accept-language"],
      },
      request_details: {
        inbound_data: body,
      },
    });
    await vendorLogsDoc.save();
    let allFieldsPresent = true;
    let fieldsNotPresent = [];
    if (body) {
      _.map(CREATE_NEW_SESSION_REQUIRED_KEYS, (requiredKey) => {
        if (!body[requiredKey]) {
          allFieldsPresent = false;
          fieldsNotPresent.push(requiredKey);
        }
      });
    } else {
      allFieldsPresent = false;
    }
    console.log("allFieldsPresent", allFieldsPresent);
    if (allFieldsPresent && body.notarization_type === "notarize_later" && !body.session_timing) {
      allFieldsPresent = false;
      fieldsNotPresent.push("session_timing");
    }
    if (!allFieldsPresent) {
      vendorLogsDoc.response_details = {
        response: "Fail",
        response_message: "Some Fields are Missing in Response",
        internal_response: fieldsNotPresent,
      };
      await vendorLogsDoc.save();
      return res.status(403).json({
        response: "Fail",
        response_message: "Some Fields are Missing in Response",
        notarization_id: "",
        bn_session_id: "",
        bn_signing_url: "",
      });
    }
    let otherDetailsDoc = body.other_details || {};
    try {
      console.log("otherDetailsDoc", otherDetailsDoc);
      if (_.isString(otherDetailsDoc)) {
        otherDetailsDoc = JSON5.parse(otherDetailsDoc);
      }
    } catch (error) {
      console.log(error);
    }
    let sessionDocuments = body.session_documents;
    if (_.isString(sessionDocuments)) {
      try {
        // sessionDocuments = JSON.parse(sessionDocuments)
        // sessionDocuments = eval(sessionDocuments)
        sessionDocuments = JSON5.parse(sessionDocuments);
      } catch (error) {
        console.log("error", error);
        vendorLogsDoc.response_details = {
          response: "Fail",
          response_message: "Document Format is Incorrect",
          internal_response: String(error),
        };
        await vendorLogsDoc.save();
        return res.status(403).json({
          response: "Fail",
          response_message: "Document Format is Incorrect",
          notarization_id: "",
          bn_session_id: "",
          bn_signing_url: "",
        });
      }
    }
    // Allow session creation without sessiondocuments
    // if (!(sessionDocuments && sessionDocuments.length)) {
    //   vendorLogsDoc.response_details = {
    //     response: "Fail",
    //     response_message: "Document Not Found",
    //     internal_response: String(error),
    //   };
    //   await vendorLogsDoc.save();
    //   return res.status(403).json({
    //     response: "Fail",
    //     response_message: "Document Not Found",
    //     notarization_id: "",
    //     bn_session_id: "",
    //     bn_signing_url: "",
    //   });
    // }
    const email = body.customer_email;
    // check if email is registered with Notary (Role)
    let FindNotaryByEmail = await User.find({"email": email,"role":"notary"});
    if(FindNotaryByEmail.length > 0){
      res.status(400).json({
        error: email+' email is registered as notary with bluenotary. Please use a new email id.'
      });
    }
    let userDoc = await User.findOne({
      email,
      role: "customer",
      deleted: {"$ne": true},
    });
    if (!userDoc) {
      let customerName = body.customer_first_name;
      if (body.customer_middle_name) {
        customerName += " " + body.customer_middle_name;
      }
      customerName += " " + body.customer_last_name;
      userDoc = new User({
        name: customerName,
        first_name: body.customer_first_name,
        last_name: body.customer_last_name,
        email,
        password: utils.generateRandomPassword(6),
        verification: uuid.v4(),
        role: "customer",
        state: body.customer_state,
        verified: true,
        testingacc: vendor.testingacc || false,
        vendor: vendor._id,
      });
      await userDoc.save();
    }
    console.log("userDoc", userDoc);
    let meetingDateObject = null;
    let meetingTimeZone = null;
    let meetingDate = null;
    if (body.session_timing) {
      meetingDateObject = moment.utc(body.session_timing);
      console.log("meetingDateObjectmeetingDateObject", meetingDateObject);
      meetingTimeZone = String(moment.parseZone(body.session_timing).utcOffset() / 60);
      console.log("meetingTimeZonemeetingTimeZone", meetingTimeZone);
      meetingDate = moment.utc(body.session_timing).add(parseFloat(meetingTimeZone) * 60, "minutes").format("YYYY-MM-DD h:mm A");
      console.log("meetingDatemeetingDatemeetingDate", meetingDate);
      console.log(meetingDateObject, body.session_timing, meetingTimeZone, moment(body.session_timing));
    }
    const loanSigningExtraFields = {
      "loan_signing_addressLine1" : otherDetailsDoc?.property_address || "",
      "loan_signing_addressLine2" : otherDetailsDoc?.property_city || "",
      "loan_signing_userState" : otherDetailsDoc?.property_state || "",
      "loan_signing_userZipCode" : otherDetailsDoc?.property_zip || "",
      "loan_signing_state_specific_notary" : otherDetailsDoc?.notary_required_from_specific_state || "",
      "notary_required_from_specific_state_name": otherDetailsDoc?.notary_required_from_specific_state_name || "",
      "loan_signing_notes_for_notary" : otherDetailsDoc?.session_instructions || "",
    };

    let newSessionDataDoc = {
      originalDocumentIds: [],
      originalDocumentId: null,
      notorizationType: "Acknowledgement",
      vendor: vendor._id,
      userId: userDoc._id,
      currentStage: "initial_stage",
      status : "unsigned",
      sessionType : "loan_signing",
      createdAt: new Date(),
      updatedAt: new Date(),
      notorizationTiming: body.notarization_type,
      meetingTimeZone: meetingTimeZone,
      meetingdate: meetingDate,
      meetingdatetimeobj: meetingDateObject,
      multiSignerList: [],
      notarizationId: body.notarization_id,
      loanSigningExtraFields,
      testingAccSession: vendor.testingacc || false,
    };
    if (body.session_type === "gnw") {
      newSessionDataDoc.sessionType = body.session_type;
    }
    if (vendor && vendor.sessionChargeOnBusinessUser) {
      // @ts-ignore
      newSessionDataDoc.sessionChargeOnBusinessUser = vendor.sessionChargeOnBusinessUser;
      const vendoradminDoc = await User.findOne({
        vendoradmin: vendor._id,
      });
      if (vendoradminDoc) {
        // @ts-ignore
        newSessionDataDoc.invitedByCustomer = vendoradminDoc._id;
      }
    }
    console.log("newSessionDataDoc", newSessionDataDoc);
    const newSessionDoc = new NewSessionModel(newSessionDataDoc);
    await newSessionDoc.save();
    vendorLogsDoc.sessionId = newSessionDoc._id;
    await vendorLogsDoc.save();
    const sessionUserLogsData = new SessionUserLogs({
      sessionid: new mongoose.Types.ObjectId(newSessionDoc._id),
      userId: new mongoose.Types.ObjectId(userDoc._id),
      vendorId: new mongoose.Types.ObjectId(vendor._id),
      actionType: "vendor_created_session",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    sessionUserLogsData.save();
    const newIdentityModel = new IdentityModel({
      sessionid: newSessionDoc._id,
      firstName: body.customer_first_name,
      middelName: body.customer_middle_name || "",
      lastName: body.customer_last_name,
      userSsn: null,
      userZipCode: body.customer_zip,
      userState: body.customer_state,
      addressLine1: body.customer_address,
      addressLine2: body.customer_city,
      userId: userDoc._id,
      email: email,
      additionalSigner: false,
    });
    await newIdentityModel.save();
    if (body.additional_signers) {
      let additionalSigners = body.additional_signers;
      if (_.isString(additionalSigners)) {
        try {
          // session_documents = JSON.parse(session_documents)
          // session_documents = eval(session_documents)
          additionalSigners = JSON5.parse(additionalSigners);
        } catch (error) {
          console.log("error", error);
          vendorLogsDoc.response_details = {
            response: "Fail",
            response_message: "Additional Signer Format is Incorrect",
            internal_response: String(error),
          };
          await vendorLogsDoc.save();
          return res.status(403).json({
            response: "Fail",
            response_message: "Additional Signer Format is Incorrect",
            notarization_id: "",
            bn_session_id: "",
            bn_signing_url: "",
          });
        }
      }
      if (_.isArray(additionalSigners) && additionalSigners.length) {
        const multiSignersList = [];
        await Promise.all(_.map(additionalSigners, async (signerDoc) => {
          console.log(signerDoc);
          const signerEmail = signerDoc.email;
          let tempUserDoc = await User.findOne({
            email: signerEmail,
            role: "customer",
            deleted: {"$ne": true},
          });
          if (!tempUserDoc) {
            let customerName = signerDoc.first_name;
            customerName += " " + signerDoc.last_name;
            tempUserDoc = new User({
              name: customerName,
              first_name: signerDoc.first_name,
              last_name: signerDoc.last_name || "",
              email: signerEmail,
              password: utils.generateRandomPassword(6),
              verification: uuid.v4(),
              role: "customer",
              state: "",
              verified: true,
              testingacc: vendor.testingacc || false,
            });
            await tempUserDoc.save();
          }
          console.log("tempUserDoc", tempUserDoc);
          multiSignersList.push({
            "_id": tempUserDoc._id,
            "id": "input" + multiSignersList.length,
            "email": signerEmail,
          });
        }));
        console.log("multiSignersList", multiSignersList);
        newSessionDoc.multiSignerList = multiSignersList;
        console.log(newSessionDoc);
        await newSessionDoc.save();
      }
    }
    console.log(sessionDocuments);
    const sessionDocumentsUploaded = [];
    await Promise.all(_.map(sessionDocuments, async (tempSessionDoc) => {
      const base64File = tempSessionDoc.base64Doc;
      const bufferFile = new Buffer(base64File, "base64");
      console.log("bufferFile", bufferFile);
      try {
        const pdfReader = hummus.createReader(new hummus.PDFRStreamForBuffer(bufferFile));
        var pages = pdfReader.getPagesCount();
        if (pages > 0) {
          console.log("Parsable with Hummus and more than 0 pages. Seems to be a valid PDF!");
        } else {
          console.log("Unexpected outcome for number o pages: '" + pages + "'");
          return;
        }
      } catch (err) {
        console.log("ERROR while handling buffer of pdfBase64 and/or trying to parse PDF: " + err);
        return;
      }
      const documentName = tempSessionDoc.name;
      const documentKey = Date.now().toString() + documentName;
      const params = {
        Bucket: process.env.AWSBucket,
        Key: documentKey,
        Body: bufferFile,
        // ACL: "public-read",
        XAmZACL: "public-read",
      };
      try {
        const documentData = await s3.upload(params).promise();
        console.log("documentData", documentData);
        console.log("documentData buf.toString()", "" + documentData);
        const uploadedDocument = new DocumentModel({
          sessionid: newSessionDoc._id,
          documentCategory: "initial_document",
          name: documentName,
          url: localGetSignedUrl(documentKey),
          type: "application/pdf",
          size: Buffer.byteLength(bufferFile),
          key: documentKey,
          bucketName: documentData.Bucket,
          uploadedBy: userDoc._id,
          uploadedStage: "initial_stage",
        });
        await uploadedDocument.save();
        console.log("uploadedDocument", uploadedDocument);
        sessionDocumentsUploaded.push(uploadedDocument._id);
      } catch (err) {
        console.log("err", err);
      }
    }));
    // if (!sessionDocumentsUploaded.length) {
    //   vendorLogsDoc.response_details = {
    //     response: "Fail",
    //     response_message: "Final Session Documents is Empty",
    //     internal_response: "",
    //   };
    //   await vendorLogsDoc.save();
    //   return res.status(403).json({
    //     response: "Fail",
    //     response_message: "Final Session Documents is Empty",
    //     notarization_id: "",
    //     bn_session_id: "",
    //     bn_signing_url: "",
    //   });
    // }
    console.log(newSessionDoc);
    newSessionDoc.originalDocumentIds = sessionDocumentsUploaded;
    newSessionDoc.originalDocumentId = sessionDocumentsUploaded[0];

    newSessionDoc.sessionOpenCallForTaking = true;
    newSessionDoc.sessionOpenCallForTakingAt = new Date();
    await newSessionDoc.save();
    const shortSessionID = (newSessionDoc._id).toString().substr((newSessionDoc._id).toString().length - 5).toUpperCase();
    // if (!vendor.testingacc) {
    //   await emailer.sendEmailToAllNotariesForLoanSigning(shortSessionID, newSessionDoc, newIdentityModel);
    // }
    if (newSessionDataDoc.sessionType === "loan_signing") {
      await emailer.sendEmailToAllNotariesForLoanSigning(shortSessionID, newSessionDoc, newIdentityModel);
    } else {
      await emailer.sendEmailToAllNotaries(shortSessionID, newSessionDoc, newIdentityModel);
    }
    const sessionUserLogsData2 = new SessionUserLogs({
      sessionid: new mongoose.Types.ObjectId(newSessionDoc._id),
      userId: new mongoose.Types.ObjectId(userDoc._id),
      vendorId: new mongoose.Types.ObjectId(vendor._id),
      actionType: "open_call_sent",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    sessionUserLogsData2.save();
    const signingUrl = "/sign-in?type=customer&email=" + email + "&password=" + userDoc.password + "&loginViaEmail=true&sessionid=" + String(newSessionDoc._id) + "&routetype=prepareDoc&autosubmit=true";
    let hostUrl = "https://bluenotary.us" + signingUrl;
    if (vendor.whitelabel_baseurl) {
      hostUrl = vendor.whitelabel_baseurl + signingUrl;
    }
    res.status(200).json({
      response: "Pass",
      response_message: "Session Created Successfully",
      notarization_id: body.notarization_id,
      bn_session_id: String(newSessionDoc._id),
      bn_signing_url: signingUrl,
      full_signing_url: hostUrl,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.checkDocumentBeforeSession = async (req, res) => {
  const vendor = req.vendor;
  const body = req.body;
  console.log("vendor inside", vendor);
  console.log("body", body);
  const base64Doc = body?.base64Doc;
  const bn_session_id = body?.bn_session_id;
  const documentName = body?.name;
  const vendorLogsDoc = new VendorLogs({
    vendor: vendor._id,
    request_type: "inbound",
    api_request_name: "checkDocumentBeforeSession",
    inbound_request_metadata: {
      ip: String(req.ip),
      browser: req.headers["user-agent"],
      country: req.headers["accept-language"],
    },
    request_details: {
      inbound_data: body,
    },
  });
  await vendorLogsDoc.save();
  if (!bn_session_id) {
    vendorLogsDoc.response_details = {
      response: "Fail",
      response_message: "Some Fields are Missing in Response",
      internal_response: ["bn_session_id"],
    };
    await vendorLogsDoc.save();
    return res.status(403).json({
      response: "Fail",
      response_message: "BN SessionId Not Found",
    });
  }
  if (!documentName) {
    vendorLogsDoc.response_details = {
      response: "Fail",
      response_message: "Some Fields are Missing in Response",
      internal_response: ["documentName"],
    };
    await vendorLogsDoc.save();
    return res.status(403).json({
      response: "Fail",
      response_message: "Document Name Not Found",
    });
  }
  if (!base64Doc) {
    vendorLogsDoc.response_details = {
      response: "Fail",
      response_message: "Some Fields are Missing in Response",
      internal_response: ["base64Doc"],
    };
    await vendorLogsDoc.save();
    return res.status(403).json({
      response: "Fail",
      response_message: "Base64 Document Not Found",
    });
  }
  const newSessionDoc = await NewSessionModel.findOne({
    "_id": bn_session_id,
    "vendor": vendor._id,
    "deleted": {"$ne": true},
  });
  if (!newSessionDoc) {
    vendorLogsDoc.response_details = {
      response: "Fail",
      response_message: "Session Doc Not Found",
      internal_response: "Session Doc Not Found",
    };
    await vendorLogsDoc.save();
    return res.status(403).json({
      response: "Fail",
      response_message: "Session Doc Not Found",
    });
  }
  const bufferFile = new Buffer(base64Doc, "base64");
  try {
    const pdfReader = hummus.createReader(new hummus.PDFRStreamForBuffer(bufferFile));
    var pages = pdfReader.getPagesCount();
    console.log("pages", pages);
    if (pages < 1) {
      vendorLogsDoc.response_details = {
        response: "Fail",
        response_message: "Unexpected Outcome came. Document is not valid for Session",
        internal_response: "Pages Less than 1",
      };
      await vendorLogsDoc.save();
      return res.status(403).json({
        response: "Fail",
        response_message: "Unexpected Outcome came. Document is not valid for Session",
      });
    }
    const documentKey = Date.now().toString() + documentName;
    const params = {
      Bucket: process.env.AWSBucket,
      Key: documentKey,
      Body: bufferFile,
      XAmZACL: "public-read",
      // ACL: "public-read",
    };
    const sessionDocumentsUploaded = newSessionDoc.originalDocumentIds || [];
    try {
      const documentData = await s3.upload(params).promise();
      console.log("documentData", documentData);
      console.log("documentData buf.toString()", "" + documentData);
      const uploadedDocument = new DocumentModel({
        sessionid: newSessionDoc._id,
        documentCategory: "initial_document",
        name: documentName,
        url: localGetSignedUrl(documentKey),
        type: "application/pdf",
        size: Buffer.byteLength(bufferFile),
        key: documentKey,
        bucketName: documentData.Bucket,
        uploadedBy: newSessionDoc.userId,
        uploadedStage: "initial_stage",
      });
      await uploadedDocument.save();
      console.log("uploadedDocument", uploadedDocument);
      sessionDocumentsUploaded.push(uploadedDocument._id);
    } catch (err) {
      console.log("err", err);
    }
    newSessionDoc.originalDocumentIds = sessionDocumentsUploaded;
    newSessionDoc.originalDocumentId = sessionDocumentsUploaded[0];
    await newSessionDoc.save();
    const sessionUserLogsData = new SessionUserLogs({
      sessionid: new mongoose.Types.ObjectId(newSessionDoc._id),
      vendorId: new mongoose.Types.ObjectId(vendor._id),
      actionType: "session_document_added",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    sessionUserLogsData.save();
    return res.status(200).json({
      response: "Success",
      response_message: "The Document File is Successfully uploaded for the Session",
    });
  } catch (err) {
    vendorLogsDoc.response_details = {
      response: "Fail",
      response_message: "Error Came. Document is not valid for Sessionn",
      internal_response: String(err),
    };
    await vendorLogsDoc.save();
    return res.status(403).json({
      response: "Fail",
      response_message: "Error Came. Document is not valid for Session : " + String(err),
    });
  }
};
