"""
Calibrate the climate engine against measured weather: daily solar energy on vertical walls facing each
compass direction, per month, from a TMYx EPW file (hourly measured direct + diffuse radiation).
Output: backend/app/data/climate/<city>_walls.json (monthly kWh/m2/day by direction, plus max temperatures).

    python -m backend.ml.calibrate_climate data/weather/IND_MH_Mumbai-Shivaji.Intl.AP.430030_TMYx.2007-2021.epw mumbai
"""
import json
import math
import os
import sys
from collections import defaultdict

from backend.app.services.engines.climate import sun, wall_insolation

DIRS = {"N": 0, "NE": 45, "E": 90, "SE": 135, "S": 180, "SW": 225, "W": 270, "NW": 315}
DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
ALBEDO = 0.2


def main(path: str, city: str) -> None:
    lines = open(path, encoding="latin-1").read().splitlines()
    loc = lines[0].split(",")
    lat, lon, tz = float(loc[6]), float(loc[7]), float(loc[8])
    sums = defaultdict(float)  # (month, dir) -> Wh/m2
    tmax = defaultdict(list)
    day_max = defaultdict(lambda: -99.0)
    for row in lines[8:]:
        f = row.split(",")
        month, day, hour = int(f[1]), int(f[2]), int(f[3])
        temp, ghi, dni, dhi = float(f[6]), float(f[13]), float(f[14]), float(f[15])
        day_max[(month, day)] = max(day_max[(month, day)], temp)
        doy = sum(DAYS[:month - 1]) + day
        b = math.radians(360 * (doy - 81) / 364)
        eot = 9.87 * math.sin(2 * b) - 7.53 * math.cos(b) - 1.5 * math.sin(b)  # minutes
        solar_hour = (hour - 0.5) + (4 * (lon - 15 * tz) + eot) / 60  # EPW hour h covers h-1..h
        s = sun(lat, doy, solar_hour)
        for d, waz in DIRS.items():
            cos_i = math.cos(math.radians(s["alt"])) * math.cos(math.radians(s["az"] - waz)) if s["alt"] > 0 else 0.0
            sums[(month, d)] += dni * max(cos_i, 0) + 0.5 * dhi + 0.5 * ALBEDO * ghi  # isotropic sky + ground
    for (m, _), t in day_max.items():
        tmax[m].append(t)
    out = {"source": os.path.basename(path), "latitude": lat,
           "walls_kwh_m2_day": {m: {d: round(sums[(m, d)] / DAYS[m - 1] / 1000, 2) for d in DIRS} for m in range(1, 13)},
           "mean_daily_max_c": {m: round(sum(tmax[m]) / len(tmax[m]), 1) for m in range(1, 13)},
           "method": "Measured hourly DNI/DHI/GHI (TMYx 2007-2021) on vertical walls, isotropic sky, albedo 0.2."}
    os.makedirs("backend/app/data/climate", exist_ok=True)
    with open(f"backend/app/data/climate/{city}_walls.json", "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=1)
    may = out["walls_kwh_m2_day"][5]
    print("May measured:", may)
    print("May clear-sky model:", {d: wall_insolation(lat, 135, az)["kwh_m2"] for d, az in DIRS.items()})
    print("July measured:", out["walls_kwh_m2_day"][7])
    print("mean daily max C:", out["mean_daily_max_c"])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
