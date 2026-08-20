# BoardCAD canonical形状テスト仕様

版: 1.0-draft  
作成日: 2026-08-12  
対象: tail / nose / rail / bottom / rocker / edgeの生成、編集、保存・再読込、export  
目的: preset名ではなく、**幾何・topology・測定値・連続性・視覚形状**がcanonical定義を満たすことを再現可能に検証する。

## 1. 共通テスト規約

### 1.1 座標・単位・基準board

- 内部単位はcm、比較レポートはmm併記。tail tip/podの最後端を`x=0`、nose側を`+x`、stringerを`y=0`、deck側を`+z`とする。
- outlineは右半幅`y>=0`をcanonical curveとし、左をmirror。非対称テストだけ左右を独立。
- 基準board fixture:
  - shortboard: L=182.88 cm, W=50.80 cm, T=6.35 cm
  - midlength: L=228.60 cm, W=55.88 cm, T=7.30 cm
  - longboard: L=289.56 cm, W=58.42 cm, T=7.62 cm
- preset固有値を検証するとき、fixtureの元outline/rocker/sectionsをSHA-256で固定する。
- samplingはcurve parameter一定でなくarc lengthまたはx station一定。outline/rockerは1 mm以下、sectionは0.25 mm以下の間隔で評価する。

### 1.2 許容誤差レベル

|level|用途|絶対誤差|相対誤差|
|---|---|---:|---:|
|T0|保存→再読込、同一kernel再計算|1e-6 cm|1e-8|
|T1|analytic curve対sampling/export|0.01 cm (0.1 mm)|1e-4|
|T2|UI measurement、mesh/DXF往復|0.05 cm (0.5 mm)|0.1%|
|T3|golden raster silhouette|後述pixel規約|—|

角・notchなど意図したC0点の位置はT1。通常のshape parameter targetは個別指定がなければT2。

### 1.3 共通幾何invariant

全形状で必須:

1. 座標、handle、測定値がfinite（NaN/Infなし）。
2. outlineは自己交差なし、意図しない重複segmentなし、右半幅`y>=-T1`。
3. x単調が必要な通常outlineではbacktrackingなし。swallow/bat/diamond等の末端局所は明示したtopology graphで例外を管理。
4. mirror対象は左右点差`<=T1`。stringer seamはgap/overlap`<=T1`。
5. area/volumeは正、meshはwatertight、法線方向が一貫。
6. parameterを微小増分したとき、topology変更境界以外でHausdorff距離が有限かつ連続的に変化。
7. preset適用→undo→redo、JSON保存→再読込、DXF/mesh exportでcanonical measurementsが許容差内。

### 1.4 連続性の判定

接続点左右をarc length距離`ε=0.5 mm`で評価。

- G0: position gap `<=0.1 mm`。
- G1: unit tangentの角度差 `<=0.25°`（通常join）。意図したcornerだけtest manifestで免除。
- G2: signed curvature差 `max(0.002 mm^-1, 5%)`以内を目標。tail/nose→rail、bottom feature blend、rocker stage blendは必須。
- curvature spike: join近傍±20 mmの曲率が隣接medianの5倍超ならfail。ただしsemantic corner/notch/tipは除外。
- inflection数はmanifest期待値と一致。短い±2 mm内の符号往復はnumerical wiggleとしてfail。

## 2. Tail canonical tests

### 2.1 共通measurement

- `tailWidth12`: tipから304.8 mm前方の全幅。
- `podWidth`: x=0のmaterial interval全幅（pointは0）。
- `tailArea12/24`, `pullInStart`, `tipRadius`。
- notch系: `notchDepth`, `tipSpacing`, `notchRadius`。
- diamond/bat: `shoulderX`, `centerTipX`, `lobeDepth`。
- wingは別modifierとして`wingX`, `inset`, `stepRadius`。

### 2.2 topology / invariant matrix

|canonical tail|必須topology|幾何invariant|意図した非smooth点|
|---|---|---|---|
|square|直線pod＋左右2corner、notchなし|pod弦のstraightness最大偏差<=0.2 mm、corner後railは内向き|pod corners G0/G1 break可|
|rounded_square|直線pod＋丸い2corner|pod中央60% straightness<=0.2 mm、corner radius>0|なし（最低G1）|
|squash|浅い後方凸pod、notchなし|pod bulge>0、中央曲率同符号、rounded-squareよりstraightness差が有意|なし|
|round/thumb|単一の幅広い連続凸弧|hard cornerなし、tip radius大、round-pinよりarea12大|なし|
|round_pin|早いpull-in＋soft single tip|podWidth=0、tipRadius>pin、roundよりarea12小|中心tipは左右seam、接線連続|
|pin|single sharp tip|podWidth<=0.2 mm、tipRadius<=1 mm、notchなし|tip cuspのみ|
|swallow|外2tip＋中央凹apex|notchDepth>0、tipSpacing>0、center apexは両tipより前方|外tipとnotch apex|
|fish_tail|deep/wide swallow|swallowと同topology、指定threshold以上のdepth/spacing|同上|
|diamond|左右shoulder＋中央後方凸tip|centerTipがshoulderより後方、中央flat block幅<=0.2 mm、notchなし|shoulders、center tip|
|rounded_diamond|同topology、丸いshoulder|center単一tipを維持、shoulder radius>0|tipのみ、shoulderはG1|
|bat/star|中央凸tip＋左右2凹scoop＋外2tip|centerTipと外tipsがscoopsより後方。半面で極値順`center tip→scoop→outer tip→rail`|3 tips、必要に応じscoop境界|
|crescent/half_moon|円弧状中央cutaway＋外2tip|notch curvature連続、V-swallowよりapex radius大|外tipsのみ|

negative tests:

- diamond中央がflat block、または中央が凹ならfail。
- star中心がnotchで波形が複数往復するならfail（独自multi-pointとして別IDなら可）。
- round-pinとpinのtip radius/areaが許容差内で同一ならpreset distinction fail。
- fishをboard archetypeだけで判定、wingをtail topologyへ含めたらschema fail。

### 2.3 parameter monotonicity

- `podWidth↑` → podWidth measured値がstrict increase。
- `notchDepth↑` → notch apexのみ前方へ、tipSpacingは固定値ならT2内。
- `tipSpacing↑` →左右tip距離strict increase、depth固定。
- `tipRadius↑` →最大曲率strict decrease、tail length/width12はT2内。
- `wingInset↑` →wing後方area decrease。base tail topologyは不変。

## 3. Nose canonical tests

### 3.1 標準measurement

- `noseWidth6/12/18/24`: nose tipからstringer沿い152.4/304.8/457.2/609.6 mm後方で、直角に測る全幅。
- `noseArea12/24`, `tipRadius`, `tipBlockWidth`, `pullInStart`, `widePointOffset`, `fullness`。
- stationはoutline arc lengthでなくstraight longitudinal datum。

### 3.2 topology matrix

|canonical nose|必須invariant|
|---|---|
|pointed|左右railが単一tipへ収束、tipBlockWidth<=0.2 mm、小tip radius|
|gun_point preset|topologyはpointedのまま。通常point presetよりnoseWidth12/area24が小さいかpull-inが早い|
|rounded_point|単一tip、pointedよりtip radius/fullness大、full roundよりarea24小|
|full_round|単一連続round arc、tip radius/area12が大、hard cornerなし|
|cut_off_snub|tipBlockWidth>0、左右block cornerが存在。angular/roundedはcornerRadiusで区別|
|diamond_nose|中央前方単一tip＋左右shoulder。中央flatなし|
|fork|中央凹notch＋左右2tip。一般nose builderへ誤縮退しない|

`wide/full/pulled-in`はtopology enumでなくmodifier test。`width12↑`でtopology、tip radius、tip block種別は変化しない。

negative tests:

- Wideを選ぶと鋭いround-pin相当へ形が変わる実装はfail。
- Square/snubを選択して生成curveがnullまたは元outlineのままならfail。
- nose presetがtail builderを流用してもよいが、上表measurement/topologyを満たさなければfail。

## 4. Rail canonical tests

### 4.1 断面基準

各stationでrail local boxを定義: centerline bottom/deckではなく、outline端から内側指定距離までの断面。測定:

- rail apexの高さ比`apexZRatio=(apexZ-bottomZ)/sectionThickness`
- deck/bottom curve contribution、rail thickness/volume、max curvature位置
- tuck inset/height、bottom edge radius、chine幅/角度

### 4.2 invariant

|rail|期待条件|
|---|---|
|50/50|apexが概ね中高、上下配分対称。fixture target±3 percentage points|
|60/40|apex/配分方向をmanifestで明示。50/50より指定側へ有意移動|
|80/20 / down|apexがbottom側、60/40よりさらに低い。数える方向のlabel/diagram一致|
|upturned|apexがdeck側。nose rocker upturnと別field|
|full/boxy|rail enclosed area大、pinchedよりthickness大。hard edgeを自動意味しない|
|pinched/knifey|rail area/thickness小、curvature集中。edge hardnessは独立|
|soft|bottom edge radiusがhardより大|
|hard|有限だが小さいedge radius。zero-radius/mesh normal破綻なし|
|tucked_edge|apex内側にbottom edge、tuckInset>0。hard/soft双方を許容|
|chine|rail-bottom間に追加面/曲率区間。channelとは別topology|

rail station間はfoil flowを検証。隣接10 mmでrail area/apex/tuckがpreset指定transitionを除き急変しない。section curveは自己交差なし、deck/bottom接続G1、通常G2。

## 5. Bottom contour tests

### 5.1 signed depth定義

各x stationでrail-to-rail基準chordを作り、bottom centerとの差を`D`とする。canonical signを固定:

- concave: centerがdeck側へ高い → `D>0`
- vee/convex: center stringerが低い → `D<0`
- flat: `|D|<=0.2 mm`

横断面だけでなく`D(x)`とrail rockerを別々に保存する。

### 5.2 topology/invariant

|bottom|検証|
|---|---|
|flat|横断面straightness<=0.2 mm（長手rockerは許容）|
|single concave|centerに単一極大D>0、左右対称、余分なlobesなし|
|double concave|左右に2つのconcave basin、stringerに相対ridge。極値数一致|
|vee|stringerに単一低点D<0、左右panels。panel/rolled variantを分離|
|roll/belly/convex|横断曲率が滑らかにconvex、hard center ridgeなし|
|channel|指定本数のgroove/ridge pair、start/endでdepth→0、重複/自己交差なし|
|chine|rail寄り追加面、center channelとして数えない|

feature start/endではdepthと一次微分が0（G1）、可能なら二次微分も連続。複数feature合成は順序非依存が仕様ならcommutativity、順序依存ならmanifestに優先順位を固定。

## 6. Rocker tests

### 6.1 measurement

- datum chord: finished bottomのtail/nose endpointを結ぶ直線を既定とし、別datum使用時はmetadata必須。
- `noseRocker`, `tailRocker`, `rocker@12/24in`, center tangent/curvature。
- bottom rocker、deck rocker、rail rockerを別curveで測る。

### 6.2 invariant

1. xが0..Lで単調、自己交差/vertical tangentなし。
2. staged rockerでも数学的kinkを作らずG1、通常G2。
3. `noseRocker↑`操作はnose endpoint riseをstrict increaseし、center/tail lock指定範囲はT2内。
4. `tailKickLength`変更はkick開始位置を動かすが、開始点にcurvature spikeを作らない。
5. bottom contourを変更しても、参照rocker種別がstringer bottomならそのcurveの意図した変化だけを記録。rail rockerとの差を混同しない。
6. deck-bottom間隔（foil）は全stationで正、nose/tailへsmoothにthin out。

## 7. Edge tests

### 7.1 measurement

- bottom/rail境界のlocal fillet radius `R(x)`。
- edge apex位置、tuck inset、included angle、hard-edge開始/終了station。
- finite meshではradiusを曲率fit（±2 mm窓）で推定。

### 7.2 invariant

- hard edge: `R`がsoftより小さいが0ではない。製造下限をfixtureごとに設定（例0.5 mm）。
- soft-to-hard transition: `R(x)`は指定方向へ単調減少、開始/終了でG1、短周期oscillationなし。
- tail hard edge lengthはtailから測る。board全長変更後もabsolute/ratio modeが仕様通り。
- tucked edgeはrail profileとbottomの内側に存在し、outline最大幅を勝手に変えない。
- bottom concave/vee変更時もedge radius targetをT2内で維持（連動仕様なら期待式をmanifest化）。
- left/right edgeは対称boardでT1内。asym boardはside別target。

## 8. Golden image仕様

### 8.1 固定render条件

- headless deterministic renderer、orthographic projection、透視なし。
- canvas 1600×1000、devicePixelRatio=1、背景`#202124`、shape fill白、outline 2 px、anti-alias方式/version固定。
- camera、fit margin 8%、line width、fontなし、gridなし、CPなしのsilhouette goldenを主判定。
- 別画像としてsemantic anchors/handles、measurement stations、curvature comb overlayを保存。
- renderer/browser/OS差を避けるため可能ならSVG path goldenも併存。

### 8.2 必須view

|detail|views|
|---|---|
|tail|top full outline、tail 24 in crop、curvature comb crop|
|nose|top full、nose 24 in crop（6/12/18/24線）、curvature comb|
|rail|25/50/75/90% station断面、overlay comparison|
|bottom|bottom orthographic、代表5 station断面、depth heatmap|
|rocker|side bottom/deck/rail rocker overlay、curvature plot|
|edge|tail 24 in bottom oblique、3断面macro、R(x) plot|

### 8.3 raster判定

- まずlandmark alignment後に比較。位置ずれで形状差を隠す非剛体registrationは禁止。
- silhouette IoU `>=0.998`、boundary Hausdorff `<=1.5 px`、95 percentile boundary distance`<=0.75 px`。
- semantic corner/tip/notch landmarkは`<=1 px`。
- anti-alias pixelだけの差はlinear alpha thresholdで除外。
- raster passだけで合格にせず、analytic invariant/measurementが主、goldenは回帰検知の副判定。

## 9. テストmanifest schema案

```json
{
  "id": "tail.diamond.shortboard.v1",
  "fixture": "shortboard-6ft-v1",
  "generator": {"preset":"diamond","params":{"lengthCm":18}},
  "topology": {
    "tips": 1,
    "shoulders": 2,
    "notches": 0,
    "expectedInflectionsPerHalf": 0
  },
  "measurements": {
    "podWidthCm": {"target":0,"absTol":0.02},
    "tailWidth12Cm": {"target":35.0,"absTol":0.05}
  },
  "continuity": [
    {"join":"tail_to_rail","min":"G2","angleTolDeg":0.25}
  ],
  "allowedCorners": ["tail.shoulder.left","tail.shoulder.right","tail.centerTip"],
  "goldens": ["top","tail24","curvatureComb"],
  "taxonomyVersion": "1.0",
  "sourceRefs": ["research-01","research-28"]
}
```

各target値は専門分類だけから捏造せず、canonical fixtureを設計承認した時点で凍結する。taxonomy invariant（例diamondは中央凸tip）はtarget数値より上位で、preset tuningでも変更不可。

## 10. CI test suites

1. `geometry-unit`: analytic invariant、topology、measurement、continuity。
2. `parameter-property`: random valid paramsでfinite/self-intersection/monotonicity/property test。
3. `serialization-roundtrip`: JSON/BRD/DXF/meshの往復。
4. `canonical-golden`: 承認済みfixtureのSVG/raster差分。
5. `cross-detail-interaction`: tail×wing、rail×edge、bottom×rail rocker、rocker×foil。
6. `legacy-import`: 曖昧aliasをcanonicalへ無断変換せずwarning/mappingを出す。
7. `accessibility-label`: UI label、diagram、保存canonical IDが一致。

PR必須suiteはunit/property/roundtrip。golden更新は通常のsnapshot自動更新を禁止し、geometry reviewerの承認と差分画像、measurement delta tableを必須にする。

## 11. 最初に追加すべき回帰テスト

1. Square noseがnon-null curveを生成し、tip block幅を持つ。
2. Wide nose操作がtopologyをpoint/roundから勝手に変えない。
3. Diamond tail/noseの中央はflat blockでなく単一凸tip。
4. Bat/starは中央凸tip＋左右scoop。center notch型を拒否。
5. Tail/nose→rail joinがG1以上。現在の意図的C0を検出。
6. Pinとround-pinがtip radiusで有意に異なる。
7. Swallow/fishのnotch depthとtip spacingが独立かつ単調。
8. 同一canonical geometryのduplicate label conflictをdataset validationで拒否。

## 12. 合格の定義

形状は次のすべてを満たして初めてcanonical合格とする。

- topology invariant pass
- standard measurements within tolerance
- semantic corner以外G1、指定joinはG2
- self-intersection/NaN/negative thicknessなし
- parameter property tests pass
- serialization/export roundtrip pass
- golden silhouette/landmark pass
- canonical ID、UI label、diagram、保存値の対応一致

性能（speed/hold/release等）はこの幾何testの合否に含めない。性能は波条件、rail/bottom/rocker/finとの組合せ依存であり、別のsimulation/empirical validation suiteで扱う。
