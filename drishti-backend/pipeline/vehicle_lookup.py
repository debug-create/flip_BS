import hashlib
import re
from datetime import datetime, timedelta
import random

# Realistic Indian names pool
FIRST_NAMES = [
    "Rajesh", "Suresh", "Priya", "Anjali", "Mohammed", "Arun",
    "Deepa", "Vikram", "Kavitha", "Ravi", "Sunita", "Arjun",
    "Meena", "Sanjay", "Pooja", "Krishnamurthy", "Lakshmi", "Venkat"
]
LAST_NAMES = [
    "Kumar", "Sharma", "Patel", "Reddy", "Nair", "Iyer",
    "Singh", "Rao", "Gowda", "Naidu", "Pillai", "Hegde",
    "Shetty", "Menon", "Murthy", "Verma", "Gupta", "Krishnan"
]
VEHICLE_MAKES = [
    "Honda", "TVS", "Bajaj", "Hero", "Yamaha", "Suzuki",
    "Royal Enfield", "KTM", "Toyota", "Maruti Suzuki", "Hyundai", "Tata"
]
BIKE_MODELS = {
    "Honda": ["Activa 6G", "CB Shine", "Unicorn 160", "Hornet 2.0"],
    "TVS": ["Jupiter", "Apache RTR 160", "NTorq 125", "Raider 125"],
    "Bajaj": ["Pulsar 150", "Pulsar NS200", "Platina 110", "CT100"],
    "Hero": ["Splendor Plus", "HF Deluxe", "Passion Pro", "Glamour"],
    "Yamaha": ["FZ-S", "MT-15", "R15", "Fascino 125"],
    "Suzuki": ["Access 125", "Gixxer 150", "Burgman Street"],
    "Royal Enfield": ["Classic 350", "Meteor 350", "Thunderbird 350"],
    "KTM": ["Duke 200", "Duke 390", "RC 200"],
}
CAR_MODELS = {
    "Toyota": ["Innova Crysta", "Fortuner", "Camry", "Etios"],
    "Maruti Suzuki": ["Swift", "Baleno", "Dzire", "Alto K10", "Brezza"],
    "Hyundai": ["i20", "Creta", "Venue", "Verna", "Grand i10"],
    "Tata": ["Nexon", "Punch", "Altroz", "Tiago", "Harrier"],
}
FUEL_TYPES = ["Petrol", "Petrol", "Petrol", "Diesel", "EV", "CNG"]
COLOURS = [
    "Black", "White", "Silver", "Red", "Blue",
    "Grey", "Pearl White", "Matte Black", "Racing Red"
]
BENGALURU_AREAS = [
    "Whitefield, Bengaluru",
    "Koramangala, Bengaluru",
    "HSR Layout, Bengaluru",
    "Indiranagar, Bengaluru",
    "Malleshwaram, Bengaluru",
    "JP Nagar, Bengaluru",
    "Electronic City, Bengaluru",
    "Marathahalli, Bengaluru",
    "Jayanagar, Bengaluru",
    "BTM Layout, Bengaluru",
    "Yelahanka, Bengaluru",
    "Hebbal, Bengaluru",
]

def _seed_from_plate(plate_text: str) -> int:
    """Generate deterministic seed from plate number."""
    cleaned = re.sub(r'[\s\-]', '', plate_text.upper())
    return int(hashlib.md5(cleaned.encode()).hexdigest(), 16) % (2**32)

def lookup_vehicle(plate_text: str) -> dict:
    """
    Deterministic mock vehicle lookup based on plate text.
    Same plate always returns same owner — looks real in demo.
    Returns None if plate is UNREADABLE or UNDETECTED.
    """
    if not plate_text or plate_text in ("UNREADABLE", "UNDETECTED", ""):
        return None

    # Seed random with plate for determinism
    rng = random.Random(_seed_from_plate(plate_text))

    # Determine vehicle type from plate
    # KA plates starting with specific ranges → bike vs car heuristic
    plate_upper = plate_text.upper().replace(" ", "").replace("-", "")
    is_bike = rng.random() < 0.65  # 65% bikes in Bengaluru traffic

    # Pick make and model
    if is_bike:
        make = rng.choice(list(BIKE_MODELS.keys()))
        model = rng.choice(BIKE_MODELS[make])
        vehicle_class = "Motorcycle/Scooter"
        cc = rng.choice([100, 110, 125, 150, 160, 200, 350])
        engine = f"{cc}cc Single Cylinder"
    else:
        make = rng.choice(list(CAR_MODELS.keys()))
        model = rng.choice(CAR_MODELS[make])
        vehicle_class = "Light Motor Vehicle"
        cc = rng.choice([998, 1197, 1248, 1461, 1498, 1956])
        engine = f"{cc}cc {'4-cylinder' if cc > 1000 else '3-cylinder'}"

    # Registration date — 1 to 8 years ago
    days_ago = rng.randint(365, 365 * 8)
    reg_date = (datetime.now() - timedelta(days=days_ago)).strftime("%d-%m-%Y")

    # Insurance expiry — some expired (adds realism)
    ins_days = rng.randint(-60, 730)  # some expired
    ins_expiry = (datetime.now() + timedelta(days=ins_days)).strftime("%d-%m-%Y")
    ins_status = "VALID" if ins_days > 0 else "EXPIRED"

    # Fitness/PUC
    puc_days = rng.randint(-30, 365)
    puc_expiry = (datetime.now() + timedelta(days=puc_days)).strftime("%d-%m-%Y")
    puc_status = "VALID" if puc_days > 0 else "EXPIRED"

    # Owner
    owner_name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
    address = rng.choice(BENGALURU_AREAS)

    # Prior violations — weighted toward some
    prior_count = rng.choices(
        [0, 1, 2, 3, 4, 5, 8, 12],
        weights=[30, 25, 20, 10, 7, 4, 3, 1]
    )[0]

    # Pending challans
    pending = rng.choices(
        [0, 0, 1, 2, 3],
        weights=[50, 25, 15, 7, 3]
    )[0]
    pending_amount = pending * rng.randint(500, 2000)

    return {
        "plate_number": plate_text,
        "registration_date": reg_date,
        "owner_name": owner_name,
        "address": address,
        "vehicle_class": vehicle_class,
        "make": make,
        "model": model,
        "colour": rng.choice(COLOURS),
        "fuel_type": rng.choice(FUEL_TYPES),
        "engine": engine,
        "insurance_status": ins_status,
        "insurance_expiry": ins_expiry,
        "puc_status": puc_status,
        "puc_expiry": puc_expiry,
        "prior_violations": prior_count,
        "repeat_offender": prior_count >= 3,
        "pending_challans": pending,
        "pending_amount_rs": pending_amount,
        "rto_office": "Bengaluru (East) RTO" if rng.random() > 0.5 else "Bengaluru (West) RTO",
        "data_source": "Vahan 4.0 · MoRTH",
        "lookup_status": "SUCCESS",
    }
