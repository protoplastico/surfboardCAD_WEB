# Surfboard Bottom Contour Design Notes

Source: Greenlight Surf Supply, "Surfboard Bottom Contour Design - Greenlight Surfboard Design Guide"
URL: https://greenlightsurfsupply.com/pages/surfboard-bottom-contour-design-greenlight-surfboard-design-guide
Reviewed: 2026-07-06

This note extracts implementation rules for BoardCAD Web. It is not a full copy of the source page.

## 1. Core Geometry Rule

Bottom contours are rail-to-rail cross-section features. They are not independent nose-to-tail rocker curves.

Implementation rule:

- The longitudinal rocker remains the base reference.
- Concave, vee, hull, and channel operations should be applied as cross-section deltas at each station.
- A bottom feature may change the apparent rail rocker or stringer rocker, but it should do so as the result of cross-section geometry, not by directly bending the whole board surface.
- Deck-side control points must remain unchanged unless the user explicitly edits deck foil.

## 2. Sign Convention

BoardCAD Web currently treats positive concave depth as removing foam from the bottom side, making the bottom thinner at the target area. In Greenlight's terminology:

- Concave raises the bottom above the rail bottom.
- Convex lowers the bottom below the rail bottom.

Implementation rule:

- Concave features should move the bottom surface toward the deck relative to the rail bottom.
- Convex/hull features should move the center/stringer bottom away from the deck relative to the rail bottom.
- UI labels should keep this clear: concave depth means cut depth, hull/belly depth means convex belly amount.

## 3. Flat Bottom

A flat bottom is flat only rail-to-rail at a given cross section. It still follows rocker from nose to tail.

Implementation rule:

- Flat should be represented as zero bottom-feature delta.
- It should be a valid baseline target for fading other features in and out.

## 4. Single Concave

Single concave changes flow direction by creating a shallow trough parallel to the stringer. It normally starts forward, reaches maximum depth between wide point and fin area, and fades toward flat or vee behind the fin area.

Implementation rule:

- Keep width measured from the stringer, not as a percentage of local outline width only.
- The concave should be a smooth cylindrical or near-cylindrical rail-to-rail trough.
- Width and curvature should remain stable along the active section unless the user intentionally tapers them.
- Start, peak, and end control the longitudinal envelope, not the lateral shape.
- Rail-protection should preserve the rail/tuck region unless the feature intentionally changes rail presentation.

## 5. Double Concave

Double concave is two parallel concaves on either side of the stringer. It often begins where the single concave is deepest and is common through the aft section.

Implementation rule:

- Do not implement double concave as one wide single concave.
- Keep a central stringer reference/ridge.
- Generate two symmetric troughs.
- The troughs may be placed inside an existing single concave when used in single-to-double presets.
- The deepest point should generally be near the rail-fin area, with optional tail fade or tail exit.

## 6. Panel Vee

Panel vee uses flat panels tapering down from the stringer toward the rail edge. It is commonly placed in the back third or front third. Tail vee adds directional stability and rail rocker, but excessive depth can feel sticky.

Implementation rule:

- Default panel vee should be tail-side, from about mid-board to tail.
- The stringer should remain the high center of the vee.
- The bottom should be close to planar from stringer to rail, while preserving rail shape.
- Vee should not default to a nose-to-middle range unless explicitly using a reverse/entry vee mode.

## 7. Spiral Vee

Spiral vee generally starts around the wide point, deepens through the fin area, and continues all the way through the board end.

Implementation rule:

- Default spiral vee should start farther forward than panel vee.
- Peak/max effect should be closer to the tail than panel vee.
- End should reach the tail.
- It should preserve a relatively straighter center stringer aft while adding rail rocker farther forward.

## 8. Rolled Vee

Rolled vee is panel vee with belly/roll added to the panels. It softens the vee peak and softens water release around the bottom rail edge.

Implementation rule:

- Represent as a combination preset: front/mid hull or belly plus aft vee.
- Do not equal-distribute the hull and vee ranges. The hull and vee ranges are design-specific and may overlap.
- For longboard noserider-style use, default the rolled vee portion to the back third.

## 9. Concaved Vee

Concaved vee starts with panel vee, then adds two concaves inside the vee panels.

Implementation rule:

- This should become a dedicated feature or a linked compound preset.
- The intended result is flatter stringer rocker, curvier rail rocker, and harder bottom rail edge.
- It should not be modeled as independent overlapping features if that causes interpolation waves.

## 10. Channels

Channels are wedge-shaped grooves cut into the existing bottom. They direct flow nose-to-tail and add hold/drive, but should not significantly alter rocker.

Implementation rule:

- Channel depth should be local to each groove.
- Channel count, spacing, and offset control lateral placement.
- The longitudinal envelope should fade in/out without changing the underlying rocker.
- Defaults should be tail-side; channels may begin near the middle only when explicitly configured.

## 11. Preset Range Rules

Do not automatically equal-distribute compound presets. Equal distribution is useful for layout cleanup, but it destroys the design meaning of compound bottom contours.

Current preset rules:

- `shortboard-single-to-double`: single concave forward/mid, double concave aft to tail.
- `shortboard-single-to-vee`: single concave forward/mid, vee aft to tail.
- `performance-channel-quad`: single forward/mid, double aft, channels tail-side to tail.
- `longboard-rolled-vee`: belly/hull forward/mid, rolled/panel vee aft to tail.
- `displacement-hull`: convex belly through nose/mid with rail thinning carried aft by dedicated displacement logic.

## 12. Validation Rules

Every bottom-contour change should be checked against these constraints:

- Deck-side spline unchanged.
- Outline width unchanged unless the user edits outline.
- Rail protection unchanged for concave/channel features unless explicitly disabled.
- No Bezier handle reversal or lower-half loop.
- Cross-section interpolation remains smooth after adding sections.
- Toolpath lines do not show periodic longitudinal waves.
- 3D shaded and moire views show continuous surface behavior.
