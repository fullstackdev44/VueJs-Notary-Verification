<template>
  <q-page class="q-pa-md flex-center session-container">
    <div class="row">
      <div class="col-12 col-md-12">
        <h1 class="q-my-sm">Notarization Session E39J32</h1>
      </div>
      <div class="col-12 col-md-12 q-pa-lg workflow-container">
        <div
          class="
            flex
            justify-between
            q-pt-md q-pb-md
            workflow-icons
            q-gutter-md
            text-center
          "
        >
          <div class="col flex column flex-center black-border-bottom">
            <img src="~assets/document-upload.svg" class="session-guide-icon" />
            <p class="q-pa-md">1. Upload Document</p>
          </div>
          <div class="col column flex flex-center mobile-hide">
            <img src="~assets/id-card.svg" class="session-guide-icon" />
            <p class="q-pa-md">2. Identity Check</p>
          </div>
          <div class="col column flex flex-center mobile-hide">
            <img src="~assets/credit-card.svg" class="session-guide-icon" />
            <p class="q-pa-md">3. Payment Info</p>
          </div>
          <div class="col column flex flex-center mobile-hide">
            <img src="~assets/videocall.svg" class="session-guide-icon" />
            <p class="q-pa-md">4. Meet Notary</p>
          </div>
        </div>
        <div class="col-12 col-md-8 flex q-mt-lg">
          <div class="flex column">
            <h6 class="no-margin">Documents to Notarize</h6>
            <p class="text-faded">Uploaded documents will display here</p>
            <div class="row doc-list-preview">
              <ul class="col col-md-6">
                <li
                  v-for="(item, key) of sessionData.document"
                  :key="key"
                  class="q-mt-md q-mb-md"
                >
                  <div class="flex justify-between">
                    <span class="q-pa-sm doc-title c-link-wrap">{{ item.name }}</span>
                    <div>
                      <q-btn icon="visibility" @click="previewDoc(item)" />
                      <q-btn icon="delete" @click="deleteDoc(sessionData.session.sessionid)" />
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div
            v-if="!articleLoaded"
            class="file-drop-zone q-mt-md"
            @drop.prevent="addFile"
            @dragover.prevent
            @dragenter.prevent
            @dragleave.prevent
          >
            <div class="file-decorate">
              <div id="article" class="q-pa-xl">
                <!-- <img src="~assets/or-icon.svg" style="width: 264px" /> -->
                <q-btn
                  class="browse-btn q-pa-md"
                  label="Upload document"
                  :loading="fileLoading"
                  color="primary"
                  @click="$refs.fileinputArticle.$el.click()"
                />
                <p class="no-margin q-pt-md text-faded">
                  Drop the full document as PDF file or browse on your device
                </p>
                <q-file
                  v-show="false"
                  ref="fileinputArticle"
                  v-model="pickedArticleFile"
                  standout
                  multiple
                  color="primary"
                  label="Add a document"
                  accept=".pdf"
                />
              </div>
            </div>
          </div>
          <q-btn
            class="next-btn q-mt-md"
            label="Next"
            color="primary"
            :disabled="sessionData.length === 0 || sessionData.session == null"
            @click="goesNext()"
          />
        </div>
      </div>
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
                  <template v-if="loading">
                    <div class="renderer">
                      <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
                    </div>
                  </template>
                  <div id="pdfvuer">
                    <VuePdfEmbed ref="pdfRef" :source="pdfSource" />
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
            label="Continue"
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
          <q-btn v-close-popup outline label="Cancel" color="primary" />
          <q-btn
            v-close-popup
            outline
            label="Remove"
            color="primary"
            @click="deleteSessionItem()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref } from "@vue/composition-api";
import VuePdfEmbed from "vue-pdf-embed/dist/vue2-pdf-embed";
import { $axios } from "boot/axios";
import { v4 as uuidV4 } from "uuid";

export default {
  name: "PrepareDoc",
  components: { VuePdfEmbed },
  data() {
    return {
      sessionid: "",
    };
  },
  watch: {
    async pickedArticleFile (val) {
      console.log("article", val);
      this.uploadZip(val);
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < val.length; i++) {
        this.uploadZip(val[i]);
      }
    },
    sessionData: {
      handler(value) {
        if (value && value.session && value.session._id) {
          this.sessionid = value.session._id;
        }
      },
      deep: true
    }
  },
  async mounted () {
    console.log(this.$q.localStorage.getItem("sessionData"));
    if (this.$q.localStorage.getItem("sessionData")) {
      this.sessionConfirm = true;
      this.currentSession = this.$q.localStorage.getItem("sessionData");
      const res = await this.loadSessionData(this.sessionid);
      this.sessionData = res;
    } else {
      this.currentSession = uuidV4();
      this.$q.localStorage.set("sessionData", this.currentSession);
    }
  },
  setup (_, context) {
    const {
      root: { $q }
    } = context;
    // setup () {
    const loading = ref(false);
    const fileLoading = ref(false);
    const pickedArticleFile = ref(null);
    const articleLoaded = ref(false);
    const uploaded = ref(false);
    const pdfSource = ref("");
    const page = ref(null);
    const sessionConfirm = ref(false);
    const currentSession = ref(null);
    const sessionData = ref([]);
    const deleteConfirm = ref(false);
    const deleteItem = ref(null);
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
        sessionData.value = response.data;
        // uploaded.value = true;
        pdfSource.value = response.data.url;
        fileLoading.value = false;
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const loadSessionData = async (sessionId) => {
      try {
        const url = "session/loads";
        const response = await $axios.post(url, { sessionId }, {
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
      try {
        if (!droppedFiles[0].name.endsWith(".pdf")) {
          return;
        }
        await uploadZip(droppedFiles[0]);
      } catch (error) {
        console.log("error", error);
      }
    };
    const closeDialog = async () => {
      //
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
      // uploaded.value = true;
      pdfSource.value = item.url;
    };
    const deleteDoc = async (sessionId) => {
      console.log(sessionId);
      deleteConfirm.value = true;
      deleteItem.value = sessionId;
    };
    const deleteSessionItem = async () => {
      console.log("deleteItem ", deleteItem.value);
      try {
        const url = "session/delete";
        const response = await $axios.post(url, { sessionId: deleteItem.value }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("loadSessionData", response.data);
        sessionData.value = response.data;
      } catch (error) {
        console.log(error);
      }
    };
    return {
      loading,
      fileLoading,
      pickedArticleFile,
      articleLoaded,
      addFile,
      uploaded,
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
      loadSessionData
    };
  },
  methods: {
    goesNext() {
      this.$router.replace(`/business/personal_info/${this.sessionid}`);
    }
  }
};
</script>
