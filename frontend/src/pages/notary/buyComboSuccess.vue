<template>
  <q-page class="q-pa-md flex-center session-container">
    <div class="row flex-center">
      <div v-if="!failure" class="col-12 col-md-6 q-pa-lg card q-pa-xl">
        <h1 class="q-mb-md">Thank you for Purchasing Lifetime DC and Notary eSeal Combo!</h1>
        <div v-if="notaryDm && notaryDm.sealdata">
          <a :href="notaryDm.sealdata">Download Notary eSeal</a> <br />
        </div>
        <div v-if="notaryDm && notaryDm.buyPngSealdata">
          <a target="_blank" :href="notaryDm.buyPngSealdata">Download Notary eSeal - <b>Transparent background</b></a>
        </div>
        <div v-if="notaryDm && notaryDm.buyDCCertfileUrl" style="margin-top: 12px">
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
      const { data } = await this.axios.post("/notary/buycombo-upgrade-status");
      console.log(data);
      this.notaryDm = data?.notaryData || {};
      if (this.notaryDm?.buyComboPurchaseExpiryDate) {
        await this.$store.dispatch("auth/fetchUser");
      } else {
        this.failure = true;
      }
    },
  }
};
</script>
