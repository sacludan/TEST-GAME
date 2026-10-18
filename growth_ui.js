/** V19.17：角色狀態欄第二頁與單頁完整角色詳情；不重建原有狀態及裝備 DOM。 */
let characterStatusPage = 0;
let characterStatusSwipeUntil = 0;

function setCharacterStatusPage(page) {
  characterStatusPage = page === 1 ? 1 : 0;
  const primary = document.getElementById('player-status-original-page');
  const growth = document.getElementById('player-status-growth-page');
  if (primary) primary.classList.toggle('hidden', characterStatusPage !== 0);
  if (growth) growth.classList.toggle('hidden', characterStatusPage !== 1);
  const dots = document.querySelectorAll('.character-status-page-dot');
  dots.forEach((dot, index) => {
    dot.setAttribute('aria-current', index === characterStatusPage ? 'page' : 'false');
    dot.classList.toggle('bg-amber-400', index === characterStatusPage);
    dot.classList.toggle('bg-slate-500', index !== characterStatusPage);
  });
}

function openCharacterStatusDetail(event) {
  if (event && (event.defaultPrevented || Date.now() < characterStatusSwipeUntil)) return;
  const modal = document.getElementById('character-status-detail-modal');
  if (!modal || !state.player) return;
  modal.classList.remove('hidden');
  renderCharacterGrowthStatus(state.player);
}

function closeCharacterStatusDetail() {
  document.getElementById('character-status-detail-modal')?.classList.add('hidden');
}

function growthSetText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = String(value);
}
function growthSetWidth(id, percent) {
  const node = document.getElementById(id);
  if (node) node.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function renderCharacterGrowthStatus(entity) {
  if (!entity) return;
  const level = getGrowthLevel(entity);
  const levelProgress = getGrowthProgress(entity.levelExp, GROWTH_LEVEL_THRESHOLDS);
  const mastery = getGrowthMastery(entity);
  const masteryProgress = getGrowthProgress(entity.masteryExp, GROWTH_MASTERY_THRESHOLDS);
  const bonus = getGrowthLevelBonus(entity);
  // 第二頁的兩條經驗條與主頁共用高度，不擠壓裝備區。
  growthSetText('status-level-label', `Lv.${level}`);
  growthSetText('status-level-exp', levelProgress.maxed ? 'MAX' : `EXP ${levelProgress.current}/${levelProgress.need}`);
  growthSetWidth('status-level-bar', levelProgress.percent);
  growthSetText('status-mastery-label', `⚔ 戰鬥熟練 ${mastery.rank}`);
  growthSetText('status-mastery-exp', masteryProgress.maxed ? 'MAX' : `${masteryProgress.current}/${masteryProgress.need}`);
  growthSetWidth('status-mastery-bar', masteryProgress.percent);

  // 詳情只有一頁，隨角色最新素質變更，沒有第二層分頁。
  const modal = document.getElementById('character-status-detail-modal');
  if (!modal || modal.classList.contains('hidden')) return;
  growthSetText('detail-character-name', entity.name);
  growthSetText('detail-character-skill', entity.skill?.name ? `✨ ${entity.skill.name}` : '');
  growthSetText('detail-hp', `${entity.hp} / ${entity.maxHp}`);
  growthSetText('detail-sp', `${entity.sp} / ${entity.maxSp}`);
  growthSetText('detail-attack', getTotalAtk(entity));
  growthSetText('detail-defense', getTotalDef(entity));
  growthSetText('detail-level', `Lv.${level}`);
  growthSetText('detail-level-progress', levelProgress.maxed ? 'MAX' : `${levelProgress.current} / ${levelProgress.need} EXP`);
  growthSetWidth('detail-level-bar', levelProgress.percent);
  growthSetText('detail-bonus-hp', `+${bonus.hp}`);
  growthSetText('detail-bonus-sp', `+${bonus.sp}`);
  growthSetText('detail-bonus-atk', `+${bonus.atk}`);
  growthSetText('detail-bonus-def', `+${bonus.def}`);
  growthSetText('detail-mastery-rank', `${mastery.rank} 級`);
  growthSetText('detail-mastery-progress', masteryProgress.maxed ? 'MAX' : `${masteryProgress.current} / ${masteryProgress.need} EXP`);
  growthSetWidth('detail-mastery-bar', masteryProgress.percent);
  growthSetText('detail-mastery-bonus', `+${mastery.bonusPercent}%`);
}

function setupCharacterStatusSwipe() {
  const panel = document.getElementById('player-status-panel');
  if (!panel || panel.dataset.swipeReady === 'yes') return;
  panel.dataset.swipeReady = 'yes';
  let start = null;
  panel.addEventListener('pointerdown', event => {
    if (event.target.closest('button') || !event.isPrimary) { start = null; return; }
    start = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }, { passive: true });
  panel.addEventListener('pointerup', event => {
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) >= 35 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      characterStatusSwipeUntil = Date.now() + 450;
      setCharacterStatusPage(dx < 0 ? 1 : 0);
    }
  }, { passive: true });
  panel.addEventListener('pointercancel', () => { start = null; }, { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupCharacterStatusSwipe, { once: true });
} else {
  setupCharacterStatusSwipe();
}
