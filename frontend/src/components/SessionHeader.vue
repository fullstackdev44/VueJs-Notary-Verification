<template>
  <h1 class="q-my-sm">
    Notarization Session <template v-if="sessionId">
      {{ sessionId.substr(sessionId.length - 5).toUpperCase() }}
    </template>
  </h1>
</template>
<script>
export default {
    props: {
        sessionId: {
            type: String,
            default() {
                return "";
            },
        },
    },
};
</script>
