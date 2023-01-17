export const notAllowCharactors = (value) => !(/[<>]/.test(value));
export const shouldContainSpecial = (value) => /[#?!@$%^&*-]/.test(value);

export default {
  computed: {
    isValid () {
      return !this.$v.$invalid;
    },
  },
  methods: {
    validateState (name) {
      if (this.$v.model?.[name]?.$error === undefined) return null;
      const { $dirty, $error } = this.$v.model[name];
      return $dirty ? !$error : null;
    },
    errorMessage (model, label = "This field") {
      if (model?.$error === undefined) return null;
      const { $dirty, $error } = model;
      if (!$dirty) return null;
      if (model.required === false) return `${label} is a required field.`;
      if (model.minLength === false) return `${label} must have ${model.$params.minLength.min} or more characters.`;
      if (model.maxLength === false) return `${label} can have a max of ${model.$params.maxLength.max} characters.`;
      if (model.email === false) return `${label} must be a valid email.`;
      if (model.phoneNumber === false) return `${label} must be a valid phone number`;
      if (model.sameAsPassword === false) return `${label} must be matched.`;
      if (model.notAllowCharactors === false) return `${label} shouldn't contain < or >, as both can cause problems in Web browsers.`;
      if (model.shouldContainSpecial === false) return `${label} should contain one special character.`;
      return $error ? "Unknown Error" : null;
    },
    vuelidateRule (model, label = "This field") {
      return () => this.errorMessage(model, label);
    },
  },
};
