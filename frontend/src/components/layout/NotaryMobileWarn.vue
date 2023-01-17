<template>
  <div class="notary-mobile-warn bg-white">
    <p class="warn">
      Mobile is not enabled for notaries. Please use computer or tablet.
    </p>
    <q-btn
      color="primary"
      label="Sign out"
      @click="signOut"
    />
  </div>
</template>
<script>

export default {
  data() {
    return {
    };
  },
  mounted() {
  },
  methods: {
    async signOut () {
      console.log("here");
      this.$auth.logout();
      localStorage.removeItem("resendVerifyEmail");
      this.setEmailStatus(false);
      this.$store.commit("auth/setUser", {});
      this.$store.commit("auth/setOnBoarding", false);
      this.$store.commit("auth/role", "guest");
      localStorage.removeItem("userRole");
      localStorage.removeItem("bnUser");
      window.sessionStorage.clear();
    },
  },
};
</script>
