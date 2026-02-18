/* 
   assets/js/booking.js 
   MKAJ STUDIO V16.0 - RESTORED & ENHANCED
*/

// --- 1. CONFIGURATION (Kekalkan dari fail asal bos) ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwdGTp-FCzsQeZ4Kwgl-AOMA45XS-0bBu9TGiPAyUhb_LCTl-ObaHS-QEkCKKNoYv0g/exec"; 
const TIME_SLOTS = ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
const SEASON_START = "2026-03-05"; 
const SEASON_END = "2026-04-03";   
const BLOCKED_DATES = [];
const PEAK_DATES = []; 
const PEAK_SURCHARGE = 0;

let currentStep = 1;
let selectedTierTemp = ""; // Pegang tier dari modal

let bookingData = {
    packageId: "",
    packagePrice: 0,
    basePaxLimit: 8,
    paxAdult: 1, 
    paxKids: 0,
    familyTier: "small", 
    theme: "",
    themeType: "family",
    date: "",
    time: "",
    addOns: "",
    total: 0,
    paymentType: "Deposit"
};

// --- WIZARD INIT ---

function openBookingWizard(categoryName, price, basePaxLimit, type, preSelectedTheme) {
    const wizard = document.getElementById('booking-wizard');
    if(wizard) wizard.classList.remove('hidden');

    bookingData.themeType = type || 'family';
    bookingData.theme = preSelectedTheme || "";
    
    // 1. SYNC DATA HARGA BERDASARKAN TIER DARI MODAL
    if(type === 'couple') {
        bookingData.paxAdult = 2;
        bookingData.packageId = "KATEGORI COUPLE";
        bookingData.packagePrice = 89;
    } else {
        if(selectedTierTemp === 'large') {
            bookingData.paxAdult = 9;
            bookingData.packageId = "KATEGORI FAMILY (9-15 PAX)";
            bookingData.packagePrice = 199;
            bookingData.familyTier = 'large';
        } else {
            bookingData.paxAdult = 1;
            bookingData.packageId = "KATEGORI FAMILY (1-8 PAX)";
            bookingData.packagePrice = 129;
            bookingData.familyTier = 'small';
        }
    }
    bookingData.paxKids = 0;
    refreshPaxUI();

    // Reset Add-ons UI
    if(document.getElementById('bk-mua-check')) document.getElementById('bk-mua-check').checked = false;
    if(document.getElementById('mua-selection-container')) document.getElementById('mua-selection-container').classList.add('hidden');
    
    // RESET DROPDOWN MUA KE PLACEHOLDER
    const muaSelect = document.getElementById('bk-mua-select');
    if(muaSelect) muaSelect.selectedIndex = 0; 
    
    document.getElementById('bk-frame-select').value = "None";
    document.getElementById('bk-extra-time').checked = false;

    // 2. SET LABEL KATEGORI (STEP 1)
    const pkgInput = document.getElementById('bk-package');
    if(pkgInput) {
        pkgInput.value = `${bookingData.packageId} - RM${bookingData.packagePrice}`;
    }

    // 3. SET THEME DROPDOWN
    const themeSelect = document.getElementById('bk-theme');
    if (themeSelect) {
        themeSelect.innerHTML = "";
        for (const [key, val] of Object.entries(rayaThemesDetail)) {
            if (val.type !== type) continue; 
            let opt = document.createElement('option');
            opt.value = val.title; opt.innerText = val.title;
            themeSelect.appendChild(opt);
        }
        themeSelect.value = preSelectedTheme;
    }
    
    // Reset Tarikh & Masa UI
    resetDateUI();
    calculateTotal();
    setPaymentType('full');
    showStep(1);
}

function toggleMuaSelection() {
    const isChecked = document.getElementById('bk-mua-check').checked;
    const container = document.getElementById('mua-selection-container');
    
    if (isChecked) {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
        document.getElementById('bk-mua-select').selectedIndex = 0; // Reset dropdown
    }
    
    // Refresh pengiraan & rincian summary card
    calculateTotal(); 
}

function resetDateUI() {
    const dateInput = document.getElementById('bk-date');
    if(dateInput) {
        dateInput.value = "";
        dateInput.setAttribute('min', SEASON_START);
        dateInput.setAttribute('max', SEASON_END);
    }
    document.getElementById('time-slots-container').innerHTML = `<div class="col-span-4 text-center py-4 bg-gray-50 text-gray-400 text-sm italic">Sila pilih tarikh untuk semak slot.</div>`;
    document.getElementById('btn-step-2').disabled = true;
}

function checkThemeType() {
    const select = document.getElementById('bk-theme');
    bookingData.theme = select.value;
    
    // Reset Tarikh bila tema berubah dlm wizard (Ikut kemahuan bos)
    resetDateUI();
    
    const catLabel = document.getElementById('bk-cat-label');
    if (bookingData.themeType === 'couple') {
        catLabel.innerText = "KATEGORI COUPLE (MAX 4 PAX)";
        catLabel.className = "text-[10px] font-bold mt-1 tracking-widest uppercase text-pink-500";
    } else {
        catLabel.innerText = "KATEGORI FAMILY (1-8 ATAU 9-15 PAX)";
        catLabel.className = "text-[10px] font-bold mt-1 tracking-widest uppercase text-green-600";
    }
}

// --- LOGIC PAX TIER SWITCH ---

function updatePax(type, change) {
    let currA = bookingData.paxAdult;
    let currK = bookingData.paxKids;

    if (type === 'adult') currA += change; else currK += change;
    if (currA < 1 || currK < 0) return;

    if (bookingData.themeType === 'family') {
        // Switch ke 9-15 Pax
        if (bookingData.familyTier === 'small' && currA > 8) {
            if (confirm("Peserta Dewasa melebihi 8 orang. Tukar ke Pakej 9-15 Pax (RM199)?")) {
                bookingData.familyTier = 'large';
                bookingData.packageId = "KATEGORI FAMILY (9-15 PAX)";
                bookingData.packagePrice = 199;
                document.getElementById('bk-package').value = `${bookingData.packageId} - RM${bookingData.packagePrice}`;
            } else return;
        }
        // Switch balik ke 1-8 Pax
        else if (bookingData.familyTier === 'large' && currA <= 8) {
            if (confirm("Peserta Dewasa 8 orang atau kurang. Kembali ke Pakej 1-8 Pax (RM129)?")) {
                bookingData.familyTier = 'small';
                bookingData.packageId = "KATEGORI FAMILY (1-8 PAX)";
                bookingData.packagePrice = 129;
                document.getElementById('bk-package').value = `${bookingData.packageId} - RM${bookingData.packagePrice}`;
            } else { /* Stay dlm large tier */ }
        }
        if ((currA + currK) > 20) { alert("Max 20 Pax."); return; }
    } else {
        if ((currA + currK) > 4) { alert("Max 4 Pax."); return; }
    }

    bookingData.paxAdult = currA; bookingData.paxKids = currK;
    refreshPaxUI();
}

function calculateTotal() {
    let price = bookingData.packagePrice;
    let extras = [];

    // 1. Extra Pax logic (Family Large)
    if (bookingData.themeType === 'family' && bookingData.familyTier === 'large' && bookingData.paxAdult > 15) {
        let extra = bookingData.paxAdult - 15;
        price += (extra * 10);
        extras.push(`Extra Adults x${extra} (+RM${extra * 10})`);
    }

    // 2. Extra Time Logic (Checkbox)
    if (document.getElementById('bk-extra-time').checked) {
        price += 20;
        extras.push("Tambahan Masa 10m");
    }

    // 3. MUA Logic (Checkbox + Dropdown)
    const muaCheck = document.getElementById('bk-mua-check').checked;
    const muaSelect = document.getElementById('bk-mua-select').value;
    if (muaCheck && muaSelect !== "" && muaSelect !== "None") {
        price += 150;
        // Kita ambil nama MUA sahaja (buang IG handle) supaya pendek dlm card
        const shortName = muaSelect.split(" (")[0]; 
        extras.push(shortName);
    }

    // 4. Frame Logic (Dropdown)
    const frameVal = document.getElementById('bk-frame-select').value;
    if (frameVal !== "None" && frameVal !== "") {
        const framePrice = parseInt(frameVal.match(/\d+/g).pop());
        price += framePrice;
        // Ambil nama frame sahaja
        const shortFrame = frameVal.split(" (+RM")[0];
        extras.push(shortFrame);
    }

    // --- SIMPAN DATA ---
    bookingData.total = price;
    bookingData.addOns = extras.length > 0 ? extras.join(", ") : "Tiada";

    // --- LIVE UI REFRESH (SINI MAGIC DIA) ---
    
    // Update Harga
    setText('bk-total-step3', price);
    setText('bk-total-final', price);
    setText('lbl-full-amt', price);

    // Update Kotak Add-ons dlm Summary Card secara Live
    const addonRow = document.getElementById('row-addons');
    const addonText = document.getElementById('rev-addons');
    
    if (addonRow && addonText) {
        if (bookingData.addOns !== "Tiada") {
            addonText.innerText = bookingData.addOns;
            addonRow.classList.remove('hidden'); // Terus muncul!
        } else {
            addonRow.classList.add('hidden'); // Terus hilang!
        }
    }
}

// --- SLOT CHECKING (Restore dari fail asal bos) ---

function checkAvailability() {
    const dateInput = document.getElementById('bk-date');
    if (!dateInput.value) return;

    // Check Range
    const userDate = new Date(dateInput.value);
    const startLimit = new Date(SEASON_START);
    const endLimit = new Date(SEASON_END);
    userDate.setHours(0,0,0,0); startLimit.setHours(0,0,0,0); endLimit.setHours(0,0,0,0);

    if (userDate < startLimit || userDate > endLimit) {
        alert("Studio hanya beroperasi 5 Mac - 3 April 2026.");
        dateInput.value = ""; return;
    }

    bookingData.date = dateInput.value;
    calculateTotal();

    const loader = document.getElementById('time-loader'), container = document.getElementById('time-slots-container');
    loader.classList.remove('hidden'); container.innerHTML = "";

    fetch(`${GOOGLE_SCRIPT_URL}?action=check_slots&date=${dateInput.value}&theme=${encodeURIComponent(bookingData.theme)}`)
    .then(r => r.json()).then(d => {
        loader.classList.add('hidden');
        renderTimeSlots(d.bookedSlotIds || []);
    });
}

function renderTimeSlots(fullSlots) {
    const container = document.getElementById('time-slots-container');
    container.innerHTML = '';
    TIME_SLOTS.forEach(time => {
        const isFull = fullSlots.includes(time) || fullSlots.includes(`${bookingData.theme}_${time}`);
        const isExpired = isSlotExpired(time, bookingData.date);
        const btn = document.createElement('button');
        btn.type = 'button'; btn.innerText = time;

        if (isFull || isExpired) {
            btn.className = "bg-red-50 text-red-300 border border-red-100 cursor-not-allowed py-2 rounded text-xs line-through";
            btn.disabled = true;
        } else {
            btn.className = "bg-white border border-gray-200 py-2 rounded text-xs hover:border-amber-500 transition";
            btn.onclick = () => {
                Array.from(container.children).forEach(b => {
                    if(!b.disabled) b.className = "bg-white border border-gray-200 py-2 rounded text-xs hover:border-amber-500 transition";
                });
                // Warna GOLD untuk selected (Pilihan bos)
                btn.className = "bg-amber-500 text-white border-amber-600 py-2 rounded text-xs font-black shadow-lg transform scale-105";
                bookingData.time = time; 
                document.getElementById('bk-time').value = time;
                document.getElementById('btn-step-2').disabled = false;
            };
        }
        container.appendChild(btn);
    });
}

// --- THE REST (Navigation & Submit) ---

function isSlotExpired(slotTime, date) {
    const now = new Date(), [h, m] = slotTime.split(':'), slot = new Date(date);
    slot.setHours(h, m, 0, 0);
    return slot < new Date(now.getTime() + 3600000);
}

function selectTierAndBook(tier) {
    selectedTierTemp = tier;
    closeThemeModal();
    const tnc = document.getElementById('tnc-modal');
    if(tnc) { tnc.classList.remove('hidden'); renderTncAndFaq(); }
}

function agreeAndProceed() {
    document.getElementById('tnc-modal').classList.add('hidden');
    const theme = rayaThemesDetail[currentThemeKey];
    openBookingWizard(theme.categoryName, theme.price, theme.paxCover, theme.type, theme.title);
}

function closeWizard() {
    document.getElementById('booking-wizard').classList.add('hidden');
    if(currentThemeKey) openThemeDetails(currentThemeKey);
}

// --- FUNGSI PILIHAN BAYARAN (FIXED) ---
function setPaymentType(type) {
    // 1. Simpan pilihan dalam data booking
    // Kita gunakan format 'Deposit' dan 'Full Payment' supaya ngam dengan Sheets
    bookingData.paymentType = (type === 'deposit') ? "Deposit" : "Full Payment";
    
    // 2. Ambil elemen butang
    const btnDeposit = document.getElementById('pay-opt-deposit');
    const btnFull = document.getElementById('pay-opt-full');

    // 3. Logik Visual (Tukar warna bila diklik)
    if (type === 'deposit') {
        // Style Deposit Active
        btnDeposit.className = "p-4 border-2 rounded-2xl text-center border-amber-600 bg-amber-50 shadow-inner ring-2 ring-amber-600/20 scale-[1.02] transition-all duration-200";
        // Style Full Inactive
        btnFull.className = "p-4 border-2 rounded-2xl text-center border-gray-100 opacity-50 scale-100 transition-all duration-200 grayscale";
    } else {
        // Style Full Active
        btnFull.className = "p-4 border-2 rounded-2xl text-center border-green-600 bg-green-50 shadow-inner ring-2 ring-green-600/20 scale-[1.02] transition-all duration-200";
        // Style Deposit Inactive
        btnDeposit.className = "p-4 border-2 rounded-2xl text-center border-gray-100 opacity-50 scale-100 transition-all duration-200 grayscale";
    }
    
    console.log("Payment Type Selected:", bookingData.paymentType);
}

function submitBooking() {
    // --- VALIDATION MUA (NEW) ---
    const muaCheck = document.getElementById('bk-mua-check').checked;
    const muaSelect = document.getElementById('bk-mua-select').value;
    const muaError = document.getElementById('mua-error');

    if (muaCheck && (muaSelect === "" || muaSelect === "None")) {
        if(muaError) muaError.classList.remove('hidden');
        alert("Sila pilih Makeup Artist (MUA) pilihan anda sebelum meneruskan.");
        document.getElementById('bk-mua-select').focus();
        return; // Berhenti di sini
    }
    if(muaError) muaError.classList.add('hidden');

    const btn = document.getElementById('btn-confirm-wa');
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Memproses...`;
    btn.disabled = true;

    const payload = {
        orderID: "RAYA-" + Math.floor(10000 + Math.random() * 90000),
        name: bookingData.name, phone: bookingData.phone, email: bookingData.email || "-",
        package: bookingData.packageId, theme: bookingData.theme,
        date: bookingData.date, time: bookingData.time,
        pax: `${bookingData.paxAdult} Dewasa, ${bookingData.paxKids} Kanak-kanak`,
        addOns: bookingData.addOns, totalPrice: bookingData.total,
        paymentType: bookingData.paymentType, status: "Pending"
    };

    fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    .then(() => {
        let msgPay = bookingData.paymentType === 'Deposit' ? "💳 *JENIS BAYARAN: DEPOSIT (RM50)*\nSila berikan info bank/QR." : `💳 *JENIS BAYARAN: PENUH (RM${bookingData.total})*\nSaya ingin bayar penuh.`;
        const waMsg = `Hi MKAJ Studio! 👋\nSaya nak confirmkan Booking Raya 2026.\n\n🆔 *${payload.orderID}*\n👤 ${bookingData.name}\n🕌 ${bookingData.theme}\n📅 ${formatDateUI(bookingData.date)} @ ${bookingData.time}\n👥 *Pax:* ${payload.pax}\n➕ *Extra:* ${bookingData.addOns}\n💰 *Total:* RM${bookingData.total}\n\n${msgPay} Terima kasih!`;
        localStorage.setItem('lastWaMsg', waMsg);
        window.location.href = "/success"; 
    }).catch(e => {
        console.error("Error:", e);
        // Fallback kalau internet sangkut, hantar terus ke WA
        window.location.href = `https://wa.me/60147299454`; 
    });
}

function nextStep(step) {
    if (step === 2) {
        const n = getValue('bk-name'), p = getValue('bk-phone');
        if (!n || !p) { alert("Isi Nama & No Telefon."); return; }
        bookingData.name = n;
        bookingData.phone = "60" + p.replace(/\D/g, '').replace(/^60|^0/, '');
    }
    if (step === 3 && (!bookingData.date || !bookingData.time)) { alert("Pilih masa."); return; }
    if (step === 4) {
        // 1. Jalankan kira-kira akhir
        calculateTotal();

        // 2. Paparkan Maklumat Dasar
        setText('rev-name', bookingData.name);
        setText('rev-datetime', `${formatDateUI(bookingData.date)} @ ${bookingData.time}`);
        setText('rev-theme', bookingData.theme);
        setText('rev-pax', `${bookingData.paxAdult} Dewasa, ${bookingData.paxKids} Kanak-kanak`);

        // 3. LOGIC NAMA PAKEJ UNTUK SUMMARY (Friendly Name)
        let displayPackageName = "";
        if (bookingData.themeType === 'couple') {
            displayPackageName = "Couple / Mini";
        } else {
            displayPackageName = (bookingData.familyTier === 'large') ? "Family (9-15 Pax)" : "Family (1-8 Pax)";
        }
        setText('rev-package', displayPackageName);

        // 4. LOGIC PAPARAN ADD-ONS (Fix untuk baris yang hilang)
        const addonRow = document.getElementById('row-addons');
        const revAddons = document.getElementById('rev-addons');
        
        if (bookingData.addOns && bookingData.addOns !== "Tiada") {
            setText('rev-addons', bookingData.addOns);
            addonRow.classList.remove('hidden'); // Tunjukkan kotak kuning kalau ada add-on
        } else {
            addonRow.classList.add('hidden'); // Sorok kalau tak ada
        }

        const currentType = (bookingData.paymentType === "Full Payment") ? 'full' : 'deposit';
        setPaymentType(currentType);
    }
    currentStep = step; showStep(step);
}

function showStep(step) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`step-${step}`).classList.remove('hidden');
    for(let i=1; i<=4; i++) document.getElementById(`step-dot-${i}`).className = i <= step ? "w-2 h-2 rounded-full bg-amber-600" : "w-2 h-2 rounded-full bg-gray-300";
}

function refreshPaxUI() { setText('bk-pax-adult', bookingData.paxAdult); setText('bk-pax-kid', bookingData.paxKids); calculateTotal(); }
function setText(id, val) { const el = document.getElementById(id); if(el) el.innerText = val; }
function getValue(id) { const el = document.getElementById(id); return el ? el.value : ""; }
function formatDateUI(s) { if(!s) return ""; const d = new Date(s); return d.toLocaleDateString('ms-MY', {day:'numeric', month:'short'}); }

window.onload = () => { renderTncAndFaq(); };