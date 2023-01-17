<template>
  <q-page class="q-pa-md flex-center session-container">
    <div class="row flex-center">
      <div v-if="!failure" class="col-12 col-md-6 q-pa-lg card q-pa-xl">
        <h1 class="q-mb-md">Thank you for Purchasing Notary eSeal!</h1>
        <div v-if="notaryDm && notaryDm.sealdata">
          <a :href="notaryDm.sealdata">Download Notary eSeal</a> <br />
        </div>
        <div v-if="notaryDm && notaryDm.buyPngSealdata">
          <a target="_blank" :href="notaryDm.buyPngSealdata">Download Notary eSeal - <b>Transparent background</b></a>
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
      const { data } = await this.axios.post("/notary/buyseal-upgrade-status");
      console.log(data);
      this.notaryDm = data?.notaryData || {};
      if (this.notaryDm?.buySealPurchaseExpiryDate) {
        await this.$store.dispatch("auth/fetchUser");
      } else {
        this.failure = true;
      }
    },
  }
};
</script>
