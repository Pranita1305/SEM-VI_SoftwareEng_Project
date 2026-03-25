# SRDAPO — Business Logic Layer (BLL) 

> Project: **Smart Ride Demand Anticipation & Pricing Optimizer (SRDAPO)**


---

## Q1) Core functional modules related to the Business Logic Layer and their interaction with Presentation Layer

### 1) Core BLL Modules in SRDAPO

The main business logic in this project is organized into the following modules:

1. **Prediction Retrieval & Availability Module**
   - Implemented mainly in `PredictionRepository`.
   - Responsibilities:
     - Select data source (MongoDB first, then fallback cache).
     - Seed baseline prediction records if DB is empty.
     - Filter prediction records by selected model (`SARIMA`, `XGBoost`, `LSTM`).
   - Why this is BLL:
     - It encodes operational rules such as “always return prediction data even if DB is unavailable”.

2. **Demand/Surge Insight Engine (ChatbotService)**
   - Implemented in `ChatbotService`.
   - Responsibilities:
     - Interpret user intent (`high demand`, `surge`, `forecast`, `summary`).
     - Extract business entities from user message (zone ID, zone name, hour offset).
     - Apply ranking and threshold logic to generate operational insights.
     - Return structured response cards for UI rendering.
   - Why this is BLL:
     - It transforms raw prediction records into domain decisions (hotspot, surge status, forecast response).

3. **API Orchestration Layer (Route-level application services)**
   - Implemented in `/api/predictions` and `/api/chatbot/query` routes.
   - Responsibilities:
     - Receive UI requests.
     - Trigger corresponding BLL operation.
     - Return validated response models.
   - Why this is BLL-facing orchestration:
     - It bridges presentation events with business operations.

4. **Authentication Rule Module**
   - Implemented in JWT utility + auth dependency.
   - Responsibilities:
     - Token creation and verification.
     - Expiry handling.
     - Rejecting invalid/expired users with `401`.
   - Why this is BLL:
     - Access control is a core business rule, not a UI concern.

---

### 2) Interaction with existing Presentation Layer components

The already built React presentation layer components/pages connect to these BLL modules as follows:

#### A. Predictions Page ↔ Prediction Retrieval & Availability Module

- **UI component:** `frontend/src/pages/Predictions.jsx`
- **BLL endpoints:** `GET /api/predictions?model_name=<MODEL>`
- **Interaction flow:**
  1. User switches model tab in Predictions UI.
  2. UI sends model selection to predictions API.
  3. Repository applies model filter and source-selection rule (MongoDB/fallback).
  4. API returns standardized prediction summaries.
  5. UI renders demand chart, peak demand, average demand, and forecast horizon.

#### B. Chatbot Page ↔ Demand/Surge Insight Engine

- **UI component:** `frontend/src/pages/ChatbotPage.jsx`
- **BLL endpoint:** `POST /api/chatbot/query`
- **Interaction flow:**
  1. User sends natural-language query.
  2. API validates payload and forwards to `ChatbotService`.
  3. Service detects intent + extracts zone/time.
  4. Service applies business rules (hotspot ranking, surge check, horizon selection).
  5. API returns structured answer + supporting points + insight cards.
  6. UI displays chat response and insight summaries.

#### C. Dashboard/Zone Views ↔ Prediction Summary Logic

- **UI components:** `Dashboard.jsx`, `ZoneDetails.jsx`, `Heatmap`, `SurgeCard`, `StatCard`
- **BLL source:** same prediction summaries from repository.
- **Interaction flow:**
  1. Dashboard requests current zone-level predictions.
  2. BLL returns demand, surge, trend, and short horizon forecast.
  3. UI maps data to heatmap colors, surge badges, and comparative cards.

#### D. Protected/API calls ↔ Authentication Rule Module

- **UI service:** `frontend/src/services/api.js` (adds bearer token via interceptor).
- **BLL/Auth module:** token decode + current user dependency.
- **Interaction flow:**
  1. UI attaches JWT token in request headers.
  2. Auth dependency validates token and expiry.
  3. Valid token → proceed to business function.
  4. Invalid/expired token → reject with unauthorized response.

---

### 

---

## Q2A) How business rules are implemented for different modules

### Module-wise business rules

1. **Prediction availability rule**
   - Rule: “System must always provide prediction data.”
   - Implementation:
     - Attempt MongoDB read.
     - If DB unavailable/error/empty, use seeded fallback predictions.

2. **Model selection rule**
   - Rule: “Predictions shown must correspond to selected forecasting model.”
   - Implementation:
     - Repository applies `model_name` filter when listing records.

3. **Hotspot detection rule**
   - Rule: “High-demand response should prioritize maximum current demand zone.”
   - Implementation:
     - Sort by `current_demand` descending and pick top zone.
     - Return top 3 supporting zones for comparative context.

4. **Surge status rule**
   - Rule: “Surge is active only when surge multiplier > 1.0.”
   - Implementation:
     - For a selected zone, compute boolean `surge_active = surge_multiplier > 1.0`.

5. **Forecast horizon rule**
   - Rule: “User can request short-term horizon; bounded by supported range.”
   - Implementation:
     - Extract hour offset from chat.
     - Clamp requested horizon to available forecast window (0–4h).

6. **Authentication rule**
   - Rule: “Only valid and unexpired tokens can access protected operations.”
   - Implementation:
     - JWT decode with expiry check.
     - Unauthorized response on invalid/expired token.

---

## Q2B) Validation logic implemented in the application

Yes, validation logic is implemented at multiple points.

### 1) Request schema validation (backend)

- `ChatRequest` validates:
  - `message` is required and bounded by min/max length.
  - `model_name` has a default.
- Benefit:
  - Prevents empty or oversized chat inputs from entering business processing.

### 2) Typed response validation (backend)

- `ChatResponse`, `InsightCard`, and `PredictionSummary` enforce response structure.
- Benefit:
  - Keeps API contracts consistent for UI rendering.

### 3) Authentication validation

- JWT payload is decoded and checked for expiry.
- Invalid tokens are rejected.
- Benefit:
  - Prevents unauthorized business operations.

### 4) UI-side basic validation

- Chat UI prevents blank message submission.
- Ride-search form blocks request when mandatory fields are missing.
- Benefit:
  - Early rejection at presentation layer for better UX.

> Conclusion: Validation exists both at **presentation edge** and **BLL/API boundary**, which is good layered design practice.

---

## Q2C) Data transformation from data layer to UI layer

Data transformation is handled in structured steps:

### 1) Source normalization in repository

- MongoDB documents are projected with `_id` excluded.
- Fallback cache has same shape as expected API records.
- Outcome:
  - Upstream source differences are hidden from UI.

### 2) Business-level transformation in ChatbotService

Raw records are transformed into user-centric outputs:

- **Intent-based narrative text** (`answer`).
- **Supporting bullet points** (`supporting_points`).
- **Insight cards** (`label/value`) for compact UI widgets.
- **Trend formatting** and contextual values for readable responses.

This transforms machine-oriented prediction rows into conversational and visual-ready structures.

### 3) API schema transformation contract

- Pydantic response models define exactly what UI receives.
- Ensures compatibility with chart cards, zone cards, and chatbot windows.

### 4) UI representation transformation

- Prediction arrays are mapped to chart points.
- Surge values are mapped to badges/highlights.
- Zone-level records are mapped to heatmap and summary cards.

> Overall, SRDAPO follows a clear transformation pipeline: 
> **Data Source (Mongo/Fallback) → Repository normalization → Business transformation → Response schema → UI rendering model.**

---
## Short conclusion 

The BLL in SRDAPO is responsible for enforcing demand/surge decision rules, validating incoming data, and converting raw prediction records into UI-ready outputs. By keeping these concerns in dedicated service/repository/auth modules, the project maintains a clean separation of concerns: presentation remains focused on user experience, while business correctness remains centralized and testable.