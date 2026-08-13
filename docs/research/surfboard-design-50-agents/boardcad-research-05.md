# サーフボード・ノーズ形状のCAD幾何分解

調査日: 2026-08-12  
担当: research-05（ノーズCAD幾何）

## 結論

ノーズは `pointed / round / rounded-point / beak` という名称だけでは定義できない。CADでは、ボード中央から続く前部レールラインと、先端数インチのtermination（tip/pod）を分離する必要がある。特に `noseWidth12`、wide pointの位置、前部アウトラインの曲率分布、tip幅/半径は独立である。

最少構成は、片側アウトラインを原則2本の三次Bezierにする。

1. `front rail`: 中央/前部joinからtip transitionまで
2. `nose termination`: transitionから中心線上の先端podまで

pointed noseでも製造・スライス上は厳密なゼロ幅にせず、小さな正の `tipPodWidth` と `tipRadius` を持たせる。末端近傍CPは局所的なtip丸み・pod幅を制御するため残し、接続前の不要なオンカーブCPは削減してハンドルで曲率を作る。

## 1. 測定基準と座標系

- 全長を `L`、tail datumを `x=0`、nose datumを `x=L` とする。
- 対称形では半幅 `y(x)>=0` のみ編集する。
- `noseWidth12 = 2*y(L-304.8 mm)`。これは先端幅ではない。
- `widePointX` と `maxWidth` は独立。wide pointは通常、長さ中央と一致するとは限らない。
- `tipPodWidth = 2*y(L)`。実装内部ではpointedでも正値epsilonを推奨。
- `noseZoneLength` は既定12–24 in程度の編集領域だが、板長に対する比率/実寸を選べるようにする。

Greenlightはnose/tail widthをそれぞれ末端から12 inで測り、wide pointがmidpointとは限らないため位置を確認すべきだと図付きで説明する。[Greenlight Outline Design](https://greenlightsurfsupply.com/pages/surfboard-outline-design-greenlight-surfboard-design-guide) Surf Hydrodynamicsもoutlineをlength、maximum width、その位置、nose/tail widthで記述する。[Surf Hydrodynamics（寸法図）](https://www.surfhydrodynamics.com/en/Outline_surf.html)

## 2. 推奨パラメータ

```json
{
  "nose": {
    "preset": "rounded_point",
    "zoneLength": 457.2,
    "widthAt": {
      "tip": 8.0,
      "76.2": 105.0,
      "152.4": 190.0,
      "304.8": 365.0,
      "457.2": 430.0
    },
    "tip": {
      "podWidth": 8.0,
      "radius": 5.0,
      "roundness": 0.45,
      "bluntness": 0.1
    },
    "frontRail": {
      "joinXFromTip": 457.2,
      "entryTangentDeg": 7.5,
      "curvatureBias": 0.55,
      "continuity": "G2"
    },
    "widePoint": {
      "xFromTail": 940.0,
      "width": 510.0
    }
  }
}
```

数値は仕様例でありプリセット推奨寸法ではない。最低限保存すべきものは次の通り。

| パラメータ | 意味 | 他から推定不可な理由 |
|---|---|---|
| `noseWidth12` | tipから12 in後方の全幅 | nose名やtip radiusが同じでも変えられる |
| `noseWidth6`, `noseWidth18/24` | 局所/前部の幅分布 | 同じ12 in幅でも先端/中央へのつながりが違う |
| `tipPodWidth` | datumでの有限幅 | pointed/roundの語から加工値は決まらない |
| `tipRadius` | 平面上の先端フィレット | pod幅とは独立。小podでも鈍いtipが可能 |
| `widePointX`, `maxWidth` | 最大幅と長手位置 | midpoint固定ではない |
| `entryTangent` | nose zone joinでの接線 | 接続のkinkを防ぐ |
| `curvatureBias` / `curvaturePeakX` | どこで絞りが強まるか | rounded-point内でも大きく異なる |
| `joinContinuity` | G1/G2 | 形状名では決まらない品質条件 |
| `symmetry` | mirror/asymmetric | 非対称設計を許すなら必須 |

AKU Shaperの画面ではnose/tail、末端から1 ft/2 ftの幅、厚さ、rockerが別の寸法として表示される。[AKU Top/Bottom Tabs（画面画像）](https://help.akushaper.com/article/40-top-bottom-tabs-how-to)

## 3. プリセットは局所terminationの初期値に限定する

### pointed

- 小さい `tipPodWidth`、小さい `tipRadius`
- tipまで比較的長く収束する
- `noseWidth12` は狭い傾向だが、定義には含めない
- 数学的一点ではなくepsilon podを使う

### rounded-point

- pointedよりtip radius/前部幅を増やし、roundより早く収束
- 単一円弧ではなく、front railからtipへの曲率増加位置を編集可能にする

### round/full

- 大きなnoseWidth12と大きなtip radiusを持つことが多い
- ただしfullness（前部面積）とtip丸みを別パラメータにする
- 半円プリセットで前部全体を上書きしない

### beak / beaked

- **注意:** 一般にbeak noseは平面outlineだけでなく、deck/foilが先端まで厚みを保ち、側面profileに嘴状の形が現れる概念を含む。plan-view presetだけで再現済みとしてはいけない。
- outline側はpoint/rounded-pointとして持ち、`profile.noseBeak`、先端厚さ、deck tangentを別データにする。
- AKU公式はTop/Bottomタブでnoseに点を追加してbeak noseを作る例を示すが、これは厚さ/profile編集である。[AKU Top/Bottom Tabs](https://help.akushaper.com/article/40-top-bottom-tabs-how-to)

### square/blunt nose（特殊形）

- centerline tipへ収束せず、明示的な横断podと角/filletを持つ
- round noseを切り詰めるだけでなく `podWidth`, `cornerRadius`, `frontRailJoin` を持つ

プリセット変更時は `noseWidth12`, wide point, front-rail join tangentを保持するモードを既定にする。プリセットはterminationハンドル/半径の初期値で、自由曲線データを破壊してはならない。

## 4. 最少Bezier CPの設計

### 推奨アンカー

片側で通常必要なオンカーブ点は次の3点のみ。

1. `J`: nose zoneとmain outlineのjoin
2. `T`: tip transition（局所丸み/収束を切り替える点）
3. `N`: 先端podの片端または中心datum近傍

`J→T` と `T→N` を各1本のcubic Bezierとする。pointedで単一cubicが十分fairならTを省き `J→N` 1本も可能。ただし、末端を微調整したいUIではTまたはN近傍のshape CP/ハンドルを残す方が安全である。

### CPの役割

- **末端CP (`N`)**: tip位置、pod半幅、tip tangentを決める。削除するとtipを動かすために長いfront rail全体が変形する。
- **tip transition CP (`T`)**: tip radiusと12インチ幅の影響を分離する。末端形状を独立編集する境界。
- **join CP (`J`)**: main outlineとの位置連続を保証する。
- **join直前/直後のハンドル**: 接線と曲率の橋渡し。オンカーブ点を増やす代わりに使う。
- **接続前の余分なオンカーブCP**: 明確な曲率構造や幅拘束を表さないなら削除候補。測定点はアンカーではなく拘束/ガイドとして扱う。

AKU公式ヘルプはoutlineをBezier点とtangent pointで編集し、最少点数がgentle flowing curveを作りlumps/bumpsを減らすと説明し、nose寄りに1点だけ追加した画像を掲載する。[AKU Hollow Wood tutorial](https://help.akushaper.com/article/17-hollow-wood-surfboards) Shape3Dも少ないCPほど滑らかで、angular tangentよりcontinuous tangentを推奨する。[Shape3D X Manual HTML](https://www.shape3d.com/support/User_Manual_V9.htm) / [PDF](https://shape3d.com/Manuals/User_Manual_V9.pdf)

## 5. 接続連続性

隣り合うcubicを `A=[A0,A1,A2,J]`, `B=[J,B1,B2,B3]` とする。

- G0: `A3=B0=J`（位置だけ）
- G1: `A2, J, B1` が一直線で向きが同じ（見た目のkinkなし）
- C1: 加えて `|J-A2| = |B1-J|`（同一パラメータ尺度なら一階微分一致）
- G2: join前後の曲率も一致。front outlineでは可能ならこれを目標にする

ノーズのmain rail joinは通常G1以上、理想はG2。tip podと左右輪郭の接続は形状による。round/pointedはsmooth、square/bluntのcornerは意図的G0または小filletであり、一律smoothを掛けない。

### fitting

0/6/12/18/24 inの幅を全てCPにせず、ハンドルを拘束最適化する。

```text
E = Σ wi (2*By(ti) - width_i)^2
  + λf ∫ (dκ/ds)^2 ds
  + λt * joinTangentError²
  + λk * joinCurvatureError²
```

幅誤差にfairness（曲率変化）を加える。tipの意図的な高曲率域は重みを下げる。曲率櫛とcurvature radiusの最小値をUIに表示する。

## 6. wide pointとentry rail curvature

front railはwide pointの位置/接線から影響を受けるが、wide pointからnose tipまでを1個の楕円にしてはいけない。Natural CurvesのShaper's Journalは、parallel、continuous curve、hybrid outlineを区別し、hybridではwide point付近の平行気味な線から長いcontinuous curveでnoseへつなぐと説明する。[Shaper's Journal PDF、pp.32–36（各outline図）](https://www.naturalcurvesboards.com/PDF/ShapersJournal.pdf)

実装上は次を分離する。

- `widePointX/maxWidth`: 全体プランシェイプ
- `frontParallelism`: wide point前方で幅をどれだけ維持するか
- `noseCurveStartX`: 絞りが視覚的に始まる位置
- `curvaturePeakX`: 最大曲率の位置
- `noseWidth12`: 12 in基準幅
- `tip geometry`: 最後の局所形状

「entry rail curvature」は水へのentryという性能語と混同し得るので、データ名は `frontOutlineCurvature` または `noseRailLineCurvature` が安全。bottom entry rocker/entry concaveはtop-view outlineとは別曲線である。

## 7. 誤実装しやすい点

1. **nose widthをtip/pod幅と解釈**: 業界測定は通常tipから12 in。
2. **wide pointを常にlength center固定**: 明確に誤り。位置もデータ化する。
3. **nose presetで前半outlineを全置換**: wide point、前部平行度、12 in幅を意図せず変える。
4. **pointed noseを厳密ゼロ幅にする**: Shape3Dはnose/tailの幅と厚さを厳密な正値にするよう警告する。末端sliceやメッシュが退化する。[Shape3D Manual](https://www.shape3d.com/support/User_Manual_V9.htm)
5. **末端CPを削除**: tipの微調整ができず、join側ハンドルで前部全体を歪める。
6. **12 in等の各測定点を全てBezier anchor化**: flat spot、波打ち、過拘束を生む。ガイド/soft constraintにする。
7. **round noseを半円と決め打ち**: 同じnoseWidth12でも楕円率、前部面積、tip radiusが異なる。
8. **beakをplan-view形状とだけ解釈**: beakの主要特徴である厚さ/foil/profileを失う。
9. **noseとtailを単純ミラー実装**: twin-tip以外ではwide point、曲率、末端処理、測定目的が異なる。共通曲線エンジンは使えてもパラメータは独立。
10. **top outlineとnose rocker/rail profileを混同**: nose plan shape、side-view rocker、cross-section rail、foilは別曲線。3D loftで整合を検査する。
11. **G1だけでfairと判断**: tangentは連続でも曲率ジャンプで肩/flat spotが見える。G2または曲率診断が必要。
12. **effective lengthをtip形状と混同**: Shape3Dはeffective lengthを幅が最大幅の半分となる点までの距離とし、tipを丸く/細くしても同じ場合があると説明する。tipだけで前部全体の性格を表せない。

## 8. UI/データ構造提案

- `Nose preset` は初期値としてのみ作用。適用時に `preserve noseWidth12`, `preserve widePoint`, `preserve join tangent` を既定ON。
- top viewにtipから3/6/12/18/24 in幅ゲージを表示。ガイド点はBezier anchorと別色/別型。
- 通常表示するCPはjoin、tip transition、tipだけ。advancedでハンドルと曲率櫛を表示。
- 末端CPを非表示にする最適化は禁止。非表示化するなら直接数値編集と局所ハンドルを必ず残す。
- `tipPodWidth=0` 入力は内部epsilonへclampし、UI上「visual point」と加工幅を分けてもよい。
- resolved geometry（全寸法・ハンドル）をJSON保存し、preset名だけの保存を避ける。
- beakは `outline.nosePreset` でなく `foil/profile.noseBeak` に置く。
- validation: 幅の単調性を強制しすぎない（特殊nose/非対称を許す）が、loop、負幅、曲率反転、最小半径、join discontinuityを警告。

## 9. 画像掲載・専門資料URL

1. [Greenlight Surfboard Outline Design](https://greenlightsurfsupply.com/pages/surfboard-outline-design-greenlight-surfboard-design-guide) — outline blending、nose width、12インチ測定の図。
2. [Shape3D X Manual HTML](https://www.shape3d.com/support/User_Manual_V9.htm) / [PDF](https://shape3d.com/Manuals/User_Manual_V9.pdf) — CP/tangent、曲率表示、continuous tangent、nose/tail正幅の注意図。
3. [AKU Hollow Wood tutorial](https://help.akushaper.com/article/17-hollow-wood-surfboards) — 背景画像合わせ、nose側Bezier追加、点/接線の画面。
4. [AKU Top/Bottom Tabs](https://help.akushaper.com/article/40-top-bottom-tabs-how-to) — nose/tailの1 ft/2 ft寸法表示、beak nose用点追加の画像。
5. [Natural Curves Shaper's Journal](https://www.naturalcurvesboards.com/PDF/ShapersJournal.pdf) — parallel/continuous/hybrid outline図とnose分類。
6. [Surf Hydrodynamics Outline](https://www.surfhydrodynamics.com/en/Outline_surf.html) — length、wide point、nose/tail widthの定義図。
7. [SurfScience: The Nose Knows](https://www.surfscience.com/topics/surfboard-anatomy/nose/the-nose-knows) — 複数nose variationの比較画像。
8. [SurferToday Nose Shapes](https://www.surfertoday.com/surfing/surfboard-nose-shapes) — round、rounded-point、pointedの実物写真。
9. [Sticks Nose Guide](https://www.sticks.surf/guide/anatomy/nose) — pointedとround/fullの比較表示。
10. [AKU Shaper Software](https://akushaper.com/software) — outline/rocker/dimensionを別管理するCAD画面。

## 10. 実装優先順位

1. `noseWidth12`、`tipPodWidth/radius`、`widePointX/maxWidth`を分離
2. 末端shape CPを保持し、接続前の余分なオンカーブCPのみ削減
3. `front rail` と `termination` の2-segment化、join G1保証
4. プリセット適用時にwide point/12 in幅/join tangentを保持
5. 0/3/6/12/18/24 in幅ガイドと曲率櫛
6. G2 fitting、非対称nose、profile/foilとの3D整合検証

## 出典評価

CAD挙動と曲線要件にはShape3D・AKU Shaper公式を最優先し、寸法慣行とアウトライン構成にはGreenlightとShaper's Journalを主に使用した。一般サーフメディアの性能説明は相互依存・経験則が大きいため、形状写真と分類の補助に限定した。本仕様の数値例は説明用で、名称別の普遍的標準寸法ではない。

