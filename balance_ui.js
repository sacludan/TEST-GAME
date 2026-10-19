/* AI 平衡實驗室的獨立前端，僅解析 Worker 實際回傳的統計值。 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const start = $('start'), stop = $('stop'), count = $('count');
  const progressArea = $('progress-area'), progressFill = $('progress-fill'), progressBar = $('progress-bar');
  let worker = null, report = null, currentSettings = null, sortBy = 'winRate', desc = true;
  const num = (value, decimals=1) => Number(value || 0).toFixed(decimals);
  const integer = value => Math.round(value).toLocaleString('zh-TW');
  function escapeHTML(value) { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function message(text, error=false) {
    $('message').textContent = text;
    $('message').className = error ? 'status-error' : 'hint';
  }
  function busy(flag) {
    start.disabled = flag; stop.disabled = !flag;
    count.disabled = flag; $('seed').disabled = flag; $('difficulty').disabled = flag;
    document.querySelectorAll('[data-count]').forEach(el => el.disabled=flag);
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
        <td title="95% Wilson 區間 ${num(low)}～${num(high)}%"><span class="pct"><span>${num(r.winRate)}%</span><span class="tinybar"><i style="width:${Math.min(100,r.winRate)}%"></i></span></span><div class="sub">95%：${num(low)}–${num(high)}%</div></td>
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
  function launch() {
    if (worker) return;
    const n=Math.floor(Number(count.value));
    const rawSeed=Number($('seed').value);
    if(!Number.isInteger(n)||n<1||n>10000) return message('場次請輸入 1～10,000 的整數。',true);
    if(!Number.isInteger(rawSeed)||rawSeed<1||rawSeed>4294967295) return message('隨機種子請輸入 1～4,294,967,295 的整數。',true);
    if(typeof Worker==='undefined') return message('這個瀏覽器不支援 Web Worker，無法執行模擬。',true);
    report=null;currentSettings={seed:rawSeed,count:n,difficulty:$('difficulty').value};
    $('csv').disabled=true;$('json').disabled=true;
    $('roster-body').innerHTML='<tr><td colspan="11" class="placeholder">模擬中，完成後會顯示實際結果…</td></tr>';
    $('chart-win').innerHTML='<div class="placeholder">模擬中</div>';
    $('chart-order').innerHTML='<div class="placeholder">模擬中</div>';
    ['s-games','s-duration','s-draws'].forEach(id=>$(id).textContent='—');
    $('insight').textContent='模擬進行中，資料完成後才會顯示；不會用預估勝率冒充實際結果。';
    busy(true);progress(0,n);message('正在獨立執行模擬，你仍可操作此頁面。');
    try {worker=new Worker('balance_worker.js?v=1');}
    catch(e) {worker=null;busy(false);message('無法啟動 Worker：請透過網站或本機 HTTP 伺服器開啟 balance.html，避免使用 file://。'+e.message,true);return;}
    const w=worker;
    w.onmessage=({data})=>{
      if(w!==worker) return;
      if(data.type==='progress') progress(data.completed,data.total);
      if(data.type==='error') {
        message('模擬發生錯誤：'+data.message,true);w.terminate();worker=null;busy(false);
      }
      if(data.type==='done') {
        report=data.report; currentSettings=data.settings;
        progress(report.completed,data.settings.requested);
        message(data.cancelled?`已停止：保留已完成的 ${report.completed} 場數據。`:`已完成 ${report.completed} 場！可查看數據或匯出 CSV／JSON。`);
        render();
        $('csv').disabled=!report.completed;$('json').disabled=!report.completed;
        w.terminate();worker=null;busy(false);
      }
    };
    w.onerror=(e)=>{ if(worker===w) { message('Worker 無法載入：'+(e.message||'請確認原始檔與 balance.html 位於同一層目錄，且從 HTTP/HTTPS 網站開啟。'),true);w.terminate();worker=null;busy(false); } };
    w.postMessage({type:'start',count:n,seed:rawSeed,difficulty:$('difficulty').value});
  }
  function csvCell(x) { return '"'+String(x??'').replace(/"/g,'""')+'"'; }
  function download(filename,body,type) {
    const blob=new Blob([body],{type});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function exportCsv() {
    if(!report)return;
    const headers=['角色ID','角色','參戰場次','冠軍場次','冠軍率%','冠軍率95%下限','冠軍率95%上限','前三率%','平均名次','平均存活秒數','平均造成傷害','平均承受傷害','平均擊殺數','平均實際回血','平均技能次數','平均命中','平均閃避','平均反傷','平均搜刮件數','平均合成次數','平均移動次數','平均食物使用','終局裝備分數','終局裝備稀有度合計','終局等級','免死觸發比例'];
    const rows=report.roster.map(r=>{
      const bounds=wilson(r.wins,r.games);
      return [r.id,r.name,r.games,r.wins,r.winRate,...bounds,r.top3Rate,r.rank,r.survival,r.damageDealt,r.damageTaken,r.kills,r.healing,r.skills,r.hits,r.dodges,r.reflected,r.loots,r.crafts,r.moves,r.foodUses,r.equipScore,r.equipRarity,r.level,r.pigSaved];
    });
    const pos=report.rankWins.map((r,i)=>['順位 '+(i+1),'',r.games,r.wins,r.games?100*r.wins/r.games:0]);
    const metadata=[['設定','場數',currentSettings.requested,'難度',currentSettings.difficulty,'種子',currentSettings.seed],['結果','完成',report.completed,'無冠軍',report.draws]];
    const contents=[...metadata,[''],headers,...rows,[''],['執行順位','', '機會次數','勝場','勝率%'],...pos].map(r=>r.map(csvCell).join(',')).join('\r\n');
    download('balance_'+currentSettings.seed+'_'+report.completed+'.csv','\uFEFF'+contents,'text/csv;charset=utf-8');
  }
  start.addEventListener('click',launch);
  // 先發送取消要求；正在計算的那場結束後即停止並回傳已完成數據。
  stop.addEventListener('click',()=>{if(worker){worker.postMessage({type:'cancel'});stop.disabled=true;message('已送出停止要求，正在完成目前這一場的結算…');}});
  $('csv').addEventListener('click',exportCsv);
  $('json').addEventListener('click',()=>{if(report)download('balance_'+currentSettings.seed+'_'+report.completed+'.json',JSON.stringify({settings:currentSettings,report,limitations:'九名 NPC 自動模擬；非真人玩家勝率'},null,2),'application/json');});
  document.querySelectorAll('[data-count]').forEach(chip=>chip.addEventListener('click',()=>{
    count.value=chip.dataset.count;
    document.querySelectorAll('[data-count]').forEach(x=>x.classList.toggle('active',x===chip));
  }));
  count.addEventListener('input',()=>document.querySelectorAll('[data-count]').forEach(x=>x.classList.toggle('active',x.dataset.count===count.value)));
  document.querySelectorAll('[data-key]').forEach(btn=>btn.addEventListener('click',()=>{
    const key=btn.dataset.key;
    if(sortBy===key) desc=!desc; else {sortBy=key;desc=key!=='rank';}
    makeRows();
  }));
})();
