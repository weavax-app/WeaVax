import { fsActions } from './firebase-sync.js';

export function renderFinances() {
    const totalBs = window.state.accounts.reduce((sum, a) => {
        const rate = a.currency === 'USD' ? 6.96 : a.currency === 'EUR' ? 7.5 : 1;
        return sum + (Number(a.balance || 0) * rate);
    }, 0);

    document.getElementById('dashboard-total-balance').textContent = window.state.isBalanceVisible
        ? `Bs ${totalBs.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
        : 'Bs •••••';

    document.getElementById('accounts-grid').innerHTML = window.state.accounts.length === 0
        ? `<p class="text-xs text-gray-400 col-span-3">Sin cuentas registradas.</p>`
        : window.state.accounts.map(a => `
            <div class="p-5 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex justify-between items-start">
                <div>
                    <span class="text-[10px] font-bold uppercase text-gray-400">${a.type || 'Cuenta'} · ${a.currency}</span>
                    <h5 class="text-base font-extrabold mt-0.5">${a.name}</h5>
                    <p class="text-lg font-black text-accent mt-2">${window.state.isBalanceVisible ? `${a.currency} ${Number(a.balance || 0).toFixed(2)}` : `${a.currency} •••••`}</p>
                </div>
                <button onclick="deleteDocItem('accounts', '${a.id}')" class="text-xs text-gray-500 hover:text-red-400">✕</button>
            </div>
        `).join('');

    document.getElementById('transactions-list').innerHTML = window.state.transactions.length === 0
        ? `<p class="text-xs text-gray-400">Sin movimientos registrados.</p>`
        : window.state.transactions.map(tx => `
            <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                <div>
                    <p class="text-sm font-bold">${tx.title}</p>
                    <p class="text-[11px] text-gray-400">${tx.category || 'General'} · ${tx.accountName || ''} · ${tx.date || ''}</p>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="text-sm font-black ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}">
                        ${tx.type === 'income' ? '+' : '-'}${tx.currency || 'Bs'} ${Number(tx.amount || 0).toFixed(2)}
                    </span>
                    <button onclick="deleteTxItem('${tx.id}', '${tx.accountId}', ${tx.amount}, '${tx.type}')" class="text-xs text-gray-500 hover:text-red-400">✕</button>
                </div>
            </div>
        `).join('');
}

window.deleteTxItem = async (txId, accId, amount, type) => {
    if (!confirm('¿Eliminar movimiento y revertir saldo?')) return;
    await fsActions.remove('transactions', txId);
    const acc = window.state.accounts.find(a => a.id === accId);
    if (acc) {
        const reverted = type === 'income' ? Number(acc.balance) - Number(amount) : Number(acc.balance) + Number(amount);
        await fsActions.update('accounts', accId, { balance: reverted });
    }
};
