# サーフボード設計資料：画像ポリシーとVerified Gallery

作成日: 2026-08-12  
根拠資料: `/tmp/boardcad-research-36.md`、`/tmp/boardcad-research-41.md`

## 1. 画像利用ポリシー

### 基本方針

1. **原則は転載せず、canonical掲載ページへリンクする。** 商用サイト、シェイパーの解説、ソフトウェアmanualは、閲覧できることと再利用できることを区別する。
2. direct image URLは同定・監査用metadataとして保持しても、UIからのhotlink表示には使わない。CDN URLの変更、第三者サーバー負荷、利用規約、Referer制限に弱いためである。
3. `assetUrl`には実測で`image/*`または`application/pdf`を返したURLだけを入れる。HTML figure pageや記事URLをdirect assetとして扱わない。
4. 404、login redirect、TLS failure、意味的同一性が未確認の代替画像はgalleryから除外する。親ページは参考資料として残せる。
5. CC BY等のopen licenseでも、著者、作品名、掲載誌、URL、license linkを表示し、figureごとのthird-party credit lineを確認する。
6. アプリに恒久同梱する説明図は、許諾済み素材または独自に作図した図を使う。独自図は複数資料から事実を確認し、元画像の構図・線・ラベル・色を実質的に複製しない。
7. alt textは性能の俗説を断定せず、画像から直接観察できる形状・view・比較軸を記述する。

### UI表示ルール

- gallery cardは `topic`、`view`、提供者、短いalt text、license status、`掲載ページを開く` を表示する。
- 画像previewは、`reuse-approved`または明示的な許諾がある場合だけ有効化する。それ以外は図を模したplaceholderと外部リンクを表示する。
- 外部リンクには `verifiedAt` と状態を付ける。90日を目安に再検証し、4xx/5xx、Content-Type変化、redirect先変化を検出する。
- PDFはpage/figure番号を注記するが、`#page=N`はviewer hintであり恒久的なfigure identifierではない。
- performance captionは「一般に」「他条件が同じなら」等の条件を付け、画像提供者の説明と科学的検証を混同しない。

### 推奨license status

| status | 意味 | preview | 外部リンク |
|---|---|---:|---:|
| `open-verified` | license本文と対象figureの適用を確認済み | 可、帰属必須 | 可 |
| `open-pending-credit-check` | articleはopenだがfigure credit未監査 | 保留 | 可 |
| `permission-required` | ©表記または通常の著作権管理 | 不可 | 可 |
| `unknown` | 再利用条件を確認できない | 不可 | 可 |
| `broken-or-unverified` | 到達不能または意味対応未確認 | 不可 | gallery非掲載 |

## 2. Verified Gallery

以下は2026-08-12時点で掲載ページまたはassetが到達可能で、対象との意味対応を保てる項目。`Link mode`が`page`の項目は外部ページへのリンクのみとし、画像を転載・埋込表示しない。

| ID | Topic | View | 提供者 | Alt text（日本語） | Link mode / verified URL | License status |
|---|---|---|---|---|---|---|
| VG-01 | tail shapes | plan | Greenlight Surf Supply | ピン、ラウンド、ラウンデッドピンのテール外形を上面から並べた比較図 | page: [Tail Design Guide](https://greenlightsurfsupply.com/pages/surfboard-tail-design-greenlight-surfboard-design-guide) / asset監査済み | `unknown` |
| VG-02 | tail shapes | plan | Greenlight Surf Supply | ダイヤモンド、ムーン、バット、スワローのテール末端形状を並べた上面比較図 | page: [Tail Design Guide](https://greenlightsurfsupply.com/pages/surfboard-tail-design-greenlight-surfboard-design-guide) / asset監査済み | `unknown` |
| VG-03 | tail measurement | plan / dimension | Greenlight Surf Supply | テール端から所定距離の位置でテール幅を測る箇所を示した寸法図 | page: [Tail Design Guide](https://greenlightsurfsupply.com/pages/surfboard-tail-design-greenlight-surfboard-design-guide) / asset監査済み | `unknown` |
| VG-04 | tail shapes | plan / diagram | Surf Hydrodynamics | 複数のテール外形を上面図で分類した図 | page: [Tail Shape](https://www.surfhydrodynamics.com/en/Tail_shape_surf.html) / [verified PNG](https://www.surfhydrodynamics.com/en/images/tails_surf.png) | `permission-required` |
| VG-05 | rails | section / flow | Greenlight Surf Supply | レール断面周囲で水流が回り込み、ボトム側から離れる概念を示す図 | page: [Rail Design Guide](https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide) | `unknown` |
| VG-06 | rail types | section | Greenlight Surf Supply | 50/50、60/40、80/20など、apex位置の異なるレール断面を比較する図 | page: [Rail Design Guide](https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide) | `unknown` |
| VG-07 | rail foil | section series | Natural Curves Surfboards | ノーズからテールへ変化するショートボードのレール断面列 | page: [Rails](https://www.naturalcurvesboards.com/html/designhtml/rails.html) | `unknown` |
| VG-08 | bottom contours | section | Greenlight Surf Supply | フラット、コンケーブ、vee、bellyなどのボトム横断面を比較する図群 | page: [Bottom Contour Guide](https://greenlightsurfsupply.com/pages/surfboard-bottom-contour-design-greenlight-surfboard-design-guide) | `unknown` |
| VG-09 | panel vee | section | Greenlight Surf Supply | centerlineが左右のパネルより低く見えるpanel veeの横断面図 | page: [Bottom Contour Guide](https://greenlightsurfsupply.com/pages/surfboard-bottom-contour-design-greenlight-surfboard-design-guide) | `unknown` |
| VG-10 | spiral vee | section / longitudinal sequence | Greenlight Surf Supply | 長手方向にconcaveとveeの比率が変化するspiral veeの概念図 | page: [Bottom Contour Guide](https://greenlightsurfsupply.com/pages/surfboard-bottom-contour-design-greenlight-surfboard-design-guide) | `unknown` |
| VG-11 | bottom families | section series | Natural Curves Surfboards | shortboard、step-up、gunなどのボトム断面変化を並べた図 | page: [Bottoms](https://naturalcurvesboards.com/html/designhtml/bottoms.html) | `unknown` |
| VG-12 | rocker measurement | profile / measurement | Greenlight Surf Supply | 基準線とrocker stickを用いてノーズ・テールの持ち上がりを測る側面図 | page: [Rocker and Foil Guide](https://greenlightsurfsupply.com/pages/surfboard-rocker-and-foil-design-greenlight-surfboard-design-guide) | `unknown` |
| VG-13 | rocker curves | profile comparison | Greenlight Surf Supply | 同じ端部rocker値でも途中の曲線分布が異なることを示す側面比較図 | page: [Rocker and Foil Guide](https://greenlightsurfsupply.com/pages/surfboard-rocker-and-foil-design-greenlight-surfboard-design-guide) | `unknown` |
| VG-14 | rail/stringer rocker | profile / diagram | Natural Curves Surfboards | centerline、rail、deck、bottomの長手方向曲線の違いを示す側面図 | page: [Rocker](https://naturalcurvesboards.com/html/designhtml/rocker.html) | `unknown` |
| VG-15 | CAD views | plan / profile / section / 3D | OpenShaper | outline、rocker、断面、三次元形状を同じ設計画面で確認するCAD表示 | page: [Surfboard Design Guide](https://openshaper.com/surfboard-design-guide) | `unknown` |
| VG-16 | volume distribution | plan / graph | OpenShaper | ボード長手方向のvolume distributionと重心情報を示すCADグラフ | page: [Surfboard Design Guide](https://openshaper.com/surfboard-design-guide) | `unknown` |
| VG-17 | fin hydrodynamics | bottom plan / CFD | Oggiano et al., Applied Sciences | quad設定でrear fin位置を変えた配置図と数値流体解析結果 | page: [Applied Sciences 10(3), 816](https://www.mdpi.com/2076-3417/10/3/816) / [verified PDF](https://mdpi-res.com/d_attachment/applsci/applsci-10-00816/article_deploy/applsci-10-00816.pdf) | `open-pending-credit-check` |
| VG-18 | fin instrumentation | photo / schematic | Scientific Reports | 圧力センサー付きフィン、試験装置、サーフボードへの実装位置を示す写真と模式図 | page: [Scientific Reports article](https://www.nature.com/articles/s41598-025-94834-0) / [Figure 1](https://www.nature.com/articles/s41598-025-94834-0/figures/1) | `open-pending-credit-check` |
| VG-19 | composite construction | section / material schematic | O’Dea et al., Materials | フォームcore、skin laminateなど典型的なサーフボードsandwich構造を示す模式断面 | page: [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC10304318/) | `open-pending-credit-check` |
| VG-20 | CNC workflow | CAD/CAM screenshots | Shape3d | blank、cutter、machine設定、toolpathを示すサーフボードCAD/CAM画面 | page: [Shape3d manual page](https://www.shape3d.com/Support/User_Manual_V9.htm) / [verified PDF](https://shape3d.com/Manuals/User_Manual_V9.pdf) | `unknown` |
| VG-21 | nose shapes | plan | SurfScience | pointed、rounded-point、roundのノーズ外形を上面から比較する解説 | page: [The Nose Knows](https://www.surfscience.com/topics/surfboard-anatomy/nose/the-nose-knows) | `unknown` |
| VG-22 | nose width/rocker | plan / profile / photo | SURFit | wide、medium、narrow noseとnose rocker、duck dive時の違いを説明する写真群 | page: [How to Choose a Surfboard: The Nose](https://shop.surfit.com/pages/how-to-choose-a-surfboard-the-nose) | `unknown` |

## 3. Galleryから除外する項目

- Greenlight旧direct URLのうち404だった#5–8、#11–18のURL文字列そのもの。galleryでは生きている親ページだけを使う。
- #7、#8、#15、#18の代替CDN候補。現行ページには関連図があるが、旧図との意味的同一性を目視確認できるまでassetとして登録しない。
- Monash AFMC PDF（旧#25）。現環境でTLS certificate chainを検証できない。
- Cal Poly CGI PDF（旧#26）。PDFではなくlogin HTMLへredirectする。repository recordは文献リンクとしてのみ保持する。
- PMCの旧figure path（旧#29）。404のため、article pageからfigureを辿る。

## 4. 実装用metadata例

```json
{
  "id": "VG-04",
  "topic": ["tail", "outline", "tail-shapes"],
  "view": ["plan", "diagram"],
  "provider": "Surf Hydrodynamics",
  "alt": "複数のテール外形を上面図で分類した図",
  "pageUrl": "https://www.surfhydrodynamics.com/en/Tail_shape_surf.html",
  "assetUrl": "https://www.surfhydrodynamics.com/en/images/tails_surf.png",
  "linkMode": "page",
  "previewAllowed": false,
  "license": {
    "status": "permission-required",
    "note": "サイトに著作権表記。転載前に権利者の許諾が必要"
  },
  "http": {
    "pageStatus": 200,
    "assetStatus": 200,
    "assetContentType": "image/png",
    "verifiedAt": "2026-08-12"
  }
}
```

## 5. 最終判断

このgalleryは「画像集」ではなく、設計用語を正しいviewの資料へ結び付ける検証済み索引として扱う。現時点で外部画像previewを既定有効にできる素材はない。まずリンク参照で運用し、open licenseのfigure credit監査または権利者許諾が完了した項目だけを段階的にpreviewへ昇格させる。
