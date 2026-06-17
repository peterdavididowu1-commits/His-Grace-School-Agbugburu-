// Firebase & Local Storage Unified Core Service Module
import firebaseConfig from './firebase-config-env.js';

// Detect if Live Firebase config has been entered
const isFirebaseConfigured = 
  firebaseConfig && 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== '' && 
  !firebaseConfig.apiKey.includes('YOUR_API_KEY_HERE');

let liveMode = false;
let db = null;
let auth = null;

// Firebase SDK reference placeholders
let sdkApps, sdkAuth, sdkFirestore;

// Safe Dynamic Imports
try {
  if (isFirebaseConfigured) {
    // Top-level imports for ES Modules
    sdkApps = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
    sdkAuth = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    sdkFirestore = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

    const app = sdkApps.initializeApp(firebaseConfig);
    db = sdkFirestore.getFirestore(app);
    auth = sdkAuth.getAuth(app);
    liveMode = true;
    console.log("🌟 His Grace Core: Live Firebase Web Services Online!");
  } else {
    console.warn("⚠️ His Grace Core: Missing / Placeholder Firebase configurations. Operating in high-fidelity Local Demo Mode.");
  }
} catch (error) {
  console.error("❌ His Grace Core: Failed to initialize live Firebase SDK. Falling back to Local Demo Mode.", error);
  liveMode = false;
}

// Ensure database state in local storage
const initLocalStorageDB = () => {
  if (!localStorage.getItem('hgs_admissions')) {
    localStorage.setItem('hgs_admissions', JSON.stringify([]));
  }
  if (!localStorage.getItem('hgs_messages')) {
    localStorage.setItem('hgs_messages', JSON.stringify([]));
  }
  if (!localStorage.getItem('hgs_administrators')) {
    // Create first default admin profile in local storage if not exists
    localStorage.setItem('hgs_administrators', JSON.stringify([]));
  }
  // Simulated Current Session
  if (!localStorage.getItem('hgs_session')) {
    localStorage.setItem('hgs_session', null);
  }
};
initLocalStorageDB();

// ==========================================
// UNIFIED MODE EXPORTS
// ==========================================
export const isLiveFirebase = () => liveMode;

// Display Banner to User
export const injectNotificationBanner = () => {
  const currentBanner = document.getElementById('demo-mode-header-banner');
  if (currentBanner) return;

  const header = document.querySelector('header');
  if (!header) return;

  const banner = document.createElement('div');
  banner.id = 'demo-mode-header-banner';
  banner.style.cssText = `
    background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
    color: #1e293b;
    text-align: center;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    font-weight: 700;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
    position: relative;
    z-index: 1000;
    border-bottom: 2px solid rgba(0,0,0,0.1);
  `;

  if (liveMode) {
    banner.style.background = 'linear-gradient(90deg, #15803d 0%, #16a34a 100%)';
    banner.style.color = '#ffffff';
    banner.innerHTML = `
      <span><i class="fa-solid fa-cloud-bolt"></i> Live Mode: Connected to Firebase Firestore and Authentication.</span>
    `;
  } else {
    banner.innerHTML = `
      <span><i class="fa-solid fa-triangle-exclamation"></i> Demo Mode: Storing data locally. Edit <strong>assets/js/firebase-config-env.js</strong> to connect to your Firebase project.</span>
      <button onclick="this.parentElement.remove()" style="background:none; border:none; color:inherit; font-size:1.1rem; cursor:pointer;" aria-label="Close message">&times;</button>
    `;
  }
  header.parentNode.insertBefore(banner, header);
};

// ==========================================
// ADMISSIONS MANAGEMENT
// ==========================================
export const saveAdmission = async (admissionData) => {
  const record = {
    ...admissionData,
    id: 'ADM-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    createdAt: new Date().toISOString()
  };

  if (liveMode && db) {
    try {
      const colRef = sdkFirestore.collection(db, "hgs_admissions");
      await sdkFirestore.addDoc(colRef, record);
      return { success: true, id: record.id };
    } catch (err) {
      console.error("Firestore saveAdmission failed:", err);
      throw err;
    }
  } else {
    // Local storage fallback
    const list = JSON.parse(localStorage.getItem('hgs_admissions') || '[]');
    list.push(record);
    localStorage.setItem('hgs_admissions', JSON.stringify(list));
    return { success: true, id: record.id };
  }
};

export const getAdmissions = async () => {
  if (liveMode && db) {
    try {
      const colRef = sdkFirestore.collection(db, "hgs_admissions");
      const q = sdkFirestore.query(colRef, sdkFirestore.orderBy("createdAt", "desc"));
      const snapshot = await sdkFirestore.getDocs(q);
      const results = [];
      snapshot.forEach(docSnap => {
        results.push({ ...docSnap.data(), docId: docSnap.id });
      });
      return results;
    } catch (err) {
      console.error("Firestore getAdmissions failed:", err);
      // fallback to offline reading on failure
    }
  }
  // Local storage fallback
  const list = JSON.parse(localStorage.getItem('hgs_admissions') || '[]');
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const updateAdmission = async (id, updatedFields) => {
  if (liveMode && db) {
    try {
      const colRef = sdkFirestore.collection(db, "hgs_admissions");
      const q = sdkFirestore.query(colRef, sdkFirestore.where("id", "==", id));
      const snapshot = await sdkFirestore.getDocs(q);
      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        const docRef = sdkFirestore.doc(db, "hgs_admissions", docId);
        await sdkFirestore.updateDoc(docRef, updatedFields);
        return { success: true };
      }
    } catch (err) {
      console.error("Firestore updateAdmission failed:", err);
      throw err;
    }
  }

  // Local storage fallback
  const list = JSON.parse(localStorage.getItem('hgs_admissions') || '[]');
  const idx = list.findIndex(item => item.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updatedFields };
    localStorage.setItem('hgs_admissions', JSON.stringify(list));
    return { success: true };
  }
  throw new Error("Admission record not found");
};

export const deleteAdmission = async (id) => {
  if (liveMode && db) {
    try {
      const colRef = sdkFirestore.collection(db, "hgs_admissions");
      const q = sdkFirestore.query(colRef, sdkFirestore.where("id", "==", id));
      const snapshot = await sdkFirestore.getDocs(q);
      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        const docRef = sdkFirestore.doc(db, "hgs_admissions", docId);
        await sdkFirestore.deleteDoc(docRef);
        return { success: true };
      }
    } catch (err) {
      console.error("Firestore deleteAdmission failed:", err);
      throw err;
    }
  }

  // Local Storage fallback
  const list = JSON.parse(localStorage.getItem('hgs_admissions') || '[]');
  const filtered = list.filter(item => item.id !== id);
  localStorage.setItem('hgs_admissions', JSON.stringify(filtered));
  return { success: true };
};

// ==========================================
// CONTACT MESSAGES MANAGEMENT
// ==========================================
export const saveContactMessage = async (messageData) => {
  const record = {
    ...messageData,
    id: 'MSG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    createdAt: new Date().toISOString()
  };

  if (liveMode && db) {
    try {
      const colRef = sdkFirestore.collection(db, "hgs_messages");
      await sdkFirestore.addDoc(colRef, record);
      return { success: true, id: record.id };
    } catch (err) {
      console.error("Firestore saveContactMessage failed:", err);
      throw err;
    }
  } else {
    const list = JSON.parse(localStorage.getItem('hgs_messages') || '[]');
    list.push(record);
    localStorage.setItem('hgs_messages', JSON.stringify(list));
    return { success: true, id: record.id };
  }
};

export const getContactMessages = async () => {
  if (liveMode && db) {
    try {
      const colRef = sdkFirestore.collection(db, "hgs_messages");
      const q = sdkFirestore.query(colRef, sdkFirestore.orderBy("createdAt", "desc"));
      const snapshot = await sdkFirestore.getDocs(q);
      const results = [];
      snapshot.forEach(docSnap => {
        results.push({ ...docSnap.data(), docId: docSnap.id });
      });
      return results;
    } catch (err) {
      console.error("Firestore getContactMessages failed:", err);
    }
  }
  const list = JSON.parse(localStorage.getItem('hgs_messages') || '[]');
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// ==========================================
// ADMINISTRATOR AUTHENTICATION & MANAGEMENT
// ==========================================

// Check if any admin exists in the entire database (for dynamic First Setup page)
export const checkAdminsExist = async () => {
  if (liveMode && db) {
    try {
      const colRef = sdkFirestore.collection(db, "hgs_administrators");
      const snapshot = await sdkFirestore.getDocs(colRef);
      return !snapshot.empty;
    } catch (err) {
      console.error("Firestore checkAdminsExist failed:", err);
    }
  }
  // Local storage fallback
  const list = JSON.parse(localStorage.getItem('hgs_administrators') || '[]');
  return list.length > 0;
};

// Create a new administrator account (Auth and Firestore list mapping)
export const createAdministrator = async (email, password, fullName) => {
  const profile = {
    fullName: fullName,
    email: email.toLowerCase().trim(),
    role: "Administrator",
    createdAt: new Date().toISOString()
  };

  if (liveMode && auth && db) {
    try {
      // Create user inside Firebase Authentication
      const result = await sdkAuth.createUserWithEmailAndPassword(auth, email, password);
      const uid = result.user.uid;
      
      // Save metadata securely using Firestore (mapping uid to doc reference)
      const docRef = sdkFirestore.doc(db, "hgs_administrators", uid);
      await sdkFirestore.setDoc(docRef, { ...profile, uid });
      return { success: true, uid };
    } catch (err) {
      console.error("Firebase createAdministrator failed:", err);
      throw err;
    }
  } else {
    // Local storage fallback
    const list = JSON.parse(localStorage.getItem('hgs_administrators') || '[]');
    
    // Check if email already registered
    const exists = list.some(admin => admin.email === profile.email);
    if (exists) {
      throw new Error("This administrator email address is already registered.");
    }

    const newAdmin = {
      ...profile,
      uid: 'ADM-ACC-' + Date.now(),
      passwordHash: btoa(password) // simple mock base64 obfuscation for offline storage safety
    };

    list.push(newAdmin);
    localStorage.setItem('hgs_administrators', JSON.stringify(list));
    return { success: true, uid: newAdmin.uid };
  }
};

// Administrator Log-in
export const loginAdministrator = async (email, password) => {
  const sanitizedEmail = email.toLowerCase().trim();

  if (liveMode && auth) {
    try {
      const result = await sdkAuth.signInWithEmailAndPassword(auth, sanitizedEmail, password);
      const uid = result.user.uid;

      // Check if user has admin record in Firestore
      const docRef = sdkFirestore.doc(db, "hgs_administrators", uid);
      const docSnap = await sdkFirestore.getDoc(docRef);
      
      if (docSnap.exists()) {
        const profile = docSnap.data();
        localStorage.setItem('hgs_session', JSON.stringify({ uid, email: sanitizedEmail, fullName: profile.fullName || "Admin" }));
        return { success: true, profile };
      } else {
        // Logged in but no mapping? Create a placeholder metadata instantly
        const profile = { fullName: "Admin Staff", email: sanitizedEmail, role: "Administrator", createdAt: new Date().toISOString(), uid };
        await sdkFirestore.setDoc(docRef, profile);
        localStorage.setItem('hgs_session', JSON.stringify(profile));
        return { success: true, profile };
      }
    } catch (err) {
      console.error("Firestore/Auth loginAdministrator failed:", err);
      throw err;
    }
  } else {
    // Local storage fallback
    const list = JSON.parse(localStorage.getItem('hgs_administrators') || '[]');
    
    // Check credentials matching
    const admin = list.find(item => item.email === sanitizedEmail && item.passwordHash === btoa(password));
    if (admin) {
      const sessionUser = { uid: admin.uid, email: admin.email, fullName: admin.fullName };
      localStorage.setItem('hgs_session', JSON.stringify(sessionUser));
      return { success: true, profile: admin };
    } else {
      // For immediate ease of use in Demo Mode, if there is absolutely NO admin registered yet,
      // allow pastor/owner password bypassing or instruct them to register first.
      if (list.length === 0) {
        throw new Error("No administrators exist yet. Please register the first administrator account first using the Registration system.");
      }
      throw new Error("Invalid administrator access email or secure password.");
    }
  }
};

// Admin Secure Log-out
export const logoutAdministrator = async () => {
  localStorage.setItem('hgs_session', 'null');
  if (liveMode && auth) {
    try {
      await sdkAuth.signOut(auth);
      return { success: true };
    } catch (err) {
      console.error("Firebase signOut failed:", err);
    }
  }
  return { success: true };
};

// Check active login state
export const getActiveAdminSession = () => {
  const session = localStorage.getItem('hgs_session');
  if (session && session !== 'null') {
    try {
      return JSON.parse(session);
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Edit Active Admin Password
export const changeAdministratorPassword = async (newPassword) => {
  const session = getActiveAdminSession();
  if (!session) throw new Error("No authenticated session available");

  if (liveMode && auth) {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await sdkAuth.updatePassword(currentUser, newPassword);
        return { success: true };
      } else {
        throw new Error("Session expired. Please log in again.");
      }
    } catch (err) {
      console.error("Firebase updatePassword failed:", err);
      throw err;
    }
  } else {
    // Local storage fallback
    const list = JSON.parse(localStorage.getItem('hgs_administrators') || '[]');
    const idx = list.findIndex(item => item.uid === session.uid);
    if (idx !== -1) {
      list[idx].passwordHash = btoa(newPassword);
      localStorage.setItem('hgs_administrators', JSON.stringify(list));
      return { success: true };
    }
    throw new Error("Admin session matching record not found in storage.");
  }
};

// Forgot password reset helper
export const resetAdministratorPasswordByEmail = async (email) => {
  if (liveMode && auth) {
    try {
      await sdkAuth.sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      console.error("Firebase sendPasswordResetEmail failed:", err);
      throw err;
    }
  } else {
    // Simulate reset for Demo mode
    const list = JSON.parse(localStorage.getItem('hgs_administrators') || '[]');
    const exists = list.some(item => item.email === email.toLowerCase().trim());
    if (exists) {
      return { success: true, simulated: true };
    } else {
      throw new Error("No administrator account associated with this email address.");
    }
  }
};

// Fetch current statistics
export const getAdministrativeStats = async () => {
  const admissions = await getAdmissions();
  const messages = await getContactMessages();

  // Sort by Class totals
  const classBreakdown = {};
  admissions.forEach(item => {
    const cls = item.gradeApplying || "Unspecified";
    classBreakdown[cls] = (classBreakdown[cls] || 0) + 1;
  });

  return {
    totalAdmissionsCount: admissions.length,
    totalMessagesCount: messages.length,
    recentAdmissions: admissions.slice(0, 5),
    recentMessages: messages.slice(0, 5),
    classBreakdown
  };
};
