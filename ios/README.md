# iOS版

このディレクトリは統合リポジトリ `memo-tool` のiOSアプリと共有拡張の正本。

- `MemoApp/`: SwiftUI画面、SwiftDataモデル、Firebase認証・同期。
- `MemoShare/`: iOS共有メニューから文章・URLを保存する拡張。
- `MemoApp.xcodeproj/`: アプリと共有拡張のXcodeプロジェクト、Swift Packageの解決記録。
- `Tests/`: モデルの永続化回帰確認用ソース。

Macで `ios/MemoApp.xcodeproj` をXcodeで開く。プロジェクトの現在のiOS Deployment Targetは26.5。署名のTeam・端末条件は利用環境で確認する。Firebaseの公開クライアント設定は各ターゲットの `GoogleService-Info.plist` にあり、共通プロジェクト `shared-memo-63202` と `group001` を利用する。共通Rulesはルートの `firestore.rules` を参照する。

検証の入口は [共通TESTING.md](../TESTING.md)、Simulator運用は [iOSテスト手順](docs/TESTING.md)、以前の検証結果は [実装・検証記録](docs/IMPLEMENTATION_VALIDATION.md)。`Tests/MemoPersistenceRegression.swift` は実モデルとコンパイルする回帰用実行ファイルで、現在のXcodeプロジェクトにXCTestターゲットはない。

2026-10-07に `memo-tool-app` のコミット `b90bb46156a70b98e295a263f2bc54896bde55c0` から取り込んだ。旧リポジトリは履歴参照用に保持し、今後の変更はこのディレクトリで行う。Webの同期コピー `memo-tool-main` は取り込まない。
