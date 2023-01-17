<template>
  <q-page class="">
    <email-setting :user="$user" />
    <q-separator class="q-my-md" />
    <password-form />
  </q-page>
</template>

<script>
import EmailSetting from "@/components/user/account/EmailSetting";
import PasswordForm from "@/components/user/account/PasswordForm";
import PermissionMiddleware from "@/mixins/PermissionMiddleware";

export default {
  components: {
    EmailSetting,
    PasswordForm,
  },
  mixins: [PermissionMiddleware],
};
</script>
