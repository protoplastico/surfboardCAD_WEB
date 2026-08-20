# サーフボード計測規約調査

調査日: 2026-08-12

## 0. 標準化状況

- 一般surfboard形状一式を統一する専用ISO/ASTM規格は確認できない。業界慣行はあるが、length datum、rocker straightedge、fin mark、finished/blankで差が残る。
- ISO 11154の“test surfboard”はroof-load carrier試験体で、custom surfboard計測規格ではない。
- 従ってCAD交換では数値だけでなく、datum/method/state/unit/toleranceを必須metadataにする。

## 1. Length

**一般慣行:** nose tipからtail tipまで。ft-in表記（例6'2"）。

- Greenlightはdeck sideでtapeをtautにしてtip-to-tipと説明。これはdeck曲面に沿うarc lengthか、張ったtapeのstraight/chordか文章だけでは曖昧になり得る。
- CAD推奨はcenter plane上のnose-tail tipの**直線投影/chord length**をprimary (`overallLengthChord`) とし、deck/bottom surface arc lengthは別値。
- swallow/bat tailはtail datumを最も後方のtipかstringer notchか明示。通常overall lengthはnoseから最遠のtail extremity。asymは左右tip別＋maximum overall。

## 2. Width / wide point

- `maxWidth`: plan viewでstringerに直交する全幅の最大値。board midpoint幅と混同しない。
- `widePointPosition`: nose/tailまたはgeometric centerからのlongitudinal offsetを併記。wide pointはcenterと一致しない。
- 実測はsquareでcenterlineに直交。曲面上の巻尺arcでなくplan projection/chord。
- asym boardはleft/right half-widthと合計、各側max stationを保存。

## 3. Nose / tail widths

- 業界標準慣行はtipからstringer沿い12 in（304.8 mm）stationで、centerlineに直交して片側幅を測り2倍（Greenlight）。
- `noseWidth12`, `tailWidth12`。curve沿い12 inではない。
- tail notchを持つ場合、12-in stationの起点をoverall rear tip planeかstringer notchか明記。推奨はoverall length endpoint/datum planeで統一し、notch depthを別値。
- metric `width@300mm`は12 in=304.8 mmと同じでない。変換値なのか独立300mm stationなのか識別。

## 4. Thickness / foil

- `maxThickness`: deck-bottom間の最大局所距離。center/midpoint thicknessと混同しない。
- caliper測定方向を明記: global vertical Z、local bottom normal、またはshortest distance。CAD primaryはdefined center plane Z差が再現容易。
- foil stations: nose/tailから12/24 in、wide pointでcaliper測定するGreenlight慣行。center thickness、rail thickness、cross-section areaも別。
- deck pad/dents、glass lap、fin boxを含むか規定。shape designはcore surface、finished specはouter laminate surface。

## 5. Volume

- enclosed 3D spaceをlitersで表す。1 L = 1,000 cm³ = 1,000,000 mm³。
- CADはclosed watertight outer surfaceを数値積分。mesh tolerance/algorithm/versionを保存。
- physical finished boardはwater displacementで測れるが、leash/fin/air bubbles、吸水、fixture、温度/密度、浮力による完全浸漬保持が誤差源。
- foam/core volume、shaped blank volume、finished outer volume、displacement with finsは別。通常catalog litersがどのsurfaceか明示されない。
- L×W×Tのfactor式は概算で、rail/foil/rocker差を再現しない。

## 6. Rocker datum

- Greenlight方式: board bottom-up、長いlevel straightedgeのcenterをrocker apex/中央に置き、straightedgeからbottom stringerまでの隙間をnose/tailおよび複数stationで測る。
- 誤差要因: straightedge length、接触点/apex、水平かtip chordか、fin/concave、board自重、station origin。
- CAD推奨:
  - `rockerDatumMethod = center_tangent | best_fit | tip_chord | physical_straightedge`
  - datum line origin/angle/length/contact points
  - stringer bottom z at 0, 6, 12, 18, 24 in from both tips＋center
  - rail rocker/trough rockerは別curve。
- nose/tail tip liftだけではcurveを再現できない。全stationとslope/curvatureを交換。

## 7. Rail measurements

- 専用標準なし。各stationでlocal thickness、apex高さ、rail volume/area、tuck distance/radius、edge radiusを断面座標として保存。
- 50/50等はapex/上下curveの視覚分類で、精密寸法として不十分。
- rail caliper/templateはnose/quarter/wide point/fins/tail等のstationをtail/nose datumから記録。
- finished laminateでedge radius/rail thicknessが増え、hand sandingで左右差が出るためshape vs finishedを分離。

## 8. Fin placement

- Greenlight慣行: tail tipからfin rear/trailing referenceまで＋railから内側距離。toeは4.5-in基準線に対するoffset（1/4, 3/16, 1/8 in等）。cantはbottomからの角度。
- fin systemごとrouter dot、box center、rear mark、actual fin trailing edgeが違う。`datumType`必須。
- cantのzeroをglobal planeかlocal bottom normalか明記。concave/veeで差が大きい。
- 保存項目: xFromTail、yFromStringer/offsetFromRail、toeDeg＋referenceLength、cantDeg＋normal、base/box geometry。

## 9. 単位・表示

- 内部単位はmmとdegree、volume mm³/Lを推奨。IEEE浮動小数とrounding policyを固定。
- UIはsurf業界慣行のfeet/inches/fraction（1/16, 1/8）を提供し、SIも併記。
- decimal inchesとfraction inchesを混同しない。6'2.5"、6.2083 ftを明示format。
- conversion: 1 in=25.4 mm exactly、1 ft=304.8 mm exactly。
- measurement precisionとdesign toleranceを分離。表示1/16 inでもCNC内部0.01mm精度を品質保証と誤認しない。

## 10. Blank / shaped / finished state

```text
state: raw_blank | machined_oversize | hand_finished_shape | laminated | hotcoated | sanded_finished | fitted_with_fins
```

- raw blank catalogはdeck tip-to-tip length、natural rocker、skinを含み、finished board datumと同じとは限らない。
- CNC cutはhand-finishing allowanceを残す場合がある。
- lamination/hotcoat/paintでthickness/volume/edge radius増、sandingで減る。
- deck dents/repair/吸水したused boardはoriginal design再現値でない。
- fins/leash plug/padをoverall envelope/volumeへ含めないのがshape比較には適切だが、transport dimensionには含める場合がある。

## 11. 再現性プロトコル

1. state、温度、fins/pad除去を記録。
2. board center plane/stringerとnose/tail datum pointsを定義。
3. calibrated flat rack、level、straightedge、square、caliperを使用しtool resolution記録。
4. length/width/thicknessを各3回、左右half-width/railを別測定。
5. station originはnose/tail chord coordinate。curve distance禁止。
6. rocker datumを写真/diagramと座標で保存。
7. uncertainty（例±1 mm、edge radius±0.5 mm）とoperator/dateを記録。
8. 3D scanはscale calibration、alignment datum、mesh smoothing/hole-fill settings保存。
9. CADとphysical比較はouter surface同士、またはcore同士に揃える。
10. spec hash/versionで編集履歴を固定。

## 12. 推奨交換schema

```json
{
  "units":"mm",
  "state":"sanded_finished",
  "datum":{"origin":"tail_rearmost_plane","x":"stringer_chord"},
  "length":{"chord":1880.0,"deckArc":null},
  "outline":{"maxWidth":480.0,"widePointX":970.0,"noseWidth304_8":290.0,"tailWidth304_8":350.0},
  "foil":{"maxThickness":61.0,"maxThicknessX":960.0,"stations":[]},
  "volume":{"liters":30.2,"surface":"outer_finished","method":"cad_mesh","toleranceL":0.05},
  "rocker":{"method":"center_tangent","stations":[]},
  "rails":{"stations":[]},
  "fins":{"datumType":"base_trailing_edge","items":[]},
  "uncertainty":{"linearMm":1.0,"angleDeg":0.25}
}
```

## 13. 出典・画像

1. Greenlight Outline Design Guide  
   https://greenlightsurfsupply.com/pages/surfboard-outline-design-greenlight-surfboard-design-guide  
   length、12-in nose/tail width、wide pointの測定図。専門中核資料。
2. Greenlight Rocker & Foil Guide  
   https://greenlightsurfsupply.com/pages/surfboard-rocker-and-foil-design-greenlight-surfboard-design-guide  
   straightedge rocker図、foil caliper 12/24-in stations。
3. Greenlight Fin Placement Measurement  
   https://greenlightsurfsupply.com/blogs/news/how-to-measure-surfboard-placement-and-fin-toe-in-angle  
   tail/rail datum、toe測定の写真とG-square。
4. Greenlight Building Guide  
   https://greenlightsurfsupply.com/pages/surfboard-building-guide-how-to-shape-surf-board  
   blank/CNC/hand shape/fin-box各工程と計測画像。
5. US Blanks Product Catalog  
   https://www.foamez.com/pdfs/US%20Blanks%20Product%20Catalog%20.pdf  
   blankのtip-to-tip deck length、thickness、natural rocker station表。finished specとの違い確認。
6. SurferToday Dimensions  
   https://www.surfertoday.com/surfing/how-to-decipher-the-dimensions-written-on-a-surfboard  
   L×W×T×litersの市場表記画像。二次資料。
7. Surf Aids Custom Measurement Form  
   https://www.surfaids.com.au/Custom.pdf  
   length、12-in circumference等の実務フォーム。方法差がある証拠として参照。

## 14. 注意

- 数値にdatum/method/stateがなければ精密でも再現不能。
- “standard”と呼ばれる12-in幅もtail notch/asym/metric 300mmで起点を明示。
- catalog volumeはdistributionを示さず、異なるCADのmesh/surface stateで差が出る。
- ISO 11154をsurfboard shape標準として引用しない。

