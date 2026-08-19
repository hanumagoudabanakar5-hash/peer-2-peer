import numpy as np
import pandas as pd

np.random.seed(42)  # makes results reproducible

# Simulate 30 days, hourly, for one household
hours = pd.date_range("2026-08-01", periods=30*24, freq="h")

data = []
for t in hours:
    hour = t.hour
    # Solar generation: bell curve peaking at noon, zero at night
    if 6 <= hour <= 18:
        solar = np.sin((hour - 6) / 12 * np.pi) * 5  # peak ~5 kWh at noon
        solar *= np.random.uniform(0.7, 1.0)  # cloud randomness
    else:
        solar = 0.0
    # Consumption: higher morning and evening, lower midday
    base = 1.0
    if 6 <= hour <= 9 or 18 <= hour <= 22:
        base = 2.5  # cooking/lights peak
    consumption = base * np.random.uniform(0.8, 1.2)

    data.append({
        "time": t,
        "hour": hour,
        "solar_kwh": round(solar, 2),
        "consumption_kwh": round(consumption, 2),
        "surplus_kwh": round(solar - consumption, 2)  # positive = can sell
    })

df = pd.DataFrame(data)
df.to_csv("household_data.csv", index=False)
print(df.head(15))
print(f"\nTotal rows: {len(df)}")
print(f"Hours with surplus to sell: {(df['surplus_kwh'] > 0).sum()}")
