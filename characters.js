/**
 * 【模組：角色與技能資料庫 characters.js】
 * v58：完整收錄 9 位台灣傳奇角色與主被動設定（開局空背包）
 */
const GAME_CHARACTERS = {
  zhugouliang: {
    id: "zhugouliang",
    name: "豬勾亮",
    title: "戲耍干擾型",
    baseAtk: 13,
    baseDef: 11,
    maxHp: 118,
    hp: 118,
    maxSp: 135,
    sp: 135,
    alive: true,
    zone: "ly",
    bag: [],
    equip: { weapon: null, head: null, chest: null, arm: null, leg: null, acc: null },
    skill: {
      name: "歌廳秀",
      icon: "🎤",
      cd: 30,
      costSp: 25,
      combatOnly: true,
      desc: "定身對手 6 秒；對手定身期間受到的攻擊傷害 +20%"
    },
    passive: {
      name: "豬大哥沒死",
      desc: "被擊敗時恢復 30% 血量並瞬移到其他安全區域（每局限 1 次）"
    }
  },

  hanguoyu: {
    id: "hanguoyu",
    name: "韓國魚",
    title: "尋寶發育型",
    baseAtk: 13,
    baseDef: 13,
    maxHp: 124,
    hp: 124,
    maxSp: 110,
    sp: 110,
    alive: true,
    zone: "ly",
    bag: [],
    equip: { weapon: null, head: null, chest: null, arm: null, leg: null, acc: null },
    skill: {
      name: "發大財！",
      icon: "💰",
      cd: 35,
      costSp: 20,
      combatOnly: false,
      desc: "一次搜刮直接爆出 3 個道具"
    },
    passive: {
      name: "禿子跟著月亮走",
      desc: "有人進入你所在區域時警告；觸發後 10 秒內雙向搜刮遇敵率從 65% 降到 35%（冷卻 30 秒，玩家與 NPC 通用）"
    }
  },

  kewenzhe: {
    id: "kewenzhe",
    name: "科文哲",
    title: "越戰越勇型",
    baseAtk: 14,
    baseDef: 14,
    maxHp: 135,
    hp: 135,
    maxSp: 105,
    sp: 105,
    alive: true,
    zone: "ly",
    bag: [],
    equip: { weapon: null, head: null, chest: null, arm: null, leg: null, acc: null },
    skill: {
      name: "飛輪衝撞",
      icon: "🚲",
      cd: 20,
      costSp: 20,
      combatOnly: true,
      desc: "根據當前生命值比例造成 1.5～2 倍傷害（血越少攻擊力越高）"
    },
    passive: {
      name: "我不會屈服的",
      desc: "每被攻擊 3 次，立即恢復自身 12 點生命值"
    }
  },

  laixiangde: {
    id: "laixiangde",
    name: "賴祥德",
    title: "成長壓制型",
    baseAtk: 13,
    baseDef: 13,
    maxHp: 126,
    hp: 126,
    maxSp: 115,
    sp: 115,
    alive: true,
    zone: "ly",
    bag: [],
    equip: { weapon: null, head: null, chest: null, arm: null, leg: null, acc: null },
    skill: {
      name: "打掉雜質",
      icon: "🧹",
      cd: 25,
      costSp: 25,
      combatOnly: true,
      desc: "造成 1 倍傷害並將對手打離這個地圖（不會打進禁區或即將封禁地圖）"
    },
    passive: {
      name: "做功德",
      desc: "每使用一次主動技功德值+3（每點功德值+1攻擊力，最多15點）"
    }
  },

  chenaguan: {
    id: "chenaguan",
    name: "陳阿館",
    title: "超猛戰士型",
    baseAtk: 16,
    baseDef: 12,
    maxHp: 138,
    hp: 138,
    maxSp: 95,
    sp: 95,
    alive: true,
    zone: "ly",
    bag: [],
    equip: { weapon: null, head: null, chest: null, arm: null, leg: null, acc: null },
    skill: {
      name: "三槍",
      icon: "🔫",
      cd: 30,
      costSp: 25,
      combatOnly: true,
      desc: "連續攻擊 3 次，但接下來 15 秒內攻擊力減半"
    },
    passive: {
      name: "幫我開直播",
      desc: "生命值低於 35% 時，立即回復 25 HP/SP 並獲得 8 秒防禦 +6（CD 40秒）"
    }
  },

  yazhoutongshen: {
    id: "yazhoutongshen",
    name: "亞洲桶神",
    title: "反傷重坦型",
    baseAtk: 12,
    baseDef: 15,
    maxHp: 142,
    hp: 142,
    maxSp: 92,
    sp: 92,
    alive: true,
    zone: "ly",
    bag: [],
    equip: { weapon: null, head: null, chest: null, arm: null, leg: null, acc: null },
    skill: {
      name: "乾你老師奈德麗",
      icon: "🛡️",
      cd: 25,
      costSp: 20,
      combatOnly: false,
      desc: "接下來 8 秒受到攻擊傷害 -25%，最多反彈 2 次受到的原始傷害（100%）"
    },
    passive: {
      name: "鼎王吃到飽",
      desc: "食物補血效果 +20%"
    }
  },

  chaoge: {
    id: "chaoge",
    name: "超哥",
    title: "同區破防型",
    baseAtk: 16,
    baseDef: 11,
    maxHp: 125,
    hp: 125,
    maxSp: 100,
    sp: 100,
    alive: true,
    zone: "ly",
    bag: [],
    equip: { weapon: null, head: null, chest: null, arm: null, leg: null, acc: null },
    skill: {
      name: "超派鐵拳",
      icon: "👊",
      cd: 20,
      costSp: 20,
      combatOnly: true,
      desc: "造成一次 1.5 倍攻擊力傷害"
    },
    passive: {
      name: "超派～",
      desc: "讓處於同地區的其他角色防禦力降低 20%"
    }
  },

  wangshijian: {
    id: "wangshijian",
    name: "王世間",
    title: "潛行發育型",
    baseAtk: 14,
    baseDef: 12,
    maxHp: 120,
    hp: 120,
    maxSp: 125,
    sp: 125,
    alive: true,
    zone: "ly",
    bag: [],
    equip: { weapon: null, head: null, chest: null, arm: null, leg: null, acc: null },
    skill: {
      name: "Over my dead body",
      icon: "👻",
      cd: 35,
      costSp: 25,
      combatOnly: false,
      desc: "12 秒內不會被別人搜到也搜不到其他人（12秒結束後才開始算冷卻）"
    },
    passive: {
      name: "從從容容",
      desc: "主動技隱蔽期間，每次搜刮只需 0.5 秒（玩家與 AI 都適用）"
    }
  },

  jiangwanan: {
    id: "jiangwanan",
    name: "蔣晚安",
    title: "規避防守型",
    baseAtk: 13,
    baseDef: 14,
    maxHp: 128,
    hp: 128,
    maxSp: 110,
    sp: 110,
    alive: true,
    zone: "ly",
    bag: [],
    equip: { weapon: null, head: null, chest: null, arm: null, leg: null, acc: null },
    skill: {
      name: "生生喝鮮乳",
      icon: "🥛",
      cd: 25,
      costSp: 20,
      combatOnly: false,
      desc: "立即恢復 20 點生命值，並在接下來 10 秒內防禦力 +5"
    },
    passive: {
      name: "問A答B",
      desc: "自動閃躲下一次受到的攻擊（觸發後冷卻 30 秒）"
    }
  }
};
