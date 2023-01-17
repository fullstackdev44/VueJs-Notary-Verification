<template>
  <div v-if="streamManager" class="openviduDiv">
    <ov-video :stream-manager="streamManager" />
    <div style="font-size: 12px; margin-top: -8px; text-align: center">{{ clientData }}</div>
  </div>
</template>

<script>
import OvVideo from "./OvVideo";

export default {
  name: "UserVideo",

  components: {
    OvVideo,
  },

  props: {
    streamManager: {
      type: Object,
      default: () => {}
    },
  },

  computed: {
    clientData () {
      const { clientData } = this.getConnectionData();
      return clientData;
    },
  },

  methods: {
    getConnectionData () {
      const { connection } = this.streamManager.stream;
      return JSON.parse(connection.data);
    },
  },
};
</script>

<style>
@media (max-width: 992px) {
  .openviduDiv{
    max-width: 30%;
  }
}
</style>
