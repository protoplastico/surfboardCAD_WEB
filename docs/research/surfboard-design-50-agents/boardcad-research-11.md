# サーフボード・レール断面のCADパラメータ化と生成

調査日: 2026-08-12  
担当: research-11（rail cross-section / longitudinal interpolation）

## 結論

レールを `50/50`, `60/40`, `down`, `full`, `pinched` などの名称だけで生成してはいけない。これらは断面の一部の傾向を示すだけで、apex位置、断面体積、deck/bottomへの接線、tuck、edge radius、長手変化は決まらない。

CADでは各station断面を次のランドマークで表し、少数のcubic Bezierで接続する。

```text
bottom interior → tuck/rail point → apex → deck shoulder → deck interior
```

通常は片側断面4–5 control pointが実用的である。Shape3D公式もsliceは通常4–5 CP、apex、rail point（通常bottom tuck）、必要ならdeck上の1点を推奨する。全stationに同じセマンティックなCP構成を保ち、各ランドマークの長手方向pathを別のfair curveとして補間する。[Shape3D X Manual](https://www.shape3d.com/support/User_Manual_V9.htm)

## 1. 座標と用語

station `x` の片側断面を `(y,z)` 平面で表す。

- `y=0`: stringer、`y>0`: rail方向
- `zBottomCenter(x)`, `zDeckCenter(x)`: centerline bottom/deck
- `outlineHalfWidth(x)`: top-view最大半幅
- `apex`: rail断面で最外側となる点。通常 `y=outlineHalfWidth`
- `apexZRatio`: bottomからdeckまでの局所高さに対するapex高さ
- `rail point`: Shape3Dでは通常bottom railのtuckに置くセマンティックCP
- `tuck`: bottom面からrailへ回り込む内側位置/曲線
- `edge`: tuckより外側/下側の水離れを作る小半径または意図的corner
- `fullness`: 単一幅ではなく、基準包絡に対する断面面積/曲率分布

Natural Curvesは共通rail profileをapex位置で50/50、60/40、low rail等と分類しつつ、down railのprofile、apex、tuck/edge、volumeはそれぞれ変化し調整されると明記する。[Natural Curves Rails（断面図）](https://www.naturalcurvesboards.com/html/designhtml/rails.html)

## 2. 幾何パラメータ

```json
{
  "railStation": {
    "x": 1219.2,
    "sectionHeight": 54.0,
    "sectionHalfWidth": 245.0,
    "apex": {
      "y": 245.0,
      "zRatio": 0.46,
      "verticalTangent": true
    },
    "fullness": {
      "areaRatio": 0.71,
      "deck": 0.68,
      "bottom": 0.54,
      "pinch": 0.18
    },
    "tuck": {
      "inset": 15.0,
      "height": 8.0,
      "radius": 10.0
    },
    "edge": {
      "radius": 3.0,
      "hardness": 0.65,
      "mode": "fillet"
    },
    "deckJoin": {"slope": -0.08, "continuity": "G2"},
    "bottomJoin": {"slope": 0.02, "continuity": "G2"}
  }
}
```

数値は構造例で標準値ではない。

### パラメータ定義

| パラメータ | 定義 |
|---|---|
| `apexZRatio` | `(zApex-zBottomRef)/(zDeckRef-zBottomRef)`。50/50等の基礎だが名称と固定対応させない |
| `apexPathY/Z` | station間を結ぶapexの3D locus。outline/side viewから編集可能 |
| `fullnessAreaRatio` | 実rail領域面積 / 同じ包絡矩形または選定基準形の面積 |
| `deckFullness` | apex→deck join側の膨らみ。Bezier handleまたは面積比 |
| `bottomFullness` | bottom join→tuck→apex側の膨らみ |
| `pinch` | apex近傍の曲率集中度。fullnessの単なる逆数ではない |
| `tuckInset` | outline/apexのyからtuck/rail pointまでの内向き距離 |
| `tuckHeight` | station bottom基準からtuck点までのz差 |
| `tuckRadius` | bottom→rail transitionの局所半径 |
| `edgeRadius` | release edgeのfillet半径。0は意図的sharp cornerだがCNC/材料下限を別設定 |
| `deckJoinSlope` | rail curveがdeck interiorへ入る接線 |
| `bottomJoinSlope` | rail curveがbottom contourへ入る接線 |
| `railVolume` | rail領域の断面面積または長手積分。fullness labelだけでは不足 |

Shape3DのSlice PC（旧Rail Coefficient）はslice面積を外接矩形面積で割ったprismatic coefficientである。これは全断面のfullness指標として参考になるが、apex/tuck/edgeの局所形状は区別できないため、単独パラメータにしてはならない。[Shape3D Manual](https://www.shape3d.com/support/User_Manual_V9.htm)

## 3. apex path

apexは各slice内の一点ではなく、長手方向に連なる3D curveである。

```text
A(x) = (x, yApex(x), zApex(x))
```

- `yApex(x)` は正しく定義したsliceならoutline curveと一致するのがShape3Dの原則
- `zApex(x)` はrail apexの高さ変化で、50/50→60/40→down rail等のblendを支配
- top-view outlineとapex pathを別編集可能にする場合、両者の不一致を明示し、どちらがsurface envelopeかを決める
- left/right非対称ならapex pathsを独立に持つ

AKU ShaperはRail Curve Refinerでtuckとapex curveをoutline/profile viewから編集できると公式に説明する。[AKU Shaper Software](https://akushaper.com/) Shape3Dもtop viewではApex curveを編集するのが一般的で、必要ならRail curveも編集するとする。

### pathパラメータ

- nose/mid/tail stationの `apexZRatio`
- transition start/end x
- longitudinal tangentと曲率
- monotonicityを強制する区間/しない区間
- edge hardening開始/完了位置
- tuck inset/height fade curves

## 4. 最少Bezier CPによる断面生成

### 推奨セマンティック点

片側sliceのbottom→deck順:

1. `B`: bottom interior join
2. `R`: rail/tuck point
3. `A`: apex（最外点、vertical tangent）
4. `D`: deck shoulder（必要な場合）
5. `T`: deck interior join

Shape3D公式はsliceを通常4–5 CPとし、apexにvertical tangent、rail pointにangular tangent、必要ならdeck制御点を置くのが安全とする。全sliceは同じCP数を要求し、不要点はpassive point化できる。

### segment構成

- `B→R`: bottom/tuck segment
- `R→A`: lower rail segment
- `A→D` または `A→T`: upper rail segment
- `D→T`: deck blend segment

`edgeRadius>0`ならR近傍をfillet arc相当の短いcubicで表現するか、Rの両側ハンドルから所定半径を近似する。`edgeRadius=0`ならRは意図的なangular tangent（G0/G1 corner）で、G2 fairing対象外。

### 円弧近似

局所的な四分円をcubicで近似する場合、端点から接線方向へ `4(√2-1)r/3 ≈ 0.55228475r` のハンドル長を初期値にできる。ただしrail全体を円/楕円で決め打ちせず、apex・join接線・fullness拘束に再fitする。

### CPを増やす条件

- chine/bevelなど意図的な複数曲率/角がある
- tuckとhard edgeを独立制御する必要がある
- deck shoulderが1 cubicではfullness targetとjoin G2を同時に満たせない
- scan fitで許容誤差を超える

単に50/50やfullという名称を再現するためにCPを増やさない。

## 5. deck/bottom tangencyと連続性

rail curveとdeck/bottom curveの接続は、位置だけでなく接線を共有する。

隣接cubic `P=[P0,P1,P2,J]`, `Q=[J,Q1,Q2,Q3]`:

- G0: 端点一致
- G1: `P2,J,Q1`が同一直線で同方向
- C1: 同じparameter scaleなら両ハンドル長も一致
- G2: join前後の曲率一致

soft railのdeck/bottom joinはG2を目標にする。hard edge/tuck/chineは設計上の角を保ち、例外マークを持つ。Shape3DにはtangentのC2 optionがあり、通常continuous tangent、apexにvertical、rail/tuckにangular tangentを推奨する。

### apex条件

apexが真の最大yなら、断面parameterに対しapexの接線はvertical（`dy/ds=0`）。ここで上下segmentをG1/G2接続する。50/50等はapexのz位置を指す傾向であって、上下の曲率や面積が等しいことを保証しない。

## 6. station interpolation / surface生成

### 原則

単にslice間の全座標を線形補間すると、apex移動、tuck fade、edge hardeningが不揃いになり、railにlump/twistが出る。まず各sliceを同じセマンティックparameterへ正規化し、ランドマークpathを補間する。

1. key stationsを設定（tail近傍、fin周辺、wide point/center、front third、nose近傍）
2. 各stationのoutline幅・deck/bottom高さを確定
3. `apexZRatio(x)`, `tuckInset(x)`, `tuckHeight(x)`, `edgeRadius(x)`, fullness各値を長手cubic/B-splineで補間
4. stationごとに断面Bezierを拘束solve
5. 各断面を同じdegree/knot/semantic parameterに揃えloft
6. intermediate sliceとisoparametric rail curvesのfairnessを検証

AKU公式ヘルプは追加sliceがnearest adjacent sliceの属性を継承するだけでは長手flowにlumps/bumpsが出るため、intermediate slice表示へ合わせて調整すべきと説明する。[AKU Hollow Wood tutorial（intermediate slices画像）](https://help.akushaper.com/article/17-hollow-wood-surfboards) Shape3Dも「less slices the smoother」で、center sliceから他を作りsmoothly evolveさせる方法を推奨する。

### 補間モード

- `semantic`: 推奨。apex/tuck/edge/fullness pathsを補間し断面再生成
- `homothetic`: 基準断面を幅/高さscale。速いがtuck半径等も不適切にscaleしやすい
- `direct CV loft`: scan/advanced向け。同じdegree/knot/CV対応が必須
- `hybrid`: 基準断面scale後、apex/tuck/edge constraintsで補正

Shape3Dにはslice高さ/幅などをhomotheticに再scaleする複数interpolation modeがある。実装ではモード名だけでなく、半径が絶対寸法か比率寸法かをパラメータごとに定義する。

### station数

固定の多数sliceではなく、長手パラメータの変化点にkey stationを置く。tailのhard edge fadeやwing、nose tipなど変化が速い箇所だけ増やす。Shape3Dの「少ないsliceほどsmooth」と、AKUのintermediate slice検査を採用する。

## 7. NURBS/Bezier surface案

### Curve network

- `u`: 長手方向、`v`: bottom center→rail→deck centerの断面方向
- 各section curveを同degree・同knot vectorへdegree elevation/knot insertion（形状を変えず統一）
- 長手directionはcubic B-spline/NURBS
- outline/apex/tuck/deck/bottom landmarkをisoparametricまたは拘束curveとして保持

Bezier patch列ならsection間G1/G2条件を明示的に課す。NURBS loftなら内部knot multiplicityが連続性を左右する。意図的hard edge/chineはknot multiplicityを上げる、またはsurfaceを分割してfeature tagを持つ。

### 最少CP

- cross-section: 通常4–5 semantic anchors/points（Shape3D推奨と一致）
- longitudinal: nose/mid/tailだけで始め、誤差/曲率変化が大きい場所にstationを追加
- 同じ形状を保つためだけのdummy CPはpassive/derivedとしてUIから隠す
- fitting objectiveにdata errorだけでなく曲率変化、path smoothnessを含める

```text
E = wS * sectionConstraintError
  + wA * apexPathError
  + wT * tuckPathError
  + wF * fullnessError
  + wU * longitudinalFairness
  + wV * sectionFairness
```

## 8. fullnessの定義

`full/medium/pinched`を一つのsliderにするとapex、tuck、deck/bottom curvatureを同時に誤操作する。最低でも以下に分解する。

- rail region area / bounding reference area
- apex近傍の最小曲率半径
- upper/lower rail別の面積またはbulge
- center thicknessに対するrail thickness at inset（例: outlineから25/50 mm内側）
- apex z ratio
- tuck inset/height

UIの`fullness` sliderはこれらへプリセットmappingしてよいが、resolved valuesを表示/保存する。Shape3DのSlice PCは全断面面積比なので、rail専用area ratioとは名前を分ける。

## 9. edgeとtuck

Greenlightは50/50のようにapex周りからdeckへsmoothに流れる断面に対し、down railではbottom radiusが短くtightになり、水をbottom railからreleaseさせると図解する。またhard edgeがtailから中央/前部へsoft 60/40、50/50へfadeする例を示す。[Greenlight Rail Design（60/40 egg/down rail比較図）](https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide)

実装上の重要点:

- `tuckInset` と `edgeRadius`を分離。深いtuckでもedgeはsoftにでき、その逆もある
- hard edgeの開始/終了をstation単位ではなく連続する長手curveで指定
- CNC tool radius/blank materialによる製造可能最小半径を設計値と別に保存
- edge radiusが閾値以下ならmesh normalを平均化せずfeature edgeとしてexport
- tail block/wing周辺でrail point pathが交差/消滅する場合はsurface topologyを分割

## 10. 誤り検出

### 断面内

- self-intersection / loop
- control point重複、zero-length tangent
- apex以外により大きいyが存在（apex semantic violation）
- deck/bottom joinのG0/G1/G2 error
- 意図しない曲率符号反転、flat spot
- edge/tuck以外の極小曲率半径
- negative thickness、deck below bottom
- tuck inset < 0 またはoutline外へ出る
- rail area/fullnessの急激な逸脱

Shape3Dはloop、zero length tangent、同位置CPを避け、E shortcutでsuperposed CP、kink、loopを表示すると説明する。

### 長手方向

- apex/tuck/edge pathのkink、速度/曲率jump
- adjacent/intermediate sliceの面積・apexZ・rail thicknessの急変
- section correspondenceの入れ替わり（tuckとapexのindex swap）
- surface fold、negative Jacobian、normal flip
- nose/tailでzero width/thicknessへ退化
- hard-edge fadeが非単調または突然消える
- left/right非対称が意図せず発生
- CNC tool accessibility / gouge risk

### 可視化

- section curvature comb
- apex/tuck/edge pathsのtop/side overlay
- zebra/reflection lines、Gaussian/mean curvature map
- intermediate slicesのonion-skin
- cross-section area/fullness/apexZ/edgeRadiusの長手グラフ
- wireframeを圧縮した角度から確認。Shape3DもWire view/回転でsmoothness確認を推奨

## 11. UIとデータモデル

- simple labels（50/50、60/40、down、full）をプリセットとして提供するが、適用後はresolved geometryを独立編集可能にする
- 断面上にB/R/A/D/Tのsemantic glyphを表示。通常CPと区別
- apexをdrag: z ratioのみ、modifierでfullnessを変更など操作責務を分ける
- tuck handle: inset/height、edge handle: radius/hardnessを別にする
- station markerは追加しても即surface CVを増やさず、parameter keyとして補間
- `lock outline`, `lock deck`, `lock bottom`, `preserve rail area`を用意
- feature edgeはsmooth commandの除外対象
- left/right railをlink/unlinkし、stance roleを保存
- JSONはunit、reference frame、absolute/relative指定、interpolation mode、feature tags、resolved curvesを保存

## 12. 画像・専門/CAD資料

1. [Shape3D X Manual HTML](https://www.shape3d.com/support/User_Manual_V9.htm) / [PDF](https://shape3d.com/Manuals/User_Manual_V9.pdf) — slice 4–5 CP、apex/rail point、各tangent、C2、passive point、interpolation、wire/エラー表示の多数CAD画像。
2. [AKU Shaper Software](https://akushaper.com/) — Rail Curve Refiner（tuck/apex）、slice/CAD/3D機能画像。
3. [AKU Slices/Rails](https://help.akushaper.com/article/37-slices-rails-how-to) — slice追加とrail編集画面。
4. [AKU Designing Slices video](https://akushaper.com/tutorial-videos/v/introductory-tutorial-2-designing-slices) — slice設計、rail shape import/export。
5. [AKU Hollow Wood tutorial](https://help.akushaper.com/article/17-hollow-wood-surfboards) — Bezier/tangent、intermediate slices、lump回避の画面画像。
6. [Natural Curves Rails](https://www.naturalcurvesboards.com/html/designhtml/rails.html) — 50/50、60/40、lower/down rail、apex/tuck/edge/volumeの断面図。
7. [Natural Curves Design Topics](https://www.naturalcurvesboards.com/html/designtopics.html) — apexからbottomへのtuck/edge変化の説明・図。
8. [Greenlight Rail Design](https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide) — 60/40 egg、50/50、down/hard edgeと長手fadeの図。
9. [Shape3D Video Tutorials](https://shape3d.com/Support/VideoTutorials.aspx) — curves、slices、3D layers、railを保ったconcave編集。

## 実装優先順位

1. apex/tuck/edgeを別semantic landmarkとしてデータ化
2. 断面4–5 CPのBezier generatorとdeck/bottom G1
3. `apexZRatio`, upper/lower fullness, tuck inset/height, edge radiusの分離
4. landmark pathによるstation interpolation、intermediate slice表示
5. G2/fairness solve、曲率櫛、loop/kink/重複CP検出
6. NURBS loftのdegree/knot統一とfeature edge保持
7. CNC tool-radius検証、左右非対称rail、3D curvature/zebra QA

## 出典評価

CADデータ構造とslice/CP要件はShape3D・AKU Shaper公式を最優先した。rail用語と断面の実務的分解はNatural Curves（Shaper's Journal系）とGreenlightの図解を使用した。性能効果はrocker、outline、bottom、finと相互依存するため、本稿では幾何・補間・製造検証を中心とし、名称から性能や固定寸法を逆算していない。

