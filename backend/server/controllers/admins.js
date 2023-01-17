/* eslint-disable */

const utils = require("../middleware/utils");
const { matchedData } = require("express-validator");
const fs = require("fs");
const path = require("path");
const User = require("../models/user");
import { NotaryDataModel } from "../models/notarydata";
import { NewSessionModel } from "../models/newsessiondata";
import { DocumentModel } from "../models/documentsdata";
import { IdentityModel } from "../models/identitydata";
import { SessionDraftsModel } from "../models/sessiondraftsdata";
const UserAccess = require("../models/userAccess");
import emailer from "../middleware/emailer";
const SessionUserLogs = require("../models/sessionUserLogs");
const BuyDCLogs = require("../models/buyDCLogs");
const BuySealLogs = require("../models/buySealLogs");
const BuyComboLogs = require("../models/buyComboLogs");
const Vendors = require("../models/vendors");
const SessionStatModel = require("../models/sessionstat");
const apiController = require("./api");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const stripeTest = require("stripe")(process.env.STRIPE_SECRET_KEY_TEST);
const redis = require("redis");
import _ from "lodash";
import mongoose from "mongoose";
import moment from "moment";

const APPROVED_STATES = [
  "Alaska",
  "Arizona",
  "Colorado",
  "Florida",
  "Hawaii",
  "Idaho",
  "Kansas",
  "Kentucky",
  "Minnesota",
  "Montana",
  "Missouri",
  "Nevada",
  "New Jersey",
  "New Hampshire",
  "New Mexico",
  "New York",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "Tennessee",
  "Texas",
  "Utah",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wyoming",
];

let redisClient;
(async () => {
  redisClient = redis.createClient();
  redisClient.on("error", (err) => console.log(`Redis Error: ${err}`));
  redisClient.on("connect", () => console.log("Connected to redis"));
  await redisClient.connect();
})();

/*********************
 * Private functions *
 *********************/
exports.adminTests = async (req, res) => {
  try {
    req = matchedData(req);
    console.log(req);
    res.status(201).json(req);
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.approveUser = async (req, res) => {
  try {
    const email = req.params && req.params.email;
    if (!email) {
      res.status(400).json({
        error: "Please provide email.",
      });
    }
    const user = await User.findOne({email, deleted: {"$ne": true}});
    console.log(user);
    if (user) {
      if (!user.verified) {
        res.status(200).json({
          status: false,
          message: "Email is not verified yet by this user.",
        });
      } else if (user.approve && user.approve === "inactive") {
        user.approve = "active";
        user.save();
        emailer.sendNotaryApprovalEmailMessage(user);
        res.status(200).json({
          status: true,
          message: "User approved successfully.",
        });
      } else {
        res.status(200).json({
          status: false,
          message: "User with provided email is already approved.",
        });
      }
    } else {
      res.status(200).json({
        status: false,
        message: "User with the provided email does not exists, please check email and try again.",
      });
    }

  } catch (error) {
    utils.handleError(res, error);
  }
};

// Reject user
exports.rejectUser = async (req, res) => {
  try {
    const email = req.params && req.params.email;
    if (!email) {
      res.status(400).json({
        error: "Please provide email.",
      });
    }
    const user = await User.findOne({email, deleted: {"$ne": true}});
    console.log(user);
    if (user) {
      if (!user.verified) {
        res.status(200).json({
          status: false,
          message: "Email is not verified yet by this user.",
        });
      } else if (user.approve && user.approve !== "inactive") {
        user.approve = "inactive";
        user.save();
        res.status(200).json({
          status: true,
          message: "User rejected successfully.",
        });
      } else {
        res.status(200).json({
          status: false,
          message: "User with provided email is already rejected.",
        });
      }
    } else {
      res.status(200).json({
        status: false,
        message: "User with the provided email does not exists, please check email and try again.",
      });
    }

  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.approveLSAUser = async (req, res) => {
  try {
    const notaryUserId = req.params && req.params.notaryUserId;
    if (!notaryUserId) {
      res.status(400).json({
        error: "Please provide notaryUserId.",
      });
    }
    const user = await User.findOne({_id: notaryUserId, deleted: {"$ne": true}});
    console.log(user);
    if (user) {
      if (user.lsaApprovalStatus === "approval_pending" || user.lsaApprovalStatus === "rejected") {
        user.lsaApprovalStatus = "approved";
        user.lsaApproved = true;
        await user.save();
        emailer.sendLSANotaryApprovalEmailMessage(user);
        res.status(200).json({
          status: true,
          message: "User approved successfully for LSA.",
        });
      } else if (user.lsaApprovalStatus === "approved") {
        res.status(200).json({
          status: true,
          message: "User is already approved for LSA.",
        });
      } else {
        res.status(200).json({
          status: false,
          message: "Invalid Status of user",
        });
      }
    } else {
      res.status(200).json({
        status: false,
        message: "User with the provided id does not exists, please check id and try again.",
      });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.rejectLSAUser = async (req, res) => {
  try {
    const notaryUserId = req.params && req.params.notaryUserId;
    if (!notaryUserId) {
      res.status(400).json({
        error: "Please provide notaryUserId.",
      });
    }
    const user = await User.findOne({_id: notaryUserId, deleted: {"$ne": true}});
    console.log(user);
    if (user) {
      if (user.lsaApprovalStatus === "approval_pending" || user.lsaApprovalStatus === "approved") {
        user.lsaApprovalStatus = "rejected";
        await user.save();
        res.status(200).json({
          status: true,
          message: "User rejected successfully for LSA.",
        });
      } else if (user.lsaApprovalStatus === "rejected") {
        res.status(200).json({
          status: true,
          message: "User is already rejected for LSA.",
        });
      } else {
        res.status(200).json({
          status: false,
          message: "Invalid Status of user",
        });
      }
    } else {
      res.status(200).json({
        status: false,
        message: "User with the provided id does not exists, please check id and try again.",
      });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

// Make user admin
exports.makeUserAdmin = async (req, res) => {
  try {
    const email = req.params && req.params.email;
    if (!email) {
      res.status(400).json({
        error: "Please provide email.",
      });
    }
    const user = await User.findOne({email, deleted: {"$ne": true}});
    console.log(user);
    if (user) {
      if (!user.verified) {
        res.status(200).json({
          status: false,
          message: "Email is not verified yet by this user.",
        });
      } else if (user.approve && user.approve === "inactive") {
        res.status(200).json({
          status: false,
          message: "User is not approved yet, please approve it first.",
        });
      } else if (user.role !== "admin") {
        user.role = "admin";
        user.save();
        res.status(200).json({
          status: true,
          message: "User is now admin.",
        });
      } else {
        res.status(200).json({
          status: false,
          message: "User with provided email is already an admin.",
        });
      }
    } else {
      res.status(200).json({
        status: false,
        message: "User with the provided email does not exists, please check email and try again.",
      });
    }

  } catch (error) {
    utils.handleError(res, error);
  }
};

// Regenerate Notary Buy DC
exports.regenerateNotaryBuyDC = async (req, res) => {
  try {
    const email = req.params && req.params.email;
    if (!email) {
      res.status(400).json({
        error: "Please provide email.",
      });
    }
    const user = await User.findOne({email, deleted: {"$ne": true}});
    console.log(user);
    if (user) {
      apiController.generateBuyDCForOneUser(email);
      res.status(200).json({
        status: true,
        message: "Purchased DC is regenerated",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "User with the provided email does not exists, please check email and try again.",
      });
    }

  } catch (error) {
    utils.handleError(res, error);
  }
};

// Fetch notaries
exports.fetchNotaries = async (req, res) => {
  try {
    const email = req.body.email;
    const showReadyForApprovalNotaries = req.body.showReadyForApprovalNotaries || false;
    const showNotariesFromApprovedStates = req.body.showNotariesFromApprovedStates || false;
    const showNotariesFromNonApprovedStates = req.body.showNotariesFromNonApprovedStates || false;
    const showLSAApprovalNotaries = req.body.showLSAApprovalNotaries || false;
    const hideCommissionExpiredNotaries = req.body.hideCommissionExpiredNotaries || false;
    let notaries = null;
    let notaryQuery = {
      role: "notary",
      deleted: {"$ne": true},
    };
    if (showReadyForApprovalNotaries) {
      notaryQuery.localOnboardingFilledFlag = true;
      notaryQuery.approve = {"$ne": "active"};
    }
    if (showNotariesFromApprovedStates) {
      notaryQuery.state = {"$in": APPROVED_STATES};
    }
    if (showNotariesFromNonApprovedStates) {
      notaryQuery.state = {"$nin": APPROVED_STATES};
    }
    if (showLSAApprovalNotaries) {
      notaryQuery.lsaApprovalStatus = "approval_pending";
    }
    if (hideCommissionExpiredNotaries) {
      notaryQuery.isCommissionExpired = {"$ne": true};
    }
    if (email === null || email === "") {
      console.log("notaryQuery", notaryQuery);
      notaries = await User.paginate(notaryQuery, { page: req.params.id, limit: 10, sort: { createdAt: -1 } });
    } else {
      // email = email.replace(/\+/i, '\+')
      // notaryQuery.email = { $regex: email, $options: "i"};
      // console.log("email", email)
      const seatchString = new RegExp(email, "i");
      notaryQuery.$or = [
        {
          email: seatchString,
        },
        {
          first_name: seatchString,
        },
        {
          last_name: seatchString,
        },
        {
          name: seatchString,
        },
      ];
      notaries = await User.paginate(notaryQuery, { page: req.params.id, limit: 10, sort: { createdAt: -1 } });
    }
    let notariesData =  [];
    if (notaries) {
      for (const notary of notaries.docs) {
        const notaryDocuments = await NotaryDataModel.findOne({ userId: notary._id });
        let notatyDataDocument = false;
        let onBoarding = false;
        notatyDataDocument = notaryDocuments;

        if (notaryDocuments && notary.approve !== "active") {
          if (notaryDocuments.commissionExpiresOn !== "" &&
          notaryDocuments.commissionExpiresOn !== undefined &&
            notary.state !== "" &&
            notary.state !== undefined &&
            notary.commissionNumber !== "" &&
            notary.commissionNumber !== undefined &&
            notaryDocuments.notaryCopyOfCommissionLetterName !== "" &&
            notaryDocuments.notaryCopyOfCommissionLetterName !== undefined &&
            notaryDocuments.stripeAccountName !== "" &&
            notaryDocuments.stripeAccountName !== undefined
          ) {
            let stripeToUse;
            if (notary.testingacc) {
              stripeToUse = stripeTest;
            } else {
              stripeToUse = stripe;
            }
            const account = await stripeToUse.accounts.retrieve(notaryDocuments.stripeAccountName);
            notaryDocuments.stripeFullAccountDetails = account;
            if (notaryDocuments.stripeFullAccountDetails &&
              notaryDocuments.stripeFullAccountDetails.requirements &&
              notaryDocuments.stripeFullAccountDetails.requirements.errors &&
              notaryDocuments.stripeFullAccountDetails.requirements.errors.length > 0) {
              onBoarding = false;
            } else {
              onBoarding = true;
            }
            if (onBoarding && notaryDocuments.stripeFullAccountDetails &&
              notaryDocuments.stripeFullAccountDetails.capabilities &&
              notaryDocuments.stripeFullAccountDetails.capabilities.transfers !== "active") {
              onBoarding = false;
            }
          }
        }
        if (notary.approve === "active") {
          onBoarding = true;
        }
        const notarySession = await UserAccess.findOne({ email: notary.email }).sort({ createdAt: -1 }).limit(1);
        let notatyDataSession = false;
        if (notarySession) {
          notatyDataSession = notarySession;
        }
        notariesData.push({
          notary,
          onBoarding,
          notatyDataDocument,
          notatyDataSession,
        });
      }

      const  paginate = {totalDocs: notaries.totalDocs,
                        offset: notaries.offset,
                        limit: notaries.limit,
                        totalPages: notaries.totalPages,
                        page: notaries.page,
                        pagingCounter: notaries.pagingCounter,
                        hasPrevPage: notaries.hasPrevPage,
                        hasNextPage: notaries.hasNextPage,
                        prevPage: notaries.prevPage,
                        nextPage: notaries.nextPage,
                      };

      res.status(200).json({
        notaryData: notariesData,
        paginate: paginate,
      });
    } else {
      res.status(200).json({
        notaryData: [],
      });
    }

  } catch (error) {
    utils.handleError(res, error);
  }
};
// Fetch Customers
exports.fetchCustomers = async (req, res) => {
  try {
    const email = req.body.email;
    let customers = null;
    if (email === null || email === "") {
      customers = await User.paginate({role: "customer", deleted: {"$ne": true}}, { page: req.params.id, limit: 10, sort: { createdAt: -1 } });
    } else {
      const seatchString = new RegExp(req.body.email, "i");
      const userFindQuery = {
        "$or": [
          {
            email: seatchString,
          },
          {
            first_name: seatchString,
          },
          {
            last_name: seatchString,
          },
          {
            name: seatchString,
          },
        ],
        role: "customer",
        deleted: {"$ne": true},
      };
      customers = await User.paginate(userFindQuery, { page: req.params.id, limit: 10, sort: { createdAt: -1 } });
    }

    let customersData =  [];
    if (customers) {
      for (const cust of customers.docs) {
        customersData.push({cust});
      }

      const  paginate = {totalDocs: customers.totalDocs,
                        offset: customers.offset,
                        limit: customers.limit,
                        totalPages: customers.totalPages,
                        page: customers.page,
                        pagingCounter: customers.pagingCounter,
                        hasPrevPage: customers.hasPrevPage,
                        hasNextPage: customers.hasNextPage,
                        prevPage: customers.prevPage,
                        nextPage: customers.nextPage,
                      };

      res.status(200).json({
        customersData: customersData,
        paginate: paginate,
      });
    } else {
      res.status(200).json({
        customersData: [],
      });
    }

  } catch (error) {
    console.log(error);
    utils.handleError(res, error);
  }
};
// Fetch Metrics
exports.fetchMetrics = async (req, res) => {
  // Total Active Notaries
  // Total New Notaries Joined in last 24 hours
  // Total New Notaries Joined In Last 7 days

  // Total Pro Notaries
  // Total New Pro Notaries in last 24 hours
  // Total New Pro Notaries in last 7 days
  // Payment Cancelled in last 24 hours

  // Total DC Sold
  // Total DC Sold in last 24 hours
  // Total DC Sold in last 7 days

  // Total eSeal Sold
  // Total eSeal Sold in last 24 hours
  // Total eSeal Sold in last 7 days

  const totalProNotariesFetch = req.body.totalProNotaries || false;

  try {
    const totalActiveNotaries = await User.count({
      role: "notary",
      approve: "active",
      deleted: {"$ne": true},
    });
    const totalInactiveNotaries = await User.count({
      role: "notary",
      approve: {"$ne": "active"},
      deleted: {"$ne": true},
    });
    const totalReadyForApprovalNotaries = await User.count({
      role: "notary",
      localOnboardingFilledFlag: true,
      approve: {"$ne": "active"},
      state: {"$in": APPROVED_STATES},
      deleted: {"$ne": true},
    });
    const totalReadyForApprovalNotariesUnapprovedStates = await User.count({
      role: "notary",
      localOnboardingFilledFlag: true,
      approve: {"$ne": "active"},
      state: {"$nin": APPROVED_STATES},
      deleted: {"$ne": true},
    });
    const totalNewNotariesJoinedLast24Hours = await User.count({
      role: "notary",
      createdAt: {"$gte": moment().subtract(1, "days")},
      deleted: {"$ne": true},
    });
    const totalNewNotariesJoinedLast7Days = await User.count({
      role: "notary",
      createdAt: {"$gte": moment().subtract(7, "days")},
      deleted: {"$ne": true},
    });

    // const proNotariesPriceId = false;
    const proNotariesPriceId = process.env.NOTARY_SUBSCRIPTION_PRICE_ID;
    console.log("proNotariesPriceId", proNotariesPriceId);
    let totalProNotaries = "N/A";
    let churnedProNotaries = "N/A";
    let notariesCancelledLast30days = "N/A";
    let notariesCancelledLast365days = "N/A";
    let churnedProNotariesRate = "N/A";
    let churnedProNotariesRate30days = "N/A";
    let churnedProNotariesRate365days = "N/A";
    if (totalProNotariesFetch && proNotariesPriceId) {
      try {
        let tempCount = 0;
        for await (const customer of stripe.subscriptions.list({
          price: proNotariesPriceId,
          status: "active",
          limit: 100,
        })) {
          tempCount += 1;
        }
        totalProNotaries = tempCount;
        let tempCount2 = 0;
        let tempCount30Days = 0;
        let tempCount365Days = 0;
        for await (const customer of stripe.subscriptions.list({
          price: proNotariesPriceId,
          status: "canceled",
          limit: 100,
        })) {
          tempCount2 += 1;
          if (customer.canceled_at > new Date(moment().subtract(30, "days")).getTime() / 1000) {
            tempCount30Days += 1;
          }
          if (customer.canceled_at > new Date(moment().subtract(365, "days")).getTime() / 1000) {
            tempCount365Days += 1;
          }
        }
        notariesCancelledLast30days = tempCount30Days;
        notariesCancelledLast365days = tempCount365Days;
        churnedProNotaries = tempCount2;
        churnedProNotariesRate = String(Math.floor(churnedProNotaries / (churnedProNotaries + totalProNotaries) * 100)) + "%";
        churnedProNotariesRate30days = String(Math.floor(notariesCancelledLast30days / (notariesCancelledLast30days + totalProNotaries) * 100)) + "%";
        churnedProNotariesRate365days = String(Math.floor(notariesCancelledLast365days / (notariesCancelledLast365days + totalProNotaries) * 100)) + "%";
      } catch (error) {
        console.log("metrics error", error);
      }
    }

    const totalNotaryDC = await BuyDCLogs.count({
      paymentDone: true,
    });
    const totalNotaryDCLast24Hours = await BuyDCLogs.count({
      paymentDone: true,
      updatedAt: {"$gte": moment().subtract(1, "days")},
    });
    const totalNotaryDCLast7Days = await BuyDCLogs.count({
      paymentDone: true,
      updatedAt: {"$gte": moment().subtract(7, "days")},
    });

    const totalNotaryeSeal = await BuySealLogs.count({
      paymentDone: true,
    });
    const totalNotaryeSealLast24Hours = await BuySealLogs.count({
      paymentDone: true,
      updatedAt: {"$gte": moment().subtract(1, "days")},
    });
    const totalNotaryeSealLast7Days = await BuySealLogs.count({
      paymentDone: true,
      updatedAt: {"$gte": moment().subtract(7, "days")},
    });

    const finalOutput = [
      {
        "name": "Total Active Notaries",
        "key": "totalActiveNotaries",
        "value": totalActiveNotaries,
      },
      {
        "name": "Total Inctive Notaries",
        "key": "totalInactiveNotaries",
        "value": totalInactiveNotaries,
      },
      {
        "name": "Total Ready for Approval Notaries (Approved States)",
        "key": "totalReadyForApprovalNotaries",
        "value": totalReadyForApprovalNotaries,
      },
      {
        "name": "Total Ready for Approval Notaries (Unapproved States)",
        "key": "totalReadyForApprovalNotariesUnapprovedStates",
        "value": totalReadyForApprovalNotariesUnapprovedStates,
      },
      {
        "name": "Total New Notaries Joined in last 24 hours",
        "key": "totalNewNotariesJoinedLast24Hours",
        "value": totalNewNotariesJoinedLast24Hours,
      },
      {
        "name": "Total New Notaries Joined in last 7 days",
        "key": "totalNewNotariesJoinedLast7Days",
        "value": totalNewNotariesJoinedLast7Days,
      },
      {
        "name": "Total Pro Notaries",
        "key": "totalProNotaries",
        "value": totalProNotaries,
      },
      {
        "name": "Last 30 days Churned Pro Notaries",
        "key": "notariesCancelledLast30days",
        "value": notariesCancelledLast30days,
      },
      {
        "name": "Last 365 days Churned Pro Notaries",
        "key": "notariesCancelledLast365days",
        "value": notariesCancelledLast365days,
      },
      {
        "name": "Lifetime Churned Pro Notaries",
        "key": "churnedProNotaries",
        "value": churnedProNotaries,
      },
      {
        "name": "Last 30 days Pro Notaries Churn Rate",
        "key": "churnedProNotariesRate30days",
        "value": churnedProNotariesRate30days,
      },
      {
        "name": "Last 365 days Pro Notaries Churn Rate",
        "key": "churnedProNotariesRate365days",
        "value": churnedProNotariesRate365days,
      },
      {
        "name": "Lifetime Pro Notaries Churn Rate",
        "key": "churnedProNotariesRate",
        "value": churnedProNotariesRate,
      },
      {
        "name": "Total DC Sold",
        "key": "totalNotaryDC",
        "value": totalNotaryDC,
      },
      {
        "name": "Total DC Sold in last 24 hours",
        "key": "totalNotaryDCLast24Hours",
        "value": totalNotaryDCLast24Hours,
      },
      {
        "name": "Total DC Sold in last 7 days",
        "key": "totalNotaryDCLast7Days",
        "value": totalNotaryDCLast7Days,
      },
      {
        "name": "Total eSeal Sold",
        "key": "totalNotaryeSeal",
        "value": totalNotaryeSeal,
      },
      {
        "name": "Total eSeal Sold in last 24 hours",
        "key": "totalNotaryeSealLast24Hours",
        "value": totalNotaryeSealLast24Hours,
      },
      {
        "name": "Total eSeal Sold in last 7 days",
        "key": "totalNotaryeSealLast7Days",
        "value": totalNotaryeSealLast7Days,
      },
    ];
    res.status(200).json({
      metrics: finalOutput,
    });
  } catch (error) {
    console.log(error);
    utils.handleError(res, error);
  }
};
// Fetch fetchMetricsTimeSet
exports.fetchMetricsTimeSet = async (req, res) => {
  // Total Active Notaries
  // Total Pro Notaries
  // Total DC Sold
  // Total eSeal Sold

  const timeset = req.body.timeset || "weekly";

  try {
    let timeRangeFilters = [];
    let dateStringFormat = "%Y-%m-%d";
    if (timeset === "weekly") {
      for (let daynum = 7; daynum >= 0; daynum -= 1) {
        timeRangeFilters.push({
          currentDate: moment().subtract(daynum, "days"),
          metricDateValue: moment().subtract(daynum, "days").format("YYYY-MM-DD"),
          count: 0,
          valToShow: moment().subtract(daynum, "days").format("DD MMM"),
        });
      }
    } else if (timeset === "monthly") {
      for (let daynum = 30; daynum >= 0; daynum -= 1) {
        timeRangeFilters.push({
          currentDate: moment().subtract(daynum, "days"),
          metricDateValue: moment().subtract(daynum, "days").format("YYYY-MM-DD"),
          count: 0,
          valToShow: moment().subtract(daynum, "days").format("DD MMM"),
        });
      }
    } else if (timeset === "3monthly") {
      for (let daynum = 90; daynum >= 0; daynum -= 1) {
        timeRangeFilters.push({
          currentDate: moment().subtract(daynum, "days"),
          metricDateValue: moment().subtract(daynum, "days").format("YYYY-MM-DD"),
          count: 0,
          valToShow: moment().subtract(daynum, "days").format("DD MMM"),
        });
      }
    } else if (timeset === "yearly") {
      dateStringFormat = "%Y-%m";
      for (let daynum = 12; daynum >= 0; daynum -= 1) {
        timeRangeFilters.push({
          currentDate: moment().subtract(daynum * 30, "days"),
          metricDateValue: moment().subtract(daynum * 30, "days").format("YYYY-MM"),
          count: 0,
          valToShow: moment().subtract(daynum * 30, "days").format("DD MMM"),
        });
      }
    }
    const totalNewNotariesJoindDoc = await User.aggregate([
      {
        "$match": {
          role: "notary",
          memberTypeProWhenInvited: {"$ne": true},
          deleted: {"$ne": true},
        },
      },
      {
        $group : {
          _id : { $dateToString: { format: dateStringFormat, date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);
    const totalNewNotariesJoindDocKeyed = {};
    _.map(totalNewNotariesJoindDoc, (tempDoc) => {
      totalNewNotariesJoindDocKeyed[tempDoc._id] = tempDoc.count;
    });
    const totalNewNotariesTimeRangeFilters = _.map(_.cloneDeep(timeRangeFilters), (tempFilter) => {
      if (totalNewNotariesJoindDocKeyed[tempFilter.metricDateValue]) {
        tempFilter.count = totalNewNotariesJoindDocKeyed[tempFilter.metricDateValue];
      }
      return tempFilter;
    });
    const totalNewCustomersJoindDoc = await User.aggregate([
      {
        "$match": {
          role: "customer",
          first_name: {"$ne": "Additional"},
          deleted: {"$ne": true},
        },
      },
      {
        $group : {
          _id : { $dateToString: { format: dateStringFormat, date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);
    const totalNewCustomersJoindDocKeyed = {};
    _.map(totalNewCustomersJoindDoc, (tempDoc) => {
      totalNewCustomersJoindDocKeyed[tempDoc._id] = tempDoc.count;
    });
    const totalNewCustomersTimeRangeFilters = _.map(_.cloneDeep(timeRangeFilters), (tempFilter) => {
      if (totalNewCustomersJoindDocKeyed[tempFilter.metricDateValue]) {
        tempFilter.count = totalNewCustomersJoindDocKeyed[tempFilter.metricDateValue];
      }
      return tempFilter;
    });
    const totalNewDCBuy = await BuyDCLogs.aggregate([
      {
        "$match": {
          paymentDone: true,
        },
      },
      {
        $group : {
          _id : { $dateToString: { format: dateStringFormat, date: "$updatedAt" } },
          count: { $sum: 1 },
        },
      },
    ]);
    const totalDCBuyKeyed = {};
    _.map(totalNewDCBuy, (tempDoc) => {
      totalDCBuyKeyed[tempDoc._id] = tempDoc.count;
    });
    console.log(totalDCBuyKeyed);
    const totalBuyDCTimeRangeFilters = _.map(_.cloneDeep(timeRangeFilters), (tempFilter) => {
      console.log(tempFilter, tempFilter.metricDateValue, totalDCBuyKeyed[tempFilter.metricDateValue]);
      if (totalDCBuyKeyed[tempFilter.metricDateValue]) {
        tempFilter.count = totalDCBuyKeyed[tempFilter.metricDateValue];
      }
      return tempFilter;
    });
    const totalNeweSealBuy = await BuySealLogs.aggregate([
      {
        "$match": {
          paymentDone: true,
        },
      },
      {
        $group : {
          _id : { $dateToString: { format: dateStringFormat, date: "$updatedAt" } },
          count: { $sum: 1 },
        },
      },
    ]);
    const totalSealBuyKeyed = {};
    _.map(totalNeweSealBuy, (tempDoc) => {
      totalSealBuyKeyed[tempDoc._id] = tempDoc.count;
    });
    const totalBuyeSealTimeRangeFilters = _.map(_.cloneDeep(timeRangeFilters), (tempFilter) => {
      if (totalSealBuyKeyed[tempFilter.metricDateValue]) {
        tempFilter.count = totalSealBuyKeyed[tempFilter.metricDateValue];
      }
      return tempFilter;
    });
    const totalNewComboBuy = await BuyComboLogs.aggregate([
      {
        "$match": {
          paymentDone: true,
        },
      },
      {
        $group : {
          _id : { $dateToString: { format: dateStringFormat, date: "$updatedAt" } },
          count: { $sum: 1 },
        },
      },
    ]);
    const totalComboBuyKeyed = {};
    _.map(totalNewComboBuy, (tempDoc) => {
      totalComboBuyKeyed[tempDoc._id] = tempDoc.count;
    });
    const totalBuyComboTimeRangeFilters = _.map(_.cloneDeep(timeRangeFilters), (tempFilter) => {
      if (totalComboBuyKeyed[tempFilter.metricDateValue]) {
        tempFilter.count = totalComboBuyKeyed[tempFilter.metricDateValue];
      }
      return tempFilter;
    });
    const totalSessions = await NewSessionModel.aggregate([
      {
        "$match": {
          deleted: {"$ne": true},
          testingAccSession: {"$ne": true},
        },
      },
      {
        $group : {
          _id : { $dateToString: { format: dateStringFormat, date: "$meetingdatetimeobj" } },
          count: { $sum: 1 },
        },
      },
    ]);
    const totalSessionsKeyed = {};
    _.map(totalSessions, (tempDoc) => {
      totalSessionsKeyed[tempDoc._id] = tempDoc.count;
    });
    const totalSessionTimeRangeFilters = _.map(_.cloneDeep(timeRangeFilters), (tempFilter) => {
      if (totalSessionsKeyed[tempFilter.metricDateValue]) {
        tempFilter.count = totalSessionsKeyed[tempFilter.metricDateValue];
      }
      return tempFilter;
    });
    const totalSessionsOpenCall = await NewSessionModel.aggregate([
      {
        "$match": {
          sessionOpenCallForTakingAt: {"$exists": true},
          deleted: {"$ne": true},
          testingAccSession: {"$ne": true},
        },
      },
      {
        $group : {
          _id : { $dateToString: { format: dateStringFormat, date: "$meetingdatetimeobj" } },
          count: { $sum: 1 },
        },
      },
    ]);
    const totalSessionsOpenCallKeyed = {};
    _.map(totalSessionsOpenCall, (tempDoc) => {
      totalSessionsOpenCallKeyed[tempDoc._id] = tempDoc.count;
    });
    const totalSessionOpenCallTimeRangeFilters = _.map(_.cloneDeep(timeRangeFilters), (tempFilter) => {
      if (totalSessionsOpenCallKeyed[tempFilter.metricDateValue]) {
        tempFilter.count = totalSessionsOpenCallKeyed[tempFilter.metricDateValue];
      }
      return tempFilter;
    });
    const totalSessionsPaid = await NewSessionModel.aggregate([
      {
        "$match": {
          paid: true,
          deleted: {"$ne": true},
          testingAccSession: {"$ne": true},
        },
      },
      {
        $group : {
          _id : { $dateToString: { format: dateStringFormat, date: "$meetingdatetimeobj" } },
          count: { $sum: 1 },
        },
      },
    ]);
    const totalSessionsPaidKeyed = {};
    _.map(totalSessionsPaid, (tempDoc) => {
      totalSessionsPaidKeyed[tempDoc._id] = tempDoc.count;
    });
    const totalSessionPaidTimeRangeFilters = _.map(_.cloneDeep(timeRangeFilters), (tempFilter) => {
      if (totalSessionsPaidKeyed[tempFilter.metricDateValue]) {
        tempFilter.count = totalSessionsPaidKeyed[tempFilter.metricDateValue];
      }
      return tempFilter;
    });
    const finalOutput = [
      {
        "name": "Total New Notaries Joined",
        "key": "totalNewNotariesTimeRangeFilters",
        "value": totalNewNotariesTimeRangeFilters,
        "chartType": "line",
        "chartData": {
          labels: _.map(totalNewNotariesTimeRangeFilters, "valToShow"),
          datasets: [{
            label: "New Notaries Signup",
            backgroundColor: "#f87979",
            borderColor: "#f87979",
            data: _.map(totalNewNotariesTimeRangeFilters, "count"),
            tension: 0.5,
          }, {
            label: "New Customers Signup",
            backgroundColor: "#123dfa",
            borderColor: "#123dfa",
            data: _.map(totalNewCustomersTimeRangeFilters, "count"),
            tension: 0.5,
          }],
        },
      },
      {
        "name": "Buy DC / eSeal",
        "key": "totalBuyDCTimeRangeFilters",
        "value": totalBuyDCTimeRangeFilters,
        "chartType": "line",
        "chartData": {
          labels: _.map(totalBuyDCTimeRangeFilters, "valToShow"),
          datasets: [{
            label: "Buy DC",
            backgroundColor: "#f87979",
            borderColor: "#f87979",
            data: _.map(totalBuyDCTimeRangeFilters, "count"),
            tension: 0.5,
          }, {
            label: "Buy eSeal",
            backgroundColor: "#123dfa",
            borderColor: "#123dfa",
            data: _.map(totalBuyeSealTimeRangeFilters, "count"),
            tension: 0.5,
          }, {
            label: "Buy Combo",
            backgroundColor: "#dbd112",
            borderColor: "#dbd112",
            data: _.map(totalBuyComboTimeRangeFilters, "count"),
            tension: 0.5,
          }],
        },
      },
      {
        "name": "Sessions",
        "key": "totalSessionTimeRangeFilters",
        "value": totalSessionTimeRangeFilters,
        "chartType": "line",
        "chartData": {
          labels: _.map(totalSessionTimeRangeFilters, "valToShow"),
          datasets: [{
            label: "Total Sessions",
            backgroundColor: "#f87979",
            borderColor: "#f87979",
            data: _.map(totalSessionTimeRangeFilters, "count"),
            tension: 0.5,
          }, {
            label: "Total Open Calls",
            backgroundColor: "#123dfa",
            borderColor: "#123dfa",
            data: _.map(totalSessionOpenCallTimeRangeFilters, "count"),
            tension: 0.5,
          }, {
            label: "Total Completed Sessions",
            backgroundColor: "#fac687",
            borderColor: "#fac687",
            data: _.map(totalSessionPaidTimeRangeFilters, "count"),
            tension: 0.5,
          }],
        },
      },
    ];
    res.status(200).json({
      metricsTimeSet: finalOutput,
    });
  } catch (error) {
    console.log(error);
    utils.handleError(res, error);
  }
};
// Fetch Sessions
exports.fetchSessions = async (req, res) => {
  try {
    const showTestingSessions = req.body.showTestingSessions || false;
    const showTerminatedSessions = req.body.showTerminatedSessions || false;
    const selectedVendorModel = req.body.selectedVendorModel || false;
    const searchString = req.body.searchString || false;
    const SESSION_TIMEOUT_IN_MINUTES = 30;
    const sessionQuery = {
      testingAccSession: {"$ne": true},
    };
    if (showTestingSessions) {
      sessionQuery.testingAccSession = true;
    }
    if (showTerminatedSessions) {
      sessionQuery["terminateSessionOptions.0"] = {"$exists": true};
    }
    if (selectedVendorModel) {
      sessionQuery.vendor = selectedVendorModel;
    }
    if (searchString) {
      const tempSessionDocs = await NewSessionModel.aggregate([
        {
          $addFields: {
            tempUserId: { $toString: "$_id" },
          },
        },
        {
          $match: {
            tempUserId: { $regex: searchString, $options: "i" },
          },
        },
      ]);
      sessionQuery._id = {"$in": _.map(tempSessionDocs, "_id")};
      delete sessionQuery.testingAccSession;
    }
    const sessions = await NewSessionModel.paginate(sessionQuery, { page: req.params.id, limit: 10, sort: { createdAt: -1 } });
    const sessionData = [];
    const allAdditionalSignerEmails = [];
    let sessionIdentityDocsKeyed = {};
    let allSessionIds = _.map(sessions.docs, "_id");
    for (const item of sessions.docs) {
      if (item.multiSignerList) {
        _.map(item.multiSignerList, (multiSignerDoc) => {
          if (multiSignerDoc.email) {
            allAdditionalSignerEmails.push(multiSignerDoc.email);
          }
        });
      }
    }
    let additionalSignerEmailUserDocMap = {};
    if (allAdditionalSignerEmails.length) {
      const allAdditionalSignerUserDocs = await User.find({
        "email": {"$in": allAdditionalSignerEmails}, deleted: {"$ne": true},
      });
      additionalSignerEmailUserDocMap = _.keyBy(allAdditionalSignerUserDocs, "email");
    }
    const sessionIdentityDocs = await IdentityModel.find({
      "sessionid": {"$in": allSessionIds},
    });
    sessionIdentityDocsKeyed = _.groupBy(sessionIdentityDocs, "sessionid");
    const allIntermediateDocs = await DocumentModel.find({ sessionid: {"$in": _.map(sessions.docs, "_id")}, documentCategory: "final_document" });
    const allIntermediateDocsGrouped = _.groupBy(allIntermediateDocs, "sessionid");
    for (const session of sessions.docs) {
      let finalDocument;
      let intermediateDocument;
      const customer = await User.findOne({ _id: session.userId, deleted: {"$ne": true} });
      const notaryUser = await User.findOne({ _id: session.notaryUserId, deleted: {"$ne": true} });
      const document = await DocumentModel.find({ sessionid: session._id, documentCategory: "initial_document" });
      const identityData = await IdentityModel.findOne({ sessionid: session._id });
      let finalDocumentId = session.finalDocumentId;
      let videoDataId = session.videoFileDocumentId;
      let followupDocumentId = session.followupDocumentId;
      // if (session.paid === false) {
      //   finalDocumentId = "";
      //   videoDataId = "";
      // }
      if (finalDocumentId) {
        finalDocument = await DocumentModel.find({ sessionid: session._id, documentCategory: "final_document_with_dc" });
      } else {
        finalDocument = false;
      }
      let videoData;
      if (videoDataId) {
        videoData = await DocumentModel.findOne({ _id: videoDataId });
      } else {
        videoData = false;
      }
      const allVideoTemporaryFiles = await DocumentModel.find({sessionid: session._id, documentCategory: "temp_video_recording_file"});
      let followupDocumentDoc;
      if (followupDocumentId) {
        followupDocumentDoc = await DocumentModel.findOne({ _id: followupDocumentId });
      } else {
        followupDocumentDoc = false;
      }
      if (session.sessionActive && session.sessionActiveFrom) {
        const diff = new Date().valueOf() - session.sessionActiveFrom.valueOf();
        const diffMinutes = diff / (60 * 1000);
        if (diffMinutes > SESSION_TIMEOUT_IN_MINUTES) {
          session.sessionActive = null;
          session.sessionActiveFrom = null;
          // delete session.sessionActive
          // delete session.sessionActiveFrom
          session.save();
        }
      }
      const additionalSignerIdentyDocs = [];
      const allNotaryIdentities = sessionIdentityDocsKeyed[session._id] || [];
      _.map(session.multiSignerList, (multiSignerDoc) => {
        const userDoc = additionalSignerEmailUserDocMap[multiSignerDoc.email];
        let identityDocFound = false;
        if (userDoc) {
          _.map(allNotaryIdentities, (tempIdentityDoc) => {
            if (String(tempIdentityDoc.userId) === String(userDoc._id)) {
              additionalSignerIdentyDocs.push(tempIdentityDoc);
              identityDocFound = true;
            }
          });
        }
        if (!identityDocFound) {
          additionalSignerIdentyDocs.push(multiSignerDoc);
        }
      });
      const sessionJoinedUserLog = await SessionUserLogs.findOne({
        sessionid: session._id,
        actionType : "join_session",
      });
      let sessionStartedTime = false;
      if (sessionJoinedUserLog) {
        sessionStartedTime = sessionJoinedUserLog.createdAt;
      }
      const sessionCompletedUserLog = await SessionUserLogs.findOne({
        sessionid: session._id,
        actionType : "session_completed",
      });
      let sessionEndTime = false;
      if (sessionCompletedUserLog) {
        sessionEndTime = sessionCompletedUserLog.createdAt;
      }
      const idcardState = identityData?.cardAPIResponseDoc?.platformresponse?.response?.[0]?.cardresult?.[0]?.documentaddress?.[0]?.state?.[0];
      const idcardExpiry = identityData?.cardAPIResponseDoc?.platformresponse?.response?.[0]?.cardresult?.[0]?.documentinformation?.[0]?.expirationdate?.[0];
      sessionData.push({
        session,
        signer: (customer && customer.name) ? customer.name : (customer && customer.email ? customer.email : ""),
        notaryUserName: (notaryUser && notaryUser.name) ? notaryUser.name : "",
        notaryUserEmail: (notaryUser && notaryUser.email) ? notaryUser.email : "",
        inviteLink: `${process.env.FRONT_URL}/business/prepare_doc/${session._id}`,
        signerEmail: (customer) ? customer.email : "",
        documentName: (document && document[0]) ? document[0].name : "N/A",
        documentUrl: (document && document[0]) ? document[0].url : "#",
        document: document,
        finalDocument: finalDocument,
        allVideoTemporaryFiles,
        intermediateDocument: allIntermediateDocsGrouped[session._id] || [],
        identityData,
        videoData,
        followupDocumentDoc,
        additionalSignerIdentyDocs,
        sessionStartedTime,
        sessionEndTime,
        idcardState,
        idcardExpiry,
      });
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
                        nextPage: sessions.nextPage,
                      };

    const allVendors = await Vendors.find({"deleted": {"$ne": true}});
    const allVendorResponse = [];
    _.map(allVendors, (tempVendorDoc) => {
      let vendorName = tempVendorDoc?.vendor_name;
      if (tempVendorDoc.testingacc) {
        vendorName += " - Testing Account";
      } else {
        vendorName += " - Live Account";
      }
      allVendorResponse.push({
        label: vendorName,
        value: tempVendorDoc.id,
      });
    });

    res.status(200).json({ sessionData, paginate, allVendorResponse});

  } catch (error) {
    utils.handleError(res, error);
  }
};
// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, deleted: {"$ne": true} });
    if (user) {
      user.email = String(Date.now()) + "_" + user.email;
      user.deleted = true;
      user.deletedAt = new Date();
      user.deletedSource = "admin_source";
      await user.save();
      const notaryDocument = await NotaryDataModel.findOne({ userId: user._id });
      if (notaryDocument) {
        notaryDocument.email = user.email;
        await notaryDocument.save();
      }
      // await user.remove();
      res.status(200).json({
        message: "User successfully removed.",
      });
    } else {
      res.status(400).json({
        message: "Something went wrong",
      });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

//Explicitly make open session
exports.makeOpenSession = async (req, res) => {
  try {
    console.log(req.params.sessionid);
    const sessionid = req.params.sessionid;
    const session = await NewSessionModel.findOne({_id: new mongoose.Types.ObjectId(sessionid)});
    if (!session) {
      return res.status(404).json({
        success: false,
        msg: "Session not found",
      });
    }
    // if (session.sessionOpenCallForTaking === true) {
    //   return res.status(200).json({
    //     success: true,
    //     msg: "Session is already open for call",
    //   });
    // }
    session.notaryUserId = null;
    session.sessionOpenCallForTaking = true;
    session.sessionOpenCallForTakingAt = new Date();
    await session.save();
    const shortSessionId = (sessionid).toString().substr((sessionid).toString().length - 5).toUpperCase();
    const identityModelDoc = await IdentityModel.findOne({
      sessionid: sessionid,
    });
    if (!identityModelDoc) {
      return res.status(404).json({
        success: false,
        msg: "Identity doc mot found",
      });
    }
    if (!session.testingAccSession) {
      if (session?.sessionType === "loan_signing") {
        await emailer.sendEmailToAllNotariesForLoanSigning(shortSessionId, session, identityModelDoc);
      } else {
        await emailer.sendEmailToAllNotaries(shortSessionId, session, identityModelDoc);
      }
    }
    const sessionUserLogsData = new SessionUserLogs({
      sessionid: sessionid,
      userId: (req.user._id).toString(),
      actionType: "open_call_sent",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    sessionUserLogsData.save();
    return res.status(200).json({
      success: true,
      openCallSent: true,
      msg: "Session is sent for opencall",
    });
  } catch (error) {
    console.log("errorerror", error);
    return res.status(500).json({
      success: false,
      msg: "Server Error",
    });
  }
};

exports.makeSessionForAllStates = async (req, res) => {
  try {
    console.log(req.params.sessionid);
    const sessionid = req.params.sessionid;
    const session = await NewSessionModel.findOne({_id: new mongoose.Types.ObjectId(sessionid)});
    if (!session) {
      return res.status(404).json({
        success: false,
        msg: "Session not found",
      });
    }
    session.notaryUserId = null;
    session.requestForStateSpecificNotary = false;
    await session.save();
    return res.status(200).json({
      success: true,
      msg: "Session is marked for all states",
    });
  } catch (error) {
    console.log("errorerror", error);
    return res.status(500).json({
      success: false,
      msg: "Server Error",
    });
  }
};

exports.modifySessionFields = async (req, res) => {
  try {
    console.log(req.params.sessionid);
    const sessionid = req.params.sessionid;
    const data = req.body;
    console.log("data", data);
    const session = await NewSessionModel.findOne({_id: new mongoose.Types.ObjectId(sessionid)});
    if (!session) {
      return res.status(404).json({
        success: false,
        msg: "Session not found",
      });
    }

    if (data.additionalAction === "hideWaitingRoom") {
      session.hideTheWaitingRoom = true;
    }
    if (data.additionalAction === "enableCompleteSessionButton") {
      session.markSessionCompleteAsNonDisabled = true;
    }

    await session.save();
    return res.status(200).json({
      success: true,
      msg: "Action Completed",
    });
  } catch (error) {
    console.log("errorerror", error);
    return res.status(500).json({
      success: false,
      msg: "Server Error",
    });
  }
};

exports.makeSessionForSpanishNotaries = async (req, res) => {
  try {
    console.log(req.params.sessionid);
    const sessionid = req.params.sessionid;
    const session = await NewSessionModel.findOne({_id: new mongoose.Types.ObjectId(sessionid)});
    if (!session) {
      return res.status(404).json({
        success: false,
        msg: "Session not found",
      });
    }
    console.log("req.body.spanishSpeakingValue", req.body.spanishSpeakingValue);
    let spanishSpeakingValue = req.body.spanishSpeakingValue || false;
    if (_.isString(spanishSpeakingValue)) {
      if (spanishSpeakingValue === "true") {
        spanishSpeakingValue = true;
      } else {
        spanishSpeakingValue = false;
      }
    }
    console.log("spanishSpeakingValue", spanishSpeakingValue);
    session.requestForSpanishNotary = spanishSpeakingValue;
    await session.save();
    let returnMessage = "Session Marked for Spanish Speaking Notaries";
    if (!spanishSpeakingValue) {
      returnMessage = "Session Marked for All Language Speaking Notaries";
    }
    return res.status(200).json({
      success: true,
      msg: returnMessage,
    });
  } catch (error) {
    console.log("errorerror", error);
    return res.status(500).json({
      success: false,
      msg: "Server Error",
    });
  }
};

exports.turnOnInviteSigner = async (req, res) => {
  try {
    console.log(req.params.customerUserId);
    const customerUserId = req.params.customerUserId;
    const customerUserDoc = await User.findOne({_id: new mongoose.Types.ObjectId(customerUserId)});
    if (!customerUserDoc) {
      return res.status(404).json({
        success: false,
        msg: "Customer User not found",
      });
    }
    customerUserDoc.turnOffInviteSigner = false;
    await customerUserDoc.save();
    return res.status(200).json({
      success: true,
      msg: "User is now allowed to invite signer for 1 more session",
    });
  } catch (error) {
    console.log("errorerror", error);
    return res.status(500).json({
      success: false,
      msg: "Server Error",
    });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    console.log(req.params.customerUserId);
    const customerUserId = req.params.customerUserId;
    const customerUserDoc = await User.findOne({_id: new mongoose.Types.ObjectId(customerUserId)});
    if (!customerUserDoc) {
      return res.status(404).json({
        success: false,
        msg: "Customer User not found",
      });
    }
    customerUserDoc.loginAttempts = 0;
    customerUserDoc.blockExpires = new Date();
    await customerUserDoc.save();
    return res.status(200).json({
      success: true,
      msg: "User is now unblocked",
    });
  } catch (error) {
    console.log("errorerror", error);
    return res.status(500).json({
      success: false,
      msg: "Server Error",
    });
  }
};

exports.getActiveSessionStat = async (req, res) => {
  try {
    const sessionid = String(req.params.sessionid);
    const statDoc = await SessionStatModel.findOne({ sessionId: sessionid });
    if (!statDoc) {
      return res.status(404).json({err: "Session Stat doc not found"});
    }
    const now = moment(Date.now());

    let custJoiningStatus;
    const custLastActiveKey = `${sessionid}_${statDoc.customerUserId}_session_last_active`;
    const custLastPingTs = await redisClient.get(custLastActiveKey);
    if (!custLastPingTs) {
      custJoiningStatus = "Not Joined";
    } else {
      const custLastPingTime = moment(parseInt(custLastPingTs, 10));
      const custInterval = now.diff(custLastPingTime, "seconds");
      if (custInterval <= 20) {
        custJoiningStatus = "Active";
      } else if (custInterval > 20 && custInterval < 60) {
        custJoiningStatus = "Away";
      } else if (custInterval > 60) {
        custJoiningStatus = "Left";
      }
    }

    let notaryJoiningStatus;
    const notaryLastActiveKey = `${sessionid}_${String(statDoc.notaryUserId)}_session_last_active`;
    const notaryLastPingTs = await redisClient.get(notaryLastActiveKey);
    if (!notaryLastPingTs) {
      notaryJoiningStatus = "Not Joined";
    } else {
      const notaryLastPingTime = moment(parseInt(notaryLastPingTs, 10));
      const notaryInterval = now.diff(notaryLastPingTime, "seconds");
      if (notaryInterval <= 20) {
        notaryJoiningStatus = "Active";
      } else if (notaryInterval > 20 && notaryInterval < 60) {
        notaryJoiningStatus = "Away";
      } else if (notaryInterval > 60) {
        notaryJoiningStatus = "Left";
      }
    }

    const notaryKey = `${sessionid}_${statDoc.notaryUserId}_session_joined_at`;
    let notarySessionDuration = await redisClient.get(notaryKey);
    if (!notarySessionDuration) {
      notarySessionDuration = "00:00";
    } else {
      notarySessionDuration = moment(parseInt(notarySessionDuration, 10));
      const durationTotalSeconds = now.diff(notarySessionDuration, "seconds");
      const durationMinutes = Math.floor(durationTotalSeconds / 60).toString();
      const durationSeconds = (durationTotalSeconds % 60).toLocaleString();
      notarySessionDuration = `${durationMinutes}:${durationSeconds}`;
    }

    const custKey = `${sessionid}_${statDoc.customerUserId}_session_joined_at`;
    let customerSessionDuration = await redisClient.get(custKey);
    if (!customerSessionDuration) {
      customerSessionDuration = "00:00";
    } else {
      customerSessionDuration = moment(parseInt(customerSessionDuration, 10));
      const custDurationTotalSeconds = now.diff(customerSessionDuration, "seconds");
      const custDurationMinutes = Math.floor(custDurationTotalSeconds / 60).toString();
      const custDurationSeconds = Math.floor(custDurationTotalSeconds % 60).toLocaleString();
      customerSessionDuration = `${custDurationMinutes}:${custDurationSeconds}`;
    }

    let recordingStartedAt = "NA";
    let recordingTime = "00:00";
    if (statDoc?.notaryStat?.recordingStartedAt > 0) {
      recordingStartedAt = moment(statDoc.notaryStat.recordingStartedAt).format("DD-MM-YYYY h:mm:ss");
    }
    if (statDoc.notaryStat?.recordingTimeInSecs && statDoc.notaryStat?.recordingTimeInSecs > 0) {
      const totalSeconds = statDoc.notaryStat.recordingTimeInSecs;
      const minutes = Math.floor(totalSeconds / 60).toString();
      const seconds = (totalSeconds % 60).toLocaleString();
      recordingTime = `${minutes}:${seconds}`;
    }

    const notaryStat = {
      waiting_room: statDoc?.notaryStat?.waitingRoom || "NA",
      video_cam: statDoc?.notaryStat?.videoCam || "NA",
      joining_status: notaryJoiningStatus,
      recording_status: statDoc?.notaryStat?.recordingStatus || "Not Started",
      complete_pending_items: statDoc?.notaryStat?.completePendingItems || "NA",
      recording_started_at: recordingStartedAt,
      recording_time: recordingTime,
      session_duration: notarySessionDuration,
    };
    const customerStat = {
      waiting_room: statDoc?.customerStat?.waitingRoom || "NA",
      video_cam: statDoc?.customerStat?.videoCam || "NA",
      joining_status: custJoiningStatus || "NA",
      session_duration: customerSessionDuration,
    };

    return res.status(200).json({
      notaryStat, customerStat,
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({err: "Server Error"});
  }
};

exports.getActiveSessionElements = async (req, res) => {
  try {
    const sessionid = req.params.sessionid;
    const sessionDoc = await NewSessionModel.findOne({_id: sessionid });
    const recentDrafts = await SessionDraftsModel.find({ sessionid }).sort({createdAt: -1}).limit(1);
    if (recentDrafts.length === 0 || !sessionDoc) {
      return res.status(404).json({msg: "Docs missing"});
    }
    const notaryUserId = String(sessionDoc.notaryUserId);
    const custUserId = String(sessionDoc.userId);
    const emptyPagesAddedDocIdWise = recentDrafts[0].emptyPagesAddedDocIdWise;
    const emptyPagesByDocId = new Map();
    for (const docid of Object.keys(emptyPagesAddedDocIdWise)) {
      emptyPagesByDocId.set(docid, emptyPagesAddedDocIdWise[docid]);
    }
    const notaryElements = [];
    const custElements = [];
    const droppedElementsDocIdWise = recentDrafts[0].droppedElementsDocIdWise;
    for (const docid of Object.keys(droppedElementsDocIdWise)) {
      let emptyPageCount = 0;
      if (emptyPagesByDocId.has(docid)) {
        emptyPageCount = emptyPagesByDocId.get(docid);
      }
      const document = await DocumentModel.findOne({_id: docid}).select({name: 1});
      if (document?.name === undefined) { continue; }
      const notaryStat = {
        staticText: 0,
        freeText: 0,
        freeTextFilled: 0,
        freeTextSummary: "0 Filled, 0 Unfilled",
        signerElements: 0,
        signerFilled: 0,
        signerElemSummary: "0 Filled, 0 Unfilled",
        signature: 0,
        signatureFilled: 0,
        signatureSummary: "0 Filled, 0 Unfilled",
        seal: 0,
        certificate: 0,
        blankPages: emptyPageCount,
        documentName: document.name,
      };
      const customerStat = {
        staticText: 0,
        freeText: 0,
        freeTextFilled: 0,
        freeTextSummary: "0 Filled, 0 Unfilled",
        signature: 0,
        signatureFilled: 0,
        signatureSummary: "0 Filled, 0 Unfilled",
        documentName: document.name,
      };
      const elements = droppedElementsDocIdWise[docid];
      for (const element of elements) {
        const fieldType = element.fieldType;
        if (element.droppedBy === notaryUserId) {
          if (fieldType === "placeholder") {
            notaryStat.freeText += 1;
            notaryStat.signerElements += 1;
            if (element.inputTextValue || element.imageData) {
              notaryStat.signerFilled += 1;
            }
          } else if (fieldType === "input_text") {
            notaryStat.freeText += 1;
            if (element.inputTextValue) {
              notaryStat.freeTextFilled += 1;
            }
          } else if (fieldType === "static_text") {
            notaryStat.staticText += 1;
          } else if (fieldType === "notary_certificate") {
            notaryStat.certificate += 1;
          } else if (fieldType === "notary_seal" || fieldType === "image") {
            notaryStat.seal += 1;
          } else if (fieldType === "signature") {
            notaryStat.signature += 1;
            if (element.imageData) {
              notaryStat.signatureFilled += 1;
            }
          }
        } else if (element.droppedBy === custUserId) {
          if (fieldType === "input_text") {
            customerStat.freeText += 1;
            if (element.inputTextValue) {
              customerStat.freeTextFilled += 1;
            }
          } else if (fieldType === "static_text") {
            customerStat.staticText += 1;
          } else if (fieldType === "signature") {
            customerStat.signature += 1;
            if (element.imageData) {
              customerStat.signatureFilled += 1;
            }
          }
        }
      }

      if (notaryStat.freeText) {
        const freeTextUnfilled = notaryStat.freeText - notaryStat.freeTextFilled;
        notaryStat.freeTextSummary = `${notaryStat.freeTextFilled} Filled, ${freeTextUnfilled} Unfilled`;
      }
      if (notaryStat.signerElements) {
        const signerElemetsUnfilled = notaryStat.signerElements - notaryStat.signerFilled;
        notaryStat.signerElemSummary = `${notaryStat.signerElements} Filled, ${signerElemetsUnfilled} Unfilled`;
      }
      if (notaryStat.signature) {
        const signatureUnfilled = notaryStat.signature - notaryStat.signatureFilled;
        notaryStat.signatureSummary = `${notaryStat.signature} Filled, ${signatureUnfilled} Unfilled`;
      }

      if (customerStat.freeText) {
        const freeTextUnfilled = customerStat.freeText - customerStat.freeTextFilled;
        customerStat.freeTextSummary = `${customerStat.freeTextFilled} Filled, ${freeTextUnfilled} Unfilled`;
      }

      if (customerStat.signature) {
        const custSignatureUnfilled = customerStat.signature - customerStat.signatureFilled;
        customerStat.signatureSummary = `${customerStat.signature} Filled, ${custSignatureUnfilled} Unfilled`;
      }

      notaryElements.push(notaryStat);
      custElements.push(customerStat);
    }
    return res.status(200).json({
      notary: notaryElements,
      customer: custElements,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({msg: "Server Error"});
  }
};

// Cron - precompute onboarding status. Also autoapprove notaries
exports.precomputeOnboardingStatusOfNotaries = async () => {
  console.log("onboarding status");
  try {
    const allNotaryDatasWithCommissionLetter = await NotaryDataModel.find({
      notaryCopyOfCommissionLetterName: {$exists: true},
      stripeAccountName: {$exists: true},
      commissionExpiresOn: {$exists: true},
    });
    console.log("allNotaryDatasWithCommissionLetter", allNotaryDatasWithCommissionLetter.length);
    const allNotaryDatasKeyed = _.keyBy(allNotaryDatasWithCommissionLetter, "userId");
    console.log({
      _id: {$in: _.map(allNotaryDatasWithCommissionLetter, "userId")},
      role : "notary",
      localOnboardingFilledFlag: {$ne: true},
    });
    const notaryUsersForOnboarding = await User.find({
      _id: {$in: _.map(allNotaryDatasWithCommissionLetter, "userId")},
      role : "notary",
      localOnboardingFilledFlag: {$ne: true},
      approve : {$ne: "active"}, deleted: {$ne: true},
    });
    console.log("notaryUsersForOnboarding", notaryUsersForOnboarding.length);
    _.map(notaryUsersForOnboarding, async (notaryUserDoc) => {
      const tempNotaryDataDoc = allNotaryDatasKeyed[notaryUserDoc._id];
      let onBoarding = false;
      let stripeToUse;
      if (notaryUserDoc.testingacc) {
        stripeToUse = stripeTest;
      } else {
        stripeToUse = stripe;
      }
      const account = await stripeToUse.accounts.retrieve(tempNotaryDataDoc.stripeAccountName);
      if (account &&
        account.requirements &&
        account.requirements.errors &&
        account.requirements.errors.length > 0) {
        onBoarding = false;
      } else {
        onBoarding = true;
      }
      if (onBoarding && account &&
        account.capabilities &&
        account.capabilities.transfers !== "active") {
        onBoarding = false;
      }
      console.log("onBoarding", onBoarding);
      if (onBoarding) {
        notaryUserDoc.localOnboardingFilledFlag = true;
        await notaryUserDoc.save();
        console.log("_.includes(APPROVED_STATES, notaryUserDoc.state)", _.includes(APPROVED_STATES, notaryUserDoc.state));
        console.log("notaryUserDoc", notaryUserDoc.email);
        if (_.includes(APPROVED_STATES, notaryUserDoc.state)) {
          notaryUserDoc.userAutoApproved = true;
          notaryUserDoc.approve = "active";
          await notaryUserDoc.save();
          emailer.sendNotaryApprovalEmailMessage(notaryUserDoc);
        }
      }
    });
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
