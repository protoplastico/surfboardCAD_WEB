# サーフボード・テール形状のCAD幾何分解

調査日: 2026-08-12  
担当: research-02（テール形状・CAD実装）

## 結論

テールを `squash / pin / swallow` などの名称だけから生成してはいけない。名称は末端の局所的なトポロジーを大まかに示すだけで、テール全体の幅、ヒップ、最後の12–18インチのレールライン、末端角、切欠き、面積は決まらない。実用的なCADモデルは、共通の「後部アウトライン」と、末端だけを表す「tail termination」を別レイヤーにする。

最小限必要な独立パラメータは次である。

1. `tailWidth12`（末端から12 in / 304.8 mm前方の全幅）
2. `tailWidth18`, `tailWidth6`, `tailWidth3`（必要な精度に応じた補助幅）
3. `tailBlockWidth` / `podWidth`（x=0における実材の全幅。pinでも製造上は微小正値）
4. `hipX`, `hipStrength`（曲率集中位置と強さ）
5. `railEntryTangent`（テール区間へ入る接線方向）
6. `railLineCurvature`（最後の12–18 inでの曲率分布）
7. `cornerRadius` と左右角位置（square/squash/diamond）
8. `swallowDepth`, `swallowTipSpacing`, `notchRootRadius`（swallow/fish/moon）
9. `centerTipExtension`（diamond/bat等の中心突起）
10. 接続連続性（通常G1、可能ならG2）と左右対称/非対称

SURFitはシェイパーが末端から0, 3, 6, 12, 18インチで幅・厚さ・レール・ロッカーを評価すると説明しており、テールが単一の末端輪郭ではないことを図示している。Vec Surfboardsも「tail width is not the tail shape」と明記し、テール幅は通常末端から1 ftで測る。[SURFit（測定図あり）](https://shop.surfit.com/blogs/how-to-progress-your-surfing/how-to-choose-a-surfboard-your-tail) / [Vec Surfboards](https://www.vecsurfboards.com/blog/2015/6/5/outline) / [Surf Hydrodynamics（寸法図あり）](https://www.surfhydrodynamics.com/en/Outline_surf.html)

## 1. 座標系と用語

- 半平面だけを編集する対称モデルを基本とする。
- `x=0` を物理的な最後端（tail datum）、`x>0` をノーズ方向、`y>=0` を半幅とする。
- アウトラインは `y(x)` として扱える区間を基本とする。ただしswallowの内側切欠きやdiamond末端は単一値関数で扱いにくいため、末端だけは2Dパスとして表す。
- `tailBlockWidth = 2*y(0)`。ただしswallowでは中央末端が切り込むため、「datumでの幅」ではなく左右tip間隔を別に持つ。
- `tailWidth12 = 2*y(304.8mm)`。末端形状名とは独立。
- `tail zone` の既定長は18 in（457.2 mm）、局所末端セクションは3–6 inを目安とし、固定値ではなく比率/実寸を選択可能にする。

Shape3Dは全曲線を長さ範囲内に置き、末端の幅・厚さを厳密な正値にするよう警告している。数学的なゼロ幅pinは、スライスや加工で退化/不可視となるためである。[Shape3D公式マニュアル（図あり）](https://www.shape3d.com/Support/User_Manual_V9.htm)

## 2. 幾何パラメータ仕様案

### 2.1 共通後部アウトライン

```json
{
  "tailDatumX": 0,
  "tailZoneLength": 457.2,
  "tailWidthAt": {"0": 120, "76.2": 180, "152.4": 250, "304.8": 380, "457.2": 430},
  "hip": {"x": 330, "strength": 0.55, "mode": "smooth"},
  "join": {"x": 457.2, "continuity": "G2", "tangentDeg": 7.0},
  "symmetry": "mirror"
}
```

数値は説明用でプリセット値ではない。`tailWidthAt` は全幅、内部曲線は半幅に変換する。編集UIでは12インチ幅を常時表示し、0/3/6/12/18インチ断面の幅をオプション表示する。

`hip` は独立した「出っ張り点」ではなく、曲率が強くなる領域である。Natural CurvesのShaper's Journalは、hybrid outlineでは中央の平行気味の線から短い曲線（hip）がフィンとテールへ導き、その曲線が末端まで続く場合と再び直線化する場合があると説明する。したがって `hipX` に必ずオンカーブCPを置く実装は不適切で、曲率ピークまたは曲率バイアスとしてモデル化すべきである。[Shaper's Journal PDF、pp.35–36、図あり](https://www.naturalcurvesboards.com/PDF/ShapersJournal.pdf)

### 2.2 末端タイプ別追加パラメータ

| type | 必須パラメータ | 幾何的意味 |
|---|---|---|
| square | `tailBlockWidth`, `cornerRadius` | ほぼ横断する末端線＋角。角R=0に近いほどsquare |
| squash / rounded-square | `tailBlockWidth`, `cornerRadius`, `endBulge` | 角を丸め、中央末端線を浅く膨らませる。単なる半円ではない |
| round | `tailBlockWidth`, `roundness`, `curvatureBias` | フィン付近から中央末端へ途切れない楕円的カーブ。pointで終わらない |
| round-pin | `podWidth`, `pinLength`, `roundness` | より早く絞り、ソフトポイントまたは小podへ収束 |
| pin | `tipWidthEpsilon`, `pinStartX`, `tipRadius` | 長い収束線。CAD/CNCではゼロ幅を避ける |
| swallow / fish | `tipSpacing`, `swallowDepth`, `rootRadius`, `tipRadius`, `notchShape` | 左右tipと中央rootから成る凹型末端。外レールと切欠きを別曲線にする |
| diamond | `shoulderSpacing`, `centerTipExtension`, `cornerRadius` | squareの角を切り、中心に後方頂点。左右レールの実効終端は中心より前 |
| moon/crescent | `tipSpacing`, `swallowDepth`, `rootRadius` | 中央を円弧状に除去。V切欠きとは曲率符号/分布が異なる |
| bat/star | `sideNotchDepth`, `centerTipExtension`, `rootRadius` | 中央突起の両側に凹部。単一swallowの変形として潰さない |

Greenlightは、round/round-pin/pin、swallow/moon/diamond/batを比較図で示し、cut-away系はpodの一部を除去しつつ外側レールラインを維持するものと説明している。またdeep fish swallowには寸法の固定ルールはないと明記する。[Greenlight Tail Design（複数比較画像）](https://greenlightsurfsupply.com/pages/surfboard-tail-design-greenlight-surfboard-design-guide)

## 3. 少ないBezier CPで表現する方法

### 推奨構造

半アウトラインの後部を、原則2本の三次Bezierで作る。

1. **rear rail segment**: tail-zone join → termination shoulder/tip
2. **termination segment**: shoulder/tip → center datum（square/round/pin系）

swallow系だけは外側 `rear rail` に加え、tip → notch root の内側Bezierを持つ。左右ミラーなら半側だけでよい。diamondはshoulder → center tipを直線または1本の低自由度Bezierとする。

三次Bezier `B(t)` の端点はオンカーブCP `P0,P3`、`P1,P2` はハンドルとする。後部joinで前区間の最後のハンドル `A2`、join `J`、次区間最初のハンドル `B1` を一直線に置けばG1となる。見た目の速度変化まで抑えるならハンドル長を調整してC1/G2に近づける。Shape3D公式は少ないCPほど滑らかで、角のある接線よりcontinuous tangentを推奨する。AKU Shaper公式ヘルプも最少Bezier点を推奨する。[Shape3Dマニュアル](https://www.shape3d.com/Support/User_Manual_V9.htm) / [AKU Shaper公式ヘルプ（Bezier点・接線の画面画像）](https://help.akushaper.com/article/17-hollow-wood-surfboards)

### CP配置の実装原則

- **残すべきオンカーブCP**: tail-zone join、末端shoulder/tip、必要なら曲率構造が変わるhip。末端近傍の形状調整CPを全削除しない。
- hipが滑らかな場合は、専用オンカーブCPでなくrear rail segmentの2ハンドルの位置/長さで曲率ピークを動かす。
- squashは「接続部、角接線開始、中心末端」の3アンカー（半側）で十分なことが多い。
- round/pinは「接続部、中心末端」の1 cubicで開始し、曲率診断で不足するときだけ中間アンカーを追加する。
- swallowは外レールのtipが必須アンカー、notch rootも必須アンカー。tipでは意図的な角（G0）が普通なので、外レールと内切欠きにG1を強制しない。tip半径を設定した場合のみ短いfilletで接続。
- `cornerRadius=0` のsquare/diamond角も意図的なG0。全輪郭へ一律smoothを適用してはいけない。

### 自動フィット案

幅拘束点をすべてオンカーブCPにせず、Bezierのハンドルを最小二乗で解く。目的関数例:

```text
E = Σ wi(2*By(ti) - width_i)^2
  + λ1 Σ κ'(si)^2
  + λ2 * tangent_join_error^2
  + λ3 * curvature_join_error^2
```

ここで曲率変化ペナルティ `κ'` を使い、幅測定点への一致とfairnessを両立する。角、swallow tip、notch rootの近傍はペナルティ対象から除外する。ユーザーが末端CPを動かしたら、join tangentを保持しつつ局所ハンドルだけ再解決する。

## 4. 形状名では決まらない要素

- 12インチ幅、6インチ幅、末端pod幅
- hipの有無、位置、急激さ（smooth hipかwing/flyerという角か）
- rail lineが最後まで曲がるか、末端前で直線化するか
- roundと呼ぶ範囲内の楕円率、末端幅、収束開始位置
- squashのcorner radiusと末端中央の弓なり量
- swallowの深さ、tip間隔、V/放物線/円弧、root radius、tip radius
- pinの先端が数学的点か、小さなflat/podか
- 左右対称性
- 末端の3D厚さ、rail、tuck、hard edge、rocker（平面アウトラインとは別）
- fin位置との関係

Greenlightは「tail shapeはrail lineとsurface areaの調整」であり、squareとpinを両極として他はその間の調整と説明する。SURFitの比較図も同じ18インチ幅でも末端面積が大幅に違い得ることを示す。ゆえに名称から性能や寸法を一意に逆算することはできない。

## 5. 誤実装しやすい点

1. **tail width = tail block width とする**: 通常のtail widthは12 in前方の幅。末端podとは別。
2. **tail typeが後部アウトライン全体を上書きする**: tail terminationを変えただけでhipや12インチ幅まで変化し、比較不能になる。
3. **末端近傍CPを消しすぎる**: tailBlock/corner/swallow tipを直接制御できず、join側ハンドルが後部全体を歪める。
4. **逆に測定点ごとCPを置く**: 0/3/6/12/18 inすべてがアンカーになり波打つ。測定点は拘束/ガイドにする。
5. **pinを厳密な一点にする**: Shape3Dが警告する退化幅となり、スライス、メッシュ、CNCで問題になる。`tipWidthEpsilon` とtip radiusを持つ。
6. **swallowを単なる中央V字マスクにする**: 外レールtip位置、tip角、root radius、切欠き曲線を失う。深いfishとmini-swallowが同じになる。
7. **swallow tipをsmooth化する**: tipの意図的な角が丸まり、rail endが移動する。
8. **squashを半円にする**: squashはsquare系の面積を残しつつ角を丸めたもの。round tailとは曲率分布が異なる。
9. **hipをwing/flyerと混同する**: smooth hipは曲率集中、wing/flyerは不連続なstep/corner。後者は別トポロジー/G0。
10. **top-view outlineだけでtailを完成扱いする**: 厚さ、tail rocker、rail apex/tuck/hard edgeは3D挙動と加工形状を左右する。別パラメータとして同期が必要。
11. **曲率表示なしで目視だけ**: 小さなflat spotやS字がCNC後に目立つ。Shape3Dが提供するcurvature / curvature radius表示に相当する診断を付ける。

## 6. UI/データモデルへの提案

- `Tail preset` は初期値を投入するだけにし、設定後は全パラメータを独立編集可能にする。
- top viewに0/3/6/12/18 inの幅ゲージ、tail area、曲率櫛を重ねる。
- 通常表示するCPは join、末端shape CP、必要時hipのみ。測定点はドラッグ可能な幅ガイドだがBezier CPではない。
- `preserve rear rail` トグル: termination type変更時に12/18 in幅とjoin tangentを固定する。
- `preserve tail area` トグル: 末端タイプ変更時に最後の12 inの投影面積を近似保持する。
- sharp cornerは明示的なbadgeで示し、smooth/fairコマンドの除外対象にする。
- JSONではプリセット名だけでなく解決済み寸法を保存し、バージョン変更後も形状を再現する。

## 7. 形状画像・CAD画面の参照ページ

1. [Greenlight Tail Design](https://greenlightsurfsupply.com/pages/surfboard-tail-design-greenlight-surfboard-design-guide) — round/square/squash、pin/round/round-pin、bat/swallow/moon/diamond、deep swallow寸法図、rail line比較。
2. [SURFit Tail Guide](https://shop.surfit.com/blogs/how-to-progress-your-surfing/how-to-choose-a-surfboard-your-tail) — 0/3/6/12/18 in測定図、square対pin面積、同18 in幅の末端比較、flyer/hip画像、tail一覧。
3. [Natural Curves Shaper's Journal PDF](https://www.naturalcurvesboards.com/PDF/ShapersJournal.pdf) — parallel/continuous/hybrid outlineの実形状図、round/round-pin/pin等の図と説明。
4. [AKU Shaper Hollow Wood tutorial](https://help.akushaper.com/article/17-hollow-wood-surfboards) — 実際のBezier点・接線ハンドル、outline/slice編集、少点数推奨の画面。
5. [Shape3D X Manual HTML](https://www.shape3d.com/Support/User_Manual_V9.htm) / [PDF](https://shape3d.com/Manuals/User_Manual_V9.pdf) — CP、tangent、continuous tangent、curvature表示、末端正幅のエラー回避図。
6. [SurfScience Basic Tail Shapes](https://www.surfscience.com/topics/surfboard-anatomy/tail/basic-tail-shapes) — round、swallow、square等の個別写真/図。
7. [Surf Hydrodynamics Outline](https://www.surfhydrodynamics.com/en/Outline_surf.html) — length、max width、wide point、nose/tail widthの基準図。
8. [OpenShaper design guide](https://openshaper.com/surfboard-design-guide/) — CAD上のoutline/rocker/slice/3D表示とswallow実物写真。

## 8. 出典評価と注意

- 最優先: Shape3D/AKU Shaper（CAD操作・曲線実装）、Shaper's Journal/Greenlight（シェイピング設計と比較図）。
- 補助: 個別シェイパー（Vec）、SURFit、Surf Hydrodynamics、SurfScience、OpenShaper。
- 各ページの性能説明には経験則や相互依存が含まれる。本報告では性能断定よりも、観察可能な幾何・測定慣行・CAD制約を採用した。
- Greenlightがdeep fish swallowの除去面積を「最後の1 ft面積のおよそ14%」という一貫比として紹介しているが、同ページ自身が寸法にhard and fast ruleはないとする。これは任意の初期プリセット/検証指標には使えるが、定義や強制拘束にしてはならない。

## 実装優先順位

1. `tailWidth12` と `tailBlockWidth/tipSpacing` の分離
2. 末端shape CPの復元・常時保持
3. rear railとterminationを別Bezierに分割しjoin G1を保証
4. 0/3/6/12/18 in幅ガイドと曲率表示
5. swallowの外レールtip/内切欠き分離
6. G2/fairness最適化、area-preserve、非対称tail

