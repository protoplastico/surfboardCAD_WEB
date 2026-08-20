# サーフボード画像リンク品質検証（第41担当）

検証日: 2026-08-12（Asia/Tokyo）  
対象: `/tmp/boardcad-research-36.md` の32項目  
方法: `curl -L` によるGET（redirect追従、原則15–20秒timeout）で最終HTTP status、`Content-Type`、effective URLを確認。`#page=`等のfragmentはHTTP要求に送られない。bot対策・TLS chain・地域差により、ブラウザでの結果が異なる場合がある。

## 判定記号

- **直通**: URL自体が `image/*` または `application/pdf` を返す。
- **ページ**: `text/html`。画像そのものではなく、掲載位置を示すcanonical page。
- **恒久性 高/中/低**: DOI・論文ページ等を高、管理された掲載ページを中、CDN version付き・推測ファイル名・login redirect等を低とした相対評価。
- ライセンス欄は「アクセス可能」と「転載可能」を分離する。到達できても、明示ライセンスがなければ転載可とはしない。

## 32件のHTTP・品質監査

| # | 対象（提供者） | Direct/assetの実測 | 掲載ページの実測 | 種別 | 恒久性 | 更新・代替URL | ライセンス注記 |
|---:|---|---|---|---|---|---|---|
| 1 | pin/round tail（Greenlight） | **200 `image/png`** | **200 `text/html`** | 直通 | 中（CDN query依存） | 現URL有効。失効時は[tail guide](https://greenlightsurfsupply.com/pages/surfboard-tail-design-greenlight-surfboard-design-guide)から再取得 | 不明、要許諾 |
| 2 | diamond/moon/bat/swallow（Greenlight） | **200 `image/png`** | **200 `text/html`** | 直通 | 中 | 現URL有効。親ページをcanonicalにする | 不明、要許諾 |
| 3 | tail width（Greenlight） | **200 `image/png`** | **200 `text/html`** | 直通 | 中 | 現URL有効 | 不明、要許諾 |
| 4 | tail類型（Surf Hydrodynamics） | **200 `image/png`** | **200 `text/html`** | 直通 | 中 | [画像](https://www.surfhydrodynamics.com/en/images/tails_surf.png) / [ページ](https://www.surfhydrodynamics.com/en/Tail_shape_surf.html) とも有効 | サイト©表記。要許諾 |
| 5 | rail水流（Greenlight） | **404 `text/html`** | **200 `text/html`** | 元direct破損 | 低→中 | 現行HTML内の代替: [Surfboard-Rail-Water-Flow-Design.png](https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard-Rail-Water-Flow-Design_grande_4c97d4c1-941a-4861-88a6-22ee278cff53_480x480.png?v=1581368457) | 不明、要許諾 |
| 6 | 50/50 rail（Greenlight） | **404 `text/html`** | **200 `text/html`** | 元direct破損 | 低→中 | 代替: [Surfboard-5050_Rail_design.png](https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard-5050_Rail_design_480x480.png?v=1581373358) | 不明、要許諾 |
| 7 | rail tuck/release（Greenlight） | **404 `text/html`** | **200 `text/html`** | 元direct破損 | 低→中 | 元ファイル名は消失。現行比較図候補: [Rail-Water-interation.png](https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard-Rail-Water-interation_grande_eb055266-0bdf-4057-8d7a-34018e12565a_480x480.png?v=1581368457)。意味対応は目視再確認要 | 不明、要許諾 |
| 8 | tuck/付着/release（Greenlight） | **404 `text/html`** | **200 `text/html`** | 元direct破損 | 低→中 | #7同様。現行rail guideをcanonicalとし、画像同定は目視で行う | 不明、要許諾 |
| 9 | boxy/crowned rail（Natural Curves） | **200 `text/html`** | **200 `text/html`** | ページのみ | 中 | [rails page](https://www.naturalcurvesboards.com/html/designhtml/rails.html) を維持。direct imageではない | 転載条件不明 |
| 10 | rail foil series（Natural Curves） | **200 `text/html`** | **200 `text/html`** | ページ＋fragment | 中 | 同ページ。fragmentはサーバー検証対象外 | 転載条件不明 |
| 11 | concave流向（Greenlight） | **404 `text/html`** | **200 `text/html`** | 元direct破損 | 低→中 | 代替候補: [Bottom-Contour-Design-Concaves.png](https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard-Bottom-Contour-Design-Concaves_grande_758c934e-cad4-4f24-8204-6b79d9e28b34_480x480.png?v=1581368457) | 不明、要許諾 |
| 12 | convex belly（Greenlight） | **404 `text/html`** | **200 `text/html`** | 元direct破損 | 低→中 | 代替: [Belly-Rolled.png](https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard-Bottom-Contour-Design-Belly-Rolled_grande_5c97ae99-1392-4c2a-8c21-0680f4f11344_480x480.png?v=1581374229) | 不明、要許諾 |
| 13 | panel vee（Greenlight） | **404 `text/html`** | **200 `text/html`** | 元direct破損 | 低→中 | 代替: [Panel-Vee.png](https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard-Bottom-Contour-Design-Panel-Vee_large_a5fce144-7f3e-4858-825c-983961771ffb_480x480.png?v=1581368456) | 不明、要許諾 |
| 14 | spiral vee（Greenlight） | **404 `text/html`** | **200 `text/html`** | 元direct破損 | 低→中 | 代替: [Spiral-Vee.png](https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard-Bottom-Contour-Design-Spiral-Vee_grande_fd6cb04e-3382-4322-b600-2a12cec6ea89_480x480.png?v=1581368456) | 不明、要許諾 |
| 15 | belly hull（Greenlight） | **404 `text/html`** | **200 `text/html`** | 元direct破損 | 低→中 | 現行ページでは#12のBelly/Rolled図が近い。旧「Hull」図との同一性は未確認 | 不明、要許諾 |
| 16 | rolled vee（Greenlight） | **404 `text/html`** | **200 `text/html`** | 元direct破損 | 低→中 | 代替: [Rolled-Vee.png](https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard-Bottom-Contour-Design-Rolled-Vee_grande_96271a58-aae2-40c4-a32d-c8e287f60a21_480x480.png?v=1581368457) | 不明、要許諾 |
| 17 | concave-in-vee（Greenlight） | **404 `text/html`** | **200 `text/html`** | 元direct破損 | 低→中 | 代替: [Concaved-Vee.png](https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard-Bottom-Contour-Design-Concaved-Vee_grande_3e50d27a-7001-4ed8-88f5-641622e4bc76_480x480.png?v=1581374499) | 不明、要許諾 |
| 18 | single-to-double shaping（Greenlight） | **404 `text/html`** | **200 `text/html`** | 元direct破損 | 低→中 | 旧process画像は現行HTMLで同名取得できず。[bottom guide](https://greenlightsurfsupply.com/pages/surfboard-bottom-contour-design-greenlight-surfboard-design-guide)を代替 | 不明、要許諾 |
| 19 | bottom断面列（Natural Curves） | **200 `text/html`** | **200 `text/html`** | ページのみ | 中 | [bottoms page](https://naturalcurvesboards.com/html/designhtml/bottoms.html) 有効 | 転載条件不明 |
| 20 | rocker stick（Greenlight） | **200 `text/html`** | **200 `text/html`** | ページのみ | 中 | URLをdirect asset欄でなくpage欄へ移すべき | 不明、要許諾 |
| 21 | rocker曲線比較（Greenlight） | **200 `text/html`** | **200 `text/html`** | ページ内図 | 中 | standalone未確定。見出し名と親ページを保存 | 不明、要許諾 |
| 22 | rail/stringer rocker（Natural Curves） | **200 `text/html`** | **200 `text/html`** | ページのみ | 中 | [rocker page](https://naturalcurvesboards.com/html/designhtml/rocker.html) 有効 | 転載条件不明 |
| 23 | CAD 4-view（OpenShaper） | **301→200 `text/html`** | 同左 | ページのみ | 中 | effective URLは末尾slashなし。canonical: `https://openshaper.com/surfboard-design-guide` | 転載条件不明 |
| 24 | volume distribution（OpenShaper） | **301→200 `text/html`** | 同左 | ページ内図 | 中 | #23と同じcanonical page | 転載条件不明 |
| 25 | fin flow/force（AFMC/Monash） | **TLS検証失敗（HTTP status取得不能）** | 同左 | PDF想定、現環境不可 | 低 | 証明書chain不備。URLはHTTPSだが自動取得には不向き。会議proceedings/機関repositoryの代替を探索すべき | 学術引用可。図の転載条件は不明 |
| 26 | fin CAD/CFD（Cal Poly） | **302→200 `text/html`（login page）** | **200 `text/html`** | 元directはPDFでない | 低→高 | direct CGIを廃止し、[repository record](https://digitalcommons.calpoly.edu/theses/1983/) または DOI `10.15368/theses.2019.8` をcanonicalにする | repository公開≠自由転載。条件確認 |
| 27 | quad fin CFD（MDPI） | **200 `application/pdf`** | **403 `text/html`**（curl） | 直通PDF | 高 | [PDF](https://mdpi-res.com/d_attachment/applsci/applsci-10-00816/article_deploy/applsci-10-00816.pdf)を維持。ページ403はbot対策の可能性 | Applied Sciences articleはCC BY 4.0。third-party credit line確認 |
| 28 | pressure sensor/tank（Nature） | **200 `text/html`** | **200 `text/html`** | figure page（画像直通でない） | 高 | [Figure 1 page](https://www.nature.com/articles/s41598-025-94834-0/figures/1) とarticle DOI pageをcanonicalにする | articleのOA license・figure credit lineを個別確認 |
| 29 | sandwich composite（PMC/MDPI） | **404 `text/html`** | **200 `text/html`** | 元figure path破損 | 低→高 | [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC10304318/) をcanonicalにし、本文のFigure 1から再解決 | CC BY 4.0。ただし図のcredit line確認 |
| 30 | CNC UI（Shape3d） | **200 `application/pdf`** | **200 `text/html`** | 直通PDF | 高 | [manual PDF](https://shape3d.com/Manuals/User_Manual_V9.pdf) / [support page](https://www.shape3d.com/Support/User_Manual_V9.htm) とも有効 | software manual。転載条件不明 |
| 31 | nose比較（SurfScience） | **200 `text/html; charset=utf-8`** | 同左 | ページのみ | 中 | [nose page](https://www.surfscience.com/topics/surfboard-anatomy/nose/the-nose-knows) 有効。direct assetではない | 転載条件不明 |
| 32 | nose/rocker/duck dive（SURFit） | **200 `text/html`** | 同左 | ページのみ | 中 | [SURFit page](https://shop.surfit.com/pages/how-to-choose-a-surfboard-the-nose) 有効。direct assetではない | commercial page、要許諾 |

## 集計と修正優先度

- 元の32件のうち、明確な直通assetとして有効: **#1–4, #27, #30（6件）**。
- 元directが404: **#5–8, #11–18, #29（13件）**。Greenlight 12件には現行HTMLから代替候補を抽出したが、#7/#8/#15/#18は旧図との意味的同一性を目視確認してから差し替える。
- 最初からpage-onlyまたはpage内図: **#9, #10, #19–24, #28, #31, #32（11件）**。データモデル上 `directAssetUrl` と `pageUrl` を同値にせず、前者をnullにする。
- 特殊失敗: **#25**はTLS certificate chain、**#26**はlogin redirect。URL文字列がPDF風でも`Content-Type`を必ず検証する。

### 推奨データ構造

```json
{
  "pageUrl": "canonical HTML or DOI landing page",
  "assetUrl": "verified image/* or application/pdf, otherwise null",
  "assetKind": "image | pdf | page-figure",
  "http": {"status": 200, "contentType": "image/png", "verifiedAt": "2026-08-12"},
  "stability": "high | medium | low",
  "license": {"status": "open | restricted | unknown", "reuseNotes": "..."}
}
```

## 運用上の結論

画像URLの保存だけでは不十分で、常にcanonical掲載ページ、最終確認日、Content-Type、ライセンス根拠を併記する。UIへ恒久同梱する図は、CC BY等が確認できる学術図をcredit条件に従って使うか、専門資料を事実確認にのみ用いて独自図を作成するのが安全である。
