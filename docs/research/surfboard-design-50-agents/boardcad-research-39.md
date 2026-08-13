# サーフボード設計調査 39：科学的根拠監査

監査日: 2026-08-12  
対象: `/tmp/boardcad-research-01.md`〜`36.md` の性能・流体・構造・製造主張

## 監査結論

既調査は全体として条件依存性と研究不足をよく明記しているが、サーフボード固有の性能主張の大部分は**専門shaperの経験知**であり、controlled experimentで孤立検証された法則ではない。CADへ実装するときは、名称から性能を断定せず、幾何量をtruth、性能文言を`条件付き傾向＋confidence`として分離する。

最も根拠が強い領域:

- 幾何定義、Bezier/NURBS、G2、測定datum、CNC reach/collision等の数学・製造原理
- sandwich構造のfoam/skin/stringerによる機械特性（coupon/beam/modal実験あり）
- 単独finのlift/drag/stallとplanform CFD、水洞実験
- surfboard CFDにおける限定条件下のrocker増→liftとdrag双方増
- sharp nose/fin/tailによる眼外傷リスクの医学症例・前向き調査

最も弱い／過剰断定しやすい領域:

- `concave/channelが水を加速しspeedを生む`
- `round tailはhold、square tailはrelease`
- `soft railはhold、hard railはspeed`
- noseriderの`tail suction`、nose concaveのlift/lock
- `fish/groveler/gun`名称からの性能
- asymmetric boardのtoe/heel別最適geometry
- flexのenergy returnが推進速度になるという説明

## 格付け基準

| Grade | 根拠 | CADで許される表現 |
|---|---|---|
| A | 査読実験、field measurement、複数研究で物理量を直接測定 | 条件・geometry・誤差を付けた事実 |
| B | 査読CFD/数値解析、単独部品水洞、一般流体/構造/CAGD原理 | `解析条件下で`、実走一般化を禁止 |
| C | 複数の専門shaper/メーカーで整合する経験則 | `典型傾向`、confidence medium/low |
| D | 単一商業資料、marketing、比喩、rider feel、未検証俗説 | UI truthにしない。説明候補/仮説のみ |
| X | 矛盾、用語誤用、物理的に不正確 | 削除または修正必須 |

同じ主張でも、`面積増で静的排水体積が増える`は幾何/静水力としてA相当、`それで速くなる`はC/Dである。主張を因果段階へ分解して格付けする。

## 主要主張監査

### テール（01–03）

| 主張 | Grade | 判定・適用条件 |
|---|---|---|
| tail幅/面積増でplaning支持面が増える | B/C | planing hull原理として妥当。同速度・trim・wet areaを揃えたsurfboard実験は不足 |
| wide tailは弱波で速度維持 | C | rocker/edge/fin/rail/weight依存。`速い`を最高速と解釈しない |
| narrow tailはpowerful waveでhold | C | 沈めやすさ・面積・rail lineのsystem経験則。fin等を固定した孤立試験なし |
| square cornerはclean release | B/C | separation原理はB、実走のsnappy turnへの変換はC |
| round tailは水を長くholdしround turn | C/D | 業界経験則。一部Greenlight説明はround tailがwaterを早く/拡散的にshedすると述べ、文言が矛盾 |
| swallowは2つのpintail | D | 有用な形状比喩。広い母体面積、直線rail、finを省くため物理モデルにしない |
| tail shape名称が性能を決める | X | 2018 CFDの限定round vs squash比較では差が検出されず、width/rocker等の方が重要 |

**修正:** `round holds water longer` と `round sheds earlier/diffusely` を統一しない。観察可能な事実は`cornerがなくseparation lineが連続分布する`。hold/turn feelはCとして別記。

### ノーズ（04–06）

| 主張 | Grade | 判定・適用条件 |
|---|---|---|
| forward area/volumeが胸下supportを増す | A/B | 静水力・trimとして妥当。ただしtip幅だけでは不足 |
| wide noseはpaddleが速い | C | chest位置、rocker、length、drag、arm clearance依存。tipは水上にある時間が長い |
| narrow/thin noseはduck diveしやすい | B/C | 前方浮力/投影面積減として妥当、rider体重・技術・総volume依存 |
| nose rocker増でpearling余裕 | C/B | geometry/clearance原理は妥当、pearlingは非定常でcontrolled surf試験不足 |
| point noseは水を切るので速い | X/D | 低速paddlingを船首比喩だけで説明。support/waterline/rockerを無視 |
| thin noseでswing weight減 | A if mass; C if geometry only | 慣性は質量分布。volumeだけをmassと混同しない |
| sharp noseは重大眼外傷risk | A | 医学症例11例、NSW前向き10例。ただし特定minimum radiusのrisk reduction値は未確立 |

### Outline（07）

- `parallel rail=drive/drawn-out`, `continuous curve=tight turn`はGrade C。
- 2D outline curveだけでturn radiusを計算するのはX。rail rocker、bank、fin、wetted lengthが必要。
- width/area/centroid等の幾何測定はA相当。performance mappingはC。

### Rail（08–11）

| 主張 | Grade | 判定・適用条件 |
|---|---|---|
| thin/low-volume railは少ない力で沈む | A/B | buoyancy/geometryとして妥当 |
| full railは低速support、thin railはsteep control | C | rider荷重、speed、board幅/length依存 |
| curved soft railはflowを偏向し反力を生む | B | 一般fluid momentum/separation原理。free-surface実board定量値なし |
| hard edgeはseparation位置を固定しやすい | B | 一般流体として強い。`drag zero`ではない |
| 50/50はsuction/hold | C/D | `suction`はfeel比喩。圧力分布の直接surfboard rail実験不足 |
| down railは常にfast | C/D | release/effective bottom幅の経験則。low-speed separation drag等で条件依存 |
| full railはstored energyを返しdrive | D | 浮力復元とrider feel。推進energyの定量実証なし |

**矛盾:** 資料によってhard railが`bite/hold`、別資料ではsoft railが`wrap/hold`。両方が成立し得るのはhold機構が違うため。CADでは`edge separation tendency`と`rail immersion/lateral resistance`を分離。

### Bottom contours（12–14）

| 主張 | Grade | 判定・適用条件 |
|---|---|---|
| concaveはcenter/trough rockerを相対的にflat化 | A | 幾何事実 |
| veeはcenter/rail rocker差を作る | A | 幾何事実 |
| concaveがflowをchannelしlift/drive/speed | C/D | shaper consensusはあるがisolated experiment不足。liftとdrag双方があり得る |
| doubleがsingle flow convergenceを分ける | C/B | 幾何・流れ仮説として妥当、surfboard実測不足 |
| veeはrail-to-railを容易にする | C、非単調 | moderate veeの経験則。deep/long veeはdirectional stabilityで逆に重くなるとの専門資料 |
| bellyが高速で中央peak上をplaneしfifth gear | D | hull-rider feel/theory。直接pressure/wetted-area測定なし |
| channelsがwaterを噴射し推進 | X | passive geometryがenergyを生成する表現。flow direction/pressure/drag変更へ修正 |
| channelsがdrive/holdを増す | C | wall、depth、speed、fin配置依存。追加wet area/dragもあり得る |
| concave内のair lubricationでdrag減 | D | surfboardで定量実証不足。ventilationはstability lossも生む |

**重要:** Greenlight自身が`concaveについて一般化するな`と明記。performance UIのconfidenceは原則low/medium。

### Rocker（15–17）

| 主張 | Grade | 判定・適用条件 |
|---|---|---|
| 同tip liftでもcurve distributionが違う | A | 幾何・測定事実 |
| rocker増がliftとdrag双方を増す | B | 2018 URANS/VOF CFDの特定model/速度/AoAで支持 |
| flat rockerはpaddle/weak-wave speed | C/B | planing/drag原理＋強い経験知。trim/volume/length依存 |
| curvy rockerはtight turn | C | 同outline/rail/finなら傾向。実走孤立試験不足 |
| high rockerはplane後wet areaを減らしtop speed増 | D/C | 可能性。top speed向上はGreenlight自身も議論ありとする |
| tail kickでnoserider tailをanchor | C/D | 専門設計経験。`suction`定量根拠なし |
| G2/fairness、station fitting、datum roundtrip | A/B | CAGD/計測原理として強い。性能最適とは別 |

### Edge（18–20）

- hard edgeでseparationを強制/規定: Grade B。
- hard edgeでspeed/release: hydrodynamic mechanism B、実走speed feel C。
- soft edgeでhold/forgiveness: Grade C。
- sharpest edgeが最速: X。wake/spray/low-speed/bank条件を無視。
- edge startをfront-fin前4–6 inとする: D/C（特定shaper実務例）。universal defaultにしない。
- finished minimum radius: standard不在。架空の安全値をA扱いしない。

### Foil / thickness（21）

| 主張 | Grade | 判定・適用条件 |
|---|---|---|
| volumeはcross-section areaの積分 | A | 数学事実 |
| forward volumeでtrim/paddle support | B/C | hydrostatic trimはB、paddle speed効果はC |
| thin tail/railは沈めやすい | A/B | geometry/buoyancy |
| rear thick pointはpivot response | C | mass/rail/stanceを含む経験則 |
| thin foilはflexy、thickはstiff | B if same material/layup | sandwich thicknessで強いがstringer/skin/coreが変われば逆転 |
| volumeがmomentumを増す | X unless mass tied | volumeとmassを分離。既調査はこの点を適切に注意 |

`Effect of foil on paddling efficiency`とされる資料は方法・sample・peer reviewを個別確認するまでB以上にしない。

### Deck（22）

- flat/domed/concave/step deckのgeometry・stance space: A（定義）。
- concave deckがleverage/controlを増す: C/D、人体力学とrider preference。
- domed deckがcenter volumeを残しthin railを可能にする: A/B（幾何）。
- deck shapeからflex/performanceを直接断定: C以下。laminate/stringer/coreが必要。

### Fins（23–24）

| 主張 | Grade | 判定・適用条件 |
|---|---|---|
| fin lift/drag vs AoA、high incidence separation | A/B | Brandner水洞実験、CFD |
| high ARで誘導drag低下 | B | finite-wing原理。board/free-surface/junctionで補正必要 |
| area増で同CL時force増 | A | equation上。ただしriderがAoAを変える |
| sweep/rake effect | B for Baldovin geometry | NACA0006、一定area/span、Re/AoA限定 |
| more toe/cant=turning, more drag | C | 強いindustry経験則、multi-fin/free-surface孤立試験不足 |
| rear quad positionがforceを変える | B | 2020 CFD。特定board/conditions |
| grooved finのstall L/D改善 | B | 2022 CFDの特定geometryで11±1%。一般finへ拡張不可 |
| surfing中fin pressure変化 | A | 2025 field sensor。局所pressure点で全forceではない |
| `fin cavitated/blown out` | X if vapor claim | 多くはstall/separation/ventilation。cavitation tunnel使用=発生ではない |
| quadはthrusterより速い | D/X | configuration totals/toe/areaを固定しない俗説 |

### Station / measurement / CAD / file / scan（25, 26, 28, 29, 34）

- coordinate datum、station sampling、CAGD continuity、Hausdorff/residual、roundtrip: Grade A/B。
- 少数CPが美しい／性能がよい: geometry fairnessとしてB、hydrodynamic performanceとして未証明。
- G2 curveが`magic board`を作る: X。G2は不要bumpを避ける製造品質条件。
- scan smoothingでdesign intentを復元: B/C。measurement noiseとmanufacturing deviationは分離できても、作者intentは観測不能。confidence metadataが必要。

### Materials / laminate（27）

| 主張 | Grade | 判定・適用条件 |
|---|---|---|
| core/skin/stringerがsandwich flexural/impact挙動を変える | A | coupon/beam/modal実験あり |
| foam density増で剛性/強度と重量増 | A/B | material test。具体量はfoam system依存 |
| EPSにpolyester resinは不適合 | A | styrene attack、製造互換性 |
| epoxyは必ずlighter/stronger/stiffer | X | layup/resin fraction/core/stringer依存 |
| EPSは同外形でより浮く | X | 排水浮力は外形。board自重差と混同 |
| cure shrinkageがrocker/twistを変え得る | B/C | composites一般原理＋工房経験。完成board量の公開統計不足 |
| epoxy約2%、polyester約6%収縮 | D in file 33 source context | resin system/volume shrinkをboard linear rocker allowanceへ使わない。27が固定値採用を避けたのは妥当 |
| flex energy returnがspeed | D | stiffness/damping/phase/rider timingのfield validation不足 |

### CNC / manufacturing（20, 27, 30）

- cutter radius、holder collision、3-axis undercut、stepover/scallop、fixture/flip error: Grade A/B（manufacturing geometry/official manuals）。
- machine sub-mm accuracy=finished board accuracy: X。foam、fixture、hand finish、laminateで変化。
- location-dependent allowanceとprocess scan calibration: B（sound manufacturing practice）、surfboard固有datasetは未整備。

### Asymmetry（31）

- stance mapping、left/right data model、non-mirror geometry: A（幾何/UI）。
- toe-side long/straight drive、heel-side short/curvy pivot: Grade D/C。著名shaperのdesign rationaleはあるがcontrolled biomechanics/hydrodynamics study不足。
- heel railをthinにすべきかfullにすべきか資料内でも両思想があり、矛盾でなくrider/support目的差。自動presetを強制しない。
- asymがtoe/heel差を改善: D/C。rider A/B testsが必要。

### Longboard / midlength（32）

- category/geometry archetype: C（industry convention）。
- nose concave=lift/lock、tail kick=anchor/suction、50/50=hold: C/D。
- large finがnoserider tailをanchor: C。fin hydrodynamicsはあるがnose-timeとのisolated test不足。
- weight/inertiaがglideを助ける: B/C。momentumは増すがpaddle acceleration/turn response tradeoff。
- `longboard 9ft以上`: competition/market conventionでありperformance lawでない。

### HPSB / groveler / fish / step-up / gun（33）

- family feature bundles: Grade C（professional design convention）。
- category→performanceはD/X。ファイル33は適切にpreset扱い。
- step-upはdaily boardとの相対概念、fish/groveler境界連続、gun system: 妥当な用語監査。
- specific component combinationsはcontrolled studyでなくmodel/shaper examples。

## 主要矛盾と解消法

### 1. Round tailはholdかreleaseか

- 説明A: curveがwaterを長くhold→smooth/drawn turn。
- 説明B: cornersがなくwaterをrail沿いに早く/拡散的にshed→小さいdeflection。
- 解消: `separation location is distributed and not corner-fixed`のみB相当。hold/turn feelはwidth/area/rail/rocker/fin込みC。

### 2. Hard railはholdかreleaseか

- hard edgeはflow releaseを明確化する。
- thin/downturned hard railは波面へpenetrate/biteすることもある。
- 解消: `edge separation`, `rail immersion`, `lateral pressure`, `fin force`を別のmechanismとしてモデル化。

### 3. Veeはrail-to-railを軽くするかtrackさせるか

- moderate veeは片側panelへrollしやすい。
- deep/long veeはkeel的directional stabilityを増し、roll開始を重くする。
- 解消: 非単調response。vee depth、width-normalized angle、length、speedを入力。

### 4. Concaveはspeedかdragか

- planing rocker flattening/flow containmentでspeed feel。
- aft wall pressure、wet area、turbulence、ventilationでdrag/instability。
- 解消: lift/drag/holdを別出力。同じflow redirectionがliftとdrag双方を生む。

### 5. Rockerはdragかwet-area reductionか

- low speedでは曲率/迎角によりdrag増。
- planing後はwet lengthが短くなる可能性。
- 解消: paddle/transition/planing speed regimesを分ける。単一`speed score`禁止。

### 6. Fuller volumeはspeed/supportかengagement阻害か

- low speed・heavy riderではsupport。
- steep/high-speed/light riderでは沈めにくい。
- 解消: rider mass/foot pressure、speed、wave steepnessをcondition metadataにする。

## 過剰断定として修正すべき表現

以下の語が既調査に現れた場合、引用された専門家の文脈を除き、UI/統合文書では弱める。

| 元表現 | 推奨表現 |
|---|---|
| `generates speed` | `特定条件でdrag/planing supportを変え、速度維持に寄与し得る` |
| `creates lift` | `pressure distributionにより上向きforce成分を生じ得る` |
| `maximum hold` | `対象の強い波でhold/controlを狙う代表構成` |
| `water accelerates through concave/channel` | `flow directionとlocal velocity/pressure distributionを変える` |
| `suction` | `flow attachment/pressure/immersed-rail resistanceとして感じられるhold` |
| `stores and releases energy` | `buoyant/elastic restoring response。推進寄与は未確立` |
| `cavitation`（fin抜け） | `stall/separation/ventilation。蒸気cavitationは未確認` |
| `EPS floats more` | `同体積なら排水浮力は同じ。軽いboardはsystem weightが小さい` |
| `G2 is hydrodynamically optimal` | `G2は意図しない曲率jumpを避けるgeometry quality condition` |

## CAD性能推定のconfidence設計

```json
{
  "claim": "wideTailWeakWavePlaningSupport",
  "geometryEvidence": "A",
  "hydrodynamicEvidence": "B-C",
  "rideFeelEvidence": "C",
  "conditions": ["lowSpeed", "weakWave", "adequateTailEdge", "matchedRiderMass"],
  "confounders": ["tailRocker", "railVolume", "finCluster", "constructionMass"],
  "uiWording": "低速planing supportが増す傾向",
  "notAllowed": "このtailは速い"
}
```

### 表示原則

1. 幾何値は確定表示。
2. 物理的中間量はmodel assumptions付き。
3. ride feelは条件付き相対傾向。
4. Grade Dはdefaultで非表示または`shaper hypothesis` badge。
5. Xは自動説明から除外。
6. A/Bでも研究geometry・Re/Froude/AoA・boundary conditionを表示。

## 優先実験計画

### 1. Geometry-isolated tow/water test

- same outline/volume/rocker/finでtail shapeのみ
- same rail/rockerでbottom contour depthのみ
- same surfaceでedge radiusのみ
- force balance、pitch/roll/yaw、pressure taps、wet-area video、free-surface capture

### 2. Paddling field test

- same rider、randomized boards、IMU/GPS/stroke power
- nose area/forward volume/entry rockerをfactorial design
- acceleration、speed per stroke、wave-entry timing

### 3. Fin/multi-fin

- isolated fin water tunnel→board-mounted free-surface→field pressureの階層
- toe/cant/spacingを一つずつ変更
- ventilationをhigh-speed cameraでcavitationと区別

### 4. Flex/material

- same external geometry、mass-matched constructions
- static bending/torsion、modal/damping、loaded rocker scan
- blinded rider crossover test

### 5. Shape/manufacturing roundtrip

- foam→laminated→hotcoat→sanded scan
- recipe/operator別bias field、finished radius/rocker/volumeの分散

## ファイル別総合評価

| Files | 主題 | 科学的根拠の中心 | 総合注意 |
|---|---|---|---|
| 01–02 | tail分類/CAD | geometry C/A | performanceを03の条件付き説明へ限定 |
| 03 | tail performance | B少数＋C多数 | round/square俗説を弱める |
| 04–05 | nose分類/CAD | geometry C/A | category名はpreset |
| 06 | nose performance/safety | safety A、performance C | eye injuryは強い、minimum radius値は不明 |
| 07 | outline | geometry A、feel C | turn radius直結禁止 |
| 08–11 | rail | fluid principle B、experience C/D、CAD A/B | hold機構を分離 |
| 12–14 | bottom | geometry A、performance C/D | 最も実験不足 |
| 15–17 | rocker | CFD B、experience C、CAD A/B | speed regime分離 |
| 18–20 | edge | separation B、surf effect C、CAD A/B | zero radius/always fast禁止 |
| 21–22 | foil/deck | hydrostatics/geometry A/B、feel C/D | volume≠mass |
| 23–24 | fins | experiment A、CFD B、setup C | cavitation用語修正 |
| 25–26 | station/measurement | metrology/CAD A/B | datum必須 |
| 27 | materials | experiment A/B | finished-shape工程data不足 |
| 28–30 | fairness/files/CNC | CAGD/manufacturing A/B | fairness≠performance |
| 31 | asymmetry | geometry A、performance D/C | dedicated A/B test必要 |
| 32–33 | board families | professional convention C | category→performance禁止 |
| 34 | reverse engineering | metrology B | intent復元のconfidence低 |
| 35 | terminology | documentary C | 定義元と地域を保存 |
| 36 | images | source audit | license不明画像を転載しない |

## 最終判定

- 既調査を設計knowledge baseへ使用可能。ただし**geometry facts / physics model / shaper experience / marketing folklore**の4層をJSONでも分離すること。
- performance rulesをhard constraintにしてはいけない。hard constraintsはgeometry、continuity、thickness、安全、manufacturability、datum/roundtripに限定。
- 速度、hold、turn、releaseは単一scoreでなく、speed regime、wave、bank/trim、rider、fin、constructionを入力した相対傾向とする。
- 科学的に最も価値のある次段階は、名称比較でなく、一変数ずつ孤立させたA/B geometryとpressure/force/field measurementである。
