/**
 * 【模組：地圖資料庫 maps.js】
 * 22 個台灣特色區域 + 依照指定數量展開的物資掉落池
 * v19.1：全面重新配置常用一階素材與起手裝備。掉落池仍然有限，稀有特殊材料仍稀少。
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
      drops: expandDrops({ grandpa_boxers: 4, sun_hat: 4, light_raincoat: 5, iron_pot: 3, egg: 4, tofu: 4, soy_sauce: 4, red_thread: 5, fake_gold_chain: 3, straw_sandals: 3, paper: 2, plastic_bag: 2, rusty_nail: 2, talisman: 2, rice: 2, plastic_stool: 2 })
    },
    {
      id: "taipeistation", name: "台北車站", icon: "🚉", x: 46, y: 48,
      drops: expandDrops({ newspaper: 7, paper: 5, convenience_umbrella: 5, yellow_vest: 5, dunga: 5, white_slippers: 5, rice: 5, pork: 4, egg: 4, water: 5, money: 2, book: 3, tape: 2, battery: 2, pen: 2, bandage: 3, plastic_stool: 2, reading_glasses: 2 })
    },
    {
      id: "beitou", name: "北投溫泉", icon: "♨️", x: 40, y: 14,
      drops: expandDrops({ dirty_towel: 6, water: 7, grandpa_boxers: 5, white_slippers: 5, egg: 5, whiskey: 3, cooking_wine: 4, sun_jacket: 3, sun_hat: 3, bandage: 2, red_thread: 2, incense: 2, iron_pot: 2, plastic_bag: 2, dirty_bracelet: 2 })
    },

    {
      id: "sanchong", name: "三重埔", icon: "🌉", x: 18, y: 29,
      drops: expandDrops({ exhaust_pipe: 6, melon_helmet: 6, betel_nut: 6, quicklime: 7, dunga: 5, white_slippers: 5, rusty_nail: 10, scrap_iron: 9, wooden_stick: 4, lighter: 5, tape: 3, iron_pot: 2 })
    },
    {
      id: "guanghua", name: "光華商場", icon: "💻", x: 68, y: 50,
      drops: expandDrops({ wafer: 4, battery: 9, camera_module: 5, netizen_cert: 3, tape: 5, box_cutter: 4, plastic_bag: 5, convenience_umbrella: 3, book: 5, sports_shorts: 3, rusty_nail: 4, scrap_iron: 4, pen: 2, exhaust_pipe: 2, melon_helmet: 2, shirt: 2 })
    },
    {
      id: "yangmingshan", name: "陽明山", icon: "⛰️", x: 69, y: 16,
      drops: expandDrops({ feather: 8, bamboo_hat: 5, straw_sandals: 5, rain_boots: 4, wooden_stick: 5, sun_jacket: 4, sun_hat: 4, cloth_gloves: 4, water: 5, pork: 3, rusty_nail: 2, bandage: 2, dirty_bracelet: 2 })
    },

    // 🏙️ 內陸都會北段
    {
      id: "wugu_ind", name: "五股工業區", icon: "🛠️", x: 14, y: 41,
      drops: expandDrops({ rusty_nail: 13, scrap_iron: 13, cloth_gloves: 7, polydar: 6, tape: 9, box_cutter: 5, exhaust_pipe: 4, rain_boots: 4, iron_pot: 3, battery: 2, melon_helmet: 2, shirt: 2 })
    },
    {
      id: "shilin", name: "士林夜市", icon: "🍢", x: 51, y: 30,
      drops: expandDrops({ plastic_stool: 5, iron_pot: 4, rusty_cleaver: 4, pork: 5, tofu: 5, egg: 5, garlic: 5, soy_sauce: 4, plastic_bag: 6, dirty_bracelet: 3, white_slippers: 4, rusty_nail: 3, scrap_iron: 2, money: 2, red_thread: 2, talisman: 2, cooking_wine: 3, quicklime: 2, bandage: 2, melon_helmet: 2, shirt: 2 })
    },
    {
      id: "neihu", name: "內湖科學園區", icon: "🖥️", x: 78, y: 36,
      drops: expandDrops({ wafer: 6, battery: 8, camera_module: 5, wallpaper_stock: 5, netizen_cert: 5, shirt: 4, reading_glasses: 3, red_pen: 4, expired_milk: 3, rusty_nail: 2, scrap_iron: 2, book: 2, tape: 2, box_cutter: 2, sports_shorts: 2 })
    },

    // 🏛️ 中央盆地圈
    {
      id: "ximen", name: "西門町", icon: "🎬", x: 16, y: 58,
      drops: expandDrops({ cult_flyer: 5, dirty_bracelet: 5, fake_gold_chain: 4, sports_shorts: 5, convenience_umbrella: 4, lighter: 5, condom: 4, black_tea: 5, fresh_milk: 4, tape: 4, paper: 2, pen: 2, money: 2, book: 2, bandage: 2, melon_helmet: 2, shirt: 2, rubber_gloves: 2 })
    },
    {
      id: "ntu_hospital", name: "台大醫院", icon: "🏥", x: 43, y: 62,
      drops: expandDrops({ bandage: 12, condom: 4, water: 5, expired_milk: 3, reading_glasses: 4, rubber_gloves: 5, robe: 4, white_slippers: 4, paper: 6, pen: 5, book: 2, box_cutter: 2, dirty_bracelet: 2, tape: 2 })
    },
    {
      id: "taipeiarena", name: "台北大巨蛋", icon: "🏟️", x: 67, y: 63,
      drops: expandDrops({ wooden_stick: 6, melon_helmet: 4, sports_shorts: 5, dirty_towel: 5, protest_megaphone: 3, polydar: 4, battery: 6, tape: 4, water: 5, rusty_nail: 2, scrap_iron: 2, bandage: 2, dirty_bracelet: 2, cloth_gloves: 2, shirt: 2 })
    },
    {
      id: "songshan", name: "松山機場", icon: "✈️", x: 87, y: 58,
      drops: expandDrops({ camera_module: 4, battery: 7, whiskey: 5, sun_jacket: 4, reading_glasses: 3, newspaper: 5, money: 4, convenience_umbrella: 4, bandage: 5, book: 2, tape: 2, pen: 2, dirty_bracelet: 2, sports_shorts: 2 })
    },

    // 🏛️ 立法院
    {
      id: "ly", name: "立法院", icon: "🏛️", x: 52, y: 74,
      drops: expandDrops({ protest_megaphone: 4, plastic_stool: 5, netizen_cert: 8, paper: 8, pen: 7, red_pen: 3, money: 10, newspaper: 5, shirt: 4, yellow_vest: 3, water: 4, book: 2, cloth_gloves: 2, sports_shorts: 2, tape: 2 })
    },

    // 🏮 中南段城區
    {
      id: "longshan_temple", name: "龍山寺", icon: "🏮", x: 19, y: 71,
      drops: expandDrops({ talisman: 6, incense: 8, joss_paper: 8, robe: 5, red_thread: 6, cult_flyer: 5, ancestral_recipe: 1, wooden_stick: 4, straw_sandals: 4, grandpa_boxers: 3, reading_glasses: 3, bandage: 2, dirty_bracelet: 2, iron_pot: 2, plastic_stool: 2 })
    },
    {
      id: "taipei101", name: "台北101", icon: "🏢", x: 79, y: 74,
      drops: expandDrops({ money: 8, wallpaper_stock: 5, deed: 2, jade_seal: 2, whiskey: 4, shirt: 4, reading_glasses: 3, fake_gold_chain: 3, pen: 4, red_pen: 3, water: 3, book: 2, wafer: 2, battery: 2, paper: 2, netizen_cert: 2, plastic_stool: 2, sports_shorts: 2, rubber_gloves: 2 })
    },

    {
      id: "market", name: "果菜批發市場", icon: "🥬", x: 19, y: 84,
      drops: expandDrops({ rice: 7, pork: 6, tofu: 6, egg: 6, garlic: 8, betel_nut: 5, quicklime: 5, polydar: 5, yellow_vest: 4, plastic_bag: 6, deed: 1, rusty_nail: 2, scrap_iron: 2, tape: 2, cooking_wine: 2, plastic_stool: 3, melon_helmet: 2, rubber_gloves: 2, straw_sandals: 2, dirty_bracelet: 2 })
    },
    {
      id: "ntu", name: "台大校園", icon: "🎓", x: 50, y: 86,
      drops: expandDrops({ book: 10, paper: 9, pen: 8, red_pen: 4, love_pointer: 4, shirt: 5, wooden_stick: 3, sports_shorts: 4, box_cutter: 4, expired_milk: 3, water: 4, battery: 2, wafer: 2, rusty_nail: 2, bandage: 2, melon_helmet: 2, cloth_gloves: 2, dirty_bracelet: 2 })
    },
    {
      id: "xinyi", name: "信義夜店區", icon: "🥂", x: 80, y: 89,
      drops: expandDrops({ whiskey: 6, condom: 6, money: 7, fake_gold_chain: 5, dirty_bracelet: 4, lighter: 6, betel_nut: 4, fresh_milk: 3, black_tea: 4, cooking_wine: 2, bandage: 2, battery: 2, tape: 2, plastic_stool: 2, sun_hat: 2, shirt: 2, white_slippers: 2, rubber_gloves: 2 })
    },

    // 🌲 南部與外圍區域
    {
      id: "keelung", name: "野柳漁港", icon: "🐟", x: 87, y: 10,
      drops: expandDrops({ rusty_cleaver: 5, iron_pot: 4, pork: 5, rice: 5, garlic: 5, soy_sauce: 5, cooking_wine: 7, rubber_gloves: 4, rain_boots: 4, incense: 4, rusty_nail: 3, scrap_iron: 3, red_thread: 2, tape: 2, joss_paper: 2, bandage: 2, melon_helmet: 2, shirt: 2, dirty_bracelet: 2 })
    },
    {
      id: "jiufen", name: "九份老街", icon: "🌧️", x: 86, y: 25,
      drops: expandDrops({ light_raincoat: 6, bamboo_hat: 5, robe: 4, ancestral_recipe: 2, black_tea: 5, talisman: 4, joss_paper: 4, incense: 4, straw_sandals: 4, rusty_nail: 2, scrap_iron: 2, cooking_wine: 2, red_thread: 2, feather: 2, paper: 2, tape: 2, dirty_bracelet: 2, plastic_stool: 2, rubber_gloves: 2 })
    },
    {
      id: "zoo", name: "木柵動物園", icon: "🦁", x: 52, y: 97,
      drops: expandDrops({ feather: 8, sun_hat: 5, sun_jacket: 5, light_raincoat: 5, rain_boots: 4, cloth_gloves: 4, plastic_bag: 5, black_tea: 4, fresh_milk: 4, rusty_nail: 2, scrap_iron: 2, bandage: 2, battery: 2, plastic_stool: 2, dirty_bracelet: 2, lighter: 2 })
    }
  ]
};

window.GAME_MAPS = MAPS_DATA.zones;
if (typeof GAME_DATA !== 'undefined') {
  GAME_DATA.zones = MAPS_DATA.zones;
}
