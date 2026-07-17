from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text(encoding="utf-8")
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}: {old[:120]!r}")
    target.write_text(source.replace(old, new), encoding="utf-8")


replace_once(
    "frontend/app/premium-ui.css",
    '''.lx-related { border-top: 1px solid var(--lx-border); padding: 16px; }
.lx-related > div:first-child { margin-bottom: 11px; color: #9ca7ba; font-weight: 720; }
.lx-related > div:last-child { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
.lx-related button { display: grid; grid-template-columns: 1fr auto; gap: 5px; border: 1px solid var(--lx-border); border-radius: 14px; padding: 13px; color: white; background: rgba(255,255,255,.02); text-align: left; }
.lx-related button strong { grid-column: 1; }
.lx-related button small { grid-column: 1; color: #718098; }
.lx-related button svg { grid-column: 2; grid-row: 1 / 3; align-self: center; color: #7965ff; }
''',
    '''.lx-related { border-top: 1px solid var(--lx-border); padding: 16px; }
.lx-related > div:first-child { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 11px; color: #9ca7ba; font-weight: 720; }
.lx-related > div:first-child small { color: #68758b; font-weight: 450; }
.lx-related > div:last-child { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
.lx-related article { display: grid; grid-template-columns: 1fr auto; gap: 5px; border: 1px solid var(--lx-border); border-radius: 14px; padding: 13px; color: white; background: rgba(255,255,255,.02); text-align: left; }
.lx-related article strong { grid-column: 1; }
.lx-related article small { grid-column: 1; color: #718098; }
.lx-related article > span { grid-column: 2; grid-row: 1 / 3; align-self: center; border: 1px solid rgba(59, 219, 147, .24); border-radius: 999px; padding: 5px 8px; color: #66dca4; background: rgba(19, 104, 68, .18); font-size: 11px; font-weight: 760; }
''',
)

replace_once(
    "api/openapi.yaml",
    '''        "204":
          description: Урок сброшен; version атомарно увеличена.
        "409":
          $ref: "#/components/responses/Conflict"
        "428":
          description: If-Match отсутствует.
''',
    '''        "204":
          description: Урок сброшен; version атомарно увеличена.
        "409":
          $ref: "#/components/responses/Conflict"
        "422":
          description: If-Match не содержит положительную lesson version.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "428":
          description: If-Match отсутствует.
''',
)

print("Issue 39 UI and OpenAPI finalization applied")
