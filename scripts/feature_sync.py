#!/usr/bin/env python3
"""
Feature Sync Script - Compares README.md against marketing docs
Usage: python scripts/feature_sync.py
"""

import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
README_PATH = PROJECT_ROOT / "README.md"
PRODUCT_BRIEF_PATH = PROJECT_ROOT / "03_Learning" / "Perplexity Learning" / "Archevi_Product_Brief.md"
CUSTOM_INSTRUCTIONS_PATH = PROJECT_ROOT / "03_Learning" / "Perplexity Learning" / "Perplexity_Custom_Instructions.md"


def extract_features(content):
    features = {"current": [], "coming_soon": [], "future": []}
    
    for line in content.split("\n"):
        line = line.strip()
        if line.startswith("- **NEW**"):
            features["current"].append(line.replace("- **NEW** ", ""))
        elif line.startswith("- **") and "**" in line[4:]:
            match = re.match(r"- \*\*(.+?)\*\*", line)
            if match:
                features["current"].append(match.group(1))
    
    in_coming = in_future = False
    for line in content.split("\n"):
        if "### Coming Soon" in line:
            in_coming, in_future = True, False
        elif "### Future" in line:
            in_coming, in_future = False, True
        elif line.startswith("## ") or line.startswith("### "):
            in_coming = in_future = False
        elif line.strip().startswith("- "):
            feat = line.strip()[2:]
            if in_coming:
                features["coming_soon"].append(feat)
            elif in_future:
                features["future"].append(feat)
    
    return features


def check_in_text(feature, text):
    words = re.findall(r"[a-z]{4,}", feature.lower())
    if not words:
        return feature.lower() in text.lower()
    matches = sum(1 for w in words if w in text.lower())
    return matches >= len(words) * 0.5


def main():
    if not README_PATH.exists():
        print("ERROR: README.md not found")
        sys.exit(1)
    
    readme = README_PATH.read_text(encoding="utf-8")
    brief = PRODUCT_BRIEF_PATH.read_text(encoding="utf-8") if PRODUCT_BRIEF_PATH.exists() else ""
    instr = CUSTOM_INSTRUCTIONS_PATH.read_text(encoding="utf-8") if CUSTOM_INSTRUCTIONS_PATH.exists() else ""
    
    features = extract_features(readme)
    
    print("# Feature Sync Report")
    print("=" * 50)
    print(f"\nREADME: {len(features['current'])} current, {len(features['coming_soon'])} coming soon")
    
    print("\n## Product Brief")
    missing = [f for f in features["current"] if not check_in_text(f, brief)]
    print(f"Missing: {len(missing)}" if missing else "OK - all features found")
    for f in missing[:5]:
        print(f"  - {f}")
    
    print("\n## Custom Instructions")
    missing = [f for f in features["current"] if not check_in_text(f, instr)]
    print(f"Missing: {len(missing)}" if missing else "OK - all features found")
    for f in missing[:5]:
        print(f"  - {f}")


if __name__ == "__main__":
    main()
