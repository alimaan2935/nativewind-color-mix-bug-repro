# react-native-css bug: `bg-black/50` silently fails

Minimal repro for a bug where opacity modifiers on `black` silently fail on React Native.

## Setup

```bash
npm install
npx expo start --clear
```

Open on iOS simulator or device.

## Results

| Class | Expected | Actual |
|---|---|---|
| `bg-red-500/50` | Semi-transparent red | Semi-transparent red |
| `bg-black/50` | Semi-transparent black | **No background (dropped)** |
| `bg-black` | Solid black | Solid black |
| `border-black/50` | Semi-transparent black border | **Solid black (opacity lost)** |
| `border-white/50` | Semi-transparent white border | Semi-transparent white border |
| `bg-white/50` | Semi-transparent white | Semi-transparent white |

## Root cause

lightningcss resolves `color-mix(in oklab, #000 50%, transparent)` and produces **`NaN`**
for the oklab `a` and `b` channels. Black in oklab is `[l=0, a=0, b=0]`, but `transparent`
has undefined color channels in CSS. When mixed at zero lightness, the chromaticity channels
become `NaN` (degenerate case).

`parseColor` in `declarations.js` passes these `NaN` coords to `colorjs.io`, which produces
`#NaNNaNNaN80` — an invalid color string that React Native silently discards.

White works because its oklab values are all numeric (`l:1, a:0, b:~5.96e-8`) — lightness
is non-zero, so the chromaticity channels don't degenerate.

### Full chain

1. Tailwind v4 generates `@supports (color: color-mix(in lab, red, red))` override
2. `react-native-css` evaluates `@supports` as TRUE (since PR #208)
3. `inlineVariables` (default) inlines `--color-black: #000` → lightningcss resolves color-mix statically
4. lightningcss produces `{"type":"oklab","l":0,"a":NaN,"b":NaN,"alpha":0.5}`
5. `parseColor` passes NaN to colorjs.io → `#NaNNaNNaN80` → style dropped

## Proposed fix

In `parseColor` (`declarations.js`), guard against `NaN` with `|| 0` for lab/lch/oklab/oklch.
Note: `NaN ?? 0` does NOT work — `NaN` is not nullish. `NaN || 0` is needed.

```diff
     case "oklab":
       color = new Color({
         space: cssColor.type,
-        coords: [cssColor.l, cssColor.a, cssColor.b],
+        coords: [cssColor.l || 0, cssColor.a || 0, cssColor.b || 0],
         alpha: cssColor.alpha
       });
       break;
```

Same for `oklch`, `lab`, and `lch` cases. Verified working in this repro project.

## Workaround

Re-declare `--color-black` in `:root` to prevent `inlineVariables` from inlining it
(bumps declaration count to 2). The runtime color-mix polyfill then handles it instead
of lightningcss's static resolution:

```css
:root {
  --color-black: #000000;
}
```

## Versions

- `react-native-css@3.0.6`
- `nativewind@5.0.0-preview.3`
- `tailwindcss@4.2.2`
- `lightningcss@1.30.1`
- `expo@~55.0.9`
- `react-native@0.83.4`

## Related

- https://github.com/nativewind/react-native-css/issues/207
- https://github.com/nativewind/react-native-css/pull/208
