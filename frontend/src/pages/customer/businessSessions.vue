<template>
  <q-layout>
    <q-page-container class="container bsessions">
      <q-page class="q-pa-lg">
        <div class="row">
          <div class="col-2">
            <img class="q-pa-lg" src="https://bluenotary.us/assets/img/manage-sessions3.png" />
          </div>
          <div class="col-10">
            <div class="flex justify-between q-pt-md items-center q-gutter-x-md">
              <h1>
                Manage Sessions
              </h1>
              <export-sessions-button :export-view="'businessSessions'" :archived-view="showArchievedSessions" />
              <div v-if="!inviteSignerTurnedOff" style="margin-left: auto; margin-right: 0;">
                <router-link v-if="$user.memberType !== 'free' && (!$user.memberTypeProWhenInvited || $user.businessUserAllowedNotaryToInvite)" to="/business/invite">
                  <q-btn
                    color="primary"
                    label="Invite Signer"
                  />
                </router-link>
              </div>
              <div v-else style="margin-left: auto; margin-right: 0;">
                <q-btn
                  v-if="$user.memberType !== 'free' && (!$user.memberTypeProWhenInvited || $user.businessUserAllowedNotaryToInvite)"
                  color="primary"
                  label="Invite Signer"
                >
                  <q-tooltip v-if="$user.loginViaSalesTitlesProDemoOneTime">Only 1 invited session allowed under free plan. Please contact us for more sessions</q-tooltip>
                  <q-tooltip v-if="$user.forceSelectPaymentMethod && !$user.selectedPaymentMethod">Please add a payment card to you account to start creating sessions</q-tooltip>
                </q-btn>
              </div>
            </div>
            <span><small>Monitor and manage your closings with real-time updates.</small></span><br />
            <span v-if="(freeSessionsLeft || totalSessionsDone) && $user.memberType !== 'signing_service' && !$user.loginViaSalesTitlesProDemoOneTime && !$user.customServiceChargeForSessionOnlyInternalTeam" style="font-size: 12px;display:block">{{ freeSessionsLeft }} Free Sessions Remaining. Total {{ totalSessionsDone }} Sessions this month.</span>
            <q-checkbox v-model="showArchievedSessions" size="xs" class="" style="font-size:.7rem;" label="Show Archived Sessions" />
            <template v-if="loading">
              <div class="renderer">
                <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
              </div>
            </template>
          </div>
        </div>
        <div class="row flex flex-center">
          <q-card v-if="!loading && !sessionData.length && !showArchievedSessions" class="welcome-card" flat bordered>
            <q-card-section horizontal>
              <q-card-section class="q-pa-lg">
                <div class="text-overline text-orange-9">Let's get started</div>
                <h5 class="text-h5 q-mt-sm q-mb-xs">Welcome to BlueNotary!</h5>
                <p>The faster, smarter, more secure way to notarize your documents.</p>
                <div class="q-pt-lg">
                  <ul>
                    <li><q-icon name="check_circle" /> Your invited sessions will list here</li>
                  </ul>
                </div>
              </q-card-section>

              <q-card-section class="col-5 flex flex-center">
                <q-img
                  class="rounded-borders"
                  src="~assets/notary-public-sm.jpg"
                />
              </q-card-section>
            </q-card-section>
          </q-card>
        </div>
        <template v-if="sessionData && sessionData.length">
          <div class="row mbroww q-mt-md" style="font-size:.6rem;">
            <div class="text-left q-pb-sm dcol-aerr"> &nbsp;</div>
            <div class="text-left" style="width: 20%">Primary Signer</div>
            <div class="text-left" style="width: 15%">Notary</div>
            <div class="text-left bscol-status" style="width: 10%">Status</div>
            <div class="text-left" style="width: 20%">Progress</div>
            <div class="text-left" style="width: 25%">Meeting Time</div>
          </div>
          <div class="q-table__card sessions-info">
            <div v-for="(item, key) of sessionData" :key="key">
              <div>
                <q-list class="rounded-borders">
                  <q-expansion-item
                    expand-icon-toggle
                    switch-toggle-side
                    class="tbnner"
                  >
                    <template v-slot:header>
                      <div class="text-left c-link-wrap bscol-fname flex"
                           style="align-items: center; justify-content: flex-start;">
                        <p style="max-width: calc(100% - 28px); white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">{{ item.signerDocForBusinessSession && item.signerDocForBusinessSession.name }}</p>
                        <q-icon name="content_copy" style="margin: 0px 6px; cursor: pointer;" size="16px" @click="copyText(item.signerDocForBusinessSession.email)">
                          <q-tooltip :delay="200">
                            Click to copy the email
                          </q-tooltip>
                        </q-icon>
                      </div>
                      <div class="text-left mbhide c-link-wrap dcol-fname" style="width: 20%;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">
                        {{ item.notary && item.notary.name }}
                        <q-icon v-if="item.notary && item.notary.email" name="content_copy" style="margin: 0px 6px; cursor: pointer;" size="16px" @click="copyText(item.notary.email)">
                          <q-tooltip :delay="200">
                            Click to copy the email
                          </q-tooltip>
                        </q-icon>
                        <q-icon name="edit" style="margin: 0px 6px; cursor: pointer;" size="16px" @click="changeNotaryForSession(item)">
                          <q-tooltip :delay="200">
                            Change Notary for the session
                          </q-tooltip>
                        </q-icon>
                      </div>
                      <div class="text-left bscol-status mbhide" style="width:10%">
                        <q-badge outline :color="getStatusColor(item.status)">
                          {{ item.status }}
                        </q-badge>
                        <!--  <q-badge :color="getSessionTypeColor(item.session.sessionType)" style="margin-left: 6px">
                          {{ getSessionTypeText(item.session.sessionType) }}
                        </q-badge> -->
                      </div>
                      <div class="text-left bscol-status mbhide" style="margin-right:40px;margin-top:10px;border-radius:10px">
                        <q-linear-progress size="15px" :value="item.sessionProgressNumber" :color="item.sessionProgressColor" rounded>
                          <q-tooltip>{{ item.sessionProgressName }}</q-tooltip>
                        </q-linear-progress>
                      </div>
                      <div class="bscol-time dcol-sttus">
                        <q-icon label="" name="today" />
                        <q-tooltip anchor="bottom left" :delay="1500">
                          Scheduled meeting with signer.
                        </q-tooltip>
                        {{ (typeof(item.meetingdate) === 'undefined' || item.meetingdate === "N/A" || item.meetingdate === "") ? "Meeting not scheduled" : formatDateForMeetingtime(item.meetingdate, item) }}
                      </div>
                      <div class="text-left dcol-sttus vmob">
                        <q-badge outline :color="getStatusColor(item.status)">
                          {{ item.status }}
                        </q-badge>
                      </div>
                      <div class="text-right" style="display: flex; align-items:center; width: 10%">
                        <q-btn v-if="!showArchievedSessions && showArchieveButton(item)" outline color="red" icon="archive" style="margin-left: 10px; float: right" @click="archiveClicked(item.current_session_id)">
                          <q-tooltip>Click here to Archive the session</q-tooltip>
                        </q-btn>
                        <q-btn v-if="showArchievedSessions && showArchieveButton(item)" outline color="blue" icon="unarchive" style="margin-left: 10px; float: right" @click="unarchiveClicked(item.current_session_id)">
                          <q-tooltip>Click here to UnArchive the session</q-tooltip>
                        </q-btn>
                      </div>
                    </template>
                    <q-card class="session-info-card">
                      <q-card-section>
                        <session-list-view-item-expanded-component :session-item-response="item" :audit-trail-clicked="auditTrailClicked" />
                      </q-card-section>
                    </q-card>
                  </q-expansion-item>
                  <q-separator />
                </q-list>
              </div>
            </div>
          </div>
        </template>
        <div v-if="paginate" class="q-pa-lg flex flex-center">
          <q-pagination
            v-model="current"
            :max="paginate.totalPages"
            :max-pages="6"
            direction-links
            boundary-links
            @click="loadSessionData($user,current)"
          />
        </div>
      </q-page>
    </q-page-container>
    <q-dialog v-model="openAuditLogsModal">
      <q-card style="width: 70%; min-width: 70%; max-width: 70%">
        <q-card-section>
          <div class="text-h6">Session Audit Logs</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <audit-logs-display-component :current-session-audit-logs="currentSessionAuditLogs" :full-session-doc="fullSessionItem" />
        </q-card-section>
        <q-card-actions align="left">
          <q-btn v-close-popup outline label="Close" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="paymentDoneDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Payment Pending For Session <template v-if="confirmationSessionDoc && confirmationSessionDoc.session && confirmationSessionDoc.session._id">{{ confirmationSessionDoc.session._id.substr(confirmationSessionDoc.session._id.length - 5).toUpperCase() }}</template></div>
        </q-card-section>

        <q-card-section class="q-pt-none text-center">
          <div>
            Previously attempted payment Failed. Please enter a valid payment card.
          </div>
          <div v-if="confirmationSessionDoc && confirmationSessionDoc.session && confirmationSessionDoc.session.failMessage">
            Failure Message : {{ confirmationSessionDoc.session.failMessage }}
          </div>
          <div v-if="confirmationSessionDoc && confirmationSessionDoc.notaries && confirmationSessionDoc.notaries.stripeBrand" style="text-align: left; padding: 12px 0px">
            Previous Card
            <div class="row">
              <div id="payment-form">
                <p class="">
                  Card:<b> {{ confirmationSessionDoc.notaries.stripeBrand }}</b>
                </p>
                <p class="">
                  Exp:<b>
                    {{ confirmationSessionDoc.notaries.exp_month }}/{{
                      confirmationSessionDoc.notaries.exp_year
                    }}</b
                  >
                </p>
                <p class="">
                  Last 4: <b>{{ confirmationSessionDoc.notaries.last4 }}</b>
                </p>
              </div>
            </div>
          </div>
          <div v-if="confirmationSessionDoc && confirmationSessionDoc.session && confirmationSessionDoc.session.finalCostOfNotarization" style="text-align: left; padding: 10px 0px">
            Final Notarization Cost : {{ confirmationSessionDoc.session.finalCostOfNotarization }}
          </div>
          <div id="payment-form">
            <div
              v-if="submissionError"
              class="q-mt-md q-mb-md text-negative"
            >
              <div id="card-errors" role="alert">
                {{ submissionError }}
              </div>
            </div>

            <q-field
              label="Card Number"
              stack-label
              class="q-mb-md"
              :error-message="errors['cardNumber']"
              :error="!isCardNumberValid"
            >
              <template v-slot:control>
                <div class="self-center full-width no-outline">
                  <div id="cardNumber" ref="cardNumber" />
                </div>
              </template>
            </q-field>

            <div class="row q-col-gutter-lg">
              <div class="col-6">
                <q-field
                  label="Card Expiry"
                  stack-label
                  class="q-mb-md"
                  :error-message="errors['cardExpiry']"
                  :error="!isCardExpiryValid"
                >
                  <template v-slot:control>
                    <div class="self-center full-width no-outline">
                      <div id="cardExpiry" ref="cardExpiry" />
                    </div>
                  </template>
                </q-field>
              </div>
              <div class="col-6">
                <q-field
                  label="Card CVC"
                  stack-label
                  class="q-mb-md"
                  :error-message="errors['cardCvc']"
                  :error="!isCardCvcValid"
                >
                  <template v-slot:control>
                    <div class="self-center full-width no-outline">
                      <div id="cardCvc" ref="cardCvc" />
                    </div>
                  </template>
                </q-field>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn outline :loading="paymentModalSubmitLoading" label="Submit Card for Payment" color="primary" @click="paymentModalSubmit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="confirmationSessionDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Session Complete</div>
        </q-card-section>

        <q-card-section class="q-pt-none text-center">
          <template v-if="paymentFailure">
            Payment from notary's end has failed for some reason. We will follow up with customer to ensure payment is successful. Final session document will be available once payment is done.
          </template>
          <template v-else>
            <template v-if="confirmationSessionDoc && confirmationSessionDoc.finalDocument && confirmationSessionDoc.finalDocument.length">
              <a v-for="tempFinalDocument in confirmationSessionDoc.finalDocument" :key="tempFinalDocument._id" :href="tempFinalDocument.url" target="_blank" class="blue">
                <q-icon name="task" class="text-center q-pa-md" style="font-size: 3rem;display: block;margin:0 auto;" />
                Download Signed File
              </a>
            </template>
            <template v-else>
              Session Signed Final Document not quite ready. Please refresh the page or check My Documents page.
            </template>
          </template>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup outline label="Close" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="showNotaryUpdateModal">
      <q-card style="width: 60%; max-width: 60%">
        <q-card-section>
          <div class="text-h6">Updating Notary for Session <template v-if="notaryUpdateModalSessionDoc && notaryUpdateModalSessionDoc.session && notaryUpdateModalSessionDoc.session._id">{{ notaryUpdateModalSessionDoc.session._id.substr(notaryUpdateModalSessionDoc.session._id.length - 5).toUpperCase() }}</template></div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-if="notaryUpdateModalSessionDoc && notaryUpdateModalSessionDoc.notary && notaryUpdateModalSessionDoc.notary.name">
            Current Notary : {{ notaryUpdateModalSessionDoc.notary.name }} (Email : <b>{{ notaryUpdateModalSessionDoc.notary.email }}</b>)
          </div>
          <h3 style="margin-top: 12px;">
            <strong>
              New Notary For Session
            </strong>
          </h3>
          <div class="row doc-list-preview">
            <div class="">
              <q-radio v-if="$user.memberType !== 'business_basic'" v-model="notaryUpdateModalType" val="choose_notary" label="My Team Notary" />
              <q-radio v-if="!$user.inviteSignerDisableOpenCall" v-model="notaryUpdateModalType" val="open_call" label="On Demand Certified Notary" />
            </div>
          </div>
          <div v-if="notaryUpdateModalType === 'choose_notary'" class="q-py-md q-mb-lg">
            <h3>
              Notary Selection
            </h3>
            <div class="">
              <div class="col" style="margin-top: 8px">
                <q-select
                  v-model="notaryUpdateModalSelectedNotary"
                  filled
                  dense
                  :options="allSelectableNotaries"
                  label="Select Notary for the Session"
                  icon="assignment"
                  input-debounce="0"
                  :options-dense="true"
                >
                  <template v-slot:prepend>
                    <q-icon name="person" />
                  </template>
                </q-select>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn outline :loading="notaryUpdateModalSubmitLoading" label="Update Notary For Session" color="primary" @click="updateNotaryForModalClicked" />
          <q-btn v-close-popup outline label="Cancel" color="danger" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";
import __ from "lodash";
import { loadStripe } from "@stripe/stripe-js/pure";
import { copyToClipboard } from "quasar";
import DateFormatMixin from "@/mixins/DateFormatMixin";
import ColorMixin from "@/mixins/ColorMixin";
import VueEventBus from "../../plugins/eventbus.js";
import AuditLogsDisplayComponent from "../../components/AuditLogsDisplayComponent.vue";
import SessionListViewItemExpandedComponent from "../../components/SessionListViewItemExpandedComponent.vue";
import ExportSessionsButton from "../../components/ExportSessionsButton.vue";
// const moment = require("moment");

export default {
  name: "BusinessSessions",
  components: {
    AuditLogsDisplayComponent,
    SessionListViewItemExpandedComponent,
    ExportSessionsButton
  },
  mixins: [DateFormatMixin, ColorMixin],
  data() {
    return {
      confirmationSessionId: "",
      confirmationSessionDialog: false,
      confirmationSessionDoc: {},
      freeSessionsLeft: false,
      totalSessionsDone: false,
      showArchievedSessions: false,
      openAuditLogsModal: false,
      currentSessionAuditLogs: [],
      fullSessionItem: {},
      current: 1,
      paginate: [],
      paymentDoneDialog: false,
      stripe: false,
      submissionError: null,
      card: {
        cardNumber: "",
        cardExpiry: "",
        cardCvc: ""
      },
      errors: {
        cardNumber: "",
        cardExpiry: "",
        cardCvc: ""
      },
      paymentModalSubmitLoading: false,
      showNotaryUpdateModal: false,
      notaryUpdateModalSessionDoc: {},
      notaryUpdateModalType: "choose_notary",
      notaryUpdateModalSelectedNotary: null,
      notaryUpdateModalSubmitLoading: false,
      allSelectableNotaries: []
    };
  },
  computed: {
    isCardNumberValid () {
      return this.isValid("cardNumber");
    },
    isCardExpiryValid () {
      return this.isValid("cardExpiry");
    },
    isCardCvcValid () {
      return this.isValid("cardCvc");
    },
    inviteSignerTurnedOff() {
      if (this.$user.turnOffInviteSigner) {
        return true;
      }
      if (this.$user.forceSelectPaymentMethod && !this.$user.selectedPaymentMethod) {
        return true;
      }
      return false;
    }
  },
  watch: {
    showArchievedSessions: {
      handler() {
        this.loadSessionData(this.$user, this.current);
      }
    }
  },
  async mounted() {
    this.loading = true;
    await this.loadSessionData(this.$user, this.current);
    console.log(this.sessionData);
    console.log("this.$route.query", this.$route.query);
    if (this.$route.query.confirmationSession) {
      this.confirmationSessionId = this.$route.query.confirmationSession;
      this.confirmationSessionDialog = true;
      __.map(this.sessionData, (tempSessionData) => {
        if (tempSessionData && tempSessionData.session && tempSessionData.session._id === this.confirmationSessionId) {
          this.confirmationSessionDoc = tempSessionData;
        }
      });
    }
    VueEventBus.$on("SOCKET_UPDATES", (socketData) => {
      console.log("socketData", JSON.parse(JSON.stringify(socketData)));
      if (typeof socketData.event !== "undefined") {
        if (socketData.event === "sessionActivityChanged") {
          const sessionidChanged = socketData.sessionid;
          __.map(this.sessionData, (localSessionDoc) => {
            if (String(localSessionDoc.session._id) === sessionidChanged) {
              this.loadSessionData([sessionidChanged], this.current);
            }
          });
        }
      }
    });
    VueEventBus.$on("SOCKET_RECONNECTED", () => {
      this.socketRequest("join_user");
    });
    this.socketRequest("join_user");
    this.loading = false;
    try {
      if (window.cameraStream) {
        window.cameraStream.getTracks().forEach((track) => { track.stop(); });
        window.cameraStream = false;
      }
    } catch (error) {
      console.log("error", error);
    }
    try {
      if (window.cameraStreamChecking) {
        window.cameraStreamChecking.getTracks().forEach((track) => { track.stop(); });
        window.cameraStreamChecking = false;
      }
    } catch (error) {
      console.log("error", error);
    }
  },
  beforeDestroy() {
    this.socketRequest("leave_user");
    VueEventBus.$off("SOCKET_UPDATES");
    VueEventBus.$off("SOCKET_RECONNECTED");
  },
  setup(_, context) {
    const {
      root: { $user },
    } = context;
    const loading = ref(false);
    const sessionData = ref([]);
    const deleteSessionItem = async (item) => {
      try {
        const url = "session/delete";
        const response = await $axios.post(
          url,
          { sessionId: item },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("loadSessionData", response.data);
        const newSessionData = await this.loadSessionData(this.$user, this.current);
        console.log("newSessionData = ", newSessionData);
        sessionData.value = newSessionData;
      } catch (error) {
        console.log(error);
      }
    };
    const deleteSession = async (item) => {
      await deleteSessionItem(item.sessionId);
      // const newSessionData = await loadSessionData();
      // console.log("newSessionData = ", newSessionData);
      // this.sessionData = newSessionData;
    };
    const socketRequest = async (eventName) => {
      const dataToSend = {
        user: $user._id
      };
      if (window.currentSocket) {
        window.currentSocket.emit(eventName, dataToSend, (res) => {
          console.log("res", res);
        });
      }
    };
    return {
      loading,
      sessionData,
      deleteSession,
      deleteSessionItem,
      socketRequest
    };
  },
  methods: {
    changeNotaryForSession(session) {
      this.showNotaryUpdateModal = true;
      this.notaryUpdateModalSessionDoc = session;
      this.fetchAllSelectableNotaries();
    },
    async fetchAllSelectableNotaries() {
      const url = "/customer/fetchAllSelectableNotaries";
      const response = await $axios.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      this.allSelectableNotaries = (response && response.data && response.data.userNotaryRelations) || [];
    },
    async updateNotaryForModalClicked() {
      const dataToSave = {
        sessionid: this.notaryUpdateModalSessionDoc?.session?._id,
        notaryUpdateModalType: this.notaryUpdateModalType,
        notaryUpdateModalSelectedNotary: this.notaryUpdateModalSelectedNotary?.value
      };
      const urlToUse = "session/modifyNotaryForSession";
      this.notaryUpdateModalSubmitLoading = true;
      const response = await $axios.post(urlToUse, dataToSave);
      this.notaryUpdateModalSubmitLoading = false;
      this.showNotaryUpdateModal = false;
      console.log(response);
      if (response?.data?.openCallSent) {
        this.socketRequest("new_session_open_call");
      }
      if (response?.data?.success) {
        this.$q.notify({
          color: "primary",
          position: "bottom",
          message: "Notary updation is successful"
        });
      } else {
        this.$q.notify({
          color: "red",
          position: "bottom",
          message: response?.data?.message || "Notary update failed",
        });
      }
      window.location.reload();
    },
    getKBAStatus(session) {
      let status = "N/A";
      if (session.identityData !== null &&
        (session.identityData.fillAPIResponseDoc && session.identityData.fillAPIResponseDoc !== null) &&
        session.identityData.fillAPIResponseDoc.PlatformResponse.Response !== ""
      ) {
        status = session.identityData.fillAPIResponseDoc.PlatformResponse.Response.WorkflowOutcome.text;
      }
      if (session?.identityData?.cardAPIResponseDoc?.platformresponse?.response?.[0]?.workflowoutcome?.[0]?._) {
        status = session?.identityData?.cardAPIResponseDoc?.platformresponse?.response?.[0]?.workflowoutcome?.[0]?._;
      }
      return status;
    },
    getKBAType(session) {
      let kbaType = "ID + KBA";
      if (session?.session?.typeOfKBA === "foreigners_without_residential") {
        kbaType = "Id + Biometrics";
      }
      if (session?.identityData?.typeOfPhotoId) {
        let photoIdName = "Driver's License";
        const photoIdType = session?.identityData?.typeOfPhotoId;
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
    splittingFileName(fileName) {
      if (!fileName) {
        return "";
      }
      if (fileName.length < 20) {
        return fileName;
      }
      fileName = fileName.split(/[.]+/);
      return ` ${fileName[0].slice(0, 10)}...${fileName[0].substr(fileName[0].length - 10)}.${fileName[fileName.length - 1]}`;
    },
    socketRequest(eventName) {
      const dataToSend = {
        user: this.$user._id
      };
      if (window.currentSocket) {
        window.currentSocket.emit(eventName, dataToSend, (res) => {
          console.log("res", res);
        });
      }
    },
    async loadSessionData(user, current) {
      const baseUrl = "session/load/sessiondata/";
      const url = baseUrl + current;
      const response = await $axios.post(
        url,
        { user, businessSessions: true, showArchievedSessions: this.showArchievedSessions },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      this.sessionData = (response.data && response.data.sessionData) || [];
      this.paginate = response.data.paginate;
      if (response.data && (response.data.freeSessionsLeft || response.data.totalSessionsDone)) {
        this.freeSessionsLeft = response.data.freeSessionsLeft;
        this.totalSessionsDone = response.data.totalSessionsDone;
      }
      console.log("this.sessionData", this.sessionData);
      __.map(this.sessionData, async (sessionDoc) => {
        if (sessionDoc.session && sessionDoc.session.paid === false) {
          let chargeToBePaidByCurrentCustomer = sessionDoc?.session?.sessionChargeOnBusinessUser && sessionDoc?.session?.sessionCreatedByBusinessUser;
          console.log("sessionDoc?.session?.vendor", sessionDoc?.session?.vendor, this.$vendorDoc, this.$vendorDoc?.sessionChargeOnBusinessUser);
          if (sessionDoc?.session?.vendor && this.$vendorDoc?.sessionChargeOnBusinessUser) {
            chargeToBePaidByCurrentCustomer = true;
          }
          console.log("chargeToBePaidByCurrentCustomer", chargeToBePaidByCurrentCustomer);
          if (chargeToBePaidByCurrentCustomer) {
            console.log(sessionDoc);
            this.confirmationSessionId = sessionDoc.session._id;
            this.confirmationSessionDoc = sessionDoc;
            this.confirmationSessionDialog = false;
            this.paymentFailure = true;
            this.paymentDoneDialog = true;
            this.cannotStartNewSession = true;
            if (!this.stripe) {
              if (this.$user.testingacc) {
                const pubkey = process.env.STRIPE_PUBLIC_KEY_TEST;
                this.stripe = await loadStripe(pubkey);
              } else {
                const pubkey = process.env.STRIPE_PUBLIC_KEY;
                this.stripe = await loadStripe(pubkey);
              }
            }
            const cardElements = ["cardNumber", "cardExpiry", "cardCvc"];
            this.elements = this.stripe.elements();
            const style = {
              base: {
                fontFamily: "\"Roboto\", \"-apple-system\", \"Helvetica Neue\", Helvetica, Arial, sans-serif",
                "::placeholder": {
                  color: "#CFD7E0",
                },
              },
            };
            console.log("cardElements", cardElements);
            cardElements.forEach((element) => {
              this.card[element] = this.elements.create(element, { style });
              this.card[element].mount(`#${element}`);
              this.card[element].addEventListener("change", (e) => this.updated(e));
            });
          }
        }
      });
    },
    async auditTrailClicked(sessionItem) {
      const url = `session/getAuditTrail/${sessionItem.current_session_id}`;
      const response = await $axios.get(
        url
      );
      console.log("audittrail", response.data);
      this.currentSessionAuditLogs = (response.data && response.data.auditTrail) || [];
      this.fullSessionItem = sessionItem;
      this.openAuditLogsModal = true;
    },
    archiveClicked(sessionid) {
      console.log(sessionid);
      this.$q.dialog({
        title: "Confirm",
        message: "Are you sure you want to archieve this Session?",
        cancel: true,
        persistent: true
      }).onOk(async () => {
        console.log("done");
        const url = "session/archieve";
        const response = await $axios.post(
          url,
          { sessionId: sessionid }
        );
        console.log("archieve", response.data);
        if (response.data && response.data.success) {
          this.$q.notify({
            color: "primary",
            position: "bottom",
            message: "Session Archieved Successfully.",
          });
          this.sessionData = __.filter(this.sessionData, (tempSessionDoc) => tempSessionDoc.current_session_id !== sessionid);
        } else {
          this.$q.notify({
            color: "red",
            position: "bottom",
            message: "Arhieve Failed. Please try again later.",
          });
        }
      });
    },
    unarchiveClicked(sessionid) {
      console.log(sessionid);
      this.$q.dialog({
        title: "Confirm",
        message: "Are you sure you want to unarchieve this Session?",
        cancel: true,
        persistent: true
      }).onOk(async () => {
        console.log("done");
        const url = "session/unarchieve";
        const response = await $axios.post(
          url,
          { sessionId: sessionid }
        );
        console.log("unarchieve", response.data);
        if (response.data && response.data.success) {
          this.$q.notify({
            color: "primary",
            position: "bottom",
            message: "Session Unarchieved Successfully.",
          });
          this.sessionData = __.filter(this.sessionData, (tempSessionDoc) => tempSessionDoc.current_session_id !== sessionid);
        } else {
          this.$q.notify({
            color: "red",
            position: "bottom",
            message: "Unarhieve Failed. Please try again later.",
          });
        }
      });
    },
    showArchieveButton(sessionDoc) {
      let showButton = true;
      if (sessionDoc.currentStage === "meet_notary_stage") {
        showButton = false;
      }
      if (sessionDoc.status === "complete") {
        showButton = false;
      }
      return showButton;
    },
    isValid (elementType) {
      return this.errors[elementType] === "";
    },
    errorMessage (elementType) {
      return this.isValid(elementType) ? this.errors[elementType] : false;
    },
    async paymentModalSubmit() {
      console.log("clicked");
      this.paymentModalSubmitLoading = true;
      const { token, error } = await this.stripe.createToken(this.card.cardNumber);
      console.log({ error });
      if (error) {
        this.paymentModalSubmitLoading = false;
        this.$q.notify({
          color: "red",
          position: "bottom-right",
          message: error.message,
        });
        return;
      }
      console.log({ token });
      try {
        const url = "session/repaymentForSession";
        const response = await $axios.post(url, { data: token, sessionId: this.confirmationSessionId }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log(response);
        this.$q.notify({
          color: "primary",
          position: "bottom",
          message: "Payment Done Successfully.",
        });
        this.paymentModalSubmitLoading = false;
        this.paymentDoneDialog = false;
        this.$router.replace("/business/business-sessions");
      } catch (error2) {
        this.paymentModalSubmitLoading = false;
        console.log(error2);
      }
    },
    copyText(textToCopy) {
      copyToClipboard(textToCopy).then(() => {
          this.$q.notify({
            type: "positive",
            position: "bottom-right",
            message: "Email copied to clipboard!",
          });
        }).catch(() => {
        // fail
        });
    },
  },
};
</script>
<style lang="sass" scoped>
</style>
