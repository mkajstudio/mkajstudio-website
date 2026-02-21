/* 
   assets/js/booking.js 
   MKAJ STUDIO V84.0 - ULTRA CLEAN DATA
   - MUA: Removes (@handle) completely.
   - Frame: Removes " (quotes) and () (parentheses).
*/

// --- 1. CONFIGURATION ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwdGTp-FCzsQeZ4Kwgl-AOMA45XS-0bBu9TGiPAyUhb_LCTl-ObaHS-QEkCKKNoYv0g/exec"; 
const TIME_SLOTS = ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
const SEASON_START = "2026-03-05", SEASON_END = "2026-04-03";

// --- 2. GLOBAL STATE ---
let currentStep = 1;

let bookingData = {
    packageId: "",
    packagePrice: 0,
    basePaxLimit: 6, 
    paxAdult: 1, 
    paxKids: 0,
    theme: "",
    themeType: "family",
    date: "",
    time: "",
    addOns: "",
    frame: "Tiada",
    total: 0,
    paymentType: "Full Payment",
    name: "", phone: "", email: ""
};

// --- 3. INIT & POPULATE ---
function initBookingUI() {
    const muaSel = document.getElementById('bk-mua-select');
    if (muaSel && typeof muaOptions !== 'undefined') {
        muaSel.innerHTML = '<option value="" disabled selected>-- Sila pilih MUA --</option>';
        muaOptions.forEach(m => {
            if(m.name !== "Tiada") { 
                let opt = document.createElement('option');
                opt.value = m.name; 
                opt.innerText = `${m.name} (+RM${m.price})`;
                muaSel.appendChild(opt);
            }
        });
    }

    const frameSel = document.getElementById('bk-frame-select');
    if (frameSel && typeof frameAddons !== 'undefined') {
        frameSel.innerHTML = '';
        frameAddons.forEach(f => {
            let opt = document.createElement('option');
            opt.value = `${f.name} (+RM${f.price})`; 
            opt.innerText = `${f.name} (+RM${f.price})`;
            frameSel.appendChild(opt);
        });
    }
}

// --- 4. WIZARD FLOW ---
function agreeAndProceed() {
    const tnc = document.getElementById('tnc-modal');
    if(tnc) tnc.classList.add('hidden');
    
    if(typeof currentThemeKey === 'undefined' || !rayaThemesDetail[currentThemeKey]) return;

    const theme = rayaThemesDetail[currentThemeKey];
    const isCouple = theme.type === 'couple';
    const price = isCouple ? 89 : 129;
    const limit = isCouple ? 4 : 6;
    
    openBookingWizard(theme.categoryName, price, limit, theme.type, theme.title);
}

function openBookingWizard(categoryName, price, basePaxLimit, type, preSelectedTheme) {
    const wizard = document.getElementById('booking-wizard');
    if(wizard) wizard.classList.remove('hidden');

    const initialPax = (type === 'couple') ? 2 : 4; 
    const elName = document.getElementById('bk-name');
    const elEmail = document.getElementById('bk-email');

    bookingData = {
        packageId: categoryName, 
        packagePrice: price, 
        basePaxLimit: basePaxLimit,
        paxAdult: initialPax, 
        paxKids: 0,
        theme: preSelectedTheme || "", 
        themeType: type || 'family', 
        date: "", time: "", addOns: "", frame: "Tiada", total: 0, paymentType: "Full Payment",
        name: elName ? elName.value : "", 
        phone: bookingData.phone || "",
        email: elEmail ? elEmail.value : ""
    };

    const elExtra = document.getElementById('bk-extra-time');
    if(elExtra) elExtra.checked = false;
    
    const elMuaCheck = document.getElementById('bk-mua-check');
    const elMuaCont = document.getElementById('mua-selection-container');
    if(elMuaCheck) elMuaCheck.checked = false;
    if(elMuaCont) elMuaCont.classList.add('hidden');
    
    const elMuaSel = document.getElementById('bk-mua-select');
    if(elMuaSel) elMuaSel.value = "";
    
    const elFrameSel = document.getElementById('bk-frame-select');
    if(elFrameSel) elFrameSel.selectedIndex = 0;

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
    
    checkThemeType(); 
    resetDateUI();
    refreshPaxUI();
    setPaymentType('full'); 
    showStep(1);
}

function closeWizard() {
    const wizard = document.getElementById('booking-wizard');
    if(wizard) wizard.classList.add('hidden');
    if(typeof currentThemeKey !== 'undefined' && currentThemeKey !== "") {
        if(typeof openThemeDetails === 'function') openThemeDetails(currentThemeKey);
    } else {
        document.body.style.overflow = 'auto';
    }
}

// --- 5. THEME & DATE ---
function checkThemeType() {
    const select = document.getElementById('bk-theme');
    if(!select) return;
    bookingData.theme = select.value;
    resetDateUI();
    
    const catLabel = document.getElementById('bk-cat-label');
    if(catLabel) {
        if (bookingData.themeType === 'couple') {
            catLabel.innerText = "KATEGORI COUPLE (MAX 4 PAX)";
            catLabel.className = "text-[10px] font-bold mt-1 tracking-widest uppercase text-pink-500";
        } else {
            catLabel.innerText = "KATEGORI FAMILY (COVER 6 PAX)";
            catLabel.className = "text-[10px] font-bold mt-1 tracking-widest uppercase text-green-600";
        }
    }
}

function resetDateUI() {
    const dateInput = document.getElementById('bk-date');
    const errMsg = document.getElementById('date-error-msg');
    
    if(dateInput) {
        dateInput.value = "";
        dateInput.setAttribute('min', SEASON_START);
        dateInput.setAttribute('max', SEASON_END);
    }
    if(errMsg) errMsg.classList.add('hidden');
    
    const container = document.getElementById('time-slots-container');
    if(container) container.innerHTML = `<div class="col-span-4 text-center py-4 bg-gray-50 text-gray-400 text-sm italic">Sila pilih tarikh di atas dahulu.</div>`;
    
    const btnNext = document.getElementById('btn-step-2');
    if(btnNext) btnNext.disabled = true;
}

// --- 6. PAX & PRICING ---
function updatePax(type, change) {
    let currA = bookingData.paxAdult;
    let currK = bookingData.paxKids;

    if (type === 'adult') currA += change; else currK += change;
    
    if (currA < 1) currA = 1;
    if (currK < 0) currK = 0;
    const totalHead = currA + currK;

    if (bookingData.themeType === 'couple') {
        if (totalHead > 4) { alert("Pakej Couple maksimum 4 orang sahaja."); return; }
    } else {
        if (totalHead > 20) { alert("Maksimum kapasiti studio 20 orang."); return; }
    }

    bookingData.paxAdult = currA; 
    bookingData.paxKids = currK;
    refreshPaxUI();
}

function calculateTotal() {
    let price = bookingData.packagePrice; 
    let addonsListUI = [];

    // Family Extra Charge Logic
    if (bookingData.themeType === 'family') {
        const limit = bookingData.basePaxLimit; 
        if (bookingData.paxAdult > limit) {
            let extra = bookingData.paxAdult - limit;
            let charge = extra * 10;
            price += charge;
            addonsListUI.push(`Extra Dewasa x${extra} (+RM${charge})`);
        }
        
        const hint = document.getElementById('pax-price-hint');
        if(hint) hint.innerText = bookingData.paxAdult > limit ? `Extra (+RM10/pax)` : `Cover ${limit} Pax`;
    }

    // Addons
    const elTime = document.getElementById('bk-extra-time');
    if (elTime && elTime.checked) {
        price += 20; addonsListUI.push("Extra Time");
    }
    
    const elMuaCheck = document.getElementById('bk-mua-check');
    const elMuaSelect = document.getElementById('bk-mua-select');
    if (elMuaCheck && elMuaCheck.checked && elMuaSelect && elMuaSelect.value) {
        price += 150; 
        addonsListUI.push(elMuaSelect.value); 
    }

    // Frame
    const elFrame = document.getElementById('bk-frame-select');
    if (elFrame && elFrame.value && !elFrame.value.includes("Tiada")) {
        const match = elFrame.value.match(/\d+/g);
        if(match) {
            const framePrice = parseInt(match.pop());
            price += framePrice;
            bookingData.frame = elFrame.value.split(" (+")[0]; 
        }
    } else {
        bookingData.frame = "Tiada";
    }

    bookingData.total = price;
    bookingData.addOns = addonsListUI.length > 0 ? addonsListUI.join(", ") : "Tiada";

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

// --- 7. NAV & SUBMIT ---
function nextStep(step) {
    if (step > currentStep) {
        if (step === 2) {
            const n = getValue('bk-name'), p = getValue('bk-phone');
            if (!n || !p) { alert("Sila isi Nama & No Telefon."); return; }
            bookingData.name = n; 
            bookingData.phone = "60" + p.replace(/\D/g, '').replace(/^60|^0/, '');
        }
        if (step === 3 && (!bookingData.date || !bookingData.time)) { alert("Pilih masa."); return; }
    }

    // RESET LOGIC
    if (step === 3) {
        bookingData.paxAdult = (bookingData.themeType === 'couple') ? 2 : 4;
        bookingData.paxKids = 0;
        
        const elTime = document.getElementById('bk-extra-time');
        if(elTime) elTime.checked = false;

        const elMuaCheck = document.getElementById('bk-mua-check');
        const elMuaCont = document.getElementById('mua-selection-container');
        if(elMuaCheck) {
            elMuaCheck.checked = false;
            if(elMuaCont) elMuaCont.classList.add('hidden');
        }
        
        const elMuaSel = document.getElementById('bk-mua-select');
        if(elMuaSel) elMuaSel.value = "";
        
        const elFrame = document.getElementById('bk-frame-select');
        if(elFrame) elFrame.selectedIndex = 0;

        refreshPaxUI(); 
    }

    if (step === 4) {
        calculateTotal();
        setText('rev-name', bookingData.name);
        setText('rev-datetime', `${formatDateUI(bookingData.date)} @ ${bookingData.time}`);
        setText('rev-theme', bookingData.theme);
        setText('rev-pax', `${bookingData.paxAdult} Dewasa, ${bookingData.paxKids} Kanak-kanak`);
        setText('rev-frame', bookingData.frame);
        setText('rev-package', bookingData.themeType === 'couple' ? "KATEGORI COUPLE" : "KATEGORI FAMILY");
        setPaymentType('full');
    }
    currentStep = step; showStep(step);
}

// --- SUBMIT BOOKING (ULTRA CLEAN DATA) ---
function submitBooking() {
    const elMuaCheck = document.getElementById('bk-mua-check');
    const elMuaSelect = document.getElementById('bk-mua-select');

    if (elMuaCheck && elMuaCheck.checked && elMuaSelect && !elMuaSelect.value) {
        alert("Sila pilih MUA anda."); return;
    }
    const btn = document.getElementById('btn-confirm-wa');
    if(btn) { btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Memproses...`; btn.disabled = true; }

    const uniqueID = "RAYA-" + Math.floor(10000 + Math.random() * 90000);
    const cleanPackage = bookingData.themeType === 'couple' ? "KATEGORI COUPLE" : "KATEGORI FAMILY";
    
    let cleanAddons = [];
    const elTime = document.getElementById('bk-extra-time');
    if (elTime && elTime.checked) cleanAddons.push("Extra Time");
    
    if (elMuaCheck && elMuaCheck.checked) {
        let muaRaw = elMuaSelect.value;
        // FIX 1: Potong dekat " (" untuk buang username
        // "MUA Adam Shah (@adam...)" -> "MUA Adam Shah"
        let muaClean = muaRaw.split(' (')[0].trim();
        cleanAddons.push(muaClean);
    }
    const finalAddons = cleanAddons.length > 0 ? cleanAddons.join(', ') : "Tiada";

    let frameRaw = document.getElementById('bk-frame-select').value;
    let finalFrame = "Tiada";
    if (frameRaw && !frameRaw.includes("Tiada")) {
        // FIX 2: Buang harga (+RM..) DAN Buang Kurungan + Quote "
        // "Majestic Gallery (24"x30") (+RM220)"
        // -> split (+RM...) -> "Majestic Gallery (24"x30")"
        // -> replace -> "Majestic Gallery 24x30"
        finalFrame = frameRaw.split(' (+')[0].replace(/[()"]/g, '').trim();
    }

    const payload = {
        orderID: uniqueID, name: bookingData.name, phone: bookingData.phone,
        email: bookingData.email || "-", package: cleanPackage,
        theme: bookingData.theme, date: bookingData.date, time: bookingData.time,
        pax: `${bookingData.paxAdult} Dewasa, ${bookingData.paxKids} Kanak-kanak`,
        addOns: finalAddons, totalPrice: bookingData.total,
        frame: finalFrame, paymentType: bookingData.paymentType, status: "Pending"
    };

    fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    .then(() => {
        let msgPay = bookingData.paymentType === 'Deposit' ? "💳 *JENIS BAYARAN: DEPOSIT (RM50)*" : `💳 *JENIS BAYARAN: PENUH (RM${bookingData.total})`;
        const waMsg = `Hi MKAJ Studio! 👋\nSaya nak confirmkan Booking Raya 2026.\n\n🆔 *${uniqueID}*\n👤 ${bookingData.name}\n🕌 ${bookingData.theme}\n📅 ${formatDateUI(bookingData.date)} @ ${bookingData.time}\n👥 *Pax:* ${payload.pax}\n🖼️ *Frame:* ${finalFrame}\n➕ *Add-ons:* ${finalAddons}\n💰 *Total:* RM${bookingData.total}\n\n${msgPay} Terima kasih!`;
        localStorage.setItem('lastWaMsg', waMsg);
        window.location.href = "success.html"; 
    });
}

function toggleMuaSelection() {
    const isChecked = document.getElementById('bk-mua-check').checked;
    document.getElementById('mua-selection-container').classList.toggle('hidden', !isChecked);
    if(!isChecked) document.getElementById('bk-mua-select').value = "";
    calculateTotal();
}
function checkAvailability() {
    const el = document.getElementById('bk-date');
    if(!el || !el.value) return;
    const dateVal = el.value;

    const uD = new Date(dateVal); uD.setHours(0,0,0,0);
    const sS = new Date(SEASON_START); sS.setHours(0,0,0,0);
    const sE = new Date(SEASON_END); sE.setHours(0,0,0,0);
    
    if (uD < sS || uD > sE) {
        const err = document.getElementById('date-error-msg');
        if(err) { err.innerText = "Tarikh Luar Musim (5 Mac - 3 April Sahaja)"; err.classList.remove('hidden'); }
        document.getElementById('time-slots-container').innerHTML = "";
        return;
    } else {
        const err = document.getElementById('date-error-msg');
        if(err) err.classList.add('hidden');
    }
    bookingData.date = dateVal;
    calculateTotal(); 
    const loader = document.getElementById('time-loader');
    if(loader) loader.classList.remove('hidden');
    
    fetch(`${GOOGLE_SCRIPT_URL}?action=check_slots&date=${dateVal}&theme=${encodeURIComponent(bookingData.theme)}`)
    .then(res => res.json())
    .then(data => {
        if(loader) loader.classList.add('hidden');
        renderTimeSlots(data.bookedSlotIds || []);
    });
}
function renderTimeSlots(fullSlots) {
    const container = document.getElementById('time-slots-container');
    container.innerHTML = '';
    TIME_SLOTS.forEach(time => {
        const isFull = fullSlots.includes(time) || fullSlots.includes(`${bookingData.theme}_${time}`);
        const btn = document.createElement('button');
        btn.innerText = time;
        if (isFull) {
            btn.className = "bg-red-50 text-red-300 border border-red-100 cursor-not-allowed py-2 rounded-2xl text-xs line-through opacity-60";
            btn.disabled = true;
        } else {
            btn.className = "bg-white border border-gray-200 py-2 rounded-2xl text-xs font-bold hover:bg-amber-500 hover:text-white transition duration-200";
            btn.onclick = () => {
                Array.from(container.children).forEach(b => { if(!b.disabled) b.className = "bg-white border border-gray-200 py-2 rounded-2xl text-xs font-bold hover:bg-amber-500 hover:text-white transition duration-200"; });
                btn.className = "bg-amber-500 text-white border-amber-600 py-2 rounded-2xl text-xs font-black shadow-lg transform scale-105";
                bookingData.time = time;
                document.getElementById('bk-time').value = time;
                document.getElementById('btn-step-2').disabled = false;
            };
        }
        container.appendChild(btn);
    });
}
function showStep(step) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`step-${step}`);
    if(target) target.classList.remove('hidden');
    for(let i=1; i<=4; i++) {
        const dot = document.getElementById(`step-dot-${i}`);
        if(dot) dot.className = i <= step ? "w-2 h-2 rounded-full bg-amber-600" : "w-2 h-2 rounded-full bg-gray-300";
    }
}
function setPaymentType(t) {
    bookingData.paymentType = (t === 'full') ? "Full Payment" : "Deposit";
    const bDep = document.getElementById('pay-opt-deposit');
    const bFull = document.getElementById('pay-opt-full');
    if(bDep) bDep.className = (t === 'deposit') ? "p-4 border-2 rounded-2xl text-center border-amber-600 bg-amber-50 shadow-inner ring-2 ring-amber-600/20 scale-[1.02] font-bold" : "p-4 border-2 rounded-2xl text-center border-gray-100 opacity-50 grayscale";
    if(bFull) bFull.className = (t === 'full') ? "p-4 border-2 rounded-2xl text-center border-green-600 bg-green-50 shadow-inner ring-2 ring-green-600/20 scale-[1.02] font-bold" : "p-4 border-2 rounded-2xl text-center border-gray-100 opacity-50 grayscale";
}
function refreshPaxUI() { setText('bk-pax-adult', bookingData.paxAdult); setText('bk-pax-kid', bookingData.paxKids); calculateTotal(); }
function setText(id, val) { const el = document.getElementById(id); if(el) el.innerText = val; }
function getValue(id) { const el = document.getElementById(id); return el ? el.value : ""; }
function formatDateUI(s) { if(!s) return ""; const d = new Date(s); return d.toLocaleDateString('ms-MY', {day:'numeric', month:'short'}); }

window.onload = () => { 
    if (typeof renderTncAndFaq === "function") renderTncAndFaq();
    initBookingUI(); 
};