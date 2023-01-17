<template>
  <q-layout>
    <q-page-container class="container">
      <template v-if="$onBoarding === true && $user.approve === 'inactive'">
        <div class="bn-note bn-note--warning">
          <p class="q-mb-md">
            We have everything required. Please give a bit of time to review your application.
          </p>
        </div>
      </template>
      <q-page class="q-pa-lg">
        <div class="flex justify-between q-py-md items-center q-gutter-x-md">
          <div class="col-4">
            <h1 class="">
              Journal
            </h1>
          </div>
          <export-sessions-button :export-view="'notaryJournal'" :archived-view="showArchievedSessions" />

          <div style="margin-left: auto; margin-right: 0;">
            <router-link v-if="$user.approve !== 'inactive' && (!$user.memberTypeProWhenInvited || $user.businessUserAllowedNotaryToInvite)" to="/notary/invite">
              <q-btn class="" color="primary" label="Invite Signer" />
            </router-link>
          </div>
        </div>
        <template v-if="loading">
          <div class="renderer">
            <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
          </div>
        </template>
        <q-checkbox v-model="showArchievedSessions" size="xs" class="" style="font-size:.7rem" label="Show Archived Sessions" />
        <template v-if="sessionData && sessionData.length">
          <div class="row q-px-md" style="font-size:.6rem;">
            <div class="text-left q-pb-sm cols-aer" style="padding-left: 48px"> &nbsp;</div>
            <div class="text-left cols-ss col-md-1 col-sm-4 col-12">Session</div>
            <div class="text-left cols-st col-md-2 col-sm-4 col-12">Status</div>
            <div class="text-left cols-psign col-md-2 col-sm-4 col-12">Primary Signer</div>
            <div class="text-left cols-mdt col-md-2 col-sm-3 col-12">Meeting Time</div>
            <div class="text-left cols-prg col-md-3 col-sm-3 col-12">Progress</div>
          </div>
          <div class="q-table__card sessions-info">
            <div v-for="(session, key) of sessionData" :key="key">
              <div class="row " style="width:100%;">
                <q-list class="rounded-borders myses " style="width:100%;">
                  <q-expansion-item
                    expand-icon-toggle
                    switch-toggle-side
                  >
                    <template v-slot:header>
                      <div class="row " style="width:100%;align-items: flex-start; line-height: 40px">
                        <div class="text-left cols-ss col-md-1 col-sm-4 col-12">
                          <span class="q-mt-sm q-mb-xs">{{ session.session._id.substr(session.session._id.length - 5).toUpperCase() }}</span>
                          <span class="clbblue" @click="copyInviteLink(session.inviteLink)">
                            Invite Link
                            <q-icon name="content_copy" color="primary" size="10px" @click="copyInviteLink(session.inviteLink)" />
                            <q-tooltip>
                              Click to copy the invite link
                            </q-tooltip>
                          </span>
                        </div>
                        <div class="text-left cols-st col-md-2 col-sm-4 col-12">
                          <q-badge outline :color="getStatusColor(session.session.status)">
                            {{ (session.session.status === "unsigned") ? "incomplete" : session.session.status }}
                          </q-badge>
                          <!--  <q-badge :color="getSessionTypeColor(session.session.sessionType)" style="margin-left: 6px">
                            {{ getSessionTypeText(session.session.sessionType) }}
                          </q-badge> -->
                        </div>
                        <div class="text-left cols-psign col-md-2 col-sm-4 col-12">
                          <span class="q-mt-sm q-mb-xs" style="overflow: hidden;white-space: nowrap;text-overflow: ellipsis;">{{ session.signer }} </span>
                          <span class="clbblue hidtab" @click="copyText(session.signerEmail)">
                            {{ session.signerEmail }}
                            <q-icon name="content_copy" color="primary" size="10px" @click="copyText(session.signerEmail)" />
                            <q-tooltip :delay="200">
                              Click to copy the email
                            </q-tooltip>
                          </span>
                          <span class="clbblue vbtab">
                            Copy Email
                            <q-icon name="content_copy" color="primary" size="10px" @click="copyText(session.signerEmail)" />
                            <q-tooltip :delay="200">
                              Click to copy the email
                            </q-tooltip>
                          </span>
                        </div>
                        <div class="text-left cols-mdt col-md-3 col-sm-4 col-12">
                          <q-icon label="" name="today" />
                          {{ (typeof(session.session.meetingdate) === 'undefined' || session.session.meetingdate === "N/A" || session.session.meetingdate === "") ? "Meeting not scheduled" : formatDateForMeetingtime(session.session.meetingdate, session.session) }}
                          <q-tooltip :delay="1500">
                            Scheduled meeting with signer.
                          </q-tooltip>
                        </div>
                        <div class="text-left col-md-2 col-sm-2 col-12 q-mt-md">
                          <q-linear-progress size="15px" :value="session.sessionProgressNumber" :color="session.sessionProgressColor" rounded>
                            <q-tooltip>{{ session.sessionProgressName }}</q-tooltip>
                          </q-linear-progress>
                          <div v-if="session.signerNotJoined" style="font-size: 10px; line-height: 13px; text-align: center">Signer hasn’t joined yet</div>
                        </div>
                        <template v-if="session.session && session.session.status !== 'failed'">
                          <div v-if="session.session.sessionActive" class="text-right cols-gtses col-md-2 col-sm-4 col-12 res-left">
                            <q-btn class="" color="green" text-color="white" label="Go to Session" @click="gotoSession(session)">
                              <q-tooltip v-if="!session.signerNotJoined">
                                Signer has joined the Session
                              </q-tooltip>
                              <q-tooltip v-else>
                                Signer hasn’t joined yet
                              </q-tooltip>
                            </q-btn>
                          </div>
                          <div v-else-if="session.session.status === 'ready to sign'" class="text-right cols-gtses col-md-2 col-sm-4 col-12 res-left">
                            <div style="font-size: 10px; line-height: 13px">Customer hasn’t joined yet</div>
                            <q-btn class="" color="orange" text-color="white" label="Go to Session" @click="gotoSession(session)">
                              <q-tooltip>
                                Signer hasn’t joined yet
                              </q-tooltip>
                            </q-btn>
                          </div>
                          <div v-else-if="session.session.status === 'unsigned' && $user.memberType !== 'free'" class="text-right cols-gtses col-md-2 col-sm-4 col-12 res-left">
                            <q-btn class="" color="blue" text-color="white" label="Pre-Tag" @click="gotoSession(session)">
                              <q-tooltip>
                                You can pre-tag the document, while the signer finishes up the process
                              </q-tooltip>
                            </q-btn>
                          </div>
                        </template>
                      </div>
                      <q-btn v-if="!showArchievedSessions && showRescheduleButton(session.session)" round flat icon="edit_calendar" style="height: 100%" @click="rescheduleIconClicked(session.session._id)">
                        <q-tooltip>
                          Reschedule the Session
                        </q-tooltip>
                      </q-btn>
                      <q-btn v-if="!showArchievedSessions && showArchieveButton(session)" flat color="black" icon="archive" style="height: 100%" @click="archiveClicked(session.session._id)">
                        <q-tooltip>Click here to Archive the session</q-tooltip>
                      </q-btn>
                      <q-btn v-if="showArchievedSessions && showArchieveButton(session)" flat color="blue" icon="unarchive" style="margin-left: 10px; float: right" @click="unarchiveClicked(session.session._id)">
                        <q-tooltip>Click here to UnArchive the session</q-tooltip>
                      </q-btn>
                    </template>
                    <q-card class="session-info-card">
                      <q-card-section>
                        <session-list-view-item-expanded-component :session-item-response="session" :audit-trail-clicked="auditTrailClicked" />
                      </q-card-section>
                    </q-card>
                  </q-expansion-item>
                  <q-separator />
                </q-list>
              </div>
            </div>
          </div>
          <div v-if="pagination" class="q-pa-lg flex flex-center">
            <q-pagination
              v-model="currentPage"
              :max="pagination.totalPages"
              :max-pages="6"
              direction-links
              boundary-links
              @click="loadSessionDataProxy(currentPage)"
            />
          </div>
        </template>
        <div v-else>
          <h6>No sessions found</h6>
        </div>
        <div v-if="!loading && !sessionData.length && !showArchievedSessions" class="row flex flex-center q-pa-lg">
          <q-card class="my-card" flat bordered>
            <q-card-section horizontal>
              <q-card-section class="q-pa-lg">
                <div class="text-overline text-orange-9">Let's get started</div>
                <div class="text-h5 q-mt-sm q-mb-xs">Welcome to the BlueNotary platform!</div>
                <div class="">
                  <ul class="welcome-list">
                    <li>Your live ready/waiting sessions will list here.</li>
                    <li>You can start a new session by inviting a signer.</li>
                    <li> Get an idea of the process by checking out our training videos.</li>
                    <li>Do a dry run with a friend (or yourself) using our simulator.</li>
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

            <q-separator />

            <q-card-actions class="q-pa-md q-gutter-md">
              <router-link v-if="$user.approve !== 'inactive' && (!$user.memberTypeProWhenInvited || $user.businessUserAllowedNotaryToInvite)" to="/notary/invite">
                <q-btn icon="schedule_send" class="btn btn-primary q-mr-md " flat bordered label="Invite Signer" />
              </router-link>
              <q-btn v-else :disabled="true" class="btn btn-primary" flat bordered label="Invite Signer" />
              <a style="color:#4a4a4a" target="_blank" href="https://www.youtube.com/channel/UCStuBiQGI-jZOs_vNE5Onng">
                <q-btn flat icon="video_library" label="Training Videos" />
              </a>
              <a style="color:#4a4a4a" target="_blank" href="https://bluenotary.crisp.help/en/article/script-for-live-notarization-calls-r1dmy7/">
                <q-btn icon="text_snippet" flat label="Live Call Scripts" />
              </a>

              <q-btn icon="model_training" class="" flat label="Session Simulator" />
            </q-card-actions>
          </q-card>
        </div>
      </q-page>
    </q-page-container>
    <q-dialog v-model="confirmationSessionDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Session Complete</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <template v-if="paymentFailure">
            <template v-if="!paymentFailureByNotary">
              Payment from customer's end has failed for some reason. We will follow up with customer to ensure payment is successful. Final session document will be available once payment is done.
            </template>
            <template v-else>
              Your payment has failed. Please add payment details. Final session document will be available once payment is done.
            </template>
          </template>
          <template v-else>
            <template v-if="confitmationSessionDoc && confitmationSessionDoc.finalDocument && confitmationSessionDoc.finalDocument.length">
              <a v-for="tempFinalDocument in confitmationSessionDoc.finalDocument" :key="tempFinalDocument._id" :href="tempFinalDocument.url" target="_blank" class="blue">
                <q-icon name="task" class="text-center q-pa-md" style="font-size: 3rem;display: block;margin:0 auto;" />
                {{ tempFinalDocument.name }}
              </a>
            </template>
            <template v-else>
              Session Final Document Not Ready. Please refresh the page and check
            </template>
          </template>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup outline label="Close" color="primary" />
        </q-card-actions>
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
    <q-dialog v-model="checkAudioVideo" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <div class="q-pb-sm row">
            <div class="col-12">
              <h2 style="padding-bottom: 6px">Session Timing Type.</h2>
              <template v-if="checkAudioVideoSessionDoc.notorizationTiming === 'notarize_later'">
                <b>Notarize Later</b><span v-if="checkAudioVideoSessionDoc.meetingdate"> - {{ formatDateForMeetingtime(checkAudioVideoSessionDoc.meetingdate, checkAudioVideoSessionDoc) }}</span>
              </template>
              <template v-else>
                <b>Notarize Now</b>
              </template>
            </div>
            <div class="col-12" style="padding-top: 16px">
              <h2>Checking your audio/video quality before entering session</h2>
              <p class="q-pb-sm green q-py-md"><q-icon label="" name="wifi" /> Your internet connection is strong enough for the video call.</p>
              <video id="video" src="" style="color: black; width: 100%; min-height: 260px;" />
              <audio id="audio" src="" />
            </div>
          </div>
          <p v-if="audioVideoError.length > 0" class="text-red">
            {{ audioVideoError }}
          </p>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn v-close-popup outline label="Close" color="text-gray" @click="closePopup()" />
          <!-- <q-btn v-if="video" outline round color="primary" icon="videocam" @click="toggleVideo()" />
            <q-btn v-else outline round color="primary" icon="videocam_off" @click="toggleVideo()" />
            <q-btn v-if="audio" outline round color="primary" icon="mic" @click="toggleAudio()" />
            <q-btn v-else outline round color="primary" icon="mic_off" @click="toggleAudio()" /> -->
          <q-btn outline label="Continue" color="primary" @click="goesNextAfterAudioVideoCheck()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import { $axios } from "boot/axios";
import _ from "lodash";
import { date, copyToClipboard } from "quasar";
import Vue from "vue";
import { loadStripe } from "@stripe/stripe-js/pure";
import DateFormatMixin from "@/mixins/DateFormatMixin";
import ColorMixin from "@/mixins/ColorMixin";
import VueEventBus from "../../plugins/eventbus.js";
import AuditLogsDisplayComponent from "../../components/AuditLogsDisplayComponent.vue";
import SessionListViewItemExpandedComponent from "../../components/SessionListViewItemExpandedComponent.vue";
import ExportSessionsButton from "../../components/ExportSessionsButton.vue";

// const moment = require("moment");

export default {
  name: "MySession",
  components: {
    AuditLogsDisplayComponent,
    SessionListViewItemExpandedComponent,
    ExportSessionsButton
  },
  mixins: [DateFormatMixin, ColorMixin],
  data() {
    return {
      loading: false,
      sessionData: [],
      pagination: {},
      currentPage: 1,
      confirmationSessionId: "",
      confirmationSessionDialog: false,
      confitmationSessionDoc: {},
      paymentFailure: false,
      paymentFailureByNotary: false,
      showArchievedSessions: false,
      openAuditLogsModal: false,
      currentSessionAuditLogs: [],
      fullSessionItem: {},
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
      confirmationSessionDoc: {},
      checkAudioVideo: false,
      checkAudioVideoSessionDoc: {},
      audioVideoError: "",
      audioCheck: false,
      videoCheck: false,
      audio: false,
      video: false,
      rescheduleSessionId: "",
      rescheduleSessionModal: false,
      rescheduleDatetime: "",
      reschedulemeetingTimeZone: "",
      rescheduleSelectedTimezone: [],
      rescheduleTimezoneValues: [],
      rescheduleOpenDateTimePickerModal: false,
      rescheduleSaveButtonLoading: false,
      disableSaveRescheduleSaveButton: false,
      gotoSessionClickedForSession: {}
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
        this.loadSessionData({});
      }
    }
  },
  async mounted () {
    this.loading = true;
    await this.loadSessionData({});
    if (this.$route.query.confirmationSession) {
      this.confirmationSessionId = this.$route.query.confirmationSession;
      this.confirmationSessionDialog = true;
      _.map(this.sessionData, (tempSessionData) => {
        if (tempSessionData && tempSessionData.session && tempSessionData.session._id === this.confirmationSessionId) {
          this.confitmationSessionDoc = tempSessionData;
        }
      });
    }
    if (this.$route.query.paymentDone === "failure") {
      this.paymentFailure = true;
      if (this.confitmationSessionDoc?.session?.sessionChargeOnBusinessUser) {
        this.paymentFailureByNotary = true;
      }
    }
    if (this.confitmationSessionDoc?.session?.paid === false) {
      this.paymentFailure = true;
      if (this.confitmationSessionDoc?.session?.sessionChargeOnBusinessUser) {
        this.paymentFailureByNotary = true;
      }
    }
    VueEventBus.$on("SOCKET_UPDATES", (socketData) => {
      console.log("socketData", JSON.parse(JSON.stringify(socketData)));
      if (typeof socketData.event !== "undefined") {
        if (socketData.event === "sessionActivityChanged") {
          const sessionidChanged = socketData.sessionid;
          _.map(this.sessionData, (localSessionDoc) => {
            if (String(localSessionDoc.session._id) === sessionidChanged) {
              this.loadSessionData({ sessionIds: [sessionidChanged] });
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
  methods: {
    rescheduleIconClicked(rescheduleSessionId) {
      this.rescheduleSessionId = rescheduleSessionId;
      this.rescheduleSessionModal = true;
      this.rescheduleTimezoneValues = window.allTimeZones;
      const allowedTimezones = ["(GMT-10:00) Hawaii", "(GMT-08:00) Pacific", "(GMT-07:00) Mountain", "(GMT-06:00) Central", "(GMT-05:00) Eastern"];
      this.rescheduleSelectedTimezone = this.rescheduleTimezoneValues.filter((timezone) => allowedTimezones.indexOf(timezone.label) >= 0);
      console.log(this.rescheduleSelectedTimezone);
      const timezone = String(((new Date().getTimezoneOffset()) / 60) * -1);
      _.map(this.rescheduleSelectedTimezone, (tempValue) => {
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
        position: "bottom-right",
        message: "Session Rescheduled Successfully",
      });
      this.loadSessionData({});
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
    async loadSessionDataProxy(currentPage) {
      await this.loadSessionData({ currentPage });
    },
    async loadSessionActivityStatus(sessionIds) {
      console.log(sessionIds);
      const url = "session/sessionsActivityStatus";
      const dataToSend = {
        sessionIds
      };
      const response = await $axios.post(url, dataToSend, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      const userInSessionStatus = response?.data?.userInSessionStatus || {};
      if (userInSessionStatus) {
        this.sessionData = _.map(this.sessionData, (sessionDoc) => {
          if (userInSessionStatus[sessionDoc.session._id]) {
            sessionDoc.userInSessionStatus = userInSessionStatus[sessionDoc.session._id];
            if (!userInSessionStatus[sessionDoc.session._id]?.signer) {
              sessionDoc.signerNotJoined = true;
            }
          }
          return sessionDoc;
        });
      }
    },
    async loadSessionData(params) {
      const url = "notary/sessions";
      const dataToSend = {
        notary_user_id: this.$user._id,
        journal: true,
        showArchievedSessions: this.showArchievedSessions,
        page: this.currentPage,
        paginate: true
      };
      if (params.sessionIds && params.sessionIds.length) {
        dataToSend.session_ids = params.sessionIds;
      }
      if (params.currentPage && params.currentPage !== this.currentPage) {
        dataToSend.page = params.currentPage;
      }
      const response = await $axios.post(url, dataToSend, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.pagination = response.data.pagination;
      this.currentPage = this.pagination.page;
      this.sessionData = response.data.sessionData;
      const sessionIds = [];
      _.map(this.sessionData, async (sessionDoc) => {
        if (!(sessionDoc.session.paid || sessionDoc.session.status === "complete" || sessionDoc.session.status === "expired" || sessionDoc.session.status === "failed")) { sessionIds.push(sessionDoc.session._id); }
        if (sessionDoc.session && sessionDoc.session.paid === false) {
          let chargeToBePaidByCurrentNotary = sessionDoc?.session?.sessionChargeOnBusinessUser && !sessionDoc?.session?.sessionCreatedByBusinessUser;
          if (sessionDoc?.session?.vendor && this.$vendorDoc?.sessionChargeOnBusinessUser) {
            chargeToBePaidByCurrentNotary = false;
          }
          if (chargeToBePaidByCurrentNotary) {
            console.log(sessionDoc);
            this.confirmationSessionId = sessionDoc.session._id;
            this.confirmationSessionDoc = sessionDoc;
            this.confirmationSessionDialog = false;
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
          }
        }
      });
      this.loadSessionActivityStatus(sessionIds);
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
    copyInviteLink(inviteLink) {
      copyToClipboard(inviteLink).then(() => {
          this.$q.notify({
            type: "positive",
            position: "bottom-right",
            message: "Invite link copied to clipboard!",
          });
        }).catch(() => {
        // fail
        });
    },
    async auditTrailClicked(sessionItem) {
      const url = `session/getAuditTrail/${sessionItem.session._id}`;
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
          this.sessionData = _.filter(this.sessionData, (tempSessionDoc) => tempSessionDoc.session._id !== sessionid);
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
          this.sessionData = _.filter(this.sessionData, (tempSessionDoc) => tempSessionDoc.session._id !== sessionid);
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
        this.$router.replace("/notary/my-sessions");
      } catch (error2) {
        this.paymentModalSubmitLoading = false;
        console.log(error2);
      }
    },
    gotoSession(session) {
      this.gotoSessionClickedForSession = session;
      this.checkAudioVideo = true;
      this.checkAudioVideoSessionDoc = session.session;
      this.toggleAudio();
      this.toggleVideo();
    },
    goesNextAfterAudioVideoCheck() {
      if (!this.video) {
        this.audioVideoError = "Camera permission is required to go ahead, please enable the camera access and try again.";
      } else if (!this.audio) {
        this.audioVideoError = "Mic permission is required to go ahead, please enable the mic access and try again.";
      } else {
        this.closePopup();
        this.$router.replace(`/pdf_edit/sessions/${this.gotoSessionClickedForSession.session._id}`);
      }
    },
    getAudioVideoStream() {
      // video
      navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
          document.getElementById("video").srcObject = stream;
          document.getElementById("video").autoplay = true;
          this.video = true;
          this.videoCheck = true;
      }).catch((err) => {
          this.audioVideoError = err;
          console.log(`u got an error: ${err}`);
      });

      // Audio
      navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((stream) => {
          document.getElementById("audio").srcObject = stream;
          // document.getElementById("audio").autoplay = true;
          this.audio = true;
          this.audioCheck = true;
      }).catch((err) => {
          this.audioVideoError = err;
          console.log(`u got an error: ${err}`);
      });
    },
    toggleAudio() {
      if (!this.audio) {
        // Audio
        navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((stream) => {
            document.getElementById("audio").srcObject = stream;
            // document.getElementById("audio").autoplay = true;
            this.audio = true;
            this.audioCheck = true;
        }).catch((err) => {
            this.audioVideoError = err;
            console.log(`u got an error: ${err}`);
        });
      } else {
        const audioElem = document.getElementById("audio");
        const aStream = audioElem.srcObject;
        const aTracks = aStream.getTracks();

        aTracks.forEach((track) => {
          track.stop();
        });
        audioElem.srcObject = null;
        this.audio = false;
      }
    },
    toggleVideo() {
      if (!this.video) {
        // video
        console.log(navigator);
        console.log(navigator.mediaDevices);
        navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
            document.getElementById("video").srcObject = stream;
            document.getElementById("video").autoplay = true;
            this.video = true;
            this.videoCheck = true;
        }).catch((err) => {
            this.audioVideoError = err;
            console.log(`u got an error: ${err}`);
        });
      } else {
        const videoElem = document.getElementById("video");
        const vStream = videoElem.srcObject;
        const vTracks = vStream.getTracks();

        vTracks.forEach((track) => {
          track.stop();
        });
        videoElem.srcObject = null;
        this.video = false;
      }
    },
    closePopup() {
      if (this.video) {
        this.toggleVideo();
      }
      if (this.audio) {
        this.toggleAudio();
      }
    },
    stopAudioVideo() {
      const videoElem = document.getElementById("video");
      const audioElem = document.getElementById("audio");

      if (this.video) {
        const vStream = videoElem.srcObject;
        const vTracks = vStream.getTracks();

        vTracks.forEach((track) => {
          track.stop();
        });
        videoElem.srcObject = null;
        this.video = false;
      }

      if (this.audio) {
        const aStream = audioElem.srcObject;
        const aTracks = aStream.getTracks();

        aTracks.forEach((track) => {
          track.stop();
        });
        audioElem.srcObject = null;
        this.audio = false;
      }
    },
  }
};
</script>
