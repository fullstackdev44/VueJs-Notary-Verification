const controller = require("../controllers/api");
const validate = require("../controllers/apivalidate");
const AuthController = require("../controllers/auth");
const express = require("express");
const router = express.Router();
const trimRequest = require("trim-request");
const passport = require("passport");
import * as Limiter from "../middleware/ratelimiter";
const redisClient = require('redis').createClient();
const requireAuth = passport.authenticate("jwt", {
  session: false,
});
redisClient.connect();
router.post(
  "/loads",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["customer"]),
  validate.sessionidWithUserID,
  controller.loadsSessionData,
);
// get Audit trail session
router.get(
  "/getAuditTrail/:id",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["customer", "notary", "admin"]),
  controller.getAuditTrail,
);
// archieve session
router.post(
  "/archieve",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["customer", "notary"]),
  validate.sessionid,
  controller.archieveSessionItem,
);
// unarchieve session
router.post(
  "/unarchieve",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["customer", "notary"]),
  validate.sessionid,
  controller.unarchieveSessionItem,
);
// delete session
router.post(
  "/delete",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["customer"]),
  validate.sessionidWithDocumentID,
  controller.deleteSessionItem,
);
// delete session document
router.post(
  "/documentDelete",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["customer"]),
  validate.sessionidWithDocumentID,
  controller.deleteSessionDocument,
);
router.post(
  "/personalData",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["customer", "notary"]),
  validate.savePersonalData,
  controller.savePersonalData,
);
router.post(
  "/load/personalData",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  validate.sessionid,
  controller.loadPersonalData,
);
router.post(
  "/load/sessiondata",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["customer"]),
  controller.sessiondata,
);
router.post(
  "/load/sessiondata/:id",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["customer"]),
  controller.sessiondatawithPagination,
);
router.post(
  "/createCustomer",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["customer"]),
  validate.savePersonalData,
  controller.createCustomer,
);
router.post(
  "/createCustomerForInviteSigner",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["customer", "notary"]),
  validate.createCustomerForInviteSigner,
  controller.createCustomerForInviteSigner,
);
router.post(
  "/repaymentForSession",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["customer", "notary"]),
  validate.repaymentForSession,
  controller.repaymentForSession,
);
router.get(
  "/fullSessionData/:id",
  trimRequest.all,
  requireAuth,
  // AuthController.roleAuthorization(["notary", "customer"]),
  controller.fullSessionData,
);
router.post(
  "/savePDFEditingPage/:id",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  controller.savePDFEditingPage,
);
router.get(
  "/getConsumerPlusApiResponse/:id",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  controller.getConsumerPlusApiResponse,
);
router.get(
  "/getCustomerDetailsDuringSessionFlow/:id",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  controller.getCustomerDetailsDuringSessionFlow,
);
router.post(
  "/getCustomerDetailsAfterChecking/:id",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  controller.getCustomerDetailsAfterChecking,
);
router.post(
  "/verifyCustomerAnswersDuringSessionFlow/:id",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  validate.verifyCustomerAnswersDuringSessionFlow,
  controller.verifyCustomerAnswersDuringSessionFlow,
);
router.post(
  "/savePersonaDetailsForPhotoid/:id",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  validate.savePersonaDetailsForPhotoid,
  controller.savePersonaDetailsForPhotoid,
);
router.post(
  "/saveSessionData/:id",Limiter.OpenCallslimiter(redisClient),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  // validate.saveSessionData,
  controller.saveSessionData,
);
router.post(
  "/pickUpSession/:id",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  // validate.pickUpSession,
  controller.pickUpSession,
);

// set session stage/status
router.get(
  "/setSessionStageOrStatus/:id", // ?type=status|stage&value=anything
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  controller.setSessionStageOrStatus,
);

// get session stage/status
router.get(
  "/isValidSession/:id",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  controller.isValidSession,
);

router.get(
  "/expireSessionDocuments",
  trimRequest.all,
  controller.expireSessionDocuments,
);

router.post(
  "/addWitnessDuringSession", Limiter.OpenCallslimiterWitness(redisClient),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  validate.addWitnessDuringSession,
  controller.addWitnessDuringSession,
);
router.get(
  "/getAllWitnessDetails",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  // validate.getAllWitnessDetails,
  controller.getAllWitnessDetails,
);
router.post(
  "/joinSessionAsWitness",
  trimRequest.all,
  requireAuth,
  // AuthController.roleAuthorization(["notary", "customer"]),
  validate.joinSessionAsWitness,
  controller.joinSessionAsWitness,
);
router.get(
  "/getAllSessionWitnesses/:id",
  trimRequest.all,
  requireAuth,
  // AuthController.roleAuthorization(["notary", "customer"]),
  // validate.getAllSessionWitnesses,
  controller.getAllSessionWitnesses,
);
router.post(
  "/removeSessionWitness",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  validate.removeSessionWitness,
  controller.removeSessionWitness,
);
router.post(
  "/doOpenCallForActiveSession",Limiter.OpenCallslimiter(redisClient),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  validate.doOpenCallForActiveSession,
  controller.doOpenCallForActiveSession,
);
router.post(
  "/modifyNotaryForSession",Limiter.OpenCallslimiter(redisClient),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["customer"]),
  validate.modifyNotaryForSession,
  controller.modifyNotaryForSession,
);
router.post(
  "/saveDraftOfCurrentSession",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  validate.saveDraftOfCurrentSession,
  controller.saveDraftOfCurrentSession,
);
router.get(
  "/saveUserDetails",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer", "witness"]),
  controller.saveUserDetails,
);
router.post(
  "/saveActiveSessionStat/:sessionid",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  controller.saveActiveSessionStat,
);
router.post(
  "/sessionsActivityStatus",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  controller.sessionsActivityStatus,
);
router.post(
  "/export",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  controller.exportSessions,
);
router.post(
  "/deleteSessionDocument",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer"]),
  validate.sessionidWithDocumentID,
  controller.deleteSessionDocument,
);
router.post(
  "/video/join",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer", "witness", "admin"]),
  validate.videoJoin,
  controller.videoJoin,
);
router.post(
  "/video/record",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary"]),
  validate.videoJoin,
  controller.videoRecord,
);
router.post(
  "/terminateSession/:id",Limiter.OpenCallslimiter(redisClient),
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["notary"]),
  validate.terminateSession,
  controller.terminateSession,
);
router.post(
  "/getPaymentMethods",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["customer", "notary"]),
  controller.getPaymentMethods,
);
module.exports = router;
