# 最終JSON用 Canonical Taxonomy v1

## 1. 運用規則

- IDは分類・feature生成器を指定する。**IDだけでは寸法や性能を決めない**。必須parameterのresolved値を必ず保存する。
- topology（終端数、notch、面境界等）とmodifier（roundness、hip、深さ等）を分離する。
- aliasesは検索用many-to-many。曖昧aliasは`autoResolve:false`。
- 互換とは同じboard上で共存可能という意味。合成順・空間domainは別途必要。
- 排他は同一`featureSlot`/同一domainで同時に成立しない数学的条件だけ。性能思想の違いを排他にしない。
- 全長手domainは `startXMm <= peakXMm <= endXMm`。左右は`side: both|left|right`。

共通parameter:

```json
{
  "id": "feature:uuid",
  "canonicalId": "bottom.single_concave",
  "taxonomyVersion": "1.0.0",
  "side": "both",
  "domain": { "startXMm": 0, "peakXMm": 0, "endXMm": 0 },
  "parameters": {},
  "presetRef": null,
  "originalTerm": null
}
```

## 2. Tail

Tailはoutline終端topology。fish等のboard familyは含めない。

| Canonical ID | Topology | 安全なaliases | 必須parameters | 互換 | 排他 |
|---|---|---|---|---|---|
| `tail.solid_block` | 左右railを単一terminal segmentで結ぶ有限幅block | square tail | `tailWidth12Mm, blockWidthMm, cornerRadiusMm, hipXMm, hipAmountMm, joinXMm, joinContinuity` | wings, asymmetric modifiers | 他tail topology |
| `tail.solid_rounded` | 単一の丸いterminal curve、有限幅/点収束可 | round, squash*, rounded square* | `tailWidth12Mm, tipWidthMm, tipRadiusMm, hipXMm, hipAmountMm, joinXMm, joinContinuity` | wings | 他tail topology |
| `tail.solid_pointed` | center terminalへ単調収束 | pin, round pin*, diamond* | `tailWidth12Mm, tipPodWidthMm, tipRadiusMm, shoulderXMm, hipAmountMm, joinContinuity` | wings | 他tail topology |
| `tail.center_notched` | 左右rear tips + center notch | swallow, split tail, fish tail* | `tailWidth12Mm, tipSeparationMm, eachTipWidthMm, notchDepthMm, notchRadiusMm, outerCornerRadiusMm, joinContinuity` | wings, asymmetry | 他tail topology |
| `tail.multi_lobed` | center tip/複数cutawayを持つ3以上のextrema | bat tail, star tail* | `terminalPoints[], cutoutDepthsMm[], cornerRadiiMm[], joinContinuity` | wings, asymmetry | 他tail topology |

`*`は曖昧alias。`squash`は`solid_block`または`solid_rounded`、`round pin/diamond`はterminal curvatureが異なるためparameter/variantで区別し、自動resolveしない。表示variantは任意:

- `solid_block`: square / rounded_square
- `solid_rounded`: squash / round / thumb（ambiguous）
- `solid_pointed`: pin / round_pin / diamond
- `center_notched`: swallow / deep_swallow / half_moon

## 3. Nose

| Canonical ID | Topology | 安全なaliases | 必須parameters | 互換 | 排他 |
|---|---|---|---|---|---|
| `nose.pointed` | center tipへ収束 | pin nose, gun nose* | `noseWidth12Mm, tipPodWidthMm, tipRadiusMm, shoulderXMm, joinXMm, joinContinuity` | asymmetry | 他nose topology |
| `nose.rounded` | 単一rounded tip | round nose, round point* | `noseWidth12Mm, tipWidthMm, tipRadiusMm, shoulderXMm, joinXMm, joinContinuity` | asymmetry | 他nose topology |
| `nose.block` | finite transverse pod + corners | square nose, snub nose* | `noseWidth12Mm, podWidthMm, cornerRadiusMm, shoulderXMm, joinContinuity` | asymmetry | 他nose topology |

`wide`はtopologyでなく`noseWidth12Mm`等のmodifier。`gun`はboard family/intentでも使われるためscope必須。

## 4. Rail

Rail IDは断面preset taxonomy。canonical truthは下記paths。

| Canonical ID | Topology | Aliases | 必須parameters | 互換 | 排他 |
|---|---|---|---|---|---|
| `rail.rounded` | deck→apex→bottomが単一smooth lobe | 50/50*, 60/40*, 70/30*, egg, full, pinched | `apexHeightRatioPath, apexInsetMmPath, deckFullnessPath, bottomFullnessPath, outerRadiusMmPath, deckTangency, bottomTangency` | tuck, release edge | `rail.chined` at same side/domain |
| `rail.chined` | 1つ以上の明示bevel面と境界 | chine rail, beveled rail | 上記 + `boundaryPaths[], bevelWidthsMm[], bevelAnglesDeg[], cornerRadiiMm[]` | tuck, release if distinct boundary | `rail.rounded` at same side/domain |

50/50等はaliasでなくversioned presetとして扱うのが望ましい。`down`, `boxy`, `knifey`もresolved parametersを持つpreset。`tucked-under`、`hard edge`はrail taxonomyへ含めない。

## 5. Bottom

Bottomはlayer feature。複数IDを重ねられる。

| Canonical ID | Topology / signed profile | Aliases | 必須parameters | 互換 | 排他 |
|---|---|---|---|---|---|
| `bottom.planar` | lateral displacement=0 | flat bottom | `domain, envelope` | channels/chines | convex/concave base in same slot |
| `bottom.single_concave` | centerに1 trough | single, concave | `domain, depthMm, widthRatio, lateralPower, envelope` | double, vee, channels | なし（layer合成可） |
| `bottom.double_concave` | centerline左右に2 trough | double | `domain, centerDepthMm, lobeDepthMm, lobeOffsetRatio, lobeWidthRatio, envelope` | single, vee, channels | なし |
| `bottom.vee` | centerからrailへ単調なheight差 | V, panel vee | `domain, railHeightDeltaMm, widthRatio, lateralPower, envelope` | concaves, channels | なし |
| `bottom.convex_hull` | center側がconvex | rolled bottom, hull* | `domain, crownHeightMm, widthRatio, lateralPower, envelope` | vee/chine if layered | 同一base slotのplanar |
| `bottom.displacement_hull` | longitudinal displacement bowを伴うconvex base | displacement bottom | `domain, crownHeightMm, widthRatio, longitudinalProfile, railTransition, envelope` | chine | 同一base slotのplanar |
| `bottom.channel` | 有限幅groove/ridge paths | channels, bonzer runner* | `paths[], count, channelWidthMm, channelDepthMm, floorRadiusMm, wallRadiusMm, envelope` | 全base/concave/vee | path overlap causing invalid surface |
| `bottom.chine` | rail寄りのbevel面 | bevel, chine bottom | `innerPath, outerPath, widthMmPath, heightMmPath, cornerRadiiMmPath, envelope` | base/concave/vee/channels | crossing boundaries |

`spiral vee`は独立topologyでなく、veeの`railHeightDeltaMm`/widthが長手方向に変化するpreset。Bonzerは単一bottom aliasにせずcompound systemとして別preset/package。

## 6. Rocker

Rocker taxonomyはcurve topologyではなくmodifier/preset。正本はbottom/deck curves。

| Canonical ID | 定義 | Aliases | 必須parameters | 互換 | 排他 |
|---|---|---|---|---|---|
| `rocker.base_curve` | datum付きbottom stringer curve | natural rocker* | `curveRef, datumRef, tailHeightMm, noseHeightMm, lowPointXMm` | 全modifier | 同一revisionの別base |
| `rocker.entry_lift` | nose側局所modifier | nose flip, entry rocker | `domain, liftMm, envelope` | tail kick, center flatten | なし |
| `rocker.tail_kick` | tail側局所modifier | tail flip | `domain, liftMm, envelope` | entry lift, center flatten | なし |
| `rocker.center_flatten` | 中央曲率を減らすmodifier | staged rocker*, flat spot | `domain, targetCurvature, blendLengthMm` | entry/tail | なし |

`continuous`, `staged`, `accelerated`はcurveを分類するqualitative tags/presets。数値curveなしでは保存truthにしない。deck policyは排他的enum: `preserve_deck | preserve_thickness | explicit_deck`。

## 7. Edge

| Canonical ID | Role/topology | Aliases | 必須parameters | 互換 | 排他 |
|---|---|---|---|---|---|
| `edge.outer_rail_radius` | rail外周のrounding path | soft rail, hard rail* | `pathRef, radiusMmPath` | tuck, release, chine | 同じboundaryの別radius definition |
| `edge.tucked_under` | bottom側へ入るtuck transition | tuck, tucked edge | `pathRef, insetMmPath, heightMmPath, radiusMmPath, fade` | outer radius, release | なし |
| `edge.bottom_release` | bottom/rail surfaceのseparation boundary | release edge, hard edge* | `pathRef, radiusMmPath, includedAngleDegPath, startX, endX, fade` | outer radius, tuck | 同じboundaryをsmooth-only指定 |
| `edge.tail_block` | terminal blockのcorner boundary | tail edge | `pathRef, radiusMmPath, cornerRefs` | release if connected | conflicting radius on same boundary |
| `edge.chine_boundary` | chine/bevel面の境界 | chine edge | `pathRef, radiusMmPath, adjacentSurfaceRefs` | release if different path | conflicting radius on same boundary |

`hard/soft`はradius preset表示。`release`はroleでありhardの同義語ではない。

## 8. Deck

Deckはsection layer/base classification。

| Canonical ID | Topology | Aliases | 必須parameters | 互換 | 排他 |
|---|---|---|---|---|---|
| `deck.planar` | center付近flat zone | flat deck | `flatWidthRatioPath, railTransitionPath` | steps/local concave | 同一base slotのdomed |
| `deck.domed` | center crownからrailへroll | crowned deck, rolled deck | `crownHeightMmPath, crownWidthRatioPath, lateralPowerPath, railTransitionPath` | steps/local concave | 同一base slotのplanar |
| `deck.concave` | center/local depressed zone | concave deck | `domain, depthMm, widthRatio, envelope` | planar/domed base, step | なし（modifier） |
| `deck.step` | 高さ/傾斜の局所transition | step deck | `pathRef, stepHeightMmPath, stepWidthMmPath, cornerRadiusMmPath, fade` | base/concave | intersecting step topology |

`crowned`は通常`domed` aliasだが、brand scopeで差があればambiguous登録。

## 9. Foil / thickness / volume

Foilはboard-wide distributions。nose/tailの単一labelではなくcurveを正本とする。

| Canonical ID | 定義 | Aliases | 必須parameters | 互換 | 排他 |
|---|---|---|---|---|---|
| `foil.thickness_distribution` | xに対するcenter thickness | foil, thickness foil | `curveRef, maxThicknessMm, maxThicknessXMm, noseThicknessStations[], tailThicknessStations[]` | volume/rail distributions | 同一revisionの別primary curve |
| `foil.volume_distribution` | xに対するsection area/volume density | volume foil | `sectionAreaCurveRef, totalVolumeMm3, centroidXMm` | thickness/rail | 同一revisionの別primary curve |
| `foil.rail_volume_distribution` | xに対するrail band area/volume | rail foil | `bandDefinition, areaCurveRef` | thickness/volume | 異なるband datum without explicit ref |

`forward foil`, `neutral`, `rear foil`はmax/centroid位置から得るderived qualitative tag。性能値ではない。

## 10. Fin

Fin setup taxonomyと個別fin geometryを分離する。

| Canonical ID | Topology | Aliases | 必須parameters | 互換 | 排他 |
|---|---|---|---|---|---|
| `fin.single` | center fin 1枚 | single fin | `items[1]` | sidebites if setup becomes 2+1 | 他setup ID |
| `fin.twin` | side fins 2枚 | twin fin | `items[2]` | trailer modifier | 他setup ID |
| `fin.thruster` | side 2 + center rear 1 | tri-fin | `items[3]` | なし | 他setup ID |
| `fin.quad` | side/front+rear 4 | four-fin | `items[4]` | なし | 他setup ID |
| `fin.two_plus_one` | large center + sidebites | 2+1 | `items[3], roles` | なし | 他setup ID |
| `fin.five_box` | 5 boxes、選択配置可 | five-fin convertible | `boxes[5], activeItems[]` | active setup taxonomy | active setupは一つ |
| `fin.finless` | active finなし | no-fin | `items:[]` | channels/keels integrated to hull | active fin setup |

各fin item必須:

```json
{
  "id": "fin:left-front",
  "role": "side_front",
  "systemId": "...",
  "position": { "xMm": 0, "yMm": 0, "zMm": 0, "datumType": "base_trailing_edge" },
  "orientation": { "toeDegGlobal": 0, "cantDegGlobal": 0, "cantDegLocalBottom": 0 },
  "template": { "baseMm": 0, "depthMm": 0, "rakeDeg": 0, "areaMm2": 0 },
  "foilRef": "..."
}
```

Keelはtemplate/role、twinはsetup。混同しない。cant/toeはdatum必須。

## 11. Alias registry（最小例）

| Term | Candidate IDs | Ambiguity | Auto resolve |
|---|---|---:|---:|
| square tail | `tail.solid_block` | low | yes（parameter未確定） |
| squash | `tail.solid_block`, `tail.solid_rounded` | high | no |
| round tail | `tail.solid_rounded` | medium | yes topology only |
| round pin | `tail.solid_pointed`, `tail.solid_rounded` | medium | no |
| fish tail | `tail.center_notched` + board family fish | high | no |
| thumb tail | `tail.solid_rounded` variants | high | no |
| gun nose | `nose.pointed` + board family gun | high | no |
| wide nose | modifier only | high | no |
| 70/30 rail | `rail.rounded` + versioned preset | medium | preset confirmation |
| hard rail | `edge.outer_rail_radius`, possibly `edge.bottom_release` | high | no |
| release edge | `edge.bottom_release` | medium | role only |
| hull | `bottom.convex_hull`, `bottom.displacement_hull` | high | no |
| spiral vee | `bottom.vee` with longitudinal paths | low | preset |
| Bonzer | compound board/bottom/fin system | high | no |
| crowned deck | `deck.domed` | medium | scope-aware |
| forward foil | `foil.thickness_distribution` derived tag | medium | no parameter inference |

## 12. Cross-category互換・排他ルール

### 許容する代表例

- `tail.center_notched` + `bottom.vee` + `edge.bottom_release`。
- `rail.rounded` + `edge.tucked_under` + `edge.bottom_release`。
- `bottom.single_concave` + `bottom.double_concave` + `bottom.vee`（重複domain可）。
- `deck.domed` + `deck.concave`（local modifier）+ `deck.step`。
- `rocker.entry_lift` + `rocker.tail_kick` + `rocker.center_flatten`。
- asymmetric left/rightで異なるrail/edge/outline modifiers。

### 真の排他／validation error

- 同一board revisionにprimary tail topologyが複数。
- 同一side/domainに`rail.rounded`と`rail.chined`をbaseとして二重定義。ただしpartial-domain transitionは境界を明記すれば可。
- 同一surface boundaryへ相反するradius pathを複数定義。
- tail/nose datumやsection landmark順序と矛盾するtopology。
- channel/chine boundaryの交差、negative thickness、self-intersection。
- deck policyの`preserve_deck`, `preserve_thickness`, `explicit_deck`同時指定。
- fin active setupが複数。ただしfive-box hardwareとactive setupは共存。

### 排他にしてはいけない

- hard/soft/tucked/release。
- single/double/vee/channel。
- continuous/staged/accelerated rocker tags。
- board familyとtail/nose topology。
- performance intent（small wave/big wave等）とgeometry feature。

## 13. Required parameter validation

- 長さはfinite mm、radius≥0、ratio∈[0,1]、countは正整数。
- `tipRadiusMm=0`は数学的sharpを明示する場合のみ許容し、manufacturing warning。
- pathはx順、duplicate stationは明示corner以外error。
- G1/G2要求はintentional corner/wing/edgeを除外。
- `joinContinuity`は`G0|G1|G2`。smooth preset既定G2、corner topologyはG0/G1を許容。
- alias選択だけでrequired parameterを埋めない。presetまたはユーザー入力が必要。
- unknown値は`null + status:"unknown"`。0へ変換しない。

## 14. JSON格納例

```json
{
  "taxonomyVersion": "1.0.0",
  "primaryTopology": {
    "tail": "tail.center_notched",
    "nose": "nose.rounded",
    "rail": "rail.rounded"
  },
  "features": [
    {
      "canonicalId": "bottom.single_concave",
      "domain": { "startXMm": 420, "peakXMm": 1040, "endXMm": 1580 },
      "parameters": { "depthMm": 3.2, "widthRatio": 0.72, "lateralPower": 1.6 },
      "composition": { "mode": "add_displacement", "order": 10 }
    },
    {
      "canonicalId": "bottom.vee",
      "domain": { "startXMm": 0, "peakXMm": 180, "endXMm": 620 },
      "parameters": { "railHeightDeltaMm": 4.0, "widthRatio": 0.9, "lateralPower": 1.1 },
      "composition": { "mode": "add_displacement", "order": 20 }
    }
  ],
  "aliases": [{
    "originalTerm": "fish tail",
    "resolvedCanonicalId": "tail.center_notched",
    "resolutionScope": "topology_only",
    "confidence": 0.8
  }]
}
```

## 15. 採用判断

このv1は少数IDに留め、細かな市場名をvariant/preset/aliasへ送る。新canonical IDの追加条件は次のすべて:

1. 既存IDのparameter差では表現できないtopologyまたはfeature role。
2. 必須parameterとvalidation invariantを定義可能。
3. 少なくとも2つの独立した専門/実物資料、または明確なCAD要件。
4. 既存IDとの互換/排他/migration規則を記述可能。

条件を満たさない名称はalias/presetに留める。

