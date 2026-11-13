import { fsActions } from '../firebase-sync.js?v=5';
import { HABIT_ICONS, getReminderTimesList } from './habits-views.js';

let modalTempReminders = [];
let modalSelectedDays = new Set(['L', 'M', 'X', 'J', 'V', 'S', 'D']);

window.openHabitModal = (docId = null) => {
    const h = docId ? (window.state.habits || []).find(x => String(x.docId) === String(docId)) : null;

    modalTempReminders = h ? getReminderTimesList(h) : [];
    const initialDays = (h?.frequencyDays || 'L,M,X,J,V,S,D').toUpperCase().split(',').map(s => s.trim()).filter(Boolean);
    modalSelectedDays = new Set(initialDays.length ? initialDays : ['L', 'M', 'X', 'J', 'V', 'S', 'D']);

    const curType = h?.type || 'simple';
    const curFreq = h?.frequency || 'Diario';
    const curIcon = h?.icon || 'star';
    const visibleMiDia = h ? h.visibleInMiDia !== false : true;

    window.openUniversalModal(h ? '✎ Editar Hábito' : 'Nuevo Hábito', `
        <form onsubmit="saveHabitFullForm(event, ${h ? `'${h.docId}'` : 'null'})" class="space-y-3.5 text-xs max-h-[78vh] overflow-y-auto pr-1">
            <div>
                <label class="text-[10px] font-bold uppercase text-gray-400">Nombre del Hábito</label>
                <input id="h-name" required value="${h?.name || ''}" placeholder="Ej. Tomar creatina, Tomar agua, Meditar" class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] font-bold">
            </div>

            <div class="grid grid-cols-3 gap-2">
                <div>
                    <label class="text-[10px] font-bold uppercase text-gray-400">Icono</label>
                    <select id="h-icon" class="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                        ${Object.entries(HABIT_ICONS).map(([k, emo]) => `<option value="${k}" ${curIcon === k ? 'selected' : ''}>${emo} ${k}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="text-[10px] font-bold uppercase text-gray-400">Tipo</label>
                    <select id="h-type" onchange="onHabitTypeChange(this.value)" class="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                        <option value="simple" ${curType === 'simple' ? 'selected' : ''}>Simple (Check)</option>
                        <option value="quantity" ${curType === 'quantity' ? 'selected' : ''}>Cantidad</option>
                        <option value="duration" ${curType === 'duration' ? 'selected' : ''}>Duración (Min)</option>
                        <option value="counter" ${curType === 'counter' ? 'selected' : ''}>Contador</option>
                    </select>
                </div>
                <div>
                    <label class="text-[10px] font-bold uppercase text-gray-400">Categoría</label>
                    <select id="h-importance" onchange="onHabitImportanceChange(this.value)" class="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                        <option value="Esencial" ${h?.importance === 'Esencial' ? 'selected' : ''}>Esencial</option>
                        <option value="Normal" ${(!h || h?.importance === 'Normal') ? 'selected' : ''}>Normal</option>
                        <option value="Ligero" ${h?.importance === 'Ligero' ? 'selected' : ''}>Ligero</option>
                    </select>
                </div>
            </div>

            <div id="h-quant-box" class="${curType === 'simple' ? 'hidden' : ''} grid grid-cols-2 gap-2">
                <div>
                    <label class="text-[10px] font-bold uppercase text-gray-400">Meta Diaria</label>
                    <input id="h-target" type="number" min="1" value="${h?.targetValue && h.targetValue > 1 ? h.targetValue : 8}" class="mt-1 w-full px-3.5 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                </div>
                <div>
                    <label class="text-[10px] font-bold uppercase text-gray-400">Unidad</label>
                    <input id="h-unit" value="${h?.unit || (curType === 'duration' ? 'min' : 'vasos')}" placeholder="vasos, min, ml, pág" class="mt-1 w-full px-3.5 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                </div>
            </div>

            <div>
                <label class="text-[10px] font-bold uppercase text-gray-400">Frecuencia</label>
                <select id="h-freq" onchange="onHabitFreqChange(this.value)" class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    <option value="Diario" ${curFreq === 'Diario' ? 'selected' : ''}>Todos los días (Diario)</option>
                    <option value="Lun a Vie" ${curFreq === 'Lun a Vie' ? 'selected' : ''}>Lunes a Viernes</option>
                    <option value="Fines de semana" ${curFreq === 'Fines de semana' ? 'selected' : ''}>Fines de semana (Sáb y Dom)</option>
                    <option value="Personalizado" ${curFreq === 'Personalizado' ? 'selected' : ''}>Días personalizados</option>
                </select>
                <div id="h-days-picker" class="grid grid-cols-7 gap-1.5 mt-2"></div>
            </div>

            <div class="p-3 rounded-2xl bg-[#0A0A0F] border border-[#28283C] space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-[11px] font-bold text-gray-300">🔔 Horarios de Recordatorio</span>
                    <div class="flex items-center space-x-1.5">
                        <input type="time" id="h-new-rem-time" value="08:00" class="px-2 py-1 rounded bg-[#181824] border border-[#28283C] text-xs">
                        <button type="button" onclick="addHabitReminderTime()" class="px-2.5 py-1 rounded-lg bg-accent text-white font-bold">+ Hora</button>
                    </div>
                </div>
                <div id="h-rem-chips" class="flex flex-wrap gap-1.5"></div>
            </div>

            <div class="flex items-center justify-between p-3 rounded-2xl bg-[#0A0A0F] border border-[#28283C]">
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" id="h-visible-midia" ${visibleMiDia ? 'checked' : ''} class="w-4 h-4 rounded">
                    <span class="font-bold">Mostrar en "Mi Día"</span>
                </label>
                <div class="flex items-center space-x-1.5">
                    <span class="text-[10px] text-gray-400 font-bold">XP:</span>
                    <input id="h-xp" type="number" value="${h?.xpReward || 20}" class="w-16 px-2 py-1 rounded bg-[#181824] border border-[#28283C] text-center font-bold">
                </div>
            </div>

            <button type="submit" class="w-full py-3 rounded-xl bg-accent text-white font-extrabold shadow-lg">
                ${h ? 'Guardar Cambios' : 'Crear Hábito'}
            </button>
        </form>
    `);

    renderDaysPickerButtons();
    renderReminderChips();
};

window.onHabitTypeChange = (type) => {
    const box = document.getElementById('h-quant-box');
    if (box) box.classList.toggle('hidden', type === 'simple');
    const unitInput = document.getElementById('h-unit');
    if (unitInput && type === 'duration') unitInput.value = 'min';
};

window.onHabitImportanceChange = (imp) => {
    const xpInput = document.getElementById('h-xp');
    if (!xpInput) return;
    xpInput.value = imp === 'Esencial' ? 30 : imp === 'Ligero' ? 10 : 20;
};

window.onHabitFreqChange = (freq) => {
    if (freq === 'Diario') modalSelectedDays = new Set(['L', 'M', 'X', 'J', 'V', 'S', 'D']);
    else if (freq === 'Lun a Vie') modalSelectedDays = new Set(['L', 'M', 'X', 'J', 'V']);
    else if (freq === 'Fines de semana') modalSelectedDays = new Set(['S', 'D']);
    renderDaysPickerButtons();
};

window.toggleHabitDayBtn = (d) => {
    if (modalSelectedDays.has(d)) {
        if (modalSelectedDays.size > 1) modalSelectedDays.delete(d);
    } else {
        modalSelectedDays.add(d);
    }
    const freqSelect = document.getElementById('h-freq');
    if (freqSelect) freqSelect.value = 'Personalizado';
    renderDaysPickerButtons();
};

function renderDaysPickerButtons() {
    const box = document.getElementById('h-days-picker');
    if (!box) return;
    box.innerHTML = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => {
        const active = modalSelectedDays.has(d);
        return `<button type="button" onclick="toggleHabitDayBtn('${d}')" class="py-1.5 rounded-xl font-black border ${active ? 'bg-accent text-white border-accent' : 'bg-[#0A0A0F] border-[#28283C] text-gray-500'}">${d}</button>`;
    }).join('');
}

window.addHabitReminderTime = () => {
    const val = document.getElementById('h-new-rem-time')?.value;
    if (!val) return;
    if (!modalTempReminders.includes(val)) modalTempReminders.push(val);
    renderReminderChips();
};

window.removeHabitReminderTime = (timeStr) => {
    modalTempReminders = modalTempReminders.filter(t => t !== timeStr);
    renderReminderChips();
};

function renderReminderChips() {
    const box = document.getElementById('h-rem-chips');
    if (!box) return;
    if (modalTempReminders.length === 0) {
        box.innerHTML = `<span class="text-[10px] text-gray-500">Sin recordatorios añadidos</span>`;
        return;
    }
    box.innerHTML = modalTempReminders.map(t => `
        <span class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#181824] border border-[#28283C] text-[11px] font-mono">
            <span>⏰ ${t}</span>
            <button type="button" onclick="removeHabitReminderTime('${t}')" class="text-gray-400 hover:text-red-400 ml-1">✕</button>
        </span>
    `).join('');
}

window.saveHabitFullForm = async (e, existingDocId = null) => {
    e.preventDefault();
    const existing = existingDocId ? (window.state.habits || []).find(x => String(x.docId) === String(existingDocId)) : null;
    const id = existing ? Number(existing.id || existingDocId) : Math.floor(Date.now() / 1000);
    const type = document.getElementById('h-type').value;
    const targetVal = type === 'simple' ? 1 : Math.max(1, Number(document.getElementById('h-target').value || 1));
    const curVal = existing ? Number(existing.currentValue || 0) : 0;

    await fsActions.setItem('habits', id, {
        name: document.getElementById('h-name').value.trim(),
        icon: document.getElementById('h-icon').value,
        colorHex: '#8B5CF6',
        type,
        importance: document.getElementById('h-importance').value,
        frequency: document.getElementById('h-freq').value,
        frequencyDays: Array.from(modalSelectedDays).join(','),
        currentValue: curVal,
        targetValue: targetVal,
        unit: type === 'simple' ? '' : document.getElementById('h-unit').value.trim(),
        isCompleted: curVal >= targetVal && (existing ? Boolean(existing.isCompleted) : false),
        streak: existing ? Number(existing.streak || 0) : 0,
        xpReward: Number(document.getElementById('h-xp').value || 20),
        visibleInMiDia: document.getElementById('h-visible-midia').checked,
        displayOrder: existing ? Number(existing.displayOrder || 0) : (window.state.habits || []).length,
        reminderEnabled: modalTempReminders.length > 0,
        reminderTime: modalTempReminders.join(',')
    });

    window.closeUniversalModal();
};
