const SIMPLE_PASSWORD = "marathonmed";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec";

const state = { surveyId: null, token: null, raceData: null };
const $ = (id) => document.getElementById(id);
const hide = (id) => $(id).classList.add("hidden");
const show = (id) => $(id).classList.remove("hidden");
function showError(id, m) { $(id).textContent = m; show(id); }
function hideError(id) { $(id).textContent = ""; hide(id); }
const fmt = (v) => (v === undefined || v === null || v === "" ? "未入力" : String(v));

function parseQuery() {
  const params = new URLSearchParams(window.location.search);
  state.surveyId = params.get("survey_id");
  state.token = params.get("token");
}

async function fetchRaceData() {
  if (!state.surveyId) throw new Error("URLに survey_id がありません。");
  if (!state.token) throw new Error("URLに token がありません。");
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("survey_id", state.surveyId);
  url.searchParams.set("token", state.token);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("大会情報の取得に失敗しました。");
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "survey_id / token が無効です。");
  return data.race;
}

function renderRaceSummary(r) {
  $("race-summary").innerHTML = [
    ["大会名", r.Race_Name], ["年度", r.Year], ["開催有無", r.Held],
    ["参加者数（既存）", r.Participants_existing], ["完走者数（既存）", r.Finishers_existing],
    ["男性割合（既存）", `${fmt(r.Men_percent_existing)} %`],
    ["50歳以上男性割合（既存）", `${fmt(r.Men50_percent_existing)} %`],
    ["60歳以上男性割合（既存）", `${fmt(r.Men60_percent_existing)} %`],
  ].map(([k,v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
}

function buildPayload() {
  const r = state.raceData;
  const confirmed = $("confirmed-existing-data").value === "true";
  const scaOccurred = $("sca-occurred").value === "true";

  const participantsFinal = confirmed ? r.Participants_existing : $("participants-final").value;
  const finishersFinal = confirmed ? r.Finishers_existing : $("finishers-final").value;
  const menPercentFinal = confirmed ? r.Men_percent_existing : $("men-percent-final").value;
  const men50PercentFinal = confirmed ? r.Men50_percent_existing : $("men50-percent-final").value;
  const men60PercentFinal = confirmed ? r.Men60_percent_existing : $("men60-percent-final").value;

  return {
    survey_id: state.surveyId,
    token: state.token,
    confirmed_existing_data: confirmed,
    Participants_existing: r.Participants_existing,
    Participants_final: participantsFinal,
    Finishers_existing: r.Finishers_existing,
    Finishers_final: finishersFinal,
    Men_percent_existing: r.Men_percent_existing,
    Men_percent_final: menPercentFinal,
    Men50_percent_existing: r.Men50_percent_existing,
    Men50_percent_final: men50PercentFinal,
    Men60_percent_existing: r.Men60_percent_existing,
    Men60_percent_final: men60PercentFinal,
    respondent_notes: $("respondent-notes").value,
    sca_occurred: scaOccurred,
    sca_count: $("sca-count").value,
    aed_used: $("aed-used").value,
    rosc: $("rosc").value,
    death: $("death").value,
    sca_notes: $("sca-notes").value,
  };
}

function validate(data) {
  if (data.sca_occurred && (!data.sca_count || Number(data.sca_count) < 1)) throw new Error("「発生あり」の場合、件数は1以上で入力してください。");
}

function renderReview(d) {
  $("review-content").innerHTML = `
    <div class="summary-list">
      <div><dt>大会名</dt><dd>${fmt(state.raceData.Race_Name)}</dd></div>
      <div><dt>年度</dt><dd>${fmt(state.raceData.Year)}</dd></div>
      <div><dt>開催有無</dt><dd>${fmt(state.raceData.Held)}</dd></div>
      <div><dt>参加者数（最終）</dt><dd>${fmt(d.Participants_final)}</dd></div>
      <div><dt>完走者数（最終）</dt><dd>${fmt(d.Finishers_final)}</dd></div>
      <div><dt>男性割合（最終）</dt><dd>${fmt(d.Men_percent_final)} %</dd></div>
      <div><dt>50歳以上男性割合（最終）</dt><dd>${fmt(d.Men50_percent_final)} %</dd></div>
      <div><dt>60歳以上男性割合（最終）</dt><dd>${fmt(d.Men60_percent_final)} %</dd></div>
      <div><dt>心停止・心肺停止</dt><dd>${d.sca_occurred ? "発生あり" : "発生なし"}</dd></div>
    </div>`;
}

async function submit(d) {
  const res = await fetch(APPS_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
  if (!res.ok) throw new Error("送信に失敗しました。");
  const out = await res.json();
  if (!out.ok) throw new Error(out.error || "サーバーエラー");
}

function setup() {
  $("password-submit").addEventListener("click", async () => {
    hideError("password-error"); hideError("app-error");
    const p = $("password-input").value;
    if (!p) return showError("password-error", "パスワードを入力してください。");
    if (p !== SIMPLE_PASSWORD) return showError("password-error", "パスワードが正しくありません。");
    hide("password-section"); show("app-section"); show("loading");
    try { parseQuery(); state.raceData = await fetchRaceData(); renderRaceSummary(state.raceData); show("survey-form"); }
    catch (e) { showError("app-error", e.message); }
    finally { hide("loading"); }
  });
  $("confirm-existing").addEventListener("click", () => { $("confirmed-existing-data").value = "true"; hide("correction-fields"); $("confirm-existing").classList.add("active"); $("edit-existing").classList.remove("active"); });
  $("edit-existing").addEventListener("click", () => { $("confirmed-existing-data").value = "false"; show("correction-fields"); $("edit-existing").classList.add("active"); $("confirm-existing").classList.remove("active"); });
  $("sca-no").addEventListener("click", () => { $("sca-occurred").value = "false"; hide("sca-fields"); $("sca-no").classList.add("active"); $("sca-yes").classList.remove("active"); });
  $("sca-yes").addEventListener("click", () => { $("sca-occurred").value = "true"; show("sca-fields"); $("sca-yes").classList.add("active"); $("sca-no").classList.remove("active"); });
  $("review-button").addEventListener("click", () => { try { const d = buildPayload(); validate(d); renderReview(d); hide("survey-form"); show("review-section"); } catch (e) { showError("app-error", e.message); } });
  $("back-button").addEventListener("click", () => { hide("review-section"); show("survey-form"); });
  $("submit-button").addEventListener("click", async () => { try { const d = buildPayload(); validate(d); await submit(d); hide("review-section"); show("complete-section"); } catch (e) { showError("app-error", e.message); } });
}
setup();
