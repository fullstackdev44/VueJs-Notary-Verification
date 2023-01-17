<template>
  <q-page class="q-pa-md flex-center session-container">
    <div class="row">
      <div class="col-12 col-md-12">
        <session-header :session-id="sessionid" />
      </div>
      <div class="col-12 col-md-12 q-pa-lg workflow-container">
        <session-input-header v-if="!calledFromBusinessPage && !calledFromSessionPage" current-stage="personal_info" :hide-payments-tab="hidePaymentsTab" />
        <div class="row">
          <div class="col-12 q-mt-lg">
            <div class="col-12">
              <h5>
                Questions
                <q-chip color="teal" text-color="white" icon="alarm">
                  {{ kbaTimer }} Minutes Left
                </q-chip>
              </h5>
              <p class="q-mb-md">
                Please answer following questions.
              </p>
            </div>
            <div v-for="question, key in currentQuestions" :key="key" class="q-gutter-sm q-pb-lg row">
              <h6 style="width: 100%"><strong>{{ question['@_text'] }}</strong></h6>
              <div class="q-gutter-sm">
                <q-radio v-for="answer, index in question.Answer"
                         :key="index"
                         v-model="answersSelected[key]"
                         checked-icon="task_alt"
                         unchecked-icon="panorama_fish_eye"
                         :val="answer.text"
                         :label="String(answer.text)"
                         style="width: 100%" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- next btn -->
      <q-btn
        class="next-btn q-mt-md q-mb-xl"
        label="Next"
        color="primary"
        :disabled="disableNextButton"
        @click="nextButtonClick()"
      />
    </div>
    <q-dialog v-model="failed">
      <q-card>
        <q-card-section>
          <div class="text-h6">Failed</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Your personal data verification failed. Unfortunately, we cannot continue your session.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn outline label="OKAY" color="primary" @click="failSession()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="failedQuestions" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Failed</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          You failed to answer {{ totalCorrectAnswersToPass }} or more correctly. Unfortunately, we cannot continue your session.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn outline label="OKAY" color="primary" @click="failSession()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="timerEndedForSetAModal" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ timerEndedForSetAModalHeader }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          {{ timerEndedForSetAModalText }}
        </q-card-section>

        <q-card-actions align="right">
          <q-btn outline label="Start" color="primary" @click="startQuestionSetB()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";
import _ from "lodash";
import states from "@/data/states.json";
import SessionHeader from "../../components/SessionHeader.vue";
import SessionInputHeader from "./SessionInputHeader.vue";

export default {
  name: "KBA",
  components: { SessionHeader, SessionInputHeader },
  props: {
    calledFromBusinessPage: {
      type: Boolean,
      default: false
    },
    calledFromBusinessPageSessionId: {
      type: String,
      default: ""
    },
    calledFromSessionPage: {
      type: Boolean,
      default: false
    },
    calledFromSessionPageSessionId: {
      type: String,
      default: ""
    },
    kbaModalChangeSection: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      states,
      sessionid: "",
      typeOfKBA: "",
      totalCorrectAnswersToPass: 4,
      kbaTimer: "02:00",
      timerInterval: false,
      timerEndedForSetAModal: false,
      timerEndedForSetAModalHeader: false,
      timerEndedForSetAModalText: false,
      currentQuestions: [],
      disableNextButton: false,
      sessionData: {},
      hidePaymentsTab: false
    };
  },
  async mounted () {
    // this.hidePaymentsTab = this?.$vendorDoc?.skipSessionCharges || false;
    this.sessionid = (this.$route.params && this.$route.params.id) || false;
    if (this.calledFromBusinessPageSessionId) {
      this.sessionid = this.calledFromBusinessPageSessionId;
    }
    if (this.calledFromSessionPageSessionId) {
      this.sessionid = this.calledFromSessionPageSessionId;
    }
    this.currentSession = this.$q.localStorage.getItem("sessionData");
    if (!this.calledFromBusinessPage && !this.calledFromSessionPage) {
      if (!this.currentSession) {
        this.$router.replace(`/business/personal_info/${this.sessionid}`).catch(() => {});
      } else if (this.$route.query.demo && this.$route.query.demo === "true") {
        this.$router.replace(`/business/kba/${this.sessionid}?demo=true`).catch(() => {});
      } else if (this.$user.testingacc && this.$user.testingacc === true) {
        this.$router.replace(`/business/kba/${this.sessionid}?demo=true`).catch(() => {});
      } else {
        this.$router.replace(`/business/kba/${this.sessionid}`).catch(() => {});
      }
    }
    if (!this.currentSession) {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
    }
    const res = await this.loadPersonalData(this.sessionid, this.calledFromBusinessPage, this.calledFromSessionPage);
    console.log("res", res);
    if (res?.failedByRefresh && !(this.calledFromBusinessPage || this.calledFromSessionPage)) {
      this.$q.notify({
        color: "danger",
        position: "bottom-right",
        message: "You aborted workflow. Going back to Prepare Doc Stage",
      });
      if (this.$route.query.demo && this.$route.query.demo === "true") {
        this.$router.replace(`/business/prepare_doc/${this.sessionid}/?demo=true`).catch(() => {});
      } else if (this.$user.testingacc && this.$user.testingacc === true) {
        this.$router.replace(`/business/prepare_doc/${this.sessionid}/?demo=true`).catch(() => {});
      } else {
        this.$router.replace(`/business/prepare_doc/${this.sessionid}`).catch(() => {});
      }
      return;
    }
    this.hidePaymentsTab = this?.$vendorDoc?.skipSessionCharges || res?.vendorDoc?.skipSessionCharges || res?.sessionDoc?.sessionChargeOnBusinessUser || this.$user.skipSessionCharges || false;
    console.log("this.$route.query", this.$route.query);
    let demoFlag = (this.$route.query.demo && this.$route.query.demo === "true") || false;
    if (this.$user.testingacc) {
      demoFlag = true;
    }
    console.log("demoFlag", demoFlag);
    const evsRes = await this.sendEvsIntegration(this.sessionid, demoFlag);
    console.log("evsRes", evsRes);
    let evsFailed = false;
    if (evsRes.output === "Identity Check Outside Time") {
      this.$q.notify({
        color: "red",
        position: "bottom-right",
        message: "You can only perform Identity Check Stage 12 hours before or after the session scheduled time.",
        timeout: 4000
      });
      this.disableNextButton = true;
      this.kbaModalChangeSection("failed", "You can only perform Identity Check Stage 12 hours before the session start time.");
      return;
    }
    if (!(evsRes.output && (evsRes.output === "Pass" || evsRes.output === "Needs Further Review"))) {
      evsFailed = true;
      this.$q.notify({
        color: "red",
        position: "bottom-right",
        message: "Your identity verification failed. We cannot continue your session.",
        timeout: 4000
      });
      this.kbaModalChangeSection("failed", "Your identity verification failed. We cannot continue your session. Try again after 24 hours.");
      setTimeout(() => {
        this.failSession(true);
      }, 4000);
      return;
    }
    if (!evsFailed && evsRes.output && evsRes.test && evsRes.test.Questions && typeof evsRes.test.Questions === "object" && evsRes.test.Questions.Question) {
      this.questions = evsRes.test.Questions.Question;
      this.currentQuestions = _.take(this.questions, 5);
      if (demoFlag) {
        this.currentQuestions.forEach((question, key) => {
          question.Answer.forEach((answer) => {
            if (answer["@_correct"] && answer["@_correct"] === "true") {
              this.answersSelected[key] = answer.text;
            }
          });
        });
      }
    } else if (this.calledFromBusinessPage || this.calledFromSessionPage) {
      this.kbaModalChangeSection("failed", "You can only perform Identity Check Stage 12 hours before the session start time");
    } else {
      const url = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=identity_check_stage_fail`;
      await $axios.get(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      this.failed = true;
      this.$q.notify({
        color: "red",
        position: "bottom-right",
        message: "The details you entered are incorrect. Session is being terminated.",
      });
    }
    this.startTimer();
    // window.addEventListener("beforeunload", () => {
    //   if (window.onbeforeunload) {
    //     const url = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=kba_check_stage_aborted`;
    //     $axios.get(url, {
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //     });
    //     window.onbeforeunload = null;
    //   }
    // });
    // window.onpopstate = () => {
    //   if (window.onbeforeunload) {
    //     const url = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=kba_check_stage_aborted`;
    //     $axios.get(url, {
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //     });
    //     window.onbeforeunload = null;
    //   }
    // };
  },
  // beforeDestroy() {
  //   console.log("before destroy called", window.onbeforeunload);
  //   // if (window.onbeforeunload) {
  //   // }
  // },
  // destroyed() {
  //   console.log("destroy destroyed", window.onbeforeunload);
  // },
  setup () {
    const loading = ref(false);
    const failed = ref(false);
    const failedQuestions = ref(false);
    const currentSession = ref(null);
    const questions = ref([]);
    const questionBlock = ref("A");
    const answersSelected = ref([]);
    const loadPersonalData = async (sessionId, calledFromBusinessPage, calledFromSessionPage) => {
      try {
        console.log("calledFromSessionPage", calledFromSessionPage);
        const url = "session/load/personalData";
        const messageToSend = {
          sessionId
        };
        if (calledFromBusinessPage) {
          messageToSend.additionalSigner = calledFromBusinessPage;
        }
        const response = await $axios.post(url, messageToSend, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const verifyAnswers = async (session, answers, calledFromBusinessPage, calledFromSessionPage) => {
      try {
        let url = `session/verifyCustomerAnswersDuringSessionFlow/${session}`;
        if (calledFromBusinessPage) {
          url += "?calledFromBusinessPage=true";
        }
        if (calledFromSessionPage) {
          url += "?calledFromSessionPage=true";
        }
        const response = await $axios.post(url, { answers, questionBlock: questionBlock.value }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const sendEvsIntegration = async(sessionId, demo) => {
      try {
        let url = `session/getCustomerDetailsDuringSessionFlow/${sessionId}`;
        if (demo && demo === true) {
          url += "/?demo=true";
        }
        const response = await $axios.get(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        console.log("ERROR --------------------------", error);
        return error;
      }
    };
    return {
      loading,
      failed,
      failedQuestions,
      sendEvsIntegration,
      currentSession,
      questions,
      questionBlock,
      answersSelected,
      verifyAnswers,
      loadPersonalData
    };
  },
  methods: {
    startTimer() {
      // window.onbeforeunload = () => "";
      const duration = 120; // in seconds
      let timer = duration; // in seconds
      let minutes = 0;
      let seconds = 0;
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      this.timerInterval = setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? `0${minutes}` : minutes;
        seconds = seconds < 10 ? `0${seconds}` : seconds;

        // display.text(`${minutes}:${seconds}`);
        this.kbaTimer = `${minutes}:${seconds}`;
        timer -= 1;
        if (timer < 0) {
          if (this.questionBlock === "A") {
            this.timerEndedForSetAModal = true;
            this.timerEndedForSetAModalHeader = "Timer Ended for Question Set";
            this.timerEndedForSetAModalText = "The 2 minute timer for current question set has ended. We can provide you 1 more question set for validation. Click 'Start' when ready.";
          } else if (this.calledFromBusinessPage || this.calledFromSessionPage) {
            // window.onbeforeunload = null;
            this.kbaModalChangeSection("failed", "Timer has reached 0. You cannot continue this session");
          } else {
            // window.onbeforeunload = null;
            this.$q.notify({
              color: "red",
              position: "bottom-right",
              message: "Timer has reached 0. You cannot continue this session",
            });
            const url = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=kba_check_stage_fail`;
            $axios.get(url, {
              headers: {
                "Content-Type": "application/json",
              },
            });
            this.failSession();
            // window.location.reload();
          }
          timer = 0;
        }
      }, 1000);
    },
    startQuestionSetB() {
      this.questionBlock = "B";
      this.currentQuestions = [];
      for (let i = 0; i < 5; i += 1) {
        this.currentQuestions.push(this.questions[5 + i]);
      }
      let demoFlag = (this.$route.query.demo && this.$route.query.demo === "true") || false;
      if ((this.calledFromBusinessPage || this.calledFromSessionPage) && this.$user.testingacc) {
        demoFlag = true;
      }
      if (demoFlag) {
        this.currentQuestions.forEach((question, key) => {
          question.Answer.forEach((answer) => {
            if (answer["@_correct"] && answer["@_correct"] === "true") {
              this.answersSelected[key] = answer.text;
            }
          });
        });
      }
      this.startTimer();
      this.timerEndedForSetAModal = false;
    },
    failSession (dontSendKBAModalChanges) {
      // window.onbeforeunload = null;
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      if (this.calledFromBusinessPage || this.calledFromSessionPage) {
        if (!dontSendKBAModalChanges) {
          this.kbaModalChangeSection("failed", "Timer Expired. Please Restart");
        }
      } else {
        this.$router.replace("/business");
      }
    },
    async nextButtonClick () {
      if (this.questions.length > 0) {
        this.verifyQuestionAnswers();
      }
    },
    async answersCorrect() {
      // window.onbeforeunload = null;
      this.$q.notify({
        color: "primary",
        position: "bottom-right",
        message: `You've answered ${this.totalCorrectAnswersToPass} or more questions correctly.`,
      });
      // let stageValue = "payment_info_stage";
      let stageValue = "photoid_check_stage";
      let extraParams = "";
      if (this.calledFromBusinessPage || this.calledFromSessionPage) {
        stageValue = "photoid_check_stage";
        // stageValue = "meet_notary";
        extraParams += "&additionalSigner=true";
      }
      const url = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=${stageValue}${extraParams}`;
      await $axios.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      window.sessionStorage.setItem(`${this.sessionid}_kba`, "true");
      if (this.calledFromBusinessPage || this.calledFromSessionPage) {
        this.kbaModalChangeSection("photoid");
      } else if (this.$route.query.demo && this.$route.query.demo === "true") {
          this.$router.replace(`/business/photoid/${this.sessionid}/?demo=true`).catch(() => {});
        } else if (this.$user.testingacc && this.$user.testingacc === true) {
          this.$router.replace(`/business/photoid/${this.sessionid}/?demo=true`).catch(() => {});
        } else {
          this.$router.replace(`/business/photoid/${this.sessionid}`).catch(() => {});
        }
      // } else if (this.$route.query.demo && this.$route.query.demo === "true") {
      //     this.$router.replace(`/business/photoid/${this.sessionid}/?demo=true`).catch(() => {});
      //   } else if (this.$user.testingacc && this.$user.testingacc === true) {
      //     this.$router.replace(`/business/photoid/${this.sessionid}/?demo=true`).catch(() => {});
      //   } else {
      //     this.$router.replace(`/business/photoid/${this.sessionid}`).catch(() => {});
      //   }
      // if (this.calledFromBusinessPage) {
      //   this.kbaModalChangeSection("meet_notary");
      // } else if (sessionDoc.sessionChargeOnBusinessUser) {
      //   if (this.$route.query.demo && this.$route.query.demo === "true") {
      //     this.$router.replace(`/business/meet_notary/${this.sessionid}/?demo=true`).catch(() => {});
      //   } else if (this.$user.testingacc && this.$user.testingacc === true) {
      //     this.$router.replace(`/business/meet_notary/${this.sessionid}/?demo=true`).catch(() => {});
      //   } else {
      //     this.$router.replace(`/business/meet_notary/${this.sessionid}`).catch(() => {});
      //   }
      // } else if (this.$route.query.demo && this.$route.query.demo === "true") {
      //     this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
      //   } else if (this.$user.testingacc && this.$user.testingacc === true) {
      //     this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
      //   } else {
      //     this.$router.replace(`/business/payment_info/${this.sessionid}`).catch(() => {});
      //   }
      // if (this.calledFromBusinessPage) {
      //   this.kbaModalChangeSection("meet_notary");
      // } else if (this.$route.query.demo && this.$route.query.demo === "true") {
      //   this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
      // } else if (this.$user.testingacc && this.$user.testingacc === true) {
      //   this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
      // } else {
      //   this.$router.replace(`/business/payment_info/${this.sessionid}`).catch(() => {});
      // }
    },
    async answersIncorrect() {
      console.log(this.questionBlock);
      if (this.questionBlock === "A") {
        this.$q.notify({
          color: "red",
          position: "bottom-right",
          message: "Initial Question set has failed. Please try again with new questions",
        });
        this.timerEndedForSetAModal = true;
        this.timerEndedForSetAModalHeader = "Question Set Failed";
        this.timerEndedForSetAModalText = "You failed the question set. We will now give you a second set of questions. You will have 2 minutes to complete";
        // this.startQuestionSetB();
      } else if (this.calledFromBusinessPage || this.calledFromSessionPage) {
        // window.onbeforeunload = null;
        this.kbaModalChangeSection("failed", `You failed to answer ${this.totalCorrectAnswersToPass} or more correctly. Unfortunately, we cannot continue your session.`);
      } else {
        // window.onbeforeunload = null;
        const url = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=kba_check_stage_fail`;
        await $axios.get(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        this.failedQuestions = true;
      }
    },
    async verifyQuestionAnswers () {
      console.log("in verify answers", this.answersSelected.length);
      // no answers
      if (!this.answersSelected.length) {
        return this.$q.notify({
          color: "red",
          position: "bottom-right",
          message: "Please provide an answer for each question.",
        });
      }
      // still any question is missing
      if (this.answersSelected.includes(undefined)) {
        return this.$q.notify({
          color: "red",
          position: "bottom-right",
          message: "Please provide an answer for each question.",
        });
      }

      // send the answers to verify
      const res = await this.verifyAnswers(this.sessionid, this.answersSelected, this.calledFromBusinessPage, this.calledFromSessionPage);
      console.log(res);
      if (res.kbaTimeOver) {
        this.$q.notify({
          color: "red",
          position: "bottom-right",
          message: "Timer has reached 0. Please retry the KBA.",
        });
        window.location.reload();
        return false;
      }
      this.totalCorrectAnswersToPass = res.totalCorrectAnswersToPass;
      if (res.status) {
        // await this.answersCorrect(res.newSessionModelData);
        await this.answersCorrect();
      } else {
        await this.answersIncorrect();
      }
      return true;
    },
  },
};
</script>
