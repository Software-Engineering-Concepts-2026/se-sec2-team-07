# Responsive audit

Validated in Chrome viewport emulation at 320x850, 768x850, 1024x850 and
844x390 (landscape). Tested authentication and 11 main routes with a saved
deck, long account/deck names and an unbroken long review-card word.

Fixed dashboard overflow at 768px: stacked panels and tablet grids now account
for sidebar width. Hid decorative hero art at intermediate widths, shortened
mobile dock labels and enabled sidebar scrolling on short screens.

Checks: document horizontal overflow, route rendering, screenshots, access to
the last sidebar navigation item, mobile More menu, floating timer pause/resume.
Build and all four responsive cases passed using the isolated local test DB.

Limits: this is browser emulation, not physical-device verification. iOS Safari,
Android browser keyboards, zoom/accessibility text scaling and all populated
nested detail/dialog states have not been exhaustively checked. Floating timer
intentionally overlays content; bottom padding allows content to scroll clear.
