# Marathon Survey (Independent GitHub Pages Project)

## 重要事項
- アクセス制限は `race_id + token` を含む専用URL方式です。
- `survey_id` は保存用IDであり、URLパラメータには使用しません。
- 同じ `Race_ID` の各年度には同じ `token` を設定する運用です。
- この方式はURLを知っている人がアクセスできるため、URLの転送・再配布には注意してください。
- 回答者はGoogleスプレッドシートを直接開かず、このフォーム内で大会情報確認と心停止発生有無を回答します。

## Google Sheets構成
### race_master
survey_id, token, Race_ID, Race_Name, Year, Held, Participants_existing, Finishers_existing, Men_percent_existing, Men50_percent_existing, Men60_percent_existing, Cohort

### race_response
timestamp, survey_id, Race_ID, Race_Name, Year, Held, confirmed_existing_data, Participants_existing, Participants_final, Finishers_existing, Finishers_final, Men_percent_existing, Men_percent_final, Men50_percent_existing, Men50_percent_final, Men60_percent_existing, Men60_percent_final, respondent_notes

### sca_response
timestamp, survey_id, Race_ID, Race_Name, Year, sca_occurred, sca_count, aed_used, rosc, death, sca_notes

## URL形式
`https://<username>.github.io/marathon-input-form/?race_id=TOKA&token=xxxx`

## 動作概要
- GET: `race_id + token` で `race_master` を照合し、該当Race_IDの全年度を返却（tokenは返さない）
- フロント: 全年度をカード表示し、年度ごとに既存値確認/修正とSCA回答
- POST: `race_id + token` を再照合後、年度ごとに `race_response` / `sca_response` へ保存（`survey_id` を保存キーとして使用）

## 設定箇所
- `script.js` の `APPS_SCRIPT_URL`
- `apps-script/Code.gs` の `SHEET_ID`
