<template>
  <q-card class="q-pa-sm">
    <q-card-section>
      <q-form class="q-gutter-sm">
        <q-card-section class="row items-center q-pb-none p-0 m-0">
          <h3 class="">
            Upload Template
          </h3>
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense />
        </q-card-section>
        <div
          class="file-drop-zone q-pt-md"
          @drop.prevent
          @dragover.prevent
          @dragenter.prevent
          @dragleave.prevent
        >
          <div class="">
            <div id="article" class="">
              <!-- <p class="q-mt-sm">pload here.</p> -->
              <div v-if="uploading">
                <q-spinner
                  color="primary"
                  size="3em" />
                <p class="no-margin q-pt-md text-faded">
                  Uploading template, please wait...
                </p>
              </div>
              <div v-if="!uploading">
                <q-btn
                  class="browse-btn"
                  label="Upload Template"
                  color="primary"
                  @click="$refs.fileinputDocument.$el.click()"
                />
                <q-file
                  v-show="false"
                  ref="fileinputDocument"
                  v-model="notaryDocument"
                  standout
                  max-file-size="25000000"
                  color="primary"
                  label="Add a document"
                  accept=".pdf"
                  @rejected="onRejected"
                />
              </div>
              <div class="flex flex-center row q-pa-sm">
                <small>Upload the PDF document (Max 25MB).</small>
              </div>
            </div>
          </div>
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script>
import { reactive } from "@vue/composition-api";
import { $axios } from "boot/axios";
import PdfUtils from "@/mixins/PdfUtils";

export default {
  name: "TemplateUpload",
  mixins: [PdfUtils],
  data() {
    return {
      notaryDocument: null,
      uploading: false,
    };
  },
  watch: {
    async notaryDocument (val) {
      this.uploading = true;
      if (val) await this.uploadDocument(val);
      this.uploading = false;
    },
  },
  setup() {
    const model = reactive({
      notaryDocument: "",
    });
    return {
      model,
      isSubmitting: false,
    };
  },
  methods: {
    async uploadDocument() {
      this.isSubmitting = true;
      if (this.notaryDocument) {
        try {
          let pdfProcessedBlobData = null;
          console.log(`selected file type which needs to be uploaded. Type: ${this.notaryDocument.type}.`);
          if (this.notaryDocument.type === "application/pdf") {
            pdfProcessedBlobData = await this.processPDF(URL.createObjectURL(this.notaryDocument), false);
            console.log("PDF is processed.");
          }

          const url = "/file/template-upload";
          const formData = new FormData();
          if (pdfProcessedBlobData) {
            const fileToSend = new File([pdfProcessedBlobData], this.notaryDocument.name);
            formData.append("file", fileToSend);
          } else {
            formData.append("file", this.notaryDocument);
          }
          const response = await $axios.post(url, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          this.$emit("uploaded", response);
        } catch (error) {
          console.log(error);
        }
      } else {
        this.$q.notify({
          type: "negative",
          message: "Please select a document to proceed."
        });
      }
      this.isSubmitting = false;
    },
    onRejected () {
      this.$q.notify({
        type: "negative",
        message: "Selected document size is exceeding the maximum file size of 25MB."
      });
    }
  },
};
</script>
