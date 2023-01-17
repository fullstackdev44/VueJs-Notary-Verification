<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-1">
    <auth-header v-if="$user.role === 'customer'" @toggleMenu="leftDrawerOpen = !leftDrawerOpen" />
    <notary-header v-else-if="$user.role === 'notary'" @toggleMenu="leftDrawerOpen = !leftDrawerOpen" />
    <div v-else>
      <q-header
        elevated
        class="bg-white text-grey-8 q-py-xs q-px-md"
        height-hint="58"
      >
        <q-toolbar>
          <img
            style="width: 35px"
            src="https://bluenotary.us/assets/img/logo-a4-b.png"
          />
          <q-space />
          <div class="q-gutter-sm row items-center no-wrap">
            <q-btn dense flat no-wrap>
              <span class="q-pa-sm">{{ $user.name }}</span>
              <q-icon name="arrow_drop_down" size="xs" />
              <q-menu auto-close>
                <q-list dense style="min-width: 200px">
                  <q-item clickable>
                    <a href="https://bluenotary.crisp.help" target="_blank" style="color:#333">
                      <q-item-section>
                        <!-- <q-icon name="support" size="xs" /> -->
                        Help & Support
                      </q-item-section>
                    </a>
                  </q-item>
                  <q-separator />
                  <q-item clickable class="GL__menu-link" @click="signOut">
                    <q-item-section> Sign out </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </q-toolbar>
      </q-header>
    </div>
    <q-page-container>
      <div class="columns">
        <div class="column is-2" />
        <div class="column is-8" style="text-align: center">
          <h1 style="margin-top: 20px">Thank you for joining the session as witness</h1>
          <div style="margin-top: 20px">
            Please review us on <a href="https://www.trustpilot.com/evaluate/bluenotary.us" target="_blank">TrustPilot</a>
          </div>
        </div>
        <div class="column is-2" />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script>

import AuthHeader from "@/components/layout/AuthHeader";
import NotaryHeader from "@/components/layout/NotaryHeader";

export default {
  name: "WitnessSuccess",
  components: {
    AuthHeader,
    NotaryHeader
    // SidbarList,
  },
  data() {
    return {
    };
  },
  watch: {
  },
  methods: {
  },
};
</script>
