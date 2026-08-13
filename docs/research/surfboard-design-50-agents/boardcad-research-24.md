# サーフボード設計調査 24：フィンの流体性能

調査日: 2026-08-12

## 結論

フィン性能はtemplate名やfin countだけで決まらない。最低限、各finについて次を独立保存する。

1. planform area、span/depth、base/chord distribution、tip shape
2. aspect ratio `AR=b²/S`（定義するspanとareaを明記）
3. sweep/rake分布、taper
4. foil section（左右非対称、厚み比、camber、leading/trailing-edge radius）とspanwise変化
5. board座標内のposition、toe、cant、rotation datum
6. fin間spacing/overlap、board bottom・rail・free surfaceとの距離
7. flex/twistと材料剛性

力は概念的に `L=0.5ρV²SCL`, `D=0.5ρV²SCD`。ただし実走では速度・迎角が非定常で、board roll/yaw、wave orbital flow、自由表面、rail/bottom、他finのwakeがある。静水中の単独fin係数をそのまま「board speed/hold」へ変換しない。

## 基本パラメータ

| 変数 | 主な流体変化 | 一般的傾向 | 条件・反作用 |
|---|---|---|---|
| area増 | 同CLなら横力増、濡れ面増 | hold/control、低い必要CL | drag・turn抵抗増、過大ならstiff |
| span/depth増 | tip影響比低下、深い水を使う | hold、誘導抵抗低下方向 | bending moment、浅所・release不利 |
| AR増 | tip vortex相対影響低下 | lift/drag効率向上傾向 | stall、自由表面、構造で単純でない |
| sweep/rake増 | lift中心後退、leading-edge/3D separation変化 | drawn-out/carvingという経験則 | area/span固定比較が必要 |
| upright/低sweep | pivot centerが前／直立 | quicker pivotという経験則 | foil・positionで変わる |
| toe-in増 | straight trimでもside finに迎角 | response/turn initiation | parasitic drag、左右fin干渉 |
| cant増 | 横力に上下成分、rail使用時orientation変化 | loose/responsiveという経験則 | drag、実効span、roll angle依存 |
| finsを後方 | yaw安定moment arm増 | drive/hold、drawn-out | turn initiation重くなる傾向 |
| cluster前方 | moment arm短縮 | loose/pivot | high-speed stability低下傾向 |

## Foil

- center/single finは通常左右対称double foil。side finは外側convex、内側flatまたはconcave/inside foilを持つ非対称断面が多い。
- foil thickness ratioと最大厚位置はpressure recovery、stall、drag、構造剛性に関係。leading edgeが鋭すぎると許容迎角が狭く、丸すぎるとprofile drag/感触が変わる。
- trailing edgeは流れを離すため薄いが、zero thicknessは製造・耐久・安全上不可能。完成半径を保存。
- cambered/asymmetric foilはゼロ幾何迎角でもliftを持ち得る。toe/cantと合わせるとstraight trim時にも力・dragが生じる。
- `flat inside foil = speed`等の一語評価は不可。Reynolds数、表面粗さ、迎角、ventilation、flexでpolarが変わる。

## Area / aspect ratio / sweep

- area増は同速度・係数で力を増すが、ライダーは必要横力に応じ迎角を変えるため、実走ではarea増が必ず力増になるとは限らない。より低CLで同力を出しstall marginを得る可能性。
- `AR=b²/S`。高ARは有限翼の誘導抵抗を減らす基本傾向だが、surf finはboardとのjunction、free surface、短いspan、yaw/rollで理想翼から遠い。
- baseを広くするとareaとboard junction近傍のload、構造支持が増える。業界の`drive`説明は有用だが標準計測語ではない。
- sweep/rakeを比較する研究ではareaとspanを固定しないと、rake効果と面積/AR効果が混ざる。Baldovin (2019)はNACA 0006、一定span/areaでsweep/taperを分離したCFDを行った。
- rakeはplanformの後傾、sweep angle、tip offsetなど複数定義がある。CADではquarter-chord sweep、tip rake、area centroidを数値保存。

## Toe

- toeはfin chordがstringer平行からnose内側へ向く角度。業界では4.5 in等のgage長に対するoffsetでも記録するが、angleへ正規化する。
- toe-inしたside finはboard直進時にも局所流へ迎角を持ち得るため、turn responseを作る一方dragが増える傾向。
- 実際の局所流はbottom contourで曲げられ、board yawもある。`fin axisをnose tipへ向ける`は製作規則で、流体的最適を保証しない。
- front/rear quadでtoeを変える例が一般的。全finに同じ角を固定しない。

## Cant

- cantはbottom normal/stringer planeに対するfinの外傾。測定datumをboard bottom局所面かglobal center planeか明記する。concave/vee上では両者が違う。
- cant増はboard flat時のfin liftを横・鉛直成分へ分け、roll時のwave faceに対するorientationも変える。
- 業界では高cant=turn/loose、低cant=drive/speedと説明されるが、toe、foil、board roll、fin位置を固定しない経験則。
- fin box cantとremovable fin自身のcantの合計を保存。

## Placement / multi-fin interaction

- longitudinal positionはfin力の重心まわりmoment armを変える。後方はyaw安定/hold、前方はpivotしやすい傾向。
- lateral位置はrailとの連携、free-surface proximity、bottom flowを変える。railに近いside finはboardを傾けた時に深くengageする一方、反対側finは水面へ近づきventilateし得る。
- cluster spacingは前fin wakeが後finへ当たる角度・速度、vortex interactionを変える。単独fin polarの足し算ではない。
- 2020年のquad CFD研究はrear fin位置のparameter studyを実施し、位置変更がhydrodynamic forceに影響することを示す。特定最適位置は解析board/条件依存。
- thruster/quad/twin/singleの名称はtopologyであり性能値でない。総area、lift center、toe/cant/foilを比較する。

## Cavitationとventilation

- **cavitation**: 局所静圧が水の蒸気圧以下となり蒸気bubble/cavityが発生。
- **ventilation**: 自由表面の空気がfinの低圧面やwakeへ引き込まれ、空気cavityが形成。
- surferが言う`fin cavitated / blew out`は、stall、flow separation、tip vortex、ventilationをまとめた俗称であることが多い。分離bubbleをcavitationと呼ばない。
- 通常のsurf speedと浅いsurface-piercing geometryでは、真の蒸気cavitationよりstall/separation/ventilationをまず疑う。ただし局所高速・低圧条件の定量計算なしに「絶対起きない」と断言しない。
- Brandner & Walker (2004)はcavitation tunnelを設備として使ったが、主目的はgeneric surf finのviscous flow、lift/drag/moment、flow visualization。`cavitation tunnelで試験`と`cavitation発生を確認`を混同しない。

## 一次研究から分かること

### Brandner & Walker 2004

- generic finをwater/cavitation tunnelで計測。
- lift、drag、pitching momentとsurface flow visualization。
- tested Reynolds rangeではlift/drag特性がほぼ不変、high incidenceで2D/3D混合separation。
- 単独generic finであり、wave/free-surface/multi-fin実走再現ではない。

### Baldovin 2019

- NACA 0006、一定span/areaでsweep/taperを独立変更、AoA 0–20°、Re≈3.51×10^5 CFD。
- planform効果を分離する方法論として有用。実際のasymmetric side foil、board junction、free surfaceは限定。

### Oggiano et al. 2020 quad placement

- fixed front finsに対しrear fins位置をparameter study、STAR-CCM+。
- multi-finは位置がforce/flowへ影響し、configurationを総体で解析すべき根拠。
- steady/idealized conditionsと特定geometryに限定。

### Scientific Reports 2025

- 実際のsurfing中fin pressure測定を目指し、fin内pressure sensorとboard内DAQを実装。tank calibrationとfield measurementをつなぐ貴重な一次研究。
- センサー点の局所pressureであり、全fin force/全条件の完全なground truthではない。

### Grooved fin CFD 2022

- groove/bumpy leading edge finをconventional finとCFD比較、stall angleでdrag 13±1%減、lift-to-drag 11±1%改善を報告。
- 特定geometry/CFD条件であり、全surf fin、実走speed、汚れ/製造誤差へ一般化しない。

## 俗説と注意

| 俗説 | 判定 | 修正 |
|---|---|---|
| 大きいfinはhold、小さいfinはloose | 傾向 | rider/board/速度、foil、position、総areaで変化 |
| rakeが大きいとdrawn-out | 経験則 | sweep単独でなくlift center、area、flexも変わりがち |
| toe/cantを増せばturnする | 条件付き | responseと同時にdrag。局所flow/datum依存 |
| quadはthrusterより速い | 過度な一般化 | center fin不在だけでなく総area/位置/toe/wakeが異なる |
| finがcavitateして抜ける | 用語誤用が多い | stall/separation/ventilation/真cavitationを分ける |
| 高ARは常に高性能 | 誤り | structure、tip release、free surface、turn要求とのtradeoff |
| inside concave foilはliftを増す | 条件付き | polar全体、drag/stall/toeとの組合せで評価 |

## CAD/解析実装提案

1. planform outline、spanwise chord、quarter-chord sweep、area centroidを自動計算。
2. root/mid/tip foil sectionをNURBSで持ち、thickness/camber/LE/TE radiusを表示。
3. toe/cantはglobal board datumとlocal bottom tangent datumの両方で表示。
4. fin box transform＋fin transformを合成し、実最終orientationをtruthにする。
5. multi-finの総area、projected lateral area、area-weighted lift-center proxy、spacing/overlapを計算。
6. board roll/yaw姿勢別に各finのsubmergence/free-surface distanceを可視化し、ventilation risk tendencyを出す。
7. performance labelは条件付き。単独fin 2D polar、3D isolated fin、board-mounted multi-fin CFD、field dataを別階層で保存。
8. trailing edge/tipのfinished minimum radius、安全/製造warningを持つ。

## 画像・一次資料URL

1. Greenlight Fin Design（toe/cant、template/foil、placement図）  
   https://greenlightsurfsupply.com/pages/surfboard-fin-design-greenlight-surfboard-design-guide
2. Brandner & Walker 2004 PDF（fin geometry、force curves、surface-flow写真）  
   https://www.flair.monash.edu.au/intranet/proceedings/15afmc/papers/AFMC00105.pdf
3. Baldovin 2019 thesis（sweep/taper CAD、mesh、pressure/vorticity図）  
   https://digitalcommons.calpoly.edu/theses/1983/
4. Quad placement CFD open PDF（configuration、rear-fin positions、flow/force図）  
   https://mdpi-res.com/d_attachment/applsci/applsci-10-00816/article_deploy/applsci-10-00816.pdf
5. Scientific Reports field pressure study（sensor/tank/board photos、pressure data）  
   https://www.nature.com/articles/s41598-025-94834-0
6. Grooved fin CFD（graphical abstract、pressure contour）  
   https://link.springer.com/article/10.1557/s43580-022-00311-5
7. Greenlight placement/toe measurement写真  
   https://greenlightsurfsupply.com/blogs/news/how-to-measure-surfboard-placement-and-fin-toe-in-angle

## 主要出典

- Brandner, P.A. & Walker, G.J. (2004), **Hydrodynamic Performance of a Surfboard Fin**, 15th AFMC.  
  https://www.flair.monash.edu.au/intranet/proceedings/15afmc/papers/AFMC00105.pdf
- Baldovin, B.J. (2019), **Sweep and Taper Analysis of Surfboard Fins Using CFD**, Cal Poly MS thesis.  
  https://doi.org/10.15368/theses.2019.8
- Oggiano et al. (2020), **Numerical Investigation of the Hydrodynamics of Changing Fin Positions within a 4-Fin Surfboard Configuration**, Applied Sciences 10, 816.  
  https://www.mdpi.com/2076-3417/10/3/816
- **Measurements of the hydrodynamic pressure on a surfboard fin during surfing** (2025), Scientific Reports.  
  https://www.nature.com/articles/s41598-025-94834-0
- Elshahomi et al. (2022), **Computational fluid dynamics performance evaluation of grooved fins for surfboards**, MRS Advances.  
  https://link.springer.com/article/10.1557/s43580-022-00311-5
- Greenlight Surf Supply, **Surfboard Fin Position and Design Guide**. 専門経験資料。  
  https://greenlightsurfsupply.com/pages/surfboard-fin-design-greenlight-surfboard-design-guide

## 研究限界

- wave上の6-DOF board、rider荷重、自由表面、air entrainment、flexible multi-finを同時再現した公開研究は少ない。
- 多くのCFDはsteady inflow、rigid fin、理想表面。transition/roughness、lamination誤差、flexを省略。
- `drive/hold/loose/pivot`は標準化された物理量でない。force/moment/polarとrider評価を分ける。
- 一つの速度・AoAのL/D最大をsurfing最適とみなさない。stall margin、moment、transient response、controlが重要。
