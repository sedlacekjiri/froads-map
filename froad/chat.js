// ======================================================
//  CHAT.JS – Skupinový chat + obrázky + verified / ranger
// ======================================================

let currentGroup = "general";
let unsubscribeMessages = null;
let userData = null;

// === DOM ELEMENTS ===
const chatList = document.getElementById("chatList");
const chatContainer = document.getElementById("chatContainer");
const chatGroups = document.getElementById("chatGroups");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const imageUploadInput = document.getElementById("imageUploadInput");
const uploadLabel = document.getElementById("uploadLabel");
const backToGroups = document.getElementById("backToGroups");
const chatHeader = document.getElementById("chatHeader");

// === FORMAT TIME ===
function formatTime(date) {
  if (!date) return "";
  const d = date.toDate ? date.toDate() : date;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// === LOAD USER DATA ===
async function loadUserData(uid) {
  const doc = await db.collection("users").doc(uid).get();
  return doc.exists ? doc.data() : {};
}

// === SWITCH GROUP ===
function switchGroup(group) {
  currentGroup = group;

  // UI přepínání
  chatGroups.style.display = "none";
  chatContainer.style.display = "flex";
  chatHeader.querySelector("h3").textContent =
    group.charAt(0).toUpperCase() + group.slice(1);

  // Odpojit předchozí posluchač
  if (unsubscribeMessages) unsubscribeMessages();

  // Poslouchat nové zprávy
  unsubscribeMessages = db
    .collection(`messages_${currentGroup}`)
    .orderBy("createdAt", "asc")
    .onSnapshot(snapshot => {
      chatMessages.innerHTML = "";
      snapshot.forEach(doc => renderMessage(doc.data()));
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

// === RENDER MESSAGE ===
function renderMessage(msg) {
  const bubble = document.createElement("div");
  bubble.className =
    msg.uid === auth.currentUser.uid
      ? "chat-bubble my-message"
      : "chat-bubble";

  const timeText = formatTime(msg.createdAt);
  const content = msg.imageUrl
    ? `<img src="${msg.imageUrl}" alt="Image" class="chat-image" />`
    : `<p>${msg.text}</p>`;

  bubble.innerHTML = `
    <div class="meta">
      ${msg.displayName || "Unknown"}
      ${msg.verified ? '<img src="https://cdn.prod.website-files.com/687ebffd20183c0459d68784/68ec104bbf6183f2f84c71b7_verified.png" class="verified-icon" />' : ""}
      ${msg.ranger ? '<img src="https://cdn.prod.website-files.com/687ebffd20183c0459d68784/68fba159091b4ac6d4781634_ranger%20(1).png" class="ranger-icon" />' : ""}
      ${msg.ranger ? '<span class="role-label">Ranger</span>' : msg.verified ? '<span class="role-label verified">Verified</span>' : ""}
      <span class="msg-time">${timeText}</span>
    </div>
    ${content}
  `;

  // Obrázek klik = fullscreen modal
  const imgEl = bubble.querySelector(".chat-image");
  if (imgEl) {
    imgEl.addEventListener("click", () => openImageModal(imgEl.src));
  }

  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// === IMAGE MODAL ===
const imageModal = document.getElementById("imageModal");
const imageModalImg = document.getElementById("imageModalImg");
const closeImageModal = document.getElementById("closeImageModal");

function openImageModal(src) {
  imageModalImg.src = src;
  imageModal.classList.add("open");
}
if (closeImageModal) {
  closeImageModal.addEventListener("click", () =>
    imageModal.classList.remove("open")
  );
}

// === SEND MESSAGE ===
if (chatForm) {
  chatForm.addEventListener("submit", async e => {
    e.preventDefault();
    const txt = messageInput.value.trim();
    const file = imageUploadInput.files[0];

    if (!txt && !file) return;

    try {
      // Načti user data
      const userDoc = await db.collection("users").doc(auth.currentUser.uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      let imageUrl = "";
      if (file) {
        const storageRef = storage.ref(
          `chat_images/${currentGroup}/${Date.now()}_${file.name}`
        );
        await storageRef.put(file);
        imageUrl = await storageRef.getDownloadURL();
      }

      await db.collection(`messages_${currentGroup}`).add({
        text: txt || "",
        imageUrl: imageUrl || "",
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || "User",
        photoURL: auth.currentUser.photoURL || "",
        verified: userData.verified || false,
        ranger: userData.ranger || false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      messageInput.value = "";
      imageUploadInput.value = "";
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  });
}

// === UPLOAD PREVIEW ICON ===
if (uploadLabel && imageUploadInput) {
  imageUploadInput.addEventListener("change", e => {
    if (e.target.files.length > 0) {
      uploadLabel.classList.add("selected");
    } else {
      uploadLabel.classList.remove("selected");
    }
  });
}

// === BACK TO GROUPS ===
if (backToGroups) {
  backToGroups.addEventListener("click", () => {
    chatContainer.style.display = "none";
    chatGroups.style.display = "flex";
    if (unsubscribeMessages) unsubscribeMessages();
  });
}

// === GROUP BUTTONS ===
document.querySelectorAll(".chat-group").forEach(btn => {
  btn.addEventListener("click", () => {
    const group = btn.dataset.group;
    if (group) switchGroup(group);
  });
});

// === INIT CHAT ===
window.addEventListener("load", () => {
  if (auth.currentUser) {
    loadUserData(auth.currentUser.uid).then(data => (userData = data));
  }
});
