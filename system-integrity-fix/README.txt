OLD TOWNS SYSTEM INTEGRITY FIX

This package fixes systemic video-location and nearby-hotel validation.

Installation
1. Extract the system-integrity-fix folder into the project root.
2. Open PowerShell in the oldtowns-website project root.
3. Run:
   powershell -ExecutionPolicy Bypass -File .\system-integrity-fix\install.ps1

Safe repair workflow
1. Dry run:
   npm run repair:integrity -- --release 2026-08-19.0
2. Review video-integrity-repair-report.json.
3. Apply only after the dry run passes:
   npm run repair:integrity -- --release 2026-08-19.0 --write
4. Run:
   npm run build

The repair works on an isolated copy. It updates src/data/videos.json only
after both the integrity audit and the multilingual SEO audit pass. A timestamped
backup is created before the final write.

The package does not modify .env, D1, or deployment configuration.
