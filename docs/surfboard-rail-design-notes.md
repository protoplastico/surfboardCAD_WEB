# Surfboard Rail Design Notes

Source: Greenlight Surf Supply, "Surfboard Rail Design - Greenlight Surfboard Design Guide"
URL: https://greenlightsurfsupply.com/pages/surfboard-rail-design-greenlight-surfboard-design-guide
Reviewed: 2026-07-05

This note is focused on rail geometry and implementation. It should be used with:

- `surfboard-shaping-implementation-notes.md`
- `surfboard-design-performance-notes.md`

## 1. Rail Shape Is A Major Control Surface

The source emphasizes that small changes in rail shape, volume, edge position, and tuck can strongly change board behavior. Rail design is not just visual. It controls how water flows:

- along the rail from nose to tail
- up from the bottom into the rail
- inward from the rail apex toward the stringer/deck side
- off the tail/release edge

Implementation rule:

- Rail settings must not be treated as decoration. They should affect both geometry and future performance indicators.
- Rail shape, rail volume, bottom contour, fin setup, rocker, and intended wave/rider should eventually be evaluated together.

## 2. Hard/Soft Rails And Hard/Soft Edges Are Different Concepts

The source distinguishes:

- hard rail shape vs. soft rail shape
- hard edge vs. soft edge

A rail can have a soft overall rail shape and still contain a release edge. A hard edge releases water and reduces drag. A soft/tucked edge releases only when flow speed is high enough; at lower speed water can continue to wrap around the rail.

Implementation rule:

- Do not store only one `railHardness` value.
- Separate these parameters:
  - `railShapeHardness`: tightness of rail radius / tuck turn
  - `edgeHardness`: actual release edge sharpness
  - `edgePosition`: where the release edge starts and fades along board length
  - `tuckWidth`: bottom-side tucked radius/inset

## 3. Edges And Release

Hard edges let water release cleanly. They reduce drag and help the board plane higher. Extending the edge forward lowers the minimum planing speed. Traditional longboards/noseriders usually avoid hard edges, while performance boards often use them, especially near the tail.

Implementation rule:

- Edge length should be longitudinal, not a cross-section-only setting.
- Suggested fields:

```js
railEdge = {
  hardness: 0.0,              // soft to crisp
  tailStart: 0.0,             // tail referenced
  forwardFadeEnd: 0.0,        // where the edge fades into soft rail
  tuckUnderApex: true,
  releaseScore: 0.0
}
```

## 4. 50/50 Rails

The source defines 50/50 by the rail radius, not by the vertical midpoint between deck and bottom planes.

Important details:

- 50/50 means the apex is at the middle of the rail radius.
- The upper and lower rail curves are nearly symmetrical around the apex.
- This does not require the apex to sit halfway between deck and bottom planes.
- In many boards, the apex can be below the deck/bottom midpoint because the top rail blends into a rising/domed deck while the bottom flows into a flatter bottom.
- In hulls and rolled-bottom longboards, the bottom also blends convexly, so the apex may be closer to the deck/bottom midpoint.
- Soft full 50/50 rails create strong water wrap/control but also drag at higher speeds when no release edge exists.

Implementation rule:

- Current 50/50 code should not calculate apex from `thickness * 0.5`.
- 50/50 should be computed from rail-curve arc/radius balance.
- Validation target:
  - upper rail arc and lower rail arc have similar curvature and length around the apex
  - no bottom release edge unless explicitly added
  - final curve is smooth, not S-shaped or kinked

## 5. Down Rails: 60/40, 70/30, 80/20

Down rails have more rail curve above the apex than below it. The apex is lower. Lowering the apex:

- shortens/tightens the bottom rail curve
- narrows the tuck
- makes the rail shape harder
- increases release from the bottom side
- makes the effective bottom planing surface wider
- usually increases speed/planing but reduces 50/50-style suction/stability

Implementation rule:

- 60/40, 70/30, 80/20 should be represented as curve-ratio systems:

```js
railFoil = {
  upperCurveRatio: 0.6,
  lowerCurveRatio: 0.4,
  apexCurvePosition: 0.6, // curve-relative, not just y
  tuckWidth: number,
  effectiveBottomWidthGain: number
}
```

- Lower apex should also affect effective bottom width metrics.

## 6. Egg, Pinched, And Knifey Rails

The source treats these as volume and shape changes, not only apex changes.

Summary:

- Egg rail: more volume, soft/tapered, round apex, stable and gliding.
- Pinched rail: less volume, often with domed decks, more sensitive, can hold high in steep waves, often used with displacement/hull bottoms.
- Knife rail: very low volume, flattened elliptical profile, strong release, responsive but can catch/bog without speed and suitable rocker/fin setup.

Implementation rule:

- Add rail volume as a separate parameter from rail foil.
- Suggested fields:

```js
railVolume = {
  fullness: 0.0,       // knifey/pinched to full/boxy
  deckDomeDependency: 0.0,
  railThicknessScale: 1.0,
  ellipseFlattening: 0.0
}
```

- Pinched/knifey rails should be allowed to vary by board station. They often should not be applied uniformly through the whole board.

## 7. Chined / Beveled Rails

Chines are flat or nearly flat bevels along the rail. They thin the rail radius and can raise the apex without changing the main bottom/deck contours. They can create release points if edges are hard and crisp, or softer flow if rounded.

Implementation rule:

- Chine should be a separate rail modifier:

```js
railChine = {
  enabled: boolean,
  width: number,
  angle: number,
  edgeHardnessTop: number,
  edgeHardnessBottom: number,
  startFromTail: number,
  endFromTail: number
}
```

- Chine is not the same as 50/50, 60/40, or tuck.

## 8. Rail Foil And Nose-To-Tail Transitions

The source states that rail foil should change smoothly from tail to nose. Abrupt rail volume/apex/edge changes increase drag, except deliberate outline features such as bumps or wings.

Modern performance shortboard pattern described by the source:

- Tail: hard down/nearly square rail with crisp hard untucked edge.
- Around side fins: edge rolls under and becomes a tucked hard-edged down rail.
- Ahead of side fins: hard tucked edge softens over roughly several inches.
- Middle/front: transitions toward soft 60/40 and then 50/50.
- Nose: soft, thin, round radius; may become pinched near the tip.

Implementation rule:

- Rail configuration must be longitudinally interpolated.
- A single global rail preset is insufficient.
- Suggested station model:

```js
railStations = [
  { fromTail: 0, foil: "hard-down", edgeHardness: 1.0, volume: 0.5 },
  { fromTail: sideFinTrailingEdge, foil: "tucked-down", edgeHardness: 0.8, volume: 0.55 },
  { fromTail: sideFinLeadingEdge + fadeLength, foil: "6040", edgeHardness: 0.35, volume: 0.65 },
  { fromTail: widePoint, foil: "6040-soft", edgeHardness: 0.1, volume: 0.75 },
  { fromTail: noseThird, foil: "5050-thin", edgeHardness: 0.0, volume: 0.35 }
]
```

## 9. Rail Channels

Rail channels are usually placed on the deck side where the rail transitions into the deck. The source describes typical sizing around 3/4 to 1 inch wide and about 3/8 inch deep, placed where the rider's thumb naturally falls.

Implementation rule:

- Rail channels should be a deck-side feature, not a bottom channel.
- They should be allowed only after final rail/deck geometry exists.
- Their placement should reference rail distance inward from rail, not stringer distance.

## 10. Rail Band Definitions

The source gives explicit rail-band construction definitions. This is directly relevant to the current implementation.

Definitions:

- `Tuck`: bottom rail radius, measured up from the bottom corner and in from the bottom corner. It is the curve from apex down to where the bottom rail blends into the board bottom.
- `Rail Mark`: mark on the vertical outside face, measured up from the bottom corner. It is tied to where the rail apex is intended.
- `Deck Marks`: marks on the deck, measured inward from the top corner and perpendicular to the rail line.
- `Primary Rail Band`: flat plane connecting Rail Mark to Deck Mark 1.
- `Secondary Rail Band`: flat plane connecting the midpoint of the primary band to Deck Mark 2.
- `Tertiary Rail Band`: flat plane connecting the midpoint of the secondary band to Deck Mark 3.

Critical implementation correction:

- Primary, secondary, and tertiary deck bands do not all terminate at the same rail apex.
- Secondary terminates at the midpoint of primary.
- Tertiary terminates at the midpoint of secondary.
- Therefore the construction graph is recursive:

```text
Deck Mark 1 -> Rail Mark          = primary band
Deck Mark 2 -> midpoint(primary)  = secondary band
Deck Mark 3 -> midpoint(secondary)= tertiary band
```

This matches the user's observation that the most laid-down rail band has a contact point far inward, near the stringer/deck area, not at the rail apex.

## 11. 50/50 Rail Bands Need Bottom-Side Symmetry

The source states that true 50/50 rails require bottom rail bands rather than only a simple curved tuck. For true 50/50, the blank is flipped and similar marks/band patterns are repeated on the bottom.

Implementation rule:

- Current 50/50 implementation should not use only deck bands plus one tuck.
- Add optional mirrored bottom bands for true 50/50:

```js
true5050RailBands = {
  deckBands: [...],
  bottomBands: [...],
  apexCurveBalance: 0.5,
  edgeHardness: 0
}
```

- Longboard 50/50 should use smoother final blending from both deck and bottom sides.

## 12. Egg / Pinched / Knifey Bottom Band Notes

The source provides bottom-band guidance:

- Egg rail: one bottom rail band connecting a rail mark to a bottom mark.
- Pinched/knifey: one bottom rail band with different mark dimensions.

Implementation rule:

- Egg/pinched/knifey should not be generated only by scaling a 50/50 curve.
- They require explicit bottom band construction plus volume reduction.

## 13. Vertical Side Band / Rail Apex Volume

The source states that the remaining vertical surface along the outside rail after tuck and primary band cuts determines much of the rail volume. This band becomes the rail apex after finish shaping. It should be widest at the widepoint and taper smoothly toward nose and tail.

Implementation rule:

- Preserve a `verticalBandWidth` value.
- This should vary by station:

```js
verticalBandWidthAtStation = {
  nose12: small,
  widePoint: max,
  tail12: small
}
```

- If code removes this vertical band too aggressively, it changes rail volume and outline feel.

## 14. Correct Rail Band Construction Algorithm

Recommended implementation model:

```js
function buildRailBandConstruction(section, railConfig) {
  const railMark = findRailMarkOnVerticalSide(section, railConfig);
  const deckMark1 = findDeckMark(section, railConfig.deckMarks[0]);
  const primary = line(deckMark1, railMark);

  const primaryMid = midpoint(primary);
  const deckMark2 = findDeckMark(section, railConfig.deckMarks[1]);
  const secondary = line(deckMark2, primaryMid);

  const secondaryMid = midpoint(secondary);
  const deckMark3 = findDeckMark(section, railConfig.deckMarks[2]);
  const tertiary = line(deckMark3, secondaryMid);

  const tuck = buildBottomTuck(section, railConfig);

  return { primary, secondary, tertiary, tuck };
}
```

For true 50/50:

```js
function buildTrue5050RailBands(section, railConfig) {
  const deckBands = buildDeckRailBands(section, railConfig);
  const bottomBands = buildBottomRailBandsSymmetric(section, railConfig);
  return blendBandsIntoFinishedRail(section, deckBands, bottomBands);
}
```

## 15. Direct Fix For Current BoardCAD Web Rail Band Display

The current rail-band guide should be changed to:

- Primary: `Deck Mark 1 -> Rail Mark`
- Secondary: `Deck Mark 2 -> midpoint(primary)`
- Tertiary: `Deck Mark 3 -> midpoint(secondary)`
- Tuck: independent bottom-side construction

Do not place deck-band endpoints by arbitrary `upperShape` ratios on the final curve.

The `upperShape` ratios can still be useful later for final curve blending, but not as the construction definition of rail bands.

## 16. Sources To Cite In Future Code Comments Or Docs

Use this source for:

- hard edge release behavior
- 50/50 apex definition
- down rail apex/tuck behavior
- egg/pinched/knifey volume distinction
- rail band definitions
- true 50/50 requiring bottom rail bands
- vertical side band / rail apex volume taper
