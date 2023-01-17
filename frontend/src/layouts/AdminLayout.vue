<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-1">
    <AdminHeader />
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import AdminHeader from "@/components/layout/AdminHeader";

export default {
  components: {
    AdminHeader,
  },
  data () {
    return {
      leftDrawerOpen: false,
    };
  },
};
</script>
