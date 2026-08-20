# サーフボード設計調査 15：ロッカー分類・測定・CAD表現

調査日: 2026-08-12

## 結論

rockerはnose liftとtail liftの2数値ではなく、基準線に対する全長の曲線である。同じ「nose 5 in / tail 2.25 in」でも、中央から均等に曲がるか、最後の12–18 inだけ急増するかで別設計になる。

最低限保存すべきもの:

1. bottom stringer rocker全曲線と測定datum
2. deck rocker全曲線（bottomとの差がfoil/thickness distribution）
3. 左右rail rocker全曲線
4. tipだけでなく、nose/tailから3/6/12/18/24 in等のoffset
5. 曲率 `κ(x)`、最小曲率区間、曲率変化率
6. bottom contourを適用する前後の基準rocker
7. finished board、foam blank、loaded/deformedの状態区別

## 用語整理

| 用語 | 推奨定義 | 注意 |
|---|---|---|
| Overall rocker | nose tipからtail tipまでのbottom/profile curve全体 | endpoint lift合計ではない |
| Bottom/stringer rocker | bottomのcenterline/stringerに沿う縦曲線 | concave/veeでrail rockerと異なる |
| Deck rocker | deck centerlineの縦曲線 | bottomとの差がfoil、volume distribution |
| Rail rocker | bottom rail/edgeに沿う縦曲線 | outline曲線上をたどるためx座標規約を明示 |
| Entry rocker | 水が入り始める前方区間のrocker | nose rockerと境界が統一されていない |
| Nose rocker | 前半またはtip側の上反り | tip lift値だけを指す用法もある |
| Center/mid rocker | 胸下～stance中央付近の曲線 | `flat spot`有無を決める |
| Tail/exit rocker | 後方、とくにfin cluster～tailの上反り | `tail kick`は末端の急増を指すことが多い |
| Continuous | 曲率が滑らかに連続するrocker | 「一定半径円弧」とは限らない |
| Staged | 区間ごとに性格の異なるcurveをblend | 不連続・kinkを意味しない |
| Flat spot | 曲率が非常に小さい有限区間 | 完全直線か視覚的flatか閾値が必要 |
| Natural rocker | 通常はblank製造時に入ったrocker | 性能上「自然な曲線」という意味ではない |
| Accelerated rocker | 特定端部へ曲率が急増する形 | 業界で境界・数式定義なし |
| Relaxed rocker | 比較対象より曲率/liftが少ない | 絶対分類ではない |

## 分類

### Continuous rocker

- noseからtailへkinkや明確なflat区間なく滑らかに流れる。G2以上の連続性が基本。
- `continuous`でも中央が緩くtip側が強いことはある。曲率一定ではない。
- 一般に波面へcurveを合わせ、rail-to-railや多様なarcを作りやすいというshaper経験則。曲率増は通常、直進planing/paddle効率とのtradeoff。

### Staged rocker

- flatter center、強いnose entry、tail kick等、異なる曲率区間を滑らかに接続したもの。
- stage境界は折れ線であってはならない。実物ではtangent/curvature blendが必要。
- 中央のdrive/planing面を残し、端部でsteep dropやpivotへ対応する狙い。ただし接続が急ならdrag/catch、挙動の不連続を生み得る。

### Flat spot / speed box

- `flat spot`は中央付近の低曲率区間。完全な直線を意味する場合と、目でflatに見える緩曲線の場合がある。
- Natural Curvesの`Speed Box`は独自の設計分類で、普遍的規格ではない。CAD標準語にするなら曲率閾値と長さで定義する。
- flat区間は実効planing surfaceとprojectionを増す傾向だが、長過ぎればturn arcが固定的／stiffになり、波面curveへの適合が下がる。

### Natural vs accelerated

- blank文脈の`natural rocker`は、blank supplierが成形した未加工rocker。シェイパーはtemplate位置やfoam除去でnose/tailを調整する。
- `natural curve`と混同しない。blank natural rockerにもstageや局所曲率があり得る。
- `accelerated nose/tail rocker`は端へ向かい曲率が速く増える形。tipだけflipした`kick`も近い用法だが、厳密な互換語ではない。
- CADでは名称でなく `κ(x)` と、nose/tail各区間のcurvature gainで表す。

## Overall / entry / nose / center / tailの境界

業界共通の固定境界はない。推奨する正規化区間:

- nose tip = 0%、tail tip = 100% とした場合
- nose rocker zone: 0–20%
- entry transition: 20–40%
- center: 40–60%
- exit transition: 60–80%
- tail rocker zone: 80–100%

これは解析用の暫定規約であり、実際のboard classに応じ変更可能にする。さらにtipからの実寸3/6/12/18/24 in stationを併記すれば、異なる全長間でもshaper慣行と比較できる。

## Stringer rocker vs rail rocker

- flat bottomなら同じx stationにおけるcenterとrailの縦高さは近いが、rail tuckとoutline projectionの影響は残る。
- single concaveはcenter bottomをdeck側へ掘り上げるため、center/stringer rockerがrail rockerより相対的にflatになる。
- vee/bellyはcenterが水側へ下がり、stringer rockerがrailより相対的に強くなる。
- turn中はboardが傾き、engaged rail rockerが波面上の経路を作る。stringer rockerだけでturn radiusを推定しない。
- `rail rocker`はrail curveに沿ったarc-length parameterで測るか、centerline x stationへ投影したzで測るかを明記。CAD比較には後者が扱いやすい。

## Datumと測定方法

### 標準的rocker stick法

1. boardをbottom-upに安定させる。
2. 長く真直ぐでたわまないstraightedgeをstringer上へ置く。
3. straightedgeを水平にし、rocker apex/接触基準を決める。
4. nose/tail tip、および一定stationでstraightedgeからbottomまでの鉛直距離を測る。
5. straightedge位置、水平基準、x station、glass-on fin回避offsetを記録する。

Greenlightはstraightedge中央をrocker apex付近に置き水平化し、tipだけでなく多数点を測る方法を説明する。測定点が多いほどcurveを再現できる。

### Datumの問題

- straightedgeがcurveへ接する位置を自由にすると、重心や置き方でdatumが変わる。
- `midpoint tangent datum`: boardのlength midpointにstraightedgeを接して水平。
- `best-fit chord datum`: 指定中央区間に最小二乗で直線fit。
- `nose-tail chord datum`: tipを結ぶ線。一般rocker stick値とは異なる。
- `machine/CAD datum`: 固定座標系の基準平面。最も再現性が高い。

データには `datum_method`, `contact_x`, `board orientation`, `station origin`, `units` を必須にする。異なるdatumのtip rocker数値を直接比較しない。

### 推奨測定セット

- straight-line board length（curveに沿う長さでない）
- tipから3/6/12/18/24 in、center、反対tipから同station
- centerline bottom、左右rail bottom、deck center
- finished laminate状態、fin除去/offset、温度・荷重なし
- laser/3D scanならcenter planeとboard symmetry planeをfitし、測定datumへ剛体変換

## 性能の条件依存

| 変更 | 典型傾向 | 反作用・条件 |
|---|---|---|
| overall曲率増 | steep face適合、短いarc、control | paddle/weak-wave drive低下、planing開始速度増 |
| entry/nose rocker増 | pearling/chop余裕 | 実効水線短縮、push water、wind catch |
| centerをflat化 | paddle/trim/projection | stiff、rail transition遅延、接続kinkに注意 |
| tail rocker増 | back-foot pivot、tight turn、brake/control | down-the-line speed/weak-section維持低下 |
| tail rocker減 | drive、speed維持 | steep pocketでtrack/catch、turn半径増傾向 |
| continuous化 | predictable smooth arc | 同じtip liftでも中央曲率が増えればdriveを失う |
| staged化 | flat centerと端部controlの両立狙い | stage位置・blend不良でdrag/不自然なfeel |

2018年CFD研究では比較した大rocker modelが解析条件下でliftとdragをともに増し、maneuver forceも増加した。よって「rockerはdragだけ」「rockerはliftだけ」の断定は不適切。限定された平水数値条件であり実走全般への定量一般化はできない。

## 用語混同・俗説

| 表現 | 問題 | 修正 |
|---|---|---|
| nose rocker 5 in | curve全体が不明 | 3/6/12/18/24 in値とdatumを併記 |
| continuous = 円弧 | 誤り | G2連続な可変曲率curveもcontinuous |
| staged = kink | 誤り | 性格の異なる区間を滑らかにblend |
| flat rocker = 直線 | 曖昧 | 比較的低曲率。flat spotは閾値で定義 |
| natural rocker = 良い/organic curve | 誤り | 多くはblank factory rocker |
| accelerated rocker = rocker量が多い | 不十分 | 端部へ曲率が増す率・位置の概念 |
| center rockerだけでbottomを表せる | 誤り | concave/veeではrail rockerが異なる |
| rockerが多いほどturnする | 条件付き | speed、outline、rail、fin、荷重が必要。過剰なら失速 |
| rockerが少ないほど速い | 条件付き | 弱波/直進で傾向。chop/steep faceでcontrol lossや追加dragも |

## CAD / Bezier実装提案

1. rocker curveはendpoint CPだけでなく、entry、center、exitの機能区間を少数CPで表す。ただしtip liftだけから自動生成しない。
2. 通常はG2/G3連続。`staged`は曲率分布を変えるが接線・曲率を切らない。flat spot端も滑らかにblend。
3. `natural/continuous/staged/accelerated`はgeometry preset。保存truthはsampled curveまたはspline＋datum。
4. center bottom、deck、left/right rail rockerを別curveとして表示し、bottom contour編集で連動関係を選べるようにする。
5. CP削減時もnose/tail末端CP、最大曲率変化を制御するCP、flat-zone境界CPは残す。
6. UIにcurvature comb/plotを表示し、意図しないflat、bump、reverse curvatureを検出。
7. endpoint値に加えstation table、curve length、curvature extrema、low-curvature-zone lengthを自動算出。
8. exportにはdatum定義とboard座標変換を含め、scan/rocker-stick値を同じ基準へ変換。

## 画像・図解URL

1. Greenlight Rocker & Foil Guide（測定図、異なるcurveで同tip値、典型値表、blank rocker図）  
   https://greenlightsurfsupply.com/pages/surfboard-rocker-and-foil-design-greenlight-surfboard-design-guide
2. Greenlight rocker stick測定図を含むbuilding guide  
   https://greenlightsurfsupply.com/pages/surfboard-building-guide-how-to-shape-surf-board
3. Natural Curves Rocker（bottom/deck/rail rocker、Speed Box/continuous/relaxed図）  
   https://naturalcurvesboards.com/html/designhtml/rocker.html
4. Beginner's Guide: rocker stickの写真・代表station図  
   https://abeginnersguidetoboardbuilding.wordpress.com/2017/11/28/rocker-measuring-and-shaping/
5. Bell: rocker illustration  
   https://bellsurf.com/pages/what-is-rocker-surfboard
6. Clark Foam blank catalog（blank natural rocker、命名・測定資料）  
   https://www.foamez.com/wp-content/uploads/2017/07/CF-Blank-Catalog-1.pdf
7. CFD論文PDF（比較CAD geometryと圧力図）  
   https://pdfs.semanticscholar.org/b955/9fac13cb973f20a63af6078ae34d3c751fe6.pdf

## 主要出典

- Greenlight Surf Supply, **Surfboard Rocker and Foil Design Guide**. rocker stick、tip値の限界、blank natural rocker、性能tradeoff。専門経験資料。  
  https://greenlightsurfsupply.com/pages/surfboard-rocker-and-foil-design-greenlight-surfboard-design-guide
- Natural Curves Surfboards, **Surfboard Rockers**. bottom/deck/rail定義、continuous/speed-box/relaxed分類と各board class。独自用語を含む専門資料。  
  https://naturalcurvesboards.com/html/designhtml/rocker.html
- Oggiano et al. (2018), **Computational Fluid Dynamics as a Design Tool for Surfboards**. rocker差のlift/drag/maneuver forceをURANS/VOFで比較。限定条件。  
  https://pdfs.semanticscholar.org/b955/9fac13cb973f20a63af6078ae34d3c751fe6.pdf
- Bris et al. (2021), **A Parametric Method to Customize Surfboard**. CAD parameterization参考。  
  https://cad-journal.net/files/vol_18/CAD_18%282%29_2021_297-308.pdf

## 限界

- rocker用語にISO等の統一規格は見当たらず、メーカー／shaper間でzone境界とdatumが異なる。
- endpoint値のみのカタログ比較からcurveや性能を復元できない。
- static rockerはライダー荷重・速度下のflexed rockerと異なる。flexを扱う場合は構造・荷重caseを別モデルにする。
