// Carga dinámica bajo demanda de ExcelJS y Chart.js desde CDN
async function ensureExportLibraries() {
    if (!window.ExcelJS) {
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
            s.onload = resolve;
            s.onerror = () => reject(new Error('No se pudo cargar ExcelJS'));
            document.head.appendChild(s);
        });
    }
    if (!window.Chart) {
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
            s.onload = resolve;
            s.onerror = () => reject(new Error('No se pudo cargar Chart.js'));
            document.head.appendChild(s);
        });
    }
}

// Conversión Hex -> HSL -> ARGB para derivar headerDark (~22%), subHeader (~35%) y softTint (90% blanco + 10% tema)
function hexToRgb(hex) {
    const clean = String(hex || '#8B5CF6').replace('#', '').trim();
    const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean.padEnd(6, '0');
    const num = parseInt(full, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToArgb(h, s, l) {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    const toHex = v => Math.round((v + m) * 255).toString(16).padStart(2, '0').toUpperCase();
    return `FF${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getThemeExcelPalette() {
    const rawHex = window.state?.profile?.themeColor || localStorage.getItem('weavax_theme_color') || '#8B5CF6';
    const { r, g, b } = hexToRgb(rawHex);
    const { h, s } = rgbToHsl(r, g, b);

    // 90% blanco + 10% color de acento
    const tintR = Math.round(255 * 0.90 + r * 0.10).toString(16).padStart(2, '0').toUpperCase();
    const tintG = Math.round(255 * 0.90 + g * 0.10).toString(16).padStart(2, '0').toUpperCase();
    const tintB = Math.round(255 * 0.90 + b * 0.10).toString(16).padStart(2, '0').toUpperCase();

    return {
        rawHex,
        headerDark: hslToArgb(h, Math.min(85, Math.max(45, s)), 22),
        subHeader: hslToArgb(h, Math.min(80, Math.max(40, s)), 35),
        softTint: `FF${tintR}${tintG}${tintB}`,
        accentArgb: `FF${rawHex.replace('#', '').toUpperCase().padEnd(6, '0')}`,
        borderGray: 'FFD1D5DB',
        textDark: 'FF111827',
        textMuted: 'FF4B5563'
    };
}

function getCurrencyRateToBs(curr) {
    const c = String(curr || 'Bs').toUpperCase();
    if (c === 'USD') return 6.96;
    if (c === 'EUR') return 7.55;
    if (c === 'ARS') return 0.007;
    if (c === 'PEN') return 1.85;
    if (c === 'CLP') return 0.0073;
    if (c === 'BRL') return 1.22;
    return 1;
}

// 1. MODAL SELECTOR DE PERIODO
window.openFinanceExcelExportModal = () => {
    const now = new Date();
    const curMonthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

    window.openUniversalModal('📊 Exportar Reporte Financiero (.xlsx)', `
        <form onsubmit="executeDynamicExcelExport(event)" class="space-y-4 text-xs">
            <p class="text-gray-400 leading-relaxed">
                Genera tu libro Excel dinámico con 3 hojas vinculadas por fórmulas reales, gráficos y la paleta de tu tema activo.
            </p>

            <div>
                <label class="text-[10px] font-bold uppercase text-gray-400">Periodo a Exportar</label>
                <select id="exp-period-mode" onchange="onExportPeriodModeChange(this.value)" class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] font-bold">
                    <option value="CURRENT_MONTH" selected>1. Mes actual (${curMonthName.charAt(0).toUpperCase() + curMonthName.slice(1)})</option>
                    <option value="SPECIFIC_MONTH">2. Mes y año específico</option>
                    <option value="LAST_30_DAYS">3. Últimos 30 días</option>
                    <option value="QUARTER">4. Trimestre (Q1 – Q4)</option>
                    <option value="CUSTOM_RANGE">5. Rango de fechas personalizado</option>
                    <option value="ALL_TIME">6. Todo el historial completo</option>
                </select>
            </div>

            <!-- Sub-opciones: Mes y año específico -->
            <div id="exp-opt-month" class="hidden grid grid-cols-2 gap-2">
                <select id="exp-sel-month" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    ${months.map((m, i) => `<option value="${i}" ${i === now.getMonth() ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
                <select id="exp-sel-year" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    ${years.map(y => `<option value="${y}" ${y === now.getFullYear() ? 'selected' : ''}>${y}</option>`).join('')}
                </select>
            </div>

            <!-- Sub-opciones: Trimestre -->
            <div id="exp-opt-quarter" class="hidden grid grid-cols-2 gap-2">
                <select id="exp-sel-q" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    <option value="1">Q1 (Ene – Mar)</option>
                    <option value="2">Q2 (Abr – Jun)</option>
                    <option value="3">Q3 (Jul – Sep)</option>
                    <option value="4" selected>Q4 (Oct – Dic)</option>
                </select>
                <select id="exp-sel-q-year" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    ${years.map(y => `<option value="${y}" ${y === now.getFullYear() ? 'selected' : ''}>${y}</option>`).join('')}
                </select>
            </div>

            <!-- Sub-opciones: Rango personalizado -->
            <div id="exp-opt-custom" class="hidden grid grid-cols-2 gap-2">
                <div>
                    <label class="text-[10px] text-gray-400 font-bold uppercase">Fecha Inicio</label>
                    <input id="exp-date-start" type="date" value="${new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)}" class="mt-1 w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                </div>
                <div>
                    <label class="text-[10px] text-gray-400 font-bold uppercase">Fecha Fin</label>
                    <input id="exp-date-end" type="date" value="${now.toISOString().slice(0, 10)}" class="mt-1 w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                </div>
            </div>

            <div id="exp-loading-msg" class="hidden text-center text-accent font-bold animate-pulse py-1">
                Construyendo libro Excel, fórmulas y gráficos...
            </div>

            <button type="submit" id="exp-submit-btn" class="w-full py-3 rounded-xl bg-accent text-white font-extrabold shadow-lg">
                ⬇️ Descargar Excel (.xlsx)
            </button>
        </form>
    `);
};

window.onExportPeriodModeChange = (mode) => {
    document.getElementById('exp-opt-month')?.classList.toggle('hidden', mode !== 'SPECIFIC_MONTH');
    document.getElementById('exp-opt-quarter')?.classList.toggle('hidden', mode !== 'QUARTER');
    document.getElementById('exp-opt-custom')?.classList.toggle('hidden', mode !== 'CUSTOM_RANGE');
};

function resolveSelectedPeriodRange() {
    const mode = document.getElementById('exp-period-mode')?.value || 'CURRENT_MONTH';
    const now = new Date();
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    if (mode === 'CURRENT_MONTH') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const label = `${months[now.getMonth()]} ${now.getFullYear()}`;
        return { start, end, label, fileSlug: `${months[now.getMonth()]}_${now.getFullYear()}` };
    }
    if (mode === 'SPECIFIC_MONTH') {
        const m = Number(document.getElementById('exp-sel-month').value);
        const y = Number(document.getElementById('exp-sel-year').value);
        const start = new Date(y, m, 1, 0, 0, 0, 0);
        const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
        const label = `${months[m]} ${y}`;
        return { start, end, label, fileSlug: `${months[m]}_${y}` };
    }
    if (mode === 'LAST_30_DAYS') {
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const start = new Date(end.getTime() - 29 * 86400000);
        start.setHours(0, 0, 0, 0);
        return { start, end, label: 'Últimos 30 días', fileSlug: 'Ultimos_30_Dias' };
    }
    if (mode === 'QUARTER') {
        const q = Number(document.getElementById('exp-sel-q').value);
        const y = Number(document.getElementById('exp-sel-q-year').value);
        const startMonth = (q - 1) * 3;
        const start = new Date(y, startMonth, 1, 0, 0, 0, 0);
        const end = new Date(y, startMonth + 3, 0, 23, 59, 59, 999);
        return { start, end, label: `Q${q} ${y}`, fileSlug: `Q${q}_${y}` };
    }
    if (mode === 'CUSTOM_RANGE') {
        const sVal = document.getElementById('exp-date-start').value;
        const eVal = document.getElementById('exp-date-end').value;
        const start = new Date(`${sVal}T00:00:00`);
        const end = new Date(`${eVal}T23:59:59`);
        return { start, end, label: `${sVal} a ${eVal}`, fileSlug: `${sVal}_al_${eVal}` };
    }
    // ALL_TIME
    const start = new Date(2020, 0, 1, 0, 0, 0, 0);
    const end = new Date(2099, 11, 31, 23, 59, 59, 999);
    return { start, end, label: 'Historial Completo', fileSlug: 'Historial_Completo' };
}

// Genera imágenes PNG de alta resolución usando un canvas oculto con Chart.js
async function renderChartBase64(config) {
    const canvas = document.createElement('canvas');
    canvas.width = 760;
    canvas.height = 420;
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const chart = new window.Chart(ctx, config);
    await new Promise(r => setTimeout(r, 120));
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    chart.destroy();
    canvas.remove();
    return dataUrl.split(',')[1];
}

// 2. GENERADOR PRINCIPAL DEL LIBRO EXCELJS DE 3 HOJAS
window.executeDynamicExcelExport = async (e) => {
    e.preventDefault();
    const loadingEl = document.getElementById('exp-loading-msg');
    const submitBtn = document.getElementById('exp-submit-btn');
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (submitBtn) submitBtn.disabled = true;

    try {
        await ensureExportLibraries();
        const pal = getThemeExcelPalette();
        const period = resolveSelectedPeriodRange();
        const baseCurrency = window.state?.profile?.preferredCurrency || localStorage.getItem('weavax_pref_currency') || 'Bs';

        const allTxs = [...(window.state?.transactions || [])].sort((a, b) => Number(a.date || 0) - Number(b.date || 0));
        const filteredTxs = allTxs.filter(tx => {
            const ts = Number(tx.date || Date.now());
            return ts >= period.start.getTime() && ts <= period.end.getTime();
        });

        const accounts = (window.state?.accounts || []).filter(a => !a.isArchived);
        const budgets = window.state?.budgets || [];

        const wb = new window.ExcelJS.Workbook();
        wb.creator = 'WeaVax LifeOS';
        wb.created = new Date();

        const thinBorder = {
            top: { style: 'thin', color: { argb: pal.borderGray } },
            left: { style: 'thin', color: { argb: pal.borderGray } },
            bottom: { style: 'thin', color: { argb: pal.borderGray } },
            right: { style: 'thin', color: { argb: pal.borderGray } }
        };

        const applyBanner = (ws, maxColLetter, title, subtitle) => {
            ws.mergeCells(`A1:${maxColLetter}1`);
            ws.getCell('A1').value = title;
            ws.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
            ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.headerDark } };
            ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
            ws.getRow(1).height = 30;

            ws.mergeCells(`A2:${maxColLetter}2`);
            ws.getCell('A2').value = subtitle;
            ws.getCell('A2').font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FFFFFFFF' } };
            ws.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.subHeader } };
            ws.getCell('A2').alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
            ws.getRow(2).height = 22;
        };

        // =========================================================================
        // HOJA 1: Movimientos
        // =========================================================================
        const wsMov = wb.addWorksheet('Movimientos', { views: [{ showGridLines: true }] });
        applyBanner(
            wsMov, 'K',
            'WEAVAX FINANCE — REPORTE DE MOVIMIENTOS Y TRANSACCIONES',
            `Periodo: ${period.label} · Generado el ${new Date().toLocaleDateString('es-BO')} · Moneda Base: ${baseCurrency}`
        );

        const txCount = filteredTxs.length;
        const lastTxRow = txCount > 0 ? 6 + txCount : 7;

        // Fila 4: KPIs superiores con fórmulas dinámicas
        wsMov.getRow(4).height = 24;
        const kpiPairs = [
            { lCol: 'A', vCol: 'B', label: 'Periodo Exportado:', val: period.label },
            { lCol: 'D', vCol: 'E', label: 'Moneda Base Reporte:', val: baseCurrency },
            { lCol: 'G', vCol: 'H', label: 'Total Registros:', val: { formula: `COUNTA(A7:A${lastTxRow})` } },
            { lCol: 'J', vCol: 'K', label: 'Balance Neto (Base):', val: { formula: `SUMIFS(K7:K${lastTxRow},C7:C${lastTxRow},"Ingreso")-SUMIFS(K7:K${lastTxRow},C7:C${lastTxRow},"Gasto")` }, numFmt: '#,##0.00' }
        ];
        kpiPairs.forEach(k => {
            const lc = wsMov.getCell(`${k.lCol}4`);
            const vc = wsMov.getCell(`${k.vCol}4`);
            lc.value = k.label;
            lc.font = { bold: true, size: 10, color: { argb: pal.textMuted } };
            lc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.softTint } };
            lc.border = thinBorder;

            vc.value = k.val;
            vc.font = { bold: true, size: 11, color: { argb: pal.textDark } };
            vc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.softTint } };
            vc.border = thinBorder;
            if (k.numFmt) vc.numFmt = k.numFmt;
        });

        // Fila 6: Cabeceras
        const movHeaders = ['ID', 'Fecha', 'Tipo', 'Nombre / Concepto', 'Categoría', 'Cuenta Origen', 'Cuenta Destino', 'Moneda', 'Monto', 'Tasa Conv.', 'Monto Base'];
        const hRowMov = wsMov.getRow(6);
        hRowMov.height = 25;
        movHeaders.forEach((text, i) => {
            const cell = hRowMov.getCell(i + 1);
            cell.value = text;
            cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.headerDark } };
            cell.alignment = { vertical: 'middle', horizontal: i >= 8 ? 'right' : 'center' };
            cell.border = thinBorder;
        });

        // Filas de transacciones reales
        if (txCount === 0) {
            const r = wsMov.getRow(7);
            r.getCell(1).value = 'SIN-MOV';
            r.getCell(2).value = new Date();
            r.getCell(2).numFmt = 'dd/mm/yyyy';
            r.getCell(3).value = 'Gasto';
            r.getCell(4).value = 'Sin movimientos en este periodo';
            r.getCell(5).value = 'General';
            r.getCell(6).value = '-';
            r.getCell(7).value = '-';
            r.getCell(8).value = baseCurrency;
            r.getCell(9).value = 0;
            r.getCell(10).value = 1;
            r.getCell(11).value = { formula: 'I7*J7' };
            for (let c = 1; c <= 11; c++) r.getCell(c).border = thinBorder;
        } else {
            filteredTxs.forEach((tx, idx) => {
                const rowNum = 7 + idx;
                const r = wsMov.getRow(rowNum);
                r.height = 20;
                const isTransfer = tx.type === 'transferencia';
                const isIncome = tx.type === 'ingreso' || (!isTransfer && Number(tx.amount) > 0);
                const tipoLabel = isTransfer ? 'Transferencia' : isIncome ? 'Ingreso' : 'Gasto';
                const curr = tx.currency || baseCurrency;
                const rate = curr === baseCurrency ? 1 : getCurrencyRateToBs(curr);

                r.getCell(1).value = `TX-${String(idx + 1).padStart(3, '0')}`;
                r.getCell(2).value = tx.date ? new Date(Number(tx.date)) : new Date();
                r.getCell(2).numFmt = 'dd/mm/yyyy';
                r.getCell(3).value = tipoLabel;
                r.getCell(4).value = tx.title || 'Movimiento';
                r.getCell(5).value = tx.category || (isTransfer ? 'Transferencia' : 'General');
                r.getCell(6).value = tx.accountName || 'Cuenta';
                r.getCell(7).value = isTransfer ? (tx.toAccountName || '-') : '-';
                r.getCell(8).value = curr;
                r.getCell(9).value = Math.abs(Number(tx.amount || 0));
                r.getCell(9).numFmt = '#,##0.00';
                r.getCell(10).value = rate;
                r.getCell(10).numFmt = '0.0000';
                r.getCell(11).value = { formula: `I${rowNum}*J${rowNum}` };
                r.getCell(11).numFmt = '#,##0.00';

                for (let c = 1; c <= 11; c++) {
                    const cell = r.getCell(c);
                    cell.border = thinBorder;
                    if (idx % 2 === 1) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.softTint } };
                    }
                    if (c === 1 || c === 2 || c === 3 || c === 8) cell.alignment = { horizontal: 'center' };
                }
            });
        }

        // Fila de TOTALES en Movimientos
        const totMovRowNum = lastTxRow + 1;
        const totMovRow = wsMov.getRow(totMovRowNum);
        totMovRow.height = 24;
        totMovRow.getCell(1).value = 'TOTALES';
        wsMov.mergeCells(`A${totMovRowNum}:H${totMovRowNum}`);
        totMovRow.getCell(9).value = { formula: `SUM(I7:I${lastTxRow})` };
        totMovRow.getCell(9).numFmt = '#,##0.00';
        totMovRow.getCell(11).value = { formula: `SUM(K7:K${lastTxRow})` };
        totMovRow.getCell(11).numFmt = '#,##0.00';
        for (let c = 1; c <= 11; c++) {
            const cell = totMovRow.getCell(c);
            cell.font = { bold: true, color: { argb: pal.textDark } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.softTint } };
            cell.border = thinBorder;
        }

        // =========================================================================
        // HOJA 2: Presupuestos_y_Cuentas
        // =========================================================================
        const wsPC = wb.addWorksheet('Presupuestos_y_Cuentas', { views: [{ showGridLines: true }] });
        applyBanner(
            wsPC, 'I',
            'CONTROL DE PRESUPUESTOS POR CATEGORÍA Y SALDOS DE CUENTAS',
            `Vinculado dinámicamente a la hoja Movimientos (${period.label})`
        );

        // TABLA 1: Control de Presupuestos por Categoría
        wsPC.getCell('A4').value = '1. CONTROL DE PRESUPUESTOS POR CATEGORÍA';
        wsPC.getCell('A4').font = { bold: true, size: 11, color: { argb: pal.headerDark } };

        const budHeaders = ['Categoría', 'Periodicidad', 'Moneda', 'Límite Presupuestado', 'Gastado (Moneda Orig.)', 'Gastado (Moneda Base)', 'Disponible (Base)', '% Ejecución', 'Estado'];
        const hRowBud = wsPC.getRow(5);
        hRowBud.height = 24;
        budHeaders.forEach((h, i) => {
            const cell = hRowBud.getCell(i + 1);
            cell.value = h;
            cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.headerDark } };
            cell.alignment = { vertical: 'middle', horizontal: i >= 3 && i <= 7 ? 'right' : 'center' };
            cell.border = thinBorder;
        });

        const budList = budgets.length > 0 ? budgets : [{ category: 'Sin presupuestos configurados', periodType: 'Mensual', currency: baseCurrency, limitAmount: 0 }];
        budList.forEach((b, idx) => {
            const rNum = 6 + idx;
            const r = wsPC.getRow(rNum);
            r.height = 20;
            const curr = b.currency || baseCurrency;
            const rate = curr === baseCurrency ? 1 : getCurrencyRateToBs(curr);

            r.getCell(1).value = b.category;
            r.getCell(2).value = b.periodType || 'Mensual';
            r.getCell(3).value = curr;
            r.getCell(4).value = Number(b.limitAmount || 0);
            r.getCell(4).numFmt = '#,##0.00';
            r.getCell(5).value = { formula: `F${rNum}/${rate}` };
            r.getCell(5).numFmt = '#,##0.00';
            r.getCell(6).value = { formula: `SUMIFS(Movimientos!$K$7:$K$${lastTxRow},Movimientos!$C$7:$C$${lastTxRow},"Gasto",Movimientos!$E$7:$E$${lastTxRow},A${rNum})` };
            r.getCell(6).numFmt = '#,##0.00';
            r.getCell(7).value = { formula: `(D${rNum}*${rate})-F${rNum}` };
            r.getCell(7).numFmt = '#,##0.00';
            r.getCell(8).value = { formula: `IF((D${rNum}*${rate})>0,F${rNum}/(D${rNum}*${rate}),0)` };
            r.getCell(8).numFmt = '0.0%';
            r.getCell(9).value = { formula: `IF(H${rNum}>1,"Excedido",IF(H${rNum}>=0.8,"Alerta","En Rango"))` };

            for (let c = 1; c <= 9; c++) {
                const cell = r.getCell(c);
                cell.border = thinBorder;
                if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.softTint } };
                if (c === 2 || c === 3 || c === 9) cell.alignment = { horizontal: 'center' };
            }
        });

        const lastBudRow = 5 + budList.length;
        const totBudRowNum = lastBudRow + 1;
        const totBudRow = wsPC.getRow(totBudRowNum);
        totBudRow.height = 24;
        totBudRow.getCell(1).value = 'TOTAL PRESUPUESTOS';
        wsPC.mergeCells(`A${totBudRowNum}:C${totBudRowNum}`);
        totBudRow.getCell(4).value = { formula: `SUM(D6:D${lastBudRow})` };
        totBudRow.getCell(5).value = { formula: `SUM(E6:E${lastBudRow})` };
        totBudRow.getCell(6).value = { formula: `SUM(F6:F${lastBudRow})` };
        totBudRow.getCell(7).value = { formula: `SUM(G6:G${lastBudRow})` };
        totBudRow.getCell(8).value = { formula: `IF(D${totBudRowNum}>0,F${totBudRowNum}/D${totBudRowNum},0)` };
        totBudRow.getCell(9).value = { formula: `IF(H${totBudRowNum}>1,"Excedido",IF(H${totBudRowNum}>=0.8,"Alerta","En Rango"))` };
        [4, 5, 6, 7].forEach(c => totBudRow.getCell(c).numFmt = '#,##0.00');
        totBudRow.getCell(8).numFmt = '0.0%';
        for (let c = 1; c <= 9; c++) {
            const cell = totBudRow.getCell(c);
            cell.font = { bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.softTint } };
            cell.border = thinBorder;
        }

        // TABLA 2: Control de Cuentas y Flujo de Transferencias (2 filas debajo de Presupuestos)
        const accTitleRowNum = totBudRowNum + 2;
        wsPC.getCell(`A${accTitleRowNum}`).value = '2. CONTROL DE CUENTAS Y FLUJO DE TRANSFERENCIAS';
        wsPC.getCell(`A${accTitleRowNum}`).font = { bold: true, size: 11, color: { argb: pal.headerDark } };

        const accHeaderRowNum = accTitleRowNum + 1;
        const accHeaders = ['Cuenta / Billetera', 'Moneda Principal', 'Saldo Inicial', '(+) Ingresos', '(-) Gastos', '(+) Transf. Recibidas', '(-) Transf. Enviadas', 'Saldo Actual', 'Participación %'];
        const hRowAcc = wsPC.getRow(accHeaderRowNum);
        hRowAcc.height = 24;
        accHeaders.forEach((h, i) => {
            const cell = hRowAcc.getCell(i + 1);
            cell.value = h;
            cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.headerDark } };
            cell.alignment = { vertical: 'middle', horizontal: i >= 2 ? 'right' : 'center' };
            cell.border = thinBorder;
        });

        const accList = accounts.length > 0 ? accounts : [{ name: 'Sin cuentas registradas', currency: baseCurrency, balance: 0 }];
        const firstAccRow = accHeaderRowNum + 1;
        const lastAccRow = accHeaderRowNum + accList.length;
        const totAccRowNum = lastAccRow + 1;

        accList.forEach((a, idx) => {
            const rNum = firstAccRow + idx;
            const r = wsPC.getRow(rNum);
            r.height = 20;
            const curr = a.currency || baseCurrency;
            const rate = curr === baseCurrency ? 1 : getCurrencyRateToBs(curr);

            r.getCell(1).value = a.name;
            r.getCell(2).value = curr;
            r.getCell(3).value = Number(a.initialBalance ?? a.balance ?? 0);
            r.getCell(4).value = { formula: `SUMIFS(Movimientos!$I$7:$I$${lastTxRow},Movimientos!$C$7:$C$${lastTxRow},"Ingreso",Movimientos!$F$7:$F$${lastTxRow},A${rNum})` };
            r.getCell(5).value = { formula: `SUMIFS(Movimientos!$I$7:$I$${lastTxRow},Movimientos!$C$7:$C$${lastTxRow},"Gasto",Movimientos!$F$7:$F$${lastTxRow},A${rNum})` };
            r.getCell(6).value = { formula: `SUMIFS(Movimientos!$I$7:$I$${lastTxRow},Movimientos!$C$7:$C$${lastTxRow},"Transferencia",Movimientos!$G$7:$G$${lastTxRow},A${rNum})` };
            r.getCell(7).value = { formula: `SUMIFS(Movimientos!$I$7:$I$${lastTxRow},Movimientos!$C$7:$C$${lastTxRow},"Transferencia",Movimientos!$F$7:$F$${lastTxRow},A${rNum})` };
            r.getCell(8).value = { formula: `C${rNum}+D${rNum}-E${rNum}+F${rNum}-G${rNum}` };
            r.getCell(9).value = { formula: `IF($H$${totAccRowNum}>0,(H${rNum}*${rate})/$H$${totAccRowNum},0)` };

            [3, 4, 5, 6, 7, 8].forEach(c => r.getCell(c).numFmt = '#,##0.00');
            r.getCell(9).numFmt = '0.0%';

            for (let c = 1; c <= 9; c++) {
                const cell = r.getCell(c);
                cell.border = thinBorder;
                if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.softTint } };
                if (c === 2) cell.alignment = { horizontal: 'center' };
            }
        });

        const totAccRow = wsPC.getRow(totAccRowNum);
        totAccRow.height = 24;
        totAccRow.getCell(1).value = 'TOTAL CONSOLIDADO CUENTAS';
        wsPC.mergeCells(`A${totAccRowNum}:B${totAccRowNum}`);
        [3, 4, 5, 6, 7, 8].forEach(c => {
            const colL = String.fromCharCode(64 + c);
            totAccRow.getCell(c).value = { formula: `SUM(${colL}${firstAccRow}:${colL}${lastAccRow})` };
            totAccRow.getCell(c).numFmt = '#,##0.00';
        });
        totAccRow.getCell(9).value = { formula: `SUM(I${firstAccRow}:I${lastAccRow})` };
        totAccRow.getCell(9).numFmt = '0.0%';
        for (let c = 1; c <= 9; c++) {
            const cell = totAccRow.getCell(c);
            cell.font = { bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.softTint } };
            cell.border = thinBorder;
        }

        // =========================================================================
        // HOJA 3: Dashboard_y_Graficos
        // =========================================================================
        const wsDash = wb.addWorksheet('Dashboard_y_Graficos', { views: [{ showGridLines: true }] });
        applyBanner(
            wsDash, 'H',
            'WEAVAX FINANCE — DASHBOARD EJECUTIVO Y ANÁLISIS VISUAL',
            `Resumen estadístico del periodo: ${period.label}`
        );

        // Fila 4: Filtro Fecha Inicio (E4) y Fecha Fin (G4)
        wsDash.getCell('D4').value = 'Fecha Inicio:';
        wsDash.getCell('D4').font = { bold: true, size: 10 };
        wsDash.getCell('E4').value = period.start;
        wsDash.getCell('E4').numFmt = 'dd/mm/yyyy';
        wsDash.getCell('E4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.softTint } };
        wsDash.getCell('E4').border = thinBorder;

        wsDash.getCell('F4').value = 'Fecha Fin:';
        wsDash.getCell('F4').font = { bold: true, size: 10 };
        wsDash.getCell('G4').value = period.end;
        wsDash.getCell('G4').numFmt = 'dd/mm/yyyy';
        wsDash.getCell('G4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.softTint } };
        wsDash.getCell('G4').border = thinBorder;

        // Tarjetas KPI superiores (Filas 6–7)
        const dashKpis = [
            { colStart: 'A', colEnd: 'B', title: 'INGRESOS DEL PERIODO', formula: `SUMIFS(Movimientos!$K$7:$K$${lastTxRow},Movimientos!$C$7:$C$${lastTxRow},"Ingreso")` },
            { colStart: 'C', colEnd: 'D', title: 'GASTOS DEL PERIODO', formula: `SUMIFS(Movimientos!$K$7:$K$${lastTxRow},Movimientos!$C$7:$C$${lastTxRow},"Gasto")` },
            { colStart: 'E', colEnd: 'F', title: 'FLUJO NETO (AHORRO)', formula: 'A7-C7' },
            { colStart: 'G', colEnd: 'H', title: 'TRANSFERENCIAS INTERNAS', formula: `SUMIFS(Movimientos!$K$7:$K$${lastTxRow},Movimientos!$C$7:$C$${lastTxRow},"Transferencia")` }
        ];
        wsDash.getRow(6).height = 20;
        wsDash.getRow(7).height = 28;
        dashKpis.forEach(k => {
            wsDash.mergeCells(`${k.colStart}6:${k.colEnd}6`);
            wsDash.mergeCells(`${k.colStart}7:${k.colEnd}7`);
            const tCell = wsDash.getCell(`${k.colStart}6`);
            tCell.value = k.title;
            tCell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
            tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.subHeader } };
            tCell.alignment = { horizontal: 'center', vertical: 'middle' };

            const vCell = wsDash.getCell(`${k.colStart}7`);
            vCell.value = { formula: k.formula };
            vCell.font = { bold: true, size: 13, color: { argb: pal.textDark } };
            vCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.softTint } };
            vCell.alignment = { horizontal: 'center', vertical: 'middle' };
            vCell.numFmt = `"${baseCurrency} "#,##0.00`;
        });

        // Tabla Resumen por Categoría del Periodo (A10:D...)
        wsDash.getCell('A9').value = 'RESUMEN POR CATEGORÍA DEL PERIODO';
        wsDash.getCell('A9').font = { bold: true, size: 11, color: { argb: pal.headerDark } };

        const catDashHeaders = ['Categoría', 'Gasto Periodo', 'Presupuesto', '% del Gasto'];
        const hCatDash = wsDash.getRow(10);
        hCatDash.height = 22;
        catDashHeaders.forEach((h, i) => {
            const c = hCatDash.getCell(i + 1);
            c.value = h;
            c.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.headerDark } };
            c.border = thinBorder;
        });

        const uniqueCats = Array.from(new Set([
            ...filteredTxs.filter(t => t.type === 'gasto' || Number(t.amount) < 0).map(t => t.category || 'General'),
            ...budgets.map(b => b.category)
        ])).filter(Boolean);
        const catRows = uniqueCats.length > 0 ? uniqueCats : ['General'];
        const lastCatDashRow = 10 + catRows.length;
        const totCatDashRowNum = lastCatDashRow + 1;

        catRows.forEach((catName, idx) => {
            const rNum = 11 + idx;
            const r = wsDash.getRow(rNum);
            r.getCell(1).value = catName;
            r.getCell(2).value = { formula: `SUMIFS(Movimientos!$K$7:$K$${lastTxRow},Movimientos!$C$7:$C$${lastTxRow},"Gasto",Movimientos!$E$7:$E$${lastTxRow},A${rNum})` };
            r.getCell(2).numFmt = '#,##0.00';
            r.getCell(3).value = { formula: `SUMIFS(Presupuestos_y_Cuentas!$D$6:$D$${lastBudRow},Presupuestos_y_Cuentas!$A$6:$A$${lastBudRow},A${rNum})` };
            r.getCell(3).numFmt = '#,##0.00';
            r.getCell(4).value = { formula: `IF($B$${totCatDashRowNum}>0,B${rNum}/$B$${totCatDashRowNum},0)` };
            r.getCell(4).numFmt = '0.0%';
            for (let c = 1; c <= 4; c++) r.getCell(c).border = thinBorder;
        });

        const totCatDashRow = wsDash.getRow(totCatDashRowNum);
        totCatDashRow.getCell(1).value = 'TOTAL PERIODO';
        totCatDashRow.getCell(2).value = { formula: `SUM(B11:B${lastCatDashRow})` };
        totCatDashRow.getCell(2).numFmt = '#,##0.00';
        totCatDashRow.getCell(3).value = { formula: `SUM(C11:C${lastCatDashRow})` };
        totCatDashRow.getCell(3).numFmt = '#,##0.00';
        totCatDashRow.getCell(4).value = { formula: `SUM(D11:D${lastCatDashRow})` };
        totCatDashRow.getCell(4).numFmt = '0.0%';
        for (let c = 1; c <= 4; c++) {
            const cell = totCatDashRow.getCell(c);
            cell.font = { bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.softTint } };
            cell.border = thinBorder;
        }

        // Tabla Desglose por Moneda de Origen (F10:H...)
        wsDash.getCell('F9').value = 'DESGLOSE POR MONEDA DE ORIGEN';
        wsDash.getCell('F9').font = { bold: true, size: 11, color: { argb: pal.headerDark } };
        ['Moneda', 'Ingresos Orig.', 'Gastos Orig.'].forEach((h, i) => {
            const c = wsDash.getRow(10).getCell(6 + i);
            c.value = h;
            c.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.headerDark } };
            c.border = thinBorder;
        });

        const usedCurrencies = Array.from(new Set([baseCurrency, ...filteredTxs.map(t => t.currency || baseCurrency)]));
        usedCurrencies.forEach((currCode, idx) => {
            const rNum = 11 + idx;
            const r = wsDash.getRow(rNum);
            r.getCell(6).value = currCode;
            r.getCell(7).value = { formula: `SUMIFS(Movimientos!$I$7:$I$${lastTxRow},Movimientos!$C$7:$C$${lastTxRow},"Ingreso",Movimientos!$H$7:$H$${lastTxRow},F${rNum})` };
            r.getCell(7).numFmt = '#,##0.00';
            r.getCell(8).value = { formula: `SUMIFS(Movimientos!$I$7:$I$${lastTxRow},Movimientos!$C$7:$C$${lastTxRow},"Gasto",Movimientos!$H$7:$H$${lastTxRow},F${rNum})` };
            r.getCell(8).numFmt = '#,##0.00';
            for (let c = 6; c <= 8; c++) r.getCell(c).border = thinBorder;
        });

        // =========================================================================
        // GENERACIÓN E INCRUSTACIÓN DE LOS 2 GRÁFICOS EN ALTA RESOLUCIÓN (Chart.js)
        // =========================================================================
        const spentByCat = catRows.map(cat =>
            filteredTxs
                .filter(t => (t.type === 'gasto' || Number(t.amount) < 0) && (t.category || 'General') === cat)
                .reduce((s, t) => s + (Math.abs(Number(t.amount || 0)) * getCurrencyRateToBs(t.currency || baseCurrency)), 0)
        );
        const budgetByCat = catRows.map(cat =>
            budgets
                .filter(b => b.category === cat)
                .reduce((s, b) => s + (Number(b.limitAmount || 0) * getCurrencyRateToBs(b.currency || baseCurrency)), 0)
        );

        const chartColors = [pal.rawHex, '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444', '#6366F1'];

        const doughnutBase64 = await renderChartBase64({
            type: 'doughnut',
            data: {
                labels: catRows,
                datasets: [{
                    data: spentByCat.some(v => v > 0) ? spentByCat : [1],
                    backgroundColor: chartColors,
                    borderWidth: 2,
                    borderColor: '#FFFFFF'
                }]
            },
            options: {
                responsive: false,
                plugins: {
                    title: { display: true, text: `Distribución de Gastos por Categoría (${period.label})`, font: { size: 16, weight: 'bold' }, color: '#111827' },
                    legend: { position: 'right' }
                }
            }
        });

        const barBase64 = await renderChartBase64({
            type: 'bar',
            data: {
                labels: catRows,
                datasets: [
                    { label: `Gasto Real (${baseCurrency})`, data: spentByCat, backgroundColor: pal.rawHex, borderRadius: 6 },
                    { label: `Presupuesto (${baseCurrency})`, data: budgetByCat, backgroundColor: '#CBD5E1', borderRadius: 6 }
                ]
            },
            options: {
                responsive: false,
                plugins: {
                    title: { display: true, text: 'Gasto Real vs. Presupuesto por Categoría', font: { size: 16, weight: 'bold' }, color: '#111827' }
                },
                scales: { y: { beginAtZero: true } }
            }
        });

        const chartStartRow = Math.max(totCatDashRowNum, 11 + usedCurrencies.length) + 2;
        const imgId1 = wb.addImage({ base64: doughnutBase64, extension: 'png' });
        const imgId2 = wb.addImage({ base64: barBase64, extension: 'png' });

        wsDash.addImage(imgId1, { tl: { col: 0, row: chartStartRow }, ext: { width: 440, height: 250 } });
        wsDash.addImage(imgId2, { tl: { col: 4, row: chartStartRow }, ext: { width: 460, height: 250 } });

        // Ajuste automático del ancho de columnas en las 3 hojas
        [wsMov, wsPC, wsDash].forEach(ws => {
            ws.columns.forEach((col, i) => {
                let maxLen = 14;
                col.eachCell({ includeEmpty: false }, cell => {
                    if (cell.row <= 2) return;
                    const valStr = cell.value && typeof cell.value === 'object' ? '123,456.00' : String(cell.value || '');
                    if (valStr.length + 4 > maxLen) maxLen = Math.min(36, valStr.length + 4);
                });
                col.width = maxLen;
            });
        });

        // Descargar archivo .xlsx real
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `WeaVax_Finanzas_${period.fileSlug}.xlsx`;
        a.click();

        window.closeUniversalModal();
    } catch (err) {
        console.error('Error generando Excel:', err);
        alert('Error al generar el reporte Excel: ' + err.message);
    } finally {
        if (loadingEl) loadingEl.classList.add('hidden');
        if (submitBtn) submitBtn.disabled = false;
    }
};
