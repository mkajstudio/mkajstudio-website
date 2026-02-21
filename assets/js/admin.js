/**
 * MKAJ ADMIN ENGINE - V31.0 (DATE GROUPING + DYNAMIC VIEWS)
 */

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw9AfunhFacp2Aa19jhnRTe8vwnvGXMV5y7u1lG4w4Yx8cr2SenLRAlQr_8agN8D-gS/exec";
const N8N_WEBHOOK_URL = "https://api.mkajstudio.com/webhook/mkaj-settle-balance"; 

let allBookings = [];
let currentView = 'table'; 
let sortConfig = { key: 'Date', direction: 'asc' }; // Set default ASC supaya tarikh tersusun kronologi

// --- UTILS ---
function clean(str) {
    if (!str) return "";
    return str.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
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
    } catch (e) { console.error("Database Error"); }
    finally { if(loader) loader.classList.add('hidden'); }
}

// --- VIEW SWITCHER ---
window.switchView = function(view) {
    currentView = view;
    const tableDiv = document.getElementById('tableView');
    const cardDiv = document.getElementById('cardView');
    const tableBtn = document.getElementById('view-table-btn');
    const cardBtn = document.getElementById('view-card-btn');

    if (view === 'table') {
        tableDiv.classList.remove('hidden');
        cardDiv.classList.add('hidden');
        tableBtn.className = "px-4 py-2 rounded-lg text-xs font-bold transition bg-amber-600 text-white";
        cardBtn.className = "px-4 py-2 rounded-lg text-xs font-bold transition text-slate-400 hover:text-white";
    } else {
        tableDiv.classList.add('hidden');
        cardDiv.classList.remove('hidden');
        cardBtn.className = "px-4 py-2 rounded-lg text-xs font-bold transition bg-amber-600 text-white";
        tableBtn.className = "px-4 py-2 rounded-lg text-xs font-bold transition text-slate-400 hover:text-white";
    }
    applyFilters();
};

// --- SORTING ---
window.toggleSort = function(key) {
    if (sortConfig.key === key) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortConfig.key = key;
        sortConfig.direction = 'asc';
    }
    applyFilters();
};

function sortData(data) {
    return data.sort((a, b) => {
        let valA = a[sortConfig.key] || '';
        let valB = b[sortConfig.key] || '';
        if (sortConfig.key === 'Date') {
            valA = new Date(normalizeDate(a.Date) + ' ' + (a.Time || '00:00'));
            valB = new Date(normalizeDate(b.Date) + ' ' + (b.Time || '00:00'));
        }
        if (sortConfig.key === 'TotalPrice') {
            valA = parseFloat(valA); valB = parseFloat(valB);
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

// --- FILTER & RENDER LOGIC ---
window.applyFilters = function() {
    const search = (document.getElementById('adminSearch')?.value || "").toLowerCase();
    const fDate = document.getElementById('filterDate')?.value || "all";
    const fTheme = document.getElementById('filterTheme')?.value || "all";
    const fStatus = document.getElementById('filterStatus')?.value || "all";

    let filtered = allBookings.filter(b => {
        const matchSearch = (b.Name || "").toLowerCase().includes(search) || (b.OrderID || "").toLowerCase().includes(search) || (b.Phone || "").includes(search);
        const matchTheme = fTheme === 'all' || b.Theme === fTheme;
        const matchStatus = fStatus === 'all' || b.Status === fStatus;
        
        let matchDate = true;
        const bDate = normalizeDate(b.Date);
        const today = new Date().toISOString().split('T')[0];

        if (fDate === 'today') matchDate = (bDate === today);
        else if (fDate === 'tomorrow') {
            const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1);
            matchDate = (bDate === tmrw.toISOString().split('T')[0]);
        } 
        else if (fDate === 'week') {
            const curr = new Date();
            const first = curr.getDate() - curr.getDay();
            const last = first + 6;
            const startW = new Date(curr.setDate(first)).toISOString().split('T')[0];
            const endW = new Date(curr.setDate(last)).toISOString().split('T')[0];
            matchDate = (bDate >= startW && bDate <= endW);
        }
        else if (fDate === 'custom') {
            const s = document.getElementById('startDate').value;
            const e = document.getElementById('endDate').value;
            if (s && e) matchDate = (bDate >= s && bDate <= e);
            else if (s) matchDate = (bDate === s);
        }
        return matchSearch && matchTheme && matchStatus && matchDate;
    });

    filtered = sortData(filtered);
    
    if (currentView === 'table') renderTable(filtered);
    else renderCards(filtered);
    
    const stats = document.getElementById('stats-total');
    if(stats) stats.innerText = `Total: ${filtered.length} Rekod`;
};

// --- RENDER TABLE (WITH GROUPING) ---
function renderTable(data) {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    tbody.innerHTML = "";

    let lastDate = "";

    data.forEach(b => {
        const currentDate = formatDateUI(b.Date);
        
        // Tambah Separator jika tarikh berubah
        if (currentDate !== lastDate) {
            const sepRow = document.createElement('tr');
            sepRow.className = "date-separator-row";
            sepRow.innerHTML = `
                <td colspan="9" class="p-3 text-center date-separator-text">
                    <i class="far fa-calendar-alt mr-2"></i> ${currentDate}
                </td>`;
            tbody.appendChild(sepRow);
            lastDate = currentDate;
        }

        const tr = document.createElement('tr');
        const statusKey = (b.Status || "pending").toLowerCase().replace(/\s/g, '');
        const payType = (b.PaymentType || "").toLowerCase();
        
        tr.className = `hover:bg-slate-100 transition border-b border-slate-100 row-${statusKey}`;
        
        const frameDisplay = b.Frame && b.Frame !== "Tiada" ? `<div class="text-blue-600 font-bold text-[11px]"><i class="fas fa-certificate mr-1"></i>${b.Frame}</div>` : `<div class="text-slate-300 italic text-[10px]">Tiada Frame</div>`;
        const photoDisplay = b.PhotoNumber ? `<div class="mt-1"><span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[9px] font-black uppercase">IMG: ${b.PhotoNumber}</span></div>` : "";

        tr.innerHTML = `
            <td class="p-5 font-black text-slate-700">
                <span class="text-xs">${b.Time}</span>
            </td>
            <td class="p-5">
                <div class="text-[9px] font-black text-amber-600 tracking-tighter mb-0.5">${b.OrderID}</div>
                <div class="font-bold text-slate-800 leading-tight">${b.Name}</div>
                <div class="text-[11px] text-slate-400 font-medium">${b.Phone}</div>
            </td>
            <td class="p-5">
                <div class="font-bold text-slate-700">${b.Theme}</div>
                <div class="text-[9px] text-slate-400 font-black uppercase truncate max-w-[120px]">${b.Package}</div>
            </td>
            <td class="p-5 text-[11px] font-bold text-slate-600">${b.Pax || '-'}</td>
            <td class="p-5 text-[11px] font-bold text-slate-600">${b.AddOns || '-'}</td>
            <td class="p-5">${frameDisplay}${photoDisplay}</td>
            <td class="p-5">
                <div class="text-[10px] font-black uppercase text-slate-400">${b.PaymentType || 'Manual'}</div>
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
        `;
        tbody.appendChild(tr);
    });
}

// --- RENDER CARDS (WITH GROUPING) ---
function renderCards(data) {
    const container = document.getElementById('adminCardContainer');
    if (!container) return;
    container.innerHTML = "";

    let lastDate = "";

    data.forEach(b => {
        const currentDate = formatDateUI(b.Date);
        const statusKey = (b.Status || "pending").toLowerCase().replace(/\s/g, '');
        const payType = (b.PaymentType || "").toLowerCase();

        // Tambah Header Tarikh jika berubah
        if (currentDate !== lastDate) {
            const dateHeader = document.createElement('div');
            dateHeader.className = "card-date-header";
            dateHeader.innerHTML = `<i class="far fa-calendar-check text-slate-400"></i> <span class="font-black text-slate-500 uppercase tracking-widest text-xs">${currentDate}</span>`;
            container.appendChild(dateHeader);
            lastDate = currentDate;
        }
        
        const card = document.createElement('div');
        card.className = `bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col gap-4 card-${statusKey}`;
        
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <div class="text-[10px] font-black text-amber-600 mb-1">${b.OrderID}</div>
                    <div class="font-bold text-slate-800 text-lg leading-tight">${b.Name}</div>
                    <div class="text-xs text-slate-400">${b.Phone}</div>
                </div>
                <span class="status-badge status-${statusKey}">${b.Status}</span>
            </div>
            
            <div class="grid grid-cols-2 gap-3 py-3 border-y border-slate-50">
                <div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Masa Slot</p>
                    <p class="text-xs font-bold text-slate-700">${b.Time}</p>
                </div>
                <div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tema</p>
                    <p class="text-xs font-bold text-slate-700">${b.Theme}</p>
                </div>
                <div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pax</p>
                    <p class="text-xs font-bold text-slate-700">${b.Pax || '-'}</p>
                </div>
                <div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bayaran</p>
                    <p class="text-xs font-black text-slate-800">RM ${b.TotalPrice}</p>
                </div>
            </div>

            <div class="text-xs">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Add-Ons & Frame</p>
                <div class="font-bold text-slate-600">${b.AddOns || '-'}</div>
                <div class="text-blue-600 font-bold mt-1">${b.Frame || 'Tiada Frame'}</div>
                ${b.PhotoNumber ? `<div class="mt-2 text-[10px] font-black text-amber-600 uppercase">IMG: ${b.PhotoNumber}</div>` : ''}
            </div>

            <div class="mt-auto pt-4 flex flex-wrap gap-2 justify-center border-t border-slate-50">
                ${getActionButtons(b, statusKey, payType)}
            </div>
        `;
        container.appendChild(card);
    });
}

function getActionButtons(b, statusKey, payType) {
    let btns = "";
    if (statusKey === 'pending') {
        btns += `<button onclick="updateStatus('${b.OrderID}', 'Confirmed', 'Sahkan')" class="w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-600 hover:text-white transition flex items-center justify-center"><i class="fas fa-check-circle text-xs"></i></button>`;
    } else if (statusKey === 'confirmed') {
        btns += `<button onclick="updateStatus('${b.OrderID}', 'Arrived', 'Check-in')" class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition flex items-center justify-center"><i class="fas fa-user-check text-xs"></i></button>`;
    }
    if (statusKey !== 'canceled') {
        if (payType.includes("deposit")) {
            btns += `<button onclick="handleN8N('${b.OrderID}', 'baki')" class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition flex items-center justify-center"><i class="fas fa-file-invoice-dollar text-xs"></i></button>`;
        } else {
            btns += `<button onclick="handleN8N('${b.OrderID}', 'resit')" class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition flex items-center justify-center"><i class="fas fa-receipt text-xs"></i></button>`;
        }
    }
    btns += `<button onclick="editCustomer('${b.OrderID}')" class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition flex items-center justify-center"><i class="fas fa-edit text-xs"></i></button>`;
    if (statusKey === 'canceled') {
        btns += `<button onclick="deleteBooking('${b.OrderID}')" class="w-8 h-8 rounded-lg bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center"><i class="fas fa-trash-alt text-xs"></i></button>`;
    } else {
        btns += `<button onclick="updateStatus('${b.OrderID}', 'Canceled', 'Batal')" class="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white transition flex items-center justify-center"><i class="fas fa-times-circle text-xs"></i></button>`;
    }
    return btns;
}


// --- RECALCULATE PRICE ---
window.recalculatePrice = function() {
    const pkgSelect = document.getElementById('form-package');
    const themeSelect = document.getElementById('form-theme');
    const adultInput = document.getElementById('form-pax-adult');
    const kidInput = document.getElementById('form-pax-kid');
    
    let adults = parseInt(adultInput.value) || 0;
    let kids = parseInt(kidInput.value) || 0;
    let totalHeadcount = adults + kids;

    const themeData = Object.values(rayaThemesDetail).find(t => t.title === themeSelect.value);
    const themeType = themeData ? themeData.type : 'family';

    if (themeType === 'couple') {
        pkgSelect.value = "KATEGORI COUPLE";
        if (totalHeadcount > 4) {
            alert("⚠️ Tema Couple terhad MAX 4 orang.");
            adultInput.value = 4; kidInput.value = 0; adults = 4; kids = 0; totalHeadcount = 4;
        }
    } else {
        if (pkgSelect.value === "KATEGORI COUPLE") pkgSelect.value = "KATEGORI FAMILY (1-8 PAX)";
        if (pkgSelect.value === "KATEGORI FAMILY (1-8 PAX)" && (adults > 8 || totalHeadcount > 15)) {
            pkgSelect.value = "KATEGORI FAMILY (9-15 PAX)";
        } else if (pkgSelect.value === "KATEGORI FAMILY (9-15 PAX)" && (adults <= 8 && totalHeadcount <= 15)) {
            pkgSelect.value = "KATEGORI FAMILY (1-8 PAX)";
        }
    }

    let basePrice = 0, extraPax = 0;
    let currentPkg = pkgSelect.value;
    if (currentPkg === "KATEGORI COUPLE") basePrice = 89;
    else if (currentPkg === "KATEGORI FAMILY (1-8 PAX)") basePrice = 129;
    else if (currentPkg === "KATEGORI FAMILY (9-15 PAX)") {
        basePrice = 199;
        if (adults > 15) extraPax = (adults - 15) * 10;
    }

    let addonsTotal = 0;
    if (document.getElementById('form-extraTime').checked) addonsTotal += 20;
    const mData = muaOptions.find(m => m.name === document.getElementById('form-mua').value);
    if(mData) addonsTotal += mData.price;
    const fData = frameAddons.find(f => f.name === document.getElementById('form-frame').value);
    if(fData) addonsTotal += fData.price;

    document.getElementById('form-total').innerText = basePrice + extraPax + addonsTotal;
};

// --- GLOBAL ACCESSIBLE FUNCTIONS ---
window.openWalkInModal = function() {
    document.getElementById('modalTitle').innerText = "WALK-IN BOOKING";
    document.getElementById('customerForm').reset();
    document.getElementById('form-orderID').value = "MANUAL";
    document.getElementById('form-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('form-pax-adult').value = 1;
    document.getElementById('form-pax-kid').value = 0;
    recalculatePrice();
    openModal('customerModal');
};

window.editCustomer = function(id) {
    const b = allBookings.find(x => x.OrderID === id);
    if(!b) return;

    document.getElementById('modalTitle').innerText = `EDIT: ${id}`;
    document.getElementById('form-orderID').value = b.OrderID;
    document.getElementById('form-name').value = b.Name || "";
    document.getElementById('form-phone').value = b.Phone || "";
    document.getElementById('form-theme').value = b.Theme || "";
    document.getElementById('form-package').value = b.Package || "KATEGORI FAMILY (1-8 PAX)";
    document.getElementById('form-date').value = normalizeDate(b.Date);
    document.getElementById('form-time').value = b.Time || "09:30";

    const paxStr = b.Pax || "";
    document.getElementById('form-pax-adult').value = parseInt(paxStr.match(/(\d+)\s*Dewasa/)?.[1] || 1);
    document.getElementById('form-pax-kid').value = parseInt(paxStr.match(/(\d+)\s*Kanak/)?.[1] || 0);

    const addStrClean = clean(b.AddOns || "");
    document.getElementById('form-extraTime').checked = addStrClean.includes("extratime");

    const muaSelect = document.getElementById('form-mua');
    muaSelect.value = "Tiada";
    for (let i = 0; i < muaSelect.options.length; i++) {
        const shortName = clean(muaSelect.options[i].value.split(" (")[0]);
        if (shortName !== "tiada" && addStrClean.includes(shortName)) {
            muaSelect.selectedIndex = i; break;
        }
    }

    const frameValClean = clean(b.Frame || "");
    const frameSelect = document.getElementById('form-frame');
    frameSelect.value = "Tiada";
    for (let i = 0; i < frameSelect.options.length; i++) {
        const optValClean = clean(frameSelect.options[i].value);
        if (optValClean !== "tiada" && (frameValClean.includes(optValClean) || optValClean.includes(frameValClean))) {
            frameSelect.selectedIndex = i; break;
        }
    }
    
    document.getElementById('form-photoNumber').value = b.PhotoNumber || "";
    document.getElementById('form-photographer').value = b.Photographer || "Belum Ditetapkan";
    
    recalculatePrice();
    openModal('customerModal');
};

window.saveCustomer = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSave');
    const originalText = btn.innerText;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';

    const orderIDVal = document.getElementById('form-orderID').value;
    const paxString = `${document.getElementById('form-pax-adult').value} Dewasa, ${document.getElementById('form-pax-kid').value} Kanak-kanak`;

    const payload = {
        action: orderIDVal === "MANUAL" ? "save_booking" : "update_customer_full",
        orderID: orderIDVal,
        name: document.getElementById('form-name').value,
        phone: document.getElementById('form-phone').value,
        theme: document.getElementById('form-theme').value,
        package: document.getElementById('form-package').value,
        date: document.getElementById('form-date').value,
        time: document.getElementById('form-time').value,
        pax: paxString,
        addOns: getAddOnsSummary(),
        frame: cleanFrameForDB(document.getElementById('form-frame').value),
        photoNumber: document.getElementById('form-photoNumber').value,
        photographer: document.getElementById('form-photographer').value,
        totalPrice: document.getElementById('form-total').innerText,
        paymentType: "Counter (Full)",
        status: "Confirmed"
    };

    try {
        await fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) });
        alert("Berjaya!"); closeModal('customerModal'); fetchData();
    } catch (err) { alert("Error!"); }
    finally { btn.disabled = false; btn.innerText = originalText; }
};

window.handleN8N = async function(orderID, type) {
    const b = allBookings.find(x => x.OrderID === orderID);
    if (!b) return;
    const actionText = type === 'baki' ? `SETTLE BAKI` : `HANTAR RESIT`;
    if (!confirm(`Sahkan ${actionText} untuk ${b.Name}?`)) return;

    const payload = {
        trigger: type, orderID: b.OrderID, phone: b.Phone, nama: b.Name,
        tema: b.Theme, pax: b.Pax, addOns: b.AddOns, frame: b.Frame,
        totalPrice: b.TotalPrice
    };

    try {
        const res = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if(res.ok) alert(`✅ Berjaya!`);
        else alert("⚠️ n8n ralat.");
    } catch (err) { alert("❌ Ralat sambungan n8n."); }
};

window.updateStatus = async function(id, newStatus, label) {
    if(!confirm(`Sahkan untuk ${label.toUpperCase()} tempahan ${id}?`)) return;
    try {
        await fetch(GOOGLE_SCRIPT_URL, { 
            method: "POST", 
            mode: "no-cors", 
            body: JSON.stringify({ action: "update_payment", orderID: id, status: newStatus }) 
        });
        fetchData();
    } catch (e) { alert("Ralat status."); }
};

window.handleDateFilterChange = function() {
    const filterVal = document.getElementById('filterDate').value;
    const customDiv = document.getElementById('customDateRange');
    if (filterVal === 'custom') customDiv.classList.remove('hidden');
    else { customDiv.classList.add('hidden'); applyFilters(); }
};

function populateDropdowns() {
    const themeSelects = [document.getElementById('filterTheme'), document.getElementById('form-theme')];
    themeSelects.forEach(select => {
        if (!select) return;
        select.innerHTML = select.id === 'filterTheme' ? '<option value="all">Semua Tema</option>' : '';
        for (const [key, val] of Object.entries(rayaThemesDetail)) {
            let opt = document.createElement('option');
            opt.value = val.title; opt.innerText = val.title;
            select.appendChild(opt);
        }
    });
    const muaSelect = document.getElementById('form-mua');
    muaOptions.forEach(m => {
        if(m.name === "Tiada") return;
        let opt = document.createElement('option');
        opt.value = m.name; opt.innerText = `${m.name} (+RM${m.price})`;
        muaSelect.appendChild(opt);
    });
    const frameSelect = document.getElementById('form-frame');
    frameAddons.forEach(f => {
        if(f.name === "Tiada") return;
        let opt = document.createElement('option');
        opt.value = f.name; opt.innerText = `${f.name} (+RM${f.price})`;
        frameSelect.appendChild(opt);
    });
    const pgSelect = document.getElementById('form-photographer');
    photographersList.forEach(name => {
        let opt = document.createElement('option');
        opt.value = name; opt.innerText = name;
        pgSelect.appendChild(opt);
    });
    const timeSelect = document.getElementById('form-time');
    const slots = ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
    slots.forEach(t => {
        let opt = document.createElement('option');
        opt.value = t; opt.innerText = t;
        timeSelect.appendChild(opt);
    });
}

function getAddOnsSummary() {
    let list = [];
    if(document.getElementById('form-extraTime').checked) list.push("Extra Time");
    const m = document.getElementById('form-mua').value;
    if(m !== "Tiada") list.push(cleanMuaForDB(m));
    return list.length > 0 ? list.join(", ") : "Tiada";
}

window.openModal = (id) => { document.getElementById(id).classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
window.closeModal = (id) => { document.getElementById(id).classList.add('hidden'); document.body.style.overflow = 'auto'; }

window.checkInCustomer = async function(id) {
    if(!confirm(`Check-in ${id}?`)) return;
    await fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ action: "check_in", orderID: id }) });
    fetchData();
};
window.deleteBooking = async function(id) {
    if(!confirm(`Padam rekod ${id}?`)) return;
    await fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ action: "delete_row", orderID: id }) });
    fetchData();
};
function normalizeDate(d) {
    if(!d) return "";
    const str = d.toString();
    if(str.includes('/')) {
        const p = str.split('/');
        return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
    }
    return str.split('T')[0];
}
function formatDateUI(s) {
    const d = new Date(s);
    if(isNaN(d.getTime())) return s;
    return d.toLocaleDateString('ms-MY', {day:'numeric', month:'short'});
}