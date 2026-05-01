const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxlRHVThMucXNv8aKe0rUztDhcZXQ-34-FLdmDzw8cgEuI0qLWJitqRmu_V7x2ljr6whw/exec";
const state = { raceId: null, token: null, races: [] };
const $ = (id) => document.getElementById(id), show=(id)=>$(id).classList.remove('hidden'), hide=(id)=>$(id).classList.add('hidden');
const fmt=(v)=> (v===undefined||v===null||v==="")?"未入力":String(v);
const err=(m)=>{$('app-error').textContent=m;show('app-error');};

function parseQuery(){const p=new URLSearchParams(location.search);state.raceId=p.get('race_id');state.token=p.get('token');}
async function fetchRows(){const u=new URL(APPS_SCRIPT_URL);u.searchParams.set('race_id',state.raceId);u.searchParams.set('token',state.token);const r=await fetch(u);const d=await r.json();if(!r.ok||!d.ok) throw new Error('専用URLが無効です。案内文書をご確認ください');return d.races;}

function renderRaceTable(){
  $('race-tbody').innerHTML = state.races.map((r,i)=>`
    <tr>
      <td>${fmt(r.Year)}年<div class="meta hidden">${fmt(r.survey_id)}</div></td><td>${fmt(r.Held)}</td><td>${fmt(r.Participants_existing)}</td><td>${fmt(r.Finishers_existing)}</td><td>${fmt(r.Men_percent_existing)}</td><td>${fmt(r.Men50_percent_existing)}</td><td>${fmt(r.Men60_percent_existing)}</td>
      <td><button type="button" class="btn btn-secondary" id="edit-btn-${i}">修正</button><div id="edit-${i}" class="detail hidden"><label>参加者数（最終）</label><input id="p-${i}" type="number" min="0" value="${fmt(r.Participants_existing)}"><label>完走者数（最終）</label><input id="f-${i}" type="number" min="0" value="${fmt(r.Finishers_existing)}"><label>男性割合（%）（最終）</label><input id="m-${i}" type="number" min="0" max="100" step="0.1" value="${fmt(r.Men_percent_existing)}"><label>50歳超男性割合（%）（最終）</label><input id="m50-${i}" type="number" min="0" max="100" step="0.1" value="${fmt(r.Men50_percent_existing)}"><label>60歳超男性割合（%）（最終）</label><input id="m60-${i}" type="number" min="0" max="100" step="0.1" value="${fmt(r.Men60_percent_existing)}"><label>回答者メモ</label><textarea id="note-edit-${i}" rows="2"></textarea></div></td>
    </tr>`).join('');
}

function renderScaTable(){
  $('sca-tbody').innerHTML = state.races.map((r,i)=>`
    <tr><td>${fmt(r.Year)}年</td><td><div class="seg"><button type="button" class="btn btn-secondary active" id="sca-no-${i}">心停止事例なし</button><button type="button" class="btn btn-secondary" id="sca-yes-${i}">心停止事例あり</button></div><input type="hidden" id="sca-${i}" value="false"></td><td>有無のみ回答（詳細は後日個別確認）</td></tr>`).join('');
}

function bindRows(){state.races.forEach((_,i)=>{ $('edit-btn-'+i).addEventListener('click',()=> $('edit-'+i).classList.toggle('hidden')); $('sca-no-'+i).addEventListener('click',()=>{$('sca-'+i).value='false';$('sca-no-'+i).classList.add('active');$('sca-yes-'+i).classList.remove('active');}); $('sca-yes-'+i).addEventListener('click',()=>{$('sca-'+i).value='true';$('sca-yes-'+i).classList.add('active');$('sca-no-'+i).classList.remove('active');}); });}

function buildPayload(){
  const responses=state.races.map((r,i)=>{const edited=!$('edit-'+i).classList.contains('hidden'), sca=$('sca-'+i).value==='true';
    const o={survey_id:r.survey_id,Year:r.Year,Race_ID:r.Race_ID,Race_Name:r.Race_Name,Held:r.Held,confirmed_existing_data:!edited,
      Participants_existing:r.Participants_existing,Participants_final:edited?$('p-'+i).value:r.Participants_existing,
      Finishers_existing:r.Finishers_existing,Finishers_final:edited?$('f-'+i).value:r.Finishers_existing,
      Men_percent_existing:r.Men_percent_existing,Men_percent_final:edited?$('m-'+i).value:r.Men_percent_existing,
      Men50_percent_existing:r.Men50_percent_existing,Men50_percent_final:edited?$('m50-'+i).value:r.Men50_percent_existing,
      Men60_percent_existing:r.Men60_percent_existing,Men60_percent_final:edited?$('m60-'+i).value:r.Men60_percent_existing,
      respondent_notes: edited?$('note-edit-'+i).value:'', sca_occurred:sca,sca_count:'',aed_used:'',rosc:'',death:'',sca_notes:''};
    return o;});
  return {race_id:state.raceId,token:state.token,responses};
}

function review(p){$('review-content').innerHTML=p.responses.map(r=>`<div><strong>${r.Year}年</strong> / 参加者数(最終):${fmt(r.Participants_final)} / 心停止事例:${r.sca_occurred?'あり':'なし'}</div>`).join('');}
async function submit(p){const r=await fetch(APPS_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});const d=await r.json();if(!r.ok||!d.ok) throw new Error(d.error||'送信失敗');}
function bindGlobal(){ $('review-button').addEventListener('click',()=>{try{const p=buildPayload();review(p);hide('survey-form');show('review-section');}catch(e){err(e.message);}}); $('back-button').addEventListener('click',()=>{hide('review-section');show('survey-form');}); $('submit-button').addEventListener('click',async()=>{try{await submit(buildPayload());hide('review-section');show('complete-section');}catch(e){err(e.message);}}); }
async function init(){parseQuery();if(!state.raceId||!state.token) return err('案内文書に記載された専用URLからアクセスしてください');show('loading');try{state.races=await fetchRows();$('race-title').textContent=`${state.races[0].Race_Name}（Race_ID: ${state.races[0].Race_ID}）`; $('race-subtitle').textContent='この大会の各年の情報を1画面で確認・回答できます。'; renderRaceTable(); renderScaTable(); bindRows(); show('survey-form');}catch(e){err(e.message);}finally{hide('loading');}}
bindGlobal();init();
