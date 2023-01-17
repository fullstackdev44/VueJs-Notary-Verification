<template>
  <q-page
    class=""
    style="
      background: url('https://bluenotary.us/assets/img/leaves.png');
      background-size: 100%;
    "
  >
    <div class="row q-pa-lg rounded">
      <div class="set-mauto">
        <div class="col-12 q-pb-lg">
          <h1>Account Settings</h1>
          <template v-if="onboardingLocal === false">
            <div class="bn-note bn-note--warning" style="max-width: 720px;">
              <p class="q-mb-md">
                {{ $user.name }}, thank you for choosing to work with BlueNotary.<br />
                We just need the following items to verify and approve your account.<br />
              </p>
              <ul>
                <li><q-icon :name="state ? 'check' : 'assignment_late'" :color="state ? 'green' : 'gray'" /> State</li>
                <li><q-icon :name="commissionNumber ? 'check' : 'assignment_late'" :color="commissionNumber ? 'green' : 'gray'" /> Notary Commission Number</li>
                <li><q-icon :name="commistionExpiration ? 'check' : 'assignment_late'" :color="commistionExpiration ? 'green' : 'gray'" /> Commission Expiration Date</li>
                <li><q-icon :name="accountSettings !== null && accountSettings.notaryCopyOfCommissionLetterName ? 'check' : 'assignment_late'" :color="accountSettings !== null && accountSettings.notaryCopyOfCommissionLetterName ? 'green' : 'gray'" /> RON Approval Document <small>(Go to Certificates/Files tab)</small></li>
                <li v-if="showBillingPayoutsTab"><q-icon :name="!stripeErrorsFound ? 'check' : 'assignment_late'" :color="!stripeErrorsFound ? 'green' : 'gray'" /> Add payout details <small>(Go to Billing/Payouts tab)</small></li>
              </ul>
            </div>
          </template>
          <template v-if="onboardingLocal === true && $user.approve === 'inactive'">
            <div class="bn-note bn-note--success" style="max-width: 720px;">
              <p class="q-mb-md">
                <strong>All requirements are satisfied.</strong><br /> We are now reviewing your application. We'll notify you by email when we have finished the review process.
              </p>
            </div>
          </template>
          <div v-if="errorDetails.errorMessage" class="bn-note bn-note--warning" style="max-width: 720px;">
            <p>{{ errorDetails.errorMessage }}</p>
            <ul v-if="errorDetails.errorsList" style="padding-top: 10px; font-size: 13px">
              <li v-for="errorMsg in errorDetails.errorsList" :key="errorMsg">
                {{ errorMsg }}
              </li>
            </ul>
          </div>
        </div>
        <q-card style="max-width: 720px">
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
            <q-tab name="uploads" label="Certificates & Files" />
            <q-tab name="audio_video" label="Audio/Video Check" />
            <q-tab v-if="showBillingPayoutsTab" name="billing_payouts" label="Billing/Payouts" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="activeTab" animated>
            <q-tab-panel name="account_details">
              <div class="q-mt-sm q-ma-lg row">
                <div class="col-12">
                  <div class="row q-py-md">
                    <div class="col-12 q-pr-sm flex ">
                      <q-badge v-if="$user.memberType === 'pro'" align="middle" color="green">
                        Pro Hybrid Plan
                      </q-badge>
                      <q-badge v-else align="middle" color="gray">
                        Free Plan
                      </q-badge>
                      <template>
                        <q-btn
                          v-if="$user.memberType == 'free'"
                          class="ml-3"
                          label="Upgrade to Pro"
                          color="green"
                          @click="showUpgradePopup()"
                        />
                      </template>
                      <!-- <q-btn color="primary" icon="link" outline label="My Personal Link" style="margin-left: auto" @click="getCustomerLink">
                        <q-tooltip>
                          Send your personal link to clients and be automatically linked to their sessions
                        </q-tooltip>
                      </q-btn> -->
                      <q-btn color="primary" icon="link" outline label="My Session Link" style="margin-left: auto" @click="getSessionLink">
                        <q-tooltip>
                          Send your session link to clients and be automatically linked to the session
                        </q-tooltip>
                      </q-btn>
                    </div>
                  </div>
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
                  <div class="row is-multiline">
                    <div class="col-md-4 col-12 q-pr-sm sett-field">
                      <q-select
                        v-model="state"
                        outlined
                        :options="states"
                        hint="State"
                        :dense="dense"
                      />
                    </div>
                    <div v-if="currentStateCounties" class="col-md-4 col-12 q-pr-sm sett-field">
                      <q-select
                        v-model="county"
                        outlined
                        :options="currentStateCounties"
                        hint="County"
                        :dense="dense"
                      />
                    </div>
                    <div class="col-md-4 col-12 q-pr-sm sett-field">
                      <q-input
                        v-model="commissionNumber"
                        outlined
                        hint="Notary Commission Number"
                        :dense="dense"
                      />
                    </div>
                    <div class="col-md-4 col-12">
                      <q-input
                        v-model="commistionExpiration"
                        outlined
                        hint="Commission Expires On"
                        mask="date"
                        placeholder="year/mth/day"
                      >
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy
                              ref="qDateProxy"
                              cover
                              transition-show="scale"
                              transition-hide="scale"
                            >
                              <q-date
                                v-model="commistionExpiration"
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
                    </div>
                    <div class="col-md-8 col-12 q-pr-sm sett-field" style="padding-top: 12px;">
                      <q-checkbox
                        v-model="spanishLanguageFluency"
                        size="md"
                        style="font-size: 1rem"
                        label="Spanish Language Fluency"
                      />
                    </div>
                  </div>
                  <div v-if="isAccountDetailUpdated()" class="row">
                    <div class="col-12">
                      <!-- UPDATE btn -->
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
                  <div v-if="!$user.memberTypeProWhenInvited" class="full-width">
                    <q-expansion-item class="ctm-togl shadow-1 q-mb-sm" label="BlueNotary Profile" caption="Show your profile on BlueNotary Website">
                      <div class="q-pa-md">
                        <q-toggle
                          v-model="disableProfile"
                          :label="`Disable BlueNotary Profile`"
                        />
                        <q-btn v-if="blueNotaryProfileUrl" color="primary" icon="open_in_new" outline label="Open Profile" style="margin-left: auto; float: right" @click="openProfileClicked" />
                      </div>
                      <div v-if="!disableProfile" class="columns is-multiline" style="margin: 12px">
                        <div class="column is-4">Avatar</div>
                        <div class="column is-8">
                          <template v-if="profileAvatarFileLink">
                            <img
                              class="preview"
                              :src="profileAvatarFileLink"
                              alt="Profile Image"
                              width="100px"
                              style="display: inline-block"
                            />
                            <q-btn icon="delete_forever" flat label="" style="display: inline-block; vertical-align: top;" @click="deleteProfileImage()">
                              <q-tooltip>
                                Click to delete profile
                              </q-tooltip>
                            </q-btn>
                          </template>
                          <q-file v-model="profileAvatarFile" outlined dense label="Upload .png or .jpg file" accept=".jpg,.jpeg,.png" />
                        </div>
                        <div class="column is-4">Headline</div>
                        <div class="column is-8"><q-input v-model="profileInputs.headline" outlined dense label="Headline to be displayed on top of your Profile" /></div>
                        <div class="column is-4">Bio</div>
                        <div class="column is-8"><q-input v-model="profileInputs.bio" type="textarea" outlined dense label="Bio to be displayed in Profile" /></div>
                        <div class="column is-4">Languages spoken</div>
                        <div class="column is-8"><q-input v-model="profileInputs.languages" outlined dense label="Languages Spoken to be displayed in Profile" /></div>
                        <div class="column is-4">Years of Experience</div>
                        <div class="column is-8"><q-input v-model="profileInputs.years_exp" outlined dense label="Years of RON Experience to be displayed in Profile" /></div>
                        <div class="column is-4">Total RONs Completed</div>
                        <div class="column is-8"><q-input v-model="profileInputs.total_rons_completed" outlined dense label="Total RONs Completed to be displayed in Profile" /></div>
                        <div class="column is-4">Credentials</div>
                        <div class="column is-8"><q-input v-model="profileInputs.credentials" type="textarea" outlined dense label="Credentials to be displayed in Profile" /></div>
                        <div class="column is-4">Website</div>
                        <div class="column is-8"><q-input v-model="profileInputs.wesbite" outlined dense label="Website to be displayed in Profile" /></div>
                        <div class="column is-4">City</div>
                        <div class="column is-8"><q-input v-model="profileInputs.location" outlined dense label="City to be displayed in Profile" /></div>
                        <div class="column is-12">Social URLs</div>
                        <div class="column is-1" />
                        <div class="column is-2">Facebook</div>
                        <div class="column is-9"><q-input v-model="profileInputs.facebook" outlined dense label="Facebook Url to be displayed in Profile" /></div>
                        <div class="column is-1" />
                        <div class="column is-2">Twitter</div>
                        <div class="column is-9"><q-input v-model="profileInputs.twitter" outlined dense label="Twitter Url to be displayed in Profile" /></div>
                        <div class="column is-1" />
                        <div class="column is-2">Instagram</div>
                        <div class="column is-9"><q-input v-model="profileInputs.instagram" outlined dense label="Instagram Url to be displayed in Profile" /></div>
                        <div class="column is-1" />
                        <div class="column is-2">Youtube</div>
                        <div class="column is-9"><q-input v-model="profileInputs.youtube" outlined dense label="Youtube Url to be displayed in Profile" /></div>
                        <div class="column is-4">E&O Insurance Coverage</div>
                        <div class="column is-8"><q-input v-model="profileInputs.eo_coverage" outlined dense label="E&O Insurance Coverage to be displayed in Profile" /></div>
                        <div class="column is-4">E&O Insurance Expiration</div>
                        <div class="column is-8">
                          <q-input
                            v-model="profileInputs.eo_expiration"
                            outlined
                            dense
                            mask="date"
                            placeholder="year/mth/day"
                            style="width: 200px"
                          >
                            <template v-slot:append>
                              <q-icon name="event" class="cursor-pointer">
                                <q-popup-proxy
                                  ref="qDateProxy"
                                  cover
                                  transition-show="scale"
                                  transition-hide="scale"
                                >
                                  <q-date
                                    v-model="profileInputs.eo_expiration"
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
                        </div>
                      </div>
                      <div class="q-pa-md">
                        <q-btn
                          label="Save Profile"
                          color="primary"
                          :loading="saveProfileLoading"
                          @click="saveProfileClicked"
                        />
                      </div>
                    </q-expansion-item>
                  </div>
                  <div v-if="!$user.memberTypeProWhenInvited" class="full-width">
                    <q-expansion-item v-if="$user.memberType !== 'pro'" caption="☆ Pro Feature" class="ctm-togl shadow-1 modaltrigger q-mb-sm" label="Branded Email Settings" />
                    <q-expansion-item v-if="$user.memberType === 'pro'" caption="☆ Pro Feature" class="ctm-togl shadow-1 q-mb-sm" label="Branded Email Settings">
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
                            <div class="col-12">
                              <img
                                v-if="emailLogo"
                                class="preview q-py-md"
                                :src="emailLogo"
                                alt="Seal Image"
                                width="100px"
                              />
                              <div style="display:flex;align-items: center;width: 100%;">
                                <div>
                                  <div v-if="showchangeimage === true">
                                    <q-btn
                                      class="browse-btn q-mx-md"
                                      label="Change Logo"
                                      color="primary"
                                      @click="showchangeimage = false"
                                    />
                                  </div>
                                  <div
                                    v-if="showchangeimage === false"
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
                                            color="green"
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
                                            v-model="uploadNotaryEmailLogo"
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
                                  <div>
                                    <img v-if="!emailLogo" style="cursor:pointer;height: 100px;margin-left: 15px;" src="https://bluenotary.us/assets/img/logo-a4-b.png" />
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
                                class="next-btn btn q-pa-sm q-ma-md"
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
                  </div>
                  <!-- <div v-if="!$user.memberTypeProWhenInvited" class="full-width q-mt-sm">
                    <q-expansion-item v-if="$user.memberType !== 'pro'" caption="☆ Pro Feature" class="ctm-togl shadow-1 modaltrigger q-mb-sm" label="Add Custom Fees" />
                    <q-expansion-item v-else class="ctm-togl shadow-1" label="Add Custom Fees" caption="☆ Pro Feature">
                      <div class="q-pa-lg">
                        <small>
                          <p>You can add custom fees top of regular BlueNotary fees for any extra fee you require for services rendered.</p>
                          <p> You'll also see a button in live session to add custom fees.</p>
                        </small>
                      </div>
                      <div v-for="sessionType in allSessionTypes" :key="sessionType.value" style="padding:16px">
                        <h3><strong>{{ sessionType.label }}</strong></h3>
                        <div v-for="customChargeDoc in multiSessionCustomCharges[sessionType.value]" :key="customChargeDoc.id" class="row" style="margin-top: 8px;">
                          <div class="col-4">
                            <q-input v-model="customChargeDoc.particular" dense filled label="Custom Fee Name" type="string" class="q-pr-sm" />
                          </div>
                          <div class="col-3">
                            <q-input v-model="customChargeDoc.amount" dense filled label="Custom Fee Value (USD)" type="number" />
                          </div>
                          <div class="col-2">
                            <q-btn flat outline color="primary" icon="clear" style="font-size: 17px" @click="removeChargesButton(sessionType, customChargeDoc.id)" />
                          </div>
                        </div>
                        <q-btn icon="add" outline class="q-mt-sm" round @click="addMoreChargesButton(sessionType)" />
                      </div>
                      <div class="row q-pa-md">
                        <div class="col-12">
                          <q-btn
                            class="next-btn btn q-pa-sm q-mt-md"
                            label="Update"
                            color="green"
                            :loading="loading"
                            @click="updateCharges()"
                          />
                        </div>
                      </div>
                    </q-expansion-item>
                  </div> -->
                  <div v-if="!$user.memberTypeProWhenInvited || ($vendorDoc && $vendorDoc.allowLSAApplication)" class="full-width q-mt-sm">
                    <q-expansion-item v-if="$user.memberType !== 'pro'" caption="☆ Pro Feature" class="ctm-togl shadow-1 modaltrigger q-mb-sm" label="Apply for LSA (Loan Signing Agent)" />
                    <q-expansion-item v-if="$user.memberType === 'pro'" caption="☆ Pro Feature" class="ctm-togl shadow-1 q-mb-sm" label="Apply for LSA (Loan Signing Agent)" @click="showLSAApprovalModal()" />
                  </div>
                  <div class="full-width q-mt-sm">
                    <q-expansion-item class="ctm-togl shadow-1" label="Change Password">
                      <q-form ref="passform" class="q-pa-md">
                        <div class="row q-py-md">
                          <div v-if="!$user.allowInitialPasswordChange" class="col-md-4 col-4 q-pr-sm">
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
                          <div class="col-md-4 col-4 q-pr-sm">
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
                          <div class="col-md-4 col-4 q-pr-sm">
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
                          <!-- UPDATE btn -->
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
            <q-tab-panel name="uploads" style="max-width:1000px" class="q-ma-md">
              <div class="row q-mt-lg">
                <div class="col-sm-6 col-md-4">
                  <div class="row q-ml-md">
                    <div class="col-12">
                      <h2>eSeal</h2>
                    </div>
                    <div class="q-pb-sm q-pt-sm row">
                      <div class="col-1">
                        <span class="material-icons blue">info</span>
                      </div>
                      <div class="col-10">
                        <small style="font-size:0.7rem">
                          <span>BlueNotary generates a free eSeal automatically. You can also upload your own here or purchase the eSeal we've generated for you here to use outside of BN.</span>
                        </small>
                      </div>
                    </div>
                    <div
                      class="file-drop-zone q-pb-lg"
                      @drop.prevent
                      @dragover.prevent
                      @dragenter.prevent
                      @dragleave.prevent
                    >
                      <div class="">
                        <div id="article" class="">
                          <!-- <p class="q-mt-sm">Drop file or upload here.</p> -->
                          <div v-if="uploadingS">
                            <q-spinner
                              color="primary"
                              size="3em" />
                            <p class="no-margin q-pt-md text-faded">
                              Uploading document, please wait...
                            </p>
                          </div>
                          <div v-if="!uploadingS">
                            <q-btn
                              class="browse-btn full-width"
                              label="Upload Your Own eSeal"
                              outline
                              @click="$refs.sealFileInput.$el.click()"
                            />
                            <q-file
                              v-show="false"
                              ref="sealFileInput"
                              v-model="sealFile"
                              standout
                              outline
                              label="Add a document"
                              accept=".jpg, .jpeg, .png"
                            />
                          </div>
                          <div class="flex row q-pa-sm">
                            <small>Only .png, .jpg, .jpeg accepted.</small>
                          </div>
                          <div v-if="sealFileSizeIsValid === false" class="flex row q-pa-sm red-error" style="margin-top: 0;">
                            <small>File size should less than 100 KB.</small> <p>(You can use the <a href="https://imagecompressor.11zon.com/en/image-compressor/compress-jpeg-to-100kb.php" target="_blank">following link</a> to compress the image)</p>
                          </div>
                          <q-btn
                            v-if="enableBuySealButton"
                            :loading="buySealLoading"
                            class="flex row full-width"
                            color="green"
                            outline
                            label="Buy/Download eSeal"
                            @click="buyNotarySeal()"
                          />
                          <div class="text-center row q-pa-sm">
                            <small>Only $10 to download this eSeal for professional use.</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-5 col-md-7 offset-md-1 offset-sm-1 q-pr-lg seal-preview">
                  <!-- <div class="col-12 row"> -->
                  <img
                    v-if="accountSettings !== null && accountSettings.sealdata && !sealUploaded"
                    class="preview seal-preview"
                    :src="accountSettings.sealdata"
                    alt="Seal Image"
                    style="pointer-events: none;"
                  />
                  <img
                    v-if="sealImage && sealUploaded"
                    class="preview seal-preview"
                    :src="sealImage"
                    alt="Seal Image"
                    style="pointer-events: none;"
                  />
                  <q-card v-if="accountSettings.buySealActionDate" style="margin-top: 20px; background: #e0ffea; width: 95%">
                    <q-card-section>
                      <b>Purchased eSeal</b>
                      <br />
                      <b>Purchased At: </b>{{ moment(accountSettings.buySealActionDate).format('MMMM Do YYYY') }}
                      <br />
                      <a :href="accountSettings.sealdata">Notary eSeal Download Link</a>
                      <template v-if="accountSettings.buyPngSealdata">
                        <br />
                        <a :href="accountSettings.buyPngSealdata">Notary eSeal w/ <b>Transparent background</b> Download Link</a>
                      </template>
                    </q-card-section>
                  </q-card>
                  <q-card v-else-if="accountSettings.buyComboPurchaseExpiryDate" style="margin-top: 20px; background: #e0ffea; width: 95%">
                    <q-card-section>
                      <b>Purchased eSeal <template v-if="accountSettings.buyComboPurchaseExpiryDate">Combo</template></b>
                      <br />
                      <b>Purchased At: </b>{{ moment(accountSettings.buyComboPurchaseExpiryDate).format('MMMM Do YYYY') }}
                      <br />
                      <a :href="accountSettings.sealdata">Notary eSeal Download Link</a>
                      <template v-if="accountSettings.buyPngSealdata">
                        <br />
                        <a :href="accountSettings.buyPngSealdata">Notary eSeal w/ <b>Transparent background</b> Download Link</a>
                      </template>
                    </q-card-section>
                  </q-card>
                  <!-- </div> -->
                </div>
              </div>
              <hr />
              <div class="row">
                <div class="col-sm-6 col-md-4 q-ml-md">
                  <div class="row q-mt-lg">
                    <div class="col-12">
                      <h2>
                        Digital Signing Certificate
                      </h2>
                    </div>
                    <div class="q-pb-sm q-pt-sm row">
                      <div class="col-1">
                        <span class="material-icons blue">info</span>
                      </div>
                      <div class="col-10">
                        <small style="font-size:0.7rem">
                          <span>BlueNotary generates a free digital certificate automatically. You can also upload your own here.</span>
                        </small>
                      </div>
                    </div>
                    <div class="file-drop-zone q-mt-md"
                         @drop.prevent
                         @dragover.prevent
                         @dragenter.prevent
                         @dragleave.prevent
                    >
                      <div class="">
                        <div id="article" class="q-pt-sm">
                          <!-- <p>Drop file or upload here.</p> -->
                          <div v-if="uploadingD">
                            <q-spinner
                              color="primary"
                              size="3em" />
                            <p class="no-margin q-pt-md text-faded">
                              Uploading document, please wait...
                            </p>
                          </div>
                          <div v-if="!uploadingD">
                            <q-btn
                              class="browse-btn"
                              label="Upload Digital Certificate"
                              outline
                              @click="$refs.digitalFileInput.$el.click()"
                            />
                            <q-file
                              v-show="false"
                              ref="digitalFileInput"
                              v-model="digitalCertFile"
                              standout
                              outline
                              label="Add a document"
                              accept=".p12, .pfx"
                            />
                          </div>
                          <div class="flex row q-pa-sm">
                            <span style="font-size:10px">Only .p12 or .pfx extention accepted.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="q-my-md">
                    <div class="columns">
                      <div class="column is-8">
                        <q-input
                          v-model="dcpassword"
                          outlined
                          type="password"
                          hint="Digital Certificate Password"
                          :dense="dense"
                        />
                      </div>
                    </div>
                  </div>
                  <div v-if="dcText" class="q-my-md">
                    {{ dcText }}
                  </div>
                  <div class="q-my-md">
                    <q-btn color="green" :loading="dcSubmitLoading" label="Save Digital Signing Certificate" :disable="disableDCSubmit" @click="saveDCPasswordTop" />
                  </div>
                </div>
                <div class="col-sm-4 col-md-7">
                  <q-card v-if="accountSettings.certfileUrl" style="margin-left: 64px; margin-top: 48px">
                    <q-card-section>
                      <b>Source: </b>
                      <template v-if="accountSettings.certfileSource === 'manual'">Uploaded by Notary</template>
                      <template v-else>Generated by BlueNotary</template>
                      <template v-if="accountSettings.certfileAddedAt">
                        <br />
                        <b>Uploaded At: </b>{{ moment(accountSettings.certfileAddedAt).format('MMMM Do YYYY') }}
                      </template>
                      <template v-if="accountSettings.certfileSource === 'manual' && accountSettings.certfileUrl">
                        <br /> <a :href="accountSettings.certfileUrl">Certificate Download Link</a>
                      </template>
                    </q-card-section>
                  </q-card>
                  <div v-else
                       class="col-sm-4 col-md-7 q-pa-md q-ma-lg text-center"
                       style="border: solid 1px #333;max-height:auto"
                  >
                    <span>
                      The digital signing certificate will be auto-generated upon completion of your first notarization session. Or you can test output using Session Simulator. See here about <a href="https://www.youtube.com/watch?v=cZN5g-a8clk&t">how to view the Digital Certificate</a>.
                    </span>
                  </div>
                  <q-card v-if="enableBuyDCButton || enableBuyComboButton" flat class="q-ma-lg">
                    <template v-if="enableBuyDCButton">
                      <span style="font-size:12px;line-height:normal">If you'd like to download the digital certificate, it is available for $35 with a validity for 1 year.</span>
                      <q-btn
                        v-close-popup
                        style="display: block"
                        class="q-ml-sm full-width"
                        outline
                        color="green"
                        label="Buy/Download Digital Certificate"
                        @click="finalBuyDigitalCertificate()"
                      />
                      <br />
                    </template>
                    <template v-if="enableBuyComboButton">
                      <span style="font-size:12px;line-height:normal; margin-top: 24px">We also offer a lifetime deal for digital certificate at $79 one-time payment. Valid for 3 years, and then renewable every 3 years forever. This also includes your eSeal as a bonus.</span>
                      <q-btn
                        v-close-popup
                        :loading="buyComboLoading"
                        class="q-ml-sm full-width"
                        color="blue"
                        outline
                        label="Buy Lifetime Digital Certificate + eSeal"
                        @click="buyNotaryCombo()"
                      />
                    </template>
                  </q-card>
                  <q-card v-if="accountSettings.buyDCCertfileUrl" style="margin-left: 64px; margin-top: 20px; background: #e0ffea">
                    <q-card-section>
                      <b>Purchased Digital Certificate <template v-if="accountSettings.buyComboPurchaseExpiryDate">Combo</template></b>
                      <br />
                      <b>Purchased At: </b>{{ moment(accountSettings.buyDCCertfileAddedAt).format('MMMM Do YYYY') }}
                      <br />
                      <b>Valid Till: </b>{{ moment(accountSettings.buyDCPurchaseExpiryDate).format('MMMM Do YYYY') }}
                      <br />
                      <a :href="accountSettings.buyDCCertfileUrl">Certificate Download Link</a>
                      <br />
                      <b>Password: </b>{{ accountSettings.buyDCCertfilePassword }}
                    </q-card-section>
                  </q-card>
                </div>
              </div>
              <hr />
              <div class="row">
                <div class="col-4 q-ml-md q-mt-md">
                  <h2>RON Approval Document</h2>
                  <div class="row q-mt-md">
                    <div class="col-1">
                      <span class="material-icons blue">info</span>
                    </div>
                    <div class="col-10">
                      <small>
                        <a target="_blank" href="https://bluenotary.crisp.help/en/article/ron-approval-documents-acceptable-submissions-1k1kgxy/">
                          <u>Acceptable Documents List</u>
                        </a>
                      </small>
                    </div>
                    <div class="file-drop-zone q-mt-md"
                         @drop.prevent
                         @dragover.prevent
                         @dragenter.prevent
                         @dragleave.prevent
                    >
                      <div class="">
                        <div id="article" class="q-pt-sm">
                          <!-- <p>Drop file or upload here.</p> -->
                          <div v-if="uploadingCcl">
                            <q-spinner
                              color="primary"
                              size="3em" />
                            <p class="no-margin q-pt-md text-faded">
                              Uploading document, please wait...
                            </p>
                          </div>
                          <div v-if="!uploadingCcl">
                            <q-btn
                              class="browse-btn"
                              label="Upload RON Approval"
                              outline
                              @click="$refs.copyOfCommissionLetter.$el.click()"
                            />
                            <q-file
                              v-show="false"
                              ref="copyOfCommissionLetter"
                              v-model="copyOfCommissionLetterFile"
                              standout
                              outline
                              label="Add a document"
                              accept=".jpg, .jpeg, .png, .pdf"
                            />
                          </div>
                          <div class="flex row q-pa-sm">
                            <small>jpg, jpeg, png, pdf accepted</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-5 offset-md-1 offset-sm-1">
                  <ul class="col col-md-12 q-mt-lg">
                    <li
                      v-if="accountSettings !== null && accountSettings.notaryCopyOfCommissionLetterName"
                      :key="key"
                      class="q-mb-md"
                      style="border-left: solid #e0e0e0 2px"
                    >
                      <div class="flex justify-between">
                        <span class="q-pa-sm doc-title">
                          <a target="_blank" :href="accountSettings.notaryCopyOfCommissionLetterUrl">{{ accountSettings.notaryCopyOfCommissionLetterName }}</a>
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <hr />
              <div class="row">
                <div class="col-4">
                  <div class="row doc-list-preview">
                    <div class="q-mt-lg q-ml-md row">
                      <div class="col-12">
                        <h2>Signature</h2>
                        <q-btn outline class="btn q-mt-md" @click="showSignatureModal">Create Signature</q-btn>
                        <signature-selection-component :open-signature-model="openSignatureModel" :signature-selection-done="signatureSelectionDone" :signature-removed-done="signatureRemovedDone" openedfrom="settings" />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-7 offset-md-1 offset-sm-1">
                  <div class="row">
                    <div
                      v-for="(item, key) of signatures.signatures"
                      :key="key"
                      class="col-md-4 col-6 mt-3"
                    >
                      <span class="q-pa-sm doc-title">
                        <img :src="item.signaturedata" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <hr />
              <div class="row">
                <div class="col-4 q-mt-lg  ">
                  <div class="row q-ml-md">
                    <div class="col-12">
                      <h2>Notary Certificates</h2>
                    </div>
                    <div
                      class="file-drop-zone q-mt-md"
                      @drop.prevent
                      @dragover.prevent
                      @dragenter.prevent
                      @dragleave.prevent
                    >
                      <div class="">
                        <div id="article" class="q-pt-sm">
                          <!-- <p>Drop file or upload here.</p> -->
                          <div v-if="uploading">
                            <q-spinner
                              color="primary"
                              size="3em" />
                            <p class="no-margin q-pt-md text-faded">
                              Uploading document, please wait...
                            </p>
                          </div>
                          <div v-if="!uploading">
                            <q-btn
                              class="browse-btn"
                              label="Upload document"
                              outline
                              @click="$refs.fileinputArticle.$el.click()"
                            />
                            <q-file
                              v-show="false"
                              ref="fileinputArticle"
                              v-model="pickedCertificateFile"
                              standout
                              outline
                              label="Add a document"
                              accept=".jpg, .jpeg, .png"
                            />
                          </div>
                          <div class="flex row q-pa-sm">
                            <small>jpg, jpeg, png accepted</small>
                          </div>
                          <div v-if="certFileSizeIsValid === false" class="flex row q-pa-sm red-error" style="margin-top: 0;">
                            <small>File size should less than 2 MB.</small>  <p>(You can use the <a href="https://imagecompressor.11zon.com/en/image-compressor/compress-jpeg-to-100kb.php" target="_blank">following link</a> to compress the image)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-7 offset-md-1 offset-sm-1">
                  <ul v-if="accountSettings !== null" class="col col-md-12 q-mt-lg">
                    <li
                      v-for="(item, key) of accountSettings.notaryCertificates"
                      :key="key"
                      class="q-mb-md"
                      style="border-left: solid #e0e0e0 2px"
                    >
                      <div class="flex justify-between">
                        <span class="q-pa-sm doc-title">
                          <a target="_blank" :href="item.url">{{ item.name }}</a>
                          <!-- <a target="_blank" :href="item.url" class="q-ml-md">
                              <q-icon name="visibility" />
                            </a> -->
                          <q-btn
                            class="q-ml-md"
                            padding="none"
                            icon="delete"
                            flat
                            @click="deleteNotaryCertificate(item)"
                          />
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </q-tab-panel>
            <q-tab-panel name="audio_video">
              <div class="q-pt-lg q-ma-lg text-center row">
                <div class="col-12">
                  <h2><q-icon name="settings_remote" style="font-size:6rem;" /><br /><br />Check your video/audio quality.</h2>
                  <q-btn class="btn btn-primary q-ma-md q-pa-md" @click="startChecking">Check Video/Audio</q-btn>
                  <vue-identify-network
                    @network-type="handleNetworkIdentified"
                    @network-speed="handleNetworkSpeed"
                  >
                    <!-- <template #unknown>
                          <div class="text-center">
                            <i class="material-icons size-2 text-red text-center">warning</i>
                            <p class="q-my-md text-red">We cannot detect your internet connection speed at the moment. <br />Please move to a location with strong connection to ensure successful video call.</p>
                          </div>
                        </template> -->
                    <template #slow>
                      <i class="material-icons size-2 text-red text-center">warning</i>
                      <p class="q-my-md text-red">Your internet connection is not strong enough for a video call. <br />Please move to a location with a stronger connection.</p>
                    </template>
                  </vue-identify-network>
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
                <div v-if="showStripePayoutsSection" class="col-md-6">
                  <h2>Manage Payouts</h2>
                  <p class="q-py-md"><small>Get paid automatically to your bank account.</small></p>
                  <q-btn v-if="!(details && details.stripeAccountDetails && details.stripeAccountDetails.stripeAccountLoginLink)" :loading="stripeConnectAccountButtonLoading" color="primary" class="q-mt-sm" label="Create Stripe Connect Account" @click="connectStripePaymentAccount" />
                  <q-btn v-if="details && details.stripeAccountDetails && details.stripeAccountDetails.stripeAccountLoginLink" color="primary" label="Open Stripe Dashboard" class="q-mt-sm" @click="openStripeDashboard" />
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
    <q-dialog v-model="checkAudioVideo" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <div class="q-gutter-md q-pb-lg row">
            <div class="col-12">
              <h2>Check your video/audio quality.</h2>
              <h3 class="q-my-md text-green">
                <q-icon name="task_alt" />
                Your internet connection is good.
              </h3>
              <video id="video" src="" style="color: black; width: 100%;" class="q-pr-md" />
              <audio id="audio" src="" />
            </div>
          </div>
          <p v-if="audioVideoError.length > 0" class="text-red">
            {{ audioVideoError }}
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-if="video" outline round color="primary" icon="videocam" @click="toggleVideo()" />
          <q-btn v-else outline round color="primary" icon="videocam_off" @click="toggleVideo()" />
          <q-btn v-if="audio" outline round color="primary" icon="mic" @click="toggleAudio()" />
          <q-btn v-else outline round color="primary" icon="mic_off" @click="toggleAudio()" />
          <q-btn v-close-popup outline label="Close" color="text-gray" @click="closePopup()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="stripeConfirmationDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">
            <template v-if="stripeConfirmation === 'success'">
              Stripe Registration Successful
            </template>
            <template v-else>
              Issues with Stripe Registration. Please try setup again.
            </template>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-if="stripeConfirmation === 'success'">
            You can check your Stripe payout dashboard by going to "Billing/Payouts" tab.
          </div>
          <div v-else>
            Your Stripe registration did not succeed. Please try again.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup outline label="OK" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog ref="dialog" v-model="showPopupWithImage">
      <q-card class="q-ma-lg">
        <q-card-section class="row items-center q-pb-none">
          <q-btn v-close-popup icon="close" flat round dense />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="q-pa-md">
            <img src="~assets/example-branded-email.jpg" style="width:100%" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog ref="dialog" v-model="dataFillModalShow">
      <q-card class="q-ma-lg">
        <q-card-section class="q-pt-none">
          <div class="q-pa-md  text-center">
            <h1 class="q-my-md">Welcome to BlueNotary!</h1>
            <!-- <img src="https://bluenotary.us/assets/img/logo-a4-b.png" style="width:50px;" /> -->
            <q-icon name="celebration" class="q-ma-md" style="font-size:6rem;color:blue" />
            <p class="q-px-md">Please fill in your <strong>account details</strong> and <strong>update your password</strong> then complete the list to get your account approved.</p>
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-mb-md">
          <q-btn v-close-popup outline label="Go" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog ref="dialog" v-model="showBuyDCModal">
      <q-card class="q-ma-lg">
        <q-card-section class="row items-center q-pb-none">
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="q-pa-md">
            <div class="q-gutter-y-md">
              <div class="row q-pb-lg" style="border-bottom: 1px solid gray">
                <div class="col-2 offset-1">
                  <img src="~assets/wax-stamp.png" style="width:auto" />
                </div>
                <div class="q-pt-sm col-8 offset-1">
                  <h1><strong>Digital Signing Certificate</strong></h1>
                  <h2 class="q-py-sm">$35</h2>
                  <p><small>1 Year Validity</small></p>
                </div>
              </div>
              <!-- <div class="card-body row q-px-md">
                <ul class="list-group list-group-flush col">
                  <li class="list-group-item" style="margin: 0">
                    <div style="display: flex; align-items: center">
                      <span class="material-icons" style="font-size:4rem">
                        history_edu
                      </span>
                    &nbsp;
                      <div><strong>Unlimited Loan Signings</strong></div>
                    </div>
                  </li>
                </ul>
              </div> -->
            </div>
            <div class="col-12 q-pt-sm">
              <q-btn
                outline
                :loading="buyDCLoading"
                class="q-ml-sm full-width"
                color="green"
                label="Buy/Download Digital Certificate"
                @click="finalBuyDigitalCertificate()"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
    <upgrade-account-popup-component :open-acc-pro-model="openUpgradePopup" />
    <lsa-approval-input-modal :open-app-lsa-model="openLSAApprovalModal" :notary-data="details" />
  </q-page>
</template>

<style scoped>
.seal-preview {
  -moz-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  user-select: none;
}
</style>

<script>
import Vue from "vue";
import {
  required, minLength, sameAs,
} from "vuelidate/lib/validators";
import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";
import moment from "moment";
import { VueIdentifyNetwork } from "vue-identify-network";
import _ from "lodash";
import $ from "jquery";
import states from "@/data/states.json";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";
import { loadStripe } from "@stripe/stripe-js/pure";
import SignatureSelectionComponent from "../../pdfedit/SignatureSelectionComponent.vue";
// import UpgradeToProComponent from "../../../components/UpgradeToProComponent.vue";
import UpgradeAccountPopupComponent from "../upgradeAccount.vue";
import LsaApprovalInputModal from "../lsaApprovalInputModal.vue";

const STATE_WISE_COUNTY_LIST_FOR_PICKER = {
  Tennessee: [
    "Anderson County",
    "Bedford County",
    "Benton County",
    "Bledsoe County",
    "Blount County",
    "Bradley County",
    "Campbell County",
    "Cannon County",
    "Carroll County",
    "Carter County",
    "Cheatham County",
    "Chester County",
    "Claiborne County",
    "Clay County",
    "Cocke County",
    "Coffee County",
    "Crockett County",
    "Cumberland County",
    "Davidson County",
    "De Kalb County",
    "Decatur County",
    "Dickson County",
    "Dyer County",
    "Fayette County",
    "Fentress County",
    "Franklin County",
    "Gibson County",
    "Giles County",
    "Grainger County",
    "Greene County",
    "Grundy County",
    "Hamblen County",
    "Hamilton County",
    "Hancock County",
    "Hardeman County",
    "Hardin County",
    "Hawkins County",
    "Haywood County",
    "Henderson County",
    "Henry County",
    "Hickman County",
    "Houston County",
    "Humphreys County",
    "Jackson County",
    "Jefferson County",
    "Johnson County",
    "Knox County",
    "Lake County",
    "Lauderdale County",
    "Lawrence County",
    "Lewis County",
    "Lincoln County",
    "Loudon County",
    "Macon County",
    "Madison County",
    "Marion County",
    "Marshall County",
    "Maury County",
    "McMinn County",
    "McNairy County",
    "Meigs County",
    "Monroe County",
    "Montgomery County",
    "Moore County",
    "Morgan County",
    "Obion County",
    "Overton County",
    "Perry County",
    "Pickett County",
    "Polk County",
    "Putnam County",
    "Rhea County",
    "Roane County",
    "Robertson County",
    "Rutherford County",
    "Scott County",
    "Sequatchie County",
    "Sevier County",
    "Shelby County",
    "Smith County",
    "Stewart County",
    "Sullivan County",
    "Sumner County",
    "Tipton County",
    "Trousdale County",
    "Unicoi County",
    "Union County",
    "Van Buren County",
    "Warren County",
    "Washington County",
    "Wayne County",
    "Weakley County",
    "White County",
    "Williamson County",
    "Wilson County"
  ]
};

export default {
  name: "NotarySettings",
  components: {
    VueIdentifyNetwork,
    SignatureSelectionComponent,
    UpgradeAccountPopupComponent,
    LsaApprovalInputModal
  },
  mixins: [VuelidateHelperMixin],
  data () {
    return {
      emailSettingModel: false,
      showPopupWithImage: false,
      openUpgradePopup: false,
      states,
      stripeConnectAccountButtonLoading: false,
      stripePCustomerBillingButtonLoading: false,
      details: {},
      stripeErrorsFound: false,
      errorDetails: {},
      stripeConfirmation: false,
      stripeConfirmationDialog: false,
      moment,
      disableDCSubmit: false,
      dcSubmitLoading: false,
      dcText: "",
      onboardingLocal: null,
      accountDataLoaded: false,
      model: {
        oldpassword: "",
        password: "",
        confirmPassword: ""
      },
      customMessage: "",
      oldcustomMessage: "",
      emailLogo: "",
      showchangeimage: true,
      allSessionTypes: [
        {
          value: "gnw",
          label: "GNW"
        },
        {
          value: "loan_signing",
          label: "Loan Signing"
        }
      ],
      multiSessionCustomCharges: {},
      enableAdditionalSigners: false,
      dataFillModalShow: false,
      activeTab: "account_details",
      openLSAApprovalModal: false,
      certFileSizeIsValid: true,
      sealFileSizeIsValid: true,
      buyDCLoading: false,
      buySealLoading: false,
      buyComboLoading: false,
      stripe: false,
      showBuyDCModal: false,
      profileInputs: {
        avatar: "",
        headline: "",
        bio: "",
        languages: "",
        years_exp: "",
        total_rons_completed: "",
        credentials: "",
        wesbite: "",
        location: "",
        facebook: "",
        twitter: "",
        instagram: "",
        youtube: "",
        eo_coverage: "",
        eo_expiration: "",
      },
      profileAvatarFile: "",
      profileAvatarFileLink: "",
      blueNotaryProfileUrl: "",
      saveProfileLoading: false,
      deleteProfileImageData: false,
      disableProfile: false,
      spanishLanguageFluency: false
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
      return showTab;
    },
    showStripePayoutsSection() {
      let showSection = true;
      if (this.$vendorDoc?.enableManageSubscriptionSettings) {
        showSection = false;
      } else if (this.$user.memberTypeProWhenInvited) {
        showSection = false;
      }
      return showSection;
    },
    currentStateCounties () {
      return STATE_WISE_COUNTY_LIST_FOR_PICKER[this.state] || false;
    },
    enableBuyDCButton() {
      if (!this.accountSettings) {
        return false;
      }
      if (this.accountSettings?.buyComboPurchaseExpiryDate) {
        return false;
      }
      if (this.accountSettings?.buyDCCertfileUrl && this.accountSettings?.buyDCPurchaseExpiryDate && moment(this.accountSettings.buyDCPurchaseExpiryDate) > moment()) {
        return false;
      }
      return true;
    },
    enableBuySealButton() {
      if (!this.accountSettings) {
        return false;
      }
      if (this.accountSettings?.buyComboPurchaseExpiryDate) {
        return false;
      }
      if (this.accountSettings?.buySealPurchaseExpiryDate) {
        return false;
      }
      return true;
    },
    enableBuyComboButton() {
      if (!this.accountSettings) {
        return false;
      }
      if (this.accountSettings?.buyComboPurchaseExpiryDate) {
        return false;
      }
      if (this.enableBuyDCButton && this.enableBuySealButton) {
        return true;
      }
      return false;
    }
  },
  validations: {
    model: {
      oldpassword: {},
      // oldpassword: { required: () => !this.$user.allowInitialPasswordChange },
      password: { required, minLength: minLength(6) },
      confirmPassword: { required, sameAsPassword: sameAs("password") }
    }
  },
  watch: {
    async pickedCertificateFile (val) {
      if (val.size > 2097152) {
        this.certFileSizeIsValid = false;
        return;
      }
      this.certFileSizeIsValid = true;
      this.uploading = true;
      console.log("certificate", val);
      await this.uploadNotaryCertificatesFiles(val);
      this.uploading = false;
    },
    digitalCertFile (val) {
      console.log(val);
      if (this.dcpassword) {
        this.dcText = "1 Digital Certificate File Added. Click on Save to save the file";
        this.disableDCSubmit = false;
      } else {
        this.dcText = "1 Digital Certificate File Added. Please enter Password";
        this.disableDCSubmit = true;
      }
    },
    dcpassword (val) {
      if (!this.digitalCertFile) {
        return;
      }
      if (val) {
        this.dcText = "1 Digital Certificate File Added. Click on Save to save the file";
        this.disableDCSubmit = false;
      } else {
        this.dcText = "1 Digital Certificate File Added. Please enter Password and click on Save";
        this.disableDCSubmit = true;
      }
    },
    async sealFile (val) {
      if (val.size > 100000) {
        this.sealFileSizeIsValid = false;
        return;
      }
      this.sealFileSizeIsValid = true;
      this.uploadingS = true;
      if (val) await this.saveSealdata(val);
      this.uploadingS = false;
    },
    async copyOfCommissionLetterFile (val) {
      this.uploadingCcl = true;
      console.log("cocl", val);
      await this.uploadCopyOfCommissionLetter(val);
      await this.nextButtonClick();
      this.uploadingCcl = false;
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
    activeTab() {
      console.log("active tab changed");
      setTimeout(() => {
        try {
          $(".seal-preview").on("contextmenu", () => false);
          $(".seal-preview").mousedown((e) => {
            e.preventDefault();
          });
          $(".seal-preview")[0].setAttribute("draggable", false);
        } catch (error) {
          console.log("error", error);
        }
      }, 500);
    }
  },
  async mounted () {
    if (this.$route.query.stripeConfirmation) {
      this.stripeConfirmationDialog = true;
      this.stripeConfirmation = this.$route.query.stripeConfirmation;
    }
    if (this.$route.query.dataFillModal) {
      this.dataFillModalShow = true;
    }
    this.onboardingLocal = await this.onboard();
    this.details = await this.loadDetail();
    await this.loadSignatures();
    this.accountDataLoaded = true;
    if (this.details) {
      console.log(this.details);
      if (this.details.commissionExpiresOn > 0) {
        const dateString = moment.unix(this.details.commissionExpiresOn).format("YYYY/MM/DD");
        this.commistionExpiration = dateString;
      }
      this.dcpassword = this.details.dcpassword;
      if (!this.details.stripeFullAccountDetails) {
        this.stripeErrorsFound = true;
        // this.errorDetails.errorMessage = "Add your payout details to receive payments; go to BILLING/PAYOUTS";
      }
      if (this.details.stripeFullAccountDetails && this.details.stripeFullAccountDetails.requirements && this.details.stripeFullAccountDetails.requirements.errors && this.details.stripeFullAccountDetails.requirements.errors.length) {
        this.stripeErrorsFound = true;
        this.errorDetails.errorMessage = "Please find the below errors found in Stripe Connect: (Open Stripe Dashboard and fix the errors.)";
        this.errorDetails.errorsList = [];
        _.map(this.details.stripeFullAccountDetails.requirements.errors, (errorDoc) => {
          this.errorDetails.errorsList.push(errorDoc.reason);
        });
      }
      if (this.details.stripeFullAccountDetails && this.details.stripeFullAccountDetails.capabilities && this.details.stripeFullAccountDetails.capabilities.transfers !== "active") {
        this.stripeErrorsFound = true;
        this.errorDetails.errorMessage = "Your stripe account setup is not completed yet, PAYOUT DETAILS section is missing for your stripe account. Please complete the setup by going to Billing tab, then 'Open Stripe Dashboard'";
      }
      this.multiSessionCustomCharges = this.$user.notaryCustomCharges || {};
    }
    try {
      $(".seal-preview").on("contextmenu", () => false);
      $(".seal-preview").mousedown((e) => {
        e.preventDefault();
      });
      $(".seal-preview")[0].setAttribute("draggable", false);
    } catch (error) {}
    this.email = this.$user.email;
    this.firstName = (this.$user.first_name) ? this.$user.first_name : this.$user.name.split(" ")[0];
    this.lastName = (this.$user.last_name) ? this.$user.last_name : this.$user.name.split(" ")[1];
    this.commissionNumber = this.$user.commissionNumber;
    this.spanishLanguageFluency = this.$user.spanishLanguageFluency || false;
    this.state = this.$user.state;
    this.county = this.$user.county || "";
    this.oldData = {
        commissionExpiresOn: this.commistionExpiration,
        dcpassword: this.dcpassword,
        state: this.state,
        county: this.county,
        first_name: this.firstName,
        last_name: this.lastName,
        name: `${this.firstName} ${this.lastName}`,
        email: this.email,
        commissionNumber: this.commissionNumber,
        spanishLanguageFluency: this.spanishLanguageFluency
    };
    this.customMessage = this.$user.emailCustomMessage;
    this.oldcustomMessage = this.$user.emailCustomMessage;
    this.emailLogo = (this.$user.emailLogoUrl) || "";
    this.emailSettingModel = (this.$user.sendBrandEmails) || false;
    _.map(this.allSessionTypes, (sessionType) => {
      if (!(this.multiSessionCustomCharges[sessionType.value] && this.multiSessionCustomCharges[sessionType.value].length)) {
        Vue.set(this.multiSessionCustomCharges, sessionType.value, [{
          id: "input0",
          particular: "",
          amount: 0
        }]);
      }
    });
    if (!(this.accountSettings.certfileSource && this.accountSettings.certfileSource === "manual")) {
      this.disableDCSubmit = true;
    }
    $(document).on("click", ".modaltrigger", () => {
      this.showUpgradePopup();
    });
  },
  setup () {
    // const {

    // } = context;
    const uploading = ref(false);
    const uploadingD = ref(false);
    const uploadingS = ref(false);
    const uploadingCcl = ref(false);
    const openSignatureModel = ref(false);
    const accountSettings = ref([]);
    const pickedCertificateFile = ref(null);
    const copyOfCommissionLetterFile = ref(null);
    const audioVideoError = ref("");
    const audioCheck = ref(false);
    const videoCheck = ref(false);
    const audio = ref(false);
    const video = ref(false);
    const checkAudioVideo = ref(false);
    const loading = ref(false);
    const certUploaded = ref(false);
    const sealUploaded = ref(false);
    const state = ref("");
    const county = ref("");
    const commissionNumber = ref("");
    const spanishLanguageFluency = ref(false);
    const firstName = ref("");
    const lastName = ref("");
    const email = ref("");
    const dense = ref(false);
    const date = ref("");
    const commistionExpiration = ref("");
    const digitalCertFile = ref(null);
    const dcpassword = ref("");
    const sealFile = ref(null);
    const certFileName = ref("");
    const sealFileName = ref("");
    const fileEditor = ref(false);
    const fileUrl = ref(null);
    const sealImage = ref(null);
    const signatures = ref([]);
    const oldData = ref("");
    const uploadNotaryEmailLogo = ref(null);
    const saveDetail = async (data) => {
      try {
        const url = "notary/detail";
        const response = await $axios.post(url, { data }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const loadDetail = async (sessionId) => {
      try {
        const url = "notary/loads";
        const response = await $axios.post(url, { sessionId }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        accountSettings.value = response.data;
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const loadSignatures = async () => {
      try {
        const url = "signatures/getSignatures";
        const response = await $axios.get(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        signatures.value = response.data;
        return response.data;
      } catch (error) {
        return error;
      }
    };

    const dCFileUpload = async (data) => {
      try {
        const url = "file/notaryFileUpload";
        const formData1 = new FormData();
        formData1.append("dcpassword", dcpassword.value);
        formData1.append("file", digitalCertFile.value);
        const response = await $axios.post(url, formData1, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        certFileName.value = data.name;
        certUploaded.value = true;
        await loadDetail();
        return response.data;
      } catch (error) {
        console.log(error);
        return error;
      }
    };

    const removeCertificate = async () => {
      try {
        const url = "notary/notaryFileDelete";
        const formData = new FormData();
        const response = await $axios.post(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        certFileName.value = null;
        certUploaded.value = false;
        await loadDetail();
        return response.data;
      } catch (error) {
        return error;
      }
    };

    const removeNotaryCertificate = async (data) => {
      try {
        const url = "notary/notaryCertificateDelete";
        const response = await $axios.post(url, { data }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        await loadDetail();
        return response.data;
      } catch (error) {
        return error;
      }
    };

    const saveDCPassword = async () => {
      try {
        console.log("called", digitalCertFile);
        if (digitalCertFile && digitalCertFile.value) {
          await dCFileUpload(digitalCertFile);
        } else {
          const url = "notary/saveNotaryDataFields";
          const data = {
            dcpassword: dcpassword.value
          };
          await $axios.post(url, data, {
            headers: {
              "Content-Type": "application/json",
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    };

    const saveSealdata = async (data) => {
      try {
        const url = "file/sealdata";
        const formData = new FormData();
        formData.append("file", data);
        const response = await $axios.post(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        sealUploaded.value = true;
        sealFile.value = null;
        sealImage.value = response.data.file;
        await loadDetail();
        return response.data;
      } catch (error) {
        return error;
      }
    };

    const uploadNotaryCertificatesFiles = async(data) => {
      try {
        const url = "file/notaryCertificateUpload";
        const formData1 = new FormData();
        formData1.append("file", data);
        const response = await $axios.post(url, formData1, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        await loadDetail();
        return response.data;
      } catch (error) {
        return error;
      }
    };

    const uploadCopyOfCommissionLetter = async(data) => {
      try {
        const url = "file/notaryCopyOfComissionLetter";
        const formData = new FormData();
        formData.append("file", data);
        const response = await $axios.post(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        await loadDetail();
        return response.data;
      } catch (error) {
        return error;
      }
    };

    const handleNetworkIdentified = (type) => {
      console.log("connection type: ", type);
    };
    const handleNetworkSpeed = (speed) => {
      console.log("downlink: ", speed);
    };
    const saveNotaryEmailLogo = async (data) => {
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
    };

    return {
      audioVideoError,
      audioCheck,
      videoCheck,
      audio,
      video,
      checkAudioVideo,
      handleNetworkIdentified,
      handleNetworkSpeed,
      accountSettings,
      uploading,
      uploadingD,
      uploadingS,
      uploadingCcl,
      pickedCertificateFile,
      loading,
      state,
      county,
      commissionNumber,
      spanishLanguageFluency,
      firstName,
      lastName,
      email,
      dense,
      date,
      commistionExpiration,
      certUploaded,
      certFileName,
      sealFileName,
      sealUploaded,
      saveDetail,
      loadDetail,
      dCFileUpload,
      removeCertificate,
      removeNotaryCertificate,
      digitalCertFile,
      sealFile,
      dcpassword,
      fileEditor,
      fileUrl,
      saveSealdata,
      uploadNotaryCertificatesFiles,
      sealImage,
      openSignatureModel,
      signatures,
      loadSignatures,
      uploadCopyOfCommissionLetter,
      copyOfCommissionLetterFile,
      saveDCPassword,
      oldData,
      uploadNotaryEmailLogo,
      saveNotaryEmailLogo
    };
  },
  methods: {
    async buyNotarySeal() {
      this.buySealLoading = true;
      if (process.env.STRIPE_PUBLIC_KEY_TEST) {
        if (!this.stripe) {
          if (this.$user.testingacc) {
            const pubkey = process.env.STRIPE_PUBLIC_KEY_TEST;
            this.stripe = await loadStripe(pubkey);
          } else {
            const pubkey = process.env.STRIPE_PUBLIC_KEY;
            this.stripe = await loadStripe(pubkey);
          }
        }
      }
      try {
        const { data } = await this.axios.post("/notary/buyseal-checkout-session");
        this.buySealLoading = false;
        return this.stripe.redirectToCheckout({ sessionId: data.id });
      } catch (error) {
        return error;
      }
    },
    async buyNotaryCombo() {
      this.buyComboLoading = true;
      if (process.env.STRIPE_PUBLIC_KEY_TEST) {
        if (!this.stripe) {
          if (this.$user.testingacc) {
            const pubkey = process.env.STRIPE_PUBLIC_KEY_TEST;
            this.stripe = await loadStripe(pubkey);
          } else {
            const pubkey = process.env.STRIPE_PUBLIC_KEY;
            this.stripe = await loadStripe(pubkey);
          }
        }
      }
      try {
        const { data } = await this.axios.post("/notary/buycombo-checkout-session");
        this.buyComboLoading = false;
        return this.stripe.redirectToCheckout({ sessionId: data.id });
      } catch (error) {
        return error;
      }
    },
    openProfileClicked() {
      window.open(this.blueNotaryProfileUrl, "_blank").focus();
    },
    getCustomerLink() {
      let customerLink = `https://app.bluenotary.us/business/register?refferedByNotary=${this.$user._id}&type=customer`;
      if (window.location && window.location.host === "localhost:8080") {
        customerLink = `http://localhost:8080/business/register?refferedByNotary=${this.$user._id}&type=customer`;
      }
      console.log(customerLink);
      this.$q.notify({
        type: "positive",
        position: "bottom-right",
        message: "Customer link copied to clipboard",
      });
      if (window.clipboardData && window.clipboardData.setData) {
        // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
        return window.clipboardData.setData("Text", customerLink);
      }
      if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        const textarea = document.createElement("textarea");
        textarea.textContent = customerLink;
        textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in Microsoft Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
          return document.execCommand("copy"); // Security exception may be thrown by some browsers.
        } catch (ex) {
          console.log("Copy to clipboard failed.", ex);
          // eslint-disable-next-line no-alert
          return prompt("Copy to clipboard: Ctrl+C, Enter", customerLink);
        } finally {
          document.body.removeChild(textarea);
        }
      }
      return "";
    },
    getSessionLink() {
      let sessionLink = `https://app.bluenotary.us/business/register?refferedByNotary=${this.$user._id}&invitedViaSessionLink=true&type=customer`;
      if (window.location && window.location.host === "localhost:8080") {
        sessionLink = `http://localhost:8080/business/register?refferedByNotary=${this.$user._id}&invitedViaSessionLink=true&type=customer`;
      }
      console.log(sessionLink);
      this.$q.notify({
        type: "positive",
        position: "bottom-right",
        message: "Customer link copied to clipboard",
      });
      if (window.clipboardData && window.clipboardData.setData) {
        // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
        return window.clipboardData.setData("Text", sessionLink);
      }
      if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        const textarea = document.createElement("textarea");
        textarea.textContent = sessionLink;
        textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in Microsoft Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
          return document.execCommand("copy"); // Security exception may be thrown by some browsers.
        } catch (ex) {
          console.log("Copy to clipboard failed.", ex);
          // eslint-disable-next-line no-alert
          return prompt("Copy to clipboard: Ctrl+C, Enter", sessionLink);
        } finally {
          document.body.removeChild(textarea);
        }
      }
      return "";
    },
    deleteProfileImage() {
      this.$q.dialog({
        title: "Confirm",
        message: "Are you sure you want to remove your Avatar?",
        cancel: true,
        persistent: true
      }).onOk(() => {
        this.$q.notify({
          type: "positive",
          position: "bottom-right",
          message: "Please Save Profile to apply and publish the changes",
        });
        this.deleteProfileImageData = true;
        this.profileAvatarFileLink = "";
      });
    },
    async saveProfileClicked() {
      const formData = new FormData();
      formData.append("data", JSON.stringify(this.profileInputs));
      if (this.disableProfile) {
        formData.append("disableProfile", this.disableProfile);
      }
      if (this.deleteProfileImageData) {
        formData.append("deleteProfileImageData", true);
      }
      if (this.profileAvatarFile) {
        formData.append("file", this.profileAvatarFile);
      }
      this.saveProfileLoading = true;
      const dataResponse = await this.axios.post("/file/saveProfile", formData);
      this.saveProfileLoading = false;
      console.log(dataResponse);
      this.$q.notify({
        type: "positive",
        position: "bottom-right",
        message: "User profile updated and published",
      });
      if (dataResponse?.data?.userDoc?.profile) {
        this.profileInputs = dataResponse?.data?.userDoc?.profile;
      }
      if (dataResponse?.data?.userDoc?.avatarUrl) {
        this.profileAvatarFileLink = dataResponse?.data?.userDoc?.avatarUrl;
      }
      if (dataResponse?.data?.userDoc?.disableProfile) {
        this.blueNotaryProfileUrl = "";
      }
    },
    async buyDigitalCertificate() {
      this.showBuyDCModal = true;
    },
    async finalBuyDigitalCertificate() {
      this.buySealLoading = true;
      if (process.env.STRIPE_PUBLIC_KEY_TEST) {
        if (!this.stripe) {
          if (this.$user.testingacc) {
            const pubkey = process.env.STRIPE_PUBLIC_KEY_TEST;
            this.stripe = await loadStripe(pubkey);
          } else {
            const pubkey = process.env.STRIPE_PUBLIC_KEY;
            this.stripe = await loadStripe(pubkey);
          }
        }
      }
      try {
        const { data } = await this.axios.post("/notary/buydc-checkout-session");
        this.buyDCLoading = false;
        this.showBuyDCModal = false;
        return this.stripe.redirectToCheckout({ sessionId: data.id });
      } catch (error) {
        return error;
      }
    },
    async saveDCPasswordTop() {
      this.dcSubmitLoading = true;
      await this.saveDCPassword();
      this.dcSubmitLoading = false;
    },
    showUpgradePopup() {
      this.openUpgradePopup = false;
      setTimeout(() => {
        this.openUpgradePopup = true;
      }, 200);
    },
    showEmailSetting() {
      this.showPopupWithImage = false;
      setTimeout(() => {
        this.showPopupWithImage = true;
      }, 200);
    },
    showLSAApprovalModal() {
      if (this.$user.approve !== "active") {
        this.$q.notify({
          type: "negative",
          message: "You can apply for LSA, once your Notary Account is approved"
        });
        return;
      }
      this.openLSAApprovalModal = false;
      setTimeout(() => {
        this.openLSAApprovalModal = true;
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
    isAccountDetailUpdated () {
      if (this.accountDataLoaded === false) {
        return false;
      }
      if (this.accountDataLoaded === false || this.firstName !== this.oldData.first_name || this.lastName !== this.oldData.last_name || this.state !== this.oldData.state || this.county !== this.oldData.county || this.commissionNumber !== this.oldData.commissionNumber || this.commistionExpiration !== this.oldData.commissionExpiresOn || this.email !== this.oldData.email || this.spanishLanguageFluency !== this.oldData.spanishLanguageFluency) {
        return true;
      }
      return false;
    },
    errorDismiss() {
      this.stripeErrorsFound = false;
    },
    async onboard() {
      try {
        const url = "/users/me?stripe=true";
        const response = await $axios.get(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response?.data?.user?.profile) {
          this.profileInputs = response?.data?.user?.profile;
        }
        if (response?.data?.user?.avatarUrl) {
          this.profileAvatarFileLink = response?.data?.user?.avatarUrl;
        }
        if (response?.data?.user?.disableProfile) {
          this.disableProfile = response?.data?.user?.disableProfile;
        }
        if (response?.data?.user?.blueNotaryProfileUrl) {
          this.blueNotaryProfileUrl = response?.data?.user?.blueNotaryProfileUrl;
        }
        return (response.data && response.data.onBoarding) ? response.data.onBoarding : false;
      } catch (error) {
        return error;
      }
    },
    async connectStripePaymentAccount() {
      this.stripeConnectAccountButtonLoading = true;
      const url = "notary/connectStripe";
      const response = await $axios.post(url, { }, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      window.open(response.data.stripeAccountLink).focus();
      this.stripeConnectAccountButtonLoading = false;
    },
    openStripeDashboard() {
      window.open(this.details.stripeAccountDetails.stripeAccountLoginLink).focus();
    },
    startChecking() {
      if (this.audioCheck && this.videoCheck) {
        // this.$router.replace(`/pdf_edit/sessions/${this.sessionid}`);
      } else {
        this.checkAudioVideo = true;
        // this.getAudioVideoStream();
      }
    },
    goesNextAfterAudioVideoCheck() {
      if (!this.video) {
        this.audioVideoError = "Camera permission is required to go ahead, please enable the camera access and try again.";
      } else if (!this.audio) {
        this.audioVideoError = "Mic permission is required to go ahead, please enable the mic access and try again.";
      } else {
        this.$router.replace(`/pdf_edit/sessions/${this.sessionid}`);
      }
    },
    getAudioVideoStream() {
      // video
      navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
          document.getElementById("video").srcObject = stream;
          document.getElementById("video").autoplay = true;
          this.video = true;
          this.videoCheck = true;
      }).catch((err) => {
          this.audioVideoError = err;
          console.log(`u got an error: ${err}`);
      });

      // Audio
      navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((stream) => {
          document.getElementById("audio").srcObject = stream;
          // document.getElementById("audio").autoplay = true;
          this.audio = true;
          this.audioCheck = true;
      }).catch((err) => {
          this.audioVideoError = err;
          console.log(`u got an error: ${err}`);
      });
    },
    toggleAudio() {
      if (!this.audio) {
        // Audio
        navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((stream) => {
            document.getElementById("audio").srcObject = stream;
            // document.getElementById("audio").autoplay = true;
            this.audio = true;
            this.audioCheck = true;
        }).catch((err) => {
            this.audioVideoError = err;
            console.log(`u got an error: ${err}`);
        });
      } else {
        const audioElem = document.getElementById("audio");
        const aStream = audioElem.srcObject;
        const aTracks = aStream.getTracks();

        aTracks.forEach((track) => {
          track.stop();
        });
        audioElem.srcObject = null;
        this.audio = false;
      }
    },
    toggleVideo() {
      if (!this.video) {
        // video
        navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
            document.getElementById("video").srcObject = stream;
            document.getElementById("video").autoplay = true;
            this.video = true;
            this.videoCheck = true;
        }).catch((err) => {
            this.audioVideoError = err;
            console.log(`u got an error: ${err}`);
        });
      } else {
        const videoElem = document.getElementById("video");
        const vStream = videoElem.srcObject;
        const vTracks = vStream.getTracks();

        vTracks.forEach((track) => {
          track.stop();
        });
        videoElem.srcObject = null;
        this.video = false;
      }
    },
    closePopup() {
      if (this.video) {
        this.toggleVideo();
      }
      if (this.audio) {
        this.toggleAudio();
      }
    },
    stopAudioVideo() {
      const videoElem = document.getElementById("video");
      const audioElem = document.getElementById("audio");

      if (this.video) {
        const vStream = videoElem.srcObject;
        const vTracks = vStream.getTracks();

        vTracks.forEach((track) => {
          track.stop();
        });
        videoElem.srcObject = null;
        this.video = false;
      }

      if (this.audio) {
        const aStream = audioElem.srcObject;
        const aTracks = aStream.getTracks();

        aTracks.forEach((track) => {
          track.stop();
        });
        audioElem.srcObject = null;
        this.audio = false;
      }
    },
    closeDatePicker () {
      console.log(this.$refs.closeBtn.click());
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
      if (!this.commissionNumber) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please enter notary commission number",
        });
      }
      if (!this.commistionExpiration) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please select a date of commission expires.",
        });
      }
      if (!this.state) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please select your state.",
        });
      }
      if (this.currentStateCounties && !this.county) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please select your County.",
        });
      }

      // if (!(this.accountSettings !== null && this.accountSettings.notaryCopyOfCommissionLetterName)) {
      //   return this.$q.notify({
      //     color: "secondary",
      //     position: "bottom-right",
      //     message: "Please upload copy of your RON approval document.",
      //   });
      // }

      const data = {
        commissionExpiresOn: moment(this.commistionExpiration, "YYYY/MM/DD", true).unix(),
        dcpassword: this.dcpassword,
        state: this.state,
        county: this.county,
        first_name: this.firstName,
        last_name: this.lastName,
        name: `${this.firstName} ${this.lastName}`,
        email: this.email,
        commissionNumber: this.commissionNumber,
        spanishLanguageFluency: this.spanishLanguageFluency,
      };
      this.loading = true;
      const res = await this.saveDetail(data);
      console.log("res ", res);
      this.details = await this.loadDetail();
      console.log(this.details);
      await this.$store.dispatch("auth/fetchUser");
      if (this.details.sealdata && this.details.certfilename) {
        this.$q.notify({
          type: "positive",
          position: "bottom-right",
          message: "Thank you for updating your notary details.",
        });
        this.loading = false;
        return true;
        // return this.$router.replace("/notary/dashboard/");
      }
      this.$q.notify({
        type: "positive",
        position: "bottom-right",
        message: "Thank you for updating your notary details.",
      });
      this.loading = false;
      return true;
      // return this.$router.replace("/notary/my-sessions/");
    },
    async deleteCertificate () {
      const data = await this.removeCertificate();
      console.log(data);
    },
    async deleteNotaryCertificate (item) {
      const params = {
        key: item.key,
      };
      const data = await this.removeNotaryCertificate(params);
      console.log(data);
    },
    showSignatureModal() {
      this.openSignatureModel = false;
      setTimeout(() => {
        this.openSignatureModel = true;
      }, 200);
    },
    async signatureSelectionDone() {
      this.openSignatureModel = false;
      await this.loadSignatures();
    },
    async signatureRemovedDone() {
      await this.loadSignatures();
    },
    redirectToStripe() {
      window.open("https://stripe.com/docs/billing/subscriptions/integrating-customer-portal", "_blank");
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
    async updateCharges () {
      try {
        this.loading = true;
        const dataToSend = {
          notaryCustomCharges: _.mapValues(this.multiSessionCustomCharges, (customCharges) => {
            customCharges = _.filter(customCharges, (tempCustomCharge) => tempCustomCharge.particular);
            return customCharges;
          })
        };
        await $axios.post("notary/saveNotaryCustomCharges", dataToSend, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        this.$q.notify({
          color: "primary",
          position: "bottom",
          message: "Successfully saved custom fees.",
        });
        this.loading = false;
      } catch (error) {
        this.loading = false;
        console.log(error);
      }
    },
    addMoreChargesButton(sessionType) {
      this.multiSessionCustomCharges[sessionType.value].push({
        id: `input${String(this.multiSessionCustomCharges[sessionType.value].length)}`,
        particular: "",
        amount: 0
      });
    },
    removeChargesButton(sessionType, chargeId) {
      this.multiSessionCustomCharges[sessionType.value] = _.filter(this.multiSessionCustomCharges[sessionType.value], (chargeDoc) => chargeDoc.id !== chargeId);
    },
  }
};
</script>
