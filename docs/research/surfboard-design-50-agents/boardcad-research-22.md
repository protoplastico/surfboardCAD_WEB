# サーフボード・デッキ形状の分類とCAD定義

調査日: 2026-08-12  
担当: research-22（flat/domed/crowned/step/concave deck、deck roll、rail volume/foil）

## 結論

デッキは `flat / domed / crowned / step / concave` という単一分類では定義できない。少なくとも次を分離する。

1. **longitudinal deck foil/profile**: nose→tailのdeck stringer高さと厚さ分布
2. **cross-sectional deck contour**: rail-to-railのflat、crown/dome、concavity
3. **deck-to-rail transition**: deck roll/shoulder、rail thickness/volumeへの落ち方
4. **localized features**: step、rail channel/gutter、concave standing area、recess

同じcenter thicknessでもflat deckは厚みをrail近くまで運びやすく、domed/crowned deckはcenter volumeを保ちながらrail側へ薄く落とせる。しかしrail volumeはdeck contourだけでなくbottom contour、apex、tuck、outlineにも依存するため、deck presetからrailを一意に生成してはいけない。

## 1. 用語

### deck foil

長手方向の厚さ/volume distribution。side viewのdeck stringer、rail deck line、nose/tail foilを含む。「foil」は断面形を指す文脈もあるため、データ名は`longitudinalThicknessDistribution`など具体化する。

### deck contour / deck roll

station断面 `(y,z)` におけるtop surface。`deck roll`はcenterからrailへ落ちる横断曲率を指す実務語。単純な円弧ではなく、center plateau、shoulder、rail joinを含む。

### dome / crown

どちらもcenterline側が高いconvex deckを指し、資料・ブランド間で厳密な境界はない。CADでは別enumにせず、crown height、plateau width、curvature distributionで表す。UIプリセット名として残してよい。

### flat deck

rail-to-rail断面中央部の曲率が小さい。rail joinまで完全な平面とは限らず、通常はshoulder/rollを介してrailへつながる。

### step deck

曖昧語。少なくとも次の別形状がそう呼ばれる。

- central deckを高く保ち、railへ段/急なshoulderで落とす
- classic step-deck noseriderのnose/rail付近の薄化
- 7S等で「step deck」と称された、rail line沿いのdeck concave/gutter

Swaylocksの実例では、7Sのstep deckはclassic noserider step deckと違い、deck rail lineにnose-to-tailのsubtle concavityを設け、中央volumeを残しつつrailを薄くする形と説明され、写真も掲載される。[Swaylocks: 7S Step Deck（実物写真）](https://forum.swaylocks.com/t/looking-for-drawing-of-7s-surfboards-step-deck-rail-design/50015)

### concave deck

center standing regionが低い横断凹面、またはrail沿いのgutter/recess。どの領域が凹むかを名前だけから判断しない。

## 2. 推奨CADモデル

```text
zDeck(x,y) = zDeckStringer(x)
           + crossDeck(x, η)
           + Σ localFeature_i(x,y)

η = y / halfWidth(x)
```

- `zDeckStringer(x)`: longitudinal envelope
- `crossDeck`: 正規化横断profile
- `localFeature`: step/gutter/standing concave/recess
- rail join近傍はrail surfaceとのG1/G2拘束solve

```json
{
  "deck": {
    "foilRef": "deck-stringer-1",
    "stations": [
      {
        "x": 920,
        "centerHeight": 62,
        "contour": {
          "preset": "moderate_crown",
          "crownHeight": 8,
          "centerPlateauRatio": 0.25,
          "rollStartRatio": 0.45,
          "shoulderSharpness": 0.2,
          "railDrop": 12,
          "railJoinSlope": -0.45,
          "continuity": "G2"
        }
      }
    ],
    "features": []
  }
}
```

数値は構造例で標準値ではない。

## 3. 断面パラメータ

| パラメータ | 定義 |
|---|---|
| `centerDeckZ` | stationのstringer上deck高さ |
| `crownHeight` | chosen rail/shoulder baselineに対するcenterの高さ差 |
| `centerPlateauWidth` | 低曲率/flatに近い中央領域幅 |
| `rollStartY` | center plateauからrail側へ落ち始める位置 |
| `railDrop` | centerからdeck-rail joinまでの高さ差 |
| `shoulderSharpness/radius` | rollが集中する領域のradius/曲率 |
| `deckJoinSlope` | rail curveへ入る接線 |
| `deckJoinCurvature` | G2用の曲率 |
| `deckArea/fullness` | bottom基準との断面積。deck形名だけではvolumeが決まらない |
| `railThicknessAtInset` | outlineから指定距離内側のlocal thickness |
| `concaveDepth/Width` | standing concave/gutterの深さと幅 |
| `stepHeight/Width/Radius` | step featureの段差、panel幅、corner radius |

同じ厚さを持つflat deckとrolled deckでもrail thickness/shapeが大きく異なることをSURFitが断面写真で示す。[SURFit Rails & Deck（Flat vs Rolled Deck画像）](https://shop.surfit.com/pages/how-to-choose-a-surfboard-the)

## 4. 分類別の断面定義

### flat deck

- center plateau比が大きい
- center領域の `|κ|` が小さい
- rail shoulderで曲率が集中
- `flatness`を「deck全幅の直線」にせず、flat span + rail transitionで定義

CAD初期値:

- center tangent horizontal
- plateau end→deck/rail joinを1 cubic
- shoulder radiusとjoin slopeを独立

Sanded Australiaはflat deckがrail側へ厚さ/volumeを持たせやすい、domed deckはrailを薄くしやすいという設計上の関係を説明する。[Sanded Shaping Design](https://www.sanded.com.au/pages/surfboard-shaping-design)

### domed/crowned deck

- centerが高いconvex profile
- `crownHeight`, apex width, curvature biasで定義
- centerでhorizontal tangent
- rail近傍のrollが急か緩いかを別にする
- center volumeを保ちながらrail dropを増やせる

Greenlightのbuilding guideもEPS等でcenter/chest volumeを保ちrail volumeを抑える手段としてdeck domeを挙げる。[Greenlight Building Guide](https://greenlightsurfsupply.com/pages/surfboard-building-guide-how-to-shape-surf-board)

`dome`と`crown`を固定数学形状へ別々に割り当てる根拠は弱い。プリセット差は例えばdome=連続的な丸み、crown=中央peak/shoulder強めとして提供できるが、resolved curveが正本。

### step deck

feature-basedで表す。

```json
{
  "type":"deckStep",
  "mode":"centerPlateauToThinRail|railGutter|noseStep",
  "xRange":[150,1650],
  "pathYRatio":0.72,
  "height":5.0,
  "width":35,
  "cornerRadius":12,
  "fadeIn":150,
  "fadeOut":180
}
```

- hard stepならsurface partition/G0
- shaped surfboardでは通常soft step/gutterとしてG1/G2 blend
- center deck、step/gutter、outer railを別semantic regionsにする
- longitudinal fadeでnose/tailへ自然に消す

SurfScienceはstep deckをoverall volumeを犠牲にせずthin railsを得るdeck variationとして紹介する。[SurfScience: All Hands on Deck](https://www.surfscience.com/topics/surfboard-design-and-anatomy/deck/all-hands-on-deck)

### concave deck

少なくとも2 mode:

1. `standingConcave`: center standing areaが低いbowl
2. `railGutter`: center deckは高く、rail内側だけを溝状に落とす

パラメータ:

- center/path position
- width、depth、cross profile
- x start/end、fade
- bottomとのminimum thickness
- drainage/open end（深いrecessでは考慮）
- footwell front/rear depth variation

concave deckをboard rockerと混同しない。横断concavityと、side-view deck profileは別。

### combination

- flat center + rolled shoulder
- crown + rail gutter
- concave standing area + raised perimeter
- center dome + step to thin rail

名称は排他的enumでなく、base contour + local feature stackとして表現する。

## 5. deck rollとrail volume

deck rollはrail volumeを調整する主要因だが唯一ではない。local thickness:

```text
t(x,y) = zDeck(x,y) - zBottom(x,y)
```

rail volumeは、outlineから内側の指定band `Ωrail` を積分して測る。

```text
Vrail = ∫∫Ωrail t(x,y) dy dx
```

断面指標:

- thickness at 25/50/75 mm inset
- rail-band section area
- apex z ratio
- deck roll curvature
- tuck/bottom contribution

Natural Curvesはboxy railのtopがflatまたはmoderately crowned deckから続く例や、crowned/domed rail/deckとの関係を説明し、多数断面画像を掲載する。[Natural Curves Rails](https://www.naturalcurvesboards.com/html/designhtml/rails.html)

### CAD責務

- deck contourを動かす際の`lock rail profile` mode: rail joinを固定しcenter側だけ再fit
- `preserve volume` mode: dome/flat変更時にcenter heightをsolve
- `preserve center thickness` mode: rail volumeの変化を表示
- `preserve rail volume` mode: bottom/rail curveと衝突しない範囲でdeck rollをsolve

rail thicknessをdeck presetの固定副作用にせず、予測値/拘束値として扱う。

## 6. longitudinal foilとの関係

同じcross-section presetを全長へscaleすると、nose/tailでrailが不自然になる。次の長手pathsを補間する。

- `centerDeckZ(x)`
- `crownHeight(x)`
- `plateauWidth(x)`
- `rollStartRatio(x)`
- `railDrop(x)`
- `deckJoinSlope/curvature(x)`
- step/concave depth・width envelopes

cross contourとfoilを分け、key stationsでsemantic valuesをcubic B-spline補間する。Shape3Dはdeck/bottom stringerとslice control pointsを別curveとして扱い、全sliceの同セマンティック構成、少ないslice/CP、C2 optionを提供する。[Shape3D X Manual](https://www.shape3d.com/support/User_Manual_V9.htm)

### nose/tail

- nose dome/rollがtip thickness、beak、rail profileへ接続
- tail deckがtail block thickness、release edgeへ接続
- tipでwidthが小さくなるとnormalized profileが過度に急になるため、absolute radius/min thicknessを優先するblend modeが必要

## 7. Bezier/NURBS

### 最少断面

片側のcenter→rail:

1. center deck point（horizontal tangent）
2. optional plateau/shoulder point
3. deck-rail join
4. rail apex以降はrail moduleへ委譲

flat/standard crownは1–2 cubicで十分。step/gutter/concaveはfeatureごとに1–2 segmentを追加。幅stationごとに自由CPを増やさない。

### continuity

- standard deck→rail: G1最低、G2推奨
- soft step/gutter: G2またはG1 fillet
- hard step: G0 feature tag
- centerline: 対称ならvertical mirror planeに対しhorizontal tangent、通常curvatureも左右一致

### surface

- cross-sectionsをsame degree/knotへ統一してNURBS loft
- deck stringer、shoulder/gutter、deck-rail joinをguide paths
- step/chineはsurface splitまたはknot multiplicity
- station insertionはshape-preserving knot insertion

## 8. 性能に関する資料の共通傾向と注意

複数シェイピング資料で共通する大まかな説明:

- dome/crown: center/chest volumeを残しつつrailを薄くしやすい
- flat: rail側へvolumeを運びやすく、足裏のplatform感を作りやすい
- step/gutter: center volumeとthin railの両立を狙う
- concave: foot containment/低いstanding position等を狙う特殊形

ただしこれらはdeck単独の性能ではない。outline、bottom、rail apex/tuck、total volume、construction/flex、surfer体重/足位置が同時に変わる。Blue Room等はflatをstability、domeをrail-to-rail responseと簡略化するが、CAD仕様では因果を固定しない。[Blue Room Surfboard](https://blueroom.pt/en/vocabulary/surfboard/)

Surfboard volumeはlength/width/thicknessだけでなくrail、bottom、deck scoop等の総和であるとSurferも解説する。[Surfer: Volume](https://www.surfer.com/how-to/surfboard-volume)

## 9. 誤実装しやすい点

1. dome/crownを別の固定円弧enumにし、実際の曖昧さを無視
2. flat deckをrailまで完全平面にしてshoulderを失う
3. deck contourとlongitudinal foilを一つのcurveで扱う
4. center thicknessだけでdeck/rail volumeを決める
5. deck preset変更でrail apex/tuck/bottomを無断変更
6. step deckを一種類と解釈。classic step、center plateau、rail gutterは別
7. concave deckを横断concavityかrail gutterか区別しない
8. step/gutterを全stationの追加CPで作り長手に波打たせる
9. local featureのfadeをlinearにしshoulder/dimpleを作る
10. hard stepをG2 fairingで消す
11. centerline対称条件を失いridge/kinkを作る
12. rail付近でdeckがbottomを貫通/最小厚さ不足
13. tip付近でrelative scalingしcorner radiusを極端に小さくする
14. deck名称から性能を断定する

## 10. 検証とUI

### 検証

- minimum thickness map、deck-bottom intersection
- deck/rail join G1/G2 error
- centerline symmetry/kink
- unintended curvature sign change、flat spot
- shoulder/gutter/step pathsのlongitudinal wiggle
- cross-section area、rail-band area、crown/concave depthの長手グラフ
- surface fold/Jacobian、zebra/reflection lines
- total/section/rail volume変化
- stance areaの局所傾斜・急radius

### UI

- side view: deck stringer/foil
- slice view: base deck contour、local features、rail joinを色分け
- top view: plateau/roll-start/gutter/step paths
- flat/dome/crownはpreset、resolved parametersを表示
- `lock center thickness`, `preserve total volume`, `preserve rail`, `preserve bottom`
- step/concaveはfeature stackとしてenable/solo/fade編集
- same center thicknessのflat vs rolled断面とrail volume差をoverlay

## 11. 画像・専門/CAD出典

1. [SURFit Rails & Deck](https://shop.surfit.com/pages/how-to-choose-a-surfboard-the) — flat deck対rolled deck、同じdeck thicknessで異なるrail thicknessの断面画像。
2. [Natural Curves Rails](https://www.naturalcurvesboards.com/html/designhtml/rails.html) — flat/moderately crowned deck、boxy/domed rail、nose/mid/tail断面画像。
3. [Greenlight Building Guide](https://greenlightsurfsupply.com/pages/surfboard-building-guide-how-to-shape-surf-board) — flat deck/domeとrail volumeの実務説明、shaping画像。
4. [Sanded Australia Shaping Design](https://www.sanded.com.au/pages/surfboard-shaping-design) — domed/flat deckとrail thicknessの説明・画像。
5. [SurfScience: All Hands on Deck](https://www.surfscience.com/topics/surfboard-design-and-anatomy/deck/all-hands-on-deck) — flat/domed/step等のdeck variation画像。
6. [Swaylocks 7S Step Deck](https://forum.swaylocks.com/t/looking-for-drawing-of-7s-surfboards-step-deck-rail-design/50015) — rail-line deck concavity型「step deck」の実物写真と範囲。
7. [OpenShaper Design Guide](https://openshaper.com/surfboard-design-guide/) — deck/rail/bottomを含むCAD断面と3D画像。
8. [Shape3D X Manual](https://www.shape3d.com/support/User_Manual_V9.htm) / [PDF](https://shape3d.com/Manuals/User_Manual_V9.pdf) — deck stringer、slice、C2、3D layers、surface検査画像。
9. [Parametric Method to Customize Surfboard (CAD journal PDF)](https://cad-journal.net/files/vol_18/CAD_18%282%29_2021_297-308.pdf) — surfboardのparametric CAD/foil研究。
10. [Surfer: Surfboard Volume](https://www.surfer.com/how-to/surfboard-volume) — deck scoop、rail、bottomを含むvolumeの総合性。

## 実装優先順位

1. longitudinal deck foilとcross-deck contourを分離
2. crownHeight/plateau/rollStart/railDrop/deckJoinのsemantic断面generator
3. deck変更時のrail volume/total volume/min thickness表示とlock
4. step/rail gutter/standing concaveを別feature typeとして実装
5. semantic station interpolation、G2/NURBS loft、shape-preserving挿入
6. volume/thickness/zebra/curvature検証と非対称deck

## 出典評価

deck分類の専門資料はrail/bottomほど標準化されておらず、`dome/crown/step`の語はメーカー間で揺れる。本報告は複数のシェイピング資料と実物写真を照合し、名称をプリセットに降格して測定可能な断面へ分解した。性能説明は経験則を含むため、rail volume/foilとの幾何関係を中心とし、固定的な性能保証にはしていない。

