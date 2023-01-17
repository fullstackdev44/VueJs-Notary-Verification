<template>
  <q-list separator>
    <q-item v-if="calledFrom === 'admin_manage_session'">
      <q-item-section>
        <q-item-label overline>
          <div class="q-pa-md q-gutter-sm row">
            <template v-if="sessionItemResponse.session.sessionOpenCallForTakingAt && !['complete', 'expired'].includes(sessionItemResponse.session.status)">
              <q-btn color="primary" label="Mark Session as Open Call" @click="makeOpenSession(sessionItemResponse)" />
            </template>
            <template v-if="sessionItemResponse.session.requestForStateSpecificNotary && sessionItemResponse.session.requestForStateSpecificNotaryStateName && !['complete', 'expired'].includes(sessionItemResponse.session.status)">
              <q-btn color="primary" label="Make Session for All States" style="margin-left: 12px" @click="makeSessionForAllStates(sessionItemResponse)" />
            </template>
            <template>
              <q-btn color="primary" label="View Live Stats" @click="viewSessionStatsClicked(sessionItemResponse)" />
            </template>
            <template>
              <q-select v-model="sessionReloadItem" :options="sessionReloadOptions" outlined dense label="Reload" style="max-width: 20%" />
              <q-btn color="primary" label="Reload" @click="reloadSessionForUser(sessionItemResponse,'')" />
            </template>
            <template>
              <q-btn color="primary" label="Hide Waiting Room" @click="reloadSessionForUser(sessionItemResponse, 'hideWaitingRoom')" />
            </template>
            <template>
              <q-btn color="primary" label="Enable Complete Session Button" @click="reloadSessionForUser(sessionItemResponse, 'enableCompleteSessionButton')" />
            </template>
            <template v-if="sessionItemResponse.session.requestForSpanishNotary">
              <q-btn color="primary" label="Make Session for All Language Notaries" style="margin-left: 12px" @click="makeSessionForSpanishNotaries(sessionItemResponse, false)" />
            </template>
            <template v-else>
              <q-btn color="primary" label="Make Session for Spanish Fluent Notaries" style="margin-left: 12px" @click="makeSessionForSpanishNotaries(sessionItemResponse, true)" />
            </template>
          </div>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-item-label overline>
          Session ID
        </q-item-label>
        <q-item-label>
          <template v-if="sessionItemResponse.current_session_id">
            {{ sessionItemResponse.current_session_id.substr(sessionItemResponse.current_session_id.length - 5).toUpperCase() }}
          </template>
          <template v-else>
            {{ sessionItemResponse.session._id.substr(sessionItemResponse.session._id.length - 5).toUpperCase() }}
          </template>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-item-label overline>
          Notarization Act Type
        </q-item-label>
        <q-item-label class="text-capitalize">
          <template v-if="getSessionTypeText(sessionItemResponse.session.sessionType) === 'GNW'">
            {{ sessionItemResponse.session.notorizationType }}
          </template>
          <template v-else>
            {{ getSessionTypeText(sessionItemResponse.session.sessionType) }}
            <template v-if="sessionItemResponse.session.loanSessionType">
              <br />
              <b>
                Transaction Type:
              </b> {{ sessionItemResponse.session.loanSessionType }}
            </template>
            <template v-if="sessionItemResponse.session.otherLoanSessionType">
              <br />
              <b>
                Other Transaction Type:
              </b> {{ sessionItemResponse.session.otherLoanSessionType }}
            </template>
          </template>
        </q-item-label>
        <q-item-label v-if="sessionItemResponse.notary" class="text-capitalize">
          {{ 'Notary: '+sessionItemResponse.notary.name }}
        </q-item-label>
        <q-item-label v-if="sessionItemResponse.notary" class="text-capitalize">
          {{ 'Commission Number: '+sessionItemResponse.notary.commissionNumber }}
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-item-label overline>
          Signer Name and Address
        </q-item-label>
        <q-item-label>
          <template v-if="localIdentityData && localIdentityData.firstName">
            {{ `${localIdentityData.firstName} ${localIdentityData.lastName}` }}<br />
            {{ localIdentityData.addressLine1 }}<br />
            {{ localIdentityData.userState }} {{ localIdentityData.userZipCode }}
            <template v-if="localIdentityData.userCountry">
              <br />
              {{ localIdentityData.userCountry }}
            </template>
          </template>
          <template v-else>
            N/A
          </template>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item v-if="sessionItemResponse.additionalSignerIdentyDocs && sessionItemResponse.additionalSignerIdentyDocs.length">
      <q-item-section>
        <q-item-label overline>
          Additional Signers
        </q-item-label>
        <q-item-label v-for="additionalSigner in sessionItemResponse.additionalSignerIdentyDocs" :key="additionalSigner._id" class="text-capitalize">
          {{ additionalSigner.email }} - Status:
          <span v-if="!sessionItemResponse.session.skipCustomerKBACheck" style="font-weight: bold">
            <template v-if="additionalSigner.additionalSignerNextStage === 'photoid_check_stage'">
              KBA Successful. Photo ID Check Not Completed
            </template>
            <template v-else-if="additionalSigner.additionalSignerNextStage === 'meet_notary'">
              KBA and Photo ID Check Successful
            </template>
            <template v-else>
              KBA and Photo ID Check Not Completed
            </template>
          </span>
          <span v-else style="font-weight: bold">
            KBA Skipped
          </span>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item v-if="showLoanSigningFields(sessionItemResponse)">
      <q-item-section>
        <q-item-label overline>
          Loan Signing Additional Fields
        </q-item-label>
        <q-item-label>
          <div>
            <b>Property Address Line 1:</b> {{ sessionItemResponse.session.loanSigningExtraFields.loan_signing_addressLine1 }}
          </div>
          <div>
            <b>Property Address Line 2:</b> {{ sessionItemResponse.session.loanSigningExtraFields.loan_signing_addressLine2 }}
          </div>
          <div>
            <b>Property State:</b> {{ sessionItemResponse.session.loanSigningExtraFields.loan_signing_userState }}
          </div>
          <div>
            <b>Property State ZipCode:</b> {{ sessionItemResponse.session.loanSigningExtraFields.loan_signing_userZipCode }}
          </div>
          <div>
            <b>Instructions For Notary:</b> <pre>{{ sessionItemResponse.session.loanSigningExtraFields.loan_signing_notes_for_notary }}</pre>
          </div>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item v-if="sessionItemResponse.session.requestForStateSpecificNotary">
      <q-item-section>
        <q-item-label overline>
          State Specific Notary Request
        </q-item-label>
        <q-item-label>
          {{ sessionItemResponse.session.requestForStateSpecificNotaryStateName }}
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item v-if="sessionItemResponse.session.requestForSpanishNotary">
      <q-item-section>
        <q-item-label overline>
          Spanish Speaking Notary Requested?
        </q-item-label>
        <q-item-label>
          Yes
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-item-label overline>
          Original Document
        </q-item-label>
        <q-item-label>
          <template v-if="sessionItemResponse.files && sessionItemResponse.files.length">
            <a v-for="tempFinalDocument in sessionItemResponse.files" :key="tempFinalDocument._id" :href="tempFinalDocument.url" target="_blank" class="blue c-link-wrap">
              {{ tempFinalDocument.name }}
              <br />
            </a>
          </template>
          <template v-else-if="sessionItemResponse.documents && sessionItemResponse.documents.length">
            <a v-for="tempFinalDocument in sessionItemResponse.documents" :key="tempFinalDocument._id" :href="tempFinalDocument.url" target="_blank" class="blue">
              {{ tempFinalDocument.name }}
              <br />
            </a>
          </template>
          <template v-else-if="sessionItemResponse.document && sessionItemResponse.document.length">
            <a v-for="tempFinalDocument in sessionItemResponse.document" :key="tempFinalDocument._id" :href="tempFinalDocument.url" target="_blank" class="blue">
              {{ tempFinalDocument.name }}
              <br />
            </a>
          </template>
          <template v-else>
            No file uploaded
          </template>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item v-if="sessionItemResponse.intermediateDocument && sessionItemResponse.intermediateDocument.length">
      <q-item-section>
        <q-item-label overline>
          Intermediate Document (Without DC)
        </q-item-label>
        <q-item-label>
          <template>
            <a v-for="tempIntermediateDocument in sessionItemResponse.intermediateDocument" :key="tempIntermediateDocument._id" :href="tempIntermediateDocument.url" target="_blank" class="blue c-link-wrap">
              {{ tempIntermediateDocument.name }}
              <br />
            </a>
          </template>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-item-label overline>
          Final Document
        </q-item-label>
        <q-item-label>
          <template v-if="sessionItemResponse.finalDocument">
            <a v-for="tempFinalDocument in sessionItemResponse.finalDocument" :key="tempFinalDocument._id" :href="tempFinalDocument.url" target="_blank" class="blue c-link-wrap">
              {{ tempFinalDocument.name }}
              <br />
            </a>
          </template>
          <template v-else>
            Notarization not completed yet
          </template>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item v-if="sessionItemResponse.followupDocumentDoc">
      <q-item-section>
        <q-item-label overline>
          Session Report
        </q-item-label>
        <q-item-label>
          <template>
            <a :href="sessionItemResponse.followupDocumentDoc.url" target="_blank" class="blue c-link-wrap">
              Download Session Report
              <br />
            </a>
          </template>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-item-label overline>
          Notarization Start Time
        </q-item-label>
        <q-item-label>
          {{ formatDate(sessionItemResponse.sessionStartedTime, sessionItemResponse.session) }}
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-item-label overline>
          Notarization End Time
        </q-item-label>
        <q-item-label>
          {{ (sessionItemResponse.status === "complete" || sessionItemResponse.session.status === "complete" || sessionItemResponse.session.paid ) ? formatDate(sessionItemResponse.sessionEndTime, sessionItemResponse.session) : 'Notarization not completed yet' }}
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-item-label overline>
          Type of Credentials Provided
        </q-item-label>
        <q-item-label>
          {{ getKBAType(sessionItemResponse) }}
          <div v-if="localIdentityData.idcardState">
            State - {{ localIdentityData.idcardState }}
          </div>
          <div v-if="localIdentityData.idcardExpiry">
            Expiry - {{ localIdentityData.idcardExpiry }}
          </div>
        </q-item-label>
      </q-item-section>
    </q-item>

    <!-- <q-item v-if="!(sessionItemResponse.vendorDoc && sessionItemResponse.vendorDoc.skipSessionCharges) && !($vendorDoc && $vendorDoc.skipSessionCharges)"> -->
    <q-item v-if="showSessionCharges(sessionItemResponse)">
      <q-item-section>
        <q-item-label overline>
          Fee Charged
        </q-item-label>
        <q-item-label>
          <template v-if="sessionItemResponse.session.costOfNotarization && (sessionItemResponse.status === 'complete' || sessionItemResponse.session.status === 'complete' || sessionItemResponse.session.paid)">
            <div v-for="tempCost,index in sessionItemResponse.session.costOfNotarization" :key="index">
              <div :key="'tempCostname' + index" class="q-pb-md">
                <span class="text-teal">{{ tempCost.name }}</span>
                <br />
                {{ tempCost.currency }}{{ tempCost.price }}
              </div>
            </div>
            <div class="q-pb-md">
              <span class="text-teal">Total</span>
              <br />{{ sessionItemResponse.session.finalCostOfNotarization }}
            </div>
            <div v-if="sessionItemResponse.session.stripePaymentData && sessionItemResponse.session.stripePaymentData[0] && sessionItemResponse.session.stripePaymentData[0].receiptUrl" class="q-pb-md">
              <span class="text-teal">Payment Receipt</span>
              <br /> <a :href="sessionItemResponse.session.stripePaymentData[0].receiptUrl" target="_blank">Link</a>
            </div>
          </template>
          <template v-else>
            Notarization not completed yet
          </template>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-item-label overline>
          Video Recording
        </q-item-label>
        <q-item-label>
          <a v-if="sessionItemResponse.videoData" :href="sessionItemResponse.videoData.url" target="_blank" class="blue">
            {{ sessionItemResponse.videoData.name }}
          </a>
          <template v-else-if="sessionItemResponse.session.videoSavingProcessingStage">
            <div v-if="sessionItemResponse.session.videoSavingProcessingStage !== 'completed'">
              Status: {{ sessionItemResponse.session.videoSavingProcessingStage }}
            </div>
            <!-- <div v-if="sessionItemResponse.session.videoSavingProcessingError">
              Error Message: {{ sessionItemResponse.session.videoSavingProcessingError }}
            </div> -->
          </template>
          <template v-else>
            <div>N/A</div>
          </template>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item v-if="calledFrom === 'admin_manage_session'">
      <q-item-section>
        <q-item-label overline>
          Temporary Video Recording Files (Only for admins)
        </q-item-label>
        <q-item-label>
          <template v-if="sessionItemResponse.allVideoTemporaryFiles">
            <div v-for="videoTemporaryFile in sessionItemResponse.allVideoTemporaryFiles" :key="videoTemporaryFile._id">
              <a target="_blank" class="blue" :href="videoTemporaryFile.url">
                {{ videoTemporaryFile.name }}
              </a>
            </div>
          </template>
          <template v-else>
            <div>N/A</div>
          </template>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item v-if="calledFrom === 'admin_manage_session' && sessionItemResponse.session.terminateSessionOptions">
      <q-item-section>
        <q-item-label overline>
          Session Terminated Inputs
        </q-item-label>
        <q-item-label>
          <div v-for="terminateSessionOption in sessionItemResponse.session.terminateSessionOptions" :key="terminateSessionOption._id" style="margin-top: 12px;">
            <div>
              <b>Reason</b>: {{ terminateSessionOption.reason }}
            </div>
            <div>
              <b>Call New Notary</b>: {{ terminateSessionOption.callNewNotary }}
            </div>
            <div>
              <b>Terminated At</b>: {{ terminateSessionOption.terminatedAt }}
            </div>
            <div>
              <b>Terminated By</b>: {{ terminateSessionOption.terminatedByName }}
            </div>
          </div>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-item-label overline>
          Session Audit Logs
        </q-item-label>
        <q-item-label>
          <a @click="auditTrailClicked(sessionItemResponse)">
            View Audit Logs
          </a>
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script>

import _ from "lodash";
import { $axios } from "boot/axios";
import DateFormatMixin from "@/mixins/DateFormatMixin";
import ColorMixin from "@/mixins/ColorMixin";
// import moment from "moment";
export default {
  name: "SessionListViewItemExpandedComponent",
  components: {},
  mixins: [DateFormatMixin, ColorMixin],
  props: {
    sessionItemResponse: {
      type: Object,
      default: () => {}
    },
    auditTrailClicked: {
      type: Function,
      default: () => {}
    },
    calledFrom: {
      type: String,
      default: ""
    },
    viewSessionStatsClicked: {
      type: Function,
      default: () => {}
    }
  },

  data() {
    return {
      localIdentityData: {},
      sessionReloadItem: "Both",
      sessionReloadOptions: ["Notary", "Customer", "Both"],
      idClassMap: {
        cct: "Certificate of Citizenship",
        cid: "Consular ID",
        dl: "Drivers License",
        foid: "Colombia Foreigner ID",
        hic: "Canada Health Insurance Card",
        id: "Identification Card",
        ipp: "Russia Internal Passport",
        keyp: "Australia Keypass ID",
        ltpass: "Singapore Long Term Visit Pass",
        myn: "Japan MyNumber Card",
        nbi: "Philippines National Bureau of Investigation Certificate",
        nric: "Singapore National Residency ID",
        ofw: "Philippines Overseas Foreign Worker Card",
        rp: "Residence Permit",
        pan: "India Permanent Account Number Card",
        pid: "Philippines Postal Identification Card",
        pp: "Passport",
        ppc: "Passport Card",
        pr: "Permanent Residence Card",
        sss: "Philippines Social Security System Card",
        td: "US Refugee Travel Document",
        umid: "Philippines United Multi Purpose ID",
        vid: "Voter Id",
        visa: "Immigration Visa",
        wp: "Work Permit"
      }
    };
  },

  computed: {
  },

  watch: {
    sessionItemResponse: {
      handler(value) {
        this.computeSessionItemResponse(value);
      },
      deep: true
    }
  },

  mounted() {
    this.computeSessionItemResponse(this.sessionItemResponse);
  },
  created() {
  },

  methods: {
    computeSessionItemResponse(value) {
      this.localIdentityData = value?.identityData || value?.notaries || {};
      this.localIdentityData.idcardState = this.localIdentityData?.personaAPIResponseDoc?.fields?.["address-subdivision"]?.value;
      this.localIdentityData.idcardExpiry = this.localIdentityData?.personaAPIResponseDoc?.fields?.["expiration-date"]?.value;
      _.map(this.localIdentityData?.fullPersonaAPIResponseDoc?.included || [], (identityDoc) => {
        if (identityDoc?.attributes?.status === "passed" && !this.localIdentityData.idcardExpiry) {
          this.localIdentityData.idcardExpiry = identityDoc?.attributes?.["expiration-date"];
        }
      });
      if (value?.session?.testingAccSession && !this.localIdentityData.idcardExpiry) {
        this.localIdentityData.idcardExpiry = "2027-09-17";
      }
    },
    getKBAType(session) {
      let kbaType = "ID + KBA";
      if (session?.session?.typeOfKBA === "foreigners_without_residential") {
        kbaType = "Id + Biometrics";
      }
      const idClass = this.localIdentityData?.personaAPIResponseDoc?.fields?.["identification-class"]?.value || this.localIdentityData?.fullPersonaAPIResponseDoc?.data?.attributes?.fields?.["identification-class"]?.value || session?.notaries?.personaAPIResponseDoc?.fields?.["identification-class"]?.value || session?.notaries?.fullPersonaAPIResponseDoc?.data?.attributes?.fields?.["identification-class"]?.value;
      console.log("idClass", idClass);
      if (idClass) {
        const photoIdName = this.idClassMap[idClass];
        kbaType += ` (${photoIdName})`;
      } else if (this.localIdentityData?.typeOfPhotoId || session?.notaries?.typeOfPhotoId) {
        let photoIdName = "Driver's License";
        const photoIdType = this.localIdentityData?.typeOfPhotoId || session?.notaries?.typeOfPhotoId;
        if (photoIdType === "passportbook") {
          photoIdName = "Passport Book";
        } else if (photoIdType === "passportcard") {
          photoIdName = "Passport Card";
        }
        kbaType += ` (${photoIdName})`;
      } else {
        kbaType += " (Driver's License)";
      }
      if (session?.session?.skipCustomerKBACheck) {
        kbaType = "Skipped";
      }
      return kbaType;
    },
    showSessionCharges(sessionItemResponse) {
      let showCharges = true;
      if (sessionItemResponse.vendorDoc && sessionItemResponse.vendorDoc.skipSessionCharges) {
        showCharges = false;
      } else if (this.$vendorDoc && this.$vendorDoc.skipSessionCharges) {
        showCharges = false;
      } else if (this.calledFrom === "customer_my_documents") {
        if (sessionItemResponse?.session?.sessionChargeOnBusinessUser) {
          showCharges = false;
        }
      } else if (sessionItemResponse?.session?.skipSessionCharges) {
        showCharges = false;
      }
      return showCharges;
    },
    showLoanSigningFields(sessionItemResponse) {
      if (sessionItemResponse?.session?.sessionType !== "loan_signing") {
        return false;
      }
      if (!sessionItemResponse?.session?.loanSigningExtraFields) {
        return false;
      }
      if (this.$user.role === "customer" && sessionItemResponse?.session?.invitedByCustomer !== this.$user._id) {
        return false;
      }
      return true;
    },
    async makeOpenSession(sessionItemResponse) {
      console.log(sessionItemResponse);
      this.$q.dialog({
        title: "Confirm",
        message: "Are you sure you want to make this session as open call?",
        cancel: true,
        persistent: true
      }).onOk(async () => {
        const sessionid = sessionItemResponse.session._id;
        try {
          const url = `admins/makeOpenSession/${sessionid.toString()}`;
          const response = await $axios.post(url, {}, {
            headers: {
              "Content-Type": "application/json"
            },
          });

          if (response.data.msg !== undefined) {
            if (response.data.success === true) {
              this.$q.notify({
                color: "green",
                position: "bottom-right",
                message: response.data.msg,
              });
            } else {
              this.$q.notify({
                color: "red",
                position: "bottom-right",
                message: response.data.msg
              });
            }
            if (response.data.openCallSent) {
              this.socketRequest("new_session_open_call", sessionid);
            }
          }
        } catch (error) {
          console.log(error);
        }
      });
    },
    async makeSessionForAllStates(sessionItemResponse) {
      console.log(sessionItemResponse);
      this.$q.dialog({
        title: "Confirm",
        message: "Are you sure you want to make this session as eligible for All State Notaries?",
        cancel: true,
        persistent: true
      }).onOk(async () => {
        const sessionid = sessionItemResponse.session._id;
        try {
          const url = `admins/makeSessionForAllStates/${sessionid.toString()}`;
          const response = await $axios.post(url, {}, {
            headers: {
              "Content-Type": "application/json"
            },
          });

          if (response.data.msg !== undefined) {
            if (response.data.success === true) {
              this.$q.notify({
                color: "green",
                position: "bottom-right",
                message: response.data.msg,
              });
            } else {
              this.$q.notify({
                color: "red",
                position: "bottom-right",
                message: response.data.msg
              });
            }
          }
        } catch (error) {
          console.log(error);
        }
      });
    },
    async makeSessionForSpanishNotaries(sessionItemResponse, spanishSpeakingValue) {
      console.log(spanishSpeakingValue);
      let dialogueMessage = "Are you sure you want to make this session eligible for all Spanish Speaking Notaries?";
      if (!spanishSpeakingValue) {
        dialogueMessage = "Are you sure you want to make this session eligible for all Language Notaries?";
      }
      this.$q.dialog({
        title: "Confirm",
        message: dialogueMessage,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        const sessionid = sessionItemResponse.session._id;
        try {
          const url = `admins/makeSessionForSpanishNotaries/${sessionid.toString()}`;
          const response = await $axios.post(url, { spanishSpeakingValue }, {
            headers: {
              "Content-Type": "application/json"
            },
          });

          if (response.data.msg !== undefined) {
            if (response.data.success === true) {
              this.$q.notify({
                color: "green",
                position: "bottom-right",
                message: response.data.msg,
              });
            } else {
              this.$q.notify({
                color: "red",
                position: "bottom-right",
                message: response.data.msg
              });
            }
          }
        } catch (error) {
          console.log(error);
        }
      });
    },
    socketRequest(eventName, sessionid, extraDataToSend) {
      const dataToSend = {
        sessionid,
        user: this.$user._id
      };
      if (extraDataToSend) {
        Object.assign(dataToSend, extraDataToSend);
      }
      if (window.currentSocket) {
        window.currentSocket.emit(eventName, dataToSend, (res) => {
          console.log("res", res);
        });
      }
    },
    reloadSessionForUser(sessionItemResponse, additionalAction) {
      let confirmDialogMessage = "Are you sure you want to refresh the pdf session of needed users?";
      if (additionalAction === "hideWaitingRoom") {
        confirmDialogMessage = "Are you sure you want to hide the waiting room for all users?";
      }
      if (additionalAction === "enableCompleteSessionButton") {
        confirmDialogMessage = "Are you sure you want to enable complete session button for notary?";
      }
      this.$q.dialog({
        title: "Confirm",
        message: confirmDialogMessage,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        if (!this.sessionReloadItem) {
          this.$q.notify({
            color: "red",
            position: "bottom-right",
            message: "Please select users to refresh"
          });
          return;
        }
        if (additionalAction) {
          const url = `admins/modifySessionFields/${sessionItemResponse.session._id.toString()}`;
          const response = await $axios.post(url, { additionalAction }, {
            headers: {
              "Content-Type": "application/json"
            },
          });

          if (response.data.msg !== undefined) {
            if (response.data.success === true) {
              this.$q.notify({
                color: "green",
                position: "bottom-right",
                message: response.data.msg,
              });
            } else {
              this.$q.notify({
                color: "red",
                position: "bottom-right",
                message: response.data.msg
              });
            }
          }
        }
        const role = this.sessionReloadItem.toLowerCase();
        this.socketRequest("reload_user_session", sessionItemResponse.session._id, { role, additionalAction });
      });
    }
  }
};

</script>
