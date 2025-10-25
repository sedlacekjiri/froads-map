// ======================================================
//  MAP.JS – People mapa (Live Locations + user info panel)
// ======================================================

let peopleMap;
let peopleMarkers = {};
let liveWatchId = null;
let isSatellitePeople = false;
let osmLayerPeople, satelliteLayerPeople;

// === INIT MAP ===
window.initPeopleMap = () => {
  if (peopleMap) return;

  peopleMap = L.map("peopleMap").setView([64.1466, -21.9426], 6);

  osmLayerPeople = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
  }).addTo(peopleMap);

  satelliteLayerPeople = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics",
      maxZoom: 19
    }
  );

  setupPeopleLiveLocations();
  setupPeopleButtons();
};

// === SETUP LIVE LOCATIONS ===
function setupPeopleLiveLocations() {
  if (!db || !auth) return;

  db.collection("liveLocations").onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      const uid = change.doc.id;
      const data = change.doc.data();
      const isCurrentUser = auth.currentUser && uid === auth.currentUser.uid;

      // Odstranění markeru při offline
      if ((change.type === "modified" && data.isLive === false) || change.type === "removed") {
        if (peopleMarkers[uid]) {
          peopleMap.removeLayer(peopleMarkers[uid]);
          delete peopleMarkers[uid];
        }
        return;
      }

      // Přidání / update markeru
      if (change.type === "added" || change.type === "modified") {
        const { lat, lng, displayName, verified, ranger, photoURL } = data;
        if (!lat || !lng) return;

        const icon = L.divIcon({
          html: `<div class="people-marker ${isCurrentUser ? "me" : ""}">
              <img src="${photoURL || "https://www.gravatar.com/avatar?d=mp"}" alt="User" />
            </div>`,
          iconSize: [50, 50],
          className: ""
        });

        if (peopleMarkers[uid]) peopleMap.removeLayer(peopleMarkers[uid]);

        const marker = L.marker([lat, lng], { icon }).addTo(peopleMap);
        peopleMarkers[uid] = marker;

        // === Popup panel ===
        marker.on("click", () => openUserDetailPanel(uid, data));
      }
    });
  });
}

// === USER DETAIL PANEL ===
async function openUserDetailPanel(uid, data) {
  const panel = document.getElementById("userDetailPanel");
  const content = document.getElementById("userDetailContent");

  if (!panel || !content) return;
  panel.classList.add("open");

  const userDoc = await db.collection("users").doc(uid).get();
  const user = userDoc.exists ? userDoc.data() : data;

  content.innerHTML = `
    <div class="panel-header">
      <img class="popup-avatar" src="${user.photoURL || "https://www.gravatar.com/avatar?d=mp"}" alt="Avatar">
      <div class="panel-userinfo">
        <div class="panel-name-row">
          <strong>${user.displayName || "Unknown"}</strong>
          ${user.verified ? '<img class="verified-icon" src="https://cdn.prod.website-files.com/687ebffd20183c0459d68784/68ec104bbf6183f2f84c71b7_verified.png" />' : ""}
          ${user.ranger ? '<img class="ranger-icon" src="https://cdn.prod.website-files.com/687ebffd20183c0459d68784/68fba159091b4ac6d4781634_ranger%20(1).png" />' : ""}
          ${user.ranger ? '<span class="role-label">Ranger</span>' : user.verified ? '<span class="role-label verified">Verified</span>' : ""}
        </div>
        ${user.instagram ? `<div class="popup-instagram"><a href="https://instagram.com/${user.instagram.replace('@','')}" target="_blank">@${user.instagram.replace('@','')}</a></div>` : ""}
      </div>
    </div>
    ${user.vehiclePhotoURL ? `<div class="panel-image"><img src="${user.vehiclePhotoURL}" alt="Vehicle"></div>` : ""}
    ${user.bio ? `<div class="panel-bio"><p>${user.bio}</p></div>` : ""}
  `;
}

// === BUTTONS (LIVE + SATELLITE) ===
function setupPeopleButtons() {
  const liveBtn = document.getElementById("peopleLiveBtn");
  const satelliteBtn = document.getElementById("peopleSatelliteBtn");

  // Live Sharing
  if (liveBtn) {
    liveBtn.addEventListener("click", async () => {
      if (!navigator.geolocation) {
        alert("Geolocation not supported.");
        return;
      }

      if (liveWatchId) {
        navigator.geolocation.clearWatch(liveWatchId);
        liveWatchId = null;
        await db.collection("liveLocations").doc(auth.currentUser.uid).set(
          { isLive: false },
          { merge: true }
        );
        liveBtn.innerHTML = `<img src="https://cdn.prod.website-files.com/687ebffd20183c0459d68784/68ed62ac5fa9fb8e0fe1bf96_live.png" class="live-icon" /> Share Location`;
        return;
      }

      liveWatchId = navigator.geolocation.watchPosition(
        async pos => {
          const { latitude, longitude } = pos.coords;
          const userDoc = await db.collection("users").doc(auth.currentUser.uid).get();
          const user = userDoc.exists ? userDoc.data() : {};
          await db.collection("liveLocations").doc(auth.currentUser.uid).set(
            {
              uid: auth.currentUser.uid,
              displayName: auth.currentUser.displayName,
              photoURL: auth.currentUser.photoURL,
              verified: user.verified || false,
              ranger: user.ranger || false,
              lat: latitude,
              lng: longitude,
              isLive: true,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            },
            { merge: true }
          );
        },
        err => console.error("Geo error:", err),
        { enableHighAccuracy: true }
      );

      liveBtn.innerHTML = "⛔ Stop Sharing";
    });
  }

  // Satellite Toggle
  if (satelliteBtn) {
    satelliteBtn.addEventListener("click", () => {
      if (!peopleMap) return;
      if (!isSatellitePeople) {
        peopleMap.removeLayer(osmLayerPeople);
        peopleMap.addLayer(satelliteLayerPeople);
        isSatellitePeople = true;
      } else {
        peopleMap.removeLayer(satelliteLayerPeople);
        peopleMap.addLayer(osmLayerPeople);
        isSatellitePeople = false;
      }
    });
  }
}

// === INIT ON LOAD ===
window.addEventListener("load", () => {
  const mapEl = document.getElementById("peopleMap");
  if (mapEl) initPeopleMap();
});
