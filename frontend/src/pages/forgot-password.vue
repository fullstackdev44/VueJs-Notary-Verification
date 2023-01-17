<template>
  <q-page
    class="window-height window-width row justify-center"
    style="
      background: url('https://bluenotary.us/assets/img/red-flower.jpg');
      background-size: cover;
    "
  >
    <div class="flex column">
      <div class="flex-center flex q-pa-md">
        <a href="https://bluenotary.us">
          <img
            src="https://bluenotary.us/assets/img/logo-a4-b.png"
            style="width: 70px"
          />
        </a>
      </div>
      <div class="flex flex-center">
        <template v-if="!isSubmitting">
          <forgot-password-form />
        </template>
        <q-circular-progress
          v-else
          indeterminate
          size="50px"
          color="lime"
          class="q-ma-md"
        />
      </div>
    </div>
  </q-page>
</template>

<script>
import ForgotPasswordForm from "components/auth/ForgotPasswordForm";

export default {
  components: {
    ForgotPasswordForm
  },
  data () {
    return {
      isSubmitting: false
    };
  },
};
</script>

<style></style>
