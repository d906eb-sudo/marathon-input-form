const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxlRHVThMucXNv8aKe0rUztDhcZXQ-34-FLdmDzw8cgEuI0qLWJitqRmu_V7x2ljr6whw/exec";
const state = { raceId: null, token: null, races: [] };
const $ = (id) => document.getElementById(id), show=(id)=>$(id).classList.remove('hidden'), hide=(id)=>$(id).classList.add('hidden');
const fmt=(v)=> (v===undefined||v===null||v==="")?"未入力":String(v);
const err=(m)=>{$('app-error').textContent=m;show('app-error');};

function parseQuery(){const p=new URLSearchParams(location.search);state.raceId=p.get('race_id');state.token=p.get('token');}
async function fetchRows(){const u=new URL(APPS_SCRIPT_URL);u.searchParams.set('race_id',state.raceId);u.searchParams.set('token',state.token);const r=await fetch(u);const d=await r.json();if(!r.ok||!d.ok) throw new Error('専用URLが無効です。案内文書をご確認ください');return d.races;}

function raceRow(r,i){return `<div class="row"><div class="row-top"><div><strong>${fmt(r.Year)}年度</strong><div class="meta">${fmt(r.survey_id)}</div></div><div class="kv">Held:${fmt(r.Held)} / Participants:${fmt(r.Participants_existing)} / Finishers:${fmt(r.Finishers_existing)} / Men:${fmt(r.Men_percent_existing)}% / Men50:${fmt(r.Men50_percent_existing)}% / Men60:${fmt(r.Men60_percent_existing)}%</div><button type="button" class="btn btn-secondary" id="edit-btn-${i}">修正</button></div><div class="detail hidden" id="edit-${i}"><label>Participants_final</label><input id="p-${i}" type="number" min="0" value="${fmt(r.Participants_existing)}"><label>Finishers_final</label><input id="f-${i}" type="number" min="0" value="${fmt(r.Finishers_existing)}"><label>Men_percent_final</label><input id="m-${i}" type="number" min="0" max="100" step="0.1" value="${fmt(r.Men_percent_existing)}"><label>Men50_percent_final</label><input id="m50-${i}" type="number" min="0" max="100" step="0.1" value="${fmt(r.Men50_percent_existing)}"><label>Men60_percent_final</label><input id="m60-${i}" type="number" min="0" max="100" step="0.1" value="${fmt(r.Men60_percent_existing)}"><label>回答者メモ</label><textarea id="note-edit-${i}" rows="2"></textarea></div></div>`;}
function scaRow(r,i){return `<div class="row"><div class="row-top"><div><strong>${fmt(r.Year)}年度</strong></div><div class="kv">対象年度における心停止または心肺停止事例の有無を選択</div><div class="inline-btns"><button type="button" class="btn btn-secondary active" id="sca-no-${i}">心停止事例なし</button><button type="button" class="btn btn-secondary" id="sca-yes-${i}">心停止事例あり</button></div></div><input type="hidden" id="sca-${i}" value="false"><div id="sca-detail-${i}" class="detail hidden"><label>sca_count*</label><input id="scac-${i}" type="number" min="1"><label>aed_used</label><select id="aed-${i}"><option value="">選択してください</option><option>あり</option><option>なし</option><option>不明</option></select><label>rosc</label><select id="rosc-${i}"><option value="">選択してください</option><option>あり</option><option>なし</option><option>不明</option></select><label>death</label><select id="death-${i}"><option value="">選択してください</option><option>あり</option><option>なし</option><option>不明</option></select><label>sca_notes</label><textarea id="scan-${i}" rows="2"></textarea><label>回答者メモ</label><textarea id="note-sca-${i}" rows="2"></textarea></div></div>`;}

function render(){
  $('race-title').textContent=`${state.races[0].Race_Name}（Race_ID: ${state.races[0].Race_ID}）`;
  $('race-subtitle').textContent='同一Race_IDの全年度を1画面で確認・回答できます。';
  $('race-list').innerHTML=state.races.map(raceRow).join('');
  $('sca-list').innerHTML=state.races.map(scaRow).join('');
  state.races.forEach((_,i)=>{
    $('edit-btn-'+i).addEventListener('click',()=> $('edit-'+i).classList.toggle('hidden'));
    $('sca-no-'+i).addEventListener('click',()=>{$('sca-'+i).value='false';hide('sca-detail-'+i);$('sca-no-'+i).classList.add('active');$('sca-yes-'+i).classList.remove('active');});
    $('sca-yes-'+i).addEventListener('click',()=>{$('sca-'+i).value='true';show('sca-detail-'+i);$('sca-yes-'+i).classList.add('active');$('sca-no-'+i).classList.remove('active');});
  });
}

function buildPayload(){
  const responses=state.races.map((r,i)=>{
    const edited=!$('edit-'+i).classList.contains('hidden'), sca=$('sca-'+i).value==='true';
    const o={survey_id:r.survey_id,Year:r.Year,Race_ID:r.Race_ID,Race_Name:r.Race_Name,Held:r.Held,confirmed_existing_data:!edited,
      Participants_existing:r.Participants_existing,Participants_final:edited?$('p-'+i).value:r.Participants_existing,
      Finishers_existing:r.Finishers_existing,Finishers_final:edited?$('f-'+i).value:r.Finishers_existing,
      Men_percent_existing:r.Men_percent_existing,Men_percent_final:edited?$('m-'+i).value:r.Men_percent_existing,
      Men50_percent_existing:r.Men50_percent_existing,Men50_percent_final:edited?$('m50-'+i).value:r.Men50_percent_existing,
      Men60_percent_existing:r.Men60_percent_existing,Men60_percent_final:edited?$('m60-'+i).value:r.Men60_percent_existing,
      respondent_notes: edited?$('note-edit-'+i).value:($('note-sca-'+i)?.value||''),
      sca_occurred:sca,sca_count:$('scac-'+i)?.value||'',aed_used:$('aed-'+i)?.value||'',rosc:$('rosc-'+i)?.value||'',death:$('death-'+i)?.value||'',sca_notes:$('scan-'+i)?.value||''};
    if(sca && (!o.sca_count || Number(o.sca_count)<1)) throw new Error(`${r.Year}年度: 心停止事例ありの場合は件数必須です。`);
    return o;
  });
  return {race_id:state.raceId,token:state.token,responses};
}

function review(p){$('review-content').innerHTML=p.responses.map(r=>`<div class="row"><strong>${r.Year}年度</strong> / Participants_final:${fmt(r.Participants_final)} / 心停止事例:${r.sca_occurred?'あり':'なし'}</div>`).join('');}
async function submit(p){const r=await fetch(APPS_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});const d=await r.json();if(!r.ok||!d.ok) throw new Error(d.error||'送信失敗');}

function bind(){ $('review-button').addEventListener('click',()=>{try{const p=buildPayload();review(p);hide('survey-form');show('review-section');}catch(e){err(e.message);}}); $('back-button').addEventListener('click',()=>{hide('review-section');show('survey-form');}); $('submit-button').addEventListener('click',async()=>{try{await submit(buildPayload());hide('review-section');show('complete-section');}catch(e){err(e.message);}}); }
async function init(){parseQuery();if(!state.raceId||!state.token) return err('案内文書に記載された専用URLからアクセスしてください');show('loading');try{state.races=await fetchRows();render();show('survey-form');}catch(e){err(e.message);}finally{hide('loading');}}
bind();init();
