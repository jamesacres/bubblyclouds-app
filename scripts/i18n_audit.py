#!/usr/bin/env python3
"""Project i18n audit: i18next key usage vs each root's src/locales/en.json.

Derived from .claude/skills/i18n-expert/scripts/i18n_audit.py with:
  - test files excluded
  - plural (_one/_other/...) and ordinal (_ordinal_*) variants resolved to the base key
  - i18nKey="..." / i18nKey={'...'} recognised (react-i18next <Trans>)
  - returnObjects calls mark the whole subtree as used
  - dynamic keys (template literals or identifiers) must be covered by a declared
    prefix in i18n_audit.config.json, whose expected keys are cross-checked
    against the source of truth and the locale file

Exit code is non-zero on any missing key, unexplained unused key, unexplained
dynamic key, ns:-prefixed key, stale allowlist entry or failed cross-check.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Set, Tuple

PLURAL_RE = re.compile(r"_(?:ordinal_)?(?:zero|one|two|few|many|other)$")
TEST_RE = re.compile(r"\.(test|spec)\.[jt]sx?$|__tests__")
EXTS = {".ts", ".tsx", ".js", ".jsx"}

CALL_RE = re.compile(r"(?<![\w$])(?:i18n\.|i18next\.)?t\(\s*(['\"`])((?:(?!\1).)*)\1", re.S)
CALL_START_RE = re.compile(r"(?<![\w$.])(?:i18n\.|i18next\.)?t\(\s*(?!['\"`\)])(\w+)")
I18N_KEY_RE = re.compile(r"i18nKey=\{?\s*(['\"`])((?:(?!\1).)*)\1")


def flatten(obj, prefix: str = "") -> Dict[str, object]:
    out: Dict[str, object] = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            out.update(flatten(v, f"{prefix}.{k}" if prefix else k))
    else:
        out[prefix] = obj
    return out


def base_key(key: str) -> str:
    return PLURAL_RE.sub("", key)


def source_files(src: Path) -> List[Path]:
    return [
        p
        for p in sorted(src.rglob("*"))
        if p.is_file()
        and p.suffix in EXTS
        and "node_modules" not in p.parts
        and not TEST_RE.search(str(p))
    ]


def scan(files: List[Path]):
    static: Dict[str, Set[str]] = {}
    dynamic: List[Tuple[str, str]] = []
    object_keys: Set[str] = set()
    for path in files:
        text = path.read_text(encoding="utf-8")
        rel = str(path)
        for m in CALL_RE.finditer(text):
            quote, key = m.group(1), m.group(2)
            tail = text[m.end() : m.end() + 200]
            if quote == "`" and "${" in key:
                dynamic.append((rel, key.split("${", 1)[0]))
                continue
            static.setdefault(key, set()).add(rel)
            if "returnObjects" in tail.split(")", 1)[0] or re.match(
                r"\s*,\s*\{[^}]*returnObjects", tail
            ):
                object_keys.add(key)
        for m in I18N_KEY_RE.finditer(text):
            key = m.group(2)
            if "${" in key:
                dynamic.append((rel, key.split("${", 1)[0]))
            else:
                static.setdefault(key, set()).add(rel)
        for m in CALL_START_RE.finditer(text):
            dynamic.append((rel, f"<identifier {m.group(1)}>"))
    return static, dynamic, object_keys


def expected_keys(repo: Path, expect: dict) -> Set[str]:
    text = (repo / expect["source"]).read_text(encoding="utf-8")
    if "block" in expect:
        block = re.search(expect["block"], text, re.S)
        text = block.group(1) if block else ""
    ids = re.findall(expect["regex"], text, re.M)
    if expect.get("lower"):
        ids = [i.lower() for i in ids]
    ids = ids + expect.get("extra", [])
    return {t.replace("{}", i) for i in ids for t in expect["templates"]}


def audit_root(repo: Path, root: str, config: dict) -> Tuple[List[str], dict]:
    problems: List[str] = []
    locale_path = repo / root / "src" / "locales" / "en.json"
    locale = set(flatten(json.loads(locale_path.read_text(encoding="utf-8"))).keys())
    locale_bases = {base_key(k) for k in locale}
    files = source_files(repo / root / "src")
    static, dynamic, object_keys = scan(files)

    for key, where in sorted(static.items()):
        if re.match(r"^[a-z][\w-]*:[\w.]", key):
            problems.append(f"ns-prefixed key: {key} ({sorted(where)[0]})")

    missing = sorted(
        k
        for k in static
        if k not in locale and k not in locale_bases and ":" not in k
    )

    used: Set[str] = set()
    for key in static:
        used.add(base_key(key))
    for key in object_keys:
        used |= {k for k in locale if k.startswith(key + ".")}

    prefixes = config.get("dynamicPrefixes", {}).get(root, [])
    explained: Set[str] = set()
    for entry in prefixes:
        prefix = entry["prefix"]
        keys = {k for k in locale if k.startswith(prefix)}
        if not keys and not entry.get("external"):
            problems.append(f"stale dynamic prefix (no locale keys): {prefix}")
        if "expect" in entry:
            expected = expected_keys(repo, entry["expect"])
            if not expected:
                problems.append(f"dynamic prefix {prefix}: expectation produced no keys")
            for k in sorted(expected - locale):
                problems.append(f"dynamic prefix {prefix}: expected key missing: {k}")
            for k in sorted({base_key(x) for x in keys} - expected):
                if base_key(k) not in expected and k not in expected:
                    problems.append(f"dynamic prefix {prefix}: unexpected key: {k}")
        explained |= keys

    for rel, prefix in dynamic:
        if not any(
            prefix.startswith(e["prefix"]) or e["prefix"].startswith(prefix)
            for e in prefixes
        ):
            problems.append(f"unexplained dynamic key {prefix!r} in {rel}")

    unused = sorted(
        k for k in locale if base_key(k) not in used and k not in explained
    )
    result = {
        "files": len(files),
        "used": len(static),
        "missing": missing,
        "unused": unused,
        "dynamic": len(prefixes),
    }
    return problems, result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("roots", nargs="+", help="package/app roots (contain src/locales/en.json)")
    parser.add_argument("--config", default=str(Path(__file__).with_name("i18n_audit.config.json")))
    args = parser.parse_args()

    repo = Path.cwd()
    config = json.loads(Path(args.config).read_text(encoding="utf-8"))
    status = 0
    for root in args.roots:
        problems, r = audit_root(repo, root, config)
        print(f"== {root}")
        print(f"Scanned {r['files']} files, used keys: {r['used']}, dynamic prefixes: {r['dynamic']}")
        print(f"  Missing: {len(r['missing'])}")
        for k in r["missing"]:
            print(f"    - {k}")
        print(f"  Unused: {len(r['unused'])}")
        for k in r["unused"]:
            print(f"    - {k}")
        print(f"  Problems: {len(problems)}")
        for p in problems:
            print(f"    - {p}")
        if r["missing"] or r["unused"] or problems:
            status = 1
    print("\nOK" if status == 0 else "\nFAILED")
    return status


if __name__ == "__main__":
    sys.exit(main())
