# サーフボード・ボトムコンターの性能／流体調査

調査日: 2026-08-12

## 0. 結論と研究限界

- 横断面では基本的に `flat / concave / convex`。vee、belly、double concave、channels等はその構成・局所featureで、1枚のboard内で長手方向にblendされる。
- 性能は速度、trim/迎角、bank角、wave面の勾配・荒れ、wetted area、rocker、rail、tail、fin、surfer荷重で変わる。「concave=速い」「vee=rail-to-railが楽」のような無条件命題は不正確。
- Greenlight自身がconcaveについて「一般化するな」とし、知識の多くは世代的なrider/shaper feedbackで、適用可能な科学研究が乏しいと明記。
- 近年CFDはboardのlift/drag/pitch equilibriumを扱えるが、自由表面、換気、変動荷重、flex、surfer動作、砕波面を完全再現しない。実サーフ中の圧力計測も2025年のfin研究が初級例で、bottom contour間の統制比較は不足。

## 1. 幾何定義

- **Flat:** 同一stationでrail-to-railが直線。ただし長手にはrockerがあるので3D面は平面ではない。
- **Concave:** bottom center/局所領域がrail bottomよりdeck側へ持ち上がる凹断面。single、double、single-to-double等。
- **Convex:** stringer側bottomがrail bottomより下へ張り出す凸断面。belly/roll、panel vee等。
- **Vee:** stringerが横断面の低いridgeとなり、左右panelがrailへ上がる凸形。panel veeは左右が概ね平面、rolled veeは丸い。
- **Channels:** 既存のflat/concave/convex底に刻む複数の長いwedge groove。全体rockerを大きく変えるconcaveとは区別。
- **Chine:** bottomとrailの間の面／折れ線（bevel, chine rail）。横断面に追加のplaning/release面とcornerを作る。channel（溝）と別物。

## 2. Flat

- 流れを横へ強くredirect/containせず、moderate speed・medium/glassy conditionではenergyをturbulenceへ失いにくくpredictable/efficientとのシェイパー見解。
- liftは主にbottom planeの水面に対する角度（rocker/trim）から発生。finが方向安定の主要部。
- 低速ではflowを捕らえるfeatureが乏しくbog感、高速chopではcleave/ventilation/control feature不足でslap/bounceし得る。
- よって「flatが最小dragで常に最速」ではなく、表面状態と姿勢依存。

## 3. Concave

### 期待される作用

- flowをnose-to-tail方向へ寄せ、rail外への横流出を遅らせる。局所pressure/deflectionによりlift、drive、bite/hold感を作り得る。
- foamを除きrail rockerを保つため、concave内のplaning rockerは相対的にflatになる。低速planing/上限速度を助けつつ、curvier rail rockerでturn radiusを残す設計意図。
- rail近くのbottom plane/edge角をdownturnedに見せ、weight/pump時に早くengageしprojectionを感じさせる。

### 代償・条件

- narrowing aft wallへ水を当てればupward liftだけでなくback/outward成分＝dragも生む。holdとdragは同じredirectionの両面。
- 深さ/長さが増すほどrocker変更、flow containment、edge presentationも増すが、過度ならtracky、jitter/bounce、不安定。高速・chop、軽量board、深い前足下concaveで顕在化し得る。
- air/ventilationを保持しdrag低減するという説はあるが、安定低下もあり、surfboardでの定量実証は限定的。`laminar flowを必ず維持`等は断定しない。

### Single / Double / Single-to-double

- singleはstringer沿いを最もflattenし中央channelを作る。
- doubleは左右にplaning/flow領域を分け、stringer ridgeと組合せてroll/bankを助ける設計意図。double単独よりsingle内にdoubleを掘る方がさらに局所rockerをflat化し得る。
- `double concave = vee`ではないが、中央ridgeによりconcave-in-veeとして両作用を合成可能。

## 4. Vee

- panel veeはstringer peakから左右railへflat panel。rail rockerをstringer rockerより増やし、bank時の一方panelをplaning faceにする。
- entry veeはchopをcleaveし、nose railを持ち上げcatchを減らし、directional stabilityを足す用途。
- tail veeはrail rockerを増して、rail上ではtight turnを可能にし得る。
- 俗説「veeは常にrail-to-railが容易」は半分だけ正しい。moderate veeはwide tailを片側panelへ傾けやすいが、深く長いveeはkeel的方向安定が強すぎ、sticky/trackyでrailへ上げにくくなる（Greenlight）。
- rolled veeはpanelを丸め、edge/transitionをsoftにし、よりsmooth/glidingで横driftを許す反面、面積/dragが増え得る。
- reverse/spiral等は名称揺れが大きい。CADでは名前でなくdepth-vs-lengthとpanel curvatureを保存。

## 5. Convex / Belly / Hull

- centerが低くvolumeを足し、低速で水をdisplace。左右斜面のforceは真上でなく接線成分となり、boardを水中へsettleさせcontrol/stabilityを与える傾向。
- entryのroll/bellyはchopを分け、smooth rail engagement。performance shortboardではlift/instant responseを減らすため限定的、longboard/retro/gunで多い。
- 高速に達するとbelly中央の狭いpeakだけでplaneしてwetted areaを減らす、というhull theoryがあるが、十分なspeed/entry-rocker liftが条件。弱波・低速で常にfastではない。
- `displacement hull`は厳密な船舶分類をsurfboardに比喩適用することが多く、完全非planingを意味しない。

## 6. Channels

- 通常tailに4〜8本、fin toeに近い角度で、平行またはexitへflare。長さ/深さで効果が強まり、tailから抜けるか途中fade。
- concaveと違い既存rocker面にwedge groovesを追加し、rocker自体を大きくflat化しない。
- flowを長手へguideしてdrive/hold、turn中のspeed conservationを狙う。groove wall/edgeはlateral slipを抑える。
- 代償は追加wetted surface、edge turbulence、trackiness、低速弱波のdrag感。深く長いほど強いとは限らない。fin位置/size、tail width、rockerとセット調整。
- ventilation/boundary-layer turbulenceによるdrag低減説は形/速度依存で実証不足。単に「水を圧縮して噴射し推進する」と説明しない。

## 7. Chines / Bevels

- rail-bottom間を切り落とした斜面または複数面。hard chineは明瞭な折れ、soft chineはround blend。
- hullを実効的に狭め、bank前後でengaged surfaceを切替え、wide/thick boardのrail-to-railを助けることがある。cornerはrelease/flow separation点になり、spray/drag/holdを変える。
- chine面がplaning liftを受ける場合も、waterを逃す場合もあり、角度・幅・全長・bank/trim依存。「chine=release」だけでは不十分。
- rail bevel、elevated wing、step railと名称が混線する。CADでは`width, angle, edgeRadius, start/end station`で表す。

## 8. Lift / Drag / Hold / Releaseの因果

- hydrodynamic forceは概ね速度の二乗、wetted area、迎角、面の法線方向と圧力分布に依存。lift増には通常induced/form/spray dragやcontrol変化を伴う。
- **hold**は魔法の吸着でなく、engaged rail/fin/channel wall等が横流れをredirectする反力と方向安定。
- **release**はhard edge等でflowをboardからseparateさせ、wrap/Coanda的付着とwetted areaを減らすこと。ただし早すぎるreleaseはhold低下。
- rail-to-railは横断面だけでなくwidth、rail volume、rocker、fin、surfer inertiaで決まる。
- 同じconcave depthでもboard幅が違えばpanel angleが違うため、絶対depthだけで比較しない。

## 9. CAD/評価指標

各stationで `centerDepthRelativeToRails`, `panelAngle`, `concaveCount`, `curvature`, `chine width/angle/edgeRadius`、長手にstart/max/endとrocker差を保持。

- stringer rocker、rail rocker、各concave trough rockerを別々にplot。
- 6/12/18/24 in stationの断面と連続curvature heatmapを表示。
- channelはgroove count/depth/width/toe/flare/start/end/exit、finとの干渉を保存。
- 性能予測は単語lookupでなくspeed/trim/bank/wave conditionを入力した相対傾向＋confidence表示。
- CFDを用いるなら同一outline/rocker/volume/finでcontourのみ変え、free-surface mesh、Re/Froude数、姿勢平衡を揃える。

## 10. 画像掲載ページ

1. Greenlight Bottom Contour Design  
   https://greenlightsurfsupply.com/pages/surfboard-bottom-contour-design-greenlight-surfboard-design-guide  
   flat flow、concave flow/rocker/ventilation、panel/reverse/spiral/rolled/concaved vee、belly、channels、Bonzerの多数の断面・流線図。
2. Natural Curves Bottom Contours  
   https://www.naturalcurvesboards.com/html/designhtml/bottoms.html  
   contemporary contour構成とlongitudinal transitionの専門図。
3. Greenlight Shaping Guide  
   https://greenlightsurfsupply.com/pages/surfboard-building-guide-how-to-shape-surf-board  
   concave/veeのmarkingと実際の切削写真。
4. SurferToday Complete Guide  
   https://www.surfertoday.com/surfing/the-complete-guide-to-surfboard-bottom-contour-designs  
   flat、single/double concave、vee等の比較画像。二次資料。
5. MDPI CFD methodology  
   https://www.mdpi.com/2504-3900/49/1/68  
   generic surfboardの圧力、lift/drag/pitch、equilibrium attitude可視化。特定contour勝敗の証拠ではなく研究方法の例。

## 11. 出典

- Greenlight Surf Supply, “Surfboard Bottom Contour Design” — 専門教材、経験則と限界を明記。  
  https://greenlightsurfsupply.com/pages/surfboard-bottom-contour-design-greenlight-surfboard-design-guide
- Natural Curves Boards, “Surfboard Bottom Contours” — 現役設計者資料。  
  https://www.naturalcurvesboards.com/html/designhtml/bottoms.html
- D. D. Silva et al., “Hydrodynamic Characterization of Planing Surfboards Using CFD” — 方法論的査読資料。  
  https://www.mdpi.com/2504-3900/49/1/68
- Scientific Reports, “Measurements of hydrodynamic pressure on a surfboard fin during surfing” — 実海上測定の難しさとlift-drag tradeoffの参考。  
  https://www.nature.com/articles/s41598-025-94834-0

## 12. 俗説チェック

1. concaveが水を「圧縮してjet推進」する、と断定しない。
2. concaveはliftだけでdragなし、としない。
3. veeは深いほどrail-to-railが容易、としない。
4. convex/hullは常に遅い、または常に高速、としない。
5. flatは全条件で最速、としない。
6. channelsとconcave、chinesを同一featureにしない。
7. contour名だけで性能を決定せず、rocker/rail/fin/速度/姿勢を併記。
8. shaper経験則と統制実験／CFD結果のevidence levelを区別する。

