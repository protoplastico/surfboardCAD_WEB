# BoardCAD Web 修正ロードマップ

## 1. 目的・優先原則

調査37（tail/nose実装監査）、38（rail/bottom/rocker/edge監査）、42（分類画像監査）を中心に、調査01..44の成果を実装可能な順序へ変換する。コード変更は本担当では行わない。

優先原則:

1. **保存・読込で形状や意図を失う問題を最優先で止める。** 新しい形状機能より前にP0を完了する。
2. **旧ファイルのbaked geometryを不変に保つ。** 欠落した意味を名称から推定確定しない。
3. **preset名ではなくcanonical実寸geometryを正本にする。** UI・分類・性能説明はその上に載せる。
4. **少数Bezier CPとsemantic featureを維持する。** 表示/CNC用の高密度meshやderived stationを編集正本にしない。
5. **性能claimは条件とevidence gradeを持つ説明であり、geometry hard constraintではない。**

## 2. Release gate概要

| Gate | 目的 | 出荷条件 |
|---|---|---|
| G0 Freeze & Baseline | 現状再現性を固定 | golden files、save/reload diff、現行fixtureがCIで安定 |
| G1 P0 Safety | サイレントdata loss停止 | bottom overlap不変、rail等のmetadata loss警告、legacy geometry偏差≤許容値 |
| G2 Native Schema | versioned canonical正本 | schema v2 read/write/migrate/downgrade warning、unknown field保持 |
| G3 Geometry Core | semantic geometry実装 | tail/nose G2、rail paths、bottom layers、edge分離、rocker policy、fairness検証 |
| G4 UX & Evidence | 正しい説明と比較 | 固定view thumbnails、aliases、claims/evidence、accessibility受入 |
| G5 Manufacturing | 製造安全性 | CNC profile、min radius/reach/collision、artifact roundtrip検証 |

G1を満たさずG3の形状変更をproductionへ入れない。G2移行前後はdual-readを行い、write pathはfeature flagで段階開放する。

## 3. G0 — Freeze / 現状ベースライン

### G0-1 Golden corpus

最低限次を匿名fixture化する。

- native/legacy BRD: plain outline、各tail/nose preset、rail+edge、rocker、compound bottom、異なるsection knot数、asym相当、破損/unknown field。
- problem fixtures: bottom featureが同一range、45%以上overlap、rail適用後保存、rocker preserve flags両true、swallow notch、nose/tail terminal CP。
- export: BRD、OTL/PFL、DXF、STL/meshがある場合の基準artifact。

各fixtureにsource hash、expected semantic state、expected sampled geometry、既知のlegacy defectを記録する。

### G0-2 Geometry oracle

- outline/profile/sectionを固定stationとarc-lengthでsampling。
- max pointwise/Hausdorff deviation、width/thickness/rocker station、volume、curvature sign changes、endpoint/tangentを記録。
- save→reload、apply→undo、preset A→B→A、export→importを自動比較。
- snapshot imageだけをoracleにせず、数値geometryをprimaryにする。

### G0-3 Telemetry/diagnostics（ローカルでも可）

parse/migration時の欠落field、legacy inference、geometry diff、unknown aliasを構造化logへ出す。設計内容そのものを外部送信する場合は明示consentが必要。

## 4. P0 — Data-loss / semantic error

### P0-1 Bottom range破壊を停止

現状問題:

- legacy loadで隣接featureが45%以上重なると均等非重複区間へ再配分。
- feature追加/複製でも全既存rangeを均等再配置。

修正:

- load時はrangeをそのまま保持。旧自動補正は削除ではなく`legacy suggestion`へ隔離。
- addは新featureだけにdefault range、duplicateはsource rangeを保持。
- overlapはcompound設計として合法。競合はcomposition ruleが未定義のときだけwarning。
- 旧自動変換済みfileは元rangeを復元できないため、確定的な逆変換をしない。

受入test:

- identical/45/100% overlapがload/saveでbitwise同じparameter。
- single+double+vee preset、手動重複、disabled featureのrangeが不変。
- add/duplicate/remove/reorderで非対象featureのJSON deep equality。

### P0-2 Rail semantic persistence

現状は`railMode/railStrength`、`railBaseSpline`がBRDへ完全には永続化されず、変形後p35だけが焼かれる。

修正:

- 暫定BRD拡張fieldまたはsidecarへrail mode、strength、base geometry hash、modifier versionを保存。
- 再読込でbaseがない場合は`Legacy baked`。現在curveを勝手に編集前baseとみなさない。
- mode解除/strength変更前に「元形状不明。現在形状を新baseにする」明示操作を要求。

受入test:

- rail apply→save→reload→strength changeが未保存時と同形。
- legacy baked fileで解除がsilent geometry changeを起こさない。
- unknown mode/valueを破棄せずraw metadata保持。

### P0-3 Runtime base / generated-role persistence

- rocker base bottom/deck、bottom/rail base section、`authored_key`/`derived_feature` section role、feature owner IDを保存。
- hash不一致ならmodifier再適用を止め、repair workflowへ。
- interpolation modeもboard固有metadataとして保存。

### P0-4 Alias/分類の誤変換停止

- `release -> hard`、`fish -> tail geometry`、曖昧なthumb/round/squash等を不可逆normalizeしない。
- canonical candidate + original term + scope + confidenceとして保持。
- 調査42の分類画像はラベル矛盾・duplicate・provenance欠落が解消するまでtraining truth/preset truthに使わない。

### P0-5 Tail/nose C0 join是正の準備

調査37で指摘されたtail/nose procedural joinのC0-only状態について、production curveを直ちに一括変換せず、まずjoin errorを計測・表示する。旧shapeはbaked維持、新規presetだけG1/G2 builderへopt-inできるfeature flagを用意する。

## 5. G2 — Canonical schema / migration基盤

調査40の`boardcad.design+json`を正本とし、BRD/DXF/STEP/STLは派生artifactとする。

### Schema work packages

- S1: SemVer、mm/degree/mm³、axes/origin/tail/nose/rocker datum、design state。
- S2: stable IDs、curve library、authored/derived section roles、landmarks/topology IDs。
- S3: feature base type（domain/envelope/parameters/composition/preset provenance）。
- S4: taxonomy/aliases、sources/images/license、claims/evidence。
- S5: validation results、migration log、base/modifier/artifact hashes。
- S6: extensions/unknown field preservation、canonical JSON serialization。

### Migration engine

`legacy BRD -> immutable parsed snapshot -> canonical v2 -> validation -> geometry diff -> user decision -> save`

規則:

- source bytes/hashを保持し、migrationはpure/versioned function。
- p32–p35 baked curvesを優先。足りないrail/edge/preset意味値は`unknown`。
- 自動mapにはfield単位confidence、reason、sourceを付ける。
- geometryを変えるmigrationはdefault禁止。必要時はbefore/after overlayと最大偏差を提示。
- downgrade/export前にloss manifestを表示し、native v2を必ず残す。
- migration repeatability/idempotence: v1→v2→保存→再読込で2回目変更なし。

## 6. P1 — Geometry core

### P1-A Outline / tail / nose

依存: G0, P0-4, schema S1–S3。

1. topology、modifier、board archetypeを別fieldへ分離。
2. tail/noseを同じbuilderの反転流用にせず、各終端のdatum/tip/pod/inner cutを明示。
3. terminal CPを保持し、接続前の冗長CPは自動fairing。tail block/tip width、corner/tip radius、hip、swallow depthをsemantic parameter化。
4. native outlineとのjoinは最低G1、smooth presetはG2 toleranceを満たす。
5. presetはresolved parametersを生成するだけ。square/round/squash等の名称で数値を固定しない。

Tests:

- endpoint、tail/nose 12/18/24in widths、tip radius、notch depth、hip position。
- join G0/G1/G2 numerical tests、curvature comb spike、self-intersection、negative half-width。
- minimal CP count budgetとparameter edit locality。
- mirror/asym、very short/long/wide/narrow boundary cases。

### P1-B Rail

依存: S2–S3、section landmark/topology engine。

- `apexHeightRatio(x)`, `apexInset(x)`, deck/bottom fullness、tuck inset/height、outer radiusのsparse longitudinal paths。
- nose/mid/tail resolved sectionsとinterpolation。apex/tuck landmarkをstation間で対応。
- 50/50等はpreset adapter。chine/edgeをrail typeから分離。
- deck/bottom tangencyとG1/G2、section area/rail volume検証。

Tests: landmark drift、section topology mismatch、G2、radius、area continuity、preset resolved-value snapshots、save/reload determinism。

### P1-C Bottom / chine / channel

依存: S3、rail boundary/tangency、composition engine。

- base bottom + lateral profile + longitudinal quintic envelopeを分離。
- feature layersのoverlap/composition/orderを明示。
- rail-lockをhard spliceでなくend derivative 0のfadeへ。
- channel/chineを幅・深さ・境界paths・radiiを持つsurface featureへ。
- dense control sectionsはderived。編集CPへ昇格させない。

Tests: feature overlap algebra、order、fade端の値/1次/2次微分、rail boundary、channel消失/交差、section count independence、volume delta。

### P1-D Edge

依存: rail + bottom surface IDs。

- outer rail softness、tuck、bottom release、tail-block edge、chine boundaryを独立feature化。
- 3D path、radius、included angle、tuck inset/height、start/end/G2 fade。
- legacy soft/tucked/hardはpreset adapter。`release`をhardのaliasにしない。

Tests: simultaneous soft+tuck+release、radius path、fade continuity、adjacent surface validity、min machinable radius。

### P1-E Rocker / deck / foil

依存: S2–S3、constraint policy。

- bottom rocker base curveとmodifierを分離し、low point、entry、tail kickを明示。
- `preserve_deck | preserve_thickness | explicit_deck`を排他的policyにする。
- sampled point増殖ではなくtolerance付き最少CP G2 fitting。
- deck roll/crown、thickness/volume distribution、rail transitionと整合。

Tests: endpoint/station rocker、datum transform、low point、G2/fairness、policy別thickness/deck invariants、repeated apply idempotence。

### P1-F Loft / surface validation

依存: P1-A～Eのlandmarks。

- topology一致とfeature landmark alignmentを使うloft。
- knot数不一致時にpoint-only polylineへ黙ってflattenしない。
- curvature comb/zebra、surface fold/Jacobian、self-intersection、watertightness、minimum radius。
- key/derived stationを分離し、過剰section警告。

## 7. P2 — UI / performance / evidence

依存: canonical schemaとP1 resolved parameters。旧heuristic geometryへ新しい説明だけを先行接続しない。

### P2-A Shape cards / thumbnails

調査43仕様を採用。

- plan/profile/sectionのorientation、crop、scaleを比較群内で固定。
- base gray + modified outline + dimensions/landmarks。
- tail/nose/outline、rail/bottom/edge、rocker/deck、finで規定viewを実装。
- image source/license、模式図/写真/校正scanを区別。

### P2-B Semantic controls

- 3段階: Preset / Shape parameters / Curve & manufacturing。
- resolved実寸値を常時表示。変更で`Custom derived from X`。
- bottom feature layer timeline、soft+tuck+release同時設定、datum表示。
- Legacy baked / Inferred / Native / Derived状態badge。

### P2-C Compare / aliases

- 2～4候補を同尺度overlay、同期station、parameter diff tableで比較。
- many-to-many aliasとbrand/region/era scope。曖昧語は候補cardを提示しauto-resolveしない。
- 調査42資料は重複画像と矛盾labelをcleanし、provenance/licenseが揃ったものだけ公開。

### P2-D Performance explanations

- geometry定義と性能claimを別panel。
- condition、trade-off、confounders、evidence grade A–D、source、limitations。
- C/D claimは「可能性」「一般的傾向」とし、optimizer hard constraintにしない。
- analyticsを行うならclaim閲覧と設計データを分離しprivacy設計。

### P2-E Accessibility

- keyboard、numeric input、screen-reader structured alt、4.5:1 contrast、色以外の符号。
- mobileでもdefinition/主要値/warningへhoverなしで到達。

## 8. Dependency graph

```text
G0 baseline
 ├─> P0 bottom/rail/runtime/alias safety ──> G1
 └─> geometry diff oracle ─────────────────┐
                                           v
G1 ─> Schema S1 units/datum ─> S2 topology ─> S3 feature core ─> G2
                              │                    │
                              ├─> P1-A outline     ├─> P1-C bottom
                              ├─> P1-B rail ───────┼─> P1-D edge
                              └─> P1-E rocker      └─> P1-F loft
                                                   │
                                                   v
                         taxonomy/aliases/images/claims ─> P2 UI
                                                   │
                                                   v
                                     manufacturing validation G5
```

重要な順序:

- edgeはrail/bottomのsurface境界後。
- loftはsemantic landmarks後。
- UI thumbnail/compareはresolved geometry API後。
- CNC validationはcanonical units/datumと最終surface後。
- performance説明はgeometry生成をblockしない独立layer。

## 9. Test strategy

### Unit

- normalize/parse/serialize、units/datum transforms、alias non-resolution。
- curve endpoint/tangent/curvature、envelope derivatives、feature composition。
- schema validation、migration decision、canonical serialization/hash。

### Property-based

- finite parametersでNaN/Infなし、start≤peak≤end、positive thickness、nonnegative width/radius。
- save/load idempotence、mirror twice identity、unit roundtrip、modifier apply/reset。
- random overlapping bottom featuresで非対象parameter不変。

### Geometry regression

- sampled coordinates、Hausdorff、volume、station dimensions、curvature extrema。
- toleranceは用途別: native roundtripは厳格、mesh/exportは製造profile別。
- visual snapshotsは補助。SVG/canvas rendererとgeometry values双方を検証。

### Migration

- 全golden BRD、unknown fields、truncated/corrupt JSON、future schema。
- legacy baked rail、overlapping bottom、generated sections、ambiguous edge。
- before/after max deviation=0がdefault。semantic-only付加でgeometry不変。
- downgrade loss manifestとnative preservation。

### Integration / E2E

- import→edit→save→reload→export。
- preset→advanced edit→custom→undo/reset。
- compare、alias choice、migration review、warning fix preview。
- keyboard-only/accessibility tree、locale、mm/in表示。

### Manufacturing

- watertight/fold、minimum radius、tool/holder reach、fixture/flip datum、stock allowance。
- STEP/IGES/DXF/STL roundtrip geometry comparisonとunits manifest。

## 10. Rollout / rollback

- Feature flags: `schemaV2Read`, `schemaV2Write`, `semanticOutline`, `semanticRails`, `layeredBottom`, `semanticEdges`, `newShapeUI`。
- 初期はdual-read、legacy-write + v2 sidecar。golden corpusで安定後にv2 primary write。
- ファイルごとにsource bytesを保持し、migration前snapshotへrollback可能。
- migration failure時はread-only legacy modeで開き、部分変換fileを上書きしない。
- schema/geometry engine versionをdocumentへ保存し、同じversionで再生成可能にする。
- 新engineの偏差がtolerance超過なら自動的にlegacy baked rendererへfallbackし、警告を出す。

## 11. 推奨milestones

### M0 — Safety baseline

G0 corpus/oracle、bottom destructive behaviorを再現するred tests、rail persistence red tests。

### M1 — No silent loss

P0-1～P0-4、legacy state UI最小表示、save/reload regression。最初のユーザー向けhotfix候補。

### M2 — Native document

Schema S1～S6、migration log/hash、dual-read/write、unknown field retention。

### M3 — Outline terminals

tail/nose semantic builder、terminal CP、G1/G2 join、canonical taxonomy。ユーザーの現要望に最も直接対応。

### M4 — Section/surface core

rail paths、layered bottom、edge分離、rocker/deck policy、landmark loft、fairness。

### M5 — Shape UX

shape cards、thumbnails、compare、aliases、advanced controls、evidence drawer、accessibility。

### M6 — Production validation

CNC profiles、roundtrip/export manifest、scan comparison、performance experiment data接続。

## 12. Definition of Done

各work packageは次を満たすまで完了扱いにしない。

- schema/API/documentationとmigration pathがある。
- unit/property/geometry/migration/E2E testsがriskに応じて追加済み。
- save→reloadでsemantic stateとgeometryが許容差内。
- old fixtureをsilent overwriteせずrollback可能。
- UIにdatum/unit/status/warningが表示される。
- performance文言にevidence/conditionが紐づく。
- code pathにfeature versionがあり、future migrationで識別可能。

## 13. 直近の最小着手単位

最初のsprintは広範なgeometry rewriteを避け、次の5件に限定する。

1. golden BRD corpusとgeometry comparator。
2. bottom load/add/duplicateでrangeを変更しない修正とtests。
3. rail metadata/base lossを検出し`Legacy baked`にする保存/読込contract。
4. schema v2のunits/datum/document ID/legacy payloadだけを実装するthin slice。
5. tail/nose join continuity計測（まだ自動変形しない）。

これにより最も危険なデータ損失を先に止め、後続のtail/nose微調整が壊れた保存基盤の上へ積み上がるのを防げる。

## 14. 参照成果

- 調査37: tail/nose preset、C0 join、反転流用、alias非可逆性
- 調査38: rail/bottom/rocker/edge永続化・意味モデル監査
- 調査42: tail/nose分類資料、重複label、画像provenance監査
- 調査40: canonical JSON schema、validation、migration
- 調査43: thumbnail/説明/compare/advanced UI仕様
- 調査01..36, 39, 41, 44: 各detail幾何、計測、CAD/CNC、evidence、統合要件

