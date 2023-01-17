<template>
  <q-page class="q-pa-md flex-center session-container">
    <div class="row flex-center">
      <div v-if="!failure" class="col-12 col-md-6 q-pa-lg card q-pa-xl">
        <h1 class="q-mb-md">Thank you for Purchasing Digital Certificate!</h1>
        <div v-if="notaryDm && notaryDm.buyDCCertfileUrl">
          <a :href="notaryDm.buyDCCertfileUrl">Download DC</a> <br />
          Password: <span style="font-weight: bold">{{ notaryDm.buyDCCertfilePassword }}</span>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  data () {
    return {
      failure: false,
      notaryDm: {}
    };
  },
  async mounted () {
    await this.updateUpgradeStatus();
  },
  methods: {
    async updateUpgradeStatus() {
      const { data } = await this.axios.post("/notary/buydc-upgrade-status");
      console.log(data);
      this.notaryDm = data?.notaryData || {};
      if (this.notaryDm?.buyDCPurchaseExpiryDate) {
        await this.$store.dispatch("auth/fetchUser");
      } else {
        this.failure = true;
      }
    },
  }
};
</script>
