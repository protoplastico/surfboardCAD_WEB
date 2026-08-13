# サーフボード・エッジの性能／流体調査

調査日: 2026-08-12

## 0. 定義

- 本稿の`edge`はbottom surfaceとrail/tuckが接続する長手corner。rail全体のvolume/apexとは別。
- **hard edge:** 小さいcorner radius、接線方向が急変。flow separation位置を幾何的に固定しやすい。
- **soft edge:** 大きいradius/連続曲率。水がcornerを回りrail側へ付着し、速度・圧力勾配により下流でseparate。
- **tucked edge:** rail apexよりcenter側へinsetしたbottom corner。tuckDistanceとedgeRadiusは独立で、hard/soft双方あり得る。
- 現代boardはnoseからtailまで同じでなく、soft/round entry → soft 50/50〜60/40 middle → tucked hardening around fins → crisp/untucked tailへtransitionするのが典型。

## 1. Separation / release

- bottomを流れる水は慣性で直進しようとする。hard edgeの急角度ではsurfaceを回れずedgeで離れ、wake/spray/free-surfaceへ出る。これがclean/predictable release。
- soft radiusではboundary layerが曲面を回り、rail/deck側へ流れを偏向する。boardは反力を受けhold/immersive feelを得るが、wetted pathとpressure dragが増える。
- soft edgeでも速度、bank/迎角、adverse pressure gradientが十分ならseparateする。Greenlightは「soft tucked edgeほどreleaseに高いflow speedが必要」と説明。
- separationは二値でなく、位置が速度・surface roughness・気泡/ventilation・曲率・圧力勾配で移る。`hard=drag zero`ではない。

## 2. Hold

- holdは「吸着」だけでなく、attached flowをrail曲面で横へredirectする反力、immersed railのlateral resistance、bottom/fin/channelの合力。
- soft rail/edgeは水をwrapさせwave faceへsetしやすく、trim/noseriding/大波controlに意図的dragを使う場合がある。
- hard edgeもdownturned planeやrailが水を押すためbiteを持ち得るが、releaseが早すぎるとrail単独のwrap/holdは減る。tailではfinがそのcontrolを補う。
- `hard=edgeが水へknifeしてhold`という説明は不完全。薄いrail volume/apex、bank angle、finとの混合効果をedge hardnessへ誤帰属しない。

## 3. Drag / lift / speed

- soft/no-edgeはflow attachmentを長くし、濡れた曲面と偏向によるdragを増す傾向。50/50 no-edgeはhigh speedでもwrapしtop speedを抑えるとの専門見解。
- hard edgeはwettingをbottomで終わらせplaning releaseを明確化し、tail lift/acceleration/speed responseを得やすい。
- ただしedge後方のseparated wake、spray、vortexにもenergy lossがある。sharpest edgeが全条件で最小dragとは限らず、低速、chop、bank、free-surface近接で結果が変わる。
- edgeによるliftはedgeそのものが翼のように生むのでなく、手前のbottom/tuck面にpressureを保持し、water exit位置を規定する結果。

## 4. Soft-to-hard transition

- nose/entryではsoft edgeがlate drop/chopでcatchを和らげ、rail engagementをgradualにする。
- middle/wide pointではsoft〜defined tuckがtrim/forgivenessとreleaseを両立。
- front-fin手前4–6 in程度からedgeがdefinedになり、side fins〜tailでhard/crispになるGreenlightの典型例。正確な開始位置はboard/fin/rocker依存。
- transitionが急だと局所separation、turbulence、catch/hinge feelを作るため、edgeRadius/tuckDistance/apexを長手にfairに変える。
- Geoff McCoyのようにhard edgeをfin areaのみに限定する設計思想もあり、「tail全域hard」が唯一解ではない。

## 5. Tail区間

- tailはplaning時の主要exit。hard edgeがbottom flowをrailへ巻かず離し、drive/releaseとturn responseを高める。
- tail tipからside-fin trailing edgeまではcrisp untucked/nearly-square、そこから前へtucked/softeningするperformance構成がある。
- wide/square tail＋flat/concave＋hard edgeはplaning area/liftとreleaseが強く、小波speedに合うがhigh speedでskippyになり得る。
- narrow pin/round tail＋soft/rounder edgeはflowを長く保持しheavy waterでsmooth/controlを狙うが、drive/releaseは少ない。
- tail rocker増はedge前のbottomを上向きにしdrag/turnを増す。edge hardnessだけでtail性能を評価しない。

## 6. Rail / bottom / finとの相互作用

- down railはlow apex、tuckはbottom側inset、hardnessはedge radius。3軸を分離。
- concaveはrail近傍bottomをdownturnedにpresentしflowをcontainするため、hard edgeと組み合わせてpump/drive/releaseを強め得る。
- vee/convexはbankした片側panelからrail edgeへの角度を変え、soft rollならwrap、panel vee＋hard edgeなら明確なrelease。
- channel/chineにも追加edgeがあり、separation/hold lineを複数作る。主rail edgeと合成評価。
- finsがtailのlateral holdを担うため、hard release tailが成立しやすい。finlessではrail/bottom edgeのhold責任が増す。
- turn中のflowはnose-to-tailだけでなくbottomを斜めに横切り、wave-facing rounded railへ入り、反対側tail hard edgeから出るというGreenlightの説明が重要。

## 7. 条件依存と研究限界

- 支配変数: speed/Reynolds数、bank/trim/迎角、wetted length、wave face/free surface、chop/air entrainment、surface finish、flex。
- surfboard edge radiusだけを統制した公開CFD/水槽比較は乏しい。一般boundary-layer/separation理論は妥当でも実boardの定量値は未確立。
- Surf Hydrodynamicsサイトの力計算は機構理解のモデルだが、仮定したseparation位置による概算で検証済み普遍値ではない。
- 既存surfboard CFDは全体lift/drag/pitchやfinを中心とし、dynamic surfer、breaking wave、ventilationを単純化。edgeの優劣証明として過剰利用しない。

## 8. CAD表現／検証

各stationで:

```text
edgeRadius, tuckDistance, tuckRadius, edgeAngle,
apexHeight, railVolume, bottomPanelAngle,
edgeContinuity (soft/crease), surfaceFinish
```

- hard/soft enumでなく実radius＋導出ラベル。製造/lamination/sanding後の最小radiusも保存。
- tailからnoseへedgeRadiusとtuckDistanceをplotし、開始/最大hardness/fade位置を表示。
- hard edgeは実featureなのでCP/creaseを保持。soft transitionの余分なCPは減らせるがG2 continuityを検査。
- flow previewはcondition（speed, bank, trim）を必須入力にし、separation線を確率/範囲表示。
- repair/production検査用に左右edge radius、tail block周囲のcontinuity、over-sandingを測定。

## 9. 俗説チェック

1. hard edgeはdragがゼロ → separation wake/spray dragは残る。
2. soft edgeは遅いだけ → hold/control/forgivenessを意図して使う。
3. hard rail、down rail、tucked edgeは同義 → 独立幾何。
4. hard edgeほどholdが強い → wrap holdは減り得てfin/rail profileが補う。
5. edgeはtailだけの2D形 → nose-to-tail transitionとturn中の斜めflowが重要。
6. Coanda「吸着」を文字通りの真空吸引と説明しない。流れの偏向とpressure反力。

## 10. 画像・専門出典

1. Greenlight Rail Design Guide  
   https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide  
   tuck/soft-hard edgeのflow図、50/50 attachment、modern rail transition断面。中核専門資料。
2. Greenlight “How Water Flows Around a Surfboard’s Rail”  
   https://greenlightsurfsupply.com/blogs/news/how-water-flows-around-a-surfboards-rail  
   turn中の斜めflow、内側round railと反対側tail edge exitの図解。
3. Natural Curves Rail Anatomy  
   https://www.naturalcurvesboards.com/html/designhtml/rails.html  
   apex/tuck/edgeとnose-to-tail変化の断面画像。
4. McCoy Surfboards “Why Geoff McCoy’s Designs Have Less Hard Edge”  
   https://mccoysurfboards.com/why-geoff-mccoys-designs-have-less-hard-edge/  
   著名シェイパーによるhard/soft balanceとfin-area releaseの一次見解。
5. Surf Hydrodynamics – Rail and Boundary Layer  
   https://www.surfhydrodynamics.com/en/rail_couche_limite.html  
   soft/hard railのattachment/separation模式図と簡易力モデル。定量値は仮定依存。
6. OpenShaper Design Guide  
   https://openshaper.com/surfboard-design-guide/  
   CAD断面画像、soft/fullからhard tucked tailへのblend。
7. 2026 CFD with/without fins  
   https://www.tandfonline.com/doi/pdf/10.1080/10618562.2026.2668432  
   flow separation/vortex/全体lift-drag解析の研究例。edge単独比較ではない。

