# サーフボード・レールバンド工程と幾何調査

調査日: 2026-08-12

## 0. 要点

- `rail bands`は完成レールに残す段ではなく、矩形に近いblank断面から目標の曲面へ安全・左右対称に近づけるための**一連の切削平面（facets）とガイド線**。
- deck/bottom/rail上のmarkを結ぶ一次平面を切り、その平面の角を二次・三次bandで分割し、最後にsurform/sanding screen等で全facetをblendして連続曲面にする。
- 外側に意図して残す細いvertical surface（remaining rail band / buffer band）が最終apexとrail volumeを支配する。これを切り越すとoutlineにwobbleが入り、foamは戻せない。
- CADでは「工程用faceted preview」と「最終smooth rail surface」を分ける。band寸法は最終形状を構成する一方法であって、性能形状そのものの唯一表現ではない。

## 1. 用語と基準

Greenlightの定義を基本とする。

- **Rail mark:** blankをdeck-upに置き、元のbottom cornerからrailのvertical faceを上へ測った線。目標apex/bufferを意識して置く。
- **Deck mark 1/2/3:** 元のtop corner/outlineからdeck面を内側へ、rail lineに直交して測る線。全長方向に滑らかにつなぐ。
- **Bottom mark:** bottom cornerからbottom面を内側へ測る線。
- **Primary deck rail band:** rail markとdeck mark 1を結んで削る平面。
- **Secondary band:** primary bandの概ねmidpointとdeck mark 2を結ぶ平面。
- **Tertiary band:** secondary bandの概ねmidpointとdeck mark 3を結ぶ平面。全形状に必須でない。
- **Bottom rail band:** rail側markとbottom markを結ぶ平面。egg/knife/50-50などでtuck/下側roundを作る。
- **Tuck:** apexからbottomへrollし、bottom planeへblendする曲線。上下・内側への量で規定。
- **Remaining rail band / buffer mark:** deck bandとbottom tuck/bandの間に削らず残す外側strip。finish blending後のrail apexとなり、幅がvolumeを決める。

## 2. 前工程

1. outline/planshapeを切り、左右rail lineをfairにする。
2. bottom contours/rockerとdeck foil/crownを概ね完成させ、目標local thicknessを作る。railだけ先に確定すると後のdeck/bottom削りで比率が変わる。
3. centerline、thickness/foil、rail apex、tuck、edge、nose-to-tail transitionを決める。
4. template、caliper、square等で左右対称を確認。既存boardのrail profile templateを使う実務例もある。
5. deck/rail/bottom上にband guideをmarking gaugeや鉛筆で引く。単一固定寸法でなくnose/tailへ滑らかにtaperする。

## 3. Markingの幾何

各length station `x` の局所断面で、元blank cornerを基準にする。

```text
D1(x), D2(x), D3(x): outlineからdeck内側への距離
R(x): bottom cornerからrail face上方への高さ
B(x): bottom cornerからbottom内側への距離
V(x): 削らず残すvertical/buffer stripの高さ
```

- `D1`がprimary bandの幅・傾斜を決め、D2/D3はdeck crownへ段階的に接続する。
- `R`/remaining stripの上下位置がapex height、幅がrail volumeを強く支配。
- `B`とbottom-side rail markの組合せがtuck depth/radiusを支配。
- これらはboard全長にわたり一定でなく、wide pointでremaining stripが最も広く、nose/tailへsmoothに細くするのがGreenlightの原則。これがrail foil。
- guide線自体にもfair curveが必要。markの急変は完成railのlump/flat spotになる。

## 4. Bottom band / tuckの切削

工程順はシェイパーによりdeck-first/bottom-firstの両方がある。Brock Jonesはbottomから始め、最初の短いpassでbuffer markまで近づけ、後続passをtuck方向／長手方向へ伸ばしてfoilする。

### 一般工程

1. bottom-upに置き、bottom markとrail/buffer markをつなぐ一次平面をplaner/surformで切る。
2. nose/tailの薄い部分へ最初からtip-to-tipの深いpassを入れない。中央寄りの短いpassから開始し、後続passを徐々に端へ延長。
3. egg/pinched/knifeyではbottom bandを曲面へblend。Greenlightの例示寸法はeggがrail側1/2 in上＋bottom側7/8 in内、pinched/knifeyが5/8 in上＋1 in内。ただしこれは特定profileの参考値で万能値でない。
4. performance tailではtuckがnose/middleで多くsoft、wide point以降で減り、fin/tailでedgeが発達する。長手方向にも連続変化させる。
5. true 50/50 classic railは単純tuckだけでなく、blankを返してdeck側と同様のbottom rail bandsを作り、上下対称に近づける。

## 5. Deck bandsの切削

1. **Primary:** `rail mark → deck mark 1`を結ぶ大きな平面をcut。markそのものを消さず、一定のplaner angle/passで左右を交互に確認。
2. **Secondary:** primary facetの中央付近に新しいbreak lineを取り、そこからdeck mark 2へcut。primaryとdeckの鋭角を分割する。
3. **Tertiary:** 必要ならsecondary midpointからdeck mark 3へcut。domed deck、knifey/low rail等で広いcrownを段階化する。
4. nose/tailはblankが薄いため、中央と同じ深さ・pass lengthで切らない。foilに沿ってband幅と切削量を減らす。
5. remaining vertical bandへ到達したら止める。そこを越えるとapexが内側へ移り、平面視outlineにも凹み/wobbleが出る。

## 6. Remaining rail bandの意味

- tuck/bottom bandとprimary deck bandの間に残る細い外周face。
- finish前には垂直に近いstripだが、blend後はその中心近くが最大横幅＝apexとなる。
- 幅が大きいほどfull/boxy volumeを残し、小さいほどpinched/knifey。上下位置は50/50かdown railかを決める。
- wide pointで最大、nose/tailへ滑らかにtaperし、body foilと同期させる。
- `buffer`として鉛筆線よりわずかにfoamを残し、粗加工で線まで一気に削らず、screening時に最終寸法へ近づけるのが安全。

## 7. Blending / screening

1. planer/surformでfacet間のridgeを少しずつ落とす。primary→secondary→deck、primary→remaining strip→bottom bandの順に大きな不連続を細分化。
2. flexible sanding screen/abrasiveをrailに巻き、長手方向にsmoothなstrokeでband marksを消す。
3. 手の感触、斜光/shaping bay side light、template/caliperでlump、flat spot、左右差を検出。
4. apexを無意識に丸め過ぎず、予定した高さ/volumeを保持。tail edgeをsoftにしてしまわない。
5. nose-to-tail transitionを確認。断面単体が正しくても長手方向にapex/tuckが跳べば水流とfeelを乱す。
6. 最終shapeはfacetが視認できないG1/G2相当のfair surface（意図したhard edgeを除く）。

## 8. 代表profileとband構成

|完成profile|deck側|bottom側|remaining strip|
|---|---|---|---|
|full/boxy down rail|広いprimary、少なめのsecondary|moderate tuck|広め、低いapex|
|egg|2〜3 deck bands|1 bottom bandを丸くblend|中〜広|
|pinched/knifey|deck crownへ長い複数band|比較的深い1 bottom band|狭い|
|true 50/50|上下ほぼ対称のbands|deck側と同型のbottom bands|中央位置|
|performance tail|deck band→低いapex|tuck減少、crisp edgeへ|薄く低い、末端でedgeへ統合|

band枚数だけでprofile名を決めない。同じ2-bandでもmarks/remaining strip/tuckが違えば別断面になる。

## 9. CAD再現方法

### 9.1 二層モデル

**Final design layer**

```text
railSection(x) = {
  apexPosition,
  railVolume/area,
  deckTangent,
  bottomTangent,
  tuckDistance,
  tuckRadius,
  edgeRadius
}
```

これをnose-to-tailにloftし、最終smooth surfaceを真値とする。

**Manufacturing/band layer**

```text
railBands(x) = {
  deckMarks[D1,D2,D3],
  railMark,
  bottomMark,
  remainingBandBounds,
  cutFacets[]
}
```

final profileを外接/内接するpiecewise-linear facetsへ近似し、marking guideと切削量を生成する。工程layerを編集しても、blend後profileとの差をheatmap表示。

### 9.2 断面アルゴリズム案

1. 各stationでtarget Bezier/NURBS rail curveを得る。
2. apexとbottom edgeを保護点として固定。
3. deck側curveを曲率誤差が閾値以下になる2〜3 chordへ分割。各chord端のdeck/rail投影がband mark。
4. bottom側curveを1〜3 chordへ分割。50/50はdeck同等、tucked railはapex→tuck→edgeを別facet。
5. chord polygonと元blank断面の差からremove-volumeを計算。
6. station間で各mark lineをfair spline化し、交差／急変／negative remaining stripを検証。
7. blend simulationはpolygon cornerをfillet/subdivisionしtarget curveへ収束させる。

### 9.3 UI示唆

- `Final smooth`, `Marked blank`, `After primary`, `After secondary`, `After blend`を切替表示。
- deck marks、rail mark、bottom mark、remaining apex bufferを色分け。
- 断面だけでなく3D全長のmark linesを表示し、nose/tail taperを確認。
- fixed inch chartを盲目的preset化せず、board thickness/profileにscaleし警告を出す。
- 左右同じstation tableからmirror生成し、hand-shape用には左右別の実測補正も許可。

## 10. 工程上の代表的失敗

- 初回passをtip-to-tipで深く入れ、薄いnose/tailでapexを切り越す。
- pencil markを最初から消し、左右基準を失う。
- remaining stripが全長一定で、wide pointとtipのrail foilが不自然。
- bottom contour完成前にrail寸法を固定し、後でtuck/apexが変わる。
- facet ridgeを局所的にsandしてlumpを作る。長いstrokeと斜光が必要。
- tailの意図的hard edgeまでround overする。
- reference chartのinch値を異なる厚さ/board classへそのまま適用。
- 断面だけ合わせ、長手apex/tuck/edge transitionを検査しない。

## 11. 画像・動画掲載ページ

1. **Greenlight Surf Co. – Surfboard Rail Design Guide**  
   https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide  
   rail/deck marks、primary/secondary/tertiary bands、50/50・egg・knifey bottom bands、完成profileの図と寸法注記。中核資料。
2. **Greenlight – New Rail Band Dimension Chart with Domed Deck**  
   https://greenlightsurfsupply.com/blogs/news/new-rail-band-dimension-chart-with-domed-deck  
   domed deck対応のrail-band chart画像。寸法presetの実例。
3. **Hangtime Surf / Brock Jones – First Rail Band**  
   https://www.hangtimesurf.com/blog/first-rail-band  
   初回short passから後続passを端へ延ばすanimation、bottom-up断面animation、buffer markを視覚化。専門シェイパー一次資料。
4. **Instructables – How to Make a Surfboard, Steps 12–14**  
   https://www.instructables.com/How-to-Make-a-Surfboard/  
   marking part 1/2、rail bands切削の連続写真・動画。工程全体の視覚確認用。
5. **Andrew W – How to Build a Surfboard**  
   https://eclectic-workshop.weebly.com/how-to-build-a-surfboard.html  
   Video 12–16でmarking、cutting、blendingを順番に掲載。
6. **Srfer/Wave Tribe – Shaping Surfboard Rails**  
   https://srfer.com/shaping-surfboard-rails/  
   deck bands、vertical points、bottom/primary/secondary cutting、blendingを10段階で説明。実務例だが固定寸法は個人手法。
7. **Natural Curves Boards – Surfboard Rail Anatomy**  
   https://www.naturalcurvesboards.com/html/designhtml/rails.html  
   完成断面のapex/tuck/edge/volume図。band工程が最終的に何を作るかの照合用。

## 12. 出典評価

- Greenlight Surf Supply, “Surfboard Rail Design Guide” — 信頼度高。用語定義とband chartが詳細。  
  https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide
- Brock Jones / Hangtime Surf, “First Rail Band” — 信頼度高。プロシェイパーの具体的工程と失敗防止。  
  https://www.hangtimesurf.com/blog/first-rail-band
- Natural Curves Boards, “Surfboard Rails” — 信頼度高。完成形の専門的断面定義。  
  https://www.naturalcurvesboards.com/html/designhtml/rails.html
- Andrew W / Instructables — 信頼度中。工程動画として有用だが、寸法はboard固有で普遍則ではない。  
  https://eclectic-workshop.weebly.com/how-to-build-a-surfboard.html  
  https://www.instructables.com/How-to-Make-a-Surfboard/

## 13. 最少CP設計との関係

- rail bandの各facet cornerを最終surfaceの恒久CPにしてはいけない。工程上の近似点であり、完成時には消える。
- 最終断面の意味CPはdeck join、apex、tuck/edge、bottom joinを基本にする。soft curveではapexをconstraintとしてvirtual controlにできる。
- hard edgeとtuck終点は物理的featureなので残す。特にtail末端でedge CPを消すとrelease形状を制御不能にする。
- band guideは最終Bezier/NURBSから派生生成し、ユーザーが必要な場合だけmanufacturing overlayとして編集する。

