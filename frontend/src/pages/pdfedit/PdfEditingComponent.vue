<template>
  <div class="columns is-marginless pdfmain is-multiline" style="height: 100vh; width: 100vw;" @click="pageclick">
    <div v-if="internetConnectionSpeedTestErrorShown" style="width: 100%; text-align: center; background: #ff4a74; color: white; width: 100vw">
      Your internet connection is too poor to proceed. Please check your quality to avoid disconnection in {{ internetConnectionDisconnectSeconds }} seconds.
    </div>
    <template v-if="requestId">
      <template v-if="!docFound">
        <div class="col-12 has-text-centered" style="margin: auto">
          <p class="has-text-grey-dark has-text-weight-bold">
            {{ docNotFoundError }}
          </p>
        </div>
      </template>
      <template v-else>
        <template v-if="pdfLoaded">
          <div class="column is-12 q-pt-sm">
            <div
              id="upper-text"
              class="pdf-upper-text bg-white row justify-between flex-wrap columns"
            >
              <div class="column is-2 col-xs-12 column inline tersec">
                <span v-if="pdfMode !== 'template'" class="col q-pl-sm" style="font-size:1.1rem;">
                  Session {{ sessionCode }}&nbsp;
                  <img v-if="showRecordingDot" src="~assets/recording-circle.gif" style="width:15px;" />
                </span>

                <span
                  v-if="joinedAsSessionNotary && pdfMode !== 'template' && !joinedAsWitness && !minimizeWaitingRoomData && !waitingRoomModalShow"
                  class="col q-pl-sm"
                  style="color:blue; text-decoration:underline; cursor:pointer; width: fit-content"
                  @click="terminateClicked"
                >
                  Terminate
                </span>
                <span v-if="pdfMode === 'template'" class="col" style="font-size:1.1rem;">Template: {{ sessionFullData && sessionFullData.originalDocument && sessionFullData.originalDocument.name }}</span>
              </div>
              <div v-if="pdfMode !== 'template'" class="column is-4 col-xs-12 inline q-pt-sm">
                <q-select v-model="currentDocumentSelected" filled :options="allDocumentList" option-value="_id" option-label="name" label="Current Document" :dense="true" :disable="$user.role !== 'notary' || !documentNagivationTimerEnabled" style="width: 100%; overflow: hidden">
                  <template v-if="joinedAsSessionNotary" v-slot:before>
                    <q-btn round dense flat icon="navigate_before" :disable="!documentPickerNavigationButtons.prev || !documentNagivationTimerEnabled" @click="documentPickerNavigationButtonClicked('prev')">
                      <q-tooltip>
                        <template v-if="documentNagivationTimerEnabled">
                          Goto Previous Document
                        </template>
                        <template v-else>
                          Please wait 10 Seconds before moving on to next file
                        </template>
                      </q-tooltip>
                    </q-btn>
                  </template>
                  <template v-if="joinedAsSessionNotary" v-slot:after>
                    <q-btn round dense flat icon="navigate_next" :disable="!documentPickerNavigationButtons.next || !documentNagivationTimerEnabled" @click="documentPickerNavigationButtonClicked('next')">
                      <q-tooltip>
                        <template v-if="documentNagivationTimerEnabled">
                          Goto Next Document
                        </template>
                        <template v-else>
                          Please wait 10 Seconds before moving on to next file
                        </template>
                      </q-tooltip>
                    </q-btn>
                  </template>
                </q-select>
              </div>
              <div class="success column is-4 col-xs-12 tag-toggle-mobile">
                <div id="uploadCustomDocDiv" style="display: none;" />
                <div class="q-mr-sm" style="float:left">
                  <q-btn v-if="(inSessionKBAForPrimarySignerFlow && joinedAsSessionNotary) || sessionid === 'simulator'" round flat icon="fact_check" style="height: 100%" @click="kbaIconClicked()">
                    <q-tooltip>
                      Show Identity Authentication Status of Signer
                    </q-tooltip>
                  </q-btn>
                  <q-btn v-if="(joinedAsSessionNotary || joinedAsPrimarySigner) && pdfMode !== 'template'" round flat icon="edit_calendar" style="height: 100%" @click="rescheduleIconClicked()">
                    <q-tooltip>
                      Reschedule the Session
                    </q-tooltip>
                  </q-btn>
                  <!-- <q-btn v-if="joinedAsSessionNotary && pdfMode !== 'template' && sessionid !== 'simulator'" round flat icon="file_upload" style="height: 100%" @click="editSesionDocumentsClicked()">
                    <q-tooltip>
                      Add / Edit PDF Files for this session
                    </q-tooltip>
                  </q-btn> -->
                  <q-btn v-if="(sessionid === 'simulator')" flat round icon="file_upload" @click="uploadCustomDoc()">
                    <q-tooltip>
                      Upload Custom Document
                    </q-tooltip>
                  </q-btn>
                </div>
                <q-btn
                  v-if="showSaveAndCancelButton"
                  style="margin-right: 6px"
                  color="light-blue-8"
                  class="inline"
                  @click="savePretagFields"
                >
                  Save & Exit
                  <q-tooltip>
                    Save the pretagged fields, and exit the session
                  </q-tooltip>
                </q-btn>
                <template>
                  <button
                    v-if="joinedAsSessionNotary && pdfMode !== 'template' && !joinedAsWitness"
                    class="button is-primary inline"
                    :disabled="disableCompleteButton"
                    @click="completePDF"
                  >
                    Complete Session
                  </button>
                </template>
                <q-icon v-if="joinedAsSessionNotary && pdfMode !== 'template' && !showCompleteButton" class="inline" name="info" style="cursor: pointer; color: black; font-size: 26px; margin-top: 10px; margin-left: 5px">
                  <q-tooltip>
                    <div v-html="showCompleteButtonInfoText" />
                  </q-tooltip>
                </q-icon>
                <template v-if="!minimizeWaitingRoomData && !waitingRoomModalShow">
                  <button
                    v-if="pdfMode === 'template' && !joinedAsWitness"
                    class="button is-danger"
                    style="margin-right: 10px;"
                    @click="cancelTemplateFields"
                  >
                    Cancel
                  </button>
                  <button
                    v-if="pdfMode === 'template' && !joinedAsWitness"
                    class="button is-primary"
                    @click="saveTemplateFields"
                  >
                    Save Template Fields
                  </button>
                  <div v-if="($user.role === 'customer' || joinedAsWitness) && customerTotalFields " style="padding: 7px 12px; border: 1px solid rgb(213, 222, 215; border-radius: 5px;display: flex;justify-content: space-between;">
                    <div style="white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">
                      <span style="font-weight: bold">{{ customerTotalFieldsDataInserted }} / {{ customerTotalFields }}</span> Completed
                      <q-tooltip>
                        The inputs requested by notary will be navigable from here.
                      </q-tooltip>
                    </div>
                    <div style="display: flex;flex-direction: row-reverse;">
                      <q-icon name="arrow_forward" style="cursor: pointer; color: blue; font-size: 26px; float: right; padding-left: 15px; padding-top: 2px" @click="nextCustomerInput($event)">
                        <q-tooltip>
                          Go to next input
                        </q-tooltip>
                      </q-icon>
                      <!-- <q-icon name="arrow_back" style="cursor: pointer; color: blue; font-size: 26px; float: right; padding-top: 2px" @click="prevCustomerInput($event)">
                        <q-tooltip>
                          Go to previous input
                        </q-tooltip>
                      </q-icon> -->
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
          <div class="column is-2 pdf-edit-column" style="padding:0 !important">
            <template v-if="pdfMode !== 'template'">
              <div class="video-container clearfix">
                <!-- <div style="width: 100%; text-align: center; padding: 12px; style: bold">Video Call Session</div> -->
                <div v-if="sessionid === 'simulator' && videoCallStarted" class="dummyblock">
                  <img class="video-thumb-dummy" src="~assets/kim-nguyen.jpg" alt="kim-nguyen" />
                </div>
                <div v-if="!videoCallStarted" class="q-pa-md">
                  Waiting for video feed...
                </div>
                <div v-if="useOpenVidu" id="video-container" class="col-md-6">
                  <user-video :stream-manager="publisher" @click.native="updateMainVideoStreamManager(publisher)" />
                  <user-video v-for="sub in subscribers"
                              :key="sub.stream.connection.connectionId"
                              :stream-manager="sub"
                              @click.native="updateMainVideoStreamManager(sub)" />
                </div>
                <div v-else class="wrtcvid" :class="{ 'simltor': sessionid === 'simulator' && videoCallStarted }">
                  <vue-webrtc ref="webrtc"
                              width="100%"
                              height="100%"
                              :room-id="videoCallRoomNumber"
                              :enable-logs="true"
                              :socket-u-r-l="videoCallSocketUrl"
                              :peer-options="videoCallPeerOptions"
                              camera-height="160"
                              @joined-room="joinedRoom"
                              @left-room="leftRoom"
                              @opened-room="logEvent"
                              @share-started="logEvent"
                              @share-stopped="logEvent" />
                </div>
                <!-- <div id="main-video" class="col-md-6">
                  <user-video :stream-manager="mainStreamManager" />
                </div> -->
              </div>
              <div v-if="!joinedAsWitness" id="notorizationTypeCard" class="q-px-md flex-center">
                <div>
                  <q-btn
                    v-if="joinedAsSessionNotary && pdfMode !== 'template' && sessionid !== 'simulator'"
                    outline
                    rounded
                    icon="edit"
                    class="q-mb-md full-width"
                    @click="editSesionDocumentsClicked"
                  >
                    &nbsp;Add / Edit Documents
                  </q-btn>
                </div>
                <div>
                  <q-btn
                    v-if="joinedAsSessionNotary"
                    outline
                    rounded
                    icon="fingerprint"
                    class="q-mb-md full-width"
                    @click="checkUserDetails"
                  >
                    &nbsp;Check Signer ID
                  </q-btn>
                </div>
                <div>
                  <q-btn
                    v-if="joinedAsSessionNotary && sessionFullData && sessionFullData.newSessionModelData && sessionFullData.newSessionModelData.loanSigningExtraFields && sessionFullData.newSessionModelData.loanSigningExtraFields.loan_signing_notes_for_notary"
                    outline
                    rounded
                    icon="short_text"
                    class="q-mb-md full-width"
                    @click="checkLoanInstructionsClicked"
                  >
                    &nbsp;Check Loan Instructions
                  </q-btn>
                </div>
                <div>
                  <q-btn
                    v-if="joinedAsSessionNotary && pdfMode !== 'template'"
                    outline
                    rounded
                    icon="group"
                    class="q-mb-md full-width"
                    @click="addAdditionalSigners"
                  >
                    &nbsp;Add Signers
                  </q-btn>
                </div>
                <div>
                  <q-btn
                    v-if="joinedAsSessionNotary && pdfMode !== 'template'"
                    outline
                    rounded
                    icon="person_add"
                    class="full-width q-mb-md"
                    :disabled="!enableWitnessAddButton"
                    @click="addWitnessClicked"
                  >
                    &nbsp; Add Witness
                  </q-btn>
                </div>
                <div v-if="joinedAsSessionNotary && !vendorSkipSessionCharges && !(sessionFullData.newSessionModelData && sessionFullData.newSessionModelData.sessionType === 'loan_signing')" class="">
                  <q-select
                    v-model="notorizationType"
                    filled
                    multiple
                    :options="options"
                    options-cover
                    use-chips
                    label="Notarization Type"
                  />
                </div>
              </div>
              <div class="flex flex-center">
                <div v-if="multiSignerUserDocs && multiSignerUserDocs.length" class=" q-mb-sm" style="font-size:12px;text-align:center">
                  <div class="col-md-2 col-lg-2 col-xs-12 q-px-md">
                    Additional Signers ({{ additionalSignersLabel }})
                  </div>
                  <template v-for="signerUserItem in multiSignerUserDocs">
                    <div :key="signerUserItem._id + 'first'" class="col-md-2 col-lg-2 col-xs-12 q-px-md" style="overflow-wrap: anywhere">
                      <template v-if="signerUserItem.email">
                        <strong>{{ signerUserItem.email }}</strong>
                      </template>
                    </div>
                    <div :key="signerUserItem._id + 'second'" class="col-md-2 col-lg-2 col-xs-12">
                      <q-icon v-if="signerUserItem.userActive" name="remove_red_eye" style="cursor: pointer; color: blue; font-size: 20px; float: right">
                        <q-tooltip>
                          Additional Signer is Online
                        </q-tooltip>
                      </q-icon>
                    </div>
                  </template>
                </div>
                <div v-if="pdfMode !== 'template' && sessionid !== 'simulator'" class="" style="font-size:12px; width: 90%">
                  <div v-if="witnessButtonLabel !== 'false' && witnessButtonLabel !== false" class="col-md-2 col-lg-2 col-xs-12 q-px-md;" style="text-align: center">
                    Witnesses ({{ witnessButtonLabel }})
                  </div>
                  <template v-for="currentWitness in currentSessionWitnessUsers">
                    <div :key="currentWitness._id + 'first'" class="col-md-2 col-lg-2 col-xs-12 q-px-md">
                      <div :key="currentWitness._id + 'second'" class="col-md-2 col-lg-2 col-xs-12 q-px-sm">
                        <q-icon v-if="joinedAsSessionNotary" name="delete" style="cursor: pointer; color: red; font-size: 20px;float:left" @click="witnessRemoveClicked(currentWitness)">
                          <q-tooltip>
                            Remove witness from this session
                          </q-tooltip>
                        </q-icon>
                        <q-icon v-if="currentWitness.userActive" name="remove_red_eye" style="cursor: pointer; color: blue; font-size: 20px; float: right">
                          <q-tooltip>
                            Witness is Online
                          </q-tooltip>
                        </q-icon>
                      </div>
                      <template v-if="currentWitness.witnessdoc">
                        <strong>{{ currentWitness.witnessdoc.firstName }} {{ currentWitness.witnessdoc.lastName }}</strong>
                      </template>
                      <template v-if="currentWitness.userdoc">
                        <strong> {{ currentWitness.userdoc.name }}</strong>
                      </template>
                    </div>
                  </template>
                </div>
              </div>
              <div v-if="!joinedAsWitness && !($user.role === 'customer' && sessionChargeOnBusinessUser) && !vendorSkipSessionCharges && !$user.skipSessionCharges && !(sessionFullData && sessionFullData.newSessionModelData && sessionFullData.newSessionModelData.skipSessionCharges)" id="notorizationPriceCard" class="q-pa-md mobile-hide" style="margin-bottom: 24px">
                <h2 class="q-my-md hidden-xs" style="font-size:1rem">
                  <span v-if="sessionFullData && sessionFullData.newSessionModelData && sessionFullData.newSessionModelData.sessionType === 'loan_signing'">
                    Cost of eClosing
                  </span>
                  <span v-else>
                    Cost of Notarization
                  </span>
                  <q-icon v-if="joinedAsSessionNotary && $user.memberType !== 'free'" name="add_circle_outline" style="cursor: pointer; color: blue; font-size: 20px; float: right" @click="editCostOfNotarizationClicked">
                    <q-tooltip>
                      Edit Custom Fees for this Session
                    </q-tooltip>
                  </q-icon>
                </h2>
                <div class="columns is-multiline q-pa-sm">
                  <template v-for="tempCost,index in costOfNotarization">
                    <div :key="'tempCostname' + index" class="column is-8 q-pb-md">
                      {{ tempCost.name }}
                    </div>
                    <div :key="'tempCostprice' + index" class="column is-4">{{ tempCost.currency }}{{ tempCost.price }}</div>
                  </template>
                  <div class="column is-8"><strong>Total</strong></div>
                  <div class="column is-4"><strong>{{ finalCostOfNotarization }}</strong></div>
                </div>
              </div>
            </template>
          </div>
          <!-- Pdf Pages -->
          <div class="column is-8 pdfprvbox q-pt-md" style="padding-left:0;padding-right:0; padding-top: 0; overflow: hidden;">
            <div v-if="minimizeWaitingRoomData && joinedAsSessionNotary" id="minimizedLoadingScreen" class="q-pa-md">
              <div style="display: inline-block; font-weight: bold;">
                <template v-if="!waitingRoomChecklist.allPartiesJoined">
                  Waiting for signer to join...
                </template>
                <template v-else-if="inSessionKBAForPrimarySignerFlow">
                  Signer Joined. Identity authentication is in progress.
                </template>
                <template v-else>
                  Signer Joined. Awaiting Video Feed
                </template>
              </div>
              <q-btn flat round color="primary" icon="keyboard_arrow_up" style="display: inline-block; float: right; font-weight: bold; top: -7px; font-size: 18px" padding="xs" @click="minimizeWaitingRoom">
                <q-tooltip>Maximize Waiting Room</q-tooltip>
              </q-btn>
            </div>
            <div v-show="isLoading" style="position:relative; background: white; margin-top: 12px; height: 88vh;">
              <div v-show="isLoading" class="renderer">
                <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
              </div>
            </div>
            <div id="pdf-pages-container" :style="{visibility: isLoading ? 'hidden' : 'visible', height: minimizeWaitingRoomData && joinedAsSessionNotary ? '88vh' : '92vh'}" class="page-container pdf-pages-container" />
          </div>
          <!-- Recipients & Fields -->
          <div
            class="column is-2 pdf-edit-column pdfdrgdrop"
            style="border-left: 1px solid #d6d6d6; padding-left: 0px; padding-right: 0px"
          >
            <div class="fieldheader">Drag & Drop Toolbox</div>
            <div v-for="(field, index) in signatureFields" :key="'userfield' + index" style="border-bottom: 1px solid #d6d6d6;" :style="[selectedDroppableField.name === field.name ? {'background': '#8ce0f5'} : {}]" class="dd-itm" @click="droppableFieldClicked($event, field)">
              <div class="signature-element" draggable="true" @dragstart="startDrag($event, JSON.stringify(field), field.name, field.type, field.placeholder_type, field.placeholder_user, field.placeholder_user_id, field.textToInsert, field.height, field.width)">
                <div class="fieldicon" style="display: inline-block; width: 30px"><q-icon :name="field.icon" style="margin-right: 6px; font-size: 18px;" /></div>
                <div class="fieldtext" style="display: inline-block">{{ field.name }}</div>
              </div>
            </div>
            <q-btn
              v-if="joinedAsSessionNotary"
              icon="copy_all"
              outline
              rounded
              class="q-ma-md dd-itm"
              style="margin-bottom: 36px"
              @click="addNewPage"
            >
              &nbsp; Add Blank Page
            </q-btn>
          </div>
        </template>
        <template v-else>
          <div class="main-loading-block" style="min-width: 100vw;">
            <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
          </div>
        </template>
      </template>
    </template>
    <template v-else>
      Invalid Request ID
    </template>
    <!-- modal for check customer details -->
    <q-dialog v-model="showCheckUserDetailsModal">
      <q-card style="">
        <q-card-section>
          <h5>Check Signer ID</h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div style="font-weight: bold; font-size: 20px">Primary Signer Details</div>
          <div v-if="sessionFullData && sessionFullData.customerUser && sessionFullData.customerUser.email">Primary Signer Email : <b>{{ sessionFullData.customerUser.email }}</b> </div>
          <!-- Add image here -->
          <div v-if="sessionFullData && sessionFullData.customerUser && sessionFullData.customerUser.identityData && sessionFullData.customerUser.identityData.frontPhotoIdUrl" style="text-align: center">
            <img class="icardimg" :src="sessionFullData.customerUser.identityData.frontPhotoIdUrl" alt="Front Image" />
          </div>
          <div v-else-if="userDetailsModalFrontImageUrl" style="text-align: center">
            <img class="icardimg" :src="userDetailsModalFrontImageUrl" alt="Front Image" />
          </div>
          <div v-else>
            Front Image Not Found
          </div>
          <div class="q-pt-sm">
            <div class="">
              Processing Outcome:
              <strong v-if="sessionid === 'simulator'"> Pass</strong>
              <strong v-else>{{ userDetailsModalResponse.workflowOutcome }}</strong>
            </div>
            <div class="">
              Document Verification Result:
              <strong v-if="sessionid === 'simulator'">: Pass</strong>
              <strong v-else>{{ userDetailsModalResponse.documentValidationResult }}</strong>
            </div>
            <div class="">
              Document Expiration Result:
              <strong v-if="sessionid === 'simulator'">: Pass</strong>
              <strong v-else>{{ userDetailsModalResponse.documentExpirationResult }}</strong>
            </div>
            <div class="">
              Identity Authentication:
              <strong v-if="sessionid === 'simulator'">: Pass</strong>
              <strong v-else>{{ userDetailsModalResponse.kbaStatus }}</strong>
            </div>
          </div>
          <!-- <q-table
            :loading="checkUserDetailsModalLoading"
            title="Identification Details"
            :data="userDetailsModalDataRows"
            :columns="userDetailsModalDataColumns"
            :pagination="userDetailsModalDataPagination"
            row-key="displayName"
          /> -->
          <div v-if="multiSignerUserDocs && multiSignerUserDocs.length" class="q-pt-sm">
            <div style="font-weight: bold; font-size: 20px">Additional Signer Details</div>
            <div v-for="multiSignerUserDoc in multiSignerUserDocs" :key="'additionalSigner' + multiSignerUserDoc._id" style="padding-top: 12px;">
              <div>Additional Signer Email: <b>{{ multiSignerUserDoc.email }}</b> </div>
              <div v-if="multiSignerUserDoc.identityData && multiSignerUserDoc.identityData.frontPhotoIdUrl" style="text-align: center">
                <img class="icardimg" :src="multiSignerUserDoc.identityData && multiSignerUserDoc.identityData.frontPhotoIdUrl" alt="Front Image" />
              </div>
              <div v-else-if="otherSignersCheckSignerIdKeyed[multiSignerUserDoc.email] && otherSignersCheckSignerIdKeyed[multiSignerUserDoc.email].frontPhotoIdUrl" style="text-align: center">
                <img class="icardimg" :src="otherSignersCheckSignerIdKeyed[multiSignerUserDoc.email].frontPhotoIdUrl" alt="Front Image" />
              </div>
              <div v-else-if="otherSignersCheckSignerIdKeyed[multiSignerUserDoc.email] && otherSignersCheckSignerIdKeyed[multiSignerUserDoc.email].frontPhotoUrl" style="text-align: center">
                <img class="icardimg" :src="otherSignersCheckSignerIdKeyed[multiSignerUserDoc.email].frontPhotoUrl" alt="Front Image" />
              </div>
              <div v-else>
                Front Image Not Found
              </div>
              <div v-if="otherSignersCheckSignerIdKeyed[multiSignerUserDoc.email]" class="q-pt-sm">
                <div class="">
                  Processing Outcome:
                  <strong v-if="sessionid === 'simulator'"> Pass</strong>
                  <strong v-else>{{ otherSignersCheckSignerIdKeyed[multiSignerUserDoc.email].workflowOutcome }}</strong>
                </div>
                <div class="">
                  Document Verification Result:
                  <strong v-if="sessionid === 'simulator'">: Pass</strong>
                  <strong v-else>{{ otherSignersCheckSignerIdKeyed[multiSignerUserDoc.email].documentValidationResult }}</strong>
                </div>
                <div class="">
                  Document Expiration Result:
                  <strong v-if="sessionid === 'simulator'">: Pass</strong>
                  <strong v-else>{{ otherSignersCheckSignerIdKeyed[multiSignerUserDoc.email].documentExpirationResult }}</strong>
                </div>
                <div class="">
                  Identity Authentication:
                  <strong v-if="sessionid === 'simulator'">: Pass</strong>
                  <strong v-else>{{ otherSignersCheckSignerIdKeyed[multiSignerUserDoc.email].kbaStatus }}</strong>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            v-close-popup
            outline
            class="btn-primary"
            label="Close"
            @click="closeUserDetailsModal()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- modal for customer complete step -->
    <q-dialog v-model="showCustomerThankYouModal">
      <q-card>
        <q-card-section>
          <h5>Session Complete</h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <h2 class="q-pa-sm has-text-centered">{{ showCustomerThankYouModalText }}</h2>
          <div class="q-pa-sm has-text-centered">You will be redirected back to dashboard, in 5 seconds...</div>
        </q-card-section>

        <q-card-actions align="center">
          <q-btn
            v-close-popup
            outline
            label="Back to Dashboard"
            color="primary"
            @click="closeCustomerThankyouModal()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- modal for waiting room -->
    <q-dialog v-if="!minimizeWaitingRoomData" v-model="waitingRoomModalShow">
      <q-card class="q-pa-lg">
        <q-card-section v-if="joinedAsSessionNotary">
          <q-btn flat round color="primary" icon="keyboard_arrow_down" style="display: inline-block; float: right; font-weight: bold; top: -15px; right: -15px; font-size: 18px" @click="minimizeWaitingRoom">
            <q-tooltip>Minimize Waiting Room</q-tooltip>
          </q-btn>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <!-- START signer waiting room -->
          <div class="column is-12 has-text-centered q-pb-lg">
            <img src="https://bluenotary.us/assets/img/meeting-waiting.jpg" />
            <h1 v-if="!joinedAsSessionNotary">Waiting for the notary to join...</h1>
            <h1 v-if="joinedAsSessionNotary">Waiting for the signer to join...</h1>
          </div>
          <!-- END signer waiting room -->
          <div v-if="showNotarizeNowButtonModal" class="q-pa-lg row">
            <div class="col-sm-3">
              <q-icon name="hourglass_bottom" size="4rem" />
            </div>
            <div class="col-sm-9">
              <div class="text-h6">Hmm...</div>
              <div class="text-subtitle2">You've been waiting more than 3 minutes, but it seems the assigned <strong>notary hasn't joined yet.</strong></div>
              <div class="text-subtitle2">You can continue to wait or call for a different notary to pickup your session now.</div>
              <div v-if="showNotarizeNowButtonSuccess" style="font-weight: bold">We have sent out a call to our network of online notaries. A notary will join your session in a moment or two.</div>
              <div class="q-mt-md">
                <q-btn v-if="!showNotarizeNowButtonSuccess" :loading="showNotarizeNowButtonLoading" outline @click="doOpenCallForThisSessionClicked">Call New Notary</q-btn>
              </div>
            </div>
          </div>
          <div class="columns is-multiline">
            <template v-if="inSessionKBAForPrimarySignerFlow && (joinedAsPrimarySigner || joinedAsSessionNotary || joinedAsSecondarySigner)" style="text-align:center">
              <div class="column text-center">
                <template v-if="joinedAsSecondarySigner">
                  <!--  In Session KBA done for Additional Signer -->
                </template>
                <template v-else>
                  <!-- In Session KBA done for Primary Signer -->
                </template>
                <div v-if="!(waitingRoomChecklist.inSessionKBADoneForPrimarySigner) && (joinedAsPrimarySigner || joinedAsSecondarySigner) && (sessionFullData && sessionFullData.newSessionModelData && sessionFullData.newSessionModelData.typeOfKBA === 'foreigners_without_residential')">
                  <q-icon name="fingerprint" size="5rem" color="blue" />
                  <h3>Identity Authentication</h3>
                  <p>We need to do the required identity checks in order to proceed to the session.</p>
                  <q-btn color="primary" label="Start Biometrics" @click="startingPersonaFlow" />
                </div>
                <div v-else-if="!(waitingRoomChecklist.inSessionKBADoneForPrimarySigner) && (joinedAsPrimarySigner || joinedAsSecondarySigner)">
                  <h3>Identity Authentication</h3>
                  <p>We need to do the required identity checks in order to proceed to the session.</p>
                  <q-btn color="primary" label="Start KBA" @click="startingPersonaFlow" />
                </div>
              </div>
            </template>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
    <!-- modal for kba filling -->
    <q-dialog v-model="openModalForInSessionKBA" persistent>
      <q-card class="q-pa-lg">
        <q-card-section class="q-pt-none">
          <div class="columns is-multiline">
            <template v-if="inSessionKBAForPrimarySignerFlow && (joinedAsPrimarySigner || joinedAsSecondarySigner)" style="text-align:center">
              <div class="column text-center">
                <img src="https://bluenotary.us/assets/img/meeting-waiting.jpg" />
                <div v-if="(joinedAsPrimarySigner || joinedAsSecondarySigner) && (sessionFullData && sessionFullData.newSessionModelData && sessionFullData.newSessionModelData.typeOfKBA === 'foreigners_without_residential')">
                  <q-icon name="fingerprint" size="5rem" color="blue" />
                  <h3>Identity Authentication</h3>
                  <p>We need to do the required identity checks in order to proceed to the session.</p>
                  <q-btn color="primary" label="Start Biometrics" @click="startingPersonaFlow" />
                </div>
                <div v-else-if="joinedAsPrimarySigner || joinedAsSecondarySigner">
                  <h3>Identity Authentication</h3>
                  <p>We need to do the required identity checks in order to proceed to the session.</p>
                  <q-btn color="primary" label="Start KBA" @click="startingPersonaFlow" />
                </div>
              </div>
            </template>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- modal for complete pdf loading -->
    <q-dialog v-model="completePDFLoadingModal">
      <q-card>
        <q-card-section>
          <h3>Please wait while we process the session...</h3>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-if="completePDFLoadingDetails.currentFileName">File Name : <b>{{ completePDFLoadingDetails.currentFileName }}</b></div>
          <div>{{ completePDFLoadingDetails.progressText }}</div>
          <q-linear-progress v-if="joinedAsSessionNotary" stripe rounded size="20px" :value="completePDFLoadingDetails.progress" class="q-mt-sm" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- modal for browser incapability -->
    <!-- <q-dialog v-model="browserNotCompatible" persistent>
      <q-card>
        <q-card-section>
          <h3>Please use Chrome browser for notarization sessions</h3>
        </q-card-section>
      </q-card>
    </q-dialog> -->

    <!-- modal for add witness -->
    <add-witness-component
      called-from="pdfedit"
      :sessionid="sessionid"
      :open-add-witness-modal="showAddWitnessModal"
      :close-add-witness-modal="closeAddWitnessModal"
      :disable-add-witness-save-button="disableAddWitnessSaveButton"
      :socket-request="socketRequest"
      :get-session-witness-details="getSessionWitnessDetails"
    />

    <!-- modal for add Additional Signers -->
    <q-dialog v-model="showAddAdditionalSignerModal" persistent>
      <q-card>
        <q-card-section>
          <h5>Add additional signers to this session</h5>
          <p>We'll send an email invite to the signer with instructions on how to join the call.</p>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row">
            <div class="flex column no-margin">
              <div v-for="signerItem in multiSignerList" :key="signerItem.id" class="row" style="margin-top: 8px;">
                <div class="col-10">
                  <q-input v-model="signerItem.email" filled label="Secondary Signer Email" type="email" />
                </div>
                <div class="col-2">
                  <q-btn flat round color="primary" outline icon="highlight_off" style="font-size: 17px" @click="removeSignerEmail(signerItem.id)" />
                </div>
              </div>
              <q-btn color="primary" outline label="Add More" class="q-mt-md" @click="addMoreSignerButton" />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-mb-lg">
          <q-btn rounded outline color="blue" class="q-pa-sm" label="Add Additional Signer" :disable="disableAddSignerSaveButton" @click="addAdditionalSignerSaveClicked" />
          <q-btn v-close-popup outline label="Cancel" @click="addtionalSignerModalClosed" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Witness Deletion Confirmation Modal -->
    <q-dialog v-model="witnessDeleteConfirmationModal" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <div class="q-ml-sm">
            Please confirm the removal of following Witness from Session
            <br />
            Witness Name : <template v-if="witnessDeleteDoc.witnessdoc">
              {{ witnessDeleteDoc.witnessdoc.firstName }} {{ witnessDeleteDoc.witnessdoc.lastName }}
            </template>
            <template v-if="witnessDeleteDoc.userdoc">
              {{ witnessDeleteDoc.userdoc.name }}
            </template>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup outline label="Cancel" color="primary" />
          <q-btn v-close-popup outline label="Remove Witness" color="primary" @click="witnessRemoveDialogClicked" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Witness Deleted From Session Modal shown to Witness -->
    <q-dialog v-model="witnessRemovedFromSessionShownToWitnessModal" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <div class="q-ml-sm">
            Your participation as Witness is no longer required by signing parties.
            <br />
            Thank you for joining.
            <br />
            (Redirecting back to dashboard in 10 seconds)
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- modal for add witness -->
    <q-dialog v-model="editCostOfNotarizationModal" persistent>
      <q-card>
        <q-card-section>
          <h5 class="text-center">Add custom fees for this session</h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-for="customChargeDoc in customChargesEditValues" :key="customChargeDoc.id" class="row q-px-md">
            <div class="col-6">
              <q-input v-model="customChargeDoc.particular" dense filled label="Custom Charge Name" type="string" style="padding-right: 20px;" />
            </div>
            <div class="col-4">
              <q-input v-model="customChargeDoc.amount" dense filled label="Amount (USD)" type="number" />
            </div>
            <div class="col-2">
              <q-btn flat outline color="primary" icon="clear" style="font-size: 17px" @click="removeChargesButton(customChargeDoc.id)" />
            </div>
          </div>
          <q-btn icon="add" outline class="q-ma-md" round @click="addMoreChargesButton()" />
        </q-card-section>
        <q-card-actions align="center" class="q-mb-lg">
          <q-btn rounded outline color="blue" class="q-pa-sm" label="Add/Modify Fees" @click="editCostOfNotarizationSaveClicked" />
          <q-btn v-close-popup outline label="Cancel" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- modal for pdf session turned off -->
    <q-dialog v-model="turnOffPdfSession" persistent>
      <q-card>
        <q-card-section>
          <h3>Due to some technical issues notary sessions are turned off. They will be turned on shortly.</h3>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- modal for pdf session when failed -->
    <q-dialog v-model="failedSession" persistent>
      <q-card>
        <q-card-section>
          <h3>The session has failed during initial stages. You cannot continue. Please create new session</h3>
          <br />
          (Redirecting back to dashboard in 20 seconds)
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- modal for pre session incomplete -->
    <q-dialog v-model="preSessionIncomplete" persistent>
      <q-card>
        <q-card-section>
          <h3>The pre session flow is not completed by primary customer. You cannot continue. Please go back and continue session from dashboard</h3>
          <br />
          (Redirecting back to dashboard in 20 seconds)
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- modal for video recording not working -->
    <q-dialog v-model="videoRecordingFailed" persistent>
      <q-card>
        <q-card-section>
          <h2>Something's not quite right.</h2>
          <h3>The browser and the OS you are using is not recording video for some reason.</h3> <br />
          <h3>BlueNotary requires video to be on and recordable to continue the session.</h3> <br />
          <h3>Please try switching to a different browser or computer for the session.</h3>
          <q-card-actions align="center">
            <q-btn color="blue" outline class="q-pa-sm" label="Confirm" @click="videoRecordingFailedModalConfirmClicked">
              <q-tooltip>You will be redirected back to dashboard</q-tooltip>
            </q-btn>
          </q-card-actions>
        </q-card-section>
      </q-card>
    </q-dialog>
    <!-- infom witness that session is completed -->
    <q-dialog v-model="confirmationSessionDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Session Complete</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <template>
            Thank you. The session is now completed.
          </template>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup outline label="Close" color="primary" @click="redirectTowitness" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- modal for check customer details -->
    <q-dialog v-model="loanSigningInstructionsModal">
      <q-card style="">
        <q-card-section>
          <h5>Loan Signing Instructions</h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <pre v-if="sessionFullData.newSessionModelData && sessionFullData.newSessionModelData.loanSigningExtraFields && sessionFullData.newSessionModelData.loanSigningExtraFields.loan_signing_notes_for_notary">{{ sessionFullData.newSessionModelData.loanSigningExtraFields.loan_signing_notes_for_notary }}</pre>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            v-close-popup
            outline
            class="btn-primary"
            label="Close"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- modal for KBA -->
    <q-dialog v-model="showKBAModal" persistent>
      <q-card style="min-width: 70%; min-height: 70%">
        <q-card-section class="q-pt-none">
          <div class="columns is-multiline" style="margin-top: 6px">
            <template v-if="showKBAModalSection === 'initial'">
              <div
                class="col-12 q-mt-lg q-mb-xl"
                style="width: 100%"
              >
                <div class="">
                  <div class="text-center">
                    <div class="q-pa-md text-center">
                      <h5>Start Identity Verification Process</h5>
                      <div class="text-center">
                        <q-icon name="fingerprint" size="6rem" class="block" />
                        <q-btn class="btn btn-primary block" @click="startKBA">Get Started</q-btn>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template v-if="showKBAModalSection === 'failed'">
              <div
                class="col-12 flex q-mt-lg q-mb-xl"
                style="width: 100%"
              >
                <div class="flex flex-center column">
                  <div class="text-center">
                    <h5 class="q-pa-md">
                      The Identity Authentication did not succeed this time.
                    </h5>
                    <br />
                    <h5>
                      <b>Identity Authentication Failure Reason </b>: {{ kbaModalFailureReason }}
                    </h5>
                    <div class="q-pa-md text-center">
                      <q-btn class="btn q-pa-md" color="red" @click="closeKBASession">Close</q-btn>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-4 flex" />
            </template>
            <template v-if="showKBAModalSection === 'personal_details'">
              <personal-details :called-from-session-page="true" :called-from-session-page-session-id="sessionid" :kba-modal-change-section="kbaModalChangeSection" />
            </template>
            <template v-else-if="showKBAModalSection === 'kba'">
              <k-b-a :called-from-session-page="true" :called-from-session-page-session-id="sessionid" :kba-modal-change-section="kbaModalChangeSection" />
            </template>
            <template v-else-if="showKBAModalSection === 'photoid'">
              <photoid :called-from-session-page="true" :called-from-session-page-session-id="sessionid" :kba-modal-change-section="kbaModalChangeSection" />
            </template>
            <template v-else-if="showKBAModalSection === 'meet_notary'">
              <meet-notary :called-from-session-page="true" :called-from-session-page-session-id="sessionid" :kba-modal-change-section="kbaModalChangeSection" />
            </template>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
    <!-- modal for KBA Status Checking-->
    <q-dialog v-model="showKBAStatusCheckModal">
      <q-card style="min-width: 40%; min-height: 30%">
        <q-card-section>
          <h5>
            Identity Authentication Status of Signers
            <q-btn v-close-popup round label="x" style="float: right" />
          </h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="columns is-multiline" style="margin-top: 6px">
            <div class="column is-4">Primary Signer :</div>
            <div class="column is-8" style="text-decoration: underline">{{ inSessionKBAStageText.primarySigner }}</div>
            <template v-if="inSessionKBAStageText.additionalSigner0 !== false">
              <div class="column is-4">Additional Signer #1 :</div>
              <div class="column is-8" style="text-decoration: underline">{{ inSessionKBAStageText.additionalSigner0 }}</div>
            </template>
            <template v-if="inSessionKBAStageText.additionalSigner1 !== false">
              <div class="column is-4">Additional Signer #2 :</div>
              <div class="column is-8" style="text-decoration: underline">{{ inSessionKBAStageText.additionalSigner1 }}</div>
            </template>
            <template v-if="inSessionKBAStageText.additionalSigner2 !== false">
              <div class="column is-4">Additional Signer #3 :</div>
              <div class="column is-8" style="text-decoration: underline">{{ inSessionKBAStageText.additionalSigner2 }}</div>
            </template>
            <template v-if="inSessionKBAStageText.additionalSigner3 !== false">
              <div class="column is-4">Additional Signer #4 :</div>
              <div class="column is-8" style="text-decoration: underline">{{ inSessionKBAStageText.additionalSigner3 }}</div>
            </template>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
    <!-- modal for Terminating Session -->
    <q-dialog v-model="terminateModalShow">
      <q-card style="min-width: 50%; min-height: 30%">
        <q-card-section>
          <h5>
            Terminate the Session
          </h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="col">
            <h3>
              Please provide reason to terminate session*
            </h3>
            <div class="q-gutter-sm q-mt-sm">
              <div style="max-width: 500px;">
                <q-input
                  v-model="terminateSessionOptions.reason"
                  filled
                  type="textarea"
                  label="Add session termination reason here"
                />
              </div>
            </div>
            <div v-if="sessionFullData && sessionFullData.newSessionModelData && sessionFullData.newSessionModelData.sessionPickedCallForTakingAt" class="" style="padding-top: 12px">
              <h3 class="no-margin"><strong>Do you want to call a new notary for this session?</strong></h3>
              <div class="row doc-list-preview">
                <q-radio v-model="terminateSessionOptions.callNewNotary" val="no" label="No" />
                <q-radio v-model="terminateSessionOptions.callNewNotary" val="yes" label="Yes" />
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup outline label="Cancel" color="grey" />
          <q-btn outline label="Terminate the Session" color="primary" :loading="terminateModalButtonLoading" @click="finalTerminateClicked" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- modal for Resheduling Session -->
    <q-dialog v-model="rescheduleSessionModal">
      <q-card style="min-width: 50%; min-height: 30%">
        <q-card-section>
          <h5>
            Reschedule the Session
            <q-btn v-close-popup round label="x" style="float: right" />
          </h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="col">
            <q-input
              v-model="rescheduleDatetime"
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
              v-model="reschedulemeetingTimeZone"
              filled
              dense
              :options="rescheduleSelectedTimezone"
              label="Select Timezone"
              use-input
              icon="watch_later"
              input-debounce="0"
              :options-dense="true"
              @filter="rescheduleTimezoneFilterFn"
            >
              <template v-slot:prepend>
                <q-icon name="watch_later" />
              </template>
            </q-select>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup outline label="Cancel" color="grey" />
          <q-btn outline label="Reschedule Session" color="primary" :loading="rescheduleSaveButtonLoading" :disable="disableSaveRescheduleSaveButton" @click="rescheduleSaveClicked" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- modal for Selecting Date Time for Reschedule Session -->
    <q-dialog v-model="rescheduleOpenDateTimePickerModal">
      <q-card style="min-width: 70%">
        <q-card-section>
          <div class="text-h6">Select Notarization Date and Time</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-py-md columns is-multiline justify-between">
            <div class="column is-6 col-6 col-md-12 col-sm-12" style="text-align: center">
              <q-date
                v-model="rescheduleDatetime"
                :options="rescheduleOptionsFn"
                mask="YYYY-MM-DD hh:mm A"
                color="primary"
              />
            </div>
            <div class="column is-6 col-6 col-md-12 col-sm-12" style="text-align: center">
              <q-time
                v-model="rescheduleDatetime"
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
    <!-- modal for pdf file not loading error -->
    <q-dialog v-model="pdfNotLoadingError">
      <q-card style="min-width: 50%">
        <q-card-section>
          <div class="text-h6">PDF Not Loading Correctly</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          {{ pdfNotLoadingErrorText }}
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup outline label="Close" color="red" />
          <q-btn v-if="joinedAsSessionNotary" outline label="Add / Edit Files of Session" color="blue" @click="editSesionDocumentsClicked" />
          <q-btn outline label="Reload Page" color="blue" @click="doRefreshPage" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- notary modal awaiting approval of added custom charge -->
    <q-dialog v-model="notaryAwaitingApprovalForUpdatedCustomCharge" persistent>
      <q-card style="min-width: 70%">
        <q-card-section>
          <div class="text-h6">Awaiting approval of updated custom charge</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Custom charge approval has been sent to primary signer. Once primary signer approves the custom charge, it will applied to the session.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup outline label="Revoke Custom Charge" color="red" @click="revokeCustomChargesClicked" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- primary signer modal for approval of added custom charge -->
    <q-dialog v-model="primarySigningApprovalForUpdatedCustomCharge" persistent>
      <q-card style="min-width: 70%">
        <q-card-section>
          <div class="text-h6">Please approve the custom charge for session</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Notary has added a custom charge on the session as mentioned below. Please approve or decline the custom charge for the session.
          <br />
          <template v-for="tempCustomCharge in approvalCustomCharges">
            <div :key="'tempdiv' + tempCustomCharge.id" style="padding-top: 16px">
              Charge Name : {{ tempCustomCharge.particular }}
              <br />
              Amount : ${{ tempCustomCharge.amount }}
            </div>
          </template>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup outline label="Decline" color="red" @click="approvalStatusChangeOnCustomCharge(false)" />
          <q-btn v-close-popup outline label="Approve" color="green" @click="approvalStatusChangeOnCustomCharge(true)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <manage-all-pdf-documents-component :open-modify-all-documents-component-model="manageAllPDFDocumentsModal" :all-document-list="allDocumentList" :sessionid="sessionid" :manage-all-pdf-documents-function="manageAllPdfDocumentsFunction" />
  </div>
</template>

<script>

import Vue from "vue";
import _ from "lodash";
import { date } from "quasar";
import moment from "moment";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import PDFJSWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import {
 PDFDocument, rgb, StandardFonts, PDFTextField
} from "pdf-lib";
import $ from "jquery";
import "jquery-ui/ui/widgets/draggable";
import "jquery-ui/ui/widgets/resizable";
import "jquery-ui/themes/base/resizable.css";
// import "jquery-ui-touch-punch";
import * as io from "socket.io-client";
import WebRTC from "vue-webrtc";
import * as RecordRTC from "recordrtc";
import DetectingMobile from "@/mixins/DetectingMobile";
import PdfUtils from "@/mixins/PdfUtils";
import { OpenVidu } from "openvidu-browser";
import DroppedFieldComponent from "./DroppedFieldComponent.vue";
import AddWitnessComponent from "./AddWitnessComponent.vue";
import ManageAllPdfDocumentsComponent from "../../components/ManageAllPdfDocumentsComponent.vue";
import VueEventBus from "../../plugins/eventbus.js";
import UserVideo from "./UserVideo";

import PersonalDetails from "../customer/personalDetails.vue";
import KBA from "../customer/kba.vue";
import Photoid from "../customer/photoidNew.vue";

window.io = io;
Vue.use(WebRTC);
pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJSWorker;

// const Persona = require("persona");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default {
  name: "PdfEditingComponent",
  components: {
    PersonalDetails,
    KBA,
    Photoid,
    ManageAllPdfDocumentsComponent,
    UserVideo,
    AddWitnessComponent
  },
  mixins: [DetectingMobile, PdfUtils],
  props: {
  },
  data () {
    return {
      sessionid: false,
      isLoading: true,
      docFound: true,
      pdfLoaded: false,
      pdfurl: false,
      docNotFoundError: "",
      SCALE: 1.2,
      SMALL_SCALE: 0.2,
      recipientSignatures: {},
      recipients: [],
      selectedRecipientEmail: "",
      requestId: "testing",
      signatureMethod: "",
      requestDoc: undefined,
      signatureHeight: 30,
      signatureWidth: 100,
      totalPages: 0,
      provider: false,
      currentElementId: 1,
      allDroppedElements: [],
      fieldDroppedIndex: 0,
      allDroppedElementsVueComponents: {},
      allDroppedElementsDocIdWise: {},
      sessionFullData: {},
      realDragStarted: false,
      allImagesData: {},
      videoCallStarted: false,
      notorizationType: [],
      attachCertificate: false,
      showCompleteButton: false,
      showCompleteButtonInfoText: "Atleast 1 Notary Seal is required Per Document to complete the session",
      costOfNotarization: [],
      tempSocketRoomNumberForSimulator: "",
      videoCallRoomNumber: "bnTempSession",
      videoCallSocketUrl: "",
      videoCallPeerOptions: {
        initiator: false,
        config: {
          iceServers: [
            // { urls: "stun:global.stun.twilio.com:3478?transport=udp" },
            { urls: "turn:159.223.165.183:3478", username: "bluenotaryuser", credential: "bluenotaryuserpassword" },
            { urls: "stun:stun.l.google.com:19302" },
          ]
        },
      },
      showCheckUserDetailsModal: false,
      checkUserDetailsModalLoading: false,
      userDetailsModalDataRows: [],
      userDetailsModalDataColumns: [
        { name: "group", label: "Field Group", field: "group" },
        { name: "displayName", label: "Field Name", field: "displayName" },
        {
          name: "value", label: "Field Value", field: "value", style: "font-weight: bold",
        }
      ],
      multiSignerUserDetailsModalData: [],
      userDetailsModalDataPagination: {
        rowsPerPage: 0
      },
      userDetailsModalFrontImageUrl: false,
      userDetailsModalBackImageUrl: false,
      userDetailsModalResponse: {},
      showCustomerThankYouModal: false,
      showCustomerThankYouModalText: "Notary has completed the session",
      outputFileObject: false,
      waitingRoomChecklist: {
        allPartiesJoined: false,
        socketConnectionEstablished: true,
        // socketConnectionEstablished: false,
        screenRecordingStarted: true,
        videoEnabledByAllParties: false,
        inSessionKBADoneForPrimarySigner: false
      },
      currentPageUsers: [],
      currentPageUsersFromVideo: [],
      completePDFClicked: false,
      completePDFLoadingModal: false,
      completePDFLoadingDetails: {
        progress: 0,
        progressText: "",
        currentFileName: false,
      },
      renderingSocketFields: false,
      firstPageViewPort: false,
      emptyPagesAdded: 0,
      emptyPagesAddedDocIdWise: {},
      allNotaryCertificates: [],
      // browserNotCompatible: false,
      sendFullSessionFieldsIfDataFound: false,
      pdfMode: false,
      showAddAdditionalSignerModal: false,
      showAddWitnessModal: false,
      currentWitnessModal: {
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        witnessAdressLine1: "",
        // witnessAdressLine2: "",
        witnessAddressState: "",
        witnessAddressZipCode: "",
      },
      allWitnesses: [],
      witnessSelectionType: "old_witness",
      witnessSelectionOptions: {
        loading: true,
        dataFetched: false,
        data: [],
        selectedValue: []
      },
      currentSessionWitnessUsers: [],
      maxWitnessJoined: 0,
      witnessDeleteConfirmationModal: false,
      witnessRemovedFromSessionShownToWitnessModal: false,
      witnessDeleteDoc: {},
      videoCallSocketIntervalFunction: false,
      videoCallSocketIntervalFunctionForNoConnectivity: false,
      videoRecordingStarted: false,
      videoRecordingStartedInternal: false,
      options: [
        "Acknowledgement", "Jurat", "Oath/Affirmation", "Copy Certification", "Proof of Execution by Subscribing Witness", "Protest", " Signature Witnessing"
      ],
      multiSignerUserDocs: [],
      internetConnectionSpeedTestDone: false,
      internetConnectionSpeedTestErrorShown: false,
      internetConnectionDisconnectSeconds: 60,
      internetConnectionCheckingInterval: false,
      disableAddWitnessSaveButton: false,
      disableAddSignerSaveButton: false,
      disableSaveRescheduleSaveButton: false,
      currentDocumentSelected: "",
      allDocumentList: [],
      allDocumentListKeyedById: {},
      documentFileCacheById: {},
      documentPickerNavigationButtons: {
        prev: false,
        next: false
      },
      documentNagivationTimerEnabled: true,
      isTouchDevice: false,
      selectedDroppableField: {},
      customerTotalFields: 0,
      customerTotalFieldsDataInserted: 0,
      currentHighlightedElementId: "",
      previousHighlightedElementId: "",
      editCostOfNotarizationModal: false,
      customChargesEditValues: [{
        id: "input000",
        particular: "",
        amount: "0"
      }],
      pendingInputs: {
        signatures: 0,
        text: 0
      },
      customChargesModified: false,
      businessUserSubsidizedSession: false,
      minimizeWaitingRoomData: false,
      showNotarizeNowButtonModal: false,
      showNotarizeNowButtonLoading: false,
      showNotarizeNowButtonSuccess: false,
      videoRecordingFailed: false,
      saveDraftInterval: false,
      sessionHeartbeatInterval: false,
      sessionCustomCharges: [],
      confirmationSessionDialog: false,
      sessionChargeOnBusinessUser: false,
      vendorSkipSessionCharges: false,
      vendorChargesPaidToNotaryFromBN: false,
      internalForceParam: false,
      internalForceParamNewConditionY: false,
      failedSession: false,
      preSessionIncomplete: false,
      allDocumentPagesViewports: {},
      otherSignersCheckSignerIdKeyed: {},
      loanSigningInstructionsModal: false,
      personalClientDoc: {},
      inSessionKBAForPrimarySignerFlow: false,
      openModalForInSessionKBA: false,
      showKBAModal: false,
      showKBAModalSection: "personal_details",
      primarySignerJoinedSession: false,
      joinedAsSessionNotary: false,
      joinedAsPrimarySigner: false,
      joinedAsWitness: false,
      joinedAsPOC: false,
      joinedAsSecondarySigner: false,
      joinedAsSecondarySignerIndex: 0,
      inSessionKBAStageText: {
        primarySigner: "Pending",
        additionalSigner0: false,
        additionalSigner1: false,
        additionalSigner2: false,
        additionalSigner3: false
      },
      inSessionKBAStage: {
        primarySigner: ""
      },
      oldMultiSignerList: [
        {
          id: "input0",
          email: ""
        }
      ],
      multiSignerList: [
        {
          id: "input0",
          email: ""
        }
      ],
      userInitials: "",
      showKBAStatusCheckModal: false,
      rescheduleSessionModal: false,
      rescheduleDatetime: "",
      reschedulemeetingTimeZone: "",
      rescheduleSelectedTimezone: [],
      rescheduleTimezoneValues: [],
      rescheduleOpenDateTimePickerModal: false,
      rescheduleSaveButtonLoading: false,
      document2: false,
      sessionDataFetched: false,
      sessionRecordingStartedAt: 0,
      recorderOBJ: null,
      blackMediaStream: null,
      isRecordingStopped: true,
      recordRTCStartTime: 0,
      recordRtcActiveStreams: [],
      notaryAwaitingApprovalForUpdatedCustomCharge: false,
      primarySigningApprovalForUpdatedCustomCharge: false,
      approvalCustomCharges: [],
      manageAllPDFDocumentsModal: false,
      videoSocket: null,
      pdfRenderingCompleted: false,
      lastFullFields: [],
      OV: null,
      session: null,
      mainStreamManager: null,
      publisher: null,
      subscribers: [],
      useOpenVidu: true,
      currentSessionBlueNotaryOpenCall: false,
      sessionDocFetchingRetryCount: 0,
      pdfNotLoadingError: false,
      pdfNotLoadingErrorText: "",
      terminateModalShow: false,
      terminateModalButtonLoading: false,
      terminateSessionOptions: {
        reason: "",
        callNewNotary: "no"
      },
      currentIntervalSyncCancelTokens: {}
    };
  },
  computed: {
    turnOffPdfSession() {
      return this.$user.turnOffPdfSession && !this.$user.testingacc;
    },
    sessionCode() {
      return `#${(this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData._id.substr(this.sessionFullData.newSessionModelData._id.length - 5).toUpperCase()) || "XXXXX"}`;
    },
    finalCostOfNotarization () {
      let finalCost = 0;
      let currencyString = "$";
      _.map(this.costOfNotarization, (cost) => {
        finalCost += parseFloat(cost.price);
        currencyString = cost.currency;
      });
      return currencyString + String(finalCost.toFixed(2));
    },
    witnessButtonLabel() {
      const totalWitnesses = this.currentSessionWitnessUsers.length;
      let activeWitnesses = 0;
      _.map(this.currentSessionWitnessUsers, (currentWitnessDoc) => {
        if (currentWitnessDoc.userActive) {
          activeWitnesses += 1;
        }
      });
      if (totalWitnesses === 0) {
        return false;
      }
      return `${activeWitnesses} / ${totalWitnesses} Active`;
    },
    additionalSignersLabel() {
      const totalAdditionalSigners = this.multiSignerUserDocs.length;
      let activeAdditionalSigner = 0;
      _.map(this.multiSignerUserDocs, (signerUserDoc) => {
        if (signerUserDoc.userActive) {
          activeAdditionalSigner += 1;
        }
      });
      return `${activeAdditionalSigner} / ${totalAdditionalSigners} Active`;
    },
    waitingRoomModalShow() {
      // return false;
      let showWaitingRoom = false;
      if (this.useOpenVidu) {
        return false;
      }
      if (this.hideTheWaitingRoomProperty) {
        return false;
      }
      if (this.sessionid === "simulator" || this.pdfMode === "template") {
        return false;
      }
      if (this.videoRecordingFailed) {
        return false;
      }
      if (this.internalForceParam) {
        return false;
      }
      console.log("this.waitingRoomChecklist", this.waitingRoomChecklist);
      _.map(this.waitingRoomChecklist, (checkListValue) => {
        if (!checkListValue) {
          showWaitingRoom = true;
        }
      });
      if (this.showCustomerThankYouModal) {
        return false;
      }
      if (this.$user.role === "notary" && !this.joinedAsSessionNotary && !this.sessionDataFetched) {
        return false;
      }
      if (showWaitingRoom) {
        this.saveSessionStat({ waiting_room: "Visible" });
      } else {
        this.saveSessionStat({ waiting_room: "Invisible" });
      }
      return showWaitingRoom;
    },
    enableWitnessAddButton() {
      const currentWitnessUsersLength = this.currentSessionWitnessUsers.length;
      if (!this.$user.totalWitnessLimit) {
        return true;
      }
      if (this.$user.totalWitnessLimit > currentWitnessUsersLength) {
        return true;
      }
      return false;
    },
    showRecordingDot() {
      let showRecording = true;
      if (this.sessionid === "simulator" || this.pdfMode === "template" || this.videoRecordingFailed) {
        return false;
      }
      _.map(this.waitingRoomChecklist, (checkListValue) => {
        if (!checkListValue) {
          showRecording = false;
        }
      });
      if (this.useOpenVidu) {
        if (!(this.primarySignerJoinedSession || this.internalForceParam)) {
          showRecording = false;
        }
      }
      return showRecording;
    },
    signatureFields() {
      const allPossibleFields = [
        {
          name: this.$user.name,
          type: "static_text",
          icon: "person",
          height: "25px",
          width: "175px",
          user: ["customer", "notary"]
        },
        {
          name: this.userInitials,
          type: "static_text",
          icon: "person",
          height: "25px",
          width: "50px",
          user: ["customer", "notary"]
        },
        {
          name: moment().format("MM/DD/YYYY"),
          type: "static_text",
          icon: "calendar_today",
          height: "25px",
          width: "100px",
          user: ["customer", "notary"]
        },
        {
          name: "Signature",
          type: "signature",
          icon: "draw",
          height: "50px",
          width: "120px",
          user: ["customer", "notary"]
        },
        {
          name: "Checkmark",
          type: "checkmark",
          icon: "check_box",
          height: "25px",
          width: "25px",
          user: ["customer", "notary"]
        },
        {
          name: "Text",
          type: "input_text",
          icon: "title",
          height: "30px",
          width: "150px",
          user: ["customer", "notary"]
        },
        {
          name: "Notary Seal",
          type: "image",
          image_field_type: "notary_seal",
          icon: "approval",
          user: ["notary"],
          height: "100px",
          width: "300px"
        },
        {
          name: "Notary Certificate",
          type: "notary_certificate",
          icon: "history_edu",
          user: ["notary"],
          height: "400px",
          width: "300px"
        },
        {
          name: "Signer's Full Name",
          textToInsert: (this.sessionFullData && this.sessionFullData.customerUser && this.sessionFullData.customerUser.name) || "Signer's Full Name",
          type: "static_text",
          icon: "person",
          user: ["notary"],
          height: "25px",
          width: "175px"
        },
        {
          name: "Signer's Initial",
          textToInsert: (this.sessionFullData && this.sessionFullData.customerUser && this.sessionFullData.customerUser.first_name && this.sessionFullData.customerUser.last_name && (this.sessionFullData.customerUser.first_name.substring(0, 1).toUpperCase() + this.sessionFullData.customerUser.last_name.substring(0, 1).toUpperCase())) || "Signer's Initial",
          type: "static_text",
          icon: "person",
          user: ["notary"],
          height: "25px",
          width: "50px"
        },
        {
          name: "Signer's Signature",
          type: "placeholder",
          icon: "draw",
          placeholder_type: "signature",
          height: "50px",
          width: "120px",
          user: ["notary"]
        },
        {
          name: "Signer's Free Text",
          type: "placeholder",
          icon: "title",
          placeholder_type: "input_text",
          height: "30px",
          width: "150px",
          user: ["notary"]
        },
        {
          name: "Witness Signature",
          type: "placeholder",
          icon: "draw",
          placeholder_type: "signature",
          placeholder_user: "witness",
          height: "50px",
          width: "120px",
          user: ["notary"],
          condition: "witness_present"
        },
        {
          name: "Whiteout Block",
          type: "whiteout",
          icon: "clear",
          user: ["notary"],
          height: "50px",
          width: "120px"
        },
      ];

      if (this.sessionFullData?.notaryUser?.county) {
        allPossibleFields.splice(8, 0, {
          name: "Notary County",
          type: "static_text",
          textToInsert: this.sessionFullData.notaryUser.county,
          icon: "person",
          user: ["notary"],
          height: "25px",
          width: "150px",
        });
      }
      if (this.sessionFullData?.notaryUser?.state) {
        allPossibleFields.splice(8, 0, {
          name: "Notary State",
          type: "static_text",
          textToInsert: this.sessionFullData.notaryUser.state,
          icon: "balcony",
          user: ["notary"],
          height: "25px",
          width: "100px",
        });
      }
      if (this.sessionFullData?.notaryDatasDoc?.commissionExpiresOn) {
        allPossibleFields.splice(8, 0, {
          name: "Commission Date",
          type: "static_text",
          textToInsert: moment.unix(this.sessionFullData.notaryDatasDoc.commissionExpiresOn).format("DD/MM/YYYY"),
          icon: "calendar_today",
          user: ["notary"],
          height: "25px",
          width: "100px",
        });
      }
      const signatureFields = _.compact(_.map(allPossibleFields, (possibleField) => {
        let showField = possibleField.user.indexOf(this.$user.role) !== -1 && !this.joinedAsWitness;
        if (this.$user.role === "customer" && this.pdfMode === "template") {
          showField = possibleField.user.indexOf("notary") !== -1;
        }
        if (showField && showField.image_type === "notary_seal") {
          if (!this.allImagesData.notarySealImage) {
            return false;
          }
        }
        if (this.joinedAsWitness && possibleField.user.includes("customer")) {
          showField = true;
        }
        if (!showField) {
          return false;
        }
        if (this.$user.role === "customer" && this.pdfMode === "template") {
          if (possibleField.name === this.$user.name) {
            possibleField.name = "Notary Name";
          }
          if (possibleField.name === this.userInitials) {
            possibleField.name = "Notary Initials";
          }
        }
        if (possibleField.image_field_type === "notary_seal") {
          if (this.allImagesData.notarySealImage) {
            this.getMeta(
              this.allImagesData.notarySealImage,
              (width, height) => {
                if (width && height) {
                  const aspectRatio = width / height;
                  possibleField.width = `${100 * aspectRatio}px`;
                }
              }
            );
          }
        }
        if (possibleField.condition === "witness_present" && !this.currentSessionWitnessUsers?.length) {
          return false;
        }
        return possibleField;
      }));
      return signatureFields;
    },
    webrtcVideosList() {
      return this.$refs.webrtc && this.$refs.webrtc.videoList;
    },
    markSessionCompleteAsNonDisabled() {
      return this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.markSessionCompleteAsNonDisabled;
    },
    hideTheWaitingRoomProperty() {
      return this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.hideTheWaitingRoom;
    },
    disableCompleteButton() {
      if (this.markSessionCompleteAsNonDisabled) {
        return false;
      }
      if (this.internalForceParam) {
        return false;
      }
      if (this.useOpenVidu) {
        if (!(this.internalForceParam || this.primarySignerJoinedSession) && this.sessionid !== "simulator") {
          return true;
        }
      }
      if (!this.showCompleteButton) {
        return true;
      }
      if (this.minimizeWaitingRoomData) {
        return true;
      }
      if (this.waitingRoomModalShow) {
        return true;
      }
      return false;
    },
    showSaveAndCancelButton() {
      // v-if="joinedAsSessionNotary && pdfMode !== 'template' && !joinedAsWitness && sessionid !== 'simulator' && !(waitingRoomChecklist.allPartiesJoined || primarySignerJoinedSession)"
      if (!(this.joinedAsSessionNotary && this.pdfMode !== "template" && !this.joinedAsWitness && this.sessionid !== "simulator")) {
        return false;
      }
      if (this.useOpenVidu && this.primarySignerJoinedSession) {
        return false;
      }
      if (!this.useOpenVidu && this.waitingRoomChecklist.allPartiesJoined) {
        return false;
      }
      return true;
    }
  },
  watch: {
    internetConnectionSpeedTestErrorShown: {
      handler(value) {
        if (value) {
          this.internetConnectionCheckingInterval = setInterval(() => {
            this.internetConnectionDisconnectSeconds -= 1;
            console.log("network this.internetConnectionDisconnectSeconds", this.internetConnectionDisconnectSeconds);
            if (this.internetConnectionDisconnectSeconds <= 0) {
              this.$q.notify({
                message: "Redirecting to homepage due to your bad network connectivity",
                color: "red"
              });
              this.internetConnectionDisconnectSeconds = 60;
              clearInterval(this.internetConnectionCheckingInterval);
              this.endVideoCall();
              if (this.$user.role === "notary") {
                this.$router.replace("/notary/my-sessions");
              } else {
                this.$router.replace("/business");
              }
            }
          }, 1000);
        } else {
          this.internetConnectionDisconnectSeconds = 60;
          clearInterval(this.internetConnectionCheckingInterval);
        }
      }
    },
     pdfRenderingCompleted: {
      handler(value) {
        if (value && this.lastFullFields && this.lastFullFields.length > 0) {
          _.map(this.allDroppedElements, (localDroppedElement) => {
            if (!localDroppedElement) {
              return;
            }
            this.deleteBox($(`#signature-element${localDroppedElement.elementId}`), localDroppedElement.elementId, false);
          });
          this.allDroppedElements = [];

          let fieldIndex = 0;
          _.map(this.lastFullFields, (droppedElement) => {
            if (!droppedElement) {
              return;
            }
            this.createNewSignatureElement(droppedElement, fieldIndex, true);
            fieldIndex += 1;
          });
        }
      }
     },
     allDroppedElements: {
       handler(value) {
         console.log("value changed in dropped elements", value);
          // value = _.uniqBy(value, "elementId");
          this.allDroppedElementsDocIdWise[this.currentDocumentSelected._id] = value;
          console.log("this.allDroppedElementsDocIdWise", this.allDroppedElementsDocIdWise);
          if (this.pdfMode === "template") {
            this.showCompleteButton = true;
          }
          this.recalculateDroppedElementsNextPreviousData();
       },
       deep: true
     },
     allDroppedElementsDocIdWise: {
       handler() {
         this.recalculateSessionCostAndCompleteButtonData();
       },
       deep: true
     },
     minimizeWaitingRoomData: {
       handler() {
         this.recalculateSessionCostAndCompleteButtonData();
       }
     },
     emptyPagesAdded: {
       handler(value) {
         this.emptyPagesAddedDocIdWise[this.currentDocumentSelected._id] = value;
       }
     },
     hideTheWaitingRoomProperty: {
       handler(value) {
         if (value) {
           this.minimizeWaitingRoomData = false;
         }
       }
     },
     "waitingRoomChecklist.videoEnabledByAllParties": {
       handler(value) {
         console.log("value changed handler called", value);
         console.log("handler called");
         if (value) {
           this.waitingRoomChecklist.allPartiesJoined = true;
         }
       }
     },
     completePDFLoadingModal: {
      handler(value) {
        if (value) {
          window.onbeforeunload = () => "";
          if (this.joinedAsSessionNotary) {
            this.socketRequest("session_completion_started");
          }
        } else {
          window.onbeforeunload = null;
          if (this.joinedAsSessionNotary) {
            this.socketRequest("session_completion_finished");
          }
        }
      }
    },
    waitingRoomModalShow: {
      handler(value) {
        console.log("value", value);
        console.log("this.videoRecordingStarted", this.videoRecordingStarted);
        console.log("this.minimizeWaitingRoomData", this.minimizeWaitingRoomData);
        if (!value && !this.videoRecordingStarted) {
          this.startVideoRecording();
        }

        if (!this.isRecordingStopped) {
          if (value) {
            this.pauseStreamsRecording();
          } else if (!value) {
            this.resumeStreamsRecording();
          }
        }

        if (!value) {
          this.minimizeWaitingRoomData = false;
          this.saveSessionStat({ waiting_room: "Invisible" });
        }
        this.recalculateSessionCostAndCompleteButtonData();
      }
    },
    currentDocumentSelected: {
      handler(value) {
        this.documentNagivationTimerEnabled = false;
        setTimeout(() => {
          this.documentNagivationTimerEnabled = true;
        }, 10000);
        let documentIndex = false;
        let localIndex = 0;
        _.map(this.allDocumentList, (tempDocumentDoc) => {
          if (tempDocumentDoc._id === value._id) {
            documentIndex = localIndex;
          }
          localIndex += 1;
        });
        if (documentIndex === 0) {
          this.documentPickerNavigationButtons.prev = false;
        } else {
          this.documentPickerNavigationButtons.prev = true;
        }
        if (documentIndex === this.allDocumentList.length - 1) {
          this.documentPickerNavigationButtons.next = false;
        } else {
          this.documentPickerNavigationButtons.next = true;
        }
        if (this.currentDocumentSelected && this.currentDocumentSelected.url) {
          this.pdfUrl = this.currentDocumentSelected.url;
        }
        if (this.currentDocumentSelected && this.currentDocumentSelected.documentUrl) {
          this.pdfUrl = this.currentDocumentSelected.documentUrl;
        }

        if (this.sessionid !== "simulator") {
          // reason to check and retry was sometimes you will get image file instead
          // of pdf one becasue it is still in processing to get converted to pdf
          // and user has pressed pre-tag button a second after inviting signer, hence
          // application will crash.
          if (this.pdfUrl.indexOf(".pdf") !== -1) {
            this.renderPdf(JSON.parse(JSON.stringify(this.currentDocumentSelected)));
            this.allDroppedElements = this.allDroppedElementsDocIdWise[this.currentDocumentSelected._id] || [];
            this.socketRequest("current_selected_document_changed", {
              currentSelectedDocumentId: this.currentDocumentSelected._id
            });
            this.emptyPagesAdded = this.emptyPagesAddedDocIdWise[this.currentDocumentSelected._id] || 0;
          } else {
            console.log("did not get valid document url, refetching session doc after 5000, incorrect url recived: ", this.pdfUrl);
            if (this.sessionDocFetchingRetryCount < 4) {
              this.fetchSessionDocWithDelay(5000);
              this.sessionDocFetchingRetryCount += 1;
            } else {
              console.log("Getting invalid file even after 10 retries. Stopping retry.");
              // you can increase retry if you want but 10 times should be enough
              // Add error modal or something here, since we have not recived valid file format
              // even after retries we have to show user error modal.
              this.pdfLoaded = true;
              this.pdfNotLoadingError = true;
              this.pdfNotLoadingErrorText = "The current file is not a correct pdf file which can be used for signing. Please upload correct pdf file for session or reload the session if you believe correct pdf file was used in session.";
            }
          }
        } else {
          this.renderPdf(JSON.parse(JSON.stringify(this.currentDocumentSelected)));
          this.allDroppedElements = this.allDroppedElementsDocIdWise[this.currentDocumentSelected._id] || [];
          this.socketRequest("current_selected_document_changed", {
            currentSelectedDocumentId: this.currentDocumentSelected._id
          });
          this.emptyPagesAdded = this.emptyPagesAddedDocIdWise[this.currentDocumentSelected._id] || 0;
        }
      }
    },
    videoCallStarted: {
      handler(value) {
        if (this.sessionid !== "simulator") {
          const status = (value && !this.videoRecordingFailed) ? "On" : "Off";
          this.saveSessionStat({ video_cam: status });
        }
      }
    },
    webrtcVideosList: {
      handler() {
        this.recalculateSessionCostAndCompleteButtonData();
      },
      deep: true
    },
    subscribers: {
      handler(subscribersValue) {
        console.log("subscribersValue", subscribersValue);
        const allTempUsers = [String(this.$user._id)];
        _.map(subscribersValue, (tempSub) => {
          let dataToUse = _.cloneDeep(tempSub?.stream?.connection?.data);
          if (dataToUse && _.isString(dataToUse)) {
            try {
              dataToUse = JSON.parse(dataToUse);
            } catch (error) {
              console.log("error", error);
              try {
                dataToUse = eval(dataToUse);
              } catch (error2) {
                console.log("error2", error2);
              }
            }
          }
          try {
            if (dataToUse?.userId && !_.includes(allTempUsers, String(dataToUse?.userId))) {
              allTempUsers.push(String(dataToUse?.userId));
            }
          } catch (error) {
            console.log("trycatch error");
          }
        });
        console.log("allTempUsers", allTempUsers);
        const newUsers = _.difference(allTempUsers, this.currentPageUsers);
        console.log("newUsers", newUsers);
        this.usersChangedInSession(allTempUsers, newUsers);
        if (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.userId && allTempUsers.includes(this.sessionFullData.newSessionModelData.userId)) {
          this.primarySignerJoinedSession = true;
        } else {
          this.primarySignerJoinedSession = false;
        }
        if (allTempUsers && allTempUsers.length >= 2) {
          if (this.$user.role === "customer" && !(this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.notaryUserId)) {
            this.fetchSessionDoc();
          }
          if (!this.useOpenVidu) {
            this.waitingRoomChecklist.videoEnabledByAllParties = true;
            this.waitingRoomChecklist.allPartiesJoined = true; // Temp thing
          }
          this.startVideoRecording();
        } else if (!this.useOpenVidu) {
            this.waitingRoomChecklist.videoEnabledByAllParties = false;
          }
        this.recalculateSessionCostAndCompleteButtonData();
      },
      // deep: true
    }
  },
  async mounted () {
    // if (navigator.userAgent.search("Firefox") > -1) {
    //   this.browserNotCompatible = true;
    // }
    window.removeEventListener("beforeunload", () => {});
    this.videoSocket = io.connect(window.socketURL, {
      query: {},
      path: "/video_stream_sock/",
      transports: ["websocket"],
      reconnectionDelay: 30000,
      reconnectionDelayMax: 40000,
      reconnectionAttempts: 20
    });
    this.videoSocket.on("connect", () => {
      console.log("videoSocket connected?", this.videoSocket.connected);
    });
    this.videoSocket.on("disconnect", () => {
      console.log("videoSocket disconnected?", this.videoSocket.disconnected);
    });
    console.log("this.$route.params", this.$route.query);
    this.internalForceParam = (this.$route.query && this.$route.query.internalForceParam) || false;
    this.internalForceParamNewConditionY = (this.$route.query && this.$route.query.internalForceParamNewConditionY) || false;
    this.document2 = (this.$route.query && this.$route.query.document2) || false;
    this.saveUserDetails();
    const videoTypes = ["webm", "ogg", "mp4", "x-matroska"];
    const audioTypes = ["webm", "ogg", "mp3", "x-matroska"];
    const codecs = ["should-not-be-supported", "vp9", "vp9.0", "vp8", "vp8.0", "avc1", "av1", "h265", "h.265", "h264", "h.264", "opus", "pcm", "aac", "mpeg", "mp4a"];

    const supportedVideos = this.getSupportedMimeTypes("video", videoTypes, codecs);
    const supportedAudios = this.getSupportedMimeTypes("audio", audioTypes, codecs);

    console.log("-- Top supported Video : ", supportedVideos[0]);
    console.log("-- Top supported Audio : ", supportedAudios[0]);
    console.log("-- All supported Videos : ", supportedVideos);
    console.log("-- All supported Audios : ", supportedAudios);
    this.isTouchDevice = !!("ontouchstart" in window);
    this.sessionid = (this.$route.params && this.$route.params.id) || false;
    if (this.$route.query.mode) {
      this.pdfMode = this.$route.query.mode;
      if (this.pdfMode === "template") {
        this.showCompleteButton = true;
      }
    }

    if (this.sessionid === "simulator") {
      this.disableAddWitnessSaveButton = true;
      this.disableAddSignerSaveButton = true;
      this.disableSaveRescheduleSaveButton = true;
    }

    if (this.$route.query.witness) {
      try {
        const dataToSave = {
          sessionid: this.sessionid
        };
        const urlToUse = "session/joinSessionAsWitness";
        const response = await Vue.axios.post(urlToUse, dataToSave);
        console.log(response);
        this.$q.notify({
          color: "primary",
          position: "bottom",
          message: "Successfully joined as Witness. Loading PDF Session",
        });
      } catch (error) {
        return;
      }
      this.joinedAsWitness = true;
    }
    this.videoCallSocketUrl = "/";
    if (window.location && window.location.host === "localhost:8080") {
      this.videoCallSocketUrl = "localhost:3002";
    }
    if (this.sessionid) {
      window.currentSessionId = this.sessionid;
      if (!await this.fetchSessionDoc()) {
        return;
      }
    }
    if (this.useOpenVidu) {
      this.waitingRoomChecklist = {
        allPartiesJoined: true,
        socketConnectionEstablished: true,
        screenRecordingStarted: true,
        videoEnabledByAllParties: true,
        inSessionKBADoneForPrimarySigner: true
      };
    } else if (this.joinedAsSessionNotary && !(this.pdfMode === "template" || this.sessionid === "simulator") && !this.hideTheWaitingRoomProperty) {
      this.minimizeWaitingRoomData = true;
    }
    if (this.hideTheWaitingRoomProperty && !this.videoRecordingStarted) {
      this.startVideoRecording();
    }
    clearInterval(this.internetConnectionCheckingInterval);
    // this.startVideoRecording();
    if (!this.pdfUrl) {
      this.$q.notify({
        message: "Session Document Not Found. Please try again.",
        color: "red"
      });
      return;
    }
    // this.renderPdf(JSON.parse(JSON.stringify(this.currentDocumentSelected)));
    try {
      if (this.$user.first_name && this.$user.last_name) {
        this.userInitials = this.$user.first_name.substring(0, 1).toUpperCase() + this.$user.last_name.substring(0, 1).toUpperCase();
      } else {
        const rgx = new RegExp(/(\p{L}{1})\p{L}+/, "gu");
        let initials = [...this.$user.name.matchAll(rgx)] || [];
        initials = (
          (initials.shift()?.[1] || "") + (initials.pop()?.[1] || "")
        ).toUpperCase();
        this.userInitials = initials;
      }
    } catch (error) {
      console.log("ERROR IN INITIAL NAME CALCUATIO", error);
    }
    VueEventBus.$on("SOCKET_UPDATES", async (socketData) => {
      console.log("socketData", JSON.parse(JSON.stringify(socketData)));
      if (socketData.sessionid === this.sessionid) {
        if (typeof socketData.event !== "undefined") {
          if (socketData.event === "dropped_field_updates") {
            const { updatedField } = socketData;
            if (!updatedField) {
              return;
            }
            let fieldFound = false;
            let fieldFoundIndex = false;
            // let counter = 0;
            this.allDroppedElements = _.compact(this.allDroppedElements);
            _.map(this.allDroppedElements, (localDroppedElement) => {
              if (localDroppedElement.elementId === updatedField.elementId) {
                fieldFound = true;
                fieldFoundIndex = localDroppedElement.fieldDroppedIndex;
              }
              // counter += 1;
            });
            if (!_.isEqual(this.allDroppedElements[fieldFoundIndex], updatedField)) {
              console.log(fieldFound, updatedField, this.allDroppedElements[fieldFoundIndex], this.allDroppedElements[fieldFoundIndex] === updatedField, _.isEqual(this.allDroppedElements[fieldFoundIndex], updatedField));
              if (fieldFound) {
                console.log($(`#signature-element${updatedField.elementId}`));
                this.deleteBox($(`#signature-element${updatedField.elementId}`), updatedField.elementId, false);
                if (!updatedField.removed) {
                  this.createNewSignatureElement(updatedField, fieldFoundIndex, true);
                }
              } else {
                this.createNewSignatureElement(updatedField, false, true);
              }
            }
          }
          if (socketData.event === "partial_dropped_field_updates") {
            const { partialUpdatedField } = socketData;
            if (!((partialUpdatedField?.imageData || partialUpdatedField?.inputTextValue) && partialUpdatedField?.elementId)) {
              return;
            }
            console.log("inside partial");
            this.allDroppedElements = _.compact(this.allDroppedElements);
            _.map(this.allDroppedElements, (localDroppedElement) => {
              if (localDroppedElement.elementId === partialUpdatedField.elementId) {
                console.log("partial check passed");
                if (partialUpdatedField?.imageData) {
                  localDroppedElement.imageData = partialUpdatedField?.imageData;
                }
                if (partialUpdatedField?.inputTextValue) {
                  localDroppedElement.inputTextValue = partialUpdatedField?.inputTextValue;
                }
              }
            });
          }
          if (socketData.event === "session_terminated") {
            if (socketData.userId !== this.$user._id) {
              this.endVideoCall();
              this.$router.replace("/business");
              this.$q.notify({
                message: "Session has been terminated by the Notary.",
                color: "black"
              });
            }
          }
          if (socketData.event === "session_completion_started") {
            if (socketData.userId !== this.$user._id) {
              this.completePDFLoadingModal = true;
            }
          }
          if (socketData.event === "session_completion_finished") {
            if (socketData.userId !== this.$user._id) {
              this.completePDFLoadingModal = false;
            }
          }
          if (socketData.event === "kba_status_changed") {
            console.log("socketData", socketData);
            if (this.joinedAsSessionNotary) {
              const { userType, sectionName } = socketData;
              console.log("socketData userType", userType, sectionName);
              if (userType && sectionName) {
                this.inSessionKBAStage[userType] = sectionName;
                if (userType === "primarySigner" && sectionName === "meet_notary") {
                  this.waitingRoomChecklist.inSessionKBADoneForPrimarySigner = true;
                }
                this.getKBAStatusNameFromStageName();
              }
            }
          }
          if (socketData.event === "session_completed") {
            if (socketData.userId !== this.$user._id) {
              this.showCustomerThankYouModal = true;
              this.$q.notify({
                message: "Session is Completed by Notary",
                color: "black"
              });
              setTimeout(() => {
                this.endVideoCall();
                if (this.joinedAsWitness) {
                  this.$router.replace("/witnessSuccess");
                } else {
                  this.$router.replace(`/business?confirmationSession=${this.sessionid}&paymentDone=success`);
                }
              }, 7000);
            }
          }
          if (socketData.event === "session_completed_payment_failed") {
            if (socketData.userId !== this.$user._id) {
              this.showCustomerThankYouModal = true;
              this.showCustomerThankYouModalText = "Session is Completed by Notary. Payment from your end has failed. Please re-enter payment details to view the completed PDF.";
              this.$q.notify({
                message: "Session is Completed by Notary. Payment from your end has failed. Please re-enter payment details to view the completed PDF.",
                color: "black"
              });
              setTimeout(() => {
                this.endVideoCall();
                this.$router.replace(`/business?confirmationSession=${this.sessionid}&paymentDone=failure`);
              }, 7000);
            }
          }
          if (socketData.event === "join_success") {
            if (socketData.userId === String(this.$user._id)) {
              this.waitingRoomChecklist.socketConnectionEstablished = true;
            }
          }
          if (socketData.event === "session_witness_management_changed") {
            this.getSessionWitnessDetails();
          }
          if (socketData.event === "manually_fetch_session_data") {
            if (socketData.userId !== String(this.$user._id)) {
              await this.fetchSessionDoc();
            }
          }
          if (socketData.event === "manually_refresh_session_data") {
            if (socketData.userId !== String(this.$user._id)) {
              this.doRefreshPage();
            }
          }
          if (socketData.event === "current_session_users") {
            const newUsers = _.difference(socketData.finalUserIds, this.currentPageUsers);
            console.log("newUsers", newUsers);
            this.usersChangedInSession(socketData.finalUserIds, newUsers);
          }
          if (socketData.event === "video_capture_started") {
            if (this.$user.role !== "notary") {
              // this.waitingRoomChecklist.screenRecordingStarted = true;
            }
          }
          if (socketData.event === "video_capture_stopped") {
            if (this.$user.role !== "notary") {
              // this.waitingRoomChecklist.screenRecordingStarted = false;
            }
          }
          if (socketData.event === "new_page_added") {
            if (this.$user.role !== "notary" || this.joinedAsWitness) {
              this.addNewPage();
            }
          }
          if (socketData.event === "session_witness_removed") {
            if (socketData.removedUserId === String(this.$user._id)) {
              console.log("inside");
              this.witnessRemovedFromSessionShownToWitnessModal = true;
              setTimeout(() => {
                this.endVideoCall();
                this.$router.replace("/business");
                this.$q.notify({
                  message: "Witness Removed from Session. Thank you for joining in.",
                  color: "black"
                });
              }, 5000);
            }
          }
          if (socketData.event === "current_selected_document_changed") {
            if (socketData.userId !== String(this.$user._id) && socketData.currentSelectedDocumentId !== this.currentDocumentSelected._id) {
              this.currentDocumentSelected = this.allDocumentListKeyedById[socketData.currentSelectedDocumentId] || {};
              this.emptyPagesAdded = this.emptyPagesAddedDocIdWise[this.currentDocumentSelected._id] || 0;
              this.$q.notify({
                message: "Signing File Changed by Notary",
              });
            }
          }
          if (socketData.event === "custom_charges_modified_sent_for_approval") {
            if (this.joinedAsPrimarySigner) {
              const {
                customChargesEditValues
              } = socketData;
              console.log(socketData);
              this.approvalCustomCharges = customChargesEditValues;
              this.primarySigningApprovalForUpdatedCustomCharge = true;
            }
          }
          if (socketData.event === "custom_charges_modified") {
            if (socketData.userId !== String(this.$user._id)) {
              const {
                customChargesEditValues
              } = socketData;
              console.log(socketData);
              this.primarySigningApprovalForUpdatedCustomCharge = false;
              this.customChargesEditValues = customChargesEditValues;
              this.customChargesModified = true;
              this.allDroppedElements.push(false);
            }
          }
          if (socketData.event === "custom_charges_modified_approval_updates") {
            if (this.joinedAsSessionNotary) {
              const {
                customChargesEditValues,
                customChargesEditValuesApprovalValue
              } = socketData;
              console.log(socketData);
              this.notaryAwaitingApprovalForUpdatedCustomCharge = false;
              if (customChargesEditValuesApprovalValue === false || customChargesEditValuesApprovalValue === "false") {
                this.customChargesEditValues = [];
                this.$q.notify({
                  color: "danger",
                  position: "bottom-right",
                  message: "Custom Charges Updation declined by Primary Signer",
                  timeout: 10000
                });
                const dataToSend = {
                  sessionid: this.sessionid,
                  user: this.$user._id,
                  customChargesEditValues: this.customChargesEditValues,
                  customChargesModified: true
                };
                window.currentSocket.emit("custom_charges_modified", dataToSend, (res) => {
                  console.log(res);
                });
              } else {
                this.customChargesEditValues = customChargesEditValues;
                this.approvalCustomCharges = JSON.parse(JSON.stringify(customChargesEditValues));
                this.$q.notify({
                  color: "success",
                  position: "bottom-right",
                  message: "Custom Charges Updation approved by Primary Signer",
                  timeout: 5000
                });
                const dataToSend = {
                  sessionid: this.sessionid,
                  user: this.$user._id,
                  customChargesEditValues: this.customChargesEditValues,
                  customChargesModified: true
                };
                window.currentSocket.emit("custom_charges_modified", dataToSend, (res) => {
                  console.log(res);
                });
              }
              this.allDroppedElements.push(false);
            }
          }
          if (socketData.event === "full_session_fields") {
            if (socketData.userId !== String(this.$user._id)) {
              const { fullFields, emptyPagesAdded } = socketData;
              this.lastFullFields = JSON.parse(JSON.stringify(fullFields));
              if (!this.renderingSocketFields) {
                this.renderingSocketFields = true;
                setTimeout(() => {
                  if (emptyPagesAdded > this.emptyPagesAdded) {
                    const totalExtraNewPages = emptyPagesAdded - this.emptyPagesAdded;
                    for (let pagenum = 0; pagenum < totalExtraNewPages; pagenum += 1) {
                      this.totalPages += 1;
                      const currentPage = this.totalPages;
                      const pdfContainer = document.getElementById("pdf-pages-container");
                      const newCanvas = this.getNewCanvas(currentPage, this.firstPageViewPort);
                      $(newCanvas).css("background-color", "white");
                      const canvasContainer = this.getNewCanvasContainer(currentPage, "page");
                      canvasContainer.append(newCanvas);
                      pdfContainer.append(canvasContainer);
                    }
                    this.emptyPagesAdded = emptyPagesAdded;
                  }
                  setTimeout(() => {
                    console.log("fullFields", fullFields);
                    _.map(this.allDroppedElements, (localDroppedElement) => {
                      if (!localDroppedElement) {
                        return;
                      }
                      this.deleteBox($(`#signature-element${localDroppedElement.elementId}`), localDroppedElement.elementId, false);
                    });
                    this.allDroppedElements = [];

                    let fieldIndex = 0;
                    _.map(fullFields, (droppedElement) => {
                      if (!droppedElement) {
                        return;
                      }
                      this.createNewSignatureElement(droppedElement, fieldIndex, true);
                      fieldIndex += 1;
                    });
                  }, 2000);
                }, 2000);
              }
            }
          }
          if (socketData.event === "reload_user_session") {
            if (socketData.role === this.$user.role || socketData.role === "both") {
              this.doRefreshPage();
            }
          }
        }
      }
    });
    VueEventBus.$on("SOCKET_RECONNECTED", () => {
      this.socketRequest("leave_session");
      setTimeout(() => {
      this.socketRequest("join_session");
      }, 2000);
    });
    VueEventBus.$on("REMOVE_ELEMENT", (elementId) => {
      this.deleteBox($(`#signature-element${elementId}`), elementId, true);
    });
    this.socketRequest("join_session");
    setTimeout(() => {
      this.startVideoCall();
      this.checkVideoRecording();
    }, 2000);
    window.onresize = _.debounce(this.resizeEvent, 100);
    if (!(this.pdfMode === "template" || this.sessionid === "simulator") && !this.useOpenVidu) {
      if (this.videoCallSocketIntervalFunction) {
        clearInterval(this.videoCallSocketIntervalFunction);
      }
      this.videoCallSocketIntervalFunction = setInterval(() => {
        if (this.waitingRoomChecklist.allPartiesJoined && !this.waitingRoomChecklist.videoEnabledByAllParties) {
          if (!this.$refs.webrtc) {
            console.log("webrtc not defined 25s");
            return;
          }
          this.$refs.webrtc.leave();
          setTimeout(() => {
            this.$refs.webrtc.join();
          }, 4000);
        }
      }, 25000);
      if (this.videoCallSocketIntervalFunctionForNoConnectivity) {
        clearInterval(this.videoCallSocketIntervalFunctionForNoConnectivity);
      }
      this.videoCallSocketIntervalFunctionForNoConnectivity = setInterval(() => {
        if (!this.waitingRoomChecklist.allPartiesJoined && !this.waitingRoomChecklist.videoEnabledByAllParties) {
          if (!this.$refs.webrtc) {
            console.log("webrtc not defined 40s");
            return;
          }
          this.$refs.webrtc.leave();
          setTimeout(() => {
            this.$refs.webrtc.join();
          }, 4000);
        }
      }, 40000);
    }
    let extraChargesDocs = [];
    if (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.sessionType && this.sessionFullData.notaryUser.notaryCustomCharges) {
      extraChargesDocs = this.sessionFullData.notaryUser.notaryCustomCharges[this.sessionFullData.newSessionModelData.sessionType] || [];
    }
    // else {
    //   extraChargesDocs = (this.sessionFullData && this.sessionFullData.notaryUser && this.sessionFullData.notaryUser.notaryCustomCharges && this.sessionFullData.notaryUser.notaryCustomCharges.gnw) || [];
    // }
    if (this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.sessionCustomCharges) {
      extraChargesDocs = this.sessionFullData.newSessionModelData.sessionCustomCharges;
    }
    this.customChargesEditValues = extraChargesDocs;
    console.log("this.$user.role", this.$user.role);
    if (this.$user.role === "customer") {
      setTimeout(() => {
        if (this.waitingRoomModalShow && !this.sessionFullData?.newSessionModelData?.invitedSession && !this.sessionFullData?.newSessionModelData?.invitedViaSessionLink && (this.sessionFullData?.newSessionModelData?.status !== "complete" && !this.sessionFullData?.newSessionModelData?.paid)) {
          if (!(this.waitingRoomChecklist.allPartiesJoined && this.waitingRoomChecklist.videoEnabledByAllParties)) {
            this.showNotarizeNowButtonModal = true;
          }
        }
      }, 180000);
    }
    if (!(this.sessionid === "simulator" || this.pdfMode === "template") && this.joinedAsSessionNotary) {
      this.saveDraftInterval = setInterval(() => {
        if (window.location && window.location.href && !window.location.href.includes("pdf")) {
          if (this.saveDraftInterval) {
            clearInterval(this.saveDraftInterval);
          }
          return;
        }
        this.saveDraftOfCurrentSession();
      }, 10000);
      // Every 60 seconds we check if there are any backlog sync requests. If there are any backlog requests, we clear up the backlog keeping the first sync request intact
      setInterval(() => {
        let tempCurrentIndex = 0;
        _.map(this.currentIntervalSyncCancelTokens, (tempCancelToken) => {
          if (tempCurrentIndex !== 0) {
            tempCancelToken.cancel();
          }
          tempCurrentIndex += 1;
        });
        this.currentIntervalSyncCancelTokens = {};
      }, 60000);
    }
    if (this.sessionid !== "simulator" && this.pdfMode !== "template") {
      this.sessionHeartbeatInterval = setInterval(() => {
        if (window.location && window.location.href && !window.location.href.includes("pdf")) {
          if (this.sessionHeartbeatInterval) {
            clearInterval(this.sessionHeartbeatInterval);
          }
          return;
        }
        this.socketRequest("session_heartbeat", {
          joinedAsSessionNotary: this.joinedAsSessionNotary,
          joinedAsPrimarySigner: this.joinedAsPrimarySigner
        });
      }, 10000);
    }
    if (this.internalForceParam) {
      this.startVideoRecording();
    }
    if (!(this.pdfMode === "template" || this.sessionid === "simulator")) {
      // When user is coming back online, reload the page
      let isOnline = true;
      setInterval(() => {
        if (!isOnline && navigator.onLine) {
          isOnline = true;
          console.log("Back online!");
          window.onbeforeunload = null;
          window.location.reload();
        } else if (isOnline && !navigator.onLine) {
          isOnline = false;
          console.log("Lost connection!");
        }
      }, 1000);
    }
  },
  beforeDestroy() {
    if (window.stopCallback) {
      window.stopCallback("failure");
    }
    this.stopStreamsRecording();
    this.endVideoCall();
    this.socketRequest("leave_session");
    if (this.useOpenVidu) {
      this.openViduLeaveSession();
    }
    VueEventBus.$off("SOCKET_UPDATES");
    VueEventBus.$off("SOCKET_RECONNECTED");
    VueEventBus.$off("REMOVE_ELEMENT");
  },
  methods: {
    async fetchSessionDocWithDelay(millisec) {
      await sleep(millisec);
      await this.fetchSessionDoc();
    },
    async usersChangedInSession(finalUsers, newUsers) {
      const notaryUserId = this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.notaryUserId;
      if (this.$user.role === "customer" && newUsers.length && _.includes(newUsers, notaryUserId)) {
        if (!(this.sessionFullData && notaryUserId)) {
          await this.fetchSessionDoc();
        }
      }
      if (!(this.pdfMode === "template" || this.sessionid === "simulator")) {
        const sessionWitnessUrl = `/session/getAllSessionWitnesses/${this.sessionid}`;
        let sessionFullData = false;
        try {
          sessionFullData = await Vue.axios.get(sessionWitnessUrl);
        } catch (error) {}
        const currentSessionWitnessUsers = (sessionFullData && sessionFullData.data && sessionFullData.data.sessionWitnesses) || [];
        let localActiveWitness = 0;
        this.currentSessionWitnessUsers = _.map(currentSessionWitnessUsers, (witnessUserDoc) => {
          if (witnessUserDoc.userid && _.includes(finalUsers, witnessUserDoc.userid)) {
            witnessUserDoc.userActive = true;
            localActiveWitness += 1;
          } else {
            witnessUserDoc.userActive = false;
          }
          return witnessUserDoc;
        });
        if (localActiveWitness > this.maxWitnessJoined) {
          this.maxWitnessJoined = localActiveWitness;
          if (this.$user.role === "customer" && !this.joinedAsWitness) {
            const url = `session/saveSessionData/${this.sessionid}`;
            const dataToSave = {
              maxWitnessJoined: this.maxWitnessJoined
            };
            Vue.axios.post(url, {
              data: dataToSave
            });
          }
        }
      }
      this.currentPageUsers = finalUsers;
      this.multiSignerUserDocs = _.map(this.multiSignerUserDocs, (signerUserDoc) => {
        if (_.includes(this.currentPageUsers, signerUserDoc._id)) {
          signerUserDoc.userActive = true;
        } else {
          signerUserDoc.userActive = false;
        }
        return signerUserDoc;
      });
      if (!this.useOpenVidu) {
        let allPartiesJoined = true;
        if (this.currentPageUsers.indexOf(this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.userId) === -1) {
          allPartiesJoined = false;
        }
        console.log("notaryUserId", notaryUserId, this.currentPageUsers);
        if (notaryUserId) {
          if (this.currentPageUsers.indexOf(notaryUserId) === -1) {
            allPartiesJoined = false;
          } else if (this.currentPageUsers.length < 2) {
            allPartiesJoined = false;
          }
        }
        console.log("allPartiesJoined", allPartiesJoined);
        this.waitingRoomChecklist.allPartiesJoined = allPartiesJoined;
      }
      if (this.joinedAsSessionNotary) {
        this.socketRequest("current_selected_document_changed", {
          currentSelectedDocumentId: this.currentDocumentSelected._id
        });
        this.sendFullSessionFields();
      }
    },
    async openViduGetToken() {
      let sessionid = this.sessionid;
      if (sessionid === "simulator") {
        sessionid = `simulator_${Math.floor(Math.random() * 999)}`;
      }
      const apiResponse = await Vue.axios.post("session/video/join", {
        sessionId: sessionid
      });
      console.log("apiResponse", apiResponse);
      return apiResponse?.data?.connectionToken;
    },
    async openViduStartRecording() {
      const apiResponse = await Vue.axios.post("session/video/record", {
        sessionId: this.sessionid
      });
      console.log("apiResponse", apiResponse);
      return true;
    },
    async openViduJoinSession() {
      // --- 1) Get an OpenVidu object ---
      this.OV = new OpenVidu();

      // setting up turn server
      const turnUsername = "abcUser";
      const turnCredential = "abcUser123!";
      this.OV.setAdvancedConfiguration({
        iceServers: [
          {
              urls: "turn:turn.bluenotary.us:3478?transport=udp",
              username: turnUsername,
              credential: turnCredential
          },
          {
              urls: "turn:turn.bluenotary.us:3478?transport=tcp",
              username: turnUsername,
              credential: turnCredential
          },
          {
              urls: "turns:turn.bluenotary.us:3478?transport=tcp",
              username: turnUsername,
              credential: turnCredential
          }
        ]
      });

      // --- 2) Init a session ---
      this.session = this.OV.initSession();
      // --- 3) Specify the actions when events take place in the session ---
      // On every new Stream received...
      this.session.on("streamCreated", ({ stream }) => {
        const subscriber = this.session.subscribe(stream);
        console.log("subscribersubscriber", subscriber);
        let dataToUse = _.cloneDeep(subscriber?.stream?.connection?.data);
        if (dataToUse && _.isString(dataToUse)) {
          try {
            dataToUse = JSON.parse(dataToUse);
          } catch (error) {
            console.log("error", error);
            try {
              dataToUse = eval(dataToUse);
            } catch (error2) {
              console.log("error2", error2);
            }
          }
        }
        let newSubscriber = true;
        try {
          if (dataToUse?.userId && dataToUse?.userId === String(this.$user._id)) {
            newSubscriber = false;
          }
        } catch (error) {
          console.log("trycatch error");
        }
        if (newSubscriber) {
          this.subscribers.push(subscriber);
        }
      });
      // On every Stream destroyed...
      this.session.on("streamDestroyed", ({ stream }) => {
        const index = this.subscribers.indexOf(stream.streamManager, 0);
        if (index >= 0) {
          this.subscribers.splice(index, 1);
        }
      });
      // On every asynchronous exception...
      this.session.on("exception", ({ exception }) => {
        console.log("openvidu exception", exception);
      });
      // On every network change
      this.session.on("networkQualityLevelChanged", (networkChangeEvent) => {
        console.log("openvidu networkQualityLevelChanged", networkChangeEvent);
        if (networkChangeEvent.connection.connectionId === this.session.connection.connectionId) {
          console.log(`Now my network quality level is ${networkChangeEvent.newValue}. Before was ${networkChangeEvent.oldValue}`);
          const qualityLevel = networkChangeEvent?.newValue;
          if (qualityLevel <= 1) {
            this.internetConnectionSpeedTestErrorShown = true;
          } else {
            this.internetConnectionSpeedTestErrorShown = false;
          }
        }
      });
      // --- 4) Connect to the session with a valid user token ---
      // Get a token from the OpenVidu deployment
      const connectionToken = await this.openViduGetToken();
      let currentUserName = "";
      if (this.joinedAsSessionNotary) {
        currentUserName = "Notary";
      } else if (this.joinedAsPrimarySigner) {
        currentUserName = "Primary Signer";
      } else if (this.joinedAsWitness) {
        currentUserName = "Witness";
      } else if (this.joinedAsPOC) {
        currentUserName = "POC";
      } else if (this.joinedAsSecondarySigner) {
        currentUserName = `Addn. Signer #${this.joinedAsSecondarySignerIndex + 1}`;
      }
      if (currentUserName) {
        currentUserName += " - ";
      }
      currentUserName += this.$user.name;
      const socketConnectionData = {
        clientData: currentUserName,
        joinedAsSessionNotary: this.joinedAsSessionNotary,
        joinedAsPrimarySigner: this.joinedAsPrimarySigner,
        joinedAsWitness: this.joinedAsWitness,
        joinedAsPOC: this.joinedAsPOC,
        joinedAsSecondarySigner: this.joinedAsSecondarySigner,
        joinedAsSecondarySignerIndex: this.joinedAsSecondarySignerIndex,
        userId: this.$user._id
      };
      this.session.connect(connectionToken, socketConnectionData)
        .then(() => {
          this.videoCallStarted = true;
          // --- 5) Get your own camera stream with the desired properties ---
          // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
          // element: we will manage it on our own) and with the desired properties
          const publisher = this.OV.initPublisher(undefined, {
            audioSource: undefined, // The source of audio. If undefined default microphone
            videoSource: undefined, // The source of video. If undefined default webcam
            publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
            publishVideo: true, // Whether you want to start publishing with your video enabled or not
            resolution: "640x480", // The resolution of your video
            frameRate: 30, // The frame rate of your video
            insertMode: "APPEND", // How the video is inserted in the target element 'video-container'
            mirror: false, // Whether to mirror your local video or not
          });
          // Set the main video in the page to display our webcam and store our Publisher
          this.mainStreamManager = publisher;
          this.publisher = publisher;
          // --- 6) Publish your stream ---
          this.session.publish(this.publisher);
        })
        .catch((error) => {
          console.log("There was an error connecting to the session:", error.code, error.message);
        });
      window.addEventListener("beforeunload", this.openViduLeaveSession);
    },
    openViduLeaveSession() {
      // --- 7) Leave the session by calling 'disconnect' method over the Session object ---
      if (this.session) this.session.disconnect();
      // Empty all properties...
      this.session = undefined;
      this.mainStreamManager = undefined;
      this.publisher = undefined;
      this.subscribers = [];
      this.OV = undefined;
      // Remove beforeunload listener
      window.removeEventListener("beforeunload", this.openViduLeaveSession);
    },
    updateMainVideoStreamManager(stream) {
      if (this.mainStreamManager === stream) return;
      this.mainStreamManager = stream;
    },
    revokeCustomChargesClicked() {
      this.customChargesEditValues = [];
      this.$q.notify({
        color: "primary",
        position: "bottom-right",
        message: "Custom Charges Revoked",
      });
      const dataToSend = {
        sessionid: this.sessionid,
        user: this.$user._id,
        customChargesEditValues: [],
        customChargesModified: true
      };
      window.currentSocket.emit("custom_charges_modified", dataToSend, (res) => {
        console.log(res);
      });
    },
    approvalStatusChangeOnCustomCharge(approvalValue) {
      const dataToSend = {
        sessionid: this.sessionid,
        user: this.$user._id,
        customChargesEditValues: this.approvalCustomCharges,
        customChargesEditValuesApprovalValue: approvalValue
      };
      window.currentSocket.emit("custom_charges_modified_approval_updates", dataToSend, (res) => {
        console.log(res);
      });
    },
    kbaIconClicked() {
      this.showKBAStatusCheckModal = true;
    },
    async savePretagFields() {
      await this.saveDraftOfCurrentSession();
      this.$q.notify({
        color: "primary",
        position: "bottom-right",
        message: "Session Pretagged Fields Saved Successfully",
      });
      this.$router.replace("/notary/dashboard");
    },
    goBackPretagFields() {
      this.$router.replace("/notary/dashboard");
    },
    rescheduleIconClicked() {
      this.rescheduleSessionModal = true;
      this.rescheduleTimezoneValues = window.allTimeZones;
      const allowedTimezones = ["(GMT-10:00) Hawaii", "(GMT-08:00) Pacific", "(GMT-07:00) Mountain", "(GMT-06:00) Central", "(GMT-05:00) Eastern"];
      this.rescheduleSelectedTimezone = this.rescheduleTimezoneValues.filter((timezone) => allowedTimezones.indexOf(timezone.label) >= 0);
      console.log(this.rescheduleSelectedTimezone);
      const timezone = String(((new Date().getTimezoneOffset()) / 60) * -1);
      _.map(this.rescheduleSelectedTimezone, (tempValue) => {
        if (tempValue.value === timezone) {
          this.reschedulemeetingTimeZone = tempValue;
        }
      });
    },
    editSesionDocumentsClicked() {
      this.manageAllPDFDocumentsModal = true;
    },
    rescheduleTimezoneFilterFn (val, update) {
      if (val === "") {
        update(() => {
          this.rescheduleTimezoneValues = window.allTimeZones;
        });
        return;
      }

      update(() => {
        const needle = val.toLowerCase();
        this.rescheduleTimezoneValues = window.allTimeZones.filter((v) => v.label.toLowerCase().indexOf(needle) > -1);
      });
    },
    notarizationDateTimeInputFieldClicked() {
      this.rescheduleOpenDateTimePickerModal = true;
    },
    rescheduleOptionsFn (selectedDate) {
      return selectedDate >= date.formatDate(Date.now(), "YYYY/MM/DD");
    },
    rescheduleSaveClicked() {
      this.rescheduleSaveButtonLoading = true;
      const url = `session/saveSessionData/${this.sessionid}`;
      const dataToSave = {
        meetingTimeZone: this.reschedulemeetingTimeZone.value,
        currentTimeZone: String((new Date()).getTimezoneOffset() / -60),
        meetingdate: this.rescheduleDatetime,
        sessionRescheduled: true
      };
      const apiResponse = Vue.axios.post(url, {
        data: dataToSave
      });
      this.rescheduleSaveButtonLoading = false;
      console.log("apiResponse", apiResponse);
      this.rescheduleSessionModal = false;
      this.$q.notify({
        color: "success",
        position: "bottom-right",
        message: "Session Rescheduled Successfully",
      });
    },
    addMoreSignerButton() {
      this.multiSignerList.push({
        id: `input${String(this.multiSignerList.length)}`,
        email: ""
      });
    },
    removeSignerEmail(signerId) {
      this.multiSignerList = _.filter(this.multiSignerList, (signerDoc) => signerDoc.id !== signerId);
    },
    startKBA() {
      this.showKBAModalSection = "personal_details";
    },
    kbaModalChangeSection(sectionName, failureReason) {
      console.log("sectionName", sectionName);
      let tempSectionName = "primarySigner";
      if (this.joinedAsSecondarySigner) {
        tempSectionName = `additionalSigner${String(this.joinedAsSecondarySignerIndex)}`;
      }
      this.socketRequest("kba_status_changed", {
        userType: tempSectionName,
        sectionName
      });
      if (sectionName === "meet_notary") {
        this.showKBAModal = false;
        this.$q.notify({
          color: "success",
          position: "bottom-right",
          message: "Identity Authentication is Completed Successfully",
        });
        if (this.inSessionKBAForPrimarySignerFlow) {
          this.waitingRoomChecklist.inSessionKBADoneForPrimarySigner = true;
          this.openModalForInSessionKBA = false;
          if (this.useOpenVidu) {
            const iOSDevice = ["iPad", "iPhone", "iPod", "MacIntel", "Macintosh", "iPhone Simulator", "iPod Simulator", "iPad Simulator"].indexOf(navigator.platform) >= 0;
            if (iOSDevice) {
              this.openViduLeaveSession();
              setTimeout(() => {
                this.openViduJoinSession();
              }, 2000);
            }
          } else {
            this.$refs.webrtc.leave();
            setTimeout(() => {
              this.$refs.webrtc.join();
            }, 2000);
          }
        }
        return;
      }
      this.showKBAModalSection = sectionName;
      if (sectionName === "failed") {
        this.kbaModalFailureReason = failureReason;
      }
    },
    startingPersonaFlow() {
      this.showKBAModal = true;
    },
    checkLoanInstructionsClicked() {
      this.loanSigningInstructionsModal = true;
    },
    async doOpenCallForThisSessionClicked() {
      const dataToSave = {
        sessionid: this.sessionid
      };
      const urlToUse = "session/doOpenCallForActiveSession";
      this.showNotarizeNowButtonLoading = true;
      const response = await Vue.axios.post(urlToUse, dataToSave);
      this.showNotarizeNowButtonLoading = false;
      if (response && response.data && response.data.success) {
        this.showNotarizeNowButtonSuccess = true;
      }
      if (response?.data?.openCallSent) {
        this.socketRequest("new_session_open_call");
      }
    },
    minimizeWaitingRoom() {
      const sessionStat = {};
      if (!this.minimizeWaitingRoomData) {
        this.minimizeWaitingRoomData = true;
        sessionStat.waiting_room = "Visible and Minimzed modal";
      } else {
        this.minimizeWaitingRoomData = false;
        sessionStat.waiting_room = "Visible and Maximized modal";
      }
      this.saveSessionStat(sessionStat);
      this.recalculateSessionCostAndCompleteButtonData();
    },
    editCostOfNotarizationClicked() {
      this.editCostOfNotarizationModal = true;
    },
    addMoreChargesButton() {
      this.customChargesEditValues.push({
        id: `input${Math.floor(Math.random() * 999)}`,
        particular: "",
        amount: 0
      });
    },
    convertArrBufferToB64(arrayBuffer) {
      let binary = "";
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i += 1) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    },
    async downloadDataIntoArryBuffer(url) {
      console.log(`fetching resource ${url}`);
      let response;
      try {
        response = await fetch(url).then((res) => res.arrayBuffer());
      } catch (error) {
        console.log("error", error);
        try {
          const localImageData = url.replace(/\./g, ">");
          response = await fetch(`https://app.bluenotary.us/corsfix/${localImageData}`, {
            headers: {
              Origin: "https://app.bluenotary.us"
            }
          }).then((res1) => res1.arrayBuffer());
        } catch (error2) {
          console.log("error2", error2);
          response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`).then((res2) => res2.arrayBuffer());
        }
      }
      return response;
    },
    removeChargesButton(chargeId) {
      this.customChargesEditValues = _.filter(this.customChargesEditValues, (chargeDoc) => chargeDoc.id !== chargeId);
    },
    editCostOfNotarizationSaveClicked() {
      let customChargesValid = true;
      let totalCustomCharges = 0;
      _.map(this.customChargesEditValues, (customCharge) => {
        totalCustomCharges += parseFloat(customCharge.amount);
      });
      if (totalCustomCharges > 100) {
        customChargesValid = false;
      }
      if (!customChargesValid) {
        this.$q.notify({
          color: "danger",
          position: "bottom-right",
          message: "Custom Charges for Session cannot Exceed $100",
        });
        return;
      }
      if (totalCustomCharges < 1) {
        customChargesValid = false;
      }
      if (!customChargesValid) {
        this.$q.notify({
          color: "danger",
          position: "bottom-right",
          message: "Custom Charges for Session cannot be less than 1$",
        });
        return;
      }
      this.notaryAwaitingApprovalForUpdatedCustomCharge = true;
      const dataToSend = {
        sessionid: this.sessionid,
        user: this.$user._id,
        customChargesEditValues: this.customChargesEditValues,
        customChargesModified: this.customChargesModified
      };
      window.currentSocket.emit("custom_charges_modified_sent_for_approval", dataToSend, (res) => {
        console.log(res);
      });
      this.customChargesModified = true;
      this.allDroppedElements.push(false);
      this.editCostOfNotarizationModal = false;
    },
    recalculateDroppedElementsNextPreviousData() {
      console.log(this.$user.role);
      if (this.$user.role !== "customer" && !this.joinedAsWitness) {
        return;
      }
      let customerTotalFields = 0;
      let customerTotalFieldsDataInserted = 0;
      const alreadyCounted = [];
      _.map(this.allDroppedElements, (droppedElement) => {
        if (droppedElement.fieldType === "placeholder") {
          // if (alreadyCounted.includes(droppedElement.elementId)) {
          //   return;
          // }
          // console.log(JSON.parse(JSON.stringify(droppedElement)));
          if ((this.joinedAsWitness && droppedElement.fieldPlaceholderUser === "witness") || (!this.joinedAsWitness && (!droppedElement.fieldPlaceholderUser || droppedElement.fieldPlaceholderUser === "undefined"))) {
            customerTotalFields += 1;
            if (droppedElement.imageData || droppedElement.inputTextValue) {
              customerTotalFieldsDataInserted += 1;
            }
          }
          alreadyCounted.push(droppedElement.elementId);
        }
      });
      this.customerTotalFields = customerTotalFields;
      this.customerTotalFieldsDataInserted = customerTotalFieldsDataInserted;
      console.log(customerTotalFields, customerTotalFieldsDataInserted);
    },
    recalculateSessionCostAndCompleteButtonData() {
      console.log("value changed in dropped elements docid wise", this.allDroppedElementsDocIdWise);
      this.showCompleteButtonInfoText = "";
      let totalNotarySeals = 0;
      const documentWiseNotarySeals = {};
      this.pendingInputs = {
        signatures: 0,
        text: 0,
        signaturesWitness: 0
      };
      const multiSignerListToUse = _.filter(this.multiSignerList, "email");
      _.map(this.allDroppedElementsDocIdWise, (droppedElements, tempDocumentId) => {
        documentWiseNotarySeals[tempDocumentId] = 0;
        _.map(droppedElements, (droppedElement) => {
          if (droppedElement.imageFieldType === "notary_seal") {
            totalNotarySeals += 1;
            documentWiseNotarySeals[tempDocumentId] += 1;
          }
          if (droppedElement.fieldType === "placeholder") {
            if (droppedElement.fieldPlaceholderType === "signature" && !droppedElement.imageData) {
              if (droppedElement.fieldPlaceholderUser === "witness") {
                this.pendingInputs.signaturesWitness += 1;
              } else {
                this.pendingInputs.signatures += 1;
              }
            }
            if (droppedElement.fieldPlaceholderType === "input_text" && !droppedElement.inputTextValue) {
              this.pendingInputs.text += 1;
            }
          }
        });
      });
      console.log("totalNotarySeals", totalNotarySeals, this.pendingInputs);
      let notaryFee = "25.00";
      if (this.sessionFullData && this.sessionFullData.statePricingDoc && this.sessionFullData.statePricingDoc.notaryFee) {
        notaryFee = this.sessionFullData.statePricingDoc.notaryFee;
      }
      let serviceFee = "2.00";
      if (this.sessionFullData && this.sessionFullData.statePricingDoc && this.sessionFullData.statePricingDoc.serviceFee) {
        serviceFee = this.sessionFullData.statePricingDoc.serviceFee;
      }
      let notaryFeeText = "Notarization + 1 Notary Seal";
      let dontAddExtraCharges = false;
      if (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.sessionType === "loan_signing") {
        dontAddExtraCharges = true;
        if (this.sessionFullData && this.sessionFullData.statePricingDoc.loan_signing) {
          if (this.sessionFullData.statePricingDoc.loan_signing.notaryFee) {
            notaryFee = this.sessionFullData.statePricingDoc.loan_signing.notaryFee;
          }
          if (this.sessionFullData.statePricingDoc.loan_signing.notaryFeeText) {
            notaryFeeText = this.sessionFullData.statePricingDoc.loan_signing.notaryFeeText;
          }
          if (this.sessionFullData.statePricingDoc.loan_signing.serviceFee) {
            serviceFee = this.sessionFullData.statePricingDoc.loan_signing.serviceFee;
          }
        }
      }
      let extraSeal = "8.00";
      if (this.sessionFullData && this.sessionFullData.statePricingDoc && this.sessionFullData.statePricingDoc.extraSeal) {
        extraSeal = this.sessionFullData.statePricingDoc.extraSeal;
      }
      if (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.sessionChargeOnBusinessUser && !this.currentSessionBlueNotaryOpenCall) {
        notaryFee = "0.00";
        extraSeal = "0.00";
        // extraSeal = "4.00";
        // if (!this.sessionFullData.newSessionModelData.sessionCreatedByBusinessUser) {
        //   extraSeal = "4.00";
        // }
        if (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.sessionType === "loan_signing") {
          notaryFee = "0.00";
          notaryFee = "25.00";
          extraSeal = "0.00";
        } else {
          serviceFee = "3.00";
        }
      }
      let witnessFees = "10.00";
      if (this.sessionFullData && this.sessionFullData.statePricingDoc && this.sessionFullData.statePricingDoc.witnessFees) {
        witnessFees = this.sessionFullData.statePricingDoc.witnessFees;
      }
      let additionalSignerFees = "4.00";
      if (this.sessionFullData && this.sessionFullData.statePricingDoc && this.sessionFullData.statePricingDoc.additionalSignerFees) {
        additionalSignerFees = this.sessionFullData.statePricingDoc.witnessFees;
      }
      console.log("this.businessUserSubsidizedSessionthis.businessUserSubsidizedSession", this.businessUserSubsidizedSession);
      if (!(this.sessionFullData?.newSessionModelData?.sessionType === "loan_signing")) {
        if (this.businessUserSubsidizedSession === "free") {
          notaryFee = "0.00";
          serviceFee = "0.00";
          extraSeal = "0.00";
        } else if (this.businessUserSubsidizedSession === "partial") {
          notaryFee = "0.00";
          serviceFee = "13.00";
          extraSeal = "0.00";
        } else if (this.businessUserSubsidizedSession === "full") {
          notaryFee = "25.00";
          serviceFee = "2.00";
          extraSeal = "8.00";
        }
      } else if (this.businessUserSubsidizedSession === "loan_signing_internal_notary") {
          notaryFee = "45.00";
          serviceFee = "0.00";
          extraSeal = "0.00";
        } else if (this.businessUserSubsidizedSession === "loan_signing_open_call") {
          notaryFee = "125.00";
          serviceFee = "0.00";
          extraSeal = "0.00";
        }
      if (this.vendorSkipSessionCharges && !this.vendorChargesPaidToNotaryFromBN) {
        notaryFee = "0.00";
        serviceFee = "0.00";
        extraSeal = "0.00";
      }
      if (this.sessionFullData?.notaryTeamAdminCustomerUserDoc?.customServiceChargeForSessionOnlyInternalTeam && !this.currentSessionBlueNotaryOpenCall) {
        serviceFee = this.sessionFullData.notaryTeamAdminCustomerUserDoc.customServiceChargeForSessionOnlyInternalTeam;
      }
      if (this.sessionFullData?.invitedByCustomerUserDoc?.customServiceChargeForSessionOnlyInternalTeam && !this.currentSessionBlueNotaryOpenCall) {
        serviceFee = this.sessionFullData.invitedByCustomerUserDoc.customServiceChargeForSessionOnlyInternalTeam;
      }
      console.log("serviceFee", serviceFee);
      this.costOfNotarization = [];
      if (totalNotarySeals > 0) {
        this.costOfNotarization.push({
          name: notaryFeeText,
          price: notaryFee,
          currency: "$"
        });
        let extraChargesDocs = [];
        // if (this.sessionFullData && this.sessionFullData.notaryUser && this.sessionFullData.notaryUser.notaryCustomCharges) {
        //   if (this.sessionFullData.newSessionModelData.sessionType) {
        //     extraChargesDocs = this.sessionFullData.notaryUser.notaryCustomCharges[this.sessionFullData.newSessionModelData.sessionType] || [];
        //   } else {
        //     extraChargesDocs = this.sessionFullData.notaryUser.notaryCustomCharges.gnw || [];
        //   }
        // }
        if (this.customChargesEditValues) {
          extraChargesDocs = JSON.parse(JSON.stringify(this.customChargesEditValues));
          extraChargesDocs = _.filter(extraChargesDocs, (chargeDoc) => parseFloat(chargeDoc.amount));
        }
        this.sessionCustomCharges = extraChargesDocs;
        _.map(extraChargesDocs, (extraChargeDoc) => {
          const extraChargeAmount = parseFloat(extraChargeDoc.amount);
          this.costOfNotarization.push({
            name: extraChargeDoc.particular,
            price: extraChargeAmount.toFixed(2),
            currency: "$"
          });
        });
        console.log("dontAddExtraCharges", dontAddExtraCharges);
        if (this.currentSessionWitnessUsers?.length) {
          let totalWitnessToChargeFor = 0;
          _.map(this.currentSessionWitnessUsers || [], (tempCurrentSessionWitness) => {
            console.log("tempCurrentSessionWitness", tempCurrentSessionWitness);
            if (tempCurrentSessionWitness?.userdoc?.role === "notary") {
              totalWitnessToChargeFor += 1;
            }
          });
          if (totalWitnessToChargeFor) {
            this.costOfNotarization.push({
              name: `Witnesses x${String(totalWitnessToChargeFor)}`,
              price: `${String(totalWitnessToChargeFor * parseFloat(witnessFees))}.00`,
              currency: "$"
            });
          }
        }
        if (!dontAddExtraCharges) {
          const extraSeals = totalNotarySeals - 1;
          if (extraSeals) {
            this.costOfNotarization.push({
              name: `Extra Notary Seal x${String(extraSeals)}`,
              price: `${String(extraSeals * parseFloat(extraSeal))}.00`,
              currency: "$"
            });
          }
          // if (this.sessionFullData.newSessionModelData.multiSignerList && this.sessionFullData.newSessionModelData.multiSignerList.length) {
          if (multiSignerListToUse.length) {
            this.costOfNotarization.push({
              name: `Additional Signers x${String(multiSignerListToUse.length)}`,
              price: `${String(multiSignerListToUse.length * parseFloat(additionalSignerFees))}.00`,
              currency: "$"
            });
          }
        }
        if (parseFloat(serviceFee)) {
          this.costOfNotarization.push({
            name: "Service Fee",
            price: serviceFee,
            currency: "$"
          });
        }
        const tempAllDocumentHaveSeals = true;
        const documentNameWithoutSeals = [];
        // _.map(documentWiseNotarySeals, (documentCount, tempDocumentId) => {
        //   if (!documentCount) {
        //     tempAllDocumentHaveSeals = false;
        //     const documentDoc = this.allDocumentListKeyedById[tempDocumentId];
        //     if (documentDoc) {
        //       documentNameWithoutSeals.push(documentDoc.name);
        //     }
        //   }
        // });
        if (tempAllDocumentHaveSeals) {
          this.showCompleteButton = true;
        } else {
          this.showCompleteButton = false;
          this.showCompleteButtonInfoText += `Following Documents do not have Notary Seals : ${documentNameWithoutSeals.join(", ")}`;
        }
      } else {
        this.showCompleteButton = false;
        this.showCompleteButtonInfoText = "At least 1 Notary Seal is required for document to complete the session";
      }
      if (this.minimizeWaitingRoomData || this.waitingRoomModalShow || (this.useOpenVidu && !this.primarySignerJoinedSession)) {
        if (this.sessionid !== "simulator") {
          this.showCompleteButton = false;
          if (this.showCompleteButtonInfoText) {
            this.showCompleteButtonInfoText += "<br>";
          }
          this.showCompleteButtonInfoText += "Primary Signer is not in the session";
        }
      }
      if (this.$user.testingacc) {
        if (this.pendingInputs.signatures) {
          this.showCompleteButton = false;
          if (this.showCompleteButtonInfoText) {
            this.showCompleteButtonInfoText += "<br>";
          }
          let tempText = "Signatures are";
          if (this.pendingInputs.signatures === 1) {
            tempText = "Signature is";
          }
          this.showCompleteButtonInfoText += `${String(this.pendingInputs.signatures)} ${tempText} required from Signer`;
        }
        if (this.pendingInputs.signaturesWitness) {
          this.showCompleteButton = false;
          if (this.showCompleteButtonInfoText) {
            this.showCompleteButtonInfoText += "<br>";
          }
          let tempText = "Signatures are";
          if (this.pendingInputs.signaturesWitness === 1) {
            tempText = "Signature is";
          }
          this.showCompleteButtonInfoText += `${String(this.pendingInputs.signaturesWitness)} ${tempText} required from Witness`;
        }
        if (this.pendingInputs.text) {
          this.showCompleteButton = false;
          if (this.showCompleteButtonInfoText) {
            this.showCompleteButtonInfoText += "<br>";
          }
          let tempText2 = "Input Fields are";
          if (this.pendingInputs.text === 1) {
            tempText2 = "Input Field is";
          }
          this.showCompleteButtonInfoText += `${String(this.pendingInputs.text)} ${tempText2} required from Signer`;
        }
      }
      // if (this.markSessionCompleteAsNonDisabled) {
      //   this.showCompleteButton = true;
      // }
      if (this.sessionid !== "simulator") {
        this.saveSessionStat({ complete_pending_items: this.showCompleteButtonInfoText });
      }
    },
    prevCustomerInput(event) {
      let currentHighlightedElementId = 0;
      let hightlightedValueFound = false;
      this.previousHighlightedElementId = this.currentHighlightedElementId;
      _.map(this.allDroppedElements, (droppedElement) => {
        if (hightlightedValueFound) {
          return;
        }
        if (droppedElement.fieldType === "placeholder") {
          if ((this.joinedAsWitness && droppedElement.fieldPlaceholderUser === "witness") || (!this.joinedAsWitness && (!droppedElement.fieldPlaceholderUser || droppedElement.fieldPlaceholderUser === "undefined"))) {
            if (!this.currentHighlightedElementId) {
              hightlightedValueFound = true;
            }
            if (this.currentHighlightedElementId === droppedElement.elementId) {
              hightlightedValueFound = true;
            } else {
              currentHighlightedElementId = droppedElement.elementId;
            }
          }
        }
      });
      this.currentHighlightedElementId = currentHighlightedElementId;
      this.scrollToHighlightedDiv(event);
    },
    nextCustomerInput(event) {
      let currentHighlightedElementId = 0;
      let hightlightedValueFound = false;
      let hightlightedValueIsNextValue = false;
      this.previousHighlightedElementId = this.currentHighlightedElementId;
      _.map(this.allDroppedElements, (droppedElement) => {
        if (hightlightedValueFound) {
          return;
        }
        if (droppedElement.fieldType === "placeholder") {
          if ((this.joinedAsWitness && droppedElement.fieldPlaceholderUser === "witness") || (!this.joinedAsWitness && (!droppedElement.fieldPlaceholderUser || droppedElement.fieldPlaceholderUser === "undefined"))) {
            if (hightlightedValueIsNextValue) {
              hightlightedValueFound = true;
              hightlightedValueIsNextValue = false;
              currentHighlightedElementId = droppedElement.elementId;
              return;
            }
            if (!this.currentHighlightedElementId) {
              hightlightedValueFound = true;
              currentHighlightedElementId = droppedElement.elementId;
            } else if (this.currentHighlightedElementId === droppedElement.elementId) {
              hightlightedValueIsNextValue = true;
            }
          }
        }
      });
      this.currentHighlightedElementId = currentHighlightedElementId;
      console.log(this.previousHighlightedElementId, this.currentHighlightedElementId);
      this.scrollToHighlightedDiv(event);
    },
    scrollToHighlightedDiv(event) {
      const divId = `signature-element${this.currentHighlightedElementId}`;
      event.preventDefault();
      try {
        if ($(`#${divId}`).parent() && $(`#${divId}`).parent()[0]) {
          let elementHeight = $(`#${divId}`).parent()[0].offsetTop + $(`#${divId}`)[0].offsetTop - 150;
          if (this.isMobile()) {
            elementHeight += 100;
            $(".pdfmain").animate({ scrollTop: 100 }, 200);
          }
          $("#pdf-pages-container").animate({ scrollTop: elementHeight }, 500);
          $(`#${divId}`).css("box-shadow", "-5px 10px 55px 4px rgba(0,0,0,0.75)");
        }
        if (this.previousHighlightedElementId) {
          const oldDivId = `signature-element${this.previousHighlightedElementId}`;
          $(`#${oldDivId}`).css("box-shadow", "");
        }
      } catch (error) {
        console.log("error", error);
      }
    },
    droppableFieldClicked(event, droppableField) {
      if (this.isTouchDevice) {
        if (this.selectedDroppableField.name === droppableField.name) {
          this.selectedDroppableField = {};
        } else {
          this.selectedDroppableField = droppableField;
        }
        event.stopPropagation();
      }
    },
    sendFullSessionFields() {
      console.log("this.allDroppedElements", JSON.parse(JSON.stringify(this.allDroppedElements)));
      if (!this.allDroppedElements.length) {
        this.sendFullSessionFieldsIfDataFound = true;
        return;
      }
      if (!this.documentNagivationTimerEnabled) {
        return;
      }
      const dataToSend = {
        sessionid: this.sessionid,
        fullFields: this.allDroppedElements,
        emptyPagesAdded: this.emptyPagesAdded,
        user: this.$user._id,
        customChargesEditValues: this.customChargesEditValues,
        customChargesModified: this.customChargesModified
      };
      window.currentSocket.emit("full_session_fields", dataToSend, (res) => {
        console.log(res);
      });
    },
    getMeta(url, callback) {
      const img = new Image();
      img.src = url;
      img.onload = (omg) => {
        const imgObj = (omg && omg.path && omg.path[0]) || {};
        callback(imgObj.naturalWidth, imgObj.naturalHeight);
      };
    },
    getKBAStatusNameFromStageName() {
      _.map(this.inSessionKBAStage, (stageValue, userTypeKey) => {
        let stageNameText = "N/A";
        if (!stageValue || stageValue === "personal_details" || stageValue === "kba" || stageValue === "kba_check_stage") {
          stageNameText = "KBA and Photo ID Check Not Completed";
        }
        if (stageValue === "photoid" || stageValue === "photoid_check_stage") {
          stageNameText = "KBA Successful. Photo ID Check Not Completed";
        }
        if (stageValue === "meet_notary") {
          stageNameText = "KBA and Photo ID Check Successful";
        }
        console.log("userTypeKey", userTypeKey, stageNameText);
        this.inSessionKBAStageText[userTypeKey] = stageNameText;
      });
    },
    async fetchSessionDoc() {
      console.log(this.sessionid);
      let roomNumberSessionId = this.sessionid;
      if (this.sessionid !== "simulator" && this.pdfMode !== "template") {
        let sessionFullData = false;
        let sessionUrl = `/session/fullSessionData/${this.sessionid}`;
        if (this.joinedAsWitness) {
          sessionUrl += "?witness=true";
        }
        try {
          sessionFullData = await Vue.axios.get(sessionUrl);
        } catch (error) {
          return false;
        }
        this.sessionFullData = sessionFullData.data;
      } else if (this.pdfMode === "template") {
        let templateDoc = false;
        try {
          templateDoc = await Vue.axios.post("/notary/templateFindOne", {
            templateId: this.sessionid
          });
        } catch (error) {
          console.log(error);
          return false;
        }
        console.log(templateDoc.data);
        this.sessionFullData = {
          newSessionModelData: false,
          originalDocument: (templateDoc && templateDoc.data && templateDoc.data.template) || {},
          notaryUser: this.$user || {},
          pdfDroppedElementDatas: (templateDoc && templateDoc.data && templateDoc.data.pdfDroppedElementDatas) || {},
          customerUser: false,
          notaryDatasDoc: (templateDoc && templateDoc.data && templateDoc.data.notaryDatasDoc) || {},
        };
      } else {
        roomNumberSessionId += Math.random().toString(36).slice(2);
        if (window.location.host === "localhost:8080") {
          this.sessionFullData = {
            newSessionModelData: false,
            notaryUser: {
                role: "notary",
                verified: true,
                memberType: "free",
                isSubscribed: true,
                _id: "62281d9e4c049b73f29c55e7",
                name: "Rohit Notary",
                email: "rohit@mailinator1.com",
                verification: "7f58313f-baf8-484b-9fe0-af48b25a034b",
                commissionNumber: "11111111",
                createdAt: "2022-03-09T03:23:10.537Z",
                updatedAt: "2022-04-10T08:15:01.738Z",
                state: "Colorado"
            },
            originalDocument: {
                _id: "6245ce0e64dbcfc5141df0a5",
                sessionid: "6245ca4964dbcfc5141deff3",
                documentCategory: "final_document",
                name: "Fixed-Rate-note-samples.pdf",
                url: "https://openbluenotarybucket.s3.us-east-2.amazonaws.com/Fixed-Rate-note-samples.pdf",
                type: "application/pdf",
                size: "29829",
                key: "1648741900616blob",
                bucketName: "openbluenotarybucket",
                uploadedBy: "62281d9e4c049b73f29c55e7",
                uploadedStage: "meet_notary_stage",
                createdAt: "2022-03-31T15:51:42.399Z",
                updatedAt: "2022-03-31T15:51:42.399Z"
            },
            pdfDroppedElementDatas: false,
            customerUser: {
                role: "customer",
                verified: true,
                memberType: "free",
                isSubscribed: true,
                _id: "6224ba9ef5473b2bd5e2681c",
                name: "Sample Signer",
                first_name: "Sample",
                last_name: "Signer",
                email: "sample@mailinator.com",
                verification: "944d0c9f-564e-4a6b-819e-58fce22673d6",
                createdAt: "2022-03-06T13:43:58.164Z",
                updatedAt: "2022-04-10T06:01:13.988Z"
            },
            notaryDatasDoc: {
                _id: "622af66cc9f7b0425ae0ccf3",
                commissionExpiresOn: 1836498600,
                county: "INDIA",
                dcpassword: "123456",
                userId: "62281d9e4c049b73f29c55e7",
                email: "rohit@mailinator1.com",
                createdAt: "2022-03-11T07:12:44.829Z",
                updatedAt: "2022-04-12T04:38:27.708Z",
                sealdata: "https://openbluenotarybucket.s3.us-east-2.amazonaws.com/1648749418987photonlegal.png",
                sealfilename: "photonlegal.png",
                notaryCertificates: [
                    {
                        _id: "624f0f2d2f1f56bad95366fe",
                        name: "IMG_0467-min.jpg",
                        url: "https://openbluenotarybucket.s3.us-east-2.amazonaws.com/1649348388134IMG_0467-min.jpg",
                        key: "1649348388134IMG_0467-min.jpg"
                    },
                    {
                        _id: "624f0f812f1f56bad9536719",
                        name: "Screenshot 2022-04-03 at 1.00.25 PM.png",
                        url: "https://openbluenotarybucket.s3.us-east-2.amazonaws.com/1649348478445Screenshot%202022-04-03%20at%201.00.25%20PM.png",
                        key: "1649348478445Screenshot 2022-04-03 at 1.00.25 PM.png"
                    }
                ]
            },
            statePricingDoc: {
              notaryFee: "25.00",
              serviceFee: "0.00",
              loan_signing: {
                  notaryFee: "150.00",
                  notaryFeeText: "Loan Signing Notarization",
                  serviceFee: "0.00"
              }
            }
          };
          if (this.document2) {
            if (this.$user.state === "Nevada") {
              this.sessionFullData.originalDocument = {
                _id: "6245ce0e64dbcfc5141df0a5",
                sessionid: "6245ca4964dbcfc5141deff3",
                documentCategory: "final_document",
                name: "Exemplar_NV_Notary_Example.pdf",
                url: "https://openbluenotarybucket.s3.us-east-2.amazonaws.com/Exemplar_NV_Notary_Example.pdf",
                type: "application/pdf",
                size: "29829",
                key: "Exemplar_NV_Notary_Example.pdf",
                bucketName: "openbluenotarybucket",
                uploadedBy: "62281d9e4c049b73f29c55e7",
                uploadedStage: "meet_notary_stage",
                createdAt: "2022-03-31T15:51:42.399Z",
                updatedAt: "2022-03-31T15:51:42.399Z"
              };
            } else if (this.$user.state === "Kentucky") {
              this.sessionFullData.originalDocument = {
                _id: "6245ce0e64dbcfc5141df0a5",
                sessionid: "6245ca4964dbcfc5141deff3",
                documentCategory: "final_document",
                name: "KentuckyElectronicRegistrationForm.pdf",
                url: "https://openbluenotarybucket.s3.us-east-2.amazonaws.com/KentuckyElectronicRegistrationForm.pdf",
                type: "application/pdf",
                size: "29829",
                key: "KentuckyElectronicRegistrationForm.pdf",
                bucketName: "openbluenotarybucket",
                uploadedBy: "62281d9e4c049b73f29c55e7",
                uploadedStage: "meet_notary_stage",
                createdAt: "2022-03-31T15:51:42.399Z",
                updatedAt: "2022-03-31T15:51:42.399Z"
              };
            }
          }
        } else {
          this.sessionFullData = {
            newSessionModelData: false,
            notaryUser: {
                role: "notary",
                verified: true,
                memberType: "free",
                isSubscribed: true,
                _id: "6241dc4597fb2a95efdb5dfb",
                name: "Blue Notary User",
                email: "rohnotary@mailinator.com",
                verification: "b3fbae59-132c-48b2-bf00-dba8fb1d0776",
                commissionNumber: "2334234234",
                approve: "active",
                createdAt: "2022-03-28T16:03:17.750Z",
                updatedAt: "2022-03-28T16:03:17.750Z"
            },
            originalDocument: {
                _id: "6245ce0e64dbcfc5141df0a5",
                sessionid: "6245ca4964dbcfc5141deff3",
                documentCategory: "final_document",
                name: "Fixed-Rate-note-samples.pdf",
                url: "https://openbluenotarybucket.s3.us-east-2.amazonaws.com/Fixed-Rate-note-samples.pdf",
                type: "application/pdf",
                size: "29829",
                key: "1648741900616blob",
                bucketName: "openbluenotarybucket",
                uploadedBy: "62281d9e4c049b73f29c55e7",
                uploadedStage: "meet_notary_stage",
                createdAt: "2022-03-31T15:51:42.399Z",
                updatedAt: "2022-03-31T15:51:42.399Z"
            },
            pdfDroppedElementDatas: false,
            customerUser: {
                role: "customer",
                verified: true,
                memberType: "free",
                isSubscribed: true,
                _id: "6241dd0797fb2a95efdb5e23",
                name: "Sample Signer",
                first_name: "Sample",
                last_name: "Signer",
                email: "sample@mailinator.com",
                verification: "6875c02a-7b85-49f4-8829-f8d81f446f4b",
                commissionNumber: "",
                createdAt: "2022-03-28T16:06:31.148Z",
                updatedAt: "2022-03-30T04:52:08.008Z"
            },
            notaryDatasDoc: {
                _id: "6241dce097fb2a95efdb5e13",
                sealdata: "https://openbluenotarybucket.s3.us-east-2.amazonaws.com/1648522958437eseal-example.jpg",
                sealfilename: "eseal-example.jpg",
                userId: "6241dc4597fb2a95efdb5dfb",
                email: "rohnotary@mailinator.com",
                notaryCertificates: [
                  {
                    _id: "625ef6fa839f578b0b9d4eb9",
                    name: "notary-certificate-sample.png",
                    url: "https://openbluenotarybucket.s3.us-east-2.amazonaws.com/1650390778616notary-certificate-sample.png",
                    key: "1650390778616notary-certificate-sample.png"
                  }
                ],
                createdAt: "2022-03-28T16:05:52.127Z",
                updatedAt: "2022-04-18T18:18:10.300Z",
                commissionExpiresOn: 1648665000,
                county: "3424324",
                dcpassword: "234567"
            },
            statePricingDoc: {
              notaryFee: "25.00",
              serviceFee: "0.00",
              loan_signing: {
                  notaryFee: "150.00",
                  notaryFeeText: "Loan Signing Notarization",
                  serviceFee: "0.00"
              }
            }
          };
          if (this.document2) {
            if (this.$user.state === "Nevada") {
              this.sessionFullData.originalDocument = {
                _id: "625ef5f8839f578b0b9d4e60",
                sessionid: "624833a85141ab04541d23f5",
                documentCategory: "initial_document",
                name: "Exemplar_NV_Notary_Example.pdf",
                url: "https://openbluenotarybucket.s3.us-east-2.amazonaws.com/Exemplar_NV_Notary_Example.pdf",
                type: "application/pdf",
                size: "83714",
                key: "Exemplar_NV_Notary_Example.pdf",
                bucketName: "openbluenotarybucket",
                uploadedBy: "6241dd0797fb2a95efdb5e23",
                uploadedStage: "identity_check_stage",
                createdAt: "2022-04-19T17:48:40.014Z",
                updatedAt: "2022-04-19T17:48:45.656Z"
              };
            } else if (this.$user.state === "Kentucky") {
              this.sessionFullData.originalDocument = {
                _id: "6245ce0e64dbcfc5141df0a5",
                sessionid: "6245ca4964dbcfc5141deff3",
                documentCategory: "final_document",
                name: "KentuckyElectronicRegistrationForm.pdf",
                url: "https://openbluenotarybucket.s3.us-east-2.amazonaws.com/KentuckyElectronicRegistrationForm.pdf",
                type: "application/pdf",
                size: "29829",
                key: "KentuckyElectronicRegistrationForm.pdf",
                bucketName: "openbluenotarybucket",
                uploadedBy: "62281d9e4c049b73f29c55e7",
                uploadedStage: "meet_notary_stage",
                createdAt: "2022-03-31T15:51:42.399Z",
                updatedAt: "2022-03-31T15:51:42.399Z"
              };
            }
          }
        }
        const url = "notary/loads";
        const response = await Vue.axios.post(url, {
          dontGetStripe: true
        }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("response.data", response.data, response.data.sealdata);
        if (response?.data?.sealdata) {
          this.sessionFullData.notaryDatasDoc.sealdata = response.data.sealdata;
        }
        if (response?.data?.notaryCertificates) {
          this.sessionFullData.notaryDatasDoc.notaryCertificates = response.data.notaryCertificates;
        }
      }
      this.sessionDataFetched = true;
      console.log(this.sessionFullData);
      if (this.sessionFullData && !this.sessionFullData.allDocumentDocs) {
        this.sessionFullData.allDocumentDocs = [this.sessionFullData.originalDocument];
      }
      this.allDocumentList = this.sessionFullData.allDocumentDocs;
      this.allDocumentListKeyedById = _.keyBy(this.allDocumentList, "_id");
      this.currentDocumentSelected = this.allDocumentList[0];
      if (this.sessionFullData && this.sessionFullData.notaryDatasDoc && this.sessionFullData.notaryDatasDoc.sealdata) {
        this.allImagesData.notarySealImage = this.sessionFullData.notaryDatasDoc.sealdata;
      }
      this.videoCallRoomNumber = `bnSession${roomNumberSessionId}`;
      this.notorizationType = (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.notorizationType) ? [this.sessionFullData.newSessionModelData.notorizationType] : [];
      this.emptyPagesAdded = (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.emptyPagesAdded) || 0;
      this.emptyPagesAddedDocIdWise = (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.emptyPagesAddedDocIdWise) || {};
      this.maxWitnessJoined = (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.maxWitnessJoined) || 0;
      this.attachCertificate = (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.attachCertificate) || false;
      this.sessionChargeOnBusinessUser = (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.sessionChargeOnBusinessUser) || false;
      if (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.dontUseOpenVidu) {
        this.useOpenVidu = false;
      }
      if (this.sessionFullData?.newSessionModelData?.multiSignerList) {
        this.multiSignerList = this.sessionFullData.newSessionModelData.multiSignerList;
        this.oldMultiSignerList = JSON.parse(JSON.stringify(this.sessionFullData.newSessionModelData.multiSignerList));
      }
      this.businessUserSubsidizedSession = (this.sessionFullData && this.sessionFullData.businessUserSubsidizedSession) || false;
      this.allNotaryCertificates = (this.sessionFullData && this.sessionFullData.notaryDatasDoc && this.sessionFullData.notaryDatasDoc.notaryCertificates) || [];
      this.multiSignerUserDocs = (this.sessionFullData && this.sessionFullData.multiSignerUserDocs) || [];
      this.allDroppedElementsDocIdWise = (this.sessionFullData && this.sessionFullData.pdfDroppedElementDatas && this.sessionFullData.pdfDroppedElementDatas.droppedElementsDocIdWise) || {};
      this.emptyPagesAddedDocIdWise = (this.sessionFullData && this.sessionFullData.pdfDroppedElementDatas && this.sessionFullData.pdfDroppedElementDatas.emptyPagesAddedDocIdWise) || this.emptyPagesAddedDocIdWise;
      this.allDocumentPagesViewports = (this.sessionFullData && this.sessionFullData.pdfDroppedElementDatas && this.sessionFullData.pdfDroppedElementDatas.allDocumentPagesViewports) || this.allDocumentPagesViewports;
      this.joinedAsSessionNotary = this.sessionFullData.newSessionModelData.notaryUserId === this.$user._id;
      this.currentSessionBlueNotaryOpenCall = this.sessionFullData.newSessionModelData.sessionPickedCallForTakingAt;
      if (this.currentSessionBlueNotaryOpenCall && this.sessionFullData.vendorDoc?.openCallSettings?.vendorTeamInternalOpenCall && this.sessionFullData.newSessionModelData?.vendor) {
        this.currentSessionBlueNotaryOpenCall = false;
      }
      if (this.pdfMode === "template" || this.sessionid === "simulator") {
        this.joinedAsSessionNotary = true;
      }
      this.joinedAsPrimarySigner = this.sessionFullData.newSessionModelData.userId === this.$user._id;
      let multiSignerIndex = 0;
      _.map(this.multiSignerUserDocs, (tempMultiDocs) => {
        this.inSessionKBAStage[`additionalSigner${String(multiSignerIndex)}`] = tempMultiDocs?.identityData?.additionalSignerNextStage || "";
        if (tempMultiDocs._id === String(this.$user._id)) {
          this.joinedAsSecondarySigner = true;
          this.joinedAsSecondarySignerIndex = multiSignerIndex;
        }
        multiSignerIndex += 1;
      });
      _.map(this.sessionFullData.newSessionModelData?.pointOfContacts || [], (pocDoc) => {
        if (pocDoc.email === this.$user.email) {
          this.joinedAsPOC = true;
        }
      });
      if (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.performInSessionKBA && (this.joinedAsSessionNotary || this.joinedAsPrimarySigner || this.joinedAsSecondarySigner)) {
        this.inSessionKBAForPrimarySignerFlow = true;
        if (this.joinedAsPrimarySigner) {
          if (this.sessionFullData?.customerUser?.identityData?.additionalSignerNextStage === "meet_notary") {
            this.waitingRoomChecklist.inSessionKBADoneForPrimarySigner = true;
          } else if (this.useOpenVidu) {
              this.openModalForInSessionKBA = true;
            }
        }
        if (this.joinedAsSecondarySigner) {
          if (this.sessionFullData?.multiSignerUserDocs?.[this.joinedAsSecondarySignerIndex]?.identityData?.additionalSignerNextStage === "meet_notary") {
            this.waitingRoomChecklist.inSessionKBADoneForPrimarySigner = true;
          } else if (this.useOpenVidu) {
              this.openModalForInSessionKBA = true;
            }
        }
        if (this.joinedAsSessionNotary) {
          this.inSessionKBAStage.primarySigner = this.sessionFullData?.customerUser?.identityData?.additionalSignerNextStage || "";
          if (this.inSessionKBAStage.primarySigner === "meet_notary") {
            this.waitingRoomChecklist.inSessionKBADoneForPrimarySigner = true;
          }
          this.getKBAStatusNameFromStageName();
        }
      } else {
        this.waitingRoomChecklist.inSessionKBADoneForPrimarySigner = true;
      }
      if (this.sessionFullData?.newSessionModelData?.markSessionCompleteAsNonDisabled) {
        this.intializingCompletionCallback(false);
      }
      this.vendorSkipSessionCharges = this.sessionFullData?.vendorDoc?.skipSessionCharges || false;
      this.vendorChargesPaidToNotaryFromBN = this.sessionFullData?.vendorDoc?.chargesPaidToNotaryFromBN || false;
      this.failedSession = this.sessionFullData?.newSessionModelData?.status === "failed";
      if (this.failedSession) {
        setTimeout(() => {
          this.$router.replace("/business");
        }, 20000);
        return false;
      }
      console.log("this.$user.role", this.$user.role);
      if (!(this.pdfMode === "template" || this.sessionid === "simulator")) {
        this.preSessionIncomplete = this.$user.role === "customer" && !this.joinedAsPOC && !this.joinedAsWitness && this.sessionFullData?.newSessionModelData?.currentStage !== "meet_notary_stage";
      }
      if (this.preSessionIncomplete) {
        setTimeout(() => {
          this.$router.replace("/business");
        }, 20000);
        return false;
      }
      if (this.sessionFullData && this.sessionFullData.pdfDroppedElementDatas) {
        this.sessionFullData.pdfDroppedElementDatas.droppedElements = _.map(this.sessionFullData.pdfDroppedElementDatas.droppedElements || [], (droppedElement) => {
          if (droppedElement.text === "Signer's Full Name") {
            droppedElement.text = (this.sessionFullData && this.sessionFullData.customerUser && this.sessionFullData.customerUser.name) || "Signer's Full Name";
          }
          if (droppedElement.text === "Notary Name") {
            droppedElement.text = (this.sessionFullData && this.sessionFullData.notaryUser && this.sessionFullData.notaryUser.name) || "Notary Name";
          }
          if (droppedElement.text === "Notary Initials") {
            let userInitials = "Notary Initials";
            if (this.sessionFullData && this.sessionFullData.notaryUser && this.sessionFullData.notaryUser.name) {
              try {
                if (this.sessionFullData.notaryUser.first_name && this.sessionFullData.notaryUser.last_name) {
                  userInitials = this.sessionFullData.notaryUser.first_name.substring(0, 1).toUpperCase() + this.sessionFullData.notaryUser.last_name.substring(0, 1).toUpperCase();
                } else {
                  const rgx = new RegExp(/(\p{L}{1})\p{L}+/, "gu");
                  let initials = [...this.sessionFullData.notaryUser.name.matchAll(rgx)] || [];
                  initials = (
                    (initials.shift()?.[1] || "") + (initials.pop()?.[1] || "")
                  ).toUpperCase();
                  userInitials = initials;
                }
              } catch (error) {
                console.log("ERROR IN INITIAL NAME CALCUATIO", error);
              }
            }
            droppedElement.text = userInitials;
          }
          return droppedElement;
        });
      }
      if (this.allDroppedElementsDocIdWise) {
        _.map(this.allDroppedElementsDocIdWise, (droppedElements, tempDocumentId) => {
          const tempDroppedElements = _.map(droppedElements, (droppedElement) => {
            if (droppedElement.text === "Signer's Full Name") {
              droppedElement.text = (this.sessionFullData && this.sessionFullData.customerUser && this.sessionFullData.customerUser.name) || "Signer's Full Name";
            }
            if (droppedElement.text === "Notary Name") {
              droppedElement.text = (this.sessionFullData && this.sessionFullData.notaryUser && this.sessionFullData.notaryUser.name) || "Notary Name";
            }
            if (droppedElement.text === "Notary Initials") {
              let userInitials2 = "Notary Initials";
              if (this.sessionFullData && this.sessionFullData.notaryUser && this.sessionFullData.notaryUser.name) {
                try {
                  if (this.sessionFullData.notaryUser.first_name && this.sessionFullData.notaryUser.last_name) {
                    userInitials2 = this.sessionFullData.notaryUser.first_name.substring(0, 1).toUpperCase() + this.sessionFullData.notaryUser.last_name.substring(0, 1).toUpperCase();
                  } else {
                    const rgx = new RegExp(/(\p{L}{1})\p{L}+/, "gu");
                    let initials = [...this.sessionFullData.notaryUser.name.matchAll(rgx)] || [];
                    initials = (
                      (initials.shift()?.[1] || "") + (initials.pop()?.[1] || "")
                    ).toUpperCase();
                    userInitials2 = initials;
                  }
                } catch (error) {
                  console.log("ERROR IN INITIAL NAME CALCUATIO", error);
                }
              }
              droppedElement.text = userInitials2;
            }
            return droppedElement;
          });
          this.allDroppedElementsDocIdWise[tempDocumentId] = tempDroppedElements;
        });
      }
      // console.log(this.sessionFullData);
      // console.log("this.allDroppedElementsDocIdWise", this.allDroppedElementsDocIdWise);
      // (this.sessionFullData && this.sessionFullData.customerUser && this.sessionFullData.customerUser.name)
      _.map(this.allDocumentList, (tempDocumentDoc) => {
        if (!this.allDroppedElementsDocIdWise[tempDocumentDoc._id]) {
          Vue.set(this.allDroppedElementsDocIdWise, tempDocumentDoc._id, []);
        }
        if (!this.emptyPagesAddedDocIdWise[tempDocumentDoc._id]) {
          Vue.set(this.emptyPagesAddedDocIdWise, tempDocumentDoc._id, 0);
        }
      });
      // if (this.allImagesData.notarySealImage) {
      //   this.getMeta(
      //     this.allImagesData.notarySealImage,
      //     (width, height) => {
      //       if (width && height) {
      //         this.signatureFields = _.map(this.signatureFields, (singatureField) => {
      //           if (singatureField.image_field_type === "notary_seal") {
      //             const aspectRatio = width / height;
      //             singatureField.width = `${100 * aspectRatio}px`;
      //           }
      //           return singatureField;
      //         });
      //       }
      //     }
      //   );
      // }
      // console.log(this.allNotaryCertificates);
      // _.map(this.allNotaryCertificates, (notaryCertificate) => {
      //   this.getMeta(
      //     notaryCertificate.url,
      //     (width, height) => {
      //       if (width && height) {
      //         const aspectRatio = width / height;
      //         notaryCertificate.width = 400 * aspectRatio;
      //         notaryCertificate.height = 400;
      //       }
      //     }
      //   );
      // });
      return true;
    },
    closeAddWitnessModal() {
      this.showAddWitnessModal = false;
    },
    async getSessionWitnessDetails() {
      if (this.pdfMode === "template" || this.sessionid === "simulator") {
        return;
      }
      const sessionWitnessUrl = `/session/getAllSessionWitnesses/${this.sessionid}`;
      let sessionFullData = false;
      try {
        sessionFullData = await Vue.axios.get(sessionWitnessUrl);
      } catch (error) {}
      const currentSessionWitnessUsers = (sessionFullData && sessionFullData.data && sessionFullData.data.sessionWitnesses) || [];
      this.currentSessionWitnessUsers = _.map(currentSessionWitnessUsers, (witnessUserDoc) => {
        if (witnessUserDoc.userid && _.includes(this.currentPageUsers, witnessUserDoc.userid)) {
          witnessUserDoc.userActive = true;
        } else {
          witnessUserDoc.userActive = false;
        }
        return witnessUserDoc;
      });
    },
    witnessRemoveClicked(sessionWitnessDoc) {
      console.log("sessionWitnessDoc", sessionWitnessDoc);
      this.witnessDeleteConfirmationModal = true;
      this.witnessDeleteDoc = sessionWitnessDoc;
    },
    async witnessRemoveDialogClicked() {
      console.log(this.witnessDeleteDoc);
      const saveUrl = "session/removeSessionWitness";
      const dataToSave = {
        sessionid: this.sessionid,
        sessionwitnessid: this.witnessDeleteDoc._id
      };
      const response = await this.axios.post(saveUrl, dataToSave, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      this.$q.notify({
        color: "primary",
        position: "bottom-right",
        message: "Witness Removed Successfully from session",
      });
      this.socketRequest("session_witness_removed", {
        removedUserId: this.witnessDeleteDoc.userid
      });
      this.socketRequest("session_witness_management_changed");
      this.getSessionWitnessDetails();
    },
    async saveDraftOfCurrentSession() {
      if (this.completePDFLoadingModal) {
        return;
      }
      // Create a new cancel token for this request
      const source = this.axios.CancelToken.source();
      const tempRequestId = String(Math.floor(Math.random() * 99999));

      // Store the cancel token for this request
      this.currentIntervalSyncCancelTokens[tempRequestId] = source;

      const saveUrl = "session/saveDraftOfCurrentSession";
      const dataToSave = {
        sessionid: this.sessionid,
        droppedElementsDocIdWise: this.allDroppedElementsDocIdWise,
        emptyPagesAddedDocIdWise: this.emptyPagesAddedDocIdWise,
        allDocumentPagesViewports: this.allDocumentPagesViewports
      };
      this.axios.post(saveUrl, dataToSave, {
        cancelToken: source.token,
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        console.log("response", response);
        // Remove the cancel token for this request
        delete this.currentIntervalSyncCancelTokens[tempRequestId];
        // Do something with the response
      })
      .catch((error) => {
        console.log("error", error);
      });
    },
    async saveUserDetails() {
      const getUrl = "session/saveUserDetails";
      const response = await this.axios.get(getUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
    },
    captureCamera(cb) {
      const captureCameraInterval = setInterval(() => {
        console.log("ios called again");
        const iOS = ["iPad", "iPhone", "iPod", "MacIntel", "Macintosh", "iPhone Simulator", "iPod Simulator", "iPad Simulator"].indexOf(navigator.platform) >= 0;
        console.log("iOS", iOS, navigator.platform);
        if (iOS) {
          const videoList = this.$refs.webrtc && this.$refs.webrtc.videoList;
          if (videoList && videoList[0]) {
            clearInterval(captureCameraInterval);
            cb(videoList[0].stream.clone());
          }
        } else {
          console.log("capture camera called", this.$refs.webrtc);
          clearInterval(captureCameraInterval);
          navigator.mediaDevices.getUserMedia({
            audio: true,
              video: {
                facingMode: "user"
            }
          }).then(cb);
        }
      }, 2000);
    },
    getSupportedMimeTypes(media, types, codecs) {
      const isSupported = MediaRecorder.isTypeSupported;
      const supported = [];
      types.forEach((type) => {
        const mimeType = `${media}/${type}`;
        codecs.forEach((codec) => [
            `${mimeType};codecs=${codec}`,
            `${mimeType};codecs=${codec.toUpperCase()}`,
            // /!\ false positive /!\
            // `${mimeType};codecs:${codec}`,
            // `${mimeType};codecs:${codec.toUpperCase()}`
          ].forEach((variation) => {
            if (isSupported(variation)) {
              supported.push(variation);
            }
        }));
        if (isSupported(mimeType)) { supported.push(mimeType); }
      });
      if (navigator.userAgent.search("Firefox") > -1) {
        return ["video/webm"];
      }
      return supported;
    },
    checkVideoRecording() {
      if (this.pdfMode === "template" || this.sessionid === "simulator") {
        return;
      }
      if (this.useOpenVidu) {
        return;
      }
      this.captureCamera((camera) => {
        console.log("ios camera", camera);
        window.cameraStreamChecking = camera;
        const videoTypes = ["webm", "ogg", "mp4", "x-matroska"];
        const codecs = ["should-not-be-supported", "vp9", "vp9.0", "vp8", "vp8.0", "avc1", "av1", "h265", "h.265", "h264", "h.264", "opus", "pcm", "aac", "mpeg", "mp4a"];

        try {
          const supportedVideos = this.getSupportedMimeTypes("video", videoTypes, codecs);
          console.log(supportedVideos);
          const mediaRecorder = new MediaRecorder(camera, {
            mimeType: supportedVideos[0],
            // mimeType: "video/mp4;codecs=avc1",
            frameInterval: 10,
            videoBitsPerSecond: 128000,
          });
          mediaRecorder.ondataavailable = (e) => {
            console.log("ondataavailabletest called", e.data);
            this.videoRecordingFailed = false;
            try {
              if (mediaRecorder.state === "recording") {
                console.log("stopping recorder checkVideoRecording");
                mediaRecorder.stop();

                window.cameraStreamChecking.getTracks().forEach((track) => track.stop());
              }
            } catch (error) {
              console.log("media error", error);
            }
          };
          mediaRecorder.start(500);
        } catch (error) {
          console.log("error", error);
          this.videoRecordingFailed = true;
          this.videoCallStarted = false;
          this.endVideoCall();
        }
      });
    },
    videoRecordingFailedModalConfirmClicked() {
      if (this.$user.role === "customer") {
        this.$router.replace("/business");
      } else {
        this.$router.replace("/notary/dashboard");
      }
    },
    joinedRoom(stream) {
      console.log("joined room stream id: ", stream.id);
      const customVideoList = this.$refs.webrtc.videoList;
      if (this.recorderOBJ) {
        this.recordStreams(customVideoList);
      }

      setTimeout(() => {
        _.map($("video"), ((videoElement) => {
          videoElement.controls = "";
        }));
      }, 3000);
    },
    leftRoom(id) {
      const customVideoList = this.$refs.webrtc.videoList;
      console.log("left room stream id: ", id);

      if (this.recorderOBJ) {
        this.recordStreams(customVideoList);
      }

      setTimeout(() => {
        _.map($("video"), ((videoElement) => {
          videoElement.controls = "";
        }));
      }, 3000);
    },
    addStreamtoRecorder(streams) {
      if (!this.recorderOBJ) {
        this.recorderOBJ = RecordRTC(streams, {
          type: "video",
          // bits_per_second = 40000000 for 4K video,
          // bits_per_second = 16000000 for 2K video,
          // bits_per_second = 8000000 for 1080p video,
          // bits_per_second = 5000000 for 720p video,
          // bits_per_second = 2500000 for 480p video,
          // bits_per_second = 1000000 for 360p video
          // set to 128000 if you think users internet are slow.
          // setting it lower bitrate for testing purposes.
          // you can change it to get better quality, but it will
          // take more disk space and require a better internet.
          bitsPerSecond: 128000,
          timeSlice: 5000,
          video: { width: 640, height: 480 },
          ondataavailable: (processedBlob) => {
            if (this.recordRTCStartTime === 0) {
              this.recordRTCStartTime = Date.now();
            }

            if (!window.location.href.includes("pdf_edit")) {
              try {
                if (!this.isRecordingStopped) {
                  const dataToSend = {
                    sessionid: this.sessionid,
                    user: this.$user._id,
                    joinedAsSessionNotary: this.joinedAsSessionNotary,
                    timestamp: this.recordRTCStartTime,
                    blob: processedBlob
                  };

                  console.log("sending final video blob after 5 seconds");
                  this.saveVideoStream(dataToSend);
                  this.isRecordingStopped = true;
                  this.stopStreamsRecording();
                }

                // this.endVideoCall();
              } catch (error) {}

              console.log("ondataavailable stopped. Page changed");
              return;
            }

            if (!this.waitingRoomModalShow) {
              if (window.currentSocket) {
                const dataToSend = {
                  sessionid: this.sessionid,
                  user: this.$user._id,
                  joinedAsSessionNotary: this.joinedAsSessionNotary,
                  timestamp: this.recordRTCStartTime,
                  blob: processedBlob
                };
                this.saveVideoStream(dataToSend);
              }
            }
          }
        });

        console.log("starting recorder with streams: ", streams);
        this.recorderOBJ.startRecording();
        this.isRecordingStopped = false;
      } else {
        console.log("resetting recorder with streams: ", streams);
        this.recorderOBJ.getInternalRecorder().resetVideoStreams(streams);
      }
      window.recorderOBJ = this.recorderOBJ;
    },
    recordStreams(videoListToRecord) {
      const videoStreams = [];
      const audioStreams = [];

      videoListToRecord.forEach((videoObject) => {
        const streamTracks = videoObject.stream.getTracks();

        streamTracks.forEach((track) => {
          if (track.kind === "video") {
            const tmpMediaStream = new MediaStream();
            tmpMediaStream.addTrack(track.clone());
            videoStreams.push(tmpMediaStream);
          } else if (track.kind === "audio") {
            const tmpMediaStream = new MediaStream();
            tmpMediaStream.addTrack(track.clone());
            audioStreams.push(tmpMediaStream);
          }
        });
      });

      let finalStreams = [];
      if (videoStreams.length > 0 && audioStreams.length > 0) {
        finalStreams = finalStreams.concat(videoStreams);
        finalStreams = finalStreams.concat(audioStreams);
      } else if (videoStreams.length > 0) {
        finalStreams = finalStreams.concat(videoStreams);
      } else if (audioStreams.length > 0) {
        if (!this.blackMediaStream) {
          this.blackMediaStream = ({ width = 640, height = 480 } = {}) => {
            const canvas = Object.assign(document.createElement("canvas"), { width, height });
            canvas.getContext("2d").fillRect(0, 0, width, height);
            const stream = canvas.captureStream();
            return stream;
          };
        } else {
          videoStreams.push(this.blackMediaStream());
        }

        finalStreams = finalStreams.concat(videoStreams);
        finalStreams = finalStreams.concat(audioStreams);
      }

      if (finalStreams.length > 0) {
        if (this.recordRtcActiveStreams.length > 0) {
          this.recordRtcActiveStreams.forEach((stream) => {
            const streamTracks = stream.getTracks();
            streamTracks.forEach((track) => {
              track.stop();
            });
          });
        }
        this.recordRtcActiveStreams = [];
        this.recordRtcActiveStreams = finalStreams;
        this.addStreamtoRecorder(finalStreams);
      }
    },
    pauseStreamsRecording() {
      if (this.recorderOBJ && this.recorderOBJ.state === "recording") {
        console.log("recording paused.");
        this.recorderOBJ.pauseRecording();
      }
    },
    resumeStreamsRecording() {
      if (this.recorderOBJ && this.recorderOBJ.state === "paused") {
        console.log("recording resumed.");
        this.recordStreams(this.$refs.webrtc.videoList);
        this.recorderOBJ.resumeRecording();
      }
    },
    stopStreamsRecording() {
      if (this.recorderOBJ) {
        this.recorderOBJ.stopRecording();
        this.recorderOBJ = null;

        if (this.recordRtcActiveStreams.length > 0) {
          this.recordRtcActiveStreams.forEach((stream) => {
            const streamTracks = stream.getTracks();
            streamTracks.forEach((track) => {
              track.stop();
            });
          });
        }
        this.recordRtcActiveStreams = [];
      }
    },
    intializingCompletionCallback(mediaRecorder) {
      window.stopCallback = async (outputStatus, firstDocument, lastDocument, originalDocumentId, localOutputFileObject) => {
        console.log("firstDocument", firstDocument);
        console.log("lastDocument", lastDocument);
        console.log("localOutputFileObject", originalDocumentId, localOutputFileObject);
        if (lastDocument) {
          window.stopCallback = null;
          try {
            mediaRecorder.stop();

            if (!this.isRecordingStopped) {
              this.isRecordingStopped = true;
              this.stopStreamsRecording();
            }
          } catch (error) {
            console.log("mediaRecorder error", error);
          }
        }
        console.log("outputStatus", outputStatus);
        if (outputStatus === "success") {
          const documentSaveUrl = `file/pdfEditsFinalDocumentSave/${this.sessionid}`;
          const formData2 = new FormData();
          formData2.append("filename", `Signed_${this.sessionFullData.originalDocument.name}`);
          formData2.append("lastDocument", lastDocument);
          formData2.append("originalDocumentId", originalDocumentId);
          formData2.append("file", localOutputFileObject);
          this.completePDFLoadingDetails.progress = 0.8;
          this.completePDFLoadingDetails.progressText = "Saving Final PDF Document";

          const documentSaveResponse = await this.axios.post(documentSaveUrl, formData2, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          let paymentFailed = false;
          let paymentDone;
          console.log(paymentDone);
          if (lastDocument) {
            paymentDone = "failure";
            if (documentSaveResponse && documentSaveResponse.data && documentSaveResponse.data.paymentDone === "success") {
              paymentDone = "success";
              this.socketRequest("session_completed");
            } else {
              paymentFailed = true;
              this.socketRequest("session_completed_payment_failed");
            }
          }
          if (lastDocument) {
            this.completePDFLoadingDetails.progress = 1;
            this.completePDFLoadingDetails.progressText = "All Done";
            if (paymentFailed) {
              this.completePDFLoadingDetails.progressText += " (But Payment Failed from Customer's end. Prompting Customer to Re-enter Payment Details)";
            }
            try {
              const videoSaveUrl = `file/pdfEditsVideoDocumentSave/${this.sessionid}`;
              this.axios.post(videoSaveUrl, {}, {});
            } catch (error) {
              console.log(error);
            }
            setTimeout(() => {
              this.endVideoCall();
              this.completePDFLoadingModal = false;
              if (this.joinedAsWitness) {
                this.confirmationSessionDialog = true;
              } else {
                this.$router.replace(`/notary/my-sessions?confirmationSession=${this.sessionid}&paymentDone=${paymentDone}`);
              }
            }, 7000);
          }
        }
      };
    },
    startVideoRecording() {
      if (this.pdfMode === "template" || this.sessionid === "simulator") {
        return;
      }
      if (this.useOpenVidu) {
        this.intializingCompletionCallback(false);
        if (this.primarySignerJoinedSession || this.internalForceParam) {
          this.openViduStartRecording();
        }
      } else {
        console.log("window.cameraStream", window.cameraStream);
        this.captureCamera((camera) => {
          this.videoRecordingStarted = true;
          window.cameraStream = camera;
          const videoTypes = ["webm", "ogg", "mp4", "x-matroska"];
          const audioTypes = ["webm", "ogg", "mp3", "x-matroska"];
          const codecs = ["should-not-be-supported", "vp9", "vp9.0", "vp8", "vp8.0", "avc1", "av1", "h265", "h.265", "h264", "h.264", "opus", "pcm", "aac", "mpeg", "mp4a"];

          const supportedVideos = this.getSupportedMimeTypes("video", videoTypes, codecs);
          const supportedAudios = this.getSupportedMimeTypes("audio", audioTypes, codecs);

          console.log("-- Top supported Video : ", supportedVideos[0]);
          console.log("-- Top supported Audio : ", supportedAudios[0]);
          console.log("-- All supported Videos : ", supportedVideos);
          console.log("-- All supported Audios : ", supportedAudios);

          const mediaRecorder = new MediaRecorder(camera, {
            mimeType: supportedVideos[0],
            // mimeType: "video/mp4;codecs=avc1",
            frameInterval: 10,
            videoBitsPerSecond: 64000,
          });

          mediaRecorder.ondataavailable = (e) => {
            if (!window.location.href.includes("pdf_edit")) {
              try {
                mediaRecorder.stop();
                this.endVideoCall();
              } catch (error) {}
              console.log("ondataavailable stopped. Page changed");
              return;
            }
            if (this.sessionRecordingStartedAt === 0) {
              this.sessionRecordingStartedAt = Date.now();
            }
            if (!this.waitingRoomModalShow) {
              const dataToSend = {
                sessionid: this.sessionid,
                user: this.$user._id,
                blob: e.data,
                joinedAsSessionNotary: this.joinedAsSessionNotary,
                timestamp: this.sessionRecordingStartedAt,
                recordertype: "OM"
              };
              this.saveVideoStream(dataToSend);
            }
          };

          // start recording with each recorded blob having 5 second video
          if (!this.videoRecordingStartedInternal) {
            mediaRecorder.start(5000);
            this.videoRecordingStartedInternal = true;
            this.recordStreams(this.$refs.webrtc.videoList);
            console.log("mediaRecordermediaRecorder started");
          }
          if (this.joinedAsSessionNotary) {
            this.socketRequest("session_recording_started");
          }
          this.intializingCompletionCallback(mediaRecorder);
        });
      }
    },
    resizeEvent(e) {
      if (!this.isMobile() && e.target.self === window) {
        let fieldIndex = 0;
        _.map(this.allDroppedElements, (localDroppedElement) => {
          if (!localDroppedElement) {
            return;
          }
          this.deleteBox($(`#signature-element${localDroppedElement.elementId}`), localDroppedElement.elementId, false);
          this.createNewSignatureElement(localDroppedElement, fieldIndex, true);
          fieldIndex += 1;
        });
      }
    },
    async checkUserDetails() {
      this.showCheckUserDetailsModal = true;
      // this.checkUserDetailsModalLoading = true;
      if (this.pdfMode === "template" || this.sessionid === "simulator") {
        this.userDetailsModalFrontImageUrl = "https://bluenotary.us/assets/img/sample-id-front.png";
        // this.checkUserDetailsModalLoading = false;
        return;
      }
      const userFullDetails = await Vue.axios.post(`/session/getCustomerDetailsAfterChecking/${this.sessionid}`);
      // this.checkUserDetailsModalLoading = false;
      console.log(userFullDetails);
      this.userDetailsModalDataRows = userFullDetails?.data?.allDetail || [];
      this.userDetailsModalFrontImageUrl = userFullDetails?.data?.frontPhotoUrl || false;
      this.userDetailsModalBackImageUrl = userFullDetails?.data?.backPhotoUrl || false;
      this.userDetailsModalResponse = userFullDetails?.data || {};
      // otherSignersCheckSignerIdKeyed
      _.map(this.userDetailsModalResponse?.otherSigners || [], (tempOtherSigner) => {
        if (tempOtherSigner?.identityDataResponse?.email) {
          this.otherSignersCheckSignerIdKeyed[tempOtherSigner?.identityDataResponse?.email] = tempOtherSigner;
        }
      });
      console.log("this.userDetailsModalResponse", this.userDetailsModalResponse);
      console.log(this.userDetailsModalDataRows);
      console.log(this.userDetailsModalDataRows.length);
      // console.log(this.multiSignerUserDocs);
    },
    closeUserDetailsModal() {
      this.showCheckUserDetailsModal = false;
    },
    closeCustomerThankyouModal() {
      this.endVideoCall();
      this.$router.replace(`/business?confirmationSession=${this.sessionid}`);
    },
    terminateClicked() {
      if (this.sessionid === "simulator") {
        this.endVideoCall();
        this.socketRequest("session_terminated");
        this.$router.replace("/notary/dashboard");
      } else {
        this.terminateModalShow = true;
        // this.$q.dialog({
        //   title: "Confirm",
        //   message: "Are you sure you want to terminate this Session?",
        //   cancel: true,
        //   persistent: true
        // }).onOk(() => {
        //   this.endVideoCall();
        //   this.socketRequest("session_terminated");
        //   this.$router.replace("/notary/my-sessions");
        //   this.$q.notify({
        //     message: "Session Terminated Successfully.",
        //     color: "black"
        //   });
        // });
      }
    },
    async finalTerminateClicked() {
      this.terminateModalButtonLoading = true;
      if (!this.terminateSessionOptions.reason.trim().length) {
        this.$q.notify({
          message: "Please provide reason to terminate the session.",
          color: "black"
        });
        this.terminateModalButtonLoading = false;
        return;
      }
      const saveUrl = `session/terminateSession/${this.sessionid}`;
      const response = await this.axios.post(saveUrl, {
        terminateSessionOptions: JSON.stringify(this.terminateSessionOptions)
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.terminateModalButtonLoading = false;
      console.log("response", response);
      this.endVideoCall();
      this.socketRequest("session_terminated");
      this.$router.replace("/notary/my-sessions");
      this.$q.notify({
        message: "Session Terminated Successfully.",
        color: "black"
      });
    },
    startVideoCall() {
      if (!this.useOpenVidu) {
        if (this.$refs.webrtc) {
          this.$refs.webrtc.join();
          setTimeout(() => {
            _.map($("video"), ((videoElement) => {
              videoElement.controls = "";
            }));
          }, 3000);
          this.videoCallStarted = true;
          this.$watch(
            () => this.$refs.webrtc.videoList,
            (value) => {
            if (value && value.length >= 2) {
              if (this.$user.role === "customer" && !(this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.notaryUserId)) {
                this.fetchSessionDoc();
              }
              this.waitingRoomChecklist.videoEnabledByAllParties = true;
              this.waitingRoomChecklist.allPartiesJoined = true; // Temp thing
            } else {
              this.waitingRoomChecklist.videoEnabledByAllParties = false;
            }
          }
        );
        } else {
          setTimeout(this.startVideoCall, 2000);
        }
      } else {
        this.openViduJoinSession();
      }
    },
    endVideoCall() {
      if (this.$refs.webrtc && !this.useOpenVidu) {
        try {
          this.$refs.webrtc.leave();
        } catch (error) {
          console.log("error1", error);
        }
        try {
          const videoList = (this.$refs.webrtc && this.$refs.webrtc.videoList) || [];
          if (videoList && videoList[0]) {
            videoList[0].stream.stop();
          }
        } catch (error) {
          console.log("error2", error);
        }
      }
      if (this.useOpenVidu) {
        this.openViduLeaveSession();
      }

      try {
        if (window.cameraStream) {
          window.cameraStream.getTracks().forEach((track) => { track.stop(); });
          window.cameraStream = false;
        }
      } catch (error) {
        console.log("error3", error);
      }
      try {
        if (window.cameraStreamChecking) {
          window.cameraStreamChecking.getTracks().forEach((track) => { track.stop(); });
          window.cameraStreamChecking = false;
        }
      } catch (error) {
        console.log("error3", error);
      }
      try {
        if (this.saveDraftInterval) {
          clearInterval(this.saveDraftInterval);
        }
      } catch (error) {
        console.log("error4", error);
      }
      this.videoCallStarted = false;
    },
    logEvent(event) {
      console.log("Event : ", event);
      setTimeout(() => {
        _.map($("video"), ((videoElement) => {
          videoElement.controls = "";
        }));
      }, 3000);
    },
    socketRequest(eventName, extraDataToSend) {
      let socketRequestRoomName = this.tempSocketRoomNumberForSimulator || this.sessionid;
      if (socketRequestRoomName === "simulator" && !this.tempSocketRoomNumberForSimulator) {
        socketRequestRoomName += String(Math.floor(Math.random() * 99999));
        this.tempSocketRoomNumberForSimulator = socketRequestRoomName;
      }
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
    sendSocketChangeRequest(updatedElement) {
      if (!updatedElement) {
        return;
      }
      const dataToSend = {
        sessionid: this.tempSocketRoomNumberForSimulator || this.sessionid,
        updatedField: updatedElement,
        user: this.$user._id
      };
      window.currentSocket.emit("dropped_field_updates", dataToSend, (res) => {
        console.log("dropped_field_updates res", res);
      });
    },
    sendSocketChangeRequestPartial(tempData) {
      console.log("tempData", tempData);
      if (!(tempData?.imageData || tempData?.inputTextValue)) {
        return;
      }
      const dataToSend = {
        sessionid: this.tempSocketRoomNumberForSimulator || this.sessionid,
        partialUpdatedField: tempData,
        user: this.$user._id
      };
      window.currentSocket.emit("partial_dropped_field_updates", dataToSend, (res) => {
        console.log(res);
      });
    },
    pageclick(event) {
      if (this.isTouchDevice && this.selectedDroppableField.name) {
        this.finishDrop(event, this.selectedDroppableField);
        this.selectedDroppableField = {};
      }
    },
    getNewCanvas (page, viewport) {
      const newCanvas = document.createElement("canvas");
      newCanvas.setAttribute("class", "pdf-page");
      newCanvas.setAttribute("id", page);
      newCanvas.height = Math.floor(viewport.height);
      newCanvas.width = Math.floor(viewport.width);
      return newCanvas;
    },

    deleteBox (signatureElement, elementId, doSocketCall) {
      signatureElement.remove();
      this.allDroppedElements = _.map(this.allDroppedElements, (droppedElement) => {
        if (droppedElement.elementId === elementId) {
          const dataToSend = {
            elementId,
            removed: true
          };
          if (doSocketCall) {
            this.sendSocketChangeRequest(dataToSend);
          }
          return false;
        }
        return droppedElement;
      });
    },

    selectionDoneFunction(droppedFieldIndex, dataToSave, elementId) {
      console.log(droppedFieldIndex, dataToSave, JSON.parse(JSON.stringify(this.allDroppedElements)), elementId);
      console.log(elementId);
      if (dataToSave) {
        const element = this.allDroppedElements.find((e) => e.elementId === elementId);
        if (element) {
          Object.assign(element, dataToSave);
          this.sendSocketChangeRequest(element);
        }
        this.sendSocketChangeRequestPartial({
          elementId,
          imageData: dataToSave?.imageData,
          inputTextValue: dataToSave?.inputTextValue
        });
      }
    },

    createNewSignatureElement(droppedElement, indexToInsert, dontSendSocketUpdates) {
      if (!droppedElement) {
        return {};
      }
      const {
        page, text, fieldType, fieldPlaceholderType, fieldPlaceholderUser, fieldPlaceholderUserId, fieldHeight, fieldWidth, x, y, inputTextValue, imageData, screenX, screenY, imageFieldType
      } = droppedElement;
      // console.log(droppedElement);
      let {
        elementId
      } = droppedElement;

      let firstTimeRender = false;
      if (!elementId) {
        elementId = (Math.random() + 1).toString(36).substring(5);
        firstTimeRender = true;
      }
      // let incrementId = false;
      const pageContainer = document.getElementById(`page${page}`);
      if (pageContainer) {
        const pageBounds = $(pageContainer).children(0)[0].getBoundingClientRect();
        const pageContainerBounds = $(pageContainer)[0].getBoundingClientRect();
        const vm = this;
        const newElement = document.createElement("div");
        let finalHeight = `${vm.signatureHeight}px`;
        if (fieldHeight) {
          finalHeight = fieldHeight;
        }
        let finalWidth = `${vm.signatureWidth}px`;
        if (fieldWidth) {
          finalWidth = fieldWidth;
        }
        const finalScreenX = x + pageBounds.left - pageContainerBounds.left;
        newElement.setAttribute("class", "signature-element dropdown");
        newElement.setAttribute("id", `signature-element${elementId}`);
        newElement.style.height = finalHeight;
        newElement.style.width = finalWidth;
        newElement.style.position = "absolute";
        newElement.style.top = `${y}px`;
        newElement.style.fontSize = "15px";
        newElement.style.left = `${finalScreenX}px`;
        newElement.style["border-radius"] = "10px";
        if (fieldType === "input_text") {
          // newElement.style.border = "1px solid black";
        } else {
          newElement.style.border = "1px solid #d5ded7";
        }

        const tempDiv = document.createElement("div");
        tempDiv.setAttribute("id", `field_child_${elementId}`);
        tempDiv.style.height = "100%";
        tempDiv.style.width = "100%";
        newElement.prepend(tempDiv);
        const objectToInsert = {
            screenX,
            screenY,
            x,
            y,
            size: 13,
            color: "black",
            text,
            page,
            fieldType,
            fieldPlaceholderType,
            fieldPlaceholderUser,
            fieldPlaceholderUserId,
            fieldHeight,
            fieldWidth,
            firstTimeRender,
            inputTextValue,
            elementId,
            imageData,
            imageFieldType,
            droppedBy: droppedElement.droppedBy || this.$user._id
        };
        if (!(objectToInsert.fieldType === "signature" || objectToInsert.fieldType === "notary_certificate" || objectToInsert.fieldPlaceholderType === "signature")) {
          objectToInsert.imageData = "";
        }
        if (indexToInsert === false) {
          indexToInsert = this.fieldDroppedIndex;
          this.fieldDroppedIndex += 1;
          this.allDroppedElements.push({ ...objectToInsert, fieldDroppedIndex: indexToInsert });
          // incrementId = true;
        } else {
          this.allDroppedElements.splice(indexToInsert, 0, { ...objectToInsert, fieldDroppedIndex: indexToInsert });
        }

        const canEditElement = this.joinedAsSessionNotary || String(objectToInsert.droppedBy) === String(this.$user._id);
        // if (this.joinedAsWitness) {
        //   canEditElement = false;
        // }
        if (canEditElement) {
          const closeButton = document.createElement("button");
          closeButton.setAttribute("class", "delete");
          closeButton.style.float = "right";
          closeButton.style.top = "-15px";
          closeButton.style.left = "-15px";
          closeButton.style.position = "absolute";
          closeButton.innerHTML = "x";
          newElement.append(closeButton);
          closeButton.addEventListener("click", (e) => {
            e.stopPropagation();
            vm.deleteBox(newElement, elementId, true);
          });
        }
        pageContainer.append(newElement);
        if (canEditElement) {
          if (["checkmark", "static_text"].indexOf(fieldType) === -1) {
            $(`#signature-element${elementId}`).resizable({
              stop: (event, ui) => {
                console.log(event, ui);
                const finalSize = ui.size;
                this.allDroppedElements = _.map(this.allDroppedElements, (localDroppedElement) => {
                  if (localDroppedElement.elementId === elementId) {
                    const deltaWidth = finalSize.width - ui.originalSize.width;
                    const deltaHeight = finalSize.height - ui.originalSize.height;
                    console.log(deltaWidth, deltaHeight);
                    console.log(JSON.parse(JSON.stringify(localDroppedElement)));
                    localDroppedElement.fieldHeight = `${finalSize.height}px`;
                    localDroppedElement.fieldWidth = `${finalSize.width}px`;
                    // localDroppedElement.x += (deltaWidth / 2);
                    // localDroppedElement.y -= (deltaHeight / 2);
                    console.log(JSON.parse(JSON.stringify(localDroppedElement)));
                    this.sendSocketChangeRequest(localDroppedElement);
                    if (this.allDroppedElementsVueComponents[elementId]?.fieldWidth) {
                      this.allDroppedElementsVueComponents[elementId].fieldWidth = localDroppedElement.fieldWidth;
                      this.allDroppedElementsVueComponents[elementId].fieldHeight = localDroppedElement.fieldHeight;
                    }
                  }
                  return localDroppedElement;
                });
              }
            });
          }
          $(`#signature-element${elementId}`).draggable({
            stop: (event, ui) => {
              console.log(event, ui);
              const pdfPageBounds = event.target.parentNode.children[0].getBoundingClientRect();
              const finalX = ui.offset.left;
              // const finalX = ui.position.left;
              const finalY = ui.position.top;
              console.log(finalY);
              this.allDroppedElements = _.map(this.allDroppedElements, (localDroppedElement) => {
                if (localDroppedElement.elementId === elementId) {
                  localDroppedElement.screenX = finalX;
                  localDroppedElement.screenY = finalY + 116;
                  const positionWrtPageX = Math.round(finalX - pdfPageBounds.x);
                  localDroppedElement.x = positionWrtPageX;
                  localDroppedElement.y = finalY;
                  console.log(finalX, pdfPageBounds.x, positionWrtPageX);
                  console.log(localDroppedElement);
                  this.sendSocketChangeRequest(localDroppedElement);
                }
                return localDroppedElement;
              });
            }
          });
        }
        const MyWidget = Vue.extend(DroppedFieldComponent);
        if (this.allDroppedElementsVueComponents[elementId]) {
          this.allDroppedElementsVueComponents[elementId].$destroy();
        }
        console.log("fieldWidth", fieldWidth);
        const mounted = new MyWidget({
          parent: this,
          propsData: {
            fieldType,
            fieldText: text,
            fieldDroppedIndex: indexToInsert,
            fieldPlaceholderType,
            fieldPlaceholderUser,
            fieldPlaceholderUserId,
            selectedFieldIndex: this.allDroppedElements.length - 1,
            selectionDoneFunction: this.selectionDoneFunction,
            firstTimeRender,
            inputTextValueToPass: inputTextValue,
            imageData,
            elementId,
            imageFieldType,
            allImagesData: this.allImagesData,
            allNotaryCertificates: this.allNotaryCertificates,
            copyDroppedElementToAllPages: this.copyDroppedElementToAllPages,
            joinedAsWitness: this.joinedAsWitness,
            canEditElement,
            fieldHeight,
            fieldWidth
          }
        }).$mount(document.getElementById(`field_child_${elementId}`));
        this.allDroppedElementsVueComponents[elementId] = mounted;
        // if (incrementId) {
        //   elementId += 1;
        // }
        if (!dontSendSocketUpdates) {
          this.sendSocketChangeRequest(this.allDroppedElements[this.allDroppedElements.length - 1]);
        }
        return {
          newElement,
          recipientEmail: vm.selectedRecipientEmail,
        };
      }
      console.log("returning null for CreateNewElement function since page is not found at the moment.");
      return null;
    },

    copyDroppedElementToAllPages(event, droppedElementId) {
      console.log(event);
      console.log(droppedElementId);
      let droppedElementDoc = false;
      _.map(this.allDroppedElements, (tempDoc) => {
        if (tempDoc.elementId === droppedElementId) {
          droppedElementDoc = tempDoc;
        }
      });
      console.log(droppedElementDoc);
      for (let tempPage = 1; tempPage <= this.totalPages; tempPage += 1) {
        if (droppedElementDoc.page !== String(tempPage)) {
          const docToInsert = JSON.parse(JSON.stringify(droppedElementDoc));
          docToInsert.elementId = (Math.random() + 1).toString(36).substring(5);
          docToInsert.page = String(tempPage);
          this.createNewSignatureElement(docToInsert, false);
        }
      }
      this.$q.notify({
        color: "primary",
        position: "bottom-right",
        message: "Field Element Added on all Pages",
      });
    },

    dropOnPdf (event) {
      event.preventDefault();
      event.stopPropagation();
    },

    startDrag(event, field, name, type, placeholderType, placeholderUser, placeholderUserId, textToInsert, height, width) {
      event.dataTransfer.setData("field", field);
      event.dataTransfer.setData("name", name);
      event.dataTransfer.setData("type", type);
      event.dataTransfer.setData("placeholder_type", placeholderType);
      event.dataTransfer.setData("placeholder_user", placeholderUser);
      event.dataTransfer.setData("placeholder_user_id", placeholderUserId);
      event.dataTransfer.setData("text_to_insert", textToInsert);
      if (height) {
        event.dataTransfer.setData("height", height);
      }
      if (width) {
        event.dataTransfer.setData("width", width);
      }
      this.realDragStarted = true;
    },

    async addNewPage() {
      if (this.joinedAsSessionNotary && !this.joinedAsWitness) {
        this.$q.dialog({
          title: "Confirm",
          message: "Are you sure you want to add a new blank page at bottom of the pdf?",
          cancel: true,
          persistent: true
        }).onOk(() => {
          this.totalPages += 1;
          this.emptyPagesAdded += 1;
          const currentPage = this.totalPages;
          const pdfContainer = document.getElementById("pdf-pages-container");
          const newCanvas = this.getNewCanvas(currentPage, this.firstPageViewPort);
          $(newCanvas).css("background-color", "white");
          const canvasContainer = this.getNewCanvasContainer(currentPage, "page");
          canvasContainer.append(newCanvas);
          pdfContainer.append(canvasContainer);
          this.$q.notify({
            message: "New Blank Page Added",
            color: "black"
          });
          this.socketRequest("new_page_added");
        });
      } else {
        this.totalPages += 1;
        this.emptyPagesAdded += 1;
        const currentPage = this.totalPages;
        const pdfContainer = document.getElementById("pdf-pages-container");
        const newCanvas = this.getNewCanvas(currentPage, this.firstPageViewPort);
        $(newCanvas).css("background-color", "white");
        const canvasContainer = this.getNewCanvasContainer(currentPage, "page");
        canvasContainer.append(newCanvas);
        pdfContainer.append(canvasContainer);
      }
    },

    finishDrop (event, droppedFieldViaClick) {
      event.preventDefault();
      event.stopPropagation();
      if (!this.realDragStarted && !droppedFieldViaClick) {
        return;
      }
      this.allDroppedElements = _.compact(this.allDroppedElements);
      this.realDragStarted = false;
      const vm = this;
      let fieldDoc = (droppedFieldViaClick && JSON.stringify(droppedFieldViaClick)) || event.dataTransfer.getData("field");
      try {
        fieldDoc = JSON.parse(fieldDoc);
      } catch (error) {
        console.log(error);
      }
      console.log(fieldDoc);
      let fieldName;
      let fieldType;
      let fieldPlaceholderType;
      let fieldPlaceholderUser;
      let fieldPlaceholderUserId;
      let fieldTextToInsert;
      let fieldHeight;
      let fieldWidth;
      if (droppedFieldViaClick && droppedFieldViaClick.name) {
        fieldName = droppedFieldViaClick.textToInsert || droppedFieldViaClick.name;
        fieldType = droppedFieldViaClick.type;
        fieldPlaceholderType = droppedFieldViaClick.placeholder_type;
        fieldPlaceholderUser = droppedFieldViaClick.placeholder_user;
        fieldPlaceholderUserId = droppedFieldViaClick.placeholder_user_id;
        fieldTextToInsert = droppedFieldViaClick.textToInsert;
        fieldHeight = droppedFieldViaClick.height;
        fieldWidth = droppedFieldViaClick.width;
      } else {
        fieldName = event.dataTransfer.getData("name");
        fieldType = event.dataTransfer.getData("type");
        fieldPlaceholderType = event.dataTransfer.getData("placeholder_type");
        fieldPlaceholderUser = event.dataTransfer.getData("placeholder_user");
        fieldPlaceholderUserId = event.dataTransfer.getData("placeholder_user_id");
        fieldTextToInsert = event.dataTransfer.getData("text_to_insert");
        fieldHeight = event.dataTransfer.getData("height");
        fieldWidth = event.dataTransfer.getData("width");
      }
      const targetPosition = event.target.getBoundingClientRect();
      const imageFieldType = fieldDoc.image_field_type || "";
      // check if the dropped element lies inside the page boundaries
      if (!(droppedFieldViaClick && droppedFieldViaClick.name)) {
        if (!(
          targetPosition.top < (event.clientY - (vm.signatureHeight / 2)) &&
          targetPosition.bottom > (event.clientY + (vm.signatureHeight / 2)) &&
          targetPosition.left < (event.clientX - (vm.signatureWidth / 2)) &&
          targetPosition.right > (event.clientX + (vm.signatureWidth / 2))
        )) {
          this.$toast.error("Element not inside page boundary", 2000);
          return;
        }
      }
      let positionWrtPageX = Math.round(event.clientX - targetPosition.x);
      let positionWrtPageY = Math.round(event.clientY - targetPosition.y);
      let text = fieldName;
      if (fieldTextToInsert !== "undefined" && fieldTextToInsert && typeof fieldTextToInsert !== "undefined") {
        text = fieldTextToInsert;
      }
      let eventTargetId = event.target.id;
      try {
        let { parentNode } = event.target;
        if (!$(parentNode).siblings("canvas")[0]) {
          parentNode = $(parentNode)[0].parentNode;
        }
        if (Number.isNaN(parseInt(eventTargetId))) {
          eventTargetId = $(parentNode).siblings("canvas")[0]?.id;
          const parentId = parentNode.id;
          const parentElementId = parentId.replace("signature-element", "");
          _.map(this.allDroppedElements, (localDroppedElement) => {
            if (localDroppedElement.elementId === parentElementId) {
              positionWrtPageX += localDroppedElement.x;
              positionWrtPageY += localDroppedElement.y;
            }
          });
        }
      } catch (error) {
        console.log(error);
      }
      const dataToSend = {
        page: eventTargetId,
        text,
        fieldType,
        fieldPlaceholderType,
        fieldPlaceholderUser,
        fieldPlaceholderUserId,
        fieldHeight,
        fieldWidth,
        screenX: event.clientX,
        screenY: event.clientY,
        x: positionWrtPageX,
        y: positionWrtPageY,
        elementId: false,
        inputTextValue: "",
        imageFieldType
      };
      const signatureElementData = vm.createNewSignatureElement(dataToSend, false);
      console.log(signatureElementData);
    },

    getNewCanvasContainer (pageNo, prefix) {
      const vm = this;
      const canvasContainer = document.createElement("div");
      canvasContainer.id = prefix + pageNo;
      canvasContainer.style.position = "relative";
      canvasContainer.style.fontSize = "0";
      canvasContainer.style.marginBottom = "1rem";
      canvasContainer.style.marginRight = "0.5rem";
      canvasContainer.style.border = "1px solid #d6d6d6";
      canvasContainer.addEventListener("dragover", vm.dropOnPdf);
      canvasContainer.addEventListener("drop", vm.finishDrop);
      return canvasContainer;
    },

    getPageTag (pageNo) {
      const pageTag = document.createElement("p");
      pageTag.style.position = "absolute";
      pageTag.style.top = "0";
      pageTag.style.left = "0";
      pageTag.style.fontSize = "15px";
      pageTag.style.background = "#75b5ea";
      pageTag.style.padding = "0 7px";
      pageTag.style.color = "#fff";
      pageTag.style.fontWeight = "700";
      pageTag.innerHTML = pageNo;
      return pageTag;
    },

    isValidHttpUrl(string) {
      let url;
      try {
        url = new URL(string);
      } catch (e) {
        return false;
      }
      return url.protocol === "http:" || url.protocol === "https:";
    },
    arrayToBase64String(tempArray) {
      return btoa(String.fromCharCode(...tempArray));
    },
    async downscaleImage(dataUrl, imageType, imageArguments) {
      // Provide default values
      imageType = imageType || "image/jpeg";
      imageArguments = imageArguments || 0.5;

      // Create a temporary image so that we can compute the height of the downscaled image.
      const image = new Image();
      // image.src = dataUrl;
      // image.src = `https://cors-fix.web.app/v1?url=${dataUrl.replace("?", "&")}`;
      // image.src = `https://cors-anywhere.herokuapp.com/${dataUrl}`;
      // image.crossOrigin = "anonymous";

      try {
        image.src = dataUrl;
        image.crossOrigin = "anonymous";
        await image.decode();
      } catch (error) {
        try {
          const localImageData = dataUrl.replace(/\./g, ">");
          image.src = `https://app.bluenotary.us/corsfix/${localImageData}`;
          image.crossOrigin = "anonymous";
          await image.decode();
        } catch (error2) {
          console.log("error2", error2);
          image.src = `https://cors-anywhere.herokuapp.com/${dataUrl}`;
          image.crossOrigin = "anonymous";
          await image.decode();
        }
      }

      console.log(image.height);

      // Create a temporary canvas to draw the downscaled image on.
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      // Draw the downscaled image on the canvas and return the new data URL.
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, image.width, image.height);
      console.log(canvas);
      const newDataUrl = canvas.toDataURL(imageType, imageArguments);
      return newDataUrl;
    },
    async doRefreshPage() {
      if (this.joinedAsSessionNotary) {
        await this.saveDraftOfCurrentSession();
      }
      window.onbeforeunload = null;
      window.location.reload();
    },
    async completePDF() {
      this.$q.dialog({
        title: "Confirm",
        message: "Are you sure you want to complete this Session?",
        cancel: true,
        persistent: true
      }).onOk(async () => {
        /* eslint-disable no-await-in-loop */
        this.completePDFLoadingModal = true;
        const finalAllDroppedElementsDocIdWise = {};
        _.map(this.allDroppedElementsDocIdWise, (tempAllDroppedElements, docId) => {
          finalAllDroppedElementsDocIdWise[docId] = _.uniqBy(_.compact(tempAllDroppedElements), "elementId");
        });
        for (let documentIndex = 0; documentIndex < this.allDocumentList.length; documentIndex += 1) {
          try {
            const currentDocumentDoc = this.allDocumentList[documentIndex];
            this.completePDFLoadingDetails.currentFileName = currentDocumentDoc.name;
            console.log(currentDocumentDoc);
            const url = currentDocumentDoc.url;
            this.completePDFClicked = true;
            this.completePDFLoadingDetails.progress = 0;
            this.completePDFLoadingDetails.progressText = "Fetching Assets";
            const imageData = this.allImagesData.notarySealImage;
            const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
            console.log("existingPdfBytes", existingPdfBytes);
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });

            const fontCourier = await pdfDoc.embedFont(StandardFonts.Helvetica);

            pdfDoc.getForm().getFields().forEach((field) => {
              const type = field.constructor.name;
              const name = field.getName();
              if (type === "PDFTextField" || field instanceof PDFTextField) {
                pdfDoc.getForm().getTextField(name).updateAppearances(fontCourier);
              }
            });

            try {
              pdfDoc.getForm().flatten();
            } catch (error4) {
              console.log("getFormError", error4);
            }
            console.log("pdfDoc", pdfDoc);
            const pages = pdfDoc.getPages();
            console.log(pages);
            const pngUrl = "https://app.bluenotary.us/icons/check-icon.png";
            const pngArrBuffer = await this.downloadDataIntoArryBuffer(pngUrl);
            let pngImage = null;
            if (pngArrBuffer) {
              const pngImageB64 = this.convertArrBufferToB64(pngArrBuffer);
              pngImage = await pdfDoc.embedPng(pngImageB64);
            } else {
              const pngImageBytes = await fetch(pngUrl).then((res2) => res2.arrayBuffer());
              pngImage = await pdfDoc.embedPng(pngImageBytes);
            }
            let notarySealImage = false;
            this.completePDFLoadingDetails.progress = 0.1;
            this.completePDFLoadingDetails.progressText = "Fetching More Assets";
            if (this.isValidHttpUrl(imageData)) {
              console.log("imageDataimageData", imageData);
              // const arrayBuffer = await fetch(imageData).then((res) => res.arrayBuffer());
              // const arrayBuffer = await fetch(`https://cors-anywhere.herokuapp.com/${imageData}`).then((res) => res.arrayBuffer());
              // const arrayBuffer = await fetch(`https://cors-fix.web.app/v1?url=${imageData}`).then((res) => res.arrayBuffer());
              // const arrayBuffer = await fetch(`https://cors-fix.web.app/v1?url=${imageData.replace("?", "&").replaceAll("&", "\\&")}`).then((res) => res.arrayBuffer());
              const imageDataArrBuffer = await this.downloadDataIntoArryBuffer(imageData);
              if (imageDataArrBuffer) {
                try {
                  const b64data = this.convertArrBufferToB64(imageDataArrBuffer);
                  if (b64data) {
                    if (imageData.toLowerCase().includes(".png")) {
                      notarySealImage = await pdfDoc.embedPng(b64data);
                    } else {
                      notarySealImage = await pdfDoc.embedJpg(b64data);
                    }
                  } else if (imageData.toLowerCase().includes(".png")) {
                      notarySealImage = await pdfDoc.embedPng(btoa(String.fromCharCode(...new Uint8Array(imageDataArrBuffer))));
                  } else {
                      notarySealImage = await pdfDoc.embedJpg(btoa(String.fromCharCode(...new Uint8Array(imageDataArrBuffer))));
                  }
                } catch (error) {
                  if (imageData.toLowerCase().includes(".png")) {
                      notarySealImage = await pdfDoc.embedPng(btoa(String.fromCharCode(...new Uint8Array(imageDataArrBuffer))));
                  } else {
                      notarySealImage = await pdfDoc.embedJpg(btoa(String.fromCharCode(...new Uint8Array(imageDataArrBuffer))));
                  }
                }
              }
            } else if (imageData) {
              notarySealImage = await pdfDoc.embedPng(imageData);
            }
            const firstPage = pages[0];
            console.log(firstPage);
            const currentDocEmptyPages = this.emptyPagesAddedDocIdWise[currentDocumentDoc._id] || 0;
            for (let pagenum = 0; pagenum < currentDocEmptyPages; pagenum += 1) {
              const addedPage = pdfDoc.addPage([firstPage.getWidth(), firstPage.getHeight()]);
              pages.push(addedPage);
            }
            const notaryCertificateImages = {};
            await Promise.all(_.map(this.allDroppedElementsDocIdWise[currentDocumentDoc._id], async (droppedElement) => {
              if (droppedElement.fieldType === "notary_certificate" && droppedElement.imageData) {
                let notaryCertificateBuffer = false;
                let { fieldHeight, fieldWidth } = droppedElement;
                if (fieldHeight) {
                  fieldHeight = parseInt(fieldHeight.replace("px", ""), 10);
                }
                if (fieldWidth) {
                  fieldWidth = parseInt(fieldWidth.replace("px", ""), 10);
                }
                if (droppedElement.imageData.toLowerCase().includes(".png")) {
                  notaryCertificateBuffer = await this.downscaleImage(droppedElement.imageData, "image/png", 0.7, fieldHeight, fieldWidth);
                  notaryCertificateBuffer = await pdfDoc.embedPng(notaryCertificateBuffer);
                } else {
                  notaryCertificateBuffer = await this.downscaleImage(droppedElement.imageData, "image/jpeg", 0.7, fieldHeight, fieldWidth);
                  notaryCertificateBuffer = await pdfDoc.embedJpg(notaryCertificateBuffer);
                }
                notaryCertificateImages[droppedElement.elementId] = notaryCertificateBuffer;
              }
            }));
            await Promise.all(_.map(this.allDroppedElementsDocIdWise[currentDocumentDoc._id], async (droppedElement) => {
              try {
                if (!droppedElement) {
                  return;
                }
                console.log(JSON.parse(JSON.stringify(droppedElement)));
                const pageNumber = parseInt(droppedElement.page, 10);
                const currentPage = pages[pageNumber - 1];
                console.log("currentPage", currentPage, currentPage.getSize(), currentPage.getArtBox(), currentPage.getBleedBox(), currentPage.getCropBox(), currentPage.getMediaBox());
                // const { height, width } = currentPage.getSize();
                let height = 0;
                let width = 0;
                let y = 0;
                if (this.internalForceParamNewConditionY) {
                  const pageSizes = currentPage.getArtBox();
                  height = pageSizes.height;
                  width = pageSizes.width;
                  y = pageSizes.y;
                } else {
                  const pageSizes2 = currentPage.getSize();
                  height = pageSizes2.height;
                  width = pageSizes2.width;
                }
                // if (height) {
                //   height = firstPage.getHeight();
                //   width = firstPage.getWidth();
                // }
                console.log("firstPage.hgith", firstPage.getHeight());
                console.log("firstPage.width", firstPage.getWidth());
                console.log("currentPage.hgith", currentPage.getHeight());
                console.log("currentPage.width", currentPage.getWidth());
                let canvasWidth;
                let canvasHeight;

                try {
                  console.log("pageNumberpageNumber", pageNumber);
                  const canvasPageDiv = $(`.pdf-page[id="${String(pageNumber)}"]`);
                  console.log("canvasPageDivcanvasPageDiv", canvasPageDiv?.length);
                  if (canvasPageDiv?.length) {
                    canvasWidth = canvasPageDiv.attr("width");
                    canvasHeight = canvasPageDiv.attr("height");
                  } else {
                    const canvasPageDiv2 = $(".pdf-page[id='1']");
                    console.log("canvasPageDiv2canvasPageDiv2", canvasPageDiv2?.length);
                    if (canvasPageDiv2?.length) {
                      canvasWidth = canvasPageDiv2.attr("width");
                      canvasHeight = canvasPageDiv2.attr("height");
                    }
                  }
                } catch (error) {
                  console.log("first level error", error);
                  try {
                    const canvasPageDiv3 = $(".pdf-page[id='1']");
                    if (canvasPageDiv3?.length) {
                      canvasWidth = canvasPageDiv3.attr("width");
                      canvasHeight = canvasPageDiv3.attr("height");
                    }
                  } catch (error2) {
                    console.log("second level error3", error2);
                  }
                }
                console.log("mid canvasWidthcanvasWidth", canvasWidth);
                console.log("mid canvasHeightcanvasHeight", canvasHeight);
                if (this.allDocumentPagesViewports?.[currentDocumentDoc._id]?.[pageNumber - 1]?.canvasWidth) {
                  canvasWidth = this.allDocumentPagesViewports?.[currentDocumentDoc._id]?.[pageNumber - 1]?.canvasWidth;
                } else if (this.allDocumentPagesViewports?.[currentDocumentDoc._id]?.[0]?.canvasWidth) {
                  canvasWidth = this.allDocumentPagesViewports?.[currentDocumentDoc._id]?.[0]?.canvasWidth;
                }
                if (this.allDocumentPagesViewports?.[currentDocumentDoc._id]?.[pageNumber - 1]?.canvasHeight) {
                  canvasHeight = this.allDocumentPagesViewports?.[currentDocumentDoc._id]?.[pageNumber - 1]?.canvasHeight;
                } else if (this.allDocumentPagesViewports?.[currentDocumentDoc._id]?.[0]?.canvasHeight) {
                  canvasHeight = this.allDocumentPagesViewports?.[currentDocumentDoc._id]?.[0]?.canvasHeight;
                }
                console.log("canvasWidthcanvasWidth", canvasWidth, width);
                console.log("canvasHeightcanvasHeight", canvasHeight, height, y);
                console.log("width", width, height);
                console.log("droppedElement", droppedElement);
                const widthRatio = parseInt(canvasWidth) / width;
                const heightRatio = parseInt(canvasHeight) / height;
                // const widthRatio = 1;
                // const heightRatio = 1;
                // const posY = (canvasHeight - (droppedElement.y)) + (pageYDifference / heightRatio);
                const posY = (height - (droppedElement.y / heightRatio) + y);
                // const posY = (height - (droppedElement.y / heightRatio));
                const posX = (droppedElement.x / widthRatio);
                // const posY = (height - (droppedElement.y / heightRatio)) - valueToSubtractFromY;
                // const posX = (droppedElement.x / widthRatio) - valueToSubtractFromX;
                let { fieldHeight, fieldWidth } = droppedElement;
                console.log(height, droppedElement.y, heightRatio, posY, fieldHeight);
                // console.log(droppedElement.x, posX, widthRatio, canvasWidth, width, valueToSubtractFromX, droppedFieldWidth);

                if (fieldHeight) {
                  fieldHeight = parseInt(fieldHeight.replace("px", ""), 10);
                }
                if (fieldWidth) {
                  fieldWidth = parseInt(fieldWidth.replace("px", ""), 10);
                }
                // console.log(fieldWidth);
                if (droppedElement.fieldType === "checkmark") {
                  currentPage.drawImage(pngImage, {
                    x: posX,
                    // x: posX - fieldWidth,
                    // x: posX - 5,
                    y: posY - (fieldHeight) + 5,
                    // y: posY - fieldHeight / 2,
                    width: 18,
                    height: 18,
                    color: droppedElement.color,
                  });
                } else if (droppedElement.fieldType === "signature" || droppedElement.fieldPlaceholderType === "signature") {
                  let signatureImage;
                  try {
                    signatureImage = await pdfDoc.embedPng(droppedElement.imageData);
                  } catch (error) {
                    signatureImage = await pdfDoc.embedJpg(droppedElement.imageData);
                  }
                  currentPage.drawImage(signatureImage, {
                    x: posX,
                    y: posY - (fieldHeight / heightRatio),
                    width: fieldWidth / widthRatio,
                    height: fieldHeight / heightRatio,
                    color: droppedElement.color,
                  });
                } else if (droppedElement.fieldType === "input_text" || droppedElement.fieldPlaceholderType === "input_text") {
                  // const valueToSubtract = 8;
                  const valueToSubtract = 10;
                  // if (droppedElement.fieldPlaceholderType === "input_text") {
                  //   valueToSubtract = 0;
                  // }
                  currentPage.drawText(droppedElement.inputTextValue, {
                    x: posX + 6,
                    // y: posY,
                    // x: posX,
                    y: posY - (droppedElement.size / heightRatio) - valueToSubtract,
                    size: droppedElement.size,
                    lineHeight: droppedElement.size,
                    maxWidth: fieldWidth / widthRatio
                    // color: droppedElement.color,
                  });
                } else if (droppedElement.fieldType === "image") {
                  if (notarySealImage) {
                    let textLeftPadding = 0;
                    if (fieldWidth > 250) {
                      textLeftPadding = (fieldWidth - 250) / 2;
                    }
                    console.log(textLeftPadding);
                    let textFontSize = 10;
                    if (fieldWidth <= 113) {
                      textFontSize = 4;
                    } else if (fieldWidth <= 136) {
                      textFontSize = 5;
                    } else if (fieldWidth <= 158) {
                      textFontSize = 6;
                    } else if (fieldWidth <= 180) {
                      textFontSize = 7;
                    } else if (fieldWidth <= 203) {
                      textFontSize = 8;
                    } else if (fieldWidth <= 224) {
                      textFontSize = 9;
                    }
                    currentPage.drawText("Notarized online using audio-video communication", {
                      x: posX + textLeftPadding,
                      y: posY - textFontSize,
                      size: textFontSize,
                      lineHeight: textFontSize,
                      maxWidth: parseInt(fieldWidth, 10)
                      // color: droppedElement.color,
                    });
                    currentPage.drawImage(notarySealImage, {
                      x: posX,
                      y: posY - (fieldHeight / (heightRatio)),
                      width: fieldWidth / widthRatio,
                      height: (fieldHeight - 15) / heightRatio
                    });
                  }
                } else if (droppedElement.fieldType === "notary_certificate") {
                  console.log("notary cert called");
                  if (notaryCertificateImages[droppedElement.elementId]) {
                    currentPage.drawImage(notaryCertificateImages[droppedElement.elementId], {
                      x: posX,
                      y: posY - (fieldHeight / (heightRatio)),
                      width: fieldWidth / widthRatio,
                      height: fieldHeight / heightRatio
                    });
                  }
                } else if (droppedElement.fieldType === "whiteout") {
                  currentPage.drawRectangle({
                    x: posX,
                    y: posY - (fieldHeight / (heightRatio)),
                    width: fieldWidth / widthRatio,
                    height: fieldHeight / heightRatio,
                    color: rgb(1, 1, 1)
                  });
                } else {
                  currentPage.drawText(droppedElement.text, {
                    x: posX,
                    y: posY - (fieldHeight / 2),
                    size: droppedElement.size,
                    lineHeight: droppedElement.size,
                    // maxWidth: parseInt(fieldWidth, 10)
                    // color: droppedElement.color,
                  });
                }
              } catch (error) {
                console.log("error found", error);
                console.log(`error tname: ${error.name} message: ${error.message} at: ${error.at} text: ${error.text}`);
                console.log("error found droppedElement", droppedElement);
              }
            }));

            if (currentDocumentDoc.isCustomUploaded === true) {
              this.completePDFLoadingDetails.progress = 0.2;
              this.completePDFLoadingDetails.progressText = "Adding watermark";
              for (let i = 0; i < pages.length; i += 1) {
                const page = pages[i];
                const width = page.getWidth();
                const height = page.getHeight();
                await page.drawText("BlueNotary Session Simulator", {
                  x: (width / 4.5) - 35,
                  y: height / 2,
                  size: 35,
                  opacity: 0.7
                });
              }
            }
            this.completePDFLoadingDetails.progress = 0.2;
            this.completePDFLoadingDetails.progressText = "Building Final Document";
            const pdfBytes = await pdfDoc.save();
            console.log("pdfBytespdfBytes", pdfBytes);
            const outputFileObject = new Blob([pdfBytes], { type: "application/pdf" });
            // const fileURL = URL.createObjectURL(this.outputFileObject);
            // window.open(fileURL);
            // Commenting the code to open in new tab
            if (this.sessionid === "simulator") {
              // if (!currentDocumentDoc.isCustomUploaded) {
                // digitally sign document in case its not custom uploaded document
                const newform = new FormData();
                newform.append("file", outputFileObject);
                this.completePDFLoadingDetails.progress = 0.5;
                this.completePDFLoadingDetails.progressText = "Signing Document with Digital Certificate";
                const docResponse = await this.axios.post("file/ssimSignDocument", newform, {
                  headers: {
                    "Content-Type": "multipart/form-data"
                  }
                });
                if (docResponse.status >= 400) {
                  const msg = JSON.parse(docResponse.data);
                  this.completePDFLoadingDetails.progressText = msg;
                  this.completePDFLoadingDetails.progress = 0.8;
                } else if (docResponse.status === 200) {
                  this.completePDFLoadingDetails.progress = 0.8;
                  this.completePDFLoadingDetails.progressText = "Signing completed";
                  window.open(docResponse.data.signedDocUrl);
                } else {
                  this.completePDFLoadingDetails.progressText = "Something went wrong";
                }
                // const fileURL = URL.createObjectURL(outputFileObject);
                // window.open(docResponse.signedDocUrl);
              // } else if (currentDocumentDoc.isCustomUploaded === true) {
              //   window.open(URL.createObjectURL(outputFileObject));
              // }
            }
            if (this.sessionid && this.sessionid !== "simulator") {
              const saveUrl = `session/savePDFEditingPage/${this.sessionid}`;
              const dataToSave = {
                droppedElements: _.uniqBy(_.compact(this.allDroppedElementsDocIdWise[currentDocumentDoc._id]), "elementId"),
                droppedElementsDocIdWise: finalAllDroppedElementsDocIdWise,
                notorizationType: this.notorizationType.join(),
                attachCertificate: this.attachCertificate,
                finalCostOfNotarization: this.finalCostOfNotarization,
                costOfNotarization: this.costOfNotarization,
                emptyPagesAdded: this.emptyPagesAdded,
                sessionCustomCharges: this.sessionCustomCharges,
                allDocumentPagesViewports: this.allDocumentPagesViewports
              };
              this.completePDFLoadingDetails.progress = 0.3;
              this.completePDFLoadingDetails.progressText = "Saving Elements";
              const response = await this.axios.post(saveUrl, dataToSave, {
                headers: {
                  "Content-Type": "application/json",
                },
              });
              console.log(response);
              console.log("window.stopCallback", window.stopCallback);
              if (window.stopCallback) {
                let firstDocument = false;
                if (documentIndex === 0) {
                  firstDocument = true;
                }
                let lastDocument = false;
                if (documentIndex === this.allDocumentList.length - 1) {
                  lastDocument = true;
                }
                await window.stopCallback("success", firstDocument, lastDocument, currentDocumentDoc._id, outputFileObject);
              } else {
                this.completePDFLoadingModal = false;
                this.socketRequest("session_completed");
                this.endVideoCall();
                this.$router.replace(`/notary/my-sessions?confirmationSession=${this.sessionid}&paymentDone=true`);
              }
            } else {
              this.completePDFLoadingDetails.progress = 1;
              this.completePDFLoadingDetails.progressText = "Simulator Final Draft Generated, and opened in new tab.";
              setTimeout(() => {
                this.endVideoCall();
                this.completePDFLoadingModal = false;
                if (this.joinedAsWitness) {
                  this.$router.replace("/witnessSuccess");
                } else {
                  this.$router.replace("/notary/dashboard");
                }
              }, 7000);
            }
            // complete sessions
            console.log("fpr - complete session referral", this.$user.email, this.$user._id);
            window.fpr("referral", { email: this.$user.email, uid: this.$user._id });
            // this.$q.notify({
            //   message: "Session Completed Successfully.",
            //   color: "black"
            // });
          } catch (error) {
            console.log("MAJOR Error : ", String(documentIndex));
            console.log("MAJOR Error : ", String(documentIndex));
            console.log(error);
          }
        }
      });
    },

    renderPdf (currentDocumentCopy) {
      const vm = this;
      // this.currentDocumentSelected
      // documentFileCacheById
      vm.isLoading = true;
      if (this.documentFileCacheById[currentDocumentCopy._id]) {
        if (currentDocumentCopy._id !== this.currentDocumentSelected._id) {
          return;
        }
        this.renderPdfIntermediate(this.documentFileCacheById[currentDocumentCopy._id]);
        return;
      }
      pdfjsLib.getDocument({ url: this.pdfUrl, cMapUrl: "https://bluenotary.us/assets/cmaps/", cMapPacked: true }).promise.then((pdf) => {
        this.documentFileCacheById[currentDocumentCopy._id] = pdf;
        if (currentDocumentCopy._id !== this.currentDocumentSelected._id) {
          return;
        }
        this.renderPdfIntermediate(pdf);
      }).catch((err) => {
        console.log("Error fetching the document: ", err);
        vm.isLoading = false;
        vm.docFound = false;
        vm.docNotFoundError = err.message;
      });
    },
    renderPdfIntermediate(pdf) {
      const vm = this;
      vm.pdfLoaded = true;
      let pageNo = 1;
      vm.totalPages = pdf.numPages;
      const pdfContainerTop = document.getElementById("pdf-pages-container");
      if (pdfContainerTop) {
        pdfContainerTop.innerHTML = "";
      }
      setTimeout(function createCanvas () {
        const pdfContainer = document.getElementById("pdf-pages-container");
        // pdfContainer.innerHTML = "";
        // const pdfIndexContainer = document.getElementById("pdf-index-container");
        pdf.getPage(pageNo).then((page) => {
          // create new canvas using PDF page dimensions
          const viewport = page.getViewport({ scale: vm.SCALE });
          if (pageNo === 1) {
            vm.firstPageViewPort = viewport;
          }
          const newCanvas = vm.getNewCanvas(page.pageNumber, viewport);
          const context = newCanvas.getContext("2d");
          // create canvas container
          const canvasContainer = vm.getNewCanvasContainer(page.pageNumber, "page");
          canvasContainer.append(newCanvas);
          pdfContainer.append(canvasContainer);

          // Render PDF page into canvas context
          let renderContext = {
            canvasContext: context,
            viewport,
          };
          const pageRenderTask = page.render(renderContext);
          pageRenderTask.promise.then();
          // create new canvas for index of pdf pages
          const pageIndexViewport = page.getViewport({ scale: vm.SMALL_SCALE });
          const pageIndexCanvas = vm.getNewCanvas(page.pageNumber, pageIndexViewport);
          const pageIndexContext = pageIndexCanvas.getContext("2d");

          // create canvas container for page index
          const pageIndexCanvasContainer = vm.getNewCanvasContainer(page.pageNumber, "pageIndex");
          pageIndexCanvasContainer.append(pageIndexCanvas);
          pageIndexCanvasContainer.append(vm.getPageTag(page.pageNumber));
          // pdfIndexContainer.append(pageIndexCanvasContainer);
          pageIndexCanvasContainer.addEventListener("click", (event) => {
            event.stopPropagation();
            const pageToMove = document.getElementById(`page${page.pageNumber}`);
            pageToMove.scrollIntoView();
          });

          // Render PDF page into canvas context
          renderContext = {
            canvasContext: pageIndexContext,
            viewport: pageIndexViewport,
          };
          const pageIndexRenderTask = page.render(renderContext);
          pageIndexRenderTask.promise.then(() => {
            if (page.pageNumber === pdf.numPages) {
              vm.isLoading = false;
            }
          });
          pageNo += 1;
          if (pageNo <= pdf.numPages) {
            createCanvas();
          }
        });
      }, 1000);
      setTimeout(() => {
        const pdfContainer = document.getElementById("pdf-pages-container");
        for (let pagenum = 0; pagenum < this.emptyPagesAdded; pagenum += 1) {
          this.totalPages += 1;
          const currentPage = this.totalPages;
          const newCanvas = this.getNewCanvas(currentPage, this.firstPageViewPort);
          $(newCanvas).css("background-color", "white");
          const canvasContainer = this.getNewCanvasContainer(currentPage, "page");
          canvasContainer.append(newCanvas);
          pdfContainer.append(canvasContainer);
        }
        setTimeout(() => {
          this.allDocumentPagesViewports[this.currentDocumentSelected._id] = [];
          for (let tempPagenum = 0; tempPagenum < this.totalPages; tempPagenum += 1) {
            const canvasPageDiv = $(`.pdf-page[id="${String(tempPagenum + 1)}"]`);
            if (!canvasPageDiv) {
              return;
            }
            const canvasWidth = canvasPageDiv.attr("width");
            const canvasHeight = canvasPageDiv.attr("height");
            this.allDocumentPagesViewports[this.currentDocumentSelected._id].push({
              canvasWidth,
              canvasHeight
            });
          }
          let droppedElements = (vm.sessionFullData && vm.sessionFullData.pdfDroppedElementDatas && vm.sessionFullData.pdfDroppedElementDatas.droppedElements) || [];
          if (this.allDroppedElementsDocIdWise && this.allDroppedElementsDocIdWise[this.currentDocumentSelected._id] && this.allDroppedElementsDocIdWise[this.currentDocumentSelected._id].length) {
            droppedElements = this.allDroppedElementsDocIdWise[this.currentDocumentSelected._id];
          }
          if (!vm.renderingSocketFields && droppedElements && droppedElements.length) {
            // this.allDroppedElementsDocIdWise
            console.log("droppedElements", droppedElements);
            vm.allDroppedElements = [];
            _.map(droppedElements, (droppedElement) => {
              vm.createNewSignatureElement(droppedElement, false, true);
            });
            if (this.sendFullSessionFieldsIfDataFound) {
              this.sendFullSessionFields();
            }
          }
          this.pdfRenderingCompleted = true;
        }, 1000);
      }, 2000);
    },
    async saveTemplateFields() {
      const saveUrl = "notary/templateUpdatePdfDroppedElements";
      // allDroppedElementsDocIdWise
      const finalAllDroppedElementsDocIdWise = {};
      _.map(this.allDroppedElementsDocIdWise, (tempAllDroppedElements, docId) => {
        finalAllDroppedElementsDocIdWise[docId] = _.uniqBy(_.compact(tempAllDroppedElements), "elementId");
      });
      const dataToSave = {
        templateId: this.sessionid,
        droppedElements: _.uniqBy(_.compact(this.allDroppedElements), "elementId"),
        droppedElementsDocIdWise: finalAllDroppedElementsDocIdWise
      };
      const response = await this.axios.post(saveUrl, dataToSave, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      this.endVideoCall();
      this.$router.replace("/notary/templates");
    },
    cancelTemplateFields() {
      this.endVideoCall();
      this.$router.replace("/notary/templates");
    },
    async addWitnessClicked() {
      this.showAddWitnessModal = true;
      const getUrl = "session/getAllWitnessDetails";
      const response = await this.axios.get(getUrl);
      const allData = (response && response.data && response.data.allWitnessDocs) || [];
      this.witnessSelectionOptions.data = _.map(allData, (tempWitnessDoc) => {
        tempWitnessDoc.label = `${tempWitnessDoc.firstName} ${tempWitnessDoc.lastName}`;
        tempWitnessDoc.value = tempWitnessDoc._id;
        return tempWitnessDoc;
      });
      this.witnessSelectionOptions.dataFetched = true;
      this.witnessSelectionOptions.loading = false;
    },
    async addAdditionalSigners() {
      this.showAddAdditionalSignerModal = true;
    },
    async addAdditionalSignerSaveClicked() {
      // this.multiSignerList = _.filter(this.multiSignerList, "email");
      this.multiSignerList = _.compact(_.map(this.multiSignerList, (tempMultiSignerList) => {
        if (!(tempMultiSignerList && tempMultiSignerList.email)) {
          return false;
        }
        tempMultiSignerList.email = tempMultiSignerList.email.toLowerCase();
        return tempMultiSignerList;
      }));
      this.oldMultiSignerList = JSON.parse(JSON.stringify(this.multiSignerList));
      const url = `session/saveSessionData/${this.sessionid}`;
      const dataToSave = {
        multiSignerList: this.multiSignerList,
        sendNewSignersEmail: true
      };
      const resp = await this.axios.post(url, {
        data: dataToSave
      });
      this.$q.notify({
        color: "primary",
        position: "bottom-right",
        message: "Additional Signers Saved",
      });
      this.showAddAdditionalSignerModal = false;
      if (resp?.data?.multiSignerUserDocs !== null) {
        this.multiSignerUserDocs = resp?.data?.multiSignerUserDocs;
      }
      let multiSignerIndex = 0;
      _.map(this.multiSignerUserDocs, (tempMultiDocs) => {
        this.inSessionKBAStage[`additionalSigner${String(multiSignerIndex)}`] = tempMultiDocs?.identityData?.additionalSignerNextStage || "";
        multiSignerIndex += 1;
      });
      for (let maxSigners = 0; maxSigners < 5; maxSigners += 1) {
        if (this.inSessionKBAStage[`additionalSigner${String(maxSigners + multiSignerIndex)}`] || this.inSessionKBAStage[`additionalSigner${String(maxSigners + multiSignerIndex)}`] === "") {
          this.inSessionKBAStage[`additionalSigner${String(maxSigners + multiSignerIndex)}`] = false;
        }
      }
      this.socketRequest("manually_fetch_session_data");
      this.getKBAStatusNameFromStageName();
    },
    async addtionalSignerModalClosed() {
      this.multiSignerList = JSON.parse(JSON.stringify(this.oldMultiSignerList));
    },
    documentPickerNavigationButtonClicked(direction) {
      let documentIndex = false;
      let localIndex = 0;
      _.map(this.allDocumentList, (tempDocumentDoc) => {
        if (tempDocumentDoc._id === this.currentDocumentSelected._id) {
          documentIndex = localIndex;
        }
        localIndex += 1;
      });
      if (direction === "prev") {
        documentIndex -= 1;
      } else {
        documentIndex += 1;
      }
      this.currentDocumentSelected = this.allDocumentList[documentIndex];
    },
    redirectTowitness() {
      this.$router.replace("/witnessSuccess");
    },
    async saveSessionStat(statObj) {
      if (!this.sessionid || this.sessionid === "simulator") {
        return;
      }
      statObj.joined_as_primary_signer = this.joinedAsPrimarySigner;
      statObj.joined_as_session_notary = this.joinedAsSessionNotary;
      try {
        const url = `session/saveActiveSessionStat/${this.sessionid}`;
        await this.axios.post(url, statObj, {
          headers: {
            "Content-Type": "application/json"
          },
        });
      } catch (error) {
        console.log("savesessionstat error", error);
      }
    },
    uploadCustomDoc () {
      if (this.sessionid === "simulator") {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "application/pdf";
        fileInput.multiple = false;
        const div = document.getElementById("uploadCustomDocDiv");
        div.appendChild(fileInput);
        fileInput.showPicker();
        fileInput.addEventListener("change", async () => {
          if (fileInput.files) {
            const file = fileInput.files[0];
            let blobUrl = null;
            if (file.type === "application/pdf") {
              blobUrl = await this.processPDF(URL.createObjectURL(file), true);
            } else {
              blobUrl = URL.createObjectURL(file);
            }
            const docId = "6245ce0e64dbcfc5141df0a5";
            const docMeta = {
                _id: docId,
                sessionid: "6245ca4964dbcfc5141deff3",
                documentCategory: "final_document",
                name: file.name,
                url: blobUrl,
                type: "application/pdf",
                size: String(file.size),
                uploadedBy: "62281d9e4c049b73f29c55e7",
                uploadedStage: "meet_notary_stage",
                createdAt: "2022-03-31T15:51:42.399Z",
                updatedAt: "2022-03-31T15:51:42.399Z",
                isCustomUploaded: true
            };
            this.sessionFullData.originalDocument = docMeta;
            this.allDocumentList = [docMeta];
            this.allDroppedElementsVueComponents = {};
            this.allDocumentListKeyedById = {};
            this.allDocumentListKeyedById[docId] = docMeta;
            this.allDocumentPagesViewports = {};
            this.documentFileCacheById = {};
            this.firstPageViewPort = {};
            this.fieldDroppedIndex = 0;
            this.pdfLoaded = false;
            this.currentDocumentSelected = docMeta;
            fileInput.files = null;
            // when current document gets Changed it will occur to re renders entire html so it will reset vue webrtc itself
            // here we are ending current rtc session and starting new session.
            this.endVideoCall();
            setTimeout(() => {
              this.startVideoCall();
            }, 2000);
          }
        });
        div.removeChild(fileInput);
      }
    },
    async manageAllPdfDocumentsFunction(actionType, actionData) {
      console.log(actionType, actionData);
      if (actionType === "cancelled") {
        this.manageAllPDFDocumentsModal = false;
        if (actionData?.changesMadeInManagePdfComponent) {
          this.socketRequest("manually_refresh_session_data");
          this.doRefreshPage();
        }
      }
    },
    saveVideoStream(videoObj) {
      if (this.videoSocket && this.videoSocket.connected) {
        this.videoSocket.emit("pdf_video_session_stream", videoObj, (res) => {
          console.log("videoSocket res", res);
        });
      } else {
        console.log("this.videoObj not connected");
      }
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.fieldheader {
  font-weight: bold;
  padding-left: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid black;
}
[draggable="true"] {
  cursor: move;
}
.icardimg {
  max-height: 600px;
}
.signature-element {
  touch-action: none;
  padding: 12px;
}
.signature-element:hover {
  background: #d3dee0;
}
</style>
