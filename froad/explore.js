// ======================================================
//  EXPLORE.JS – Bridge pro Explore sekci (iframe verze)
// ======================================================

const exploreFrame = document.getElementById("exploreFrame");

// === IFRAME SAFE LOADER HANDLING ===
window.addEventListener("load", () => {
  if (!exploreFrame) return;

  // Zobraz loader dokud se Explore nenačte
  showLoader();

  exploreFrame.addEventListener("load", () => {
    hideLoader();
    console.log("✅ Explore iframe loaded.");
  });
});

// === IFRAME COMMUNICATION (READY FOR FUTURE DIRECT LINK) ===
window.addEventListener("message", (event) => {
  // Filtruj jen zprávy z Explore iframe
  if (!exploreFrame || event.source !== exploreFrame.contentWindow) return;
  const data = event.data;

  if (typeof data !== "object") return;

  // ✅ Příjem dat z Explore (např. výběr cesty, klik na marker)
  if (data.type === "explore-select-road") {
    console.log("📍 Explore vybral cestu:", data.road);
    // Můžeme později otevřít detail panel i mimo iframe
  }

  // ✅ Explorer signalizuje, že se načetl
  if (data.type === "explore-ready") {
    hideLoader();
  }
});

// === API PRO BUDOUCÍ PŘECHOD BEZ IFRAME ===
window.ExploreAPI = {
  reload() {
    if (exploreFrame) exploreFrame.contentWindow.location.reload();
  },

  send(data) {
    if (exploreFrame && exploreFrame.contentWindow) {
      exploreFrame.contentWindow.postMessage(data, "*");
    }
  },

  // např. pro budoucí "Open route in Explore"
  openRoad(roadId) {
    this.send({ type: "open-road", id: roadId });
  },
};

// === SYNC TAB ACTIVE ===
document.querySelectorAll(".bottom-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.target;
    if (target === "exploreSection" && exploreFrame) {
      // Scroll iframe na top
      exploreFrame.contentWindow?.scrollTo(0, 0);
    }
  });
});

// === OPTIONAL ERROR HANDLER ===
exploreFrame?.addEventListener("error", () => {
  console.error("❌ Explore iframe failed to load.");
  hideLoader();
  alert("Failed to load Explore map. Please refresh.");
});
