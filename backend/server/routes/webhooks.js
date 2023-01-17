const controller = require("../controllers/api");
const validate = require("../controllers/apivalidate");
const AuthController = require("../controllers/auth");
const express = require("express");
const router = express.Router();
const trimRequest = require("trim-request");

router.post(
  "/stripe/subscriptionUpdateWebhook",
  trimRequest.all,
  controller.stripeSubscriptionUpdateWebhook,
);
module.exports = router;
