<template>
  <q-layout>
    <q-page-container class="q-pa-xl">
      <q-page class="container">
        <div class="row flex">
          <div class="col col-sm-8 col-md-6 offset-md-1">
            <h1>
              Invite A Signer
            </h1>
            <p class="q-my-md">We'll create a new session for you and send an invitation to the signer via email with instructions about how to get started with the process along with your scheduled date & time for the live session meeting.</p>
            <q-card v-if="$user.memberType !== 'title_hybrid' && $user.memberType !== 'title_pro'" class="q-pa-sm">
              <q-card-section>
                <q-form class="">
                  <div v-if="sessionType && sessionType.value === 'loan_signing' && $user.memberType === 'title_hybrid'" class="q-pb-xl">
                    <div class="q-pb-sm">
                      <h1>
                        Transaction Details
                      </h1>
                      <div class="q-py-md">
                        <h3>
                          Transaction Type
                        </h3>
                        <div class="col" style="margin-top: 8px">
                          <q-select
                            v-model="loanSessionType"
                            filled
                            dense
                            :options="allLoanSessionTypes"
                            label="Select Transaction Details"
                            icon="assignment"
                            input-debounce="0"
                            :options-dense="true"
                          >
                            <template v-slot:prepend>
                              <q-icon name="assignment" />
                            </template>
                          </q-select>
                        </div>
                        <div v-if="loanSessionType && loanSessionType.value === 'other'" class="col" style="margin-top: 8px">
                          <q-input
                            v-model="otherLoanSessionType"
                            dense
                            filled
                            type="text"
                            label="Other Transaction Type"
                          >
                            <template v-slot:prepend>
                              <q-icon name="info" />
                            </template>
                          </q-input>
                          <q-input
                            v-model="otherLoanSessionType"
                            class="col-12 col-md-9"
                            filled
                            hint="Loan Number"
                            :dense="dense"
                          />
                        </div>
                      </div>
                    </div>
                    <div v-if="sessionType && sessionType.value === 'loan_signing'" class="">
                      <div class="full-width q-pb-md">
                        <h3>
                          Property Address
                        </h3>
                        <div class="row q-gutter-sm q-mt-sm">
                          <q-input
                            v-model="loan_signing_addressLine1"
                            class="col-12 col-md-9"
                            filled
                            hint="Address Line 1"
                            dense
                          />
                          <q-input
                            v-model="loan_signing_addressLine2"
                            class="col-md-4 col-12"
                            filled
                            hint="Address Line 2"
                            dense
                          />
                          <q-select
                            v-model="loan_signing_userState"
                            :options="states"
                            class="col-md-3 col-4"
                            filled
                            hint="State"
                            dense
                          />
                          <q-input
                            v-model="loan_signing_userZipCode"
                            class="col-md-2 col-6"
                            filled
                            hint="Zip Code"
                            dense
                          />
                        </div>
                      </div>
                      <div class="q-py-sm">
                        <h3>
                          Instructions & Notes
                        </h3>
                        <p><small>Please add any special instructions or notes you require for the notary during the closing.</small> </p>
                        <div class="q-gutter-sm q-mt-sm">
                          <div style="max-width: 500px;">
                            <q-input
                              v-model="loan_signing_notes_for_notary"
                              filled
                              type="textarea"
                              label="Add notes here"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h1 class="q-pb-sm">
                    Signer Details
                  </h1>
                  <q-input
                    v-model="$v.model.signerName.$model"
                    dense
                    filled
                    type="text"
                    label="Signer Name"
                    :error-message="errorMessage($v.model.signerName, 'Name')"
                    :error="!!errorMessage($v.model.signerName)"
                  >
                    <template v-slot:prepend>
                      <q-icon name="account_box" />
                    </template>
                  </q-input>
                  <q-input
                    v-model="$v.model.signerEmail.$model"
                    dense
                    filled
                    type="email"
                    label="Signer Email"
                    :error-message="errorMessage($v.model.signerEmail, 'Email')"
                    :error="!!errorMessage($v.model.signerEmail)"
                  >
                    <template v-slot:prepend>
                      <q-icon name="email" />
                    </template>
                  </q-input>
                  <div>
                    <div class="full-width">
                      <q-checkbox v-model="multiSignerFlag" label="Add Multiple Signers to this Session" :disable="!enableAdditionalSigners" />
                      <q-icon v-if="!enableAdditionalSigners" name="info" class="q-ml-sm" style="cursor: pointer;" @click="showUpgradePopup">
                        <q-tooltip>
                          Pro Hybrid plan feature
                        </q-tooltip>
                      </q-icon>
                    </div>
                    <div class="q-mx-sm">
                      <small><a href="https://bluenotary.crisp.help/en/article/how-does-multi-signer-session-work-from-notary-view-1d1qwhj/" target="_blank"><u>How does multi-signer session work?</u></a></small>
                    </div>
                  </div>
                  <div class="col-12">
                    <div v-if="multiSignerFlag" class="flex column no-margin">
                      <div v-for="signerItem in multiSignerList" :key="signerItem.id" class="row" style="margin-top: 8px;">
                        <div class="col-6">
                          <q-input v-model="signerItem.email" dense filled label="Secondary Signer Email" type="email" />
                        </div>
                        <div class="col-2">
                          <q-btn flat outline color="primary" icon="clear" style="font-size: 17px" @click="removeSignerEmail(signerItem.id)" />
                        </div>
                      </div>
                      <q-btn icon="add" outline class="q-mt-sm" round @click="addMoreSignerButton" />
                    </div>
                  </div>
                  <div style="padding-top: 48px">
                    <h1>
                      Add Witness
                    </h1>
                    <div class="">
                      <div class="col" style="margin-top: 8px">
                        <q-btn outline label="Click here to add more witness" @click="addWitnessClicked" />
                      </div>
                      <div v-if="addWitnessDataPacket" style="margin-top: 12px">
                        Witness added for this session
                        <q-btn flat round color="red" icon="delete" @click="deleteWitnessFromSession">
                          <q-tooltip>Click here to delete witness</q-tooltip>
                        </q-btn>
                      </div>
                    </div>
                  </div>
                  <div v-if="$user.memberType !== 'title_hybrid'" class="q-py-xl  ">
                    <h1>
                      Session Type
                    </h1>
                    <div class="">
                      <div class="col" style="margin-top: 8px">
                        <q-select
                          v-model="sessionType"
                          filled
                          dense
                          :options="allSessionTypes"
                          label="Select Session Type"
                          icon="assignment"
                          input-debounce="0"
                          :options-dense="true"
                        >
                          <template v-slot:prepend>
                            <q-icon name="assignment" />
                          </template>
                        </q-select>
                      </div>
                    </div>
                  </div>
                  <div v-if="sessionType && sessionType.value === 'loan_signing' && $user.memberType !== 'title_hybrid'" class="q-pb-xl">
                    <div class="q-pb-sm">
                      <h1>
                        Transaction Details
                      </h1>
                      <div class="q-py-md">
                        <h3>
                          Transaction Type
                        </h3>
                        <div class="col" style="margin-top: 8px">
                          <q-select
                            v-model="loanSessionType"
                            filled
                            dense
                            :options="allLoanSessionTypes"
                            label="Select Transaction Details"
                            icon="assignment"
                            input-debounce="0"
                            :options-dense="true"
                          >
                            <template v-slot:prepend>
                              <q-icon name="assignment" />
                            </template>
                          </q-select>
                        </div>
                        <div v-if="loanSessionType && loanSessionType.value === 'other'" class="col" style="margin-top: 8px">
                          <q-input
                            v-model="otherLoanSessionType"
                            dense
                            filled
                            type="text"
                            label="Other Transaction Type"
                          >
                            <template v-slot:prepend>
                              <q-icon name="info" />
                            </template>
                          </q-input>
                          <q-input
                            v-model="otherLoanSessionType"
                            class="col-12 col-md-9"
                            filled
                            hint="Loan Number"
                            :dense="dense"
                          />
                        </div>
                      </div>
                    </div>
                    <div v-if="sessionType && sessionType.value === 'loan_signing'" class="">
                      <div class="full-width q-pb-md">
                        <h3>
                          Property Address
                        </h3>
                        <div class="row q-gutter-sm q-mt-sm">
                          <q-input
                            v-model="loan_signing_addressLine1"
                            class="col-12 col-md-9"
                            filled
                            hint="Address Line 1"
                            dense
                          />
                          <q-input
                            v-model="loan_signing_addressLine2"
                            class="col-md-4 col-12"
                            filled
                            hint="Address Line 2"
                            dense
                          />
                          <q-select
                            v-model="loan_signing_userState"
                            :options="states"
                            class="col-md-3 col-4"
                            filled
                            hint="State"
                            dense
                          />
                          <q-input
                            v-model="loan_signing_userZipCode"
                            class="col-md-2 col-6"
                            filled
                            hint="Zip Code"
                            dense
                          />
                        </div>
                      </div>
                      <div class="q-py-sm">
                        <h3>
                          Instructions & Notes
                        </h3>
                        <p><small>Please add any special instructions or notes you require for the notary during the closing.</small> </p>
                        <div class="q-gutter-sm q-mt-sm">
                          <div style="max-width: 500px;">
                            <q-input
                              v-model="loan_signing_notes_for_notary"
                              filled
                              type="textarea"
                              label="Add notes here"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="sessionType && sessionType.value === 'loan_signing'" class="q-py-xl">
                    <h1>
                      Agents & Liasons
                    </h1>
                    <small>Agents & Liasons are any folks with relevant information for the signing that may need to be on the closing call (i.e. Mortgage broker, loan officer, title agent, or realtor).</small>
                    <div class="">
                      <div v-for="pointOfContact in pointOfContacts" :key="pointOfContact.id">
                        <div class="row q-gutter-sm q-mt-sm">
                          <q-select
                            v-model="pointOfContact.role"
                            class="col-md-6 col-12"
                            filled
                            :options="allPointOfContactRoles"
                            label="Contact Role"
                            icon="group_add"
                            input-debounce="0"
                            :options-dense="true"
                          >
                            <template v-slot:prepend>
                              <q-icon name="group_add" />
                            </template>
                          </q-select>
                          <q-input
                            v-if="pointOfContact.role && pointOfContact.role.value === 'other'"
                            v-model="pointOfContact.role_other"
                            class="col-md-4 col-12"
                            filled
                            hont="Other Contact Role"
                            dense
                          />
                        </div>
                        <div class="row q-gutter-sm q-mt-sm">
                          <q-input
                            v-model="pointOfContact.firstname"
                            class="col-md-5 col-12"
                            filled
                            hint="First Name"
                            dense
                          />
                          <q-input
                            v-model="pointOfContact.lastname"
                            class="col-md-5 col-12"
                            filled
                            hint="Last Name"
                            dense
                          />
                        </div>
                        <div class="row q-gutter-sm q-mt-sm">
                          <q-input
                            v-model="pointOfContact.email"
                            class="col-md-5 col-12"
                            filled
                            hint="Email"
                            dense
                          />
                          <q-input
                            v-model="pointOfContact.phone"
                            class="col-md-5 col-12"
                            filled
                            hint="Phone"
                            fill-mask
                            mask="(###) ### - ####"
                            dense
                          />
                        </div>
                      </div>
                      <q-btn icon="add" outline class="q-mt-lg" round @click="addMorePointOfContact" />
                    </div>
                  </div>
                  <div v-if="$user.role === 'customer' && ($user.memberType === 'title_hybrid' || $user.memberType === 'business_pro' || $user.memberType === 'business_hybrid' || $user.memberType === 'signing_service')">
                    <div class="" style="padding-top: 12px">
                      <h1 class="no-margin"><strong>Notary For Session</strong></h1>
                      <div class="row doc-list-preview">
                        <div class="">
                          <q-radio v-model="typeOfNotaryForSession" val="choose_notary" label="My Team Notary" />
                          <q-radio v-if="!$user.inviteSignerDisableOpenCall && ($user.memberType === 'title_hybrid' || $user.memberType === 'signing_service' || $user.memberType === 'business_pro' || $user.memberType === 'business_hybrid')" v-model="typeOfNotaryForSession" val="open_call" label="On Demand Certified Notary" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="$user.role === 'customer' && ($user.memberType === 'business' || $user.memberType === 'business_pro' || $user.memberType === 'business_hybrid' || $user.memberType === 'title_hybrid' || $user.memberType === 'signing_service') && typeOfNotaryForSession === 'choose_notary'" class="q-py-md q-mb-lg">
                    <h3>
                      Notary Selection
                    </h3>
                    <div class="">
                      <div class="col" style="margin-top: 8px">
                        <q-select
                          v-model="selectedNotary"
                          filled
                          dense
                          :options="allSelectableNotaries"
                          label="Select Notary for the Session"
                          icon="assignment"
                          input-debounce="0"
                          :options-dense="true"
                        >
                          <template v-slot:prepend>
                            <q-icon name="person" />
                          </template>
                        </q-select>
                      </div>
                    </div>
                  </div>
                  <div v-if="!$user.skipSessionCharges && !forceSelectPaymentMethodAccepted && ($user.role !== 'customer' || $user.memberType === 'title_hybrid' || $user.memberType === 'title_pro' || $user.memberType === 'pro' || $user.memberType === 'business' || $user.memberType === 'business_basic' || $user.memberType === 'business_pro' || $user.memberType === 'business_hybrid')" class="q-py-md q-pb-xl">
                    <h1>
                      Billing Preference
                    </h1>
                    <div class="full-width">
                      <q-checkbox v-model="sessionChargeOnBusinessUser" label="Invoice the client outside of BlueNotary" :disable="!enableSessionChargeOnBusinessUser" />
                      <q-icon v-if="!enableSessionChargeOnBusinessUser" name="info" class="q-ml-sm" style="cursor: pointer;" @click="showUpgradePopup">
                        <q-tooltip>
                          Pro Hybrid plan feature
                        </q-tooltip>
                      </q-icon>
                    </div>
                    <div class="q-mx-sm"><small><u><a target="_blank" href="https://bluenotary.crisp.help/en/article/invoicing-the-client-outside-of-bluenotary-1dxa29f/">How does this work?</a></u></small></div>
                  </div>
                  <div v-if="$user.memberType !== 'business_basic' && typeOfNotaryForSession !== 'open_call'" class="q-pb-xl">
                    <h1>
                      ID Authentication Mode
                    </h1>
                    <div class="full-width">
                      <!-- <q-radio v-model="kbaMode" val="normal_kba" label="Pre-Auth Flow" /> -->
                      <q-radio v-model="kbaMode" val="in_session_kba" label="In Session Auth Flow" />
                      <q-radio v-model="kbaMode" val="skip_kba" label="Skip Auth Flow" />
                    </div>
                    <div class="q-mx-sm"><small><u><a target="_blank" href="https://bluenotary.crisp.help/en/article/choosing-when-to-require-kbaid-flow-dlwpsl/?bust=1660926404007">How does this work?</a></u></small></div>
                  </div>
                  <div v-if="kbaMode === 'in_session_kba' && !hideTypeOfIdentityAuthentication" class="q-pb-xl">
                    <h1>
                      Type of Identity Authentication for Session
                    </h1>
                    <div class="full-width">
                      <q-radio v-model="typeOfKBA" val="users_choice" label="Allow user to choose" />
                      <br />
                      <q-radio v-model="typeOfKBA" val="us_citizens" label="US Citizens + KBA" />
                      <q-radio v-model="typeOfKBA" val="foreigners_without_residential" label="US Citizens/Foreigners + Biometrics" />
                    </div>
                  </div>
                  <!-- <div v-if="!($user.role === 'customer' && $user.memberType === 'pro')">
                    <div class="full-width">
                      <q-checkbox v-model="skipCustomerKBACheck" label="Skip Signer KBA+ID" />
                    </div>
                  </div>
                  <div v-if="!skipCustomerKBACheck">
                    <div class="full-width">
                      <q-checkbox v-model="performInSessionKBA" label="Perform in Session KBA" />
                    </div>
                  </div> -->
                  <!-- <div v-if="$user.role === 'customer' && !($user.memberType === 'title_hybrid' || $user.memberType === 'signing_service') && typeOfNotaryForSession === 'open_call'">
                    <h3>
                      Specific State
                      <q-icon name="info" />
                      <q-tooltip>
                        Most signers won't need this option.
                      </q-tooltip>
                    </h3>
                    <div class="q-mx-sm">
                      <small><a href="https://bluenotary.crisp.help/en/article/state-specific-notary-selection-35h8ul/" target="_blank"><u>Do I need a State-Specific Notary? Work?</u></a></small>
                    </div>
                    <div class="full-width">
                      <q-checkbox v-model="requestForStateSpecificNotary" label="Request for State-Specific Notary" />
                    </div>
                    <div v-if="requestForStateSpecificNotary" class="col" style="margin-top: 8px">
                      <q-select
                        v-model="requestForStateSpecificNotaryStateName"
                        filled
                        dense
                        :options="statesWithManyNotaries"
                        label="Select Notary State"
                        icon="map"
                        input-debounce="0"
                        :options-dense="true"
                      >
                        <template v-slot:prepend>
                          <q-icon name="map" />
                        </template>
                      </q-select>
                    </div>
                  </div> -->
                  <div class="q-py-md">
                    <h1>
                      Meeting Date & Time
                    </h1>
                    <div class="">
                      <div class="col">
                        <q-input
                          v-model="model.meetingdate"
                          dense
                          filled
                          class="q-py-sm"
                          type="text"
                          label="Meeting Date & Time"
                          @click="notarizationDateTimeInputFieldClicked"
                        >
                          <template v-slot:prepend>
                            <q-icon name="event" />
                          </template>
                        </q-input>
                      </div>
                      <div class="col">
                        <q-select
                          v-model="meetingTimeZone"
                          filled
                          dense
                          :options="selectedTimezone"
                          label="Select Timezone"
                          use-input
                          icon="watch_later"
                          input-debounce="0"
                          :options-dense="true"
                          @filter="timezoneFilterFn"
                        >
                          <template v-slot:prepend>
                            <q-icon name="watch_later" />
                          </template>
                        </q-select>
                      </div>
                    </div>
                  </div>
                  <!-- <div v-if="$user.memberType !== 'pro'">
                    <h3 class="q-pb-sm upgradebrn" style="display:inline-block;">To use pre-tagged document templates </h3>
                    <q-btn
                        class="browse-btn"
                        label="upgrade to pro"
                        color="blue"
                        @click="showUpgradePopup"
                      />
                  </div> -->
                  <div v-if="$user.memberType === 'free'" class="ptdt">
                    <upgrade-account-popup-component :open-acc-pro-model="openUpgradePopup" />
                    <h1 class="q-mt-xl q-pb-sm">
                      Select Pre-Tagged Document Template
                    </h1>
                    <q-select
                      dense
                      filled
                      clearable
                      label="Document Template"
                      style="margin-bottom:15px"
                      @click="showUpgradePopup"
                    >
                      <template v-slot:prepend>
                        <q-icon name="description" />
                      </template>
                    </q-select>
                    <div v-if="!selectedTemplate" class="horizontalLine" style="padding-top: 15px"><span>OR</span></div>
                  </div>
                  <div v-if="$user.memberType !== 'free'" class="q-py-lg" style="padding-bottom: 0px">
                    <h1 class="q-pb-sm">
                      Select Pre-Tagged Document Template
                    </h1>
                    <q-select
                      v-model="selectedTemplate"
                      dense
                      filled
                      clearable
                      :options="templates"
                      label="Document Template"
                      style="margin-bottom:15px;"
                    />
                    <div v-if="!selectedTemplate" class="horizontalLine" style="padding-top: 15px"><span>OR</span></div>
                  </div>
                  <div v-if="!selectedTemplate" class="q-py-lg">
                    <h1 class="">
                      Upload Document or Image File
                    </h1>
                    <div class="q-py-md">
                      <small>Upload the PDF document / image files (Max 25MB) here if you have already received it from the client. Otherwise, leave this blank.</small>
                    </div>
                    <div class="q-py-md">
                      <q-btn
                        class="browse-btn q-pa-sm full-width"
                        label="Upload Client Documents"
                        outline
                        @click="$refs.fileinputDocument.$el.click()"
                      />
                      <div v-if="$refs.fileinputDocument !== undefined && $refs.fileinputDocument.selectedString" class="q-pa-lg">
                        <div v-for="localDocument,localDocumentIndex in notaryDocuments" :key="localDocument.name">
                          <q-icon name="check_circle" color="green" style="font-size:2rem;padding:10px;" />
                          <u>{{ localDocument.name }}</u>
                          <q-btn flat icon="edit" @click.stop.prevent="editDocument(localDocument, localDocumentIndex)" />
                          <q-btn flat icon="clear" @click.stop.prevent="removeDocument(localDocument)" />
                        </div>
                      </div>
                      <q-file
                        v-show="false"
                        ref="fileinputDocument"
                        v-model="notaryDocument"
                        standout
                        multiple
                        max-file-size="25000000"
                        color="primary"
                        label="Add a document"
                        accept=".pdf,.jpg,.jpeg,.png"
                        @rejected="onRejected"
                      />
                    </div>
                  </div>
                  <q-btn
                    size="md"
                    color="blue"
                    class="text-white full-width"
                    type="button"
                    label="Send Invite"
                    :loading="isSubmitting"
                    :disable="isSubmitting"
                    @click="sendInviteToSigner"
                  />
                </q-form>
              </q-card-section>
            </q-card>
            <q-form v-else>
              <div class="">
                <q-stepper
                  v-model="step"
                  vertical
                  header-nav
                  color="primary"
                  animated
                >
                  <q-step
                    :name="1"
                    title="Transaction Details"
                    icon="settings"
                    :header-nav="steppersPassed[1]"
                    :done="step > 1"
                    :error="steppersFailed[1]"
                  >
                    <div class="q-py-md">
                      <h3>
                        Transaction Type
                      </h3>
                      <div class="col" style="margin-top: 8px">
                        <q-select
                          v-model="loanSessionType"
                          filled
                          dense
                          :options="allLoanSessionTypes"
                          label="Select Transaction Details"
                          icon="assignment"
                          input-debounce="0"
                          :options-dense="true"
                        >
                          <template v-slot:prepend>
                            <q-icon name="assignment" />
                          </template>
                        </q-select>
                      </div>
                      <div v-if="loanSessionType && loanSessionType.value === 'other'" class="col" style="margin-top: 8px">
                        <q-input
                          v-model="otherLoanSessionType"
                          dense
                          filled
                          type="text"
                          label="Other Transaction Type"
                        >
                          <template v-slot:prepend>
                            <q-icon name="info" />
                          </template>
                        </q-input>
                      </div>
                      <q-input
                        v-model="loanNumber"
                        style="margin-top: 8px"
                        class="col-12 col-md-9"
                        filled
                        label="Loan Number"
                        dense
                      >
                        <template v-slot:prepend>
                          <q-icon name="confirmation_number" />
                        </template>
                      </q-input>
                    </div>
                    <div class="full-width q-pb-md">
                      <h3>
                        Property Address
                      </h3>
                      <div class="row q-gutter-sm q-mt-sm">
                        <q-input
                          v-model="loan_signing_addressLine1"
                          class="col-12 col-md-9"
                          filled
                          hint="Address Line 1"
                          dense
                        />
                        <q-input
                          v-model="loan_signing_addressLine2"
                          class="col-md-4 col-12"
                          filled
                          hint="Address Line 2"
                          dense
                        />
                        <q-select
                          v-model="loan_signing_userState"
                          :options="states"
                          class="col-md-3 col-4"
                          filled
                          hint="State"
                          dense
                        />
                        <q-input
                          v-model="loan_signing_userZipCode"
                          class="col-md-2 col-6"
                          filled
                          hint="Zip Code"
                          dense
                        />
                      </div>
                    </div>
                    <div class="q-py-sm">
                      <h3>
                        Instructions & Notes
                      </h3>
                      <p><small>Please add any special instructions or notes you require for the notary during the closing.</small> </p>
                      <div class="q-gutter-sm q-mt-sm">
                        <div style="max-width: 500px;">
                          <q-input
                            v-model="loan_signing_notes_for_notary"
                            filled
                            type="textarea"
                            label="Add notes here"
                          />
                        </div>
                      </div>
                    </div>
                    <q-stepper-navigation>
                      <q-btn color="primary" label="Continue" @click="changeStepClicked(2)" />
                    </q-stepper-navigation>
                  </q-step>

                  <q-step
                    :name="2"
                    title="Signer Details"
                    icon="person"
                    :done="step > 2"
                    :header-nav="steppersPassed[2]"
                    :error="steppersFailed[2]"
                  >
                    <q-input
                      v-model="$v.model.signerName.$model"
                      dense
                      filled
                      type="text"
                      label="Signer Name"
                      :error-message="errorMessage($v.model.signerName, 'Name')"
                      :error="!!errorMessage($v.model.signerName)"
                    >
                      <template v-slot:prepend>
                        <q-icon name="account_box" />
                      </template>
                    </q-input>
                    <q-input
                      v-model="$v.model.signerEmail.$model"
                      dense
                      filled
                      type="email"
                      label="Signer Email"
                      :error-message="errorMessage($v.model.signerEmail, 'Email')"
                      :error="!!errorMessage($v.model.signerEmail)"
                    >
                      <template v-slot:prepend>
                        <q-icon name="email" />
                      </template>
                    </q-input>
                    <div>
                      <div class="full-width">
                        <q-checkbox v-model="multiSignerFlag" label="Add Multiple Signers to this Session" :disable="!enableAdditionalSigners" />
                        <q-icon v-if="!enableAdditionalSigners" name="info" class="q-ml-sm" style="cursor: pointer;" @click="showUpgradePopup">
                          <q-tooltip>
                            Pro Hybrid plan feature
                          </q-tooltip>
                        </q-icon>
                      </div>
                      <div class="q-mx-sm">
                        <small><a href="https://bluenotary.crisp.help/en/article/how-does-multi-signer-session-work-from-notary-view-1d1qwhj/" target="_blank"><u>How does multi-signer session work?</u></a></small>
                      </div>
                    </div>
                    <div class="col-12">
                      <div v-if="multiSignerFlag" class="flex column no-margin">
                        <div v-for="signerItem in multiSignerList" :key="signerItem.id" class="row" style="margin-top: 8px;">
                          <div class="col-6">
                            <q-input v-model="signerItem.email" dense filled label="Secondary Signer Email" type="email" />
                          </div>
                          <div class="col-2">
                            <q-btn flat outline color="primary" icon="clear" style="font-size: 17px" @click="removeSignerEmail(signerItem.id)" />
                          </div>
                        </div>
                        <q-btn icon="add" outline class="q-mt-sm" round @click="addMoreSignerButton" />
                      </div>
                    </div>
                    <div style="padding-top: 48px">
                      <h1>
                        Add Witness
                      </h1>
                      <div class="">
                        <div class="col" style="margin-top: 8px">
                          <q-btn outline label="Click here to add more witness" @click="addWitnessClicked" />
                        </div>
                        <div v-if="addWitnessDataPacket" style="margin-top: 12px">
                          Witness added for this session
                          <q-btn flat round color="red" icon="delete" @click="deleteWitnessFromSession">
                            <q-tooltip>Click here to delete witness</q-tooltip>
                          </q-btn>
                        </div>
                      </div>
                    </div>
                    <q-stepper-navigation>
                      <q-btn color="primary" label="Continue" @click="changeStepClicked(3)" />
                      <q-btn flat color="primary" label="Back" class="q-ml-sm" @click="step = 1" />
                    </q-stepper-navigation>
                  </q-step>

                  <q-step
                    :name="3"
                    title="Agents & Liasons"
                    icon="group_add"
                    :done="step > 3"
                    :header-nav="steppersPassed[3]"
                    :error="steppersFailed[3]"
                  >
                    <small>Agents & Liasons are any folks with relevant information for the signing that may need to be on the closing call (i.e. Mortgage broker, loan officer, title agent, or realtor).</small>
                    <div v-for="pointOfContact in pointOfContacts" :key="pointOfContact.id">
                      <div class="row q-gutter-sm q-mt-sm">
                        <q-select
                          v-model="pointOfContact.role"
                          class="col-md-6 col-12"
                          filled
                          :options="allPointOfContactRoles"
                          label="Contact Role"
                          icon="assignment"
                          input-debounce="0"
                          :options-dense="true"
                        >
                          <template v-slot:prepend>
                            <q-icon name="assignment" />
                          </template>
                        </q-select>
                        <q-input
                          v-if="pointOfContact.role && pointOfContact.role.value === 'other'"
                          v-model="pointOfContact.role_other"
                          class="col-md-4 col-12"
                          filled
                          hont="Other Contact Role"
                          dense
                          hint="Other Role"
                        />
                        <template v-else>
                          <div class="col-md-4 col-12" />
                          <div class="col-md-1 col-12">
                            <q-btn flat round color="red" icon="delete" @click="deletePointOfContact(pointOfContact.id)" />
                          </div>
                        </template>
                      </div>
                      <div class="row q-gutter-sm q-mt-sm">
                        <q-input
                          v-model="pointOfContact.firstname"
                          class="col-md-5 col-12"
                          filled
                          hint="First Name"
                          dense
                        />
                        <q-input
                          v-model="pointOfContact.lastname"
                          class="col-md-5 col-12"
                          filled
                          hint="Last Name"
                          dense
                        />
                      </div>
                      <div class="row q-gutter-sm q-mt-sm">
                        <q-input
                          v-model="pointOfContact.email"
                          class="col-md-5 col-12"
                          filled
                          hint="Email"
                          dense
                        />
                        <q-input
                          v-model="pointOfContact.phone"
                          class="col-md-5 col-12"
                          filled
                          hint="Phone"
                          fill-mask
                          mask="(###) ### - ####"
                          dense
                        />
                      </div>
                      <hr />
                    </div>
                    <q-btn icon="add" outline class="q-mt-lg" style="display: block" round @click="addMorePointOfContact" />
                    <q-stepper-navigation>
                      <q-btn color="primary" label="Continue" @click="changeStepClicked(4)" />
                      <q-btn flat color="primary" label="Back" class="q-ml-sm" @click="step = 2" />
                    </q-stepper-navigation>
                  </q-step>

                  <q-step
                    :name="4"
                    title="Other Session Details"
                    icon="info_outline"
                    :done="step > 3"
                    :header-nav="steppersPassed[4]"
                    :error="steppersFailed[4]"
                  >
                    <div v-if="$user.role === 'customer' && ($user.memberType === 'title_hybrid' || $user.memberType === 'signing_service' || $user.memberType === 'business_pro' || $user.memberType === 'business_hybrid')">
                      <div class="" style="padding-top: 12px">
                        <h1 class="no-margin"><strong>Notary For Session</strong></h1>
                        <div class="row doc-list-preview">
                          <div class="">
                            <q-radio v-model="typeOfNotaryForSession" val="choose_notary" label="My Team Notary" />
                            <q-radio v-if="!$user.inviteSignerDisableOpenCall && ($user.memberType === 'title_hybrid' || $user.memberType === 'signing_service' || $user.memberType === 'business_pro' || $user.memberType === 'business_hybrid')" v-model="typeOfNotaryForSession" val="open_call" label="On Demand Certified Notary" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-if="$user.role === 'customer' && ($user.memberType === 'business' || $user.memberType === 'business_pro' || $user.memberType === 'business_hybrid' || $user.memberType === 'title_hybrid' || $user.memberType === 'signing_service') && typeOfNotaryForSession === 'choose_notary'" class="q-py-md q-mb-lg">
                      <h3>
                        Notary Selection
                      </h3>
                      <div class="">
                        <div class="col" style="margin-top: 8px">
                          <q-select
                            v-model="selectedNotary"
                            filled
                            dense
                            :options="allSelectableNotaries"
                            label="Select Notary for the Session"
                            icon="assignment"
                            input-debounce="0"
                            :options-dense="true"
                          >
                            <template v-slot:prepend>
                              <q-icon name="person" />
                            </template>
                          </q-select>
                        </div>
                      </div>
                    </div>
                    <div v-if="!$user.skipSessionCharges && ($user.role !== 'customer' || $user.memberType === 'signing_service' || $user.memberType === 'title_hybrid' || $user.memberType === 'title_pro' || $user.memberType === 'pro' || $user.memberType === 'business' || $user.memberType === 'business_basic' || $user.memberType === 'business_pro' || $user.memberType === 'business_hybrid' )" class="q-py-md q-pb-xl">
                      <h1>
                        Billing Preference
                      </h1>
                      <div class="full-width">
                        <q-checkbox v-model="sessionChargeOnBusinessUser" label="Invoice the client outside of BlueNotary" :disable="!enableSessionChargeOnBusinessUser" />
                        <q-icon v-if="!enableSessionChargeOnBusinessUser" name="info" class="q-ml-sm" style="cursor: pointer;" @click="showUpgradePopup">
                          <q-tooltip>
                            Pro Hybrid plan feature
                          </q-tooltip>
                        </q-icon>
                      </div>
                      <div class="q-mx-sm"><small><u><a target="_blank" href="https://bluenotary.crisp.help/en/article/invoicing-the-client-outside-of-bluenotary-1dxa29f/">How does this work?</a></u></small></div>
                    </div>
                    <div v-if="$user.memberType !== 'business_basic' && typeOfNotaryForSession !== 'open_call'" class="q-pb-xl">
                      <h1>
                        ID Authentication Mode
                      </h1>
                      <div class="full-width">
                        <!-- <q-radio v-model="kbaMode" val="normal_kba" label="Pre-Auth Flow" /> -->
                        <q-radio v-model="kbaMode" val="in_session_kba" label="In Session Auth Flow" />
                        <q-radio v-model="kbaMode" val="skip_kba" label="Skip Auth Flow" />
                      </div>
                      <div class="q-mx-sm"><small><u><a target="_blank" href="https://bluenotary.crisp.help/en/article/choosing-when-to-require-kbaid-flow-dlwpsl/?bust=1660926404007">How does this work?</a></u></small></div>
                    </div>
                    <div v-if="kbaMode === 'in_session_kba' && !hideTypeOfIdentityAuthentication" class="q-pb-xl">
                      <h1>
                        Type of Identity Authentication for Session
                      </h1>
                      <div class="full-width">
                        <q-radio v-model="typeOfKBA" val="users_choice" label="Allow user to choose" />
                        <br />
                        <q-radio v-model="typeOfKBA" val="us_citizens" label="US Citizens + KBA" />
                        <q-radio v-model="typeOfKBA" val="foreigners_without_residential" label="US Citizens/Foreigners + Biometrics" />
                      </div>
                    </div>
                    <!-- <div v-if="$user.role === 'customer' && !(($user.memberType === 'title_hybrid' || $user.memberType === 'signing_service') && typeOfNotaryForSession !== 'open_call')">
                      <h3>
                        Specific State
                        <q-icon name="info" />
                        <q-tooltip>
                          Most signers won't need this option.
                        </q-tooltip>
                      </h3>
                      <div class="q-mx-sm">
                        <small><a href="https://bluenotary.crisp.help/en/article/state-specific-notary-selection-35h8ul/" target="_blank"><u>Do I need a State-Specific Notary? Work?</u></a></small>
                      </div>
                      <div class="full-width">
                        <q-checkbox v-model="requestForStateSpecificNotary" label="Request for State-Specific Notary" />
                      </div>
                      <div v-if="requestForStateSpecificNotary" class="col" style="margin-top: 8px">
                        <q-select
                          v-model="requestForStateSpecificNotaryStateName"
                          filled
                          dense
                          :options="statesWithManyNotaries"
                          label="Select Notary State"
                          icon="map"
                          input-debounce="0"
                          :options-dense="true"
                        >
                          <template v-slot:prepend>
                            <q-icon name="map" />
                          </template>
                        </q-select>
                      </div>
                    </div> -->
                    <div class="q-py-md">
                      <h1>
                        Meeting Date & Time
                      </h1>
                      <div class="">
                        <div class="col">
                          <q-input
                            v-model="model.meetingdate"
                            dense
                            filled
                            class="q-py-sm"
                            type="text"
                            label="Meeting Date & Time"
                            @click="notarizationDateTimeInputFieldClicked"
                          >
                            <template v-slot:prepend>
                              <q-icon name="event" />
                            </template>
                          </q-input>
                        </div>
                        <div class="col">
                          <q-select
                            v-model="meetingTimeZone"
                            filled
                            dense
                            :options="selectedTimezone"
                            label="Select Timezone"
                            use-input
                            icon="watch_later"
                            input-debounce="0"
                            :options-dense="true"
                            @filter="timezoneFilterFn"
                          >
                            <template v-slot:prepend>
                              <q-icon name="watch_later" />
                            </template>
                          </q-select>
                        </div>
                      </div>
                    </div>
                    <q-stepper-navigation>
                      <q-btn color="primary" label="Continue" @click="changeStepClicked(5)" />
                      <q-btn flat color="primary" label="Back" class="q-ml-sm" @click="step = 3" />
                    </q-stepper-navigation>
                  </q-step>

                  <q-step
                    :name="5"
                    title="Transaction Document"
                    icon="description"
                    :done="step > 4"
                    :header-nav="steppersPassed[5]"
                    :error="steppersFailed[5]"
                  >
                    <div v-if="$user.memberType === 'free'" class="ptdt">
                      <upgrade-account-popup-component :open-acc-pro-model="openUpgradePopup" />
                      <h1 class="q-mt-xl q-pb-sm">
                        Select Pre-Tagged Document Template
                      </h1>
                      <q-select
                        dense
                        filled
                        clearable
                        label="Document Template"
                        style="margin-bottom:15px"
                        @click="showUpgradePopup"
                      >
                        <template v-slot:prepend>
                          <q-icon name="description" />
                        </template>
                      </q-select>
                      <div v-if="!selectedTemplate" class="horizontalLine" style="padding-top: 15px"><span>OR</span></div>
                    </div>
                    <div v-if="$user.memberType !== 'free'" class="q-py-lg" style="padding-bottom: 0px">
                      <h1 class="q-pb-sm">
                        Select Pre-Tagged Document Template
                      </h1>
                      <q-select
                        v-model="selectedTemplate"
                        dense
                        filled
                        clearable
                        :options="templates"
                        label="Document Template"
                        style="margin-bottom:15px;"
                      />
                      <div v-if="!selectedTemplate" class="horizontalLine" style="padding-top: 15px"><span>OR</span></div>
                    </div>
                    <div v-if="!selectedTemplate" class="q-py-lg">
                      <h1 class="">
                        Upload Document or Image File
                      </h1>
                      <div class="q-py-md">
                        <small>Upload the PDF document / image files (Max 25MB) here if you have already received it from the client. Otherwise, leave this blank.</small>
                      </div>
                      <div class="q-py-md">
                        <q-btn
                          class="browse-btn q-pa-sm full-width"
                          label="Upload Client Documents"
                          outline
                          @click="$refs.fileinputDocument.$el.click()"
                        />
                        <div v-if="$refs.fileinputDocument !== undefined && $refs.fileinputDocument.selectedString" class="q-pa-lg">
                          <div v-for="localDocument, localDocumentIndex in notaryDocuments" :key="localDocument.name">
                            <q-icon name="check_circle" color="green" style="font-size:2rem;padding:10px;" />
                            <u>{{ localDocument.name }}</u>
                            <q-btn flat icon="edit" @click.stop.prevent="editDocument(localDocument, localDocumentIndex)" />
                            <q-btn flat icon="clear" @click.stop.prevent="removeDocument(localDocument)" />
                          </div>
                        </div>
                        <q-file
                          v-show="false"
                          ref="fileinputDocument"
                          v-model="notaryDocument"
                          standout
                          multiple
                          max-file-size="25000000"
                          color="primary"
                          label="Add a document"
                          accept=".pdf,.jpg,.jpeg,.png"
                          @rejected="onRejected"
                        />
                      </div>
                    </div>
                    <q-stepper-navigation>
                      <q-btn
                        color="blue"
                        class="text-white"
                        type="button"
                        label="Send Invite"
                        :loading="isSubmitting"
                        :disable="isSubmitting"
                        @click="sendInviteToSigner"
                      />
                      <q-btn flat color="primary" label="Back" class="q-ml-sm" @click="step = 4" />
                    </q-stepper-navigation>
                  </q-step>
                </q-stepper>
              </div>
            </q-form>
          </div>
          <div class="col col-md-4 q-pl-xl q-pt-xl mbhide">
            <h3 class="text-center q-pb-sm">Sample Preview of Email</h3>
            <img src="https://bluenotary.us/assets/img/invite-iphone-preview.png" />
          </div>
        </div>
      </q-page>
    </q-page-container>
    <q-dialog v-model="openDateTimePickerModal">
      <q-card style="min-width: 650px">
        <q-card-section>
          <div class="text-h6">Select Notarization Date and Time</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-py-md row justify-between">
            <q-date
              v-model="model.meetingdate"
              :options="optionsFn"
              mask="YYYY-MM-DD hh:mm A"
              color="primary"
            />
            <div style="margin-left:12px">
              <q-time
                v-model="model.meetingdate"
                mask="YYYY-MM-DD hh:mm A"
                color="primary"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup outline label="OK" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Modal Payment Info -->
    <q-dialog v-model="showPaymentInfoModal" persistent>
      <q-card style="min-width: 90%; min-height: 80%">
        <q-card-section>
          <h5>
            Add Credit Card Details
            <q-btn round label="x" style="float: right" @click="closePaymentInfoModal" />
          </h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="columns is-multiline" style="margin-top: 6px">
            <payment-info :called-from-invite-signer-page="true" :payment-details-captured="paymentDetailsCaptured" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Modal Payment Info -->
    <!-- <q-dialog v-model="skipCustomerKBAModal" persistent>
      <q-card>
        <q-card-section>
          <h5>
            Skip Customer KBA
          </h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="columns is-multiline" style="margin: 8px">
            <div>If you personally know the customer, you have the option to skip the KBA flow for customer, so session can be done quickly.</div>
            <div style="margin-top: 12px;">Please give consent for Session without KBA below</div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Give Consent" color="primary" @click="kBAConsentGiven(true)" />
          <q-btn v-close-popup flat label="Cancel" color="red" @click="kBAConsentGiven(false)" />
        </q-card-actions>
      </q-card>
    </q-dialog> -->

    <!-- encryption files modal -->
    <q-dialog v-model="openEncryptionFilesModal">
      <q-card>
        <q-card-section>
          <div class="text-h6">1 or more of your PDFs is locked.</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div
            v-for="encryptionFile in encryptionFiles"
            :key="encryptionFile.name"
          >
            <u>{{ encryptionFile.name }}</u>
          </div>
          <p class="q-mt-md">
            <a
              href="https://bluenotary.crisp.help/en/article/how-to-unlock-encrypted-pdf-tzydj4/"
              target="_blank"
            >
              How to unlock your PDF for use on BlueNotary
            </a>
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup outline label="OK" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <modify-documents-component :modify-document-updates-function="modifyDocumentUpdatesFunction" :open-modify-documents-component-model="openModifyDocumentsComponentModal" :file-doc="openModifyDocumentsComponentDocumentDoc" :session-id="sessionid" />

    <add-witness-component
      called-from="invitesigner"
      :open-add-witness-modal="showAddWitnessModal"
      :close-add-witness-modal="closeAddWitnessModal"
      :add-witness-modal-save-clicked-non-pdf-session="addWitnessModalSaveClickedNonPdfSession"
    />
  </q-layout>
</template>

<script>
import { required, email } from "vuelidate/lib/validators";
import { reactive } from "@vue/composition-api";
import { $axios } from "boot/axios";
import { date } from "quasar";
import moment from "moment";
import __ from "lodash";
import $ from "jquery";
import PdfUtils from "@/mixins/PdfUtils";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";
import states from "@/data/states.json";
import statesWithManyNotaries from "@/data/statesWithManyNotaries.json";
import UpgradeAccountPopupComponent from "./upgradeAccount.vue";
import PaymentInfo from "../customer/paymentInfo.vue";
import ModifyDocumentsComponent from "../../components/ModifyDocumentsComponent.vue";
import AddWitnessComponent from "../pdfedit/AddWitnessComponent.vue";

export const emailFormatter = (value) => {
  if (!value) return value;
  return value.toLowerCase();
};

export default {
  name: "InviteSigner",
  components: {
 UpgradeAccountPopupComponent, PaymentInfo, ModifyDocumentsComponent, AddWitnessComponent
},
  mixins: [VuelidateHelperMixin, PdfUtils],
  data() {
    return {
      step: 1,
      steppersPassed: {
        1: true,
        2: false,
        3: false,
        4: false,
        5: false
      },
      steppersFailed: {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false
      },
      openUpgradePopup: false,
      notaryDocument: [],
      notaryDocuments: [],
      openDateTimePickerModal: false,
      window,
      timezoneValues: [],
      selectedTimezone: [],
      meetingTimeZone: "",
      templates: [],
      selectedTemplate: null,
      skipCustomerKBACheck: false,
      skipCustomerKBAModal: false,
      multiSignerFlag: false,
      multiSignerList: [
        {
          id: "input0",
          email: ""
        }
      ],
      enableAdditionalSigners: false,
      sessionType: {
        value: "gnw",
        label: "GNW"
      },
      allSessionTypes: [
        {
          value: "gnw",
          label: "GNW"
        }
      ],
      loanSessionType: {
        value: "HELOC",
        label: "HELOC"
      },
      allLoanSessionTypes: [
        {
          value: "HELOC",
          label: "HELOC"
        },
        {
          value: "refinance",
          label: "Refinance"
        },
        {
          value: "seller",
          label: "Seller"
        },
        {
          value: "cash",
          label: "Cash"
        },
        {
          value: "borrower",
          label: "Borrower"
        },
        {
          value: "other",
          label: "Other"
        },
      ],
      allPointOfContactRoles: [
        {
          value: "loan_officer",
          label: "Loan Officer"
        },
        {
          value: "real_estate_agent",
          label: "Real Estate Agent"
        },
        {
          value: "loan_processor",
          label: "Loan Processor"
        },
        {
          value: "mortgage_broker",
          label: "Mortgage Broker"
        },
        {
          value: "title_agent",
          label: "Title Agent"
        },
        {
          value: "other",
          label: "Other"
        }
      ],
      lastPOCIndex: 0,
      pointOfContacts: [
        {
          id: 0,
          role: {
            value: "loan_officer",
            label: "Loan Officer"
          },
          role_other: "",
          firstname: "",
          lastname: "",
          email: "",
          phone: ""
        }
      ],
      otherLoanSessionType: "",
      loanNumber: "",
      allSelectableNotaries: [],
      selectedNotary: "",
      loanSigningPermitted: false,
      sessionChargeOnBusinessUser: false,
      hidePaymentModalAfterAutoSet: false,
      enableSessionChargeOnBusinessUser: false,
      showPaymentInfoModal: false,
      stripeIdentityDetails: false,
      encryptionFiles: [],
      openEncryptionFilesModal: false,
      typeOfNotaryForSession: "choose_notary",
      requestForStateSpecificNotary: false,
      requestForStateSpecificNotaryStateName: "",
      loan_signing_addressLine1: "",
      loan_signing_addressLine2: "",
      loan_signing_userState: "",
      loan_signing_userZipCode: "",
      loan_signing_state_specific_notary: "no",
      loan_signing_notes_for_notary: "",
      states,
      statesWithManyNotaries,
      kbaMode: "in_session_kba",
      typeOfKBA: "users_choice",
      sessionid: false,
      openModifyDocumentsComponentModal: false,
      openModifyDocumentsComponentDocumentDoc: false,
      openModifyDocumentsIndex: 0,
      showAddWitnessModal: false,
      addWitnessDataPacket: false,
      hideTypeOfIdentityAuthentication: false,
      forceSelectPaymentMethodAccepted: false
    };
  },

  watch: {
    selectedNotary: {
      handler() {
        this.recalculateTypeOfAuthenticationChecks();
      }
    },
    typeOfNotaryForSession: {
      handler() {
        this.recalculateTypeOfAuthenticationChecks();
      }
    },
    notaryDocument: {
      handler(value) {
        if (value.length > 0) {
          // eslint-disable-next-line no-plusplus
          for (let i = 0; i < value.length; i++) {
            const reader = new FileReader();
            reader.readAsArrayBuffer(value[i]);
            reader.onload = () => {
              const files = new Blob([reader.result], { type: "application/pdf" });
              files.text().then(async (x) => {
                // const fileIsEncrypted = x.substring(x.lastIndexOf("<<"), x.lastIndexOf(">>")).includes("/Encrypt");
                const fileIsEncrypted = x.includes("Encrypt");
                if (!fileIsEncrypted) {
                  this.notaryDocuments.push(value[i]);
                } else {
                  this.encryptionFiles.push(value[i]);
                }
                if (this.encryptionFiles.length > 0) {
                  this.openEncryptionFilesModal = true;
                }
              });
            };
            // if (this.$user.memberType === "pro") {
            //   const reader = new FileReader();
            //   reader.readAsArrayBuffer(value[i]);
            //   reader.onload = () => {
            //     const files = new Blob([reader.result], { type: "application/pdf" });
            //     files.text().then(async (x) => {
            //       const fileIsEncrypted = x.substring(x.lastIndexOf("<<"), x.lastIndexOf(">>")).includes("/Encrypt");
            //       if (!fileIsEncrypted) {
            //         this.notaryDocuments.push(value[i]);
            //       } else {
            //         this.encryptionFiles.push(value[i]);
            //       }
            //       if (this.encryptionFiles.length > 0) {
            //         this.openEncryptionFilesModal = true;
            //       }
            //     });
            //   };
            // } else {
            //   const reader = new FileReader();
            //   reader.readAsArrayBuffer(value[i]);
            //   reader.onload = () => {
            //     const files = new Blob([reader.result], { type: "application/pdf" });
            //     files.text().then(async (x) => {
            //       const fileIsEncrypted = x.substring(x.lastIndexOf("<<"), x.lastIndexOf(">>")).includes("/Encrypt");
            //       if (!fileIsEncrypted) {
            //         this.notaryDocuments = [value[i]];
            //       } else {
            //         this.encryptionFiles.push(value[i]);
            //       }
            //       if (this.encryptionFiles.length > 0) {
            //         this.openEncryptionFilesModal = true;
            //       }
            //     });
            //   };
            // }
          }
        }
      }
    },
    sessionType: {
      handler(value) {
        if (value && value.value === "loan_signing" && !this.loanSigningPermitted) {
          this.sessionType = this.allSessionTypes[0];
          this.showUpgradePopup();
        }
      }
    },
    sessionChargeOnBusinessUser: {
      handler(value) {
        if (this.hidePaymentModalAfterAutoSet) {
          this.showPaymentInfoModal = false;
          return;
        }
        if (value) {
          if (!((this.$user.role === "customer" && (this.$user.memberType === "business" || this.$user.memberType === "business_basic" || this.$user.memberType === "business_pro" || this.$user.memberType === "business_hybrid" || this.$user.memberType === "title_pro" || this.$user.memberType === "title_hybrid" || this.$user.memberType === "signing_service" || this.$user.memberType === "pro")) || (this.$user.role === "notary" && this.$user.memberType === "pro"))) {
            this.sessionChargeOnBusinessUser = false;
            this.showUpgradePopup();
          } else {
            this.showPaymentInfoModal = true;
          }
        } else {
          this.showPaymentInfoModal = false;
        }
      }
    },
    skipCustomerKBACheck: {
      handler(value) {
        if (value) {
          this.skipCustomerKBAModal = true;
        }
      }
    }
  },
  async mounted() {
    if (this.$user.memberType !== "free") {
      await this.loadTemplates();
      this.enableAdditionalSigners = true;
    }
    if (this.$user.memberType !== "free") {
      this.enableSessionChargeOnBusinessUser = true;
    }
    let showLoanSigningOption = false;
    if (this.$user.role === "notary") {
      showLoanSigningOption = true;
      if (this.$user.memberType !== "free") {
        this.loanSigningPermitted = true;
      }
    } else if (this.$user.role === "customer") {
      if (this.$user.memberType === "title_pro" || this.$user.memberType === "title_hybrid") {
        this.loanSigningPermitted = true;
        showLoanSigningOption = true;
        this.allSessionTypes = [];
      }
      if (this.$user.memberType === "signing_service") {
        this.loanSigningPermitted = true;
        showLoanSigningOption = true;
      }
    }
    if (showLoanSigningOption) {
      if (!this.allSessionTypes.length) {
        this.sessionType = {
          value: "loan_signing",
          label: "Loan Signing"
        };
      }
      this.allSessionTypes.push({
        value: "loan_signing",
        label: "Loan Signing"
      });
    }
    if (this.$user.role === "customer" && (this.$user.memberType === "business" || this.$user.memberType === "business_pro" || this.$user.memberType === "business_hybrid" || this.$user.memberType === "title_pro" || this.$user.memberType === "title_hybrid" || this.$user.memberType === "signing_service")) {
      this.fetchAllSelectableNotaries();
    }
    this.timezoneValues = window.allTimeZones;
    const allowedTimezones = ["(GMT-10:00) Hawaii", "(GMT-08:00) Pacific", "(GMT-07:00) Mountain", "(GMT-06:00) Central", "(GMT-05:00) Eastern"];
    this.selectedTimezone = this.timezoneValues.filter((timezone) => allowedTimezones.indexOf(timezone.label) >= 0);
    console.log(this.selectedTimezone);
    const timezone = String(((new Date().getTimezoneOffset()) / 60) * -1);
    __.map(this.selectedTimezone, (tempValue) => {
      if (tempValue.value === timezone) {
        this.meetingTimeZone = tempValue;
      }
    });
    if (this.$user.selectedPaymentMethod || this.$user?.notaryInvitedByBusinessUserDoc?.selectedPaymentMethod) {
      const url = "session/getPaymentMethods";
      const tempDataToSend = {
        notaryInvitedByBusinessUserPaymentMethod: false
      };
      if (this.$user?.notaryInvitedByBusinessUserDoc?.selectedPaymentMethod) {
        tempDataToSend.notaryInvitedByBusinessUserPaymentMethod = true;
      }
      const response = await $axios.post(url, tempDataToSend);
      const { data } = response;
      console.log("data", data);
      let paymentMethodFound = false;
      __.map(data?.paymentMethods, (tempPaymentMethod) => {
        if (tempPaymentMethod.id === this.$user.selectedPaymentMethod) {
          paymentMethodFound = tempPaymentMethod;
        }
        if (this.$user?.notaryInvitedByBusinessUserDoc?.selectedPaymentMethod && tempPaymentMethod.id === this.$user?.notaryInvitedByBusinessUserDoc?.selectedPaymentMethod) {
          paymentMethodFound = tempPaymentMethod;
        }
      });
      if (paymentMethodFound) {
        console.log("paymentMethodFound", paymentMethodFound);
        this.hidePaymentModalAfterAutoSet = true;
        setTimeout(() => {
          this.hidePaymentModalAfterAutoSet = false;
        }, 2000);
        this.sessionChargeOnBusinessUser = true;
        this.paymentDetailsCaptured(false, paymentMethodFound, paymentMethodFound.id);
        if (this.$user.forceSelectPaymentMethod) {
          this.forceSelectPaymentMethodAccepted = true;
        }
      }
    }
    $(document).on("click", ".ptdt", () => {
      this.showUpgradePopup();
    });
    if (this.$user.testingacc) {
      if (window.location && window.location.host === "localhost:8080") {
        this.model.signerEmail = "rohit@mailinator.com";
      } else {
        this.model.signerEmail = "rohcustomer@mailinator.com";
      }
      this.model.signerName = "Roh Customer";
      this.model.meetingdate = moment().add(90, "minutes").format("YYYY-MM-DD hh:mm A");
      this.meetingTimeZone = {
        label: "(GMT-05:00) Eastern",
        value: "-5"
      };
    }
  },
  setup() {
    const model = reactive({
      signerName: "",
      signerEmail: "",
      meetingdate: "",
      notaryDocument: "",
    });
    return {
      model,
      isSubmitting: false,
      optionsFn (selectedDate) {
        return selectedDate >= date.formatDate(Date.now(), "YYYY/MM/DD");
      },
    };
  },
  validations: {
    model: {
      signerName: {
        required,
      },
      signerEmail: {
        required,
        email: (val) => email(emailFormatter(val)),
      },
      meetingdate: {
      },
    },
  },
  methods: {
    recalculateTypeOfAuthenticationChecks() {
      console.log(this.selectedNotary);
      let showTypeOfAuthenticationchecks = true;
      if (this.typeOfNotaryForSession === "choose_notary" && this.selectedNotary?.state && !["Florida", "Virginia", "Pennsylvania", "Montana", "Louisiana", "Wyoming", "New Jersey"].includes(this.selectedNotary?.state)) {
        showTypeOfAuthenticationchecks = false;
      }
      if (!showTypeOfAuthenticationchecks) {
        this.hideTypeOfIdentityAuthentication = true;
      } else {
        this.hideTypeOfIdentityAuthentication = false;
      }
    },
    notarizationDateTimeInputFieldClicked() {
      this.openDateTimePickerModal = true;
    },
    showUpgradePopup() {
      this.openUpgradePopup = false;
      setTimeout(() => {
        this.openUpgradePopup = true;
      }, 200);
    },
    async loadTemplates() {
      const url = "notary/templateOptions";
      const dataToSend = {
        notary_user_id: this.$user._id,
      };
      const response = await $axios.post(url, dataToSend, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const templateDatas = response.data;
      this.templates = __.map(templateDatas, (tempDoc) => {
        tempDoc.label = tempDoc.name;
        tempDoc.value = tempDoc._id;
        return tempDoc;
      });
    },
    async sendInviteToSigner() {
      let paymentConfirmationMessage = "This notarization session will be charged to customer. Note : If you want to pay for the session yourself, you can use the 'Invoice the client outside of BlueNotary' option.";
      if (this.sessionChargeOnBusinessUser) {
        paymentConfirmationMessage = "This notarization session will be charged to you";
      }
      this.$q.dialog({
        title: "Confirm",
        message: paymentConfirmationMessage,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        this.isSubmitting = true;
        this.$v.model.$touch();
        console.log(this.$v.model);
        if (!this.$v.model.$invalid) {
          this.steppersFailed[2] = false;
          try {
            if ((this.meetingTimeZone.value === "" || this.meetingTimeZone.value === undefined) || (this.model.meetingdate === "")) {
              this.steppersFailed[4] = true;
              this.isSubmitting = false;
              this.$q.notify({
                  type: "negative",
                  message: "Please select meeting date & time and timezone"
                });
              return;
            }
            if (this.model.meetingdate && (this.meetingTimeZone.value === "" || this.meetingTimeZone.value === undefined)) {
              this.steppersFailed[4] = true;
              this.isSubmitting = false;
              this.$q.notify({
                  type: "negative",
                  message: "Please select Meeting timezone"
                });
              return;
            }
            // if (this.$user.role === "customer" && (this.$user.memberType === "business" || this.$user.memberType === "title_pro")) {
            if (this.$user.role === "customer" && (this.$user.memberType === "business" || this.$user.memberType === "business_pro" || this.$user.memberType === "business_hybrid" || this.$user.memberType === "title_hybrid" || this.$user.memberType === "signing_service")) {
              if (this.typeOfNotaryForSession === "choose_notary" && !this.selectedNotary) {
                this.steppersFailed[4] = true;
                this.isSubmitting = false;
                this.$q.notify({
                    type: "negative",
                    message: "Please select a Notary"
                  });
                return;
              }
            }
            if (this.$user.memberType === "title_hybrid" || this.$user.memberType === "signing_service") {
              if (!this.selectedNotary && this.skipCustomerKBACheck) {
                this.steppersFailed[4] = true;
                this.isSubmitting = false;
                this.$q.notify({
                  type: "negative",
                  message: "You cannot do notary open call along side skip KBA/ID check"
                });
                return;
              }
            }
            if (this.requestForStateSpecificNotary && !this.requestForStateSpecificNotaryStateName) {
              this.steppersFailed[4] = true;
              this.$q.notify({
                type: "negative",
                message: "Please select needed state, if you want to request for state specific notary"
              });
              return;
            }
            if (this.model.meetingdate && (this.meetingTimeZone.value !== "" || this.meetingTimeZone.value !== undefined)) {
              const currentTimeZoneOffset = parseFloat(String((new Date()).getTimezoneOffset() / 60)) * -1;
              const currentMeetingTimeZone = parseFloat(this.meetingTimeZone.value);
              const finalOffset = (currentMeetingTimeZone - currentTimeZoneOffset) * 60;
              const meetingDateTimeObj = moment(this.model.meetingdate, "YYYY-MM-DD hh:mm A").utcOffset(finalOffset, true);
              // console.log(this.model.meetingdate, this.meetingTimeZone.value, moment() - meetingDateTimeObj);
              console.log(this.model.meetingdate, this.meetingTimeZone.value, meetingDateTimeObj, moment().add(currentTimeZoneOffset * 60, "minutes") - meetingDateTimeObj);
              // if (moment().add(currentTimeZoneOffset * 60, "minutes") - meetingDateTimeObj > -3600000) {
              if (moment().add(currentTimeZoneOffset * 60, "minutes") - meetingDateTimeObj > 0) {
                this.steppersFailed[4] = true;
                this.isSubmitting = false;
                this.$q.notify({
                  type: "negative",
                  message: "Please select meeting time of future date and time"
                });
                return;
              }
            }
            if (this.$user.memberType === "title_pro" || this.$user.memberType === "business_basic") {
              this.typeOfNotaryForSession = "open_call";
            }
            const url = "/file/invite-signer";
            const templateId = this.selectedTemplate ? this.selectedTemplate.value : null;
            const formData = new FormData();
            console.log("this.$user", this.$user);
            formData.append("notary_user_id", this.$user._id);
            formData.append("name", this.model.signerName);
            formData.append("email", this.model.signerEmail);
            formData.append("meetingdate", this.model.meetingdate);
            formData.append("meetingTimeZone", this.meetingTimeZone.value);
            formData.append("currentTimeZone", String((new Date()).getTimezoneOffset() / -60));
            formData.append("sessionType", this.sessionType.value);
            formData.append("typeOfNotaryForSession", this.typeOfNotaryForSession);

            if (this.multiSignerFlag) {
              // this.multiSignerList = __.filter(this.multiSignerList, "email");
              this.multiSignerList = __.compact(__.map(this.multiSignerList, (tempMultiSignerList) => {
                if (!(tempMultiSignerList && tempMultiSignerList.email)) {
                  return false;
                }
                tempMultiSignerList.email = tempMultiSignerList.email.toLowerCase();
                return tempMultiSignerList;
              }));
              formData.append("multiSignerList", JSON.stringify(this.multiSignerList));
            }
            if (this.$user.role === "customer") {
              formData.append("invitedByCustomer", true);
              formData.append("selectedNotary", this.selectedNotary && this.selectedNotary.value);
            }
            if (templateId) {
              formData.append("template", templateId);
            }
            if (this.kbaMode === "skip_kba") {
              formData.append("skipCustomerKBACheck", true);
            }
            if (this.kbaMode === "in_session_kba") {
              formData.append("performInSessionKBA", true);
            }
            if (this.typeOfKBA !== "users_choice") {
              formData.append("typeOfKBA", this.typeOfKBA);
              formData.append("forceTypeOfKBA", this.typeOfKBA);
            }
            // if (this.skipCustomerKBACheck) {
            //   formData.append("skipCustomerKBACheck", this.skipCustomerKBACheck);
            // }
            // if (this.performInSessionKBA) {
            //   formData.append("performInSessionKBA", this.performInSessionKBA);
            // }
            if (this.sessionChargeOnBusinessUser) {
              formData.append("sessionChargeOnBusinessUser", this.sessionChargeOnBusinessUser);
              formData.append("stripeIdentityDetails", JSON.stringify(this.stripeIdentityDetails));
            }
            if (this.sessionType && this.sessionType.value === "loan_signing") {
              formData.append("loanSessionType", this.loanSessionType.value);
              formData.append("otherLoanSessionType", this.otherLoanSessionType);
              let allPointofContacts = JSON.parse(JSON.stringify(this.pointOfContacts));
              allPointofContacts = __.compact(__.map(allPointofContacts, (tempPointOfContact) => {
                if (!tempPointOfContact.firstname) {
                  return false;
                }
                if (tempPointOfContact?.role?.value) {
                  tempPointOfContact.role = tempPointOfContact?.role?.value;
                }
                return tempPointOfContact;
              }));
              if (allPointofContacts.length) {
                formData.append("pointOfContacts", JSON.stringify(allPointofContacts));
              }
              if (this.loanSessionType.value === "other" && !this.otherLoanSessionType) {
                this.steppersFailed[1] = true;
                this.isSubmitting = false;
                this.$q.notify({
                    type: "negative",
                    message: "Please enter other transaction type field"
                  });
                return;
              }

              formData.append("loanNumber", this.loanNumber);
              formData.append("loan_signing_addressLine1", this.loan_signing_addressLine1);
              formData.append("loan_signing_addressLine2", this.loan_signing_addressLine2);
              formData.append("loan_signing_userState", this.loan_signing_userState);
              formData.append("loan_signing_userZipCode", this.loan_signing_userZipCode);
              formData.append("loan_signing_state_specific_notary", this.loan_signing_state_specific_notary);
              formData.append("loan_signing_notes_for_notary", this.loan_signing_notes_for_notary);
            }
            if (this.requestForStateSpecificNotary) {
              formData.append("requestForStateSpecificNotary", this.requestForStateSpecificNotary);
              formData.append("requestForStateSpecificNotaryStateName", this.requestForStateSpecificNotaryStateName);
            }

            if (this.notaryDocuments) {
              if (this.notaryDocuments.length > 0) {
                const backupFormData = new FormData();
                this.notaryDocuments.forEach((file) => {
                  const _validFileExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
                  const isFileValid = (new RegExp(`(${_validFileExtensions.join("|").replace(/\./g, "\\.")})$`)).test(file.name);
                  if (isFileValid) {
                    console.log("File has supported extension. Creating backup on server before processing it.");
                    backupFormData.append("file", file, `backup_${file.name}`);
                  } else {
                    console.log("Unsupported file extension suppressing backup.");
                  }
                });

                const fileBackupResponse = await $axios.post("/file/filesBackUp", backupFormData, {
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                });
                console.log(fileBackupResponse);

                let pageIndex = 0;
                const fileProcessPromise = new Promise((resolve) => {
                  this.notaryDocuments.forEach(async (file, index) => {
                    let pdfProcessedBlobData = null;
                    console.log(`file type for index ${index} which needs to be uploaded. Type: ${file.type}`);
                    if (file.type === "application/pdf") {
                      pdfProcessedBlobData = await this.processPDF(URL.createObjectURL(file), false);
                      console.log("PDF is processed.");
                    }
                    let files = null;
                    if (pdfProcessedBlobData) {
                      console.log("using processed pdf file.");
                      const fileToSend = new File([pdfProcessedBlobData], file.name);
                      files = fileToSend;
                    } else {
                      // continue the old way
                      console.log("continue with old logics.");
                      files = file;
                    }
                    formData.append("file", files);
                    pageIndex += 1;
                    if (pageIndex === this.notaryDocuments.length) {
                      resolve();
                    }
                  });
                });

                await fileProcessPromise;
              }
            }

            this.steppersFailed[1] = false;
            this.steppersFailed[2] = false;
            this.steppersFailed[4] = false;
            console.log(formData);
            const response = await $axios.post(url, formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
            console.log(response);
            this.$q.notify({
              color: "primary",
              position: "bottom-right",
              message: "We have sent an invitation to signer.",
            });
            if (this.addWitnessDataPacket) {
              this.addWitnessDataPacket.sessionid = response?.data?.session?._id;
              const witnessResponse = await this.axios.post("session/addWitnessDuringSession", this.addWitnessDataPacket, {
                headers: {
                  "Content-Type": "application/json",
                },
              });
              console.log("witnessResponse", witnessResponse);
            }
            if (this.$user.role === "customer") {
              this.$router.replace("/business/business-sessions");
            } else {
              this.$router.replace("/notary/my-sessions/");
            }
          } catch (error) {
            console.log(error);
          }
        } else if (this.$v.model?.signerEmail?.$error) {
          this.$q.notify({
            type: "negative",
            message: "Signer Email is invalid"
          });
          this.steppersFailed[2] = true;
        }
        this.isSubmitting = false;
      });
    },
    timezoneFilterFn (val, update) {
      if (val === "") {
        update(() => {
          this.timezoneValues = window.allTimeZones;
        });
        return;
      }

      update(() => {
        const needle = val.toLowerCase();
        this.timezoneValues = window.allTimeZones.filter((v) => v.label.toLowerCase().indexOf(needle) > -1);
      });
    },
    onRejected () {
      this.$q.notify({
        type: "negative",
        message: "Selected document size is exceeding the maximum file size of 25MB."
      });
    },
    calculateTime(offset) {
        // create Date object for current location
        const d = new Date();
        // convert to msec
        // subtract local time zone offset
        // get UTC time in msec
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        // create new Date object for different city
        // using supplied offset
        const nd = new Date(utc + (3600000 * offset));
        // return time as a string
        return nd.toLocaleString();
    },
    addMoreSignerButton() {
      this.multiSignerList.push({
        id: `input${String(this.multiSignerList.length)}`,
        email: ""
      });
    },
    removeSignerEmail(signerId) {
      this.multiSignerList = __.filter(this.multiSignerList, (signerDoc) => signerDoc.id !== signerId);
    },
    removeDocument(tempDocument) {
      this.notaryDocuments = __.filter(this.notaryDocuments, (uploadedDocument) => uploadedDocument.name !== tempDocument.name);
    },
    editDocument(tempDocument, tempDocumentIndex) {
      console.log("tempDocument", tempDocument);
      this.openModifyDocumentsComponentDocumentDoc = tempDocument;
      this.openModifyDocumentsComponentModal = true;
      this.openModifyDocumentsIndex = tempDocumentIndex;
    },
    async fetchAllSelectableNotaries() {
      const url = "/customer/fetchAllSelectableNotaries";
      const response = await $axios.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      this.allSelectableNotaries = (response && response.data && response.data.userNotaryRelations) || [];
    },
    closePaymentInfoModal() {
      this.showPaymentInfoModal = false;
      this.sessionChargeOnBusinessUser = false;
      this.$q.notify({
        color: "orange",
        position: "bottom",
        message: "Default session billing will be used since card details were not provided.",
      });
    },
    async paymentDetailsCaptured(cardToken, paymentMethod, paymentMethodSelected) {
      let dataToSend = {};
      if (paymentMethod) {
        dataToSend = JSON.parse(JSON.stringify(paymentMethod));
      }
      if (cardToken?.id) {
        dataToSend.token = cardToken.id;
      }
      dataToSend.paymentMethod = paymentMethod;
      dataToSend.paymentMethodSelected = paymentMethodSelected;
      console.log("called", dataToSend);
      const url = "session/createCustomerForInviteSigner";
      const response = await $axios.post(url, { data: dataToSend }, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.stripeIdentityDetails = (response && response.data) || {};
      console.log(response);
      if (this.stripeIdentityDetails && this.stripeIdentityDetails.stripeCustomerID) {
        this.$q.notify({
          color: "primary",
          position: "bottom",
          message: "Your card information has been saved successfully.",
        });
      } else {
        this.$q.notify({
          color: "primary",
          position: "bottom",
          message: "There was some error in card details. Default session billing will be used.",
        });
      }
      this.showPaymentInfoModal = false;
    },
    kBAConsentGiven(consentResponse) {
      if (!consentResponse) {
        this.skipCustomerKBACheck = false;
        this.$q.notify({
          color: "orange",
          position: "bottom",
          message: "Revoking Customer KBA for the Session",
        });
      } else {
        this.$q.notify({
          color: "green",
          position: "bottom",
          message: "Granting Customer KBA for the Session",
        });
      }
    },
    addMorePointOfContact() {
      this.lastPOCIndex += 1;
      this.pointOfContacts.push({
        id: this.lastPOCIndex,
        role: {
          value: "loan_officer",
          label: "Loan Officer"
        },
        role_other: "",
        firstname: "",
        lastname: "",
        email: "",
        phone: ""
      });
    },
    deletePointOfContact(pocId) {
      this.pointOfContacts = __.filter(this.pointOfContacts, (tempPOC) => tempPOC.id !== pocId);
    },
    changeStepClicked(nextStepNumber) {
      console.log("nextStepNumber", nextStepNumber);
      if (nextStepNumber === 3) {
        if (!this.model.signerName) {
          this.$q.notify({
            color: "red",
            position: "bottom",
            message: "Signer Name is required field",
          });
          return;
        }
        if (!this.model.signerEmail) {
          this.$q.notify({
            color: "red",
            position: "bottom",
            message: "Signer Email is required field",
          });
          return;
        }
      }
      this.steppersPassed[nextStepNumber] = true;
      this.step = nextStepNumber;
    },
    modifyDocumentUpdatesFunction(actionType, actionData) {
      console.log(actionType, actionData);
      if (actionType === "cancelled") {
        this.openModifyDocumentsComponentModal = false;
      } else if (actionType === "document_modified") {
        this.openModifyDocumentsComponentModal = false;
        this.notaryDocuments[this.openModifyDocumentsIndex] = actionData?.fileObject;
      }
    },
    closeAddWitnessModal() {
      this.showAddWitnessModal = false;
    },
    addWitnessModalSaveClickedNonPdfSession(witnessDataToSave) {
      this.addWitnessDataPacket = witnessDataToSave;
    },
    deleteWitnessFromSession() {
      this.addWitnessDataPacket = false;
    },
    addWitnessClicked() {
      this.showAddWitnessModal = true;
    }
  },
};
</script>

<style>
.horizontalLine {
   width: 100%;
   text-align: center;
   border-bottom: 1px solid #000;
   line-height: 0.1em;
   margin: 10px 0 20px;
}

.horizontalLine span {
    background:#fff;
    padding:0 10px;
    font-weight: bold;
}
</style>
