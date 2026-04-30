const SHEET_ID = 'REPLACE_WITH_SPREADSHEET_ID';
const SHEET_MASTER = 'race_master';
const SHEET_RACE_RESPONSE = 'race_response';
const SHEET_SCA_RESPONSE = 'sca_response';

function doGet(e) {
  try {
    const surveyId = (e.parameter.survey_id || '').trim();
    const token = (e.parameter.token || '').trim();
    if (!surveyId || !token) return jsonOutput({ ok: false, error: 'survey_id または token が不足しています。' });
    const race = findBySurveyToken_(surveyId, token);
    if (!race) return jsonOutput({ ok: false, error: 'survey_id / token が無効です。' });
    return jsonOutput({ ok: true, race: race }); // tokenは返さない
  } catch (error) {
    return jsonOutput({ ok: false, error: 'サーバーエラー: ' + error.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const surveyId = (body.survey_id || '').trim();
    const token = (body.token || '').trim();
    if (!surveyId || !token) return jsonOutput({ ok: false, error: 'survey_id または token が不足しています。' });

    const race = findBySurveyToken_(surveyId, token);
    if (!race) return jsonOutput({ ok: false, error: 'survey_id / token が無効です。保存していません。' });

    const now = new Date();
    const ss = SpreadsheetApp.openById(SHEET_ID);
    ss.getSheetByName(SHEET_RACE_RESPONSE).appendRow([
      now,
      race.survey_id,
      race.Race_ID,
      race.Race_Name,
      race.Year,
      race.Held,
      body.confirmed_existing_data === true ? 'true' : 'false',
      body.Participants_existing || race.Participants_existing,
      body.Participants_final || race.Participants_existing,
      body.Finishers_existing || race.Finishers_existing,
      body.Finishers_final || race.Finishers_existing,
      body.Men_percent_existing || race.Men_percent_existing,
      body.Men_percent_final || race.Men_percent_existing,
      body.Men50_percent_existing || race.Men50_percent_existing,
      body.Men50_percent_final || race.Men50_percent_existing,
      body.Men60_percent_existing || race.Men60_percent_existing,
      body.Men60_percent_final || race.Men60_percent_existing,
      body.respondent_notes || '',
    ]);

    ss.getSheetByName(SHEET_SCA_RESPONSE).appendRow([
      now,
      race.survey_id,
      race.Race_ID,
      race.Race_Name,
      race.Year,
      body.sca_occurred === true ? 'true' : 'false',
      body.sca_count || '',
      body.aed_used || '',
      body.rosc || '',
      body.death || '',
      body.sca_notes || '',
    ]);

    return jsonOutput({ ok: true });
  } catch (error) {
    return jsonOutput({ ok: false, error: 'サーバーエラー: ' + error.message });
  }
}

function findBySurveyToken_(surveyId, token) {
  const values = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_MASTER).getDataRange().getValues();
  if (values.length < 2) return null;
  const h = values[0];
  const i = {
    survey_id: h.indexOf('survey_id'), token: h.indexOf('token'), Race_ID: h.indexOf('Race_ID'), Race_Name: h.indexOf('Race_Name'),
    Year: h.indexOf('Year'), Held: h.indexOf('Held'), Participants_existing: h.indexOf('Participants_existing'),
    Finishers_existing: h.indexOf('Finishers_existing'), Men_percent_existing: h.indexOf('Men_percent_existing'),
    Men50_percent_existing: h.indexOf('Men50_percent_existing'), Men60_percent_existing: h.indexOf('Men60_percent_existing'), Cohort: h.indexOf('Cohort'),
  };
  const row = values.slice(1).find((r) => String(r[i.survey_id]).trim() === surveyId && String(r[i.token]).trim() === token);
  if (!row) return null;
  return {
    survey_id: String(row[i.survey_id] || ''),
    Race_ID: String(row[i.Race_ID] || ''),
    Race_Name: String(row[i.Race_Name] || ''),
    Year: String(row[i.Year] || ''),
    Held: String(row[i.Held] || ''),
    Participants_existing: String(row[i.Participants_existing] || ''),
    Finishers_existing: String(row[i.Finishers_existing] || ''),
    Men_percent_existing: String(row[i.Men_percent_existing] || ''),
    Men50_percent_existing: String(row[i.Men50_percent_existing] || ''),
    Men60_percent_existing: String(row[i.Men60_percent_existing] || ''),
    Cohort: String(row[i.Cohort] || ''),
  };
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
