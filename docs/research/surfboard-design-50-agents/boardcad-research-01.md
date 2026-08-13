# サーフボード・テール形状分類調査

調査日: 2026-08-12  
対象: BoardCAD等でプランシェイプ（上面アウトライン）を表現する際のテール分類

## 0. 最重要の前提

- テール名は厳密な工業規格ではなく、シェイパー間・ブランド間で境界が揺れる。特に `round` / `thumb` / `rounded pin`、`squash` / `rounded square`、`swallow` / `fish` は連続的な変形である。
- テール性能は末端輪郭だけで決まらない。テール幅・面積・厚さ（foil）、レール、ロッカー、ボトムコンケーブ、フィン位置との組み合わせで決まる。Greenlightはテールを「rail line の直接の延長」とし、他要素との相乗作用を明記している。したがってUIで形状名から性能を断定してはならず「一般的傾向」と表示すべきである。
- 幾何を理解する基本軸は (1) tail block/pod幅、(2) 最後の約12インチのレール収束、(3) 角／点の数、(4) 中央切欠きの有無と深さ、(5) wing/bumpによるレール線の不連続、(6) 有効レール長である。
- Greenlightの有用な総括は「squareが末端面積を最大化し、pinが最小化し、その他はその中間調整」。角は明瞭なリリース点を作り、連続曲線は水をより分散して離す。一般に角張ったテールは鋭い／pivot的なターン、丸いテールは流れる／弧の大きなターンという傾向。ただし他要素一定の場合に限る。

## 1. 推奨CAD分類

### 1.1 Square（スクエア、chop）

**幾何定義・識別**

- 左右レールが末端まで比較的真っ直ぐ延び、ストリンガーにほぼ直交する直線状の tail block で結ばれる。
- レールとblockの接合に左右2個の明瞭で鋭い約90度の角。中央切欠きなし。
- `chop tail` はBoardcaveで同義名として扱われる。

**性能傾向**

- 広い末端面積と硬い角により揚力・足場・drive/pivot leverageが大きく、水離れが明瞭。弱いセクションでplaningしやすく安定しやすい。
- 角がbite/pivot pointになる一方、丸い形よりターン開始に力を要し得る。クラシックロングボード／一部small-wave performance boardで典型。

**混同防止**

- squashとの差は、squareはblockが直線かつ角が鋭いこと。rounded squareは直線blockを残して角だけ丸める。

### 1.2 Squash（スカッシュ）

**幾何定義・識別**

- squareの左右角を丸めた基本形。末端は広く、中央切欠きなし。
- Greenlightの精密な区別: rounded squareは平坦な直線podを保持するが、典型的squashのpodはごく浅く外側へ弧を描く（穏やかな凸弧）。左右に角の名残／曲率変化がある。

**性能傾向**

- square由来の面積、lift、反応性と、丸めた角による滑らかなrelease/holdの均衡。sharpだがfluidなturnとされ、現代ショートボードで非常に一般的。

**混同名**

- `rounded square` をsquashの同義にする資料もあるが、CADでは別variantにするのが安全。`round squash` も程度差を示す非標準名称。

### 1.3 Round / Thumb（ラウンド／サム）

**幾何定義・識別**

- 中央切欠き・硬い角がなく、左右レールが幅のある滑らかな半円／親指状の末端弧へ連続する。
- Greenlightではfull roundを`thumb`とも呼び、丸形群の中で面積/liftが最大。レールは終盤まで比較的fullで、末端付近で曲率が強く増して丸いpodへ閉じる。

**性能傾向**

- 角のない分散したrelease、smooth/open/ellipticalなターン。pin系より面積とliftがあり汎用性・弱い部分での速度を残す一方、square系より急角度のpivot感は弱い。
- steep/hollowでもholdを得やすいとのメーカー資料があるが、幅広roundと細いround pinを一括にしないこと。

**混同防止**

- `thumb` はfull roundの同義／近縁。rounded pinはもっと早い位置から引き込み、末端面積が小さい。

### 1.4 Rounded Pin / Round Pin（ラウンドピン）

**幾何定義・識別**

- roundより前方から左右レールが内側へ収束し、最後は鋭点でなく小半径の柔らかい点に閉じる。連続した放物線的曲線で、角・block・切欠きなし。
- 「pointed at back」という日常的説明はあるが、true pinの針状尖端とは区別する。

**性能傾向**

- planing面積を減らし、高速時のhold/control、滑らかなrail-to-rail移行、長く流れるターンを重視。medium〜large、steep/hollow/powerful surfに多い。
- squashより後足位置が前になる傾向。roundよりdrive/liftが少なく、pinよりturnability/liftを残す。

**混同名**

- `round pin` と `rounded pin` は通常同系。商品名では単に`round`と呼ばれる場合もあるため、名称でなく末端12インチの引込み開始位置とtip半径を見る。

### 1.5 Pin / Pintail（ピン）

**幾何定義・識別**

- 左右レールが長い連続曲線で強く引き込まれ、ストリンガー上の単一の鋭い点へ収束。tail blockは事実上ゼロ、切欠き・角なし。
- 全形状中で末端幅／planing areaが最小級。rounded pinよりtipが鋭く細い。

**性能傾向**

- 高速でのtraction/hold、tracking、rail-to-railの容易さを優先。大波gun、barrel、steep/hollow waveの典型。
- lift/driveと小波での速度維持、pivot性を犠牲にしやすく、低速・弱波には通常不向き。

### 1.6 Swallow（スワロー）

**幾何定義・識別**

- 幅のあるsquare系末端の中央からV字／楔状を切り取り、左右レール末端に2本のpin（tip）を作る。輪郭は「レール→外側tip→中央notch apex→反対tip→レール」。
- `mini swallow` / `baby swallow` は切欠きが浅くtip間隔が狭い。深さと幅は連続パラメータとして扱う。

**性能傾向**

- 幅広で直線的な後部レール＝面積・planing/driveを保持しつつ、切欠きで末端面積を除きresponseを上げ、2つのtipがbite/holdを与える。
- 深い／tip間隔の広いものは一方のpinから他方への切替が遅く感じる場合がある。小波fishからhigh-performance、大波baby swallowまで用途は幅広く、名称だけで波域を固定できない。

### 1.7 Fish tail（フィッシュテール）

**幾何定義・識別**

- 独立したトポロジーではなく、通常は**幅が広く深く誇張されたswallow**。tip間隔が広く、notchも深く、後部レールが長く直線的／平行気味。
- `fish` は本来ボード全体のカテゴリ（短い、幅広い、低ロッカー、しばしばtwin keel）でもある。よって「fish tail」と「fish board」をデータモデル上で分離する。

**性能傾向**

- 広いtail/直線レールのdown-the-line speedとdriveを、深いcutawayによる面積削減・hold・responsivenessで制御。弱い小波が代表用途。
- Degree33はswallow/fishを話者により互換使用とするが、Greenlight/Harbourはfishをより誇張されtipが遠いswallowとして説明。CADでは `swallow.depth` と `tipSpacing` が閾値を超えたpresetをfishとするのがよい。

### 1.8 Diamond（ダイヤモンド）

**幾何定義・識別**

- squareの左右後角を斜めに切り落とし、左右の前方角からストリンガー上の後方中央点へ2本の直線／浅い曲線が集まる凸形。中央点は**後ろへ突き出す**（notchではない）。
- ストリンガー上の全長は維持するが、左右レールは中央点より前で終わり、有効rail/release pointを前へ移す。

**性能傾向**

- square/squashの面積をある程度残しながら有効レールを短縮し、よりtight/pivotalなturnを得る。Harbourはsquare/squashよりdriveが少ないと説明。

**混同防止**

- batは中央点に加え左右が凹形に切り取られ3つの点を持つ。diamondは基本的に凸の4辺輪郭で中央後端が1点。
- `rocket tail`等をdiamond系名称にする資料もあるが普遍的でないのでaliasを自動統合しない。

### 1.9 Bat / Star（バット／スター）

**幾何定義・識別**

- 左右レール末端の2点に加え、ストリンガー上に後方へ突き出す歯状の中央点を持つ。中央点の左右から半円状／弧状にmaterialを切り取り、合計3点となる。
- Greenlightでは`bat`と`star`を同系とする。形としてはswallowのV-notch中央に逆向きの中央突起を足したように見える。

**性能傾向**

- swallow同様に幅広tail/直線railとcutawayを併用し、外側2点に中央接触点を加える。安定／holdが増すという説明がある一方、専門記事にはdiamond/swallowとの差は水上で知覚困難でcosmetic寄りとの見解もあり、効果は低確度として扱う。

**混同防止**

- bodyboardにもbat tailがあるが幾何・機能文脈が異なるため混ぜない。

### 1.10 Wing / Winger / Bump（ウィング／ウィンガー／バンプ）

**幾何定義・識別**

- **末端tail shapeそのものではなく、フィン付近／tail手前のrail outlineに設ける段差または急な幅減少。** その後にswallow、round、pin等の実際のtailを接続する修飾子。
- `wing tail`という口語があるが、CAD構造は `tail.baseShape + wings[]` とする。片側1段/両側、single/double wing、角張ったwing/滑らかなbumpをパラメータ化。

**性能傾向**

- 前方の幅広い／直線的なoutlineから、狭いtailへ急に移行できる。段差がrelease/pivot pointとなり、広いtail設計にhold/controlを加え、後部の有効レールやturn radiusを変える。
- wing付きswallowを別の末端分類にすると解釈を誤る。Surfing Wavesの比較図は「左図は依然swallowで、wingも備える」と明記。

## 2. 追加派生（実装候補）

- **Rounded square**: 直線pod＋丸い2角。squashと別presetまたはcornerRadius差。
- **Mini/Baby swallow**: swallow depthの小さい派生。大波用にも使われ、fishと同義にしない。
- **Crescent / Moon**: 中央から半円を一つ切り取り、レール端に2点を作る「bite-mark」。V字swallowとの違いは切欠きが円弧。
- **Asymmetrical**: 左右に異なるtail/rail templateを合成する構成方式で、単一の末端形状名ではない。

## 3. CAD向けトポロジー／判定案

|形状|後端の極値/角|中央形状|レール連続性|主要パラメータ|
|---|---:|---|---|---|
|square|左右2角|直線block|連続、末端角で終了|podWidth, cornerRadius≈0|
|rounded square|左右2つの丸角|直線block|連続|podWidth, cornerRadius|
|squash|左右曲率変化|浅い凸弧|連続|podWidth, endArcBulge, cornerRadius|
|round/thumb|硬角なし|幅広い凸弧|完全連続|roundness, pullInStart|
|round pin|硬角なし|小半径の丸い単一tip|完全連続|tipRadius, pullInStart|
|pin|単一鋭点|単一tip|完全連続|tipRadius≈0, pullInStart|
|swallow|外側2tip＋中央凹apex|V字凹切欠き|tipで角|depth, tipSpacing, notchCurvature|
|fish|swallowと同じ|深いV/曲線凹|長く直線的|大tipSpacing, 大depth|
|diamond|前方左右角＋中央凸tip|後方へ凸|railは前方角で終了|shoulderPosition, tipExtension|
|bat/star|外2tip＋中央凸tip|左右2つの凹弧|3点|centerTip, lobeDepth, tipSpacing|
|wing|tailとは別|該当なし|tail手前に段差|count, position, inset, sharpness|

**最少CP設計への示唆**

- 形状名をCP数に直結させず、トポロジー上必要な「角・tip・notch apex・wing」だけを必須anchorにする。
- round系は中央tipをCPとして見せる必要はなく、左右対称の連続Bezierで表現可能。ただし末端曲率をユーザーが調整するCP/handleは残す。
- square/squashは左右corner、swallowは左右tip＋中央apex、diamondは左右shoulder＋中央tip、batは外tip2＋中央tip（および各凹弧の曲率handle）が意味的な制御点。
- wingはtailセクション内部に埋めず、rail modifierとして接続点を独立保持する。

## 4. 画像掲載ページ（転載せず参照）

1. **Greenlight Surf Co. – Surfboard Tail Design Guide**  
   https://greenlightsurfsupply.com/pages/surfboard-tail-design-greenlight-surfboard-design-guide  
   比較図1: round / square / squash。比較図2: pin / round / rounded pin。比較図3: bat / swallow / moon / diamond。さらにfishのswallow depth図があり、CAD分類に最も有用。
2. **Boardcave – Surfboard Tail Shapes**  
   https://www.boardcave.com/information/surfboard-tail-shapes  
   square, squash, round, swallowの実ボード／切抜き画像と主要形状一覧図。基本形の外観確認向け。
3. **Surfing Waves – Surfboard Tail Shapes**  
   https://imgcdn.surfing-waves.com/board/tail_shape.htm  
   squash, square, thumb, rounded pin, pin, baby swallow, swallow, batの統一された輪郭図。wing付きswallow図はwingが末端形状でなくrailのbumpであることを視覚的に示す。
4. **SurfScience – Basic Tail Shapes**  
   https://surfscience.com/topics/surfboard-anatomy/tail/basic-tail-shapes  
   pin, round, squash, swallow, squareの各写真／図と説明。swallowを「2つの小pintailを並べた形」と示す。
5. **Harbour Surfboards – Tail Shape**  
   https://www.harboursurfboards.com/design-2-1  
   著名ロングボードメーカーによるdiamond, square, pin, swallow/fish, squashの実例写真と設計者視点の説明。
6. **Boardcave – Tails, Rails and Noses**  
   https://www.boardcave.com/the-surfers-corner/cat/news/post/surfboard-shapes-tails-rails-and-noses  
   common tail comparison図と実ボード写真。基本名称の横断確認向け。

## 5. 出典と信頼度

### 優先資料（設計・シェイプ専門）

- Greenlight Surf Supply, “Surfboard Tail Design – Design Guide”  
  https://greenlightsurfsupply.com/pages/surfboard-tail-design-greenlight-surfboard-design-guide  
  信頼度: 高。rail line、面積、有効rail、foil/rockerとの相互作用まで説明。
- Harbour Surfboards, “Tail Shape”  
  https://www.harboursurfboards.com/design-2-1  
  信頼度: 高。老舗シェイパー/メーカーの実務的説明。diamondのrelease pointとrail lengthの説明が重要。
- Degree 33 Surfboards, “Surfboard Tail Shapes Basics”  
  https://www.degree33surfboards.com/blogs/guest-blogger-series/surfboard-tail-shapes-basics-what-are-they-and-how-do-they-work  
  信頼度: 中〜高。メーカー資料。swallow/fishの呼称混同を明記。
- Surfline, “The History and Functionality of Tails”  
  https://www.surfline.com/surf-news/history-functionality-tails/87592  
  信頼度: 高。専門メディア。diamondをround pinとsquashのblend、batをsquash/diamond末端の反転として説明。ページ取得障害のため検索スニペットで補助利用。

### 比較・画像資料

- Boardcave, “Surfboard Tail Shapes”  
  https://www.boardcave.com/information/surfboard-tail-shapes
- SurfScience, “Basic Tail Shapes”  
  https://surfscience.com/topics/surfboard-anatomy/tail/basic-tail-shapes
- Surfing Waves, “Surfboard Tail Shapes”  
  https://imgcdn.surfing-waves.com/board/tail_shape.htm
- The Surfing Handbook, “Surfboard Tail Shapes”  
  https://www.surfinghandbook.com/surfboard-tail-shapes/  
  Rusty Preisendorferの「angular tail→angular turn」という見解を引用し、bat/star等も掲載。二次資料なので補助扱い。

## 6. 実装上避けるべき誤解

1. `fish`をswallowと無関係な輪郭として描かない。形状パラメータ上はdeep/wide swallowで、ボードカテゴリは別属性。
2. `wing`をtail endの選択肢にしない。レール／outline modifierであり、wing + swallow、wing + round pin等が成立する。
3. `round`と`round pin`を同一presetにしない。引込み開始位置・末端幅・tip半径が異なる。
4. `diamond`をV字の凹切欠きにしない。中央点は後方へ凸であり、swallowと逆。
5. `bat`を単なるdiamond aliasにしない。輪郭上は中央tipの左右に2つの凹cutawayを持つ。ただし性能差の断定は避ける。
6. `squash`を単なる半円tailにしない。square系の幅と角の名残、浅いpod arcを持つ。
7. 性能ラベルをtail名だけから確定しない。少なくともtail幅/面積、rocker、rail、foil、bottom、finとの組合せで評価する。

