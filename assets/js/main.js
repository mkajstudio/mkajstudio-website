/* --- FUNGSI PENTING: GENERATE GAMBAR (AUTO ADD) --- */
// Fungsi ini menentukan sama ada nak guna gambar Online atau Local .webp
function getImagePath(folder, number) {
    if (folder === 'demo') {
        // MODE ONLINE: Guna Picsum random image
        // Kita guna nombor untuk pastikan gambar konsisten (random seed)
        return `https://picsum.photos/800/1200?random=${number + 100}`;
    } else {
        // MODE SEBENAR: Cari gambar dalam folder
        // Contoh: assets/images/wedding/abu-siti/1.webp
        return `${folder}${number}.webp`;
    }
}

/* --- GLOBAL UI FUNCTIONS --- */
function toggleMenu() { document.getElementById('mobile-menu').classList.toggle('active'); }

// Navbar Scroll Effect
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

/* --- MODALS --- */
function showAbout() {
     document.getElementById('mobile-menu').classList.remove('active');
      const about = document.getElementById('about');
       about.classList.remove('hidden');
        setTimeout(() => about.scrollIntoView({ behavior: 'smooth' }), 50); }
function hideAbout() { document.getElementById('about').classList.add('hidden'); }
/* --- MODAL FUNCTIONS --- */

function openBookingModal() {
    // 1. Tutup menu mobile kalau dia tengah buka
    const menu = document.getElementById('mobile-menu');
    if(menu) menu.classList.remove('active');
    
    // 2. Tunjuk Modal
    const modal = document.getElementById('booking-modal');
    if(modal) {
        modal.classList.remove('hidden'); // Buang class 'hidden'
        
        // (Optional) Tambah animasi sikit biar smooth
        modal.classList.add('fade-in'); 
    }
}

function closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    if(modal) {
        modal.classList.add('hidden'); // Tambah balik class 'hidden'
    }
}

// (Optional) Tutup modal bila user klik kawasan gelap (background)
window.onclick = function(event) {
    const modal = document.getElementById('booking-modal');
    if (event.target == modal) {
        closeBookingModal();
    }
}
function closeBookingModal() { document.getElementById('booking-modal').classList.add('hidden'); }

/* --- HOMEPAGE SLIDESHOW (HEADER) --- */
function initHomepageSlideshow() {
    if(typeof slideshowData === 'undefined') return;
    let slideIndices = { 'img-wedding': 0, 'img-studio': 0, 'img-raya': 0, 'img-event': 0, 'img-convo': 0 };
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

document.addEventListener('DOMContentLoaded', () => {
    initHomepageSlideshow();
    const urlParams = new URLSearchParams(window.location.search);
    const cat = urlParams.get('cat');
    if(cat && typeof showAlbums === 'function') showAlbums(cat);
});

/* --- GALLERY SYSTEM (AUTO ADD + SLIDESHOW COVER) --- */
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
    if(viewId !== 'view-albums' && albumGridInterval) { clearInterval(albumGridInterval); albumGridInterval = null; } // Stop slideshow cover bila bukan kat menu album
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

/* --- LOGIC ALBUM LIST (DENGAN SLIDESHOW COVER) --- */
function showAlbums(category) {
    currentViewLevel = 2; activeCategory = category;
    const titleEl = document.getElementById('category-title');
    if(titleEl) titleEl.innerText = category + " Collections";
    const grid = document.getElementById('albums-grid');
    if(!grid) return; grid.innerHTML = ''; 
    
    const albums = galleryData[category];
    if(albums) {
        albums.forEach(album => {
            // Gunakan fungsi getImagePath untuk dapatkan gambar pertama (1.webp atau random)
            const coverSrc = getImagePath(album.folder, 1);
            
            const html = `
                <div onclick="showPhotos(${album.id})" class="group cursor-pointer">
                    <div class="relative overflow-hidden rounded-lg shadow-sm bg-gray-200 h-[250px] mb-4">
                        <!-- Data attributes ini penting untuk slideshow tahu info album -->
                        <img src="${coverSrc}" 
                             class="album-cover-img w-full h-full object-cover transition duration-700 group-hover:scale-105" 
                             data-folder="${album.folder}"
                             data-total="${album.total}"
                             data-current="1"> <!-- Bermula dengan gambar 1 -->
                        
                        <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                            <span class="bg-white text-black px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition">Open</span>
                        </div>
                    </div>
                    <h3 class="font-serif text-2xl group-hover:text-amber-600 transition">${album.title}</h3>
                    <p class="text-xs text-gray-400 uppercase tracking-widest mt-1">${album.location} • ${album.total} Photos</p>
                </div>`;
            grid.innerHTML += html;
        });
        startAlbumGridSlideshow(); // Start slideshow automatik
    }
    switchView('view-albums'); updateBreadcrumb(2);
}

// Fungsi Slideshow Cover Album (Tukar gambar 1 -> 2 -> 3 ... loop)
function startAlbumGridSlideshow() {
    if (albumGridInterval) clearInterval(albumGridInterval);
    albumGridInterval = setInterval(() => {
        const covers = document.querySelectorAll('.album-cover-img');
        covers.forEach(img => {
            const folder = img.getAttribute('data-folder');
            const total = parseInt(img.getAttribute('data-total'));
            let current = parseInt(img.getAttribute('data-current'));
            
            // Kira nombor seterusnya
            let next = current + 1;
            if (next > total) next = 1; // Kalau dah habis, balik ke 1
            if (folder === 'demo' && next > 5) next = 1; // Limit demo images supaya tak loading lama

            // Dapatkan URL baru
            const newSrc = getImagePath(folder, next);
            
            // Effect tukar gambar
            img.style.opacity = 0.8;
            setTimeout(() => {
                img.src = newSrc;
                img.setAttribute('data-current', next);
                img.onload = () => { img.style.opacity = 1; };
            }, 200);
        });
    }, 3000); // Tukar setiap 3 saat
}

/* --- LOGIC PHOTOS (AUTO ADD) --- */
function showPhotos(albumId) {
    currentViewLevel = 3;
    const album = galleryData[activeCategory].find(a => a.id === albumId);
    
    document.getElementById('album-title').innerText = album.title;
    document.getElementById('album-location').innerText = album.location;
    const grid = document.getElementById('photos-grid'); grid.innerHTML = ''; currentAlbumPhotos = [];
    
    // LOOP: Buat URL untuk setiap gambar dari 1 sampai Total
    for(let i = 1; i <= album.total; i++) {
        const src = getImagePath(album.folder, i); // Guna fungsi pintar tadi
        currentAlbumPhotos.push(src);
        
        const html = `
            <div onclick="openLightbox(${i - 1})" class="cursor-pointer group overflow-hidden rounded bg-gray-200 h-[200px] md:h-[300px]">
                <img src="${src}" loading="lazy" class="w-full h-full object-cover transition duration-500 group-hover:scale-110">
            </div>`;
        grid.innerHTML += html;
    }
    switchView('view-photos'); updateBreadcrumb(3, album.title);
}

/* --- LIGHTBOX --- */
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

/* --- CATEGORY SLIDESHOW & DESCRIPTION LOGIC --- */

function initCategoryFeatures() {
    // Kalau database categoryMeta tak wujud (error handling)
    if (typeof categoryMeta === 'undefined') return;

    // 1. Masukkan Ayat Puitis & Initial Gambar
    for (const [key, info] of Object.entries(categoryMeta)) {
        // Cari tempat letak description: cat-desc-wedding, cat-desc-studio, etc.
        const descEl = document.getElementById(`cat-desc-${key}`);
        const imgEl = document.getElementById(`cat-img-${key}`);

        if (descEl) {
            descEl.innerText = `"${info.description}"`;
        }
        if (imgEl && info.images.length > 0) {
            // Set gambar pertama
            imgEl.src = info.images[0];
        }
    }

    // 2. Mulakan Slideshow (Tukar gambar setiap 4 saat)
    // Kita guna variable global supaya tak clash
    if (window.catSlideshowInterval) clearInterval(window.catSlideshowInterval);

    // Tracker untuk tahu gambar nombor berapa sekarang
    let catIndices = { wedding: 0, studio: 0, raya: 0, event: 0, convo: 0 };

    window.catSlideshowInterval = setInterval(() => {
        for (const [key, info] of Object.entries(categoryMeta)) {
            const imgEl = document.getElementById(`cat-img-${key}`);
            
            // Kalau element gambar tu wujud di page sekarang & ada lebih dari 1 gambar
            if (imgEl && info.images.length > 1) {
                
                // Fade Out
                imgEl.style.opacity = 0;

                setTimeout(() => {
                    // Kira next index
                    catIndices[key] = (catIndices[key] + 1) % info.images.length;
                    
                    // Tukar Src
                    imgEl.src = info.images[catIndices[key]];
                    
                    // Fade In bila dah load
                    imgEl.onload = () => { imgEl.style.opacity = 1; };
                    // Handle error (kalau gambar tak jumpa)
                    imgEl.onerror = () => { imgEl.style.opacity = 1; }; 
                }, 500); // Tunggu transition CSS (0.5s)
            }
        }
    }, 4000); // Tukar setiap 4 saat
}

// PENTING: Panggil function ni bila page dah load
document.addEventListener('DOMContentLoaded', () => {
    // ... function lain yang sedia ada ...
    initCategoryFeatures(); 
    // ...
});

/* --- RAYA HERO SLIDESHOW LOGIC --- */

/* =========================================
   ASSETS/JS/MAIN.JS (Bahagian Hero Raya)
   ========================================= */

// 1. VARIABLE GLOBAL (Penting letak atas)
let currentRayaIndex = 0;
let rayaInterval = null;

// 2. FUNGSI UTAMA: INIT (SETUP GAMBAR & HTML)
function initRayaHero() {
    const container = document.getElementById('raya-hero-slides');
    const indicatorContainer = document.getElementById('raya-indicators');
    
    // Safety check: Kalau element tak wujud, stop.
    if (!container) return; 
    if (typeof rayaHeroImages === 'undefined' || rayaHeroImages.length === 0) return;

    // Bersihkan container (tapi simpan overlay gelap asal)
    container.innerHTML = '<div class="absolute inset-0 bg-black/40 z-20 pointer-events-none"></div>'; 
    if(indicatorContainer) indicatorContainer.innerHTML = '';

    // Loop data gambar
    rayaHeroImages.forEach((src, index) => {
        // --- Setup Wrapper ---
        const slideDiv = document.createElement('div');
        // Gambar pertama je Opacity 1, lain 0
        slideDiv.className = `absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === 0 ? 'opacity-100' : 'opacity-0'}`;
        slideDiv.id = `raya-slide-${index}`;

        // --- Layer Belakang (Blur) ---
        const bgImg = document.createElement('img');
        bgImg.src = src;
        bgImg.className = 'absolute inset-0 w-full h-full object-cover blur-xl scale-110 brightness-50 z-0';
        
        // --- Layer Depan (Jelas) ---
        const mainImg = document.createElement('img');
        mainImg.src = src;
        // Guna object-contain supaya gambar tak kembang/pecah
        mainImg.className = 'absolute inset-0 w-full h-full object-contain object-center z-10 drop-shadow-2xl';

        slideDiv.appendChild(bgImg);
        slideDiv.appendChild(mainImg);
        container.appendChild(slideDiv);

        // --- Setup Titik Indicator (Jika HTML ada div 'raya-indicators') ---
        if (indicatorContainer) {
            const dot = document.createElement('div');
            dot.className = `w-2 h-2 rounded-full cursor-pointer transition-all z-30 ${index === 0 ? 'bg-white w-8' : 'bg-white/50'}`;
            dot.onclick = () => manualRayaSlide(index);
            dot.id = `raya-dot-${index}`;
            indicatorContainer.appendChild(dot);
        }
    });

    // Mula pusing automatik
    startRayaAutoplay();
}

// 3. FUNGSI UPDATE UI (TUKAR KELAS OPACITY)
function updateRayaHeroUI() {
    rayaHeroImages.forEach((_, index) => {
        // Cari slide dan dot
        const slideDiv = document.getElementById(`raya-slide-${index}`);
        const dot = document.getElementById(`raya-dot-${index}`);
        
        // Kalau Index SAMA dengan Current -> Tunjuk (Active)
        // Kalau Index LAIN -> Sorok (Inactive)
        
        if (index === currentRayaIndex) {
            if(slideDiv) {
                slideDiv.classList.remove('opacity-0');
                slideDiv.classList.add('opacity-100');
            }
            if(dot) {
                dot.classList.remove('bg-white/50', 'w-2');
                dot.classList.add('bg-white', 'w-8'); // Panjangkan titik active
            }
        } else {
            if(slideDiv) {
                slideDiv.classList.remove('opacity-100');
                slideDiv.classList.add('opacity-0');
            }
            if(dot) {
                dot.classList.remove('bg-white', 'w-8');
                dot.classList.add('bg-white/50', 'w-2');
            }
        }
    });
}

// 4. FUNGSI BUTTON & NAVIGASI (CODE AWAK DI SINI)

function nextRayaSlide() {
    currentRayaIndex = (currentRayaIndex + 1) % rayaHeroImages.length;
    updateRayaHeroUI();
    resetRayaTimer();
}

function prevRayaSlide() {
    // Logic matematik untuk pusing balik dari 0 ke akhir
    currentRayaIndex = (currentRayaIndex - 1 + rayaHeroImages.length) % rayaHeroImages.length;
    updateRayaHeroUI();
    resetRayaTimer();
}

function manualRayaSlide(index) {
    currentRayaIndex = index;
    updateRayaHeroUI();
    resetRayaTimer();
}

function startRayaAutoplay() {
    if (rayaInterval) clearInterval(rayaInterval);
    rayaInterval = setInterval(nextRayaSlide, 5000); // 5000ms = 5 saat
}

function resetRayaTimer() {
    clearInterval(rayaInterval);
    startRayaAutoplay();
}

// 5. PANGGIL INITIALIZER
document.addEventListener('DOMContentLoaded', () => {
    // Function Hero
    initRayaHero(); 
    
    // Function Swiper Tema & lain-lain di bawah...
});

/* assets/js/main.js */

// ... (Kekalkan kod Homepage Slideshow asal di atas) ...
// ... (Kekalkan initRayaHero function background asal di atas) ...

/* --- 1. RAYA SWIPER INIT --- */
document.addEventListener('DOMContentLoaded', () => {
    // Kalau wujud elemen Swiper dalam page, baru init
    if(document.querySelector('.themeSwiper')) {
        new Swiper(".themeSwiper", {
            effect: "cards",
            grabCursor: true,
            initialSlide: 1, // Start slide ke-2 (tengah sikit)
            autoplay: {
                delay: 2500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true // Stop bila hover
            },
            cardsEffect: {
                perSlideOffset: 12, // Jarak kad
                perSlideRotate: 2, 
                slideShadows: true,
            },
        });
    }
});


/* --- 2. THEME DETAIL POPUP LOGIC --- */

/* assets/js/main.js - GANTI FUNCTION INI */

let modalSwiperInstance = null;
let currentlyViewingTheme = ""; 

function openThemeDetails(key) {
    if (typeof rayaThemesDetail === 'undefined' || !rayaThemesDetail[key]) return;
    const data = rayaThemesDetail[key];

    currentThemeKey = key; 
    currentlyViewingTheme = data.title;

    // 1. UPDATE TEKS & BADGE KATEGORI
    const tagEl = document.getElementById('th-modal-tag');
    const titleEl = document.getElementById('th-modal-title');
    const descEl = document.getElementById('th-modal-desc');
    const inclusionList = document.getElementById('th-modal-inclusions');
    const priceTag = document.getElementById('th-modal-price-tag');
    const paxInfo = document.getElementById('th-modal-pax-info');
    const catBadge = document.getElementById('th-cat-badge');

    if(tagEl) tagEl.innerText = data.tagline;
    if(titleEl) titleEl.innerText = data.title;
    if(descEl) descEl.innerText = data.desc;
    if(priceTag) priceTag.innerText = `RM ${data.price}`;

    if (inclusionList && data.inclusions) {
        inclusionList.innerHTML = ""; 
        const checkColor = data.type === 'couple' ? 'text-pink-500' : 'text-green-500';

        data.inclusions.forEach(item => {
            const li = document.createElement('li');
            // Guna text-xs (lebih kecil) dan gap-2 supaya jimat ruang skrin
            li.className = "flex items-start gap-2 text-xs text-gray-700 font-medium leading-tight";
            
            // Icon check kecil sikit
            li.innerHTML = `<i class="fas fa-check-circle ${checkColor} mt-0.5"></i> <span>${item}</span>`;
            
            inclusionList.appendChild(li);
        });
    }
    
    // Pax & Kategori UI
    if(catBadge) {
        catBadge.innerText = data.categoryName || "FAMILY (6 PAX)";
        catBadge.className = `inline-block px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase mb-4 w-max border ${data.colorClass || 'text-green-600 bg-green-50 border-green-200'}`;
    }
    if (paxInfo) {
        paxInfo.innerText = data.type === 'couple' ? "Max 2 Dewasa + 2 Kids" : `Cover ${data.paxCover} Dewasa`;
    }

    // 2. SETUP SLIDESHOW GAMBAR (SWIPER) - BAHAGIAN KRITIKAL FIX
    const slidesContainer = document.getElementById('th-modal-slides-container');
    const navNext = document.querySelector('.swiper-button-next');
    const navPrev = document.querySelector('.swiper-button-prev');
    const pagination = document.querySelector('.swiper-pagination');

    // Mula-mula, BUKA DULU MODAL (Remove Hidden) supaya Swiper boleh kira saiz gambar
    // Ini trick penting! Kita buka tapi mungkin user tak perasan sekelip mata.
    document.getElementById('theme-detail-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    if (slidesContainer && data.images.length > 0) {
        
        // Hancurkan Swiper lama kalau ada (untuk clearkan memori)
        if (modalSwiperInstance) {
            modalSwiperInstance.destroy(true, true);
            modalSwiperInstance = null;
        }

        // KOSONGKAN dan ISI BARU html slider
        slidesContainer.innerHTML = "";
        data.images.forEach(imgUrl => {
            const slide = document.createElement('div');
            slide.className = "swiper-slide w-full h-full flex items-center justify-center bg-gray-200"; // tambah bg-gray sikit
            // Guna object-cover supaya penuh
            slide.innerHTML = `<img src="${imgUrl}" class="w-full h-full object-cover block">`; 
            slidesContainer.appendChild(slide);
        });

        // TENTUKAN NAVIGASI
        const banyakGambar = data.images.length > 1;
        if (navNext) navNext.style.display = banyakGambar ? 'flex' : 'none';
        if (navPrev) navPrev.style.display = banyakGambar ? 'flex' : 'none';
        if (pagination) pagination.style.display = banyakGambar ? 'block' : 'none';

        // INIT SWIPER BARU (Dengan Observer fix)
        modalSwiperInstance = new Swiper(".modalSwiper", {
            // FIX PENTING: Dua baris ini "kejutkan" swiper bila modal muncul
            observer: true, 
            observeParents: true,
            
            loop: banyakGambar,
            effect: "fade", // Boleh tukar 'slide' kalau tak suka fade
            speed: 500,
            fadeEffect: { crossFade: true },
            
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
                dynamicBullets: true,
            },
            autoplay: banyakGambar ? {
                delay: 3500,
                disableOnInteraction: true,
            } : false,
            allowTouchMove: banyakGambar
        });
        
        // Extra Safe: Force Update
        setTimeout(() => {
            if(modalSwiperInstance) modalSwiperInstance.update();
        }, 100);
    }
}

function bookCurrentTheme() {
    closeThemeModal();
    const data = rayaThemesDetail[currentThemeKey];
    if (!data) return;

    // Set Label Kategori
    const categoryLabel = data.type === 'couple' ? 'Kategori Couple' : 'Kategori Family';
    
    if (typeof openBookingWizard === 'function') {
        // HANTAR PARAMETER KE-5: data.title
        // openBookingWizard(Label, Harga, Limit, Type, TajukTemaSebenar)
        openBookingWizard(categoryLabel, data.price, data.paxCover, data.type, data.title);
    }
}

function closeThemeModal() {
    document.getElementById('theme-detail-modal').classList.add('hidden');
    document.body.style.overflow = 'auto'; 
}


/* --- 3. BRIDGE TO BOOKING WIZARD --- */
function bookThisTheme(pkgName) {
    // Tutup Modal Tema
    closeThemeModal();

    // Set Data Harga ikut pakej dipilih
    let price = 99; 
    let limit = 4;

    if (pkgName === 'Kenangan') { price = 99; limit = 4; }
    else if (pkgName === 'Lebaran') { price = 139; limit = 6; }
    
    // Buka Booking Wizard (Ada dalam booking.js)
    if (typeof openBookingWizard === 'function') {
        openBookingWizard(pkgName, price, limit);

        // Inject tema yang user tengah tengok ke dalam borang (Step 2)
        setTimeout(() => {
            const themeDropdown = document.getElementById('bk-theme');
            if (themeDropdown && currentlyViewingTheme) {
                themeDropdown.value = currentlyViewingTheme;
                // PENTING: Trigger logic check (couple vs family) untuk update harga pax
                if(typeof checkThemeType === 'function') checkThemeType();
            }
        }, 300); // Tunggu modal buka
    } else {
        alert("System error: Booking module not loaded.");
    }
}