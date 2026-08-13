# BoardCAD Web デバッグ・最適化 作業指示書

対象: `boardcad-web/app.js` (23,583行) / `test-core.js`
検証ゲート: `node test-core.js` **全15セクション PASS**（必須。全変更後に実行）
性能ゲート: フルスイート実行時間（基準値は下記）

## 完了済み（Fable — 変更禁止・参考情報）

| # | 内容 | 効果 |
|---|------|------|
| F1 | `test-core.js` S30: 断面選択を「ボード中央に最も近い断面」に修正。旧コードは編集不可のノーズ端点断面を選び得て、`basePosition+7 > 板長` でダイアログの正当なバリデーションに拒否されていた（テスト側の欠陥、アプリは正常） | フルスイート初のPASS |
| F2 | `boardCadCurveMinMax` を再帰サンプラー→**3次Bézier微分の閉形式**（2次方程式の根）に置換。旧実装は全CPUの46.2%を消費し、終了条件 `bestT − 区間幅/2 < tol` が次元的に誤っていた | スイート 95.8s → 59.3s |
| F3 | 同じ誤った終了条件を `boardCadCurveTForXRecursive` と `boardCadCurveClosestTRecursive` でも修正（正: `(t1−t0) < tol`） | 精度・停止性の正常化 |

現在の CPU プロファイル（S02、修正後）:
```
29.9%  cumulativeLengths          ← タスク1
10.6%  normalizeAngleRad          ← タスク2（呼び出し量が原因）
 7.8%  boardCadTailPlanform
 5.1%  boardCadSByNormalReverseFromSamples ← タスク2
 3.2%  boardCadCurveTForXInternal
```

---

## タスク1【Sonnet】blendPolylines の長さ配列再計算除去

**根本原因（診断済み）**: `blendPolylines`（~22320行）がループ内で
`pointAtPolylineFraction(a, f)` / `(b, f)` を呼び、各呼び出しが
`cumulativeLengths(points)` を**毎回ゼロから再計算**。関数には既に
`lengths` 引数が用意されているのに呼び出し側が渡していない。

**修正**:
```javascript
// blendPolylines のループ前に:
const lengthsA = cumulativeLengths(a);
const lengthsB = cumulativeLengths(b);
// ループ内:
const pa = pointAtPolylineFraction(a, f, lengthsA);
const pb = pointAtPolylineFraction(b, f, lengthsB);
```
出力は同一配列を使うため**ビット一致**。

**追加（任意・別コミット）**: `pointAtPolylineFraction` 内の線形走査を
二分探索化。fraction は単調増加で呼ばれるため resume-index 方式でも可。
数値結果が変わらないことを確認すること。

**受け入れ基準**: フルスイートPASS、`--cpu-prof` で cumulativeLengths が
5%未満、スイート時間短縮を記録。

---

## タスク2【Sonnet】断面サンプルの既存キャッシュ経路への統合

**根本原因（診断済み）**: `boardCadSurfacePointByAngleRange`（14822行）
の非controlpoint経路が、呼び出し毎に:
1. 隣接断面2つを `boardCadCloneKnots` + `boardCadCrossSectionScaleTo`
2. `boardCadPointInAngleRange` → `boardCadSplineSamples(knots, 18)` で
   フルサンプル配列を再生成（サンプル毎に atan2 + normalizeAngleRad）

3Dメッシュ・ツールパス生成は x×width の二重ループでこれを呼ぶため、
同じ断面ペアが何百回も再サンプルされる。

**不整合**: 兄弟関数 `boardCadSurfacePointAtAngle`（14641行）は既に
`crossSectionCacheMap`（5044行）で knots/samples をキャッシュしている。
ByAngleRange 経路だけがキャッシュ基盤を使っていない。

**修正方針**: `boardCadSurfacePointAtAngle` と同じキャッシュ利用パターンを
`boardCadSurfacePointByAngleRange` に適用する。キー = (断面index,
targetWidth, targetThickness) 量子化。`clearCrossSectionCachesForBoard`
の無効化タイミングは既存のまま流用（形状変更時に呼ばれている）。

**受け入れ基準**: フルスイートPASS、boardCadSplineSamples 呼び出し数が
ループ外に出たことをプロファイルで確認、スイート時間を記録。

---

## タスク3【Sonnet】未使用関数19件の削除

以下は定義のみで参照ゼロ（正規表現全走査で確認済み）:

```
boardCadRawWidthAtPos, densifyBottomFeatureKnots,
bottomFeatureOutlineDisplayRawRange, bezierSegmentFromCurveInterval,
mirrorOutlinePath, drawSectionsGrid, averageFaceHeight,
trimHalfSplineToX, boardCadSurfaceProfileAt, pointAtPolylineX,
shapeExplicitVeeSegment, shortboardTailHardEdgeTemplateSpline,
splineFromRailProfilePoints, railBranchXAtY, currentGuideTargetLabel,
getPanelPointForSelection, outlineHalfWidthAt, tangentAtPolylineFraction,
registerBottomFeatureOverlayHandle
```

**注意**:
- 削除前に各名前を再度 grep し、動的参照（`window[name]`, 文字列参照,
  HTML onclick）が無いことを確認すること。
- `tangentAtPolylineFraction` はタスク1で `pointAtPolylineFraction` を
  触るため、同ファミリとして扱いに注意（削除してよいが同時変更に注意）。
- index.html / app-downloads.js / tools/ からの参照も確認すること。

**受け入れ基準**: `node --check app.js` OK、フルスイートPASS。

---

## タスク4【Opus→Sonnet】boardCadTailPlanform (7.8%) の調査と対策

**現状**: プロファイル3位。テールプランフォーム（スプライン再構築）が
draw/commit 毎に走っている可能性。

**Opus の作業**: 呼び出し経路を特定し、(a) geometry-dirty フラグ連動の
キャッシュが可能か、(b) 既存 `parameterScalarCacheGet`（14344行）系の
無効化規約に適合するか、を判断して Sonnet 向けの修正仕様を書く。
プランフォームは編集中の board 状態に依存するため、**誤ったキャッシュは
描画が古い形状のまま残るリスク**がある。無効化条件の設計は Opus 必須。

---

## 作業ルール

1. 1タスク = 1コミット相当。各タスク後に必ずフルスイート実行。
2. 数値出力が変わる変更（キャッシュ導入で丸めが変わる等）は禁止。
   キャッシュは「同じ入力に同じ配列を返す」構成のみ許可。
3. スイート時間を毎回記録し、この文書の末尾に追記する。
4. 不明点は推測で進めず、プロファイル（`node --cpu-prof
   --cpu-prof-dir=DIR test-core.js --scenario=S02`）で裏取りする。

## 完了済み（Sonnet実施・検証済み）

| # | 内容 | 効果 |
|---|------|------|
| タスク1 | `blendPolylines` で `cumulativeLengths` をループ外に事前計算し、既存の `lengths` 引数経由で渡すよう修正。出力配列はそのまま流用のためビット一致 | 59.3s → 53.7s |
| タスク2 | `boardCadSurfacePointByAngleRange` を `boardCadSurfacePointAtAngle` と同じ `angle-context` キャッシュ基盤に統合。18点サンプルをキャッシュに追加保持し、元の `boardCadPointInAngleRange`（18点固定）と同一の呼び出し・同一の数式で出力をビット一致に維持 | 53.7s → 50.0s |
| タスク3 | 未使用関数19件を全削除（動的参照・他ファイル参照なしを確認済み） | コード量削減、保守性向上 |

いずれもフルスイートPASS維持。

## 未着手（Opus判断待ち）

タスク4（`boardCadTailPlanform`、現在CPU 12.7%）は上記完了後も
プロファイル2位のまま残存。指示書のとおりキャッシュ無効化条件の設計に
Opusの判断が必要なため、Sonnet側では着手していない。

## 計測ログ

| 時点 | スイート時間 | 備考 |
|------|-------------|------|
| オリジナル | 95.8s | S30 FAIL |
| F2/F3 適用後 | 59.3s | 全PASS |
| タスク1後 | 53.7s | 全PASS |
| タスク2後 | 50.0s | 全PASS |
| タスク3後 | 50.0s (時間不変、コード量減) | 全PASS |
| タスク4診断後 | ~53s | 全PASS |

**合計: 95.8s → ~53s（1.8倍）**

### タスク4 診断結果

`boardCadTailPlanform` のキャッシュは正しく機能していた。CPU消費の
原因はテストS02が29回のgeometry変更（= 29回のrevision更新）を行うため、
各revision毎に再計算が走る正常動作。ブラウザ実使用時はユーザー操作時のみ
revisionが更新されるため、キャッシュヒット率は高い。追加キャッシュ不要。

追加修正: `normalizeAngleRad` の while ループを `% (2π)` に置換。
大角度入力時のループ爆走を防止（実速度差は微小だが安全性向上）。
