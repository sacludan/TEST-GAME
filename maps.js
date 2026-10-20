/**
 * 【模組：地圖資料庫 maps.js】
 * 22 個台灣特色區域 + 限量物資掉落池（常見素材約 3–5 個產地）
 */
function expandDrops(itemCounts) {
  const arr = [];
  for (const [id, count] of Object.entries(itemCounts)) {
    for (let i = 0; i < count; i++) arr.push(id);
  }
  return arr;
}

const MAPS_DATA = {
  zones: [
    // 🌊 北部區域
    {
      id: "tamsui", name: "淡水老街", icon: "🚢", x: 15, y: 11,
      drops: expandDrops({grandpa_boxers: 4, sun_hat: 4, light_raincoat: 5, iron_pot: 3, egg: 4, tofu: 4, soy_sauce: 4, red_thread: 4, fake_gold_chain: 3, straw_sandals: 3, rice: 3, rusty_cleaver: 3, plastic_stool: 2})
    },
    {
      id: "taipeistation", name: "台北車站", icon: "🚉", x: 46, y: 48,
      drops: expandDrops({newspaper: 7, paper: 5, convenience_umbrella: 5, yellow_vest: 5, dunga: 5, white_slippers: 5, rice: 5, pork: 4, egg: 4, water: 6, tape: 3, book: 3, pen: 3, plastic_stool: 3, plastic_bag: 3})
    },
    {
      id: "beitou", name: "北投溫泉", icon: "♨️", x: 40, y: 14,
      drops: expandDrops({dirty_towel: 6, water: 7, grandpa_boxers: 5, white_slippers: 5, egg: 5, whiskey: 3, cooking_wine: 5, sun_jacket: 3, sun_hat: 3, convenience_umbrella: 3, yellow_vest: 1})
    },

    {
      id: "sanchong", name: "三重埔", icon: "🌉", x: 18, y: 29,
      drops: expandDrops({exhaust_pipe: 6, melon_helmet: 8, betel_nut: 6, quicklime: 6, dunga: 5, white_slippers: 5, rusty_nail: 7, scrap_iron: 6, wooden_stick: 5, lighter: 5})
    },
    {
      id: "guanghua", name: "光華商場", icon: "💻", x: 68, y: 50,
      drops: expandDrops({wafer: 4, battery: 8, camera_module: 5, netizen_cert: 4, tape: 5, box_cutter: 5, plastic_bag: 5, convenience_umbrella: 3, book: 4, sports_shorts: 3, rusty_nail: 4, scrap_iron: 4})
    },
    {
      id: "yangmingshan", name: "陽明山", icon: "⛰️", x: 69, y: 16,
      drops: expandDrops({feather: 7, bamboo_hat: 5, straw_sandals: 5, rain_boots: 4, wooden_stick: 6, sun_jacket: 4, sun_hat: 4, cloth_gloves: 5, water: 5, pork: 3})
    },

    // 🏙️ 內陸都會北段
    {
      id: "wugu_ind", name: "五股工業區", icon: "🛠️", x: 14, y: 41,
      drops: expandDrops({rusty_nail: 9, scrap_iron: 9, cloth_gloves: 9, polydar: 6, tape: 7, box_cutter: 6, exhaust_pipe: 4, rain_boots: 4, iron_pot: 3, melon_helmet: 3, quicklime: 3})
    },
    {
      id: "shilin", name: "士林夜市", icon: "🍢", x: 51, y: 30,
      drops: expandDrops({plastic_stool: 10, iron_pot: 5, rusty_cleaver: 4, pork: 6, tofu: 5, egg: 6, garlic: 6, soy_sauce: 4, plastic_bag: 7, dirty_bracelet: 4, white_slippers: 4, cooking_wine: 3, red_thread: 3, bandage: 3, shirt: 3, yellow_vest: 1})
    },
    {
      id: "neihu", name: "內湖科學園區", icon: "🖥️", x: 78, y: 36,
      drops: expandDrops({wafer: 6, battery: 7, camera_module: 5, wallpaper_stock: 5, netizen_cert: 3, shirt: 4, reading_glasses: 3, red_pen: 4, expired_milk: 3, box_cutter: 3})
    },

    // 🏛️ 中央盆地圈
    {
      id: "ximen", name: "西門町", icon: "🎬", x: 16, y: 58,
      drops: expandDrops({cult_flyer: 5, dirty_bracelet: 6, fake_gold_chain: 4, sports_shorts: 5, convenience_umbrella: 4, lighter: 5, condom: 4, black_tea: 5, fresh_milk: 4, tape: 4, paper: 3})
    },
    {
      id: "ntu_hospital", name: "台大醫院", icon: "🏥", x: 43, y: 62,
      drops: expandDrops({bandage: 11, condom: 4, water: 5, expired_milk: 3, reading_glasses: 4, rubber_gloves: 6, robe: 4, white_slippers: 4, paper: 6, pen: 4, book: 1})
    },
    {
      id: "taipeiarena", name: "台北大巨蛋", icon: "🏟️", x: 67, y: 63,
      drops: expandDrops({wooden_stick: 6, melon_helmet: 5, sports_shorts: 5, dirty_towel: 5, protest_megaphone: 3, polydar: 4, battery: 5, tape: 4, rusty_nail: 3})
    },
    {
      id: "songshan", name: "松山機場", icon: "✈️", x: 87, y: 58,
      drops: expandDrops({camera_module: 4, battery: 6, whiskey: 5, sun_jacket: 4, reading_glasses: 3, newspaper: 5, money: 4, convenience_umbrella: 4, bandage: 5, sports_shorts: 3})
    },

    // 🏛️ 立法院
    {
      id: "ly", name: "立法院", icon: "🏛️", x: 52, y: 74,
      drops: expandDrops({protest_megaphone: 4, netizen_cert: 8, paper: 8, pen: 7, red_pen: 3, money: 10, newspaper: 5, shirt: 5, water: 5})
    },

    // 🏮 中南段城區
    {
      id: "longshan_temple", name: "龍山寺", icon: "🏮", x: 19, y: 71,
      drops: expandDrops({talisman: 7, incense: 6, joss_paper: 7, robe: 5, red_thread: 6, cult_flyer: 3, ancestral_recipe: 1, wooden_stick: 4, straw_sandals: 4, grandpa_boxers: 3, reading_glasses: 3, iron_pot: 2})
    },
    {
      id: "taipei101", name: "台北101", icon: "🏢", x: 79, y: 74,
      drops: expandDrops({money: 7, wallpaper_stock: 5, deed: 2, jade_seal: 2, whiskey: 4, shirt: 4, reading_glasses: 3, fake_gold_chain: 3, pen: 4, red_pen: 3, box_cutter: 3})
    },

    {
      id: "market", name: "果菜批發市場", icon: "🥬", x: 19, y: 84,
      drops: expandDrops({rice: 8, pork: 7, tofu: 6, egg: 7, garlic: 7, betel_nut: 5, quicklime: 6, polydar: 5, yellow_vest: 5, plastic_bag: 7, deed: 1, cooking_wine: 2, melon_helmet: 3, plastic_stool: 5})
    },
    {
      id: "ntu", name: "台大校園", icon: "🎓", x: 50, y: 86,
      drops: expandDrops({book: 9, paper: 8, pen: 8, red_pen: 4, love_pointer: 4, shirt: 6, wooden_stick: 3, sports_shorts: 6, box_cutter: 4, expired_milk: 3, battery: 2, dirty_bracelet: 3, bandage: 2, cloth_gloves: 3})
    },
    {
      id: "xinyi", name: "信義夜店區", icon: "🥂", x: 80, y: 89,
      drops: expandDrops({whiskey: 6, condom: 6, money: 6, fake_gold_chain: 5, dirty_bracelet: 4, lighter: 6, betel_nut: 4, fresh_milk: 3, black_tea: 4, rubber_gloves: 3, plastic_stool: 3})
    },

    // 🌲 南部與外圍區域
    {
      id: "keelung", name: "野柳漁港", icon: "🐟", x: 87, y: 10,
      drops: expandDrops({rusty_cleaver: 5, iron_pot: 5, pork: 5, rice: 5, garlic: 5, soy_sauce: 5, cooking_wine: 6, rubber_gloves: 4, rain_boots: 4, incense: 4, rusty_nail: 3, scrap_iron: 3})
    },
    {
      id: "jiufen", name: "九份老街", icon: "🌧️", x: 86, y: 25,
      drops: expandDrops({light_raincoat: 6, bamboo_hat: 5, robe: 4, ancestral_recipe: 2, black_tea: 5, talisman: 5, joss_paper: 5, incense: 4, straw_sandals: 4, red_thread: 3, rusty_cleaver: 3})
    },
    {
      id: "zoo", name: "木柵動物園", icon: "🦁", x: 52, y: 97,
      drops: expandDrops({feather: 7, sun_hat: 5, sun_jacket: 5, light_raincoat: 5, rain_boots: 4, cloth_gloves: 4, plastic_bag: 5, black_tea: 4, fresh_milk: 4, love_pointer: 3})
    }
  ]
};

window.GAME_MAPS = MAPS_DATA.zones;
if (typeof GAME_DATA !== 'undefined') {
  GAME_DATA.zones = MAPS_DATA.zones;
}
