<template>
  <q-page class="q-pa-md flex-center session-container">
    <div class="row">
      <div class="col-12 col-md-12">
        <session-header v-if="sessionid" :session-id="sessionid" />
      </div>
      <div class="col-12 col-md-12 q-pa-lg workflow-container">
        <session-input-header current-stage="prepare_doc" :hide-payments-tab="hidePaymentsTab" :hide-personal-details-tab="hidePersonalDetailsTab" />
        <div class="row q-mt-lg">
          <div v-if="!($vendorDoc && $vendorDoc.whitelabel)" class="col-xs-12 col-sm-12 col-md-6 col-lg-6 flex mobile-only" style="justify-content: center;">
            <h3 class="q-pb-md">How Does This Work?</h3>
            <q-video
              src="https://youtube.com/embed/ppFAXIzzDIA"
              style="width:100%;"
              :ratio="16/9"
            />
          </div>
          <div class="col-xs-12 col-sm-12 col-md-6 col-lg-6">
            <!-- <div v-if="!(sessionData && sessionData.session && sessionData.session.notaryUserId) && !(sessionData && sessionData.session && sessionData.session.sessionType)" class="">
              <div class="flex column">
                <h1 class="no-margin">Type of Notarization</h1>
                <div class="row doc-list-preview">
                  <div class="q-pt-sm">
                    <q-radio v-model="notarizationSessionType" val="gnw" label="GNW" />
                    <q-radio v-model="notarizationSessionType" val="loan_signing" label="Loan Signing" />
                  </div>
                </div>
              </div>
            </div> -->
            <div v-if="notaryActiveCount >=1 && !($vendorDoc && $vendorDoc.strictPrepareDocStage)" class="">
              <div class="flex column">
                <h1 class="no-margin">Notarize Timing</h1>
                <div class="row doc-list-preview">
                  <div class="q-pt-sm">
                    <q-radio v-model="notorizationTiming" val="notarize_now" label="Notarize Now" />
                    <q-radio v-model="notorizationTiming" val="notarize_later" label="Schedule" />
                  </div>
                </div>
              </div>
            </div>
            <div v-if="notorizationTiming === 'notarize_later'" class="col-12 col-md-8 flex">
              <div class="flex column fcmn">
                <!-- <h6 class="no-margin">Choose desired date & time for notarization</h6> -->
                <div class="row doc-list-preview rdlpreview">
                  <div class="q-pt-md">
                    <h1 class="no-margin">
                      Notarization Meeting Date & Time
                    </h1>
                    <div class="flex">
                      <div class="tzone-cust">
                        <q-input
                          v-model="meetingdate"
                          dense
                          filled
                          class="q-py-sm"
                          type="text"
                          label="Meeting Date & Time"
                          :disable="meetingDateTimeDisabled"
                          @click="notarizationDateTimeInputFieldClicked"
                        >
                          <template v-slot:prepend>
                            <q-icon name="event" />
                          </template>
                        </q-input>
                      </div>
                      <div class="q-pl-sm tzone-cust">
                        <q-select
                          v-model="meetingTimeZone"
                          filled
                          class="q-py-sm"
                          dense
                          style="min-width:200px"
                          label="Timezone"
                          :options="selectedTimezone"
                          input-debounce="0"
                          :options-dense="true"
                          :disable="meetingDateTimeDisabled"
                          :error="!tmzSelected"
                          :error-message="`Please select timezone.`"
                          @filter="timezoneFilterFn"
                          @input="timezoneSelectUpdated()"
                        >
                          <template v-slot:prepend>
                            <q-icon name="language" />
                          </template>
                        </q-select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- <div v-if="showSelectNotaryPicker || ($user.memberType === 'free' && !(sessionData && sessionData.session && sessionData.session.notaryUserId))" class="col-12 col-md-8 flex"> -->
            <div v-if="showSelectNotaryPicker" class="col-12 col-md-8 flex">
              <div class="flex column">
                <h3 class="no-margin"><strong>Notary Selection for Session</strong></h3>
                <div class="row doc-list-preview">
                  <div class="">
                    <template v-for="notarySelectionOptions in notarySelectionPickerOptions">
                      <q-radio :key="notarySelectionOptions.key" v-model="assignNotary" :val="notarySelectionOptions.key" :label="notarySelectionOptions.name" :disable="$user.invitedViaSessionLink" />
                    </template>
                    <!-- <q-radio v-model="assignNotary" val="reffered_by_notary" label="Referred By Notary" />
                    <q-radio v-model="assignNotary" val="choose_notary" label="Choose Notary" />
                    <q-radio v-model="assignNotary" val="open_call" label="On Demand Certified Notary" /> -->
                  </div>
                </div>
              </div>
            </div>
            <div v-if="showSelectNotaryPicker && assignNotary === 'choose_notary'" class="col-12 col-md-8 flex">
              <div class="flex fcmn">
                <div class="q-pl-sm">
                  <q-select
                    v-model="selectedNotary"
                    filled
                    class="q-py-sm"
                    style="min-width: 270px"
                    label="Notary for the session"
                    :options="allSelectableNotaries"
                    input-debounce="0"
                    :options-dense="true"
                    :disable="meetingDateTimeDisabled"
                  >
                    <template v-slot:prepend>
                      <q-icon name="person" />
                    </template>
                    <!-- <template v-slot:selected-item="scope">
                      <q-item
                        v-bind="scope.itemProps"
                        v-on="scope.itemEvents"
                      >
                        <q-item-section v-if="scope.opt.name">
                          <div>
                            Name: <b>{{ scope.opt.name }}</b>
                          </div>
                          <div>
                            Email: <b>{{ scope.opt.email }}</b>
                          </div>
                          <div>
                            Notary Type: <b>{{ scope.opt.userType }}</b>
                          </div>
                          <div>
                            Last Date: <b>{{ moment(scope.opt.date).format("LL") }}</b>
                          </div>
                        </q-item-section>
                      </q-item>
                    </template>
                    <template v-slot:option="scope">
                      <q-item
                        v-bind="scope.itemProps"
                        v-on="scope.itemEvents"
                      >
                        <q-item-section>
                          <div>
                            Name: <b>{{ scope.opt.name }}</b>
                          </div>
                          <div>
                            Email: <b>{{ scope.opt.email }}</b>
                          </div>
                          <div>
                            Notary Type: <b>{{ scope.opt.userType }}</b>
                          </div>
                          <div>
                            Last Date: <b>{{ moment(scope.opt.date).format("LL") }}</b>
                          </div>
                        </q-item-section>
                      </q-item>
                    </template> -->
                  </q-select>
                </div>
              </div>
            </div>
            <div v-if="!skipCustomerKBACheck && !($vendorDoc && $vendorDoc.strictPrepareDocStage) && !hideCustomerKBACheck" class="col-12 col-md-8 flex">
              <div class="flex column" style="max-width: 100%">
                <h1 class="no-margin">Type of Identity Authentication</h1>
                <div class="row doc-list-preview">
                  <div class="q-pt-sm">
                    <q-radio v-model="typeOfKBA" val="us_citizens" :disable="forceTypeOfKBA" label="US Citizens + KBA" />
                    <!-- <q-radio v-model="typeOfKBA" val="foreigners_with_residential" label="Foreigners With Residential History" /> -->
                    <q-radio v-if="!hidePassportBiometricsWorkflow" v-model="typeOfKBA" :disable="forceTypeOfKBA" val="foreigners_without_residential" label="US Citizens/Foreigners + Biometrics" />
                  </div>
                </div>
                <div v-if="!($vendorDoc && $vendorDoc.hideInformationLinks)" class="q-mx-sm">
                  <q-icon name="info" color="blue" class="q-mr-xs" />
                  <small><a href="https://bluenotary.crisp.help/en/article/types-of-identity-authentication-1uye2q4/" target="_blank"><u>More details on identification types</u></a></small>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-8 flex q-mt-md q-ml-sm">
              <div class="full-width">
                <q-checkbox v-model="multiSignerFlag" label="Add Multiple Signers" />
              </div>
              <div v-if="!($vendorDoc && $vendorDoc.hideInformationLinks)" class="q-mx-sm">
                <q-icon name="info" color="blue" class="q-mr-xs" />
                <small><a href="https://bluenotary.crisp.help/en/article/how-does-a-multiple-signer-session-work-d2qq6j/" target="_blank"><u>How does multi-signer session work?</u></a></small>
              </div>
            </div>
            <div class="col-12">
              <div v-if="multiSignerFlag" class="flex column no-margin">
                <div v-for="signerItem in multiSignerList" :key="signerItem.id" class="row" style="margin-top: 8px;">
                  <div class="col-md-6 col-xs-10">
                    <q-input v-model="signerItem.email" filled label="Secondary Signer Email" type="email" />
                  </div>
                  <div class="col-2">
                    <q-btn flat round color="primary" outline icon="highlight_off" style="font-size: 17px" @click="removeSignerEmail(signerItem.id)" />
                  </div>
                </div>
                <q-btn color="primary" outline label="Add More" class="q-mt-md" @click="addMoreSignerButton" />
              </div>
            </div>
            <div class="col-12 column" style="padding-top: 24px">
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
            <!-- <div v-if="!(sessionData && sessionData.session && sessionData.session.notaryUserId)" class="col-12 q-mt-md q-ml-sm">
              <div class="full-width">
                <q-checkbox v-model="requestForStateSpecificNotary" label="Request for State Specific Notary" :disable="requestForStateSpecificNotaryDisabled" />
              </div>
              <div v-if="requestForStateSpecificNotary" class="col" style="margin-top: 8px; width: 50%">
                <q-select
                  v-model="requestForStateSpecificNotaryStateName"
                  filled
                  dense
                  :disable="requestForStateSpecificNotaryDisabled"
                  :options="stateListToUse"
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
              <div class="q-mx-sm">
                <small><a href="https://bluenotary.crisp.help/en/article/state-specific-notary-selection-35h8ul/" target="_blank"><u>How does Requesting for State Specific Notary Work?</u></a></small>
              </div>
            </div> -->
            <div v-if="!(sessionData && sessionData.session && sessionData.session.notaryUserId)" class="col-12 q-mt-md q-ml-sm">
              <div class="full-width">
                <q-checkbox v-model="requestForSpanishNotary" label="Solicitar Notario Hispanohablante" />
              </div>
              <!-- <div class="q-mx-sm">
                <small><a href="https://bluenotary.crisp.help/en/article/state-specific-notary-selection-35h8ul/" target="_blank"><u>How does Requesting for State Specific Notary Work?</u></a></small>
              </div> -->
            </div>
            <template v-if="(sessionData && sessionData.session && sessionData.session.sessionType === 'loan_signing')">
              <div class="col-12">
                <div class="q-py-md column">
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
                  <div class="col" style="margin-top: 8px">
                    <q-input
                      v-model="loanNumber"
                      class="col-12 col-md-9"
                      filled
                      dense
                      label="Loan Number"
                    >
                      <template v-slot:prepend>
                        <q-icon name="confirmation_number" />
                      </template>
                    </q-input>
                  </div>
                </div>
                <div class="q-py-md column">
                  <h3>
                    Property Address
                  </h3>
                  <div class="row q-gutter-sm" style="padding-top: 6px">
                    <q-input
                      v-model="loan_signing_addressLine1"
                      class="col-12 col-md-9"
                      outlined
                      hint="Address Line 1"
                      :dense="dense"
                    />
                    <q-input
                      v-model="loan_signing_addressLine2"
                      class="col-md-4 col-12"
                      outlined
                      hint="Address Line 2"
                      :dense="dense"
                    />
                    <q-select
                      v-model="loan_signing_userState"
                      :options="states"
                      class="col-md-3 col-4"
                      outlined
                      hint="State"
                      :dense="dense"
                    />
                    <q-input
                      v-model="loan_signing_userZipCode"
                      class="col-md-2 col-6"
                      outlined
                      hint="Zip Code"
                      :dense="dense"
                    />
                  </div>
                </div>
                <div class="q-py-md column">
                  <h3>
                    Notes for Notary
                  </h3>
                  <div class="q-gutter-sm">
                    <div style="max-width: 500px; padding-top: 6px">
                      <q-input
                        v-model="loan_signing_notes_for_notary"
                        filled
                        type="textarea"
                      />
                    </div>
                  </div>
                </div>
                <div class="q-py-md column">
                  <h1 class="no-margin">Agents & Liasons</h1>
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
                </div>
              </div>
            </template>
          </div>
          <div v-if="!($vendorDoc && $vendorDoc.whitelabel)" class="col-xs-12 col-sm-12 col-md-6 col-lg-6 flex q-pl-lg desktop-only" style="justify-content: center;">
            <h2>How Does This Work?</h2>
            <q-video
              src="https://youtube.com/embed/ppFAXIzzDIA"
              style="width:100%;"
              :ratio="16/9"
            />
          </div>
        </div>
        <div class="col-12 col-md-8">
          <div class="q-mt-xl q-ml-md">
            <div>
              <h1 class="no-margin"><strong>Documents to Notarize</strong></h1>
              <p v-if="!(currentSessionDocuments && currentSessionDocuments.length)" class="text-faded">Uploaded documents will display here</p>
            </div>
            <div>
              <div class="" style="width: 100%">
                <div style="width: 100%">
                  <div
                    v-for="(item, key) of currentSessionDocuments"
                    :key="key"
                    class="q-mt-md q-mb-md w-100"
                  >
                    <div class="d-flex">
                      <q-icon name="check_circle" color="green q-pr-sm" style="font-size:2rem;" />
                      <div class="text-wrapper" style=""><span class="q-py-lg" style="color:blue;cursor:pointer;" @click="previewDoc(item)">{{ item.name }}</span></div>
                      <div class="q-pl-sm">
                        <!-- <q-btn icon="visibility" @click="previewDoc(item)" /> -->
                        <q-btn v-if="!($vendorDoc && $vendorDoc.strictPrepareDocStage)" title="Edit Document" flat icon="edit" @click="editDoc(item)" />
                        <q-btn v-if="!($vendorDoc && $vendorDoc.strictPrepareDocStage)" title="Remove" flat icon="cancel" @click="deleteDoc(sessionData.session._id, item._id)" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="showDocumentUploadPicker"
            class="file-drop-zone q-mt-md"
            @drop.prevent="addFile"
            @dragover.prevent
            @dragenter.prevent
            @dragleave.prevent
          >
            <div class="file-decorate">
              <div id="article" class="q-pa-xl">
                <div v-if="fileLoading">
                  <q-spinner
                    color="primary"
                    size="3em" />
                  <p class="no-margin q-pt-md text-faded">
                    Uploading document, please wait...
                  </p>
                </div>
                <div v-if="!fileLoading">
                  <q-btn
                    class="browse-btn q-pa-md"
                    label="Upload Document"
                    :loading="fileLoading"
                    color="primary"
                    @click="$refs.fileinputArticle.$el.click()"
                  />
                  <p class="no-margin q-pt-md text-faded">
                    Drop the full document as PDF file / Image files in jpg, jpeg, png extension or browse on your device
                  </p>
                  <q-file
                    v-show="false"
                    ref="fileinputArticle"
                    v-model="pickedArticleFile"
                    standout
                    multiple
                    color="primary"
                    label="Add a document"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              </div>
            </div>
          </div>
          <div v-if="docSelected === false">
            <p class="red-error">Please upload document.</p>
          </div>
        </div>
        <!-- :disabled="(sessionData.length === 0 || !sessionData.document.length)" -->
      </div>
      <q-btn
        class="next-btn q-mt-md q-mb-xl"
        label="Next"
        color="primary"
        @click="goesNext()"
      />
    </div>
    <!-- modal preview of document -->
    <q-dialog v-model="uploaded">
      <q-card style="min-width: 80%">
        <q-card-section>
          <div class="text-h6">Document Preview</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row input-block">
            <div class="col-12">
              <div
                class="form-img-block"
                style="border: none; padding: 0px; width: 100%"
              >
                <div
                  class="col-12 flex vcenter"
                  style="
                    display: block;
                    width: 100%;
                    height: 60vh;
                    overflow: auto;
                    background: white;
                  "
                >
                  <template v-if="!rendered">
                    <div class="renderer">
                      <q-spinner
                        color="primary"
                        size="3em" />
                    </div>
                  </template>
                  <div id="pdfvuer">
                    <VuePdfEmbed ref="pdfRef" :source="pdfSource" @rendered="handleDocumentRender" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-close-popup
            outline
            label="OK"
            color="primary"
            @click="closeDialog()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="deleteConfirm" persistent>
      <q-card class="q-pa-sm">
        <q-card-section class="column">
          <q-avatar icon="delete_forever" color="primary" text-color="white" />
          <span class="q-ml-sm"> Are you sure? </span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-if="!loading" v-close-popup flat label="Cancel" color="primary" />
          <q-btn
            outline
            label="Remove"
            color="primary"
            :loading="loading"
            @click="deleteSessionItem()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- <q-dialog v-model="browserIncompatibilityError" persistent>
      <q-card class="q-pa-sm">
        <q-card-section class="column">
          <span class="q-ml-sm">To ensure optimal performance for sessions, we require use of <a href="https://www.google.com/chrome/">Chrome browser</a>.</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat label="I understand" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog> -->

    <q-dialog v-model="openDateTimePickerModal">
      <q-card style="max-width: none">
        <q-card-section>
          <div class="text-h6">Select Desired Notarization Date and Time</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-py-md row justify-between">
            <q-date
              v-model="meetingdate"
              :options="optionsFn"
              mask="YYYY-MM-DD hh:mm A"
              color="primary"
            />
            <div class="mtdate">
              <q-time
                v-model="meetingdate"
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

    <!-- encryption files modal -->
    <q-dialog v-model="openEncryptionFilesModal">
      <q-card>
        <q-card-section>
          <div class="text-h6">1 or more of your PDFs is locked</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div
            v-for="encryptionFile in encryptionFiles"
            :key="encryptionFile.name"
          >
            <u>{{ encryptionFile.name }}</u>
          </div>
          <p v-if="!($vendorDoc && $vendorDoc.hideInformationLinks)" class="q-mt-md">
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
    <upgrade-account-popup-component :open-acc-pro-model="openUpgradePopup" />
    <modify-documents-component :modify-document-updates-function="modifyDocumentUpdatesFunction" :open-modify-documents-component-model="openModifyDocumentsComponentModal" :document-doc="openModifyDocumentsComponentDocumentDoc" :session-id="sessionid" />
    <add-witness-component
      called-from="invitesigner"
      :open-add-witness-modal="showAddWitnessModal"
      :close-add-witness-modal="closeAddWitnessModal"
      :add-witness-modal-save-clicked-non-pdf-session="addWitnessModalSaveClickedNonPdfSession"
    />
  </q-page>
</template>

<script>
import { ref } from "@vue/composition-api";
import VuePdfEmbed from "vue-pdf-embed/dist/vue2-pdf-embed";
import { $axios } from "boot/axios";
import { v4 as uuidV4 } from "uuid";
import { date } from "quasar";
import moment from "moment";
import __ from "lodash";
import states from "@/data/states.json";
import statesWithManyNotaries from "@/data/statesWithManyNotaries.json";
import statesWithManyNotariesAndBiometrics from "@/data/statesWithManyNotariesAndBiometrics.json";
import SessionHeader from "../../components/SessionHeader.vue";
import UpgradeAccountPopupComponent from "./upgradeCustomerAccount.vue";
import SessionInputHeader from "./SessionInputHeader.vue";
import VueEventBus from "../../plugins/eventbus.js";
import ModifyDocumentsComponent from "../../components/ModifyDocumentsComponent.vue";
import AddWitnessComponent from "../pdfedit/AddWitnessComponent.vue";

export default {
  name: "PrepareDoc",
  components: {
    VuePdfEmbed, SessionHeader, UpgradeAccountPopupComponent, SessionInputHeader, ModifyDocumentsComponent, AddWitnessComponent
  },
  data() {
    return {
      sessionid: "",
      // browserIncompatibilityError: false,
      // notarizationSessionType: "gnw",
      notorizationTiming: "notarize_later",
      assignNotary: "open_call",
      allSelectableNotaries: [],
      selectedNotary: "",
      showSelectNotaryPicker: false,
      meetingdate: "",
      openDateTimePickerModal: false,
      window,
      moment,
      timezoneValues: [],
      selectedTimezone: [],
      meetingTimeZone: "",
      meetingDateTimeDisabled: false,
      multiSignerFlag: false,
      multiSignerList: [
        {
          id: "input0",
          email: ""
        }
      ],
      openUpgradePopup: false,
      notaryActiveCount: 0,
      typeOfKBA: "us_citizens",
      forceTypeOfKBA: false,
      skipCustomerKBACheck: false,
      hidePassportBiometricsWorkflow: false,
      encryptionFiles: [],
      openEncryptionFilesModal: false,
      hidePaymentsTab: false,
      hidePersonalDetailsTab: false,
      requestForSpanishNotary: false,
      requestForStateSpecificNotary: false,
      requestForStateSpecificNotaryDisabled: false,
      requestForStateSpecificNotaryStateName: "",
      loan_signing_addressLine1: "",
      loan_signing_addressLine2: "",
      loan_signing_userState: "",
      loan_signing_userZipCode: "",
      loan_signing_state_specific_notary: "no",
      loan_signing_notes_for_notary: "",
      states,
      statesWithManyNotaries,
      statesWithManyNotariesAndBiometrics,
      stateListToUse: statesWithManyNotaries,
      notarySelectionPickerOptions: [],
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
      openModifyDocumentsComponentModal: false,
      openModifyDocumentsComponentDocumentDoc: {},
      currentSessionDocuments: [],
      showAddWitnessModal: false,
      addWitnessDataPacket: false,
      hideCustomerKBACheck: false
    };
  },
  computed: {
    showDocumentUploadPicker () {
      let uploadPickerShow = true;
      // if (this.$user.memberType !== "pro" && this.sessionData.document && this.sessionData.document.length) {
      //   uploadPickerShow = false;
      // }
      if (this.$vendorDoc?.strictPrepareDocStage) {
        uploadPickerShow = false;
      }
      return uploadPickerShow;
    }
  },
  watch: {
    async pickedArticleFile(val) {
      if (val) {
        if (val.length > 0) {
          // eslint-disable-next-line no-plusplus
          for (let i = 0; i < val.length; i++) {
            console.log(val[i]);
            const fileDoc = val[i];
            const fileName = fileDoc?.name;
            if (fileName) {
              const fileExtension = fileName.split(".").pop();
              if (fileExtension && !["pdf", "jpg", "jpeg", "png"].includes(fileExtension)) {
                this.$q.notify({
                  color: "red",
                  position: "bottom-right",
                  message: "Please select valid pdf files or valid image files",
                });
                return;
              }
            }
            const reader = new FileReader();
            reader.readAsArrayBuffer(val[i]);
            reader.onload = () => {
              const files = new Blob([reader.result], {
                type: "application/pdf",
              });
              files.text().then(async (x) => {
                // const fileIsEncrypted = x
                //   .substring(x.lastIndexOf("<<"), x.lastIndexOf(">>"))
                //   .includes("/Encrypt");
                const fileIsEncrypted = x.includes("Encrypt");
                if (!fileIsEncrypted) {
                  await this.uploadZip(val[i]);
                  this.docSelected = true;
                } else {
                  this.encryptionFiles.push(val[i]);
                }
                if (this.encryptionFiles.length > 0) {
                  this.openEncryptionFilesModal = true;
                }
              });
            };
          }
        }
      }
      this.docSelected = true;
    },
    sessionData: {
      handler(value) {
        console.log("sessiondata changed", value);
        if (value && value.session && value.session._id) {
          this.sessionid = value.session._id;
        }
        if (value && __.isArray(value.document) && value.document.length !== this.currentSessionDocuments.length) {
          this.currentSessionDocuments = value.document;
        }
      },
      deep: true
    },
    assignNotary: {
      handler(value) {
        if (value === "choose_notary" && !this.$vendorDoc?.openCallSettings?.allowChoosingFromVendorTeam && (this.$user.memberType === "free" || this.$user.memberType === "pro")) {
          this.assignNotary = "open_call";
          this.showUpgradePopup();
        }
      }
    },
    typeOfKBA: {
      handler(value) {
        if (value === "foreigners_without_residential") {
          this.stateListToUse = this.statesWithManyNotariesAndBiometrics;
        } else {
          this.stateListToUse = this.statesWithManyNotaries;
        }
      }
    }
  },
  async mounted () {
    this.docSelected = true;
    // this.browserIncompatibilityError = !(/chrome/i.test(navigator.userAgent));
    // this.hidePaymentsTab = this?.$vendorDoc?.skipSessionCharges || false;
    this.sessionid = (this.$route.params && this.$route.params.id) || false;
    if (this.sessionid) {
      this.currentSession = this.sessionid;
      this.$q.localStorage.set("sessionData", this.currentSession);
    } else {
      this.currentSession = "new";
      this.$q.localStorage.set("sessionData", this.currentSession);
    }
    console.log("this.$route.params", this.$route.params);
    const sessionType = (this.$route.query && this.$route.query.sessionType) || false;
    const res = await this.loadSessionData(this.currentSession, this.$user._id, sessionType);
    this.sessionData = res;
    console.log(this.sessionData);
    this.hidePaymentsTab = this?.$vendorDoc?.skipSessionCharges || this.sessionData?.vendorDoc?.skipSessionCharges || this.sessionData?.session?.sessionChargeOnBusinessUser || this.$user.skipSessionCharges || false;
    this.hidePersonalDetailsTab = this.sessionData?.session?.performInSessionKBA || false;
    if (this.sessionData?.session?.typeOfKBA) {
      this.typeOfKBA = this.sessionData?.session?.typeOfKBA;
    }
    if (this.sessionData?.session?.forceTypeOfKBA) {
      this.forceTypeOfKBA = true;
    }
    if (this.sessionData?.notaryUserDoc?.state && !["Florida", "Virginia", "Pennsylvania", "Montana", "Louisiana", "Wyoming", "New Jersey"].includes(this.sessionData?.notaryUserDoc?.state)) {
      this.hideCustomerKBACheck = true;
    }
    this.loan_signing_addressLine1 = this.sessionData?.session?.loanSigningExtraFields?.loan_signing_addressLine1 || "";
    this.loan_signing_addressLine2 = this.sessionData?.session?.loanSigningExtraFields?.loan_signing_addressLine2 || "";
    this.loan_signing_userState = this.sessionData?.session?.loanSigningExtraFields?.loan_signing_userState || "";
    this.loan_signing_userZipCode = this.sessionData?.session?.loanSigningExtraFields?.loan_signing_userZipCode || "";
    this.loan_signing_state_specific_notary = this.sessionData?.session?.loanSigningExtraFields?.loan_signing_state_specific_notary || "";
    this.loan_signing_notes_for_notary = this.sessionData?.session?.loanSigningExtraFields?.loan_signing_notes_for_notary || "";

    this.currentSessionDocuments = this.sessionData?.document || [];

    if (this.sessionData?.session?.pointOfContacts) {
      this.pointOfContacts = this.sessionData?.session?.pointOfContacts;
    }
    if (this.sessionData?.session?.loanNumber) {
      this.loanNumber = this.sessionData?.session?.loanNumber;
    }

    if (this.sessionData?.session?.notorizationTiming) {
      this.notorizationTiming = this.sessionData?.session?.notorizationTiming;
    }

    if (this.sessionData?.session?.requestForStateSpecificNotary) {
      this.requestForStateSpecificNotary = this.sessionData?.session?.requestForStateSpecificNotary;
      this.requestForStateSpecificNotaryStateName = this.sessionData?.session?.requestForStateSpecificNotaryStateName;
      this.requestForStateSpecificNotaryDisabled = true;
    }

    if (this.sessionData?.session?.requestForSpanishNotary) {
      this.requestForSpanishNotary = this.sessionData?.session?.requestForSpanishNotary;
    }

    if (this.sessionData?.session?.loanSessionType) {
      __.map(this.allLoanSessionTypes, (tempLoanSessionType) => {
        if (tempLoanSessionType.value === this.sessionData?.session?.loanSessionType) {
          this.loanSessionType = tempLoanSessionType;
        }
      });
    }

    if (this.$user.refferedByNotary) {
      this.showSelectNotaryPicker = true;
      this.assignNotary = "referred_by_notary";
      this.notarySelectionPickerOptions = [
        {
          key: "referred_by_notary",
          name: "Referred by Notary"
        },
        {
          key: "open_call",
          name: "On Demand Certified Notary"
        }
      ];
    }

    if (!(this.sessionData && this.sessionData.session && this.sessionData.session.notaryUserId) && !this.$vendorDoc?.strictPrepareDocStage) {
      if (this.$user.memberType !== "free") {
        this.fetchAllSelectableNotaries();
      }
      this.fetchActiveNotaries();
    }

    if (this.sessionData && this.sessionData.notaryUserDoc) {
      if (this.sessionData.notaryUserDoc.state !== "Florida" && this.sessionData.notaryUserDoc.state !== "Virginia" && this.sessionData.notaryUserDoc.state !== "Pennsylvania" && this.sessionData.notaryUserDoc.state !== "Montana" && this.sessionData.notaryUserDoc.state !== "Louisiana" && this.sessionData.notaryUserDoc.state !== "Wyoming" && this.sessionData.notaryUserDoc.state === "New Jersey") {
        this.hidePassportBiometricsWorkflow = true;
      }
    }

    if (this.sessionData?.session?.skipCustomerKBACheck) {
      this.skipCustomerKBACheck = this.sessionData?.session?.skipCustomerKBACheck;
    }
    if (this.sessionData && this.sessionData.session && this.sessionData.session.multiSignerList && this.sessionData.session.multiSignerList.length) {
      this.multiSignerFlag = true;
      this.multiSignerList = this.sessionData.session.multiSignerList;
    }

    if (this.currentSession === "new") {
      this.currentSession = res.session._id;
      this.$q.localStorage.set("sessionData", res.session._id);
    }
    if (this.$route.query.demo && this.$route.query.demo === "true") {
      this.$router.replace(`/business/prepare_doc/${this.currentSession}/?demo=true`).catch(() => {});
    } else if (this.$user.testingacc && this.$user.testingacc === true) {
      this.$router.replace(`/business/prepare_doc/${this.currentSession}/?demo=true`).catch(() => {});
    } else {
      this.$router.replace(`/business/prepare_doc/${this.currentSession}`).catch(() => {});
    }
    if (this.$vendorDoc?.openCallSettings?.allowChoosingFromVendorTeam && !(this.sessionData && this.sessionData.session && this.sessionData.session.notaryUserId)) {
      this.showSelectNotaryPicker = true;
      this.notarySelectionPickerOptions = [
        {
          key: "choose_notary",
          name: "Choose Notary"
        },
        {
          key: "open_call",
          name: "On Demand Certified Notary"
        }
      ];
      await this.fetchAllSelectableNotaries();
      this.assignNotary = "open_call";
    }

    this.timezoneValues = window.allTimeZones;
    const allowedTimezones = ["(GMT-10:00) Hawaii", "(GMT-08:00) Pacific", "(GMT-07:00) Mountain", "(GMT-06:00) Central", "(GMT-05:00) Eastern"];
    this.selectedTimezone = this.timezoneValues.filter((timezone) => allowedTimezones.indexOf(timezone.label) >= 0);
    let timezone = String(((new Date().getTimezoneOffset()) / 60) * -1);
    if (this.sessionData && this.sessionData.session && this.sessionData.session.meetingTimeZone) {
      timezone = this.sessionData.session.meetingTimeZone;
    }
    __.map(this.selectedTimezone, (tempValue) => {
      if (tempValue.value === timezone) {
        this.meetingTimeZone = tempValue;
      }
    });
    if (this.sessionData && this.sessionData.session && this.sessionData.session.meetingdate) {
      this.meetingdate = this.sessionData.session.meetingdate;
      if (this.sessionData.session.notaryUserId) {
        this.meetingDateTimeDisabled = true;
      }
      if (this.$vendorDoc?.strictPrepareDocStage) {
        this.meetingDateTimeDisabled = true;
      }
    } else {
      this.meetingdate = moment().format("YYYY-MM-DD h:mm A");
    }
     VueEventBus.$on("SOCKET_UPDATES", async (socketData) => {
      console.log("socketData", JSON.parse(JSON.stringify(socketData)));
      if (typeof socketData.event !== "undefined") {
        if (socketData.event === "getActiveNotaryListOutput") {
          const { count } = socketData;
          this.notaryActiveCount = count;
          if (this.notaryActiveCount >= 1 && !this.$vendorDoc?.strictPrepareDocStage) {
            this.notorizationTiming = "notarize_now";
          } else {
            this.notorizationTiming = "notarize_later";
          }
        }
      }
    });
  },
  setup (_, context) {
    const {
      root: { $q },
    } = context;
    const docSelected = ref(true);
    const tmzSelected = ref(true);
    const loading = ref(false);
    const fileLoading = ref(false);
    const pickedArticleFile = ref(null);
    const articleLoaded = ref(false);
    const uploaded = ref(false);
    const rendered = ref(false);
    const pdfSource = ref("");
    const page = ref(null);
    const sessionConfirm = ref(false);
    const currentSession = ref(null);
    const sessionData = ref([]);
    const deleteConfirm = ref(false);
    const deleteItem = ref(null);
    const documentDeleteItem = ref(null);
    const uploadZip = async (data) => {
      try {
        fileLoading.value = true;
        const url = "file/uploadFiles";
        const formData1 = new FormData();
        formData1.append("id", currentSession.value);
        formData1.append("file", data);
        const response = await $axios.post(url, formData1, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        const oldDocumentValues = (sessionData.value && sessionData.value.document) || [];
        if (response.data && response.data.document) {
          oldDocumentValues.push(response.data.document[0]);
        }
        sessionData.value = response.data;
        sessionData.value.document = oldDocumentValues;
        // uploaded.value = true;
        rendered.value = false;
        pdfSource.value = response.data.url;
        fileLoading.value = false;
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const loadSessionData = async (sessionId, userId, sessionType) => {
      try {
        const url = "session/loads";
        const response = await $axios.post(url, { sessionId, userId, sessionType }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const addFile = async (e) => {
      const droppedFiles = e.dataTransfer.files;
      if (!droppedFiles) return;
      pickedArticleFile.value = droppedFiles;
    };
    const closeDialog = async () => {
      rendered.value = false;
    };
    const continueSession = async () => {
      // load current session data from the Database.

    };
    const startNewSession = async () => {
      currentSession.value = uuidV4();
      $q.localStorage.set("sessionData", currentSession.value);
    };

    const previewDoc = async (item) => {
      console.log(item);
      uploaded.value = true;
      rendered.value = false;
      pdfSource.value = item.url;
    };
    const handleDocumentRender = async () => {
      rendered.value = true;
    };
    const deleteDoc = async (sessionId, documentId) => {
      console.log(sessionId);
      deleteConfirm.value = true;
      deleteItem.value = sessionId;
      documentDeleteItem.value = documentId;
    };
    const deleteSessionItem = async () => {
      loading.value = true;
      console.log("deleteItem ", deleteItem.value);
      try {
        const url = "session/documentDelete";
        const response = await $axios.post(url, { sessionId: deleteItem.value, documentId: documentDeleteItem.value }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("loadSessionData", response.data);
        let oldDocumentValues = (sessionData.value && sessionData.value.document) || [];
        oldDocumentValues = __.filter(oldDocumentValues, (documentItem) => documentItem._id !== documentDeleteItem.value);
        sessionData.value = response.data;
        sessionData.value.document = oldDocumentValues;
      } catch (error) {
        console.log(error);
      }
      deleteConfirm.value = false;
      loading.value = false;
      pickedArticleFile.value = null;
    };
    return {
      loading,
      fileLoading,
      pickedArticleFile,
      articleLoaded,
      addFile,
      uploaded,
      rendered,
      uploadZip,
      pdfSource,
      page,
      closeDialog,
      sessionConfirm,
      continueSession,
      startNewSession,
      currentSession,
      sessionData,
      previewDoc,
      deleteDoc,
      deleteConfirm,
      deleteItem,
      deleteSessionItem,
      loadSessionData,
      handleDocumentRender,
      docSelected,
      tmzSelected,
    };
  },
  beforeDestroy() {
    VueEventBus.$off("SOCKET_UPDATES");
  },
  methods: {
    editDoc(documentDoc) {
      this.openModifyDocumentsComponentModal = true;
      this.openModifyDocumentsComponentDocumentDoc = documentDoc;
    },
    timezoneSelectUpdated() {
      this.tmzSelected = true;
    },
    async goesNext() {
      this.docSelected = true;
      this.tmzSelected = true;
      if (this.notorizationTiming === "notarize_later" && !this.meetingTimeZone.value) {
        this.tmzSelected = false;
        this.$q.notify({
          color: "red",
          position: "bottom-right",
          message: "Please select Timezone",
        });
        return;
      }
      if (this.sessionData.length === 0 || this.currentSessionDocuments.length === 0) {
        this.$q.notify({
          color: "red",
          position: "bottom-right",
          message: "Please Enter Documents",
        });
        this.docSelected = false;
        return;
      }
      if (this.notorizationTiming === "notarize_later" && !this.meetingdate) {
        this.$q.notify({
          color: "red",
          position: "bottom-right",
          message: "Please select Meeting Date for Schedule Option",
        });
        return;
      }
      if (this.requestForStateSpecificNotary && !this.requestForStateSpecificNotaryStateName) {
        this.$q.notify({
          type: "negative",
          position: "bottom-right",
          message: "Please select needed state, if you want to request for state specific notary"
        });
        return;
      }
      const url = `session/saveSessionData/${this.sessionid}`;
      const dataToSave = {
        notorizationTiming: this.notorizationTiming,
        typeOfKBA: this.typeOfKBA
      };
      if (this.meetingdate) {
        dataToSave.meetingdate = this.meetingdate;
      }
      console.log("this.meetingTimeZone", this.meetingTimeZone);
      if (this.meetingTimeZone && this.notorizationTiming === "notarize_later") {
        const currentTimeZoneOffset = parseFloat(String((new Date()).getTimezoneOffset() / 60)) * -1;
        const currentMeetingTimeZone = parseFloat(this.meetingTimeZone.value);
        console.log(currentTimeZoneOffset, currentMeetingTimeZone);
        const finalOffset = (currentMeetingTimeZone - currentTimeZoneOffset) * 60;
        console.log(finalOffset);
        const meetingDateTimeObj = moment(this.meetingdate, "YYYY-MM-DD hh:mm A").utcOffset(finalOffset, true);
        console.log(this.meetingdate, this.meetingTimeZone.value, meetingDateTimeObj, moment().add(currentTimeZoneOffset * 60, "minutes") - meetingDateTimeObj);
        if (!(this.sessionData && this.sessionData.session && this.sessionData.session.notaryUserId)) {
          if (moment().add(currentTimeZoneOffset * 60, "minutes") - meetingDateTimeObj > -3600000) {
            this.$q.notify({
                type: "negative",
                message: "Please select valid date and time"
              });
            return;
          }
        }
        dataToSave.meetingTimeZone = this.meetingTimeZone.value;
      }
      dataToSave.currentTimeZone = String((new Date()).getTimezoneOffset() / -60);
      if (this.multiSignerFlag) {
        this.multiSignerList = __.compact(__.map(this.multiSignerList, (tempMultiSignerList) => {
          if (!(tempMultiSignerList && tempMultiSignerList.email)) {
            return false;
          }
          tempMultiSignerList.email = tempMultiSignerList.email.toLowerCase();
          return tempMultiSignerList;
        }));
        // this.multiSignerList = __.filter(this.multiSignerList, "email");
        dataToSave.multiSignerList = this.multiSignerList;
      }
      if (this.requestForStateSpecificNotary) {
        dataToSave.requestForStateSpecificNotary = this.requestForStateSpecificNotary;
        dataToSave.requestForStateSpecificNotaryStateName = this.requestForStateSpecificNotaryStateName;
      }
      if (this.requestForSpanishNotary) {
        dataToSave.requestForSpanishNotary = this.requestForSpanishNotary;
      } else {
        dataToSave.requestForSpanishNotary = false;
      }
      if (this.showSelectNotaryPicker && this.assignNotary === "choose_notary") {
        if (!this.selectedNotary) {
          this.$q.notify({
            color: "red",
            position: "bottom-right",
            message: "Please select the Notary ",
          });
          return;
        }
        dataToSave.notaryUserId = this.selectedNotary.value;
      }
      if (this.showSelectNotaryPicker && this.assignNotary === "referred_by_notary") {
        dataToSave.notaryUserId = this.$user.refferedByNotary;
      }
      if (this.showSelectNotaryPicker && this.assignNotary === "open_call") {
        dataToSave.markAsOpenCall = true;
      }
      if (this.sessionData?.session?.sessionType === "loan_signing") {
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
        dataToSave.loanSigningExtraFields = {
          loan_signing_addressLine1: this.loan_signing_addressLine1,
          loan_signing_addressLine2: this.loan_signing_addressLine2,
          loan_signing_userState: this.loan_signing_userState,
          loan_signing_userZipCode: this.loan_signing_userZipCode,
          loan_signing_state_specific_notary: this.loan_signing_state_specific_notary,
          loan_signing_notes_for_notary: this.loan_signing_notes_for_notary,
        };
        dataToSave.loanSessionType = this.loanSessionType.value;
        dataToSave.otherLoanSessionType = this.otherLoanSessionType;
        dataToSave.loanNumber = this.loanNumber;
        if (allPointofContacts.length) {
          dataToSave.pointOfContacts = JSON.stringify(allPointofContacts);
        }
        if (this.loanSessionType.value === "other" && !this.otherLoanSessionType) {
          this.$q.notify({
            type: "negative",
            message: "Please enter other transaction type field"
          });
          return;
        }
      }
      const res = await $axios.post(url, {
        data: dataToSave
      });
      let localTempStage = "personal_info";
      if (this.hidePersonalDetailsTab) {
        if (this.hidePaymentsTab) {
          localTempStage = "meet_notary";
        } else {
          localTempStage = "payment_info";
        }
      }
      if (res && localTempStage !== "personal_info") {
        let nextStage = "payment_info_stage";
        if (localTempStage === "meet_notary") {
          nextStage = "meet_notary_stage";
        }
        const url2 = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=${nextStage}`;
        await $axios.get(url2, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      if (this.addWitnessDataPacket?.witnessDetails?.witnessSelectionType === "bn_witness_open_call" && this.sessionData?.session?.sessionOpenCallForWitnessAt) {
        this.addWitnessDataPacket = false;
      }
      if (this.addWitnessDataPacket) {
        this.addWitnessDataPacket.sessionid = this.sessionid;
        const witnessResponse = await this.axios.post("session/addWitnessDuringSession", this.addWitnessDataPacket, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("witnessResponse", witnessResponse);
      }
      if (this.$route.query.demo && this.$route.query.demo === "true") {
        this.$router.replace(`/business/${localTempStage}/${this.sessionid}/?demo=true`).catch(() => {});
      } else if (this.$user.testingacc && this.$user.testingacc === true) {
        this.$router.replace(`/business/${localTempStage}/${this.sessionid}/?demo=true`).catch(() => {});
      } else {
        this.$router.replace(`/business/${localTempStage}/${this.sessionid}`).catch(() => {});
      }
    },
    optionsFn (selectedDate) {
      return selectedDate >= date.formatDate(Date.now(), "YYYY/MM/DD");
    },
    notarizationDateTimeInputFieldClicked() {
      this.openDateTimePickerModal = true;
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
    addMoreSignerButton() {
      this.multiSignerList.push({
        id: `input${String(this.multiSignerList.length)}`,
        email: ""
      });
    },
    removeSignerEmail(signerId) {
      this.multiSignerList = __.filter(this.multiSignerList, (signerDoc) => signerDoc.id !== signerId);
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
      if (this.allSelectableNotaries.length && !(this.sessionData && this.sessionData.session && this.sessionData.session.notaryUserId)) {
        this.showSelectNotaryPicker = true;
        this.notarySelectionPickerOptions = [
          {
            key: "choose_notary",
            name: "Choose Notary"
          },
          {
            key: "open_call",
            name: "On Demand Certified Notary"
          }
        ];
        if (this.$user.memberType !== "pro") {
          this.assignNotary = "choose_notary";
        }
      }
    },
    async fetchActiveNotaries() {
      window.currentSocket.emit("getActiveNotaryList", {}, (res) => {
        console.log("res", res);
      });
    },
    showUpgradePopup() {
      console.log("here");
      this.openUpgradePopup = false;
      setTimeout(() => {
        this.openUpgradePopup = true;
      }, 200);
    },
    deletePointOfContact(pocId) {
      this.pointOfContacts = __.filter(this.pointOfContacts, (tempPOC) => tempPOC.id !== pocId);
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
    socketRequest(eventName, extraDataToSend) {
      const socketRequestRoomName = this.sessionid;
      const dataToSend = {
        sessionid: socketRequestRoomName,
        user: this.$user._id
      };
      if (extraDataToSend) {
        Object.assign(dataToSend, extraDataToSend);
      }
      if (window.currentSocket) {
        window.currentSocket.emit(eventName, dataToSend, (res) => {
          console.log("res", res);
        });
      }
    },
    modifyDocumentUpdatesFunction(actionType, actionData) {
      console.log(actionType, actionData);
      if (actionType === "cancelled") {
        this.openModifyDocumentsComponentModal = false;
      } else if (actionType === "document_modified") {
        this.openModifyDocumentsComponentModal = false;
        this.currentSessionDocuments = __.map(this.currentSessionDocuments, (tempDoc) => {
          if (tempDoc._id === actionData?.document?._id) {
            return actionData?.document;
          }
          return tempDoc;
        });
        this.socketRequest("manually_refresh_session_data");
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
