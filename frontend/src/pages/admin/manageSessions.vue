<template>
  <q-layout>
    <q-page-container class="container">
      <q-page class="q-py-lg">
        <div class="flex justify-between q-py-md items-center">
          <h1 class="">
            Manage Sessions
          </h1>
          <q-checkbox v-model="showTestingSessions" label="Show Testing Sessions" />
          <q-checkbox v-model="showTerminatedSessions" label="Show Terminated Sessions" />
          <q-select v-model="selectedVendorModel" outlined :options="selectedVendorsList" label="Vendor Sessions" style="width: 300px" />
        </div>
        <template v-if="loading">
          <div class="renderer">
            <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
          </div>
        </template>
        <template>
          <q-form class="q-gutter-md" @submit="onSubmit" @reset="onReset">
            <div class="search-form">
              <q-input v-model="searchString" outlined label="Session Id" flat class="q-ml-sm" />
              <q-btn label="Search" type="submit" color="primary" flat class="q-ml-sm" />
              <q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />
            </div>
          </q-form>
        </template>
        <template v-if="sessionData && sessionData.length === 0">
          No Sessions found
        </template>
        <template v-if="sessionData && sessionData.length">
          <div class="row" style="font-size:.6rem;">
            <div class="text-left q-pb-sm" style="width:6%"> &nbsp;</div>
            <div class="text-left" style="width:8%">Session</div>
            <div class="text-left" style="width:15%">Status</div>
            <div class="text-left" style="width:10%" />
            <div class="text-left" style="width:20%">Primary Signer</div>
            <div class="text-left" style="width:20%">Notary User Name</div>
            <div class="text-left" style="width:20%">Meeting Time</div>
          </div>
          <div class="q-table__card sessions-info">
            <div v-for="(session, key) of sessionData" :key="key">
              <div>
                <q-list class="rounded-borders">
                  <q-expansion-item
                    expand-icon-toggle
                    switch-toggle-side
                  >
                    <template v-slot:header>
                      <div class="text-left c-link-wrap" style="width:10%">
                        {{ session.session._id.substr(session.session._id.length - 5).toUpperCase() }}
                        <q-icon name="content_copy" color="primary" size="15px" @click="copyInviteLink(session.inviteLink)" />
                        <q-tooltip :delay="200">
                          Click to copy the invite link
                        </q-tooltip>
                      </div>
                      <div class="text-left badge-responsive">
                        <q-badge :color="getStatusColor(session.session.status)">
                          {{ session.session.status }}
                        </q-badge>
                        <q-badge :color="getSessionTypeColor(session.session.sessionType)" style="margin-left: 6px">
                          {{ getSessionTypeText(session.session.sessionType) }}
                        </q-badge>
                      </div>
                      <div class="text-left " style="width:15%">
                        <q-badge v-if="session.session.sessionOpenCallForTakingAt" outline color="black">
                          Open Call
                        </q-badge>
                        <q-badge v-if="session.session.sessionActive" outline color="blue">
                          Live
                          <q-tooltip>
                            Session is active. Atleast 1 user is present in the session.
                          </q-tooltip>
                        </q-badge>
                        <q-badge v-if="session.session.paid === false" outline color="black">
                          Payment Failed
                          <q-tooltip>
                            {{ session.session.failMessage }}
                          </q-tooltip>
                        </q-badge>
                      </div>
                      <div class="text-left c-link-wrap" style="width:18%">
                        {{ session.signer }} <q-icon name="content_copy" color="primary" size="15px" @click="copyText(session.signerEmail)" />
                        <q-tooltip :delay="200">
                          Click to copy the email
                        </q-tooltip>
                      </div>
                      <div class="text-left c-link-wrap" style="width:14%">
                        <template v-if="session.notaryUserName">
                          {{ session.notaryUserName }} <q-icon name="content_copy" color="primary" size="15px" @click="copyText(session.notaryUserEmail)" />
                          <q-tooltip :delay="200">
                            Click to copy the email
                          </q-tooltip>
                        </template>
                      </div>
                      <!-- <div class="text-left c-link-wrap" style="width:25%">
                        {{ session.notaryUserEmail }}
                      </div> -->
                      <div class="text-left c-link-wrap" style="width:20%">
                        <q-icon label="" name="today" />
                        {{ (typeof(session.session.meetingdate) === 'undefined' || session.session.meetingdate === "N/A" || session.session.meetingdate === "") ? "Meeting not scheduled" : formatDateForMeetingtime(session.session.meetingdate, session.session) }}
                      </div>
                    </template>
                    <q-card class="session-info-card">
                      <q-card-section>
                        <session-list-view-item-expanded-component :session-item-response="session" :audit-trail-clicked="auditTrailClicked" :called-from="'admin_manage_session'" :view-session-stats-clicked="viewSessionStatsClicked" />
                      </q-card-section>
                    </q-card>
                  </q-expansion-item>
                  <q-separator />
                </q-list>
              </div>
            </div>
          </div>
          <div v-if="paginate" class="q-pa-lg flex flex-center">
            <q-pagination
              v-model="current"
              :max="paginate.totalPages"
              :max-pages="6"
              direction-links
              boundary-links
              @click="loadSessionData(current)"
            />
          </div>
        </template>
        <div v-if="!loading && !sessionData.length" class="row flex flex-center q-pa-lg">
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
            Payment from customer's end has failed for some reason. We will follow up with customer to ensure payment is successful. Final session document will be available once payment is done.
          </template>
          <template v-else>
            <template v-if="confitmationSessionDoc && confitmationSessionDoc.finalDocument && confitmationSessionDoc.finalDocument.url">
              <a :href="confitmationSessionDoc.finalDocument.url" target="_blank" class="blue">
                <q-icon name="task" class="text-center q-pa-md" style="font-size: 3rem;display: block;margin:0 auto;" />
                {{ confitmationSessionDoc.finalDocument.name }}
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
    <q-dialog v-model="sessionStatsModelOpened">
      <q-card style="width: 70%; min-width: 70%; max-width: 70%">
        <q-card-section>
          <div class="text-h6 text-primary">Live Session Statistics</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <session-stats-model-content :session-item="fullSessionItem" :session-stats-model-opened="sessionStatsModelOpened" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup outline label="Close" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import { $axios } from "boot/axios";
import { copyToClipboard } from "quasar";
import DateFormatMixin from "@/mixins/DateFormatMixin";
import ColorMixin from "@/mixins/ColorMixin";
import AuditLogsDisplayComponent from "../../components/AuditLogsDisplayComponent.vue";
import SessionListViewItemExpandedComponent from "../../components/SessionListViewItemExpandedComponent.vue";
import SessionStatsModelContent from "../../components/SessionStatsModelContent.vue";

// const moment = require("moment");

export default {
  name: "ManageSessions",
  components: {
    AuditLogsDisplayComponent,
    SessionListViewItemExpandedComponent,
    SessionStatsModelContent
  },
  mixins: [DateFormatMixin, ColorMixin],
  data() {
    return {
      loading: false,
      sessionData: [],
      paginate: [],
      confirmationSessionId: "",
      confirmationSessionDialog: false,
      confitmationSessionDoc: {},
      paymentFailure: false,
      current: 1,
      openAuditLogsModal: false,
      currentSessionAuditLogs: [],
      fullSessionItem: {},
      showTestingSessions: false,
      showTerminatedSessions: false,
      searchString: "",
      sessionStatsModelOpened: false,
      selectedVendorModel: null,
      selectedVendorsList: []
    };
  },
  watch: {
    showTestingSessions: {
      handler() {
        this.loadSessionData(1);
      }
    },
    showTerminatedSessions: {
      handler() {
        this.loadSessionData(1);
      }
    },
    selectedVendorModel: {
      handler() {
        this.loadSessionData(1);
      }
    }
  },
  async mounted () {
    this.loading = true;
    await this.loadSessionData(this.current);
    this.loading = false;
  },
  methods: {
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
    async loadSessionData(current) {
      const baseUrl = "admins/fetchSessions/";
      const url = baseUrl + current;
      const response = await $axios.post(url, {
 showTestingSessions: this.showTestingSessions, showTerminatedSessions: this.showTerminatedSessions, selectedVendorModel: this.selectedVendorModel?.value, searchString: this.searchString
}, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.sessionData = response.data.sessionData;
      this.paginate = response.data.paginate;
      this.selectedVendorsList = response.data.allVendorResponse;
    },
    async onSubmit() {
      if (this.searchString === "" || this.searchString === null) {
        this.$q.notify({
          color: "red-5",
          textColor: "white",
          icon: "warning",
          message: "Session Id is required"
        });
      } else {
        this.current = 1;
        await this.loadSessionData(this.current);
      }
    },
    async onReset() {
      this.searchString = "";
      this.current = 1;
      await this.loadSessionData(this.current);
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
    viewSessionStatsClicked (sessionItem) {
      this.fullSessionItem = sessionItem;
      this.sessionStatsModelOpened = true;
    }
  }
};
</script>

<style type="text/css">
  .search-form{
    position: relative;
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  .search-form label {
    max-width: 50%;
    width: 100%;
    margin-left: 0;
  }
</style>
