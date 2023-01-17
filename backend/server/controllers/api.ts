import aws from 'aws-sdk';
import { matchedData } from 'express-validator';
import _ from 'lodash';
import mongoose from 'mongoose'
import signer from 'node-signpdf';
import {plainAddPlaceholder} from 'node-signpdf/dist/helpers'
import path from 'path';
import { PDFDocument } from 'pdf-lib'
import emailer from '../middleware/emailer';
const http = require('http');
const https = require('https');
import amqplib, { Channel, Connection } from 'amqplib';
import * as utils from '../middleware/utils';
import { DocumentModel } from '../models/documentsdata';
import { IdentityModel } from '../models/identitydata';
import { NewSessionModel } from '../models/newsessiondata';
import { NotaryDataModel } from '../models/notarydata'
import { PDFDroppedElementsModel } from '../models/pdfdroppedelementsdata'
import { SessionDraftsModel } from '../models/sessiondraftsdata'
const OpenVidu = require('openvidu-node-client').OpenVidu;
// import { SessionModel } from '../models/sessiondata'
import { SignaturesDataModel } from '../models/signaturesdata'
import { dbBackup } from '../service/DbBackup';
const uuid = require('uuid');
const fs = require('fs');
const ejs = require('ejs');
const htmlpdf = require('html-pdf');
import { v4 as uuidV4 } from 'uuid';
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const request = require('request');
const util = require('util');
import dotenv from 'dotenv';
dotenv.config();
// import mongoose from 'mongoose'
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const stripeTest = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST);
const User = require('../models/user');
const DocumentTemplate = require('../models/documentTemplate');
const SessionUserLogs = require('../models/sessionUserLogs');
const StripeWebhookEvents = require('../models/stripeWebhookEvents');
const UserDetails = require('../models/userDetails');
const SessionWitness = require('../models/sessionWitness');
const UserNotaryRelation = require('../models/userNotaryRelation.js');
const WitnessModel = require('../models/witness');
const Vendors = require('../models/vendors');
const UserAccess = require('../models/userAccess');
const BuyDCLogs = require('../models/buyDCLogs');
const BuySealLogs = require('../models/buySealLogs');
const SessionStatModel = require('../models/sessionstat');
const sessionExportsModel = require('../models/sessionExport');
const BuyComboLogs = require('../models/buyComboLogs');
const OpenCalls = require('../models/openCalls');
const controller = require('./api');
const moment = require('moment');
const glob = require('glob')
const ffmpeg = require('fluent-ffmpeg');
const exec = util.promisify(require('child_process').exec);
const VendorService = require('../service/VendorService')
const CustomService = require('../service/CustomService')
const ProfileService = require('../service/ProfileService')
const DCService = require('../service/DCService')

// specify templates.json path relative to dist/server/controller/api.js
const templateDocsJson = require('../constants/templates.json');

const PDFName = require('pdf-lib').PDFName;
const PDFNumber = require('pdf-lib').PDFNumber;
const PDFHexString = require('pdf-lib').PDFHexString;
const PDFString = require('pdf-lib').PDFString;
const PDFArrayCustom = require('../helpers/PDFArrayCustom')

const waitFor = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

const redis = require('redis');
let redisClient;
(async () => {
  redisClient = redis.createClient();
  redisClient.on('error', (err) => console.log(`Redis Error: ${err}`));
  redisClient.on('connect', () => console.log('Connected to redis'));
  await redisClient.connect();
})();

const useOldPDFPreprocessingMethod = true;
const openViduUrl = process.env.OPENVIDU_URL || 'https://videomaster.bluenotary.us'
const openViduSecret = process.env.OPENVIDU_SECRET || 'ZsIC81I5xEyu'

const openvidu = new OpenVidu(
  openViduUrl,
  openViduSecret
);

// const sharp = require('sharp')
// const personaSDK = require('api')('@personaidentities/v2021-07-05#rz19xbmkydp6zrx');

// const PricingJson = require('../../../server/constants/pricing.json')
const PricingJson = {
  pricing: {
      'Arizona': {
          notaryFee: '10.00',
          serviceFee: '15.00',
          loan_signing: {
            notaryFee: '150.00',
            notaryFeeText: 'Loan Signing Notarization',
            serviceFee: '0.00'
          }
      },
      'Colorado': {
          notaryFee: '10.00',
          serviceFee: '15.00',
          loan_signing: {
            notaryFee: '150.00',
            notaryFeeText: 'Loan Signing Notarization',
            serviceFee: '0.00'
          }
      },
      'Maryland': {
          notaryFee: '4.00',
          serviceFee: '21.00',
          loan_signing: {
            notaryFee: '150.00',
            notaryFeeText: 'Loan Signing Notarization',
            serviceFee: '0.00'
          }
      },
      'Montana': {
          notaryFee: '10.00',
          serviceFee: '15.00',
          loan_signing: {
            notaryFee: '150.00',
            notaryFeeText: 'Loan Signing Notarization',
            serviceFee: '0.00'
          }
      },
      'Missouri': {
          notaryFee: '5.00',
          serviceFee: '20.00',
          loan_signing: {
            notaryFee: '150.00',
            notaryFeeText: 'Loan Signing Notarization',
            serviceFee: '0.00'
          }
      },
      'New York': {
          notaryFee: '5.00',
          serviceFee: '20.00',
          loan_signing: {
            notaryFee: '150.00',
            notaryFeeText: 'Loan Signing Notarization',
            serviceFee: '0.00'
          }
      },
      'Pennsylvania': {
          notaryFee: '5.00',
          serviceFee: '20.00',
          loan_signing: {
            notaryFee: '150.00',
            notaryFeeText: 'Loan Signing Notarization',
            serviceFee: '0.00'
          }
      },
      'North Dakota': {
          notaryFee: '5.00',
          serviceFee: '20.00',
          loan_signing: {
            notaryFee: '150.00',
            notaryFeeText: 'Loan Signing Notarization',
            serviceFee: '0.00'
          }
      },
      'North Carolina': {
          notaryFee: '5.00',
          serviceFee: '20.00',
          loan_signing: {
            notaryFee: '150.00',
            notaryFeeText: 'Loan Signing Notarization',
            serviceFee: '0.00'
          }
      },
      'West Virginia': {
        notaryFee: '10.00',
        serviceFee: '15.00',
        loan_signing: {
          notaryFee: '150.00',
          notaryFeeText: 'Loan Signing Notarization',
          serviceFee: '0.00'
        }
      },
      'Others': {
          notaryFee: '25.00',
          serviceFee: '0.00',
          loan_signing: {
            notaryFee: '150.00',
            notaryFeeText: 'Loan Signing Notarization',
            serviceFee: '0.00'
          }
      }
  }
}
const AlertingService = require('../service/AlertingService')

const idClassMap = {
  cct: 'Certificate of Citizenship',
  cid: 'Consular ID',
  dl: 'Drivers License',
  foid: 'Colombia Foreigner ID',
  hic: 'Canada Health Insurance Card',
  id: 'Identification Card',
  ipp: 'Russia Internal Passport',
  keyp: 'Australia Keypass ID',
  ltpass: 'Singapore Long Term Visit Pass',
  myn: 'Japan MyNumber Card',
  nbi: 'Philippines National Bureau of Investigation Certificate',
  nric: 'Singapore National Residency ID',
  ofw: 'Philippines Overseas Foreign Worker Card',
  rp: 'Residence Permit',
  pan: 'India Permanent Account Number Card',
  pid: 'Philippines Postal Identification Card',
  pp: 'Passport',
  ppc: 'Passport Card',
  pr: 'Permanent Residence Card',
  sss: 'Philippines Social Security System Card',
  td: 'US Refugee Travel Document',
  umid: 'Philippines United Multi Purpose ID',
  vid: 'Voter Id',
  visa: 'Immigration Visa',
  wp: 'Work Permit'
}

const videoSavingDir = './tmp';

const SESSION_TIMEOUT_IN_MINUTES = 30
aws.config.update({
  apiVersion: '2006-03-01',
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey,
  region: process.env.AWSRegion
})
console.log({
  apiVersion: '2006-03-01',
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey,
  region: process.env.AWSRegion
})
const s3 = new aws.S3()

interface ISessionStat {
  waitingRoom?: string,
  videoCam?: string,
  completePendingItems?: string
}

function getTimeZone(timezone) {
  let actualTimezone = 'Central';
  switch (timezone) {
    case '5.5':
      actualTimezone = 'GMT+05:30';
      break;
    case '-10':
      actualTimezone = 'Hawaii';
      break;
    case '-8':
      actualTimezone = 'Pacific';
      break;
    case '-7':
      actualTimezone = 'Mountain';
      break;
    case '-6':
      actualTimezone = 'Central';
      break;
    case '-5':
      actualTimezone = 'Eastern Time';
      break;
    case '-4':
      actualTimezone = 'Atlantic';
      break;
  }
  return actualTimezone;
};

function formatDate(rawDate, sessiondoc) {
  if (!rawDate) {
    return 'Notarization not completed yet';
  }
  let timeZoneMultiple = '-6';
  if (sessiondoc && typeof sessiondoc.meetingTimeZone !== 'undefined') {
    timeZoneMultiple = sessiondoc.meetingTimeZone;
  }
  const finalDate = moment(rawDate, 'YYYY-MM-DD HH:mm A').add(parseFloat(timeZoneMultiple) * 60, 'minutes');
  const timezoneString = getTimeZone(timeZoneMultiple);
  return `${finalDate.format('MMMM, Do YYYY')} at ${finalDate
    .format('hh:mmA')} ${timezoneString}`;
};

function getKBAType(sessionDoc, identityDoc) {
  let kbaType = 'ID + KBA';
  if (sessionDoc?.typeOfKBA === 'foreigners_without_residential') {
    kbaType = 'Id + Biometrics';
  }
  const idClass = identityDoc?.personaAPIResponseDoc?.fields?.['identification-class']?.value ||
    identityDoc?.fullPersonaAPIResponseDoc?.data?.attributes?.fields?.['identification-class']?.value;
  console.log('idClass', idClass);
  if (idClass) {
    const photoIdName = idClassMap[idClass];
    kbaType += ` (${photoIdName})`;
  } else if (identityDoc?.typeOfPhotoId) {
    let photoIdName = 'Driver\'s License';
    const photoIdType = identityDoc?.typeOfPhotoId;
    if (photoIdType === 'passportbook') {
      photoIdName = 'Passport Book';
    } else if (photoIdType === 'passportcard') {
      photoIdName = 'Passport Card';
    }
    kbaType += ` (${photoIdName})`;
  } else {
    kbaType += ' (Driver\'s License)';
  }
  if (sessionDoc?.skipCustomerKBACheck) {
    kbaType = 'Skipped';
  }
  return kbaType;
};

const generateBlueNotaryFollowUpDocument = async (sessionId) => {
  try {
    await waitFor(6000)
    const sessionDoc = await NewSessionModel.findOne({
      _id: new mongoose.Types.ObjectId(sessionId)
    })
    if (!sessionDoc) {
      return
    }
    const finalDocumentDocs = await DocumentModel.find({
      sessionid : sessionId,
      documentCategory : 'final_document_with_dc',
      deleted: {$ne: true}
    })
    const primarySignerDoc = await User.findOne({
      _id: sessionDoc.userId
    })
    const primarySignerIdentities = await IdentityModel.findOne({
      sessionid: sessionId,
      userId: sessionDoc.userId
    })
    const notaryUserDoc = await User.findOne({
      _id: sessionDoc.notaryUserId
    })
    const notaryDataDoc = await NotaryDataModel.findOne({
      userId: sessionDoc.notaryUserId
    })
    const additionalSignerIds = _.map(sessionDoc.multiSignerList || [], '_id')
    let additionalSignerDocs = []
    if (additionalSignerIds.length) {
      additionalSignerDocs = await User.find({
        _id: {$in: additionalSignerIds}
      })
    }
    const sessionJoinedUserLog = await SessionUserLogs.findOne({
      sessionid: sessionDoc._id,
      actionType : 'join_session'
    })
    let sessionStartedTime = '';
    if (sessionJoinedUserLog) {
      sessionStartedTime = formatDate(sessionJoinedUserLog.createdAt, sessionDoc)
    }
    const sessionCompletedUserLog = await SessionUserLogs.findOne({
      sessionid: sessionDoc._id,
      actionType : 'session_completed'
    });
    let sessionEndTime = '';
    if (sessionCompletedUserLog) {
      sessionEndTime = formatDate(sessionCompletedUserLog.createdAt, sessionDoc);
    }
    // @ts-ignore
    const idcardState = primarySignerIdentities?.cardAPIResponseDoc?.platformresponse?.
      response?.[0]?.cardresult?.[0]?.documentaddress?.[0]?.state?.[0];
    // @ts-ignore
    const idcardExpiry = primarySignerIdentities?.cardAPIResponseDoc?.platformresponse?.
      response?.[0]?.cardresult?.[0]?.documentinformation?.[0]?.expirationdate?.[0];
    const templateObject = {
      shortSessionId: (sessionDoc._id).toString().substr((sessionDoc._id).toString().length - 5).toUpperCase(),
      fullSessionId: (sessionDoc._id).toString(),
      primarySignerName: primarySignerDoc?.name,
      primarySignerEmail: primarySignerDoc?.email,
      primarySignerAddress1: primarySignerIdentities?.addressLine1,
      primarySignerAddress2: primarySignerIdentities?.addressLine2,
      additionalSignerDocs,
      notaryName: notaryUserDoc?.name,
      notaryCommissionNumber: notaryUserDoc?.commissionNumber,
      notaryCommissionExpiry: moment.unix(notaryDataDoc.commissionExpiresOn).format('DD/MM/YYYY'),
      finalDocumentNames: _.map(finalDocumentDocs, 'name'),
      notarizationStartTime: sessionStartedTime,
      notarizationEndTime: sessionEndTime,
      credentialsProvidedType: getKBAType(sessionDoc, primarySignerIdentities),
      credentialsProvidedState: idcardState,
      credentialsProvidedExpiry: idcardExpiry,
      feesCharged: sessionDoc.costOfNotarization,
      totalFeesCharged: sessionDoc.finalCostOfNotarization
    }
    console.log('templateObject', templateObject)
    const templateHtml = await ejs.renderFile(
      path.join(__dirname, '../../templates/followupdocument.ejs'),
      templateObject
    );
    const options = {
      height: '9.25in',
      width: '7in',
      header: {
        height: '10mm'
      },
      footer: {
        height: '10mm'
      },
      childProcessOptions: { env: { OPENSSL_CONF: '/dev/null' } },
      phantomArgs: ['--ignore-ssl-errors=yes']
    };
    const pdfFileName = sessionId + '_' + Math.floor(Math.random() * 999) + '_followup_document.pdf'
    htmlpdf.create(templateHtml, options).toFile(pdfFileName, async (err, data) => {
      console.log('data', data)
      console.log('file created successfully')
      if (err) {
        console.log(err)
      } else {
        const fileContent = fs.readFileSync(data.filename);
        const fileSize = fs.statSync(data.filename)
        const file = await upload(process.env.AWSBucket, pdfFileName, fileContent, 'application/pdf')
        console.log(file)
        if (file) {
          const uploadedDocument = new DocumentModel({
            sessionid: sessionDoc._id,
            documentCategory: 'followup_document',
            name: pdfFileName,
            url: localGetSignedUrl(file.Key),
            type: 'application/pdf',
            size: fileSize.size,
            key: file.Key,
            bucketName: file.Bucket,
            uploadedStage: 'meet_notary_stage'
          });
          const followupDocumentDoc = await uploadedDocument.save();
          sessionDoc.followupDocumentId = followupDocumentDoc._id;
          await sessionDoc.save();
          fs.unlinkSync(data.filename);
        }
      }
    });
  } catch (error) {
    console.log('followup document generation error', error)
  }
}

// generateBlueNotaryFollowUpDocument('62f0a3ac96bbbdcb99468dc6')

exports.regerateAllFollowupDocuments = async () => {
  try {
    const allSessionIds = await NewSessionModel.distinct('_id', {
      status: 'complete',
      deleted: {$ne: true}
    })
    for (const tempSessionId of allSessionIds) {
      await generateBlueNotaryFollowUpDocument(tempSessionId)
      await waitFor(3000)
    }
  } catch (error) {
    console.log(error)
  }
};

function getTimeOfSessionFormatted(session) {
  let meetingDateFormatted
  if (session && session.meetingTimeZone) {
    const timezoneString = getTimeZone(session.meetingTimeZone);
    meetingDateFormatted = `${moment(session.meetingdate, 'YYYY-MM-DD HH:mm A').add(parseFloat(session.meetingTimeZone) * 60, 'minutes')
      .format('MMMM, Do YYYY')} at ${moment(session.meetingdate, 'YYYY-MM-DD HH:mm A')
      .format('hh:mmA')} ${timezoneString}`;
  } else {
    meetingDateFormatted = `${moment(session.meetingdate, 'YYYY-MM-DD HH:mm A')
    .utcOffset('-06:00')
    .format('MMMM, Do YYYY')} at ${moment(session.meetingdate, 'YYYY-MM-DD HH:mm A')
    .utcOffset('-06:00')
    .format('hh:mmA')} CST`
  }
  return meetingDateFormatted
};

async function manuallySignDCForSession(sessionId) {
  const sessionDoc = await NewSessionModel.findOne({
    _id: sessionId
  })
  if (!sessionDoc) {
    console.log('SessionDoc not found for manually signing')
    return
  }

  const notaryDatasDoc = await NotaryDataModel.findOne({
    userId: sessionDoc.notaryUserId
  })

  const notaryUser = await User.findOne({
    _id: sessionDoc.notaryUserId, deleted: {$ne: true}
  })

  const notaryData = {
    notaryUserId: notaryUser.id,
    contactInfo: notaryUser.email,
    name: notaryUser.name,
    location: (notaryDatasDoc && notaryDatasDoc.county) || 'US',
    dcPassword: (notaryDatasDoc && notaryDatasDoc.dcpassword) || 'bnDCpwd21'
  }
  console.log('notaryDatasDoc', notaryDatasDoc)

  const allFinalDocumentsDoc = await DocumentModel.find({
    sessionid: sessionId,
    documentCategory: 'final_document',
    deleted: {$ne: true}
  })

  await Promise.all(_.map(allFinalDocumentsDoc, async (finalDocumentDoc) => {
    await signDocument(finalDocumentDoc.key,
      notaryDatasDoc.fileKey,
      sessionId,
      'Signed Certificate By Blue Notary.',
      notaryData);

  }));
}

console.log(manuallySignDCForSession)
// manuallySignDCForSession('62f64f1bafea43199aa586d0')

function localGetSignedUrl(fileKey) {
  if (!fileKey) {
    return ''
  }
  if (!_.isString(fileKey)) {
    return ''
  }
  try {
    const url = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWSBucket,
      Key: fileKey,
      Expires: 60 * 60 * 24 * 7
    });
    return url
  } catch (error) {
    console.log('errorerror', error)
    return ''
  }
}

// VendorService.sendVendorUpdates({
//   vendor_name : 'Zigsig',
//   vendor_secret_key : 'bnkey-90bfb5b3153c9fa3fa87f845d04a23162aa0ccd3fac91585ec09702123123123123-ADSASDFBASD',
//   vendor_key : 'ADSASDFBASD',
//   whitelabel : true,
//   testingacc : true,
//   skipSessionCharges : true,
//   whitelabel_baseurl : 'http://localhost:8080',
//   whitelabel_imageurl : 'https://seeklogo.com/images/K/kawasaki-winter-test-logo-345DE97253-seeklogo.com.png',
//   whitelabel_imagetext : 'Testing Company',
//   whitelabel_click_linkurl : 'https://google.com',
//   hideUpgradeOptions : true,
//   dontAllowRegistering : true,
//   dontAllowNewSession : true,
//   hideInformationLinks : true,
//   crisp_id : '304706cf-9e5d-477f-b338-cdef1fe63217',
//   updatesAPIWebhookDetails : {
//       url : 'https://ptsv2.com/t/jax26-1658312319/post',
//       _url : 'https://webhook.site/6b60b4ed-a938-4a71-baad-becf95914aa6',
//       headers : {
//           hello : 'world'
//       }
//   }
// }, {
//   notarizationId: 'temp_notatization_id_124',
//   _id: '62e13b76f44d7ac06995f23b'
// }, 'session_completed', {
//   message: 'Session Completed Successfully',
//   final_output_files: [{name: '', base64Doc: ''}]
// }, {
//   first_name: 'asdf',
//   middle_name: 'asdf',
//   last_name: 'asdf',
//   email: 'asdf'
// })

exports.db_backup = async (req, res) => {
  try {
    req = matchedData(req);
    console.log('db_backup:', req)
    await dbBackup()
    res.status(200).json({ message: 'Database backup queued successfully.' });
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.uploadFiles = async (req, res) => {
  try {
    const file = req.file
    console.log('uploadFile 2:', file)
    console.log('req:', req.user)
    const user = req.user
    req = matchedData(req);
    console.log('uploadFile 1 :', req)

    if (file) {
      const session = await NewSessionModel.findOne({ _id: req.id });
      // Create Document First
      const uploadedDocument = new DocumentModel({
        sessionid: session._id,
        documentCategory: 'initial_document',
        name: file.originalname,
        url: localGetSignedUrl(file.key),
        type: file.mimetype,
        size: file.size,
        key: file.key,
        bucketName: file.bucket,
        uploadedBy: user.id,
        uploadedStage: 'initial_stage'
      });
      await uploadedDocument.save();
      if (!session.originalDocumentIds) {
        session.originalDocumentIds = []
      }
      session.originalDocumentId = uploadedDocument._id;
      session.originalDocumentIds.push(session.originalDocumentId)
      await session.save();
      CustomService.preprocessSessionDocumentBeforeSession(session._id, uploadedDocument._id)
      res.status(200).json({session, url: localGetSignedUrl(file.key), document: [uploadedDocument] });
    } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.uploadEditedDocument = async (req, res) => {
  try {
    const file = req.file
    console.log('uploadFile 2:', file)
    console.log('req:', req.user)
    const user = req.user
    req = matchedData(req);
    const documentId = req.documentId;
    const sessionId = req.sessionId;
    const doctype = req.doctype;

    if (file) {
      let oldDocumentDatasDoc
      if (doctype !== 'new') {
        const oldDocumentDatasDocNewObject = await DocumentModel.findOne({
          _id: documentId,
          sessionid: sessionId,
          deleted: {$ne: true}
        })
        if (!oldDocumentDatasDocNewObject) {
          return res.status(404).json({ error: true, message: 'Document Not Found' });
        }
        oldDocumentDatasDocNewObject._id = mongoose.Types.ObjectId();
        oldDocumentDatasDocNewObject.documentCategory = 'initial_document_old'
        oldDocumentDatasDocNewObject.isNew = true;
        console.log('oldDocumentDatasDocNewObject', oldDocumentDatasDocNewObject)
        await oldDocumentDatasDocNewObject.save()

        oldDocumentDatasDoc = await DocumentModel.findOne({
          _id: documentId,
          sessionid: sessionId
        })

        oldDocumentDatasDoc.nonEditedDocumentId = oldDocumentDatasDocNewObject._id
        oldDocumentDatasDoc.url = localGetSignedUrl(file.key)
        oldDocumentDatasDoc.type = file.mimetype
        oldDocumentDatasDoc.size = file.size
        oldDocumentDatasDoc.key = file.key
        oldDocumentDatasDoc.bucketName = file.bucket
        oldDocumentDatasDoc.documentCategory = 'initial_document'
        await oldDocumentDatasDoc.save()
        const response = await CustomService.preprocessSessionDocumentBeforeSession(sessionId, oldDocumentDatasDoc._id)
        console.log('responseresponse', response)
        oldDocumentDatasDoc = response?.fullDocument
      } else {
        oldDocumentDatasDoc = new DocumentModel({
          sessionid: sessionId,
          url: localGetSignedUrl(file.key),
          type: file.mimetype,
          size: file.size,
          key: file.key,
          name: file.originalname || file.key,
          bucketName: file.bucket,
          documentCategory: 'initial_document',
          uploadedBy : user._id,
          uploadedStage : 'meet_notary_stage'
        })
        await oldDocumentDatasDoc.save()
        const session = await NewSessionModel.findOne({ _id: sessionId });
        session.originalDocumentIds.push(oldDocumentDatasDoc._id)
        await session.save();
        CustomService.preprocessSessionDocumentBeforeSession(session._id, oldDocumentDatasDoc._id)
      }

      res.status(200).json({document: oldDocumentDatasDoc });
    } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.deleteSessionDocument = async (req, res) => {
  try {
    const file = req.file
    console.log('uploadFile 2:', file)
    console.log('req:', req.user)
    const user = req.user
    req = matchedData(req);
    const documentId = req.documentId;
    const sessionId = req.sessionId;
    const existingDocument = await DocumentModel.findOne({
      _id: documentId,
      sessionid: sessionId,
      deleted: {$ne: true}
    })
    if (!existingDocument) {
      return res.status(200).json({ error: true, message: 'Document Not Found' });
    }
    existingDocument.deleted = true
    existingDocument.deletedAt = new Date()
    existingDocument.deletedBy = user._id
    await existingDocument.save()
    const session = await NewSessionModel.findOne({
      _id: sessionId
    })
    if (session) {
      if (session.originalDocumentIds) {
        session.originalDocumentIds = _.filter(session.originalDocumentIds, (tempDocumentId) => {
          return String(tempDocumentId) !== String(req.documentId)
        })
        session.originalDocumentId = session.originalDocumentIds[0]
      }
      await session.save()
    }
    return res.status(200).json({success: true});
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.convertUploadedDoc = async (req, res) => {
  try {
    const file = req.file
    console.log('uploadFile 2:', file)
    console.log('req:', req.user)
    // const user = req.user
    req = matchedData(req);
    console.log('uploadFile 1 :', req)
    if (file) {
      console.log('file', file)
      const response = await CustomService.preprocessSessionDocumentBeforeSession(false, false, file)
      console.log('response', response)
      res.status(200).json({url: localGetSignedUrl(response?.doc?.key), document: response?.doc });
    } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryFileUpload = async (req, res) => {
  try {
    const file = req.file
    const user = req.user
    const dcpassword = req.body.dcpassword || 'bnDCpwd21'
    req = matchedData(req);
    console.log('filefile', file)
    const dcMatchResponse = await checkIfDCPasswordIsValid(file.key, dcpassword)
    if (!dcMatchResponse) {
      return res.status(400).json({
        errors: {
          msg: 'Digital Certificate Password does not match with .p12 certificate'
        }
      })
    }
    if (file) {
      const notarydm = await NotaryDataModel.findOne({ userId: user._id })
      if (notarydm) {
        notarydm.certfileLocation = file.destination
        notarydm.certfileUrl = localGetSignedUrl(file.key)
        notarydm.certfileSource = 'manual'
        notarydm.certfileAddedAt = new Date()
        notarydm.fileKey = file.key
        notarydm.certfilename = file.originalname
        notarydm.dcpassword = dcpassword
        await notarydm.save()
      } else {
        const newProxy = new NotaryDataModel({
          sessionid: req.id,
          userId: user._id,
          email: user.email,
          certfileLocation: file.destination,
          certfileUrl: localGetSignedUrl(file.key),
          certfileSource: 'manual',
          certfileAddedAt: new Date(),
          certfilename: file.originalname,
          fileKey: file.key,
          dcpassword
        })
        await newProxy.save()
      }
      await NotaryDataModel.find({ userId: user._id })
      res.status(200).json({
        message: 'Certificate uploaded successfully.'
      });
    } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryFileDelete = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);
    const notarydm = await NotaryDataModel.findOne({ userId: user._id })
    if (notarydm) {
      const params = {
        Bucket: process.env.AWSBucket,
        Key: notarydm.fileKey
      }

      try {
        await s3.headObject(params).promise()
        console.log('File Found in S3')
        try {
          await s3.deleteObject(params).promise()
          console.log('file deleted Successfully')
        } catch (err) {
          console.log('ERROR in file Deleting : ' + JSON.stringify(err))
        }
      } catch (err) {
        console.log('File not Found ERROR : ' + err)
      }
      notarydm.certfileLocation = null
      notarydm.certfileUrl = null
      notarydm.certfileSource = null
      notarydm.certfileAddedAt = null
      notarydm.fileKey = null
      notarydm.certfilename = null
      await notarydm.save()
    }
    res.status(200).json({
      message: 'Certificate successfully removed.'
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryCertificatesUpload = async (req, res) => {
  try {
    const file = req.file
    const user = req.user
    req = matchedData(req);
    if (file) {
      const notarydm = await NotaryDataModel.findOne({ userId: user._id })
      if (notarydm) {
        notarydm.notaryCertificates.push({
          name: file.originalname,
          url: localGetSignedUrl(file.key),
          key: file.key
        });
        await notarydm.save()
      } else {
        const newProxy = new NotaryDataModel({
          sessionid: req.id,
          notaryCertificates: [{
            name: file.originalname,
            url: localGetSignedUrl(file.key),
            key: file.key
          }],
          userId: user._id,
          email: user.email,
          dcpassword: 'bnDCpwd21'
        })
        await newProxy.save()
      }
      await NotaryDataModel.find({ userId: user._id })
      res.status(200).json({
        message: 'Certificate uploaded successfully.'
      });
    } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryCopyOfComissionLetter = async (req, res) => {
  try {
    const file = req.file;
    const user = req.user;
    req = matchedData(req);
    if (file) {
      const notarydm = await NotaryDataModel.findOne({ userId: user._id });
      if (notarydm) {
        notarydm.notaryCopyOfCommissionLetterName = file.originalname;
        notarydm.notaryCopyOfCommissionLetterUrl = localGetSignedUrl(file.key);
        notarydm.notaryCopyOfCommissionLetterKey = file.key;
        await notarydm.save();
      } else {
        const newProxy = new NotaryDataModel({
          notaryCopyOfCommissionLetterName: file.originalname,
          notaryCopyOfCommissionLetterUrl: localGetSignedUrl(file.key),
          notaryCopyOfCommissionLetterKey: file.key,
          userId: user._id,
          email: user.email,
          dcpassword: 'bnDCpwd21'
        });
        await newProxy.save();
      }
      await NotaryDataModel.find({ userId: user._id });
      res.status(200).json({
        message: 'Copy of Commission Letter uploaded successfully.'
      });
    } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryLSALetter = async (req, res) => {
  try {
    const file = req.file;
    const user = req.user;
    req = matchedData(req);
    if (file) {
      const notarydm = await NotaryDataModel.findOne({ userId: user._id });
      if (notarydm) {
        notarydm.lsaApprovalLetterName = file.originalname;
        notarydm.lsaApprovalLetterUrl = localGetSignedUrl(file.key);
        notarydm.lsaApprovalLetterKey = file.key;
        notarydm.lsaApprovalLetterUploadedAt = new Date();
        await notarydm.save();
      } else {
        const newProxy = new NotaryDataModel({
          lsaApprovalLetterName: file.originalname,
          lsaApprovalLetterUrl: localGetSignedUrl(file.key),
          lsaApprovalLetterKey: file.key,
          lsaApprovalLetterUploadedAt: new Date(),
          userId: user._id,
          email: user.email,
          dcpassword: 'bnDCpwd21'
        });
        await newProxy.save();
      }
      await NotaryDataModel.find({ userId: user._id });
      res.status(200).json({
        message: 'LSA Approval Letter uploaded successfully.'
      });
    } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryHundredRONCompletionLetter = async (req, res) => {
  try {
    const file = req.file;
    const user = req.user;
    req = matchedData(req);
    if (file) {
      const notarydm = await NotaryDataModel.findOne({ userId: user._id });
      if (notarydm) {
        notarydm.hundredRONcompletionProofName = file.originalname;
        notarydm.hundredRONcompletionProofUrl = localGetSignedUrl(file.key);
        notarydm.hundredRONcompletionProofKey = file.key;
        notarydm.hundredRONcompletionProofUploadedAt = new Date();
        await notarydm.save();
      } else {
        const newProxy = new NotaryDataModel({
          hundredRONcompletionProofName: file.originalname,
          hundredRONcompletionProofUrl: localGetSignedUrl(file.key),
          hundredRONcompletionProofKey: file.key,
          hundredRONcompletionProofUploadedAt: new Date(),
          userId: user._id,
          email: user.email,
          dcpassword: 'bnDCpwd21'
        });
        await newProxy.save();
      }
      await NotaryDataModel.find({ userId: user._id });
      res.status(200).json({
        message: 'LSA Approval Letter uploaded successfully.'
      });
    } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryEOInsuranceDocument = async (req, res) => {
  try {
    const file = req.file;
    const user = req.user;
    req = matchedData(req);
    if (file) {
      const notarydm = await NotaryDataModel.findOne({ userId: user._id });
      if (notarydm) {
        notarydm.eoInsuranceProofName = file.originalname;
        notarydm.eoInsuranceProofUrl = localGetSignedUrl(file.key);
        notarydm.eoInsuranceProofKey = file.key;
        notarydm.eoInsuranceProofUploadedAt = new Date();
        await notarydm.save();
      } else {
        const newProxy = new NotaryDataModel({
          eoInsuranceProofName: file.originalname,
          eoInsuranceProofUrl: localGetSignedUrl(file.key),
          eoInsuranceProofKey: file.key,
          eoInsuranceProofUploadedAt: new Date(),
          userId: user._id,
          email: user.email,
          dcpassword: 'bnDCpwd21'
        });
        await newProxy.save();
      }
      await NotaryDataModel.find({ userId: user._id });
      res.status(200).json({
        message: 'EO Insurance uploaded successfully.'
      });
    } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryCertificateDelete = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);
    const data = req.data;
    const notarydm = await NotaryDataModel.findOne({ userId: user._id })
    if (notarydm) {
      const params = {
        Bucket: process.env.AWSBucket,
        Key: data.key
      }

      try {
        await s3.headObject(params).promise()
        console.log('File Found in S3')
        try {
          await s3.deleteObject(params).promise()
          console.log('file deleted Successfully')
        } catch (err) {
          console.log('ERROR in file Deleting : ' + JSON.stringify(err))
        }
      } catch (err) {
        console.log('File not Found ERROR : ' + err)
      }
      const certificates = notarydm.notaryCertificates.filter((item) => item.key !== data.key);
      notarydm.notaryCertificates = certificates;
      notarydm.save();
    }
    res.status(200).json({
      message: 'Notary certificate successfully removed.'
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.saveNotaryDataFields = async (req, res) => {
  try {
    const user = req.user
    console.log(req.data)
    console.log(req.params)
    console.log(req.body)
    const body = req.body;
    const notarydm = await NotaryDataModel.findOne({ userId: user._id })
    if (notarydm) {
      if (body.dcpassword) {
        const dcMatchResponse = await checkIfDCPasswordIsValid(notarydm.fileKey, body.dcpassword)
        console.log('dcMatchResponse', dcMatchResponse)
        if (!dcMatchResponse) {
          return res.status(400).json({
            errors: {
              msg: 'Digital Certificate Password does not match with .p12 certificate'
            }
          })
        }
        notarydm.dcpassword = body.dcpassword;
      }
      notarydm.save();
    } else {
      return res.status(400).json({
        errors: {
          msg: 'Please save Digital Certificate first, before saving the password'
        }
      })
    }
    res.status(200).json({
      message: 'Notary certificate Password Updated.'
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.sendForNotaryLSAApproval = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);
    const spanishLanguageFluency = req.spanishLanguageFluency
    const loanSigningRONExperience = req.loanSigningRONExperience
    const userDoc = await User.findOne({
      _id: user._id, deleted: {$ne: true}
    })
    if (!userDoc) {
      return res.status(400).json({
        errors: {
          msg: 'User not found'
        }
      })
    }
    const notarydm = await NotaryDataModel.findOne({ userId: user._id })
    if (!(notarydm && notarydm.lsaApprovalLetterKey && notarydm.eoInsuranceProofKey)) {
      return res.status(400).json({
        errors: {
          msg: 'Please provide all needed documents'
        }
      })
    }
    if (!loanSigningRONExperience) {
      return res.status(400).json({
        errors: {
          msg: 'Please provide Loan Signing Notarisation Experience'
        }
      })
    }
    notarydm.spanishLanguageFluency = spanishLanguageFluency
    notarydm.loanSigningRONExperience = loanSigningRONExperience
    await notarydm.save()
    userDoc.lsaApproved = false;
    userDoc.lsaApprovalStatus = 'approval_pending';
    userDoc.lsaApprovalSubmittedAt = new Date();
    userDoc.spanishLanguageFluency = spanishLanguageFluency
    await userDoc.save()
    res.status(200).json({
      message: 'Your application is successfully sent for LSA Approval'
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.loadsSessionData = async (req, res) => {
  try {
    const user = req.user
    console.log('req.userId before' , req.userId);
    req = matchedData(req);
    let document = null;
    let sessions = null;

    let vendorDoc
    if (user.vendor) {
      vendorDoc = await Vendors.findOne({_id: user.vendor})
    }

    if (req.sessionId === 'new') {
      console.log('req.userId' , req.userId);
      const newSessionTempDoc = {
        sessionid: uuidV4(),
        userId: req.userId,
        // sessionCode: (Math.random() + 1).toString(36).substring(7).toUpperCase(),
        currentStage: 'initial_stage',
        status: 'unsigned',
        testingAccSession: user.testingacc ? true : false,
        stagesHistory: [{
            stageName: 'Session created',
            stageDate: new Date()
        }],
        notaryUserId: null,
        invitedViaSessionLink: false,
        sessionType: null,
        vendor: user.vendor
      }
      if (user.refferedByNotary) {
        newSessionTempDoc.notaryUserId = user.refferedByNotary
      }
      if (user.invitedViaSessionLink) {
        newSessionTempDoc.invitedViaSessionLink = user.invitedViaSessionLink
      }
      if (req.sessionType === 'loan_signing') {
        newSessionTempDoc.sessionType = 'loan_signing'
      }
      if (vendorDoc && vendorDoc.newSessionCreationLoanSession) {
        newSessionTempDoc.sessionType = 'loan_signing'
      }
      if (user.allSessionsAsLoanSignings) {
        newSessionTempDoc.sessionType = 'loan_signing'
      }
      if (!newSessionTempDoc.sessionType) {
        delete newSessionTempDoc.sessionType
      }
      if (vendorDoc && vendorDoc.sessionChargeOnBusinessUser) {
        // @ts-ignore
        newSessionTempDoc.sessionChargeOnBusinessUser = vendorDoc.sessionChargeOnBusinessUser
        const vendoradminDoc = await User.findOne({
          vendoradmin: vendorDoc._id
        })
        if (vendoradminDoc) {
          // @ts-ignore
          newSessionTempDoc.invitedByCustomer = vendoradminDoc._id
        }
      }
      // create new session
      sessions =  new NewSessionModel(newSessionTempDoc);
      await sessions.save();
    } else {
      sessions = await NewSessionModel.findOne({ _id: req.sessionId });
    }

    if (sessions) {
      document = await DocumentModel.find({ sessionid: sessions._id, documentCategory : 'initial_document',
        deleted: {$ne: true} });
    }
    let notaryUserDoc
    if (sessions.notaryUserId) {
      notaryUserDoc = await User.findOne({_id: sessions.notaryUserId, deleted: {$ne: true}})
    }

    res.status(200).json({session: sessions, document, notaryUserDoc, vendorDoc});

  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.loadsNotaryDetailData = async (req, res) => {
  try {
    const user = req.user
    const dontGetStripe = req.body.dontGetStripe || false;
    req = matchedData(req);
    const sessions = JSON.parse(JSON.stringify(await NotaryDataModel.findOne({ userId: user._id })))
    sessions.stripeAccountDetails = {}
    const notarydm = await NotaryDataModel.findOne({ userId: user._id })
    // console.log('notarydm', notarydm)
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    if (notarydm && notarydm.stripeAccountName && !dontGetStripe) {
      const account = await stripeToUse.accounts.retrieve(
        notarydm.stripeAccountName
      );
      let linkExpired = true
      if (typeof notarydm.stripeLoginLinkCreatedAt !== 'undefined') {
        const stripeLoginLinkCreatedAt = moment(notarydm.stripeLoginLinkCreatedAt * 1000);
        const now = moment();
        if ((now.diff(stripeLoginLinkCreatedAt, 'seconds')) < 3600) {
          linkExpired = false
        }
      }
      if (!notarydm.stripeAccountLoginLink || linkExpired) {
        try {
          const stripeResponse = await stripeToUse.accounts.createLoginLink(
            notarydm.stripeAccountName
          );
          if (stripeResponse) {
            notarydm.stripeAccountLoginLink = stripeResponse.url;
            notarydm.stripeLoginLinkCreatedAt = stripeResponse.created
            await notarydm.save();
          }
        } catch (error) {
          console.log(error)
        }
      }
      sessions.stripeAccountDetails = notarydm
      sessions.stripeFullAccountDetails = account
    }
    if (notarydm && notarydm.subscriptionCustomerId && !dontGetStripe) {
      const paymentMethods = await stripeToUse.paymentMethods.list({
        customer: notarydm.subscriptionCustomerId,
        type: 'card'
      });
      console.log('paymentMethods', paymentMethods)
      sessions.paymentMethods = paymentMethods
    }
    // console.log('sessions.stripeAccountDetails')
    // console.log(sessions.stripeAccountDetails)
    console.log('sessionssessions', sessions)
    res.status(200).json(sessions);

  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.getPaymentMethods = async (req, res) => {
  try {
    const user = req.user;
    const inputData = req.body
    req = matchedData(req);
    let stripeToUse;
    let userDocToUse = user
    if (inputData && user.notaryInvitedByBusinessUserId && (inputData.notaryInvitedByBusinessUserPaymentMethod === true
      || inputData.notaryInvitedByBusinessUserPaymentMethod === 'true')) {
      console.log('user.notaryInvitedByBusinessUserId', user.notaryInvitedByBusinessUserId)
      userDocToUse = await User.findOne({
        _id: user.notaryInvitedByBusinessUserId
      })
    }
    if (userDocToUse.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    let stripeCustomerID = '';
    if (userDocToUse.stripeCustomerID) {
      stripeCustomerID = userDocToUse.stripeCustomerID;
    } else {
      const cQry = `email:"${userDocToUse.email}"`;
      const stripeUser = await stripeToUse.customers.search({ query: cQry });
      if (!stripeUser || !stripeUser.data || !stripeUser.data.length) {
        res.status(200).json({error: true, message: 'Customer not found'});
        return;
      }
      stripeCustomerID = stripeUser.data[0].id
      const userDoc = await User.findOne({email: userDocToUse.email, deleted: {$ne: true}});
      userDoc.stripeCustomerID = stripeCustomerID;
      await userDoc.save();
    }
    const paymentMethods = await stripeToUse.paymentMethods.list({
      customer: stripeCustomerID,
      type: 'card'
    })
    const paymentMethodsData = paymentMethods?.data || [];
    res.status(200).json({ paymentMethods: paymentMethodsData, stripeCustomerID });
  } catch (error) {
    utils.handleError(res, error);
  }
}

exports.videoJoin = async (req, res) => {
  try {
    // const user = req.user
    req = matchedData(req);
    const sessionId = req.sessionId
    const sessionDoc = await openvidu.createSession({
      customSessionId: 'session_' + sessionId,
      recordingMode: 'MANUAL',
      recordingLayout: 'BEST_FIT',
      defaultRecordingProperties: {
        outputMode: 'COMPOSED',
        resolution: '640x480',
        frameRate: 24
      }
    });
    // console.log('sessionssessions', sessions)
    const connection = await sessionDoc.createConnection({});
    // console.log('sessions.stripeAccountDetails')
    // console.log(sessions.stripeAccountDetails)
    res.status(200).json({
      connectionToken: connection?.token
    });

  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.videoRecord = async (req, res) => {
  try {
    // const user = req.user
    req = matchedData(req);
    const sessionId = req.sessionId
    console.log('sessionId', sessionId, 'session_' + sessionId)
    try {
      openvidu.startRecording('session_' + sessionId)
      .then((response) => {
        console.log('stop recording response', response);
      })
      .catch((error2) => {
        console.log('stop recording error2', error2)
      });
    } catch (tempError) {
      console.log('stop recording tempError', tempError)
    }

    res.status(200).json({
      status: 'success'
    });

  } catch (error) {
    utils.handleError(res, error);
  }
};

const seedDocumentTemplates = async (user, pendingTemplates) => {
  const docs = require('../constants/templates.json')
  const processing = await Promise.all(_.map(docs.templates, async (document) => {
    if (!pendingTemplates.includes(document.name)) {
      return true
    }
    const template = path.resolve(document.path);
    if (!fs.existsSync(template)) {
      return false;
    }
    const fileContent = fs.readFileSync(template);
    const params = {
      Bucket: process.env.AWSBucket,
      Key: document.key,
      Body: fileContent,
      // ACL: 'public-read',
      XAmzAcl: 'public-read'
    };
    try {
      const documentData = await s3.upload(params).promise();
      if (documentData) {
        const temp = new DocumentTemplate({
          type: 'predefined',
          name: document.name,
          documentUrl: localGetSignedUrl(documentData.Key),
          key: documentData.Key,
          bucketname: documentData.Bucket,
          uploadedBy: user._id
        });
        await temp.save();
      }
    } catch (err) {
      console.log(err);
    }
    return true;
  }));
  return processing;
};

exports.loadDocumentTemplates = async (req, res) => {
  try {
    const user = req.user;
    req = matchedData(req);
    let templates = await DocumentTemplate.find({uploadedBy: user._id}).sort({ createdAt: -1 });
    const allPredefinedTemplateNames = _.map(templates, 'name')
    const pendingTemplates = []
    _.map(templateDocsJson?.templates, (localTemplateDoc) => {
      if (!allPredefinedTemplateNames.includes(localTemplateDoc.name)) {
        pendingTemplates.push(localTemplateDoc.name)
      }
    })
    if (pendingTemplates.length) {
      await seedDocumentTemplates(user, pendingTemplates);
      templates = await DocumentTemplate.find({ uploadedBy: user._id }).sort({ createdAt: -1 });
    }
    res.status(200).json(templates);

  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.templateOptions = async (req, res) => {
  try {
    const user = req.user;
    req = matchedData(req);
    let templates = await DocumentTemplate.find({uploadedBy: user._id}).sort({ createdAt: -1 });
    const allPredefinedTemplateNames = _.map(templates, 'name')
    const pendingTemplates = []
    _.map(templateDocsJson?.templates, (localTemplateDoc) => {
      if (!allPredefinedTemplateNames.includes(localTemplateDoc.name)) {
        pendingTemplates.push(localTemplateDoc.name)
      }
    })
    if (pendingTemplates.length) {
      await seedDocumentTemplates(user, pendingTemplates);
      templates = await DocumentTemplate.find({ uploadedBy: user._id }).sort({ createdAt: -1 });
    }
    res.status(200).json(templates);

  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryTemplateFindOne = async (req, res) => {
  try {
    const user = req.user;
    req = matchedData(req);
    const template = await DocumentTemplate.findOne({ _id: req.templateId });
    const notaryDatasDoc = await NotaryDataModel.findOne({ userId: user.id })
    const pdfDroppedElementDatas = await PDFDroppedElementsModel.findOne({ templateid: req.templateId });
    res.status(200).json({
      template,
      notaryDatasDoc,
      pdfDroppedElementDatas
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

// pdfdroppedelements

exports.notaryTemplateUpdatePdfDroppedElements = async (req, res) => {
  try {
    let droppedElements = req.body && req.body.droppedElements || [];
    req = matchedData(req);
    const template = await DocumentTemplate.findOne({ _id: req.templateId });
    if (!template) {
      return res.status(404).json({
        error: 'Template Doc Not Found'
      });
    }
    let pdfDroppedElementsDoc = await PDFDroppedElementsModel.findOne({ templateid: req.templateId });
    if (!pdfDroppedElementsDoc) {
      pdfDroppedElementsDoc = new PDFDroppedElementsModel({ templateid: req.templateId })
    }
    console.log('droppedElements', droppedElements)
    if (_.isString(droppedElements)) {
      droppedElements = JSON.parse(droppedElements);
    }
    pdfDroppedElementsDoc.droppedElements = droppedElements
    await pdfDroppedElementsDoc.save()
    res.status(200).json({
      message: 'Template fields successfully updated.'
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryTemplateUpdate = async (req, res) => {
  try {
    req = matchedData(req);
    const template = await DocumentTemplate.findOne({ _id: req.templateId });
    if (template) {
      template.name = req.templateName;
      await template.save();
    }
    res.status(200).json({
      message: 'Template successfully updated.',
      reqs: req
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryTemplateDelete = async (req, res) => {
  try {
    req = matchedData(req);
    const template = await DocumentTemplate.findOne({ _id: req.templateId });
    if (template) {
      const params = {
        Bucket: process.env.AWSBucket,
        Key: template.key
      }
      console.log(params);
      try {
        await s3.headObject(params).promise()
        console.log('File Found in S3')
        try {
          await s3.deleteObject(params).promise()
          console.log('file deleted Successfully')
        } catch (err) {
          console.log('ERROR in file Deleting : ' + JSON.stringify(err))
        }
      } catch (err) {
        console.log('File not Found ERROR : ' + err)
      }
      await template.remove();
    }
    res.status(200).json({
      message: 'Template successfully removed.'
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.saveDocumentTemplate = async (req, res) => {
  const user = req.user;
  const file = req.file;
  req = matchedData(req);
  const template = new DocumentTemplate({
    type: 'custom',
    documentUrl: localGetSignedUrl(file.key),
    name: file.key,
    key: file.key,
    bucketname: file.bucket,
    uploadedBy: user._id
  });
  await template.save();
  res.status(200).json({ message: 'Template successfully saved.' });
}
exports.saveSealFile = async (req, res) => {
  const user = req.user;
  const file = req.file;
  req = matchedData(req);
  const isExisting = await NotaryDataModel.exists({
    userId: user._id
  })
  console.log('filefile', file)
  console.log('isExistingisExisting', isExisting)
  if (!isExisting) {
    const newProxy = new NotaryDataModel({
      sealdata: localGetSignedUrl(file.key),
      sealfilename: file.key,
      userId: user._id,
      email: user.email,
      dcpassword: 'bnDCpwd21'
    })
    await newProxy.save()
    res.status(200).json({ message: 'Seal image uploaded successfully.', file: newProxy.sealdata });
  } else {
    const newProxy = await NotaryDataModel.findOne({ userId: user._id })
    newProxy.sealdata = localGetSignedUrl(file.key);
    newProxy.sealfilename = file.key;
    newProxy.userId = user._id
    newProxy.email = user.email
    await newProxy.save()
    res.status(200).json({ message: 'Seal image uploaded successfully.', file: newProxy.sealdata });
  }
}
exports.saveNotaryDetailData = async (req, res) => {
  try {

    const user = req.user;
    req = matchedData(req);
    const data = req.data;
    console.log('Notary controller api ', user, data);

    let email = user.email;
    let sealData;
    const {spawn} = require('child_process');
    const template = path.resolve('./public/templates/' + data.state + '.jpg');
    let userName = user.name;
    if (data.name) {
      userName = data.name;
    }
    const commissionNumberEscaped = data.commissionNumber.replace(/[^a-zA-Z0-9]/g, '')
    const python = spawn('python3', [
      path.resolve('./scripts/alter_seal_template.py'),
      data.state,
      userName,
      data.commissionNumber,
      data.commissionExpiresOn,
      template,
      data.county,
      commissionNumberEscaped,
      'jpg'
    ], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'inherit'
    });
    await new Promise( (resolve) => {
      python.on('close', resolve)
    })
    await waitFor(1000)
    console.log('commissionNumberEscaped', commissionNumberEscaped)
    const sealFile = path.resolve('./public/templates/seal-' + commissionNumberEscaped + '.jpg');
    console.log('sealFile', sealFile)
    const fileContent = fs.readFileSync(sealFile);
    console.log('fileContent', fileContent)
    const params = {
      Bucket: process.env.AWSBucket,
      Key: Date.now().toString() + 'seal-' + commissionNumberEscaped + '.jpg',
      Body: fileContent,
      // ACL: 'public-read'
      XAmzAcl: 'public-read'
    };
    try {
      sealData = await s3.upload(params).promise()
      fs.unlinkSync(sealFile);
    } catch (err) {
      console.log(err)
    }
    if (sealData) {
      if (data.email && data.email.length) {
        email = data.email;
      }
      const isExisting = await NotaryDataModel.exists({
        userId: user._id
      });
      console.log('notary data :', isExisting);
      const notaryUser = await User.findOne({_id: user._id, deleted: {$ne: true}});
      if (notaryUser) {
        notaryUser.first_name = data.first_name;
        notaryUser.last_name = data.last_name;
        notaryUser.name = data.name;
        notaryUser.commissionNumber = data.commissionNumber;
        notaryUser.state = data.state;
        notaryUser.email = data.email;
        notaryUser.county = data.county;
        notaryUser.spanishLanguageFluency = data.spanishLanguageFluency || false;
        // if (notaryUser.commissionNumber && notaryUser.state &&
        // data.commissionExpiresOn && notaryUser.approve !== 'active') {
        //   notaryUser.approve = 'active'
        // }
        await notaryUser.save();
      }
      console.log('notaryUser spi.ts 643', notaryUser);

      if (!isExisting) {
        const newProxy = new NotaryDataModel({
          commissionExpiresOn: data.commissionExpiresOn,
          dcpassword: data.dcpassword,
          sealdata: localGetSignedUrl(sealData.key),
          sealfilename: sealData.key,
          userId: user._id,
          email
        });
        await newProxy.save();
        res.status(200).json(newProxy);
      } else {
        let newProxy = await NotaryDataModel.findOne({ userId: user._id });
        console.log('user:', newProxy);

        newProxy.commissionExpiresOn = data.commissionExpiresOn;
        newProxy.dcpassword = data.dcpassword;
        newProxy.sealdata = localGetSignedUrl(sealData.key);
        newProxy.sealfilename = sealData.key;
        newProxy.userId = user._id;
        newProxy.email = email;
        await newProxy.save();
        if (newProxy.buySealPurchaseExpiryDate || newProxy.buyComboPurchaseExpiryDate) {
          await CustomService.generateNotarySealsPNGForRemainingNotaries(user._id)
          newProxy = await NotaryDataModel.findOne({ userId: user._id });
        }
        res.status(200).json(newProxy);
      }
    } else {
      res.status(500).json({ message: 'Unable to generate notary seal.' })
    }
  } catch (error) {
    console.log(error)
    utils.handleError(res, error);
  }
};
exports.connectStripe = async (req, res) => {
  try {
    const user = req.user;
    req = matchedData(req);
    const notarydm = await NotaryDataModel.findOne({ userId: user._id })
    if (!notarydm) {
      return res.status(400).json({
        error: true,
        errorMessage: 'Notary Data not found'
      })
    }
    let stripeAccountName = '';
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    if (notarydm.stripeAccountName) {
      stripeAccountName = notarydm.stripeAccountName
    } else {
      const stripeResponse = await stripeToUse.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: {requested: true},
          transfers: {requested: true}
        },
        business_profile: {
          // url: 'http://localhost:8080',
          url: 'https://app.bluenotary.us',
          mcc: 5045
        }
      });
      if (stripeResponse && stripeResponse.id) {
        stripeAccountName = stripeResponse.id
      }
      console.log('stripeResponse')
      console.log(stripeResponse)
      console.log('stripeAccountName')
      console.log(stripeAccountName)
      notarydm.stripeAccountName = stripeAccountName
      await notarydm.save()
    }

    let stripeAccountLink = '';
    // if (notarydm.stripeAccountLink) {
    //   stripeAccountLink = notarydm.stripeAccountLink
    // } else {
    let refreshUrl = 'https://app.bluenotary.us/notary/account-settings?stripeConfirmation=failure'
    let returnUrl = 'https://app.bluenotary.us/notary/account-settings?stripeConfirmation=success'
    if (process.env.NODE_ENV === 'development') {
      refreshUrl = 'http://localhost:8080/notary/account-settings?stripeConfirmation=failure'
      returnUrl = 'http://localhost:8080/notary/account-settings?stripeConfirmation=success'
    }
    const stripeResponse2 = await stripeToUse.accountLinks.create({
      account: stripeAccountName,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    });
    console.log('stripeResponse2', stripeResponse2)
    stripeAccountLink = stripeResponse2.url
    notarydm.stripeAccountLink = stripeAccountLink
    notarydm.stripeAccountLinkValidTill = stripeResponse2.expires_at
    await notarydm.save()
    // }
    console.log(stripeAccountLink)
    res.status(200).json({
      success: true,
      stripeAccountLink
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.getAuditTrail = async (req, res) => {
  try {
    // const user = req.user;
    const sessionid = req.params && req.params.id;
    req = matchedData(req);
    // const sessionItem = await NewSessionModel.findOne({ _id: req.sessionId });
    console.log({sessionid})
    const auditTrail = await SessionUserLogs.find({sessionid: new mongoose.Types.ObjectId(sessionid)})
    if (!auditTrail.length) {
      res.status(200).json({
        auditTrail: []
      });
    }
    const lastAuditTrail = auditTrail && auditTrail[auditTrail.length - 1]
    const allAuditTrailUsers = await User.find({
      _id: {$in: _.uniq(_.compact(_.map(auditTrail, 'userId')))}
    })
    const auditTrailUsersKeyed = _.keyBy(allAuditTrailUsers, '_id')
    const auditTrailUsersEmail = _.map(allAuditTrailUsers, 'email')
    const userAccessLogs = await UserAccess.find({
      email: {$in: auditTrailUsersEmail},
      createdAt: {$lte: lastAuditTrail.createdAt}
    }, {
      ip: 1,
      email: 1
    }).sort({_id: -1})
    const emailWiseIpAddress = {}
    _.map(userAccessLogs, (userLog) => {
      if (!emailWiseIpAddress[userLog.email]) {
        emailWiseIpAddress[userLog.email] = userLog.ip
      }
    })
    const allAuditTrailVendors = await Vendors.find({
      _id: {$in: _.uniq(_.compact(_.map(auditTrail, 'vendorId')))}
    }, {
      vendor_name: 1,
      vendor_key: 1
    })
    const auditTrailVendorsKeyed = _.keyBy(allAuditTrailVendors, '_id')
    const sessionWitnesses = await SessionWitness.find({sessionid})
    let allWitnessUserIds = _.compact(_.map(sessionWitnesses, 'userid'))
    const witnessesId = _.compact(_.map(sessionWitnesses, 'witnessid'))
    if (witnessesId.length) {
      const localWitnessUserIds = await WitnessModel.distinct('userid', {_id: {$in: witnessesId}})
      allWitnessUserIds = _.union(allWitnessUserIds, localWitnessUserIds)
    }
    allWitnessUserIds = _.map(allWitnessUserIds, (tempId) => String(tempId))
    console.log('allWitnessUserIds', allWitnessUserIds)
    const finalAuditTrail = _.map(auditTrail, (tempAuditTrailItem) => {
      tempAuditTrailItem.userDoc = auditTrailUsersKeyed[tempAuditTrailItem.userId] || {}
      tempAuditTrailItem.vendorDoc = auditTrailVendorsKeyed[tempAuditTrailItem.vendorId] || {}
      tempAuditTrailItem.ip = emailWiseIpAddress[tempAuditTrailItem.userDoc?.email] || ''
      tempAuditTrailItem.isUserWitness = allWitnessUserIds.includes(String(tempAuditTrailItem.userId))
      return tempAuditTrailItem
    })
    console.log('finalAuditTrail.length', finalAuditTrail.length)
    res.status(200).json({
      auditTrail: _.sortBy(finalAuditTrail, ['_id'])
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.archieveSessionItem = async (req, res) => {
  try {
    const user = req.user;
    req = matchedData(req);
    const sessionItem = await NewSessionModel.findOne({ _id: req.sessionId });
    sessionItem.archieved = true;
    if (!sessionItem.archievedBy) {
      sessionItem.archievedBy = []
    }
    sessionItem.archievedBy = _.union(sessionItem.archievedBy, [user._id])
    sessionItem.archievedAt = new Date();
    await sessionItem.save()
    res.status(200).json({
      success: true
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.unarchieveSessionItem = async (req, res) => {
  try {
    const user = req.user;
    req = matchedData(req);
    const sessionItem = await NewSessionModel.findOne({ _id: req.sessionId });
    sessionItem.archieved = null;
    sessionItem.archievedBy = _.filter(sessionItem.archievedBy, (tempUserDoc) => {
      return String(tempUserDoc) !== String(user._id)
    })
    console.log('sessionItem.archievedBy', sessionItem.archievedBy)
    sessionItem.archievedAt = null;
    await sessionItem.save()
    res.status(200).json({
      success: true
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.deleteSessionItem = async (req, res) => {
  try {
    req = matchedData(req);
    const item = await NewSessionModel.findOne({ sessionid: req.sessionId });
    const document = await DocumentModel.findOne({ sessionid: item._id, _id: req.documentId, deleted: {$ne: true} });
    console.log(item)
    if (document) {
      const params = {
        Bucket: process.env.AWSBucket,
        Key: document.key
      }

      try {
        await s3.headObject(params).promise()
        console.log('File Found in S3')
        try {
          await s3.deleteObject(params).promise()
          console.log('file deleted Successfully')
        } catch (err) {
          console.log('ERROR in file Deleting : ' + JSON.stringify(err))
        }
      } catch (err) {
        console.log('File not Found ERROR : ' + err)
      }
      await document.remove();
    }
    const deleted = await NewSessionModel.deleteOne({ sessionid: req.sessionId })

    console.log(deleted);
    const sessions = await NewSessionModel.find({ sessionid: item.sessionid })
    res.status(200).json(sessions);
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.deleteSessionDocumentOld = async (req, res) => {
  try {
    req = matchedData(req);
    const document = await DocumentModel.findOne({ sessionid: req.sessionId, _id: req.documentId,
      deleted: {$ne: true} });
    if (document) {
      const params = {
        Bucket: process.env.AWSBucket,
        Key: document.key
      }

      try {
        await s3.headObject(params).promise()
        console.log('File Found in S3')
        try {
          await s3.deleteObject(params).promise()
          console.log('file deleted Successfully')
        } catch (err) {
          console.log('ERROR in file Deleting : ' + JSON.stringify(err))
        }
      } catch (err) {
        console.log('File not Found ERROR : ' + err)
      }
      await document.remove();
    }

    const session = await NewSessionModel.findOne({ _id: req.sessionId });
    const otherDocument = await DocumentModel.findOne({ sessionid: req.sessionId });
    if (!otherDocument) {
      session.originalDocumentId = null
    }
    if (session.originalDocumentIds) {
      session.originalDocumentIds = _.filter(session.originalDocumentIds, (tempDocumentId) => {
        return tempDocumentId !== req.documentId
      })
    }
    await session.save();
    res.status(200).json({session, document: [] });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.saveSessionData = async (req, res) => {
  try {

    const user = req.user

    // const data = {
    //   sessionOpenCallForTaking: true
    // }
    const data = req.body && req.body.data || false;
    if (!data) {
      return res.status(400).json({error: 'Data Not Found' });
    }
    // req = matchedData(req);
    const session = await NewSessionModel.findOne({ _id: req.params.id });
    //console.log(session)
    const multiSignerListEmail = _.map(data.multiSignerList || [], 'email');
        if (multiSignerListEmail.length > 0) {
          for(var i=0; i < multiSignerListEmail.length; i++){
            let FindNotaryByEmail = await User.find({"email": multiSignerListEmail[i],"role":"notary"});
            if(FindNotaryByEmail.length > 0){
              res.status(400).json({
                error: multiSignerListEmail[i]+' email is registered as notary with bluenotary. Please use a new email id.'
              });
            }
          }
        }
    //console.log(data, data.sessionOpenCallForTaking)
    const finalResponse = { success: true, multiSignerUserDocs: null, openCallSent: null }
    if (data.notorizationTiming) {
      session.notorizationTiming = data.notorizationTiming;
      if (data.meetingdate) {
        session.meetingdate = data.meetingdate
        if (data.meetingTimeZone && session.notorizationTiming === 'notarize_later') {
          session.meetingTimeZone = data.meetingTimeZone
          let currentTimeZoneOffset = parseFloat(String((new Date()).getTimezoneOffset() / 60))
          if (data.currentTimeZone) {
            currentTimeZoneOffset = parseFloat(String(data.currentTimeZone))
          }
          const currentMeetingTimeZone = parseFloat(data.meetingTimeZone)
          const finalOffset = (currentMeetingTimeZone - currentTimeZoneOffset) * 60
          session.meetingdatetimeobj = moment(data.meetingdate, 'YYYY-MM-DD hh:mm A').utcOffset(finalOffset, true)
        } else {
          session.meetingdate = moment().utcOffset('-06:00').format('YYYY-MM-DD hh:mm A')
          const currentMeetingTimeZone = parseFloat('-6')
          let currentTimeZoneOffset = parseFloat(String((new Date()).getTimezoneOffset() / 60))
          if (data.currentTimeZone) {
            currentTimeZoneOffset = parseFloat(String(data.currentTimeZone))
          }
          const finalOffset = (currentMeetingTimeZone - currentTimeZoneOffset) * 60
          session.meetingdatetimeobj = moment(session.meetingdate, 'YYYY-MM-DD hh:mm A').utcOffset(finalOffset, true)
        }
      }
    } else {
      if (data.meetingdate && data.meetingTimeZone && data.currentTimeZone) {
        session.meetingdate = data.meetingdate
        session.meetingTimeZone = data.meetingTimeZone
        let currentTimeZoneOffset = parseFloat(String((new Date()).getTimezoneOffset() / 60))
        if (data.currentTimeZone) {
          currentTimeZoneOffset = parseFloat(String(data.currentTimeZone))
        }
        const currentMeetingTimeZone = parseFloat(data.meetingTimeZone)
        const finalOffset = (currentMeetingTimeZone - currentTimeZoneOffset) * 60
        session.meetingdatetimeobj = moment(data.meetingdate, 'YYYY-MM-DD hh:mm A').utcOffset(finalOffset, true)
        if (data.sessionRescheduled) {
          const sessionUserId = session.userId;
          const sessionNotaryId = session.notaryUserId;
          const allUserIds = []
          if (sessionUserId) {
            allUserIds.push(sessionUserId)
          }
          if (sessionNotaryId) {
            allUserIds.push(sessionNotaryId)
          }
          const userDocs = await User.find({
            _id: {$in: allUserIds}, deleted: {$ne: true}
          })
          const shortSessionID = (session._id).toString().substr((session._id).toString().length - 5).toUpperCase();
          _.map(userDocs, (userDoc) => {
            emailer.sendSessionRescheduledEmail(userDoc, session.meetingdate, session.meetingTimeZone,
              shortSessionID, session._id)
          })
        }
      }
    }
    if (data.sessionOpenCallForTaking) {
      if (!session.notaryUserId && !session.sessionOpenCallForTaking) {
        const identityModelData = await IdentityModel.findOne({
          sessionid: req.params.id
        })
        session.sessionOpenCallForTaking = true
        session.sessionOpenCallForTakingAt = new Date();
        if (session.notorizationTiming === 'notarize_now') {
          // session.meetingdatetimeobj = new Date();
          // session.meetingdate = moment().format('YYYY-MM-DD hh:mm A')
          session.meetingdate = moment().utcOffset('-06:00').format('YYYY-MM-DD hh:mm A')
          const currentMeetingTimeZone = parseFloat('-6')
          let currentTimeZoneOffset = parseFloat(String((new Date()).getTimezoneOffset() / 60))
          if (data.currentTimeZone) {
            currentTimeZoneOffset = parseFloat(String(data.currentTimeZone))
          }
          const finalOffset = (currentMeetingTimeZone - currentTimeZoneOffset) * 60
          session.meetingdatetimeobj = moment(session.meetingdate, 'YYYY-MM-DD hh:mm A').utcOffset(finalOffset, true)
        }
        const shortSessionID = (req.params.id).toString().substr((req.params.id).toString().length - 5).toUpperCase();
        if (session?.sessionType === 'loan_signing') {
          await emailer.sendEmailToAllNotariesForLoanSigning(shortSessionID, session, identityModelData);
        } else {
          await emailer.sendEmailToAllNotaries(shortSessionID, session, identityModelData);
        }
        const sessionUserLogsData = new SessionUserLogs({
          sessionid: new mongoose.Types.ObjectId(req.params.id),
          userId: new mongoose.Types.ObjectId(user._id),
          actionType: 'open_call_sent',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        sessionUserLogsData.save();
        finalResponse.openCallSent = true
      }
    }
    if (data.paymentInfoCaptured) {
      let vendorDoc = {}
      if (session.vendor) {
        vendorDoc = await Vendors.findOne({
          _id: session.vendor
        })
      }
      let notaryUserDoc = {}
      if (session.notaryUserId) {
        notaryUserDoc = await User.findOne({
          _id: session.notaryUserId, deleted: {$ne: true}
        })
      }
      if (session.multiSignerList) {
        await Promise.all(_.map(session.multiSignerList, async (signerDoc) => {
          if (signerDoc.emailSent) {
            return
          }
          console.log(signerDoc)
          const email = signerDoc.email;
          let userDoc = await User.findOne({
            email,
            role: 'customer',
            deleted: {$ne: true}
          })
          if (!userDoc) {
            userDoc = new User({
              name: 'Additional Signer',
              first_name: 'Additional',
              last_name: 'Signer',
              email,
              password: utils.generateRandomPassword(6),
              verification: uuid.v4(),
              role: 'customer',
              state: '',
              verified: true,
              testingacc: req.user.testingacc || false
            });
            await userDoc.save();
          }
          console.log('userDoc', userDoc)
          emailer.sendEmailToAdditionalSignerWhenInvitedToSession(userDoc, userDoc.password,
            getTimeOfSessionFormatted(session), req.params.id, vendorDoc, notaryUserDoc, session);
          signerDoc.emailSent = true
        }))
      }
      session.currentStage = 'meet_notary_stage'
      if (user.invitedViaSessionLink) {
        user.invitedViaSessionLink = false
        await user.save()
      }
    }
    if (data.sessionOpenCallForTaking) {
      session.maxWitnessJoined = data.maxWitnessJoined
    }
    if (data.multiSignerList) {
      const oldSignerEmails = _.map(session.multiSignerList, 'email')
      session.multiSignerList = data.multiSignerList
      if (data.sendNewSignersEmail) {
        const newSignerEmails = _.map(data.multiSignerList || [], 'email')
        const newlyAddedSigners = _.difference(newSignerEmails, oldSignerEmails)
        let vendorDoc = {}
        if (session.vendor) {
          vendorDoc = await Vendors.findOne({
            _id: session.vendor
          })
        }
        let notaryUserDoc = {}
        if (session.notaryUserId) {
          notaryUserDoc = await User.findOne({
            _id: session.notaryUserId, deleted: {$ne: true}
          })
        }
        await Promise.all(_.map(session.multiSignerList, async (signerDoc) => {
          if (!newlyAddedSigners.includes(signerDoc.email)) {
            return
          }
          if (signerDoc.emailSent) {
            return
          }
          console.log(signerDoc)
          const email = signerDoc.email;
          let userDoc = await User.findOne({
            email,
            role: 'customer',
            deleted: {$ne: true}
          })
          if (!userDoc) {
            userDoc = new User({
              name: 'Additional Signer',
              first_name: 'Additional',
              last_name: 'Signer',
              email,
              password: utils.generateRandomPassword(6),
              verification: uuid.v4(),
              role: 'customer',
              state: '',
              verified: true,
              testingacc: req.user.testingacc || false
            });
            await userDoc.save();
          }
          console.log('userDoc', userDoc)
          emailer.sendEmailToAdditionalSignerWhenInvitedToSession(userDoc, userDoc.password,
            getTimeOfSessionFormatted(session), req.params.id, vendorDoc, notaryUserDoc, session);
          signerDoc.emailSent = true
        }))
        const multiSignerListEmail = _.map(session.multiSignerList || [], 'email')
        if (multiSignerListEmail.length) {
          const multiSignerUserDocs = await User.find({
            email: {$in: multiSignerListEmail}, deleted: {$ne: true}
          })
          const multiSignerIdentitiesModel = await IdentityModel.find({
            sessionid: session._id,
            userId: {$in: _.map(multiSignerUserDocs, '_id')}
          })
          const multiginerIdentitesKeyed = _.keyBy(multiSignerIdentitiesModel, 'userId')
          finalResponse.multiSignerUserDocs = _.map(multiSignerUserDocs, (tempUserDoc) => {
            let currentStage = 'KBA and Photo ID Check Not Completed'
            tempUserDoc = JSON.parse(JSON.stringify(tempUserDoc))
            if (tempUserDoc._id && multiginerIdentitesKeyed[tempUserDoc._id]) {
              tempUserDoc.identityData = multiginerIdentitesKeyed[tempUserDoc._id]
              if (tempUserDoc.identityData.additionalSignerNextStage === 'meet_notary') {
                currentStage = 'KBA and Photo ID Check Successful'
              } else if (tempUserDoc.identityData.additionalSignerNextStage === 'photoid_check_stage') {
                currentStage = 'KBA Successful. Photo ID Check Not Completed'
              }
            }
            tempUserDoc.currentStage = currentStage
            return tempUserDoc
          })
        } else {
          finalResponse.multiSignerUserDocs = []
        }
      }
    }
    if (data.notaryUserId) {
      session.notaryUserId = data.notaryUserId
    }
    if (data.markAsOpenCall) {
      session.notaryUserId = null;
    }
    if (data.typeOfKBA) {
      session.typeOfKBA = data.typeOfKBA
    }
    if (data.loanSigningExtraFields) {
      session.loanSigningExtraFields = data.loanSigningExtraFields
    }
    if (data.loanSessionType) {
      session.loanSessionType = data.loanSessionType
    }
    if (data.otherLoanSessionType) {
      session.otherLoanSessionType = data.otherLoanSessionType
    }
    if (data.loanNumber) {
      session.loanNumber = data.loanNumber
    }
    if (data.pointOfContacts) {
      let pointOfContacts = data.pointOfContacts;
      if (pointOfContacts) {
        try {
          pointOfContacts = JSON.parse(pointOfContacts)
        } catch (error) {
          console.log(error)
        }
      }
      session.pointOfContacts = pointOfContacts
    }
    if (data.requestForStateSpecificNotary) {
      session.requestForStateSpecificNotary = data.requestForStateSpecificNotary
      session.requestForStateSpecificNotaryStateName = data.requestForStateSpecificNotaryStateName
    }
    if (typeof data.requestForSpanishNotary !== 'undefined') {
      if (data.requestForSpanishNotary) {
        session.requestForSpanishNotary = data.requestForSpanishNotary
      } else {
        session.requestForSpanishNotary = false
      }
    }
    await session.save()
    res.status(200).json(finalResponse);
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.pickUpSession = async (req, res) => {
  try {

    const user = req.user

    const data = req.body && req.body.data || false;
    if (!data) {
      return res.status(400).json({errors: {msg: 'Data Not Found' }});
    }
    // req = matchedData(req);
    const session = await NewSessionModel.findOne({ _id: req.params.id });
    console.log('sessionold', session)
    if (!session.sessionOpenCallForTaking) {
      return res.status(400).json({errors: {msg: 'Session Already picked by Other Notary'}})
    }
    session.sessionOpenCallForTaking = false;
    // session.sessionOpenCallForTakingAt = null;
    session.sessionPickedCallForTakingAt = new Date();
    session.notaryUserId = req.user.id;
    if (!session.vendor) {
      session.status = 'ready to sign'
    }
    await session.save()
    console.log('sessionnew', session)
    const userDoc = await User.findOne({
      _id: session.userId, deleted: {$ne: true}
    })
    const sessionUserLogsData = new SessionUserLogs({
      sessionid: new mongoose.Types.ObjectId(req.params.id),
      userId: new mongoose.Types.ObjectId(user._id),
      actionType: 'open_call_accepted',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    sessionUserLogsData.save();
    const shortSessionID = (session._id).toString().substr((session._id).toString().length - 5).toUpperCase();
    emailer.sendEmailToCustomerRegardingSessionPicked(userDoc, session.meetingdate, session.meetingTimeZone,
      shortSessionID, session._id);
    await VendorService.sendVendorUpdatesIntermediate('open_call_accepted', 'Notary assigned to the Session', user,
      session._id, session)
    res.status(200).json({ success: true });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.savePersonalData = async (req, res) => {
  try {

    const user = req.user

    req = matchedData(req);
    console.log('uploadFile:', req)
    const data = req.data

    if (user.updateUserNameOnFirstSession || user.name.includes('Signer') || user.name.includes('Customer')) {
      const userDoc = await User.findOne({
        _id: user._id, deleted: {$ne: true}
      })
      if (userDoc) {
        userDoc.first_name = data.firstName
        userDoc.last_name = data.lastName
        userDoc.name = data.firstName + ' ' + data.lastName
        userDoc.updateUserNameOnFirstSession = false
        await userDoc.save()
      }
    }

    const isExisting = await IdentityModel.exists({ sessionid: req.sessionId, userId: user._id })
    if (!isExisting) {
      let additionalSigner = false;
      if (req.additionalSigner) {
        additionalSigner = true
      }
      const newProxy = new IdentityModel({
        sessionid: req.sessionId,
        firstName: data.firstName,
        middelName: data.middelName,
        lastName: data.lastName,
        userSsn: data.userSsn,
        userZipCode: data.userZipCode,
        userState: data.userState,
        userCountry: data.userCountry,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        userId: user._id,
        email: user.email,
        additionalSigner
      })
      await newProxy.save()
      res.status(200).json({ message: 'Your information saved successfully for this session.' });
    } else {
      const newProxy = await IdentityModel.findOne({ sessionid: req.sessionId, userId: user._id })
      newProxy.firstName = data.firstName
      newProxy.middelName = data.middelName
      newProxy.lastName = data.lastName
      newProxy.userSsn = data.userSsn
      newProxy.userZipCode = data.userZipCode
      newProxy.userState = data.userState
      newProxy.userCountry = data.userCountry
      newProxy.addressLine1 = data.addressLine1
      newProxy.addressLine2 = data.addressLine2
      newProxy.birthdate = data.birthdate
      newProxy.userId = user._id
      newProxy.email = user.email
      await newProxy.save();
      res.status(200).json({ message: 'Your information saved successfully for this session.' });
    }

    // update session stage
    const session = await NewSessionModel.findOne({_id: req.sessionId});
    if (session.currentStage === 'identity_check_stage') {
      session.currentStage = 'payment_info_stage';
      session.stagesHistory.push({
        stageName: 'Payment Info stage',
        stageDate: new Date()
      });
      session.save();
    }

    const sessionUserLogsData2 = new SessionUserLogs({
      sessionid: new mongoose.Types.ObjectId(session._id),
      userId: new mongoose.Types.ObjectId(user._id),
      actionType: 'personal_details_filled',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    sessionUserLogsData2.save();

    // update document stage
    const document = await DocumentModel.findOne({sessionid: session._id, deleted: {$ne: true}});
    if (document && document.uploadedStage === 'identity_check_stage') {
    document.uploadedStage = 'payment_info_stage';
    document.save();
  }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.loadPersonalData = async (req, res) => {
  try {
    const user = req.user
    console.log(req.body)
    console.log(req.params)
    const getEvsResult = req.body.getEvsResult || false;
    req = matchedData(req);
    let sessions = await IdentityModel.findOne({ sessionid: req.sessionId, userId: user._id });
    sessions = JSON.parse(JSON.stringify(sessions || {}))
    // update session stage
    console.log(sessions)
    const session = await NewSessionModel.findOne({_id: req.sessionId});
    if (session?.failedByRefresh) {
      sessions.failedByRefresh = true
      session.failedByRefresh = false
      await session.save()
    }
    if (session?.currentStage === 'initial_stage') {
      session.currentStage = 'identity_check_stage';
      session.stagesHistory.push({
        stageName: 'Identity check stage',
        stageDate: new Date()
      });
      session.save();
    }

    sessions.sessionDoc = session

    let vendorDoc
    if (session.vendor) {
      vendorDoc = await Vendors.findOne({_id: session.vendor})
    }
    sessions.vendorDoc = vendorDoc

    // update document stage
    const document = await DocumentModel.findOne({sessionid: session._id, deleted: {$ne: true}});
    if (document && document.uploadedStage === 'initial_stage') {
      document.uploadedStage = 'identity_check_stage';
      document.save();
    }
    // if (sessions.backPhotoIdKey) {
    //   const url = s3.getSignedUrl('getObject', {
    //       Bucket: process.env.AWSBucket,
    //       Key: sessions.backPhotoIdKey,
    //       Expires: 60 * 60 * 24 * 6
    //   });
    //   sessions.backPhotoIdUrl = url
    // }
    console.log('getEvsResult', getEvsResult)
    if (getEvsResult) {
      let cardAPIResponseDoc = {
        platformresponse: {
          response: {}
        }
      }
      if (sessions.cardAPIResponseDoc) {
        cardAPIResponseDoc = JSON.parse(JSON.stringify(sessions.cardAPIResponseDoc))
      }
      const responseDoc = cardAPIResponseDoc && cardAPIResponseDoc.platformresponse &&
      cardAPIResponseDoc.platformresponse.response && cardAPIResponseDoc.platformresponse.response[0] || false
      if (responseDoc) {
        // const verificationConfidence = cardAPIResponseDoc?.platformresponse?.response?.[0]?.questions?.[0]?.question;
        const verificationConfidence = cardAPIResponseDoc?.platformresponse?.response?.[0]?.
        cardresult?.[0]?.faceverificationconfidence?.[0]
        const finalResponse = {
          allDetail: null,
          workflowOutcome: responseDoc && responseDoc.workflowoutcome && responseDoc.workflowoutcome[0]
          && responseDoc.workflowoutcome[0]._ ? responseDoc.workflowoutcome[0]._ : '',
          documentValidationResult: responseDoc && responseDoc.cardresult && responseDoc.cardresult[0]
            && responseDoc.cardresult[0].validationresult && responseDoc.cardresult[0].validationresult[0] &&
            responseDoc.cardresult[0].validationresult[0]._ || '',
          documentExpirationResult: responseDoc && responseDoc.cardresult && responseDoc.cardresult[0]
          && responseDoc.cardresult[0].validationresult && responseDoc.cardresult[0].validationresult[0] &&
          responseDoc.cardresult[0].validationresult[0]._ || '',
          frontPhotoUrl: sessions.frontPhotoIdUrl || false,
          backPhotoUrl: sessions.backPhotoIdUrl || false,
          verificationConfidence
        }
        sessions.evsRes = finalResponse
        if (finalResponse.workflowOutcome === 'Fail') {
          const sessionUserLogsData = new SessionUserLogs({
            sessionid: new mongoose.Types.ObjectId(session._id),
            userId: new mongoose.Types.ObjectId(user._id),
            actionType: 'photo_id_failed',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          sessionUserLogsData.save();
          await VendorService.sendVendorUpdatesIntermediate('photo_id_failed',
          'Customer has failed the Photoid Stage', user, session._id, session)
        } else {
          const sessionUserLogsData2 = new SessionUserLogs({
            sessionid: new mongoose.Types.ObjectId(session._id),
            userId: new mongoose.Types.ObjectId(user._id),
            actionType: 'photo_id_passed',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await VendorService.sendVendorUpdatesIntermediate('photo_id_passed',
          'Customer has failed the Photoid Stage', user, session._id, session)
          sessionUserLogsData2.save();
          if (session.typeOfKBA === 'foreigners_without_residential') {
            const sessionUserLogsData3 = new SessionUserLogs({
              sessionid: new mongoose.Types.ObjectId(session._id),
              userId: new mongoose.Types.ObjectId(user._id),
              actionType: 'biometrics_passed',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            sessionUserLogsData3.save();
            await VendorService.sendVendorUpdatesIntermediate('biometrics_passed', 'Customer has passed the Biometrics Stage', user,
              session._id, session)
          }
        }
      }
    }
    // @ts-ignore
    if (sessions?.sessionDoc?.testingAccSession && !sessions.stripeCustomerID) {
      const existingSessionDocWithStripeID = await IdentityModel.find({ userId: user._id,
        stripeCustomerID: {$exists: true} }).sort({_id: -1}).limit(1);
      // @ts-ignore
      if (existingSessionDocWithStripeID?.[0]?.stripeCustomerID) {
        sessions.stripeCustomerID = existingSessionDocWithStripeID?.[0]?.stripeCustomerID
      }
      sessions.exp_month = '4'
      sessions.exp_year = '2024'
      sessions.last4 = '4242'
      sessions.stripeBrand = 'Visa'
    }
    res.status(200).json(sessions);
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.sessiondata = async (req, res) => {
  try {
    const user = req.user
    console.log('user:', user)
    const businessSessions = req.body.businessSessions || false
    const showArchievedSessions = req.body.showArchievedSessions || false
    console.log('businessSessions', businessSessions)
    req = matchedData(req);
    let mySessionsQuery
    if (businessSessions) {
      mySessionsQuery = {
        invitedByCustomer: user._id
      }
    } else {
      mySessionsQuery = {
        $or: [
          {
            userId: user._id
          },
          {
            multiSignerList: {
              $elemMatch: {
                email: user.email
              }
            }
          }
        ]
      }
    }
    console.log(mySessionsQuery)
    if (showArchievedSessions) {
      mySessionsQuery.archievedBy = user._id
    } else {
      mySessionsQuery.archievedBy = {$ne: user._id}
    }
    const sessions = await NewSessionModel.find(mySessionsQuery).sort({createdAt: -1});
    const sessionData = [];
    const allAdditionalSignerEmails = []
    let sessionIdentityDocsKeyed = {}
    const allSessionIds = _.map(sessions, '_id')
    for (const item of sessions) {
      if (item.multiSignerList) {
        _.map(item.multiSignerList, (multiSignerDoc) => {
          if (multiSignerDoc.email) {
            allAdditionalSignerEmails.push(multiSignerDoc.email)
          }
        })
      }
    }
    let additionalSignerEmailUserDocMap = {}
    if (allAdditionalSignerEmails.length) {
      const allAdditionalSignerUserDocs = await User.find({
        email: {$in: allAdditionalSignerEmails}, deleted: {$ne: true}
      })
      additionalSignerEmailUserDocMap = _.keyBy(allAdditionalSignerUserDocs, 'email')
    }
    const sessionIdentityDocs = await IdentityModel.find({
      sessionid: {$in: allSessionIds}
    })
    sessionIdentityDocsKeyed = _.groupBy(sessionIdentityDocs, 'sessionid')
    for (const item of sessions) {
      let finalDocumentId = item.finalDocumentId;
      let videoDataId = item.videoFileDocumentId;
      const followupDocumentId = item.followupDocumentId;
      if (item.paid === false) {
        finalDocumentId = ''
        videoDataId = ''
      }
      let finalDocument;
      // if (item.status === 'complete' && item.finalDocumentId) {
      if (finalDocumentId) {
        finalDocument = await DocumentModel.find({ sessionid: item._id,
          documentCategory: 'final_document_with_dc', deleted: {$ne: true} });
        // finalDocument = await DocumentModel.findOne({ _id: finalDocumentId });
      } else {
        finalDocument = false;
      }
      let videoData;
      if (videoDataId) {
        videoData = await DocumentModel.findOne({ _id: videoDataId });
      } else {
        videoData = false
      }
      let followupDocumentDoc;
      if (followupDocumentId && businessSessions) {
        followupDocumentDoc = await DocumentModel.findOne({ _id: followupDocumentId });
      } else {
        followupDocumentDoc = false
      }
      const documents = await DocumentModel.find({ sessionid: item._id, documentCategory: 'initial_document',
        deleted: {$ne: true} });
      const notary = await User.findOne({_id: item.notaryUserId, deleted: {$ne: true}});
      let signerDocForBusinessSession
      if (businessSessions) {
        signerDocForBusinessSession = await User.findOne({_id: item.userId, deleted: {$ne: true}});
      }
      const allNotaryIdentities = sessionIdentityDocsKeyed[item._id] || []
      const notaries = allNotaryIdentities && allNotaryIdentities[0] || {}
      const additionalSignerIdentyDocs = []
      let currentUserAdditionalSigner = false
      let currentUserAdditionalSignerStage = ''
      _.map(item.multiSignerList, (multiSignerDoc) => {
        if (multiSignerDoc.email === user.email) {
          currentUserAdditionalSigner = true
        }
        const userDoc = additionalSignerEmailUserDocMap[multiSignerDoc.email]
        let identityDocFound = false
        if (userDoc) {
          _.map(allNotaryIdentities, (tempIdentityDoc) => {
            if (String(tempIdentityDoc.userId) === String(userDoc._id)) {
              additionalSignerIdentyDocs.push(tempIdentityDoc)
              identityDocFound = true
              if (multiSignerDoc.email === user.email) {
                currentUserAdditionalSignerStage = tempIdentityDoc.additionalSignerNextStage
              }
            }
          })
        }
        if (!identityDocFound) {
          additionalSignerIdentyDocs.push(multiSignerDoc)
        }
      })
      const sessionJoinedUserLog = await SessionUserLogs.findOne({
        sessionid: item._id,
        actionType : 'join_session'
      })
      let sessionStartedTime = false;
      if (sessionJoinedUserLog) {
        sessionStartedTime = sessionJoinedUserLog.createdAt
      }
      const sessionCompletedUserLog = await SessionUserLogs.findOne({
        sessionid: item._id,
        actionType : 'session_completed'
      });
      let sessionEndTime = false;
      if (sessionCompletedUserLog) {
        sessionEndTime = sessionCompletedUserLog.createdAt;
      }
      sessionData.push({
        current_session_id: item._id,
        sessionId: item.sessionid,
        currentStage: item.currentStage,
        status: item.status,
        files: documents,
        finalDocument,
        notaries,
        paymentData: false,
        videoData,
        followupDocumentDoc,
        meetingdate: (item.meetingdate) ? item.meetingdate : 'N/A',
        meetingTimeZone: item.meetingTimeZone,
        // shotId: (item.sessionid).toString().substr((item.sessionid).toString().length - 5).toUpperCase(),
        session: item,
        notary,
        additionalSignerIdentyDocs,
        currentUserAdditionalSigner,
        currentUserAdditionalSignerStage,
        sessionStartedTime,
        sessionEndTime,
        signerDocForBusinessSession
      })
      // payment data
      // video data
    }
    const apiOutput = {
      sessionData,
      freeSessionsLeft: null,
      totalSessionsDone: null
    }
    console.log('businessSessions', businessSessions)
    if (businessSessions) {
      let totalSessionsDone = 0
      const orQuery = []
      orQuery.push({
        invitedByCustomer: user._id
      })
      orQuery.push({
        userId: user._id
      })
      const allUserNotaryLinked = await UserNotaryRelation.find({
        customerid: user._id,
        relationType: 'invited'
      })
      if (allUserNotaryLinked.length) {
        orQuery.push({
          notaryUserId: user._id
        })
      }
      totalSessionsDone = await NewSessionModel.count({
        $or: orQuery,
        status: 'complete',
        createdAt: {$gte: moment().startOf('month')}
      })
      let freeSessionsLeft = 7
      if (user.memberType === 'business_pro') {
        freeSessionsLeft = 2
      }
      if (user.memberType === 'business_basic') {
        freeSessionsLeft = 0
      }
      if (user.memberType === 'signing_service') {
        freeSessionsLeft = 0
      }
      if (totalSessionsDone) {
        if (totalSessionsDone > freeSessionsLeft) {
          freeSessionsLeft = 0
        } else {
          freeSessionsLeft = freeSessionsLeft - totalSessionsDone
        }
      }
      console.log('totalSessionsDone', totalSessionsDone)
      console.log('freeSessionsLeft', freeSessionsLeft)
      apiOutput.freeSessionsLeft = freeSessionsLeft
      apiOutput.totalSessionsDone = totalSessionsDone
    }
    res.status(200).json(apiOutput);
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.sessiondatawithPagination = async (req, res) => {
  try {
    const user = req.user
    console.log('user:', user)
    const businessSessions = req.body.businessSessions || false
    const showArchievedSessions = req.body.showArchievedSessions || false
    console.log('businessSessions', businessSessions)
    // req = matchedData(req);
    let mySessionsQuery
    if (businessSessions) {
      mySessionsQuery = {
        invitedByCustomer: user._id
      }
    } else {
      mySessionsQuery = {
        $or: [
          {
            userId: user._id
          },
          {
            multiSignerList: {
              $elemMatch: {
                email: user.email
              }
            }
          }
        ]
      }
    }
    console.log(mySessionsQuery)
    if (showArchievedSessions) {
      mySessionsQuery.archievedBy = user._id
    } else {
      mySessionsQuery.archievedBy = {$ne: user._id}
    }
    // tslint:disable-next-line:max-line-length
    const sessions = await NewSessionModel.paginate(mySessionsQuery, { page: req.params.id, limit: 10, sort: { createdAt: -1 } });
    const sessionData = [];
    const allAdditionalSignerEmails = []
    let sessionIdentityDocsKeyed = {}
    const allSessionIds = _.map(sessions.docs, '_id')
    for (const item of sessions.docs) {
      if (item.multiSignerList) {
        _.map(item.multiSignerList, (multiSignerDoc) => {
          if (multiSignerDoc.email) {
            allAdditionalSignerEmails.push(multiSignerDoc.email)
          }
        })
      }
    }
    let additionalSignerEmailUserDocMap = {}
    if (allAdditionalSignerEmails.length) {
      const allAdditionalSignerUserDocs = await User.find({
        email: {$in: allAdditionalSignerEmails}, deleted: {$ne: true}
      })
      additionalSignerEmailUserDocMap = _.keyBy(allAdditionalSignerUserDocs, 'email')
    }
    const sessionIdentityDocs = await IdentityModel.find({
      sessionid: {$in: allSessionIds}
    })
    sessionIdentityDocsKeyed = _.groupBy(sessionIdentityDocs, 'sessionid')
    for (const item of sessions.docs) {
      let finalDocumentId = item.finalDocumentId;
      let videoDataId = item.videoFileDocumentId;
      const followupDocumentId = item.followupDocumentId;
      if (item.paid === false) {
        finalDocumentId = ''
        videoDataId = ''
      }
      let finalDocument;
      // if (item.status === 'complete' && item.finalDocumentId) {
      if (finalDocumentId) {
        finalDocument = await DocumentModel.find({ sessionid: item._id,
          documentCategory: 'final_document_with_dc', deleted: {$ne: true} });
        // finalDocument = await DocumentModel.findOne({ _id: finalDocumentId });
      } else {
        finalDocument = false;
      }
      let videoData;
      if (videoDataId) {
        videoData = await DocumentModel.findOne({ _id: videoDataId });
      } else {
        videoData = false
      }
      let followupDocumentDoc;
      if (followupDocumentId) {
        followupDocumentDoc = await DocumentModel.findOne({ _id: followupDocumentId });
      } else {
        followupDocumentDoc = false
      }
      const documents = await DocumentModel.find({ sessionid: item._id, documentCategory: 'initial_document',
        deleted: {$ne: true} });
      const notary = await User.findOne({_id: item.notaryUserId, deleted: {$ne: true}});
      let signerDocForBusinessSession
      if (businessSessions) {
        signerDocForBusinessSession = await User.findOne({_id: item.userId, deleted: {$ne: true}});
      }
      const allNotaryIdentities = sessionIdentityDocsKeyed[item._id] || []
      const notaries = allNotaryIdentities && allNotaryIdentities[0] || {}
      const additionalSignerIdentyDocs = []
      let currentUserAdditionalSigner = false
      let currentUserAdditionalSignerStage = ''
      _.map(item.multiSignerList, (multiSignerDoc) => {
        if (multiSignerDoc.email === user.email) {
          currentUserAdditionalSigner = true
        }
        const userDoc = additionalSignerEmailUserDocMap[multiSignerDoc.email]
        let identityDocFound = false
        if (userDoc) {
          _.map(allNotaryIdentities, (tempIdentityDoc) => {
            if (String(tempIdentityDoc.userId) === String(userDoc._id)) {
              additionalSignerIdentyDocs.push(tempIdentityDoc)
              identityDocFound = true
              if (multiSignerDoc.email === user.email) {
                currentUserAdditionalSignerStage = tempIdentityDoc.additionalSignerNextStage
              }
            }
          })
        }
        if (!identityDocFound) {
          additionalSignerIdentyDocs.push(multiSignerDoc)
        }
      })
      const sessionJoinedUserLog = await SessionUserLogs.findOne({
        sessionid: item._id,
        actionType : 'join_session'
      })
      let sessionStartedTime = false;
      if (sessionJoinedUserLog) {
        sessionStartedTime = sessionJoinedUserLog.createdAt
      }
      const sessionCompletedUserLog = await SessionUserLogs.findOne({
        sessionid: item._id,
        actionType : 'session_completed'
      });
      let sessionEndTime = false;
      if (sessionCompletedUserLog) {
        sessionEndTime = sessionCompletedUserLog.createdAt;
      }
      let sessionProgressNumber = 0.1
      let sessionProgressName = 'Initial Stage  '
      let sessionProgressColor = 'blue-5'
      if (item.status === 'complete' || item.paid) {
        sessionProgressNumber = 1
        sessionProgressName = 'Session Completed'
      } else if (item.currentStage === 'meet_notary_stage') {
        sessionProgressNumber = 0.6
        sessionProgressName = 'Identity Passed / Next: Meet Notary'
      } else if (item.currentStage === 'payment_info_stage') {
        sessionProgressNumber = 0.4
        sessionProgressName = 'Identity Passed / Next : Payment Details Capture'
      } else if (item.currentStage === 'identity_check_stage') {
        sessionProgressNumber = 0.2
        sessionProgressName = 'Basic Details Added / Next : Identity Check'
      }
      if (item.status === 'expired') {
        sessionProgressNumber = 1
        sessionProgressName = 'Session Expired'
        sessionProgressColor = 'red-5'
      }
      sessionData.push({
        current_session_id: item._id,
        sessionId: item.sessionid,
        currentStage: item.currentStage,
        status: item.status,
        files: documents,
        finalDocument,
        notaries,
        paymentData: false,
        videoData,
        followupDocumentDoc,
        meetingdate: (item.meetingdate) ? item.meetingdate : 'N/A',
        meetingTimeZone: item.meetingTimeZone,
        // shotId: (item.sessionid).toString().substr((item.sessionid).toString().length - 5).toUpperCase(),
        session: item,
        notary,
        additionalSignerIdentyDocs,
        currentUserAdditionalSigner,
        currentUserAdditionalSignerStage,
        sessionStartedTime,
        sessionEndTime,
        signerDocForBusinessSession,
        sessionProgressNumber,
        sessionProgressName,
        sessionProgressColor
      })
      // payment data
      // video data
    }
    const  paginate = {totalDocs: sessions.totalDocs,
      offset: sessions.offset,
      limit: sessions.limit,
      totalPages: sessions.totalPages,
      page: sessions.page,
      pagingCounter: sessions.pagingCounter,
      hasPrevPage: sessions.hasPrevPage,
      hasNextPage: sessions.hasNextPage,
      prevPage: sessions.prevPage,
      nextPage: sessions.nextPage
    };
    const apiOutput = {
      sessionData,
      paginate,
      freeSessionsLeft: null,
      totalSessionsDone: null
    }
    if (businessSessions && !user.memberType.includes('title')) {
      let totalSessionsDone = 0
      const orQuery = []
      orQuery.push({
        invitedByCustomer: user._id
      })
      orQuery.push({
        userId: user._id
      })
      const allUserNotaryLinked = await UserNotaryRelation.find({
        customerid: user._id,
        relationType: 'invited'
      })
      if (allUserNotaryLinked.length) {
        orQuery.push({
          notaryUserId: user._id
        })
      }
      totalSessionsDone = await NewSessionModel.count({
        $or: orQuery,
        status: 'complete',
        createdAt: {$gte: moment().startOf('month')}
      })
      let freeSessionsLeft = 7
      if (user.memberType === 'business_pro') {
        freeSessionsLeft = 2
      }
      if (user.memberType === 'signing_service') {
        freeSessionsLeft = 0
      }
      if (user.memberType === 'business_basic') {
        freeSessionsLeft = 0
      }
      console.log('freeSessionsLeft overall', freeSessionsLeft)
      if (totalSessionsDone) {
        if (totalSessionsDone > freeSessionsLeft) {
          freeSessionsLeft = 0
        } else {
          freeSessionsLeft = freeSessionsLeft - totalSessionsDone
        }
      }
      console.log('freeSessionsLeft', freeSessionsLeft)
      apiOutput.freeSessionsLeft = freeSessionsLeft
      apiOutput.totalSessionsDone = totalSessionsDone
    }
    res.status(200).json(apiOutput);
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.fullSessionData = async (req, res) => {
  const sessionid = req.params && req.params.id
  if (!sessionid) {
    res.status(400).json({
      error: 'Session id not found'
    })
  }
  const newSessionModelData = await NewSessionModel.findOne({
    _id: sessionid
  })
  if (!newSessionModelData) {
    return res.status(404).json({
      error: 'Session doc not found'
    })
  }
  const responseData = {
    newSessionModelData,
    notaryUser: null,
    originalDocument: null,
    allDocumentDocs: null,
    pdfDroppedElementDatas: null,
    customerUser: null,
    notaryDatasDoc: null,
    statePricingDoc: null,
    multiSignerUserDocs: null,
    businessUserSubsidizedSession: '',
    invitedByCustomerUserDoc: null,
    notaryTeamAdminCustomerUserDoc: null,
    vendorDoc: null,
    failedSession: null,
    correctSessionStage: null
  }
  console.log('newSessionModelData.notaryUserId', newSessionModelData.notaryUserId)
  if (!newSessionModelData.notaryUserId) {
    if (req.user.role === 'notary') {
      newSessionModelData.notaryUserId = req.user.id;
      await newSessionModelData.save()
    }
  }

  let sessionWitnessQuery;
  if (req.user.role === 'witness' && req.user.witnessid) {
    sessionWitnessQuery = {
      $or: [
        {
          sessionid,
          userid: req.user._id
        },
        {
          sessionid,
          witnessid: req.user.witnessid
        }
      ]
    }
  } else {
    sessionWitnessQuery = {
      $or: [
        {
          sessionid,
          userid: req.user._id
        }
      ]
    }
  }
  const userAlreadyWitnessInCurrentSession = await SessionWitness.findOne(sessionWitnessQuery)
  console.log(req.user)
  console.log('newSessionModelData', newSessionModelData)
  let userInAdditionalWitnessList = false;
  _.map(newSessionModelData.multiSignerList || [], (signerDoc) => {
    if (signerDoc.email === req.user.email) {
      userInAdditionalWitnessList = true;
    }
  })
  let userInPOCList = false;
  _.map(newSessionModelData.pointOfContacts || [], (pocDoc) => {
    if (pocDoc.email === req.user.email) {
      userInPOCList = true;
    }
  })
  if (!(String(newSessionModelData.userId) === String(req.user.id) ||
    String(newSessionModelData.notaryUserId) === String(req.user.id) ||
    userAlreadyWitnessInCurrentSession || userInAdditionalWitnessList || userInPOCList)) {
    return res.status(400).json({
      errors: {
        msg: 'You dont have permission to view this session'
      }
    })
  }
  if (userAlreadyWitnessInCurrentSession && String(newSessionModelData.notaryUserId) !== String(req.user.id) &&
  !req.query.witness) {
    return res.status(400).json({
      errors: {
        msg: 'You dont have permission to view this session as non witness'
      }
    })
  }
  if (newSessionModelData.notaryUserId) {
    const notaryUser = await User.findOne({
      _id: newSessionModelData.notaryUserId, deleted: {$ne: true}
    })
    if (notaryUser) {
      responseData.notaryUser = notaryUser
    }
    const notaryDatasDoc = await NotaryDataModel.findOne({
      userId: newSessionModelData.notaryUserId
    })
    if (notaryDatasDoc) {
      responseData.notaryDatasDoc = notaryDatasDoc
    }
  }
  if (newSessionModelData.invitedByCustomer) {
    const invitedByCustomerUserDoc = await User.findOne({
      _id: newSessionModelData.invitedByCustomer, deleted: {$ne: true}
    })
    if (invitedByCustomerUserDoc) {
      responseData.invitedByCustomerUserDoc = invitedByCustomerUserDoc
    }
  }
  if (responseData.notaryUser && responseData.notaryUser.notaryInvitedByBusinessUserId) {
    const notaryTeamAdminCustomerUserDoc = await User.findOne({
      _id: responseData.notaryUser.notaryInvitedByBusinessUserId, deleted: {$ne: true}
    })
    if (notaryTeamAdminCustomerUserDoc) {
      responseData.notaryTeamAdminCustomerUserDoc = notaryTeamAdminCustomerUserDoc
    }
  }
  if (newSessionModelData.userId) {
    let customerUser = await User.findOne({
      _id: newSessionModelData.userId, deleted: {$ne: true}
    })
    if (customerUser) {
      const identityDataResponse = await IdentityModel.findOne({
        userId: customerUser._id,
        sessionid: String(sessionid)
      })
      customerUser = JSON.parse(JSON.stringify(customerUser))
      customerUser.identityData = identityDataResponse
      responseData.customerUser = customerUser
    }
  }
  const originalDocumentId = newSessionModelData.originalDocumentId
  const allDocumentIds = newSessionModelData.originalDocumentIds || []
  if (!_.includes(allDocumentIds, originalDocumentId)) {
    allDocumentIds.push(originalDocumentId)
  }
  const originalDocuments = await DocumentModel.find({
    _id: {$in: allDocumentIds},
    deleted: {$ne: true}
  })
  let originalDocument
  _.map(originalDocuments, (tempOriginalDocument) => {
    if (tempOriginalDocument._id === originalDocumentId) {
      originalDocument = tempOriginalDocument
    }
  })
  if (!originalDocument) {
    originalDocument = (originalDocuments && originalDocuments[0]) || {}
  }
  responseData.originalDocument = originalDocument
  responseData.allDocumentDocs = originalDocuments

  const pdfDroppedElementDataDoc = await PDFDroppedElementsModel.findOne({ sessionid });
  const draftsDoc = await SessionDraftsModel.find({ sessionid }).sort({_id: -1}).limit(1);
  if (pdfDroppedElementDataDoc) {
    if (draftsDoc?.[0] && newSessionModelData.status !== 'complete') {
      responseData.pdfDroppedElementDatas = draftsDoc[0]
    } else {
      responseData.pdfDroppedElementDatas = pdfDroppedElementDataDoc
    }
  } else {
    const draftsDoc2 = await SessionDraftsModel.find({ sessionid }).sort({_id: -1}).limit(1);
    if (draftsDoc2 && draftsDoc2[0]) {
      responseData.pdfDroppedElementDatas = draftsDoc2[0]
    }
  }

  const notaryUserDoc = await User.findOne({
    _id: newSessionModelData.notaryUserId, deleted: {$ne: true}
  })
  let stateToUse = 'Others'
  if (notaryUserDoc && notaryUserDoc.state) {
    stateToUse = notaryUserDoc.state
  }
  console.log('stateToUse', stateToUse)
  let pricingDoc = PricingJson.pricing[stateToUse]
  if (!pricingDoc) {
    pricingDoc = PricingJson.pricing.Others
  }
  responseData.statePricingDoc = pricingDoc
  const sessionUserLogsData = await SessionUserLogs.find({
    sessionid: new mongoose.Types.ObjectId(sessionid)
  })
  const authenticationDoneUsers = _.compact(_.map(sessionUserLogsData, (tempSessionUserLog) => {
    if (tempSessionUserLog.actionType === 'photo_id_passed') {
      return String(tempSessionUserLog.userId)
    }
    return false
  }))
  if (newSessionModelData.performInSessionKBA && responseData?.customerUser?.identityData?.additionalSignerNextStage &&
    responseData?.customerUser?.identityData?.additionalSignerNextStage !== 'meet_notary') {
    if (_.includes(authenticationDoneUsers, String(responseData?.customerUser?._id))) {
      responseData.customerUser.identityData.additionalSignerNextStage = 'meet_notary'
    }
  }
  const multiSignerListEmail = _.map(newSessionModelData.multiSignerList || [], 'email')
  if (multiSignerListEmail.length) {
    const multiSignerUserDocs = await User.find({
      email: {$in: multiSignerListEmail}, deleted: {$ne: true}
    })
    const multiSignerIdentitiesModel = await IdentityModel.find({
      sessionid,
      userId: {$in: _.map(multiSignerUserDocs, '_id')}
    })
    const multiginerIdentitesKeyed = _.keyBy(multiSignerIdentitiesModel, 'userId')
    responseData.multiSignerUserDocs = _.map(multiSignerUserDocs, (tempUserDoc) => {
      let currentStage = 'KBA and Photo ID Check Not Completed'
      tempUserDoc = JSON.parse(JSON.stringify(tempUserDoc))
      if (tempUserDoc._id && multiginerIdentitesKeyed[tempUserDoc._id]) {
        tempUserDoc.identityData = multiginerIdentitesKeyed[tempUserDoc._id]
        if (tempUserDoc.identityData.additionalSignerNextStage !== 'meet_notary') {
          if (_.includes(authenticationDoneUsers, String(tempUserDoc._id))) {
            tempUserDoc.identityData.additionalSignerNextStage = 'meet_notary'
          }
        }
        if (tempUserDoc.identityData.additionalSignerNextStage === 'meet_notary') {
          currentStage = 'KBA and Photo ID Check Successful'
        } else if (tempUserDoc.identityData.additionalSignerNextStage === 'photoid_check_stage') {
          currentStage = 'KBA Successful. Photo ID Check Not Completed'
        }
      }
      tempUserDoc.currentStage = currentStage
      return tempUserDoc
    })
  }
  if (newSessionModelData.vendor) {
    responseData.vendorDoc = await Vendors.findOne({
      _id: newSessionModelData.vendor
    })
  }
  responseData.businessUserSubsidizedSession = await getBusinessUserSubsidizedSession(newSessionModelData,
    responseData.customerUser, responseData.invitedByCustomerUserDoc, responseData.vendorDoc)
  res.status(200).json(responseData);
};

exports.getConsumerPlusApiResponse = async (req, res) => {
  const user = req.user
  const sessionid = req.params && req.params.id;
  if (!sessionid) {
    res.status(400).json({
      error: 'Session id not found'
    })
  }
  const demo = req.query.demo ? true : false;
  const calledFromBusinessPage = req.query.calledFromBusinessPage ? true : false;
  const calledFromSessionPage = req.query.calledFromSessionPage ? true : false;
  console.log('demo: ',  demo, req.query.demo);
  console.log('calledFromBusinessPage', calledFromBusinessPage)
  console.log('calledFromSessionPage', calledFromSessionPage)
  const finalResponseData = {
    customerUser: null,
    identityDataResponse: null
  }
  const newSessionModelData = await NewSessionModel.findOne({
    _id: sessionid
  })
  if (newSessionModelData.meetingdatetimeobj) {
    console.log(moment(), newSessionModelData.meetingdatetimeobj, moment(newSessionModelData.meetingdatetimeobj),
    moment(newSessionModelData.meetingdatetimeobj).add(parseFloat(newSessionModelData.meetingTimeZone) * 60, 'minutes'),
    newSessionModelData.meetingTimeZone)
    const dateDifferenceInHours = moment().diff(moment(newSessionModelData.meetingdatetimeobj)
    .add(parseFloat(newSessionModelData.meetingTimeZone) * 60, 'minutes'), 'hours');
    console.log('dateDifferenceInHours', dateDifferenceInHours, newSessionModelData.meetingTimeZone)
    // if (!(dateDifferenceInHours >= -15 && dateDifferenceInHours <= 15)) {
    //   return res.status(200).json({
    //     test: [],
    //     output: 'Identity Check Outside Time',
    //     details: {}
    //   })
    // }
  }
  let identityDataResponse = {
    firstName: null,
    lastName: null,
    consumerPlusAPIResponseDoc: null,
    addressLine1: null,
    userZipCode: null,
    userSsn: null,
    birthdate: null
  };
  if (newSessionModelData.userId) {
    const customerUser = await User.findOne({
      _id: newSessionModelData.userId, deleted: {$ne: true}
    })
    if (customerUser) {
      finalResponseData.customerUser = customerUser
    }
    identityDataResponse = await IdentityModel.findOne({
      userId: user._id,
      sessionid: String(sessionid)
    })
    if (identityDataResponse) {
      finalResponseData.identityDataResponse = identityDataResponse;
    } // end check id data response
  }
  const builder = new XMLBuilder();
  if (!(identityDataResponse && identityDataResponse.firstName)) {
    return res.status(400).json({
      error: 'Identities Data Not Found'
    })
  }
  let userIdToUse = new mongoose.Types.ObjectId(newSessionModelData.userId)
  if (calledFromBusinessPage || calledFromSessionPage) {
    userIdToUse = user._id
  }
  const sessionUserLogsData = new SessionUserLogs({
    sessionid: new mongoose.Types.ObjectId(sessionid),
    userId: userIdToUse,
    actionType: 'kba_started',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  sessionUserLogsData.save();
  newSessionModelData.kbaStartedAt = new Date()
  newSessionModelData.save()
  await VendorService.sendVendorUpdatesIntermediate('kba_started', 'KBA Started by user', user,
    newSessionModelData._id, newSessionModelData)
  const jsObjectToSend = {
    PlatformRequest: {
      Credentials: {
        Username: 'E27368-65DCF76C-B477-4167-83F4-2E63D0690D4C',
        Password: 'nN0Q44tYmykA5ib'
      },
      CustomerReference: 'E27368-65DCF76C-B477-4167-83F4-2E63D0690D4C',
      Identity: {
        FirstName: identityDataResponse.firstName,
        LastName: identityDataResponse.lastName,
        DateOfBirth: moment(identityDataResponse.birthdate, 'YYYY/MM/DD').format('YYYY-MM-DD'),
        // Street: '13584 ST RD 62',
        // ZipCode: '47537',
        // Ssn: '222222222',
        // Ssn: demo ? '444444444' : identityDataResponse.userSsn,
        // Ssn: demo ? '333333333' : identityDataResponse.userSsn,
        Ssn: demo ? '222222222' : identityDataResponse.userSsn,
        Street: identityDataResponse.addressLine1, // TODO : Uncomment when testing is done
        ZipCode: identityDataResponse.userZipCode // TODO : Uncomment when testing is done
        // Ssn: identityDataResponse.userSsn, // TODO : Uncomment when testing is done
      }
    }
  }
  console.log('jsObjectToSend', jsObjectToSend);
  // If we have already fetched the consumer+ api, we will return that reponse from db only
  if (identityDataResponse.consumerPlusAPIResponseDoc) {
    const jObj = identityDataResponse.consumerPlusAPIResponseDoc;
    const tempResponse = jObj.PlatformResponse && jObj.PlatformResponse.Response || {};
    if (tempResponse && tempResponse.Questions && tempResponse.Questions.Question &&
        tempResponse.Questions.Question.length < 10) {
      const newQuestionsNeeded = 10 - tempResponse.Questions.Question.length;
      console.log('newQuestionsNeeded', newQuestionsNeeded)
      for (let i = 0; i < newQuestionsNeeded; i += 1) {
        tempResponse.Questions.Question.push(tempResponse.Questions.Question[i])
      }
    }
    const finalOutput = {
      test: tempResponse,
      output: tempResponse.WorkflowOutcome && tempResponse.WorkflowOutcome.text || 'Fail',
      details: tempResponse.StandardizedAddress || {}
    }
    res.status(200).json(finalOutput)
  } else {
    if (newSessionModelData.testingAccSession) {
      const jObj = {
        '?xml' : {
            '@_version' : '1.0',
            '@_encoding' : 'utf-8',
            '@_standalone' : 'yes'
        },
        'PlatformResponse' : {
            TransactionDetails : {
                TransactionId : 66948892,
                TransactionDate : '2022-08-04T19:55:01.46',
                Product : {
                    '@_name' : 'IdentiFraud Consumer+',
                    '@_version' : '2.2.0'
                },
                CustomerReference : 'E27368-65DCF76C-B477-4167-83F4-2E63D0690D4C',
                DataProviderDuration : 0.097,
                TotalDuration : 0.590954,
                Errors : '',
                Warnings : {
                    Warning : {
                        '@_message' : 'Date of Birth is not a valid date'
                    }
                }
            },
            Response : {
                WorkflowOutcome : {
                    'text' : 'Pass',
                    '@_code' : 'P'
                },
                PrimaryResult : {
                    '@_code' : '00'
                },
                CheckpointScore : '',
                AuthenticationScore : '',
                ValidationScore : '',
                VerificationScore : '',
                NameFlipIndicator : {
                    '@_code' : ''
                },
                AddressVerificationResult : {
                    'text' : 'Exact match on first and last name; Exact match on address',
                    '@_code' : 'A1'
                },
                AddressUnitMismatchResult : {
                    '@_code' : ''
                },
                AddressTypeResult : {
                    'text' : 'Submitted address is residential address.',
                    '@_code' : 'S'
                },
                AddressHighRiskResult : {
                    'text' : 'No address high risk information found for submitted address.',
                    '@_code' : 'N'
                },
                PhoneVerificationResult : {
                    'text' : 'Phone number was not entered on search request.',
                    '@_code' : 'M'
                },
                PhoneUnitMismatchResult : {
                    '@_code' : ''
                },
                PhoneHighRiskResult : {
                    'text' : 'No phone high risk information found.',
                    '@_code' : 'N'
                },
                ChangeOfAddressResult : {
                    'text' : 'No change of address information was found.',
                    '@_code' : 'N'
                },
                DriverLicenseResult : {
                    'text' : 'DL number not submitted.',
                    '@_code' : 'M'
                },
                DriverLicenseFormat : {
                    '@_code' : ''
                },
                SocialSecurityNumberResult : {
                    'text' : 'Match to full name and address using Social Security Number.',
                    '@_code' : 'YA'
                },
                DateOfBirthResult : {
                    'text' : 'DOB not on input.',
                    '@_code' : '6'
                },
                ExclusionCondition : {
                    '@_code' : ''
                },
                EmailVerificationResult : {
                    'text' : 'Match to Name associated with Email in repository',
                    '@_code' : 'T1'
                },
                EmailValidationResult : {
                    'text' : 'Possible valid email address',
                    '@_code' : 'V'
                },
                EmailReasonResult : {
                    'text' : 'No Failure Identified – the email had proper syntax and domain',
                    '@_code' : 'N'
                },
                EmailRepositoryResult : {
                    'text' : 'Email address found in repository',
                    '@_code' : 'Y'
                },
                MinorResult : {
                    'text' : 'The matched consumer is an adult.',
                    '@_code' : 'N'
                },
                ReportedFraudResult : {
                    'text' : 'No fraud has been reported for the matched consumer',
                    '@_code' : 'N'
                },
                StandardizedAddress : {
                    LastName : 'SMITH',
                    FirstName : 'JOHN',
                    MiddleInitial : '',
                    Street : '123 MAIN ST',
                    City : 'LOUISVILLE',
                    State : 'KY',
                    ZipCode : 40299,
                    ZipPlusFour : 4667
                },
                DateOfBirth : '',
                HighRiskPhoneMatches : '',
                HighRiskAddressMatches : '',
                ConsumerIdDetail : {
                    LastName : 'SMITH',
                    FirstName : 'JOHN',
                    MiddleInitial : '',
                    Street : '123 MAIN ST',
                    City : 'LOUISVILLE',
                    State : 'KY',
                    ZipCode : 40299,
                    ZipPlusFour : 4667,
                    AreaCode : '',
                    Phone : '',
                    DateOfBirth : '',
                    DateOfBirthResult : {
                        '@_code' : ''
                    },
                    ReportedDate : {
                        Day : 16,
                        Month : 11,
                        Year : 2012
                    },
                    LastTouchedDate : {
                        Day : 1,
                        Month : 9,
                        Year : 2015
                    }
                },
                SsnFinderDetails : '',
                ResidentialPhoneDetails : '',
                ResidentialAddressDetails : {
                    ResidentialAddressDetail : [
                        {
                            LastName : 'SMITH',
                            FirstName : 'JOHN',
                            MiddleInitial : 'R',
                            AliasName : '',
                            Street : '123 MAIN ST',
                            City : 'LOUISVILLE',
                            State : 'KY',
                            ZipCode : 40299,
                            ZipPlusFour : 4667,
                            AreaCode : 502,
                            Phone : 0,
                            SpouseName : '',
                            LastTouchedDate : {
                                Day : 2,
                                Month : 11,
                                Year : 2015
                            },
                            ReportedDate : '',
                            ResidenceLength : 47
                        },
                        {
                            LastName : 'SMITH',
                            FirstName : 'JOHN',
                            MiddleInitial : '',
                            AliasName : '',
                            Street : '123 MAIN ST',
                            City : 'LOUISVILLE',
                            State : 'KY',
                            ZipCode : 40299,
                            ZipPlusFour : 4667,
                            AreaCode : '',
                            Phone : '',
                            SpouseName : '',
                            LastTouchedDate : {
                                Day : 1,
                                Month : 9,
                                Year : 2015
                            },
                            ReportedDate : '',
                            ResidenceLength : ''
                        }
                    ]
                },
                SsnValidation : {
                    DeceasedResult : {
                        'text' : 'Not deceased - no matching files found on the death master list.',
                        '@_code' : 'N'
                    },
                    FormatResult : {
                        'text' : 'Social Security Number is valid per Social Security Administration files.',
                        '@_code' : 'V'
                    },
                    IssueResult : {
                        'text' : 'Social Security Number has been issued with a beginning and ending date.',
                        '@_code' : 'I'
                    },
                    StateIssued : 'KY',
                    IssueStartRange : 1966,
                    IssueEndRange : 1968
                },
                ChangeOfAddress : '',
                PreviousAddresses : {
                    PreviousAddress : [
                        {
                            Street : '123 MAIN ST',
                            City : 'LOUISVILLE',
                            State : 'KY',
                            ZipCode : 40299,
                            ZipPlusFour : 4333,
                            ReportDate : {
                                Day : 10,
                                Month : 12,
                                Year : 2013
                            },
                            UpdateDate : {
                                Day : 2,
                                Month : 6,
                                Year : 2014
                            }
                        },
                        {
                            Street : '456 MAIN ST',
                            City : 'LOUISVILLE',
                            State : 'KY',
                            ZipCode : 40299,
                            ZipPlusFour : 4333,
                            ReportDate : {
                                Day : 11,
                                Month : 5,
                                Year : 2002
                            },
                            UpdateDate : {
                                Day : 6,
                                Month : 11,
                                Year : 2011
                            }
                        }
                    ]
                },
                AdditionalAddresses : {
                    AdditionalAddress : [
                        {
                            Street : '1111 BROADWAY AVE',
                            City : 'LOUISVILLE',
                            State : 'KY',
                            ZipCode : 40202,
                            ZipPlusFour : 1111,
                            ReportDate : {
                                Day : 14,
                                Month : 9,
                                Year : 1994
                            },
                            UpdateDate : {
                                Day : 13,
                                Month : 4,
                                Year : 2004
                            }
                        },
                        {
                            Street : '2222 WEST ST',
                            City : 'LOUISVILLE',
                            State : 'KY',
                            ZipCode : 40202,
                            ZipPlusFour : 1111,
                            ReportDate : {
                                Day : 14,
                                Month : 9,
                                Year : 1994
                            },
                            UpdateDate : {
                                Day : 13,
                                Month : 4,
                                Year : 2004
                            }
                        }
                    ]
                },
                FraudShieldResults : {
                    FraudShield01 : {
                        '@_code' : 'N'
                    },
                    FraudShield02 : {
                        '@_code' : 'N'
                    },
                    FraudShield03 : {
                        '@_code' : 'N'
                    },
                    FraudShield04 : {
                        '@_code' : 'N'
                    },
                    FraudShield05 : {
                        '@_code' : 'N'
                    },
                    FraudShield06 : {
                        '@_code' : 'N'
                    },
                    FraudShield10 : {
                        '@_code' : 'N'
                    },
                    FraudShield11 : {
                        '@_code' : 'N'
                    },
                    FraudShield13 : {
                        '@_code' : 'N'
                    },
                    FraudShield14 : {
                        '@_code' : 'N'
                    },
                    FraudShield15 : {
                        '@_code' : 'N'
                    },
                    FraudShield16 : {
                        '@_code' : 'N'
                    },
                    FraudShield17 : {
                        '@_code' : 'N'
                    },
                    FraudShield18 : {
                        '@_code' : 'N'
                    },
                    FraudShield21 : {
                        '@_code' : 'N'
                    },
                    FraudShield25 : {
                        '@_code' : 'N'
                    },
                    FraudShield26 : {
                        '@_code' : 'N'
                    },
                    FraudShield27 : {
                        '@_code' : ''
                    }
                },
                SharedApplicationResults : {
                    GlbRule01 : {
                        '@_code' : ''
                    },
                    GlbRule02 : {
                        '@_code' : ''
                    },
                    GlbRule03 : {
                        '@_code' : ''
                    },
                    GlbRule04 : {
                        '@_code' : ''
                    },
                    GlbRule05 : {
                        '@_code' : ''
                    },
                    GlbRule06 : {
                        '@_code' : ''
                    },
                    GlbRule07 : {
                        '@_code' : ''
                    },
                    GlbRule08 : {
                        '@_code' : ''
                    },
                    GlbRule09 : {
                        '@_code' : ''
                    },
                    GlbRule10 : {
                        '@_code' : ''
                    },
                    GlbRule11 : {
                        '@_code' : ''
                    },
                    GlbRule12 : {
                        '@_code' : ''
                    },
                    GlbRule13 : {
                        '@_code' : ''
                    },
                    GlbRule14 : {
                        '@_code' : ''
                    },
                    GlbRule15 : {
                        '@_code' : ''
                    },
                    GlbRule16 : {
                        '@_code' : ''
                    },
                    GlbRule17 : {
                        '@_code' : ''
                    },
                    GlbRule18 : {
                        '@_code' : ''
                    },
                    GlbRule19 : {
                        '@_code' : ''
                    },
                    GlbRule20 : {
                        '@_code' : ''
                    }
                },
                InitialResults : {
                    AuthenticationIndex : '',
                    MostLikelyFraudType : {
                        '@_code' : ''
                    },
                    InitialDecision : {
                        '@_code' : ''
                    },
                    FinalDecision : {
                        '@_code' : ''
                    },
                    Reasons : {
                        Reason1 : {
                            '@_code' : ''
                        },
                        Reason2 : {
                            '@_code' : ''
                        },
                        Reason3 : {
                            '@_code' : ''
                        },
                        Reason4 : {
                            '@_code' : ''
                        },
                        Reason5 : {
                            '@_code' : ''
                        }
                    }
                },
                SecondaryResults : {
                    AuthenticationIndex : '',
                    MostLikelyFraudType : {
                        '@_code' : ''
                    },
                    InitialDecision : {
                        '@_code' : ''
                    },
                    FinalDecision : {
                        '@_code' : ''
                    },
                    Reasons : {
                        Reason1 : {
                            '@_code' : ''
                        },
                        Reason2 : {
                            '@_code' : ''
                        },
                        Reason3 : {
                            '@_code' : ''
                        },
                        Reason4 : {
                            '@_code' : ''
                        },
                        Reason5 : {
                            '@_code' : ''
                        }
                    }
                },
                EmailAddressDetails : '',
                IpAddressDetail : {
                    City : 'LOUISVILLE',
                    State : 'KY',
                    ZipCode : 40299,
                    Country : 'USA',
                    Msa : 529,
                    Latitude : 38.17728,
                    Longitude : -85.69685,
                    CityResult : {
                        'text' : 'Match to input',
                        '@_code' : '1'
                    },
                    StateResult : {
                        'text' : 'Match to input',
                        '@_code' : '1'
                    },
                    ZipCodeResult : {
                        'text' : 'Match to input',
                        '@_code' : '1'
                    },
                    CountryResult : {
                        'text' : 'Match US',
                        '@_code' : '1'
                    }
                },
                OfacValidation : {
                    OfacValidationResult : {
                        'text' : 'No match to name or address.',
                        '@_code' : '1'
                    }
                },
                Questions : {
                    Question : [
                        {
                            'Answer' : [
                                {
                                    'text' : '2083 ONE RIVERFRONT PL',
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : '1111 BROADWAY AVE',
                                    '@_correct' : 'true'
                                },
                                {
                                    'text' : '1261 MUHAMMAH',
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : '8831 PLACE BLANC',
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 'None of the above',
                                    '@_correct' : 'false'
                                }
                            ],
                            '@_type' : '1',
                            '@_text' : 'Which one of the following addresses is associated with you?'
                        },
                        {
                            'Answer' : [
                                {
                                    'text' : 440,
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 734,
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 502,
                                    '@_correct' : 'true'
                                },
                                {
                                    'text' : '419/567',
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 'None of the above',
                                    '@_correct' : 'false'
                                }
                            ],
                            '@_type' : '2',
                            '@_text' : 'Which one of the following area codes is associated with you?'
                        },
                        {
                            'Answer' : [
                                {
                                    'text' : 'Jefferson',
                                    '@_correct' : 'true'
                                },
                                {
                                    'text' : 'Lewis',
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 'Marshall',
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 'Kent',
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 'None of the above',
                                    '@_correct' : 'false'
                                }
                            ],
                            '@_type' : '3',
                            '@_text' : 'Which one of the following counties is associated with you?'
                        },
                        {
                            'Answer' : [
                                {
                                    'text' : 40505,
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 40586,
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 40781,
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 40202,
                                    '@_correct' : 'true'
                                },
                                {
                                    'text' : 'None of the above',
                                    '@_correct' : 'false'
                                }
                            ],
                            '@_type' : '4',
                            '@_text' : 'Which one of the following zip codes is associated with you?'
                        },
                        {
                            'Answer' : [
                                {
                                    'text' : 'Kentucky',
                                    '@_correct' : 'true'
                                },
                                {
                                    'text' : 'Texas',
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 'Nevada',
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 'New York',
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 'None of the above',
                                    '@_correct' : 'false'
                                }
                            ],
                            '@_type' : '5',
                            '@_text' : 'What state was your SSN issued in?'
                        },
                        {
                            'Answer' : [
                                {
                                    'text' : 'Danielle',
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 'Oswaldo',
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 'Christina',
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 'Nailea',
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 'None of the above',
                                    '@_correct' : 'true'
                                }
                            ],
                            '@_type' : '6',
                            '@_text' : 'Which one of the following adult individuals is most closely associated with you?'
                        },
                        {
                            'Answer' : [
                                {
                                    'text' : 40781,
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 40180,
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 40299,
                                    '@_correct' : 'true'
                                },
                                {
                                    'text' : 40586,
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 'None of the above',
                                    '@_correct' : 'false'
                                }
                            ],
                            '@_type' : '9',
                            '@_text' : 'What was the zip code for the address on MAIN ST?'
                        },
                        {
                            'Answer' : [
                                {
                                    'text' : 783,
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 189,
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 456,
                                    '@_correct' : 'true'
                                },
                                {
                                    'text' : 590,
                                    '@_correct' : 'false'
                                },
                                {
                                    'text' : 'None of the above',
                                    '@_correct' : 'false'
                                }
                            ],
                            '@_type' : '10',
                            '@_text' : 'What was the house number for the address on MAIN ST?'
                        }
                    ]
                }
            }
        }
      }
      const tempResponse = jObj.PlatformResponse && jObj.PlatformResponse.Response || {}
      console.log('tempResponse', tempResponse)
      const newIdentityDataResponse = await IdentityModel.findOne({
        userId: user._id,
        sessionid: String(sessionid)
      });
      if (newIdentityDataResponse) {
        newIdentityDataResponse.consumerPlusAPIResponseDoc = jObj
        newIdentityDataResponse.save();
      }
      // @ts-ignore
      if (!demo && tempResponse && tempResponse.Questions && tempResponse.Questions.Question) {
        // @ts-ignore
          tempResponse.Questions.Question = _.map(tempResponse.Questions.Question, (questionDoc) => {
            if (questionDoc.Answer) {
              questionDoc.Answer = _.map(questionDoc.Answer, (answerDoc) => {
                delete answerDoc['@_correct']
                return answerDoc
              })
            }
            return questionDoc
          })
        }
        // @ts-ignore
      if (tempResponse && tempResponse.Questions && tempResponse.Questions.Question &&
        // @ts-ignore
          tempResponse.Questions.Question.length < 10) {
            // @ts-ignore
          const newQuestionsNeeded = 10 - tempResponse.Questions.Question.length;
          console.log('newQuestionsNeeded', newQuestionsNeeded)
          for (let i = 0; i < newQuestionsNeeded; i += 1) {
            // @ts-ignore
            tempResponse.Questions.Question.push(tempResponse.Questions.Question[i])
          }
        }
      const finalOutput = {
          test: tempResponse,
          output: 'Pass',
          details: {}
        }
      res.status(200).json(finalOutput)
    } else {
      const newIdentityDataResponse = await IdentityModel.findOne({
        userId: user._id,
        sessionid: String(sessionid)
      });
      const xmlContent = builder.build(jsObjectToSend);
      const finalXMLRequest = '<?xml version="1.0" encoding="utf-8"?>' + xmlContent
      // console.log(xmlContent)
      const evsFillAPIUrl = 'https://identiflo.everification.net/WebServices/Integrated/Main/V220/ConsumerPlus'
      const headers = {'Content-Type': 'application/xml'}
      request.post({url: evsFillAPIUrl, body: finalXMLRequest, headers}, (error, response, body) => {
        console.log('error', error)
        const parser = new XMLParser({
          attributeNamePrefix : '@_',
          ignoreAttributes : false,
          ignoreNameSpace: false,
          textNodeName : 'text'
        });
        const jObj = parser.parse(body);
        const tempResponse = jObj.PlatformResponse && jObj.PlatformResponse.Response || {}
        console.log('tempResponse', tempResponse)
        if (newIdentityDataResponse) {
          newIdentityDataResponse.consumerPlusAPIResponseDoc = JSON.parse(JSON.stringify(jObj))
          newIdentityDataResponse.save();
        }
        if (!demo && tempResponse && tempResponse.Questions && tempResponse.Questions.Question) {
          tempResponse.Questions.Question = _.map(tempResponse.Questions.Question, (questionDoc) => {
            if (questionDoc.Answer) {
              questionDoc.Answer = _.map(questionDoc.Answer, (answerDoc) => {
                delete answerDoc['@_correct']
                return answerDoc
              })
            }
            return questionDoc
          })
        }
        if (tempResponse && tempResponse.Questions && tempResponse.Questions.Question &&
          tempResponse.Questions.Question.length < 10) {
          const newQuestionsNeeded = 10 - tempResponse.Questions.Question.length;
          console.log('newQuestionsNeeded', newQuestionsNeeded)
          for (let i = 0; i < newQuestionsNeeded; i += 1) {
            tempResponse.Questions.Question.push(tempResponse.Questions.Question[i])
          }
        }
        const finalOutput = {
          test: tempResponse,
          output: tempResponse.WorkflowOutcome && tempResponse.WorkflowOutcome.text || 'Fail',
          details: tempResponse.StandardizedAddress || {}
        }
        res.status(200).json(finalOutput)
      });
    }
  }
};

exports.getCustomerDetailsDuringSessionFlow = async (req, res) => {
  const user = req.user
  const sessionid = req.params && req.params.id;
  if (!sessionid) {
    res.status(400).json({
      error: 'Session id not found'
    })
  }
  const demo = req.query.demo ? true : false;
  console.log('demo: ',  demo, req.query.demo);
  const finalResponseData = {
    customerUser: null,
    identityDataResponse: null
  }
  const newSessionModelData = await NewSessionModel.findOne({
    _id: sessionid
  })
  if (newSessionModelData.meetingdatetimeobj) {
    console.log(moment(), newSessionModelData.meetingdatetimeobj, moment(newSessionModelData.meetingdatetimeobj),
    moment(newSessionModelData.meetingdatetimeobj).add(parseFloat(newSessionModelData.meetingTimeZone) * 60, 'minutes'),
    newSessionModelData.meetingTimeZone)
    const dateDifferenceInHours = moment().diff(moment(newSessionModelData.meetingdatetimeobj)
    .add(parseFloat(newSessionModelData.meetingTimeZone) * 60, 'minutes'), 'hours');
    console.log('dateDifferenceInHours', dateDifferenceInHours, newSessionModelData.meetingTimeZone)
    // if (!(dateDifferenceInHours >= -15 && dateDifferenceInHours <= 15)) {
    //   return res.status(200).json({
    //     test: [],
    //     output: 'Identity Check Outside Time',
    //     details: {}
    //   })
    // }
  }
  let identityDataResponse = {
    firstName: null,
    lastName: null,
    fillAPIResponseDoc: null,
    addressLine1: null,
    userZipCode: null,
    userSsn: null,
    birthdate: null,
    cardAPIResponseDoc: null,
    consumerPlusAPIResponseDoc: null,
    typeOfPhotoId: null
  };
  if (newSessionModelData.userId) {
    const customerUser = await User.findOne({
      _id: newSessionModelData.userId, deleted: {$ne: true}
    })
    if (customerUser) {
      finalResponseData.customerUser = customerUser
    }
    identityDataResponse = await IdentityModel.findOne({
      userId: user._id,
      sessionid: String(sessionid)
    })
    if (identityDataResponse) {
      finalResponseData.identityDataResponse = identityDataResponse;
    } // end check id data response
  }
  if (!(identityDataResponse && identityDataResponse.firstName)) {
    return res.status(400).json({
      error: 'Identities Data Not Found'
    })
  }
  newSessionModelData.kbaStartedAt = new Date()
  newSessionModelData.save()
  const sessionUserLogsData = new SessionUserLogs({
    sessionid: new mongoose.Types.ObjectId(sessionid),
    userId: new mongoose.Types.ObjectId(newSessionModelData.userId),
    actionType: 'kba_started',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  sessionUserLogsData.save();
  await VendorService.sendVendorUpdatesIntermediate('kba_started', 'KBA Started by user', user,
    newSessionModelData._id, newSessionModelData)
  // const jsObjectToSend = {
  //   PlatformRequest: {
  //     Credentials: {
  //       Username: 'E27368-65DCF76C-B477-4167-83F4-2E63D0690D4C',
  //       Password: 'nN0Q44tYmykA5ib'
  //     },
  //     CustomerReference: 'E27368-65DCF76C-B477-4167-83F4-2E63D0690D4C',
  //     Identity: {
  //       FirstName: identityDataResponse.firstName,
  //       LastName: identityDataResponse.lastName,
  //       DateOfBirth: moment(identityDataResponse.birthdate, 'YYYY/MM/DD').format('YYYY-MM-DD'),
  //       // Street: '13584 ST RD 62',
  //       // ZipCode: '47537',
  //       // Ssn: '222222222',
  //       // Ssn: demo ? '444444444' : identityDataResponse.userSsn,
  //       // Ssn: demo ? '333333333' : identityDataResponse.userSsn,
  //       Ssn: demo ? '222222222' : identityDataResponse.userSsn,
  //       Street: identityDataResponse.addressLine1, // TODO : Uncomment when testing is done
  //       ZipCode: identityDataResponse.userZipCode // TODO : Uncomment when testing is done
  //       // Ssn: identityDataResponse.userSsn, // TODO : Uncomment when testing is done
  //     }
  //   }
  // }
  // console.log('jsObjectToSend', jsObjectToSend);
  // If we have already fetched the consumer+ api, we will return that reponse from db only
  let finalOutput
  const cardObj = identityDataResponse.cardAPIResponseDoc;
  console.log('cardObj', cardObj)
  let checkCardObject = true;
  if (identityDataResponse.typeOfPhotoId === 'passportbook') {
    checkCardObject = false;
  }
  console.log('checkCardObject', checkCardObject)
  if (cardObj && checkCardObject) {
    const questionDocs = cardObj?.platformresponse?.response?.[0]?.questions?.[0]?.question;
    const finalQuestionDocs = []
    _.map(questionDocs, (tempQuestionDoc) => {
      finalQuestionDocs.push({
        '@_text': tempQuestionDoc?.temp?.text,
        '@_type': tempQuestionDoc?.temp?.type,
        'Answer': _.map(tempQuestionDoc.answer, (tempAnswerDoc) => {
          return {
            'text': tempAnswerDoc._,
            '@_correct': tempAnswerDoc?.temp?.correct
          }
        })
      })
    })
    if (finalQuestionDocs.length < 10) {
      const newQuestionsNeeded = 10 - finalQuestionDocs.length;
      console.log('newQuestionsNeeded', newQuestionsNeeded)
      for (let i = 0; i < newQuestionsNeeded; i += 1) {
        const questionDoc = finalQuestionDocs[i];
        // if (demo && user.testingacc) {
        // // if (demo) {
        //   questionDoc.Answer = _.map(questionDoc.Answer, (answerDoc) => {
        //     delete answerDoc["@_correct"]
        //     return answerDoc
        //   })
        // }
        finalQuestionDocs.push(questionDoc)
      }
    }
    finalOutput = {
      test: {
        Questions: {
          Question: finalQuestionDocs
        }
      },
      output: cardObj?.platformresponse?.response?.[0]?.workflowoutcome?.[0]._ || 'Fail',
      details: {}
    }
  } else {
    const jObj = identityDataResponse.fillAPIResponseDoc;
    if (jObj) {
      const tempResponse = jObj.PlatformResponse && jObj.PlatformResponse.Response || {};
      if (tempResponse && tempResponse.Questions && tempResponse.Questions.Question &&
          tempResponse.Questions.Question.length < 10) {
        const newQuestionsNeeded = 10 - tempResponse.Questions.Question.length;
        console.log('newQuestionsNeeded', newQuestionsNeeded)
        for (let i = 0; i < newQuestionsNeeded; i += 1) {
          const questionDoc = tempResponse.Questions.Question[i];
          // if (demo && user.testingacc) {
          // // if (demo) {
          //   questionDoc.Answer = _.map(questionDoc.Answer, (answerDoc) => {
          //     delete answerDoc["@_correct"]
          //     return answerDoc
          //   })
          // }
          tempResponse.Questions.Question.push(questionDoc)
        }
      }
      finalOutput = {
        test: tempResponse,
        output: tempResponse.WorkflowOutcome && tempResponse.WorkflowOutcome.text || 'Fail',
        details: tempResponse.StandardizedAddress || {}
      }
    } else if (identityDataResponse.consumerPlusAPIResponseDoc) {
      const tempObj = identityDataResponse.consumerPlusAPIResponseDoc
      const tempResponse = tempObj.PlatformResponse && tempObj.PlatformResponse.Response || {};
      if (tempResponse && tempResponse.Questions && tempResponse.Questions.Question &&
          tempResponse.Questions.Question.length < 10) {
        const newQuestionsNeeded = 10 - tempResponse.Questions.Question.length;
        console.log('newQuestionsNeeded', newQuestionsNeeded)
        for (let i = 0; i < newQuestionsNeeded; i += 1) {
          const questionDoc = tempResponse.Questions.Question[i];
          // if (demo && user.testingacc) {
          // // if (demo) {
          //   questionDoc.Answer = _.map(questionDoc.Answer, (answerDoc) => {
          //     delete answerDoc["@_correct"]
          //     return answerDoc
          //   })
          // }
          tempResponse.Questions.Question.push(questionDoc)
        }
      }
      finalOutput = {
        test: tempResponse,
        output: tempResponse.WorkflowOutcome && tempResponse.WorkflowOutcome.text || 'Fail',
        details: tempResponse.StandardizedAddress || {}
      }
    }
  }
  res.status(200).json(finalOutput)
};

exports.getCustomerDetailsAfterChecking = async (req, res) => {
  const user = req.user
  const sessionid = req.params && req.params.id
  const biometrics = req.body && req.body.biometrics
  console.log('sessionid', sessionid)
  if (!sessionid) {
    res.status(400).json({
      error: 'Session id not found'
    })
  }
  const finalResponseData = {
    customerUser: null,
    identityDataResponse: null
  };
  const newSessionModelData = await NewSessionModel.findOne({
    _id: sessionid
  })
  // let typeOfKBA = ""
  // if (newSessionModelData && newSessionModelData.typeOfKBA) {
  //   typeOfKBA = newSessionModelData.typeOfKBA
  // }
  let identityDataResponse = {
    firstName: null,
    lastName: null,
    frontPhotoIdUrl: null,
    backPhotoIdUrl: null,
    fillAPIResponseDoc: null,
    userSsn: null,
    typeOfPhotoId: null,
    cardAPIResponseDoc: null,
    personaAPIResponseDoc: null
  }
  let identityModelQuery
  if (user.role === 'customer') {
    identityModelQuery = {
      sessionid: String(sessionid),
      userId: user._id
    }
  } else {
    identityModelQuery = {
      sessionid: String(sessionid)
    }
  }
  if (newSessionModelData.userId) {
    const customerUser = await User.findOne({
      _id: newSessionModelData.userId, deleted: {$ne: true}
    })
    if (customerUser) {
      finalResponseData.customerUser = customerUser
    }
    identityDataResponse = await IdentityModel.findOne(identityModelQuery)
    if (identityDataResponse) {
      finalResponseData.identityDataResponse = identityDataResponse
    }
  }
  if (!(identityDataResponse && identityDataResponse.firstName)) {
    // return res.status(400).json({
    //   error: 'Identities Data Not Found'
    // })
    return res.status(200).json({
      workflowOutcome: 'Pending',
      reason: 'No Idea'
    })
  }

  console.log(identityDataResponse)

  // let fetchDataFromFillApi = process.env.NODE_ENV !== 'development';
  // if (identityDataResponse.cardAPIResponseDoc) {
  //   fetchDataFromFillApi = false
  // }
  // if (identityDataResponse.personaAPIResponseDoc) {
  //   fetchDataFromFillApi = false
  // }
  // const demo = req.query.demo ? true : false;
  // console.log('demo: ',  demo, req.query.demo);
  // if (demo && demo === true) {
  //   fetchDataFromFillApi = false;
  // }
  // if (fetchDataFromFillApi && newSessionModelData.testingAccSession) {
  //   fetchDataFromFillApi = false
  // }
  const fetchDataFromFillApi = true;
  const typeOfPhotoId = identityDataResponse.typeOfPhotoId || 'drivinglicense'
  console.log('fetchDataFromFillApi', fetchDataFromFillApi)
  console.log('typeOfPhotoId', typeOfPhotoId)
  if (true) {
    const apiResponse = {
      platformresponse : {
          transactiondetails : [
              {
                  transactionid : [
                      '65934582'
                  ],
                  transactiondate : [
                      '2022-06-30T15:54:15.66'
                  ],
                  product : [
                      {
                          temp : {
                              name : 'IdentiFraud Card',
                              version : '2.2.0'
                          }
                      }
                  ],
                  customerreference : [
                      'USER_6224ba9ef5473b2bd5e2681c_448'
                  ],
                  dataproviderduration : [
                      '0'
                  ],
                  totalduration : [
                      '1.257'
                  ],
                  errors : [
                      ''
                  ],
                  warnings : [
                      ''
                  ]
              }
          ],
          response : [
              {
                  workflowoutcome : [
                      {
                          _ : 'Pass',
                          temp : {
                              code : 'F'
                          }
                      }
                  ],
                  cardresult : [
                      {
                          validationresult : [
                              {
                                  _ : 'The document has passed the check.',
                                  temp : {
                                      code : '0'
                                  }
                              }
                          ],
                          imageparsingresult : [
                              {
                                  _ : 'Both sides of the document were successfully parsed.',
                                  temp : {
                                      code : 'B'
                                  }
                              }
                          ],
                          totalconfidence : [
                              '87'
                          ],
                          documentinformation : [
                              {
                                  licensenumber : [
                                      {
                                          _ : '890051357',
                                          temp : {
                                              confidence : '88'
                                          }
                                      }
                                  ],
                                  documenttype : [
                                      'DL'
                                  ],
                                  issuedate : [
                                      '2021-10-01'
                                  ],
                                  expirationdate : [
                                      '2026-09-25'
                                  ],
                                  documentclass : [
                                      'D'
                                  ],
                                  template : [
                                      '03'
                                  ]
                              }
                          ],
                          documentname : [
                              {
                                  fullname : [
                                      {
                                          _ : 'JOENNY DIAZ VIDAL',
                                          temp : {
                                              confidence : '50'
                                          }
                                      }
                                  ],
                                  firstname : [
                                      'JOENNY'
                                  ],
                                  privatename : [
                                      'JOENNY'
                                  ],
                                  middlename : [
                                      'JOENNY'
                                  ],
                                  familyname : [
                                      'DIAZ VIDAL'
                                  ]
                              }
                          ],
                          documentaddress : [
                              {
                                  address : [
                                      {
                                          _ : '3221 108TH ST FL 2',
                                          temp : {
                                              confidence : '82'
                                          }
                                      }
                                  ],
                                  city : [
                                      'EAST ELMHURST'
                                  ],
                                  state : [
                                      'NY'
                                  ],
                                  zipcode : [
                                      '11369-0000'
                                  ],
                                  country : [
                                      'United States of America'
                                  ]
                              }
                          ],
                          individualcharacteristics : [
                              {
                                  dateofbirth : [
                                      {
                                          _ : '1994-09-25',
                                          temp : {
                                              confidence : '100'
                                          }
                                      }
                                  ],
                                  age : [
                                      '27'
                                  ],
                                  gender : [
                                      'FEMALE'
                                  ],
                                  eyecolor : [
                                      'BROWN'
                                  ],
                                  haircolor : [
                                      ''
                                  ],
                                  height : [
                                      '63'
                                  ],
                                  weight : [
                                      ''
                                  ]
                              }
                          ]
                      }
                  ],
                  primaryresult : [
                      {
                          temp : {
                              code : '00'
                          }
                      }
                  ],
                  checkpointscore : [
                      ''
                  ],
                  authenticationscore : [
                      ''
                  ],
                  validationscore : [
                      ''
                  ],
                  verificationscore : [
                      ''
                  ],
                  nameflipindicator : [
                      {
                          temp : {
                              code : ''
                          }
                      }
                  ],
                  addressverificationresult : [
                      {
                          _ : 'No match on name; No match on address',
                          temp : {
                              code : 'X0'
                          }
                      }
                  ],
                  addressunitmismatchresult : [
                      {
                          temp : {
                              code : ''
                          }
                      }
                  ],
                  addresstyperesult : [
                      {
                          _ : 'Submitted address is a residential multi family dwelling.',
                          temp : {
                              code : 'M'
                          }
                      }
                  ],
                  addresshighriskresult : [
                      {
                          _ : 'No address high risk information found for submitted address.',
                          temp : {
                              code : 'N'
                          }
                      }
                  ],
                  phoneverificationresult : [
                      {
                          _ : 'Phone number is missing',
                          temp : {
                              code : 'MX'
                          }
                      }
                  ],
                  phoneunitmismatchresult : [
                      {
                          temp : {
                              code : ''
                          }
                      }
                  ],
                  phonehighriskresult : [
                      {
                          _ : 'No phone high risk information found.',
                          temp : {
                              code : 'N'
                          }
                      }
                  ],
                  changeofaddressresult : [
                      {
                          _ : 'No change of address information was found.',
                          temp : {
                              code : 'N'
                          }
                      }
                  ],
                  driverlicenseresult : [
                      {
                          _ : 'DL number not submitted.',
                          temp : {
                              code : 'M'
                          }
                      }
                  ],
                  driverlicenseformat : [
                      {
                          temp : {
                              code : ''
                          }
                      }
                  ],
                  socialsecuritynumberresult : [
                      {
                          _ : 'Social Security Number does not match name or address.',
                          temp : {
                              code : 'N'
                          }
                      }
                  ],
                  dateofbirthresult : [
                      {
                          _ : 'Consumer not on file – no record.',
                          temp : {
                              code : '5'
                          }
                      }
                  ],
                  exclusioncondition : [
                      {
                          temp : {
                              code : ''
                          }
                      }
                  ],
                  emailverificationresult : [
                      {
                          temp : {
                              code : ''
                          }
                      }
                  ],
                  emailvalidationresult : [
                      {
                          temp : {
                              code : ''
                          }
                      }
                  ],
                  emailreasonresult : [
                      {
                          temp : {
                              code : ''
                          }
                      }
                  ],
                  emailrepositoryresult : [
                      {
                          temp : {
                              code : ''
                          }
                      }
                  ],
                  minorresult : [
                      {
                          _ : 'The matched consumer is an adult.',
                          temp : {
                              code : 'N'
                          }
                      }
                  ],
                  reportedfraudresult : [
                      {
                          _ : 'No fraud has been reported for the matched consumer',
                          temp : {
                              code : 'N'
                          }
                      }
                  ],
                  standardizedaddress : [
                      {
                          lastname : [
                              'DIAZVIDAL'
                          ],
                          firstname : [
                              'JOENNY'
                          ],
                          middleinitial : [
                              'J'
                          ],
                          street : [
                              '3221 108TH ST FL 2'
                          ],
                          city : [
                              'EAST ELMHURST'
                          ],
                          state : [
                              'NY'
                          ],
                          zipcode : [
                              '11369'
                          ],
                          zipplusfour : [
                              '2523'
                          ]
                      }
                  ],
                  dateofbirth : [
                      ''
                  ],
                  highriskphonematches : [
                      ''
                  ],
                  highriskaddressmatches : [
                      ''
                  ],
                  consumeriddetail : [
                      ''
                  ],
                  ssnfinderdetails : [
                      ''
                  ],
                  residentialphonedetails : [
                      ''
                  ],
                  residentialaddressdetails : [
                      ''
                  ],
                  ssnvalidation : [
                      {
                          deceasedresult : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          formatresult : [
                              {
                                  _ : 'Social Security Number is valid per Social Security Administration files.',
                                  temp : {
                                      code : 'V'
                                  }
                              }
                          ],
                          issueresult : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          stateissued : [
                              ''
                          ],
                          issuestartrange : [
                              ''
                          ],
                          issueendrange : [
                              ''
                          ]
                      }
                  ],
                  changeofaddress : [
                      ''
                  ],
                  previousaddresses : [
                      {
                          previousaddress : [
                              {
                                  street : [
                                      '3221 108TH ST APT 2'
                                  ],
                                  city : [
                                      'EAST ELMHURST'
                                  ],
                                  state : [
                                      'NY'
                                  ],
                                  zipcode : [
                                      '11369'
                                  ],
                                  zipplusfour : [
                                      '2523'
                                  ],
                                  reportdate : [
                                      {
                                          day : [
                                              '01'
                                          ],
                                          month : [
                                              '08'
                                          ],
                                          year : [
                                              '2017'
                                          ]
                                      }
                                  ],
                                  updatedate : [
                                      {
                                          day : [
                                              '15'
                                          ],
                                          month : [
                                              '06'
                                          ],
                                          year : [
                                              '2022'
                                          ]
                                      }
                                  ]
                              },
                              {
                                  street : [
                                      '115 PARK AVE APT 13'
                                  ],
                                  city : [
                                      'PATERSON'
                                  ],
                                  state : [
                                      'NJ'
                                  ],
                                  zipcode : [
                                      '07501'
                                  ],
                                  zipplusfour : [
                                      '2351'
                                  ],
                                  reportdate : [
                                      {
                                          day : [
                                              '09'
                                          ],
                                          month : [
                                              '06'
                                          ],
                                          year : [
                                              '2019'
                                          ]
                                      }
                                  ],
                                  updatedate : [
                                      {
                                          day : [
                                              '07'
                                          ],
                                          month : [
                                              '05'
                                          ],
                                          year : [
                                              '2021'
                                          ]
                                      }
                                  ]
                              }
                          ]
                      }
                  ],
                  additionaladdresses : [
                      {
                          additionaladdress : [
                              {
                                  street : [
                                      '9 WHEELER POINT RD'
                                  ],
                                  city : [
                                      'NEWARK'
                                  ],
                                  state : [
                                      'NJ'
                                  ],
                                  zipcode : [
                                      '07105'
                                  ],
                                  zipplusfour : [
                                      '3014'
                                  ],
                                  reportdate : [
                                      {
                                          day : [
                                              '04'
                                          ],
                                          month : [
                                              '05'
                                          ],
                                          year : [
                                              '2021'
                                          ]
                                      }
                                  ],
                                  updatedate : [
                                      {
                                          day : [
                                              '04'
                                          ],
                                          month : [
                                              '05'
                                          ],
                                          year : [
                                              '2021'
                                          ]
                                      }
                                  ]
                              },
                              {
                                  street : [
                                      '190 22ND AVE'
                                  ],
                                  city : [
                                      'PATERSON'
                                  ],
                                  state : [
                                      'NJ'
                                  ],
                                  zipcode : [
                                      '07513'
                                  ],
                                  zipplusfour : [
                                      '1343'
                                  ],
                                  reportdate : [
                                      {
                                          day : [
                                              '15'
                                          ],
                                          month : [
                                              '05'
                                          ],
                                          year : [
                                              '2019'
                                          ]
                                      }
                                  ],
                                  updatedate : [
                                      {
                                          day : [
                                              '07'
                                          ],
                                          month : [
                                              '01'
                                          ],
                                          year : [
                                              '2021'
                                          ]
                                      }
                                  ]
                              },
                              {
                                  street : [
                                      '9420 GUY R BREWER BLVD'
                                  ],
                                  city : [
                                      'JAMAICA'
                                  ],
                                  state : [
                                      'NY'
                                  ],
                                  zipcode : [
                                      '11451'
                                  ],
                                  zipplusfour : [
                                      '0001'
                                  ],
                                  reportdate : [
                                      {
                                          day : [
                                              '26'
                                          ],
                                          month : [
                                              '05'
                                          ],
                                          year : [
                                              '2018'
                                          ]
                                      }
                                  ],
                                  updatedate : [
                                      {
                                          day : [
                                              '26'
                                          ],
                                          month : [
                                              '05'
                                          ],
                                          year : [
                                              '2018'
                                          ]
                                      }
                                  ]
                              },
                              {
                                  street : [
                                      '511 UNION AVE'
                                  ],
                                  city : [
                                      'PATERSON'
                                  ],
                                  state : [
                                      'NJ'
                                  ],
                                  zipcode : [
                                      '07522'
                                  ],
                                  zipplusfour : [
                                      '1545'
                                  ],
                                  reportdate : [
                                      {
                                          day : [
                                              '20'
                                          ],
                                          month : [
                                              '10'
                                          ],
                                          year : [
                                              '2018'
                                          ]
                                      }
                                  ],
                                  updatedate : [
                                      {
                                          day : [
                                              '20'
                                          ],
                                          month : [
                                              '10'
                                          ],
                                          year : [
                                              '2018'
                                          ]
                                      }
                                  ]
                              }
                          ]
                      }
                  ],
                  fraudshieldresults : [
                      {
                          fraudshield01 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield02 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield03 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield04 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield05 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield06 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield10 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield11 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield13 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield14 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield15 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield16 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield17 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield18 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield21 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield25 : [
                              {
                                  temp : {
                                      code : 'N'
                                  }
                              }
                          ],
                          fraudshield26 : [
                              {
                                  _ : 'Best on-file SSN not issued as of MM/YY',
                                  temp : {
                                      code : 'Y'
                                  }
                              }
                          ],
                          fraudshield27 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ]
                      }
                  ],
                  sharedapplicationresults : [
                      {
                          glbrule01 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule02 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule03 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule04 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule05 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule06 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule07 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule08 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule09 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule10 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule11 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule12 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule13 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule14 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule15 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule16 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule17 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule18 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule19 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          glbrule20 : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ]
                      }
                  ],
                  initialresults : [
                      {
                          authenticationindex : [
                              ''
                          ],
                          mostlikelyfraudtype : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          initialdecision : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          finaldecision : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          reasons : [
                              {
                                  reason1 : [
                                      {
                                          temp : {
                                              code : ''
                                          }
                                      }
                                  ],
                                  reason2 : [
                                      {
                                          temp : {
                                              code : ''
                                          }
                                      }
                                  ],
                                  reason3 : [
                                      {
                                          temp : {
                                              code : ''
                                          }
                                      }
                                  ],
                                  reason4 : [
                                      {
                                          temp : {
                                              code : ''
                                          }
                                      }
                                  ],
                                  reason5 : [
                                      {
                                          temp : {
                                              code : ''
                                          }
                                      }
                                  ]
                              }
                          ]
                      }
                  ],
                  secondaryresults : [
                      {
                          authenticationindex : [
                              ''
                          ],
                          mostlikelyfraudtype : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          initialdecision : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          finaldecision : [
                              {
                                  temp : {
                                      code : ''
                                  }
                              }
                          ],
                          reasons : [
                              {
                                  reason1 : [
                                      {
                                          temp : {
                                              code : ''
                                          }
                                      }
                                  ],
                                  reason2 : [
                                      {
                                          temp : {
                                              code : ''
                                          }
                                      }
                                  ],
                                  reason3 : [
                                      {
                                          temp : {
                                              code : ''
                                          }
                                      }
                                  ],
                                  reason4 : [
                                      {
                                          temp : {
                                              code : ''
                                          }
                                      }
                                  ],
                                  reason5 : [
                                      {
                                          temp : {
                                              code : ''
                                          }
                                      }
                                  ]
                              }
                          ]
                      }
                  ],
                  emailaddressdetails : [
                      ''
                  ],
                  ipaddressdetail : [
                      ''
                  ],
                  ofacvalidation : [
                      {
                          ofacvalidationresult : [
                              {
                                  _ : 'No match to name or address.',
                                  temp : {
                                      code : '1'
                                  }
                              }
                          ]
                      }
                  ],
                  questions : [
                      {
                          question : [
                              {
                                  temp : {
                                      type : '1',
                                      text : 'Which one of the following addresses is associated with you?'
                                  },
                                  answer : [
                                      {
                                          _ : '56 DEJOR CI',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : '32 BRIGHTON AV',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : '9 WHEELER POINT RD',
                                          temp : {
                                              correct : 'true'
                                          }
                                      },
                                      {
                                          _ : '80 1ST FL',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : 'None of the above',
                                          temp : {
                                              correct : 'false'
                                          }
                                      }
                                  ]
                              },
                              {
                                  temp : {
                                      type : '2',
                                      text : 'Which one of the following area codes is associated with you?'
                                  },
                                  answer : [
                                      {
                                          _ : '603',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : '508/774',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : '973/862',
                                          temp : {
                                              correct : 'true'
                                          }
                                      },
                                      {
                                          _ : '631/934',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : 'None of the above',
                                          temp : {
                                              correct : 'false'
                                          }
                                      }
                                  ]
                              },
                              {
                                  temp : {
                                      type : '3',
                                      text : 'Which one of the following counties is associated with you?'
                                  },
                                  answer : [
                                      {
                                          _ : 'Ciales',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : 'Passaic',
                                          temp : {
                                              correct : 'true'
                                          }
                                      },
                                      {
                                          _ : 'Yabucoa',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : 'Maricao',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : 'None of the above',
                                          temp : {
                                              correct : 'false'
                                          }
                                      }
                                  ]
                              },
                              {
                                  temp : {
                                      type : '4',
                                      text : 'Which one of the following zip codes is associated with you?'
                                  },
                                  answer : [
                                      {
                                          _ : '11801',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : '11030',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : '11780',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : '11451',
                                          temp : {
                                              correct : 'true'
                                          }
                                      },
                                      {
                                          _ : 'None of the above',
                                          temp : {
                                              correct : 'false'
                                          }
                                      }
                                  ]
                              },
                              {
                                  temp : {
                                      type : '6',
                                      text : 'Which one of the following adult individuals is most closely associated with you?'
                                  },
                                  answer : [
                                      {
                                          _ : 'Zachary',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : 'Daniel',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : 'Leahonia',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : 'Yanely',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : 'None of the above',
                                          temp : {
                                              correct : 'true'
                                          }
                                      }
                                  ]
                              },
                              {
                                  temp : {
                                      type : '8',
                                      text : 'What are the first 3 digits of your SSN?'
                                  },
                                  answer : [
                                      {
                                          _ : '127',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : '743',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : '802',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : '820',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : 'None of the above',
                                          temp : {
                                              correct : 'true'
                                          }
                                      }
                                  ]
                              },
                              {
                                  temp : {
                                      type : '9',
                                      text : 'What was the zip code for the address on UNION AVE?'
                                  },
                                  answer : [
                                      {
                                          _ : '07030',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : '07715',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : '07522',
                                          temp : {
                                              correct : 'true'
                                          }
                                      },
                                      {
                                          _ : '07801',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : 'None of the above',
                                          temp : {
                                              correct : 'false'
                                          }
                                      }
                                  ]
                              },
                              {
                                  temp : {
                                      type : '10',
                                      text : 'What was the house number for the address on UNION AVE?'
                                  },
                                  answer : [
                                      {
                                          _ : '40',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : '717',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : '511',
                                          temp : {
                                              correct : 'true'
                                          }
                                      },
                                      {
                                          _ : '803',
                                          temp : {
                                              correct : 'false'
                                          }
                                      },
                                      {
                                          _ : 'None of the above',
                                          temp : {
                                              correct : 'false'
                                          }
                                      }
                                  ]
                              }
                          ]
                      }
                  ]
              }
          ]
      },
      status: null
    }
    // if (identityDataResponse.cardAPIResponseDoc) {
    //   apiResponse = identityDataResponse.cardAPIResponseDoc
    // } else if (identityDataResponse.personaAPIResponseDoc) {
    //   apiResponse = identityDataResponse.personaAPIResponseDoc
    // } else {
    //   const newIdentityDataResponse = await IdentityModel.findOne(identityModelQuery);
    //   newIdentityDataResponse.cardAPIResponseDoc = apiResponse
    //   newIdentityDataResponse.save()
    // }
    const otherSigners = []
    const sessionDoc = await NewSessionModel.findOne({
      _id: sessionid
    })
    const additionalSignerIdentityModels = await IdentityModel.find({
      sessionid: String(sessionid),
      userId: {$ne: sessionDoc.userId}
    });
    const finalResponse = {
      apiStatus: 'We are processing your Passport',
      frontPhotoUrl: identityDataResponse.frontPhotoIdUrl,
      backPhotoUrl: identityDataResponse.backPhotoIdUrl,
      identityDataResponse,
      workflowOutcome: '',
      documentValidationResult: '',
      documentExpirationResult: '',
      kbaStatus: '',
      otherSigners
    }
    let responseDoc
    if (identityDataResponse.cardAPIResponseDoc) {
      responseDoc = apiResponse?.platformresponse?.response?.[0]
    } else if (identityDataResponse.personaAPIResponseDoc) {
      const respStatus = identityDataResponse.personaAPIResponseDoc?.status;
      console.log('respStatus', respStatus)
      if (respStatus) {
        responseDoc = {
          workflowOutcome: 'Success'
        }
        finalResponse.workflowOutcome = respStatus
        finalResponse.documentValidationResult = 'Pass'
        finalResponse.documentExpirationResult = 'Pass'
      }
    }
    const userCurrentSessionLogs = await SessionUserLogs.find({
      sessionid: new mongoose.Types.ObjectId(sessionid),
      userId: sessionDoc.userId
    })
    _.map(userCurrentSessionLogs, (currentSessionLog) => {
      if (currentSessionLog.actionType === 'kba_failed') {
        finalResponse.kbaStatus = 'Fail'
      } else if (currentSessionLog.actionType === 'kba_succeeded' || currentSessionLog.actionType ===
        'photo_id_passed' || currentSessionLog.actionType === 'biometrics_passed') {
        finalResponse.kbaStatus = 'Pass'
      }
    })
    if (!finalResponse.kbaStatus && sessionDoc?.skipCustomerKBACheck) {
      finalResponse.kbaStatus = 'Skip'
      finalResponse.documentValidationResult = 'Skip'
      finalResponse.documentExpirationResult = 'Skip'
    } else if (!finalResponse.kbaStatus) {
      finalResponse.kbaStatus = 'Pending'
    }
    console.log('additionalSignerIdentityModels', additionalSignerIdentityModels)
    if (additionalSignerIdentityModels.length) {
      await Promise.all(_.map(additionalSignerIdentityModels, async (additionalSignerIdentityModel) => {
        const tempResponse = {
          frontPhotoUrl: additionalSignerIdentityModel.frontPhotoIdUrl,
          backPhotoUrl: additionalSignerIdentityModel.backPhotoIdUrl,
          identityDataResponse: additionalSignerIdentityModel,
          workflowOutcome: '',
          documentValidationResult: '',
          documentExpirationResult: '',
          kbaStatus: ''
        }
        if (additionalSignerIdentityModel.personaAPIResponseDoc) {
          // @ts-ignore
          const respStatus2 = additionalSignerIdentityModel.personaAPIResponseDoc?.status;
          if (respStatus2) {
            tempResponse.workflowOutcome = respStatus2
            tempResponse.documentValidationResult = 'Pass'
            tempResponse.documentExpirationResult = 'Pass'
          }
        }
        const userCurrentSessionLogs2 = await SessionUserLogs.find({
          sessionid: new mongoose.Types.ObjectId(sessionid),
          userId: additionalSignerIdentityModel.userId
        })
        console.log('userCurrentSessionLogs2userCurrentSessionLogs2', userCurrentSessionLogs2)
        _.map(userCurrentSessionLogs2, (currentSessionLog) => {
          if (currentSessionLog.actionType === 'kba_failed') {
            tempResponse.kbaStatus = 'Fail'
          } else if (currentSessionLog.actionType === 'kba_succeeded') {
            tempResponse.kbaStatus = 'Pass'
          }
        })
        if (!tempResponse.kbaStatus && sessionDoc?.skipCustomerKBACheck) {
          tempResponse.kbaStatus = 'Skip'
        } else if (!tempResponse.kbaStatus) {
          tempResponse.kbaStatus = 'Pending'
        }
        finalResponse.otherSigners.push(tempResponse)
      }))
    }
    console.log('complete')
    console.log('responseDoc', responseDoc)
    // if (!responseDoc) {
    //   res.status(200).json({
    //     workflowOutcome: 'Fail',
    //     reason: 'No Idea'
    //   })
    // }
    res.status(200).json(finalResponse)
  } else {
    // below flow is used for fill api
    if (false) {
      const builder = new XMLBuilder();
      const newIdentityDataResponse = await IdentityModel.findOne(identityModelQuery);
      const backPhotoIdUrl = newIdentityDataResponse.backPhotoIdUrl.replace(/^https:\/\//i, 'http://');
      // const backPhotoIdUrl = 'http://bluenotarybucket.s3.us-east-
      // 2.amazonaws.com/1649582404008IMG_0467.jpg' // correct
      // const backPhotoIdUrl = 'http://bluenotarybuckey2.s3.us-east-2.amazonaws.com/1653009984695image.jpg' // incorect
      http.get(backPhotoIdUrl, (resp) => {
        resp.setEncoding('base64');
        let fileData = '';
        resp.on('data', (data) => {
          fileData += data;
        });
        resp.on('end', async () => {
          // const sharpImage = await sharp(Buffer.from(fileData, 'base64')).resize({ width: 1500 }).toBuffer();
          // const finalFileData = sharpImage.toString('base64')
          console.log(fileData)
          // const sharpImage = ''
          const finalFileData = ''
          const jsObjectToSend = {
            PlatformRequest: {
              Credentials: {
                Username: 'E27368-65DCF76C-B477-4167-83F4-2E63D0690D4C',
                Password: 'nN0Q44tYmykA5ib'
              },
              CustomerReference: 'E27368-5C86555C-51B1-4175-B5EA-DDD6B7852F02',
              Identity: {
                ScanMode: 'DirectImageUpload',
                // FirstName: newIdentityDataResponse.firstName,
                // LastName: newIdentityDataResponse.lastName,
                // DateOfBirth: moment(newIdentityDataResponse.birthdate, 'YYYY/MM/DD').format('YYYY-MM-DD'),
                // Ssn: demo ? '222222222' : newIdentityDataResponse.userSsn,
                // Street: newIdentityDataResponse.addressLine1, // TODO : Uncomment when testing is done
                // ZipCode: newIdentityDataResponse.userZipCode, // TODO : Uncomment when testing is done
                BackImage: finalFileData
              }
            }
          }
          const xmlContent = builder.build(jsObjectToSend);
          const evsFillAPIUrl = 'https://identiflo.everification.net/WebServices/Integrated/Main/V220/Fill'
          const headers = {'Content-Type': 'application/xml'}
          console.log(xmlContent)
          console.log(evsFillAPIUrl)
          console.log('jsObjectToSend', jsObjectToSend)
          request.post({url: evsFillAPIUrl, body: xmlContent, headers}, (error1, response1, body1) => {
              const parser = new XMLParser({
                attributeNamePrefix : '@_',
                ignoreAttributes : false,
                ignoreNameSpace: false,
                textNodeName : 'text'
              });
              const apiResponse = parser.parse(body1);
              console.log(util.inspect(apiResponse, {showHidden: false, depth: null, colors: true}))
              const responseDoc = apiResponse && apiResponse.PlatformResponse
                && apiResponse.PlatformResponse.Response || false;
              if (newIdentityDataResponse) {
                newIdentityDataResponse.fillAPIResponseDoc = apiResponse;
                newIdentityDataResponse.save();
              }
              if (!responseDoc) {
                res.status(200).json({
                  workflowOutcome: 'Fail',
                  reson: 'No Idea'
                })
              }
              const allDetails = []
              const finalResponse = {
                allDetail: null,
                workflowOutcome: responseDoc && responseDoc.WorkflowOutcome && responseDoc.WorkflowOutcome.text
                ? responseDoc.WorkflowOutcome.text : '',
                documentValidationResult: responseDoc && responseDoc.ParseResult
                  && responseDoc.ParseResult.DocumentValidationResult &&
                  responseDoc.ParseResult.DocumentValidationResult.text || '',
                documentExpirationResult: responseDoc && responseDoc.ParseResult
                  && responseDoc.ParseResult.DocumentExpirationResult &&
                  responseDoc.ParseResult.DocumentExpirationResult.text || '',
                frontPhotoUrl: identityDataResponse.frontPhotoIdUrl || false,
                backPhotoUrl: identityDataResponse.backPhotoIdUrl || false
              }
              _.map(responseDoc && responseDoc.ParseResult, (resultValue, resultKey) => {
                if (['DocumentValidationResult', 'DocumentExpirationResult'].indexOf(resultKey) !== -1) {
                  return
                }
                _.map(resultValue, (innerResultValue, innerResultKey) => {
                  if (!innerResultValue) {
                    return
                  }
                  allDetails.push({
                    displayName: innerResultKey.replace(/([A-Z])/g, ' $1').trim(),
                    group: resultKey.replace(/([A-Z])/g, ' $1').trim(),
                    value: innerResultValue
                  })
                })
              })
              finalResponse.allDetail = allDetails
              res.status(200).json(finalResponse)
            });
            // return res.json({result: body, status: 'success'});
        });
      }).on('error', (e) => {
        res.status(400).json({
          error: e.message
        })
        // console.log(`Got error: ${e.message}`);
      });
    } else {
      const newIdentityDataResponse = await IdentityModel.findOne(identityModelQuery);
      const customerReferenceNumber = 'USER_' + String(user._id) + '_' + Math.floor(Math.random() * 999)
      newIdentityDataResponse.cardAPICustomerReferenceNumber = customerReferenceNumber;
      await newIdentityDataResponse.save()
      const frontPhotoIdUrl = newIdentityDataResponse.frontPhotoIdUrl &&
      newIdentityDataResponse.frontPhotoIdUrl.replace(/^https:\/\//i, 'http://');
      const backPhotoIdUrl = newIdentityDataResponse.backPhotoIdUrl &&
      newIdentityDataResponse.backPhotoIdUrl.replace(/^https:\/\//i, 'http://');
      // const backPhotoIdUrl = 'http://bluenotarybucket.s3.us-east-
      // 2.amazonaws.com/1649582404008IMG_0467.jpg' // correct
      // const backPhotoIdUrl = 'http://bluenotarybuckey2.s3.us-east-2.amazonaws.com/1653009984695image.jpg' // incorect
      http.get(frontPhotoIdUrl, (resp) => {
        resp.setEncoding('base64');
        let frontFileData = '';
        let backFileData = '';
        resp.on('data', (data) => {
          frontFileData += data;
        });
        resp.on('end', async () => {
          if (backPhotoIdUrl) {
            http.get(backPhotoIdUrl, (resp2) => {
              resp2.setEncoding('base64');
              resp2.on('data', (data) => {
                backFileData += data;
              });
              resp2.on('end', async () => {
                processEVSCardAPI(typeOfPhotoId, frontFileData, backFileData, customerReferenceNumber, biometrics, res)
              });
            }).on('error', (e) => {
              res.status(400).json({
                error: e.message
              })
            });
          } else {
            processEVSCardAPI(typeOfPhotoId, frontFileData, backFileData, customerReferenceNumber, biometrics, res)
          }
        });
      }).on('error', (e) => {
        res.status(400).json({
          error: e.message
        })
      });
    }
  }
};

exports.verifyCustomerAnswersDuringSessionFlow = async (req, res) => {
  const user = req.user
  const sessionid = req.params && req.params.id;
  const calledFromBusinessPage = req.query && req.query.calledFromBusinessPage ? true : false;
  const calledFromSessionPage = req.query && req.query.calledFromSessionPage ? true : false;
  if (!sessionid) {
    res.status(400).json({
      error: 'Session id not found'
    })
  }
  req = matchedData(req);

  const finalResponseData = {
    customerUser: null,
    identityDataResponse: null
  }
  const newSessionModelData = await NewSessionModel.findOne({
    _id: sessionid
  })
  let identityDataResponse = {
    firstName: null,
    lastName: null,
    fillAPIResponseDoc: null,
    cardAPIResponseDoc: null,
    consumerPlusAPIResponseDoc: null,
    typeOfPhotoId: null
  };
  if (newSessionModelData.userId) {
    const customerUser = await User.findOne({
      _id: newSessionModelData.userId, deleted: {$ne: true}
    })
    if (customerUser) {
      finalResponseData.customerUser = customerUser
    }
    identityDataResponse = await IdentityModel.findOne({
      userId: user._id,
      sessionid: String(sessionid)
    })
    if (identityDataResponse) {
      finalResponseData.identityDataResponse = identityDataResponse
    }
  }
  if (!identityDataResponse.firstName) {
    return res.status(400).json({
      error: 'Identities Data Not Found'
    })
  }
  let userIdToUse = new mongoose.Types.ObjectId(newSessionModelData.userId)
  if (calledFromBusinessPage || calledFromSessionPage) {
    userIdToUse = user._id
  }
  const sessionUserLogsData = new SessionUserLogs({
    sessionid: new mongoose.Types.ObjectId(sessionid),
    userId: userIdToUse,
    actionType: 'kba_answered',
    kbaAnswers: req.answers,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  sessionUserLogsData.save();
  await VendorService.sendVendorUpdatesIntermediate('kba_answered', 'KBA Answered by user', user,
    newSessionModelData._id, newSessionModelData)
  const diff = new Date().valueOf() - newSessionModelData.kbaStartedAt.valueOf()
  const minutesDifference = diff / (60 * 1000)
  console.log('minutesDifference', minutesDifference)
  let kbaInTime = true;
  if (minutesDifference >= 2) {
    kbaInTime = false;
  }
  if (!kbaInTime) {
    return res.status(200).json({
      // status: response.every(value => value === 'true'),
      status: false,
      kbaTimeOver: true
    })
  }
  let questionDocs
  const questionBlockValue = req.questionBlock;

  const cardObj = identityDataResponse.cardAPIResponseDoc;
  let checkCardObject = true;
  if (identityDataResponse.typeOfPhotoId === 'passportbook') {
    checkCardObject = false;
  }
  console.log('checkCardObject', checkCardObject)
  if (cardObj && checkCardObject) {
    const localQuestionDocs = cardObj?.platformresponse?.response?.[0]?.questions?.[0]?.question;
    console.log('localQuestionDocs', localQuestionDocs)
    console.log(util.inspect(localQuestionDocs, {showHidden: false, depth: null, colors: true}));
    const finalQuestionDocs = []
    _.map(localQuestionDocs, (tempQuestionDoc) => {
      finalQuestionDocs.push({
        '@_text': tempQuestionDoc?.temp?.text,
        '@_type': tempQuestionDoc?.temp?.type,
        'Answer': _.map(tempQuestionDoc.answer, (tempAnswerDoc) => {
          return {
            'text': tempAnswerDoc._,
            '@_correct': tempAnswerDoc?.temp?.correct
          }
        })
      })
    })
    if (finalQuestionDocs.length < 10) {
      const newQuestionsNeeded = 10 - finalQuestionDocs.length;
      console.log('newQuestionsNeeded', newQuestionsNeeded)
      for (let i = 0; i < newQuestionsNeeded; i += 1) {
        finalQuestionDocs.push(finalQuestionDocs[i])
      }
    }
    questionDocs = finalQuestionDocs
    // finalOutput = {
    //   test: {
    //     Questions: {
    //       Question: finalQuestionDocs
    //     },
    //   },
    //   output: cardObj?.platformresponse?.response?.[0]?.workflowoutcome?.[0]?.["_"] || "Fail",
    //   details: {}
    // }
  } else if (identityDataResponse.fillAPIResponseDoc) {
    const jObj = identityDataResponse.fillAPIResponseDoc;
    const tempResponse = jObj.PlatformResponse && jObj.PlatformResponse.Response || {};
    // if (_.isObject(questionBlockValue) && questionBlockValue && questionBlockValue.value) {
    //   questionBlockValue = questionBlockValue.value
    // }
    if (tempResponse && tempResponse.Questions && tempResponse.Questions.Question &&
      tempResponse.Questions.Question.length < 10) {
      const newQuestionsNeeded = 10 - tempResponse.Questions.Question.length;
      console.log('newQuestionsNeeded', newQuestionsNeeded)
      for (let i = 0; i < newQuestionsNeeded; i += 1) {
        tempResponse.Questions.Question.push(tempResponse.Questions.Question[i])
      }
    }
    questionDocs = tempResponse.Questions.Question
  } else if (identityDataResponse.consumerPlusAPIResponseDoc) {
    const tempObj = identityDataResponse.consumerPlusAPIResponseDoc;
    const tempResponse = tempObj.PlatformResponse && tempObj.PlatformResponse.Response || {};
    // if (_.isObject(questionBlockValue) && questionBlockValue && questionBlockValue.value) {
    //   questionBlockValue = questionBlockValue.value
    // }
    if (tempResponse && tempResponse.Questions && tempResponse.Questions.Question &&
      tempResponse.Questions.Question.length < 10) {
      const newQuestionsNeeded = 10 - tempResponse.Questions.Question.length;
      console.log('newQuestionsNeeded', newQuestionsNeeded)
      for (let i = 0; i < newQuestionsNeeded; i += 1) {
        tempResponse.Questions.Question.push(tempResponse.Questions.Question[i])
      }
    }
    questionDocs = tempResponse.Questions.Question
  }
  let startIndex = 0;
  if (questionBlockValue === 'B') {
    startIndex = 5;
  }
  const response = [];
  for ( let i = 0; i < 5; i += 1) {
    const currentQuestion = questionDocs[i + startIndex];
    currentQuestion.Answer.forEach((answer) => {
      if (answer.text === req.answers[i]) {
        response[i] = answer['@_correct'];
        return;
      }
    });
  }
  const totalCorrectAnswersToPass = 4;
  const finalOutput = {
    // status: response.every(value => value === 'true'),
    status: response.filter((value) => value === 'true').length >= totalCorrectAnswersToPass,
    response,
    totalCorrectAnswersToPass,
    newSessionModelData
  }
  if (questionBlockValue === 'A' && finalOutput.status) {
    const sessionUserLogsData2 = new SessionUserLogs({
      sessionid: new mongoose.Types.ObjectId(sessionid),
      userId: userIdToUse,
      actionType: 'kba_succeeded',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    sessionUserLogsData2.save();
    await VendorService.sendVendorUpdatesIntermediate('kba_succeeded', 'KBA Passed by user', user,
      newSessionModelData._id, newSessionModelData)
  } else if (questionBlockValue === 'A' && !finalOutput.status) {
    const sessionUserLogsData2 = new SessionUserLogs({
      sessionid: new mongoose.Types.ObjectId(sessionid),
      userId: userIdToUse,
      actionType: 'kba_first_set_failed',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    sessionUserLogsData2.save();
    await VendorService.sendVendorUpdatesIntermediate('kba_first_set_failed', 'KBA First set failed by user', user,
      newSessionModelData._id, newSessionModelData)
  } else if (questionBlockValue === 'B' && finalOutput.status) {
    const sessionUserLogsData2 = new SessionUserLogs({
      sessionid: new mongoose.Types.ObjectId(sessionid),
      userId: userIdToUse,
      actionType: 'kba_succeeded',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    sessionUserLogsData2.save();
    await VendorService.sendVendorUpdatesIntermediate('kba_succeeded', 'KBA Passed by user', user,
      newSessionModelData._id, newSessionModelData)
  } else if (questionBlockValue === 'B' && !finalOutput.status) {
    const sessionUserLogsData2 = new SessionUserLogs({
      sessionid: new mongoose.Types.ObjectId(sessionid),
      userId: userIdToUse,
      actionType: 'kba_failed',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    sessionUserLogsData2.save();
    await VendorService.sendVendorUpdatesIntermediate('kba_failed', 'KBA Failed by user', user,
      newSessionModelData._id, newSessionModelData)
  }
  res.status(200).json(finalOutput)
};

async function uploadFrontBackImageManually(imageUrl, imageType, sessionId,
                                            personaAPIKey, identityDataResponse, tempCallback) {
  const imageUrlSplitted = imageUrl.split('/')
  const fileId = imageUrlSplitted[imageUrlSplitted.length - 2]
  const fileName = imageUrlSplitted[imageUrlSplitted.length - 1]
  const options = {
    hostname: 'withpersona.com',
    path: '/api/v1/files/' + fileId + '/' + fileName,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + personaAPIKey
    }
  }
  console.log(options)
  https.get(options, (response) => {
    response.setEncoding('binary');
    const result = []
    response.on('data', (chunk) => {
      result.push(Buffer.from(chunk, 'binary'));
    });
    response.on('end', async () => {
      const documentName = 'Persona_id_' + fileName
      const documentKey = Date.now().toString() + documentName
      const resultBody = Buffer.concat(result)
      const params = {
        Bucket: process.env.AWSBucket,
        Key: documentKey,
        Body: resultBody,
        // ACL: 'public-read'
        XAmzAcl: 'public-read'
      };
      try {
        const documentData = await s3.upload(params).promise();
        if (imageType === 'front') {
          identityDataResponse.frontPhotoIdUrl = localGetSignedUrl(documentData.Key);
          identityDataResponse.frontPhotoIdKey = documentData.Key;
          identityDataResponse.frontPhotoIdName = fileName;
          identityDataResponse.frontPhotoIdType = 'image/jpeg';
          identityDataResponse.frontPhotoIdSize = Buffer.byteLength(resultBody);
          identityDataResponse.frontPhotoIdBucketName = documentData.Bucket;
        } else {
          identityDataResponse.backPhotoIdUrl = localGetSignedUrl(documentData.Key);
          identityDataResponse.backPhotoIdKey = documentData.Key;
          identityDataResponse.backPhotoIdName = fileName;
          identityDataResponse.backPhotoIdType = 'image/jpeg';
          identityDataResponse.backPhotoIdSize = Buffer.byteLength(resultBody);
          identityDataResponse.backPhotoIdBucketName = documentData.Bucket;
        }
        await identityDataResponse.save()
        return tempCallback(null, documentData)
      } catch (err) {
        return tempCallback(null, false)
        console.log(err);
      }
    })
  }).on('error', (e) => {
    console.log('IMAGE UPLOAD ERROR!!', e)
    return tempCallback(null, false)
  });
}

exports.savePersonaDetailsForPhotoid = async (req, res) => {
  const user = req.user
  const sessionid = req.params && req.params.id;
  if (!sessionid) {
    res.status(400).json({
      error: 'Session id not found'
    })
  }
  req = matchedData(req);
  const personaOutputData = req.personaAPIResponseDoc
  console.log('personaOutputData', personaOutputData)
  if (!personaOutputData) {
    return res.status(400).json({
      error: 'Persona Output Not Found'
    })
  }

  const newSessionModelData = await NewSessionModel.findOne({
    _id: sessionid
  })
  const identityDataResponse = await IdentityModel.findOne({
    userId: user._id,
    sessionid: String(sessionid)
  })
  if (!identityDataResponse) {
    return res.status(400).json({
      error: 'Identities Data Not Found'
    })
  }
  identityDataResponse.personaAPIResponseDoc = personaOutputData;
  await identityDataResponse.save()
  const inquiryId = personaOutputData?.inquiryId
  let personaAPIKey = process.env.PERSONA_KEY
  if (user.testingacc) {
    personaAPIKey = process.env.PERSONA_TEST_KEY
  }
  const options = {
    hostname: 'withpersona.com',
    path: '/api/v1/inquiries/' + inquiryId,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Persona-Version': '2021-05-14',
      'Authorization': 'Bearer ' + personaAPIKey
    }
  }
  console.log('personaAPIKey', personaAPIKey)
  https.get(options, (response) => {
    let result = ''
    response.on('data', (chunk) => {
        result += chunk;
    });
    response.on('end', async () => {
      identityDataResponse.fullPersonaAPIResponseDoc = JSON.parse(result)
      await identityDataResponse.save()
      let frontImageUrl;
      let backImageUrl;
      // @ts-ignore
      const includedDocs = identityDataResponse?.fullPersonaAPIResponseDoc?.included || []
      _.map(includedDocs, (includedDoc) => {
        if (includedDoc?.attributes?.status === 'passed') {
          if (includedDoc.attributes['front-photo-url']) {
            frontImageUrl = includedDoc.attributes['front-photo-url']
          }
          if (includedDoc.attributes['back-photo-url']) {
            backImageUrl = includedDoc.attributes['back-photo-url']
          }
        }
      })
      // @ts-ignore
      // const frontImageUrl = identityDataResponse?.fullPersonaAPIResponseDoc?.included?.[0]?.
      //   attributes?.['front-photo-url']
      // // @ts-ignore
      // const backImageUrl = identityDataResponse?.fullPersonaAPIResponseDoc?.included?.[0]?.
      //   attributes?.['back-photo-url']
      console.log('frontImageUrl', frontImageUrl)
      console.log('backImageUrl', backImageUrl)
      if (!frontImageUrl && !backImageUrl) {
        const sessionUserLogsData = new SessionUserLogs({
          sessionid: new mongoose.Types.ObjectId(sessionid),
          userId: new mongoose.Types.ObjectId(user._id),
          actionType: 'photo_id_failed',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        sessionUserLogsData.save();
        await VendorService.sendVendorUpdatesIntermediate('photo_id_failed',
          'Photoid Stage Failed by user', user, sessionid, false)
        res.status(200).json({
          success: true
        })
      }
      const sessionUserLogsData2 = new SessionUserLogs({
        sessionid: new mongoose.Types.ObjectId(sessionid),
        userId: new mongoose.Types.ObjectId(user._id),
        actionType: 'photo_id_passed',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      sessionUserLogsData2.save();
      await VendorService.sendVendorUpdatesIntermediate('photo_id_passed',
        'Photoid Stage Passed by user', user, sessionid, false)
      if (frontImageUrl) {
        uploadFrontBackImageManually(frontImageUrl, 'front', sessionid, personaAPIKey,
          identityDataResponse, (tempErr, documentResponse) => {
          console.log('documentResponse front', documentResponse)
          console.log('documentResponse tempErr', tempErr)
          if (backImageUrl) {
            uploadFrontBackImageManually(backImageUrl, 'back', sessionid, personaAPIKey,
              identityDataResponse, (tempErr2, documentResponse2) => {
              console.log('documentResponse back', documentResponse2)
              console.log('documentResponse tempErr2', tempErr2)
            })
          }
        })
      } else if (backImageUrl) {
        uploadFrontBackImageManually(backImageUrl, 'back', sessionid, personaAPIKey,
          identityDataResponse, (tempErr, documentResponse) => {
          console.log('documentResponse back', documentResponse)
          console.log('documentResponse tempErr', tempErr)
        })
      }
      let sendAdditionalSignerEmailers = false
      if (newSessionModelData.vendor) {
        const vendorDoc = await Vendors.findOne({_id: newSessionModelData.vendor})
        if (vendorDoc && vendorDoc.skipSessionCharges) {
          sendAdditionalSignerEmailers = true
        }
      } else {
        if (newSessionModelData.sessionChargeOnBusinessUser) {
          sendAdditionalSignerEmailers = true
        }
      }
      console.log('sendAdditionalSignerEmailers', sendAdditionalSignerEmailers)
      console.log('sendAdditionalSignerEmailers user._id', user._id, newSessionModelData.userId,
      String(user._id) === String(newSessionModelData.userId))
      if (sendAdditionalSignerEmailers && newSessionModelData.multiSignerList &&
        String(user._id) === String(newSessionModelData.userId)) {
        let vendorDoc = {}
        if (newSessionModelData.vendor) {
          vendorDoc = await Vendors.findOne({
            _id: newSessionModelData.vendor
          })
        }
        let notaryUserDoc = {}
        if (newSessionModelData.notaryUserId) {
          notaryUserDoc = await User.findOne({
            _id: newSessionModelData.notaryUserId, deleted: {$ne: true}
          })
        }
        await Promise.all(_.map(newSessionModelData.multiSignerList, async (signerDoc) => {
          if (signerDoc.emailSent) {
            return
          }
          console.log(signerDoc)
          const email = signerDoc.email;
          let userDoc = await User.findOne({
            email,
            role: 'customer',
            deleted: {$ne: true}
          })
          if (!userDoc) {
            userDoc = new User({
              name: 'Additional Signer',
              first_name: 'Additional',
              last_name: 'Signer',
              email,
              password: utils.generateRandomPassword(6),
              verification: uuid.v4(),
              role: 'customer',
              state: '',
              verified: true,
              testingacc: user.testingacc || false
            });
            await userDoc.save();
          }
          console.log('userDoc', userDoc)
          emailer.sendEmailToAdditionalSignerWhenInvitedToSession(userDoc, userDoc.password,
            getTimeOfSessionFormatted(newSessionModelData), sessionid, vendorDoc, notaryUserDoc, newSessionModelData);
          signerDoc.emailSent = true
        }))
        await newSessionModelData.save()
      }
      res.status(200).json({
        success: true
      })
    });
  }).on('error', (e) => {
    console.log('IMAGE UPLOAD ERROR!!', e)
  }); ;
};

exports.savePDFEditingPage = async (req, res) => {
  let droppedElements = req.body && req.body.droppedElements || [];
  let droppedElementsDocIdWise = req.body && req.body.droppedElementsDocIdWise || {};
  const allDocumentPagesViewports = req.body && req.body.allDocumentPagesViewports || {};
  const sessionid = req.params && req.params.id
  if (!sessionid) {
    res.status(400).json({
      error: 'Session id not found'
    })
  }
  console.log(req.body);
  const newSessionModelData = await NewSessionModel.findOne({
    _id: sessionid
  })
  newSessionModelData.attachCertificate = req.body.attachCertificate;
  newSessionModelData.notorizationType = req.body.notorizationType;
  newSessionModelData.costOfNotarization = req.body.costOfNotarization;
  newSessionModelData.finalCostOfNotarization = req.body.finalCostOfNotarization;
  newSessionModelData.emptyPagesAdded = req.body.emptyPagesAdded;
  newSessionModelData.sessionCustomCharges = req.body.sessionCustomCharges;
  if (req.body.emptyPagesAddedDocIdWise) {
    newSessionModelData.emptyPagesAddedDocIdWise = req.body.emptyPagesAddedDocIdWise;
  }
  await newSessionModelData.save()
  let pdfDroppedElementsDoc = await PDFDroppedElementsModel.findOne({ sessionid });
  if (!pdfDroppedElementsDoc) {
    pdfDroppedElementsDoc = new PDFDroppedElementsModel({ sessionid })
  }
  if (_.isString(droppedElements)) {
    droppedElements = JSON.parse(droppedElements);
  }
  pdfDroppedElementsDoc.droppedElements = droppedElements
  if (_.isString(droppedElementsDocIdWise)) {
    droppedElementsDocIdWise = JSON.parse(droppedElementsDocIdWise)
  }
  pdfDroppedElementsDoc.droppedElementsDocIdWise = droppedElementsDocIdWise
  pdfDroppedElementsDoc.allDocumentPagesViewports = allDocumentPagesViewports
  await pdfDroppedElementsDoc.save()
  res.status(200).json({ success: true })
};

exports.pdfEditsFinalDocumentSave = async (req, res) => {
  const file = req.file
  const user = req.user
  const filename = req.body.filename
  const lastDocument = req.body.lastDocument || false
  console.log('lastDocument', lastDocument)
  const originalDocumentId = req.body.originalDocumentId
  const sessionid = req.params && req.params.id
  req = matchedData(req);
  const sessions = await NewSessionModel.findOne({ _id: sessionid });
  try {
    if (file) {
      try {
        openvidu.stopRecording('session_' + sessionid)
        .then((response) => {
          console.log('stop recording response', response);
        })
        .catch((error2) => {
          console.log('stop recording error2', error2)
        });
      } catch (tempError) {
        console.log('stop recording tempError', tempError)
      }
      // Create Document First
      const tempDocumentDoc = {
        sessionid,
        documentCategory: 'final_document',
        name: filename,
        url: localGetSignedUrl(file.key),
        type: file.mimetype,
        size: file.size,
        key: file.key,
        bucketName: file.bucket,
        uploadedBy: user.id,
        uploadedStage: 'meet_notary_stage',
        originalDocumentId: null
      }
      if (originalDocumentId) {
        tempDocumentDoc.originalDocumentId = originalDocumentId
      }
      const uploadedDocument = new DocumentModel(tempDocumentDoc);
      const uploadedDocumentDoc = await uploadedDocument.save();

      sessions.finalDocumentId = uploadedDocumentDoc._id;
      sessions.status = 'complete';
      sessions.stagesHistory.push({
        stageName: 'Session Complete',
        stageDate: new Date()
      });
      await sessions.save();
      const notaries = await IdentityModel.findOne({ sessionid });
      console.log('notaries', notaries)

      // Sign DC
      // get P12 file
      const notaryDatasDoc = await NotaryDataModel.findOne({
        userId: sessions.notaryUserId
      })
      // get the Notary
      const notaryUser = await User.findOne({
        _id: sessions.notaryUserId, deleted: {$ne: true}
      })
      // Sign with the existing p12
      const notaryData = {
        notaryUserId: notaryUser.id,
        contactInfo: notaryUser.email,
        name: notaryUser.name,
        location: (notaryDatasDoc && notaryDatasDoc.county) || 'US',
        dcPassword: (notaryDatasDoc && notaryDatasDoc.dcpassword) || 'bnDCpwd21'
      }
      console.log('notaryDatasDoc', notaryDatasDoc)
      // Sign with the existing p12
      if (notaryDatasDoc && notaryDatasDoc.certfileUrl) {
        await signDocument(uploadedDocumentDoc.key,
            notaryDatasDoc.fileKey,
            sessionid,
            'Signed Certificate By Blue Notary.',
            notaryData);
      } else { // generate new p12
        // const p12 = require('node-openssl-p12').createClientSSL;
        const clientFileName = `client_${sessionid}`
        const p12options = {
          clientFileName,
          bitSize: 2048,
          C: 'US', // Country Name (2 letter code)
          ST: notaryUser.state || 'Illinois', // State or Province Name (full name)
          L: notaryUser.state || 'Chicago', // Locality Name (eg, city)
          O: 'Blue Notary LLC', // Organization Name (eg, company)
          OU: notaryUser.state || 'Illinois', // Organizational Unit Name (eg, section)
          CN: notaryUser.name, // Common Name (eg, fully qualified host name)
          emailAddress: notaryUser.email, // Notary Email
          clientPass: (notaryDatasDoc && notaryDatasDoc.dcpassword) || 'bnDCpwd21', // DC password
          caFileName: 'ca',
          serial: '01',
          days: 365
        };
        const p12FilePath = path.join( process.cwd(), 'ssl', `${clientFileName}.p12`)
        if (fs.existsSync(p12FilePath)) {
          fs.unlinkSync(p12FilePath)
        }

        // generate p12 for notary
        // await p12(p12options).done((options, sha1fingerprint) => {
        //   console.log('SHA-1 fingerprint:', sha1fingerprint);
        //   console.log('options:', options);
        // }).fail((err) => {
        //   console.log('error', err);
        // });
        const sslValue = DCService.createClientSSL(p12options)
        await waitFor(1000)
        sslValue.done((options, sha1fingerprint) => {
          console.log('SHA-1 fingerprint:', sha1fingerprint);
          console.log('options:', options);
        }).fail((err) => {
          console.log('error', err);
        });

        if (fs.existsSync(p12FilePath)) {
          const p12File = await upload(process.env.AWSBucket,
              `${clientFileName}.p12`,
              fs.readFileSync(p12FilePath),
              'application/x-pkcs12'
          )
          console.log('p12File', p12File)

          // save p12 to notary
          notaryDatasDoc.certfileUrl = localGetSignedUrl(clientFileName + '.p12');
          notaryDatasDoc.certfilename = clientFileName;
          notaryDatasDoc.certfileSource = 'automatic';
          notaryDatasDoc.certfileAddedAt = new Date();
          notaryDatasDoc.fileKey = clientFileName;
          await notaryDatasDoc.save();

          await signDocument(uploadedDocumentDoc.key,
              notaryDatasDoc.fileKey,
              sessionid,
              'Signed Certificate By Blue Notary.',
              notaryData);

          // remove p12 in ssl
          fs.unlinkSync(p12FilePath)
        } else {
          console.log('error: it could not generate p12')
        }
      }
      let paymentDone = ''
      if (lastDocument === 'true') {
        AlertingService.endSessionAlertingService(sessionid, user.id, false)
        paymentDone = await processChargesForSession(sessions, notaries, user, false, notaries.stripeCustomerID);
        try {
          if (sessions.vendor) {
            const vendorDoc = await Vendors.findOne({
              _id: sessions.vendor
            })
            const eventDetails = {
              message: 'Session Completed Successfully',
              final_output_files: []
            }
            const finalDocuments = await DocumentModel.find({
              sessionid: sessions._id,
              documentCategory: 'final_document_with_dc',
              deleted: {$ne: true}
            });
            console.log('finalDocumentsfinalDocuments', finalDocuments)
            await Promise.all(_.map(finalDocuments, async (finalDocumentDoc) => {
              // const documentUrl = finalDocumentDoc.url
              const pdf = await getObject(finalDocumentDoc.bucketName, finalDocumentDoc.key);
              const pdfBody = pdf.Body as string
              console.log('pdfBody', pdfBody, typeof pdfBody, Buffer.from(pdfBody))
              eventDetails.final_output_files.push({
                name: finalDocumentDoc.name,
                base64Doc: Buffer.from(pdfBody).toString('base64')
              })
            }));
            VendorService.sendVendorUpdates(vendorDoc, sessions, 'session_completed', eventDetails, user)
          }
        } catch (error) {
          console.log('BN Vendor Updates Error', error)
        }
      }
      res.status(200).json({
        success: true,
        paymentDone
      });
    } else {
      res.status(400).json({ error: true });
    }
  } catch (err) {
    const error = err as any;
    console.log('error', error)
    if (error.code) {
      let errorMessage = 'Your card was declined. Reason: ' + error.code
      if (error.decline_code) {
        errorMessage += ' (' + error.decline_code + ')'
      }
      sessions.failMessage = errorMessage
      sessions.paid = false
      sessions.save()
      res.status(200).json({
        success: true,
        paymentDone: 'failure'
      });
    } else {
      utils.handleError(res, error);
    }
  }
};

exports.pdfEditsVideoDocumentSave = async (req, res) => {
  const sessionid = req.params && req.params.id
  const sessions = await NewSessionModel.findOne({ _id: sessionid });
  try {
    req = matchedData(req);
    const filepathStarting = videoSavingDir + '/SESSION_VIDEO_' + sessionid + '*'
    sessions.videoSavingProcessingStage = 'processingnew'
    await sessions.save();
    glob(filepathStarting, {}, async (err, files) => {
      console.log(files)
      if (!files.length) {
        // sessions.videoSavingProcessingStage = 'processing'
        // sessions.videoSavingProcessingError = 'No video files Found. Invalid Session'
        // sessions.videoSavingProcessingStage = 'failed'
        // sessions.videoSavingProcessingError = 'No video files Found. Invalid Session'
        await sessions.save();
        return res.status(200).json({
          errors: {
            msg: 'Processing Session Video'
          }
        })
      }
      saveTheIndividualFailedStreams(sessions, files)
      res.status(200).json({ success: true });
    })
  } catch (error) {
    sessions.videoSavingProcessingStage = 'failed'
    sessions.videoSavingProcessingError = String(error)
    await sessions.save();
    utils.handleError(res, error);
  }
};

exports.pdfEditsVideoDocumentSaveSecondaryServer = async () => {
  const sessionsForVideoProcessing = await NewSessionModel.find({
    videoSavingProcessingStage: 'processing'
  });
  console.log('sessionsForVideoProcessing.length', sessionsForVideoProcessing.length)
  await Promise.all(_.map(sessionsForVideoProcessing, async (sessionDoc) => {
    const sessionid = sessionDoc._id
    const currentSessionDoc = await NewSessionModel.findOne({
      _id: sessionid,
      videoSavingProcessingStage: 'processing'
    })
    console.log('currentSessionDoc found', !_.isEmpty(currentSessionDoc))
    if (!currentSessionDoc) {
      return
    }
    console.log('sessionid', sessionid)
    const allTempVideoRecordingFiles = await DocumentModel.find({
      sessionid,
      documentCategory : 'temp_video_recording_file'
    })
    console.log('allTempVideoRecordingFiles.length', allTempVideoRecordingFiles.length)
    if (!allTempVideoRecordingFiles.length) {
      return
    }
    sessionDoc.videoSavingProcessingStage = 'processing_started'
    console.log('started')
    await sessionDoc.save();
    await Promise.all(_.map(allTempVideoRecordingFiles, async (tempVideoRecordingFile) => {
      const videoObject = await getObject(process.env.AWSBucket, tempVideoRecordingFile.key);
      const videoObjectBody = videoObject.Body as string
      const inputFile = './videotmp/' + tempVideoRecordingFile.name
      await fs.writeFileSync(inputFile, videoObjectBody)
    }))
    console.log('files downloaded')
    try {
      const filepathStarting = './videotmp/SESSION_VIDEO_' + sessionid + '*'
      const filepath = './videotmp/SESSION_VIDEO_OUTPUT_' + sessionid + '.mp4'
      glob(filepathStarting, {}, async (err, files) => {
        console.log(files)

        for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
          if (!files[fileIndex].includes('_OM.')) {
            // this is video recording file with mixing.
            // Suppressing this file from ffmpeg operation since
            // mixing is already been done.
            files.splice(fileIndex, 1);
          }
        }

        console.log('files array after removing non OM type video files...')
        console.log(files)

        if (!files.length) {
          sessionDoc.videoSavingProcessingStage = 'failed'
          sessionDoc.videoSavingProcessingError = 'Processing will take longer'
          await sessionDoc.save();
          return
        }
        try {
          const complexFilter = ['', '']
          for (let fileNumber = 0; fileNumber < files.length; fileNumber += 1) {
            complexFilter[0] += '[v' + String(fileNumber) + ']'
            complexFilter[1] += '[' + String(fileNumber) + ':a]'
          }
          complexFilter[0] += 'hstack=inputs=' + String(files.length) + '[v]'
          complexFilter[1] += 'amix=inputs=' + String(files.length) + '[a]'
          for (let fileNumber = files.length - 1; fileNumber >= 0; fileNumber -= 1) {
            console.log('fileNumber', fileNumber)
            complexFilter.unshift('[' + fileNumber + ':v]scale=1024:576:force_original_aspect_ratio=1[v' + fileNumber + ']')
          }
          // const complexFilter = [
          //   "[0:v][1:v][2:v]hstack=inputs=3[v]",
          //   "[0:a][1:a][2:a]amix=inputs=3[a]"
          // ]
          // const complexFilter = [
          //   '[0:v]scale=1024:576:force_original_aspect_ratio=1[v0]',
          //   '[1:v]scale=1024:576:force_original_aspect_ratio=1[v1]',
          //   '[v0][v1]hstack=inputs=2[v]',
          //   '[0:a][1:a]amix=inputs=2[a]'
          // ]
          console.log(complexFilter)
          files
          .reduce((prev, curr) => prev.input(curr), ffmpeg())
          .complexFilter(complexFilter)
          .outputOptions([
            '-map [v]',
            '-map [a]'
          ])
          .output(filepath)
          .on('error', (er) => {
            console.log(`An eror occurred while merging video files: ${er.message}`);
            sessionDoc.videoSavingProcessingStage = 'failed'
            sessionDoc.videoSavingProcessingError = String(er.message)
            sessionDoc.save();
            return
          })
          .on('end', async () => {
            const fileContent = fs.readFileSync(filepath);
            const fileSize = fs.statSync(filepath)
            const file = await upload(process.env.AWSBucket, 'SESSION_VIDEO_OUTPUT_' + sessionid + '_OM' + '.mp4',
            fileContent, 'video/mp4')
            console.log(file)
            if (file) {
              // Create Document First
              // const url = s3.getSignedUrl('getObject', {
              //     Bucket: process.env.AWSBucket,
              //     Key: file.Key,
              //     Expires: 60 * 60 * 24 * 6
              // });
              // console.log(url)
              const uploadedDocument = new DocumentModel({
                sessionid,
                documentCategory: 'video_recording_file',
                name: 'SESSION_VIDEO_OUTPUT_' + sessionid + '_OM' + '.mp4',
                url: localGetSignedUrl(file.Key),
                type: 'video/mp4',
                size: fileSize.size,
                key: file.Key,
                bucketName: file.Bucket,
                uploadedStage: 'meet_notary_stage'
              });
              const uploadedDocumentDoc = await uploadedDocument.save();

              sessionDoc.videoFileDocumentId = uploadedDocumentDoc._id;
              sessionDoc.videoSavingProcessingStage = 'completed'
              await sessionDoc.save();
              return
            } else {
              sessionDoc.videoSavingProcessingStage = 'failed'
              sessionDoc.videoSavingProcessingError = 'Video Upload failed'
              await sessionDoc.save();
              return
            }
            fs.unlinkSync(filepath);
            _.map(files, (tempfile) => {
              try {
                fs.unlinkSync(tempfile);
              } catch (error) {
                console.log(error)
              }
            })
          }).run()
        } catch (error) {
          console.log('error1', error)
          sessionDoc.videoSavingProcessingStage = 'failed'
          sessionDoc.videoSavingProcessingError = String(error)
          await sessionDoc.save();
          return
        }
      })
    } catch (error) {
      sessionDoc.videoSavingProcessingStage = 'failed'
      sessionDoc.videoSavingProcessingError = String(error)
      await sessionDoc.save();
    }
  }))
};

exports.pdfEditsVideoDocumentSaveSecondaryServerNewLogic = async () => {
  const sessionsForVideoProcessing = await NewSessionModel.find({
    videoSavingProcessingStage: 'processing_new'
  });
  console.log('sessionsForVideoProcessing.length', sessionsForVideoProcessing.length)
  await Promise.all(_.map(sessionsForVideoProcessing, async (sessionDoc) => {
    const sessionid = sessionDoc._id
    const currentSessionDoc = await NewSessionModel.findOne({
      _id: sessionid,
      videoSavingProcessingStage: 'processing_new'
    })
    console.log('currentSessionDoc found', !_.isEmpty(currentSessionDoc))
    if (!currentSessionDoc) {
      return
    }
    console.log('sessionid', sessionid)
    const allTempVideoRecordingFile = await DocumentModel.find({
      sessionid,
      documentCategory : 'temp_video_recording_file',
      $and: [
        {
          name: new RegExp(String(sessionDoc.notaryUserId), 'i')
        },
        {
          name: /^((?!om).)*$/i
        }
      ]
    })
    console.log('allTempVideoRecordingFile', allTempVideoRecordingFile)

    if (!allTempVideoRecordingFile) {
      return
    }
    sessionDoc.videoSavingProcessingStage = 'processing_new_started'
    console.log('started')
    await sessionDoc.save();

    await Promise.all(_.map(allTempVideoRecordingFile, async (tempVideoRecordingFile) => {
      const videoObject = await getObject(process.env.AWSBucket, tempVideoRecordingFile.key);
      const videoObjectBody = videoObject.Body as string
      const inputFile = './videotmp/' + tempVideoRecordingFile.name
      await fs.writeFileSync(inputFile, videoObjectBody)
    }))
    console.log('files downloaded')

    let outputFile = '';
    try {
      const filepathStarting = './videotmp/SESSION_VIDEO_' + sessionid + '*'
      glob(filepathStarting, {}, async (err, files) => {
        console.log(files)

        const filesToMerge = [];
        for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
          if (files[fileIndex].includes('_BNT')) {
            filesToMerge.push({path: files[fileIndex], ts: parseInt(files[fileIndex].substring(files[fileIndex].indexOf('_BNT') + 4, files[fileIndex].indexOf('.webm')), 10)});
          }
        }

        if (filesToMerge.length > 1) {
          filesToMerge.sort((x, y) => {
              return x.ts - y.ts;
          })

          console.log('Files to merge.')
          console.log(filesToMerge)

          const outFile = './videotmp/SESSION_VIDEO_OUTPUT_' + sessionid + '_NR.webm'

          filesToMerge
          .reduce((prev, curr) => prev.input(curr.path), ffmpeg())
          .on('error', (er) => {
            console.log(`An eror occurred while merging video files: ${er.message}`);
          })
          .on('end', async () => {
            console.log('Merge is done!!!')
            outputFile = outFile;
          })
          .mergeToFile(outFile)
        } else if (filesToMerge.length === 1) {
          outputFile = filesToMerge[0].path;
        }

      })
    } catch (error) {
      console.log(error)
    }

    try {
      const filepath = './videotmp/SESSION_VIDEO_OUTPUT_' + sessionid + '.mp4'

      ffmpeg(outputFile)
        .output(filepath)
        .on('error', (er) => {
          console.log(`An eror occurred while merging video files: ${er.message}`);
          return
        })
        .on('end', async () => {
          console.log('Finished processing');
          const fileContent2 = fs.readFileSync(filepath);
          const fileSize2 = fs.statSync(filepath)
          const file = await upload(process.env.AWSBucket, 'SESSION_VIDEO_OUTPUT_' + sessionid + '_NR' + '.mp4',
          fileContent2, 'video/mp4')
          console.log(file)
          const sessionDoc3 = await NewSessionModel.findOne({ _id: sessionid });
          if (file) {
            const uploadedDocument2 = new DocumentModel({
              sessionid,
              documentCategory: 'video_recording_file',
              name: 'SESSION_VIDEO_OUTPUT_' + sessionid + '_NR' + '.mp4',
              url: localGetSignedUrl(file.Key),
              type: 'video/mp4',
              size: fileSize2.size,
              key: file.Key,
              bucketName: file.Bucket,
              uploadedStage: 'meet_notary_stage'
            });
            const uploadedDocumentDoc = await uploadedDocument2.save();

            sessionDoc3.videoFileDocumentId = uploadedDocumentDoc._id;
            sessionDoc3.videoSavingProcessingStage = 'completed'
            await sessionDoc3.save();
            // return
          } else {
            sessionDoc3.videoSavingProcessingStage = 'failed'
            sessionDoc3.videoSavingProcessingError = 'Video Upload failed'
            await sessionDoc3.save();
            // return
          }
        })
        .run();
    } catch (error) {
      console.log('failed')
      const sessionDoc2 = await NewSessionModel.findOne({_id: sessionDoc._id})
      sessionDoc2.videoSavingProcessingStage = 'failed'
      sessionDoc2.videoSavingProcessingError = String(error)
      await sessionDoc2.save();
    }
  }))
};

exports.pdfEditsVideoDocumentSaveSecondaryServerOpenViduLogic = async () => {
  const sessionsForVideoProcessing = await NewSessionModel.find({
    videoSavingProcessingStage: 'processingnew'
  });
  console.log('sessionsForVideoProcessing.length', sessionsForVideoProcessing.length)
  await Promise.all(_.map(sessionsForVideoProcessing, async (sessionDoc) => {
    const sessionid = sessionDoc._id
    const currentSessionDoc = await NewSessionModel.findOne({
      _id: sessionid,
      videoSavingProcessingStage: 'processingnew'
    })
    console.log('currentSessionDoc found', !_.isEmpty(currentSessionDoc))
    if (!currentSessionDoc) {
      return
    }
    console.log('sessionid', sessionid)

    try {
      const filepath = '/opt/openvidu/recordings/session_' + sessionid + '/session_' + sessionid + '.mp4'
      const fileContent2 = fs.readFileSync(filepath);
      const fileSize2 = fs.statSync(filepath)
      const file = await upload(process.env.AWSBucket, 'SESSION_VIDEO_OUTPUT_' + sessionid + '_NR.mp4',
      fileContent2, 'video/mp4')
      console.log(file)
      const sessionDoc3 = await NewSessionModel.findOne({ _id: sessionid });
      if (file) {
        const uploadedDocument2 = new DocumentModel({
          sessionid,
          documentCategory: 'video_recording_file',
          name: 'SESSION_VIDEO_OUTPUT_' + sessionid + '_NR.mp4',
          url: localGetSignedUrl(file.Key),
          type: 'video/mp4',
          size: fileSize2.size,
          key: file.Key,
          bucketName: file.Bucket,
          uploadedStage: 'meet_notary_stage'
        });
        const uploadedDocumentDoc = await uploadedDocument2.save();

        sessionDoc3.videoFileDocumentId = uploadedDocumentDoc._id;
        sessionDoc3.videoSavingProcessingStage = 'completed'
        await sessionDoc3.save();
      } else {
        sessionDoc3.videoSavingProcessingStage = 'failed'
        sessionDoc3.videoSavingProcessingError = 'Video Upload failed'
        await sessionDoc3.save();
        // return
      }

    } catch (error) {
      console.log('failed')
      console.log('error', error)
      const sessionDoc2 = await NewSessionModel.findOne({_id: sessionDoc._id})
      sessionDoc2.videoSavingProcessingStage = 'failed'
      sessionDoc2.videoSavingProcessingError = String(error)
      await sessionDoc2.save();
    }
  }))
};

exports.addWitnessDuringSession = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);
    const sessionid = req.sessionid
    const witnessDetails = req.witnessDetails
    const sessions = await NewSessionModel.findOne({ _id: sessionid });

    let witnessDoc;
    let witnessUser;
    let password = utils.generateRandomPassword(6);
    if (witnessDetails.id) {
      witnessDoc = await WitnessModel.findOne({_id: witnessDetails.id})
      // const password = utils.generateRandomPassword(6);
      if (!witnessDoc) {
        return res.status(400).json({
          errors: {
            msg: 'Witness Doc not found'
          }
        })
      }
      const existingUserDoc = await User.findOne({email: sessionid + '_' + witnessDoc.email, deleted: {$ne: true}})
      if (existingUserDoc) {
        return res.status(400).json({
          errors: {
            msg: 'This Witness already added to the session'
          }
        })
      }
      witnessUser = new User({
        name: witnessDoc.firstName + ' ' + witnessDoc.lastName,
        first_name: witnessDoc.firstName,
        last_name: witnessDoc.lastName,
        email: sessionid + '_' + witnessDoc.email,
        realEmail: witnessDoc.email,
        password,
        verification: uuid.v4(),
        role: 'witness',
        state: '',
        verified: true,
        temporary: true,
        witnessid: witnessDoc._id
      });
      await witnessUser.save();
      const sessionUserLogsData1 = new SessionUserLogs({
        sessionid: new mongoose.Types.ObjectId(sessionid),
        userId: new mongoose.Types.ObjectId(user._id),
        actionType: 'witness_invited_to_session',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      sessionUserLogsData1.save();
    } else if (witnessDetails.witnessSelectionType === 'bn_witness_open_call') {
      sessions.sessionOpenCallForWitness = true
      sessions.sessionOpenCallForWitnessAt = new Date()
      await sessions.save()
      const shortSessionID = (sessionid).toString().substr((sessionid).toString().length - 5).toUpperCase();
      const identityModelData = await IdentityModel.findOne({
        sessionid
      })
      emailer.sendEmailToAllNotariesForWitnessInSession(shortSessionID, sessions, identityModelData)
      const sessionUserLogsData2 = new SessionUserLogs({
        sessionid: new mongoose.Types.ObjectId(sessionid),
        userId: new mongoose.Types.ObjectId(user._id),
        actionType: 'witness_open_call_sent',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      sessionUserLogsData2.save();
    } else {
      console.log(sessionid + '_' + witnessDetails.email)
      const existingUserDoc = await User.findOne({email: sessionid + '_' + witnessDetails.email, deleted: {$ne: true}})
      // if (existingUserDoc) {
      //   return res.status(400).json({
      //     errors: {
      //       msg: 'This Witness already added to the session'
      //     }
      //   })
      // }
      witnessUser = existingUserDoc
      witnessDoc = await WitnessModel.findOne({
        email: witnessDetails.email
      })
      if (!witnessDoc) {
        witnessDoc = new WitnessModel({
          userid: user.id,
          usertype: user.role,
          firstName: witnessDetails.firstName,
          lastName: witnessDetails.lastName,
          email: witnessDetails.email,
          phoneNumber: witnessDetails.phoneNumber,
          witnessDetails
        })
        await witnessDoc.save()
      }
      // password = utils.generateRandomPassword(6);
      // console.log('password ', password);
      // console.log('email ', email);
      // create new customer with email and generated password
      if (existingUserDoc) {
        password = existingUserDoc.password
        witnessUser = existingUserDoc
      } else {
        witnessUser = new User({
          name: witnessDetails.firstName + ' ' + witnessDetails.lastName,
          first_name: witnessDetails.firstName,
          last_name: witnessDetails.lastName,
          email: sessionid + '_' + witnessDetails.email,
          realEmail: witnessDetails.email,
          password,
          verification: uuid.v4(),
          role: 'witness',
          state: '',
          verified: true,
          temporary: true,
          witnessid: witnessDoc._id,
          witnessDetails
        });
        await witnessUser.save();
      }
      const sessionUserLogsData3 = new SessionUserLogs({
        sessionid: new mongoose.Types.ObjectId(sessionid),
        userId: new mongoose.Types.ObjectId(user._id),
        actionType: 'witness_invited_to_session',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      sessionUserLogsData3.save();
    }
    if (witnessDetails.witnessSelectionType !== 'bn_witness_open_call') {
      const sessionWitnessQuery = {
        sessionid,
        witnessid: witnessDoc._id
      }
      let originalSessionWitnessDoc = await SessionWitness.findOne(sessionWitnessQuery)
      if (!originalSessionWitnessDoc) {
        originalSessionWitnessDoc = new SessionWitness({
          sessionid,
          witnessid: witnessDoc._id
        })
        await originalSessionWitnessDoc.save()
      }
      console.log('witnessUser2', witnessUser)
      emailer.sendEmailToWitnessWhenInvitedToSession(witnessUser, password, sessions.meetingdate,
        sessions.meetingTimeZone, sessionid);
    }
    let allSessionWitnessDocs = await SessionWitness.find({
      sessionid,
      deleted: {$ne: true}
    })
    const allWitnessIds = _.map(allSessionWitnessDocs, 'witnessid')
    const allWitnessDocs = await WitnessModel.find({
      _id: {$in: allWitnessIds},
      deleted: {$ne: true}
    })
    const witnessDocsKeyed = _.keyBy(allWitnessDocs, '_id')
    allSessionWitnessDocs = _.map(allSessionWitnessDocs, (localSessionWitnessDoc) => {
      localSessionWitnessDoc = JSON.parse(JSON.stringify(localSessionWitnessDoc))
      localSessionWitnessDoc.witnessDoc = witnessDocsKeyed[String(localSessionWitnessDoc.witnessid)]
      return localSessionWitnessDoc
    })
    res.status(200).json({
      success: true,
      allSessionWitnessDocs
    })
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.getAllWitnessDetails = async (req, res) => {
  try {
    const user = req.user

    const allWitnessDocs = await WitnessModel.find({
      userid: user.id,
      deleted: {$ne: true}
    })
    res.status(200).json({
      allWitnessDocs
    })
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.joinSessionAsWitness = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);
    console.log('req', req)
    const sessionid = req.sessionid
    console.log('sessionid', sessionid)
    const sessions = await NewSessionModel.findOne({ _id: sessionid });
    console.log('sessions', sessions)
    // Use below variable for future witnesses
    const joinedAsBNWitness = true;

    if (joinedAsBNWitness) {

      // const sessionWitnessQuery = {
      //   sessionid,
      //   userid: user._id
      // }
      let sessionWitnessQuery;
      if (user.role === 'witness' && user.witnessid) {
        sessionWitnessQuery = {
          $or: [
            {
              sessionid,
              userid: user._id
            },
            {
              sessionid,
              witnessid: user.witnessid
            }
          ]
        }
      } else {
        sessionWitnessQuery = {
          $or: [
            {
              sessionid,
              userid: user._id
            }
          ]
        }
      }
      const userAlreadyWitnessInCurrentSession = await SessionWitness.findOne(sessionWitnessQuery)
      if (!userAlreadyWitnessInCurrentSession && !sessions.sessionOpenCallForWitness) {
        return res.status(400).json({
          failure: true,
          errors: {
            msg: 'Session already joined by witness'
          }
        })
      }

      sessions.sessionOpenCallForWitness = null
      sessions.sessionOpenCallForWitnessAt = null
      await sessions.save()

      if (!userAlreadyWitnessInCurrentSession) {
        const newSessionWitnessDoc = new SessionWitness({
          sessionid,
          userid: user._id
        })
        await newSessionWitnessDoc.save()
        const sessionUserLogsData1 = new SessionUserLogs({
          sessionid: new mongoose.Types.ObjectId(sessionid),
          userId: new mongoose.Types.ObjectId(user._id),
          actionType: 'witness_open_call_accepted',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        sessionUserLogsData1.save();
      }
    }
    return res.status(200).json({
      success: true
    })
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.getAllSessionWitnesses = async (req, res) => {
  try {
    const sessionid = req.params && req.params.id
    let userAlreadyWitnessInCurrentSession = await SessionWitness.find({sessionid})
    const witnessUserDocs = await User.find({witnessid: {$in: _.map(userAlreadyWitnessInCurrentSession, 'witnessid')},
      deleted: {$ne: true}})
    const witnessDocs = await WitnessModel.find({_id: _.map(userAlreadyWitnessInCurrentSession, 'witnessid')})
    const userDocs = await User.find({_id: _.map(userAlreadyWitnessInCurrentSession, 'userid'), deleted: {$ne: true}})
    const witnessUserDocsMap = {}
    _.map(witnessUserDocs, (witnessUserDoc) => {
      witnessUserDocsMap[witnessUserDoc.witnessid] = witnessUserDoc._id
    })
    const witnessDocMap = {}
    _.map(witnessDocs, (witnessDoc) => {
      witnessDocMap[witnessDoc._id] = witnessDoc
    })
    const userDocMap = {}
    _.map(userDocs, (userDoc) => {
      userDocMap[userDoc._id] = userDoc
    })
    userAlreadyWitnessInCurrentSession = JSON.parse(JSON.stringify(userAlreadyWitnessInCurrentSession))
    userAlreadyWitnessInCurrentSession = _.map(userAlreadyWitnessInCurrentSession, (sessionWitnessDoc) => {
      if (sessionWitnessDoc.witnessid && witnessUserDocsMap[sessionWitnessDoc.witnessid]) {
        sessionWitnessDoc.userid = witnessUserDocsMap[sessionWitnessDoc.witnessid]
      }
      if (sessionWitnessDoc.witnessid && witnessDocMap[String(sessionWitnessDoc.witnessid)]) {
        sessionWitnessDoc.witnessdoc = witnessDocMap[String(sessionWitnessDoc.witnessid)]
      }
      if (sessionWitnessDoc.userid && userDocMap[String(sessionWitnessDoc.userid)]) {
        sessionWitnessDoc.userdoc = userDocMap[String(sessionWitnessDoc.userid)]
      }
      return sessionWitnessDoc
    })
    return res.status(200).json({
      sessionWitnesses: userAlreadyWitnessInCurrentSession
    })
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.removeSessionWitness = async (req, res) => {
  try {
    // const user = req.user
    req = matchedData(req);
    const sessionid = req.sessionid
    const sessionwitnessid = req.sessionwitnessid
    console.log(sessionid, sessionwitnessid)
    const sessionWitnessDoc = await SessionWitness.findOne({
      _id: sessionwitnessid,
      sessionid
    })
    if (!sessionWitnessDoc) {
      return res.status(400).json({
        errors: {
          msg: 'Witness Not Found'
        }
      })
    }
    await SessionWitness.remove({
      _id: sessionwitnessid,
      sessionid
    })
    console.log('sessionWitnessDoc', sessionWitnessDoc)
    return res.status(200).json({
      success: true
    })
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.saveDraftOfCurrentSession = async (req, res) => {
  try {
    // const user = req.user
    req = matchedData(req);
    const sessionid = req.sessionid
    const droppedElementsDocIdWise = req.droppedElementsDocIdWise
    const emptyPagesAddedDocIdWise = req.emptyPagesAddedDocIdWise
    const allDocumentPagesViewports = req.allDocumentPagesViewports
    const finalValueToSave = {}
    _.map(droppedElementsDocIdWise, (droppedElements, documentId) => {
      finalValueToSave[documentId] = _.compact(_.uniqBy(droppedElements, 'elementId'))
    })
    // console.log(sessionid, sessionwitnessid)
    // let draftsDoc = await SessionDraftsModel.findOne({
    //   sessionid
    // })
    // if (!draftsDoc) {
    //   draftsDoc = new SessionDraftsModel({
    //     sessionid,
    //     droppedElementsDocIdWise: finalValueToSave,
    //     emptyPagesAddedDocIdWise
    //   })
    // } else {
    //   draftsDoc.droppedElementsDocIdWise = finalValueToSave
    //   draftsDoc.emptyPagesAddedDocIdWise = emptyPagesAddedDocIdWise
    // }
    const draftsDoc = new SessionDraftsModel({
      sessionid,
      droppedElementsDocIdWise: finalValueToSave,
      emptyPagesAddedDocIdWise,
      allDocumentPagesViewports
    })
    await draftsDoc.save()
    return res.status(200).json({
      success: true
    })
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.doOpenCallForActiveSession = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);
    const sessionid = req.sessionid
    const sessions = await NewSessionModel.findOne({ _id: sessionid });
    console.log('sessions', sessions)
    let finalResponse = {
      success: false,
      openCallSent: false
    }
    if (!sessions.sessionOpenCallForTaking) {
      sessions.notaryUserId = null
      sessions.sessionOpenCallForTaking = true
      sessions.sessionOpenCallForTakingAt = new Date();
      await sessions.save()
      const shortSessionID = (sessionid).toString().substr((sessionid).toString().length - 5).toUpperCase();
      const identityModelData = await IdentityModel.findOne({
        sessionid
      })
      if (sessions?.sessionType === 'loan_signing') {
        await emailer.sendEmailToAllNotariesForLoanSigning(shortSessionID, sessions, identityModelData);
      } else {
        await emailer.sendEmailToAllNotaries(shortSessionID, sessions, identityModelData);
      }
      const sessionUserLogsData = new SessionUserLogs({
        sessionid: new mongoose.Types.ObjectId(sessionid),
        userId: new mongoose.Types.ObjectId(user._id),
        actionType: 'open_call_sent',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      sessionUserLogsData.save();
      finalResponse = {
        success: true,
        openCallSent: true
      }
    }
    return res.status(200).json(finalResponse)
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.modifyNotaryForSession = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);
    const sessionid = req.sessionid
    const notaryUpdateModalType = req.notaryUpdateModalType
    const notaryUpdateModalSelectedNotary = req.notaryUpdateModalSelectedNotary
    const sessions = await NewSessionModel.findOne({ _id: sessionid });
    console.log('sessions', sessions)
    let finalResponse = {
      success: false,
      openCallSent: false,
      message: ''
    }
    if (notaryUpdateModalType === 'open_call') {
      sessions.notaryUserId = null
      sessions.sessionOpenCallForTaking = true
      sessions.sessionOpenCallForTakingAt = new Date();
      await sessions.save()
      const shortSessionID = (sessionid).toString().substr((sessionid).toString().length - 5).toUpperCase();
      const identityModelData = await IdentityModel.findOne({
        sessionid
      })
      if (sessions?.sessionType === 'loan_signing') {
        await emailer.sendEmailToAllNotariesForLoanSigning(shortSessionID, sessions, identityModelData);
      } else {
        await emailer.sendEmailToAllNotaries(shortSessionID, sessions, identityModelData);
      }
      const sessionUserLogsData = new SessionUserLogs({
        sessionid: new mongoose.Types.ObjectId(sessionid),
        userId: new mongoose.Types.ObjectId(user._id),
        actionType: 'open_call_sent',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      sessionUserLogsData.save();
      finalResponse = {
        success: true,
        openCallSent: true,
        message: ''
      }
    }
    if (notaryUpdateModalType === 'choose_notary') {
      const notaryUser = await User.findOne({
        _id: notaryUpdateModalSelectedNotary,
        deleted: {$ne: true}
      })
      if (notaryUser) {
        sessions.notaryUserId = notaryUser._id
        await sessions.save()
        const sessionUserLogsData2 = new SessionUserLogs({
          sessionid: new mongoose.Types.ObjectId(sessionid),
          userId: new mongoose.Types.ObjectId(user._id),
          actionType: 'notary_updated_in_session',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        sessionUserLogsData2.save();
        finalResponse = {
          success: true,
          openCallSent: false,
          message: ''
        }
      } else {
        finalResponse = {
          success: false,
          openCallSent: false,
          message: 'Notary not found'
        }
      }
    }
    return res.status(200).json(finalResponse)
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const user = req.user
    console.log('user:', user)
    req = matchedData(req);
    console.log('req:', req)

    const notaries = await IdentityModel.findOne({ sessionid: req.sessionId, userId: user._id })
    if (!notaries) {
      return res.status(200).json({ message: 'No session available, please check and try again.' });
    }
    let customer;
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    if (!notaries.stripeCustomerID) {
      customer = await stripeToUse.customers.create({
        email: notaries.email,
        source: req.data.id
      });
      notaries.stripeCustomerID = customer.id;
    }
    notaries.stripeBrand = req.data.card.brand;
    notaries.last4 = req.data.card.last4;
    notaries.exp_month = req.data.card.exp_month;
    notaries.exp_year = req.data.card.exp_year;
    await notaries.save();

    const sessionUserLogsData2 = new SessionUserLogs({
      sessionid: new mongoose.Types.ObjectId(req.sessionId),
      userId: new mongoose.Types.ObjectId(user._id),
      actionType: 'payment_info_added',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    sessionUserLogsData2.save();
    console.log('sessionUserLogsData2', sessionUserLogsData2)

  // update session stage
    const session = await NewSessionModel.findOne({_id: req.sessionId});
    console.log(session)
    if (session.currentStage === 'payment_info_stage') {
      if (session.notorizationTiming === 'notarize_later' && !session.notaryUserId) {
        session.status = 'ready to pick'; // Ready to Notary to be picked
      } else {
        session.status = 'ready to sign'; // Ready to meet Notary
      }
      session.currentStage = 'meet_notary_stage';
      session.stagesHistory.push({
        stageName: 'Meet Notary stage',
        stageDate: new Date()
      });
      session.save();
    }

  // update document stage
    const document = await DocumentModel.findOne({sessionid: session._id});
    if (document.uploadedStage === 'payment_info_stage') {
      document.uploadedStage = 'meet_notary_stage';
      document.save();
    }

    res.status(200).json(notaries);
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.createCustomerForInviteSigner = async (req, res) => {
  try {
    const user = req.user
    console.log('user:', user)
    req = matchedData(req);
    console.log('req:', req)
    let customer;
    const notarydm = await NotaryDataModel.findOne({ userId: user._id });
    let customerId = user.stripeCustomerID || notarydm?.subscriptionCustomerId
    if (req.data.stripeCustomerID) {
      customerId = req.data.stripeCustomerID;
    }
    if (req.data.customer) {
      customerId = req.data.customer;
    }
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    let stripeToken = '';
    if (req?.data?.token) {
      stripeToken = req.data.token
    }
    if (!customerId) {
      if (!(String(req.data.id).startsWith('pm_') || String(req.data.id).startsWith('card_'))) {
        customer = await stripeToUse.customers.create({
          email: user.email,
          source: String(req.data.id)
        });
      } else {
        if (stripeToken) {
          customer = await stripeToUse.customers.create({
            email: user.email,
            source: stripeToken
          });
        } else {
          customer = await stripeToUse.customers.create({
            email: user.email
          });
        }
      }
      customerId = customer.id
      // if (notarydm) {
      //   notarydm.subscriptionCustomerId = customerId
      //   await notarydm.save();
      // }
      if (user) {
        const userDoc = await User.findOne({_id: user._id})
        if (userDoc) {
          userDoc.stripeCustomerID = customerId
          await userDoc.save()
        }
      }
    }
    console.log('customerId', customerId)
    if (req.data?.paymentMethod?.id) {
      try {
        const attached = await stripeToUse.paymentMethods.attach(
          req.data?.paymentMethod?.id,
          {
            customer: customerId
          }
        );
        console.log(attached);
      } catch (error2) {
        console.log('error2', error2)
      }
    }
    let stripeBrand = req.data?.card?.brand;
    let last4 = req.data?.card?.last4;
    let exp_month = req.data?.card?.exp_month;
    let exp_year = req.data?.card?.exp_year;
    let card

    if (req.data.paymentMethodSelected) {
      const paymentMethodDoc = await stripeToUse.paymentMethods.retrieve(req.data.paymentMethodSelected);
      console.log('paymentMethodDoc', paymentMethodDoc)
      stripeBrand = paymentMethodDoc?.card?.brand
      last4 = paymentMethodDoc?.card?.last4
      exp_month = paymentMethodDoc?.card?.exp_month
      exp_year = paymentMethodDoc?.card?.exp_year
      card = paymentMethodDoc?.card
    }
    const paymentMethodId = req.data.paymentMethodSelected || req.data?.paymentMethod?.id
    console.log('paymentMethodId', paymentMethodId)
    if (paymentMethodId) {
      const userDoc = await User.findOne({
        _id: user._id
      })
      userDoc.selectedPaymentMethod = paymentMethodId
      await userDoc.save()
    }

    const responseForIdentities = {
      stripeCustomerID: customerId,
      stripeBrand,
      last4,
      exp_month,
      exp_year,
      paymentMethodSelected: req.data.paymentMethodSelected,
      card
    }
    res.status(200).json(responseForIdentities);
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.stripeSessionStatus = async (req, res) => {
  try {
    const user = req.user;
    const notarydm = await NotaryDataModel.findOne({ userId: user._id });
    if (notarydm.upgradeStripeSessionId) {
      let stripeToUse;
      if (user.testingacc) {
        stripeToUse = stripeTest
      } else {
        stripeToUse = stripe
      }
      const session = await stripeToUse.checkout.sessions.retrieve(notarydm.upgradeStripeSessionId);
      console.log('sessionsessionsessionsession', session)
      if (session.payment_status === 'paid') {
        const userModel = await User.findOne({email: user.email, deleted: {$ne: true}});
        userModel.memberType = 'pro';
        userModel.save();
        notarydm.subscriptionExpiresOn = session.expires_at;
        notarydm.save();
      }
      res.status(200).json(session);
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.stripeBuyDCSessionStatus = async (req, res) => {
  try {
    const user = req.user;
    const notarydm = await NotaryDataModel.findOne({ userId: user._id });
    if (notarydm.buyDCStripeSessionId) {
      let stripeToUse;
      if (user.testingacc) {
        stripeToUse = stripeTest
      } else {
        stripeToUse = stripe
      }
      const session = await stripeToUse.checkout.sessions.retrieve(notarydm.buyDCStripeSessionId);
      console.log('sessionsessionsessionsession', session)
      const apiResponse = {
        notaryData: null
      }
      if (session.payment_status === 'paid') {
        const certifiateExpiryDate = moment().add(365, 'days')
        const certificatePassword = (Math.random() + 1).toString(36).substring(2);
        const buyDCLogsDoc = await BuyDCLogs.findOne({
          userId: user._id,
          buyDCStripeSessionId: notarydm.buyDCStripeSessionId
        })
        if (buyDCLogsDoc?.paymentDone) {
          apiResponse.notaryData = notarydm
          return res.status(200).json(apiResponse);
        }
        buyDCLogsDoc.paymentDone = true
        buyDCLogsDoc.updatedAt = new Date()
        buyDCLogsDoc.certificateValidTill = certifiateExpiryDate
        await buyDCLogsDoc.save()
        notarydm.buyDCPurchaseExpiryDate = certifiateExpiryDate
        await notarydm.save();

        // const p12 = require('node-openssl-p12').createClientSSL;
        const clientFileName = `client_dc_${Date.now()}`
        const p12options = {
          clientFileName,
          bitSize: 2048,
          C: 'US', // Country Name (2 letter code)
          ST: user.state || 'Illinois', // State or Province Name (full name)
          L: user.state || 'Chicago', // Locality Name (eg, city)
          O: 'Blue Notary LLC', // Organization Name (eg, company)
          OU: user.state || 'Illinois', // Organizational Unit Name (eg, section)
          CN: user.name, // Common Name (eg, fully qualified host name)
          emailAddress: user.email, // Notary Email
          clientPass: certificatePassword, // DC password
          caFileName: 'ca',
          serial: '01',
          days: 365
        };
        const p12FilePath = path.join( process.cwd(), 'ssl', `${clientFileName}.p12`)
        if (fs.existsSync(p12FilePath)) {
          fs.unlinkSync(p12FilePath)
        }

        // generate p12 for notary
        // await p12(p12options).done((options, sha1fingerprint) => {
        //   console.log('SHA-1 fingerprint:', sha1fingerprint);
        //   console.log('options:', options);
        // }).fail((err) => {
        //   console.log('error', err);
        // });
        const sslValue = DCService.createClientSSL(p12options)
        await waitFor(1000)
        sslValue.done((options, sha1fingerprint) => {
          console.log('SHA-1 fingerprint:', sha1fingerprint);
          console.log('options:', options);
        }).fail((err) => {
          console.log('error', err);
        });

        if (fs.existsSync(p12FilePath)) {
          const p12File = await upload(process.env.AWSBucket,
              `${clientFileName}.p12`,
              fs.readFileSync(p12FilePath),
              'application/x-pkcs12'
          )
          console.log('p12File', p12File)

          // save p12 to notary
          notarydm.buyDCCertfileUrl = localGetSignedUrl(clientFileName + '.p12');
          notarydm.buyDCCertfilename = clientFileName;
          notarydm.buyDCCertfileSource = 'purchased';
          notarydm.buyDCCertfileAddedAt = new Date();
          notarydm.buyDCfileKey = clientFileName + '.p12';
          notarydm.buyDCCertfilePassword = certificatePassword;
          await notarydm.save();
          apiResponse.notaryData = notarydm
          console.log('notarydm', notarydm)
          // remove p12 in ssl
          fs.unlinkSync(p12FilePath)
        } else {
          console.log('error: it could not generate p12')
        }
      }
      return res.status(200).json(apiResponse);
    }
    res.status(200).json({
      notfound: true
    })
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.stripeBuySealCheckoutSession = async (req, res) => {
  try {
    const user = req.user;
    const notaryDataValue = await NotaryDataModel.findOne({ userId: user._id })
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    let priceID
    if (user.testingacc) {
      priceID = process.env.TEST_SEAL_PRICE_ID
    } else {
      priceID = process.env.SEAL_PRICE_ID
    }

    let subscriptionCustomerId = notaryDataValue?.subscriptionCustomerId
    if (!subscriptionCustomerId) {
      const customerDoc = await stripeToUse.customers.create({
        email: notaryDataValue.email
      });
      subscriptionCustomerId = customerDoc.id;
      notaryDataValue.subscriptionCustomerId = subscriptionCustomerId
      await notaryDataValue.save()
    }

    const session = await stripeToUse.checkout.sessions.create({
      line_items: [{
        price: priceID,
        quantity: 1
      }],
      customer: subscriptionCustomerId,
      // customer_email: user.email,
      mode: 'payment',
      success_url: process.env.FRONT_URL + '/notary/buySeal/success',
      cancel_url: process.env.FRONT_URL + '/notary'
    });
    console.log('sessionsession', session)
    notaryDataValue.buySealStripeSessionId = session.id;
    notaryDataValue.save();
    const buySealLogsDoc = new BuySealLogs({
      userId: user._id,
      buySealStripeSessionId: session.id,
      requestedAt: new Date(),
      paymentDone: false
    })
    await buySealLogsDoc.save()
    res.status(200).json(session);
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.stripeBuySealSessionStatus = async (req, res) => {
  try {
    const user = req.user;
    const notarydm = await NotaryDataModel.findOne({ userId: user._id });
    if (notarydm.buySealStripeSessionId) {
      let stripeToUse;
      if (user.testingacc) {
        stripeToUse = stripeTest
      } else {
        stripeToUse = stripe
      }
      const session = await stripeToUse.checkout.sessions.retrieve(notarydm.buySealStripeSessionId);
      console.log('sessionsessionsessionsession', session)
      const apiResponse = {
        notaryData: null
      }
      if (session.payment_status === 'paid') {
        const certifiateExpiryDate = moment().add(100, 'years')
        const buySealLogsDoc = await BuySealLogs.findOne({
          userId: user._id,
          buySealStripeSessionId: notarydm.buySealStripeSessionId
        })
        if (buySealLogsDoc?.paymentDone) {
          apiResponse.notaryData = notarydm
          return res.status(200).json(apiResponse);
        }
        buySealLogsDoc.paymentDone = true
        buySealLogsDoc.updatedAt = new Date()
        buySealLogsDoc.certificateValidTill = certifiateExpiryDate
        await buySealLogsDoc.save()
        notarydm.buySealActionDate = new Date()
        notarydm.buySealPurchaseExpiryDate = certifiateExpiryDate
        await notarydm.save();
        await CustomService.generateNotarySealsPNGForRemainingNotaries(user._id)
        const notarydm2 = await NotaryDataModel.findOne({ userId: user._id });
        apiResponse.notaryData = notarydm2
      }
      return res.status(200).json(apiResponse);
    }
    res.status(200).json({
      notfound: true
    })
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.stripeBuyComboCheckoutSession = async (req, res) => {
  try {
    const user = req.user;
    const notaryDataValue = await NotaryDataModel.findOne({ userId: user._id })
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    let priceID
    if (user.testingacc) {
      priceID = process.env.TEST_DC_SEAL_COMBO_PRICE_ID
    } else {
      priceID = process.env.DC_SEAL_COMBO_PRICE_ID
    }

    let subscriptionCustomerId = notaryDataValue?.subscriptionCustomerId
    if (!subscriptionCustomerId) {
      const customerDoc = await stripeToUse.customers.create({
        email: notaryDataValue.email
      });
      subscriptionCustomerId = customerDoc.id;
      notaryDataValue.subscriptionCustomerId = subscriptionCustomerId
      await notaryDataValue.save()
    }

    const session = await stripeToUse.checkout.sessions.create({
      line_items: [{
        price: priceID,
        quantity: 1
      }],
      customer: subscriptionCustomerId,
      // customer_email: user.email,
      mode: 'payment',
      success_url: process.env.FRONT_URL + '/notary/buyCombo/success',
      cancel_url: process.env.FRONT_URL + '/notary'
    });
    console.log('sessionsession', session)
    notaryDataValue.buyComboStripeSessionId = session.id;
    notaryDataValue.save();
    const buyComboLogsDoc = new BuyComboLogs({
      userId: user._id,
      buyComboStripeSessionId: session.id,
      requestedAt: new Date(),
      paymentDone: false
    })
    await buyComboLogsDoc.save()
    res.status(200).json(session);
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.stripeBuyComboSessionStatus = async (req, res) => {
  try {
    const user = req.user;
    const notarydm = await NotaryDataModel.findOne({ userId: user._id });
    if (notarydm.buyComboStripeSessionId) {
      let stripeToUse;
      if (user.testingacc) {
        stripeToUse = stripeTest
      } else {
        stripeToUse = stripe
      }
      const session = await stripeToUse.checkout.sessions.retrieve(notarydm.buyComboStripeSessionId);
      console.log('sessionsessionsessionsession', session)
      const apiResponse = {
        notaryData: null
      }
      if (session.payment_status === 'paid') {
        const certifiateExpiryDate = moment().add(100, 'years')
        const buyComboLogsDoc = await BuyComboLogs.findOne({
          userId: user._id,
          buyComboStripeSessionId: notarydm.buyComboStripeSessionId
        })
        if (buyComboLogsDoc?.paymentDone) {
          apiResponse.notaryData = notarydm
          return res.status(200).json(apiResponse);
        }
        buyComboLogsDoc.paymentDone = true
        buyComboLogsDoc.updatedAt = new Date()
        buyComboLogsDoc.certificateValidTill = certifiateExpiryDate
        await buyComboLogsDoc.save()
        notarydm.buyComboActionDate = new Date()
        notarydm.buyComboPurchaseExpiryDate = certifiateExpiryDate
        await notarydm.save();

        const certificatePassword = (Math.random() + 1).toString(36).substring(2);
        // const p12 = require('node-openssl-p12').createClientSSL;
        const clientFileName = `client_dc_${Date.now()}`
        const p12options = {
          clientFileName,
          bitSize: 2048,
          C: 'US', // Country Name (2 letter code)
          ST: user.state || 'Illinois', // State or Province Name (full name)
          L: user.state || 'Chicago', // Locality Name (eg, city)
          O: 'Blue Notary LLC', // Organization Name (eg, company)
          OU: user.state || 'Illinois', // Organizational Unit Name (eg, section)
          CN: user.name, // Common Name (eg, fully qualified host name)
          emailAddress: user.email, // Notary Email
          clientPass: certificatePassword, // DC password
          caFileName: 'ca',
          serial: '01',
          days: 1095
        };
        const p12FilePath = path.join( process.cwd(), 'ssl', `${clientFileName}.p12`)
        if (fs.existsSync(p12FilePath)) {
          fs.unlinkSync(p12FilePath)
        }

        // generate p12 for notary
        // await p12(p12options).done((options, sha1fingerprint) => {
        //   console.log('SHA-1 fingerprint:', sha1fingerprint);
        //   console.log('options:', options);
        // }).fail((err) => {
        //   console.log('error', err);
        // });
        const sslValue = DCService.createClientSSL(p12options)
        await waitFor(1000)
        sslValue.done((options, sha1fingerprint) => {
          console.log('SHA-1 fingerprint:', sha1fingerprint);
          console.log('options:', options);
        }).fail((err) => {
          console.log('error', err);
        });

        if (fs.existsSync(p12FilePath)) {
          const p12File = await upload(process.env.AWSBucket,
              `${clientFileName}.p12`,
              fs.readFileSync(p12FilePath),
              'application/x-pkcs12'
          )
          console.log('p12File', p12File)

          // save p12 to notary
          notarydm.buyDCCertfileUrl = localGetSignedUrl(clientFileName + '.p12');
          notarydm.buyDCCertfilename = clientFileName;
          notarydm.buyDCCertfileSource = 'purchased';
          notarydm.buyDCCertfileAddedAt = new Date();
          notarydm.buyDCfileKey = clientFileName + '.p12';
          notarydm.buyDCCertfilePassword = certificatePassword;
          await notarydm.save();
          await CustomService.generateNotarySealsPNGForRemainingNotaries(user._id)
          const notarydm2 = await NotaryDataModel.findOne({ userId: user._id });
          apiResponse.notaryData = notarydm2
          console.log('notarydm2', notarydm2)
          // remove p12 in ssl
          fs.unlinkSync(p12FilePath)
        } else {
          console.log('error: it could not generate p12')
        }
      }
      return res.status(200).json(apiResponse);
    }
    res.status(200).json({
      notfound: true
    })
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.saveNotaryCustomCharges = async (req, res) => {
  try {
    const user = req.user;
    const userModel = await User.findOne({email: user.email, deleted: {$ne: true}});
    console.log(req.body)
    if (req.body && req.body.notaryCustomCharges) {
      userModel.notaryCustomCharges = req.body.notaryCustomCharges
      userModel.save();
    }
    res.status(200).json({
      success: true
    });
  } catch (error) {
    console.log('error', error)
    utils.handleError(res, error);
  }
};
exports.stripeCheckoutSession = async (req, res) => {
  try {
    const user = req.user;
    const notaryDataValue = await NotaryDataModel.findOne({ userId: user._id })
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    let priceID
    if (user.testingacc) {
      priceID = process.env.TEST_NOTARY_SUBSCRIPTION_PRICE_ID
    } else {
      priceID = process.env.NOTARY_SUBSCRIPTION_PRICE_ID
    }

    if (user.vendor) {
      const vendorDoc = await Vendors.findOne({
        _id: user.vendor,
        deleted: {$ne: true}
      })
      if (vendorDoc?.proSubscriptionSettings?.NOTARY_SUBSCRIPTION_PRICE_ID) {
        priceID = vendorDoc?.proSubscriptionSettings?.NOTARY_SUBSCRIPTION_PRICE_ID
      }
    }

    let subscriptionCustomerId = notaryDataValue?.subscriptionCustomerId
    if (!subscriptionCustomerId) {
      const customerDoc = await stripeToUse.customers.create({
        email: notaryDataValue.email
      });
      subscriptionCustomerId = customerDoc.id;
      notaryDataValue.subscriptionCustomerId = subscriptionCustomerId
      await notaryDataValue.save()
    }

    const session = await stripeToUse.checkout.sessions.create({
      line_items: [{
        price: priceID,
        quantity: 1
      }],
      customer: subscriptionCustomerId,
      // customer_email: user.email,
      mode: 'subscription',
      success_url: process.env.FRONT_URL + '/notary/upgrade/success',
      cancel_url: process.env.FRONT_URL + '/notary'
    });
    console.log('sessionsession', session)
    notaryDataValue.upgradeStripeSessionId = session.id;
    notaryDataValue.save();
    res.status(200).json(session);
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.stripeBuyDCCheckoutSession = async (req, res) => {
  try {
    const user = req.user;
    const notaryDataValue = await NotaryDataModel.findOne({ userId: user._id })
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    let priceID
    if (user.testingacc) {
      priceID = process.env.TEST_DC_PRICE_ID
    } else {
      priceID = process.env.DC_PRICE_ID
    }

    let subscriptionCustomerId = notaryDataValue?.subscriptionCustomerId
    if (!subscriptionCustomerId) {
      const customerDoc = await stripeToUse.customers.create({
        email: notaryDataValue.email
      });
      subscriptionCustomerId = customerDoc.id;
      notaryDataValue.subscriptionCustomerId = subscriptionCustomerId
      await notaryDataValue.save()
    }

    const session = await stripeToUse.checkout.sessions.create({
      line_items: [{
        price: priceID,
        quantity: 1
      }],
      customer: subscriptionCustomerId,
      // customer_email: user.email,
      mode: 'payment',
      success_url: process.env.FRONT_URL + '/notary/buyDC/success',
      cancel_url: process.env.FRONT_URL + '/notary'
    });
    console.log('sessionsession', session)
    notaryDataValue.buyDCStripeSessionId = session.id;
    notaryDataValue.buyDCActionDate = new Date()
    notaryDataValue.save();
    const buyDCLogsDoc = new BuyDCLogs({
      userId: user._id,
      buyDCStripeSessionId: session.id,
      requestedAt: new Date(),
      paymentDone: false
    })
    await buyDCLogsDoc.save()
    res.status(200).json(session);
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.stripeSubscriptionUpdateWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    console.log('sigsig', sig)
    console.log('req.body', req.body)

    const reqBody = req.body
    const customerId = reqBody?.data?.object?.customer
    const stripeWebhookEventDoc = new StripeWebhookEvents({
      stripeCustomerId: customerId,
      fullRequest: reqBody,
      fullRequestType: reqBody.type
    })
    await stripeWebhookEventDoc.save()
    console.log('customerId', customerId)
    // Handle the event
    switch (reqBody.type) {
      case 'customer.subscription.updated':
        const invoice = reqBody?.data?.object;
        const currentPeriodEnd = invoice?.current_period_start
        const priceId = invoice?.items?.data?.[0]?.price?.id
        let planName = 'pro'
        if (process.env.BUSINESS_SUBSCRIPTION_PREMIUM_ID === priceId ||
            process.env.TEST_BUSINESS_SUBSCRIPTION_PREMIUM_ID === priceId) {
          planName = 'business_hybrid'
        } else if (process.env.BUSINESS_SUBSCRIPTION_PRO_ID === priceId ||
            process.env.TEST_BUSINESS_SUBSCRIPTION_PRO_ID === priceId) {
          planName = 'business_pro'
        } else if (process.env.BUSINESS_SUBSCRIPTION_BASIC_ID === priceId ||
            process.env.TEST_BUSINESS_SUBSCRIPTION_BASIC_ID === priceId) {
          planName = 'business_basic'
        }
        console.log('invoiceinvoiceinvoice', invoice)
        console.log('priceIdpriceIdpriceId', priceId)
        console.log('planNameplanNameplanName', planName)
        console.log('currentPeriodEndcurrentPeriodEndcurrentPeriodEnd', currentPeriodEnd)

        let notaryDataDoc = await NotaryDataModel.findOne({
          subscriptionCustomerId: customerId
        })
        if (!notaryDataDoc) {
          try {
            let customer
            try {
              customer = await stripe.customers.retrieve(customerId);
              if (!customer) {
                customer = await stripeTest.customers.retrieve(customerId);
              }
            } catch (error2) {
              try {
                customer = await stripeTest.customers.retrieve(customerId);
              } catch (error3) {
                console.log('error3', error3)
              }
            }
            console.log('customercustomer', customer)
            if (customer) {
              const customerEmail = customer?.email
              const customerUserDoc = await User.findOne({
                email: customerEmail,
                deleted: {$ne: true}
              })
              if (customerUserDoc) {
                notaryDataDoc = await NotaryDataModel.findOne({
                  userId: customerUserDoc._id
                })
              }
            }
          } catch (error) {
            console.log('stripe error', error)
          }
        }
        if (notaryDataDoc) {
          const userDoc = await User.findOne({
            _id: notaryDataDoc.userId, deleted: {$ne: true}
          })
          if (currentPeriodEnd) {
            notaryDataDoc.subscriptionExpiresOn = currentPeriodEnd
          }
          await notaryDataDoc.save()
          userDoc.memberType = planName
          await userDoc.save()
          stripeWebhookEventDoc.priceId = priceId
          stripeWebhookEventDoc.planName = planName
          stripeWebhookEventDoc.userId = userDoc._id
          await stripeWebhookEventDoc.save()
        }
        // Then define and call a function to handle the event customer.subscription.updated
        break;
      case 'customer.subscription.created':
        break;
      case 'customer.subscription.deleted':
        let notaryDataDoc2 = await NotaryDataModel.findOne({
          subscriptionCustomerId: customerId
        })
        console.log('notaryDataDoc2notaryDataDoc2notaryDataDoc2', notaryDataDoc2)
        if (!notaryDataDoc2) {
          try {
            let customer
            try {
              customer = await stripe.customers.retrieve(customerId);
              if (!customer) {
                customer = await stripeTest.customers.retrieve(customerId);
              }
            } catch (error2) {
              try {
                customer = await stripeTest.customers.retrieve(customerId);
              } catch (error3) {
                console.log('error3', error3)
              }
            }
            console.log('customercustomer', customer)
            if (customer) {
              const customerEmail = customer?.email
              const customerUserDoc = await User.findOne({
                email: customerEmail,
                deleted: {$ne: true}
              })
              if (customerUserDoc) {
                notaryDataDoc2 = await NotaryDataModel.findOne({
                  userId: customerUserDoc._id
                })
              }
            }
          } catch (error) {
            console.log('stripe error', error)
          }
        }
        if (notaryDataDoc2) {
          const userDoc = await User.findOne({
            _id: notaryDataDoc2.userId, deleted: {$ne: true}
          })
          userDoc.memberType = 'free'
          await userDoc.save()
          stripeWebhookEventDoc.planName = 'free'
          stripeWebhookEventDoc.userId = userDoc._id
          await stripeWebhookEventDoc.save()
        }
        break;
      default:
        console.log(`Unhandled event type ${reqBody.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
  } catch (error) {
    console.log(error)
    utils.handleError(res, error);
  }
};

exports.repaymentForSession = async (req, res) => {
  const user = req.user
  console.log('user:', user)
  req = matchedData(req);
  console.log('req:', req)
  const sessions = await NewSessionModel.findOne({ _id: req.sessionId });
  try {
    console.log({
      sessionid: String(req.sessionId), userId: user._id
    })
    const notaries = await IdentityModel.findOne({ sessionid: String(req.sessionId)})
    if (!notaries) {
      return res.status(200).json({ message: 'No session available, please check and try again.' });
    }
    let customer;
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    console.log('notaries.stripeCustomerID', notaries.stripeCustomerID)
    customer = await stripeToUse.customers.create({
      email: notaries.email,
      source: req.data.id
    });
    notaries.stripeBrand = req.data.card.brand;
    notaries.last4 = req.data.card.last4;
    notaries.exp_month = req.data.card.exp_month;
    notaries.exp_year = req.data.card.exp_year;
    await notaries.save();
    const customerIdToUse = customer.id;
    const paymentDone = await processChargesForSession(sessions, notaries, user, true, customerIdToUse)
    console.log(paymentDone)
    if (paymentDone) {
      sessions.paid = true
      await sessions.save()
    }
    res.status(200).json({
      paymentDone
    });
  } catch (err) {
    console.log('err', err)
    const error = err as any;
    let errorMessage = 'Your card was declined. Reason: ' + error.code
    if (error.decline_code) {
      errorMessage += ' (' + error.decline_code + ')'
    }
    sessions.failMessage = errorMessage
    sessions.save()
    res.status(402).json({
      errors: {
        msg: errorMessage
      }
    });
    // utils.handleError(res, error);
  }
};

exports.saveSignatures = async (req, res) => {
  const user = req.user
  req = matchedData(req);
  const signaturedata = req.signaturedata;
  const newSignature = new SignaturesDataModel({
    signaturedata,
    user: user._id
  })
  await newSignature.save()
  res.status(200).json({ message: 'Your signature saved successfully.' });
}

exports.getSignatures = async (req, res) => {
  const user = req.user
  req = matchedData(req);
  const signatures = await SignaturesDataModel.find({
    user: user._id,
    deleted: {$ne: true}
  }).sort({createdAt: -1})
  res.status(200).json({ signatures });
}

exports.deleteSignature = async (req, res) => {
  const user = req.user
  req = matchedData(req);
  const signatureId = req.signatureId
  console.log(user)
  console.log(signatureId)
  const signatureDoc = await SignaturesDataModel.findOne({
    _id: signatureId,
    user: user._id,
    deleted: {$ne: true}
  })
  if (!signatureDoc) {
    return res.status(200).json({
      errors: {
        msg: 'Signature Doc Not Found'
      }
    });
  }
  signatureDoc.deleted = true
  signatureDoc.deletedAt = new Date()
  await signatureDoc.save();
  res.status(200).json({
    success: true
  });
}

exports.saveSignatureImageFile = async (req, res) => {
  const user = req.user;
  const file = req.file;
  console.log('file', file)
  req = matchedData(req);
  const fileLocation = localGetSignedUrl(file.key);
  const backPhotoIdUrl = fileLocation.replace(/^https:\/\//i, 'http://');
  http.get(backPhotoIdUrl, (resp) => {
    resp.setEncoding('base64');
    let fileData = 'data:image/png;base64,';
    resp.on('data', (data) => {
      fileData += data;
    });
    resp.on('end', async () => {
      const newSignature = new SignaturesDataModel({
        signaureFileName: file.originalname,
        signaureFileUrl: localGetSignedUrl(file.key),
        signaureFileType: file.mimetype,
        signaureFileSize: file.size,
        signaureFileKey: file.key,
        signaureFileBucket: file.bucket,
        signaturedata: fileData,
        user: user._id
      })
      await newSignature.save()
      res.status(200).json({ message: 'Signature uploaded successfully.', file: localGetSignedUrl(file.key),
        signatureDoc: newSignature });
    });
  }).on('error', (e) => {
    res.status(400).json({
      error: e.message
    })
  });
},

exports.saveProfile = async (req, res) => {
  const user = req.user;
  const file = req.file;
  const body = req.body;
  const data = req.data;
  console.log('user', user)
  console.log('file', file)
  console.log('body', body)
  console.log('data', data)
  let profileData = body?.data || {}
  const userDoc = await User.findOne({
    _id: user._id
  })
  if (userDoc) {
    try {
      if (_.isString(profileData)) {
        profileData = JSON.parse(profileData)
      }
    } catch (error) {
      console.log(error)
    }
    console.log('body?.deleteProfileImageData', body?.deleteProfileImageData)
    if (body?.deleteProfileImageData) {
      userDoc.avatarKey = ''
      userDoc.avatarName = ''
      userDoc.avatarUrl = ''
      userDoc.avatarUploadedAt = ''
    }
    userDoc.disableProfile = body?.disableProfile || false
    userDoc.profile = profileData
    if (file) {
      userDoc.avatarKey = file.key
      userDoc.avatarName = file.originalname
      userDoc.avatarUrl = localGetSignedUrl(file.key)
      userDoc.avatarUploadedAt = new Date()
    }
    if (profileData.bio) {
      userDoc.profileFilled = true
    } else {
      userDoc.profileFilled = false
    }
    console.log('userDoc.profile', userDoc)
    await userDoc.save()
    ProfileService.generateProfileHtmlAndPublish(userDoc)
  }
  res.status(200).json({
    success: true,
    userDoc
  });
},

// Notary - invite signer
exports.notaryInviteSigner = async (req, res) => {
  try {
    const files = req.files;
    console.log('uploadFile 2:', files)
    // console.log('uploadFile 2:', req.files)
    // console.log('uploadFile 2:', req.file)
    const user = req.user
    req = matchedData(req);
    const email = req.email;
    const name = req.name;
    const notaryId = req.notary_user_id;
    const meetingDate = req.meetingdate;
    const meetingTimeZone = req.meetingTimeZone;
    const currentTimeZone = req.currentTimeZone;
    const sessionType = req.sessionType;
    const templateId = req.template;
    const invitedByCustomer = req.invitedByCustomer;
    const selectedNotary = req.selectedNotary;
    const typeOfKBA = req.typeOfKBA;
    const forceTypeOfKBA = req.forceTypeOfKBA;
    const loanSessionType = req.loanSessionType;
    const otherLoanSessionType = req.otherLoanSessionType;
    const loanNumber = req.loanNumber;
    let pointOfContacts = req.pointOfContacts;
    const loan_signing_addressLine1 = req.loan_signing_addressLine1;
    const loan_signing_addressLine2 = req.loan_signing_addressLine2;
    const loan_signing_userState = req.loan_signing_userState;
    const loan_signing_userZipCode = req.loan_signing_userZipCode;
    const loan_signing_state_specific_notary = req.loan_signing_state_specific_notary;
    const loan_signing_notes_for_notary = req.loan_signing_notes_for_notary;
    const sessionChargeOnBusinessUser = req.sessionChargeOnBusinessUser || false;
    const skipSessionCharges = user.skipSessionCharges || false;
    const typeOfNotaryForSession = req.typeOfNotaryForSession || false;
    const requestForStateSpecificNotary = req.requestForStateSpecificNotary || false;
    const requestForStateSpecificNotaryStateName = req.requestForStateSpecificNotaryStateName || false;
    const performInSessionKBA = req.performInSessionKBA || false;
    let sessionCreatedByBusinessUser = false;
    if (user.role === 'customer') {
      sessionCreatedByBusinessUser = true
    }
    let skipCustomerKBACheck = req.skipCustomerKBACheck || false;
    const stripeIdentityDetails = req.stripeIdentityDetails;
    let multiSignerList = req.multiSignerList;
    if (multiSignerList) {
      try {
        multiSignerList = JSON.parse(multiSignerList)
      } catch (error) {
        console.log(error)
      }
    }
    // pointOfContacts
    if (pointOfContacts) {
      try {
        pointOfContacts = JSON.parse(pointOfContacts)
      } catch (error) {
        console.log(error)
      }
    }
    console.log('name:', name);
    console.log('email:', email);
    console.log('notaryId:', notaryId);
    console.log('meetingDate:', meetingDate);
    console.log('meetingTimeZone:', meetingTimeZone);
    console.log('template:', templateId);
    console.log('multiSignerList:', multiSignerList);
    console.log('sessionType:', sessionType);
    console.log('sessionChargeOnBusinessUser:', sessionChargeOnBusinessUser);
    console.log('skipCustomerKBACheck:', skipCustomerKBACheck);
    console.log('typeOfNotaryForSession:', typeOfNotaryForSession);
    console.log('stripeIdentityDetails:', stripeIdentityDetails);
    console.log('sessionCreatedByBusinessUser:', sessionCreatedByBusinessUser);
    console.log('skipSessionCharges:', skipSessionCharges);
    console.log('typeOfKBA:', typeOfKBA);
    console.log('forceTypeOfKBA:', forceTypeOfKBA);
    console.log('loanSessionType:', loanSessionType);
    console.log('otherLoanSessionType:', otherLoanSessionType);
    console.log('loanNumber:', loanNumber);
    console.log('pointOfContacts:', pointOfContacts);
    console.log('loan_signing_addressLine1:', loan_signing_addressLine1);
    console.log('loan_signing_addressLine2:', loan_signing_addressLine2);
    console.log('loan_signing_userState:', loan_signing_userState);
    console.log('loan_signing_userZipCode:', loan_signing_userZipCode);
    console.log('loan_signing_state_specific_notary:', loan_signing_state_specific_notary);
    console.log('loan_signing_notes_for_notary:', loan_signing_notes_for_notary);
    console.log('requestForStateSpecificNotary:', requestForStateSpecificNotary);
    console.log('requestForStateSpecificNotaryStateName:', requestForStateSpecificNotaryStateName);
    console.log('performInSessionKBA:', performInSessionKBA);
    if (skipCustomerKBACheck && skipCustomerKBACheck !== 'false') {
      skipCustomerKBACheck = true;
    }
    // check if email exists
    let customer = await User.findOne({email, deleted: {$ne: true}});
    // check if email is registered with Notary (Role)
    let FindNotaryByEmail = await User.find({"email": email,"role":"notary"});
    console.log('Here');
    console.log(FindNotaryByEmail);
    if(FindNotaryByEmail.length > 0){
      res.status(400).json({
        error: email+' email is registered as notary with bluenotary. Please use a new email id.'
      });
    }
    const notaryuser = await User.findOne({ _id: notaryId, deleted: {$ne: true} });
    let password = '';
    let dontSendTempPassword = true;
    if (!customer) {
      // generate random password
      password = utils.generateRandomPassword(6);
      dontSendTempPassword = false;
      console.log('password ', password);
      console.log('email ', email);
      // create new customer with email and generated password
      customer = new User({
        name,
        email,
        password,
        verification: uuid.v4(),
        role: 'customer',
        commissionNumber: '',
        state: '',
        verified: true,
        testingacc: user.testingacc || false,
        vendor: user.vendoradmin || null
      });
      await customer.save();
    } else {
      if (customer.name === '') {
        customer.name = name;
        await customer.save();
      }
      password = customer.password
    }
    let meetingDateTimeObj;
    meetingDateTimeObj = moment(meetingDate, 'YYYY-MM-DD hh:mm A');
    if (meetingTimeZone) {
      let currentTimeZoneOffset = parseFloat(String((new Date()).getTimezoneOffset() / 60))
      if (currentTimeZone) {
        currentTimeZoneOffset = parseFloat(String(currentTimeZone))
      }
      const currentMeetingTimeZone = parseFloat(meetingTimeZone)
      const finalOffset = (currentMeetingTimeZone - currentTimeZoneOffset) * 60
      console.log('finalOffset', finalOffset, currentMeetingTimeZone, currentTimeZoneOffset, moment.utc(meetingDate, 'YYYY-MM-DD hh:mm A'))
      meetingDateTimeObj = moment(meetingDate, 'YYYY-MM-DD hh:mm A').utcOffset(finalOffset, true)
      // meetingDateTimeObj = moment.utc(meetingDate, 'YYYY-MM-DD hh:mm A').utcOffset(currentMeetingTimeZone, true)
    } else {
      meetingDateTimeObj = moment(meetingDate, 'YYYY-MM-DD hh:mm A')
    }
    const sessionDoc = {
      sessionid: uuidV4(),
      userId: customer._id,
      notaryUserId: notaryId,
      currentStage: 'initial_stage',
      // sessionCode: (Math.random() + 1).toString(36).substring(7).toUpperCase(),
      status: 'unsigned',
      // finalDocumentId: '',
      // finalDocumentWithPdf: "",
      // x509Certificate: '',sending i just creage,
      meetingdate: meetingDate,
      meetingdatetimeobj: meetingDateTimeObj,
      meetingTimeZone,
      stagesHistory: [{
          stageName: 'Notary Invite Signer Session Created',
          stageDate: new Date()
      }],
      multiSignerList: null,
      sessionType,
      invitedByCustomer: null,
      selectedNotary: null,
      loanSigningExtraFields: null,
      sessionChargeOnBusinessUser: sessionChargeOnBusinessUser || skipSessionCharges,
      sessionCreatedByBusinessUser,
      skipSessionCharges,
      skipCustomerKBACheck,
      requestForStateSpecificNotary,
      requestForStateSpecificNotaryStateName,
      performInSessionKBA,
      invitedSession: true,
      testingAccSession: user.testingacc ? true : false,
      loanSessionType: null,
      otherLoanSessionType: null,
      loanNumber: null,
      pointOfContacts: null,
      vendor: null,
      typeOfKBA: null,
      forceTypeOfKBA: null
    }
    if (user.vendoradmin) {
      sessionDoc.vendor = user.vendoradmin
    }
    if (multiSignerList && _.isArray(multiSignerList) && multiSignerList.length) {
      sessionDoc.multiSignerList = multiSignerList
    }
    if (invitedByCustomer) {
      sessionDoc.invitedByCustomer = user._id
    }
    if (selectedNotary) {
      sessionDoc.notaryUserId = selectedNotary
    } else if (user.role === 'customer') {
      sessionDoc.notaryUserId = null
    }
    if (sessionType === 'loan_signing') {
      sessionDoc.loanSessionType = loanSessionType
      sessionDoc.otherLoanSessionType = otherLoanSessionType
      sessionDoc.loanNumber = loanNumber
      sessionDoc.loanSigningExtraFields = {
        loan_signing_addressLine1,
        loan_signing_addressLine2,
        loan_signing_userState,
        loan_signing_userZipCode,
        loan_signing_state_specific_notary,
        loan_signing_notes_for_notary
      }
      if (pointOfContacts) {
        sessionDoc.pointOfContacts = pointOfContacts
      }
    }
    if (typeOfKBA) {
      sessionDoc.typeOfKBA = typeOfKBA
    }
    if (forceTypeOfKBA) {
      sessionDoc.forceTypeOfKBA = forceTypeOfKBA
    }
    // create new session
    const session =  new NewSessionModel(sessionDoc);
    await session.save();
    const sessionUserLogsData2 = new SessionUserLogs({
      sessionid: new mongoose.Types.ObjectId(session._id),
      userId: new mongoose.Types.ObjectId(notaryId),
      actionType: 'notary_invited',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    sessionUserLogsData2.save();
    if (skipCustomerKBACheck) {
      const sessionUserLogsData3 = new SessionUserLogs({
        sessionid: new mongoose.Types.ObjectId(session._id),
        userId: new mongoose.Types.ObjectId(notaryId),
        actionType: 'skip_kba_consent_for_customer',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      sessionUserLogsData3.save();
    }
    let paymentMethodSelected = false
    if (sessionChargeOnBusinessUser && !skipSessionCharges) {
      console.log('stripeIdentityDetails', stripeIdentityDetails, JSON.parse(stripeIdentityDetails))
      const stripeDetails = JSON.parse(stripeIdentityDetails)
      const newIdentityModel = new IdentityModel({
        sessionid: session._id,
        userId: customer._id,
        email: customer.email,
        stripeCustomerID: stripeDetails.stripeCustomerID,
        stripeBrand: stripeDetails.brand,
        last4: stripeDetails.last4,
        exp_month: stripeDetails.exp_month,
        exp_year: stripeDetails.exp_year,
        cardObject: stripeDetails.card,
        paymentMethodSelected: stripeDetails.paymentMethodSelected
      });
      paymentMethodSelected = stripeDetails.paymentMethodSelected
      await newIdentityModel.save();
    }
    if (templateId && templateId !== 'null') {
      const template = await DocumentTemplate.findOne({ _id: templateId });
      const uploadedDocument = new DocumentModel({
        sessionid: session._id,
        documentCategory: 'initial_document',
        name: template.key,
        url: template.documentUrl,
        type: 'application/pdf',
        key: template.key,
        bucketName: process.env.AWSBucket,
        uploadedBy: notaryId,
        uploadedStage: 'initial_stage'
      });
      await uploadedDocument.save();

      session.originalDocumentId = uploadedDocument._id;
      session.originalDocumentIds = [uploadedDocument._id];
      await session.save();
      const pdfDroppedElementDataDoc = await PDFDroppedElementsModel.findOne({
        templateid: templateId
      })
      if (pdfDroppedElementDataDoc) {
        const droppedElements = pdfDroppedElementDataDoc.droppedElements || []
        if (droppedElements.length) {
          const newPDFDroppedElementDataDoc = new PDFDroppedElementsModel({
            sessionid: session._id,
            droppedElements
          })
          await newPDFDroppedElementDataDoc.save()
        }
      }
    } else {
      if (files) {
        const allDocumentIdsUploaded = []
        // files
        await Promise.all(_.map(files, async (file) => {
          const uploadedDocument = new DocumentModel({
            sessionid: session._id,
            documentCategory: 'initial_document',
            name: file.originalname,
            url: localGetSignedUrl(file.key),
            type: file.mimetype,
            size: file.size,
            key: file.key,
            bucketName: file.bucket,
            uploadedBy: notaryId,
            uploadedStage: 'initial_stage',
            preprocessing: 'pending'
          });
          await uploadedDocument.save();
          CustomService.preprocessSessionDocumentBeforeSession(session._id, uploadedDocument._id)
          allDocumentIdsUploaded.push(uploadedDocument._id)
        }));

        session.originalDocumentId = allDocumentIdsUploaded && allDocumentIdsUploaded[0];
        session.originalDocumentIds = allDocumentIdsUploaded;
        await session.save();
      }
    }
    // send email to user
    emailer.sendNotarySignerEmail(
      customer, notaryuser, password, meetingDate, session._id, meetingTimeZone, dontSendTempPassword, session
    );
    if (session.multiSignerList) {
      const finalSignerDocs = []
      await Promise.all(_.map(session.multiSignerList, async (signerDoc) => {
        console.log(signerDoc)
        if (signerDoc.emailSent) {
          return
        }
        const email2 = signerDoc.email;
        let userDoc = await User.findOne({
          email: email2,
          role: 'customer',
          deleted: {$ne: true}
        })
        if (!userDoc) {
          userDoc = new User({
            name: 'Additional Signer',
            first_name: 'Additional',
            last_name: 'Signer',
            email: email2,
            password: utils.generateRandomPassword(6),
            verification: uuid.v4(),
            role: 'customer',
            state: '',
            verified: true,
            testingacc: user.testingacc || false
          });
          await userDoc.save();
        }
        console.log('userDoc', userDoc)
        let notaryUserDoc;
        if (sessionDoc.notaryUserId) {
          notaryUserDoc = await User.findOne({
            _id: sessionDoc.notaryUserId
          })
        }
        emailer.sendEmailToAdditionalSignerWhenInvitedToSession(userDoc, userDoc.password,
          getTimeOfSessionFormatted(session), session._id, {}, notaryUserDoc, sessionDoc);
        signerDoc.emailSent = true;
        finalSignerDocs.push(signerDoc)
      }))
      session.multiSignerList = finalSignerDocs
      await session.save()
    }
    if (session.pointOfContacts) {
      const finalPOCDocs = []
      await Promise.all(_.map(session.pointOfContacts, async (pocDoc) => {
        console.log(pocDoc)
        if (pocDoc.emailSent) {
          return
        }
        const email3 = pocDoc.email;
        let userDoc = await User.findOne({
          email: email3,
          role: 'customer',
          deleted: {$ne: true}
        })
        if (!userDoc) {
          userDoc = new User({
            name: pocDoc.firstname + ' ' + pocDoc.lastname,
            first_name: pocDoc.firstname,
            last_name: pocDoc.lastname,
            email: email3,
            password: utils.generateRandomPassword(6),
            verification: uuid.v4(),
            role: 'customer',
            state: '',
            verified: true,
            testingacc: user.testingacc || false
          });
          await userDoc.save();
        }
        console.log('userDoc', userDoc)
        let notaryUserDoc;
        if (sessionDoc.notaryUserId) {
          notaryUserDoc = await User.findOne({
            _id: sessionDoc.notaryUserId
          })
        }
        emailer.sendEmailToPointOfContactWhenInvitedToSession(userDoc, userDoc.password,
          getTimeOfSessionFormatted(session), session._id, {}, notaryUserDoc, sessionDoc, pocDoc);
        pocDoc.emailSent = true;
        finalPOCDocs.push(pocDoc)
      }))
      console.log('finalPOCDocs', finalPOCDocs)
      session.pointOfContacts = finalPOCDocs
      await session.save()
    }
    if (typeOfNotaryForSession === 'open_call') {
      const identityModelData = await IdentityModel.findOne({
        sessionid: session._id
      })
      const shortSessionID = (session._id).toString().substr((session._id).toString().length - 5).toUpperCase();
      session.notaryUserId = null
      session.sessionOpenCallForTaking = true
      session.sessionOpenCallForTakingAt = new Date();
      await session.save()
      if (session?.sessionType === 'loan_signing') {
        await emailer.sendEmailToAllNotariesForLoanSigning(shortSessionID, session, identityModelData);
      } else {
        await emailer.sendEmailToAllNotaries(shortSessionID, session, identityModelData);
      }
    }
    if (paymentMethodSelected) {
      user.selectedPaymentMethod = paymentMethodSelected
      await user.save()
    } else {
      if (user.selectedPaymentMethod) {
        user.selectedPaymentMethod = ''
        await user.save()
      }
    }
    if (user.loginViaSalesTitlesProDemoOneTime && !user.turnOffInviteSigner) {
      user.turnOffInviteSigner = true
      await user.save()
    }
    res.status(200).json({
      session,
      email: customer.email
    });
  } catch (error) {
    utils.handleError(res, error);
  }

};

// Fetch sessions
exports.fetchNotarySessions = async (req, res) => {
  const user = req.user;
  const paginate = (req?.body?.paginate) ? true : false;
  const pageNum = (req?.body?.page && !isNaN(parseInt(req?.body?.page, 10))) ? parseInt(req.body.page, 10) : 1;
  const perPageLimit = 10;
  req = matchedData(req);
  const showArchievedSessions = req.showArchievedSessions
  try {
    // check if email exists

    const sessionWitnessIds = await SessionWitness.distinct('sessionid', {
      userid: user.id
    })
    console.log('sessionWitnessIds', sessionWitnessIds)
    const sessionIds = req.session_ids || false;
    let sessionFindQuery;
    const businessPremiumNotary = await UserNotaryRelation.findOne({
      notaryid: req.notary_user_id,
      relationType: 'invited',
      deleted: {$ne: true}
    })
    if (req.journal) {
      sessionFindQuery = {
        deleted: {$ne: true},
        $or: [
          {
            notaryUserId: req.notary_user_id
          },
          {
            sessionActive: true,
            _id: {$in: sessionWitnessIds}
          }
        ]
      }
    } else if (businessPremiumNotary) {
      if (user.vendor) {
        const openCallSessionids = await OpenCalls.distinct('sessionid', {
          userId: user._id,
          vendor: user.vendor
        })
        console.log('openCallSessionids', openCallSessionids)
        sessionFindQuery = {
          deleted: {$ne: true},
          $or: [
            {
              notaryUserId: req.notary_user_id
            },
            {
              _id: {$in: openCallSessionids},
              sessionOpenCallForTaking: true
            },
            {
              _id: {$in: openCallSessionids},
              sessionPickedCallForTakingAt: {$gte: moment().subtract(60, 'minutes')}
            },
            {
              sessionActive: true,
              _id: {$in: sessionWitnessIds}
            }
          ]
        }
      } else {
        sessionFindQuery = {
          deleted: {$ne: true},
          $or: [
            {
              notaryUserId: req.notary_user_id
            },
            {
              sessionActive: true,
              _id: {$in: sessionWitnessIds}
            }
          ]
        }
      }
    } else {
      const openCallSessionids = await OpenCalls.distinct('sessionid', {
        userId: user._id
      })
      console.log('openCallSessionids', openCallSessionids)
      sessionFindQuery = {
        deleted: {$ne: true},
        $or: [
          {
            notaryUserId: req.notary_user_id
          },
          {
            _id: {$in: openCallSessionids},
            sessionOpenCallForTaking: true
          },
          {
            _id: {$in: openCallSessionids},
            sessionPickedCallForTakingAt: {$gte: moment().subtract(60, 'minutes')}
          },
          {
            sessionOpenCallForWitness: true
          },
          {
            sessionActive: true,
            _id: {$in: sessionWitnessIds}
          }
        ]
      }
      // if (user.dontShowOpenCalls) {
      //   delete sessionFindQuery.$or[1]
      //   delete sessionFindQuery.$or[2]
      //   delete sessionFindQuery.$or[3]
      // }
    }
    if (showArchievedSessions) {
      sessionFindQuery.archievedBy = user._id
    } else {
      sessionFindQuery.archievedBy = {$ne: user._id}
    }
    console.log('sessionIds', sessionIds)
    console.log('req.body', req.body)
    console.log('sessionFindQuery', sessionFindQuery)
    // if (sessionIds && sessionIds.length) {
    //   sessionFindQuery._id = {
    //     $in: _.map(sessionIds, (id) => new mongoose.Types.ObjectId(id))
    //   }
    // }
    console.log(sessionFindQuery)
    const sessionWitnessIdsString = _.map(sessionWitnessIds, (tempId) => {
      return String(tempId)
    })
    let sessionsIter = [];
    let pagination = {}
    if (paginate) {
      const sessions = await NewSessionModel.paginate(
        sessionFindQuery,
        {page: pageNum, limit: perPageLimit, sort: {createdAt: -1}}
      )
      sessionsIter = sessions.docs
      pagination = {
          totalDocs: sessions.totalDocs,
          offset: sessions.offset,
          limit: sessions.limit,
          totalPages: sessions.totalPages,
          page: sessions.page,
          pagingCounter: sessions.pagingCounter,
          hasPrevPage: sessions.hasPrevPage,
          hasNextPage: sessions.hasNextPage,
          prevPage: sessions.prevPage,
          nextPage: sessions.nextPage
      }
    } else {
      sessionsIter = await NewSessionModel.find(sessionFindQuery).sort({createdAt: -1});
    }
    const sessionData = [];
    const allAdditionalSignerEmails = []
    let sessionIdentityDocsKeyed = {}
    const allSessionIds = _.map(sessionsIter, '_id')
    const sessionVendors = await Vendors.find({
      _id: {$in: _.uniq(_.compact(_.map(sessionsIter, 'vendor')))}
    }, {
      vendor_name: 1,
      whitelabel: 1,
      whitelabel_baseurl: 1,
      whitelabel_imageurl: 1,
      whitelabel_imagetext: 1,
      whitelabel_click_linkurl: 1,
      hideUpgradeOptions: 1,
      testingacc: 1,
      skipSessionCharges: 1
    })
    const sessionVendorsKeyed = _.keyBy(sessionVendors, '_id') || {}
    console.log('sessionVendorsKeyedsessionVendorsKeyed', sessionVendorsKeyed)
    const allUserIds = []
    const allVideoDocumentIds = []
    for (const item of sessionsIter) {
      if (item.userId) {
        allUserIds.push(item.userId)
      }
      if (item.videoFileDocumentId) {
        allVideoDocumentIds.push(item.videoFileDocumentId)
      }
      if (item.multiSignerList) {
        _.map(item.multiSignerList, (multiSignerDoc) => {
          if (multiSignerDoc.email) {
            allAdditionalSignerEmails.push(multiSignerDoc.email)
          }
        })
      }
    }
    const allNeededUserDocs = await User.find({
      _id: {$in: allUserIds}
    })
    const allNeededUserDocsKeyed = _.keyBy(allNeededUserDocs, '_id')

    const allNeededDocumentDocs = await DocumentModel.find({
      $or: [
        {
          sessionid: {$in: allSessionIds},
          documentCategory: {$in: ['initial_document', 'final_document_with_dc', 'followup_document']}
        },
        {
          _id: {$in: allVideoDocumentIds}
        }
      ],
      deleted: {$ne: true}
    })
    const allNeededDocumentDocsKeyed = _.groupBy(allNeededDocumentDocs, 'sessionid')

    const allSessionUserLogsDocs = await SessionUserLogs.find({
      sessionid: {$in: allSessionIds},
      actionType: {$in: ['join_session', 'session_completed']}
    })
    const allSessionUserLogsDocsKeyed = _.groupBy(allSessionUserLogsDocs, 'sessionid')

    let additionalSignerEmailUserDocMap = {}
    if (allAdditionalSignerEmails.length) {
      const allAdditionalSignerUserDocs = await User.find({
        email: {$in: allAdditionalSignerEmails}, deleted: {$ne: true}
      })
      additionalSignerEmailUserDocMap = _.keyBy(allAdditionalSignerUserDocs, 'email')
    }
    const sessionIdentityDocs = await IdentityModel.find({
      sessionid: {$in: allSessionIds}
    })
    sessionIdentityDocsKeyed = _.groupBy(sessionIdentityDocs, 'sessionid')
    let completedStatusCount = 0;
    let totalEarning = 0;
    for (const session of sessionsIter) {
      let joinedAsWitness = false
      if (_.includes(sessionWitnessIdsString, String(session._id))) {
        joinedAsWitness = true
      }
      const openCallAlreadyPicked = session.notaryUserId && String(session.notaryUserId) !== req.notary_user_id &&
        !joinedAsWitness && session.sessionPickedCallForTakingAt && !session.sessionOpenCallForWitness || false
      if (!openCallAlreadyPicked && typeof session?.stripePaymentData?.[0]?.notaryCharges !== 'undefined') {
        totalEarning = totalEarning + session?.stripePaymentData?.[0]?.notaryCharges
      }
      let finalDocument;
      let followupDocumentDoc;
      // const customer = await User.findOne({_id: session.userId, deleted: {$ne: true}});
      const customer = allNeededUserDocsKeyed[session.userId] || false
      // const document = await DocumentModel.find({ sessionid: session._id, documentCategory: 'initial_document' });
      const allCurrentSessionDocs = allNeededDocumentDocsKeyed[session._id] || []
      const document = _.filter(allCurrentSessionDocs, (tempDoc) => tempDoc.documentCategory === 'initial_document')
      // const identityData = await IdentityModel.findOne({ sessionid: session._id });
      const identityData = _.filter(sessionIdentityDocsKeyed[session._id], (tempIdentityDocs) =>
        String(tempIdentityDocs.userId) === String(session.userId))[0]
      // let finalDocumentId = session.finalDocumentId;
      let videoDataId = session.videoFileDocumentId;
      if (session.paid === false) {
        // finalDocumentId = ''
        videoDataId = ''
      }
      if ((session.status === 'complete' || session.paid) && !openCallAlreadyPicked) {
        completedStatusCount = completedStatusCount + 1
        if (session.paid !== false) {
          // finalDocument = await DocumentModel.find({ sessionid: session._id,
          //   documentCategory: 'final_document_with_dc' });
          finalDocument = _.filter(allCurrentSessionDocs, (tempDoc) => tempDoc.documentCategory === 'final_document_with_dc')
          followupDocumentDoc = _.filter(allCurrentSessionDocs, (tempDoc) => tempDoc.documentCategory === 'followup_document')[0]
        }
      } else {
        finalDocument = false;
        followupDocumentDoc = false
      }
      let videoData;
      if ((session.status === 'complete' || session.paid) && videoDataId) {
        // videoData = await DocumentModel.findOne({ _id: videoDataId });
        videoData = _.filter(allCurrentSessionDocs, (tempDoc) => String(tempDoc._id) ===
          String(videoDataId))[0] || false
      } else {
        videoData = false
      }
      if (session.sessionActive && session.sessionActiveFrom) {
        const diff = new Date().valueOf() - session.sessionActiveFrom.valueOf()
        const diffMinutes = diff / (60 * 1000)
        if (diffMinutes > SESSION_TIMEOUT_IN_MINUTES) {
          console.log('diffMinutes inside', diffMinutes)
          session.sessionActive = null
          session.sessionActiveFrom = null
          // delete session.sessionActive
          // delete session.sessionActiveFrom
          session.save()
        }
        console.log(session)
      }
      const allSessionUserLogs = allSessionUserLogsDocsKeyed[session._id] || []
      // const sessionJoinedUserLog = await SessionUserLogs.findOne({
      //   sessionid: session._id,
      //   actionType : 'join_session'
      // })
      const sessionJoinedUserLog = _.filter(allSessionUserLogs, (tempSessionUserLog) =>
        tempSessionUserLog.actionType === 'join_session')[0]
      let sessionStartedTime = false;
      if (sessionJoinedUserLog) {
        sessionStartedTime = sessionJoinedUserLog.createdAt
      }
      // const sessionCompletedUserLog = await SessionUserLogs.findOne({
      //   sessionid: session._id,
      //   actionType : 'session_completed'
      // });
      const sessionCompletedUserLog = _.filter(allSessionUserLogs, (tempSessionUserLog) =>
        tempSessionUserLog.actionType === 'session_completed')[0]
      let sessionEndTime = false;
      if (sessionCompletedUserLog) {
        sessionEndTime = sessionCompletedUserLog.createdAt;
      }
      const additionalSignerIdentyDocs = []
      const allNotaryIdentities = sessionIdentityDocsKeyed[session._id] || []
      _.map(session.multiSignerList, (multiSignerDoc) => {
        const userDoc = additionalSignerEmailUserDocMap[multiSignerDoc.email]
        let identityDocFound = false
        if (userDoc) {
          _.map(allNotaryIdentities, (tempIdentityDoc) => {
            if (String(tempIdentityDoc.userId) === String(userDoc._id)) {
              additionalSignerIdentyDocs.push(tempIdentityDoc)
              identityDocFound = true
            }
          })
        }
        if (!identityDocFound) {
          additionalSignerIdentyDocs.push(multiSignerDoc)
        }
      })
      // @ts-ignore
      const idcardState = identityData?.cardAPIResponseDoc?.platformresponse?.response?.[0]?.
        cardresult?.[0]?.documentaddress?.[0]?.state?.[0]
      // @ts-ignore
      const idcardExpiry = identityData?.cardAPIResponseDoc?.platformresponse?.response?.[0]?.
        cardresult?.[0]?.documentinformation?.[0]?.expirationdate?.[0]
      const vendorDoc = sessionVendorsKeyed[session.vendor] || {}
      let sessionProgressNumber = 0.1
      let sessionProgressName = 'Initial Stage'
      // let sessionProgressColor = 'blue-5'
      let sessionProgressColor = '#000ff'
      if (req.journal) {
        if (session.status === 'complete' || session.paid) {
          sessionProgressNumber = 1
          sessionProgressName = 'Session Completed'
        } else if (session.currentStage === 'meet_notary_stage') {
          sessionProgressNumber = 0.6
          sessionProgressName = 'Identity Passed / Next: Meet Notary'
        } else if (session.currentStage === 'payment_info_stage') {
          sessionProgressNumber = 0.4
          sessionProgressName = 'Identity Passed / Next : Payment Details Capture'
        } else if (session.currentStage === 'identity_check_stage') {
          sessionProgressNumber = 0.2
          sessionProgressName = 'Basic Details Added / Next : Identity Check'
        }
        if (session.status === 'expired') {
          sessionProgressNumber = 1
          sessionProgressName = 'Session Expired'
          sessionProgressColor = 'red-5'
        }
        if (session.status === 'failed') {
          sessionProgressNumber = 1
          sessionProgressName = 'Session Failed'
          sessionProgressColor = 'red-5'
        }
      }
      sessionData.push({
        session,
        signer: (customer && customer.name) ? customer.name : (customer && customer.email ? customer.email : ''),
        inviteLink: `${process.env.FRONT_URL}/business/prepare_doc/${session._id}`,
        signerEmail: (customer) ? customer.email : '',
        documentName: (document && document[0]) ? document[0].name : 'N/A',
        documentUrl: (document && document[0]) ? document[0].url : '#',
        documents: document,
        finalDocument,
        followupDocumentDoc,
        identityData,
        videoData,
        joinedAsWitness,
        sessionStartedTime,
        sessionEndTime,
        additionalSignerIdentyDocs,
        idcardState,
        idcardExpiry,
        vendorDoc,
        openCallAlreadyPicked,
        sessionProgressNumber,
        sessionProgressName,
        sessionProgressColor
      });
    }
    const recentlyAcceptedSessionsQuery = {
      sessionPickedCallForTakingAt: {$exists: true},
      testingAccSession: {$ne: true}
    }
    const recentlyAcceptedSessions = await NewSessionModel
                                            .find(recentlyAcceptedSessionsQuery)
                                            .sort({sessionPickedCallForTakingAt: -1})
                                            .limit(5);

    let responseData = {};
    if (paginate && pagination) {
      responseData = {
        sessionData,
        recentlyAcceptedSessions,
        completedStatusCount,
        totalEarning: totalEarning / 100,
        pagination
      }
    } else {
      responseData = {
        sessionData,
        recentlyAcceptedSessions,
        completedStatusCount,
        totalEarning: totalEarning / 100
      }
    }
    res.status(200).json(responseData);
  } catch (error) {
    utils.handleError(res, error);
  }
};

// Cron - check expired Documents
exports.checkExpiredDocument = async (req, res) => {
  console.log('check expired document');
  try {
    const today = new Date();
    const yesterdayDate = today.setDate(today.getDate() - 1);
    const sessions = await NewSessionModel.find({
      status: 'unsigned',
      $and: [
        {
          meetingdatetimeobj: {
            $exists: true
          }
        },
        {
          meetingdatetimeobj: {
            $lte: new Date(yesterdayDate)
          }
        }
      ]
    });
    console.log('yesterday', yesterdayDate);
    console.log('sessions', sessions.length);
    if (sessions.length) {
      for (const session of sessions) {
        // check if is there any document, remove it
        // const document = await DocumentModel.findOne({ sessionid: session._id });
        // if (document) {
        //   await document.remove();
        // }
        // revert session stage to initial stage
        session.currentStage = 'initial_stage';
        // set session to expired
        session.status = 'expired';
        // add stage history.
        session.stagesHistory.push({
          stageName: 'Expired Status set by Cron after 24hours of session create',
          stageDate: new Date()
        });

        // save session
        await session.save();
      }
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

exports.checkExpiredCommissionLetter = async (req, res) => {
  console.log('check expired commission');
  try {
    const notarydataExpired = await NotaryDataModel.find({
      commissionExpiresOn: {
        $lte: new Date().getTime() / 1000
      },
      deleted: {$ne: true}
    });
    for (const data of notarydataExpired) {
      const notaryUser = await User.findOne({
        _id: data.userId, deleted: {$ne: true}
      });
      if (!notaryUser) {
        continue
      }
      console.log('here', notaryUser._id)
      if (!notaryUser.isCommissionExpired) {
        notaryUser.isCommissionExpired = true
        emailer.sendCommissionExpiredEmailMessage(notaryUser);
        console.log('expired', data.userId)
      }
      if (notaryUser?.approve === 'active') {
        notaryUser.approve = 'inactive';
        notaryUser.needNotaryReApproval = true
        notaryUser.notaryReApprovalReason = 'Notary Commission Expired'
        console.log('inactive', data.userId)
      }
      await notaryUser.save();
    }
    const notarydataNotExpired = await NotaryDataModel.find({
      commissionExpiresOn: {
        $gte: new Date().getTime() / 1000
      },
      deleted: {$ne: true}
    });
    for (const data of notarydataNotExpired) {
      const notaryUser = await User.findOne({
        _id: data.userId, deleted: {$ne: true}
      });
      if (!notaryUser) {
        continue
      }
      if (notaryUser.isCommissionExpired) {
        notaryUser.isCommissionExpired = false
        console.log('commission unexpired', data.userId)
        await notaryUser.save();
      }
    }
    console.log('check expired commission done')
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

// Cron - check expired Sessions
exports.checkExpiredSession = async () => {
  console.log('check expired session');
  try {
    const today = new Date();
    const lastTwoDaysDate = today.setDate(today.getDate() - 2);
    const lastSevenDaysDate = today.setDate(today.getDate() - 7);
    const sessions = await NewSessionModel.find({
      $or: [
        {
          notorizationTiming: 'notarize_later',
          meetingdatetimeobj: {
            $lte: new Date(lastTwoDaysDate)
          },
          status: {
            $nin: ['complete', 'expired']
          }
        },
        {
          notorizationTiming: 'notarize_now',
          createdAt: {
            $lte: new Date(lastTwoDaysDate)
          },
          status: {
            $nin: ['complete', 'expired']
          }
        },
        {
          notorizationTiming: {$exists: false},
          createdAt: {
            $lte: new Date(lastSevenDaysDate)
          },
          status: {
            $nin: ['complete', 'expired']
          }
        }
      ]
    });
    console.log('lastTwoDaysDate', lastTwoDaysDate);
    console.log('sessionsMarkedAsExpired', sessions.length, _.map(sessions, '_id'));
    if (sessions) {
      for (const session of sessions) {
        // check if is there any document, remove it
        // const document = await DocumentModel.findOne({ sessionid: session._id });
        // if (document) {
        //   await document.remove();
        // }
        // revert session stage to initial stage
        // session.currentStage = 'initial_stage';
        // set session to expired
        session.status = 'expired';
        // add stage history.
        session.stagesHistory.push({
          stageName: 'Expired Status set by Cron after 7 days of session create',
          stageDate: new Date()
        });

        // save session
        await session.save();
      }
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

// Cron - reminder users for upcoming sessions before 1 hour -- we run this script
// every 10 mins to check if any session in next 50-60 minutes range
exports.checkForSessionsInNextHourAndSendReminderEmail = async () => {
  console.log('checking sessions in next 50-60 ');
  try {
    const next50Minutes = moment().add(50, 'minutes')
    const next60Minutes = moment().add(60, 'minutes')
    console.log(next50Minutes, next60Minutes)
    const sessions = await NewSessionModel.find({
      status: {
        $nin: ['complete', 'expired']
      },
      meetingdatetimeobj: {
        $gt: next50Minutes,
        $lte: next60Minutes
      }
    });
    const allVendors = await Vendors.find({})
    const allVendorsKeyed = _.keyBy(allVendors, '_id')
    // console.log('lastSevenDaysDate', lastSevenDaysDate);
    console.log('sessions', sessions.length);
    _.map(sessions, async (sessionDoc) => {
      console.log(sessionDoc)
      const sessionUserId = sessionDoc.userId;
      const sessionNotaryId = sessionDoc.notaryUserId;
      const allUserIds = []
      let sendEmailToCustomer = true
      if (allVendorsKeyed?.[sessionDoc.vendor]?.dontSendCustomerEmails) {
        sendEmailToCustomer = false
      }
      if (sessionUserId && sendEmailToCustomer) {
        allUserIds.push(sessionUserId)
      }
      if (sessionNotaryId) {
        allUserIds.push(sessionNotaryId)
      }
      const userDocs = await User.find({
        _id: {$in: allUserIds}, deleted: {$ne: true}
      })
      const shortSessionID = (sessionDoc._id).toString().substr((sessionDoc._id).toString().length - 5).toUpperCase();
      _.map(userDocs, (userDoc) => {
        emailer.sendSessionReminderEmails(userDoc, sessionDoc.meetingdate, sessionDoc.meetingTimeZone,
          shortSessionID, sessionDoc._id)
      })
    })
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

// Cron - reminder users for sessions which are passed 1 hour ago, but session not done
// -- we run this script every 10 mins to check if any session passed in 50-60 minutes range
exports.checkForSessionsForWhichSessionTimeHasPassedAndSessionNotDone = async () => {
  console.log('checking sessions in next 50-60 ');
  try {
    const past50Minutes = moment().subtract(50, 'minutes')
    const past60Minutes = moment().subtract(60, 'minutes')
    console.log(past50Minutes, past60Minutes)
    const sessions = await NewSessionModel.find({
      status: {
        $nin: ['complete', 'expired']
      },
      meetingdatetimeobj: {
        $gt: past60Minutes,
        $lte: past50Minutes
        // $gt: past50Minutes,
        // $lte: past60Minutes
      }
    });
    // console.log('lastSevenDaysDate', lastSevenDaysDate);
    console.log('query', {
      $gt: past60Minutes,
      $lte: past50Minutes
    })
    console.log('sessions', sessions.length);
    _.map(sessions, async (sessionDoc) => {
      console.log(sessionDoc)
      const sessionUserId = sessionDoc.userId;
      // const sessionNotaryId = sessionDoc.notaryUserId;
      const allUserIds = [sessionUserId]
      // if (sessionNotaryId) {
      //   allUserIds.push(sessionNotaryId)
      // }
      const userDocs = await User.find({
        _id: {$in: allUserIds}, deleted: {$ne: true}
      })
      const shortSessionID = (sessionDoc._id).toString().substr((sessionDoc._id).toString().length - 5).toUpperCase();
      _.map(userDocs, (userDoc) => {
        emailer.sendSessionDueEmails(userDoc, sessionDoc.meetingdate, sessionDoc.meetingTimeZone, shortSessionID)
      })
    })
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

exports.uploadCustomerPhotoID = async (req, res) => {
  try {
    const user = req.user;
    let message = '';
    const file = req.file
    console.log(file);
    req = matchedData(req);
    const photoIdCaptureMethod = req.photoIdCaptureMethod
    const typeOfPhotoId = req.typeOfPhotoId
    const sessionDoc = await NewSessionModel.findOne({
      _id: req.sessionId
    })
    let typeOfKBA = ''
    if (sessionDoc && sessionDoc.typeOfKBA) {
      typeOfKBA = sessionDoc.typeOfKBA
    }
    console.log('sessionDoc', sessionDoc)
    console.log('typeOfKBA', typeOfKBA)
    if (file) {
      console.log(file);
      const identityModel = await IdentityModel.exists({ sessionid: req.sessionId, userId: user._id });
      let additionalSigner = false;
      if (req.additionalSigner) {
        additionalSigner = true
      }
      console.log('identityModel', identityModel)
      if (!identityModel) {
        if (req.documentType === 'front') {
          const newIdentityModel = new IdentityModel({
            sessionid: req.sessionId,
            frontPhotoIdName: file.originalname,
            frontPhotoIdUrl: localGetSignedUrl(file.size),
            frontPhotoIdType: file.mimetype,
            frontPhotoIdSize: file.size,
            frontPhotoIdKey: file.key,
            frontPhotoIdBucketName: file.bucket,
            additionalSigner,
            photoIdCaptureMethod,
            typeOfPhotoId
          });
          message = 'Front photo ID uploaded successfully.';
          await newIdentityModel.save();
        } else {
          const newIdentityModel = new IdentityModel({
            sessionid: req.sessionId,
            backPhotoIdName: file.originalname,
            backPhotoIdUrl: localGetSignedUrl(file.size),
            backPhotoIdType: file.mimetype,
            backPhotoIdSize: file.size,
            backPhotoIdKey: file.key,
            backPhotoIdBucketName: file.bucket,
            additionalSigner,
            photoIdCaptureMethod,
            typeOfPhotoId
          });
          await newIdentityModel.save();
          // if (photoIdCaptureMethod !== 'upload_via_webcam' && typeOfKBA !== 'passport') {
          //   const backPhotoIdValidationPassed = await checkBackPhotoId(file.key, req.sessionId, file.originalname);
          //   message = 'Back photo ID uploaded successfully.';
          //   console.log(backPhotoIdValidationPassed)
          //   if (!backPhotoIdValidationPassed) {
          //     message = 'Back Image Validation Failed. Please use clearer image and reupload'
          //   } else {
          //     await newIdentityModel.save();
          //   }
          // } else {
          //   await newIdentityModel.save();
          // }
        }
        res.status(200).json({ message, type: req.documentType });
      } else {
        const identityData = await IdentityModel.findOne({ sessionid: req.sessionId, userId: user._id });
        if (req.documentType === 'front') {
          identityData.frontPhotoIdUrl = localGetSignedUrl(file.key);
          identityData.frontPhotoIdKey = file.key;
          identityData.frontPhotoIdName = file.originalname;
          identityData.frontPhotoIdType = file.mimetype
          identityData.frontPhotoIdSize = file.size
          identityData.frontPhotoIdBucketName = file.bucket
          identityData.photoIdCaptureMethod = photoIdCaptureMethod
          identityData.typeOfPhotoId = typeOfPhotoId
          message = 'Front photo ID updated successfully.';
          await identityData.save();
        } else {
          identityData.backPhotoIdUrl = localGetSignedUrl(file.key);
          identityData.backPhotoIdKey = file.key;
          identityData.backPhotoIdName = file.originalname;
          identityData.backPhotoIdType = file.mimetype
          identityData.backPhotoIdSize = file.size
          identityData.backPhotoIdBucketName = file.bucket
          identityData.photoIdCaptureMethod = photoIdCaptureMethod
          identityData.typeOfPhotoId = typeOfPhotoId
          await identityData.save();
          // if (photoIdCaptureMethod !== 'upload_via_webcam' && typeOfKBA !== 'passport') {
          //   const backPhotoIdValidationPassed = await checkBackPhotoId(file.key, req.sessionId, file.originalname);
          //   console.log(backPhotoIdValidationPassed)
          //   message = 'Back photo ID updated successfully.';
          //   if (!backPhotoIdValidationPassed) {
          //     message = 'Back Image Validation Failed. Please use clearer image and reupload'
          //   } else {
          //     await identityData.save();
          //   }
          // } else {
          //   await identityData.save();
          // }
        }
        res.status(200).json({ message });
      }
    } // if file check
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.expireSessionDocuments = async (req, res) => {
  try {
    console.log('in cron to expire session documents');
    // after 24hrs, if no update, remove document and set the session status to "expired"
    // await controller.checkExpiredDocument();
    // after 7days, status is not completed  remove document and set the session status to "expired"
    await controller.checkExpiredSession();
    res.status(200).json({ status: true });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.saveUserDetails = async (req, res) => {
  try {
    const user = req.user
    const userDetailsDoc = new UserDetails({
      userId: user._id,
      ip: String(req.ip),
      browser: req.headers['user-agent'],
      country: req.headers['accept-language']
    })
    await userDetailsDoc.save()
    res.status(200).json({ status: true });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.setSessionStageOrStatus = async (req, res) => {
  const sessionid = req.params && req.params.id
  if (!sessionid) {
    res.status(400).json({
      error: 'Session id not found'
    })
  }
  const user = req.user;
  const type = req.query.type;
  const value = req.query.value;
  const additionalSigner = req.query.additionalSigner;

  try {
    const session = await NewSessionModel.findOne({
      _id: sessionid
    });
    if (session && type && value) {
      if (additionalSigner) {
        if (type === 'stage') {
          const identityData = await IdentityModel.findOne({ sessionid, userId: user._id });
          if (identityData) {
            identityData.additionalSignerNextStage = value;
          }
          await identityData.save();
        }
      } else {
        if (type === 'stage') {
          let valueToSave = value
          if (value === 'identity_check_stage_fail' || value === 'kba_check_stage_fail' || value === 'photoid_check_stage_fail') {
            if (session.paid) {
              valueToSave = session.currentStage
            } else {
              session.status = 'failed'
            }
          }
          if (value === 'kba_check_stage_aborted' || value === 'photoid_check_stage_aborted') {
            if (!additionalSigner) {
              session.status = 'unsigned'
              valueToSave = 'initial_stage'
              session.failedByRefresh = true;
            }
            const sessionUserLogsData = new SessionUserLogs({
              sessionid: new mongoose.Types.ObjectId(sessionid),
              userId: new mongoose.Types.ObjectId(user._id),
              actionType: value,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            sessionUserLogsData.save();
          }
          session.currentStage = valueToSave;
        }

        if (type === 'status') {
          session.status = value;
        }

        session.stagesHistory.push({
          stageName: `${type} - ${value}`,
          stageDate: new Date()
        });

        await session.save();
      }
      res.status(200).json({status: true});
    }
    res.status(200).json({status: false});
  } catch (error) {
    utils.handleError(res, error);
  }
}

exports.isValidSession = async (req, res) =>  {
  const sessionid = req.params && req.params.id
  if (!sessionid) {
    return res.status(200).json({
      status: false
    });
  }

  try {
    const session = await NewSessionModel.findOne({
      _id: sessionid
    });
    if (session) {
      if (session.status === 'expired' ||
        session.status === 'complete' ||
        session.currentStage === 'identity_check_stage_fail' ||
        session.currentStage === 'kba_check_stage_fail'  ||
        session.currentStage === 'photoid_check_stage_fail') {
        return res.status(200).json({status: false, session});
      }
      return res.status(200).json({status: true, session});
    }
    return res.status(200).json({status: false});
  } catch (error) {
    return utils.handleError(res, error);
  }
}

async function getObject (bucket, objectKey) {
  try {
    const params = {
      Bucket: bucket,
      Key: objectKey
    }
    console.log(params)
    return await s3.getObject(params).promise();
  } catch (e) {
    const err = e as any;
    throw new Error(`Could not retrieve file from S3: ${err.message}`)
  }
}

async function upload (bucket, objectKey, buf, contentType) {
  try {
    const params = {
      Bucket: bucket,
      Key: objectKey,
      Body: buf,
      XAmzAcl: 'public-read',
      ContentEncoding: 'base64',
      ContentType: contentType
    };

    return await s3.upload(params).promise();
  } catch (e) {
    const err = e as any;
    throw new Error(`Could not upload file from S3: ${err.message}`)
  }
}

const oldSigningMethod = async (pdfFile, sessionid, dcBuffer,
                                reason, dcPassword, contactInfo, name, location) => {
    console.log('Signing using old method, since new method throwed exception.')
    const signatureLength = dcBuffer.Body.toString().length

    let inputBuffer;
    try {
      inputBuffer = plainAddPlaceholder({
        pdfBuffer: pdfFile.Body,
        reason,
        contactInfo,
        name,
        location,
        signatureLength
      });
    } catch (error) {
      console.log(error)

      const inputFile = './tmp/' + sessionid + '_input.pdf'
      const outputFile = './tmp/' + sessionid + '_output.pdf'
      await fs.createWriteStream(inputFile).write(pdfFile.Body);

      const { stdout, stderr } = await exec('gs -o ' + outputFile +
        ' -sDEVICE=pdfwrite -dPDFSETTINGS=/prepress ' + inputFile);

      console.log('stdout:', stdout);
      console.log('stderr:', stderr);

      const content = fs.readFileSync(outputFile);
      inputBuffer = plainAddPlaceholder({
        pdfBuffer: content,
        reason,
        contactInfo,
        name,
        location,
        signatureLength
      });
    }
    console.log('ready to sign')
    return signer.sign(inputBuffer, dcBuffer.Body, {passphrase: dcPassword || 'bnDCpwd21'})
}

const signDocument = async (pdfKey, p12Key, sessionid, reason,
                            {dcPassword, contactInfo, name, location, notaryUserId}) => {
  const pdf = await getObject(process.env.AWSBucket, pdfKey);
  let objectKeyStr = p12Key;
  if (!p12Key.includes('.p12') && !p12Key.includes('.pfx')) {
    objectKeyStr = p12Key + '.p12'
  }
  console.log('objectKeyStr while signing', objectKeyStr)
  const DCBuffer = await getObject(process.env.AWSBucket, objectKeyStr);
  const objectKey = `${sessionid}_${Math.floor(Math.random() * 9999999)}_signed_pdf.pdf`

  let signedPdfBuffer = null;
  const SIGNATURE_LENGTH = 16000;
  try {
    const DEFAULT_BYTE_RANGE_PLACEHOLDER = '**********';
    const pdfDoc = await PDFDocument.load(pdf.Body as string, {
      ignoreEncryption: true
    });
    const pages = pdfDoc.getPages();

    const ByteRange = PDFArrayCustom.withContext(pdfDoc.context);
    ByteRange.push(PDFNumber.of(0));
    ByteRange.push(PDFName.of(DEFAULT_BYTE_RANGE_PLACEHOLDER));
    ByteRange.push(PDFName.of(DEFAULT_BYTE_RANGE_PLACEHOLDER));
    ByteRange.push(PDFName.of(DEFAULT_BYTE_RANGE_PLACEHOLDER));

    const signatureDict = pdfDoc.context.obj({
      Type: 'Sig',
      Filter: 'Adobe.PPKLite',
      SubFilter: 'adbe.pkcs7.detached',
      ByteRange,
      Contents: PDFHexString.of('A'.repeat(SIGNATURE_LENGTH)),
      Reason: PDFString.of(reason),
      M: PDFString.fromDate(new Date()),
      ContactInfo: PDFString.of(contactInfo),
      Name: PDFString.of(name),
      Location: PDFString.of(location)
    });
    const signatureDictRef = pdfDoc.context.register(signatureDict);

    const widgetDict = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Widget',
      FT: 'Sig',
      Rect: [0, 0, 0, 0],
      V: signatureDictRef,
      T: PDFString.of('Signature1'),
      F: 4,
      P: pages[0].ref
    });
    const widgetDictRef = pdfDoc.context.register(widgetDict);

    pages[0].node.set(PDFName.of('Annots'), pdfDoc.context.obj([widgetDictRef]));

    pdfDoc.catalog.set(
      PDFName.of('AcroForm'),
      pdfDoc.context.obj({
        SigFlags: 3,
        Fields: [widgetDictRef]
      })
    );

    const modifiedPdfBytes = await pdfDoc.save({ useObjectStreams: false });
    const modifiedPdfBuffer = Buffer.from(modifiedPdfBytes);

    // const signObj = new signer.SignPdf();
    signedPdfBuffer = signer.sign(modifiedPdfBuffer, DCBuffer.Body, {passphrase: dcPassword || 'bnDCpwd21'});

  } catch (error) {
    console.log('signing error: ', error);
    if (useOldPDFPreprocessingMethod) {
      console.log('will try old method for signing.');
      signedPdfBuffer = null;
      signedPdfBuffer = await oldSigningMethod(pdf, sessionid, DCBuffer, reason,
        dcPassword, contactInfo, name, location);
    }
  }

  if (signedPdfBuffer) {
    const signedFile = await upload(process.env.AWSBucket, objectKey, signedPdfBuffer, 'application/pdf')
    const uploadedDocument = new DocumentModel({
      sessionid,
      documentCategory: 'final_document_with_dc',
      name: objectKey,
      url: localGetSignedUrl(objectKey),
      type: 'application/pdf',
      size: signedPdfBuffer.length,
      key: objectKey,
      bucketName: signedFile.Bucket,
      uploadedBy: notaryUserId,
      uploadedStage: 'document_with_dc'
    });
    console.log('uploadedDocument', uploadedDocument)
    await uploadedDocument.save();
    return uploadedDocument;
  }
  return null;
}

const processChargesForSession = async (sessions, notaries, user, repaymentForSession, customerIdToUse) =>  {
  let paymentDone = 'failure';
  if (!sessions) {
    return paymentDone
  }
  if (!customerIdToUse) {
    customerIdToUse = notaries.stripeCustomerID
  }
  if (sessions.paid) {
    return 'success'
  }
  console.log('sessions', sessions)

  // const { costOfNotarization } = sessions;
  console.log('costOfNotarization', sessions.costOfNotarization)
  console.log('sessionCustomCharges', sessions.sessionCustomCharges)

  const notaryUserDoc = await User.findOne({
    _id: sessions.notaryUserId, deleted: {$ne: true}
  })

  // Determining which pricing strategy to use
  let stateToUse = 'Others'
  if (notaryUserDoc && notaryUserDoc.state) {
    stateToUse = notaryUserDoc.state
  }
  let pricingDoc = PricingJson.pricing[stateToUse]
  let statePricingUsed = true;
  if (stateToUse === 'Others') {
    statePricingUsed = false;
  }
  if (!pricingDoc) {
    statePricingUsed = false;
    pricingDoc = PricingJson.pricing.Others
  }
  console.log('pricingDoc', pricingDoc)

  const customerUserDoc = await User.findOne({
    _id: sessions.userId, deleted: {$ne: true}
  })
  let invitedByCustomerUserDoc;
  if (sessions.invitedByCustomer) {
    invitedByCustomerUserDoc = await User.findOne({
      _id: sessions.invitedByCustomer, deleted: {$ne: true}
    })
  }
  let vendorDoc
  if (sessions.vendor) {
    vendorDoc = await Vendors.findOne({
      _id: sessions.vendor
    })
    console.log('vendorDocvendorDoc', vendorDoc)
  }
  const businessUserSubsidizedSession = await getBusinessUserSubsidizedSession(sessions,
    customerUserDoc, invitedByCustomerUserDoc, vendorDoc)
  console.log('businessUserSubsidizedSession', businessUserSubsidizedSession)
  let notaryFee = '10.00';
  if (!sessions.sessionPickedCallForTakingAt && sessions.invitedSession) {
    notaryFee = '22.00'
  }
  // if (pricingDoc && pricingDoc.notaryFee) {
  //   notaryFee = pricingDoc.notaryFee;
  // }
  // For Loan Signings, we pay 125$ flat to notary if session is invited session.
  // If session is open call session, we pay notary $30
  if (sessions.sessionType === 'loan_signing') {
    notaryFee = '30.00'
    if (!sessions.sessionPickedCallForTakingAt && sessions.invitedSession) {
      notaryFee = '125.00'
    }
  }
  if (sessions.sessionChargeOnBusinessUser && businessUserSubsidizedSession !== 'full'
      && !sessions.sessionPickedCallForTakingAt) {
    notaryFee = '0.00'
  }
  if (sessions.sessionType === 'loan_signing' && sessions.invitedByCustomer) {
    if (businessUserSubsidizedSession === 'loan_signing_internal_notary') {
      notaryFee = '0.00'
    } else if (businessUserSubsidizedSession === 'loan_signing_open_call') {
      notaryFee = '30.00'
    }
  }
  let notaryFeeFloat = parseFloat(notaryFee) * 100

  if (sessions.sessionCustomCharges) {
    _.map(sessions.sessionCustomCharges, (extraChargeDoc) => {
      const extraChargeAmount = parseFloat(extraChargeDoc.amount) * 100;
      notaryFeeFloat += extraChargeAmount
    })
    console.log('notaryFeeFloat', notaryFeeFloat)
  }

  // if (notaryUserDoc.notaryCustomCharges) {
  //   let extraChargesDocs = [];
  //   if (sessions.sessionType) {
  //     extraChargesDocs = notaryUserDoc.notaryCustomCharges[sessions.sessionType] || [];
  //   } else {
  //     extraChargesDocs = notaryUserDoc.notaryCustomCharges.gnw || [];
  //   }
  //   console.log('extraChargesDocs', extraChargesDocs)
  //   _.map(extraChargesDocs, (extraChargeDoc) => {
  //     const extraChargeAmount = parseFloat(extraChargeDoc.amount) * 100;
  //     notaryFeeFloat += extraChargeAmount
  //   });
  //   console.log('notaryFeeFloat', notaryFeeFloat)
  // }

  // let serviceFee = '2.00';
  // if (pricingDoc && pricingDoc.serviceFee) {
  //   serviceFee = pricingDoc.serviceFee;
  // }
  // const serviceFeeFloat = parseFloat(serviceFee) * 100

  let extraSeal = '8.00';
  if (pricingDoc && pricingDoc.extraSeal) {
    extraSeal = pricingDoc.extraSeal;
  }
  // const extraSealFloat = parseFloat(extraSeal) * 100
  let extraSealFloatUsd = parseFloat(extraSeal)

  if (businessUserSubsidizedSession && sessions.sessionType !== 'loan_signing' && businessUserSubsidizedSession !== 'full') {
    notaryFeeFloat = 0
    extraSealFloatUsd = 0
  }

  // charge the customer
  let totalCost = 0;
  if (sessions.finalCostOfNotarization !== null) {
    totalCost = parseFloat(sessions.finalCostOfNotarization.replace('$', '')) * 100;
  }

  // Full Notary Charges are going to BN. So not adding any Notary charges calculation here

  let notaryCharges = 0
  const stripeCharges = 30 + parseInt(String(totalCost * 2.9 / 100), 10)

  let witnessChargesPaid = false;
  _.map(sessions.costOfNotarization, (costDoc) => {
    if (costDoc.name.includes('Witness') || costDoc.name.includes('witness')) {
      witnessChargesPaid = true
    }
  })
  console.log('notaryFeeFloatnotaryFeeFloat', notaryFeeFloat)
  if (statePricingUsed) {
    _.map(sessions.costOfNotarization, (costDoc) => {
      if (costDoc.name.indexOf('Notarization') !== -1) {
        notaryCharges += notaryFeeFloat
      } else if (costDoc.name.indexOf('Extra') !== -1) {
        const extraSeals = parseInt(String(parseFloat(costDoc.price) / extraSealFloatUsd), 10)
        notaryCharges += (extraSeals * 400)
      }
    })
    // notaryCharges += (0.5 * serviceFeeFloat)
  } else {
    _.map(sessions.costOfNotarization, (costDoc) => {
      if (costDoc.name.indexOf('Notarization') !== -1) {
        notaryCharges += notaryFeeFloat
      } else if (costDoc.name.indexOf('Extra') !== -1) {
        const extraSeals = parseInt(String(parseFloat(costDoc.price) / extraSealFloatUsd), 10)
        notaryCharges += (extraSeals * 400)
      }
    })
  }

  let bnCharges = 0
  let notaryStripeAccountName = ''

  const notarydm = await NotaryDataModel.findOne({userId: sessions.notaryUserId})

  if (notarydm && notarydm.stripeAccountName) {
    notaryStripeAccountName = notarydm.stripeAccountName
    bnCharges = totalCost - notaryCharges
    // bnCharges = totalCost - notaryCharges - stripeCharges
  }
  console.log(totalCost, bnCharges, notaryStripeAccountName, notaryCharges, stripeCharges)
  // const stripeChargesDoc = {
  //   amount: totalCost,
  //   description: `Charged for session #${sessions._id}`,
  //   currency: 'USD',
  //   customer: notaries.stripeCustomerID,
  //   application_fee_amount: null,
  //   transfer_data: {}
  // }

  // if (notaryStripeAccountName) {
  //   stripeChargesDoc.application_fee_amount = bnCharges;
  //   stripeChargesDoc.transfer_data = {
  //     destination: notaryStripeAccountName
  //     // amount: notaryCharges
  //   }
  // } else {
  //   delete stripeChargesDoc.application_fee_amount
  //   delete stripeChargesDoc.transfer_data
  // }
  // console.log('stripeChargesDoc', stripeChargesDoc)

  if (!totalCost) {
    sessions.paid = true
    await sessions.save();
    paymentDone = 'success'
    generateBlueNotaryFollowUpDocument(sessions._id)
    return paymentDone
  }

  let stripeToUse;
  if (user.testingacc) {
    stripeToUse = stripeTest
  } else {
    stripeToUse = stripe
  }

  console.log('notaries', notaries)
  if (!customerIdToUse) {
    const existingSessionDocWithStripeID = await IdentityModel.find({ userId: notaries.userId,
      stripeCustomerID: {$exists: true} }).sort({_id: -1}).limit(1);
    // @ts-ignore
    if (existingSessionDocWithStripeID?.[0]?.stripeCustomerID) {
      customerIdToUse = existingSessionDocWithStripeID?.[0]?.stripeCustomerID
    }
    notaries.exp_month = '4'
    notaries.exp_year = '2024'
    notaries.last4 = '4242'
    notaries.stripeBrand = 'Visa'
  }

  // Implementing the mechanism where BN gets full payment, and then BN disburses
  // the sub payments to needed parties using stripe payment intent and stripe transfers
  const transferGroup = sessions._id + '_' + Math.floor(Math.random() * 999)

  let charge = {
    paid: false,
    id: false,
    customer: false,
    receipt_url: false,
    status: false
  }
  const triggeredPaymentIntents = []
  if (!customerUserDoc.skipSessionCharges && !sessions.skipSessionCharges) {
    let pm = String(notaries.paymentMethodSelected)
    console.log(pm, typeof pm, !pm, sessions.invitedByCustomer, sessions.sessionChargeOnBusinessUser)
    if ((!pm || pm === 'undefined') && sessions.invitedByCustomer && sessions.sessionChargeOnBusinessUser) {
      if (invitedByCustomerUserDoc && invitedByCustomerUserDoc.selectedPaymentMethod) {
        pm = invitedByCustomerUserDoc.selectedPaymentMethod
        customerIdToUse = String(invitedByCustomerUserDoc.stripeCustomerID)
        try {
          const attached = await stripeToUse.paymentMethods.attach(
            pm,
            {
              customer: customerIdToUse
            }
          );
          console.log(attached);
        } catch (error3) {
          console.log('error3', error3)
        }
      }
    }
    console.log('pm', pm, 'customerIdToUse', customerIdToUse)
    if (!repaymentForSession && (pm.startsWith('pm_') || pm.startsWith('card_'))) {
      // charge using payment intents api as payment method is provided by user
      const chargesPaymentIntent = await stripeToUse.paymentIntents.create({
        amount: totalCost,
        currency: 'usd',
        transfer_group: transferGroup,
        description: `Charged for session #${sessions._id}`,
        customer: customerIdToUse,
        payment_method: notaries.paymentMethodSelected,
        payment_method_types: ['card'],
        confirm: true
      })
      if (chargesPaymentIntent.id) {
        console.log('chargesPaymentIntent', chargesPaymentIntent)
        let tempReceiptUrl = false;
        if (chargesPaymentIntent?.charges?.data?.[0]?.receipt_url) {
          tempReceiptUrl = chargesPaymentIntent?.charges?.data?.[0]?.receipt_url
        }
        charge = {
          paid: true,
          id: chargesPaymentIntent.id,
          customer: chargesPaymentIntent.customer,
          receipt_url: tempReceiptUrl,
          status: chargesPaymentIntent.status
        }
        triggeredPaymentIntents.push(chargesPaymentIntent)
      }
    } else {
      const stripeChargesDoc = {
        amount: totalCost,
        description: `Charged for session #${sessions._id}`,
        currency: 'USD',
        customer: customerIdToUse,
        transfer_data: {}
      }
      console.log('stripeChargesDoc', stripeChargesDoc)
      charge = await stripeToUse.charges.create(stripeChargesDoc);
      console.log('charge', charge)
    }
  } else {
    charge = {
      paid: true,
      id: false,
      customer: false,
      receipt_url: false,
      status: false
    }
  }

  console.log('charge', charge)

  let paymentIntentCost = 0
  const allStripeTransfers = []

  if (notaryStripeAccountName && notaryCharges &&
      (!sessions.sessionChargeOnBusinessUser || businessUserSubsidizedSession === 'full' ||
        businessUserSubsidizedSession === 'loan_signing_open_call' || sessions.sessionPickedCallForTakingAt)) {
    console.log('notaryCharges', notaryCharges)
    const stripeTransferDoc = {
      amount: notaryCharges,
      currency: 'usd',
      destination: notaryStripeAccountName,
      transfer_group: transferGroup,
      source_transaction: charge?.id
    }
    if (!stripeTransferDoc.source_transaction) {
      delete stripeTransferDoc.source_transaction
    }
    allStripeTransfers.push(stripeTransferDoc)
    paymentIntentCost += notaryCharges
  }

  if (witnessChargesPaid) {
    // Currently Supporting only 1 session witness from BN
    // Witness cost is 10$. 5 goes to BN, 5 goes to witness notary
    const allUserSessionWitnesses = await SessionWitness.findOne({
      sessionid: sessions._id,
      userid: {$exists: true}
    })

    if (allUserSessionWitnesses) {
      const sessionUserNotaryDoc = await NotaryDataModel.findOne({userId: allUserSessionWitnesses.userid})
      if (sessionUserNotaryDoc && sessionUserNotaryDoc.stripeAccountName) {
        const stripeTransferDoc2 = {
          amount: 500,
          currency: 'usd',
          destination: sessionUserNotaryDoc.stripeAccountName,
          transfer_group: transferGroup,
          source_transaction: charge?.id
        }
        if (!stripeTransferDoc2.source_transaction) {
          delete stripeTransferDoc2.source_transaction
        }
        allStripeTransfers.push(stripeTransferDoc2)
        paymentIntentCost += 500
      }
    }
  }
  console.log('allStripeTransfers', allStripeTransfers)
  console.log('paymentIntentCost', paymentIntentCost)

  if (paymentIntentCost) {
    const paymentIntent = await stripeToUse.paymentIntents.create({
      amount: paymentIntentCost,
      currency: 'usd',
      transfer_group: transferGroup,
      description: `Payout for session #${sessions._id}`
    });
    console.log('paymentIntent', paymentIntent);
    triggeredPaymentIntents.push(paymentIntent);
    _.map(allStripeTransfers, (internalStripeTransfer) => {
      stripeToUse.transfers.create(internalStripeTransfer)
    })
  }

  if (charge && charge.paid === true) {
    const customerId = sessions.userId
    const customerDoc = await User.findOne({
      _id: customerId, deleted: {$ne: true}
    })
    if (customerDoc) {
      let sendCompletionMail = true
      console.log('sessions.vendorsessions.vendorsessions.vendor', sessions.vendor)
      if (vendorDoc && vendorDoc.dontSendCustomerEmails) {
        sendCompletionMail = false
      }
      console.log('sendCompletionMailsendCompletionMail', sendCompletionMail)
      if (sendCompletionMail) {
        emailer.sendMailWhenSessionIsCompleted(String(sessions._id), customerDoc.name, customerDoc.email, sessions);
      }
    }
    sessions.paid = true
    sessions.stripePaymentData = {
      chargeId: charge.id,
      customerId: charge.customer,
      paid: charge.paid,
      receiptUrl: charge.receipt_url,
      status: charge.status,
      notaryCharges
    }
    if (triggeredPaymentIntents.length) {
      sessions.triggeredPaymentIntents = triggeredPaymentIntents;
    }
    await sessions.save();
    generateBlueNotaryFollowUpDocument(sessions._id)
    paymentDone = 'success'
  } else {
    sessions.paid = false
    console.log('sessions.paid', sessions.paid)
    await sessions.save();
  }
  return paymentDone
}

const saveTheIndividualFailedStreams = async (sessiondoc, fileNamesList) =>  {
  try {
    await Promise.all(_.map(fileNamesList, async (filename) => {
      const fileContent = fs.readFileSync(filename);
      const stats = fs.statSync(filename)
      const objectKey = filename.replace('./tmp/', '')
      const signedFile = await upload(process.env.AWSBucket, objectKey, fileContent, 'video/webm')
      const uploadedDocument = new DocumentModel({
        sessionid: sessiondoc._id,
        documentCategory: 'temp_video_recording_file',
        name: objectKey,
        url: localGetSignedUrl(objectKey),
        type: 'video/webm',
        size: stats.size,
        key: objectKey,
        bucketName: signedFile.Bucket,
        uploadedStage: 'document_with_dc'
      });
      await uploadedDocument.save();
      // if (filename.includes(String(sessiondoc.notaryUserId)) && !filename.includes('_OM')) {
      //   const sessionid = sessiondoc._id
      //   const outputFilepath = './videotmp/SESSION_VIDEO_OUTPUT_' + sessionid + '.mp4'
      //   ffmpeg(filename)
      //   .output(outputFilepath)
      //   .on('error', (er) => {
      //     console.log(`An eror occurred while merging video files: ${er.message}`);
      //     return
      //   })
      //   .on('end', async () => {
      //     console.log('Finished processing');
      //     const fileContent2 = fs.readFileSync(outputFilepath);
      //     const fileSize2 = fs.statSync(outputFilepath)
      //     const file = await upload(process.env.AWSBucket, 'SESSION_VIDEO_OUTPUT_' + sessionid + '_OM' + '.mp4',
      //     fileContent2, 'video/mp4')
      //     console.log(file)
      //     const sessionDoc = await NewSessionModel.findOne({ _id: sessionid });
      //     if (file) {
      //       // Create Document First
      //       // const url = s3.getSignedUrl('getObject', {
      //       //     Bucket: process.env.AWSBucket,
      //       //     Key: file.Key,
      //       //     Expires: 60 * 60 * 24 * 6
      //       // });
      //       // console.log(url)
      //       const uploadedDocument2 = new DocumentModel({
      //         sessionid,
      //         documentCategory: 'video_recording_file',
      //         name: 'SESSION_VIDEO_OUTPUT_' + sessionid + '_OM' + '.mp4',
      //         url: localGetSignedUrl(file.Key),
      //         type: 'video/mp4',
      //         size: fileSize2.size,
      //         key: file.Key,
      //         bucketName: file.Bucket,
      //         uploadedStage: 'meet_notary_stage'
      //       });
      //       const uploadedDocumentDoc = await uploadedDocument2.save();

      //       sessionDoc.videoFileDocumentId = uploadedDocumentDoc._id;
      //       sessionDoc.videoSavingProcessingStage = 'completed'
      //       await sessionDoc.save();
      //       // return
      //     } else {
      //       sessionDoc.videoSavingProcessingStage = 'failed'
      //       sessionDoc.videoSavingProcessingError = 'Video Upload failed'
      //       await sessionDoc.save();
      //       // return
      //     }
      //   })
      //   .run();
      // }
    }));
  } catch (error) {
    console.log('error')
    _.map(fileNamesList, (tempfile) => {
      try {
        fs.unlinkSync(tempfile);
      } catch (error) {
        console.log(error)
      }
    })
  }
}

const checkIfDCPasswordIsValid = async(p12Key, dcPassword) => {
  try {
    let pdfKey = '1650390519829Deed-of-Trust.pdf'
    console.log(process.env.NODE_ENV)
    if (process.env.NODE_ENV === 'development') {
      pdfKey = '1647080435440test_order.pdf'
    }
    const pdf = await getObject(process.env.AWSBucket, pdfKey);
    const PdfBody = pdf.Body as string
    const pdfDoc = await PDFDocument.load(PdfBody, {
      ignoreEncryption: true
    });
    const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
    const pdfBuffer = Buffer.from(pdfBytes)
    let objectKeyStr = p12Key;
    if (!p12Key.includes('.p12') && !p12Key.includes('.pfx')) {
      objectKeyStr = p12Key + '.p12'
    }
    console.log('objectKeyStr', objectKeyStr)
    const DCBuffer = await getObject(process.env.AWSBucket, objectKeyStr);
    const signatureLength = DCBuffer.Body.toString().length
    const inputBuffer = plainAddPlaceholder({
      pdfBuffer,
      reason: 'Signed Certificate By Blue Notary.',
      contactInfo: 'test',
      name: 'test',
      location: 'US',
      signatureLength
    });
    signer.sign(inputBuffer, DCBuffer.Body, {passphrase: dcPassword || 'bnDCpwd21'})
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

const checkBackPhotoId = async (backFileKey, sessionid, fileName) => {
  try {
    const pdf = await getObject(process.env.AWSBucket, backFileKey);
    const PdfBody = pdf.Body as string
    let inputFile = './tmp/' + String(sessionid) + String(fileName)
    console.log('initial', inputFile)
    inputFile = inputFile.replace(/[^a-zA-Z.\/\-\_0-9]/g, '')
    console.log('after', inputFile)
    await fs.writeFileSync(inputFile, PdfBody)
    const { stdout, stderr } = await exec('zxing --try-harder ' + inputFile);
    // fs.unlinkSync(inputFile);
    console.log('stdout', stdout)
    console.log('stderr', stderr)
    let backImagePassed = false;
    if (_.includes(stdout, 'Decoded TEXT')) {
      backImagePassed = true
    }
    if (_.includes(stdout, 'Raw text')) {
      backImagePassed = true
    }
    if (_.includes(stdout, 'Failed')) {
      backImagePassed = false
    }
    console.log('backImagePassed', backImagePassed)
    return backImagePassed;
  } catch (error) {
    console.log(error)
    return false
  }
}
exports.createCustomerBillingPortal = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);

    const notarydm = await NotaryDataModel.findOne({ userId: user._id });

    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }

    if (notarydm && notarydm.stripeAccountName) {
      // const account = await stripeToUse.accounts.retrieve(
      //   notarydm.stripeAccountName
      // );
      // res.status(200).json({account});
      const session = await stripeToUse.billingPortal.sessions.create({
        customer: notarydm.stripeAccountName,
        return_url: 'http://localhost:8080'
      });

      res.redirect(session.url);

    }

    // Authenticate your user.
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryEmailLogoUpload = async (req, res) => {
  try {
    const file = req.file
    const user = req.user
    req = matchedData(req);
    if (file) {
      const notaryUser = await User.findOne({_id: user._id});
      if (notaryUser) {
        const updatedNotaryUser = await User.findByIdAndUpdate(notaryUser.id,
        {$set: {emailLogoName: file.originalname, emailLogoUrl: localGetSignedUrl(file.key), emailLogoKey: file.key}},
        {new: true}).exec();
        res.status(200).json({
          message: 'Logo uploaded successfully.',
          user: updatedNotaryUser
        });
      }

    } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.checkingPhotoIdRealTime = async (req, res) => {
  try {
    const file = req.file
    req = matchedData(req);
    const sessionid = req.sessionid
    const filename = req.filename
    if (file) {
      const response = await checkBackPhotoId(file.key, sessionid, filename)
      console.log('backid checking response', response)
      res.status(200).json({
        passed: response
      })
    } else {
      res.status(200).json({
        passed: false
      })
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.updateEmailCustomMessage = async (req, res) => {
  try {
    const user = req.user
    const body = req.body;
    const notaryUser = await User.findOne({_id: user._id, deleted: {$ne: true}});

    if (notaryUser) {
        const updatedNotaryUser = await User.findByIdAndUpdate(
          notaryUser.id, {$set: {emailCustomMessage: body.customMessage }}, {new: true}
        ).exec();
        res.status(200).json({
          message: 'Message saved successfully.',
          user: updatedNotaryUser
        });
      } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.updateEmailSetting = async (req, res) => {
  try {
    const user = req.user
    const body = req.body;
    const notaryUser = await User.findOne({_id: user._id, deleted: {$ne: true}});

    if (notaryUser) {
        const updatedNotaryUser = await User.findByIdAndUpdate(
          notaryUser.id, {$set: {sendBrandEmails: body.sendBrandEmails }}, {new: true}
        ).exec();
        res.status(200).json({
          message: 'Setting updated successfully.',
          user: updatedNotaryUser
        });
      } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.createCustomerPortalSession = async (req, res) => {
  try {
    const user = req.user
    // const notarydm = await NotaryDataModel.findOne({ userId: user._id })
    // if (!notarydm) {
    //   return res.status(400).json({
    //     error: true,
    //     errorMessage: 'Notary Data not found'
    //   })
    // }
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    let returnUrl = 'https://app.bluenotary.us/notary/account-settings'
    if (process.env.NODE_ENV === 'development') {
      returnUrl = 'http://localhost:8080/notary/account-settings'
    }
    if (user.role === 'customer') {
      returnUrl = 'https://app.bluenotary.us/business/account-settings'
      if (process.env.NODE_ENV === 'development') {
        returnUrl = 'http://localhost:8080/business/account-settings'
      }
    }
    const notaryDataValue = await NotaryDataModel.findOne({ userId: user._id })
    // if (!notaryDataValue) {
    //   return res.status(400).json({
    //     error: true,
    //     errorMessage: 'Notary Data Not Found'
    //   })
    // }
    let subscriptionCustomerId = notaryDataValue?.subscriptionCustomerId || user.stripeSubscriptionCustomerId
    console.log('initial subscriptionCustomerId', subscriptionCustomerId)
    if (notaryDataValue?.forceSubscriptionCustomerId) {
      subscriptionCustomerId = notaryDataValue.forceSubscriptionCustomerId
    } else {
      const allUsers = await stripeToUse.customers.list({
        email: user.email
      })
      console.log('allUsers', allUsers)
      console.log('old', subscriptionCustomerId)
      if (allUsers) {
        if (user.role === 'customer') {
          subscriptionCustomerId = subscriptionCustomerId || allUsers?.data?.[allUsers.data.length - 1]?.id
        } else {
          subscriptionCustomerId = allUsers?.data?.[allUsers.data.length - 1]?.id || subscriptionCustomerId
        }
      }
      console.log('new', subscriptionCustomerId)
    }

    if (!subscriptionCustomerId) {
      const customerDoc = await stripeToUse.customers.create({
        email: user.email
      });
      subscriptionCustomerId = customerDoc.id;
      if (user.role === 'notary') {
        notaryDataValue.subscriptionCustomerId = subscriptionCustomerId
        await notaryDataValue.save()
      } else if (user.role === 'customer') {
        const userDocForSave = await User.findOne({_id: user._id})
        userDocForSave.stripeSubscriptionCustomerId = subscriptionCustomerId
        await userDocForSave.save()
      }
    }
    const session = await stripeToUse.billingPortal.sessions.create({
      customer: subscriptionCustomerId,
      return_url: returnUrl
    });
    res.status(200).json({
      message: 'Setting updated successfully. If it does not open, please enable browser popups',
      redirect_url: session.url
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.inviteBusinessNotary = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);
    const notaryEmail = req.notaryEmail
    let notaryRoleOptions = req.notaryRoleOptions
    try {
      notaryRoleOptions = JSON.parse(notaryRoleOptions)
    } catch (error2) {
      console.log('error2', error2)
    }
    let notaryUserDoc = await User.findOne({
      email: notaryEmail,
      deleted: {$ne: true}
    })
    if (notaryUserDoc && notaryUserDoc.role === 'customer') {
      return res.status(400).json({
        errors: {
          msg: 'Cannot Invite this Notary, as a Customer Account is already created with this email id. Please use other Email id'
        }
      })
    }
    if (notaryUserDoc) {
      const findExistingLinks = await UserNotaryRelation.findOne({
        customerid: user._id,
        notaryid: notaryUserDoc._id,
        relationType: 'invited',
        deleted: {$ne: true}
      })
      if (findExistingLinks) {
        return res.status(400).json({
          errors: {
            msg: 'This Notary is already linked to your Business Account'
          }
        })
      }
    }
    const totalNotaryLinked = await UserNotaryRelation.find({
      customerid: user._id,
      relationType: 'invited',
      deleted: {$ne: true}
    })
    let planWiseMaxNotaryLimit = 3
    if (user.memberType === 'business_pro') {
      planWiseMaxNotaryLimit = 1
    }
    const maxInvitedNotariesAllowed = user.maxInvitedNotariesAllowed || planWiseMaxNotaryLimit;
    if (totalNotaryLinked && totalNotaryLinked.length >= maxInvitedNotariesAllowed) {
      return res.status(400).json({
        errors: {
          msg: 'You cannot link more than ' + maxInvitedNotariesAllowed + ' Notaries'
        }
      })
    }
    let businessUserAllowedNotaryToInvite = true;
    if (user.memberType === 'title_pro' || user.memberType === 'title_hybrid' ||
      user.memberType === 'signing_service' || user.memberType === 'business' ||
      user.memberType === 'business_pro' || user.memberType === 'business_hybrid') {
      businessUserAllowedNotaryToInvite = false
    }
    if (notaryRoleOptions && notaryRoleOptions.notaryCanInviteSignerForSession) {
      if (notaryRoleOptions.notaryCanInviteSignerForSession === 'yes') {
        businessUserAllowedNotaryToInvite = true
      } else if (notaryRoleOptions.notaryCanInviteSignerForSession === 'no') {
        businessUserAllowedNotaryToInvite = false
      }
    }
    if (!notaryUserDoc) {
      const userDocToSave = {
        name: 'Pro Notary',
        first_name: 'Pro',
        last_name: 'Notary',
        email: notaryEmail,
        password: utils.generateRandomPassword(6),
        verification: uuid.v4(),
        role: 'notary',
        memberType: 'pro',
        memberTypeProWhenInvited: true,
        allowInitialPasswordChange: true,
        businessUserAllowedNotaryToInvite,
        notaryInvitedByBusinessUserId: user._id,
        state: '',
        verified: true,
        vendor: user.vendoradmin || user.vendor,
        approve: 'active',
        notaryRoleOptions: notaryRoleOptions || {},
        testingacc: user.testingacc || false
      }
      notaryUserDoc = new User(userDocToSave);
      await notaryUserDoc.save()
      const newProxy = new NotaryDataModel({
        userId: notaryUserDoc._id,
        email: notaryUserDoc.email
      });
      await newProxy.save();
    } else {
      if (notaryUserDoc.memberType === 'free') {
        notaryUserDoc.memberType = 'pro'
        notaryUserDoc.memberTypeProWhenInvited = true
        notaryUserDoc.businessUserAllowedNotaryToInvite = businessUserAllowedNotaryToInvite
        notaryUserDoc.notaryInvitedByBusinessUserId = user._id
        notaryUserDoc.notaryRoleOptions = notaryRoleOptions
        notaryUserDoc.vendor = user.vendoradmin || user.vendor
        await notaryUserDoc.save()
      }
    }
    const userNotaryRelationDoc = new UserNotaryRelation({
      customerid: user._id,
      notaryid: notaryUserDoc._id,
      relationType: 'invited',
      createdAt: new Date()
    })
    await userNotaryRelationDoc.save()
    emailer.sendEmailToNotaryWhenInvitedByBusinessCustomer(notaryUserDoc, notaryUserDoc.password, user)
    res.status(200).json({ success: true });
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.updateBusinessNotary = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);
    const notaryEmail = req.notaryEmail
    let notaryRoleOptions = req.notaryRoleOptions
    try {
      notaryRoleOptions = JSON.parse(notaryRoleOptions)
    } catch (error2) {
      console.log('error2', error2)
    }
    const notaryUserDoc = await User.findOne({
      email: notaryEmail,
      deleted: {$ne: true}
    })
    if (notaryUserDoc && notaryUserDoc.role === 'customer') {
      return res.status(400).json({
        errors: {
          msg: 'Cannot Update this Notary, as a Customer Account is already created with this email id. Please use other Email id'
        }
      })
    }
    if (notaryUserDoc) {
      const findExistingLinks = await UserNotaryRelation.findOne({
        customerid: user._id,
        notaryid: notaryUserDoc._id,
        relationType: 'invited',
        deleted: {$ne: true}
      })
      if (!findExistingLinks) {
        return res.status(400).json({
          errors: {
            msg: 'This Notary linkage is not found'
          }
        })
      }
    } else {
      return res.status(400).json({
        errors: {
          msg: 'Notary user is not found'
        }
      })
    }
    let businessUserAllowedNotaryToInvite = true;
    if (user.memberType === 'title_pro' || user.memberType === 'title_hybrid' ||
      user.memberType === 'signing_service' || user.memberType === 'business' ||
      user.memberType === 'business_pro' || user.memberType === 'business_hybrid') {
      businessUserAllowedNotaryToInvite = false
    }
    if (notaryRoleOptions && notaryRoleOptions.notaryCanInviteSignerForSession) {
      if (notaryRoleOptions.notaryCanInviteSignerForSession === 'yes') {
        businessUserAllowedNotaryToInvite = true
      } else if (notaryRoleOptions.notaryCanInviteSignerForSession === 'no') {
        businessUserAllowedNotaryToInvite = false
      }
    }
    notaryUserDoc.notaryRoleOptions = notaryRoleOptions || {}
    notaryUserDoc.businessUserAllowedNotaryToInvite = businessUserAllowedNotaryToInvite
    await notaryUserDoc.save()
    res.status(200).json({ success: true });
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.removeCustomerNotaryLink = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);
    const customerNotaryLinkId = req.customerNotaryLinkId
    const userNotaryRelationDoc = await UserNotaryRelation.findOne({
      _id: customerNotaryLinkId,
      customerid: user._id,
      relationType : 'invited'
    })
    if (!userNotaryRelationDoc) {
      return res.status(400).json({
        errors: {
          msg: 'Notary Link Not Found'
        }
      })
    }
    userNotaryRelationDoc.deleted = true
    userNotaryRelationDoc.deletedAt = new Date()
    await userNotaryRelationDoc.save()
    const notaryUserId = userNotaryRelationDoc.notaryid
    const notaryUserDoc = await User.findOne({
      _id: notaryUserId,
      memberType: 'pro',
      memberTypeProWhenInvited: true, deleted: {$ne: true}
    })
    if (notaryUserDoc) {
      notaryUserDoc.memberType = 'free'
      await notaryUserDoc.save()
    }
    res.status(200).json({ success: true });
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.customerGetAllSettings = async (req, res) => {
  try {
    const user = req.user
    let neededUserNotaryRelationDocs = await UserNotaryRelation.find({
      customerid: user._id,
      relationType : 'invited',
      deleted: {$ne: true}
    })
    const userDocs = await User.find({
      _id: {$in: _.map(neededUserNotaryRelationDocs, 'notaryid')}, deleted: {$ne: true}
    })
    const userDocsKeyed = _.keyBy(userDocs, '_id')
    neededUserNotaryRelationDocs = JSON.parse(JSON.stringify(neededUserNotaryRelationDocs))
    neededUserNotaryRelationDocs = _.map(neededUserNotaryRelationDocs, (userNotaryRelationDoc) => {
      userNotaryRelationDoc.notaryDoc = userDocsKeyed[userNotaryRelationDoc.notaryid]
      return userNotaryRelationDoc
    })
    const dataToRespond = {
      userNotaryRelations: neededUserNotaryRelationDocs
    }
    res.status(200).json(dataToRespond);
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.fetchAllSelectableNotaries = async (req, res) => {
  try {
    const user = req.user
    const neededUserNotaryRelationDocs = await UserNotaryRelation.find({
      customerid: user._id,
      relationType : 'invited',
      deleted: {$ne: true}
    })
    const sessionNotaryUserDocs = await NewSessionModel.find({
      userId: user._id,
      notaryUserId: {$exists: true}
    }, {
      notaryUserId: 1,
      createdAt: 1
    })
    const allNotaryIds = _.compact(_.union(_.map(neededUserNotaryRelationDocs, 'notaryid'), _.map(sessionNotaryUserDocs, 'notaryUserId')))
    console.log('allNotaryIds', allNotaryIds)

    const notaryFindQuery = {
      _id: {$in: allNotaryIds},
      approve: 'active',
      deleted: {$ne: true},
      vendor: null,
      memberType: null
    }

    let vendorChoosingTeam = false
    if (user.vendor || user.vendoradmin) {
      const vendorDoc = await Vendors.findOne({_id: user.vendor || user.vendoradmin, deleted: {$ne: true}})
      console.log('vendorDocvendorDoc', vendorDoc)
      if (vendorDoc && vendorDoc.openCallSettings && vendorDoc.openCallSettings.allowChoosingFromVendorTeam) {
        notaryFindQuery.vendor = new mongoose.Types.ObjectId(user.vendor || user.vendoradmin)
        delete notaryFindQuery._id
        vendorChoosingTeam = true
        if (vendorDoc && vendorDoc.openCallSettings && vendorDoc.openCallSettings.onlyProNotariesInOpenCall) {
          notaryFindQuery.memberType = 'pro'
        }
      }
    }

    if (!notaryFindQuery.vendor) {
      delete notaryFindQuery.vendor
    }
    if (!notaryFindQuery.memberType) {
      delete notaryFindQuery.memberType
    }
    console.log('notaryFindQuery', notaryFindQuery)
    const userDocs = await User.find(notaryFindQuery)
    // const userDocsKeyed = _.keyBy(userDocs, "_id")
    const neededUserNotaryRelationDocsKeyed = _.keyBy(neededUserNotaryRelationDocs, 'notaryid')
    // const sessionNotaryUserDocsKeyed = _.keyBy(sessionNotaryUserDocs, 'notaryUserId')
    const finalUserDocs = []
    _.map(userDocs, (userDoc) => {
      let tempDoc
      let userType = {}
      if (neededUserNotaryRelationDocsKeyed[userDoc._id]) {
        tempDoc = neededUserNotaryRelationDocsKeyed[userDoc._id]
        userType = 'Invited By Business'
      }
      if (vendorChoosingTeam) {
        tempDoc = userDoc
        userType = 'Joined Via Notary Link'
      }
      // if (sessionNotaryUserDocsKeyed[userDoc._id]) {
      //   tempDoc = sessionNotaryUserDocsKeyed[userDoc._id]
      //   userType = 'Past Session'
      // }
      if (tempDoc) {
        const finalDoc = {
          name: userDoc.name,
          label: userDoc.name,
          email: userDoc.email,
          state: userDoc.state,
          userType,
          date: tempDoc?.createdAt,
          value: userDoc._id
        }
        finalUserDocs.push(finalDoc)
      }
    })
    // neededUserNotaryRelationDocs = JSON.parse(JSON.stringify(neededUserNotaryRelationDocs))
    // neededUserNotaryRelationDocs = _.map(neededUserNotaryRelationDocs, (userNotaryRelationDoc) => {
    //   userNotaryRelationDoc.notaryDoc = userDocsKeyed[userNotaryRelationDoc.notaryid]
    //   return userNotaryRelationDoc
    // })
    const dataToRespond = {
      userNotaryRelations: finalUserDocs
    }
    res.status(200).json(dataToRespond);
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.fillwebhook = async (req, res) => {
  try {
    const body = req.body
    const data = req.data
    console.log('FILEWEBHOOK REQ!!', req)
    console.log('FILEWEBHOOK BODY!!', body)
    console.log('FILEWEBHOOK DATA!!', data)
    res.status(200).json({
      message: 'Webhook passed'
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.fillwebhookPUT = async (req, res) => {
  try {
    const body = req.body
    const data = req.data
    console.log('PUT FILEWEBHOOK BODY!!', body)
    console.log('PUT FILEWEBHOOK DATA!!', data)
    res.status(200).json({
      message: 'Webhook passed'
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

const getBusinessUserSubsidizedSession = async (newSessionDoc, customerDoc, invitedByCustomerUserDoc, vendorDoc) => {
  const notaryUserId = newSessionDoc.notaryUserId;
  const notaryUserDoc = await User.findOne({
    _id: newSessionDoc.notaryUserId, deleted: {$ne: true}
  })
  console.log('customerDoccustomerDoc', customerDoc)
  console.log('invitedByCustomerUserDocinvitedByCustomerUserDoc', invitedByCustomerUserDoc)
  if ((invitedByCustomerUserDoc?.memberType === 'title_hybrid' || invitedByCustomerUserDoc?.memberType === 'signing_service')
    && newSessionDoc?.sessionType === 'loan_signing') {
    if (newSessionDoc?.sessionPickedCallForTakingAt) {
      return 'loan_signing_open_call'
    } else if (newSessionDoc?.notaryUserId) {
      return 'loan_signing_internal_notary'
    }
  }
  let currentSessionBlueNotaryOpenCall = newSessionDoc.sessionPickedCallForTakingAt;
  if (currentSessionBlueNotaryOpenCall && vendorDoc?.openCallSettings?.vendorTeamInternalOpenCall &&
      newSessionDoc?.vendor) {
    currentSessionBlueNotaryOpenCall = false;
  }
  if (currentSessionBlueNotaryOpenCall) {
    return 'full'
  }
  if (invitedByCustomerUserDoc && invitedByCustomerUserDoc.memberType === 'pro') {
    return 'full'
  }
  if ((customerDoc && (customerDoc.memberType === 'business' || customerDoc.memberType === 'business_basic' ||
    customerDoc.memberType === 'title_pro')) ||
  (invitedByCustomerUserDoc && (invitedByCustomerUserDoc.memberType === 'business' ||
    invitedByCustomerUserDoc.memberType === 'business_basic' ||
  invitedByCustomerUserDoc.memberType === 'title_pro')) || (notaryUserDoc && notaryUserDoc.memberTypeProWhenInvited
    && notaryUserDoc.businessUserAllowedNotaryToInvite)) {
    let userDocToUse = customerDoc
    if (invitedByCustomerUserDoc && (invitedByCustomerUserDoc.memberType === 'business' ||
      invitedByCustomerUserDoc.memberType === 'business_basic' ||
    invitedByCustomerUserDoc.memberType === 'title_pro')) {
      userDocToUse = invitedByCustomerUserDoc
    }
    const isNotaryUserLinked = await UserNotaryRelation.findOne({
      customerid: userDocToUse._id,
      notaryid: notaryUserId,
      relationType: 'invited',
      deleted: {$ne: true}
    })
    if (isNotaryUserLinked || (notaryUserDoc && notaryUserDoc.businessUserAllowedNotaryToInvite)) {
      const orQuery = []
      if (invitedByCustomerUserDoc && invitedByCustomerUserDoc._id) {
        // orQuery.push({
        //   userId: invitedByCustomerUserDoc._id
        // })
        orQuery.push({
          invitedByCustomer: invitedByCustomerUserDoc._id
        })
      }
      if (customerDoc && (customerDoc.memberType === 'business' || customerDoc.memberType === 'business_basic' ||
        customerDoc.memberType === 'title_pro')) {
        orQuery.push({
          userId: customerDoc._id
        })
      }
      if (notaryUserDoc && notaryUserDoc.businessUserAllowedNotaryToInvite) {
        orQuery.push({
          notaryUserId: notaryUserDoc._id
        })
      }
      console.log('invitedByCustomerUserDoc', invitedByCustomerUserDoc)
      console.log('orQuery', orQuery)
      if (!orQuery.length) {
        return ''
      }
      const sessionsDoneInCurrentMonth = await NewSessionModel.count({
        $or: orQuery,
        status: 'complete',
        _id: {$ne: newSessionDoc._id},
        createdAt: {$gte: moment().startOf('month')}
      })
      console.log('sessionsDoneInCurrentMonth', sessionsDoneInCurrentMonth)
      let freeSessionsLeft = 7
      if ((notaryUserDoc && notaryUserDoc.memberType === 'business_pro') || (invitedByCustomerUserDoc
        && invitedByCustomerUserDoc.memberType === 'business_pro')) {
        freeSessionsLeft = 2
      }
      if ((notaryUserDoc && notaryUserDoc.memberType === 'business_basic') || (invitedByCustomerUserDoc
        && invitedByCustomerUserDoc.memberType === 'business_basic')) {
        freeSessionsLeft = 0
      }
      if ((notaryUserDoc && notaryUserDoc.memberType === 'signing_service') || (invitedByCustomerUserDoc
        && invitedByCustomerUserDoc.memberType === 'signing_service')) {
        freeSessionsLeft = 0
      }
      if (sessionsDoneInCurrentMonth < freeSessionsLeft) {
        return 'free'
      } else {
        return 'partial'
      }
    }
  }
  return ''
}

const processEVSCardAPI = async (typeOfPhotoId, frontImageData, backImageData,
                                 customerReferenceNumber, biometrics, res) => {
  const builder = new XMLBuilder();
  // const frontImage = await sharp(Buffer.from(frontImageData, 'base64')).resize({ width: 1500 }).toBuffer();
  // const finalFrontImageData = frontImage.toString('base64')
  const finalFrontImageData = ''
  let finalBackImageData;
  if (backImageData) {
    // const backImage = await sharp(Buffer.from(backImageData, 'base64')).resize({ width: 1500 }).toBuffer();
    // finalBackImageData = backImage.toString('base64')
    finalBackImageData = ''
  }
  let documentType = 'DriversLicense';
  if (typeOfPhotoId === 'passportbook') {
    documentType = 'PassportBook'
  }
  if (typeOfPhotoId === 'passportcard') {
    documentType = 'PassportCard'
  }

  const identityDoc = {
    ScanMode: 'DirectImageUpload',
    DocumentType: documentType,
    FrontImage: finalFrontImageData,
    BackImage: null,
    PortraitImage: null
  }
  if (finalBackImageData) {
    identityDoc.BackImage = finalBackImageData
  }
  if (biometrics) {
    identityDoc.PortraitImage = biometrics
  }
  const jsObjectToSend = {
    PlatformRequest: {
      Credentials: {
        Username: 'E27368-65DCF76C-B477-4167-83F4-2E63D0690D4C',
        Password: 'nN0Q44tYmykA5ib'
      },
      CustomerReference: customerReferenceNumber,
      Identity: identityDoc
    }
  }
  const xmlContent = builder.build(jsObjectToSend);
  const evsFillAPIUrl = 'https://identiflo.everification.net/WebServices/Integrated/Main/V220/Card'
  const headers = {'Content-Type': 'application/xml'}
  console.log(xmlContent)
  console.log(evsFillAPIUrl)
  console.log('jsObjectToSend', jsObjectToSend)
  request.post({url: evsFillAPIUrl, body: xmlContent, headers}, (error1, response1, body1) => {
    const parser = new XMLParser({
      attributeNamePrefix : '@_',
      ignoreAttributes : false,
      ignoreNameSpace: false,
      textNodeName : 'text'
    });
    const apiResponse = parser.parse(body1);
    console.log(util.inspect(apiResponse, {showHidden: false, depth: null, colors: true}))
    let apiStatus = 'Pass';
    let apiMessage = 'We are processing your Passport'
    let finalResponse
    const platformResponse = apiResponse && apiResponse.PlatformResponse || {}
    if (platformResponse && platformResponse.TransactionDetails && platformResponse.TransactionDetails.Errors &&
      platformResponse.TransactionDetails.Errors.Error &&
      platformResponse.TransactionDetails.Errors.Error['@_message']) {
      apiStatus = 'Fail'
      apiMessage = platformResponse.TransactionDetails.Errors.Error['@_message']
      finalResponse = {
        apiStatus,
        apiMessage
      }
      return res.status(200).json(finalResponse)
    }
    res.status(200).json(finalResponse)
  });
}

exports.ssimSignDocument = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json('File is missing');
  }
  if (file.contentType !== 'application/pdf') {
    return res.status(400).json('Invalid File');
  }
  const awsBucket = process.env.AWSBucket;
  const sessionid = (req.sessionid) ? req.sessionid : `simulator_session_${uuidV4()}`;
  const notaryUser = req.user;
  const notaryDataDoc = await NotaryDataModel.findOne({userId: notaryUser._id})
  let dcPassword = 'bnDCpwd21';
  let p12keyRef = 'client_6245f4ef64dbcfc5141dfdea.p12';
  if (notaryDataDoc) {
    if (notaryDataDoc.fileKey) {
      p12keyRef = notaryDataDoc.fileKey;
      if (!(notaryDataDoc.fileKey.includes('.p12') || notaryDataDoc.fileKey.includes('.pfx'))) {
        p12keyRef += '.p12'
      }
    }
    if (notaryDataDoc.dcpassword) {
      dcPassword = notaryDataDoc.dcpassword;
    }
  }
  if (p12keyRef === 'client_6245f4ef64dbcfc5141dfdea.p12') {
    const clientFileName = `client_${notaryUser._id}`
    const p12options = {
      clientFileName,
      bitSize: 2048,
      C: 'US', // Country Name (2 letter code)
      ST: notaryUser.state || 'Illinois', // State or Province Name (full name)
      L: notaryUser.state || 'Chicago', // Locality Name (eg, city)
      O: 'Blue Notary LLC', // Organization Name (eg, company)
      OU: notaryUser.state || 'Illinois', // Organizational Unit Name (eg, section)
      CN: notaryUser.name, // Common Name (eg, fully qualified host name)
      emailAddress: notaryUser.email, // Notary Email
      clientPass: 'bnDCpwd21', // DC password
      caFileName: 'ca',
      serial: '01',
      days: 365
    };
    const p12FilePath = path.join( process.cwd(), 'ssl', `${clientFileName}.p12`)
    if (fs.existsSync(p12FilePath)) {
      fs.unlinkSync(p12FilePath)
    }

    // generate p12 for notary
    const sslValue = DCService.createClientSSL(p12options)
    await waitFor(1000)
    sslValue.done((options, sha1fingerprint) => {
      console.log('SHA-1 fingerprint:', sha1fingerprint);
      console.log('options:', options);
    }).fail((err) => {
      console.log('error', err);
    });

    if (fs.existsSync(p12FilePath)) {
      const p12File = await upload(process.env.AWSBucket,
          `${clientFileName}.p12`,
          fs.readFileSync(p12FilePath),
          'application/x-pkcs12'
      )
      console.log('p12File', p12File)
      p12keyRef = `${clientFileName}.p12`
      dcPassword = 'bnDCpwd21'
      // remove p12 in ssl
      fs.unlinkSync(p12FilePath)
    } else {
      console.log('error: it could not generate p12')
    }
  }
  console.log('p12keyRef', p12keyRef)
  const uploadedPdf = await getObject(awsBucket, file.key);
  const p12key = await getObject(awsBucket, p12keyRef);

  let signedPdfBuffer = null;
  const SIGNATURE_LENGTH = 16000;
  try {
    const DEFAULT_BYTE_RANGE_PLACEHOLDER = '**********';
    const pdfDoc = await PDFDocument.load(uploadedPdf.Body.toString('base64'));

    pdfDoc.getForm().getFields().forEach((field) => {
      const type = field.constructor.name
      const name = field.getName()
      console.log(`checing pdf acro field: ${type}: ${name}`)
    });

    const pages = pdfDoc.getPages();

    const ByteRange = PDFArrayCustom.withContext(pdfDoc.context);
    ByteRange.push(PDFNumber.of(0));
    ByteRange.push(PDFName.of(DEFAULT_BYTE_RANGE_PLACEHOLDER));
    ByteRange.push(PDFName.of(DEFAULT_BYTE_RANGE_PLACEHOLDER));
    ByteRange.push(PDFName.of(DEFAULT_BYTE_RANGE_PLACEHOLDER));
    const signatureDict = pdfDoc.context.obj({
      Type: 'Sig',
      Filter: 'Adobe.PPKLite',
      SubFilter: 'adbe.pkcs7.detached',
      ByteRange,
      Contents: PDFHexString.of('A'.repeat(SIGNATURE_LENGTH)),
      Reason: PDFString.of('Signed Certificate By Blue Notary\'s Session Simulator'),
      M: PDFString.fromDate(new Date()),
      ContactInfo: PDFString.of(notaryUser.email),
      Name: PDFString.of(notaryUser.name),
      Location: PDFString.of('US')
    });
    const signatureDictRef = pdfDoc.context.register(signatureDict);

    const widgetDict = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Widget',
      FT: 'Sig',
      Rect: [0, 0, 0, 0],
      V: signatureDictRef,
      T: PDFString.of('Signature1'),
      F: 4,
      P: pages[0].ref
    });
    const widgetDictRef = pdfDoc.context.register(widgetDict);
    // pdfDoc.getForm().acroForm.addField(widgetDictRef)
    pages[0].node.set(PDFName.of('Annots'), pdfDoc.context.obj([widgetDictRef]));

    pdfDoc.catalog.set(
      PDFName.of('AcroForm'),
      pdfDoc.context.obj({
        SigFlags: 3,
        Fields: [widgetDictRef]
      })
    );

    const modifiedPdfBytes = await pdfDoc.save({ useObjectStreams: false });
    const modifiedPdfBuffer = Buffer.from(modifiedPdfBytes);

    signedPdfBuffer = signer.sign(modifiedPdfBuffer, p12key.Body, {passphrase: dcPassword || 'bnDCpwd21'});

  } catch (error) {
    console.log('signing error: ', error);
    if (useOldPDFPreprocessingMethod) {
      console.log('will try old method for signing.');
      signedPdfBuffer = null;
      signedPdfBuffer = await oldSigningMethod(uploadedPdf, sessionid, p12key,
        'Signed Certificate By Blue Notary\'s Session Simulator',
        dcPassword, notaryUser.email, notaryUser.name, 'US');
    }
  }

  if (signedPdfBuffer) {
    let outputPdf
    try {
      outputPdf = await upload(awsBucket, file.key, signedPdfBuffer, 'application/pdf');
      if (!outputPdf) {
        return res.status(500).json('Server Error, Please try again later');
      }
    } catch (error) {
      return res.status(500).json('Server Error, Please try again later' + String(error));
    }
    console.log('outputPdfoutputPdf', outputPdf, outputPdf.Key, localGetSignedUrl(outputPdf.Key))
    return res.status(200).json({
      signedDocUrl: localGetSignedUrl(outputPdf.Key)
    });
  }

  return res.status(500).json('Server Error, Please try again later');
}

exports.sendZigTestRequest = async () => {
  const fileLocation = 'https://bluenotarybucket.s3.us-east-2.amazonaws.com/Example_HELOC_2.pdf?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjENj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCmFwLXNvdXRoLTEiRzBFAiA3gLRaumMa8%2B1YnvnYPdqr9DQHkJjHU4M%2BdA9JRJ07KwIhAK9AsJJGdptCLNmfBC2YBoMAJbr6kMUSWX%2BxD%2FHJIRU5Kv0CCDIQABoMOTMyMDc5NjU3NjY1IgxPf5r0%2FRhDu4Yq3Nsq2gICDK5z5IwvviaeBcqeDUbjNsapEwcA6dYlCcUOuuBJoncQXYqTCxGQGiImuTGZqvrwZOYwDuQZukbc4WHn3R4lX2GhHvAoQ%2BZzwC72tN%2FVkSfHm7NEHa0%2FyyVnFT2vKt2nHCh826Y0csrf2jMfXeWf4x%2BySDcZ2K%2FDAKDSV0PMmQ4ditSrAnc6J85uLmkeAKM7uqUD%2BSN0ixxTS1d6ploVL%2F6L%2BKBNNcZyV6WlD0DH65cHf%2Fue1cCwAHf%2FPJOq0E%2B9sInbRMLP4mprz40xOw8evkegY1Ne9a42Gqyz0igVB8L6fAEjlAufHukgATAbVO%2BbxFx%2B3HlbTNEVCQdc27R6N%2BA8vttDy2aoqZosynqZI%2BmCkQrAERYAUB7lxN9NAmXXjCZsw%2BPkx4AyoHqZIwLM16PTcSWlff3D1dNeESfmHfNJGov6dQ7endzRcM4L8sDy%2BdWfJsnZUz7XMOm4lZcGOrMCqUqt6qIhb943rGoOC5hIHr6bS1zmGEhhnk8Z%2BaqFinL896%2BT%2BCLaNzWtJ7G1OB%2FcovEI29fNaCq0fQYsFYets9aPOzzYPTrGrXKpoftEJFO25fDiNlXm%2FaZq9oqUSk76I8Z99BsV8Ws%2BxdRRQFb%2FHfJKX5OdcuA75BXvmkb30HcI0Nf%2FtgkeOUmVf3CdTVtEbPY9woXoO4EFaLbM2onMCT3FnD3wPwzmFqi7H25NDKNdV0CxQ8UgTN8rdFdMaQTQgmmfa6vKS0BSbyfxJ7dt5AEooIZPXWt9%2BDnrDERBlcys%2B4W9abcfhvqQSt%2Bej8XG8Sr0tTeaBwn05D9FxUT7xYsryBB2tOhKi5H%2FonbT%2FPMkjPOTMlGq3hN3L4eZnVzegk8xLdgzcNAljIoAhIKThL9r8w%3D%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20220730T165721Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIA5SBCG4LA5S2P5WNM%2F20220730%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Signature=2bb6c58c66b2ac6fad195ee9f971e30f5ad38dea85dcf9e734b9218e36fbe14e';
  const backPhotoIdUrl = fileLocation.replace(/^https:\/\//i, 'http://');
  http.get(backPhotoIdUrl, (resp) => {
    resp.setEncoding('base64');
    let fileData = '';
    resp.on('data', (data) => {
      fileData += data;
    });
    resp.on('end', async () => {
      const headers = {
        Authorization: 'Bearer bnkey-46eec66a0545717bb22015bcf3c2a5915012df5b209587ac0692e69d69954bb0-ADVDAFFFSAFAS'
      }
      const dataToSend = {
        notarization_id: 'temp_notatization_id_124',
        // customer_email: 'rohit@mailinator.com',
        customer_email: 'rohcustomer@mailinator.com',
        customer_first_name: 'Rohit',
        customer_last_name: 'Patel',
        customer_middle_name: 'AAA',
        customer_address: 'ADDRESSS',
        customer_city: 'Some City',
        customer_state: 'Virginia',
        customer_zip: '23123',
        contact_method: 'Mobile',
        contact_details: '234234234',
        notarization_type: 'notarize_later',
        session_timing: '2022-07-30T12:00:10-06:00',
        session_documents: [
          {
            name: 'Example_HELOC_2.pdf',
            base64Doc: fileData
          }
        ],
        additional_signers: [{first_name: 'Rohit', last_name: 'Doe', email: 'rvprvprvp7824+23423423421@gmail.com'}]
      }
      request({
        url: 'https://app.bluenotary.us/api/integrations/create_new_session',
        // url: 'http://localhost:5000/api/integrations/create_new_session',
        method: 'POST',
        body: dataToSend,
        headers,
        json: true
      }, (error2, response2, body2) => {
        console.log('error2', error2)
        // console.log('response2', response2)
        console.log('body2', body2)
      });
    });
  }).on('error', (e) => {
    console.log('error', e)
  });
}

const SIGNED_S3_URLS_WEEKLY = [
  {
    model: DocumentModel,
    documentFields: [
      {
        fieldKey: 'key',
        fieldUrl: 'url'
      },
      {
        fieldKey: 'originalDocumentKey',
        fieldUrl: 'originalDocumentUrl'
      }
    ]
  },
  {
    model: DocumentTemplate,
    documentFields: [
      {
        fieldKey: 'key',
        fieldUrl: 'documentUrl'
      }
    ]
  },
  {
    model: SignaturesDataModel,
    documentFields: [
      {
        fieldKey: 'signaureFileKey',
        fieldUrl: 'signaureFileUrl'
      }
    ]
  },
  {
    model: IdentityModel,
    documentFields: [
      {
        fieldKey: 'frontPhotoIdKey',
        fieldUrl: 'frontPhotoIdUrl'
      },
      {
        fieldKey: 'backPhotoIdKey',
        fieldUrl: 'backPhotoIdUrl'
      }
    ]
  },
  {
    model: NotaryDataModel,
    documentFields: [
      {
        fieldKey: 'sealfilename',
        fieldUrl: 'sealdata'
      },
      {
        fieldKey: 'buyPngSealfilename',
        fieldUrl: 'buyPngSealdata'
      },
      {
        fieldKey: 'fileKey',
        fieldUrl: 'certfileUrl'
      },
      {
        fieldKey: 'buyDCfileKey',
        fieldUrl: 'buyDCCertfileUrl'
      },
      {
        fieldKey: 'notaryCopyOfCommissionLetterKey',
        fieldUrl: 'notaryCopyOfCommissionLetterUrl'
      },
      {
        fieldKey: 'lsaApprovalLetterKey',
        fieldUrl: 'lsaApprovalLetterUrl'
      },
      {
        fieldKey: 'hundredRONcompletionProofKey',
        fieldUrl: 'hundredRONcompletionProofUrl'
      },
      {
        fieldKey: 'eoInsuranceProofKey',
        fieldUrl: 'eoInsuranceProofUrl'
      },
      {
        fieldKey: 'notaryCertificates',
        customSigningType: 'notaryCertificates'
      }
    ]
  },
  {
    model: User,
    documentFields: [
      {
        fieldKey: 'emailLogoKey',
        fieldUrl: 'emailLogoUrl'
      },
      {
        fieldKey: 'avatarKey',
        fieldUrl: 'avatarUrl'
      }
    ]
  }
]

exports.signAllDocumentsWeekly = async () => {

  await Promise.all(_.map(SIGNED_S3_URLS_WEEKLY, async (signedS3UrlDoc) => {

    const allResourceDocs = await signedS3UrlDoc.model.find()
    console.log('allResourceDocs.length Outside', allResourceDocs.length)
    _.map(allResourceDocs, async (tempResourceDoc) => {
      await Promise.all(_.map(signedS3UrlDoc.documentFields, async (tempDocumentField) => {
        // @ts-ignore
        if (tempDocumentField.customSigningType) {
          // @ts-ignore
          if (tempDocumentField.customSigningType === 'notaryCertificates') {
            // @ts-ignore
            const notaryCertificates = tempResourceDoc[tempDocumentField.fieldKey] || []
            await Promise.all(_.map(notaryCertificates, (tempNotaryCertificate) => {
              const tempUrl = localGetSignedUrl(tempNotaryCertificate.key)
              if (tempUrl) {
                tempNotaryCertificate.url = tempUrl
              }
            }))
          }
        } else {
          // @ts-ignore
          const docUrl = localGetSignedUrl(tempResourceDoc[tempDocumentField.fieldKey])
          if (docUrl) {
            // @ts-ignore
            tempResourceDoc[tempDocumentField.fieldUrl] = docUrl
          }
        }
      }))
      tempResourceDoc.save()
    });
  }))
}
exports.generateBuyDCForOneUser = async (email) => {
  const user = await User.findOne({email})
  console.log(user)
  const notarydm = await NotaryDataModel.findOne({ userId: user._id });
  console.log(notarydm)
  if (notarydm) {
    const certificateNumberOfYears = notarydm.buyComboPurchaseExpiryDate ? 3 : 1
    const certifiateExpiryDate = moment().add(365 * certificateNumberOfYears, 'days')
    const certificatePassword = (Math.random() + 1).toString(36).substring(2);
    notarydm.buyDCPurchaseExpiryDate = certifiateExpiryDate
    await notarydm.save();

    // const p12 = require('node-openssl-p12').createClientSSL;
    await waitFor(1000)
    const clientFileName = `client_dc_${Date.now()}`
    const p12options = {
        clientFileName,
        bitSize: 2048,
        C: 'US', // Country Name (2 letter code)
        ST: user.state || 'Illinois', // State or Province Name (full name)
        L: user.state || 'Chicago', // Locality Name (eg, city)
        O: 'Blue Notary LLC', // Organization Name (eg, company)
        OU: user.state || 'Illinois', // Organizational Unit Name (eg, section)
        CN: user.name, // Common Name (eg, fully qualified host name)
        emailAddress: user.email, // Notary Email
        clientPass: certificatePassword, // DC password
        caFileName: 'ca',
        serial: Math.floor(Math.random() * 9999999999999999999),
        days: 365 * certificateNumberOfYears
    };
    const p12FilePath = path.join( process.cwd(), 'ssl', `${clientFileName}.p12`)
    if (fs.existsSync(p12FilePath)) {
        fs.unlinkSync(p12FilePath)
    }

    // generate p12 for notary
    const sslValue = DCService.createClientSSL(p12options)
    await waitFor(1000)
    sslValue.done((options, sha1fingerprint) => {
      console.log('SHA-1 fingerprint:', sha1fingerprint);
      console.log('options:', options);
    }).fail((err) => {
      console.log('error', err);
    });
    // await p12(p12options).done((options, sha1fingerprint) => {
    //     console.log('SHA-1 fingerprint:', sha1fingerprint);
    //     console.log('options:', options);
    // }).fail((err) => {
    //     console.log('error', err);
    // });

    if (fs.existsSync(p12FilePath)) {
      const p12File = await upload(process.env.AWSBucket,
          `${clientFileName}.p12`,
          fs.readFileSync(p12FilePath),
          'application/x-pkcs12'
      )
      console.log('p12File', p12File)

      // save p12 to notary
      notarydm.buyDCCertfileUrl = localGetSignedUrl(clientFileName + '.p12');
      notarydm.buyDCCertfilename = clientFileName;
      notarydm.buyDCCertfileSource = 'purchased';
      notarydm.buyDCCertfileAddedAt = new Date();
      notarydm.buyDCfileKey = clientFileName + '.p12';
      notarydm.buyDCCertfilePassword = certificatePassword;
      await notarydm.save();
      console.log('notarydm', notarydm)
      // remove p12 in ssl
      fs.unlinkSync(p12FilePath)
    } else {
      console.log('error: it could not generate p12')
    }
  }
}

exports.terminateSession = async (req, res) => {
  try {
    const sessionid = String(req.params.id);
    const user = req.user
    req = matchedData(req);
    let terminateSessionOptions = req.terminateSessionOptions
    try {
      terminateSessionOptions = JSON.parse(terminateSessionOptions)
    } catch (error) {
      console.log(error)
    }
    if (!_.isObject(terminateSessionOptions)) {
      return res.status(400).json({err: 'Terminate Reason not present'});
    }
    let finalResponse = {
      success: false,
      openCallSent: false
    }
    const sessionDoc = await NewSessionModel.findOne({
      _id: new mongoose.Types.ObjectId(sessionid)
    })
    if (!sessionDoc) {
      return
    }
    if (!sessionDoc.terminateSessionOptions) {
      sessionDoc.terminateSessionOptions = []
    }
    // @ts-ignore
    terminateSessionOptions.terminatedAt = new Date()
    // @ts-ignore
    terminateSessionOptions.terminatedBy = user._id
    // @ts-ignore
    terminateSessionOptions.terminatedByName = user.name + ' (' + user.email + ')'
    sessionDoc.terminateSessionOptions.push(terminateSessionOptions)
    await sessionDoc.save()
    // @ts-ignore
    console.log('terminateSessionOptions.callNewNotary', terminateSessionOptions.callNewNotary)
    console.log('sessionDoc.sessionOpenCallForTaking', sessionDoc.sessionOpenCallForTaking)
    // @ts-ignore
    if (terminateSessionOptions.callNewNotary === 'yes' && !sessionDoc.sessionOpenCallForTaking) {
      sessionDoc.notaryUserId = null
      sessionDoc.sessionOpenCallForTaking = true
      sessionDoc.sessionOpenCallForTakingAt = new Date();
      await sessionDoc.save()

      const shortSessionID = (sessionid).toString().substr((sessionid).toString().length - 5).toUpperCase();
      const identityModelData = await IdentityModel.findOne({
        sessionid
      })
      if (sessionDoc?.sessionType === 'loan_signing') {
        await emailer.sendEmailToAllNotariesForLoanSigning(shortSessionID, sessionDoc, identityModelData);
      } else {
        await emailer.sendEmailToAllNotaries(shortSessionID, sessionDoc, identityModelData);
      }
      const sessionUserLogsData = new SessionUserLogs({
        sessionid: new mongoose.Types.ObjectId(sessionid),
        userId: new mongoose.Types.ObjectId(user._id),
        actionType: 'open_call_sent',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      sessionUserLogsData.save();
      finalResponse = {
        success: true,
        openCallSent: true
      }
    } else {
      finalResponse = {
        success: true,
        openCallSent: false
      }
    }
    return res.status(200).json(finalResponse);
  } catch (err) {
    console.log(err);
    return res.status(500).json({err: 'Server Error'});
  }
}
exports.saveActiveSessionStat = async (req, res) => {
  try {
    const sessionid = String(req.params.sessionid);
    const waitingRoom = req.body.waiting_room || null;
    const videoCam = req.body.video_cam || null;
    const joinedAsPrimarySigner = req.body.joined_as_primary_signer || false;
    const joinedAsSessionNotary = req.body.joined_as_session_notary || false;
    if (!joinedAsPrimarySigner && !joinedAsSessionNotary) {
      return res.status(200).json({err: 'Bad request'});
    }
    let statDoc = await SessionStatModel.findOne({ sessionId: sessionid });

    const stat: ISessionStat = {};
    if (waitingRoom) {
      stat.waitingRoom = waitingRoom;
    }
    if (videoCam) {
      stat.videoCam = videoCam
    }
    stat.completePendingItems = (req.body?.complete_pending_items) ? req.body.complete_pending_items : '';
    if (!stat) {
      return res.status(400).json({msg: 'Bad request'});
    }
    if (joinedAsSessionNotary) {
      if (!statDoc) {
        statDoc = new SessionStatModel({
          sessionId: sessionid,
          notaryUserId: String(req.user._id),
          notaryStat: stat
        });
        await statDoc.save();
        return res.status(200).json(statDoc.notaryStat);
      } else if (statDoc && (!statDoc.notaryStat || !statDoc.notaryUserId)) {
        await SessionStatModel.updateOne({_id: statDoc._id}, {
          notaryStat: stat,
          notaryUserId: String(req.user._id)
        });
        return res.status(200).json(stat);
      } else {
        const existingNotaryStat = statDoc.notaryStat;
        if (stat.waitingRoom) {
          existingNotaryStat.waitingRoom = stat.waitingRoom
        }
        if (stat.videoCam) {
          existingNotaryStat.videoCam = stat.videoCam
        }
        existingNotaryStat.completePendingItems = stat.completePendingItems;
        await SessionStatModel.updateOne({ sessionId: sessionid }, { notaryStat: existingNotaryStat });
        return res.status(200).json(existingNotaryStat);
      }
    } else if (joinedAsPrimarySigner) {
      if (!statDoc) {
        statDoc = new SessionStatModel({
          sessionId: sessionid,
          customerUserId: String(req.user._id),
          customerStat: stat
        });
        await statDoc.save();
        return res.status(200).json(statDoc.stat);
      } else if (statDoc && (!statDoc.customerStat || !statDoc.customerUserId)) {
        await SessionStatModel.updateOne({sessionId: sessionid}, {
          customerUserId: String(req.user._id),
          customerStat: stat
        });
        return res.status(200).json(stat);
      } else {
        const customerStat = statDoc.customerStat;
        if (stat.waitingRoom) {
          customerStat.waitingRoom = waitingRoom;
        }
        if (stat.videoCam) {
          customerStat.videoCam = stat.videoCam;
        }
        await SessionStatModel.updateOne({_id: statDoc._id}, { customerStat });
        return res.status(200).json(customerStat);
      }
    } else {
      return res.status(400).json({msg: 'Bad request'});
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({err: 'Server Error'});
  }
}
exports.sessionsActivityStatus = async (req, res) => {
  try {
    console.log('req.body', req.body)
    const sessionIds = req.body.sessionIds;
    const sessionDocs = await NewSessionModel.find({
      _id: sessionIds
    })
    const userInSessionStatus = {}
    await Promise.all(_.map(sessionDocs, async (sessionDoc) => {
      userInSessionStatus[sessionDoc._id] = {
        notary: false,
        signer: false
      }
      const custLastActiveKey = `${sessionDoc._id}_${sessionDoc.userId}_session_last_active`;
      const custLastPingTs = await redisClient.get(custLastActiveKey);
      if (custLastPingTs) {
        const now = moment(Date.now());
        const custLastPingTime = moment(parseInt(custLastPingTs, 10));
        const custInterval = now.diff(custLastPingTime, 'seconds');
        if (custInterval && custInterval <= 20) {
          userInSessionStatus[sessionDoc._id].signer = true
        }
      }

      const notaryLastActiveKey = `${sessionDoc._id}_${sessionDoc.notaryUserId}_session_last_active`;
      const notaryLastPingTs = await redisClient.get(notaryLastActiveKey);
      if (notaryLastPingTs) {
        const now = moment(Date.now());
        const notaryLastPingTime = moment(parseInt(notaryLastPingTs, 10));
        const notaryInterval = now.diff(notaryLastPingTime, 'seconds');
        if (notaryInterval && notaryInterval <= 20) {
          userInSessionStatus[sessionDoc._id].notary = true
        }
      }
    }))
    const apiResponse = {
      userInSessionStatus
    }
    return res.status(200).json(apiResponse);
  } catch (err) {
    console.log(err);
    return res.status(500).json({err: 'Server Error'});
  }
}
exports.exportSessions = async (req, res) => {
  try {
    let recipients;
    const exportView = req.body?.exportView;
    if (!req.body?.extraExportEmails || req.body.exportItems === undefined || !exportView) {
      return res.status(400).json({msg: 'Invalid request'});
    } else {
      recipients = req.body.extraExportEmails;
    }
    const userId = req.user._id;
    const today = moment().utc().startOf('day').toDate();
    const count = await sessionExportsModel.countDocuments({
      requestedBy: userId,
      createdAt: {$gte: today}
    });
    if (count >= 10) {
      return res.status(200).json({msg: 'To Many export requests for today, Please try again later'});
    }
    let pubChannel: Channel, connection: Connection
    const rmqHost = process.env.RMQ_HOST || 'localhost';
    const rmqUser = process.env.RMQ_USER || 'guest';
    const rmqPwd = process.env.RMQ_PASS || 'guest';
    const rmqConnString = `amqp://${encodeURIComponent(rmqUser)}:${encodeURIComponent(rmqPwd)}@${rmqHost}:5672`;
    connection = await amqplib.connect(rmqConnString);
    pubChannel = await connection.createChannel();
    const exportItems = req.body.exportItems
    const exportDoc = new sessionExportsModel({
      requestedBy: userId,
      recipients,
      exportItems,
      exportView
    })
    const message = Buffer.from(JSON.stringify({exportid: exportDoc._id}))
    pubChannel.sendToQueue(
      'export_sessions',
      message
    )
    await exportDoc.save();
    pubChannel.close();
    connection.close();
    return res.status(200).json({msg: 'We are processing your export. \
      It will take few minutes to email you the export'});
  } catch (err) {
    console.log(err);
    return res.status(500).json({msg: 'Something went wrong, Please try again'});
  }
}

exports.createBackUpOfOriginalFiles = async (req, res) => {
  try {
    const user = req.user
    const files = req.files;
    const sessionid = req.body.sessionid || false
    if (files) {
      console.log('files', files)
      await Promise.all(_.map(files, async (file) => {
        console.log('file', file)
        console.log(`file: ${file.originalname} is backedup in originalform.`);
        const documentModelToSave = {
          documentCategory: 'initial_document_backup',
          name: file.originalname,
          url: localGetSignedUrl(file.key),
          type: file.mimetype,
          size: file.size,
          key: file.key,
          bucketName: file.bucket,
          uploadedBy: user._id,
          uploadedStage: 'initial_stage'
        }
        if (sessionid) {
          // @ts-ignore
          documentModelToSave.sessionid = sessionid;
        }
        console.log('documentModelToSave', documentModelToSave)
        const uploadedDocument = new DocumentModel(documentModelToSave);
        await uploadedDocument.save();
      }));
    }
    return res.status(200).json({msg: 'Files backedUp.'});
  } catch (err) {
    console.log(err);
    return res.status(500).json({msg: 'Something went wrong, Please try again'});
  }
}
