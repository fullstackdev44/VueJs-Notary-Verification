// import something here

// "async" is optional;
// more info on params: https://quasar.dev/quasar-cli/boot-files
import { mapGetters } from "vuex";
import { $axios } from "boot/axios";

export default async ({ Vue }) => {
  Vue.mixin({
    computed: {
      ...mapGetters("auth", {
        $user: "user",
        $userType: "type",
        $authenticated: "authenticated",
        $resendVerifyEmail: "resendVerifyEmail",
        $onBoarding: "onBoarding",
        $role: "role",
        $vendorDoc: "vendorDoc",
      }),
      isNotary () {
        return this.$userType === "notary";
      },
      isAdmin () {
        return this.$userType === "admin";
      },
      isCustomer () {
        return this.$userType === "customer";
      },

    },
    methods: {
      signOut () {
        //   this.$q.dialog({
        //     title: "Confirm",
        //     message: "Are you sure you want to sign out?",
        //     cancel: true,
        //     persistent: true,
        //   }).onOk(() => {
        console.log(window.location.href);
        if (window.location.href.includes("kba")) {
          const urlMatch = window.location.href.match(/kba\/([0-9a-z]+)/);
          let currentSessionId;
          if (urlMatch && urlMatch[1]) {
            currentSessionId = urlMatch[1];
          }
          const url = `session/setSessionStageOrStatus/${currentSessionId}/?type=stage&value=kba_check_stage_aborted`;
          $axios.get(url, {
            headers: {
              "Content-Type": "application/json",
            },
          });
          console.log();
        }
        if (window.location.href.includes("photoid")) {
          const urlMatch = window.location.href.match(/photoid\/([0-9a-z]+)/);
          let currentSessionId;
          if (urlMatch && urlMatch[1]) {
            currentSessionId = urlMatch[1];
          }
          const url = `session/setSessionStageOrStatus/${currentSessionId}/?type=stage&value=photoid_check_stage_aborted`;
          $axios.get(url, {
            headers: {
              "Content-Type": "application/json",
            },
          });
          console.log();
        }
        if (window.location.href.includes("payment_info")) {
          const urlMatch = window.location.href.match(/payment_info\/([0-9a-z]+)/);
          let currentSessionId;
          if (urlMatch && urlMatch[1]) {
            currentSessionId = urlMatch[1];
          }
          const url = `session/setSessionStageOrStatus/${currentSessionId}/?type=stage&value=payment_info_check_stage_aborted`;
          $axios.get(url, {
            headers: {
              "Content-Type": "application/json",
            },
          });
          console.log();
        }
        setTimeout(() => {
          this.$auth.logout();
          localStorage.removeItem("resendVerifyEmail");
          this.setEmailStatus(false);
          this.$store.commit("auth/setUser", {});
          this.$store.commit("auth/setOnBoarding", false);
          this.$store.commit("auth/role", "guest");
          localStorage.removeItem("userRole");
          localStorage.removeItem("bnUser");
          window.sessionStorage.clear();
        }, 1000);
        // });
      },
      setEmailStatus (status) {
        this.$store.commit("auth/setVerifyEmailStatus", status);
      },
    },
  });
};
