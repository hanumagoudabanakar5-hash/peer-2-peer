import requests
import numpy as np
import pandas as pd

np.random.seed(42)

# Bangalore coordinates; pull one month of real hourly weather
url = "https://archive-api.open-meteo.com/v1/archive"
params = {
    "latitude": 12.97,
    "longitude": 77.59,
    "start_date": "2026-07-01",
    "end_date": "2026-07-31",
    "hourly": "temperature_2m,cloud_cover,shortwave_radiation",
    "timezone": "auto"
}

print("Fetching real weather data...")
r = requests.get(url, params=params)
data = r.json()["hourly"]

df = pd.DataFrame({
    "time": pd.to_datetime(data["time"]),
    "temp": data["temperature_2m"],
    "cloud_cover": data["cloud_cover"],
    "radiation": data["shortwave_radiation"],  # this drives solar output
})
df["hour"] = df["time"].dt.hour

# Solar generation now depends on REAL radiation (kW from sunlight)
# shortwave_radiation is W/m^2; scale it to a rooftop's kWh output
df["solar_kwh"] = (df["radiation"] / 1000 * 5).round(2)  # ~5 kWh peak panel

# Consumption pattern (same realistic morning/evening peaks)
def consumption(hour):
    base = 2.5 if (6 <= hour <= 9 or 18 <= hour <= 22) else 1.0
    return round(base * np.random.uniform(0.8, 1.2), 2)

df["consumption_kwh"] = df["hour"].apply(consumption)
df["surplus_kwh"] = (df["solar_kwh"] - df["consumption_kwh"]).round(2)

df.to_csv("training_data.csv", index=False)
print(df[["time", "temp", "cloud_cover", "radiation", "solar_kwh", "surplus_kwh"]].head(15))
print(f"\nTotal rows: {len(df)}")
print(f"Hours with surplus: {(df['surplus_kwh'] > 0).sum()}")
