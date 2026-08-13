# サーフボード断面station配置とloft品質

調査日: 2026-08-12  
担当: research-25（section placement / topology / loft fairness）

## 結論

断面stationは多いほど正確なのではない。自由度を増やすためだけにstationを足すと、各断面が正しく見えても長手方向にlump、twist、curvature oscillation、surface foldが生じる。Shape3D公式も「少ないCPほどsmooth、少ないsliceほどsmooth」とし、通常のsliceは4–5 CP、center sliceを基にnose/tailへsmoothly evolveさせることを推奨する。[Shape3D X Manual](https://www.shape3d.com/support/User_Manual_V9.htm)

推奨方針:

1. outline/rocker/thickness/featureの**変化点**にだけkey stationを置く
2. 全断面に同じsemantic landmarksとcurve topologyを持たせる
3. apex/tuck/deck shoulder/bottom trough/channel等を長手guide pathsとして揃える
4. station挿入はNURBS knot insertion/surface evaluationでshape-preservingに行う
5. section単体だけでなくlongitudinal isocurves、curvature、Jacobian、intermediate slicesで検証する

## 1. stationの役割

station `Si` は長手位置 `xi` の横断curve `Ci(v)=(y,z)`。loft surfaceを

```text
S(u,v),  u≈x/L,  v=bottom center→rail→deck center
```

として生成する。

stationには2種類を分ける。

- **key/design station**: ユーザーが形状意図を定義する断面
- **derived/evaluation station**: surfaceから計算される表示・CNC・検査断面。自由CPを持たない

加工用断面を増やすことと、設計自由度を増やすことを同一操作にしない。

## 2. section placement

### key stationを置く理由

- nose/tail tip近傍でwidth/thicknessが急変
- wide point / maximum thickness region
- rail apex/tuck/edgeのtransition開始・最大・終了
- bottom contourのsingle/double/vee peak/fade境界
- fin cluster前後、channel start/exit
- wing/step/chine等のtopology/feature境界
- scan fitting errorが許容値を超える
- curvature/adaptive error estimatorが閾値を超える

### 置かない理由

- 寸法を表示したいだけ
- CNC toolpath間隔を細かくしたいだけ
- 既存surfaceの中間形を確認したいだけ
- 幅/厚さ測定stationを追加したいだけ

これらはderived station/constraintとして扱う。

### 初期戦略

汎用boardではまず5–7 key stations程度から始める例:

1. tail epsilon station（退化tipそのものを避ける）
2. tail/fin region
3. rear-mid/hip transition
4. center/wide-point region
5. front-mid/entry transition
6. nose region
7. nose epsilon station

固定数ではない。channel、step、wing等があれば局所追加。Shape3Dはright number depends on shapeとし、少ないsliceを原則とする。AKUのhollow-board例は製造rib用に一定間隔sliceを追加するが、追加後に元のintermediate sliceへ合わせないとlumpになると説明するため、設計stationと製造stationを分ける根拠になる。[AKU Hollow Wood tutorial](https://help.akushaper.com/article/17-hollow-wood-surfboards)

### adaptive placement

候補区間 `[xi,xi+1]` のmidpointで現在surfaceと高精度target/scan/feature modelを比較する。

```text
Einterval = wP * max positionError
          + wN * max normalAngleError
          + wK * max curvatureError
          + wF * semanticFeatureError
```

閾値超過区間にだけknot/stationを追加。追加後は形状を変えず、必要な場合のみ新DOFを解放する。

## 3. topology一致

Shape3Dは全sliceが同じCP数を持つことを要求し、不要点をpassive pointにできる。一般NURBS loftでもdegree、knot vector、curve direction、seam/parameter correspondenceを揃えることが重要。[Shape3D Manual](https://www.shape3d.com/support/User_Manual_V9.htm) Rhino Loftもcurve seamを揃え、方向をreverse/alignし、rebuild/refitでcontrol-point structureを決める機能を公式に提供する。[Rhino 8 Loft](https://docs.mcneel.com/rhino/8/help/en-us/commands/loft.htm)

### 同一にすべきもの

- curve orientation（left/right、bottom→deckの向き）
- start point/seam
- degree
- knot vector / spans
- semantic landmark order
- feature edge/chineのsegment boundary

### semantic landmarks

```text
bottom stringer
single center / double spine
double trough / channel boundaries
bottom shoulder
tuck/rail point
apex
deck shoulder / gutter / step
deck stringer
```

すべてのboardに全要素が必要ではない。存在しないfeature用には次を選ぶ。

1. passive/derived landmarkをshape上へ置く
2. feature専用surface patchを分離し、base loft topologyを汚さない
3. feature birth/death対応のdegenerate-safe patch

同一点へ複数CPを潰す方法はzero tangent、loop、singularityを作るため避ける。

### correspondence

同じindexが異なる意味（ある断面ではapex、次ではtuck）になるとloftがtwistする。index一致だけでなくsemantic IDで対応させる。

```json
{"point":{"semantic":"rail.apex","v":0.62,"position":[...]}}
```

## 4. interpolation

### 悪い方法

- nearest stationのcopyを新xへ置く
- stationごとのBezier CP座標を単純linear interpolation
- curve arc-length parameterだけで異なるfeatureを対応
- 各断面を独立にfitしてから無条件loft
- profilesを同じpoint countにしただけで意味を揃えない

AKU公式は新sliceがnearest adjacent sliceの属性を継承し、そのままではlongitudinal flowが合わずlumps/bumpsになると明記し、元のintermediate sliceへ合わせる手順を画像で示す。[AKU tutorial](https://help.akushaper.com/article/17-hollow-wood-surfboards)

### 推奨方法

#### A. semantic parameter interpolation

`apexZ(x)`, `tuckInset(x)`, `railFullness(x)`, `concaveDepth(x)`等をcubic B-splineで補間し、各xで断面generatorを再solveする。

利点: 設計意味を保つ。欠点: arbitrary scan shapeにはgenerator能力が必要。

#### B. compatible NURBS loft

全sectionをdegree elevation/knot insertionでcompatible化し、control rowsをlongitudinal B-splineで補間/近似。

利点: 一般形状。欠点: correspondence/topology不良をそのまま曲面へ伝える。

#### C. hybrid

semantic guide curvesを拘束しつつcompatible loftをfairing。surfboardには最適。

Autodeskはguide railsがprofiles間でpoint matchingを制御し、undesired wrinklesを防ぐと公式説明する。[AutoCAD Loft](https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-Core/files/GUID-0A041818-2E32-4212-A3D8-CE0361C3D229.htm) Fusionもguide railは全profileへ接触しなければならないとする。[Fusion Loft Rails](https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/How-to-create-a-Loft-with-guide-rails-in-Fusion.html)

## 5. feature alignment

guide pathを設けるfeature:

- outline/apex
- bottom/deck stringer
- tuck/release edge
- deck shoulder
- bottom concave trough/spine
- channel shoulders/bottom
- chine/bevel boundaries
- step/gutter paths

guideは全sectionと交差し、同じsemantic landmarkを通る。channelのように途中で生まれるfeatureは、全長base loftのguideに無理に含めずlocal patch化する。

### alignment frame

section planeを単純なworld `x=const`にするか、stringer/rocker法線に沿うplaneにするかを混同しない。surfboard CADの通常sliceは長手軸に直交するplan OYZだが、developed/rocker-normal sectionを使うなら変換を保存する。異なるframeのsectionsをそのままloftするとtwist/thickness errorが出る。

```json
{"station":{"x":800,"frame":"global_transverse","origin":[...],"axes":[...]}}
```

## 6. fairness

fair surfaceは単にG1/G2を満たすだけでなく、曲率の変化が穏やかである。

### curve-level

- section curvature `κv`
- longitudinal isocurve curvature `κu`
- curvature variation `dκ/ds`
- unintended inflections

### surface-level

- mean/Gaussian curvature
- principal/directional curvature
- normal variation
- zebra/reflection-line smoothness
- fairness energy

```text
E = wD * data/constraint error
  + wU * ∫∫ |Suu|² du dv
  + wV * ∫∫ |Svv|² du dv
  + wUV* ∫∫ |Suv|² du dv
  + wK * curvatureVariation
```

feature edges/chinesはfairing domainを分割し、creaseを平滑化しない。

### continuity

- section curve内: soft regions G2、hard edge G0/G1 feature
- longitudinal patch joins: G1最低、visible body surfaceはG2目標
- centerline mirror: tangent plane一致、通常G2
- deck/rail/bottom patch junction: designに応じG1/G2

Rhinoのparametric curve/surface解説はknot multiplicityがcontinuityを制御し、degree/CP数だけ同じでもknot vectorで形が変わると図示する。[Rhino NURBS mathematics](https://developer.rhino3d.com/en/guides/general/essential-mathematics/parametric-curves-surfaces/)

## 7. 波打ちの原因と防止

### 原因

1. station過多/過拘束
2. uneven spacingでparameterizationが不適切
3. semantic CP correspondence不一致
4. stationごとの独立fit noise
5. width/heightの急scale
6. zero/short tangent、重複CP
7. feature開始/終了を断面単位でon/off
8. high-degree/global interpolantのovershoot
9. scan noiseのexact interpolation
10. rail/apex/tuck guide間の矛盾

### 防止

- approximation/refit toleranceを使いscanを全点通過しない
- chord-length/centripetal parameterizationを候補比較
- cubic local-support B-splineを既定
- geometryとfairnessのweighted solve
- feature envelopeにsmootherstep/G2 fade
- key stationを減らしderived sectionsで確認
- guide pathsを先にfairにする
- station insertionはshape-preserving knot insertion

Rhino公式Loftはinputをrebuild/refitしsurface control structureを選べる。dense/不均一なinput structureを持ち込まないことが重要。[Rhino Loft](https://docs.mcneel.com/rhino/8/help/en-us/commands/loft.htm)

## 8. surface folds / twist

### 検出

- surface Jacobian `|Su × Sv|` がepsilon以下
- signed orientationの反転
- adjacent mesh face normal flip
- iso-u/iso-v curve intersections/loops
- section ordering reversal
- self-intersection BVH検査
- outline/centerline境界のcrossing
- thickness negative / deck-bottom intersection

### 主な原因

- section direction/seam反転
- landmark ordering swap
- tip近傍のzero-width degeneration
- guide railsが交差
- very close/duplicate stations
- feature CPを一点へcollapse
- incompatible profilesを無理にloft

### tip戦略

Shape3Dはnose/tailのwidth/thicknessを厳密な正値にし、pinではなく小さくsquareにするよう警告する。tip sliceの退化を避けるため、`epsilon width/thickness` stationを置き、visual tipはcap/termination patchで閉じる。[Shape3D Manual](https://www.shape3d.com/support/User_Manual_V9.htm)

## 9. 少数section戦略

### 最小モデル

- まずcenter sectionを作る
- nose/tail側へhomothetic/semantic copyし、必要な変化だけ編集
- front/rear transition stationを追加
- intermediate surfaceを評価
- error/feature必要時のみ追加

Shape3D公式もcenter sliceからcopyし、他sliceをsmoothly evolveさせる方法を推奨する。

### 追加判定

station追加前に問う:

1. 新しいsemantic feature/transitionがあるか
2. 既存cubic spanではtarget toleranceを満たせないか
3. guide curveの曲率変化が1 spanで不十分か
4. 追加はshape-preservingか、新DOFが必要か

すべてNoならderived stationにする。

### section removal

各key stationを一時除去し、再fit surfaceとの差を評価。

```text
removalError = max(position, normal, curvature, feature path error)
```

閾値未満ならkeyからderivedへ降格。削除後にvolume/width/thickness/feature constraintsも再確認。

## 10. loft生成パイプライン

1. coordinate/frameと左右対称/非対称を確定
2. outline、deck/bottom stringer、apex/tuck等guide pathsをfair化
3. 最少key stationsを配置
4. semantic section generatorで断面作成
5. orientation/seam/semantic orderを検証
6. degree elevation/knot insertionでcompatible化（形状不変）
7. guide-constrained cubic NURBS loft/approximation
8. centerline/patch join G1/G2 solve
9. adaptive intermediate sampling
10. fold/self-intersection/thickness/curvature/fairness検査
11. 必要区間だけstation/knot追加
12. CNC mesh/toolpathはsurfaceから独立密度で生成

## 11. 検証指標

### section

- landmark順序、CP重複、loop、zero tangent
- area、width、thickness、apex/tuck/edge値
- curvature comb

### longitudinal

- landmark pathsのposition/tangent/curvature
- section area、rail volume、concave depth等の長手グラフ
- intermediate slice onion-skin
- iso-curvesのcompressed/wire view

### surface

- zebra/reflection lines
- Gaussian/mean/principal curvature maps
- normal-angle heatmap
- Jacobian/orientation/fold
- self-intersection
- deck-bottom minimum thickness
- silhouette fairness in arbitrary views

Shape3DはWire viewを回転/圧縮してsmoothnessを確認し、curvature/radius、重複CP、kinks、loopsを表示する。AKUはintermediate slice、Spot Check、Bad Points Checkを持つ。[Shape3D Manual](https://www.shape3d.com/support/User_Manual_V9.htm) / [AKU Slices/Rails](https://help.akushaper.com/article/37-slices-rails-how-to)

## 12. 誤実装しやすい点

1. design stationsとmanufacturing/evaluation sectionsを同一化
2. 等間隔で多く置けばsmoothになると考える
3. point countだけ揃えsemantic topologyを揃えない
4. section seam/directionを検査しない
5. nearest slice copyを自動挿入として採用
6. CP座標linear interpolationだけでloft
7. station追加時にsurface shapeが変わる
8. absent featureのCPを同一点へcollapse
9. channel/chine birth/deathをglobal loftへ押し込む
10. G1だけでfairと判定しcurvature oscillationを見ない
11. all-through exact interpolationでscan noiseを拾う
12. hard edgeをfairingで消す
13. nose/tailをzero-width sectionで閉じfoldを作る
14. section単体表示だけで3D longitudinal flowを確認しない

## 13. UI/データモデル

- key stationは実線、derived stationは破線
- `Insert without changing shape`を既定操作
- `Promote to design station`で初めてDOF解放
- stationごとにsemantic landmark glyph
- guide path選択時に全station対応点をhighlight
- topology mismatch、reversed curve、duplicate stationを即時警告
- onion-skin、wire/compressed、zebra、curvature graphを簡単に切替
- section deletion previewにposition/normal/volume errorを表示
- feature patchとbase loftのstation setを分離可能

```json
{
  "station": {
    "id":"s-mid",
    "x":914.4,
    "role":"key",
    "frame":"global_transverse",
    "sectionTopology":"base-v3",
    "semanticPoints":["bottom.center","bottom.tuck","rail.apex","deck.shoulder","deck.center"]
  }
}
```

## 14. 画像・CAD出典

1. [Shape3D X Manual HTML](https://www.shape3d.com/support/User_Manual_V9.htm) / [PDF](https://shape3d.com/Manuals/User_Manual_V9.pdf) — slice/CP数、apex/rail point、passive point、wire/curvature、loop/kink、末端退化防止のCAD図。
2. [AKU Hollow Wood tutorial](https://help.akushaper.com/article/17-hollow-wood-surfboards) — slice追加前後、intermediate sliceへ合わせlumpを防ぐ連続画像。
3. [AKU Slices/Rails](https://help.akushaper.com/article/37-slices-rails-how-to) — auto blend、intermediate slice、channel alignment、Bad Points Check画像。
4. [Rhino 8 Loft official](https://docs.mcneel.com/rhino/8/help/en-us/commands/loft.htm) — seam/direction alignment、rebuild/refit、tangent matching、split-at-tangentsの図。
5. [Rhino Parametric Curves & Surfaces](https://developer.rhino3d.com/en/guides/general/essential-mathematics/parametric-curves-surfaces/) — degree、knot vector、multiplicity、continuityを図解。
6. [Autodesk AutoCAD Loft](https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-Core/files/GUID-0A041818-2E32-4212-A3D8-CE0361C3D229.htm) — guide curveでcross-section correspondenceとwrinkleを制御。
7. [Autodesk Fusion Loft Rails](https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/How-to-create-a-Loft-with-guide-rails-in-Fusion.html) — guideが全profilesに接触する条件と画面図。
8. [Rhino User Guide PDF](https://docs.mcneel.com/rhino/7/training-command/en-us/usersguide/Rhino%20User%27s%20Guide%20for%20Windows.pdf) — boat loft、curve rebuild、curvature graphの実習図。
9. [Optimal lofted B-spline surface interpolation paper](https://arxiv.org/abs/2202.06330) — serial contoursのB-spline loftとCP増大問題。

## 実装優先順位

1. key/derived station分離とshape-preserving insertion
2. semantic landmark IDs、curve orientation/seam/topology validator
3. compatible cubic NURBS loft + apex/tuck/stringer guide paths
4. intermediate slice/onion-skin、longitudinal graph、fold/Jacobian検査
5. G2/fairness solve、adaptive station insertion/removal
6. local feature patches、scan refit、CNC sampling分離

## 出典評価

surfboard固有のstation実務はShape3D・AKU Shaper公式を最優先した。loftの一般的なseam、curve compatibility、guide、NURBS continuityはRhino/McNeelとAutodeskの公式CAD資料で補った。一般CADの「同じCP数」は必要条件の一部にすぎず、surfboardではapex/tuck/edge/bottom featureのsemantic alignmentを追加要件とした。

