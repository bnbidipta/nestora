# 3D experience: the seven prompts, adapted to Nestora

| # | Original prompt | Nestora version | Status |
|---|---|---|---|
| 1 | The plan: upload a floor plan, identify rooms, doors, windows, sizes | **Bring your own plan.** The user uploads an existing plan or architect drawing; the tracer (`scripts/trace_plans.py`, OpenCV + OCR, sizes checked against printed dimensions) turns it into rooms, then the same pipeline checks it against the building rules and costs it. | Tracer exists offline; upload flow not built |
| 2 | The build: recreate the home in 3D, walls, furniture, first-person walk | One connected building from the twin: merged walls, door and window openings, slabs, stair, roof parapet, furniture; orbit, walk-through (WASD / joystick) with wall collision. | Done (`lib/house3d.ts`, `components/House3D.tsx`) |
| 3 | The style: furnish in switchable interior styles | **Interior style** switches between the styles the user picked: wall, floor, wood and accent colours from the style catalogue; separate **Paint plan** shows the wall-by-wall paint recommendation. | Done |
| 4 | The light: morning to sunset to night, shadows, indoor lights | **Light** slider over the real sun path for the plot's city and orientation (June / March-September / December), warm low sun at morning and sunset, then night with a light in every room. | Done |
| 5 | The tour: guided walkthrough with room names, sizes, features | **Guided tour** visits every room (living spaces first, then bedrooms and service rooms), with name, size in the chosen units, window direction, floor finish, what furniture fits and how hot it gets. | Done |
| 6 | The final product: welcome screen, floor selection, mobile controls, check against the plan | Welcome screen (tour / walk / outside), floor cutaway and floor choice, phone joystick; the 3D is generated from the same room data as the 2D plan, so it cannot drift from it. | Done |
| 7 | The client: approach builders and architects | **B2B channel:** builders and architects upload their plans (item 1) and get a shareable 3D tour plus rule check and cost estimate for their buyers. Pricing and outreach to decide. | Business decision, nothing built |
