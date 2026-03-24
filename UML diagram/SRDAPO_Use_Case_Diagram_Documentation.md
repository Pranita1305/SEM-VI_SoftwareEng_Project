# SRDAPO Use Case Diagram Documentation
## CS 331 Software Engineering Lab - Assignment 2

**Project:** Smart Ride Demand Anticipation & Pricing Optimizer (SRDAPO)  
**Team:** Pranita Mahajan (2301151), Pulkit (2301165), Shivang Sharma (2301203)

---

## Step 1: Identified Use Cases 

### Primary Use Cases:

1. **Login/Register**
   - Description: Users authenticate themselves to access the system
   - Purpose: Security and personalized access control
   - Input: Username, password
   - Output: Authentication token, access granted/denied

2. **View Demand Forecast**
   - Description: Display predicted ride demand for different zones and time windows
   - Purpose: Help operators understand future demand patterns
   - Input: Zone selection, time range
   - Output: Demand predictions with confidence intervals

3. **View Surge Pricing**
   - Description: Display current and recommended surge pricing factors for zones
   - Purpose: Show dynamic pricing based on demand
   - Input: Zone selection
   - Output: Current surge factor, recommended pricing

4. **View Heatmap**
   - Description: Visual representation of demand density across city zones
   - Purpose: Quick visual identification of high-demand areas
   - Input: Time selection
   - Output: Interactive heatmap with color-coded demand levels

5. **Chat Query**
   - Description: Natural language interface to query system information
   - Purpose: Easy access to information via conversational interface
   - Input: Natural language questions
   - Output: Relevant answers about demand, pricing, zones
   - Examples:
     - "Which zones are in high demand right now?"
     - "Is surge pricing active in Whitefield?"
     - "What is predicted demand for Zone 3 in next 2 hours?"

6. **Manage System** (Admin only)
   - Description: Configure zones, adjust parameters, manage data
   - Purpose: System administration and configuration
   - Input: System parameters, zone definitions
   - Output: Updated configurations

---

## Step 2: List of Actors 

### Human Actors:

1. **Admin/Operator**
   - **Role:** System administrator and operations manager
   - **Responsibilities:**
     - Monitor system performance
     - Configure zones and parameters
     - Access all forecasting and pricing data
     - Manage user accounts
     - View historical analytics
   - **Permissions:** Full system access

2. **User (End User)**
   - **Role:** General user viewing demand and pricing information
   - **Responsibilities:**
     - View current demand forecasts
     - Check surge pricing status
     - View heatmaps
     - Access limited information
   - **Permissions:** Read-only access to public data

3. **Chatbot**
   - **Role:** Automated query interface
   - **Responsibilities:**
     - Process natural language queries
     - Fetch and present information
     - Provide conversational access to system data
   - **Permissions:** Query access via API

### External System Actors (Services):

4. **Authentication Service**
   - **Role:** External authentication and authorization system
   - **Responsibilities:**
     - Validate user credentials (JWT tokens)
     - Manage user sessions
     - Provide security layer
   - **Technology:** JWT-based authentication

5. **Weather Data Service**
   - **Role:** External API providing weather information
   - **Responsibilities:**
     - Supply real-time weather data
     - Provide weather forecasts
     - Feed data into ML models for demand prediction
   - **Integration:** REST API calls

   ---

## Relationships in the Diagram

### Association Relationships (Solid Lines):
- Connect actors to the use cases they interact with
- Admin can access all use cases
- User can access view-only use cases
- Chatbot interacts with Chat Query use case

### Include Relationships (Dashed Arrows with <<include>>):
- **Login/Register** is included by all protected use cases
- **Chat Query** includes View Demand and View Pricing for answering questions

### Service Relationships (Dashed Lines with <<authenticates>> or <<provides data>>):
- Authentication Service validates Login/Register
- Weather Data Service provides input to View Demand Forecast

---

## System Boundary

The system boundary encompasses:
- All use cases that are part of the SRDAPO platform
- Internal business logic for forecasting and pricing
- API endpoints
- Database operations

External to the boundary:
- Human actors (Admin, User)
- Chatbot interface
- External services (Authentication, Weather Data)

---

## Key Technical Components (Not shown in Use Case but part of system)

### Backend:
- FastAPI framework
- MongoDB database
- APScheduler for automated predictions

### ML Models:
- SARIMA for short-term forecasting
- XGBoost for time-based predictions
- LSTM for long-term patterns

### Frontend:
- React.js with Tailwind CSS
- Chart.js/Recharts for visualizations
- Leaflet/Mapbox for heatmaps

---

## Design Rationale

The use case diagram focuses on:
1. **User-centric design:** Clear separation between Admin and User roles
2. **Simplicity:** Only essential use cases shown
3. **External integrations:** Services shown as actors to highlight dependencies
4. **Security:** Authentication included in all protected operations
5. **Modularity:** Each use case represents a distinct functionality

This design balances completeness with clarity, avoiding over-complexity while capturing all essential system behaviors.

---

## Comparison with Given Example (Online Shopping System)

**Similarities:**
- Clear actor-use case associations
- Include relationships for common operations (login)
- External service actors

**Differences:**
- SRDAPO focuses on data visualization and ML predictions
- More emphasis on real-time data and forecasting
- Chatbot as a distinct interaction pattern