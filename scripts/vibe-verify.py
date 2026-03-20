from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent


def run(command: list[str]) -> None:
    result = subprocess.run(command, cwd=REPO_ROOT)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def main() -> None:
    package_json = json.loads((REPO_ROOT / "package.json").read_text(encoding="utf-8"))
    required_scripts = [
        "dev:desktop",
        "dev:web",
        "dev:web-local",
        "typecheck",
        "lint",
        "format",
        "verify",
    ]

    missing = [name for name in required_scripts if name not in package_json.get("scripts", {})]
    if missing:
        print(f"Missing root scripts: {', '.join(missing)}", file=sys.stderr)
        raise SystemExit(1)

    run(["node", "scripts/check-workspace.mjs"])
    run(["node", "scripts/lint.mjs"])
    run(["node", "scripts/typecheck.mjs"])

    print("Vibe verify passed.")


if __name__ == "__main__":
    main()
