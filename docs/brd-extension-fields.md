# BoardCAD Web `.brd` 拡張項目仕様

この文書は、BoardCAD Web が従来の `.brd` 形式に追加している項目を、外部プログラムから読み取るための参照資料としてまとめたものです。

対象コード:

- `/Users/protoplastico/Documents/Codex/2026-06-09/files-mentioned-by-the-user-boardcad/boardcad-web/app.js`

主な入出力関数:

- 読み込み: `parseBrd(text, filename)`
- 書き出し: `makeBrd(board)`
- 値選択: `brdExportValue(board, id)`

単位の原則:

- 長さ・位置: cm
- 幅・厚み: cm
- 角度: 度
- 強度・比率・ブレンド係数: 無次元数
- JSON フィールド: UTF-8 文字列として `pNN : {...}` または `pNN : [...]`

注意:

1. `p32` / `p33` / `p34` / `p35` が最終形状の実体です。  
   拡張項目の一部は UI 上の生成パラメータであり、書き出し時に実形状へ焼き込まれたうえで空欄化される場合があります。
2. 特にテール・ノーズ・ウィングの procedural 生成は、`prepareBoardForBrdExport()` → `bakeProceduralOutlineForExport()` でベイクされます。
3. したがって、外部プログラム側で最終形状だけ必要な場合は `p32`〜`p35` を優先し、編集再現まで必要な場合のみ以下の拡張フィールドを参照してください。

---

## 1. フィールド一覧

| ID | 名称 | 型 | 用途の概要 |
| --- | --- | --- | --- |
| 58 | `finSetup` | string | フィンレイアウトのプリセット名 |
| 59 | `finToeIn` | number | 基本 Toe-in 角度 |
| 60 | `finCant` | number | 基本 Cant 角度 |
| 61 | `finExtra` | string(JSON風シリアライズ) | 追加フィン定義 |
| 62 | `tailMode` | string | テール形状モード |
| 63 | `tailLength` | number | テール整形長 |
| 64 | `tailDepth` | number | swallow / bat / split 系の切れ込み深さ |
| 65 | `tailShoulderPos` | number | テール肩位置比率 |
| 66 | `tailShoulderScale` | number | テール肩の張り出し比率 |
| 67 | `tailRailBlend` | number | テールと既存レールの接続ブレンド |
| 68 | `wingPreset` | string | ウィングのプリセット名 |
| 69 | `wingPosition` | number | テール基準のウィング位置 |
| 70 | `wingWidth` | number | ウィング幅 |
| 71 | `wingShape` | string | `bump` / `step` 等 |
| 72 | `wingShoulder` | number | ウィング肩の立ち上がり係数 |
| 73 | `wingTransition` | number | ウィング移行長係数 |
| 74 | `tailLinearization` | number | テール線形化係数 |
| 75 | `noseMode` | string | ノーズ形状モード |
| 76 | `noseLength` | number | ノーズ整形長 |
| 77 | `noseShoulderPos` | number | ノーズ肩位置比率 |
| 78 | `noseShoulderScale` | number | ノーズ肩の張り出し比率 |
| 79 | `noseRailBlend` | number | ノーズと既存レールの接続ブレンド |
| 80 | `noseLinearization` | number | ノーズ線形化係数 |
| 81 | `tailWidthAdjust` | number | テール幅スケール補正 |
| 82 | `noseWidthAdjust` | number | ノーズ幅スケール補正 |
| 83 | `bottomFeatures` | string(JSON) | ボトム形状群 |
| 84 | `bottomPreset` | string | ボトム形状プリセット |
| 85 | `edgeType` | string | レールエッジ種別 |
| 86 | `edgeStrength` | number | エッジ強度 |
| 87 | `edgeLength` | number | エッジ適用長 |
| 88 | `edgeFade` | number | エッジ終端フェード長 |
| 89 | `rockerPreset` | string | ロッカープリセット |
| 90 | `rockerConfig` | string(JSON) | ロッカー詳細設定 |

---

## 2. 各項目の詳細

### `p58 : finSetup`

- 型: 文字列
- 例: `single-fin`, `2+1`, `twin-fish`, `thruster`, `quad-fin`, `5-fin`, `bonzer`
- 読み込み:
  - `parseBrd()` → `board.finSetup`
- 書き出し:
  - `brdExportValue(58)`
- 主な演算:
  - `finSetupPreset(setup, board)`
  - `applyFinSetupPreset(setup, persist)`
  - `finSetupKey()`, `finSetupLabel()`

### `p59 : finToeIn`

- 型: 数値
- 単位: 度
- 読み込み: `board.finToeIn`
- 書き出し: `brdExportValue(59)`
- 主な演算:
  - `finToeInFromFins()`
  - `finToeInFromSegment()`
  - フィン配置 UI の既定値・同期

### `p60 : finCant`

- 型: 数値
- 単位: 度
- 読み込み: `board.finCant`
- 書き出し: `brdExportValue(60)`
- 主な演算:
  - フィン設定 UI
  - フィンテンプレート配置の補助値

### `p61 : finExtra`

- 型: 文字列
- 実体: 追加フィン群のシリアライズ
- 読み込み:
  - `parseFinExtra(valueAfterColon(line))`
- 書き出し:
  - `serializeFinExtra(board.finExtra)`
- 主な演算:
  - `normalizeFinExtra()`
  - `normalizedFins()`
  - 複数フィン構成の描画・保存

---

### `p62 : tailMode`

- 型: 文字列
- 正規化:
  - `normalizeTailModeKey()`
- 代表値:
  - `square`, `squash`, `round`, `rounded-square`, `gun`, `pin`, `round-pin`, `diamond`, `rounded-diamond`, `rocket`, `half-moon`, `swallow`, `fish`, `split`, `star`, `bat`
- 主な演算:
  - `normalizedTailConfig(board, baseHalfPoints)`
  - `boardCadTailPlanform(board)`
  - `tailAdjustedProfileGeometry(board)`
- 備考:
  - procedural テール生成が有効な場合、`.brd` 書き出し時に形状を `p32/p33/p34/p35` へベイクし、この値は空欄化されることがあります。

### `p63 : tailLength`

- 型: 数値
- 単位: cm
- 意味:
  - テール整形の作用長
- 主な演算:
  - `normalizedTailConfig()`
  - `tailOuterHalfWidthAt()`
  - `tailInnerHalfWidthAt()`

### `p64 : tailDepth`

- 型: 数値
- 単位: cm
- 意味:
  - swallow / bat / split / half-moon 等の切れ込み深さ
- 主な演算:
  - `tailModeUsesDepth()`
  - `normalizedTailConfig()`

### `p65 : tailShoulderPos`

- 型: 数値
- 意味:
  - 0〜1 近傍の肩位置係数
- 主な演算:
  - `normalizedTailConfig()`
  - テール外形カーブの肩位置計算

### `p66 : tailShoulderScale`

- 型: 数値
- 意味:
  - 肩位置での張り出し量係数
- 主な演算:
  - `normalizedTailConfig()`

### `p67 : tailRailBlend`

- 型: 数値
- 意味:
  - テール整形部と既存アウトラインの接続ブレンド係数
- 主な演算:
  - `normalizedTailConfig()`
  - テール接続の滑らかさ調整

### `p74 : tailLinearization`

- 型: 数値
- 意味:
  - テール終端カーブの線形化係数
- 主な演算:
  - `normalizedTailConfig()` 内 `rawLinearization`
- 備考:
  - 現行 UI では主操作項目ではありませんが、読み書き互換性のため保持されています。

### `p81 : tailWidthAdjust`

- 型: 数値
- 範囲:
  - UI 上は `-1`〜`1`
- 内部意味:
  - `widthAdjustPercent()` を介して 25%〜400% 相当のスケールへ変換
- 主な演算:
  - `normalizedTailConfig()` 内 `widthAdjust`
  - テール側の幅補正

---

### `p75 : noseMode`

- 型: 文字列
- 正規化:
  - `normalizeNoseModeKey()`
- 代表値:
  - `gun`, `pin`, `round-point`, `wide`, `round`, `diamond`, `snub`, `square`
- 主な演算:
  - `nosePresetForBoard()`
  - `normalizedNoseConfig(board)`
  - ノーズ整形後の planform / profile 生成

### `p76 : noseLength`

- 型: 数値
- 単位: cm
- 意味:
  - ノーズ整形長
- 主な演算:
  - `normalizedNoseConfig()`

### `p77 : noseShoulderPos`

- 型: 数値
- 意味:
  - ノーズ肩位置比率
- 主な演算:
  - `normalizedNoseConfig()`

### `p78 : noseShoulderScale`

- 型: 数値
- 意味:
  - ノーズ肩の張り出し量比率
- 主な演算:
  - `normalizedNoseConfig()`

### `p79 : noseRailBlend`

- 型: 数値
- 意味:
  - ノーズ整形部と既存アウトラインの接続ブレンド
- 主な演算:
  - `normalizedNoseConfig()`

### `p80 : noseLinearization`

- 型: 数値
- 意味:
  - ノーズ終端カーブの線形化係数
- 主な演算:
  - `normalizedNoseConfig()` 内 `rawLinearization`

### `p82 : noseWidthAdjust`

- 型: 数値
- 範囲:
  - UI 上は `-1`〜`1`
- 内部意味:
  - ノーズ幅補正スケール
- 主な演算:
  - `normalizedNoseConfig()` 内 `widthAdjust`

---

### `p68 : wingPreset`

- 型: 文字列
- 例:
  - `stinger`, `wing`, `wing-pin`, `custom`
- 主な演算:
  - `wingPresetForBoard()`
  - `normalizedWingConfig()`

### `p69 : wingPosition`

- 型: 数値
- 単位: cm
- 意味:
  - テール基準のウィング位置
- 主な演算:
  - `normalizedWingConfig()`
  - `moveWingDrag()`

### `p70 : wingWidth`

- 型: 数値
- 単位: cm
- 意味:
  - アウトラインを内側へずらす量
- 主な演算:
  - `normalizedWingConfig()`

### `p71 : wingShape`

- 型: 文字列
- 例:
  - `bump`, `step`
- 主な演算:
  - `normalizeWingShapeKey()`
  - `normalizedWingConfig()`

### `p72 : wingShoulder`

- 型: 数値
- 意味:
  - bump 形状の肩の立ち上がり
- 主な演算:
  - `normalizedWingConfig()`

### `p73 : wingTransition`

- 型: 数値
- 意味:
  - bump / step の前後移行長
- 主な演算:
  - `normalizedWingConfig()`

---

### `p83 : bottomFeatures`

- 型: JSON 文字列
- 読み込み:
  - `parseBottomFeatures()`
- 書き出し:
  - `serializeBottomFeatures()`
- 主な演算:
  - `normalizeBottomFeatures()`
  - `rebuildBoardBottomFeatureSections()`
  - `applyBottomFeaturesToSectionKnots()`
  - `ensureCrossSectionsForBottomFeature()`

#### JSON 配列の 1 要素

```json
{
  "id": "single-concave-1",
  "type": "single-concave",
  "enabled": true,
  "start": 41.1,
  "peak": 137.2,
  "end": 230.4,
  "depth": 0.16,
  "width": 0.67,
  "blend": 1,
  "offset": 0,
  "spacing": 0.12,
  "count": 1,
  "longitudinalFlat": 0,
  "centerDepth": 0,
  "railDepth": 0,
  "railLockCm": 5,
  "power": 1.8,
  "edge": 0.78
}
```

#### 各キーの意味

| キー | 型 | 単位 | 意味 |
| --- | --- | --- | --- |
| `id` | string | - | UI 管理用 ID |
| `type` | string | - | `single-concave` / `double-concave` / `vee` / `spiral-vee` / `hull` / `displacement-hull` / `channel` |
| `enabled` | boolean | - | 有効フラグ |
| `start` | number | cm | テール基準の開始位置 |
| `peak` | number | cm | 効果最大位置 |
| `end` | number | cm | 終了位置 |
| `depth` | number | cm | 単一深さ。上限 0.5cm = 5mm |
| `width` | number | 比率 | ストリンガー基準の有効幅比率 |
| `blend` | number | 無次元 | longitudinal / lateral のブレンド係数 |
| `offset` | number | 比率 | ダブルコンケーブ溝やチャネル中心のオフセット |
| `spacing` | number | 比率 | チャネル間隔 |
| `count` | number | 個数 | チャネル本数等 |
| `longitudinalFlat` | number | 無次元 | 長手方向平坦化係数 |
| `centerDepth` | number | cm | ダブルコンケーブ中央側の深さ |
| `railDepth` | number | cm | レール側溝またはチャネル深さ |
| `railLockCm` | number | cm | レール保護帯の幅 |
| `power` | number | 無次元 | 円弧/凸凹プロファイルの指数 |
| `edge` | number | 無次元 | 切替の鋭さ |

#### 型ごとの主な演算

- `single-concave`
  - `bottomFeatureLateralProfile()` の単一溝
- `double-concave`
  - `centerDepth` と `railDepth` を別々に使用
  - `shapeExplicitDoubleConcaveSegment()`
- `vee`
  - ストリンガー固定、レール側持ち上げ
  - `shapeExplicitProtectedVeeSegment()`
- `spiral-vee`
  - `offset` で Vee の立ち上がり開始を制御
- `hull`
  - 凸面 belly 生成
- `displacement-hull`
  - belly + レール薄化寄りの凸面
- `channel`
  - `count`, `spacing`, `offset`, `railDepth`, `width` を使用
  - `shapeExplicitChannelGroove()`

### `p84 : bottomPreset`

- 型: 文字列
- 例:
  - `custom`
  - `displacement-hull`
  - `longboard-rolled-vee`
  - `shortboard-single-to-double`
  - `shortboard-single-to-vee`
  - `performance-channel-quad`
- 主な演算:
  - `normalizeBottomPresetKey()`
  - `bottomPresetFeatures(key, board)`

---

### `p85 : edgeType`

- 型: 文字列
- 例:
  - `soft`, `tucked`, `hard`
- 主な演算:
  - `normalizeEdgeTypeKey()`
  - `normalizedEdgeConfig()`
  - `applyEdgeModeToSection()`

### `p86 : edgeStrength`

- 型: 数値
- 範囲:
  - `0`〜`1`
- 意味:
  - エッジの強さ
- 主な演算:
  - `normalizedEdgeConfig()`
  - `edgeEffectAtSection()`

### `p87 : edgeLength`

- 型: 数値
- 単位: cm
- 意味:
  - テール側からのエッジ適用長
- 主な演算:
  - `normalizedEdgeConfig()`
  - `edgeEffectAtSection()`

### `p88 : edgeFade`

- 型: 数値
- 単位: cm
- 意味:
  - エッジ終端のフェード長
- 主な演算:
  - `normalizedEdgeConfig()`
  - `edgeEffectAtSection()`

---

### `p89 : rockerPreset`

- 型: 文字列
- 例:
  - `custom`
  - `continuous-neutral`
  - `relaxed-drive`
  - `performance-curve`
  - `staged-speed`
  - `fish-retro-flat`
  - `gun-continuous`
  - `longboard-glide`
- 読み込み:
  - `normalizeRockerPresetKey()`
- 書き出し:
  - `rockerPresetOrDefault()`

### `p90 : rockerConfig`

- 型: JSON 文字列
- 読み込み:
  - `parseRockerConfig()`
- 書き出し:
  - `serializeRockerConfig()`
- 主な演算:
  - `rockerTargetCurvePoints()`
  - `applyRockerConfigToBoard()`
  - `rockerMeasurementStations()`

#### JSON オブジェクト

```json
{
  "preset": "continuous-neutral",
  "enabled": true,
  "noseRocker": 11.25,
  "tailRocker": 2.25,
  "entryLengthRatio": 0.25,
  "entryLift": 0,
  "middleFlatness": 0.18,
  "tailKickLengthRatio": 0.25,
  "tailKick": 0,
  "apexShift": 0,
  "blend": 1,
  "preserveFoil": true,
  "preserveDeck": false
}
```

#### 各キーの意味

| キー | 型 | 単位 | 意味 |
| --- | --- | --- | --- |
| `preset` | string | - | ロッカープリセット名 |
| `enabled` | boolean | - | 目標ロッカー線の有効化 |
| `noseRocker` | number | cm | ノーズ端の目標ロッカー値 |
| `tailRocker` | number | cm | テール端の目標ロッカー値 |
| `entryLengthRatio` | number | 比率 | ノーズ側持ち上げ区間長 / 全長 |
| `entryLift` | number | cm | ノーズエントリー追加持ち上げ量 |
| `middleFlatness` | number | 無次元 | 中央部のフラット化係数 |
| `tailKickLengthRatio` | number | 比率 | テールキック区間長 / 全長 |
| `tailKick` | number | cm | テールキック追加量 |
| `apexShift` | number | 無次元 | ロッカー最低点の前後移動 |
| `blend` | number | 無次元 | 全体ブレンド係数 |
| `preserveFoil` | boolean | - | 厚み分布保持 |
| `preserveDeck` | boolean | - | デッキ線固定。`true` の場合 `preserveFoil` は無効 |

---

## 3. 外部プログラムで読むときの優先順位

### 3.1 最終形状だけ必要な場合

以下を優先:

1. `p32` アウトライン
2. `p33` ボトムロッカー
3. `p34` デッキロッカー
4. `p35` クロスセクション

この場合、`p58`〜`p90` は補助メタデータとして扱えば十分です。

### 3.2 BoardCAD Web と同じ編集状態を再現したい場合

以下も読む必要があります。

- フィン: `p58`〜`p61`
- テール/ノーズ/ウィング: `p62`〜`p82`
- ボトム: `p83`, `p84`
- レールエッジ: `p85`〜`p88`
- ロッカー: `p89`, `p90`

ただし、procedural テール/ノーズ/ウィングは書き出し時にベイクされるため、出力ファイルによっては値が空になることがあります。

---

## 4. 実装上の注意点

### 4.1 `p83` と `p90` は JSON として扱う

- `p83` は配列
- `p90` はオブジェクト

読み込み失敗時、BoardCAD Web は以下へフォールバックします。

- `p83`: 空配列
- `p90`: `defaultRockerConfig(preset)`

### 4.2 深さの上限

ボトム関連の深さはコード上 `BOTTOM_FEATURE_DEPTH_MAX = 0.5` で制限されています。

- 0.5cm = 5mm

### 4.3 レール保護帯

ボトム形状は、型によってレール近傍を固定します。

- 既定値: `BOTTOM_FEATURE_RAIL_LOCK_CM = 5`
- 最大 UI/内部値: `15`

### 4.4 単位系

本実装は BoardCAD 由来の cm ベースで統一されています。  
インチ表示は UI や説明用であり、内部データは cm 前提です。

---

## 5. 参考関数一覧

外部実装の挙動合わせに直接関係する関数:

- `.brd` 入出力
  - `parseBrd()`
  - `makeBrd()`
  - `brdExportValue()`
- テール/ノーズ/ウィング
  - `normalizedTailConfig()`
  - `normalizedNoseConfig()`
  - `normalizedWingConfig()`
- ボトム
  - `normalizeBottomFeatures()`
  - `bottomFeatureDefault()`
  - `bottomFeatureLateralProfile()`
  - `applyBottomFeaturesToSectionKnots()`
- レール/エッジ
  - `normalizeRailModeKey()`
  - `normalizedEdgeConfig()`
  - `applyRailModeToSection()`
  - `applyEdgeModeToSection()`
- ロッカー
  - `normalizeRockerConfig()`
  - `rockerTargetCurvePoints()`
  - `applyRockerConfigToBoard()`

---

## 6. 未整理事項

以下は現時点で互換性のため残しているが、UI 上の主操作からは外れている項目です。

- `tailLinearization` (`p74`)
- `noseLinearization` (`p80`)

これらは将来、再定義または削除される可能性があります。外部プログラムでは「未知項目でも無視できる」実装にしておく方が安全です。
