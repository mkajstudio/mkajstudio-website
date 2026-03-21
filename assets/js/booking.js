/* 
   assets/js/booking.js 
   MKAJ STUDIO V120.0 (MASTER FINAL BUILD)
   - Fixed: Bug flow wizard (currentStep resets properly when reopened).
   - Fixed: Ultra-clean data extraction for MUA & Frame (No IG handles, no prices, no quotes).
   - Fixed: Robust Happy Hour real-time checking & Coupon date validation.
   - Status: 100% Production Ready.
*/

// --- 1. CONFIGURATION ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzSV2iAVLynSPM8z2wC8vnjCh-BiI8LGRxHcIjWWhcBRsyrDu33-TmVrw87PX_RRouM/exec"; 
const TIME_SLOTS = ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
const SEASON_START = "2026-03-05", SEASON_END = "2026-03-30";

// --- 2. GLOBAL STATE ---
let currentStep = 1;
let currentPkgConfig = null;
let appliedPromoCode = null; 
let appliedDiscountAmount = 0;
let livePromoSettings = {}; 

let bookingData = {
    pkgKey: "", pkgName: "", themeTitle: "",
    paxAdult: 1, paxKids: 0,
    date: "", time: "", addOnsStr: "", frameStr: "Tiada", total: 0,
    paymentType: "Full Payment", name: "", phone: "", email: "",
    promoUsedKey: "" 
};

// --- 3. INIT & POPULATE ---
async function fetchPromoSettings() {
    try {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=get_settings&t=${Date.now()}`);
        livePromoSettings = await res.json();
        updatePromoUI(); 
    } catch(e) {
        console.warn("Gagal mendapatkan tetapan promosi dari server.", e);
    }
}

// --- Helper Ekstrak Masa (Letak atas updatePromoUI) ---
function extractPromoTime(val) {
    if(!val) return "00:00";
    let str = String(val);
    if(str.includes('T')) {
        let d = new Date(str);
        if(!isNaN(d)) return String(d.getHours()).padStart(2,'0') + ":" + String(d.getMinutes()).padStart(2,'0');
    }
    let m = str.match(/(\d{1,2}):(\d{2})/);
    if(m) return String(m[1]).padStart(2,'0') + ":" + m[2];
    return "00:00";
}

// --- GANTI 2 FUNGSI INI ---
function updatePromoUI() {
    const activeStr = String(livePromoSettings['happy_hour_active'] || 'FALSE').trim().toUpperCase();
    const isActive = (activeStr === 'TRUE');
    
    const banner = document.getElementById('promo-banner');
    
    if (isActive && banner) {
        if (isHappyHourNow()) {
            const amt = livePromoSettings['happy_hour_amount'] || 0;
            // FIX: Parse masa ke format HH:MM
            const start = extractPromoTime(livePromoSettings['happy_hour_start']);
            const end = extractPromoTime(livePromoSettings['happy_hour_end']);
            
            const fmt = (t) => {
                if(!t) return "";
                let [h, m] = t.split(':');
                let ampm = h >= 12 ? 'PM' : 'AM';
                h = h % 12; h = h ? h : 12;
                return `${h}:${m} ${ampm}`;
            };

            const banAmt = document.getElementById('ban-amount');
            const banTime = document.getElementById('ban-time');
            if(banAmt) banAmt.innerText = amt;
            if(banTime) banTime.innerText = `${fmt(start)} - ${fmt(end)}`;
            banner.classList.remove('hidden');
        } else {
            banner.classList.add('hidden'); 
        }
    } else if (banner) {
        banner.classList.add('hidden');
    }
}

function initBookingUI() {
    // Populate Dropdown MUA
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

    // Populate Dropdown Frame
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

    // Force Payment Buttons Type
    const bDep = document.getElementById('pay-opt-deposit');
    const bFull = document.getElementById('pay-opt-full');
    if(bDep) bDep.setAttribute('type', 'button');
    if(bFull) bFull.setAttribute('type', 'button');
}

// --- 4. WIZARD FLOW ---
function openBookingWizard(themeKey, pkgKey) {
    const wizard = document.getElementById('booking-wizard');
    if(wizard) wizard.classList.remove('hidden');

    currentPkgConfig = rayaPackages[pkgKey];
    const themeInfo = rayaThemesDetail[themeKey];
    
    // Reset Promo UI
    appliedPromoCode = null;
    appliedDiscountAmount = 0;
    
    const promoInput = document.getElementById('bk-promo-input');
    const promoMsg = document.getElementById('promo-message');
    if(promoInput) { promoInput.value = ""; promoInput.disabled = false; }
    if(promoMsg) promoMsg.classList.add('hidden');

    const elName = document.getElementById('bk-name');
    const elPhone = document.getElementById('bk-phone');
    const elEmail = document.getElementById('bk-email');

    // SETUP & RESET DATA 100%
    bookingData = {
        pkgKey: pkgKey,
        pkgName: currentPkgConfig.name,
        theme: themeInfo.title,         
        themeType: themeInfo.type,      
        paxAdult: currentPkgConfig.baseAdult,
        paxKids: 0,
        date: "", time: "", addOnsStr: "", frameStr: "Tiada", total: 0,
        paymentType: "Full Payment", promoUsedKey: "",
        name: elName ? elName.value : "", 
        phone: elPhone ? elPhone.value : "", 
        email: elEmail ? elEmail.value : ""
    };

    const pkgInput = document.getElementById('bk-package');
    if(pkgInput) pkgInput.value = `${bookingData.pkgName}`;
    
    // Set Theme Dropdown Options
    const thSelect = document.getElementById('bk-theme');
    if (thSelect) {
        thSelect.innerHTML = "";
        for (const [k, v] of Object.entries(rayaThemesDetail)) {
            if (v.type === themeInfo.type) { 
                let opt = document.createElement('option'); 
                opt.value = v.title; 
                opt.innerText = v.title; 
                thSelect.appendChild(opt);
            }
        }
        thSelect.value = themeInfo.title;
    }

    // Reset All Addon Checkboxes & Selects
    const tm = document.getElementById('bk-extra-time'); 
    if(tm) tm.checked = false;
    
    const mc = document.getElementById('bk-mua-check'); 
    if(mc) mc.checked = false;
    
    const muaCont = document.getElementById('mua-selection-container'); 
    if(muaCont) muaCont.classList.add('hidden');
    
    const bMuaSel = document.getElementById('bk-mua-select'); 
    if(bMuaSel) bMuaSel.value = "";
    
    const bFrmSel = document.getElementById('bk-frame-select'); 
    if(bFrmSel) bFrmSel.selectedIndex = 0;

    // Rules UI (Hide Extra Time for Pakej Lebaran)
    const timeContainer = tm?.closest('label');
    if(timeContainer) {
        timeContainer.style.display = currentPkgConfig.noExtraTime ? 'none' : 'flex';
    }

    // FIX: MESTI RESET CURRENT STEP KE 1 BILA BUKA WIZARD
    currentStep = 1; 
    
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

function checkThemeType() {
    const sel = document.getElementById('bk-theme');
    const catL = document.getElementById('bk-cat-label');
    
    // Safety Check: Kalau element takde atau tema tak wujud dalam data
    if(!sel || !catL || typeof rayaThemesDetail === 'undefined') return;
    
    const themeKey = Object.keys(rayaThemesDetail).find(key => rayaThemesDetail[key].title === sel.value);
    
    if (themeKey) {
        bookingData.theme = sel.value; // Simpan tema
        
        // Logik Penentuan Label
        // Kalau Pakej Mini -> Tulis Mini
        // Kalau Pakej Family -> Tulis Nama Pakej (Cth: Pakej Riang - Base 7 Pax)
        if (bookingData.pkgKey === 'mini') {
            catL.innerText = "KATEGORI MINI / COUPLE (MAX 2  DEWASA + 2 KANAK-KANAK)";
            catL.className = "text-[10px] font-bold mt-1 text-pink-500 uppercase";
        } else {
            // Ambil nama pakej dari config semasa
            const pkgName = currentPkgConfig.name.split(' (')[0]; // "PAKEJ RIANG"
            const basePax = currentPkgConfig.baseAdult;
            catL.innerText = `${pkgName} (BASE ${basePax} PAX)`;
            catL.className = "text-[10px] font-bold mt-1 text-green-600 uppercase";
        }
    }
    resetDateUI();
}
// --- 5. PAX & PROMO LOGIC ---
function updatePax(type, change) {
    let A = bookingData.paxAdult; 
    let K = bookingData.paxKids;
    
    if(type === 'adult') A += change; else K += change;
    
    if(A < 1) A = 1; 
    if(K < 0) K = 0;
    const tot = A + K;
    
    // Strict Limit Check (Mini Package)
    if(currentPkgConfig.strict) {
        if(A > currentPkgConfig.baseAdult) { alert(`Maksimum ${currentPkgConfig.baseAdult} Dewasa sahaja.`); return; }
        if(tot > currentPkgConfig.maxTotal) { alert(`Maksimum total ${currentPkgConfig.maxTotal} orang.`); return; }
    } else {
        if(tot > currentPkgConfig.maxTotal) { alert(`Kapasiti studio penuh (${currentPkgConfig.maxTotal} max).`); return; }
    }

    bookingData.paxAdult = A; 
    bookingData.paxKids = K;
    refreshPaxUI();
}

function isHappyHourNow() {
    const activeStr = String(livePromoSettings['happy_hour_active'] || 'FALSE').trim().toUpperCase();
    if (activeStr !== 'TRUE') return false;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // FIX: Parse masa dari database ke HH:MM
    const startStr = extractPromoTime(livePromoSettings['happy_hour_start']);
    const endStr = extractPromoTime(livePromoSettings['happy_hour_end']);
    
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    
    const startMinutes = sh * 60 + (sm || 0);
    const endMinutes = eh * 60 + (em || 0);

    const limit = parseInt(livePromoSettings['happy_hour_limit']) || 0;
    const used = parseInt(livePromoSettings['happy_hour_used']) || 0;

    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        if (limit === 0 || used < limit) {
            return true;
        }
    }
    return false;
}

function applyPromoCode() {
    const input = document.getElementById('bk-promo-input');
    const msg = document.getElementById('promo-message');
    if(!input || !msg) return;

    const code = input.value.trim().toUpperCase();
    
    if (bookingData.promoUsedKey === "HAPPY_HOUR") {
        msg.innerText = "❌ Anda sedang menikmati Happy Hour!";
        msg.className = "text-[10px] font-bold mt-2 ml-1 text-red-500 block";
        return;
    }

    const valueKey = "coupon_" + code;
    if (livePromoSettings[valueKey]) {
        
        // --- SEMAKAN BARU: ADAKAH KUPON AKTIF? ---
        const activeKey = "active_" + code;
        if (livePromoSettings[activeKey] === 'FALSE') {
            showCouponError("❌ Kod promosi ini telah ditutup/tidak aktif."); 
            return;
        }

        const limitKey = "limit_" + code;
        const usedKey = "used_" + code;
        
        const limit = parseInt(livePromoSettings[limitKey]) || 0;
        const used = parseInt(livePromoSettings[usedKey]) || 0;
        
        if (used >= limit && limit > 0) {
            showCouponError("❌ Kuota kod promosi ini telah habis."); return;
        }

        const startDate = livePromoSettings["start_" + code];
        const endDate = livePromoSettings["end_" + code];
        
        if (startDate || endDate) {
            if(!bookingData.date) { showCouponError("⚠️ Sila pilih tarikh slot dahulu."); return; }
            
            const slotDate = new Date(bookingData.date); 
            slotDate.setHours(0,0,0,0);
            
            if (startDate) { 
                const s = new Date(startDate); s.setHours(0,0,0,0); 
                if (slotDate < s) { showCouponError(`❌ Sah bermula ${formatDateUI(startDate)}`); return; } 
            }
            if (endDate) { 
                const e = new Date(endDate); e.setHours(0,0,0,0); 
                if (slotDate > e) { showCouponError(`❌ Tamat pada ${formatDateUI(endDate)}`); return; } 
            }
        }

        appliedPromoCode = code;
        appliedDiscountAmount = parseInt(livePromoSettings[valueKey]);
        bookingData.promoUsedKey = code; 
        msg.innerText = `✅ Kupon Sah: Diskaun RM${appliedDiscountAmount}`;
        msg.className = "text-[10px] font-bold mt-2 ml-1 text-green-500 block";
    } else {
        showCouponError("❌ Kod tidak sah");
    }
    calculateTotal();
}

function showCouponError(text) {
    const msg = document.getElementById('promo-message');
    if(msg) {
        msg.innerText = text;
        msg.className = "text-[10px] font-bold mt-2 ml-1 text-red-500 block";
    }
    appliedPromoCode = null; 
    appliedDiscountAmount = 0; 
    bookingData.promoUsedKey = "";
    calculateTotal();
}

// --- 6. CALCULATION ENGINE ---
function calculateTotal() {
    let price = currentPkgConfig.price; 
    let uiAddons = [];
    let dbAddons = [];

    // A. Extra Pax
    if (!currentPkgConfig.strict) {
        if (bookingData.paxAdult > currentPkgConfig.baseAdult) {
            let extra = bookingData.paxAdult - currentPkgConfig.baseAdult;
            let charge = extra * addonsPrice.extraPax; 
            price += charge;
            uiAddons.push(`Extra Dewasa x${extra} (+RM${charge})`);
        }
        const hint = document.getElementById('pax-price-hint');
        if(hint) hint.innerText = bookingData.paxAdult > currentPkgConfig.baseAdult ? `Extra (+RM${addonsPrice.extraPax}/pax)` : `Cover ${currentPkgConfig.baseAdult} Pax`;
    } else {
        const hint = document.getElementById('pax-price-hint');
        if(hint) hint.innerText = "Max 2 Dewasa";
    }

    // B. Extra Time
    const elTime = document.getElementById('bk-extra-time');
    if (elTime && elTime.checked && !currentPkgConfig.noExtraTime) {
        price += addonsPrice.extraTime; 
        uiAddons.push("Extra Time"); 
        dbAddons.push("Extra Time");
    }

    // C. MUA
    const elMuaCheck = document.getElementById('bk-mua-check');
    const elMuaSel = document.getElementById('bk-mua-select');
    if (elMuaCheck && elMuaCheck.checked && elMuaSel && elMuaSel.value) {
        price += addonsPrice.mua;
        
        let muaRaw = elMuaSel.value; // "MUA Adam Shah (@adamshahh3386)"
        let muaClean = muaRaw.split(' (')[0].trim(); // "MUA Adam Shah"
        
        uiAddons.push(muaRaw);
        dbAddons.push(muaClean); // Clean Name for DB
    }

    // D. Frame
    const elFrame = document.getElementById('bk-frame-select');
    let frameDBString = "Tiada";
    let freeGiftText = currentPkgConfig.freeGift ? `${currentPkgConfig.freeGift} (FREE)` : "";
    let paidFrameText = "";

    if (elFrame && elFrame.value && !elFrame.value.includes("Tiada")) {
        const match = elFrame.value.match(/\d+/g);
        if (match) {
            let fPrice = parseInt(match.pop());
            if (currentPkgConfig.discountFrame) {
                fPrice = fPrice * (1 - currentPkgConfig.discountFrame); 
                uiAddons.push(`Diskaun Frame Tambahan 10%`);
            }
            price += fPrice;
            
            // Clean Frame string: "Majestic Gallery (24"x30") (+RM220)" -> "Majestic Gallery 24x30"
            paidFrameText = elFrame.value.split(" (+")[0].replace(/[()"]/g, '').trim(); 
        }
    }

    if (freeGiftText && paidFrameText) frameDBString = `${freeGiftText}, ${paidFrameText}`;
    else if (freeGiftText) frameDBString = freeGiftText;
    else if (paidFrameText) frameDBString = paidFrameText;

    // E. Promo Deductions
    let discountStr = "";
    let totalDiscount = 0;

    const promoInput = document.getElementById('bk-promo-input');
    const pMsg = document.getElementById('promo-message');

    if (isHappyHourNow() && !appliedPromoCode) {
        const hhAmount = parseInt(livePromoSettings['happy_hour_amount']) || 0;
        totalDiscount += hhAmount;
        discountStr = `🔥 Happy Hour (-RM${hhAmount})`;
        bookingData.promoUsedKey = "HAPPY_HOUR";
        
        if(promoInput) promoInput.disabled = true;
        if(pMsg) {
             pMsg.innerText = "✨ Happy Hour Auto-Applied!";
             pMsg.classList.remove('hidden');
             pMsg.className = "text-[10px] font-bold mt-2 ml-1 text-amber-500 block";
        }
    } else if (appliedPromoCode) {
        totalDiscount += appliedDiscountAmount;
        discountStr = `🎟️ Kupon ${appliedPromoCode} (-RM${appliedDiscountAmount})`;
        if(promoInput) promoInput.disabled = false;
    } else {
        if(promoInput) promoInput.disabled = false;
    }

    // Avoid negative pricing
    price = price - totalDiscount;
    if (price < 0) price = 0;

    // Finalize Data
    bookingData.total = price;
    bookingData.frameStr = frameDBString;
    bookingData.addOnsStr = dbAddons.length > 0 ? dbAddons.join(", ") : "Tiada";
    
    // Update Summaries UI
    setText('bk-total-step3', price + totalDiscount); 
    setText('bk-total-final', price);
    setText('lbl-full-amt', price);
    setText('rev-frame', frameDBString);
    
    const rowAdd = document.getElementById('row-addons');
    if(rowAdd) {
        if(uiAddons.length > 0) { 
            setText('rev-addons', uiAddons.join(", ")); 
            rowAdd.classList.remove('hidden'); 
        } else { 
            rowAdd.classList.add('hidden'); 
        }
    }

    const rowDisc = document.getElementById('row-discount');
    if(rowDisc) {
        if(totalDiscount > 0) { 
            setText('rev-discount', discountStr); 
            rowDisc.classList.remove('hidden'); 
        } else { 
            rowDisc.classList.add('hidden'); 
        }
    }
}

// --- 7. NAVIGATION & SUBMIT ---
function nextStep(step) {
    // Forward Validation
    if(step > currentStep) {
         if (step === 2) {
            const n = document.getElementById('bk-name') ? document.getElementById('bk-name').value : "";
            const p = document.getElementById('bk-phone') ? document.getElementById('bk-phone').value : "";
            if (!n || !p) { alert("Sila isi Nama & No Telefon."); return; }
        }
        if (step === 3) {
            const d = document.getElementById('bk-date') ? document.getElementById('bk-date').value : "";
            const t = document.getElementById('bk-time') ? document.getElementById('bk-time').value : "";
            
            // Sekat jika Tarikh atau Masa kosong
            if (!d || !t || t === "") { 
                alert("Sila semak kekosongan dan pilih masa slot terlebih dahulu."); 
                return; 
            }
            bookingData.date = d;
            bookingData.time = t;
        }
    }
    
    // Back to Pax (Reset Addons & Promo)
    if(step === 3) {
        bookingData.paxAdult = currentPkgConfig.baseAdult; 
        bookingData.paxKids = 0;
        
        const et = document.getElementById('bk-extra-time'); if(et) et.checked = false;
        const mc = document.getElementById('bk-mua-check'); if(mc) mc.checked = false;
        const mCont = document.getElementById('mua-selection-container'); if(mCont) mCont.classList.add('hidden');
        const ms = document.getElementById('bk-mua-select'); if(ms) ms.value = "";
        const fs = document.getElementById('bk-frame-select'); if(fs) fs.selectedIndex = 0;
        
        appliedPromoCode = null; 
        appliedDiscountAmount = 0; 
        bookingData.promoUsedKey = "";
        
        const pi = document.getElementById('bk-promo-input'); if(pi) { pi.value = ""; pi.disabled = false; }
        const pm = document.getElementById('promo-message'); if(pm) pm.classList.add('hidden');
        
        refreshPaxUI();
    }
    
    // Final Summary
    if(step === 4) {
        calculateTotal();
        setText('rev-name', document.getElementById('bk-name').value);
        setText('rev-datetime', `${formatDateUI(bookingData.date)} @ ${bookingData.time}`);
        setText('rev-theme', bookingData.theme);
        setText('rev-pax', `${bookingData.paxAdult} Dewasa, ${bookingData.paxKids} Kanak-kanak`);
        setText('rev-package', bookingData.pkgName); // e.g. "PAKEJ SALAM (RM89)"
        setPaymentType('full'); 
    }

    currentStep = step; 
    showStep(step);
}

function submitBooking() {
    const elMuaCheck = document.getElementById('bk-mua-check');
    const elMuaSelect = document.getElementById('bk-mua-select');
    
    // Safety check for MUA Selection
    if (elMuaCheck && elMuaCheck.checked && elMuaSelect && !elMuaSelect.value) { 
        alert("Sila pilih MUA anda dari senarai."); 
        return; 
    }
    
    const btn = document.getElementById('btn-confirm-wa');
    if(btn) { 
        btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Memproses...`; 
        btn.disabled = true; 
    }

    // Generate Unique ID
    const uniqueID = "RAYA-" + Math.floor(10000 + Math.random() * 90000);
    
    // Format Phone
    const phoneInput = document.getElementById('bk-phone');
    let ph = phoneInput ? phoneInput.value.replace(/\D/g,'') : "000";
    if(ph.startsWith('0')) ph = '6' + ph; 
    else if(ph.startsWith('1')) ph = '60' + ph;

    // Clean Package Name for Database (Remove RM pricing in name if any)
    const cleanPackage = bookingData.pkgName.split(' (')[0].trim();

    const payload = {
        action: "save_booking",
        orderID: uniqueID, 
        name: document.getElementById('bk-name').value, 
        phone: ph,
        email: document.getElementById('bk-email').value || "-", 
        package: cleanPackage, 
        theme: bookingData.theme, 
        date: bookingData.date, 
        time: bookingData.time,
        pax: `${bookingData.paxAdult} Dewasa, ${bookingData.paxKids} Kanak-kanak`,
        addOns: bookingData.addOnsStr, // Already Cleaned 
        totalPrice: bookingData.total,
        frame: bookingData.frameStr,   // Already Cleaned
        paymentType: bookingData.paymentType, 
        status: "Pending",
        promoUsed: bookingData.promoUsedKey 
    };

    fetch(GOOGLE_SCRIPT_URL, { 
        method: "POST", 
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
    })
    .then(() => {
        let msgPay = bookingData.paymentType.toLowerCase().includes('deposit') ? "💳 *JENIS BAYARAN: DEPOSIT (RM50)*" : `💳 *JENIS BAYARAN: PENUH (RM${bookingData.total})`;
        let promoMsg = bookingData.promoUsedKey ? `\n🎁 *Promo Applied:* ${bookingData.promoUsedKey}` : '';
        
        const waMsg = `Hi MKAJ Studio! 👋\nSaya nak confirmkan Booking Raya 2026.\n\n🆔 *${uniqueID}*\n👤 ${payload.name}\n📦 ${payload.package}\n🕌 ${payload.theme}\n📅 ${formatDateUI(payload.date)} @ ${payload.time}\n👥 *Pax:* ${payload.pax}\n🖼️ *Frame:* ${payload.frame}\n➕ *Add-ons:* ${payload.addOns}${promoMsg}\n💰 *Total:* RM${payload.totalPrice}\n\n${msgPay}\n\nTerima kasih!`;
        
        localStorage.setItem('lastWaMsg', waMsg);
        window.location.href = "success.html"; 
    });
}

// --- 8. UTILITIES & UI CONTROLS ---

function checkAvailability() {
    const el = document.getElementById('bk-date'); 
    if(!el || !el.value) return;
    
    // Kosongkan slot lama
    const container = document.getElementById('time-slots-container');
    if(container) container.innerHTML = "";
    
    const btnStep2 = document.getElementById('btn-step-2');
    if(btnStep2) btnStep2.disabled = true;

    // Seasonal Check
    const uD = new Date(el.value); uD.setHours(0,0,0,0); 
    const sS = new Date(SEASON_START); sS.setHours(0,0,0,0); 
    const sE = new Date(SEASON_END); sE.setHours(0,0,0,0);
    
    const err = document.getElementById('date-error-msg');
    
    if (uD < sS || uD > sE) {
        if(err) { 
            err.innerText = "Maaf, Studio hanya beroperasi dari 5 Mac hingga 3 April 2026."; 
            err.classList.remove('hidden'); 
        }
        return;
    } else { 
        if(err) err.classList.add('hidden'); 
    }
    
    bookingData.date = el.value; 
    calculateTotal(); 
    
    const loader = document.getElementById('time-loader'); 
    if(loader) loader.classList.remove('hidden');
    
    fetch(`${GOOGLE_SCRIPT_URL}?action=check_slots&date=${el.value}&theme=${encodeURIComponent(bookingData.theme)}`)
    .then(res => res.json())
    .then(data => { 
        if(loader) loader.classList.add('hidden'); 
        renderTimeSlots(data.bookedSlotIds || []); 
    });
}

function resetDateUI() {
    const dateInput = document.getElementById('bk-date');
    const timeInput = document.getElementById('bk-time');
    const container = document.getElementById('time-slots-container');
    const btnNext = document.getElementById('btn-step-2');
    
    if(dateInput) { dateInput.value = ""; dateInput.setAttribute('min', SEASON_START); dateInput.setAttribute('max', SEASON_END); }
    if(timeInput) timeInput.value = "";
    if(container) container.innerHTML = `<div class="col-span-4 text-center py-4 bg-gray-50 text-gray-400 text-sm italic">Sila pilih tarikh di atas dahulu.</div>`;
    if(btnNext) btnNext.disabled = true;
}

function renderTimeSlots(fullSlots) {
    const container = document.getElementById('time-slots-container'); 
    if(!container) return;
    
    container.innerHTML = '';
    
    TIME_SLOTS.forEach(time => {
        // Logic 1 Theme 1 Slot Check
        const isFull = fullSlots.includes(time) || fullSlots.includes(`${bookingData.theme}_${time}`);
        
        const btn = document.createElement('button'); 
        btn.innerText = time;
        
        if (isFull) { 
            btn.className = "bg-red-50 text-red-300 border border-red-100 cursor-not-allowed py-2 rounded-2xl text-xs line-through opacity-60"; 
            btn.disabled = true; 
        } else {
            btn.className = "bg-white border border-gray-200 py-2 rounded-2xl text-xs font-bold hover:bg-amber-500 hover:text-white transition duration-200";
            btn.onclick = () => { 
                Array.from(container.children).forEach(b => { 
                    if(!b.disabled) b.className = "bg-white border border-gray-200 py-2 rounded-2xl text-xs font-bold hover:bg-amber-500 hover:text-white transition duration-200"; 
                }); 
                btn.className = "bg-amber-500 text-white border-amber-600 py-2 rounded-2xl text-xs font-black shadow-lg transform scale-105 transition"; 
                
                bookingData.time = time; 
                const timeInput = document.getElementById('bk-time');
                if(timeInput) timeInput.value = time; 
                
                const btnNext = document.getElementById('btn-step-2');
                if(btnNext) btnNext.disabled = false; 
            };
        }
        container.appendChild(btn);
    });
}

function toggleMuaSelection() { 
    const c = document.getElementById('bk-mua-check'); 
    const cont = document.getElementById('mua-selection-container');
    if(c && cont) { 
        cont.classList.toggle('hidden', !c.checked); 
        if(!c.checked) {
            const sel = document.getElementById('bk-mua-select');
            if(sel) sel.value = ""; 
        }
        calculateTotal(); 
    } 
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
    
    if(bDep && bFull) {
        if(t === 'deposit') {
            bDep.className = "p-4 border-2 rounded-2xl text-center border-amber-600 bg-amber-50 shadow-inner ring-2 ring-amber-600/20 scale-[1.02] font-bold transition";
            bFull.className = "p-4 border-2 rounded-2xl text-center border-gray-100 opacity-50 grayscale transition hover:opacity-100 hover:grayscale-0";
        } else {
            bFull.className = "p-4 border-2 rounded-2xl text-center border-green-600 bg-green-50 shadow-inner ring-2 ring-green-600/20 scale-[1.02] font-bold transition";
            bDep.className = "p-4 border-2 rounded-2xl text-center border-gray-100 opacity-50 grayscale transition hover:opacity-100 hover:grayscale-0";
        }
    }
}

function refreshPaxUI() { 
    setText('bk-pax-adult', bookingData.paxAdult); 
    setText('bk-pax-kid', bookingData.paxKids); 
    calculateTotal(); 
}

function setText(id, val) { 
    const el = document.getElementById(id); 
    if(el) el.innerText = val; 
}

function getValue(id) { 
    const el = document.getElementById(id); 
    return el ? el.value : ""; 
}

function formatDateUI(s) { 
    if(!s) return ""; 
    const d = new Date(s); 
    return d.toLocaleDateString('ms-MY', {day:'numeric', month:'short'}); 
}

// Initializer Trigger
window.onload = () => { 
    if (typeof renderTncAndFaq === "function") renderTncAndFaq();
    initBookingUI(); 
    fetchPromoSettings(); 
};