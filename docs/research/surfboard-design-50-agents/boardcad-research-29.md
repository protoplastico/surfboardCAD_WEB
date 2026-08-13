# サーフボードCADとファイル形式・round-trip設計

調査日: 2026-08-12  
担当: research-29（BoardCAD/Shape3D/AKU/STEP/IGES/DXF/STL）

## 結論

サーフボードCADのファイルは次の3階層に分ける必要がある。

1. **native/editable design**: Bezier CP、断面station、apex/tuck、feature、プリセットの解決値、拘束、単位を保持
2. **neutral exact geometry**: STEP/IGES等のB-rep/NURBS交換。曲面は保ち得るがsurfboard固有の設計意味・履歴は通常失う
3. **derived manufacturing/visualization**: DXF断面/outline、STL/OBJ mesh、PDF、G-code。原則round-trip編集の正本にしない

推奨は、独自versioned JSON/native documentを正本とし、STEP/IGES/DXF/STLを派生artifactにすること。各exportにはsidecar manifestでunits、axis、datum、tolerance、source revision、feature names、checksumを添付する。インポート後に再exportしても、元の少数Bezier CPやsemantic stationを自動的に復元できるとは考えない。

## 1. 形式の現状

### BoardCAD

BoardCADはopen-source surfboard CAD/CAMである。[BoardCAD LE公式プロジェクト](https://havardnj.github.io/boardcad-le/) BoardCAD bookによると、version 2.0はSTEP-based `.stp`を主形式とし、2D Bezier curvesとfinal 3D modelを1ファイルへ保存する。version 2.0以前は2D modelが`.brd`、3D modelが`.cad`で、後方互換として残った。[BoardCAD Book](https://paperzz.com/doc/8564690/the-boardcad-book) / [BoardCAD user guide PDF](https://www.raulprietofernandez.net/media/k2/attachments/boardcad-guia-de-uso.pdf)

重要:

- `.brd`拡張子はPCBのEAGLE/Allegro/KiCad等にも使われる。拡張子だけでBoardCAD/Aku surfboard fileと判定しない
- file signature/header/content probeとimporter選択が必要
- BoardCAD legacy `.brd`、Aku `.brd`が完全に同一schema/feature setとは仮定しない
- `.cad`も一般的で衝突しやすい拡張子

### Shape3D

Shape3D公式は `.s3dx`, `.s3d`, `.brd`, `.brdx`, `.kms`, `.pbd`をopenできる。3D exportはSTL/IGES/DXF、製品説明ではOBJも記載され、2D outline/profile/slicesをpolyline/BezierとしてTXT/DXF/IGES/OBJ/PDF、3DはmeshまたはIGES spline surfaceとしてexport可能。[Shape3D Features](https://www.shape3d.org/Products/Features.aspx) / [Shape3D X](https://shape3d.com/Products/Shape3dX.aspx)

`.s3dx`をnative正本とすべき。公式manualはolder `.s3d V8`へ保存すると3D layersやmulti-edited curvesが削除されると明記する。[Shape3D X Manual PDF](https://shape3d.com/Manuals/User_Manual_V9.pdf)

### AKU Shaper

AKU公式はnative formatsに加え `.s3d`, `.s3dx`, `.srf`, `.brd`をopenでき、`.brd`から`.s3dx`へ直接exportする機能を案内する。製造交換としてBRD, DXF, IGES, STL, OBJをexportし、保護formatとしてBRXを挙げる。[AKU FAQ](https://akushaper.com/faq) / [AKU Software](https://akushaper.com/software)

AKUが「conversion issuesを防ぐ」と案内していても、全vendor固有featureの双方向同値を保証する一般仕様とは読まない。import/export後の数値・surface比較が必要。

## 2. format別の保持能力

| Format | 主用途 | 保持しやすい | 失いやすい/注意 |
|---|---|---|---|
| native `.s3dx` | Shape3D編集 | slice/curves/layers/multi-curves/metadata | 他CAD依存、version downgrade損失 |
| native AKU `.brd/.brx` | AKU編集/生産 | AKU固有curve/station/設定 | schema非公開/版差、他の`.brd`と衝突 |
| BoardCAD `.stp` | BoardCAD編集/交換 | book上2D Bezier+3D model | 一般STEP importerがBoardCAD編集意味を理解するとは限らない |
| legacy BoardCAD `.brd/.cad` | 後方互換 | 旧2D/3D | feature/新規metadata、拡張子衝突 |
| STEP `.stp/.step` | neutral solid/B-rep | precise curves/surfaces、topology、units、一部metadata | design history、semantic CP/stations、surfboard feature stack |
| IGES `.igs/.iges` | spline/curve/surface交換 | NURBS/Bezier surfaces、curves | solid sewing、topology/semantics、translator tolerance |
| DXF `.dxf` | 2D outline/profile/slices、場合により3D entities | curves/polyline/layers、`$INSUNITS` | loft topology、3D feature semantics、consumer subset差 |
| STL `.stl` | mesh/CAM/print | triangulated exterior geometry | units、curves/surfaces、features、materials、topology semantics |
| OBJ `.obj` | mesh exchange/render | mesh、normals、groups、UV/material reference | units標準、CAD/NURBS semantics、watertight保証 |
| PDF/SVG | drawing/template | 2D見た目・寸法 | 3D、編集意味、実寸印刷scale設定 |
| G-code | specific machine | tool motion/feed | design geometry、他machine portability |

Shape3D自身がIGESを`spline surfaces`、STL/DXF/OBJ等をmeshとして区別している。mesh exportをnative splineへ戻すと近似再構築になる。[Shape3D X 3D Export](https://shape3d.com/Products/Shape3dX.aspx)

## 3. STEP

STEPはISO 10303のproduct-model data交換規格で、CAD geometryだけでなくmetadataも表現可能。[Autodesk STEP Translator](https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-Core/files/GUID-3AAB133D-8A9F-43E3-89AD-D88DAE6982C0.htm) / [Autodesk STEP reference](https://help.autodesk.com/cloudhelp/2022/ENU/Alias-ImportExportData/files/File-format-reference/GUID-A6F13C9D-9A69-4B72-A25C-55A144B8535F.html)

### 利点

- B-rep、trimmed NURBS、analytic geometry
- units/contextを持てる
- assembly/name/color等をprofileにより保持可能
- CAM/general CADへの有力交換形式

### 限界

- AP/schemaとtranslator実装により保持範囲が違う
- native surfboard semantics（apex CP、tuck path、single/double feature、preset constraints）は標準entityへ自然に対応しない
- trimmed surfaceのparameterization/CV構造がimport時に再構成され得る
- BoardCADがSTEP container内へ独自に2D/3Dを持っていても、一般CAD round-tripでその編集構造が残るとは限らない

### 推奨

- AP/schema/versionをmanifestへ記録
- mmでexportしunit contextを検証
- face/curve namesに`deck`, `bottom`, `rail`, `apex-guide`等を付けるが、consumerで消える前提
- native JSONをSTEPと同梱し、STEPだけを正本にしない

## 4. IGES

IGESはNIST由来のneutral graphics exchangeで、rational B-spline curve/surface、bicubic patches等を表現できる。[NIST IGES v2](https://www.nist.gov/publications/initial-graphics-exchange-specification-iges-version-20) / [NIST IGES v4 PDF](https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nbsir88-3813.pdf)

### 利点

- surfboardのfreeform spline surface交換に広く対応
- curve/section/guideを別entityとして渡せる
- Shape3Dがspline surface exportを公式対応

### 限界

- surface集合がsewn solidにならない、gap/tolerance問題
- entity color/layer/nameは保持されてもfeature意味ではない
- units/global sectionはあるがimporter設定を検証
- trim curvesとunderlying surfaceの差、parameter tolerance
- round-tripでdegree/knot/CVがrefitされる可能性

推奨: geometry exchange用。native curve networkとsemantic metadataはsidecarに残す。import後にsewing gap、normal、surface count、area/volumeを検査。

## 5. DXF

DXFは2D template/outline/profile/slices交換に適する。Shape3Dは2DをpolylineとBezier curveでDXF等へexport可能とする。

### units

DXF HEADERの`$INSUNITS`は0=unitless、1=inches、4=millimeters等を指定する。[Autodesk DXF Header](https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm) ただしこれはdefault drawing/insertion unitsであり、全consumerが同様に尊重するとは限らない。

### 推奨layer

```text
OUTLINE_LEFT / OUTLINE_RIGHT
STRINGER_BOTTOM / STRINGER_DECK
SLICE_xxxxMM
APEX_GUIDE / TUCK_GUIDE
FIN_PLUGS / CHANNELS
DATUM / DIMENSIONS / NOTES
```

### 損失

- polyline exportではBezier/NURBSの解析curveをtessellate
- spline entityを読めないCAMがpolylineへ変換
- 3D surfaceとしてのsection correspondenceなし
- layer名はsemanticsのヒントだが拘束/feature graphではない

manifestにunits、axis、polyline chord tolerance、closed/open、station xを記録する。

## 6. STL/OBJ

STLはtriangle facetのnormalと3 verticesを持つ単純mesh形式。[Library of Congress STL description](https://wwws.loc.gov/preservation/digital/formats/fdd/fdd000505.shtml) STLはunitを定義せず、materials/CAD feature historyも持たない。[Xometry STL overview](https://www.xometry.com/resources/3d-printing/stl-file-format/) 

### STL export必須項目

- assumed units (`mm`)をfilename/sidecar/READMEへ明記
- chord/angle/max-edge tessellation tolerance
- watertight/manifold、normal orientation
- deck/bottom/rail境界のsharp normal handling
- source bounding boxとvolume
- binary/ASCII

### round-trip

STL→CADはreverse engineering。元Bezier CP、NURBS knots、stations、feature names、hard-edge intentは復元不能。mesh fitting後に似たsurfaceを作れるだけで、native round-tripではない。

OBJはgroup/normals/UV/material referenceを持てるが、unitsとCAD semanticsは依然標準化されない。render/mesh exchangeに使い、design archiveにはしない。

## 7. native JSONに保存すべき内容

```json
{
  "schema":"boardcad-design",
  "schemaVersion":"1.0.0",
  "units":"mm",
  "axis":{"longitudinal":"+X tail_to_nose","right":"+Y","up":"+Z"},
  "datum":{"tail":[0,0,0],"centerline":"Y=0"},
  "tolerance":{"model":0.01,"exportChord":0.1},
  "curves":[],
  "stations":[],
  "features":[],
  "surfaces":[],
  "manufacturing":{},
  "provenance":{},
  "derivedExports":[]
}
```

### curves

- semantic ID (`outline.right`, `rail.apex.right`, `bottom.stringer`)
- type/degree/knots/weights/CP
- parameter domain、orientation
- G0/G1/G2 joins、feature exceptions
- original/imported vs derived

### stations

- x、coordinate frame、key/derived role
- section topology version
- semantic point correspondence
- Bezier/NURBS data
- rail/deck/bottom parameters

### features

- nose/tail termination
- rail apex/tuck/release edge
- bottom single/double/vee/channel/chine
- deck step/gutter/concave
- fins/plugs/inserts
- envelopes/fade/composition order

### metadata

- units、axis、origin/datum、symmetry/stance
- author/model/revision/date/license
- source application/version
- import transform
- board dimensions/volume checksum
- export settings/tolerances
- SHA-256等source/derived checksum

## 8. 単位・座標

### 内部

- canonical unitをmmのdouble precision
- UIのみinch/fraction表示
- 変換はload boundaryで一度だけ
- dimension valueとunit tagを常に組にする

BoardCAD bookは3D modelが常にmmで動く例を記載する。Shape3D/AKUはmetric/imperial表示を持つが、export先前提を別途検証する。

### 軸

必ず保存:

- tail→noseが+Xか
- right/leftの+Y
- up/downの+Z
- top/bottom orientation
- datumはtail tip、tail block plane、bounding boxのどれか
- straight-line lengthかdeveloped stringer lengthか

import previewでaxis triad、tail/nose label、bounding boxを表示し、反転/scaleをユーザー確認できるようにする。

### scaling sanity check

- lengthが想定範囲（例0.5–5 m）
- mm↔inch候補比25.4、m↔mm比1000を検出
- source dimensionsとbbox比較
- volume scaleはlength scaleの3乗で照合
- DXF `$INSUNITS`が0なら自動決定せず確認/manifest参照
- STLは必ずunit指定を要求

## 9. round-trip損失マトリクス

| 経路 | 主な損失 | 対策 |
|---|---|---|
| s3dx→s3d V8 | 3D layers、multi-edited curves（公式警告） | native s3dx保持、downgrade diff |
| native→STEP | semantic stations/features/constraints | JSON sidecar、named entities、geometry diff |
| native→IGES | feature/history、solid sewing | guide curves+names、gap/volume検査 |
| native→DXF polyline | exact Bezier/NURBS、3D relation | spline option、chord tolerance記録 |
| native→STL | units、analytic geometry、metadata全部 | mm manifest、native同梱、mesh QA |
| STL→native | CP/knots/stations/features | reverse-engineeringとして別import mode |
| BRD↔S3DX | unsupported vendor-specific semantics | official converter利用、numeric/visual diff |
| STEP→STEP | surface parameterization/name/topology変化 | canonical geometry comparison、native正本 |

## 10. import/export検証

### geometry canonical tests

- bbox/length/max width/thickness
- volume/surface area
- nose/tail 12 in widths、rocker heights
- station sectionsのHausdorff/RMS distance
- sampled surface position/normal error
- edge/feature path deviation
- watertight/manifold/orientation
- face/curve counts（参考。translatorで変わり得る）

### semantic tests

- curve IDs、station IDs、feature types/count
- apex/tuck/channel correspondence
- units/axis/datum
- sharp edge tags
- symmetry/stance
- fin/plug positions

### golden round-trip

各formatに代表board（round pin、deep swallow、channels、step deck、asym）を用意し:

```text
native A → export F → import B → compare(A,B) → export F2
```

幾何tolとsemantic retentionを別scoreにする。「openできた」を成功条件にしない。

## 11. 誤実装しやすい点

1. `.brd`拡張子だけでsurfboard/PCB/vendorを判定
2. native formatとneutral CAD/meshを同等に扱う
3. STEPならparametric feature historyが必ず残ると考える
4. IGES surface群をwatertight solidと仮定
5. DXF `$INSUNITS`を常に全consumerが守ると仮定
6. STLにmmが記録されると考える
7. mesh importから元の少数Bezier CPを自動復元できるとする
8. vendor変換で3D layers/channels/asymmetry/metadataの比較をしない
9. display unitsとstorage unitsを混ぜ、二重変換
10. straight line/over-curve length、tail/nose datumを保存しない
11. tessellation toleranceを記録しない
12. export artifactを編集しnativeへ上書きしてprovenanceを失う

## 12. 推奨パッケージ

```text
board-name.boardpkg.zip
  design.json
  geometry.step
  preview.glb or preview.obj
  manufacturing/
    outline.dxf
    sections.dxf
    board-mm.stl
  manifest.json
  preview.png
  sources/
    original.s3dx or original.brd
```

`manifest.json`:

- schema/version
- units/axis/datum
- application/version
- each file role/MIME/checksum
- export tolerance
- source revision
- known losses/warnings
- license/author/date

ZIP container自体を新拡張子にするならmagic/MIME/schemaを定義し、JSON migrationを用意する。

## 13. 公式出典

1. [BoardCAD LE official project](https://havardnj.github.io/boardcad-le/) — open-source surfboard CAD/CAMとGitHub。
2. [BoardCAD Book](https://paperzz.com/doc/8564690/the-boardcad-book) / [PDF](https://www.raulprietofernandez.net/media/k2/attachments/boardcad-guia-de-uso.pdf) — v2 STEP、legacy `.brd/.cad`、mm座標、export説明。
3. [Shape3D Features](https://www.shape3d.org/Products/Features.aspx) — supported native/import formats、2D/3D exports。
4. [Shape3D X 3D Export](https://shape3d.com/Products/Shape3dX.aspx) — mesh vs IGES spline surface、curve export、対応CAM。
5. [Shape3D X Manual PDF](https://shape3d.com/Manuals/User_Manual_V9.pdf) — `.s3dx/.s3d`、V8 downgradeでlayers/multi-curves削除等。
6. [AKU FAQ](https://akushaper.com/faq) — `.s3d/.s3dx/.srf/.brd` import、BRD→S3DX converter。
7. [AKU Software](https://akushaper.com/software) — BRD/DXF/IGES/STL/OBJ export、BRX。
8. [Autodesk STEP translator](https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-Core/files/GUID-3AAB133D-8A9F-43E3-89AD-D88DAE6982C0.htm) — STEPがCAD geometry/metadataを扱うISO product-data exchangeである説明。
9. [NIST IGES](https://www.nist.gov/publications/initial-graphics-exchange-specification-iges-version-20) — IGES公式仕様資料。
10. [Autodesk DXF Reference](https://help.autodesk.com/cloudhelp/2017/ENU/AutoCAD-DXF/files/index.htm) / [HEADER `$INSUNITS`](https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm) — DXF entity/header/unit仕様。
11. [Library of Congress STL binary](https://wwws.loc.gov/preservation/digital/formats/fdd/fdd000505.shtml) — facet構造と保存形式。

## 実装優先順位

1. versioned native JSON + mm/axis/datum + full semantic curves/stations/features
2. STEP/IGES/DXF/STL exporterとsidecar manifest/checksum
3. `.brd` content sniffing、vendor-aware import、source preservation
4. import geometry/semantic diff、scale/axis sanity checks
5. golden round-trip corpusとloss report
6. board package、schema migration、digital signing/provenance

## 出典評価

対応formatやversion lossはBoardCAD、Shape3D、AKUの公式資料を優先した。STEP/DXF/IGES/STLの性質はAutodesk/NIST/Library of Congress等の標準・公式資料を使用した。`.brd`は同一拡張子の衝突が非常に多いため、一般的な拡張子データベースではなくapplication content/versionの検出を設計要件とした。

