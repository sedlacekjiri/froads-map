// ======================================================
//  MAP.JS – Leaflet mapa + Live Locations
// ======================================================

let map, osmLayer, satelliteLayer, isSatellite = false;
let liveMarkers = {};
let liveWatchId = null;

// === INIT MAP ===
window.initMap = () => {
  if (map) return;

  map = L.map("map").setView([64.1466, -21.9426], 6);

  // 🗺️ Standardní OpenStreetMap
  osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  // 🛰️ Satelitní Esri
  satelliteLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics",
      maxZoom: 19,
    }
  );
};

// === SATELLITE TOGGLE ===
const customActionBtn = document.getElementById("customActionBtn");
if (customActionBtn) {
  customActionBtn.addEventListener("click", () => {
    if (!map) return;
    if (!isSatellite) {
      map.removeLayer(osmLayer);
      map.addLayer(satelliteLayer);
      isSatellite = true;
    } else {
      map.removeLayer(satelliteLayer);
      map.addLayer(osmLayer);
      isSatellite = false;
    }

    // Animace ikonky
    const icon = document.getElementById("customActionIcon");
    icon.style.transition = "transform 0.4s ease";
    icon.style.transform = "rotate(360deg)";
    setTimeout(() => (icon.style.transform = "rotate(0deg)"), 400);
  });
}

// === POSITION VISIBILITY / CUSTOM BTN ===
function positionCustomActionBtn() {
  const visBtn = document.getElementById("visibilityBtn");
  const customBtn = document.getElementById("customActionBtn");
  if (!visBtn || !customBtn) return;

  const visHeight = visBtn.offsetHeight;
  const offset = 10;
  const visBottom = parseFloat(window.getComputedStyle(visBtn).bottom);
  const newBottom = visBottom - visHeight - offset;

  customBtn.style.position = "fixed";
  customBtn.style.right = "20px";
  customBtn.style.bottom = `${newBottom}px`;
}
window.addEventListener("load", positionCustomActionBtn);
window.addEventListener("resize", positionCustomActionBtn);

// === LIVE LOCATIONS ===
window.setupLiveLocations = () => {
  if (!db || !map) return;

  db.collection("liveLocations").onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      const uid = change.doc.id;
      const data = change.doc.data();
      const isCurrentUser = auth.currentUser && auth.currentUser.uid === uid;

      // Odstranění markeru
      if ((change.type === "modified" && data.isLive === false) || change.type === "removed") {
        if (liveMarkers[uid]) {
          map.removeLayer(liveMarkers[uid]);
          delete liveMarkers[uid];
        }
        return;
      }

      // Přidání / update markeru
      if (change.type === "added" || change.type === "modified") {
        const { lat, lng, photoURL, displayName, verified, ranger } = data;
        if (!lat || !lng) return;

        // Vytvoření markeru
        const icon = L.divIcon({
          html: `<div class="user-marker ${
            isCurrentUser ? "live-outline" : ""
          }"><img src="${photoURL || "https://www.gravatar.com/avatar?d=mp"}"/></div>`,
          iconSize: [52, 52],
          className: "",
        });

        if (liveMarkers[uid]) map.removeLayer(liveMarkers[uid]);
        liveMarkers[uid] = L.marker([lat, lng], { icon }).addTo(map);

        // Popup
        const popupHtml = `
          <div class="popup-header">
            <img class="popup-avatar" src="${photoURL || "https://www.gravatar.com/avatar?d=mp"}" alt="avatar" />
            <div>
              <strong>${displayName || "Traveler"}</strong>
              ${verified ? '<img class="verified-icon" src="https://cdn.prod.website-files.com/687ebffd20183c0459d68784/68f77b6a011a1d02b3bb3e28_verified.png"/>' : ""}
              ${ranger ? '<span class="badge ranger-badge">Ranger</span>' : ""}
            </div>
          </div>
        `;

        liveMarkers[uid].bindPopup(popupHtml, { className: "custom-popup" });
      }
    });
  });
};

// === GO LIVE ===
window.setupGoLiveButton = () => {
  const shareBtn = document.getElementById("shareLocationBtn");
  const visibilityBtn = document.getElementById("visibilityBtn");
  const iconEl = document.getElementById("visibilityIcon");

  if (!shareBtn || !auth.currentUser) return;

  shareBtn.style.display = "flex";
  visibilityBtn.style.display = "flex";

  shareBtn.addEventListener("click", () => {
    if (liveWatchId) {
      navigator.geolocation.clearWatch(liveWatchId);
      liveWatchId = null;
      db.collection("liveLocations").doc(auth.currentUser.uid).update({
        isLive: false,
      });
      shareBtn.innerHTML = `<img src="https://cdn.prod.website-files.com/687ebffd20183c0459d68784/68ed62ac5fa9fb8e0fe1bf96_live.png" class="live-icon" /> Share Location`;
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    liveWatchId = navigator.geolocation.watchPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        await db.collection("liveLocations").doc(auth.currentUser.uid).set(
          {
            uid: auth.currentUser.uid,
            displayName: auth.currentUser.displayName,
            photoURL: auth.currentUser.photoURL,
            lat: latitude,
            lng: longitude,
            isLive: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      },
      err => console.error("Geolocation error:", err),
      { enableHighAccuracy: true }
    );

    shareBtn.innerHTML = "⛔ Stop Sharing";
  });

  // === VISIBILITY TOGGLE ===
  visibilityBtn.addEventListener("click", async () => {
    try {
      const docRef = db.collection("liveLocations").doc(auth.currentUser.uid);
      const doc = await docRef.get();
      const hidden = doc.exists ? !doc.data().hidden : true;
      await docRef.set({ hidden }, { merge: true });

      iconEl.src = hidden
        ? "https://cdn.prod.website-files.com/687ebffd20183c0459d68784/68f6a54af63bb9cb97f07730_visibility.png"
        : "https://cdn.prod.website-files.com/687ebffd20183c0459d68784/68f6a54a2914de7af9a65d54_blind.png";
    } catch (err) {
      console.error("❌ Visibility toggle error:", err);
    }
  });
};
