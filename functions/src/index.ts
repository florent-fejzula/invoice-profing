import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';

admin.initializeApp();

// Optional: choose region close to you
setGlobalOptions({ region: 'europe-west1' });

const ADMIN_UID = 'nArNHAOwWNR7dgMO39ILvWRPfni1';

type CreateCompanyInput = {
  ownerEmail: string;
  tempPassword: string;
  company: {
    name: string;
    EDB?: string;
    address?: string;
    bank?: string;
    accountNo?: string;
    phone?: string;
    ownerName?: string;
    logoUrl?: string;
    // add more fields later as needed
  };
};

export const createCompanyWithOwner = onCall(async (req) => {
  // --- Security: only you can call this ---
  if (!req.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Login required.');
  }
  if (req.auth.uid !== ADMIN_UID) {
    throw new HttpsError('permission-denied', 'Not allowed.');
  }

  const data = req.data as CreateCompanyInput;

  // --- Validate input (minimal) ---
  if (!data?.ownerEmail || !data.ownerEmail.includes('@')) {
    throw new HttpsError('invalid-argument', 'ownerEmail is required.');
  }
  if (!data?.tempPassword || data.tempPassword.length < 6) {
    throw new HttpsError(
      'invalid-argument',
      'tempPassword must be at least 6 chars.'
    );
  }
  if (!data?.company?.name || !data.company.name.trim()) {
    throw new HttpsError('invalid-argument', 'company.name is required.');
  }

  const ownerEmail = data.ownerEmail.trim().toLowerCase();
  const tempPassword = data.tempPassword;
  const companyPayload = data.company;

  // --- Create or fetch Auth user ---
  let ownerUid: string;

  try {
    const u = await admin.auth().createUser({
      email: ownerEmail,
      password: tempPassword,
    });
    ownerUid = u.uid;
  } catch (e: any) {
    // If user already exists, reuse it
    if (e?.code === 'auth/email-already-exists') {
      const existing = await admin.auth().getUserByEmail(ownerEmail);
      ownerUid = existing.uid;
      // optionally update password to the temp one (your call)
      await admin.auth().updateUser(ownerUid, { password: tempPassword });
    } else {
      throw new HttpsError('internal', e?.message || 'Failed to create user.');
    }
  }

  // --- Create company doc ---
  const companyRef = admin.firestore().collection('companies').doc();

  await companyRef.set({
    ...companyPayload,
    name: companyPayload.name.trim(),
    email: ownerEmail, // keep if you want
    ownerUid, // ✅ tenant ownership
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    settings: {
      showTaxCategories: true, // keep your defaults here
    },
  });

  // --- Create user profile doc ---
  await admin.firestore().collection('users').doc(ownerUid).set(
    {
      email: ownerEmail,
      defaultCompanyId: companyRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // --- Create password reset link (nice-to-have)
  const resetLink = await admin.auth().generatePasswordResetLink(ownerEmail);

  return {
    companyId: companyRef.id,
    ownerUid,
    resetLink,
  };
});

export const listCompaniesForAdmin = onCall(async (req) => {
  if (!req.auth?.uid)
    throw new HttpsError('unauthenticated', 'Login required.');
  if (req.auth.uid !== ADMIN_UID)
    throw new HttpsError('permission-denied', 'Not allowed.');

  const snap = await admin.firestore().collection('companies').get();

  const companies = snap.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
    }))
    .sort((a: any, b: any) => {
      const aTime = a.createdAt?.seconds ?? 0;
      const bTime = b.createdAt?.seconds ?? 0;
      return bTime - aTime;
    });

  return { companies };
});

export const toggleCompanyStatusAdmin = onCall(async (req) => {
  if (!req.auth?.uid)
    throw new HttpsError('unauthenticated', 'Login required.');
  if (req.auth.uid !== ADMIN_UID)
    throw new HttpsError('permission-denied', 'Not allowed.');

  const { companyId } = req.data as { companyId: string };
  if (!companyId)
    throw new HttpsError('invalid-argument', 'companyId required.');

  const ref = admin.firestore().collection('companies').doc(companyId);
  const doc = await ref.get();
  if (!doc.exists) throw new HttpsError('not-found', 'Company not found.');

  const current = (doc.data()?.status ?? 'active') as 'active' | 'inactive';
  const next = current === 'active' ? 'inactive' : 'active';

  await ref.update({ status: next });

  return { status: next };
});