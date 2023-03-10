const controller = require("../controllers/users");
const validate = require("../controllers/apivalidate");
const AuthController = require("../controllers/auth");
const express = require("express");
const router = express.Router();
require("../config/passport");

const passport = require("passport");
const requireAuth = passport.authenticate("jwt", {
  session: false,
});
const trimRequest = require("trim-request");

// /*
//  * Users routes
//  */

// /*
//  * Get items route
//  */
// router.get(
//   "/",
//   requireAuth,
//   AuthController.roleAuthorization(["user", "admin"]),
//   trimRequest.all,
//   controller.getItems
// );

// /*
//  * Create new item route
//  */
// router.post(
//   "/",
//   requireAuth,
//   AuthController.roleAuthorization(["admin"]),
//   trimRequest.all,
//   validate.createItem,
//   controller.createItem
// );

// /*
//  * Get item route
//  */
// router.get(
//   "/:id",
//   requireAuth,
//   AuthController.roleAuthorization(["admin"]),
//   trimRequest.all,
//   validate.getItem,
//   controller.getItem
// )
router.get(
  "/me",
  requireAuth,
  AuthController.roleAuthorization(["notary", "customer", "admin", "witness"]),
  trimRequest.all,
  controller.me,
);
router.get(
  "/me_sign",
  trimRequest.all,
  controller.me_sign,
);

// /*
//  * Update item route
//  */
// router.put(
//   "/:id",
//   requireAuth,
//   AuthController.roleAuthorization(["admin"]),
//   trimRequest.all,
//   validate.updateItem,
//   controller.updateItem
// );

// /*
//  * Delete item route
//  */
// router.delete(
//   "/:id",
//   requireAuth,
//   AuthController.roleAuthorization(["admin"]),
//   trimRequest.all,
//   validate.deleteItem,
//   controller.deleteItem
// );

module.exports = router;
