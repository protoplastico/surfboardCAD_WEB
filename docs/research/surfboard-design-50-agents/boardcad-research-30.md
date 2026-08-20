# サーフボード設計調査 30：CNC製造制約

調査日: 2026-08-12

## 結論

board CADの「watertightで滑らかなsurface」はmachinableを意味しない。CNC export前に、具体的なmachine、cutter、holder、blank、fixture、flip datum、stock allowanceを含むmanufacturing profileで検証する。

最低限のprofile:

- machine type / axes / travel / rotary limits
- cutter type（disk、bull/ball nose、custom blade）、diameter、corner radius、cutting length
- holder diameter、gauge length、stick-out、spindle envelope
- stepover、stepdown、feed/speed、scallop target
- fixture supports/clamps、safe zones、flip/registration datum
- blank outer surface、stringer、density、stock margin
- deck/bottom/rail toolpath splitとunmachined hand-finish zones
- collision/gouge/reachability validation結果

Shape3d公式manualもbull-nose 3–5 axisまたはdisk cutter、blank environment、tool holder diameterによるcollision avoidance、machine origin、deck/bottom/rail guide等をmachine fileへ持つ。

## Cutter geometry

### Tool diameter

- 大径cutterは広い面を短時間・低scallopで切りやすいが、deep channel、tight concave、swallow notch、tip周辺へ入れない。
- 小径は細部へ届くが、tool deflection、時間、surface scallop、foam tearing、holder collisionのリスク。
- disk bladeは大きい有効切削径と滑らかなcutを得やすいが、姿勢・edge access・凹featureに制約。bull/ball noseは3D surfaceへ汎用的。
- `tool diameter`だけでなく、先端profileとcorner radiusをtool solidとしてcollisionに使う。

### Reach / stick-out

- cutting edge lengthより深いchannel/side wallはshank/holderが擦る。
- stick-outを伸ばすとreachは増すが剛性低下、runout、chatter/gougeを招く。
- rail undercutではtipが届いてもholder envelopeがblankへ衝突する場合がある。Shape3dはholder diameter Wをcutter Dと別に入力してblank collisionを避ける。
- CAD warningは単純depthでなく、tool-axis方向のswept volumeで検査。

## Stepover / scallop / tolerance

- curved surfaceを平行pathで加工するとcusp/scallopが残る。一般にstepover減で滑らかになるがcycle time増。
- scallop heightはtool radiusとlocal surface curvature、tool orientationに依存。flat areaとtight railで同じstepoverを使う必要はない。
- adaptive stepover: center flat/low curvatureは広く、rail/concave/channel/tipは狭く。
- CNCはsub-mm positioningでもfoam cell、cutter condition、fixture、hand sandingが最終精度を制約する。「machine accuracy」と「finished shape accuracy」を分ける。
- toolpath chordal tolerance、surface tessellation tolerance、controller interpolation toleranceも保存。

## Blank fitting / stock

- designをblank libraryへoverlayし、rocker、outline、thickness、stringer alignment、全周stockを検査。AkuShaperはBlank Fittingでこれらを確認する。
- stock不足は空切り／未完成面となり修復不能。nose/tail/rail、deep concaveの反対側、flip後のsupport位置で特に注意。
- 過大blankは時間・dustを増し、tool/holder collisionとclamp accessを悪化。
- natural blank rockerへdesignを前後/上下にnestし、bottom/deck両面のminimum stockを同時最適化。
- stringerはfoamより硬く、cutter load/finishが変わる。path direction、feed、tool conditionとcenter ridgeを考慮。

## Fixture / support / flip

- surfboardは薄く長い低剛性foam。支持点間で自重・切削力により撓むと、machine座標上では正しくても除荷後shapeがずれる。
- supportsはblank natural rockerへ合う複数点/contour cradle。高い局所圧でfoamをdentしない。
- clamp/suctionはtoolpath envelope外に置き、cut進行でstockが弱くなっても保持を失わない。
- deck/bottom flipには再現可能なdatumが必要: nose/tail stops、center stringer plane、pins、vacuum fixture等。
- flip errorは左右rail mismatch、twist、thickness/rockerずれとして現れる。3-point probing/laser scanで再登録するのが望ましい。
- machine originをnose/tail/middle/blank基準のどれにするかfileへ保存。Shape3dもorigin referenceを選択可能。

## Rail / undercut

- 3-axisではtool axis固定のため、投影方向から見えないundercutを切れない。full railのdeck側/bottom側は両面加工とhand blendが必要。
- 4/5-axisはtool tiltで到達性を増すが、axis limit、holder/gantry/blank collision、singularityがある。
- rail apex周辺でdeck/bottom pathをoverlapさせ、unmachined cuspを残す量とhand-finish allowanceを定義。
- sharp release edgeを両側からexact zero stockで狙うとregistration誤差でstep/overcut。theoretical feature lineを保ちつつ一方へfinishing stockを割当てる。
- concave rail/chineの内側radiusはtool radiusとapproach angleで制限。

## Nose / tail tip

- tipはstockが細くsupportが弱く、cutting forceで振動・欠けやすい。最後までsupport tab/bridgeを残しhand finishする戦略。
- pointed noseやpin tailのzero-radius CADはtoolpath、foam強度、lamination、安全の完成truthでない。minimum foam radiusとfinished radiusを分ける。
- cutter/holderがtipの裏側へ回り込む際、fixture/axis travelと衝突しやすい。
- swallow/fish tailの内側notchはdeep narrow concavityで、disk/大径toolが届かず手加工される例が多い。機械能力に応じblock tailでcut後hand carveをmanufacturing planとして許可。

## Channels / concaves

- channel width、wall angle、depth、spacing、fade-in長さをtoolと比較。
- internal corner minimum radiusは原則cutter radius以上。ball/bull noseではbottom corner profileもtool形状に支配。
- channel wallがsteepでdeepならshank/holder collision、rest machiningが必要。
- channel fade-in端を尖ったzero-length cuspにせず、toolが加減速・surfaceへ接近できるG1/G2 ramp。
- adjacent channels間ridgeがtool diameter/foam strengthより狭いと欠ける。
- fin box位置とchannel/toolpath、残りfoam thicknessを干渉検査。
- 深いconcaveはbottomから切れるが、反対deck側stock/最低core thicknessを確認。

## Allowance

位置依存のallowanceを持つ:

- center broad surface: 小さいfinish sanding stock
- rail: hand blend/screen用stock
- stringer: plane/sand調整分
- tip/tail corner: breakage防止tab/stock
- channel: small-tool rest machiningまたはhand finish stock
- release edge: resin/laminate後形成を考えたfoam allowance

`uniform +1 mm`はoffset self-intersection、rail volume、channel消失を起こし得る。surface normal offset＋feature-specific ruleを使い、工程scanで校正。

## Collision / gouge / accessibility

### 必須チェック

1. cutter swept volume vs target/remaining stock
2. shank/holder/spindle vs blank
3. tool assembly vs clamps/supports/table/gantry
4. axis travel/rotation/velocity/acceleration limits
5. tool contact point outside cutting flute
6. local gouge、offset surface self-intersection
7. unreachable shadow/undercut regions
8. flip後のremaining stock/support stability
9. cutter change safe move、rapid clearance plane
10. dust extraction hose/enclosureの実機clearance

Shape3d machine fileをversioned assetとしてboard jobに紐付ける。manualも誤変更に備えbackupを推奨している。

## Toolpath戦略

- roughing: stockを残し、blank形状に応じ効率的に除去
- semi-finish: stress/fixture変化後に均一stock
- finish: curvature-adaptive paths、deck/bottom/rail guides
- rest machining: channel/tight radiusを小径tool
- manual zones: swallow notch、tip、edge、stringer/rail blendを明示

path方向はfoam tearとstringer grain、disk cutter orientation、climb/conventional behaviorを機械ごとに検証。toolpath previewだけでなくmaterial removal simulationを行う。

## CAD validation指標

| 指標 | 内容 |
|---|---|
| `minToolReachMargin` | flute/shank/holderまでの余裕 |
| `unreachableArea` | tool orientation集合で接触不能なsurface面積 |
| `minChannelRadius/Width` | tool profileに対する余裕 |
| `minBlankStock` | stage別全surface stock |
| `fixtureClearance` | swept assemblyとの最小距離 |
| `predictedScallopMax/RMS` | curvature/toolpath込み |
| `flipRegistrationBudget` | rail/thickness誤差への伝播 |
| `manualFinishArea` | CNC外の面積/feature一覧 |
| `cycleTimeEstimate` | feed、path長、tool change |

## 推奨データ構造

```json
{
  "machine":{"id":"shop-machine-v3","axes":5,"travel":[3500,1000,500]},
  "tool":{"type":"bullNose","diameter":80,"cornerRadius":8,"fluteLength":60,"holderDiameter":100,"gaugeLength":140},
  "fixture":{"model":"cradle-a","mesh":"fixture.stl","flipDatum":"pins+centerPlane"},
  "blank":{"model":"blank-id","transform":[],"minStock":3},
  "paths":{"rough":{"allowance":3},"finish":{"stepover":4,"chordTol":0.2}},
  "manualZones":["swallow-notch","tail-release-edge"],
  "validation":{"collisionFree":true,"unreachableArea":0,"maxScallop":0.3}
}
```

数値はschema例であり推奨値ではない。

## 俗説・注意

| 表現 | 問題 | 修正 |
|---|---|---|
| 5-axisなら何でも切れる | 誤り | holder、axis limit、fixture、tool radius、reachが残る |
| 小さいtoolなら細部を切れる | 不十分 | deflection、flute length、cycle、foam tearing、holder collision |
| CNCは設計通り完成させる | 誤り | preshape＋hand finish＋lamination/sandingで完成 |
| STLがwatertightなら加工可能 | 誤り | access、stock、fixture、collision、toleranceが必要 |
| stepoverを細かくすれば精度が出る | 条件付き | datum/fixture/tool runout/foam/sandingが支配し得る |
| blankに収まればよい | 不十分 | 両面stock、support、stringer/rocker nesting、holder clearance |
| zero-radius edge/channelをCNC再現できる | 誤り | cutter/process/final laminate radiusが制限 |

## 画像・公式資料

1. Shape3d X official user manual HTML（CNC tabs、machine/cutter/axis/blank/toolpath図）  
   https://www.shape3d.com/Support/User_Manual_V9.htm
2. Shape3d official PDF manual（machine file、bull nose/disk、holder collision、origin）  
   https://shape3d.com/Manuals/User_Manual_V9.pdf
3. AkuShaper official software page（blank fitting、CNC、machine/laser写真）  
   https://akushaper.com/software
4. AkuShaper machine page（専用machine/cutter写真）  
   https://www.akushaper.com.au/machines-pro-model
5. AkuShaper official help（Blank Fitting / CNC operation manual index）  
   https://help.akushaper.com/
6. Shape3d blank selector / software overview  
   https://shape3d.com/Default.aspx
7. Greenlight CNC-ready blank / shaping guide（blankとhand finish参考）  
   https://greenlightsurfsupply.com/pages/surfboard-building-guide-how-to-shape-surf-board

## 主要出典

- Shape3d, **Shape3d X User Manual v9**, official machine/CAM documentation.  
  https://shape3d.com/Manuals/User_Manual_V9.pdf
- AkuShaper, **Surfboard Design Software & Shaping Machines / Software**, official workflow and blank-fitting documentation.  
  https://akushaper.com/  
  https://akushaper.com/software
- AkuShaper Help Center, **CNC Machine Operation Manual / Blank Fitting**.  
  https://help.akushaper.com/
- Held et al. (2022), **Brief on tool path generation/optimization methods for multi-axis CNC machining**. 一般multi-axis toolpath review。  
  https://arxiv.org/abs/2212.07941

## 限界

- 専用surfboard CNCの詳細tool寸法、axis envelope、feed/speedは機種・工場固有で非公開の場合がある。実machine fileを最優先。
- foam density、humidity、cutter wear、dust extraction、operator finishingで結果が変わる。
- CAD側はmanufacturability warningを出せるが、最終責任はmachine simulation、dry run、operator inspection、test blankにある。
