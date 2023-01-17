<template>
  <div>
    <q-card-section>
      <q-form class="q-gutter-xs">
        <q-input
          v-model="$v.model.first_name.$model"
          dense
          square
          filled
          label="First Name"
          :error-message="errorMessage($v.model.first_name, 'First Name')"
          :error="!!errorMessage($v.model.first_name)"
        >
          <template v-slot:prepend>
            <q-icon name="account_box" />
          </template>
        </q-input>
        <q-input
          v-model="$v.model.last_name.$model"
          dense
          square
          filled
          label="Last Name"
          :error-message="errorMessage($v.model.last_name, 'Last Name')"
          :error="!!errorMessage($v.model.last_name)"
        >
          <template v-slot:prepend>
            <q-icon name="account_box" />
          </template>
        </q-input>
        <q-input
          v-model="$v.model.email.$model"
          dense
          square
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
          :error-message="errorMessage($v.model.confirmPassword, 'Repeat Password')"
          :error="!!errorMessage($v.model.confirmPassword)"
        >
          <template v-slot:prepend>
            <q-icon name="lock" />
          </template>
        </q-input>
        <q-select v-model="hearabout.selectedValue" name="hearaboutdata" dense filled square :options="hearabout.data" label="How did you hear about BlueNotary">
          <template v-slot:prepend>
            <q-icon name="hearing" />
          </template>
        </q-select>
      </q-form>
    </q-card-section>
    <q-card-actions>
      <q-btn
        rounded
        size="md"
        color="blue"
        class="full-width text-white"
        :disable="isSubmitting"
        label="Sign up"
        :loading="isSubmitting"
        @click="customerSignUp"
      />
    </q-card-actions>
  </div>
</template>
<script>
import {
  required, minLength, email, sameAs
} from "vuelidate/lib/validators";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";

export const emailFormatter = (value) => {
  if (!value) return value;
  return value.toLowerCase();
};

export default {
  mixins: [VuelidateHelperMixin],
  props: {
    refferedByNotary: {
      type: String,
      default: ""
    },
    registeredAs: {
      type: String,
      default: ""
    },
    invitedViaSessionLink: {
      type: Boolean,
      default: false
    },
    vendorDoc: {
      type: Object,
      default: () => {}
    }
  },
  data () {
    return {
      model: {
        name: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "customer",
        hearaboutdata: ""
      },
      isSubmitting: false,
      hearabout: {
        loading: true,
        dataFetched: true,
        data: ["Google search", "Facebook ad", "Facebook group", "Word of Mouth", "Linkedin", "Other"],
        selectedValue: ""
      },
    };
  },
  validations: {
    model: {
      first_name: { required },
      last_name: { required },
      email: { required, email: (val) => email(emailFormatter(val)) },
      password: { required, minLength: minLength(6) },
      confirmPassword: { required, sameAsPassword: sameAs("password") },
    }
  },
  methods: {
    async customerSignUp () {
      this.model.name = `${this.model.first_name} ${this.model.last_name}`;
      this.model.hearaboutdata = this.hearabout.selectedValue;
      this.isSubmitting = true;
      this.$v.model.$touch();
      this.isSubmitting = false;
      if (!this.$v.model.$invalid) {
        const signupForm = JSON.parse(JSON.stringify(this.model));
        try {
          console.log(signupForm);
          if (this.refferedByNotary) {
            signupForm.refferedByNotary = this.refferedByNotary;
          }
          if (this.registeredAs) {
            signupForm.registeredAs = this.registeredAs;
          }
          if (this.invitedViaSessionLink) {
            signupForm.invitedViaSessionLink = this.invitedViaSessionLink;
          }
          if (this.vendorDoc?._id) {
            signupForm.vendorid = this.vendorDoc?._id;
          }
          if (this.vendorDoc?.vendor_ui_token) {
            signupForm.vendortoken = this.vendorDoc?.vendor_ui_token;
          }
          await this.$auth.register({
            data: signupForm,
          });
        } catch (error) {
          //
        }
      }
      this.isSubmitting = false;
    }
  }
};
</script>
