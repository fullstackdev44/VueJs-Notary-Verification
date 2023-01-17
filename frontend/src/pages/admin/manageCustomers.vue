<template>
  <q-layout>
    <q-page-container class="container">
      <q-page class="q-py-lg">
        <div class="flex justify-between q-py-md items-center">
          <h1 class="">
            Manage Customers
          </h1>
        </div>
        <template v-if="loading">
          <div class="renderer">
            <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
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
        <template v-if="customers && customers.length === 0">
          No Customer found
        </template>
        <template v-if="customers && customers.length">
          <div class="q-table__card sessions-info">
            <div v-for="(cust, key) of customers" :key="key">
              <div class="row " style="width:100%">
                <q-list class="rounded-borders" style="width:100%">
                  <q-expansion-item
                    expand-icon-toggle
                    switch-toggle-side
                  >
                    <template v-slot:header>
                      <div class="row " style="width:100%;align-items: flex-start;">
                        <div class="text-left col-md-2 col-sm-4 col-12">
                          {{ cust.cust.hearaboutdata }}
                          <q-badge v-if="cust.cust.memberType !== 'free'" outline color="red">{{ cust.cust.memberType }}</q-badge>
                          <q-badge v-if="isUserBlocked(cust.cust)" color="red">Blocked</q-badge>
                        </div>
                        <!-- <div class="text-left col-md-2 col-sm-4 col-12">{{ cust.cust._id.substr(cust.cust._id.length - 5).toUpperCase() }}</div> -->
                        <div class="text-left col-md-3 col-sm-4 col-12">
                          <div class="d-flex align-items-center">
                            <div class="link-wrap">
                              {{ cust.cust.email }}
                            </div>
                            <q-icon name="content_copy" color="primary" size="15px" class="ml-2" @click="copyText(cust.cust.email)" />
                          </div>
                          <q-tooltip :delay="200">
                            Click to copy the email
                          </q-tooltip>
                        </div>
                        <div class="text-left col-md-2 col-sm-4 col-12">
                          <a :href="'/sign-in?type='+cust.cust.role+'&email='+cust.cust.email+'&password='+cust.cust.password+'&impersonate=true&autosubmit=true'">
                            Impersonate
                          </a>
                        </div>
                        <div class=" col-md-2 col-sm-4 col-6 text-right res-left" />
                        <div class=" col-md-2 col-sm-4 col-6 text-right res-left">
                          <q-btn class="" color="red" text-color="white" label="Delete" @click="deletePrompt(cust.cust._id)" />
                        </div>
                      </div>
                      <!-- <div class="text-left" style="width:30%">
                      </div> -->
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
                              <template v-if="cust.cust.turnOffInviteSigner">
                                <q-btn color="primary" label="Turn on Invite Signer for 1 more session" @click="turnOnInviteSigner(cust.cust)" />
                              </template>
                              <template v-if="isUserBlocked(cust.cust)">
                                <q-btn color="primary" label="Unblock User" @click="unblockUser(cust.cust)" />
                              </template>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Id</q-item-label>
                              <q-item-label>{{ cust.cust._id }}</q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Name</q-item-label>
                              <q-item-label>{{ cust.cust.name }}</q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Email</q-item-label>
                              <q-item-label class="text-capitalize">{{ cust.cust.email }}</q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Email Verified</q-item-label>
                              <q-item-label class="text-capitalize">{{ cust.cust.verified }}</q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Member Type</q-item-label>
                              <q-item-label>{{ cust.cust.memberType }}</q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>State</q-item-label>
                              <q-item-label>{{ cust.cust.state }}</q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Registered On</q-item-label>
                              <q-item-label>{{ formatDate(cust.cust.createdAt) }}</q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <!-- <q-item-section v-if="notary.notatyDataSession">
                              <q-item-label overline>Last Session Log</q-item-label>
                              <q-item-label><strong>IP:</strong> {{ notary.notatyDataSession.ip }}</q-item-label>
                              <q-item-label><strong>Browser:</strong> {{ notary.notatyDataSession.browser }}</q-item-label>
                              <q-item-label><strong>Last log date:</strong> {{ cust.createdAt }}</q-item-label>
                            </q-item-section> -->
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
        </template>
        <div v-if="paginate" class="q-pa-lg flex flex-center">
          <q-pagination
            v-model="current"
            :max="paginate.totalPages"
            :max-pages="6"
            direction-links
            boundary-links
            @click="loadCustomers(current)"
          />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { $axios } from "boot/axios";
import { copyToClipboard } from "quasar";

const moment = require("moment");

export default {
  name: "ManageCustomers",
  data() {
    return {
      loading: false,
      customers: [],
      paginate: [],
      current: 1,
      deleteConfirm: false,
      deleteKey: null,
      deleting: false,
      email: null
    };
  },
  async mounted () {
    this.loading = true;
    await this.loadCustomers(this.current);
    this.loading = false;
    this.disableButtons = false;
  },
  methods: {
    async loadCustomers(current) {
      const baseUrl = "admins/fetchCustomers/";
      const url = baseUrl + current;
      const response = await $axios.post(url, { email: this.email }, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.customers = response.data.customersData;
      this.paginate = response.data.paginate;
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
    formatDate(rawDate) {
      return `${moment(rawDate).format("YYYY-MM-DD")}`;
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
          await this.loadCustomers(this.current);
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
        await this.loadCustomers(this.current);
      }
    },
    async onReset() {
      this.email = null;
      this.current = 1;
      await this.loadCustomers(this.current);
    },
    async turnOnInviteSigner(customerUserDoc) {
      console.log(customerUserDoc);
      const dialogueMessage = "Are you sure you want to enable Invite Signer button for this one time user?";
      this.$q.dialog({
        title: "Confirm",
        message: dialogueMessage,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          const url = `admins/turnOnInviteSigner/${customerUserDoc._id.toString()}`;
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
