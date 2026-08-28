# AI 継続開発ガイド

このファイルは作業の入口です。情報は役割ごとに分けます。

- 現在どうなっているか: [`CURRENT.md`](CURRENT.md)
- 現在どう動いているか: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- なぜそうしたか: [`decisions/`](decisions/)
- 何を行ったか: [`sessions/`](sessions/)
- 利用・導入手順: [`README.md`](README.md)

## 作業開始時

1. このファイルを確認する。
2. `CURRENT.md` で現在の機能、制約、優先事項を確認する。
3. `ARCHITECTURE.md` で変更箇所の責務とデータフローを確認する。
4. タスクに関係する `decisions/` の ADR だけを確認する。
5. README、session、Git 履歴を必要に応じて参照し、対象コードを実際に調査する。

全資料を無条件に読まない。コードと文書が矛盾する場合、コードを現在状態の重要な一次情報として確認するが、実装を意図された仕様だと推測しない。不明点は不明と記録する。

## 実装時の原則

- 推測だけで変更せず、既存実装、呼び出し元、Firestore Rules を調査する。
- Vanilla JavaScript の静的アプリという現在の構成との整合性を確認する。ツール導入は必要性を説明できる場合に限る。
- 無関係な整形、リファクタリング、依存更新を混ぜない。
- Firebase Authentication と Firestore Rules の権限を安易に弱めない。クライアントのメンバー判定だけをセキュリティ境界にしない。
- エラーを隠すだけの回避策を恒久対応にしない。暫定対応なら残課題を `CURRENT.md` に残す。
- CDN 依存変更時はブラウザ用 ESM、バージョン固定、Markdown のサニタイズを維持する。
- Firebase Web 設定値は公開クライアント識別子であり、保護は Rules で行う。一方、管理用秘密鍵やサービスアカウントはコミットしない。

## 検証

package manager、ビルド、自動テスト、lint/typecheck 設定は現時点ではない。存在しないコマンドを想像して実行しない。

- 静的配信: ルートで `python3 -m http.server 8000` を実行し、`http://localhost:8000/docs/shared-memo/` を確認する。
- JavaScript の簡易構文確認は、CDN import を一時的に除いたコピーへの `node --check` を利用できる。ただしブラウザ/Firebase の統合テストではない。
- 認証、同期、権限、主要操作は README の「動作確認」に従う。Firebase が必要な項目を未実施なら明記する。
- Rules 変更時は可能なら Firebase Emulator または Rules Playground でメンバー/非メンバー双方を検証する。

## Definition of Done

変更に応じて、終了前に次を行う。

1. 必要なテスト（利用可能なら Firebase を含む手動統合確認）
2. lint（設定が存在する場合）
3. typecheck（設定が存在する場合）
4. build（工程が存在する場合）
5. `git diff --check` と `git diff` の確認
6. ドキュメント更新要否の判定
7. 状態・優先事項が変われば `CURRENT.md` を更新
8. 構造・データフローが変われば `ARCHITECTURE.md` を更新
9. 重要で長期的な設計判断があれば ADR を追加（細かな実装判断は対象外）
10. `sessions/YYYY-MM-DD-<topic>.md` に調査・実装・検証を簡潔に記録
11. 未解決事項と未実施検証を CURRENT または session に記録

CURRENT/ARCHITECTURE には現在有効な情報だけを残す。古い判断は削除せず、ADR を `superseded` にして後継を示す。session を CURRENT に丸ごと複製しない。
