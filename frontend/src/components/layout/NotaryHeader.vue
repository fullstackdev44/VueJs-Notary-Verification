<template>
  <div>
    <q-header
      elevated
      class="bg-white text-grey-8 q-py-xs q-px-md"
      height-hint="58"
    >
      <!-- <div
        v-if="browserIncompatibilityError"
        style="
          width: 100%;
          text-align: center;
          background: #f595af;
          color: white;
          margin-left: -16px;
          margin-top: -4px;
          width: 100vw;
        "
      >
        Please use
        <a href="https://www.google.com/chrome/"><u>Chrome browser</u></a> for
        notarization sessions.
      </div> -->
      <q-toolbar>
        <img
          style="width: 35px"
          src="https://bluenotary.us/assets/img/logo-a4-b.png"
        />
        <q-space />
        <div class="q-gutter-sm row items-center no-wrap q-pr-lg notary-nav">
          <div
            v-if="$user && $user.memberType === 'free'"
            class="q-px-md"
            style="cursor: pointer; color: green"
            @click="showUpgradePopup"
          >
            <q-badge color="green" outline>Upgrade Account</q-badge>
          </div>
          <router-link to="/notary/dashboard" class="q-px-md">
            Dashboard
          </router-link>
          <template v-if="$user.approve !== 'inactive'">
            <router-link to="/notary/my-sessions" class="q-px-md">
              Journal
            </router-link>
            <router-link
              v-if="$user.memberType !== 'free'"
              to="/notary/templates"
              class="q-px-md"
            >
              Templates
            </router-link>
            <a v-if="$user.memberType === 'free'" class="q-px-md tempmenu" @click="showUpgradePopup"> Templates </a>
          </template>
        </div>
        <div class="q-gutter-sm row items-center no-wrap">
          <q-btn dense flat no-wrap>
            <span class="q-pa-sm">{{ $user.name }}</span>
            <q-badge
              v-if="
                $user && $user.role === 'notary' && $user.approve === 'inactive'
              "
              color="red"
            >
              Pending Approval
            </q-badge>
            <q-icon name="arrow_drop_down" size="xs" />
            <q-menu auto-close>
              <q-list dense style="min-width: 200px">
                <q-item clickable>
                  <router-link to="/notary/account-settings" style="color:#333">
                    <q-item-section> Account Settings </q-item-section>
                  </router-link>
                </q-item>
                <q-separator />
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
    <upgrade-account-popup-component :open-acc-pro-model="openUpgradePopup" />
  </div>
</template>
<script>
import $ from "jquery";
import UpgradeAccountPopupComponent from "../../pages/notary/upgradeAccount.vue";

export default {
  components: { UpgradeAccountPopupComponent },
  data() {
    return {
      openUpgradePopup: false,
      count: 0,
      attachmentCount: 0,
      polling: null,
      // browserIncompatibilityError: false,
    };
  },
  mounted() {
    // this.browserIncompatibilityError = !/chrome/i.test(navigator.userAgent);
    setTimeout(() => {
      if (this.$user.memberType === "free") {
        $(".crisp-client").hide();
      }
    }, 2000);
  },
  methods: {
    async loadMessage() {
      const { data } = await this.axios.get("/messages/count");
      this.count = data?.count ?? 0;
      this.attachmentCount =
        (await this.axios.get("/attachments/count").data?.count) ?? 0;
    },
    clearPolling() {
      clearInterval(this.polling);
      this.polling = null;
    },
    showUpgradePopup() {
      this.openUpgradePopup = false;
      setTimeout(() => {
        this.openUpgradePopup = true;
      }, 200);
    },
  },
};
</script>
<style scoped>
.nav-color {
  color: #333 !important;
}
.router-link-active {
  color: #0000ff !important;
}
</style>
