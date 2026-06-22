#!/usr/bin/env python3
"""Replace hardcoded colors with CSS variables for dark mode support."""
import re, sys
from pathlib import Path

# Order matters: longer/more-specific patterns first
REPLACEMENTS = [
    # Shadows / overlays
    ('"0 4px 20px rgba(25, 31, 40, 0.12)"', '"0 4px 20px var(--c-shadow)"'),
    ('"rgba(25, 31, 40, 0.5)"', '"var(--c-overlay)"'),

    # Border strings
    ('"1px solid #e5e8eb"', '"1px solid var(--c-border)"'),
    ('"1px solid #f2f4f6"', '"1px solid var(--c-divider)"'),
    ('"1.5px solid #3182f6"', '"1.5px solid var(--c-blue)"'),
    ('"1.5px solid transparent"', '"1.5px solid transparent"'),  # keep as is

    # Background values
    ('background: "#f9fafb"', 'background: "var(--c-bg-app)"'),
    ('background: "#ffffff"', 'background: "var(--c-bg-card)"'),
    ('background: "#fff"', 'background: "var(--c-bg-card)"'),
    ('background: "#f2f4f6"', 'background: "var(--c-bg-input)"'),
    ('background: "#e8f3ff"', 'background: "var(--c-blue-tint)"'),
    ('backgroundColor: "#f2f4f6"', 'backgroundColor: "var(--c-bg-input)"'),

    # Text colors
    ('color: "#191f28"', 'color: "var(--c-text-primary)"'),
    ('color: "#333d4b"', 'color: "var(--c-text-body)"'),
    ('color: "#6b7684"', 'color: "var(--c-text-caption)"'),
    ('color: "#8b95a1"', 'color: "var(--c-text-secondary)"'),
    ('color: "#b0b8c1"', 'color: "var(--c-text-hint)"'),
    ('color: "#3182f6"', 'color: "var(--c-blue)"'),

    # SVG stroke attributes (JSX attribute style, not inside style={{}})
    ('stroke="#191f28"', 'stroke="var(--c-text-primary)"'),
    ('stroke="#8b95a1"', 'stroke="var(--c-text-secondary)"'),
    ('stroke="#b0b8c1"', 'stroke="var(--c-text-hint)"'),
    ('stroke="#3182f6"', 'stroke="var(--c-blue)"'),
    # SVG stroke inside style objects
    ('stroke: "#8b95a1"', 'stroke: "var(--c-text-secondary)"'),
    ('stroke: "#3182f6"', 'stroke: "var(--c-blue)"'),

    # borderTop/Bottom/Left/Right
    ('"1px solid #e5e8eb"', '"1px solid var(--c-border)"'),

    # fontWeight-conditional color expressions stay as hardcoded for active/inactive tabs
    # (handled manually)
]

# Files to process
FILES = [
    "src/App.tsx",
    "src/pages/HomePage.tsx",
    "src/pages/ReviewPage.tsx",
    "src/pages/StudyCardPage.tsx",
    "src/pages/SettingsPage.tsx",
    "src/pages/OnboardingPage.tsx",
    "src/pages/TermsPage.tsx",
]

def apply(path: Path, dry_run=False):
    content = path.read_text(encoding="utf-8")
    original = content
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    if content != original:
        changed = sum(1 for a, b in zip(original.splitlines(), content.splitlines()) if a != b)
        print(f"  {path}: {changed} lines changed")
        if not dry_run:
            path.write_text(content, encoding="utf-8")
    else:
        print(f"  {path}: no changes")

root = Path("/home/yoojins2/dj-nativefit")
dry = "--dry" in sys.argv
if dry:
    print("DRY RUN")
for f in FILES:
    apply(root / f, dry_run=dry)
print("Done.")
