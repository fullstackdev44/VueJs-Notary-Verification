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
        <q-input
          v-model="$v.model.commissionNumber.$model"
          dense
          filled
          type="text"
          label="Notary Commission Number"
          :error-message="errorMessage($v.model.commissionNumber, 'Commission Number')"
          :error="!!errorMessage($v.model.commissionNumber)"
        >
          <template v-slot:prepend>
            <q-icon name="pin" />
          </template>
        </q-input>
        <q-input
          v-model="$v.model.commissionExpiresOn.$model"
          dense
          filled
          type="text"
          label="Commission Expiration Date (yyyy/mm/dd)"
          :error-message="errorMessage($v.model.commissionExpiresOn, 'Commission Expires On')"
          :error="!!errorMessage($v.model.commissionExpiresOn)"
          mask="date"
          :rules="['date']"
          @focus="$refs.qDateProxy.show()"
        >
          <template v-slot:prepend>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy
                ref="qDateProxy"
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-date
                  v-model="$v.model.commissionExpiresOn.$model"
                  @input="$refs.qDateProxy.hide()"
                >
                  <div class="row items-center justify-end">
                    <q-btn
                      ref="closeBtn"
                      v-close-popup
                      label="Close"
                      color="primary"
                      flat
                    />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-select
          v-model="$v.model.state.$model"
          dense
          filled
          :options="states"
          label="State"
          :error-message="
            errorMessage($v.model.state, 'State')
          "
          :error="!!errorMessage($v.model.state)"
        >
          <template v-slot:prepend>
            <q-icon name="map" />
          </template>
        </q-select>
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
        @click="notarySignUp"
      />
    </q-card-actions>
  </div>
</template>
<script>
import moment from "moment";
import {
  required, minLength, email, sameAs
} from "vuelidate/lib/validators";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";
import states from "@/data/states.json";

export const emailFormatter = (value) => {
  if (!value) return value;
  return value.toLowerCase();
};

export default {
  mixins: [VuelidateHelperMixin],
  props: {
    vendorDoc: {
      type: Object,
      default: () => {}
    }
  },
  data () {
    return {
      states,
      model: {
        name: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "notary",
        commissionNumber: "",
        commissionExpiresOn: "",
        state: "",
        hearaboutdata: ""
      },
      isSubmitting: false,
      hearabout: {
        loading: true,
        dataFetched: true,
        data: ["Google search", "Facebook ad", "Facebook group", "Word of Mouth", "Linkedin", "Other"],
        selectedValue: ""
      }
    };
  },
  validations: {
    model: {
      first_name: { required },
      last_name: { required },
      email: { required, email: (val) => email(emailFormatter(val)) },
      password: { required, minLength: minLength(6) },
      confirmPassword: { required, sameAsPassword: sameAs("password") },
      commissionNumber: { required },
      commissionExpiresOn: { required },
      state: { required }
    }
  },
  methods: {
    async notarySignUp () {
      this.model.name = `${this.model.first_name} ${this.model.last_name}`;
      this.model.hearaboutdata = this.hearabout.selectedValue;
      this.isSubmitting = true;
      this.$v.model.$touch();
      this.isSubmitting = false;
      const queryRoute = this.$route.query;
      if (!this.$v.model.$invalid) {
        const signupForm = JSON.parse(JSON.stringify(this.model));
        signupForm.commissionExpiresOn = moment(this.model.commissionExpiresOn, "YYYY/MM/DD", true).unix();
        if (queryRoute.vendorid || this.vendorDoc?._id) {
          signupForm.vendorid = queryRoute.vendorid || this.vendorDoc?._id;
        }
        if (queryRoute.vendortoken || this.vendorDoc?.vendor_ui_token) {
          signupForm.vendortoken = queryRoute.vendortoken || this.vendorDoc?.vendor_ui_token;
        }
        try {
          console.log(signupForm);
          await this.$auth.register({
            data: signupForm,
          });
        } catch (error) {
          //
        }
      }
    }
  }
};
</script>
