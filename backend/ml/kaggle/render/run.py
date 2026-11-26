"""
Kaggle job (free GPU): installs Blender 4.2 LTS and renders every house in the private dataset nestora-renders
(made by scripts/export_house_scene.mts, plus scripts/blender/render_house.py copied in). For each house: a quick test
render first; only if it succeeds, the full render (and the bake when the house folder has a "bake" file).
Results go to /kaggle/working/<house_id>/.
"""
import glob
import os
import subprocess
import tarfile
import time
import urllib.request

BLENDER = "https://download.blender.org/release/Blender4.2/blender-4.2.3-linux-x64.tar.xz"
_found = glob.glob("/kaggle/input/**/render_house.py", recursive=True)  # the mount path differs between Kaggle versions
if not _found:
    raise SystemExit("dataset not found; /kaggle/input has: " + str(glob.glob("/kaggle/input/**", recursive=True)[:30]))
DATA = os.path.dirname(_found[0])
OUT = "/kaggle/working"

t0 = time.time()
tar = "/tmp/blender.tar.xz"
urllib.request.urlretrieve(BLENDER, tar)
with tarfile.open(tar) as tf:
    tf.extractall("/tmp")
exe = glob.glob("/tmp/blender-4.2*/blender")[0]
print(f"blender ready in {time.time() - t0:.0f}s", flush=True)
script = os.path.join(DATA, "render_house.py")

for house in sorted(d for d in glob.glob(os.path.join(DATA, "nest_*")) if os.path.isdir(d)):
    hid = os.path.basename(house)
    out = os.path.join(OUT, hid)
    for q in ("test", "full"):
        t = time.time()
        cmd = [exe, "-b", "-P", script, "--", house, out, "--quality", q]
        if q == "full" and os.path.exists(os.path.join(house, "bake")):
            cmd.append("--bake")
        r = subprocess.run(cmd, capture_output=True, text=True)
        tail = (r.stdout + r.stderr).strip().splitlines()[-6:]
        print(f"{hid} {q}: exit {r.returncode} in {time.time() - t:.0f}s", *tail, sep="\n  ", flush=True)
        if r.returncode != 0:
            break  # fix the test before spending GPU time on the full render
print(f"all done in {time.time() - t0:.0f}s")
