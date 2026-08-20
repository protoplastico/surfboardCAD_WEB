# tail-classification / nose-classification 資料監査

調査日: 2026-08-12  
対象: `BoardCAD-Web-Linux/tail-classification/`, `nose-classification/`  
照合: 調査01（tail taxonomy）、04（nose taxonomy）、35（用語差）、37（現行preset実装）  
コード変更: なし

## 1. 結論

これらは「専門的な形状分類画像集」ではなく、出所不明のBRDファイル333件から末端outlineを抽出した**人手ラベリング作業用contact sheet**である。tailは196/333件だけラベル済み、noseは0/333件で未分類。学習・preset検証の正解データとしては現状使用できない。

重大な問題は次の通り。

1. tailには**完全に同一のpoint列が重複**し、異なるラベルが付いた例が多数ある。exact duplicateは85群226行、うち非空ラベル同士が矛盾するものは24群71行。
2. noseはラベル欄が全件空で、形状定義・summary・normalized labelファイルもない。
3. `round/squash/rounded square`や`pin/round pin`を分ける定量基準が記録されず、画像の主観判定だけ。
4. `gun`・`fish`というboard archetypeと、`wing`というrail modifierがtail topologyと同じlabel列に混在。
5. 元BRDの取得URL、作者、ライセンス、同意、取得日がなく、`/Users/.../Desktop/boarddata`という消失したローカルpathしかない。provenanceとして不十分。

## 2. ファイル構成と完成度

### Tail

- `tail-index.json/csv`: 333件、points/寸法/元ローカルpath。
- `tail-index-labeled.json/csv`: 333件中196件にuser-supplied label。
- `tail-sheet-01..12.jpg`: 30件前後ずつのcontact sheet。画像内に「Labels are user-supplied classifications」と明記。
- `tail-label-summary.md`: raw typoを簡易正規化した件数表。
- `index.html`: contact sheetと全行table。

### Nose

- `nose-index.json/csv`: 333件。全label空。
- `nose-sheet-01..12.jpg`: nose先端を左、tail側を右に描いたcontact sheet。
- `index.html`: 「IDとノーズ種別を返してください」という未完了の分類依頼文。
- labeled JSON/CSV、label summary、taxonomy定義は存在しない。

したがってnose資料は分類資料ではなく**未ラベルの候補画像一覧**である。

## 3. Tailラベル監査

### 3.1 raw labelの品質

196件のraw labelに25表記があり、以下の明白なtypoを含む。

- `round pn` → round pin
- `roud` → round
- `diamonod` → diamond
- `swuare`, `spuare` → square
- `roud square`, `round suqare`, `roumd square` → rounded square
- `round diamonod` → rounded diamond
- `round squareesquash` → rounded square / squash（ただし自動統合不可）

summaryのnormalized labelはtypo修正に留まり、各rowへcanonical ID、修正履歴、confidenceを戻していない。raw labelのままJSONを利用すると別classになる。

### 3.2 完全重複なのにラベルが矛盾

同一points列の代表例:

|ID pair/group|同一輪郭についたlabel|
|---|---|
|003 / 078|round pin / round|
|009 / 082|round / round square|
|011 / 084|swallow / square|
|012 / 085|square / squash|
|013 / 086|round square / squash|
|015 / 088|round square / squash|
|017 / 090|wing swallow / squash|
|018 / 091|swallow / wing swallow|
|020 / 093|round pin / round|
|021 / 094|pin / wing pin|
|023 / 096|round pin（typo）/ pin|
|024 / 097|square / squash|
|025 / 098|squash / round|
|034 / 117|round / round pin|
|044 / 051|pin / round pin|

これは境界語の揺れだけでは説明できない。011/084のswallow/square、021/094のpin/wing pinなどトポロジー自体が異なるため、少なくとも一方は誤ラベルである。重複排除前のrandom splitを行えば同一形状がtrain/testへ漏れ、誤った精度を示す。

### 3.3 topologyとmodifier/archetypeの混在

- `wing pin`, `wing swallow`, `wing bat`: wingはtail末端shapeでなくrail modifier。`baseTail + wings[]`へ分解すべき。
- `fish`: 幾何はdeep/wide swallow preset。fish board categoryとは別fieldにする。
- `gun`: board archetype。末端幾何はpin/round pin等で記録する。
- `round square / squash`: 曖昧語を一classにせず、pod curvature/corner radiusを計測して確定する。

### 3.4 画像から判定できない／不足する量

contact sheetは全ボードで表示範囲の実寸・比率が異なり、共通の12-inch stationやscale barがない。shape名の境界に必要な次の値がdataset fieldにない。

- pod width / corner radius / pod bulge
- pull-in start、tail width @ 12 in
- sharp tip radius（pin対round pin）
- notch depth、tip spacing（swallow対fish）
- wing position/inset、base tail topology
- labeler、日時、confidence、根拠、reviewer consensus

`metrics.firstFiniteWidth`, `tailYAtX0`, `verticalTail`だけではtaxonomyを確定できない。

## 4. Nose資料監査

### 4.1 label・定義が存在しない

333件すべてlabel空。画像はpointからfull roundまで連続変形をよく示すが、分類境界や測定値がない。現状から`gun / pin / round-point / wide / round / diamond / snub / square`を学習したり、各presetを検証したりすることはできない。

### 4.2 推奨する分類軸

専門taxonomyとの整合には、単一labelより次を保存する。

- `topology`: point / round / cut_off / diamond / fork / asymmetric
- `noseWidth6/12/18/24`, `noseArea24`
- `tipRadius`, `tipBlockWidth`, `cornerRadius`
- `fullness`, `pullInStart`, `widePointOffset`
- `preset/archetype`: performance_point, gun_point, full_round等（topologyと分離）

contact sheetは共通の304.8 mm station線、tip付近拡大、scale barを付け直す必要がある。

## 5. 画像provenance監査

### 現在記録されるもの

- JSON: `generatedAt`, `sourceRoot=/Users/protoplastico/Desktop/boarddata`, 各rowの絶対`file` path、相対path、folder/name。
- sheet: BRD由来である旨、表示方向、user-supplied labelである旨。

### 欠落

- 元BRD配布ページ/URL、取得日、配布者・author/shaper、license/再利用許諾。
- folder名が実作者を表すかの確認。`Habor/Harbour`, `armond/almond`, `Chanel island/Channel islands`等のtypo・重複があり、著作者帰属には使えない。
- sheet generatorのscript名、commit hash、version、sampling algorithm、units、crop範囲、座標変換。
- labeler ID、labeling guideline/version、label日時、review状態。
- 元BRD自体はこのfolderに同梱されず、記録されたmacOS絶対pathも現環境に存在しないため再生成可能性がない。

結論: JPGはBRD点列の派生図なので通常の写真転載問題とは異なるが、元設計データの権利と取得経路が未記録。公開・学習利用前にprovenance manifestが必要。

推奨manifest fields:

```json
{
  "assetId": "...",
  "sourceUrl": "...",
  "sourceAuthor": "...",
  "license": "...",
  "acquiredAt": "...",
  "sourceSha256": "...",
  "generatorCommit": "...",
  "sampling": {"units":"cm","tailCropCm":40,"points":200},
  "label": {"topology":"...","modifiers":[],"annotator":"...","confidence":0.0,"taxonomyVersion":"..."}
}
```

## 6. 現行実装presetとの対応

### Tail

|dataset label|現行preset|評価|
|---|---|---|
|square|square|直接対応。ただし誤ラベル多数|
|squash|squash|直接対応。rounded squareとの基準なし|
|round|round|直接対応|
|round square|rounded-square|語は対応。datasetはflat podを保証しない|
|pin|pin|対応。round pinとの矛盾多数|
|round pin|round-pin|対応。ただしtip radius計測なし|
|diamond|diamond|対応。実装側の中央flat問題は調査37参照|
|round diamond|rounded-diamond|3件のみ、2件はtypo表記。検証量不足|
|swallow|swallow|2件のみ。うちexact duplicateにsquare矛盾あり|
|fish|fish|deep swallowとして対応可能|
|bat|bat|1件のみ|
|gun|gun|1件だがarchetype混同|
|wing pin/swallow/bat|wing modifier + base tail|単一tail presetへ入れない。現行Wing panelとの複合状態|

現行の`rocket`, `half-moon`, `split`, `star`にはdataset上の正例がない。`rounded-diamond`も実質3表記しかなく、visual calibration sourceとして弱い。

### Nose

全件未ラベルなのでpreset対応表を作れない。さらに実装の`wide`はmodifier、`gun`はarchetype、`square nose`は現状生成不能（調査37）であり、現行8 enumをそのままannotation schemaに採用すべきでない。

## 7. 利用可否と是正優先度

1. **P0: この資料をground truth / 自動preset学習へ使わない。** `status=draft_annotation`と明記。
2. **P0: exact points hashで重複をgroup化し、24の非空label conflictを専門review。** splitはgroup単位。
3. **P0: noseを定量軸つきtaxonomyで新規ラベル。** 現在は0/333。
4. **P1: tail labelをcanonical topology / modifier / archetypeへ分解し、raw termも別保存。**
5. **P1: 元BRDのprovenance/licenseとSHA-256を回収。回収不能assetは公開・学習対象外へ。**
6. **P1: 共通scale、12-inch station、tip radius/notch/wing寸法をsheetへ追加。**
7. **P2: 二人以上の独立annotation、confidence、adjudicationを導入。**
8. **P2: app presetを生成したcanonical reference silhouetteと並べるvisual regression setを別途作成。** 実在board例とpreset仕様例を混同しない。

## 8. 監査方法・注意

- JSONの333 point列を静的集計し、`JSON.stringify(points)`完全一致で重複判定した。
- tail-sheet-01とnose-sheet-01を原寸目視し、残りsheetの存在・サイズ・HTML indexを確認した。
- `BoardCAD-Web-Linux`と隣接する`boardcad-web`に同名資料が重複する。今回の監査対象は前者。どちらを配布元とするか一本化が必要。
- 個々の196 labelを本監査で再ラベルしたわけではない。矛盾が多いため、専門reviewなしに一方を正解と決めることは避けた。
