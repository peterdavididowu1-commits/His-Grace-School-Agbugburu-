// His Grace School - Administration Portal V2 Backend Service JS Module
import firebaseConfig from './firebase-config-env.js';

// Centralized EmailJS Constants
export const EMAILJS_SERVICE_ID = "";
export const EMAILJS_TEMPLATE_ID = "";
export const EMAILJS_PUBLIC_KEY = "";

console.log("EmailJS Service:", EMAILJS_SERVICE_ID);
console.log("EmailJS Template:", EMAILJS_TEMPLATE_ID);

let db = null;
let auth = null;
let sdkAuth = null;
let sdkFirestore = null;

const initPromise = (async () => {
  try {
    const sdkApp = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
    sdkAuth = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    sdkFirestore = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

    const app = sdkApp.initializeApp(firebaseConfig);
    auth = sdkAuth.getAuth(app);
    db = sdkFirestore.getFirestore(app);
    console.log("🌟 [Admin V2] Firebase SDK initialized successfully!");
    return { auth, db, sdkAuth, sdkFirestore };
  } catch (err) {
    console.error("❌ [Admin V2] Firebase SDK failed to initialize:", err);
    throw err;
  }
})();

// Helper to wait for SDK ready
export const getSDK = async () => {
  return await initPromise;
};

// Security check function
export const requireAuthentication = async () => {
  const { auth, sdkAuth } = await getSDK();
  return new Promise((resolve) => {
    sdkAuth.onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.warn("🔐 [Admin V2] Access Denied: Redirecting to login...");
        window.location.replace("admin-v2-login.html");
        resolve(null);
      } else {
        // Double check details if needed
        resolve(user);
      }
    });
  });
};

// Check if user is logged in
export const checkAuthState = async (callback, onUnauth) => {
  const { auth, sdkAuth } = await getSDK();
  sdkAuth.onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(user);
    } else if (onUnauth) {
      onUnauth();
    }
  });
};

// Audit logging
export const writeAuditLog = async (action, details) => {
  try {
    const { db, sdkFirestore, auth } = await getSDK();
    const currentUser = auth.currentUser;
    const operator = currentUser ? currentUser.email : "System / guest";
    
    const logObj = {
      action,
      details,
      operator,
      timestamp: new Date().toISOString()
    };
    
    const colRef = sdkFirestore.collection(db, "system_audit_logs");
    await sdkFirestore.addDoc(colRef, logObj);
    console.log(`📝 [Admin V2 Log] Saved: ${action} - ${details}`);
    return { success: true };
  } catch (err) {
    console.error("❌ [Admin V2 Log] Failed to save audit log:", err);
    return { success: false, error: err };
  }
};

// Authenticate Administrator
export const loginAdministrator = async (email, password) => {
  try {
    const { auth, sdkAuth } = await getSDK();
    
    // Strict requirement: Administrator account email
    const sanitizedEmail = email.trim().toLowerCase();
    if (sanitizedEmail !== "hisgraceschool.name.ng@gmail.com") {
      throw new Error("Unauthorized Access. Email is not registered as an Administration V2 Portal Operator.");
    }

    console.log(`🔑 [Admin V2 Login] Authenticating Firebase Auth...`);
    const authResult = await sdkAuth.signInWithEmailAndPassword(auth, sanitizedEmail, password);
    const user = authResult.user;
    
    await writeAuditLog("Login Event", `Administrator (${sanitizedEmail}) logged in successfully.`);
    return { success: true, user };
  } catch (err) {
    console.error("❌ [Admin V2 Login] Failed validation:", err);
    await writeAuditLog("Login Attempt Failed", `Security alert: Failed login attempt for "${email}". Error: ${err.message}`);
    throw err;
  }
};

// Sign Out
export const logoutAdministrator = async () => {
  try {
    const { auth, sdkAuth } = await getSDK();
    const email = auth.currentUser ? auth.currentUser.email : "Unknown";
    await writeAuditLog("Logout Event", `Administrator (${email}) logged out.`);
    await sdkAuth.signOut(auth);
    window.location.replace("admin-v2-login.html");
    return { success: true };
  } catch (err) {
    console.error("❌ [Admin V2 Logout] Error signing out:", err);
    window.location.replace("admin-v2-login.html");
    throw err;
  }
};

// Email Setup configuration loader
export const getEmailConfig = async () => {
  // 1. Try reading individual localStorage keys
  let valService = localStorage.getItem("emailjs_service_id");
  let valTemplate = localStorage.getItem("emailjs_template_id");
  let valPublic = localStorage.getItem("emailjs_public_key");

  // 2. Try fallback to hgs_email_settings object
  if (!valService || !valTemplate || !valPublic) {
    try {
      const saved = localStorage.getItem("hgs_email_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!valService && parsed.emailjsServiceId) valService = parsed.emailjsServiceId;
        if (!valTemplate && parsed.emailjsTemplateId) valTemplate = parsed.emailjsTemplateId;
        if (!valPublic && parsed.emailjsPublicKey) valPublic = parsed.emailjsPublicKey;
      }
    } catch (e) {
      console.warn("Parsing hgs_email_settings failed", e);
    }
  }

  // 3. Try fallback to remote firebase config
  if (!valService || !valTemplate || !valPublic) {
    try {
      const { db, sdkFirestore } = await getSDK();
      const docRef = sdkFirestore.doc(db, "hgs_systems_config", "email_settings");
      const snap = await sdkFirestore.getDoc(docRef);
      if (snap.exists()) {
        const firestoreData = snap.data();
        if (!valService && firestoreData.emailjsServiceId) valService = firestoreData.emailjsServiceId;
        if (!valTemplate && firestoreData.emailjsTemplateId) valTemplate = firestoreData.emailjsTemplateId;
        if (!valPublic && firestoreData.emailjsPublicKey) valPublic = firestoreData.emailjsPublicKey;
      }
    } catch (e) {
      console.warn("Failed to fetch remote Firestore email_settings:", e.message);
    }
  }

  // 4. Fallback to hardcoded constants
  const serviceId = valService || EMAILJS_SERVICE_ID || "";
  const templateId = valTemplate || EMAILJS_TEMPLATE_ID || "";
  const publicKey = valPublic || EMAILJS_PUBLIC_KEY || "";

  // Output current loaded config in console for verification
  console.log("=== Active EmailJS Engine Configuration ===");
  console.log("Loaded EmailJS Service ID:", serviceId || "N/A (Not configured)");
  console.log("Loaded EmailJS Template ID:", templateId || "N/A (Not configured)");
  console.log("Loaded EmailJS Public Key:", publicKey || "N/A (Not configured)");

  return {
    emailjsServiceId: serviceId,
    emailjsTemplateId: templateId,
    emailjsPublicKey: publicKey
  };
};

// Dispatch Email Notification (Approval, Rejection, Custom)
export const sendEmailNotification = async (recipientEmail, subject, payload, studentName = "Pupil") => {
  try {
    if (!recipientEmail || recipientEmail.trim() === "") {
      throw new Error("Recipient email cannot be blank.");
    }
    
    const config = await getEmailConfig();
    
    const isConfigInvalid = !config.emailjsServiceId || 
                             !config.emailjsTemplateId || 
                             !config.emailjsPublicKey ||
                             config.emailjsServiceId.trim() === "" ||
                             config.emailjsTemplateId.trim() === "" ||
                             config.emailjsPublicKey.trim() === "" ||
                             config.emailjsServiceId.includes("xxxxxx") ||
                             config.emailjsTemplateId.includes("xxxxxx") ||
                             config.emailjsPublicKey.includes("your_public_key");

    if (isConfigInvalid) {
      throw new Error("EmailJS is not configured. Please enter Service ID, Template ID, and Public Key in Email Configuration.");
    }

    // Resolve variables
    let studentNameVal = studentName || "Pupil";
    let admissionNo = "";
    let userVal = "";
    let passVal = "";
    let linkVal = "https://peterdavididowu1-commits.github.io/His-Grace-School-Agbugburu-/student-portal-v2.html";
    let schoolWebVal = "https://peterdavididowu1-commits.github.io/His-Grace-School-Agbugburu-/";

    let finalBodyText = "";
    let isCustom = false;

    if (payload && typeof payload === "object") {
      studentNameVal = payload.student_name || payload.studentName || studentNameVal;
      admissionNo = payload.admission_number || payload.admissionNumber || "";
      userVal = payload.student_username || payload.username || "";
      passVal = payload.student_password || payload.password || "";
      linkVal = payload.portal_link || payload.portalUrl || payload.portal_url || linkVal;
      if (payload.school_website) {
        schoolWebVal = payload.school_website;
      }
      if (payload.custom_message) {
        finalBodyText = payload.custom_message;
        isCustom = true;
      }
    } else if (typeof payload === "string") {
      studentNameVal = studentName || "Pupil";
      const matchAdm = payload.match(/Admission Number:\s*([^\n\r]+)/i);
      if (matchAdm) admissionNo = matchAdm[1].trim();
      const matchPass = payload.match(/Password:\s*([^\n\r]+)/i) || payload.match(/Secure Entry Password:\s*([^\n\r]+)/i);
      if (matchPass) passVal = matchPass[1].trim();
      userVal = admissionNo;
      
      if (!admissionNo) {
        finalBodyText = payload;
        isCustom = true;
        admissionNo = "N/A";
        userVal = "N/A";
        passVal = "N/A";
      }
    }

    if (!isCustom) {
      // 8. Before sending the email, validate that:
      // - admission_number exists
      // - student_username exists
      // - student_password exists
      // - portal_link exists
      // If any value is missing, stop the email process and display an error.
      if (!admissionNo || admissionNo.trim() === "") {
        throw new Error("EmailJS dispatch aborted: Required 'admission_number' value is missing or blank.");
      }
      if (!userVal || userVal.trim() === "") {
        throw new Error("EmailJS dispatch aborted: Required 'student_username' value is missing or blank.");
      }
      if (!passVal || passVal.trim() === "") {
        throw new Error("EmailJS dispatch aborted: Required 'student_password' value is missing or blank.");
      }
      if (!linkVal || linkVal.trim() === "") {
        throw new Error("EmailJS dispatch aborted: Required 'portal_link' value is missing or blank.");
      }

      finalBodyText = `Dear ${studentNameVal},

Congratulations.

Your application to His Grace School has been approved.

Admission Number:
${admissionNo}

Username:
${userVal}

Password:
${passVal}

Student Portal:
${linkVal}

School Website:
${schoolWebVal}

Please keep these credentials safe and use them to access your student portal.

Regards,

His Grace School Registry`;
    }

    const payloadBody = {
      service_id: config.emailjsServiceId,
      template_id: config.emailjsTemplateId,
      user_id: config.emailjsPublicKey,
      template_params: {
        subject: subject,
        recipient_email: recipientEmail.trim(),
        to_email: recipientEmail.trim(),
        email: recipientEmail.trim(),
        guardianEmail: recipientEmail.trim(),
        
        // Exact requested variables
        student_name: studentNameVal,
        admission_number: admissionNo,
        student_username: userVal,
        student_password: passVal,
        portal_link: linkVal,
        
        // Legacy templates backup compatibility
        username: userVal,
        password: passVal,
        admissionNumber: admissionNo,
        studentName: studentNameVal,
        portal_url: linkVal,

        message: finalBodyText,
        date_time: new Date().toLocaleString()
      }
    };

    // 9. Log the complete EmailJS payload to the browser console before sending for debugging purposes
    console.log("=== EMAILJS DISPATCH INITIATION LOG (ADMIN V2) ===");
    console.log(`- Recipient Email: ${recipientEmail.trim()}`);
    console.log("- Full Payload Parameters:", JSON.stringify(payloadBody, null, 2));
    console.log("================================================");

    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadBody)
    });

    const resText = await response.text();
    console.log("=== EMAILJS DISPATCH RESPONSE LOG (ADMIN V2) ===");
    console.log(`- HTTP Response Status: ${response.status}`);
    console.log(`- EmailJS Response Body: "${resText}"`);
    console.log("==============================================");

    if (!response.ok) {
      throw new Error(`EmailJS failed: ${resText} (HTTP: ${response.status})`);
    }

    await writeAuditLog("Email Dispatched", `Notification sent to "${recipientEmail}" (Subj: ${subject}) in relation to pupil "${studentNameVal}".`);
    return { success: true };
  } catch (err) {
    console.error("❌ [Admin V2 Email] Failed sending email:", err);
    await writeAuditLog("Email Send Failed", `Failed to deliver email to "${recipientEmail}". Error: ${err.message}`);
    throw err;
  }
};

// Get Dashboard Data (Total counters, Recent arrays)
export const getDashboardStats = async () => {
  try {
    const { db, sdkFirestore, auth } = await getSDK();
    
    // Verify auth.currentUser is not null
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log(`[getDashboardStats] Current user UID: ${currentUser.uid}`);
      console.log(`[getDashboardStats] Current user Email: ${currentUser.email}`);
    } else {
      console.error("❌ [getDashboardStats] Auth checks Failed: Current user is NULL.");
    }
    
    // 1. Fetch Admissions
    const admissionsCol = sdkFirestore.collection(db, "hgs_admissions");
    const admSnap = await sdkFirestore.getDocs(admissionsCol);
    const admissions = [];
    admSnap.forEach(d => {
      const rawData = d.data();
      admissions.push({
        ...rawData,
        docId: d.id,
        uid: d.id,
        id: d.id
      });
    });

    // 2. Fetch Messages
    const messagesCol = sdkFirestore.collection(db, "hgs_messages");
    const msgSnap = await sdkFirestore.getDocs(messagesCol);
    const messages = [];
    msgSnap.forEach(d => messages.push({ id: d.id, ...d.data() }));

    // Calculations
    const totalAdmissions = admissions.length;
    const totalApproved = admissions.filter(a => a.status === "Approved").length;
    const totalPending = admissions.filter(a => a.status === "Pending" || !a.status).length;
    const totalContactMessages = messages.length;

    // Sorting recents
    const recentAdmissions = [...admissions]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);

    const recentMessages = [...messages]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);

    return {
      stats: {
        totalAdmissions,
        totalApproved,
        totalPending,
        totalContactMessages
      },
      recentAdmissions,
      recentMessages
    };
  } catch (err) {
    console.error("❌ [Admin V2 Stats] Failed:", err);
    throw err;
  }
};

// Admissions Module API
export const getAdmissions = async () => {
  const { db, sdkFirestore, auth } = await getSDK();
  
  // Verify auth.currentUser is not null
  const currentUser = auth.currentUser;
  if (currentUser) {
    console.log(`[getAdmissions] Current user UID: ${currentUser.uid}`);
    console.log(`[getAdmissions] Current user Email: ${currentUser.email}`);
  } else {
    console.error("❌ [getAdmissions] Auth checks Failed: Current user is NULL.");
  }
  
  const colRef = sdkFirestore.collection(db, "hgs_admissions");
  const snap = await sdkFirestore.getDocs(colRef);
  const data = [];
  snap.forEach(d => {
    const rawData = d.data();
    data.push({
      ...rawData,
      docId: d.id,
      uid: d.id,
      id: d.id
    });
  });
  console.log(`Admissions Loaded: ${data.length}`);
  return data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

// Internal resolve helper to find admission document robustly
const getAdmissionDoc = async (db, sdkFirestore, admissionId) => {
  console.log(`[getAdmissionDoc] Resolving admission ID:`, admissionId);
  const path = "hgs_admissions";

  // Try 1: Try as direct Firestore Document ID
  const docRef = sdkFirestore.doc(db, path, admissionId);
  try {
    const snap = await sdkFirestore.getDoc(docRef);
    if (snap.exists()) {
      console.log(`[getAdmissionDoc] Resolved successfully via direct Firestore Document ID.`);
      return { docRef, snap, admission: snap.data(), id: snap.id };
    }
  } catch (e) {
    console.warn(`[getAdmissionDoc] Direct Document ID lookup failed/errored:`, e.message);
  }

  // Try 2: Query collection for custom "id" property inside the document
  const colRef = sdkFirestore.collection(db, path);
  try {
    const q1 = sdkFirestore.query(colRef, sdkFirestore.where("id", "==", admissionId));
    const qSnap1 = await sdkFirestore.getDocs(q1);
    if (!qSnap1.empty) {
      const d = qSnap1.docs[0];
      const resolvedDocRef = sdkFirestore.doc(db, path, d.id);
      console.log(`[getAdmissionDoc] Resolved successfully by matching "id" field inside document payload.`);
      return { docRef: resolvedDocRef, snap: d, admission: d.data(), id: d.id };
    }
  } catch (e) {
    console.warn(`[getAdmissionDoc] Custom 'id' match query failed/errored:`, e.message);
  }

  // Try 3: Query collection for custom "uid" property inside the document
  try {
    const q2 = sdkFirestore.query(colRef, sdkFirestore.where("uid", "==", admissionId));
    const qSnap2 = await sdkFirestore.getDocs(q2);
    if (!qSnap2.empty) {
      const d = qSnap2.docs[0];
      const resolvedDocRef = sdkFirestore.doc(db, path, d.id);
      console.log(`[getAdmissionDoc] Resolved successfully by matching "uid" field inside document payload.`);
      return { docRef: resolvedDocRef, snap: d, admission: d.data(), id: d.id };
    }
  } catch (e) {
    console.warn(`[getAdmissionDoc] Custom 'uid' match query failed/errored:`, e.message);
  }

  return null;
};

// Approve Admission Function
export const approveAdmission = async (admissionId, applicantEmail) => {
  try {
    const { db, sdkFirestore } = await getSDK();
    
    let admission = null;
    let resolvedDocId = "";
    let docRef = null;

    console.log(`[approveAdmission] Initializing Approve Admission Workflow.`);
    console.log(`- Requested Parameter:`, admissionId);

    if (typeof admissionId === "object" && admissionId !== null) {
      // 6 & 7: Use the loaded admission object directly (do not re-query Firestore)
      admission = admissionId;
      resolvedDocId = admission.docId || admission.uid || admission.id;
      docRef = sdkFirestore.doc(db, "hgs_admissions", resolvedDocId);
      
      console.log(`[approveAdmission] OPTIMIZATION: Passed loaded admission memory object directly. Firestore re-query bypassed.`);
    } else {
      // Standard resolution
      const docInfo = await getAdmissionDoc(db, sdkFirestore, admissionId);
      if (!docInfo) {
        const errorDetail = `[approveAdmission] Admission Record Not Found in Collection path 'hgs_admissions'. Requested Document ID: '${admissionId}'`;
        console.error(errorDetail);
        throw new Error(errorDetail);
      }
      admission = docInfo.admission;
      resolvedDocId = docInfo.id;
      docRef = docInfo.docRef;
    }

    // 2. Log: Firestore document ID, admission.id, admission.uid, and document path being queried
    console.log(`[approveAdmission] Execution Chain Details:`);
    console.log(`- Firestore document ID:`, resolvedDocId);
    console.log(`- admission.id field:`, admission.id || "N/A");
    console.log(`- admission.uid field:`, admission.uid || "N/A");
    console.log(`- document path being queried:`, `hgs_admissions/${resolvedDocId}`);

    // Extract Student details safely
    const fullName = admission.studentName || admission.fullName || "Unspecified Pupil";
    const classVal = admission.gradeApplying || admission.classRequested || admission.class || "Primary 1";
    const parentName = admission.parentName || admission.guardianName || "Unspecified Parent";
    const parentPhone = admission.parentPhone || admission.guardianPhone || "N/A";
    const resolvedEmail = (applicantEmail || admission.guardianEmail || admission.parentEmail || admission.email || "").trim();

    // Onboarding Student Workflow - Query both students collections
    console.log(`[approveAdmission] Running Workflow sub-task: onboardStudent / createStudentRecord`);
    const studentsCol = sdkFirestore.collection(db, "students");
    const studSnap = await sdkFirestore.getDocs(studentsCol);
    const studentsList = [];
    studSnap.forEach(s => studentsList.push(s.data()));

    // Generate credentials
    let uniqueNum = "";
    let isUnique = false;
    let attempts = 0;
    const count = studentsList.length + 1;
    while (!isUnique && attempts < 100) {
      const idxStr = String(count + attempts).padStart(4, '0');
      uniqueNum = `HGS2026-${idxStr}`;
      isUnique = !studentsList.some(s => s.admissionNumber === uniqueNum);
      attempts++;
    }

    const tempPassword = `Temp${Math.floor(10000 + Math.random() * 90000)}`;
    const portalUrl = "https://peterdavididowu1-commits.github.io/His-Grace-School-Agbugburu-/student-portal-v2.html";
    const webUrl = "https://peterdavididowu1-commits.github.io/His-Grace-School-Agbugburu-/";

    // 1 & 2. Save values into the student's Firestore admission record before sending the email.
    const admissionUpdateData = {
      status: "Approved",
      admissionNumber: uniqueNum,
      username: uniqueNum,
      password: tempPassword,
      studentName: fullName,
      portalLink: portalUrl
    };

    console.log(`[approveAdmission] Saving approved credentials to hgs_admissions:`, admissionUpdateData);
    await sdkFirestore.updateDoc(docRef, admissionUpdateData);
    console.log(`[approveAdmission] hgs_admissions status and credentials successfully saved.`);

    // Fields: Full Name, Class, Admission Number, Parent Details, Contact Details
    const studentPayload = {
      fullName: fullName,
      studentName: fullName, // backup for older layouts
      class: classVal,
      gradeApplying: classVal, // backup for older layouts
      admissionNumber: uniqueNum,
      username: uniqueNum,
      parentDetails: {
        parentName: parentName,
        parentPhone: parentPhone
      },
      parentName: parentName, // backup for older layouts
      parentPhone: parentPhone, // backup for older layouts
      contactDetails: {
        guardianEmail: resolvedEmail,
        guardianPhone: parentPhone
      },
      parentEmail: resolvedEmail, // backup
      guardianEmail: resolvedEmail, // backup
      email: resolvedEmail,
      portalLink: portalUrl,
      password: tempPassword,
      status: "Active",
      createdAt: new Date().toISOString(),
      gender: admission.studentGender || "Male",
      dob: admission.studentDob || "",
      homeAddress: admission.homeAddress || "",
      grades: {
        english: 85,
        math: 85,
        computer: 85,
        civic: 85,
        agriculture: 85
      },
      coachRemarks: `Account automatically formulated and approved on ${new Date().toLocaleDateString()}.`
    };

    // Save student profile to both collections for complete portal access safety
    await sdkFirestore.addDoc(studentsCol, studentPayload);
    await sdkFirestore.addDoc(sdkFirestore.collection(db, "hgs_students"), studentPayload);
    await writeAuditLog("Student Onboarding", `Profile initialized and added to databases for "${fullName}" (Adm No: ${uniqueNum}).`);

    // Send email notification
    if (resolvedEmail) {
      const subject = "Congratulations! Your Admission Has Been Approved";
      
      const emailPayloadObj = {
        student_name: fullName,
        admission_number: uniqueNum,
        student_username: uniqueNum,
        student_password: tempPassword,
        portal_link: portalUrl,
        school_website: webUrl
      };

      await sendEmailNotification(resolvedEmail, subject, emailPayloadObj, fullName);
    }

    await writeAuditLog("Admission Approved", `Approved enrolment request for candidate "${fullName}". Status changed to 'Approved'.`);
    return { success: true, uniqueNum };
  } catch (err) {
    console.error("❌ [Admin V2 Approve] Error:", err);
    throw err;
  }
};

// Reject Admission Function
export const rejectAdmission = async (admissionId, reason = "Credentials did not meet entry requirements.") => {
  try {
    const { db, sdkFirestore } = await getSDK();
    
    let admission = null;
    let resolvedDocId = "";
    let docRef = null;

    if (typeof admissionId === "object" && admissionId !== null) {
      admission = admissionId;
      resolvedDocId = admission.docId || admission.uid || admission.id;
      docRef = sdkFirestore.doc(db, "hgs_admissions", resolvedDocId);
    } else {
      const docInfo = await getAdmissionDoc(db, sdkFirestore, admissionId);
      if (!docInfo) {
        const errorDetail = `[rejectAdmission] Admission Record Not Found in Collection path 'hgs_admissions'. Requested Document ID: '${admissionId}'`;
        console.error(errorDetail);
        throw new Error(errorDetail);
      }
      admission = docInfo.admission;
      resolvedDocId = docInfo.id;
      docRef = docInfo.docRef;
    }

    const fullName = admission.studentName || admission.fullName || "Pupil";
    const resolvedEmail = (admission.guardianEmail || admission.parentEmail || admission.email || "").trim();

    // Update status to Rejected
    await sdkFirestore.updateDoc(docRef, { status: "Rejected" });

    // Send Rejection email
    if (resolvedEmail) {
      const subject = `Admission Status Update - ${fullName}`;
      const emailText = `We appreciate your application. Unfortunately, admission was not approved.\n\nFeedback:\n"${reason}"\n\nIf you have any questions, you can contact the registrar.\n\nWarm Regards,\nHis Grace School Office`;
      
      await sendEmailNotification(resolvedEmail, subject, emailText, fullName);
    }

    await writeAuditLog("Admission Rejected", `Enrollment request for pupil "${fullName}" rejected. Reason: ${reason}`);
    return { success: true };
  } catch (err) {
    console.error("❌ [Admin V2 Reject] Error:", err);
    throw err;
  }
};

// Set Admission Status to Pending
export const markAdmissionAsPending = async (admissionId) => {
  try {
    const { db, sdkFirestore } = await getSDK();
    
    let admission = null;
    let resolvedDocId = "";
    let docRef = null;

    if (typeof admissionId === "object" && admissionId !== null) {
      admission = admissionId;
      resolvedDocId = admission.docId || admission.uid || admission.id;
      docRef = sdkFirestore.doc(db, "hgs_admissions", resolvedDocId);
    } else {
      const docInfo = await getAdmissionDoc(db, sdkFirestore, admissionId);
      if (!docInfo) {
        const errorDetail = `[markAdmissionAsPending] Admission Record Not Found in Collection path 'hgs_admissions'. Requested Document ID: '${admissionId}'`;
        console.error(errorDetail);
        throw new Error(errorDetail);
      }
      admission = docInfo.admission;
      resolvedDocId = docInfo.id;
      docRef = docInfo.docRef;
    }

    const fullName = admission.studentName || admission.fullName || "Pupil";

    await sdkFirestore.updateDoc(docRef, { status: "Pending" });
    await writeAuditLog("Admission Pending Status", `Admission request for "${fullName}" set to Pending.`);
    return { success: true };
  } catch (err) {
    console.error("❌ [Admin V2 Pending] Error:", err);
    throw err;
  }
};

// Students Module API
export const getStudents = async () => {
  const { db, sdkFirestore } = await getSDK();
  const colRef = sdkFirestore.collection(db, "students");
  const snap = await sdkFirestore.getDocs(colRef);
  const data = [];
  snap.forEach(d => data.push({ id: d.id, ...d.data() }));
  return data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

// Messages Module API
export const getMessages = async () => {
  const { db, sdkFirestore } = await getSDK();
  const colRef = sdkFirestore.collection(db, "hgs_messages");
  const snap = await sdkFirestore.getDocs(colRef);
  const data = [];
  snap.forEach(d => data.push({ id: d.id, ...d.data() }));
  return data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

// Resolve Message
export const markMessageAsResolved = async (messageId) => {
  try {
    const { db, sdkFirestore } = await getSDK();
    const docRef = sdkFirestore.doc(db, "hgs_messages", messageId);
    const snap = await sdkFirestore.getDoc(docRef);
    if (!snap.exists()) {
      throw new Error("Message not found.");
    }
    const msg = snap.data();
    await sdkFirestore.updateDoc(docRef, { status: "Resolved", resolvedAt: new Date().toISOString() });
    
    await writeAuditLog("Message Resolved", `Contact inquiry from "${msg.fullName || msg.name || 'Anonymous'}" marked as 'Resolved'.`);
    return { success: true };
  } catch (err) {
    console.error("❌ [Admin V2 Resolve Msg] Error:", err);
    throw err;
  }
};

// Delete Message
export const deleteMessage = async (messageId) => {
  try {
    const { db, sdkFirestore } = await getSDK();
    const docRef = sdkFirestore.doc(db, "hgs_messages", messageId);
    const snap = await sdkFirestore.getDoc(docRef);
    if (!snap.exists()) {
      throw new Error("Message not found.");
    }
    const msg = snap.data();
    await sdkFirestore.deleteDoc(docRef);
    
    await writeAuditLog("Message Erased", `Contact message from "${msg.fullName || msg.name || 'Anonymous'}" was permanently deleted.`);
    return { success: true };
  } catch (err) {
    console.error("❌ [Admin V2 Delete Msg] Error:", err);
    throw err;
  }
};

// Reply to Message by Email
export const replyByEmail = async (messageId, replyText, recipientEmail, senderSubject = "Response from His Grace School") => {
  try {
    const { db, sdkFirestore } = await getSDK();
    const docRef = sdkFirestore.doc(db, "hgs_messages", messageId);
    const snap = await sdkFirestore.getDoc(docRef);
    if (!snap.exists()) {
      throw new Error("Message not found.");
    }
    const msg = snap.data();
    const senderName = msg.fullName || msg.name || "Enquirer";

    await sendEmailNotification(recipientEmail, senderSubject, replyText, senderName);
    await sdkFirestore.updateDoc(docRef, { status: "Replied", replyText, repliedAt: new Date().toISOString() });
    
    await writeAuditLog("Contact Message Replied", `Dispatched response email to "${recipientEmail}" answering their messages.`);
    return { success: true };
  } catch (err) {
    console.error("❌ [Admin V2 Reply] Error:", err);
    throw err;
  }
};

// Save Email Setup configuration
export const saveEmailConfig = async (serviceId, templateId, publicKey) => {
  try {
    // 1. Save to local storage individual keys
    localStorage.setItem("emailjs_service_id", serviceId);
    localStorage.setItem("emailjs_template_id", templateId);
    localStorage.setItem("emailjs_public_key", publicKey);

    // 2. Save inside hgs_email_settings object to maintain compatibility with legacy dashboard
    const legacyConfig = {
      provider: "EmailJS",
      fromEmail: "admissions@hisgracehighschool.org",
      emailjsServiceId: serviceId,
      emailjsTemplateId: templateId,
      emailjsPublicKey: publicKey,
      apiKey: ""
    };
    localStorage.setItem("hgs_email_settings", JSON.stringify(legacyConfig));

    // 3. Update in firebase database
    const { db, sdkFirestore } = await getSDK();
    const docRef = sdkFirestore.doc(db, "hgs_systems_config", "email_settings");
    await sdkFirestore.setDoc(docRef, {
      emailjsServiceId: serviceId,
      emailjsTemplateId: templateId,
      emailjsPublicKey: publicKey,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 4. Log to audit trails
    await writeAuditLog("Email Configuration Updated V2", `Administrator updated active EmailJS credentials via V2 Security Setup.`);
    return { success: true };
  } catch (err) {
    console.error("❌ [saveEmailConfig] Error saving configuration:", err);
    throw err;
  }
};

// Audit logs fetching
export const getAuditLogs = async () => {
  const { db, sdkFirestore } = await getSDK();
  const colRef = sdkFirestore.collection(db, "system_audit_logs");
  const snap = await sdkFirestore.getDocs(colRef);
  const data = [];
  snap.forEach(d => data.push({ id: d.id, ...d.data() }));
  return data.sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0));
};

// Academic student promotion system
export const promoteStudent = async (studentId, newClass) => {
  try {
    const { db, sdkFirestore } = await getSDK();
    
    // 1. Update in students collection
    const studentRef = sdkFirestore.doc(db, "students", studentId);
    await sdkFirestore.updateDoc(studentRef, {
      class: newClass,
      updatedAt: new Date().toISOString()
    });

    // 2. Read and synchronize in other student profile collections
    const studentSnap = await sdkFirestore.getDoc(studentRef);
    if (studentSnap.exists()) {
      const sData = studentSnap.data();
      const admDocId = sData.admissionDocId || sData.id || sData.userId;
      if (admDocId) {
        const hgsAdmRef = sdkFirestore.doc(db, "hgs_admissions", admDocId);
        await sdkFirestore.updateDoc(hgsAdmRef, {
          gradeApplying: newClass,
          class: newClass,
          updatedAt: new Date().toISOString()
        });
      }
      
      const hgsStudentsRef = sdkFirestore.doc(db, "hgs_students", studentId);
      await sdkFirestore.setDoc(hgsStudentsRef, {
        class: newClass,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    // 3. Log to audit trails
    await writeAuditLog("Student Promoted V2", `Student account was academically promoted to class Level: ${newClass}`);
    return { success: true };
  } catch (err) {
    console.error("❌ Error promoting student:", err);
    throw err;
  }
};

// Noticeboard publishing
export const publishNotice = async (title, content, targetClass) => {
  try {
    const { db, sdkFirestore } = await getSDK();
    const noticeRef = sdkFirestore.doc(sdkFirestore.collection(db, "hgs_notices"));
    const payload = {
      title,
      content,
      targetClass: targetClass || "ALL",
      author: "School Registry Office",
      createdAt: new Date().toISOString()
    };
    await sdkFirestore.setDoc(noticeRef, payload);
    
    // Log audit trail
    await writeAuditLog("Announcements Bulletins Board Updated V2", `Operator published class Announcement: "${title}" target: ${targetClass}`);
    return { success: true, id: noticeRef.id };
  } catch (err) {
    console.error("❌ [publishNotice] Error publishing bulletin:", err);
    throw err;
  }
};

// Export to Global window namespace to be readily accessible in simple HTML files
window.AdminV2 = {
  getSDK,
  requireAuthentication,
  checkAuthState,
  loginAdministrator,
  logoutAdministrator,
  getDashboardStats,
  getAdmissions,
  approveAdmission,
  rejectAdmission,
  markAdmissionAsPending,
  getStudents,
  getMessages,
  markMessageAsResolved,
  deleteMessage,
  replyByEmail,
  sendEmailNotification,
  getEmailConfig,
  saveEmailConfig,
  getAuditLogs,
  writeAuditLog,
  promoteStudent,
  publishNotice
};
