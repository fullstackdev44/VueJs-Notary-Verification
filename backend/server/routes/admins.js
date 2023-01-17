const controller = require("../controllers/admins");
const AuthController = require("../controllers/auth");
const validate = require("../controllers/admin.validate");

const express = require("express");
const router = express.Router();
const trimRequest = require("trim-request");
const path = require("path");
const passport = require("passport");
const requireAuth = passport.authenticate("jwt", {
  session: false,
});
// router.post(
//   "/startCampaign/:id",
//   requireAuth,
//   AuthController.roleAuthorization(["admin"]),
//   trimRequest.all,
//   validate.startCampaign,
//   controller.startCampaign
// );
// router.post(
//   "/startCampaignSearch/:id",
//   requireAuth,
//   AuthController.roleAuthorization(["admin"]),
//   trimRequest.all,
//   validate.startCampaign,
//   controller.startCampaignSearch
// );

router.get(
  "/approve/user/:email",
  trimRequest.all,
  controller.approveUser,
);

router.get(
  "/reject/user/:email",
  trimRequest.all,
  controller.rejectUser,
);

router.get(
  "/approved/lsaUser/:notaryUserId",
  trimRequest.all,
  controller.approveLSAUser,
);

router.get(
  "/rejected/lsaUser/:notaryUserId",
  trimRequest.all,
  controller.rejectLSAUser,
);

router.get(
  "/make/admin/user/:email",
  trimRequest.all,
  controller.makeUserAdmin,
);

router.get(
  "/regenerateNotaryBuyDC/:email",
  trimRequest.all,
  controller.regenerateNotaryBuyDC,
);

router.post(
  "/fetchNotaries/:id",
  trimRequest.all,
  controller.fetchNotaries,
);
router.post(
  "/fetchCustomers/:id",
  trimRequest.all,
  controller.fetchCustomers,
);
router.post(
  "/fetchSessions/:id",
  trimRequest.all,
  controller.fetchSessions,
);
router.post(
  "/fetchMetrics",
  trimRequest.all,
  controller.fetchMetrics,
);
router.post(
  "/fetchMetricsTimeSet",
  trimRequest.all,
  controller.fetchMetricsTimeSet,
);
router.post(
  "/deleteUser/:id",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["admin"]),
  controller.deleteUser,
);
router.post(
  "/makeOpenSession/:sessionid",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization("admin"),
  controller.makeOpenSession,
);
router.post(
  "/makeSessionForAllStates/:sessionid",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization("admin"),
  controller.makeSessionForAllStates,
);
router.post(
  "/modifySessionFields/:sessionid",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization("admin"),
  controller.modifySessionFields,
);
router.post(
  "/makeSessionForSpanishNotaries/:sessionid",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization("admin"),
  controller.makeSessionForSpanishNotaries,
);
router.post(
  "/turnOnInviteSigner/:customerUserId",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization("admin"),
  controller.turnOnInviteSigner,
);
router.post(
  "/unblockUser/:customerUserId",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization("admin"),
  controller.unblockUser,
);
router.get(
  "/getActiveSessionStat/:sessionid",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["admin"]),
  controller.getActiveSessionStat,
);
router.get(
  "/getActiveSessionElements/:sessionid",
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(["admin"]),
  controller.getActiveSessionElements,
);
module.exports = router;
