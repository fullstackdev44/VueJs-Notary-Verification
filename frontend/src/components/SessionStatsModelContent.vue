<template>
  <div>
    <div class="row" style="display: flex;">
      <q-card bordered class="my-card q-mt-md q-mr-sm" style="flex-grow: 1">
        <q-card-section>
          <div class="card-title text-bold text-primary">Notary User</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <ul>
            <li>
              Waiting Room : {{ notaryStat.waiting_room }}
            </li>
            <li>
              Video Camera : {{ notaryStat.video_cam }}
            </li>
            <li>
              Joining Status : {{ notaryStat.joining_status }}
            </li>
            <li>
              Recoding Status : {{ notaryStat.recording_status }}
            </li>
            <li>
              Recoding Started at : {{ notaryStat.recording_started_at }}
            </li>
            <li>
              Recoding Time : {{ notaryStat.recording_time }}
            </li>
            <li>
              Session Duration : {{ notaryStat.session_duration }}
            </li>
            <li>
              Pending Items : <div v-html="notaryStat.complete_pending_items" />
            </li>
          </ul>
        </q-card-section>
      </q-card>
      <q-card bordered class="my-card q-mt-md q-mr-sm" style="flex-grow: 1;">
        <q-card-section>
          <div class="card-title text-bold text-primary">Customer User</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <ul>
            <li>
              Waiting Room : {{ customerStat.waiting_room }}
            </li>
            <li>
              Video Camera : {{ customerStat.video_cam }}
            </li>
            <li>
              Joining Status : {{ customerStat.joining_status }}
            </li>
            <li>
              Session Duration : {{ customerStat.session_duration }}
            </li>
          </ul>
        </q-card-section>
      </q-card>
    </div>
    <q-card bordered class="my-card q-mt-md q-mr-sm">
      <q-card-section horizontal style="display: flex;">
        <q-card-section style="flex-grow: 1;">
          <q-card-section>
            <div class="card-title text-bold text-primary">Notary Statistics</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <ul>
              <li v-for="element in notaryElementStats" :key="element.documentName">
                <span class="text-bold">Document Name : {{ element.documentName }} </span><br />
                Static Text : {{ element.staticText }} <br />
                Free Text : {{ element.freeText }} ({{ element.freeTextSummary }})<br />
                Signers Elements : {{ element.signerElements }} ({{ element.signerElemSummary }}) <br />
                Signature : {{ element.signature }} ({{ element.signatureSummary }})<br />
                Seals : {{ element.seal }} <br />
                Certificate : {{ element.certificate }} <br />
                Blank Pages : {{ element.blankPages }}
              </li>
            </ul>
          </q-card-section>
        </q-card-section>
        <q-separator vertical spaced="10px" />
        <q-card-section style="flex-grow: 1;">
          <q-card-section>
            <div class="card-title text-bold text-primary">Customer Statistics</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <ul>
              <li v-for="element in customerElementsStats" :key="element.documentName">
                <span class="text-bold">Document Name : {{ element.documentName }} </span><br />
                Static Text : {{ element.staticText }} <br />
                Free Text : {{ element.freeText }} ( {{ element.freeTextSummary }} ) <br />
                Signature : {{ element.signature }} ( {{ element.signatureSummary }} ) <br />
              </li>
            </ul>
          </q-card-section>
        </q-card-section>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import { $axios } from "boot/axios";

export default {
  name: "ActiveSessionStatsModelContent",
  components: {},
  props: {
    sessionItem: {
      type: Object,
      default: () => {}
    },
  },
  data () {
    return {
      status: "",
      notaryStat: {},
      customerStat: {},
      notaryElementStats: [],
      customerElementsStats: [],
      sessionInfoInterval: false,
      elementsStatsInternval: false
    };
  },
  mounted () {
    (async () => {
      await this.fetchSessionStats();
      await this.fetchElementStats();
    })();
    this.sessionInfoInterval = setInterval(() => {
      this.fetchSessionStats();
    }, 10000);
    this.elementsStatsInternval = setInterval(() => {
      this.fetchElementStats();
    }, 10000);
  },
  beforeDestroy () {
    if (this.sessionInfoInterval) {
      clearInterval(this.sessionInfoInterval);
    }
    if (this.elementsStatsInternval) {
      clearInterval(this.elementsStatsInternval);
    }
  },
  methods: {
    async fetchSessionStats() {
      this.status = "Refreshing...";
      const url = `admins/getActiveSessionStat/${this.sessionItem.session._id}`;
      const resp = await $axios.get(url);
      if (resp.data.err) {
        this.status = resp.data.err;
      } else {
        this.notaryStat = resp.data.notaryStat || {};
        this.customerStat = resp.data.customerStat || {};
      }
    },
    async fetchElementStats () {
      this.status = "Refreshing elements stats...";
      const url = `admins/getActiveSessionElements/${this.sessionItem.session._id}`;
      const resp = await $axios.get(url);
      if (resp.data.err) {
        this.status = resp.data.err;
      } else {
        this.notaryElementStats = resp.data.notary || [];
        this.customerElementsStats = resp.data.customer || [];
      }
    }
  }
};
</script>
