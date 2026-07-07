from pathlib import Path

p = Path("src/app/newintel-theme.css")
lines = p.read_text(encoding="utf-8").splitlines()
out = []
dedented = 0
for i, line in enumerate(lines):
    if i >= 218 and line.startswith("  "):
        out.append(line[2:])
        dedented += 1
    else:
        out.append(line)

text = "\n".join(out) + "\n"
font_import = "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');\n\n"
text = text.replace(font_import, "")
p.write_text(text, encoding="utf-8")
print(f"dedented {dedented} lines")
