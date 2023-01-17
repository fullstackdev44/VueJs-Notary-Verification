<template>
  <div>
    <q-btn
      v-if="$user.memberType === 'free'"
      class="full-width"
      label="Upgrade to Pro"
      color="green"
      :loading="loading"
      @click="upgradeToPro()"
    />
    <q-dialog v-model="card">
      <q-card class="my-card">
        <q-card-section>
          <div class="text-h6">Upgrade Pro Hybrid</div>
        </q-card-section>
        <q-card-section />
        <q-card-actions align="right">
          <q-btn
            v-close-popup
            outline
            class="q-ml-sm"
            color="green"
            label="Upgrade"
            @click="upgradeToPro()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { loadStripe } from "@stripe/stripe-js/pure";
import { ref } from "@vue/composition-api";

export default {
  name: "UpgradeToProComponent",
  data() {
    return {
      loading: false,
      card: ref(false),
    };
  },

  mounted() {
  },
  methods: {
    async loadMessage() {
      const { data } = await this.axios.get("/messages/count");
      this.count = data?.count ?? 0;
      this.attachmentCount =
        (await this.axios.get("/attachments/count").data?.count) ?? 0;
    },
    async upgradeToPro() {
      console.log("NotaryHeader", this.stripe);
      this.loading = true;
      if (process.env.STRIPE_PUBLIC_KEY_TEST) {
        if (!this.stripe) {
          if (this.$user.testingacc) {
            const pubkey = process.env.STRIPE_PUBLIC_KEY_TEST;
            this.stripe = await loadStripe(pubkey);
          } else {
            const pubkey = process.env.STRIPE_PUBLIC_KEY;
            this.stripe = await loadStripe(pubkey);
          }
        }
      }
      this.loading = false;
      try {
        const { data } = await this.axios.post("/notary/checkout-session");
        console.log("fpr - upgrade pro referral", this.$user.email, this.$user._id);
        window.fpr("referral", { email: this.$user.email, uid: this.$user._id });
        return this.stripe.redirectToCheckout({ sessionId: data.id });
      } catch (error) {
        return error;
      }
    },
  },
};
</script>
