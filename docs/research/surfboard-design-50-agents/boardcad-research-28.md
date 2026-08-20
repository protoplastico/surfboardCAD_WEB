# CAD曲線fairnessと少数コントロールポイント設計

調査日: 2026-08-12

## 0. 結論

- CPを減らす目的は「データが少ない」ことではなく、意図しないwiggle/inflectionを防ぎ、semanticな編集を安定させること。
- 通常のsmooth surfboard outline/rockerはcubic single-spanまたは低span B-spline/NURBSを第一候補。角・notch・wing・hard edgeだけ意図的continuity break。
- 見た目、G0/G1/G2数値、curvature comb、反曲点数、寸法constraintを同時に検査する。G2接続でもcombにpeak/wobbleがあればfairとは限らない。

## 1. 曲線形式

### Cubic Bézier

`B(t)=Σ b_i,3(t) P_i`, t∈[0,1]、4 control points。endpointを通り、endpoint tangentはP0→P1、P2→P3。

- 1 segmentは直観的、single-spanで内部knot discontinuityなし。
- convex hull内に収まり、handleでtip tangent/curvatureをsemanticに扱いやすい。
- 1 CP移動がsegment全体へ影響（global）。長い複雑curveへsegmentを増やすとjoin管理が必要。

### B-spline

- piecewise polynomial basis、degree p、knot vector、control points。各CPの影響は有限knot interval（local control）。
- curve全体を高degree Bézierにせず複雑形を表現。uniform/open/clamped、knot multiplicityでcontinuityが変わる。
- degree pでsimple knotなら通常C^(p-1)。knot重複はcontinuityを下げ、corner/creaseを作れる。

### NURBS

- rational B-spline。各CPにweightを持ち、円錐曲線を正確表現可能。
- weightは強力だが編集意味が分かりにくく、過剰自由度。surfboard organic curveはweights=1のnon-rational B-splineで十分なことが多い。
- interchangeではdegree、knots、weights、parameter domainをすべて保存。

## 2. G0 / G1 / G2 / G3

- **G0 position:** endpoints同位置。位置だけでcorner可。
- **G1 tangent:** G0＋tangent方向一致。handle長/parameter speed一致までは要求しない。
- **G2 curvature:** G1＋join両側の曲率/radius一致。highlight/outlineの滑らかさに重要。
- **G3:** G2＋曲率変化率一致。class-A surface/highlight向け。surfboard outlineで必須とは限らないが長いfair curveに有用。
- `C1/C2`はparameter derivativesの大きさまで一致するanalytic continuity。G continuityと混同しない。

**用途:** smooth rail-to-tail/nose接続は最低G1、視覚・流体的fairnessにはG2を目標。square corner, swallow tip/notch, wing, hard edgeはG0/G1 breakを意図的featureとして保持。

## 3. Curvature comb

- curvature κ=1/Rをcurve normal方向へscaleして離散表示。comb toothの包絡が曲率分布。
- fair curve: tooth lengthが滑らかに変化し、不要なjump、spike、oscillationがない。
- G1 joinはcomb高さがjump可能、G2 joinは連続、G3ならslopeも滑らか。
- comb scale/sample countに依存するので値と表示倍率を固定。低sampleで短いwiggleを見逃さない。
- inflectionではsigned curvatureが0をcrossしcomb sideが反転。意図しない複数crossはoverfitの警告。
- curvature連続は必要条件で十分条件でない。連続でも大peak/flat spotが続けば形はlumpy。

## 4. Single-spanと少数CV

Autodesk AliasのGolden Ruleはsmooth curveにsingle-spanを推奨。multi-spanはspan boundaryでcontinuity breakの可能性。

- degree 3 single span = 4 CV。単純なnose/rail/tail sectionにまず試す。
- 制約を満たせない時だけdegreeまたはspanを追加。Aliasはlow curvature areaでは少数CVで足り、CVが“overworked”にならずsmooth distributionを推奨。
- 高degree single-spanは全体影響・数値/編集不安定を増す。複雑形はmoderate degree（通常3/5）＋少数span。
- CPを削り過ぎて1つのhandleにendpoint tangent、12-in width、局所曲率を同時強制すると“overworked”になり、別箇所が歪む。

## 5. Overfitting / fairness failure

- sampled outline点すべてをinterpolateすると測定noiseまで追従しwiggleが出る。近似fit＋tolerance＋fairness penaltyを使う。
- CP/knot追加はtraining errorを下げるが、curvature variationと編集自由度を増やす。
- objective例: data distance＋`λ∫κ² ds`（bending energy）または`∫(dκ/ds)² ds`＋constraint error。
- fairing後に重要寸法（length/12-in widths/max width/tip）を再constraint。
- polyline/scanからfitする際は左右を別々にnoise-fitせず、symmetry constraintまたは偏差レポート。

## 6. Semantic CP

CPを数学的indexでなく設計featureに結ぶ。

- `nose_tip`, `tail_tip`, `wide_point_region`, `section_join`
- square/squash `tail_corners`
- swallow `outer_tips`, `notch_apex`
- diamond `shoulders`, `center_tip`
- wing `step_before`, `step_after`
- rocker `entry_end`, `planing_apex`, `tail_kick_start`
- rail section `deck_join`, `apex`, `tuck`, `hard_edge`

測定station（12-in width等）は必ずしもcurve CPにせず、curve上のconstraint/virtual handleにする。余分なanchorを増やさない。

## 7. 局所編集

- Bézier segmentは4点の影響が全segment。section境界をsemantic featureに置けば予測可能。
- B-splineはbasis support内だけ変わるため局所編集向き。ただし局所CPを増やしすぎるとfairness悪化。
- edit modes:
  1. `free CV`
  2. `semantic dimension`（width/depth/radius）
  3. `continuity constrained`
  4. `fair optimize preserving constraints`
- user drag後、近傍のみfair solveし、locked tip/join/dimensionsを保持。変更影響範囲を色表示。
- symmetric boardはhalf curveをmasterにmirror。asym modeでのみ左右独立。

## 8. Inflection管理

- outlineの連続railは通常各sectionで曲率sign一定が望ましい。unintended S-curveはwater/visual flowのshoulderを作る。
- wing/hip付近は曲率急変を意図し得るが、名称だけでhidden inflectionを作らない。
- curvature zerosの個数/位置を自動検出し、presetごと許容数を定義。
- 3D rail/rocker surfaceではplan viewとside viewがfairでもspatial rail curveにinflection/twistが出るためprincipal curvature/zebraも確認。

## 9. サーフボード向け推奨構造

```text
curveSection {
  semanticRole
  type: cubic_bezier | bspline | nurbs
  degree, controlPoints, knots, weights
  startContinuity, endContinuity
  lockedConstraints[]
}
```

- central rail、nose、tailをsemantic sectionsに分けるが、smooth接続はsolverでG2。
- tail末端形状調整CPは残す。接続前の冗長CPはcomb/fit errorを確認してremove/rebuild。
- knot removal/degree reductionはshape deviation＋curvature deviationの両toleranceで受理。
- export tessellationはvisualだけ。editable masterとしてNURBS dataを保持。

## 10. QA指標

- G0 gap、G1 angle deviation、G2 absolute curvature deviation `|κ1-κ2|` とrelative radius deviation。
- max/RMS fit deviation、arc length、signed curvature extrema、inflection count。
- curvature variation/fairness energy、minimum radius。
- CP count/span count/degree、minimum knot interval。
- dimension constraint residual。
- zebra/highlight、curvature comb、porcupine、control polygon flowをvisual QA。

## 11. 図・公式CAD出典

1. Autodesk Alias – Continuity G0/G1/G2/G3  
   https://help.autodesk.com/cloudhelp/2026/ENU/Alias-Video-Tutorials/files/essential-concepts/continuity-g0-g1-g2-g3.html  
   各continuityのcurve、comb、必要CV配置を同一図で比較。
2. Alias Golden Rule: Single-span  
   https://help.autodesk.com/cloudhelp/2024/ENU/Alias-Getting-Started/files/alias-golden-rules/GUID-151252E8-8E7F-4119-90D1-9784A81C402A.html  
   single/multi-span comb比較と実務rule。
3. Alias CVs, Hulls and Degree  
   https://help.autodesk.com/cloudhelp/2025/ENU/Alias-Video-Tutorials/files/essential-concepts/cvs-hulls-and-degree.html  
   CV/hull、degree、hull crossingとinflectionの図。
4. Alias Curve Curvature Theory  
   https://help.autodesk.com/cloudhelp/2023/ENU/Alias-Getting-Started/files/theory-builders/GUID-882B194B-E044-4921-B130-47391EFA1443.html  
   curvature comb計算・読み方。
5. Rhino Continuity Descriptions  
   https://docs.mcneel.com/rhino/9/help/en-us/popup_moreinformation/continuity_descriptions.htm  
   G0–G4の公式図とderivative説明。
6. Rhino Curvature command  
   https://docs.mcneel.com/rhino/6mac/help/en-us/commands/curvature.htm  
   degree-2 G1 jump、degree-3 G2 spanのcomb画像。
7. CMU CAGD B-spline chapter  
   https://www.cs.cmu.edu/afs/cs/academic/class/15456-f15/Handouts/CAGD-chapter8.pdf  
   local convex hull/local controlの数学図。

## 12. 誤実装チェック

1. G1をhandle方向だけでなく長さも強制しC1と混同していないか。
2. G2 joinだけ合格してcomb spikeを見逃していないか。
3. すべてのmeasurement pointをinterpolating CPにしていないか。
4. corner/tip/notchのsemantic CPまでfairingで消していないか。
5. high-degree 1 curveで全boardをglobal編集しにくくしていないか。
6. knot/weightをexportから落として形状再現不能にしていないか。
7. outlineだけで3D rail surfaceのtwistを評価したつもりになっていないか。

