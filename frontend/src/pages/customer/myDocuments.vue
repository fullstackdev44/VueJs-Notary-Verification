<template>
  <q-layout>
    <q-page-container class="container">
      <q-page class="q-pa-lg">
        <div class="flex justify-between q-pt-md items-center q-gutter-x-md">
          <div>
            <h1 class="q-mb-sm" style="display: inline-block">My Documents</h1>
          </div>
          <export-sessions-button :export-view="'businessDocuments'" :archived-view="showArchievedSessions" />

          <div v-if="!($vendorDoc && $vendorDoc.dontAllowNewSession)" style="margin-left: auto; margin-right: 0;">
            <router-link to="/business/prepare_doc">
              <q-btn
                color="primary"
                :disable="cannotStartNewSession"
                label="Start New Notarization"
                style="margin-right: 12px"
              />
            </router-link>
          </div>
        </div>
        <template v-if="loading">
          <div class="renderer">
            <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
          </div>
        </template>
        <q-checkbox v-if="sessionData && sessionData.length" v-model="showArchievedSessions" size="xs" class="" style="font-size:.7rem;margin-top:10px" label="Show Archived Sessions" />
        <div class="row flex flex-center q-mt-lg" style="flex-direction: column; align-items: center;">
          <q-card v-if="!loading && !sessionData.length && !showArchievedSessions" class="welcome-card" flat bordered>
            <q-card-section class="row">
              <q-card-section class="col-xs-12 col-sm-12 col-md-7 q-pa-lg">
                <div class="text-overline text-orange-9">Let's get started</div>
                <h5 class="text-h5 q-mt-sm q-mb-xs">Welcome to BlueNotary!</h5>
                <p>The faster, smarter, more secure way to notarize your documents.</p>
                <div class="q-pt-lg">
                  <ul>
                    <li><q-icon name="check_circle" /> Your completed notarizations will list here.</li>
                  </ul>
                </div>
              </q-card-section>

              <q-card-section class="col-xs-12 col-sm-12 col-md-5 flex flex-center">
                <q-img
                  class="rounded-borders"
                  src="~assets/notary-public-sm.jpg"
                />
              </q-card-section>
            </q-card-section>
          </q-card>
        </div>
        <template v-if="sessionData && sessionData.length">
          <div class="row mbroww" style="font-size:.6rem;">
            <div class="text-left q-pb-sm dcol-aerr"> &nbsp;</div>
            <div class="text-left dcol-fname">Filename</div>
            <div class="text-left dcol-sttus">Status</div>
            <div class="text-left dcol-mtime">Meeting Time</div>
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
                      <div class="text-left dcol-fname">
                        {{ (item.files) ? splittingFileName(item.files && item.files[0] && item.files[0].name): "No file uploaded" }}
                      </div>
                      <div class="text-left dcol-sttus mbhide">
                        <q-badge outline :color="getStatusColor(item.status)">
                          {{ item.status }}
                        </q-badge>
                        <q-badge outline :color="getSessionTypeColor(item.session.sessionType)" style="margin-left: 6px">
                          {{ getSessionTypeText(item.session.sessionType) }}
                        </q-badge>
                      </div>
                      <div class="text-left dcol-mtime ">
                        <q-icon label="" name="today" />
                        <q-tooltip anchor="bottom left" :delay="1500">
                          Scheduled meeting with signer.
                        </q-tooltip>
                        {{ (typeof(item.meetingdate) === 'undefined' || item.meetingdate === "N/A" || item.meetingdate === "") ? "Meeting not scheduled" : formatDateForMeetingtime(item.session.meetingdate, item) }}
                      </div>
                      <div class="text-left dcol-sttus vmob">
                        <q-badge outline :color="getStatusColor(item.status)">
                          {{ item.status }}
                        </q-badge>
                      </div>
                      <div v-if="item.session && item.session.status !== 'failed'" class="text-right dcol-btnd">
                        <!-- <div v-if="!item.currentUserAdditionalSigner && item.session.sessionActive && (item.currentStage === 'meet_notary_stage' || item.session.status === 'ready to sign')" class="text-right dcol-btnd"> -->
                        <q-btn v-if="showGotoSessionButton(item)" class="" color="green" text-color="white" label="Go To Session" style="display: inline-block" @click="gotoSessionClicked(item)" />
                        <template v-else-if="item.currentUserAdditionalSigner">
                          <template v-if="!(item.status === 'complete' || item.status === 'expired')">
                            <q-btn v-if="item.currentUserAdditionalSignerStage === 'meet_notary' || item.currentUserAdditionalSignerStage === 'meet_notary_stage'" class="" color="green" text-color="white" style="display: inline-block" label="Go To Session" @click="gotoSessionClicked(item)" />
                            <q-btn v-else-if="!(item.currentUserAdditionalSignerStage === 'meet_notary' || item.currentUserAdditionalSignerStage === 'meet_notary_stage')" class="" color="orange" text-color="white" style="display: inline-block" label="Enter KBA Details" @click="gotoSessionClicked(item)" />
                          </template>
                        </template>
                        <q-btn
                          v-else-if="!showArchievedSessions && item.status!='complete' && item.status !== 'expired'"
                          class=""
                          text-color="white"
                          style="background: #3d7de3; display: inline-block"
                          :disable="(item.status === 'complete' ||
                            item.status === 'expired') ||
                            (item.currentStage === 'identity_check_stage_fail' ||
                              item.currentStage === 'kba_check_stage_fail' ||
                              item.currentStage === 'photoid_check_stage_fail')"
                          label="Continue"
                          @click="continueSession(item)" />
                        <q-btn v-if="!showArchievedSessions && showRescheduleButton(item)" round flat icon="edit_calendar" style="height: 100%; display: inline-block" @click="rescheduleIconClicked(item.current_session_id)">
                          <q-tooltip>
                            Reschedule the Session
                          </q-tooltip>
                        </q-btn>
                        <q-btn v-if="!showArchievedSessions && showArchieveButton(item)" round flat color="red" icon="archive" style="height: 100%; display: inline-block" @click="archiveClicked(item.current_session_id)">
                          <q-tooltip>Click here to Archive the session</q-tooltip>
                        </q-btn>
                        <q-btn v-if="showArchievedSessions && showArchieveButton(item)" round flat color="blue" style="height: 100%; display: inline-block" icon="unarchive" class="q-pl-xs" @click="unarchiveClicked(item.current_session_id)">
                          <q-tooltip>Click here to UnArchive the session</q-tooltip>
                        </q-btn>
                      </div>
                    </template>
                    <q-card class="session-info-card">
                      <q-card-section>
                        <session-list-view-item-expanded-component :session-item-response="item" :audit-trail-clicked="auditTrailClicked" :called-from="'customer_my_documents'" />
                      </q-card-section>
                    </q-card>
                  </q-expansion-item>
                  <q-separator />
                </q-list>
              </div>
            </div>
          </div>
        </template>
        <div v-if="paginate && sessionData && sessionData.length" class="flex flex-center" style="padding-top: 12px; padding-bottom: 12px">
          <q-pagination
            v-model="current"
            :max="paginate.totalPages"
            :max-pages="paginateMaxPagesToShow"
            direction-links
            boundary-links
            @click="loadSessionData($user,current)"
          />
        </div>
      </q-page>
    </q-page-container>
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
    <!-- modal for Resheduling Session -->
    <q-dialog v-model="rescheduleSessionModal">
      <q-card style="min-width: 50%; min-height: 30%">
        <q-card-section>
          <h5>
            Reschedule the Session
            <q-btn v-close-popup round label="x" style="float: right" />
          </h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="col">
            <q-input
              v-model="rescheduleDatetime"
              dense
              filled
              class="q-py-sm"
              type="text"
              label="Meeting Date & Time"
              @click="notarizationDateTimeInputFieldClicked"
            >
              <template v-slot:prepend>
                <q-icon name="event" />
              </template>
            </q-input>
          </div>
          <div class="col">
            <q-select
              v-model="reschedulemeetingTimeZone"
              filled
              dense
              :options="rescheduleSelectedTimezone"
              label="Select Timezone"
              use-input
              icon="watch_later"
              input-debounce="0"
              :options-dense="true"
              @filter="rescheduleTimezoneFilterFn"
            >
              <template v-slot:prepend>
                <q-icon name="watch_later" />
              </template>
            </q-select>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup outline label="Cancel" color="grey" />
          <q-btn outline label="Reschedule Session" color="primary" :loading="rescheduleSaveButtonLoading" :disable="disableSaveRescheduleSaveButton" @click="rescheduleSaveClicked" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- modal for Selecting Date Time for Reschedule Session -->
    <q-dialog v-model="rescheduleOpenDateTimePickerModal">
      <q-card style="min-width: 70%">
        <q-card-section>
          <div class="text-h6">Select Notarization Date and Time</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-py-md columns is-multiline justify-between">
            <div class="column is-6 col-6 col-md-12 col-sm-12" style="text-align: center">
              <q-date
                v-model="rescheduleDatetime"
                :options="rescheduleOptionsFn"
                mask="YYYY-MM-DD hh:mm A"
                color="primary"
              />
            </div>
            <div class="column is-6 col-6 col-md-12 col-sm-12" style="text-align: center">
              <q-time
                v-model="rescheduleDatetime"
                mask="YYYY-MM-DD hh:mm A"
                color="primary"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup outline label="OK" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- modal for KBA -->
    <q-dialog v-model="showKBAModal" persistent>
      <q-card style="min-width: 90%; min-height: 80%">
        <q-card-section>
          <h5>
            <template v-if="!additionalSignerKBASessionDocSkipped">
              Perform KBA for Session
            </template>
            <template v-else>
              Provide Personal Details
            </template>
            <q-btn v-close-popup round label="x" style="float: right" @click="showKBAModalClosed" />
          </h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="columns is-multiline" style="margin-top: 6px">
            <template v-if="showKBAModalSection === 'initial'">
              <div
                class="col-12 flex q-mt-lg q-mb-xl"
                style="width: 100%"
              >
                <div class="flex flex-center column">
                  <div class="">
                    <p v-if="!additionalSignerKBASessionDocSkipped" class="q-pa-lg">
                      As additional signer in this session, you will have to perform KBA and pass photo ID check before you are admitted to the session. Please proceed to start KBA+ID by clicking button below. <br /><a href="https://bluenotary.crisp.help/en/article/kba-and-identification-analysisproofing-1ugapz4/" target="_blank">What is KBA?</a>
                    </p>
                    <div class="q-pa-md text-center">
                      <q-btn v-if="!additionalSignerKBASessionDocSkipped" class="btn btn-primary q-pa-md" @click="startKBA">Start KBA Process</q-btn>
                      <q-btn v-else class="btn btn-primary q-pa-md" @click="startKBA">Start Personal Details Entry Process</q-btn>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template v-if="showKBAModalSection === 'failed'">
              <div
                class="col-12 flex q-mt-lg q-mb-xl"
                style="width: 100%"
              >
                <div class="flex flex-center column">
                  <div class="text-center">
                    <h5 class="q-pa-md">
                      The KBA did not succeed this time.
                    </h5>
                    <br />
                    <h5>
                      <b>KBA Failure Reason </b>: {{ kbaModalFailureReason }}
                    </h5>
                    <div class="q-pa-md text-center">
                      <q-btn class="btn q-pa-md" color="red" @click="closeKBASession">Close</q-btn>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-4 flex" />
            </template>
            <template v-if="showKBAModalSection === 'personal_details'">
              <personal-details :called-from-business-page="true" :called-from-business-page-session-id="showKBAModalSessionId" :kba-modal-change-section="kbaModalChangeSection" />
            </template>
            <template v-else-if="showKBAModalSection === 'kba'">
              <k-b-a :called-from-business-page="true" :called-from-business-page-session-id="showKBAModalSessionId" :kba-modal-change-section="kbaModalChangeSection" />
            </template>
            <template v-else-if="showKBAModalSection === 'photoid'">
              <photoid :called-from-business-page="true" :called-from-business-page-session-id="showKBAModalSessionId" :kba-modal-change-section="kbaModalChangeSection" />
            </template>
            <template v-else-if="showKBAModalSection === 'meet_notary'">
              <meet-notary :called-from-business-page="true" :called-from-business-page-session-id="showKBAModalSessionId" :kba-modal-change-section="kbaModalChangeSection" :in-session-k-b-a="additionalSignerKBASessionDocInSessionKBA" />
            </template>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

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
  </q-layout>
</template>

<script>
import Vue from "vue";
import { date } from "quasar";
import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";
import { v4 as uuidV4 } from "uuid";
import __ from "lodash";
import { loadStripe } from "@stripe/stripe-js/pure";
import DateFormatMixin from "@/mixins/DateFormatMixin";
import ColorMixin from "@/mixins/ColorMixin";
import DetectingMobile from "@/mixins/DetectingMobile";
import VueEventBus from "../../plugins/eventbus.js";
import PersonalDetails from "./personalDetails.vue";
import KBA from "./kba.vue";
import Photoid from "./photoidNew.vue";
// import Photoid from "./customer/photoid.vue";
import MeetNotary from "./meetNotary.vue";
import AuditLogsDisplayComponent from "../../components/AuditLogsDisplayComponent.vue";
import SessionListViewItemExpandedComponent from "../../components/SessionListViewItemExpandedComponent.vue";
import ExportSessionsButton from "../../components/ExportSessionsButton.vue";
// const moment = require("moment");

export default {
  name: "MyDocuments",
  components: {
    PersonalDetails,
    KBA,
    Photoid,
    MeetNotary,
    AuditLogsDisplayComponent,
    SessionListViewItemExpandedComponent,
    ExportSessionsButton
  },
  mixins: [DateFormatMixin, ColorMixin, DetectingMobile],
  data() {
    return {
      confirmationSessionId: "",
      confirmationSessionDialog: false,
      confirmationSessionDoc: {},
      paymentFailure: false,
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
      cannotStartNewSession: false,
      showKBAModal: false,
      showKBAModalSessionId: "",
      showKBAModalSection: "initial",
      kbaModalFailureReason: "",
      showArchievedSessions: false,
      openAuditLogsModal: false,
      currentSessionAuditLogs: [],
      fullSessionItem: {},
      current: 1,
      paginate: [],
      additionalSignerKBASessionDoc: {},
      additionalSignerKBASessionDocSkipped: false,
      rescheduleSessionId: false,
      rescheduleSessionModal: false,
      rescheduleDatetime: "",
      reschedulemeetingTimeZone: "",
      rescheduleSelectedTimezone: [],
      rescheduleTimezoneValues: [],
      rescheduleOpenDateTimePickerModal: false,
      rescheduleSaveButtonLoading: false,
      disableSaveRescheduleSaveButton: false,
      additionalSignerKBASessionDocInSessionKBA: false,
      paginateMaxPagesToShow: 6
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
    if (this.isMobile()) {
      this.paginateMaxPagesToShow = 1;
    }
    if (window.onpopstate) {
      window.onpopstate = null;
    }
    // window.removeEventListener("beforeunload", () => {});
    // window.onbeforeunload = null;
    this.loading = true;
    this.saveUserDetails();
    await this.loadSessionData(this.$user, this.current);
    console.log(this.sessionData);
    if (this.$route.query.confirmationSession) {
      this.confirmationSessionId = this.$route.query.confirmationSession;
      this.confirmationSessionDialog = true;
      __.map(this.sessionData, (tempSessionData) => {
        if (tempSessionData && tempSessionData.session && tempSessionData.session._id === this.confirmationSessionId) {
          this.confirmationSessionDoc = tempSessionData;
        }
      });
    }
    console.log("this.confirmationSessionDoc", this.confirmationSessionDoc);
    console.log("this.confirmationSessionDoc.currentUserAdditionalSigner", this.confirmationSessionDoc.currentUserAdditionalSigner);
    if (this.$route.query.paymentDone === "failure") {
      this.confirmationSessionDialog = false;
      if (!this.confirmationSessionDoc?.currentUserAdditionalSigner && !this.confirmationSessionDoc?.session?.sessionChargeOnBusinessUser) {
        console.log(this.confirmationSessionDoc);
        this.paymentFailure = true;
        this.paymentDoneDialog = true;
      }
    }
    if (this.confirmationSessionDoc?.session?.paid === false && !this.confirmationSessionDoc?.currentUserAdditionalSigner) {
      this.paymentFailure = true;
    }
    if (this.$route.query.kba === "true" && this.$route.query.sessionid) {
      this.showKBAModalSessionId = this.$route.query.sessionid;
      const url = "session/load/personalData";
      const messageToSend = {
        sessionId: this.showKBAModalSessionId,
        additionalSigner: true
      };
      const response = await $axios.post(url, messageToSend, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      if (response && response.data) {
        this.additionalSignerKBASessionDoc = response.data;
        if (this.additionalSignerKBASessionDoc?.sessionDoc?.skipCustomerKBACheck) {
          this.additionalSignerKBASessionDocSkipped = this.additionalSignerKBASessionDoc?.sessionDoc?.skipCustomerKBACheck;
        }
        if (this.additionalSignerKBASessionDoc?.sessionDoc?.performInSessionKBA) {
          this.additionalSignerKBASessionDocInSessionKBA = this.additionalSignerKBASessionDoc?.sessionDoc?.performInSessionKBA;
        }
        console.log("response.data.additionalSignerNextStage", response.data.additionalSignerNextStage);
        this.localSetKBAModalSection(response.data.additionalSignerNextStage);
      }
      if (this.additionalSignerKBASessionDocInSessionKBA) {
        this.showKBAModalSection = "meet_notary";
      }
      this.showKBAModal = true;
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
    console.log("fpr - upgrade pro referral", this.$user.email, this.$user._id);
    window.fpr("referral", { email: this.$user.email, uid: this.$user._id });
    if (!this.stripe) {
      if (this.$user.testingacc) {
        const pubkey = process.env.STRIPE_PUBLIC_KEY_TEST;
        this.stripe = await loadStripe(pubkey);
      } else {
        const pubkey = process.env.STRIPE_PUBLIC_KEY;
        this.stripe = await loadStripe(pubkey);
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
      cardElements.forEach((element) => {
        this.card[element] = this.elements.create(element, { style });
        this.card[element].mount(`#${element}`);
        this.card[element].addEventListener("change", (e) => this.updated(e));
      });
    }
  },
  beforeDestroy() {
    this.socketRequest("leave_user");
    VueEventBus.$off("SOCKET_UPDATES");
    VueEventBus.$off("SOCKET_RECONNECTED");
  },
  setup(_, context) {
    const {
      root: { $router, $q, $user },
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
    const continueSession = async (item) => {
      console.log(item);
      let currentStageToUse = item.currentStage;
      if (!item.session.skipCustomerKBACheck) {
        if (!(window.sessionStorage.getItem(`${item.session._id}_kba`) === "true" && window.sessionStorage.getItem(`${item.session._id}_photoid`) === "true")) {
          currentStageToUse = "intial_stage";
        }
      }
      $q.localStorage.set("sessionData", item.current_session_id);
      let url = `/business/prepare_doc/${item.current_session_id}`;
      switch (currentStageToUse) {
        case "intial_stage":
          url;
          break;
        case "identity_check_stage":
          url = `/business/personal_info/${item.current_session_id}`;
          break;
        case "kba_check_stage":
          url = `/business/kba/${item.current_session_id}`;
          break;
        case "photoid_check_stage":
          url = `/business/photoid/${item.current_session_id}`;
          break;
        case "payment_info_stage":
          url = `/business/payment_info/${item.current_session_id}`;
          break;
        case "meet_notary_stage":
          url = `/business/meet_notary/${item.current_session_id}`;
          break;
        case "identity_check_stage_fail":
        case "kba_check_stage_fail":
        case "photoid_check_stage_fail":
          url = "/business/";
          break;
        default:
          url;
          break;
      }
      $router.replace(url);
    };
    const deleteSession = async (item) => {
      await deleteSessionItem(item.sessionId);
      // const newSessionData = await loadSessionData();
      // console.log("newSessionData = ", newSessionData);
      // this.sessionData = newSessionData;
    };
    const startNewSession = async () => {
      $q.localStorage.set("sessionData", uuidV4());
      $router.replace("/business/prepare_doc");
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
      continueSession,
      deleteSession,
      deleteSessionItem,
      startNewSession,
      socketRequest
    };
  },
  methods: {
    async saveUserDetails() {
      const getUrl = "session/saveUserDetails";
      const response = await this.axios.get(getUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
    },
    rescheduleIconClicked(rescheduleSessionId) {
      this.rescheduleSessionId = rescheduleSessionId;
      this.rescheduleSessionModal = true;
      this.rescheduleTimezoneValues = window.allTimeZones;
      const allowedTimezones = ["(GMT-10:00) Hawaii", "(GMT-08:00) Pacific", "(GMT-07:00) Mountain", "(GMT-06:00) Central", "(GMT-05:00) Eastern"];
      this.rescheduleSelectedTimezone = this.rescheduleTimezoneValues.filter((timezone) => allowedTimezones.indexOf(timezone.label) >= 0);
      console.log(this.rescheduleSelectedTimezone);
      const timezone = String(((new Date().getTimezoneOffset()) / 60) * -1);
      __.map(this.rescheduleSelectedTimezone, (tempValue) => {
        if (tempValue.value === timezone) {
          this.reschedulemeetingTimeZone = tempValue;
        }
      });
    },
    rescheduleTimezoneFilterFn (val, update) {
      if (val === "") {
        update(() => {
          this.rescheduleTimezoneValues = window.allTimeZones;
        });
        return;
      }

      update(() => {
        const needle = val.toLowerCase();
        this.rescheduleTimezoneValues = window.allTimeZones.filter((v) => v.label.toLowerCase().indexOf(needle) > -1);
      });
    },
    notarizationDateTimeInputFieldClicked() {
      this.rescheduleOpenDateTimePickerModal = true;
    },
    rescheduleOptionsFn (selectedDate) {
      return selectedDate >= date.formatDate(Date.now(), "YYYY/MM/DD");
    },
    async rescheduleSaveClicked() {
      this.rescheduleSaveButtonLoading = true;
      const url = `session/saveSessionData/${this.rescheduleSessionId}`;
      const dataToSave = {
        meetingTimeZone: this.reschedulemeetingTimeZone.value,
        currentTimeZone: String((new Date()).getTimezoneOffset() / -60),
        meetingdate: this.rescheduleDatetime,
        sessionRescheduled: true
      };
      const apiResponse = await Vue.axios.post(url, {
        data: dataToSave
      });
      this.rescheduleSaveButtonLoading = false;
      console.log("apiResponse", apiResponse);
      this.rescheduleSessionModal = false;
      this.$q.notify({
        color: "primary",
        position: "bottom-right",
        message: "Session Rescheduled Successfully",
      });
      this.loadSessionData(this.$user, this.current);
    },
    showGotoSessionButton(session) {
      if (session.currentUserAdditionalSigner) {
        return false;
      }
      if (!(session.currentStage === "meet_notary_stage" && session.session.status === "ready to sign")) {
        return false;
      }
      if (!session.session.sessionActive) {
        return false;
      }
      if (!session.session.skipCustomerKBACheck) {
        if (!(sessionStorage.getItem(`${session.session._id}_kba`) === "true" && sessionStorage.getItem(`${session.session._id}_photoid`) === "true")) {
          return false;
        }
      }
      return true;
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
        this.$router.replace("/business");
      } catch (error2) {
        this.paymentModalSubmitLoading = false;
        console.log(error2);
      }
    },
    updated (e) {
      const { elementType } = e;
      const { error } = e;
      if (error) {
        this.errors[elementType] = e.error.message;
        return null;
      }
      if (this.errors[elementType]) {
        this.errors[elementType] = "";
      }
      return null;
    },
    isValid (elementType) {
      return this.errors[elementType] === "";
    },
    errorMessage (elementType) {
      return this.isValid(elementType) ? this.errors[elementType] : false;
    },
    async nextButtonClick() {
      return "";
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
        { user, showArchievedSessions: this.showArchievedSessions },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      this.sessionData = (response.data && response.data.sessionData) || [];
      this.paginate = response.data.paginate;
      console.log("this.sessionData", this.sessionData);
      __.map(this.sessionData, (sessionDoc) => {
        if (sessionDoc.session && sessionDoc.session.paid === false) {
          if (!sessionDoc?.session?.sessionChargeOnBusinessUser) {
            console.log(sessionDoc);
            this.confirmationSessionId = sessionDoc.session._id;
            this.confirmationSessionDoc = sessionDoc;
            this.confirmationSessionDialog = false;
            if (!this.confirmationSessionDoc?.currentUserAdditionalSigner) {
              this.paymentDoneDialog = true;
            }
            this.cannotStartNewSession = true;
          }
        }
      });
    },
    async showKBAModalClosed() {
      await this.loadSessionData(this.$user, this.current);
    },
    kbaModalChangeSection(sectionName, failureReason) {
      this.showKBAModalSection = sectionName;
      if (sectionName === "failed") {
        this.kbaModalFailureReason = failureReason;
      }
    },
    startKBA() {
      this.showKBAModalSection = "personal_details";
    },
    closeKBASession() {
      this.showKBAModal = false;
    },
    localSetKBAModalSection(tempSection) {
      if (tempSection === "photoid_check_stage") {
        this.showKBAModalSection = "photoid";
      } else if (tempSection === "meet_notary" || tempSection === "meet_notary_stage") {
        this.showKBAModalSection = "meet_notary";
      }
    },
    async gotoSessionClicked(sessionParentItem) {
      console.log("sessionParentItem", sessionParentItem);
      if (!sessionParentItem.currentUserAdditionalSigner) {
        this.$router.replace(`/pdf_edit/sessions/${sessionParentItem.session._id}`).catch(() => {});
      } else {
        this.showKBAModalSection = "initial";
        if (sessionParentItem.additionalSignerIdentyDocs) {
          __.map(sessionParentItem.additionalSignerIdentyDocs, (identityDoc) => {
            if (identityDoc.additionalSignerNextStage && identityDoc.userId === this.$user._id) {
              this.localSetKBAModalSection(identityDoc.additionalSignerNextStage);
            }
          });
        }
        if (sessionParentItem.session.performInSessionKBA) {
          this.showKBAModalSection = "meet_notary";
        }
        this.showKBAModalSessionId = String(sessionParentItem.session._id);
        const url = "session/load/personalData";
        const messageToSend = {
          sessionId: this.showKBAModalSessionId,
          additionalSigner: true
        };
        const response = await $axios.post(url, messageToSend, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log(response);
        if (response && response.data) {
          this.additionalSignerKBASessionDoc = response.data;
          if (this.additionalSignerKBASessionDoc?.sessionDoc?.skipCustomerKBACheck) {
            this.additionalSignerKBASessionDocSkipped = this.additionalSignerKBASessionDoc?.sessionDoc?.skipCustomerKBACheck;
          }
          console.log("response.data.additionalSignerNextStage", response.data.additionalSignerNextStage);
          this.localSetKBAModalSection(response.data.additionalSignerNextStage);
        }
        if (sessionParentItem.session.performInSessionKBA) {
          this.showKBAModalSection = "meet_notary";
        }
        this.showKBAModal = true;
      }
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
    showRescheduleButton(sessionDoc) {
      let showButton = true;
      if (["identity_check_stage_fail", "kba_check_stage_fail", "photoid_check_stage_fail"].includes(sessionDoc.currentStage)) {
        showButton = false;
      }
      if (["complete", "failed", "expired"].includes(sessionDoc.status)) {
        showButton = false;
      }
      return showButton;
    },
  },
};
</script>
<style lang="sass" scoped>
</style>
