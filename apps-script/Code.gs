const SHEET_ID = '1lwMVVUfLBchS42FJ05T9iFid28wv2EvfKYFHsUBxDgg';
const SHEET_MASTER = 'race_master';
const SHEET_RACE_RESPONSE = 'race_response';
const SHEET_SCA_RESPONSE = 'sca_response';

function doGet(e) {
  try {
    const raceId = (e.parameter.race_id || '').trim();
    const token = (e.parameter.token || '').trim();
    if (!raceId || !token) return jsonOutput({ ok: false, error: 'race_id または token が不足しています。' });
    const rows = findRowsByRaceToken_(raceId, token);
    if (!rows.length) return jsonOutput({ ok: false, error: '専用URLが無効です。案内文書をご確認ください' });
    return jsonOutput({ ok: true, races: rows });
  } catch (error) { return jsonOutput({ ok: false, error: 'サーバーエラー: ' + error.message }); }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const raceId = (body.race_id || '').trim();
    const token = (body.token || '').trim();
    const responses = body.responses || [];
    if (!raceId || !token || !responses.length) return jsonOutput({ ok: false, error: 'race_id / token / responses が不足しています。' });

    const validRows = findRowsByRaceToken_(raceId, token);
    if (!validRows.length) return jsonOutput({ ok: false, error: '専用URLが無効です。保存していません。' });
    const validMap = {}; validRows.forEach((r) => { validMap[r.survey_id] = r; });

    const now = new Date(); const ss = SpreadsheetApp.openById(SHEET_ID);
    const raceSheet = ss.getSheetByName(SHEET_RACE_RESPONSE); const scaSheet = ss.getSheetByName(SHEET_SCA_RESPONSE);

    responses.forEach((r) => {
      const base = validMap[r.survey_id]; if (!base) return;
      raceSheet.appendRow([now, base.survey_id, base.Race_ID, base.Race_Name, base.Year, r.Held || base.Held, r.confirmed_existing_data ? 'true' : 'false', r.Participants_existing || base.Participants_existing, r.Participants_final || base.Participants_existing, r.Finishers_existing || base.Finishers_existing, r.Finishers_final || base.Finishers_existing, r.Men_percent_existing || base.Men_percent_existing, r.Men_percent_final || base.Men_percent_existing, r.Men50_percent_existing || base.Men50_percent_existing, r.Men50_percent_final || base.Men50_percent_existing, r.Men60_percent_existing || base.Men60_percent_existing, r.Men60_percent_final || base.Men60_percent_existing, r.respondent_notes || '']);
      scaSheet.appendRow([now, base.survey_id, base.Race_ID, base.Race_Name, base.Year, r.sca_occurred ? 'true' : 'false', r.sca_count || '', r.aed_used || '', r.rosc || '', r.death || '', r.sca_notes || '']);
    });

    return jsonOutput({ ok: true });
  } catch (error) { return jsonOutput({ ok: false, error: 'サーバーエラー: ' + error.message }); }
}

function findHeaderIndex_(header, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var idx = header.indexOf(candidates[i]);
    if (idx >= 0) return idx;
  }
  return -1;
}

function findRowsByRaceToken_(raceId, token) {
  const values = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_MASTER).getDataRange().getValues();
  if (values.length < 2) return [];
  const h = values[0];
  const scaPrefillIdx = findHeaderIndex_(h, ['sca_occurred_prefill','sca_prefill','SCA_prefill','sca_occurred_prefill_flag','sca_occurred_prefill_value','心停止事例有無','心停止有無']);
  const i = { survey_id:h.indexOf('survey_id'), token:h.indexOf('token'), Race_ID:h.indexOf('Race_ID'), Race_Name:h.indexOf('Race_Name'), Year:h.indexOf('Year'), Held:h.indexOf('Held'), Participants_existing:h.indexOf('Participants_existing'), Finishers_existing:h.indexOf('Finishers_existing'), Men_percent_existing:h.indexOf('Men_percent_existing'), Men50_percent_existing:h.indexOf('Men50_percent_existing'), Men60_percent_existing:h.indexOf('Men60_percent_existing'), sca_occurred_prefill: scaPrefillIdx };
  return values.slice(1).filter((r) => String(r[i.Race_ID]).trim() === raceId && String(r[i.token]).trim() === token).map((r) => ({ survey_id:String(r[i.survey_id]||''), Race_ID:String(r[i.Race_ID]||''), Race_Name:String(r[i.Race_Name]||''), Year:String(r[i.Year]||''), Held:String(r[i.Held]||''), Participants_existing:String(r[i.Participants_existing]||''), Finishers_existing:String(r[i.Finishers_existing]||''), Men_percent_existing:String(r[i.Men_percent_existing]||''), Men50_percent_existing:String(r[i.Men50_percent_existing]||''), Men60_percent_existing:String(r[i.Men60_percent_existing]||''), sca_occurred_prefill: i.sca_occurred_prefill >= 0 ? String(r[i.sca_occurred_prefill]||'').trim() : '' }));
}
function jsonOutput(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
