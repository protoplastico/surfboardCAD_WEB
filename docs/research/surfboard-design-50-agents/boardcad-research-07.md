# サーフボード・アウトライン全体のCAD設計

調査日: 2026-08-12  
担当: research-07（全体アウトライン、wide point、曲率、非対称）

## 結論

アウトライン（plan shape/template）は「nose preset + rail preset + tail preset」の継ぎ足しではなく、左右それぞれの半幅関数と、そこへ接続する局所的なnose/tail terminationとして設計すべきである。最低限、長さ、最大幅とその位置、nose/tailの基準幅、中央付近のparallelism、前後の曲率分布、hip、接続連続性が必要である。

少ないBezier CPでfairな輪郭を得るには、測定ステーションを全てオンカーブCPにせず「拘束点」とし、構造が変わる箇所だけをアンカーにする。対称形の片側では通常、nose rail、central rail、tail railの3本（各cubic）＋局所terminationで足りる。区間joinは最低G1、通常G2を目標にする。

## 1. 座標と基本寸法

- `x=0`: tail datum、`x=L`: nose datum、centerlineを`y=0`
- 右半幅 `yR(x)>=0`、左半幅 `yL(x)>=0`。対称時のみ `yL=yR`
- `maxWidth = yL(widePointX)+yR(widePointX)`
- 非対称では左右の最大半幅位置が違い得るため `widePointLeft`, `widePointRight` も保存
- `noseWidth12 = yL(L-304.8)+yR(L-304.8)`
- `tailWidth12 = yL(304.8)+yR(304.8)`
- 18/24 in幅も同様。幅は中心線に直角なplan-view chordとして定義
- tip/pod/block寸法はnose/tail widthとは別

Greenlightは通常仕様をlength、nose width、wide-point width、tail widthで記述し、nose/tail widthは各端から12 in、wide pointはmidpointとは限らないと図示する。[Greenlight Outline Design（寸法・outline比較画像）](https://greenlightsurfsupply.com/pages/surfboard-outline-design-greenlight-surfboard-design-guide) Surf Hydrodynamicsもlength、maximum width、その位置、nose/tail widthをoutlineの定義量として挙げる。[Surf Hydrodynamics（基準図）](https://www.surfhydrodynamics.com/en/Outline_surf.html)

## 2. 推奨CADパラメータ

```json
{
  "outline": {
    "length": 1828.8,
    "symmetry": "mirror",
    "maxWidth": 500.0,
    "widePoint": {"xFromTail": 895.0, "plateauLength": 90.0},
    "stations": {
      "tail": {"12": 385.0, "18": 430.0, "24": 458.0},
      "nose": {"12": 345.0, "18": 405.0, "24": 450.0}
    },
    "centralRail": {
      "parallelism": 0.62,
      "length": 240.0,
      "curvatureTarget": 0.00015
    },
    "frontRail": {"curvatureBias": 0.52, "joinContinuity": "G2"},
    "rearRail": {
      "curvatureBias": 0.61,
      "hip": {"mode": "smooth", "xFromTail": 330.0, "strength": 0.45},
      "joinContinuity": "G2"
    },
    "terminationRefs": {"nose": "nose-1", "tail": "tail-1"}
  }
}
```

数値はデータ構造例で標準寸法ではない。`stations` は実寸幅拘束、`parallelism` は正規化された形状パラメータ。JSONには最終Bezier/拘束解も保存し、プリセット名だけで再生成しない。

### 必須/推奨パラメータ

| 分類 | パラメータ | 意味 |
|---|---|---|
| 基本 | `L`, `maxWidth`, `widePointX` | 全体の長さ・最大幅・最大幅位置 |
| 前部幅 | nose 12/18/24 in | noseへの幅分布。12だけでは曲線は一意でない |
| 後部幅 | tail 12/18/24 in | tailへの幅分布。tail shape名とは独立 |
| 中央 | `parallelism`, `plateauLength` | wide point近傍で半幅をどれだけ維持するか |
| 前後 | curvature bias/peak | 曲率をnose/tailのどこへ集中するか |
| hip | position/strength/mode | smoothな曲率集中、またはwing/bumpという角 |
| 局所末端 | nose/tail termination ref | tip/pod/block/swallow等を全体railから分離 |
| 品質 | G1/G2, fairness weight | joinと曲率変化の条件 |
| 非対称 | sideごとの全項目、stance | toe/heelまたはleft/rightの独立形状 |

0/3/6/12/18/24 inを使う詳細なシェイピング寸法表の例は、Huddersfield大学のサーフボード製造研究にも掲載される。[Van Zandt thesis PDF（幅ステーション図）](https://eprints.hud.ac.uk/id/eprint/34979/1/FINAL%20THESIS%20-%20Van-Zandt.pdf)

## 3. wide point

wide pointは単なる「中央CP」ではなく、次を分けて扱う。

1. `widePointX`: 最大幅の長手位置
2. `maxHalfWidthLeft/Right`
3. `widePointTangent`: 滑らかな最大値ならcenterlineと平行、すなわち `dy/dx=0`
4. `plateauLength`: 最大幅付近が点状か、幅を長く保つか
5. `widePointCurvature`: 最大幅近傍がflat/parallel寄りかcurvyか

最大幅のCPを1個動かすだけのUIでは、位置、幅、plateau、前後曲率が連動してしまう。`widePointX/maxWidth`を数値拘束にし、central Bezierのハンドル長でplateauを制御する方がよい。

Vec Surfboardsはwide pointがcenterとは限らず、nose/tail widthとそれらの間の曲線がoutlineを決めると説明する。[Vec Surfboards Outline](https://www.vecsurfboards.com/blog/2015/6/5/outline)

## 4. parallel rail、continuous curve、hybrid

### parallel rail

「parallel」は幾何学的な完全直線を意味しないことが多い。Greenlightは、現代のボードで長い完全平行線は普通ではなく、wide point隣接部のほぼ直線的な曲線をparallelと呼ぶと説明する。parallel sectionはwide pointを長くし、curvy outlineなら削られる面積を保つ。[Greenlight（curvy対parallel比較図）](https://greenlightsurfsupply.com/pages/surfboard-outline-design-greenlight-surfboard-design-guide)

CADでは `parallelism` を次の複合指標として扱える。

- 指定区間の平均 `|dy/dx|`
- その区間の平均/最大曲率 `|κ|`
- 最大幅に対する幅保持率 `y(x)/ymax`
- 区間長 `parallelLength`

`parallelism=1`を直線に固定せず、低曲率のfair curveとする。

### continuous curve

Natural CurvesのShaper's Journalは、continuous curve outlineをsmoothでほぼ楕円的な連続曲線、parallel outlineを長いほぼ直線曲線、hybridを両者の組合せとして図解する。hybridではwide point付近のparallel lineから、長いcontinuous curveでnoseへ、短いhip curveでfins/tailへつなぐ。[Shaper's Journal PDF、pp.32–36](https://www.naturalcurvesboards.com/PDF/ShapersJournal.pdf) 同資料のWeb版にも各カテゴリー/板種の画像がある。[Natural Curves Templates](https://www.naturalcurvesboards.com/html/designhtml/templates.html)

`continuous curve` は「全輪郭を1本のBezierで作る」意味ではない。区分曲線でもG2でfairならcontinuous curveである。逆に1本でも曲率が不自然なら良いアウトラインではない。

## 5. hip、bump、wingを区別する

- **smooth hip**: rail line内で曲率が局所的に増える領域。G2を維持可能
- **bump**: より明確な方向変化。丸めたtransitionならG1/G2、設計によっては視覚的shoulder
- **wing/flyer**: railを内側へstepさせる明示的corner/offset。G0/G1の意図的な不連続を持ち得る

Greenlightはhipをrail curveのbreakとし、bump/wingより前に置かれることが多いと述べる。Natural Curvesはhybrid outlineの短いhipがfins/tailへ導き、そのままtailへ曲がる場合と直線化する場合を分ける。したがってhipを必ず一点の角CPとして実装するのは誤り。

推奨データ:

```json
{"hip":{"mode":"smooth|bump|wing","x":330,"strength":0.45,"offset":0,"radius":40}}
```

`smooth`は曲率ピーク、`wing`はトポロジー/offset、`bump`は中間。fairing時にwingの角を自動で消さない。

## 6. effective rail line

この語は資料やシェイパー間で単一の標準寸法としては定義されていない。少なくとも次の3概念が混同されやすい。

1. top-viewのoutline curveに沿う幾何学的rail arc length
2. ターン中に水面/波面へ実際にengageするrailの長さ（姿勢・rocker・rail断面依存）
3. nose/tailの細いtipを除いた実効的なplan-shape長

Shape3Dの `Effective Length` は、tailから「幅が最大幅の半分になる点」までの距離と定義し、nose tipを丸く/細く変えても同じであり得る。これは一般的なengaged rail lengthと同義ではない。[Shape3D X Manual](https://www.shape3d.com/support/User_Manual_V9.htm)

実装では曖昧な単一 `effectiveRailLine` を避け、次を明示名で計算する。

- `outlineArcLengthLeft/Right = ∫sqrt(1+(dy/dx)^2)dx`
- `halfWidthEffectiveLength`（Shape3D型の閾値、閾値も保存）
- `engagedRailEstimate`（3D姿勢、水面、rocker/rail断面を使う解析値。top viewだけから断定しない）
- `straightnessIndex` / `curvatureIntegral`（rail characterの比較値）

## 7. 最少Bezier構造

### 対称形の片側

原則:

1. nose termination（tip→front transition）
2. front rail（front transition→wide-point region）
3. central/rear rail（wide-point region→tail transition）
4. tail termination（tail transition→末端）

ただしcentralの前後性格が違う場合はwide point付近で分け、全体3 rail cubic＋2 termination程度とする。wide point、12/18/24 in測定点を全てCPにしない。

### アンカーを置く条件

- トポロジーが変わる（wing、swallow tip、square corner）
- 局所terminationを独立編集する境界
- 曲率設計が明確に切り替わり、1 cubicでfairに再現できない
- 左右非対称の対応関係を明示する必要がある

幅station、widePointX、面積はconstraint。曲線はハンドル最適化で合わせる。AKU ShaperはoutlineのBezier点とtangentを編集し、最少点数がgentle flowing curvesとlump/bump低減につながると公式に説明する。[AKU Shaper tutorial（画面画像）](https://help.akushaper.com/article/17-hollow-wood-surfboards) Shape3Dも「less points the smoothest」とcontinuous tangentを推奨する。[Shape3D Manual（CP・接線・曲率画像）](https://www.shape3d.com/support/User_Manual_V9.htm)

## 8. G1/G2とfairness

隣接cubic `A=[A0,A1,A2,J]`, `B=[J,B1,B2,B3]` では:

- G0: `A3=B0=J`
- G1: `A2,J,B1`が同一直線上で同方向
- C1: パラメータ尺度が同じならjoin両側のハンドル長も一致
- G2: join両側の曲率一致

通常rail joinはG2を目標にし、wing/cornerだけ明示的に除外する。G2でも曲率の微分が急変すればshoulderが見えるため、曲率変化のfairnessも評価する。

```text
min E = Σstation wi(widthCurve(xi)-widthTarget_i)^2
      + λ1∫(dκ/ds)^2ds
      + λ2Σjoin tangentError²
      + λ3Σjoin curvatureError²
      + λ4(area-areaTarget)²
```

UIにcurvature comb、曲率半径、station errorを表示する。Shape3Dがcurvature/curvature radiusを表示するのはこの検査に対応する。

## 9. 非対称アウトライン

非対称は対称形を生成後に片側だけスケールするのではなく、左右独立の半幅曲線として持つ。

```json
{
  "symmetry":"asymmetric",
  "stance":"regular",
  "sideMapping":{"right":"heel","left":"toe"},
  "left":{"widePointX":910,"stations":{},"segments":[]},
  "right":{"widePointX":870,"stations":{},"segments":[]}
}
```

必要項目:

- stance（regular/goofy）とtoe/heel mapping
- 左右別のwide point、12/18/24 in半幅、arc length、hip、tail termination
- centerline上nose/tail datumを共有するか、sideごとの実効終端をoffsetするか
- 左右別のrail profile/rocker/fin geometryへの参照

asymmetrical boardに単一標準はない。SurferTodayは左右を折って一致しないことだけが共通し、一方のrailが長く、toe/heelでrail/tail/fin位置が異なる例を写真付きで説明する。[SurferToday Asymmetrical](https://www.surfertoday.com/surfing/what-is-an-asymmetrical-surfboard) Surf Simplyは身体力学が非対称であることを設計理由として歴史と実例を解説する。[Surf Simply](https://surfsimply.com/magazine/the-history-of-surfboard-design-asymmetric-surfboards) 写真例は[Barry Snyder Designs](https://www.barrysnyderdesigns.com/asymmetrical-designs.html)にもある。

「toe sideは必ず長い」とhard-codeしない。一般例として長い/straightなtoe側と短い/curvyなheel側が多く紹介されるが、波向き、stance、設計意図で変わる。role labelを保存し、geometryは自由にする。

## 10. 誤実装しやすい点

1. wide pointを常にlength midpointに置く
2. `noseWidth/tailWidth`を末端pod/block幅と解釈する
3. 12 in幅だけで前後曲線を一意に決める
4. 12/18/24 inを全てBezier CP化し波打たせる
5. parallel railを完全な直線/ゼロ曲率として長く固定する
6. continuous curveを単一Bezier segmentと同義にする
7. smooth hip、bump、wingを同じ「hip CP」で処理する
8. tail/nose preset変更で全体railやwide pointまで上書きする
9. G1だけでfairと判定し、曲率jump/flat spotを見逃す
10. top-view arc lengthを実際のengaged rail lengthと断定する
11. 非対称を左右の単純scale差だけで作る
12. left/rightだけ保存しstance/toe/heel対応を失う
13. outline、rocker、rail cross-section、foilを混同する
14. point tipの幅を厳密ゼロにし、slice/meshを退化させる。Shape3Dはnose/tailの幅・厚さを正値にするよう警告する

## 11. UI提案

- top viewに0/3/6/12/18/24 in station、wide point位置、曲率櫛を重ねる
- station handleはBezier CPと形/色を分ける
- simple mode: length/max width/wide point/12 in widths/parallelism/hip
- advanced: 18/24 in、curvature peak、G2 weights、area target、左右独立
- nose/tail presetには `preserve main rail`, `preserve station widths`, `preserve area` を用意
- CP追加時に「この点は構造変更か、単なる幅拘束か」を選択。後者ならCPを増やさずconstraint化
- asymmetry modeはleft/rightとtoe/heelを同時表示し、stance変更時はgeometryを反転するかroleだけ変更するか確認
- validation: loop、負幅、不意の曲率反転、join error、最小曲率半径、左右datumずれを警告

## 12. 画像・専門資料URL

1. [Greenlight Outline Design](https://greenlightsurfsupply.com/pages/surfboard-outline-design-greenlight-surfboard-design-guide) — 寸法、curve blending、curvy対parallel、hipの図。
2. [Natural Curves Shaper's Journal PDF](https://www.naturalcurvesboards.com/PDF/ShapersJournal.pdf) — parallel/continuous/hybrid各outline、hip、tail分類図。
3. [Natural Curves Templates Web](https://www.naturalcurvesboards.com/html/designhtml/templates.html) — 板種別parallel/continuous outline画像。
4. [Shape3D X Manual](https://www.shape3d.com/support/User_Manual_V9.htm) / [PDF](https://shape3d.com/Manuals/User_Manual_V9.pdf) — Bezier、CP/tangent、curvature、effective length、末端正幅。
5. [AKU Shaper tutorial](https://help.akushaper.com/article/17-hollow-wood-surfboards) — outline tracing、最少Bezier点、接線ハンドルのCAD画面。
6. [Surf Hydrodynamics Outline](https://www.surfhydrodynamics.com/en/Outline_surf.html) — outline基本寸法図、wide point。
7. [Vec Surfboards Outline](https://www.vecsurfboards.com/blog/2015/6/5/outline) — nose/wide point/tail widthとcurveの説明、実例画像。
8. [OpenShaper Design Guide](https://openshaper.com/surfboard-design-guide/) — outline/rocker/slice/3D、volume distributionのCAD画像。
9. [SurferToday Asymmetrical](https://www.surfertoday.com/surfing/what-is-an-asymmetrical-surfboard) — Carl Ekstrom系asymの実物写真と左右rail説明。
10. [Surf Simply Asymmetric History](https://surfsimply.com/magazine/the-history-of-surfboard-design-asymmetric-surfboards) — 歴史的/現代的実例。
11. [Barry Snyder Asymmetrical Designs](https://www.barrysnyderdesigns.com/asymmetrical-designs.html) — シェイパーによるasym写真・fin/outline説明。
12. [Van Zandt thesis](https://eprints.hud.ac.uk/id/eprint/34979/1/FINAL%20THESIS%20-%20Van-Zandt.pdf) — 0/3/6/12/18/24 in幅とwide pointを使う製造図。

## 実装優先順位

1. `widePointX/maxWidth`、nose/tail 12 in幅、tip/blockを分離
2. stationをconstraint化し、Bezier CPと分離
3. front/central/rear railを少数cubicで構成しjoin G1保証
4. curvature combとG2/fairness fitting
5. smooth hip/bump/wingの型分離
6. 左右独立曲線＋stance/toe/heel mapping
7. 3D姿勢を使うengaged rail解析（top view指標と名称を分ける）

## 出典評価

曲線/CAD仕様はShape3D・AKU Shaper公式、outline分類と測定慣行はGreenlight・Natural Curves Shaper's Journal・Surf Hydrodynamicsを優先した。非対称は単一標準がないため、歴史資料・シェイパー例・写真資料を組み合わせた。性能説明はoutline以外のrocker、rail、bottom、finと相互依存するため、本稿では主に観察可能な幾何とデータ設計へ限定した。

