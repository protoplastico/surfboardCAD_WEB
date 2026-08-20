# 非対称サーフボード設計調査

調査日: 2026-08-12

## 0. 基本概念

- asymmetrical surfboardはstringer左右でoutline、effective rail length、tail、rail profile、rocker、bottom contour、fin placement/数等を意図的に変える。
- 根拠はright/left waveではなく、surferの**toe-sideとheel-sideの身体力学が異なる**こと。boardはregular/goofy専用になり得る。
- frontside/backsideはwave進行との関係で波ごとに変わるが、toe/heel sideはstanceに固定。データモデルをfront/backsideで保存しない。
- Carl Ekstromが1960年代に開発し1967年patent。現代ではRyan Burch、Donald Brink、Ryan Lovelace、Tim Stafford等が展開。

## 1. Stance mapping

推奨座標: nose方向を+X、deckから見てsurfer進行方向右を+Y、left rail=-Y。

- **regular (left foot forward):** 通常toe-side=+Y/right rail、heel-side=-Y/left rail。
- **goofy (right foot forward):** toe-side=-Y/left rail、heel-side=+Y/right rail。
- ただしfront foot angle/stanceが個人で異なるため、UIでstanding silhouetteを表示しuser confirmation。自動hardcodeだけに依存しない。
- boardをbottom viewで表示するとvisual left/rightが反転する。保存はboard-fixed座標、表示labelをview変換。
- switch stanceでは役割が逆転するため、dedicated asymはswitch performanceを妥協し得る。

## 2. Toe-side / heel-sideの一般傾向

多くの現代asym資料:

- **toe side:** ankle/kneeで細かくpressureを掛けやすいため、長くstraightなrail、fish/swallow系、low rocker、keel/single等でdrive/down-line speedを活かす。
- **heel side:** heel leverage/ankle rangeの違いを補うため、shorter effective rail、curvier/pulled-in round tail、more tail rocker/vee、前寄りfinまたは複数finでpivot/controlを助ける。

これは普遍規則ではない。Ryan Burch used-board資料にはtoe/heel labelがorientationにより逆に読まれる例もあり、shaperの狙い・surfer mechanicsで入替可能。CAD presetはrole名ではなく各sideのactual geometryを真値にする。

## 3. Asymmetric outline / tail

- heel-side tail corner/release pointを前へ置きeffective railを短縮、curveを増してtight arc。
- toe-sideはrailを長くstraightにし、wide swallow/fish half等でplaning/drive。
- left half squash + right half round/pin/swallowなど異なるtail topologyをcenterlineで合成可能。
- center tail tip/notchを共有しない完全offset tailもある。overall length、left/right rail length、各tail endpointを別測定。
- join at nose/stringer/tailは3D fairnessを検証。意図的asymと製造wobbleを区別するdesign metadataが必要。

## 4. Asymmetric rails

- sideごとにrail volume、apex、tuck、edge hardnessを変えられる。
- heel側をthin/low/curvyにして沈めやすくする設計、逆にfullerにしてheel pressureでbogしないようsupportする設計の両思想がある。目的とsurfer weightを保存。
- rail foil transition stationも左右独立。ただしnoseの共通entryへ急に収束させずG2/fairness確認。

## 5. Asymmetric rocker / bottom

- left/right rail rockerを変える“corkscrew/twist” surface、heel側tail rocker増、heel側vee/concave等が可能。
- center stringer rocker1本では再現不能。left/right rail rocker、複数bottom longitudinal curvesとsurface twistを保持。
- twistが意図的でもdeck stance plane、fin box local normal、manufacturing blank/CNC constraintsへ影響。
- asym bottom contourはflowがturn中に斜めなので、単純にhalf shapesをcenterlineでG0接続せずsmooth saddle/blend。

## 6. Asymmetric fins

- toe sideにlong-base keel/single 1枚、heel sideに2 fins/quad halfというRyan Burchの代表構成。toe側drive、heel側predictability/tighter turnを狙う。
- Carl Ekstromはsideごとtoe-inを変え、front/drive側keelのtoeを少なくする例を説明。
- heel-side finを前へ置けばpivot、toe-sideを後ろへ置けばdriveという一般傾向が紹介されるが、outline/tail/back footとのcluster設計が先。
- left/rightでfin count/template/foil/toe/cant/positionを完全独立保存。mirror validationをasym modeではwarningにしない。

## 7. Frontside/backsideとの関係

- regular surferがright waveを走る時は一般にfrontside、left waveはbackside。goofyは逆。
- しかしboardの同じtoe rail/heel railがturn phaseによってinside/outside railになる。`frontside tail`という固定形状名は曖昧。
- design intentは `toeSideDrive`, `heelSidePivot`等のbody-centric roles、wave direction preferenceは別metadata。

## 8. 左右データモデル

```json
{
  "coordinateSystem":{"x":"tail_to_nose","y":"board_right","view":"deck"},
  "stance":{"type":"regular","toeSide":"right","confirmed":true,"switchUse":false},
  "sides":{
    "left":{"bodyRole":"heel","outline":{},"rail":{},"railRocker":{},"bottom":{},"tailHalf":{},"fins":[]},
    "right":{"bodyRole":"toe","outline":{},"rail":{},"railRocker":{},"bottom":{},"tailHalf":{},"fins":[]}
  },
  "shared":{"centerRocker":{},"noseJoin":{},"volume":0}
}
```

- `left/right`をgeometry key、`toe/heel`はstanceからderive。stance変更でgeometryを自動mirrorするかroleだけ再assignするかuser選択。
- symmetric modeはright=mirror(left) constraint。asym解除時にどちらをmasterにするか確認。
- dimensions: left/right half-width stations、rail arc/effective length、tail endpoints、rail rocker、side volume centroid、fin cluster。
- whole-board center of volume/massがY方向へshiftし得るので`centroidY`表示。
- manufacturing exportにdeck/bottom view、stance arrow、toe/heel labelsを焼き込み、反転製造を防止。

## 9. UI / validation

- deck silhouetteにregular/goofy feetを表示しtoe/heel railを色分け。
- bottom view切替時もsemantic colorはboard sideに追従し、screen-left labelだけ反転。
- `Mirror geometry`, `Swap stance roles`, `Physically mirror board`を別command。
- comparison overlayでleftをmirrorしてrightとの差（outline, rocker, rail, fins）をheatmap。
- unintended seam/twist、negative thickness、fin-local-bottom cant、centroid shiftを検査。
- performance説明は“典型”とし、side geometryからderive。heel sideは必ずround tail等を強制しない。

## 10. 画像・専門出典

1. SurfScience – Asymmetrical Surfboard Designs  
   https://www.surfscience.com/topics/surfboard-anatomy/tail/asymmetrical-surfboard-designs  
   Carl Ekstrom/Richard Kenvinの写真、Ekstrom一次interview（shorter backside rail、toe-in/rocker差）。
2. Surf Simply – History of Asymmetric Surfboards  
   https://surfsimply.com/magazine/the-history-of-surfboard-design-asymmetric-surfboards  
   EkstromからBurch/Brink/Lovelaceまでの実board歴史画像。
3. Surfd – Tim Stafford interview  
   https://surfd.com/guides/guide-asymmetric-surfboards-interview-tim-stafford  
   asym specialist shaper interview、outline/tail/fin/bottomの実例写真。
4. Volcom – Ryan Burch interview  
   https://staging.volcom.es/blogs/truetothis/ryan-burch-surfboards-asymmetricals-fishes-longboards-mid-lengths-gliders  
   long straight toe-side rail＋single/keel、heel側round tail＋2 finsという一次説明と動画/board画像。
5. Boardcave – Ultimate Guide to Asymmetrical Surfboards  
   https://www.boardcave.com/information/asymmetrical-surfboards  
   heel/toe outline・fin placementの比較画像。二次専門販売資料。
6. Barry Snyder Designs – Asymmetrical Designs  
   https://www.barrysnyderdesigns.com/asymmetrical-designs.html  
   shaperによるstance/foot angleとfin cluster差の説明・board写真。
7. Carl Ekstrom patent/history context (Surf Craft curriculum)  
   https://mingei.cdn.rygn.io/files/Surf-Craft-Curriculum-Guide.pdf?v=1599856954  
   museum education資料のasym design history/画像。

## 11. 注意

1. right/leftとtoe/heelを同じfieldにしない。
2. frontside/backsideを固定board sideにしない。
3. bottom viewで左右を反転して製造しない。
4. outlineだけasymにしfin/rocker/bottomを無検討でmirrorしない。
5. heel=short/roundを普遍規則にしない。
6. stanceを変えた時、role swapとphysical mirrorを混同しない。
7. switch riding/custom resaleの制約をmetadata/UIで明示。

