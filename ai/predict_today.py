import requests
import joblib
import pandas as pd

model = joblib.load("forecaster.pkl")

# Pull TODAY's real weather forecast for Bangalore
url = "https://api.open-meteo.com/v1/forecast"
params = {
    "latitude": 12.97,
    "longitude": 77.59,
    "hourly": "temperature_2m,cloud_cover,shortwave_radiation",
    "timezone": "auto",
    "forecast_days": 1
}

print("Fetching today's real weather for Bangalore...")
data = requests.get(url, params=params).json()["hourly"]

df = pd.DataFrame({
    "hour": [pd.to_datetime(t).hour for t in data["time"]],
    "temp": data["temperature_2m"],
    "cloud_cover": data["cloud_cover"],
    "radiation": data["shortwave_radiation"],
})

# Predict surplus for every hour of today
df["predicted_surplus"] = model.predict(df[["hour", "temp", "cloud_cover", "radiation"]]).round(2)
df["role"] = df["predicted_surplus"].apply(lambda s: "SELL" if s > 0 else "BUY")

print("\nToday's hourly surplus forecast (real weather):")
print(df[["hour", "cloud_cover", "radiation", "predicted_surplus", "role"]].to_string(index=False))

sell_hours = (df["predicted_surplus"] > 0).sum()
total_surplus = df[df["predicted_surplus"] > 0]["predicted_surplus"].sum()
print(f"\nHours this house can SELL today: {sell_hours}")
print(f"Total sellable surplus today: {total_surplus:.2f} kWh")
