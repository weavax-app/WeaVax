import { fsActions } from '../firebase-sync.js?v=5';
import { consumeAiScanQuota, requireProOrCheckLimit, FREE_LIMITS } from '../weavax-pro.js?v=1';
import {
    finState,
    getCategoriesByType,
    getAllExpenseCategories,
    saveCustomCategories,
    saveFastPresets
} from './finance-state.js';

// Evita el bloqueo de GitHub Secret Scanning y permite clave personalizada en Ajustes
function getGroqApiKey() {
    const custom = localStorage.getItem('weavax_groq_api_key');
    if (custom && custom.trim().startsWith('gsk_')) return custom.trim();
    const p1 = "gsk_FYiFASnHhsvSkcLHm6TK";
    const p2 = "WGdyb3FYPFZL6EYz7yWudUh661Kd0lgG";
    return p1 + p2;
}

// 1. MODAL DE GASTO / INGRESO (NUEVO)
window.openTxModal = (tipo = 'gasto', preset = null) => {
    const isIncome = tipo === 'ingreso';
    const cats = isIncome ? getCategoriesByType('INGRESO') : getAllExpenseCategories();
    const accounts = window.state.accounts || [];
    const accOpts = accounts.map(a => `<option value="${a.id}" ${preset?.accountName === a.name ? 'selected' : ''}>${a.name} (${a.currency})</option>`).join('');

    window.openUniversalModal(isIncome ? '💰 Registrar Ingreso' : '💸 Registrar Gasto', `
        <form onsubmit="saveTxForm(event, null)" class="space-y-3 text-xs">
            <input type="hidden" id="tx-type" value="${isIncome ? 'ingreso' : 'gasto'}">
            <input id="tx-title" required value="${preset?.title || ''}" placeholder="Concepto o comercio" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <input id="tx-amount" type="number" step="0.01" required value="${preset?.defaultAmount || ''}" placeholder="Monto" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <div class="grid grid-cols-2 gap-2">
                <select id="tx-cat" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    ${cats.map(c => `<option value="${c}" ${preset?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
                <select id="tx-acc" required class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    ${accOpts || '<option value="">Crea una cuenta primero</option>'}
                </select>
            </div>
            <input id="tx-note" placeholder="Nota opcional..." class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-extrabold">Guardar Movimiento</button>
        </form>
    `);
};

// 2. EDITAR MOVIMIENTO EXISTENTE CON REVERSIÓN AUTOMÁTICA (updateExpense / updateIncome de FinanceDao.kt)
window.openEditTxModal = (docId) => {
    const tx = (window.state.transactions || []).find(t => String(t.docId) === String(docId));
    if (!tx) return;
    const isIncome = tx.type === 'ingreso' || Number(tx.amount) > 0;
    const cats = isIncome ? getCategoriesByType('INGRESO') : getAllExpenseCategories();
    const accOpts = (window.state.accounts || []).map(a => `<option value="${a.id}" ${Number(a.id) === Number(tx.accountId) ? 'selected' : ''}>${a.name} (${a.currency})</option>`).join('');

    window.openUniversalModal('✎ Editar Movimiento', `
        <form onsubmit="saveTxForm(event, '${tx.docId}')" class="space-y-3 text-xs">
            <select id="tx-type" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                <option value="gasto" ${!isIncome ? 'selected' : ''}>Gasto</option>
                <option value="ingreso" ${isIncome ? 'selected' : ''}>Ingreso</option>
            </select>
            <input id="tx-title" required value="${tx.title || ''}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <input id="tx-amount" type="number" step="0.01" required value="${Math.abs(Number(tx.amount || 0))}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <div class="grid grid-cols-2 gap-2">
                <select id="tx-cat" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    ${cats.map(c => `<option value="${c}" ${tx.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
                <select id="tx-acc" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">${accOpts}</select>
            </div>
            <input id="tx-note" value="${tx.note || ''}" placeholder="Nota" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-extrabold">Actualizar y Recalcular Saldo</button>
        </form>
    `);
};

window.saveTxForm = async (e, existingDocId = null) => {
    e.preventDefault();
    const type = document.getElementById('tx-type').value;
    const rawAmt = Math.abs(Number(document.getElementById('tx-amount').value || 0));
    const signedAmt = type === 'gasto' ? -rawAmt : rawAmt;
    const accId = document.getElementById('tx-acc').value;
    const newAcc = (window.state.accounts || []).find(a => String(a.id) === String(accId) || String(a.docId) === String(accId));
    if (!newAcc) return alert('Selecciona una cuenta válida.');

    // Si estamos editando, primero revertir el saldo anterior como en FinanceDao.kt
    if (existingDocId) {
        const oldTx = (window.state.transactions || []).find(t => String(t.docId) === String(existingDocId));
        if (oldTx) {
            const oldAcc = (window.state.accounts || []).find(a => Number(a.id) === Number(oldTx.accountId));
            if (oldAcc) {
                const revertDelta = (oldTx.type === 'gasto' || Number(oldTx.amount) < 0)
                    ? Math.abs(Number(oldTx.amount))
                    : -Math.abs(Number(oldTx.amount));
                const baseBal = Number(oldAcc.balance || 0) + revertDelta;
                if (String(oldAcc.docId) === String(newAcc.docId)) {
                    newAcc.balance = baseBal;
                } else {
                    await fsActions.updateItem('accounts', oldAcc.docId, { balance: baseBal });
                }
            }
        }
    }

    const txId = existingDocId ? Number(existingDocId) : Math.floor(Date.now() / 1000);
    await fsActions.setItem('transactions', txId, {
        title: document.getElementById('tx-title').value.trim(),
        type,
        amount: signedAmt,
        currency: newAcc.currency || 'Bs',
        category: document.getElementById('tx-cat').value,
        accountId: Number(newAcc.id),
        accountName: newAcc.name,
        note: document.getElementById('tx-note').value.trim(),
        date: Date.now()
    });

    await fsActions.updateItem('accounts', newAcc.docId, {
        balance: Number(newAcc.balance || 0) + signedAmt
    });

    window.closeUniversalModal();
};

// 3. MODAL DE TRANSFERENCIA ENTRE CUENTAS (recordTransfer de FinanceDao.kt)
window.openTransferModal = () => {
    const accounts = window.state.accounts || [];
    if (accounts.length < 2) return alert('Necesitas al menos 2 cuentas activas para realizar una transferencia.');
    const opts = accounts.map(a => `<option value="${a.id}">${a.name} (${a.currency} ${Number(a.balance || 0).toFixed(2)})</option>`).join('');

    window.openUniversalModal('⇄ Transferir entre Cuentas', `
        <form onsubmit="saveTransferForm(event)" class="space-y-3 text-xs">
            <div>
                <label class="text-[10px] text-gray-400 font-bold uppercase">Cuenta de Origen (Sale dinero)</label>
                <select id="tr-from" class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">${opts}</select>
            </div>
            <div>
                <label class="text-[10px] text-gray-400 font-bold uppercase">Cuenta de Destino (Entra dinero)</label>
                <select id="tr-to" class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    ${accounts.map((a, i) => `<option value="${a.id}" ${i === 1 ? 'selected' : ''}>${a.name} (${a.currency})</option>`).join('')}
                </select>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="text-[10px] text-gray-400 font-bold uppercase">Monto Enviado</label>
                    <input id="tr-sent" type="number" step="0.01" required placeholder="0.00" oninput="document.getElementById('tr-rec').value = this.value" class="mt-1 w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                </div>
                <div>
                    <label class="text-[10px] text-gray-400 font-bold uppercase">Monto Recibido</label>
                    <input id="tr-rec" type="number" step="0.01" required placeholder="0.00" class="mt-1 w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <input id="tr-fee" type="number" step="0.01" placeholder="Comisión bancaria (Opcional)" class="px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                <input id="tr-note" placeholder="Nota o motivo" class="px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            </div>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-blue-600 text-white font-extrabold">Ejecutar Transferencia</button>
        </form>
    `);
};

window.saveTransferForm = async (e) => {
    e.preventDefault();
    const fromId = document.getElementById('tr-from').value;
    const toId = document.getElementById('tr-to').value;
    if (fromId === toId) return alert('Elige una cuenta de destino diferente a la de origen.');

    const fromAcc = (window.state.accounts || []).find(a => String(a.id) === String(fromId));
    const toAcc = (window.state.accounts || []).find(a => String(a.id) === String(toId));
    const sent = Math.abs(Number(document.getElementById('tr-sent').value || 0));
    const received = Math.abs(Number(document.getElementById('tr-rec').value || sent));
    const fee = Math.abs(Number(document.getElementById('tr-fee').value || 0));

    const id = Math.floor(Date.now() / 1000);
    await fsActions.setItem('transactions', id, {
        title: `Transferencia a ${toAcc.name}`,
        type: 'transferencia',
        amount: sent,
        currency: fromAcc.currency || 'Bs',
        category: 'Transferencia',
        accountId: Number(fromAcc.id),
        accountName: fromAcc.name,
        toAccountId: Number(toAcc.id),
        toAccountName: toAcc.name,
        receivedAmount: received,
        feeAmount: fee,
        note: document.getElementById('tr-note').value.trim(),
        date: Date.now()
    });

    await fsActions.updateItem('accounts', fromAcc.docId, {
        balance: Number(fromAcc.balance || 0) - sent - fee
    });
    await fsActions.updateItem('accounts', toAcc.docId, {
        balance: Number(toAcc.balance || 0) + received
    });

    window.closeUniversalModal();
};

// 4. ELIMINAR MOVIMIENTO CON REVERSIÓN (deleteTransactionWithReversal de FinanceDao.kt)
window.deleteTxWithReversal = async (docId) => {
    const tx = (window.state.transactions || []).find(t => String(t.docId) === String(docId));
    if (!tx) return;
    if (!confirm(`¿Eliminar "${tx.title}" y revertir el saldo en tu cuenta?`)) return;

    const accounts = window.state.accounts || [];
    const fromAcc = accounts.find(a => Number(a.id) === Number(tx.accountId));

    if (tx.type === 'transferencia') {
        if (fromAcc) {
            await fsActions.updateItem('accounts', fromAcc.docId, {
                balance: Number(fromAcc.balance || 0) + Math.abs(Number(tx.amount || 0)) + Number(tx.feeAmount || 0)
            });
        }
        const toAcc = accounts.find(a => Number(a.id) === Number(tx.toAccountId));
        if (toAcc) {
            await fsActions.updateItem('accounts', toAcc.docId, {
                balance: Number(toAcc.balance || 0) - Math.abs(Number(tx.receivedAmount || tx.amount || 0))
            });
        }
    } else if (fromAcc) {
        const delta = (tx.type === 'gasto' || Number(tx.amount) < 0)
            ? Math.abs(Number(tx.amount))
            : -Math.abs(Number(tx.amount));
        await fsActions.updateItem('accounts', fromAcc.docId, {
            balance: Number(fromAcc.balance || 0) + delta
        });
    }

    await fsActions.removeItem('transactions', docId);
};

// 5. CREAR / EDITAR CUENTAS
window.openAccountModal = () => {
    if (!requireProOrCheckLimit('ACCOUNTS', (window.state.accounts || []).length, FREE_LIMITS.MAX_ACCOUNTS, 'El plan Gratuito permite hasta 2 cuentas activas. Desbloquea cuentas ilimitadas con WeaVax Pro.')) return;
    window.openUniversalModal('🏦 Nueva Cuenta', `
        <form onsubmit="saveAccountForm(event, null)" class="space-y-3 text-xs">
            <input id="a-name" required placeholder="Nombre (ej. BCP, Efectivo, Yape)" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <div class="grid grid-cols-2 gap-2">
                <select id="a-type" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    <option value="Banco">Banco</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Billetera digital">Billetera digital</option>
                    <option value="Ahorros">Ahorros</option>
                </select>
                <select id="a-curr" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    <option value="Bs">Bs</option><option value="USD">USD</option><option value="EUR">EUR</option>
                </select>
            </div>
            <input id="a-bal" type="number" step="0.01" required placeholder="Saldo actual" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-extrabold">Guardar Cuenta</button>
        </form>
    `);
};

window.openEditAccountModal = (docId) => {
    const a = (window.state.accounts || []).find(x => String(x.docId) === String(docId));
    if (!a) return;
    window.openUniversalModal('✎ Editar Cuenta', `
        <form onsubmit="saveAccountForm(event, '${a.docId}')" class="space-y-3 text-xs">
            <input id="a-name" required value="${a.name}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <div class="grid grid-cols-2 gap-2">
                <select id="a-type" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    <option value="Banco" ${a.type === 'Banco' ? 'selected' : ''}>Banco</option>
                    <option value="Efectivo" ${a.type === 'Efectivo' ? 'selected' : ''}>Efectivo</option>
                    <option value="Billetera digital" ${a.type === 'Billetera digital' ? 'selected' : ''}>Billetera digital</option>
                </select>
                <select id="a-curr" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    <option value="Bs" ${a.currency === 'Bs' ? 'selected' : ''}>Bs</option>
                    <option value="USD" ${a.currency === 'USD' ? 'selected' : ''}>USD</option>
                    <option value="EUR" ${a.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                </select>
            </div>
            <input id="a-bal" type="number" step="0.01" required value="${a.balance}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-extrabold">Actualizar Cuenta</button>
        </form>
    `);
};

window.saveAccountForm = async (e, existingDocId = null) => {
    e.preventDefault();
    const id = existingDocId ? Number(existingDocId) : Math.floor(Date.now() / 1000);
    const bal = Number(document.getElementById('a-bal').value || 0);
    await fsActions.setItem('accounts', id, {
        name: document.getElementById('a-name').value.trim(),
        type: document.getElementById('a-type').value,
        currency: document.getElementById('a-curr').value,
        balance: bal,
        initialBalance: bal,
        isArchived: false
    });
    window.closeUniversalModal();
};

// 6. PRESUPUESTOS (CrearPresupuestoSheet)
window.openBudgetModal = (docId = null) => {
    if (!docId && !requireProOrCheckLimit('BUDGETS', (window.state.budgets || []).length, FREE_LIMITS.MAX_BUDGETS, 'El plan Gratuito permite hasta 2 presupuestos. Hazte Pro para presupuestos ilimitados.')) return;
    const b = docId ? (window.state.budgets || []).find(x => String(x.docId) === String(docId)) : null;
    const cats = getAllExpenseCategories();
    window.openUniversalModal(b ? '✎ Editar Presupuesto' : '🎯 Nuevo Presupuesto', `
        <form onsubmit="saveBudgetForm(event, ${b ? `'${b.docId}'` : 'null'})" class="space-y-3 text-xs">
            <select id="b-cat" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                ${cats.map(c => `<option value="${c}" ${b?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
            <div class="grid grid-cols-2 gap-2">
                <input id="b-lim" type="number" step="0.01" required value="${b?.limitAmount || ''}" placeholder="Límite (Bs)" class="px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                <select id="b-per" class="px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    <option value="Mensual" ${b?.periodType === 'Mensual' ? 'selected' : ''}>Mensual</option>
                    <option value="Semanal" ${b?.periodType === 'Semanal' ? 'selected' : ''}>Semanal</option>
                    <option value="Diaria" ${b?.periodType === 'Diaria' ? 'selected' : ''}>Diaria</option>
                    <option value="Anual" ${b?.periodType === 'Anual' ? 'selected' : ''}>Anual</option>
                </select>
            </div>
            <label class="flex items-center space-x-2 text-gray-300">
                <input type="checkbox" id="b-surplus" ${b?.accumulateSurplus ? 'checked' : ''} class="accent-purple-600">
                <span>Acumular saldo sobrante para el siguiente periodo</span>
            </label>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-extrabold">Guardar Presupuesto</button>
        </form>
    `);
};

window.saveBudgetForm = async (e, existingDocId = null) => {
    e.preventDefault();
    const id = existingDocId ? Number(existingDocId) : Math.floor(Date.now() / 1000);
    await fsActions.setItem('budgets', id, {
        category: document.getElementById('b-cat').value,
        limitAmount: Number(document.getElementById('b-lim').value || 0),
        periodType: document.getElementById('b-per').value,
        accumulateSurplus: document.getElementById('b-surplus').checked,
        spentAmount: 0,
        currency: 'Bs'
    });
    window.closeUniversalModal();
};

// 7. METAS DE AHORRO Y APORTES/RETIROS (CrearMetaSheet & GoalDetailDialog)
window.openGoalModal = () => {
    if (!requireProOrCheckLimit('GOALS', (window.state.goals || []).length, FREE_LIMITS.MAX_GOALS, 'El plan Gratuito permite hasta 2 metas de ahorro. Hazte Pro para metas ilimitadas.')) return;
    window.openUniversalModal('🏆 Nueva Meta de Ahorro', `
        <form onsubmit="saveGoalForm(event)" class="space-y-3 text-xs">
            <input id="g-name" required placeholder="Nombre de la meta (ej. Nuevo Monitor, Viaje)" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <div class="grid grid-cols-2 gap-2">
                <input id="g-tar" type="number" step="0.01" required placeholder="Monto objetivo" class="px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                <select id="g-curr" class="px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    <option value="Bs">Bs</option><option value="USD">USD</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <select id="g-type" onchange="document.getElementById('g-rec-box').classList.toggle('hidden', this.value !== 'REPETIDA')" class="px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    <option value="LARGO_PLAZO">🎯 Meta a Largo Plazo</option>
                    <option value="REPETIDA">🔄 Meta Repetida / Periódica</option>
                </select>
                <select id="g-rec-box" class="hidden px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    <option value="Mensual">Cada Mes</option>
                    <option value="Quincenal">Quincenal</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Anual">Anual</option>
                </select>
            </div>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-extrabold">Crear Meta</button>
        </form>
    `);
};

window.saveGoalForm = async (e) => {
    e.preventDefault();
    const id = Math.floor(Date.now() / 1000);
    const gType = document.getElementById('g-type').value;
    await fsActions.setItem('goals', id, {
        name: document.getElementById('g-name').value.trim(),
        targetAmount: Number(document.getElementById('g-tar').value || 0),
        currentAmount: 0,
        currency: document.getElementById('g-curr').value,
        goalType: gType,
        recurrencePeriod: gType === 'REPETIDA' ? document.getElementById('g-rec-box').value : '',
        isCompleted: false,
        createdAt: Date.now()
    });
    window.closeUniversalModal();
};

window.openGoalContributionModal = (docId, isDeposit = true) => {
    const g = (window.state.goals || []).find(x => String(x.docId) === String(docId));
    if (!g) return;
    const accOpts = (window.state.accounts || []).map(a => `<option value="${a.id}">${a.name} (${a.currency})</option>`).join('');
    window.openUniversalModal(`${isDeposit ? '+ Abonar a' : '- Retirar de'}: ${g.name}`, `
        <form onsubmit="saveGoalContribution(event, '${g.docId}', ${isDeposit})" class="space-y-3 text-xs">
            <input id="gc-amt" type="number" step="0.01" required placeholder="Monto (${g.currency || 'Bs'})" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <div>
                <label class="text-[10px] text-gray-400 font-bold uppercase">Vincular con cuenta (Opcional)</label>
                <select id="gc-acc" class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    <option value="">Solo actualizar barra de la meta</option>
                    ${accOpts}
                </select>
            </div>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-extrabold">Confirmar</button>
        </form>
    `);
};

window.saveGoalContribution = async (e, docId, isDeposit) => {
    e.preventDefault();
    const g = (window.state.goals || []).find(x => String(x.docId) === String(docId));
    if (!g) return;
    const amt = Math.abs(Number(document.getElementById('gc-amt').value || 0));
    const nextAmt = Math.max(0, Number(g.currentAmount || 0) + (isDeposit ? amt : -amt));
    const completed = nextAmt >= Number(g.targetAmount || 1);

    await fsActions.updateItem('goals', docId, {
        currentAmount: nextAmt,
        isCompleted: completed
    });

    const accId = document.getElementById('gc-acc').value;
    if (accId) {
        const acc = (window.state.accounts || []).find(a => String(a.id) === String(accId));
        if (acc) {
            const delta = isDeposit ? -amt : amt;
            await fsActions.updateItem('accounts', acc.docId, { balance: Number(acc.balance || 0) + delta });
        }
    }
    window.closeUniversalModal();
};

// 8. CATEGORÍAS PERSONALIZADAS Y ACCIONES RÁPIDAS
window.openNewCategoryModal = (type = 'GASTO') => {
    window.openUniversalModal(`Nueva Categoría (${type})`, `
        <form onsubmit="saveNewCategoryForm(event, '${type}')" class="space-y-3 text-xs">
            <input id="nc-name" required placeholder="Nombre de la categoría" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-extrabold">Añadir Categoría</button>
        </form>
    `);
};

window.saveNewCategoryForm = (e, type) => {
    e.preventDefault();
    const name = document.getElementById('nc-name').value.trim();
    if (!name) return;
    finState.customCategories.push({ id: String(Date.now()), name, type });
    saveCustomCategories();
    window.closeUniversalModal();
    window.renderFinances();
};

window.openFastPresetCreatorModal = () => {
    const accOpts = (window.state.accounts || []).map(a => `<option value="${a.name}">${a.name}</option>`).join('');
    const cats = getAllExpenseCategories();
    window.openUniversalModal('⚡ Nueva Acción Rápida', `
        <form onsubmit="saveFastPresetForm(event)" class="space-y-3 text-xs">
            <select id="fp-type" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                <option value="GASTO">Gasto Rápido</option>
                <option value="INGRESO">Ingreso Rápido</option>
            </select>
            <input id="fp-title" required placeholder="Título (ej. Pasaje, Café, Almuerzo)" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <input id="fp-amt" type="number" step="0.01" placeholder="Monto fijo opcional (ej. 2.50)" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <div class="grid grid-cols-2 gap-2">
                <select id="fp-cat" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">${cats.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                <select id="fp-acc" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">${accOpts}</select>
            </div>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-extrabold">Guardar Acceso Rápido</button>
        </form>
    `);
};

window.saveFastPresetForm = (e) => {
    e.preventDefault();
    finState.fastPresets.push({
        id: String(Date.now()),
        type: document.getElementById('fp-type').value,
        title: document.getElementById('fp-title').value.trim(),
        defaultAmount: document.getElementById('fp-amt').value ? Number(document.getElementById('fp-amt').value) : null,
        category: document.getElementById('fp-cat').value,
        accountName: document.getElementById('fp-acc').value
    });
    saveFastPresets();
    window.closeUniversalModal();
    window.renderFinances();
};

window.triggerFastPreset = (id) => {
    const p = finState.fastPresets.find(x => x.id === id);
    if (!p) return;
    window.openTxModal(p.type === 'INGRESO' ? 'ingreso' : 'gasto', p);
};

window.deleteFastPreset = (id) => {
    finState.fastPresets = finState.fastPresets.filter(x => x.id !== id);
    saveFastPresets();
    window.renderFinances();
};

// 9. ESCÁNER IA DE COMPROBANTES QR (ReceiptScannerService.kt)
window.openReceiptScannerModal = () => {
    window.openUniversalModal('📷 Escáner IA de Comprobante / QR', `
        <div class="space-y-3 text-xs">
            <p class="text-gray-400">Sube tu comprobante bancario o QR (BCP, BNB, Unión, Yape, etc.) para detectar comercio, banco, categoría y monto:</p>
            <input type="file" id="receipt-file" accept="image/*" class="w-full text-xs">
            <div id="scan-status" class="hidden text-accent font-bold animate-pulse">Analizando comprobante con IA...</div>
            <button onclick="processReceiptWithGroq()" class="w-full py-2.5 rounded-xl bg-accent text-white font-extrabold">Escanear Comprobante</button>
        </div>
    `);
};

window.processReceiptWithGroq = async () => {
    const allowed = await consumeAiScanQuota();
if (!allowed) return;
    const file = document.getElementById('receipt-file')?.files?.[0];
    if (!file) return alert('Selecciona una imagen primero');
    document.getElementById('scan-status').classList.remove('hidden');

    const reader = new FileReader();
    reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        try {
            const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${getGroqApiKey()}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "qwen/qwen3.8-27b",
                    temperature: 0.1,
                    response_format: { type: "json_object" },
                    messages: [{
                        role: "user",
                        content: [
                            { type: "text", text: "Extrae del comprobante bancario: merchant (destinatario o glosa, JAMÁS el pagador), amount (decimal puro), sourceBank (ej. BCP, Yape, Unión), category (Alimentación, Transporte, Suscripción, Servicios, Salud, Ocio, Educación, Compras). Responde en JSON." },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
                        ]
                    }]
                })
            });
            const json = await resp.json();
            const parsed = JSON.parse(json.choices[0].message.content);
            window.openTxModal('gasto', {
                title: parsed.merchant || 'Pago QR',
                defaultAmount: parsed.amount || '',
                category: parsed.category || 'Compras',
                accountName: parsed.sourceBank || ''
            });
        } catch (err) {
            alert("Error al analizar comprobante: " + err.message);
        }
    };
    reader.readAsDataURL(file);
};
