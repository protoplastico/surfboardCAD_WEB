# サーフボード・フィン構成／配置の基礎調査

調査日: 2026-08-12

## 0. 原則

- 構成名だけで性能は決まらない。位置、cluster spacing、toe、cant、fin area/depth/base/rake/foil/flex、tail/rail/bottomが合成する。
- `5-fin boxes`は通常thrusterまたはquadを選択する互換配置で、5枚同時使用を意味しない。Bonzer 5は5枚同時だが別system。
- 寸法表はstarting point。back foot、board length/tail幅、fin systemのrouter datumで変わる。

## 1. 座標と測定基準

- longitudinal positionはtail tipからfin **trailing-edge/base rear mark**までが伝統的。ただしbox/jigはrouter dot/box centerを使うためdatum metadata必須。
- rail offsetはそのstationのactual railからfin base rear markまで、通常bottom surface上の平面投影。
- **toe-in:** fin chord/box centerlineのnose側がstringerへ向くyaw。角度°または4.5 in基準線に対するoffset（例1/4 in）。測定base lengthが違えば同じinch値でも角度が違う。
- **cant:** bottom local normalからrail側へ傾くroll angle。flat global planeでなくbox位置のlocal bottom/concave panelを基準にするか明記。
- `splay`はcantの同義的俗用、または左右finsの開き全体をいう。CADではcantに統一。

## 2. Single

- stringer上に1枚、通常adjustable longboard box。大きいarea/base/depthでdirectional stability、hold、long arc/trim。
- 前へ動かすとlooser/pivot、後ろへ動かすとhold/drive/track傾向。rake/areaも同時作用。
- longboard、midlength、classic/retro、gun。tail幅/rocker/railがsingle用でないboardへ追加しても同feelにならない。

## 3. Twin / Keel

- 左右rail寄り2枚、centerなし。少ない中央drag、speed/loose/fast rail-to-railだがyaw stability/holdが少ない傾向。
- upright twinはturn/pivot、long-base keelはdrive/down-the-line。Greenlight例: keelsはtailから5–9 in、cant 0–3°、toe 0–1/8 in。general twinはtoe 1/8–3/16、低cant。
- wide swallow/fish、straight rail、low rockerと連動。fin placementはback foot下/やや後ろが基準。

## 4. Thruster

- equal/near-equal side fins 2＋aft center 1のtriangle。twinのspeed/loosenessへcenter stability/pivot/controlを追加しmodern HPSB標準。
- Greenlight typical: side toe 1/4 in@4.5 in、cant 7–9°。big/down-line surfはtoe/cantを減らす。centerはtoe/cant 0。
- 参考配置例: side rear mark tailから約11 in、railから1.25 in、center約3.5 in（Lundquist）。board固有値として扱う。

## 5. Quad

- front/rear rail fins各2、centerなし。rail沿いflow/holdとcenter drag低減、speed/drive/tube line。clusterが広い/後ろならtrackyになり得る。
- frontはthruster sideに近くtoe 1/4、cant 7–9°、rearはtoe 1/8–3/16、cant 3–5°がGreenlight例。rearがdrive/stability。
- rear finがstringer寄りならthruster-like pivot/hold、rail寄りならtwin-like speed/rail driveという設計傾向。
- wide tail/concave/channelとの相互作用が大きい。

## 6. 2+1

- **大きいcenter single fin＋小さいside bites 2枚**。3 equal finsのthrusterと区別。
- singleのtrim/arcへside bite/turn controlを追加。longboard/midlengthに一般的。
- Lundquist HP-longboard参考: center box rear 5.5 in、side bites 15.5 in、rail offset1.25、toe3/16（length/modelでscale）。
- `twin + trailer`（大twin2＋小center trailer）も3枚だが面積支配が逆。データ上別configuration。

## 7. Bonzer 3 / 5

- Campbell Brothers system: 大きいcenter fin＋前方のlow-aspect/high-cant side runners 2（Bonzer3）または4（Bonzer5）。single-to-double Bonzer concavesと一体設計。
- original side finsはtailから10.5–12 in、railから約1.5–1.375 in、center前方のtriangle。5-fin runnersは片側total base約9.75 in、depth最大2.75 inとの一次資料。
- runnersはconcave edgeの延長としてdiagonal flowをtailへredirectする思想。通常side bites/quadと形・cant・bottom連携が違う。
- Bonzerをfin countだけでpreset化しない。専用bottom/channel geometryとfin templatesをbundle。

## 8. Toe / Cantの性能傾向

- toe増: trim時もside fin angle-of-attack/dragを増しturn initiation/pivot、減: down-line speed/drive。左右toe lineを「noseの一点へ収束」で表す方法もあるが、board length依存なので角度保存が安全。
- cant増: bank時finをよりverticalに立てやすくloose/turn/lift、同時にdrag。cant減: drive/stability/speed。
- これらは単調万能でなくfoil、speed、bank、fin flex、bottom local angleでeffective AoAが変わる。

## 9. Tail / rail / bottom相互作用

- finsはback foot/turning zone下に置く。cluster前進=looser、後退=drive/holdの傾向。
- wide tailはfins間隔とleverageを増し、turn開始を制限し得る。narrow tailはclusterも狭くなる。
- side finsはrail engagementを補い、hard tail edgeのclean releaseで失うlateral holdを担う。
- concave/channelのflow directionにtoeを合わせる設計があり、local bottom panelに対するcantを使う。
- veeでは左右boxのlocal normalsが既に傾く。global cantとinstalled jig angleを混同しない。
- tail rockerはfin chordの水へのpresentation/接水深を変える。配置距離だけ移植しない。

## 10. CADデータ

```text
finSetup: single|twin|twin_trailer|thruster|quad|two_plus_one|bonzer3|bonzer5
fin[i]: {
  role, side,
  datumType, xFromTail, yFromStringer, offsetFromRail,
  toeDeg, cantDeg, localBottomNormal,
  base, depth, area, rake, foil, thickness, flex,
  boxType, boxGeometry, adjustmentRange
}
```

- tail tip変更時、`xFromTail`維持かworld位置維持か選択。
- rail outline変更時rail offset constraintを再計算し左右mirror。
- inch toe入力はreferenceLengthも保存しangleへ換算。
- fin-base/boxとbottom surface、deck skin、stringer、channel peakのclearance/干渉チェック。
- 2D marks（rear mark, chord line, router dot）と3D installed finを切替表示。
- configuration presetはfin geometry+bottom/tail compatibility警告を含む。

## 11. 画像・出典

1. Greenlight Fin Design Guide  
   https://greenlightsurfsupply.com/pages/surfboard-fin-design-greenlight-surfboard-design-guide  
   toe/cant図、fin templates、thruster/quad/twin典型値。専門中核資料。
2. Greenlight Fin Placement FAQ  
   https://greenlightsurfsupply.com/pages/how-do-i-figure-out-where-to-put-the-fins-on-my-board  
   back-foot基準、toe/cant、11–12 in placement解説。
3. Greenlight Installation Guide  
   https://greenlightsurfsupply.com/pages/surfboard-building-guide-how-to-shape-surf-board  
   tail/railからのmarking図、box routing動画。
4. Lundquist Placement Reference  
   https://lundquistsurfboards.com/build-guide/fin-placement-guide  
   single/twin/thruster/quad/2+1等の統一diagramとas-marked寸法。個別シェイパー標準。
5. Campbell Brothers Bonzer Mechanics  
   https://www.bonzer5.com/bonzermechanics  
   concaves+runnersのflow図、実board/fin写真、一次設計説明。
6. Campbell Brothers History  
   https://www.bonzer5.com/histories  
   original Bonzer位置/triangle/concaveの歴史写真と寸法。
7. GBox Fin Setup Primer PDF  
   https://gbox-surf.com/resources/pdf-files/gb-hfins-fin-setup-primer-2022-r9-web.pdf  
   cluster/toe/cant/positionの用語図と調整傾向。

## 12. 誤実装チェック

1. 2+1とthruster、twin+trailerを同一にしない。
2. 5 boxesとBonzer5/5枚同時を混同しない。
3. toe inch値にreference base lengthを欠かさない。
4. cantをglobal Zだけで定義せずlocal bottom normalを保持。
5. tail tip/rail変更後にfin constraintsを更新。
6. Bonzerをfinだけ移植せずbottom systemとbundle。
7. 配置表を全長/全tailへ固定適用しない。

