"""
LUNCHMATE — Tiffin Box + Banana Leaf Logo
Procedural Blender build script.

Run in Blender Scripting tab or headless:
  blender --background --python lunchmate_logo_blender.py
"""

import bpy
import bmesh
import json
import math
import os
from mathutils import Vector

# ----------------------------------------------------------------------
# CONFIG
# ----------------------------------------------------------------------
OUTPUT_DIR = os.path.expanduser("~/Desktop/Lunchmate_3D")
RENDER_RES = 1024
RENDER_SAMPLES = 32
USE_EEVEE = True

EXPORT_GLB = True
EXPORT_HIGH_RES_POSTER = True
POSTER_RES = 4096
POSTER_SAMPLES = 128
EXPORT_ULTRA_RES_POSTER = False
ULTRA_POSTER_RES = 8192
ULTRA_POSTER_SAMPLES = 256

# Active palette switch: CLASSIC, PREMIUM, FESTIVE
ACTIVE_PALETTE = "CLASSIC"

PALETTES = {
    "CLASSIC": {
        "mustard": (0.788, 0.588, 0.122),      # #C9971F
        "mustard_hi": (0.910, 0.769, 0.408),   # #E8C468
        "leaf": (0.184, 0.420, 0.310),         # #2F6B4F
        "leaf_dark": (0.086, 0.227, 0.157),    # #163A28
        "bg": (0.984, 0.965, 0.925),           # #FBF6EC
    },
    "PREMIUM": {
        "mustard": (0.741, 0.537, 0.122),
        "mustard_hi": (0.875, 0.729, 0.357),
        "leaf": (0.153, 0.373, 0.267),
        "leaf_dark": (0.063, 0.192, 0.129),
        "bg": (0.965, 0.949, 0.914),
    },
    "FESTIVE": {
        "mustard": (0.831, 0.624, 0.165),
        "mustard_hi": (0.933, 0.804, 0.475),
        "leaf": (0.231, 0.482, 0.345),
        "leaf_dark": (0.102, 0.243, 0.169),
        "bg": (0.992, 0.973, 0.937),
    },
}


def selected_palette():
    key = ACTIVE_PALETTE.strip().upper()
    if key not in PALETTES:
        print(f"Unknown palette '{ACTIVE_PALETTE}', fallback to CLASSIC")
        key = "CLASSIC"
    return key, PALETTES[key]


PALETTE_NAME, P = selected_palette()
COLOR_MUSTARD = P["mustard"]
COLOR_MUSTARD_HI = P["mustard_hi"]
COLOR_LEAF = P["leaf"]
COLOR_LEAF_DARK = P["leaf_dark"]
COLOR_BG = P["bg"]


def hex_to_linear(c):
    def f(u):
        return u / 12.92 if u <= 0.04045 else ((u + 0.055) / 1.055) ** 2.4
    return tuple(f(v) for v in c)


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block_type in (bpy.data.meshes, bpy.data.curves, bpy.data.materials,
                       bpy.data.lights, bpy.data.cameras):
        for block in list(block_type):
            block_type.remove(block)


def make_material(name, color, metallic=0.0, roughness=0.4, coat=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*hex_to_linear(color), 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
    elif "Clearcoat" in bsdf.inputs:
        bsdf.inputs["Clearcoat"].default_value = coat
    return mat


def make_leaf_gradient_material(name, center_color, edge_color):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nodes, links = nt.nodes, nt.links
    for n in list(nodes):
        nodes.remove(n)

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    tex_coord = nodes.new("ShaderNodeTexCoord")
    sep_xyz = nodes.new("ShaderNodeSeparateXYZ")
    absnode = nodes.new("ShaderNodeMath")
    absnode.operation = 'ABSOLUTE'
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*hex_to_linear(center_color), 1.0)
    ramp.color_ramp.elements[1].color = (*hex_to_linear(edge_color), 1.0)
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[1].position = 0.55
    fresnel = nodes.new("ShaderNodeFresnel")
    fresnel.inputs["IOR"].default_value = 1.45
    mix_sheen = nodes.new("ShaderNodeMixRGB")
    mix_sheen.blend_type = 'ADD'
    mix_sheen.inputs["Fac"].default_value = 0.15
    mix_sheen.inputs["Color2"].default_value = (1, 1, 1, 1)

    links.new(tex_coord.outputs["Object"], sep_xyz.inputs["Vector"])
    links.new(sep_xyz.outputs["Y"], absnode.inputs[0])
    links.new(absnode.outputs[0], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], mix_sheen.inputs["Color1"])
    links.new(fresnel.outputs["Fac"], mix_sheen.inputs["Fac"])
    links.new(mix_sheen.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.32
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.35
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def build_materials():
    mats = {}
    mats["mustard"] = make_material("Mustard_Satin", COLOR_MUSTARD, metallic=0.9, roughness=0.32, coat=0.25)
    mats["mustard_hi"] = make_material("Mustard_Trim", COLOR_MUSTARD_HI, metallic=0.95, roughness=0.16, coat=0.4)
    mats["leaf"] = make_leaf_gradient_material("Leaf_Gradient", center_color=(0.30, 0.58, 0.40), edge_color=COLOR_LEAF)
    mats["leaf_dark"] = make_material("Leaf_Vein", COLOR_LEAF_DARK, metallic=0.0, roughness=0.35, coat=0.2)
    return mats


def add_bevel(obj, width=0.008, segments=3):
    mod = obj.modifiers.new("Bevel", 'BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    mod.angle_limit = math.radians(35)
    mod = obj.modifiers.new("Smooth", 'SUBSURF')
    mod.levels = 2
    mod.render_levels = 2
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    if hasattr(obj.data, "use_auto_smooth"):
        obj.data.use_auto_smooth = True
        bpy.ops.object.shade_smooth()
    else:
        try:
            bpy.ops.object.shade_auto_smooth()
        except Exception:
            bpy.ops.object.shade_smooth()


def add_tapered_tin(name, r_bottom, r_top, height, z_offset, mat):
    bpy.ops.mesh.primitive_cone_add(radius1=r_bottom, radius2=r_top, depth=height, location=(0, 0, z_offset), vertices=64)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    add_bevel(obj, width=0.008)
    return obj


def add_rim_lip(name, radius, z_offset, mats, tube_radius=0.025):
    bpy.ops.mesh.primitive_torus_add(location=(0, 0, z_offset), major_radius=radius, minor_radius=tube_radius,
                                     major_segments=64, minor_segments=12)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mats["mustard_hi"])
    return obj


def add_lid(z_offset, radius, mats):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=(0, 0, z_offset), segments=48, ring_count=24)
    lid = bpy.context.active_object
    lid.name = "Lid_Dome"
    lid.scale.z = 0.32
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(lid.data)
    bm.faces.ensure_lookup_table()
    verts_below = [v for v in bm.verts if v.co.z < 0]
    bmesh.ops.delete(bm, geom=verts_below, context='VERTS')
    bmesh.update_edit_mesh(lid.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    lid.data.materials.append(mats["mustard"])
    add_bevel(lid, width=0.006)

    bpy.ops.mesh.primitive_torus_add(location=(0, 0, z_offset + radius * 0.18), rotation=(math.radians(90), 0, 0),
                                     major_radius=radius * 0.14, minor_radius=radius * 0.035,
                                     major_segments=24, minor_segments=8)
    knob = bpy.context.active_object
    knob.name = "Lid_Knob"
    knob.data.materials.append(mats["mustard_hi"])
    return lid, knob


def add_handle(mats, span=0.85, height=0.85, tube_radius=0.022):
    curve = bpy.data.curves.new("Handle_Curve", type='CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = tube_radius
    curve.bevel_resolution = 8
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(4)
    pts = [(-span, 0, 0.0), (-span, 0, height * 0.55), (0, 0, height), (span, 0, height * 0.55), (span, 0, 0.0)]
    for i, p in enumerate(pts):
        bp = spline.bezier_points[i]
        bp.co = Vector(p)
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new("Handle", curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mats["mustard_hi"])
    return obj


def add_spring_clip(name, x, mats, height=2.5):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0.97, 0))
    bar = bpy.context.active_object
    bar.name = name
    bar.scale = (0.035, 0.012, height / 2)
    bar.data.materials.append(mats["mustard_hi"])
    add_bevel(bar, width=0.006, segments=2)

    tabs = []
    for tz, ty in ((height / 2, 0.90), (-height / 2, 0.90)):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, ty, tz))
        tab = bpy.context.active_object
        tab.name = f"{name}_Tab"
        tab.scale = (0.04, 0.05, 0.03)
        tab.data.materials.append(mats["mustard_hi"])
        add_bevel(tab, width=0.004, segments=2)
        tabs.append(tab)
    return [bar] + tabs


def build_tiffin(mats):
    empty = bpy.data.objects.new("Tiffin_Box", None)
    bpy.context.collection.objects.link(empty)

    r0, r1, r2, r3 = 1.0, 0.94, 0.90, 0.86
    tin_h = 0.62
    gap = 0.03

    parts = []
    z = 0.0
    tin1 = add_tapered_tin("Tin_Bottom", r0, r1, tin_h, z + tin_h / 2, mats["mustard"])
    parts.append(tin1)
    z += tin_h + gap
    parts.append(add_rim_lip("Rim_1", r1 * 1.02, z, mats))

    tin2 = add_tapered_tin("Tin_Middle", r1, r2, tin_h, z + tin_h / 2, mats["mustard"])
    parts.append(tin2)
    z += tin_h + gap
    parts.append(add_rim_lip("Rim_2", r2 * 1.02, z, mats))

    tin3 = add_tapered_tin("Tin_Top", r2, r3, tin_h, z + tin_h / 2, mats["mustard"])
    parts.append(tin3)
    z += tin_h

    lid_z = z + 0.02
    lid, knob = add_lid(lid_z, r3 * 0.97, mats)
    parts += [lid, knob]

    handle = add_handle(mats, span=r3 * 0.75, height=lid_z + 0.7, tube_radius=0.022)
    parts.append(handle)

    total_h = tin_h * 3 + gap * 2
    for name, x in (("Clip_Left", -r1 * 0.99), ("Clip_Right", r1 * 0.99)):
        parts += add_spring_clip(name, x, mats, height=total_h * 0.92)

    for obj in parts:
        obj.parent = empty

    empty["handle_top_z"] = lid_z + 0.7
    empty["tin_top_radius"] = r3
    return empty, lid_z


def _spine_point(t, length, curve_amount=0.18):
    x = t * length
    y = curve_amount * math.sin(math.pi * t) * length * 0.15
    z = 0.10 * math.sin(math.pi * t * 0.9) * (t ** 0.6)
    return x, y, z


def build_leaf(mats, z_base=1.15):
    length = 2.5
    max_width = 0.62
    n = 40

    verts_top, verts_bottom = [], []
    for i in range(n + 1):
        t = i / n
        sx, sy, sz = _spine_point(t, length)
        base_taper = min(1.0, t / 0.12)
        tip_taper = (1 - t) ** 0.55
        w = max_width * base_taper * tip_taper
        nx, ny = -math.cos(math.pi * t) * 0.35, 1.0
        norm = math.hypot(nx, ny)
        nx, ny = nx / norm, ny / norm
        verts_top.append(Vector((sx + nx * w, sy + ny * w, sz)))
        verts_bottom.append(Vector((sx - nx * w, sy - ny * w, sz)))

    bm = bmesh.new()
    bv_top = [bm.verts.new(v) for v in verts_top]
    bv_bottom = [bm.verts.new(v) for v in verts_bottom]
    bm.verts.ensure_lookup_table()
    for i in range(n):
        bm.faces.new((bv_top[i], bv_top[i + 1], bv_bottom[i + 1], bv_bottom[i]))
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.02)

    mesh = bpy.data.meshes.new("Leaf_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    leaf = bpy.data.objects.new("Banana_Leaf", mesh)
    bpy.context.collection.objects.link(leaf)
    leaf.data.materials.append(mats["leaf"])
    add_bevel(leaf, width=0.005, segments=2)

    midrib = bpy.data.curves.new("Midrib_Curve", type='CURVE')
    midrib.dimensions = '3D'
    midrib.bevel_depth = 0.018
    midrib.bevel_resolution = 6
    spline = midrib.splines.new('BEZIER')
    control_ts = [0.0, 0.25, 0.5, 0.75, 0.97]
    spline.bezier_points.add(len(control_ts) - 1)
    for i, t in enumerate(control_ts):
        bp = spline.bezier_points[i]
        bp.co = Vector(_spine_point(t, length)) + Vector((0, 0, 0.015))
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    midrib_obj = bpy.data.objects.new("Leaf_Midrib", midrib)
    bpy.context.collection.objects.link(midrib_obj)
    midrib_obj.data.materials.append(mats["leaf_dark"])
    midrib_obj.parent = leaf

    n_veins = 9
    for i in range(1, n_veins + 1):
        t = i / (n_veins + 1)
        sx, sy, sz = _spine_point(t, length)
        w = max_width * min(1.0, t / 0.12) * ((1 - t) ** 0.55) * 0.92
        for side in (1, -1):
            vein = bpy.data.curves.new(f"Vein_{i}_{side}", type='CURVE')
            vein.dimensions = '3D'
            vein.bevel_depth = 0.006
            vein.bevel_resolution = 3
            sp = vein.splines.new('BEZIER')
            sp.bezier_points.add(1)
            p0 = Vector((sx, sy, sz + 0.008))
            p1 = Vector((sx + 0.15, sy + side * w, sz + 0.005))
            sp.bezier_points[0].co = p0
            sp.bezier_points[1].co = p1
            for bp in sp.bezier_points:
                bp.handle_left_type = bp.handle_right_type = 'AUTO'
            vein_obj = bpy.data.objects.new(f"Vein_{i}_{side}", vein)
            bpy.context.collection.objects.link(vein_obj)
            vein_obj.data.materials.append(mats["leaf_dark"])
            vein_obj.parent = leaf

    leaf.rotation_euler = (math.radians(6), math.radians(-12), math.radians(32))
    leaf.location = (0.42, -0.05, z_base)
    leaf.scale = (0.82, 0.82, 0.82)
    return leaf


def build_lighting_and_world():
    world = bpy.data.worlds.new("Lunchmate_World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (*hex_to_linear(COLOR_BG), 1.0)
    bg.inputs["Strength"].default_value = 1.0

    def add_area(name, location, energy, size, rotation=(0, 0, 0)):
        bpy.ops.object.light_add(type='AREA', location=location, rotation=rotation)
        light = bpy.context.active_object
        light.name = name
        light.data.energy = energy
        light.data.size = size
        return light

    add_area("Key_Light", (3.5, -3.0, 4.0), 600, 2.5, rotation=(math.radians(50), 0, math.radians(45)))
    add_area("Fill_Light", (-4.0, -2.0, 2.0), 200, 3.0, rotation=(math.radians(60), 0, math.radians(-40)))
    add_area("Rim_Light", (0, 3.5, 3.0), 350, 2.0, rotation=(math.radians(-60), 0, math.radians(180)))


def build_cameras(target_z=1.0):
    target = bpy.data.objects.new("Framing_Target", None)
    target.location = (0, 0, target_z)
    bpy.context.collection.objects.link(target)

    def add_tracked_cam(name, location, ortho=False, ortho_scale=None, lens=50):
        bpy.ops.object.camera_add(location=location)
        cam = bpy.context.active_object
        cam.name = name
        cam.data.lens = lens
        if ortho:
            cam.data.type = 'ORTHO'
            cam.data.ortho_scale = ortho_scale
        con = cam.constraints.new('TRACK_TO')
        con.target = target
        con.track_axis = 'TRACK_NEGATIVE_Z'
        con.up_axis = 'UP_Y'
        return cam

    cam_hero = add_tracked_cam("CAM_Hero", (5.2, -5.6, 3.6), lens=50)
    cam_logo = add_tracked_cam("CAM_Logo", (0, -8.0, target_z), ortho=True, ortho_scale=4.4)
    return cam_hero, cam_logo


def apply_render_engine(scene, samples):
    if USE_EEVEE:
        try:
            scene.render.engine = 'BLENDER_EEVEE_NEXT'
        except Exception:
            scene.render.engine = 'BLENDER_EEVEE'
        if hasattr(scene, "eevee"):
            scene.eevee.taa_render_samples = samples
    else:
        scene.render.engine = 'CYCLES'
        try:
            scene.cycles.device = 'GPU'
        except Exception:
            pass
        scene.cycles.samples = samples


def render_still(scene, camera, filepath, transparent, res, samples):
    apply_render_engine(scene, samples)
    scene.camera = camera
    scene.render.resolution_x = res
    scene.render.resolution_y = res
    scene.render.film_transparent = transparent
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '16'
    scene.render.filepath = filepath
    bpy.ops.render.render(write_still=True)


def render_outputs(cam_hero, cam_logo):
    scene = bpy.context.scene
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    outputs = []

    # Fast previews
    hero_preview = os.path.join(OUTPUT_DIR, "lunchmate_hero_render.png")
    logo_preview = os.path.join(OUTPUT_DIR, "lunchmate_logo_render.png")
    render_still(scene, cam_hero, hero_preview, False, RENDER_RES, RENDER_SAMPLES)
    render_still(scene, cam_logo, logo_preview, True, RENDER_RES, RENDER_SAMPLES)
    outputs += [
        {"name": "hero_preview", "file": hero_preview, "resolution": RENDER_RES, "transparent": False},
        {"name": "logo_preview", "file": logo_preview, "resolution": RENDER_RES, "transparent": True},
    ]

    # Guaranteed high-quality 2D exports from CAM_Logo
    logo_print = os.path.join(OUTPUT_DIR, "lunchmate_logo_PRINT_4K.png")
    render_still(scene, cam_logo, logo_print, True, POSTER_RES, POSTER_SAMPLES)
    outputs.append({"name": "logo_print_4k", "file": logo_print, "resolution": POSTER_RES, "transparent": True})

    if EXPORT_HIGH_RES_POSTER:
        hero_print = os.path.join(OUTPUT_DIR, "lunchmate_hero_POSTER_4K.png")
        render_still(scene, cam_hero, hero_print, False, POSTER_RES, POSTER_SAMPLES)
        outputs.append({"name": "hero_print_4k", "file": hero_print, "resolution": POSTER_RES, "transparent": False})

    if EXPORT_ULTRA_RES_POSTER:
        logo_8k = os.path.join(OUTPUT_DIR, "lunchmate_logo_PRINT_8K.png")
        hero_8k = os.path.join(OUTPUT_DIR, "lunchmate_hero_POSTER_8K.png")
        render_still(scene, cam_logo, logo_8k, True, ULTRA_POSTER_RES, ULTRA_POSTER_SAMPLES)
        render_still(scene, cam_hero, hero_8k, False, ULTRA_POSTER_RES, ULTRA_POSTER_SAMPLES)
        outputs += [
            {"name": "logo_print_8k", "file": logo_8k, "resolution": ULTRA_POSTER_RES, "transparent": True},
            {"name": "hero_print_8k", "file": hero_8k, "resolution": ULTRA_POSTER_RES, "transparent": False},
        ]

    return outputs


def export_web_glb():
    if not EXPORT_GLB:
        return None
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    glb_path = os.path.join(OUTPUT_DIR, "lunchmate_3d.glb")
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False,
    )
    print(f"Web asset exported: {glb_path}")
    return glb_path


def write_manifest(render_outputs, blend_path, glb_path):
    manifest = {
        "palette": PALETTE_NAME,
        "output_dir": OUTPUT_DIR,
        "blend": blend_path,
        "glb": glb_path,
        "renders": render_outputs,
    }
    path = os.path.join(OUTPUT_DIR, "export_manifest.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"Manifest saved: {path}")


def main():
    clear_scene()
    mats = build_materials()
    _, lid_z = build_tiffin(mats)
    build_leaf(mats, z_base=lid_z + 0.45)
    build_lighting_and_world()
    cam_hero, cam_logo = build_cameras(target_z=lid_z * 0.55)

    renders = render_outputs(cam_hero, cam_logo)
    glb_path = export_web_glb()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    blend_path = os.path.join(OUTPUT_DIR, "lunchmate_3d.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    write_manifest(renders, blend_path, glb_path)
    print(f"Done. Saved: {blend_path}")


if __name__ == "__main__":
    main()
