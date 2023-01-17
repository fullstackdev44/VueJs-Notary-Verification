<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-1">
    <auth-header @toggleMenu="leftDrawerOpen = !leftDrawerOpen" />
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import AuthHeader from "@/components/layout/AuthHeader";
// import SidbarList from "@/components/layout/SidbarList";

export default {
  components: {
    AuthHeader,
    // SidbarList,
  },
  data () {
    return {
      leftDrawerOpen: false,
    };
  },
  computed: {
    dashboards () {
        return [];
    },
  },
};
</script>
