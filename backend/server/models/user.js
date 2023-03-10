const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const ObjectId = mongoose.Schema.Types.ObjectId;

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      validate: {
        validator: validator.isEmail,
        message: "EMAIL_IS_NOT_VALID",
      },
      lowercase: true,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "notary", "admin", "witness"],
      default: "customer",
    },
    approve: {
      type: String,
      enum: ["active", "inactive"],
    },
    verification: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    hearaboutdata: {
      required: false,
      type: String,
    },
    temporary: {
      type: Boolean,
      default: false,
    },
    realEmail: {
      type: String,
    },
    witnessid: {
      type: Object,
    },
    refferedByNotary: {
      type: Object,
    },
    registeredAs: {
      type: String,
    },
    invitedViaSessionLink: {
      type: Boolean,
      default: false,
    },
    testingacc: {
      type: Boolean,
      default: false,
    },
    first_name: {
      required: false,
      type: String,
    },
    last_name: {
      required: false,
      type: String,
    },
    name: {
      required: false,
      type: String,
    },
    phone: {
      required: false,
      type: String,
    },
    commissionNumber: {
      required: false,
      type: String,
    },
    state: {
      required: false,
      type: String,
    },
    county: {
      required: false,
      type: String,
    },
    city: {
      required: false,
      type: String,
    },
    country: {
      required: false,
      type: String,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    blockExpires: {
      type: Date,
      default: Date.now,
    },
    stripeCustomerID: String,
    stripeSubscriptionCustomerId: String,
    planID: String,
    billDate: Number,
    promoCode: {
      type: String,
    },
    memberType:  {
      type: String,
      enum: ["free", "pro", "business", "premium", "business_basic", "business_pro", "business_hybrid", "title_hybrid", "title_pro", "signing_service"], // premium and business are same
      default: "free",
    },
    memberTypeProWhenInvited: {
      type: Boolean,
      default: false,
    },
    notaryInvitedByBusinessUserId: {
      type: ObjectId,
      ref: "User",
    },
    notaryInvitedByBusinessUserDoc: Object,
    businessUserAllowedNotaryToInvite: {
      type: Boolean,
      default: false,
    },
    upgradeStripeSessionId: String,
    tempSubscriptionType: String,
    subscriptionExpiresOn: Number,
    isSubscribed: {
      type: Boolean,
      default: true,
    },
    isCommissionExpired: {
      type: Boolean,
      default: false,
    },
    totalWitnessLimit: {
      type: Boolean,
      default: false,
    },
    turnOffPdfSession: {
      type: Boolean,
      default: false,
    },
    dontSendOpenCalls: {
      type: Boolean,
      default: false,
    },
    emailLogoName: {
      type: String,
    },
    emailLogoUrl: {
      type: String,
    },
    emailLogoKey: {
      type: String,
    },
    emailCustomMessage: {
      type: String,
    },
    sendBrandEmails: {
      type: Boolean,
      default: false,
    },
    notaryCustomCharges: {
      type: Object,
    },
    localOnboardingFilledFlag: {
      type: Boolean,
    },
    userAutoApproved: {
      type: Boolean,
    },
    loginViaSalesTitlesProDemoOneTime: {
      type: Boolean,
    },
    turnOffInviteSigner: {
      type: Boolean,
    },
    updateUserNameOnFirstSession: {
      type: Boolean,
    },
    needToUpdatePasswordInSession: {
      type: Boolean,
    },
    needToUpdateEmailInSession: {
      type: Boolean,
    },
    lsaApprovalStatus: {
      type: String,
    },
    lsaApprovalSubmittedAt: {
      type: Date,
    },
    lsaApproved: {
      type: Boolean,
    },
    spanishLanguageFluency: {
      type: Boolean,
    },
    witnessDetails: {
      type: Object,
    },
    deleted: {
      type: Boolean,
    },
    deletedAt: {
      type: Date,
    },
    deletedSource: {
      type: String,
    },
    maxInvitedNotariesAllowed: {
      type: Number,
    },
    allowInitialPasswordChange: {
      type: Boolean,
    },
    needNotaryReApproval: {
      type: Boolean,
    },
    notaryReApprovalReason: {
      type: String,
    },
    landingView: {
      type: String,
    },
    disableProfile: {
      type: Boolean,
    },
    profileFilled: {
      type: Boolean,
    },
    profile: {
      type: Object,
    },
    avatarKey: {
      type: String,
    },
    avatarName: {
      type: String,
    },
    avatarUrl: {
      type: String,
    },
    avatarUploadedAt: {
      type: Date,
    },
    oldProfileFileName: {
      type: String,
    },
    blueNotaryProfileUrl: {
      type: String,
    },
    dontShowOpenCalls: {
      type: Boolean,
    },
    skipSessionCharges: {
      type: Boolean,
    },
    allSessionsAsLoanSignings: {
      type: Boolean,
    },
    inviteSignerDisableOpenCall: {
      type: Boolean,
    },
    userSource: {
      type: String,
    },
    userSource: {
      type: Object,
    },
    vendor: {
      type: Object,
    },
    vendoradmin: {
      type: Object,
    },
    notaryRoleOptions: {
      type: Object,
    },
    selectedPaymentMethod: {
      type: String,
    },
    forceSelectPaymentMethod: {
      type: Boolean,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

const hash = (user, salt, next) => {
  bcrypt.hash(user.password, salt, null, (error, newHash) => {
    if (error) {
      return next(error);
    }
    user.password = newHash;
    return next();
  });
};

const genSalt = (user, SALT_FACTOR, next) => {
  bcrypt.genSalt(SALT_FACTOR, (err, salt) => {
    if (err) {
      return next(err);
    }
    return hash(user, salt, next);
  });
};

UserSchema.pre("save", function(next) {
  const that = this;
  const SALT_FACTOR = 5;
  if (!that.isModified("password")) {
    return next();
  }
  return genSalt(that, SALT_FACTOR, next);
});

UserSchema.methods.comparePassword = function(passwordAttempt, cb) {
  bcrypt.compare(passwordAttempt, this.password, (err, isMatch) =>
    err ? cb(err) : cb(null, isMatch),
  );
};
UserSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("User", UserSchema);
