<template>
  <q-card square class="q-pa-xs q-ma-none no-shadow">
    <div style="max-width:500px">
      <q-card-section>
        <p class="text-weight-bolder text-grey">
          You can select accounts to check Queue
        </p>
      </q-card-section>
      <q-card-section class="q-py-none">
        <q-form ref="form">
          <div class="q-gutter-sm">
            <q-checkbox
              v-for="user in customers"
              :key="user.id"
              v-model="selectedUsers"
              :val="user.id"
              :label="user.email"
              color="cyan"
            />
          </div>
        </q-form>
        <q-inner-loading :showing="isSubmitting">
          <q-spinner-gears size="50px" color="primary" />
          <p>
            Saving
          </p>
        </q-inner-loading>
      </q-card-section>
    </div>
  </q-card>
</template>
<script>
import {
  required, minLength,
} from "vuelidate/lib/validators";
import { mapGetters } from "vuex";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";

export default {
  mixins: [VuelidateHelperMixin],
  data() {
    return {
      model: {
        name: "",
      },
      isSubmitting: false,
      users: [],
    };
  },
  validations: {
    model: {
      name: { required, minLength: minLength(2) },
    },
  },
  computed: {
    ...mapGetters("users", ["customers"]),
    allUsers() {
      return this.users.map(({ id }) => id);
    },
    selectedUsers: {
      get() {
        return this.$user?.customers?.map(({ id }) => id) ?? this.customers;
      },
      async set(v) {
        this.isSubmitting = true;
        try {
          await this.axios.patch("/auth/change-manage-accounts", {
            accounts: v,
          });
          await this.$store.dispatch("auth/fetchUser");
        } catch (error) {
          //
        }
        this.isSubmitting = false;
      },
    },
  },
  async mounted() {
    await this.$store.dispatch("users/loadUsers");
  },
};
</script>
