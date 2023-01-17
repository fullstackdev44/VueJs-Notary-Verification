<template>
  <q-page>
    <div class="row q-pa-lg rounded">
      <div class="set-mauto cust-set">
        <div class="col-12 q-pb-lg">
          <h1>Account Settings</h1>
        </div>
        <q-card>
          <q-tabs
            v-model="activeTab"
            dense
            class="text-grey"
            active-color="btn-primary"
            indicator-color="btn-primary"
            align="justify"
            narrow-indicator
          >
            <q-tab name="account_details" label="Account" />
            <q-tab v-if="showBillingPayoutsTab" name="billing_payouts" label="Subscription" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="activeTab" animated>
            <q-tab-panel name="account_details">
              <div class="q-pa-lg row">
                <upgrade-customer-account-popup-component :open-acc-pro-model="openUpgradePopup" />
                <div v-if="!($vendorDoc && $vendorDoc.hideUpgradeOptions)" class="col-12">
                  <q-badge v-if="$user.memberType === 'pro'" align="middle" color="green">
                    Pro Plan
                  </q-badge>
                  <q-badge v-else-if="$user.memberType === 'business'" align="middle" color="green">
                    Business Premium Plan
                  </q-badge>
                  <q-badge v-else-if="$user.memberType === 'business_basic'" align="middle" color="green">
                    Business Basic Plan
                  </q-badge>
                  <q-badge v-else-if="$user.memberType === 'business_pro'" align="middle" color="green">
                    Business Pro Plan
                  </q-badge>
                  <q-badge v-else-if="$user.memberType === 'business_hybrid'" align="middle" color="green">
                    Business Hybrid Plan
                  </q-badge>
                  <q-badge v-else-if="$user.memberType === 'title_pro'" align="middle" color="green">
                    Title Premium Plan
                  </q-badge>
                  <q-badge v-else-if="$user.memberType === 'title_hybrid'" align="middle" color="green">
                    Title Hybrid Plan
                  </q-badge>
                  <q-badge v-else-if="$user.memberType === 'signing_service'" align="middle" color="green">
                    Signing Service Plan
                  </q-badge>
                  <q-badge v-else align="middle" color="gray">
                    Basic Plan
                  </q-badge>
                  <q-btn
                    v-if="$user.memberType == 'free'"
                    class="mt-3"
                    style="display:block"
                    label="Upgrade to Pro"
                    color="green"
                    @click="showUpgradePopup()"
                  />
                  <q-btn
                    v-if="$user.memberType == 'pro'"
                    class="mt-3"
                    style="display:block"
                    label="Upgrade to Premium"
                    color="green"
                    @click="showUpgradePopup()"
                  />
                </div>
                <div class="col-12">
                  <div class="row q-py-md">
                    <div class="col-md-4 col-12 q-pr-sm sett-field">
                      <q-input
                        v-model="firstName"
                        outlined
                        hint="First Name"
                        :dense="dense"
                      />
                    </div>
                    <div class="col-md-4 col-12 q-pr-sm sett-field">
                      <q-input
                        v-model="lastName"
                        outlined
                        hint="Last Name"
                        :dense="dense"
                      />
                    </div>
                    <div class="col-md-4 col-12 q-pr-sm sett-field">
                      <q-input
                        v-model="email"
                        outlined
                        hint="Email"
                        :dense="dense"
                      />
                    </div>
                  </div>
                  <div v-if="isAccountDetailUpdated()" class="row">
                    <div class="col-12">
                      <q-btn
                        class="next-btn btn q-pa-sm q-mt-md"
                        label="Update"
                        color="green"
                        :loading="loading"
                        @click="nextButtonClick()"
                      />
                    </div>
                  </div>
                  <hr />
                  <div style="width:100%">
                    <template v-if="!($vendorDoc && $vendorDoc.hideUpgradeOptions) || $user.memberType === 'business_hybrid' || $user.memberType === 'business_pro'">
                      <template v-if="$user.memberType !== 'title_pro'">
                        <q-expansion-item v-if="$user.memberType !== 'business' && $user.memberType !== 'business_pro' && $user.memberType !== 'business_hybrid' && $user.memberType !== 'title_hybrid' && $user.memberType !== 'signing_service'" dense class="ctm-togl shadow-1 modaltrigger" label="Manage Notaries" @click="showUpgradePopup()" />
                        <q-expansion-item v-else dense class="ctm-togl shadow-1" label="Manage Notaries">
                          <div class="row q-px-xl q-my-md">
                            <p class="col-12 q-mb-sm"><strong>Invite notaries</strong></p>
                            <div class="col-6">
                              <q-input v-model="invitedNotaryEmailId" dense filled label="Email address of Notary" type="email" />
                            </div>
                            <div class="col-4">
                              <q-btn
                                class="next-btn btn q-ml-sm"
                                label="Send Invite"
                                icon="send"
                                outline
                                :disable="disableNotaryLinkSubmitButton"
                                @click="mainInviteBusinessNotary()"
                              />
                            </div>
                          </div>
                          <div v-if="customerAllSettings.userNotaryRelations" class="q-px-xl q-py-md q-pb-xl">
                            <p class="col-12 q-mb-sm"><strong>Notaries linked with your account</strong></p>
                            <div v-for="customerNotaryDoc in customerAllSettings.userNotaryRelations" :key="customerNotaryDoc._id" class="row">
                              <div class="col">
                                <div v-if="customerNotaryDoc.notaryDoc">
                                  <small>{{ customerNotaryDoc.notaryDoc.name }}
                                    (<b>{{ customerNotaryDoc.notaryDoc.email }}</b>)</small>
                                  <br />
                                  <div v-if="customerNotaryDoc.notaryDoc.notaryRoleOptions && customerNotaryDoc.notaryDoc.notaryRoleOptions.notaryCanInviteSignerForSession" style="font-size: 12px; margin-left: 12px">
                                    Notary can invite signer for session : {{ customerNotaryDoc.notaryDoc.notaryRoleOptions.notaryCanInviteSignerForSession }}
                                  </div>
                                </div>
                              </div>
                              <div class="col-3">
                                <q-btn flat outline color="primary" style="display: inline-block" icon="edit" @click="editNotaryLink(customerNotaryDoc)">
                                  <q-tooltip>
                                    Edit roles of this notary
                                  </q-tooltip>
                                </q-btn>
                                <q-btn flat outline color="primary" style="display: inline-block" icon="clear" @click="removeNotaryLink(customerNotaryDoc)">
                                  <q-tooltip>
                                    Remove this notary
                                  </q-tooltip>
                                </q-btn>
                              </div>
                            </div>
                          </div>
                        </q-expansion-item>
                      </template>
                      <q-expansion-item v-if="!($user.memberType === 'pro' || $user.memberType === 'business' || $user.memberType === 'business_basic' || $user.memberType === 'business_pro' || $user.memberType === 'business_hybrid' || $user.memberType === 'title_pro' || $user.memberType === 'title_hybrid' || $user.memberType === 'signing_service')" class="ctm-togl shadow-1 modaltrigger" label="Branded Email Settings" @click="showUpgradePopup()" />
                      <q-expansion-item v-else class="ctm-togl shadow-1" label="Branded Email Settings">
                        <div class="q-pa-md">
                          <q-toggle
                            v-model="emailSettingModel"
                            :label="`Enable branded emails`"
                            @input="emailSettingUpdate()"
                          />
                        </div>
                        <div class="q-pa-md">
                          <div class="row">
                            <div class="col-md-8">
                              <p class="q-pb-sm">Define your brand with a logo and custom message to replace the default message to your session invitation email.</p>
                              <small>** Default message: "You've been invited to a notarization session using BlueNotary platform." </small>
                            </div>
                            <div class="col-md-3 offset-1">
                              <img style="cursor:pointer;" src="~assets/example-branded-email.jpg" @click="showEmailSetting()" />
                              <small style="cursor:pointer;" @click="showEmailSetting()">Click to enlarge example</small>
                            </div>
                          </div>
                        </div>
                        <div class="q-pa-md">
                          <q-form ref="passform" class="q-gutter-xs">
                            <div class="row q-py-md">
                              <div class="col-12 ">
                                <img
                                  v-if="emailLogo !== ''"
                                  class="preview q-py-md"
                                  :src="emailLogo"
                                  alt="Seal Image"
                                  width="100px"
                                />
                                <div style="display:flex;align-items: center;width: 100%;margin-bottom: 10px;">
                                  <div>
                                    <div v-if="showchangeimage === true">
                                      <q-btn
                                        class="browse-btn"
                                        label="Change Logo"
                                        color="primary"
                                        @click="showchangeimage = false"
                                      />
                                    </div>
                                    <div v-if="showchangeimage === false"
                                         class="file-drop-zone q-pb-lg"
                                         @drop.prevent
                                         @dragover.prevent
                                         @dragenter.prevent
                                         @dragleave.prevent
                                    >
                                      <div class="">
                                        <div id="article" class="">
                                          <p class="q-mt-sm">Drop file or upload here.</p>
                                          <div v-if="uploadingS">
                                            <q-spinner
                                              color="primary"
                                              size="3em" />
                                            <p class="no-margin q-pt-md text-faded">
                                              Uploading image, please wait...
                                            </p>
                                          </div>
                                          <div v-if="!uploadingS">
                                            <q-btn
                                              class="browse-btn"
                                              label="Upload Logo"
                                              color="primary"
                                              @click="$refs.emailLogo.$el.click()"
                                            />
                                            <q-file
                                              v-show="false"
                                              ref="emailLogo"
                                              v-model="notaryEmailLogo"
                                              max-file-size="500000"
                                              standout
                                              color="primary"
                                              label="Add a document"
                                              accept=".jpg, .jpeg, .png"
                                              @rejected="onRejected"
                                            />
                                          </div>
                                          <div class="flex row q-pa-sm">
                                            <small>Only .png, .jpg, .jpeg accepted.</small>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <div v-if="emailLogo == ''">
                                      <img style="cursor:pointer;height: 100px;margin-left: 15px;" src="https://bluenotary.us/assets/img/logo-a4-b.png" />
                                    </div>
                                  </div>
                                </div>
                                <div class=" col-12 q-pr-sm">
                                  <q-input
                                    v-model="customMessage"
                                    outlined
                                    type="textarea"
                                    hint="Custom Invitation Message"
                                    :dense="dense"
                                    placeholder="You've been invited to a notarization session using BlueNotary platform."
                                  />
                                </div>
                              </div>
                              <div class="col-12">
                                <q-btn
                                  v-if="customMessage !== oldcustomMessage "
                                  class="next-btn btn q-pa-sm"
                                  label="Update"
                                  color="green"
                                  :loading="loading"
                                  @click="updateCustomMessage()"
                                />
                              </div>
                            </div>
                          </q-form>
                        </div>
                      </q-expansion-item>
                    </template>
                    <q-expansion-item class="ctm-togl shadow-1" dense label="Change Password">
                      <q-form ref="passform" class="q-pa-md">
                        <div class="row q-py-md">
                          <div class="col-md-4 col-xs-12 q-pr-sm">
                            <q-input
                              v-model="$v.model.oldpassword.$model"
                              outlined
                              type="password"
                              hint="Old Password"
                              :dense="dense"
                              :error-message="errorMessage($v.model.oldpassword, 'Old Password')"
                              :error="!!errorMessage($v.model.oldpassword)"
                            />
                          </div>
                          <div class="col-md-4 col-xs-12 q-pr-sm">
                            <q-input
                              v-model="$v.model.password.$model"
                              outlined
                              type="password"
                              hint="New Password"
                              :dense="dense"
                              :error-message="errorMessage($v.model.password, 'New Password')"
                              :error="!!errorMessage($v.model.password)"
                            />
                          </div>
                          <div class="col-md-4 col-xs-12 q-pr-sm">
                            <q-input
                              v-model="$v.model.confirmPassword.$model"
                              outlined
                              type="password"
                              hint="Repeat New Password"
                              :dense="dense"
                              :error-message="errorMessage($v.model.confirmPassword, 'Repeat Password')"
                              :error="!!errorMessage($v.model.confirmPassword)"
                            />
                          </div>
                        </div>
                      </q-form>
                      <div class="row q-pa-md">
                        <div class="col-12">
                          <q-btn
                            class="next-btn btn q-pa-sm q-mt-md"
                            label="Update"
                            color="green"
                            :loading="loading"
                            @click="updatePassword()"
                          />
                        </div>
                      </div>
                    </q-expansion-item>
                  </div>
                </div>
              </div>
            </q-tab-panel>
            <q-tab-panel name="billing_payouts">
              <div class="q-ma-lg row">
                <div class="col-12 q-mb-sm">
                  <p>
                    <small style="font-size:.7rem">Partnering with</small>
                    <q-img
                      style="width:50px;"
                      src="~assets/stripe-logo.png"
                    />
                  </p>
                </div>
                <div class="col-md-5 offset-1">
                  <h2>Manage Subscription</h2>
                  <p class="q-py-md"><small>Update billing or change/cancel your plan.</small></p>
                  <q-btn color="primary" :loading="stripePCustomerBillingButtonLoading" class="q-mt-sm" label="Manage Subscription" @click="manageStripeBillingPortal" />
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </div>
    </div>
    <q-dialog ref="dialog" v-model="showPopupWithImage">
      <q-card class="q-ma-lg">
        <q-card-section class="row items-center q-pb-none">
          <q-btn v-close-popup icon="close" flat round dense />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="q-pa-md">
            <img src="~assets/example-branded-email.jpg" style="width:auto" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="showAddManageNotaryRoleSelection" persistent>
      <q-card class="q-ma-lg">
        <q-card-section>
          <div class="text-h6">Permissions for Invited Notary</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div v-if="editNotaryRoleUserDoc && editNotaryRoleUserDoc.notaryDoc && editNotaryRoleUserDoc.notaryDoc.email" class="" style="padding-top: 12px">
            <b>Notary Email</b> : <span>{{ editNotaryRoleUserDoc.notaryDoc.email }}</span>
          </div>
          <div class="" style="padding-top: 12px">
            <h3 class="no-margin">Notary can Invite Signer for Session</h3>
            <div class="row doc-list-preview">
              <div class="">
                <q-radio v-model="notaryRoleOptions.notaryCanInviteSignerForSession" val="yes" label="Yes" />
                <q-radio v-model="notaryRoleOptions.notaryCanInviteSignerForSession" val="no" label="No" />
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn outline label="Send Invite" color="primary" :loading="loading" @click="inviteBusinessNotary" />
          <q-btn v-close-popup outline label="Cancel" color="danger" @click="inviteBusinessNotaryCancelClicked" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import {
  required, minLength, sameAs,
} from "vuelidate/lib/validators";
import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";
import UpgradeCustomerAccountPopupComponent from "./upgradeCustomerAccount.vue";

export default {
    name: "CustomerAccountSettings",
    components: { UpgradeCustomerAccountPopupComponent },
    mixins: [VuelidateHelperMixin],
    data () {
      return {
        openUpgradePopup: false,
        accountDataLoaded: false,
        model: {
          oldpassword: "",
          password: "",
          confirmPassword: ""
        },
        invitedNotaryEmailId: "",
        customerAllSettings: {},
        disableNotaryLinkSubmitButton: false,
        emailSettingModel: false,
        showPopupWithImage: false,
        customMessage: "",
        oldcustomMessage: "",
        emailLogo: "",
        showchangeimage: true,
        uploadingS: false,
        notaryEmailLogo: "",
        showAddManageNotaryRoleSelection: false,
        notaryRoleOptions: {
          notaryCanInviteSignerForSession: "no"
        },
        defaultNotaryRoleOptions: {
          notaryCanInviteSignerForSession: "no"
        },
        editNotaryRoleUserDoc: false,
        activeTab: "account_details",
        stripePCustomerBillingButtonLoading: false,
      };
    },
    computed: {
      showBillingPayoutsTab() {
        let showTab = true;
        if (this.$vendorDoc?.enableManageSubscriptionSettings) {
          showTab = true;
        } else if (this.$user.memberTypeProWhenInvited) {
          showTab = false;
        }
        if (this.$user.memberType === "free") {
          showTab = false;
        }
        return showTab;
      },
    },
    watch: {
      notaryEmailLogo: {
        handler(value) {
          this.uploadNotaryEmailLogo(value);
        }
      }
    },
    validations: {
      model: {
        oldpassword: { required },
        password: { required, minLength: minLength(6) },
        confirmPassword: { required, sameAsPassword: sameAs("password") }
      }
    },
    setup () {
      const firstName = ref("");
      const lastName = ref("");
      const email = ref("");
      const dense = ref(false);
      const loading = ref(false);
      const saveDetail = async (data) => {
        try {
          const url = "auth/user-update";
          const response = await $axios.post(url, data, {
            headers: {
              "Content-Type": "application/json",
            },
          });
          return response.data;
        } catch (error) {
          return error;
        }
      };
      return {
        firstName,
        lastName,
        email,
        dense,
        loading,
        saveDetail
      };
    },
    async mounted () {
      this.accountDataLoaded = true;
      this.email = this.$user.email;
      this.firstName = (this.$user.first_name) ? this.$user.first_name : this.$user.name.split(" ")[0];
      this.lastName = (this.$user.last_name) ? this.$user.last_name : this.$user.name.split(" ")[1];
      this.oldData = {
          first_name: this.firstName,
          last_name: this.lastName,
          name: `${this.firstName} ${this.lastName}`,
          email: this.email,
      };
      this.customMessage = this.$user.emailCustomMessage;
      this.oldcustomMessage = this.$user.emailCustomMessage;
      this.emailLogo = (this.$user.emailLogoUrl) || "";
      this.emailSettingModel = (this.$user.sendBrandEmails) || false;
      this.customerGetAllSettings();
    },
    methods: {
      showUpgradePopup() {
        this.openUpgradePopup = false;
        setTimeout(() => {
          this.openUpgradePopup = true;
        }, 200);
      },
      isAccountDetailUpdated () {
        if (this.accountDataLoaded === false) {
          return false;
        }
        if (this.accountDataLoaded === false || this.firstName !== this.oldData.first_name || this.lastName !== this.oldData.last_name || this.email !== this.oldData.email) {
          return true;
        }
        return false;
      },
      async nextButtonClick () {
        if (!this.firstName) {
          return this.$q.notify({
            color: "secondary",
            position: "bottom-right",
            message: "Please enter first name.",
          });
        }
        if (!this.lastName) {
          return this.$q.notify({
            color: "secondary",
            position: "bottom-right",
            message: "Please enter last name.",
          });
        }
        if (!this.email) {
          return this.$q.notify({
            color: "secondary",
            position: "bottom-right",
            message: "Please enter email.",
          });
        }

        const data = {
          first_name: this.firstName,
          last_name: this.lastName,
          name: `${this.firstName} ${this.lastName}`,
          email: this.email,
        };
        this.loading = true;
        await this.saveDetail(data);
        await this.$store.dispatch("auth/fetchUser");
        this.loading = false;
        return true;
      },
      async updatePassword () {
        this.$v.model.$touch();
        if (!this.$v.model.$invalid) {
          try {
            this.loading = true;
            console.log(this.model);
            await this.axios.post("auth/update-password", this.$v.model.$model);
            this.loading = false;
            this.model = {
              oldpassword: "",
              password: "",
              confirmPassword: ""
            };
            this.$v.model.$reset();
          } catch (error) {
            this.loading = false;
          }
        }
      },
      async customerGetAllSettings() {
        const url = "/customer/customerGetAllSettings";
        const response = await $axios.get(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log(response);
        this.customerAllSettings = (response && response.data) || {};
        let planWiseMaxNotaryLimit = 3;
        if (this?.$user?.memberType === "business_pro") {
          planWiseMaxNotaryLimit = 1;
        }
        const maxInvitedNotariesAllowed = this?.$user?.maxInvitedNotariesAllowed || planWiseMaxNotaryLimit;
        if (this.customerAllSettings && this.customerAllSettings.userNotaryRelations && this.customerAllSettings.userNotaryRelations.length >= maxInvitedNotariesAllowed) {
          this.disableNotaryLinkSubmitButton = true;
        } else {
          this.disableNotaryLinkSubmitButton = false;
        }
      },
      mainInviteBusinessNotary() {
        this.editNotaryRoleUserDoc = false;
        this.notaryRoleOptions = JSON.parse(JSON.stringify(this.defaultNotaryRoleOptions));
        this.showAddManageNotaryRoleSelection = true;
      },
      async inviteBusinessNotary () {
        try {
          this.loading = true;
          console.log(this.model);
          let urlToUse = "customer/inviteBusinessNotary";
          if (this.editNotaryRoleUserDoc) {
            urlToUse = "customer/updateBusinessNotary";
          }
          const response = await this.axios.post(urlToUse, {
            notaryEmail: this.invitedNotaryEmailId || this.editNotaryRoleUserDoc?.notaryDoc?.email,
            notaryRoleOptions: JSON.stringify(this.notaryRoleOptions)
          });
          console.log(response);
          if (this.editNotaryRoleUserDoc) {
            this.$q.notify({
              color: "secondary",
              position: "bottom-right",
              message: "Notary roles have been updated.",
            });
          } else {
            this.$q.notify({
              color: "secondary",
              position: "bottom-right",
              message: "Notary has been invited via email.",
            });
          }
          this.showAddManageNotaryRoleSelection = false;
          this.customerGetAllSettings();
          this.invitedNotaryEmailId = "";
          this.loading = false;
        } catch (error) {
          this.loading = false;
        }
      },
      async inviteBusinessNotaryCancelClicked() {
        this.customerGetAllSettings();
      },
      async editNotaryLink(customerNotaryDoc) {
        this.editNotaryRoleUserDoc = customerNotaryDoc;
        if (customerNotaryDoc && customerNotaryDoc.notaryDoc && customerNotaryDoc.notaryDoc.notaryRoleOptions) {
          this.notaryRoleOptions = customerNotaryDoc.notaryDoc.notaryRoleOptions;
        } else {
          this.notaryRoleOptions = JSON.parse(JSON.stringify(this.defaultNotaryRoleOptions));
        }
        this.showAddManageNotaryRoleSelection = true;
      },
      async removeNotaryLink(customerNotaryDoc) {
        this.$q.dialog({
          title: "Confirm",
          message: "Are you sure you want to unlink this Notary from your Account?",
          cancel: true,
          persistent: true
        }).onOk(async () => {
          try {
            this.loading = true;
            console.log(this.model);
            const response = await this.axios.post("customer/removeCustomerNotaryLink", {
              customerNotaryLinkId: customerNotaryDoc._id
            });
            console.log(response);
            this.$q.notify({
              color: "secondary",
              position: "bottom-right",
              message: "Notary has been unlinked from your account.",
            });
            this.customerGetAllSettings();
            this.loading = false;
          } catch (error) {
            this.loading = false;
          }
        });
      },
      async saveNotaryEmailLogo(data) {
        try {
          const url = "file/notaryEmailLogoUpload";
          const formData = new FormData();
          formData.append("file", data);
          const response = await $axios.post(url, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          return response.data;
        } catch (error) {
          return error;
        }
      },
      async uploadNotaryEmailLogo (val) {
        this.uploadingS = true;
        if (val) {
          const data = await this.saveNotaryEmailLogo(val);
          console.log(data);
          if (data.user && data.user.emailLogoUrl) {
            this.emailLogo = data.user.emailLogoUrl;
            this.showchangeimage = false;
          }
        }
        this.uploadingS = false;
      },
      showEmailSetting() {
        this.showPopupWithImage = false;
        setTimeout(() => {
          this.showPopupWithImage = true;
        }, 200);
      },
      onRejected () {
      this.$q.notify({
          type: "negative",
          message: "Selected image size is exceeding the maximum file size of 500kb."
        });
      },
      async emailSettingUpdate() {
        try {
          this.loading = true;
          await $axios.post("notary/update-email-setting", { sendBrandEmails: this.emailSettingModel }, {
            headers: {
              "Content-Type": "application/json",
            },
          });
          this.loading = false;
        } catch (error) {
          this.loading = false;
        }
      },
      async updateCustomMessage () {
        if (this.customMessage) {
          try {
            this.loading = true;
            await $axios.post("notary/update-email-custom-message", { customMessage: this.customMessage }, {
              headers: {
                "Content-Type": "application/json",
              },
            });
            this.loading = false;
          } catch (error) {
            this.loading = false;
          }
        }
      },
      async manageStripeBillingPortal() {
        try {
          this.stripePCustomerBillingButtonLoading = true;
          const url = "notary/create-customer-portal-session";
          const response = await $axios.post(url, { }, {
            headers: {
              "Content-Type": "application/json",
            },
          });
          console.log(response);
          window.open(response?.data?.redirect_url).focus();
          this.stripePCustomerBillingButtonLoading = false;
        } catch (err) {
          this.stripePCustomerBillingButtonLoading = false;
        }
      },
    }
};
</script>

<style></style>
