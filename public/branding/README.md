# College Logo Placement

This folder is reserved for the **official Malnad College of Engineering logo**.
No logo is bundled with this codebase (copyrighted assets are intentionally
excluded).

## How to add the real logo

1. Obtain the official logo file from the department / college administration.
2. Save it here as:
   - `public/branding/mce-logo.svg` (preferred — scales cleanly), or
   - `public/branding/mce-logo.png` (min. 512×512, transparent background)
3. No code changes are needed elsewhere — `Navbar` and `Footer` (built in the
   UI phase) will read from this fixed path:
   ```
   /branding/mce-logo.svg
   ```
4. Until a real file exists here, the UI falls back to a text wordmark
   ("MCE CSBS Paper Vault") so the app never breaks on a missing asset.
