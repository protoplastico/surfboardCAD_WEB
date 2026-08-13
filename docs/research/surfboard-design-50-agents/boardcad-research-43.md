# BoardCAD UI/UX用「形状説明」仕様

## 1. 目的と原則

各detailの選択肢を、名前だけでなく「どこを、どの視点で、どの実寸値によって変えるか」が即座に理解できるUIへ統一する。調査01..42の結論に基づき、preset名は開始点、canonical geometry parametersを保存上の真実とする。

原則:

1. **同じ視点・同じ縮尺で比較する。** 選択肢ごとに見栄えのよい角度へ変えない。
2. **性能ではなく形状を先に説明する。** 「速い」「holdする」は条件付きclaimとして別欄に置く。
3. **排他的でない形状を排他的radioにしない。** single+double+vee、soft rail+tuck+release等はlayerとして併用可能。
4. **名称とresolved parametersを分ける。** 70/30、squash、fish等を選んでも実寸値を表示する。
5. **少数CPを守る。** UIは意味parameterを操作し、派生mesh/sectionの大量CPをユーザーへ露出しない。
6. **曖昧aliasを自動確定しない。** 候補形状を図で比較し、source/brand scopeを表示する。

## 2. 共通「形状カード」仕様

各preset/featureカードは次を必須とする。

```json
{
  "canonicalId": "tail.round_pin",
  "label": "ラウンドピン",
  "thumbnailSpec": {
    "primaryView": "plan_tail",
    "secondaryViews": ["plan_full", "tail_3q"],
    "crop": { "fromTailRatio": 0, "toTailRatio": 0.3 },
    "overlay": ["centerline", "12in_station", "tip_radius", "hip"]
  },
  "definition": "幅を連続的に絞り、丸い終端で閉じるテール。",
  "parameters": ["tailWidth12", "tipWidth", "tipRadius", "hipX", "hipAmount"],
  "comparisonAxes": ["tip_width", "curvature_continuity", "hip_amount"],
  "warnings": ["名称だけではtip幅やhip位置は決まりません。"],
  "aliases": [],
  "claims": [],
  "advancedControlGroup": "tail_geometry"
}
```

カード表示順:

- canonical名 + 小さな状態tag（Preset / Custom / Migrated / Ambiguous）
- primary thumbnail
- 1文定義（最大45日本語文字程度）
- 主要3値（単位付き）
- 条件付き性能説明は「一般的傾向」accordion内
- 警告icon（用語曖昧、加工半径、連続性、移行推定）

Hoverだけに情報を置かない。keyboard focus、touch、screen readerで同内容へ到達可能にする。色だけでconcave/convexや左右を区別せず、線種・矢印・符号を併用する。

## 3. Thumbnail描画の共通規約

- orthographic projection。perspectiveは補助3/4 viewだけ。
- board orientationを固定: planはtail左/nose右、sectionはcenterline左/rail右、profileはtail左/nose右。画面設定で反転してもカード内legendを表示。
- 選択肢間のcrop/scale/baselineを固定。形状差を誇張しない。
- base形状を薄灰、変更後を実線、差分領域を半透明。selected feature以外は低彩度。
- concaveはbottom側への変位矢印、vee/convexは逆方向矢印を付す。`+/-`だけに依存しない。
- dimension lineはmm、表示設定に応じinch併記。12/18/24in stationはdatum起点をラベル化。
- hard edge/wing/chine等の不連続点は角marker、G1/G2 joinはtangent/curvature glyphで示す。
- 画像資料を使う場合は出典・license・「模式図/実物写真/校正済みscan」を表示。寸法校正されていない写真をparameter previewに使わない。

## 4. Detail別仕様

### 4.1 Outline全体

- **Primary thumbnail:** full plan、左右半幅、centerline、wide point、nose/tail 12/18/24in station。
- **短い定義:** 「上面視で見た外周曲線。幅の分布とrail-line曲率を決めます。」
- **主要parameter:** length、max width、wide-point x、width at 12/18/24in、parallel-zone length、hip x/amount、left/right symmetry。
- **比較軸:** wide point forward↔back、parallel↔curved、hip smooth↔abrupt、nose/tail width、effective rail-line length。
- **警告:** 同じ最大幅でも分布は異なる。12in幅はnose/tailのどのdatumから測るか明示。性能をoutline単独で断定しない。
- **Advanced:** 左右独立curve、curvature comb、G2 constraint、局所width station、CP削減/fairing tolerance。

### 4.2 Tail

- **Primary:** tail plan crop（後方30%）、secondaryにfull planとrear 3/4。swallow/batは左右tipとcenter notchを明示。
- **短い定義:** 「最後部のoutline終端。tip/block、hip、cutoutを実寸で定義します。」
- **主要parameter:** tail width 12/18/24in、tail block/tip width、tip/corner radius、hip x/amount、notch depth/width、wing step、join continuity。
- **比較軸:** wide↔narrow、square↔rounded↔pointed、continuous↔hipped、solid block↔split/notched。
- **警告:** round/squash/thumb等はsourceにより境界が異なる。fishはboard familyでありtail寸法を一意に決めない。notch datumとrear-tip datumを混同しない。
- **Advanced:** terminal segment CP、left/right tip、inner cut curve、corner radii、G1/G2、tail join station。末端CPは常時表示可能、接続前CPは自動fairing既定。
- **Preset thumbnail overlays:** square=block幅/角R、round-pin=tip R/収束、swallow=tip間隔/notch深さ、diamond=中央tip/左右corner、bat=中央tipと2 cutaway。

### 4.3 Nose

- **Primary:** nose plan crop（前方30%）、secondaryにfull planとnose 3/4。
- **定義:** 「前端へ向かうoutline。tip/podとentry rail curvatureを実寸で定義します。」
- **主要parameter:** nose width 12/18/24in、tip/pod width、tip radius、wide pointとの関係、entry join x、curvature。
- **比較軸:** pointed↔round↔square、narrow↔wide、continuous entry↔shoulder、pod width。
- **警告:** pointedでも数学的zero-radiusとは限らない。加工可能最小radiusを守る。名称だけで12in幅は決まらない。
- **Advanced:** endpoint tangent、tip radius/pod、join G2、左右非対称、CP fairing。末端CPを保持し、不要な接続前CPは自動化。

### 4.4 Rail

- **Primary:** canonical cross-section（centerline左、rail右）。secondaryにnose/mid/tailの3断面とapex-path side view。
- **定義:** 「deckからbottomへつながる外周断面。apex位置、fullness、tuck、半径で定義します。」
- **主要parameter:** apex height ratio/inset、deck fullness、bottom fullness、outer radius、tuck inset/height、deck/bottom tangency。
- **比較軸:** apex high↔low、full↔pinched、round↔small radius、up↔down、nose↔tail変化。
- **警告:** 50/50・70/30は厳密規格でなくpreset。`down rail`とhard releaseは同義でない。chineは別feature。
- **Advanced:** sparse station paths、各station resolved section、G1/G2 tangency、volume/area、left/right、minimum radius。
- **UI:** 50/50等を選ぶと値を生成し、「解決値: apex 46%, tuck 5.2mm」のように表示。名称変更ではなく値変更をCustom badgeで示す。

### 4.5 Bottom contour

- **Primary:** cross-section。secondaryにlongitudinal envelope stripとbottom heatmap/contour map。
- **定義:** 「bottom基底面に重ねる横断方向の凹凸。長手方向の開始・最大・終了を持ちます。」
- **主要parameter:** type、start/peak/end x、depth mm、width ratio、center/rail depth、lobe offset、channel count/width/spacing、fade continuity。
- **比較軸:** concave↔flat↔convex、center↔rail bias、narrow↔wide、shallow↔deep、early↔late、single↔multiple lobes。
- **警告:** single/double/veeは重ね合わせ可能。追加時に既存rangeを動かさない。深さの符号をUIで明示。rail lockにkinkを作らない。
- **Advanced:** feature layer list、composition mode/order、lateral power、independent envelopes、channel paths、chine boundaries、G2 fade、cross-section graph。
- **Layer UI:** timeline上でfeature barsを重ねて表示し、重複をエラー扱いしない。solo/mute/reorder/difference previewを提供。

### 4.6 Rocker

- **Primary:** bottom/deck side profileを同一datumで表示。secondaryにnose/tail station valuesとcurvature comb。
- **定義:** 「stringerに沿う縦方向のbottom/deck曲線。datumを含めて比較します。」
- **主要parameter:** nose/tail rocker、3/6/12/18/24in heights、low-point x、entry length/lift、tail kick、middle flatness、deck policy。
- **比較軸:** low↔high entry、continuous↔staged、flat center長、tail kick、low point forward↔back。
- **警告:** 測定datumが違うrocker値を直接比較しない。`apex`は曖昧なのでlow pointと表示。Preserve deckとpreserve thicknessの同時指定は禁止/解決選択。
- **Advanced:** bottom/deck curve CP、measurement points+uncertainty、datum transform、G2 fitting、foil constraint、base/modifier difference。

### 4.7 Edge / tuck / release

- **Primary:** rail-bottom cross-section拡大。secondaryにbottom plan上の3D edge pathとtail fade。
- **定義:** 「rail下部やtailの局所境界。位置、tuck量、角度、radiusを別々に定義します。」
- **主要parameter:** role、radius、included angle、tuck inset/height、start/end/fade、path height、adjacent surfaces。
- **比較軸:** large↔small radius、more↔less tuck、early↔late release、straight↔curved path、soft transition↔defined corner。
- **警告:** soft/tucked/hardは排他的でない。releaseはhardの単なるaliasでない。radius 0は禁止しCNC/hand-finish可能値を表示。
- **Advanced:** 3D path editor、radius path、G2 fade、tail-block/chine boundary selection、machine minimum radius。

### 4.8 Deck / foil / thickness

- **Primary:** cross-section（deck強調）、secondaryにthickness/volume longitudinal graphs。
- **定義:** 「上面のroll/crownと厚み分布。rail volumeとfoilへ連続します。」
- **主要parameter:** max thickness/x、deck crown/roll、flat-zone width、concave depth、step x/height/radius、rail-volume ratio、nose/tail foil。
- **比較軸:** flat↔domed↔concave、center volume↔rail volume、forward↔rear thickness、continuous↔step。
- **警告:** deck分類だけでvolumeは決まらない。rocker変更時のdeck/thickness保存policyを表示。step cornerは最小radius検証。
- **Advanced:** deck stringer curve、section crown paths、volume distribution、foil constraint、left/right、laminate/blank allowance overlay。

### 4.9 Chine / bevel / channel

- **Primary:** cross-section + bottom plan pathの2-paneを必須。1枚の斜視図だけにしない。
- **定義:** 「局所面とその境界pathを持つ形状feature。」
- **主要parameter:** boundary paths、width/height/depth、corner radii、start/end/fade、count/spacing。
- **比較軸:** shallow↔deep、narrow↔wide、single↔multiple、center↔rail、parallel↔converging。
- **警告:** chineをrail presetへ混ぜない。channelは単なる線でなく幅と底面を持つ。消失/交差/工具到達を検査。
- **Advanced:** independent left/right paths、section profile、blend order、surface IDs、CNC reach。

### 4.10 Fins

- **Primary:** bottom plan。secondaryにrear view（cant）とside view（rake/base）。
- **定義:** 「fin/boxの位置と姿勢。datumとlocal bottom面を含めて定義します。」
- **主要parameter:** system、x/y、datum type、toe、cant、splay、base length、depth、foil、cluster spread。
- **比較軸:** forward↔rear、inboard↔outboard、toe/cant、cluster narrow↔wide、single/twin/thruster/quad。
- **警告:** trailing edge、box center、router dotを混同しない。concave/vee上ではglobal cantとlocal-bottom cantが異なる。
- **Advanced:** global/local angle切替、box solid、collision/reach、left/right、fin template/foil。

## 5. Compare mode

2～4候補を同時選択し、次の固定layoutで比較する。

- 同縮尺overlay（base gray、候補ごと線種）
- parameter table。差のある行だけ強調し、単位とdatumを列名へ表示
- section/profile/planの同期cursor。xを動かすと全候補の断面が同stationへ移る
- curvature/area/volume等のderived値は「計算値」badge
- claim比較はgeometry表の下に分離し、evidence gradeとconditionsを併記
- 「名前が違うがgeometry差がtolerance内」「同じ名前だが実寸差が大きい」を通知

推奨比較軸はdetailごとに最大5個をprimary表示し、残りはAdvancedへ。単一の良い/悪いsliderに集約しない。

## 6. Advanced controlsの段階開示

3段階:

1. **Preset:** thumbnail、短い定義、主要3値、強度slider。ただし「strength」は複数実寸値へどう解決したか表示する。
2. **Shape:** semantic parameters、station graph、feature start/peak/end、comparison。
3. **Curve/Manufacturing:** Bezier handles、G1/G2、curvature comb、surface validation、CNC radius/reach。

Advancedを開いてもpreset値を失わない。値を変更すると`Custom derived from X`となり、Resetは変更差分をpreviewしてから行う。大量の派生CPを直接編集させず、必要時のみ「Bake to curves」を明示的・undo可能な操作にする。

## 7. Warningsの仕様

Severity:

- **Error:** 自己交差、負厚、datum不明で数値変換不能、surface fold、製造profile下の工具衝突。
- **Warning:** G1/G2不良、極小radius、急fade、ambiguous alias、低confidence migration、異なるdatum比較。
- **Info:** conditional performance claim、presetからCustom化、derived station/mesh。

警告は「何が」「どこで」「どの値を直せるか」を記す。例: `Tailから742 mmでrelease radius 0.05 mm。選択工具の最小0.8 mm未満です。` 自動修正は元値・修正値・geometry差分をpreviewし、compound bottom rangeのような正当な重なりを勝手に変更しない。

## 8. Alias表示と検索

- 検索はcanonical名、日英表記、spelling、brand/region aliasを対象にする。
- card primary labelはcanonical名。aliasは`別名: ...`、曖昧な場合は`複数の意味があります`badge。
- alias detail popoverに候補canonical cards、source scope、図による差、confidenceを表示。
- `thumb`, `fish tail`, `down rail`, `release edge`, `Bonzer`等を単純同義語変換しない。
- original imported termを保持し、migration後も`Imported as “hard”; radius/role unknown`と表示。

```json
{
  "term": "thumb tail",
  "locale": "en",
  "ambiguity": "high",
  "candidates": [
    { "canonicalId": "tail.round", "scope": "Greenlight usage" },
    { "canonicalId": "tail.squash_round_blend", "scope": "other shaping usage" }
  ],
  "autoResolve": false
}
```

## 9. Performance explanation copy

形状定義と性能claimを混ぜない。

- 悪い例: `Concave makes the board faster.`
- 推奨: `形状: centerがrail側より3.0 mm凹む横断面。一般的傾向: planing時の流れやliftへ影響し得ますが、rocker・速度・finとの組合せに依存します。根拠 C。`

文型:

`[対象条件]では、[観測/専門家が述べる効果]の可能性があります。同時に[trade-off]があり、[主要な交絡要因]に依存します。根拠 [A–D]。`

Grade C/D claimをdefault summaryで断定しない。`Why?`からsource、画像、試験条件、limitationsへ進める。

## 10. State / migration表示

- `Native semantic`: 全parameterとbase/modifierが再編集可能。
- `Legacy baked`: 曲線形状は保持、preset/baseは不明。解除・強度変更を無効化または再基準化確認。
- `Inferred`: 推定parameter。confidenceと未確定項目を表示。
- `Derived`: featureから再生成可能なsection/mesh。
- `Edited curve`: semantic modifierをbake済み。元modifierへ戻れない場合を明示。

旧BRDの`hard`は自動でbottom releaseへ確定せず、断面preview上でedge role/radiusを選ばせる。旧bottomの重なりはそのままtimeline表示し、均等分割を提案しない。

## 11. Accessibility / responsive

- thumbnailに構造化alt: `Tail plan: 12-inch width 368 mm, tip width 12 mm, smooth hip`。
- SVG overlayのlandmarkにkeyboard focusとtext label。
- contrast 4.5:1、selected stateは枠+icon+text、凹凸は色+矢印+pattern。
- mobileはprimary thumbnail→主要値→definition→warningの順。secondary viewsはswipeではなくtabも提供。
- sliderに数値input、単位、reset、keyboard step。微調整stepと粗調整stepを分ける。

## 12. 説明データschema

```json
{
  "schemaVersion": "1.0.0",
  "details": [{
    "canonicalId": "bottom.double_concave",
    "locale": "ja-JP",
    "label": "ダブルコンケーブ",
    "definitionShort": "centerline両側に2つの凹みを持つbottom断面。",
    "definitionLong": "...",
    "thumbnail": {
      "renderer": "semantic_geometry",
      "primaryView": "bottom_cross_section",
      "secondaryViews": ["bottom_plan_heatmap", "longitudinal_envelope"],
      "fixedScaleGroup": "bottom-contours-v1",
      "overlays": ["centerline", "lobe_centers", "depth", "width"]
    },
    "primaryParameters": ["centerDepthMm", "railDepthMm", "widthRatio", "lobeOffsetRatio"],
    "comparisonAxes": ["depth", "width", "lobe_offset", "longitudinal_position"],
    "compatibleWith": ["bottom.single_concave", "bottom.vee"],
    "conflictsWith": [],
    "warnings": [{ "id": "compound-not-exclusive", "severity": "info" }],
    "advancedGroup": "bottom_feature_geometry",
    "aliasRefs": [],
    "claimRefs": [],
    "mediaRefs": [],
    "sourceRefs": []
  }]
}
```

文言、thumbnail spec、geometry defaults、claims/sourcesを別ID参照にし、翻訳文の変更が設計parameterを変更しない構造にする。

## 13. 受入基準

1. 初見ユーザーがtail/nose/rail/bottom/rocker/edgeの**変更される視点**を5秒以内に識別できる。
2. 同名presetを選んだ後、最低3つのresolved実寸値を確認できる。
3. compound bottomとsoft+tuck+releaseを同時設定できる。
4. 12in幅、rocker、fin位置のdatumが常に表示/確認可能。
5. ambiguous aliasは候補比較なしに自動確定されない。
6. performance claimからevidence grade/source/conditionsへ2操作以内で到達できる。
7. keyboardのみで全parameter編集・warning確認・compare可能。
8. save→reload後にNative/Legacy/Inferred状態が変わらず、意味情報欠落を黙って隠さない。
9. thumbnail snapshot testで全presetのview/scale/orientationが固定される。
10. visual regressionに加え、thumbnailがcanonical parametersを正しく反映する数値testを持つ。

## 14. 実装優先順

1. 共通shape card、固定view renderer、canonical ID/alias/status badge。
2. tail/nose/outlineのplan thumbnailsと実寸overlay。
3. rail/bottom/edgeのcross-section rendererとlayer timeline。
4. rocker/deck/foilのprofile/graph、datum UI。
5. compare mode、claims/evidence drawer、image/source/license表示。
6. advanced curve/CNC validationとmigration review workflow。

## 15. 参照した調査群

- 01–07: tail/nose/outline形状と少数Bezier CP
- 08–22: rail/bottom/rocker/edge/foil/deckの定義と断面幾何
- 23–26: fin、station、datum、測定
- 29–34: CAD交換、CNC、非対称、board family、scan
- 35–36: aliases、地域/メーカー差、画像とlicense
- 38–40: 現行実装監査、evidence grading、canonical JSON schema
- 41–42: 統合資料の分類・実装優先事項（利用可能な成果をUI要件へ反映）

