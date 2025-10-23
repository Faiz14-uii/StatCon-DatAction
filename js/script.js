// PDF.js Configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// Variables
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.5;
const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");
const loading = document.getElementById("loading");

// PDF Path - GANTI DENGAN NAMA FILE PDF ANDA
const pdfPath = "Buku DatAction.pdf";

// Touch/Swipe Variables
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initPDF();
  initControls();
  initTheme();
  initTouchGestures();
  adjustScaleForMobile();
});

// Load PDF
async function initPDF() {
  try {
    loading.classList.remove("hidden");
    pdfDoc = await pdfjsLib.getDocument(pdfPath).promise;
    renderPage(pageNum);
  } catch (error) {
    console.error("Error loading PDF:", error);
    loading.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444;"></i>
            <p style="color: #ef4444; font-weight: 600;">Gagal memuat PDF</p>
            <p style="font-size: 0.9rem;">Pastikan file "Buku DatAction.pdf" ada di folder yang sama dengan index.html</p>
        `;
  }
}

// Render Page
function renderPage(num) {
  pageRendering = true;
  loading.classList.remove("hidden");

  pdfDoc.getPage(num).then((page) => {
    const viewport = page.getViewport({ scale: scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    const renderTask = page.render(renderContext);
    renderTask.promise.then(() => {
      pageRendering = false;
      loading.classList.add("hidden");

      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });
}

// Queue render
function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

// Controls - Simplified for keyboard and swipe only
function initControls() {
  // Keyboard Navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" && pageNum > 1) {
      pageNum--;
      queueRenderPage(pageNum);
    } else if (e.key === "ArrowRight" && pageNum < pdfDoc.numPages) {
      pageNum++;
      queueRenderPage(pageNum);
    }
  });
}

// Theme Toggle
function initTheme() {
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("theme") || "light";

  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector("#themeToggle i");
  icon.className = theme === "light" ? "fas fa-moon" : "fas fa-sun";
}

// Mobile Optimizations
function adjustScaleForMobile() {
  if (window.innerWidth <= 768) {
    scale = 1.2;
  }
}

// Touch Gestures for Mobile
function initTouchGestures() {
  const pdfViewer = document.getElementById("pdfViewer");

  pdfViewer.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: true }
  );

  pdfViewer.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    },
    { passive: true }
  );
}

function handleSwipe() {
  const swipeThreshold = 50;
  const diffX = touchStartX - touchEndX;
  const diffY = Math.abs(touchStartY - touchEndY);

  // Hanya proses swipe horizontal jika tidak terlalu vertikal
  if (diffY < swipeThreshold) {
    // Swipe Left (Next Page)
    if (diffX > swipeThreshold && pageNum < pdfDoc.numPages) {
      pageNum++;
      queueRenderPage(pageNum);
    }
    // Swipe Right (Previous Page)
    else if (diffX < -swipeThreshold && pageNum > 1) {
      pageNum--;
      queueRenderPage(pageNum);
    }
  }
}

// Adjust scale on window resize
window.addEventListener("resize", () => {
  adjustScaleForMobile();
  if (pdfDoc) {
    queueRenderPage(pageNum);
  }
});
