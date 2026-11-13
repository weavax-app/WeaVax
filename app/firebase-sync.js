import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

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

// Estado global compartido
window.state = {
    user: null,
    activeUserDocId: null,
    profile: {},
    habits: [],
    rawHabits: [],
    tasks: [],
    accounts: [],
    rawAccounts: [],
    transactions: [],
    budgets: [],
    goals: [],
    workout_routines: [],
    workout_sessions: [],
    isBalanceVisible: false,
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth(),
    selectedDay: new Date().getDate()
};

// Deduplicar registros por nombre normalizado (conserva el de mayor saldo o actualización más reciente)
function deduplicateByName(items, isAccount = false) {
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
            } else if ((item.updatedAt || '') > (existing.updatedAt || '') || item.isCompleted) {
                map.set(key, item);
            }
        }
    });
    return Array.from(map.values());
}

// Limpieza física en Firestore de documentos duplicados
window.cleanFirestoreDuplicates = async () => {
    const docId = window.state.activeUserDocId;
    if (!docId) return;

    const keepHabitIds = new Set(window.state.habits.map(h => h.id));
    const dupHabits = window.state.rawHabits.filter(h => !keepHabitIds.has(h.id));

    const keepAccIds = new Set(window.state.accounts.map(a => a.id));
    const dupAccounts = window.state.rawAccounts.filter(a => !keepAccIds.has(a.id));

    const totalDups = dupHabits.length + dupAccounts.length;
    if (totalDups === 0) {
        alert('No hay documentos duplicados pendientes de limpiar.');
        return;
    }

    if (!confirm(`Se eliminarán ${dupHabits.length} hábitos repetidos y ${dupAccounts.length} cuentas duplicadas (en Bs 0.00) de Firestore. ¿Continuar?`)) return;

    for (const h of dupHabits) {
        await deleteDoc(doc(db, 'users', docId, 'habits', h.id));
    }
    for (const a of dupAccounts) {
        await deleteDoc(doc(db, 'users', docId, 'accounts', a.id));
    }
    alert('¡Duplicados eliminados de Firestore!');
};

export function initSync(onDataUpdated) {
    onAuthStateChanged(auth, async (user) => {
        document.getElementById('loading-screen').classList.add('hidden');
        if (user) {
            window.state.user = user;
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');

            const docId = user.uid;
            window.state.activeUserDocId = docId;
            document.getElementById('diag-active-path').textContent = `users/${docId}`;

            onSnapshot(doc(db, 'users', docId), (snap) => {
                if (snap.exists()) {
                    window.state.profile = snap.data();
                    onDataUpdated();
                }
            });

            const cols = ['habits', 'tasks', 'accounts', 'transactions', 'budgets', 'goals', 'workout_routines', 'workout_sessions'];
            cols.forEach(colName => {
                onSnapshot(collection(db, 'users', docId, colName), (snap) => {
                    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    if (colName === 'habits') {
                        window.state.rawHabits = docs;
                        window.state.habits = deduplicateByName(docs, false);
                    } else if (colName === 'accounts') {
                        window.state.rawAccounts = docs;
                        window.state.accounts = deduplicateByName(docs, true);
                    } else if (colName === 'transactions') {
                        window.state.transactions = docs.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
                    } else {
                        window.state[colName] = docs;
                    }
                    onDataUpdated();
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

// Helpers CRUD exportados
export const fsActions = {
    add: (col, data) => addDoc(collection(db, 'users', window.state.activeUserDocId, col), data),
    update: (col, id, data) => updateDoc(doc(db, 'users', window.state.activeUserDocId, col, id), data),
    updateProfile: (data) => updateDoc(doc(db, 'users', window.state.activeUserDocId), data),
    remove: (col, id) => deleteDoc(doc(db, 'users', window.state.activeUserDocId, col, id))
};
