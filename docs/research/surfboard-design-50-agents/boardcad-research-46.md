# BoardCAD設計調査 bibliography（重複排除版）

作成日・最終アクセス日: **2026-08-12**  
対象: `/tmp/boardcad-research-01.md`〜`45.md`（存在した43文書）

## 集計と正規化

- URL出現: 524件（原文抽出、同一文書内の反復を含む）。
- 正規化後の有効な一意URL: **195件**。
- 正規化: scheme/host小文字化、`www.`除去、末尾slash・fragment除去。queryは画像versionやresource識別に必要なため保持。
- 除外: 架空example URL 1件、省略記号placeholder 2件、途中で切れたDOI 1件。
- `docs`は引用元research番号。`topic`はその文書の担当topicから付与した索引で、URLページの査読分類を意味しない。
- categoryは排他的な管理区分: **primary**=CAD製品/プロジェクト自身の資料、**official**=標準団体・CADベンダー公式技術資料、**academic**=論文・学位論文・大学repository、**shaper**=シェイパー/設計者自身の専門資料、**commercial**=販売店・専門メディア・ブログ・画像CDN等。

### category件数

|category|件数|
|---|---:|
|primary|19|
|official|22|
|academic|37|
|shaper|24|
|commercial|93|

## 重複・同一resource family

- Greenlightの同一design guideが多数文書で反復。個別画像CDN URLは親ページの派生assetとして残した。
- Shape3D manualは `/Support/User_Manual_V9.htm`, `/support/User_Manual_V9.htm`, PDFの3 URL。bibliographic workとしては同一manual family。
- Greenlight Shopify CDN画像15件は親design guide由来。画像provenance用途では個別保持し、主張の出典は親ページを優先。
- MDPI/PMC/Nature等のarticle page、PDF、figure pageは同一workの表現違い。URL単位では保持し、引用時はarticle landing pageを優先。
- Semantic Scholar/CiteSeerX mirrorは原著の恒久identifierではない。DOI/機関repositoryが判明したら置換する。
- `shop.surfit.com/pages/how-to-choose-a-surfboard-the` は切れた可能性が高く、**要修復**として残した。

## Primary / CADプロジェクト公式

|URL|topic|docs|access|
|---|---|---|---|
|<https://akushaper.com.au/machines-pro-model>|CNC|30|2026-08-12|
|<https://akushaper.com/>|rail CAD, CNC|11, 30|2026-08-12|
|<https://akushaper.com/faq>|file formats|29|2026-08-12|
|<https://akushaper.com/software>|nose/CAD, bottom CAD, rail performance, file formats, CNC|05, 14, 18, 29, 30|2026-08-12|
|<https://akushaper.com/tutorial-videos/v/introductory-tutorial-2-designing-slices>|rail CAD, bottom CAD|11, 14|2026-08-12|
|<https://havardnj.github.io/boardcad-le>|file formats|29|2026-08-12|
|<https://help.akushaper.com/>|CNC|30|2026-08-12|
|<https://help.akushaper.com/article/17-hollow-wood-surfboards>|outline/tail, nose/CAD, outline/asymmetry, rail CAD, bottom CAD, surface CAD, reverse engineering|02, 05, 07, 11, 14, 25, 34|2026-08-12|
|<https://help.akushaper.com/article/37-slices-rails-how-to>|rail CAD, bottom CAD, surface CAD|11, 14, 25|2026-08-12|
|<https://help.akushaper.com/article/40-top-bottom-tabs-how-to>|nose/CAD|05|2026-08-12|
|<https://help.akushaper.com/article/52-image-board>|reverse engineering|34|2026-08-12|
|<https://shape3d.com/Default.aspx>|CNC|30|2026-08-12|
|<https://shape3d.com/Manuals/User_Manual_V9.pdf>|outline/tail, nose/CAD, outline/asymmetry, rail CAD, bottom CAD, rail performance, deck/volume, surface CAD, file formats, CNC, reverse engineering, images|02, 05, 07, 11, 14, 18, 22, 25, 29, 30, 34, 36|2026-08-12|
|<https://shape3d.com/Products/Shape3dX.aspx>|file formats|29|2026-08-12|
|<https://shape3d.com/support/User_Manual_V9.htm>|nose/CAD, outline/asymmetry, rail CAD, bottom CAD, rail performance, deck/volume, surface CAD|05, 07, 11, 14, 18, 22, 25|2026-08-12|
|<https://shape3d.com/Support/User_Manual_V9.htm>|outline/tail, CNC, reverse engineering, images|02, 30, 34, 36|2026-08-12|
|<https://shape3d.com/Support/VideoTutorials.aspx>|rail CAD, bottom CAD|11, 14|2026-08-12|
|<https://shape3d.net/Products/ImportOption.aspx>|reverse engineering|34|2026-08-12|
|<https://shape3d.org/Products/Features.aspx>|file formats|29|2026-08-12|

## Official / 標準・CAD技術資料

|URL|topic|docs|access|
|---|---|---|---|
|<https://autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/How-to-create-a-Loft-with-guide-rails-in-Fusion.html>|surface CAD|25|2026-08-12|
|<https://developer.rhino3d.com/en/guides/general/essential-mathematics/parametric-curves-surfaces>|surface CAD|25|2026-08-12|
|<https://docs.mcneel.com/rhino/6mac/help/en-us/commands/curvature.htm>|curve fairness|28|2026-08-12|
|<https://docs.mcneel.com/rhino/7/training-command/en-us/usersguide/Rhino%20User%27s%20Guide%20for%20Windows.pdf>|surface CAD|25|2026-08-12|
|<https://docs.mcneel.com/rhino/8/help/en-us/commands/loft.htm>|surface CAD|25|2026-08-12|
|<https://docs.mcneel.com/rhino/9/help/en-us/popup_moreinformation/continuity_descriptions.htm>|curve fairness|28|2026-08-12|
|<https://docs.nvidia.com/smlib/manual/smlib/fillets>|edge CAD/CNC|20|2026-08-12|
|<https://help.autodesk.com/cloudhelp/2017/ENU/AutoCAD-DXF/files/index.htm>|file formats|29|2026-08-12|
|<https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm>|file formats|29|2026-08-12|
|<https://help.autodesk.com/cloudhelp/2022/ENU/Alias-ImportExportData/files/File-format-reference/GUID-A6F13C9D-9A69-4B72-A25C-55A144B8535F.html>|file formats|29|2026-08-12|
|<https://help.autodesk.com/cloudhelp/2022/ENU/Alias-Tool-Palette-Reference/files/Surfaces-palette/GUID-C4A14175-8BED-4B74-856C-5704468E942C.html>|edge CAD/CNC|20|2026-08-12|
|<https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-Core/files/GUID-0A041818-2E32-4212-A3D8-CE0361C3D229.htm>|surface CAD|25|2026-08-12|
|<https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-Core/files/GUID-3AAB133D-8A9F-43E3-89AD-D88DAE6982C0.htm>|file formats|29|2026-08-12|
|<https://help.autodesk.com/cloudhelp/2023/ENU/Alias-Getting-Started/files/theory-builders/GUID-882B194B-E044-4921-B130-47391EFA1443.html>|curve fairness|28|2026-08-12|
|<https://help.autodesk.com/cloudhelp/2023/ENU/Alias-NURBS-Modeling/files/Create-geometry/Build-transition-secondary/GUID-0DA4843D-4B9D-424B-B787-D4332A6AAA49.html>|edge CAD/CNC|20|2026-08-12|
|<https://help.autodesk.com/cloudhelp/2024/ENU/Alias-Getting-Started/files/alias-golden-rules/GUID-151252E8-8E7F-4119-90D1-9784A81C402A.html>|curve fairness|28|2026-08-12|
|<https://help.autodesk.com/cloudhelp/2025/ENU/Alias-Video-Tutorials/files/essential-concepts/cvs-hulls-and-degree.html>|curve fairness|28|2026-08-12|
|<https://help.autodesk.com/cloudhelp/2026/ENU/Alias-Video-Tutorials/files/essential-concepts/continuity-g0-g1-g2-g3.html>|curve fairness|28|2026-08-12|
|<https://nist.gov/publications/initial-graphics-exchange-specification-iges-version-20>|file formats|29|2026-08-12|
|<https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nbsir88-3813.pdf>|file formats|29|2026-08-12|
|<https://techbase.ironcad.jp/portal/en/kb/articles/create-variable-fillet>|edge CAD/CNC|20|2026-08-12|
|<https://wwws.loc.gov/preservation/digital/formats/fdd/fdd000505.shtml>|file formats|29|2026-08-12|

## Academic / 論文・学位論文

|URL|topic|docs|access|
|---|---|---|---|
|<https://advanced.onlinelibrary.wiley.com/doi/abs/10.1002/adem.71000>|materials|27|2026-08-12|
|<https://arxiv.org/abs/2104.14547>|reverse engineering|34|2026-08-12|
|<https://arxiv.org/abs/2202.06330>|surface CAD|25|2026-08-12|
|<https://arxiv.org/abs/2212.03600>|reverse engineering|34|2026-08-12|
|<https://arxiv.org/abs/2212.07941>|CNC|30|2026-08-12|
|<https://cad-journal.net/files/vol_18/CAD_18%282%29_2021_297-308.pdf>|bottom, rocker measurement, rocker/CAD, deck/volume|12, 15, 17, 22|2026-08-12|
|<https://citeseerx.ist.psu.edu/document?doi=467a0bcb0d02a5cda785750e2d3db9e84e44b74d&repid=rep1&type=pdf>|rocker/CAD|17|2026-08-12|
|<https://cs.cmu.edu/afs/cs/academic/class/15456-f15/Handouts/CAGD-chapter8.pdf>|curve fairness|28|2026-08-12|
|<https://csusm.edu/surfresearch/documents/nessler-sports-eng-2017.pdf>|foil|21|2026-08-12|
|<https://digitalcommons.calpoly.edu/cgi/viewcontent.cgi?article=2984&context=theses>|images|36|2026-08-12|
|<https://digitalcommons.calpoly.edu/theses/1983>|fin hydrodynamics, images|24, 36|2026-08-12|
|<https://doi.org/10.1016/j.compositesb.2026.113610>|materials|27|2026-08-12|
|<https://doi.org/10.15368/theses.2019.8>|fin hydrodynamics|24|2026-08-12|
|<https://eprints.hud.ac.uk/id/eprint/34979/1/FINAL%20THESIS%20-%20Van-Zandt.pdf>|outline/asymmetry|07|2026-08-12|
|<https://flair.monash.edu.au/intranet/proceedings/15afmc/papers/AFMC00105.pdf>|fin hydrodynamics, images|24, 36|2026-08-12|
|<https://link.springer.com/article/10.1557/s43580-022-00311-5>|fin hydrodynamics|24|2026-08-12|
|<https://mdpi-res.com/d_attachment/applsci/applsci-10-00816/article_deploy/applsci-10-00816.pdf>|fin hydrodynamics, images|24, 36|2026-08-12|
|<https://mdpi.com/2075-1702/10/10/905>|reverse engineering|34|2026-08-12|
|<https://mdpi.com/2076-3417/10/3/816>|fin hydrodynamics, images|24, 36|2026-08-12|
|<https://mdpi.com/2504-3900/2/6/309>|rocker performance|16|2026-08-12|
|<https://mdpi.com/2504-3900/49/1/68>|bottom/flow, rocker performance|13, 16|2026-08-12|
|<https://mja.com.au/journal/2014/201/9/surfboard-related-eye-injuries-new-south-wales-1-year-prospective-study>|nose/rail safety|06|2026-08-12|
|<https://mja.com.au/system/files/issues/201_09/how00567.pdf>|nose/rail safety|06|2026-08-12|
|<https://nature.com/articles/s41598-025-94834-0>|bottom/flow, fin hydrodynamics, images|13, 24, 36|2026-08-12|
|<https://nature.com/articles/s41598-025-94834-0/figures/1>|images|36|2026-08-12|
|<https://pdfs.semanticscholar.org/6157/1cad433c7b1ef93d2abb0c158606b1812194.pdf>|materials|27|2026-08-12|
|<https://pdfs.semanticscholar.org/b955/9fac13cb973f20a63af6078ae34d3c751fe6.pdf>|tail/measurement, nose/rail safety, rail/flow, bottom, rocker measurement|03, 06, 09, 12, 15|2026-08-12|
|<https://pdfs.semanticscholar.org/f0e6/f889c6dfd8d1398ed2bacb323ed53c02d196.pdf>|rail/flow|09|2026-08-12|
|<https://pmc.ncbi.nlm.nih.gov/articles/PMC10304318>|materials, images|27, 36|2026-08-12|
|<https://pmc.ncbi.nlm.nih.gov/articles/PMC10304318/figure/materials-16-04680-f001>|images|36|2026-08-12|
|<https://pubmed.ncbi.nlm.nih.gov/9801037>|nose/rail safety, edge CAD/CNC|06, 20|2026-08-12|
|<https://repository.library.noaa.gov/view/noaa/46334/noaa_46334_DS1.pdf>|materials|27|2026-08-12|
|<https://rosdok.uni-rostock.de/file/rosdok_disshab_0000001598/rosdok_derivate_0000034805/Dissertation_Edessa_2016.pdf>|reverse engineering|34|2026-08-12|
|<https://sciencedirect.com/science/article/pii/S0924013697003415>|reverse engineering|34|2026-08-12|
|<https://scitepress.org/PublishedPapers/2007/20827/pdf/index.html>|reverse engineering|34|2026-08-12|
|<https://tandfonline.com/doi/pdf/10.1080/10618562.2026.2668432>|edge/flow|19|2026-08-12|
|<https://www2.eecs.berkeley.edu/Pubs/TechRpts/1993/CSD-93-732.pdf>|rocker/CAD|17|2026-08-12|

## Shaper / 設計者一次専門資料

|URL|topic|docs|access|
|---|---|---|---|
|<https://1974surfboards.com/en/surfboards/noserider>|longboard|32|2026-08-12|
|<https://barrysnyderdesigns.com/asymmetrical-designs.html>|outline/asymmetry, asymmetry|07, 31|2026-08-12|
|<https://bigcarlsurfboards.com/models/noserider>|longboard|32|2026-08-12|
|<https://bonzer5.com/bonzermechanics>|fins|23|2026-08-12|
|<https://bonzer5.com/histories>|fins|23|2026-08-12|
|<https://darcysurfboards.com/pages/surfboard-anatomy>|terminology|35|2026-08-12|
|<https://harboursurfboards.com/design-2-1>|tail, terminology, preset audit|01, 35, 37|2026-08-12|
|<https://harboursurfboards.com/surfboard-construction>|nose, foil, longboard|04, 21, 32|2026-08-12|
|<https://lundquistsurfboards.com/build-guide/fin-placement-guide>|fins|23|2026-08-12|
|<https://lundquistsurfboards.com/models/dutchman>|longboard|32|2026-08-12|
|<https://mccoysurfboards.com/why-geoff-mccoys-designs-have-less-hard-edge>|edge/flow|19|2026-08-12|
|<https://naturalcurvesboards.com/html/designhtml/bottoms.html>|bottom, bottom/flow, archetypes, terminology, images|12, 13, 33, 35, 36|2026-08-12|
|<https://naturalcurvesboards.com/html/designhtml/foils.html>|foil|21|2026-08-12|
|<https://naturalcurvesboards.com/html/designhtml/rails.html>|rail taxonomy, rail/flow, rail bands, rail CAD, rail performance, edge/flow, edge CAD/CNC, deck/volume, longboard, archetypes, images|08, 09, 10, 11, 18, 19, 20, 22, 32, 33, 36|2026-08-12|
|<https://naturalcurvesboards.com/html/designhtml/rocker.html>|rocker measurement, rocker performance, rocker/CAD, archetypes, images|15, 16, 17, 33, 36|2026-08-12|
|<https://naturalcurvesboards.com/html/designhtml/singledoubleconcaves.html>|bottom CAD|14|2026-08-12|
|<https://naturalcurvesboards.com/html/designhtml/surfboardclassesmodelslong.html>|longboard|32|2026-08-12|
|<https://naturalcurvesboards.com/html/designhtml/templates.html>|outline/asymmetry|07|2026-08-12|
|<https://naturalcurvesboards.com/html/designtopics.html>|rail CAD, rail performance|11, 18|2026-08-12|
|<https://naturalcurvesboards.com/PDF/ShapersJournal.pdf>|outline/tail, nose/CAD, outline/asymmetry, bottom CAD|02, 05, 07, 14|2026-08-12|
|<https://pyzelsurfboards.com/>|archetypes|33|2026-08-12|
|<https://rustysurfboards.com/pages/board-fundamentals>|foil|21|2026-08-12|
|<https://vecsurfboards.com/blog/2015/6/5/outline>|outline/tail, tail/measurement, outline/asymmetry|02, 03, 07|2026-08-12|
|<https://waldensurfboards.com/products/100-glider-25302>|longboard|32|2026-08-12|

## Commercial / 専門販売・媒体・補助資料

|URL|topic|docs|access|
|---|---|---|---|
|<https://abeginnersguidetoboardbuilding.wordpress.com/2017/11/28/rocker-measuring-and-shaping>|rocker measurement|15|2026-08-12|
|<https://bellsurf.com/pages/what-is-rocker-surfboard>|rocker measurement|15|2026-08-12|
|<https://blueroom.pt/en/vocabulary/surfboard>|deck/volume|22|2026-08-12|
|<https://boardcave.com/information/asymmetrical-surfboards>|asymmetry|31|2026-08-12|
|<https://boardcave.com/information/surfboard-tail-shapes>|tail|01|2026-08-12|
|<https://boardcave.com/the-surfers-corner/cat/news/post/surfboard-bottom-contours>|bottom CAD|14|2026-08-12|
|<https://boardcave.com/the-surfers-corner/cat/news/post/surfboard-shapes-tails-rails-and-noses>|tail, nose, preset audit|01, 04, 37|2026-08-12|
|<https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_Belly_Hull_bottom_surfboard_shape_convex_for_speed.png>|images|36|2026-08-12|
|<https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_Bottom_Contours_-_Spiral_Vee_surf_board_bottom_shape.png>|images|36|2026-08-12|
|<https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_Concave_in_Vee_Tail_bottom_shape_contour.png>|bottom, images|12, 36|2026-08-12|
|<https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_Convex_Belly_surf_board_bottom_shape.png>|images|36|2026-08-12|
|<https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_How_concave_bottom_contours_affect_surfing_and_water_flow.png>|images|36|2026-08-12|
|<https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_How_to_shape_single_to_double_concave_in_surfboard_foam_bottom.png>|images|36|2026-08-12|
|<https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_Longboard_50-50_Rail_Shape_Design_for_Noserider.png>|nose/rail safety, rail/flow, images|06, 09, 36|2026-08-12|
|<https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_Panel_Vee_shape_in_surfboard_bottom_helps_turn_board.png>|bottom, images|12, 36|2026-08-12|
|<https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_Rolled_Vee_belly_bottom_surf_bord_contour.png>|images|36|2026-08-12|
|<https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_Surfboard_Rail_Tuck_Shape_water_flow_drag_and_release.png>|images|36|2026-08-12|
|<https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_Surfboard_Rail_Tuck_Suction_Control_and_water_release.png>|images|36|2026-08-12|
|<https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard_Design_-_Surfboard_Tail_Width_480x480.png?v=1650567203>|tail/measurement, images|03, 36|2026-08-12|
|<https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard-Design-Hydrodynamics-water-flow-around-surfboard-rail-shape.png>|rail/flow, images|09, 36|2026-08-12|
|<https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard-Tail-Shape-Design-diamond-moon-bat-swallow-tail_grande_c6388e08-6598-4dc7-a8eb-ca3397833631_480x480.png?v=1581368457>|tail/measurement, images|03, 36|2026-08-12|
|<https://cdn.shopify.com/s/files/1/0689/1441/files/Surfboard-Tail-Shape-Design-pin-round-rounded-pin-tail_grande_82088aaf-fe7b-4b59-afff-7980119eecac_480x480.png?v=1581368457>|tail/measurement, images|03, 36|2026-08-12|
|<https://degree33surfboards.com/blogs/guest-blogger-series/surfboard-tail-shapes-basics-what-are-they-and-how-do-they-work>|tail|01|2026-08-12|
|<https://eclectic-workshop.weebly.com/how-to-build-a-surfboard.html>|rail bands|10|2026-08-12|
|<https://essentialsurfing.com/rail>|rail performance|18|2026-08-12|
|<https://foamez.com/pdfs/US%20Blanks%20Product%20Catalog%20.pdf>|measurement|26|2026-08-12|
|<https://foamez.com/wp-content/uploads/2017/07/CF-Blank-Catalog-1.pdf>|rocker measurement|15|2026-08-12|
|<https://foammagazine.com/surfboard-rails>|rail taxonomy, rail performance|08, 18|2026-08-12|
|<https://forum.swaylocks.com/t/looking-for-drawing-of-7s-surfboards-step-deck-rail-design/50015>|deck/volume|22|2026-08-12|
|<https://gbox-surf.com/resources/pdf-files/gb-hfins-fin-setup-primer-2022-r9-web.pdf>|fins|23|2026-08-12|
|<https://greenlightsurfsupply.com/blogs/news/how-to-measure-surfboard-placement-and-fin-toe-in-angle>|fin hydrodynamics, measurement|24, 26|2026-08-12|
|<https://greenlightsurfsupply.com/blogs/news/how-water-flows-around-a-surfboards-rail>|edge/flow|19|2026-08-12|
|<https://greenlightsurfsupply.com/blogs/news/new-rail-band-dimension-chart-with-domed-deck>|rail bands|10|2026-08-12|
|<https://greenlightsurfsupply.com/pages/greenlight-surfboard-building-guide-how-to-glass-surf-board>|materials|27|2026-08-12|
|<https://greenlightsurfsupply.com/pages/how-do-i-figure-out-where-to-put-the-fins-on-my-board>|fins|23|2026-08-12|
|<https://greenlightsurfsupply.com/pages/surfboard-bottom-contour-design-greenlight-surfboard-design-guide>|bottom, bottom/flow, bottom CAD, longboard, terminology, images|12, 13, 14, 32, 35, 36|2026-08-12|
|<https://greenlightsurfsupply.com/pages/surfboard-building-guide-how-to-shape-surf-board>|bottom/flow, rocker measurement, rocker/CAD, foil, deck/volume, fins, measurement, materials, CNC|13, 15, 17, 21, 22, 23, 26, 27, 30|2026-08-12|
|<https://greenlightsurfsupply.com/pages/surfboard-design-guide>|archetypes|33|2026-08-12|
|<https://greenlightsurfsupply.com/pages/surfboard-fin-design-greenlight-surfboard-design-guide>|fins, fin hydrodynamics|23, 24|2026-08-12|
|<https://greenlightsurfsupply.com/pages/surfboard-outline-design-greenlight-surfboard-design-guide>|nose, nose/CAD, outline/asymmetry, measurement, preset audit|04, 05, 07, 26, 37|2026-08-12|
|<https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide>|nose/rail safety, rail taxonomy, rail/flow, rail bands, rail CAD, rail performance, edge/flow, edge CAD/CNC, longboard, terminology, images|06, 08, 09, 10, 11, 18, 19, 20, 32, 35, 36|2026-08-12|
|<https://greenlightsurfsupply.com/pages/surfboard-rocker-and-foil-design-greenlight-surfboard-design-guide>|rocker measurement, rocker performance, rocker/CAD, foil, measurement, images|15, 16, 17, 21, 26, 36|2026-08-12|
|<https://greenlightsurfsupply.com/pages/surfboard-tail-design-greenlight-surfboard-design-guide>|tail, outline/tail, tail/measurement, terminology, images, preset audit|01, 02, 03, 35, 36, 37|2026-08-12|
|<https://greenlightsurfsupply.com/products/rail-runner-surfboard-shaping-tool-pvc-plastic>|edge CAD/CNC|20|2026-08-12|
|<https://hangtimesurf.com/blog/first-rail-band>|rail bands|10|2026-08-12|
|<https://hubs.com/knowledge-base/sharp-corners-in-cnc-machining>|edge CAD/CNC|20|2026-08-12|
|<https://imgcdn.surfing-waves.com/board/tail_shape.htm>|tail, preset audit|01, 37|2026-08-12|
|<https://instructables.com/How-to-Make-a-Surfboard>|rail bands|10|2026-08-12|
|<https://mingei.cdn.rygn.io/files/Surf-Craft-Curriculum-Guide.pdf?v=1599856954>|asymmetry|31|2026-08-12|
|<https://mpainesyd.com/filechute/paine_surf_thesis1974.pdf>|tail/measurement, rail/flow|03, 09|2026-08-12|
|<https://nspsurfboards.com/product/surf/fish-protech>|archetypes|33|2026-08-12|
|<https://openshaper.com/surfboard-design-guide>|outline/tail, tail/measurement, nose/rail safety, outline/asymmetry, rail taxonomy, rail/flow, bottom CAD, rocker performance, rail performance, edge/flow, foil, deck/volume, archetypes, images|02, 03, 06, 07, 08, 09, 14, 16, 18, 19, 21, 22, 33, 36|2026-08-12|
|<https://paperzz.com/doc/8564690/the-boardcad-book>|file formats|29|2026-08-12|
|<https://raulprietofernandez.net/media/k2/attachments/boardcad-guia-de-uso.pdf>|file formats|29|2026-08-12|
|<https://sanded.com.au/pages/surfboard-shaping-design>|deck/volume|22|2026-08-12|
|<https://shop.surfit.com/blogs/how-to-progress-your-surfing/how-to-choose-a-surfboard-your-tail>|outline/tail, tail/measurement|02, 03|2026-08-12|
|<https://shop.surfit.com/cdn/shop/files/How-To-Choose-A-Surfboard-Nose-Nose-Comparison.jpg>|nose/rail safety|06|2026-08-12|
|<https://shop.surfit.com/pages/how-to-choose-a-surfboard-the>|rail performance, deck/volume|18, 22|2026-08-12|
|<https://shop.surfit.com/pages/how-to-choose-a-surfboard-the-nose>|nose/rail safety, images|06, 36|2026-08-12|
|<https://srfer.com/shaping-surfboard-rails>|rail bands|10|2026-08-12|
|<https://staging.volcom.es/blogs/truetothis/ryan-burch-surfboards-asymmetricals-fishes-longboards-mid-lengths-gliders>|asymmetry|31|2026-08-12|
|<https://sticks.surf/guide/anatomy/nose>|nose, nose/CAD|04, 05|2026-08-12|
|<https://surf-360.com/resources/surfboard-shaper-glossary>|terminology|35|2026-08-12|
|<https://surfaids.com.au/Custom.pdf>|measurement|26|2026-08-12|
|<https://surfd.com/guides/guide-asymmetric-surfboards-interview-tim-stafford>|asymmetry|31|2026-08-12|
|<https://surfer.com/gear/surfboard-review-the-bonzer-egg>|longboard|32|2026-08-12|
|<https://surfer.com/how-to/surfboard-volume>|deck/volume|22|2026-08-12|
|<https://surfertoday.com/surfing/how-does-surfboard-rocker-affect-wave-riding>|rocker performance|16|2026-08-12|
|<https://surfertoday.com/surfing/how-to-decipher-the-dimensions-written-on-a-surfboard>|measurement|26|2026-08-12|
|<https://surfertoday.com/surfing/surfboard-nose-shapes>|nose, nose/CAD|04, 05|2026-08-12|
|<https://surfertoday.com/surfing/the-complete-guide-to-surfboard-bottom-contour-designs>|bottom, bottom/flow|12, 13|2026-08-12|
|<https://surfertoday.com/surfing/the-different-types-of-surfboard-rails>|rail taxonomy, rail performance|08, 18|2026-08-12|
|<https://surfertoday.com/surfing/the-glossary-of-surfboard-shaping-terms>|terminology|35|2026-08-12|
|<https://surfertoday.com/surfing/what-is-an-asymmetrical-surfboard>|outline/asymmetry|07|2026-08-12|
|<https://surfhydrodynamics.com/en/images/tails_surf.png>|tail/measurement, images|03, 36|2026-08-12|
|<https://surfhydrodynamics.com/en/Outline_surf.html>|outline/tail, nose/CAD, outline/asymmetry|02, 05, 07|2026-08-12|
|<https://surfhydrodynamics.com/en/rail_couche_limite.html>|rail/flow, edge/flow|09, 19|2026-08-12|
|<https://surfhydrodynamics.com/en/Tail_shape_surf.html>|tail/measurement, images|03, 36|2026-08-12|
|<https://surfinghandbook.com/surfboard-tail-shapes>|tail|01|2026-08-12|
|<https://surfline.com/gear/glossary/glossary_definitions.cfm?id=60424>|rail taxonomy, rail performance|08, 18|2026-08-12|
|<https://surfline.com/surf-news/history-functionality-tails/87592>|tail|01|2026-08-12|
|<https://surfline.com/surf-news/longboards/90533>|rail taxonomy|08|2026-08-12|
|<https://surfline.com/surf-news/shaper-s-bay-jon-pyzel-anatomy-of-a-surfboard/97792>|archetypes|33|2026-08-12|
|<https://surfology.blog/surfboard-nose-shapes>|nose|04|2026-08-12|
|<https://surfscience.com/topics/surfboard-anatomy/bottom-contour/bottom-contour>|bottom|12|2026-08-12|
|<https://surfscience.com/topics/surfboard-anatomy/nose/the-nose-knows>|nose/CAD, nose/rail safety, images|05, 06, 36|2026-08-12|
|<https://surfscience.com/topics/surfboard-anatomy/rail/ignore-the-rail-at-own-risk>|rail/flow|09|2026-08-12|
|<https://surfscience.com/topics/surfboard-anatomy/tail/asymmetrical-surfboard-designs>|asymmetry|31|2026-08-12|
|<https://surfscience.com/topics/surfboard-anatomy/tail/basic-tail-shapes>|tail, outline/tail, tail/measurement|01, 02, 03|2026-08-12|
|<https://surfscience.com/topics/surfboard-design>|tail/measurement|03|2026-08-12|
|<https://surfscience.com/topics/surfboard-design-and-anatomy/deck/all-hands-on-deck>|deck/volume|22|2026-08-12|
|<https://surfsimply.com/magazine/the-history-of-surfboard-design-asymmetric-surfboards>|outline/asymmetry, asymmetry|07, 31|2026-08-12|
|<https://xometry.com/resources/3d-printing/stl-file-format>|file formats|29|2026-08-12|

## 引用優先順位

1. 幾何/CAD仕様: officialまたはprimary。
2. surfboard固有の形状定義: shaper一次資料を複数照合。
3. 流体・材料・傷害: academicの原著landing page/DOI。
4. commercialは図解・用語使用例の補助とし、性能因果の唯一の根拠にしない。
5. 画像を使う場合、記事URLだけでなくasset URL、権利者、license/転載可否、取得日を別manifestへ保存する。

## 品質上の注意

- 「primary」は真偽や査読済みを意味しない。製品挙動についての一次資料という意味。
- シェイパー資料は実務上重要だが名称は非標準。複数sourceと定量geometryで固定する。
- 2025/2026年の論文は新しく、訂正・版更新の確認が必要。
- 今回は既存文書からのbibliographic inventoryであり、全195 URLへの再アクセス成功を保証するlink-checkではない。

