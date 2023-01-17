<template>
  <q-page class="">
    <password-form />
  </q-page>
</template>

<script>
import PasswordForm from "@/components/user/account/PasswordForm";
import PermissionMiddleware from "@/mixins/PermissionMiddleware";

export default {
  components: {
    PasswordForm,
  },
  mixins: [PermissionMiddleware],
};
</script>
