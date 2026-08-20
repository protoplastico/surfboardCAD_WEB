# サーフボード用語の地域差・メーカー差調査

調査日: 2026-08-12

## 0. 結論

- surfboard用語の多くは規格でなくshaper文化の記述語。地域差よりも年代・メーカー・個人差が大きく、同じ語が別幾何、別語が同幾何を指す。
- UIでは`canonical geometry ID`、表示名、aliases、定量定義、図、source/brand、confidenceを分離。aliasだけで自動変換しない。
- 性能語（fast/drive/hold/release/loose）を形状定義に混ぜない。性能は組合せ・条件依存。

## 1. Tail用語

|canonical|別名/揺れ|曖昧性・UI定義|
|---|---|---|
|square|chop|直線pod＋鋭い左右corner。`chop`はBoardcave用例。|
|rounded square|round square, soft square|直線podを残しcorner radius増。squashと同義扱いするメーカーあり。|
|squash|rounded square（広義）, round squash|Greenlightではpodが浅い凸弧、rounded-squareはflat pod。UIでpod curvature表示。|
|round|full round, thumb（広義）|幅広い連続凸弧。メーカーによりthumbをround-pin寄りに使う。tip radius/pull-in開始で定義。|
|thumb|thumbtail|Greenlightはfull round同義、Natural Curves系はsquashとround pinのblend。曖昧aliasとして警告。|
|round pin|rounded pin, roundtail（商品名）|前からpulled-inしsoft point。単なるroundと区別。|
|pin|pintail, true pin|single sharp point。市場でround-pinをpinと略すことあり。|
|swallow|swallowtail, split tail|中央V/notch＋外2tips。|
|fish tail|deep swallow|board category`fish`とtail shapeを分離。Degree33等はswallow/fishを互換使用。|
|baby swallow|mini swallow|浅いnotch。depth/spacing連続値。|
|diamond|—|square cornersをcutしcenter凸tip。bat/rocketと混同例。|
|bat|star|中央凸tip＋左右2凹lobes。bodyboardのbat tailとは別。|
|crescent|moon, half-moon|中央を円弧状に一つcut。V-notch swallowと区別。|
|wing|winger, bump, hip|tail end shapeでなくrail outlineのstep/curve break。`bump squash`等modifier。|

## 2. Nose用語

- `point / pointed / pulled-in`: tip topologyとfullness。`gun nose`は独立形でなく長いpulled-in point preset。
- `round / full round`: roundはtip arc、fullは前方面積を保持する程度。互換使用あり。
- `round point / rounded point / pointed round`: roundとpointのhybrid。語順差。
- `wide / full`: topologyでなくnoseWidth12/areaの修飾語。
- `blunt / snub / chopped`: cut-off tip。ブランドによりblunt=angular、snub=roundedの差を付けるが普遍的でない。
- `diamond nose`: Tomo系angular blunt variant。
- `pickle fork / swallow nose`: center notch＋2tips。tail swallowとは向きが逆だがtopology同系。
- `nose`範囲はfront 12 inとする解説とfront thirdとする解説がある。UIは`nose section`と`width@12in`を分離。

## 3. Rail用語

- `50/50, 60/40, 80/20`: surfboardでは通常apex上下curve配分。bodyboardのrail/chine比と混ぜない。60/40の数える方向を図で表示。
- `down rail / turned down / low apex`: 50/50よりapexがbottom側。俗に80/20だけをdownと呼ぶ例。
- `up rail / turned up / 40/60`: apexがdeck側。nose rockerのupturnと別。
- `full / boxy / forgiving`: high-volume round profile。boxyは四角いhard railを意味しない。
- `egg / eggy`: oval volume profile。board category Eggと別。
- `pinched / knifey / knife`: low-volume lens profile。hard edgeと別。
- `soft / hard`: rail全体の丸さに使う人とbottom edge radiusに使う人がいる。UIは`profile roundness`と`edge hardness`へ分割。
- `tucked edge / tucked-under edge / tucked rail`: apexより内側にbottom edge。hard/soft双方可。
- `chine / bevel`: rail-bottom間の追加面。channelと別。
- `rail foil`: nose-tail rail volume flow。fin foilと混同しない。

## 4. Bottom用語

- `flat`: rail-to-rail flat。rockerがあるため3Dで完全平面ではない。
- `concave`: centerがrail bottomよりdeck側。`single`, `double`, `single-to-double`, `double barrel`。
- `vee / V`: center stringerが低いconvex ridge。英語圏ではVより`vee`表記が一般。
- `panel vee`:左右flat panels。`rolled vee`: panels convex/soft。`concave vee / vee double`: vee panels内にdouble concaves。
- `reverse vee`: 最も曖昧。Greenlightではmid/frontでpeakしtailへflat、Natural Curvesではnose/entry vee→aft shallow/flat/concave。単に“逆向きvee”と誤読させない。
- `spiral vee`: Greenlightではwide pointからtailへdeepening/accelerating vee。別shaperがdifferent progressionへ使う可能性。
- `belly / roll / rolled bottom / hull`: convex family。rollはdeck crownやboardのroll motionも意味。
- `displacement hull`: surfboardではconvex/bellyの文化的呼称で、船舶工学の完全非planing分類を厳密には意味しない。
- `channels`: wedge grooves。concaveやchineと別。
- `Bonzer bottom`: single-to-deep-double concave＋side runnersのsystem。単なるdouble concave aliasでない。

## 5. Rocker / foil用語

- `rocker`: bottom/stringer curveを指す狭義とdeck/railを含む総称。
- `nose rocker / entry rocker / flip / scoop`: front curve。`flip`はtip近くの急kickを指すことが多いが混用。
- `tail rocker / exit rocker / tail kick / lift`: aft curve。フランス語圏では`lift`をtail curveに使う例。英語のhydrodynamic liftと混同。
- `relaxed / low / flat rocker`: 相対語。tip riseだけでなくcurve distributionが必要。
- `heavy / full / continuous rocker`: heavyは量、continuousはcurve style。別軸。
- `staged / three-stage / flat spot + kick`: piecewise curve。ただし数学的cornerを意味しない。
- `natural rocker`: blank成形時。finished rockerと別。
- `foil / thickness flow / profile`: foam thickness/volume distribution。hydrofoil/fin foilと混同。
- `deck rocker + bottom rocker gap`: primary foil。`rail foil`は横/長手rail thickness。

## 6. Edge / flow用語

- `edge`: bottom-rail release corner。outline edge/rail全体と混同。
- `hard edge / crisp edge / sharp edge`: small radius。material上の危険な刃を意味せず有限radius。
- `soft edge / rounded edge`: large radius。soft-top materialのsoftと別。
- `release`: water separation、tail outline release point、turn release feelの3用法。
- `hold / bite / grip / traction`: lateral resistanceの感覚語。fin/rail/tailのどれ由来か明記。
- `drive / projection`: surfer入力後のspeed maintenance/加速感。測定定義なし。
- `suction`: Coanda/attached-flow dragの感覚表現で真空吸着ではない。
- `planing`を`planning`と綴る誤用が専門サイトにもある。canonicalはplaning。
- `toe / tow-in`: finではtoe-inが正しい。tow-inは牽引surfing、ただしtypo多い。
- `cant / camber / splay`: fin outward angle。camberはfoil curvatureにも使うのでcant推奨。

## 7. 寸法語の差

- `pod / tail block`: tail最終幅。podをtail area全体に使う人もいる。
- `nose/tail width`: 通常tipから12 in station。`nose`自体の範囲は曖昧。
- `center width`と`max width/wide point`:一致しない。古いdimension stringはnose12–max–tail12の3幅の場合。
- `length`: deck tape/straight chord/bottom arcの差。datumを保存。
- `volume`: core CAD、finished outer、water displacementの状態差。

## 8. UI辞書schema

```json
{
  "id":"tail.rounded_square",
  "preferredLabel":{"en":"Rounded square","ja":"ラウンド・スクエア"},
  "aliases":[{"term":"squash","scope":"some brands","ambiguity":"high"}],
  "geometry":{"pod":"straight","cornerRadius":">0","notch":false},
  "notSameAs":["tail.squash","tail.round"],
  "parameters":["podWidth","cornerRadius","podBulge"],
  "diagramUrl":"...",
  "sourceUrls":[],
  "definitionVersion":"1.0"
}
```

- 検索はalias対応、保存はcanonical ID＋parameters。
- alias選択時「この名称はメーカーによりX/Yを指す」とdiagram比較。
- importerはsource brand/glossary versionを記録し、曖昧語をuserへmapping確認。
- performance claimは別panelでcondition/confidence/sourceを表示。

## 9. 推奨canonical UI

- shape名の横に小断面/outline iconと定量preview。
- railは`Apex 60/40 | Volume full | Tuck 8mm | Edge R2mm`のように複合表示。
- bottomはlongitudinal sequence `nose roll → mid flat → tail panel vee`。
- rockerは`entry/center/exit`数値＋curve plot。
- `Expert aliases`を折畳み、初学者画面に曖昧語をprimaryにしない。

## 10. 画像・専門出典

1. Greenlight Tail Design  
   https://greenlightsurfsupply.com/pages/surfboard-tail-design-greenlight-surfboard-design-guide  
   round/square/squash、pin/round/round-pin、bat/swallow/moon/diamond統一図。
2. Greenlight Rail Design  
   https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide  
   50/50/60/40、egg/pinched/knife、tuck/edge図と用語定義。
3. Greenlight Bottom Contours  
   https://greenlightsurfsupply.com/pages/surfboard-bottom-contour-design-greenlight-surfboard-design-guide  
   vee variation名の歴史的/地域的混乱を明記し全形状図。
4. Natural Curves Bottoms  
   https://www.naturalcurvesboards.com/html/designhtml/bottoms.html  
   reverse vee等の別の体系的定義と図。
5. D'Arcy / Natural Curves Surfboard Anatomy  
   https://darcysurfboards.com/pages/surfboard-anatomy  
   rocker/foil/thumbtail等のshaper journal由来定義。
6. SurferToday Shaping Glossary  
   https://www.surfertoday.com/surfing/the-glossary-of-surfboard-shaping-terms  
   広範囲な英語圏用語と写真。二次資料、曖昧/誤簡略化例も含む。
7. Surf360 Shaper Glossary  
   https://www.surf-360.com/resources/surfboard-shaper-glossary  
   現代市場で使う用語一覧。canonical候補の補助。
8. Harbour Tail Shapes  
   https://www.harboursurfboards.com/design-2-1  
   老舗メーカー独自のdiamond/square/pin/swallow/squash説明・写真。

## 11. 誤変換防止

1. thumbを無条件でroundに変換しない。
2. rounded squareとsquashをparameterなしで統合しない。
3. fishをtailとboard typeで同一IDにしない。
4. wingをtail topologyにしない。
5. soft railをvolumeとedge hardnessの単一値にしない。
6. reverse/spiral veeを名前だけでgeometry生成しない。
7. liftをtail rockerとhydrodynamic forceで同じfieldにしない。
8. foilをboard thickness、fin foil、hydrofoilでnamespace分離。

