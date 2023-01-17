<template>
  <q-dialog ref="dialog" v-model="showUpgradeDialogue">
    <q-card class="q-ma-lg">
      <q-card-section class="row items-center q-pb-none">
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="q-pa-md">
          <div class="q-gutter-y-md">
            <div class="row q-pb-lg" style="border-bottom: 1px solid gray">
              <div class="col-2 offset-1">
                <img src="~assets/wax-stamp.png" style="width:auto" />
              </div>
              <div class="q-pt-sm col-5 offset-1">
                <h1><strong>Pro Hybrid Plan</strong></h1>
                <h2 class="q-py-sm">${{ proHybridPlanCost }} / month </h2>
                <p><small>Cancel anytime.</small></p>
              </div>
            </div>
            <div class="card-body row q-px-md">
              <ul class="list-group list-group-flush col">
                <li class="list-group-item" style="margin: 0">
                  <div style="display: flex; align-items: center">
                    <span class="material-icons" style="font-size:4rem">
                      history_edu
                    </span>
                    &nbsp;
                    <div><strong>Unlimited Loan Signings</strong></div>
                  </div>
                  <ul class="list-group" style="margin: 0; padding: 0">
                    <li class="list-group-item" style="margin: 0;display: flex;align-items: center;padding-left: 0;">
                      <div class="material-icons" style="font-size: 4rem">
                        task_alt
                      </div>
                       &nbsp;
                      <div>
                        BlueNotary service fee of
                        <em>$25 per signing package</em>
                      </div>
                    </li>
                    <li class="list-group-item" style="margin: 0;display: flex;align-items: center;padding-left: 0;">
                      <div class="material-icons" style="font-size: 4rem">
                        task_alt
                      </div>
                      &nbsp;
                      <div>Unlimited seals, no fee</div>
                    </li>
                  </ul>
                </li>
                <li class="list-group-item" style="margin: 0">
                  <div style="display: flex; align-items: center">
                    <div class="material-icons" style="font-size: 4rem">
                      ring_volume
                    </div>
                    &nbsp;
                    <div><strong>BlueNotary incoming Requests</strong></div>
                  </div>
                  <ul class="list-group" style="padding: 0">
                    <li class="list-group-item" style="margin: 0; padding-left: 0; padding-right: 0">
                      <div>You can pick up open-call requests from</div>
                      <div><strong>BlueNotary-sourced clients</strong></div>
                      <div>and/or BYOC (Bring your own clients)</div>
                    </li>
                  </ul>
                </li>
                <li class="list-group-item" style="margin: 0; display: flex; align-items: center">
                  <div class="material-icons" style="font-size: 4rem">
                    price_check
                  </div>
                  &nbsp;
                  <div>
                    Add your own <strong>custom fees</strong> for any session
                  </div>
                </li>
                <li class="list-group-item" style="margin: 0; display: flex; align-items: center">
                  <div class="material-icons" style="font-size: 4rem">
                    contact_mail
                  </div>
                  &nbsp;
                  <div>Send <strong>branded invite emails</strong></div>
                </li>
                <li class="list-group-item" style="margin: 0; display: flex; align-items: center">
                  <div class="material-icons" style="font-size: 4rem">
                    library_add
                  </div>
                  &nbsp;
                  <div>
                    Add <strong>multiple participants/documents</strong>
                  </div>
                </li>
                <li class="list-group-item" style="margin: 0; display: flex; align-items: center">
                  <div class="material-icons" style="font-size: 4rem">
                    library_books
                  </div>
                  &nbsp;
                  <div>
                    <strong> Templates library</strong> for pre-tagging
                    documents
                  </div>
                </li>
                <li class="list-group-item" style="margin: 0; display: flex; align-items: center">
                  <div class="material-icons" style="font-size: 4rem">
                    approval
                  </div>
                  &nbsp;
                  <div>
                    <strong> Free</strong> e-seal & digital certificate ($86+
                    value)
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div class="col-12 q-pt-sm">
            <UpgradeToProComponent />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import VueEventBus from "../../plugins/eventbus.js";
import UpgradeToProComponent from "../../components/UpgradeToProComponent.vue";

export default {
  name: "UpgradeAccountPopupComponent",
  components: { UpgradeToProComponent },
  props: {
    elementId: {
      type: String,
      default: ""
    },
    openAccProModel: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      showUpgradeDialogue: false,
    };
  },

  computed: {
    proHybridPlanCost() {
      let cost = "27";
      if (this.$vendorDoc?.proSubscriptionSettings?.subscriptionCost) {
        cost = this.$vendorDoc?.proSubscriptionSettings?.subscriptionCost;
      }
      return cost;
    }
  },

  watch: {
    openAccProModel: {
      handler(value) {
        if (value) {
          this.showUpgradeDialogue = true;
        }
      }
    }
  },

  mounted() {
    // this.showUpgradeDialogue = true;
  },
  created() {
  },

  methods: {
    closeDialogue() {
      this.$refs.dialog.hide();
      if (!this.imageData) {
        VueEventBus.$emit("REMOVE_ELEMENT", this.elementId);
      }
    }
  }
};

</script>
