# サーフボード設計調査 09：レールの性能・流体

調査日: 2026-08-12  
対象: rail volume、apex、soft/hard edge、tuck、engagement/release、速度・hold・forgiveness

## 結論

レールは `50/50`、`60/40`、`boxy`、`down` 等の単一ラベルでは表現不足である。最低でも各長手位置について次を保持する。

1. rail断面積またはrail volume（センター側の基準位置も定義）
2. 最大外幅点であるapexの高さと位置
3. deck側・bottom側の曲率半径
4. apexからbottomへ入るtuckの幅・深さ・半径
5. edgeの開始位置、半径（鋭さ）、連続的な変化
6. rail thickness、deck crown、bottom contourとの接続
7. nose→wide point→fin→tailのrail foil / transition

engagementとreleaseは反対語ではなく、一つの断面と速度・傾斜角が時間的に行う別の仕事である。前～中央の薄めで丸いrailは波面へ入りやすく、tailへ向けてtuckを減らしedgeを明瞭にすると流れを離しやすい、という長手方向のblendが現代的な基本。ただし小波／低速、強波／高速、ライダー体重と踏力、outline、rocker、bottom、finにより最適点が変わる。

## 用語を分離する

- **rail volume**: rail周辺に残す体積。断面最大厚だけではなく、deck crownからapex、bottom tuckまでの面積と長手分布。
- **apex**: 断面でboard中心から最も外側にある点、deck側曲線からbottom側曲線へ移る基準。`50/50`等は通常、rail曲線に対するapex比率を指し、board厚の厳密な50%とは限らない。
- **tuck**: apex下からbottom面へblendする丸み／内側への引込み。幅・深さ・曲率を持つ。
- **rail hardness**: 低apex・小半径・狭いtuck等、断面の曲がりの急さを指す場合がある。
- **edge hardness**: bottomとの境界の丸み半径。rail全体がsoftでもedgeを持てるため、前項と混同しない。
- **engagement**: 傾けたrailが波面に入り、流体反力と方向安定を生む過程。
- **release**: 付着／回り込む流れがbottom/edgeから離れ、濡れ面・抗力や横力が変わる過程。

## パラメータ別の傾向

| 変数 | engagement / hold | release / speed | forgiveness | 条件・反作用 |
|---|---|---|---|---|
| rail volume増 | 沈める踏力が増え、急斜面で高く弾かれやすい | 浮き戻り・projection感を作り得る | 低速で安定・bogしにくい | heavy rider/弱波では有効、軽量者/強波では過大になり得る |
| rail volume減 | 少ない力で入る、steep faceにsetしやすい | turn後の浮力回復が弱くbogし得る | 反応は敏感、許容範囲は狭い | 速度が十分なら有効、弱波では失速しやすい |
| apexを下げる（down rail） | bottom側半径/tuckが小さくなると付着力は減り得る | bottom有効幅と離水性が増す傾向 | direct、catchyにもなり得る | apexだけでなくvolume/edgeを固定して比較する |
| 大きい丸み・soft edge | 流れを曲げ、反力／hold感を作りやすい | wrapが続けばdrag増 | 滑らかでforgiving | 速度・迎角が上がると自然剥離も起きる |
| 小半径・hard edge | railを立てたbiteと剥離点を明確化し得る | clean release、planingに寄る | abruptでミスに敏感 | edge位置、fin、rail volumeで挙動が変わる |
| tuck増 | railを細くし、波面へ入れる余地／制御を作る | wrap経路が増えreleaseは遅くなり得る | smooth/control側 | 強波gunではtailにも一定tuckを残す例 |
| tuck減 | 有効bottom幅を増す | edgeと組み合わせて早いrelease | skatey/stiffになり得る | 小波performance tailで一般的傾向 |

## 1. Rail volume

- fuller/boxy railは静的排水量を外側へ置き、低速で沈み過ぎにくい。大柄・heavy-footed riderや弱波、短いboardで支持を作りやすい。
- ただし深くengageするにはより大きいモーメント／踏力が必要。急斜面・高速で過大なら、railが波面へ入らず跳ねる、またはcatch後に急反発する感触になり得る。
- thin/pinched railは少ない力で波面へ入り、steep faceのholdと感度を作りやすい。反面、低速で沈み過ぎると濡れ面と抵抗が増し、turn出口で浮力による回復が不足してbogする。
- 「薄いほどhold」「厚いほどspeed」は単調でない。速度、rider荷重、board幅とrail長に対する適正volumeがある。
- CADではmax thicknessだけでなく、例えばoutlineから内側50 mmまでの断面積と、その長手積分をrail-volume proxyとして表示する。

## 2. Apexと断面

- high/mid apexの対称的50/50 railはbottomからdeckへ連続する大きな曲率を持ちやすく、流れが回り込む。classic longboardやhullで滑らかなtrim/hold感に利用される。
- low apexのdown railはbottom側のtuckを狭くし、実効planing面を広げ、水がdeck側まで回り込む前に離れやすい。速度とdirect responseへ寄るが、安定した「吸着感」は減り得る。
- `60/40`という比だけでは半径、厚さ、tuck、edgeが不明。同じ60/40でもboxyとpinchedは別物。
- apexは長手方向に急変させず、volume foilと同期して滑らかにblendするのが基本。意図しないwavinessは局所剥離・catchの原因になり得る。

## 3. Soft / hard edgeと流れ

- 曲面に沿う流れはrailの方向へ曲げられ、その運動量変化に対応する反力がboardへ働く。大きい丸みは付着距離を伸ばしやすいが、剥離点は速度、曲率、入射方向、表面粗さで移動する。
- hard edgeは流れの剥離位置を幾何的に固定し、bottomからcleanに離す。濡れたwrapと関連dragを減らし、planing/releaseに寄せる。
- しかし「hard edgeは常に低drag」は誤り。低速・部分濡れ・斜め流ではedge/tuck周辺に剥離・再循環が生じ得る。Greenlightもsoft tucked edgeは一定速度以下で部分剥離と再結合による乱れがあり得ると説明する。
- hard rail/edgeがholdを増すか減らすかは文脈次第。波面へ立てた鋭い輪郭はbiteを感じさせる一方、流れを早く離すためwrap由来の横反力は小さくなる。holdには沈み込み、outline、rocker、bottom、finも必要。
- glassing/sandingでedge半径が変われば設計値と完成品が違う。CADはfoam shape radiusとfinished laminate radiusを区別するとよい。

## 4. Tuck

- tuckは単なる「丸み」ではなく、apexからbottomへどれだけ内側へ引くか。増すとrail volumeと実効bottom幅を減らし、softな水の遷移を作る。
- 現代shortboardの典型はnose/entry/wide pointでmoderate tuck・edgeなし、wide point後方からtuckを減らしedgeを発達、fin～tailでhard edgeへ移行。
- 小波板はtailのtuckを少なく、edgeを前方へ伸ばしてplaning/releaseを強める例が多い。powerful/hollow/big wave boardはcontrolのためtuckを残し、edgeをsoftenする例がある。
- よって「tailは常にno tuck + razor edge」を固定規則にしない。

## 5. Engagement / hold / releaseの時系列

1. boardをrollさせるとrail volumeと断面半径が沈み込み抵抗を決める。
2. engaged railのoutlineとrail rockerが波面上の経路を作る。
3. 丸い前～中央railは横流れを曲げ、方向反力とdampingを作る。
4. 後方へ進むにつれtuck減・edge増が水をbottomから離す。
5. tail railとfinがturn出口のprojection、release、次のrailへの切替を決める。

したがって断面1か所だけの「hold score」は不適切。nose、wide point、front fin、rear fin、tailの断面列と、rail rocker/outlineを合わせて評価する。

## 6. Forgiveness

- forgivenessは曖昧なfeel語で、少なくとも `catchしにくさ`、`荷重誤差への反力勾配の穏やかさ`、`低速でbogしにくさ`、`乱れた水面での安定` に分ける。
- soft/medium railは一般に反力変化が連続でcatchしにくい。ただしfullすぎれば沈めにくく、斜面で押し返されるため万人にforgivingではない。
- thin/hard railは小さな入力に反応しやすいが、適正速度と技術があればcontrolが高く「予測可能」と感じる場合もある。
- rider体重、足サイズ、stance、踏力を無視した初心者/上級者ラベルは避ける。

## 俗説と注意

| 俗説 | 判定 | 修正 |
|---|---|---|
| soft rail = hold、hard rail = release | 半分のみ | 付着と剥離の説明には有用だが、沈み込み・edge・fin・速度を含める必要 |
| hard railは速い | 条件付き | planing時のclean releaseには有利。低速や不適切なedge位置ではdrag/catchもあり得る |
| full railは浮いて速い | 条件付き | 弱波/重いriderで支持。過大ならengage不能・control低下 |
| thin railは高性能 | 条件付き | steep/high-speedでcontrol。低速ではbog、回復力不足 |
| 50/50はapexが板厚の真ん中 | 不正確 | rail curveの上下比を指すことが多く、deck/bottom planeの幾何中央とは限らない |
| Coandă効果がrailを吸いつける | 比喩として注意 | 実体は曲面に沿う流れ、圧力・運動量変化、粘性、自由表面の複合。「suction」単独で説明しない |
| edgeは鋭いほど良い | 誤り | safety/durability、速度域、controlとのtradeoff。noseまで同じ鋭さにしない |

## CAD / Bezier実装提案

1. rail断面を単一円弧や`railType` enumにせず、deck tangent → apex → tuck → bottom tangentを少数CPの連続曲線で表す。
2. apex CP、tuck深さ/幅、edge radiusの制御点は機能点なので残す。見た目を単純化する際も消さない。
3. 通常部はG2連続、hard edgeだけを意図的G0/G1 breakとして扱う。
4. nose/wide point/front-fin/rear-fin/tailのstationを持ち、loftでrail foilを作る。station間のapex・volume・edgeの急変をwarningする。
5. 表示値: `rail sectional area`, `apex height ratio`, `upper/lower radius`, `tuck width/depth/radius`, `edge radius`, `edge start x`, `finished edge radius`。
6. performance hintは条件付きにする: `low-speed support tendency`, `steep-face engagement tendency`, `planing release tendency`。
7. 同一outline/rocker/bottomでrailだけを変えたA/B形状と、同一rail-volumeでapex/tuckだけを変えた比較を生成可能にする。

## 画像・図解URL

1. Greenlight rail hydrodynamics図  
   https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard-Design-Hydrodynamics-water-flow-around-surfboard-rail-shape.png
2. Greenlight tuck / drag / release図（親ページ内）  
   https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide
3. Greenlight 50/50 noserider rail断面  
   https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_Longboard_50-50_Rail_Shape_Design_for_Noserider.png
4. Natural Curves: boxy/crowned、shortboard、semi-gun、XXL gun、midlength、classic LBのnose-widepoint-tail断面画像  
   https://www.naturalcurvesboards.com/html/designhtml/rails.html
5. Surf Hydrodynamics: boundary-layer / rail flow / separation図  
   https://www.surfhydrodynamics.com/en/rail_couche_limite.html
6. SurfScience: rail shaping写真と代表断面  
   https://www.surfscience.com/topics/surfboard-anatomy/rail/ignore-the-rail-at-own-risk/
7. OpenShaper: CAD rail cross-section図  
   https://openshaper.com/surfboard-design-guide/

CDNの直接URLは変更され得るため親ページも保持する。

## 出典と信頼度

### A: 学術・工学的基礎

- Oggiano et al. (2018), **Computational Fluid Dynamics as a Design Tool for Surfboards**. URANS/VOFによるsurfboardの自由表面、lift/drag、maneuver解析。rail単独比較ではないため、surfboardをplaning surfaceとして扱う基礎と研究不足の確認に使用。  
  https://pdfs.semanticscholar.org/b955/9fac13cb973f20a63af6078ae34d3c751fe6.pdf
- Paine (1974), **Hydrodynamics of Surfboards**. planing、圧力、抵抗の古典的基礎。rail断面の現代的A/B試験ではない。  
  https://www.mpainesyd.com/filechute/paine_surf_thesis1974.pdf
- Oggiano et al. (2020), **Hydrodynamic Characterization of Planing Surfboards Using CFD**. surfboard CFDの方法と限界。  
  https://pdfs.semanticscholar.org/f0e6/f889c6dfd8d1398ed2bacb323ed53c02d196.pdf

### B: 専門シェイピング資料

- Greenlight Surf Supply, **Surfboard Rail Design Guide**. volume、apex、tuck、edge、50/50/down/pinched/chineを詳細図解。最も包括的だが、定量主張の多くはshaper経験知。  
  https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide
- Natural Curves Surfboards, **Surfboard Rails**. rail featureをnose-to-tail foilとして多数のboard classで比較。専門家資料、査読なし。  
  https://www.naturalcurvesboards.com/html/designhtml/rails.html
- Surf Hydrodynamics / ShaperWavesDynamics, **Rail and boundary layer**. 曲率、剥離、流体運動量で説明し図・簡易式を掲載。モデル仮定が強く、実測検証値として扱わない。  
  https://www.surfhydrodynamics.com/en/rail_couche_limite.html
- SurfScience, **Ignore the Rail at Your Own Risk**. soft/hard/medium、tucked edgeの一般的説明。  
  https://www.surfscience.com/topics/surfboard-anatomy/rail/ignore-the-rail-at-own-risk/

## 調査限界

- rail断面だけを他要素一定で水槽／実走比較した査読一次研究はほぼ見当たらない。多くは熟練shaperの経験則。
- surfboard railは自由表面を横切り、非定常なroll/yaw、通気、spray、部分濡れを伴う。一般的な閉じた流路の境界層説明をそのまま適用できない。
- 「hold」「drive」「release」「forgiveness」は標準化された測定量ではない。CADでは幾何値と推定feelを分離し、同一rider・同一波条件のA/B試験で校正する。
