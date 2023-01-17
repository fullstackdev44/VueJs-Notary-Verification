<template>
  <q-layout>
    <q-page-container class="container">
      <q-page class="q-py-lg">
        <div class="flex justify-between q-py-md items-center">
          <h1 class="">Manage Notaries</h1>
          <q-checkbox v-model="showReadyForApprovalNotaries" label="Show Ready for Approval Notaries" />
          <q-checkbox v-model="showNotariesFromApprovedStates" label="Show Notaries from Approved States" />
          <q-checkbox v-model="showNotariesFromNonApprovedStates" label="Show Notaries from Non Approved States" />
          <q-checkbox
            v-model="showLSAApprovalNotaries"
            label="Show LSA Approval Notaries"
          />
          <q-checkbox
            v-model="hideCommissionExpiredNotaries"
            label="Hide Commission Expired Notaries"
          />
        </div>
        <template v-if="loading">
          <div class="renderer">
            <img
              src="/icons/Loading.gif"
              alt="loading-gif"
              style="max-width: 100px"
            />
          </div>
        </template>
        <template>
          <q-form class="q-gutter-md" @submit="onSubmit" @reset="onReset">
            <div class="search-form">
              <q-input v-model="email" outlined label="Email" flat class="q-ml-sm" />
              <q-btn label="Search" type="submit" color="primary" flat class="q-ml-sm" />
              <q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />
            </div>
          </q-form>
        </template>
        <template v-if="notaries && notaries.length === 0">
          No Customer found
        </template>
        <template v-if="notaries && notaries.length">
          <div class="q-table__card sessions-info">
            <div v-for="(notary, key) of notaries" :key="key">
              <div>
                <q-list class="rounded-borders">
                  <q-expansion-item expand-icon-toggle switch-toggle-side>
                    <template v-slot:header>
                      <div class="text-left" style="width: 8%">
                        <q-badge v-if="notary.notary.memberType !== 'free'" outline color="red">{{ notary.notary.memberType }}</q-badge>
                        <q-badge v-if="isUserBlocked(notary.notary)" color="red">Blocked</q-badge>
                      </div>
                      <div class="text-left" style="width: 10%">
                        <q-badge :color="getStatusColor(notary.notary.approve)">
                          {{
                            notary.notary.approve
                              ? notary.notary.approve
                              : "active"
                          }}
                        </q-badge>
                      </div>
                      <div class="text-left" style="width: 30%">
                        {{ notary.notary.name }}
                        <q-icon
                          name="content_copy"
                          color="primary"
                          size="15px"
                          @click="copyText(notary.notary.email)"
                        />
                        <q-tooltip :delay="200">
                          Click to copy the email
                        </q-tooltip>
                      </div>
                      <div class="text-left" style="width: 30%">
                        <a
                          v-if="
                            notary.notatyDataDocument &&
                              notary.notatyDataDocument
                                .notaryCopyOfCommissionLetterUrl
                          "
                          :href="
                            notary.notatyDataDocument
                              .notaryCopyOfCommissionLetterUrl
                          "
                        >Commission Letter</a
                        >
                      </div>
                      <div class="text-left" style="width: 20%">
                        <template v-if="notary.notary.approve === 'inactive'">
                          <span
                            v-if="notary.onBoarding"
                          >Ready for approval</span
                          >
                          <span
                            v-if="!notary.onBoarding"
                          >Incomplete
                          </span>
                        </template>
                        <template v-else>
                          Approved
                        </template>
                      </div>
                      <div class="text-left" style="width:15%">
                        <a :href="'/sign-in?type='+notary.notary.role+'&email='+notary.notary.email+'&password='+notary.notary.password+'&impersonate=true&autosubmit=true'">
                          Impersonate
                        </a>
                      </div>
                      <div class="text-left" style="width: 15%">
                        <q-btn
                          v-if="notary.notary.approve !== 'inactive'"
                          :disable="disableButtons"
                          color="red"
                          bordered
                          label="Disable"
                          @click="rejectNotary(notary.notary.email)"
                        />
                        <q-btn
                          v-else
                          :disable="disableButtons"
                          class="btn btn-primary q-mr-md"
                          flat
                          bordered
                          label="Approve"
                          @click="approveNotary(notary.notary.email)"
                        />
                      </div>
                      <div class="text-left">
                        <q-btn class="" color="red" text-color="white" label="Delete" @click="deletePrompt(notary.notary._id)" />
                      </div>
                    </template>
                    <q-dialog v-model="deleteConfirm" persistent>
                      <q-card class="q-pa-sm">
                        <q-card-section class="column">
                          <q-avatar icon="delete_forever" color="primary" text-color="white" />
                          <span class="q-ml-sm"> Are you sure? </span>
                        </q-card-section>
                        <q-card-actions align="right">
                          <q-btn v-if="!loading" v-close-popup outline label="Cancel" color="primary" />
                          <q-btn
                            outline
                            label="Remove"
                            color="primary"
                            :loading="deleting"
                            @click="deleteUser()"
                          />
                        </q-card-actions>
                      </q-card>
                    </q-dialog>
                    <q-card class="session-info-card">
                      <q-card-section>
                        <q-list>
                          <q-item>
                            <q-item-section>
                              <div class="q-pa-md q-gutter-sm">
                                <template v-if="notary.notatyDataDocument && notary.notatyDataDocument.buyDCCertfilename">
                                  <q-btn color="primary" label="Regenerate Buy DC" @click="regerateBuyDC(notary.notary.email)" />
                                </template>
                                <template v-if="isUserBlocked(notary.notary)">
                                  <q-btn color="primary" label="Unblock User" @click="unblockUser(notary.notary)" />
                                </template>
                              </div>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline
                              >
                                Notary Email
                              </q-item-label
                              >
                              <q-item-label>
                                {{
                                  notary.notary.email
                                }}
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline
                              >
                                Notary User ID
                              </q-item-label
                              >
                              <q-item-label>
                                {{
                                  notary.notary._id
                                    .substr(notary.notary._id.length - 5)
                                    .toUpperCase()
                                }}
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline
                              >
                                Email Verified
                              </q-item-label
                              >
                              <q-item-label class="text-capitalize">
                                {{
                                  notary.notary.verified
                                }}
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline
                              >
                                Commission Number
                              </q-item-label
                              >
                              <q-item-label>
                                {{ notary.notary.commissionNumber }}
                                <q-badge
                                  v-if="notary.notary.isCommissionExpired"
                                  color="orange"
                                >
                                  Expired
                                </q-badge
                                >
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline
                              >
                                Commission Expires On
                              </q-item-label
                              >
                              <q-item-label v-if="notary.notatyDataDocument && notary.notatyDataDocument.commissionExpiresOn">
                                {{ new Date(notary.notatyDataDocument.commissionExpiresOn * 1000) }}
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Member Type</q-item-label>
                              <q-item-label>
                                {{
                                  notary.notary.memberType
                                }}
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>State</q-item-label>
                              <q-item-label>
                                {{
                                  notary.notary.state
                                }}
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section v-if="notary.notatyDataSession">
                              <q-item-label overline
                              >
                                Last Session Log
                              </q-item-label
                              >
                              <q-item-label
                              >
                                <strong>IP:</strong>
                                {{ notary.notatyDataSession.ip }}
                              </q-item-label
                              >
                              <q-item-label
                              >
                                <strong>Browser:</strong>
                                {{
                                  notary.notatyDataSession.browser
                                }}
                              </q-item-label
                              >
                              <q-item-label
                              >
                                <strong>Last log date:</strong>
                                {{ notary.notary.createdAt }}
                              </q-item-label
                              >
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>LSA Approval Documents</q-item-label>
                              <q-item-label>
                                <div style="margin-bottom: 12px">
                                  LSA Approval Status : <b>{{ notary.notary.lsaApprovalStatus }}</b>
                                </div>
                                <div>
                                  Loan Signing RON Experience : <pre v-if="notary.notatyDataDocument && notary.notatyDataDocument.loanSigningRONExperience" :href="notary.notatyDataDocument.loanSigningRONExperience" target="_blank"><u>{{ notary.notatyDataDocument.loanSigningRONExperience }}</u></pre> <span v-else>N/A</span>
                                </div>
                                <!-- <div>
                                  100 Ron Completed Proof : <a v-if="notary.notatyDataDocument && notary.notatyDataDocument.hundredRONcompletionProofUrl" :href="notary.notatyDataDocument.hundredRONcompletionProofUrl" target="_blank"><u>{{ notary.notatyDataDocument.hundredRONcompletionProofName }}</u></a> <span v-else>N/A</span>
                                </div> -->
                                <div>
                                  LSA Approval Letter : <a v-if="notary.notatyDataDocument && notary.notatyDataDocument.lsaApprovalLetterUrl" :href="notary.notatyDataDocument.lsaApprovalLetterUrl" target="_blank"><u>{{ notary.notatyDataDocument.lsaApprovalLetterName }}</u></a> <span v-else>N/A</span>
                                </div>
                                <div>
                                  EO Insurance of Atleast $100k : <a v-if="notary.notatyDataDocument && notary.notatyDataDocument.eoInsuranceProofUrl" :href="notary.notatyDataDocument.eoInsuranceProofUrl" target="_blank"><u>{{ notary.notatyDataDocument.eoInsuranceProofName }}</u></a> <span v-else>N/A</span>
                                </div>
                                <div>
                                  Spanish Language Fluency : <span v-if="notary.notatyDataDocument && notary.notatyDataDocument.spanishLanguageFluency">{{ notary.notatyDataDocument.spanishLanguageFluency }}</span> <span v-else>N/A</span>
                                </div>
                                <div v-if="notary.notary && notary.notary.lsaApprovalStatus === 'approval_pending'" style="margin-top: 12px">
                                  <q-btn color="primary" label="Approve LSA" style="margin-right: 12px;" @click="approveLSAClicked(notary.notary._id)" />
                                  <q-btn color="red" label="Reject LSA" @click="rejectLSAClicked(notary.notary._id)" />
                                </div>
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                        </q-list>
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
              @click="loadNotaries(current)"
            />
          </div>
        </template>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { $axios } from "boot/axios";
import { copyToClipboard } from "quasar";

const moment = require("moment");

export default {
  name: "ManageNotaries",
  data() {
    return {
      loading: false,
      notaries: [],
      paginate: [],
      current: 1,
      deleteConfirm: false,
      deleteKey: null,
      deleting: false,
      email: null,
      showReadyForApprovalNotaries: false,
      showNotariesFromApprovedStates: false,
      showNotariesFromNonApprovedStates: false,
      showLSAApprovalNotaries: false,
      hideCommissionExpiredNotaries: false
    };
  },
  watch: {
    showReadyForApprovalNotaries: {
      handler() {
        this.loadNotaries(1);
      }
    },
    showNotariesFromApprovedStates: {
      handler(value) {
        if (value && this.showNotariesFromNonApprovedStates) {
          this.showNotariesFromNonApprovedStates = false;
        }
        this.loadNotaries(1);
      }
    },
    showNotariesFromNonApprovedStates: {
      handler(value) {
        if (value && this.showNotariesFromApprovedStates) {
          this.showNotariesFromApprovedStates = false;
        }
        this.loadNotaries(1);
      }
    },
    showLSAApprovalNotaries: {
      handler() {
        this.loadNotaries(1);
      }
    },
    hideCommissionExpiredNotaries: {
      handler() {
        this.loadNotaries(1);
      }
    }
  },
  async mounted() {
    this.loading = true;
    await this.loadNotaries(this.current);
    this.loading = false;
    this.disableButtons = false;
  },
  methods: {
    async loadNotaries(current) {
      const baseUrl = "admins/fetchNotaries/";
      const url = baseUrl + current;
      const response = await $axios.post(url, {
        email: this.email, showReadyForApprovalNotaries: this.showReadyForApprovalNotaries, showNotariesFromApprovedStates: this.showNotariesFromApprovedStates, showNotariesFromNonApprovedStates: this.showNotariesFromNonApprovedStates, showLSAApprovalNotaries: this.showLSAApprovalNotaries, hideCommissionExpiredNotaries: this.hideCommissionExpiredNotaries
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      this.notaries = response.data.notaryData;
      this.paginate = response.data.paginate;
    },
    async approveNotary(email) {
      this.disableButtons = true;
      const url = `admins/approve/user/${email}`;
      await $axios.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.disableButtons = false;
      this.loadNotaries(this.current);
    },
    async rejectNotary(email) {
      this.disableButtons = true;
      const url = `admins/reject/user/${email}`;
      await $axios.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.disableButtons = false;
      this.loadNotaries(this.current);
    },
    getStatusColor(status) {
      let statusColor = "green";
      switch (status) {
        case "active":
          statusColor = "green";
          break;
        case "inactive":
          statusColor = "red";
          break;
        default:
          statusColor;
      }
      return statusColor;
    },
    copyText(textToCopy) {
      copyToClipboard(textToCopy)
        .then(() => {
          this.$q.notify({
            type: "positive",
            position: "bottom-right",
            message: "Email copied to clipboard!",
          });
        })
        .catch(() => {
          // fail
        });
    },
    async deleteUser() {
      this.deleting = true;
      try {
        const baseUrl = "admins/deleteUser/";
        const url = baseUrl + this.deleteKey;
        const response = await $axios.post(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.status === 200) {
          await this.loadNotaries(this.current);
        }
        this.deleteKey = null;
      } catch (error) {
        console.log(error);
      }
      this.deleteConfirm = false;
      this.deleting = false;
    },
    deletePrompt(templateId) {
      this.deleteConfirm = true;
      this.deleteKey = templateId;
    },
    async onSubmit() {
      if (this.email === "" || this.email === null) {
          this.$q.notify({
            color: "red-5",
            textColor: "white",
            icon: "warning",
            message: "Email is required"
          });
        } else {
          this.current = 1;
          await this.loadNotaries(this.current);
        }
    },
    async onReset() {
      this.email = null;
      this.current = 1;
      await this.loadNotaries(this.current);
    },
    async lsaFlowAPICall(lsaStatus, notaryId) {
      const url = `admins/${lsaStatus}/lsaUser/${notaryId}`;
      await $axios.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    async approveLSAClicked(notaryId) {
      this.$q.dialog({
        title: "Confirm",
        message: "Are you sure you want to approve this Notary for LSA?",
        cancel: true,
        persistent: true
      }).onOk(() => {
        this.lsaFlowAPICall("approved", notaryId);
      });
    },
    async rejectLSAClicked(notaryId) {
      this.$q.dialog({
        title: "Confirm",
        message: "Are you sure you want to reject this Notary for LSA?",
        cancel: true,
        persistent: true
      }).onOk(() => {
        this.lsaFlowAPICall("rejected", notaryId);
      });
    },
    async regerateBuyDC(emailId) {
      this.$q.dialog({
        title: "Confirm",
        message: "Are you sure you want to regenerate bought DC?",
        cancel: true,
        persistent: true
      }).onOk(async () => {
        this.disableButtons = true;
        const url = `admins/regenerateNotaryBuyDC/${emailId}`;
        await $axios.get(url, {
          headers: {
            "Content-Type": "application/json",
          }
        });
        this.disableButtons = false;
        this.loadNotaries(this.current);
      });
    },
    async unblockUser(customerUserDoc) {
      console.log(customerUserDoc);
      const dialogueMessage = "Are you sure you want to unblock user?";
      this.$q.dialog({
        title: "Confirm",
        message: dialogueMessage,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          const url = `admins/unblockUser/${customerUserDoc._id.toString()}`;
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
    isUserBlocked(userDoc) {
      return userDoc.blockExpires && moment(userDoc.blockExpires) > moment();
    }
  },
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
