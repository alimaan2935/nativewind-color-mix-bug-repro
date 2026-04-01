# react-native-css color-mix bug: `bg-black/50` silently fails

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
| `border-white/50` | Semi-transparent white border | Semi-transparent white border |
| `bg-white/50` | Semi-transparent white | Semi-transparent white |
| `border-black/50` | Semi-transparent black border | **Solid black (opacity lost)** |

The bug affects **`black` (`#000`) with any opacity modifier**. `white` (`#fff`) works fine.

## Root cause

Tailwind v4 generates this for `bg-black/50`:

```css
.bg-black\/50 {
  background-color: color-mix(in srgb, #000 50%, transparent);
  @supports (color: color-mix(in lab, red, red)) {
    background-color: color-mix(in oklab, var(--color-black) 50%, transparent);
  }
}
```

`react-native-css`'s `inlineVariables` optimization (enabled by default) replaces
`var(--color-black)` with the raw token value from `--color-black: #000`. After inlining,
the token `#000` arrives in `parseUnparsed` as a raw hash token which is silently dropped
(returns `undefined`), causing `parseColorMix` to bail out.

**Why `white` works but `black` doesn't:** CSS tokenization distinguishes `#000` (all digits
→ token type `"hash"`) from `#fff` (starts with letter → token type `"id-hash"`). These
take different code paths in lightningcss after inlining — `#fff` likely gets re-parsed as
a color while `#000` stays as a raw hash token that `parseUnparsed` cannot handle.

Both `"hash"` and `"id-hash"` are listed in `parseUnparsed`'s unhandled group
(declarations.js lines 844-846), but the inlining pipeline appears to only produce raw hash
tokens for `#000`, not for `#fff`.

## Proposed fix

In `react-native-css/dist/module/compiler/declarations.js`, handle hash tokens in
`parseUnparsed`:

```diff
-        case "hash":
-        case "id-hash":
-        case "unquoted-url":
+        case "hash":
+        case "id-hash":
+          return `#${tokenOrValue.value.value}`;
+        case "unquoted-url":
```

## Workaround

Re-declare `--color-black` in `:root` to prevent inlining (bumps declaration count to 2):

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
