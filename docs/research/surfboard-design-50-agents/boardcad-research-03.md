# サーフボード設計調査 03：テールの流体力学と相互作用

調査日: 2026-08-12  
対象: テール幅・面積・アウトライン曲率・角（コーナー）・テールロッカー・テールレールが、ホールド／旋回半径／リリース／浮力・揚力／速度へ与える影響

## 先に結論

テールは「squash / pin / swallow」等の名称だけでモデル化してはいけない。最低でも次を独立パラメータとして保持すべきである。

1. テール先端から 12 in（必要なら 18, 6, 3 in も）の半幅
2. 最後の 12 in の平面面積と、その長手方向分布
3. レールラインの曲率（連続曲率、曲率変化、wing/bumpによる不連続）
4. pod幅、コーナー半径、swallowの深さ・tip間隔
5. センターとレール双方のテールロッカー
6. テール厚、レール断面、hard edge の開始位置と鋭さ
7. bottom contour、フィン位置・面積・toe/cantとの関係

一般に、広く面積の大きいテールは低速で動的揚力を得やすく沈みにくい一方、強い波・高速・深いレール角では濡れ面／横方向の反力が増え、力を要したり滑りやすく感じたりする。狭いテールは沈めやすく、波面への適合とホールドを作りやすいが、低速時の支持面積と加速余力を失う。これは傾向であり、ロッカー、エッジ、フィンで大きく変わる。

## 因果関係の整理

| 設計変数 | 主な幾何・流体変化 | ホールド | 旋回 | リリース | 浮力・揚力 | 速度 |
|---|---|---|---|---|---|---|
| 12 in幅・末端面積を増す | planing面積と後方圧力支持が増す | 急斜面では相対的に弱まりやすい。ただしhard rail/finで補える | 低速でテールが沈み過ぎず回しやすいが、rail-to-railのロール慣性・反力は増える | 広いpod＋角なら明瞭 | 静的「浮力」より、滑走時の動的揚力増が本質 | 弱波で速度維持しやすい。高速では必ずしも低抵抗ではない |
| 幅・面積を減らす | 後方支持と濡れ幅が減る、沈めやすい | 強波・高速で波面にセットしやすい | rail-to-railは軽い。円弧はoutline/rocker次第で、必ず小回りとは限らない | 角がなければ拡散的 | 低速支持が小さい | 弱波では失速しやすいが、強波での制御余裕が増す |
| rail lineを直線的にする | 有効レール長・投影面積が増す | drive/方向安定に寄与し得る | drawn-out、軌道半径が大きい傾向 | 末端角があれば明瞭 | 面積を保持 | trim/直進で速い傾向 |
| rail lineの曲率を増す | 接水レール長が減り、回頭しやすい | フィン等が不足するとloose | tighter / rail-to-railが速い傾向 | 連続曲線なら滑らか | 面積が減りがち | 直進driveを犠牲にし得る |
| square/squashの角を鋭く | 流れの剥離位置を幾何的に固定 | エッジ／フィン次第 | snapのきっかけになる | clean/abruptなrelease | 角周りに面積保持 | 濡れた流れの巻き上がりを抑え得る |
| round/pinで角をなくす | 剥離位置がレール沿いに連続分布 | 狭幅ならhold大 | 滑らかでdrawn-out | diffuse/smooth | pinほど小さい | 「丸いから遅い」ではない。幅・ロッカー依存 |
| tail rockerを増す | 入射角・曲率、押し込み時の圧力と抗力が増す | steep faceへの適合・制御を作りやすい | back-foot pivotを強め、小さい弧を許す | 押し込みでテールを抜きやすい場合 | 条件次第で揚力も抗力も増加 | 通常はtrim/弱波速度を犠牲にする |
| tail rockerを平らに | 長い有効滑走面、低い迎角 | steep/hollowでcatchyになり得る | drawn-out、pivot性低下傾向 | hard edgeなら速く離れる | 低速planingを助ける | 弱波・直進でdrive/速度維持 |
| hard/down rail edge | 境界流の離脱点を明確化 | エッジを立てた際のbiteも作るが、薄さ・沈み込みが必要 | 反応が直接的 | clean release | rail volume次第 | tailでの余計なwrapを抑える方向 |
| soft/full rail | 流れが回り込みやすく、体積が大きい | forgivingだが高速で曖昧になり得る | 沈めにくく反応は穏やか | gradual | 静的体積・支持感が大きい | 条件によりdrag増。単独断定不可 |

### 用語上の注意：「浮力」と「リフト」

ボードの体積による静水中の浮力と、滑走時の圧力による動的揚力を分ける。平面テールを広げても厚さを増さなければ静的排水量の増加は限定的だが、速度があると後方のplaning面積が増え、テールが高く支持されやすい。CFD論文もサーフボードをplaning surfaceとして扱い、ロッカー増が解析条件下で揚力と抗力をともに増加させた。

## 各要素の詳細

### 1. 幅・面積

- tail width は tail shape と別物。業界ではtipから12 in地点を代表値にすることが多いが、1点だけでは面積分布を表せない。3/6/12/18 inの幅列か、最後の12 inの積分面積を併記する。
- 広いテールは弱波・低速で後足荷重を支え、減速を抑えながら方向転換しやすい。狭いテールはパワーのある波で沈めやすく、レールを波面に噛ませやすい。
- 「広い＝旋回半径が小さい」は条件付き。低速でpivotしやすい一方、直線的なrail lineと大きいロール抵抗を伴えば、rail-to-railや弧はむしろ大きくなり得る。
- 「狭い＝遅い」も条件付き。弱波の速度生成では不利だが、高速域の制御、濡れ面積、適正トリムが違うため最高速を単純比較できない。

### 2. アウトライン曲率、角、wing/bump

- 連続曲率の大きいoutlineは、一般に接水レールを短くして回頭しやすくする。直線的で平行なoutlineはdriveと長い弧を作りやすい。
- square/squashの角は水の離脱位置を決め、急なreleaseとsnappyな切返しを作りやすい。round tailは離脱をレールに沿って分散し、smoothな弧になりやすい。
- wing/bumpは広い前方テール面積を残しつつ、そこでrail lineを段階的に絞り、後端を沈めやすくする設計手段。単なる装飾CPではなく、曲率または接線の意図的変化として表現すべき。
- ただし「角が水を押してsquare turn」「丸みがround turn」はシェイパーの有用な経験則であり、独立した実験法則ではない。角の効果はpod幅、edge、迎角、レール傾斜、速度で変わる。

### 3. Swallow / fish

- swallowは幅と直線的なレールを保ちながら中央の面積を除き、左右に2つのtipを作る。よって「広いテールの低速planing」と「片側tip/railのbite」を両立させる狙いがある。
- 深さだけを動かすのは危険。tip間隔、切欠き面積、外側rail line、tip厚、フィン位置を連動させる。
- Greenlightのガイドはretro fishの観察的目安として、最後の1 ftの面積の約14%を切欠きで除く比率を示す。ただし査読実験値ではなく、テンプレート再現用の経験則として扱う。

### 4. テールロッカー

- rocker増加は波面の曲率に合わせやすく、後足で迎角を変えてpivot/brakeを作りやすい。その代わり、直進時の抗力と弱波での速度維持を損ないやすい。
- 2018年のURANS/VOF CFDでは、より強いrockerのモデルが静的解析でliftとdragの双方、maneuver条件でより大きな力を示した。一方、比較したround対squash tailでは解析条件下で有意な性能差が出なかった。従って、tail名称の効果をrocker以上に強く実装する根拠は薄い。
- centerline rockerだけでなくrail rockerを保存する。concaveがあると両者は一致せず、ターン中は傾いた片側のrail rockerが重要になる。

### 5. レール・エッジとの相互作用

- tailのhard edgeは水の離脱線を安定させ、速度とreleaseを作る設計意図がある。soft railは流れが回り込みやすく、遷移が穏やか。
- holdは「丸いrail」、releaseは「hard rail」と単純対応しない。実走ではrailの薄さ・体積・tuck、浸水深さ、フィン、波面への傾斜が同時に効く。
- wide tail + full rail は沈めにくくなりやすい。wide tailを保ちつつ応答性を上げるなら、tail foilを薄くする、wingで幅を落とす、hard edgeを早める、rockerやveeを調整する等が候補。
- narrow tail + high rocker + thin rail は高パワー向けのhold/controlへ寄るが、弱波では支持面とdriveが不足し得る。

## 俗説、成立条件、設計上の扱い

| よくある表現 | 判定 | より正確な扱い |
|---|---|---|
| 「square tailは速い、pin tailは遅い」 | 過度な一般化 | 弱波の速度維持は面積の大きいsquareが有利な傾向。速度域、rocker、濡れ面積、フィンを固定しない最高速比較は不可 |
| 「pinは最大hold」 | 条件付きで妥当 | 狭い面積・沈めやすさ・長い収束線が強波で有利。fin/railが不適切なら成立しない |
| 「roundはhold、squareはrelease」 | 経験則 | roundは滑らかな分散release、cornerは明瞭なrelease point。holdの多くは幅、rail、fin、rockerも担う |
| 「swallowは2つのpintail」 | 有用な比喩だが不完全 | 片側rail使用時のtipのbiteを説明するが、広い母体テールの面積・直線rail・fin配置も不可欠 |
| 「tail shapeが性能を決める」 | 誤解を招く | width/area/curve/rocker/rail/finの統合結果。CFDの限定比較ではround対squash差が検出されなかった |
| 「幅が増えるほど浮く」 | 用語が曖昧 | 厚み一定なら静的排水量も多少増すが、ライディング感の中心は動的planing lift |
| 「rockerを増すほどholdとturnが増す」 | 非単調・条件付き | steep wave適合とpivotを助けるが、drag/失速も増える。過剰なら推進を失う |

## CAD/Bezier実装への提案

1. **名称をプリセット、性能計算を数値幾何にする。** `tailType`は初期形状生成用とし、評価は幅列・面積・曲率・角・rocker・railから行う。
2. **CP数を減らしても末端制御を消さない。** 接続部の不要CPは除けるが、pod角、pin tip、swallow tip、切欠き最深点など「離脱点／端点」を表すCPは保持する。
3. **G2連続を基本、corner/wingのみ意図的非連続。** 通常のrail-to-tail接続は接線と曲率を滑らかにし、square corner、swallow tip、wingだけを意味のあるbreak pointとして扱う。
4. **測定値を自動表示。** tail 3/6/12/18 in width、last-12-in area、pod width、corner radius、swallow depth/tip spacing、center/rail tail rocker、hard-edge startを表示する。
5. **性能ラベルは確率的・条件付き。** 例: `weak-wave planing tendency ↑`, `steep-wave hold tendency ↑`。単独形状から速度や旋回半径を断定しない。
6. **比較試験を可能にする。** tail以外をロックしてA/B形状を生成し、面積を一定にした比較と幅を一定にした比較を分ける。

## 画像・図解資料（形状確認用）

以下は転載せず、リンク参照を推奨する。各図は名称よりも、幅・面積・rail line・break pointの読み取りに使う。

1. **Greenlight: pin / round / rounded pin図**  
   https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard-Tail-Shape-Design-pin-round-rounded-pin-tail_grande_82088aaf-fe7b-4b59-afff-7980119eecac_480x480.png?v=1581368457
2. **Greenlight: diamond / moon / bat / swallow図**  
   https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard-Tail-Shape-Design-diamond-moon-bat-swallow-tail_grande_c6388e08-6598-4dc7-a8eb-ca3397833631_480x480.png?v=1581368457
3. **Greenlight: tail width測定図**  
   https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_Surfboard_Tail_Width_480x480.png?v=1650567203
4. **Surf Hydrodynamics: tail類型図**  
   https://www.surfhydrodynamics.com/en/images/tails_surf.png
5. **Greenlight本文（複数の図解とfish寸法法）**  
   https://greenlightsurfsupply.com/pages/surfboard-tail-design-greenlight-surfboard-design-guide
6. **査読CFD論文PDF（CAD形状、圧力分布、自由表面図）**  
   https://pdfs.semanticscholar.org/b955/9fac13cb973f20a63af6078ae34d3c751fe6.pdf

## 主要出典と信頼度

### A: 学術・一次に近い

- Oggiano, L. et al. (2018), **Computational Fluid Dynamics as a Design Tool for Surfboards**. Proceedings 2(6), 309. URANS/VOFでbaseline squash、round tail、増加rockerを比較。解析条件内ではrocker差はlift/drag/操舵力に現れ、tail形状差は性能に現れなかった。限定された3形状・数値条件なので一般化は不可。  
  https://pdfs.semanticscholar.org/b955/9fac13cb973f20a63af6078ae34d3c751fe6.pdf
- Paine, M. (1974), **Hydrodynamics of Surfboards**. 古典的論文。planing、揚力、抵抗を考える基礎資料。  
  https://www.mpainesyd.com/filechute/paine_surf_thesis1974.pdf

### B: 専門シェイピング／設計資料（経験知として有力）

- Greenlight Surf Supply, **Surfboard Tail Design Guide**. tailをrail line、bottom、fin、foil、rockerとのsynergyとして説明。tail類型、fish切欠き比率、図解が豊富。数式の14%等は実験論文ではなく経験的テンプレート。  
  https://greenlightsurfsupply.com/pages/surfboard-tail-design-greenlight-surfboard-design-guide
- Surf Hydrodynamics / ShaperWavesDynamics, **Tail shape design of surfboard tails**. 幅、roll resistance、rail immersion、guiding effectで各形状を説明。専門的だが査読資料ではない。  
  https://www.surfhydrodynamics.com/en/Tail_shape_surf.html
- Vec Surfboards (Shawn Vecchione), **Outline**. tail widthとtail shapeの区別、平行線と連続曲率、wide/narrow tailの用途をshaper視点で説明。  
  https://www.vecsurfboards.com/blog/2015/6/5/outline

### C: 補助資料

- OpenShaper, **Surfboard Design Explained**. outline/rocker/rail/foil/bottomを統合して図示。一般向け要約として使用。  
  https://openshaper.com/surfboard-design-guide/
- SurfScience, **Surfboard Design Guide / Basic Tail Shapes**. 用語と代表形状の補助。  
  https://surfscience.com/topics/surfboard-design/  
  https://www.surfscience.com/topics/surfboard-anatomy/tail/basic-tail-shapes
- Surfit, **How To Choose A Surfboard – Your Tail**. 0/3/6/12/18 inで幅・厚み・rail・rockerを見る実務的説明と面積比較図。  
  https://shop.surfit.com/blogs/how-to-progress-your-surfing/how-to-choose-a-surfboard-your-tail

## 調査限界

- tail単独を他要素一定で比較した公開実験は少ない。多くの言説は熟練shaperとsurferの経験則である。
- 実走では非定常な波面、速度、ヨー・ロール・ピッチ、荷重位置、フィンが同時に変わる。平水CFDや静的解析から実走の「feel」を一対一で推定できない。
- 「hold」「drive」「release」「loose」には業界共通の厳密な計測定義がない。CADでは幾何値と推定ラベルを分離し、最終的には同一ライダー／同一条件のA/Bテストとフィードバックで校正する必要がある。
