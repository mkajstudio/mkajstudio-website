/* 
   MKAJ ADMIN LOGIC - admin.js
   V23.0 - Optimized & Modular Version
   Status: Stable for Production
*/

// --- 1. SECURITY PIN ---
const ADMIN_PIN = "0000"; 

if (sessionStorage.getItem("admin_authenticated") !== "true") {
    let pass = prompt("Sila masukkan PIN AKSES ADMIN MKAJ:");
    if (pass === ADMIN_PIN) {
        sessionStorage.setItem("admin_authenticated", "true");
    } else {
        alert("PIN SALAH! AKSES DISEKAT.");
        document.body.innerHTML = "<div style='display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; flex-direction:column;'><h1>🚫 AKSES DISEKAT</h1><p>Sila hubungi pentadbir sistem.</p></div>";
        window.stop();
    }
}

// --- 2. CONFIGURATION ---
const GAS_URL = "https://script.google.com/macros/s/AKfycbwdGTp-FCzsQeZ4Kwgl-AOMA45XS-0bBu9TGiPAyUhb_LCTl-ObaHS-QEkCKKNoYv0g/exec";
const N8N_SETTLE_URL = "https://api.mkajstudio.com/webhook/mkaj-settle-balance";
const TIME_SLOTS = ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];

let allData = [];
let editState = { adult: 0, kid: 0, currentBasePrice: 0, currentBasePax: 6, currentType: 'family', currentPackageName: '', currentThemeTitle: '' };
let walkInState = { adult: 6, kid: 0, total: 0, themeKey: "" };

// --- 3. CORE FUNCTIONS (FETCH & RENDER) ---

async function fetchData() {
    const container = document.getElementById('container');
    const loader = document.getElementById('loader');
    if(loader) loader.classList.remove('hidden');
    if(container) container.innerHTML = '';

    try {
        const response = await fetch(`${GAS_URL}?action=get_data&t=${Date.now()}`, { method: 'GET', redirect: 'follow' });
        allData = await response.json();
        if (Array.isArray(allData)) renderData(allData);
    } catch (err) {
        console.error("Database Error:", err);
        if(container) container.innerHTML = `<div class="col-span-full text-center p-10 bg-red-50 text-red-600 rounded-3xl font-bold uppercase">DATABASE DISCONNECTED</div>`;
    } finally {
        if(loader) loader.classList.add('hidden');
    }
}

function renderData(data) {
    const container = document.getElementById('container');
    if(!container) return;
    container.innerHTML = '';

    // A. Update Stats (Check for both spelling of Canceled/Cancelled)
    document.getElementById('statTotal').innerText = data.length;
    document.getElementById('statPaid').innerText = data.filter(r => r.Status === 'Confirmed').length;
    document.getElementById('statArrived').innerText = data.filter(r => r.Status === 'Arrived').length;
    document.getElementById('statPending').innerText = data.filter(r => r.Status === 'Pending').length;
    document.getElementById('statCanceled').innerText = data.filter(r => (r.Status.toLowerCase().includes('cancel') || r.Status === 'Rejected')).length;

    const totalRevenue = data
        .filter(r => (r.Status === 'Confirmed' || r.Status === 'Arrived'))
        .reduce((sum, item) => sum + (parseFloat(String(item.TotalPrice).replace(/[^0-9.]/g, '')) || 0), 0);
    document.getElementById('statRevenue').innerText = `RM ${totalRevenue.toLocaleString()}`;

    // B. Sorting (Ascending Date & Time)
    const sortedData = [...data].sort((a, b) => {
        const timeA = new Date(a.Date + " " + a.Time);
        const timeB = new Date(b.Date + " " + b.Time);
        return timeA - timeB;
    });

    let lastDate = "";
    sortedData.forEach(item => {
        // Render Date Header
        if (item.Date !== lastDate) {
            const displayDate = new Date(item.Date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });
            container.innerHTML += `<div class="col-span-full mt-8 mb-2 flex items-center gap-4"><span class="bg-slate-200 text-slate-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">${displayDate}</span><div class="h-[1px] bg-slate-200 flex-1"></div></div>`;
            lastDate = item.Date;
        }

        // Logic Status Check
        const rawStatus = (item.Status || "").trim().toLowerCase();
        const isCancelled = (rawStatus.includes('cancel') || rawStatus === 'rejected');
        const isArrived = (rawStatus === 'arrived');
        const isConfirmed = (rawStatus === 'confirmed');
        const pt = item.PaymentType || "";
        const isPaidFull = (pt === "FULL" || pt === "FULL (SETTLED AT STUDIO)" || pt === "FULL (WALK-IN)");
        const itemString = encodeURIComponent(JSON.stringify(item));

        // Penentuan Butang Settle
        let settleBtnText = "";
        let settleBtnClass = "";
        let settleOnClick = "";

        if (isPaidFull) {
            settleBtnText = '<i class="fas fa-check-circle mr-1"></i> PAID IN FULL';
            settleBtnClass = "bg-green-100 text-green-700 border border-green-200 cursor-default";
            settleOnClick = "alert('Resit penuh telah dihantar.')";
        } else if (pt.includes("Payment") || pt.includes("WALK-IN")) {
            settleBtnText = '<i class="fas fa-paper-plane mr-1"></i> HANTAR RESIT';
            settleBtnClass = "bg-green-600 text-white shadow-lg";
            settleOnClick = `handleSettle('${item.OrderID}', '${item.Phone}', true)`;
        } else {
            settleBtnText = 'SETTLE BAKI';
            settleBtnClass = "bg-yellow-500 text-slate-900 shadow-lg";
            settleOnClick = `handleSettle('${item.OrderID}', '${item.Phone}', false)`;
        }

        const statusClass = isCancelled ? 'bg-red-500' : (isArrived ? 'bg-blue-500' : (isConfirmed ? 'bg-green-500' : 'bg-yellow-500'));
        const borderClass = isCancelled ? 'border-red-500' : (isArrived ? 'border-blue-500' : (isConfirmed ? 'border-green-500' : 'border-yellow-400'));

        container.innerHTML += `
            <div class="bg-white rounded-[2rem] p-6 shadow-sm border-l-[12px] ${borderClass} relative mb-4 transition hover:shadow-xl group">
                <div class="absolute top-5 right-5"><span class="${statusClass} text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">${item.Status}</span></div>
                
                <div class="mb-5">
                    <p class="text-[10px] font-bold text-slate-300 uppercase">${item.OrderID}</p>
                    <h3 class="text-2xl font-black text-slate-800 leading-tight capitalize">${item.Name || 'Tanpa Nama'}</h3>
                    <p class="text-sm text-slate-500 font-bold">${item.Phone}</p>
                </div>

                <div class="mt-2 mb-4 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                    <div>
                        <p class="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Assign Photographer</p>
                        <p class="text-xs font-black text-indigo-700 uppercase">${item.Photographer || 'TBA'}</p>
                    </div>
                    <i class="fas fa-camera-retro text-indigo-200"></i>
                </div>

                <div class="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div class="bg-gray-50 p-3 rounded-2xl"><p class="text-[9px] font-bold text-gray-400 uppercase">Masa & Tema</p><p class="font-black text-slate-700">${item.Time}</p><p class="text-[9px] text-slate-500 font-bold uppercase truncate">${item.Theme}</p></div>
                    <div class="bg-gray-50 p-3 rounded-2xl"><p class="text-[9px] font-bold text-gray-400 uppercase">Pax & Kategori</p><p class="font-black text-slate-700">${item.Pax.split(',')[0]}</p><p class="text-[9px] text-slate-500 font-bold uppercase truncate">${item.Package.replace('KATEGORI ', '')}</p></div>
                </div>
                
                ${item.AddOns && item.AddOns !== '-' && item.AddOns !== 'Tiada' ? `<div class="mb-4 flex flex-wrap gap-1">${item.AddOns.split(',').map(a => `<span class="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-1 rounded-lg border border-amber-100">${a.trim()}</span>`).join('')}</div>` : ''}
                ${item.Frame && item.Frame !== 'Tiada' ? `<div class="mb-4"><span class="bg-blue-50 text-blue-700 text-[9px] font-black px-2 py-1 rounded-lg border border-blue-100 uppercase"><i class="fas fa-box-open mr-1"></i> ALBUM: ${item.Frame}</span></div>` : ''}

                <div class="flex justify-between items-end mb-6 px-1">
                    <div><p class="text-[9px] font-bold text-gray-400 uppercase">Payment</p><p class="text-[10px] font-black text-slate-700 uppercase">${item.PaymentType || '-'}</p></div>
                    <div class="text-right"><p class="text-[9px] font-bold text-gray-400 uppercase">Total</p><p class="text-lg font-black text-slate-900 leading-none">RM ${item.TotalPrice}</p></div>
                </div>

                <!-- ACTION BUTTONS: Sorok Jika Cancelled -->
                ${!isCancelled ? `
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="handleCheckIn('${item.OrderID}')" class="${isArrived ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'} py-3.5 rounded-2xl font-black text-[10px] tracking-widest transition" ${isArrived ? 'disabled' : ''}>${isArrived ? 'LOKASI: STUDIO' : 'CHECK-IN'}</button>
                        <button onclick="${settleOnClick}" class="${settleBtnClass} py-3.5 rounded-2xl font-black text-[10px] tracking-widest transition uppercase italic">${settleBtnText}</button>
                    </div>
                    <button onclick="openEditModal('${itemString}')" class="w-full mt-2 bg-blue-50 text-blue-600 py-3 rounded-2xl font-bold text-[10px] hover:bg-blue-100 border border-blue-100 uppercase tracking-widest"><i class="fas fa-user-edit mr-1"></i> Kemaskini Data & Frame</button>
                    <button onclick="handleCancel('${item.OrderID}')" class="w-full mt-3 text-[9px] font-bold text-slate-300 hover:text-red-500 transition uppercase tracking-widest pt-3 border-t border-slate-50"><i class="fas fa-times-circle mr-1"></i> Batalkan Tempahan</button>
                ` : `
                    <div class="bg-red-50 p-4 rounded-3xl text-center border border-red-100">
                        <p class="text-[10px] font-black text-red-600 uppercase mb-2">Tempahan Dibatalkan</p>
                        <button onclick="handleDelete('${item.OrderID}')" class="bg-red-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 transition">
                            <i class="fas fa-trash-alt mr-1"></i> Padam Rekod Selamanya
                        </button>
                    </div>
                `}
            </div>`;
    });
}

// --- 4. ACTION HANDLERS ---

async function handleCheckIn(id) {
    if(!confirm(`Sahkan pendaftaran masuk bagi ${id}?`)) return;
    try {
        await fetch(GAS_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'check_in', orderID: id }) });
        fetchData();
    } catch (err) { alert("Ralat Check-in."); }
}

async function handleCancel(id) {
    if(!confirm(`Adakah anda pasti untuk MEMBATALKAN tempahan ${id}?`)) return;
    showLoader(true);
    try {
        await fetch(GAS_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'update_payment', orderID: id, status: 'Cancelled' }) });
        setTimeout(() => fetchData(), 1000);
    } catch (err) { alert("Gagal membatalkan."); }
}

async function handleDelete(id) {
    if(!confirm(`⚠️ BAHAYA: Padam terus rekod ${id} dari database? Tindakan ini tidak boleh diundur.`)) return;
    showLoader(true);
    try {
        await fetch(GAS_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'delete_row', orderID: id }) });
        setTimeout(() => fetchData(), 1000);
    } catch (err) { alert("Gagal memadam."); }
}

async function handleSettle(id, phone, isPaidFull) {
    if(!confirm(`Proses resit/baki untuk ${id}?`)) return;
    try {
        await fetch(N8N_SETTLE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-mkaj-api-key': 'MKAJ_Secure_Admin_2026_##' },
            body: JSON.stringify({ orderID: id, phone: phone, updateSheet: !isPaidFull })
        });
        alert("Resit sedang dihantar ke WhatsApp...");
        fetchData();
    } catch (err) { alert("Ralat sistem n8n."); }
}

// --- 5. MODAL & FILTER LOGIC ---

function openEditModal(itemJson) {
    const item = JSON.parse(decodeURIComponent(itemJson));
    document.getElementById('e_orderID').value = item.OrderID;
    document.getElementById('edit_orderID_label').innerText = item.OrderID;
    document.getElementById('e_phone').value = item.Phone;
    document.getElementById('e_date').value = item.Date || "";
    document.getElementById('e_time').value = item.Time || "09:30";
    document.getElementById('e_frame').value = (item.Frame && item.Frame !== "") ? item.Frame : "Tiada";
    document.getElementById('e_photoNum').value = item.PhotoNumber || "";
    document.getElementById('e_totalPrice').value = item.TotalPrice;
    document.getElementById('e_photographer').value = item.Photographer || "TBA";

    // Setup Theme Options
    const themeSelect = document.getElementById('e_theme');
    themeSelect.innerHTML = Object.values(rayaThemesDetail).map(v => `<option value="${v.title}" data-price="${v.price}" data-basepax="${v.paxCover}" data-type="${v.type}" data-category="${v.categoryName}">${v.title}</option>`).join('');
    themeSelect.value = item.Theme;

    // Parse Pax
    const adultMatch = (item.Pax || "").match(/(\d+)\s*Dewasa/);
    const kidMatch = (item.Pax || "").match(/(\d+)\s*Kanak-kanak/);
    editState.adult = adultMatch ? parseInt(adultMatch[1]) : 6;
    editState.kid = kidMatch ? parseInt(kidMatch[1]) : 0;

    document.getElementById('e_addon_makeup').checked = (item.AddOns || "").includes("Makeup");
    document.getElementById('e_addon_time').checked = (item.AddOns || "").includes("Tambahan Masa");

    onEditThemeChange();
    toggleModal('editModal', true);
}

function filterData() {
    const query = document.getElementById('searchBox').value.toLowerCase();
    const dateRange = document.getElementById('filterDateRange').value;
    const nowMY = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kuala_Lumpur"}));
    const todayStr = nowMY.getFullYear() + '-' + String(nowMY.getMonth() + 1).padStart(2, '0') + '-' + String(nowMY.getDate()).padStart(2, '0');

    const filtered = allData.filter(item => {
        const matchSearch = (item.Name || "").toLowerCase().includes(query) || (item.OrderID || "").toLowerCase().includes(query) || (item.Phone || "").includes(query);
        const matchStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.Status);
        const matchShooter = selectedShooters.includes(item.Photographer) || selectedShooters.length === 0;

        let matchDate = true;
        const itemDate = new Date(item.Date);
        if (dateRange === "today") matchDate = (item.Date === todayStr);
        else if (dateRange === "week") {
            const start = new Date(nowMY); start.setDate(nowMY.getDate() - nowMY.getDay() + 1); start.setHours(0,0,0,0);
            const end = new Date(start); end.setDate(start.getDate() + 6);
            matchDate = (itemDate >= start && itemDate <= end);
        } else if (dateRange === "custom") {
            const sVal = document.getElementById('dateStart').value;
            const eVal = document.getElementById('dateEnd').value;
            if (sVal && eVal) {
                const s = new Date(sVal); s.setHours(0,0,0,0);
                const e = new Date(eVal); e.setHours(23,59,59,999);
                matchDate = (itemDate >= s && itemDate <= e);
            }
        }
        return matchSearch && matchStatus && matchShooter && matchDate;
    });
    renderData(filtered);
}

// ... (Kekalkan fungsi initAlbumList, initTimeSlots, calculateEditPrice, submitWalkIn bos sedia ada) ...

window.onload = () => {
    fetchData();
    if(typeof initWalkInThemes === "function") initWalkInThemes();
    if(typeof initTimeSlots === "function") initTimeSlots();
    if(typeof initAlbumList === "function") initAlbumList();
};