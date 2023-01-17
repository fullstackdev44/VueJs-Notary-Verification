<template>
  <q-card
    class="q-pa-lg"
  >
    <q-card-section class="">
      <div v-if="vendorDoc && vendorDoc.whitelabel_selective && vendorDoc.whitelabel_selective.signup && vendorDoc.whitelabel_selective.signup.showPoweredByBlueNotary" class="flex-center flex q-pa-md" style="padding-top: 0px; font-size: 20px">
        Powered by BlueNotary
      </div>
      <h1>
        <strong>
          <!-- <template v-if="vendorDoc && vendorDoc.whitelabel_imagetext">
            {{ vendorDoc.whitelabel_imagetext }}
          </template>
          <template v-else>
            Blue Notary
          </template> -->
          {{ companyNameText }}
        </strong> Account Login
      </h1>
    </q-card-section>
    <q-card-section class="q-pb-none">
      <div v-if="this.$resendVerifyEmail" class="bn-note bn-note--warning">
        <p>We have sent you the email for verification,<br /><a href="/resend-verify-email">Resend verification email</a> if you have not received it yet, <br />or verification code is expired.</p>
      </div>
      <q-form class="q-gutter-sm" @submit="signIn">
        <q-input
          v-model="$v.model.email.$model"
          dense
          filled
          type="email"
          label="Email"
          :error-message="errorMessage($v.model.email, 'Email')"
          :error="!!errorMessage($v.model.email)"
        >
          <template v-slot:prepend>
            <q-icon name="email" />
          </template>
        </q-input>
        <q-input
          v-model="$v.model.password.$model"
          dense
          filled
          type="password"
          label="Password"
          :error-message="errorMessage($v.model.password, 'Password')"
          :error="!!errorMessage($v.model.password)"
          @keydown.enter.prevent="signIn"
        >
          <template v-slot:prepend>
            <q-icon name="lock" />
          </template>
        </q-input>
      </q-form>
    </q-card-section>
    <q-card-actions>
      <q-btn
        rounded
        size="md"
        color="blue"
        class="full-width text-white"
        type="submit"
        label="Login"
        :loading="isSubmitting"
        :disable="isSubmitting"
        @click="signIn"
      />
    </q-card-actions>
    <div v-if="!(vendorDoc && vendorDoc.dontAllowRegistering)" class="flex q-pa-xs flex-center font-sm q-mt-md">
      <a href="business/register" class="">
        <small>Register</small>
      </a>
      <!-- &nbsp;|&nbsp;
      <a href="/notary/register" class="">
        <small>Notary</small>
      </a> -->
      &nbsp;|&nbsp;
      <a href="/forgot-password">
        <small>Forgot password?</small>
      </a>
    </div>
  </q-card>
</template>
<script>
import {
  required, minLength, email,
} from "vuelidate/lib/validators";
import { reactive, toRefs } from "@vue/composition-api";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";

export const emailFormatter = (value) => {
  if (!value) return value;
  return value.toLowerCase();
};

export default {
  mixins: [VuelidateHelperMixin],
  props: {
    userType: {
      type: String,
      default: null,
    },
    vendorDoc: {
      type: Object,
      default: () => {}
    },
    vendorDataFetched: {
      type: Boolean,
      default: false,
    }
  },
  data () {
    return {
      autoSubmitForm: false,
      refferedByNotary: "",
      invitedViaSessionLink: "",
      vendorid: "",
      vendortoken: ""
    };
  },
  computed: {
    companyNameText () {
      if (!this.vendorDataFetched) {
        return "";
      }
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
  setup (props, context) {
    const {
      root: { $route }
    } = context;
    console.log($route.query);
    const { userType } = toRefs(props);
    const model = reactive({
      email: "",
      password: "",
      userType,
    });
    return {
      model,
      isSubmitting: false,
      resendVerifyEmail: false,
    };
  },
  validations: {
    model: {
      email: {
        required,
        email: (val) => email(emailFormatter(val)),
      },
      password: { required, minLength: minLength(6) },
    },
  },
  mounted() {
    console.log(this.$route.query);
    console.log(this.$route.query.autosubmit === "true");
    this.refferedByNotary = (this.$route.query && this.$route.query.refferedByNotary) || "";
    this.vendorid = (this.$route.query && this.$route.query.vendorid) || "";
    this.vendortoken = (this.$route.query && this.$route.query.vendortoken) || "";
    this.invitedViaSessionLink = (this.$route.query && this.$route.query.invitedViaSessionLink) || false;
    if (this.$route.query && this.$route.query.autosubmit === "true") {
      this.autoSubmitForm = true;
    }
    if (this.autoSubmitForm) {
      this.signOut();
      setTimeout(() => {
        this.signIn();
      }, 500);
    }
  },
  methods: {
    async signIn () {
      this.isSubmitting = true;
      this.$v.model.$touch();
      if (!this.$v.model.$invalid || this.autoSubmitForm) {
        try {
          const queryRoute = this.$route.query;
          if (this.autoSubmitForm) {
            if (queryRoute.email) {
              const modelEmail = queryRoute.email.replace(" ", "+");
              this.model.email = modelEmail;
            }
            if (queryRoute.password) {
              this.model.password = queryRoute.password;
            }
            if (queryRoute.temporary) {
              this.model.temporary = queryRoute.temporary;
            }
            if (queryRoute.impersonate) {
              this.model.impersonate = queryRoute.impersonate;
            }
            if (queryRoute.loginViaEmail) {
              this.model.loginViaEmail = queryRoute.loginViaEmail;
            }
            if (queryRoute.loginViaSales) {
              this.model.loginViaSales = queryRoute.loginViaSales;
            }
            if (queryRoute.loginViaSalesLoanSigning) {
              this.model.loginViaSalesLoanSigning = queryRoute.loginViaSalesLoanSigning;
            }
            if (queryRoute.loginViaSalesTitlesProDemoOneTime) {
              this.model.loginViaSalesTitlesProDemoOneTime = queryRoute.loginViaSalesTitlesProDemoOneTime;
            }
            if (queryRoute.vendorid) {
              this.model.vendorid = queryRoute.vendorid;
            }
            if (queryRoute.vendortoken) {
              this.model.vendortoken = queryRoute.vendortoken;
            }
            if (queryRoute.type) {
              this.model.userType = queryRoute.type;
            }
            console.log(this.$route.query);
            console.log(this.model);
          }
          if (this.refferedByNotary) {
            this.model.refferedByNotary = this.refferedByNotary;
          }
          if (this.invitedViaSessionLink) {
            this.model.invitedViaSessionLink = this.invitedViaSessionLink;
          }
          await this.$auth.login({
            data: this.model,
          }).then(() => {
            if (localStorage.getItem("resendVerifyEmail")) {
              this.setEmailStatus(true);
            }
          }, () => {
            if (localStorage.getItem("resendVerifyEmail")) {
              this.setEmailStatus(true);
            }
          });
          // window.fpr("referral", { email: this.model.email, uid: this.model.id });
          console.log(queryRoute);
          await this.$store.dispatch("auth/fetchUser");
          if (queryRoute.type === "witness" && queryRoute.sessionid) {
            this.$router.replace(`/pdf_edit/sessions/${queryRoute.sessionid}?witness=true`);
          } else if (queryRoute.routetype === "prepareDoc" && queryRoute.sessionid) {
            this.$router.replace(`/business/prepare_doc/${queryRoute.sessionid}`);
          } else if (queryRoute.routetype === "prepareDoc") {
            if (queryRoute.sessionType === "loan_signing") {
              this.$router.replace("/business/prepare_doc/?sessionType=loan_signing");
            } else {
              this.$router.replace("/business/prepare_doc/");
            }
          } else if (queryRoute.routetype === "inviteSigner") {
            this.$router.replace("/business/invite");
          } else if (queryRoute.routetype === "pdfEdit" && queryRoute.sessionid) {
            this.$router.replace(`/pdf_edit/sessions/${queryRoute.sessionid}`);
          } else if (queryRoute.routetype === "businessKBA" && queryRoute.sessionid) {
            this.$router.replace(`/business?kba=true&sessionid=${queryRoute.sessionid}`);
          } else if (queryRoute.routetype === "businessConfirmation" && queryRoute.sessionid) {
            this.$router.replace(`/business?confirmationSession=${queryRoute.sessionid}&paymentDone=true`);
          } else if (queryRoute.routetype === "businessAdminConfirmation" && queryRoute.sessionid) {
            this.$router.replace(`/business/business-sessions?confirmationSession=${queryRoute.sessionid}&paymentDone=true`);
          } else if (queryRoute.routetype === "settings") {
            this.$router.replace("/notary/account-settings?dataFillModal=true");
          } else {
            this.$router.replace("/auth");
          }
        } catch (error) {
        }
      }
      this.isSubmitting = false;
    },
    async signOut () {
      // this.$auth.logout();
      localStorage.removeItem("resendVerifyEmail");
      this.setEmailStatus(false);
      this.$store.commit("auth/setUser", {});
      this.$store.commit("auth/setOnBoarding", false);
      this.$store.commit("auth/role", "guest");
      localStorage.removeItem("userRole");
      localStorage.removeItem("bnUser");
    },
  },
};
</script>
