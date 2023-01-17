<template>
  <!-- modal preview of document -->
  <q-dialog ref="dialog" v-model="showSignatureDialogue">
    <q-card style="min-width: 80%">
      <q-card-section>
        <div class="text-h6">Select Notary Certificate</div>
      </q-card-section>

      <q-card-section class="q-pt-none" style="padding: 0px;">
        <div class="q-pa-md">
          <div class="q-gutter-y-md">
            <q-card>
              <q-tabs
                v-model="tab"
                dense
                class="text-grey"
                active-color="primary"
                indicator-color="primary"
                align="justify"
                narrow-indicator
              >
                <q-tab :ripple="false" name="choose" label="Choose" />
              </q-tabs>

              <q-separator />

              <q-tab-panels v-model="tab" animated>
                <q-tab-panel name="choose">
                  <div class="text-h6">Choose</div>
                  <div v-if="allNotaryCertificates.length" class="q-pa-md">
                    <div class="row">
                      <div v-for="notaryCertificate in allNotaryCertificates" :key="notaryCertificate._id" class="col-6">
                        <div class="innerTopSignatureCard" style="margin: 6px" :class="(selectedSignature._id === notaryCertificate._id) ? 'signaureSelectedClass':''">
                          <div class="innerSignatureCard" style="margin: 6px; border: 1px solid #d5ded7; border-radius: 10px; text-align: center" @click="signatureClicked(notaryCertificate)">
                            <img :src="notaryCertificate.url" alt="Signature" style="padding: 12px;" />
                            File Name: {{ notaryCertificate.name }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-tab-panel>
              </q-tab-panels>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          outline
          color="white"
          text-color="black"
          label="Cancel"
          @click="closeSignature()"
        />
        <q-btn
          v-close-popup
          outline
          label="Continue"
          color="primary"
          @click="submitSignature()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>

import Vue from "vue";
import VueSignaturePad from "vue-signature-pad";
import moment from "moment";
import _ from "lodash";
import VueEventBus from "../../plugins/eventbus.js";

Vue.use(VueSignaturePad);

export default {
  name: "NotaryCertificateSelectionComponent",
  components: {
  },
  props: {
    notaryCertificateSelectionDone: {
      type: Function,
      default: () => {}
    },
    firstTimeRender: {
      type: Boolean,
      default: false
    },
    openSignatureModel: {
      type: Boolean,
      default: false
    },
    elementId: {
      type: String,
      default: ""
    },
    allNotaryCertificates: {
        type: Array,
        default: () => []
    }
  },

  data() {
    return {
      showSignatureDialogue: false,
      tab: "choose",
      selectedSignature: {},
      moment
    };
  },

  computed: {
  },

  watch: {
    openSignatureModel: {
      handler(value) {
        if (value) {
          this.showSignatureDialogue = true;
        }
      }
    }
  },

  mounted() {
    if (this.firstTimeRender) {
      this.showSignatureDialogue = true;
    }
  },
  created() {
  },

  methods: {
    signatureClicked(signaturedoc) {
      console.log(signaturedoc);
      this.selectedSignature = signaturedoc;
    },
    clearSignature() {
      this.$refs.signaturePad.clearSignature();
    },
    undoSignature() {
      this.$refs.signaturePad.undoSignature();
    },
    closeSignature() {
      console.log(this.selectedSignature);
      this.$refs.dialog.hide();
      if (!(this.selectedSignature && this.selectedSignature.url)) {
        VueEventBus.$emit("REMOVE_ELEMENT", this.elementId);
      }
    },
    submitSignature() {
      let finalSingatureImage = false;
      if (_.isEmpty(this.selectedSignature)) {
          this.$q.notify({
          message: "Please draw or choose your signature.",
          color: "black"
          });
          return;
      }
      finalSingatureImage = this.selectedSignature.url;
      this.notaryCertificateSelectionDone(finalSingatureImage, this.selectedSignature.height, this.selectedSignature.width);
      this.$refs.dialog.hide();
      this.openSignatureModel = false;
    }
  }
};

</script>

<style type="text/css">
  .innerSignatureCard:hover {
    background: #e4f0e6;
  }
  .signaureSelectedClass {
    border: 1px solid #a5ada6;
    border-radius: 10px;
  }
</style>
