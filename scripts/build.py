#!/usr/bin/env python3
"""Build the static site: site/ -> _site/ with configuration filled in.

Configuration comes from environment variables (GitHub repository variables in CI):

  CONTACT_FORM_ENDPOINT  required  URL the contact form posts to, e.g. https://formspree.io/f/abcd1234
  DATAROOM_URL           optional  investor data room link; the links are removed when unset
  SITE_URL               optional  defaults to https://antinode.bio

Standard library only, so it runs anywhere Python 3.9+ does.
"""
from __future__ import annotations

import datetime as dt
import os
import re
import shutil
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "site"
TEMPLATED = {".html", ".xml", ".txt", ".webmanifest"}


def fail(msg: str) -> None:
    # ::error:: shows as an annotation on the GitHub Actions run summary.
    prefix = "::error::" if os.environ.get("GITHUB_ACTIONS") else "error: "
    print(prefix + msg, file=sys.stderr)
    sys.exit(1)


def https_url(name: str, value: str) -> str:
    u = urlparse(value)
    if u.scheme != "https" or not u.netloc:
        fail(f"{name} must be an https:// URL (got {value!r})")
    return value


def origin(url: str) -> str:
    u = urlparse(url)
    return f"{u.scheme}://{u.netloc}"


def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "_site"

    endpoint = os.environ.get("CONTACT_FORM_ENDPOINT", "").strip()
    if not endpoint:
        fail(
            "CONTACT_FORM_ENDPOINT is not set. Create a form at formspree.io (or a compatible "
            "service) and add its URL as a repository variable: Settings → Secrets and "
            "variables → Actions → Variables. See README.md."
        )
    endpoint = https_url("CONTACT_FORM_ENDPOINT", endpoint)
    dataroom = os.environ.get("DATAROOM_URL", "").strip()
    if dataroom:
        dataroom = https_url("DATAROOM_URL", dataroom)
    site_url = https_url("SITE_URL", os.environ.get("SITE_URL", "").strip() or "https://antinode.bio").rstrip("/")

    brand_version = (SRC / "assets/brand/VERSION").read_text().strip()

    # The page has no inline scripts or styles, so the policy can be strict.
    # JSON-LD is data, not script, and is unaffected by script-src.
    csp = "; ".join([
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        f"connect-src {origin(endpoint)}",
        f"form-action {origin(endpoint)}",
        "base-uri 'none'",
        "object-src 'none'",
    ])

    values = {
        "CONTACT_FORM_ENDPOINT": endpoint,
        "DATAROOM_URL": dataroom,
        "SITE_URL": site_url,
        "BRAND_VERSION": brand_version,
        "YEAR": str(dt.date.today().year),
        "CSP": csp,
    }

    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(SRC, out, ignore=shutil.ignore_patterns("VERSION", ".DS_Store"))

    for f in sorted(out.rglob("*")):
        if f.suffix not in TEMPLATED:
            continue
        s = f.read_text()
        if not dataroom:
            s = re.sub(r"[ \t]*<!-- dataroom -->.*?<!-- /dataroom -->[ \t]*\n?", "", s, flags=re.S)
        else:
            s = re.sub(r"[ \t]*<!-- /?dataroom -->[ \t]*\n", "", s)
        s = re.sub(r"\{\{(\w+)\}\}", lambda m: values.get(m.group(1), m.group(0)), s)
        if "{{" in s:
            fail(f"unfilled placeholder left in {f.relative_to(out)}")
        f.write_text(s)

    (out / ".nojekyll").write_text("")
    print(f"built {out.relative_to(ROOT) if out.is_relative_to(ROOT) else out}"
          f"  (brand {brand_version}, data room {'on' if dataroom else 'off'})")


if __name__ == "__main__":
    main()
