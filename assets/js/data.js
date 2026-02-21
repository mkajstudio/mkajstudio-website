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
    "assets/images/hero/raya-hero/studio-raya-masjid-tanah.webp",
    "assets/images/hero/raya-hero/studio-raya-kuala-sungai-baru.webp",
    "assets/images/hero/raya-hero/studio-raya-sungai-udang.webp",
    "assets/images/hero/raya-hero/studio-raya-alor-gajah.webp"
    // Boleh tambah lagi: "assets/images/hero/hero-raya-4.webp"
];



/* 
   DATABASE MKAJ STUDIO 2026
   --------------------------------------------------
   Pusat Rujukan Data untuk Website, Booking & Admin
*/

// 1. INFO TEMA RAYA (Main Database)
const rayaThemesDetail = {
    // --- TEMA FAMILY (Tier 1: RM129 | Tier 2: RM199) ---
    'velvet': {
        title: "Royale Velvet",
        type: "family",
        categoryName: "KATEGORI FAMILY",
        colorClass: "text-green-600 bg-green-50 border-green-200", // UI Class Hijau
        displayPrice: "Bermula RM 129", // Harga dipaparkan di grid luar
        price: 129, // Base price untuk tier 1
        paxCover: 8, // Base limit untuk tier 1
        tagline: "Elegance & Luxury.",
        desc: "Set mewah dengan latar belakang velvet. Sesuai untuk tema eksklusif keluarga besar.",
        //thumbnail: "assets/images/themes/poster-moden.webp",
        images: ["assets/images/themes/velvet.webp"],
        inclusions: [
            "Sesi Fotografi 20 Minit",
            "Unlimited Shooting & Softcopy",
            "Kategori 1-8 Pax (RM129)",
            "Kategori 9-15 Pax (RM199)",
            "Extra Pax > 15 orang (+RM10/head)"
        ]
    },
    'white': {
        title: "Whisper White",
        type: "family",
        categoryName: "KATEGORI FAMILY",
        colorClass: "text-green-600 bg-green-50 border-green-200", // UI Class Hijau
        displayPrice: "Bermula RM 129",
        price: 129,
        paxCover: 8,
        tagline: "Pure & Timeless.",
        desc: "Latar belakang serba putih minimalis. Sesuai untuk baju raya moden dan pastel.",
        //thumbnail: "assets/images/themes/poster-moden.webp",
        images: ["assets/images/themes/white.webp"],
        inclusions: [
            "Sesi Fotografi 20 Minit",
            "Unlimited Shooting & Softcopy",
            "Kategori 1-8 Pax (RM129)",
            "Kategori 9-15 Pax (RM199)",
            "Extra Pax > 15 orang (+RM10/head)"
        ]
    },
    'hening': {
        title: "Hening Rindu",
        type: "family",
        categoryName: "KATEGORI FAMILY",
        colorClass: "text-green-600 bg-green-50 border-green-200", // UI Class Hijau
        displayPrice: "Bermula RM 129",
        price: 129,
        paxCover: 8,
        tagline: "Nostalgia & Warmth.",
        desc: "Set kampung tradisional dengan elemen kayu. Membangkitkan nostalgia raya desa.",
        //thumbnail: "assets/images/themes/poster-moden.webp",
        images: ["assets/images/themes/hening.webp"],
        inclusions: [
            "Sesi Fotografi 20 Minit",
            "Unlimited Shooting & Softcopy",
            "Kategori 1-8 Pax (RM129)",
            "Kategori 9-15 Pax (RM199)",
            "Extra Pax > 15 orang (+RM10/head)"
        ]
    },
    'qalbu': {
        title: "Noor Qalbu",
        type: "family",
        categoryName: "KATEGORI FAMILY",
        colorClass: "text-green-600 bg-green-50 border-green-200", // UI Class Hijau
        displayPrice: "Bermula RM 129",
        price: 129,
        paxCover: 8,
        tagline: "Radiance & Grace.",
        desc: "Set ala Timur Tengah (Arabic) yang elegan dan artistik.",
       //thumbnail: "assets/images/themes/poster-qalbu.webp",
        images: ["assets/images/themes/qalbu.webp"],
        inclusions: [
            "Sesi Fotografi 20 Minit",
            "Unlimited Shooting & Softcopy",
            "Kategori 1-8 Pax (RM129)",
            "Kategori 9-15 Pax (RM199)",
            "Extra Pax > 15 orang (+RM10/head)"
        ]
    },

    // --- TEMA COUPLE (Fixed RM89) ---
    'space': {
        title: "Space Grey",
        type: "couple",
        categoryName: "KATEGORI COUPLE",
        colorClass: "text-pink-500 bg-pink-50 border-pink-200", // UI Class Pink
        displayPrice: "RM 89",
        price: 89,
        paxCover: 4,
        tagline: "Romance & Intimacy.",
        desc: "Tema premium untuk pasangan atau kumpulan kecil (Max 4 pax).",
        //thumbnail: "assets/images/themes/poster-space.webp",
        images: ["assets/images/themes/coming_soon.webp"],
        inclusions: [
            "Sesi Fotografi 15 Minit",
            "Unlimited Shooting & Softcopy",
            "Maksima 4 Orang Sahaja",
            "Sesuai untuk OOTD Raya Couple"
        ]
    },
    'secret': {
        title: "Secret Garden",
        type: "couple",
        categoryName: "KATEGORI COUPLE",
        colorClass: "text-pink-500 bg-pink-50 border-pink-200", // UI Class Pink
        displayPrice: "RM 89",
        price: 89,
        paxCover: 4,
        tagline: "Nature & Love.",
        desc: "Tema floral tertutup. Romantik dan eksklusif untuk 4 orang.",
        //thumbnail: "assets/images/themes/poster-secret.webp",
        images: ["assets/images/themes/coming_soon.webp"],
        inclusions: [
            "Sesi Fotografi 15 Minit",
            "Unlimited Shooting & Softcopy",
            "Maksima 4 Orang Sahaja",
            "Sesuai untuk OOTD Raya Couple"
        ]
    }
};

// 2. DATA ADD-ONS (MUA & FRAME)
const muaOptions = [
    { name: "Tiada", price: 0 },
    { name: "MUA Adam Shah (@adamshahh3386)", price: 150 },
    { name: "MUA Shaazeerakarim (@makeupbyshaazeerakarim)", price: 150 }
];

const frameAddons = [
    { name: "Tiada", price: 0 },
    { name: 'Classic Heirloom (12"x18")', price: 120 },
    { name: 'Royale Portrait (20"x24")', price: 180 },
    { name: 'Majestic Gallery (24"x30")', price: 220 },
    { name: 'Legacy Grandeur (24"x36")', price: 300 }
];

// 4. JURUGAMBAR (Full-Time)
const photographersList = [
    "Belum Ditetapkan",
    "Photographer 1",
    "Photographer 2",
    "Photographer 3",
    "Photographer 4",
    "Photographer 5",
    "Photographer 6"
];

const staff = {
    "Photographer 1": { type: "FT", basic: 2000, commission: 10, jobs: 0 },
    "Photographer 2": { type: "FT", basic: 2000, commission: 10, jobs: 0 },
    "Photographer 3": { type: "FT", basic: 2000, commission: 10, jobs: 0 },
    "Photographer 4": { type: "FT", basic: 2000, commission: 10, jobs: 0 },
    "Photographer 5": { type: "FT", basic: 2000, commission: 10, jobs: 0 },
    "Photographer 6": { type: "FT", basic: 2000, commission: 10, jobs: 0 },
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
        desc: "Bilangan peserta ikut had kategori (Family/Couple). Peserta tambahan dikenakan caj sebanyak RM10 setiap peserta."
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