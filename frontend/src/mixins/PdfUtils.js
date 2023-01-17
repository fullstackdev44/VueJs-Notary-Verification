import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import PDFJSWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.pdfMake.vfs;
pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJSWorker;

export default {
    methods: {
        async processPDF(pdfData, returnUrl) {
            return pdfjsLib.getDocument({
                url: pdfData,
                cMapUrl: "https://bluenotary.us/assets/cmaps/",
                cMapPacked: true
            }).promise.then(async (pdf) => {
                try {
                    const outputImages = [];
                    console.log("# PDF document loaded.");
                    let isAnyPageLandscape = false;
                    // Get pages.
                    /* eslint-disable no-await-in-loop */
                    for (let index = 1; index <= pdf.numPages; index += 1) {
                        const page = await pdf.getPage(index);
                        const viewport = page.getViewport({ scale: 2.0 });
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        const renderContext = { canvasContext: ctx, viewport };

                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        const renderTask = page.render(renderContext);
                        await renderTask.promise;
                        // Convert the canvas to an image buffer.
                        const imageData = canvas.toDataURL("image/jpeg");
                        console.log(`Finished converting page index ${index} of PDF file to a jpeg image.`);
                        if (canvas.width > canvas.height) {
                            isAnyPageLandscape = true;
                        }
                        outputImages.push({ image: imageData, width: canvas.width, height: canvas.height });
                        canvas.remove();
                    }

                    console.log("isAnyPageLandscape: ", isAnyPageLandscape);

                    const pageSize = {
                        width: (isAnyPageLandscape) ? 891 : 591,
                        height: "auto"
                    };

                    const imagesDict = [];
                    outputImages.forEach((imageData, index) => {
                        if (imageData) {
                            if (index === (outputImages.length - 1)) {
                                imagesDict.push({
                                    image: imageData.image,
                                    width: pageSize.width,
                                });
                            } else {
                                imagesDict.push({
                                    image: imageData.image,
                                    width: pageSize.width,
                                    pageBreak: "after"
                                });
                            }
                        }
                    });

                    const docDefinition = {
                        pageSize,
                        pageMargins: [0, 0, 0, 0],
                        content: [imagesDict]
                    };

                    let dataToReturn = "";
                    let wait = null;
                    const data = pdfMake.createPdf(docDefinition);
                    if (returnUrl) {
                        wait = (pdfMakeData) => new Promise((resolve) => {
                            pdfMakeData.getDataUrl((dataURL) => {
                                dataToReturn = dataURL;
                                resolve();
                            });
                        });
                    } else {
                        wait = (pdfMakeData) => new Promise((resolve) => {
                            pdfMakeData.getBlob((bData) => {
                                dataToReturn = bData;
                                resolve();
                            });
                        });
                    }

                    await wait(data);
                    return dataToReturn;
                } catch (reason) {
                    console.log(reason);
                }

                return null;
            }).catch((err) => {
                console.log("Error fetching the document: ", err);
            });
        }
    }
};
