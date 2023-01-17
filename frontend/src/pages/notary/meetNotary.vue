<template>
  <div>
    <q-page class="q-pa-md flex-center session-container">
      <div class="row">
        <div class="col-12 col-md-12">
          <h1 class="">Notarization Session E39J32</h1>
        </div>
        <div class="col-12 col-md-12 q-pa-lg workflow-container">
          <div
            class="
              flex
              justify-between
              q-pt-md q-pb-md
              workflow-icons
              q-gutter-md
            "
          >
            <div class="col flex column flex-center">
              <img
                src="~assets/document-upload.svg"
                class="session-guide-icon"
              />
              <p class="q-pa-md">1. Upload Document</p>
              <q-icon name="check_circle" />
            </div>
            <div class="col column flex flex-center">
              <img src="~assets/id-card.svg" class="session-guide-icon" />
              <p class="q-pa-md">2. Identity Check</p>
              <q-icon name="check_circle" />
            </div>
            <div class="col column flex flex-center">
              <img src="~assets/credit-card.svg" class="session-guide-icon" />
              <p class="q-pa-md">3. Payment Info</p>
              <q-icon name="check_circle" />
            </div>
            <div class="col column flex flex-center black-border-bottom">
              <img src="~assets/videocall.svg" class="session-guide-icon" />
              <p class="q-pa-md">4. Meet Notary</p>
            </div>
          </div>
          <div class="row">
            <div
              class="col-8 col-md-8 offset-md-2 flex q-mt-lg q-pr-lg q-mb-xl"
            >
              <div class="flex flex-center column">
                <div class="text-center">
                  <h5 class="">
                    We will now connect you with the notary in a video meeting
                    to finish the notarization process.
                  </h5>
                </div>
                <div class="">
                  <q-btn class="btn btn-primary q-pa-md"
                         @click="getSignature"
                  >
                    Start the video meeting
                  </q-btn
                  >
                </div>
              </div>
            </div>
            <div class="col-4 flex" />
          </div>
        </div>
      </div>
    </q-page>
  </div>
</template>

<script>
import { ref } from "@vue/composition-api";

export default {
  name: "PersonalDetails",
  watch: {

  },
  created () {
  },
  async mounted () {
    this.currentSession = this.$q.localStorage.getItem("sessionData");
    if (!this.currentSession) {
      this.$router.replace("/business/personal_info");
    }
    const signature = await this.loadPersonalData();
    console.log(signature);
  },
  setup () {
    const loading = ref(false);
    const currentSession = ref(null);

    const apiKey = ref("4waez78zShGleGVhW2nIYQ");
    const leaveUrl = ref("http://localhost:8080");
    const meetingNumber = ref("82315777577");
    const passWord = ref("9fFZi6");
    const role = ref(1);
    const userEmail = ref("");
    const userName = ref("wewe");
    const registrantToken = ref("");

    return {
      loading,
      currentSession,
      apiKey,
      leaveUrl,
      meetingNumber,
      passWord,
      role,
      userEmail,
      userName,
      registrantToken
    };
  },
  methods: {
    getSignature () {
    }
  }
};
</script>
