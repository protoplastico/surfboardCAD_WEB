# サーフボード・ロッカー性能調査

調査日: 2026-08-12

## 0. 定義と重要原則

- rockerはside viewでの長手曲線。最低でも `bottom/stringer rocker`, `deck rocker`, 左右`rail rocker`を分離する。deck-bottom差がfoil/thickness。
- nose/entry、center/planing、tail/exitは別々に曲率を持ち、連続またはstaged/kickでblendされる。
- 「rocker量」はtip liftだけで表せない。同じnose/tail高さでも曲率分布、開始位置、中央flat長が違えば性能が違う。
- GreenlightとCFD研究に共通する基本は、曲率/迎角が水を下へredirectしてliftを増す一方dragも増すこと。速度・trim姿勢・wetted lengthで作用部が変わる。

## 1. Paddling / wave entry

- relaxed/low center-entry rockerは水を押し上げる曲率が少なくdragが小さいため、一般にpaddle speedを得やすく早いtakeoff。長い有効planing/wetted surfaceを持つ。
- heavy rockerは低速で大きなliftと同時にdragを作り、同じsurfer/volumeなら加速により力が必要でtakeoffが遅れやすい。
- ただしpaddlingはvolume/foil、length/width、surfer前後位置で強く変わる。rockerだけから「paddles fast」を断定不可。高rockerでも正しいtrimでnoseを水から外せる場合がある。
- waveがboardを加速しplaningするとentry rockerはほぼ水から出て、center〜aftの緩いcurveが主なlift/drag源へ移る。

## 2. Nose / entry rocker

- nose tip〜前方1/3のrise/curve。増やすとsteep drop/chopでnose/forward railを水面上へ逃がし、pearling/catchの余裕を増す。
- 過大または早く始まるentry rockerはpaddling時に水を押し、frontal/spray drag、短いwaterlineを生みやすい。
- nose flip（最後の短区間だけ強いkick）はcenter planing lineをflatに保ちながらtip保険を加えるが、curve breakが急ならslap/drag。
- pearlingはrockerだけでなくnose width/volume、takeoff angle、surfer位置、wave steepness、length。`more nose rocker = pearlingしない`は誤り。
- Harbourはnose rocker減少時にnose widthを増す傾向を基本則としており、width/areaのliftとrockerをセットで調整する。

## 3. Center / planing rocker

- planing時に主として接水する中央の緩い曲率。flat/relaxedならlow drag、drive、trim/down-the-line speed、weak-wave glideに有利。
- 曲率が強いと底面法線が多方向を向きliftとdragを増し、wetted lengthを短くして回転しやすくするが、速度に乗るまでenergyを要する。
- flat spotは意図的ならspeed zone、接続が不連続ならstiff/catchy。curve fairnessと前後transitionが重要。
- continuous rockerは予測可能なrail-to-rail/複数turn arc、staged rockerはflat middle＋tail kick等でdriveとpivotを分担するが、名称だけで優劣なし。

## 4. Tail / exit rocker

- aft 12–24 in、特にfin〜tailのcurve/kick。増やすと後足荷重時に短い接水長とcurvier turning surfaceを作り、tight/pivot/vertical turnを助ける。
- tail kickはwaterを下方へdeflectしliftを作る一方、Coanda/pressure/sprayを含むdragを増し、straight-line drive/accelerationを減らし得る。
- low tail rockerはweak surfでspeed/driveを保持するが、wide tailやhard railとの組合せではstiff/trackyになりやすい。
- noseriderではtail kick＋wide tailがdrag/holdを作りtailを沈めnose timeを助ける設計がある。performance shortboardの「dragは悪」という評価をそのまま適用しない。

## 5. Turn radius / hold / speed

- 同じoutline等ならcurvier rockerはwave pocketの曲率へfitし、短いturn radius。flat rockerは長いrail/planeでdrawn-out turnとdrive。
- holdはrocker単体でなくengaged rail rocker、rail edge/volume、fin、tail幅、速度の横力反力。high rockerが自動的にholdを増すわけではない。
- Greenlightはhigh rockerがplane後にwetted areaを減らし得るとするが、それがfriction低下でtop speedを上げるかは議論あり。低速dragとのtradeoffを無視しない。
- CFD比較ではrocker増がliftだけでなくdragとmaneuver時forceも増した。これは定性的支持だが、特定board/waveへの万能係数ではない。

## 6. Rail rockerとの相互作用

- `rail rocker`はbottom rail edgeの長手curve。flat bottomではcenter/stringer rockerと近いが、contourで分離する。
- single concaveはstringer/concave planing rockerを相対的にflattenし、rail rockerを残すため、中央speedとrail turn curveを両立する設計意図。
- vee/convexはstringerをrailより低くし、tail/entry rail rockerを増す。bank時は片側rail/panel rockerが実際のturning surface。
- outline curveとrail rockerは3D rail lineとして連動。side-view rockerだけでturn radiusを予測しない。
- rail rockerのlump/flat spotはrail engagement/releaseを突然変えるため、centerline以上にfairness検査が重要。

## 7. Bottom contourとの相互作用

- concave、vee、bellyは横断形であると同時に各longitudinal rocker lineを変える。
- concave depthを増すとtrough rockerをflat化、rail presentationをdownturnedにする。speed/driveとbiteを得る一方、深すぎるとtrack/jitter/drag。
- veeはrail rockerを増しturnをtightにし得るが、深く長いとdirectional stabilityが増しrail-to-railが逆に重い。
- tail rockerと大面積tailはdrag/suctionを増幅。pulled-in tailやchannel/concaveとの組合せで接水面積が変わる。
- CADでrockerを編集後、bottom contourの「深さ」をworld Z固定すると意図せずrail/trough rockerが変わるため、基準面を明示。

## 8. CAD測定・モデル

- nose tipを0とする高さだけでなく、6/12/18/24 in各station、center、tail側同stationを保存。
- curveを `z(x)`, slope `dz/dx`, curvature `d²z/dx²` で表示し、entry/end of entry/planing zone/tail kick開始を抽出。
- stringer、concave trough、左右rail rockerを同じplotへ重ねる。
- tip-to-tip接線のstraightedge方式か、center tangent基準かでrocker値が変わるため測定基準をmetadata化。
- CPは少数でも曲率plotでG2/fairnessを検証。nose/tail末端CPはtip lift/曲率調整に不可欠なので残す。
- 性能UIは`paddle/low-speed`, `planing trim`, `banked turn`の3状態で相対評価し、wave steepness/chopを入力。

## 9. 俗説注意

1. flat rockerは全条件で速い → 低速/弱波では概ね有利だがhigh-speed chop/steep pocketでcontrol loss。
2. more rockerは遅いだけ → lift、fit、wetted-area、turn forceも変わり、速度域依存。
3. nose rockerだけでpearlingを解決 → width/volume/technique/waveも支配。
4. tail rockerだけでturn radiusが決まる → outline/rail rocker/fin/tail/荷重も必要。
5. tip riseが同じなら同じrocker → 曲率分布が違う。
6. concaveはrockerと独立 → troughとrailのrocker差を作る。

## 10. 画像掲載・出典

1. Greenlight Rocker & Foil Design Guide  
   https://greenlightsurfsupply.com/pages/surfboard-rocker-and-foil-design-greenlight-surfboard-design-guide  
   relaxed vs heavy rocker、takeoff時のlift/drag、planing時wetted area、noserider flow図。専門中核資料。
2. Natural Curves – Surfboard Rockers  
   https://naturalcurvesboards.com/html/designhtml/rocker.html  
   bottom/deck/rail rocker、continuous curve、board class別profileの図。シェイパー専門資料。
3. OpenShaper Design Guide  
   https://openshaper.com/surfboard-design-guide/  
   CADでdeck/bottom rocker CPを編集する画像、continuous/stagedの説明。
4. SurferToday – How rocker affects wave riding  
   https://www.surfertoday.com/surfing/how-does-surfboard-rocker-affect-wave-riding  
   steep waveとnose rockerの写真／概説。補助資料。
5. D. D. Silva et al., “CFD for Surfboards: Comparison between Three Different Designs”  
   https://www.mdpi.com/2504-3900/2/6/309  
   rockerがlift/drag/maneuver forceへ及ぼす数値比較。研究条件内の結果として使用。
6. “Hydrodynamic Characterization of Planing Surfboards Using CFD”  
   https://www.mdpi.com/2504-3900/49/1/68  
   free-surface CFD、drag/lift/pitch equilibriumの方法と限界。

