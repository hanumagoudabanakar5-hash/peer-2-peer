"""
Same forecast as predict_today.py, but written to JSON so the React
dashboard can read it directly.

Run this whenever you want the dashboard's forecast panel to reflect
today's weather:

    cd ai
    source venv/bin/activate
    python export_forecast.py

Then copy (or symlink) the output into the frontend's public folder:

    cp forecast.json ../frontend/public/forecast.json
"""
import json
import requests
import joblib
import pandas as pd

LOCATION_NAME = "Bengaluru"
LATITUDE = 12.97
LONGITUDE = 77.59

model = joblib.load("forecaster.pkl")

url = "https://api.open-meteo.com/v1/forecast"
params = {
    "latitude": LATITUDE,
    "longitude": LONGITUDE,
    "hourly": "temperature_2m,cloud_cover,shortwave_radiation",
    "timezone": "auto",
    "forecast_days": 1,
}

print(f"Fetching today's real weather for {LOCATION_NAME}...")
data = requests.get(url, params=params).json()["hourly"]

df = pd.DataFrame({
    "hour": [pd.to_datetime(t).hour for t in data["time"]],
    "temp": data["temperature_2m"],
    "cloud_cover": data["cloud_cover"],
    "radiation": data["shortwave_radiation"],
})

df["predicted_surplus"] = model.predict(df[["hour", "temp", "cloud_cover", "radiation"]]).round(2)
df["role"] = df["predicted_surplus"].apply(lambda s: "SELL" if s > 0 else "BUY")

sell_hours = int((df["predicted_surplus"] > 0).sum())
total_surplus = float(df[df["predicted_surplus"] > 0]["predicted_surplus"].sum())

out = {
    "location": LOCATION_NAME,
    "generated_at": pd.Timestamp.now().isoformat(),
    "sell_hours": sell_hours,
    "total_surplus_kwh": round(total_surplus, 2),
    "hours": df[["hour", "temp", "cloud_cover", "radiation", "predicted_surplus", "role"]].to_dict(
        orient="records"
    ),
}

with open("forecast.json", "w") as f:
    json.dump(out, f, indent=2)

print(f"Wrote forecast.json — {sell_hours} sellable hours, {total_surplus:.2f} kWh total surplus.")
