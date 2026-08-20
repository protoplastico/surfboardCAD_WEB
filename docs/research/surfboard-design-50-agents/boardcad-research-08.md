# サーフボード・レール用語／断面分類調査

調査日: 2026-08-12  
対象: surfboard rail の断面幾何とCAD表現

## 0. 最重要の整理

レールを一語のenumで表すと誤る。最低でも次の4軸は独立である。

1. **apex位置**: 断面でストリンガーから最も外側へ張り出す点の高さ。50/50、60/40、80/20、up/downは主にこれを記述。
2. **volume/profile**: full/boxy、medium/egg、pinched/knifeyなど、断面積と曲率／薄さ。
3. **bottom transition (tuck)**: apexからbottom planeへ巻き込む曲線の量・半径・距離。
4. **edge hardness**: 水が離れるbottom側cornerの曲率半径。soft/hardは本来ここを記述できるが、会話ではrail全体の丸さにも使われ混同が多い。

さらにレールはnoseからtailまで一定でなくfoilする。典型的performance boardではnose/entryがthin, round, soft、中央がsoft 50/50〜60/40、fin付近から低いapex＋tucked edge、tailでcrisp hard edgeへ連続遷移する（Greenlight、Natural Curves）。従って1断面の分類を全長に適用しない。

## 1. 断面の基準

- `deck point`: 断面中央のdeck surface基準。
- `bottom point`: 同じstationのbottom surface基準。
- `local thickness T`: deck-bottom間距離。
- `apex`: rail curve上でcenterlineからの横距離が最大となる点。
- `apexHeightNormalized = (apexZ-bottomZ)/T`: bottom=0、deck=1。50/50は概ね0.5、down railほど0へ、up railほど1へ移る。
- `upperCurveLength` / `lowerCurveLength`: apexからdeck側／bottom側へ至る曲線区間。ただし比率名は単純な弧長計測の標準規格ではなく、シェイパーの視覚的分類。
- `edge`: bottom planeとrail/tuckが出会い水をreleaseするcorner。apexと同一点とは限らない。

## 2. 50/50 rail

**正しい幾何**

- apexがrail厚のほぼ中央。deck側とbottom側の曲率が概ね対称で、断面は丸／楕円状。
- true 50/50ではbottom側にも十分なrail band/丸みがあり、通常は明瞭なtucked hard edgeを持たない。

**一般的傾向**

- 水がbottomからapexを回りdeck側へ沿いやすく、railがwave faceへ沈みhold/trim/stabilityを生む一方、clean releaseが少なくdragが増える。classic longboard、noserider、displacement系で典型。

**混同**

- `50/50 = rail volume 50%`ではない。apex/上下curveの配分であり、fullな50/50もpinchedな50/50も作れる。
- `soft full 50/50`はよくある組合せだが、50/50とsoft/fullは同義でない。

## 3. 60/40 rail

**正しい幾何**

- surfboardの一般的用法ではcurveの約60%がapexより上、40%が下、つまりapexが中央より下がったmoderate down rail。Greenlightはこの定義を明記。
- upper curveが長く、bottom curveが短くtightになる。50/50より非対称。

**一般的傾向**

- bottom側radiusが短くなるため50/50よりwater release/lift/responseを増しつつ、丸いupper railのhold/forgivenessを残す。egg、midlength、modern longboard、shortboard中間部など用途は広い。

**混同注意**

- 資料によって「apexが厚さの60%下」と説明するが、座標原点・比の順序が明記されない例がある。bodyboardの60/40比とは定義体系が異なり得る。CAD/UIでは比名だけでなくapex図とnormalized heightを表示する。

## 4. 80/20 / 70/30 rail

**正しい幾何**

- apexがさらにbottom寄り。curveの大部分がapexよりdeck側、短くtightなbottom transitionを持つ強いdown rail。
- 80/20という語だけではedgeの有無／硬さを決めないが、実際にはtuck/hard edgeと組み合わせることが多い。

**一般的傾向**

- bottom側で水を早くreleaseしplaning/lift/acceleration/responseを得やすい。tailへ向かうtransitionで典型。
- 極端なlow apex、厚いvolume、hardnessの組合せでfeelは大幅に変わるため「80/20なら必ずholdが強い」等の断定は不適切。

## 5. Down rail / Turned-down rail

**幾何定義**

- apexが50/50よりbottom側にあり、**apexより上のrail curveが下より長い**総称。60/40〜80/20を含む連続カテゴリ。
- bottom curveが短くtightとなり、tuckedまたはhard edgeを追加しやすい。

**混同**

- `down rail = 80/20`という狭い俗用もあるが、専門資料では50/50より低いapex全般。
- `down`はdeckからbottomへ傾く見た目／apex位置、`hard`はedge半径、`tucked`はbottom側の巻込み。別軸。

## 6. Up rail / Turned-up rail（40/60等）

**幾何定義**

- apexがmidlineよりdeck側にある。bottom側curveが長くdeck側curveが短い、down railの逆。比を同じ規則で書けば40/60等と表す資料がある。
- classic/displacement longboardのnose部などで用語が現れるが、一般現代boardの主要railはneutral〜downが多い。

**一般的傾向／注意**

- bottomがrailへ丸くrollするため水をwrapさせ、displacement/trim/turn-from-tipの性格に関与。noseriding資料にはturned-up railがtipからturnしやすいとの説明がある。
- `upturned rail`をnose rocker（平面全体の上反り）と混同しない。これは横断面のapex/curve配置。

## 7. Full / Boxy rail

**幾何定義**

- rail断面積／volumeが大きく、外側faceが豊かで半径も大きい。Natural Curvesはboxyをfull round railとし、flat〜moderately crowned deckから外側へvolumeを保つ形と説明。
- apex位置は独立。full 50/50、full low/down railの双方が可能。

**一般的傾向**

- 浮力・planing/support・forgivenessを増し、railが沈みにくい。小波用、短いboard、体重/圧力の大きいsurferに用いられることがある。
- 高volumeゆえrail engagementに力が必要で、steep/high-speedでcorky/catchyに感じ得る。

**混同**

- `boxy`は四角いhard edge断面という意味ではない。通常はvolumeのあるround profile。hard/softとは別。

## 8. Egg / Eggy rail

- full/boxyからpinched/knifeへvolumeを減らす系列の中で、Greenlightではeggが3者中もっともvolume大・release小。
- 文字通り卵形の滑らかな断面で、apex位置、tuckは別指定。midlength/egg/retro/longboardで多い。

## 9. Pinched / Knifey / Knife rail

**幾何定義**

- rail断面を薄く絞り、apex付近の外周radiusを小さくした低volume profile。egg → pinched → knifeの順にvolumeが減り、先端が鋭いlens/knife状になる。
- Greenlightではhard edgeなしでもreleaseを操作するprofile系列。pinchedは中間、knifeが最少volume/最多release。

**一般的傾向**

- 少ない浮力でwave faceへ沈めやすく、sensitive/control/holdを得る。過度ならcatch、bog、安定/drive不足になり得る。

**混同**

- `knifey = hard edge`ではない。knife profileのapexが細くても、bottom edgeは連続曲線でsoftな場合がある。
- `low rail`はvolume/厚さが低い意味にもapexが低い意味にも使われるため、CADでは禁止曖昧語または2値を併記。

## 10. Soft rail / Hard rail

### Soft

- edge/cornerの曲率半径が大きく、水がrailを回り込みやすい。断面全体が丸い意味でも俗用される。
- forgiving、smooth、hold/drag寄りの傾向。nose〜middleに一般的。

### Hard

- bottomとrailのjunctionに小さなradiusの明瞭なedge。水流をcleanに切り離すrelease feature。
- lift、speed、projection、crisp responseに寄与し、fin〜tailで一般的。

**重要:** Greenlightは「edgeがsoft」と「rail shapeがsoft」を明示的に区別する。hard railでもupper profileはround/fullになり得る。CADは `edgeRadius` で定量化する。

## 11. Tucked edge / Tucked-under edge

**正しい幾何**

- rounded rail/apexの下側をboard center方向へ巻き込み（tuck）、bottom planeとの間に少し内側へ後退したedgeを設ける。
- Surflineの定義: soft/rounded railのbottomをslightly angled edgeで仕上げ、biteとreleaseを与える。
- `tuckDistance`（apexの最大幅からedgeまでのhorizontal inset）、`tuckRadius`、`edgeRadius`の3値で表す。

**hard tucked edge vs soft tucked edge**

- hard tucked: 小edgeRadiusで明瞭にrelease。
- soft tucked: edge自体は丸く、十分な流速/条件でのみ離れやすい。Greenlightはedge hardnessとtuck位置を別々に扱う。
- tail端ではtuckが減り、edgeがapexに近い`untucked crisp edge`へ移るperformance designも一般的。

**混同**

- tuckは単なるbevel/chine（直線面）と同義でない。滑らかなcurveでもよい。
- hard edgeとtucked edgeを同義にしない。tuck量とedge radiusは独立。

## 12. CADデータモデル案

各length stationで以下を持ち、splineでnose-to-tail補間する。

```text
railSection {
  stationX
  localThickness
  apexHeightNormalized
  railAreaOrVolume
  upperRadius / lowerRadius
  tuckDistance
  tuckRadius
  edgeRadius
  edgeAngle
}
```

導出ラベル:

- apex≈0.5 → 50/50; 低下に応じ60/40, 70/30, 80/20（閾値はpreset依存）。
- large area/radius → full/boxy; small area/sharp lens → pinched/knifey。
- small edgeRadius → hard; large/連続 → soft。
- tuckDistance>0 → tucked under。

**実装上のポイント**

- 50/50などの比を直接vertex比として固定せず、apex位置を編集し比名を表示。
- volumeを増減してもapex位置・edge hardnessを勝手に変えない。
- rail profileの全長transitionを3〜5 station（nose, 1/4, wide point, fins, tail）で設計し、断面間G1/G2連続を確保。
- tail hard edgeを断面上の無限に鋭い角にせず、製造可能な最小radiusを持つ。glass/sanding後のradiusも考慮。
- UIでは断面図にapex、tuck、edgeを別色表示し、用語の曖昧性を回避。

## 13. 画像掲載ページ（転載せず参照）

1. **Greenlight Surf Co. – Surfboard Rail Design Guide**  
   https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide  
   classic longboard 50/50、60/40 egg/down、egg/pinched/knifey比較、tuck/edgeの遷移図、rail band図。最も包括的な専門図解。
2. **Natural Curves Boards – Surfboard Rail Anatomy**  
   https://www.naturalcurvesboards.com/html/designhtml/rails.html  
   apex/profile/tuck/edge/volumeをラベルした断面図、full boxとcrowned、各board classのfoil説明。シェイパーによる専門資料。
3. **SurferToday – The different types of surfboard rails**  
   https://www.surfertoday.com/surfing/the-different-types-of-surfboard-rails  
   50/50、60/40、80/20の統一断面図とtucked-under edge等を掲載。比較確認用の二次資料。
4. **OpenShaper – Surfboard Design Explained**  
   https://openshaper.com/surfboard-design-guide/  
   CAD内のrail cross-section画像。soft/fullとhard tucked-underの視覚差、およびnose-to-tail blendを説明。
5. **Foam Magazine – Soft vs Hard Rails**  
   https://foammagazine.com/surfboard-rails/  
   50/50、60/40、80/20断面比較図。補助資料（比率説明は資料間差があるため図のみ鵜呑みにしない）。

## 14. 優先出典

- Greenlight Surf Supply, “Surfboard Rail Design – Design Guide”  
  https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide  
  信頼度: 高。シェイプ用品専門企業の詳細教材。比率、apex、volume、edge、全長transitionを明確に分離。
- Natural Curves Boards, “Surfboard Design | Surfboard Rails”  
  https://www.naturalcurvesboards.com/html/designhtml/rails.html  
  信頼度: 高。現役設計者によるrail anatomy。断面図が豊富。
- Surfline Gear Glossary, “Tucked Edge”  
  https://www.surfline.com/gear/glossary/glossary_definitions.cfm?id=60424  
  信頼度: 中〜高。専門メディアによる簡潔な定義。
- Surfline, “Longboards”  
  https://www.surfline.com/surf-news/longboards/90533  
  信頼度: 中〜高。modern longboardにおけるdown rail/tucked edgeの歴史的文脈。

## 15. 誤実装チェックリスト

1. 50/50等をfoam volume比として扱っていないか。
2. 60/40の方向を図なしで決めていないか（surfboardでは通常low apex/down）。
3. full/boxyと50/50を同義にしていないか。
4. knifeyとhard edgeを同義にしていないか。
5. down、tuck、hardを単一フラグにまとめていないか。
6. up railとnose rockerを混同していないか。
7. rail断面をnoseからtailまで一定にしていないか。
8. edge CPを消してtuck量／edge radiusが制御不能になっていないか。

