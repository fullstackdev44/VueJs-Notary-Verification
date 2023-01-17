<template>
  <q-dialog ref="dialog" v-model="showModifyDocumentsComponent" style="width: 100vw">
    <q-card class="q-ma-lg" style="width: 100vw; max-width: 100vw; height: 90vh; margin: 12px">
      <q-card-section class="row items-center q-pb-none">
        <h2>
          Modify existing PDF File
        </h2>
        <q-space />
        <q-btn
          class="showTooltip"
          outline
          label="Cancel"
          color="red"
          style="margin-right: 12px"
          @click="cancelPDFFileClicked"
        />
        <q-btn
          outline
          :loading="finalSavePDFLoading"
          label="Save the PDF File"
          color="primary"
          @click="savePDFFileClicked"
        />
      </q-card-section>
      <q-card-section style="height: 55%; padding: 6px">
        <div style="padding: 6px; border: 1px solid grey; height: 100%; border-radius: 5px; overflow-y: scroll">
          <div style="font-size: 12px">
            Main PDF File : {{ mainPDFileName }}
          </div>
          <template v-if="modifyPdfSpotLoading">
            <div class="renderer">
              <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
            </div>
          </template>
          <div id="modify-pdf-spot" class="grid-stack" />
        </div>
      </q-card-section>
      <q-card-section style="height: 35%; padding: 6px; padding-top: 0px">
        <div style="padding: 6px; border: 1px solid grey; height: 100%; border-radius: 5px; overflow-y: scroll">
          <div style="font-size: 12px; margin-bottom: 12px">
            Secondary PDF File (Only used for merging with original PDF File)
            <q-btn
              v-if="secondaryGridUploadedFile"
              round
              outline
              icon="add"
              style="float: right"
              :loading="pickedFileUploading"
              color="primary"
              @click="$refs.fileinputArticle.$el.click()"
            >
              <q-tooltip>
                Add another secondary pdf file for merging
              </q-tooltip>
            </q-btn>
            <!-- <q-btn
              v-if="secondaryGridUploadedFile && !secondaryPdfSpotLoading"
              label="Append all pages"
              color="primary"
              @click="appendPrependSecondary('append')"
            >
              <q-tooltip>
                Append all the pdf pages to the Main PDF File
              </q-tooltip>
            </q-btn>
            <q-btn
              v-if="secondaryGridUploadedFile && !secondaryPdfSpotLoading"
              label="Prepend all pages"
              color="primary"
              @click="appendPrependSecondary('prepend')"
            >
              <q-tooltip>
                Prepend all the pdf pages to the Main PDF File
              </q-tooltip>
            </q-btn> -->
          </div>
          <div id="secondary-pdf-spot" class="grid-stack" />
          <template v-if="secondaryPdfSpotLoading">
            <div class="renderer">
              <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
            </div>
          </template>
          <div v-else
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
                    :loading="pickedFileUploading"
                    color="primary"
                    @click="$refs.fileinputArticle.$el.click()"
                  />
                  <p class="no-margin q-pt-md text-faded">
                    Upload secondary pdf file / image files in jpg, jpeg, png extension which you want to merge with original pdf file
                  </p>
                </div>
              </div>
            </div>
          </div>
          <q-file
            v-show="false"
            ref="fileinputArticle"
            v-model="pickedArticleFile"
            standout
            color="primary"
            label="Add a document"
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>
      </q-card-section>
    </q-card>
    <vue-simple-context-menu
      ref="vueMainPDFContextMenu"
      element-id="mainPDFContextMenu"
      :options="contextMenuOptions"
      @option-clicked="mainPDFContextMenuOptionClicked"
    />
  </q-dialog>
</template>

<style>
  .canvas-0-degrees {
    transform: rotate(0deg);
    -webkit-transform:rotate(0deg);
    -moz-transform:rotate(0deg);
    -o-transform:rotate(0deg);
    -ms-transform:rotate(0deg);
  }
  .canvas-90-degrees {
    transform: rotate(90deg);
    -webkit-transform:rotate(90deg);
    -moz-transform:rotate(90deg);
    -o-transform:rotate(90deg);
    -ms-transform:rotate(90deg);
  }
  .canvas-180-degrees {
    transform: rotate(180deg);
    -webkit-transform:rotate(180deg);
    -moz-transform:rotate(180deg);
    -o-transform:rotate(180deg);
    -ms-transform:rotate(180deg);
  }
  .canvas-270-degrees {
    transform: rotate(270deg);
    -webkit-transform:rotate(270deg);
    -moz-transform:rotate(270deg);
    -o-transform:rotate(270deg);
    -ms-transform:rotate(270deg);
  }
</style>

<script>
// import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";

import "gridstack/dist/gridstack.min.css";
import "gridstack/dist/gridstack-extra.min.css";
import { GridStack } from "gridstack";
import _ from "lodash";
import "gridstack/dist/h5/gridstack-dd-native";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import PDFJSWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import { PDFDocument, degrees } from "pdf-lib";
import $ from "jquery";
import "jquery-ui/ui/widgets/tooltip";

pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJSWorker;

export default {
  name: "ModifyDocumentsComponent",
  props: {
    openModifyDocumentsComponentModel: {
      type: Boolean,
      default: false,
    },
    sessionId: {
      type: String,
      default: ""
    },
    documentDoc: {
      type: Object,
      default: () => {}
    },
    fileDoc: {
      type: File,
      default: () => {}
    },
    modifyDocumentUpdatesFunction: {
      type: Function,
      default: () => {}
    },
  },

  data() {
    return {
      showModifyDocumentsComponent: false,
      totalPages: 0,
      pdfLoaded: false,
      SMALL_SCALE: 0.2,
      modifyPdfSpotGrid: false,
      secondaryPdfSpotGrid: false,
      allPDFDocsBytes: {},
      totalGridColumns: 7,
      secondaryGridUploadedFile: false,
      pickedArticleFile: [],
      pickedFileUploading: false,
      finalSavePDFLoading: false,
      modifyPdfSpotLoading: false,
      secondaryPdfSpotLoading: false,
      secondaryFileUrlSource: "",
      currentSecondaryPDFIndex: 1,
      pdfPagesRotated: {},
      modifyPdfGridProperties: {
        float: false,
        cellHeight: "150",
        minRow: 2,
        column: 7,
        margin: 1,
        // dragOut: true,
        acceptWidgets: ".grid-stack-item",
        dragIn: ".grid-stack-item",
        // handleClass: "grid-stack-item",
        aspectRatio: true,
        disableResize: true,
        // disableResize: true
        // staticGrid: true,
      },
      secondaryPdfGridProperties: {
        float: false,
        cellHeight: "150",
        minRow: 2,
        column: 7,
        margin: 1,
        // dragOut: true,
        // acceptWidgets: ".newdashboardgriditem",
        // dragIn: ".newdashboardgriditem",
        // handleClass: "grid-stack-item",
        aspectRatio: true,
        disableResize: true,
        // disableResize: true
        // staticGrid: true,
      },
      contextMenuOptions: [
        // {
        //   name: "Duplicate",
        //   slug: "duplicate",
        // },
        // {
        //   type: "divider",
        // },
        {
          name: "Rotate Clockwise",
          slug: "rotate_clockwise",
        },
        {
          name: "Rotate Counter Clockwise",
          slug: "rotate_counter_clockwise",
        },
        {
          type: "divider",
        },
        {
          name: "Delete",
          slug: "delete",
        }
      ]
    };
  },

  computed: {
    mainPDFileName() {
      return this.documentDoc?.name || this.fileDoc?.name;
    }
  },

  watch: {
    openModifyDocumentsComponentModel: {
      handler(value) {
        if (value) {
          this.showModifyDocumentsComponent = true;
          this.fetchPDFAndRenderPages("main", this.documentDoc?.url);
        } else {
          this.showModifyDocumentsComponent = false;
        }
      },
    },
    async pickedArticleFile(val) {
      console.log("pickedArticleFile", val);
      if (val) {
        // eslint-disable-next-line no-plusplus
        const reader = new FileReader();
        reader.readAsArrayBuffer(val);
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
              await this.uploadZip(val);
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
      this.docSelected = true;
    },
  },

  mounted() {
    // setTimeout(() => {
    //   this.uploadZip({});
    // }, 10000);
  },

  methods: {
    mainPDFContextMenuOptionClicked(event, tempItemId, tempOptionClicked) {
      console.log(event);
      const itemId = event?.item || tempItemId;
      const optionClicked = event?.option?.slug || tempOptionClicked;
      console.log(optionClicked, itemId);
      if (optionClicked === "delete") {
        this.modifyPdfSpotGrid.removeWidget($(`[gs-id="${itemId}"]`)[0]);
        this.modifyPdfSpotGrid.compact();
      } else if (optionClicked.includes("rotate")) {
        const oldPageId = `${itemId}-canvas`;
        const canvasElement = document.getElementById(oldPageId);
        const canvasClasslist = canvasElement.classList;
        // const canvasClasslistArray = canvasElement.classList;
        console.log("canvasClasslist", canvasClasslist, canvasClasslist[0]);
        let currentRotationDegree = 0;
        if (canvasClasslist.contains("canvas-90-degrees")) {
          currentRotationDegree = 90;
          canvasClasslist.remove("canvas-90-degrees");
        } else if (canvasClasslist.contains("canvas-180-degrees")) {
          currentRotationDegree = 180;
          canvasClasslist.remove("canvas-180-degrees");
        } else if (canvasClasslist.contains("canvas-270-degrees")) {
          currentRotationDegree = 270;
          canvasClasslist.remove("canvas-270-degrees");
        }
        console.log("currentRotationDegree", currentRotationDegree);
        let nextRotateDegree = 0;
        if (optionClicked === "rotate_clockwise") {
          if (currentRotationDegree === 0) {
            nextRotateDegree = 90;
          } else if (currentRotationDegree === 90) {
            nextRotateDegree = 180;
          } else if (currentRotationDegree === 180) {
            nextRotateDegree = 270;
          } else if (currentRotationDegree === 270) {
            nextRotateDegree = 0;
          }
        } else if (optionClicked === "rotate_counter_clockwise") {
          if (currentRotationDegree === 0) {
            nextRotateDegree = 270;
          } else if (currentRotationDegree === 90) {
            nextRotateDegree = 0;
          } else if (currentRotationDegree === 180) {
            nextRotateDegree = 90;
          } else if (currentRotationDegree === 270) {
            nextRotateDegree = 180;
          }
        }
        if (nextRotateDegree === 0) {
          canvasClasslist.add("canvas-0-degrees");
        } else if (nextRotateDegree === 90) {
          canvasClasslist.add("canvas-90-degrees");
        } else if (nextRotateDegree === 180) {
          canvasClasslist.add("canvas-180-degrees");
        } else if (nextRotateDegree === 270) {
          canvasClasslist.add("canvas-270-degrees");
        }
        this.pdfPagesRotated[itemId] = nextRotateDegree;
      }
    },
    appendPrependSecondary(appendType) {
      console.log("appendType", appendType);
    },
    mainPDFRightClick(event, item) {
      event.preventDefault();
      this.$refs.vueMainPDFContextMenu.showMenu(event, item);
    },
    async savePDFFileClicked() {
      this.$q.dialog({
        title: "Confirm",
        message: "Are you sure you want to this version of pdf file.? Note: Modifying the pdf after pretagging, can have adverse effects on pretagged pdf. Please check the pdf thoroughly after modifying",
        cancel: true,
        persistent: true
      }).onOk(async () => {
        this.finalSavePDFLoading = true;
        const modifyPDFGridData = this.modifyPdfSpotGrid.save();
        console.log("modifyPDFGridData", modifyPDFGridData);
        const allPDFFiles = {};
        const allPDFFilesWithPages = {};
        // const mainPDFFileBytes = this.allPDFDocsBytes.main;
        // const originalPDFFile = await PDFDocument.load(mainPDFFileBytes, { ignoreEncryption: true });
        const mainPDFFile = await PDFDocument.load(this.allPDFDocsBytes.main, { ignoreEncryption: true });
        await Promise.all(_.map(this.allPDFDocsBytes, async (pdfDocBytes, pdfId) => {
          const currentPDFDocument = await PDFDocument.load(pdfDocBytes, { ignoreEncryption: true });
          allPDFFiles[pdfId] = currentPDFDocument;
          const allPageArray = [];
          const allPagesCount = currentPDFDocument.getPageCount();
          for (let i = 0; i < allPagesCount; i += 1) {
            allPageArray.push(i);
          }
          allPDFFilesWithPages[pdfId] = await mainPDFFile.copyPages(currentPDFDocument, allPageArray);
        }));

        console.log("mainPDFFile", mainPDFFile);
        console.log("allPDFFilesWithPages", allPDFFilesWithPages);
        const allPagesCount2 = mainPDFFile.getPageCount();
        const allPageArray2 = [];
        for (let i = 0; i < allPagesCount2; i += 1) {
          mainPDFFile.removePage(0);
          allPageArray2.push(i);
        }
        // const saveFile = mainPDFFile.save();
        let curentPageNumber = 0;
        const originalPDFFilePages = await mainPDFFile.copyPages(allPDFFiles.main, allPageArray2);
        console.log("originalPDFFilePages", originalPDFFilePages);
        _.map(modifyPDFGridData, (tempGridData) => {
          const documentId = tempGridData.id.split("-")[0];
          const pageNumber = tempGridData.id.split("-")[1];
          const pageDoc = allPDFFilesWithPages[documentId][Number(pageNumber) - 1];
          if (this.pdfPagesRotated[tempGridData.id]) {
            pageDoc.setRotation(degrees(this.pdfPagesRotated[tempGridData.id]));
          }
          mainPDFFile.insertPage(curentPageNumber, pageDoc);
          console.log("pageDoc", pageDoc, this.pdfPagesRotated[tempGridData.id]);
          curentPageNumber += 1;
        });
        const pdfBytes = await mainPDFFile.save();
        console.log("pdfBytespdfBytes", pdfBytes);
        const outputFileObjectBlob = new Blob([pdfBytes], { type: "application/pdf" });
        const documentName = this.documentDoc?.name || this.fileDoc?.name || "inputfile.pdf";
        const outputFileObject = new File([outputFileObjectBlob], `modified_${(Math.random() + 1).toString(36).substring(3)}_${documentName}`);
        let response;
        if (!this.fileDoc?.name) {
          // window.open(URL.createObjectURL(outputFileObjectBlob));
          // console.log("saveFile", saveFile);
          console.log("mainPDFFile", mainPDFFile);
          console.log("mainPDFFile.getPageCount()", mainPDFFile.getPageCount());
          const url = "file/uploadEditedDocument";
          console.log("url", url);
          const formData1 = new FormData();
          formData1.append("documentId", this.documentDoc?._id);
          formData1.append("sessionId", this.sessionId);
          formData1.append("file", outputFileObject);
          response = await $axios.post(url, formData1, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          console.log(response);
        }
        this.finalSavePDFLoading = false;
        this.$q.notify({
          type: "primary",
          message: "Document Edited Successfully"
        });
        this.modifyDocumentUpdatesFunction("document_modified", { document: response?.data?.document, fileObject: outputFileObject });
      });
    },
    cancelPDFFileClicked() {
      this.$refs.dialog.hide();
      this.modifyDocumentUpdatesFunction("cancelled", {});
    },
    getNewCanvasContainer(pageNo, prefix) {
      const canvasContainer = document.createElement("div");
      const pageId = `${prefix}-${pageNo}`;
      canvasContainer.id = pageId;
      canvasContainer.classList = "grid-stack-item";
      // canvasContainer.style.position = "relative";
      canvasContainer.style.fontSize = "0";
      // canvasContainer.style.marginBottom = "1rem";
      canvasContainer.style.marginRight = "0.5rem";
      // canvasContainer.style.border = "1px solid #d6d6d6";
      canvasContainer.style.display = "inline-block";
      // canvasContainer.addEventListener("dragover", this.dropOnPdf);
      // canvasContainer.addEventListener("drop", () => {
      //   this.modifyPdfSpotGrid.compact();
      // });
      // contextmenu.prevent.stop="handleClick1($event, item)"
      canvasContainer.addEventListener("contextmenu", (e) => this.mainPDFRightClick(e, pageId));
      canvasContainer.setAttribute("gs-id", pageId);
      console.log("canvasContainer", canvasContainer);
      return canvasContainer;
    },

    getPageTag(pageNo) {
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
    getDeleteIcon(pageNo) {
      const pageTag = document.createElement("p");
      pageTag.id = `${pageNo}-delete-icon`;
      pageTag.classList = ["showTooltip"];
      pageTag.title = "Click here to delete this page";
      pageTag.style.position = "absolute";
      pageTag.style.top = "0";
      pageTag.style.left = "30px";
      pageTag.style.fontSize = "15px";
      pageTag.style.background = "#8000ff";
      pageTag.style.padding = "0 7px";
      pageTag.style.color = "#fff";
      pageTag.style.fontWeight = "700";
      pageTag.style.cursor = "pointer";
      pageTag.innerHTML = "<i class=\"fas fa-trash\"></i>";
      pageTag.onclick = () => {
        this.mainPDFContextMenuOptionClicked(false, `main-${pageNo}`, "delete");
      };
      return pageTag;
    },
    getRotateIcon(pageNo) {
      const pageTag = document.createElement("p");
      pageTag.style.position = "absolute";
      pageTag.classList = ["showTooltip"];
      pageTag.title = "Click here to rotate this page clockwise";
      pageTag.style.top = "0";
      pageTag.style.left = "60px";
      pageTag.style.fontSize = "15px";
      pageTag.style.background = "#8000ff";
      pageTag.style.padding = "0 7px";
      pageTag.style.color = "#fff";
      pageTag.style.fontWeight = "700";
      pageTag.style.cursor = "pointer";
      pageTag.innerHTML = "<i class=\"fas fa-undo fa-flip-horizontal\"></i>";
      pageTag.onclick = () => {
        this.mainPDFContextMenuOptionClicked(false, `main-${pageNo}`, "rotate_clockwise");
      };
      return pageTag;
    },
    getRotateIcon180(pageNo) {
      const pageTag = document.createElement("p");
      pageTag.style.position = "absolute";
      pageTag.classList = ["showTooltip"];
      pageTag.title = "Click here to rotate this page counter clockwise";
      pageTag.style.top = "0";
      pageTag.style.left = "90px";
      pageTag.style.fontSize = "15px";
      pageTag.style.background = "#8000ff";
      pageTag.style.padding = "0 7px";
      pageTag.style.color = "#fff";
      pageTag.style.fontWeight = "700";
      pageTag.style.cursor = "pointer";
      pageTag.innerHTML = "<i class=\"fas fa-undo\"></i>";
      pageTag.onclick = () => {
        this.mainPDFContextMenuOptionClicked(false, `main-${pageNo}`, "rotate_counter_clockwise");
      };
      return pageTag;
    },
    getNewCanvas(page, viewport) {
      const newCanvas = document.createElement("canvas");
      newCanvas.setAttribute("class", "pdf-page");
      newCanvas.setAttribute("id", page);
      // newCanvas.height = Math.floor(viewport.height);
      newCanvas.height = 150;
      newCanvas.width = Math.floor(viewport.width);
      return newCanvas;
    },
    async fetchPDFAndRenderPages(documentId, documentUrl) {
      const vm = this;
      vm.totalPages = 0;
      if (documentId === "main") {
        vm.modifyPdfSpotLoading = true;
      } else {
        vm.secondaryPdfSpotLoading = true;
      }
      let existingPdfBytes;
      if (documentUrl) {
        existingPdfBytes = await fetch(documentUrl).then((res) => res.arrayBuffer());
      } else if (this.fileDoc) {
        existingPdfBytes = await this.fileDoc.arrayBuffer();
      }
      if (!existingPdfBytes) {
        return;
      }
      console.log("existingPdfBytes", existingPdfBytes);
      // vm.allPDFDocsBytes[documentId] = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
      vm.allPDFDocsBytes[documentId] = existingPdfBytes;
      pdfjsLib.getDocument(existingPdfBytes).promise.then((pdf) => {
      // pdfjsLib.getDocument(documentUrl).promise.then((pdf) => {
        console.log("pdf", pdf);
        let currPage = 1;
        let pageNo = 0;
        vm.pdfLoaded = true;
        vm.totalPages += pdf.numPages;
        setTimeout(function createCanvas(pdfDoc, pageNumber) {
          let parentDivId = "secondary-pdf-spot";
          if (documentId === "main") {
            parentDivId = "modify-pdf-spot";
          }
          const pdfIndexContainer = document.getElementById(parentDivId);
          pdfDoc.getPage(pageNumber).then((page) => {
            pageNo += 1;

            // create new canvas for index of pdf pages
            const pageIndexViewport = page.getViewport({ scale: vm.SMALL_SCALE });
            console.log("pageIndexViewport", pageIndexViewport);
            const pageIndexCanvas = vm.getNewCanvas(`${documentId}-${pageNo}-canvas`, pageIndexViewport);
            const pageIndexContext = pageIndexCanvas.getContext("2d");

            // create canvas container for page index
            const pageIndexCanvasContainer = vm.getNewCanvasContainer(pageNo, documentId);
            pageIndexCanvasContainer.append(pageIndexCanvas);
            pageIndexCanvasContainer.append(vm.getPageTag(pageNo));
            const deleteIcon = vm.getDeleteIcon(pageNo);
            pageIndexCanvasContainer.append(deleteIcon);
            const rotateIcon = vm.getRotateIcon(pageNo);
            pageIndexCanvasContainer.append(rotateIcon);
            const rotateIcon180 = vm.getRotateIcon180(pageNo);
            pageIndexCanvasContainer.append(rotateIcon180);
            pdfIndexContainer.append(pageIndexCanvasContainer);

            // Render PDF page into canvas context
            const renderContext = {
              canvasContext: pageIndexContext,
              viewport: pageIndexViewport,
            };
            const pageIndexRenderTask = page.render(renderContext);
            pageIndexRenderTask.promise.then(() => {
              if (pageNo === vm.totalPages) {
                if (documentId === "main") {
                  vm.modifyPdfSpotGrid = GridStack.init(vm.modifyPdfGridProperties, document.getElementById(parentDivId));
                  vm.modifyPdfSpotGrid.on("dragstop", () => {
                    vm.modifyPdfSpotGrid.compact();
                  });
                  console.log("tempGridStackInstance", vm.modifyPdfSpotGrid);
                  vm.modifyPdfSpotLoading = false;
                } else {
                  vm.secondaryPdfSpotGrid = GridStack.init(vm.secondaryPdfGridProperties, document.getElementById(parentDivId));
                  vm.secondaryPdfSpotGrid.on("dragstop", () => {
                    vm.secondaryPdfSpotGrid.compact();
                  });
                  console.log("secondaryPdfSpotGrid", vm.secondaryPdfSpotGrid);
                  vm.secondaryPdfSpotLoading = false;
                  vm.currentSecondaryPDFIndex += 1;
                }
                console.log("gridstack initialized");
              }
              currPage += 1;
              if (currPage <= pdf.numPages) {
                createCanvas(pdf, currPage);
              }
            });
          });
        }, 1000, pdf, currPage);
      }).catch((err) => {
        console.log("Error fetching the document: ", err);
        if (documentId === "main") {
          vm.modifyPdfSpotLoading = false;
          vm.docFound = false;
          vm.docNotFoundError = err.message;
        } else {
          vm.secondaryPdfSpotLoading = false;
          vm.docFound = false;
          vm.docNotFoundError = err.message;
        }
      });
    },
    secondaryFileUploaded(e) {
      const droppedFile = e.dataTransfer.files;
      if (!droppedFile) return;
      this.pickedArticleFile = droppedFile;
    },
    async uploadZip(data) {
      console.log(data);
      try {
        this.pickedFileUploading = true;
        this.secondaryPdfSpotLoading = true;
        const url = "file/convertUploadedDoc";
        console.log("url", url);
        const formData1 = new FormData();
        formData1.append("file", data);
        const response = await $axios.post(url, formData1, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        console.log(response);
        this.secondaryFileUrlSource = response.data.url;
        this.secondaryGridUploadedFile = response.data.document;
        if (this.currentSecondaryPDFIndex > 1) {
          this.secondaryPdfSpotGrid.destroy(false);
          $("#secondary-pdf-spot").children(".grid-stack-item").remove();
        }
        this.fetchPDFAndRenderPages(`secondary${this.currentSecondaryPDFIndex}`, this.secondaryFileUrlSource);
        this.pickedFileUploading = false;
        return response.data;
      } catch (error) {
        return error;
      }
    }
  },
};
</script>
