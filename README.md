# lunchmate

3D Tiffin Box Logo with Banana Leaf - Procedural Blender + Web Integration

## Added in this repository
- Blender build/export script: `/home/runner/work/lunchmate/lunchmate/lunchmate_logo_blender.py`
- Render and 3D asset folders:
  - `/home/runner/work/lunchmate/lunchmate/assets/3d`
  - `/home/runner/work/lunchmate/lunchmate/assets/renders`
- Branding docs:
  - `/home/runner/work/lunchmate/lunchmate/docs/branding/palette.md`
  - `/home/runner/work/lunchmate/lunchmate/docs/branding/export-workflow.md`
- Website/dashboard blueprint:
  - `/home/runner/work/lunchmate/lunchmate/docs/website/implementation-blueprint.md`
- Next.js website + dashboard app:
  - `/home/runner/work/lunchmate/lunchmate/web`

## Run Blender script
```bash
blender --background --python /home/runner/work/lunchmate/lunchmate/lunchmate_logo_blender.py
```

## Run website
```bash
cd /home/runner/work/lunchmate/lunchmate/web
cp .env.example .env.local
npm install
npm run dev
```
