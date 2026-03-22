/* assets/js/main.js - V98.0 (PACKAGE FLOW FIXED & LOCKED) */

function getImagePath(folder, number) {
    return folder === 'demo' ? `https://picsum.photos/800/1200?random=${number + 100}` : `${folder}${number}.webp`;
}

function toggleMenu() { document.getElementById('mobile-menu').classList.toggle('active'); }

window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    const navBookBtn = document.getElementById('nav-book-btn');
    const logoText = document.querySelector('.logo-text');
    
    if (!document.body.classList.contains('static-nav')) {
        if (window.scrollY > 50) {
            if(navbar) navbar.classList.add('scrolled-nav');
            if(navBookBtn) { navBookBtn.classList.replace('border-white/50', 'border-black'); navBookBtn.classList.replace('hover:bg-white', 'hover:bg-black'); navBookBtn.classList.replace('hover:text-black', 'hover:text-white'); }
            if(logoText) logoText.classList.remove('text-white');
        } else {
            if(navbar) navbar.classList.remove('scrolled-nav');
            if(navBookBtn) { navBookBtn.classList.replace('border-black', 'border-white/50'); navBookBtn.classList.replace('hover:bg-black', 'hover:bg-white'); navBookBtn.classList.replace('hover:text-white', 'hover:text-black'); }
            if(logoText) logoText.classList.add('text-white');
        }
    }
});

function openBookingModal() {
    const menu = document.getElementById('mobile-menu'); if(menu) menu.classList.remove('active');
    const modal = document.getElementById('booking-modal'); if(modal) { modal.classList.remove('hidden'); modal.classList.add('fade-in'); }
}
function closeBookingModal() { const m = document.getElementById('booking-modal'); if(m) m.classList.add('hidden'); }
window.onclick = function(e) { const m = document.getElementById('booking-modal'); if (e.target == m) closeBookingModal(); }

function initHomepageSlideshow() {
    if(typeof slideshowData === 'undefined') return;
    let slideIndices = { 'img-wedding': 0, 'img-studio': 0, 'img-raya': 0, 'img-event': 0, 'img-convo': 0, 'img-engagement': 0 };
    setInterval(() => {
        for (const [id, images] of Object.entries(slideshowData)) {
            const imgEl = document.getElementById(id);
            if(imgEl) {
                imgEl.style.opacity = 0;
                setTimeout(() => {
                    slideIndices[id] = (slideIndices[id] + 1) % images.length;
                    imgEl.src = images[slideIndices[id]];
                    imgEl.onload = () => { imgEl.style.opacity = 1; };
                }, 500);
            }
        }
    }, 3500); 
}

/* --- GALLERY SYSTEM --- */
let currentViewLevel = 1; 
let activeCategory = null;
let currentAlbumPhotos = [];
let currentLightboxIndex = 0;
let albumGridInterval = null;

function handleBack() {
    if (currentViewLevel === 1) window.location.href = 'index.html';
    else if (currentViewLevel === 2) showCategories();
    else if (currentViewLevel === 3) showAlbums(activeCategory);
}

function handleBackToAlbums() { if (activeCategory) showAlbums(activeCategory); }

function switchView(viewId) {
    if(viewId !== 'view-albums' && albumGridInterval) { clearInterval(albumGridInterval); albumGridInterval = null; } 
    document.querySelectorAll('.view-section').forEach(el => { el.classList.remove('active-view'); el.classList.add('hidden-view'); });
    const target = document.getElementById(viewId);
    if(target) { target.classList.remove('hidden-view'); target.classList.add('active-view'); }
    window.scrollTo(0, 0);
    const btnText = document.getElementById('back-btn-text');
    if(btnText) btnText.innerText = currentViewLevel === 1 ? "Back Home" : (currentViewLevel === 2 ? "Back to Collections" : "Back to Albums");
}

function updateBreadcrumb(level, text = "") {
    const bc = document.getElementById('breadcrumb');
    if(!bc) return;
    const items = ['bc-sep-1', 'bc-category', 'bc-sep-2', 'bc-album'];
    if (level === 1) bc.classList.add('hidden');
    else {
        bc.classList.remove('hidden');
        document.getElementById('bc-category').innerText = activeCategory;
        if(level === 2) { document.getElementById('bc-category').classList.remove('hidden'); document.getElementById('bc-sep-1').classList.remove('hidden'); document.getElementById('bc-album').classList.add('hidden'); document.getElementById('bc-sep-2').classList.add('hidden'); }
        if(level === 3) { items.forEach(id => { const e=document.getElementById(id); if(e) e.classList.remove('hidden');}); document.getElementById('bc-album').innerText = text; }
    }
}

function showCategories() { currentViewLevel = 1; switchView('view-categories'); updateBreadcrumb(1); }

function showAlbums(category) {
    if(!category || typeof galleryData === 'undefined' || !galleryData[category]) return; 
    
    currentViewLevel = 2; activeCategory = category;
    
    const titleEl = document.getElementById('category-title');
    if(titleEl) titleEl.innerText = category + " Collections";
    
    const grid = document.getElementById('albums-grid');
    if(!grid) return; 
    grid.innerHTML = ''; 
    
    const albums = galleryData[category];
    albums.forEach(album => {
        const coverSrc = getImagePath(album.folder, 1);
        const html = `
            <div onclick="showPhotos(${album.id})" class="group cursor-pointer">
                <div class="relative overflow-hidden rounded-lg shadow-sm bg-gray-200 aspect-[3/4] mb-4">
                    <img src="${coverSrc}" class="album-cover-img w-full h-full object-cover transition duration-700 group-hover:scale-105" data-folder="${album.folder}" data-total="${album.total}" data-current="1">
                    <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                        <span class="bg-white text-black px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition">Open</span>
                    </div>
                </div>
                <h3 class="font-serif text-2xl group-hover:text-amber-600 transition">${album.title}</h3>
                <p class="text-xs text-gray-400 uppercase tracking-widest mt-1">${album.location} • ${album.total} Photos</p>
            </div>`;
        grid.innerHTML += html;
    });
    
    startAlbumGridSlideshow();
    switchView('view-albums'); 
    updateBreadcrumb(2);
}

function startAlbumGridSlideshow() {
    if (albumGridInterval) clearInterval(albumGridInterval);
    albumGridInterval = setInterval(() => {
        const covers = document.querySelectorAll('.album-cover-img');
        covers.forEach(img => {
            const folder = img.getAttribute('data-folder');
            const total = parseInt(img.getAttribute('data-total'));
            let current = parseInt(img.getAttribute('data-current'));
            let next = current + 1;
            if (next > total) next = 1; 
            if (folder === 'demo' && next > 5) next = 1; 
            const newSrc = getImagePath(folder, next);
            img.style.opacity = 0.8;
            setTimeout(() => {
                img.src = newSrc;
                img.setAttribute('data-current', next);
                img.onload = () => { img.style.opacity = 1; };
            }, 200);
        });
    }, 3000); 
}

function showPhotos(albumId) {
    if(!activeCategory || !galleryData[activeCategory]) return;
    
    currentViewLevel = 3;
    const album = galleryData[activeCategory].find(a => a.id === albumId);
    if(!album) return;

    const tEl = document.getElementById('album-title'); if(tEl) tEl.innerText = album.title;
    const lEl = document.getElementById('album-location'); if(lEl) lEl.innerText = album.location;
    
    const grid = document.getElementById('photos-grid'); 
    if(!grid) return;
    grid.innerHTML = ''; 
    currentAlbumPhotos = [];
    
    for(let i = 1; i <= album.total; i++) {
        const src = getImagePath(album.folder, i); 
        currentAlbumPhotos.push(src);
        grid.innerHTML += `<div onclick="openLightbox(${i - 1})" class="cursor-pointer group overflow-hidden rounded bg-gray-200 aspect-[3/4] md:aspect-[2/3]"><img src="${src}" loading="lazy" class="w-full h-full object-cover transition duration-500 group-hover:scale-110"></div>`;
    }
    switchView('view-photos'); 
    updateBreadcrumb(3, album.title);
}

/* --- LIGHTBOX GALERI (PORTFOLIO) --- */
function openLightbox(index) { 
    currentLightboxIndex = index; 
    updateLightbox(); 
    const lb = document.getElementById('lightbox');
    if(lb) lb.classList.remove('hidden'); 
    document.body.style.overflow = 'hidden'; 
}
function closeLightbox() { 
    const lb = document.getElementById('lightbox');
    if(lb) lb.classList.add('hidden'); 
    
    const rayaLb = document.getElementById('gallery-lightbox');
    if(rayaLb) {
        rayaLb.classList.add('opacity-0');
        setTimeout(() => rayaLb.classList.add('hidden'), 300);
    }
    document.body.style.overflow = 'auto'; 
}
function updateLightbox() { 
    const img = document.getElementById('lightbox-img');
    const curr = document.getElementById('lb-current');
    const tot = document.getElementById('lb-total');
    if(img && currentAlbumPhotos[currentLightboxIndex]) img.src = currentAlbumPhotos[currentLightboxIndex]; 
    if(curr) curr.innerText = currentLightboxIndex + 1; 
    if(tot) tot.innerText = currentAlbumPhotos.length; 
}
function navLightbox(dir) { 
    currentLightboxIndex += dir; 
    if (currentLightboxIndex < 0) currentLightboxIndex = currentAlbumPhotos.length - 1; 
    if (currentLightboxIndex >= currentAlbumPhotos.length) currentLightboxIndex = 0; 
    updateLightbox(); 
}

const lightboxEl = document.getElementById('lightbox');
if(lightboxEl) {
    let ts = 0, te = 0;
    lightboxEl.addEventListener('touchstart', e => ts = e.changedTouches[0].screenX, {passive: true});
    lightboxEl.addEventListener('touchend', e => { 
        te = e.changedTouches[0].screenX; 
        if(te < ts - 50) navLightbox(1); 
        if(te > ts + 50) navLightbox(-1); 
    }, {passive: true});
    
    const btnClose = document.getElementById('lightbox-close'); if(btnClose) btnClose.onclick = closeLightbox;
    const btnPrev = document.getElementById('lightbox-prev'); if(btnPrev) btnPrev.onclick = () => navLightbox(-1);
    const btnNext = document.getElementById('lightbox-next'); if(btnNext) btnNext.onclick = () => navLightbox(1);
}

// ==========================================
// --- 2. RAYA SYSTEM (THEMES & PACKAGES) ---
// ==========================================

function initCategoryFeatures() {
    if (typeof categoryMeta === 'undefined') return;
    for (const [key, info] of Object.entries(categoryMeta)) {
        const descEl = document.getElementById(`cat-desc-${key}`);
        const imgEl = document.getElementById(`cat-img-${key}`);
        if (descEl) descEl.innerText = `"${info.description}"`;
        if (imgEl && info.images.length > 0) imgEl.src = info.images[0];
    }
    if (window.catSlideshowInterval) clearInterval(window.catSlideshowInterval);
    let catIndices = { wedding: 0, studio: 0, raya: 0, event: 0, convo: 0, engagement: 0 };
    window.catSlideshowInterval = setInterval(() => {
        for (const [key, info] of Object.entries(categoryMeta)) {
            const imgEl = document.getElementById(`cat-img-${key}`);
            if (imgEl && info.images.length > 1) {
                imgEl.style.opacity = 0;
                setTimeout(() => {
                    catIndices[key] = (catIndices[key] + 1) % info.images.length;
                    imgEl.src = info.images[catIndices[key]];
                    imgEl.onload = () => { imgEl.style.opacity = 1; };
                    imgEl.onerror = () => { imgEl.style.opacity = 1; }; 
                }, 500); 
            }
        }
    }, 4000); 
}

/* --- RAYA HERO SLIDESHOW LOGIC --- */
let currentRayaIndex = 0; let rayaInterval = null;
function initRayaHero() {
    const container = document.getElementById('raya-hero-slides'); const indCont = document.getElementById('raya-indicators');
    if (!container || typeof rayaHeroImages === 'undefined' || rayaHeroImages.length === 0) return;
    container.innerHTML = '<div class="absolute inset-0 bg-black/40 z-20 pointer-events-none"></div>'; 
    if(indCont) indCont.innerHTML = '';
    rayaHeroImages.forEach((src, index) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = `absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === 0 ? 'opacity-100' : 'opacity-0'}`;
        slideDiv.id = `raya-slide-${index}`;
        slideDiv.innerHTML = `<img src="${src}" class="absolute inset-0 w-full h-full object-cover blur-xl scale-110 brightness-50 z-0"><img src="${src}" class="absolute inset-0 w-full h-full object-contain object-center z-10 drop-shadow-2xl">`;
        container.appendChild(slideDiv);
        if (indCont) {
            const dot = document.createElement('div');
            dot.className = `w-2 h-2 rounded-full cursor-pointer transition-all z-30 ${index === 0 ? 'bg-white w-8' : 'bg-white/50'}`;
            dot.onclick = () => manualRayaSlide(index); dot.id = `raya-dot-${index}`; indCont.appendChild(dot);
        }
    });
    startRayaAutoplay();
}
function updateRayaHeroUI() {
    rayaHeroImages.forEach((_, index) => {
        const slideDiv = document.getElementById(`raya-slide-${index}`); const dot = document.getElementById(`raya-dot-${index}`);
        if (index === currentRayaIndex) {
            if(slideDiv) { slideDiv.classList.remove('opacity-0'); slideDiv.classList.add('opacity-100'); }
            if(dot) { dot.classList.remove('bg-white/50', 'w-2'); dot.classList.add('bg-white', 'w-8'); }
        } else {
            if(slideDiv) { slideDiv.classList.remove('opacity-100'); slideDiv.classList.add('opacity-0'); }
            if(dot) { dot.classList.remove('bg-white', 'w-8'); dot.classList.add('bg-white/50', 'w-2'); }
        }
    });
}
function nextRayaSlide() { currentRayaIndex = (currentRayaIndex + 1) % rayaHeroImages.length; updateRayaHeroUI(); resetRayaTimer(); }
function prevRayaSlide() { currentRayaIndex = (currentRayaIndex - 1 + rayaHeroImages.length) % rayaHeroImages.length; updateRayaHeroUI(); resetRayaTimer(); }
function manualRayaSlide(index) { currentRayaIndex = index; updateRayaHeroUI(); resetRayaTimer(); }
function startRayaAutoplay() { if (rayaInterval) clearInterval(rayaInterval); rayaInterval = setInterval(nextRayaSlide, 5000); }
function resetRayaTimer() { clearInterval(rayaInterval); startRayaAutoplay(); }

/* --- RAYA THEME GRID SYSTEM --- */
function filterThemes(type) {
    const gridContainer = document.getElementById('theme-grid');
    if(!gridContainer || typeof rayaThemesDetail === 'undefined') return;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.className = "filter-btn bg-white text-gray-500 border border-gray-200 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:border-gray-400 transition cursor-pointer");
    const activeBtn = document.getElementById(`filter-${type}`);
    if(activeBtn) {
        if(type === 'standard') activeBtn.className = "filter-btn bg-green-50 text-green-700 border border-green-600 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-md transition transform scale-105";
        else if(type === 'mini') activeBtn.className = "filter-btn bg-pink-50 text-pink-600 border border-pink-500 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-md transition transform scale-105";
        else activeBtn.className = "filter-btn bg-black text-white border border-black px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-md transition transform scale-105"; 
    }
    gridContainer.innerHTML = ''; gridContainer.style.opacity = 0;
    for (const [key, val] of Object.entries(rayaThemesDetail)) {
        if (type !== 'all' && val.type !== type) continue;
        const badgeColorClass = val.type === 'mini' ? 'bg-white/90 text-pink-600 border-pink-200' : 'bg-white/90 text-green-700 border-green-200';
        const labelText = val.type === 'mini' ? 'Mini' : 'Family';
        const posterImage = val.thumbnail ? val.thumbnail : val.images[0];
        // Di dalam loop gridContainer.innerHTML += ...
        // Tambah pembolehubah soldOutOverlay di atasnya:

        const isSoldOut = val.soldOut === true;
        const soldOutOverlay = isSoldOut ? `
            <div class="absolute inset-0 bg-black/60 z-20 flex items-center justify-center">
                <span class="border-2 border-white text-white px-4 py-1 rounded-md font-black tracking-widest text-xs">FULLY BOOKED</span>
            </div>` : "";
        
        const cardHTML = `
            <div onclick="openThemeDetails('${key}')" class="group relative rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition duration-500 bg-gray-100 aspect-[3/4]">
                ${soldOutOverlay}
                <img src="${posterImage}" loading="lazy" class="w-full h-full object-cover transition duration-700 group-hover:scale-110">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80"></div>
                <div class="absolute top-3 left-3"><span class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${badgeColorClass} shadow-sm">${labelText}</span></div>
                <div class="absolute bottom-0 left-0 w-full p-4 md:p-6 text-left">
                    <h3 class="text-white font-serif text-xl md:text-2xl italic leading-tight mb-1 group-hover:text-amber-400 transition">${val.title}</h3>
                    <p class="text-gray-300 text-xs md:text-sm line-clamp-1 mb-2 font-light">${val.tagline}</p>
                </div>
            </div>`;
        gridContainer.innerHTML += cardHTML;
    }
    setTimeout(() => { gridContainer.style.opacity = 1; }, 50);
}

/* ==============================================================
   --- THEME DETAIL POPUP & PACKAGE FLOW (RESTORED & LOCKED) ---
   ============================================================== */
let modalSwiperInstance = null;
let currentThemeKey = ""; 
let tempSelectedPkgKey = "";

function openThemeDetails(key) {
    if (typeof rayaThemesDetail === 'undefined' || !rayaThemesDetail[key]) return;
    const data = rayaThemesDetail[key];
    currentThemeKey = key; 

    // 1. Update UI Teks & Badge
    const tTitle = document.getElementById('th-modal-title'); if(tTitle) tTitle.innerText = data.title;
    const tDesc = document.getElementById('th-modal-desc'); if(tDesc) tDesc.innerText = data.desc;
    
    const catBadge = document.getElementById('th-cat-badge');
    if(catBadge) {
        catBadge.innerText = data.categoryName;
        catBadge.className = `inline-block px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase mb-4 border ${data.colorClass}`;
    }

    // 2. Update Inclusions (Senarai Apa Anda Dapat)
    const incList = document.getElementById('th-modal-inclusions');
    if(incList) {
        incList.innerHTML = ""; 
        // Warna icon: Hijau untuk family(standard), Pink untuk mini
        const checkColor = data.type === 'mini' ? 'text-pink-500' : 'text-green-500';
        data.inclusions.forEach(item => {
            incList.innerHTML += `<li class="flex items-start gap-2 text-xs text-gray-700 font-medium"><i class="fas fa-check-circle ${checkColor} mt-0.5"></i> <span>${item}</span></li>`;
        });
    }

    // 3. Setup Swiper Slideshow
    const slidesContainer = document.getElementById('th-modal-slides-container');
    const modal = document.getElementById('theme-detail-modal');
    if(modal) modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    if (slidesContainer && data.images.length > 0) {
        if (modalSwiperInstance) { modalSwiperInstance.destroy(true, true); modalSwiperInstance = null; }
        slidesContainer.innerHTML = "";
        data.images.forEach((imgUrl, idx) => {
            const slide = document.createElement('div');
            slide.className = "swiper-slide w-full h-full cursor-pointer";
            slide.innerHTML = `<img src="${imgUrl}" class="w-full h-full object-cover block" onclick="openThemeLightbox(${idx})">`; 
            slidesContainer.appendChild(slide);
        });
        modalSwiperInstance = new Swiper(".modalSwiper", {
            observer: true, observeParents: true, 
            loop: data.images.length > 1, 
            effect: "fade", speed: 500,
            navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
            pagination: { el: ".swiper-pagination", clickable: true }, 
            autoplay: { delay: 3500 }
        });
    }

    // --- 4. LOGIK SOLD OUT & FOOTER CONTROL ---
    const isSoldOut = data.soldOut === true;
    const footerFamily = document.getElementById('modal-tier-family'); // Untuk type: standard
    const footerCouple = document.getElementById('modal-tier-couple'); // Untuk type: mini

    // Reset: Sembunyikan kedua-dua footer dan buang mesej ralat lama
    if(footerFamily) footerFamily.classList.add('hidden');
    if(footerCouple) footerCouple.classList.add('hidden');
    const existingNotice = document.getElementById('sold-out-notice');
    if(existingNotice) existingNotice.remove();

    if (isSoldOut) {
        // Jika SOLD OUT: Tunjukkan mesej amaran
        const soldOutMsg = `<div id="sold-out-notice" class="text-center p-4 bg-red-50 text-red-600 rounded-2xl font-black border border-red-200 uppercase text-xs tracking-widest mt-4">Maaf, Slot Tema Ini Telah Penuh</div>`;
        document.getElementById('th-modal-inclusions').parentElement.insertAdjacentHTML('afterend', soldOutMsg);
    } else {
        // Jika ADA SLOT: Tunjukkan footer mengikut kategori tema
        if (data.type === 'standard' || data.type === 'family') {
            if(footerFamily) footerFamily.classList.remove('hidden');
        } else if (data.type === 'mini' || data.type === 'couple') {
            if(footerCouple) footerCouple.classList.remove('hidden');
        }
    }
}
function closeThemeModal() {
    const modal = document.getElementById('theme-detail-modal');
    if(modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; 
}

// BUKA MODAL PILIH PAKEJ (CARDS)
function openPackageModal() {
    closeThemeModal();
    const data = rayaThemesDetail[currentThemeKey];
    if(!data) return;
    
    const tName = document.getElementById('pkg-modal-theme-name');
    if(tName) tName.innerText = data.title;
    
    const container = document.getElementById('package-cards-container');
    if(container) {
        container.innerHTML = '';
        if (data.type === 'mini') {
            container.appendChild(createPackageCard(rayaPackages['mini'], 'mini'));
        } else {
            ['salam', 'riang', 'ceria', 'lebaran'].forEach(pkgKey => {
                if(rayaPackages[pkgKey]) container.appendChild(createPackageCard(rayaPackages[pkgKey], pkgKey));
            });
        }
    }
    
    const pModal = document.getElementById('package-modal');
    if(pModal) pModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function createPackageCard(pkg, pkgKey) {
    const div = document.createElement('div');
    div.className = "bg-white p-5 rounded-2xl border-2 border-gray-100 hover:border-amber-500 cursor-pointer transition shadow-sm hover:shadow-md group relative overflow-hidden mb-3";
    div.onclick = () => selectPackageAndShowTNC(pkgKey);
    
    let priceHtml = "";
    if (pkg.originalPrice && pkg.originalPrice > pkg.price) {
        priceHtml = `
            <div class="flex items-end gap-2 mb-2">
                <span class="text-3xl font-black text-slate-900 leading-none">RM${pkg.price}</span>
                <span class="text-sm text-gray-400 line-through decoration-red-400 font-bold mb-1">RM${pkg.originalPrice}</span>
            </div>
        `;
    } else {
        priceHtml = `<div class="text-3xl font-black text-slate-900 mb-2 leading-none">RM${pkg.price}</div>`;
    }

    let featuresHtml = '<ul class="space-y-2 mt-4 pt-4 border-t border-dashed border-gray-100">';
    if(pkg.features) {
        pkg.features.forEach(f => {
            featuresHtml += `<li class="text-xs font-bold text-gray-600 flex items-start gap-2"><i class="fas fa-check text-green-500 mt-0.5"></i> ${f}</li>`;
        });
    }
    featuresHtml += '</ul>';

    div.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <h4 class="text-sm font-black uppercase tracking-widest text-amber-600 mb-1">${pkg.name.split(' (')[0]}</h4>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${pkg.desc}</p>
            </div>
        </div>
        <div class="mt-4">
            ${priceHtml}
        </div>
        ${featuresHtml}
        <div class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition">
            <i class="fas fa-arrow-right text-sm"></i>
        </div>
    `;
    return div;
}

function closePackageModal() {
    const pModal = document.getElementById('package-modal');
    if(pModal) pModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function backToThemeModal() {
    closePackageModal();
    if(currentThemeKey) openThemeDetails(currentThemeKey);
}

// PILIH PAKEJ DAN BUKA TNC
function selectPackageAndShowTNC(pkgKey) {
    tempSelectedPkgKey = pkgKey;
    closePackageModal();
    const tnc = document.getElementById('tnc-modal');
    if(tnc) tnc.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeTncModal() {
    const tnc = document.getElementById('tnc-modal');
    if(tnc) tnc.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// SETUJU TNC -> BUKA WIZARD BOOKING
function agreeAndProceed() {
    const theme = rayaThemesDetail[currentThemeKey];
    
    // TAMBAH SEMAKAN INI:
    if (theme.soldOut) {
        alert("Maaf, slot untuk tema ini sudah penuh.");
        return; 
    }
    const tnc = document.getElementById('tnc-modal');
    if(tnc) tnc.classList.add('hidden');
    
    // Safety check: Panggil wizard di booking.js
    if (typeof openBookingWizard === 'function') {
        openBookingWizard(currentThemeKey, tempSelectedPkgKey);
    } else {
        console.error("Fungsi openBookingWizard tidak dijumpai. Sila pastikan booking.js telah dimuatkan.");
    }
}

/* --- FULLSCREEN THEME LIGHTBOX (FIXED) --- */

let lightboxSwiper = null; 

function openThemeLightbox(index) {
    const data = rayaThemesDetail[currentThemeKey]; 
    if (!data) return;

    const modal = document.getElementById('gallery-lightbox');
    const container = document.getElementById('lightbox-slides-container');
    if(!modal || !container) return;

    // 1. Tunjuk modal dulu supaya Swiper dapat baca saiz skrin
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); }, 10);

    // 2. Masukkan gambar
    container.innerHTML = "";
    data.images.forEach(imgUrl => {
        const slide = document.createElement('div');
        slide.className = "swiper-slide flex items-center justify-center bg-black";
        slide.innerHTML = `<img src="${imgUrl}" class="max-w-full max-h-full object-contain select-none">`;
        container.appendChild(slide);
    });

    // 3. Init Swiper dengan selamat
    try {
        if (lightboxSwiper) { 
            lightboxSwiper.destroy(true, true); 
            lightboxSwiper = null; 
        }

        lightboxSwiper = new Swiper(".fullSwiper", {
            initialSlide: index, 
            spaceBetween: 30,
            effect: "slide",     
            observer: true,        // FIX: Pastikan Swiper update bila modal dibuka
            observeParents: true,  // FIX: Monitor perubahan pada parent (modal)
            navigation: { 
                nextEl: ".swiper-button-next", 
                prevEl: ".swiper-button-prev" 
            },
            pagination: { 
                el: ".swiper-pagination", 
                type: "fraction" 
            },
            keyboard: { enabled: true }
            // FIX: Buang 'zoom: true' untuk elakkan error struktur HTML
        });
    } catch (error) {
        console.warn("Swiper Init Note:", error);
    }
}

// --- INIT (JALAN BILA PAGE LOAD) ---
document.addEventListener('DOMContentLoaded', () => {
    // URL Check untuk Galeri
    const urlParams = new URLSearchParams(window.location.search);
    const cat = urlParams.get('cat');
    if(cat && typeof showAlbums === 'function') showAlbums(cat);

    // Init Homepage/Raya
    if(typeof initHomepageSlideshow === 'function') initHomepageSlideshow();
    if(typeof filterThemes === 'function') filterThemes('all');
    if (typeof renderTncAndFaq === "function") renderTncAndFaq();
    if (typeof initRayaHero === "function") initRayaHero();
    if (typeof initCategoryFeatures === "function") initCategoryFeatures();
});

function renderTncAndFaq() {
    const tncContainer = document.getElementById('tnc-dynamic-list');
    if (tncContainer && typeof tncList !== 'undefined') {
        tncContainer.innerHTML = "";
        tncList.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = "flex gap-3 text-sm text-gray-700";
            li.innerHTML = `<span class="font-bold text-amber-600 flex-shrink-0">${index + 1}.</span><span><strong class="text-black">${item.title}:</strong> ${item.desc}</span>`;
            tncContainer.appendChild(li);
        });
    }

    const faqContainer = document.getElementById('faq-dynamic-container');
    if (faqContainer && typeof faqList !== 'undefined') {
        faqContainer.innerHTML = "";
        faqList.forEach(grp => {
            let qaHTML = "";
            grp.content.forEach(qa => { qaHTML += `<div class="mb-3 last:mb-0"><p class="font-bold text-gray-800 text-xs mb-1">Q: ${qa.q}</p><p class="text-gray-500 text-xs">A: ${qa.a}</p></div>`; });
            const details = document.createElement('details');
            details.className = "group bg-white rounded-lg shadow-sm border border-gray-200";
            details.innerHTML = `<summary class="flex justify-between items-center font-bold cursor-pointer p-4 list-none text-gray-800 group-hover:text-amber-600 transition select-none"><span>${grp.category}</span><span class="transition group-open:rotate-180"><i class="fas fa-chevron-down"></i></span></summary><div class="px-4 pb-4 animate-fadeIn border-t border-gray-50 pt-2">${qaHTML}</div>`;
            faqContainer.appendChild(details);
        });
    }
}