<template>
  <q-page class="q-pa-md flex-center session-container">
    <div class="row">
      <div class="col-12 col-md-12">
        <session-header :session-id="sessionid" />
      </div>
      <div class="col-12 col-md-12 q-pa-lg workflow-container">
        <div
          v-if="!calledFromBusinessPage"
          class="
            flex
            justify-between
            q-pt-md q-pb-md
            workflow-icons
            q-gutter-md
            text-center
          "
        >
          <div class="col flex column flex-center mobile-hide">
            <img src="~assets/document-upload.svg" class="session-guide-icon" />
            <p class="q-pa-md">1. Upload Document</p>
            <q-icon name="check_circle" />
          </div>
          <div class="col column flex flex-center black-border-bottom">
            <img src="~assets/id-card.svg" class="session-guide-icon" />
            <p class="q-pa-md">2. Identity Check</p>
            <!-- <q-icon name="check_circle" /> -->
          </div>
          <div class="col column flex flex-center mobile-hide">
            <img src="~assets/credit-card.svg" class="session-guide-icon" />
            <p class="q-pa-md">3. Payment Info</p>
          </div>
          <div class="col column flex flex-center mobile-hide">
            <img src="~assets/videocall.svg" class="session-guide-icon" />
            <p class="q-pa-md">4. Meet Notary</p>
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-8">
            <div class="flex column">
              <h5>Verify Your Identity</h5>
              <p class="q-mb-md">
                We need some personal information in order to verify your
                identity.
              </p>
              <div class="flex column" style="padding-top: 0px">
                <h6 class="no-margin"><strong>Type of ID</strong></h6>
                <div class="row doc-list-preview">
                  <div class="">
                    <q-radio v-if="typeOfKBA !== 'foreigners_with_residential' && typeOfKBA !== 'foreigners_without_residential'" v-model="typeOfPhotoId" val="drivinglicense" label="Driver's License" />
                    <q-radio v-model="typeOfPhotoId" val="passportbook" label="Passport Book" />
                    <q-radio v-if="typeOfKBA !== 'foreigners_with_residential' && typeOfKBA !== 'foreigners_without_residential'" v-model="typeOfPhotoId" val="passportcard" label="Passport Card" />
                  </div>
                </div>
              </div>
              <!-- <div v-if="$user.testingacc" class="flex column" style="padding-top: 0px">
                <h6 class="no-margin"><strong>Photo ID Capture Method</strong></h6>
                <div class="row doc-list-preview">
                  <div class="">
                    <q-radio v-model="photoIdCaptureMethod" val="upload_via_webcam" label="Upload Via Webcam" />
                    <q-radio v-model="photoIdCaptureMethod" val="upload_manual" label="Upload From Your Device Files" />
                  </div>
                </div>
              </div> -->
              <div class="">
                <div v-if="photoIdCaptureMethod === 'upload_via_webcam'" id="test-area-qr-code-webcam">
                  <video id="photoIdCaptureVideo" style="width: 100%" />
                  <q-card v-if="!photoIdBackVerified" class="my-card">
                    <q-card-section>
                      Please show the <strong>back side</strong> of your photo ID. Please make sure to show the entire card and take a clear image.
                      <q-btn
                        rounded
                        size="md"
                        :loading="true"
                      />
                    </q-card-section>
                  </q-card>
                  <q-card v-if="photoIdBackVerified" class="my-card bg-secondary text-white">
                    <q-card-section>
                      Back of Photo ID is <strong>Verified.</strong>
                    </q-card-section>
                  </q-card>
                  <q-card v-if="photoIdBackVerified && !frontIdFile" class="my-card">
                    <q-card-section>
                      Please show the <strong>front side</strong> of your photo ID and click the capture button.
                      <q-btn color="primary" label="Capture" @click="captureFrontIdButtonClicked" />
                    </q-card-section>
                  </q-card>
                  <q-card v-if="photoIdBackVerified && frontIdFile" class="my-card bg-secondary text-white">
                    <q-card-section>
                      Front side of photo ID is captured.
                    </q-card-section>
                  </q-card>
                </div>
                <div v-if="photoIdCaptureMethod === 'upload_manual'" class="q-pt-lg">
                  <h5 v-if="typeOfPhotoId === 'drivinglicense'" class="">Photo ID</h5>
                  <h5 v-else-if="typeOfPhotoId === 'passportbook'" class="">Passport</h5>
                  <h5 v-else>Passport Card</h5>
                  <p class="q-mb-md">
                    <template v-if="typeOfPhotoId === 'drivinglicense'">
                      Please upload a <strong>clear</strong> image of the <i>front and back side</i> of your <strong v-if="typeOfKBA === 'passport'">Passport</strong> <strong v-else>StateID, Real ID, or Driver's License</strong>.<br />
                    </template>
                    <template v-else-if="typeOfPhotoId === 'passportbook'">
                      Please upload a <strong>clear</strong> image of the <i>front page</i> of your <strong>Passport</strong>.<br />
                    </template>
                    <template v-else>
                      Please upload a <strong>clear</strong> image of the <i>front and back side</i> of your <strong>Passport Card</strong>.<br />
                    </template>
                    <small>Accepted file formats are .jpg, .png (Max 4MB), minimum image resolution should be 800px x 600px. The session <strong>WILL FAIL</strong> if you upload a <strong>blurry</strong> image. </small>
                  </p>
                  <div class="row">
                    <div class="col-12 col-sm-6 q-pr-xs ffrid">
                      <q-img v-if="frontPhoto" class="q-my-md" :src="frontPhoto" spinner-color="primary" />
                      <q-img v-else-if="typeOfPhotoId === 'drivinglicense'" src="https://bluenotary.us/assets/img/sample-id-front.png" spinner-color="primary" />
                      <q-img v-else-if="typeOfPhotoId === 'passportbook'" src="~assets/passport-book-front.jpg" spinner-color="primary" />
                      <q-img v-else-if="typeOfPhotoId === 'passportcard'" src="~assets/passport-card-front.png" spinner-color="primary" />
                      <div class="row">
                        <template v-if="uploadingF">
                          <q-spinner
                            color="primary"
                            size="3em" />
                          <span class="no-margin q-pt-md">Uploading...</span>
                        </template>
                        <q-btn v-else
                               class="col"
                               color="green"
                               label="Upload Front ID"
                               style="height: 3.4rem"
                               @click="$refs.frontIdInput.$el.click()"
                        />
                        <q-file
                          v-show="false"
                          ref="frontIdInput"
                          v-model="uploadFrontId"
                          standout
                          label="Upload Front ID"
                          accept=".jpg, .png, .jpeg"
                        />
                      </div>
                    </div>
                    <div class="col-12 col-sm-6 q-pl-xs bbrid">
                      <q-img v-if="backPhoto" :src="backPhoto" spinner-color="primary" />
                      <q-img v-else-if="typeOfPhotoId === 'drivinglicense'" src="https://bluenotary.us/assets/img/sample-id-back.png" spinner-color="primary" />
                      <q-img v-else-if="typeOfPhotoId === 'passportcard'" src="~assets/passport-card-back.png" spinner-color="primary" />
                      <div v-if="typeOfPhotoId !== 'passportbook'" class="row">
                        <template v-if="uploadingB">
                          <q-spinner
                            color="primary"
                            size="3em" />
                          <span class="no-margin q-pt-md">Uploading...</span>
                        </template>
                        <q-btn v-else
                               class="col"
                               label="Upload Back ID"
                               color="green"
                               style="height: 3.4rem"
                               @click="$refs.backIdInput.$el.click()"
                        />
                        <q-file
                          v-show="false"
                          ref="backIdInput"
                          v-model="uploadBackId"
                          standout
                          label="Upload Back ID"
                          accept=".jpg, .png, .jpeg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-4 flex mobile-hide">
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
                  State laws require strict identity verification to service
                  online notarizations. We use sophisticated and secure tech to make this
                  process as smooth as possible. Your personal information is
                  never stored or recorded. We will ask you <strong>5 personal questions</strong> and require a <strong>photo ID</strong>.
                  <p v-if="typeOfKBA !== 'foreigners_without_residential'">You will have <strong>2 minutes to complete</strong> the 5 questions. If you fail the first 5, you'll be presented with a 2nd try.</p>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
      <div v-if="typeOfKBA !== 'foreigners_without_residential'" class="col-12 q-my-xl">
        <p><q-icon name="access_time" /> You will have <strong>2 minutes to complete</strong> the 5 challenge questions in the next step.</p>
      </div>
      <!-- biometrics btn -->
      <q-btn
        v-if="typeOfKBA === 'foreigners_without_residential'"
        class="next-btn q-mt-md q-mb-xl"
        label="Go to Biometrics"
        color="purple"
        style="margin-right: 15px"
        @click="giveBiometricsButtonClicked()"
      />
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
      <div v-if="nextButtonLoading && typeOfKBA !== 'foreigners_without_residential'" style="margin-top: 22px; margin-left: 16px">Please wait while we process your ID</div>
      <div v-if="nextButtonLoading && typeOfKBA === 'foreigners_without_residential'" style="margin-top: 22px; margin-left: 16px">Please wait while we process your ID and Biometrics</div>
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
            <div class="column is-7" style="font-weight: bold">{{ evsResult.documentValidationResult }}</div>
            <div class="column is-5">Document Expiration Result</div>
            <div class="column is-7" style="font-weight: bold">{{ evsResult.documentExpirationResult }}</div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn outline label="OKAY" color="primary" @click="failSession()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="evsBiometricsPassbook" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Take a portrait image (selfie) of yourself</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Take a portrait image of yourself for biometric authentication.
          <video v-show="!biometricsImageAdded" id="video" ref="camera" src="" style="color: black; width: 100%; min-height: 260px;" />
          <canvas v-show="biometricsImageAdded" id="photoTaken" ref="canvas" :width="450" :height="337.5" />
          <q-btn :disable="!biometricsVideoOn" outline color="primary" label="Capture Photo" @click="capturePhotoClicked" />
          <div v-if="biometricsImageAdded"><p><strong>Portrait image captured successfully.</strong> Click Next to continue.</p></div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn outline label="Next" color="primary" :disable="!biometricsImageAdded" @click="biometricsDoneClicked()" />
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
          <h3>
            Please Update Your Account Password to Secure Your Account and Proceed with Session
          </h3>
          <div class="row q-py-md">
            <div class="col-md-4 col-xs-12 q-pr-sm">
              <q-input
                v-model="$v.model.password.$model"
                outlined
                type="password"
                hint="New Password"
                :dense="dense"
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
                :dense="dense"
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
import __ from "lodash";
// import axios from "axios";
// import {
//  RGBLuminanceSource, BinaryBitmap, HybridBinarizer, MultiFormatReader
// } from "@zxing/library";
// import { BrowserPDF417Reader } from "@zxing/browser";
import {
 BarcodeFormat, DecodeHintType
} from "@zxing/library";
// import {
//  BarcodeFormat, DecodeHintType
// } from "@zxing/library";
import {
 BrowserPDF417Reader, BrowserCodeReader
//  BrowserMultiFormatOneDReader, BrowserCodeReader
//  MultiFormatReader, BrowserCodeReader
//  BrowserPDF417Reader, BrowserCodeReader
} from "@zxing/browser";
import {
  required, minLength, sameAs,
} from "vuelidate/lib/validators";
import states from "@/data/states.json";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";

import SessionHeader from "../../components/SessionHeader.vue";
// console.log(BrowserPDF417Reader);

export default {
  name: "Photoid",
  components: { SessionHeader },
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
      model: {
        password: "",
        confirmPassword: ""
      },
      typeOfKBA: "",
      typeOfPhotoId: "drivinglicense",
      validatingPhotoidResponseModal: false,
      validatingPhotoidInterval: false,
      nextButtonLoading: false,
      evsBiometricsPassbook: false,
      biometricsImageAdded: false,
      nextButtonDisabled: false,
      biometricsVideoOn: false,
      biometricsVideoError: false,
      biometricsSaveLoading: false
    };
  },
  validations: {
    model: {
      password: { required, minLength: minLength(6) },
      confirmPassword: { required, sameAsPassword: sameAs("password") }
    }
  },
  watch: {
    async uploadFrontId (val) {
      console.log("val", val);
      if (val) {
        console.log("val", val);
        const img = new Image();
        this.uploadingF = true;
        img.src = window.URL.createObjectURL(val);
        img.onload = async () => {
          console.log(img.naturalWidth, img.naturalHeight);
          if (img.naturalWidth < 800 || img.naturalHeight < 600) {
            window.URL.revokeObjectURL(img.src);
            this.$q.notify({
              color: "secondary",
              position: "bottom-right",
              message: "Minimum dimention of front photo id is 800x600px.",
            });
          } else {
            window.URL.revokeObjectURL(img.src);
            if (val.size > 4000000) {
              const reader = new FileReader();
              reader.onload = async(e) => {
                const imgCanvas = document.createElement("img");
                imgCanvas.onload = async() => {
                  // Create canvas
                  const canvas = document.createElement("canvas");
                  const ctx = canvas.getContext("2d");
                  canvas.width = 800;
                  canvas.height = 600;
                  ctx.drawImage(imgCanvas, 0, 0, 800, 600);
                  // Create dataURL
                  const dataurl = canvas.toDataURL(val.type);
                  // this.frontPhoto = dataurl;
                  // Get blob from data url and convert it to file object
                  const blob = this.dataURItoBlob(dataurl);
                  const newFile = new File([blob], val.name, { type: val.type, lastModified: val.lastModified });
                  await this.fileUpload(newFile, "front", (this.$route.params && this.$route.params.id) || this.sessionid, this.photoIdCaptureMethod, this.typeOfPhotoId);
                  const res = await this.loadPersonalData((this.$route.params && this.$route.params.id) || this.sessionid);
                  this.frontPhoto = (res && res.frontPhotoIdUrl) ? res.frontPhotoIdUrl : "";
                  this.backPhoto = (res && res.backPhotoIdUrl) ? res.backPhotoIdUrl : "";
                };
                imgCanvas.src = e.target.result;
              };
              reader.readAsDataURL(val);
            } else {
              console.log(img.src);
              await this.fileUpload(val, "front", (this.$route.params && this.$route.params.id) || this.sessionid, this.photoIdCaptureMethod, this.typeOfPhotoId);
              const res = await this.loadPersonalData((this.$route.params && this.$route.params.id) || this.sessionid);
              this.frontPhoto = (res && res.frontPhotoIdUrl) ? res.frontPhotoIdUrl : "";
              this.backPhoto = (res && res.backPhotoIdUrl) ? res.backPhotoIdUrl : "";
            }
          }
          this.uploadingF = false;
        };
      }
    },

    async uploadBackId (val) {
      if (val) {
        this.uploadingB = true;
        const img = new Image();
        img.src = window.URL.createObjectURL(val);
        img.onload = async () => {
          if (img.naturalWidth < 800 || img.naturalHeight < 600) {
            window.URL.revokeObjectURL(img.src);
            this.$q.notify({
              color: "secondary",
              position: "bottom-right",
              message: "Minimum dimention of back photo id is 800x600px.",
            });
          } else {
            window.URL.revokeObjectURL(img.src);
            if (val.size > 4000000) {
              const reader = new FileReader();
              reader.onload = async(e) => {
                const imgCanvas = document.createElement("img");
                imgCanvas.onload = async() => {
                  // Create canvas
                  const canvas = document.createElement("canvas");
                  const ctx = canvas.getContext("2d");
                  canvas.width = 800;
                  canvas.height = 600;
                  ctx.drawImage(imgCanvas, 0, 0, 800, 600);
                  // Create dataURL
                  const dataurl = canvas.toDataURL(val.type);
                  // this.frontPhoto = dataurl;
                  // Get blob from data url and convert it to file object
                  const blob = this.dataURItoBlob(dataurl);
                  const newFile = new File([blob], val.name, { type: val.type, lastModified: val.lastModified });
                  const fileresponse = await this.fileUpload(newFile, "back", (this.$route.params && this.$route.params.id) || this.sessionid, this.photoIdCaptureMethod, this.typeOfPhotoId);
                  const res = await this.loadPersonalData((this.$route.params && this.$route.params.id) || this.sessionid);
                  this.frontPhoto = (res && res.frontPhotoIdUrl) ? res.frontPhotoIdUrl : "";
                  this.backPhoto = (res && res.backPhotoIdUrl) ? res.backPhotoIdUrl : "";
                  console.log("fileresponse", fileresponse);
                  if (fileresponse && fileresponse.message && __.includes(fileresponse.message, "Failed")) {
                    this.backPhotoIdDecodeStatus = "failed";
                    this.showBackPhotoIdErrorModal = true;
                  } else {
                    this.backPhotoIdDecodeStatus = "success";
                  }
                };
                imgCanvas.src = e.target.result;
              };
              reader.readAsDataURL(val);
            } else {
              const fileresponse = await this.fileUpload(val, "back", (this.$route.params && this.$route.params.id) || this.sessionid, this.photoIdCaptureMethod, this.typeOfPhotoId);
              const res = await this.loadPersonalData((this.$route.params && this.$route.params.id) || this.sessionid);
              this.frontPhoto = (res && res.frontPhotoIdUrl) ? res.frontPhotoIdUrl : "";
              this.backPhoto = (res && res.backPhotoIdUrl) ? res.backPhotoIdUrl : "";
              console.log("fileresponse", fileresponse);
              if (fileresponse && fileresponse.message && __.includes(fileresponse.message, "Failed")) {
                this.backPhotoIdDecodeStatus = "failed";
                this.showBackPhotoIdErrorModal = true;
              } else {
                this.backPhotoIdDecodeStatus = "success";
              }
            }
          }
          this.uploadingB = false;
        };
      }
    },

    async photoIdCaptureMethod(val) {
      if (val === "upload_via_webcam") {
        if (!this.photoIdBackVerified) {
          this.startVideoCapture("back");
        } else {
          this.startVideoCapture("front");
        }
      } else {
        if (window.videoCameraControls) {
          window.videoCameraControls.stop();
          window.videoCameraControls = false;
        }
        if (this.photoIdCaptureInterval) {
          clearInterval(this.photoIdCaptureInterval);
          this.photoIdCaptureInterval = false;
        }
      }
    },

    async backIdFile(val) {
      await this.fileUpload(val, "back", (this.$route.params && this.$route.params.id) || this.sessionid, this.photoIdCaptureMethod, this.typeOfPhotoId);
    },

    async frontIdFile(val) {
      await this.fileUpload(val, "front", (this.$route.params && this.$route.params.id) || this.sessionid, this.photoIdCaptureMethod, this.typeOfPhotoId);
    },

    async biometricsImageAdded(val) {
      if (val) {
        this.nextButtonDisabled = false;
      }
    },

    async evsBiometricsPassbook(val) {
      if (val) {
        this.biometricsImageAdded = false;
      }
      this.toggleVideo();
    },
  },
  async mounted () {
    this.updatePasswordModal = this.$user.needToUpdatePasswordInSession || false;
    this.updatePasswordEmailModal = this.$user.needToUpdateEmailInSession || false;
    this.sessionid = (this.$route.params && this.$route.params.id) || false;
    if (this.calledFromBusinessPageSessionId) {
      this.sessionid = this.calledFromBusinessPageSessionId;
    }
    this.currentSession = this.$q.localStorage.getItem("sessionData");
    if (!this.currentSession && !this.calledFromBusinessPage) {
      if (this.$user.testingacc && this.$user.testingacc === true) {
        this.$router.replace(`/business/personal_info/${this.sessionid}/?demo=true`).catch(() => {});
      } else {
        this.$router.replace(`/business/personal_info/${this.sessionid}`).catch(() => {});
      }
    }

    const res = await this.loadPersonalData(this.sessionid);
    if (res) {
      if (res && res.sessionDoc) {
        this.typeOfKBA = res.sessionDoc.typeOfKBA || "";
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
    // this.startVideoCapture("back");
  },
  setup () {
    const loading = ref(false);
    const uploaded = ref(false);
    const uploadingF = ref(false);
    const uploadingB = ref(false);
    const failed = ref(false);
    const failedConsumer = ref(false);
    const currentSession = ref(null);
    const uploadFrontId = ref(null);
    const uploadBackId = ref(null);
    const frontPhoto = ref(null);
    const backPhoto = ref(null);
    const fileUpload = async (data, photoIdType, sessionId, photoIdCaptureMethod, typeOfPhotoId) => {
      try {
        const url = "file/customerFrontBackIdUpload";
        const formData = new FormData();
        formData.append("documentType", photoIdType);
        formData.append("sessionId", sessionId);
        formData.append("photoIdCaptureMethod", photoIdCaptureMethod);
        formData.append("typeOfPhotoId", typeOfPhotoId);
        formData.append("file", data);
        const response = await $axios.post(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
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
      uploadingF,
      uploadingB,
      failed,
      failedConsumer,
      sendEvsIntegrationConsumerFill,
      loadPersonalData,
      currentSession,
      fileUpload,
      uploadFrontId,
      uploadBackId,
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
    toggleVideo() {
      if (!this.biometricsVideoOn) {
        // video
        console.log(navigator);
        console.log(navigator.mediaDevices);
        navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
            document.getElementById("video").srcObject = stream;
            document.getElementById("video").autoplay = true;
            this.biometricsVideoOn = true;
        }).catch((err) => {
            this.biometricsVideoError = err;
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
        this.biometricsVideoOn = false;
      }
    },
    giveBiometricsButtonClicked() {
      this.evsBiometricsPassbook = true;
    },
    biometricsDoneClicked() {
      this.biometricsSaveLoading = true;
      const tempCanvas = document.getElementById("photoTaken").toDataURL("image/jpeg")
      .replace("data:image/jpeg;base64,", "");
      this.biometricsImageAdded = tempCanvas;
      this.evsBiometricsPassbook = false;
      this.nextButtonClick();
    },
    capturePhotoClicked() {
      this.biometricsImageAdded = !this.biometricsImageAdded;
      const context = this.$refs.canvas.getContext("2d");
      context.drawImage(this.$refs.camera, 0, 0, 450, 337.5);
    },
    videoCaptureSuccessfulForBackId() {
      this.$q.notify({
        color: "secondary",
        position: "bottom-right",
        message: "Back part of Photo ID is verified, Now please capture the Front part of Photo ID.",
      });
      if (this.photoIdCaptureInterval) {
        clearInterval(this.photoIdCaptureInterval);
        this.photoIdCaptureInterval = false;
      }
      this.photoIdBackVerified = true;
    },
    captureFrontIdButtonClicked() {
      const canvas = document.createElement("canvas");
      const video = document.getElementById("photoIdCaptureVideo");

      canvas.width = 1280;
      canvas.height = 960;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // const image = canvas.toDataURL("image/jpeg");
      // console.log("image", image)
      canvas.toBlob(async (blob) => {
        console.log("blob", blob);
        const filename = `photoid_temp_${this.$user._id}_front.jpg`;
        const newFile = new File([blob], filename, { type: "image/jpeg" });
        this.frontIdFile = newFile;
      }, "image/jpeg", 1);
    },
    async startVideoCapture(imageType) {
      console.log("imageType", imageType);
      const formats = [
        BarcodeFormat.CODE_128,
        BarcodeFormat.PDF_417,
        BarcodeFormat.CODE_93,
        BarcodeFormat.CODE_39
      ];
      const hints = new Map();
      console.log("DecodeHintType", DecodeHintType);
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const codeReader = new BrowserPDF417Reader({
        hints
      });
      console.log("codeReader", codeReader);

      const videoInputDevices = await BrowserCodeReader.listVideoInputDevices();

      // choose your media device (webcam, frontal camera, back camera, etc.)
      const selectedDeviceId = videoInputDevices[0].deviceId;

      console.log(`Started decode from camera with id ${selectedDeviceId}`);

      const previewElem = document.querySelector("#photoIdCaptureVideo");
      if (window.videoCameraControls) {
        window.videoCameraControls.stop();
        window.videoCameraControls = false;
      }
      // you can use the controls to stop() the scan or switchTorch() if available
      window.videoCameraControls = await codeReader.decodeFromVideoDevice(selectedDeviceId, previewElem, (result, error, controlsnew) => {
        // use the result and error values to choose your actions
        // you can also use controls API in this scope like the controls
        // returned from the method.
        if (!error) {
          console.log(result, error, controlsnew);
          if (imageType === "back") {
            this.videoCaptureSuccessfulForBackId();
          }
        }
      });
      // stops scanning after 20 seconds
      setTimeout(() => {
        if (window.videoCameraControls) {
          window.videoCameraControls.stop();
          window.videoCameraControls = false;
        }
        if (!this.photoIdBackVerified) {
          this.photoIdTimedOut = true;
          this.photoIdCaptureMethod = "upload_manual";
        }
      }, 180000);
      if (imageType === "back") {
        if (this.photoIdCaptureInterval) {
          clearInterval(this.photoIdCaptureInterval);
          this.photoIdCaptureInterval = false;
        }
        this.photoIdCaptureInterval = setInterval(() => {
          const canvas = document.createElement("canvas");
          const video = document.getElementById("photoIdCaptureVideo");

          canvas.width = 640;
          canvas.height = 480;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // const image = canvas.toDataURL("image/jpeg");
          // console.log("image", image)
          canvas.toBlob(async (blob) => {
            console.log("blob", blob);
            const filename = `photoid_temp_${this.$user._id}_back.jpg`;
            const newFile = new File([blob], filename, { type: "image/jpeg" });
            const url = "file/checkingPhotoIdRealTime";
            const formData1 = new FormData();
            formData1.append("sessionid", this.sessionid);
            formData1.append("filename", filename);
            formData1.append("file", newFile);
            const response = await $axios.post(url, formData1, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
            console.log(response);
            console.log(response.data);
            if (response.data && response.data.passed) {
              this.videoCaptureSuccessfulForBackId();
              this.backIdFile = newFile;
            }
          }, "image/jpeg", 1);
        }, 5000);
      }
    },
    closePhotoIdErrorModal() {
      this.showBackPhotoIdErrorModal = false;
    },
    failSession () {
      this.$router.replace("/business/");
    },
    async nextButtonClick () {
      console.log("Next button clicked");
      this.savePersonalDetails();
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
              if (this.calledFromBusinessPage && this.$user.testingacc) {
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
                if (this.calledFromBusinessPage) {
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
            if (this.calledFromBusinessPage) {
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
            if (this.typeOfKBA !== "foreigners_without_residential") {
              if (this.calledFromBusinessPage) {
                this.kbaModalChangeSection("kba");
              } else if (this.$route.query.demo && this.$route.query.demo === "true") {
                this.$router.replace(`/business/kba/${this.sessionid}/?demo=true`).catch(() => {});
              } else if (this.$user.testingacc && this.$user.testingacc === true) {
                this.$router.replace(`/business/kba/${this.sessionid}/?demo=true`).catch(() => {});
              } else {
                this.$router.replace(`/business/kba/${this.sessionid}`).catch(() => {});
              }
            } else if (this.calledFromBusinessPage) {
                this.kbaModalChangeSection("meet_notary");
              } else if (this.$route.query.demo && this.$route.query.demo === "true") {
                this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
              } else if (this.$user.testingacc && this.$user.testingacc === true) {
                this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
              } else {
                this.$router.replace(`/business/payment_info/${this.sessionid}`).catch(() => {});
              }

            // if (this.calledFromBusinessPage) {
            //   this.kbaModalChangeSection("meet_notary");
            // } else if (this.$route.query.demo && this.$route.query.demo === "true") {
            //   this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
            // } else if (this.$user.testingacc && this.$user.testingacc === true) {
            //   this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
            // } else {
            //   this.$router.replace(`/business/payment_info/${this.sessionid}`).catch(() => {});
            // }
          } else if (this.calledFromBusinessPage) {
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
      if (!this.frontPhoto && !this.frontIdFile) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please upload the front of your photo ID.",
        });
      }

      if (!this.backPhoto && !this.backIdFile && this.typeOfPhotoId !== "passportbook") {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please upload the back of your photo ID.",
        });
      }
      let demoFlag = (this.$route.query.demo && this.$route.query.demo === "true") || false;
      if (this.calledFromBusinessPage && this.$user.testingacc) {
        demoFlag = true;
      }
      this.nextButtonLoading = true;
      const tempResponse = await this.sendEvsIntegrationConsumerFill(this.sessionid, demoFlag, this.biometricsImageAdded);
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
          dataToSend.sentWithoutOldPassword = true;
          await this.axios.post("auth/update-password", dataToSend);
          this.loading = false;
          this.updatePasswordModal = false;
          this.model = {
            password: "",
            confirmPassword: ""
          };
          this.$v.model.$reset();
          this.$q.notify({
            color: "secondary",
            position: "bottom-right",
            message: "Password updated successfully. You can now continue the session",
          });
        } catch (error) {
          this.loading = false;
        }
      }
    },
  }
};

// import {
//  BarcodeFormat, DecodeHintType
// } from "@zxing/library";

// console.log(BarcodeFormat);

// $axios.get("https://bluenotarybucket.s3.us-east-2.amazonaws.com/1649582404008IMG_0467.jpg", (resp) => {
//   console.log(resp);
//   // resp.setEncoding("base64");
//   // let fileData = "";
//   // resp.on("data", (data) => {
//   //   fileData += data;
//   //   console.log("downloading");
//   // });
//   // resp.on("end", async () => {
//   //   const luminanceSource = new RGBLuminanceSource(new Uint8ClampedArray(Buffer.from(fileData, "base64")), 3024, 4032);
//   //   const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
//   //   reader.decode(binaryBitmap, hints);
//   // });
// });

    // const hints = new Map();
    // // const formats = [BarcodeFormat.PDF_417, BarcodeFormat.QR_CODE, BarcodeFormat.CODE_39];
    // const formats = [
    //   BarcodeFormat.CODE_128,
    //   BarcodeFormat.PDF_417,
    //   BarcodeFormat.QR_CODE,
    //   BarcodeFormat.CODE_93,
    //   BarcodeFormat.CODE_39,
    //   BarcodeFormat.CODABAR,
    //   BarcodeFormat.UPC_A,
    //   BarcodeFormat.UPC_E,
    //   BarcodeFormat.CODABAR,
    //   BarcodeFormat.CODABAR,
    //   BarcodeFormat.CODABAR,
    //   BarcodeFormat.CODABAR,
    //   BarcodeFormat.CODABAR,
    //   BarcodeFormat.CODABAR,
    // ];

    // hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

    // const reader = new MultiFormatReader();
    // console.log(reader);
    // // console.log(formats);
    // console.log(hints);
    // // const arrayBuffer = await fetch(`https://cors-fix.web.app/v1?url=${imageData}`).then((res) => res.arrayBuffer());
    // // const arrayBuffer = await fetch("https://bluenotarybucket.s3.us-east-2.amazonaws.com/1649582404008IMG_0467.jpg").then((res) => res.arrayBuffer());
    // const arrayBuffer = await fetch("https://bluenotarybucket.s3.us-east-2.amazonaws.com/_back-state-id-small.jpg").then((res) => res.arrayBuffer());
    // // const arrayBuffer = await fetch("https://bluenotarybucket.s3.us-east-2.amazonaws.com/_back-state-id-small.jpg?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEEYaCmFwLXNvdXRoLTEiSDBGAiEA72iQGA%2BVVmIqaG%2FeM%2FRgooAlQah90T0rONYXNfnly8QCIQC%2FQQfSPO3WPyzI87aFN5bPH4DON5jCsYPqmHEIgxhO4Sr7AggvEAAaDDkzMjA3OTY1NzY2NSIMIhI5Bys%2Bgv1mry8kKtgCQaYIiJkPtxUH6jUuMiNZruplXjIB8swWiaI5dRgjHr8ZzdF7w9Xl4modjreuob9KBAByCu5EPCObsXKFy9PaQ1HSdl6cjgRerWMRp0CuUwCzc6RU15fZX56t1I1IMblVq%2F8r4E34S55qTOl5hvmbL5o%2BMQudmo8ACo%2ByPB3iPMFNfZ0tHgeujHoSH9skn8p%2Bf8NLbbe30EBzrBCxHKw6a34SO2EbniohwPp9uOqUVxzHzzUqIY0Sjet0%2BTWGvg4uW0cm2OgSt%2BVJT9w193FQJA4yOsgF%2B5JoTm9mgVrwXoyykxJdE5TNPTufoQAf%2Buo%2F3efMwBfOXWiECBlRfSg08BRXMo%2F8pvo8HURfIhLD4ecGDB4k4h5RFbrd9WNELs10capdlttmyh9XZu9%2BTdc9KfKD47RXleoStXncsX7fhFGh7D8VQ0UZzRGQmbsLJIxNL0PW8ffNMsUwytyjlAY6sgJSerXxc0b8qFf8g2OfUhVTcVdf12deTdR1GmGsfEpRuJW11hPNZSdm3Wg6bDEShDeIYDixzWIy2Ch5CFEk0Ii3ZZtKOm8%2FMdiAHv2XY3p%2F37f1lguYpJr9klL4uLrU3EdUtpLGuebx2FEquG9fezVOiDqaH01%2FFy5awrdFkjOUYyjyMVTxRhyp5fbeaoi5i7xajjYWb8HDuY9CGtnE9JRbdWyRD9gnUQbGV4xqmCrr%2F9ockazL9Sw640U9f3VE17bhwAaqHSp4Ph7qekn%2Bv5m6c0eUD74L4YBsaYdJWkCQ%2BSV0j2iIdqz3VcUg%2BNLxUmZ3KyIWSHPmn6jtiAKTYOTii4BMu7zZ5YBIIad%2BJ98nQQ1q7DtInQtqOtTSjYkxi4%2BjuAgCH4%2BH2tFdw4Z94w%2BKvJk%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20220521T135546Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIA5SBCG4LASJEORGBI%2F20220521%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Signature=db8abfc707292cd3587cb76b7efa07f845c13c4c2794b9458eff61549f87cd7b").then((res) => res.arrayBuffer());
    // console.log(arrayBuffer);
    // const luminanceSource = new RGBLuminanceSource(arrayBuffer);
    // // const luminanceSource = new RGBLuminanceSource(new Uint8ClampedArray(arrayBuffer), 3024, 4032);
    // const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    // console.log(binaryBitmap);
    // reader.decode(binaryBitmap, hints);
    // console.log(reader);
    // console.log(hints);
    // const fileurl = "https://bluenotarybucket.s3.us-east-2.amazonaws.com/_back-state-id-small.jpg";
    // const fileurl = "https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/_back-state-id-small.jpg";
    // const fileurl = "https://bluenotarybucket.s3.us-east-2.amazonaws.com/1653009984695image.jpeg";
    // // const fileurl = "https://cors-fix.web.app/v1?url=https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/1651922185695blur-back.png";

    // const fileurl = "https://cors-fix.web.app/v1?url=https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/1653000285271License%20back.pdf.jpg";
    // const resp = await $axios.get(`https://cors-fix.web.app/v1?url=https://zxing.org/w/decode?u=${fileurl}`);
    // if (resp && resp.data && __.includes(resp.data, "Decode Succeeded")) {
    //   console.log("yes");
    // } else {
    //   console.log("no");
    // }
    // console.log(resp);

    // const myImage = new Image();
    // myImage.crossOrigin = "Anonymous";
    // myImage.src = "http://bluenotarybucket.s3.us-east-2.amazonaws.com/1649582404008IMG_0467.jpg";
    // // myImage.src = val;
    // myImage.onload = () => {
    //   const barcodeDetector = new window.BarcodeDetector({
    //   formats: [
    //       "aztec",
    //       "code_128",
    //       "code_39",
    //       "code_93",
    //       "codabar",
    //       "data_matrix",
    //       "ean_13",
    //       "ean_8",
    //       "itf",
    //       "pdf417",
    //       "qr_code",
    //       "upc_a",
    //       "upc_e"
    //     ]
    //   });
    //   console.log(myImage);
    //   barcodeDetector.detect(myImage)
    //     .then((barcodes) => {
    //       console.log(barcodes);
    //       barcodes.forEach((barcode) => console.log(barcode.rawData));
    //     })
    //     .catch((err) => {
    //       console.log(err);
    //     });
    // };

    // if (photoIdType === "back") {
    //   const chekingUrl = "https://cors-fix.web.app/v1?url=https://zxing.org/w/decode";
    //   const headers = {
    //     Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    //     // "Accept-Encoding": "gzip, deflate, br",
    //     // Host: "zxing.org",
    //     // Origin: "https://zxing.org",
    //     // Referer: "https://zxing.org/w/decode.jspx",
    //     "Content-Type": "multipart/form-data",
    //     // "Sec-Fetch-Dest": "document",
    //     // "Sec-Fetch-Mode": "navigate",
    //     // "Sec-Fetch-Site": "same-origin",
    //     // "Sec-Fetch-User": "?1",
    //     "Upgrade-Insecure-Requests": "1",
    //     // "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:100.0) Gecko/20100101 Firefox/100.0"
    //   };
    //   const tempFormData = new FormData();
    //   tempFormData.append("f", data);
    //   const response = await axios.post(chekingUrl, tempFormData, {
    //     headers,
    //   });
    //   console.log(response);
    // }

    // in watchers
    // async backPhoto (val) {
    //   console.log(val);
    //   if (val) {
    //     try {
    //       // const reader = new BrowserPDF417Reader();
    //       // const source = "https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/_back-state-id-small.jpg";
    //       // const resultImage = await reader.decodeFromImageUrl(source);
    //       // setInterval(async () => {
    //       //   console.log(document.querySelector("#frontPhotoIdDiv"));
    //       //   const resultImage = await reader.decodeFromImageElement(document.querySelector("#frontPhotoIdDiv").cloneNode(true));
    //       //   console.log(resultImage);
    //       // }, 5000);
    //       // const reader = new MultiFormatReader();
    //       // const url = "https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/_back-state-id-small.jpg";
    //       // const arrayBuffer = await fetch(`https://cors-fix.web.app/v1?url=${url}`).then((res) => {
    //       //   console.log(res.body);
    //       //   return res.arrayBuffer();
    //       // });
    //       // console.log(arrayBuffer);
    //       // const luminanceSource = new RGBLuminanceSource(1500, 1200, arrayBuffer);
    //       // const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    //       // const hints = new Map();
    //       // reader.decode(binaryBitmap, hints);
    //       // console.log(reader);
    //       // $axios.get("https://bluenotarybucket.s3.us-east-2.amazonaws.com/1649582404008IMG_0467.jpg", (resp) => {
    //       //   console.log(resp);
    //       //   // resp.setEncoding("base64");
    //       //   let fileData = "";
    //       //   resp.on("data", (data) => {
    //       //     fileData += data;
    //       //     console.log("downloading");
    //       //   });
    //       //   resp.on("end", async () => {
    //       //     console.log(fileData);
    //       //     // const luminanceSource = new RGBLuminanceSource(new Uint8ClampedArray(Buffer.from(fileData, "base64")), 3024, 4032);
    //       //     // const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    //       //     // reader.decode(binaryBitmap, hints);
    //       //   });
    //       // });
    //       // console.log(val);
    //       // val = "https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/1653219489297Screenshot%202022-03-17%20at%202.24.10%20PM.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5SBCG4LASZSHAL6N%2F20220522%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20220522T113809Z&X-Amz-Expires=518400&X-Amz-Signature=fd003c717f36385c1ba167cfff1c445accdc4b40d3c169ed1f28a284950f8b13&X-Amz-SignedHeaders=host";
    //       // // const fileurl = `https://cors-fix.web.app/v1?url=${val}`;
    //       // // const fileurl = "https://cors-fix.web.app/v1?url=https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/1650594395497image.jpg";
    //       // const resp = await $axios.get(`https://cors-fix.web.app/v1?url=https://zxing.org/w/decode?u=${encodeURIComponent(val)}`);
    //       // if (resp && resp.data && __.includes(resp.data, "Decode Succeeded")) {
    //       //   console.log("yes");
    //       //   this.backPhotoIdDecodeStatus = "success";
    //       // } else {
    //       //   console.log("no");
    //       //   this.backPhotoIdDecodeStatus = "failed";
    //       //   this.showBackPhotoIdErrorModal = true;
    //       // }
    //       // console.log(resp);
    //     } catch (error) {
    //       console.log(error);
    //       console.log("no");
    //       this.backPhotoIdDecodeStatus = "failed";
    //       this.showBackPhotoIdErrorModal = true;
    //     }
    //   } else {
    //     console.log("no val");
    //   }
    // }

</script>
