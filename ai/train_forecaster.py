import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib

df = pd.read_csv("training_data.csv")

# Features (inputs the model learns from) and target (what it predicts)
features = ["hour", "temp", "cloud_cover", "radiation"]
X = df[features]
y = df["surplus_kwh"]

# Split: train on 80%, test on 20% it has NEVER seen (honest evaluation)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = GradientBoostingRegressor(n_estimators=200, max_depth=4, random_state=42)
model.fit(X_train, y_train)

# How good is it? Test on unseen data
preds = model.predict(X_test)
mae = mean_absolute_error(y_test, preds)
print(f"Model trained on {len(X_train)} hours, tested on {len(X_test)} unseen hours")
print(f"Average prediction error: {mae:.3f} kWh")

# Save the model so Week 3 can load and use it
joblib.dump(model, "forecaster.pkl")
print("Model saved to forecaster.pkl")

# Demo: predict surplus for a sunny midday vs a cloudy night
sunny_noon = pd.DataFrame([{"hour": 12, "temp": 30, "cloud_cover": 10, "radiation": 800}])
cloudy_night = pd.DataFrame([{"hour": 22, "temp": 22, "cloud_cover": 90, "radiation": 0}])
print(f"\nPredicted surplus, sunny noon: {model.predict(sunny_noon)[0]:.2f} kWh (should be positive -> can sell)")
print(f"Predicted surplus, cloudy night: {model.predict(cloudy_night)[0]:.2f} kWh (should be negative -> must buy)")
