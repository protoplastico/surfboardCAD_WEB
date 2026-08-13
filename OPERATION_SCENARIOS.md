# BoardCAD Web Operation Scenarios

このファイルは、最終段階の開発をブラインドで進めるための操作シナリオ表です。

目的は次の3つです。

1. 実際のUI操作手順を固定する
2. 自動化済み / 未自動化を切り分ける
3. 最終の目視確認回数を最小にする

## 運用方針

- 通常の修正は、まず `test-core.js` とローカル関数検証で進める
- ブラウザでの目視確認は、見た目やポインタ操作を伴うものだけ最後に行う
- 1つの不具合に対して、1つのシナリオか、同一系列のシナリオだけを触る
- 自動化できるものは `_test` 経由で追加し、再現手順を固定する

## 優先順位

### A. 最優先

- サンプル読み込み
- Outline / Profile / Cross section の基本編集
- Guide point 編集
- Cross section パネル操作
- BRD / PDF / DXF / G-code 出力

### B. 次点

- Tail / Nose / Wing / Fins パネル
- Ghost board
- 3D wire / Toolpath の表示整合

### C. 後段

- Probe Scan
- Trace Image
- Misc / Help / Language の周辺導線

## シナリオ一覧

| ID | シナリオ | 期待結果 | 自動化 | 最終目視 |
|---|---|---|---|---|
| S01 | サンプル `Shortboard` を開く | `.brd` が読めて右パネル summary が更新される | 済 | 不要 |
| S02 | `Outline` で ControlPoint を追加 / 削除 | knot 数が増減し undo/redo 可能 | 済 | 必要 |
| S03 | `Outline` で ControlPoint をドラッグ / 矢印移動 | 座標、ロック、continuous が反映される | 済 | 必要 |
| S04 | ControlPoint パネルで数値編集 | endpoint / tangent が実データへ反映される | 済 | 必要 |
| S05 | `Cross section` ビューへ切り替え | 現在断面、断面位置、summary が同期する | 一部済 | 必要 |
| S06 | Cross section パネルで `前/次/移動` | current section と panel 値が同期する | 済 | 必要 |
| S07 | Cross section パネルで `追加/削除/コピー/貼り付け` | section 数と選択断面が妥当 | 済 | 必要 |
| S08 | Guide point を追加 / 編集 / 削除 | 対象 spline ごとに点列が更新される | 済 | 必要 |
| S09 | 右クリックメニューから Guide point / ControlPoint 操作 | メニュー操作が既存機能へ接続される | 済 | 必要 |
| S10 | `Tail` パネル操作 | outline / summary / 出力へ反映される | 一部済 | 必要 |
| S11 | `Nose` パネル操作 | outline / summary / 出力へ反映される | 一部済 | 必要 |
| S12 | `Wing` パネル操作 | wing position / width / shape が反映される | 一部済 | 必要 |
| S13 | `Fins` パネル操作 | preset / drag / toe-in / cant / BRD保存が通る | 一部済 | 必要 |
| S14 | `Open Ghost` と current board への scale | ghost 表示と移動が機能する | 済 | 必要 |
| S15 | `3D Model` / `Toolpath` 表示 | 描画が崩れず、極端な遅延がない | 一部済 | 必要 |
| S16 | `PDF` / `Template PDF` / `DXF` 出力 | 出力が生成され再読可能な形式 | 済 | 必要 |
| S17 | `Laser G-code` / `CNC G-code` 出力 | G-code 生成と主要座標系が妥当 | 済 | 必要 |
| S18 | `Scan New Board` 基本導線 | 画面遷移、ポート選択、現在位置表示 | 一部済 | 必要 |
| S19 | Probe Scan 生成 / Simulation | G38.2、phase、step 実行が妥当 | 一部済 | 必要 |
| S20 | Scan Ghost から Profile / Outline / Section へ反映 | fitting が落ちず、誤差表示が出る | 一部済 | 必要 |
| S21 | `Misc / Settings` | 曲線分割、3D分割数が状態へ反映される | 済 | 必要 |
| S22 | `Misc / Language` | ja/en 切替とメッセージ更新が動く | 済 | 必要 |
| S23 | `Help / About` | ダイアログ表示とクローズが機能する | 済 | 必要 |
| S24 | `3D Model` 描画キャッシュ | world geometry と projected geometry が分離キャッシュされる | 済 | 必要 |
| S25 | `Toolpath` 描画キャッシュ | toolpath world pass と projected pass が分離キャッシュされる | 済 | 必要 |
| S26 | ツールバーの `Edit / Zoom / Pan / Spot` 切替 | tool と status が同期する | 済 | 必要 |
| S27 | `Scale board` / `Info` ダイアログ | アプリ内ダイアログが開閉できる | 済 | 必要 |
| S28 | `index.html` の `data-action / data-view / data-view-option` 接続確認 | 未接続メニュー項目が残らない | 済 | 不要 |

## 現在の `test-core.js` 対応

`test-core.js` のセクション名とシナリオの対応は次の通りです。

| test section | 主な対応シナリオ |
|---|---|
| `samples` | S01, S16, S17 |
| `probe-build` | S18, S19, S20 |
| `tail` | S10 |
| `nose` | S11 |
| `wing` | S12 |
| `ghost-3d-edit` | S02, S03, S04, S06, S08, S09, S13, S14, S15 |
| `scan-view` | S18, S19 |
| `misc-help` | S21, S22, S23 |
| `toolbar-dialogs` | S26, S27 |
| `menu-wiring` | S28 |
| `render-cache` | S24, S25 |

## 開発時の使い分け

### 通常修正

対象シナリオが `S02-S09` の場合:

```sh
node --check app.js
node --check test-core.js
node test-core.js --section=ghost-3d-edit
```

対象シナリオが `S10-S12` の場合:

```sh
node test-core.js --section=tail,nose,wing
```

対象シナリオが `S18-S20` の場合:

```sh
node test-core.js --section=probe-build,scan-view
```

対象シナリオが `S21-S23` の場合:

```sh
node test-core.js --section=misc-help
```

対象シナリオが `S24-S25` の場合:

```sh
node test-core.js --section=render-cache
```

シナリオIDから直接回す場合:

```sh
node test-core.js --scenario=S10
node test-core.js --scenario=S10,S11,S12
```

### 最終確認

最終確認では次だけをブラウザで行う。

1. `Shortboard` 読み込み
2. `Outline` で ControlPoint 編集
3. `Cross section` パネルで追加 / 移動 / 削除
4. `Guide point` 編集
5. `Tail / Nose / Wing / Fins` の代表操作
6. `3D Model` / `Toolpath` 表示
7. `PDF / DXF / G-code` 出力

## トークン節約ルール

- ブラウザDOM全体の取得は最終確認直前まで行わない
- スクリーンショットは「修正前後比較が必要な1枚」だけにする
- ローカル修正後は必ず `test-core.js` を先に回す
- 失敗時は対象セクションのみを再実行する
- 新しい不具合が見つかったら、まずこの表のどのシナリオかを決めてから直す
