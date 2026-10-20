/* V19.53 — 屍體視為搜刮物資池中的獨立一格；AI/玩家共用同一份屍體資料。 */
const CORPSE_EQUIPMENT_SLOTS = [
  { slot: 'weapon', label: '武器' }, { slot: 'head', label: '頭部' },
  { slot: 'chest', label: '身體' }, { slot: 'arm', label: '手部' },
  { slot: 'leg', label: '腿部' }, { slot: 'acc', label: '飾品' }
];
let activeCorpseLootId = null;
let corpseOpenedFromKill = false;

function corpseEntries(corpse) {
  if (!corpse) return [];
  const entries = [];
  for (const {slot, label} of CORPSE_EQUIPMENT_SLOTS) {
    const id = corpse.equip[slot];
    if (id && getSafeItem(id)) entries.push({ source:'equip', slot, label, id });
  }
  corpse.bag.forEach((id, index) => {
    if (getSafeItem(id)) entries.push({ source:'bag', index, label:'背包', id });
  });
  return entries;
}

function findCorpseById(id) {
  return (state.corpses || []).find(c => c.id === id) || null;
}

function corpsesInZone(zoneId) {
  return (state.corpses || []).filter(c => c.zoneId === zoneId && corpseEntries(c).length > 0);
}

// 9 件地圖道具 + 1 具屍體 = 10 個等權抽籤格；屍體內裝幾件都不影響機率。
function drawZoneLootChoice(zone, forAI = false, excludedCorpseIds = null) {
  if (!zone || !Array.isArray(zone.drops)) return null;
  const corpses = corpsesInZone(zone.id).filter(c => !excludedCorpseIds?.has(c.id));
  const total = zone.drops.length + corpses.length;
  if (total <= 0) return null;
  const index = Math.floor(Math.random() * total);
  return index < zone.drops.length
    ? { type:'item', itemIndex:index }
    : { type:'corpse', corpse:corpses[index - zone.drops.length] };
}

function createCorpseForVictim(victim) {
  if (!victim || victim.isPlayer || victim.corpseCreated || !victim.zone) return null;
  victim.corpseCreated = true;
  const equip = Object.create(null);
  for (const {slot} of CORPSE_EQUIPMENT_SLOTS) {
    equip[slot] = victim.equip?.[slot]?.id || null;
  }
  const bag = (victim.bag || []).map(value => typeof value === 'string' ? value : value?.id)
    .filter(id => id && getSafeItem(id));
  const corpse = {
    id: state.nextCorpseId++, characterId: victim.id,
    name: victim.name, zoneId: victim.zone,
    equip, bag,
  };
  if (!corpseEntries(corpse).length) return null;
  state.corpses.push(corpse);
  return corpse;
}

function removeCorpseIfEmpty(corpse) {
  if (!corpse || corpseEntries(corpse).length) return;
  state.corpses = state.corpses.filter(c => c !== corpse);
}

function isCorpseLootOpen() {
  const el = document.getElementById('corpse-loot-overlay');
  return !!el && !el.classList.contains('hidden');
}

function openCorpseLoot(corpseId, immediateKill = false) {
  const corpse = findCorpseById(corpseId);
  if (!corpse || !state.player?.alive || state.gameOver) return false;
  activeCorpseLootId = corpse.id;
  corpseOpenedFromKill = immediateKill;
  document.getElementById('corpse-loot-overlay')?.classList.remove('hidden');
  renderCorpseLoot();
  return true;
}

function corpseHtmlEscape(input) {
  return String(input ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function renderCorpseLoot() {
  const corpse = findCorpseById(activeCorpseLootId);
  const el = document.getElementById('corpse-loot-items');
  const desc = document.getElementById('corpse-loot-description');
  const portrait = document.getElementById('corpse-loot-portrait');
  if (!el || !desc) return;
  if (!corpse) {
    el.innerHTML = '<p class="text-sm text-slate-400 text-center py-5">這具屍體已經沒有物資。</p>';
    desc.textContent = '屍體已被搜刮乾淨';
    if (portrait) portrait.classList.add('hidden');
    return;
  }
  const entries = corpseEntries(corpse);
  desc.textContent = `${corpse.name} 的屍體｜${entries.length} 件剩餘物品`;
  if (portrait) {
    const url = typeof LobbyManager !== 'undefined' ? LobbyManager.characterArtworkPaths?.[corpse.characterId] : null;
    if (url && portrait.getAttribute('src') !== url) portrait.src = url;
    portrait.classList.toggle('hidden', !url);
  }
  if (!entries.length) {
    el.innerHTML = '<p class="text-sm text-slate-400 text-center py-5">屍體已被搜刮乾淨。</p>';
    return;
  }
  el.innerHTML = entries.map((entry, index) => {
    const item = getSafeItem(entry.id);
    const art = typeof getItemArtUrl === 'function' ? getItemArtUrl(entry.id) : null;
    const rarity = typeof ItemRegistry !== 'undefined' ? ItemRegistry.getRarity(entry.id) : null;
    const slot = ['weapon','head','chest','arm','leg','acc'].includes(item.type) ? item.type : null;
    const oldEquip = slot ? state.player?.equip?.[slot] : null;
    const space = (state.player?.bag?.length || 0) < 6;
    const canEquip = !!slot && (!oldEquip || space);
    const color = [null,'#64748b','#10b981','#38bdf8','#fbbf24','#fb7185'][Number(item.rarity || 0)] || '#475569';
    return `<div class="rounded-xl border bg-slate-900/85 px-2.5 py-2 flex items-center gap-2" style="border-color:${color}">
      <div class="w-11 h-11 shrink-0 rounded-lg bg-slate-950/90 flex items-center justify-center text-xl">
        ${art ? `<img src="${corpseHtmlEscape(art)}" alt="" class="max-w-full max-h-full object-contain" onerror="this.style.display='none'">` : '📦'}
      </div>
      <div class="flex-1 min-w-0"><div class="text-[10px] text-slate-400">${corpseHtmlEscape(entry.label)}</div>
        <div class="text-xs font-black text-slate-100 break-words">${corpseHtmlEscape(item.name)}</div>
        <div class="text-[10px] text-slate-500">${corpseHtmlEscape(rarity?.label || '')}</div></div>
      <div class="flex flex-col gap-1 shrink-0">
        <button type="button" onclick="takeCorpseLoot(${index},'take')" ${space?'':'disabled'} class="text-[11px] font-black rounded-md px-2.5 py-1.5 ${space?'bg-amber-500 text-slate-950':'bg-slate-700 text-slate-500'}">拾取</button>
        ${slot ? `<button type="button" onclick="takeCorpseLoot(${index},'equip')" ${canEquip?'':'disabled'} class="text-[11px] font-black rounded-md px-2.5 py-1.5 ${canEquip?'bg-sky-700 text-white':'bg-slate-700 text-slate-500'}">裝備</button>` : ''}
      </div></div>`;
  }).join('');
}

function takeCorpseLoot(index, action = 'take') {
  const corpse = findCorpseById(activeCorpseLootId);
  const player = state.player;
  if (!corpse || !player || !player.alive || state.gameOver) return;
  const entry = corpseEntries(corpse)[index];
  const item = entry && getSafeItem(entry.id);
  if (!entry || !item) return;
  const slot = ['weapon','head','chest','arm','leg','acc'].includes(item.type) ? item.type : null;
  const oldEquip = slot ? player.equip[slot] : null;
  if (action === 'take' && player.bag.length >= 6) return;
  if (action === 'equip' && (!slot || (oldEquip && player.bag.length >= 6))) return;
  if (entry.source === 'equip') corpse.equip[entry.slot] = null;
  else corpse.bag.splice(entry.index, 1);
  if (action === 'equip') {
    if (oldEquip?.id) player.bag.push(oldEquip.id);
    player.equip[slot] = { ...item, id:entry.id };
    addLog(`⚔️ 從${corpse.name}的屍體直接裝備【${item.name}】！`, 'text-amber-300');
  } else {
    player.bag.push(entry.id);
    addLog(`🎒 從${corpse.name}的屍體取得【${item.name}】！`, 'text-emerald-300');
  }
  removeCorpseIfEmpty(corpse);
  renderCorpseLoot();
  updateUI();
}

function closeCorpseLoot() {
  document.getElementById('corpse-loot-overlay')?.classList.add('hidden');
  const fromQueue = state.pendingLootQueue?.[0];
  if (fromQueue?.type === 'corpse' && fromQueue.corpseId === activeCorpseLootId) {
    state.pendingLootQueue.shift();
  }
  activeCorpseLootId = null;
  corpseOpenedFromKill = false;
  // 玩家搜刮一次三件道具時，繼續顯示尚未處理的發現物。
  if (state.pendingLootQueue?.length && !state.gameOver) renderLootChoice();
  if (state.pendingVictoryReason && !state.gameOver) {
    const reason = state.pendingVictoryReason;
    state.pendingVictoryReason = null;
    triggerGameOver(true, reason);
  }
}

function aiTakeOneCorpseItem(ai, corpse, plan) {
  if (!ai || !corpse || !ai.alive) return false;
  const entries = corpseEntries(corpse);
  if (!entries.length) { removeCorpseIfEmpty(corpse); return false; }
  // 只在實際抽到屍體後才檢視戰利品；優先考慮能升級的裝備，其他材料按需求挑選。
  const candidates = entries.map(entry => {
    const item = getSafeItem(entry.id);
    const slot = aiGetSlotOfItem(item);
    const current = slot ? ai.equip?.[slot] : null;
    const upgrade = slot && (!current || aiGearValue(item, ai) > aiGearValue(current, ai) + 0.15);
    const needed = (plan?.missingItems || []).some(id => aiResolveItemId(id) === aiResolveItemId(entry.id));
    return {entry, item, slot, current, upgrade, needed, score: (upgrade ? 1000 : 0) + (needed ? 300 : 0) + (Number(item.rarity) || 0) * 5};
  }).sort((a,b) => b.score - a.score);
  let picked = null;
  for (const found of candidates) {
    if (found.upgrade) { picked = found; break; }
    if (aiMakeBagRoom(ai, plan, found.entry.id)) { picked = found; break; }
  }
  if (!picked) return false;
  const {entry, item, slot, current, upgrade} = picked;
  if (upgrade && slot) {
    if (current?.id) {
      if (ai.bag.length < AI_MAX_BAG_SIZE || aiMakeBagRoom(ai, plan, current.id)) ai.bag.push(current.id);
      else corpse.bag.push(current.id); // 換裝不能憑空銷毀原裝備。
    }
    ai.equip[slot] = { ...item, id:entry.id };
  } else {
    ai.bag.push(entry.id);
  }
  if (entry.source === 'equip') corpse.equip[entry.slot] = null;
  else corpse.bag.splice(entry.index, 1);
  removeCorpseIfEmpty(corpse);
  ai.lastAIAction = `搜刮${corpse.name}的屍體，取得${item.name}`;
  aiEnsureBestEquipment(ai);
  return true;
}
