import mongoose, { Schema } from 'mongoose'
import { INOTARYDATA } from './types'
const ObjectId = mongoose.Schema.Types.ObjectId

const notaryCertificatesSchema = new Schema({
  name: {
    type: String
  },
  url: {
    type: String
  },
  key: {
    type: String
  }
});

export const NotaryDataSchema: Schema<INOTARYDATA> = new mongoose.Schema(
  {
    certfilename: {
      type: String,
      defualt: ''
    },
    certfileLocation: {
      type: String,
      defualt: ''
    },
    certfileUrl: {
      type: String,
      defualt: ''
    },
    certfileSource: {
      type: String,
      defualt: ''
    },
    certfileAddedAt: {
      type: Date,
      defualt: ''
    },
    buyDCCertfilename: {
      type: String,
      defualt: ''
    },
    buyDCCertfileLocation: {
      type: String,
      defualt: ''
    },
    buyDCCertfileUrl: {
      type: String,
      defualt: ''
    },
    buyDCCertfileSource: {
      type: String,
      defualt: ''
    },
    buyDCCertfileAddedAt: {
      type: Date,
      defualt: ''
    },
    buyDCCertfilePassword: {
      type: String,
      defualt: ''
    },
    sealfilename: {
      type: String,
      defualt: ''
    },
    sealdata: {
      type: String,
      defualt: ''
    },
    buyPngSealfilename: {
      type: String,
      defualt: ''
    },
    buyPngSealdata: {
      type: String,
      defualt: ''
    },
    userId: {
      type: ObjectId,
      ref: 'User'
    },
    email: {
      type: String,
      defualt: ''
    },
    commissionExpiresOn: Number,
    upgradeStripeSessionId: String,
    buyDCStripeSessionId: String,
    buyDCActionDate: Date,
    buyDCPurchaseExpiryDate: Date,
    buyDCPurchaseDate: Date,
    buySealStripeSessionId: String,
    buySealActionDate: Date,
    buySealPurchaseExpiryDate: Date,
    buySealPurchaseDate: Date,
    buyComboStripeSessionId: String,
    buyComboActionDate: Date,
    buyComboPurchaseExpiryDate: Date,
    forceSubscriptionCustomerId: String,
    subscriptionCustomerId: String,
    subscriptionExpiresOn: Number,
    county: {
      type: String,
      defualt: ''
    },
    dcpassword: {
      type: String,
      defualt: ''
    },
    fileKey: {
      type: String,
      defualt: ''
    },
    buyDCfileKey: {
      type: String,
      defualt: ''
    },
    notaryCertificates: [notaryCertificatesSchema],
    notaryCopyOfCommissionLetterName: {
      type: String,
      defualt: ''
    },
    notaryCopyOfCommissionLetterUrl: {
      type: String,
      defualt: ''
    },
    notaryCopyOfCommissionLetterKey: {
      type: String,
      defualt: ''
    },
    stripeAccountName: {
      type: String,
      defualt: ''
    },
    stripeAccountLink: {
      type: String,
      defualt: ''
    },
    stripeAccountLoginLink: {
      type: String,
      defualt: ''
    },
    stripeLoginLinkCreatedAt: {
      type: Number
    },
    stripeAccountLinkValidTill: {
      type: Number,
      defualt: ''
    },
    lsaApprovalLetterKey: {
      type: String,
      defualt: ''
    },
    lsaApprovalLetterName: {
      type: String,
      defualt: ''
    },
    lsaApprovalLetterUrl: {
      type: String,
      defualt: ''
    },
    lsaApprovalLetterUploadedAt: {
      type: Date,
      defualt: ''
    },
    hundredRONcompletionProofKey: {
      type: String,
      defualt: ''
    },
    hundredRONcompletionProofName: {
      type: String,
      defualt: ''
    },
    hundredRONcompletionProofUrl: {
      type: String,
      defualt: ''
    },
    hundredRONcompletionProofUploadedAt: {
      type: Date,
      defualt: ''
    },
    eoInsuranceProofKey: {
      type: String,
      defualt: ''
    },
    eoInsuranceProofName: {
      type: String,
      defualt: ''
    },
    eoInsuranceProofUrl: {
      type: String,
      defualt: ''
    },
    eoInsuranceProofUploadedAt: {
      type: Date,
      defualt: ''
    },
    loanSigningRONExperience: {
      type: String,
      defualt: ''
    },
    spanishLanguageFluency: {
      type: Boolean,
      defualt: false
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)
export const NotaryDataModel = mongoose.model<INOTARYDATA>('notarydata', NotaryDataSchema);
