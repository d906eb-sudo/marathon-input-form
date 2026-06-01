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
  } catch (error) {
    return jsonOutput({ ok: false, error: 'サーバーエラー: ' + error.message });
  }
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
    const validMap = {};
    validRows.forEach((r) => {
      validMap[r.survey_id] = r;
    });

    const now = new Date();
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const raceSheet = ss.getSheetByName(SHEET_RACE_RESPONSE);
    const scaSheet = ss.getSheetByName(SHEET_SCA_RESPONSE);
    const raceRowBySurvey = latestRowIndexBySurvey_(raceSheet);
    const scaRowBySurvey = latestRowIndexBySurvey_(scaSheet);

    responses.forEach((r) => {
      const base = validMap[r.survey_id];
      if (!base) return;
      const raceRow = [now, base.survey_id, base.Race_ID, base.Race_Name, base.Year, r.Held || base.Held, r.confirmed_existing_data ? 'true' : 'false', r.Participants_existing || base.Participants_existing, r.Participants_final || base.Participants_existing, r.Finishers_existing || base.Finishers_existing, r.Finishers_final || base.Finishers_existing, r.Men_percent_existing || base.Men_percent_existing, r.Men_percent_final || base.Men_percent_existing, r.Men50_percent_existing || base.Men50_percent_existing, r.Men50_percent_final || base.Men50_percent_existing, r.Men60_percent_existing || base.Men60_percent_existing, r.Men60_percent_final || base.Men60_percent_existing, r.respondent_notes || '', r.contact_affiliation || (body.contact && body.contact.affiliation) || '', r.contact_name || (body.contact && body.contact.name) || '', r.contact_email || (body.contact && body.contact.email) || '', r.contact_phone || (body.contact && body.contact.phone) || '', r.screening_program_interest || (body.screening && body.screening.interest) || '', r.screening_program_notes || (body.screening && body.screening.notes) || ''];
      const scaRow = [now, base.survey_id, base.Race_ID, base.Race_Name, base.Year, r.sca_occurred ? 'true' : 'false', r.sca_count || '', r.aed_used || '', r.rosc || '', r.death || '', r.sca_notes || ''];

      if (raceRowBySurvey[base.survey_id]) {
        raceSheet.getRange(raceRowBySurvey[base.survey_id], 1, 1, raceRow.length).setValues([raceRow]);
      } else {
        raceSheet.appendRow(raceRow);
      }

      if (scaRowBySurvey[base.survey_id]) {
        scaSheet.getRange(scaRowBySurvey[base.survey_id], 1, 1, scaRow.length).setValues([scaRow]);
      } else {
        scaSheet.appendRow(scaRow);
      }
    });

    return jsonOutput({ ok: true });
  } catch (error) {
    return jsonOutput({ ok: false, error: 'サーバーエラー: ' + error.message });
  }
}


function latestRowIndexBySurvey_(sheet) {
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return {};
  const h = values[0];
  const iSurvey = findHeaderIndex_(h, ['survey_id', 'Survey_ID', 'surveyId']);
  if (iSurvey < 0) return {};
  const out = {};
  for (let r = 1; r < values.length; r++) {
    const sid = String(values[r][iSurvey] || '').trim();
    if (!sid) continue;
    out[sid] = r + 1; // sheet row number
  }
  return out;
}

function latestScaBySurvey_() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_SCA_RESPONSE);
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return {};
  const h = values[0];
  const iSurvey = findHeaderIndex_(h, ['survey_id', 'Survey_ID', 'surveyId']);
  const iSca = findHeaderIndex_(h, ['sca_occurred', 'scaOccurred', 'SCA_occurred', '心停止事例', '心停止有無']);
  const iTime = findHeaderIndex_(h, ['timestamp', 'Timestamp', 'created_at', '作成日時']);
  if (iSurvey < 0 || iSca < 0) return {};
  const map = {};
  values.slice(1).forEach((r) => {
    const sid = String(r[iSurvey] || '').trim();
    if (!sid) return;
    const sca = String((r[iSca] ?? '')).trim().toLowerCase();
    const dt = new Date(r[iTime] || 0).getTime() || 0;
    if (!map[sid] || dt >= map[sid].ts) map[sid] = { ts: dt, val: (sca === 'true' || sca === '1') ? '1' : '0' };
  });
  const out = {};
  Object.keys(map).forEach((k) => {
    out[k] = map[k].val;
  });
  return out;
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
  const scaPrefillIdx = findHeaderIndex_(h, ['sca_occurred_prefill', 'sca_prefill', 'SCA_prefill', 'sca_occurred_prefill_flag', 'sca_occurred_prefill_value', '心停止事例有無', '心停止有無']);
  const passwordIdx = findHeaderIndex_(h, ['password', 'Password', 'passcode', 'Passcode', 'パスワード']);
  const latestScaMap = latestScaBySurvey_();
  const i = { survey_id: h.indexOf('survey_id'), token: h.indexOf('token'), password: passwordIdx, Race_ID: h.indexOf('Race_ID'), Race_Name: h.indexOf('Race_Name'), Year: h.indexOf('Year'), Held: h.indexOf('Held'), Participants_existing: h.indexOf('Participants_existing'), Finishers_existing: h.indexOf('Finishers_existing'), Men_percent_existing: h.indexOf('Men_percent_existing'), Men50_percent_existing: h.indexOf('Men50_percent_existing'), Men60_percent_existing: h.indexOf('Men60_percent_existing'), sca_occurred_prefill: scaPrefillIdx };
  const submittedPassword = String(token || '').trim();
  return values.slice(1).filter((r) => {
    const rowRaceId = String(r[i.Race_ID] ?? '').trim();
    const rowPassword = i.password >= 0 ? String(r[i.password] ?? '').trim() : '';
    const rowToken = i.token >= 0 ? String(r[i.token] ?? '').trim() : '';
    return rowRaceId === raceId && (rowPassword || rowToken) === submittedPassword;
  }).map((r) => {
    const sid = String((r[i.survey_id] ?? '')).trim();
    const rawPref = i.sca_occurred_prefill >= 0 ? String((r[i.sca_occurred_prefill] ?? '')).trim() : '';
    const fromMaster = rawPref !== '';
    const pref = fromMaster ? rawPref : (latestScaMap[sid] || '');
    return { survey_id: sid, Race_ID: String((r[i.Race_ID] ?? '')), Race_Name: String((r[i.Race_Name] ?? '')), Year: String((r[i.Year] ?? '')), Held: String((r[i.Held] ?? '')), Participants_existing: String((r[i.Participants_existing] ?? '')), Finishers_existing: String((r[i.Finishers_existing] ?? '')), Men_percent_existing: String((r[i.Men_percent_existing] ?? '')), Men50_percent_existing: String((r[i.Men50_percent_existing] ?? '')), Men60_percent_existing: String((r[i.Men60_percent_existing] ?? '')), sca_occurred_prefill: pref, prefill_source: fromMaster ? 'race_master' : (pref ? 'sca_response' : 'none') };
  });
}

function normalizeScaPrefill_(v) {
  var raw = String(v || '').replace(/\s+/g, '').toLowerCase();
  if (['1', '1.0', 'true', 'あり', '有', 'yes', 'y', '１', '発生あり'].indexOf(raw) >= 0) return '1';
  if (['0', '0.0', 'false', 'なし', '無', 'no', 'n', '０', '発生なし'].indexOf(raw) >= 0) return '0';
  return '2';
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}


/**
 * race_master に 2006～2010 年の集約行を一括追加する管理者用関数。
 * - survey_id: <Race_ID>_2006_2010
 * - Year: 2006～2010
 * - token / Race_ID / Race_Name は同一Race_IDの既存行から継承
 * - 既に同じ survey_id が存在する場合は追加しない
 */
function seedLegacy2006To2010Rows_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_MASTER);
  if (!sheet) throw new Error('race_master シートが見つかりません');

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) throw new Error('race_master にデータがありません');

  const h = values[0];
  const iSurvey = findHeaderIndex_(h, ['survey_id', 'Survey_ID', 'surveyId']);
  const iToken = findHeaderIndex_(h, ['token', 'Token']);
  const iPassword = findHeaderIndex_(h, ['password', 'Password', 'passcode', 'Passcode', 'パスワード']);
  const iRaceId = findHeaderIndex_(h, ['Race_ID', 'race_id', 'RaceId']);
  const iRaceName = findHeaderIndex_(h, ['Race_Name', 'race_name', 'RaceName']);
  const iYear = findHeaderIndex_(h, ['Year', 'year']);
  const iHeld = findHeaderIndex_(h, ['Held', 'held', '開催状況']);

  if ([iSurvey, iToken, iRaceId, iRaceName, iYear].some((x) => x < 0)) {
    throw new Error('race_master の必須ヘッダ（survey_id/token/Race_ID/Race_Name/Year）が不足しています');
  }

  const existingSurvey = {};
  const raceBase = {};

  values.slice(1).forEach((r) => {
    const sid = String(r[iSurvey] || '').trim();
    const rid = String(r[iRaceId] || '').trim();
    if (sid) existingSurvey[sid] = true;
    if (!rid) return;
    if (!raceBase[rid]) {
      raceBase[rid] = {
        token: String(r[iToken] || '').trim(),
        password: iPassword >= 0 ? String(r[iPassword] || '').trim() : '',
        raceName: String(r[iRaceName] || '').trim()
      };
    }
  });

  const newRows = [];
  Object.keys(raceBase).forEach((rid) => {
    const sid = rid + '_2006_2010';
    if (existingSurvey[sid]) return;

    const row = new Array(h.length).fill('');
    row[iSurvey] = sid;
    row[iToken] = raceBase[rid].token;
    if (iPassword >= 0) row[iPassword] = raceBase[rid].password || raceBase[rid].token.slice(0, 4);
    row[iRaceId] = rid;
    row[iRaceName] = raceBase[rid].raceName;
    row[iYear] = '2006～2010';
    if (iHeld >= 0) row[iHeld] = '開催';
    newRows.push(row);
  });

  if (!newRows.length) {
    Logger.log('追加対象なし（すべて既存）');
    return;
  }

  sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, h.length).setValues(newRows);
  Logger.log('追加行数: ' + newRows.length);
}
