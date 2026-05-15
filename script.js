const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx2npA7iA4mnhKPalNnkCfrvuiJA9JtkF7BgwZo51sw_KVHYuawENBqtHzcuCSWUOambA/exec";
const state = { raceId: null, token: null, races: [] };
const $ = (id) => document.getElementById(id), show=(id)=>$(id).classList.remove('hidden'), hide=(id)=>$(id).classList.add('hidden');
const fmt=(v)=> (v===undefined||v===null||v==="")?"未入力":String(v);
const err=(m)=>{$('app-error').textContent=m;show('app-error');};
function existingClass(v){ const t=String(v??'').trim(); return t && t!=='未入力' && t!=='未入力力' ? 'existing-val' : ''; }

function parseQuery(){const p=new URLSearchParams(location.search);state.raceId=p.get('race_id');state.token=p.get('token');}
async function fetchRows(){const u=new URL(APPS_SCRIPT_URL);u.searchParams.set('race_id',state.raceId);u.searchParams.set('token',state.token);const r=await fetch(u);const d=await r.json();if(!r.ok||!d.ok) throw new Error('専用URLが無効です。案内文書をご確認ください');return d.races;}
function isHeld(v){ const t=String(v||'').replace(/\s+/g,'').toLowerCase(); if(!t || t.includes('非') || t.includes('対象外')) return false; return /^(開催|実施|1|yes|true)$/i.test(t); }

function renderRaceTable(){
  $('race-tbody').innerHTML = state.races.map((r,i)=>`
    <tr class="${isHeld(r.Held)?'held-row':''}">
      <td>${fmt(r.Year)}年<div class="meta hidden">${fmt(r.survey_id)}</div></td>
      <td>${fmt(r.Held)}</td>
      <td><div class="cell-edit"><span id="pv-${i}" class="${existingClass(r.Participants_existing)}">${fmt(r.Participants_existing)}</span><input id="p-${i}" class="hidden" type="number" min="0" value="${fmt(r.Participants_existing)}"><button type="button" class="btn btn-secondary cell-btn" id="ep-${i}">修正</button></div></td>
      <td><div class="cell-edit"><span id="fv-${i}" class="${existingClass(r.Finishers_existing)}">${fmt(r.Finishers_existing)}</span><input id="f-${i}" class="hidden" type="number" min="0" value="${fmt(r.Finishers_existing)}"><button type="button" class="btn btn-secondary cell-btn" id="ef-${i}">修正</button></div></td>
      <td><div class="cell-edit"><span id="mv-${i}" class="${existingClass(r.Men_percent_existing)}">${fmt(r.Men_percent_existing)}</span><input id="m-${i}" class="hidden" type="number" min="0" max="100" step="0.1" value="${fmt(r.Men_percent_existing)}"><button type="button" class="btn btn-secondary cell-btn" id="em-${i}">修正</button></div></td>
      <td><div class="cell-edit"><span id="m50v-${i}" class="${existingClass(r.Men50_percent_existing)}">${fmt(r.Men50_percent_existing)}</span><input id="m50-${i}" class="hidden" type="number" min="0" max="100" step="0.1" value="${fmt(r.Men50_percent_existing)}"><button type="button" class="btn btn-secondary cell-btn" id="em50-${i}">修正</button></div></td>
      <td><div class="cell-edit"><span id="m60v-${i}" class="${existingClass(r.Men60_percent_existing)}">${fmt(r.Men60_percent_existing)}</span><input id="m60-${i}" class="hidden" type="number" min="0" max="100" step="0.1" value="${fmt(r.Men60_percent_existing)}"><button type="button" class="btn btn-secondary cell-btn" id="em60-${i}">修正</button></div></td>
      <td><textarea id="note-edit-${i}" rows="2" placeholder="任意"></textarea></td>
    </tr>`).join('');
}

function prefillSCA(v){ const raw=String(v??'').replace(/\s+/g,'').trim(); const t=raw.toLowerCase(); if(['1','1.0','true','あり','有','yes','y','１','発生あり'].includes(t)) return 'true'; if(['0','0.0','false','なし','無','no','n','０','発生なし'].includes(t)) return 'false'; if(['2','不明','unknown','na','n/a',''].includes(t)) return 'unknown'; return 'unknown'; }
function getPrefillValue(r){
  return r.sca_prefill_norm ?? r.sca_occurred_prefill ?? r.sca_prefill ?? r.SCA_prefill ?? r.sca_occurred ?? '';
}

function prefillLabel(v){ const p = prefillSCA(v); return p==='true' ? '発生あり' : (p==='false' ? '発生なし' : '未報告'); }

function renderScaTable(){
  $('sca-tbody').innerHTML = state.races.map((r,i)=>{
    const prefRaw = getPrefillValue(r);
    const pref = prefillSCA(prefRaw);
    const label = pref==='true' ? '発生あり' : (pref==='false' ? '発生なし' : '未報告');
    const badgeClass = pref==='true' ? 'badge-red' : (pref==='false' ? 'badge-blue' : 'badge-green');
    const selectVal = '2';
    return `<tr><td>${fmt(r.Year)}年</td><td><span class="prefill-badge ${badgeClass}">${label}</span></td><td><select id="sca-select-${i}"><option value="2" ${selectVal==='2'?'selected':''}>修正なし</option><option value="true">あり</option><option value="false">なし</option><option value="unknown">不明</option></select></td></tr>`;
  }).join('');
}

function toggleCell(inputId, spanId, btnId){
  const inp=$(inputId), sp=$(spanId), b=$(btnId);
  const editing=!inp.classList.contains('hidden');
  if(editing){ sp.textContent=fmt(inp.value); sp.className=existingClass(inp.value); inp.classList.add('hidden'); sp.classList.remove('hidden'); b.textContent='修正'; }
  else { inp.classList.remove('hidden'); sp.classList.add('hidden'); b.textContent='確定'; inp.focus(); }
}

function bindRows(){
  state.races.forEach((_,i)=>{
    [['p','pv','ep'],['f','fv','ef'],['m','mv','em'],['m50','m50v','em50'],['m60','m60v','em60']].forEach(([a,b,c])=>{
      $(c+'-'+i).addEventListener('click',()=>toggleCell(a+'-'+i,b+'-'+i,c+'-'+i));
    });

  });
}

function buildPayload(){
  const responses=state.races.map((r,i)=>{const sel=$('sca-select-'+i).value; const basePref=prefillSCA(getPrefillValue(r)); const scaVal = sel==='2' ? basePref : sel; const sca=(scaVal==='true');
    const o={survey_id:r.survey_id,Year:r.Year,Race_ID:r.Race_ID,Race_Name:r.Race_Name,Held:r.Held,confirmed_existing_data: ($('p-'+i).value===String(r.Participants_existing) && $('f-'+i).value===String(r.Finishers_existing) && $('m-'+i).value===String(r.Men_percent_existing) && $('m50-'+i).value===String(r.Men50_percent_existing) && $('m60-'+i).value===String(r.Men60_percent_existing)),
      Participants_existing:r.Participants_existing,Participants_final:$('p-'+i).value||r.Participants_existing,
      Finishers_existing:r.Finishers_existing,Finishers_final:$('f-'+i).value||r.Finishers_existing,
      Men_percent_existing:r.Men_percent_existing,Men_percent_final:$('m-'+i).value||r.Men_percent_existing,
      Men50_percent_existing:r.Men50_percent_existing,Men50_percent_final:$('m50-'+i).value||r.Men50_percent_existing,
      Men60_percent_existing:r.Men60_percent_existing,Men60_percent_final:$('m60-'+i).value||r.Men60_percent_existing,
      respondent_notes:$('note-edit-'+i).value, sca_occurred:sca,sca_count:'',aed_used:'',rosc:'',death:'',sca_notes:(scaVal==='unknown'?'不明':'')};
    return o;});
  return {race_id:state.raceId,token:state.token,responses};
}

function review(p){$('review-content').innerHTML=p.responses.map(r=>`<div><strong>${r.Year}年</strong> / 参加者数(最終):${fmt(r.Participants_final)} / 心停止事例:${r.sca_occurred?'あり':'なし'}</div>`).join('');}
async function submit(p){const r=await fetch(APPS_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});const d=await r.json();if(!r.ok||!d.ok) throw new Error(d.error||'送信失敗');}
function bindGlobal(){ $('review-button').addEventListener('click',()=>{try{const p=buildPayload();review(p);hide('survey-form');show('review-section');}catch(e){err(e.message);}}); $('back-button').addEventListener('click',()=>{hide('review-section');show('survey-form');}); $('submit-button').addEventListener('click',async()=>{try{await submit(buildPayload());hide('review-section');show('complete-section');}catch(e){err(e.message);}}); }
async function init(){parseQuery();if(!state.raceId||!state.token) return err('案内文書に記載された専用URLからアクセスしてください');show('loading');try{state.races=await fetchRows();$('race-title').textContent=`${state.races[0].Race_Name}（Race_ID: ${state.races[0].Race_ID}）`; $('race-subtitle').textContent='この大会の各年の情報を1画面で確認・回答できます。'; renderRaceTable(); renderScaTable(); bindRows(); show('survey-form');}catch(e){err(e.message);}finally{hide('loading');}}
bindGlobal();init();
