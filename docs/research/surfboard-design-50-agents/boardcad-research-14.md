# サーフボード・ボトムコンターのCAD表現

調査日: 2026-08-12  
担当: research-14（bottom contours / cross-section / longitudinal envelope）

## 結論

ボトムをstation断面の自由CPだけで作ると、single→double→veeの長手遷移、channelの流路、rail rockerとの関係が不明確になり、slice追加時に波打つ。CADでは次の2層へ分けるべきである。

1. **longitudinal base/envelope**: stringer bottom rocker、rail/tuck path、必要なguide paths
2. **cross-sectional displacement field**: そのstationにおけるsingle/double concave、vee/roll、channel、chine

概念式:

```text
zBottom(x,y) = zBase(x,y) + Csingle(x,y) + Cdouble(x,y)
             + V(x,y) + Channels(x,y) + Chines(x,y)
```

ただし全項を無条件に線形加算してはいけない。滑らかな低振幅のsingle/double/veeは基準面に加算可能だが、channel/chineはfeature topologyと境界条件を持つ局所patchとして扱う。rail/tuck境界、最小厚さ、曲率、製造半径を守る拘束solveが必要である。

## 1. 座標と基準面

- `x=0`: tail、`x=L`: nose
- `y=0`: stringer、左右rail方向へ `±y`
- `z`: 上向きを正とする例
- concaveは中心/溝を上へ掘る（foamを除去する座標系なら符号を明示）
- veeはcenter keel/spineが左右より低い/突出する。符号名称ではなく高さ差を保存

### 必須guide curves

- `bottomStringer(x) = z(x,0)`
- `bottomRailLeft/Right(x)` または `tuckPath(x)`
- `deckStringer(x)`（最小厚さ検査）
- `outlineHalfWidth(x)`
- double/channelのridge/trough paths

Natural Curvesはconcaveを、bottom rockerとrail rockerの相対関係として説明する。rail rockerがbottom/stringer rockerより下へ落ちる区間がconcaveとなり、nose/tailで逆転すればveeも現れ得る。[Natural Curves Single/Double Concaves（rail rockerとbottom rocker比較図）](https://www.naturalcurvesboards.com/html/designhtml/singledoubleconcaves.html)

このため`concaveDepth`をstringerだけ動かして作る設計と、rail側を動かして作る設計は同じ断面深さでも全体rockerが違う。UIには基準を明示する。

## 2. 共通データモデル

```json
{
  "bottom": {
    "reference": "stringer_rocker",
    "baseSurface": "bottom-base-1",
    "features": [
      {
        "type": "singleConcave",
        "xRange": [320, 1510],
        "envelope": {"fadeIn": 180, "peakX": 980, "fadeOut": 250, "maxDepth": 4.5},
        "crossSection": {"halfWidthRatio": 0.72, "exponent": 2.2, "railBlend": "G2"}
      },
      {
        "type": "doubleConcave",
        "xRange": [120, 920],
        "envelope": {"fadeIn": 200, "peakX": 430, "fadeOut": 120, "maxDepth": 3.0},
        "crossSection": {"troughRatio": 0.42, "spineHeight": 1.5, "widthRatio": 0.28}
      },
      {
        "type": "vee",
        "xRange": [0, 430],
        "envelope": {"maxAt": 100, "height": 3.5},
        "crossSection": {"mode": "soft", "keelRadius": 80}
      }
    ]
  }
}
```

数値は構造例で標準寸法ではない。各featureは絶対`x`、板長比、fin基準のいずれを使用したか保存する。

## 3. cross-sectionとlongitudinal envelopeの分離

feature `i` を

```text
Fi(x,y) = Ai(x) * Pi(y / halfWidth(x); θi(x))
```

とする。

- `Ai(x)`: depth/heightのlongitudinal envelope
- `Pi`: 正規化cross-section profile
- `θi(x)`: trough位置、幅、spine、edge radiusなどの長手変化

この分離により、深さのfadeと断面形のmorphを別に制御できる。station追加時は既存の`Ai/θi`を評価するだけで、shapeを変えない。

### envelope

最低限:

- `startX`, `endX`
- `fadeInLength`, `fadeOutLength`
- `peakX`, `maxAmplitude`
- start/end slope（通常0）
- G2 endpoint option（開始/終了の曲率も0へ）
- multiple peaks/plateauが必要ならcubic B-spline

Greenlightは典型例としてsingleがnose tipから12–18 inで徐々に始まり、wide pointからfront-fin leading edge間で最大、後方でflat/veeへfadeすると説明する。doubleはsingle最大付近でfade inし、rail fin leading edge付近で最大、center fin後方でflat/veeへfadeするかtail blockまで続く場合がある。これは固定レシピではなく、**開始・最大・終了が別パラメータ**であることの実例。[Greenlight Bottom Contour（single→double→vee断面・加工図）](https://greenlightsurfsupply.com/pages/surfboard-bottom-contour-design-greenlight-surfboard-design-guide)

## 4. 形状別パラメータ

### flat

feature displacement 0。ただしstringer/rail rockerが違えば断面はflatでないため、「flat cross-section」と「flat longitudinal rocker」を分ける。

### single concave

- `depth(x)`: rail/tangent baselineから中心troughまで
- `halfWidthRatio(x)`: concave有効幅 / half width
- `profileExponent` またはcenter/edge curvature
- `centerRadius`
- `railBlendWidth`, `railBlendContinuity`
- symmetry/asymmetry、center offset

centerが常に単一最低/最高点となるとは限らない。rocker座標とfoam removal符号を分ける。

### double concave

- `troughOffsetRatio`: stringerから左右troughまで
- `troughDepth`
- `troughWidth/radius`
- `centerSpineHeight`（stringer ridge。singleの基準面に対する高さ）
- outer shoulder/rail blend
- left/right independent values
- double内にunderlying singleを残すか

「double=2個のsingleを並べる」だけではcenter spine、外側blend、rail baselineが決まらない。single-to-doubleではunderlying bowlとdouble modulationを分けると編集しやすい。

### vee / roll / belly

- `veeHeight`: centerと左右基準点の高さ差
- `veeAngle` またはslope
- `keelRadius`: 0に近いhard Vかsoft Vか
- `spanRatio`: railまで続くかinner panelだけか
- `panelCurvature`: straight panel / convex roll
- `apexOffset`: asymmetric vee

veeはcross-section、rockerはlongitudinal curveであり混同しない。soft vee、spiral vee、vee within concave等はprofileとenvelopeの組合せ。

### channel

- 本数、左右pairing/asymmetry
- centerlineからの`pathY(x)`（直線でなくflow path）
- start/end、fade-in/out
- depth、bottom width、mouth/top width
- sidewall angle、corner/fillet radius
- longitudinal slopeとexit angle
- spacing、convergence/divergence
- rail/fin/boxとのclearance
- termination: zero-depth fade / open tail exit / capped end

AKU公式はslice bottomへ近接2点を追加してchannelを作り、intermediate slicesでcenterからの距離を合わせてflowを作る例を画像付きで示す。[AKU Slices/Rails](https://help.akushaper.com/article/37-slices-rails-how-to) これはchannelが単一stationの溝ではなく、長手pathであることを示す。

### chine / bevel / tri-plane

- chine path（x,y,z）
- inner/outer panel angle
- chine corner radius（hard/soft）
- panel width
- start/end fade
- rail tuckとの接続
- feature edge tag

chineは滑らかなdisplacementの加算だけでなく、曲率不連続または小radiusの明示的境界。NURBS surfaceを分割するかknot multiplicity/creaseを持つ。

## 5. 重ね合わせ規則

### 加算可能な組合せ

- shallow single base + double modulation
- single/double + broad soft vee（いわゆるconcave within vee等）
- broad roll + shallow local concave

条件:

- 共通baseline/符号が定義済み
- rail/tuck boundary displacementは所定値へblend
- 合成後の深さ/厚さ/曲率を再検証
- feature順序を保存

### 単純加算しないもの

- hard channel/chine
- rail/tuck/edgeを跨ぐfeature
- overlapping channels
- hard vee keelとcenter channel
- tail exitで開口するfeatureとtail termination

これらはpriority付きBoolean/displacement patch、constraint blend、surface partitionとして処理する。

```json
{"composition":{"mode":"constrained","order":["baseVee","single","double","channels"],"railBoundary":"locked"}}
```

### 衝突解決

- `add`: displacement加算
- `maxDepth/minDepth`: envelope選択
- `replace`: feature patchが下層を置換
- `blend`: maskで補間
- `constraintSolve`: target depthとG1/G2/厚さを同時解決

プリセット名（single-to-double-to-vee）からfeature順と既定maskを作ってよいが、resolved featuresをJSON保存する。

## 6. Bezier/NURBS表現

### 断面

基本flat/single/veeは片側2–3 cubic segmentで十分。

```text
stringer → trough/spine → bottom shoulder → tuck/rail point
```

- single: center troughを端点、rail/tuck側をG2 blend
- double: center spine、trough、outer shoulder、rail pointのsemantic points
- vee: center keel、panel、rail point。hard keelならangular tangent
- channel: channel両肩/底をfeature CP。無関係な全sliceへdummy shape freedomを与えない

Shape3Dはsliceを通常4–5 CPとし、rail pointを通常bottom tuckに定義する。channelsはtop viewで複数bottom curvesを編集可能。[Shape3D X Manual（slice/multi-curve CAD画像）](https://www.shape3d.com/support/User_Manual_V9.htm)

### surface

- `u=x` longitudinal、`v`をstringer→railのsemantic parameter
- key sectionsを同degree/knotへ統一してNURBS loft
- stringer、trough、spine、channel shoulders、tuckをguide/isoparametric curvesとして保持
- hard chine/channel edgeはsurface splitまたはrepeated knots
- cross-sectionとlongitudinal双方のG1/G2を検証

### feature-layer方式

Shape3Dは3D layerのsliceが元surface内ならmaterialを除去、外なら追加する方式を持ち、nose spoon concave等もlength/depth指定で追加する。また複数bottom curvesをtop viewで編集しchannelを制御できる。[Shape3D Manual](https://www.shape3d.com/support/User_Manual_V9.htm) ベースsurface＋feature layerはCAD責務分離の有力なモデルである。

## 7. fade in/out

linear depth fadeは開始/終了で曲率jumpを作るため、少なくともsmoothstep、望ましくはquintic smootherstepまたはcubic B-spline envelopeを使う。

```text
smoothstep(t)=3t²-2t³        // 値と1階微分が端で0
smootherstep(t)=6t⁵-15t⁴+10t³ // 2階微分まで端で0
```

ただしfeatureの幅/位置も同時にfadeする場合、depthだけを0にしてCPを同一点へ潰すとzero tangent/loopが起こる。depth→0でもsemantic curve topologyを維持するか、feature birth/death用のdegenerate-safe patchを使う。

### transition parameter

- amplitude fade
- width fade
- trough path migration
- center spine growth
- panel/sidewall angle fade
- corner radius softening

single→doubleではdouble amplitudeを増やしつつsingle bowlを残す/減らすcross-fadeを明示する。double→veeではtroughを浅くしながらcenter/rail height差を変える。typeをstation境界で突然切り替えない。

## 8. 断面挿入で波打たせない

### 問題

AKUはslice追加時に隣接slice属性を継承するが、そのままでは長手flowにlumps/bumpsが生じるため、追加前のintermediate sliceをガイドに合わせるよう公式に説明する。[AKU Hollow Wood tutorial](https://help.akushaper.com/article/17-hollow-wood-surfboards)

### 推奨アルゴリズム

1. 既存surface/feature envelopesを評価し、挿入xでのsectionを生成
2. knot insertionまたはexact surface evaluationを使い、**挿入だけでは形状を変えない**
3. 新sectionを編集した場合、局所supportのB-spline keyのみ変更
4. stringer、tuck、apex、trough、channel各pathのG1/G2を再solve
5. intermediate sectionsを密に評価し、curvature/area/depthグラフで検査

### 避ける方法

- nearest sliceの単純copy
- 各sliceを独立Bezierとして手編集
- 全stationに幅/形の違うCP indexを割当
- feature消滅時にCPを重複させる
- station間の座標linear interpolationだけでchannel pathを作る

Shape3Dも「less slices the smoother」、center sliceから他をcopyしつつsmoothly evolveさせること、全sliceの同CP数、不要点のpassive化を推奨する。

## 9. 品質検証

### 断面

- self-intersection/loop、重複CP、zero tangent
- stringer/tuck joinのG0/G1/G2 error
- 意図しない曲率符号反転/flat spot
- concave深さ、vee高さ、channel sidewall角の上限
- edge/chine以外の最小曲率半径
- rail/tuck boundary violation

### 長手/曲面

- stringer/trough/spine/channel/tuck pathのkink・曲率jump
- depth/width/areaのstation間oscillation
- negative thickness / deck penetration
- surface fold、negative Jacobian、normal flip
- channel同士、fin box、leash plug、tail edgeとの干渉
- CNC tool radiusより小さいcorner、undercut、gouge risk
- feature fade区間のbulge/dimple

### 可視化

- onion-skin intermediate slices
- bottom contour map / zebra / reflection lines
- Gaussian/mean/directional curvature
- stringer、rail、trough、spineのside-view overlay
- concave depth/vee height/channel widthの長手グラフ
- waterline的な等高線（AkuのContour Highlight 3Dに相当）

AKUにはBad Points Checkとintermediate slice表示、Contour Highlight 3Dがある。[AKU Slices/Rails](https://help.akushaper.com/article/37-slices-rails-how-to) / [AKU Software](https://akushaper.com/software)

## 10. 誤実装しやすい点

1. single/double/veeを排他的enumにし、blend区間を表せない
2. concave depthだけを持ち、幅・profile・rail baselineを持たない
3. doubleを同じsingle 2個の単純コピーにする
4. veeをtail rockerと混同する
5. channelを各sliceの2 CPだけで持ち、3D pathを保存しない
6. chineをsmooth concaveと同じ加算fieldで丸める
7. featureを無条件加算し、過深さ/負厚さ/rail破壊を起こす
8. fadeをlinearにし、開始/終了にshoulderを作る
9. depthのみfadeしてwidth/sidewall/cornerを突然消す
10. slice追加でnearest sectionをcopyし元surfaceを変える
11. 測定stationごとに自由CPを増やし長手方向を波打たせる
12. stringer rockerだけを見てrail rockerとの相対関係を失う
13. hard featureをG2 fairingで消す
14. feature名から性能や固定位置を断定する

## 11. UI提案

- side view: 各featureのamplitude envelopeとfade handles
- slice view: 現在xのsingle/double/vee/channel/chine componentsを色分けし、合成結果を太線表示
- top view: trough/channel/chine pathsと幅envelope
- `lock stringer rocker`, `lock rail/tuck`, `preserve thickness`, `preserve rail`を用意
- feature layerごとにenable/solo/order/composition mode
- station追加は既定でshape-preserving knot insertion
- presetはfeature stack初期値。適用後はresolved parametersを自由編集・保存
- fin位置をoverlayし、feature peak/exitとの相対位置を寸法化するが自動固定しない

## 12. 画像・CAD/専門資料

1. [Greenlight Bottom Contour Design](https://greenlightsurfsupply.com/pages/surfboard-bottom-contour-design-greenlight-surfboard-design-guide) — single、double、concave-in-vee、長手fade、加工手順の図。
2. [Natural Curves Single & Single-to-Double](https://www.naturalcurvesboards.com/html/designhtml/singledoubleconcaves.html) — rail rocker対bottom rocker、single/double/spineの写真・図。
3. [Natural Curves Shaper's Journal PDF](https://www.naturalcurvesboards.com/PDF/ShapersJournal.pdf) — flat/convex/concave、tri-plane/vee等の分類図。
4. [AKU Slices/Rails](https://help.akushaper.com/article/37-slices-rails-how-to) — concave/double/channel CP、intermediate slice、Bad Points CheckのCAD画像。
5. [AKU Designing Slices video](https://akushaper.com/tutorial-videos/v/introductory-tutorial-2-designing-slices) — single、double、vee tail、blend toolの公式動画。
6. [AKU Hollow Wood tutorial](https://help.akushaper.com/article/17-hollow-wood-surfboards) — intermediate sectionと追加slice調整の連続画像。
7. [Shape3D X Manual](https://www.shape3d.com/support/User_Manual_V9.htm) / [PDF](https://shape3d.com/Manuals/User_Manual_V9.pdf) — bottom multi-curves/channel、slice、3D layer、curvatureのCAD画像。
8. [Shape3D Video Tutorials](https://shape3d.com/Support/VideoTutorials.aspx) — railを変えずconcaveを変更するMulti-Curves公式動画。
9. [Boardcave Bottom Contours](https://www.boardcave.com/the-surfers-corner/cat/news/post/surfboard-bottom-contours) — concave/double/belly/vee/flat比較画像。
10. [OpenShaper Design Guide](https://openshaper.com/surfboard-design-guide/) — bottom contourを含むoutline/section/3D CAD画像。

## 実装優先順位

1. base surface + feature stack、cross-profile×longitudinal envelopeの分離
2. single/double/veeのsemantic generatorとG1 rail blend
3. smootherstep/B-spline fade、single↔double↔vee cross-fade
4. channel/chineの3D pathとfeature patch化
5. shape-preserving section insertion、intermediate slice QA
6. NURBS guide-curve loft、G2/fairness、曲率/厚さ/干渉検査
7. CNC tool-radiusとfin/plug collision検証

## 出典評価

CAD操作と断面補間はShape3D・AKU Shaper公式を最優先した。形状分解と典型的な長手遷移はGreenlightおよびNatural Curvesのシェイピング資料を使用した。一般解説の性能記述はoutline、rocker、rail、fin、波条件と相互依存するため、分類画像の補助に留め、CADパラメータを性能名から固定していない。

