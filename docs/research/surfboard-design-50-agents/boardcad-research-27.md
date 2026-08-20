# サーフボード設計調査 27：材料・ラミネートと完成形状

調査日: 2026-08-12

## 結論

CADのboard shapeを単一surfaceとして扱うと、foam cut形状、ラミネート後、hot/fill coat後、最終sanding後を混同する。次の状態を別モデルにする。

1. `designTargetFinished`: 完成品の目標外形
2. `foamNominal`: CNC/hand shapeするcore表面
3. `asMachined`: tool/scallop/hand-finishを含むfoam実形状
4. `asLaminated`: wet-out skin硬化後
5. `asHotCoated`: fill/hot coat追加後
6. `asSandedFinished`: 最終検査形状
7. `loadedShape`: rider/water荷重下の弾性変形形状

laminate thicknessを全方向の一定offsetにするだけではrail overlap、cutlap、lap数、resin pooling、sanding、hard edge形成を再現できない。工程／位置依存のallowance fieldと、実測フィードバックによる校正が必要。

## 材料層と役割

| 層/材料 | 形状への影響 | 構造・flexへの影響 |
|---|---|---|
| PU/EPS/XPS等foam core | CNC/hand-shapeの基底形状、cell tearing/密度むら | sandwich厚の大部分、圧縮・せん断、dent/crease |
| wood/carbon等stringer/spar | stringer突出・planing/sanding datum、接着線 | longitudinal bending/torsion、spring response、failure path |
| fiberglass/carbon/aramid/flax等cloth | ply厚、lap overlap、織目print-through | tensile/compressive skin stiffness、impact/ductility |
| epoxy/polyester resin | wet-out、cure shrinkage、pooling、hot coat | matrix、fiber transfer、damping、brittleness |
| filler/hot coat/gloss | 外形build-upとsanding stock | 表面保護、質量、局所剛性は副次的 |
| paint/finish | 小さいが非ゼロの膜厚 | UV/表面、質量 |

## Foam density

- 密度増は一般に圧縮強度・剛性・dent resistanceを増すが重量も増す。2023年のEPS sandwich実験はfoam density、skin、stringer等がflexural/impact挙動へ関係することを示す。
- 低密度foamはCNCでcell tear、手仕上げで局所削れ、真空bagで圧縮されやすく、nominal surfaceからの偏差が増え得る。
- EPSはbead structure、PUはcell structureで仕上がりと樹脂吸収が異なる。素材名だけでallowanceを決めず、supplier/lot/density/cell sizeを記録。
- `同じlitresならEPSが浮く`は誤り。静的浮力は排水体積で決まり、材料密度差はboard自重と慣性を変える。軽いboardはboard自身が必要とする浮力が少ないが、surfer+board全体で評価。

## Stringer

- center wood stringerは縦曲げ剛性を増し、rockerを保持するshaping基準にもなる。密度、厚さ、木目、接着、位置で効果が変わる。
- stringerlessは必ず柔らかいとは限らない。EPS密度、skin schedule、rail carbon、parabolic stringer等で全体剛性は逆転し得る。
- stringerをplane/sandする際にfoamとの硬さ差でridge/low spotが生じ得る。完成bottom centerline rockerへ局所誤差を入れるためinspection対象。
- off-center/parabolic/rail stringerはbendingだけでなくtorsionとrail responseを変える。CADはlineではなく断面・material orientationを持つsolid/beam featureにする。

## Skin / glass schedule

- clothの`4 oz / 6 oz`はarea weightで、完成ply thicknessそのものではない。weave、fiber volume fraction、resin uptake、squeegee/vacuum、cureで変わる。
- deckは複数ply/patchが多く、bottomより厚い。railにはdeck/bottom cloth lapが重なり局所厚が増える。
- cutlap/free lapの境界はstep/ridgeを作り、hot coat/sandingでblendされる。色付きcutlapは過度にsandできず完成allowanceが変わる。
- carbonは高剛性だが配置方向と距離が重要。薄いstripでもneutral axisから離れればbending stiffnessへ強く効く。
- skinを厚く/硬くするとshape保持とdent resistanceを助け得るが、重量、damping、brittleness、flex frequencyも変える。

## Resin

- EPSは一般的polyester resinのstyreneで侵されるため通常epoxyを使用。PUはpolyester/epoxy双方が可能。compatibilityをCAD/BOM validationに含める。
- thermosetはchemical cure shrinkageとtemperature changeによりresidual stressを生む。左右非対称layup、片面先行硬化、支持不良、過熱でwarp/twist/rocker変化が起こり得る。
- ただしsurfboard完成寸法に使える普遍的な`epoxy x%、polyester y%収縮`を固定allowanceにする公開根拠は不足。樹脂system、mix ratio、filler、fiber fraction、cure schedule、厚みで異なる。
- resin-rich rail/tail beadは局所build-upとbrittle edgeを作る。hard edgeはhot coat/resin dam後のsandingで最終形成される場合がある。
- exothermはfoam損傷・局所変形の可能性。厚いpool、環境温度、batch sizeをprocess metadataに持つ。

## Springback / warp / rocker変化

ここでのspringbackを3種に分ける。

1. **Machining release**: blank internal stressやfixture/vacuum解除でfoam shapeが戻る
2. **Cure distortion**: resin shrinkage、thermal gradient、非対称laminateでrocker/twistが変わる
3. **Elastic springback**: 荷重で変形したboardが除荷後に戻る動的flex

- natural blank rocker、stringer、foam orientation、支持点を記録しないと1と2を区別できない。
- lamination中にrack supportsが少ない／位置が不適切なら自重・wet laminate weightでshapeが変わり、そのまま硬化し得る。
- `springbackがspeedを返す`はfeel表現。実際にはstiffness、damping、phase lag、load path、rider timingの問題で、flex energyが無条件に推進へ変わらない。
- unloaded scanと標準3/4-point bending、torsion、modal testを分ける。2026年のmodal研究はEPS boardとPU/wood-stringer boardでfrequency responseが異なり、材料と質量分布がdynamic behaviorを形作ると報告。

## Finished radius / 寸法

- laminateはfoam表面の外側へ厚みを足すが、rail/edgeでclothが曲がるためlocal fiber bridging、resin pocket、lap overlapが起こる。
- convex railは近似offset可能。小radius edgeではoffset surfaceが自己交差／形状を丸め、zero-radius foam vertexはfinished zero radiusにならない。
- sandingはhot coatだけでなくlaminate fiberまで削る`burn-through`リスクがあり、局所厚とradiusは作業者依存。
- tail hard edgeはlaminationで丸くなった後、resin build-upとsandingで再形成する工程がある。従ってfoam edge radius、laminated radius、finished release radiusを別指定。
- length/width/thickness/volumeはskin buildとsandingで変わる。完成寸法が契約値ならfoam CADを逆offsetするが、uniform compensationにしない。

## Flexとの関係

- sandwich bending stiffnessはskin modulus/thickness、skin間距離（board thickness）、core shear、stringerに強く依存。材料変更だけでなくgeometryが支配的。
- 2023 EPS sandwich研究では異なるfoam densityとskin/stringer構成をmechanical testし、構成間でflexural/impact failureが変化。過去研究の一部ではfoam propertiesがflexural strengthを支配し、skin reinforcementはimpact/ductilityに大きく影響。
- 2026 Composites Part B研究はepoxy/polyester、glass/carbon/aramid/natural fiber、PU/EPS/XPS/PET/PVC coreを系統比較。高密度coreは性能向上と重量／dynamic flex responseのtradeoff。
- `epoxy boardはstiff、PUはflexy`は過度な一般化。core、resin、cloth、stringer、厚み、mass distributionの組合せで決まる。
- CAD/FEAではorthotropic laminate ply、core shear、stringer beam/shellを持ち、static deflection、modal frequency、damping（実測校正）を別出力。

## CAD allowanceモデル

### Geometry fields

- `foamToLaminateOffset(x,y)`: ply scheduleとfiber/resin thickness
- `lapBuild(x,y)`: rail overlap/cutlap patch
- `hotcoatStock(x,y)`
- `sandingRemovalMean/σ(x,y)`
- `targetFinishedRadius(feature)`
- `cureDistortionTransform/field`: 実測工程モデル

### 逆設計

1. finished target surfaceを定義
2. process recipeを選択（core/stringer/plies/resin/lap/hotcoat/sanding）
3. calibrated build/removal fieldsでfoam nominalを推定
4. offset self-intersection、minimum foam thickness、edge feasibilityを検査
5. coupon/previous board dataからallowance更新

### 初期実装

データがない段階では固定収縮率を発明せず:

- surface region別のnominal laminate buildを入力可能
- rail lap/tail resin beadを明示patch
- uncertainty band付きfinished prediction
- shape/laminate後のstation scanを蓄積し、process+operator別にbias fieldを学習

## QA / roundtrip測定

- foam CNC直後、hand-finish後、各面lamination後、hotcoat後、final sanding後に同じdatumでscan/rocker station測定
- length/width/thickness/volume、center/rail rocker、rail sections、edge radius、twistを比較
- massと重心、左右mass asymmetry
- standard supportでunloaded、既知荷重でloaded deflection
- laminate thickness coupon、resin:fiber ratio、cure temp/time/humidity
- `Δshape(stage)`を保存し、次回foam allowanceへ戻す

## 俗説・注意

| 表現 | 問題 | 修正 |
|---|---|---|
| glassを巻けば全体が一定厚くなる | 誤り | lap、曲率、resin、sandingで位置依存 |
| epoxyは必ず軽く強く硬い | 一般化 | resin量、cloth/core/stringer/geometryで変わる |
| EPSは浮力が大きい | 用語曖昧 | 同外形の排水体積は同じ。自重・密度・慣性が違う |
| stringerlessはflexが大きい | 条件付き | skin/rail reinforcement/coreで逆転可能 |
| cure shrinkageは樹脂ごとに一定 | 誤り | system、fiber fraction、温度、厚み、工程依存 |
| flexがenergyを返してspeedになる | 未定量のfeel | stiffness/damping/phase/rider inputを測る |
| foamのsharp edgeが完成edge | 誤り | cloth/resinで丸まり、build/sandingで再形成 |

## データ構造例

```json
{
  "core":{"material":"EPS","density":32,"lot":"..."},
  "stringers":[{"material":"wood","width":3,"path":"center"}],
  "laminate":{"deck":[{"cloth":"E-glass","arealWeight":200,"orientation":0}],"bottom":[]},
  "resin":{"type":"epoxy","system":"...","cureSchedule":"..."},
  "process":{"lap":"cutlap","hotcoat":true,"sandingAllowanceMap":"..."},
  "shapeStates":{"foamNominal":"surface-id","finishedTarget":"surface-id"},
  "calibration":{"recipeId":"...","meanBiasField":"...","uncertainty":"..."}
}
```

## 画像・専門資料

1. 2023 EPS sandwich研究（典型surfboard sandwich構成図、試験片、failure写真、荷重曲線）  
   https://pmc.ncbi.nlm.nih.gov/articles/PMC10304318/
2. 同論文PDF  
   https://pdfs.semanticscholar.org/6157/1cad433c7b1ef93d2abb0c158606b1812194.pdf
3. Greenlight glassing guide（cloth cut、rail lap、lamination/hotcoat工程写真）  
   https://greenlightsurfsupply.com/pages/greenlight-surfboard-building-guide-how-to-glass-surf-board
4. NOAA/UNH sustainable surfboard report（製造工程・材料写真）  
   https://repository.library.noaa.gov/view/noaa/46334/noaa_46334_DS1.pdf
5. 2026 modal analysis（board、accelerometer/hammer位置、frequency response図）  
   https://advanced.onlinelibrary.wiley.com/doi/abs/10.1002/adem.71000
6. 2026 materials comparison（skins/core test overview）  
   https://doi.org/10.1016/j.compositesb.2026.113610
7. Greenlight shaping/building guide（blank、stringer、rail/foil工程）  
   https://greenlightsurfsupply.com/pages/surfboard-building-guide-how-to-shape-surf-board

## 主要出典

- O’Dea et al. (2023), **An Experimental Investigation of the Mechanical Performance of EPS Foam Core Sandwich Composites Used in Surfboard Design**, Materials. Open access一次実験。  
  https://pmc.ncbi.nlm.nih.gov/articles/PMC10304318/
- **Comparative study of different fiber-reinforced thermoset polymer composite skins and foam cores for surfboard applications** (2026), Composites Part B 317, 113610.  
  https://doi.org/10.1016/j.compositesb.2026.113610
- Connellan et al. (2026), **Experimental and Numerical Modal Analysis of Composite Sandwich Structures Using Surfboards as Model Systems**, Advanced Engineering Materials.  
  https://advanced.onlinelibrary.wiley.com/doi/abs/10.1002/adem.71000
- Greenlight Surf Supply, **How to Glass a Surfboard**. 実務工程資料。  
  https://greenlightsurfsupply.com/pages/greenlight-surfboard-building-guide-how-to-glass-surf-board
- Johnstone et al., **Mechanical/flex studies of surfboard sandwich structures**（2023論文内レビュー参照）。

## 研究限界

- 公開研究はcoupon/beam testが多く、完成boardの工程別3D形状変化を大規模測定した資料は乏しい。
- resin cure shrinkageから自由曲面の最終偏差を直接予測するにはlayup、thermal、fixture、foam viscoelasticityのprocess simulationが必要。
- hand lamination/sandingのoperator varianceが大きい。CAD allowanceは工房ごとのscan dataで校正すべき。
- dynamic flexの好みとperformanceはrider/wave依存で、単一stiffness最適値はない。
