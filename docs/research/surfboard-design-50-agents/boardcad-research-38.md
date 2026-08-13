# BoardCAD Web コード監査（rail / bottom / rocker / edge）

## 監査対象と判定基準

- 対象: `/home/protoplastico/ドキュメント/Projects/BoardCAD-Web-Linux/app.js`
- 方法: 読み取り専用の静的監査。コード変更なし。
- 比較基準: 調査11（rail断面）、14（bottom contour）、18（edge）、25（station/loft）、29（BRD/交換形式）を中心とする調査01..35の共通知見。
- 基準の要点: プリセット名と実寸幾何を分離する、railは長手方向のapex/tuck/fullness pathを持つ、bottomは基底面と横断面変位と長手envelopeを分け複数featureの重なりを許す、edgeは位置・半径・角度・tuck・releaseを分ける、rockerはbottom/deck/foil保存規則を明示する、loftは対応landmark/topologyとfairnessを検査する。

## 結論

現実装は「見た目を素早く変えるプリセット」としては機能するが、設計の核となる幾何モデルとしては意味パラメータが不足している。特に rail / edge は断面の既存Bezier knotを経験的に移動するだけで、製作・比較・再編集に必要な実寸定義を保持しない。bottomは比較的よく分解されている一方、追加・複製・旧データ読込時にfeatureの重なりを自動破壊する。rockerは縦断基底として分離されているが、保存されないruntime baseと曖昧なfoil/deck保存規則のため再読込後の再編集が非決定的になり得る。

## 優先度別の修正候補

### P0: データ破壊・再現不能を先に止める

1. **rail設定をBRD拡張fieldへ保存する。** `railMode` / `railStrength`はboard cloneには含まれる（21186–21187）が、parse（5567–5574）、`BRD_WRITE_ORDER`（21308–21315）、`brdExportValue`（21524–21531）のいずれにもrail用IDがない。現在のp35には変形後splineだけが焼かれ、`railBaseSpline`も`serializeCrossSection`が出力しない（16826–16834）。したがって再読込時に「どのプリセットを何%適用したか」と編集前基底を失う。rail mode解除・強度変更・edge再適用は元ファイルと同じ意味にならない。
2. **旧bottomの自動再配分を無効化または明示的移行にする。** 読込直後に`normalizeLegacyBottomFeatureLayout`が走る（5606–5617）。全隣接pairが45%以上重なるだけで（5888–5915）、全featureを非重複の均等区間へ書き換える（5870–5885, 5917–5923）。single→double→vee等の正当なcompound contourは意図的に重なるため、これはサイレントな設計変更である。
3. **追加・複製時の全feature均等再配置を廃止する。** `addBottomFeatureFromPanel`と`duplicateBottomFeatureFromPanel`が既存featureを含め全rangeを書き換える（20095–20105, 20111–20126）。新featureだけに既定rangeを与え、既存rangeは不変にすべき。
4. **保存前後のgeometry同値検査を追加する。** rail/bottomのruntime stash、生成section属性、rocker runtime baseはp35/p33/p34へ焼かれるだけで意味情報を一部失う。save→reloadで outline/profile/sections をサンプル比較し、最大偏差・曲率差・feature metadata欠落を警告する必要がある。

### P1: 意味モデルを正す

#### Rail

- 現状はsectionの最大x knotをrail apexと推定し（19234–19245）、テンプレートを幅・厚みにscaleして補間/置換する（19195–19225）。これはapexの高さ/横位置、deck fullness、bottom fullness、tuck inset/height、edge radiusを独立に表さない。
- 50/50、60/40等はプリセット名であり幾何そのものではない。`railModeSpec`の`railMarkInches`等（18031以降）も最終的な実寸landmarkとしてboardに保存されない。
- 全sectionへ同一mode/strengthを適用し、nose→mid→tailのapex/fullness/tuckの長手pathやfadeを持たない（19286–19302）。調査11の推奨どおり、少なくとも `apex_y_ratio(x)`, `apex_inset(x)`, `deck_fullness(x)`, `bottom_fullness(x)`, `tuck_inset(x)`, `edge_radius(x)` を疎なkey stationで定義し、プリセットはこれらを初期化するだけにする。
- `chine`を通常rail modeに混在させず、bevel幅/高さ、2本の境界curve、corner radiusを持つ独立featureにする。

#### Bottom

- 良い点: featureにstart/peak/end、depth、width、center/rail depth、channel count/spacing等があり、横断形状と長手envelopeを概ね分離している（5723–5800, 20031–20056）。複数featureの保持も可能。
- 問題: rail protection部で基底rail断面へ継ぎ、箇所によって`continuous=false`を使う実装は、G1/G2 fadeではなくkinkを作る可能性がある。rail lockを硬いspliceではなく、値・一次微分（可能なら二次微分）が0になる横方向envelopeにする。
- concave/channel等で断面knotを高密度化する方式は、ユーザーが求める少数Bezier CPと衝突する。意味featureは解析式/局所curveとして保持し、編集CPを増殖させず表示・export時にtessellateする。
- 「選択feature区間をsectionで埋める」は多数の設計sectionを追加する（20149–20174）。key stationとderived stationを区別し、derivedは保存/編集対象にしない方がloftの波打ちを抑えられる。

#### Edge

- `soft` / `tucked` / `hard`を排他的typeにしている（17965–17969）が、実物では外側railのsoftness、tucked-under量、bottom release edgeは同時に存在し得る別軸である。さらに`release`を`hard`へ同義化しており、機能/位置と半径を混同する。
- 実装は最大x knot周辺を幅・厚み比のheuristicで移動し（19228–19273）、hard/tuckedでは`continuous=false`にする（19274–19279）。edge radius、included angle、tuck inset/height、開始・終了path、tail block edge、chine edge、製作可能最小半径を持たない。
- 長手fadeは線形（18019–18028）のためfade境界で勾配が不連続。`smootherstep`等、両端で一次/二次微分が0になるenvelopeを使う。
- 推奨モデル: `outer_rail_radius(x)`, `tuck_inset(x)`, `tuck_height(x)`, `release_radius(x)`, `release_path_z(x)`, `hardness`（radiusから導出可能）を分離。soft/tucked/hardは互換表示用presetに留める。

#### Rocker

- 良い点: bottom stringer splineを基底rockerとして扱い、nose/tail rocker、entry、tail kick、central flatness等のconfigを別に持つ。bottom contourの横断featureとは概念上分離されている。
- `applyRockerConfigToBoard`は元bottom knotと中点等をsamplingして新splineへ作り直す（8214–8266）。G2/fairness保証や最少CP fittingではなく、操作ごとにtopology/曲率が変わり得る。
- `rockerRuntimeBaseBottom/Deck`はメモリ上のcloneにはある（21196–21197）がBRDへ保存されない。読込後は加工済みcurveが新たなbaseとなるため、同じpreset再適用やstrength変更で結果が変わり得る。
- `preserveFoil && !preserveDeck`のときだけdeckを再生成する（8267–8273）。両方trueではdeck保存が勝ち、厚み分布は保存されない。UI/データ上で排他的constraintにするか、矛盾時の優先順位を明記する。
- `apexShift`は最低点の移動を意味するが、surfboard用語として曖昧。`rocker_low_point_x`のように幾何量を直接命名する。

### P2: Loft品質と検証

- section parser/serializerはposition、spline、guide pointsのみ（8602–8613, 16826–16842）。`railBaseSpline`, `bottomFeatureBaseSpline`, `generatedByBottomFeature`は失われる。最低限、metadata sidecar/version付きBRD拡張を設ける。
- section間は対応knot数が違うとpolylineへflattenしてblendし、point-only splineへ戻す（8401–8420）。feature landmark対応を失い、rail apexやtuckが長手方向に漂う。apex/tuck/chine/channel boundaryへstable IDを与え、同じtopologyでloftする。
- 現在のsanitizerはhandle反転等の局所問題を抑えるが、G2曲率、station間の面fairness、fold/Jacobian、channel消失、左右対称性の検査は見当たらない。曲率comb、zebra/反射線、断面間apex path、自己交差、最小radiusを自動検査する。
- `crossSectionInterpolation`がglobal stateに依存する（8335–8407）。board metadataにもあるが、BRD独自fieldとしての永続化が明確でないため、同じファイルが設定環境により異なるsurfaceにならないよう保存対象にする。

## データ移行リスク一覧

| リスク | 現象 | 深刻度 | 移行策 |
|---|---|---:|---|
| rail semantic loss | mode/strength/base spline消失。形は焼かれるが再編集不能 | 致命的 | 旧ファイルは現p35を`legacy_baked_surface`として固定し、推定presetを自動確定しない |
| bottom overlap rewrite | 読込だけでcompound rangesが均等分割 | 致命的 | 自動変換を止め、旧判定結果をpreview diff付きでユーザー承認 |
| runtime base rebasing | reload後に加工済み形状が新baseとなる | 高 | schema version、base geometry hash、modifier stackを保存 |
| edge vocabulary collision | release→hard、soft/tucked/hardの排他化 | 高 | 旧typeを新しい複数軸へ暫定mapし、`migrationConfidence`を付与 |
| generated sections become authored | derived station属性がp35で消える | 高 | key/derived roleとfeature owner IDを保存。旧p35は既定でauthored扱い |
| topology loss | resampleによりlandmark/Bezier handle意味が消える | 高 | legacy curveを保持しつつsemantic landmarksを別レイヤーで追加 |
| rocker constraint ambiguity | preserveFoil/preserveDeck組合せで期待と異なる | 中～高 | 旧configの両trueは現挙動をlegacy policyとして固定し選択移行 |
| unit ambiguity | JSON feature値に明示unit/schemaがない | 中 | `schemaVersion`, `lengthUnit: cm`, dimensionless field定義を追加 |
| forward compatibility | 独自p83–p90を他BoardCADが無視/保持しない可能性 | 中 | sidecar JSONまたは namespaced metadata、roundtripテストを用意 |

## 推奨する新しい最小データ構造

```json
{
  "schemaVersion": 2,
  "units": "cm",
  "baseGeometry": { "outline": "...", "bottomRocker": "...", "deckProfile": "...", "keySections": [] },
  "rail": {
    "preset": "70-30",
    "stations": [{ "x": 0, "apexYRatio": 0.36, "apexInset": 0.2, "deckFullness": 0.7, "bottomFullness": 0.4, "tuckInset": 0.5, "edgeRadius": 0.15 }]
  },
  "bottomFeatures": [{ "id": "f1", "type": "singleConcave", "start": 50, "peak": 120, "end": 170, "depth": 0.3, "widthRatio": 0.7 }],
  "edges": [{ "id": "e1", "role": "bottomRelease", "start": 0, "end": 75, "fade": 20, "radius": 0.08, "tuckInset": 0.4 }],
  "rocker": { "baseCurve": "...", "modifier": {}, "deckPolicy": "preserveThickness" },
  "migration": { "sourceSchema": 1, "legacyBakedGeometryHash": "...", "confidence": 0.0 }
}
```

プリセットはこの実寸構造を初期化するだけとし、最終的な設計値は名称から独立させる。編集用Bezier CPは基底curveと少数key stationに限定し、channel/chine/edgeなど局所featureの表示・加工meshは派生生成する。

## 実装順序の提案

1. 破壊的なbottom自動再配分を止め、save/reload geometry regression testを追加。
2. schema v2とrail/runtime-base/generated-section metadataを保存。旧形状はbaked legacyとして無変更保持。
3. edgeをradius・tuck・release pathへ分解し、旧3タイプはpreset adapter化。
4. railの長手semantic pathsとlandmark対応loftを導入。
5. bottomのrail-lockをG2 envelope化し、derived stationを非破壊生成へ変更。
6. rockerのconstraint policy、最少CP fitting、fairness検査を導入。

## 参照した既存調査

- `/tmp/boardcad-research-11.md` — rail断面のapex/fullness/tuckとCAD連続性
- `/tmp/boardcad-research-14.md` — bottom contourの横断/長手分離とcompound feature
- `/tmp/boardcad-research-18.md` — edge/release/tucked/chineの定義分離
- `/tmp/boardcad-research-25.md` — station配置、landmark対応、loft fairness
- `/tmp/boardcad-research-29.md` — BRDと交換形式、roundtrip損失

