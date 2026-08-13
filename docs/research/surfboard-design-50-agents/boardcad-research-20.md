# サーフボード設計調査 20：エッジのCAD実装

調査日: 2026-08-12

## 結論

エッジを`hard/soft` booleanにしない。エッジはrail断面のbottom側に沿う長手featureであり、以下を独立管理する。

- `edgeRadius(x)`: foam shape時と完成laminate後の半径
- `tuckWidth/Depth/Radius(x)`
- `edgeStartX`, `fadeLength`, `fadeLaw`
- `chamferWidth/Angle(x)` または非円形blend profile
- edge feature lineの3D位置
- adjacent bottom/rail surfaceへのcontinuity（G0/G1/G2）
- CNC tool、tool radius、scallop tolerance、hand-finish allowance

性能上のhard edgeは意図的な流れの離脱線なので、曲面fairingで自動消去してはいけない。一方、幾何学的なゼロ半径はCNC・lamination・耐久・安全上の実物truthではない。CAD上の`theoretical release line`と`manufactured finished radius`を分ける。

## 用語・形状パラメータ

| 項目 | 定義 | 混同注意 |
|---|---|---|
| Rail profile | deck→apex→tuck→bottomの断面全体 | edgeのみをrail shapeと呼ばない |
| Tuck | apexからbottomへ内側に回り込む幅・深さ・丸み | edge radiusとは別 |
| Edge | tuck/bottom間の離脱を意図した境界 | `hard rail`と`hard edge`は別概念 |
| Radius edge | 円弧または近似曲線で丸めた境界 | nominal radiusと完成半径を区別 |
| Chamfer | 2面間へ直線／平面segmentを入れる面取り | round filletでない |
| Chine | rail近傍の比較的広いbevel/panel | 小さなchamferとの境界は尺度依存 |
| Release start | nose→tail方向で機能的edgeが現れ始める位置 | abrupt startでなく通常fade zone |
| Feature line | edgeのridge/離脱線を表す3D curve | surface iso-lineで代用しない |

## 断面トポロジー

全stationを同じsemantic topologyで表す:

`deck tangent → upper rail → apex → lower rail → tuck start → tuck → edge/release point → bottom tangent`

soft noseでedgeが見えなくてもedge nodeを削除せず、radiusを大きくしてtuck/bottomへ退化・統合させる。tailでhardになる際もpoint indexが変わらないためloftのねじれを防げる。

推奨feature points:

1. apex（最大外幅）
2. tuck start /最大曲率点
3. theoretical edge vertex（未fillet面の交線）
4. rail-side fillet contact
5. bottom-side fillet contact

chamferはtheoretical vertexを切り、2本のcontact lineとchamfer faceを作る。round edgeはvariable-radius blend surfaceを作る。

## Radius / chamfer / tuckの関係

- 同じedge radiusでもtuckが広いとrelease lineは内側へ入り、実効bottom幅を減らす。
- low apex＋narrow tuckはbottom側のturnが急で、水離れが早い傾向。edge radiusだけで性能分類できない。
- circular filletは半径が明確で製造照合しやすいが、両側へG1接続が基本。G2 blendは一定半径円弧ではなく、より滑らかな曲率遷移となる。
- 性能上「crisp」なreleaseにはG0/G1に近い曲率breakを意図する場合がある。無条件G2 blendはedge機能を弱める。
- chamfer/chineは離脱線を2本持つ可能性があり、低速での流れ・感触がround edgeと異なる。単なるradius代替にしない。

## Release start / fade

現代performance boardではnose/entryは丸くedgeなし、wide point後方からedgeが発達し、fin～tailでhard/crispになる典型がある。ただしsmall-wave boardはedgeを前へ、gunはcontrolのためtail edgeをsoftにする例があり固定規則ではない。

CADでのfade:

- `x0`: edge influence 0の開始
- `x1`: full edgeへ到達
- blend parameter `s=(x-x0)/(x1-x0)`
- radius例: `r(x)=r_soft +(r_hard-r_soft) smoothstep(s)`
- tuck/chamfer/contact-line位置も同じsまたは別lawで同期
- `r'(x0)=r'(x1)=0`、必要なら`r''`も0にしてsurface bumpを防ぐ

`release start`はradius閾値を跨ぐ位置として派生表示し、geometry truthは連続する`r(x)`。急なwing/chine等、意図的breakのみ不連続を許す。

## Station variation

最低station: nose tip、12 in nose、wide point、front-foot、front-fin LE、rear-fin、12/6/3 in tail、tail tip。

各stationに:

- rail sectional area / thickness
- apex height
- tuck width/depth/radius
- theoretical edge angle（adjacent surface normalsの角）
- edge radius / chamfer
- finished radius allowance

を保持。station間はcubic B-splineで補間し、radiusが負になるovershootを防ぐ。正値保証には`log(radius)`補間またはmonotone Hermiteを使える。

左右非対称boardではleft/right feature lineを別保存。対称modeはconstraintでありdata duplicationではない。

## Feature line保持

- theoretical bottom/rail surfaceの交線を`release spine`として保持。
- variable filletはその両側にcontact curvesを生成し、release spineを消さずconstruction geometryに残す。
- downstreamのCAM、寸法、比較、flow可視化はspineを参照。
- CP削減ではsurface誤差だけでなくspineのHausdorff distance、edge radius、start/fade位置を検査。
- tail corner、swallow tip、wingとのintersectionではtopological vertexを明示し、fillet roll-off/self-intersectionを検出。

## Bézier / NURBS表現

### 断面

- upper rail、lower rail/tuck、bottomをpiecewise cubic Bézier。
- soft region joinはG2、apexは通常滑らか、theoretical hard edgeは意図的G0/G1。
- circular radiusを厳密表現する必要があればrational quadratic Bézier/NURBS。cubic polynomialは円弧近似。
- chamferはlinear segment、両端を小radiusでblend可能。

### 長手surface

- feature linesをcubic B-spline/NURBS curvesとして作り、共通knot vectorを持つsection curvesをloft。
- variable-radius rolling-ball filletまたはcontact-line based blend。radius functionとcross-section type（round/chamfer/G2 freeform）を別パラメータにする。SMLib等のfillet frameworkも両者を独立に扱う。
- G2 blendは隣接surfaceの曲率まで一致するが、release edgeには必ずしも適切でない。nose soft blendやchine fadeには有用。

## CNC / tool radius / finishing

- 3-axis/5-axis foam shapingは通常ball-nose等で外側自由曲面を走査する。外部凸edgeは理論上小さく加工できても、toolpath step-over、machine tolerance、foam tear、fixture access、裏返しregistrationが完成半径を制限。
- 一般CNCの内部cornerはcutter radius未満にできない。channel/chineとの凹intersectionに直接該当する。外部rail edgeでもtool center offsetと接近角を検証する。
- `toolRadius`, `stepover`, `scallopHeight`, `stockAllowance`, `handFinishAllowance`をCAM profileに保存。
- edge部はnose/tail両面加工の境界になりやすい。setup seamをrelease lineへ一致させるか、片面から仕上げる戦略をCAMで選ぶ。
- foam cut後にfiberglass/epoxy/polyester、hot coat、sandingが加わる。鋭さはresin bead/tape lineとhand sandingで作られる場合があり、foam CADのzero edgeは完成品を再現しない。
- `as-designed foam`, `as-machined`, `as-laminated`, `as-sanded`の状態を分け、完成目標から逆算したallowanceを持つ。

## 安全な最小半径

surfboard rail/tail edgeについて性能・安全を両立する公的な普遍minimum radius規格は確認できない。したがって架空の固定値を規格として実装しない。

- sharp nose、fin、tail等の突起は重篤な眼外傷原因として医学報告がある。rail edgeも衝突・裂傷リスクをゼロにしない。
- nose、forward rail、初心者/softboard、混雑用途には大きいfinished radiusを安全presetとする。
- tail release edgeは性能上小radiusを要求し得るが、tip/cornerだけは局所blunt化、最小corner radiusを別設定。
- UIで`theoretical radius=0`を許してもmanufacturing/safety validationはwarning。完成radiusは材料、glass layers、研磨公差を含めて定義。
- 実際のminimumはmanufacturer/tool/material/processごとのvalidated capability tableで決める。

Greenlightのhand-shaping資料ではbottom tuckが概ね3/8–3/4 in radiusの範囲という実務例があるが、これはtuck tool半径であってrelease edgeの安全minimumではない。

## Validation

1. edge radius/chamfer widthが全xで非負
2. fillet contact curvesが交差・反転しない
3. minimum skin thickness、channel/fin-box clearance
4. curvature combにfade起因spikeなし
5. theoretical spineとfinished edgeのoffset誤差
6. cutter accessibility、gouge、remaining cusp/scallop
7. left/right setup registration
8. exported NURBSのtoleranceと再import roundtrip
9. safety presetのtip/corner finished radius
10. CP削減前後のstation valuesとfeature-line distance

## 推奨データ構造

```json
{
  "releaseSpine": {"curve":"nurbs", "controlPoints":[]},
  "stations": [{
    "x":1200,
    "apexRatio":0.32,
    "tuck":{"width":18,"depth":8,"radius":12},
    "edge":{"type":"round","radiusFoam":1.5,"radiusFinished":2.2,"angle":72}
  }],
  "fade":{"startX":900,"fullX":1250,"law":"quinticSmoothstep"},
  "continuity":{"railSide":"G1","bottomSide":"G1"},
  "manufacturing":{"toolRadius":6,"stepover":2,"stockAllowance":0.5,"handFinish":true},
  "safety":{"preset":"performance","cornerMinFinishedRadius":3}
}
```

数値はschema例であり推奨寸法ではない。

## 画像・CAD資料

1. Greenlight rail guide（tuck→hard edgeの長手遷移、水流・断面図）  
   https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide
2. Greenlight Rail Runner（tuck shaping tool写真）  
   https://greenlightsurfsupply.com/products/rail-runner-surfboard-shaping-tool-pvc-plastic
3. Autodesk Alias variable fillet図（radius/chord variation）  
   https://help.autodesk.com/cloudhelp/2023/ENU/Alias-NURBS-Modeling/files/Create-geometry/Build-transition-secondary/GUID-0DA4843D-4B9D-424B-B787-D4332A6AAA49.html
4. Autodesk Alias Freeform Blend（G0/G1/G2/G3 continuity図）  
   https://help.autodesk.com/cloudhelp/2022/ENU/Alias-Tool-Palette-Reference/files/Surfaces-palette/GUID-C4A14175-8BED-4B74-856C-5704468E942C.html
5. SMLib fillet framework（round/chamfer/variable radius/G2例）  
   https://docs.nvidia.com/smlib/manual/smlib/fillets/
6. IronCAD variable fillet station UI図  
   https://techbase.ironcad.jp/portal/en/kb/articles/create-variable-fillet
7. CNC sharp-corner/tool-radius DFM図  
   https://www.hubs.com/knowledge-base/sharp-corners-in-cnc-machining/

## 出典

- Greenlight Surf Supply, **Surfboard Rail Design Guide**. rail/apex/tuck/edgeとreleaseの専門実務資料。  
  https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide
- Natural Curves Surfboards, **Surfboard Rails**. nose-to-tailのtuck/edge transitionとboard class別設計。  
  https://www.naturalcurvesboards.com/html/designhtml/rails.html
- Autodesk Alias, **Surface Fillet / Freeform Blend documentation**. variable-radius、chord、G2 blendのCAD一次資料。  
  https://help.autodesk.com/cloudhelp/2023/ENU/Alias-NURBS-Modeling/files/Create-geometry/Build-transition-secondary/GUID-0DA4843D-4B9D-424B-B787-D4332A6AAA49.html
- NVIDIA/SMLib, **Fillets**. radius definitionとcross-section typeを分離する実装資料。  
  https://docs.nvidia.com/smlib/manual/smlib/fillets/
- Dimmick et al. (1998), **Surfing-related ocular injuries**. sharp surfboard nose衝突を主要機序として報告。edge固有のradius研究ではないため安全warningの補助根拠。  
  https://pubmed.ncbi.nlm.nih.gov/9801037/

## 注意

- hydrodynamic edgeの理想化と製造形状を同一視しない。
- G2は美しいblendに有用だが、release lineを消す場合がある。機能的breakを保持する。
- universal minimum radius、特定radiusの速度増、edge開始位置を科学的定数として扱わない。board、wave、rider、工程の条件付き設計値である。
