<template>
  <q-page class="q-pa-md flex-center session-container">
    <div class="row">
      <div class="col-12 col-md-12">
        <session-header :session-id="sessionid" />
      </div>
      <div class="col-12 col-md-12 q-pa-lg workflow-container">
        <session-input-header v-if="!calledFromBusinessPage && !calledFromSessionPage" current-stage="personal_info" :hide-payments-tab="hidePaymentsTab" />
        <div class="row" style="display: block">
          <div class="col-12 col-md-8 flex q-mt-lg" style="display: block">
            <div class="flex column">
              <h5 v-if="!skipCustomerKBACheck">Verify Your Identity</h5>
              <h5 v-else>Provide Personal Details</h5>
              <p v-if="!skipCustomerKBACheck" class="q-mb-md">
                We need some personal information in order to verify your
                identity.
              </p>
              <div class="">
                <div class="q-gutter-sm q-pb-lg row">
                  <div class="col-lg-5 col-sm-5 col-12">
                    <q-input
                      v-model="firstName"
                      class="col"
                      outlined
                      hint="First Name"
                      :dense="dense"
                    />
                  </div>
                  <div class="col-lg-5 col-sm-5 col-12">
                    <q-input
                      v-model="middelName"
                      class="col"
                      outlined
                      hint="Middle Name"
                      :dense="dense"
                    />
                  </div>
                </div>
                <div class="q-gutter-sm q-pb-lg row">
                  <div class="col-lg-5 col-sm-5 col-12">
                    <q-input
                      v-model="lastName"
                      class="col"
                      outlined
                      hint="Last Name"
                      :dense="dense"
                    />
                  </div>
                  <div class="c-width-wrapper">
                    <template>
                      <q-input
                        v-if="!skipCustomerKBACheck && typeOfKBA !== 'foreigners_without_residential'"
                        v-model="date"
                        outlined
                        placeholder="year/mth/day"
                        hint="Date of Birth"
                        mask="date"
                        :rules="['date']"
                        class="col"
                      >
                        <q-popup-proxy
                          ref="qDateProxy"
                          cover
                          transition-hide="scale"
                          transition-show="scale"
                        >
                          <q-date v-model="date">
                            <div class="row items-center justify-end">
                              <q-btn
                                v-close-popup
                                label="Close"
                                color="primary"
                                flat
                              />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-input>
                    </template>
                  </div>
                </div>
                <div v-if="!skipCustomerKBACheck && typeOfKBA !== 'foreigners_without_residential'" class="q-gutter-sm q-pb-lg row">
                  <q-input readonly standout class="col-4 col-md-2" label="X X X" />
                  <q-input readonly standout class="col-3 col-md-1" label="X X" />
                  <q-input
                    v-model="userSsn"
                    pattern="[0-9]{4}"
                    maxlength="4"
                    onkeypress="return event.charCode >= 48 && event.charCode <= 57"
                    type="text"
                    :rules="[ val => (val.length >= 4 || skipCustomerKBACheck || typeOfKBA === 'foreigners_with_residential' || typeOfKBA === 'foreigners_without_residential') || 'SSN number should be 4 digits.', val => (val.length <= 4 || skipCustomerKBACheck || typeOfKBA === 'foreigners_with_residential' || typeOfKBA === 'foreigners_without_residential') || 'SSN number should not be more than 4 digits.' ]"
                    class="col-3 col-md-2"
                    outlined
                    hint="Last 4 of SSN"
                    placeholder="_ _ _ _"
                    :dense="dense"
                  />
                  <div class="offset-md-1 flex flex-center">
                    <div>
                      <small v-if="typeOfKBA === 'foreigners_with_residential' || typeOfKBA === 'foreigners_without_residential'"><u>Optional</u></small> <br />
                      <small><u>Why do we need this?</u></small>
                      <q-tooltip :offset="[0, 10]">
                        <span style="font-size: 1rem">
                          We're required by state law to verify your identity
                          using your partial SSN.
                        </span>
                      </q-tooltip>
                    </div>
                  </div>
                </div>
                <div v-if="typeOfKBA === 'foreigners_without_residential'" class="q-pt-lg">
                  <q-select
                    v-model="userCountry"
                    :options="countries"
                    class="col-md-4 col-6"
                    outlined
                    hint="Country"
                    :dense="dense"
                  />
                </div>
                <div class="q-pt-lg">
                  <h5 class="">Residential Address</h5>
                  <p class="q-mb-md">
                    If you changed your residential address less than 30 days
                    ago, please enter your previous address.
                  </p>
                  <div class="row q-gutter-sm">
                    <q-input
                      v-model="addressLine1"
                      class="col-12 col-md-9"
                      outlined
                      hint="Address Line 1"
                      :dense="dense"
                    />
                    <!-- <q-input
                      v-model="addressLine2"
                      class="col-md-4 col-12"
                      outlined
                      hint="Address Line 2"
                      :dense="dense"
                    /> -->
                    <q-select
                      v-if="userCountry === 'United States' || typeOfKBA !== 'foreigners_without_residential'"
                      v-model="userState"
                      :options="states"
                      class="col-md-4 col-6"
                      outlined
                      hint="State"
                      :dense="dense"
                    />
                    <q-input
                      v-else
                      v-model="userState"
                      class="col-md-4 col-6"
                      outlined
                      hint="State"
                      :dense="dense"
                    />
                    <q-input
                      v-model="userZipCode"
                      class="col-md-3 col-5"
                      outlined
                      hint="Zip Code"
                      :dense="dense"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="!skipCustomerKBACheck" class="col-12 col-md-4 flex mobile-hide">
            <q-card
              class="my-card"
              flat
              bordered
              style="background: none; border: none"
            >
              <q-card-section>
                <div class="text-overline text-orange-9">
                  Identity Verification
                </div>
                <div class="text-h5 q-mt-sm q-mb-md">
                  Secure ID Verify Process
                </div>
                <div class="text-caption">
                  <p>
                    State laws require strict identity verification to service
                    online notarizations. We use sophisticated and secure tech to make this
                    process as smooth as possible. Your personal information is
                    never stored or recorded.
                  </p><p v-if="typeOfKBA !== 'foreigners_without_residential'">We will ask you <strong>5 personal questions</strong> and require a <strong>photo ID</strong>.</p>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
      <!-- next btn -->
      <q-btn
        class="next-btn q-my-xl"
        style="margin-top: 16px"
        :loading="nextButtonLoading"
        label="Next"
        color="primary"
        @click="nextButtonClick()"
      />
    </div>
    <q-dialog v-model="failedConsumer" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Failed</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Your Identity verification failed. Unfortunately, we cannot continue your session.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn outline label="OKAY" color="primary" @click="failSession()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";
import states from "@/data/states.json";
import $ from "jquery";
import countries from "@/data/countries.json";
import SessionHeader from "../../components/SessionHeader.vue";
import SessionInputHeader from "./SessionInputHeader.vue";

export default {
  name: "PersonalDetails",
  components: { SessionHeader, SessionInputHeader },
  props: {
    calledFromBusinessPage: {
      type: Boolean,
      default: false
    },
    calledFromBusinessPageSessionId: {
      type: String,
      default: ""
    },
    calledFromSessionPage: {
      type: Boolean,
      default: false
    },
    calledFromSessionPageSessionId: {
      type: String,
      default: ""
    },
    kbaModalChangeSection: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      states,
      sessionid: "",
      typeOfKBA: "",
      skipCustomerKBACheck: false,
      performInSessionKBA: false,
      sessionChargeOnBusinessUser: false,
      currentSessionAdditionalSigner: false,
      nextButtonLoading: false,
      failedConsumer: false,
      hidePaymentsTab: false,
      userCountry: "",
      countries
    };
  },
  watch: {
  },
  async mounted () {
    this.sessionid = (this.$route.params && this.$route.params.id) || false;
    if (this.calledFromBusinessPageSessionId) {
      this.sessionid = this.calledFromBusinessPageSessionId;
    }
    this.currentSession = this.$q.localStorage.getItem("sessionData");
    // this.hidePaymentsTab = this?.$vendorDoc?.skipSessionCharges || false;
    if (!this.calledFromBusinessPage && !this.calledFromSessionPage) {
      if (!this.currentSession) {
        if (this.$user.testingacc && this.$user.testingacc === true) {
          this.$router.replace(`/business/personal_info/${this.sessionid}/?demo=true`).catch(() => {});
        } else {
          this.$router.replace(`/business/personal_info/${this.sessionid}`).catch(() => {});
        }
      } else if (this.$route.query.demo && this.$route.query.demo === "true") {
        this.$router.replace(`/business/personal_info/${this.sessionid}/?demo=true`).catch(() => {});
      } else if (this.$user.testingacc && this.$user.testingacc === true) {
        this.$router.replace(`/business/personal_info/${this.sessionid}/?demo=true`).catch(() => {});
      } else {
        this.$router.replace(`/business/personal_info/${this.sessionid}`).catch(() => {});
      }
    }
    const res = await this.loadPersonalData(this.sessionid, this.calledFromBusinessPage, this.calledFromSessionPage);
    console.log("res", res);
    this.hidePaymentsTab = this?.$vendorDoc?.skipSessionCharges || res?.vendorDoc?.skipSessionCharges || res?.sessionDoc?.sessionChargeOnBusinessUser || this.$user.skipSessionCharges || false;
    if (res && res.sessionDoc) {
      this.typeOfKBA = res.sessionDoc.typeOfKBA || "";
      this.skipCustomerKBACheck = res.sessionDoc.skipCustomerKBACheck || false;
      this.performInSessionKBA = res.sessionDoc.performInSessionKBA || false;
      this.sessionChargeOnBusinessUser = res.sessionDoc.sessionChargeOnBusinessUser || false;
    }
    if (res && res.additionalSigner) {
      this.currentSessionAdditionalSigner = res.additionalSigner;
    }
    if (res && res.firstName) {
      this.firstName = res.firstName;
      this.middelName = res.middelName;
      this.lastName = res.lastName;
      this.userSsn = res.userSsn;
      this.userZipCode = res.userZipCode;
      this.userState = res.userState;
      this.addressLine1 = res.addressLine1;
      this.addressLine2 = res.addressLine2;
      this.userCountry = res.userCountry;
      this.date = res.birthdate;
    }
    // if ((this.$route.query.demo && this.$route.query.demo === "true") || this.calledFromBusinessPage) {
    if ((this.$route.query.demo && this.$route.query.demo === "true") || (this.$user.testingacc)) {
      console.log("this.$route.query.demo1 ", this.$route.query.demo);
      this.addressLine1 = "13584 ST RD 62";
      this.userZipCode = "47537";
      this.firstName = "Michael";
      this.middelName = "William";
      this.lastName = "Lindquist";
      this.userSsn = "2222";
      this.userState = "California";
      // this.addressLine2 = "Lincoln Park";
      this.date = "1980/04/19";
    }
    console.log("loadPersonalData ", res);
    if (!this.userCountry) {
      this.userCountry = "United States";
    }
    if (this.typeOfKBA === "foreigners_without_residential") {
      $.get("http://ip-api.com/json", (response) => {
        console.log(response.country);
        if (countries.includes(response.country)) {
          this.userCountry = response.country;
        }
      }, "jsonp");
    }
  },
  setup () {
    const loading = ref(false);
    const expanded = ref(false);
    const firstName = ref("");
    const middelName = ref("");
    const lastName = ref("");
    const userSsn = ref("");
    const userZipCode = ref("");
    const userState = ref("");
    const dense = ref(false);
    const addressLine1 = ref("");
    const addressLine2 = ref("");
    const currentSession = ref(null);
    const date = ref("");
    const savePersonalData = async (seesion, data, calledFromBusinessPage, calledFromSessionPage) => {
      try {
        console.log("calledFromSessionPage", calledFromSessionPage);
        const url = "session/personalData";
        const messageToSend = {
          data,
          sessionId: seesion
        };
        if (calledFromBusinessPage) {
          messageToSend.additionalSigner = calledFromBusinessPage;
        }
        // if (calledFromSessionPage) {
        //   messageToSend.additionalSigner = calledFromSessionPage;
        // }
        const response = await $axios.post(url, messageToSend, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const loadPersonalData = async (sessionId, calledFromBusinessPage, calledFromSessionPage) => {
      try {
        console.log("calledFromSessionPage", calledFromSessionPage);
        const url = "session/load/personalData";
        const messageToSend = {
          sessionId
        };
        if (calledFromBusinessPage) {
          messageToSend.additionalSigner = calledFromBusinessPage;
        }
        const response = await $axios.post(url, messageToSend, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    return {
      loading,
      expanded,
      firstName,
      middelName,
      lastName,
      userSsn,
      userZipCode,
      userState,
      dense,
      addressLine1,
      addressLine2,
      savePersonalData,
      loadPersonalData,
      currentSession,
      date,
    };
  },
  methods: {
    failSession () {
      this.$router.replace("/business/");
    },
    async nextButtonClick () {
      this.savePersonalDetails();
    },
    async savePersonalDetails () {
      console.log("in save personal details");
      console.log("this.typeOfKBA", this.typeOfKBA);
      if (!this.firstName) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please enter your first name.",
        });
      }
      if (!this.lastName) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please enter your last name.",
        });
      }
      if (!this.userState) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please select your state.",
        });
      }
      if (!this.userCountry) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please select your country.",
        });
      }
      if (!this.addressLine1) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please enter your address.",
        });
      }
      if (!this.userSsn && !this.skipCustomerKBACheck && this.typeOfKBA !== "foreigners_with_residential" && this.typeOfKBA !== "foreigners_without_residential") {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please enter your Last 4 digits of your SSN.",
        });
      }

      if (this.userSsn && this.userSsn.length !== 4 && !this.skipCustomerKBACheck && this.typeOfKBA !== "foreigners_with_residential" && this.typeOfKBA !== "foreigners_without_residential") {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "SSN Number should be 4 digits.",
        });
      }
      if (!this.userZipCode) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please enter your zip code.",
        });
      }
      if (!this.date && !this.skipCustomerKBACheck && this.typeOfKBA !== "foreigners_without_residential") {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please select your birth date.",
        });
      }
      this.currentSession = this.$q.localStorage.getItem("sessionData");
      if (!this.currentSession && !this.calledFromBusinessPage && !this.calledFromSessionPage) {
        this.$router.replace(`/business/personal_info/${this.sessionid}`).catch(() => {});
      }
      const data = {
        firstName: this.firstName,
        middelName: this.middelName,
        lastName: this.lastName,
        userSsn: this.userSsn,
        userZipCode: this.userZipCode,
        userState: this.userState,
        userCountry: this.userCountry,
        addressLine1: this.addressLine1,
        addressLine2: this.addressLine2,
        birthdate: this.date
      };
      const res = await this.savePersonalData(this.sessionid, data, this.calledFromSessionPage);
      console.log("res ", res);

      if (this.typeOfKBA !== "foreigners_without_residential" && !this.skipCustomerKBACheck) {
        let demo = (this.$route.query.demo && this.$route.query.demo === "true") || false;
        if ((this.calledFromBusinessPage || this.calledFromSessionPage) && this.$user.testingacc) {
          demo = true;
        }
        let consumerPlusUrl = `session/getConsumerPlusApiResponse/${this.sessionid}`;
        if (this.calledFromBusinessPage || this.calledFromSessionPage) {
          if (demo && demo === true) {
            consumerPlusUrl += "/?demo=true";
            consumerPlusUrl += "&calledFromBusinessPage=true";
          } else {
            consumerPlusUrl += "/?calledFromBusinessPage=true";
          }
        } else if (demo && demo === true) {
            consumerPlusUrl += "/?demo=true";
          }
        this.nextButtonLoading = true;
        const consumerPlusResponse = await $axios.get(consumerPlusUrl, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        this.nextButtonLoading = false;
        console.log("consumerPlusResponse", consumerPlusResponse);
        if (consumerPlusResponse && consumerPlusResponse.data && consumerPlusResponse.data.output === "Fail") {
          if (this.calledFromBusinessPage || this.calledFromSessionPage) {
            this.kbaModalChangeSection("failed", "Your Data verification failed. Unfortunately, we cannot continue your session.");
          } else {
            const sessionUrl2 = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=identity_check_stage_fail`;
            await $axios.get(sessionUrl2, {
              headers: {
                "Content-Type": "application/json",
              },
            });
            this.failedConsumer = true;
            return "";
          }
        }
      }
      // return "";
      // kbaModalChangeSection

      if (res && !(this.calledFromBusinessPage || this.calledFromSessionPage)) {
        let nextStage = "kba_check_stage";
        if (this.typeOfKBA === "foreigners_without_residential") {
          nextStage = "photoid_check_stage";
        }
        if (this.skipCustomerKBACheck || this.performInSessionKBA) {
          nextStage = "payment_info_stage";
          if (this.sessionChargeOnBusinessUser || this.hidePaymentsTab) {
            nextStage = "meet_notary_stage";
          }
        }
        const url = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=${nextStage}`;
        await $axios.get(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        // let localTempStage = "photoid";
        let localTempStage = "kba";
        if (this.typeOfKBA === "foreigners_without_residential") {
          localTempStage = "photoid";
        }
        if (this.skipCustomerKBACheck || this.performInSessionKBA) {
          localTempStage = "payment_info";
          if (this.sessionChargeOnBusinessUser || this.hidePaymentsTab) {
            localTempStage = "meet_notary";
            const paymentInfoUrl = `session/saveSessionData/${this.sessionid}`;
            const dataToSave = {
              paymentInfoCaptured: true
            };
            await $axios.post(paymentInfoUrl, {
              data: dataToSave
            });
          }
        }
        console.log("localTempStage", localTempStage);
        if (this.$route.query.demo && this.$route.query.demo === "true") {
          this.$router.replace(`/business/${localTempStage}/${this.sessionid}/?demo=true`).catch(() => {});
        } else if (this.$user.testingacc && this.$user.testingacc === true) {
          this.$router.replace(`/business/${localTempStage}/${this.sessionid}/?demo=true`).catch(() => {});
        } else {
          this.$router.replace(`/business/${localTempStage}/${this.sessionid}`).catch(() => {});
        }

        // const url = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=kba_check_stage`;
        // await $axios.get(url, {
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        // });
        // if (this.$route.query.demo && this.$route.query.demo === "true") {
        //   this.$router.replace(`/business/kba/${this.sessionid}/?demo=true`).catch(() => {});
        // } else if (this.$user.testingacc && this.$user.testingacc === true) {
        //   this.$router.replace(`/business/kba/${this.sessionid}/?demo=true`).catch(() => {});
        // } else {
        //   this.$router.replace(`/business/kba/${this.sessionid}`).catch(() => {});
        // }

        // const sessionSaveUrl = `session/saveSessionData/${this.sessionid}`;
        // const dataToSave = {
        //   // sessionOpenCallForTaking: true
        // };
        // await $axios.post(sessionSaveUrl, {
        //   data: dataToSave
        // });
      }
      if (this.calledFromBusinessPage || this.calledFromSessionPage) {
        let tempNextStage = "kba_check_stage";
        if (!this.skipCustomerKBACheck || (this.calledFromSessionPage && this.performInSessionKBA)) {
          if (this.typeOfKBA === "foreigners_without_residential") {
            this.kbaModalChangeSection("photoid");
          } else {
            this.kbaModalChangeSection("kba");
          }
        } else {
          tempNextStage = "meet_notary";
          this.kbaModalChangeSection("meet_notary");
        }
        const sessionUrl = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=${tempNextStage}&additionalSigner=true`;
        await $axios.get(sessionUrl, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      return "";
    },
  },
};
</script>
