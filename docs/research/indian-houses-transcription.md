# Indian Houses CAD Floor Plans: Transcription Report

This report documents the data transcription and dimension extraction performed on the **215 architectural CAD floor plans** of Indian residential houses located in `data/extra/indian_houses/images/` (derived from the MIT-licensed Hugging Face Indian floorplan dataset `umesh16071973/Floorplan_Dataset_20022024`).

The transcribed dataset is stored at:
- **Data File**: [room_sizes.jsonl](file:///d:/BidiptaNandan/CodingApps/nestora/data/extra/indian_houses/room_sizes.jsonl)

---

## 1. Executive Summary & Core Metrics

| Metric | Count | Percentage / Note |
| :--- | :---: | :--- |
| **Total Images Processed** | **215** | 100% of images in `images/` directory |
| **Images Done (Transcribed)** | **214** | Valid architectural drawings with printed text |
| **Images Unreadable** | **1** | `NKHL_GF_07.jpg` (CAD text/label layer absent on sheet export) |
| **Total Labelled Rooms** | **3,460** | Average 16.1 rooms per readable floor plan |
| **Rooms with Printed Dimensions** | **2,960** | 85.55% of all transcribed spaces |
| **Rooms without Printed Dimensions** | **500** | 14.45% (`dims_text: null`, `w_ft: null`, `d_ft: null`) |
| **Plans with Drawn Staircase / Steps** | **209** | 97.21% (`has_stair: true`) |
| **Floor Designation** | **GF: 215** | 100% Ground Floor layouts (`_GF_` in filename / title) |

---

## 2. Top 20 Most Common Room Labels

Below are the 20 most frequent room labels transcribed directly from the drawing sheets, along with their occurrences, proportion of total labelled spaces, and dimensional statistics where dimensions were printed:

| Rank | Room Label | Room Count | % of Total Rooms | Median Width $\times$ Depth (ft) | Median Area (sq ft) |
| :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | **TOILET** | 299 | 8.64% | $8.0\text{ ft} \times 6.8\text{ ft}$ | 56.3 sq ft |
| 2 | **KITCHEN** | 173 | 5.00% | $12.4\text{ ft} \times 13.0\text{ ft}$ | 162.0 sq ft |
| 3 | **BEDROOM** | 153 | 4.42% | $12.5\text{ ft} \times 15.5\text{ ft}$ | 193.7 sq ft |
| 4 | **PORCH** | 143 | 4.13% | $18.5\text{ ft} \times 17.0\text{ ft}$ | 325.4 sq ft |
| 5 | **BED ROOM** | 137 | 3.96% | $13.0\text{ ft} \times 14.8\text{ ft}$ | 189.3 sq ft |
| 6 | **LIFT** | 130 | 3.76% | $5.0\text{ ft} \times 5.0\text{ ft}$ | 25.0 sq ft |
| 7 | **PASSAGE** | 124 | 3.58% | $5.8\text{ ft}\text{ (wide / null)}$ | — |
| 8 | **LANDSCAPE** | 120 | 3.47% | $10.7\text{ ft} \times 6.7\text{ ft}$ | 71.7 sq ft |
| 9 | **LAWN** | 119 | 3.44% | $14.5\text{ ft} \times 18.0\text{ ft}$ | 261.0 sq ft |
| 10 | **DRESS** | 110 | 3.18% | $8.3\text{ ft} \times 6.6\text{ ft}$ | 55.8 sq ft |
| 11 | **FORMAL SITTING** | 101 | 2.92% | $16.8\text{ ft} \times 17.0\text{ ft}$ | 286.7 sq ft |
| 12 | **DINING** | 94 | 2.72% | $15.1\text{ ft} \times 15.0\text{ ft}$ | 197.0 sq ft |
| 13 | **INFORMAL SITTING** | 89 | 2.57% | $14.8\text{ ft} \times 16.0\text{ ft}$ | 236.8 sq ft |
| 14 | **W.I.C** (Walk-in Closet) | 69 | 1.99% | $5.8\text{ ft} \times 9.8\text{ ft}$ | 56.8 sq ft |
| 15 | **DRESS/TOILET** | 65 | 1.88% | $11.0\text{ ft} \times 6.0\text{ ft}$ | 66.0 sq ft |
| 16 | **ENTRY FOYER** | 59 | 1.71% | $7.5\text{ ft} \times 8.0\text{ ft}$ | 60.0 sq ft |
| 17 | **DINING AREA** | 57 | 1.65% | $15.8\text{ ft} \times 12.0\text{ ft}$ | 189.6 sq ft |
| 18 | **FAMILY LOUNGE** | 55 | 1.59% | $13.0\text{ ft} \times 15.0\text{ ft}$ | 195.0 sq ft |
| 19 | **STORE** | 53 | 1.53% | $7.0\text{ ft} \times 6.5\text{ ft}$ | 41.6 sq ft |
| 20 | **POOJA ROOM** | 47 | 1.36% | $8.0\text{ ft} \times 6.6\text{ ft}$ | 41.4 sq ft |

> [!NOTE]
> Combining orthographic variants (`BEDROOM` + `BED ROOM` = 290; `DINING` + `DINING AREA` = 151; `DRESS` + `DRESSING` + `W.I.C` = 221; `POOJA ROOM` + `PUJA` = 65) reinforces the standard Indian multi-room residential typology: extensive attached dress/toilet suites, independent formal drawing vs. informal family living zones, car porches, and dedicated puja sanctuaries.

---

## 3. Data Format Specification

Output lines in [room_sizes.jsonl](file:///d:/BidiptaNandan/CodingApps/nestora/data/extra/indian_houses/room_sizes.jsonl) strictly adhere to the requested schema:

```json
{
  "file": "AA_GF_01.jpg",
  "floor": "GF",
  "has_stair": true,
  "rooms": [
    {
      "label": "STORE",
      "dims_text": "4'-9\"x6'-7 1/2\"",
      "w_ft": 4.75,
      "d_ft": 6.625
    },
    {
      "label": "KITCHEN",
      "dims_text": "12'-6\"x11'-9\"",
      "w_ft": 12.5,
      "d_ft": 11.75
    },
    {
      "label": "BED ROOM",
      "dims_text": "15'-7\"x12'-0\"",
      "w_ft": 15.5833,
      "d_ft": 12.0
    },
    {
      "label": "PORCH",
      "dims_text": "24'-0\"/10'-1 1/2\"X16'-5\"/8'-1\"",
      "w_ft": null,
      "d_ft": null
    }
  ]
}
```

### Conversion & Fidelity Rules
1. **Verbatim Text**: Only labels and dimension strings printed on the drawing were transcribed. No dimensions were estimated or invented.
2. **Missing Dimensions**: Spaces with labels but without explicit dimension strings (e.g. `STAIRCASE`, `WATER BODY`, `LOBBY`) have `dims_text: null`, `w_ft: null`, `d_ft: null`.
3. **Exact Decimal Feet Conversion**: Feet and inches strings are converted to decimal feet without rounding distortion:
   - $12\text{'-}6\text{"} \rightarrow 12 + \frac{6}{12} = 12.5\text{ ft}$
   - $11\text{'-}9\text{"} \rightarrow 11 + \frac{9}{12} = 11.75\text{ ft}$
   - $10\text{'-}7\frac{1}{2}\text{"} \rightarrow 10 + \frac{7.5}{12} = 10.625\text{ ft}$
   - $6\text{'-}7\frac{1}{2}\text{"} \rightarrow 6 + \frac{7.5}{12} = 6.625\text{ ft}$
   - Compound / non-rectangular dimensions (e.g. stepped porches with slash strings like `24'-0\"/10'-1 1/2\"X16'-5\"/8'-1\"`) preserve the exact `dims_text` and set `w_ft` / `d_ft` to `null` to avoid false rectangular assumptions.

---

## 4. Unreadable Image Audit

- **File**: `NKHL_GF_07.jpg`
- **Audit Findings**: The underlying CAD file for `NKHL_GF_07.jpg` was exported with the room annotation layer turned off. While wall geometry, door swings, stair threads, and bathroom fixtures are rendered, no room text is printed on the sheet (except a solitary `"CONSOLE"` callout and boundary plot dimension `"75'-0\""`). In accordance with the instruction (*"Never estimate or invent a size: if a room has no printed dimension, give dims_text null"*), this image is logged with `"rooms": []`.
