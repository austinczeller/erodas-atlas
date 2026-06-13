#!/usr/bin/env python3
"""
sync-vault.py - Sync Obsidian vault content to Quartz content directory.

Publishing rules:
  publish: true         -> publish the full note
  dg-publish: true      -> publish the full note (Digital Garden migration)
  publish: description  -> publish only text under the ## Description heading

Blocked folders (never published): Sessions, Plot Lines, Player Characters, z_Assests
"""

import os
import re
import sys
import shutil
import argparse
import yaml

EXCLUDED_FOLDERS = {
    "Sessions",
    "Plot Lines",
    "Player Characters",
    "z_Assests",
    ".obsidian",
    ".git",
    ".claude",
}

# Obsidian plugin code blocks that won't render on the web
OBSIDIAN_BLOCKS = [
    "dataview",
    "dataviewjs",
    "meta-bind",
    "meta-bind-button",
    "meta-bind-js-view",
    "calendarium",
    "zoom-map",
    "zoommap",
    "button",
    "tasks",
    "file-include",
]

# Frontmatter fields that are internal and should not be exposed
INTERNAL_FIELDS = {
    "dg-publish",
    "dg-home",
    "dg-pinned",
    "dg-permalink",
    "cssclasses",
    "cssclass",
    "party_level",
    "dg-path",
    "dg-note-icon",
}


def parse_frontmatter(content: str) -> tuple[dict, str]:
    if not content.startswith("---"):
        return {}, content
    end = content.find("---", 3)
    if end == -1:
        return {}, content
    try:
        # BaseLoader keeps all values as strings, avoiding date-parsing errors
        fm = yaml.load(content[3:end], Loader=yaml.BaseLoader) or {}
    except (yaml.YAMLError, ValueError):
        fm = {}
    body = content[end + 3:].lstrip("\n")
    return fm, body


def get_publish_mode(frontmatter: dict, rel_path: str) -> str | None:
    """Return 'full', 'description', or None."""
    parts = rel_path.replace("\\", "/").split("/")
    for part in parts[:-1]:
        if part in EXCLUDED_FOLDERS:
            return None

    publish = str(frontmatter.get("publish") or "").strip().lower()
    dg_publish = str(frontmatter.get("dg-publish") or "").strip().lower()

    if publish == "true" or dg_publish == "true":
        return "full"
    if publish in ("description", "description-only"):
        return "description"

    return None


def strip_obsidian_blocks(content: str) -> str:
    for block_type in OBSIDIAN_BLOCKS:
        pattern = rf"```{re.escape(block_type)}[ \t]*\n.*?```"
        content = re.sub(pattern, "", content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r"\n{3,}", "\n\n", content)
    return content.strip()


def extract_description_section(body: str) -> str:
    """Return only the content under the first ## Description heading."""
    pattern = re.compile(r"^##\s+description\s*$", re.IGNORECASE | re.MULTILINE)
    match = pattern.search(body)
    if not match:
        return body

    start = match.end()
    # Find the next ## heading
    next_heading = re.search(r"^##\s", body[start:], re.MULTILINE)
    end = start + next_heading.start() if next_heading else len(body)

    section = body[start:end].strip()
    return section if section else body


def clean_frontmatter(frontmatter: dict, mode: str) -> dict:
    cleaned = {}
    for k, v in frontmatter.items():
        if k in INTERNAL_FIELDS or v is None:
            continue
        if k == "publish":
            cleaned[k] = True
        else:
            cleaned[k] = v
    return cleaned


def sync_vault(vault_path: str, output_path: str):
    # Read existing index.md so we don't blow it away
    index_path = os.path.join(output_path, "index.md")
    index_content = None
    if os.path.exists(index_path):
        with open(index_path, encoding="utf-8") as f:
            index_content = f.read()

    # Clear the content directory
    for item in os.listdir(output_path):
        if item == ".gitkeep":
            continue
        item_path = os.path.join(output_path, item)
        if os.path.isdir(item_path):
            shutil.rmtree(item_path)
        else:
            os.remove(item_path)

    # Restore index.md
    if index_content:
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(index_content)

    copied = 0
    skipped = 0

    for root, dirs, files in os.walk(vault_path):
        rel_root = os.path.relpath(root, vault_path)

        # Skip excluded directories entirely
        skip = False
        for part in rel_root.replace("\\", "/").split("/"):
            if part in EXCLUDED_FOLDERS:
                skip = True
                break
        if skip:
            dirs[:] = []
            continue

        dirs[:] = [d for d in dirs if d not in EXCLUDED_FOLDERS]

        for filename in files:
            if not filename.endswith(".md"):
                continue

            filepath = os.path.join(root, filename)
            rel_path = os.path.relpath(filepath, vault_path)

            try:
                with open(filepath, encoding="utf-8", errors="replace") as f:
                    raw = f.read()
            except OSError:
                continue

            frontmatter, body = parse_frontmatter(raw)
            mode = get_publish_mode(frontmatter, rel_path)

            if mode is None:
                skipped += 1
                continue

            body = strip_obsidian_blocks(body)
            if mode == "description":
                body = extract_description_section(body)

            clean_fm = clean_frontmatter(frontmatter, mode)
            fm_yaml = yaml.dump(clean_fm, default_flow_style=False, allow_unicode=True).strip()
            output_content = f"---\n{fm_yaml}\n---\n\n{body}\n"

            dest = os.path.join(output_path, rel_path)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, "w", encoding="utf-8") as f:
                f.write(output_content)

            copied += 1
            print(f"  + {rel_path}")

    print(f"\nDone: {copied} published, {skipped} skipped.")


def main():
    parser = argparse.ArgumentParser(description="Sync Obsidian vault to Quartz content dir")
    parser.add_argument("--vault", required=True, help="Path to Obsidian vault root")
    parser.add_argument("--output", default="content", help="Quartz content directory")
    args = parser.parse_args()
    sync_vault(args.vault, args.output)


if __name__ == "__main__":
    main()
