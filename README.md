# Shared Memo V2

Firebase Authentication と Cloud Firestore を使った、GitHub Pages向けの軽量な共有メモです。Vanilla JavaScript構成のまま、通常メモ、チェックリスト、定型文を `group001` でリアルタイム共有できます。

## ファイル

- `docs/shared-memo/index.html` — メモ、フィルター、クリップボード、設定の画面構造
- `docs/shared-memo/style.css` — テーマカラー、集中モードを含むレスポンシブUI
- `docs/shared-memo/app.js` — Google認証、Firestore同期、V2機能、localStorage管理
- `docs/shared-memo/firebase-config.js` — Firebase Webアプリ設定とグループID
- `firestore.rules` — グループメンバーだけにメモ操作を許可し、V2フィールドを検証するルール

## Firestoreデータ構造

`memos/{memoId}` は次のフィールドを持ちます。

| フィールド | 型 | 内容 |
| --- | --- | --- |
| `groupId` | string | `group001` |
| `title`, `body` | string | タイトルと本文。チェックリストも `[ ]` / `[x]` の行テキスト |
| `type` | string | `text`, `checklist`, `snippet` のいずれか |
| `pinned` | boolean | ピン留め状態 |
| `createdBy`, `updatedBy` | string | Firebase Auth UID |
| `createdByName`, `updatedByName` | string | 操作者の表示名 |
| `createdAt`, `updatedAt` | timestamp | サーバータイムスタンプ |

V1メモには `type` と `pinned` がないため、クライアントでそれぞれ `text` と `false` に補完します。移行処理は不要です。V1メモを次に保存した時点で両フィールドが追加されます。

## localStorage

- `sharedMemoV2.clipboard` — 端末内クリップボード（文字列配列、最大10件）
- `sharedMemoV2.theme` — 選択テーマ名

いずれも端末・ブラウザ内だけで利用し、Firestoreや他ユーザーとは共有しません。利用できない場合は画面とconsoleにエラーを表示します。

## Firebase Consoleの設定

1. Firebase ConsoleでWebアプリを追加し、`docs/shared-memo/firebase-config.js` の未設定値を置き換えます。
2. AuthenticationのGoogleプロバイダを有効にし、公開先の `ユーザー名.github.io` をAuthorized domainsへ追加します。
3. Firestoreを本番環境モードで作成し、`firestore.rules` をルール画面へ貼り付けて公開します。
4. `groups/group001` を作成し、`name`（string）と、利用者UIDを並べた `members`（array）を設定します。

初回ログイン時には `users/{UID}` が自動作成されます。グループとメンバーの編集はFirebase Consoleから行います。

### インデックス

V2でもFirestoreクエリは `groupId == group001` と `updatedAt DESC` だけです。ピン順とタイプ絞り込みは取得後にブラウザで行うため、`pinned` を含む新しい複合インデックスは不要です。既存環境で求められた場合のみ、エラー内のリンクから `memos` の次の複合インデックスを作成してください。

- `groupId`: Ascending
- `updatedAt`: Descending

## GitHub Pagesで公開

GitHubの「Settings」→「Pages」で対象ブランチの `/docs` を公開します。相対パスのみを使っているため、`https://ユーザー名.github.io/リポジトリ名/shared-memo/` で動作します。

## 動作確認

ローカルではリポジトリルートで `python3 -m http.server 8000` を実行し、`http://localhost:8000/docs/shared-memo/` を開きます。

1. メンバーでGoogleログインし、V1メモが通常メモ・未ピンとして表示されることを確認します。
2. 3タイプを作成・編集・削除し、別ブラウザにもリアルタイム反映されることを確認します。
3. チェック項目を一覧で切り替え、Firestoreの `body` が `[ ]` / `[x]` のテキストとして更新されることを確認します。
4. 定型文のコピー、タイプフィルター、ピン順、本文加工（保存前のみ反映）、全画面と復帰を確認します。
5. クリップボードを11件登録して10件に制限されること、コピー・削除・再読込後の保持を確認します。
6. 6色のテーマを切り替え、再読込後にも復元されることを確認します。
7. 非メンバーの読み書きがSecurity Rulesで拒否されることと、各失敗が画面・consoleへ表示されることを確認します。

## SwiftUI版で再利用できる項目

Firebase AuthenticationのUID、`groups` / `users` / `memos` のデータモデル、`group001` のメンバー判定、Security Rules、チェックリストの行テキスト形式、メモタイプ、ピン状態、作成・更新監査フィールドはそのまま利用できます。テーマと端末内クリップボードはWebのlocalStorage固有なので、SwiftUIでは `UserDefaults` 等へ置き換えます。

## 実装上の注意

- チェック変更も通常の更新として `updatedBy`、`updatedByName`、`updatedAt` を更新します。
- 加工機能はtextareaだけを書き換え、自動保存しません。
- Clipboard APIはHTTPSまたはlocalhostなどのセキュアコンテキストとブラウザ権限が必要です。
- `updatedAt` が未確定の瞬間は末尾相当になります。同期後にピン優先・更新日時降順へ再整列します。
- ルール更新前はV2の `type` / `pinned` を含む保存が拒否されるため、アプリ公開と同時に新しいルールを公開してください。
