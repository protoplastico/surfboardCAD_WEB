# ノーズ/テール分離 設計指示書

## 現状の問題

### 突起バグ（修正済み — 対症療法）
テール/ノーズ形状の変更時にレールアウトラインに突起が発生。

**原因**: `boardCadTailOnlyPlanform` の点列結合部で、テール形状点列と
ベースアウトラインの連結後に `splineFromOrderedPoints` がジョイン点に
C1連続な制御点ハンドルを生成するが、曲率が急変するジョイン部では
平均化された接線がBézier曲線のオーバーシュートを招く。

**現行の対症療法**: ジョイン点のノットを `continuous=false`（角ノット）に
設定し、ハンドルをゼロ長に。突起は消えるが、ジョイント部がやや角張る。

### 設計上の問題: ノーズ=反転テール
ノーズ形状の適用パス:
```
outline → テールアルゴリズムで後端を成型
         → 結果のスプラインを X軸反転
         → 反転結果を再度テールアルゴリズムに通す（ノーズ側）
         → 結果を再反転して元の向きに戻す
```

この設計の問題点:
1. **反転でスプライン制御点のprev/nextが入れ替わる** — 丸め誤差が蓄積
2. **テールとノーズの形状パラメータが異なる意味を持つ**のに
   同一関数で処理（`noseTailModeKey` で形状名を変換）
3. **キャッシュが二重に無効化される** — `boardCadTailPlanform` 内で
   `boardCadTailOnlyPlanform` が2回呼ばれる（テール1回＋ノーズ用1回）
4. **ジョインが2箇所に増える** — テール側ジョイン＋ノーズ側ジョイン

## 分離設計

### 目標
- `boardCadNoseOnlyPlanform(board, segments)` を新設
- テール/ノーズで共通する数式（`tailOuterHalfWidthAt` 等）は
  パラメータ化した共通関数として残す
- ジョインのオーバーシュートを構造的に解消

### 新しい処理パス
```
                ┌── テール側ジョイン点
                │
outline ──→ baseHalf = wingAdjustedOutlineHalfPoints()
                │
       ┌────────┴────────┐
       │                 │
 buildTailShape()   buildNoseShape()
  (X=0..joinX)     (X=noseJoinX..length)
       │                 │
       └────────┬────────┘
                │
         mergeOutline()  ← ジョイン点でC0接続
                │
         splineFromOrderedPoints() + ジョイン点 corner 処理
```

### 共通化する関数（リネーム不要・引数追加で対応）

| 現行関数 | 変更 |
|----------|------|
| `tailOuterHalfWidthAt(tail, x, capLength)` | そのまま（tail/nose共用） |
| `tailOuterCurvedScaleAt(tail, u, capLength)` | そのまま |
| `tailInnerHalfWidthAt(tail, x)` | そのまま |
| `normalizedTailConfig(board, baseHalf)` | ノーズ版を新設 |
| `buildCapTailSpline(tail, forwardBase)` | ノーズ版を新設 |
| `buildGunTailSpline(board, tail, forwardBase)` | ノーズ版を新設 |

### `boardCadNoseOnlyPlanform` の骨格

```javascript
function boardCadNoseOnlyPlanform(board, segments, baseHalf) {
  const nose = normalizedNoseConfig(board);
  if (!nose.active) return null;

  // ノーズ側の baseHalf: ジョイン点からノーズ端まで
  const boardLength = Number(board?.length) || 0;
  const noseJoinX = boardLength - nose.length;
  const noseBase = monotonicPolylineFromX(baseHalf, noseJoinX);

  // ノーズ形状の点列を直接生成（反転なし）
  const positive = [];
  // ... noseBase の最後の点からノーズ端に向かって形状を生成
  // tailOuterHalfWidthAt 相当の関数を使うが、
  // X座標はノーズ端(=boardLength)を基準に「boardLength - x」で計算

  return { positive, noseJoinX, nose };
}
```

### `boardCadTailPlanform` の修正

```javascript
function boardCadTailPlanform(board, segments) {
  const baseHalf = wingAdjustedOutlineHalfPoints(board, segments);
  const tailResult = boardCadTailOnlyPlanform(board, segments);  // 既存
  const noseResult = boardCadNoseOnlyPlanform(board, segments, baseHalf);

  if (!noseResult) return tailResult;

  // テール側の点列 + ベースの中間部 + ノーズ側の点列を結合
  const merged = mergeOutlineWithCorners(
    tailResult.positive,
    baseHalf,
    noseResult.positive,
    tailResult.tail.rawJoinX,
    noseResult.noseJoinX
  );
  // ...
}
```

### mergeOutlineWithCorners

ジョイン点2箇所を角ノットにする:
```javascript
function mergeOutlineWithCorners(tailPoints, base, nosePoints, tailJoinX, noseJoinX) {
  const mid = base.filter(p => p.x >= tailJoinX && p.x <= noseJoinX);
  const merged = [...tailPoints, ...mid, ...nosePoints];
  const spline = splineFromOrderedPoints(merged);
  // tailJoinX と noseJoinX に最も近いノットを corner 化
  markCornerAt(spline, tailJoinX);
  markCornerAt(spline, noseJoinX);
  return spline;
}
```

## 作業分担

- **Opus**: この設計のレビュー、テスト追加仕様の策定
- **Sonnet**: 実装（`boardCadNoseOnlyPlanform` 新設、
  `boardCadTailPlanform` 修正、テスト追加）

## リスク

- ノーズ形状の全8モードが正しく動作するかの網羅テストが必要
- ghost ボード（比較用オーバーレイ）もこのパスを通るため、
  ghost 側の描画も確認が必要
- `.brd` ファイルの import/export は `normalizedNoseConfig` のみに
  依存しており、プランフォーム内部構造には依存しないため影響なし


---

## テスト仕様（Opus 策定済み → Sonnet 実装済み）

### S40: outline-smoothness セクション（test-core.js 末尾に追加済み）

1cm間隔でアウトラインをサンプリングし、3点窓内で「上昇→下降が両方0.15cm超」
のバンプを検出。閾値0.3cm超で FAIL とする。

| カテゴリ | テストケース数 | 検証内容 |
|----------|-------------|---------|
| ノーズ単体 | 8モード×1 | 全ノーズモードでバンプなし |
| テール単体 | 8モード×1 | 全テールモードでバンプなし |
| ノーズ+テール組合せ | 6組 | 実使用頻度の高い組合せ |
| ウィング+ノーズ | 3組 | ウィングとノーズのジョイン干渉 |

合計 **25ケース** — 全PASS確認済み。

## Sonnet 実装タスク（残）

1.  の新設（反転パスの置換）
2.  のノーズ部分を新関数に委譲
3.  の実装
4. 全テスト（既存S11 + 新規S40）の PASS を維持
5. 対症療法のジョイン地点 corner ハック（joinX検索）を除去

**判断基準**: S11（機能テスト）とS40（突起検出）の同時PASSが必要。
S40がPASSしてもS11がFAILする場合、形状の幾何的整合性が壊れている。
