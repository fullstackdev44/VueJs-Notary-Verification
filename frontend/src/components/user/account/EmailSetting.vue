<template>
  <q-card square class="q-pa-xs q-ma-none no-shadow">
    <div style="max-width:500px">
      <q-card-section>
        <p class="text-weight-bolder text-grey">
          You can change your email.
        </p>
      </q-card-section>

      <q-card-section class="q-py-none">
        <q-form class="q-gutter-md" @submit="changeEmail">
          <q-input
            v-model="$v.model.email.$model"
            dense
            square
            filled
            clearable
            type="email"
            label="Email"
            :error-message="errorMessage($v.model.email, 'Email')"
            :error="!!errorMessage($v.model.email)"
            @clear="onClearEmail"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>
        </q-form>
      </q-card-section>
      <q-card-actions class="q-py-none">
        <q-btn
          outline
          rounded
          size="md"
          color="red-4"
          class="full-width text-white"
          type="submit"
          label="Update Email"
          :loading="isSubmitting"
          :disable="$v.model.$invalid || isSubmitting"
          @click="changeEmail"
        />
      </q-card-actions>
    </div>
  </q-card>
</template>
<script>
import {
  required, email,
} from "vuelidate/lib/validators";
import {
  toRefs, reactive,
} from "@vue/composition-api";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";

export const emailFormatter = (value) => {
  if (!value) return value;
  return value.toLowerCase();
};

export default {
  mixins: [VuelidateHelperMixin],
  props: {
    user: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  setup(props) {
    const { user } = toRefs(props);
    const model = reactive({
      email: user.value?.email,
    });
    const onClearEmail = () => {
      model.email = user.value?.email;
    };
    return {
      model,
      onClearEmail,
    };
  },
  data() {
    return {
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
    async changeEmail() {
      this.isSubmitting = true;
      try {
        await this.axios.patch("/users/change-email", this.model);
        await this.$store.dispatch("auth/fetchUser");
      } catch (error) {
        //
      }
      this.isSubmitting = false;
    },
  },

};
</script>
