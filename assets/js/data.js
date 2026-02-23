/* 
   DATABASE GALERI
   --------------------------------------------------
   PENTING:
   1. Kalau anda letak folder: 'demo' -> Website guna gambar random dari internet (Untuk test).
   2. Kalau anda letak folder: 'assets/images/...' -> Website cari fail .webp dalam folder komputer anda.
   
   CARA SETUP FOLDER:
   Pastikan dalam folder tu ada gambar bernama: 1.webp, 2.webp, 3.webp ... ikut jumlah 'total'.
*/

const galleryData = {
    'wedding': [
        {
            id: 1,
            title: "Farahin & Hafifi",
            location: "Seremban",
            // --- TUKAR DI SINI BILA DAH ADA GAMBAR SENDIRI ---
            folder: "assets/images/albums/wedding/farahin-hafifi-seremban/", 
            // folder: "assets/images/wedding/abu-siti/", <--- CONTOH BILA DAH READY (Jangan lupa slash / di hujung)
            total: 71, // Jumlah gambar
        },
        {
            id: 2,
            title: "Syahir & Azwin",
            location: "Glasshall Autocity, Melaka",
            folder: "assets/images/albums/wedding/syahir-azwin-glasshall-autocity-melaka/",
            // folder: "assets/images/wedding/amir-aina/",
            total: 98,
        },
        {
            id: 3,
            title: "Nurul & Firdaus",
            location: "Amnah Hall Senawang",
            folder: "assets/images/albums/wedding/nurul-firdaus-amnah-hall-senawang/",
            // folder: "assets/images/wedding/amir-aina/",
            total: 207,
        },
        {
            id: 4,
            title: "Asyiqin & Anaz",
            location: "Laman Sri Pinang, Port Dickson",
            folder: "assets/images/albums/wedding/asyiqin-anaz-laman-sri-pinang-port-dickson/",
            // folder: "assets/images/wedding/amir-aina/",
            total: 98,
        }
    ],
    'studio': [
        { 
            id: 1, 
            title: "Katalog Tudung", 
            location: "Studio A", 
            folder: "assets/images/albums/studio/katalog-tudung/",
            // folder: "assets/images/studio/editorial/",
            total: 84 
        }
    ],
    'raya': [
        { 
            id: 1, 
            title: "Raya Modern 2025", 
            location: "Studio Raya mkaj", 
            folder: "assets/images/albums/raya/raya-moden/",
            // folder: "assets/images/raya/hj-razak/",
            total: 174 
        },
        { 
            id: 2, 
            title: "Raya Klasik 2025", 
            location: "Studio Raya mkaj", 
            folder: "assets/images/albums/raya/raya-klasik/",
            // folder: "assets/images/raya/hj-razak/",
            total: 103 
        }
    ],
    'event': [
        { 
            id: 1, 
            title: "AURA MARA negeri melaka 2025", 
            location: "Hotel Holiday Inn Melaka", 
            folder: "assets/images/albums/event/aura-mara/",
            // folder: "assets/images/event/petronas/",
            total: 31 
        }
    ],
    'convo': [
        { 
            id: 1, 
            title: "Post-Convo Aminah", 
            location: "Muar", 
            folder: "assets/images/albums/convo/post-convo-aminah-muar/",
            // folder: "assets/images/convo/session/",
            total: 53 
        },
        { 
            id: 2, 
            title: "Pre-Convo", 
            location: "Eco Grandeur", 
            folder: "assets/images/albums/convo/pre-convo-eco-grandeur/",
            // folder: "assets/images/convo/session/",
            total: 44 
        }
    ],
    'engagement': [
        { 
            id: 1, 
            title: "Farah & Hakim", 
            location: "Kuala Linggi, Melaka", 
            folder: "assets/images/albums/engagement/farah-hakim-kuala-linggi-melaka/",
            // folder: "assets/images/engagement/session/",
            total: 145 
        }
    ]
};

/* 
   INFO KATEGORI (Ayat Puitis & Gambar Slideshow Utama)
   
   Panduan:
   1. description: Ayat puitis yang akan keluar di bawah tajuk.
   2. images: Senarai URL gambar (.webp) yang akan bertukar-tukar untuk kategori ni.
      - Ambil gambar dari folder album yang dah buat tadi.
*/

const categoryMeta = {
    'wedding': {
        title: "Wedding",
        description: "Dua jiwa, satu takdir. Mengabadikan detik cinta yang abadi.",
        images: [
            "assets/images/albums/wedding/farahin-hafifi-seremban/1.webp",
            "assets/images/albums/wedding/syahir-azwin-glasshall-autocity-melaka/1.webp",
            "assets/images/albums/wedding/nurul-firdaus-amnah-hall-senawang/1.webp",
            "assets/images/albums/wedding/asyiqin-anaz-laman-sri-pinang-port-dickson/1.webp",
            "assets/images/albums/wedding/farahin-hafifi-seremban/2.webp",
            "assets/images/albums/wedding/syahir-azwin-glasshall-autocity-melaka/2.webp",
            "assets/images/albums/wedding/nurul-firdaus-amnah-hall-senawang/2.webp",
            "assets/images/albums/wedding/asyiqin-anaz-laman-sri-pinang-port-dickson/2.webp"
        ]
    },
    'studio': {
        title: "Katalog Tudung",
        description: "Gaya elegan, pesona abadi. Setiap potret bercerita.",
        images: [
            "assets/images/albums/studio/katalog-tudung/1.webp",
            "assets/images/albums/studio/katalog-tudung/5.webp",
            "assets/images/albums/studio/katalog-tudung/3.webp",
            "assets/images/albums/studio/katalog-tudung/7.webp"
        ]
    },
    'raya': {
        title: "Raya",
        description: "Ikatan kasih di pagi Syawal. Memori indah setahun sekali.",
        images: [
            "assets/images/albums/raya/raya-moden/1.webp",
            "assets/images/albums/raya/raya-klasik/1.webp",
            "assets/images/albums/raya/raya-moden/3.webp",
            "assets/images/albums/raya/raya-klasik/3.webp",
            "assets/images/albums/raya/raya-moden/2.webp",
            "assets/images/albums/raya/raya-klasik/2.webp"
        ]
    },
    'event': {
        title: "Event",
        description: "Sorakan, emosi, dan kemeriahan. Disimpan dalam setiap bingkai.",
        images: [
            "assets/images/albums/event/aura-mara/10.webp",
            "assets/images/albums/event/aura-mara/12.webp",
            "assets/images/albums/event/aura-mara/3.webp",
            "assets/images/albums/event/aura-mara/1.webp"

        ]
    },
    'convo': {
        title: "Convo",
        description: "Kebanggaan di hari bersejarah. Merakam senyuman kejayaan.",
        images: [
            "assets/images/albums/convo/post-convo-aminah-muar/1.webp",
            "assets/images/albums/convo/pre-convo-eco-grandeur/1.webp",
            "assets/images/albums/convo/post-convo-aminah-muar/3.webp",
            "assets/images/albums/convo/pre-convo-eco-grandeur/3.webp"
        ]
    },
    'engagement': {
        title: "Engagement",
        description: "Mengabadikan detik cinta yang paling istimewa.",
        images: [
            "assets/images/albums/engagement/farah-hakim-kuala-linggi-melaka/1.webp",
            "assets/images/albums/engagement/farah-hakim-kuala-linggi-melaka/2.webp",
            "assets/images/albums/engagement/farah-hakim-kuala-linggi-melaka/3.webp",
            "assets/images/albums/engagement/farah-hakim-kuala-linggi-melaka/4.webp"
        ]
    }
};

// Slideshow Header (Homepage) - Boleh guna URL online atau local
const slideshowData = {
    'img-wedding': ['https://picsum.photos/id/100/600/800', 'https://picsum.photos/id/101/600/800'],
    'img-studio': ['https://picsum.photos/id/200/600/800', 'https://picsum.photos/id/201/600/800'],
    'img-raya': ['https://picsum.photos/id/300/600/800', 'https://picsum.photos/id/301/600/800'],
    'img-event': ['https://picsum.photos/id/400/600/800', 'https://picsum.photos/id/401/600/800'],
    'img-convo': ['https://picsum.photos/id/500/600/800', 'https://picsum.photos/id/501/600/800'],
    'img-engagement': ['https://picsum.photos/id/600/600/800', 'https://picsum.photos/id/601/600/800']
};

/* 
   RAYA HERO SLIDESHOW
   Senaraikan gambar background untuk page Raya di sini.
   Pastikan gambar saiz besar (Landscape) berkualiti tinggi.
*/
const rayaHeroImages = [
    "assets/images/hero/raya-hero/studio-raya-hero-1.webp",
    "assets/images/hero/raya-hero/studio-raya-sungai-udang.webp",
    "assets/images/hero/raya-hero/studio-raya-hero-2.webp",
    "assets/images/hero/raya-hero/studio-raya-alor-gajah.webp",
    "assets/images/hero/raya-hero/studio-raya-masjid-tanah.webp",
    "assets/images/hero/raya-hero/studio-raya-hero-3.webp",
    "assets/images/hero/raya-hero/studio-raya-kuala-sungai-baru.webp"
    // Boleh tambah lagi: "assets/images/hero/hero-raya-4.webp"
];



/* 
   DATABASE MKAJ STUDIO 2026 (UPDATED V3.0)
   - Centralized Package Definitions
   - Promo System Architecture
*/

// --- 1. KONFIGURASI PAKEJ (Control Center) ---
// Di sini kita set harga, masa, dan peraturan setiap pakej.
const rayaPackages = {
// PAKEJ FAMILY (TEMA LAIN)
    'salam': {
        name: "PAKEJ SALAM",
        price: 89,
        originalPrice: 159,
        time: 15,
        baseAdult: 4,
        maxTotal: 20, // Kapasiti studio
        strict: false, // FALSE = Boleh tambah pax (+RM10)
        desc: "Asas 4 Dewasa",
        features: ["Softcopy Google Drive", "Unlimited Shoot", "Cover 4 Dewasa, Tambah Pax RM10/Head (Dewasa)", "Masa 15 minit setiap sesi"]
    },
    'riang': {
        name: "PAKEJ RIANG",
        price: 119,
        originalPrice: 199,
        time: 20,
        baseAdult: 6,
        maxTotal: 20,
        strict: false,
        discountFrame: 0.10, // Diskaun 10% untuk frame
        desc: "Asas 6 Dewasa + Diskaun Frame 10%",
        features: ["Softcopy Google Drive", "Unlimited Shoot", "Cover 6 Dewasa, Tambah Pax RM10/Head (Dewasa)", "Diskaun Sebanyak 10% Untuk Semua Frame", "Masa 20 minit setiap sesi"]
    },
    'lebaran': {
        name: "PAKEJ LEBARAN",
        price: 300,
        originalPrice: 450,
        time: 30,
        baseAdult: 10,
        maxTotal: 20,
        strict: false,
        discountFrame: 0.10, 
        freeGift: "Royale Portrait 20x24", // Nama frame percuma
        noExtraTime: true, // Disable add-on masa
        desc: "Asas 10 Dewasa + Percuma Frame Besar",
        features: ["Softcopy Google Drive", "Unlimited Shoot", "Cover 10 Dewasa, Tambah Pax RM10/Head (Dewasa)", "Percuma Frame Saiz 20x24 berharga RM200", "Diskaun Sebanyak 10% Untuk Tambahan Frame", "Masa 30 minit setiap sesi (Tidak boleh tambah masa)"]
    },
        // PAKEJ KHAS (TEMA OLD LUXURY)
    'mini': {
        name: "PAKEJ MINI",
        price: 50,
        originalPrice: 79, // Untuk paparan 'Slash Price'
        time: 15,
        baseAdult: 2,
        maxTotal: 4, // Strict limit: 2 Dewasa + 2 Kanak-kanak
        strict: true, // TRUE = Tidak boleh tambah pax lebih dari limit
        desc: "Max 2 Dewasa + 2 Kanak-kanak",
        features: ["Softcopy Google Drive", "Unlimited Shoot", "Cover 2 Dewasa + 2 Kanak-kanak", "Masa 15 minit setiap sesi"]
    }
    
    
};
// --- 2. INFO TEMA RAYA (Mapping ke Pakej) ---
const rayaThemesDetail = {
'velvet': {
        title: "Royale Velvet",
        type: "standard", // Rujuk Pakej 1/2/3
        categoryName: "TEMA FAMILY",
        colorClass: "text-green-600 bg-green-50 border-green-200",
        tagline: "Elegance & Luxury.",
        desc: "Set mewah dengan latar belakang velvet.",
        images: ["assets/images/themes/velvet.webp",
                    "assets/images/themes/velvet-1.webp",
                    "assets/images/themes/velvet-2.webp",
                    "assets/images/themes/velvet-3.webp"
        ],
        inclusions: ["Pilih Pakej Salam, Riang atau Lebaran", "Unlimited Shoot & Pose", "Softcopy Google Drive (48 jam)", "Max 20 Pax (Dewasa + Kanak-kanak)"]
    },
    'white': {
        title: "Whisper White",
        type: "standard",
        categoryName: "TEMA FAMILY",
        colorClass: "text-green-600 bg-green-50 border-green-200",
        tagline: "Pure & Timeless.",
        desc: "Latar belakang serba putih minimalis.",
        images: ["assets/images/themes/white.webp",
                    "assets/images/themes/white-1.webp",
                    "assets/images/themes/white-2.webp",
                    "assets/images/themes/white-3.webp"
        ],
        inclusions: ["Pilih Pakej Salam, Riang atau Lebaran", "Unlimited Shoot & Pose", "Softcopy Google Drive (48 jam)", "Max 20 Pax (Dewasa + Kanak-kanak)"]
    },
    'hening': {
        title: "Hening Rindu",
        type: "standard",
        categoryName: "TEMA FAMILY",
        colorClass: "text-green-600 bg-green-50 border-green-200",
        tagline: "Nostalgia & Warmth.",
        desc: "Set kampung tradisional elemen kayu.",
        images: ["assets/images/themes/hening.webp",
                    "assets/images/themes/hening-1.webp",
                    "assets/images/themes/hening-2.webp",
                    "assets/images/themes/hening-3.webp",
                    "assets/images/themes/hening-4.webp",
                    "assets/images/themes/hening-5.webp"
        ],
        inclusions: ["Pilih Pakej Salam, Riang atau Lebaran", "Unlimited Shoot & Pose", "Softcopy Google Drive (48 jam)", "Max 20 Pax (Dewasa + Kanak-kanak)"]
    },
    'qalbu': {
        title: "Noor Qalbu",
        type: "standard",
        categoryName: "TEMA FAMILY",
        colorClass: "text-green-600 bg-green-50 border-green-200",
        tagline: "Radiance & Grace.",
        desc: "Set ala Timur Tengah (Arabic) yang elegan.",
        images: ["assets/images/themes/qalbu.webp",
                    "assets/images/themes/qalbu-1.webp",
                    "assets/images/themes/qalbu-2.webp",
                    "assets/images/themes/qalbu-3.webp"
        ],
        inclusions: ["Pilih Pakej Salam, Riang atau Lebaran", "Unlimited Shoot & Pose", "Softcopy Google Drive (48 jam)", "Max 20 Pax (Dewasa + Kanak-kanak)"]
    },

        // TEMA MINI
    'old_luxury': {
        title: "Old Luxury",
        type: "mini", // Rujuk rayaPackages.mini
        categoryName: "TEMA MINI",
        colorClass: "text-slate-600 bg-slate-100 border-slate-300",
        tagline: "Classic & Timeless.",
        desc: "Tema klasik eksklusif. Sesuai untuk potret keluarga kecil.",
        images: ["assets/images/themes/coming_soon.webp"], 
        inclusions: ["Sesi 15 Minit", "Unlimited Shoot & Pose", "Softcopy Google Drive (48 jam)", "Terhad kepada: 2 Dewasa + 2 Kanak-kanak"]
    }
    
    // TEMA STANDARD (FAMILY - PAKEJ 1, 2, 3)
    
};

// --- 3. HARGA ADD-ONS (Global) ---
const addonsPrice = {
    extraPax: 10, // RM10 per head (Dewasa)
    extraTime: 20,
    mua: 150
};

// Senarai MUA
const muaOptions = [
    { name: "Tiada", price: 0 },
    { name: "MUA Adam Shah (@adamshahh3386)", price: addonsPrice.mua },
    { name: "MUA Shaazeerakarim (@makeupbyshaazeerakarim)", price: addonsPrice.mua }
];

// Senarai Frame
const frameAddons = [
    { name: "Tiada", price: 0 },
    { name: 'Classic Heirloom (12"x18")', price: 130 },
    { name: 'Royale Portrait (20"x24")', price: 200 },
    { name: 'Majestic Gallery (24"x30")', price: 240 },
    { name: 'Legacy Grandeur (24"x36")', price: 330 }
];

// --- 4. SISTEM PROMOSI (Persediaan) ---
const promoSystem = {
    // Happy Hour Setting (Default OFF, akan di-override oleh Google Sheet / Boss Portal)
    happyHour: {
        active: false,      // ON/OFF
        startTime: "14:00", // Masa Mula
        endTime: "16:00",   // Masa Tamat
        discountAmount: 10, // Tolak RM10
        limit: 0,
        used: 0, // Counter penggunaan
        label: "🔥 Happy Hour Promo"
    },
    // Kupon Statik (Boleh tambah sini)
    coupons: {} //Akan diisi dari database
};

// --- 5. STAFF (Max 5 Photographer) ---
const photographersList = [
    "Belum Ditetapkan",
    "Photographer 1",
    "Photographer 2",
    "Photographer 3",
    "Photographer 4",
    "Photographer 5"
];

const staff = {
    "Photographer 1": { type: "FT", basic: 2000, commission: 10, jobs: 0 },
    "Photographer 2": { type: "FT", basic: 2000, commission: 10, jobs: 0 },
    "Photographer 3": { type: "FT", basic: 2000, commission: 10, jobs: 0 },
    "Photographer 4": { type: "FT", basic: 2000, commission: 10, jobs: 0 },
    "Photographer 5": { type: "FT", basic: 2000, commission: 10, jobs: 0 },
    "Admin": { type: "ADMIN", basic: 1800, commission: 0, jobs: 0 }
};

// ... (Kekalkan Data Galeri, TNC dan FAQ di bawah) ...
// ... (Kod tema raya & hero yang sedia ada biarkan di atas) ...

// 1. DATA TERMA & SYARAT (Untuk Popup T&C)
const tncList = [
    {
        title: "Tempahan & Bayaran",
        desc: "Tempahan hanya sah selepas deposit dibuat. Slot adalah terhad. Bayaran deposit adalah <u>NON-REFUNDABLE</u>."
    },
    {
        title: "Pembatalan",
        desc: "Jika batal, bayaran hangus. Penjadualan semula (reschedule) dibenarkan <strong>sekali sahaja</strong> (48 jam sebelum sesi)."
    },
    {
        title: "Ketepatan Masa",
        desc: "Wajib tiba <strong>15 minit awal</strong>. Lewat akan menyebabkan masa sesi dipotong atau dibatalkan tanpa refund."
    },
    {
        title: "Pakej & Peserta",
        desc: "Bilangan peserta ikut had kategori (Family/Mini). Peserta tambahan dikenakan caj sebanyak RM10 setiap peserta."
    },
    {
        title: "Peralatan & Kerosakan",
        desc: "Sebarang kerosakan pada peralatan studio atau harta benda akibat kecuaian peserta akan dikenakan caj ganti rugi."
    },
    /*{
        title: "Caj Tambahan Hari Raya",
        desc: "Bagi tempahan pada hari raya(1,2,3 Syawal), caj tambahan RM10 dikenakan untuk setiap sesi."
    },*/
    {
        title: "Gambar & Editing",
        desc: "Gambar siap dalam 2-3 hari bekerja. Termasuk basic editing sahaja. Permintaan edit lanjut dikenakan caj tambahan. Frame boleh ditambah semasa sesi photoshoot."
    },
    {
        title: "Hak Cipta",
        desc: "Studio berhak menggunakan gambar untuk tujuan portfolio & pemasaran (melainkan dimaklumkan untuk privasi)."
    },
    {
        title: "Lain-lain",
        desc: "Studio tidak bertanggungjawab atas sebarang kehilangan atau kerosakan barang peribadi semasa sesi. Studio berhak mengubah terma dan syarat tanpa notis."
    }
];

// 2. DATA FAQ (Untuk Section Bawah)
const faqList = [
    {
        category: "Lokasi & Kemudahan",
        content: [
            { q: "Dimana studio raya by mkajstudio beroperasi?", a: "Tahun ini kami beroperasi di Dewan Datuk Sri Abu Seman, Masjid Tanah." },
            { q: "Apa kemudahan yang disediakan?", a: "Studio menyediakan ruang fotografi yang nyaman dan lengkap dengan bilik persalinan." }
        ]
    },
    {
        category: "Tempahan & Bayaran",
        content: [
            { q: "Kenapa bayaran tak boleh pulang?", a: "Sebab slot dikunci khas untuk anda dan menolak pelanggan lain." },
            { q: "Boleh transfer slot ke orang lain?", a: "Tidak dibenarkan tanpa persetujuan admin." }
        ]
    },
    {
        category: "Penjadualan Semula",
        content: [
            { q: "Boleh tukar tarikh/masa?", a: "Boleh <strong>sekali sahaja</strong> jika dimaklumkan 48 jam awal." },
            { q: "Jika studio batalkan?", a: "Kami akan beri refund penuh atau ganti slot baru." }
        ]
    },
    {
        category: "Hari Kejadian",
        content: [
            { q: "Kena datang awal?", a: "Ya, 10-15 minit awal untuk touch-up dan persiapan." },
            { q: "Kalau saya lewat?", a: "Masa shooting berjalan terus. Tiada extra time diberikan." }
        ]
    },
    {
        category: "Pakaian & Prop",
        content: [
            { q: "Studio sedia baju?", a: "Tidak. Sila bawa baju raya sendiri." },
            { q: "Prop ada?", a: "Ya, prop asas tema raya disediakan lengkap." }
        ]
    },
    {
        category: "Hasil Gambar",
        content: [
            { q: "Gambar nanti bagi macam mana?", a: "Gambar akan dihantar dalam format digital (JPG) melalui google drive." },
            { q: "Bila siap?", a: "Anggaran 2-3 Hari bekerja" },
            { q: "Gambar siap edit ke?", a: "Ya, semua gambar telah diedit(basic edit)." }
        ]
    }
];