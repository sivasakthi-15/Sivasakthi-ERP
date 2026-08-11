Patches applied:

- Added `showDraftRestorePrompt` state to BillingModule.
- Replaced auto-restore on mount with a prompt that shows when a draft exists.
- Added autosave effect to persist drafts via `saveDraft()` with debounce when rows or customer info changes.
- On successful save (handleSaveBill) draft is cleared (`saveDraft(null)`).
- Send-to-printer button now awaits `printA4Element()` and clears draft after successful print.
- `clearBill()` now clears draft via `saveDraft(null)`.

See edits in `BillingModule.tsx` for exact changes.
