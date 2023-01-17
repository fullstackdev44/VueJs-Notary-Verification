<template>
  <q-page class="q-pa-md flex-center session-container">
    <div class="row flex-center">
      <div v-if="success" class="col-12 col-md-6 q-pa-lg card q-pa-xl">
        <h1 class="q-mb-md">Thank you for choosing BlueNotary!</h1>
        <q-icon name="celebration" style="font-size:6rem;" />
        <p>You're now a <span v-if="$user.memberType === 'pro'" class="green success">Pro Plan</span><span v-if="$user.memberType === 'business'" class="green success">Business Premium Plan</span><span v-if="$user.memberType === 'business_basic'" class="green success">Business Basic Plan</span><span v-if="$user.memberType === 'business_pro'" class="green success">Business Pro Plan</span><span v-if="$user.memberType === 'business_hybrid'" class="green success">Business Premium Plan</span> member. Welcome to the team!</p>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  data () {
    return {
      success: false,
    };
  },
  async mounted () {
    await this.$store.dispatch("auth/fetchUser");
    await this.updateUpgradeStatus();
    this.success = true;
  },
  methods: {
    async updateUpgradeStatus() {
      const { data } = await this.axios.post("/business/upgrade-status");
      if (data.payment_status === "paid") {
        await this.$store.dispatch("auth/fetchUser");
      }
    },
  }
};
</script>
