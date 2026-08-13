# BoardCAD Web tail / nose preset監査

調査日: 2026-08-12  
対象実装: `/home/protoplastico/ドキュメント/Projects/BoardCAD-Web-Linux/app.js`, `index.html`  
照合資料: `/tmp/boardcad-research-01.md`（tail分類）、`04.md`（nose分類）、`28.md`（curve fairness）、`35.md`（用語差）  
変更: **なし（コード監査のみ）**

## 1. 結論

UIにはtail 16種、nose 8種が独立した「形状」として並ぶが、標準的な幾何分類と一致しないものがある。最優先は次の5点。

1. **`Wide nose` は幅の修飾語なのに形状enumであり、実装上は `round-pin` tailへ写像されるため先端が鋭点になる。** 表示名が示すwide/full noseと逆方向に解釈され得る。
2. **`Square nose` は選択・保存できるがnose splineを生成できない。** `square` tail presetは`tipRatio=0`、nose側はgun/cap builderしか呼ばず、双方がnullとなる。
3. **`Diamond tail / nose` は中央tipが点でなく短いflat blockになる。** 標準diamondの中心後方（noseなら前方）単一tipと不一致。
4. **`Star tail` は標準的なbat/star同系（中央凸tip＋左右の凹弧）でなく、中心を凹apexとして複数の波形を置く別トポロジー。** `Bat`の実装の方が標準bat/starに近い。
5. **tail/noseと既存rail outlineの接続を意図的にC0（接線不連続）へ落としている。** 「綺麗なoutline接続」「少数CPのfair curve」という設計目標、および最低G1・可能ならG2という調査結果と矛盾する。

## 2. UI名と実装の対応

### 2.1 Tail

|UI preset|実装トポロジー|標準分類との評価|問題 / 推奨canonical表現|優先度|
|---|---|---|---|---|
|Square|`tipRatio=0`のopen pod。fallbackでx=0の左右点を直線閉鎖|概ね一致|corner radiusが明示パラメータでなく`cornerScale`等へ埋没|中|
|Squash|中心tipから1本の丸いcubic、wide pod|概ね一致|標準は浅い凸pod＋丸い角。previewとpod bulgeの定量表示が必要|中|
|Round|中心から連続した単一round arc|概ね一致|`full round/thumb`との別名・pull-in量を表示|低|
|Round square|flat幅を残すrounded cap|概ね一致|英語表示は **Rounded square** が自然。normalize時に`round-squash`まで同一化しており、squashとの差を失う|高|
|Gun|単一point arc。元outlineを後方へ外挿する特別処理|名称不適切|gunはboard archetypeでtail topologyではない。幾何に応じ`pin`/`round pin` presetへ。少なくとも「Gun-style pin」|高|
|Pin|単一鋭点、強いpull-in|一致|`pintail/true pin` alias追加程度|低|
|Round pin|単一tipだが`tipScale=0`なので数学的には中心鋭点|部分一致|標準round pinはpinよりsoftな小半径tip。現実装はentry curve差でしかなく、tip radius差を表せない|高|
|Diamond|shoulderを置き中心側へ斜辺|部分不一致|`tipScale=0.12`により中心に幅のあるblockを残す。標準diamondは中央凸の単一tip。sharp/roundedをcorner radiusで分ける|高|
|Round diamond|丸いshoulder＋幅広block|曖昧|メーカー固有variantとしては可。ただし`tipScale=0.30`はdiamondよりsnub/rounded blockに見える可能性。diagram必須|中|
|Rocket|pointed builder|名称が非標準・曖昧|`rocket tail`は普遍的canonicalでなくdiamond等を指す例もある。現在は実質short pointed tail。形状記述名へ変更かExpert presetへ|高|
|Half moon|中央円弧状cutaway＋外側2tip|概ね一致|canonicalは`crescent / half-moon`、swallowとのnotch curvature差を表示|低|
|Swallow|中央V notch＋外側2tip|一致|depth/tip spacingで定義。現実装の`length + cutLength`はUI上意味が見えにくい|低|
|Fish|deep/wide swallow|形状として概ね一致|`Fish`だけではboard categoryと混同。**Fish tail (deep swallow)** と表示しboard archetypeから分離|高|
|Split|浅いnotch＋2tip|名称重複|`split tail`は通常swallow alias。独立enumにするなら **Mini/Baby swallow** と定量差を示す|高|
|Star|中心凹apex→外tip→凹→外tipの波形|不一致|標準資料ではbat/starは同系で「中央凸tip＋左右cutaway」。現形状を残すなら`multi-point/serrated`等の独自名|最優先|
|Bat|中央凸tip＋scoop＋外lobe|概ね一致|標準bat/starのcanonical本体に適する。Starをvariant/aliasへ整理|中|

実装根拠: preset値は`app.js:5635-5651`、notch/depth対象は`7457-7460`、各builder分岐は`9539-9615`, `9702-9902`。UI列挙は`index.html:343-360`。

### 2.2 Nose

|UI preset|内部写像|標準分類との評価|問題 / 推奨canonical表現|優先度|
|---|---|---|---|---|
|Gun / point|`gun` tail型|部分一致|pointはtip topology、gunはboard/preset。UIは **Pointed** をcanonical、Gun pointをarchetype presetにする|高|
|Pin nose|`pin` tail型|語が不自然/重複|noseの標準基本語はpointed。`pin nose`はpointedとの差が定量定義されていない。現状はlength/pull-in違いだけ|中|
|Round pointed nose|`round-pin` tail型|概ね一致|英語は **Rounded point nose** が一般的。tip radiusを独立値にする|低|
|Wide nose|`round-pin` tail型|重大な分類誤り|wide/fullはtopologyではなくwidth12/area/fullness修飾子。さらにmapped presetの`tipScale=0`でsharp pointになる。`width12/fullness`制御へ移す|最優先|
|Round nose|`round` tail型|概ね一致|full roundとの差はwidth/areaで表す。tip radiusを計測可能に|低|
|Diamond nose|`diamond` tail型|部分不一致|特殊variantとして妥当だが、tail presetの`tipScale=0.12`を継承し中央tipがflat blockになる。中央単一tip＋左右shoulderが必要|高|
|Snub nose|`rounded-square` tail型|概ね一致|snub/bluntはcut-off topology。ただしangular/rounded cornerを名前だけで決めず`tipBlockWidth/cornerRadius`を持つ|中|
|Square nose|`square` tail型|**実装不能**|`tipRatio=0`→`capMode=false`。nose側は`buildGunTailSpline || buildCapTailSpline`のみで両方null、`boardCadNoseOnlyPlanform`がnullを返す。square tip block専用builderまたはfallbackが必要|最優先|

実装根拠: nose presetは`app.js:5662-5670`、alias normalizationは`5683-5694`、tail型への写像は`10083-10093`、nose生成呼出しは`10283-10288`。UI列挙は`index.html:396-405`。

## 3. 横断的な実装不一致

### 3.1 C0接続はfair outlineではない

`mergeOutlineWithCorners`はコメントとコードの両方でtail/nose接続を意図的に`continuous=false`とし、C1を切っている（`app.js:10144-10177`）。tail fallbackにも同様の処理がある。これは位置は連続でも接線が折れるC0接続である。

- square corner、swallow notch、diamond shoulder、batのtipなど「意味のある角」はC0でよい。
- **tail→rail、rail→noseのセクション境界は形状上の角ではないためG1必須、通常はG2目標**。
- overshoot回避を理由に接線を切るのではなく、join tangent constraint、handle長制限、curvature combで解くべき。
- UIの`Join blend / railBlend`は値を持つが、接続継続性の保証や測定値としてユーザーへ説明されていない。

### 3.2 noseは独自形状でなくtail builderの反転流用

`noseTailModeKey`でnose 8種をtail 7種へ落とし、`boardCadNoseOnlyPlanform`がtail presetの`tipRatio/tipScale/outerMode`を継承する（`app.js:10083-10093`, `10216-10275`）。このため:

- wideという前方面積の概念がround-pin tipへ誤変換される。
- nose独自の`width@6/12/18/24in`, `tipRadius`, `tipBlockWidth`, `fullness`, `pullInStart`がない。
- nose preset値の`shoulderPos/Scale`とtail presetのtip topologyが混成し、名前から期待する形状を保証できない。
- 12-inch nose widthという標準寸法がUI/生成constraintに存在しない。

### 3.3 alias normalizationが非可逆で形状差を消す

- `round-squash` / `rounded-squash`を無条件で`rounded-square`へ変換（`app.js:5676`）。調査上、squashの浅い凸podとrounded-squareのflat podは区別可能。
- `round-square` / `rounded-square` noseを無条件で`snub`へ変換（`5692`）。ブランド依存であり、tip blockの角丸量を確認せず統合すべきでない。
- import時はcanonical IDだけでなくsource term/brand/versionと幾何パラメータを保持し、曖昧aliasは確認対象にする。

### 3.4 preset名がトポロジー、程度、board archetypeを同列化

現UIは次を同じselectに混ぜている。

- topology: square, swallow, diamond, bat, snub
- continuous degree/preset: round, round pin, wide, round point
- board archetype: gun, fish
- ambiguous/proprietary name: rocket, star, split

推奨モデルは`topology + parameters + namedPreset/archetype`。例: `tail.topology=swallow, depth=12, tipSpacing=..., preset=fish_deep_swallow`、`nose.topology=point, fullness=.25, preset=gun_point`。

## 4. 修正優先順位（コード変更は今回未実施）

1. **P0:** Square noseを実装するか、一時的にUIから外す。選べるが効かない状態を解消。
2. **P0:** Wide noseをtopology enumから外し、`noseWidth12/fullness` modifierへ。現状のsharp-point写像を廃止。
3. **P0:** Starの形状を標準bat/starへ合わせるか、独自形状へ改名。Batとの関係を整理。
4. **P1:** tail/nose→rail joinをG1、可能ならG2 constraintにし、curvature combで検証。
5. **P1:** Diamondの中央flatを単一tipへ修正。Rounded diamondはtip radiusを明示。
6. **P1:** Round pinとPinをtip radiusで区別。Gun/Fishをarchetype presetとして分離。
7. **P2:** Split→Mini/Baby swallow、Half moon→Crescent/Half-moon、Round square→Rounded squareへ表示整理。
8. **P2:** `width@12in`, tip radius/block width, notch depth, tip spacing, pod curvatureを測定値としてUIとJSONへ追加。

## 5. 最小CP設計との整合案

- 基本round/point/pinは片側「tip anchor＋section join anchor」を基本としhandleで制御。
- square/snubはtip-block corner、swallow/fishは外tip＋中央notch、diamondはshoulder＋中央tip、bat/starは中央tip＋scoop＋外tipをsemantic anchorとして残す。
- section joinは編集用の余分な形状CPを増やす場所ではなく、G1/G2 constraint付きの接続点として扱う。
- **tail/nose末端anchorは削除しない。** tip radius、block幅、notch深さ、中央突起の制御に不可欠。

## 6. 参照した専門資料（詳細は調査01/04/35）

- Greenlight Surf Supply, Tail Design Guide  
  https://greenlightsurfsupply.com/pages/surfboard-tail-design-greenlight-surfboard-design-guide
- Greenlight Surf Supply, Outline Design Guide  
  https://greenlightsurfsupply.com/pages/surfboard-outline-design-greenlight-surfboard-design-guide
- Harbour Surfboards, Tail Shape / Design  
  https://www.harboursurfboards.com/design-2-1
- Surfing Waves, Surfboard Tail Shapes（統一輪郭図）  
  https://imgcdn.surfing-waves.com/board/tail_shape.htm
- Boardcave, Tails, Rails and Noses  
  https://www.boardcave.com/the-surfers-corner/cat/news/post/surfboard-shapes-tails-rails-and-noses

## 7. 監査上の注意

- `BoardCAD-Web-Linux`と隣接する`boardcad-web`の`app.js/index.html`はSHA-256が異なった。本報告は親タスクで参照指定されたうち、機能が新しく詳細な`BoardCAD-Web-Linux`側を監査対象とした。統合時には実際の配布/起動対象を再確認すること。
- 本監査は静的コード読解と調査資料照合。ブラウザ上の全preset画像比較や数値サンプリングは別途visual regressionで確認すると確度が上がる。
