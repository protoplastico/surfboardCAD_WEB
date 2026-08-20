# サーフボード設計調査 12：ボトムコンター分類とCADトポロジー

調査日: 2026-08-12

## 最重要の定義

ボトムコンター名は原則として**ストリンガーに直交する横断面**を表す。縦方向には常にrockerがあるため、`flat bottom`は3D平面ではなく「各横断面がrail-to-railにほぼ直線」という意味である。single concave等も、横断面の凹形状がnose-to-tailに深さ・幅を変えながら連続するcompound surfaceである。

CADでは名称をsurface primitiveにせず、各x stationの横断面 `z(x,y)` と、その長手方向blendを保存する。centerline rockerだけを編集してconcave/veeを作るとrail rocker、厚み、volumeが意図せず変わる。

## 基本3分類

- **flat**: 横断面がほぼ直線。center bottomとrail-side bottomが同高。
- **concave**: centerまたは複数の溝側がrail-side基準よりデッキ方向へ凹む（bottom面が上がる）。single/double/channelを含む。
- **convex**: center側がrail-side基準より水側へ張り出す。belly/roll/veeを含む。

実物はこの3つを長手方向・幅方向に組み合わせる。`single-to-double-to-vee`は、分類名1個でなく遷移列である。

## 分類表

| 名称 | 横断面の幾何 | 長手方向の典型 | CAD上の特徴線 |
|---|---|---|---|
| Flat | rail間が直線／低曲率 | 全長または区間限定 | center/quarter/rail rockerがほぼ同じoffset関係 |
| Belly / Roll / Convex | centerが最も低く、railへ丸く上がる | nose/entry、hull全長、rolled veeへのblend | 滑らかな中央極小、G2曲面 |
| Single concave | centerが最も高い一つの凹み | entry後からfin前後、tailでfade | center極大、左右対称の連続曲率 |
| Double concave | stringer ridgeを挟む左右2凹み | single内に発生しtailへ、または独立 | center ridge＋左右troughの3 feature lines |
| Panel vee | centerが最も低いridge/keel、左右が平面状にrailへ上がる | tail側に増加しpodでfade等 | center crease、左右panel、rail lines |
| Rolled vee | veeの左右panelが凸曲面 | mid/tail、hull系 | center keel＋G2 convex panels |
| Concave vee / vee double | center keelの左右が凹む | fin～tail | center ridge＋左右concave、rail rockerを分離 |
| Spiral vee | vee量／panel角がx方向に連続変化する設計群 | 通常tailへ向け変化 | `vee angle(x)` とconcave depthを連続制御 |
| Reverse vee | veeピークが前～中央にありtailへflat等にfade | gun、forward-foot design等 | 最大vee stationがwide pointより前方の場合あり |
| Channels | 母体bottomへ複数の細長いgroove/ridge | midからfade-in、通常tailへ抜く | 各channelのentry/exit、ridge、wall edge |
| Chine / bevel | rail近傍の面取り面。bottom中央分類ではない | noseのみ／全長／tail fade | inner/outer chine edge 2本 |
| Hull / displacement hull | 単一断面名ではなくconvex bottom、soft rail、foil/rocker等の統合 | belly entryからrolled/flat等 | 複数stationの連続convex surface |

## 1. Flat

- 「完全に平ら」ではなく横断方向flat。長手方向にはrockerを持つ。
- flowを強く横方向へ曲げるfeatureが少なく、予測可能で効率的というshaper経験則がある。turnではfin、rail、outline/rockerへの依存が大きい。
- wide flat bottomはroll開始に力が要る場合があり、chopでslapしやすい。従ってflat=loose/fastと一律にしない。
- CAD: 各stationのbottom central panelを直線制約にし、rail tuckへのblendは別曲線にする。

## 2. Belly / convex / hull

- belly/rollは滑らかな凸横断面で、水を左右へ分け、rail-to-railのrollを始めやすい傾向。低速ではdisplacement的感触、濡れ面増や不安定さを伴い得る。
- `displacement hull`はbellyと同義ではない。一般にconvex entry/bottom、pinched/soft rail、特定foil/rocker等を統合したboard design family。
- `rolled vee`は中央keelを持ち左右も丸い凸面。単純bellyとの境界は用語上曖昧。
- CAD: center keelを明示するか、単一の滑らかな凸曲率かを分ける。hullを一つの断面プリセットに縮約しない。

## 3. Single concave

- 一つの中央凹み。幾何的にはcenter bottomがrail-side bottomよりデッキ側へ上がるため、**centerline rockerを相対的にflatにする**か、rail rockerを相対的にcurvedにする。
- 深さだけでなく幅、edgeへのfade、開始・最大・終了stationが性能とshapeを決める。
- 「水をchannelしてlift/speed」は代表的説明だが、自由表面、迎角、速度、ventilationで結果は変わる。深いほど速いとは限らず、drag、tracking、chopでの不安定もあり得る。
- CAD: `depth(x)`, `halfWidth(x)`, cross-section exponent/curvatureを持つ。center rocker固定かrail rocker固定か、編集基準を明示する。

## 4. Double concave

- 左右2つのconcaveをstringer ridgeが分ける。`double`は単なるsingleの中央に線を描くことではない。
- single concaveの内部に浅いdoubleが入る形は非常に一般的で、外側全体はなおsingle envelopeを持つ。資料によりこれを`single-to-double`、`double within single`、`vee double`等と呼ぶ。
- center ridgeがrailより低ければ全体はvee性を持ち、railより高ければsingle envelope内のdoubleになり得る。名称だけでは高さ関係が不明。
- CAD: center ridge、左右trough、outer shoulder/railの少なくとも5点を高さ関係付きで保持する。

## 5. Vee / spiral / reverse

- panel veeはcenter stringerが水側へ最も低く、左右のpanelがrailへ上がる凸断面。boardを片側panelへrollしやすくする目的でtailに多用。
- veeはcenter rockerを増やす一方、rail rockerを相対的にflatにする。concaveとはcenter/rail rocker関係が逆。
- concave vee（double-concave vee）はveeの左右panelを凹ませる複合形。
- `spiral vee`は統一定義が弱い。多くは長手方向にvee/panel orientationや量が変化するbottomを指し、double concaveからtail veeへのblendをそう呼ぶ資料もある。回転する数学的螺旋と解釈しない。
- `reverse vee`も「通常のtail veeと逆」の位置的名称で、前～中央にveeピークを置きtailでflat/shallower contourへfadeする用法が多い。
- CAD: `veeHeight(x)` またはpanel dihedral angleを数値化し、spiral/reverseはそのx分布プリセットにする。

## 6. Channels

- channelsはsingle/double concaveと同じ大域曲面ではなく、既存のflat/concave/convex母体へ刻む複数の局所groove。
- 通常4～8本、tail区間、fin toeに近い方向で配置する例が多い。fade-inする盲端とtailへ抜けるopen exitがある。
- 深さ、幅、wall angle、toe、長さ、entry fade、exit topologyが必要。単なるテクスチャや等深溝ではない。
- channel wall/ridgeは意図的な曲率不連続となり得る。CNC・lamination・sanding、fin box干渉、薄いtailの強度も制約。
- CAD: base surfaceからのmodifierとして実装し、各channel centerlineに沿うsweep/cut。entryは深さ0からG1/G2 fade、tail exitはboundaryまで開く。左右対称を任意解除可能にする。

## 7. Chine

- chineはrail近傍に設けるbevel/panelとその境界で、bottom全体のconcave分類とは別軸。hard chineは明瞭なedge、soft chineは丸くblend。
- rail volumeを中央volumeから切り離す、planing幅／release lineを変える、catchを避ける等の意図があるが、角度・幅・位置次第。
- `chine`をchannelと混同しない。channelは長手groove、chineは主にrail-borderの面／折線。
- CAD: outlineからのoffset曲線をinner chine lineとして持ち、rail側outer boundaryとのpanelを作る。幅・angle・edge radiusをx方向に変化。

## 名称混同・俗説

| 表現 | 問題 | 正確な扱い |
|---|---|---|
| flat bottom | 3D平面と誤解 | rail-to-rail横断面がflat、縦にはrocker |
| concave = channel | 尺度が違う | concaveは大域横断面、channelsは局所groove |
| vee = double concave | 高さ関係を無視 | veeはcenterが低い。doubleは左右trough。複合可能 |
| belly = hull | board familyを断面へ縮約 | hullはrocker/foil/railを含む統合設計 |
| spiral vee | 数学的spiralと誤解 | 業界用語は不統一。vee量と位置のx分布で記録 |
| concaveはliftとspeedを生む | 条件依存 | 迎角・速度・幅・深さ・exit・rocker/railでdrag/holdも変化 |
| veeは遅いがturnしやすい | 過度な一般化 | roll transitionを助ける傾向。panel角、rail rocker、速度で異なる |
| channelsは水を加速する | エネルギー表現が曖昧 | 流向・圧力・wet area・separationを変える。無条件の速度増ではない |

## CADトポロジー提案

1. **基底面 + feature modifier**: rocker/outline/railでbase bottomを作り、single/double/veeを大域modifier、channel/chineを局所modifierとして順序付き適用。
2. **横断station列**: nose 12in、wide point、front foot、front fin、rear fin、tail等。各断面を同じpoint topologyでloftする。
3. **feature lines**: center、double troughs、vee shoulders、channel walls、chine inner/outer、rail edgeを縦方向curveとして保持。
4. **高さ基準を選択**: center rocker固定、rail rocker固定、volume保持のいずれでcontour変更するかUIに明示。
5. **連続性**: 通常blendはG2、channel wall/hard chine/center panel vee creaseのみ意図的G0/G1。fade-in端でzero-depthかつ接線連続。
6. **自己交差防止**: 深いconcave/channelがdeck thickness、fin box、rail tuckを破らないminimum skin/thickness constraint。
7. **数値表示**: depth/height at x、width、area difference、center-vs-rail rocker、panel angle、channel toe/wall angle、chine width/angle。
8. **名称は派生ラベル**: 幾何から`single → double-within-single → concave vee`等を判定し、名前を直接geometry truthにしない。

## 画像・図解URL

1. Greenlight Bottom Contour Guide（flat、flow、panel/rolled/concave vee、single/double、channelの多数図）  
   https://greenlightsurfsupply.com/pages/surfboard-bottom-contour-design-greenlight-surfboard-design-guide
2. Greenlight concave-in-vee図（親ページ画像）  
   https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_Concave_in_Vee_Tail_bottom_shape_contour.png
3. Greenlight panel vee図（親ページ画像）  
   https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_Panel_Vee_shape_in_surfboard_bottom_helps_turn_board.png
4. SurfScience Bottom Contour（flat、belly、concave、vee図）  
   https://www.surfscience.com/topics/surfboard-anatomy/bottom-contour/bottom-contour/
5. Natural Curves Bottoms（各board classのnose/widepoint/tail断面比較）  
   https://www.naturalcurvesboards.com/html/designhtml/bottoms.html
6. SurferToday contour guide（double concave等の写真）  
   https://www.surfertoday.com/surfing/the-complete-guide-to-surfboard-bottom-contour-designs
7. Parametric surfboard CAD論文PDF（surface/section modeling参考）  
   https://cad-journal.net/files/vol_18/CAD_18%282%29_2021_297-308.pdf

## 出典と信頼度

- Greenlight Surf Supply, **Surfboard Bottom Contour Design Guide**. 断面基準のflat/concave/convex定義と複合形を最も詳細に図解。本文自身がconcave科学研究の不足と一般化不能を明記する専門経験資料。  
  https://greenlightsurfsupply.com/pages/surfboard-bottom-contour-design-greenlight-surfboard-design-guide
- Natural Curves Surfboards, **Surfboard Bottom Contours**. single/double/vee/reverse veeをnose-to-tail stationで比較。専門資料、査読なし。  
  https://www.naturalcurvesboards.com/html/designhtml/bottoms.html
- SurfScience, **Bottom Contour**. flat、belly、concave、veeの入門図。  
  https://www.surfscience.com/topics/surfboard-anatomy/bottom-contour/bottom-contour/
- Bris et al. (2021), **A Parametric Method to Customize Surfboard**, Computer-Aided Design & Applications 18(2), 297–308. パラメトリックCADの一次資料。性能分類の根拠ではなくtopology参考。  
  https://cad-journal.net/files/vol_18/CAD_18%282%29_2021_297-308.pdf
- Oggiano et al. (2018), **Computational Fluid Dynamics as a Design Tool for Surfboards**. bottom curvatureの異なるboard比較を含むが、全contour分類の独立検証ではない。  
  https://pdfs.semanticscholar.org/b955/9fac13cb973f20a63af6078ae34d3c751fe6.pdf

## 限界

- bottom contour単独を他要素一定で比較した査読実験は少なく、速度・lift・hold説明の大半はshaper経験則。
- 実走は自由表面、非定常roll/yaw/pitch、通気、fin干渉を含み、単純な「水路」比喩では不十分。
- 用語は地域・年代・shaperで異なる。データ交換では名称とともにstation断面、feature寸法、基準rockerを保存すべき。
