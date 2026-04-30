const SIMPLE_PASSWORD = "marathonmed";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbynXzNPQlzBGtyEWA4w3zEonxXOz9hoUAnRB1BChIMjjpQPdCVCTAtpX1ff86h4AGdlsA/exec";

const state = { surveyId: null, token: null, raceData: null };
const $ = (id) => document.getElementById(id);
const hide = (id) => $(id).classList.add("hidden");
const show = (id) => $(id).classList.remove("hidden");
function showError(m) { $("app-error").textContent = m; show("app-error"); }
function hideError() { $("app-error").textContent = ""; hide("app-error"); }
const fmt = (v) => (v === undefined || v === null || v === "" ? "未入力" : String(v));

function parseQuery() {
  const params = new URLSearchParams(window.location.search);
  state.surveyId = params.get("survey_id");
  state.token = params.get("token");
}

async function fetchRaceData() {
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("survey_id", state.surveyId);
  url.searchParams.set("token", state.token);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error("専用URLが無効です。案内文書をご確認ください");
  }
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

function buildPayload() { /* unchanged core */
  const r = state.raceData, confirmed = $("confirmed-existing-data").value === "true", scaOccurred = $("sca-occurred").value === "true";
  return {
    survey_id: state.surveyId, token: state.token, confirmed_existing_data: confirmed,
    Participants_existing: r.Participants_existing, Participants_final: confirmed ? r.Participants_existing : $("participants-final").value,
    Finishers_existing: r.Finishers_existing, Finishers_final: confirmed ? r.Finishers_existing : $("finishers-final").value,
    Men_percent_existing: r.Men_percent_existing, Men_percent_final: confirmed ? r.Men_percent_existing : $("men-percent-final").value,
    Men50_percent_existing: r.Men50_percent_existing, Men50_percent_final: confirmed ? r.Men50_percent_existing : $("men50-percent-final").value,
    Men60_percent_existing: r.Men60_percent_existing, Men60_percent_final: confirmed ? r.Men60_percent_existing : $("men60-percent-final").value,
    respondent_notes: $("respondent-notes").value, sca_occurred: scaOccurred, sca_count: $("sca-count").value,
    aed_used: $("aed-used").value, rosc: $("rosc").value, death: $("death").value, sca_notes: $("sca-notes").value,
  };
}
function validate(d) { if (d.sca_occurred && (!d.sca_count || Number(d.sca_count) < 1)) throw new Error("「発生あり」の場合、件数は1以上で入力してください。"); }
function renderReview(d) {
  $("review-content").innerHTML = `<div class="summary-list"><div><dt>大会名</dt><dd>${fmt(state.raceData.Race_Name)}</dd></div><div><dt>年度</dt><dd>${fmt(state.raceData.Year)}</dd></div><div><dt>開催有無</dt><dd>${fmt(state.raceData.Held)}</dd></div><div><dt>参加者数（最終）</dt><dd>${fmt(d.Participants_final)}</dd></div><div><dt>完走者数（最終）</dt><dd>${fmt(d.Finishers_final)}</dd></div><div><dt>男性割合（最終）</dt><dd>${fmt(d.Men_percent_final)} %</dd></div><div><dt>50歳以上男性割合（最終）</dt><dd>${fmt(d.Men50_percent_final)} %</dd></div><div><dt>60歳以上男性割合（最終）</dt><dd>${fmt(d.Men60_percent_final)} %</dd></div><div><dt>心停止・心肺停止</dt><dd>${d.sca_occurred ? "発生あり" : "発生なし"}</dd></div></div>`;
}
async function submit(d) {
  const res = await fetch(APPS_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
  const out = await res.json(); if (!res.ok || !out.ok) throw new Error(out.error || "送信に失敗しました。");
}

function setupEvents() {
  $("confirm-existing").addEventListener("click", () => { $("confirmed-existing-data").value = "true"; hide("correction-fields"); $("confirm-existing").classList.add("active"); $("edit-existing").classList.remove("active"); });
  $("edit-existing").addEventListener("click", () => { $("confirmed-existing-data").value = "false"; show("correction-fields"); $("edit-existing").classList.add("active"); $("confirm-existing").classList.remove("active"); });
  $("sca-no").addEventListener("click", () => { $("sca-occurred").value = "false"; hide("sca-fields"); $("sca-no").classList.add("active"); $("sca-yes").classList.remove("active"); });
  $("sca-yes").addEventListener("click", () => { $("sca-occurred").value = "true"; show("sca-fields"); $("sca-yes").classList.add("active"); $("sca-no").classList.remove("active"); });
  $("review-button").addEventListener("click", () => { try { const d = buildPayload(); validate(d); renderReview(d); hide("survey-form"); show("review-section"); } catch (e) { showError(e.message); } });
  $("back-button").addEventListener("click", () => { hide("review-section"); show("survey-form"); });
  $("submit-button").addEventListener("click", async () => { try { const d = buildPayload(); validate(d); await submit(d); hide("review-section"); show("complete-section"); } catch (e) { showError(e.message); } });
}

async function init() {
  parseQuery();
  if (!state.surveyId || !state.token) {
    showError("案内文書に記載された専用URLからアクセスしてください");
    return;
  }
  show("loading");
  try {
    hideError();
    state.raceData = await fetchRaceData();
    renderRaceSummary(state.raceData);
    show("survey-form");
  } catch (e) {
    showError(e.message);
  } finally {
    hide("loading");
  }
}

setupEvents();
init();
