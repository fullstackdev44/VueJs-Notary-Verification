<template>
  <div>
    <q-btn color="primary" flat rounded icon="cloud_download" @click="exportBtnClicked()">
      <q-tooltip>Get Session Data export over Email</q-tooltip>
    </q-btn>
    <q-dialog v-model="exportSessionsModel">
      <q-card style="width: 500px">
        <q-form
          class="q-gutter-md">
          <q-card-section style="padding:20px">
            <h3>
              Export Email Recepients
            </h3>
            <div class="q-gutter-sm" style="margin-top: 12px">
              <div v-for="(email, index) in extraExportEmails" :key="index">
                <q-input v-model="extraExportEmails[index]" filled :name="`extraExportEmails[${index}]`" type="email" :dense="true">
                  <template v-if="index != 0" v-slot:append>
                    <q-icon name="close" class="cursor-pointer" @click="removeExtraEmail(index)" />
                  </template>
                </q-input>
              </div>
              <q-btn label="Add More Emails" color="primary" @click="addEmailToExtraEmail()" />
            </div>
            <h3 style="margin-top: 24px">
              Data to Export
            </h3>
            <div class="q-gutter-sm">
              <q-checkbox v-model="sessionDetailsTickmark" disabled label="Session Details" />
              <q-checkbox v-model="exportItems.documents" label="Documents" />
              <q-checkbox v-model="exportItems.audit_logs" label="Audit Logs" />
            </div>
            <template v-if="exportErrorMsg">
              <p style="margin:5px; color:red;">
                {{ exportErrorMsg }}
              </p>
            </template>
          </q-card-section>
          <q-card-actions align="right">
            <div class="q-gutter-x-md">
              <q-btn v-close-popup outline label="Close" color="primary" style="padding-left: 10px; padding-right: 10px" @click="exportModalClosed()" />
              <q-btn label="Begin Export" color="primary" :loading="exportSaveLoading" style="padding-left: 10px; padding-right: 10px" @click="exportForumSubmitted" />
            </div>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
import { $axios } from "boot/axios";
// import _ from "lodash";

export default {
  name: "ExportButton",
  props: {
    exportView: {
      type: String,
      default: ""
    },
    archivedView: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      exportSessionsModel: false,
      exportItems: {
        documents: true,
        audit_logs: true,
        export_archived: false,
      },
      defaultExportEmail: true,
      extraExportEmails: [],
      exportErrorMsg: "",
      sessionDetailsTickmark: true,
      exportSaveLoading: false
    };
  },
  watch: {
    exportSessionsModel: {
      handler(value) {
        if (!value) {
          this.exportItems.documents = true;
          this.exportItems.audit_logs = true;
          this.exportItems.export_archived = false;
          this.extraExportEmails = [this.$user.email];
          this.exportErrorMsg = "";
        }
      }
    },
    sessionDetailsTickmark: {
      handler() {
        this.sessionDetailsTickmark = true;
      }
    }
  },
  mounted () {
    this.extraExportEmails.push(this.$user.email);
  },
  methods: {
    exportBtnClicked () {
      this.exportSessionsModel = true;
    },
    exportModalClosed () {
      this.exportSessionsModel = false;
    },
    async exportForumSubmitted () {
      if (!this.exportItems.documents && !this.exportItems.audit_logs) {
        this.exportErrorMsg = "Please select atleast single item to export";
        return;
      }
      for (let i = 0; i < this.extraExportEmails.length; i += 1) {
        if (!this.extraExportEmails[i]) {
          this.exportErrorMsg = "Please enter all email addresses";
          return;
        }
      }
      this.exportErrorMsg = "";
      if (this.archivedView) {
        this.exportItems.export_archived = true;
      } else {
        this.exportItems.export_archived = false;
      }
      const payload = {
        extraExportEmails: this.extraExportEmails,
        exportItems: this.exportItems,
        exportView: this.exportView
      };
      this.exportSaveLoading = true;
      const resp = await $axios.post("session/export", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.exportSaveLoading = false;
      if (resp.status === 200) {
        this.$q.notify({
          type: "positive",
          message: resp.data.msg,
          timeout: 1000
        });
        this.exportSessionsModel = false;
      } else if (resp.status >= 400) {
        this.$q.notify({
          type: "negative",
          message: resp.data.msg,
          timeout: 1000
        });
      }
    },
    addEmailToExtraEmail () {
      this.extraExportEmails.push("");
    },
    removeExtraEmail(index) {
      if (index < this.extraExportEmails.length) {
          this.extraExportEmails.splice(index, 1);
      }
    }
  }
};
</script>
