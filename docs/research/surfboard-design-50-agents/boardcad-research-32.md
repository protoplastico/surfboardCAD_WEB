# 長板・ミッドレングス特有設計調査

調査日: 2026-08-12

## 0. 分類上の前提

- `longboard`は概ね9 ft以上という競技/市場分類だが、log、noserider、performance longboard、gliderは目的とshape systemが異なる。
- `midlength`は短板とlongboardの間の広いumbrella（概ね6'8–8'台）。`egg`は長さでなくround nose/tail・full middleのoutline archetypeで、midlengthに多い。
- 単一feature（nose concaveや50/50 rail）だけで分類しない。outline、bottom、rail、rocker、foil、weight、finのsystem。

## 1. Traditional log

- 9 ft台、full outline/round nose、比較的wide tail、厚みとweightを持ちglide/trim/cross-stepを重視。
- low/relaxed entry〜middle rockerでpaddle/glide、tailに必要なkick。soft round 50/50前後のrail、no/crisp edge少なめ、single fin。
- bottomはnose concave（必須ではない）→flat/roll/belly→rolled vee/tail。heavy glass/wood stringerのinertiaもfeelの一部。
- `log=beginner longboard`ではない。pivot turn/cross-step/trimには専用技術。

## 2. Noserider

### Nose concave

- wide/full nose下面を局所的に凹ませ、nose上でのplaning lift/holdを狙う。deep single concaveをtipからblendしmiddleのflat/bellyへfade。
- concave単独でnose rideを保証しない。tail rocker/area、rail attachment、fin、wave pocket positioningが協働。
- 深すぎ/急なexitはpaddling/trim drag、track/catchを生むためsmooth blend。

### Tail / rocker

- wide square/squash/rounded tailやfull hipはtailに水圧/leverageを得て、surferがnoseへ移動時にaftをanchor。
- accelerated tail rocker/kickはtailをwaveへsettleさせ、drag/suctionを意図的に増してpocketに留める。pivot/drop-knee turnも助ける。
- nose entryは低めでglide/planing areaを保つ例が多いが、pearling回避はoutline/concave/technique込み。

### Rail / fin

- soft/full 50/50または60/40 no-edgeはflowをwrapしwave faceへrailをengage、trim/hold。high top speedよりcontrol/attachment。
- large single pivot finがtailをanchorしyaw stability。fin area/positionとtail widthをセット。
- `deep nose concave = lift`, `tail kick = tail down`, `50/50 = face hold`は専門メーカーに共通する設計説明だが定量実験で孤立検証された法則ではない。

## 3. Rolled bottom / belly

- convex rail-to-rail断面。水中へsettleし、rail engagement/transitionをsmoothにしてgliding arc、chop cleaving、directional control。
- rolled veeはtail側のvee panelを丸め、hard bankでなくsoaring turn。classic log/noseriderのtailに適合。
- low speedではdisplacement/drag、十分なspeedではcenter peak上でwetted areaを減らすhull theory。常にfastではない。
- 50/50 railと自然に連続するが、modern midlengthではround neutral entryからtucked/hard tailへ変える。

## 4. 50/50 rail

- apexが厚み中央、上下curveが概ね対称、明瞭bottom edgeなし。classic logの代表。
- water wrap/dragでrailをfaceへsetしtrim stability。high speed clean releaseは少ない。
- longboard全てが50/50ではない。performance longboardはlow/down rail＋hard tail edge、midlength/eggはshortboard由来のlower crowned/boxy profile＋tuckを使うことが多い。

## 5. Glider

- 通常10–12 ft、長く比較的narrow/gun-like outline、low rocker、single finでpaddle/trim/down-line glideを最優先。noserider/logと同義ではない。
- narrow point/round nose-tailまたはpintail、centered/forward wide point、長いeffective rail。soft point wavesで早くcatchしflat sectionを接続。
- bottomはcontinuous belly/roll、またはsmooth roll-flat-vee等。concave無しのhull系も多い。
- full 50/50/foiled traditional rails、single fin、drawn-out arc。尾部release/tail rockerを足しturnabilityを残すモデルもある。
- length/inertiaがengineだが、wide/heavyにするだけではgliderにならない。Waldenはslim/sleek、gun-like nose/tail、flat rockerを特徴として説明。

## 6. Egg / midlength

- egg: round/round-point nose、full middle、round/round-pin tailの連続oval outline。wide point center〜forward、low/continuous rockerが典型だがvariant多数。
- midlength railはNatural Curvesによればmodern shortboard由来: nose/entry/wide pointでround neutral、aftでtucked edgeを発達、fin/tailでmoderately hard。classic 50/50 logと区別。
- bottomはroll/flat entry→flat/single/double→vee、またはhull belly。目的により相反するため`egg bottom`固定presetは不可。
- finはsingle（long flowing arc）、2+1（single feel＋side control）、twin（speed/loose）、Bonzer（専用concave+runners）、thruster等。
- longboardよりduck dive/turn、shortboardよりpaddle/glide/stabilityの中間だが、thin knifey railのadvanced eggもあり初心者用minimalと同義でない。

## 7. Performance longboardとの差

- narrower nose/tail、more continuous rocker、thin/lower rails、hard tail edge、lighter construction、2+1/thrusterでtop-to-bottom turn。
- noseriderはwide nose/tail area、tail kick、soft 50/50、large single、weight/inertiaでtip time/trim。
- 同じ9'0でも別設計。lengthとlitersだけで分類不可。

## 8. Fin system

- **single:** log/glider/eggのtrim、clean flow、long arc。large upright pivotはnoserider anchor、raked flex finはturn/flow、glider finはboard/tailに合わせる。
- **2+1:** large center＋small side bites。modern longboard/midlengthでcontrol/versatility。
- **thruster:** performance longboardのpivot/vertical turn。
- **twin:** modern midlengthのspeed/rail-to-rail。wide tail/low rockerと連動。
- fin boxが複数あってもshapeのintended setup/positionが違うため自由互換ではない。

## 9. CAD archetypeパラメータ

```text
boardClass: log|noserider|performance_longboard|glider|midlength|egg
intent: trim|tip_time|glide|carve|versatile
noseConcave: start/end/maxDepth/width/blend
bottomSequence[]: belly|roll|flat|concave|double|vee
railStations[]: apex/volume/tuck/edge
rocker: entry/center/tailKickStart/tip
outline: noseWidth12/widePoint/tailWidth12/effectiveRail
construction: mass/laminate/stringer
finSystem/position
```

- archetypeは連動parameter bundleで、feature checkbox集合にしない。
- nose concave trough/stringer/rail rockerを別plot。
- tail rocker＋tail area＋fin anchorをnoseride balance groupとして表示。
- gliderはoverall lengthだけでなくslenderness、effective rail、mass/inertiaを表示。

## 10. 画像・専門出典

1. Natural Curves – Rails  
   https://www.naturalcurvesboards.com/html/designhtml/rails.html  
   classic longboard 50/50、midlength/egg lower crowned+tucked transition断面。
2. Greenlight Bottom Contour Guide  
   https://greenlightsurfsupply.com/pages/surfboard-bottom-contour-design-greenlight-surfboard-design-guide  
   belly、rolled vee、nose concave、50/50との流体図。
3. Greenlight Rail Design Guide  
   https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide  
   classic noserider 50/50断面とwater wrap。
4. Big Carl Noserider  
   https://bigcarlsurfboards.com/models/noserider  
   50/50、blended nose concave、accelerated tail rockerの実board画像とshaper説明。
5. Harbour Surfboards – Design + Construction  
   https://www.harboursurfboards.com/surfboard-construction  
   longboard outline/rocker/foil/nose concave/railの老舗shaper解説。
6. 1974 Surfboards Noserider  
   https://1974surfboards.com/en/surfboards/noserider/  
   deep nose single→middle flat→tail belly、soft 60/40/chineの写真とspec。
7. Walden Glider  
   https://www.waldensurfboards.com/products/100-glider-25302  
   10–12ft、narrow gun-like、flat rocker、single finの専門メーカー実例写真。
8. Lundquist Dutchman Glider  
   https://lundquistsurfboards.com/models/dutchman  
   belly/50-50/low entry/high exit/single finをzone別に示すcontour diagram。
9. Natural Curves Surfboard Classes  
   https://www.naturalcurvesboards.com/html/designhtml/surfboardclassesmodelslong.html  
   glider/longboard/retro等のclass比較。
10. Surfer – Bonzer Egg review  
   https://www.surfer.com/gear/surfboard-review-the-bonzer-egg  
   round nose/tail egg、thin knifey rail、2+1とのfeel比較写真。二次資料。

## 11. 誤解防止

1. longboard=noserider=logにしない。
2. gliderを単に長くwideなlogにしない。
3. midlength=初心者mini-malにしない。
4. eggをlength categoryにしない。
5. nose concave単独でnoseriding性能を判定しない。
6. 50/50を全長板へ強制しない。
7. 低rocker/高tail kickなど一見矛盾する局所曲率を1個のrocker値へ潰さない。
8. weight/constructionを無視してtraditional log feelをgeometryだけで再現したとしない。

