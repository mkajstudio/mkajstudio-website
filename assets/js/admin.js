/* 
   MKAJ ADMIN LOGIC - admin.js V34.0 (COMPLETE FIXED)
   Contains: Auth, Rendering, Filtering, Walk-In, Edit, Check-In, Settlement logic.
*/

// --- 1. SECURITY PIN & CONFIG ---
const ADMIN_PIN = "0000"; 
const GAS_URL = "https://script.google.com/macros/s/AKfycbw9AfunhFacp2Aa19jhnRTe8vwnvGXMV5y7u1lG4w4Yx8cr2SenLRAlQr_8agN8D-gS/exec";
// Gantikan URL ini dengan URL Webhook n8n anda yang sebenar
const N8N_SETTLE_URL = "https://api.mkajstudio.com/webhook/mkaj-settle-balance"; 

const TIME_SLOTS = ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];

// Auth Check
if (sessionStorage.getItem("admin_authenticated") !== "true") {
    let pass = prompt("Sila masukkan PIN AKSES ADMIN MKAJ:");
    if (pass === ADMIN_PIN) {
        sessionStorage.setItem("admin_authenticated", "true");
    } else {
        alert("PIN SALAH!");
        window.location.href = "index.html";
        window.stop();
    }
}

let allData = [];
let selectedStatuses = [];
let selectedShooters = [];

// --- 2. HELPERS ---
function updateText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

function parseDateMY(dateStr) {
    if (!dateStr) return new Date(0);
    // Jika format YYYY-MM-DD
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return new Date(dateStr);
    // Jika format DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return new Date(dateStr);
}

function toggleModal(modalID, show) {
    const el = document.getElementById(modalID);
    if (show) el.classList.remove('hidden');
    else el.classList.add('hidden');
}

// --- 3. FETCH & RENDER DATA ---
async function fetchData() {
    const loader = document.getElementById('loader');
    if(loader) loader.classList.remove('hidden');
    try {
        const response = await fetch(`${GAS_URL}?action=get_data&t=${Date.now()}`);
        allData = await response.json();
        if (Array.isArray(allData)) renderData(allData);
    } catch (err) {
        console.error("Database Error:", err);
        alert("Gagal ambil data. Sila refresh.");
    } finally {
        if(loader) loader.classList.add('hidden');
    }
}

function renderData(data) {
    const container = document.getElementById('container');
    if(!container) return;
    container.innerHTML = '';

    // Stats
    updateText('statTotal', data.length);
    updateText('statPaid', data.filter(r => r.Status === 'Confirmed').length);
    updateText('statArrived', data.filter(r => r.Status === 'Arrived').length);
    updateText('statPending', data.filter(r => r.Status === 'Pending').length);
    updateText('statCanceled', data.filter(r => (String(r.Status).toLowerCase().includes('cancel') || r.Status === 'Rejected')).length);

    // Sorting (Date & Time)
    const sortedData = [...data].sort((a, b) => {
        const dateA = parseDateMY(a.Date);
        const dateB = parseDateMY(b.Date);
        const timeA = a.Time ? a.Time.replace(':', '') : '0000';
        const timeB = b.Time ? b.Time.replace(':', '') : '0000';
        if (dateA - dateB !== 0) return dateA - dateB;
        return timeA - timeB;
    });

    let lastDate = "";
    sortedData.forEach(item => {
        const dateObj = parseDateMY(item.Date);
        const dateStrISO = dateObj.toISOString().split('T')[0];

        if (dateStrISO !== lastDate) {
            const displayDate = dateObj.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });
            container.innerHTML += `<div class="col-span-full mt-8 mb-2 flex items-center gap-4"><span class="bg-slate-200 text-slate-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">${displayDate}</span><div class="h-[1px] bg-slate-200 flex-1"></div></div>`;
            lastDate = dateStrISO;
        }

        const isCanceled = (String(item.Status).toLowerCase().includes('cancel') || String(item.Status).toLowerCase().includes('reject'));
        const isArrived = (String(item.Status).toLowerCase() === 'arrived');
        const pt = (item.PaymentType || "").toUpperCase();
        const isPaidFull = (pt === "FULL" || pt.includes("LUNAS") || pt.includes("WALK-IN"));
        const itemString = encodeURIComponent(JSON.stringify(item));

        // Logic butang
        let settleBtnText = isPaidFull ? 'PAID IN FULL' : (pt.includes("WALK-IN") ? 'HANTAR RESIT' : 'SETTLE BAKI');
        let settleBtnClass = isPaidFull ? "bg-green-100 text-green-700 border border-green-200 cursor-default" : (pt.includes("WALK-IN") ? "bg-green-600 text-white" : "bg-yellow-500 text-slate-900");
        // FIX: Escape single quotes in names to prevent JS error
        const safeOrderID = item.OrderID.replace(/'/g, "\\'");
        const safePhone = item.Phone.replace(/'/g, "\\'");
        
        let settleOnClick = isPaidFull ? "alert('Status sudah Lunas.')" : `handleSettle('${safeOrderID}', '${safePhone}', ${pt.includes("WALK-IN")})`;

        const statusClass = isCanceled ? 'bg-red-500' : (isArrived ? 'bg-blue-500' : (item.Status === 'Confirmed' ? 'bg-green-500' : 'bg-yellow-500'));
        const borderClass = isCanceled ? 'border-red-500' : (isArrived ? 'border-blue-500' : (item.Status === 'Confirmed' ? 'border-green-500' : 'border-yellow-400'));

        container.innerHTML += `
            <div class="bg-white rounded-[2rem] p-6 shadow-sm border-l-[12px] ${borderClass} relative mb-4 transition hover:shadow-xl group">
                <div class="absolute top-5 right-5"><span class="${statusClass} text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">${item.Status}</span></div>
                <div class="mb-5">
                    <p class="text-[10px] font-bold text-slate-300 uppercase">${item.OrderID}</p>
                    <h3 class="text-2xl font-black text-slate-800 leading-tight capitalize">${item.Name}</h3>
                    <p class="text-sm text-slate-500 font-bold">${item.Phone}</p>
                </div>
                <div class="mt-2 mb-4 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                    <div><p class="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Photographer</p><p class="text-xs font-black text-indigo-700 uppercase">${item.Photographer || "TBA"}</p></div>
                    <i class="fas fa-camera-retro text-indigo-200"></i>
                </div>
                <div class="grid grid-cols-2 gap-2 mb-4 text-sm font-bold">
                    <div class="bg-gray-50 p-3 rounded-2xl"><p class="text-[9px] font-bold text-gray-400 uppercase">Masa</p><p class="text-slate-700">${item.Time}</p></div>
                    <div class="bg-gray-50 p-3 rounded-2xl"><p class="text-[9px] font-bold text-gray-400 uppercase">Tema</p><p class="text-slate-700 truncate text-[10px]">${item.Theme}</p></div>
                </div>
                ${!isCanceled ? `
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="handleCheckIn('${safeOrderID}')" class="${isArrived ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'} py-3.5 rounded-2xl font-black text-[10px]" ${isArrived ? 'disabled' : ''}>CHECK-IN</button>
                        <button onclick="${settleOnClick}" class="${settleBtnClass} py-3.5 rounded-2xl font-black text-[10px] uppercase shadow-sm">${settleBtnText}</button>
                    </div>
                    <button onclick="openEditModal('${itemString}')" class="w-full mt-2 bg-blue-50 text-blue-600 py-3 rounded-2xl font-bold text-[10px] border border-blue-100 uppercase"><i class="fas fa-edit mr-1"></i> Kemaskini Data & Frame</button>
                    <button onclick="handleCancel('${safeOrderID}')" class="w-full mt-3 text-[9px] font-bold text-slate-300 hover:text-red-500 transition uppercase pt-2 border-t border-slate-50">Batalkan Tempahan</button>
                ` : `
                    <div class="bg-red-50 p-4 rounded-3xl text-center border border-red-100">
                        <p class="text-[10px] font-black text-red-600 uppercase mb-2">Dibatalkan</p>
                        <button onclick="handleDelete('${safeOrderID}')" class="bg-red-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg transition">Padam Rekod</button>
                    </div>
                `}
            </div>`;
    });
}

// --- 4. ACTION HANDLERS (CHECK-IN, SETTLE, DELETE) ---

window.handleCheckIn = function(orderID) {
    if(!confirm(`Sahkan kehadiran untuk ${orderID}?`)) return;
    
    fetch(GAS_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({ action: "check_in", orderID: orderID })
    }).then(() => {
        alert("Check-in berjaya!");
        fetchData(); // Refresh
    });
}

window.handleSettle = function(orderID, phone, isResendOnly) {
    if(!confirm(isResendOnly ? "Hantar semula resit ke WhatsApp?" : "Pelanggan sudah bayar baki? Sistem akan hantar resit dan update status.")) return;

    // Hantar request ke n8n (Webhook) untuk proses resit & update DB
    // Nota: Kita guna 'no-cors' untuk elak CORS error, tapi kita takkan dapat response body.
    fetch(N8N_SETTLE_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: orderID, phone: phone, type: 'settle' })
    }).then(() => {
        alert("Permintaan dihantar ke sistem. Status akan dikemaskini sebentar lagi.");
        setTimeout(fetchData, 3000); // Tunggu sikit baru refresh
    }).catch(err => alert("Gagal hubungi server. Sila cuba lagi."));
}

window.handleCancel = function(orderID) {
    if(!confirm("Anda pasti mahu BATALKAN tempahan ini? Slot akan dikosongkan.")) return;
    // Kita guna update_customer_full tapi set status jadi 'Cancelled'
    // Atau hantar ke n8n jika ada flow cancel. Di sini kita guna direct GAS update status.
    
    // Untuk simplifys, kita hantar action update status manual (perlu endpoint update_payment di GAS support status change)
    fetch(GAS_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({ action: "update_payment", orderID: orderID, status: "Cancelled By Admin", receiptUrl: "" })
    }).then(() => {
        alert("Tempahan dibatalkan.");
        fetchData();
    });
}

window.handleDelete = function(orderID) {
    if(!prompt("Taip 'DELETE' untuk padam kekal rekod ini:") === 'DELETE') return;
    fetch(GAS_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({ action: "delete_row", orderID: orderID })
    }).then(() => {
        alert("Rekod dipadam.");
        fetchData();
    });
}

// --- 5. WALK-IN LOGIC ---

window.calculateWalkIn = function() {
    let total = 0;
    
    // 1. Tentukan Harga Pakej
    const themeKey = document.getElementById('w_theme_select').value;
    const isCouple = (themeKey && rayaThemesDetail[themeKey] && rayaThemesDetail[themeKey].type === 'couple');
    
    // Update UI based on theme type
    const tierDiv = document.getElementById('w_tier_container');
    const paxNote = document.getElementById('w_pax_note');
    
    if (isCouple) {
        tierDiv.classList.add('hidden');
        total = 89;
        paxNote.innerText = "Max 4 Pax";
    } else {
        tierDiv.classList.remove('hidden');
        // Check tier
        const tier = document.querySelector('input[name="w_pax_tier"]:checked')?.value || 'small';
        const labelSmall = document.getElementById('w_tier_small_label');
        const labelLarge = document.getElementById('w_tier_large_label');

        if(tier === 'large') {
            total = 199;
            paxNote.innerText = "Cover 9-15 Pax";
            labelLarge.classList.add('border-yellow-500', 'bg-yellow-50');
            labelSmall.classList.remove('border-yellow-500', 'bg-yellow-50');
        } else {
            total = 129;
            paxNote.innerText = "Cover 1-8 Pax";
            labelSmall.classList.add('border-yellow-500', 'bg-yellow-50');
            labelLarge.classList.remove('border-yellow-500', 'bg-yellow-50');
        }
    }

    // 2. Extra Pax Logic
    const adultCount = parseInt(document.getElementById('w_adult_val').innerText) || 1;
    if (!isCouple) {
        const tier = document.querySelector('input[name="w_pax_tier"]:checked')?.value || 'small';
        if (tier === 'large' && adultCount > 15) {
            total += (adultCount - 15) * 10;
        }
    }

    // 3. Add-ons
    const addMua = document.getElementById('w_addon_makeup').checked;
    if(addMua) {
        document.getElementById('w_mua_selection').classList.remove('hidden');
        if(document.getElementById('w_mua_select').value) total += 150;
    } else {
        document.getElementById('w_mua_selection').classList.add('hidden');
    }

    if(document.getElementById('w_addon_time').checked) total += 20;

    // 4. Frame
    const frameSel = document.getElementById('w_frame_select');
    const framePrice = parseInt(frameSel.options[frameSel.selectedIndex]?.getAttribute('data-price') || 0);
    total += framePrice;

    document.getElementById('w_total_display').innerText = total;
}

// Event Listeners untuk Walk-In (Pax Counter)
window.adjustPax = function(type, delta) {
    const el = document.getElementById('w_adult_val');
    let val = parseInt(el.innerText) + delta;
    if(val < 1) val = 1;
    el.innerText = val;
    calculateWalkIn();
}

// Handle Theme Change
window.onWalkInThemeChange = function() {
    calculateWalkIn();
}

// SUBMIT WALK-IN
document.getElementById('walkInForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.innerText = "Menyimpan...";

    // Gather Data
    const tier = document.querySelector('input[name="w_pax_tier"]:checked')?.value || 'small';
    const themeKey = document.getElementById('w_theme_select').value;
    const themeTitle = rayaThemesDetail[themeKey]?.title || themeKey;
    const isCouple = rayaThemesDetail[themeKey]?.type === 'couple';
    
    const pkgName = isCouple ? "KATEGORI COUPLE" : (tier === 'large' ? "KATEGORI FAMILY (9-15 PAX)" : "KATEGORI FAMILY (1-8 PAX)");

    let addons = [];
    if(document.getElementById('w_addon_makeup').checked) addons.push("Makeup: " + document.getElementById('w_mua_select').value);
    if(document.getElementById('w_addon_time').checked) addons.push("Extra Time");

    const payload = {
        action: "save_booking",
        orderID: "WALK-IN-" + Math.floor(Math.random()*10000),
        name: document.getElementById('w_name').value,
        phone: document.getElementById('w_phone').value,
        email: "-",
        package: pkgName,
        theme: themeTitle,
        date: document.getElementById('w_date').value, // YYYY-MM-DD
        time: document.getElementById('w_time').value,
        pax: document.getElementById('w_adult_val').innerText + " Dewasa",
        addOns: addons.join(', '),
        totalPrice: document.getElementById('w_total_display').innerText,
        frame: document.getElementById('w_frame_select').value,
        status: "Confirmed", // Walk-in terus confirm
        paymentType: "Walk-In Full Cash/QR"
    };

    fetch(GAS_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify(payload)
    }).then(() => {
        alert("Walk-In Berjaya Disimpan!");
        toggleModal('walkInModal', false);
        btn.disabled = false; btn.innerText = "SIMPAN";
        fetchData();
    });
});


// --- 6. EDIT MODAL LOGIC ---

window.openEditModal = function(itemStr) {
    const item = JSON.parse(decodeURIComponent(itemStr));
    toggleModal('editModal', true);

    // Populate Fields
    document.getElementById('e_orderID').value = item.OrderID;
    document.getElementById('edit_orderID_label').innerText = item.OrderID;
    document.getElementById('e_phone').value = item.Phone;
    
    // Date & Time
    // Convert format DD/MM/YYYY back to YYYY-MM-DD for input
    const dateObj = parseDateMY(item.Date);
    // Adjust timezone manual sebab toISOString guna UTC
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    document.getElementById('e_date').value = `${year}-${month}-${day}`;
    document.getElementById('e_time').value = item.Time;

    // Theme & Photographer
    // Fill Theme Options first
    const themeSel = document.getElementById('e_theme');
    themeSel.innerHTML = '';
    for (const [key, val] of Object.entries(rayaThemesDetail)) {
        let opt = document.createElement('option');
        opt.value = val.title; opt.innerText = val.title;
        themeSel.appendChild(opt);
    }
    themeSel.value = item.Theme;

    // Fill Photographer (Ambil list dari data.js)
    const photoSel = document.getElementById('e_photographer');
    photoSel.innerHTML = '';
    if(typeof photographersList !== 'undefined') {
        photographersList.forEach(p => {
            let opt = document.createElement('option');
            opt.value = p; opt.innerText = p;
            photoSel.appendChild(opt);
        });
    }
    photoSel.value = item.Photographer || "Belum Ditetapkan";

    // Frame
    document.getElementById('e_frame').value = item.Frame;
    document.getElementById('e_photoNum').value = item.PhotoNumber || "";
    document.getElementById('e_totalPrice').value = item.TotalPrice;

    // Pax Extraction (Agak leceh sebab text, kita try parse)
    // Format: "X Dewasa, Y Kanak-kanak"
    const paxStr = item.Pax || "";
    const adultMatch = paxStr.match(/(\d+)\s*Dewasa/);
    const kidMatch = paxStr.match(/(\d+)\s*Kanak/);
    
    document.getElementById('e_adult_val').innerText = adultMatch ? adultMatch[1] : "1";
    document.getElementById('e_kid_val').innerText = kidMatch ? kidMatch[1] : "0";

    // Addons Check
    const addons = item.AddOns || "";
    document.getElementById('e_addon_makeup').checked = addons.includes("Makeup");
    document.getElementById('e_addon_time').checked = addons.includes("Extra Time");
    
    // MUA Select logic
    if (addons.includes("Makeup")) {
        document.getElementById('e_mua_selection').classList.remove('hidden');
        // Try populate MUA
        const muaSel = document.getElementById('e_mua_select');
        muaSel.innerHTML = '<option value="">-- Pilih MUA --</option>';
        if(typeof muaOptions !== 'undefined') {
            muaOptions.forEach(m => {
                let opt = document.createElement('option');
                opt.value = m.name; opt.innerText = m.name;
                muaSel.appendChild(opt);
            });
        }
        // Try match existing text
        muaOptions.forEach(m => { if(addons.includes(m.name)) muaSel.value = m.name; });
    } else {
        document.getElementById('e_mua_selection').classList.add('hidden');
    }
}

window.adjustEditPax = function(type, delta) {
    const el = document.getElementById(type === 'adult' ? 'e_adult_val' : 'e_kid_val');
    let val = parseInt(el.innerText) + delta;
    if(val < 0) val = 0;
    if(type === 'adult' && val < 1) val = 1;
    el.innerText = val;
    calculateEditPrice();
}

window.onEditMakeupToggle = function() {
    const checked = document.getElementById('e_addon_makeup').checked;
    document.getElementById('e_mua_selection').classList.toggle('hidden', !checked);
    calculateEditPrice();
}

window.calculateEditPrice = function() {
    // Auto calculate price based on selections (Optional but helpful)
    // Untuk admin, kadang2 kita nak override manual. Jadi kita buat calculation
    // tapi tak paksa overwrite kalau admin dah type manual.
    // ... Untuk sekarang, kita biar admin key-in manual total price dalam input field.
}

document.getElementById('editForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if(!confirm("Simpan perubahan?")) return;

    const addons = [];
    if(document.getElementById('e_addon_makeup').checked) addons.push("Makeup: " + document.getElementById('e_mua_select').value);
    if(document.getElementById('e_addon_time').checked) addons.push("Extra Time");

    const payload = {
        action: "update_customer_full",
        orderID: document.getElementById('e_orderID').value,
        phone: document.getElementById('e_phone').value,
        package: "MANUAL UPDATE", // Atau biar kekal
        theme: document.getElementById('e_theme').value,
        date: document.getElementById('e_date').value,
        time: document.getElementById('e_time').value,
        pax: `${document.getElementById('e_adult_val').innerText} Dewasa, ${document.getElementById('e_kid_val').innerText} Kanak-kanak`,
        addOns: addons.join(', '),
        totalPrice: document.getElementById('e_totalPrice').value,
        frame: document.getElementById('e_frame').value,
        photoNumber: document.getElementById('e_photoNum').value,
        photographer: document.getElementById('e_photographer').value
    };

    fetch(GAS_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify(payload)
    }).then(() => {
        alert("Data berjaya dikemaskini!");
        toggleModal('editModal', false);
        fetchData();
    });
});

// --- 7. FILTER LOGIC ---
window.togglePill = function(el, type, value) {
    const list = (type === 'status') ? selectedStatuses : selectedShooters;
    const index = list.indexOf(value);
    if (index > -1) {
        list.splice(index, 1);
        el.classList.remove('bg-slate-900', 'text-white', 'border-slate-900');
    } else {
        list.push(value);
        el.classList.add('bg-slate-900', 'text-white', 'border-slate-900');
    }
    filterData();
}

window.toggleCustomDate = function(val) {
    const section = document.getElementById('customDateSection');
    if (section) section.classList.toggle('hidden', val !== 'custom');
    filterData();
}

function filterData() {
    const query = (document.getElementById('searchBox')?.value || "").toLowerCase();
    const dateRange = document.getElementById('filterDateRange')?.value || "all";
    const nowMY = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kuala_Lumpur"}));
    const todayISO = nowMY.toISOString().split('T')[0];

    const filtered = allData.filter(item => {
        const matchSearch = (item.Name || "").toLowerCase().includes(query) || (item.OrderID || "").toLowerCase().includes(query) || (item.Phone || "").includes(query);
        const matchStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.Status);
        const matchShooter = selectedShooters.length === 0 || selectedShooters.includes(item.Photographer);

        let matchDate = true;
        const itemDateObj = parseDateMY(item.Date);
        const itemDateISO = itemDateObj.toISOString().split('T')[0];

        if (dateRange === "today") {
            matchDate = (itemDateISO === todayISO);
        } else if (dateRange === "week") {
            const start = new Date(nowMY); start.setDate(nowMY.getDate() - nowMY.getDay() + 1); start.setHours(0,0,0,0);
            const end = new Date(start); end.setDate(start.getDate() + 6);
            matchDate = (itemDateObj >= start && itemDateObj <= end);
        } else if (dateRange === "custom") {
            const sVal = document.getElementById('dateStart')?.value;
            const eVal = document.getElementById('dateEnd')?.value;
            if (sVal && eVal) {
                const s = new Date(sVal); s.setHours(0,0,0,0);
                const e = new Date(eVal); e.setHours(23,59,59,999);
                matchDate = (itemDateObj >= s && itemDateObj <= e);
            }
        }
        return matchSearch && matchStatus && matchShooter && matchDate;
    });
    renderData(filtered);
}

// Initializers
window.onload = () => {
    fetchData();
    if(typeof window.initTimeSlots === 'function') window.initTimeSlots(); // Fallback if defined elsewhere
    else {
        // Self define if missing
        const options = TIME_SLOTS.map(t => `<option value="${t}">${t}</option>`).join('');
        if(document.getElementById('w_time')) document.getElementById('w_time').innerHTML = options;
        if(document.getElementById('e_time')) document.getElementById('e_time').innerHTML = options;
    }

    if(typeof window.initWalkInThemes === 'function') window.initWalkInThemes();
    else {
        const select = document.getElementById('w_theme_select');
        if(select && typeof rayaThemesDetail !== 'undefined') {
            select.innerHTML = '<option value="">-- Pilih Tema Raya --</option>';
            for (const [key, val] of Object.entries(rayaThemesDetail)) {
                let opt = document.createElement('option');
                opt.value = key; opt.innerText = `${val.title} (${val.type.toUpperCase()})`;
                select.appendChild(opt);
            }
        }
    }
    
    // Init Frames
    if(typeof albumTypes !== 'undefined') {
        const html = albumTypes.map(a => `<option value="${a.name}" data-price="${a.price}">${a.name} (+RM${a.price})</option>`).join('');
        if(document.getElementById('w_frame_select')) document.getElementById('w_frame_select').innerHTML = html;
        if(document.getElementById('e_frame')) document.getElementById('e_frame').innerHTML = html;
    }
    
    // Init MUA List for WalkIn
    const wMuaSel = document.getElementById('w_mua_select');
    if(wMuaSel && typeof muaOptions !== 'undefined') {
        wMuaSel.innerHTML = '';
        muaOptions.forEach(m => {
            let opt = document.createElement('option');
            opt.value = m.name; opt.innerText = m.name;
            wMuaSel.appendChild(opt);
        });
    }
};