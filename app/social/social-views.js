import {
    syncPublicProfile,
    searchUsersByUsernamePrefix,
    getMyFriendships,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriendship,
    fetchWorkoutFeed,
    togglePostFireReaction,
    fetchPostComments,
    addPostComment,
    fetchFriendPublicRoutines,
    cloneFriendRoutineToMine
} from './social-service.js';

const socialState = {
    tab: 'MURO', // MURO | AMIGOS | RANKING | VS
    feed: [],
    friendships: { accepted: [], pendingIncoming: [], pendingOutgoing: [] },
    searchResults: [],
    searchQuery: '',
    selectedFriend: null,
    selectedFriendRoutines: [],
    loading: false
};

export async function renderSocialHub(container) {
    const myUid = window.state?.activeUserDocId;
    if (!myUid) return;

    socialState.loading = true;
    container.innerHTML = `
        <div class="p-8 text-center text-xs text-gray-400 animate-pulse">
            Cargando Comunidad WeaVax...
        </div>
    `;

    const [feed, friendships] = await Promise.all([
        fetchWorkoutFeed(),
        getMyFriendships()
    ]);

    socialState.feed = feed;
    socialState.friendships = friendships;
    socialState.loading = false;

    paintSocialUI(container);
}

function paintSocialUI(container) {
    const myUid = window.state?.activeUserDocId;
    const p = window.state?.profile || {};
    const pendingCount = socialState.friendships.pendingIncoming.length;

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Cabecera Comunidad -->
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h3 class="text-2xl font-black tracking-tight text-white">Comunidad Fitness</h3>
                    <p class="text-xs text-gray-400 mt-1">Comparte entrenamientos, compara récords y clona rutinas. Tus finanzas y tareas son 100% privadas.</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button type="button" onclick="inviteWeavaxFriend()" class="px-3.5 py-2 rounded-xl bg-[#121216] border border-[#1F1F26] hover:border-[#8B5CF6] text-xs font-bold text-white">🔗 Invitar amigo</button>
                    <button type="button" onclick="openSocialPrivacyModal()" class="px-3.5 py-2 rounded-xl bg-[#121216] border border-[#1F1F26] hover:border-[#8B5CF6] text-xs font-bold text-gray-300">🛡️ Privacidad Social</button>
                    <button type="button" onclick="refreshSocialHub()" class="px-3.5 py-2 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/40 text-xs font-extrabold">↻ Actualizar</button>
                </div>
            </div>

            <!-- Pestañas -->
            <div class="flex flex-wrap gap-2 border-b border-[#1F1F26] pb-3">
                <button type="button" onclick="switchSocialTab('MURO')" class="px-4 py-2 rounded-xl text-xs font-extrabold ${socialState.tab === 'MURO' ? 'bg-[#8B5CF6] text-white' : 'bg-[#121216] text-gray-400 border border-[#1F1F26]'}">🔥 Muro de Entrenamientos</button>
                <button type="button" onclick="switchSocialTab('AMIGOS')" class="px-4 py-2 rounded-xl text-xs font-extrabold ${socialState.tab === 'AMIGOS' ? 'bg-[#8B5CF6] text-white' : 'bg-[#121216] text-gray-400 border border-[#1F1F26]'}">
                    👥 Amigos (${socialState.friendships.accepted.length}) ${pendingCount > 0 ? `<span class="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black">${pendingCount}</span>` : ''}
                </button>
                <button type="button" onclick="switchSocialTab('RANKING')" class="px-4 py-2 rounded-xl text-xs font-extrabold ${socialState.tab === 'RANKING' ? 'bg-[#8B5CF6] text-white' : 'bg-[#121216] text-gray-400 border border-[#1F1F26]'}">🏆 Ranking Semanal</button>
            </div>

            <div id="social-tab-content"></div>
        </div>
    `;

    const body = document.getElementById('social-tab-content');
    if (socialState.tab === 'MURO') renderFeedTab(body, myUid);
    else if (socialState.tab === 'AMIGOS') renderFriendsTab(body, myUid);
    else if (socialState.tab === 'RANKING') renderRankingTab(body, myUid, p);
    else if (socialState.tab === 'VS' && socialState.selectedFriend) renderFriendProfileAndVsTab(body, myUid, p);
}

function renderFeedTab(el, myUid) {
    if (socialState.feed.length === 0) {
        el.innerHTML = `
            <div class="p-8 rounded-2xl bg-[#121216] border border-[#1F1F26] text-center space-y-3">
                <div class="text-3xl">🏋️</div>
                <h4 class="text-base font-black text-white">El muro de entrenamiento está listo</h4>
                <p class="text-xs text-gray-400 max-w-md mx-auto">Agrega amigos por su @usuario o finaliza una sesión de entrenamiento activando "Publicar en el muro de amigos".</p>
                <button type="button" onclick="switchSocialTab('AMIGOS')" class="px-4 py-2.5 rounded-xl bg-[#8B5CF6] text-white text-xs font-extrabold">Buscar Amigos</button>
            </div>
        `;
        return;
    }

    el.innerHTML = `
        <div class="max-w-2xl mx-auto space-y-4">
            ${socialState.feed.map(post => {
                const liked = (post.likedByUids || []).includes(myUid);
                const likesCount = (post.likedByUids || []).length;
                const tagged = post.taggedFriends || [];
                return `
                    <article class="p-5 rounded-2xl bg-[#121216] border border-[#1F1F26] space-y-4">
                        <div class="flex items-center justify-between gap-3">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 flex items-center justify-center font-black text-[#8B5CF6] overflow-hidden">
                                    ${post.authorAvatar ? `<img src="${post.authorAvatar}" class="w-full h-full object-cover">` : (post.authorName || 'A').charAt(0)}
                                </div>
                                <div>
                                    <div class="flex items-center space-x-1.5">
                                        <span class="text-sm font-extrabold text-white">${post.authorName}</span>
                                        <span class="text-xs text-gray-400">@${post.authorUsername}</span>
                                        ${post.authorIsPro ? `<span class="px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] text-[9px] font-black">PRO</span>` : ''}
                                    </div>
                                    <p class="text-[11px] text-gray-400">${new Date(Number(post.createdAt || Date.now())).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 class="text-base font-black text-white">${post.routineName}</h4>
                            ${tagged.length > 0 ? `<p class="text-xs text-[#10B981] font-bold mt-1">🤝 Entrenó con ${tagged.map(t => `@${t.username}`).join(', ')}</p>` : ''}
                            ${post.notes ? `<p class="text-xs text-gray-300 mt-1.5">${post.notes}</p>` : ''}
                        </div>

                        ${post.photoUrl ? `<img src="${post.photoUrl}" class="w-full max-h-72 object-cover rounded-xl border border-[#1F1F26]">` : ''}

                        <div class="grid grid-cols-3 gap-2.5 text-center" style="font-variant-numeric: tabular-nums;">
                            <div class="p-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26]">
                                <span class="text-[10px] text-gray-400 uppercase font-bold block">Volumen</span>
                                <span class="text-sm font-black text-white">${Number(post.totalVolumeKg || 0).toLocaleString('es-BO')} kg</span>
                            </div>
                            <div class="p-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26]">
                                <span class="text-[10px] text-gray-400 uppercase font-bold block">Duración</span>
                                <span class="text-sm font-black text-white">${post.durationMinutes || 0} min</span>
                            </div>
                            <div class="p-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26]">
                                <span class="text-[10px] text-gray-400 uppercase font-bold block">Series</span>
                                <span class="text-sm font-black text-[#10B981]">${post.totalSets || 0}</span>
                            </div>
                        </div>

                        ${(post.prs || []).length > 0 ? `
                            <div class="flex flex-wrap gap-1.5">
                                ${post.prs.map(pr => `<span class="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold">🏆 ${pr}</span>`).join('')}
                            </div>
                        ` : ''}

                        ${(post.breakdown || []).length > 0 ? `
                            <details class="text-xs text-gray-300 bg-[#0A0A0C] rounded-xl p-3 border border-[#1F1F26]">
                                <summary class="cursor-pointer font-bold text-gray-400 hover:text-white">Ver desglose de ejercicios (${post.breakdown.length})</summary>
                                <div class="mt-2 space-y-1.5 pt-2 border-t border-[#1F1F26]">
                                    ${post.breakdown.map(b => `<div class="flex justify-between"><span>${b.name}</span><span class="font-bold text-[#8B5CF6]" style="font-variant-numeric: tabular-nums;">${b.sets} series · ${b.vol} kg</span></div>`).join('')}
                                </div>
                            </details>
                        ` : ''}

                        <div class="flex items-center justify-between pt-2 border-t border-[#1F1F26]">
                            <button type="button" onclick="handlePostFireClick('${post.postId}', ${liked})" class="px-3.5 py-1.5 rounded-xl border ${liked ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-[#0A0A0C] border-[#1F1F26] text-gray-300 hover:border-amber-500/40'} text-xs font-extrabold" style="font-variant-numeric: tabular-nums;">
                                🔥 ${likesCount}
                            </button>
                            <button type="button" onclick="openPostCommentsModal('${post.postId}')" class="px-3.5 py-1.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] hover:border-[#8B5CF6] text-xs font-bold text-gray-300">
                                💬 Comentarios (${post.commentsCount || 0})
                            </button>
                        </div>
                    </article>
                `;
            }).join('')}
        </div>
    `;
}

function renderFriendsTab(el) {
    const { accepted, pendingIncoming, pendingOutgoing } = socialState.friendships;
    el.innerHTML = `
        <div class="space-y-6">
            <!-- Buscador por @username -->
            <div class="p-5 rounded-2xl bg-[#121216] border border-[#1F1F26] space-y-3">
                <label class="text-xs font-extrabold text-white block">Buscar atletas por @usuario</label>
                <div class="flex gap-2">
                    <input id="social-user-search" value="${socialState.searchQuery}" oninput="handleSocialUserSearch(this.value)" placeholder="Escribe @usuario (mín. 2 letras)..." class="flex-1 px-4 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-xs text-white focus:border-[#8B5CF6] outline-none">
                </div>
                <div id="social-search-results" class="space-y-2">
                    ${socialState.searchResults.map(u => {
                        const alreadyFriend = accepted.some(f => f.friend.uid === u.uid);
                        const alreadySent = pendingOutgoing.some(f => f.friend.uid === u.uid);
                        return `
                            <div class="p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] flex items-center justify-between">
                                <div>
                                    <p class="text-xs font-extrabold text-white">${u.name} <span class="text-gray-400 font-normal">@${u.username}</span></p>
                                    <p class="text-[11px] text-gray-400">Nivel ${u.level || 1} · ${u.totalWorkouts || 0} entrenamientos</p>
                                </div>
                                ${alreadyFriend ? `<span class="text-xs text-[#10B981] font-bold">✓ Amigos</span>` :
                                  alreadySent ? `<span class="text-xs text-amber-400 font-bold">Solicitud enviada</span>` :
                                  `<button type="button" onclick="sendFriendReqUI('${u.uid}')" class="px-3.5 py-1.5 rounded-lg bg-[#8B5CF6] text-white text-xs font-extrabold">+ Agregar</button>`}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Solicitudes recibidas -->
            ${pendingIncoming.length > 0 ? `
                <div class="p-5 rounded-2xl bg-[#121216] border border-amber-500/40 space-y-3">
                    <h4 class="text-xs font-black uppercase text-amber-400">Solicitudes Pendientes (${pendingIncoming.length})</h4>
                    ${pendingIncoming.map(req => `
                        <div class="p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] flex items-center justify-between gap-2">
                            <div>
                                <p class="text-xs font-extrabold text-white">${req.friend.name} <span class="text-gray-400">@${req.friend.username}</span></p>
                            </div>
                            <div class="flex gap-2">
                                <button type="button" onclick="acceptFriendReqUI('${req.pairId}')" class="px-3 py-1.5 rounded-lg bg-[#10B981] text-black text-xs font-extrabold">Aceptar</button>
                                <button type="button" onclick="removeFriendUI('${req.pairId}')" class="px-3 py-1.5 rounded-lg bg-[#121216] border border-[#1F1F26] text-gray-400 text-xs font-bold">Rechazar</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <!-- Lista de Amigos -->
            <div class="space-y-3">
                <h4 class="text-sm font-black text-white">Tus Amigos (${accepted.length})</h4>
                ${accepted.length === 0 ? `<p class="text-xs text-gray-400">Aún no tienes amigos agregados.</p>` : `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${accepted.map(item => {
                            const f = item.friend;
                            return `
                                <div class="p-4 rounded-2xl bg-[#121216] border border-[#1F1F26] hover:border-[#8B5CF6] flex items-center justify-between gap-3">
                                    <div onclick="openFriendComparisonView('${f.uid}')" class="cursor-pointer flex-1 min-w-0">
                                        <div class="flex items-center space-x-2">
                                            <p class="text-sm font-extrabold text-white truncate">${f.name}</p>
                                            <span class="text-xs text-gray-400">@${f.username}</span>
                                        </div>
                                        <p class="text-[11px] text-gray-400 mt-1" style="font-variant-numeric: tabular-nums;">
                                            Nv.${f.level || 1} · ${f.showStreak !== false ? `🔥 ${f.streak || 0}d · ` : ''}${Number(f.totalVolumeKg || 0).toLocaleString('es-BO')} kg
                                        </p>
                                    </div>
                                    <div class="flex gap-2 shrink-0">
                                        <button type="button" onclick="openFriendComparisonView('${f.uid}')" class="px-3 py-1.5 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] text-xs font-extrabold">VS / Rutinas</button>
                                        <button type="button" onclick="removeFriendUI('${item.pairId}')" class="px-2.5 py-1.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-gray-400 text-xs" title="Eliminar amigo">✕</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}

function renderRankingTab(el, myUid, myProfile) {
    const friendsList = socialState.friendships.accepted.map(f => f.friend);
    const allParticipants = [
        {
            uid: myUid,
            name: `${myProfile.name || 'Tú'} (Tú)`,
            username: myProfile.username || 'yo',
            totalVolumeKg: (window.state?.workout_sessions || []).reduce((acc, s) => acc + Number(s.totalVolumeKg || 0), 0),
            streak: Number(myProfile.streak || 0)
        },
        ...friendsList
    ].sort((a, b) => Number(b.totalVolumeKg || 0) - Number(a.totalVolumeKg || 0));

    el.innerHTML = `
        <div class="p-6 rounded-2xl bg-[#121216] border border-[#1F1F26] space-y-4">
            <h4 class="text-base font-black text-white">🏆 Tabla de Líderes entre Amigos (Volumen y Racha)</h4>
            <div class="space-y-2.5" style="font-variant-numeric: tabular-nums;">
                ${allParticipants.map((u, idx) => `
                    <div class="p-3.5 rounded-xl bg-[#0A0A0C] border ${u.uid === myUid ? 'border-[#8B5CF6]' : 'border-[#1F1F26]'} flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <span class="w-7 h-7 rounded-lg bg-[#121216] border border-[#1F1F26] flex items-center justify-center text-xs font-black ${idx === 0 ? 'text-amber-400' : 'text-gray-300'}">#${idx + 1}</span>
                            <div>
                                <p class="text-xs font-extrabold text-white">${u.name}</p>
                                <p class="text-[11px] text-gray-400">@${u.username}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-xs font-black text-[#10B981]">${Math.round(Number(u.totalVolumeKg || 0)).toLocaleString('es-BO')} kg</p>
                            <p class="text-[11px] text-amber-400">🔥 Racha: ${u.streak || 0} días</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderFriendProfileAndVsTab(el, myUid, myProfile) {
    const f = socialState.selectedFriend;
    const mySessions = (window.state?.workout_sessions || []).filter(s => s.isCompleted);
    const myVol = Math.round(mySessions.reduce((a, s) => a + Number(s.totalVolumeKg || 0), 0));
    const myLifts = {};
    mySessions.forEach(s => (s.sets || []).forEach(st => {
        const w = Number(st.weightKg || 0);
        if (w > 0 && st.exerciseName) myLifts[st.exerciseName] = Math.max(myLifts[st.exerciseName] || 0, w);
    }));

    const friendLifts = f.bestLifts || {};
    const allExercises = Array.from(new Set([...Object.keys(myLifts), ...Object.keys(friendLifts)])).slice(0, 15);

    el.innerHTML = `
        <div class="space-y-6">
            <button type="button" onclick="switchSocialTab('AMIGOS')" class="px-3.5 py-2 rounded-xl bg-[#121216] border border-[#1F1F26] text-xs font-bold text-white">← Volver a Amigos</button>

            <!-- Comparador Cara a Cara (Tú vs Amigo) -->
            <div class="p-6 rounded-2xl bg-[#121216] border border-[#8B5CF6]/50 space-y-4" style="font-variant-numeric: tabular-nums;">
                <h4 class="text-base font-black text-white">⚔️ Comparar Progreso: Tú vs. ${f.name} (@${f.username})</h4>
                <div class="grid grid-cols-3 gap-3 text-center text-xs">
                    <div class="p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26]">
                        <span class="text-gray-400 block">Nivel</span>
                        <strong class="text-white text-sm">${myProfile.level || 1} vs ${f.level || 1}</strong>
                    </div>
                    <div class="p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26]">
                        <span class="text-gray-400 block">Sesiones</span>
                        <strong class="text-white text-sm">${mySessions.length} vs ${f.totalWorkouts || 0}</strong>
                    </div>
                    <div class="p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26]">
                        <span class="text-gray-400 block">Volumen Total</span>
                        <strong class="text-[#10B981] text-sm">${myVol.toLocaleString('es-BO')} vs ${Number(f.totalVolumeKg || 0).toLocaleString('es-BO')} kg</strong>
                    </div>
                </div>

                ${allExercises.length > 0 ? `
                    <div class="overflow-x-auto">
                        <table class="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr class="border-b border-[#1F1F26] text-gray-400">
                                    <th class="py-2">Ejercicio (PR Máximo)</th>
                                    <th class="py-2 text-center">Tú</th>
                                    <th class="py-2 text-center">${f.name}</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-[#1F1F26]">
                                ${allExercises.map(ex => {
                                    const mw = myLifts[ex] || 0;
                                    const fw = friendLifts[ex] || 0;
                                    return `
                                        <tr>
                                            <td class="py-2.5 font-bold text-gray-200">${ex}</td>
                                            <td class="py-2.5 text-center font-black ${mw >= fw && mw > 0 ? 'text-[#10B981]' : 'text-gray-400'}">${mw > 0 ? `${mw} kg` : '—'}</td>
                                            <td class="py-2.5 text-center font-black ${fw > mw ? 'text-[#8B5CF6]' : 'text-gray-400'}">${fw > 0 ? `${fw} kg` : '—'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-xs text-gray-400">Registra levantamientos con peso para desbloquear la tabla comparativa de PRs.</p>'}
            </div>

            <!-- Rutinas Públicas del Amigo -->
            <div class="p-6 rounded-2xl bg-[#121216] border border-[#1F1F26] space-y-4">
                <h4 class="text-base font-black text-white">📚 Rutinas Públicas de ${f.name}</h4>
                ${f.showPublicRoutines === false ? `<p class="text-xs text-gray-400">Este usuario mantiene sus rutinas en privado.</p>` :
                  socialState.selectedFriendRoutines.length === 0 ? `<p class="text-xs text-gray-400">No tiene rutinas publicadas aún.</p>` : `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${socialState.selectedFriendRoutines.map((r, idx) => `
                            <div class="p-4 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] flex items-center justify-between gap-3">
                                <div>
                                    <p class="text-sm font-extrabold text-white">${r.name}</p>
                                    <p class="text-xs text-gray-400 mt-0.5">${(r.days || []).length} días · ${r.focusCategory || 'Hipertrofia'}</p>
                                </div>
                                <button type="button" onclick="handleCloneFriendRoutine(${idx})" class="px-3.5 py-2 rounded-xl bg-[#8B5CF6] text-white text-xs font-extrabold shrink-0">Guardar en Mis Rutinas</button>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}

// Handlers globales conectados al DOM
window.switchSocialTab = (tab) => {
    socialState.tab = tab;
    const container = document.getElementById('main-content');
    if (container) paintSocialUI(container);
};

window.refreshSocialHub = () => {
    const container = document.getElementById('main-content');
    if (container) renderSocialHub(container);
};

window.handleSocialUserSearch = async (val) => {
    socialState.searchQuery = val;
    socialState.searchResults = await searchUsersByUsernamePrefix(val);
    const container = document.getElementById('main-content');
    if (container) paintSocialUI(container);
};

window.sendFriendReqUI = async (targetUid) => {
    await sendFriendRequest(targetUid);
    window.refreshSocialHub();
};

window.acceptFriendReqUI = async (pairId) => {
    await acceptFriendRequest(pairId);
    window.refreshSocialHub();
};

window.removeFriendUI = async (pairId) => {
    await removeFriendship(pairId);
    window.refreshSocialHub();
};

window.openFriendComparisonView = async (friendUid) => {
    const found = socialState.friendships.accepted.find(x => x.friend.uid === friendUid);
    if (!found) return;
    socialState.selectedFriend = found.friend;
    socialState.selectedFriendRoutines = await fetchFriendPublicRoutines(friendUid);
    socialState.tab = 'VS';
    const container = document.getElementById('main-content');
    if (container) paintSocialUI(container);
};

window.handleCloneFriendRoutine = async (idx) => {
    const r = socialState.selectedFriendRoutines[idx];
    if (!r) return;
    await cloneFriendRoutineToMine(r);
    alert(`Rutina "${r.name}" guardada en Mis Rutinas.`);
};

window.handlePostFireClick = async (postId, hasLiked) => {
    await togglePostFireReaction(postId, hasLiked);
    window.refreshSocialHub();
};

window.openPostCommentsModal = async (postId) => {
    const comments = await fetchPostComments(postId);
    window.openUniversalModal('💬 Comentarios del Entrenamiento', `
        <div class="space-y-3 text-xs">
            <div class="max-h-60 overflow-y-auto space-y-2">
                ${comments.length === 0 ? '<p class="text-gray-400">Sé el primero en comentar este entrenamiento.</p>' : comments.map(c => `
                    <div class="p-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26]">
                        <span class="font-extrabold text-white">${c.authorName} <span class="text-gray-400 font-normal">@${c.authorUsername}</span></span>
                        <p class="text-gray-300 mt-1">${c.text}</p>
                    </div>
                `).join('')}
            </div>
            <form onsubmit="submitPostCommentUI(event, '${postId}')" class="flex gap-2 pt-2 border-t border-[#1F1F26]">
                <input id="new-post-comment" required placeholder="Escribe un comentario..." class="flex-1 px-3 py-2 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white">
                <button type="submit" class="px-4 py-2 rounded-xl bg-[#8B5CF6] text-white font-extrabold">Enviar</button>
            </form>
        </div>
    `);
};

window.submitPostCommentUI = async (e, postId) => {
    e.preventDefault();
    const input = document.getElementById('new-post-comment');
    if (!input || !input.value.trim()) return;
    await addPostComment(postId, input.value);
    window.closeUniversalModal();
    window.refreshSocialHub();
};

window.inviteWeavaxFriend = () => {
    const username = window.state?.profile?.username || 'atleta';
    const text = `Entrena y organiza tu vida conmigo en WeaVax (https://weavax.link). Búscame como @${username}`;
    navigator.clipboard?.writeText(text);
    alert(`Enlace e invitación copiados al portapapeles:\n"${text}"`);
};

window.openSocialPrivacyModal = () => {
    const p = window.state?.profile || {};
    window.openUniversalModal('🛡️ Privacidad Social', `
        <form onsubmit="saveSocialPrivacyUI(event)" class="space-y-3 text-xs">
            <div class="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]">
                Tus cuentas bancarias, transacciones, presupuestos, tareas y notas privadas jamás se comparten con nadie.
            </div>
            <label class="flex items-center justify-between p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26]">
                <span>Mostrar Daily Score en mi perfil público</span>
                <input type="checkbox" id="priv-score" ${p.showDailyScore !== false ? 'checked' : ''} class="accent-[#8B5CF6]">
            </label>
            <label class="flex items-center justify-between p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26]">
                <span>Mostrar racha de días activos</span>
                <input type="checkbox" id="priv-streak" ${p.showStreak !== false ? 'checked' : ''} class="accent-[#8B5CF6]">
            </label>
            <label class="flex items-center justify-between p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26]">
                <span>Permitir que mis amigos vean y clonen mis rutinas</span>
                <input type="checkbox" id="priv-routines" ${p.showPublicRoutines !== false ? 'checked' : ''} class="accent-[#8B5CF6]">
            </label>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-[#8B5CF6] text-white font-extrabold">Guardar Preferencias</button>
        </form>
    `);
};

window.saveSocialPrivacyUI = async (e) => {
    e.preventDefault();
    const prefs = {
        showDailyScore: document.getElementById('priv-score').checked,
        showStreak: document.getElementById('priv-streak').checked,
        showPublicRoutines: document.getElementById('priv-routines').checked
    };
    await window.fsActions.updateProfile(prefs);
    await syncPublicProfile(prefs);
    window.closeUniversalModal();
    window.refreshSocialHub();
};
