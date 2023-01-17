import dotenv from 'dotenv';
dotenv.config();
import * as utils from '../middleware/utils';
// import mongoose from 'mongoose'
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const stripeTest = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST);
const User = require('../models/user');

exports.stripeBuisnessSessionStatus = async (req, res) => {
  try {
    const user = req.user;
    const userModel = await User.findOne({ _id: req.user._id, deleted: {$ne: true} });
    if (userModel.upgradeStripeSessionId) {
      let stripeToUse;
      if (user.testingacc) {
        stripeToUse = stripeTest
      } else {
        stripeToUse = stripe
      }
      const session = await stripeToUse.checkout.sessions.retrieve(userModel.upgradeStripeSessionId);
      console.log('sessionsession done', session)
      if (session.payment_status === 'paid') {
        userModel.memberType = userModel.tempSubscriptionType;
        userModel.subscriptionExpiresOn = session.expires_at;
        if (session?.customer) {
          userModel.stripeSubscriptionCustomerId = session?.customer
        }
        userModel.save();
      }
      res.status(200).json(session);
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.stripeBusinessCheckoutSession = async (req, res) => {
  try {
    const user = req.user;
    const userData = await User.findOne({ _id: req.user._id, deleted: {$ne: true} })
    let stripeToUse;
    let priceId
    if (user.testingacc) {
      stripeToUse = stripeTest
      if (req.body.memberType === 'pro') {
        priceId = process.env.TEST_BUSINESS_SUBSCRIPTION_PRO_ID
      } else if (req.body.memberType === 'business_basic') {
        priceId = process.env.TEST_BUSINESS_SUBSCRIPTION_BASIC_ID
      } else if (req.body.memberType === 'business_pro') {
        priceId = process.env.TEST_BUSINESS_SUBSCRIPTION_PRO_ID
      } else if (req.body.memberType === 'business_hybrid') {
        priceId = process.env.TEST_BUSINESS_SUBSCRIPTION_PREMIUM_ID
      } else {
        priceId = process.env.TEST_BUSINESS_SUBSCRIPTION_PREMIUM_ID
      }
    } else {
      stripeToUse = stripe
      if (req.body.memberType === 'pro') {
        priceId = process.env.BUSINESS_SUBSCRIPTION_PRO_ID
      } else if (req.body.memberType === 'business_basic') {
        priceId = process.env.BUSINESS_SUBSCRIPTION_BASIC_ID
      } else if (req.body.memberType === 'business_pro') {
        priceId = process.env.BUSINESS_SUBSCRIPTION_PRO_ID
      } else if (req.body.memberType === 'business_hybrid') {
        priceId = process.env.BUSINESS_SUBSCRIPTION_PREMIUM_ID
      } else {
        priceId = process.env.BUSINESS_SUBSCRIPTION_PREMIUM_ID
      }
    }
    const sessionCreationDoc = {
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      payment_method_collection: 'if_required',
      mode: 'subscription',
      success_url: process.env.FRONT_URL + '/business/upgrade/success',
      cancel_url: process.env.FRONT_URL + '/business/account-settings'
    }
    if (req.body.memberType === 'business_basic') {
      // @ts-ignore
      sessionCreationDoc.subscription_data = {
        trial_period_days: 30
      }
    }
    if (userData.stripeSubscriptionCustomerId) {
      // @ts-ignore
      sessionCreationDoc.customer = userData.stripeSubscriptionCustomerId
    } else {
      // @ts-ignore
      sessionCreationDoc.customer_email = userData.email
    }
    const session = await stripeToUse.checkout.sessions.create(sessionCreationDoc);
    console.log('sessionsession', session)
    userData.upgradeStripeSessionId = session.id;
    userData.tempSubscriptionType = req.body.memberType;
    userData.save();
    res.status(200).json(session);
  } catch (error) {
    utils.handleError(res, error);
  }
};
