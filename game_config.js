/**
 * 【總合配置檔 game_config.js】
 * 動態串聯地圖、合成表與四大類物品，並自動將稀有度 (1~5) 註冊至 ItemRegistry
 */
const GAME_DATA = {
  get zones() {
    return (typeof MAPS_DATA !== 'undefined' && MAPS_DATA.zones) ? MAPS_DATA.zones : [
      { id: "ly", name: "立法院", icon: "🏛️", x: 50, y: 52, drops: [] }
    ];
  },
  get recipes() {
    return (typeof RECIPES_DATA !== 'undefined' && RECIPES_DATA.recipes) ? RECIPES_DATA.recipes : [];
  },
  get items() {
    const all = Object.assign({},
      (typeof WEAPONS_DATA !== 'undefined' && WEAPONS_DATA.items) ? WEAPONS_DATA.items : {},
      (typeof ARMORS_DATA !== 'undefined' && ARMORS_DATA.items) ? ARMORS_DATA.items : {},
      (typeof MATERIALS_DATA !== 'undefined' && MATERIALS_DATA.items) ? MATERIALS_DATA.items : {},
      (typeof FOODS_DATA !== 'undefined' && FOODS_DATA.items) ? FOODS_DATA.items : {},
      (window.ITEMS_WEAPON || {}),
      (window.ITEMS_ARMOR || {}),
      (window.ITEMS_MATERIAL || {}),
      (window.ITEMS_FOOD || {})
    );
    if (typeof ItemRegistry !== 'undefined' && ItemRegistry.RARITY_MAP) {
      for (const [k, v] of Object.entries(all)) {
        if (v && v.rarity) ItemRegistry.RARITY_MAP[k] = v.rarity;
      }
    }
    return all;
  }
};

window.addEventListener("DOMContentLoaded", () => {
  const _ = GAME_DATA.items;
});
