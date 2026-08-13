# サーフボードscan / reverse engineeringから設計形状を復元する方法

調査日: 2026-08-12  
担当: research-34（point cloud alignment / datum / section / fairing / feature preservation）

## 結論

scan mesh/point cloudは「設計ファイル」ではない。測定された表面点にはtopology、Bezier CP、station意味、対称意図、feature分類がなく、ノイズ、欠損、glass/paint、使用後のへこみ・ねじれも含む。復元は次の2成果を分ける。

1. **as-scanned model**: 現物を許容誤差内で忠実に表す
2. **design-intent model**: 少数のfair curves/stations、対称性、feature semanticsへ再構築する

Shape3D公式もscan dataからoutline/profile/slicesをfitできる一方、automatic fittingはscan品質に依存し保証されず、手作業cleanupがしばしば必要と警告する。[Shape3D Import/Scan](https://www.shape3d.net/Products/ImportOption.aspx)

推奨pipeline:

```text
capture → clean/uncertainty → rigid registration → datum extraction
→ symmetry/asymmetry analysis → section/feature extraction
→ semantic curve fitting → guide-constrained NURBS loft
→ fairness + tolerance solve → deviation/feature QA
```

## 1. 入力とprovenance

保存すべきscan情報:

- scanner/photogrammetry方式、日時、operator
- raw point cloud（加工前）
- units、coordinate frame、scale object
- estimated point spacing、accuracy/repeatability
- scan viewpointsとregistration transforms
- color/reflectance（feature判定の参考）
- board状態: fins/traction/wax有無、dry/wet、温度、損傷、deck dents
- glassed finished boardかshaped blankか

finished boardのscanはfoam designにlaminate/resin/paint厚さを加えた表面。CNC再現したい対象が`finished outside`, `pre-glass blank`, `design nominal`のどれかを明記する。一定offsetでlaminationを引けばよいとは限らず、lap/sanding/repairで非一様。

## 2. point cloud cleanup

### 手順

1. 背景、stand、fins、leash、wax、traction、scanner artifactsをsegment
2. isolated outlier除去
3. duplicate/overlap scanのregistration品質確認
4. noise reductionはfeature-awareで実施
5. normalsをconsistent orientationへ推定
6. hole/occlusion mapを作り、補完点と実測点を区別
7. confidence/uncertaintyを各点へ付与

### 注意

- hard release edge、chine、channel shoulderをbilateral/MLS smoothingで丸めない
- deck dentをnoiseと勝手に除かない。as-scannedでは保持、design-intentでは別layerへ分類
- outline silhouetteはgrazing-angle scanで誤差が大きいことがある
- nose/tail thin edgeやswallow内部はocclusionしやすい
- finsを外せないscanではboard surfaceとの境界を明示的にmask

feature-line preservationの研究でも、denoise後にfeature-line zoneを検出・補強してsurface再構成する必要が示される。[RFEPS paper](https://arxiv.org/abs/2212.03600)

## 3. registrationとdatum

### registrationの段階

1. coarse alignment: markers/features/known scale
2. multi-view rigid registration
3. datum-based board frame
4. 必要なら既存CADへbest-fit comparison

ICP等のglobal best-fitだけでdatumを決めない。大面積のdeck/bottomが支配し、nose/tail、centerline、hard edgeの位置誤差を隠す。

### 推奨datum

- `longitudinal axis X`: nose-tail landmarkまたはbest-fit symmetry/centerline
- `symmetry plane Y=0`: left/right対応点のmirror distanceを最小化
- `tail datum X=0`: physical tail tip/block plane/centerline endpointのどれかを明示
- `Z reference`: rocker table基準、chosen baseline、またはcenter bottom tangent plane
- origin: tail centerline datum

### 複数候補を保存

```json
{
  "datum": {
    "method":"symmetry_plane_plus_tail_block",
    "transformRawToBoard":[...],
    "alternates":[{"method":"nose_tail_landmarks","transform":[...]}],
    "residualRms":0.42,
    "uncertainty":0.18
  }
}
```

Shape3D Scan Importはrotation/translation、Auto-align Axisを提供するが、data量とcleanlinessにより結果が良くない場合があると公式manualで注意する。[Shape3D Manual: Scan Import](https://www.shape3d.com/Support/User_Manual_V9.htm) gray raw data、blue stringer、左右outline/sections、mirrored sideを色分けする画面も掲載する。

### scale

- scanner unitを確認
- known board length/scale bar/fin-box寸法で検証
- inch↔mm 25.4、m↔mm 1000の誤り検出
- uniform scaleを勝手にfitしない。scanner calibration errorか対象寸法差かを分ける

## 4. symmetry / asymmetry

### まず測定する

左点をsymmetry planeへmirrorし右surfaceとのsigned distanceを計算。

- RMS/95%/max deviation
- x-station別のwidth、rocker、thickness差
- outline/apex/tuck/edge/channel pathsの差
- global twist

Shape3Dはscan import画面でright/left dataとmirrored dataを重ね、symmetryを確認可能にする。

### 自動平均しない

非対称の原因:

1. intended asym design
2. hand-shape/manufacturing variation
3. use damage/deck dent/twist
4. scan/registration error

分類前にmirror-averageすると設計意図を破壊する。

### 出力mode

- `preserveMeasuredSides`: 左右別fit
- `enforceSymmetry`: confidence-weighted mid-surface/half-shape
- `nominalPlusDeviation`: symmetric nominal + asym deviation field
- `roleAwareAsymmetry`: toe/heel semanticsを保持

対称化する場合、単純座標平均でhard featureを二重化/鈍化させず、対応feature pathsを先にalignしてからcurve parameterを平均する。

## 5. section extraction

### planes

通常はboard frameの `x=constant` transverse planes。rocker-normal/developed sectionsを併用する場合はframeを明記。混在させない。

### placement

- nose/tail epsilon stations
- 0/3/6/12/18/24 in measurement locations
- wide point/maximum thickness
- fin cluster前後
- rail/edge、concave/vee/channel、stepのtransition/peak
- curvature/errorが高い区間

測定sectionをすべてdesign stationにしない。高密度derived sectionsから、semantic変化点だけをkey stationへ選ぶ。

### point intersection

- meshならplane-triangle intersection polyline
- cloudならslab width内の点をplaneへ投影
- slab widthはpoint spacing/noiseに応じadaptive
- left/right、deck/bottom、feature branchesをtopologically order
- holesはconfidence gapとして残し、無条件bridgeしない

### curve fit

断面は通常4–5 semantic CPから開始:

```text
bottom center → bottom feature/tuck → apex → deck shoulder → deck center
```

channel/chine/stepはlocal feature patch。全断面のbase topologyへ多数CPを持ち込まない。

reverse-engineering研究でも、点群からcross-sectional curve patchesを導きfeature-based CADへ構成する方法が報告される。[Feature-based cross-section paper](https://www.scitepress.org/PublishedPapers/2007/20827/pdf/index.html)

## 6. outline/profile/feature extraction

### outline

- top-view projectionの単純convex hullはswallow/concavityを失う
- sliceごとのmax y/apex候補を連結
- silhouette confidence、left/rightを別fit
- nose/tail termination、wing/swallow/chine junctionはfeature landmarkとして先に抽出

### rocker/profile

- bottom/deck stringer近傍をrobust fit
- stringerが物理的に見える場合でもglass/paint ridgeをそのままsurfaceにしない
- center stripだけでなくrail rockerも抽出し、concave/veeを区別

### rail

- apex path: slice max-y
- tuck/release edge: curvature ridge/normal discontinuity + longitudinal tracking
- hard edgeはsmooth NURBS fitのoutlierにせずfeature lineとしてsurface分割

### bottom

- single/double trough、center spine、channel shoulder/bottom paths
- longitudinal envelopeとcross-profileを別fit
- feature birth/deathはlocal patches

### deck

- center deck/foil、shoulder/roll、step/gutter/concave
- deck dentsをhigh-frequency deviation layerとして分離可能

## 7. fairingとdesign-intent recovery

exact point interpolationはscan noiseを再現する。近似誤差とfairnessを同時最適化する。

```text
E = Σ wi * robustDistance(surface, point_i)^2
  + λu * longitudinalFairness
  + λv * sectionFairness
  + λg * guideFeatureError
  + λc * continuityError
  + λs * optionalSymmetryError
```

- `wi`: scanner confidence、incidence angle、mask、feature priority
- robust loss: Huber/Tukey等でoutlier影響を制限
- hard featuresは別curve/patch boundaryでfitしfairness対象外
- G1/G2 constraintsをdeck/rail/bottom patch joinsへ
- minimum CP/stationから始め、errorが構造的に残る区間だけ追加

CAD priorを使うreverse modeling研究は、ideal CADのfeature位置/constraintsをpoint-cloud reconstructionへ移すことで精度・効率を改善する。[CAD Model Prior paper](https://www.mdpi.com/2075-1702/10/10/905) surfboardでも既存のoutline/rail/bottom semantic generatorをpriorとして使うべきである。

### two-pass

1. **nominal fair fit**: low DOF、features/constraints重視
2. **deviation field**: nominalからscanへのsigned residual

これによりmagic boardの微細な非対称/へこみを保存しつつ、編集可能な設計曲線を得る。

## 8. NURBS/Bezier reconstruction

### curve network

- outline L/R
- bottom/deck stringer
- apex/tuck/release edge
- deck shoulder
- concave trough/spine/channel/chine
- transverse key sections

各guideとsectionのintersectionをsemantic IDで一致させる。degree/knot/direction/seamをcompatible化し、guide-constrained loft/network surfaceを作る。

NURBS surfaceには各parameter curveのCP数整合が必要で、scattered unordered cloudから直接CPを決めるのは難しいと研究でも指摘される。[CAD-prior reverse modeling](https://www.mdpi.com/2075-1702/10/10/905) 先にsections/featuresを構造化する理由である。

### minimum structure

- base slice: 4–5 semantic CP
- longitudinal: 5–7 key stationsから開始
- local features: separate patch
- tolerance超過時のみknot/station追加
- insertionはshape-preserving

## 9. 2D写真からの復元

AKU Image Boardはnose/tailを指定して画像をorientationし、outline/ProfileにBezier CPを合わせる公式workflowを持つ。[AKU Image Board](https://help.akushaper.com/article/52-image-board)

注意:

- perspective distortion、lens distortion
- boardがcamera planeと平行でない
- rail thicknessでsilhouetteがoutline apexと一致しない
- scale基準不足
- 1枚のtop photoから3D rail/bottom/deckは復元不能

最低でもcalibrated top/bottom/side写真、scale、camera intrinsics、直交配置を必要とする。2D traceはoutline/rocker guidelineとして扱い、3D scan同等とはみなさない。

## 10. 誤差評価

### point/surface

- signed distance map
- RMS、median、95/99 percentile、max
- normal angle error
- confidence-weighted metrics

### dimensions

- length、max width/thickness、wide point
- nose/tail 12/18/24 in widths
- rocker at specified stations
- volume、surface area
- section area/rail volume

### features

- outline/apex/tuck/edge/trough/channel path distance
- edge radius/included angle
- concave depth/vee height/channel width
- nose/tail termination landmarks
- fin/plug positions

### fairness

- curvature comb/isocurve
- curvature variation
- zebra/reflection lines
- unintended inflection、lump、surface fold

reportはglobal RMSだけにしない。広いflat面の良好fitが重要なedge/tip誤差を隠す。region/feature別 toleranceを使う。

```json
{"tolerance":{"general":0.5,"outline":0.25,"hardEdge":0.2,"deckDentLayer":1.0}}
```

## 11. validation

- datum repeatability（別subsetで再fit）
- scale sanity
- raw→clean point count/removed region log
- left-right deviation before/after symmetry
- section topology/orientation
- CP/station count、overfit cross-validation
- surface self-intersection/fold/Jacobian
- watertight/normal
- deck-bottom minimum thickness
- feature continuity/junction
- scan hold-out pointsでerror評価
- repeat scan間のvariationとmodel residual比較

automatic fit後のmanual cleanupは変更履歴として保存し、scan deviationを消した箇所と理由を記録する。

## 12. データモデル

```json
{
  "scanSource":{"raw":"scan.e57","units":"mm","accuracy":0.2},
  "registration":{"transform":[...],"datumMethod":"symmetry+tail"},
  "masks":[{"type":"traction"},{"type":"damage"}],
  "symmetry":{"mode":"nominalPlusDeviation","rms":0.7},
  "sections":[{"x":914.4,"role":"key","confidence":0.94}],
  "features":[{"type":"bottomReleaseEdge","source":"curvatureRidge"}],
  "fit":{"model":"semanticNurbs","fairness":{},"tolerance":{}},
  "deviation":{"field":"scan-minus-nominal.bin"},
  "provenance":{"manualEdits":[]}
}
```

raw scan、clean scan、as-scanned mesh、nominal CAD、deviation、reportを別artifactで保持する。

## 13. UI提案

- raw/clean/as-scanned/nominalを切替overlay
- axis triadとnose/tail/datumを明示
- symmetry heatmap、mirror overlay
- section onion-skin + confidence points
- feature pathsを色分けしmanual accept/reject
- fairing sliderはerror/CP count/curvatureのtradeoffを表示
- `preserve measured asymmetry`と`enforce nominal symmetry`を明示選択
- region別error histogram/heatmap
- manual editをscan residualと一緒に表示

## 14. 誤実装しやすい点

1. point cloud/meshを編集可能CADと同一視
2. global ICP best-fitをdesign datumとする
3. symmetryを前提に左右を最初から平均
4. deck dents/twistを自動でnoise除去
5. hard edge/channel/chineをsmoothingで丸める
6. convex hullでoutlineを取りswallow/wingを消す
7. 全scan pointsをNURBSでexact interpolation
8. dense sectionsを全てdesign stations化
9. global RMSだけでfit品質を判定
10. finished laminate surfaceをblank/design nominalと同一視
11. 写真1枚から3Dを復元済みとする
12. missing regionsを補完したことをmetadataに残さない
13. scanner unit/axis/datumを保存しない
14. manual fairingで消したmagic asymmetryのprovenanceを失う

## 15. CAD・研究出典

1. [Shape3D Import/Scan Option](https://www.shape3d.net/Products/ImportOption.aspx) — DXF/STL/text guideline、rotation/translation、outline/profile/slice fit、automatic fit非保証。
2. [Shape3D X Manual Scan Import](https://www.shape3d.com/Support/User_Manual_V9.htm) / [PDF](https://shape3d.com/Manuals/User_Manual_V9.pdf) — auto-axis、raw/stringer/left-right/mirror表示、scan formatsと画面図。
3. [AKU Image Board](https://help.akushaper.com/article/52-image-board) — top/profile写真のnose-tail alignment、Bezier trace画面。
4. [AKU Hollow Wood tutorial](https://help.akushaper.com/article/17-hollow-wood-surfboards) — image alignment、outline/profile/slice reconstructionと最少Bezier点。
5. [Reverse Modeling with CAD Prior](https://www.mdpi.com/2075-1702/10/10/905) — registration、CAD feature/constraints転用、point processing、NURBS surface construction。
6. [Free-form NURBS from points with boundary conditions](https://www.sciencedirect.com/science/article/pii/S0924013697003415) — boundary条件付きfreeform reverse engineering。
7. [Feature-based CAD from cross-sections](https://www.scitepress.org/PublishedPapers/2007/20827/pdf/index.html) — point cloud→cross-section curve patches→feature model。
8. [RFEPS feature-line reconstruction](https://arxiv.org/abs/2212.03600) — denoise、feature-line detection/augmentation、surface reconstruction。
9. [Hull Form Reverse Engineering dissertation](https://rosdok.uni-rostock.de/file/rosdok_disshab_0000001598/rosdok_derivate_0000034805/Dissertation_Edessa_2016.pdf) —船体freeform surfaceのboundary/feature preservationとsmoothness。
10. [NURBS-Diff](https://arxiv.org/abs/2104.14547) — differentiable NURBS fitting/offset等。

## 実装優先順位

1. raw provenance、units、rigid registration、explicit board datums
2. symmetry analysis（自動平均前）とas-scanned/nominal分離
3. high-density derived sections→semantic key sections抽出
4. outline/stringer/apex/tuck/edge/bottom featuresのguide curve fit
5. robust fair NURBS loft + deviation field
6. feature/region別error、fold/thickness/fairness QA
7. photo calibration、laminate compensation、repeat-scan uncertainty

## 出典評価

surfboard固有workflowはShape3D/AKUの公式資料を最優先した。一般reverse engineeringのregistration、CAD prior、NURBS、feature preservationは研究資料で補った。scan精度と設計復元精度は別概念であり、automatic fitやglobal RMSだけでは設計意図の回復を保証しないという立場で整理した。

