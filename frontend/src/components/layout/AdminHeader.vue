<template>
  <div>
    <q-header elevated class="bg-white text-grey-8 q-py-xs q-px-md" height-hint="58">
      <q-toolbar>
        <img style="width:35px;" src="https://bluenotary.us/assets/img/logo-a4-b.png" />
        <q-space />
        <div class="q-gutter-sm row items-center no-wrap q-pr-lg notary-nav">
          <router-link to="/customers" class="q-px-md">
            Customers
          </router-link>
          <router-link to="/users-sessions" class="q-px-md">
            Sessions
          </router-link>
          <router-link to="/notaries" class="q-px-md">
            Notaries
          </router-link>
          <router-link to="/metrics" class="q-px-md">
            Metrics
          </router-link>
        </div>
        <div class="q-gutter-sm row items-center no-wrap">
          <q-btn dense flat no-wrap>
            <span class="q-pa-sm">{{ $user.name }}</span>
            <q-icon name="arrow_drop_down" size="16px" />
            <q-menu auto-close>
              <q-list dense style="min-width: 200px">
                <q-item clickable>
                  <router-link to="/admin" class="nav-color">
                    <q-item-section> Account Settings </q-item-section>
                  </router-link>
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
</template>
<script>

export default {
  data () {
    return {
      count: 0,
      attachmentCount: 0,
      polling: null
    };
  }
};
</script>
<style scoped>
.nav-color {
  color: #333!important
}
.router-link-active {
  color: #0000ff!important;
}
</style>
