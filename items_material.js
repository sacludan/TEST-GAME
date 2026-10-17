/**
 * 【資料模組：雜物與通用合成材料 items_material.js】
 * 收錄 1～2 階所有基礎與中階合成材料
 */
const MATERIALS_DATA = {
  items: {
    // ⚪ 1 階基礎材料
    paper:            { id: "paper",            name: "紙",           type: "material", rarity: 1, score: 10, desc: "普通的白紙，可用來印選票或寫論文。" },
    pen:              { id: "pen",              name: "筆",           type: "material", rarity: 1, score: 10, desc: "滑順好寫的原子筆。" },
    red_pen:          { id: "red_pen",          name: "紅筆",         type: "material", rarity: 1, score: 12, desc: "改考卷或畫漲停板專用的紅筆。" },
    money:            { id: "money",            name: "金錢",         type: "material", rarity: 1, score: 18, desc: "白花花的新台幣鈔票，有錢能使鬼推磨。" },
    book:             { id: "book",             name: "書",           type: "material", rarity: 1, score: 12, desc: "厚重的參考書。" },
    newspaper:        { id: "newspaper",        name: "報紙",         type: "material", rarity: 1, score: 10, desc: "印滿頭條八卦的舊報紙，疊起來意外防刺。" },
    deed:             { id: "deed",             name: "地契",         type: "material", rarity: 1, score: 25, desc: "泛黃的祖傳土地契約書。" },
    jade_seal:        { id: "jade_seal",        name: "玉山印章",     type: "material", rarity: 1, score: 25, desc: "以台灣玉雕刻而成的傳家印鑑。" },
    wafer:            { id: "wafer",            name: "晶圓",         type: "material", rarity: 1, score: 20, desc: "科技園區產出的高純度矽晶圓。" },
    battery:          { id: "battery",          name: "電池",         type: "material", rarity: 1, score: 12, desc: "電力飽滿的強效電池。" },
    camera_module:    { id: "camera_module",    name: "鏡頭模組",     type: "material", rarity: 1, score: 18, desc: "高解析度光學攝影鏡頭。" },
    scrap_iron:       { id: "scrap_iron",       name: "廢鐵片",       type: "material", rarity: 1, score: 12, desc: "工業區隨處可見的厚廢鐵片。" },
    rusty_nail:       { id: "rusty_nail",       name: "生鏽鐵釘",     type: "material", rarity: 1, score: 10, desc: "尖銳的生鏽鐵釘，改造武器防具良伴。" },
    exhaust_pipe:     { id: "exhaust_pipe",     name: "機車排氣管",   type: "material", rarity: 1, score: 15, desc: "拆下來的原廠機車排氣管。" },
    tape:             { id: "tape",             name: "膠帶",         type: "material", rarity: 1, score: 10, desc: "萬能封箱膠帶，什麼都能黏。" },
    plastic_bag:      { id: "plastic_bag",      name: "塑膠袋",       type: "material", rarity: 1, score: 8,  desc: "紅白條紋傳統塑膠袋，防水防塵。" },
    lighter:          { id: "lighter",          name: "打火機",       type: "material", rarity: 1, score: 12, desc: "防風電子打火機。" },
    talisman:         { id: "talisman",         name: "符咒",         type: "material", rarity: 1, score: 12, desc: "畫有硃砂符文的黃紙。" },
    red_thread:       { id: "red_thread",       name: "紅線",         type: "material", rarity: 1, score: 12, desc: "月老殿求來的姻緣紅線。" },
    incense:          { id: "incense",          name: "香",           type: "material", rarity: 1, score: 10, desc: "檀香木製成的拜拜線香。" },
    joss_paper:       { id: "joss_paper",       name: "金紙",         type: "material", rarity: 1, score: 10, desc: "印有金箔的傳統壽金。" },
    cult_flyer:       { id: "cult_flyer",       name: "邪教宣傳單",   type: "material", rarity: 1, score: 12, desc: "印著神秘教義的傳單。" },
    ancestral_recipe: { id: "ancestral_recipe", name: "祖傳配方",     type: "material", rarity: 1, score: 35, desc: "極度稀有的阿嬤神秘秘方，全地圖僅少數掉落！" },
    feather:          { id: "feather",          name: "羽毛",         type: "material", rarity: 1, score: 10, desc: "輕盈保暖的鳥類羽毛。" },
    condom:           { id: "condom",           name: "保險套",       type: "material", rarity: 1, score: 12, desc: "彈性極佳、防水耐用的乳膠製品，野外求生意外好用。" },
    quicklime:        { id: "quicklime",        name: "石灰",         type: "material", rarity: 1, score: 10, desc: "包檳榔不可或缺的特製白灰。" },

    // 🟢 2 階合成材料
    election_ballot:  { id: "election_ballot",  name: "選票",         type: "material", rarity: 2, score: 45, desc: "決定命運的神聖選票。" },
    membership_form:  { id: "membership_form",  name: "入黨申請單",   type: "material", rarity: 2, score: 45, desc: "附上黨費鈔票的入黨申請表格。" },
    academic_paper:   { id: "academic_paper",   name: "學術論文",     type: "material", rarity: 2, score: 50, desc: "封存三十年不得借閱的神秘學術論文。" },
    advanced_book:    { id: "advanced_book",    name: "高級書本",     type: "material", rarity: 2, score: 45, desc: "寫滿重點筆記的精裝專業書。" },
    land_deed:        { id: "land_deed",        name: "土地權狀",     type: "material", rarity: 2, score: 60, desc: "蓋上玉山官印的精華區土地所有權狀。" },
    nano_wafer:       { id: "nano_wafer",       name: "奈米晶圓",     type: "material", rarity: 2, score: 55, desc: "通電封裝完成的 2 奈米頂級晶圓。" },
    iron_plate:       { id: "iron_plate",       name: "鐵板",         type: "material", rarity: 2, score: 45, desc: "用鐵釘鉚接加固的雙層厚鐵板。" },
    dash_cam:         { id: "dash_cam",         name: "行車紀錄器",   type: "material", rarity: 2, score: 50, desc: "高畫質廣角行車紀錄器，檢舉三寶神器。" },
    mod_exhaust:      { id: "mod_exhaust",      name: "暴改排氣管",   type: "material", rarity: 2, score: 50, desc: "拔掉消音塞、半夜炸街專用的直通排氣管。" },
    century_ash:      { id: "century_ash",      name: "百年香灰",     type: "material", rarity: 2, score: 50, desc: "集結香火願力的靈驗百年香灰。" },
    explosive_bomb:   { id: "explosive_bomb",   name: "土製高爆彈",   type: "material", rarity: 2, score: 55, desc: "將料理米酒點火引爆的街頭高爆彈。" }
  }
};

window.ITEMS_MATERIAL = MATERIALS_DATA.items;
