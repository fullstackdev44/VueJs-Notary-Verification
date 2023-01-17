const nodemailer = require("nodemailer");
const locals = require("../../locales/en.json");
// const mg = require('nodemailer-mailgun-transport')
const ejs = require("ejs");
const path = require("path");
const _ = require("lodash");
const moment = require("moment");
const User = require("../models/user");
const OpenCalls = require("../models/openCalls");
const Vendors = require("../models/vendors");
const { itemAlreadyExists } = require("../middleware/utils");
var SibApiV3Sdk = require("sib-api-v3-sdk");
var defaultClient = SibApiV3Sdk.ApiClient.instance;
var apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.SENDBLUE_KEY;
var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
var sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); // SendSmtpEmail | Values to send a transactional email

function humanizeString(str) {
  let i;
  let frags = str.split("_");
  for (i = 0; i < frags.length; i++) {
    frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
  }
  return frags.join(" ");
}

function getTimeZone(timezone) {
  let actualTimezone = "Central";
  switch (timezone) {
    case "5.5":
      actualTimezone = "GMT+05:30";
      break;
    case "-10":
      actualTimezone = "Hawaii";
      break;
    case "-8":
      actualTimezone = "Pacific";
      break;
    case "-7":
      actualTimezone = "Mountain";
      break;
    case "-6":
      actualTimezone = "Central";
      break;
    case "-5":
      actualTimezone = "Eastern Time";
      break;
    case "-4":
      actualTimezone = "Atlantic";
      break;
  }
  return actualTimezone;
}

/**
 * Sends email
 * @param {Object} data - data
 * @param {boolean} callback - callback
 */
const sendVerifyEmail = async (data, callback) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  transporter.verify((error) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Server is ready to take our messages to ${data.user.email}`);
    }
  });

  const templateHtml = await ejs.renderFile(
    path.join(__dirname, "../../templates/verify.ejs"),
    {
      token: `${process.env.API_URL}/verify?verification=${data.user.verification}`,
    },
  );
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: `<${data.user.email}>`,
    subject: data.subject,
    html: templateHtml,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return callback(false);
    }
    return callback(true);
  });
};

const sendResetPassEmail = async (data, callback) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  transporter.verify((error) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Server is ready to take our messages to ${data.user.email}`);
    }
  });

  const templateHtml = await ejs.renderFile(
    path.join(__dirname, "../../templates/resetPass.ejs"),
    {
      token: `${process.env.FRONT_URL}/auth/reset-password/${data.user.verification}`,
    },
  );
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: `<${data.user.email}>`,
    subject: data.subject,
    html: templateHtml,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return callback(false);
    }
    return callback(true);
  });
};

/**
 * Prepares to send email
 * @param {string} user - user object
 * @param {string} subject - subject
 * @param {string} htmlMessage - html message
 */
const prepareToSendVerifyEmail = (user, subject, htmlMessage) => {
  user = {
    email: user.email,
    verification: user.verification,
  };
  const data = {
    user,
    subject,
    htmlMessage,
  };
  if (process.env.NODE_ENV === "production") {
    sendVerifyEmail(data, (messageSent) =>
      messageSent
        ? console.log(`Email SENT to: ${user.email}`)
        : console.log(`Email FAILED to: ${user.email}`),
    );
  } else if (process.env.NODE_ENV === "development") {
    sendVerifyEmail(data, (messageSent) =>
      messageSent
        ? console.log(`Email SENT to: ${user.email}`)
        : console.log(`Email FAILED to: ${user.email}`),
    );
  }
};

const prepareToSendResetEmail = (user, subject, htmlMessage) => {
  user = {
    email: user.email,
    verification: user.verification,
  };
  const data = {
    user,
    subject,
    htmlMessage,
  };
  if (process.env.NODE_ENV === "production") {
    sendResetPassEmail(data, (messageSent) =>
      messageSent
        ? console.log(`Email SENT to: ${user.email}`)
        : console.log(`Email FAILED to: ${user.email}`),
    );
  } else if (process.env.NODE_ENV === "development") {
    sendResetPassEmail(data, (messageSent) =>
      messageSent
        ? console.log(`Email SENT to: ${user.email}`)
        : console.log(`Email FAILED to: ${user.email}`),
    );
  }
};

module.exports = {
  /**
   * Checks User model if user with an specific email exists
   * @param {string} email - user email
   */
  async emailExists(email) {
    return new Promise((resolve, reject) => {
      User.findOne(
        {
          email,
        },
        (err, item) => {
          itemAlreadyExists(err, item, reject, "EMAIL_ALREADY_EXISTS");
          resolve(false);
        },
      );
    });
  },

  /**
   * Checks User model if user with an specific email exists but excluding user id
   * @param {string} id - user id
   * @param {string} email - user email
   */
  async emailExistsExcludingMyself(id, email) {
    return new Promise((resolve, reject) => {
      User.findOne(
        {
          email,
          _id: {
            $ne: id,
          },
        },
        (err, item) => {
          itemAlreadyExists(err, item, reject, "EMAIL_ALREADY_EXISTS");
          resolve(false);
        },
      );
    });
  },

  /**
   * Sends registration email
   * @param {Object} user - user object
   */
  async sendRegistrationEmailMessage(user) {
    const templateID = (user.role === "notary") ? 8 : 1;
    const subject = locals.registration.SUBJECT;
    const htmlMessage = `${locals.registration.MESSAGE}
      ${process.env.API_URL}${user.verification}`;

    console.log(`${process.env.API_URL}${user.verification}`);
    const sendData = {
      to: [
        {
          email: user.email,
          name: user.name,
        },
      ],
      templateId: templateID,
      params: {
        userName: user.name,
        activateUrl: `${process.env.API_URL}/api/auth/verify?verification=${user.verification}`,
      },
    };

    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );
    // prepareToSendVerifyEmail(user, subject, htmlMessage);
  },

  async sendNotaryApprovalEmailMessage(user) {
    const sendData = {
      params: {
        userName: user.name,
      },
      to: [
        {
          email: user.email,
          name: user.name,
        },
      ],
      templateId: 9,
    };

    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );
  },

  async sendLSANotaryApprovalEmailMessage(user) {
    const sendData = {
      to: [
        {
          email: user.email,
          name: user.name,
        },
      ],
      templateId: 28,
    };

    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );
  },

  async sendCommissionExpiredEmailMessage(user) {
    const sendData = {
      to: [
        {
          email: user.email,
          name: user.name,
        },
      ],
      templateId: 10,
    };

    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );
  },

  async sendRegistratedEmail(user) {
    var sendData = {
      to: [
        {
          email: user.email,
          name: user.name,
        },
      ],
      templateId: 4,
    };

    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );
    // prepareToSendVerifyEmail(user, subject, htmlMessage);
  },
  /**
   * Sends reset password email
   * @param {string} locale - locale
   * @param {Object} user - user object
   */
  async sendResetPasswordEmailMessage(user) {
    const sendData = {
      to: [
        {
          email: user.email,
          name: user.name,
        },
      ],
      templateId: 2,
      params: {
        forgotUrl: `${process.env.FRONT_URL}/reset-password/${user.verification}`,
      },
    };

    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );

    // prepareToSendResetEmail(user, subject, htmlMessage);
  },

  // notary signer invite email
  async sendNotarySignerEmail(user, notaryUser, password, meetingdate, sessionID, meetingTimeZone, dontSendTempPassword, sessionDoc) {

    let actualTimezone = getTimeZone(meetingTimeZone);
    console.log("actualTimezone", actualTimezone);
    let meetingDateFormatted = "";
    let preDateText = "";
    let userName = user.name;
    let passwordToSend = password;
    if (dontSendTempPassword) {
      passwordToSend = "";
    }
    let templateID;
    if (sessionDoc?.sessionType === "loan_signing") {
      templateID = (passwordToSend === "") ? 34 : 33;
    } else {
      templateID = (passwordToSend === "") ? 3 : 4;
    }
    if (meetingdate) {
      preDateText = "Your meeting with the notary is scheduled for ";
      if (templateID === 4) {
        preDateText = "Your meeting is scheduled for ";
      }
      //meetingDateFormatted = moment(meetingdate).utcOffset("-06:00").format("MMMM, Do YYYY") + " at " + moment(meetingdate).utcOffset("-06:00").format("hh:mmA") + " CST";
      meetingDateFormatted = moment(meetingdate).format("MMMM, Do YYYY") + " at " + moment(meetingdate).format("hh:mmA") + " " + actualTimezone;
    }
    let emailCustomMessage = "You've been invited to a notarization session using the BlueNotary platform.";
    let emailLogoUrl = "https://img.mailinblue.com/4452360/images/content_library/original/626215907bdc8059ca08a677.png";
    if (notaryUser && notaryUser.memberType === "pro") {
      if (notaryUser.sendBrandEmails && notaryUser.sendBrandEmails === true ) {
        if (notaryUser.emailCustomMessage) {
          emailCustomMessage = notaryUser.emailCustomMessage;
        }
        if (notaryUser.emailLogoUrl) {
          emailLogoUrl = notaryUser.emailLogoUrl;
        }
      }
    }
    if (sessionDoc && sessionDoc.invitedByCustomer) {
      const invitedByCustomerDoc = await User.findOne({
        _id: sessionDoc.invitedByCustomer,
      });
      if (invitedByCustomerDoc && invitedByCustomerDoc.sendBrandEmails && invitedByCustomerDoc.sendBrandEmails === true ) {
        if (invitedByCustomerDoc.emailCustomMessage) {
          emailCustomMessage = invitedByCustomerDoc.emailCustomMessage;
        }
        if (invitedByCustomerDoc.emailLogoUrl) {
          emailLogoUrl = invitedByCustomerDoc.emailLogoUrl;
        }
      }
    }
    const sendData = {
      to: [{
        email: user.email,
        name: user.name,
      }],
      templateId: templateID,
      params: {
        preDateText,
        meetingdate: meetingDateFormatted,
        password: passwordToSend,
        inviteLink: `${process.env.FRONT_URL}/sign-mail/sign-in?type=customer&email=${user.email}&password=${password}&loginViaEmail=true&sessionid=${sessionID}&routetype=prepareDoc&autosubmit=true`,
        userName,
        emailCustomMessage,
        emailLogoUrl,
      },
    };
    console.log("sendData", sendData);
    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("sendNotarySignerEmail API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );

    // Also sending email to notary regarding invited session
    if (sessionDoc && sessionDoc.invitedByCustomer && sessionDoc.notaryUserId) {
      let notaryTemplateID;
      if (sessionDoc?.sessionType === "loan_signing") {
        notaryTemplateID = 43;
      } else {
        notaryTemplateID = 42;
      }
      let preDateTextForNotary = "Your meeting with the customer is scheduled for";

      const sendDataToNotary = {
        to: [{
          email: notaryUser.email,
          name: notaryUser.name,
        }],
        templateId: notaryTemplateID,
        params: {
          preDateText: preDateTextForNotary,
          meetingdate: meetingDateFormatted,
          inviteLink: `${process.env.FRONT_URL}/sign-mail/sign-in?type=customer&email=${user.email}`,
          userName,
          emailCustomMessage,
          emailLogoUrl,
        },
      };
      console.log("sendDataToNotary", sendDataToNotary);
      apiInstance.sendTransacEmail(sendDataToNotary).then(
        function(data) {
          console.log("sendNotarySignerEmail for notary API called successfully. Returned data: ", data);
        },
        function(error) {
          console.error(error);
        },
      );
    }
  },

  // notary signer session reminder email
  async sendSessionReminderEmails(userdoc, meetingdate, meetingTimeZone, sessionID, fullSessionId) {
    console.log("meetingDate ", meetingdate);
    const templateID = 18;
    // const meetingDateFormatted = moment(meetingdate).utcOffset("-06:00").format("MMMM, Do YYYY") + " at " + moment(meetingdate).utcOffset("-06:00").format("hh:mmA") + " CST";
    const meetingDateFormatted = meetingdate + " " + getTimeZone(meetingTimeZone);
    const preDateText = "Notary Session ID is " + sessionID + " and Session Time is";
    const password = userdoc.password;
    const sendData = {
      to: [{
        email: userdoc.email,
        name: userdoc.name,
      }],
      templateId: templateID,
      params: {
        userName: userdoc.name,
        preDateText,
        meetingdate: meetingDateFormatted,
        sessionid: sessionID,
        inviteLink: `${process.env.FRONT_URL}/sign-mail/sign-in?type=customer&email=${userdoc.email}&password=${password}&loginViaEmail=true&sessionid=${fullSessionId}&routetype=prepareDoc&autosubmit=true`,
        // inviteLink: `${process.env.FRONT_URL}/sign-in?type=customer&email=${user.email}&password=${password}&loginViaEmail=true&sessionid=${sessionID}&routetype=prepareDoc&autosubmit=true`,
      },
    };
    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("sendSessionReminderEmails API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );
  },
  // notary signer session due email
  async sendSessionDueEmails(userdoc, meetingdate, meetingTimeZone, sessionID) {
    console.log("meetingDate ", meetingdate);
    const templateID = 30;
    // const meetingDateFormatted = moment(meetingdate).utcOffset("-06:00").format("MMMM, Do YYYY") + " at " + moment(meetingdate).utcOffset("-06:00").format("hh:mmA") + " CST";
    const meetingDateFormatted = meetingdate + " " + getTimeZone(meetingTimeZone);
    const preDateText = "Notary Session ID is " + sessionID + " and Session Time is";
    const sendData = {
      to: [{
        email: userdoc.email,
        name: userdoc.name,
      }],
      templateId: templateID,
      params: {
        userName: userdoc.name,
        preDateText,
        meetingdate: meetingDateFormatted,
        sessionid: sessionID,
        // inviteLink: `${process.env.FRONT_URL}/sign-in?type=customer&email=${user.email}&password=${password}&loginViaEmail=true&sessionid=${sessionID}&routetype=prepareDoc&autosubmit=true`,
      },
    };
    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("sendSessionDueEmails API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );
  },
  // customer email sent when notary picks a session
  async sendEmailToCustomerRegardingSessionPicked(userdoc, meetingdate, meetingTimeZone, sessionID, fullSessionId) {
    console.log("meetingDate ", meetingdate);
    const templateID = 19;
    // const meetingDateFormatted = moment(meetingdate).utcOffset("-06:00").format("MMMM, Do YYYY") + " at " + moment(meetingdate).utcOffset("-06:00").format("hh:mmA") + " CST";
    const meetingDateFormatted = meetingdate + " " + getTimeZone(meetingTimeZone);
    const preDateText = "Notary Session ID is " + sessionID + " and Session Time is";
    const sendData = {
      to: [{
        email: userdoc.email,
        name: userdoc.name,
      }],
      templateId: templateID,
      params: {
        preDateText,
        userName: userdoc.name,
        meetingdate: meetingDateFormatted,
        sessionid: sessionID,
        inviteLink: `${process.env.FRONT_URL}/sign-mail/sign-in?type=customer&email=${userdoc.email}&password=${userdoc.password}&loginViaEmail=true&sessionid=${fullSessionId}&routetype=prepareDoc&autosubmit=true`,
        // inviteLink: `${process.env.FRONT_URL}/sign-in?type=customer&email=${user.email}&password=${password}&loginViaEmail=true&sessionid=${sessionID}&routetype=prepareDoc&autosubmit=true`,
      },
    };
    console.log(sendData);
    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("sendEmailToCustomerRegardingSessionPicked API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );
  },

  // send email to Selected Notary about the session
  async sendEmailToSelectedNotary(sessionId, notaryId, fullSessionId) {
    // find notary
    const notary = await User.findOne({_id: notaryId, deleted: {"$ne": true}});
    // notary exists, verified and approved
    if (notary && notary.verified && notary.approve !== "inactive") {
      const sendData = {
        to: [{
          email: notary.email,
          name: notary.name,
        }],
        templateId: 6,
        params: {
          userName: notary.name,
          sessionId,
          // dashboardLink: `${process.env.FRONT_URL}/notary/dashboard/`,
          dashboardLink: `${process.env.FRONT_URL}/sign-mail/sign-in?type=notary&email=${notary.email}&password=${notary.password}&loginViaEmail=true&sessionid=${fullSessionId}&routetype=pdfEdit&autosubmit=true`,
        },
      };

      apiInstance.sendTransacEmail(sendData).then(
        function(data) {
          console.log("Assigned Notary Alert API called successfully. Returned data: ", data);
        },
        function(error) {
          console.error(error);
        },
      );
    }
  },

  // send email to All Notaries about the session
  async sendEmailToAllNotaries(sessionId, sessionDoc, identityModelData) {
    let notaries;
    let openCallType = "everyone";
    let openCallState = "";
    const nontestingAccSession = sessionDoc.testingAccSession ? false : true;
    const userQuery = {
      role: "notary",
      verified: true,
      testingacc: {"$ne": nontestingAccSession},
      memberType: "pro",
      memberTypeProWhenInvited: {"$ne": true},
      dontSendOpenCalls: {"$ne": true},
      approve: {"$ne": "inactive"},
      deleted: {"$ne": true},
    };
    let vendorDoc;
    if (sessionDoc?.vendor) {
      vendorDoc = await Vendors.findOne({_id: sessionDoc?.vendor, deleted: {"$ne": true}});
      if (vendorDoc?.openCallSettings?.vendorTeamInternalOpenCall) {
        delete userQuery.memberTypeProWhenInvited;
        userQuery.vendor = vendorDoc._id;
      }
    }
    if (sessionDoc?.typeOfKBA === "foreigners_without_residential") {
      openCallType = "biometrics";
      userQuery.state = {"$in": ["Florida", "Virginia", "Pennsylvania", "Montana", "Louisiana", "Wyoming", "New Jersey"]};
    }
    if (sessionDoc?.requestForStateSpecificNotary && sessionDoc?.requestForStateSpecificNotaryStateName) {
      openCallType = "state_specific";
      openCallState = sessionDoc?.requestForStateSpecificNotaryStateName;
      userQuery.state = {"$in": [sessionDoc?.requestForStateSpecificNotaryStateName]};
    }
    if (sessionDoc?.requestForSpanishNotary) {
      openCallType += "-spanish_speaking";
      userQuery.spanishLanguageFluency = true;
    }
    console.log("userQuery", userQuery);
    console.log("openCallTypeopenCallType", openCallType);
    notaries = await User.find(userQuery);
    let emailData = [];
    let openCallLogs = [];
    const allOpenCallNumbers = await OpenCalls.distinct("openCallNumber", {
      sessionid: sessionDoc._id,
    });
    if (notaries) {
      notaries.forEach(notary => {
        // send email if notary is active and a pro member
        emailData.push({
          email: notary.email,
          name: notary.name,
        });
        openCallLogs.push({
          sessionid: sessionDoc._id,
          userId: notary._id,
          vendor: sessionDoc.vendor,
          openCallNumber: allOpenCallNumbers.length + 1,
          category: "session_opencall_gnw",
          openCallType,
          openCallState,
        });
      });
    }
    OpenCalls.insertMany(openCallLogs);
    emailData = _.shuffle(emailData);
    if (!sessionDoc.testingAccSession && emailData && emailData.length) {
      const chunkSize = 7;
      for (let i = 0; i < emailData.length; i += chunkSize) {
        const emailDataChunks = emailData.slice(i, i + chunkSize);
        const sendData = {
          to: [
            {
              "email": "info@bluenotary.us",
              "name": "Blue Notary",
            },
          ],
          bcc: emailDataChunks,
          templateId: 7,
          params: {
            sessionId,
            dashboardLink: `${process.env.FRONT_URL}/notary/dashboard/`,
          },
        };
        console.log("sendData OPEN CALL", sendData);
        apiInstance.sendTransacEmail(sendData).then(
          function(data) {
            console.log("Unassigned Open Call API called successfully. Returned data: ", data);
          },
          function(error) {
            console.log("Unassigned Open Call API failed");
            console.error(error);
          },
        );
      }
    }
  },

  // send email to All Notaries about the session for Loan Signing
  async sendEmailToAllNotariesForLoanSigning(sessionId, sessionDoc, identityModelData) {
    let notaries;
    let openCallType = "everyone";
    let openCallState = "";
    const nontestingAccSession = sessionDoc.testingAccSession ? false : true;
    const userQuery = {
      role: "notary",
      verified: true,
      testingacc: {"$ne": nontestingAccSession},
      memberType: "pro",
      memberTypeProWhenInvited: {"$ne": true},
      lsaApprovalStatus: "approved",
      approve: {"$ne": "inactive"},
      dontSendOpenCalls: {"$ne": true},
      deleted: {"$ne": true},
    };
    let vendorDoc;
    if (sessionDoc?.vendor) {
      vendorDoc = await Vendors.findOne({_id: sessionDoc?.vendor, deleted: {"$ne": true}});
      if (vendorDoc?.openCallSettings?.vendorTeamInternalOpenCall) {
        delete userQuery.memberTypeProWhenInvited;
        userQuery.vendor = vendorDoc._id;
      }
    }
    if (sessionDoc?.typeOfKBA === "foreigners_without_residential") {
      openCallType = "biometrics";
      userQuery.state = {"$in": ["Florida", "Virginia", "Pennsylvania", "Montana", "Louisiana", "Wyoming", "New Jersey"]};
    }
    if (sessionDoc?.requestForStateSpecificNotary && sessionDoc?.requestForStateSpecificNotaryStateName) {
      openCallType = "state_specific";
      openCallState = sessionDoc?.requestForStateSpecificNotaryStateName;
      userQuery.state = {"$in": [sessionDoc?.requestForStateSpecificNotaryStateName]};
    }
    if (sessionDoc?.requestForSpanishNotary) {
      openCallType += "-spanish_speaking";
      userQuery.spanishLanguageFluency = true;
    }
    notaries = await User.find(userQuery);
    const allOpenCallNumbers = await OpenCalls.distinct("openCallNumber", {
      sessionid: sessionDoc._id,
    });
    let emailData = [];
    let openCallLogs = [];
    if (notaries) {
      notaries.forEach(notary => {
        // send email if notary is active and a pro member
        emailData.push({
          email: notary.email,
          name: notary.name,
        });
        openCallLogs.push({
          sessionid: sessionDoc._id,
          userId: notary._id,
          vendor: sessionDoc.vendor,
          openCallNumber: allOpenCallNumbers.length + 1,
          category: "session_opencall_loansigning",
          openCallType,
          openCallState,
        });
      });
    }
    OpenCalls.insertMany(openCallLogs);
    emailData = _.shuffle(emailData);
    if (!sessionDoc.testingAccSession && emailData && emailData.length) {
      const chunkSize = 7;
      for (let i = 0; i < emailData.length; i += chunkSize) {
        const emailDataChunks = emailData.slice(i, i + chunkSize);
        const sendData = {
          to: [
            {
              "email": "info@bluenotary.us",
              "name": "Blue Notary",
            },
          ],
          bcc: emailDataChunks,
          templateId: 29,
          params: {
            sessionId,
            dashboardLink: `${process.env.FRONT_URL}/notary/dashboard/`,
          },
        };
        console.log("sendData OPEN CALL For Loan Signing", sendData);
        apiInstance.sendTransacEmail(sendData).then(
          function(data) {
            console.log("Unassigned Open Call API for Loan Signing called successfully. Returned data: ", data);
          },
          function(error) {
            console.log("Unassigned Open Call API for Loan Signing failed");
            console.error(error);
          },
        );
      }
    }
  },

  // send email to All Notaries which needs session witness as open call
  async sendEmailToAllNotariesForWitnessInSession(sessionId, sessionDoc, identityModelData) {
    const nontestingAccSession = sessionDoc.testingAccSession ? false : true;
    const userQuery = {
      role: "notary",
      verified: true,
      testingacc: {"$ne": nontestingAccSession},
      memberType: "pro",
      memberTypeProWhenInvited: {"$ne": true},
      approve: {"$ne": "inactive"},
      dontSendOpenCalls: {"$ne": true},
      deleted: {"$ne": true},
      _id: {"$ne": sessionDoc.notaryUserId},
    };
    let vendorDoc;
    if (sessionDoc?.vendor) {
      vendorDoc = await Vendors.findOne({_id: sessionDoc?.vendor, deleted: {"$ne": true}});
      if (vendorDoc?.openCallSettings?.vendorTeamInternalOpenCall) {
        delete userQuery.memberTypeProWhenInvited;
        userQuery.vendor = vendorDoc._id;
      }
    }
    const allOpenCallNumbers = await OpenCalls.distinct("openCallNumber", {
      sessionid: sessionDoc._id,
    });
    console.log("userQueryforWitnessOpenCall", userQuery);
    const notaries = await User.find(userQuery);
    let emailData = [];
    let openCallLogs = [];
    if (notaries) {
      notaries.forEach(notary => {
        // send email if notary is active and a pro member
        emailData.push({
          email: notary.email,
          name: notary.name,
        });
        openCallLogs.push({
          sessionid: sessionDoc._id,
          userId: notary._id,
          vendor: sessionDoc.vendor,
          openCallNumber: allOpenCallNumbers.length + 1,
          category: "session_witness_opencall",
          openCallType: "everyone",
        });
      });
    }
    emailData = _.shuffle(emailData);
    if (!sessionDoc.testingAccSession && emailData && emailData.length) {
      const chunkSize = 7;
      for (let i = 0; i < emailData.length; i += chunkSize) {
        const emailDataChunks = emailData.slice(i, i + chunkSize);
        const sendData = {
          to: [
            {
              "email": "info@bluenotary.us",
              "name": "Blue Notary",
            },
          ],
          bcc: emailDataChunks,
          templateId: 31,
          params: {
            sessionId,
            dashboardLink: `${process.env.FRONT_URL}/notary/dashboard/`,
          },
        };
        console.log("sendData OPEN CALL For Witness Open Call", sendData);
        apiInstance.sendTransacEmail(sendData).then(
          function(data) {
            console.log("Unassigned Open Call API for Witness Open Call called successfully. Returned data: ", data);
          },
          function(error) {
            console.log("Unassigned Open Call API for Witness Open Call failed");
            console.error(error);
          },
        );
      }
    }
  },

  // send email to Witness when invited to a session
  async sendEmailToWitnessWhenInvitedToSession(user, password, meetingdate, meetingTimeZone, sessionID) {
    console.log("meetingDate ", meetingdate);
    const templateID = 11;
    // let meetingDateFormatted = "";
    // if (meetingdate) {
    //   meetingDateFormatted = moment(meetingdate).utcOffset("-06:00").format("MMMM, Do YYYY") + " at " + moment(meetingdate).utcOffset("-06:00").format("hh:mmA") + " CST";
    // }
    const meetingDateFormatted = meetingdate + " " + getTimeZone(meetingTimeZone);
    const finalEmail = user.realEmail || user.email;
    const sendData = {
      to: [{
        email: finalEmail,
        name: user.name,
      }],
      templateId: templateID,
      params: {
        userName: user.name,
        meetingdate: meetingDateFormatted,
        password: password,
        preDateText: "Your meeting with the notary is scheduled for ",
        inviteLink: `${process.env.FRONT_URL}/sign-mail/sign-in?type=witness&email=${user.email}&password=${password}&temporary=true&sessionid=${sessionID}&autosubmit=true`,
      },
    };
    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("sendEmailToWitnessWhenInvitedToSession API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );
  },

  // send email to Additional Signer when invited to a session
  async sendEmailToAdditionalSignerWhenInvitedToSession(user, password, meetingDateFormatted, sessionID, vendorDoc, notaryUserDoc, sessionDoc) {
    console.log("meetingDate ", meetingDateFormatted);
    let templateID = 21;
    if (sessionDoc?.sessionType === "loan_signing") {
      templateID = 35;
    }
    const finalEmail = user.realEmail || user.email;
    const companyName = vendorDoc?.whitelabel_imagetext || "Bluenotary Platform";
    const frontURL = vendorDoc?.whitelabel_baseurl || process.env.FRONT_URL;
    let emailLogoUrl = "https://img.mailinblue.com/4452360/images/content_library/original/626215907bdc8059ca08a677.png";
    let emailCustomMessage = "You've been invited as Additional Signer a notarization session using " + companyName + ".";
    if (notaryUserDoc && notaryUserDoc.memberType === "pro") {
      if (notaryUserDoc.sendBrandEmails && notaryUserDoc.sendBrandEmails === true ) {
        if (notaryUserDoc.emailCustomMessage) {
          emailCustomMessage = notaryUserDoc.emailCustomMessage;
        }
        if (notaryUserDoc.emailLogoUrl) {
          emailLogoUrl = notaryUserDoc.emailLogoUrl;
        }
      }
    }
    if (sessionDoc && sessionDoc.invitedByCustomer) {
      const invitedByCustomerDoc = await User.findOne({
        _id: sessionDoc.invitedByCustomer,
      });
      if (invitedByCustomerDoc && invitedByCustomerDoc.sendBrandEmails && invitedByCustomerDoc.sendBrandEmails === true ) {
        if (invitedByCustomerDoc.emailCustomMessage) {
          emailCustomMessage = invitedByCustomerDoc.emailCustomMessage;
        }
        if (invitedByCustomerDoc.emailLogoUrl) {
          emailLogoUrl = invitedByCustomerDoc.emailLogoUrl;
        }
      }
    }
    if (vendorDoc?.whitelabel_imageurl) {
      emailLogoUrl = vendorDoc.whitelabel_imageurl;
    }
    const sendData = {
      to: [{
        email: finalEmail,
        name: user.name,
      }],
      templateId: templateID,
      params: {
        companyName,
        emailCustomMessage: emailCustomMessage,
        emailLogoUrl,
        preDateText: "Your meeting with the notary is scheduled for ",
        userName: user.name,
        meetingdate: meetingDateFormatted,
        password: password,
        inviteLink: `${frontURL}/sign-mail/sign-in?type=customer&email=${user.email}&password=${password}&loginViaEmail=true&routetype=businessKBA&sessionid=${sessionID}&autosubmit=true`,
      },
    };
    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("sendEmailToAdditionalSignerWhenInvitedToSession API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );
  },

  // send email to Point of Contact/Agent when invited to a session
  async sendEmailToPointOfContactWhenInvitedToSession(user, password, meetingDateFormatted, sessionID, vendorDoc, notaryUserDoc, sessionDoc, pocDoc) {
    console.log("meetingDate ", meetingDateFormatted);
    let templateID = 39;
    const finalEmail = user.realEmail || user.email;
    const companyName = vendorDoc?.whitelabel_imagetext || "Bluenotary Platform";
    const frontURL = vendorDoc?.whitelabel_baseurl || process.env.FRONT_URL;
    let emailLogoUrl = "https://img.mailinblue.com/4452360/images/content_library/original/626215907bdc8059ca08a677.png";
    let emailCustomMessage = "You've been invited as " + humanizeString(pocDoc.role) + " a notarization session using " + companyName + ".";
    if (notaryUserDoc && notaryUserDoc.memberType === "pro") {
      if (notaryUserDoc.sendBrandEmails && notaryUserDoc.sendBrandEmails === true ) {
        if (notaryUserDoc.emailCustomMessage) {
          emailCustomMessage = notaryUserDoc.emailCustomMessage;
        }
        if (notaryUserDoc.emailLogoUrl) {
          emailLogoUrl = notaryUserDoc.emailLogoUrl;
        }
      }
    }
    if (sessionDoc && sessionDoc.invitedByCustomer) {
      const invitedByCustomerDoc = await User.findOne({
        _id: sessionDoc.invitedByCustomer,
      });
      if (invitedByCustomerDoc && invitedByCustomerDoc.sendBrandEmails && invitedByCustomerDoc.sendBrandEmails === true ) {
        if (invitedByCustomerDoc.emailCustomMessage) {
          emailCustomMessage = invitedByCustomerDoc.emailCustomMessage;
        }
        if (invitedByCustomerDoc.emailLogoUrl) {
          emailLogoUrl = invitedByCustomerDoc.emailLogoUrl;
        }
      }
    }
    if (vendorDoc?.whitelabel_imageurl) {
      emailLogoUrl = vendorDoc.whitelabel_imageurl;
    }
    const sendData = {
      to: [{
        email: finalEmail,
        name: user.name,
      }],
      templateId: templateID,
      params: {
        companyName,
        emailCustomMessage: emailCustomMessage,
        emailLogoUrl,
        preDateText: "Your meeting with the notary is scheduled for ",
        userName: user.name,
        meetingdate: meetingDateFormatted,
        password: password,
        inviteLink: `${frontURL}/sign-mail/sign-in?type=customer&email=${user.email}&password=${password}&loginViaEmail=true&routetype=pdfEdit&sessionid=${sessionID}&autosubmit=true`,
      },
    };
    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("sendEmailToPointOfContactWhenInvitedToSession API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );
  },

  // send email to Notary when invited in some Business Customer Account
  async sendEmailToNotaryWhenInvitedByBusinessCustomer(user, password, customerUser) {
    const templateID = 26;
    const finalEmail = user.realEmail || user.email;
    const sendData = {
      to: [{
        email: finalEmail,
        name: user.name,
      }],
      templateId: templateID,
      params: {
        userName: user.name,
        inviteLink: `${process.env.FRONT_URL}/sign-mail/sign-in?type=notary&email=${user.email}&password=${password}&loginViaEmail=true&routetype=settings&autosubmit=true`,
      },
    };
    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("sendEmailToNotaryWhenInvitedByBusinessCustomer API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );
  },

  //send mail to customer when session is completed
  async sendMailWhenSessionIsCompleted(sessionid, username, useremail, sessiondoc) {
    const templateID = 27;
    const sendData = {
      to: [{
        email: useremail,
        name: username,
      }],
      templateId: templateID,
      params: {
        userName: username,
        redirectUrl: process.env.FRONT_URL + "/sign-in?type=customer&routetype=businessConfirmation&sessionid=" + sessionid,
      },
    };
    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("sendMailWhenSessionIsCompleted API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );
    console.log("sessiondoc?.invitedByCustomer", sessiondoc?.invitedByCustomer);
    if (sessiondoc?.invitedByCustomer) {
      const invitedByCustomerDoc = await User.findOne({
        _id: sessiondoc?.invitedByCustomer,
      });
      console.log("invitedByCustomerDoc", invitedByCustomerDoc);
      if (invitedByCustomerDoc) {
        const templateID2 = 41;
        const sendData2 = {
          to: [{
            email: invitedByCustomerDoc.email,
            name: invitedByCustomerDoc.name,
          }],
          templateId: templateID2,
          params: {
            userName: invitedByCustomerDoc.name,
            redirectUrl: process.env.FRONT_URL + "/sign-in?type=customer&routetype=businessAdminConfirmation&sessionid=" + sessionid,
          },
        };
        apiInstance.sendTransacEmail(sendData2).then(
          function(data) {
            console.log("sendMailWhenSessionIsCompleted API called successfully. Returned data: ", data);
          },
          function(error) {
            console.error(error);
          },
        );
      }
    }
  },
  // Session Rescheduled Email
  async sendSessionRescheduledEmail(userdoc, meetingdate, meetingTimeZone, sessionID, fullSessionId) {
    console.log("meetingDate ", meetingdate);
    const templateID = 36;
    // const meetingDateFormatted = moment(meetingdate).utcOffset("-06:00").format("MMMM, Do YYYY") + " at " + moment(meetingdate).utcOffset("-06:00").format("hh:mmA") + " CST";
    const meetingDateFormatted = meetingdate + " " + getTimeZone(meetingTimeZone);
    const preDateText = "Notary Session ID is " + sessionID + " and Session Time is";
    console.log("userdoc.email", userdoc.email);
    const sendData = {
      to: [{
        email: userdoc.email,
        name: userdoc.name,
      }],
      templateId: templateID,
      params: {
        userName: userdoc.name,
        preDateText,
        meetingdate: meetingDateFormatted,
        sessionid: sessionID,
        inviteLink: `${process.env.FRONT_URL}/sign-mail/sign-in?type=customer&email=${userdoc.email}&password=${userdoc.password}&loginViaEmail=true&sessionid=${fullSessionId}&routetype=prepareDoc&autosubmit=true`,
      },
    };
    apiInstance.sendTransacEmail(sendData).then(
      function(data) {
        console.log("sendSessionRescheduledEmail API called successfully. Returned data: ", data);
      },
      function(error) {
        console.error(error);
      },
    );
  },
};
