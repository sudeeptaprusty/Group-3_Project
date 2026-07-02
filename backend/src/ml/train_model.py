# -----------------------------------------
# train_model.py
# Run this script to train the model and generate churn_model.pkl
# -----------------------------------------

import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# Training dataset:
# Features: [recency (days), redemptionRatio (0-1), sipStatus (0=active, 1=none, 2=paused, 3=cancelled)]
# Target: Churn label (0 = retention, 1 = churn)
X_train = [
    [10, 0.0, 0], [15, 0.05, 0], [5, 0.1, 0], [25, 0.0, 0], [30, 0.08, 0],
    [12, 0.15, 0], [8, 0.0, 0], [2, 0.02, 0], [28, 0.05, 0], [20, 0.12, 0],
    [45, 0.25, 1], [65, 0.15, 1], [50, 0.35, 2], [55, 0.2, 2], [40, 0.4, 1],
    [70, 0.1, 0], [35, 0.3, 0], [60, 0.05, 2], [48, 0.18, 1], [58, 0.22, 2],
    [95, 0.65, 3], [105, 0.8, 3], [115, 0.75, 3], [91, 0.9, 1], [100, 0.6, 3],
    [120, 0.85, 3], [110, 0.7, 3], [85, 0.55, 3], [112, 0.95, 3], [98, 0.8, 1]
]

y_train = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, # Low-risk targets
    0, 0, 1, 0, 1, 0, 0, 1, 0, 1, # Medium-risk targets
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1  # High-risk targets
]

# Convert training data to pandas DataFrame matching features used in prediction
df = pd.DataFrame(X_train, columns=["recency", "redemption_ratio", "sip_status"])

# Initialize RandomForestClassifier with 100 decision trees
model = RandomForestClassifier(n_estimators=100, max_depth=4, random_state=42)

# Train the model on the dataset
model.fit(df, y_train)

# Resolve path in the script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, "churn_model.pkl")

# Serialize the trained model to churn_model.pkl using joblib
joblib.dump(model, model_path)
print(f"Model successfully trained and saved to: {model_path}")
