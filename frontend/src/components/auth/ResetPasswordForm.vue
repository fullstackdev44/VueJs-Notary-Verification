<template>
  <q-card class="q-pa-lg">
    <q-card-section class="">
      <h1>
        Reset Password
      </h1>
      <p>
        Please enter your new password.
      </p>
    </q-card-section>
    <q-card-section class="q-pb-none">
      <q-form class="q-gutter-sm" @submit="resetPasswordAction">
        <q-input
          v-model="$v.model.password.$model"
          dense
          square
          filled
          type="password"
          label="Password"
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
          type="password"
          label="Repeat Password"
          :error-message="
            errorMessage($v.model.confirmPassword, 'Repeat Password')
          "
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
        rounded
        size="md"
        color="blue"
        class="full-width text-white"
        type="submit"
        label="Reset Password"
        :loading="isSubmitting"
        :disable="isSubmitting"
        @click="resetPasswordAction"
      />
    </q-card-actions>
    <div class="flex q-pa-xs flex-center font-sm q-mt-md">
      <a href="/sign-in">
        <small>Login</small>
      </a>
    </div>
  </q-card>
</template>
<script>
import { required, minLength, sameAs } from "vuelidate/lib/validators";
import { reactive } from "@vue/composition-api";
import { $axios } from "boot/axios";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";

export default {
  mixins: [VuelidateHelperMixin],
  setup() {
    const model = reactive({
      password: "",
      confirmPassword: "",
    });
    return {
      model,
      isSubmitting: false,
      id: false
    };
  },
    async mounted () {
        this.id = (this.$route.params && this.$route.params.id) || false;
    },
  validations: {
    model: {
      password: { required, minLength: minLength(6) },
      confirmPassword: { required, sameAsPassword: sameAs("password") },
    },
  },
  methods: {
    async resetPasswordAction() {
      this.isSubmitting = true;
      this.$v.model.$touch();
      if (!this.$v.model.$invalid) {
        try {
          const url = "auth/reset";
          const response = await $axios.post(url, { id: this.id, password: this.model.password }, {
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (response.data.msg === "PASSWORD CHANGED") {
            this.$q.notify({
                color: "primary",
                position: "bottom-right",
                message: "Your password changed successfully, please login with new password.",
            });
          }
        } catch (error) {
          console.log(error);
        }
      }
      this.isSubmitting = false;
    },
  },
};
</script>
