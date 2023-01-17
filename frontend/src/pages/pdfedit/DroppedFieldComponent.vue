<template>
  <div :id="'droppedFieldComponentInner' + fieldDroppedIndex" style="height: 100%; width: 100%" :style="innerFieldStyle" @click="placeholderSignatureClicked">
    <q-icon v-if="canEditElement && (fieldType === 'static_text' || fieldType === 'signature')" style="position: absolute; float: right: top: -10px; right: -15px; cursor: pointer;" name="content_copy" @click="copyDroppedElementToAllPagesLocal($event, elementId)">
      <q-tooltip>Copy this element to All Pages</q-tooltip>
    </q-icon>
    <template v-if="fieldType === 'static_text'">
      {{ fieldText }}
    </template>
    <template v-if="fieldType === 'input_text'" style="cursor:move">
      <textarea v-model="inputTextValue" style="height: 100%; width: 100%; resize: none; border: none; outline: none; background: transparent" />
    </template>
    <template v-if="fieldType === 'checkmark'">
      <q-icon name="check" style="margin-right: 6px; font-size: 20px" />
    </template>
    <template v-if="fieldType === 'signature'">
      <signature-selection-component :signature-selection-done="signatureSelectionDone" :placeholder-signature-closed="placeholderSignatureClosed" :first-time-render="firstTimeRender" :element-id="elementId" :image-data="imageData" />
    </template>
    <template v-if="fieldType === 'notary_certificate'">
      <notary-certificate-selection-component :notary-certificate-selection-done="notaryCertificateSelectionDone" :first-time-render="firstTimeRender" :all-notary-certificates="allNotaryCertificates" :element-id="elementId" />
    </template>
    <template v-if="fieldType === 'image' && imageFieldType === 'notary_seal'">
      <div style="height: 100%">
        Notarized online using audio-video communication
        <div :id="'droppedFieldComponentInnerDiv' + fieldDroppedIndex" class="notarySealImage" />
      </div>
    </template>
    <template v-if="fieldType === 'placeholder'">
      <template v-if="($user.role === 'customer' && (!fieldPlaceholderUser || fieldPlaceholderUser === 'undefined')) || (joinedAsWitness && fieldPlaceholderUser === 'witness')">
        <template v-if="fieldPlaceholderType === 'signature'">
          <div v-if="!signatureInserted">
            Click to Add Signature
          </div>
          <signature-selection-component :signature-selection-done="signatureSelectionDone" :placeholder-signature-closed="placeholderSignatureClosed" :open-signature-model="openSignatureModel" />
        </template>
        <template v-if="fieldPlaceholderType === 'input_text'">
          <textarea v-model="inputTextValue" style="height: 100%; width: 100%; resize: none; border: none; outline: none;" />
        </template>
      </template>
      <template v-else>
        <template v-if="!imageData && fieldPlaceholderType === 'signature'">
          <template v-if="fieldPlaceholderUser === 'witness'">
            Witness's Signature Here
          </template>
          <template v-else>
            Signer's Signature Here
          </template>
        </template>
        <template v-if="fieldPlaceholderType === 'input_text'">
          <div v-if="!inputTextValue">
            Signer's Free Text
          </div>
          <div v-else style="text-align: left; padding-left: 6px; padding-top: 6px">
            {{ inputTextValue }}
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<script>

import _ from "lodash";
import SignatureSelectionComponent from "./SignatureSelectionComponent.vue";
import NotaryCertificateSelectionComponent from "./NotaryCertificateSelectionComponent.vue";

export default {
  name: "DroppedFieldComponent",
  components: {
    SignatureSelectionComponent,
    NotaryCertificateSelectionComponent
  },
  props: {
    fieldType: {
      type: String,
      default: ""
    },
    fieldText: {
      type: String,
      default: ""
    },
    fieldDroppedIndex: {
      type: Number,
      default: 1
    },
    fieldPlaceholderType: {
      type: String,
      default: ""
    },
    fieldPlaceholderUser: {
      type: String,
      default: ""
    },
    fieldPlaceholderUserId: {
      type: String,
      default: ""
    },
    inputTextValueToPass: {
      type: String,
      default: ""
    },
    imageData: {
      type: String,
      default: ""
    },
    selectedFieldIndex: {
      type: Number,
      default: 0
    },
    allImagesData: {
      type: Object,
      default: () => {}
    },
    imageFieldType: {
      type: String,
      default: ""
    },
    elementId: {
      type: String,
      default: ""
    },
    fieldHeight: {
      type: String,
      default: ""
    },
    fieldWidth: {
      type: String,
      default: ""
    },
    selectionDoneFunction: {
      type: Function,
      default: () => {}
    },
    copyDroppedElementToAllPages: {
      type: Function,
      default: () => {}
    },
    firstTimeRender: {
      type: Boolean,
      default: false
    },
    canEditElement: {
      type: Boolean,
      default: false
    },
    joinedAsWitness: {
      type: Boolean,
      default: false
    },
    allNotaryCertificates: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      inputTextValue: "",
      innerFieldStyle: {},
      openSignatureModel: false,
      signatureInserted: false
    };
  },

  watch: {
    inputTextValue: {
      handler(value) {
        if (value !== this.inputTextValueToPass) {
          this.sendValueChangeCall(this, value);
        }
      }
    },
    fieldWidth: {
      handler() {
        if (this.imageFieldType === "notary_seal") {
          this.updateFieldWidthForNotarySealLogic();
        }
      }
    }
  },

  mounted() {
    if (this.imageData) {
      this.signatureSelectionDone(this.imageData, true);
    }
    if (this.fieldType === "image") {
      let localImageData = "";
      if (this.imageFieldType === "notary_seal") {
        localImageData = this.allImagesData && this.allImagesData.notarySealImage;
      }
      if (localImageData) {
        const image = new Image();
        image.src = localImageData;
        image.style.width = "100%";
        image.style.height = "100%";
        document.getElementById(`droppedFieldComponentInnerDiv${this.fieldDroppedIndex}`).appendChild(image);
      }
    }
    if (this.imageFieldType === "notary_seal") {
      this.updateFieldWidthForNotarySealLogic();
    }
  },
  created() {
    if (this.inputTextValueToPass) {
      this.inputTextValue = this.inputTextValueToPass;
    }
    if (this.fieldType === "placeholder") {
      this.innerFieldStyle = {
        background: "#bfbef7",
        border: "1px solid #696887",
        opacity: 0.7
      };
      if (this.fieldPlaceholderType === "input_text" && this.$user.role !== "customer") {
        this.innerFieldStyle["overflow-y"] = "auto";
      }
      if (this.inputTextValue || this.imageData) {
        this.innerFieldStyle.background = "#a2f5b8";
      }
    } else if (this.fieldType === "input_text") {
      this.innerFieldStyle = {
        border: "1px solid #696887",
        cursor: "move",
        "padding-top": "6px",
        "padding-left": "6px",
        background: "#d5ded7",
        opacity: 0.7
      };
    } else if (this.fieldType === "whiteout") {
      this.innerFieldStyle = {
        background: "white"
      };
    } else if (this.fieldType === "static_text") {
      this.innerFieldStyle = {
        "text-align": "left"
      };
    } else if (this.fieldType === "checkmark") {
      this.innerFieldStyle = {
        "text-align": "left"
      };
    } else if (this.fieldType === "image" && this.imageFieldType === "notary_seal") {
      this.innerFieldStyle = {
        "font-size": "10px"
      };
    }
  },

  methods: {
    updateFieldWidthForNotarySealLogic() {
      try {
        let textFontSize = 10;
        const widthToUse = parseInt(this.fieldWidth.replace("px", ""), 10);
        if (widthToUse <= 113) {
          textFontSize = 4;
        } else if (widthToUse <= 136) {
          textFontSize = 5;
        } else if (widthToUse <= 158) {
          textFontSize = 6;
        } else if (widthToUse <= 180) {
          textFontSize = 7;
        } else if (widthToUse <= 203) {
          textFontSize = 8;
        } else if (widthToUse <= 224) {
          textFontSize = 9;
        }
        this.innerFieldStyle["font-size"] = `${textFontSize}px`;
      } catch (error) {
        console.log("error", error);
      }
    },
    copyDroppedElementToAllPagesLocal(event, elementId) {
      this.$q.dialog({
        title: "Confirm",
        message: "Do you want to copy this field element to all the pages?",
        cancel: true,
        persistent: true
      }).onOk(() => {
        this.copyDroppedElementToAllPages(event, elementId);
      });
    },
    sendValueChangeCall: _.debounce((self, value) => {
      self.selectionDoneFunction(self.selectedFieldIndex, { inputTextValue: value, firstTimeRender: self.firstTimeRender }, self.elementId);
    }, 200),
    signatureSelectionDone(imageData, dontSendSocketUpdate) {
      const image = new Image();
      image.src = imageData;
      image.style.width = "100%";
      image.style.height = "100%";
      const droppedFieldComponentInner = document.getElementById(`droppedFieldComponentInner${this.fieldDroppedIndex}`);
      if (this.signatureInserted) {
        droppedFieldComponentInner.replaceChild(image, droppedFieldComponentInner.firstElementChild);
      } else {
        droppedFieldComponentInner.appendChild(image);
        this.signatureInserted = true;
      }
      if (!dontSendSocketUpdate) {
        this.selectionDoneFunction(this.selectedFieldIndex, { imageData, firstTimeRender: this.firstTimeRender }, this.elementId);
      }
    },
    notaryCertificateSelectionDone(imageData, height, width) {
      this.signatureInserted = true;
      const image = new Image();
      image.src = imageData;
      image.style.width = "100%";
      image.style.height = "100%";
      document.getElementById(`droppedFieldComponentInner${this.fieldDroppedIndex}`).appendChild(image);
      const dataToSend = {
        imageData,
        firstTimeRender: this.firstTimeRender
      };
      if (height && width) {
        dataToSend.fieldWidth = `${height}px`;
        dataToSend.fieldWidth = `${width}px`;
      }
      this.selectionDoneFunction(this.selectedFieldIndex, dataToSend, this.elementId);
    },
    placeholderSignatureClicked() {
      this.openSignatureModel = true;
    },
    placeholderSignatureClosed() {
      this.openSignatureModel = false;
    },
  }
};

</script>

<style type="text/css">
.notarySealImage {
  height: calc(100% - 15px) !important;
}
</style>
