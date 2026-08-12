# Shared Memo V1

Firebase Authentication と Cloud Firestore を使った、GitHub Pages向けの共有メモです。Web固有の値を保存しないため、将来のSwiftUIクライアントからも同じコレクションを利用できます。

## ファイル

- `docs/shared-memo/index.html` — 画面構造
- `docs/shared-memo/style.css` — レスポンシブUI
- `docs/shared-memo/app.js` — Authentication、Firestore、リアルタイム同期
- `docs/shared-memo/firebase-config.js` — Firebase Webアプリ設定とV1のグループID
- `firestore.rules` — グループメンバーだけにメモ操作を許可するルール

## Firebase Consoleの設定

### 1. プロジェクトとWebアプリ

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成します。
2. 「プロジェクトの設定」→「全般」→「マイアプリ」でWebアプリ（`</>`）を追加します。
3. 表示された `firebaseConfig` の値を `docs/shared-memo/firebase-config.js` にコピーします。Firebase API keyはクライアント識別用であり、データ保護はSecurity Rulesで行います。

### 2. Googleログイン

1. 「Authentication」→「始める」→「Sign-in method」を開きます。
2. Googleプロバイダを有効にし、プロジェクトのサポートメールを選んで保存します。
3. 「Authentication」→「Settings」→「Authorized domains」に、公開先の `ユーザー名.github.io` を追加します（ローカル確認には `localhost` を使用します）。

### 3. Firestore Database

1. 「Firestore Database」→「データベースの作成」を選びます。
2. 本番環境モードを選び、SwiftUIアプリでも同じものを利用する予定のリージョンを選択します。作成後にリージョンは変更できません。
3. 「ルール」タブへ `firestore.rules` の内容を貼り付け、「公開」を押します。ルールは、ログインに加えて対象グループの `members` にUIDがあることを確認します。グループ自体の変更はConsoleからのみ行える設計です。

### 4. 初期グループとメンバー

1. Authenticationで対象ユーザーに一度Googleログインしてもらい、「Users」一覧で **User UID** を確認します。
2. Firestoreの「データ」タブでコレクション `groups` を開始し、ドキュメントIDを `group001` にします。
3. フィールド `name`（string、例: `My Group`）を追加します。
4. フィールド `members` を array として追加し、各要素を string にして、利用を許可する全ユーザーのUIDを登録します。
5. 既存ユーザーを追加するときは、`members` 配列へそのUIDを追加します。表示名やメールアドレスではなくUIDを使用してください。

初回ログイン時には `users/{UID}` が自動作成されます。メモはアプリから `memos/{自動ID}` に作成され、`groupId` が `group001` になります。

> 複合インデックスを求めるエラーが表示された場合は、ブラウザの開発者コンソールにFirestoreが示すリンクを開き、`memos` の `groupId`（Ascending）と `updatedAt`（Descending）のインデックスを作成してください。

## GitHub Pagesで公開

1. このリポジトリをGitHubへpushします。
2. GitHubの「Settings」→「Pages」で「Deploy from a branch」を選択します。
3. 対象ブランチと `/docs` を選択して保存します。
4. 数分後、`https://ユーザー名.github.io/リポジトリ名/shared-memo/` を開きます。
5. Firebase AuthenticationのAuthorized domainsへ `ユーザー名.github.io` が登録済みであることを確認します。

HTML、CSS、JavaScriptはいずれも相対パスを使用しているため、リポジトリ配下のサブディレクトリで動作します。

## 動作確認

1. `firebase-config.js` を実値に変更し、上記のグループ、メンバー、ルールを設定します。
2. 対象ユーザーでGoogleログインし、名前・メール・ログアウトボタンが表示されることを確認します。
3. 「＋ メモ追加」でメモを保存し、一覧に更新者と日時が表示されることを確認します。
4. メモを選択して編集し、更新内容が反映されることを確認します。
5. 2つのブラウザでメンバーとして開き、一方の追加・編集が他方へリロードなしで反映されることを確認します。
6. 削除時に確認ダイアログが表示され、承認後に一覧から消えることを確認します。
7. `members` にない別UIDでログインし、「このグループを利用する権限がありません。」と表示されることを確認します。
8. Rules PlaygroundまたはFirebase Emulatorで、非メンバーによる `memos` のread/writeが拒否されることを確認します。

ローカルではES Modulesのためファイルを直接開かず、リポジトリルートで `python3 -m http.server 8000` を実行して `http://localhost:8000/docs/shared-memo/` を開いてください。
