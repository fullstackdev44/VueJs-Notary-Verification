<template>
  <q-card square class="q-pa-md q-ma-none no-shadow" style="width:420px;">
    <q-card-actions class="flex justify-center items-center">
      <q-btn
        rounded
        size="md"
        color="blue"
        outline
        icon="fab fa-google"
        class="full-width text-white q-mb-lg"
        label="Google Login"
        @click="openGoogleLogin"
      />
    </q-card-actions>
  </q-card>
</template>
<script>
/* eslint-disable no-restricted-globals */

import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";

export default {
  mixins: [VuelidateHelperMixin],
  computed: {
    pathToGoogle() {
      return `${process.env.API_BASE_URL}/google/authorize`;
    },
  },
  methods: {
    openGoogleLogin() {
      location.href = this.pathToGoogle;
    },
  },

};
</script>
