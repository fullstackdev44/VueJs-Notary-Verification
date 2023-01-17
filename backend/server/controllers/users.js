const moment = require("moment");
const uuid = require("uuid");
const { matchedData } = require("express-validator");
const utils = require("../middleware/utils");
const controller = require("./api");
import { NotaryDataModel } from "../models/notarydata";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const stripeTest = require("stripe")(process.env.STRIPE_SECRET_KEY_TEST);
const Vendors = require("../models/vendors");
const User = require("../models/user");
/*********************
 * Private functions *
 *********************/

/**
 * Creates a new item in database
 * @param {Object} req - request object
 */
const createItem = async (req) => {
  return new Promise((resolve, reject) => {
    const user = new model({
      name: req.name,
      email: req.email,
      password: req.password,
      role: req.role,
      phone: req.phone,
      city: req.city,
      country: req.country,
      verification: uuid.v4(),
      promoCode: req.promoCode,
    });
    user.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message));
      }
      // Removes properties with rest operator
      const removeProperties = ({
        // eslint-disable-next-line no-unused-vars
        password,
        // eslint-disable-next-line no-unused-vars
        blockExpires,
        // eslint-disable-next-line no-unused-vars
        loginAttempts,
        ...rest,
      }) => rest;
      resolve(removeProperties(item.toObject()));
    });
  });
};

/********************
 * Public functions *
 ********************/

/**
 * Get items function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItems = async (req, res) => {
  try {
    if (req.user.role === "user") {
      const id = await utils.isIDGood(req.user.id);
      const user = await db.getItem(id, model);

      res.status(200).json({
        ...user,
      });

    } else {
      const query = await db.checkQueryString(req.query);
      res.status(200).json(await db.getItems(req, model, query));
    }
  } catch (error) {
    console.log(error);
    utils.handleError(res, error);
  }
};

/**
 * Get item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItem = async (req, res) => {
  try {
    req = matchedData(req);
    const id = await utils.isIDGood(req.id);
    res.status(200).json(await db.getItem(id, model));
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.me = async (req, res) => {
  // console.log("me: ", req.user);
  try {
    let user = req.user;
    // let hostName = req.hostname;
    // console.log("req.headers", req.headers);
    const hostName = req?.headers?.origin;
    console.log("hostName", hostName);
    let onBoarding = false;
    if (user.role === "notary" && !user.memberTypeProWhenInvited) {
      const notryDone = await NotaryDataModel.findOne({ userId: req.user._id });
      if (notryDone && (
        notryDone.commissionExpiresOn !== "" &&
        notryDone.commissionExpiresOn !== undefined &&
        user.state !== "" &&
        user.state !== undefined &&
        user.commissionNumber !== "" &&
        user.commissionNumber !== undefined &&
        notryDone.notaryCopyOfCommissionLetterName !== "" &&
        notryDone.notaryCopyOfCommissionLetterName !== undefined &&
        notryDone.stripeAccountName !== "" &&
        notryDone.stripeAccountName !== undefined
      )) {
        if (req.query.stripe && req.query.stripe === "true") {
          let stripeToUse;
          if (user.testingacc) {
            stripeToUse = stripeTest;
          } else {
            stripeToUse = stripe;
          }
          const account = await stripeToUse.accounts.retrieve(notryDone.stripeAccountName);
          notryDone.stripeFullAccountDetails = account;
          if (notryDone.stripeFullAccountDetails &&
            notryDone.stripeFullAccountDetails.requirements &&
            notryDone.stripeFullAccountDetails.requirements.errors &&
            notryDone.stripeFullAccountDetails.requirements.errors.length > 0) {
            onBoarding = false;
          } else {
            onBoarding = true;
          }
          if (onBoarding && notryDone.stripeFullAccountDetails &&
            notryDone.stripeFullAccountDetails.capabilities &&
            notryDone.stripeFullAccountDetails.capabilities.transfers !== "active") {
            onBoarding = false;
          }
        } else {
          onBoarding = true;
        }
      }
    } else if (user.role === "notary" && user.memberTypeProWhenInvited) {
      const notryDone = await NotaryDataModel.findOne({ userId: req.user._id });
      if (notryDone.commissionExpiresOn !== "" &&
        notryDone.commissionExpiresOn !== undefined &&
        user.state !== "" &&
        user.state !== undefined &&
        user.commissionNumber !== "" &&
        user.commissionNumber !== undefined) {
          onBoarding = true;
      }
    } else {
      onBoarding = true;
    }
    let vendorDoc;
    let vendorQuery;
    if (hostName && hostName !== "http://localhost:8080" && hostName !== "https://app.bluenotary.us") {
    // if (true) {
      vendorQuery = {
        whitelabel_baseurl: {"$regex": hostName, "$options": "i"},
        deleted: {"$ne": true},
      };
    }
    if (user.vendor || user.vendoradmin) {
      vendorQuery = {
        _id: user.vendor || user.vendoradmin,
        deleted: {"$ne": true},
      };
    }
    console.log("vendorQuery", vendorQuery);
    if (vendorQuery) {
      vendorDoc = await Vendors.findOne(vendorQuery, {
        "whitelabel": 1,
        "whitelabel_baseurl": 1,
        "whitelabel_imageurl": 1,
        "whitelabel_imagetext": 1,
        "whitelabel_click_linkurl": 1,
        "whitelabel_selective": 1,
        "hideUpgradeOptions": 1,
        "dontAllowRegistering": 1,
        "dontAllowNewSession": 1,
        "hideInformationLinks": 1,
        "strictPrepareDocStage": 1,
        "skipSessionCharges": 1,
        "proSubscriptionSettings": 1,
        "enableManageSubscriptionSettings": 1,
        "openCallSettings": 1,
        "allowLSAApplication": 1,
        "crisp_id": 1,
        "vendor_ui_token": 1,
        "sessionChargeOnBusinessUser": 1,
      });
    }
    if (user.memberType === "title_pro" || user.memberType === "title_hybrid" || user.memberType === "signing_service" || user.memberType === "business"
    || user.memberType === "business_basic" || user.memberType === "business_pro" || user.memberType === "business_hybrid") {
      user.landingView = "/business/business-sessions";
    }
    if (user.notaryInvitedByBusinessUserId) {
      const notaryInvitedByBusinessUserDoc = await User.findOne({
        _id: user.notaryInvitedByBusinessUserId,
        deleted: {"$ne": true},
      });
      if (notaryInvitedByBusinessUserDoc) {
        user.notaryInvitedByBusinessUserDoc = notaryInvitedByBusinessUserDoc;
      }
    }
    res.status(200).json({
      onBoarding,
      user,
      vendorDoc,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.me_sign = async (req, res) => {
  try {
    // let hostName = req.hostname;
    // console.log("req.headers", req.headers);
    let hostName = req?.headers?.origin;
    console.log("hostName", hostName);
    if (!hostName) {
      hostName = req?.headers?.host;
    }
    console.log("final hostName", hostName);
    let vendorDoc;
    if (hostName && hostName !== "http://localhost:8080" && hostName !== "https://app.bluenotary.us") {
    // if (true) {
      vendorDoc = await Vendors.findOne({
        whitelabel_baseurl: {"$regex": hostName, "$options": "i"},
        deleted: {"$ne": true},
      }, {
        "whitelabel": 1,
        "whitelabel_baseurl": 1,
        "whitelabel_imageurl": 1,
        "whitelabel_imagetext": 1,
        "whitelabel_click_linkurl": 1,
        "whitelabel_selective": 1,
        "hideUpgradeOptions": 1,
        "dontAllowRegistering": 1,
        "dontAllowNewSession": 1,
        "hideInformationLinks": 1,
        "strictPrepareDocStage": 1,
        "skipSessionCharges": 1,
        "proSubscriptionSettings": 1,
        "enableManageSubscriptionSettings": 1,
        "openCallSettings": 1,
        "allowLSAApplication": 1,
        "crisp_id": 1,
        "vendor_ui_token": 1,
        "sessionChargeOnBusinessUser": 1,
      });
    }
    res.status(200).json({
      vendorDoc,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Update item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.updateItem = async (req, res) => {
  try {
    req = matchedData(req);
    const id = await utils.isIDGood(req.id);
    const doesEmailExists = await emailer.emailExistsExcludingMyself(id, req.email);
    if (!doesEmailExists) {
      res.status(200).json(await db.updateItem(id, model, req));
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Create item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.createItem = async (req, res) => {
  try {
    // Gets locale from header 'Accept-Language'
    const locale = req.getLocale();
    req = matchedData(req);
    const doesEmailExists = await emailer.emailExists(req.email);
    if (!doesEmailExists) {
      const item = await createItem(req);
      emailer.sendRegistrationEmailMessage(locale, item);
      res.status(201).json(item);
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Delete item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.deleteItem = async (req, res) => {
  try {
    req = matchedData(req);
    const id = await utils.isIDGood(req.id);
    res.status(200).json(await db.deleteItem(id, model));
  } catch (error) {
    utils.handleError(res, error);
  }
};
