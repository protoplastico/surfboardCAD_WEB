# サーフボード・エッジの分類、定義、CAD幾何

調査日: 2026-08-12  
担当: research-18（hard/soft/release/tucked edge、bevel/chine、tail edge）

## 結論

サーフボードで「edge」は少なくとも4種類の異なる幾何を指す。

1. **bottom rail / release edge**: bottom面とrail外面の境界にある長手方向feature
2. **tucked-under edge**: rail apexより内側へtuckしたbottom側のedge
3. **bevel/chine edge**: 異なるpanelを分けるridge/crease
4. **tail outline edge/corner**: plan viewのtail block、square/squash/swallow tip等の輪郭角

さらに完成品はdeck-bottomを囲むlaminated shellなので、tail blockの後端にはbottom面とdeck面が交わる**transverse trailing edge**もある。これらを単一`edge=hard/soft`で扱うと、位置、長手方向、断面方向、top-view輪郭が混同される。

CADではedgeを「名前」でなく、3D path、隣接surface、included angle、fillet radius、tuck inset/height、長手fade、feature continuityで表す。`hardness`は補助UI値とし、必ず実寸radius等へ解決して保存する。

## 1. 用語の混同を解く

### rail

railはboard外周の3D断面領域全体。rail apex、fullness、volume、deck/bottom blendを含む。edgeはrailの一部であり同義ではない。

### rail apex

断面で最も外側の点。50/50、60/40、down rail等の高さ分類に使われる。通常、release edgeより上/外側にある。apexがsharpとは限らない。

### tuck

bottom面からrailへ回り込む曲線/幅。`tuck inset`はapexから内側への距離、`tuck height`はbottom基準からの高さ。tuckはedgeそのものではない。

### edge

局所的に曲率半径が小さい、または接線が不連続なcurve feature。hard/softは程度で、厳密な二値ではない。

Surflineはtucked edgeを、rounded/soft railのbottomにわずかに角度の付いたedgeを仕上げたrail designと定義する。[Surfline Glossary](https://www.surfline.com/gear/glossary/glossary_definitions.cfm?id=60424) この定義だけでも「soft rail」と「edge hardness」は同時に存在でき、soft rail = edgeなし、hard rail = 全断面が角張る、ではないことが分かる。

## 2. 分類

### A. soft rail / soft bottom edge

- deck→apex→bottomが大きな連続半径で回る
- 明確なrelease creaseを持たない、または大きいfillet radius
- 断面曲線は通常G2
- `edgeRadius`だけでなく、前後の曲率分布とincluded angleを持つ

### B. hard rail / hard edge

- bottom側の曲率が局所的に集中し、小radius/角を形成
- 数学的sharpなら隣接面がG0接続、有限radiusなら短いfilletを介してG1/G2
- 「hard rail」はrail全体のvolume/apex位置を決めない
- SURFitもhardはbottom railにedgeがあることとし、そのedgeはroundedの場合もsharp angularの場合もあると図示する。[SURFit Rails（hard/soft比較図）](https://shop.surfit.com/pages/how-to-choose-a-surfboard-the)

### C. release edge

- 水がbottomからrail外面へ回り込む境界の長手edge
- 通常tail付近で明確、前方へsoftにfade
- 幾何的にはbottom patchとouter rail patchの境界curve
- hard/softはradiusの程度、release edgeは機能/位置を指すため同義ではない

Greenlightはhard edgeが曲面の連続を切り、水のrelease pointを与えると断面と流れの図で説明する。またedgeがsoftでapex下にtuckされる場合、速度によってreleaseの程度が変わると区別する。[Greenlight Rail Design](https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide)

### D. tucked-under edge (TUE)

- edge pathがapex直下ではなく内側（centerline側）へoffset
- `tuckInset`, `tuckHeight`, `edgeRadius`, `edgeAngle`が独立
- soft rounded outer rail + hard/soft tucked bottom edgeという複合断面
- tuck量とedge hardnessを同じsliderにしない

### E. bevel

- 1枚の斜めpanelでdeck/bottom/railを切り替える面取り
- 通常2本の境界curve（inner/outer bevel edge）を持つ
- `bevelWidth`, `panelAngle`, 各edge radius`, start/end fade`
- soft bevelなら両境界をfillet、hard bevelならcrease

### F. chine

- 異なるsurface panel間の明確なridge/edge。1本または複数
- bottom chine、rail chine、step/chine等の位置をsurface pairで定義
- hard chineはG0、soft chineは小radius fillet
- chineを単なる「hard rail」とせず、独立path/topologyとして保持

Essential Surfingはchine railを追加ridge/edgeによってbite/release pointを制御する形と説明する。[Essential Surfing Rail（用語図）](https://essentialsurfing.com/rail/)

### G. rail edge

曖昧語。多くはbottom rail/release edgeを意味するが、文脈によりoutlineの外端やchineも指す。データ名には使わず、`bottomReleaseEdge`, `chineEdge`, `outlinePerimeter`などへ具体化する。

### H. tail edge

さらに3つに分ける。

1. `tailRailReleaseEdge`: tail側面に沿うbottom release edge
2. `tailBlockTrailingEdge`: tail block後端でbottom/deck/vertical faceが交わる横断edge
3. `tailOutlineCorner`: top-viewでrail lineとtail block/swallow cutが交わる角

square tailのoutline corner radiusを変えてもbottom release-edge radiusは同じとは限らない。swallow tipのplan-view角、tipを上下から見たlamination radius、bottom edgeは別パラメータ。

## 3. CADパラメータ

```json
{
  "edgeFeature": {
    "id": "right-bottom-release",
    "type": "bottomReleaseEdge",
    "side": "right",
    "path": {"reference": "railApex", "tuckInsetCurve": "curve-21", "heightCurve": "curve-22"},
    "xRange": [0, 1120],
    "radius": {"tail": 1.2, "mid": 8.0, "fadeEnd": 1120},
    "includedAngleDeg": {"tail": 82, "fadeEnd": 145},
    "hardness": {"tail": 0.92, "fadeEnd": 0.0},
    "continuity": {"atEdge": "fillet_G1", "alongPath": "G2"},
    "manufacturing": {"minRadius": 1.0, "preserveSharpNormal": true}
  }
}
```

### 必須値

| パラメータ | 意味 |
|---|---|
| `type` | release/chine/bevel-boundary/tail trailing/outline corner |
| `path(x)` | 3D edge locus。stationごとの孤立点ではない |
| `adjacentSurfaces` | edgeが分ける2面。名称衝突を防ぐ |
| `radius(x)` | 実寸fillet radius。0は数学的crease |
| `includedAngle(x)` | 隣接面の接線角 |
| `tuckInset/Height(x)` | apex基準のedge位置（TUE） |
| `fadeStart/End` | edgeがsoft/hardへ移る区間 |
| `continuityAcross` | G0 / fillet G1 / G2 |
| `continuityAlong` | edge path自体のG1/G2 |
| `featureTag` | meshing/CNC/exportでedgeを保持する印 |

### hardness

`hardness`を0–1で提供する場合、radiusだけの逆数にしない。同じradiusでもrail厚さ/角度で見え方が違う。

```text
hardness = f(radius / localThickness, includedAngle, curvatureJump)
```

UI sliderから次へmappingする。

- normalized radius `r/t`
- included angle
- fillet span
- surface-normal change rate

resolved実寸を必ず保存・表示する。

## 4. 断面幾何

片側断面をbottom interior `B` → rail/tuck `R` → apex `A` → deck `D`とする。

### soft

- `B→R→A`をG2の1–2 cubicで形成
- Rはsemantic tuck pointでも曲率極大点とは限らない
- radiusは局所曲率 `r=1/|κ|` として測定

### finite-radius release edge

- bottom tangent lineとrail-side tangent lineのoffset交点からfillet centerを解く
- 円弧をNURBSで厳密、またはcubic Bezierで近似
- 四分円近似の初期ハンドル長は `0.55228475r`
- fillet両端はG1、可能なら曲率をblendしたG2 variable-radius fillet

### mathematical hard edge

- bottomとrail patchをedge pathで分割
- across-edgeはG0（位置共有、法線不連続）
- tessellation時にvertex positionは共有してもnormalを共有しない
- export/CNC後の物理丸みはmaterial/tool工程値として別管理

### tuck

`tuckInset = yApex-yEdge`。edgeを内側へ移すほど、apexからedgeまでのlower rail curveが必要になる。`tuckInset=0`でもedge radiusはhard/softどちらも可能。Natural Curvesはapexからのtuck距離と、tailからwide pointへhard edgeをどこまで持続するかを別要素として図示する。[Natural Curves Design Topics](https://www.naturalcurvesboards.com/html/designtopics.html)

## 5. 長手方向のfoil/fade

多くのboardではnose/entryでneutral/soft、wide point付近でtuckが現れ、tailへ向かいtuckが減りedgeが強くなるが、固定則ではない。Natural Curvesはnose→wide point→tailでapex、tuck、edgeが変わる複数board classの断面画像を掲載し、tailでsoft/hard edgeとlittle/no tuckの組合せを説明する。[Natural Curves Rails](https://www.naturalcurvesboards.com/html/designhtml/rails.html)

長手curve:

- `edgeRadius(x)`
- `tuckInset(x)`, `tuckHeight(x)`
- `includedAngle(x)`
- edge path `y(x),z(x)`
- bevel/chine width/angle

linear fadeは開始/終了で曲率jumpを作るため、cubic B-splineまたはquintic smootherstepを使用。edgeが消えるときCPを重複させず、radiusを大きくし隣接面へ吸収するかfeature patchをdegenerate-safeに終端する。

### edge length

「edgeをtailからどこまで前方へcarryするか」は独立寸法。Natural Curvesはhard/machined edgeの長さとtuck量を別に扱う。よって`hardness`だけでなく`hardStartX/softEndX`を保存する。

## 6. bevel/chineの面構成

bevelは単一edgeでなくpanelを伴う。

```text
bottom surface -- inner bevel edge -- bevel panel -- outer bevel/chine edge -- rail surface
```

パラメータ:

- inner/outer path
- panel width/angle/curvature
- 各boundary radius/continuity
- nose/tail fade
- left/right independent

hard chineはsurface partition、soft chineはfillet patch。単一NURBS面で無理に小radiusを作るとCV過密・波打ちが起こるため、feature patchを分ける。

## 7. tail outline/cornerとの分離

top-view tail termination:

- square/squash corner radius
- swallow tip radius
- diamond vertices
- tail block/pod width

3D bottom edge:

- release edge radius/path
- tail block bottom trailing radius
- side-to-tail face blend
- deck-to-tail face radius

これらを別feature graphにする。plan outline cornerを丸める処理でbottom release edgeまでsoft化しない。逆にhard bottom edgeでtop-view squash cornerを尖らせない。

## 8. 名称混同・誤実装

1. `hard rail`をrailが薄い/low/fullであることと同義にする
2. `soft rail`ならedge featureがないと決める。soft outer rail + tucked edgeは一般的
3. tuck量とedge hardnessを同じsliderにする
4. release edge、rail apex、outline perimeterを同じ3D curveにする
5. tail edgeをplan-view tail cornerだけで表す
6. edge radiusだけ保存しincluded angle/local thicknessを無視する
7. hardnessを0/1 enumにし長手fadeを表せない
8. hard edgeをG2 fairing/normal averagingで消す
9. chineを小radius railと同じにしpanel topologyを失う
10. bevelを1本のedgeとして保存しpanel幅/角度を失う
11. stationごとにedge点を独立編集しpathを波打たせる
12. radius=0をそのままCNCへ渡しtool/materialの物理限界を無視する
13. tail block後端、bottom release edge、swallow tipを一括filletする
14. 水理性能をedge単独から断定する。rail volume、apex、tuck、bottom、rocker、fin等と相互依存

## 9. 検証

- edge pathのG1/G2、曲率jump、loop
- radius/included angle/tuckの長手グラフ
- edge pathがapex/outlineを越えない
- fillet self-intersection、surface fold、negative Jacobian
- left/right意図外非対称
- tail terminationでedge同士のjunction gap/overlap
- minimum tool radius、lamination/sanding allowance
- mesh feature normal保持
- section curvature comb、zebra、contour highlight

Shape3Dはsliceにapexとrail/tuck pointを定義し、angular/continuous/vertical tangent、C2、wire/curvature表示、kink/loop検出を提供する。edge実装の基礎CAD検証として参照できる。[Shape3D X Manual](https://www.shape3d.com/support/User_Manual_V9.htm) AKUもRail Curve Refinerでtuck/apex curveを編集する。[AKU Shaper](https://akushaper.com/software)

## 10. UI提案

- cross-sectionにapex、tuck、release edgeを別glyphで表示
- `edge radius`, `included angle`, `tuck inset`, `tuck height`を独立操作
- side viewにhardness/radius/tuckのlongitudinal curves
- feature list: release edge / chine / bevel / tail trailing / outline corner
- `preserve rail volume`, `preserve tuck`, `preserve outline corner` lock
- hard featureにはcrease badge。smooth commandから除外
- tail 3D viewでrail edgeとtail block edgesを色分け
- manufacturing previewにdesign radiusとas-cut/as-sanded radiusを併記

## 11. 画像URL・主要出典

1. [Greenlight Rail Design](https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide) — hard/soft/tucked edgeの断面、水流release、tuck suction比較の詳細図。
2. [Natural Curves Rails](https://www.naturalcurvesboards.com/html/designhtml/rails.html) — nose/wide point/tailのapex・tuck・edge foil、板種別断面画像。
3. [Natural Curves Design Topics](https://www.naturalcurvesboards.com/html/designtopics.html) — no tuck/max edge対notable tuck/min edge比較図、edge長の説明。
4. [SURFit Rails and Deck](https://shop.surfit.com/pages/how-to-choose-a-surfboard-the) — hard/soft、mid/tail rail、full/lowの比較画像。
5. [OpenShaper Design Guide](https://openshaper.com/surfboard-design-guide/) — soft upper rail+tucked bottom edgeのCAD断面画像。
6. [Surfline Tucked Edge](https://www.surfline.com/gear/glossary/glossary_definitions.cfm?id=60424) — tucked-edgeの簡潔な専門用語定義。
7. [Essential Surfing Rail](https://essentialsurfing.com/rail/) — rail/tucked edge/chineの用語画像。
8. [Foam Magazine Soft vs Hard Rails](https://foammagazine.com/surfboard-rails/) — hard railの断面水流diagramと実物画像。
9. [SurferToday Rail Types](https://www.surfertoday.com/surfing/the-different-types-of-surfboard-rails) — hard/soft/TUEの分類写真。
10. [Shape3D X Manual](https://www.shape3d.com/support/User_Manual_V9.htm) / [PDF](https://shape3d.com/Manuals/User_Manual_V9.pdf) — apex/rail point、tangent、C2、curve/3D検査CAD画像。

## 実装優先順位

1. `bottomReleaseEdge`を3D path + radius + angle + tuckとして独立feature化
2. rail apex/tuck/edge、tail outline corner、tail trailing edgeを分離
3. radius/hardnessの長手B-spline fadeとfeature-normal保持
4. bevel/chineをpanel + 2 boundary curvesとして実装
5. tail junction、surface fold、minimum radius、CNC/lamination検査
6. left/right非対称edgeと製造後radius予測

## 出典評価

断面の定義とシェイピング上の区別にはGreenlightおよびNatural Curvesを優先し、CAD実装・検査にはShape3D/AKU Shaper公式を用いた。一般メディアは用語の実際の曖昧さと比較画像の補助に限定した。hard/softの性能説明は条件依存が大きいため、報告の主眼を測定可能な幾何へ置いた。

