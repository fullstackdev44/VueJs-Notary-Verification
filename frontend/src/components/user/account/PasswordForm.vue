<template>
  <q-card square class="q-pa-xs q-ma-none no-shadow">
    <div style="max-width:500px">
      <q-card-section class="">
        <p class="text-weight-bolder text-grey">
          Change your Password
        </p>
      </q-card-section>
      <q-card-section>
        <q-form class="q-gutter-md">
          <q-input
            v-model="$v.model.oldPassword.$model"
            dense
            square
            filled
            clearable
            type="password"
            label="Current Password"
            :error-message="errorMessage($v.model.oldPassword, 'Current Password')"
            :error="!!errorMessage($v.model.oldPassword)"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>
          <q-separator class="q-mt-none" />
          <q-input
            v-model="$v.model.password.$model"
            dense
            square
            filled
            clearable
            type="password"
            label="New Password"
            :error-message="errorMessage($v.model.password, 'Password')"
            :error="!!errorMessage($v.model.password)"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>
          <q-input
            v-model="$v.model.confirmPassword.$model"
            dense
            square
            filled
            clearable
            type="password"
            label="Repeat Password"
            :error-message="errorMessage($v.model.confirmPassword, 'Repeat Password')"
            :error="!!errorMessage($v.model.confirmPassword)"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>
        </q-form>
      </q-card-section>
      <q-card-actions>
        <q-btn
          outline
          rounded
          size="md"
          color="red-4"
          class="full-width text-white"
          type="submit"
          label="Change Password"
          :loading="isSubmitting"
          :disable="$v.model.$invalid || isSubmitting"
          @click="changePassword"
        />
      </q-card-actions>
    </div>
  </q-card>
</template>
<script>
import {
  required, minLength, sameAs,
} from "vuelidate/lib/validators";
import VuelidateHelperMixin, {
  notAllowCharactors,
  shouldContainSpecial,
} from "@/mixins/VuelidateHelperMixin";

export default {
  mixins: [VuelidateHelperMixin],

  data() {
    return {
      model: {
        oldPassword: "",
        password: "",
        confirmPassword: "",
      },
      isSubmitting: false,
    };
  },
  validations: {
    model: {
      oldPassword: { required },
      password: {
        required,
        minLength: minLength(8),
        notAllowCharactors,
        shouldContainSpecial,
      },
      confirmPassword: { required, sameAsPassword: sameAs("password") },
    },
  },
  methods: {
    async changePassword() {
      this.isSubmitting = true;
      try {
        await this.axios.patch("/auth/change-password", this.model);
        this.$q.notify({
          message: "Your password has been changed successfully.",
          type: "info",
          position: "top-right",
          timeout: 2000,
        });
      } catch (error) {
        //
      }
      this.isSubmitting = false;
    },
  },
};
</script>
