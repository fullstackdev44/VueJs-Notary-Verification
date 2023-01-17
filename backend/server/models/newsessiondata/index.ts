const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const ObjectId = mongoose.Schema.Types.ObjectId;

const stagesHistorySchema = new mongoose.Schema({
  stageName: {
    type: String
  },
  stageDate: {
    type: Date
  }
});
const multiSignerListSchema = new mongoose.Schema({
  id: {
    type: String
  },
  email: {
    type: String
  },
  emailSent: {
    type: Boolean
  }
});
const costOfNotarizationSchema = new mongoose.Schema({
  name: {
    type: String
  },
  price: {
    type: String
  },
  currency: {
    type: String
  }
});
const sessionCustomChargesSchema = new mongoose.Schema({
  id: {
    type: String
  },
  particular: {
    type: String
  },
  amount: {
    type: String
  }
});
const terminateSessionOptionsSchema = new mongoose.Schema({
  reason: {
    type: String
  },
  callNewNotary: {
    type: String
  },
  terminatedAt: {
    type: Date
  },
  terminatedBy: {
    type: ObjectId,
    ref: 'User'
  },
  terminatedByName: {
    type: String
  }
});
const pointOfContactSchema = new mongoose.Schema({
  id: {
    type: String
  },
  role: {
    type: String
  },
  role_other: {
    type: String
  },
  firstname: {
    type: String
  },
  lastname: {
    type: String
  },
  email: {
    type: String
  },
  phone: {
    type: String
  }
});
const NewSessionSchema = new mongoose.Schema(
  {
    sessionid: String,
    userId: {
      type: ObjectId,
      ref: 'User'
    },
    sessionCode: {
      type: String
    },
    notaryUserId: {
      type: ObjectId,
      ref: 'User'
    },
    invitedSession: {
      type: Boolean
    },
    invitedByCustomer: {
      type: ObjectId,
      ref: 'User'
    },
    vendor: {
      type: ObjectId,
      ref: 'Vendors'
    },
    currentStage: {
      type: String,
      enum: ['initial_stage', 'identity_check_stage', 'identity_check_stage_fail', 'kba_check_stage', 'kba_check_stage_fail', 'kba_check_stage_aborted', 'photoid_check_stage', 'photoid_check_stage_fail', 'photoid_check_stage_aborted', 'payment_info_stage', 'payment_info_check_stage_aborted', 'meet_notary_stage', 'meet_notary_stage_aborted']
    },
    originalDocumentId: {
      type: ObjectId,
      ref: 'Document'
    },
    originalDocumentIds: {
      type: Array
    },
    finalDocumentId: {
      type: ObjectId,
      ref: 'Document'
    },
    videoFileDocumentId: {
      type: ObjectId,
      ref: 'Document'
    },
    followupDocumentId: {
      type: ObjectId,
      ref: 'Document'
    },
    finalDocumentIdWithDC: {
      type: ObjectId,
      defualt: ''
    },
    x509Certificate: {
      type: String
    },
    stagesHistory: [stagesHistorySchema],
    multiSignerList: [multiSignerListSchema],
    meetingdate: {
      type: String
    },
    meetingdatetimeobj: {
      type: Date
    },
    meetingTimeZone: {
      type: String
    },
    attachCertificate: {
      type: Boolean
    },
    paid: {
      type: Boolean
    },
    sessionActive: {
      type: Boolean
    },
    sessionActiveFrom: {
      type: Date
    },
    notorizationType: {
      type: String,
      default: 'Acknowledgement'
    },
    costOfNotarization: [costOfNotarizationSchema],
    finalCostOfNotarization: {
      type: String
    },
    emptyPagesAdded: {
      type: Number
    },
    emptyPagesAddedDocIdWise: {
      type: Object
    },
    status: {
      type: String
    },
    failMessage: {
      type: String
    },
    stripePaymentData: {
      type: Array
    },
    triggeredPaymentIntents: {
      type: Array
    },
    kbaStartedAt: {
      type: Date
    },
    notorizationTiming: {
      type: String
    },
    sessionOpenCallForTaking: {
      type: Boolean
    },
    sessionOpenCallForTakingAt: {
      type: Date
    },
    sessionPickedCallForTakingAt: {
      type: Date
    },
    sessionOpenCallForWitness: {
      type: Boolean
    },
    sessionChargeOnBusinessUser: {
      type: Boolean
    },
    sessionCreatedByBusinessUser: {
      type: Boolean
    },
    sessionOpenCallForWitnessAt: {
      type: Date
    },
    archieved: {
      type: Boolean
    },
    archievedBy: {
      type: Array
    },
    archievedAt: {
      type: Date
    },
    maxWitnessJoined: {
      type: Number
    },
    videoSavingProcessingStage: {
      type: String
    },
    videoSavingProcessingError: {
      type: String
    },
    sessionType: {
      type: String
    },
    typeOfKBA: {
      type: String
    },
    forceTypeOfKBA: {
      type: String
    },
    skipCustomerKBACheck: {
      type: Boolean
    },
    sessionCustomCharges: [sessionCustomChargesSchema],
    terminateSessionOptions: [terminateSessionOptionsSchema],
    notarizationId: {
      type: String
    },
    testingAccSession: {
      type: Boolean
    },
    failedByRefresh: {
      type: Boolean
    },
    invitedViaSessionLink: {
      type: Boolean
    },
    requestForSpanishNotary: {
      type: Boolean
    },
    requestForStateSpecificNotary: {
      type: Boolean
    },
    requestForStateSpecificNotaryStateName: {
      type: String
    },
    loanSessionType: {
      type: String
    },
    otherLoanSessionType: {
      type: String
    },
    loanNumber: {
      type: String
    },
    loanSigningExtraFields: {
      type: Object
    },
    pointOfContacts: [pointOfContactSchema],
    performInSessionKBA: {
      type: Boolean
    },
    markSessionCompleteAsNonDisabled: {
      type: Boolean
    },
    hideTheWaitingRoom: {
      type: Boolean
    },
    skipSessionCharges: {
      type: Boolean
    },
    dontUseOpenVidu: {
      type: Boolean
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)
NewSessionSchema.plugin(mongoosePaginate);
export const NewSessionModel = mongoose.model('newsessions', NewSessionSchema);
