from pathlib import Path

path = Path("backend/integration/password_recovery_test.go")
text = path.read_text(encoding="utf-8")
marker = '\t"github.com/Dja-tiger/New-project/backend/internal/auth"\n'
count = text.count(marker)
if count != 1:
    raise SystemExit(f"unused auth import: expected one marker, found {count}")
path.write_text(text.replace(marker, "", 1), encoding="utf-8")
