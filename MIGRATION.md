# BoardCAD Web Migration Map

元のJava版BoardCADの機能を、Web版へ移植するための対応表です。

## 優先方針

1. 元BoardCADの機能を優先して移植する
2. 画面構成と操作感は、File/Edit/View/Cross sections/Board/Misc/3D ModelのデスクトップCAD構成へ寄せる
3. 3D/OpenGL依存部分は、Intel Mac Sonoma/OCLPで動く2D Canvas/Web標準機能へ置き換える

## 移植済み

- File / Open: `.brd`読み込み
- File / Open Ghost: Ghost board `.brd`読み込み
- File / Print: PDF図面出力
- File / G-Code: レーザーアウトラインGコード
- File / G-Code: 4軸/5軸CNC Gコード
- File / Export: DXF outline/profile/current cross section polyline
- Edit: Undo / Redo
- Edit: Outline/Profile のControlPoint選択
- Edit: EndPoint / TangentPrev / TangentNext のドラッグ移動
- Edit: Continuous ControlPoint の反対側タンジェント追従
- Edit: Add ControlPoint
- Edit: Delete ControlPoints
- Edit: ControlPointInfo 数値編集
- Edit: ControlPointInfo Continuous切替
- Edit: ControlPointInfo Horizontal / Vertical
- Edit: Quad内アクティブペイン切替
- Edit: Quad内 Outline/Profile/Cross section のControlPoint編集
- Cross sections: Next / Previous cross section
- Cross sections: Add cross section
- Cross sections: Move cross section
- Cross sections: Remove cross section
- Cross sections: Copy / Paste cross section
- Cross sections: Import / Export `.crs`
- Cross sections: Guide points
- Cross sections: Release angle / Tuck radius表示
- View: Outline
- View: Profile
- View: Cross sections
- View: Quad
- View: Toolpath
- View: Show Ghost board
- View: Show grid
- View: Show Control points
- View: Show Curvature
- View: Show Non-active crosssections
- View: Show base line
- View: Show center line
- View: Show crossections positions
- View: Show Sliding info
- View: Show Sliding Cross section
- View: Show Volume distribution
- View: Show center of mass
- View: Show over bottom curve measurements
- View: Show moment of inertia
- View: Show Flowlines
- View: Show Apex line
- View: Tuck under line
- View: Flowlines / Apex line / Tuck under line のJava `getSByNormalReverse()` 近似精度寄せ
- View: Show foot marks
- View: Show guide points
- View: Use fill
- Board: Scale current board
- Board: Scale ghost to current board size
- Board: Info
- Board: Fins
- Board: Fins template選択とOutline上のドラッグ配置
- Board: Tail shape (Bezier native / Square / Squash / Pin / Round pin / Diamond / Swallow / Fish)
- Board: Guide points
- Board: Weight calculator
- Board: Flip
- Misc: Settings
- Misc: Language
- Misc: CrossSection Interpolation
- 3D Model: Approximate from Bezier (closed/open)
- 3D Model: Approximate outline and rocker
- 3D Model: Create 3D model using Bezier patches
- 3D Model: Clear approximation
- 3D Model: View 3D
- 3D Model: Edit nurbs surface preview
- サンプル読み込み: Shortboard, Funboard, Longboard

## 内部処理の移植済み範囲

- `cadcore.BezierCurve.calculateCoeff()`
- `cadcore.BezierCurve.getXValue()`
- `cadcore.BezierCurve.getYValue()`
- `cadcore.BezierCurve.getXDerivate()`
- `cadcore.BezierCurve.getTForXInternal()`
- `cadcore.BezierCurve.getYForX()`
- `cadcore.BezierCurve.getMinMaxNumerical()`
- `cadcore.BezierSpline.getValueAt()`
- `cadcore.BezierSpline.findMatchingBezierSegment()`
- `board.BezierBoard.getLength()`
- `board.BezierBoard.getMaxWidth()`
- `board.BezierBoard.getWidthAtPos()`
- `board.BezierBoard.getRockerAtPos()`
- `board.BezierBoard.getDeckAtPos()`
- `board.BezierBoard.getThicknessAtPos()`
- `board.BezierBoard.getNearestCrossSectionIndex()`
- `board.BezierBoard.getPreviousCrossSectionIndex()`
- `board.BezierBoard.getNextCrossSectionIndex()`
- `board.BezierBoard.getInterpolatedCrossSection()`
- `cadcore.BezierBoardCrossSection.getCenterThickness()`
- `cadcore.BezierBoardCrossSection.getWidth()`
- `cadcore.BezierBoardCrossSection.scale()`
- `cadcore.BezierBoardCrossSection.interpolate()`（同一点数の制御点補間を移植。制御点数差の自動分割照合は暫定でポリライン再サンプル）
- `cadcore.BezierSpline.getMaxX()`
- `cadcore.BezierSpline.scale()`
- `cadcore.BezierKnot.scale()`
- `cadcore.BezierKnot.setControlPointLocation()`
- `cadcore.BezierKnot.setLocation()`
- `cadcore.BezierKnot.setTangentToPrev()`
- `cadcore.BezierKnot.setTangentToNext()`
- `cadcore.BezierCurve.getClosestT()`
- `cadcore.BezierCurve.getSplitControlPoint()`
- `cadcore.BezierSpline.getSplitControlPoint()`
- `cadcore.BezierSpline.insert()`
- `cadcore.BezierSpline.remove()`
- `boardcad.gui.jdk.BoardEdit.getSelectedControlPoints()`
- `boardcad.gui.jdk.BoardEdit.clearSelectedControlPoints()`
- `boardcad.gui.jdk.BoardEdit.addSelectedControlPoint()`
- `boardcad.gui.jdk.BrdEditCommand.moveControlPoints()`の主要処理
- `boardcad.gui.jdk.BrdEditCommand.setContinous()`
- `boardcad.gui.jdk.BrdEditCommand.setControlPoint()`
- `boardcad.gui.jdk.BrdEditCommand.rotateControlPointToHorizontal()`
- `boardcad.gui.jdk.BrdEditCommand.rotateControlPointToVertical()`
- `boardcad.gui.jdk.BrdAddControlPointCommand`
- `boardcad.gui.jdk.BrdDeleteControlPointCommand`
- `boardcad.gui.jdk.ControlPointInfo`
- `boardcad.gui.jdk.QuadView`
- `boardcad.gui.jdk.BrdEditParentContainer`のアクティブ編集ビュー管理
- `boardcad.gui.jdk.BoardCAD`のCrossSectionEdit / CrossSectionOutlineEdit構成
- `boardcad.gui.jdk.BrdAddCrossSectionCommand`
- `boardcad.gui.jdk.BrdRemoveCrossSectionCommand`
- `boardcad.gui.jdk.BrdMoveCrossSectionCommand`
- `boardcad.gui.jdk.BrdPasteCrossSectionCommand`
- `boardcad.gui.jdk.BoardCAD.isPaintingGrid()`
- `boardcad.gui.jdk.BoardCAD.isPaintingControlPoints()`
- `boardcad.gui.jdk.BoardCAD.isPaintingCurvature()`
- `boardcad.gui.jdk.BoardCAD.isPaintingNonActiveCrossSections()`
- `boardcad.gui.jdk.BoardCAD.isPaintingBaseLine()`
- `boardcad.gui.jdk.BoardCAD.isPaintingCenterLine()`
- `boardcad.gui.jdk.BoardCAD.isPaintingCrossectionsPositions()`
- `boardcad.gui.jdk.BoardCAD.isPaintingSlidingInfo()`
- `boardcad.gui.jdk.BoardCAD.isPaintingSlidingCrossSection()`
- `boardcad.gui.jdk.BoardCAD.isPaintingVolumeDistribution()`
- `boardcad.gui.jdk.BoardCAD.isPaintingCenterOfMass()`
- `boardcad.gui.jdk.BoardCAD.isPaintingOverCurveMeasurements()`
- `boardcad.gui.jdk.BoardCAD.isPaintingMomentOfInertia()`
- `boardcad.gui.jdk.BoardCAD.isPaintingFlowlines()`
- `boardcad.gui.jdk.BoardCAD.isPaintingApexline()`
- `boardcad.gui.jdk.BoardCAD.isPaintingTuckUnderLine()`
- `boardcad.gui.jdk.BoardCAD.isPaintingFootMarks()`
- `boardcad.gui.jdk.BoardCAD.useFill()`
- `boardcad.gui.jdk.BezierBoardDrawUtil.paintCrossSectionFlowLines()`
- `boardcad.gui.jdk.BezierBoardDrawUtil.paintCrossSectionApexline()`
- `boardcad.gui.jdk.BezierBoardDrawUtil.paintCrossSectionTuckUnderLine()`
- `boardcad.gui.jdk.BezierBoardDrawUtil.paintVolumeDistribution()`
- `board.BezierBoard.getCrossSectionAreaAt()`
- `board.BezierBoard.getVolume()`
- `board.BezierBoard.getCenterOfMass()`
- `board.BezierBoard.getMomentOfInertia()`
- `board.BezierBoard.getFromTailOverBottomCurveAtPos()`
- `board.BezierBoard.getFromNoseOverBottomCurveAtPos()`
- `board.BezierBoard.scale()`
- `board.BezierBoard.adjustCrosssectionsToThicknessAndWidth()`
- `cadcore.BezierBoardCrossSection.scale()`
- `cadcore.BezierSpline.getLengthByX()`
- `cadcore.BezierSpline.scale()`
- `cadcore.BezierKnot.scale()`
- `board.readers.BrdReader.readArrayOfControlPointsAndGuidepoints()`
- `board.writers.BrdWriter.write(... guidepointArray)`
- `board.BezierBoard.getFins()`
- `board.BezierBoard.setFins()`
- `board.BezierBoard.getFinType()`
- `board.BezierBoard.finScaling()`
- `board.NurbsBoard.set_tail()` の考え方を、Bezier outline非破壊のtail planform合成としてWeb版へ再構成
- `boardcad.gui.jdk.BoardCAD` Board menu: Scale current board / Info / Fins / Guide points / Weight calculator / Flip
- `boardcad.gui.jdk.BoardCAD.drawOutlineSlidingInfo()`
- `boardcad.gui.jdk.BoardCAD.drawProfileSlidingInfo()`
- `boardcad.gui.jdk.BoardCAD.drawOutlineCrossections()`
- `boardcad.gui.jdk.BoardCAD.drawProfileCrossections()`
- `boardcad.gui.jdk.BezierBoardDrawUtil.paintSlidingCrossSection()`
- `boardcad.gui.jdk.BoardFinsDialog`
- `boardcad.gui.jdk.BoardGuidePointsDialog`
- `boardcad.gui.jdk.WeightCalculatorDialog` の主要デフォルト値・重量計算式
- `boardcad.gui.jdk.BezierBoardDrawUtil.paintGuidePoints()`
- `boardcad.gui.jdk.BezierBoardDrawUtil.paintFins()`
- `boardcad.gui.jdk.BoardCAD.drawOutlineFootMarks()`
- `boardcad.gui.jdk.BoardCAD.drawProfileFootMarks()`
- `boardcad.gui.jdk.BoardCAD` Misc menu: Settings / Language / CrossSection Interpolation
- `boardcad.gui.jdk.BoardCAD.getCrossSectionInterpolationType()`
- `boardcad.gui.jdk.BoardCAD.setCrossSectionInterpolationType()`
- `boardcad.gui.jdk.BoardCAD` 3D Model menu のBezier近似系アクション
- `boardcad.gui.jdk.BoardHandler.approximate_bezier()` 相当のWeb Canvasプレビュー
- `cadcore.BezierBoardSLinearInterpolationSurfaceModel.getPointAt()`の主要な幅・厚みスケール処理
- `boardcad.gui.jdk.BoardCAD` Toolbar: Zoom / Pan / Fit の表示操作
- `boardcad.gui.jdk.BoardCAD` Toolbar: Spot check
- `boardcad.gui.jdk.BoardEdit` キーボードによるControlPoint移動
- `boardcad.gui.jdk.BoardCAD` 3D Model view の基本視点操作

寸法値は`.brd`内の保存値ではなく、Java版と同じくベジェモデルから算出します。

CNC用の断面生成は、Java版と同じく鼻先・テールのダミー断面を実断面へクランプし、補間後にその位置のアウトライン幅・厚みにスケールします。

## 次に移植する候補


## 演算ロジック確認メモ

- Flowlines / Apex / Tuck under line はJava版と同じ角度定義（Flow: 10 / 27.5 / 45度、Apex: 90度、Tuck under: 175度）を使います。
- Flowlines は Java版 `getSurfacePoint(x, -45, angle, 1, 1)` に合わせ、前後Cross sectionを各位置の幅・厚みにスケールしてから角度Sを求め、その2点を長手方向に補間します。`getSByNormalReverse()` はJava版と同じく `normalAngle - 90deg` の符号付き接線角を使い、曲線を後方から探索して最小角度誤差点へフォールバックします。
- Flowlines / Apex / Tuck under line の点列は形状更新ごとにキャッシュします。表示オプションON時でも、マウス移動や通常再描画では同じ角度点列の再探索を避けます。
- Java版 `BezierBoardSLinearInterpolationSurfaceModel.getPointAt()` と同じく、端部は `0.1` と `length - 0.1` にクランプし、補間断面をその位置のアウトライン幅・厚みにスケールしてから点を求めます。
- Web版の `getSByNormalReverse()` はベジェ曲線ごとに後方探索し、曲線長を合算してS値へ戻します。Java版の `getLengthByTangentReverse()` と同じ符号付き接線角を使いますが、曲線内の角度一致は軽量な反復探索で近似しています。
- Java版 `paintCrossSectionCenterline()` はループ変数 `x` を作りながら `getValueAt(0.01)` を参照しており、中心線が固定値になり得ます。Web版では寸法表示の妥当性を優先し、各位置の `x` を使う描画にしています。
- Quad Outlineのcenter lineは、アウトライン本体と同じfit変換を共有します。以前のWeb版ではcenter lineだけ別paddingで再fitしていたため、見かけ上センターからズレていました。
- Volume distribution / center of mass は、Java版と同じ長手方向Simpson積分の考え方で実装しています。断面積はSLinear補間後の断面ポリゴン面積から算出しており、Java版のDeck積分 - Bottom積分の2倍と同じ幾何量を狙っています。
- サンプル検証値: Shortboard `area=238.701 volume=27444.386 cm=89.860`、Funboard `area=329.931 volume=47521.606 cm=111.911`、Longboard `area=373.702 volume=66296.912 cm=135.526`。単位は入力BRD座標系に依存します。
- Over bottom curve measurements は、Java版と同じくBottom splineの曲線長 `getLengthByX()` を使います。Web版ではベジェ曲線を分割して曲線長を数値積分する近似です。
- Moment of inertia はJava版と同じ近似密度 `3.0 / 30.0` と長手方向分割積分を使っています。表示用の相対指標として実装しており、物理単位は入力BRD座標系と単位選択に依存します。
- Foot marks はJava版の1 inch / 1 foot / 2 feet / center or wide point / nose側 -2 feet / -1 foot / -1 inch の配置を移植しています。Over bottom curve有効時はBottom spline曲線長からX位置へ戻して描画します。
- Sliding Info は Java版と同じくマウス位置に追従する `mBrdCoord` 相当の座標を保持し、Outlineでは幅・tail/nose距離・O.C.距離・moment、Profileでは厚み・rocker・radius・tail/nose距離を表示します。
- Sliding Cross section はカーソルX位置の補間断面を `boardCadInterpolatedCrossSectionKnots()` で作成し、Cross sections / Quad cross-section ペインへ点線で重ねます。Outline/Profileでは同じX位置を青いsliding markerとして表示します。
- Cross section positions は Java版と同じく現在断面を実線、非アクティブ断面を点線で描き分けます。
- Misc / CrossSection Interpolation は Java版の ControlPoint interpolation / S-Blend interpolation のラジオ切替を移植しています。ControlPoint は制御点対応補間、S-Blend はサンプル点再配分ベースの補間としてWeb版の描画・3D previewに反映します。
- Misc / Settings はWeb版で安全に変更できる曲線分割数と3D preview分割数を設定します。Java版の全Settings treeはまだ未移植です。
- Misc / Language はWeb版内部状態として `en` / `ja` を保持します。Java版と同じ完全なResourceBundle切替は未移植です。
- 3D Model は Java3D/NURBS依存部分を直接使わず、Bezier/SLinear由来のサーフェス点をCanvasに投影したワイヤーフレームとして実装しています。Intel Mac Sonoma/OCLPで扱いやすい標準Canvas描画に限定し、OpenGL/Java3D命令は使いません。
- 3D Model view はCanvasのワイヤーフレームをカメラ角から再投影します。マウスは左ドラッグで回転、Shift/右ドラッグでパン、ホイールでズームします。キーボードは `1`-`6` でビュー切替、3Dでは矢印で回転、`W/A/S/D`でパン、`+/-`でズーム、`I/T/O/R`で等角/上面/アウトライン/プロファイル系プリセットに切り替えます。
- 3D Model のワイヤーフレームはCNC用ポリラインサンプルから切り離し、Java版SurfaceModelに近い `x + s + angle range` の点取得で生成します。S-Blendでは前後Cross sectionをターゲット幅・厚みにスケールしてからS範囲を取り、ControlPointでは補間断面からS範囲を取ります。ワールド座標線は形状更新または3D分割数変更までキャッシュし、視点操作中は再投影だけを行います。
- 3D Model の固定X方向リブは点列 `lineTo` ではなく、補間済みCross sectionの制御点を3D投影してCanvas `bezierCurveTo` で描画します。制御点数が揃う断面間ではベジェ制御点を直接補間し、揃わない場合のみ点列補間へフォールバックします。長手方向のstringer線も投影点列をCatmull-Rom由来のcubic Bezierとして描画し、Quad内3D wireにも同じ処理を使います。
- 2D view は表示変換をキャンバス描画時だけ適用します。Panツールのドラッグ、Zoomツールのクリック、ホイール、矢印キー、`+/-`、`F`/`0` に対応し、PDF/Gコードなどの出力座標にはズーム・パンが混ざらないようにしています。
- Volume distribution / center of mass / volume / cross section area は形状更新単位でキャッシュします。初回計算後の再描画やマウス移動では積分と断面積計算を繰り返さないようにしています。
- 3D Model / Create 3D model using Bezier patches は Java版と同じく編集可能Cross sectionの制御点数が4または5のときだけ通すチェックを入れています。
- Board / Scale current board は Java版 `BezierBoard.scale(newLength,newWidth,newThickness)` と同じく、最大幅・最大厚から倍率を求め、Outlineは長さ/幅、Deck/Bottomは長さ/厚みで制御点とタンジェントを直接スケールします。その後、内部Cross sectionを各位置の幅・厚みに再スケールします。
- Board / Scale current board は Java版Scale dialogの `scaleBottomRocker` に対応し、確認ダイアログで `BezierBoard.scaleAccordingly(newLength,newWidth,newThickness)` 相当を選べます。Deck内部制御点の元厚みを保持してBottom rockerスケール後に目標厚みへ戻し、Java版と同じタンジェント角補正を行います。`scaleFins` もJava版 `finScaling(lengthRatio,widthRatio)` と同じ配列要素へ適用します。
- Board / Flip は、Java版のBoardメニュー実装と同じくボード形状データを反転せず、各ビューの表示方向だけを反転します。
- Board / Info は、Java版 `BoardInfo` ダイアログ相当の主要寸法・体積・重心・制御点数を表示します。
- Board / Fins は `.brd` の `p50` 9要素配列と `p51` fin type を読み込み、Java版 `BoardFinsDialog` と同じ配列順（side rear x/y、side front x/y、center rear/front/depth、side depth、splay）で編集します。FCS、FCS II、Single fin boxのテンプレート線画をOutline上へ表示でき、テンプレート種別は`p51`へ保存します。Outline/Quad Outline上ではフィン線分の中央ドラッグで移動、サイドフィン端点ドラッグで角度変更できます。Web版拡張として`p58` Fin Setup、`p59` Toe-in、`p60` Cant、`p61`追加フィンJSONを保存し、Quad rear / Bonzer runner等の追加フィンもCanvas上で移動・端点角度変更できます。Java版 `BoardFinsDialog` 自体は代表レイアウトの標準プリセット値を持っておらず、Web版の Fin Setup は外部資料ベースの既定値です。Twin系は `twin-fish` と `twin-performance` に分割し、旧 `twin` は互換上 `twin-performance` として扱います。プリセットの side-fin `Y` は固定全幅比ではなく、fin station 近傍のローカル幅から `off rail` を引いて決め、Toe-in 表示値も実際のセグメント角に合わせます。調査メモは `FIN_PLACEMENT_RESEARCH.md` を参照してください。
- Board / Tail は元Java版のNURBS専用 swallow tail 編集を、Web版ではBezier outline非破壊のtail planform合成として実装しています。`p62` tail mode、`p63` tail length、`p64` tail depth、`p65` shoulder pos、`p66` shoulder width、`p67` join blend を保存し、Square / Squash / Pin / Round pin / Diamond / Swallow / Fish を Outline、Template PDF、DXF、レーザーGコード、3D wireへ反映します。Join部の傾きは元outlineの接線から取得し、`Join blend`係数で反映量を調整します。tail の既定寸法は board max width 比例ではなく、元outlineを最長 pin 母線として残し、tail 側を何cm切り落とすかで決める fixed cut preset です。Round pin / Diamond は中心 tip を少し前へ、Square / Squash は transom cut、Swallow / Fish は広い tail block とノッチを作る前提で短くなります。旧BoardCADの `.brd` では Fish / Swallow がSquare風のアウトラインとして保存されることがあるため、Web版のFish / Swallow生成は旧BRDのtail末端形状ではなく参考画像のVノッチ/スプリットテール幾何を優先します。Swallow / Fishのノッチ区間では3Dリブも中心線側をBezier分割でクリップし、尾部中央の仮想的なつながりを描かないようにしています。
- Tail分類上、Round pin はストリンガー上に明確な頂点を持つ丸いピン、Round / Rounded square / Rounded diamond はストリンガー部に尖りがなく円弧で終わる形状として扱います。Fish / Swallow / Stinger はテール幅の絞り量で区別し、既定値は Fish が最も広く、Swallow はそれより狭く、Stinger はtailではなく中央寄りの大きいwingでさらに幅を絞る前提にしています。
- Nose分類は未実装ですが、今後のBoard / Nose移植では tail と同じく「元outlineをどこで切るか、どれだけ曲率を上げるか」で扱います。全長は Gun / Point nose が最長で、Pin nose、Round pointed nose、Wide nose、Round nose、Diamond nose、Snub nose、Square nose の順に短くなる前提です。Snub nose は形状上 Round square tail と同じく、直線切断ではなく丸めた角と短い円弧を持つものとして扱います。
- Board / Guide points は Java版と同じ `gps : (` / `(gp [x,y])` ブロックを読み込み、Outline / Bottom / Deck / Current cross section の各 guide point 配列へ追加・編集・削除します。
- Cross sections / Guide points は現在断面の `BezierBoardCrossSection.getGuidePoints()` を直接編集対象にします。断面パネルからCurrent cross section専用の追加・編集・削除を実行でき、表示中のGuide pointはクリック選択、ドラッグ移動、矢印キー移動、Delete/Backspace削除に対応します。
- Edit / Guide point はCanvas右クリックのBoardCAD風コンテキストメニューから追加・編集・削除できます。Guide point上で右クリックした場合はその点を選択し、`Edit Guide Point` / `Delete Guide Point` は選択中の点を直接対象にします。
- Edit / ControlPoint はCanvas右クリックのBoardCAD風コンテキストメニューから追加・削除できます。追加は右クリック位置に最も近いBezier区間を分割し、削除は右クリックで選択した内部EndPointを対象にします。`X locked` / `Y locked` はControlPointとGuide pointのドラッグ・矢印キー移動制約として動作します。`Z locked` はWeb版2D編集対象がないため表示のみです。`View blank` はJava版と同様に本体曲線とControlPoint表示を隠し、`View deck toolpath` / `View bottom toolpath` は既存CNCサーフェスサンプルからdeck/bottomのツールパスをOutline/Profile/Quad viewへ重ねます。
- Cross sections / Release angle はJava版 `BezierBoardCrossSection.getReleaseAngle()` と同じくTuck under定義角175度の位置から最寄りControlPointを探し、前後タンジェント角を表示します。Tuck radius はApex定義角90度からTuck underまでの平均曲率の逆数として表示します。
- File / Save BRD は Java版 `BrdWriter.saveFile()` と同じ保存順序で `p01` から `p35` までを書き出します。Outline / Bottom / Deck / Cross sections はベジェ制御点をそのまま保持し、ポリライン化しません。
- BRD保存時は保存用コピーだけに対して、ノーズ/テールのBottomとDeck端部を同一X/Yへ揃えます。これにより元Java版で起きていたデッキ・ハル接合部の薄化や端部描画精度低下を避けつつ、編集中の形状データは不用意に変形しません。
- File / Export Outline `.otl` と Export Profile `.pfl` は Java版 `BrdWriter.exportOutline()` / `exportProfile()` と同じ `p32` / `p33+p34` ブロックを出力します。`.otl` / `.pfl` の読み込みは現在ボードのOutline / Profile差し替えとして扱い、Profile読み込み時もノーズ/テールのDeck-Bottom端部を接合補正します。
- File / Export DXF Spline は Java版 `DxfExport.exportBezierSplines()` と同じく、各Bezier曲線区間をdegree 3、control points 4、knots `0,0,0,0,1,1,1,1` のDXF `SPLINE` エンティティとして出力します。Outlineは左右ミラー、ProfileはBottom+反転Deck、Cross sectionは左右ミラーをJava版と同じ並びで出力します。
- File / Print Templates PDF は Java版 `PrintBrd` の実寸出力スケール `72/2.54` に合わせ、A4横ページへOutline / Profile / Cross sectionsを自動タイル分割して出力します。テンプレート線はPDF cubic Bezier pathとして出力し、画面表示用のポリライン近似には依存しません。
- CNC Probe Scan は新規拡張として、ノーズ先端をワーク原点に設定し、ジョグでテール先端まで移動した距離を実測ボード長として使う手順へ寄せています。現行の2000 x 900 x 300mm機を初期値にしつつ、X可動範囲は3000mmまで入力可能にしています。`Stringer + ribs` はスパインのロッカー計測点列を先に生成し、いったんノーズ原点へ戻ってから各X位置のリブ方向点列を生成します。`Mesh grid` は実測長に対するアウトライン幅内の格子点を生成します。測定ログのXはノーズ原点の機械スキャン座標として保持し、Scan Ghost / BRD生成時に `BoardCAD X = measured length - nose_x_mm` へ変換します。初期値ではボードセンターラインを機械Y450mmへ割り当て、CNCのY可動範囲0..900mm内に収めます。Web Serial対応ブラウザではシリアルポートへ送信し、`ok` / `error` / `ALARM` 応答を待ちながらログ表示します。送信中の `(P n surface BX.. BY.. MX.. MY..)` コメントと `PRB:` 応答を対応付け、測定点として保存します。
- File / Scan New Board と Scanメニューを追加しました。Scan画面は通常ビューと同じCanvasを使い、ノーズ原点、テール点、現在位置を表示します。Scanメニューの `Set Nose Point` / `Set Tail Point` はWeb Serialから取得した現在位置を記録し、Tail設定時に実測ボード長へ反映します。JOG ControllerはGRBL系の `$J=G91 ...` コマンドで相対ジョグを送ります。現在位置はGRBL系の `?` ステータス応答内 `WPos` / `MPos` をパースしてリアルタイム表示します。
- Probe simulation は生成済みProbe G-codeをパースし、`G0/G1`を移動、`G38.2`をプローブ動作としてScan画面へ再生します。`(P n surface BX.. BY.. MX.. MY..)` コメントを読み取り、再生中の測定点番号・面・Z位置を表示します。Pause / Step / Resetで1動作ずつ確認でき、下部のZ profileには安全高さ、下降、横プローブ移動を含むZ方向の予定動作を表示します。これは予定動作確認用で、実接触位置や機械加減速は再現しません。
- Scan画面の表示方向は、ユーザーの計測姿勢に合わせて右側をノーズ、左側をテールにしています。Web Serialは許可済みポートのみ列挙できるため、`Choose Port`でブラウザのポート選択を行い、`シリアルポート`欄で選択してから接続するUIにしました。右側パネルは出力設定、Scan setup、Probe/serial settingsを折りたたみ、位置表示・JOG・接続を優先表示します。
- Scan Ghost Profile はBoardCADのScan Ghost board系操作に対応する初期実装です。測定済みbottom/deckスパイン点列をProfile画面へ点列・破線として重ね、`Fit Profile From Scan`でその点列からBottom/DeckのBezier ControlPoint列を生成します。
- Scan Ghost Outline は横向きプローブで取得した `outline-right` 点列をOutline画面へ左右対称の点列・破線として重ねます。`Fit Outline From Scan`で片側Y接触位置から同一Xの半幅を復元し、OutlineのBezier ControlPoint列を生成します。ログに`outline-left`が含まれる場合も読み込みは可能で、両側がある場合は左右半幅の平均を使います。
- Scan Ghost Cross Section は `cross-half` 測定点列をX位置ごとにまとめ、現在断面に最も近い測定断面をCross sections画面へ点列・破線として重ねます。`Fit Cross Section From Scan`でZ最小値をボトム基準0へ正規化し、測定点を平滑化してから最大偏差ベースの適応型代表点へ削減し、現在断面のBezier ControlPoint列へ反映します。端点のストリンガー位置とレール最大幅点は保持します。フィット後は実測点からBezier曲線への最近距離でRMS誤差と最大誤差を計算し、ステータスとCross sections画面に表示します。
- Trace Image はOutline/Profileごとに画像を読み込み、BoardCAD座標系上の下絵として描画します。画像は表示、透明度、拡大縮小、回転、中心X/Y、上下左右ボタン移動を調整でき、`Fit to board`で画像幅をボード長へ合わせます。右側パネルはTrace Imageを含めて折りたたみ可能です。現段階では手動トレース用で、画像からの自動輪郭検出、レンズ補正、アオリ補正は未実装です。
- Probe測定CSVはFile / Openから再読み込みできます。`surface`、`nose_x_mm`、`board_y_mm`、`z_mm`、`machine_x_mm`、`machine_y_mm`のヘッダを解釈し、旧`board_x_mm`ヘッダも読み込み互換として受け付けます。`cross-half`のようなハイフン付きsurface名も保持します。読み込み後は内部測定点配列とScan Logの`MEASURE`行を復元します。
- Probe Scan / Outline side probe は4軸目を90度回転させた横向きプローブ用の初期Gコード生成です。サーフボードは左右対称として片側だけを計測し、先に取得したロッカー/既存ボード形状から各X位置のZを追従させます。早送り位置はアウトライン予測位置より外側、`G38.2 Y...`の終点はボード側予測位置になり、外側からサーフボードへ向かってプローブします。Probe Scan / Half cross-section はボードを縦固定して半周リブを計測する想定で、デッキ側ストリンガーからレール最大幅を通り、ボトム側ストリンガーへ戻る逆U字の半周点列を出力します。各点では断面曲線の外向き法線からA軸角度を算出し、表面近くの短い法線退避位置へ移動してから `G38.2 Y... Z...` で表面側へ直線プローブします。デッキ側は上側からデッキ表面へ、ボトム側は下側からボトム表面へ向かいます。シミュレーション中は対象断面のY-ZインセットとA角表示で動きを確認できます。
- Probe Scan / Build BRD は保存済み測定点またはログ内の `MEASURE surface X.. Y.. Z..` 行から、centerline bottom/deck、最大Yアウトライン、Cross sectionsを構成し、初期 `.brd` として読み込みます。Zはbottomの最小値を0へ正規化します。同一X位置にbottom/deckのリブ方向測定点がある場合は、bottom中心からレール側bottom、レール側deck、deck中心へ戻る断面点列を作り、実測リブ形状をCross Sectionへ反映します。測定点が不足するX位置では従来の楕円近似断面へフォールバックします。
- CNC Sender はBoardCAD Webが生成する4軸/5軸CNC GコードをWeb Serial経由で送信できます。現在は行単位で送信し、`ok` / `error` / `ALARM` を待つ汎用senderです。Probe Scanの測定点はログ内 `MEASURE` 行と内部配列に保存し、CSVとして書き出せます。
- Board / Weight calculator は Java版の初期値（stringer density `0.4`、foam density `0.045`、glass unit weight、hotcoat計算など）と主要式を移植しています。Deck/Bottom面積はWeb版のSLinear近似表面から数値積分するため、Java版のSurfaceModel完全一致ではなく、重量見積もり用の近似です。
- Ghost board は File / Open Ghost で読み込み、Outline / Profile / Cross sections / Quad へ破線オーバーレイとして重ね表示できます。View / Show Ghost board で表示を切り替え、Board / Scale ghost to current board size で current board と同寸へ揃えられます。Java版の Ghost command に合わせて、`G` ホールド中に矢印キーで平行移動、`Q/W` で回転、`Alt` 併用で微調整できます。
- `cadcore.BezierBoardCrossSection.interpolate()`の制御点数差分処理
- `cadcore.BezierBoardSLinearInterpolationSurfaceModel.getPointAt()`の角度制限/S値処理
- `cadcore.BezierBoardControlPointInterpolationSurfaceModel`
- Probe Scan: cross-half以外の実測リブ断面点列から生成した初期 `.brd` を、より滑らかなBezier制御点へフィットする処理
- 3D Model: WebGLではなくCanvasベースの軽量ワイヤーフレーム表示

## 注意

Java版の3D/Java3D/OpenGL機能は、この環境では起動停止やハングの原因になったため、Web版ではブラウザ標準機能で段階的に代替します。
