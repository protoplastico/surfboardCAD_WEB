# サーフボード設計調査 33：HPSB / Groveler / Fish / Step-up / Gun の設計システム差

調査日: 2026-08-12

## 結論

これらは厳密な幾何分類でなく、市場・文化・用途を含むdesign familyである。性能を名称から決めず、outline、rocker、foil/volume、rail、bottom、tail、finを独立数値化し、その組合せをpresetとして扱う。

典型的な設計目的:

- **HPSB**: 中～良質波でvertical maneuverと高速rail turn
- **Groveler**: 小さく弱い波で低速planingとspeed generation
- **Fish**: 短い全長、幅・平行rail・低rocker・広いswallow/twin系によるflow/drive（retro～modernで幅広い）
- **Step-up**: daily shortboardより長く細く、強い／急な波でpaddle、entry、hold/control
- **Gun**: very large/high-speed waveで早いentry、directional stability、control、survival margin

## 統合比較

| Family | Outline | Rocker | Rail / foil | Bottom | Tail | Fin |
|---|---|---|---|---|---|---|
| HPSB | narrow nose、continuous curve、tail中幅 | moderate-high continuous、tail curve | medium-thin、低volume、tail hard edge | single→double、vee fade等 | squash/round/swallows | thruster中心、quad option |
| Groveler | short/wide/full、wide tail | low/relaxed、flat center | fuller、volumeを外へ、tail release | flat～single/double、控えめvee | wide squash/square/diamond | thruster/quad/twin+trailer |
| Retro fish | very short/wide、平行rail、wide point前寄り | low/flat | fullだがtailへ薄く、比較的soft-to-hard | flat/roll→vee、またはsingle/double | deep wide swallow | twin keel、low toe/cant傾向 |
| Modern fish | fish幅＋outline curve/rocker増 | retroよりcurve | refined/thinner rail | single→double→vee等 | smaller swallow等 | twin/twin+trailer/quad |
| Step-up | daily boardより長くnarrow、pulled nose/tail | entry/overall増、smooth | lower/thinner rail、volumeは胸下に隠す | controlled single/double、vee | round pin/pin/round/squash | thruster/quad |
| Gun | long/narrow、straight drawn rail、pulled tips | wave/length対応のcontinuous rocker | sufficient paddle volume＋low controllable rail | belly/reverse vee/concave等多様 | pin/rounded pin | single/tri/quad、低drag/高control配置 |

これは代表傾向で、例外は多い。

## 1. HPSB

### System logic

- outline curveとrocker curveを組み、後足荷重で短～中arc、rail使用でprojectionを得る。
- nose/tailを引き、前後swing massと急斜面でcatchする面積を減らす。
- rail volumeを抑えてhigh speed/steep faceでも沈められるようにし、tail edgeはreleaseを明確化。
- single/double concaveはcenterとrail rockerを分け、lift/drive/holdを調整。tail veeはrail-to-rail transitionを助ける構成が典型だが必須でない。
- thrusterはcenter finでyaw/control、side finsでturn力を作る代表構成。quad/twin系HPSBもある。

### Tradeoff

弱波/低速ではnarrow outline、thin rail、rockerがsupport不足となり、paddle/planingとspeed generationに技術を要する。`HPSB=最も高性能`ではなく、対象条件とriderに対して高応答。

## 2. Groveler

### System logic

- 全長を短くしつつnose/center/tail幅、平面面積、volumeを保持。低速でbody weightを支えplaningしやすくする。
- relaxed/flat rockerで実効滑走面と弱い波のdriveを確保。
- fuller railは小波でbogしにくいが、過大だと沈めにくい。短さ、tail rocker、edge、vee、finでturnabilityを回復。
- wide tailは低速supportを増す一方holdを失いやすいため、swallow/wing/concave/fin/薄いtail rail等と統合。
- quad/twinはcenter dragを減らす意図、thrusterはcontrol/pivotの慣れを提供。fin countだけで速度は決まらない。

### 境界

`small-wave HPSB`はHPSB rail/rocker/outlineを保ちvolume/widthを少し増やす。`groveler`はより短く広くflat。境界は連続で規格なし。

## 3. Fish

### Retro fish system

- short/wide planform、wide point前寄り、直線的で平行なrail line、low rocker。
- deep swallowで広いtail幅と長いrail/twin-pin的tipを両立し、中央面積を除く。
- twin keelは長いbase、比較的低toe/cant、後方配置でdrive/down-line flowへ寄せる代表例。
- full width/volumeはpaddle/weak-wave planing、short lengthはswingを抑える。広さだけ見て`曲がらない`と断定しない。

### Modern fish / performance fish

- outline curve、tail rocker、smaller swallow、thin rail、modern concave、upright twin/trailer等を加え、vertical/pivot responseを増す。
- 同じ`fish`でもretro keel fishとmodern twinは別system。NSP Fish例はflat-rocker/wide stabilityにsingle-to-double、tail vee、wide swallow、複数boxを組み合わせる。

### Fishとgroveler

- 両方short/wide/low rockerになり得る。fishはswallow/twin系と直線railのhistorical system、grovelerは小波性能を目的とする広い集合。fishがgroveler用途とは限らず、powerful clean waveを好むfishもある。

## 4. Step-up

### System logic

- riderのdaily HPSBより長さを足し、paddle speed/early entryと長いrail lineを得る。
- width/tail areaを絞り、high-speed steep faceでrail/tailを沈めholdを作る。
- entry rockerを増しsteep drop/chop余裕、continuous curveでwave faceへfit。過剰ならpaddle lossなのでlength/foilとbalance。
- chest下にpaddle volumeを残しつつrail/tailをlow volume化する`hidden foam`。
- round pin/pin、controlled concave/vee、thruster/quadでholdとreleaseを調整。

### 境界

`step-up`は絶対長でなくpersonal daily boardからの相対概念。6'4がstep-upのriderもdaily boardのriderもいる。semi-gunとの境界も波/rider文脈。

## 5. Gun

### System logic

- 長いwaterline/rail lineとpaddle volumeで早くwave speedへ入り、high speedでpitch/yawを安定。
- narrow pulled outline、pin/rounded pinでtail areaを減らし、steep faceへengage/control。
- rockerは大波face、drop、chopに合わせるが、長さとpaddle効率を壊さないsmooth curve。`gun=最大rocker`ではない。
- railはlow/chiseledで波面へ入る必要がある一方、XXL speed/forcesを支える十分なvolumeも必要。単純thin railではない。
- bottomはbelly/roll/reverse veeによるhigh-speed controlからmodern concaveまで多様。Natural Curvesはgunでtail tuckを残しedgeをsoftenする例を示す。
- finはsingle/tri/quadがあり、低drag、hold、high-speed stabilityとreleaseを対象波へ調整。

### Tow boardとの違い

paddle gunはpaddle/entry volumeとlengthが必要。tow boardは牽引でentryするため短縮・strap等、別system。gun名だけで混ぜない。

## パーツの補償関係

| 目的/問題 | 一方の変更 | 補償例 |
|---|---|---|
| grovelerのwide tailが沈まない | tail area増 | tail railを薄く、wing、vee、tail rocker、fin調整 |
| HPSB rockerで弱波失速 | curve増 | concave/flat center、width/volume、軽量化 |
| fishのparallel railがdrawn-out | straight rail | short length、upright twin、smaller swallow、tail curve |
| step-upのnarrownessでpaddle不足 | width減 | length、chest foil、厚み分布 |
| gunのthin railでsupport不足 | rail volume減 | center/deckにfoam、length、rail profile最適化 |
| high-speed edgeがloose | hard release | tuck/softened edge、pin tail、fin area/position |

この補償関係こそカテゴリの核であり、単一feature→performance ruleより重要。

## 名称から断定してはいけないこと

| 名称言説 | 問題 |
|---|---|
| fishは小波専用 | clean/powerful wave用のdrive型fishもある |
| grovelerは初心者板 | 短くwideで反応が速く、初心者に不安定なmodelもある |
| HPSBは速い | weak waveではrocker/low areaで遅く感じ得る |
| step-upはdaily boardを伸ばすだけ | width/foil/rail/tail/rocker/finの再balanceが必要 |
| gunは長いpin tail | paddle volume、rail、rocker、bottom、fin、wave-specific system |
| wide boardはeasy | paddle/stabilityは助けるがrail engagement、duck dive、swing等のtradeoff |
| volume litresでカテゴリが決まる | volume distributionとsurface/rockerが異なる |

## CAD preset設計

1. family名は初期parameter bundle。geometry truthは数値curve/surface。
2. absolute値に加えrider正規化: board length/rider height、volume/rider mass、tail area/back-foot位置。
3. wave envelope metadata: height、steepness、power、surface chop、speed domain。
4. system validator: wide tail+full rail+flat rocker等の組合せにhold/engagement warning。ただし禁止しない。
5. family morphは各curveを独立linear interpolationせず、constraint付き再最適化。例HPSB→step-upでlength追加と同時にrail volume/tail width/fin positionを再計算。
6. comparison UIにoutline/rocker/rail station/bottom/tail/finを同時表示。
7. categorical performance scoreでなく、`low-speed planing tendency`, `steep-face engagement tendency`, `turn response`, `paddle entry`等の条件付き傾向。

## 代表geometry parameter

- widths @ nose/tail 3/6/12/18 in、wide point位置
- last/front 12/18 in area
- full rocker curvesとcenter/rail rocker差
- rail sectional area/apex/tuck/edge at stations
- bottom contour depth/vee angle along x
- tail pod/swallow/wing geometry
- fin total area、lift-center proxy、toe/cant/cluster position
- volume distribution、mass/inertia

## 画像・専門出典

1. OpenShaper統合design図（outline/rocker/rail/foil/bottom/tail）  
   https://openshaper.com/surfboard-design-guide/
2. Natural Curves bottom contour：shortboard/step-up/semi-gun/XXL gun断面図  
   https://www.naturalcurvesboards.com/html/designhtml/bottoms.html
3. Natural Curves rocker：board class別rocker図  
   https://naturalcurvesboards.com/html/designhtml/rocker.html
4. Natural Curves rail：shortboard/step-up/gun/fishに関係するstation断面  
   https://www.naturalcurvesboards.com/html/designhtml/rails.html
5. NSP Fish：outline、rocker、single-double-vee、swallow、fin構成の実例写真  
   https://www.nspsurfboards.com/product/surf/fish-protech/
6. Pyzel model catalog：Ghost HPSB、Gremlin、Next Step、Padillac等のfamily実例画像  
   https://pyzelsurfboards.com/
7. Surfline Jon Pyzel anatomy：shaperによる統合説明・写真  
   https://www.surfline.com/surf-news/shaper-s-bay-jon-pyzel-anatomy-of-a-surfboard/97792

## 主要出典

- Natural Curves Surfboards, **Rocker / Rails / Bottom Contours**. HPSB、step-up、semi/XXL gun、midlength等をsystem比較する専門資料。独自理論を含み査読なし。  
  https://naturalcurvesboards.com/html/designhtml/rocker.html  
  https://www.naturalcurvesboards.com/html/designhtml/rails.html  
  https://www.naturalcurvesboards.com/html/designhtml/bottoms.html
- Greenlight Surf Supply, **Surfboard Design Guide**. outline/rocker/tail/rail/bottom/finの相互作用。  
  https://greenlightsurfsupply.com/pages/surfboard-design-guide
- OpenShaper, **Surfboard Design Explained**. CAD図付き統合ガイド。  
  https://openshaper.com/surfboard-design-guide/
- NSP, **Fish Protech**. commercial fishの具体的system記述。  
  https://www.nspsurfboards.com/product/surf/fish-protech/
- Surfline, **Shaper's Bay: Jon Pyzel, Anatomy of a Surfboard**. professional shaper解説。  
  https://www.surfline.com/surf-news/shaper-s-bay-jon-pyzel-anatomy-of-a-surfboard/97792

## 限界

- category名に標準規格はなく、brand/model/yearで変化。
- commercial descriptionはmarketingを含み、controlled experimentではない。
- 同じgeometryでもrider size/stance/skill、construction/flex、fin、waveでfeelが変わる。
- family presetは探索開始点であり、性能保証や排他的分類に使わない。
