<template>
  <q-layout>
    <q-page-container class="container">
      <q-page class="q-pa-lg">
        <div class="flex justify-between q-py-md items-center">
          <h1 class="">
            Templates
          </h1>
          <q-btn
            v-if="$user.approve !== 'inactive' && $user.memberType !== 'free'"
            class=""
            color="primary"
            text-color="white"
            label="Upload Template"
            @click.stop.prevent="uploadShow = true"
          />
        </div>
        <template v-if="loading">
          <div class="renderer">
            <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
          </div>
        </template>
        <template v-if="templates && templates.length">
          <div class="row" style="font-size:.6rem;">
            <div class="text-left tmpname" style="">Template Name</div>
            <!-- <div class="text-left" style="width:15%">Type</div> -->
            <div class="text-left" style="width:30%">Created At</div>
          </div>
          <div class="q-table__card sessions-info">
            <div v-for="(template, key) in templates" :key="key">
              <div>
                <q-list class="rounded-borders">
                  <q-item class="tab-nowrp">
                    <div class="text-left tempc-name">
                      <div style="text-overflow: ellipsis; overflow: hidden; white-space: no-wrap;">
                        <p>{{ template.name }}</p>
                        <q-icon v-if="template.type === 'custom'" name="edit" color="primary" size="15px" @click="updateDialog(template._id, template.name)" />
                        <q-tooltip v-if="template.type === 'custom'" :delay="200">
                          Click to update name
                        </q-tooltip>
                      </div>
                    </div>
                    <div class="text-left tempc-date">
                      <q-icon label="" name="today" />
                      {{ formatDate(template.createdAt) }}
                    </div>
                    <div class="text-right tempc-tag" style="margin-right: 10px;">
                      <q-btn class="" color="green" text-color="white" label="Pre-tag Fields" @click="prefillFieldsClicked(template._id)" />
                    </div>
                    <div class="text-right tempc-del">
                      <q-btn icon="delete_forever" flat label="" @click="deletePrompt(template._id)" />
                    </div>
                  </q-item>
                  <q-separator />
                </q-list>
              </div>
            </div>
          </div>
        </template>
        <q-dialog v-model="deleteConfirm" persistent>
          <q-card class="q-pa-sm">
            <q-card-section class="column">
              <q-avatar icon="delete_forever" color="primary" text-color="white" />
              <span class="q-ml-sm"> Are you sure? </span>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn v-if="!loading" v-close-popup flat outline label="Cancel" color="primary" />
              <q-btn
                outline
                label="Remove"
                color="primary"
                :loading="deleting"
                @click="deleteTemplate()"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>
        <q-dialog v-model="uploadShow" persistent>
          <TemplateUpload @uploaded="uploadComplete()" />
        </q-dialog>
        <q-dialog v-model="update.show" persistent>
          <q-card class="q-pa-sm" style="width: 400px">
            <q-card-section>
              <q-form class="q-gutter-sm">
                <q-input
                  v-model="update.name"
                  dense
                  filled
                  class=""
                  type="text"
                  label="Template Name"
                  :rules="[val => !!val || update.error]"
                />
                <q-btn
                  size="sm"
                  color="blue"
                  class="text-white q-pa-sm"
                  type="button"
                  label="Update"
                  :loading="updating"
                  :disable="updating"
                  @click="updateTemplate"
                />
              </q-form>
            </q-card-section>
          </q-card>
        </q-dialog>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { $axios } from "boot/axios";
import TemplateUpload from "@/pages/notary/templateUpload.vue";

const moment = require("moment");

export default {
  name: "DocumentTemplates",
  components: { TemplateUpload },
  data() {
    return {
      loading: false,
      deleting: false,
      updating: false,
      templates: [],
      deleteConfirm: false,
      deleteKey: null,
      uploadShow: false,
      update: {
        name: "",
        key: null,
        show: false,
        error: "Template name is required"
      }
    };
  },
  async mounted () {
    this.loading = true;
    if (this.$user.memberType === "free") {
      this.$router.replace("/notary/dashboard/");
    } else {
      await this.loadTemplates();
    }
    this.loading = false;
  },
  methods: {
    async loadTemplates() {
      const url = "notary/document-templates";
      const dataToSend = {
        notary_user_id: this.$user._id
      };
      const response = await $axios.post(url, dataToSend, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.templates = response.data;
    },
    formatDate(rawDate) {
      return `${moment(rawDate, "YYYY-MM-DD HH:mm A").format("DD/MM/YYYY HH:mmA")} CST`;
    },
    getStatusColor(status) {
      let statusColor = "gray";
      switch (status) {
        case "predefined":
          statusColor = "teal";
          break;
        default:
          statusColor;
      }
      return statusColor;
    },
    async uploadComplete() {
      await this.loadTemplates();
      this.uploadShow = false;
    },
    deletePrompt(templateId) {
      this.deleteConfirm = true;
      this.deleteKey = templateId;
    },
    updateDialog(templateId, templateName) {
      this.update.key = templateId;
      this.update.name = templateName;
      this.update.show = true;
    },
    async updateTemplate() {
      this.updating = true;
      try {
        const url = "notary/templateUpdate";
        const response = await $axios.post(url, { templateId: this.update.key, templateName: this.update.name }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log(response);
        await this.loadTemplates();
        this.update.key = null;
        this.update.name = null;
      } catch (error) {
        console.log(error);
      }
      this.update.show = false;
      this.updating = false;
    },
    async deleteTemplate() {
      this.deleting = true;
      try {
        const url = "notary/templateDelete";
        const response = await $axios.post(url, { templateId: this.deleteKey }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log(response);
        await this.loadTemplates();
        this.deleteKey = null;
      } catch (error) {
        console.log(error);
      }
      this.deleteConfirm = false;
      this.deleting = false;
    },
    prefillFieldsClicked(templateId) {
      this.$router.replace(`/pdf_edit/sessions/${templateId}?mode=template`);
    }
  }
};
</script>
