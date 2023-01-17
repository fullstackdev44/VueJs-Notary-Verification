<template>
  <q-dialog ref="dialog" v-model="showAddWitnessModal" persistent>
    <q-card>
      <q-card-section>
        <h5>
          Add a witness to this session
        </h5>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="row">
          <div class="col-12">
            <q-radio v-model="witnessSelectionType" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="old_witness" label="My Witnesses" />
            <q-radio v-model="witnessSelectionType" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="new_witness" label="Add New Witness" />
            <q-radio v-model="witnessSelectionType" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="bn_witness_open_call" label="BlueNotary Witness" />
          </div>
          <div v-if="witnessSelectionType === 'bn_witness_open_call'" class="col-12 row q-mt-md">
            <div class="col-2 q-ml-sm">
              <img src="https://bluenotary.us/assets/img/logo-b3.png" />
            </div>
            <p v-if="witnessSelectionType === 'bn_witness_open_call'" class="q-px-md col-9">We will call a notary in our network to serve as a witness for the session. The fee is $10 for this service. </p>
            <p v-if="witnessSelectionType === 'new_witness'" class="q-px-md col-9">We will call a notary in our network to serve as a witness for the session. The fee is $0 for this service. </p>
          </div>
          <div v-if="witnessSelectionType === 'old_witness'" class="col-12">
            <q-select
              v-model="witnessSelectionOptions.selectedValue"
              filled
              label="Select Witness to Add to Session"
              :options="witnessSelectionOptions.data"
              style="width: 500px"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No results
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
          <template v-if="witnessSelectionType === 'new_witness'">
            <div class="column is-6">
              <q-input v-model="currentWitnessModal.firstName" outlined label="First Name" :rules="[val => !!val || 'Field is required']">
                <template v-slot:prepend>
                  <q-icon name="account_circle" />
                </template>
              </q-input>
            </div>
            <div class="column is-6">
              <q-input v-model="currentWitnessModal.lastName" outlined label="Last Name" :rules="[val => !!val || 'Field is required']">
                <template v-slot:prepend>
                  <q-icon name="badge" />
                </template>
              </q-input>
            </div>
            <div class="column is-6">
              <q-input v-model="currentWitnessModal.email" outlined label="Email" :rules="[val => !!val || 'Field is required']">
                <template v-slot:prepend>
                  <q-icon name="email" />
                </template>
              </q-input>
            </div>
            <div class="column is-6">
              <q-input v-model="currentWitnessModal.phoneNumber" outlined label="Phone Number">
                <template v-slot:prepend>
                  <q-icon name="phone" />
                </template>
              </q-input>
            </div>
            <div class="column is-12">
              <h5 class="">Residential Address</h5>
              <p class="q-mb-md">
                If you changed your residential address less than 30 days
                ago, please enter your previous address.
              </p>
              <div class="row q-gutter-sm">
                <q-input
                  v-model="currentWitnessModal.witnessAdressLine1"
                  class="col-12 col-md-9"
                  outlined
                  hint="Address Line 1"
                />
                <!-- <q-input
                    v-model="currentWitnessModal.witnessAdressLine2"
                    class="col-md-4 col-12"
                    outlined
                    hint="Address Line 2"
                  /> -->
                <q-select
                  v-model="currentWitnessModal.witnessAddressState"
                  :options="states"
                  class="col-md-3 col-4"
                  outlined
                  hint="State"
                />
                <q-input
                  v-model="currentWitnessModal.witnessAddressZipCode"
                  class="col-md-2 col-6"
                  outlined
                  hint="Zip Code"
                />
              </div>
            </div>
            <p class="q-px-md">We will send an email to the witness with instructions about how to join the session.</p>
          </template>
        </div>
      </q-card-section>
      <q-card-actions align="center" class="q-mb-lg">
        <q-btn rounded outline color="blue" class="q-pa-sm" label="Add Witness" :disable="disableAddWitnessSaveButton" @click="addWitnessSaveClicked" />
        <q-btn outline label="Cancel" @click="closeAddWitnessModal" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
// import { ref } from "@vue/composition-api";
// import { $axios } from "boot/axios";
import _ from "lodash";

import states from "@/data/states.json";

export default {
  name: "AddWitnessComponent",
  props: {
    openAddWitnessModal: {
      type: Boolean,
      default: false,
    },
    notaryData: {
      type: Object,
      default: () => {}
    },
    socketRequest: {
      type: Function,
      default: () => {}
    },
    getSessionWitnessDetails: {
      type: Function,
      default: () => {}
    },
    closeAddWitnessModal: {
      type: Function,
      default: () => {}
    },
    disableAddWitnessSaveButton: {
      type: Boolean,
      default: false,
    },
    sessionid: {
      type: String,
      default: ""
    },
    calledFrom: {
      type: String,
      default: ""
    },
    addWitnessModalSaveClickedNonPdfSession: {
      type: Function,
      default: () => {}
    }
  },

  data() {
    return {
      states,
      showAddWitnessModal: false,
      currentWitnessModal: {
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        witnessAdressLine1: "",
        // witnessAdressLine2: "",
        witnessAddressState: "",
        witnessAddressZipCode: "",
      },
      allWitnesses: [],
      witnessSelectionType: "old_witness",
      witnessSelectionOptions: {
        loading: true,
        dataFetched: false,
        data: [],
        selectedValue: []
      },
    };
  },

  computed: {},

  watch: {
    openAddWitnessModal: {
      handler(value) {
        if (value) {
          this.showAddWitnessModal = true;
        } else {
          this.showAddWitnessModal = false;
        }
      },
    },
  },

  methods: {
    closeDialogue() {
      this.$refs.dialog.hide();
    },
    async addWitnessSaveClicked() {
      console.log(this.currentWitnessModal);
      const saveUrl = "session/addWitnessDuringSession";
      const dataToSave = {
        sessionid: this.sessionid
      };
      if (this.witnessSelectionType === "old_witness") {
        console.log("this.witnessSelectionOptions.selectedValue", this.witnessSelectionOptions.selectedValue);
        if (!this.witnessSelectionOptions.selectedValue._id) {
          this.$q.notify({
            color: "red",
            position: "bottom-right",
            message: "Please select a witness to add to the session",
          });
          return;
        }
        dataToSave.witnessDetails = {
          id: this.witnessSelectionOptions.selectedValue._id
        };
      } else if (this.witnessSelectionType === "bn_witness_open_call") {
        dataToSave.witnessDetails = {
          witnessSelectionType: "bn_witness_open_call"
        };
      } else {
        let fieldNotFilled = false;
        _.map(this.currentWitnessModal, (witnessValue, witnessField) => {
          if (!witnessValue && witnessField !== "phoneNumber") {
            fieldNotFilled = witnessField;
          }
        });
        if (fieldNotFilled) {
          this.$q.notify({
            color: "red",
            position: "bottom-right",
            message: `${fieldNotFilled} is a required field`,
          });
          return;
        }
        dataToSave.witnessDetails = this.currentWitnessModal;
      }
      if (this.calledFrom === "pdfedit") {
        const response = await this.axios.post(saveUrl, dataToSave, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log(response);
      } else {
        this.addWitnessModalSaveClickedNonPdfSession(dataToSave);
      }
      this.showAddWitnessModal = false;
      let notifyMessage = "Witness added Successfully";
      if (this.witnessSelectionType === "bn_witness_open_call") {
        notifyMessage = "An Open call for BN Witness is sent. If someone is available, they will join";
      }
      this.$q.notify({
        color: "primary",
        position: "bottom-right",
        message: notifyMessage,
      });
      this.closeAddWitnessModal();
      if (this.calledFrom !== "pdfedit") {
        return;
      }
      if (this.witnessSelectionType === "bn_witness_open_call") {
        this.socketRequest("new_session_witness_open_call");
        const dataToSend = {
          sessionid: this.sessionid
        };
        if (window.currentSocket) {
          window.currentSocket.emit("serverSessionActivityChanged", dataToSend, (res) => {
            console.log("res", res);
          });
        }
      } else {
        this.getSessionWitnessDetails();
        this.socketRequest("session_witness_management_changed");
      }
    },
  },
};
</script>
