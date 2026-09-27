#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
legacy_product = 'mar' + 'veen'
legacy_product_cap = 'Mar' + 'veen'
legacy_product_upper = 'MAR' + 'VEEN'
legacy_author = 'Szo' + 'tasz'
SKIP_DIRS = {'.git', 'node_modules', 'dist', '.next', 'coverage'}
DOC_EXTS = {'.md', '.txt', '.rst'}

def is_skipped(p):
    rel = p.relative_to(ROOT)
    return any(part in SKIP_DIRS for part in rel.parts)

def transform_text(path, s):
    s = s.replace('https://github.com/' + legacy_author + '/' + legacy_product, 'https://github.com/tmisi76/webinar-magus')
    s = s.replace('github.com/' + legacy_author + '/' + legacy_product, 'github.com/tmisi76/webinar-magus')
    s = s.replace(legacy_author + '/' + legacy_product, 'tmisi76/webinar-magus')
    s = s.replace(legacy_author, 'upstream')
    s = s.replace(legacy_product_upper, 'WEBINAR_MAGUS')
    s = s.replace('/api/' + legacy_product, '/api/webinar-magus')
    s = s.replace('.' + legacy_product, '.webinar-magus')
    s = s.replace(legacy_product + '-', 'webinar-magus-')
    s = s.replace(legacy_product + '_', 'webinar_magus_')
    s = s.replace(legacy_product + '/', 'webinar-magus/')
    s = s.replace(legacy_product + '.', 'webinar-magus.')
    s = s.replace(chr(39) + legacy_product + chr(39), chr(39) + 'webinar-magus' + chr(39))
    s = s.replace(chr(34) + legacy_product + chr(34), chr(34) + 'webinar-magus' + chr(34))
    if path.suffix.lower() in DOC_EXTS:
        s = s.replace(legacy_product_cap, 'Webinár Mágus')
        s = s.replace(legacy_product, 'Webinár Mágus')
    else:
        s = s.replace(legacy_product_cap, 'WebinarMagus')
        s = s.replace(legacy_product, 'webinarMagus')
    return s

changed = 0
for p in ROOT.rglob('*'):
    if not p.is_file() or is_skipped(p) or p.name == 'LICENSE':
        continue
    try:
        text = p.read_bytes().decode('utf-8')
    except (UnicodeDecodeError, OSError):
        continue
    new = transform_text(p, text)
    if new != text:
        p.write_text(new, encoding='utf-8')
        changed += 1

paths = sorted([p for p in ROOT.rglob('*') if not is_skipped(p) and legacy_product in p.name.lower()], key=lambda p: len(p.parts), reverse=True)
for p in paths:
    new_name = p.name.replace(legacy_product_cap, 'webinar-magus').replace(legacy_product, 'webinar-magus')
    target = p.with_name(new_name)
    if target != p and not target.exists():
        p.rename(target)

print('brand migration changed', changed, 'text files')
