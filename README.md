# FinTrend Analytics Platform

A full-stack analytics platform designed for Asset Management Companies (AMCs) to monitor investments, analyze Assets Under Management (AUM), detect compliance risks, predict investor churn, and generate executive insights through a unified dashboard.

The platform combines real-time analytics, machine learning, and compliance monitoring into a modular architecture built using React, Node.js, PostgreSQL, and Supabase.

---

## Overview

Financial institutions often rely on multiple disconnected systems for portfolio management, compliance monitoring, investor analytics, and reporting. This increases operational overhead and limits visibility into critical business metrics.

FinTrend addresses this challenge by providing a centralized analytics platform that integrates investment data, transaction monitoring, AI-driven insights, and compliance workflows into a single application.

The project was designed with scalability, modularity, and maintainability in mind, following a layered architecture that separates presentation, business logic, and data access.

---

## Core Features

### Executive Dashboard

Provides a consolidated view of key business metrics including

- Assets Under Management (AUM)
- Active Investors
- Net Inflows and Outflows
- Fund Performance
- Portfolio Distribution
- Operational KPIs

---

### AUM Analytics

Tracks fund performance across different investment categories.

Features include

- Fund-wise AUM
- Portfolio Allocation
- Historical Growth
- Category Comparison
- Performance Trends

---

### SIP Analytics

Monitors investor participation through Systematic Investment Plans.

Includes

- Monthly Registrations
- Renewal Percentage
- Cancellation Trends
- Investor Retention Metrics

---

### AML & Compliance

Automates Anti-Money Laundering monitoring by identifying suspicious investment activities.

Capabilities

- Risk Classification
- AML Alerts
- Suspicious Transactions
- Compliance Status
- Regulatory Monitoring

---

### Transaction Heatmap

Visualizes transaction activity across different time periods.

Includes

- Daily Transactions
- Monthly Investment Trends
- Peak Transaction Analysis
- Activity Distribution

---

### AI Churn Prediction

A machine learning module estimates the probability of investor churn using historical investment behaviour.

Outputs include

- Churn Probability
- High Risk Investors
- Retention Suggestions
- Investor Segmentation

---

### AI Allocation Advisor

Assists fund managers by recommending portfolio allocation strategies based on investor profiles and risk levels.

---

### Report Generator

Generates summarized business reports suitable for executive review and decision making.

---

## Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | React.js, Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL, Supabase |
| Machine Learning | Python |
| Charts | Chart.js |
| Authentication | JWT |
| Deployment | AWS, Vercel |

---

## System Architecture

```
                        Client

                           │

                React + Vite Frontend

                           │

                    REST API Layer

                           │

                 Express Application

      ┌──────────────┼──────────────┐

 Authentication   Business Logic   Analytics

      │                │               │

 Repositories      Services      ML Models

                 PostgreSQL

```

The frontend communicates with the backend through REST APIs. Business services encapsulate domain-specific logic, while repositories handle database interactions. Machine learning modules operate independently and expose prediction services to the analytics layer.

---

## Project Structure

```
backend/
│
├── config/
├── controllers/
├── middleware/
├── repositories/
├── routes/
├── services/
├── ml/
└── utils/

frontend/
│
├── assets/
├── components/
├── constants/
├── context/
├── services/
└── App.jsx

supabase/
└── schema.sql
```

The backend follows a layered architecture consisting of controllers, services, repositories, and utility modules. This separation improves maintainability and allows individual components to evolve independently.

---

## Data Flow

```
Financial Data

      │

      ▼

REST API

      │

      ▼

Business Services

      │

      ▼

Database Layer

      │

      ▼

Machine Learning

      │

      ▼

Analytics Engine

      │

      ▼

Interactive Dashboard
```

---

## Security

The application incorporates several security practices including

- JWT Authentication
- Password Hashing
- Role-based Authorization
- Audit Logging
- Input Validation
- Secure API Communication
- Row Level Security (Supabase)

---

## Scalability Considerations

The platform has been designed using independent service layers, making it straightforward to integrate

- Live Market Data
- External APIs
- Kafka/RabbitMQ
- Redis Caching
- Microservices
- Cloud Deployment
- Additional ML Models

without significant architectural changes.

---

## Installation

Clone the repository

```bash
git clone <https://github.com/sudeeptaprusty/Group-3_Project>
```

Install frontend dependencies

```bash
cd frontend
npm install
npm run dev
```

Install backend dependencies

```bash
cd backend
npm install
npm start
```

---

## Future Enhancements

- Real-time Streaming Analytics
- AI-powered Investment Recommendations
- Automated Regulatory Reporting
- Voice-enabled Analytics Assistant
- Multi-tenant Architecture
- Kubernetes Deployment
- Event-driven Processing
- Advanced Fraud Detection Models

---

## Team

Developed by **Group 3** as part of a FinTech Analytics Platform focused on intelligent investment management, regulatory compliance, and predictive analytics.

---

## License

This project is intended for academic and demonstration purposes.
