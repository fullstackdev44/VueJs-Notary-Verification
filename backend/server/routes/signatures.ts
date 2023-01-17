const controller = require('../controllers/api');
const validate = require('../controllers/apivalidate');
const AuthController = require('../controllers/auth');
import express from 'express';
const router = express.Router();
const trimRequest = require('trim-request');
const passport = require('passport');
const requireAuth = passport.authenticate('jwt', {
  session: false
});
router.get(
  '/getSignatures',
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary', 'customer', 'witness']),
  controller.getSignatures
);

router.post(
  '/deleteSignature',
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary', 'customer', 'witness']),
  validate.deleteSignature,
  controller.deleteSignature
);

router.post(
  '/saveSignature',
  trimRequest.all,
  requireAuth,
  AuthController.roleAuthorization(['notary', 'customer', 'witness']),
  validate.saveSignatures,
  controller.saveSignatures
);
module.exports = router;
