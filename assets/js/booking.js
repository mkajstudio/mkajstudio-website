/* 
   assets/js/booking.js 
   MKAJ STUDIO V19.0 - FINAL STABLE RECOVERY
*/

// --- 1. CONFIGURATION ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwdGTp-FCzsQeZ4Kwgl-AOMA45XS-0bBu9TGiPAyUhb_LCTl-ObaHS-QEkCKKNoYv0g/exec"; 
const TIME_SLOTS = ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
const SEASON_START = "2026-03-05", SEASON_END = "2026-04-03";

// --- 2. GLOBAL STATE ---
let currentStep = 1;
let selectedTierTemp = ""; 

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
    frame: "Tiada",
    total: 0,
    paymentType: "Full Payment"
};

// --- 3. WIZARD FLOW LOGIC ---

// Fungsi pemicu dari Modal Gambar
function selectTierAndBook(tier) {
    const theme = rayaThemesDetail[currentThemeKey];
    if(!theme) { alert("Sila pilih tema semula."); return; }

    selectedTierTemp = tier; 
    closeThemeModal();
    
    const tncModal = document.getElementById('tnc-modal');
    if(tncModal) {
        tncModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        if (typeof renderTncAndFaq === "function") renderTncAndFaq();
    }
}

// Fungsi dari butang "Setuju" T&C
function agreeAndProceed() {
    document.getElementById('tnc-modal').classList.add('hidden');
    const theme = rayaThemesDetail[currentThemeKey];
    openBookingWizard(theme.categoryName, theme.price, theme.paxCover, theme.type, theme.title);
}

// Fungsi buka Wizard
function openBookingWizard(categoryName, price, basePaxLimit, type, preSelectedTheme) {
    const wizard = document.getElementById('booking-wizard');
    if(wizard) wizard.classList.remove('hidden');

    bookingData.themeType = type || 'family';
    bookingData.theme = preSelectedTheme || "";
    
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

    const pkgInput = document.getElementById('bk-package');
    if(pkgInput) pkgInput.value = `${bookingData.packageId} - RM${bookingData.packagePrice}`;

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
    
    resetDateUI();
    refreshPaxUI();
    setPaymentType('full'); 
    showStep(1);
}

function closeWizard() {
    document.getElementById('booking-wizard').classList.add('hidden');
    // U-Turn balik ke modal gambar
    if(typeof currentThemeKey !== 'undefined' && currentThemeKey !== "") {
        openThemeDetails(currentThemeKey);
    } else {
        document.body.style.overflow = 'auto';
    }
}

// --- 4. THEME & DATE LOGIC ---

function checkThemeType() {
    const select = document.getElementById('bk-theme');
    if(!select) return;
    bookingData.theme = select.value;
    
    // Reset Tarikh bila tema berubah dlm wizard
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

function resetDateUI() {
    const dateInput = document.getElementById('bk-date');
    const errMsg = document.getElementById('date-error-msg');
    
    if(dateInput) {
        dateInput.value = "";
        // Paksa mobile browser sekat tarikh luar musim secara visual
        dateInput.setAttribute('min', SEASON_START);
        dateInput.setAttribute('max', SEASON_END);
    }
    
    if(errMsg) errMsg.classList.add('hidden');
    
    const container = document.getElementById('time-slots-container');
    if(container) container.innerHTML = `<div class="col-span-4 text-center py-4 bg-gray-50 text-gray-400 text-sm italic">Sila pilih tarikh.</div>`;
    
    const btnNext = document.getElementById('btn-step-2');
    if(btnNext) btnNext.disabled = true;
}

// --- 5. PAX & PRICING ENGINE ---

function updatePax(type, change) {
    let currA = bookingData.paxAdult;
    let currK = bookingData.paxKids;

    if (type === 'adult') currA += change; else currK += change;
    if (currA < 1 || currK < 0) return;

    const totalHead = currA + currK;

    if (bookingData.themeType === 'family') {
        // UPGRADE
        if (bookingData.familyTier === 'small' && (currA > 8 || totalHead > 15)) {
            let sebab = currA > 8 ? "Dewasa melebihi 8 orang" : "Total peserta melebihi 15 orang";
            if (confirm(`${sebab}. Tukar ke Pakej 9-15 Pax (RM199)?`)) {
                bookingData.familyTier = 'large';
                bookingData.packageId = "KATEGORI FAMILY (9-15 PAX)";
                bookingData.packagePrice = 199;
                document.getElementById('bk-package').value = `${bookingData.packageId} - RM${bookingData.packagePrice}`;
            } else return;
        }
        // DOWNGRADE
        else if (bookingData.familyTier === 'large' && (currA <= 8 && totalHead <= 15)) {
            if (confirm("Bilangan mencukupi untuk pakej ekonomi. Kembali ke Pakej 1-8 Pax (RM129)?")) {
                bookingData.familyTier = 'small';
                bookingData.packageId = "KATEGORI FAMILY (1-8 PAX)";
                bookingData.packagePrice = 129;
                document.getElementById('bk-package').value = `${bookingData.packageId} - RM${bookingData.packagePrice}`;
            }
        }
        if (totalHead > 20) { alert("Max 20 Pax."); return; }
    } else {
        if (totalHead > 4) { alert("Max 4 Pax."); return; }
    }

    bookingData.paxAdult = currA; bookingData.paxKids = currK;
    refreshPaxUI();
}

function calculateTotal() {
    let price = bookingData.packagePrice;
    let addonsList = [];

    // Extra head for Large Tier
    if (bookingData.themeType === 'family' && bookingData.familyTier === 'large' && bookingData.paxAdult > 15) {
        let extra = bookingData.paxAdult - 15;
        price += (extra * 10);
        addonsList.push(`Extra Adults x${extra} (+RM${extra * 10})`);
    }

    // Time
    if (document.getElementById('bk-extra-time').checked) {
        price += 20; addonsList.push("Extra Time");
    }

    // MUA Check & Select
    const muaCheck = document.getElementById('bk-mua-check').checked;
    const muaSelect = document.getElementById('bk-mua-select').value;
    if (muaCheck && muaSelect && muaSelect !== "") {
        price += 150; addonsList.push(muaSelect.split(" (")[0]);
    }

    // Frame
    const frameVal = document.getElementById('bk-frame-select').value;
    if (frameVal !== "None" && frameVal !== "") {
        const framePrice = parseInt(frameVal.match(/\d+/g).pop());
        price += framePrice;
        bookingData.frame = frameVal.split(" (+RM")[0];
    } else {
        bookingData.frame = "Tiada";
    }

    bookingData.total = price;
    bookingData.addOns = addonsList.length > 0 ? addonsList.join(", ") : "Tiada";

    // UI Refresh
    setText('bk-total-step3', price);
    setText('bk-total-final', price);
    setText('lbl-full-amt', price);
    setText('rev-frame', bookingData.frame);
    
    const rowAdd = document.getElementById('row-addons');
    if(rowAdd) {
        if(bookingData.addOns !== "Tiada") {
            setText('rev-addons', bookingData.addOns);
            rowAdd.classList.remove('hidden');
        } else { rowAdd.classList.add('hidden'); }
    }
}

// --- 6. DATABASE & WHATSAPP ACTIONS ---

function checkAvailability() {
    const dateInput = document.getElementById('bk-date');
    const dateVal = dateInput.value;
    const errMsg = document.getElementById('date-error-msg');
    const container = document.getElementById('time-slots-container');
    const btnNext = document.getElementById('btn-step-2');

    if (!dateVal) return;

    // --- VALIDATION TANPA ALERT (MESRA HP) ---
    const userDate = new Date(dateVal);
    const startLimit = new Date(SEASON_START);
    const endLimit = new Date(SEASON_END);
    userDate.setHours(0,0,0,0); startLimit.setHours(0,0,0,0); endLimit.setHours(0,0,0,0);

    if (userDate < startLimit || userDate > endLimit) {
        // Tunjuk mesej merah, jangan guna alert!
        errMsg.innerText = "❌ Studio hanya dibuka 5 Mac - 3 April 2026.";
        errMsg.classList.remove('hidden');
        container.innerHTML = `<div class="col-span-4 text-center py-8 bg-red-50 text-red-400 rounded-2xl text-xs font-bold uppercase tracking-widest">Tarikh Luar Musim</div>`;
        if(btnNext) btnNext.disabled = true;
        return;
    }

    if (BLOCKED_DATES.includes(dateVal)) {
        errMsg.innerText = "❌ Maaf, Studio TUTUP pada tarikh ini.";
        errMsg.classList.remove('hidden');
        container.innerHTML = `<div class="col-span-4 text-center py-8 bg-red-50 text-red-400 rounded-2xl text-xs font-bold uppercase tracking-widest">Studio Cuti</div>`;
        if(btnNext) btnNext.disabled = true;
        return;
    }

    // JIKA TARIKH SAH (HIJAU)
    errMsg.classList.add('hidden'); // Sorok mesej error
    bookingData.date = dateVal;
    
    const loader = document.getElementById('time-loader');
    loader.classList.remove('hidden'); 
    container.innerHTML = "";
    
    fetch(`${GOOGLE_SCRIPT_URL}?action=check_slots&date=${dateVal}&theme=${encodeURIComponent(bookingData.theme)}`)
    .then(r => r.json()).then(d => {
        loader.classList.add('hidden');
        renderTimeSlots(d.bookedSlotIds || []);
    }).catch(e => {
        loader.classList.add('hidden');
        container.innerHTML = `<div class="col-span-4 text-center py-4 text-red-500 text-xs">Ralat rangkaian. Sila cuba lagi.</div>`;
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
            btn.className = "bg-white border border-gray-200 py-2 rounded text-xs hover:border-amber-600 transition";
            btn.onclick = () => {
                Array.from(container.children).forEach(b => { if(!b.disabled) b.className = "bg-white border border-gray-200 py-2 rounded text-xs hover:border-amber-600 transition"; });
                btn.className = "bg-amber-500 text-white border-amber-600 py-2 rounded text-xs font-black shadow-lg transform scale-105";
                bookingData.time = time; document.getElementById('bk-time').value = time;
                document.getElementById('btn-step-2').disabled = false;
            };
        }
        container.appendChild(btn);
    });
}

function submitBooking() {
    if (document.getElementById('bk-mua-check').checked && !document.getElementById('bk-mua-select').value) {
        alert("Sila pilih MUA anda."); return;
    }

    const btn = document.getElementById('btn-confirm-wa');
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Memproses...`;
    btn.disabled = true;

    const uniqueID = "RAYA-" + Math.floor(10000 + Math.random() * 90000);
    const payload = {
        orderID: uniqueID, name: bookingData.name, phone: bookingData.phone,
        email: bookingData.email || "-", package: bookingData.packageId,
        theme: bookingData.theme, date: bookingData.date, time: bookingData.time,
        pax: `${bookingData.paxAdult} Dewasa, ${bookingData.paxKids} Kanak-kanak`,
        addOns: bookingData.addOns, totalPrice: bookingData.total,
        frame: bookingData.frame, paymentType: bookingData.paymentType, status: "Pending"
    };

    fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    .then(() => {
        let msgPay = bookingData.paymentType === 'Deposit' ? "💳 *JENIS BAYARAN: DEPOSIT (RM50)*" : `💳 *JENIS BAYARAN: PENUH (RM${bookingData.total})`;
        const waMsg = `Hi MKAJ Studio! 👋\nSaya nak confirmkan Booking Raya 2026.\n\n🆔 *${uniqueID}*\n👤 ${bookingData.name}\n🕌 ${bookingData.theme}\n📅 ${formatDateUI(bookingData.date)} @ ${bookingData.time}\n👥 *Pax:* ${payload.pax}\n🖼️ *Frame:* ${bookingData.frame}\n➕ *Add-ons:* ${bookingData.addOns}\n💰 *Total:* RM${bookingData.total}\n\n${msgPay} Terima kasih!`;
        localStorage.setItem('lastWaMsg', waMsg);
        window.location.href = "/success"; 
    });
}

// --- 7. HELPERS ---
function toggleMuaSelection() {
    const isChecked = document.getElementById('bk-mua-check').checked;
    document.getElementById('mua-selection-container').classList.toggle('hidden', !isChecked);
    calculateTotal();
}
function nextStep(step) {
    if (step === 2) {
        const n = getValue('bk-name'), p = getValue('bk-phone');
        if (!n || !p) { alert("Isi Nama & No Telefon."); return; }
        bookingData.name = n; bookingData.phone = "60" + p.replace(/\D/g, '').replace(/^60|^0/, '');
    }
    if (step === 3 && (!bookingData.date || !bookingData.time)) { alert("Pilih masa."); return; }
    if (step === 4) {
        calculateTotal();
        setText('rev-name', bookingData.name);
        setText('rev-datetime', `${formatDateUI(bookingData.date)} @ ${bookingData.time}`);
        setText('rev-theme', bookingData.theme);
        setText('rev-pax', `${bookingData.paxAdult} Dewasa, ${bookingData.paxKids} Kanak-kanak`);
        setText('rev-frame', bookingData.frame);
        let dp = (bookingData.themeType === 'couple') ? "Couple / Mini" : ((bookingData.familyTier === 'large') ? "Family (9-15 Pax)" : "Family (1-8 Pax)");
        setText('rev-package', dp);
        setPaymentType(bookingData.paymentType === "Full Payment" ? 'full' : 'deposit');
    }
    currentStep = step; showStep(step);
}
function showStep(step) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`step-${step}`).classList.remove('hidden');
    for(let i=1; i<=4; i++) document.getElementById(`step-dot-${i}`).className = i <= step ? "w-2 h-2 rounded-full bg-amber-600" : "w-2 h-2 rounded-full bg-gray-300";
}
function setPaymentType(t) {
    bookingData.paymentType = (t === 'full') ? "Full Payment" : "Deposit";
    document.getElementById('pay-opt-deposit').className = (t === 'deposit') ? "p-4 border-2 rounded-2xl text-center border-amber-600 bg-amber-50 shadow-inner ring-2 ring-amber-600/20 scale-[1.02] font-bold" : "p-4 border-2 rounded-2xl text-center border-gray-100 opacity-50 grayscale";
    document.getElementById('pay-opt-full').className = (t === 'full') ? "p-4 border-2 rounded-2xl text-center border-green-600 bg-green-50 shadow-inner ring-2 ring-green-600/20 scale-[1.02] font-bold" : "p-4 border-2 rounded-2xl text-center border-gray-100 opacity-50 grayscale";
}
function refreshPaxUI() { setText('bk-pax-adult', bookingData.paxAdult); setText('bk-pax-kid', bookingData.paxKids); calculateTotal(); }
function isSlotExpired(slotTime, date) { const now = new Date(), [h, m] = slotTime.split(':'), slot = new Date(date); slot.setHours(h, m, 0, 0); return slot < new Date(now.getTime() + 3600000); }
function setText(id, val) { const el = document.getElementById(id); if(el) el.innerText = val; }
function getValue(id) { const el = document.getElementById(id); return el ? el.value : ""; }
function formatDateUI(s) { if(!s) return ""; const d = new Date(s); return d.toLocaleDateString('ms-MY', {day:'numeric', month:'short'}); }

window.onload = () => { if (typeof renderTncAndFaq === "function") renderTncAndFaq(); };