from pathlib import Path

path = Path("frontend/components/lexigo-premium-app.tsx")
text = path.read_text(encoding="utf-8")
old = '''  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("reset_token")?.trim() ?? "";
    if (!token) return;
    setResetToken(token);
    setAuthMode("reset");
    setReturnView("profile");
    setAuthFieldErrors({});
    setAuthFormError("");
    setAuthNotice("");
  }, []);
'''
new = '''  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("reset_token")?.trim() ?? "";
    if (!token) return;
    const timer = window.setTimeout(() => {
      setResetToken(token);
      setAuthMode("reset");
      setReturnView("profile");
      setAuthFieldErrors({});
      setAuthFormError("");
      setAuthNotice("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
'''
count = text.count(old)
if count != 1:
    raise SystemExit(f"reset bootstrap effect: expected one marker, found {count}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
