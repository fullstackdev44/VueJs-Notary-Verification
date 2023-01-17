import aws from 'aws-sdk';
import _ from 'lodash';
// import { DocumentModel } from '../models/documentsdata';
import { NewSessionModel } from '../models/newsessiondata';
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
// const sleep = require('util').promisify(setTimeout)
const ejs = require('ejs');
const path = require('path');
const User = require('../models/user');
// const moment = require('moment');

const statesWithDesc = require('../constants/state_desc.json');
const stateWiseDesc = statesWithDesc.reduce((map, stateObj) => {
  map.set(stateObj.State, stateObj.Content);
  return map;
}, new Map());

aws.config.update({
  apiVersion: '2006-03-01',
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey,
  region: process.env.AWSRegion
})
const s3 = new aws.S3()
console.log(s3)

const toUrlFriendlyName = (s) => {
  return s.toLocaleLowerCase().replace(/[^a-z0-9 ]+/g, '').replace(/ /g, '-')
}

export const generateProfileHtmlAndPublish = async (userDoc, onlyGenerateProfile) => {
  const totalBNRons = await NewSessionModel.count({
    notaryUserId: userDoc._id,
    paid: true
  })
  const templateDataObject = JSON.parse(JSON.stringify(userDoc))
  templateDataObject.totalBNRons = totalBNRons
  templateDataObject.disableProfile = userDoc.disableProfile
  const templateProfileTitle = 'BlueNotary | ' + userDoc.name + ' | Online Notary Near Me' + ' | '
    + (userDoc?.profile?.location || userDoc.state)
  templateDataObject.templateProfileTitle = templateProfileTitle
  templateDataObject.stateDisplayName = userDoc.state
  const statelink = toUrlFriendlyName(userDoc.state)
  templateDataObject.stateLink = `https://bluenotary.us/all-profiles-index-${statelink}`
  // let metaDescriptionOfProfile = 'eClosing platform for title and lending partners. Close deals
  // faster and more securely online in about' +
  //   ' 30 minutes or less using our all-in-one remote online notarization solution'
  const metaDescriptionOfProfile = 'BlueNotary profile belonging ' + userDoc.name + ' user which performs notarization activity on BlueNotary. ' + userDoc.name +
    ' is online remote notary near me in ' + (userDoc?.profile?.location || userDoc.state) + ' location. eClosing platform for title and lending partners'
  templateDataObject.metadescription = metaDescriptionOfProfile
  // console.log('templateDataObject', templateDataObject)
  const tempKeywords = [
    'Notary near me',
    userDoc.state + ' state notary near me',
    'Remote online notary',
    'Notarize documents online',
    'Authorized notary near me',
    'Documents Notarized online',
    'Notary near me in ' + userDoc.state,
    'Local Notary near me in ' + userDoc.state,
    (userDoc?.profile?.location || userDoc.state) + ' notary near me',
    (userDoc?.profile?.location || userDoc.state) + ' remove online notarization',
    (userDoc?.profile?.location || userDoc.state) + ' find notary near me',
    'Notary for hire',
    'Notary for hire in ' + (userDoc?.profile?.location || userDoc.state)
  ]
  const templateHtml = await ejs.renderFile(
    path.join(__dirname, '../../templates/profile.ejs'), {
      profile: templateDataObject.profile,
      stateLink: templateDataObject.stateLink,
      state: userDoc.state,
      templateProfileTitle,
      name: userDoc.name,
      totalBNRons,
      avatarUrl: userDoc.avatarUrl,
      metadescription: metaDescriptionOfProfile,
      tempKeywords
    }
  );
  // console.log('templateHtml', templateHtml)
  const userName = userDoc.name.toLowerCase().replace(/[^a-z0-9 ]+/g, '').replace(/ /g, '-')
  const inputFileName = './profile/' + userName
  console.log('inputFileName', inputFileName)
  userDoc.oldProfileFileName = inputFileName
  userDoc.blueNotaryProfileUrl = 'https://bluenotary.us/profile/' + userName
  await userDoc.save()
  await fs.writeFileSync(inputFileName, templateHtml)
  if (!onlyGenerateProfile) {
    const { stdout, stderr } = await exec('scp -r ./profile root@bluesales://var/www/html/');
    console.log(stdout)
    console.log(stderr)
  }
  templateDataObject.profileLink = userDoc.blueNotaryProfileUrl
  return templateDataObject
};

export const generateAllProfiles = async () => {
  const userDocs = await User.find({
    role: 'notary',
    profileFilled: true,
    disableProfile: {$ne: true},
    memberTypeProWhenInvited: {$ne: true},
    testingacc: {$ne: true},
    deleted: {$ne: true}
  })
  const stateNames = {};
  const allProfiles = [];
  const allProfilesSet = new Set();
  await Promise.all(_.map(userDocs, async (userDoc) => {
    if (userDoc.state) {
      const profile = await generateProfileHtmlAndPublish(userDoc, true);
      if (!allProfilesSet.has(profile.profileLink)) {
        const stateName = String(profile.stateDisplayName).replace(/\ /g, '');
        if (stateNames[stateName] === undefined) {
          stateNames[stateName] = profile.stateLink
        }
        let cardSubTxt = '';
        const profileDict = userDoc?.profile || {}
        if (profileDict.headline && profileDict.bio) {
          cardSubTxt += `<b>${String(profileDict.headline).substring(0, 20)}</b></ br> ${profileDict.bio.substring(0, 100)}`;
        } else if (profileDict.years_exp) {
          cardSubTxt += `${String(profileDict.years_exp)} Years of Experience`;
        } else if (profileDict.location) {
          cardSubTxt += `Located in ${profileDict.location}`;
        }
        allProfiles.push({
          name: profile.name,
          location: profile.location,
          link: profile.profileLink,
          state: profile.stateDisplayName,
          avatarUrl: profile.avatarUrl,
          cardSubTxt,
          updatedAt: userDoc.updatedAt.toISOString().split('.')[0] + '+00:00'
        })
        allProfilesSet.add(profile.profileLink);
      }
    }
  }));

  try {
    const { stdout, stderr } = await exec('scp -r ./profile root@bluesales://var/www/html/');
    console.log(stdout)
    console.log(stderr)
  } catch (error) {
    console.log('Copy Error: ./profiles', error)
    return;
  }

  console.log('Generating allProfilesIndex');
  const allProfilesIndexHtml = await ejs.renderFile(
    path.join(__dirname, '../../templates/allProfilesIndex.ejs'),
    {statesList: Object.entries(stateNames), profiles: allProfiles}
  );
  await fs.writeFileSync('all-profiles-index.html', allProfilesIndexHtml);
  console.log('Generated allProfilesIndex, scping...');
  if (process.env.NODE_ENV === 'production') {
    try {
      const { stdout, stderr } = await exec(`scp all-profiles-index.html \
        root@bluesales://var/www/html/all-profiles-index.html`);
      console.log(stdout)
      console.log(stderr)
    } catch (error) {
      console.log('Copy Error: all-profiles-index.html', error)
      return
    }
  }
  const allProfilesStateWise = _.groupBy(allProfiles, (x) => x.state);
  const stateLinks = [];
  console.log('generating allProfilesIndexStateWise');
  for (const state of Object.keys(allProfilesStateWise)) {
    const fileName = `all-profiles-index-${toUrlFriendlyName(state)}.html`;
    const stateProfiles = allProfilesStateWise[state]
    let stateDescTxt = '';
    if (stateWiseDesc.has(state)) {
      stateDescTxt = stateWiseDesc.get(state);
    }
    const stateProfileMetaData = 'Profiles of all BlueNotary Notaries practicing in ' + state + ' state. All of the notaries near me in ' + state + ' location. BlueNotary Notary network covers all states of USA. eClosing platform for title and lending partners.'
    const allProfilesIndexesStateWiseHtml = await ejs.renderFile(
      path.join(__dirname, '../../templates/allProfilesIndexStateWise.ejs'),
      {stateDisplayName: state, stateProfiles, stateProfileMetaData, stateDescTxt}
    );
    await fs.writeFileSync(fileName, allProfilesIndexesStateWiseHtml);
    console.log(`State wise file: ${fileName}`);
    const link = `https://bluenotary.us/${fileName.replace(/\.html$/g, '')}`;
    stateLinks.push(link);
  }
  if (process.env.NODE_ENV === 'production') {
    try {
      const { stdout, stderr } = await exec(`scp all-profiles-index-* \
        root@bluesales://var/www/html/`);
      console.log(stdout)
      console.log(stderr)
    } catch (error) {
      console.log(`Copy Error all profile index states`, error)
    }
  }
  console.log(stateLinks);
  console.log('generated allProfilesIndexStateWisec scping...');
  const lastmod = new Date().toISOString().split('.')[0] + '+00:00';
  console.log('Generating sitemap.xml');
  const sitemapXML = await ejs.renderFile(
    path.join(__dirname, '../../templates/sitemap.ejs'), {
      profiles: allProfiles, lastmod, stateLinks
    }
  );
  await fs.writeFileSync('sitemap.xml', sitemapXML);
  if (process.env.NODE_ENV === 'production') {
    try {
      const { stdout, stderr } = await exec(`scp sitemap.xml \
        root@bluesales://var/www/html/sitemap.xml`);
      console.log(stdout)
      console.log(stderr)
    } catch (error) {
      console.log('Copy Error: sitemap.xml', error)
    }
  }
  console.log(`Total profiles generated: ${allProfiles.length}`)
  console.log(`States: ${String(Object.keys(stateNames))}`)
};
