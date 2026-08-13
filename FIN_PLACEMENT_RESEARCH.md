# Fin Placement Research

## Scope

This note records external reference values for the Web fin presets.

Important internal finding:

- The original Java `BoardFinsDialog` does not contain preset logic.
- It only edits the existing `p50` fin array and `p51` fin type string.
- Therefore, Web fin presets are not a direct migration target from Java code; they must be defined explicitly.

Relevant Java files:

- `BoardCAD.app/Contents/java/app/boardcad/gui/jdk/BoardFinsDialog.java`
- `BoardCAD.app/Contents/java/app/board/readers/BrdReader.java`

## Unit and definition caution

Most shaping guides describe one of the following:

- rear edge of fin box from tail
- shaper dot position
- fin trailing edge / leading edge relation

These are not always the same quantity.

BoardCAD `p50` stores direct board coordinates for:

- side fin rear x/y
- side fin front x/y
- center fin rear/front x
- center depth / side depth / splay

So any imported "industry standard" value must be converted carefully before using it as a preset.

## Higher-confidence reference ranges

### Thruster

Common values repeatedly shown in shaping guides:

- side fin rear mark: `11.5"` to `12"` from tail (`29.2` to `30.5` cm)
- off rail: `1.25"` (`3.18` cm)
- toe-in: `0.25"` (`0.64` cm)
- center fin historical placement: about `8"` from tail in broad summaries, but exact box geometry depends on fin system

Sources:

- AkuShaper fin placement guide hub: <https://help.akushaper.com/article/149-fin-placement-guides>
- Greenlight / AkuShaper guide image summary: `turn8image2`
- Surfboard fin overview: <https://en.wikipedia.org/wiki/Surfboard_fin>

### 2+1 / sidebites

Common values:

- sidebite rear mark: `15"` to `16"` from tail (`38.1` to `40.6` cm)
- off rail: `1.25"` (`3.18` cm)
- toe-in: `0.125"` to `0.1875"` (`0.32` to `0.48` cm)
- center fin starting relation: leading edge of center fin approximately in line with sidebite trailing edge

Sources:

- AkuShaper fin placement guide hub: <https://help.akushaper.com/article/149-fin-placement-guides>
- Greenlight / AkuShaper guide image summary: `turn8image2`

### Quad

Most consistent values found:

- front fin rear mark: `11"` to `12"` from tail (`27.9` to `30.5` cm)
- rear fin rear mark: `6"` to `7"` from tail (`15.2` to `17.8` cm)
- front toe-in: `0.25"` (`0.64` cm)
- rear toe-in: `0.125"` (`0.32` cm)
- front off rail: `1.25"` (`3.18` cm)

Observed wider practice for rear off-rail:

- around `1.75"` (`4.45` cm) on one detailed Swaylocks example

Sources:

- AkuShaper fin placement guide hub: <https://help.akushaper.com/article/149-fin-placement-guides>
- Greenlight FCS II placement note: <https://greenlightsurfsupply.com/products/fcs-ii-fin-box-installation-kit>
- Swaylocks quad example: <https://forum.swaylocks.com/t/quad-fin-position-for-a-hp-longboard/48965>
- Swaylocks quad diagram summary: `turn8image5`

### Single fin

What is well-supported is not a single fixed box location, but tuning behavior:

- start near middle of the box for general use
- move forward for looser turning / smaller waves
- move back for hold / projection / noseriding

Bonzer-specific center-fin guidance is more explicit:

- general start point: `5.75"` from tail (`14.6` cm)

Sources:

- Campbell Bros fin placement: <https://www.bonzer5.com/finplacement>
- Almond longboard fin placement article: <https://www.almondsurfboards.com/blogs/news/where-do-i-put-my-single-fin>
- Freedom Boardsports longboard fin box guide: <https://freedomboardsports.com/blogs/blog/how-to-set-up-your-longboard-fin>

## Medium-confidence reference ranges

### Bonzer 5

Official Campbell Bros guidance clearly supports the center fin:

- center fin start point: `5.75"` from tail (`14.6` cm)

Runner placement was harder to source from primary manufacturer material. Forum examples cluster around:

- rear runners: about `10.75"` to `11"` from tail (`27.3` to `27.9` cm)
- front runners: about `15.5"` to `16"` from tail (`39.4` to `40.6` cm)
- cant: around `18` degrees
- off rail / rail apex distance: about `1.125"` to `1.5"` (`2.86` to `3.81` cm)

These are useful as starting presets, but should be labeled lower confidence than thruster / quad / 2+1.

Sources:

- Campbell Bros fin placement: <https://www.bonzer5.com/finplacement>
- Swaylocks bonzer runner discussion: <https://forum.swaylocks.com/t/bonzer-side-fin-placement/13753>

## Lower-confidence / board-type-dependent

### Twin

This was the least stable category in the source set.

The main problem is that "twin" mixes at least two different families:

- keel fish twin
- modern performance twin

Those families do not share one reliable standard position.

Conclusion:

- Do not force one universal twin preset and call it "industry standard".
- Better options are:
  - split into `twin-fish` and `twin-performance`, or
  - keep the current generic twin preset and mark it as provisional.

Supporting context:

- Futures twin/keel/quad guide: <https://surfontario.ca/blogs/product-journal/future-fins-twin-keel-quad-fin-guide>
- General surfboard fin overview: <https://en.wikipedia.org/wiki/Surfboard_fin>

## Practical implication for BoardCAD Web

The most defensible default presets are:

- `thruster`
- `2plus1`
- `quad`
- `single`

Usable but lower-confidence presets:

- `bonzer`

Split presets that should remain provisional:

- `twin-fish`
- `twin-performance`

## Recommended implementation policy

1. Convert preset inputs to tail-based board coordinates only.
2. Use local width at fin position for off-rail calculation, not a global width fraction.
3. Keep the original Java-compatible `p50` array as the saved geometric source of truth.
4. Store Web-only preset metadata separately, as already done with `p58` to `p61`.
5. Mark twin and bonzer presets in UI or documentation as starting points, not exact standards.

Current Web implementation policy:

- Side-fin `Y` placement is derived from local half-width near the fin station, then inset by `off rail`.
- The fin segment itself carries toe-in geometrically by moving the front point inward by the selected toe offset.
- The stored `Toe-in` value should match the actual segment angle, not an unrelated preset constant.
