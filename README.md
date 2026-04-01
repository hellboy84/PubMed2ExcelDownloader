# PubMed2ExcelDownloader

- **PubMed 検索結果を Excel/CSV でダウンロードするブラウザ拡張機能です。** PubMed の検索結果の一覧ページからボタン1つでファイルをダウンロードできます。

- **PubMed search results downloader**: export bibliographic data (title, authors, journal, abstract, etc.) to Excel (.xlsx) or CSV with one click.

> **ファイルをPubMedからダウンロードして変換する HTML ツール版はこちら(HTML tool Version is here) →** [PubMed2ExcelConverter](https://github.com/hellboy84/PubMed2ExcelConverter)

## 機能概要

- PubMed の検索結果一覧ページから直接ダウンロード
- 全件・チェック済・現在のページ・件数指定 と取得範囲を変更可能
- Excel(.xlsx)またはCSVで出力
- 出力するフィールドを選択できる

<img width="800" alt="スクショ" src="https://github.com/user-attachments/assets/133a427e-cd1c-48fe-9408-4a078ced915c">

- PubMed(NCBI)の要請によりVer.2以降はメールアドレスの設定が必要になりました。初回利用時に本拡張機能内から設定をお願いします。メールアドレスはNCBIにのみ送られます。本拡張機能はメールアドレスを収集しません。
- An email address is required by NCBI (v2+). Please configure it on first use — it is sent only to NCBI. This extension does not collect your email address. 

---
## 公式ストア版のインストール方法

- [Chromeの公式の拡張機能ストアからインストールできるようになりました](https://chromewebstore.google.com/detail/aeinioilpppkblenhhmlmalbhddodoib?utm_source=item-share-cb)(2026/04/01)
- 登録申請中(Firefox)

## GitHub版のインストール方法

### Chrome：持続的

1. このページの **Releases** から最新(latest)の `Source code (zip)` をダウンロード
2. ZIP を展開する
3. `chrome://extensions/` を開く
4. 右上の「デベロッパーモード」をオンに
5. 左側の「パッケージ化されていない拡張機能を読み込む」をクリックし、展開したフォルダを選択する

### Firefox：一時的(ブラウザの再起動で消える)

1. このページの **Releases** から最新(latest)の `Source code (zip)` をダウンロード
2. ZIP を展開する
3. `about:debugging#/runtime/this-firefox` を開く
4. 「一時的なアドオンを読み込む」をクリックし、展開したフォルダ内の `manifest.json` を選択する

---

## 使い方

1. PubMed で検索を行い、検索結果一覧ページを表示する
2. ブラウザのツールバーにある拡張機能アイコンをクリックする
3. **取得対象** を選択する（全件 / チェック済み / 現在のページ / 件数指定）
4. **出力フィールド** を必要に応じて変更する（デフォルトで主要項目が選択済み）
5. **出力形式** ExcelまたはCSVを選択する
6. **ダウンロード** ボタンをクリックする
7. ダウンロードが完了するまでポップアップを閉じずに待つ

> - 履歴検索を使う場合は「Add query」を使って独立して成立する検索結果URLを生成してご利用下さい。
> - **件数が多い場合、取得に時間がかかります**。取得中はポップアップを閉じないでください。  

---

## 出力フィールド一覧

| フィールド | タグ | デフォルト |
|---|---|---|
| PMID | PMID | ✔ |
| 言語 | LA | ✔ |
| 著者(略称) | AU | ✔ |
| 著者(フル) | FAU | |
| 論題 | TI | ✔ |
| 雑誌名(略称) | TA | ✔ |
| 雑誌名(フル) | JT | |
| 出版年 | DP | ✔ |
| 巻 | VI | ✔ |
| 号 | IP | ✔ |
| ページ | PG | ✔ |
| 出版タイプ | PT | ✔ |
| 抄録 | AB | ✔ |
| 著者キーワード | OT | |
| MeSH 用語 | MH | |
| DOI | AID | |
| ISSN | IS | |
| 著者所属 | AD | |

---

## 注意事項

- 本拡張機能は NCBI の公式 API（E-utilities）を使用します。サーバーへの負荷を考慮し、リクエストの間隔を調整しています
- Excel ファイルではセルの文字数が 30,000 字を超える場合に自動で切り詰められます。全文が必要な場合は CSV でダウンロードしてください

---

## プライバシーポリシー

- 本拡張機能は、個人を特定できる情報を収集・使用・送信しません。
- そのほか詳細は[PRIVACY_POLICY.md](https://github.com/hellboy84/PubMed2ExcelDownloader/blob/main/PRIVACY_POLICY.md) を御覧ください。

## AI 利用

このツールの作成は AI によるコーディング支援を受けています。

## ライセンス

[MIT License](LICENSE)
