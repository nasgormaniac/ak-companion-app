# Development notes for AK Scanner Desktop

## UI previews and changes

- Treat the current desktop application build as the visual source of truth. The old Laravel application and earlier mockups are references only when the user explicitly asks for them.
- A requested UI preview must match the existing application **one to one** everywhere the user has not requested a change. Reuse the actual app logo, icons, CSS, fonts, spacing, button shapes, colors, text contrast, card layout, and responsive behavior. Do not substitute approximate symbols, invented icons, or generic controls.
- Show proposed changes in their real screen context, including Home, catalogue, forms, and narrow-window states when affected. Check alignment and text contrast visually before presenting the preview.
- When the user requests a preview before coding, present the accurate preview and wait for their decision before implementing the proposed UI change. Once approved, compare the implemented UI with that preview and check the affected window sizes.
- Keep filled button text readable and consistent with the existing app. Preserve the user's established icon choices and button styles unless the user explicitly changes them.

The user's repeated feedback about preview fidelity is a project requirement, not a minor aesthetic preference. If the current app cannot be inspected well enough to reproduce a detail, say which detail is uncertain instead of guessing.
