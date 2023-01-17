<template>
  <q-dialog ref="dialog" v-model="showApprovalLSADialogue" style="width: 70%">
    <q-card class="q-ma-lg" style="width: 700px; max-width: 80vw;">
      <q-card-section class="row items-center q-pb-none">
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>
      <q-card-section v-if="!$user.lsaApprovalStatus" class="q-pt-none">
        <div class="q-pb-lg">
          <h2 class="text-center">
            <strong>Apply for LSA (Loan Signing Agent)</strong>
          </h2>
        </div>

        <div class="q-mx-sm" style="margin-bottom: 24px">
          <q-icon name="info" color="blue" class="q-mr-xs" />
          <small><a href="https://bluenotary.crisp.help/en/article/lsa-approval-process-for-loan-signing-open-calls-k1337a/" target="_blank"><u>More Details regarding LSA Approval?</u></a></small>
        </div>

        <div class="row q-ml-md">
          <!-- <div class="col-12 q-pb-sm">
            <div class="q-pb-sm">
              <h3>100 RONs completed Proof File</h3>
            </div>
            <div
              class="file-drop-zone"
              @drop.prevent
              @dragover.prevent
              @dragenter.prevent
              @dragleave.prevent
            >
              <div id="article">
                <div v-if="uploadingRONProofFile">
                  <q-spinner color="primary" size="3em" />
                  <p class="no-margin q-pt-md text-faded">
                    Uploading document, please wait...
                  </p>
                </div>
                <div v-if="!uploadingRONProofFile">
                  <q-btn
                    class="browse-btn"
                    label="Upload 100 RONs completed Proof File"
                    outline
                    @click="$refs.completedRONProofFileInput.$el.click()"
                  />
                  <q-file
                    v-show="false"
                    ref="completedRONProofFileInput"
                    v-model="uploadRONProofFile"
                    standout
                    outline
                    label="Add a document"
                    accept=".jpg, .jpeg, .png, .pdf"
                  />
                </div>
                <small class="flex row q-pa-sm">
                  jpg, jpeg, png, pdf accepted.
                </small>
              </div>
              <div v-if="uploadRONProofFile && !uploadingRONProofFile">
                <q-icon name="check_circle" color="green" style="font-size:2rem;padding:10px;" />
                <u>{{ uploadRONProofFile.name }}</u>
              </div>
              <div v-else-if="notaryData && notaryData.hundredRONcompletionProofName && !uploadingRONProofFile">
                <q-icon name="check_circle" color="green" style="font-size:2rem;padding:10px;" />
                <a :href="notaryData.hundredRONcompletionProofUrl" target="_blank"><u>{{ notaryData.hundredRONcompletionProofName }}</u></a>
              </div>
            </div>
          </div> -->
          <div class="col-12 q-pb-sm">
            <div class="q-pb-sm" style="margin-top: 18px">
              <h3>Loan Signing Notarisation Experience</h3>
            </div>
            <div>
              <q-input
                v-model="loanSigningRONExperience"
                filled
                type="textarea"
                placeholder="Write a statement outlining your experience and qualifications for RON loan signing. Why should we trust that you will be able to deliver quality professional service for our clients? Please include as many details as possible. *We highly favor experience that includes at least 50 RON sessions (GNW or LS) and in-person loan signing experience."
              />
            </div>
          </div>
          <div class="col-12 q-pb-sm">
            <div class="q-pb-sm" style="margin-top: 18px">
              <h3>LSA Approval Letter Proof File</h3>
            </div>
            <div
              class="file-drop-zone"
              @drop.prevent
              @dragover.prevent
              @dragenter.prevent
              @dragleave.prevent
            >
              <div id="article">
                <div v-if="uploadingLSAProofFile">
                  <q-spinner color="primary" size="3em" />
                  <p class="no-margin q-pt-md text-faded">
                    Uploading document, please wait...
                  </p>
                </div>
                <div v-if="!uploadingLSAProofFile">
                  <q-btn
                    class="browse-btn"
                    label="Upload LSA Approval Letter Proof File"
                    outline
                    @click="$refs.approvalLSAProofFileInput.$el.click()"
                  />
                  <q-file
                    v-show="false"
                    ref="approvalLSAProofFileInput"
                    v-model="uploadLSAProofFile"
                    standout
                    outline
                    label="Add a document"
                    accept=".jpg, .jpeg, .png, .pdf"
                  />
                </div>
                <small class="flex row q-pa-sm">
                  jpg, jpeg, png, pdf accepted.
                </small>
              </div>
              <div v-if="uploadLSAProofFile && !uploadingLSAProofFile">
                <q-icon name="check_circle" color="green" style="font-size:2rem;padding:10px;" />
                <u>{{ uploadLSAProofFile.name }}</u>
              </div>
              <div v-else-if="notaryData && notaryData.lsaApprovalLetterName && !uploadingRONProofFile">
                <q-icon name="check_circle" color="green" style="font-size:2rem;padding:10px;" />
                <a :href="notaryData.lsaApprovalLetterUrl" target="_blank"><u>{{ notaryData.lsaApprovalLetterName }}</u></a>
              </div>
            </div>
          </div>
          <div class="col-12 q-pb-sm">
            <div class="q-pb-sm" style="margin-top: 18px">
              <h3>Proof of E&O insurance of at least $100k</h3>
            </div>
            <div
              class="file-drop-zone"
              @drop.prevent
              @dragover.prevent
              @dragenter.prevent
              @dragleave.prevent
            >
              <div id="article">
                <div v-if="uploadingEOInsuranceFile">
                  <q-spinner color="primary" size="3em" />
                  <p class="no-margin q-pt-md text-faded">
                    Uploading document, please wait...
                  </p>
                </div>
                <div v-if="!uploadingEOInsuranceFile">
                  <q-btn
                    class="browse-btn"
                    label="Upload Proof of E&O"
                    outline
                    @click="$refs.eoInsuranceFile.$el.click()"
                  />
                  <q-file
                    v-show="false"
                    ref="eoInsuranceFile"
                    v-model="uploadEOInsuranceFile"
                    standout
                    outline
                    label="Add a document"
                    accept=".jpg, .jpeg, .png, .pdf"
                  />
                </div>
                <small class="flex row q-pa-sm">
                  jpg, jpeg, png, pdf accepted.
                </small>
              </div>
              <div v-if="uploadEOInsuranceFile && !uploadingEOInsuranceFile">
                <q-icon name="check_circle" color="green" style="font-size:2rem;padding:10px;" />
                <u>{{ uploadEOInsuranceFile.name }}</u>
              </div>
              <div v-else-if="notaryData && notaryData.eoInsuranceProofName && !uploadingEOInsuranceFile">
                <q-icon name="check_circle" color="green" style="font-size:2rem;padding:10px;" />
                <a :href="notaryData.eoInsuranceProofUrl" target="_blank"><u>{{ notaryData.eoInsuranceProofName }}</u></a>
              </div>
            </div>
          </div>
          <div class="col-12 q-pb-sm">
            <q-checkbox
              v-model="isSpanishLanguageFluency"
              size="md"
              style="font-size: 1rem"
              label="Spanish Language Fluency"
            />
          </div>
        </div>
      </q-card-section>
      <div v-else style="text-align: center">
        <div v-if="$user.lsaApprovalStatus === 'approval_pending'">
          Your application is under Review
        </div>
        <div v-else-if="$user.lsaApprovalStatus === 'rejected'">
          Your application is under Review
        </div>
        <div v-else-if="$user.lsaApprovalStatus === 'approved'">
          Your application is Accepted. You can now pick up open calls for Loan Signings
        </div>
      </div>
      <q-card-section align="right">
        <q-btn
          v-if="!$user.lsaApprovalStatus"
          outline
          :loading="submitLoading"
          label="Send For LSA Approval"
          color="primary"
          @click="lsaApprovalClicked"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
// import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";

export default {
  name: "LsaApprovalInputModal",
  props: {
    openAppLsaModel: {
      type: Boolean,
      default: false,
    },
    notaryData: {
      type: Object,
      default: () => {}
    }
  },

  data() {
    return {
      showApprovalLSADialogue: false,
      uploadingRONProofFile: false,
      uploadingLSAProofFile: false,
      uploadingEOInsuranceFile: false,
      isSpanishLanguageFluency: false,
      submitLoading: false,
      uploadRONProofFile: null,
      uploadLSAProofFile: null,
      uploadEOInsuranceFile: null,
      lsaApprovalSubmitted: false,
      lsaApprovalSubmittedAt: "",
      lsaApproved: false,
      loanSigningRONExperience: ""
    };
  },

  computed: {},

  watch: {
    openAppLsaModel: {
      handler(value) {
        if (value) {
          this.showApprovalLSADialogue = true;
        }
      },
    },

    uploadRONProofFile: {
      async handler(value) {
        console.log("value", value);
        this.uploadingRONProofFile = true;
        if (value) {
          await this.uploadHundredRONDocument(value);
        }
        this.uploadingRONProofFile = false;
      },
    },

    uploadLSAProofFile: {
      async handler(value) {
        this.uploadingLSAProofFile = true;
        if (value) {
          await this.uploadLSADocument(value);
        }
        this.uploadingLSAProofFile = false;
      },
    },

    uploadEOInsuranceFile: {
      async handler(value) {
        this.uploadingEOInsuranceFile = true;
        if (value) {
          await this.uploadEOInsuranceDocument(value);
        }
        this.uploadingEOInsuranceFile = false;
      },
    },
  },

  methods: {
    async uploadLSADocument() {
      const url = "file/notaryLSALetter";
      const formData = new FormData();
      formData.append("file", this.uploadLSAProofFile);
      // formData.append("spanishLanguage", this.isSpanishLanguageFluency);
      const response = await $axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    async uploadHundredRONDocument() {
      const url = "file/notaryHundredRONCompletionLetter";
      const formData = new FormData();
      formData.append("file", this.uploadRONProofFile);
      // formData.append("spanishLanguage", this.isSpanishLanguageFluency);
      const response = await $axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    async uploadEOInsuranceDocument() {
      const url = "file/notaryEOInsuranceDocument";
      const formData = new FormData();
      formData.append("file", this.uploadEOInsuranceFile);
      // formData.append("spanishLanguage", this.isSpanishLanguageFluency);
      const response = await $axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },

    closeDialogue() {
      this.$refs.dialog.hide();
    },

    async lsaApprovalClicked() {
      this.submitLoading = true;
      const dataToSend = {
        spanishLanguageFluency: this.isSpanishLanguageFluency,
        loanSigningRONExperience: this.loanSigningRONExperience
      };
      try {
        const response = await $axios.post("notary/sendForNotaryLSAApproval", dataToSend, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log(response);
        this.submitLoading = false;
        this.closeDialogue();
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        this.submitLoading = false;
      }
    },
  },
};
</script>
