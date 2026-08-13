# 統合レポート批判的レビュー・メモ

## 1. 総合判定

調査01..46は、サーフボード形状をCAD実装へ分解する材料として有用だが、情報の強さは均一ではない。CAGD、単位、datum、連続性、roundtrip、計測誤差は比較的強い。一方、特定形状が速度・hold・turn・paddle性能を生むという主張の多くはメーカー／shaperの経験則で、controlled comparisonではない。

統合JSONでは次を分離しなければならない。

- `geometry`: 測定・計算可能な形状。canonical truth。
- `taxonomy`: 検索・表示用の分類。形状値を保証しない。
- `preset`: resolved parameterを作る開始点。
- `claim`: 条件付き性能説明。
- `evidence`: claimの根拠と限界。
- `measurement`: datum、method、state、uncertainty付き観測値。

名称、性能俗説、単一画像の印象をgeometry constraintや既定最適値としてJSONへ入れてはいけない。

## 2. JSONへ「断定」として入れてはいけない事項

| 禁止する断定 | 問題 | 推奨表現／格納先 |
|---|---|---|
| `roundTail.hold = high` | hold/release説明が資料間で矛盾。速度・rail・edge・fin依存 | claim: `may provide smoother/continuous engagement under stated conditions`, grade C/D |
| `squareTail.release = high` | corner、block幅、edge radiusを無視 | geometry値を保存し、releaseは条件付きclaim |
| `wideTail.speed = high` | 「速度」が加速、低速support、最高速のどれか不明 | `may add planing area/support at low speed`; outcomeを明示 |
| `pinTail.hold = maximum` | outline以外を固定していない経験則 | `narrow tail area is commonly selected for control`; grade C |
| `hardRail.hold = high` または `release = high` | lateral biteとflow separationが混同 | `edge separation tendency`と`immersed lateral resistance`を別claim |
| `softRail.hold = high/low` | soft radius、apex、immersionで意味が変わる | radius/tuck/apexをgeometryとして保存 |
| `concave.speedBoost = n` | 一般化不能。drag/lift/trim/rockerとの相互作用 | `may alter pressure/lift/flow`; grade C、数値score禁止 |
| `vee.turning = easier` | roll initiationとtracking/stabilityの両効果 | 両方向のtrade-off claimを条件付きで併記 |
| `moreRocker = slower` | wetted area、entry、wave curvature、trim依存 | `often trades planing efficiency against fit/control`; grade C |
| `flatRocker = faster` | pearling/fit/drag条件を欠く | speedを分解し条件を付ける |
| `fullRails = fast/forgiving` | immersion、rider、wave、thickness distribution依存 | volume/fullness geometry + low-confidence claim |
| `thinRails = hold` | edge/apex/foil/速度依存 | thickness/area/radiusを保存、性能はclaim |
| `domedDeck.performance = ...` | laminate/core/stringerとrail foilを欠く | deck geometryとmaterial/flex claimを分離 |
| `asymHeelRail = thin/full` | 相反する設計思想が実在 | rider stance/intent付きpreset候補。強制しない |
| `fish = swallowTail` | fishはboard family、tail topologyではない | taxonomy familyとtail geometryを別field |
| `Bonzer = doubleConcave` | runners/channelを含むsystemを欠落 | compound feature setまたはbrand/system taxonomy |
| `release = hard` | role/pathとradiusを混同 | edge role=`bottom_release`; radiusは別parameter |
| `70/30.apex = exact fixed value` | 統一規格でない | preset resolved values + source/version。taxonomyは非規範 |
| `pointedNose.radius = 0` | 製造不能・用語から決まらない | measured tip/pod radius、min manufacturing radius |
| `scan = designIntent` | scanは製造偏差を含み作者意図を観測できない | measured surface + fitted canonical model + confidence |
| `imageLabel = groundTruth` | 調査42 datasetに完全重複・矛盾label多数 | annotation candidates + adjudication/confidence |

## 3. 主要な矛盾と統合時の扱い

### 3.1 Round tail: holdかreleaseか

資料には「水を長く保持」と「角がなく滑らかに水を放す」の両説明がある。これは必ずしも同じ物理量ではない。

- 禁止: `Round tails hold water longer and therefore hold more.`
- 推奨: `丸いoutline終端はcornerのない連続曲率を持つ。rail engagementやflow separationへの影響は速度、tail幅、edge、rocker、finに依存する。`
- JSON: geometry=curvature/tip width/radius。相反claimは別IDで保存し、同じconditionsでない限り勝敗をつけない。

### 3.2 Hard/soft edge: holdかreleaseか

hard bottom edgeの明確なseparationと、soft railの水中へのwrap/engagementが同じ`hold`語で語られる。

- 禁止: 単一`holdScore`。
- 推奨軸: separation sharpness、tuck、immersed rail area、lateral resistance、transition smoothness。
- 未解決: 同一boardでradiusだけを変えたcontrolled dataが不足。

### 3.3 Vee: rail-to-railを軽くするかtrackさせるか

veeは局所傾斜とboard rollの関係を変えるが、depth、位置、speed、finで結果が変わる。

- 推奨: `Veeはcenterからrailへ高さが増える横断形状。roll responseとdirectional stabilityの双方へ影響し得る。`
- JSONへ`turnEase`を定数保存しない。

### 3.4 Concave: lift/speedかdragか

concaveの圧力・流路説明は多いが、board全体の性能へ単純変換できない。

- 推奨: depth/width/lobe/envelopeをgeometryに保存。
- claimはspeed regime、trim、rocker、rail、surface roughness、riderをconditionsへ。
- `single→double→vee`は排他的classでなく重なるfeature layers。

### 3.5 Rocker: dragか曲面適合・濡れ面低減か

rocker量だけでなく曲率分布とrider trimが支配する。

- 禁止: nose/tail tip値だけからperformance score。
- 推奨: full bottom curve、datum、low point、station heights、curvatureを保存。

### 3.6 Fuller volume: supportかengagement阻害か

浮力、planing support、rail immersionは異なるoutcome。

- 推奨: volume distribution、section area、rail radius/apex、rider mass/stanceを分離。
- `forgiving`は定義が曖昧なのでclaim outcomeに使わず、具体的観測へ言い換える。

### 3.7 Tail/nose taxonomyの内部矛盾

調査42ではtail point列のexact duplicateが多数あり、異なるlabelを付けた群がある。nose分類資料には定義/labelが不足。現行presetとdatasetの対応も薄い。

- 禁止: dataset labelをcanonical ground truthまたは分類AI教師へそのまま使用。
- 推奨: topology（solid/notched/multi-tip）、terminal geometry、modifier（hip/corner/radius）、archetypeを分離して再annotation。
- `rocket`, `half-moon`, `split`, `star`等は資料上の正例不足。名称を削除する必要はないが`evidenceStatus: insufficient_visual_calibration`。

### 3.8 Tail/nose builderの対称性

現実装はnoseへtail builderの反転的発想を使う箇所があるが、設計意味は同じでない。

- 禁止: `noseMode`をtail parametersの符号反転だけでcanonical定義。
- 推奨: nose tip/pod、entry shoulder、nose widths、joinを独立parameter化。

## 4. 未解決の定義・測定問題

### 4.1 Datum

- tail 12inの起点: rearmost tip planeかswallow center notchか。
- overall length: chord、deck tape、bottom arcのどれか。
- rocker: midpoint tangent、best-fit central chord、nose-tail chord、machine frame。
- fin x: trailing edge/base rear、box center、router dot。
- cant: global center planeかlocal bottom normal。

推奨: 数値だけをcanonicalにせず`datumRef`, `method`, `state`, `uncertainty`を必須化。変換不能ならunknownで保持する。

### 4.2 用語の非標準性

50/50、70/30、down rail、thumb tail、squash、round square、displacement hull等に普遍的規格がない。

推奨: canonical IDも分類用にすぎないことを明記し、resolved dimensionsを必須にする。aliasはmany-to-many、brand/region/era scope付き。

### 4.3 Edge hardness

hardnessをradiusだけで完全に表せるか、included angle、隣接面曲率、表面仕上げを含むか未解決。

推奨: `radius`, `includedAngle`, `adjacentSurfaceCurvatures`, `finishState`を保存し、`hardness`はderived/qualitative label。

### 4.4 Rail apex

最大幅点をapexとする実装は、boxy/chine/flat zoneで一意でない場合がある。

推奨: apex definition methodとlandmarkを明示。複数候補/plateauを許容し、最大x knotの自動推定をtruthにしない。

### 4.5 Bottom depth符号

座標系、bottom側法線、断面表示方向でconcave/veeの符号が逆に見える。

推奨: schemaではsigned displacementの正方向を定義し、UIは`concave depth magnitude`等の非負値と方向iconを表示。

### 4.6 Finished geometryとdesign intent

scanには手仕上げ、lamination、sanding、左右差が含まれる。best-fit fairingで「本来の設計」を一意に戻せない。

推奨: `measured`, `fitted`, `inferredIntent`を別asset/revisionにし、fit residualとfeature preservation decisionsを保存。

## 5. 弱い出典・証拠の扱い

### 強めに使える

- 公式CAD/CAGD文書: Bezier/NURBS、G0/G1/G2、loft topology、fairness。
- 計測・scan/registration文献: datum、uncertainty、fit residual。
- CNC/tool公式資料: tool geometry、reach、collision、minimum radius。
- file format公式仕様: units、entity support。ただしtranslator実装差は別検証。

### 条件付きで使う

- 専門shaper/メーカー解説: 用語の実務的意味、一般的設計意図。性能因果はgrade C。
- retailer/blog: 市場での用語例・alias探索。canonical定義や物理法則の根拠にしない。
- 単一製品写真: 存在例。寸法校正・断面・bottomが見えなければgeometry fit不可。
- forum/SNS: 用語候補や論争の発見用。claim evidenceはD。

### 特に注意

- メーカーが自社shapeの利点を述べる文章はmarketing conflictを持つ。
- 同じサイト内でもround tail/concave等の説明が一般化・矛盾する場合がある。
- 画像検索のthumbnail URL、hotlink、著作権不明画像は再配布assetにしない。
- OA論文でもfigureのlicenseが本文と同じか確認する。
- CFD/tank結果を実surfing全般へ外挿しない。geometry、Reynolds/Froude、free surface、rider境界条件を記録。

## 6. 推奨表現辞書

| 避ける表現 | 推奨表現 |
|---|---|
| 速くなる | 特定条件でplaning support、加速感、または抵抗へ影響し得る |
| holdが増える | rail engagement、lateral resistance、またはflow separationのどれを指すか明記 |
| turnしやすい | roll initiation、turn radius、pivot、driveの観測量へ分解 |
| 安定する | pitch/roll/yawのどの安定性か、速度域を明記 |
| forgiving | rail catch頻度、速度保持、操作入力感など具体化 |
| paddleが良い | calm-water speed、stroke effort、tracking、wave entryを分離 |
| liftを生む | 測定/モデル条件下で圧力分布または鉛直力が変化した |
| 水をchannelする | geometry上の流路方向を示す。実流線は未測定なら断定しない |
| この形状はX向け | Xを意図した一般的preset。rider/wave/他parameterに依存 |
| 最適 | 選択したobjective/constraints/dataの範囲で候補 |
| 科学的に証明 | 指定条件・標本・測定で支持。外挿限界を併記 |
| exact 70/30 | このpreset/versionでapex height ratio等をこの値に解決 |
| original design recovered | scanからfair canonical modelをfit。作者意図は未確認 |

推奨claim文型:

> `[条件]では、[具体的outcome]へ[方向]に影響する可能性がある。[trade-off/交絡]に依存する。根拠Grade [A–D]、confidence [low/medium/high]。`

## 7. JSON schemaレビュー上の修正提案

### 必須

- geometry fieldから`speed`, `hold`, `turnability`, `stability`, `skillLevel`を除外。
- claimに`conditions`, `outcomeDefinition`, `evidenceRefs`, `limitations`, `confidence`, `notForOptimizationConstraint`。
- taxonomy/presetに`resolvedParameters`, `taxonomyVersion`, `sourceScope`。
- measurementにunit/datum/method/state/uncertainty。
- inference/migrationにfield単位confidenceと`needsUserReview`。
- mediaにparent source、license、accessed date、view、calibration status。

### 推奨

- `claimStatus`: supported / mixed / disputed / untested。
- `confounders`: rocker, outline, rail, edge, fins, rider, wave, speed, surface finish。
- `geometryIsolation`: controlled / partially-controlled / whole-board comparison。
- `evidenceGrade`だけでなく、研究designとsample countを保存。
- nullを0/falseへnormalizeしない。unknown、not applicable、measured zeroを区別。
- qualitative sliderを保存する場合も、それがどのresolved parametersを変えたか記録。

### 禁止

- aliasesの自動一対一collapse。
- unknown datum値の暗黙cm/mm変換。
- low-confidence image labelからpreset parameter生成。
- performance scoreを複数の異なるoutcomeから無根拠に合成。
- migrationでgeometryを変えながら`maxDeviation`を記録しないこと。

## 8. レポート内の事実・推論・提案を区別するラベル

統合.mdでも各段落/表rowへ可能なら次を付ける。

- **[Geometry definition]** 数学/測定で定義。
- **[Observed]** source条件下の測定結果。
- **[Industry convention]** 広く使われるが非標準。
- **[Expert claim]** shaper/メーカーの経験則。
- **[Inference]** 複数資料から編集者が推論。
- **[Implementation proposal]** CAD/UI/schemaの設計提案。
- **[Unresolved]** 資料矛盾またはデータ不足。

提案を「サーフボード形状の正しい定義」として記述しない。例として、G2 joinはfair CADの推奨であり、意図的wing/hard edgeへ一律適用する物理法則ではない。

## 9. 統合レポート公開前チェックリスト

1. 各形状名に定量値を暗黙付与していないか。
2. performance動詞に条件、outcome、trade-off、evidence gradeがあるか。
3. `hold/speed/drive/forgiving`を未定義のまま使っていないか。
4. rail softness、tuck、release、chineを排他的enumにしていないか。
5. bottom compound featureの重なりを誤り扱いしていないか。
6. fish/Bonzer等のboard/system名を単一featureへ縮約していないか。
7. 12/18/24in、rocker、fin値にdatumがあるか。
8. scan fitを作者intentと断定していないか。
9. 分類画像にlicense/provenance/calibration/annotation confidenceがあるか。
10. 調査42の矛盾datasetをground truthとして引用していないか。
11. C/D sourceの性能claimが断定口調になっていないか。
12. 数値defaultが経験値ならsource/version/board scalingを明示したか。
13. intentional corner（wing/hard edge）へG2を強制していないか。
14. JSONのunknownを0へ変換していないか。
15. migration前後のgeometry diffとsemantic lossを記載したか。

## 10. 残る研究課題

- 同一base boardでtail/rail/edge/concave/rockerを1変数ずつ変えたcontrolled hydrodynamic試験。
- riderを含む自由表面・非定常条件と主観評価の対応。
- `hold`, `drive`, `release`, `forgiving`の操作的定義。
- rail/edge断面の実測radiusと性能の関係。
- station/topologyを保つ少数CP loftと製造後scanの誤差budget。
- shape familyごとのparameter prior。ただし最適値ではなく観測分布として。
- regional/brand aliasesの専門家二重annotationとadjudication。
- tail/nose画像datasetの再構築、scale/datum/outline抽出精度の記録。

これらが未解決な間、CADはgeometryを忠実に作成・比較・保存する道具に徹し、性能を保証するシステムとして表現しない。

## 11. 主要参照成果

- 調査35: 地域・メーカー用語差、alias ambiguity
- 調査36: 画像URL、license/provenance監査
- 調査37–38: 現実装のsemantic error/data loss
- 調査39: 科学的根拠grade、性能主張の矛盾
- 調査40: canonical JSON schema案
- 調査42: 分類datasetの重複・矛盾・provenance欠落
- 調査43–45: UI説明、canonical tests、修正roadmap
- 調査01..34: 各detailの定義、CAD幾何、計測、製造、scan

