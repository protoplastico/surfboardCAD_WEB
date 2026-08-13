# BoardCAD Web Review

このファイルは、現時点の開発状況をレビューするための確認表です。

## レビュー対象

- `.brd`読み込み、表示、BRD再出力
- File系出力: PDF、Template PDF、DXF Polyline、DXF Spline、レーザーGコード
- 4軸/5軸CNC Gコード生成
- Cross sections編集、Guide points編集、Release angle / Tuck radius表示
- View系パラメーター表示: Volume、Center of mass、Moment of inertia、Flowlines、Apex、Tuck under line
- Board系: Scale、Info、Fins、Guide points、Weight calculator、Flip表示
- Board系: Tail shape (Bezier native / Square / Squash / Pin / Round pin / Diamond / Swallow / Fish)
- Ghost board: Open Ghost、Show Ghost board、Scale ghost to current board size
- 3D Model: Canvasワイヤーフレーム表示、マウス/キーボード視点操作
- CNC Probe Scan: ノーズ原点、テールまでのジョグ実測長、`G38.2`計測Gコード生成、Web Serial sender、`PRB:`ログ取得、測定点から初期`.brd`生成
- Scan UI: File / Scan New Board、Scanメニュー、JOG Controller、現在位置表示
- Scan Ghost Profile: 測定済みbottom/deckスパイン点列のProfile重ね表示、ControlPoint列への反映
- Scan Ghost Outline: 測定済みoutline-right/outline-left点列のOutline重ね表示、ControlPoint列への反映
- Scan Ghost Cross Section: 測定済みcross-half点列のCross sections重ね表示、ControlPoint列への反映
- Probe Scan modes: `Outline side probe`、`Half cross-section` の横向きプローブGコード生成
- Probe Simulation: 生成済みProbe G-codeの移動/プローブ動作再生、Step送り、Z profile表示
- Probe測定CSV: ボード座標、機械座標、Z計測値の保存
- Probe測定CSV再読込: File / Openから測定点配列とScan Logを復元
- Tail shape: Tail length / Tail depth / Shoulder pos / Shoulder width / Join blend のBRD保存、3D wire、PDF/DXF/G-code反映

## 自動確認

ターミナルで以下を実行します。

```sh
node --check app.js
node --check test-core.js
node test-core.js
```

成功時の出力:

```text
BoardCAD Web core checks passed: 3 samples + probe reconstruction
```

`test-core.js`で確認している内容:

- `Shortboard.brd`、`Funboard.brd`、`Longboard.brd`を読み込めること
- BRD再出力後に再パースでき、Cross Section数が維持されること
- Drawing PDF / Template PDF がPDFシグネチャを持つこと
- Outline / Profile / Cross Section のDXF Splineが生成されること
- レーザーGコードに出力コマンドが含まれること
- CNC Gコードに回転軸出力が含まれること
- Probe Scan Gコードに`G38.2`が含まれること
- Probe Scan GコードにBRD化用`BX/BY`と実機移動用`MX/MY`が含まれること
- `Stringer + ribs`のGコードにスパイン計測フェーズと、リブ計測前のノーズ原点復帰が含まれること
- Probe Scan Gコードからシミュレーション用の移動線分とprobe線分を復元できること
- 合成outline-right/outline-left測定点からOutline用Scan Ghost点列を復元できること
- 合成cross-halfログを再読込し、Cross Section用Scan Ghost点列を復元できること
- 合成cross-half測定点を平滑化し、最大偏差ベースの適応型代表点へ削減してBezierフィット誤差を計算できること
- 右クリック/EditメニューからControlPoint追加・削除、Guide point追加・編集・削除、X locked移動制約、View blank、deck/bottom toolpath表示が動作すること
- Probe測定CSVを書き出し形式から再読込でき、surface名を保持できること
- 合成プローブ測定点から初期`.brd`を生成し、再パースできること
- Trace Imageパネルが存在し、Outline/Profile用の画像下絵設定を保持できること
- Trace Imageの上下左右移動、右側パネル折りたたみ、3D長手方向Bezier描画、Fin template選択、Fin templateドラッグ配置が構文・コア検証で落ちないこと
- Tail mode `swallow` のBRD roundtrip、DXF/PDF/G-code出力、3Dリブのノッチ側クリップが通ること
- Tail mode既定値が fixed cut preset になっており、`Pin > Round pin > Diamond > Square/Swallow/Fish` の順で有効 outline length が短くなること

## 手動確認

1. `start.command`を実行する。
2. ブラウザで `http://localhost:8788/` を開く。
3. `Shortboard`、`Funboard`、`Longboard`を順に読み込む。
4. `Outline`、`Profile`、`Cross sections`、`Quad`、`3D Model`を切り替える。
5. ControlPointを選択し、ドラッグ、矢印キー、ControlPointInfo数値入力を確認する。
6. Canvas上を右クリックし、コンテキストメニューからControl Pointを追加できることを確認する。
7. 内部EndPointを右クリックし、コンテキストメニューからControl Pointを削除できることを確認する。
8. 右クリックメニューの`X locked` / `Y locked`でControlPointとGuide pointの移動方向が制限されることを確認する。
9. 右クリックメニューの`Spot check`、`Add/Edit/Delete Guide Point`、`View blank`、`View deck/bottom toolpath`、`Cross sections`が既存機能へ接続されていることを確認する。
10. Cross SectionのGuide pointを追加、移動、削除する。
11. PDF、Template PDF、DXF、レーザーGコード、CNC Gコードを出力する。
12. Trace ImageでOutline画像とProfile画像を読み込み、透明度、Scale、Rotation、Center X/Y、上下左右移動、Fit to board、Clearが動作することを確認する。
13. 画像下絵の上に既存サンプルボードが重なり、ControlPoint編集で輪郭をなぞれることを確認する。
14. 右側パネルの出力設定、Trace Image、CNC Probe Scan、Cross section、ControlPoint、Boardが折りたためることを確認する。
15. Board / FinsでFCS、FCS II、Single fin boxのテンプレートを選び、Outline上へ線画表示されることを確認する。
16. Fin SetupでSingle fin、2+1、Twin fin、Thruster、Quad、5 fin、Bonzerを選び、代表レイアウトがOutline上へ表示されることを確認する。
17. OutlineまたはQuad Outline上でサイドフィン線、センターフィン線、Quad rear / Bonzer runner等の追加フィン線の中央をドラッグし、位置が移動することを確認する。
18. OutlineまたはQuad Outline上でサイドフィン線または追加フィン線の端点をドラッグし、端点だけが動いてToe-inが更新されることを確認する。
19. Toe-in / Cantを入力し、BRD保存後の再読込で`p58`から`p61`のWeb版拡張フィン情報が保持されることを確認する。
20. Board / Tailで`Diamond`、`Swallow`、`Fish`を切り替え、Outline表示、3D wire、PDF/DXF/G-codeに反映されることを確認する。
21. `Swallow`または`Fish`で、tail中央ノッチ区間の3Dリブが中心線までつながらず、左右に分かれて描画されることを確認する。
22. ノーズ先端をワーク原点にする想定で、ジョグ測定したテールまでの距離を`実測ボード長`へ入力する。
23. File / `Scan New Board`でScan画面へ移ることを確認する。
24. Scan画面で右側がノーズ、左側がテールとして表示されることを確認する。
25. `Choose Port`でポート許可を行い、`シリアルポート`欄に許可済みポートが表示され、選択したポートで接続できることを確認する。
26. Web Serial接続後、JOG Controllerから `$J=G91 ...` が送られることを確認する。
27. `?`ステータス応答の`WPos`または`MPos`がPosition欄とScan画面のCurrent markerへ反映されることを確認する。
28. Scanメニューの`Set Nose Point` / `Set Tail Point`でノーズ/テール位置が記録され、Tail設定時に`実測ボード長`が更新されることを確認する。
29. `CNC Probe Scan`で`機械X可動範囲`を現行機なら`2000`、3000mm化後なら`3000`、`機械Yセンター`を`450`にして、`Stringer + ribs`と`Mesh grid`のGコードを生成する。
30. 生成Gコードのコメントが`BX/BY`、移動指令が`X/MY相当の機械Y`になっていることを確認する。
31. `Stringer + ribs`では、スパイン計測後に`G0 X0 Y...`でノーズ原点へ戻ってからリブ方向計測へ入ることを確認する。
32. `Simulate`でScan画面に移動経路、現在位置、G38.2プローブ方向、測定点番号が表示されることを確認する。
33. `Pause`後に`Step`で1動作ずつ進み、下部Z profileの現在点が連動することを確認する。
34. bottom/deckの測定ログがある状態でProfile画面を開き、Scan Ghost点列が重ね表示されることを確認する。
35. `Fit Profile From Scan`でBottom/DeckのControlPoint列が測定点列に沿って更新されることを確認する。
36. `Outline side probe`で生成されるGコードが`outline-right`のみを持ち、外側の早送り位置からサーフボード側の`G38.2 Y...`終点へ向かうことを確認する。
37. outline-rightの測定ログがある状態でOutline画面を開き、Scan Ghost点列が左右対称に重ね表示されることを確認する。
38. `Fit Outline From Scan`でOutlineのControlPoint列が測定点列に沿って更新されることを確認する。
39. `Half cross-section`で生成されるGコードが`cross-section-...`フェーズを持ち、デッキ側ストリンガーからレールを回ってボトム側ストリンガーへ戻る逆U字点列になっていることを確認する。
40. `Half cross-section`の各測定点コメントと早送りにA角が含まれ、`G38.2 Y... Z...`で法線方向プローブになっていることを確認する。
41. `Half cross-section`のプローブ線分が表面付近の短い直線になり、大きな円弧状の退避移動が出ていないことを確認する。
42. cross-halfの測定ログがある状態でCross sections画面を開き、Scan Ghost点列が現在断面へ重ね表示されることを確認する。
43. `Fit Cross Section From Scan`で現在断面のControlPoint列が測定点列に沿って更新されることを確認する。
44. `Fit Cross Section From Scan`で測定点より少ない代表ControlPointへ平滑化・適応削減され、ストリンガー端点とレール最大幅が保持されることを確認する。
45. `Fit Cross Section From Scan`後、ステータスとCross sections画面にRMS誤差と最大誤差が表示されることを確認する。
46. `Save CSV`で保存した測定CSVをFile / `Open`から読み込み直し、各Fit操作のボタンが有効になることを確認する。

## 現時点の制限

- Java版のNURBS編集そのものは未移植です。Web版ではCanvasワイヤーフレーム表示で代替しています。
- 3DはWebGL/OpenGLを使わず、Intel Mac Sonoma/OCLPで扱いやすいCanvas描画に限定しています。
- Ghost boardは読み込み、重ね表示、current board寸法へのスケール、`G`ホールド中の矢印移動 / `Q/W`回転 / `Alt`微調整まで対応しています。
- Trace Imageは手動トレース用の下絵表示です。画像からの自動輪郭検出、レンズ補正、アオリ補正は未実装です。
- Fin templateはOutline上の線画表示、`p51`保存、Canvas上ドラッグ配置、代表Fin Setupプリセット、Toe-in/Cant保存までです。加工用の厳密な規格寸法検証は未実装です。
- Tail shapeはWeb版拡張として`Square`、`Squash`、`Pin`、`Round pin`、`Diamond`、`Swallow`、`Fish`を実装済みですが、元Java版のNURBS tail編集とは内部表現が異なります。Web版ではBezier outlineを破壊せず、表示・出力時にtail planformを合成します。Join部の傾きは元outlineの接線から取得し、`Join blend`で調整します。
- BoardCAD本体の形状座標は`x=0`がテール、`x=length`がノーズです。Fin Setupプリセットのrear/front距離はテール基準として扱います。
- Probe Scanの測定ログ/CSVのXはノーズ原点の機械スキャン座標として保持し、Scan GhostやBRD生成時に`BoardCAD X = measured length - nose_x_mm`へ変換します。
- `cadcore.BezierBoardCrossSection.interpolate()`の制御点数差分処理は、Java版完全一致ではありません。制御点数が揃う場合は制御点補間、揃わない場合はポリライン再サンプルへフォールバックします。
- Probe Scanから生成するCross Sectionは、cross-halfでは平滑化後に最大偏差ベースで代表点を選び、Bezier制御点を生成してRMS誤差と最大誤差を表示します。最小二乗などの数値最適化フィットは未実装です。
- CNC senderは行単位送信と`ok` / `error` / `ALARM`待ちの汎用実装です。実機ごとの原点、回転軸方向、工具長補正、ワーク保持は未調整です。
- Probe Simulationは生成済みGコードの予定動作確認です。実際の接触点、機械加減速、バックラッシュ、プローブ遅延、ファームウェア固有の停止距離は再現しません。
- Half cross-sectionの法線プローブは、A軸位置決めと`G38.2`のY/Z同時プローブをファームウェアが受け付けることが前提です。実機が対応しない場合は、A軸回転後に単軸プローブへ分解するポスト処理が必要です。
- Probe ScanではノーズをX原点、ボードセンターラインを指定した機械Yへ写像します。実機側で別の原点運用をする場合は、`実測ボード長`、`機械X可動範囲`、`機械Yセンター`を変更してGコードを確認してください。
- JOG ControllerはGRBL系 `$J=G91` を前提にしています。現在のArduino Mega + 4軸ファームウェアが `$J` を受け付けない場合、ファームウェアに合わせたJogコマンドへ変更が必要です。
- 横向きプローブによるOutline計測は、片側のoutline-right点列から半幅を復元してOutline ControlPointへ反映できます。ただし測定点密度が低い場合、ノーズ/テール近傍は手動補正が必要です。
- Half cross-section は取得点を平滑化し、最大偏差の大きい箇所を優先した代表ControlPoint列として現在Cross Sectionへ反映できます。フィット後のRMS誤差と最大誤差は確認できますが、最小二乗などの数値最適化フィットは未実装です。

## レビューで重点確認すべき点

- Java版と同じ編集操作で、ControlPoint / Tangent / Continuousが期待通り動くか。
- BRD保存後に、ノーズ/テールのDeck-Bottom接合で極端な薄化が再発していないか。
- Template PDFの実寸スケールとタイル分割が実用範囲にあるか。
- 4軸/5軸CNC Gコードの軸方向、符号、原点が使用予定機械の座標系に合うか。
- Probe Scanの測定点密度で、生成されるCross Sectionが編集開始点として妥当か。
