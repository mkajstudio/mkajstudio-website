/* 
   assets/js/booking.js 
   MKAJ STUDIO V6 - Layout Checkout Baru
*/

// --- 1. CONFIGURATION ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwdGTp-FCzsQeZ4Kwgl-AOMA45XS-0bBu9TGiPAyUhb_LCTl-ObaHS-QEkCKKNoYv0g/exec"; 
const TIME_SLOTS = ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];

const SEASON_START = "2026-03-05"; 
const SEASON_END = "2026-04-03";   
const BLOCKED_DATES = [];
/* --- TAMBAH INI DI BAHAGIAN ATAS CONFIGURATION --- */

// Senarai tarikh yang harga berbeza (Raya 1, 2, 3)
const PEAK_DATES = []; 

// Berapa ringgit nak tambah? (Contoh +RM100)
const PEAK_SURCHARGE = 0;

let currentStep = 1;
let bookingData = {
    packageId: "",
    packagePrice: 0,
    basePaxLimit: 0,
    paxAdult: 0, 
    paxKids: 0,
    currentPax: 0, // Logic pax
    theme: "",
    themeType: "family",
    date: "",
    time: "",
    addOns: "",
    total: 0,
    paymentType: "DEPOSIT"
};

// --- WIZARD INIT ---

/* assets/js/booking.js - openBookingWizard (Updated V9) */

// Tambah parameter ke-5: 'preSelectedTheme'
function openBookingWizard(categoryName, price, basePaxLimit, type, preSelectedTheme) {
    const wizard = document.getElementById('booking-wizard');
    if(wizard) wizard.classList.remove('hidden');

    // Data Reset
    bookingData.packageId = categoryName; 
    bookingData.packagePrice = price;
    bookingData.basePaxLimit = basePaxLimit;
    bookingData.total = price;
    bookingData.themeType = type || 'family'; 
    bookingData.addOns = "";
    
    // 1. SET LABEL KATEGORI (READONLY)
    const pkgInput = document.getElementById('bk-package');
    if(pkgInput) {
        pkgInput.value = `${categoryName} (RM${price})`; 
        // Warna UI Input Step 1
        if(type === 'couple') {
            pkgInput.className = "w-full bg-pink-50 border border-pink-200 p-3 rounded font-bold text-pink-600 uppercase tracking-wide cursor-not-allowed shadow-inner";
        } else {
            pkgInput.className = "w-full bg-green-50 border border-green-200 p-3 rounded font-bold text-green-700 uppercase tracking-wide cursor-not-allowed shadow-inner";
        }
    }
    
    // 2. RESET DROPDOWN TEMA & AUTO-SELECT
    const themeSelect = document.getElementById('bk-theme');
    if (themeSelect && typeof rayaThemesDetail !== 'undefined') {
        themeSelect.innerHTML = "";
        
        // Loop masukkan tema dalam dropdown (Filter ikut jenis couple/family)
        for (const [key, val] of Object.entries(rayaThemesDetail)) {
            // Tapis: Kalau jenis form 'couple', cuma tunjuk tema couple. 
            // Kalau form 'family', cuma tunjuk family.
            if (val.type !== type) continue; 

            let opt = document.createElement('option');
            opt.value = val.title;
            opt.innerText = val.title;
            opt.dataset.type = val.type;
            themeSelect.appendChild(opt);
        }

        // --- FIX UTAMA: PAKSA PILIH TEMA YANG KLIK TADI ---
        if(preSelectedTheme) {
            themeSelect.value = preSelectedTheme;
        }
    }
    
    // 3. JALANKAN LOGIC LABEL & DATE RESET
    checkThemeType(); 

    // UI Reset Date
    const dateInput = document.getElementById('bk-date');
    if(dateInput) {
        dateInput.value = "";
        dateInput.setAttribute('min', SEASON_START);
        dateInput.setAttribute('max', SEASON_END);
    }
    document.getElementById('time-slots-container').innerHTML = `<div class="col-span-4 text-center py-4 bg-gray-50 text-gray-400 text-sm">Pilih tarikh dahulu.</div>`;
    
    const btnNext = document.getElementById('btn-step-2');
    if(btnNext) btnNext.disabled = true;

    // Reset addons
    document.querySelectorAll('.bk-addon').forEach(chk => chk.checked = false);
    
    // Default Deposit
    setPaymentType('deposit'); 
    
    // Buka Step 1
    currentStep = 1;
    showStep(1);
}

function closeWizard() {
    document.getElementById('booking-wizard').classList.add('hidden');
}

// --- NAVIGATION & LOGIC ---

function nextStep(step) {
    try {
        // Validation Logic
        if (step === 2) {
        const nameRaw = getValue('bk-name');
        const phoneRaw = getValue('bk-phone'); // User mungkin taip: 012-345 6789

        if (!nameRaw || !phoneRaw) {
            alert("Sila isi Nama Penuh dan Nombor Telefon.");
            return;
        }

        // --- PHONE NUMBER FORMATTING & VALIDATION ---
        
        // 1. Buang semua karakter bukan nombor (dash, space, dll)
        // Contoh: "012-345 6789" -> "0123456789"
        let cleanPhone = phoneRaw.replace(/\D/g, ''); 

        // 2. Logic Tambah +6
        if (cleanPhone.startsWith('60')) {
            // Kalau user dah pandai tulis 6012...
            cleanPhone = '+' + cleanPhone; 
        } else if (cleanPhone.startsWith('0')) {
            // Kalau user tulis 012... -> Buang 0 depan, tambah +60
            cleanPhone = '+60' + cleanPhone.substring(1); 
        } else {
            // Kalau user tulis 12... (jarang berlaku)
            cleanPhone = '+60' + cleanPhone;
        }

        // 3. Validation Panjang Nombor (Malaysia biasa 11-13 digit termasuk +60)
        // Format: +601x xxxxxxx
        if (cleanPhone.length < 11 || cleanPhone.length > 14) {
            alert("Nombor telefon tidak sah. Sila masukkan nombor yang betul.");
            return;
        }

        // Simpan data bersih
        bookingData.name = nameRaw;
        bookingData.phone = cleanPhone; // Sekarang formatnya konfirm +601xxxxxx
        bookingData.email = getValue('bk-email');
        }
        if(step === 3) {
            if(!bookingData.date || !bookingData.time) { alert("Sila pilih masa."); return; }
        }
        if(step === 4) {
            // STEP INI UPDATE SUMMARY SEBELUM TAMPIL
            calculateTotal(); 
            
            setText('rev-name', bookingData.name);
            setText('rev-package', bookingData.packageId);
            setText('rev-theme', bookingData.theme);
            setText('rev-datetime', `${formatDateUI(bookingData.date)} @ ${bookingData.time}`);
            
            // Format Pax string
            let paxStr = `${bookingData.paxAdult} Dewasa`;
            if(bookingData.paxKids > 0) paxStr += `, ${bookingData.paxKids} Kanak-kanak`;
            setText('rev-pax', paxStr);

            // --- UPDATE BARU: UI EXTRA/SURCHARGE ---
            const addonRow = document.getElementById('row-addons');
            const addonText = document.getElementById('rev-addons');
        
            if (bookingData.addOns && bookingData.addOns !== "Tiada" && bookingData.addOns !== "") {
                // Kalau ada Surcaj/Addon, tunjuk baris ini
                addonText.innerText = bookingData.addOns;
                addonRow.classList.remove('hidden');
            } else {
                // Kalau tiada, sorok
                addonRow.classList.add('hidden');
            }

            // Trigger payment styling update
            setPaymentType(bookingData.paymentType === "DEPOSIT" ? 'deposit' : 'full');

            // --- RESET TNC STATE (TAMBAH KOD INI) ---
            const chk = document.getElementById('tnc-checkbox');
            const box = document.getElementById('tnc-scroll-box');
            const hint = document.getElementById('tnc-hint');
            const btnSubmit = document.getElementById('btn-confirm-wa');

        }

        currentStep = step;
        showStep(step);
        
    } catch(e) {
        console.error("Nav Error:", e); // Debug kalau stuck
        alert("Sila lengkapkan maklumat sebelum teruskan.");
    }
}

function showStep(step) {
    // Hide all
    document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
    
    // Show current with animation reset
    const target = document.getElementById(`step-${step}`);
    target.classList.remove('hidden');
    target.classList.remove('fade-in'); 
    void target.offsetWidth; // Trigger reflow
    target.classList.add('fade-in');

    // Dots
    for(let i=1; i<=4; i++) {
        const dot = document.getElementById(`step-dot-${i}`);
        if(i <= step) dot.classList.replace('bg-gray-300', 'bg-amber-600');
        else dot.classList.replace('bg-amber-600', 'bg-gray-300');
    }
}

// --- CALCULATIONS ---

function checkThemeType() {
    const select = document.getElementById('bk-theme');
    if (!select || !select.options.length) return;
    const selectedOpt = select.options[select.selectedIndex];
    bookingData.theme = select.value;
    // Jenis tema ('couple'/'family')
    bookingData.themeType = selectedOpt.dataset.type || 'family';
    
    // LOGIC LABEL BAWAH TEMA (UPDATE 2)
    const catLabel = document.getElementById('bk-cat-label');
    if(catLabel) {
        if(bookingData.themeType === 'couple') {
            catLabel.innerText = "KATEGORI COUPLE (MAX 4 PAX)";
            catLabel.className = "text-[10px] font-bold mt-1 tracking-widest uppercase text-pink-500";
        } else {
            catLabel.innerText = "KATEGORI FAMILY (COVER 6 PAX)";
            catLabel.className = "text-[10px] font-bold mt-1 tracking-widest uppercase text-green-600";
        }
    }
    bookingData.theme = select.value;
    bookingData.themeType = selectedOpt.dataset.type || 'family';

    // ============================================
    // FIX UTAMA: RESET TARIKH & MASA BILA TEMA TUKAR
    // ============================================
    bookingData.date = "";
    bookingData.time = "";
    
    // 1. Kosongkan Input Tarikh
    const dateInput = document.getElementById('bk-date');
    if(dateInput) dateInput.value = "";
    
    // 2. Kosongkan Slot Container (Tutup slot lama supaya user tak tertipu)
    const slotContainer = document.getElementById('time-slots-container');
    if(slotContainer) {
        slotContainer.innerHTML = `<div class="col-span-4 text-center py-4 bg-gray-50 text-gray-400 text-sm italic">Sila pilih tarikh semula untuk semak kekosongan ${bookingData.theme}.</div>`;
    }

    // 3. Matikan button Next
    document.getElementById('btn-step-2').disabled = true;

    // Update rules pax ikut tema baru
    updatePaxConstraintUI();
}

/* DALAM FUNCTION updatePaxConstraintUI() */

function updatePaxConstraintUI() {
    const warningText = document.getElementById('pax-warning');
    
    // RESET Value default
    // Dulu kita set PaxAdult = 2, sekarang boleh set 2 (sebagai standard) 
    // Tapi user boleh ubah jadi 4 dewasa 0 kanak-kanak.
    bookingData.paxKids = 0; 

    if (bookingData.themeType === 'couple') {
        bookingData.paxAdult = 2; // Default starting
        
        // TEKS BARU
        warningText.innerText = "* Kategori Couple/Mini: Maksima 4 Orang (Gabungan Dewasa & Kanak-kanak).";
        warningText.className = "text-xs text-pink-600 font-bold mb-1"; 
    } else {
        // Family kekal
        bookingData.paxAdult = bookingData.basePaxLimit; 
        warningText.innerText = `* Kategori Family cover ${bookingData.basePaxLimit} Dewasa. Extra +RM10/pax.`;
        warningText.className = "text-xs text-green-700 font-bold mb-1";
    }

    refreshPaxUI();
}

/* DALAM FUNCTION updatePax(type, change) */

function updatePax(type, change) {
    let currA = bookingData.paxAdult;
    let currK = bookingData.paxKids;

    // Tambah/Tolak dulu secara sementara
    if (type === 'adult') currA += change;
    else currK += change;

    // Minimum check
    if (currA < 1) return; // Min 1 dewasa wajib
    if (currK < 0) return; 

    // --- LOGIC CONSTRAINT BARU ---
    
    if (bookingData.themeType === 'couple') {
        // KIRA TOTAL SEMUA
        let totalOrang = currA + currK;
        
        // Rule: Tak kisah kombinasi, asalkan TOTAL tak lebih 4
        if (totalOrang > 4) {
            alert("Maaf, Pakej RM89 terhad untuk 4 Pax sahaja (Total Dewasa + Kanak-kanak).");
            return; // Jangan update data
        }
    } else {
        // Rule Family: Studio Max 20
        if((currA + currK) > 20) { 
            alert("Studio Full (Max 20 Pax)."); 
            return; 
        }
    }

    // Update Data
    bookingData.paxAdult = currA;
    bookingData.paxKids = currK;
    
    refreshPaxUI();
}

function refreshPaxUI() {
    setText('bk-pax-adult', bookingData.paxAdult);
    setText('bk-pax-kid', bookingData.paxKids);
    calculateTotal();
}

/* assets/js/booking.js - REPLACE calculateTotal() */

function calculateTotal() {
    let price = bookingData.packagePrice;
    
    // Array untuk simpan senarai barang tambahan (utk display summary)
    let detailsList = [];

    // 1. PAX CHARGES (Family)
    if (bookingData.themeType === 'family' && bookingData.paxAdult > bookingData.basePaxLimit) {
        // Kira berapa orang extra
        let extraHead = bookingData.paxAdult - bookingData.basePaxLimit;
        price += (extraHead * 10);
        // detailsList.push(`Extra Pax (+RM${extraHead * 10})`); // Optional kalau nak tulis
    }
    
    // 2. LOGIC SURCAJ RAYA (NEW UPDATE)
    /*if (bookingData.date && PEAK_DATES.includes(bookingData.date)) {
        price += PEAK_SURCHARGE; // Tambah RM10
        
        // Masukkan dalam list supaya nampak kat summary/whatsapp
        detailsList.push(`Surcharge Raya (+RM${PEAK_SURCHARGE})`);
    }*/

    // 3. ADD-ONS CHECKBOX
    document.querySelectorAll('.bk-addon:checked').forEach(chk => {
        if(chk.value.includes("150")) price += 150;
        if(chk.value.includes("20")) price += 20;
        
        // Ambil nama addon shj (buang harga dlm kurungan utk text)
        // cth "Makeup (+RM150)" jadi "Makeup" (kalau nak kemas), atau ambil full value
        detailsList.push(chk.value.split(" (+RM")[0]); // Ambil nama addon sahaja
    });
    
    // Simpan Total
    bookingData.total = price;
    
    // Gabungkan list addon jadi ayat. Contoh: "Surcharge Raya (+RM10), Makeup (+RM150)"
    bookingData.addOns = detailsList.length > 0 ? detailsList.join(", ") : "Tiada";

    // Update Display di HTML
    const s3 = document.getElementById('bk-total-step3'); // Total step 3
    const sf = document.getElementById('bk-total-final'); // Total step 4 (Summary)
    const fl = document.getElementById('lbl-full-amt');   // Total dlm butang Full Payment
    
    if(s3) s3.innerText = price;
    if(sf) sf.innerText = price;
    if(fl) fl.innerText = price;
}


// --- PAYMENT CHOICE UI ---

function setPaymentType(type) {
    bookingData.paymentType = (type === 'deposit') ? "Deposit" : "Full Payment";
    
    const d = document.getElementById('pay-opt-deposit');
    const f = document.getElementById('pay-opt-full');
    const cd = document.getElementById('chk-deposit');
    const cf = document.getElementById('chk-full');

    // Style Class Helper
    const activeClass = "border-amber-600 bg-amber-50 ring-2 ring-amber-600 shadow-md transform scale-[1.02]";
    const inactiveClass = "border-gray-200 bg-white opacity-60 grayscale hover:opacity-100 hover:grayscale-0";

    // Reset base styles (gunakan logic mudah: replace semua class list supaya bersih)
    // Utk memudahkan: saya set class secara direct string manipulation
    
    if (type === 'deposit') {
        d.className = `relative group p-4 border rounded-xl text-center transition ` + activeClass;
        f.className = `relative group p-4 border rounded-xl text-center transition ` + inactiveClass;
        
        cd.className = "absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-600 border border-amber-600 shadow"; // Tick penuh
        cf.className = "absolute top-2 right-2 w-4 h-4 rounded-full border border-gray-300"; // Kosong
    } else {
        f.className = `relative group p-4 border rounded-xl text-center transition border-green-600 bg-green-50 ring-2 ring-green-600 shadow-md transform scale-[1.02]`;
        d.className = `relative group p-4 border rounded-xl text-center transition ` + inactiveClass;
        
        cf.className = "absolute top-2 right-2 w-4 h-4 rounded-full bg-green-600 border border-green-600 shadow";
        cd.className = "absolute top-2 right-2 w-4 h-4 rounded-full border border-gray-300";
    }
}


// --- SUBMISSION ---

function submitBooking() {
    const btn = document.getElementById('btn-confirm-wa');
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Hantar...`;
    btn.disabled = true;

    const uniqueID = "RAYA-" + Math.floor(10000 + Math.random() * 90000);
    const payMethodStr = bookingData.paymentType === 'Deposit' ? 'DEPOSIT RM50' : 'BAYARAN PENUH';

    const payload = {
        orderID: uniqueID,
        name: bookingData.name,
        phone: bookingData.phone,
        email: bookingData.email,
        package: bookingData.packageId,
        theme: bookingData.theme,
        date: bookingData.date,
        time: bookingData.time,
        pax: `${bookingData.paxAdult} Dewasa, ${bookingData.paxKids} Kanak-kanak`,
        addOns: bookingData.addOns,
        totalPrice: bookingData.total,
        paymentType: bookingData.paymentType,
        status: "Pending"
    };

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).then(() => {
        // Prepare Payment Instruction
        let msgPay = "";
        if (bookingData.paymentType === 'Deposit') {
            msgPay = "💳 *JENIS BAYARAN: DEPOSIT (RM50)*\nSaya akan bayar deposit RM50 dahulu. Sila berikan info bank/QR.";
        } else {
            msgPay = `💳 *JENIS BAYARAN: PENUH (RM${bookingData.total})*\nSaya ingin bayar penuh. Sila berikan info bank/QR.`;
        }

        const waMsg = 
`Hi MKAJ Studio! 👋 
Saya nak confirmkan Booking Raya 2026.

🆔 *${uniqueID}*
👤 ${bookingData.name}
🕌 ${bookingData.theme}
📅 ${formatDateUI(bookingData.date)} @ ${bookingData.time}
➕ *Extra:* ${bookingData.addOns}
💰 RM${bookingData.total}

${msgPay} Terima kasih!`;

        // --- UPDATE DI SINI: GANTI REDIRECT WHATSAPP KE PAGE SUCCESS ---
        
        // 1. Simpan mesej ke memori browser
        localStorage.setItem('lastWaMsg', waMsg);

        // 2. Redirect ke page success (untuk tracking Google Ads/Analytics)
        window.location.href = "/success"; 

    }).catch(e => {
        // Jika ada error sekalipun, kita tetap hantar ke WhatsApp Admin
        window.location.href = "https://wa.me/601166364521"; 
    });
}

// Helpers
function setText(id, val) { 
    const el = document.getElementById(id); 
    if(el) el.innerText = val; 
}
function getValue(id) { 
    const el = document.getElementById(id); 
    return el ? el.value : ""; 
}
function formatDateUI(dateStr) {
    if(!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' });
}
/* --- REPLACE checkAvailability() SEPENUHNYA --- */

function checkAvailability() {
    const dateInput = document.getElementById('bk-date');
    const dateVal = dateInput.value;
    const themeSelect = document.getElementById('bk-theme');
    
    // UI Helpers
    const errText = document.getElementById('date-error-msg');
    const surchargeMsg = document.getElementById('peak-date-msg');
    const container = document.getElementById('time-slots-container');
    const btnNext = document.getElementById('btn-step-2');

    // 1. RESET UI (Padam semua warning/error dulu)
    if(errText) errText.classList.add('hidden');
    if(surchargeMsg) surchargeMsg.classList.add('hidden');
    dateInput.classList.remove('border-red-500', 'bg-red-50'); 
    
    // Disable butang next sementara waktu
    if(btnNext) btnNext.disabled = true;

    // Validation Asas
    if (!dateVal) return; 
    
    if (themeSelect.value === "") {
        alert("Sila pilih Tema dahulu.");
        dateInput.value = "";
        return;
    }

    // 2. CHECK BLOCKED DATES (CUTI) - UPDATE PENTING DI SINI
    if(BLOCKED_DATES.includes(dateVal)) {
        if(errText) {
            errText.innerText = "Maaf, Studio TUTUP/CUTI pada tarikh ini.";
            errText.classList.remove('hidden');
        }
        dateInput.classList.add('border-red-500', 'bg-red-50');
        
        // PADAM SLOT MASA! (Ini yang kurang sebelum ni)
        container.innerHTML = `
            <div class="col-span-4 text-center py-6 bg-red-50 border border-red-100 rounded text-red-500 text-sm font-bold flex flex-col items-center justify-center gap-2">
                <i class="fas fa-ban text-2xl"></i>
                <span>TIADA SLOT (CUTI)</span>
            </div>
        `;
        
        bookingData.date = ""; // Reset date dlm memory
        return; // BERHENTI DI SINI. Jangan call server.
    }

    // 3. CHECK STRICT RANGE
    const userDate = new Date(dateVal);
    const startLimit = new Date(SEASON_START);
    const endLimit = new Date(SEASON_END);
    userDate.setHours(0,0,0,0); startLimit.setHours(0,0,0,0); endLimit.setHours(0,0,0,0);

    if (userDate < startLimit || userDate > endLimit) {
        const formatTarik = (d) => d.split('-').reverse().join('/'); 
        if(errText) {
            errText.innerText = `Harap maaf. Pilih antara ${formatTarik(SEASON_START)} - ${formatTarik(SEASON_END)}.`;
            errText.classList.remove('hidden');
        }
        dateInput.classList.add('border-red-500', 'bg-red-50');
        
        // Padam slot masa
        container.innerHTML = `<div class="col-span-4 text-center py-4 bg-gray-50 text-gray-400 text-sm">Tarikh tidak sah.</div>`;
        
        bookingData.date = "";
        return; 
    }

    // 4. CHECK SURCAJ (Raya 1-3)
    if (PEAK_DATES.includes(dateVal)) {
        if(surchargeMsg) {
            document.getElementById('ui-surcharge-amt').innerText = PEAK_SURCHARGE; 
            surchargeMsg.classList.remove('hidden'); 
        }
    }
    
    // --- SEMUA OK, CALL SERVER ---
    
    bookingData.date = dateVal;
    calculateTotal(); // Update harga kalau ada surcaj

    const loader = document.getElementById('time-loader');
    
    container.classList.add('opacity-50'); 
    if(loader) loader.classList.remove('hidden');
    
    fetch(`${GOOGLE_SCRIPT_URL}?action=check_slots&date=${dateVal}&theme=${encodeURIComponent(themeSelect.value)}`)
    .then(r => r.json())
    .then(d => {
        if(loader) loader.classList.add('hidden'); 
        container.classList.remove('opacity-50');
        renderTimeSlots(d.bookedSlotIds || []);
    })
    .catch(e => {
        if(loader) loader.classList.add('hidden'); 
        container.classList.remove('opacity-50'); 
        renderTimeSlots([]); 
    });
}
/* --- REPLACE FUNCTION renderTimeSlots INI DALAM booking.js --- */

/* --- GANTI FUNCTION renderTimeSlots INI --- */

function renderTimeSlots(fullSlots) {
    const container = document.getElementById('time-slots-container');
    container.innerHTML = '';

    TIME_SLOTS.forEach(time => {
        // 1. Check Penuh (Traffic Control)
        const isFull = fullSlots.includes(time) || fullSlots.includes(`${bookingData.theme}_${time}`);
        
        // 2. Check Masa Lepas (Last Minute)
        const isExpired = isSlotExpired(time, bookingData.date);

        // Gabung dua-dua jadi "Blocked"
        const isBlocked = isFull || isExpired;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerText = time;
        
        // UI STYLE LOGIC:
        if (isBlocked) {
            // WARNA MERAH UNTUK SLOT TAK AVAILABLE
            // bg-red-50 = Background merah lembut
            // text-red-400 = Tulisan merah pudar
            // cursor-not-allowed = Simbol 'No Entry' bila hover
            // opacity-60 = Nampak pudar sikit
            btn.className = "bg-red-50 text-red-400 border border-red-100 cursor-not-allowed py-2 rounded text-sm line-through decoration-red-300 opacity-80";
            btn.disabled = true;
        } else {
            // SLOT KOSONG (HIJAU/PUTIH BIASA)
            btn.className = "bg-white hover:bg-black hover:text-white border border-gray-300 text-black py-2 rounded text-sm transition shadow-sm hover:shadow-md";
            
            // Logic klik (Bila user pilih slot ini)
            btn.onclick = () => {
                 // Reset slot lain jadi putih balik
                 Array.from(container.children).forEach(b => !b.disabled && (b.className="bg-white hover:bg-black hover:text-white border border-gray-300 text-black py-2 rounded text-sm transition shadow-sm"));
                 
                 // Highlight slot yang dipilih (Amber/Gold)
                 btn.className = "bg-amber-600 text-white border-amber-600 py-2 rounded text-sm font-bold shadow transform scale-105 ring-2 ring-offset-1 ring-amber-600";
                 
                 bookingData.time = time; 
                 document.getElementById('bk-time').value = time;
                 document.getElementById('btn-step-2').disabled = false;
            };
        }
        
        container.appendChild(btn);
    });
}

// --- FUNCTION BARU: LOGIK LAST MINUTE (Paste bawah renderTimeSlots) ---

function isSlotExpired(slotTimeStr, selectedDateStr) {
    // 1. Dapatkan tarikh dan masa semasa
    const now = new Date(); // Masa PC user sekarang
    
    // 2. Proses Tarikh yang dipilih (Reset jam kepada 00:00:00 untuk banding tarikh sahaja)
    // Cara selamat parsing "YYYY-MM-DD"
    const [selYear, selMonth, selDay] = selectedDateStr.split('-').map(Number);
    const selectedDateObj = new Date(selYear, selMonth - 1, selDay); // Bulan mula dari 0 dalam JS
    
    // Create objek 'Today' (tanpa jam/minit)
    const todayObj = new Date();
    todayObj.setHours(0,0,0,0);

    // --- CHECK A: Tarikh Lampau (Semalam, Kelmarin) ---
    // Walaupun input date dah ada min/max, ini layer keselamatan tambahan.
    if (selectedDateObj < todayObj) {
        return true; // Expired (Tarikh dah lepas)
    }

    // --- CHECK B: Masa Depan (Esok dan seterusnya) ---
    if (selectedDateObj > todayObj) {
        return false; // Available (Belum lepas)
    }

    // --- CHECK C: Hari Ini (Last Minute Check) ---
    // Kalau tarikh SAMA dengan hari ini, baru kita kira jam
    
    // Logic: Current Time + Buffer (Contoh: 1 Jam)
    // Maksudnya: Kalau skrg pukul 10:00, cutoff ialah 11:00. 
    // User tak boleh book slot 10:30 (sbb kurang sejam).
    
    const bufferHours = 1; // Setting: Sejam sebelum shoot
    const cutOffTime = new Date();
    cutOffTime.setHours(now.getHours() + bufferHours);

    // Parse Slot Time (Cth "14:30") jadi Objek Tarikh Hari Ini
    const [h, m] = slotTimeStr.split(':').map(Number);
    const slotObj = new Date(); 
    slotObj.setHours(h, m, 0, 0);

    // Bandingkan
    if (slotObj < cutOffTime) {
        return true; // Expired (Kurang sejam atau dah lepas)
    }

    return false; // Available
}
