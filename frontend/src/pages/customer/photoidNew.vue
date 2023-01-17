<template>
  <q-page class="q-pa-md flex-center session-container">
    <div class="row">
      <div class="col-12 col-md-12">
        <session-header :session-id="sessionid" />
      </div>
      <div class="col-12 col-md-12 q-pa-lg workflow-container">
        <session-input-header v-if="!calledFromBusinessPage && !calledFromSessionPage" current-stage="personal_info" :hide-payments-tab="hidePaymentsTab" />
        <div class="row">
          <div class="col-12 col-md-8">
            <div class="flex column">
              <h5>Verify Your Identity</h5>
              <p class="q-mb-md">
                We need some personal information in order to verify your
                identity.
              </p>
              <q-btn
                v-if="nextButtonDisabled"
                :loading="enablePhotoIdButtonLoading"
                class="next-btn q-mt-md q-mb-xl"
                label="Start PhotoId Verification"
                color="primary"
                @click="photoIdButtonClicked()"
              />
              <div v-if="!nextButtonDisabled">Your PhotoId Verification is Successful</div>
            </div>
          </div>
        </div>
      </div>
      <!-- next btn -->
      <q-btn
        v-if="!nextButtonDisabled"
        class="next-btn q-mt-md q-mb-xl"
        label="Next"
        color="primary"
        :loading="nextButtonLoading"
        @click="nextButtonClick()"
      />
      <br />
    </div>
    <q-dialog v-model="failed" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Failed</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Your Photo ID verification failed. Unfortunately, we cannot continue your session.
          <div class="columns is-multiline" style="margin-top: 20px">
            <div class="column is-5">Document Verification Result</div>
            <div class="column is-7" style="font-weight: bold">Failed</div>
            <div class="column is-5">Document Expiration Result</div>
            <div class="column is-7" style="font-weight: bold">Failed</div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn outline label="OKAY" color="primary" @click="failSession()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
    <q-dialog v-model="updatePasswordModal" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Update Account Password</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <h3 v-if="!updatePasswordEmailModal">
            Please Update Your Account Password to Secure Your Account and Proceed with Session
          </h3>
          <h3 v-else>
            Please Update Your Account Email and Password to Secure Your Account and Proceed with Session
          </h3>
          <div class="row q-py-md">
            <div v-if="updatePasswordEmailModal" class="col-md-4 col-xs-12 q-pr-sm">
              <q-input
                v-model="$v.model.email.$model"
                outlined
                type="email"
                hint="Email"
                :error-message="errorMessage($v.model.email, 'Email')"
                :error="!!errorMessage($v.model.email)"
              />
            </div>
            <div class="col-md-4 col-xs-12 q-pr-sm">
              <q-input
                v-model="$v.model.password.$model"
                outlined
                type="password"
                hint="New Password"
                :error-message="errorMessage($v.model.password, 'New Password')"
                :error="!!errorMessage($v.model.password)"
              />
            </div>
            <div class="col-md-4 col-xs-12 q-pr-sm">
              <q-input
                v-model="$v.model.confirmPassword.$model"
                outlined
                type="password"
                hint="Repeat New Password"
                :error-message="errorMessage($v.model.confirmPassword, 'Repeat Password')"
                :error="!!errorMessage($v.model.confirmPassword)"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn outline label="Save Password" color="primary" @click="updatePassword()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="showBackPhotoIdErrorModal">
      <q-card>
        <q-card-section>
          <div class="text-h6">We found an issue with your image</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Back ID image is likely too blurry or too dark. Please take a clearer image of your ID and reupload image.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn outline label="OKAY" color="primary" @click="closePhotoIdErrorModal()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>

import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";
import {
  required, minLength, sameAs, email
} from "vuelidate/lib/validators";
import states from "@/data/states.json";
// import __ from "lodash";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";
import SessionInputHeader from "./SessionInputHeader.vue";
import SessionHeader from "../../components/SessionHeader.vue";

export const emailFormatter = (value) => {
  if (!value) return value;
  return value.toLowerCase();
};

const Persona = require("persona");

export default {
  name: "PhotoidNew",
  components: { SessionHeader, SessionInputHeader },
  mixins: [VuelidateHelperMixin],
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
      evsResult: {},
      backPhotoIdDecodeStatus: "pending",
      showBackPhotoIdErrorModal: false,
      photoIdCaptureMethod: "upload_manual",
      photoIdBackVerified: false,
      photoIdTimedOut: false,
      photoIdCaptureInterval: false,
      backIdFile: false,
      frontIdFile: false,
      updatePasswordModal: false,
      updatePasswordEmailModal: false,
      model: {
        email: "",
        password: "",
        confirmPassword: ""
      },
      typeOfKBA: "",
      sessionChargeOnBusinessUser: "",
      typeOfPhotoId: "drivinglicense",
      validatingPhotoidResponseModal: false,
      validatingPhotoidInterval: false,
      nextButtonLoading: false,
      evsBiometricsPassbook: false,
      biometricsImageAdded: false,
      nextButtonDisabled: true,
      biometricsVideoOn: false,
      biometricsVideoError: false,
      biometricsSaveLoading: false,
      enablePhotoIdButtonLoading: false,
      personaOutputData: {
        inquiryId: "",
        status: "",
        fields: "",
      },
      hidePaymentsTab: false,
      personaClientDoc: false,
      sessionDoc: {}
    };
  },
  validations: {
    model: {
      email: { email: (val) => email(emailFormatter(val)), },
      password: { required, minLength: minLength(6) },
      confirmPassword: { required, sameAsPassword: sameAs("password") }
    }
  },
  async mounted () {
    this.updatePasswordModal = this.$user.needToUpdatePasswordInSession || false;
    this.updatePasswordEmailModal = this.$user.needToUpdateEmailInSession || false;
    // this.hidePaymentsTab = this?.$vendorDoc?.skipSessionCharges || false;
    this.sessionid = (this.$route.params && this.$route.params.id) || false;
    if (this.calledFromBusinessPageSessionId) {
      this.sessionid = this.calledFromBusinessPageSessionId;
    }
    if (this.calledFromSessionPageSessionId) {
      this.sessionid = this.calledFromSessionPageSessionId;
    }
    this.currentSession = this.$q.localStorage.getItem("sessionData");
    if (!this.currentSession && !(this.calledFromBusinessPage || this.calledFromSessionPage)) {
      if (this.$user.testingacc && this.$user.testingacc === true) {
        this.$router.replace(`/business/personal_info/${this.sessionid}/?demo=true`).catch(() => {});
      } else {
        this.$router.replace(`/business/personal_info/${this.sessionid}`).catch(() => {});
      }
    }

    const res = await this.loadPersonalData(this.sessionid);
    this.hidePaymentsTab = res?.$vendorDoc?.skipSessionCharges || res?.vendorDoc?.skipSessionCharges || res?.sessionDoc?.sessionChargeOnBusinessUser || this.$user.skipSessionCharges || false;
    if (res?.failedByRefresh && !(this.calledFromBusinessPage || this.calledFromSessionPage)) {
      this.$q.notify({
        color: "danger",
        position: "bottom-right",
        message: "You aborted workflow. Going back to Prepare Doc Stage",
      });
      if (this.$route.query.demo && this.$route.query.demo === "true") {
        this.$router.replace(`/business/prepare_doc/${this.sessionid}/?demo=true`).catch(() => {});
      } else if (this.$user.testingacc && this.$user.testingacc === true) {
        this.$router.replace(`/business/prepare_doc/${this.sessionid}/?demo=true`).catch(() => {});
      } else {
        this.$router.replace(`/business/prepare_doc/${this.sessionid}`).catch(() => {});
      }
    }
    if (res) {
      if (res && res.sessionDoc) {
        this.sessionDoc = res.sessionDoc;
        this.typeOfKBA = res.sessionDoc.typeOfKBA || "";
        this.sessionChargeOnBusinessUser = res.sessionDoc.sessionChargeOnBusinessUser || "";
      }
      this.frontPhoto = (res && res.frontPhotoIdUrl) ? res.frontPhotoIdUrl : "";
      this.backPhoto = (res && res.backPhotoIdUrl) ? res.backPhotoIdUrl : "";
      this.typeOfPhotoId = (res && res.typeOfPhotoId) ? res.typeOfPhotoId : "drivinglicense";
      console.log("loadPersonalData ", res);
      if (this.typeOfKBA === "foreigners_with_residential" || this.typeOfKBA === "foreigners_without_residential") {
        this.typeOfPhotoId = "passportbook";
      }
      if (this.typeOfKBA === "foreigners_without_residential") {
        this.nextButtonDisabled = true;
      }
    }
    if (!this.updatePasswordModal) {
      this.photoIdButtonClicked();
    }
    // window.onbeforeunload = () => "";
    // window.removeEventListener("beforeunload", () => {});
    // window.addEventListener("beforeunload", () => {
    //   if (window.onbeforeunload) {
    //     this.$q.notify({
    //       color: "red",
    //       position: "bottom-right",
    //       message: "Session marked as failed",
    //     });
    //     let extraParams = "";
    //     if (this.calledFromBusinessPage) {
    //       extraParams += "&additionalSigner=true";
    //     }
    //     const url = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=photoid_check_stage_aborted${extraParams}`;
    //     $axios.get(url, {
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //     });
    //     window.onbeforeunload = null;
    //     try {
    //       console.log("this.personaClientDoc", this.personaClientDoc);
    //       if (this.personaClientDoc) {
    //         this.personaClientDoc.cancel(true);
    //       }
    //     } catch (error) {
    //       console.log(error);
    //     }
    //   }
    // });
    // window.onpopstate = () => {
    //   if (window.onbeforeunload) {
    //     let extraParams = "";
    //     if (this.calledFromBusinessPage) {
    //       extraParams += "&additionalSigner=true";
    //     }
    //     const url = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=photoid_check_stage_aborted${extraParams}`;
    //     $axios.get(url, {
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //     });
    //     window.onbeforeunload = null;
    //     try {
    //       console.log("this.personaClientDoc", this.personaClientDoc);
    //       if (this.personaClientDoc) {
    //         this.personaClientDoc.cancel(true);
    //       }
    //     } catch (error) {
    //       console.log(error);
    //     }
    //   }
    // };
  },
  setup () {
    const loading = ref(false);
    const uploaded = ref(false);
    const failed = ref(false);
    const failedConsumer = ref(false);
    const currentSession = ref(null);
    const frontPhoto = ref(null);
    const backPhoto = ref(null);
    const sendEvsIntegrationConsumerFill = async(sessionId, demo, biometricsImageAdded) => {
      console.log("hello");
      console.log({ sessionId, demo, biometricsImageAdded });
      try {
        let url = `session/getCustomerDetailsAfterChecking/${sessionId}`;
        if (demo && demo === true) {
          url += "/?demo=true";
        }
        const response = await $axios.post(url, { biometrics: biometricsImageAdded }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const loadPersonalData = async (sessionId) => {
      try {
        const url = "session/load/personalData";
        console.log("sessionId", sessionId);
        const response = await $axios.post(url, { sessionId }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const dataURItoBlob = (dataURI) => {
      // convert base64 to raw binary data held in a string
      const byteString = atob(dataURI.split(",")[1]);

      // separate out the mime component
      const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

      // write the bytes of the string to an ArrayBuffer
      const arrayBuffer = new ArrayBuffer(byteString.length);

      // create a view into the buffer
      const viewBuffer = new Uint8Array(arrayBuffer);

      // set the bytes of the buffer to the correct values
      for (let i = 0; i < byteString.length; i += 1) {
          viewBuffer[i] = byteString.charCodeAt(i);
      }

      // write the ArrayBuffer to a blob
      const blob = new Blob([arrayBuffer], { type: mimeString });
      return blob;
    };
    return {
      loading,
      uploaded,
      failed,
      failedConsumer,
      sendEvsIntegrationConsumerFill,
      loadPersonalData,
      currentSession,
      frontPhoto,
      backPhoto,
      dataURItoBlob,
    };
  },
  beforeDestroy() {
    if (window.videoCameraControls) {
      window.videoCameraControls.stop();
      window.videoCameraControls = false;
    }
    if (this.validatingPhotoidInterval) {
      clearInterval(this.validatingPhotoidInterval);
      this.validatingPhotoidInterval = null;
    }
  },
  methods: {
    photoIdButtonClicked() {
      this.enablePhotoIdButtonLoading = true;
      let templateId = process.env.PERSONA_TEMPLATEID_MAIN;
      console.log("process.env", process.env);
      let personaEnvironment = "sandbox";
      if (this.$user.testingacc || this.sessionDoc.testingAccSession) {
        if (this.typeOfKBA !== "foreigners_without_residential") {
          templateId = process.env.PERSONA_TEST_TEMPLATEID_MAIN;
        } else {
          templateId = process.env.PERSONA_TEST_TEMPLATEID_BIOMETRICS;
        }
      } else {
        personaEnvironment = "production";
        if (this.typeOfKBA !== "foreigners_without_residential") {
          templateId = process.env.PERSONA_TEMPLATEID_MAIN;
        } else {
          templateId = process.env.PERSONA_TEMPLATEID_BIOMETRICS;
        }
      }
      console.log("templateId", templateId);
      const client = new Persona.Client({
        templateId,
        environment: personaEnvironment,
        onReady: () => {
          console.log("window.location.hrefwindow.location.href", window.location.href);
          if (window.location.href.includes("photoid") || (window.location.href.includes("business") && this.calledFromBusinessPage) || (window.location.href.includes("pdf_edit") && this.calledFromSessionPage)) {
            this.enablePhotoIdButtonLoading = false;
            client.open();
          }
        },
        onComplete: async ({ inquiryId, status, fields }) => {
          // window.onbeforeunload = null;
          console.log(`Completed inquiry ${inquiryId} with status ${status}`);
          console.log("fields", fields);
          this.nextButtonDisabled = false;
          this.personaOutputData = {
            inquiryId,
            status,
            fields
          };
          // let demoFlag = (this.$route.query.demo && this.$route.query.demo === "true") || false;
          // if (this.calledFromBusinessPage && this.$user.testingacc) {
          //   demoFlag = true;
          // }
          // this.nextButtonLoading = true;
          // // let url = `session/savePersonaDetailsForPhotoid/${this.sessionid}`;
          // // if (demoFlag && demoFlag === true) {
          // //   url += "/?demo=true";
          // // }
          // // const response = await $axios.post(url, { personaAPIResponseDoc: this.personaOutputData }, {
          // //   headers: {
          // //     "Content-Type": "application/json",
          // //   },
          // // });
          // this.nextButtonLoading = false;
          // console.log("responseresponse", response);
          if (status === "failed") {
            if (this.calledFromBusinessPage || this.calledFromSessionPage) {
              this.kbaModalChangeSection("failed", "Your Photo ID verification failed. Unfortunately, we cannot continue your session.");
            } else {
              const sessionUrl2 = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=photoid_check_stage_fail`;
              await $axios.get(sessionUrl2, {
                headers: {
                  "Content-Type": "application/json",
                },
              });
              this.failed = true;
            }
          } else {
            this.nextButtonClick();
          }
        }
      });
      this.personaClientDoc = client;
    },
    closePhotoIdErrorModal() {
      this.showBackPhotoIdErrorModal = false;
    },
    failSession () {
      // window.onbeforeunload = null;
      this.$router.replace("/business/");
    },
    async nextButtonClick () {
      console.log("Next button clicked");
      this.nextButtonLoading = true;
      let demo = (this.$route.query.demo && this.$route.query.demo === "true") || false;
      if ((this.calledFromBusinessPage || this.calledFromSessionPage) && this.$user.testingacc) {
        demo = true;
      }
      let url = `session/savePersonaDetailsForPhotoid/${this.sessionid}`;
      if (demo && demo === true) {
        url += "/?demo=true";
      }
      let response;
      try {
        response = await $axios.post(url, { personaAPIResponseDoc: this.personaOutputData }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.log("personaAPI failed", error);
        this.nextButtonLoading = false;
        return;
      }
      console.log("response", response.data);
      this.nextButtonLoading = false;
      this.$q.notify({
        color: "primary",
        position: "bottom-right",
        message: "Your photo ID is verified successfully.",
      });
      // let stageValue = "kba_check_stage";
      let stageValue = "payment_info_stage";
      let localTempStage = "payment_info";
      if (this.calledFromBusinessPage || this.calledFromSessionPage) {
        stageValue = "meet_notary";
        localTempStage = "meet_notary";
      }
      if (this.hidePaymentsTab) {
        stageValue = "meet_notary_stage";
        localTempStage = "meet_notary";
      }
      // if (this.typeOfKBA === "foreigners_without_residential") {
      //   stageValue = "payment_info_stage";
      // }
      let extraParams = "";
      if (this.calledFromBusinessPage || this.calledFromSessionPage) {
        extraParams += "&additionalSigner=true";
      }
      const sessionUrl = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=${stageValue}${extraParams}`;
      await $axios.get(sessionUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (this.hidePaymentsTab) {
        const saveUrl = `session/saveSessionData/${this.sessionid}`;
        const dataToSave = {
          sessionOpenCallForTaking: true
        };
        const apiResponse = await $axios.post(saveUrl, {
          data: dataToSave
        });
        if (apiResponse?.data?.openCallSent) {
          this.socketRequest("new_session_open_call");
        }
      }
      window.sessionStorage.setItem(`${this.sessionid}_photoid`, "true");
      if (this.calledFromBusinessPage || this.calledFromSessionPage) {
        this.kbaModalChangeSection("meet_notary");
      } else if (this.$route.query.demo && this.$route.query.demo === "true") {
          this.$router.replace(`/business/${localTempStage}/${this.sessionid}/?demo=true`).catch(() => {});
        } else if (this.$user.testingacc && this.$user.testingacc === true) {
          this.$router.replace(`/business/${localTempStage}/${this.sessionid}/?demo=true`).catch(() => {});
        } else {
          this.$router.replace(`/business/${localTempStage}/${this.sessionid}`).catch(() => {});
        }
    },
    async verifyingCardIntegration() {
      this.validatingPhotoidResponseModal = true;
      this.validatingPhotoidInterval = setInterval(async () => {
        const url = "session/load/personalData";
        // console.log("sessionId", sessionId);
        const response = await $axios.post(url, { sessionId: this.sessionid, getEvsResult: true }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("response data temp", response.data);
        if (response.data.evsRes) {
          if (this.validatingPhotoidInterval) {
            clearInterval(this.validatingPhotoidInterval);
            this.validatingPhotoidInterval = null;
          }
          const evsRes = response.data.evsRes;
          this.evsResult = evsRes;
          console.log(evsRes);
          this.nextButtonLoading = false;
          if (evsRes.workflowOutcome !== null && evsRes.workflowOutcome === "Pass") {
            if (this.typeOfKBA !== "foreigners_without_residential" && this.typeOfPhotoId === "passportbook") {
              let demo = (this.$route.query.demo && this.$route.query.demo === "true") || false;
              if ((this.calledFromBusinessPage || this.calledFromSessionPage) && this.$user.testingacc) {
                demo = true;
              }
              let consumerPlusUrl = `session/getConsumerPlusApiResponse/${this.sessionid}`;
              if (demo && demo === true) {
                consumerPlusUrl += "/?demo=true";
              }
              this.nextButtonLoading = true;
              const consumerPlusResponse = await $axios.get(consumerPlusUrl, {
                headers: {
                  "Content-Type": "application/json",
                },
              });
              this.nextButtonLoading = false;
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
                  return;
                }
              }
              console.log("consumerPlusResponse", consumerPlusResponse);
            } else if (this.typeOfKBA === "foreigners_without_residential" && this.typeOfPhotoId === "passportbook") {
              if (evsRes && evsRes.verificationConfidence) {
                const verificationConfidence = parseInt(evsRes.verificationConfidence);
                if (verificationConfidence < 60) {
                  this.failedConsumer = true;
                  return;
                }
              }
            }
            // redirect to payment page
            this.$q.notify({
              color: "primary",
              position: "bottom-right",
              message: "Your photo ID is verified successfully.",
            });
            let stageValue = "kba_check_stage";
            // let stageValue = "payment_info_stage";
            if (this.calledFromBusinessPage || this.calledFromSessionPage) {
              stageValue = "kba_check_stage";
            }
            if (this.typeOfKBA === "foreigners_without_residential") {
              stageValue = "payment_info_stage";
            }
            let extraParams = "";
            if (this.calledFromBusinessPage) {
              extraParams += "&additionalSigner=true";
            }
            const sessionUrl = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=${stageValue}${extraParams}`;
            await $axios.get(sessionUrl, {
              headers: {
                "Content-Type": "application/json",
              },
            });
            // window.onbeforeunload = null;
            if (this.calledFromBusinessPage || this.calledFromSessionPage) {
              this.kbaModalChangeSection("meet_notary");
            } else if (this.sessionChargeOnBusinessUser) {
              if (this.$route.query.demo && this.$route.query.demo === "true") {
                this.$router.replace(`/business/meet_notary/${this.sessionid}/?demo=true`).catch(() => {});
              } else if (this.$user.testingacc && this.$user.testingacc === true) {
                this.$router.replace(`/business/meet_notary/${this.sessionid}/?demo=true`).catch(() => {});
              } else {
                this.$router.replace(`/business/meet_notary/${this.sessionid}`).catch(() => {});
              }
            } else if (this.$route.query.demo && this.$route.query.demo === "true") {
                this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
              } else if (this.$user.testingacc && this.$user.testingacc === true) {
                this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
              } else {
                this.$router.replace(`/business/payment_info/${this.sessionid}`).catch(() => {});
              }

            // if (this.typeOfKBA !== "foreigners_without_residential") {
            //   if (this.calledFromBusinessPage) {
            //     this.kbaModalChangeSection("kba");
            //   } else if (this.$route.query.demo && this.$route.query.demo === "true") {
            //     this.$router.replace(`/business/kba/${this.sessionid}/?demo=true`).catch(() => {});
            //   } else if (this.$user.testingacc && this.$user.testingacc === true) {
            //     this.$router.replace(`/business/kba/${this.sessionid}/?demo=true`).catch(() => {});
            //   } else {
            //     this.$router.replace(`/business/kba/${this.sessionid}`).catch(() => {});
            //   }
            // } else if (this.calledFromBusinessPage) {
            //     this.kbaModalChangeSection("meet_notary");
            //   } else if (this.$route.query.demo && this.$route.query.demo === "true") {
            //     this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
            //   } else if (this.$user.testingacc && this.$user.testingacc === true) {
            //     this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
            //   } else {
            //     this.$router.replace(`/business/payment_info/${this.sessionid}`).catch(() => {});
            //   }

            // if (this.calledFromBusinessPage) {
            //   this.kbaModalChangeSection("meet_notary");
            // } else if (this.$route.query.demo && this.$route.query.demo === "true") {
            //   this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
            // } else if (this.$user.testingacc && this.$user.testingacc === true) {
            //   this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
            // } else {
            //   this.$router.replace(`/business/payment_info/${this.sessionid}`).catch(() => {});
            // }
          } else if (this.calledFromBusinessPage || this.calledFromSessionPage) {
            this.kbaModalChangeSection("failed", "Your Photo ID verification failed. Unfortunately, we cannot continue your session.");
          } else {
            const sessionUrl2 = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=photoid_check_stage_fail`;
            await $axios.get(sessionUrl2, {
              headers: {
                "Content-Type": "application/json",
              },
            });
            this.failed = true;
          }
        }
      }, 4000);
    },
    async savePersonalDetails () {
      console.log("in save personal details");
      let demoFlag = (this.$route.query.demo && this.$route.query.demo === "true") || false;
      if ((this.calledFromBusinessPage || this.calledFromSessionPage) && this.$user.testingacc) {
        demoFlag = true;
      }
      this.nextButtonLoading = true;
      const tempResponse = await this.sendEvsIntegrationConsumerFill(this.sessionid, demoFlag);
      console.log("tempRepomse", tempResponse);
      this.verifyingCardIntegration();
      return "";
    },
    async updatePassword () {
      this.$v.model.$touch();
      if (!this.$v.model.$invalid) {
        try {
          this.loading = true;
          console.log(this.model);
          const dataToSend = JSON.parse(JSON.stringify(this.$v.model.$model));
          if (this.updatePasswordEmailModal && !dataToSend.email) {
            this.$q.notify({
              color: "red",
              position: "bottom-right",
              message: "Please enter email",
            });
            return;
          }
          dataToSend.sentWithoutOldPassword = true;
          await this.axios.post("auth/update-password", dataToSend);
          this.loading = false;
          this.updatePasswordModal = false;
          this.model = {
            email: "",
            password: "",
            confirmPassword: ""
          };
          this.$v.model.$reset();
          this.$q.notify({
            color: "secondary",
            position: "bottom-right",
            message: "Password updated successfully. You can now continue the session",
          });
          this.photoIdButtonClicked();
        } catch (error) {
          this.loading = false;
        }
      }
    },
    socketRequest(eventName, extraDataToSend) {
      const dataToSend = {
        sessionid: this.sessionid,
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
  }
};

</script>
