<template>
  <q-layout>
    <q-page-container class="container">
      <template v-if="onboardingLocal === false">
        <div class="bn-note bn-note--warning">
          <p class="q-mb-md">
            {{ $user.name }}, thank you for choosing to work with Blue Notary.<br />
            We just need the following items to verify and approve your account.<br />
          </p>
          <ul>
            <li><q-icon :name="$user.state ? 'check' : 'assignment_late'" :color="$user.state ? 'green' : 'gray'" /> State</li>
            <li><q-icon :name="$user.commissionNumber ? 'check' : 'assignment_late'" :color="$user.commissionNumber ? 'green' : 'gray'" /> Notary Commission Number</li>
            <li><q-icon :name="commissionExpiration ? 'check' : 'assignment_late'" :color="commissionExpiration ? 'green' : 'gray'" /> Commission Expire on Date</li>
            <li><q-icon :name="notaryCopyOfCommissionLetterName ? 'check' : 'assignment_late'" :color="notaryCopyOfCommissionLetterName ? 'green' : 'gray'" /> RON Approval Document <small>(Go to Certificates/Files tab)</small></li>
            <li v-if="!$user.memberTypeProWhenInvited"><q-icon :name="!stripeErrorsFound ? 'check' : 'assignment_late'" :color="!stripeErrorsFound ? 'green' : 'gray'" /> Add payout details <small>(Go to Billing/Payouts tab)</small></li>
          </ul>
          <p class="q-mt-md">See the video: <a href="https://bluenotary.crisp.help/en/article/getting-approved-on-bluenotary-1jg0b1x/" target="_blank">Getting Approved on BlueNotary</a></p>
        </div>
      </template>
      <template v-if="onboardingLocal === true && $user.approve === 'inactive'">
        <div class="bn-note bn-note--warning">
          <p class="q-mb-md">
            We are now reviewing your application. We'll notify you by email when we have finished the review process.
          </p>
        </div>
      </template>
      <template v-if="loading">
        <div class="renderer">
          <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
        </div>
      </template>
      <q-page class="q-pa-lg">
        <div v-if="!$user.memberTypeProWhenInvited" class="row" style="margin-bottom: 20px;">
          <div class="col-lg-6">
            <div class="card-wrapper" style="margin-right:10px;">
              <div class="d-flex align-items-center">
                <div>
                  <img src="../../assets/earning.png" style="height: 50px;padding-right: 10px;" />
                </div>
                <div>
                  <div style="font-size: 24px;font-weight: 750;color: #3d6a78;">${{ totalEarning }}</div>
                  <div>Total Payout Amount</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="card-wrapper">
              <div class="d-flex align-items-center">
                <div>
                  <img src="../../assets/document.png" style="height: 50px;padding-right: 10px;" />
                </div>
                <div>
                  <div style="font-size: 24px;font-weight: 750;color: #3d6a78;">{{ completedSessions }}</div>
                  <div>Completed Notarizations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <template v-if="currentActiveSessions.length">
          <div class="flex justify-between q-py-md items-center">
            <h1 class="">
              Ready Sessions
            </h1>
            <export-sessions-button :export-view="'notaryDashboard'" />
          </div>
          <div class="q-table__card sessions-info">
            <div v-for="(session, key) of currentActiveSessions" :key="'currentActive' + key">
              <div>
                <q-list class="rounded-borders nnot-dash">
                  <q-expansion-item
                    expand-icon-toggle
                    switch-toggle-side
                  >
                    <template v-slot:header>
                      <!-- <q-avatar icon="bluetooth" color="primary" text-color="white" /> -->
                      <div class="text-left dscol-ses">
                        {{ session.session._id.substr(session.session._id.length - 5).toUpperCase() }}
                      </div>
                      <div class="text-left dscol-st">
                        <q-badge outline :color="getStatusColor(session.session.status)">
                          {{ session.session.status }}
                        </q-badge>
                        <q-badge outline :color="getSessionTypeColor(session.session.sessionType)" style="margin-left: 6px">
                          {{ getSessionTypeText(session.session.sessionType) }}
                        </q-badge>
                      </div>
                      <div class="text-left dscol-sign">
                        {{ session.signer }}
                      </div>
                      <div class="text-left dscol-mtd">
                        <q-icon label="" name="today" />
                        <q-tooltip anchor="bottom left" :delay="1500">
                          Scheduled meeting with signer.
                        </q-tooltip>
                        {{ (typeof(session.session.meetingdate) === 'undefined' || session.session.meetingdate === "N/A" || session.session.meetingdate === "") ? "Meeting not scheduled" : formatDateForMeetingtime(session.session.meetingdate, session.session) }}
                      </div>
                      <!-- gotoSession -->
                      <div v-if="session.session && session.session.status !== 'failed'" class="text-right dscol-bbt">
                        <q-btn v-if="session.joinedAsWitness" class="" color="green" text-color="white" label="Rejoin as witness" @click="gotoSession('/pdf_edit/sessions/' + session.session._id + '?witness=true', session.session)" />
                        <q-btn v-else-if="session.session.sessionActive" class="" color="green" text-color="white" label="Go to Session" @click="gotoSession('/pdf_edit/sessions/' + session.session._id, session.session)" />
                        <div v-else>
                          <div style="font-size: 10px; line-height: 13px">Customer hasn’t joined yet</div>
                          <q-btn class="" color="orange" text-color="white" label="Go to Session" @click="gotoSession('/pdf_edit/sessions/' + session.session._id, session.session)">
                            <q-tooltip>
                              Customer hasn’t joined yet
                            </q-tooltip>
                          </q-btn>
                        </div>
                      </div>
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
        </template>
        <template v-if="(openCalls.length || openCallsSessionAlreadyTaken.length) && $user.memberType === 'pro'">
          <div class="flex justify-between q-py-md items-center">
            <h1 class="">
              Open Calls
            </h1>
          </div>

          <div class="q-table__card sessions-info">
            <div v-for="(session, key) of openCalls" :key="'currentActive' + key">
              <div>
                <q-list class="rounded-borders nnot-dash">
                  <q-expansion-item
                    expand-icon-toggle
                    switch-toggle-side
                  >
                    <template v-slot:header>
                      <!-- <q-avatar icon="bluetooth" color="primary" text-color="white" /> -->
                      <div class="text-left  dscol-ses">
                        {{ session.session._id.substr(session.session._id.length - 5).toUpperCase() }}
                      </div>

                      <div class="text-left dscol-st">
                        <q-badge outline :color="getStatusColor(session.session.status)">
                          {{ session.session.status }}
                        </q-badge>
                        <q-badge outline :color="getSessionTypeColor(session.session.sessionType)" style="margin-left: 6px">
                          {{ getSessionTypeText(session.session.sessionType) }}
                        </q-badge>
                      </div>

                      <div class="text-left dscol-sign">
                        {{ session.signer }}
                      </div>

                      <div class="text-left dscol-mtd">
                        <q-icon label="" name="today" />
                        <q-tooltip anchor="bottom left" :delay="1500">
                          Scheduled meeting with signer.
                        </q-tooltip>
                        {{ (typeof(session.session.meetingdate) === 'undefined' || session.session.meetingdate === "N/A" || session.session.meetingdate === "") ? "Meeting not scheduled" : formatDateForMeetingtime(session.session.meetingdate, session.session) }}
                      </div>

                      <div class="text-right dscol-bbt">
                        <div v-if="session.session.sessionOpenCallForTaking" @click="sessionCallTakeClicked(session.session._id)">
                          <q-btn class="" color="green" text-color="white" label="Pick Up Session" />
                        </div>
                        <div v-else-if="session.session.sessionOpenCallForWitness" @click="sessionCallWitnessClicked(session.session._id, session.session)">
                          <q-btn class="" color="green" text-color="white" label="Join as Witness" />
                        </div>
                        <q-btn v-else class="" color="green" text-color="white" label="Answer the call" @click="gotoSession('/pdf_edit/sessions/' + session.session._id, session.session)" />
                      </div>
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
            <div v-for="(session, key) of openCallsSessionAlreadyTaken" :key="'currentActiveAlreadyTaken' + key">
              <div>
                <q-list class="rounded-borders nnot-dash">
                  <q-expansion-item
                    expand-icon-toggle
                    switch-toggle-side
                  >
                    <template v-slot:header>
                      <!-- <q-avatar icon="bluetooth" color="primary" text-color="white" /> -->
                      <div class="text-left  dscol-ses">
                        {{ session.session._id.substr(session.session._id.length - 5).toUpperCase() }}
                      </div>

                      <div class="text-left dscol-st">
                        <q-badge outline :color="getStatusColor(session.session.status)">
                          {{ session.session.status }}
                        </q-badge>
                        <q-badge outline :color="getSessionTypeColor(session.session.sessionType)" style="margin-left: 6px">
                          {{ getSessionTypeText(session.session.sessionType) }}
                        </q-badge>
                      </div>

                      <div class="text-left dscol-sign">
                        {{ session.signer }}
                      </div>

                      <div class="text-left dscol-mtd">
                        <q-icon label="" name="today" />
                        <q-tooltip anchor="bottom left" :delay="1500">
                          Scheduled meeting with signer.
                        </q-tooltip>
                        {{ (typeof(session.session.meetingdate) === 'undefined' || session.session.meetingdate === "N/A" || session.session.meetingdate === "") ? "Meeting not scheduled" : formatDateForMeetingtime(session.session.meetingdate, session.session) }}
                      </div>

                      <div class="text-right dscol-bbt" style="text-algn: right; font-size: 25px">
                        <q-icon label="" name="feedback">
                          <q-tooltip>
                            Another notary has claimed this session
                          </q-tooltip>
                        </q-icon>
                      </div>
                    </template>
                  </q-expansion-item>

                  <q-separator />
                </q-list>
              </div>
            </div>
          </div>
        </template>
        <template v-if="$user.memberType === 'pro' && !$user.memberTypeProWhenInvited && recentlyAcceptedSessionsData && recentlyAcceptedSessionsData.length">
          <div class="q-py-md q-pt-md items-center">
            <q-expansion-item
              expand-icon-toggle
              header-class="q-px-none"
            >
              <template v-slot:header>
                <h1>
                  Recent Open Calls
                </h1>
              </template>
              <q-table
                :data="recentlyAcceptedSessionsData"
                :columns="recentlyAcceptedSessionsColumns"
                row-key="name"
                hide-bottom
                :table-style="{ 'font-size': '20px' }"
                :rows-per-page-options="[0]"
              />
            </q-expansion-item>
          </div>
        </template>
        <div v-if="!loading" class="row flex flex-center q-mt-lg">
          <q-card class="my-card" flat bordered>
            <q-card-section horizontal>
              <q-card-section class="q-pa-lg">
                <div class="text-overline text-orange-9">Let's get started</div>
                <h5 class="text-h5 q-mt-sm q-mb-xs">Welcome to the BlueNotary platform!</h5>
                <div class="">
                  <ul class="welcome-list">
                    <li>Your live ready/waiting sessions will list here.</li>
                    <li>You can start a new session by inviting a signer.</li>
                    <li> Get an idea of the process by checking out our training videos.</li>
                    <li>Do a dry run with a friend (or yourself) using our simulator.</li>
                  </ul>
                </div>
                <div class="q-pt-lg">
                  <router-link v-if="$user.approve !== 'inactive' && (!$user.memberTypeProWhenInvited || $user.businessUserAllowedNotaryToInvite)" to="/notary/invite">
                    <q-btn icon="schedule_send" class="btn btn-primary q-mr-md " flat bordered label="Invite Signer" />
                  </router-link>
                  <q-btn v-else :disabled="true" icon="schedule_send" class="btn btn-primary q-mr-md " flat bordered label="Invite Signer" />
                </div>
              </q-card-section>

              <q-card-section class="col-5 flex flex-center">
                <q-img
                  class="rounded-borders"
                  src="~assets/notary-tools.jpg"
                />
              </q-card-section>
            </q-card-section>
            <q-separator />

            <q-card-actions class="q-pa-md q-gutter-md">
              <a class="btn" target="_blank" href="https://www.facebook.com/groups/remoteonlinenotarizationbluenotary">
                <q-btn flat icon="supervisor_account" label="FB Support Group" />
              </a>
              <a class="btn" target="_blank" href="https://www.youtube.com/channel/UCStuBiQGI-jZOs_vNE5Onng">
                <q-btn flat icon="video_library" label="Training Videos" />
              </a>
              <a class="btn" target="_blank" href="https://bluenotary.crisp.help/en/article/script-for-live-notarization-calls-r1dmy7/">
                <q-btn icon="text_snippet" flat label="Live Call Scripts" />
              </a>
              <q-btn icon="model_training" class="btn blue" flat label="Session Simulator" @click="$router.replace('/pdf_edit/sessions/simulator')" />
              <q-btn v-if="$user.state === 'Nevada'" icon="create" class="btn blue" flat label="Nevada SOS Document Generator" @click="$router.replace('/pdf_edit/sessions/simulator?document2=true')" />
              <q-btn v-if="$user.state === 'Kentucky'" icon="create" class="btn blue" flat label="Kentucky SOS Document Generator" @click="$router.replace('/pdf_edit/sessions/simulator?document2=true')" />
            </q-card-actions>
          </q-card>
        </div>
      </q-page>
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
    </q-page-container>
  </q-layout>
</template>

<script>
import { $axios } from "boot/axios";
import _ from "lodash";
import DateFormatMixin from "@/mixins/DateFormatMixin";
import ColorMixin from "@/mixins/ColorMixin";
import { loadStripe } from "@stripe/stripe-js/pure";
import VueEventBus from "../../plugins/eventbus.js";
import SessionListViewItemExpandedComponent from "../../components/SessionListViewItemExpandedComponent.vue";
// const moment = require("moment");
import AuditLogsDisplayComponent from "../../components/AuditLogsDisplayComponent.vue";
import ExportSessionsButton from "../../components/ExportSessionsButton.vue";

export default {
  name: "Dashboard",
  components: {
    SessionListViewItemExpandedComponent,
    AuditLogsDisplayComponent,
    ExportSessionsButton
  },
  mixins: [DateFormatMixin, ColorMixin],
  data() {
    return {
      loading: false,
      completedSessions: 0,
      totalEarning: 0,
      onboardingLocal: null,
      sessionData: [],
      currentActiveSessions: [],
      openCalls: [],
      openForTaking: [],
      openForWitness: [],
      openCallsSessionAlreadyTaken: [],
      stripeErrorsFound: false,
      commissionExpiration: false,
      notaryCopyOfCommissionLetterName: false,
      stripeAccountName: false,
      recentlyAcceptedSessionsColumns: [
        {
          name: "sessionid", label: "Session Id", field: "sessionid", headerStyle: "font-size: 17px", style: "font-size: 17px"
        },
        {
          name: "status", label: "Status", field: "status", headerStyle: "font-size: 17px", style: "font-size: 17px"
        },
        {
          name: "sessionScheduledAt", label: "Session Scheduled At", field: "sessionScheduledAt", headerStyle: "font-size: 17px", style: "font-size: 17px"
        },
        {
          name: "openCallFor", label: "Open Call For", field: "openCallFor", headerStyle: "font-size: 17px", style: "font-size: 17px"
        },
      ],
      recentlyAcceptedSessionsData: [],
      recentlyAcceptedSessions: [],
      openAuditLogsModal: false,
      currentSessionAuditLogs: [],
      fullSessionItem: {},
      checkAudioVideo: false,
      checkAudioVideoSessionDoc: {},
      audioVideoError: "",
      audioCheck: false,
      videoCheck: false,
      audio: false,
      video: false,
      gotoSessionClickedForSessionUrl: "",
      stripe: false
    };
  },
  async mounted () {
    this.saveUserDetails();
    this.loading = true;
    this.onboardingLocal = await this.onboard();
    await this.$store.dispatch("auth/fetchUser");
    this.details = await this.loadDetail();
    if (this.details) {
      if (this.details.commissionExpiresOn > 0) {
        this.commissionExpiration = true;
      }
      if (this.details.notaryCopyOfCommissionLetterName && this.details.notaryCopyOfCommissionLetterName !== null) {
        this.notaryCopyOfCommissionLetterName = true;
      }
      if (this.details.stripeAccountName && this.details.stripeAccountName !== null) {
        this.stripeAccountName = true;
      }
      if (!this.details.stripeFullAccountDetails) {
        this.stripeErrorsFound = true;
      }
      if (this.details.stripeFullAccountDetails && this.details.stripeFullAccountDetails.requirements && this.details.stripeFullAccountDetails.requirements.errors && this.details.stripeFullAccountDetails.requirements.errors.length) {
        this.stripeErrorsFound = true;
      }
      if (this.details.stripeFullAccountDetails && this.details.stripeFullAccountDetails.capabilities && this.details.stripeFullAccountDetails.capabilities.transfers !== "active") {
        this.stripeErrorsFound = true;
      }
    }
    if (this.$user.memberType !== "pro" && this.$vendorDoc?.proSubscriptionSettings?.forceUsersForSubscriptionOnLogin) {
      this.upgradeToPro();
    }
    await this.loadSessionData(false);
    let isOnline = true;
    setInterval(() => {
      if (!isOnline && navigator.onLine) {
        isOnline = true;
        console.log("Back online!");
        window.onbeforeunload = null;
        window.location.reload();
      } else if (isOnline && !navigator.onLine) {
        isOnline = false;
        console.log("Lost connection!");
      }
    }, 1000);
    VueEventBus.$on("SOCKET_UPDATES", (socketData) => {
      console.log("socketData", JSON.parse(JSON.stringify(socketData)));
      if (typeof socketData.event !== "undefined") {
        if (socketData.event === "sessionActivityChanged") {
          const sessionidChanged = socketData.sessionid;
          _.map(this.sessionData, (localSessionDoc) => {
            if (String(localSessionDoc.session._id) === sessionidChanged) {
              this.loadSessionData([sessionidChanged]);
            }
          });
        }
        if (socketData.event === "new_session_open_call") {
          const sessionidChanged = socketData.sessionid;
          this.loadSessionData([sessionidChanged]);
        }
        if (socketData.event === "new_session_witness_open_call") {
          const sessionidChanged = socketData.sessionid;
          this.loadSessionData([sessionidChanged]);
        }
      }
    });
    VueEventBus.$on("SOCKET_RECONNECTED", () => {
      this.socketRequest("join_user");
    });
    this.socketRequest("join_user");
    this.loading = false;
  },
  beforeDestroy() {
    this.socketRequest("leave_user");
    VueEventBus.$off("SOCKET_UPDATES");
    VueEventBus.$off("SOCKET_RECONNECTED");
  },
  methods: {
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
    async saveUserDetails() {
      const getUrl = "session/saveUserDetails";
      const response = await this.axios.get(getUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
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
    async loadDetail(sessionId) {
      try {
        const url = "notary/loads";
        const response = await $axios.post(url, { sessionId }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    },
    async onboard() {
      try {
        const url = "/users/me?stripe=true";
        const response = await $axios.get(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return (response.data && response.data.onBoarding) ? response.data.onBoarding : false;
      } catch (error) {
        return error;
      }
    },
    formatTimeDiff(date1, date2) {
      return Array(3)
      .fill([3600, date1.getTime() - date2.getTime()])
      .map((v, i, a) => {
        a[i + 1] = [a[i][0] / 60, ((v[1] / (v[0] * 1000)) % 1) * (v[0] * 1000)];
        return `0${Math.floor(v[1] / (v[0] * 1000))}`.slice(-2);
      });
    },
    async loadSessionData(sessionIds) {
      const url = "notary/sessions";
      const dataToSend = {
        notary_user_id: this.$user._id
      };
      if (sessionIds && sessionIds.length) {
        dataToSend.session_ids = sessionIds;
      }
      const response = await $axios.post(url, dataToSend, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.completedSessions = response.data.completedStatusCount !== undefined ? response.data.completedStatusCount : 0;
      this.totalEarning = response.data.totalEarning !== undefined ? response.data.totalEarning : 0;
      this.sessionData = response.data.sessionData;
      this.recentlyAcceptedSessions = response.data.recentlyAcceptedSessions || [];
      this.currentActiveSessions = [];
      this.openCalls = [];
      this.openForTaking = [];
      this.openForWitness = [];
      this.openCallsSessionAlreadyTaken = [];
      _.map(this.sessionData, (sessionDoc) => {
        if (sessionDoc.openCallAlreadyPicked) {
          if (!(sessionDoc.session.status === "expired" || sessionDoc.session.status === "complete")) {
            this.openCallsSessionAlreadyTaken.push(sessionDoc);
          }
          return;
        }
        if (sessionDoc.session.sessionActive) {
           // active call - if current notary id = session notary ID
           console.log("sessionDoc.joinedAsWitness", sessionDoc);
          if (this.$user._id === sessionDoc.session.notaryUserId || sessionDoc.joinedAsWitness) {
            this.currentActiveSessions.push(sessionDoc);
          } else {
            // else open call
            this.openCalls.push(sessionDoc);
          }
        } else if (sessionDoc.session.status === "ready to sign") {
          if (this.$user._id === sessionDoc.session.notaryUserId) {
            this.currentActiveSessions.push(sessionDoc);
          }
        }
        if (!(sessionDoc.session.status === "expired" || sessionDoc.session.status === "complete")) {
          console.log("sessionDoc.session.sessionOpenCallForTaking", sessionDoc.session.sessionOpenCallForTaking);
          // if (sessionDoc.session.sessionOpenCallForTaking) {
          if (sessionDoc.session.sessionOpenCallForTaking) {
          // if (sessionDoc.session.sessionOpenCallForTaking && (sessionDoc.session.status === "ready to pick" || sessionDoc.session.status === "ready to sign")) {
            this.openForTaking.push(sessionDoc);
            this.openCalls.push(sessionDoc);
          }
          if (sessionDoc.session.sessionOpenCallForWitness && !sessionDoc.joinedAsWitness) {
            console.log(sessionDoc.session);
            if (sessionDoc.session.notaryUserId !== this.$user._id) {
              this.openForWitness.push(sessionDoc);
              this.openCalls.push(sessionDoc);
            }
          }
          if (sessionDoc.session.sessionType === "loan_signing" && sessionDoc.session.sessionOpenCallForTaking) {
            this.openCalls.push(sessionDoc);
          }
        }
      });
      console.log(this.currentActiveSessions);
      console.log(this.openCallsSessionAlreadyTaken);
      this.recentlyAcceptedSessionsData = [];
      _.map(this.recentlyAcceptedSessions, (recentlyAcceptedSession) => {
        console.log(recentlyAcceptedSession);
        const formatDateDiff = this.formatTimeDiff(new Date(), new Date(recentlyAcceptedSession.sessionPickedCallForTakingAt));
        let diffString = "";
        if (parseInt(formatDateDiff[0])) {
          if (parseInt(formatDateDiff[0]) > 1) {
            diffString += `${parseInt(formatDateDiff[0])} hours`;
          } else {
            diffString += `${parseInt(formatDateDiff[0])} hour`;
          }
        }
        if (parseInt(formatDateDiff[1])) {
          if (diffString) {
            diffString += " ";
          }
          if (parseInt(formatDateDiff[1]) > 1) {
            diffString += `${parseInt(formatDateDiff[1])} minutes`;
          } else {
            diffString += `${parseInt(formatDateDiff[1])} minute`;
          }
        }
        if (parseInt(formatDateDiff[2])) {
          if (!diffString) {
            if (parseInt(formatDateDiff[2]) > 1) {
              diffString += `${parseInt(formatDateDiff[2])} seconds`;
            } else {
              diffString += `${parseInt(formatDateDiff[2])} second`;
            }
          }
        }
        let openCallFor = "Everyone";
        if (recentlyAcceptedSession.typeOfKBA === "foreigners_without_residential") {
          openCallFor = "States Allowing Biometrics";
        } else if (recentlyAcceptedSession.requestForStateSpecificNotary) {
          openCallFor = `${recentlyAcceptedSession.requestForStateSpecificNotaryStateName} State`;
        } else if (recentlyAcceptedSession.requestForSpanishNotary) {
          openCallFor = "Notaries Fluent in Spanish";
        }
        const docToPushInTable = {
          sessionid: (recentlyAcceptedSession._id).toString().substr((recentlyAcceptedSession._id).toString().length - 5).toUpperCase(),
          status: recentlyAcceptedSession.notaryUserId === this.$user._id ? "Picked up by you" : "Picked up by other notary",
          sessionScheduledAt: this.formatDateForMeetingtime(recentlyAcceptedSession.meetingdate, recentlyAcceptedSession),
          sessionAcceptedAt: diffString ? `${diffString} ago` : "Right Now",
          openCallFor
        };
        this.recentlyAcceptedSessionsData.push(docToPushInTable);
      });
      this.openCalls = _.uniqBy(this.openCalls, "session._id");
      // this.openCalls = _.filter(this.openCalls, (tempSessionDoc) => {
      //   if (tempSessionDoc?.session?.typeOfKBA === "foreigners_without_residential" && tempSessionDoc?.identityData?.typeOfPhotoId === "passportbook") {
      //     if (this.$user.state === "Florida" || this.$user.state === "Virginia" || this.$user.state === "Pennsylvania" || this.$user.state === "Montana" || this.$user.state === "Louisiana" || this.$user.state === "Wyoming" || this.$user.state === "New Jersey") {
      //       return true;
      //     }
      //     return false;
      //   }
      //   return true;
      // });
    },
    socketRequest(eventName) {
      const dataToSend = {
        user: this.$user._id,
        dashboard: true
      };
      if (window.currentSocket) {
        window.currentSocket.emit(eventName, dataToSend, (res) => {
          console.log("res", res);
        });
      }
    },
    async sessionCallTakeClicked(sessionId) {
      const url = `session/pickUpSession/${sessionId}`;
      const dataToSave = {
        sessionOpenCallForTaking: true
      };
      try {
        await $axios.post(url, {
          data: dataToSave
        });
        this.$q.notify({
          color: "primary",
          position: "bottom",
          message: "You have successfully picked up the session.",
        });
        const dataToSend = {
          sessionid: sessionId
        };
        if (window.currentSocket) {
          window.currentSocket.emit("serverSessionActivityChanged", dataToSend, (res) => {
            console.log("res", res);
          });
        }
      } catch (error) {
        if (error.data && error.data.error) {
          this.$q.notify({
            color: "red",
            position: "bottom",
            message: error.data.error
          });
        }
      }
    },
    async sessionCallWitnessClicked(sessionId, sessionDoc) {
      const url = "session/joinSessionAsWitness";
      const dataToSave = {
        sessionid: sessionId
      };
      try {
        await $axios.post(url, dataToSave);
        this.$q.notify({
          color: "primary",
          position: "bottom",
          message: "You have successfully picked up the session.",
        });
        const dataToSend = {
          sessionid: sessionId
        };
        if (window.currentSocket) {
          window.currentSocket.emit("serverSessionActivityChanged", dataToSend, (res) => {
            console.log("res", res);
          });
        }
      } catch (error) {
        if (error.data && error.data.error) {
          this.$q.notify({
            color: "red",
            position: "bottom",
            message: error.data.error
          });
        }
        return;
      }

      this.$q.notify({
          color: "primary",
          position: "bottom",
          message: "Redirecting to the live session and joining as witness.",
      });
      this.gotoSession(`/pdf_edit/sessions/${sessionId}?witness=true`, sessionDoc);
    },
    gotoSession(sessionUrl, sessionDoc) {
      this.gotoSessionClickedForSessionUrl = sessionUrl;
      this.checkAudioVideo = true;
      this.checkAudioVideoSessionDoc = sessionDoc;
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
        this.$router.replace(this.gotoSessionClickedForSessionUrl);
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
    async upgradeToPro() {
      console.log("NotaryHeader", this.stripe);
      this.loading = true;
      if (process.env.STRIPE_PUBLIC_KEY_TEST) {
        if (!this.stripe) {
          if (this.$user.testingacc) {
            const pubkey = process.env.STRIPE_PUBLIC_KEY_TEST;
            this.stripe = await loadStripe(pubkey);
          } else {
            const pubkey = process.env.STRIPE_PUBLIC_KEY;
            this.stripe = await loadStripe(pubkey);
          }
        }
      }
      this.loading = false;
      try {
        const { data } = await $axios.post("/notary/checkout-session");
        console.log("fpr - upgrade pro referral", this.$user.email, this.$user._id);
        window.fpr("referral", { email: this.$user.email, uid: this.$user._id });
        return this.stripe.redirectToCheckout({ sessionId: data.id });
      } catch (error) {
        return error;
      }
    },
  }
};
</script>
