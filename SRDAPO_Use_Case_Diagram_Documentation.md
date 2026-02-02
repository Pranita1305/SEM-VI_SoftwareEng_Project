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