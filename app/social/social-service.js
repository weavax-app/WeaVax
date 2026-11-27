import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function getDb() {
    return window.db;
}

function getCurrentUid() {
    return window.state?.activeUserDocId || window.auth?.currentUser?.uid || null;
}

export function buildPairId(uidA, uidB) {
    return uidA < uidB ? `${uidA}_${uidB}` : `${uidB}_${uidA}`;
}

// 1. Sincronización de Perfil Público (public_profiles/{uid})
export async function syncPublicProfile(overrides = {}) {
    const db = getDb();
    const uid = getCurrentUid();
    if (!db || !uid) return;

    const p = window.state?.profile || {};
    const sessions = (window.state?.workout_sessions || []).filter(s => s.isCompleted);
    const totalVolumeKg = sessions.reduce((acc, s) => acc + Number(s.totalVolumeKg || 0), 0);

    // Calcular mejores levantamientos (PRs) por ejercicio
    const bestLifts = {};
    sessions.forEach(s => {
        (s.sets || []).forEach(st => {
            const w = Number(st.weightKg || 0);
            if (w > 0 && st.exerciseName) {
                if (!bestLifts[st.exerciseName] || w > bestLifts[st.exerciseName]) {
                    bestLifts[st.exerciseName] = w;
                }
            }
        });
    });

    const rawUsername = (overrides.username ?? p.username ?? (p.email ? p.email.split('@')[0] : `user_${uid.slice(0, 5)}`))
        .toLowerCase()
        .replace(/[^a-z0-9_.]/g, '');

    const payload = {
        uid,
        name: overrides.name ?? p.name ?? 'Atleta WeaVax',
        username: rawUsername,
        usernameLower: rawUsername.toLowerCase(),
        avatar: overrides.avatar ?? p.photoUrl ?? '',
        level: Number(p.level || 1),
        xp: Number(p.xp || 0),
        streak: Number(p.streak || 0),
        isPro: Boolean(p.isPro || window.state?.isPro),
        dailyScorePercent: Number(window.state?.dailyScorePercent || 0),
        totalWorkouts: sessions.length,
        totalVolumeKg: Math.round(totalVolumeKg),
        bestLifts,
        showDailyScore: overrides.showDailyScore ?? (p.showDailyScore !== false),
        showStreak: overrides.showStreak ?? (p.showStreak !== false),
        showPublicRoutines: overrides.showPublicRoutines ?? (p.showPublicRoutines !== false),
        updatedAt: Date.now()
    };

    await setDoc(doc(db, 'public_profiles', uid), payload, { merge: true });
    return payload;
}

export async function isUsernameAvailable(candidateUsername) {
    const db = getDb();
    const uid = getCurrentUid();
    const clean = String(candidateUsername || '').trim().toLowerCase().replace(/^@/, '');
    if (!clean || clean.length < 3) return false;

    const q = query(
        collection(db, 'public_profiles'),
        where('usernameLower', '==', clean),
        limit(2)
    );
    const snap = await getDocs(q);
    return snap.docs.every(d => d.id === uid);
}

export async function searchUsersByUsernamePrefix(prefix) {
    const db = getDb();
    const uid = getCurrentUid();
    const clean = String(prefix || '').trim().toLowerCase().replace(/^@/, '');
    if (!db || clean.length < 2) return [];

    const q = query(
        collection(db, 'public_profiles'),
        where('usernameLower', '>=', clean),
        where('usernameLower', '<=', clean + '\uf8ff'),
        limit(12)
    );
    const snap = await getDocs(q);
    return snap.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter(u => u.uid !== uid);
}

// 2. Sistema de Amigos (friendships/{pairId})
export async function getMyFriendships() {
    const db = getDb();
    const uid = getCurrentUid();
    if (!db || !uid) return { accepted: [], pendingIncoming: [], pendingOutgoing: [] };

    const q = query(
        collection(db, 'friendships'),
        where('participants', 'array-contains', uid),
        limit(50)
    );
    const snap = await getDocs(q);

    const accepted = [];
    const pendingIncoming = [];
    const pendingOutgoing = [];

    for (const d of snap.docs) {
        const data = { pairId: d.id, ...d.data() };
        const otherUid = (data.participants || []).find(id => id !== uid);
        if (!otherUid) continue;

        const profSnap = await getDoc(doc(db, 'public_profiles', otherUid));
        const profile = profSnap.exists() ? { uid: otherUid, ...profSnap.data() } : { uid: otherUid, name: 'Usuario WeaVax', username: 'usuario' };

        if (data.status === 'ACCEPTED') {
            accepted.push({ ...data, friend: profile });
        } else if (data.status === 'PENDING') {
            if (data.requesterUid === uid) pendingOutgoing.push({ ...data, friend: profile });
            else pendingIncoming.push({ ...data, friend: profile });
        }
    }

    return { accepted, pendingIncoming, pendingOutgoing };
}

export async function sendFriendRequest(targetUid) {
    const db = getDb();
    const myUid = getCurrentUid();
    if (!db || !myUid || myUid === targetUid) return;

    const pairId = buildPairId(myUid, targetUid);
    await setDoc(doc(db, 'friendships', pairId), {
        pairId,
        participants: [myUid, targetUid].sort(),
        requesterUid: myUid,
        status: 'PENDING',
        createdAt: Date.now()
    });
}

export async function acceptFriendRequest(pairId) {
    const db = getDb();
    if (!db) return;
    await updateDoc(doc(db, 'friendships', pairId), {
        status: 'ACCEPTED',
        acceptedAt: Date.now()
    });
}

export async function removeFriendship(pairId) {
    const db = getDb();
    if (!db) return;
    await deleteDoc(doc(db, 'friendships', pairId));
}

// 3. Muro de Entrenamientos Paginado (workout_posts/{postId})
export async function fetchWorkoutFeed(lastDocSnapshot = null) {
    const db = getDb();
    const uid = getCurrentUid();
    if (!db || !uid) return [];

    const q = query(
        collection(db, 'workout_posts'),
        where('visibleToUids', 'array-contains', uid),
        orderBy('createdAt', 'desc'),
        limit(15)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ postId: d.id, ...d.data() }));
}

export async function publishWorkoutPost({ sessionData, taggedFriends = [], prs = [], breakdown = [] }) {
    const db = getDb();
    const uid = getCurrentUid();
    if (!db || !uid) return;

    const myProf = await syncPublicProfile();
    const { accepted } = await getMyFriendships();
    const friendUids = accepted.map(f => f.friend.uid);
    const visibleToUids = Array.from(new Set([uid, ...friendUids]));

    const postId = `post_${uid}_${Date.now()}`;
    await setDoc(doc(db, 'workout_posts', postId), {
        postId,
        authorUid: uid,
        authorName: myProf.name,
        authorUsername: myProf.username,
        authorAvatar: myProf.avatar || '',
        authorIsPro: Boolean(myProf.isPro),
        routineName: sessionData.routineName || 'Entrenamiento',
        durationMinutes: Math.max(1, Math.round(Number(sessionData.durationSeconds || 0) / 60)),
        totalVolumeKg: Math.round(Number(sessionData.totalVolumeKg || 0)),
        totalSets: Number(sessionData.totalCompletedSets || 0),
        photoUrl: sessionData.photoDataUrl || '',
        notes: sessionData.notes || '',
        prs,
        breakdown,
        taggedFriends, // [{ uid, username, name }]
        likedByUids: [],
        commentsCount: 0,
        visibleToUids,
        createdAt: Date.now()
    });
}

export async function togglePostFireReaction(postId, hasLiked) {
    const db = getDb();
    const uid = getCurrentUid();
    if (!db || !uid) return;

    await updateDoc(doc(db, 'workout_posts', postId), {
        likedByUids: hasLiked ? arrayRemove(uid) : arrayUnion(uid)
    });
}

export async function fetchPostComments(postId) {
    const db = getDb();
    if (!db) return [];
    const q = query(
        collection(db, 'workout_posts', postId, 'comments'),
        orderBy('createdAt', 'asc'),
        limit(30)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addPostComment(postId, text) {
    const db = getDb();
    const uid = getCurrentUid();
    const clean = String(text || '').trim();
    if (!db || !uid || !clean) return;

    const p = window.state?.profile || {};
    await addDoc(collection(db, 'workout_posts', postId, 'comments'), {
        authorUid: uid,
        authorName: p.name || 'Usuario',
        authorUsername: p.username || 'usuario',
        text: clean,
        createdAt: Date.now()
    });

    const postRef = doc(db, 'workout_posts', postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
        await updateDoc(postRef, {
            commentsCount: Number(postSnap.data().commentsCount || 0) + 1
        });
    }
}

// 4. Rutinas Públicas de un Amigo y Clonado
export async function fetchFriendPublicRoutines(friendUid) {
    const db = getDb();
    if (!db || !friendUid) return [];
    const snap = await getDocs(query(collection(db, 'users', friendUid, 'workout_routines'), limit(15)));
    return snap.docs.map(d => ({ docId: d.id, ...d.data() }));
}

export async function cloneFriendRoutineToMine(routine) {
    const newId = Date.now();
    const cloned = {
        ...routine,
        id: newId,
        name: `${routine.name} (Copia)`,
        isCustom: true,
        isSystemTemplate: false,
        createdAt: newId
    };
    delete cloned.docId;
    await window.fsActions.setItem('workout_routines', newId, cloned);
    return newId;
}
