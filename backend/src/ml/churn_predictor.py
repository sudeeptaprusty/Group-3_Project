# -----------------------------------------
# churn_predictor.py
# Child script called from randomForest.js
# -----------------------------------------

import sys
import joblib
import pandas as pd

# -----------------------------
# Read command line arguments
# -----------------------------
if len(sys.argv) != 4:
    print(0.15)
    sys.exit()

try:
    recency = float(sys.argv[1])
    redemption_ratio = float(sys.argv[2])
    sip_status = int(sys.argv[3])

except ValueError:
    print(0.15)
    sys.exit()

# -----------------------------
# Load the trained model
# -----------------------------
try:
    model = joblib.load("churn_model.pkl")

except Exception:
    print(0.15)
    sys.exit()

# -----------------------------
# Create customer data
# -----------------------------
customer = pd.DataFrame([{
    "recency": recency,
    "redemption_ratio": redemption_ratio,
    "sip_status": sip_status
}])

# -----------------------------
# Predict churn probability
# -----------------------------
probability = model.predict_proba(customer)[0][1]

# -----------------------------
# Return result to Node.js
# -----------------------------
print(round(probability, 4))
