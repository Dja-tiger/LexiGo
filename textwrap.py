"""Temporary Issue #50 workflow shim; removed after the component patch commit."""


def dedent(value: str) -> str:
    """Remove only the four formatting spaces used by triple-quoted patch blocks."""
    if not value.startswith("\n"):
        return value

    normalized: list[str] = []
    for line in value.splitlines(keepends=True):
        if line.startswith("    "):
            normalized.append(line[4:])
        else:
            normalized.append(line)
    return "".join(normalized)
