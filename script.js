const fileInput = document.getElementById("fileInput");
const pagesContainer = document.getElementById("pagesContainer");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");
const loading = document.getElementById("loading");

let pdfDoc = null;
let excludedPages = [];
let fileName = "";

fileInput.addEventListener("change", async (e) => {
  try {
    const file = e.target.files[0];

    if (!file) return;

    if (file.type !== 'application/pdf') {
    alert('Por favor, selecione um arquivo PDF válido.');
    fileInput.value = ''; // limpa o input
    return;
  }
  
    fileName = file.name.replace(/\.[^/.]+$/, "");

    pagesContainer.innerHTML = "";
    excludedPages = [];
    loading.style.display = "flex";
    pagesContainer.style.display = "none";
    downloadBtn.disabled = true;

    const fileReader = new FileReader();
    fileReader.onload = async () => {
      const typedarray = new Uint8Array(fileReader.result);

      pdfDoc = await window.pdfjsLib.getDocument({ data: typedarray }).promise;

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.6 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        const div = document.createElement("div");
        div.className = "col-md-4 page-item";
        div.appendChild(canvas);
        div.title = `Clique para excluir a página ${i}`;
        div.dataset.pageNumber = i;

        div.addEventListener("click", () => {
          div.classList.toggle("selected");
          const pageNum = parseInt(div.dataset.pageNumber);
          if (excludedPages.includes(pageNum)) {
            excludedPages = excludedPages.filter((p) => p !== pageNum);
          } else {
            excludedPages.push(pageNum);
          }
        });

        pagesContainer.appendChild(div);
      }

      downloadBtn.disabled = false;
      loading.style.display = "none";
      pagesContainer.style.display = "flex";
    };
    fileReader.readAsArrayBuffer(file);
  } catch (error) {
    alert("Erro ao carregar o PDF: " + error.message);
    loading.style.display = "none";
    pagesContainer.style.display = "flex";
  }
});

downloadBtn.addEventListener("click", async () => {
  if (!pdfDoc) return;

  const originalData = await pdfDoc.getData();
  const originalPdf = await PDFLib.PDFDocument.load(originalData);
  const newPdf = await PDFLib.PDFDocument.create();

  const total = originalPdf.getPageCount();
  const pagesToKeep = [];

  for (let i = 0; i < total; i++) {
    const pageNumber = i + 1;
    if (!excludedPages.includes(pageNumber)) {
      pagesToKeep.push(i);
    }
  }

  const copiedPages = await newPdf.copyPages(originalPdf, pagesToKeep);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const newPdfBytes = await newPdf.save();

  const blob = new Blob([newPdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = (fileName ?? "") + "_sem_paginas.pdf";
  link.click();
});

clearBtn.addEventListener("click", () => {
  fileInput.value = "";
  pagesContainer.innerHTML = "";
  downloadBtn.disabled = true;
  excludedPages = [];
  pdfDoc = null;
});
