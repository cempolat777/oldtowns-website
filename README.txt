OLD TOWNS WALKS - SITEMAP TECHNICAL AUDIT

1) Copy audit-sitemap.mjs into:
   C:\Users\cempo\oldtowns-website

2) Open PowerShell in the project root.

3) Run:
   node .\audit-sitemap.mjs

The script audits every URL currently listed in the live sitemap.

It creates:
  search-console-audit\summary.txt
  search-console-audit\audit-results.csv
  search-console-audit\audit-results.json
  search-console-audit\clean-indexable-urls.txt

Categories:
  200_INDEXABLE
  REDIRECT_TO_OK
  NOINDEX
  CANONICAL_MISMATCH
  404
  OTHER_4XX
  5XX
  REQUEST_ERROR

No site files are modified by this audit.
