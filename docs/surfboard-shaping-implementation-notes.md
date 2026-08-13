# Surfboard Shaping Implementation Notes

Source: Greenlight Surf Supply, "Greenlight Surfboard Building Guide - How to Shape a Surfboard"
URL: https://greenlightsurfsupply.com/pages/surfboard-building-guide-how-to-shape-surf-board
Reviewed: 2026-07-05

This note summarizes practical surfboard shaping process details that should guide BoardCAD Web implementation. It is not a full copy of the source page. It extracts rules that affect CAD geometry, editing tools, and generated data.

## 1. Manufacturing Order Matters

The practical shaping sequence is:

1. Make or trace the outline template.
2. Transfer the outline to the blank, centered on the stringer.
3. Cut outside the outline and square the rail side vertically.
4. Bring the blank to target thickness.
5. Shape rocker and foil as smooth continuous curves.
6. Shape bottom contours such as concave or vee.
7. Mark and cut rail bands.
8. Blend/screen the rail bands into the final rail curve.
9. Install fin boxes before glassing when using pre-glass systems.

Implementation implication:

- CAD operations should follow the same dependency order. Outline and squared rail side are base geometry. Bottom and rail modifications must not unintentionally move outline width.
- The rail shape is not created directly as one arbitrary curve in the physical process. It is built from measured flat rail bands and then blended into a smooth curve.

## 2. Outline And Template Rules

The source describes outline design using templates, existing-board tracing, CAD templates, or a batten. The batten method uses key points along the straight stringer edge: nose, 12 inches from nose, midpoint, 12 inches from tail, and tail.

Implementation rules:

- Keep a tail/nose reference system explicit. Fin placement is measured from the tail tip, while outline templates are centered on the stringer.
- Useful outline guide stations:
  - nose
  - 12 inches from nose
  - midpoint / wide point
  - 12 inches from tail
  - tail
- The user should be able to inspect and edit these guide stations because they map to real template-making practice.
- Swallow-tail detail can be added after the main rail outline. This supports the current direction of treating tail detail as a later shaping operation rather than always part of the base rail curve.

## 3. Outline Cutting And Vertical Rail Side

After the outline is cut, the rail side is squared to a clean vertical face. The source emphasizes that a true, smooth, square outline side strongly affects the final rail.

Implementation rules:

- The outline curve should be treated as protected geometry during rail shaping.
- Rail shaping may reduce the vertical side band, but should not move the outline curve unless the user explicitly edits the outline.
- A vertical band remains after rail bands are cut. This remaining side band becomes closely related to the rail apex and rail volume.
- When a rail operation changes the outline or rail side unintentionally, that is a geometry bug, not just a visual artifact.

## 4. Thickness, Rocker, And Foil

The source treats rocker and foil as continuous curves, not as isolated numbers. The rocker stick is used to measure key distances, but the desired result is a flowing curve. Deck foil removes foam from nose and tail while preserving the thicker paddling area around the middle.

Implementation rules:

- Rocker and foil controls should favor smooth continuity over exact point forcing.
- Adding guide points should not introduce kinks or local reversals.
- Thickness changes should be separated into:
  - bottom rocker / bottom contour changes
  - deck foil changes
  - rail volume changes
- Bottom feature operations should not move deck-side control points unless the feature explicitly models deck foil.

## 5. Bottom Contours

The source describes concaves as spoon-like forms with start, end, and maximum-depth locations. For a single concave, the deepest line begins at the stringer and fades toward the ends. For double concaves, the process differs: the stringer is not cut in the same way; the two concaves are formed on both sides of the stringer.

Implementation rules:

- A bottom feature should have at least:
  - start position
  - peak / max-effect position
  - end position
  - depth
  - width
  - lateral distribution shape
- Single concave:
  - stringer is the lowest part of the concave
  - depth fades to zero at start and end
  - width should stay geometrically consistent unless explicitly tapered
- Double concave:
  - do not treat it as a simple wider single concave
  - preserve a central ridge/stringer reference
  - create two U-shaped concaves on either side of the stringer
- Vee:
  - should be modeled separately from concave
  - typically changes the bottom angle from center toward rails
  - must preserve rail/outline unless the design intentionally changes rail shape
- Bottom features should be checked with cross-section and longitudinal toolpath views. Any wave pattern after inserting cross sections indicates interpolation inconsistency.

## 6. Rail Bands

The source explains rails as multiple angular cuts called rail bands or bevels. Typically there are two or three deck-side rail bands and one bottom band called the tuck. These flat bands are then blended/screened into the finished rail shape.

Important construction logic:

- Deck rail bands are larger than the bottom tuck.
- The first deck-side band is closer to the rail and steeper.
- The second deck-side band reaches further toward the stringer and is shallower.
- The second band intersects the first band around its midpoint, not at a single shared rail apex.
- A topmost additional band can be added so the rail rolls invisibly into the deck.
- The bottom tuck is a separate bottom-side cut.
- The final rail curve comes from breaking down the hard edges between bands, creating many smaller low-angle bands, then screening into a smooth curve.

Implementation rules:

- Do not draw all deck bands to one common endpoint. Each band should have its own contact point on the pre-existing deck/rail curve or on the previous band.
- The most laid-down deck band should visually extend toward the stringer/deck area. It should not terminate at the rail apex.
- The primary/steep band should approach the rail side closer to the apex.
- Tuck should be modeled as a bottom-side operation, separate from deck rail bands.
- Rail band visualization should show construction planes, not the final screened rail.
- Final rail generation should be a second step:
  1. generate rail band guide/cut geometry
  2. blend/smooth the resulting band corners into the final rail curve

## 7. Rail Volume And Apex

The source notes that the remaining vertical side band after bottom tuck and primary rail band cuts determines much of the rail volume. It should be widest around the wide point and taper smoothly toward nose and tail.

Implementation rules:

- Rail apex / vertical band width should be a longitudinal function.
- Rail volume should taper nose-to-tail instead of being constant at every cross section.
- The rail model should eventually support at least:
  - rail type preset
  - deck mark offsets
  - rail mark height
  - tuck inset
  - vertical band/apex preservation
  - longitudinal taper
- Flat deck and domed deck must be treated differently because they change rail volume.

## 8. Boxy, Knifey, Full, And Pinched Rails

The source distinguishes high-volume boxy rails and low-volume knifey rails. Boxy rails have more buoyancy/resistance when engaged. Knifey rails penetrate the wave face more easily and are common on higher-performance boards.

Implementation rules:

- Rail presets should not be just apex height presets. They should change volume distribution and how the deck rolls into the rail.
- Suggested preset dimensions for future implementation:
  - apex height / rail mark
  - tuck inset
  - first deck band offset
  - second deck band offset
  - optional third deck band offset
  - blend radius / softness
  - final vertical band width
- 50/50 should be generated from a near-balanced finished rail curve, not merely by placing the apex at 50% thickness.
- 60/40 and 80/20 should shift the rail apex and bottom/deck curvature ratio while preserving a smooth non-reversing curve.

## 9. Fin Placement

The source states that fin placement is measured from the tail tip and a distance in from the rail.

Implementation rules:

- Fin layout UI and `.brd` extension data should keep tail-referenced coordinates.
- Store both:
  - distance from tail
  - distance in from rail
- For side fins, toe-in and cant should remain explicit parameters.

## 10. Direct Coding Guidance For BoardCAD Web

Near-term rail implementation:

- Treat rail-band lines as construction guides.
- Align band start points to real deck/bottom curve positions.
- Assign different end/contact points for each deck band.
- Keep tuck as a separate bottom-side band.
- Preserve the original outline/vertical rail side unless the user edits outline width.
- Generate final rail curve by smoothing the banded construction geometry.

Recommended data structure direction:

```js
railConfig = {
  mode: "5050" | "6040" | "8020" | "boxy" | "knifey" | "pinched",
  deckType: "flat" | "domed",
  railMark: number,
  tuckInset: number,
  deckBands: [
    { offsetFromRail: number, contactRatio: number, weight: number },
    { offsetFromRail: number, contactRatio: number, weight: number },
    { offsetFromRail: number, contactRatio: number, weight: number }
  ],
  verticalBandWidth: number,
  blendSoftness: number,
  longitudinalTaper: {
    nose12: number,
    widePoint: number,
    tail12: number
  }
}
```

Recommended algorithm direction:

1. Sample the original cross section.
2. Find outline/rail side/apex reference.
3. Place construction marks:
   - bottom tuck mark
   - rail mark
   - deck band marks
4. Build band planes as line segments with separate contact points.
5. Preserve the vertical rail side width.
6. Convert the banded profile into a smoothed Bezier curve.
7. Validate:
   - no handle reversal
   - no deck-side movement from bottom operations
   - no outline width change
   - no longitudinal wave after section insertion

## 11. Open Questions For Implementation

- Should rail presets store construction bands only, final curve templates only, or both?
- Should final rail smoothing use a geometric blend radius, Bezier fitting, or sampled spline smoothing?
- Should rail volume taper use station-based values at nose 12, wide point, and tail 12?
- Should the UI expose rail bands as draggable construction lines before final smoothing?

Current recommendation:

- Store both construction bands and the final generated curve.
- Let the user inspect and edit rail bands first.
- Generate final curve from bands.
- Keep the original pre-rail section as a recoverable base, similar to the current `railBaseSpline` approach.
