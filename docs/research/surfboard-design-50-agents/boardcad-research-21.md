# サーフボード・フォイル／厚み分布調査

調査日: 2026-08-12

## 0. 定義

- **primary foil / thickness flow:** nose-to-tailに厚み・断面積・volumeがどう分布するか。side viewではdeck rockerとbottom rockerに囲まれた距離。
- **rail-to-rail foil:** center/stringerからrailへ厚み/volumeが減る横断分布。deck crown/flat/depressed、bottom contour、rail volumeを含む。
- **deck foil:** deck rocker/crown側へfoamをどう残すか。足・胸下volume、railへのfall-offを支配。
- **bottom foil:** bottom rocker/contour側の基準。水に触れる形と、deckとの差としてthicknessを規定。
- `foil`をhydrofoil翼と混同しない。surfboard文脈ではfoam/volume distribution。

## 1. 正しい幾何関係

center thickness `T(x)=Zdeck(x)-Zbottom(x)`。しかし同じT(x)でもdeck crownとrail thicknessが違えばvolume/feelが異なる。

- board volume `V = ∫ crossSectionArea(x) dx`。
- volume centroid/center of buoyancyは最大厚点と必ず一致しない。outline幅と横断面積も必要。
- max width、max center thickness、max cross-section areaは別stationになり得る。
- rockerを変えずdeckだけ削るのか、deckを保ちbottomを削るのかで同じ厚みでもbottom hydrodynamicsが違う。

## 2. Nose-to-tail thickness flow

- 典型的modern boardはthin nose → chest/wide-point付近へsmoothに増厚 → feet間へvolumeをcarry → fins/tailへsmoothに薄くする。
- abrupt lump/flat spotはmass/buoyancy/flexとrail foilを急変させるため、厚み値だけでなく1次・2次連続性が重要。
- Natural Curvesのmodern shortboard説明ではvolume concentrationはnose後方12–15 in付近からrail finsまで、tipは薄い。年代/スタイルでnose対tail厚の優先は変化し、固定比率を普遍化しない。

## 3. Nose thinning / forward volume

- thin noseはswing weightを減らし、duck dive、critical turn、late dropでforward railをengage/releaseしやすい。過薄ならpaddling時に沈み/trackし、強度も減る。
- volume carried forwardは胸下浮力、水平trim、paddle efficiency、early entryを助け、front-foot drive/inertiaを増す。過大ならswing weight、catch、turn initiation resistance。
- `nose volume`はtip thicknessだけでなく前方12–24 inの断面積積分で評価。

## 4. Tail thinning / aft volume

- thin/foiled-out tailとrailは後足で沈めやすく、steep/powerful waveでcontrol、sensitive turn。過薄は低速でsink/stall、drive/support不足、fin box構造制約。
- volume carried through tailは弱波のplaning/support、pump時に押す足場、driveを増す。過大ならcorkyでrail/tail engagementに力が必要、高速control低下。
- single-finはfin box depthがtail thicknessの下限を作る。constructionも幾何制約として保存。

## 5. Thick point / volume distribution

- thick/wide point前寄り: prone chest下にbuoyancy、paddle/trim/drive、front-footed/drawn-out turn。retro single、classic longboard、gun等で一般傾向。
- thick point後寄り: volume/massをfeet間に置き、back-foot pivot/rail-to-rail responseを狙うperformance board。胸下support減でpaddleは難しくなり得る。
- centerだけ厚くrailをthinにするdomed/crowned deckは総volumeとpaddle supportを残しrail engagementを容易にする。
- flat deck/full railはvolumeを横へcarryし足場/planingを増すがrailを沈めにくい。
- concave deckは足位置/leverageを変えるがprimary foilと独立feature。

## 6. 性能

- **Paddling:** total volumeだけでなく胸下位置、waterline/rocker、outline。forward volumeでboard/rider trimを水平に近づけdragを減らし得る。公開研究 “Effect of foil on paddling efficiency in a short surfboard” はCADでnose/tail各0–30.5cm領域を定義し、foil比較を行う稀な資料。
- **Wave catching:** buoyancyとinertia/supportで加速を助けるが、too thick/poor trimはextra wetted/form drag。
- **Turning:** lower rail/tail volumeは沈めやすくresponse、full volumeはpush-back/driveだが力が必要。
- **Flex:** thin foilは一般にflexしやすくresponsiveだが強度低下、thickはstiff/drive。実際はstringer、skin、carbon、core密度が支配するため厚みだけで断定不可。
- **Momentum:** volume自体はmassではない。foam density/laminate一定なら厚いほどmass増傾向だが、浮力分布と慣性を混同しない。

## 7. Measurement stations

Greenlightの代表的定量法:

- noseから12 in、24 in
- wide point / max thickness
- tailから24 in、12 in

caliperでdeck-bottomの垂直/局所規約に従い測る。Greenlightの典型例ではtail側12 inがnose側より1/8–1/4 in厚く、24 inでは1/16–1/8 in厚いが、これは一般的boardの参考範囲でpreset固定値ではない。

より良いCAD/計測:

- 6 in間隔またはnormalized length 0, 10, 20…100%。
- 各stationでcenter thickness、rail thickness、cross-section area、deck/bottom/rail coordinates。
- max厚位置、area centroid、volume centroid、nose/tail 12/24-in volumeを導出。
- caliper方向（vertical Zかbottom normal）をmetadata化。実測比較では同じ規約を使う。

## 8. CADパラメータ

```text
bottomRocker z_b(x)
deckRocker z_d(x)
centerThickness T(x)
crossSectionArea A(x)
railThickness R(x)
deckCrown(x), railFalloff(x)
maxThickness, maxThicknessPosition
volume, volumeCentroidX
noseVolume12/24, tailVolume12/24
```

- bottom rockerをhydrodynamic master curve、T(x)からdeck rockerを生成するmodeと、deck/bottom独立編集modeを用意。
- center thickness splineだけで3D volumeを決めず、section shape/rail foilを連動。
- CPはtip、max-thickness前後、tail thinning開始など意味点に限定し、station measurementはvirtual handles/constraints。
- thickness derivative/curvature plot、lump/negative thickness/min skin/fin-box clearance警告。
- total litersだけでなくvolume distribution graphとcenter of volume表示。
- outline/rockerを変更したら同じT(x)でもvolume/centroidが変わるためlive recompute。

## 9. 俗説・混同

1. center thicknessとlitersは同じ → outline/section shapeが必要。
2. thick boardは必ずpaddles better → volume位置とtrim/rocker依存。
3. volumeはweight/momentum → material densityと別。
4. foilはside profileだけ → rail-to-rail分布も含む。
5. max厚点=浮力中心=wide point →一致するとは限らない。
6. thin tailは常にturns better → speed/wave/surfer力によりstall。
7. tip thickness値だけでnose/tail foilを評価 →領域volumeとflowが重要。

## 10. 画像掲載・出典

1. Natural Curves – Profiles & Foils  
   https://www.naturalcurvesboards.com/html/designhtml/foils.html  
   board class別side foil、rail-to-rail foil、nose-tail volume transitionの専門図。
2. Greenlight – Rocker and Foil Design  
   https://greenlightsurfsupply.com/pages/surfboard-rocker-and-foil-design-greenlight-surfboard-design-guide  
   foil side-view図、12/24-in caliper measurement、thick point位置とperformance説明。
3. Greenlight Building Guide – Shape Rocker and Foil  
   https://greenlightsurfsupply.com/pages/surfboard-building-guide-how-to-shape-surf-board  
   blankからnose/tailをthinしfoilする工程写真。
4. OpenShaper Design Guide  
   https://openshaper.com/surfboard-design-guide/  
   deck/bottom rocker間のfoil編集、volume-distribution curveとcenter-of-massのCAD画像。
5. Rusty Surfboards – Board Fundamentals  
   https://rustysurfboards.com/pages/board-fundamentals  
   著名メーカーによるfoilのnose-tail/deck-bottom定義。
6. Nessler et al., “The effect of foil on paddling efficiency in a short surfboard”  
   https://www.csusm.edu/surfresearch/documents/nessler-sports-eng-2017.pdf  
   nose/tailを各0–30.5cmとしてCAD foilとpaddlingを比較する研究。個別条件の結果を全boardへ一般化しない。
7. Harbour Surfboards – Design + Construction  
   https://www.harboursurfboards.com/surfboard-construction  
   老舗シェイパーによるfoil、nose/tail thickness、swing weight/controlの説明。

