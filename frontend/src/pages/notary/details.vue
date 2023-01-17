<template>
  <q-page
    class="window-height window-width"
    style="
      background: url('https://bluenotary.us/assets/img/red-flower.jpg');
      background-size: 100%;
    "
  >
    <div class="row flex flex-center q-pa-lg">
      <div class="q-pa-lg bg-white">
        <div class="col-12 q-pb-lg">
          <h1>Notary Details</h1>
        </div>
        <div class="row">
          <div class="flex column">
            <div class="q-gutter-md q-pb-lg row">
              <q-select
                v-model="state"
                outlined
                :options="states"
                hint="State"
                :dense="dense"
                class="col-4"
              />
              <q-input
                v-model="commissionNumber"
                class="col-4"
                outlined
                hint="Notary Commission Number"
                :dense="dense"
              />
              <q-input
                v-model="commistionExpiration"
                outlined
                hint="Commission Expires On"
                mask="date"
                :rules="['date']"
                error-message="Invalid date"
                class="col"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy
                      ref="qDateProxy"
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-date
                        v-model="commistionExpiration"
                        @input="$refs.qDateProxy.hide()"
                      >
                        <div class="row items-center justify-end">
                          <q-btn
                            ref="closeBtn"
                            v-close-popup
                            label="Close"
                            color="primary"
                            flat
                          />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div v-if="certUploaded" class="q-gutter-md row">
              <small style="color: blue">{{ certFileName }} is uploaded.</small>
            </div>

            <div class="q-gutter-md row">
              <q-btn
                class="col"
                label="Upload Digital Certificate"
                style="height: 3.4rem"
                @click="$refs.digitalFileInput.$el.click()"
              />
              <q-file
                v-show="false"
                ref="digitalFileInput"
                v-model="digitalCertFile"
                standout
                color="primary"
                label="Add a document"
                accept=".p12, .pfx"
              />
            </div>
            <p class="flex flex-center q-pa-sm">
              <small>Only .p12 or .pfx extention accepted.</small>
            </p>
            <div class="q-gutter-md q-pb-lg row">
              <q-input
                v-model="dcpassword"
                class="col"
                outlined
                type="password"
                hint="Digital Certificate Password"
                :dense="dense"
              />
            </div>
            <div
              class="q-ma-lg flex-center row"
              style="display: grid"
            >
              <img
                v-if="sealImage"
                class="preview"
                :src="sealImage"
                alt="Seal"
              />
            </div>
            <div class="q-gutter-md q-pb-lg row">
              <q-btn
                class="btn q-mt-md col"
                label="Upload E-Notary Seal"
                style="height: 3.4rem"
                @click="$refs.sealFileInput.$el.click()"
              />
              <q-file
                v-show="false"
                ref="sealFileInput"
                v-model="sealFile"
                standout
                color="primary"
                label="Add a document"
                accept=".png, .jpg, .jpeg"
              />
            </div>
            <div class="q-gutter-md q-mt-lg q-mb-lg row">
              <div class="col-12">
                <h2>Signature</h2>
                <q-btn class="btn btn-primary q-mt-md" @click="showSignatureModal">Create Signature</q-btn>
                <signature-selection-component :open-signature-model="openSignatureModel" />
              </div>
            </div>
            <div class="q-gutter-md q-pb-lg row">
              <div class="col-6 text-faded">
                <span class="material-icons">help</span>&nbsp;
                <a
                  target="_blank"
                  href="https://www.identrust.com/wizard?nid=307"
                ><small>Don't have a digital certificate?</small></a
                >
              </div>
              <div class="col-6 text-faded">
                <span class="material-icons">help</span>&nbsp;
                <a
                  target="_blank"
                  href="https://www.nationalnotary.org/electronic-notary-seal"
                ><small>Don't have an eNotary seal?</small></a
                >
              </div>
            </div>
          </div>
        </div>
        <!-- next btn -->
        <q-btn
          class="next-btn q-mt-md"
          label="Update"
          color="primary"
          @click="nextButtonClick()"
        />
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";
import "cropperjs/dist/cropper.css";
import moment from "moment";
import states from "@/data/states.json";
import SignatureSelectionComponent from "../pdfedit/SignatureSelectionComponent.vue";

export default {
  name: "NotaryDetails",
  components: { SignatureSelectionComponent },
  data () {
    return {
      states,
    };
  },
  watch: {
    async digitalCertFile (val) {
      if (val) await this.addFile(val);
    },
    async sealFile (val) {
      if (val) await this.saveSealdata(val);
    }
  },
  async mounted () {
    const details = await this.loadDetail();
    if (details) {
      console.log(details);
      if (details.commissionExpiresOn > 0) {
          const dateString = moment.unix(details.commissionExpiresOn).format("YYYY/MM/DD");
          this.commistionExpiration = dateString;
        }
        if (details.sealdata && details.sealdata !== "") {
          this.sealImage = details.sealdata;
        }
        this.dcpassword = details.dcpassword;
    }
    this.commissionNumber = this.$user.commissionNumber;
    this.state = this.$user.state;
  },
  setup () {
    const loading = ref(false);
    const openSignatureModel = ref(false);
    const certUploaded = ref(false);
    const sealUploaded = ref(false);
    const state = ref("");
    const commissionNumber = ref("");
    const dense = ref(false);
    const date = ref("");
    const commistionExpiration = ref("");
    const digitalCertFile = ref(null);
    const dcpassword = ref("");
    const sealFile = ref(null);
    const sealImage = ref(null);
    const certFileName = ref("");
    const sealFileName = ref("");
    const fileUrl = ref(null);
    const saveDetail = async (data) => {
      try {
        const url = "notary/detail";
        const response = await $axios.post(url, { data }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const loadDetail = async (sessionId) => {
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
    };

    const fileUpload = async (data) => {
      try {
        const url = "file/notaryFileUpload";
        const formData1 = new FormData();
        formData1.append("file", data);
        const response = await $axios.post(url, formData1, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        certFileName.value = data.name;
        certUploaded.value = true;
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const saveSealdata = async (data) => {
      try {
        const url = "file/sealdata";
        const formData = new FormData();
        formData.append("file", data);
        const response = await $axios.post(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        sealUploaded.value = true;
        sealFile.value = null;
        sealImage.value = response.data.file;
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const addFile = async (e) => {
      try {
        await fileUpload(e);
        digitalCertFile.value = null;
      } catch (error) {
        console.log("error", error);
      }
    };

    return {
      loading,
      state,
      commissionNumber,
      dense,
      date,
      commistionExpiration,
      certUploaded,
      certFileName,
      sealFileName,
      sealUploaded,
      sealImage,
      saveDetail,
      loadDetail,
      fileUpload,
      addFile,
      digitalCertFile,
      sealFile,
      dcpassword,
      fileUrl,
      saveSealdata,
      openSignatureModel
    };
  },
  methods: {
    closeDatePicker () {
      console.log(this.$refs.closeBtn.click());
    },
    async nextButtonClick () {
      console.log("Next button clicked");
      if (!this.commissionNumber) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please enter notary commission number",
        });
      }
      if (!this.commistionExpiration) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please select a date of commission expires.",
        });
      }
      if (!this.state) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please select your state.",
        });
      }
      const data = {
        commissionExpiresOn: moment(this.commistionExpiration, "YYYY/MM/DD", true).unix(),
        dcpassword: this.dcpassword,
        state: this.state,
        commissionNumber: this.commissionNumber,
      };
      const res = await this.saveDetail(data);
      console.log("res ", res);
      const details = await this.loadDetail();
      await this.$store.dispatch("auth/fetchUser");
      console.log(details);
      this.$q.notify({
        type: "positive",
        position: "bottom-right",
        message: "Thank you for updating your notary details.",
      });
      return this.$router.replace("/notary/account-settings/");
    },
    showSignatureModal() {
      this.openSignatureModel = false;
      setTimeout(() => {
        this.openSignatureModel = true;
      }, 200);
    },
  }
};
</script>
