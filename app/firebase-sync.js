import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB7exiNH2ncLbwJ7TVIQ6-Dl3Lh9sDFcVo",
    authDomain: "lifeos-575b9.firebaseapp.com",
    projectId: "lifeos-575b9",
    storageBucket: "lifeos-575b9.firebasestorage.app",
    messagingSenderId: "723633495460",
    appId: "1:723633495460:web:60e823631ca6290a6eb531",
    measurementId: "G-ST2472GPZL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

window.state = {
    user: null,
    activeUserDocId: null,
    profile: {},
    habits: [],
    rawHabits: [],
    tasks: [],
    projects: [],
    accounts: [],
    rawAccounts: [],
    transactions: [],
    budgets: [],
    goals: [],
    workout_routines: [],
    workout_sessions: [],
    isBalanceVisible: false, // Oculto por defecto como en MainViewModel.kt
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth(),
    selectedDay: new Date().getDate(),
    planSubTab: 'calendar', // 'calendar' | 'tasks' | 'events' | 'inbox' | 'projects'
    workoutViewMode: 'grid', // 'grid' | 'list'
    activeWorkoutSession: null
};

// Deduplicador inteligente: conserva la cuenta con mayor saldo y el hábito más actualizado
function deduplicateItems(items, isAccount = false) {
    const map = new Map();
    items.forEach(item => {
        const key = String(item.name || item.title || '').trim().toLowerCase();
        if (!key) return;
        if (!map.has(key)) {
            map.set(key, item);
        } else {
            const existing = map.get(key);
            if (isAccount) {
                if (Math.abs(Number(item.balance || 0)) > Math.abs(Number(existing.balance || 0))) {
                    map.set(key, item);
                }
            } else {
                const tNew = Number(item.updatedAt || 0);
                const tOld = Number(existing.updatedAt || 0);
                if (item.isCompleted || tNew > tOld) map.set(key, item);
            }
        }
    });
    return Array.from(map.values());
}

// Botón para borrar físicamente de Firestore las copias repetidas
window.cleanFirestoreDuplicates = async () => {
    const uid = window.state.activeUserDocId;
    if (!uid) return;
    const keepHabits = new Set(window.state.habits.map(h => String(h.docId)));
    const dupHabits = window.state.rawHabits.filter(h => !keepHabits.has(String(h.docId)));

    const keepAccs = new Set(window.state.accounts.map(a => String(a.docId)));
    const dupAccs = window.state.rawAccounts.filter(a => !keepAccs.has(String(a.docId)));

    if (dupHabits.length === 0 && dupAccs.length === 0) {
        alert('No hay duplicados pendientes en Firestore.');
        return;
    }
    if (!confirm(`Se eliminarán de Firestore ${dupHabits.length} hábitos repetidos y ${dupAccs.length} cuentas duplicadas en 0.00. ¿Confirmar?`)) return;

    for (const h of dupHabits) await deleteDoc(doc(db, 'users', uid, 'habits', String(h.docId)));
    for (const a of dupAccs) await deleteDoc(doc(db, 'users', uid, 'accounts', String(a.docId)));
    alert('¡Base de datos depurada con éxito!');
};

export function initSync(onUpdate) {
    onAuthStateChanged(auth, async (user) => {
        document.getElementById('loading-screen').classList.add('hidden');
        if (user) {
            window.state.user = user;
            window.state.activeUserDocId = user.uid;
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            const diagPath = document.getElementById('diag-active-path');
            if (diagPath) diagPath.textContent = `users/${user.uid}`;

            onSnapshot(doc(db, 'users', user.uid), (snap) => {
                if (snap.exists()) {
                    window.state.profile = snap.data();
                    onUpdate();
                }
            });

            const collections = [
                'habits', 'tasks', 'projects', 'accounts',
                'transactions', 'budgets', 'goals',
                'workout_routines', 'workout_sessions'
            ];

            collections.forEach(col => {
                onSnapshot(collection(db, 'users', user.uid, col), (snap) => {
                    const list = snap.docs.map(d => ({ ...d.data(), docId: d.id, id: d.data().id ?? d.id }));
                    if (col === 'habits') {
                        window.state.rawHabits = list;
                        window.state.habits = deduplicateItems(list, false);
                    } else if (col === 'accounts') {
                        window.state.rawAccounts = list;
                        window.state.accounts = deduplicateItems(list, true).filter(a => !a.isArchived);
                    } else if (col === 'transactions') {
                        window.state.transactions = list.sort((a, b) => Number(b.date || 0) - Number(a.date || 0));
                    } else if (col === 'workout_sessions') {
                        window.state.workout_sessions = list.sort((a, b) => Number(b.startedAt || 0) - Number(a.startedAt || 0));
                    } else {
                        window.state[col] = list;
                    }
                    onUpdate();
                });
            });
        } else {
            document.getElementById('auth-screen').classList.remove('hidden');
            document.getElementById('app-container').classList.add('hidden');
        }
    });

    document.getElementById('btn-google-login').onclick = () => signInWithPopup(auth, new GoogleAuthProvider());
    document.getElementById('email-login-form').onsubmit = (e) => {
        e.preventDefault();
        signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-password').value);
    };
    window.logoutUser = () => signOut(auth);
}

// Escritura compatible con el formato Long ID de Room en FirestoreSyncService.kt
export const fsActions = {
    setItem: async (col, id, data) => {
        const uid = window.state.activeUserDocId;
        const numericId = Number(id) || Math.floor(Date.now() / 1000);
        const docId = String(numericId);
        await setDoc(doc(db, 'users', uid, col, docId), {
            ...data,
            id: numericId,
            updatedAt: Date.now()
        }, { merge: true });
    },
    updateItem: async (col, docId, data) => {
        const uid = window.state.activeUserDocId;
        const numericId = Number(docId);
        const payload = { ...data, updatedAt: Date.now() };
        if (!isNaN(numericId)) payload.id = numericId;
        await setDoc(doc(db, 'users', uid, col, String(docId)), payload, { merge: true });
    },
    updateProfile: async (data) => {
        const uid = window.state.activeUserDocId;
        await setDoc(doc(db, 'users', uid), { ...data, updatedAt: Date.now() }, { merge: true });
    },
    removeItem: async (col, docId) => {
        const uid = window.state.activeUserDocId;
        await deleteDoc(doc(db, 'users', uid, col, String(docId)));
    }
};
