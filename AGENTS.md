# Project Summary & Agent Instructions

This document provides a summary of the "Installment Management System" project, its current state, and key information to help future development work.

## 1. Application Overview

- **Purpose:** A comprehensive, multi-user, online system for managing installment sales.
- **Frontend:** Responsive, Arabic-language Single-Page Application (SPA).
- **Tech Stack:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui.
- **Backend:** Supabase (PostgreSQL), including Database, Authentication, and Edge Functions.

## 2. Core Features (as of 2025-09-05)

### Implemented & Verified Features:
- **Secure Authentication:** Full user login/logout system connected to Supabase Auth, with role-based access control (`admin`, `staff`) securing all data.
- **Dashboard & Analytics:** A dynamic dashboard displaying key financial metrics.
- **Customer Management:** Full CRUD capabilities with a robust search function.
- **Transaction Management:** Full CRUD capabilities, including an enhanced form for manual entry.
- **Payment Recording:** A secure system for recording payments against transactions.
- **Data Import:** A robust data import system from Excel/CSV for Customers, Transactions, and Payments.
  - **Key Workflow:** Handles mapping legacy IDs to the new system by using the `sequence_number` column.
- **Reporting:** A feature to generate and download a monthly payment report in Excel (`.xlsx`) format with correct columns and references.
- **Data Utilities:**
  - An optional tool on the Settings page for bulk-adding a `+` prefix to all customer phone numbers.

### Key Work Done in This Session:
- **Security Overhaul:** Implemented strict, role-based Row Level Security (RLS) policies for all major tables (`customers`, `transactions`, `payments`, `audit_log`).
- **Database Hardening:** Fixed all "Function Search Path Mutable" warnings and created a secure `audit_log` table.
- **Data Import Fixes:** Completely rewrote the data import logic to be robust, handle legacy data, and provide clearer error messages.
- **UI/UX Fixes:** Corrected numerous bugs, including a search crash, incorrect data display in lists, and broken UI components.
- **Form Enhancements:** Improved the "Add New Transaction" form with missing fields and real-time calculations.

## 3. Database & Connection Information

- **Provider:** Supabase
- **Project URL:** `https://odeqbnntvogchzipniig.supabase.co`
- **Project ID:** `odeqbnntvogchzipniig`
- **Anon Key (Public):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZXFibm50dm9nY2h6aXBuaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Mjc5OTgsImV4cCI6MjA3MjUwMzk5OH0.phWW0hNm-ujEEsngjhf88us4suJv9boQ_9uh7ADhTXQ`
- **Database Schema:** The schema is managed via migration files in the `supabase/migrations` directory. The user's database may occasionally fall out of sync. If "column not found" errors occur, the necessary `ALTER TABLE` commands from the migration files must be provided to the user to run manually. After any manual schema change, the user **must** be instructed to click the **"Reload schema"** button in the Supabase Dashboard's API section.

### Critical Data Import Workflow

**This is the most important instruction for future work on this project.**
The system is designed to migrate legacy data. When importing customers, the user **must** map their original ID column (e.g., "كود") to the **"م العميل" (`sequence_number`)** field in the UI. The system will generate a new UUID for the primary key (`id`) automatically. Subsequent imports (Transactions, Payments) rely on this `sequence_number` to correctly link back to the customer.

## 4. Potential Future Work

Based on the original project description, the following features have been requested but not yet implemented:

- **General Improvements:**
  - Pagination for Customer and Transaction lists.
  - Advanced filtering and sorting controls for lists.
  - A system to translate raw database errors into user-friendly Arabic messages.
- **Audit Log UI:** The `audit_log` table exists and is collecting data, but there is no UI to view or search the logs.
- **AI-Powered Features:**
  - Predictive Payment Reminders.
  - Customer Risk Scoring.
  - Automated Data Entry (OCR/NLP).
  - AI Chatbot.
