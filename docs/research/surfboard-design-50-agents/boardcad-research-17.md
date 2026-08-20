# サーフボード設計調査 17：ロッカーのCAD曲線生成

調査日: 2026-08-12

## 推奨アーキテクチャ

ロッカーの保存truthを「nose/tail lift＋手描きCP」にせず、次の4層に分ける。

1. **Measurement layer**: datum付きの実測station `(x_i,z_i, tolerance, source)`
2. **Design constraint layer**: endpoint、tangent、station、flat-zone、curvature、monotonicity等
3. **Fair curve layer**: cubic B-splineまたはpiecewise cubic Bézierの正規曲線
4. **Derived synchronized curves**: deck、left/right rail rocker、bottom contour適用後のstringer/rail

編集UIのCPはdesign handleであり、測定点そのものと混同しない。最少CPは目的ではなく、必要constraintを満たす最少自由度＋fairness余裕を持つことが目的。

## 座標・datum

- board座標を `x=0` nose tip、`x=L` tail tip、`z` deck方向正とする。
- rocker stick実測を取り込む際はdatum methodを必須化:
  - `midpoint_tangent`: midpoint付近でstick接触・水平
  - `apex_tangent`: bottom最低点で接触
  - `central_best_fit`: 指定中央区間への最小二乗直線
  - `tip_chord`: nose-tail chord（業界rocker値とは通常異なる）
  - `machine`: scanner/CNC固定座標
- 各measurement setにrigid transform `T_measure→board`、units、finished/blank、center/rail、左右、温度・荷重状態を保存。
- datum変更は曲線を変形せず剛体回転・平行移動だけ行う。rocker shapeの比較にはtranslation/rotation不変な曲率も併用。

## Constraintモデル

### Hard constraints

- endpoints: `R(0)=(0,z_n)`, `R(1)=(L,z_t)`
- x monotonicity: `dx/du > 0`（loop/backtracking禁止）
- selected exact stations: `z(x_i)=z_i`
- symmetry/coordinate constraints、minimum thicknessなど製造条件

### Soft constraints

- scan/rocker-stick stations: `|z(x_i)-z_i| ≤ tolerance_i`
- desired endpoint tangent、zone slope、curvature targets
- legacy CP shapeへの近さ
- volume/foil preservation

実測ノイズをすべてhard interpolationするとwavy curveになる。CAGDのfairingは、data誤差とroughness energyを重み付き最小化するのが標準的考え方。

## Curve表現

### 単一cubic Bézierの限界

`B(t)=Σ b_i^3(t)P_i, i=0..3`。4 CPでendpointはP0/P3、endpoint tangentは`3(P1-P0)`と`3(P3-P2)`。

- endpoint位置を固定すると自由度はP1/P2のみ。
- endpoint tangent方向・長さまで固定すると自由度をほぼ使い切り、中間stationを複数正確に通せない。
- continuous rocker全体を単一cubicで表せる場合はあるが、staged/flat-center/accelerated tipsを同時に制御するには不足。
- 高次単一Bézierで点を増すより、局所制御を持つpiecewise cubic/B-splineが安全。

### 推奨: clamped cubic B-spline

- degree 3、open/clamped knot vector。
- interior knotsをnose transition、flat-zone端、tail transition等の機能位置へ置く。
- simple knotならC2連続。表示/export時に等価なpiecewise cubic Bézierへ変換可能。
- local supportによりstation修正の影響範囲を限定できる。

### UI用piecewise Bézier

- continuous basic rocker: 2–3 cubic segments（7–10 unique CP相当）から開始。
- staged rocker: nose / center / tailの3 segmentsを基本。必要時のみtransition segment追加。
- 1 segment = 4 CPだが共有anchorで `3n+1` CP。G2 constraintでhandle自由度を減らす。
- 「anchor数」をnose tip、nose-stage、center/flat-zone端、tail-stage、tail tipの機能点へ対応させる。単なる等間隔anchorを置かない。

## G2 / C2連続

join anchor `Q` で最低限:

- G0: 前後segmentがQを共有
- G1: 前後tangent handleが同一直線・同方向
- G2: signed curvatureが一致
- C2: 同一parameter scaleで1次・2次微分も一致

等しいparameter spanのcubic BézierでC2を作る簡便条件は、join近傍のcontrol polygonの2階差分を一致させること。非一様spanではknot interval比を含める。UIが任意handleを独立移動させるとG2が壊れるため、join handleはcoupled constraintとしてsolverで更新する。

surfboard rockerではxを独立変数とするgraph `z=f(x)` が扱いやすい。joinで `f, f', f''` を一致させればC2であり、`dx/du>0`なら幾何的にもG2を満たす。vertical tangentが不要なrockerに適する。

## Fairnessと曲率分布

曲率は `κ = z''/(1+z'^2)^(3/2)`。rocker slopeが小さい中央ではほぼ`z''`。

推奨objective:

`E = w_data Σ((f(x_i)-z_i)/σ_i)^2 + w_bend ∫(f''(x))²dx + w_var ∫(f'''(x))²dx + w_prior E_prior`

- `∫(f'')²`: bending energy、不要な曲率を抑える
- `∫(f''')²`: curvature variationを抑え、flat→accelerated zoneの急変を防ぐ
- `E_prior`:既存design、blank natural rocker、target curvatureへの近さ
- monotone slope/convexity条件をinequality constraintにし、意図しないreverse rockerやinflectionを禁止

単純に曲率最小化すると必要rockerまで平らになる。design intentとしてtarget curvature plotとzone weightsを与える。continuousはκの滑らかな分布、stagedはκレベルが区間で異なるがtransitionは連続、と定義する。

## Continuous / staged生成

### Continuous preset

1. endpoint/station constraintsを正規化
2. nose/center/tailのtarget κを滑らかな低次curveで定義
3. cubic splineをfairness optimization
4. `κ(x)`に不要な局所極値がないか検査

### Staged preset

1. userがstage boundaries（例18 in nose、18 in tail）を指定
2. centerのmax curvatureまたはflatness toleranceを指定
3. nose/tailへκをsmoothstep等で増加
4. station constraintsを満たしながらG2 optimize

`flat spot`を完全直線hard constraintにすると両端で曲率0へ落とすtransition長が必要。短いtransitionでtip rockerを大きくすると曲率spikeになる。通常は `|κ|<κ_flat` のsoft zoneがfair。

## Endpoint処理

- tip endpointのzだけでなくtangent angleまたは近傍stationを指定する。
- nose/tail tipが物理的に丸い場合、bottom centerlineの測定終端とoutline tipの座標が一致しないことがある。測定referenceを定義。
- clamped splineはendpoint interpolationするが、endpoint curvatureを暗黙任せにしない。3/6/12 in stationかtip tangentで拘束。
- `natural boundary f''=0`は数値splineの便宜で、surfboard tipの物理要件ではない。無条件採用しない。

## Bottom / deck / rail rocker同期

### Bottomをmasterにする場合

- deck center: `D_c(x)=B_c(x)+thickness(x)`
- bottom rail: `B_r(x)=B_c(x)+contourOffset(x,y_rail)`
- deck railはrail section/volumeから導出

### Foilをmasterにする場合

- neutral/profile curve `M(x)` とthickness `T(x)`から `B=M-T·a(x)`, `D=M+T·(1-a(x))`
- `a(x)`でvolumeをbottom/deckどちらへ配分するか制御

### 注意

- single concaveはcenter bottomを上げ、rail rockerを相対的にcurvedにする。veeは逆。bottom contour変更時にcenter rocker固定／rail rocker固定／volume固定を選択させる。
- outline上のrail rockerはcenter x stationへの投影値とrail arc-length表現を区別。
- deck rockerをbottomへ単純constant offsetするとfoilが一定厚になり、意図するvolume distributionを失う。
- rail station間loftは同じtopologyとG2 surface continuityを保つ。

## 測定値roundtrip

### Import

1. units/datum/sourceを読む
2. station originとboard lengthを検証
3. datum transformを求めboard座標へ変換
4. outlier検出。ただし自動削除せずflag
5. uncertainty付きweighted fit
6. fit後に各station residualと最大/ RMS誤差を表示

### Export

1. 同一datumへ逆変換
2. 元と同じx stationsでcurveを評価
3. roundingは表示時のみ。内部double precision
4. source measurement、fitted value、residualを併記
5. re-importしてgeometry hash/curve samples/residualがtolerance内か自動test

### 許容誤差例

- CNC/scan truthは製造精度に合わせ0.1–0.5 mm程度を設定可能
- hand rocker-stickはstick直線度、水平、接触位置を考え1–2 mm以上も現実的
- 固定値にせず測定source別 `σ_i`。tipと中央で誤差特性も異なる

roundtrip test:

- datum invariant curvature一致
- station RMS / max error
- endpoint/tangent error
- monotonic x、no unintended inflection
- CP countとknot vectorの安定性
- serialized→deserialize後のsample Hausdorff distance

## 最少CP戦略

1. まず1 cubicをfitしconstraint/residual/fairness判定。
2. 不合格なら最大normalized residualまたは曲率変化の大きい機能位置へknot挿入。
3. refitし、G2・shape constraintsを再検査。
4. 追加によるAIC的改善または誤差閾値達成がなければ戻す。
5. flat-zone境界、accelerated nose/tail開始等の意味あるanchorだけUIに露出。

CP削減はcurve simplificationとして行い、候補anchor削除後に再最適化し、station tolerance、curvature extrema、Hausdorff error、同期surface thicknessを全て満たす場合のみ確定する。

## 実装用データ例

```json
{
  "datum": {"method":"central_best_fit","range":[0.4,0.6],"units":"mm"},
  "measurements": [{"x":0,"z":127,"sigma":1.0},{"x":305,"z":38,"sigma":1.5}],
  "curve": {"type":"cubic_bspline","degree":3,"knots":[],"controlPoints":[]},
  "constraints": {"xMonotone":true,"g2":true,"flatZones":[],"curvatureSign":"nonnegative"},
  "derived": {"deckRocker":"foil-linked","railRocker":"bottom-contour-linked"},
  "validation": {"rmsStationError":0.0,"maxCurvatureJump":0.0}
}
```

## 失敗パターン

- tip lift2点だけからcurveを生成し、中央curveが毎回変わる
- すべてのmeasurementをhard interpolateしてwiggleを作る
- staged joinでG1のみ、curvature combにspike
- CP削除後に見た目だけ確認し、station/rail thicknessがずれる
- concave変更でstringer rockerを変えたのにrail rocker・foilを再評価しない
- export時の丸め値を再度truthとしてimportし、反復でshape drift
- rocker stick datumとCAD chord datumを同じ数値として扱う

## 図解・専門URL

1. Greenlight rocker測定、同endpointで異なるcurve、blank rocker図  
   https://greenlightsurfsupply.com/pages/surfboard-rocker-and-foil-design-greenlight-surfboard-design-guide
2. Greenlight rocker-stick shaping写真  
   https://greenlightsurfsupply.com/pages/surfboard-building-guide-how-to-shape-surf-board
3. Natural Curves bottom/deck/rail rocker、continuous/speed-box/relaxed図  
   https://naturalcurvesboards.com/html/designhtml/rocker.html
4. Parametric surfboard CAD論文（断面・surface parameterization図）  
   https://cad-journal.net/files/vol_18/CAD_18%282%29_2021_297-308.pdf
5. Farin & Sapidis, constrained Bézier fairing（論文ページ）  
   https://doi.org/10.1016/0167-8396(90)90020-R
6. Minimum Curvature Variation technical report（curvature plots / G2）  
   https://www2.eecs.berkeley.edu/Pubs/TechRpts/1993/CSD-93-732.pdf
7. Target-curvature B-spline fairing PDF  
   https://citeseerx.ist.psu.edu/document?doi=467a0bcb0d02a5cda785750e2d3db9e84e44b74d&repid=rep1&type=pdf

## 出典

- Farin, G. & Sapidis, N. (1990), **Fairing Bézier curves with constraints**, Computer Aided Geometric Design 7, 43–55. interpolation/end/area constraints下で二階微分energyを用いるfairing。  
  https://doi.org/10.1016/0167-8396(90)90020-R
- Moreton, H. & Séquin, C., **Minimum Curvature Variation Curves, Networks, and Surfaces**. curvature variationとG2 fair shapeのCAGD基礎。  
  https://www2.eecs.berkeley.edu/Pubs/TechRpts/1993/CSD-93-732.pdf
- Xu, Li & Zhao, **Target Curvature Based Automatic Fairing of Planar B-Spline Curves**. target curvature plotと局所constraint optimization。  
  https://citeseerx.ist.psu.edu/document?doi=467a0bcb0d02a5cda785750e2d3db9e84e44b74d&repid=rep1&type=pdf
- Bris et al. (2021), **A Parametric Method to Customize Surfboard**, CAD&A 18(2), 297–308. surfboardのparametric CAD資料。  
  https://cad-journal.net/files/vol_18/CAD_18%282%29_2021_297-308.pdf
- Greenlight Surf Supply, **Surfboard Rocker and Foil Design Guide**. rocker station測定とcurve形状の専門実務資料。  
  https://greenlightsurfsupply.com/pages/surfboard-rocker-and-foil-design-greenlight-surfboard-design-guide
- Natural Curves Surfboards, **Surfboard Rockers**. bottom/deck/rail rockerとdesign class。  
  https://naturalcurvesboards.com/html/designhtml/rocker.html

## 注意

- CAGDのfairness最小値がsurfboard性能最適とは限らない。公平化は意図しないbump除去であり、design target curvatureを残す。
- G2は必要条件に近いが十分条件でない。G2でも曲率がjoin近傍で大きく振動し得るため、curvature extrema/variationを検査する。
- 測定精度より細かいCP操作や数値表示はfalse precisionになる。
