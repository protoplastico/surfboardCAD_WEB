# BoardCAD サーフボード設計調査：最終統合前サマリー

作成日: 2026-08-12  
対象: `/tmp/boardcad-research-01.md`〜`47.md`、`49.md`（`48.md`は作成時点で存在しない）

## 1. 統合結論

BoardCADで保存上の真実にすべきものは、`squash`、`70/30`、`single-to-double`等の名称ではなく、**datum・単位・実寸を伴う幾何、明示的なtopology、長手方向に変化するfeature parameters**である。名称は検索、preset、互換表示に限定する。

形状性能は単一detailから決まらない。tail、nose、outline、rocker、rail、edge、bottom、foil、fin、rider、速度、波面が相互作用する。したがって性能UIは「速い／holdする」と断定せず、条件付き傾向、trade-off、evidence grade、confidenceを表示する。

曲線生成は少ないsemantic control pointを基本とし、通常のsection joinはG1必須、fairな連続領域はG2を目標にする。ただしsquare corner、swallow notch、wing、channel、hard release edge等の**意図的feature lineは丸めず保持**する。tail/nose末端CPは、tip radius、pod幅、notch、中央tipを制御するため残す。

## 2. 最重要の正しい定義

| Detail | 正しい設計単位 | 避ける解釈 |
|---|---|---|
| Outline | 長手位置ごとのhalf-width、wide point、面積、曲率分布、hip/wing等のfeature | 名前ごとに別の自由曲線を大量CPで作る |
| Tail | `solid / notched / multi-tip` topology、tail幅/面積、pod幅、corner/tip radius、notch深さ、tip間隔、hip/wing | tail名だけからhold、speed、turnを決める |
| Nose | nose幅@6/12/18/24in、面積/fullness、tip radius/block幅、pull-in開始、entry shoulder | tail builderの前後反転、`wide`をtip topologyにする |
| Rail | rail volume/fullness、apex landmark、deck/bottom curvature、tuck inset/height、外周radius | 50/50等の名称や最大幅knotだけを幾何truthにする |
| Edge | radius、included angle、位置、tuck、release path、長手fade | `soft/tucked/hard/release`を排他的な同一軸にする |
| Bottom | rocker基底に対するsigned横断変位＋長手envelope。flat/concave/vee/convex/channel/chineを幾何で定義 | `flat`を3D平面とする、名称別featureを無条件加算する |
| Rocker | datum付きbottom stringer curve、rail rocker、station height、low point、曲率分布 | nose/tailの端点値だけ、または曖昧な`apex shift`で表す |
| Foil/deck | thickness distribution、section area/volume distribution、deck contourを分離 | volumeを質量/momentumと同一視する |
| Fin | foil、area、aspect ratio、sweep、toe、cant、placement、setupを分離 | fin数や名称だけで性能を決める |
| Station/loft | authored key stationとderived stationを区別し、apex/tuck/chine等のlandmark対応でloft | 異なるknot列をpolyline化して無意味にblendする |
| Finished shape | design intent、machined blank、laminated finished geometry、scanを別revision/stateで管理 | scanや焼付けsplineを作者のintentとみなす |

### 用語上の重要点

- `hip`は通常、rail curveの曲率が強まる領域であり、必ずしも角のオンカーブCPではない。`wing/bump`は意図したoutline breakで別物。
- `soft rail`、`hard release edge`、`tucked-under edge`は同時に存在し得る。outer rail softnessとbottom separation edgeを分離する。
- `flat bottom`は横断方向がflatという意味で、長手方向にはrockerがある。
- `spiral vee`は数学的spiralとは限らず、concave/vee量の長手変化を指す業界語。
- `gun`、`fish`、`groveler`等はboard archetypeであり、tail/nose topologyそのものではない。
- `wide/full`は主に幅・面積・fullnessのmodifierであり、独立topologyではない。

## 3. 現実装で確認された重大な誤解・不具合

### P0: データ損失・選択と結果の不一致

1. **Wide noseがround-pin tailへ写像され、wide/fullとは逆に鋭いtipを生成する。** topology enumから外し、nose width/fullness modifierへ移す。
2. **Square noseはUIで選択・保存できるが生成builderがなく、実質無効。** 専用tip-block builderを実装するまでUIから外す。
3. **旧bottom読込時、feature rangeの45%以上の重なりを検出すると全featureを均等非重複区間へ書き換える。** single→double→vee等の正当な重なりを破壊するため、自動変換を停止する。
4. **bottom featureの追加・複製が既存全featureのrangeを再配置する。** 新規featureだけにdefault rangeを与える。
5. **rail mode/strength、編集前base spline、rocker runtime base、generated station roleが保存されない。** 見た目を焼付けても再編集意味が消え、reload後に結果が変わる。
6. **save/reloadの幾何同値保証がない。** outline/profile/sectionsの最大偏差、曲率差、metadata欠落をrelease gateにする。

### P1: 幾何semantic error

1. tail/noseとrail outlineの接続を意図的に`continuous=false`とし、通常境界までC0 kinkにしている。section joinはG1、通常G2へ修正する。
2. noseをtail builderの反転として実装し、nose独自の幅station、tip radius、fullness、entry shoulderを持たない。
3. Diamondは中央単一tipでなく短いflat block、Starは標準bat/starと異なる多波形。Round pinはpinとtip radiusで区別できない。
4. alias normalizationが`round-squash→rounded-square`等を不可逆に統合し、原語・scope・差を失う。
5. railは最大幅knotをapexと仮定し、全stationへ同じmode/strengthを適用する。apex/fullness/tuck/edgeの長手pathがない。
6. edgeはsoft/tucked/hardを排他的typeにし、releaseをhardへ同義化。radius、angle、位置、fadeを保存しない。
7. edge fadeが線形で境界の勾配が不連続。bottomのrail protectionにもhard spliceがあり、kinkを生む可能性がある。
8. rocker preset適用がsampling再構築で、最少CP・G2・曲率分布を保証しない。deck保持とfoil保持の優先規則も曖昧。
9. section knot数が異なるとpolyline blendされ、apex/tuck/channel boundaryの対応が失われる。

## 4. 統合設計原則

### Geometry core

- canonical内部単位を固定し、座標軸、datum、測定状態、uncertaintyを必須化する。
- topology、実寸parameters、named preset/archetype、aliasを別層にする。
- outlineは片側の少数Bezier区間を基本とし、幅station/area/wide pointをconstraint、CPはcurve fittingの自由度とする。
- tail/nose末端anchorと、notch tip、outer tip、diamond shoulder、wing等のsemantic anchorは残す。section直前の冗長CPは削減する。
- rail断面は通常4〜5 semantic pointsを基準にし、全key stationで同一roleを保つ。apex/tuck/fullness/edge pathsを疎なkey stationで補間する。
- bottomはbase surface＋feature layerとし、cross-section functionとlongitudinal envelopeを分離する。compound featureの重なりを許し、衝突規則を明示する。
- edge/chine/channelはfeature line付きmodifierとし、G1/G2 fadeで出入りさせる。CNC tool radiusとfinished laminate radiusを検証する。
- authored/derived stationを区別し、表示・加工meshの高密度化を編集CP増殖に結び付けない。
- curvature comb、zebra/reflection、self-intersection、fold/Jacobian、最小radius、左右対称、volumeを自動検査する。

### Data / migration

- native schemaはbase geometry、modifier stack、semantic landmarks、units/datum、provenanceを保存する。
- 旧ファイルは`legacy_baked_geometry`として無変更保持し、推定parameterにfield単位confidenceと`needsUserReview`を付ける。
- migrationはpure/versioned functionとし、入力hash、判断理由、loss、geometry diffを記録する。
- BRD互換拡張が保持されない可能性に備え、namespaced sidecar JSONまたはpackage manifestを用いる。
- measured、fitted、inferred intentを別revisionにし、scan fit residualとfeature preservation判断を保存する。

### UI / evidence

- shape cardは正しいview（plan/profile/section/3D）、変化する実寸、固定される量、alias、warningを表示する。
- compareは同じdatum・尺度・viewで行い、単一の「良い/悪い」sliderへ集約しない。
- performance claimは `conditions / outcome / evidenceRefs / limitations / confidence / notForOptimizationConstraint` を持つ。
- evidence grade A/Bは計測・CAD原理・限定研究、Cは複数専門家の経験則、Dは未検証一般論。C/Dを自動最適化constraintにしない。
- 外部画像は原則転載・hotlinkせずcanonical pageへリンクする。open articleでもfigure creditを確認し、alt textは観察可能な形状だけを記述する。

## 5. 優先修正順

1. **破壊停止:** bottom自動再配分と既存range書換えを止める。Square nose無効状態とWide nose誤写像を解消。
2. **baseline:** 現行全presetのJSON、寸法sample、golden imageを固定し、save→reload roundtrip testを追加。
3. **schema v2:** units/datum、base geometry、modifier、rail/runtime base、authored/derived role、legacy payloadを保存。
4. **outline terminal:** nose専用builder、tail topology整理、末端CP保持、rail joinのG1/G2化、tip/pod/notch実寸化。
5. **section core:** rail semantic paths、edge複数軸、bottom feature layers、rocker/deck/foil policyを導入。
6. **loft/manufacturing validation:** landmark対応、fairness、最小radius、tool collision、finished allowanceを検査。
7. **UX/evidence:** shape cards、正しいthumbnail view、alias review、条件付き性能説明、verified galleryを公開。

## 6. 低confidence・未解決事項

- 特定のtail名称がhold、turn radius、speedを決めるという主張。限定CFDではround対squash差が出ない例もあり、tail幅・rocker・rail・finの交絡が大きい。
- concaveは常にlift/speed、veeは常にrail-to-railを軽くする、hard edgeは常にrelease/hold等の単方向主張。速度、trim、bank、深さ、位置で符号が変わり得る。
- fuller nose/rail/volumeが常にpaddling、forgiveness、speedを改善するという一般化。質量、wet area、engagement、rider/wave条件を分離できていない。
- rocker量とperformanceの定量対応。datum、曲線全体、rider stance、wave curvatureが揃ったcontrolled dataが不足。
- rail apexの一意な定義。boxy/chine/plateau断面では最大幅点が複数または不定となり得る。
- `natural/accelerated rocker`、`spiral vee`、`release`、`hardness`等の用語はbrand/地域/時代で揺れる。canonical dimensionを必須にする。
- 材料flex、stringer、laminate scheduleと水上性能の定量モデル。完成寸法へのspringback/laminate影響も工程依存。
- scanからdesign intentを復元する推論。scanは製造偏差、使用変形、測定noiseを含み、作者意図は直接観測できない。
- 画像分類datasetのlabel。完全重複画像の矛盾label、nose未annotation、provenance不足がありground truthとして使えない。
- 外部画像の転載権。到達可能でも多くはlicense不明。open-access候補もfigure単位credit監査が未完了。

## 7. 最終受入基準

- preset名を変えてもcanonical実寸を説明でき、名称なしでも同じ形状を再生成できる。
- 意図した角以外にC0/G1不良がなく、曲率combとsurface検査を通る。
- save→reload→再編集で幾何とsemantic parametersが許容差内に保たれる。
- 旧データを開くだけで形状を変更しない。推定移行はdiffとconfidenceを表示する。
- performance文言は条件と根拠gradeを伴い、低confidence claimが自動設計を拘束しない。
- 製造可能性、finished geometry、provenance、画像licenseまで設計documentから追跡できる。

この順序なら、見た目のpreset追加より先に「設計を壊さず、測れて、再生成できる」核を確立できる。
