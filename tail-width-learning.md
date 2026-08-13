# Tail Width Learning Notes

Source: `/Users/protoplastico/Desktop/boarddata`

Method:
- Used BRD files whose filenames explicitly contain a tail-related word.
- Parsed each BRD with the current BoardCAD Web parser.
- Sampled tail-side width from `x = 0 cm` and normalized by each board's max width.
- Main metrics are the distance from tail where the outline reaches 50%, 60%, 70%, and 80% of max width.

Important limitation:
- Some legacy BRD fish/swallow files do not encode a true split tail. They may show zero width for the first several centimeters because old BoardCAD could not represent the fish/swallow tail correctly.
- Therefore these numbers are most useful for the relationship between tail length and width growth, not for exact fish/swallow notch geometry.
- Longboards usually have round noses, so their measured full length is already shorter than a comparable point-nose/gun-nose template. Shortboards are usually point-nose boards, so the nose-based shortening is proportionally smaller. This can skew tail metrics that use measured board length as the denominator.
- When nose generation is implemented, tail ratios should also be checked against a virtual point-nose/gun-nose length, not only the current measured board length.
- The reversed-nose-template construction is specific to fish tails. Do not apply it to round tails, round pins, or other ordinary tails.

## Filename-Based Samples

| Tail | n | Median length cm | Median max width cm | x50 | x60 | x70 | x80 | x70/length | w10 | w15 | w20 | w30 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| diamond | 1 | 259.08 | 58.30 | 11.41 | 19.01 | 28.85 | 42.05 | 0.111 | 0.478 | 0.550 | 0.611 | 0.710 |
| fish | 3 | 182.88 | 51.43 | 10.76 | 17.83 | 26.52 | 37.55 | 0.145 | 0.488 | 0.562 | 0.627 | 0.735 |
| gun | 2 | 237.49 | 49.30 | 21.64 | 30.32 | 41.33 | 55.74 | 0.174 | 0.317 | 0.406 | 0.479 | 0.597 |
| pin | 4 | 232.92 | 57.78 | 15.14 | 21.91 | 30.90 | 43.30 | 0.133 | 0.402 | 0.499 | 0.576 | 0.693 |
| round | 2 | 292.61 | 58.22 | 20.15 | 29.57 | 41.83 | 58.34 | 0.143 | 0.351 | 0.432 | 0.498 | 0.604 |

Files used:
- diamond: `joel tudor/8.6diamondtail65L.brd`
- fish: `1template/Fatum/6.0flyingfish32L.brd`, `cooperfish/7.8fatfish80L.brd`, `fatum surf/6.0flyingfish32L.brd`
- gun: `Alex knost BMT/7.9gun32L.brd`, `joel tudor/7.10singlegun48L.brd`
- pin: `Keyo/9.6OalmePin75L.brd`, `almond/7.2pintail.brd`, `armond/7.2pintail.brd`, `john wasley/8.1Midpintail58L.brd`
- round: `1template/Harbour/9.7roundtailMOD77L.brd`, `Habor/9.7roundtailMOD77L.brd`

## Observations

- Width growth order by absolute x70 distance is approximately:
  `fish/diamond < pin < gun/round`.
- For implementation, `x70 / board length` is safer than absolute x70 because the named samples mix shortboards, midlengths, guns, and longboards.
- Approximate x70/length targets:
  - diamond: `0.11`
  - pin: `0.13`
  - fish: `0.145`
  - round: `0.14`
  - gun: `0.17`
- `round` and `gun` keep the tail narrow much longer than the current procedural round preset did in the first comparison.
- `pin` sits between diamond/fish and round/gun.
- `diamond` in the sample is not an extreme short/wide tail; it still reaches 70% width near 29 cm from the tail.
- The current procedural cap-tail implementation does not respond linearly to simple changes in `length`, `tipScale`, and `shoulderScale`. A trial adjustment showed that absolute-centimeter tuning overcorrects shortboards.

## Implementation Consequence

Do not tune `round`, `pin`, or `diamond` only by changing constants in `TAIL_MODE_PRESETS`.

The cap-tail generation should be revised so that each procedural tail can target empirical width-growth landmarks directly, for example:
- `x60`
- `x70`
- `x80`
- optional finite transom width for clipped tails

After that, the table above can be used as the default target set by board length ratio:
- diamond: target x70 around `0.11 * board length`
- pin: target x70 around `0.13 * board length`
- fish: target x70 around `0.145 * board length`, while using the reversed-nose template for the split tail curve
- round: target x70 around `0.14 * board length`, but this must be reached by ordinary tail rounding logic, not by reusing a nose template
- gun: target x70 around `0.17 * board length`
