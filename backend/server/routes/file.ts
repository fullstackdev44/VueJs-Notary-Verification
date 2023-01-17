
import aws from 'aws-sdk';
// import * as mime from 'mime-types';
// import _path from 'path';
import multer from 'multer'
import multerS3 from 'multer-s3';
const controller = require('../controllers/api');
const validate = require('../controllers/apivalidate');
const AuthController = require('../controllers/auth');
const express = require('express');
const router = express.Router();
const passport = require('passport');
import * as Limiter from "../middleware/ratelimiter";
const redisClient = require('redis').createClient();
redisClient.connect();
const requireAuth = passport.authenticate('jwt', {
  session: false
});
const trimRequest = require('trim-request');
const multer = require('multer');

aws.config.update({
  apiVersion: '2006-03-01',
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey,
  region: process.env.AWSRegion
})

const s3 = new aws.S3()

const upload = multer({
  storage: multerS3({
    s3,
    'bucket': process.env.AWSBucket,
    // acl: 'public-read',
    'x-amz-acl': 'public-read',
    'contentType': multerS3.AUTO_CONTENT_TYPE,
    'metadata': (req, file, cb) => {
      cb(null, { fieldName: file.fieldname })
    },
    'key': (req, file, cb) => {
      cb(null, Date.now().toString() + file.originalname)
    }
  })
})

// const localStorage = multer.diskStorage({
//   destination (req, file, cb) {
//     cb(null, _path.join(__dirname, '../../../', 'documenttmp'))
//   },
//   filename (req, file, cb) {
//     const ext = mime.extension(file.mimetype);
//     const fileName = file.originalname.split('.')[0];
//     cb(null, fileName + '_' + Date.now() + '.' + ext);
//   }
// })

// const uploadFileToDisk = multer({ storage: localStorage});

// File Upload Usage : uploadFileToDisk.array('file', 20),

router.post(
  '/uploadFiles',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary', 'customer']),
  validate.uploadFile,
  controller.uploadFiles
);

router.post(
  '/notaryFileUpload',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary']),
  // validate.notaryFileUpload,
  controller.notaryFileUpload
);

router.post(
  '/notaryCertificateUpload',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary']),
  controller.notaryCertificatesUpload
);

router.post(
  '/notaryCopyOfComissionLetter',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary']),
  controller.notaryCopyOfComissionLetter
);

router.post(
  '/notaryLSALetter',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary']),
  controller.notaryLSALetter
);

router.post(
  '/notaryHundredRONCompletionLetter',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary']),
  controller.notaryHundredRONCompletionLetter
);

router.post(
  '/notaryEOInsuranceDocument',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary']),
  controller.notaryEOInsuranceDocument
);

router.post(
  '/pdfEditsFinalDocumentSave/:id',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['customer', 'notary']),
  // validate.pdfEditsFinalDocumentSave,
  controller.pdfEditsFinalDocumentSave
);

router.post(
  '/pdfEditsVideoDocumentSave/:id',
  // upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['customer', 'notary']),
  controller.pdfEditsVideoDocumentSave
);

// Notary Invite Signer
router.post(
  '/invite-signer',Limiter.OpenCallslimiter(redisClient),
  upload.array('file', 20),
  // upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary', 'customer']),
  validate.validateNotaryInviteSigner,
  controller.notaryInviteSigner
);

router.post(
  '/customerFrontBackIdUpload',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['customer']),
  validate.validateCustomerPhotoId,
  controller.uploadCustomerPhotoID
);
router.post(
  '/sealdata',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary']),
  controller.saveSealFile
);
router.post(
  '/saveSignatureImageFile',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  // AuthController.roleAuthorization(['notary']),
  controller.saveSignatureImageFile
);
router.post(
  '/template-upload',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary', 'customer']),
  controller.saveDocumentTemplate
);
router.post(
  '/notaryEmailLogoUpload',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary', 'customer']),
  controller.notaryEmailLogoUpload
);
router.post(
  '/checkingPhotoIdRealTime',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary', 'customer']),
  validate.checkingPhotoIdRealTime,
  controller.checkingPhotoIdRealTime
);
// sign session simulated final doc with default dc
router.post(
  '/ssimSignDocument',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary']),
  controller.ssimSignDocument
);
router.post(
  '/saveProfile',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary']),
  controller.saveProfile
);
router.post(
  '/convertUploadedDoc',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary', 'customer']),
  controller.convertUploadedDoc
);
router.post(
  '/uploadEditedDocument',
  upload.single('file'),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary', 'customer']),
  validate.uploadEditedDocument,
  controller.uploadEditedDocument
);
router.post(
  '/filesBackUp',
  upload.array('file', 20),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary', 'customer']),
  controller.createBackUpOfOriginalFiles
);

module.exports = router;
