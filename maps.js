/**
 * 【模組：地圖資料庫 maps.js】
 * 22 個台灣特色區域 + 依照指定數量展開的物資掉落池
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
      drops: expandDrops({ grandpa_boxers: 4, sun_hat: 4, light_raincoat: 5, iron_pot: 3, egg: 4, tofu: 4, soy_sauce: 4, red_thread: 3, fake_gold_chain: 3, straw_sandals: 3 })
    },
    {
      id: "taipeistation", name: "台北車站", icon: "🚉", x: 46, y: 48,
      drops: expandDrops({ newspaper: 7, paper: 5, convenience_umbrella: 5, yellow_vest: 5, dunga: 5, white_slippers: 5, rice: 5, pork: 4, egg: 4, water: 5 })
    },
    {
      id: "beitou", name: "北投溫泉", icon: "♨️", x: 40, y: 14,
      drops: expandDrops({ dirty_towel: 6, water: 7, grandpa_boxers: 5, white_slippers: 5, egg: 5, whiskey: 3, cooking_wine: 4, sun_jacket: 3, sun_hat: 3 })
    },

    {
      id: "sanchong", name: "三重埔", icon: "🌉", x: 18, y: 29,
      drops: expandDrops({ exhaust_pipe: 6, melon_helmet: 6, betel_nut: 6, quicklime: 5, dunga: 5, white_slippers: 5, rusty_nail: 5, scrap_iron: 4, wooden_stick: 4, lighter: 5 })
    },
    {
      id: "guanghua", name: "光華商場", icon: "💻", x: 68, y: 50,
      drops: expandDrops({ wafer: 4, battery: 7, camera_module: 5, netizen_cert: 3, tape: 5, box_cutter: 4, plastic_bag: 5, convenience_umbrella: 3, book: 3, sports_shorts: 3 })
    },
    {
      id: "yangmingshan", name: "陽明山", icon: "⛰️", x: 69, y: 16,
      drops: expandDrops({ feather: 6, bamboo_hat: 5, straw_sandals: 5, rain_boots: 4, wooden_stick: 5, sun_jacket: 4, sun_hat: 4, cloth_gloves: 4, water: 5, pork: 3 })
    },

    // 🏙️ 內陸都會北段
    {
      id: "wugu_ind", name: "五股工業區", icon: "🛠️", x: 14, y: 41,
      drops: expandDrops({ rusty_nail: 7, scrap_iron: 7, cloth_gloves: 7, polydar: 6, tape: 6, box_cutter: 5, exhaust_pipe: 4, rain_boots: 4, iron_pot: 3 })
    },
    {
      id: "shilin", name: "士林夜市", icon: "🍢", x: 51, y: 30,
      drops: expandDrops({ plastic_stool: 5, iron_pot: 4, rusty_cleaver: 4, pork: 5, tofu: 5, egg: 5, garlic: 5, soy_sauce: 4, plastic_bag: 6, dirty_bracelet: 3, white_slippers: 4 })
    },
    {
      id: "neihu", name: "內湖科學園區", icon: "🖥️", x: 78, y: 36,
      drops: expandDrops({ wafer: 6, battery: 6, camera_module: 5, wallpaper_stock: 5, netizen_cert: 3, shirt: 4, reading_glasses: 3, red_pen: 4, expired_milk: 3 })
    },

    // 🏛️ 中央盆地圈
    {
      id: "ximen", name: "西門町", icon: "🎬", x: 16, y: 58,
      drops: expandDrops({ cult_flyer: 5, dirty_bracelet: 5, fake_gold_chain: 4, sports_shorts: 5, convenience_umbrella: 4, lighter: 5, condom: 4, black_tea: 5, fresh_milk: 4, tape: 4 })
    },
    {
      id: "ntu_hospital", name: "台大醫院", icon: "🏥", x: 43, y: 62,
      drops: expandDrops({ bandage: 8, condom: 4, water: 5, expired_milk: 3, reading_glasses: 4, rubber_gloves: 5, robe: 4, white_slippers: 4, paper: 4, pen: 3 })
    },
    {
      id: "taipeiarena", name: "台北大巨蛋", icon: "🏟️", x: 67, y: 63,
      drops: expandDrops({ wooden_stick: 6, melon_helmet: 4, sports_shorts: 5, dirty_towel: 5, protest_megaphone: 3, polydar: 4, battery: 4, tape: 4, water: 5 })
    },
    {
      id: "songshan", name: "松山機場", icon: "✈️", x: 87, y: 58,
      drops: expandDrops({ camera_module: 4, battery: 5, whiskey: 5, sun_jacket: 4, reading_glasses: 3, newspaper: 5, money: 4, convenience_umbrella: 4, bandage: 3 })
    },

    // 🏛️ 立法院
    {
      id: "ly", name: "立法院", icon: "🏛️", x: 52, y: 74,
      drops: expandDrops({ protest_megaphone: 4, plastic_stool: 5, netizen_cert: 6, paper: 6, pen: 5, red_pen: 3, money: 8, newspaper: 5, shirt: 4, yellow_vest: 3, water: 4 })
    },

    // 🏮 中南段城區
    {
      id: "longshan_temple", name: "龍山寺", icon: "🏮", x: 19, y: 71,
      drops: expandDrops({ talisman: 6, incense: 6, joss_paper: 6, robe: 5, red_thread: 4, cult_flyer: 3, ancestral_recipe: 1, wooden_stick: 4, straw_sandals: 4, grandpa_boxers: 3, reading_glasses: 3 })
    },
    {
      id: "taipei101", name: "台北101", icon: "🏢", x: 79, y: 74,
      drops: expandDrops({ money: 6, wallpaper_stock: 5, deed: 2, jade_seal: 2, whiskey: 4, shirt: 4, reading_glasses: 3, fake_gold_chain: 3, pen: 4, red_pen: 3, water: 3 })
    },

    {
      id: "market", name: "果菜批發市場", icon: "🥬", x: 19, y: 84,
      drops: expandDrops({ rice: 7, pork: 6, tofu: 6, egg: 6, garlic: 6, betel_nut: 5, quicklime: 5, polydar: 5, yellow_vest: 4, plastic_bag: 6, deed: 1 })
    },
    {
      id: "ntu", name: "台大校園", icon: "🎓", x: 50, y: 86,
      drops: expandDrops({ book: 7, paper: 6, pen: 6, red_pen: 4, love_pointer: 4, shirt: 5, wooden_stick: 3, sports_shorts: 4, box_cutter: 4, expired_milk: 3, water: 4 })
    },
    {
      id: "xinyi", name: "信義夜店區", icon: "🥂", x: 80, y: 89,
      drops: expandDrops({ whiskey: 6, condom: 6, money: 5, fake_gold_chain: 5, dirty_bracelet: 4, lighter: 6, betel_nut: 4, fresh_milk: 3, black_tea: 4 })
    },

    // 🌲 南部與外圍區域
    {
      id: "keelung", name: "野柳漁港", icon: "🐟", x: 87, y: 10,
      drops: expandDrops({ rusty_cleaver: 5, iron_pot: 4, pork: 5, rice: 5, garlic: 5, soy_sauce: 5, cooking_wine: 5, rubber_gloves: 4, rain_boots: 4, incense: 4 })
    },
    {
      id: "jiufen", name: "九份老街", icon: "🌧️", x: 86, y: 25,
      drops: expandDrops({ light_raincoat: 6, bamboo_hat: 5, robe: 4, ancestral_recipe: 2, black_tea: 5, talisman: 4, joss_paper: 4, incense: 4, straw_sandals: 4 })
    },
    {
      id: "zoo", name: "木柵動物園", icon: "🦁", x: 52, y: 97,
      drops: expandDrops({ feather: 6, sun_hat: 5, sun_jacket: 5, light_raincoat: 5, rain_boots: 4, cloth_gloves: 4, plastic_bag: 5, black_tea: 4, fresh_milk: 4 })
    }
  ]
};

window.GAME_MAPS = MAPS_DATA.zones;
if (typeof GAME_DATA !== 'undefined') {
  GAME_DATA.zones = MAPS_DATA.zones;
}
