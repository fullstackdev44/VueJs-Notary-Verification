<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-1">
    <auth-header @toggleMenu="leftDrawerOpen = !leftDrawerOpen" />
    <q-drawer
      v-model="leftDrawerOpen"
      bordered
      behavior="desktop"
      content-class="bg-grey-2"
      :width="240"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <template v-if="dashboards.length">
            <q-item-label header class="text-weight-bold text-uppercase">
              Dashboard
            </q-item-label>

            <sidbar-list :items="dashboards" />
          </template>

          <template v-if="isNotary || isAdmin">
            <q-item-label header class="text-weight-bold text-uppercase">
              Admin
            </q-item-label>
            <sidbar-list :items="adminItems" />
          </template>
          <sidbar-list :items="userItems" />
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import AuthHeader from "@/components/layout/AuthHeader";
import SidbarList from "@/components/layout/SidbarList";
import UserType from "@/constants/user-types";

export default {
  components: {
    AuthHeader,
    SidbarList,
  },
  data () {
    return {
      leftDrawerOpen: false,
    };
  },
  computed: {
    dashboards () {
      console.log("dashboards ", this.$user?.role);

      let customerRoute = "/business";
      const inviteSessionID = localStorage.getItem("inviteSessionID");

      switch (this.$user?.role) {
        case UserType.Notary:
          console.log("this.$onBoarding", this.$onBoarding);
          // case 1: no onboarding yet
          if (this.$onBoarding !== true) {
            return this.$router.replace("/notary/account-settings");
          }
          if (this.$onBoarding === true) {
            // case 3: all done
            if (this.$user.approve !== "inactive") {
              return this.$router.replace("/notary");
            }
            // case 2: onboarding done, but account not approved yet.
            return this.$router.replace("/notary/account-settings");
          }
          // just in case,
          return this.$router.replace("/notary");

        case UserType.Admin:
          return this.$router.replace("/admin");
        case UserType.Customer:
          if (inviteSessionID !== null) {
            localStorage.removeItem("inviteSessionID");
            customerRoute = `/business/prepare_doc/${inviteSessionID}`;
          }
          return this.$router.replace(customerRoute);
        default:
          return [];
      }
    },

    adminItems () {
      switch (this.$user?.role) {
        case UserType.Admin:
          return [
            { icon: "people", text: "Users", link: "/admin/users" },
          ];
        default:
          return [];
      }
    },
    userItems () {
      switch (this.$user?.type) {
        case UserType.Customer:
          return [
            { icon: "logout", text: "Sign Out", action: this.signOut },
          ];
        default:
          return [
            { icon: "password", text: "Change Password", link: "/auth/change-password" },
            { icon: "logout", text: "Sign Out", action: this.signOut },
          ];
      }
    },
  },
};
</script>
