# Marathon Survey (Independent GitHub Pages Project)

既存 `d906eb-sudo.github.io/marathon-survey/` とは直接接続しない独立サイトです。  
静的フロントエンド + Google Apps Script + Google Sheetsで運用します。

## 重要事項
- 簡易パスワードは `marathonmed` です（関係者向け簡易ゲート）。
- 静的サイト上のパスワードは**強固な認証ではありません**。
- `token` は `race_master` にのみ保存し、`race_response` / `sca_response` には保存しません。

## 公開方法（GitHub Pages / 新規リポジトリ `marathon-input-form`）
1. 新規リポジトリ作成
2. `index.html`, `style.css`, `script.js` を配置してpush
3. GitHub Pagesを `main/(root)` で有効化

## Google Sheets構成

### race_master
- survey_id
- token
- Race_ID
- Race_Name
- Year
- Held
- Participants_existing
- Finishers_existing
- Men_percent_existing
- Men50_percent_existing
- Men60_percent_existing
- Cohort

### race_response
- timestamp
- survey_id
- Race_ID
- Race_Name
- Year
- Held
- confirmed_existing_data
- Participants_existing
- Participants_final
- Finishers_existing
- Finishers_final
- Men_percent_existing
- Men_percent_final
- Men50_percent_existing
- Men50_percent_final
- Men60_percent_existing
- Men60_percent_final
- respondent_notes

### sca_response
- timestamp
- survey_id
- Race_ID
- Race_Name
- Year
- sca_occurred
- sca_count
- aed_used
- rosc
- death
- sca_notes

## Apps Script設定
1. `apps-script/Code.gs` を貼り付け
2. `SHEET_ID` を更新
3. Webアプリとしてデプロイ
4. Web App URLを `script.js` の `APPS_SCRIPT_URL` に設定

## URL形式
`https://<username>.github.io/marathon-input-form/?survey_id=TOKA_2024&token=xxxx`

- `survey_id` は `Race_ID` + `Year` の一意ID（例: `TOKA_2024`）。
- GET/POST時に `survey_id + token` を照合。
- 応答JSONや保存先responseシートに `token` は含めません。

## 画面仕様
- URLから `survey_id` / `token` を受け取り
- Race_Name, Year, Held, 既存Participants/Finishers/各percentを表示
- Men/Men50/Men60 は割合（%）として表示・入力
- 「この内容で正しい」の場合、final値へexisting値を自動セットして送信
- 「修正する」の場合、入力値をfinal値として送信

## 手動テスト項目
1. パスワード未入力ではフォーム非表示
2. 誤パスワードでフォーム非表示
3. `marathonmed` で表示
4. `survey_id` なしでエラー
5. `token` なしでエラー
6. 無効 `survey_id/token` でエラー
7. 有効な `survey_id/token` で該当大会のみ表示
8. 心停止なしで送信可
9. 心停止ありで件数必須
10. race_response/sca_responseに分離保存
11. ブラウザにSheets編集権限や秘密情報がない

## セキュリティ強化案
- Googleログイン必須化
- 推測困難token・定期更新
- Apps Script側レート制限・監査ログ
