# Repository consolidation (2026-10-07)

## Request
Web・PC版とiOS版をmemo-toolに統合。

## Investigation
開始時は両作業ツリーclean。memo-tool-mainの全trackedファイルはmemo-toolとバイト一致。Xcodeの参照は同階層の相対パス。

## Changes
memo-tool-appのb90bb46156a70b98e295a263f2bc54896bde55c0からios/へソース・プロジェクト・テスト・文書を取り込み。xcuserdataとWebコピーは除外。共通文書・ignoreを更新。旧README/AGENTSに移行先を案内。

## Validation
verify.sh fast/full成功、Node 6テスト成功。WindowsではGit Bash、既存pythonへの一時python3関数、PYTHONUTF8=1を使用。ソース・プロジェクト・テストのコピー一致、plist/entitlements/workspace XML、Xcode相対参照を確認。git diff --checkとdiffを確認。

## Result
今後の正本はmemo-tool、iOSはios/。Web公開配置・Firebase・アプリロジックに変更なし。commit/push/deployは未実施。

## Remaining Issues
Windowsのため移行後のXcodeビルド・Simulator・実機確認は未実施。Macでios/MemoApp.xcodeprojを開いて確認する。旧リポジトリにソースとGit履歴を保持し、履歴mergeは行っていない。現プロジェクトにXCTestターゲットはない。
