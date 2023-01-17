<template>
  <q-card class="q-pa-md q-ma-none no-shadow">
    <q-card-section style="text-align: center">
      <div v-if="vendorDoc && vendorDoc.whitelabel_selective && vendorDoc.whitelabel_selective.signup && vendorDoc.whitelabel_selective.signup.showPoweredByBlueNotary" class="flex-center flex q-pa-md" style="padding-top: 0px; font-size: 20px">
        Powered by BlueNotary
      </div>
      <h1>
        <strong>
          {{ companyNameText }}
        </strong> Account Signup
      </h1>
    </q-card-section>
    <div style="text-align: center;">
      <q-radio v-model="activeComponent" size="xl" val="customerSignUpComponent" label="Customer" />
      <q-radio v-if="!refferedByNotary" v-model="activeComponent" size="xl" val="notarySignUpComponent" label="Notary" />
    </div>
    <component :is="activeComponent" :reffered-by-notary="refferedByNotary" :invited-via-session-link="invitedViaSessionLink" :vendor-doc="vendorDoc" :registered-as="registeredAs" />
    <q-card-section>
      <p class="text-caption text-grey">
        By signing up you are agreeing to the Blue Notary <a href="https://www.bluenotary.us/terms" target="_blank">Terms of Service
        </a>. Find information on our privacy practices in our <a href="https://www.bluenotary.us/privacy" target="_blank">Privacy Policy
        </a>.
      </p>
    </q-card-section>
    <div class="flex flex-center q-gutter-md" style="text-decoration:underline;">
      <small><a href="/resend-verify-email">Didn't receive confirmation email?</a></small>
      <a :href="loginHref">
        <small>Login</small>
      </a>
    </div>
  </q-card>
</template>
<script>

import CustomerSignUp from "./CustomerSignUp.vue";
import NotarySignUp from "./NotarySignUp.vue";

export default {
  components: {
    customerSignUpComponent: CustomerSignUp,
    notarySignUpComponent: NotarySignUp
  },
  props: {
    vendorDoc: {
      type: Object,
      default: () => {}
    },
    vendorDataFetched: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      activeComponent: "",
      refferedByNotary: "",
      registeredAs: "",
      invitedViaSessionLink: false,
      loginHref: "/sign-in",
      urlActiveComponent: ""
    };
  },
  computed: {
    companyNameText () {
      let companyNameText = "Blue Notary";
      if (this.vendorDoc?.whitelabel_imagetext) {
        companyNameText = this.vendorDoc?.whitelabel_imagetext;
      }
      if (this.vendorDoc?.whitelabel_selective?.signup?.whitelabel_imagetext) {
        companyNameText = this.vendorDoc?.whitelabel_selective?.signup?.whitelabel_imagetext;
      }
      return companyNameText;
    }
  },
  async mounted() {
    this.refferedByNotary = (this.$route.query && this.$route.query.refferedByNotary) || "";
    this.registeredAs = (this.$route.query && this.$route.query.registeredAs) || "";
    this.invitedViaSessionLink = (this.$route.query && this.$route.query.invitedViaSessionLink) || false;
    if (this.refferedByNotary) {
      this.activeComponent = "customerSignUpComponent";
      if (this.invitedViaSessionLink) {
        this.loginHref = `/sign-in?refferedByNotary=${this.refferedByNotary}&invitedViaSessionLink=${this.invitedViaSessionLink}&type=customer`;
      }
    }
    this.urlActiveComponent = (this.$route.query && this.$route.query.urlActiveComponent) || "";
    if (this.urlActiveComponent) {
      this.activeComponent = this.urlActiveComponent;
    }
  }
};
</script>
