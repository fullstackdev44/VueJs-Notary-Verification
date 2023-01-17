import aws from 'aws-sdk';
import _ from 'lodash';
import _path from 'path'
import { DocumentModel } from '../models/documentsdata';
const fs = require('fs');
const sleep = require('util').promisify(setTimeout);
import { NotaryDataModel } from '../models/notarydata';
const User = require('../models/user');

const waitFor = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

aws.config.update({
  apiVersion: '2006-03-01',
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey,
  region: process.env.AWSRegion
})
const s3 = new aws.S3()

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

const generateNotarySeal = async (userDoc, notaryDataDoc) => {
  let sealData;
  const {spawn} = require('child_process');
  const path = require('path');
  const template = path.resolve('./public/templates/' + userDoc.state + '.jpg');
  console.log('template', template);
  if (!fs.existsSync(template)) {
    return false;
  }
  const commissionNumberEscaped = userDoc.commissionNumber.replace(/[^a-zA-Z0-9]/g, '');
  // For local use python3.9 or python3.6
  console.log(commissionNumberEscaped)
  console.log(path.resolve('./scripts/alter_seal_template.py'))
  const python = spawn('python3', [
    path.resolve('./scripts/alter_seal_template.py'),
    userDoc.state,
    userDoc.name,
    userDoc.commissionNumber,
    notaryDataDoc.commissionExpiresOn || '',
    template,
    userDoc.county || '',
    commissionNumberEscaped,
    'jpg'
  ]);
  await new Promise( (resolve) => {
    python.on('close', resolve);
  });
  await waitFor(1000);
  const sealFile = path.resolve('./public/templates/seal-' + commissionNumberEscaped + '.jpg');
  console.log('sealFilesealFile', sealFile);
  if (fs.existsSync(sealFile)) {
    console.log('inside')
    const fileContent = fs.readFileSync(sealFile);
    console.log('fileContent', fileContent);
    const params = {
      Bucket: process.env.AWSBucket,
      Key: Date.now().toString() + 'seal-' + commissionNumberEscaped + '.jpg',
      Body: fileContent,
      // ACL: "public-read",
      XAmzAcl: 'public-read'
    };
    try {
      sealData = await s3.upload(params).promise();
      // fs.unlinkSync(sealFile);
      return sealData;
    } catch (err) {
      console.log(err);
    }
  }
  return false;
};

const generateNotarySealPng = async (userDoc, notaryDataDoc) => {
  let sealData;
  const {spawn} = require('child_process');
  const path = require('path');
  const template = path.resolve('./public/templates/' + userDoc.state + '.png');
  console.log('template', template);
  if (!fs.existsSync(template)) {
    return false;
  }
  const commissionNumberEscaped = userDoc.commissionNumber.replace(/[^a-zA-Z0-9]/g, '');
  // For local use python3.9 or python3.6
  console.log(commissionNumberEscaped)
  console.log(path.resolve('./scripts/alter_seal_template.py'))
  const python = spawn('python3', [
    path.resolve('./scripts/alter_seal_template.py'),
    userDoc.state,
    userDoc.name,
    userDoc.commissionNumber,
    notaryDataDoc.commissionExpiresOn || '',
    template,
    userDoc.county || '',
    commissionNumberEscaped,
    'png'
  ], {
    cwd: process.cwd(),
    detached: true,
    stdio: 'inherit'
  });
  await new Promise( (resolve) => {
    python.on('close', resolve);
  });
  await waitFor(2000);
  const sealFile = path.resolve('./public/templates/seal-' + commissionNumberEscaped + '.png');
  console.log('sealFilesealFile2', sealFile);
  console.log('fs.existsSync(sealFile)', fs.existsSync(sealFile));
  if (fs.existsSync(sealFile)) {
    console.log('inside')
    const fileContent = fs.readFileSync(sealFile);
    console.log('fileContent', fileContent);
    const params = {
      Bucket: process.env.AWSBucket,
      Key: Date.now().toString() + 'seal-' + commissionNumberEscaped + '.png',
      Body: fileContent,
      // ACL: "public-read",
      XAmzAcl: 'public-read'
    };
    try {
      sealData = await s3.upload(params).promise();
      // fs.unlinkSync(sealFile);
      return sealData;
    } catch (err) {
      console.log(err);
    }
  }
  return false;
};

export const preprocessSessionDocumentBeforeSession = async (sessionId, documentId, inputFileObject) => {
  // if (sessionId) {
  //   return 'Document Data not found'
  // }
  let documentDoc;
  if (documentId) {
    documentDoc = await DocumentModel.findOne({
      _id: documentId
    })
    if (!documentDoc) {
      return 'Document Data not found'
    }
  } else {
    documentDoc = inputFileObject
    documentId = (Math.random() + 1).toString(36).substring(2);
  }
  console.log('documentId', documentId)
  let signedFile
  try {
    if (documentDoc && !inputFileObject) {
      documentDoc.preprocessing = 'started'
      await documentDoc.save()
    }
    const fileObject = await getObject(documentDoc.bucketName || documentDoc.bucket, documentDoc.key);
    const fileBody = fileObject.Body as string
    const documentKeyLowerCase = documentDoc.key.toLowerCase()
    const documentExtension = documentKeyLowerCase.substr(documentKeyLowerCase.lastIndexOf('.') + 1);
    const onlyDocumentName = (documentDoc.name || documentDoc.key).replace(/\.[^/.]+$/, '')
    let outputFile
    if (documentExtension === 'pdf') {
      const originalFileName = 'original_' + documentId + '.pdf'
      const inputFile = _path.join(__dirname, '../../../', 'documenttmp', originalFileName)
      await fs.writeFileSync(inputFile, fileBody)
      outputFile = _path.join(__dirname, '../../../', 'documenttmp', originalFileName)
    } else if (['png', 'jpg', 'jpeg'].includes(documentExtension)) {
      const originalFileName = 'original_' + documentId + '.' + documentExtension
      const inputFile = _path.join(__dirname, '../../../', 'documenttmp', originalFileName)
      outputFile = _path.join(__dirname, '../../../', 'documenttmp', 'processed_' + documentId + '.pdf')
      await fs.writeFileSync(inputFile, fileBody)
      const pdfkitInstance = new (require('pdfkit'))({
        autoFirstPage: false
      });
      const img = pdfkitInstance.openImage(inputFile);
      pdfkitInstance.addPage({size: [img.width + 100, img.height + 400]});
      pdfkitInstance.image(img, 50, 50);
      pdfkitInstance.end();
      await pdfkitInstance.pipe(fs.createWriteStream(outputFile));
      await sleep(3000)
    }
    console.log('outputFile', outputFile)
    const content = fs.readFileSync(outputFile);
    console.log('content', content)
    const finalDocumentKey = 'final_' + String(documentId) + '_' + onlyDocumentName + '.pdf'
    console.log('finalDocumentKey', finalDocumentKey)
    signedFile = await upload(process.env.AWSBucket, finalDocumentKey, content, 'application/pdf')
    const stats = fs.statSync(outputFile)
    console.log('signedFile', signedFile)
    console.log('stats', stats)
    if (documentDoc && !inputFileObject) {
      documentDoc.originalDocumentKey = documentDoc.key
      documentDoc.originalDocumentUrl = documentDoc.url
      documentDoc.originalDocumentSize = documentDoc.size
      documentDoc.name = onlyDocumentName + '.pdf'
      documentDoc.key = signedFile.Key
      documentDoc.url = localGetSignedUrl(signedFile.Key)
      documentDoc.size = stats.size
      documentDoc.preprocessing = 'completed'
      await documentDoc.save()
      console.log(documentDoc)
    }
    return {
      status: 'Success',
      doc: signedFile,
      fullDocument: documentDoc
    }
  } catch (error) {
    console.log('document preprocessing error', error)
    documentDoc.preprocessing = 'failed'
    await documentDoc.save()
    return {
      status: 'Failure',
      doc: false
    }
  }
};

export const generateNotarySealsForRemainingNotaries = async (sessionId, documentId) => {
  const notaryDatasWithoutSeal = await NotaryDataModel.find({
    sealdata: {$exists: false}
  })
  await Promise.all(_.map(notaryDatasWithoutSeal, async (notaryDataDoc) => {
    if (!notaryDataDoc.userId) {
      return false
    }
    console.log(notaryDataDoc._id)
    const userDocWithState = await User.findOne({
      _id: notaryDataDoc.userId,
      role: 'notary',
      deleted: {$ne: true},
      state: {$exists: true}
    })
    if (!userDocWithState) {
      return false
    }
    if (!userDocWithState.commissionNumber) {
      return false
    }
    const sealData = await generateNotarySeal(userDocWithState, notaryDataDoc);
    console.log('sealDatasealData', sealData);
    if (sealData) {
      notaryDataDoc.sealdata = localGetSignedUrl(sealData.key)
      notaryDataDoc.sealfilename = sealData.key
      await notaryDataDoc.save();
    }
    return true
  }));
};

export const generateNotarySealsPNGForRemainingNotaries = async (userid) => {
  let notaryDataModelFindQuery;
  if (userid) {
    notaryDataModelFindQuery = {
      userId: userid
    }
  } else {
    notaryDataModelFindQuery = {
      $or: [
        {
          buySealPurchaseExpiryDate: {$exists: true}
        },
        {
          buyComboPurchaseExpiryDate: {$exists: true}
        }
      ],
      buyPngSealfilename: {$exists: false}
    }
  }
  console.log('notaryDataModelFindQuery', notaryDataModelFindQuery)
  const notaryDatasWithoutSeal = await NotaryDataModel.find(notaryDataModelFindQuery)
  console.log('notaryDatasWithoutSeal', notaryDatasWithoutSeal.length)
  await Promise.all(_.map(notaryDatasWithoutSeal, async (notaryDataDoc) => {
    if (!notaryDataDoc.userId) {
      return false
    }
    console.log(notaryDataDoc._id)
    const userDocWithState = await User.findOne({
      _id: notaryDataDoc.userId,
      role: 'notary',
      deleted: {$ne: true},
      state: {$exists: true}
    })
    if (!userDocWithState) {
      return false
    }
    if (!userDocWithState.commissionNumber) {
      return false
    }
    console.log('userDocWithState', userDocWithState)
    const sealData = await generateNotarySealPng(userDocWithState, notaryDataDoc);
    console.log('sealDatasealData', sealData);
    if (sealData) {
      notaryDataDoc.buyPngSealdata = localGetSignedUrl(sealData.key)
      notaryDataDoc.buyPngSealfilename = sealData.key
      await notaryDataDoc.save();
    }
    return true
  }));
};
