<template>
  <q-card class="q-pa-lg">
    <q-card-section class="">
      <h1>
        Forgot your password?
      </h1>
    </q-card-section>
    <q-card-section class="q-pb-none">
      <q-form class="q-gutter-sm" @submit="forgotPasswordAction">
        <q-input
          v-model="$v.model.email.$model"
          dense
          filled
          type="email"
          label="Email"
          :error-message="errorMessage($v.model.email, 'Email')"
          :error="!!errorMessage($v.model.email)"
        >
          <template v-slot:prepend>
            <q-icon name="email" />
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
        @click="forgotPasswordAction"
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
import { required, email } from "vuelidate/lib/validators";
import { reactive } from "@vue/composition-api";
import { $axios } from "boot/axios";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";

export const emailFormatter = (value) => {
  if (!value) return value;
  return value.toLowerCase();
};

export default {
  mixins: [VuelidateHelperMixin],
  setup() {
    const model = reactive({
      email: "",
    });
    return {
      model,
      isSubmitting: false,
    };
  },
  validations: {
    model: {
      email: {
        required,
        email: (val) => email(emailFormatter(val)),
      },
    },
  },
  methods: {
    async forgotPasswordAction() {
      this.isSubmitting = true;
      this.$v.model.$touch();
      if (!this.$v.model.$invalid) {
        try {
          const url = "auth/forgot";
          const response = await $axios.post(url, { email: this.model.email }, {
            headers: {
              "Content-Type": "application/json",
            },
          });
          console.log(response);
          this.$q.notify({
              color: "primary",
              position: "bottom-right",
              message: response.data.msg,
          });
        } catch (error) {
          console.log(error);
        }
      }
      this.isSubmitting = false;
    },
  },
};
</script>
