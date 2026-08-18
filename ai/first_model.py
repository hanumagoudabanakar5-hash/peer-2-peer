import numpy as np
from sklearn.ensemble import GradientBoostingRegressor

X = np.array([[1], [2], [3], [4], [5], [6], [7], [8]])
y = np.array([3.1, 5.9, 9.2, 11.8, 15.1, 18.2, 20.8, 24.1])

model = GradientBoostingRegressor()
model.fit(X, y)

print(f"Predict 4.5: {model.predict([[4.5]])[0]:.2f} kWh")
print(f"Predict 10 (outside training range): {model.predict([[10]])[0]:.2f} kWh")
