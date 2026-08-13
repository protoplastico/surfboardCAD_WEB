# BoardCAD Web

Linux上で動作するブラウザ版BoardCADビューアです。
元BoardCADのメニュー構成と操作感を優先して移植しています。

## 使い方

1. `./start.sh` を実行します（または `BoardCAD-Web.desktop` を使用します）。
2. ブラウザで `http://127.0.0.1:8788/` を開きます。
3. `読み込み`から`.brd`ファイルを選択します。付属サンプルは`Shortboard`または`Longboard`を選んで`サンプル`を押します。
4. 比較用のボードは File / `Open Ghost` から読み込みます。View / `Show Ghost board` で表示を切り替え、Board / `Scale ghost to current board size` で現在ボード寸法へ揃えられます。元アプリの Ghost command に合わせて、`G` を押している間は矢印キーで平行移動、`Q/W` で回転、`Alt` 併用で微調整できます。
5. `Outline`、`Profile`、`Sections`、`Toolpath`で図面とCNCパスを確認します。
6. Canvas上を右クリックすると、BoardCAD風のコンテキストメニューを開けます。Fit、X/Y locked、View blank、deck/bottom toolpath表示、Spot check、Guide point追加/編集/削除、ControlPoint追加/削除、Cross sections表示を実行できます。
7. `PDF`または`Gコード`で出力します。
8. CNC用は`CNC軸数`、`CNC面`、分割数を設定してから`CNC`で出力します。
9. `CNC Probe Scan`では、ノーズ先端をワーク原点に設定し、ジョグでテール先端まで移動した距離を`実測ボード長`へ入力します。`機械X可動範囲`は現行機なら`2000`、3000mm化後は`3000`に設定します。`機械Yセンター`には、ボードセンターラインを置く機械Y座標を指定します。900mm幅機では通常`450`です。
10. `Simulate`で生成済みプローブGコードのXY移動、Z上下、`G38.2`プローブ方向をScan画面上で再生できます。`Pause` / `Step` / `Reset`で1動作ずつ確認でき、下部のZ profileでプローブの上下動を確認できます。
11. Web Serial対応ブラウザでは`Connect`からシリアル接続し、生成したプローブGコードや4軸/5軸CNC Gコードを送信できます。
12. プローブ応答ログに`PRB:`が返ると測定点として保存されます。GコードコメントにはBRD化用のボード座標`BX/BY`と、実機移動用の機械座標`MX/MY`を併記します。`Build BRD`で測定点から初期`.brd`を生成し、通常のBoardCAD編集へ進めます。同一X位置にリブ方向の測定点がある場合は、そのbottom/deck実測点をCross Section形状へ反映します。
13. `Trace Image`でOutline/Profileそれぞれにサーフボード写真を読み込み、半透明の下絵として重ねられます。画像は表示/非表示、透明度、拡大縮小、回転、中心位置、上下左右ボタン移動を調整できます。`Fit to board`は画像幅を現在ボード長へ合わせます。
14. 右側パネルは出力設定、Trace Image、CNC Probe Scan、Cross section、ControlPoint、Boardを折りたためます。
15. Board / `Tail` では `Bezier native`、`Square`、`Squash`、`Pin`、`Round pin`、`Diamond`、`Swallow`、`Fish` を切り替えられます。Swallow / Fish は tail length と tail depth を保持し、全モードとも Outline、3D wire、PDF、DXF、レーザーGコードへ反映されます。
16. Tail には `Shoulder pos`、`Shoulder width`、`Join blend` の係数があります。これはボディラインとテール形状のつながりを調整するための値で、`.brd`拡張値として保存されます。

移植状況は`MIGRATION.md`、レビュー用の確認表は`REVIEW.md`にまとめています。

## 開発レビュー用チェック

```sh
node --check app.js
node --check test-core.js
node test-core.js
```

`test-core.js`は、3つのサンプル`.brd`の読み込み、BRD再出力、PDF/DXF/Gコード生成、プローブ測定点からの初期`.brd`生成を確認します。

部分実行もできます。

```sh
node test-core.js --list-sections
node test-core.js --section=ghost-3d-edit
node test-core.js --scenario=S10,S11
node test-core.js --section=samples --sample=Shortboard
node test-core.js --section=render-cache
node test-core.js --section=menu-wiring,toolbar-dialogs
```

`--scenario` は `OPERATION_SCENARIOS.md` のIDに対応します。
`render-cache` は 3D / Toolpath の world cache と projected cache の簡易計測値を表示します。
`menu-wiring` は `index.html` にある `data-action / data-view / data-view-option` が、実装側の接続表と一致しているかを確認します。

## 現在対応している出力

- PDF: アウトライン、ロッカー、断面図を別ページにしたベクター出力
- Gコード: レーザーカッター用アウトライン切断パス
- CNC: `.brd`断面を補間した4軸/5軸のハル/デッキ用サーフェスパス
- Probe Scan: `G38.2`を使ったハル/デッキの接触プローブ計測パス
- Sender: Web Serial経由のGコード送信、`ok` / `error` / `ALARM`応答待ち、プローブ測定ログの取得、測定CSV出力

## Probe Scanの手順

1. ノーズ先端をワーク原点 `X0` に設定します。
2. File / `Scan New Board`を選び、Scan画面へ移ります。
3. `Choose Port`でシリアルポートを許可し、`シリアルポート`欄で選択して`Connect`します。許可済みポートは`Refresh Ports`で再読み込みできます。
4. Scan画面は右側がノーズ、左側がテールです。JOG Controllerでノーズ先端へ合わせ、`Scan`メニューの`Set Nose Point`を押します。
5. ジョグでテール先端まで移動し、`Set Tail Point`を押します。現在位置Xとの差から`実測ボード長`が自動入力されます。
6. `Return to Nose`または手動ジョグで原点へ戻ります。
7. `Generate`でGコードを生成します。`Stringer + ribs`では、スパインのロッカー計測後に原点へ戻り、続けてリブ方向を計測します。
8. `Simulate`で送信前にプローブ動作を確認します。G0は移動、G38.2はプローブ接触方向として色分け表示します。Z profileには安全高さ、下降、横プローブ移動を含むZ方向の予定動作が表示されます。
9. `Send`で送信し、`Save CSV`で測定点を保存できます。保存済みCSVはFile / `Open`から読み込み直せます。

現在位置はGRBL系の`?`ステータス応答に含まれる`WPos`または`MPos`から取得し、Scan画面と`Position`欄に表示します。
測定済みのbottom/deckスパイン点列はProfile画面へ`Scan Ghost`として重ね表示されます。`Scan`メニューの`Fit Profile From Scan`を使うと、その点列からBottom/DeckのControlPoint列を生成して現在ボードへ反映します。
測定済みの`outline-right`点列はOutline画面へ`Scan Ghost`として左右対称に重ね表示されます。`Fit Outline From Scan`で片側Y接触位置から半幅を復元し、OutlineのControlPoint列へ反映します。ログに`outline-left`が含まれる場合も読み込みは可能です。
`Outline side probe`は、4軸目を90度回転させた横向きプローブを想定し、外側の待機位置からサーフボード側へ向かって`G38.2 Y...`で片側だけ接触計測します。`Half cross-section`はデッキ側ストリンガーからレールを回り、ボトム側ストリンガーへ戻る逆U字の半周点列として生成します。各点には断面の外向き法線から求めたA軸角度を付け、表面近くの短い法線退避位置から`G38.2 Y... Z...`で表面側へ直線プローブします。シミュレーション時はY-Zインセットで確認できます。測定済み`cross-half`点列はCross sections画面へ`Scan Ghost`として重ね表示され、`Fit Cross Section From Scan`で平滑化と最大偏差ベースの適応型代表点抽出を行い、現在断面のBezier ControlPoint列へ反映できます。Cross sections画面には測定点に対するRMS誤差と最大誤差を表示します。

写真トレースは現在、手動位置合わせとControlPoint調整用の下絵表示です。画像からの自動輪郭検出、レンズ補正、アオリ補正はまだ未実装です。

FinsパネルではFCS、FCS II、Single fin boxのテンプレート線画をOutline上へ表示できます。テンプレート種別は`.brd`のfin typeとして保存されます。配置値は既存BoardCADの`p50`配列を使い、Canvas上でドラッグ配置できます。
TailパネルではWeb版拡張として`p62` tail mode、`p63` tail length、`p64` tail depth、`p65` shoulder pos、`p66` shoulder width、`p67` join blendを保存します。元のBezier outlineは保持したまま、表示・出力・3Dリブ生成側でtail形状を合成します。現在の既定値は board max width ではなく、tail 側の切り落とし量を基準にした fixed cut preset です。Pin を最長、Round pin / Diamond / Square / Swallow / Fish を順に短くする設計です。

## 注意

レーザーGコードは機械ごとに原点、出力値、送り速度、Mコード仕様が異なります。実加工前に必ず空運転または低出力テストで確認してください。
CNC Gコードも機械ごとに回転軸方向、原点、工具長補正、ワーク保持が異なります。現在のWeb版CNC出力は断面補間ベースの汎用ポストなので、実加工前に必ずシミュレータで確認してください。
Probe simulationは生成Gコードの予定動作確認です。実際のプローブ接触位置、機械の加減速、バックラッシュ、プローブ遅延、ファームウェア固有の停止距離は再現しません。実機実行前の干渉確認と走査順序確認として使ってください。
Half cross-sectionの法線プローブGコードは、A軸位置決めと`G38.2`のY/Z同時プローブ移動をファームウェアが受け付けることを前提にしています。使用中のArduino Mega + 4軸ファームウェアで対応しない場合は、A軸回転後に単軸プローブへ分解するポスト処理が必要です。
プローブスキャンは、ファームウェアが`G38.2`とプローブ接触座標の応答を返すことが前提です。HC-05等がLinuxにシリアルポートとして認識され、ブラウザからアクセス可能な場合はWeb Serial経由で扱えます。ブラウザのWeb BluetoothだけでSPP通信を直接扱う前提にはしていません。測定点から生成される`.brd`は初期形状です。Cross Sectionは平滑化後、最大偏差が大きい箇所を優先してBezier制御点を構成しますが、最小二乗などの数値最適化フィットではありません。ノーズ、テール、レール形状は測定密度とプローブ精度の影響を強く受けるため、生成後にControlPoint編集で仕上げてください。

## 検証サンプル

- `Shortboard.brd`
- `Funboard.brd`
- `Longboard.brd`
