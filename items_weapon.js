/**
 * 【資料模組：武器 items_weapon.js】
 * 收錄 1～5 階共 23 種台灣特色武器與素質
 */
const WEAPONS_DATA = {
  items: {
    // ⚪ 1 階白武
    plastic_stool:        { id: "plastic_stool",        name: "塑膠折凳",                 type: "weapon", atk: 5,  rarity: 1, score: 40,  desc: "七武器之首的雛形，藏於民居之中，隨處可見。" },
    protest_megaphone:    { id: "protest_megaphone",    name: "抗議大聲公",               type: "weapon", atk: 5,  rarity: 1, score: 45,  desc: "街頭抗議必備，貼著耳朵喊也是有物理傷害的。" },
    love_pointer:         { id: "love_pointer",         name: "愛的小手",                 type: "weapon", atk: 4,  rarity: 1, score: 35,  desc: "台灣小孩童年的共同陰影，打下去啪啪作響。" },
    wooden_stick:         { id: "wooden_stick",         name: "木棒",                     type: "weapon", atk: 6,  rarity: 1, score: 50,  desc: "路邊隨手撿來的防身木棍。" },
    rusty_cleaver:        { id: "rusty_cleaver",        name: "生鏽菜刀",                 type: "weapon", atk: 7,  rarity: 1, score: 60,  desc: "傳統市場攤販用來剁骨頭的菜刀，破傷風加成。" },
    box_cutter:           { id: "box_cutter",           name: "大支美工刀",               type: "weapon", atk: 6,  rarity: 1, score: 55,  desc: "五金行買的工業用美工刀，推到底非常鋒利。" },
    convenience_umbrella: { id: "convenience_umbrella", name: "超商摺疊傘",               type: "weapon", atk: 4,  rarity: 1, score: 40,  desc: "颱風天秒開花的超商傘，合起來戳人還是很痛。" },

    // 🟢 2 階綠武
    spiked_stool:         { id: "spiked_stool",         name: "帶釘折凳",                 type: "weapon", atk: 12, rarity: 2, score: 110, desc: "在塑膠折凳上釘滿生鏽鐵釘，殺傷力倍增。" },
    mod_megaphone:        { id: "mod_megaphone",        name: "改裝大聲公",               type: "weapon", atk: 12, rarity: 2, score: 115, desc: "換上強效電池的擴音器，高分貝音波攻擊。" },
    thick_love_pointer:   { id: "thick_love_pointer",   name: "加粗愛的小手",             type: "weapon", atk: 11, rarity: 2, score: 105, desc: "纏滿膠帶強化的愛的小手，揮起來不會斷。" },
    wolf_bat:             { id: "wolf_bat",             name: "狼牙木棒",                 type: "weapon", atk: 13, rarity: 2, score: 120, desc: "釘上鐵釘的木棒，充滿街頭火拼的暴力美學。" },
    opening_machete:      { id: "opening_machete",      name: "開山西瓜刀",               type: "weapon", atk: 15, rarity: 2, score: 140, desc: "刀身加長加固，夜市切西瓜與防身兩相宜。" },
    umbrella_sword:       { id: "umbrella_sword",       name: "超商防身傘中劍",           type: "weapon", atk: 14, rarity: 2, score: 130, desc: "將大支美工刀藏進摺疊傘柄，出其不意的暗器。" },

    // 🔵 3 階藍武
    iron_stool:           { id: "iron_stool",           name: "強化鐵皮折凳",             type: "weapon", atk: 21, rarity: 3, score: 210, desc: "包覆厚重鐵板的折凳，砸下去連安全帽都會裂。" },
    village_megaphone:    { id: "village_megaphone",    name: "里長廣播擴音器",           type: "weapon", atk: 22, rarity: 3, score: 220, desc: "「里長伯報告！」方圓五百公尺無死角精神轟炸。" },
    discipline_cane:      { id: "discipline_cane",      name: "訓導處藤條",               type: "weapon", atk: 20, rarity: 3, score: 200, desc: "訓導主任珍藏的韌性藤條，破空聲令人膽寒。" },
    aluminum_bat:         { id: "aluminum_bat",         name: "鋁合金球棒",               type: "weapon", atk: 23, rarity: 3, score: 230, desc: "輕量化鋁合金打造，揮擊速度與敲擊感極佳。" },
    shark_sword:          { id: "shark_sword",          name: "八家將鯊魚劍",             type: "weapon", atk: 25, rarity: 3, score: 250, desc: "百年香灰加持的宮廟法器，斬妖除魔威風凜凜。" },

    // 🟡 4 階黃武
    overlord_stool:       { id: "overlord_stool",       name: "霸王帶釘折凳",             type: "weapon", atk: 34, rarity: 4, score: 350, desc: "結合鐵皮與土製高爆彈的狂暴折凳，一砸即炸。" },
    ly_thunder_megaphone: { id: "ly_thunder_megaphone", name: "立院咆哮雷神大聲公",       type: "weapon", atk: 35, rarity: 4, score: 360, desc: "自帶行車紀錄器蒐證與雷鳴擴音，國會全武行神器。" },
    grandma_cane:         { id: "grandma_cane",         name: "阿嬤的愛心藤條",           type: "weapon", atk: 33, rarity: 4, score: 340, desc: "浸泡過阿嬤祖傳配方的藤條，每一鞭都是沉重的愛。" },
    taichung_bat:         { id: "taichung_bat",         name: "台中球棒",                 type: "weapon", atk: 37, rarity: 4, score: 380, desc: "焊上暴改排氣管的傳奇球棒，後車廂必備的浪漫。" },

    // 🔴 5 階紅武
    mythic_stool:         { id: "mythic_stool",         name: "弒神七武器之首(終極折凳)", type: "weapon", atk: 50, rarity: 5, score: 550, desc: "融合鋁合金球棒與霸王折凳的終極神兵，神擋殺神！" }
  }
};

window.ITEMS_WEAPON = WEAPONS_DATA.items;
