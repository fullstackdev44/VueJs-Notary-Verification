<template>
  <div
    class="
      flex
      justify-between
      q-pt-md q-pb-md
      workflow-icons
      q-gutter-md
      text-center
    "
  >
    <div class="col flex column flex-center" :class="(currentStage === 'prepare_doc') ? 'black-border-bottom':'mobile-hide'">
      <img src="~assets/document-upload.svg" class="session-guide-icon" />
      <p class="q-pa-md">1. Upload Document</p>
    </div>
    <div v-if="!hidePersonalDetailsTab" class="col column flex flex-center" :class="(currentStage === 'personal_info') ? 'black-border-bottom':'mobile-hide'">
      <img src="~assets/id-card.svg" class="session-guide-icon" />
      <p class="q-pa-md">2. Identity Check</p>
    </div>
    <div v-if="!hidePaymentsTab" class="col column flex flex-center" :class="(currentStage === 'payment_info') ? 'black-border-bottom':'mobile-hide'">
      <img src="~assets/credit-card.svg" class="session-guide-icon" />
      <p class="q-pa-md">{{ paymentInfoIndexNumber }}. Payment Info</p>
    </div>
    <div class="col column flex flex-center" :class="(currentStage === 'meet_notary') ? 'black-border-bottom':'mobile-hide'">
      <img src="~assets/videocall.svg" class="session-guide-icon" />
      <p class="q-pa-md">{{ meetNotaryIndexNumber }}. Meet Notary</p>
    </div>
  </div>
</template>

<script>

export default {
  name: "SessionInputHeader",
  props: {
    currentStage: {
      type: String,
      default: "",
    },
    hidePaymentsTab: {
      type: Boolean,
      default: false,
    },
    hidePersonalDetailsTab: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
    };
  },

  computed: {
    meetNotaryIndexNumber() {
      let indexNumber = "4";
      if (this.hidePaymentsTab || this.hidePersonalDetailsTab) {
        indexNumber = "3";
      }
      if (this.hidePaymentsTab && this.hidePersonalDetailsTab) {
        indexNumber = "2";
      }
      return indexNumber;
    },
    paymentInfoIndexNumber() {
      let indexNumber = "3";
      if (this.hidePersonalDetailsTab) {
        indexNumber = "2";
      }
      return indexNumber;
    }
  },

  watch: {},

  methods: {
  },
};
</script>
