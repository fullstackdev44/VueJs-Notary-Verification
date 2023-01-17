<template>
  <q-page class="q-pa-md flex-center session-container">
    <div class="row">
      <div v-if="!calledFromInviteSignerPage" class="col-12 col-md-12">
        <session-header :session-id="sessionid" />
      </div>
      <div class="col-12 col-md-12 q-pa-lg workflow-container">
        <session-input-header v-if="!calledFromBusinessPage && !calledFromInviteSignerPage" current-stage="payment_info" :hide-payments-tab="hidePaymentsTab" :hide-personal-details-tab="hidePersonalDetailsTab" />
        <div class="row">
          <div class="col-12 col-md-6 q-mt-lg q-pr-lg">
            <div v-show="!isPaymentAdded" class="">
              <h1 class="q-pb-sm">Choose a Payment Card</h1>
              <div v-if="allPaymentMethods && allPaymentMethods.length" style="padding: 12px; max-height: 400px; overflow-y: scroll">
                <q-card v-for="paymentMethod in allPaymentMethods" :key="paymentMethod.id" class="paymentcard" :class="{'paymentcardselected' : paymentMethodSelected === paymentMethod.id}" @click="paymentMethodClicked(paymentMethod)">
                  <q-card-section>
                    <p class="" style="display: inline-block;">
                      Card:<b> {{ paymentMethod && paymentMethod.card && paymentMethod.card.brand }}</b>
                    </p>
                    <p class="" style="display: inline-block; margin-left: 25px">
                      Exp:<b>
                        {{ paymentMethod && paymentMethod.card && paymentMethod.card.exp_month }}/{{
                          paymentMethod && paymentMethod.card && paymentMethod.card.exp_year
                        }}</b
                      >
                    </p>
                    <br />
                    <p class="" style="display: inline-block;">
                      Last 4: <b>{{ paymentMethod && paymentMethod.card && paymentMethod.card.last4 }}</b>
                    </p>
                  </q-card-section>
                </q-card>
              </div>
              <template v-else>
                <template v-if="paymentMethodsLoading">
                  <div style="text-align: center">
                    <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 50px;" />
                  </div>
                </template>
                <template v-else>
                  Once you have added a payment method below, you can select that same card in upcoming session transactions
                </template>
              </template>
              <template v-if="!paymentMethodSelected">
                <h1 class="q-pb-sm" style="margin-top: 20px;">Add a Payment Card</h1>
                <p class="q-mb-md">
                  Your credit card will be pre-authorized now. After the
                  notarization session is completed, your credit card
                  will be charged.
                </p>
                <div class="">
                  <div class="q-gutter-md row">
                    <div id="payment-form">
                      <div
                        v-if="submissionError"
                        class="q-mt-md q-mb-md text-negative"
                      >
                        <div id="card-errors" role="alert">
                          {{ submissionError }}
                        </div>
                      </div>

                      <q-field
                        label="Card Number"
                        stack-label
                        class="q-mb-md"
                        :error-message="errors['cardNumber']"
                        :error="!isCardNumberValid"
                      >
                        <template v-slot:control>
                          <div class="self-center full-width no-outline">
                            <div id="cardNumber" ref="cardNumber" />
                          </div>
                        </template>
                      </q-field>

                      <div class="row q-col-gutter-lg">
                        <div class="col">
                          <q-field
                            label="Card Expiry"
                            stack-label
                            class="q-mb-md"
                            :error-message="errors['cardExpiry']"
                            :error="!isCardExpiryValid"
                          >
                            <template v-slot:control>
                              <div class="self-center full-width no-outline">
                                <div id="cardExpiry" ref="cardExpiry" />
                              </div>
                            </template>
                          </q-field>
                        </div>
                        <div class="col">
                          <q-field
                            label="Card CVC"
                            stack-label
                            class="q-mb-md"
                            :error-message="errors['cardCvc']"
                            :error="!isCardCvcValid"
                          >
                            <template v-slot:control>
                              <div class="self-center full-width no-outline">
                                <div id="cardCvc" ref="cardCvc" />
                              </div>
                            </template>
                          </q-field>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
            <div v-show="isPaymentAdded" class="flex column q-gutter-md">
              <h5 class="q-my-md">Pre-authorization successful.</h5>
              <div class="q-my-md">
                <div class="row">
                  <div id="payment-form">
                    <p class="">
                      Card:<b> {{ paymentInfo.stripeBrand }}</b>
                    </p>
                    <p class="">
                      Exp:<b>
                        {{ paymentInfo.exp_month }}/{{
                          paymentInfo.exp_year
                        }}</b
                      >
                    </p>
                    <p class="">
                      Last 4: <b>{{ paymentInfo.last4 }}</b>
                    </p>
                    <q-btn class="q-mt-md" @click="updateCard"> Update Your Card </q-btn>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-6">
            <q-card
              class="my-card q-pa-lg"
              flat
              style="margin-top: 12px"
            >
              <q-card-section class="text-center">
                <span class="material-icons" style="font-size:3rem">
                  style
                </span>
                <h5 class=" q-my-md">Payment Pre-authorization</h5>
                <div class="">
                  <p class="col">We charge nothing now. Only after you confirm completion of the notarization will you be billed for the transaction.</p> <br />
                  <p v-if="!(paymentInfo && paymentInfo.sessionDoc && paymentInfo.sessionDoc.sessionType === 'loan_signing') && !calledFromInviteSignerPage" class="col">25$ will be charged for session (with 1 seal) <br />8$ for each additional seal <br />5$ for each additional signer </p>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
      <!-- next btn -->
      <q-btn
        class="next-btn q-mt-md q-mb-xl"
        label="Next"
        color="primary"
        :loading="submitLoading"
        @click="submitForm()"
      />
    </div>
  </q-page>
</template>

<script>
import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";
import { loadStripe } from "@stripe/stripe-js/pure";
import SessionHeader from "../../components/SessionHeader.vue";
import SessionInputHeader from "./SessionInputHeader.vue";

export default {
  name: "PaymentInfo",
  components: { SessionHeader, SessionInputHeader },
  props: {
    calledFromInviteSignerPage: {
      type: Boolean,
      default: false
    },
    paymentDetailsCaptured: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      sessionid: "",
      sessionChargeOnBusinessUser: false,
      hidePaymentsTab: false,
      notaryLoadsResponse: {},
      allPaymentMethods: [],
      paymentMethodsLoading: false,
      stripeCustomerID: "",
      paymentMethodSelected: false,
      hidePersonalDetailsTab: false,
      submitLoading: false
    };
  },
  computed: {
    isCardNumberValid () {
      return this.isValid("cardNumber");
    },
    isCardExpiryValid () {
      return this.isValid("cardExpiry");
    },
    isCardCvcValid () {
      return this.isValid("cardCvc");
    }
  },
  async mounted () {
    if (window.onpopstate) {
      window.onpopstate = null;
    }
    // window.removeEventListener("beforeunload", () => {});
    // window.onbeforeunload = null;
    this.sessionid = (this.$route.params && this.$route.params.id) || false;
    this.hidePaymentsTab = this?.$vendorDoc?.skipSessionCharges || false;
    this.currentSession = this.$q.localStorage.getItem("sessionData");
    if (!this.currentSession && !this.calledFromInviteSignerPage) {
      this.$router.replace(`/business/personal_info/${this.sessionid}`);
    }
    const res = await this.loadPersonalData(this.sessionid);
    console.log("res", res);
    if (res && res.stripeCustomerID) {
      console.log("loadPersonalData ", res);
      this.paymentInfo = res;
      this.isPaymentAdded = true;
    }
    this.sessionChargeOnBusinessUser = res?.sessionDoc?.sessionChargeOnBusinessUser || false;
    this.hidePersonalDetailsTab = res?.sessionDoc?.performInSessionKBA || false;
    if (this.sessionChargeOnBusinessUser) {
      this.$router.replace(`/business/meet_notary/${this.sessionid}`);
    }

    const style = {
      base: {
        fontFamily: "\"Roboto\", \"-apple-system\", \"Helvetica Neue\", Helvetica, Arial, sans-serif",
        "::placeholder": {
          color: "#CFD7E0",
        },
      },
    };
    if (!this.stripe) {
      if (this.$user.testingacc) {
        const pubkey = process.env.STRIPE_PUBLIC_KEY_TEST;
        this.stripe = await loadStripe(pubkey);
      } else {
        const pubkey = process.env.STRIPE_PUBLIC_KEY;
        this.stripe = await loadStripe(pubkey);
      }
    }
    if (!this.elements) {
      const cardElements = ["cardNumber", "cardExpiry", "cardCvc"];
      this.elements = this.stripe.elements();
      cardElements.forEach((element) => {
        this.card[element] = this.elements.create(element, { style });
        this.card[element].mount(`#${element}`);
        this.card[element].addEventListener("change", (e) => this.updated(e));
      });
    }
    if (this.calledFromInviteSignerPage) {
      this.paymentMethodsLoading = true;
      if (this.$user.role === "customer") {
        const url = "session/getPaymentMethods";
        const response = await $axios.post(url);
        const { data } = response;
        if (!data.error) {
          this.allPaymentMethods = response.data.paymentMethods;
          this.stripeCustomerID = response.data.stripeCustomerID;
        }
      } else if (this.$user.role === "notary") {
        const url = "notary/loads";
        this.notaryLoadsResponse = await $axios.post(url, { }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("notaryLoadsResponse", this.notaryLoadsResponse?.data);
        if (this.notaryLoadsResponse?.data?.paymentMethods) {
          this.allPaymentMethods = this.notaryLoadsResponse?.data?.paymentMethods?.data;
        }
      }
      this.paymentMethodsLoading = false;
    }
  },
  setup () {
    const isPaymentAdded = ref(false);

    const stripe = ref(null);
    const elements = ref(null);
    const paymentInfo = ref({});
    const card = ref({
      cardNumber: null,
      cardExpiry: null,
      cardCvc: null,
    });
    const errors = ref({
      cardNumber: "",
      cardExpiry: "",
      cardCvc: ""
    });
    const submissionError = ref(null);
    const currentSession = ref(null);
    const createCustomer = async (seesion, data, paymentMethod, paymentMethodSelected) => {
      try {
        data.paymentMethod = paymentMethod;
        data.paymentMethodSelected = paymentMethodSelected;
        const url = "session/createCustomer";
        const response = await $axios.post(url, { data, sessionId: seesion }, {
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
        if (!sessionId) {
          return false;
        }
        const url = "session/load/personalData";
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
    const updateCard = async () => {
      isPaymentAdded.value = false;
    };
    return {
      currentSession,
      submissionError,
      stripe,
      elements,
      card,
      errors,
      createCustomer,
      loadPersonalData,
      isPaymentAdded,
      paymentInfo,
      updateCard
    };
  },
  methods: {
    paymentMethodClicked(paymentMethod) {
      if (this.paymentMethodSelected === paymentMethod.id) {
        this.paymentMethodSelected = "";
      } else {
        this.paymentMethodSelected = paymentMethod.id;
      }
    },
    async nextButtonClick () {
      return "";
    },
    async submitForm () {
      // e.preventDefault();
      try {
        this.submitLoading = true;
        if (this.isPaymentAdded) {
          const url = `session/saveSessionData/${this.sessionid}`;
          const dataToSave = {
            sessionOpenCallForTaking: true,
            paymentInfoCaptured: true,
            currentTimeZone: String((new Date()).getTimezoneOffset() / -60)
          };
          // dataToSave.currentTimeZone = String((new Date()).getTimezoneOffset() / -60);
          const apiResponse = await $axios.post(url, {
            data: dataToSave
          });
          this.submitLoading = false;
          if (apiResponse?.data?.openCallSent) {
            this.socketRequest("new_session_open_call");
          }
          this.$router.replace(`/business/meet_notary/${this.sessionid}`);
          return;
        }
        this.submitLoading = true;
        this.submissionError = null;
        let token;
        let error;
        if (!this.paymentMethodSelected) {
          ({ token, error } = await this.stripe.createToken(this.card.cardNumber));
          console.log({ error });
          if (error) {
            this.$q.notify({
              color: "secondary",
              position: "bottom-right",
              message: error.message,
            });
            return;
          }
          console.log({ token });
        }
        if (this.calledFromInviteSignerPage) {
          let paymentMethod;
          let error2;
          if (!this.paymentMethodSelected) {
            ({ paymentMethod, error2 } = await this.stripe.createPaymentMethod({
              type: "card",
              card: this.card.cardNumber,
              // billing_details: {
              //   name: cardholderName.value,
              // },
            }));
          } else if (this.allPaymentMethods) {
            for (let i = 0; i < this.allPaymentMethods.length; i += 1) {
              const pm = this.allPaymentMethods[i];
              if (pm.id === this.paymentMethodSelected) {
                paymentMethod = pm;
                break;
              }
            }
            error2 = null;
          }
          if (this.stripeCustomerID) {
            paymentMethod.stripeCustomerID = this.stripeCustomerID;
          }
          console.log(paymentMethod, error2);
          if (!error2) {
            if (!this.paymentMethodSelected && paymentMethod?.id) {
              this.paymentMethodSelected = paymentMethod.id;
            }
            this.paymentDetailsCaptured(token, paymentMethod, this.paymentMethodSelected);
          }
          return;
        }
        const res = await this.createCustomer(this.sessionid, token, this.paymentMethodSelected);
        if (!(res && res.stack && res.message)) {
          this.paymentInfo = res;
          // this.isPaymentAdded = true;
          this.$q.notify({
            color: "primary",
            position: "bottom",
            message: "Your card information has been saved successfully.",
          });
          const url = `session/saveSessionData/${this.sessionid}`;
          const dataToSave = {
            sessionOpenCallForTaking: true,
            paymentInfoCaptured: true,
            currentTimeZone: String((new Date()).getTimezoneOffset() / -60)
          };
          const apiResponse2 = await $axios.post(url, {
            data: dataToSave
          });
          if (apiResponse2?.data?.openCallSent) {
            this.socketRequest("new_session_open_call");
          }
          this.$router.replace(`/business/meet_notary/${this.sessionid}`);
        }
      } catch (error) {
        console.log({ error });
        this.$emit("failed", error);
      } finally {
        this.submitLoading = false;
      }
    },
    resetForm () {
      // for (const [elementType] of Object.entries(this.card)) {
      //   this.card[elementType].clear();
      // }
    },
    updated (e) {
      console.log(e);
      const { elementType } = e;
      const { error } = e;
      if (error) {
        this.errors[elementType] = e.error.message;
        return null;
      }
      if (this.errors[elementType]) {
        this.errors[elementType] = "";
      }
      return null;
    },
    isValid (elementType) {
      return this.errors[elementType] === "";
    },
    errorMessage (elementType) {
      return this.isValid(elementType) ? this.errors[elementType] : false;
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
  },
};
</script>
<style scoped lang="scss">
.StripeElement--invalid {
  border-color: transparent;
}
#payment-form {
  width: 500px;
}
.paymentcard {
  margin-top: 12px;
  cursor: pointer;
}
.paymentcard:hover {
  background: #dedede;
}
.paymentcardselected {
  border: 2px solid black
}
</style>
