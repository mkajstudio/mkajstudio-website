/* 
   MKAJ ADMIN LOGIC - admin.js V33.0 (STABLE)
   Updates: Fixed Date Parsing for Malaysian Format (DD/MM/YYYY)
*/

// --- 1. SECURITY PIN ---
const ADMIN_PIN = "0000"; 
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

// --- 2. CONFIGURATION ---
const GAS_URL = "https://script.google.com/macros/s/AKfycbw9AfunhFacp2Aa19jhnRTe8vwnvGXMV5y7u1lG4w4Yx8cr2SenLRAlQr_8agN8D-gS/exec";
const N8N_SETTLE_URL = "https://api.mkajstudio.com/webhook/mkaj-settle-balance";
const TIME_SLOTS = ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];

let allData = [];
let selectedStatuses = [];
let selectedShooters = [];
let editState = { adult: 0, kid: 0, currentBasePrice: 0, currentBasePax: 8, currentType: 'family', familyTier: 'small' };

// --- 3. HELPER: UPDATE UI SAFELY ---
function updateText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

// --- HELPER BARU: PARSE DATE MALAYSIA (DD/MM/YYYY) ---
function parseDateMY(dateStr) {
    if (!dateStr) return new Date(0);
    // Jika format YYYY-MM-DD (ISO)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return new Date(dateStr);
    
    // Jika format DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // Tukar jadi YYYY-MM-DD untuk JS
    }
    return new Date(dateStr); // Fallback
}

// --- 4. FETCH & RENDER ---

async function fetchData() {
    const loader = document.getElementById('loader');
    if(loader) loader.classList.remove('hidden');
    try {
        const response = await fetch(`${GAS_URL}?action=get_data&t=${Date.now()}`, { method: 'GET', redirect: 'follow' });
        allData = await response.json();
        if (Array.isArray(allData)) renderData(allData);
    } catch (err) {
        console.error("Database Error:", err);
    } finally {
        if(loader) loader.classList.add('hidden');
    }
}

function renderData(data) {
    const container = document.getElementById('container');
    if(!container) return;
    container.innerHTML = '';

    // Update Stats
    updateText('statTotal', data.length);
    updateText('statPaid', data.filter(r => r.Status === 'Confirmed').length);
    updateText('statArrived', data.filter(r => r.Status === 'Arrived').length);
    updateText('statPending', data.filter(r => r.Status === 'Pending').length);
    updateText('statCanceled', data.filter(r => (String(r.Status).toLowerCase().includes('cancel') || r.Status === 'Rejected')).length);

    // Sorting (Ascending) - FIX DATE SORTING
    const sortedData = [...data].sort((a, b) => {
        const dateA = parseDateMY(a.Date);
        const dateB = parseDateMY(b.Date);
        
        // Gabung tarikh + masa untuk sorting tepat
        const timeA = a.Time ? a.Time.replace(':', '') : '0000';
        const timeB = b.Time ? b.Time.replace(':', '') : '0000';
        
        if (dateA - dateB !== 0) return dateA - dateB;
        return timeA - timeB;
    });

    let lastDate = "";
    sortedData.forEach(item => {
        // Standardkan tarikh untuk grouping header
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

        let settleBtnText = isPaidFull ? 'PAID IN FULL' : (pt.includes("WALK-IN") ? 'HANTAR RESIT' : 'SETTLE BAKI');
        let settleBtnClass = isPaidFull ? "bg-green-100 text-green-700 border border-green-200 cursor-default" : (pt.includes("WALK-IN") ? "bg-green-600 text-white" : "bg-yellow-500 text-slate-900");
        let settleOnClick = isPaidFull ? "alert('Resit dah dihantar')" : `handleSettle('${item.OrderID}', '${item.Phone}', ${pt.includes("WALK-IN")})`;

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
                        <button onclick="handleCheckIn('${item.OrderID}')" class="${isArrived ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'} py-3.5 rounded-2xl font-black text-[10px]" ${isArrived ? 'disabled' : ''}>CHECK-IN</button>
                        <button onclick="${settleOnClick}" class="${settleBtnClass} py-3.5 rounded-2xl font-black text-[10px] uppercase shadow-sm">${settleBtnText}</button>
                    </div>
                    <button onclick="openEditModal('${itemString}')" class="w-full mt-2 bg-blue-50 text-blue-600 py-3 rounded-2xl font-bold text-[10px] border border-blue-100 uppercase"><i class="fas fa-edit mr-1"></i> Kemaskini Data & Frame</button>
                    <button onclick="handleCancel('${item.OrderID}')" class="w-full mt-3 text-[9px] font-bold text-slate-300 hover:text-red-500 transition uppercase pt-2 border-t border-slate-50">Batalkan Tempahan</button>
                ` : `
                    <div class="bg-red-50 p-4 rounded-3xl text-center border border-red-100">
                        <p class="text-[10px] font-black text-red-600 uppercase mb-2">Dibatalkan</p>
                        <button onclick="handleDelete('${item.OrderID}')" class="bg-red-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg transition">Padam Rekod</button>
                    </div>
                `}
            </div>`;
    });
}

// --- 5. FILTER LOGIC (FIX DATE COMPARISON) ---

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
        
        // Guna parseDateMY supaya perbandingan adil
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

// --- 6. INITIALIZERS ---
window.initTimeSlots = function() {
    const options = TIME_SLOTS.map(t => `<option value="${t}">${t}</option>`).join('');
    if(document.getElementById('w_time')) document.getElementById('w_time').innerHTML = options;
    if(document.getElementById('e_time')) document.getElementById('e_time').innerHTML = options;
}

window.initAlbumList = function() {
    if(typeof albumTypes === 'undefined') return;
    const html = albumTypes.map(a => `<option value="${a.name}" data-price="${a.price}">${a.name} (+RM${a.price})</option>`).join('');
    if(document.getElementById('w_frame_select')) document.getElementById('w_frame_select').innerHTML = html;
    if(document.getElementById('e_frame')) {
        document.getElementById('e_frame').innerHTML = html;
        document.getElementById('e_frame').onchange = calculateEditPrice;
    }
}

window.initWalkInThemes = function() {
    const select = document.getElementById('w_theme_select');
    if(!select || typeof rayaThemesDetail === 'undefined') return;
    select.innerHTML = '<option value="">-- Pilih Tema Raya --</option>';
    for (const [key, val] of Object.entries(rayaThemesDetail)) {
        let opt = document.createElement('option');
        opt.value = key; opt.innerText = `${val.title} (${val.type.toUpperCase()})`;
        select.appendChild(opt);
    }
}

// Expose functions globally
window.fetchData = fetchData;
window.filterData = filterData;

window.onload = () => {
    fetchData();
    window.initTimeSlots();
    window.initWalkInThemes();
    window.initAlbumList();
};

// ... (Kekalkan fungsi logic lain spt handleCheckIn, handleSettle, dll)
// Pastikan anda menyalin fungsi handleCheckIn, handleCancel, handleDelete, submitWalkIn, openEditModal dari fail asal jika ia tiada di sini.
// Kod di atas menumpukan pada pembaikan struktur utama & date parsing.