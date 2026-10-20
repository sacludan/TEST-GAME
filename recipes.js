/**
 * 【資料模組：合成公式 recipes.js】
 * 收錄全部 88 條修正後合成公式（確保每次合成稀有度皆嚴格提升）
 */
const RECIPES_DATA = {
  recipes: [
    // ==========================================
    // 💍 飾品 (acc)
    // ==========================================
    { result: "ultimate_party_card", materials: ["senior_party_card", "taiwan_value"],   desc: "資深黨證 + 台灣價值 ＝ 滅世黨證" },
    { result: "senior_party_card",   materials: ["party_card", "election_ballot"],       desc: "黨證 + 選票 ＝ 資深黨證" },
    { result: "party_card",          materials: ["guard_medal", "membership_form"],      desc: "衛兵勳章 + 入黨申請單 ＝ 黨證" },
    { result: "guard_medal",         materials: ["netizen_cert", "money"],               desc: "網軍資格證 + 金錢 ＝ 衛兵勳章" },

    { result: "grandma_bracelet",    materials: ["pretty_bracelet", "ancestral_recipe"], desc: "漂亮手環 + 祖傳配方 ＝ 阿嬤手鍊" },
    { result: "pretty_bracelet",     materials: ["dirty_bracelet", "water"],             desc: "骯髒手環 + 水 ＝ 漂亮手環" },

    { result: "tsmc_stock_cert",     materials: ["default_notice", "nano_wafer"],        desc: "違約交割單 + 奈米晶圓 ＝ 護國神山股東證" },
    { result: "default_notice",      materials: ["limit_stock", "land_deed"],            desc: "漲停板股票 + 土地權狀 ＝ 違約交割單" },
    { result: "limit_stock",         materials: ["wallpaper_stock", "red_pen"],          desc: "壁紙股票 + 紅筆 ＝ 漲停板股票" },

    { result: "mazu_amulet",         materials: ["blessed_amulet", "gold_medal"],        desc: "開光護身符 + 純金金牌 ＝ 鎮瀾宮大甲媽符" },
    { result: "blessed_amulet",      materials: ["peace_amulet", "century_ash"],         desc: "平安符 + 百年香灰 ＝ 開光護身符" },
    { result: "peace_amulet",        materials: ["talisman", "red_thread"],              desc: "符咒 + 紅線 ＝ 平安符" },
    { result: "gold_medal",          materials: ["fake_gold_chain", "joss_paper"],       desc: "假金項鍊 + 金紙 ＝ 純金金牌" },

    // ==========================================
    // 👕 衣服 (chest)
    // ==========================================
    { result: "grandma_jacket",      materials: ["purple_down", "grandma_bracelet"],     desc: "紫色羽絨服 + 阿嬤手鍊 ＝ 絕強阿嬤外套" },
    { result: "purple_down",         materials: ["down_vest", "purple_cult_robe"],       desc: "羽絨背心 + 紫衣神教服 ＝ 紫色羽絨服" },
    { result: "down_vest",           materials: ["feather", "sun_jacket"],               desc: "羽毛 + 防曬外套 ＝ 羽絨背心" },
    { result: "purple_cult_robe",    materials: ["taoist_robe", "cult_flyer"],           desc: "道士服 + 邪教宣傳單 ＝ 紫衣神教服" },
    { result: "taoist_robe",         materials: ["robe", "talisman"],                    desc: "長袍 + 符咒 ＝ 道士服" },

    { result: "yellow_robe",         materials: ["legislative_vest", "party_card"],      desc: "立委背心 + 黨證 ＝ 總統御用黃袍" },
    { result: "legislative_vest",    materials: ["membership_form", "clean_vest"],       desc: "入黨申請單 + 乾淨背心 ＝ 立委背心" },
    { result: "clean_vest",          materials: ["yellow_vest", "water"],                desc: "發黃背心 + 水 ＝ 乾淨背心" },

    { result: "phd_robe",            materials: ["ck_uniform", "academic_paper"],        desc: "建中制服 + 學術論文 ＝ 博士袍" },
    { result: "ck_uniform",          materials: ["normal_uniform", "advanced_book"],     desc: "普通制服 + 高級書本 ＝ 建中制服" },
    { result: "normal_uniform",      materials: ["shirt", "book"],                       desc: "襯衫 + 書 ＝ 普通制服" },

    { result: "tsmc_suit",           materials: ["tsmc_vest", "thick_iron_armor"],       desc: "台積工程師背心 + 加厚鐵皮衣 ＝ 台積電無塵衣" },
    { result: "tsmc_vest",           materials: ["reflective_vest", "nano_wafer"],       desc: "反光背心 + 奈米晶圓 ＝ 台積工程師背心" },
    { result: "reflective_vest",     materials: ["yellow_vest", "light_raincoat"],       desc: "發黃背心 + 輕便雨衣 ＝ 反光背心" },
    { result: "thick_iron_armor",    materials: ["puncture_vest", "iron_plate"],         desc: "防刺背心 + 鐵板 ＝ 加厚鐵皮衣" },
    { result: "puncture_vest",       materials: ["dunga", "newspaper"],                  desc: "吊嘎 + 報紙 ＝ 防刺背心" },

    // ==========================================
    // 🪖 頭部 (head)
    // ==========================================
    { result: "mazu_helmet",         materials: ["full_helmet", "blessed_amulet"],       desc: "正港三寶全罩盔 + 開光護身符 ＝ 媽祖欽點戰神金盔" },
    { result: "full_helmet",         materials: ["wind_helmet", "dash_cam"],             desc: "防風西瓜皮 + 行車紀錄器 ＝ 正港三寶全罩盔" },
    { result: "wind_helmet",         materials: ["sticker_helmet", "wind_goggles"],      desc: "貼紙安全帽 + 防風護目鏡 ＝ 防風西瓜皮" },
    { result: "sticker_helmet",      materials: ["melon_helmet", "tape"],                desc: "瓜皮安全帽 + 膠帶 ＝ 貼紙安全帽" },
    { result: "wind_goggles",        materials: ["reading_glasses", "plastic_bag"],      desc: "老花眼鏡 + 塑膠袋 ＝ 防風護目鏡" },

    { result: "phd_hat",             materials: ["scholar_hat", "academic_paper"],       desc: "狀元及第帽 + 學術論文 ＝ 一點五個博士帽" },
    { result: "scholar_hat",         materials: ["victory_headband", "advanced_book"],   desc: "必勝頭巾 + 高級書本 ＝ 狀元及第帽" },
    { result: "victory_headband",    materials: ["dirty_towel", "red_pen"],              desc: "髒毛巾 + 紅筆 ＝ 必勝頭巾" },

    { result: "eight_generals_helm", materials: ["temple_cap", "double_betel_nut"],      desc: "宮廟主委帽 + 雙倍特調檳榔 ＝ 八家將神明官將首" },
    { result: "temple_cap",          materials: ["pilgrim_hat", "century_ash"],          desc: "進香團鴨舌帽 + 百年香灰 ＝ 宮廟主委帽" },
    { result: "pilgrim_hat",         materials: ["sun_hat", "incense"],                  desc: "遮陽帽 + 香 ＝ 進香團鴨舌帽" },

    { result: "steel_helmet",        materials: ["worker_helmet", "battery"],            desc: "工地安全帽 + 電池 ＝ 工地主任反光鋼盔" },
    { result: "worker_helmet",       materials: ["bamboo_hat", "scrap_iron"],            desc: "斗笠 + 廢鐵片 ＝ 工地安全帽" },

    // ==========================================
    // 👖 腿部／褲鞋合併 (leg)
    // ==========================================
    { result: "grandma_slippers",    materials: ["studded_slippers", "village_pants"],   desc: "戰神鉚釘藍白拖 + 里長伯西裝褲 ＝ 阿嬤的追魂藍白拖" },
    { result: "studded_slippers",    materials: ["enhanced_slippers", "double_betel_nut"],desc: "強化藍白拖 + 雙倍特調檳榔 ＝ 戰神鉚釘藍白拖" },
    { result: "enhanced_slippers",   materials: ["nonslip_slippers", "rusty_nail"],      desc: "止滑藍白拖 + 生鏽鐵釘 ＝ 強化藍白拖" },
    { result: "nonslip_slippers",    materials: ["white_slippers", "tape"],              desc: "藍白拖 + 膠帶 ＝ 止滑藍白拖" },

    { result: "village_pants",       materials: ["election_jeans", "land_deed"],         desc: "競選牛仔褲 + 土地權狀 ＝ 里長伯西裝褲" },
    { result: "election_jeans",      materials: ["torn_jeans", "election_ballot"],       desc: "刷破牛仔褲 + 選票 ＝ 競選牛仔褲" },
    { result: "torn_jeans",          materials: ["sports_shorts", "rusty_nail"],         desc: "運動短褲 + 生鏽鐵釘 ＝ 刷破牛仔褲" },

    { result: "exhaust_boots",       materials: ["skinny_pants", "puncture_boots"],      desc: "8+9緊身破褲 + 工地防穿刺雨鞋 ＝ 暴走族改管防燙靴" },
    { result: "skinny_pants",        materials: ["scald_pants", "fake_gold_chain"],      desc: "改管防燙褲 + 假金項鍊 ＝ 8+9緊身破褲" },
    { result: "scald_pants",         materials: ["grandpa_boxers", "scrap_iron"],        desc: "阿公四角褲 + 廢鐵片 ＝ 改管防燙褲" },
    { result: "puncture_boots",      materials: ["market_rainboots", "mod_exhaust"],     desc: "市場防水雨鞋 + 暴改排氣管 ＝ 工地防穿刺雨鞋" },
    { result: "market_rainboots",    materials: ["rain_boots", "plastic_bag"],           desc: "雨鞋 + 塑膠袋 ＝ 市場防水雨鞋" },

    { result: "clean_slippers",      materials: ["old_sneakers", "nano_wafer"],          desc: "破舊運動鞋 + 奈米晶圓 ＝ 竹科無塵室內拖" },
    { result: "old_sneakers",        materials: ["straw_sandals", "bandage"],            desc: "草鞋 + 繃帶 ＝ 破舊運動鞋" },

    // ==========================================
    // ⚔️ 武器 (weapon)
    // ==========================================
    { result: "mythic_stool",        materials: ["overlord_stool", "aluminum_bat"],      desc: "霸王帶釘折凳 + 鋁合金球棒 ＝ 弒神七武器之首(終極折凳)" },
    { result: "overlord_stool",      materials: ["iron_stool", "explosive_bomb"],        desc: "強化鐵皮折凳 + 土製高爆彈 ＝ 霸王帶釘折凳" },
    { result: "iron_stool",          materials: ["spiked_stool", "iron_plate"],          desc: "帶釘折凳 + 鐵板 ＝ 強化鐵皮折凳" },
    { result: "spiked_stool",        materials: ["plastic_stool", "rusty_nail"],         desc: "塑膠折凳 + 生鏽鐵釘 ＝ 帶釘折凳" },

    { result: "ly_thunder_megaphone",materials: ["village_megaphone", "dash_cam"],       desc: "里長廣播擴音器 + 行車紀錄器 ＝ 立院咆哮雷神大聲公" },
    { result: "village_megaphone",   materials: ["mod_megaphone", "election_ballot"],    desc: "改裝大聲公 + 選票 ＝ 里長廣播擴音器" },
    { result: "mod_megaphone",       materials: ["protest_megaphone", "battery"],        desc: "抗議大聲公 + 電池 ＝ 改裝大聲公" },

    { result: "grandma_cane",        materials: ["discipline_cane", "ancestral_recipe"], desc: "訓導處藤條 + 祖傳配方 ＝ 阿嬤的愛心藤條" },
    { result: "discipline_cane",     materials: ["thick_love_pointer", "advanced_book"], desc: "加粗愛的小手 + 高級書本 ＝ 訓導處藤條" },
    { result: "thick_love_pointer",  materials: ["love_pointer", "tape"],                desc: "愛的小手 + 膠帶 ＝ 加粗愛的小手" },

    { result: "taichung_bat",        materials: ["aluminum_bat", "mod_exhaust"],         desc: "鋁合金球棒 + 暴改排氣管 ＝ 台中球棒" },
    { result: "aluminum_bat",        materials: ["wolf_bat", "iron_plate"],              desc: "狼牙木棒 + 鐵板 ＝ 鋁合金球棒" },
    { result: "wolf_bat",            materials: ["wooden_stick", "rusty_nail"],          desc: "木棒 + 生鏽鐵釘 ＝ 狼牙木棒" },

    { result: "shark_sword",         materials: ["opening_machete", "century_ash"],      desc: "開山西瓜刀 + 百年香灰 ＝ 八家將鯊魚劍" },
    { result: "opening_machete",     materials: ["rusty_cleaver", "box_cutter"],         desc: "生鏽菜刀 + 大支美工刀 ＝ 開山西瓜刀" },
    { result: "umbrella_sword",      materials: ["convenience_umbrella", "box_cutter"],  desc: "超商摺疊傘 + 大支美工刀 ＝ 超商防身傘中劍" },

    // ==========================================
    // 🧤 手臂 (arm)
    // ==========================================
    { result: "nano_arm",            materials: ["engineer_armor", "dash_cam"],         desc: "竹科外骨骼護臂 + 行車紀錄器 ＝ 護國神山奈米機械臂" },
    { result: "engineer_armor",      materials: ["engineer_wrist", "nano_wafer"],        desc: "工程師防靜電護腕 + 奈米晶圓 ＝ 竹科外骨骼護臂" },
    { result: "engineer_wrist",      materials: ["insulated_gloves", "battery"],         desc: "絕緣工地手套 + 電池 ＝ 工程師防靜電護腕" },
    { result: "insulated_gloves",    materials: ["cloth_gloves", "tape"],                desc: "粗布手套 + 膠帶 ＝ 絕緣工地手套" },

    { result: "riot_shield",         materials: ["protest_shield", "party_card"],        desc: "抗議透明盾 + 黨證 ＝ 立院鎮暴裝甲盾" },
    { result: "protest_shield",      materials: ["pot_shield", "iron_plate"],            desc: "鍋蓋圓盾 + 鐵板 ＝ 抗議透明盾" },
    { result: "pot_shield",          materials: ["iron_pot", "rusty_nail"],              desc: "鐵鍋 + 生鏽鐵釘 ＝ 鍋蓋圓盾" },

    { result: "ice_sleeves",         materials: ["sleeve_covers", "grandma_bracelet"],   desc: "採茶防曬袖套 + 阿嬤手鍊 ＝ 阿嬤的防曬冰絲袖套" },
    { result: "sleeve_covers",       materials: ["wind_gloves", "pretty_bracelet"],      desc: "機車防風手套 + 漂亮手環 ＝ 採茶防曬袖套" },
    { result: "wind_gloves",         materials: ["rubber_gloves", "sun_jacket"],         desc: "洗碗橡膠手套 + 防曬外套 ＝ 機車防風手套" },

    { result: "tattoo_sleeve",       materials: ["slip_wristband", "double_betel_nut"],  desc: "止滑護腕 + 雙倍特調檳榔 ＝ 廟口刺青包手護臂" },
    { result: "slip_wristband",      materials: ["cloth_gloves", "bandage"],             desc: "粗布手套 + 繃帶 ＝ 止滑護腕" },

    // ==========================================
    // 🍱 食物補品 (food)
    // ==========================================
    { result: "taiwan_value",        materials: ["survival_pack", "money"],              desc: "黑熊防災包 + 金錢 ＝ 台灣價值" },
    { result: "survival_pack",       materials: ["bandage", "condom"],                   desc: "繃帶 + 保險套 ＝ 黑熊防災包" },

    { result: "energy_drink",        materials: ["bitamin_wine", "double_betel_nut"],    desc: "維士比加米酒 + 雙倍特調檳榔 ＝ 工地精神時光飲(保力達加莎莎亞)" },
    { result: "bitamin_wine",        materials: ["polydar", "cooking_wine"],             desc: "保力達B + 料理米酒 ＝ 維士比加米酒" },

    { result: "kavalan",             materials: ["royal_whiskey", "kaoliang"],           desc: "皇家威士忌 + 高粱酒 ＝ 頂級噶瑪蘭威士忌" },
    { result: "royal_whiskey",       materials: ["whiskey", "water"],                    desc: "威士忌 + 水 ＝ 皇家威士忌" },
    { result: "kaoliang",            materials: ["cooking_wine", "ancestral_recipe"],    desc: "料理米酒 + 祖傳配方 ＝ 高粱酒" },

    { result: "sausage_in_sausage",  materials: ["grilled_sausage", "sticky_rice"],      desc: "碳烤香腸 + 糯米腸 ＝ 夜市大腸包小腸" },
    { result: "grilled_sausage",     materials: ["pork", "garlic"],                      desc: "生豬肉 + 蒜頭 ＝ 碳烤香腸" },
    { result: "sticky_rice",         materials: ["rice", "pork"],                        desc: "白米 + 生豬肉 ＝ 糯米腸" },

    { result: "stinky_hotpot",       materials: ["stinky_tofu", "iron_pot"],             desc: "脆皮臭豆腐 + 鐵鍋 ＝ 深坑臭豆腐鍋" },
    { result: "stinky_tofu",         materials: ["tofu", "cult_flyer"],                  desc: "豆腐 + 邪教宣傳單 ＝ 脆皮臭豆腐" },

    { result: "legislative_bento",   materials: ["pork_bento", "braised_egg"],           desc: "排骨便當 + 滷蛋 ＝ 立院雙主菜便當" },
    { result: "pork_bento",          materials: ["rice", "soy_sauce"],                   desc: "白米 + 醬油 ＝ 排骨便當" },
    { result: "braised_egg",         materials: ["egg", "soy_sauce"],                    desc: "雞蛋 + 醬油 ＝ 滷蛋" },

    { result: "milktea_laxative",    materials: ["milk_tea", "laxative"],                desc: "珍珠奶茶 + 瀉藥 ＝ 早餐店通腸大冰奶" },
    { result: "milk_tea",            materials: ["black_tea", "fresh_milk"],             desc: "紅茶 + 鮮奶 ＝ 珍珠奶茶" },
    { result: "laxative",            materials: ["expired_milk", "ancestral_recipe"],    desc: "過期鮮奶 + 祖傳配方 ＝ 瀉藥" },

    { result: "double_betel_nut",    materials: ["betel_nut", "quicklime"],              desc: "檳榔 + 石灰 ＝ 雙倍特調檳榔" },

    // ==========================================
    // 🔩 雜物與通用合成材料 (material)
    // ==========================================
    { result: "election_ballot",     materials: ["paper", "pen"],                        desc: "紙 + 筆 ＝ 選票" },
    { result: "membership_form",     materials: ["paper", "money"],                      desc: "紙 + 金錢 ＝ 入黨申請單" },
    { result: "academic_paper",      materials: ["paper", "book"],                       desc: "紙 + 書 ＝ 學術論文" },
    { result: "advanced_book",       materials: ["book", "pen"],                         desc: "書 + 筆 ＝ 高級書本" },
    { result: "land_deed",           materials: ["deed", "jade_seal"],                   desc: "地契 + 玉山印章 ＝ 土地權狀" },
    { result: "nano_wafer",          materials: ["wafer", "battery"],                    desc: "晶圓 + 電池 ＝ 奈米晶圓" },
    { result: "iron_plate",          materials: ["scrap_iron", "rusty_nail"],            desc: "廢鐵片 + 生鏽鐵釘 ＝ 鐵板" },
    { result: "dash_cam",            materials: ["battery", "camera_module"],            desc: "電池 + 鏡頭模組 ＝ 行車紀錄器" },
    { result: "mod_exhaust",         materials: ["exhaust_pipe", "scrap_iron"],          desc: "機車排氣管 + 廢鐵片 ＝ 暴改排氣管" },
    { result: "century_ash",         materials: ["incense", "joss_paper"],               desc: "香 + 金紙 ＝ 百年香灰" },
    { result: "explosive_bomb",      materials: ["lighter", "cooking_wine"],             desc: "打火機 + 料理米酒 ＝ 土製高爆彈" }
  ]
};

window.GAME_RECIPES = RECIPES_DATA.recipes;
if (typeof GAME_DATA !== 'undefined') {
  GAME_DATA.recipes = RECIPES_DATA.recipes;
}
