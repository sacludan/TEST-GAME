/**
 * 【資料模組：食物補品 items_food.js】
 * 收錄 1～3 階台灣特色補品與基礎可食用食材
 */
const FOODS_DATA = {
  items: {
    // ⚪ 1 階基礎補品與食材
    bandage:            { id: "bandage",            name: "繃帶",                             type: "food", hp: 25, sp: 0,  rarity: 1, score: 15, desc: "醫護箱常見的急救繃帶，能快速包紮止血。" },
    water:              { id: "water",              name: "水",                               type: "food", hp: 0,  sp: 25, rarity: 1, score: 15, desc: "冰涼的礦泉水，補充流失的體力。" },
    polydar:            { id: "polydar",            name: "保力達B",                          type: "food", hp: 10, sp: 20, rarity: 1, score: 18, desc: "明天的氣力，今天給你傳便便！" },
    cooking_wine:       { id: "cooking_wine",       name: "料理米酒",                         type: "food", hp: 5,  sp: 20, rarity: 1, score: 15, desc: "紅標純米料理米酒，直接喝也能暖身。" },
    whiskey:            { id: "whiskey",            name: "威士忌",                           type: "food", hp: 10, sp: 25, rarity: 1, score: 20, desc: "夜店與招待所常見的純麥威士忌。" },
    pork:               { id: "pork",               name: "生豬肉",                           type: "food", hp: 15, sp: 5,  rarity: 1, score: 15, desc: "市場溫體台灣豬肉，建議煮熟再吃。" },
    garlic:             { id: "garlic",             name: "蒜頭",                             type: "food", hp: 10, sp: 10, rarity: 1, score: 12, desc: "雲林特產辛辣蒜頭，配香腸絕配。" },
    rice:               { id: "rice",               name: "白米",                             type: "food", hp: 15, sp: 10, rarity: 1, score: 15, desc: "飽滿的池上白米。" },
    tofu:               { id: "tofu",               name: "豆腐",                             type: "food", hp: 20, sp: 5,  rarity: 1, score: 15, desc: "滑嫩的傳統板豆腐。" },
    egg:                { id: "egg",                name: "雞蛋",                             type: "food", hp: 15, sp: 10, rarity: 1, score: 15, desc: "富含蛋白質的新鮮雞蛋。" },
    soy_sauce:          { id: "soy_sauce",          name: "醬油",                             type: "food", hp: 5,  sp: 15, rarity: 1, score: 12, desc: "甘醇滷汁必備的陳年醬油。" },
    black_tea:          { id: "black_tea",          name: "紅茶",                             type: "food", hp: 5,  sp: 22, rarity: 1, score: 15, desc: "古早味決明子冰紅茶。" },
    fresh_milk:         { id: "fresh_milk",         name: "鮮奶",                             type: "food", hp: 18, sp: 12, rarity: 1, score: 18, desc: "濃醇香的本土牧場鮮乳。" },
    expired_milk:       { id: "expired_milk",       name: "過期鮮奶",                         type: "food", hp: 5,  sp: 15, rarity: 1, score: 10, desc: "味道有點酸酸的過期鮮奶，腸胃不好別亂喝。" },
    betel_nut:          { id: "betel_nut",          name: "檳榔",                             type: "food", hp: 5,  sp: 22, rarity: 1, score: 15, desc: "綠色的台灣口香糖，提神醒腦。" },

    // 🟢 2 階進階補品
    survival_pack:      { id: "survival_pack",      name: "黑熊防災包",                       type: "food", hp: 65, sp: 25, rarity: 2, score: 65, desc: "備有急難醫療物資的防災急救包。" },
    bitamin_wine:       { id: "bitamin_wine",       name: "維士比加米酒",                     type: "food", hp: 25, sp: 65, rarity: 2, score: 60, desc: "工地經典特調，喝完力大無窮。" },
    royal_whiskey:      { id: "royal_whiskey",      name: "皇家威士忌",                       type: "food", hp: 20, sp: 70, rarity: 2, score: 65, desc: "兌入冰水喚醒香氣的高級威士忌。" },
    kaoliang:           { id: "kaoliang",           name: "高粱酒",                           type: "food", hp: 30, sp: 60, rarity: 2, score: 65, desc: "加入祖傳配方釀造的 58 度烈酒。" },
    grilled_sausage:    { id: "grilled_sausage",    name: "碳烤香腸",                         type: "food", hp: 55, sp: 25, rarity: 2, score: 60, desc: "夜市攤販現烤的蒜味多汁香腸。" },
    sticky_rice:        { id: "sticky_rice",        name: "糯米腸",                           type: "food", hp: 50, sp: 30, rarity: 2, score: 60, desc: "塞滿飽滿糯米的古早味米腸。" },
    stinky_tofu:        { id: "stinky_tofu",        name: "脆皮臭豆腐",                       type: "food", hp: 60, sp: 20, rarity: 2, score: 60, desc: "越臭越香、外酥內嫩的黃金臭豆腐。" },
    pork_bento:         { id: "pork_bento",         name: "排骨便當",                         type: "food", hp: 55, sp: 30, rarity: 2, score: 60, desc: "醬香濃郁的古早味滷排骨便當。" },
    braised_egg:        { id: "braised_egg",        name: "滷蛋",                             type: "food", hp: 45, sp: 25, rarity: 2, score: 50, desc: "滷得入味彈牙的醬油滷蛋。" },
    milk_tea:           { id: "milk_tea",           name: "珍珠奶茶",                         type: "food", hp: 30, sp: 60, rarity: 2, score: 60, desc: "全糖少冰的台灣之光手搖飲。" },
    laxative:           { id: "laxative",           name: "瀉藥",                             type: "food", hp: 20, sp: 50, rarity: 2, score: 50, desc: "過期鮮奶加祖傳配方煉成的強效清腸劑。" },
    double_betel_nut:   { id: "double_betel_nut",   name: "雙倍特調檳榔",                     type: "food", hp: 20, sp: 65, rarity: 2, score: 65, desc: "抹上特製白灰的雙子星檳榔，瞬間回滿精神。" },

    // 🔵 3 階頂級補品（台灣價值同時為合成 5 階紅裝核心材料）
    taiwan_value:       { id: "taiwan_value",       name: "台灣價值",                         type: "food", hp: 100, sp: 100, rarity: 3, score: 160, desc: "儲值滿滿的台灣價值！食用可巨量雙回，也是合成滅世黨證的關鍵材料。" },
    energy_drink:       { id: "energy_drink",       name: "工地精神時光飲(保力達加莎莎亞)",   type: "food", hp: 60,  sp: 120, rarity: 3, score: 140, desc: "勞工界究極神飲配雙倍檳榔，體力瞬間突破極限！" },
    kavalan:            { id: "kavalan",            name: "頂級噶瑪蘭威士忌",                 type: "food", hp: 70,  sp: 110, rarity: 3, score: 145, desc: "享譽國際的台灣冠軍單一麥芽威士忌。" },
    sausage_in_sausage: { id: "sausage_in_sausage", name: "夜市大腸包小腸",                   type: "food", hp: 110, sp: 60,  rarity: 3, score: 140, desc: "碳烤香腸夾進糯米腸，夜市霸主級大補品。" },
    stinky_hotpot:      { id: "stinky_hotpot",      name: "深坑臭豆腐鍋",                     type: "food", hp: 120, sp: 50,  rarity: 3, score: 145, desc: "整鍋端上桌的麻辣深坑臭豆腐，熱騰騰大補血。" },
    legislative_bento:  { id: "legislative_bento",  name: "立院雙主菜便當",                   type: "food", hp: 115, sp: 65,  rarity: 3, score: 150, desc: "開會打架前必吃的豪華雙主菜加滷蛋便當。" },
    milktea_laxative:   { id: "milktea_laxative",   name: "早餐店通腸大冰奶",                 type: "food", hp: 80,  sp: 100, rarity: 3, score: 140, desc: "地表最強通腸神器，喝一口全身舒暢、精神百倍！" }
  }
};

window.ITEMS_FOOD = FOODS_DATA.items;
