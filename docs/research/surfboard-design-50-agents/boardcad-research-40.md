# BoardCAD 統合Canonical JSON Schema案

## 1. 目的

本案は調査01..39を、実装・保存・交換・検証に使える単一のnative documentへ統合する。名称（例: squash、70/30、single-to-double）は検索とpresetに使うが、**保存上の真実はdatum付き実寸geometryとmodifier parameters**とする。性能説明はgeometryから分離し、根拠の強さと適用条件を必須化する。

推奨形式名: `boardcad.design+json`、schema versionはSemVer、canonical内部単位はmm / degree / mm³（表示時Lへ変換）。JSON単体または画像・mesh・scanを同梱するZIP packageのmanifestとして使う。

## 2. Top-level構造

```json
{
  "$schema": "https://boardcad.example/schema/design-2.0.0.json",
  "schemaId": "boardcad.design",
  "schemaVersion": "2.0.0",
  "documentId": "urn:uuid:...",
  "revision": 12,
  "createdAt": "2026-08-12T00:00:00Z",
  "modifiedAt": "2026-08-12T00:00:00Z",
  "units": { "length": "mm", "angle": "deg", "volume": "mm3", "mass": "g" },
  "coordinateSystem": {},
  "designState": "finished_shape",
  "taxonomy": {},
  "geometry": {},
  "features": [],
  "measurements": [],
  "materials": {},
  "finSystem": {},
  "manufacturing": {},
  "claims": [],
  "evidence": [],
  "media": [],
  "sources": [],
  "aliases": [],
  "validation": {},
  "provenance": {},
  "migration": {}
}
```

未知fieldは保持して再出力し、必須field欠落は読み取り不能ではなく`validation.errors`へ記録する。extensionは`extensions.{reverseDnsVendor}`以下へ格納する。

## 3. Units / datum / coordinate system

```json
{
  "coordinateSystem": {
    "handedness": "right",
    "axes": { "x": "tail_to_nose", "y": "center_to_left", "z": "bottom_to_deck" },
    "origin": { "type": "tail_rearmost_center_plane", "point": [0, 0, 0] },
    "centerPlane": { "equation": [0, 1, 0, 0] },
    "tailDatum": { "type": "rearmost_extremity_plane", "x": 0 },
    "noseDatum": { "type": "foremost_extremity_plane", "x": 1830 },
    "rockerDatum": {
      "method": "machine_frame",
      "transformToBoard": [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
      "contactStations": []
    },
    "measurementState": "finished_sanded",
    "tolerance": { "linear": 0.25, "angular": 0.1 }
  }
}
```

規則:

- swallow/bat/asymではstringer notchと左右rear tipを別landmarkにし、overall datumを曖昧語`tail_tip`だけで保存しない。
- 外部入力のinch/cmはimport時にmmへ変換し、`provenance.originalUnits`を残す。
- rocker stick、scan、CNC frameは異なるdatum method。数値を直接混在させずrigid transformと測定法を保存する。
- dimensionless値は`ratio`、実寸は名前に`Mm`を付けるかschemaのunit annotationを持たせ、暗黙単位を禁止する。

## 4. Canonical taxonomy

`taxonomy`は分類・UI用で、geometryを上書きしない。

```json
{
  "taxonomy": {
    "boardFamily": { "id": "shortboard.performance", "confidence": 0.8 },
    "outline": { "id": "outline.continuous_curved", "preset": "shortboard" },
    "tail": { "id": "tail.swallow", "variant": "fish" },
    "nose": { "id": "nose.round_point" },
    "rail": { "id": "rail.70_30" },
    "bottom": ["bottom.single_concave", "bottom.double_concave", "bottom.vee"],
    "deck": { "id": "deck.domed" },
    "edge": ["edge.tucked_under", "edge.bottom_release"],
    "rocker": { "id": "rocker.continuous" }
  }
}
```

ID namespace例:

- `tail.*`: square, rounded_square, squash, round, round_pin, pin, diamond, swallow, split, bat。`fish`はboard familyまたはswallow variantであり、単一寸法を保証しない。
- `nose.*`: pointed, round_point, round, wide_round, square, snub。tip/pod radiusとwidthはparameter。
- `rail.*`: 50_50, 60_40, 70_30, 80_20, full, boxy, pinched, down。chine/tuck/releaseは別feature。
- `bottom.*`: flat, convex_hull, displacement_hull, single_concave, double_concave, vee, spiral_vee, channel, chine。
- `edge.*`: outer_softness, tucked_under, bottom_release, tail_block, chine_boundary。hard/softはradiusのpreset表示。
- `rocker.*`: continuous, staged, accelerated, flat_center, entry_lift, tail_kick。保存truthはcurve。
- `deck.*`: flat, domed, crowned, step, concave。

分類の同時成立を許す。例: `single_concave + double_concave + vee`、`soft outer rail + tucked_under + hard release`。名称から排他的enumへ潰さない。

## 5. Geometry topology

```json
{
  "geometry": {
    "representation": "semantic_brep",
    "symmetry": { "mode": "symmetric", "planeRef": "centerPlane" },
    "landmarks": [
      { "id": "tail.center", "point": [0,0,0] },
      { "id": "wide_point.left", "point": [970,268,20] },
      { "id": "nose.center", "point": [1830,0,82] }
    ],
    "curves": {
      "outlineLeft": { "$ref": "curve:outline-left" },
      "bottomStringerRocker": { "$ref": "curve:bottom-rocker" },
      "deckStringerProfile": { "$ref": "curve:deck-profile" }
    },
    "sections": [
      {
        "id": "section.mid",
        "role": "authored_key",
        "x": 915,
        "topologyId": "rail-section-v2",
        "curveRef": "curve:section-mid",
        "landmarkRefs": ["section.mid.bottom_center", "section.mid.tuck", "section.mid.apex", "section.mid.deck_center"]
      }
    ],
    "curveLibrary": [
      {
        "id": "curve:outline-left",
        "type": "piecewise_bezier_cubic",
        "degree": 3,
        "closed": false,
        "controlPoints": [[0,0,0],[...],[1830,0,0]],
        "joins": [{ "at": 1, "required": "G2", "tolerance": 0.001 }],
        "parameterization": "chord_length"
      }
    ],
    "surface": { "type": "loft", "sectionRefs": ["section.*"], "derived": true },
    "checksums": { "canonicalGeometry": "sha256:...", "bakedMesh": "sha256:..." }
  }
}
```

Topology規則:

- CPは少数のauthored curveに限定。表示mesh、feature充填section、tessellationは`derived`で再生成可能にする。
- section landmarkにstable IDを与え、rail apex / tuck / chine / channel boundaryをstation間で対応させる。knot数の違うpolyline blendを正本にしない。
- `role`: `authored_key | derived_feature | measured | endpoint_cap`。派生sectionを保存しても編集keyと誤認しない。
- asymmetric boardは左右outline/rail/finを別curveで持ち、mirrorを暗黙適用しない。
- baked B-rep/meshは交換・製作用artifact。semantic sourceとhash関係を記録する。

## 6. Feature / parameter model

全feature共通:

```json
{
  "id": "feature:bottom-1",
  "kind": "bottom.single_concave",
  "enabled": true,
  "side": "both",
  "domain": { "startX": 450, "peakX": 1120, "endX": 1670 },
  "envelope": { "type": "quintic_smootherstep", "endContinuity": "G2" },
  "parameters": {},
  "composition": { "mode": "add_displacement", "order": 10 },
  "presetRef": "preset:single-medium",
  "owner": "user",
  "revision": 3
}
```

Canonical parameter sets:

- **outline/tail/nose**: overall length, max width and x, widths at datum-defined 12/18/24in stations, tail block/tip/pod width, hip x/amount, corner/tip radius, swallow notch depth/width, wing step, join tangent/curvature constraints。
- **rail**: sparse longitudinal paths for `apexHeightRatio`, `apexInsetMm`, `deckFullness`, `bottomFullness`, `tuckInsetMm`, `tuckHeightMm`, `outerRadiusMm`, plus deck/bottom tangency。50/50等はresolved値を作るpreset。
- **bottom**: lateral profile type、center/rail depth mm、width ratio、lobe offset/spacing、channel count/width/depth/path、chine width/height/radii、longitudinal envelope。重複featureを許可。
- **edge**: role、3D path、radius mm、included angle、tuck inset/height、start/end/fade、adjacent surface IDs。`release`を`hard`のaliasにしない。
- **rocker**: bottom/deck stringer base curve、low-point x、nose/tail rocker valuesとstation method、entry/tail-kick modifiers、deck policy (`preserve_deck | preserve_thickness | explicit_deck`)。
- **deck**: crown/roll height、apex path、flat/concave zone width/depth、step position/height/radius、rail-volume transition。
- **foil/thickness**: thickness distribution curve、max thickness/x、nose/tail foil、volume distribution。deck/rocker変更時のconstraint sourceを明示。
- **fins**: system/box geometry、side、x/y/z、toe/cant/splay、各角度datum（global center planeとlocal bottom normal）、base rear/box center/router datum type。
- **materials/manufacturing**: blank, skin/stringer/laminate stack、tool/holder/fixture、stock allowance、flip datum、minimum machinable radius。

## 7. Measurementsと不確かさ

```json
{
  "measurements": [{
    "id": "m:nose-rocker-12in",
    "quantity": "rocker.height",
    "value": 58.2,
    "unit": "mm",
    "station": { "from": "noseDatum", "offset": 304.8 },
    "datumRef": "coordinateSystem.rockerDatum",
    "method": "rocker_stick",
    "state": "finished_sanded",
    "uncertainty": { "plusMinus": 0.8, "coverage": 0.95 },
    "sourceRef": "source:scan-session-1"
  }]
}
```

scanはraw asset、device/calibration、registration transform、sampling、hole fill、smoothing、fit residual、feature-preservation maskをprovenanceへ保存する。

## 8. Performance claims / evidence

性能をgeometry validationのhard ruleにしない。

```json
{
  "claims": [{
    "id": "claim:tail-release-1",
    "subjectRefs": ["feature:release-edge"],
    "predicate": "may_increase_release",
    "outcome": "reduced_wetted_separation_near_tail",
    "direction": "conditional_positive",
    "conditions": { "speed": "planing", "wave": "clean_face", "rider": "not_controlled" },
    "confidence": "low",
    "evidenceRefs": ["evidence:shaper-article-7"],
    "notForOptimizationConstraint": true
  }],
  "evidence": [{
    "id": "evidence:shaper-article-7",
    "type": "expert_practice",
    "grade": "C",
    "sourceRef": "source:7",
    "supports": ["claim:tail-release-1"],
    "limitations": ["no controlled comparison", "brand-specific terminology"]
  }]
}
```

推奨grade: A=規格/再現可能な統制研究、B=査読研究/強いCAD・計測原理、C=専門shaper/メーカー経験、D=小売説明/未検証一般論。C/Dを削除せず、断定表現と自動最適化には使わない。

## 9. Images / sources / license

```json
{
  "media": [{
    "id": "image:rail-7030",
    "kind": "cross_section_diagram",
    "uri": "https://.../image.jpg",
    "sourceRef": "source:rail-guide",
    "depictsRefs": ["rail.70_30"],
    "view": "cross_section",
    "annotations": [{ "label": "apex", "normalizedPoint": [0.82,0.48] }],
    "license": { "status": "link_only", "reuse": false },
    "checksum": null,
    "accessedAt": "2026-08-12"
  }],
  "sources": [{
    "id": "source:rail-guide",
    "title": "...",
    "publisher": "...",
    "url": "https://...",
    "sourceType": "professional_shaping_guide",
    "authors": [],
    "publishedAt": null,
    "accessedAt": "2026-08-12",
    "archiveUrl": null,
    "license": "unknown",
    "evidenceGrade": "C",
    "notes": "Terminology is brand-specific"
  }]
}
```

画像URL、親ページURL、license、取得日を分離する。転載許可不明なら`link_only`。画像は形状の証拠になっても寸法校正されていなければ数値fitの根拠にしない。

## 10. Aliases

```json
{
  "aliases": [{
    "term": "thumb tail",
    "locale": "en",
    "scope": { "brand": null, "region": null, "era": null },
    "candidateCanonicalIds": ["tail.round", "tail.squash_round_blend"],
    "ambiguity": "high",
    "autoResolve": false,
    "sourceRefs": ["source:a", "source:b"]
  }]
}
```

- aliasはmany-to-many。文字列一致で自動形状変換しない。
- spelling normalization（`planing/planning`等）と意味aliasを分ける。
- brand/region/era scopeとconfidenceを持たせる。
- 保存時はcanonical ID + resolved parameters。元入力語は`provenance.originalTerms`へ残す。

## 11. Validation schema

```json
{
  "validation": {
    "profile": "design_and_cnc",
    "rulesetVersion": "2.0.0",
    "results": [{
      "ruleId": "geometry.section.landmark-order",
      "severity": "error",
      "status": "pass",
      "targetRef": "section.mid",
      "measured": null,
      "limit": null
    }],
    "summary": { "errors": 0, "warnings": 2 },
    "validatedAt": "2026-08-12T00:00:00Z"
  }
}
```

Hard validation:

- schema/version/finite number/unit、ID/reference一意性、datum transform妥当性。
- outline閉包、非負半幅、section自己交差、surface fold/Jacobian、watertightness。
- CP/handle reversal、required G0/G1/G2 tolerance、曲率spike、最小radius。
- station順序、同topology landmark順序、feature domain start≤peak≤end。
- thickness>0、deck/bottom交差なし、左右/非対称設定整合。
- channel/chine/edge pathがsurface domain内、CNC tool reach/collision/min radius（製造profile指定時）。
- save→reload、native→artifact roundtripのHausdorff/volume/station誤差とchecksum。

Warning/advisory:

- 過剰CP/section、急なcurvature variation、feature fade不足、未知alias、低confidence migration。
- 性能claimは警告・説明に限定し、寸法を拒否するhard constraintにしない。

## 12. Provenance / revisions

```json
{
  "provenance": {
    "createdBy": { "application": "BoardCAD Web", "version": "..." },
    "inputs": [{ "kind": "legacy_brd", "uri": "board.brd", "sha256": "..." }],
    "operations": [{ "id": "op:1", "type": "apply_preset", "presetRef": "rail.70_30", "resolvedParametersHash": "..." }],
    "originalUnits": "cm",
    "originalTerms": ["release edge"],
    "baseGeometryHash": "sha256:...",
    "modifierStackHash": "sha256:..."
  }
}
```

Undo履歴すべてを正本にする必要はないが、base geometry、modifier順、resolved values、source hashは再現性のため保存する。

## 13. Migration

```json
{
  "migration": {
    "sourceFormat": "boardcad.brd",
    "sourceVersion": "unknown",
    "targetSchemaVersion": "2.0.0",
    "strategy": "preserve_baked_geometry",
    "confidence": 0.42,
    "losses": ["rail preset absent", "generated section roles absent"],
    "decisions": [{
      "field": "edge",
      "legacyValue": "hard",
      "mappedTo": { "preset": "legacy.hard_edge" },
      "status": "needs_user_review",
      "reason": "release role and radius cannot be inferred"
    }],
    "legacyGeometryHash": "sha256:...",
    "postMigrationGeometryHash": "sha256:...",
    "maxDeviationMm": 0.0,
    "reversible": true
  }
}
```

Migration原則:

1. 旧p32–p35のbaked curveを最優先で無変更保持し、名称からsemantic parametersを断定しない。
2. rail mode/base、edge radius、authored/derived station等が欠ける場合は`unknown`とし、推定値にconfidenceとreview flagを付ける。
3. 旧bottom featureの重なりを自動均等分割しない。compound overlapは合法。
4. runtime baseがないmodifierは現在形状を`legacyBakedBase`として固定し、解除で過去形状へ戻れると偽装しない。
5. schema migrationはpure functionとしてversionごとに実装し、入力hash、決定、loss、geometry diffを残す。
6. downgrade/exportは非対応field一覧を事前表示し、native正本を保持する。

## 14. JSON Schema実装上の要点

- JSON Schema Draft 2020-12を採用。`$defs`に`vec3`, `curve`, `station`, `feature`, `source`, `quantity`, `uncertainty`を定義。
- canonical enumはschema packageのversioned registryに置く。アプリ表示名はlocale辞書で分離。
- `oneOf`はcurve representation（Bezier/NURBS/polyline）やfeature固有parametersに使い、曖昧な名称分類には使わない。
- 長さfieldへ`"x-unit": "mm"`、ratioへmin/max、角度へdatumRef必須のcustom annotationを付ける。
- 浮動小数のcanonical serialization（key order、指数、`-0`、NaN禁止）を定め、hash/signatureを安定化。
- 大規模mesh/scan/imageはJSONへbase64埋込みせずpackage内relative URI + SHA-256で参照。
- `additionalProperties: false`をcore objectに用いる場合も`extensions`と未知version保持経路を必ず用意する。

## 15. 最小有効documentと段階導入

最小必須は `schemaId`, `schemaVersion`, `documentId`, `units`, `coordinateSystem`, `geometry.curveLibrary`, `geometry.sections`, `validation`。taxonomy、claims、media、manufacturingは任意。

導入順:

1. native JSON reader/writer、canonical units/datum、curve/section IDs、hash、roundtrip test。
2. legacy BRDをbaked geometryとしてlossless importし、既存p83–p90はraw metadataも保持。
3. rail/bottom/edge/rocker modifierをsemantic featureへ移し、preset resolved valuesを保存。
4. validation/fairness/CNC profiles、image/source/evidence registryを追加。
5. aliasesと多言語UIをregistry化し、曖昧語に選択UIを出す。

## 16. 参照した主要調査

- 01–07: tail/nose/outline taxonomyと少数Bezier幾何
- 11, 14, 15, 17, 18, 22: rail/bottom/rocker/edge/deckの実寸parameter
- 23–24: fin位置・角度とdatum
- 25–26: station/loft、測定単位・datum
- 29–30: native/交換形式、roundtrip、CNC
- 34–36: scan provenance、用語辞書、画像/ライセンス
- 38: 現実装の永続化・migrationリスク
- 39: evidence gradingと性能断定の制限

