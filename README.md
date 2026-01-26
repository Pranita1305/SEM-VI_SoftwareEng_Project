#  Smart Ride Demand Anticipation & Pricing Optimizer (SRDAPO)

SRDAPO is an end-to-end **intelligent ride demand forecasting and pricing optimization system** inspired by Ola/Uber-like platforms. The system predicts ride demand at a **region (zone) level** using time-series and machine learning models, recommends **dynamic pricing (surge)** and use secure APIs with **chatbot integration**.

---

##  Key Objectives

* Predict **ride demand per region and time window** using historical patterns
* Incorporate **weather, traffic and other related features** into forecasting
* Recommend **dynamic pricing / surge factors** based on demand pressure
* Provide **secure APIs** with authentication
* Enable **chatbot-based querying** for demand, pricing and insights
* Incorporate **demand and price visualization using heatmaps**

---

##  Core Features

###  Demand Forecasting

* Short-term seasonal pattern based forecasting using **SARIMA**
* Time based & long-term forecasting using **XGBoost and LSTM**
* Hybrid logic to combine model outputs

###  Pricing Optimization

* ML-based surge price recommendation
* Triggered automatically when demand crosses thresholds

###  Zone Intelligence

* City divided into zones (Bangalore-based synthetic zones)
* KMeans clustering for hotspot detection
* Heatmaps for density based visualization

###  Backend & Security

* FastAPI-based backend
* JWT authentication
* MongoDB for storage
* APScheduler for automated hourly predictions

###  Chatbot Integration (Conceptual)

* Chatbot can answer questions like:

  * "Which zones are in high demand right now?"
  * "Is surge pricing active in Whitefield?"
  * "What is the predicted demand for Zone 3 in next 2 hours?"

---

##  Tech Stack

### Machine Learning

* Python and Libraries(Pandas, Numpy etc)
* Statsmodels (SARIMA)
* XGBoost
* TensorFlow With Keras (LSTM)

### Backend

* FastAPI
* MongoDB
* APScheduler
* JWT Authentication

### Frontend 

* React.js
* Tailwind CSS
* Chart.js / Recharts
* Map visualization (Leaflet / Mapbox)

---

##  Project Architecture (High Level)

```
SRDAPO/
│── ml_models/        # Model training & artifacts
│── backend/          # FastAPI backend + auth + DB
│── data/             # Synthetic & processed datasets
│── dashboards/       
│── frontend/         #  frontend 
│── README.md
│── requirements.txt
```

---

##  How to Run (Backend)

```bash
# Install dependencies
pip install -r requirements.txt

# Start MongoDB (locally)

# Run FastAPI backend
uvicorn backend.api.main:app --reload
```


---

##  API Capabilities

TBD

All sensitive endpoints require JWT authentication.

---

## Author

**Pranita Mahajan(B.Tech CSE,2301151), Pulkit(B.Tech CSE,2301165, Shivang Sharma(B.Tech cse,2301203))**

---

> This project focuses on **system design, ML integration and backend engineering**, not just model accuracy.

