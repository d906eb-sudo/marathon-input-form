# Marathon Survey (Independent GitHub Pages Project)

## 重要事項
- 回答者はこのフォーム内だけで大会情報確認と心停止または心肺停止事例の有無を回答します。
- アクセス制限は `race_id + token` を含む専用URL方式です。
- `survey_id` は保存用IDであり、URLパラメータには使用しません。
- 同じ `Race_ID` の各年には同じ `token` を設定する運用です。`sca_occurred_prefill` は 1=あり / 0=なし / 不明=不明（アンケート回収なし）です。
- この方式はURLを知っている人がアクセスできるため、URLの転送・再配布には注意してください。

## Google Sheets構成
### race_master
survey_id, token, Race_ID, Race_Name, Year, Held, Participants_existing, Finishers_existing, Men_percent_existing, Men50_percent_existing, Men60_percent_existing, sca_occurred_prefill, Cohort

### race_response
timestamp, survey_id, Race_ID, Race_Name, Year, Held, confirmed_existing_data, Participants_existing, Participants_final, Finishers_existing, Finishers_final, Men_percent_existing, Men_percent_final, Men50_percent_existing, Men50_percent_final, Men60_percent_existing, Men60_percent_final, respondent_notes

### sca_response
timestamp, survey_id, Race_ID, Race_Name, Year, sca_occurred, sca_count, aed_used, rosc, death, sca_notes

## URL形式
`https://<username>.github.io/marathon-input-form/?race_id=TOKA&token=xxxx`

## 動作概要
- GET: `race_id + token` で `race_master` を照合し、該当Race_IDの全ての年を返却（tokenは返さない）
- フロント: 各年を表形式で表示し、既存値確認/修正と心停止事例の有無回答
- POST: `race_id + token` を再照合後、各年ごとに `race_response` / `sca_response` へ保存（`survey_id` を保存キーとして使用）

## 設定箇所
- `script.js` の `APPS_SCRIPT_URL`
- `apps-script/Code.gs` の `SHEET_ID`
