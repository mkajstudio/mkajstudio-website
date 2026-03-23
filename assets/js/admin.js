/**
 * MKAJ ADMIN ENGINE - V37.0 (FINAL STABLE & ERROR-FREE)
 * Updates: Robust Null-Checking, Pakej V2.0 Logic, Phone Fix, n8n Sync
 */

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-j1s4lBeTyeY4Euw6-iec2sZPNOdDlEdtfjeJPTc-T2yCOciUdpO1LQI1kvRcuykF/exec";
const N8N_WEBHOOK_URL = "https://api.mkajstudio.com/webhook/mkaj-settle-balance"; 

let allBookings = [];
let currentView = 'table'; 
let sortConfig = { key: 'Date', direction: 'asc' }; 
let originalDataCopy = null; // Simpan data asal untuk dibandingkan
let searchTimeout = null; // Variable baru untuk kawal delay carian

// --- KOD PIN ADMIN ---
const ADMIN_PIN = "0000"; // <--- Tukar nombor PIN Tuan di sini
if (sessionStorage.getItem("admin_auth") !== "true") {
    let p = prompt("Sila Masukkan KOD PIN ADMIN:");
    if (p === ADMIN_PIN) {
        sessionStorage.setItem("admin_auth", "true");
    } else {
        alert("KOD PIN SALAH!");
        window.location.href = "index.html"; // Tendang balik ke Home kalau salah
    }
}

// ==========================================
// 1. UTILS: DATA CLEANING & FORMATTING
// ==========================================

function clean(str) { 
    if (!str) return "";
    return str.toString().toLowerCase().replace(/[^a-z0-9]/g, ''); 
}

function cleanMatch(str) { 
    return clean(str);
}

function formatPhoneForDB(phone) {
    if (!phone) return "";
    let cleaned = phone.toString().replace(/\D/g, ''); 
    if (cleaned.startsWith('60')) return cleaned;
    if (cleaned.startsWith('0')) return '6' + cleaned;
    return '60' + cleaned;
}

function cleanMuaForDB(str) { 
    if (!str || str === "Tiada") return "Tiada";
    return str.split(" (")[0].trim(); 
}

function cleanFrameForDB(str) {
    if (!str || str === "Tiada") return "Tiada";
    let text = str.split(" (+RM")[0];
    return text.replace(/[()"]/g, '').trim(); 
}

function normalizeDate(d) {
    if(!d) return "";
    let s = d.toString().trim();
    if(s.includes('/')) {
        let p = s.split('/');
        return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
    }
    return s.split('T')[0];
}

function formatDateUI(s) {
    if (!s) return "-";
    let d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString('ms-MY', {day:'numeric', month:'short', year:'numeric'});
}

function getLocalISO(dateObj) {
    return dateObj.toLocaleDateString('en-CA');
}

// ==========================================
// 2. INITIALIZE & FETCH DATA
// ==========================================

window.onload = function() {
    populateDropdowns();
    fetchData();
};

async function fetchData() {
    const loader = document.getElementById('loader');
    if(loader) loader.classList.remove('hidden');
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=get_data&t=${Date.now()}`);
        allBookings = await response.json();
        applyFilters();
    } catch (e) { 
        console.error("Database Error:", e);
        alert("Gagal memuatkan database.");
    } finally { 
        if(loader) loader.classList.add('hidden'); 
    }
}

// ==========================================
// 3. PRICING ENGINE (SYSTEM V2.0 LOGIC)
// ==========================================

window.recalculatePrice = function() {
    const pkgSelect = document.getElementById('form-package');
    const themeSelect = document.getElementById('form-theme');
    const adultInput = document.getElementById('form-pax-adult');
    const kidInput = document.getElementById('form-pax-kid');
    const etCheckbox = document.getElementById('form-extraTime');
    
    if (!pkgSelect || !themeSelect) return;

    let adults = parseInt(adultInput.value) || 0;
    let kids = parseInt(kidInput.value) || 0;
    let totalHead = adults + kids;

    // A. Mapping Tema ke Pakej
    const themeData = Object.values(rayaThemesDetail).find(t => t.title === themeSelect.value);
    const themeType = themeData ? themeData.type : 'standard';

    if (themeType === 'mini') {
        pkgSelect.value = "PAKEJ MINI";
        if (totalHead > 4 || adults > 2) {
            alert("⚠️ Had Tema Mini: Maksimum 2 Dewasa + 2 Kanak-kanak.");
            adultInput.value = 2; kidInput.value = 0; adults = 2;
        }
    } else {
        if (pkgSelect.value.includes("MINI")) pkgSelect.value = "PAKEJ SALAM";
    }

    // B. Cari Config Pakej
    const pkgName = pkgSelect.value;
    const pkgKey = Object.keys(rayaPackages).find(k => rayaPackages[k].name === pkgName);
    const pkgConfig = rayaPackages[pkgKey] || rayaPackages.salam;

    let total = pkgConfig.price || 0;

    // C. Extra Pax Logic
    if (!pkgConfig.strict && adults > pkgConfig.baseAdult) {
        total += (adults - pkgConfig.baseAdult) * (addonsPrice?.extraPax || 10);
    }

    // D. Extra Time Logic (Pakej 3 Disable)
    if (pkgConfig.noExtraTime) {
        etCheckbox.checked = false;
        etCheckbox.disabled = true;
        etCheckbox.parentElement.style.opacity = "0.5";
    } else {
        etCheckbox.disabled = false;
        etCheckbox.parentElement.style.opacity = "1";
        if (etCheckbox.checked) total += (addonsPrice?.extraTime || 20);
    }

    // E. MUA Total
    const muaName = document.getElementById('form-mua').value;
    const muaObj = muaOptions.find(m => m.name === muaName);
    if(muaObj) total += muaObj.price;

    // F. Frame Logic & Discount
    const frameName = document.getElementById('form-frame').value;
    const frameObj = frameAddons.find(f => f.name === frameName);
    if(frameObj && frameObj.price > 0) {
        let fPrice = frameObj.price;
        if (pkgConfig.discountFrame) fPrice = fPrice * (1 - pkgConfig.discountFrame);
        total += fPrice;
    }

    document.getElementById('form-total').innerText = Math.round(total);
};

// ==========================================
// 4. ACTION HANDLERS (SAVE, EDIT, STATUS)
// ==========================================

window.saveCustomer = function(e) {
    e.preventDefault();
    const orderID = document.getElementById('form-orderID').value;

    // Jika Walk-in: Terus simpan tanpa page perbandingan
    if (orderID === "MANUAL" || orderID === "") {
        window.finalSaveBooking(false); 
    } 
    // Jika Edit: Tunjuk Perbandingan Dulu
    else {
        window.showComparison();
    }
};

window.editCustomer = function(id, rowIndex) {
    const b = allBookings.find(x => x.row_index === rowIndex);
    if(!b) { alert("Data tidak dijumpai."); return; }

    // --- TAMBAHAN BARU ---
    document.getElementById('form-orderID').setAttribute('data-row', rowIndex);
    originalDataCopy = JSON.parse(JSON.stringify(b)); // Salin data asal secara mendalam
    document.getElementById('customerForm').classList.remove('hidden'); 
    document.getElementById('editReviewSection').classList.add('hidden');

    try {
        document.getElementById('modalTitle').innerText = `EDIT: ${id}`;
        document.getElementById('form-orderID').value = b.OrderID || "";
        document.getElementById('form-name').value = b.Name || "";
        document.getElementById('form-phone').value = b.Phone || "";
        document.getElementById('form-theme').value = b.Theme || "";
        
        // Safety check untuk Pakej
        const pkgSelect = document.getElementById('form-package');
        const dbPackage = (b.Package || "").toUpperCase();
        if (dbPackage.includes("MINI")) pkgSelect.value = "PAKEJ MINI";
        else if (dbPackage.includes("SALAM")) pkgSelect.value = "PAKEJ SALAM";
        else if (dbPackage.includes("RIANG")) pkgSelect.value = "PAKEJ RIANG";
        else if (dbPackage.includes("CERIA")) pkgSelect.value = "PAKEJ CERIA";
        else if (dbPackage.includes("LEBARAN")) pkgSelect.value = "PAKEJ LEBARAN";
        else pkgSelect.selectedIndex = 1; // Default Salam

        document.getElementById('form-date').value = normalizeDate(b.Date);
        document.getElementById('form-time').value = b.Time || "09:30";

        // Pax Safety Parsing
        const paxStr = b.Pax || "";
        const adultMatch = paxStr.match(/(\d+)\s*Dewasa/);
        const kidMatch = paxStr.match(/(\d+)\s*Kanak/);
        document.getElementById('form-pax-adult').value = adultMatch ? adultMatch[1] : 1;
        document.getElementById('form-pax-kid').value = kidMatch ? kidMatch[1] : 0;

        // Addons & Frame Match
        const dbAddonsClean = clean(b.AddOns || "");
        document.getElementById('form-extraTime').checked = /extratime/i.test(dbAddonsClean);

        const mSelect = document.getElementById('form-mua'); mSelect.value = "Tiada";
        for (let i = 0; i < mSelect.options.length; i++) {
            const optClean = clean(mSelect.options[i].value.split(" (")[0]);
            if (optClean !== "tiada" && dbAddonsClean.includes(optClean)) { mSelect.selectedIndex = i; break; }
        }

        const fSelect = document.getElementById('form-frame'); fSelect.value = "Tiada";
        const dbFrameClean = clean(b.Frame || "");
        for (let i = 0; i < fSelect.options.length; i++) {
            const optClean = clean(fSelect.options[i].value);
            if (optClean !== "tiada" && (dbFrameClean.includes(optClean) || optClean.includes(dbFrameClean))) { fSelect.selectedIndex = i; break; }
        }
        
        document.getElementById('form-photoNumber').value = b.PhotoNumber || "";
        document.getElementById('form-photographer').value = b.Photographer || "Belum Ditetapkan";
        
        recalculatePrice();
        openModal('customerModal');
        fetchAdminSlots(); 
    } catch (err) {
        console.error("Critical Edit Error:", err);
        alert("Ralat teknikal semasa membuka data.");
    }
};

window.debounceFilter = function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        applyFilters();
    }, 300); // Tunggu 300ms selepas berhenti menaip baru proses
};

// ==========================================
// 5. VIEW, FILTERS & SORTING
// ==========================================

window.applyFilters = function() {
    const s = (document.getElementById('adminSearch')?.value || "").toLowerCase();
    const fD = document.getElementById('filterDate')?.value || "all";
    const fT = document.getElementById('filterTheme')?.value || "all";
    const fS = document.getElementById('filterStatus')?.value || "all";
    
    const todayStr = getLocalISO(new Date());

    let filtered = allBookings.filter(b => {
        const name = (b.Name || "").toLowerCase();
        const oid = (b.OrderID || "").toLowerCase();
        const phone = (b.Phone || "").toLowerCase();

        const matchSearch = name.includes(s) || oid.includes(s) || phone.includes(s);
        const matchTheme = fT === 'all' || b.Theme === fT;
        const matchStatus = fS === 'all' || b.Status === fS;
        
        let matchDate = true; 
        const bDate = normalizeDate(b.Date);
        if (fD === 'today') matchDate = (bDate === todayStr);
        else if (fD === 'tomorrow') {
            let tObj = new Date(); tObj.setDate(tObj.getDate()+1);
            matchDate = (bDate === getLocalISO(tObj));
        }
        else if (fD === 'week') {
            let c = new Date(); 
            let startW = getLocalISO(new Date(c.setDate(c.getDate() - c.getDay())));
            let endW = getLocalISO(new Date(c.setDate(c.getDate() - c.getDay() + 6)));
            matchDate = (bDate >= startW && bDate <= endW);
        }
        else if (fD === 'custom') {
            const st = document.getElementById('startDate').value;
            const en = document.getElementById('endDate').value;
            if (st && en) matchDate = (bDate >= st && bDate <= en); else if (st) matchDate = (bDate === st);
        }
        return matchSearch && matchTheme && matchStatus && matchDate;
    });

    filtered = sortData(filtered);
    renderMainView(filtered);
    if(document.getElementById('stats-total')) document.getElementById('stats-total').innerText = `Total: ${filtered.length} Rekod`;
};

function renderMainView(data) {
    if (currentView === 'table') renderTable(data);
    else renderCards(data);
}

function renderTable(data) {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;

    let htmlBuffer = []; // Accumulator untuk kelajuan
    let lastDate = "";

    data.forEach(b => {
        const currentDate = formatDateUI(b.Date);
        
        // 1. Logik Separator Tarikh
        if (currentDate !== lastDate) {
            htmlBuffer.push(`
                <tr class="date-separator-row">
                    <td colspan="9" class="p-3 text-center date-separator-text">
                        <i class="far fa-calendar-alt mr-2"></i> ${currentDate}
                    </td>
                </tr>`);
            lastDate = currentDate;
        }

        const statusKey = (b.Status || "pending").toLowerCase().replace(/\s/g, '');
        const payType = (b.PaymentType || "").toLowerCase();
        
        // 2. Bina Baris Data
        htmlBuffer.push(`
            <tr class="hover:bg-slate-100 transition border-b border-slate-100 row-${statusKey}">
                <td class="p-5 font-black text-slate-700 text-xs">${b.Time}</td>
                <td class="p-5">
                    <div class="text-[9px] font-black text-amber-600 tracking-tighter mb-0.5">${b.OrderID}</div>
                    <div class="font-bold text-slate-800 leading-tight">${b.Name}</div>
                    <div class="text-[11px] text-slate-400 font-medium">${b.Phone}</div>
                </td>
                <td class="p-5">
                    <div class="font-bold text-slate-700 text-xs">${b.Theme}</div>
                    <div class="text-[9px] text-slate-400 font-black uppercase truncate max-w-[120px]">${b.Package}</div>
                </td>
                <td class="p-5 text-[11px] font-bold text-slate-600">${b.Pax || '-'}</td>
                <td class="p-5 text-[11px] font-bold text-slate-600">${b.AddOns || '-'}</td>
                <td class="p-5">
                    <div class="text-blue-600 font-bold text-[11px]">${b.Frame !== 'Tiada' ? b.Frame : '<span class="text-slate-300 italic">Tiada Frame</span>'}</div>
                    ${b.PhotoNumber ? `<div class="mt-1"><span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[9px] font-black uppercase">IMG: ${b.PhotoNumber}</span></div>` : ''}
                </td>
                <td class="p-5">
                    <div class="text-[10px] font-black uppercase text-slate-400 leading-tight">${b.PaymentType || 'Manual'}</div>
                    <div class="text-sm font-black">RM ${b.TotalPrice || '0'}</div>
                </td>
                <td class="p-5 text-center border-l border-slate-200/50">
                    <span class="status-badge status-${statusKey}">${b.Status}</span>
                    <div class="text-[9px] text-slate-400 mt-1 font-black uppercase tracking-tighter">${b.Photographer || 'TBA'}</div>
                </td>
                <td class="p-5 text-center border-l border-slate-200/50">
                    <div class="flex flex-wrap justify-center gap-1.5 max-w-[120px] mx-auto">
                        ${getActionButtons(b, statusKey, payType)}
                    </div>
                </td>
            </tr>`);
    });

    // 3. Render ke DOM (Hanya panggil innerHTML 1 KALI SAHAJA)
    tbody.innerHTML = htmlBuffer.join('');
}

function renderCards(data) {
    const container = document.getElementById('adminCardContainer');
    if (!container) return;
    
    let htmlBuffer = [];
    let lastDate = "";

    data.forEach(b => {
        const currentDate = formatDateUI(b.Date);
        const statusKey = (b.Status || "pending").toLowerCase().replace(/\s/g, '');
        const payType = (b.PaymentType || "").toLowerCase();

        // 1. Logik Header Tarikh
        if (currentDate !== lastDate) {
            htmlBuffer.push(`
                <div class="card-date-header">
                    <i class="far fa-calendar-check text-slate-400"></i> 
                    <span class="font-black text-slate-500 uppercase tracking-widest text-xs">${currentDate}</span>
                </div>`);
            lastDate = currentDate;
        }
        
        // 2. Bina Card
        htmlBuffer.push(`
            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-4 card-${statusKey}">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="text-[10px] font-black text-amber-600 mb-1 leading-none uppercase tracking-widest">${b.OrderID}</div>
                        <div class="font-bold text-slate-800 text-lg leading-tight">${b.Name}</div>
                        <div class="text-xs text-slate-400 font-medium">${b.Phone}</div>
                    </div>
                    <span class="status-badge status-${statusKey}">${b.Status}</span>
                </div>
                <div class="grid grid-cols-2 gap-y-4 gap-x-2 py-4 border-y border-slate-100">
                    <div><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Masa Slot</p><p class="text-xs font-bold text-slate-700">${b.Time}</p></div>
                    <div><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tema / Pakej</p><p class="text-xs font-bold text-slate-700">${b.Theme}<br><span class="text-[8px] opacity-60 uppercase font-black">${b.Package}</span></p></div>
                    <div><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pax</p><p class="text-xs font-bold text-slate-700">${b.Pax || '-'}</p></div>
                    <div><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bayaran</p><p class="text-sm font-black text-slate-900 leading-none">RM ${b.TotalPrice}</p></div>
                </div>
                <div class="mt-auto pt-4 border-t border-slate-50 flex justify-center gap-2">
                    ${getActionButtons(b, statusKey, payType)}
                </div>
            </div>`);
    });

    // 3. Render ke DOM (Hanya panggil innerHTML 1 KALI SAHAJA)
    container.innerHTML = htmlBuffer.join('');
}

function getActionButtons(b, statusKey, payType) {
    const rIdx = b.row_index; // Pastikan ambil index dari data
    let btns = "";
    
    // 1. Logik Butang Status (Sahkan / Check-in)
    if (statusKey === 'pending') {
        btns += `<button onclick="updateStatus('${b.OrderID}', 'Confirmed', 'Sahkan', ${rIdx})" class="w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-600 hover:text-white transition flex items-center justify-center" title="Sahkan Tempahan"><i class="fas fa-check-circle text-xs"></i></button>`;
    } else if (statusKey === 'confirmed') {
        btns += `<button onclick="updateStatus('${b.OrderID}', 'Arrived', 'Check-in', ${rIdx})" class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition flex items-center justify-center" title="Check-in"><i class="fas fa-user-check text-xs"></i></button>`;
    }

    // --- 2. LOGIK n8n (Settle Baki & Jana Resit) ---
    if (statusKey !== 'canceled') {
        
        // A. Butang Settle Baki: Hanya keluar jika PaymentType adalah 'deposit'
        if (payType.includes("deposit")) {
            btns += `<button onclick="handleN8N('${b.OrderID}', 'baki', ${rIdx})" class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition flex items-center justify-center" title="Settle Baki"><i class="fas fa-file-invoice-dollar text-xs"></i></button>`;
        }

        // B. Butang Jana Resit: SENTIASA KELUAR untuk semua status aktif (termasuk deposit)
        btns += `<button onclick="handleN8N('${b.OrderID}', 'resit', ${rIdx})" class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition flex items-center justify-center" title="Hantar Resit"><i class="fas fa-receipt text-xs"></i></button>`;
    }

    // 3. Logik Butang Edit (Slate)
    btns += `<button onclick="editCustomer('${b.OrderID}', ${rIdx})" class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition flex items-center justify-center" title="Edit"><i class="fas fa-edit text-xs"></i></button>`;

    // 4. Logik Butang Batal vs Padam (Danger Zone)
    if (statusKey === 'canceled') {
        btns += `<button onclick="deleteBooking('${b.OrderID}', ${rIdx})" class="w-8 h-8 rounded-lg bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center" title="Padam Database"><i class="fas fa-trash-alt text-xs"></i></button>`;
    } else {
        btns += `<button onclick="updateStatus('${b.OrderID}', 'Canceled', 'Batal', ${rIdx})" class="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white transition flex items-center justify-center" title="Batal"><i class="fas fa-times-circle text-xs"></i></button>`;
    }
    
    return btns;
}

window.debounceFilter = function() {
    clearTimeout(searchTimeout); // Gunakan variable timer yang kau dah buat tadi
    searchTimeout = setTimeout(() => {
        applyFilters();
    }, 300); // Dia tunggu 300ms selepas kau stop menaip baru dia lukis table
};

// ==========================================
// 6. SYSTEM WRAPPERS & DROPDOWNS
// ==========================================

window.handleDateFilterChange = () => { 
    const v = document.getElementById('filterDate').value; 
    document.getElementById('customDateRange').classList.toggle('hidden', v !== 'custom'); 
    if (v !== 'custom') applyFilters(); 
};

window.switchView = (v) => { 
    currentView = v; 
    applyFilters(); 
    document.getElementById('tableView').classList.toggle('hidden', v!=='table'); 
    document.getElementById('cardView').classList.toggle('hidden', v!=='card'); 
    document.getElementById('view-table-btn').classList.toggle('bg-amber-600', v==='table'); 
    document.getElementById('view-card-btn').classList.toggle('bg-amber-600', v==='card'); 
};

window.toggleSort = (k) => { 
    sortConfig.direction = (sortConfig.key === k && sortConfig.direction === 'asc') ? 'desc' : 'asc'; 
    sortConfig.key = k; 
    applyFilters(); 
};

function sortData(d) {
    return d.sort((a, b) => {
        let vA = a[sortConfig.key] || '', vB = b[sortConfig.key] || '';
        if (sortConfig.key === 'Date') {
            vA = new Date(normalizeDate(a.Date) + ' ' + (a.Time || '00:00'));
            vB = new Date(normalizeDate(b.Date) + ' ' + (b.Time || '00:00'));
        }
        if (vA < vB) return sortConfig.direction === 'asc' ? -1 : 1;
        return sortConfig.direction === 'asc' ? 1 : -1;
    });
}

function populateDropdowns() {
    // Themes
    const tSelects = [document.getElementById('filterTheme'), document.getElementById('form-theme')];
    tSelects.forEach(select => {
        if (!select) return;
        select.innerHTML = select.id === 'filterTheme' ? '<option value="all">Semua Tema</option>' : '';
        for (const [key, val] of Object.entries(rayaThemesDetail)) {
            let opt = document.createElement('option'); opt.value = val.title; opt.innerText = val.title; select.appendChild(opt);
        }
    });

    // Pakej
    const pSelect = document.getElementById('form-package');
    pSelect.innerHTML = "";
    for (const [key, val] of Object.entries(rayaPackages)) {
        let opt = document.createElement('option'); opt.value = val.name; opt.innerText = `${val.name} - RM${val.price}`; pSelect.appendChild(opt);
    }

    // MUA
    const mSelect = document.getElementById('form-mua'); 
    mSelect.innerHTML = '<option value="Tiada">Tiada MUA</option>';
    muaOptions.forEach(m => { if(m.name !== "Tiada") { let o = document.createElement('option'); o.value = m.name; o.innerText = `${m.name} (+RM${m.price})`; mSelect.appendChild(o); } });

    // Frame
    const fSelect = document.getElementById('form-frame'); 
    fSelect.innerHTML = '<option value="Tiada">Tiada Frame</option>';
    frameAddons.forEach(f => { if(f.name !== "Tiada") { let o = document.createElement('option'); o.value = f.name; o.innerText = `${f.name} (+RM${f.price})`; fSelect.appendChild(o); } });

    // Photographer
    const phSelect = document.getElementById('form-photographer'); 
    phSelect.innerHTML = '';
    photographersList.forEach(n => { let o = document.createElement('option'); o.value = n; o.innerText = n; phSelect.appendChild(o); });

    // Masa
    const timeSelect = document.getElementById('form-time'); 
    timeSelect.innerHTML = '';
    const slots = ["08:30","09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"];
    slots.forEach(t => { let o = document.createElement('option'); o.value = t; o.innerText = t; timeSelect.appendChild(o); });
}

window.handleN8N = async function(id, type, rowIndex) {
    // 1. Cari data guna rowIndex (Paling tepat kalau ID duplicate)
    const b = allBookings.find(x => x.row_index === rowIndex);
    
    if (!b || !confirm(`Sahkan n8n ${type.toUpperCase()} untuk ${b.Name}?`)) return;

    try {
        // 2. Hantar payload lengkap termasuk row_index ke n8n
        await fetch(N8N_WEBHOOK_URL, { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ 
                trigger: type, 
                orderID: b.OrderID, 
                phone: b.Phone, 
                nama: b.Name, 
                tema: b.Theme, 
                pax: b.Pax, 
                totalPrice: b.TotalPrice, 
                addOns: b.AddOns, 
                frame: b.Frame,
                row_index: rowIndex // Beritahu n8n baris mana satu nak update dlm Sheets
            }) 
        });

        alert("Permintaan berjaya dihantar ke n8n!");

        // 3. Kemaskini UI secara "Optimistic" (Laju)
        if (type === 'baki') {
            b.PaymentType = "FULL (SETTLE AT STUDIO)";
            applyFilters(); // Render balik skrin
            // Sync balik dengan database selepas 4 saat (bagi masa n8n buat kerja)
            setTimeout(fetchData, 4000);
        }
    } catch (err) { 
        console.error("n8n Error:", err);
        alert("Ralat menghubungi n8n."); 
    }
};

window.updateStatus = async function(id, newStatus, label, rowIndex) {
    if(!confirm(`Sahkan untuk ${label.toUpperCase()} tempahan ${id}?`)) return;

    // Optimistic Update
    const index = allBookings.findIndex(x => x.row_index === rowIndex);
    if (index !== -1) {
        allBookings[index].Status = newStatus;
        applyFilters(); 
    }

    try {
        fetch(GOOGLE_SCRIPT_URL, { 
            method: "POST", 
            mode: "no-cors", 
            body: JSON.stringify({ 
                action: "update_payment", 
                orderID: id, 
                status: newStatus,
                row_index: rowIndex // Hantar sekali
            }) 
        });
    } catch (e) { console.error("Database busy"); }
};

window.deleteBooking = async (id, rowIndex) => { 
    if(confirm(`HAPUS REKOD ${id} PADA BARIS ${rowIndex} SELAMANYA?`)) { 
        await fetch(GOOGLE_SCRIPT_URL, { 
            method: "POST", 
            mode: "no-cors", 
            body: JSON.stringify({ 
                action: "delete_row", 
                orderID: id, 
                row_index: rowIndex // Hantar index untuk target tepat
            }) 
        }); 
        fetchData(); 
    } 
};

window.openWalkInModal = () => { 
    document.getElementById('modalTitle').innerText = "WALK-IN BOOKING"; 
    document.getElementById('customerForm').reset(); 
    document.getElementById('form-orderID').value = ""; 
    document.getElementById('form-date').value = new Date().toISOString().split('T')[0]; 
    document.getElementById('form-pax-adult').value = 1; 
    document.getElementById('form-pax-kid').value = 0; 
    recalculatePrice(); 
    openModal('customerModal'); 
};

function getAddOnsSummary() {
    let l = [];
    if(document.getElementById('form-extraTime').checked) l.push("Extra Time");
    const m = document.getElementById('form-mua').value;
    if(m !== "Tiada") l.push(cleanMuaForDB(m));
    return l.length > 0 ? l.join(", ") : "Tiada";
}

window.openModal = (id) => { document.getElementById(id).classList.remove('hidden'); document.body.style.overflow = 'hidden'; };
window.closeModal = (id) => { document.getElementById(id).classList.add('hidden'); document.body.style.overflow = 'auto'; };

// 1. Bina Jadual Perbandingan
window.showComparison = function() {
    const tableBody = document.getElementById('comparisonTableBody');
    if(!tableBody) return;
    tableBody.innerHTML = "";
    
    const fields = [
        { label: 'Nama', id: 'form-name', key: 'Name' },
        { label: 'Telefon', id: 'form-phone', key: 'Phone' },
        { label: 'Tema', id: 'form-theme', key: 'Theme' },
        { label: 'Pakej', id: 'form-package', key: 'Package' },
        { label: 'Tarikh', id: 'form-date', key: 'Date' },
        { label: 'Masa', id: 'form-time', key: 'Time' },
        { label: 'Frame', id: 'form-frame', key: 'Frame' },
        { label: 'Pax', id: '', custom: () => `${document.getElementById('form-pax-adult').value} Dewasa, ${document.getElementById('form-pax-kid').value} Kanak-kanak`, key: 'Pax' },
        { label: 'Jumlah (RM)', id: 'form-total', key: 'TotalPrice', isText: true }
    ];

    let changeCount = 0;

    fields.forEach(f => {
        const newVal = f.custom ? f.custom() : (f.isText ? document.getElementById(f.id).innerText : document.getElementById(f.id).value);
        
        // SAFETY FIX: Check kalau originalDataCopy wujud
        let oldVal = "-";
        if (originalDataCopy && originalDataCopy[f.key] !== undefined) {
            oldVal = f.key === 'Date' ? normalizeDate(originalDataCopy[f.key]) : originalDataCopy[f.key];
        }

        if (String(newVal).trim() !== String(oldVal).trim()) {
            changeCount++;
            tableBody.innerHTML += `
                <tr class="border-b border-white">
                    <td class="p-3 font-bold text-slate-500">${f.label}</td>
                    <td class="p-3 text-slate-400 line-through">${oldVal || '-'}</td>
                    <td class="p-3 text-green-600 font-black">${newVal}</td>
                </tr>`;
        }
    });

    if (changeCount === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-slate-400 italic">Tiada sebarang perubahan dikesan.</td></tr>`;
    }

    document.getElementById('customerForm').classList.add('hidden');
    document.getElementById('editReviewSection').classList.remove('hidden');
};

// 2. Patah Balik ke Form
window.backToEdit = function() {
    document.getElementById('customerForm').classList.remove('hidden');
    document.getElementById('editReviewSection').classList.add('hidden');
};

// 3. Simpan & Trigger n8n (Jika diminta)
window.finalSaveBooking = async function(shouldNotify) {
    const btn = document.getElementById('btnSave');
    const originalText = btn ? btn.innerText : "Simpan Data";
    const rowIndexVal = document.getElementById('form-orderID').getAttribute('data-row');

    // 1. Tentukan jenis action berdasarkan orderID
    const orderID = document.getElementById('form-orderID').value;
    const isWalkIn = (orderID === "MANUAL" || orderID === "");
    const actionType = isWalkIn ? "save_booking" : "update_customer_full";

    // 2. Bina Data Payload (Pastikan nama variable sama mcm sedia ada)
    const payload = {
        action: actionType,
        row_index: rowIndexVal, // <--- Ini kunci kelajuan & ketepatan
        orderID: orderID,
        name: document.getElementById('form-name').value,
        phone: formatPhoneForDB(document.getElementById('form-phone').value),
        theme: document.getElementById('form-theme').value,
        package: document.getElementById('form-package').value,
        date: document.getElementById('form-date').value,
        time: document.getElementById('form-time').value,
        pax: `${document.getElementById('form-pax-adult').value} Dewasa, ${document.getElementById('form-pax-kid').value} Kanak-kanak`,
        addOns: getAddOnsSummary(),
        frame: cleanFrameForDB(document.getElementById('form-frame').value),
        photoNumber: document.getElementById('form-photoNumber').value,
        photographer: document.getElementById('form-photographer').value,
        totalPrice: document.getElementById('form-total').innerText,
        // Label bayaran walkin yang Tuan minta
        paymentType: isWalkIn ? "FULL (WALK-IN)" : (originalDataCopy ? originalDataCopy.PaymentType : "Updated via Admin"),
        status: "Confirmed"
    };

    if(btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sinking...';
    }

    try {
        // Hantar ke Apps Script (Wajib tanpa no-cors supaya kita boleh baca status kejayaan)
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.status === "success") {
            // Hantar ke n8n (Hanya jika butang Simpan & Hantar ditekan DAN ianya bukan Walk-in)
            if (shouldNotify && !isWalkIn) {
                await fetch(N8N_WEBHOOK_URL, { 
                    method: "POST", 
                    headers: { "Content-Type": "application/json" }, 
                    body: JSON.stringify({ trigger: "update_confirmation", ...payload }) 
                });
            }

            alert(isWalkIn ? "Walk-in Berjaya Disimpan!" : "Data Berjaya Dikemaskini!");
            closeModal('customerModal');
            fetchData(); // Tarik data fresh
        } else {
            alert("Ralat Database: " + result.message);
        }
    } catch (err) {
        console.error("Save Error:", err);
        alert("Database Error! Sila pastikan Apps Script di-deploy sebagai 'Anyone'.");
    } finally {
        if(btn) {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }
};

// ========================================================
// LOGIK SEMAK SLOT & DOUBLE BOOKING (ADMIN VERSION)
// ========================================================

window.fetchAdminSlots = async function() {
    const date = document.getElementById('form-date').value;
    const theme = document.getElementById('form-theme').value;
    const container = document.getElementById('admin-slot-container');
    const warning = document.getElementById('admin-slot-warning');

    if (!date || !theme || !container) return;

    container.innerHTML = "<p class='col-span-4 text-[10px] text-slate-400 animate-pulse'>Menyemak kekosongan...</p>";
    if(warning) warning.classList.add('hidden');

    try {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=check_slots&date=${date}&theme=${encodeURIComponent(theme)}`);
        const data = await res.json();
        renderAdminTimeSlots(data.bookedSlotIds || []);
    } catch (e) {
        container.innerHTML = "<p class='col-span-4 text-[10px] text-red-400'>Gagal semak database.</p>";
    }
};

function renderAdminTimeSlots(bookedSlots) {
    const container = document.getElementById('admin-slot-container');
    const timeSelect = document.getElementById('form-time');
    const warning = document.getElementById('admin-slot-warning');
    if (!container) return;

    container.innerHTML = "";

    // Guna list masa yang sama dengan sistem booking
    const SLOTS = ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];

    SLOTS.forEach(time => {
        // Tanda penuh jika: Tema sama dah ada jam tu OR 5 photographer dah penuh jam tu
        const isFull = bookedSlots.includes(time) || bookedSlots.includes(`${document.getElementById('form-theme').value}_${time}`);
        
        // Pengecualian: Jika jam ni milik asal customer yang kita tgh edit, tanda dia 'Available'
        const isOriginal = (originalDataCopy && time === originalDataCopy.Time && document.getElementById('form-date').value === normalizeDate(originalDataCopy.Date));

        const btn = document.createElement('button');
        btn.type = "button";
        btn.innerText = time;
        
        // Styling Butang
        if (isFull && !isOriginal) {
            btn.className = "p-2 text-[9px] font-bold rounded-lg bg-red-50 text-red-400 border border-red-100 hover:bg-red-500 hover:text-white transition";
            btn.title = "Slot Bertindih (Double Booking)";
        } else {
            btn.className = "p-2 text-[9px] font-bold rounded-lg bg-white text-slate-600 border border-slate-200 hover:border-amber-500 transition";
        }

        // Highlight kalau jam ni yang terpilih dalam dropdown
        if (time === timeSelect.value) {
            btn.classList.add('ring-2', 'ring-amber-500', 'bg-amber-50');
            if (isFull && !isOriginal && warning) warning.classList.remove('hidden');
        }

        btn.onclick = () => {
            timeSelect.value = time; // Update dropdown utama
            // Update UI butang
            Array.from(container.children).forEach(b => b.classList.remove('ring-2', 'ring-amber-500', 'bg-amber-50'));
            btn.classList.add('ring-2', 'ring-amber-500', 'bg-amber-50');
            
            // Tunjuk/Sorok amaran
            if (isFull && !isOriginal) {
                if(warning) warning.classList.remove('hidden');
            } else {
                if(warning) warning.classList.add('hidden');
            }
        };

        container.appendChild(btn);
    });
}