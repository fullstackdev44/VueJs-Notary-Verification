const controller = require("../controllers/api");
const integrationsController = require("../controllers/integrations");
const validate = require("../controllers/apivalidate");
const AuthController = require("../controllers/auth");
const Vendors = require("../models/vendors");
const express = require("express");
const router = express.Router();
const trimRequest = require("trim-request");
// const passport = require("passport");
// const requireAuth = passport.authenticate("jwt", {
//   session: false,
// });
// const Vendors = require("../models/vendors");

const integrationAuthentication = async (req, res, next) => {
  const bearerToken = req.headers.authorization.replace("Bearer ", "").trim();
  console.log(bearerToken);
  const vendorDoc = await Vendors.findOne({
    "vendor_secret_key": bearerToken,
  });
  if (!vendorDoc) {
    next("Vendor not found");
  }
  req.vendor = vendorDoc;
  next();
};

router.post(
  "/create_new_session",
  trimRequest.all,
  integrationAuthentication,
//   AuthController.roleAuthorization(["customer"]),
//   validate.sessionidWithUserID,
  integrationsController.createNewSession,
);
router.post(
  "/check_document_before_session",
  trimRequest.all,
  integrationAuthentication,
//   AuthController.roleAuthorization(["customer"]),
//   validate.sessionidWithUserID,
  integrationsController.checkDocumentBeforeSession,
);
module.exports = router;
