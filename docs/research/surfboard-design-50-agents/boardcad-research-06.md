# サーフボード設計調査 06：ノーズの性能・流体・安全性

調査日: 2026-08-12  
対象: nose area / width / rocker / volume / railの相互作用と、paddling、wave entry、pearling、swing weight、duck dive、安全性

## 結論

ノーズを `pointed / round` の名称だけで実装してはいけない。少なくとも次を別々に管理する。

1. tipから3 / 6 / 12 / 18 in地点の幅と、前方12 / 18 inの平面面積
2. nose tip radius、outline曲率、wide point位置
3. entry rockerの全曲線（tip liftだけでなく胸下までの勾配・曲率）
4. deck rockerとbottom rockerの差であるfoil / volume分布
5. centerline rockerとrail rocker、bottom contour
6. nose railの厚さ・apex・soft/hard edge・chine
7. 材料密度を含む質量分布と、重心／ピッチ・ヨー慣性

広い／厚いノーズは前方の支持面積と排水量を増やし、適切なトリムではパドリング、早いwave entry、弱い波でのglideと安定性を助ける。一方、沈めるための力が増え、duck diveが難しく、遠い位置の質量増はswing weightを増す。狭い／薄いノーズは急斜面への適合、duck dive、空中や急な切返しで有利になりやすいが、胸下の支持が失われればパドル効率と早いentryを犠牲にする。

entry rockerは「多ければパーリングしない」という単純な安全装置ではない。増加は急斜面・chopへの余裕を作る一方、実効水線を短くし、押し水と抗力を増やしてパドル加速を悪化させ得る。pearlingはノーズ形状だけでなく、波の勾配、重心位置、takeoff角度、速度、荷重移動、全体rockerの結果である。

## 設計変数と性能傾向

| 変数 | paddling / entry | pearling / steep drop | turn / swing | duck dive | 備考 |
|---|---|---|---|---|---|
| nose幅・面積を増す | 胸下まで連続すれば支持・glide・早いentryに寄与 | 小波では沈み込みを抑えるが、急斜面ではrail/noseがcatchし得る | 質量も増せば慣性増、反応がゆっくり | 前方浮力・投影面積が増し沈めにくい | 面積だけでなく胸位置との重なりが重要 |
| nose幅・面積を減らす | 支持不足なら遅い／不安定 | 急斜面に収まり、catchしにくい傾向 | 先端質量が減れば素早い | 沈めやすい | pointed tip単独よりoutline全体を見る |
| entry rockerを増す | 実効水線短縮・押し水増で通常は遅くなりやすい | steep/chopでtip clearanceを作る | 曲がった波面に合わせやすい | 初期tipは入れやすい場合もあるが、総浮力が支配 | 過剰は失速・風受け |
| entry rockerを平らに | paddle/glide/弱波entryに有利 | late/steep dropでcatch・pearl余裕減 | front railが引っ掛かる可能性 | 幅・volume次第 | tipだけflipするstaged rockerもある |
| 前方volumeを増す | 静的支持とmomentum感、早期entry | noseが沈みにくいが、一旦潜ると復元・制動も大 | 材料重量増ならswing増 | 明確に不利 | 「litres総量」より配置が重要 |
| nose foilを薄くする | 胸下volumeを残せば影響を抑えられる | wave faceへのpenetrationと感度 | swing軽減 | 前方を沈めやすい | deck強度・耐久性とのtradeoff |
| soft/full rail | forgivingで水の遷移が穏やか | 大きいvolumeは斜面で押し返され/catchも | 反応は穏やか | 沈めにくい | noserider等で用途あり |
| pinched/chined rail | railを波面へ入れやすい | high-line holdやpearling回避補助になり得る | 敏感 | 体積減なら有利 | chine幅・角度過大は不均衡なlift |
| hard edgeを前へ延長 | 低rocker noseの水離れを明確にしplaning補助 | nose rail catchを抑える設計例あり | 直接的 | 効果は限定的 | 低速ではedge由来の乱流dragもあり得る |

## 1. パドリングとwave entry

- パドリングの主支持部は「tip」ではなく、ライダーの胸と重心の下まで続く前半部。tip 12 in幅だけを増しても、胸下幅・volume・rockerが変わらなければ効果は限定される。
- 広いノーズは面積とvolumeを前へ運び、同じライダー荷重で沈み込みを減らしやすい。弱波で速度を保持し、波速へ達するまでの余裕を作る。ただし総重量、表面状態、全長、waterline、ライダー姿勢も同時に効く。
- flatter entry rockerは一般に実効水線を長くし、迎角変化を緩くしてpaddle/glideを助ける。強いrockerは水を押す抵抗と上下動を増やし得る。
- 「pointed noseは水を切るので必ず速く漕げる」は俗説。低速のsurfboardは完全な排水型船首ではなく、ライダー荷重で多くのtipが水上に出る。支持面積とrocker/trimを無視した先端形状だけでは決まらない。
- wave entryは平水paddlingと別の非定常問題。波面が尾部を持ち上げ、board pitchと相対流速が変わる。広い前半部・flat rockerは弱い波への早期entryに寄るが、急な波では過剰な前荷重やlate takeoffに対する余裕が小さくなる。

## 2. Pearling / nosedive

pearlingはtipが水面へ入ること自体ではなく、boardが回復できず前方へ回転・急減速する状態として考える。

- 増したnose rockerはtip clearanceを増し、急な曲面やchopに接触した際の回復余裕を作る。
- しかしrockerがあっても、ライダーが前過ぎる、速度不足、tailが波に持ち上げられる、takeoff角が岸向き過ぎる等でpearlする。
- wider/full noseは弱い波でplaning supportを増し沈下を抑え得るが、急斜面で片側front railが水を掴む面積も増える。したがって「round noseはpearlしない」とは言えない。
- narrow/thin noseは一時的に水へ入っても抵抗・pitch momentが小さく回復しやすい可能性がある。pointed shapeの価値は「水を切る」だけでなく、前方面積・volume・rail長を減らすことにある。
- bottom concave/chine/edgeは局所liftや水離れを変えるが、単独でpearling防止を保証しない。

## 3. Swing weightと旋回

- swing weightは単なるvolumeではなく、回転中心から離れた**質量**で決まる。慣性モーメントは概念的に `I = ∫r² dm` なので、tip近くの同じ100 gは中央付近より大きく効く。
- EPS/PU密度、glass schedule、resin、補強材を無視し、geometry volumeだけからswing weightを断定してはいけない。
- wide/thick noseは多くの場合材料と表面積も増し、pitch/yaw慣性が増える。smoothでmomentumのあるturnに使える一方、quick re-entryやairでの回し込みは遅くなる傾向。
- boardを短くすれば同じwide noseでも回転中心へ近づき、慣性増を抑えられる。このため「wide nose＝必ず曲がらない」は誤り。
- outline curve、wide point、tail pivot、finが実際の旋回半径を支配するため、nose慣性は応答速度の一要因として扱う。

## 4. Duck dive

- 原理はnoseを先に沈め、board全体を水中へ傾け、その後tailを押し込む動作。必要力は総浮力だけでなく、押す位置より前方／周辺のvolume分布、幅による水抵抗、長さ、surfer体重・腕長・技術、波の流れで変わる。
- 同じlitresでもwide/full noseのboardは、narrow/thin noseより初動を沈めにくい。よってCADには総volumeだけでなく `front 12/18/24 in volume` を出す価値がある。
- strong nose rockerはtipのごく先端を水面へ向けやすいことがあるが、その後board全体を沈める仕事量は消えない。「rockerが多いほどduck diveが容易」と一般化しない。
- 長板・高volume板はturtle roll等が現実的であり、duck-divabilityを性能の絶対尺度にしない。

## 5. Rail / foil / bottomとの相互作用

- nose railは多くのmodern boardでsoft/fullからtailのhard/downへtransitionする。soft nose railは乱れた流れにforgivingだが、fullすぎると急斜面で押し返され、沈めにくい。
- pinched railはcenter volumeを残しつつrail volumeを減らし、wave faceへ入りやすくする。Greenlightはchined nose railがnoseriderで局所liftとpearling回避を補助し、pinched railがsteep faceのhigh-line holdを助けると説明する。ただし専門経験知で、定量実験ではない。
- hard edgeをnoseまで延長する設計は、水のwrapを抑えて低entry-rocker boardのcatchを軽減し得る。ただし低速時はedgeが乱流抵抗を増す可能性があり、常に速いわけではない。
- centerline rockerだけでは不十分。single concave等でrail rockerが異なると、傾けた際のfront rail接触が変わる。

## 6. 安全性

- pointed noseは性能要素であると同時に衝突時の小さな接触面積を持つ鋭利な突起。1998年の11症例レビューでは、surfboard直接外傷による重い眼損傷の最頻機序がsharp noseとの衝突で、9例が眼球破裂、5例が歩行視力水準まで回復しなかった。
- NSWの1年間前向き調査ではsurfboard関連眼外傷10例中2例が眼球破裂、4例が眼窩骨折、6例が眼瞼裂傷。nose、fin、tailを含むsharp projectionsが原因で、著者らはboard modificationとprotective eyewearがリスク低減に役立つ可能性を述べる。
- したがってCADでは見た目だけのゼロ半径tipを避け、`minimum nose tip radius` と実物のlaminate後半径を明示する価値がある。初心者・混雑環境・school boardにはround/blunt tipまたはnose guardを推奨できる。
- ただし「丸めれば安全」は不十分。board全体の質量・速度、fin、tail corner、leash recoil、他者との距離が傷害severityを左右する。性能プリセットと安全プリセットを別レイヤーで表示する。

## 俗説と条件依存

| 表現 | 判定 | 正確な扱い |
|---|---|---|
| 「wide noseはpaddleが速い」 | 条件付き | 胸下まで続く面積・volumeと適正trimなら有利。tip幅だけ、過剰幅、過重量では成立しない |
| 「point noseは水を切るから速い」 | 過度な単純化 | 低速paddlingではwaterline、rocker、支持面積、摩擦・造波抵抗が重要。tipは多くの時間水上 |
| 「nose rockerを増せばpearlしない」 | 誤り | steep-face余裕は増すが、過剰rockerはpaddle/entryを遅くする。荷重・波・速度でpearl可能 |
| 「round noseは小波専用」 | 過度な一般化 | longboard/noseriderや特殊hull等、用途は幅広い。rail、foil、rocker、全長との組合せ |
| 「thin noseは反応が速い」 | おおむね傾向 | geometryが軽量化につながる場合。材料構成が重ければswing weightは下がらない |
| 「litresが同じならduck diveも同じ」 | 誤り | 前方volume分布、幅、長さ、rocker、surfer体格・技術で大きく違う |
| 「nose concaveがliftを生む」 | 条件付き | 迎角・速度・濡れ面が必要。dragやrail rocker変化も伴い、常時上向きliftとは限らない |

## CAD / Bezier実装提案

1. `noseType`はプリセット名に留め、性能評価は幅列、前方面積、front volume、rocker曲線、rail sectionから行う。
2. tip CPとtip直後のshape CPを保持する。nose tip radiusとoutline接線を別制御できるようにし、接続部の冗長CPだけを減らす。
3. 通常outlineはG2連続。beak、hip等の意図的breakだけを非連続点として表す。
4. `width@3/6/12/18in`, `area_front12/18`, `volume_front12/18/24`, `tip_radius`, `nose_lift`, `entry slope/curvature`, `rail rocker` を表示する。
5. 質量密度とglass scheduleがある場合は重心とpitch/yaw inertiaを計算し、geometry-onlyの「swing weight proxy」と区別する。
6. pearling riskは断定値にせず、wave steepness、takeoff speed、rider positionを入力した条件付きwarningにする。
7. pointed tipには安全警告とminimum finished radiusを設ける。softboard/school presetではblunt noseを既定にする。

## 画像・図解掲載ページ／直接URL

1. SURFit: wide / mid / narrow nose比較、nose rocker、duck dive、厚み比較を同一ページに掲載  
   https://shop.surfit.com/pages/how-to-choose-a-surfboard-the-nose
2. SURFit: nose comparison画像（ページ内画像リンク）  
   https://shop.surfit.com/cdn/shop/files/How-To-Choose-A-Surfboard-Nose-Nose-Comparison.jpg
3. Greenlight: rail shape図、50/50 noserider rail、chine / edge説明  
   https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide
4. Greenlight: 50/50 longboard rail図（元ページ画像）  
   https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_Longboard_50-50_Rail_Shape_Design_for_Noserider.png
5. SurfScience: pointed / rounded point / round nose図解  
   https://www.surfscience.com/topics/surfboard-anatomy/nose/the-nose-knows
6. OpenShaper: outline、rocker、foil volume distribution、rail断面のCAD図  
   https://openshaper.com/surfboard-design-guide/
7. Medical Journal of Australia: 症例表を含む眼外傷論文PDF  
   https://www.mja.com.au/system/files/issues/201_09/how00567.pdf

注: CDN画像URLは配信側でファイル名やqueryが変更される可能性があるため、親ページURLも必ず保持する。

## 出典

### A: 医学・学術資料

- Dimmick et al. (1998), **Surfing-related ocular injuries**, Ophthalmology. 直接board外傷11症例、sharp noseを主要機序として報告。  
  https://pubmed.ncbi.nlm.nih.gov/9801037/
- Howden et al. (2014), **Surfboard-related eye injuries in New South Wales: a 1-year prospective study**, Medical Journal of Australia. 前向き調査、board modificationの可能性にも言及。  
  https://www.mja.com.au/journal/2014/201/9/surfboard-related-eye-injuries-new-south-wales-1-year-prospective-study
- Oggiano et al. (2018), **Computational Fluid Dynamics as a Design Tool for Surfboards**. rocker増が解析条件下でliftとdragをともに増した。nose単独研究ではないため、rocker一般の補助根拠として使用。  
  https://pdfs.semanticscholar.org/b955/9fac13cb973f20a63af6078ae34d3c751fe6.pdf

### B: 専門設計資料

- Greenlight Surf Supply, **Surfboard Rail Design Guide**. nose edge、50/50/pinched rail、chineとrocker/foilの相互作用。シェイピング経験知であり査読実験ではない。  
  https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide
- SURFit, **How To Choose A Surfboard – Your Nose**. wide/narrow/thin/thick、rocker、swing weight、duck diveを写真比較。専門商業資料で定量試験ではない。  
  https://shop.surfit.com/pages/how-to-choose-a-surfboard-the-nose
- SurfScience, **The Nose Knows**. 代表noseとdrop/duck dive/paddleの関係。  
  https://www.surfscience.com/topics/surfboard-anatomy/nose/the-nose-knows
- OpenShaper, **Surfboard Design Explained**. outline、rocker、rail、foil/volume distributionの統合説明とCAD図。  
  https://openshaper.com/surfboard-design-guide/

## 調査限界

- noseだけを他の全要素一定で比較した公開水槽・実走研究は乏しく、多くはshaper/surferの経験知。
- paddling、takeoff、pearlingはライダー姿勢と波の非定常流が大きく、平水dragや単一寸法から予測できない。
- swing weightをvolumeから直接求めることはできない。完成品の密度分布が必要。
- 安全研究は重症例中心で母集団が小さい。pointed noseの危険性を示す一方、特定tip radiusによるリスク低減量は確立していない。
