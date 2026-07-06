# Blender Export Workflow (High Quality)

Script path:
- `/home/runner/work/lunchmate/lunchmate/lunchmate_logo_blender.py`

## Outputs produced
- `lunchmate_logo_render.png` (preview transparent)
- `lunchmate_hero_render.png` (preview hero)
- `lunchmate_logo_PRINT_4K.png` (high-quality transparent 2D logo)
- `lunchmate_hero_POSTER_4K.png` (high-quality hero render)
- `lunchmate_3d.glb` (web-ready 3D asset)
- `lunchmate_3d.blend` (source scene)
- `export_manifest.json` (file list + resolutions + palette)

## How to run
GUI:
1. Blender -> Scripting -> New
2. Paste script
3. Edit `OUTPUT_DIR`
4. Run Script

Headless:
```bash
blender --background --python /home/runner/work/lunchmate/lunchmate/lunchmate_logo_blender.py
```

## Quality controls
- Fast preview: `RENDER_RES`, `RENDER_SAMPLES`
- Final print 4K: `POSTER_RES`, `POSTER_SAMPLES`
- Optional 8K: set `EXPORT_ULTRA_RES_POSTER = True`
- 16-bit PNG enabled for smoother gradients.
