# サーフボード設計コア調査

作成日: 2026-08-12  
調査方法: 50担当を逐次バッチ実行し、専門シェイパー資料、CAD公式資料、学術研究、画像資料、既存BoardCAD Web実装を相互検証した。個別報告は `docs/research/surfboard-design-50-agents/` に収録する。

## 結論

BoardCAD Webの形状データで正本にすべきものは、`squash`、`70/30`、`single-to-double`のような市場名ではない。正本は、単位とdatumを伴う実寸、明示的なtopology、長手方向に変化するfeature path、少数の意味を持つcontrol pointである。名称はpreset、検索語、別名表示として扱う。

性能は単独ディテールから決まらない。outline、tail、nose、rocker、rail、edge、bottom、foil、fin、速度、波面、ライダーが相互作用する。そのため「この形状は速い」のような断定を保存データに含めず、条件付き傾向と根拠等級を別レイヤーで管理する。

通常の曲線接続は最低G1、fairな領域ではG2を目標にする。一方、square corner、swallow notch、wing、channel wall、hard release edgeなどの意図的featureは丸めない。tail/nose末端CPはtip radius、pod幅、notch、中央tipを制御する意味CPなので残す。測定stationは原則virtual constraintであり、すべてを編集CPへ変換しない。

## ディテール別の正しい設計単位

| Detail | 正本にする幾何 | 避ける解釈 |
|---|---|---|
| Outline | half-width path、wide point/plateau、面積、曲率分布、hip、wing | 名称ごとに多数CPの別曲線を作る |
| Tail | terminal topology、幅@12in、area、pod/block幅、corner/tip radius、notch深さ、tip間隔 | tail名だけで性能を決める |
| Nose | 幅@6/12/18/24in、前方面積、tip radius/pod、pull-in開始、shoulder | tail生成器の単純反転、`wide`をtopologyにする |
| Rail | apex path、upper/lower fullness、outer radius、tuck、deck/bottom tangency | 50/50等を単なる厚み比にする |
| Edge | boundary role、radius、included angle、tuck、release path、fade | soft/hard/tucked/releaseを一つの排他enumにする |
| Bottom | rocker基底に対するsigned横断変位と長手envelope | flatを3D平面とする、compound featureを排他化する |
| Rocker | datum付きstringer/rail curve、station高さ、low point、曲率分布 | nose/tail端点値だけで曲線を決める |
| Deck/Foil | deck contour、thickness distribution、section-area/volume distribution | max thickness、wide point、浮力中心を同一視する |
| Fin | setupと個別finのfoil/area/AR/rake/toe/cant/placement | 枚数や名称だけで性能を決める |
| Loft | semantic landmarkが対応したkey stationとderived station | knot数不一致をpolyline化して混ぜる |

## Canonical taxonomy

細かな市場名を増やすより、少数topologyと実寸parameterを使う。

- Tail: `solid_block`, `solid_rounded`, `solid_pointed`, `center_notched`, `multi_lobed`
- Nose: `pointed`, `rounded`, `block`
- Rail: `rounded`, `chined`。50/50、60/40、80/20、boxy、knifey、downはparameter bundleのpreset
- Bottom: `planar`, `single_concave`, `double_concave`, `vee`, `convex_hull`, `displacement_hull`, `channel`, `chine`
- Rocker: base curveに`entry_lift`, `tail_kick`, `center_flatten`を適用
- Edge: `outer_rail_radius`, `tucked_under`, `bottom_release`, `tail_block`, `chine_boundary`
- Deck: `planar`, `domed`, `concave`, `step`
- Foil: `thickness_distribution`, `volume_distribution`, `rail_volume_distribution`
- Fin setup: `single`, `twin`, `thruster`, `quad`, `two_plus_one`, `five_box`, `finless`

重要な用語整理:

- `fish`はboard familyでもあり、tail topologyへ自動変換しない。deep/wide swallowはpresetとして表現できる。
- `wing/bump`はtail topologyではなくoutline modifier。
- `wide nose`はtopologyではなく幅・area・fullnessの連続parameter。
- `gun`はboard family/intentであり、nose/tailは通常pointed系parameter bundle。
- `hard`, `down`, `tucked`は別軸。soft outer railとhard bottom releaseは共存できる。
- `spiral vee`は数学的spiralではなく、長手方向にvee/concave構成が変化する曖昧な業界用語。
- `Bonzer`はbottomとfinを含むcompound systemで、単一bottom名称ではない。

## 各形状の要点

### Tail

Square/squash/round/pin等は、終端topologyだけでなくtail width、last-third area、pod/block幅、corner radius、hip位置で区別する。Roundとround pinはpull-in開始、tip幅、tip radiusの連続差であり、単純な別トポロジーとは限らない。Swallowは外側railからrear tipsへ向かう曲線と、中央notch曲線を分ける。末端CPは保持し、通常joinはG1/G2、意図的corner/wingはG0を許容する。

### Nose

12-inch widthはtipからstringer沿い304.8 mm stationで測る全幅である。ただし単独では形状を復元できない。6/12/18/24-inch幅、nose area、tip radius/pod、pull-in開始、shoulderを保存する。Beak noseはplan viewだけでなくprofile/foil要素を含み得る。安全上、完成品で数学的zero-radius tipを既定にしない。

### Rail

Railは少なくともapex、volume/fullness、tuck、outer/release radiusを独立させる。50/50等は断面上下の単純体積比ではない。完成面はdeck tangent→apex→tuck→bottom tangentという4〜5個程度のsemantic landmarkで表現できる。製造用rail bandsは完成曲線の恒久CPではなく、完成断面から派生するconstruction layerとして分離する。

### Bottom

Flatは横断方向の変位がゼロという意味で、長手rockerは残る。Single concave、double concave、veeは重ね合わせ可能で、start/peak/endと滑らかなenvelopeを持つ。Channel/chineは局所patch/feature lineとして管理する。断面を大量追加せず、feature key stationと派生stationを分離し、fade端では値・傾き・可能なら曲率をゼロへ戻す。

### Rocker

測定datumを必ず保存する。同じnose/tail rocker値でも途中の曲率分布は異なる。bottom stringer、rail rocker、deck curveを分離し、continuous/staged/acceleratedは曲線から導出するtagに留める。少数のclamped B-spline/piecewise Bezierと曲率combでfairnessを管理する。

### Edge

Edgeは3D path、隣接surface、radius、included angle、tuck量、長手fadeで定義する。Hardnessは物理半径から導出できる表示parameterとする。release boundaryの意図的な非連続は保持し、通常rail面の接続kinkとは区別する。

## 性能主張の扱い

根拠等級は次のように管理する。

- A: 実験またはfield measurement
- B: CFDまたは一般物理に基づく限定的推論
- C: 複数の専門家・シェイパーに共通する経験則
- D: 単一商業資料、比喩、検証不足
- X: 用語誤用または過剰な因果断定

Geometryはtruthとして保存できるが、性能は原則claimとして条件を伴わせる。特にround tail、hard rail、vee、concave、rocker、full volumeの効果は、速度、迎角、rail engagement、他要素により変わる。単一scoreをgeometryへ埋め込まない。

## 現実装で確認された主な不一致

コードはこの調査では変更していない。

### P0: データ保全

1. rail mode/strengthと編集前base splineがBRDへ完全には永続化されず、再読込後の非破壊再編集が保証されない。
2. 旧bottom feature読込時、正当なoverlapを持つcompound feature範囲が自動再配分される可能性がある。
3. runtime baseおよびgenerated section metadataが保存で失われ、派生sectionがauthored section化する。
4. rocker再適用時、読込後の加工済み曲線が新しいbaseになる危険がある。

### P1: 意味・幾何

1. Square noseはUI上選択できるが生成経路が対応していない。
2. Wide noseがmodifierではなくenumとして扱われ、pointed系へ誤写像される。
3. Diamond tailの中央tipがflat blockになるparameter設定がある。
4. Star tailは一般的bat/starと異なる多重波形になっている。
5. tail/nose joinを常にC0へ落としており、通常のfair join要件と矛盾する。
6. Edgeがsoft/tucked/hardの排他enumで、releaseをhardへ同義化している。
7. Railが最大幅knot周辺のheuristic中心で、apex/fullness/tuck/radius pathを正本にしていない。
8. Bottom featureが編集CP・sectionを増殖させ、少数semantic CP方針と衝突する。

既存`tail-classification`は333件中exact duplicateが多数あり、非空ラベル同士にも矛盾がある。`nose-classification`は333件すべて未ラベルである。出典、作者、license、hash、annotator、confidenceも不足し、現状はground truthやpreset学習へ使用できない。

## 推奨実装順

1. 保存・再読込で形状が変わる問題を先に止め、golden roundtrip testを追加する。
2. schema v2を導入し、単位/datum/base geometry/modifier stack/semantic landmarkを保存する。
3. legacy shapeは推定presetへ強制変換せず、`legacy_baked_surface`として保持する。
4. tail/nose taxonomyと通常join G1/G2を修正し、末端feature CPを保持する。
5. edgeをouter radius、tuck、releaseへ分解する。
6. railを長手semantic pathsとlandmark対応loftへ移行する。
7. bottomを解析feature＋滑らかなenvelope＋derived stationへ移行する。
8. rockerをdatum付きbase curve＋modifier＋fairness validationへ移行する。
9. UIに固定view thumbnail、短い定義、実寸parameter、曖昧alias警告、根拠等級を表示する。

## 画像資料

外部画像は著作権上、原則転載・hotlinkせず、掲載ページへのリンクとして扱う。JSONには22件の到達確認済みgalleryを収録した。代表例:

- [Greenlight Tail Design Guide](https://greenlightsurfsupply.com/pages/surfboard-tail-design-greenlight-surfboard-design-guide) — tail形状と測定、plan view
- [Greenlight Rail Design Guide](https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide) — rail断面比較
- [Greenlight Bottom Contour Guide](https://greenlightsurfsupply.com/pages/surfboard-bottom-contour-design-greenlight-surfboard-design-guide) — bottom横断面
- [Natural Curves Rails](https://www.naturalcurvesboards.com/html/designhtml/rails.html) — nose-to-tail rail section series
- [Natural Curves Bottoms](https://naturalcurvesboards.com/html/designhtml/bottoms.html) — board family別bottom sections
- [OpenShaper Surfboard Design Guide](https://openshaper.com/surfboard-design-guide) — plan/profile/section/3D CAD views
- [Shape3d Manual](https://www.shape3d.com/Support/User_Manual_V9.htm) — CAD/CAMとCNC
- [Surf Hydrodynamics Tail Shapes](https://www.surfhydrodynamics.com/en/Tail_shape_surf.html) — tail比較図
- [Applied Sciences: quad fin CFD](https://www.mdpi.com/2076-3417/10/3/816) — fin配置とCFD
- [Scientific Reports: instrumented fin](https://www.nature.com/articles/s41598-025-94834-0/figures/1) — 実走圧力測定装置

商用・専門サイトの画像は閲覧可能でも再利用許諾を意味しない。アプリ内thumbnailは独自作図または明示許諾素材を使う。

## 検証基準

- standard measurementとdatumをunit test化する。
- 意図的corner以外はG1必須、fair領域はG2と曲率combを検査する。
- negative thickness、self-intersection、surface fold、channel/chine boundary crossingを禁止する。
- parameter変更のmonotonicityをproperty testで検証する。
- golden imageは固定orthographic viewで作るが、analytic geometry testを主判定にする。
- save→reload→saveでgeometry、semantic data、units/datumが保存されることを確認する。
- scan/as-machined/laminated/finished/design-intentを別stateとして比較する。

## 調査資料

個別50報告には、分類、幾何、性能、CAD、実装監査、画像、科学的根拠、bibliography、taxonomy、UI、test、migrationを収録している。特に参照価値が高いもの:

- `01–06`: tail/nose分類・CAD・性能
- `08–11`: rail分類・性能・工程・CAD
- `12–14`: bottom分類・性能・CAD
- `15–17`: rocker測定・性能・CAD
- `18–20`: edge分類・性能・CAD
- `25`, `28`: loft品質、fairness、少数CP
- `37`, `38`, `42`: 現実装・分類データ監査
- `39`: 科学的根拠監査
- `41`, `49`: 画像リンク監査・利用方針
- `45`: 修正ロードマップ
- `46`: 195件の重複排除bibliography
- `48`: canonical taxonomy

