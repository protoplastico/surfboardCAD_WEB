# サーフボード・ノーズ形状分類調査

調査日: 2026-08-12  
対象: BoardCAD等におけるプランシェイプ（上面アウトライン）のノーズ分類

## 0. 結論

- ノーズ名称は厳密な規格ではなく、`wide`、`full`、`pulled-in`、`gun`は独立した末端トポロジーではない。CADでは名称より **12-inch nose width、tip半径、引込み開始位置、entry curve、wide point位置** を基礎データにする。
- 標準的なnose widthは、tipからストリンガーに沿って12 in（304.8 mm）後方の位置で、片側幅を直角に測り2倍する。先端から12 inの「弦幅」であり、曲線沿い距離ではない（Greenlight）。
- `nose`を先端12 inとする解説もあれば、前方1/3とする専門販売資料もある。設計上は「nose section」という曖昧な領域と `noseWidth@12in` という測定値を分離する。
- ノーズ単体で性能を断定しない。outlineはnose rocker、foil/厚さ、rail、bottom entry（roll/concave等）と連動する。Harbourはnose rocker減少に伴いnose widthが増えるのを基本則とし、Greenlightも狭いnoseの不足するlift/pearl耐性をrockerで補うと説明する。

## 1. 共通の幾何パラメータ

推奨データ:

- `noseWidth12`: tipから304.8 mm後方での全幅。
- `tipRadius`: 平面視の先端曲率半径（鋭点はほぼ0、full roundは大）。
- `pullInStart`: 最大幅点側からnoseへの収束が強まり始める縦位置。
- `entryCurvature(x)` または少数のBezier曲率制御。先端12〜24 inでのrail curveの加速を見る。
- `noseArea12` / `noseArea24`: 幅1点だけでは区別できない面積。
- `widePointOffset`: board centerからwide pointまでの前後位置。
- `tipBlockWidth`: snub/bluntの切断端幅。point/roundでは0。
- `symmetry`; 特殊なasym/pickle forkを扱う場合。
- 平面形と別に `noseRocker[]`, `noseFoil[]`, `entryBottomType` を保持。

**12-inch幅の限界:** 同じ12-in幅でも、一方は先端まで直線的に収束し、他方は先端近くで急に丸まれる。両者は面積、rail engagement、swing weightが異なるため、`noseWidth12`だけで形状を復元しない。

## 2. 標準分類

### 2.1 Point / Pointed nose（ポイント／尖りノーズ）

**幾何定義・見分け方**

- 左右レールがストリンガー上の単一先端へ連続的に収束。tipRadiusは極小。
- 12-in幅は相対的に狭く、前方railは強く引き込まれ、平面視で曲率のある細いentry outline。
- performance shortboard、step-up、gunに典型。ただし`point`はtip形状、これらはboard category。

**一般的傾向**

- 前方の面積・体積・swing weightが少なく、steep/critical sectionにfitしやすく、forward railがcatchしにくい。duck diveが容易。
- paddling時のlift/安定/波取り補助が少ない。narrow noseはpearling傾向もあり得るためnose rockerで補う（「pointなら必ずpearlingしない」は誤り）。

### 2.2 Gun nose / Pulled-in point（ガンノーズ）

**幾何定義・混同**

- `gun nose`は標準化された別トポロジーではなく、大波用gunに使う**長く、細く、強くpulled-inしたpoint nose**を指す用法が中心。
- 単なる短いperformance pointより、収束が前方の長い区間にわたり滑らかで、12-in幅が小さく、board全長や前寄りwide point、平行気味の中間railと組み合わされることがある。
- CADでは`gun`をnose enumにせず、`point` preset + narrow noseWidth12 + long pull-in、別途board archetype=`gun`とする。

**一般的傾向**

- late/steep drop、速度、長いrailでのhold/controlを意図。ただしgunのpaddle speedは「尖ったnoseのおかげ」だけでなく全長、volume/foil、rocker、wide pointの結果。

### 2.3 Round / Full-round nose（ラウンド／フルラウンド）

**幾何定義・見分け方**

- 左右railが大きな連続凸弧で閉じる。硬い角も直線tip blockもなく、tipRadiusが大きい。
- 12-in幅が広く、先端12〜24 inに面積を多く保持。longboard、noserider、mini-mal等に典型。

**一般的傾向**

- paddling/低速planingのlift、前方安定性、noseriding用足場を増す。弱い波で有利。
- frontal areaとswing weight、前方rail engagementが増し、steep faceでcatch/bogしやすく、tight turn/duck diveに不利になり得る。

**混同**

- `round`と`full`はしばしば互換。ただし`full`は形の名前というより、面積/幅を前方まで保持する程度をいう。CADでは`round`トポロジー＋高fullnessとする。

### 2.4 Round point / Rounded point（ラウンドポイント）

**幾何定義・見分け方**

- full roundとpointの中間。前方にある程度幅を保ちながら、最後は丸みを帯びた小半径tipへtaperする。
- full roundよりnoseWidth12/前方面積が少なく、true pointよりtipRadiusとfullnessが大きい。funboard、hybrid、一部fishに一般的。

**一般的傾向**

- paddling、stability、wave catchingを残しつつ、full roundよりturn/duck dive/steep-section適合を改善する妥協形。
- `pointed round`、`round-point`等の語順揺れがある。

### 2.5 Wide nose（ワイドノーズ）

**定義**

- トポロジーでなく測定特性。Greenlightはshortboard文脈で12-in nose widthが11 in超をwideの目安として挙げるが、これは全board category共通の絶対閾値ではない。
- wide noseはround、round point、blunt/snub、fish系pointのいずれにもなり得る。

**一般的傾向**

- 前方surface area/lift/volumeを増し、短い／平たいboard、小波、初心者、retro/modern fishのpaddlingを補う。
- planing後はforward railがwave faceに多く入り、critical/steep areaでcatchしやすい。深くsetした長いrailでpowerful/open carveが可能な反面releaseは減る、というGreenlightの説明も重要。

**実装**

- enumにせず `noseWidth12` と `noseArea24` の評価ラベルにする。11 inはshortboard presetの参考値としてのみ使用。

### 2.6 Full nose（フルノーズ）

**定義**

- `wide`に近い修飾語だが、単一断面の幅よりも、wide pointからtip近くまで幅/面積/volumeを保持するentry outlineを指す。
- 同じnoseWidth12でも、曲率が後半まで緩く先端近くで閉じる方がfull。round noseと結び付くことが多いが、wide-point fish noseもfullになり得る。

**実装**

- `fullness`を0〜1、またはnoseArea24をnoseWidth12で正規化した指標で表現。`full`をroundの別名に固定しない。

### 2.7 Blunt / Snub / Chopped nose（ブラント／スナブ）

**幾何定義・見分け方**

- 本来pointだったoutlineの先端数インチを切り落としたような短いnose。左右railが幅のある直線または小弧のtip blockに到達する。
- `tipBlockWidth > 0`で、短い全長でも比較的長いrail lineと広いnoseWidth12を保つ。Tomo系parallel outline、wakesurf/kitesurf、高性能compact shapeで見られる。

**呼称の揺れ**

- `blunt`と`snub`は多くの場合ほぼ同義だが規格なし。snubを丸いcut-off、bluntを角張ったcut-offとして使うブランドもあり、名称から端のcornerRadiusを決めない。
- `blunt nose`はsurfboard以外にwakesurf/kitesurf資料が多い。競技条件が異なるため性能をそのまま海用surfboardへ転用しない。

**一般的傾向**

- 不要な先端長/質量を除きswing weightを減らし、短いboardで幅・planing area/rail lengthを残す狙い。relativeにpaddle-friendly、compact、responsive。
- wide forward outlineがcatch/bogし得る。tip切断そのものより、parallel rail、rocker、volume distributionとの組合せが支配的。

### 2.8 Diamond nose（ダイヤモンドノーズ、特殊）

- Daniel Thomson/Tomo系で見られる、wide/blunt noseのtip blockを中央前方点と左右斜辺で構成する角張った凸tip。`diamond tail`を前後反転したような輪郭。
- wide nose面積を保ちつつ先端を削りswing weightを抑える狙い。一般的分類というより特殊variant。CADではsnub base + `tipBlockShape=diamond`。

### 2.9 Pickle-fork / Swallow nose（特殊）

- 先端中央を凹状に切欠き、左右に2つのtipを持つ。Ryan Burchのデザインとして紹介される。
- pointedとsnubの要素を組合せた特殊トポロジー。一般nose enumと同じBezierテンプレートで無理に表現せず、`notchDepth`, `tipSpacing`を持つ別トポロジーにする。

## 3. Entry outline の読み方

- **Pulled-in entry:** wide point/胸下からnoseへ向けて幅が早く減り、前方rail curveが大きい。narrow/point/gun系。steep pocketへfitしforward railのcatchを減らす傾向。
- **Full entry:** 幅の減少が遅く、tip近くで曲率が急増。round/full/fish/groveler系。面積・lift・paddle supportを保持。
- **Parallel-forward entry:** wide pointからnose方向のrailが長く直線に近く、その後snub/round tipで閉じる。speed/trim/stabilityや長いengaged railに寄与する一方、snappy turn/releaseを減らし得る。
- **Rounded point entry:** fullな中間曲線から、tip手前で滑らかにtaper。上記両極の中間。

曲線評価は1個のCP位置ではなく、曲率連続性（最低G2を目標）と幅サンプル（6/12/18/24 in）で行う。12-in幅だけを動かすと不自然な肩／flat spotが生じ得る。

## 4. CAD実装案

### 4.1 分類モデル

```text
noseTopology: point | round | cut_off | fork | asymmetric
nosePreset: performance_point | gun_point | round_point | full_round | snub | diamond | pickle_fork
measurements:
  width6, width12, width18, width24
  tipRadius, tipBlockWidth, noseArea24
  pullInStart, fullness, widePointOffset
```

- `wide`/`full`/`pulled-in`はタグまたは連続値、`gun`はboard archetype/preset。
- round↔round-point↔pointをtipRadius/fullness/pull-inで連続morph可能にする。
- snubはpointのtipを単に短くする操作として用意してもよいが、全長基準の12-in stationを再計算しrail curveを再blendする。

### 4.2 最少コントロールポイント

- 左右対称の基本noseは片側curveをmirror。必須anchorは「nose tip」と「nose section接続点」の2点を基本にし、Bezier handleで12-in幅とentry tangentを調整。
- ただしtip CPは形状制御に不可欠。pointではtip位置＋tangent、roundではtip曲率、snubではtip block角2点が必要。
- `noseWidth12`をvirtual constraint/measurement handleとして見せ、必ず曲線上CPにする必要はない。これにより余分なCPを増やさず標準寸法を制御できる。
- full/roundで先端近くの曲率と12-in幅を独立制御したい場合、接続前CPを増やすよりtip handleとsection-side handleを公開する。ただし単一cubicでG2と両制約が満たせない場合のみ中間anchorを追加。
- snub/bluntは左右tip-block cornerを意味anchorとして残す。diamondは中央tip＋左右shoulder、forkは左右tip＋中央notch apexが必須。
- nose sectionからrail sectionへの接続は位置G0だけでなくtangent G1、可能ならcurvature G2を検証。曲率プロットでflat spot/肩を検出する。

## 5. 性能表示の安全な表現

UIでは「このnoseは速い」のような断定を避け、次の因果を表示する。

- width/area増 → 低速lift/paddle support/安定が増える傾向。
- width/forward rail増 → steep faceでcatchする可能性、swing weight増。
- narrow/pulled-in → critical sectionへのfit、duck dive、低swing weight。ただしpaddle lift減。
- rocker増 → steep entry/pearling耐性を助け得るがpaddlingで水を押しdragを増し得る。
- foil/volumeはplanshapeから独立。同じ平面noseでも厚さでpaddling/swing weightが変わる。

## 6. 画像掲載ページ

画像は転載せず、ページ参照のみ。

1. **Greenlight Surf Co. – Surfboard Outline Design Guide**  
   https://greenlightsurfsupply.com/pages/surfboard-outline-design-greenlight-surfboard-design-guide  
   outline blending図、nose widthをtipから12 inで測る図、wide point図を掲載。CAD測定定義の最重要資料。
2. **SurferToday – A guide to surfboard nose shapes**  
   https://www.surfertoday.com/surfing/surfboard-nose-shapes  
   full round、rounded point、pointedの写真を掲載。基本3形の実物比較向け。
3. **Surfology – Surfboard nose shapes**  
   https://surfology.blog/surfboard-nose-shapes/  
   point、round、round-point、diamond、snub、asym、pickle-forkを同系統のイラストで掲載。特殊形のトポロジー確認に有用（専門ブログなので性能主張は補助扱い）。
4. **Boardcave – Surfboard Tails, Rails and Noses**  
   https://www.boardcave.com/the-surfers-corner/cat/news/post/surfboard-shapes-tails-rails-and-noses  
   実ボード画像を含み、noseを前方1/3、nose widthをtipから12 inと説明。wide/round対narrow/pointの比較。
5. **Harbour Surfboards – Design + Construction**  
   https://www.harboursurfboards.com/surfboard-construction  
   outline図と老舗シェイパーによるnose width、wide point、rocker/foilの関係。単独形状図鑑ではないが設計相互作用の一次専門資料。
6. **Sticks – Anatomy: The Nose**  
   https://www.sticks.surf/guide/anatomy/nose  
   pointedとround/fullの視覚比較と使用board categoryを掲載。基本概念の補助資料。

## 7. 出典評価

### 優先（シェイプ専門／メーカー）

- Greenlight Surf Supply, “Surfboard Outline Design”  
  https://greenlightsurfsupply.com/pages/surfboard-outline-design-greenlight-surfboard-design-guide  
  信頼度: 高。測定方法、11 in超wide（shortboard文脈）、rail curve、wide pointとの関係を詳述。
- Harbour Surfboards, “Design + Construction”  
  https://www.harboursurfboards.com/surfboard-construction  
  信頼度: 高。1959年以来のシェイパーによるoutline/rocker/foil解説。幅広noseの安定とswing weightのtrade-offを明記。
- Boardcave, “Surfboard Shapes – Tails, Rails and Noses”  
  https://www.boardcave.com/the-surfers-corner/cat/news/post/surfboard-shapes-tails-rails-and-noses  
  信頼度: 中〜高。専門販売プラットフォーム。12-in測定と基本性能を確認。

### 補助資料

- SurferToday, “A guide to surfboard nose shapes”  
  https://www.surfertoday.com/surfing/surfboard-nose-shapes
- Surfology, “Surfboard nose shapes – how do they affect your surf?”  
  https://surfology.blog/surfboard-nose-shapes/
- Sticks, “The Nose”  
  https://www.sticks.surf/guide/anatomy/nose

## 8. 誤実装チェックリスト

1. `gun`をpointと別の必須トポロジーにしていないか。
2. `wide`/`full`をtip形状enumにしていないか。
3. nose widthをtipから曲線沿い12 inで測っていないか（ストリンガー沿いstationで測る）。
4. 12-in幅1点だけからcurveを決めてflat spotを作っていないか。
5. roundとround-pointでtipRadiusとpull-inが区別されているか。
6. blunt/snubを単にpointの先端を表示上隠すだけにせず、実輪郭・全長・stationを更新しているか。
7. planshapeとrocker/foil/bottom entryを同一概念に混ぜていないか。
8. nose末端の形状調整CP/handleを消してユーザーがtip曲率を制御不能にしていないか。

