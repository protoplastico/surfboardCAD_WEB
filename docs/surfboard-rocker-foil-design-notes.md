# Surfboard Rocker And Foil Design Notes

Source: Greenlight Surf Supply, "Surfboard Rocker and Foil Design - Greenlight Surfboard Design Guide"
URL: https://greenlightsurfsupply.com/pages/surfboard-rocker-and-foil-design-greenlight-surfboard-design-guide
Reviewed: 2026-07-06

This note extracts implementation rules for BoardCAD Web. It is not a full copy of the source page.

## 1. Separate Rocker, Foil, Rail Rocker, And Bottom Contours

The implementation must keep four related but different concepts separate:

- Bottom rocker: the nose-to-tail curve of the bottom along the stringer.
- Deck rocker / foil: the nose-to-tail deck curve and the resulting thickness flow.
- Rail rocker: the nose-to-tail curve of the rail apex.
- Bottom contour: rail-to-rail modifications such as concave, vee, hull, and channels.

Implementation rules:

- `board.bottom` remains the base bottom-rocker spline.
- `board.deck` remains the deck/foil spline.
- Bottom contours must not directly rewrite `board.bottom` unless the user explicitly bakes them into the profile.
- Rail rocker is derived from outline, rail apex, rail shape, and bottom contours. It should be measured and displayed, not treated as identical to bottom rocker.
- Deck foil must not be silently changed by bottom rocker edits unless the user chooses a "preserve thickness / move deck with rocker" mode.

## 2. Measurements And Stations

Rocker and foil need station-based inspection, not only endpoint numbers.

Important stations:

- nose endpoint
- 12 inches from nose: 30.48 cm
- 24 inches from nose: 60.96 cm
- wide point / thick point
- rocker apex or lowest reference point
- center
- 24 inches from tail: 60.96 cm from tail
- 12 inches from tail: 30.48 cm from tail
- tail endpoint

Implementation rules:

- The profile view should show these stations as optional guide lines.
- Measurement output should report bottom rocker, deck height, and thickness at the same stations.
- Tail-referenced and nose-referenced labels must be explicit because fins, wings, bottom ranges, and rocker measurements use different practical reference points.

## 3. Performance Rules From Rocker

Rocker cannot be reduced to "more is better" or "less is faster." It changes the balance between lift, drag, control, paddling, and turn radius.

Implementation rules:

- Increased entry rocker creates more lift at planing speed, but more drag at paddling and low speed.
- Relaxed rocker reduces drag, paddles and catches waves earlier, and increases drive/projection, but gives a wider turning radius.
- More highly rockered boards can turn tighter, but generally require more speed and create more drag.
- Tail kick increases control and suction/hold near the tail, but can add turbulence and drag.
- The first 20-30% of board length should be treated as the entry-rocker zone.
- The back third should be treated as the tail-rocker / kick zone.

## 4. Continuous Versus Staged Rocker

Two core rocker families should be implemented first.

Continuous rocker:

- Smooth, gently accelerating curve from nose to tail.
- No deliberate flat spots.
- Predictable water flow and smooth weight shifts.
- Good default for general-purpose boards and guns when abrupt transitions must be avoided.

Staged rocker:

- Flatter middle section.
- Accelerated nose flip in the last 12-18 inches or broader nose zone.
- Tail kick in the last several inches or tail third.
- More down-the-line projection from the flat middle, but transitions must be blended to avoid turbulence and drag.

Implementation rules:

- A staged rocker preset must not create C0/C1 discontinuities.
- It may contain flatter middle curvature, but curvature transitions must be smoothed.
- The UI should show curvature combs because equal endpoint rocker can still produce very different curves.

## 5. Preset Set

Initial rocker presets should be limited to a small, testable set:

1. `continuous-neutral`
   - Balanced curve.
   - Preserve existing board character as much as possible.

2. `relaxed-drive`
   - Lower entry and lower tail curve.
   - Flatter middle.
   - Intended for paddle speed, glide, drive, and projection.

3. `performance-curve`
   - More entry rocker and more tail kick.
   - Intended for tighter turns and steeper wave control.

4. `staged-speed`
   - Flat middle with blended nose flip and tail kick.
   - Intended for down-the-line speed with controlled transitions.

5. `fish-retro-flat`
   - Relaxed entry and middle, modest tail rocker.
   - Intended for short, wide boards where speed and glide are prioritized.

6. `gun-continuous`
   - Longer continuous curve with increased entry.
   - No abrupt flat spots.
   - Intended for control on steeper or faster waves.

7. `longboard-glide`
   - Relaxed middle with controlled tail kick.
   - Should later combine with noserider-specific bottom features when needed.

These presets are starting points. They should be adjusted by board length, board type, existing spline shape, and user edits.

## 6. Parameter Model

Recommended data structure:

```js
rockerConfig = {
  preset: "custom",
  enabled: false,
  noseRocker: 0,
  tailRocker: 0,
  entryLengthRatio: 0.25,
  entryLift: 0,
  middleFlatness: 0,
  tailKickLengthRatio: 0.25,
  tailKick: 0,
  apexShift: 0,
  blend: 1,
  preserveFoil: true,
  preserveDeck: false
}
```

Notes:

- Store actual values in centimeters, matching current BoardCAD Web geometry.
- UI may show mm for small deltas.
- `preserveFoil` means deck follows bottom enough to preserve thickness distribution.
- `preserveDeck` means deck stays fixed and thickness changes; this should be explicit because it changes volume and flex.
- `apexShift` moves the lowest/rocker-reference zone noseward or tailward without forcing a kink.

## 7. Algorithm Direction

The rocker generator should not simply move existing control points independently.

Recommended approach:

1. Sample the current bottom spline at fixed normalized stations.
2. Derive current endpoint rocker, apex position, curvature, and thickness stations.
3. Build a target rocker delta curve from a small number of smooth basis functions:
   - entry curve
   - middle flattening curve
   - tail kick curve
4. Apply the target delta to the bottom spline through fitting, not point-by-point dragging.
5. If `preserveFoil` is enabled, apply a related delta to the deck spline to preserve thickness.
6. Refit to a small number of Bezier knots and preserve editable control-point count where practical.
7. Validate no local reversal, no abrupt tangent break, and no curvature spike.

Recommended basis:

- Use cubic or quintic smoothstep envelopes for each zone.
- Use least-squares or constrained Bezier fitting to map sampled deltas back to knots.
- Keep endpoint and tangent constraints explicit.
- Avoid adding dense knots unless the user asks to bake high-resolution geometry.

## 8. Validation Rules

Every rocker preset or edit must pass these checks:

- Bottom rocker remains monotonic in x.
- No local loop or handle reversal.
- No unintended deck movement when `preserveDeck` is active.
- No unintended thickness loss/gain when `preserveFoil` is active.
- Curvature comb has no isolated spike.
- Nose and tail endpoint rocker match requested values within tolerance.
- Rocker at 12" and 24" stations is reported before/after.
- Existing bottom features still fade smoothly into the modified rocker.
- 3D model and toolpath views do not show periodic longitudinal waves.

## 9. UI Direction

The Rocker panel should be separate from Bottom and Rail.

Minimum controls:

- Rocker preset
- Nose rocker
- Tail rocker
- Entry zone length
- Entry rocker amount
- Middle flatness
- Tail kick length
- Tail kick amount
- Apex shift
- Blend / smoothness
- Preserve foil / preserve deck toggle
- Preview / Apply / Reset

Recommended display:

- Profile view overlay for original bottom/deck and preview bottom/deck.
- Curvature comb toggle on by default while editing rocker.
- Measurement table for 12"/24"/center/wide-point/tail/nose stations.
- Warning if transition curvature exceeds threshold.

## 10. Export And Compatibility

Existing `.brd` files store profile as p33/p34 splines. Rocker presets are a BoardCAD Web extension.

Implementation rules:

- Add extension fields for rocker preset and rocker parameters.
- When exporting to legacy-compatible `.brd`, bake rocker into p33/p34 splines.
- When saving BoardCAD Web extended data, preserve the parametric rocker config so the user can continue editing.
- `.pfl` export should use the baked/preview-resolved bottom and deck profile.

Recommended field allocation after current custom fields:

- `p89`: rocker preset key
- `p90`: serialized rocker config

## 11. Immediate Implementation Order

1. Add rocker config parse/serialize with no geometry changes.
2. Add profile measurement helpers and tests.
3. Add preview-only target rocker curve generation.
4. Add profile overlay and station measurement display.
5. Add controlled bake-to-profile operation.
6. Add presets one by one, starting with `continuous-neutral` and `staged-speed`.

Do not implement all presets at once. The rocker surface should be validated after each preset with profile, 3D, and toolpath views.
