"""
Renders a Nestora house (house.obj + scene.json from scripts/export_house_scene.mts) in Blender, headless:
golden-hour sun and sky, procedural finishes (brick, stone, wood, tiles...), a three-quarter view from the road.
Optionally bakes the lighting into one texture and exports a compressed .glb for the web 3D view.

  blender -b -P render_house.py -- <house_dir> <out_dir> [--quality test|full] [--bake]

test: 640x360, 32 samples (seconds) - always run first; full: 1920x1080, 256 samples, denoised.
Blender 4.2 LTS.
"""
import json
import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
HOUSE, OUT = argv[0], argv[1]
QUALITY = argv[argv.index("--quality") + 1] if "--quality" in argv else "test"
BAKE = "--bake" in argv
os.makedirs(OUT, exist_ok=True)
scene_info = json.load(open(os.path.join(HOUSE, "scene.json"), encoding="utf-8"))
hid = scene_info["id"]


def hex_rgba(h, a=1.0):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, a)


# ---- scene
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
for dev in ("OPTIX", "CUDA"):
    try:
        prefs.compute_device_type = dev
        prefs.get_devices()
        if any(d.type == dev for d in prefs.devices):
            for d in prefs.devices:
                d.use = True
            sc.cycles.device = "GPU"
            break
    except Exception:
        continue
full = QUALITY == "full"
sc.cycles.samples = 256 if full else 32
sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = (1920, 1080) if full else (640, 360)
sc.view_settings.view_transform = "Standard"
sc.view_settings.exposure = -0.4

bpy.ops.wm.obj_import(filepath=os.path.join(HOUSE, "house.obj"), forward_axis="Y", up_axis="Z")
house = [o for o in sc.objects if o.type == "MESH"]


# ---- materials: base values from the web view, plus procedural detail per finish
def finish_nodes(nt, bsdf, finish, base):
    """Adds a procedural texture for a wall or roof finish, feeding Base Color (and a little bump)."""
    n, link = nt.nodes, nt.links
    coord = n.new("ShaderNodeTexCoord")
    sep = n.new("ShaderNodeSeparateXYZ")
    link.new(coord.outputs["Object"], sep.inputs["Vector"])
    along = n.new("ShaderNodeMath"); along.operation = "ADD"
    link.new(sep.outputs["X"], along.inputs[0]); link.new(sep.outputs["Y"], along.inputs[1])
    comb = n.new("ShaderNodeCombineXYZ")
    link.new(along.outputs["Value"], comb.inputs["X"]); link.new(sep.outputs["Z"], comb.inputs["Y"])
    mapping = n.new("ShaderNodeMapping")
    link.new(comb.outputs["Vector"], mapping.inputs["Vector"])
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    link.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    if finish in ("exposed_brick", "laterite", "stone_cladding"):
        t = n.new("ShaderNodeTexBrick")
        size = {"exposed_brick": (0.23, 0.075), "laterite": (0.4, 0.2), "stone_cladding": (0.5, 0.25)}[finish]
        t.inputs["Brick Width"].default_value, t.inputs["Row Height"].default_value = size
        t.inputs["Mortar Size"].default_value = 0.01
        t.inputs["Color1"].default_value = base
        t.inputs["Color2"].default_value = tuple(c * 0.8 for c in base[:3]) + (1,)
        t.inputs["Mortar"].default_value = (0.55, 0.52, 0.48, 1)
        t.inputs["Scale"].default_value = 1.0
        link.new(mapping.outputs["Vector"], t.inputs["Vector"])
        link.new(t.outputs["Color"], bsdf.inputs["Base Color"])
        link.new(t.outputs["Fac"], bump.inputs["Height"])
    elif finish in ("wood_cladding", "charred_timber", "metal_cladding", "wood_shingle", "metal_seam"):
        t = n.new("ShaderNodeTexWave")
        t.wave_type = "BANDS"
        t.bands_direction = "X" if finish != "wood_shingle" else "Y"
        t.inputs["Scale"].default_value = 6 if "metal" in finish else 10
        link.new(mapping.outputs["Vector"], t.inputs["Vector"])
        ramp = n.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = tuple(c * 0.75 for c in base[:3]) + (1,)
        ramp.color_ramp.elements[1].color = base
        link.new(t.outputs["Fac"], ramp.inputs["Fac"])
        link.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
        link.new(t.outputs["Fac"], bump.inputs["Height"])
    elif finish in ("mangalore_tile", "clay_barrel", "slate"):
        t = n.new("ShaderNodeTexBrick")
        t.inputs["Brick Width"].default_value, t.inputs["Row Height"].default_value = (0.25, 0.2)
        t.inputs["Mortar Size"].default_value = 0.006
        t.inputs["Color1"].default_value = base
        t.inputs["Color2"].default_value = tuple(c * 0.85 for c in base[:3]) + (1,)
        t.inputs["Mortar"].default_value = tuple(c * 0.5 for c in base[:3]) + (1,)
        link.new(mapping.outputs["Vector"], t.inputs["Vector"])
        link.new(t.outputs["Color"], bsdf.inputs["Base Color"])
        link.new(t.outputs["Fac"], bump.inputs["Height"])
    else:  # plaster, stucco, concrete, adobe: subtle noise
        t = n.new("ShaderNodeTexNoise")
        t.inputs["Scale"].default_value = 40 if finish != "exposed_concrete" else 8
        link.new(mapping.outputs["Vector"], t.inputs["Vector"])
        mix = n.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.inputs["Factor"].default_value = 0.12
        mix.inputs["A"].default_value = base
        link.new(t.outputs["Color"], mix.inputs["B"])
        link.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
        link.new(t.outputs["Fac"], bump.inputs["Height"])


for mat in bpy.data.materials:
    info = scene_info["materials"].get(mat.name)
    if not info:
        continue
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF") or nt.nodes.new("ShaderNodeBsdfPrincipled")
    base = hex_rgba(info["color"])
    bsdf.inputs["Base Color"].default_value = base
    bsdf.inputs["Roughness"].default_value = info["roughness"]
    bsdf.inputs["Metallic"].default_value = info["metalness"]
    if info["kind"] == "glass":
        bsdf.inputs["Transmission Weight"].default_value = 0.9
        bsdf.inputs["Roughness"].default_value = 0.02
        bsdf.inputs["IOR"].default_value = 1.45
    elif info["opacity"] < 1:
        bsdf.inputs["Alpha"].default_value = info["opacity"]
    if info.get("finish") and info["finish"] != "glass_curtain":
        finish_nodes(nt, bsdf, info["finish"], base)

# ---- site: ground, road
x0, y0, x1, y1 = scene_info["plot"]
bpy.ops.mesh.primitive_plane_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, -0.16))
g = sc.objects[-1] if False else bpy.context.active_object
g.scale = (4000, 4000, 1)  # to the horizon
gm = bpy.data.materials.new("ground"); gm.use_nodes = True
gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = hex_rgba("#7E9A5A")
gm.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 1
g.data.materials.append(gm)
bpy.ops.mesh.primitive_plane_add(size=1, location=((x0 + x1) / 2, y0 - 4, -0.15))
r = bpy.context.active_object
r.scale = ((x1 - x0) + 40, 7, 1)
rm = bpy.data.materials.new("road"); rm.use_nodes = True
rm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = hex_rgba("#55585C")
r.data.materials.append(rm)

# ---- golden-hour sun and sky (sun low over the front-right, warm)
world = bpy.data.worlds.new("sky"); sc.world = world; world.use_nodes = True
sky = world.node_tree.nodes.new("ShaderNodeTexSky")
sky.sky_type = "NISHITA"
sky.sun_elevation = math.radians(14)
sky.sun_rotation = math.radians(225)
sky.sun_intensity = 0.6
wn, wl = world.node_tree.nodes, world.node_tree.links
light_bg = wn["Background"]; light_bg.inputs["Strength"].default_value = 0.35
wl.new(sky.outputs["Color"], light_bg.inputs["Color"])
cam_bg = wn.new("ShaderNodeBackground"); cam_bg.inputs["Strength"].default_value = 1.0
grad = wn.new("ShaderNodeTexGradient"); gco = wn.new("ShaderNodeTexCoord"); gsep = wn.new("ShaderNodeSeparateXYZ")
wl.new(gco.outputs["Generated"], gsep.inputs["Vector"])
ramp = wn.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].color = hex_rgba("#F6EBDD"); ramp.color_ramp.elements[1].color = hex_rgba("#8FB4D8")
wl.new(gsep.outputs["Z"], ramp.inputs["Fac"]); wl.new(ramp.outputs["Color"], cam_bg.inputs["Color"])
lp = wn.new("ShaderNodeLightPath"); mix = wn.new("ShaderNodeMixShader")
wl.new(lp.outputs["Is Camera Ray"], mix.inputs["Fac"]); wl.new(light_bg.outputs["Background"], mix.inputs[1]); wl.new(cam_bg.outputs["Background"], mix.inputs[2])
wl.new(mix.outputs["Shader"], wn["World Output"].inputs["Surface"])
sun = bpy.data.lights.new("sun", "SUN"); sun.energy = 4.0; sun.angle = math.radians(1.5); sun.color = (1.0, 0.82, 0.62)
so = bpy.data.objects.new("sun", sun); sc.collection.objects.link(so)
so.rotation_euler = (math.radians(90 - 14), 0, math.radians(225 - 180))

# ---- camera: three-quarter view from the road, front-right, eye a little above the parapet
mins = Vector((min(v[0] for o in house for v in o.bound_box), min(v[1] for o in house for v in o.bound_box), 0))
maxs = Vector((max(v[0] for o in house for v in o.bound_box), max(v[1] for o in house for v in o.bound_box), scene_info["roof_top_m"]))
center = (mins + maxs) / 2
span = max(maxs.x - mins.x, maxs.y - mins.y, maxs.z * 1.4)
# like an architectural photo: from across the road at a little above eye level, wide lens, house filling the frame
cam = bpy.data.cameras.new("cam"); cam.lens = 28
co = bpy.data.objects.new("cam", cam); sc.collection.objects.link(co); sc.camera = co
co.location = Vector((center.x + span * 0.42, mins.y - span * 0.62, 1.8))  # close enough that the house fills the frame
direction = Vector((center.x, center.y, maxs.z * 0.42)) - co.location
co.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

sc.render.filepath = os.path.join(OUT, f"{hid}_{QUALITY}.png")
bpy.ops.render.render(write_still=True)
print("rendered", sc.render.filepath)

# ---- optional: bake lighting into one texture and export a compressed glb for the web
if BAKE:
    bpy.ops.object.select_all(action="DESELECT")
    for o in house:
        o.select_set(True)
    bpy.context.view_layer.objects.active = house[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.002)
    bpy.ops.object.mode_set(mode="OBJECT")
    img = bpy.data.images.new("baked", 4096 if full else 1024, 4096 if full else 1024)
    for mat in obj.data.materials:  # every material bakes into the same image
        nt = mat.node_tree
        tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = img
        nt.nodes.active = tex
    sc.cycles.samples = 128 if full else 16
    bpy.ops.object.bake(type="COMBINED", margin=4)
    img.filepath_raw = os.path.join(OUT, f"{hid}_baked.png"); img.file_format = "PNG"; img.save()
    # one unlit-looking material using the baked image
    baked = bpy.data.materials.new("baked"); baked.use_nodes = True
    nt = baked.node_tree
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = img
    nt.links.new(t.outputs["Color"], nt.nodes["Principled BSDF"].inputs["Base Color"])
    nt.nodes["Principled BSDF"].inputs["Roughness"].default_value = 1
    obj.data.materials.clear(); obj.data.materials.append(baked)
    bpy.ops.object.select_all(action="DESELECT"); obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, f"{hid}.glb"), use_selection=True, export_draco_mesh_compression_enable=True,
                              export_image_format="JPEG")
    print("baked", os.path.join(OUT, f"{hid}.glb"))
