#!/usr/bin/env python3
"""
sync-vault.py - Sync Obsidian vault content to Astro content/docs directory.

Publishing rules:
  publish: true         -> publish the full note
  dg-publish: true      -> publish the full note (Digital Garden migration)
  publish: description  -> publish only text under the ## Description heading

Blocked folders (never published): Sessions, Plot Lines, Player Characters, z_Assests

Images: copied to --image-output directory (flat by filename).
        ![[image.ext]] embeds in published notes are converted to standard markdown.
Wikilinks: [[Note Name]] converted to [Note Name](BASE_URL/slug).
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

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif"}

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


def slugify_part(s: str) -> str:
    """Slugify a single path segment."""
    s = s.lower()
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def path_to_slug(rel_path: str) -> str:
    """
    Convert a vault-relative file path to a URL slug.
    Example: 'World (Erodas)/Korlornium/Korlornium.md' -> 'world-(erodas)/korlornium'
    """
    parts = rel_path.replace("\\", "/").split("/")
    # Remove .md extension from last part
    parts[-1] = parts[-1].rsplit(".", 1)[0]
    parts = [slugify_part(p) for p in parts]
    # Drop repeated final segment (folder/folder.md → folder/)
    if len(parts) >= 2 and parts[-1] == parts[-2]:
        parts.pop()
    return "/".join(parts)


def build_wikilink_lookup(vault_path: str) -> dict[str, str]:
    """
    Build a mapping of note filename stem -> URL slug for all published notes.
    """
    lookup: dict[str, str] = {}

    for root, dirs, files in os.walk(vault_path):
        rel_root = os.path.relpath(root, vault_path)
        # Skip excluded directories
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

            frontmatter, _ = parse_frontmatter(raw)
            if get_publish_mode(frontmatter, rel_path) is None:
                continue

            stem = filename.rsplit(".", 1)[0]
            slug = path_to_slug(rel_path)
            # Prefer shorter slugs (folder index pages) on conflicts
            if stem not in lookup or len(slug) < len(lookup[stem]):
                lookup[stem] = slug

    return lookup


def replace_wikilinks(content: str, lookup: dict[str, str], base_url: str) -> str:
    """Convert [[Note]] and [[Note|Display]] to markdown links."""
    def replace_match(m: re.Match) -> str:
        note_ref = m.group(1).strip()
        display = m.group(2)

        # Strip heading anchors (e.g., [[Note#Section]] -> Note)
        note_name = note_ref.split("#")[0].strip()

        slug = lookup.get(note_name)
        if not slug:
            # Case-insensitive fallback
            lower = note_name.lower()
            for k, v in lookup.items():
                if k.lower() == lower:
                    slug = v
                    break

        label = display.strip() if display else note_name

        if slug:
            url = f"{base_url}/{slug}"
            return f"[{label}]({url})"
        else:
            return label  # Unresolved: render as plain text

    pattern = re.compile(r"\[\[([^\]|#]+(?:#[^\]|]*)?)\|?([^\]]*)\]\]")
    return pattern.sub(replace_match, content)


def replace_image_embeds(
    content: str,
    image_names: set[str],
    base_url: str,
) -> str:
    """Convert ![[image.ext]] to standard markdown image syntax."""
    def replace_match(m: re.Match) -> str:
        filename = m.group(1).strip()
        # Strip sizing hints like |400 from filenames
        clean_name = filename.split("|")[0].strip()
        if clean_name in image_names:
            url = f"{base_url}/vault-images/{clean_name}"
            return f"![{clean_name}]({url})"
        return m.group(0)

    ext_pattern = "|".join(re.escape(e.lstrip(".")) for e in IMAGE_EXTENSIONS)
    pattern = re.compile(
        rf"!\[\[([^\]]+\.(?:{ext_pattern})(?:\|[^\]]*)?)\]\]",
        re.IGNORECASE,
    )
    return pattern.sub(replace_match, content)


def collect_images(vault_path: str, image_output: str) -> set[str]:
    """
    Copy all vault images to image_output directory (flat by filename).
    Returns set of image filenames that were copied.
    """
    IMAGE_SKIP = {".git", ".obsidian", ".claude"}
    os.makedirs(image_output, exist_ok=True)
    copied_names: set[str] = set()

    for root, dirs, files in os.walk(vault_path):
        dirs[:] = [d for d in dirs if d not in IMAGE_SKIP]
        for filename in files:
            ext = os.path.splitext(filename)[1].lower()
            if ext not in IMAGE_EXTENSIONS:
                continue
            src = os.path.join(root, filename)
            dest = os.path.join(image_output, filename)
            shutil.copy2(src, dest)
            copied_names.add(filename)

    return copied_names


def sync_vault(vault_path: str, output_path: str, image_output: str, base_url: str):
    # Build wikilink lookup before clearing output dir
    print("Building wikilink lookup...")
    wikilink_lookup = build_wikilink_lookup(vault_path)
    print(f"  {len(wikilink_lookup)} published notes indexed")

    # Copy images
    print("Copying images...")
    image_names = collect_images(vault_path, image_output)
    print(f"  {len(image_names)} images copied to {image_output}")

    # Clear the docs output directory (keep .gitkeep)
    os.makedirs(output_path, exist_ok=True)
    for item in os.listdir(output_path):
        if item == ".gitkeep":
            continue
        item_path = os.path.join(output_path, item)
        if os.path.isdir(item_path):
            shutil.rmtree(item_path)
        else:
            os.remove(item_path)

    copied = 0
    skipped = 0

    for root, dirs, files in os.walk(vault_path):
        rel_root = os.path.relpath(root, vault_path)

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

            # Convert Obsidian syntax to standard markdown
            body = replace_image_embeds(body, image_names, base_url)
            body = replace_wikilinks(body, wikilink_lookup, base_url)

            clean_fm = clean_frontmatter(frontmatter, mode)
            fm_yaml = yaml.dump(
                clean_fm, default_flow_style=False, allow_unicode=True
            ).strip()
            output_content = f"---\n{fm_yaml}\n---\n\n{body}\n"

            dest = os.path.join(output_path, rel_path)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, "w", encoding="utf-8") as f:
                f.write(output_content)

            copied += 1
            print(f"  + {rel_path}")

    print(f"\nDone: {copied} notes published, {skipped} skipped.")


def main():
    parser = argparse.ArgumentParser(
        description="Sync Obsidian vault to Astro content/docs directory"
    )
    parser.add_argument("--vault", required=True, help="Path to Obsidian vault root")
    parser.add_argument(
        "--output",
        default="src/content/docs",
        help="Astro content/docs directory (default: src/content/docs)",
    )
    parser.add_argument(
        "--image-output",
        default="public/vault-images",
        help="Directory to copy vault images into (default: public/vault-images)",
    )
    parser.add_argument(
        "--base-url",
        default="/erodas-atlas",
        help="Site base URL used in generated links (default: /erodas-atlas)",
    )
    args = parser.parse_args()
    sync_vault(args.vault, args.output, args.image_output, args.base_url)


if __name__ == "__main__":
    main()
