<template>
  <q-dialog ref="dialog" v-model="showUpgradeDialogue">
    <q-card class="q-ma-lg" style="max-width: 90%;">
      <q-card-section class="row items-center q-pb-none">
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="q-pa-md">
          <div class="row">
            <div class="col-12 col-md-4 q-pt-sm">
              <div class="q-gutter-y-md">
                <div class="row q-pb-lg" style="border-bottom: 1px solid gray">
                  <div class="col-2 offset-1">
                    <img src="~assets/wax-stamp.png" style="width:auto" />
                  </div>
                  <div class="q-pt-sm col-5 offset-1">
                    <h1><strong>Business Basic</strong></h1>
                    <h2 class="q-py-sm">$7 / month </h2>
                    <p><small>Cancel anytime.</small></p>
                  </div>
                </div>
                <div class="card-body row q-px-md">
                  <ul class="list-group list-group-flush col">
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        preview
                      </div>
                      &nbsp;
                      <div>
                        <strong>Access your clients'</strong> notarized docs
                      </div>
                    </li>
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        dashboard_customize
                      </div>
                      &nbsp;
                      <div>
                        <strong>Admin dash history</strong> and audit logs
                      </div>
                    </li>
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        contact_mail
                      </div>
                      &nbsp;
                      <div>Send <strong>branded invite emails </strong></div>
                    </li>
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        library_add
                      </div>
                      &nbsp;
                      <div>
                        Add <strong>multiple participants/documents</strong>
                      </div>
                    </li>
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        class
                      </div>
                      &nbsp;
                      <div><strong>Reusuable</strong> template library</div>
                    </li>
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        chat
                      </div>
                      &nbsp;
                      <div><strong>Priority chat/email support</strong></div>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="text-center">
                <q-btn
                  v-if="$user.memberType !== 'pro'"
                  label="Upgrade to Basic"
                  color="green"
                  class="q-px-xl"
                  :loading="loading"
                  @click="upgradeToPro('business_basic')"
                />
              </div>
            </div>
            <div class="col-12 col-md-4 q-pt-sm">
              <div class="q-gutter-y-md">
                <div class="row q-pb-lg" style="border-bottom: 1px solid gray">
                  <div class="col-2 offset-1">
                    <img src="~assets/wax-stamp.png" style="width:auto" />
                  </div>
                  <div class="q-pt-sm col-6 offset-1">
                    <h1><strong>Business Pro</strong></h1>
                    <h2 class="q-py-sm">$47 / month </h2>
                    <p><small>Cancel anytime.</small></p>
                  </div>
                </div>
                <div class="card-body row q-px-md">
                  <ul class="list-group list-group-flush col">
                    <li class="list-group-item">
                      <div style="display: flex; align-items: center">
                        <div class="material-icons" style="font-size: 4rem">
                          support_agent
                        </div>
                        &nbsp;
                        <div>
                          <strong> BYON (Bring Your Own Notary)</strong>
                        </div>
                      </div>
                      <ul class="list-group">
                        <li class="list-group-item" style="display: flex;align-items: center;padding-left: 0;padding-right: 0;margin-left: 0;margin-right: 0;">
                          <div class="material-icons" style="font-size: 4rem">
                            task_alt
                          </div>
                          &nbsp;
                          <div>
                            <strong>
                              2 free notarizations per month; $13 per
                              notarization thereafter</strong
                            >
                          </div>
                        </li>
                        <li class="list-group-item" style="display: flex;align-items: center;padding-left: 0;padding-right: 0;margin-left: 0;margin-right: 0;">
                          <div class="material-icons" style="font-size: 4rem">
                            task_alt
                          </div>
                          &nbsp;
                          <div>
                            Or use BlueNotary certified notary network; $27 per
                            notarization
                          </div>
                        </li>
                      </ul>
                    </li>
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        groups
                      </div>
                      &nbsp;
                      <div><strong>Add your team</strong> (up to 1 seat)</div>
                    </li>
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        contact_mail
                      </div>
                      &nbsp;
                      <div><strong>Witness as a Service</strong></div>
                    </li>
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        library_books
                      </div>
                      &nbsp;
                      <div>
                        <strong>Automated document tagging </strong>and
                        templates
                      </div>
                    </li>
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        approval
                      </div>
                      &nbsp;
                      <div>
                        <strong> Guided onboarding and training</strong> for
                        your team
                      </div>
                    </li>
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        approval
                      </div>
                      <div><strong> Dedicated account manager </strong></div>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="text-center">
                <q-btn
                  label="Upgrade to Pro"
                  color="blue"
                  class="q-px-xl"
                  :loading="loading"
                  @click="upgradeToPro('business_pro')"
                />
              </div>
            </div>
            <div class="col-12 col-md-4 q-pt-sm">
              <div class="q-gutter-y-md">
                <div class="row q-pb-lg" style="border-bottom: 1px solid gray">
                  <div class="col-2 offset-1">
                    <img src="~assets/wax-stamp.png" style="width:auto" />
                  </div>
                  <div class="q-pt-sm col-6 offset-1">
                    <h1><strong>Business Premium</strong></h1>
                    <h2 class="q-py-sm">$147 / month </h2>
                    <p><small>Cancel anytime.</small></p>
                  </div>
                </div>
                <div class="card-body row q-px-md">
                  <ul class="list-group list-group-flush col">
                    <li class="list-group-item">
                      <div style="display: flex; align-items: center">
                        <div class="material-icons" style="font-size: 4rem">
                          support_agent
                        </div>
                        &nbsp;
                        <div>
                          <strong> BYON (Bring Your Own Notary)</strong>
                        </div>
                      </div>
                      <ul class="list-group">
                        <li class="list-group-item" style="display: flex;align-items: center;padding-left: 0;padding-right: 0;margin-left: 0;margin-right: 0;">
                          <div class="material-icons" style="font-size: 4rem">
                            task_alt
                          </div>
                          &nbsp;
                          <div>
                            <strong>
                              7 free notarizations per month; $13 per
                              notarization thereafter</strong
                            >
                          </div>
                        </li>
                        <li class="list-group-item" style="display: flex;align-items: center;padding-left: 0;padding-right: 0;margin-left: 0;margin-right: 0;">
                          <div class="material-icons" style="font-size: 4rem">
                            task_alt
                          </div>
                          &nbsp;
                          <div>
                            Or use BlueNotary certified notary network; $27 per
                            notarization
                          </div>
                        </li>
                      </ul>
                    </li>
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        groups
                      </div>
                      &nbsp;
                      <div><strong>Add your team</strong> (up to 3 seats)</div>
                    </li>
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        contact_mail
                      </div>
                      &nbsp;
                      <div><strong>Witness as a Service</strong></div>
                    </li>
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        library_books
                      </div>
                      &nbsp;
                      <div>
                        <strong>Automated document tagging </strong>and
                        templates
                      </div>
                    </li>
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        approval
                      </div>
                      &nbsp;
                      <div>
                        <strong> Guided onboarding and training</strong> for
                        your team
                      </div>
                    </li>
                    <li class="list-group-item" style="display: flex; align-items: center">
                      <div class="material-icons" style="font-size: 4rem">
                        approval
                      </div>
                      <div><strong> Dedicated account manager </strong></div>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="text-center">
                <q-btn
                  label="Upgrade to Premium"
                  color="blue"
                  class="q-px-xl"
                  :loading="loading"
                  @click="upgradeToPro('business_hybrid')"
                />
              </div>
            </div>
          </div>
          <p class="q-ma-xl text-center">Need something more? <a target="_blank" href="https://bluenotary.us/contact-sales">Contact Sales</a></p>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { loadStripe } from "@stripe/stripe-js/pure";
import VueEventBus from "../../plugins/eventbus.js";

export default {
  name: "UpgradeCustomerAccountPopupComponent",
  components: {},
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
      loading: false,
      showUpgradeDialogue: false,
    };
  },

  computed: {
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
     async upgradeToPro(type) {
      console.log("NotaryHeader", this.stripe);
      this.loading = true;
      if (process.env.STRIPE_PUBLIC_KEY_TEST) {
        if (!this.stripe) {
          if (this.$user.testingacc) {
            const pubkey = process.env.STRIPE_PUBLIC_KEY_TEST;
            this.stripe = await loadStripe(pubkey);
          } else {
            const pubkey = process.env.STRIPE_PUBLIC_KEY;
            this.stripe = await loadStripe(pubkey);
          }
        }
      }
      this.loading = false;
      try {
        const { data } = await this.axios.post("/business/checkout-session", { memberType: type });
        console.log("fpr - upgrade pro referral", this.$user.email, this.$user._id);
        window.fpr("referral", { email: this.$user.email, uid: this.$user._id });
        return this.stripe.redirectToCheckout({ sessionId: data.id });
      } catch (error) {
        return error;
      }
    },
    closeDialogue() {
      this.$refs.dialog.hide();
      if (!this.imageData) {
        VueEventBus.$emit("REMOVE_ELEMENT", this.elementId);
      }
    }
  }
};

</script>
