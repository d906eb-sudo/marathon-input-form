const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxlRHVThMucXNv8aKe0rUztDhcZXQ-34-FLdmDzw8cgEuI0qLWJitqRmu_V7x2ljr6whw/exec";
const state = { raceId: null, token: null, races: [] };
const $ = (id) => document.getElementById(id);
const show = (id) => $(id).classList.remove("hidden");
const hide = (id) => $(id).classList.add("hidden");
const fmt = (v) => (v === undefined || v === null || v === "" ? "未入力" : String(v));
function showError(m){$("app-error").textContent=m;show("app-error");}

function parseQuery(){const p=new URLSearchParams(location.search);state.raceId=p.get("race_id");state.token=p.get("token");}
async function fetchRaceRows(){
  const url=new URL(APPS_SCRIPT_URL);url.searchParams.set("race_id",state.raceId);url.searchParams.set("token",state.token);
  const r=await fetch(url.toString());const d=await r.json();if(!r.ok||!d.ok) throw new Error("専用URLが無効です。案内文書をご確認ください");
  return d.races;
}

function renderCards(){
  const container=$("year-cards");
  $("race-title").textContent=`${state.races[0].Race_Name} の年度別回答`;
  container.innerHTML=state.races.map((r,i)=>`
  <section class="subsection"><h3>${fmt(r.Year)}年度（survey_id: ${fmt(r.survey_id)}）</h3>
    <label><input type="checkbox" id="confirmed-${i}" checked /> この内容で正しい（既存値を最終値に使用）</label>
    <div id="edit-${i}" class="hidden">
      <label>Held（最終）</label><input id="held-${i}" value="${fmt(r.Held)}" />
      <label>参加者数（最終）</label><input id="p-${i}" type="number" min="0" value="${fmt(r.Participants_existing)}" />
      <label>完走者数（最終）</label><input id="f-${i}" type="number" min="0" value="${fmt(r.Finishers_existing)}" />
      <label>男性割合（%）（最終）</label><input id="m-${i}" type="number" min="0" max="100" step="0.1" value="${fmt(r.Men_percent_existing)}" />
      <label>50歳以上男性割合（%）（最終）</label><input id="m50-${i}" type="number" min="0" max="100" step="0.1" value="${fmt(r.Men50_percent_existing)}" />
      <label>60歳以上男性割合（%）（最終）</label><input id="m60-${i}" type="number" min="0" max="100" step="0.1" value="${fmt(r.Men60_percent_existing)}" />
    </div>
    <p>既存値: Held=${fmt(r.Held)}, Participants=${fmt(r.Participants_existing)}, Finishers=${fmt(r.Finishers_existing)}, Men=${fmt(r.Men_percent_existing)}%, Men50=${fmt(r.Men50_percent_existing)}%, Men60=${fmt(r.Men60_percent_existing)}%</p>
    <div class="button-row"><button type="button" class="btn btn-secondary active" id="sca-no-${i}">発生なし</button><button type="button" class="btn btn-secondary" id="sca-yes-${i}">発生あり</button></div>
    <input type="hidden" id="sca-${i}" value="false" />
    <div id="sca-fields-${i}" class="hidden">
      <label>件数*</label><input id="scac-${i}" type="number" min="1" />
      <label>AED使用</label><select id="aed-${i}"><option value="">選択してください</option><option>あり</option><option>なし</option><option>不明</option></select>
      <label>ROSC</label><select id="rosc-${i}"><option value="">選択してください</option><option>あり</option><option>なし</option><option>不明</option></select>
      <label>死亡有無</label><select id="death-${i}"><option value="">選択してください</option><option>あり</option><option>なし</option><option>不明</option></select>
      <label>備考</label><textarea id="scan-${i}" rows="2"></textarea>
    </div>
    <label>回答者メモ</label><textarea id="note-${i}" rows="2"></textarea>
  </section>`).join("");

  state.races.forEach((_,i)=>{
    $("confirmed-"+i).addEventListener("change",e=>$("edit-"+i).classList.toggle("hidden",e.target.checked));
    $("sca-no-"+i).addEventListener("click",()=>{$("sca-"+i).value="false";hide("sca-fields-"+i);$("sca-no-"+i).classList.add("active");$("sca-yes-"+i).classList.remove("active");});
    $("sca-yes-"+i).addEventListener("click",()=>{$("sca-"+i).value="true";show("sca-fields-"+i);$("sca-yes-"+i).classList.add("active");$("sca-no-"+i).classList.remove("active");});
  });
}

function buildPayload(){
  const responses=state.races.map((r,i)=>{
    const confirmed=$("confirmed-"+i).checked, sca=$("sca-"+i).value==="true";
    const obj={survey_id:r.survey_id,Year:r.Year,Race_ID:r.Race_ID,Race_Name:r.Race_Name,
      confirmed_existing_data:confirmed,
      Held: confirmed ? r.Held : $("held-"+i).value,
      Participants_existing:r.Participants_existing,Participants_final: confirmed ? r.Participants_existing : $("p-"+i).value,
      Finishers_existing:r.Finishers_existing,Finishers_final: confirmed ? r.Finishers_existing : $("f-"+i).value,
      Men_percent_existing:r.Men_percent_existing,Men_percent_final: confirmed ? r.Men_percent_existing : $("m-"+i).value,
      Men50_percent_existing:r.Men50_percent_existing,Men50_percent_final: confirmed ? r.Men50_percent_existing : $("m50-"+i).value,
      Men60_percent_existing:r.Men60_percent_existing,Men60_percent_final: confirmed ? r.Men60_percent_existing : $("m60-"+i).value,
      respondent_notes:$("note-"+i).value,sca_occurred:sca,sca_count:$("scac-"+i).value,aed_used:$("aed-"+i).value,rosc:$("rosc-"+i).value,death:$("death-"+i).value,sca_notes:$("scan-"+i).value};
    if (sca && (!obj.sca_count || Number(obj.sca_count)<1)) throw new Error(`${r.Year}年度: 「発生あり」の場合は件数必須です。`);
    return obj;
  });
  return {race_id:state.raceId,token:state.token,responses};
}

function renderReview(payload){$("review-content").innerHTML=payload.responses.map(r=>`<div class="subsection"><strong>${r.Year}年度</strong><div>Participants最終: ${fmt(r.Participants_final)}</div><div>SCA: ${r.sca_occurred?"発生あり":"発生なし"}</div></div>`).join("");}
async function submit(payload){const r=await fetch(APPS_SCRIPT_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok||!d.ok) throw new Error(d.error||"送信失敗");}

function setupEvents(){
  $("review-button").addEventListener("click",()=>{try{const p=buildPayload();renderReview(p);hide("survey-form");show("review-section");}catch(e){showError(e.message);}});
  $("back-button").addEventListener("click",()=>{hide("review-section");show("survey-form");});
  $("submit-button").addEventListener("click",async()=>{try{const p=buildPayload();await submit(p);hide("review-section");show("complete-section");}catch(e){showError(e.message);}});
}

async function init(){parseQuery();if(!state.raceId||!state.token) return showError("案内文書に記載された専用URLからアクセスしてください");show("loading");try{state.races=await fetchRaceRows();renderCards();show("survey-form");}catch(e){showError(e.message);}finally{hide("loading");}}
setupEvents();init();
