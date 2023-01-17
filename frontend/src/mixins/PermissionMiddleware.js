import { mapMutations, mapGetters } from "vuex";

export default {
  computed: {
    ...mapMutations("users", ["setTokenUser"]),
    ...mapGetters("users", ["tokenUser"]),
    defaultPermissions() {
      return null;
    },
    permissions() {
      const data = this.defaultPermissions || this.$route?.meta?.permissions;
      if (!data) return data;
      return Array.isArray(data) ? data : [data];
    },
    hasPermission() {
      if (!this.permissions) return true;
      if (this.permissions.includes("all")) return true;
      if (this.isOwner) return true;
      return this.permissions.includes(this.$userType);
    },
  },
  async mounted() {
    if (this.defaultPermissions === "onboarding") {
      try {
        const { data: tokenUser } = await this.axios.get(`/auth/verify-token?token=${this.$route.query.token}`);
        this.$store.commit("users/setTokenUser", tokenUser);
      } catch (error) {
        await this.$router.push({ name: "landing" });
      }
      return;
    }
    if (!this.$user) await this.$store.dispatch("auth/fetchUser");
  },
};
