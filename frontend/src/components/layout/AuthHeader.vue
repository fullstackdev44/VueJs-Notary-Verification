<template>
  <q-header elevated class="bg-white text-grey-8 q-py-xs q-px-md" height-hint="58">
    <!-- <div v-if="browserIncompatibilityError" style="width: 100%; text-align: center; background: #f595af; color: white; margin-left: -16px; margin-top: -4px; width: 100vw">
      Please use <a href="https://www.google.com/chrome/"><u>Chrome browser</u></a> for notarization sessions.
    </div> -->
    <div v-if="paymentDetailsInsertionMessage" style="width: 100%; text-align: center; background: #eff2a7; color: black; margin-left: -16px; margin-top: -4px; width: 100vw">
      Please add a payment card to your account for session charges by <a @click="cardDetailsClicked">Clicking here</a>
    </div>
    <q-toolbar>
      <img v-if="$vendorDoc.whitelabel_imageurl" style="width:35px;" :src="$vendorDoc.whitelabel_imageurl" />
      <img v-else style="width:35px;" src="https://bluenotary.us/assets/img/logo-a4-b.png" />
      <q-space />
      <div class="q-gutter-sm row items-center no-wrap q-pr-lg customer-nav mbhide">
        <div
          v-if="$user && $user.memberType === 'free'"
          class="q-px-md"
          style="cursor: pointer; color: green"
          @click="showUpgradePopup"
        >
          <q-badge color="green" outline>Upgrade Account</q-badge>
        </div>
        <router-link v-if="$user.memberType !== 'title_pro' && $user.memberType !== 'title_hybrid' && $user.memberType !== 'signing_service' && $user.memberType !== 'business' && $user.memberType !== 'business_basic' && $user.memberType !== 'business_pro' && $user.memberType !== 'business_hybrid'" to="/business/" class="q-px-md" exact>
          My Documents
        </router-link>
        <router-link
          v-if="$user.memberType !== 'free' && ($user.memberType === 'business_hybrid' || $user.memberType === 'business_pro' || $user.memberType === 'title_hybrid' || !($vendorDoc && $vendorDoc.hideUpgradeOptions))"
          to="/business/business-sessions"
          class="q-px-md"
        >
          Manage Sessions
        </router-link>
        <router-link
          v-if="$user.memberType !== 'free' && ($user.memberType === 'business_hybrid' || $user.memberType === 'business_pro' || $user.memberType === 'title_hybrid' || !($vendorDoc && $vendorDoc.hideUpgradeOptions))"
          to="/business/templates"
          class="q-px-md"
        >
          Document Templates
        </router-link>
        <div
          v-else-if="($user.memberType === 'business_hybrid' || $user.memberType === 'business_pro' || $user.memberType === 'title_hybrid' || !($vendorDoc && $vendorDoc.hideUpgradeOptions))"
          class="q-px-md"
          style="cursor: pointer"
          @click="showUpgradePopup"
        >
          Document Templates
        </div>
      </div>
      <div class="q-gutter-sm row items-center no-wrap">
        <q-btn dense flat no-wrap>
          <span class="q-pa-sm">{{ $user.name }}</span>
          <q-icon name="arrow_drop_down" size="xs" />
          <q-menu auto-close>
            <q-list dense style="min-width: 200px">
              <q-item v-if="$user && $user.memberType === 'free'" clickable class="vmob" style="padding-top: 12px; padding-bottom: 12px">
                <div
                  class="q-px-md"
                  style="cursor: pointer; color: green"
                  @click="showUpgradePopup"
                >
                  <q-badge color="green" outline>Upgrade Account</q-badge>
                </div>
              </q-item>
              <q-separator />
              <q-item v-if="$user.memberType !== 'title_pro' && $user.memberType !== 'title_hybrid' && $user.memberType !== 'signing_service'" clickable class="vmob">
                <router-link to="/business/">
                  <q-item-section>
                    My Documents
                  </q-item-section>
                </router-link>
              </q-item>
              <q-item v-if="$user.memberType !== 'free'" clickable class="vmob">
                <router-link
                  to="/business/business-sessions"
                >
                  <q-item-section>
                    Client Sessions
                  </q-item-section>
                </router-link>
              </q-item>
              <q-item v-if="$user.memberType === 'business' || $user.memberType === 'business_basic' || $user.memberType === 'business_pro' || $user.memberType === 'business_hybrid' || $user.memberType === 'title_pro' || $user.memberType === 'title_hybrid' || $user.memberType === 'signing_service'" clickable class="vmob">
                <router-link
                  to="/business/templates"
                  class=""
                >
                  <q-item-section>
                    Document Templates
                  </q-item-section>
                </router-link>
              </q-item>
              <q-separator />
              <q-item v-if="$user.memberType === 'business_hybrid' || $user.memberType === 'business_pro' || $user.memberType === 'title_hybrid' || !($vendorDoc && $vendorDoc.hideUpgradeOptions)" clickable>
                <router-link to="/business/account-settings" style="color:#333">
                  <q-item-section>
                    <!-- <q-icon name="settings" size="xs" color="none"/> -->
                    Account Settings
                  </q-item-section>
                </router-link>
              </q-item>
              <q-separator />
              <q-item clickable>
                <q-item-section @click="helpAndSupportClicked">
                  <!-- <q-icon name="support" size="xs" /> -->
                  Help & Support
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable class="GL__menu-link" @click="signOut">
                <q-item-section>
                  Sign out
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </q-toolbar>
    <upgrade-account-popup-component :open-acc-pro-model="openUpgradePopup" />

    <!-- Modal Payment Info -->
    <q-dialog v-model="showPaymentDetailsModal">
      <q-card style="min-width: 90%; min-height: 80%">
        <q-card-section>
          <h5>
            Add Credit Card Details
            <q-btn round label="x" style="float: right" @click="closePaymentInfoModal" />
          </h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="columns is-multiline" style="margin-top: 6px">
            <payment-info :called-from-invite-signer-page="true" :payment-details-captured="paymentDetailsCaptured" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-header>
</template>
<script>

import { $axios } from "boot/axios";
import UpgradeAccountPopupComponent from "../../pages/customer/upgradeCustomerAccount.vue";
import PaymentInfo from "../../pages/customer/paymentInfo.vue";

export default {
  components: {
    UpgradeAccountPopupComponent,
    PaymentInfo
  },
  data() {
    return {
      count: 0,
      attachmentCount: 0,
      polling: null,
      openUpgradePopup: false,
      paymentDetailsInsertionMessage: false,
      showPaymentDetailsModal: false
      // browserIncompatibilityError: false
    };
  },
  mounted() {
    // this.browserIncompatibilityError = !(/chrome/i.test(navigator.userAgent));
    setTimeout(() => {
      if (this.$user.registeredAs === "business" && this.$user.memberType === "free") {
        this.showUpgradePopup();
      }
      if (this.$user.forceSelectPaymentMethod && !this.$user.selectedPaymentMethod) {
        this.paymentDetailsInsertionMessage = true;
      }
    }, 1000);
  },
  methods: {
    helpAndSupportClicked() {
      if (this.$vendorDoc?.hideUpgradeOptions) {
        window.$crisp.do("chat:open");
      } else {
        window.open("https://bluenotary.crisp.help", "_blank");
      }
    },
    async loadMessage() {
      const { data } = await this.axios.get("/messages/count");
      this.count = data?.count ?? 0;
      this.attachmentCount =
        (await this.axios.get("/attachments/count").data?.count) ?? 0;
    },
    clearPolling() {
      clearInterval(this.polling);
      this.polling = null;
    },
    showUpgradePopup() {
      this.openUpgradePopup = false;
      setTimeout(() => {
        this.openUpgradePopup = true;
      }, 200);
    },
    cardDetailsClicked() {
      console.log("cardDetailsClicked");
      this.showPaymentDetailsModal = true;
    },
    closePaymentInfoModal() {
      this.showPaymentDetailsModal = false;
    },
    async paymentDetailsCaptured(cardToken, paymentMethod, paymentMethodSelected) {
      console.log("cardToken", cardToken);
      console.log("paymentMethod", paymentMethod);
      console.log("paymentMethodSelected", paymentMethodSelected);
      let dataToSend = {};
      if (paymentMethod) {
        dataToSend = JSON.parse(JSON.stringify(paymentMethod));
      }
      if (cardToken?.id) {
        dataToSend.token = cardToken.id;
      }
      dataToSend.paymentMethod = paymentMethod;
      dataToSend.paymentMethodSelected = paymentMethodSelected;
      console.log("called", dataToSend);
      const url = "session/createCustomerForInviteSigner";
      const response = await $axios.post(url, { data: dataToSend }, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("response", response);
      this.$q.notify({
        type: "succcess",
        message: "The card details for session is saved successfully"
      });
      this.showPaymentDetailsModal = false;
      window.location.reload();
    },
  }
};
</script>
