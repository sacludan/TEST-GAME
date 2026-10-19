/* AI 平衡實驗室的獨立前端，僅解析 Worker 實際回傳的統計值。 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const start = $('start'), stop = $('stop'), count = $('count');
  const progressArea = $('progress-area'), progressFill = $('progress-fill'), progressBar = $('progress-bar');
  let jobs = [], running = false, abortRequested = false, report = null, currentSettings = null, baseline = null, sortBy = 'winRate', desc = true;
  const heroes = (typeof GAME_CHARACTERS !== 'undefined') ? GAME_CHARACTERS : {};
  function setupSkills() {
    $('skill-list').innerHTML = Object.values(heroes).map(h => `
      <div class="skill-card"><div class="skill-name">${escapeHTML(h.name)}</div>
        <label class="skill-toggle"><input class="skill-switch" type="checkbox" data-id="${escapeHTML(h.id)}" data-skill="active" checked>
          <span><strong>主動：${escapeHTML(h.skill.name)}</strong><small>${escapeHTML(h.skill.desc || '')}</small></span></label>
        <label class="skill-toggle"><input class="skill-switch" type="checkbox" data-id="${escapeHTML(h.id)}" data-skill="passive" checked>
          <span><strong>被動：${escapeHTML(h.passive.name)}</strong><small>${escapeHTML(h.passive.desc || '')}</small></span></label>
      </div>`).join('');
    document.querySelectorAll('.skill-switch').forEach(el => el.addEventListener('change', updateSkillSummary));
    updateSkillSummary();
  }
  function getSwitches() {
    const switches={};
    Object.keys(heroes).forEach(id => switches[id]={active:true,passive:true});
    document.querySelectorAll('.skill-switch').forEach(el => {if(switches[el.dataset.id]) switches[el.dataset.id][el.dataset.skill]=el.checked;});
    return switches;
  }
  function updateSkillSummary() {
    const sw=getSwitches();
    const disabled=Object.entries(sw).flatMap(([id,v])=>[
      ...(!v.active ? [`${heroes[id].name}【${heroes[id].skill.name}】`] : []),
      ...(!v.passive ? [`${heroes[id].name}【${heroes[id].passive.name}】`] : [])
    ]);
    $('skill-summary').textContent=disabled.length ? `關閉 ${disabled.length} 項：${disabled.join('、')}` : '目前 18 項技能全部啟用（正式版狀態）。';
  }
  function toggleAll(type,flag) {
    document.querySelectorAll('.skill-switch').forEach(el => {if(type==='all'||el.dataset.skill===type) el.checked=flag;});
    updateSkillSummary();
  }
  function updateBaselineInfo() {
    const switches=baseline?.settings.skillSwitches || {};
    const disabled=Object.values(switches).reduce((n,v)=>n+(v.active===false?1:0)+(v.passive===false?1:0),0);
    $('baseline-info').textContent=baseline
      ? `★ 比較基準：${baseline.report.completed} 場、種子 ${baseline.settings.seed}、關閉 ${disabled} 項技能。表格顯示相對基準的冠軍率差（百分點）；建議兩次測試使用相同場數、難度與種子。`
      : '尚未設定比較基準。先跑全開測試，按「設為比較基準」，再關閉技能重新測試。';
    $('clear-baseline').disabled=!baseline;
  }
  function baselineDelta(row) {
    const ref=baseline?.report.roster.find(r=>r.id===row.id);
    if(!ref) return '';
    const d=row.winRate-ref.winRate;
    return `<div class="compare-delta">較基準 ${d>0?'+':''}${num(d,2)} 百分點</div>`;
  }

  const num = (value, decimals=1) => Number(value || 0).toFixed(decimals);
  const integer = value => Math.round(value).toLocaleString('zh-TW');
  function escapeHTML(value) { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function message(text, error=false) {
    $('message').textContent = text;
    $('message').className = error ? 'status-error' : 'hint';
  }
  function busy(flag) {
    start.disabled = flag; stop.disabled = !flag;
    count.disabled = flag; $('seed').disabled = flag; $('difficulty').disabled = flag; $('cores').disabled = flag;
    document.querySelectorAll('[data-count]').forEach(el => el.disabled=flag);
    document.querySelectorAll('.skill-switch').forEach(el=>el.disabled=flag);
    ['all-on','all-actives-off','all-passives-off'].forEach(id=>$(id).disabled=flag);
    $('save-baseline').disabled=flag || !report;
    $('clear-baseline').disabled=flag || !baseline;
  }
  function progress(completed, total) {
    progressArea.classList.add('show');
    const pct = Math.min(100, Math.round(100*completed/Math.max(1,total)));
    progressFill.style.width = pct + '%';
    progressBar.setAttribute('aria-valuenow',String(pct));
    $('progress-label').textContent = `已完成 ${integer(completed)} / ${integer(total)} 場`;
    $('progress-percent').textContent = pct + '%';
  }
  // Wilson interval for a binomial sample. Use as uncertainty display, not a pairwise significance test.
  function wilson(wins, trials) {
    if (!trials) return [0,100];
    const z=1.96, p=wins/trials, den=1+z*z/trials;
    const mid=(p+z*z/(2*trials))/den;
    const margin=z*Math.sqrt((p*(1-p)+z*z/(4*trials))/trials)/den;
    return [Math.max(0,(mid-margin)*100),Math.min(100,(mid+margin)*100)];
  }
  function makeRows() {
    if (!report) return;
    const rows=[...report.roster].sort((a,b)=>{
      const delta=a[sortBy]-b[sortBy];
      return (desc ? -1 : 1)*delta || a.name.localeCompare(b.name,'zh-TW');
    });
    $('roster-body').innerHTML=rows.map(r=>{
      const [low,high]=wilson(r.wins,r.games);
      return `<tr>
        <td><span class="name">${escapeHTML(r.name)}</span><div class="sub">${integer(r.wins)} 勝 / ${integer(r.games)} 場</div></td>
        <td title="95% Wilson 區間 ${num(low)}～${num(high)}%"><span class="pct"><span>${num(r.winRate)}%</span><span class="tinybar"><i style="width:${Math.min(100,r.winRate)}%"></i></span></span><div class="sub">95%：${num(low)}–${num(high)}%</div>${baselineDelta(r)}</td>
        <td>${num(r.rank,2)}</td><td>${num(r.top3Rate)}%</td><td>${num(r.survival,0)}s</td>
        <td>${num(r.damageDealt,0)}</td><td>${num(r.kills,2)}</td><td>${num(r.healing,0)}</td>
        <td>${num(r.skills,1)}</td><td>${num(r.loots,1)}</td><td>${num(r.equipScore,0)}</td>
      </tr>`;
    }).join('');
  }
  function graph(container, items, labelKey, winsKey, gamesKey) {
    const max = Math.max(11.11,...items.map(r=>100*r[winsKey]/Math.max(1,r[gamesKey])));
    container.innerHTML=items.map(r=>{
      const pct=100*r[winsKey]/Math.max(1,r[gamesKey]);
      return `<div class="brow"><span>${escapeHTML(String(r[labelKey]))}</span><div class="track"><div class="fill" style="width:${100*pct/max}%"></div></div><strong>${num(pct)}% <small class="sub">(${r[winsKey]}/${r[gamesKey]})</small></strong></div>`;
    }).join('');
  }
  function render() {
    if(!report) return;
    $('s-games').textContent=integer(report.completed);
    $('s-duration').textContent=num(report.avgSeconds,0)+'s';
    $('s-draws').textContent=integer(report.draws);
    makeRows();
    graph($('chart-win'),[...report.roster].sort((a,b)=>b.winRate-a.winRate),'name','wins','games');
    graph($('chart-order'),report.rankWins.map((r,i)=>({...r,label:'第 '+(i+1)+' 位'})),'label','wins','games');
    const n=report.completed;
    const zero=report.roster.filter(r=>r.skills===0).map(r=>r.name);
    const maxPosition=report.rankWins.reduce((acc,r,i)=>r.games&&r.wins/r.games>acc.rate?{place:i+1,rate:r.wins/r.games}:acc,{place:0,rate:-1});
    const analysis=[];
    if(n<90) analysis.push(`目前僅 ${n} 場，樣本不足以穩定評估角色強弱。建議至少 90 場，再視差異擴充至 900 場。`);
    else analysis.push(`${n} 場完整模擬已完成；建議配合個別角色的 95% 勝率區間與平均名次判讀，而非只依冠軍率排序。`);
    if(zero.length) analysis.push(`目前沒有觀察到主動技能成功施放的角色：${zero.join('、')}；可能是 AI 不會使用、觸發條件罕見或樣本不足。`);
    if(report.draws) analysis.push(`${report.draws} 場沒有單一冠軍，可能為終局風暴同時淘汰；這些場次仍納入勝率分母。`);
    if(maxPosition.place&&n>=90) analysis.push(`目前第 ${maxPosition.place} 執行順位的獲勝比例較高（${num(maxPosition.rate*100)}%），但是否為固定先後手優勢仍需重複實驗。`);
    $('insight').textContent=analysis.join(' ');
  }
  // 並行模擬：各 Worker 負責互不重複的全域場次；合併原始勝場、場次與加權平均。
  const meanFields = ['rank','survival','damageDealt','damageTaken','skills','reflected',
    'healing','hits','dodges','crafts','loots','moves','foodUses','equipScore',
    'equipRarity','level','kills','pigSaved'];
  function combineReports(reports) {
    const output = {roster:[],rankWins:Array.from({length:9},()=>({games:0,wins:0})),
      draws:0,completed:0,avgSeconds:0};
    const byId = new Map();
    let secondsSum=0;
    for(const r of reports) {
      output.draws += r.draws;
      output.completed += r.completed;
      secondsSum += r.avgSeconds * r.completed;
      r.rankWins.forEach((pos,i)=>{output.rankWins[i].games+=pos.games;output.rankWins[i].wins+=pos.wins;});
      for(const row of r.roster) {
        let dest = byId.get(row.id);
        if(!dest) {
          dest={id:row.id,name:row.name,games:0,wins:0,top3:0};
          meanFields.forEach(k=>dest[k]=0);
          byId.set(row.id,dest);
        }
        dest.games+=row.games;dest.wins+=row.wins;dest.top3+=row.top3;
        for(const k of meanFields) dest[k]+=row[k]*row.games;
      }
    }
    output.avgSeconds=output.completed?secondsSum/output.completed:0;
    output.roster=[...byId.values()].map(t=>{
      const n=Math.max(1,t.games);
      for(const k of meanFields) t[k]/=n;
      t.winRate=100*t.wins/n;
      t.top3Rate=100*t.top3/n;
      return t;
    });
    return output;
  }
  function recommendedCores(n) {
    const logical=Math.max(1,Number(navigator.hardwareConcurrency)||2);
    let max=Math.min(6,Math.max(1,Math.floor(logical/2)));
    if(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent||'')) max=Math.min(max,2);
    if(Number(navigator.deviceMemory)>0 && navigator.deviceMemory<=4) max=Math.min(max,2);
    // 小樣本不必浪費時間載入多份引擎；每增加一個 Worker 至少 30 場。
    return Math.min(max,Math.max(1,Math.floor(n/30)));
  }
  function chosenCores(n) {
    const requested=$('cores').value;
    return requested==='auto'?recommendedCores(n):Math.min(n,Math.max(1,Number(requested)||1));
  }
  function showCores() {
    const n=Math.max(1,Math.floor(Number(count.value)||9));
    const known=navigator.hardwareConcurrency;
    const workerCount=chosenCores(n);
    $('core-info').textContent=`${known?`偵測到 ${known} 個邏輯執行緒`:'無法偵測核心數，採保守配置'} · 這次使用 ${workerCount} 個 Worker。各 Worker 在獨立執行緒跑完整對局，種子與勝率不會因核心數而改變。`;
  }
  function cleanupJobs() {
    jobs.forEach(j=>{try{j.worker.terminate();}catch(e){}});
    jobs=[];running=false;abortRequested=false;busy(false);showCores();
  }
  function updateOverallProgress(total) {
    const done=jobs.reduce((sum,j)=>sum+j.completed,0);
    progress(done,total);
    $('message').textContent=abortRequested
      ? `正在停止：目前完成 ${integer(done)} 場，會保留已完成的數據。`
      : `正在使用 ${jobs.length} 個 Worker 同時模擬：已完成 ${integer(done)} 場。`;
  }
  function completeIfAllDone() {
    if(!running || jobs.some(j=>!j.done)) return;
    const reports=jobs.filter(j=>j.report).map(j=>j.report);
    report=combineReports(reports);
    progress(report.completed,currentSettings.requested);
    currentSettings={...currentSettings,completed:report.completed,cancelled:abortRequested};
    const wasCancelled=abortRequested;
    cleanupJobs();
    message(wasCancelled?`已停止：保留已完成的 ${report.completed} 場數據。`:`已完成 ${report.completed} 場！可查看數據或匯出 CSV／JSON。`);
    render();
    $('csv').disabled=!report.completed;$('json').disabled=!report.completed;$('save-baseline').disabled=!report.completed;
  }
  function launch() {
    if(running) return;
    const n=Math.floor(Number(count.value));
    const rawSeed=Number($('seed').value);
    if(!Number.isInteger(n)||n<1||n>10000) return message('場次請輸入 1～10,000 的整數。',true);
    if(!Number.isInteger(rawSeed)||rawSeed<1||rawSeed>4294967295) return message('隨機種子請輸入 1～4,294,967,295 的整數。',true);
    if(typeof Worker==='undefined') return message('這個瀏覽器不支援 Web Worker，無法執行模擬。',true);
    const skillSwitches=getSwitches();
    const workerCount=chosenCores(n);
    report=null;currentSettings={seed:rawSeed,requested:n,difficulty:$('difficulty').value,
      skillSwitches,parallelMode:$('cores').value,workersUsed:workerCount};
    $('csv').disabled=true;$('json').disabled=true;$('save-baseline').disabled=true;
    $('roster-body').innerHTML='<tr><td colspan="11" class="placeholder">模擬中，完成後會顯示實際結果…</td></tr>';
    $('chart-win').innerHTML='<div class="placeholder">模擬中</div>';
    $('chart-order').innerHTML='<div class="placeholder">模擬中</div>';
    ['s-games','s-duration','s-draws'].forEach(id=>$(id).textContent='—');
    $('insight').textContent='模擬進行中，資料完成後才會顯示；不會用預估勝率冒充實際結果。';
    running=true;abortRequested=false;busy(true);progress(0,n);
    message(`準備使用 ${workerCount} 個 Worker 模擬 ${n} 場。`);
    // 預先配置所有工作，避免第一個 Worker 太快完成時提早結算。
    try {
      jobs=[];
      for(let i=0;i<workerCount;i++) {
        const startIndex=Math.floor(i*n/workerCount);
        const endIndex=Math.floor((i+1)*n/workerCount);
        const worker=new Worker('balance_worker.js?v=5');
        jobs.push({worker,startIndex,count:endIndex-startIndex,completed:0,done:false,report:null});
      }
    } catch(e) {
      cleanupJobs();message('無法啟動 Worker：請透過網站或本機 HTTP 伺服器開啟 balance.html。'+e.message,true);return;
    }
    for(const job of jobs) {
      const w=job.worker;
      w.onmessage=({data})=>{
        if(!running || job.done) return;
        if(data.type==='progress') {
          job.completed=Math.min(job.count,data.completed);
          updateOverallProgress(n);
        } else if(data.type==='error') {
          const errorMsg=data.message;
          cleanupJobs();message('模擬發生錯誤：'+errorMsg,true);
        } else if(data.type==='done') {
          job.report=data.report;
          job.completed=data.report.completed;
          job.done=true;
          w.terminate();
          updateOverallProgress(n);
          completeIfAllDone();
        }
      };
      w.onerror=e=>{
        if(!running)return;
        const detail=e.message||'請確認測試器 JS 檔案已正確上傳且使用 HTTP/HTTPS。';
        cleanupJobs();message('Worker 無法載入：'+detail,true);
      };
      w.postMessage({type:'start',count:job.count,startIndex:job.startIndex,
        seed:rawSeed,difficulty:currentSettings.difficulty,skillSwitches});
    }
  }
  function csvCell(x) { return '"'+String(x??'').replace(/"/g,'""')+'"'; }
  function download(filename,body,type) {
    const blob=new Blob([body],{type});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function exportCsv() {
    if(!report)return;
    const headers=['角色ID','角色','參戰場次','冠軍場次','冠軍率%','冠軍率95%下限','冠軍率95%上限','前三率%','平均名次','平均存活秒數','平均造成傷害','平均承受傷害','平均擊殺數','平均實際回血','平均技能次數','平均命中','平均閃避','平均反傷','平均搜刮件數','平均合成次數','平均移動次數','平均食物使用','終局裝備分數','終局裝備稀有度合計','終局等級','免死觸發比例','相對比較基準冠軍率差（百分點）'];
    const rows=report.roster.map(r=>{
      const bounds=wilson(r.wins,r.games);
      return [r.id,r.name,r.games,r.wins,r.winRate,...bounds,r.top3Rate,r.rank,r.survival,r.damageDealt,r.damageTaken,r.kills,r.healing,r.skills,r.hits,r.dodges,r.reflected,r.loots,r.crafts,r.moves,r.foodUses,r.equipScore,r.equipRarity,r.level,r.pigSaved,baseline? r.winRate-(baseline.report.roster.find(x=>x.id===r.id)?.winRate ?? 0) : ''];
    });
    const pos=report.rankWins.map((r,i)=>['順位 '+(i+1),'',r.games,r.wins,r.games?100*r.wins/r.games:0]);
    const metadata=[['設定','場數',currentSettings.requested,'難度',currentSettings.difficulty,'種子',currentSettings.seed,'Worker數',currentSettings.workersUsed,'模式',currentSettings.parallelMode],
      ['技能開關(JSON)',JSON.stringify(currentSettings.skillSwitches)],
      ['結果','完成',report.completed,'無冠軍',report.draws]];
    if(baseline) metadata.push(['比較基準場數',baseline.report.completed,'比較基準種子',baseline.settings.seed]);
    const contents=[...metadata,[''],headers,...rows,[''],['執行順位','', '機會次數','勝場','勝率%'],...pos].map(r=>r.map(csvCell).join(',')).join('\r\n');
    download('balance_'+currentSettings.seed+'_'+report.completed+'.csv','\uFEFF'+contents,'text/csv;charset=utf-8');
  }
  setupSkills();updateBaselineInfo();showCores();
  $('all-on').addEventListener('click',()=>toggleAll('all',true));
  $('all-actives-off').addEventListener('click',()=>toggleAll('active',false));
  $('all-passives-off').addEventListener('click',()=>toggleAll('passive',false));
  $('save-baseline').addEventListener('click',()=>{
    if(!report)return;
    baseline={report,settings:currentSettings};
    updateBaselineInfo();makeRows();
    message(`已將 ${report.completed} 場結果設為基準。現在調整技能再跑一次，即可比較冠軍率變化。`);
  });
  $('clear-baseline').addEventListener('click',()=>{baseline=null;updateBaselineInfo();makeRows();});
  start.addEventListener('click',launch);
  // 各 Worker 在當前一場結算後依序停止；保留所有已完成場次。
  stop.addEventListener('click',()=>{
    if(!running)return;
    abortRequested=true;
    jobs.filter(j=>!j.done).forEach(j=>j.worker.postMessage({type:'cancel'}));
    stop.disabled=true;message('已向全部 Worker 發出停止要求，正在保存已完成場次…');
  });
  $('csv').addEventListener('click',exportCsv);
  $('json').addEventListener('click',()=>{if(report)download('balance_'+currentSettings.seed+'_'+report.completed+'.json',JSON.stringify({settings:currentSettings,report,limitations:'九名 NPC 自動模擬；非真人玩家勝率'},null,2),'application/json');});
  document.querySelectorAll('[data-count]').forEach(chip=>chip.addEventListener('click',()=>{
    count.value=chip.dataset.count;showCores();
    document.querySelectorAll('[data-count]').forEach(x=>x.classList.toggle('active',x===chip));
  }));
  count.addEventListener('input',()=>{document.querySelectorAll('[data-count]').forEach(x=>x.classList.toggle('active',x.dataset.count===count.value));showCores();});
  $('cores').addEventListener('change',showCores);
  document.querySelectorAll('[data-key]').forEach(btn=>btn.addEventListener('click',()=>{
    const key=btn.dataset.key;
    if(sortBy===key) desc=!desc; else {sortBy=key;desc=key!=='rank';}
    makeRows();
  }));
})();
