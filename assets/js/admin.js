/* 
   MKAJ ADMIN LOGIC - admin.js
   V16.0 - The Ultimate Clean Integration
*/

// --- 1. CONFIGURATION ---
const GAS_URL = "https://script.google.com/macros/s/AKfycbxBt596ouHdAgm9gvnoLQMZEDoRyGFsHXgOBufTfdEClqhm1LimyKLsbszJzRFRU-hG/exec";
const TIME_SLOTS = [
    "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", 
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", 
    "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", 
    "20:00", "20:30", "21:00", "21:30"
];
let allData = [];
let walkInState = { adult: 6, kid: 0, total: 0, themeKey: "" };

// --- 2. DATABASE FUNCTIONS (FETCH & RENDER) ---

function initTimeSlots() {
    const wTimeSelect = document.getElementById('w_time');
    const eTimeSelect = document.getElementById('e_time');
    const options = TIME_SLOTS.map(t => `<option value="${t}">${t}</option>`).join('');
    if(wTimeSelect) wTimeSelect.innerHTML = options;
    if(eTimeSelect) eTimeSelect.innerHTML = options;
}

function initAlbumList() {
    const frameSelect = document.getElementById('e_frame');
    if(!frameSelect || typeof albumTypes === 'undefined') return;

    frameSelect.innerHTML = albumTypes.map(album => 
        `<option value="${album.name}" data-price="${album.price}">${album.name}</option>`
    ).join('');
    
    // Tambah listener supaya bila tukar album, harga terus update
    frameSelect.onchange = calculateEditPrice; 
}

async function fetchData() {
    const container = document.getElementById('container');
    const loader = document.getElementById('loader');
    
    if(loader) loader.classList.remove('hidden');
    if(container) container.innerHTML = '';

    try {
        console.log("Petching data from GAS...");
        const response = await fetch(`${GAS_URL}?action=get_data&t=${Date.now()}`, {
            method: 'GET',
            redirect: 'follow'
        });

        if (!response.ok) throw new Error("Network response error");
        const data = await response.json();
        
        if (Array.isArray(data)) {
            allData = data;
            renderData(allData);
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        container.innerHTML = `
            <div class="col-span-full bg-red-50 text-red-600 p-10 rounded-[2rem] text-center border-2 border-dashed border-red-200">
                <i class="fas fa-database text-5xl mb-4 opacity-30"></i>
                <h2 class="text-2xl font-black mb-2">DATABASE DISCONNECTED</h2>
                <p class="text-sm">Gagal menyambung ke Google Sheets. Sila pastikan Apps Script di-deploy dengan betul.</p>
                <button onclick="fetchData()" class="mt-6 bg-red-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-red-100">CUBA LAGI</button>
            </div>`;
    } finally {
        if(loader) loader.classList.add('hidden');
    }
}

function renderData(data) {
    const container = document.getElementById('container');
    if(!container) return;
    container.innerHTML = '';

    // 1. UPDATE STATS DASHBOARD (Kekalkan logic asal bos)
    const totalSesi = data.length;
    const countConfirmed = data.filter(r => r.Status === 'Confirmed').length;
    const countArrived = data.filter(r => r.Status === 'Arrived').length;
    const countPending = data.filter(r => r.Status === 'Pending').length;
    const countCanceled = data.filter(r => (r.Status === 'Canceled' || r.Status === 'Rejected')).length;

    const totalRevenue = data
        .filter(r => (r.Status === 'Confirmed' || r.Status === 'Arrived'))
        .reduce((sum, item) => {
            const price = parseFloat(String(item.TotalPrice).replace(/[^0-9.]/g, '')) || 0;
            return sum + price;
        }, 0);

    document.getElementById('statTotal').innerText = totalSesi;
    document.getElementById('statPaid').innerText = countConfirmed;
    document.getElementById('statArrived').innerText = countArrived;
    document.getElementById('statPending').innerText = countPending;
    document.getElementById('statCanceled').innerText = countCanceled;
    document.getElementById('statRevenue').innerText = `RM ${totalRevenue.toLocaleString()}`;

    // 2. SORT DATA (Susun ikut Masa & Tarikh)
    // Kita susun dari sesi paling awal ke paling lewat
    const sortedData = [...data].sort((a, b) => {
        const timeA = new Date(a.Date + " " + a.Time);
        const timeB = new Date(b.Date + " " + b.Time);
        return timeA - timeB;
    });

    if (sortedData.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-20 text-gray-400 italic">Tiada tempahan ditemui...</div>`;
        return;
    }

    // 3. GENERATE CARD DENGAN GROUPING TARIKH
    let lastDate = "";

    sortedData.forEach(item => {
        // --- LOGIC TAMBAHAN: HEADER TARIKH ---
        if (item.Date !== lastDate) {
            const displayDate = new Date(item.Date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });
            container.innerHTML += `
                <div class="col-span-full mt-8 mb-2 flex items-center gap-4">
                    <span class="bg-slate-200 text-slate-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">${displayDate}</span>
                    <div class="h-[1px] bg-slate-200 flex-1"></div>
                </div>`;
            lastDate = item.Date;
        }

        const isArrived = item.Status === 'Arrived';
        const isConfirmed = item.Status === 'Confirmed';
        const isCanceled = item.Status === 'Canceled' || item.Status === 'Rejected';
        
        const pt = item.PaymentType || "";
        
        let settleBtnText = "";
        let settleBtnClass = "";
        let settleOnClick = "";

        if (pt === "FULL") {
            settleBtnText = '<i class="fas fa-check-circle mr-1"></i> PAID IN FULL';
            settleBtnClass = "bg-green-100 text-green-700 border border-green-200 cursor-default";
            settleOnClick = "alert('Pelanggan ini sudah menerima resit bayaran penuh melalui WhatsApp.')";
        } 
        else if (pt.includes("WALK-IN")) {
            settleBtnText = '<i class="fas fa-paper-plane mr-1"></i> HANTAR RESIT';
            settleBtnClass = "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-100";
            settleOnClick = `handleSettle('${item.OrderID}', '${item.Phone}', true)`;
        } 
        else {
            settleBtnText = 'SETTLE BAKI';
            settleBtnClass = "bg-yellow-500 text-slate-900 hover:bg-yellow-400 shadow-lg shadow-yellow-100";
            settleOnClick = `handleSettle('${item.OrderID}', '${item.Phone}', false)`;
        }

        const statusClass = isArrived ? 'bg-blue-500' : (isConfirmed ? 'bg-green-500' : (isCanceled ? 'bg-red-500' : 'bg-yellow-500'));
        const borderClass = isArrived ? 'border-blue-500' : (isConfirmed ? 'border-green-500' : (isCanceled ? 'border-red-500' : 'border-yellow-400'));

        const itemString = encodeURIComponent(JSON.stringify(item));

        const card = `
            <div class="bg-white rounded-[2rem] p-6 shadow-sm border-l-[12px] ${borderClass} relative transition hover:shadow-xl group">
                <div class="absolute top-5 right-5">
                    <span class="${statusClass} text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">${item.Status || 'Pending'}</span>
                </div>
                
                <div class="mb-5">
                    <p class="text-[10px] font-bold text-slate-300 tracking-widest uppercase">${item.OrderID}</p>
                    <h3 class="text-2xl font-black text-slate-800 leading-tight capitalize">${item.Name || 'Tanpa Nama'}</h3>
                    <p class="text-sm text-slate-500 font-bold">${item.Phone}</p>
                </div>

                <div class="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div class="bg-gray-50 p-3 rounded-2xl">
                        <p class="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Sesi & Tema</p>
                        <p class="font-black text-slate-700 text-[11px]">${item.Date}</p>
                        <p class="text-[10px] text-slate-500 font-bold uppercase truncate">${item.Theme}</p>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-2xl">
                        <p class="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Pax & Masa</p>
                        <p class="font-black text-slate-700 text-[11px]">${item.Time}</p>
                        <p class="text-[10px] text-slate-500 font-bold uppercase">${item.Pax || '-'}</p>
                    </div>
                </div>

                ${item.AddOns && item.AddOns !== '-' && item.AddOns !== 'Tiada' ? `
                <div class="mb-4 flex flex-wrap gap-1">
                    ${item.AddOns.split(',').map(a => `<span class="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-1 rounded-lg border border-amber-100">${a.trim()}</span>`).join('')}
                </div>
                ` : ''}

                <!-- Paparan Album di Card -->
                ${item.Frame && item.Frame !== 'Tiada' ? `
                <div class="mt-1">
                    <span class="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-lg border border-blue-200 uppercase">
                        <i class="fas fa-box-open mr-1"></i> ALBUM: ${item.Frame}
                    </span>
                </div>
                ` : ''}

                <div class="flex justify-between items-end mb-6 px-1">
                    <div>
                        <p class="text-[9px] font-bold text-gray-400 uppercase">Jenis Bayaran</p>
                        <p class="text-xs font-black text-slate-700 uppercase">${item.PaymentType || '-'}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-[9px] font-bold text-gray-400 uppercase">Total</p>
                        <p class="text-lg font-black text-slate-900 leading-none">RM ${item.TotalPrice}</p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <button onclick="handleCheckIn('${item.OrderID}')" class="bg-slate-900 text-white py-3.5 rounded-2xl font-bold text-[11px] hover:bg-slate-800 transition shadow-lg">CHECK-IN</button>
                    <button onclick="${settleOnClick}" class="${settleBtnClass} py-3.5 rounded-2xl font-bold text-[11px] transition uppercase italic font-black">
                        ${settleBtnText}
                    </button>
                </div>

                <button onclick="openEditModal('${itemString}')" 
                        class="w-full mt-2 bg-blue-50 text-blue-600 py-3 rounded-2xl font-bold text-[10px] hover:bg-blue-100 border border-blue-100 uppercase tracking-widest">
                    <i class="fas fa-user-edit mr-1"></i> Kemaskini Data & Frame
                </button>

                <!-- TAMBAH BUTANG BATAL DI SINI (Hanya muncul jika belum Canceled) -->
                ${!isCanceled ? `
                <button onclick="handleCancel('${item.OrderID}')" class="w-full mt-3 text-[9px] font-bold text-slate-300 hover:text-red-500 transition uppercase tracking-[0.2em] border-t border-slate-50 pt-3">
                    <i class="fas fa-times-circle mr-1"></i> Batalkan Tempahan
                </button>
                ` : ''}
            </div>
        `;
        container.innerHTML += card;
    });
}

// FUNGSI COPY (Senangkan kerja staf)
function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    // Boleh tambah toast notification kecil di sini
}

// FUNGSI CANCEL (Batal dari Dashboard)
async function handleCancel(id) {
    if(!confirm(`Adakah anda pasti untuk MEMBATALKAN tempahan ${id}? Slot akan dibuka semula.`)) return;
    showLoader(true);
    try {
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'update_payment', orderID: id, status: 'Canceled' })
        });
        alert("Tempahan dibatalkan.");
        fetchData();
    } catch (err) { alert("Gagal membatalkan."); }
    showLoader(false);
}
// --- 3. FILTER & SEARCH LOGIC ---

function filterData() {
    const query = document.getElementById('searchBox').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;
    const dateRange = document.getElementById('filterDateRange').value;

    const now = new Date();
    now.setHours(0,0,0,0);
    const todayStr = now.toISOString().split('T')[0];

    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const filtered = allData.filter(r => {
        const matchSearch = (r.Name||"").toLowerCase().includes(query) || (r.Phone||"").includes(query) || (r.OrderID||"").toLowerCase().includes(query);
        const matchStatus = status === "" || r.Status === status;
        
        let matchDate = true;
        const rowDate = r.Date; 

        if (dateRange === "today") matchDate = rowDate === todayStr;
        else if (dateRange === "week") {
            const itemDate = new Date(rowDate);
            itemDate.setHours(0,0,0,0);
            matchDate = itemDate >= startOfWeek && itemDate <= endOfWeek;
        }

        return matchSearch && matchStatus && matchDate;
    });

    renderData(filtered);
}

// --- 4. WALK-IN ENGINE (INTEGRATED WITH data.js) ---

function initWalkInThemes() {
    const select = document.getElementById('w_theme_select');
    if(!select || typeof rayaThemesDetail === 'undefined') return;
    
    select.innerHTML = '<option value="">-- Pilih Tema Raya --</option>';
    for (const [key, val] of Object.entries(rayaThemesDetail)) {
        let opt = document.createElement('option');
        opt.value = key;
        opt.innerText = `${val.title} (${val.categoryName})`;
        select.appendChild(opt);
    }
}


function adjustPax(type, change) {
    if (type === 'adult') {
        walkInState.adult = Math.max(1, walkInState.adult + change);
        document.getElementById('w_adult_val').innerText = walkInState.adult;
    } else {
        walkInState.kid = Math.max(0, walkInState.kid + change);
        document.getElementById('w_kid_val').innerText = walkInState.kid;
    }
    calculateWalkIn();
}

function calculateWalkIn() {
    const themeKey = document.getElementById('w_theme_select').value;
    if(!themeKey) {
        document.getElementById('w_total_display').innerText = "0";
        return;
    }

    const theme = rayaThemesDetail[themeKey];
    let price = theme.price;
    let limit = theme.paxCover;

    document.getElementById('w_pax_note').innerText = `Cover ${limit} Orang`;

    // Kira Extra Pax (Hanya untuk kategori Family yang lebih 6 orang)
    if (theme.type === 'family' && walkInState.adult > limit) {
        price += (walkInState.adult - limit) * 10;
    }

    // Add-ons
    if (document.getElementById('w_addon_makeup').checked) price += 150;
    if (document.getElementById('w_addon_time').checked) price += 20;

    document.getElementById('w_total_display').innerText = price;
    walkInState.total = price;
    walkInState.themeKey = themeKey;
}

// --- 5. ACTION HANDLERS ---

async function handleCheckIn(id) {
    if(!confirm(`Sahkan pendaftaran masuk (Check-in) bagi ${id}?`)) return;
    showLoader(true);
    try {
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'check_in', orderID: id })
        });
        fetchData();
    } catch (err) { alert("Check-in gagal."); }
}

async function handleSettle(id, phone) {
    // Fungsi ini akan disambungkan ke Webhook n8n nanti
    alert(`Mengarahkan n8n untuk menghantar Resit PAID FULL bagi ${id} ke WhatsApp ${phone}...`);
}

async function submitWalkIn(e) {
    e.preventDefault();
    
    // Ambil elemen
    const elDate = document.getElementById('w_date');
    const elTime = document.getElementById('w_time');

    // Safety Check: Pastikan tarikh dan masa diisi
    if(!walkInState.themeKey) { alert("Sila pilih tema!"); return; }
    if(!elDate.value) { alert("Sila pilih tarikh sesi!"); return; }
    if(!elTime.value) { alert("Sila pilih masa sesi!"); return; }

    const theme = rayaThemesDetail[walkInState.themeKey];
    const legacyPackage = (theme.type === 'family') ? "KATEGORI FAMILY" : "KATEGORI COUPLE";
    
    // --- LOGIC AUTO-FORMAT NOMBOR TELEFON (60) ---
    let rawPhone = document.getElementById('w_phone').value.trim();
    let cleanPhone = rawPhone.replace(/\D/g, ''); 

    if (cleanPhone.startsWith('0')) {
        cleanPhone = '60' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('1')) {
        cleanPhone = '60' + cleanPhone;
    }

    if (cleanPhone.length < 11 || cleanPhone.length > 14) {
        alert("Nombor telefon nampak macam salah. Sila semak semula.");
        return;
    }

    const payload = {
        action: "save_booking", // Mesti match dengan Apps Script
        name: document.getElementById('w_name').value,
        phone: cleanPhone,
        package: legacyPackage,
        theme: theme.title,
        date: elDate.value, // YYYY-MM-DD
        time: elTime.value, // HH:mm
        pax: `${walkInState.adult} Dewasa, ${walkInState.kid} Kanak-kanak`,
        addOns: getAddonText(),
        totalPrice: walkInState.total,
        status: "Confirmed",
        paymentType: "FULL (WALK-IN)",
        orderID: "MANUAL"
    };

    showLoader(true);
    try {
        // Guna mode 'no-cors' jika guna Google Apps Script POST
        await fetch(GAS_URL, { 
            method: 'POST', 
            mode: 'no-cors', 
            body: JSON.stringify(payload) 
        });
        
        alert(`Alhamdulillah! Walk-in Berjaya.\nNo Tel: ${cleanPhone}`);
        toggleModal('walkInModal', false);
        document.getElementById('walkInForm').reset();
        fetchData(); // Refresh list terus
        
    } catch (err) { 
        console.error(err);
        alert("Ralat: Gagal menyimpan data ke Google Sheets."); 
    } finally {
        showLoader(false);
    }
}

function getAddonText() {
    let res = [];
    if (document.getElementById('w_addon_makeup').checked) res.push("Makeup");
    if (document.getElementById('w_addon_time').checked) res.push("Tambahan Masa");
    return res.length > 0 ? res.join(", ") : "Tiada";
}

function toggleModal(id, show) {
    document.getElementById(id).classList.toggle('hidden', !show);
}

function showLoader(show) {
    const loader = document.getElementById('loader');
    if(loader) loader.classList.toggle('hidden', !show);
}

// --- INITIALIZE ---
window.onload = () => {
    fetchData();
    initWalkInThemes();
    initTimeSlots(); // TAMBAH INI
    initAlbumList(); // TAMBAH INI
    const form = document.getElementById('walkInForm');
    if(form) form.onsubmit = submitWalkIn;
};

let editState = { adult: 0, kid: 0, basePaxLimit: 6, themeType: 'family' };

function openEditModal(itemJson) {
    const item = JSON.parse(decodeURIComponent(itemJson));
    const currentFrame = (item.Frame && item.Frame !== "") ? item.Frame : "Tiada";
    
    // 1. Reset Basic Info
    document.getElementById('e_orderID').value = item.OrderID;
    document.getElementById('edit_orderID_label').innerText = item.OrderID;
    document.getElementById('e_phone').value = item.Phone;
    // Selepas set value yang lain
    document.getElementById('e_date').value = item.Date || ""; // Tarikh mesti format YYYY-MM-DD
    document.getElementById('e_time').value = item.Time || "09:30";
    document.getElementById('e_frame').value = currentFrame;
    document.getElementById('e_photoNum').value = item.PhotoNumber || "";
    document.getElementById('e_totalPrice').value = item.TotalPrice;

    // 2. ISI DROPDOWN TEMA
    const themeSelect = document.getElementById('e_theme');
    themeSelect.innerHTML = "";
    for (const [key, val] of Object.entries(rayaThemesDetail)) {
        let opt = document.createElement('option');
        opt.value = val.title;
        opt.innerText = val.title;
        opt.dataset.price = val.price;
        opt.dataset.basePax = val.paxCover;
        opt.dataset.type = val.type;
        opt.dataset.category = val.categoryName;
        themeSelect.appendChild(opt);
    }
    themeSelect.value = item.Theme;

    // 3. PARSE PAX (Wajib Update State kat sini!)
    const adultMatch = item.Pax.match(/(\d+)\s*Dewasa/);
    const kidMatch = item.Pax.match(/(\d+)\s*Kanak-kanak/);
    
    // Update global editState supaya kaunter + / - guna data baru
    editState.adult = adultMatch ? parseInt(adultMatch[1]) : 6;
    editState.kid = kidMatch ? parseInt(kidMatch[1]) : 0;
    
    // Update visual angka dalam modal
    document.getElementById('e_adult_val').innerText = editState.adult;
    document.getElementById('e_kid_val').innerText = editState.kid;

    // 4. RESET & CHECK ADD-ONS
    const currentAddons = item.AddOns || "";
    document.getElementById('e_addon_makeup').checked = currentAddons.includes("Makeup");
    document.getElementById('e_addon_time').checked = currentAddons.includes("Tambahan Masa");

    // 5. Jalankan pemicu update pakej & harga
    onEditThemeChange(); 
    toggleModal('editModal', true);

    // Selepas set value yang lain
    document.getElementById('e_time').value = item.Time || "09:30";
}

function onEditThemeChange() {
    const select = document.getElementById('e_theme');
    const opt = select.options[select.selectedIndex];
    
    editState.currentThemeTitle = select.value;
    editState.currentPackageName = opt.dataset.category;
    editState.currentBasePrice = parseInt(opt.dataset.price);
    editState.currentBasePax = parseInt(opt.dataset.basePax);
    editState.currentType = opt.dataset.type;

    document.getElementById('e_package_label').innerText = `Pakej: ${editState.currentPackageName}`;
    
    calculateEditPrice(); // Panggil pengiraan bila tema tukar
}

function adjustEditPax(type, change) {
    if (type === 'adult') editState.adult = Math.max(1, editState.adult + change);
    else editState.kid = Math.max(0, editState.kid + change);
    
    document.getElementById('e_adult_val').innerText = editState.adult;
    document.getElementById('e_kid_val').innerText = editState.kid;
    
    calculateEditPrice(); // Panggil pengiraan bila pax berubah
}

// --- ENGINE PENGIRAAN HARGA DALAM MODAL EDIT ---
function calculateEditPrice() {
    let newTotal = editState.currentBasePrice;

    // 1. Logic Extra Pax (RM10/head jika lebih limit Family)
    if (editState.currentType === 'family' && editState.adult > editState.currentBasePax) {
        newTotal += (editState.adult - editState.currentBasePax) * 10;
    }

    // 2. Logic Add-ons
    if (document.getElementById('e_addon_makeup').checked) newTotal += 150;
    if (document.getElementById('e_addon_time').checked) newTotal += 20;

    // 3. Logic Album (BARU)
    const frameSelect = document.getElementById('e_frame');
    const selectedAlbumPrice = parseInt(frameSelect.options[frameSelect.selectedIndex].dataset.price || 0);
    newTotal += selectedAlbumPrice;

    // Update Input Box
    document.getElementById('e_totalPrice').value = newTotal;
}

// --- UPDATE SUBMIT (MAPPING ADDONS BALIK KE TEXT) ---
document.getElementById('editForm').onsubmit = async (e) => {
    e.preventDefault();

    // Cari info tema yang sedang dipilih dalam modal edit
    const themeSelect = document.getElementById('e_theme');
    const selectedOpt = themeSelect.options[themeSelect.selectedIndex];
    const themeType = selectedOpt.dataset.type; // Ambil type (family/couple)

    // LOGIK TUKAR NAMA PAKEJ
    const legacyPackage = (themeType === 'family') ? "KATEGORI FAMILY" : "KATEGORI COUPLE";

    // Bina semula string Add-ons untuk disimpan ke Sheets
    let addonList = [];
    if (document.getElementById('e_addon_makeup').checked) addonList.push("Makeup");
    if (document.getElementById('e_addon_time').checked) addonList.push("Tambahan Masa");
    const finalAddons = addonList.length > 0 ? addonList.join(", ") : "Tiada";

    const payload = {
        action: "update_customer_full",
        orderID: document.getElementById('e_orderID').value,
        phone: document.getElementById('e_phone').value,
        package: legacyPackage,
        theme: editState.currentThemeTitle,
        date: document.getElementById('e_date').value, // AMBIL TARIKH
        time: document.getElementById('e_time').value, // AMBIL MASA
        pax: `${editState.adult} Dewasa, ${editState.kid} Kanak-kanak`,
        totalPrice: document.getElementById('e_totalPrice').value,
        frame: document.getElementById('e_frame').value, // Ambil nama album (cth: "A (16x16)")
        photoNumber: document.getElementById('e_photoNum').value,
        addOns: finalAddons // Pastikan hantar ni sekali
    };

    showLoader(true);
    toggleModal('editModal', false);
    try {
        await fetch(GAS_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
        alert("Berjaya! Harga & Maklumat telah dikemaskini.");
        fetchData();
    } catch (err) { alert("Gagal mengemaskini."); }
};

// --- FUNGSI BATALKAN TEMPAHAN ---
async function handleCancel(id) {
    // 1. Double check dengan Admin supaya tak tersalah tekan
    const confirmBatal = confirm(`Adakah anda pasti untuk MEMBATALKAN tempahan ${id}?\n\nNota: Slot tarikh/masa ini akan dibuka semula di website secara automatik.`);
    
    if (!confirmBatal) return;

    showLoader(true); // Guna loader yang bos dah ada

    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors', // Guna no-cors ikut standard Apps Script POST bos
            body: JSON.stringify({ 
                action: 'update_payment', 
                orderID: id, 
                status: 'Canceled' 
            })
        });

        // Sebab no-cors, kita tak dapat baca response body, 
        // jadi kita tunggu sekejap dan refresh data
        setTimeout(() => {
            alert(`Tempahan ${id} telah berjaya dibatalkan.`);
            fetchData(); // Refresh list secara automatik
        }, 1500);

    } catch (err) {
        console.error("Gagal batal:", err);
        alert("Ralat: Tidak dapat menyambung ke server untuk pembatalan.");
        showLoader(false);
    }
}