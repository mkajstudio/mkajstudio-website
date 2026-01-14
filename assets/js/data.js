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
            title: "Azwin & Syahirullah",
            location: "Glass Hall Melaka",
            folder: "assets/images/albums/wedding/azwin-syahirullah-glass-hall-melaka/",
            // folder: "assets/images/wedding/amir-aina/",
            total: 76,
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
            total: 154 
        },
        { 
            id: 2, 
            title: "Raya Klasik 2025", 
            location: "Studio Raya mkaj", 
            folder: "assets/images/albums/raya/raya-klasik/",
            // folder: "assets/images/raya/hj-razak/",
            total: 128 
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
            "assets/images/albums/wedding/azwin-syahirullah-glass-hall-melaka/1.webp",
            "assets/images/albums/wedding/farahin-hafifi-seremban/3.webp",
            "assets/images/albums/wedding/azwin-syahirullah-glass-hall-melaka/3.webp",
            "assets/images/albums/wedding/farahin-hafifi-seremban/2.webp",
            "assets/images/albums/wedding/azwin-syahirullah-glass-hall-melaka/2.webp"
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
    }
};

// Slideshow Header (Homepage) - Boleh guna URL online atau local
const slideshowData = {
    'img-wedding': ['https://picsum.photos/id/100/600/800', 'https://picsum.photos/id/101/600/800'],
    'img-studio': ['https://picsum.photos/id/200/600/800', 'https://picsum.photos/id/201/600/800'],
    'img-raya': ['https://picsum.photos/id/300/600/800', 'https://picsum.photos/id/301/600/800'],
    'img-event': ['https://picsum.photos/id/400/600/800', 'https://picsum.photos/id/401/600/800'],
    'img-convo': ['https://picsum.photos/id/500/600/800', 'https://picsum.photos/id/501/600/800'],
};

/* 
   RAYA HERO SLIDESHOW
   Senaraikan gambar background untuk page Raya di sini.
   Pastikan gambar saiz besar (Landscape) berkualiti tinggi.
*/
const rayaHeroImages = [
    "assets/images/albums/raya/raya-moden/1.webp",
    "assets/images/albums/raya/raya-klasik/1.webp",
    "assets/images/albums/raya/raya-moden/11.webp",
    "assets/images/albums/raya/raya-klasik/11.webp",
    "assets/images/albums/raya/raya-moden/21.webp",
    "assets/images/albums/raya/raya-klasik/21.webp",
    // Boleh tambah lagi: "assets/images/hero/hero-raya-4.webp"
];

/* 
   assets/js/data.js
   Database Statik
*/

// INFO RAYA HERO (Kalau guna solution background JS tadi)


// INFO TEMA RAYA
const rayaThemesDetail = {
    // --- TEMA FAMILY (Max 20 Pax) ---
    'velvet': {
        title: "Royale Velvet(maroon)",
        type: "family",
        categoryName: "FAMILY (6 PAX)",
        colorClass: "text-green-600 bg-green-50 border-green-200", // UI Class Hijau
        price: 139,
        paxCover: 6, // Base cover 6
        tagline: "Elegance & Luxury.",
        desc: "Set mewah dengan latar belakang velvet. Sesuai untuk baju raya berwarna gelap dan mewah.",
        images: ["assets/images/themes/royale-velvet.webp",
                "assets/images/themes/royale-velvet.webp"
        ], // Tukar nama fail sebenar
        inclusions: [
            "Sesi Fotografi 20 Minit",
            "Unlimited Shooting",
            "Semua Gambar (Softcopy)",
            "Percuma Editing (Color Grade)",
            "Cover 6 Dewasa"
        ]
    },
    'white': {
        title: "Whisper White(putih)",
        type: "family",
        categoryName: "FAMILY (6 PAX)",
        colorClass: "text-green-600 bg-green-50 border-green-200", // UI Class Hijau
        price: 139,
        paxCover: 6, // Base cover 6
        tagline: "Pure & Timeless.",
        desc: "Latar belakang serba putih dengan prop minimalis. Sesuai untuk baju raya moden dan kontemporari.",
        images: ["assets/images/themes/whisper-white.webp",
                "assets/images/themes/whisper-white.webp"
        ],
        inclusions: [
            "Sesi Fotografi 20 Minit",
            "Unlimited Shooting",
            "Semua Gambar (Softcopy)",
            "Percuma Editing (Color Grade)",
            "Cover 6 Dewasa"
        ]
    },
    'hening': {
        title: "Hening Rindu(klasik)",
        type: "family",
        categoryName: "FAMILY (6 PAX)",
        colorClass: "text-green-600 bg-green-50 border-green-200", // UI Class Hijau
        price: 139,
        paxCover: 6, // Base cover 6
        tagline: "Nostalgia & Warmth.",
        desc: "Set kampung tradisional dengan elemen kayu dan anyaman. Sesuai untuk baju raya klasik dan tradisional.",
        images: ["assets/images/themes/hening-rindu.webp",
                "assets/images/themes/hening-rindu.webp"
        ],
        inclusions: [
            "Sesi Fotografi 20 Minit",
            "Unlimited Shooting",
            "Semua Gambar (Softcopy)",
            "Percuma Editing (Color Grade)",
            "Cover 6 Dewasa"
        ]
    },
    'qalbu': {
        title: "Noor Qalbu(Arabic)",
        type: "family",
        categoryName: "FAMILY (6 PAX)",
        colorClass: "text-green-600 bg-green-50 border-green-200", // UI Class Hijau
        price: 139,
        paxCover: 6, // Base cover 6
        tagline: "Radiance & Grace.",
        desc: "Set ala timur tengah dengan elemen seni Islamik. Sesuai untuk baju raya berinspirasikan Arab dan moden.",
        images: ["assets/images/themes/noor-qalbu.webp",
                "assets/images/themes/noor-qalbu.webp"
        ],
        inclusions: [
            "Sesi Fotografi 20 Minit",
            "Unlimited Shooting",
            "Semua Gambar (Softcopy)",
            "Percuma Editing (Color Grade)",
            "Cover 6 Dewasa"
        ]
    },

    // --- TEMA COUPLE (Limit: 2 Dewasa + 2 Kanak2) ---
    'midnight': {
        title: "Midnight Luxury",
        type: "couple",
        categoryName: "COUPLE (2 PAX + 2 KIDS)", // Label Kategori
        colorClass: "text-pink-500 bg-pink-50 border-pink-200", // UI Class Pink
        price: 99,
        paxCover: 2, // Base cover 2 Dewasa
        tagline: "Romance & Intimacy.",
        desc: "Tema mewah dengan latar belakang gelap dan pencahayaan lembut. Sesuai untuk OOTD couple raya. (Max 2 Dewasa, 2 Kanak-kanak).",
        images: ["assets/images/themes/midnight-luxury.webp",
                "assets/images/themes/midnight-luxury.webp"
        ],
        inclusions: [
            "Sesi Fotografi 15 Minit",
            "Unlimited Shooting",
            "Semua Gambar (Softcopy)",
            "Percuma Editing (Color Grade)",
            "Limit: 2 Dewasa + 2 Kanak-kanak"
        ]
    },
    'secret': {
        title: "Secret Garden",
        type: "couple",
        categoryName: "COUPLE (2 PAX + 2 KIDS)", // Label Kategori
        colorClass: "text-pink-500 bg-pink-50 border-pink-200", // UI Class Pink
        price: 99,
        paxCover: 2, // Base cover 2 Dewasa
        tagline: "Nature & Love.",
        desc: "Tema floral tertutup. Sesuai untuk OOTD couple raya. (Max 2 Dewasa, 2 Kanak-kanak).",
        images: ["assets/images/themes/secret-garden.webp",
                "assets/images/themes/secret-garden.webp"
        ],
        inclusions: [
            "Sesi Fotografi 15 Minit",
            "Unlimited Shooting",
            "Semua Gambar (Softcopy)",
            "Percuma Editing (Color Grade)",
            "Limit: 2 Dewasa + 2 Kanak-kanak"
        ]
    }
};

// ... Data Gallery lain kekalkan jika ada ...