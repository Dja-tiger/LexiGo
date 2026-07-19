from pathlib import Path

path = Path("frontend/components/dictionary-catalog.tsx")
text = path.read_text()
old = '''  const selectedItem = localDetail
    ?? (remoteDetail?.key === navigation.detail ? remoteDetail.item : null);'''
new = '''  const selectedItem = localDetail
    ?? (remoteDetail && remoteDetail.key === navigation.detail ? remoteDetail.item : null);'''
if old not in text:
    raise SystemExit("remote detail narrowing expression was not found")
path.write_text(text.replace(old, new, 1))
