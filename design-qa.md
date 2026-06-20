# Bankroll Lab Design QA

- source visual truth path: `/Users/rafaelteixeira/Documents/Montecarlo - bet/design/reference-panel-control.png`
- implementation screenshot path: `/private/tmp/bankroll-lab-today-viewport.png`
- combined comparison path: `/private/tmp/bankroll-lab-comparison.png`
- viewport: `390 x 844`
- state: dark mode, example dataset, Hoje selected, 7D selected
- rendered URL: `http://127.0.0.1:4173/`
- capture method: Playwright with installed Chrome headless (Browser plugin invocation was unavailable in this session)

## Full-view comparison evidence

The source and implementation were normalized to 390 x 844 and placed side by side in the combined comparison. The implementation preserves the source hierarchy: header/privacy status, three-part financial summary, three supporting metrics, bankroll chart with period control, four analytical metrics, warning treatment and fixed five-item bottom navigation.

## Focused comparison evidence

A separate crop was not needed because the normalized side-by-side image keeps typography, icons, borders and values readable at native viewport size. The following concrete points were checked:

1. Copy: `Hoje`, device-local privacy status, primary metric labels, period labels and navigation labels match the allowed product language.
2. Layout: 16px page gutters, flat bordered surfaces, three-column financial groups and a fixed five-column bottom navigation follow the reference anatomy.
3. Typography: humanist system sans, tabular currency values, uppercase analytical labels and compact secondary text preserve the reference hierarchy while meeting mobile readability needs.
4. Palette: graphite/navy canvas and surfaces, slate borders, cyan selection/chart, green gains and amber warnings match the selected direction.
5. Iconography: consistent Tabler outline icons match the fine-stroke source treatment across header, metrics, alerts, actions and navigation.
6. Chart: the cyan bankroll path, restrained fill, minimal axes and compact period selector match the reference role and density.
7. Responsive behavior: no horizontal overflow or clipped interactive controls at 390 px; touch targets remain at least 44 px.

## Findings

No actionable P0, P1 or P2 mismatch remains.

## Intentional deviations

- The implementation uses larger body text and touch targets than the generated mock. As a result, the alert rows and action buttons continue below the first viewport instead of compressing all content into one screen. This preserves the user's explicit iPhone comfort and readability requirement.
- Dynamic sample values differ where the reference mock was internally inconsistent with the specified formulas, notably `Capital próprio em risco` and sample-size-dependent risk status. The implementation favors the centralized financial rules and real IndexedDB data.
- The settings icon is represented by a shield/privacy action because the first screen's primary secondary action routes to risk rules, matching the product's prudence framing.

## Patches made during QA

- Reworked the mobile summary from a vertical stack to the selected three-column structure.
- Kept all four analytical metrics on one horizontal rail.
- Reduced chart height and header density while keeping labels readable.
- Made the 7D/30D/90D/Tudo selector filter real chart data.
- Added initial chart dimensions and disabled entrance animations for stable first-frame rendering.
- Reset scroll position on bottom-navigation changes.
- Restored exact financial labels such as `Lucro real (líquido)` and `Capital próprio em risco`.

## Interaction and runtime checks

- Onboarding completed with example data.
- Apostas opened and the Nova aposta drawer rendered.
- Simulação ran and returned an explicit success state.
- Regras and Backups opened.
- Service worker became the active controller.
- Reload while offline returned the Hoje screen.
- Browser console contained no errors or warnings.

## Follow-up polish

- P3: test the same viewport on physical Safari/iOS after GitHub Pages publication because safe-area rendering can differ slightly from headless Chrome.

final result: passed
