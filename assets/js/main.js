/* assets/js/main.js - STABLE V21 (AUTO LOAD THEMES FIXED) */

/* --- FUNGSI PENTING: GENERATE GAMBAR (AUTO ADD) --- */
function getImagePath(folder, number) {
    if (folder === 'demo') {
        return `https://picsum.photos/800/1200?random=${number + 100}`;
    } else {
        return `${folder}${number}.webp`;
    }
}

/* --- GLOBAL UI FUNCTIONS --- */
function toggleMenu() { document.getElementById('mobile-menu').classList.toggle('active'); }

window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    const navBookBtn = document.getElementById('nav-book-btn');
    const logoText = document.querySelector('.logo-text');
    
    if (!document.body.classList.contains('static-nav')) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled-nav');
            if(navBookBtn) { navBookBtn.classList.replace('border-white/50', 'border-black'); navBookBtn.classList.replace('hover:bg-white', 'hover:bg-black'); navBookBtn.classList.replace('hover:text-black', 'hover:text-white'); }
            if(logoText) logoText.classList.remove('text-white');
        } else {
            navbar.classList.remove('scrolled-nav');
            if(navBookBtn) { navBookBtn.classList.replace('border-black', 'border-white/50'); navBookBtn.classList.replace('hover:bg-black', 'hover:bg-white'); navBookBtn.classList.replace('hover:text-white', 'hover:text-black'); }
            if(logoText) logoText.classList.add('text-white');
        }
    }
});

function openBookingModal() {
    const menu = document.getElementById('mobile-menu');
    if(menu) menu.classList.remove('active');
    const modal = document.getElementById('booking-modal');
    if(modal) {
        modal.classList.remove('hidden'); 
        modal.classList.add('fade-in'); 
    }
}

function closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    if(modal) modal.classList.add('hidden'); 
}

window.onclick = function(event) {
    const modal = document.getElementById('booking-modal');
    if (event.target == modal) closeBookingModal();
}

/* --- HOMEPAGE SLIDESHOW (HEADER) --- */
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
    document.getElementById(viewId).classList.remove('hidden-view'); document.getElementById(viewId).classList.add('active-view');
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
        if(level === 3) { items.forEach(id => document.getElementById(id).classList.remove('hidden')); document.getElementById('bc-album').innerText = text; }
    }
}

function showCategories() { currentViewLevel = 1; switchView('view-categories'); updateBreadcrumb(1); }

function showAlbums(category) {
    currentViewLevel = 2; activeCategory = category;
    const titleEl = document.getElementById('category-title');
    if(titleEl) titleEl.innerText = category + " Collections";
    const grid = document.getElementById('albums-grid');
    if(!grid) return; grid.innerHTML = ''; 
    
    const albums = galleryData[category];
    if(albums) {
        albums.forEach(album => {
            const coverSrc = getImagePath(album.folder, 1);
            const html = `
                <div onclick="showPhotos(${album.id})" class="group cursor-pointer">
                    <div class="relative overflow-hidden rounded-lg shadow-sm bg-gray-200 h-[250px] mb-4">
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
    }
    switchView('view-albums'); updateBreadcrumb(2);
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
    currentViewLevel = 3;
    const album = galleryData[activeCategory].find(a => a.id === albumId);
    
    document.getElementById('album-title').innerText = album.title;
    document.getElementById('album-location').innerText = album.location;
    const grid = document.getElementById('photos-grid'); grid.innerHTML = ''; currentAlbumPhotos = [];
    
    for(let i = 1; i <= album.total; i++) {
        const src = getImagePath(album.folder, i);
        currentAlbumPhotos.push(src);
        const html = `
            <div onclick="openLightbox(${i - 1})" class="cursor-pointer group overflow-hidden rounded bg-gray-200 h-[200px] md:h-[300px]">
                <img src="${src}" loading="lazy" class="w-full h-full object-cover transition duration-500 group-hover:scale-110">
            </div>`;
        grid.innerHTML += html;
    }
    switchView('view-photos'); updateBreadcrumb(3, album.title);
}

function openLightbox(index) { currentLightboxIndex = index; updateLightbox(); document.getElementById('lightbox').classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeLightbox() { document.getElementById('lightbox').classList.add('hidden'); document.body.style.overflow = 'auto'; }
function updateLightbox() { document.getElementById('lightbox-img').src = currentAlbumPhotos[currentLightboxIndex]; document.getElementById('lb-current').innerText = currentLightboxIndex + 1; document.getElementById('lb-total').innerText = currentAlbumPhotos.length; }
function navLightbox(dir) { currentLightboxIndex += dir; if (currentLightboxIndex < 0) currentLightboxIndex = currentAlbumPhotos.length - 1; if (currentLightboxIndex >= currentAlbumPhotos.length) currentLightboxIndex = 0; updateLightbox(); }

const lightboxEl = document.getElementById('lightbox');
if(lightboxEl) {
    let ts = 0, te = 0;
    lightboxEl.addEventListener('touchstart', e => ts = e.changedTouches[0].screenX, {passive: true});
    lightboxEl.addEventListener('touchend', e => { te = e.changedTouches[0].screenX; if(te<ts-50) navLightbox(1); if(te>ts+50) navLightbox(-1); }, {passive: true});
    document.getElementById('lightbox-close').onclick = closeLightbox;
    document.getElementById('lightbox-prev').onclick = () => navLightbox(-1);
    document.getElementById('lightbox-next').onclick = () => navLightbox(1);
}

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
let currentRayaIndex = 0;
let rayaInterval = null;

function initRayaHero() {
    const container = document.getElementById('raya-hero-slides');
    const indicatorContainer = document.getElementById('raya-indicators');
    if (!container) return; 
    if (typeof rayaHeroImages === 'undefined' || rayaHeroImages.length === 0) return;
    container.innerHTML = '<div class="absolute inset-0 bg-black/40 z-20 pointer-events-none"></div>'; 
    if(indicatorContainer) indicatorContainer.innerHTML = '';
    rayaHeroImages.forEach((src, index) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = `absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === 0 ? 'opacity-100' : 'opacity-0'}`;
        slideDiv.id = `raya-slide-${index}`;
        const bgImg = document.createElement('img');
        bgImg.src = src;
        bgImg.className = 'absolute inset-0 w-full h-full object-cover blur-xl scale-110 brightness-50 z-0';
        const mainImg = document.createElement('img');
        mainImg.src = src;
        mainImg.className = 'absolute inset-0 w-full h-full object-contain object-center z-10 drop-shadow-2xl';
        slideDiv.appendChild(bgImg);
        slideDiv.appendChild(mainImg);
        container.appendChild(slideDiv);
        if (indicatorContainer) {
            const dot = document.createElement('div');
            dot.className = `w-2 h-2 rounded-full cursor-pointer transition-all z-30 ${index === 0 ? 'bg-white w-8' : 'bg-white/50'}`;
            dot.onclick = () => manualRayaSlide(index);
            dot.id = `raya-dot-${index}`;
            indicatorContainer.appendChild(dot);
        }
    });
    startRayaAutoplay();
}

function updateRayaHeroUI() {
    rayaHeroImages.forEach((_, index) => {
        const slideDiv = document.getElementById(`raya-slide-${index}`);
        const dot = document.getElementById(`raya-dot-${index}`);
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
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.className = "filter-btn bg-white text-gray-500 border border-gray-200 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:border-gray-400 transition cursor-pointer";
    });
    const activeBtn = document.getElementById(`filter-${type}`);
    if(activeBtn) {
        if(type === 'family') activeBtn.className = "filter-btn bg-green-50 text-green-700 border border-green-600 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-md transition transform scale-105";
        else if(type === 'couple') activeBtn.className = "filter-btn bg-pink-50 text-pink-600 border border-pink-500 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-md transition transform scale-105";
        else activeBtn.className = "filter-btn bg-black text-white border border-black px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-md transition transform scale-105"; 
    }
    gridContainer.innerHTML = ''; 
    gridContainer.style.opacity = 0;
    for (const [key, val] of Object.entries(rayaThemesDetail)) {
        if (type !== 'all' && val.type !== type) continue;
        const badgeColorClass = val.type === 'couple' ? 'bg-white/90 text-pink-600 border-pink-200' : 'bg-white/90 text-green-700 border-green-200';
        const labelText = val.type === 'couple' ? 'Couple' : 'Family';
        const posterImage = val.thumbnail ? val.thumbnail : val.images[0];
        const cardHTML = `
            <div onclick="openThemeDetails('${key}')" class="group relative rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition duration-500 bg-gray-100 aspect-[3/4]">
                <img src="${posterImage}" loading="lazy" class="w-full h-full object-cover transition duration-700 group-hover:scale-110">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80"></div>
                <div class="absolute top-3 left-3">
                    <span class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${badgeColorClass} shadow-sm">${labelText}</span>
                </div>
                <div class="absolute bottom-0 left-0 w-full p-4 md:p-6 text-left">
                    <h3 class="text-white font-serif text-xl md:text-2xl italic leading-tight mb-1 group-hover:text-amber-400 transition">${val.title}</h3>
                    <p class="text-gray-300 text-xs md:text-sm line-clamp-1 mb-2 font-light">${val.tagline}</p>
                    <div class="flex items-center gap-2 mt-2">
                        <span class="text-white font-bold text-sm bg-white/20 px-3 py-1 rounded backdrop-blur-sm border border-white/10">${val.displayPrice}</span>
                        <span class="text-xs text-white/70">/ Sesi</span>
                    </div>
                </div>
                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition duration-300 hidden md:block">
                    <div class="bg-white/20 backdrop-blur-md rounded-full p-3 border border-white/30 text-white"><i class="fas fa-arrow-right text-xl"></i></div>
                </div>
            </div>`;
        gridContainer.innerHTML += cardHTML;
    }
    setTimeout(() => { gridContainer.style.opacity = 1; }, 50);
}

/* --- THEME DETAIL POPUP LOGIC --- */
let modalSwiperInstance = null;
let currentThemeKey = ""; 

function openThemeDetails(key) {
    if (typeof rayaThemesDetail === 'undefined' || !rayaThemesDetail[key]) return;
    const data = rayaThemesDetail[key];
    currentThemeKey = key; 

    const titleEl = document.getElementById('th-modal-title');
    const descEl = document.getElementById('th-modal-desc');
    const catBadge = document.getElementById('th-cat-badge');

    if(titleEl) titleEl.innerText = data.title;
    if(descEl) descEl.innerText = data.desc;

    const familyTierUI = document.getElementById('modal-tier-family');
    const coupleTierUI = document.getElementById('modal-tier-couple');

    if (data.type === 'family') {
        if(familyTierUI) familyTierUI.classList.remove('hidden');
        if(coupleTierUI) coupleTierUI.classList.add('hidden');
    } else {
        if(familyTierUI) familyTierUI.classList.add('hidden');
        if(coupleTierUI) coupleTierUI.classList.remove('hidden');
    }

    const inclusionList = document.getElementById('th-modal-inclusions');
    if (inclusionList && data.inclusions) {
        inclusionList.innerHTML = ""; 
        const checkColor = data.type === 'couple' ? 'text-pink-500' : 'text-green-500';
        data.inclusions.forEach(item => {
            const li = document.createElement('li');
            li.className = "flex items-start gap-2 text-xs text-gray-700 font-medium";
            li.innerHTML = `<i class="fas fa-check-circle ${checkColor} mt-0.5"></i> <span>${item}</span>`;
            inclusionList.appendChild(li);
        });
    }
    
    if(catBadge) {
        catBadge.innerText = data.categoryName;
        catBadge.className = `inline-block px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase mb-4 border ${data.colorClass}`;
    }

    const slidesContainer = document.getElementById('th-modal-slides-container');
    document.getElementById('theme-detail-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    if (slidesContainer && data.images.length > 0) {
        if (modalSwiperInstance) { modalSwiperInstance.destroy(true, true); modalSwiperInstance = null; }
        slidesContainer.innerHTML = "";
        /* Dalam openThemeDetails, cari bahagian loop images */

        data.images.forEach((imgUrl, index) => { // Tambah parameter 'index'
            const slide = document.createElement('div');
            slide.className = "swiper-slide w-full h-full flex items-center justify-center bg-black"; 
    
            // UPDATE ONCLICK:
            // Bila klik, panggil openLightbox(index)
            // Index penting supaya kalau klik gambar no.3, lightbox buka terus gambar no.3
            slide.innerHTML = `
                <img src="${imgUrl}" 
                    class="w-full h-full object-contain cursor-pointer hover:opacity-90 transition" 
                    onclick="openLightbox(${index})">
            `; 
    
            slidesContainer.appendChild(slide);
        });
        modalSwiperInstance = new Swiper(".modalSwiper", {
            observer: true, observeParents: true,
            loop: data.images.length > 1, effect: "fade", speed: 500,
            navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
            pagination: { el: ".swiper-pagination", clickable: true }, autoplay: { delay: 3500 }
        });
    }
}

function closeThemeModal() {
    document.getElementById('theme-detail-modal').classList.add('hidden');
    document.body.style.overflow = 'auto'; 
}

/* --- TNC LOGIC --- */
function bookCurrentTheme() {
    closeThemeModal(); 
    const data = rayaThemesDetail[currentThemeKey];
    if (!data) return;
    document.getElementById('tnc-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeTncModal() {
    document.getElementById('tnc-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// FIX: Parameter Mismatch Fix here
function bookThisTheme(pkgName) {
    closeThemeModal();
    let price = 99; 
    let limit = 4;
    if (pkgName === 'Kenangan') { price = 99; limit = 4; }
    else if (pkgName === 'Lebaran') { price = 139; limit = 6; }
    
    // Pass null/empty string to satisfy 5 arguments in booking.js
    if (typeof openBookingWizard === 'function') {
        openBookingWizard(pkgName, price, limit, null, null);

        setTimeout(() => {
            const themeDropdown = document.getElementById('bk-theme');
            if (themeDropdown && currentlyViewingTheme) {
                themeDropdown.value = currentlyViewingTheme;
                if(typeof checkThemeType === 'function') checkThemeType();
            }
        }, 300); 
    } else {
        alert("System error: Booking module not loaded.");
    }
}

// ----------------------------------------------------
// INITIALIZERS (FIXED: AUTO-LOAD THEMES ADDED HERE)
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // 1. Init Homepage Slideshow (Kalau di homepage)
    initHomepageSlideshow();

    // 2. Init Gallery Params
    const urlParams = new URLSearchParams(window.location.search);
    const cat = urlParams.get('cat');
    if(cat && typeof showAlbums === 'function') showAlbums(cat);

    // 3. Init Raya Page Components
    renderTncAndFaq();
    initRayaHero();
    initCategoryFeatures();
    
    // FIX: INI BARIS YANG HILANG SEBELUM NI
    // Panggil filterThemes('all') supaya grid tema keluar automatik
    if (typeof filterThemes === 'function') {
        filterThemes('all');
    }
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

/* --- FULLSCREEN LIGHTBOX LOGIC --- */
let lightboxSwiper = null;

function openLightbox(index) {
    // 1. Dapatkan data tema semasa (global variable dari openThemeDetails)
    const data = rayaThemesDetail[currentThemeKey]; 
    if (!data) return;

    const modal = document.getElementById('gallery-lightbox');
    const container = document.getElementById('lightbox-slides-container');

    // 2. Masukkan gambar ke dalam Lightbox
    container.innerHTML = "";
    data.images.forEach(imgUrl => {
        const slide = document.createElement('div');
        slide.className = "swiper-slide flex items-center justify-center bg-black";
        // 'object-contain' memastikan gambar FIT skrin (tak zoom/pecah/crop)
        slide.innerHTML = `<img src="${imgUrl}" class="max-w-full max-h-full object-contain select-none">`;
        container.appendChild(slide);
    });

    // 3. Buka Modal (Visual effect)
    modal.classList.remove('hidden');
    // Timeout sikit utk effect fade in
    setTimeout(() => { modal.classList.remove('opacity-0'); }, 10);

    // 4. Init Swiper (Gallery Mode)
    if (lightboxSwiper) {
        lightboxSwiper.destroy(true, true);
        lightboxSwiper = null;
    }

    lightboxSwiper = new Swiper(".fullSwiper", {
        initialSlide: index, // Terus lompat ke gambar yang user klik
        spaceBetween: 30,
        effect: "slide",     // Slide biasa lebih smooth untuk gallery
        zoom: true,          // BONUS: User boleh pinch-to-zoom (double tap)
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        pagination: {
            el: ".swiper-pagination",
            type: "fraction", // Tunjuk "1 / 5"
        },
        keyboard: {
            enabled: true,   // Boleh guna arrow key keyboard
        }
    });
}

function closeLightbox() {
    const modal = document.getElementById('gallery-lightbox');
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300); // Tunggu animation habis
}