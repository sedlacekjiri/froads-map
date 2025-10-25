// === AUTH.JS ===

// DOM ELEMENTS
const loginScreen = document.getElementById("loginScreen");
const logoutBtn = document.getElementById("logoutBtn");
const profileIcon = document.getElementById("profileIcon");
const profileEditor = document.getElementById("profileEditor");
const currentAvatar = document.getElementById("currentAvatar");
const avatarInput = document.getElementById("avatarInput");
const displayNameInput = document.getElementById("displayNameInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const vehiclePhotoInput = document.getElementById("vehiclePhoto");
const vehiclePhotoPreview = document.getElementById("vehiclePhotoPreview");
const bioInput = document.getElementById("bioInput");
const instagramInput = document.getElementById("instagramInput");
const vehicleSelect = document.getElementById("vehicleSelect");

// === AVATAR PREVIEW ===
if (avatarInput) {
  avatarInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Profile photo is too large. Please upload a file under 2 MB.");
      avatarInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => (currentAvatar.src = ev.target.result);
    reader.readAsDataURL(file);
  });
}

// === VEHICLE PHOTO PREVIEW ===
if (vehiclePhotoInput) {
  vehiclePhotoInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Vehicle photo is too large. Please upload a file under 2 MB.");
      vehiclePhotoInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      vehiclePhotoPreview.src = ev.target.result;
      vehiclePhotoPreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
}

// === TOGGLE LOGIN/SIGNUP ===
const emailForm = document.getElementById("emailLoginForm");
const signupForm = document.getElementById("signupForm");
const toSignup = document.getElementById("toSignup");
const toLogin = document.getElementById("toLogin");
const authTitle = document.getElementById("authTitle");
const loginError = document.getElementById("loginError");

if (toSignup && toLogin) {
  toSignup.querySelector("a").addEventListener("click", e => {
    e.preventDefault();
    emailForm.style.display = "none";
    signupForm.style.display = "flex";
    toSignup.style.display = "none";
    toLogin.style.display = "block";
    authTitle.textContent = "Sign Up";
  });

  toLogin.querySelector("a").addEventListener("click", e => {
    e.preventDefault();
    emailForm.style.display = "flex";
    signupForm.style.display = "none";
    toSignup.style.display = "block";
    toLogin.style.display = "none";
    authTitle.textContent = "Log In";
  });
}

// === LOGIN ===
if (emailForm) {
  emailForm.addEventListener("submit", async e => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    try {
      await auth.signInWithEmailAndPassword(email, password);
      loginError.textContent = "";
    } catch (err) {
      console.error("Login error:", err);
      loginError.textContent = "Incorrect email or password. Try again.";
    }
  });
}

// === FORGOT PASSWORD ===
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", async e => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) {
      loginError.textContent = "Please enter your email first.";
      return;
    }

    try {
      await auth.sendPasswordResetEmail(email);
      loginError.style.color = "green";
      loginError.textContent = "Password reset link has been sent to your email.";
    } catch (err) {
      console.error("Password reset error:", err);
      loginError.style.color = "red";
      loginError.textContent = "Couldn't send reset link. Please check your email.";
    }
  });
}

// === SIGNUP ===
if (signupForm) {
  signupForm.addEventListener("submit", async e => {
    e.preventDefault();
    const fullName = document.getElementById("signupFullName").value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value.trim();

    if (!fullName) {
      loginError.textContent = "Please enter your full name.";
      return;
    }

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      const user = cred.user;
      await user.updateProfile({ displayName: fullName });

      await db.collection("users").doc(user.uid).set({
        displayName: fullName,
        email: email,
        photoURL: "",
        bio: "",
        instagram: "",
        vehicle: "",
        vehiclePhotoURL: "",
        verified: false,
        ranger: false,
        access: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      showAccessDeniedModal();
      await auth.signOut();
    } catch (err) {
      console.error("Signup error:", err);
      loginError.textContent = "Looks like you already have an account! Try logging in.";
    }
  });
}

// === LOGOUT ===
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    profileEditor.style.display = "none";
    loginScreen.style.display = "flex";
    auth.signOut();
  });
}

// === PROFILE ICON TOGGLE ===
if (profileIcon) {
  profileIcon.addEventListener("click", () => {
    profileEditor.style.display =
      profileEditor.style.display === "flex" ? "none" : "flex";
  });
}
