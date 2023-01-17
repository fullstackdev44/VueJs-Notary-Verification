<template>
  <q-page class="q-pa-md flex-center session-container">
    <div class="row flex-center">
      <div v-if="success" class="col-12 col-md-6 q-pa-lg card q-pa-xl">
        <h1 class="q-mb-md">Thank you for choosing BlueNotary!</h1>
        <q-icon name="celebration" style="font-size:6rem;text-align:center" />
        <p>You're now a <span class="green success">Pro Hybrid</span> member!</p>
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
    await this.updateUpgradeStatus();
    this.success = true;
  },
  methods: {
    async updateUpgradeStatus() {
      const { data } = await this.axios.post("/notary/upgrade-status");
      if (data.payment_status === "paid") {
        await this.$store.dispatch("auth/fetchUser");
      }
    },
  }
};
</script>
