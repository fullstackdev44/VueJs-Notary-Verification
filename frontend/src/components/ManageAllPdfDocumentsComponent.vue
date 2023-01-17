<template>
  <q-dialog ref="dialog" v-model="showAllModifyDocumentsComponent" style="width: 100vw" persistent>
    <q-card class="q-ma-lg" style="width: 100vw; max-width: 100vw; height: 90vh; margin: 12px">
      <q-card-section class="row items-center q-pb-none">
        <h2>
          Modify all PDF Files in Session
        </h2>
        <q-space />
        <q-btn
          outline
          label="Close"
          color="red"
          style="margin-right: 12px"
          @click="cancelPDFFileClicked"
        />
      </q-card-section>
      <q-card-section>
        <h3>
          Add new file in session
        </h3>
        <div
          class="file-drop-zone q-mt-md"
          @drop.prevent="secondaryFileUploaded"
          @dragover.prevent
          @dragenter.prevent
          @dragleave.prevent>
          <div class="file-decorate">
            <div id="article" class="q-pa-xl">
              <div>
                <q-btn
                  class="browse-btn q-pa-md"
                  label="Upload Document"
                  :loading="fileUploadLoading"
                  color="primary"
                  @click="$refs.fileinputArticle.$el.click()"
                />
                <p class="no-margin q-pt-md text-faded">
                  Upload new pdf file / image files in jpg, jpeg, png extension which you want to sign in session
                </p>
              </div>
            </div>
          </div>
        </div>
        <q-file
          v-show="false"
          ref="fileinputArticle"
          v-model="pickedArticleFile"
          :multiple="false"
          standout
          color="primary"
          label="Add a document"
          accept=".pdf,.jpg,.jpeg,.png"
        />
        <h3 style="margin-top: 12px">
          Modify Existing Files
        </h3>
        <div v-for="tempDocument in currentDocumentList" :key="tempDocument._id" style="margin-top: 18px">
          <a :href="tempDocument.url" target="_blank">{{ tempDocument.name }}</a>
          <q-btn flat icon="edit" @click="editDoc(tempDocument)"><q-tooltip>Edit the document</q-tooltip></q-btn>
          <q-btn flat icon="delete_forever" @click="deleteDoc(tempDocument)"><q-tooltip>Remove the document</q-tooltip></q-btn>
        </div>
      </q-card-section>
    </q-card>
    <modify-documents-component :modify-document-updates-function="modifyDocumentUpdatesFunction" :open-modify-documents-component-model="openModifyDocumentsComponentModal" :document-doc="openModifyDocumentsComponentDocumentDoc" :session-id="sessionid" />
  </q-dialog>
</template>

<script>
// import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";
import _ from "lodash";
import PdfUtils from "@/mixins/PdfUtils";
import ModifyDocumentsComponent from "./ModifyDocumentsComponent.vue";
// import $ from "jquery";

export default {
  name: "ManageAllPdfDocumentsComponent",
  components: {
    ModifyDocumentsComponent
  },
  mixins: [PdfUtils],
  props: {
    openModifyAllDocumentsComponentModel: {
      type: Boolean,
      default: false
    },
    allDocumentList: {
      type: Array,
      default: () => []
    },
    sessionid: {
      type: String,
      default: ""
    },
    manageAllPdfDocumentsFunction: {
      type: Function,
      default: () => {}
    }
  },

  data() {
    return {
      showAllModifyDocumentsComponent: false,
      fileUploadLoading: false,
      finalSavePDFLoading: false,
      pickedArticleFile: [],
      openModifyDocumentsComponentModal: false,
      openModifyDocumentsComponentDocumentDoc: {},
      currentDocumentList: [],
      encryptionFiles: [],
      changesMadeInManagePdfComponent: false
    };
  },

  computed: {
  },

  watch: {
    allDocumentList: {
      handler(value) {
        this.currentDocumentList = value;
      },
      deep: true
    },
    openModifyAllDocumentsComponentModel: {
      handler(value) {
        console.log("handler called");
        if (value) {
          this.showAllModifyDocumentsComponent = true;
          this.currentDocumentList = this.allDocumentList;
        } else {
          this.showAllModifyDocumentsComponent = false;
        }
      },
    },
    async pickedArticleFile(values) {
      console.log("pickedArticleFile", values, typeof values, values instanceof File);
      if (values instanceof File) {
        values = [values];
      }
      Array.from(values).forEach(async (val) => {
        if (val) {
          // eslint-disable-next-line no-plusplus
          let pdfProcessedBlobData = null;
          console.log(`selected file type which needs to be uploaded. Type: ${val.type}.`);
          if (val.type === "application/pdf") {
            pdfProcessedBlobData = await this.processPDF(URL.createObjectURL(val), false);
            console.log("PDF is processed.");
          }
          console.log("val", val);
          const reader = new FileReader();
          reader.readAsArrayBuffer(val);
          reader.onload = () => {
            const _validFileExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
            const isFileValid = (new RegExp(`(${_validFileExtensions.join("|").replace(/\./g, "\\.")})$`)).test(val.name);
            if (isFileValid) {
              console.log("File has supported extension. Creating backup on server before processing it.");
              const formData = new FormData();
              formData.append("sessionid", this.sessionid);
              formData.append("file", val, `backup_${val.name}`);
              $axios.post("/file/filesBackUp", formData, {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              });
            } else {
              console.log("Unsupported file extension suppressing backup.");
            }
            let files = null;
            if (pdfProcessedBlobData) {
              const fileToSend = new File([pdfProcessedBlobData], val.name);
              files = fileToSend;
            } else {
              // continue the old way
              console.log("continue with old logics.");
              const blobData = new Blob([reader.result], {
                type: "application/pdf",
              });

              files = new File([blobData], val.name);
            }

            files.text().then(async (x) => {
              // const fileIsEncrypted = x
              //   .substring(x.lastIndexOf("<<"), x.lastIndexOf(">>"))
              //   .includes("/Encrypt");
              const fileIsEncrypted = x.includes("Encrypt");
              if (!fileIsEncrypted) {
                await this.uploadZip(files);
                this.docSelected = true;
              } else {
                this.encryptionFiles.push(val);
              }
              if (this.encryptionFiles.length > 0) {
                this.openEncryptionFilesModal = true;
              }
            });
          };
        }
      });
      this.docSelected = true;
    },
  },

  mounted() {
    if (this.openModifyAllDocumentsComponentModel) {
      this.showAllModifyDocumentsComponent = true;
    }
  },

  methods: {
    cancelPDFFileClicked() {
      this.$refs.dialog.hide();
      this.manageAllPdfDocumentsFunction("cancelled", {
        changesMadeInManagePdfComponent: this.changesMadeInManagePdfComponent
      });
    },
    secondaryFileUploaded(e) {
      const droppedFile = e.dataTransfer.files;
      console.log("droppedFile", droppedFile);
      if (!droppedFile) return;
      this.pickedArticleFile = droppedFile;
    },
    async uploadZip(data) {
      console.log(data);
      this.$q.dialog({
        title: "Confirm",
        message: `Are you sure you want to add this document named ${data.name} in session`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        console.log(data);
        try {
          this.fileUploadLoading = true;
          const url = "file/convertUploadedDoc";
          console.log("url", url);
          const formData = new FormData();
          formData.append("file", data, data.name);
          const response = await $axios.post(url, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          console.log("response", response);
          let pdfFile = null;
          if (data.name.split(".").pop() !== "pdf") {
            const fetchResponse = await fetch(response.data.url);
            const blobData = await fetchResponse.blob();
            const metadata = {
              type: "application/pdf"
            };
            pdfFile = new File([blobData], `${data.name.split(".")[0]}.pdf`, metadata);
          } else {
            pdfFile = new File([data], `${data.name.split(".")[0]}.pdf`);
          }
          const url2 = "file/uploadEditedDocument";
          console.log("url2", url2);
          const formData1 = new FormData();
          formData1.append("documentId", "false");
          formData1.append("sessionId", this.sessionid);
          formData1.append("file", pdfFile);
          formData1.append("doctype", "new");
          const response2 = await $axios.post(url2, formData1, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          this.fileUploadLoading = false;
          console.log("response2", response2);
          if (response2?.data?.document) {
            this.currentDocumentList.push(response2?.data?.document);
          }
          this.changesMadeInManagePdfComponent = true;
          return {};
        } catch (error) {
          console.log(error);
          this.fileUploadLoading = false;
          return error;
        }
      });
    },
    editDoc(documentDoc) {
      this.openModifyDocumentsComponentModal = true;
      this.openModifyDocumentsComponentDocumentDoc = documentDoc;
    },
    deleteDoc(documentDoc) {
      if (this.currentDocumentList.length <= 1) {
        this.$q.notify({
          color: "danger",
          position: "bottom-right",
          message: "You cannot delete the last document of PDF Session. Please add new file and then remove the old file",
        });
        return;
      }
      const documentName = documentDoc.name || documentDoc.key;
      this.$q.dialog({
        title: "Confirm",
        message: `Are you sure you want to delete the document named : ${documentName} from this Session?`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        const response = await $axios.post("session/deleteSessionDocument", {
          sessionId: this.sessionid,
          documentId: documentDoc._id
        });
        console.log("responsedelete", response);
        if (response?.data?.success) {
          this.currentDocumentList = _.filter(this.currentDocumentList, (tempDocumentDoc) => {
            if (tempDocumentDoc._id === documentDoc?._id) {
              return false;
            }
            return true;
          });
          this.$q.notify({
            color: "primary",
            position: "bottom-right",
            message: "Successfully deleted document from session",
          });
        } else {
          this.$q.notify({
            color: "danger",
            position: "bottom-right",
            message: "Some error occurred in document delete",
          });
        }
      });
    },
    modifyDocumentUpdatesFunction(actionType, actionData) {
      console.log(actionType, actionData);
      if (actionType === "cancelled") {
        this.openModifyDocumentsComponentModal = false;
      } else if (actionType === "document_modified") {
        this.changesMadeInManagePdfComponent = true;
        this.openModifyDocumentsComponentModal = false;
        this.currentDocumentList = _.map(this.currentDocumentList, (tempDocumentDoc) => {
          if (tempDocumentDoc._id === actionData?.document?._id) {
            return actionData?.document;
          }
          return tempDocumentDoc;
        });
      }
    }
  },
};
</script>
