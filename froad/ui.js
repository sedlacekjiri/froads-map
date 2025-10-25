// ======================================================
//  UI.JS – Obsluha uživatelského rozhraní
// ======================================================

// === LOADER HANDLING ===
window.showLoader = () => {
  const loader = document.getElementById("page-loader");
  if (loader) loader.style.display = "flex";
};

window.hideLoader = () => {
  const loader = document.getElementById("page-loader");
  if (loader) loader.style.display = "none";
};

// === SECTION SWITCHING (Explore / People / Chat) ===
document.querySelectorAll(".bottom-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.target;
    if (!target) return;

    // hide all sections
    document.querySelectorAll(".app-section").forEach(sec => {
      sec.style.display = "none";
    });

    // show target section
    const activeSection = document.getElementById(target);
    if (activeSection) {
      activeSection.style.display = "block";
    }

    // active tab styling
    document.querySelectorAll(".bottom-tab").forEach(t => {
      t.classList.remove("active");
    });
    tab.classList.add("active");
  });
});

// === PROFILE MODAL OPEN/CLOSE ===
const profileIcon = document.getElementById("profileIcon");
const profileEditor = document.getElementById("profileEditor");
if (profileIcon && profileEditor) {
  profileIcon.addEventListener("click", () => {
    profileEditor.style.display =
      profileEditor.style.display === "flex" ? "none" : "flex";
  });
}

// === CLOSE MODAL WHEN CLICKING OUTSIDE ===
document.addEventListener("click", e => {
  if (
    profileEditor &&
    profileEditor.style.display === "flex" &&
    !profileEditor.contains(e.target) &&
    !profileIcon.contains(e.target)
  ) {
    profileEditor.style.display = "none";
  }
});

// === ACCESS MODAL (např. Access Denied při registraci) ===
window.showAccessDeniedModal = () => {
  const modal = document.getElementById("accessDeniedModal");
  if (modal) modal.classList.add("open");
};

window.closeAccessModal = () => {
  const modal = document.getElementById("accessDeniedModal");
  if (modal) modal.classList.remove("open");
};

// === GLOBAL PANEL HANDLER (např. Explore side panel) ===
const sidePanel = document.getElementById("sidePanel");
const closePanelBtn = document.getElementById("closePanel");

if (closePanelBtn && sidePanel) {
  closePanelBtn.addEventListener("click", () => {
    sidePanel.classList.remove("open");
    if (window.crossingLayer) window.crossingLayer.clearLayers();
    if (window.selectedLayer && window.resetPolylineStyle)
      window.resetPolylineStyle(window.selectedLayer);
  });
}

// === BACKDROP CLICK TO CLOSE PANEL ===
document.addEventListener("click", e => {
  if (!sidePanel || !sidePanel.classList.contains("open")) return;
  const isInsidePanel = sidePanel.contains(e.target);
  const isCloseButton = e.target.closest("#closePanel");
  if (!isInsidePanel && !isCloseButton) {
    sidePanel.classList.remove("open");
    if (window.crossingLayer) window.crossingLayer.clearLayers();
    if (window.selectedLayer && window.resetPolylineStyle)
      window.resetPolylineStyle(window.selectedLayer);
  }
});

// === GLOBAL INIT (page load) ===
window.addEventListener("load", () => {
  hideLoader();
  document.querySelectorAll(".app-section").forEach((sec, i) => {
    sec.style.display = i === 0 ? "block" : "none";
  });
  const tabs = document.querySelectorAll(".bottom-tab");
  if (tabs.length) tabs[0].classList.add("active");
});
