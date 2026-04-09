# Demo Data Setup

Use the SQL script below after migrations if you want a richer local workspace for manual testing, demos, and screenshots.

Script:

- [demo-data.sql](/Users/nuttapon/Github-dev/InsightDocs/docs/demo-data.sql)

It inserts:

- demo admin/controller/manager/signer users
- role assignments
- several sample documents in `Draft`, `InReview`, `Approved`, and `Archived`
- current document versions with placeholder object keys

Run example:

```bash
PGPASSWORD='uBUU34ksWv5ouiTh1xJUBx6b38enBcgPRHfTpHCa' \
psql -h localhost -p 5433 -U appuser -d insightDocs -f docs/demo-data.sql
```

Notes:

- the script is idempotent for the fixed ids it inserts
- version object keys are placeholders for UI/demo purposes
- if you want real MinIO-backed PDFs, upload new versions from the application after loading the demo rows
