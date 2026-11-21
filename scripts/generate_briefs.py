import json
import random
import os

random.seed(42)

TOTAL_BRIEFS = 500

HINGLISH_TEMPLATES = [
    "Mummy ko ghutne mein severe dard hai, ground floor pe bedroom aur attached bathroom compulsory chahiye. Ek golden retriever dog bhi hai.",
    "Budget thoda tight hai boss, but kitchen open aur airy chahiye with pooja mandir facing east.",
    "Bhai 2 car parking chahiye ground pe, upar hum rahenge aur first floor pe rent pe dena hai separate entry ke saath.",
    "Pooja room must be in Ishanya corner. Kitchen SE mein hona mangta hai as per strict vaastu.",
    "Kids ke liye separate bedroom chahiye study table ke saath, aur balcony se garden view dikhna chahiye.",
    "Work from home ke liye sound-proof room chahiye, daily zoom meetings hoti hain. Ground floor pe papa ke liye room.",
    "Humari joint family hai 7 log hain. Badi living room chahiye festivals ke time gatherings ke liye.",
    "Jain family hai, chauvihar follow karte hain toh kitchen mein achhi subah ki dhoop aani chahiye window se.",
    "Modern minimalist look pasand hai, no traditional carvings. Simple straight lines aur bada courtyard.",
    "Papa cannot climb stairs at all. Ground floor master bedroom with grab bars in toilet is needed.",
    "Ghar mein 2 dogs hain so tiling scratch-resistant chahiye. Terrace pe chhota garden banana hai.",
    "Rental income ke liye top floor pe 1BHK separate staircase ke saath nikalna hai.",
    "Budget fixed hai 30 lakh, please cost over-run nahi hona chahiye. Simple durable materials only.",
    "Wife wants a huge open kitchen with island counter and direct access to utility wash area.",
    "East facing entrance chahiye mandir ke saath. Living room double-height ho sake toh best."
]

ENGLISH_TEMPLATES = [
    "We need a peaceful, low-maintenance home with natural cross-ventilation and sunlight in every bedroom.",
    "Looking for a contemporary aesthetic with raw concrete accents, indoor plants, and floor-to-ceiling glass.",
    "Elderly parents moving in with us; ground floor master bedroom is non-negotiable.",
    "Husband and I both work remotely in software; need two dedicated desk spaces with good natural daylight.",
    "Strict Vaastu compliance required for kitchen and master bedroom. Open to modern materials.",
    "Need space for two sedan cars in covered parking and a compact prayer nook in the living area.",
    "Compact plot so we want zero wasted passage space; open plan living and dining preferred.",
    "Require an external staircase to lease out the first floor as a separate 2BHK rental unit.",
    "Seeking a biophilic home with a central light well or courtyard to bring breeze into the living room.",
    "Industrial aesthetic with exposed brick accents and black metal frames preferred.",
    "Need a quiet study for kids' board exams and a guest room for visiting grandparents.",
    "Simple G+1 structure within our modest budget. Focus on durable, flood-resilient ground materials."
]

STYLES_POOL = [
    "japanese", "biophilic", "brutalist", "minimalist",
    "indian_heritage", "scandinavian", "mediterranean", "industrial"
]

def generate_briefs():
    briefs = []
    
    # Counter tallies for distribution verification
    plots_standard = 0
    plots_odd = 0
    hinglish_count = 0
    over_budget_count = 0
    elder_mobility_count = 0
    
    for i in range(1, TOTAL_BRIEFS + 1):
        brief_id = f"b{i:04d}"
        
        # 1. Plot Dimensions & Odds (~10% odd sizes)
        is_odd = random.random() < 0.10
        if is_odd:
            plots_odd += 1
            odd_choices = [(27, 43), (15, 50), (22, 35), (33, 45), (18, 40), (28, 38), (35, 55), (24, 48)]
            width, depth = random.choice(odd_choices)
        else:
            plots_standard += 1
            std_choice = random.choices(
                [(20, 30), (25, 40), (30, 40), (30, 50), (40, 60)],
                weights=[20, 20, 35, 15, 10],
                k=1
            )[0]
            width, depth = std_choice
            
        corner_plot = random.random() < 0.15
        road_width = random.choices([6, 9, 12, 15], weights=[25, 50, 20, 5], k=1)[0]
        facing = random.choices(["E", "N", "W", "S"], weights=[35, 30, 20, 15], k=1)[0]
        
        # 2. Floors & Parking
        if (width * depth) <= 600:
            floors = random.choices([1, 2], weights=[40, 60], k=1)[0]
        elif (width * depth) >= 2000:
            floors = random.choices([2, 3], weights=[50, 50], k=1)[0]
        else:
            floors = random.choices([1, 2, 3], weights=[15, 60, 25], k=1)[0]
            
        parking = random.choices(["car", "two_wheeler", "none"], weights=[70, 20, 10], k=1)[0]
        
        # 3. Family Demographics
        adults = random.choices([1, 2, 3], weights=[15, 65, 20], k=1)[0]
        elders = random.choices([0, 1, 2], weights=[50, 35, 15], k=1)[0]
        elder_mobility = False
        if elders > 0:
            elder_mobility = random.random() < 0.45
            if elder_mobility:
                elder_mobility_count += 1
                
        kids = random.choices([0, 1, 2, 3], weights=[35, 35, 25, 5], k=1)[0]
        pets = random.random() < 0.25
        wfh = random.choices([0, 1, 2], weights=[55, 35, 10], k=1)[0]
        joint = (adults + elders) >= 4 or (adults >= 3 and elders >= 1)
        rental_floor = (floors >= 2) and (random.random() < 0.22)
        
        # 4. Realistic Cost vs Underfunded (~15% deliberately underfunded)
        plot_area = width * depth
        # Estimated realistic built-up area = plot_area * coverage(~0.6) * floors
        est_builtup = plot_area * 0.6 * floors
        realistic_cost = est_builtup * 2300 # ₹2,300/sqft base
        
        is_underfunded = random.random() < 0.15
        if is_underfunded:
            over_budget_count += 1
            # 40% to 65% of realistic cost
            budget = int(round(realistic_cost * random.uniform(0.40, 0.65) / 50000.0) * 50000)
            budget = max(budget, 1200000)
        else:
            budget = int(round(realistic_cost * random.uniform(0.95, 1.40) / 100000.0) * 100000)
            budget = min(max(budget, 1800000), 15000000)
            
        # 5. Traditions
        trad_choice = random.choices(
            ["none", "vaastu", "islamic", "jain", "feng_shui", "biophilic"],
            weights=[25, 48, 12, 8, 4, 3],
            k=1
        )[0]
        traditions = {}
        if trad_choice != "none":
            strength = random.choices(["soft", "strict"], weights=[70, 30], k=1)[0]
            traditions[trad_choice] = strength
            
        # 6. Styles (1 or 2)
        style_count = random.choices([1, 2], weights=[75, 25], k=1)[0]
        selected_styles = random.sample(STYLES_POOL, k=style_count)
        
        # 7. Free Text (Hinglish ~20%)
        is_hinglish = random.random() < 0.20
        if is_hinglish:
            hinglish_count += 1
            free_text = random.choice(HINGLISH_TEMPLATES)
            if elder_mobility and "ghutne" not in free_text and "papa" not in free_text:
                free_text = "Grandparents have severe knee arthritis, ground floor bedroom attached toilet strictly required. " + free_text
        else:
            free_text = random.choice(ENGLISH_TEMPLATES)
            if elder_mobility and "Elderly" not in free_text:
                free_text = "Elderly parent cannot climb stairs; ground floor master bedroom is essential. " + free_text
                
        # 8. Expect
        expect = {}
        if elder_mobility:
            expect["elder_ground_floor_bedroom"] = True
        if is_underfunded:
            expect["over_budget_likely"] = True
        else:
            expect["over_budget_likely"] = False
            
        brief = {
            "id": brief_id,
            "plot_width_ft": width,
            "plot_depth_ft": depth,
            "corner_plot": corner_plot,
            "road_width_m": road_width,
            "facing": facing,
            "floors_wanted": floors,
            "budget_inr": budget,
            "adults": adults,
            "elders": elders,
            "elder_mobility_issue": elder_mobility,
            "kids": kids,
            "pets": pets,
            "wfh_people": wfh,
            "joint_family": joint,
            "rental_floor": rental_floor,
            "parking": parking,
            "traditions": traditions,
            "styles": selected_styles,
            "free_text": free_text,
            "expect": expect
        }
        briefs.append(brief)
        
    out_path = os.path.join("backend", "eval", "briefs.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(briefs, f, indent=2)
        
    print(f"Generated {len(briefs)} test briefs at {out_path}")
    print(f"  Standard plots: {plots_standard} ({plots_standard/TOTAL_BRIEFS*100:.1f}%)")
    print(f"  Odd plots: {plots_odd} ({plots_odd/TOTAL_BRIEFS*100:.1f}%)")
    print(f"  Hinglish free-text: {hinglish_count} ({hinglish_count/TOTAL_BRIEFS*100:.1f}%)")
    print(f"  Deliberately underfunded: {over_budget_count} ({over_budget_count/TOTAL_BRIEFS*100:.1f}%)")
    print(f"  Elder mobility constraint: {elder_mobility_count} ({elder_mobility_count/TOTAL_BRIEFS*100:.1f}%)")

if __name__ == "__main__":
    generate_briefs()
