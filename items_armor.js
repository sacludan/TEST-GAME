/**
 * 【模組：防具與飾品 items_armor.js】
 * 收錄頭部(head)、衣服(chest)、手臂(arm)、腿部(leg)、飾品(acc) 1～5 階完整裝備
 */
const ARMORS_DATA = {
  items: {
    // ==========================================
    // 💍 飾品 (acc) - 提供攻防雙加成或特殊高分
    // ==========================================
    // ⚪ 1 階
    netizen_cert:       { id: "netizen_cert",       name: "網軍資格證",       type: "acc", atk: 2,  def: 1,  rarity: 1, score: 25,  desc: "鍵盤戰士合格證書，出征帶風向必備。" },
    dirty_bracelet:     { id: "dirty_bracelet",     name: "骯髒手環",         type: "acc", atk: 0,  def: 2,  rarity: 1, score: 20,  desc: "沾滿灰塵的塑膠手環。" },
    wallpaper_stock:    { id: "wallpaper_stock",    name: "壁紙股票",         type: "acc", atk: 1,  def: 1,  rarity: 1, score: 20,  desc: "已經下市變成壁紙的古早股票。" },
    fake_gold_chain:    { id: "fake_gold_chain",    name: "假金項鍊",         type: "acc", atk: 2,  def: 0,  rarity: 1, score: 20,  desc: "夜市買的鍍金粗項鍊，戴起來很有氣勢。" },
    // 🟢 2 階
    guard_medal:        { id: "guard_medal",        name: "衛兵勳章",         type: "acc", atk: 4,  def: 3,  rarity: 2, score: 65,  desc: "表彰在網路上英勇護航的榮譽勳章。" },
    pretty_bracelet:    { id: "pretty_bracelet",    name: "漂亮手環",         type: "acc", atk: 1,  def: 5,  rarity: 2, score: 60,  desc: "洗乾淨後煥然一新的玉石手環。" },
    limit_stock:        { id: "limit_stock",        name: "漲停板股票",       type: "acc", atk: 5,  def: 2,  rarity: 2, score: 65,  desc: "用紅筆自己畫出來的漲停板，看了心情就好。" },
    peace_amulet:       { id: "peace_amulet",       name: "平安符",           type: "acc", atk: 1,  def: 6,  rarity: 2, score: 65,  desc: "紅線綁著符咒的傳統平安符。" },
    gold_medal:         { id: "gold_medal",         name: "純金金牌",         type: "acc", atk: 3,  def: 4,  rarity: 2, score: 65,  desc: "酬神用的純金打造金牌。" },
    // 🔵 3 階
    party_card:         { id: "party_card",         name: "黨證",             type: "acc", atk: 7,  def: 6,  rarity: 3, score: 130, desc: "傳說中擁有神秘豁免權的尊榮卡片。" },
    grandma_bracelet:   { id: "grandma_bracelet",   name: "阿嬤手鍊",         type: "acc", atk: 4,  def: 10, rarity: 3, score: 135, desc: "阿嬤戴了一輩子的佛珠手鍊，保佑平安。" },
    default_notice:     { id: "default_notice",     name: "違約交割單",       type: "acc", atk: 10, def: 4,  rarity: 3, score: 135, desc: "當沖失敗的慘痛證明，讓人進入背水一戰狀態。" },
    blessed_amulet:     { id: "blessed_amulet",     name: "開光護身符",       type: "acc", atk: 3,  def: 11, rarity: 3, score: 135, desc: "過過百年香爐開光的護身符，百邪不侵。" },
    // 🟡 4 階
    senior_party_card:  { id: "senior_party_card",  name: "資深黨證",         type: "acc", atk: 12, def: 10, rarity: 4, score: 240, desc: "資歷深厚的榮譽黨證，講話特別大聲。" },
    tsmc_stock_cert:    { id: "tsmc_stock_cert",    name: "護國神山股東證",   type: "acc", atk: 14, def: 9,  rarity: 4, score: 250, desc: "持有一張不賣奇蹟自來的護國神山股票證明。" },
    mazu_amulet:        { id: "mazu_amulet",        name: "鎮瀾宮大甲媽符",   type: "acc", atk: 8,  def: 16, rarity: 4, score: 250, desc: "鑲有純金金牌的大甲媽祖神符，神威護體。" },
    // 🔴 5 階
    ultimate_party_card:{ id: "ultimate_party_card",name: "滅世黨證",         type: "acc", atk: 20, def: 18, rarity: 5, score: 450, desc: "集結台灣價值與資深黨證的終極聖遺物，言出法隨！" },

    // ==========================================
    // 👕 衣服 (chest)
    // ==========================================
    // ⚪ 1 階
    sun_jacket:         { id: "sun_jacket",         name: "防曬外套",         type: "chest", def: 2,  rarity: 1, score: 20,  desc: "機車族人手一件的薄防曬外套。" },
    robe:               { id: "robe",               name: "長袍",             type: "chest", def: 3,  rarity: 1, score: 25,  desc: "寬鬆舒適的傳統布長袍。" },
    yellow_vest:        { id: "yellow_vest",        name: "發黃背心",         type: "chest", def: 1,  rarity: 1, score: 15,  desc: "領口鬆掉又泛黃的阿伯汗衫。" },
    shirt:              { id: "shirt",              name: "襯衫",             type: "chest", def: 2,  rarity: 1, score: 20,  desc: "上班族與學生的基本款白襯衫。" },
    light_raincoat:     { id: "light_raincoat",     name: "輕便雨衣",         type: "chest", def: 1,  rarity: 1, score: 18,  desc: "超商買的小飛俠透明塑膠雨衣。" },
    dunga:              { id: "dunga",              name: "吊嘎",             type: "chest", def: 2,  rarity: 1, score: 20,  desc: "台灣傳統棉質背心，透氣涼爽。" },
    // 🟢 2 階
    down_vest:          { id: "down_vest",          name: "羽絨背心",         type: "chest", def: 5,  rarity: 2, score: 55,  desc: "塞入羽毛的輕便保暖背心。" },
    taoist_robe:        { id: "taoist_robe",        name: "道士服",           type: "chest", def: 6,  rarity: 2, score: 60,  desc: "貼上符咒的開壇做法道袍。" },
    clean_vest:         { id: "clean_vest",         name: "乾淨背心",         type: "chest", def: 4,  rarity: 2, score: 50,  desc: "用清水洗得潔白如新的背心。" },
    normal_uniform:     { id: "normal_uniform",     name: "普通制服",         type: "chest", def: 5,  rarity: 2, score: 55,  desc: "繡有學號的高中生標準制服。" },
    reflective_vest:    { id: "reflective_vest",    name: "反光背心",         type: "chest", def: 5,  rarity: 2, score: 55,  desc: "工地與交管人員穿的螢光反光背心。" },
    puncture_vest:      { id: "puncture_vest",      name: "防刺背心",         type: "chest", def: 6,  rarity: 2, score: 65,  desc: "在吊嘎裡塞滿厚報紙的自製防刺衣。" },
    // 🔵 3 階
    purple_cult_robe:   { id: "purple_cult_robe",   name: "紫衣神教服",       type: "chest", def: 10, rarity: 3, score: 120, desc: "「感恩師父、讚歎師父！」充滿神秘紫光的制服。" },
    legislative_vest:   { id: "legislative_vest",   name: "立委背心",         type: "chest", def: 10, rarity: 3, score: 120, desc: "繡有大名與懇請支持的競選戰袍。" },
    ck_uniform:         { id: "ck_uniform",         name: "建中制服",         type: "chest", def: 11, rarity: 3, score: 125, desc: "卡其色榮譽制服，穿上智商與防禦同步提升。" },
    tsmc_vest:          { id: "tsmc_vest",          name: "台積工程師背心",   type: "chest", def: 11, rarity: 3, score: 130, desc: "放著奈米晶圓的工程師背心，肝指數破表。" },
    thick_iron_armor:   { id: "thick_iron_armor",   name: "加厚鐵皮衣",       type: "chest", def: 12, rarity: 3, score: 135, desc: "鑲入加厚鐵板的重型防彈防刺衣。" },
    // 🟡 4 階
    purple_down:        { id: "purple_down",        name: "紫色羽絨服",       type: "chest", def: 17, rarity: 4, score: 210, desc: "結合神教信仰與保暖羽絨的霸氣紫裝。" },
    yellow_robe:        { id: "yellow_robe",        name: "總統御用黃袍",     type: "chest", def: 18, rarity: 4, score: 220, desc: "九五之尊氣場全開的御用黃金戰袍。" },
    phd_robe:           { id: "phd_robe",           name: "博士袍",           type: "chest", def: 17, rarity: 4, score: 210, desc: "發表國際期刊論文後才能披上的榮耀博士袍。" },
    tsmc_suit:          { id: "tsmc_suit",          name: "台積電無塵衣",     type: "chest", def: 20, rarity: 4, score: 240, desc: "滴水不漏、連一顆灰塵都穿不透的高科技無塵衣。" },
    // 🔴 5 階
    grandma_jacket:     { id: "grandma_jacket",     name: "絕強阿嬤外套",     type: "chest", def: 30, rarity: 5, score: 420, desc: "「有一種冷叫阿嬤覺得你冷！」防禦力突破天際的傳說神裝。" },

    // ==========================================
    // 🪖 頭部 (head)
    // ==========================================
    // ⚪ 1 階
    melon_helmet:       { id: "melon_helmet",       name: "瓜皮安全帽",       type: "head", def: 2,  rarity: 1, score: 20,  desc: "買菜車必備的百元西瓜皮安全帽。" },
    reading_glasses:    { id: "reading_glasses",    name: "老花眼鏡",         type: "head", def: 1,  rarity: 1, score: 15,  desc: "長輩看報紙專用的放大老花眼鏡。" },
    dirty_towel:        { id: "dirty_towel",        name: "髒毛巾",           type: "head", def: 1,  rarity: 1, score: 15,  desc: "工地阿伯掛在脖子上擦汗的毛巾。" },
    sun_hat:            { id: "sun_hat",            name: "遮陽帽",           type: "head", def: 1,  rarity: 1, score: 15,  desc: "登山健行常見的遮陽帽。" },
    bamboo_hat:         { id: "bamboo_hat",         name: "斗笠",             type: "head", def: 2,  rarity: 1, score: 20,  desc: "竹編斗笠，遮陽避雨古早味。" },
    // 🟢 2 階
    sticker_helmet:     { id: "sticker_helmet",     name: "貼紙安全帽",       type: "head", def: 5,  rarity: 2, score: 55,  desc: "用膠帶與貼紙補強的半罩安全帽。" },
    wind_goggles:       { id: "wind_goggles",       name: "防風護目鏡",       type: "head", def: 4,  rarity: 2, score: 50,  desc: "老花眼鏡套上透明塑膠袋，防風防雨奇效。" },
    victory_headband:   { id: "victory_headband",   name: "必勝頭巾",         type: "head", def: 4,  rarity: 2, score: 50,  desc: "用紅筆寫上「必勝」二字的熱血頭巾。" },
    pilgrim_hat:        { id: "pilgrim_hat",        name: "進香團鴨舌帽",     type: "head", def: 4,  rarity: 2, score: 50,  desc: "插著清香的宮廟進香團橘色鴨舌帽。" },
    worker_helmet:      { id: "worker_helmet",      name: "工地安全帽",       type: "head", def: 6,  rarity: 2, score: 60,  desc: "內襯廢鐵片強化的工地防護帽。" },
    // 🔵 3 階
    wind_helmet:        { id: "wind_helmet",        name: "防風西瓜皮",       type: "head", def: 9,  rarity: 3, score: 110, desc: "加裝防風護目鏡的高規西瓜皮安全帽。" },
    scholar_hat:        { id: "scholar_hat",        name: "狀元及第帽",       type: "head", def: 8,  rarity: 3, score: 105, desc: "苦讀高級書本後煉成的文昌狀元帽。" },
    temple_cap:         { id: "temple_cap",         name: "宮廟主委帽",       type: "head", def: 9,  rarity: 3, score: 115, desc: "沾滿百年香灰的宮廟主委專屬金邊帽。" },
    steel_helmet:       { id: "steel_helmet",       name: "工地主任反光鋼盔", type: "head", def: 11, rarity: 3, score: 125, desc: "自帶探照頭燈的工地主任堅固鋼盔。" },
    // 🟡 4 階
    full_helmet:        { id: "full_helmet",        name: "正港三寶全罩盔",   type: "head", def: 16, rarity: 4, score: 200, desc: "頭頂架著行車紀錄器的全罩式安全帽，防禦滿點。" },
    phd_hat:            { id: "phd_hat",            name: "一點五個博士帽",   type: "head", def: 15, rarity: 4, score: 195, desc: "蘊含 1.5 個博士學位神秘力量的方帽。" },
    eight_generals_helm:{ id: "eight_generals_helm",name: "八家將神明官將首", type: "head", def: 17, rarity: 4, score: 215, desc: "嚼著雙倍特調檳榔、神明降駕的威猛官將首頭冠。" },
    // 🔴 5 階
    mazu_helmet:        { id: "mazu_helmet",        name: "媽祖欽點戰神金盔", type: "head", def: 26, rarity: 5, score: 400, desc: "媽祖親自開光賜福的純金戰神頭盔，萬法不侵！" },

    // ==========================================
    // 👖 腿部／褲鞋合併 (leg)
    // ==========================================
    // ⚪ 1 階
    white_slippers:     { id: "white_slippers",     name: "藍白拖",           type: "leg", def: 2,  rarity: 1, score: 20,  desc: "正宗台灣國民戰靴，能穿能打蟑螂。" },
    sports_shorts:      { id: "sports_shorts",      name: "運動短褲",         type: "leg", def: 2,  rarity: 1, score: 20,  desc: "國中生最愛的藍條紋運動短褲。" },
    grandpa_boxers:     { id: "grandpa_boxers",     name: "阿公四角褲",       type: "leg", def: 1,  rarity: 1, score: 15,  desc: "格子花紋的寬鬆阿公內褲，極度通風。" },
    rain_boots:         { id: "rain_boots",         name: "雨鞋",             type: "leg", def: 3,  rarity: 1, score: 25,  desc: "防水防泥濘的深藍色塑膠長筒雨鞋。" },
    straw_sandals:      { id: "straw_sandals",      name: "草鞋",             type: "leg", def: 1,  rarity: 1, score: 15,  desc: "古早手工編織的草鞋。" },
    // 🟢 2 階
    nonslip_slippers:   { id: "nonslip_slippers",   name: "止滑藍白拖",       type: "leg", def: 5,  rarity: 2, score: 55,  desc: "底部纏上防滑膠帶的強化藍白拖。" },
    torn_jeans:         { id: "torn_jeans",         name: "刷破牛仔褲",       type: "leg", def: 5,  rarity: 2, score: 55,  desc: "用鐵釘刮出潮流破洞的牛仔褲。" },
    scald_pants:        { id: "scald_pants",        name: "改管防燙褲",       type: "leg", def: 5,  rarity: 2, score: 55,  desc: "在大腿外側縫上廢鐵片，不怕排氣管燙傷。" },
    market_rainboots:   { id: "market_rainboots",   name: "市場防水雨鞋",     type: "leg", def: 6,  rarity: 2, score: 60,  desc: "再套上一層塑膠袋的魚市場專業防水靴。" },
    old_sneakers:       { id: "old_sneakers",       name: "破舊運動鞋",       type: "leg", def: 4,  rarity: 2, score: 50,  desc: "用繃帶綁緊鞋底的慢跑鞋。" },
    // 🔵 3 階
    enhanced_slippers:  { id: "enhanced_slippers",  name: "強化藍白拖",       type: "leg", def: 9,  rarity: 3, score: 110, desc: "鞋底釘入鐵釘，抓地力與踢人威力大增。" },
    election_jeans:     { id: "election_jeans",     name: "競選牛仔褲",       type: "leg", def: 9,  rarity: 3, score: 110, desc: "口袋塞滿選票、跑攤拜票穿不破的牛仔褲。" },
    skinny_pants:       { id: "skinny_pants",       name: "8+9緊身破褲",      type: "leg", def: 9,  rarity: 3, score: 115, desc: "掛著假金項鍊裝飾的超緊身廟口潮褲。" },
    puncture_boots:     { id: "puncture_boots",     name: "工地防穿刺雨鞋",   type: "leg", def: 10, rarity: 3, score: 120, desc: "結合暴改排氣管鋼材的防穿刺重裝雨靴。" },
    clean_slippers:     { id: "clean_slippers",     name: "竹科無塵室內拖",   type: "leg", def: 9,  rarity: 3, score: 110, desc: "植入奈米晶圓的抗靜電無塵室拖鞋。" },
    // 🟡 4 階
    studded_slippers:   { id: "studded_slippers",   name: "戰神鉚釘藍白拖",   type: "leg", def: 15, rarity: 4, score: 195, desc: "嚼著檳榔手工鍛造的鉚釘戰鬥藍白拖。" },
    village_pants:      { id: "village_pants",      name: "里長伯西裝褲",     type: "leg", def: 15, rarity: 4, score: 195, desc: "口袋放著好幾張土地權狀的隱藏富豪西裝褲。" },
    exhaust_boots:      { id: "exhaust_boots",      name: "暴走族改管防燙靴", type: "leg", def: 17, rarity: 4, score: 210, desc: "結合緊身破褲與防穿刺雨鞋的飆車族終極腿甲。" },
    // 🔴 5 階
    grandma_slippers:   { id: "grandma_slippers",   name: "阿嬤的追魂藍白拖", type: "leg", def: 26, rarity: 5, score: 400, desc: "結合戰神藍白拖與里長西裝褲，跑得快又擋得住一切攻擊！" },

    // ==========================================
    // 🧤 手臂 (arm)
    // ==========================================
    // ⚪ 1 階
    cloth_gloves:       { id: "cloth_gloves",       name: "粗布手套",         type: "arm", def: 2,  rarity: 1, score: 20,  desc: "五金行買的紅邊棉紗工作手套。" },
    iron_pot:           { id: "iron_pot",           name: "鐵鍋",             type: "arm", def: 3,  rarity: 1, score: 25,  desc: "熱炒店師傅用的大鐵鍋，背在手上當盾牌。" },
    rubber_gloves:      { id: "rubber_gloves",      name: "洗碗橡膠手套",     type: "arm", def: 2,  rarity: 1, score: 20,  desc: "粉紅色的長袖洗碗防水手套。" },
    // 🟢 2 階
    insulated_gloves:   { id: "insulated_gloves",   name: "絕緣工地手套",     type: "arm", def: 5,  rarity: 2, score: 55,  desc: "纏上厚膠帶的水電工防觸電手套。" },
    pot_shield:         { id: "pot_shield",         name: "鍋蓋圓盾",         type: "arm", def: 6,  rarity: 2, score: 60,  desc: "把鐵鍋釘上握把改造成的街頭圓盾。" },
    wind_gloves:        { id: "wind_gloves",        name: "機車防風手套",     type: "arm", def: 5,  rarity: 2, score: 55,  desc: "結合防曬外套與橡膠手套的騎士防寒手套。" },
    slip_wristband:     { id: "slip_wristband",     name: "止滑護腕",         type: "arm", def: 5,  rarity: 2, score: 55,  desc: "纏繞繃帶加固的運動止滑護腕。" },
    // 🔵 3 階
    engineer_wrist:     { id: "engineer_wrist",     name: "工程師防靜電護腕", type: "arm", def: 9,  rarity: 3, score: 110, desc: "內建電池放電迴路的精密工程護腕。" },
    protest_shield:     { id: "protest_shield",     name: "抗議透明盾",       type: "arm", def: 10, rarity: 3, score: 120, desc: "鐵板加固的鎮暴盾牌，衝撞拒馬必備。" },
    sleeve_covers:      { id: "sleeve_covers",      name: "採茶防曬袖套",     type: "arm", def: 9,  rarity: 3, score: 110, desc: "戴著漂亮手環的碎花防曬袖套。" },
    tattoo_sleeve:      { id: "tattoo_sleeve",      name: "廟口刺青包手護臂", type: "arm", def: 10, rarity: 3, score: 115, desc: "半甲包手紋身袖套，氣勢直接壓制對手。" },
    // 🟡 4 階
    engineer_armor:     { id: "engineer_armor",     name: "竹科外骨骼護臂",   type: "arm", def: 16, rarity: 4, score: 200, desc: "奈米晶圓驅動的機械動力外骨骼護臂。" },
    riot_shield:        { id: "riot_shield",        name: "立院鎮暴裝甲盾",   type: "arm", def: 17, rarity: 4, score: 210, desc: "貼有黨證加持的重型鎮暴裝甲盾，絕對防禦。" },
    ice_sleeves:        { id: "ice_sleeves",        name: "阿嬤的防曬冰絲袖套",type: "arm", def: 15, rarity: 4, score: 195, desc: "阿嬤手鍊祈福過的頂級冰絲袖套，冰涼又抗揍。" },
    // 🔴 5 階
    nano_arm:           { id: "nano_arm",           name: "護國神山奈米機械臂",type: "arm", def: 26, atk: 5, rarity: 5, score: 410, desc: "融合台灣價值與晶圓科技的傳說級奈米動力機械臂！" }
  }
};

window.ITEMS_ARMOR = ARMORS_DATA.items;
