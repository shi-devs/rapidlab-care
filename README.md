# RapidLab Care

**Scan Fast. Store Safely. Care Better.**

RapidLab is an laboratory record-management system designed to help hospital staff upload, scan, verify and manage patient lab reports in one secure portal.

## Live Website

🌐 https://rapidlab-care.vercel.app/

## About the Project

RapidLab Care is a web-based laboratory record-management system designed to help hospitals, clinics and diagnostic centres upload, scan, verify and manage patient lab reports in one organised portal.

Hospital staff may receive several paper lab reports containing many different values. Entering every value manually takes time, can cause typing mistakes and makes previous reports difficult to find.

RapidLab Care simplifies this process by allowing authorised staff to upload multiple reports, review extracted information and save everything under the correct patient and hospital record.

## Main Features

* Staff sign-up and sign-in with email OTP verification
* Nurse, doctor, supervisor and hospital-administrator roles
* Create or join a hospital workspace
* Add and manage patient records
* Upload multiple lab-report images or PDF files
* OCR-assisted extraction of common laboratory values
* Review and correct extracted values before saving
* Save a report even when no laboratory value is extracted
* Store reports using the patient’s name, age, date and hospital
* View complete patient history from other authorised staff accounts
* Verify reports through doctors, supervisors or hospital administrators
* Automatically refresh updated team, patient and report information
* Delete individual reports or patient records when authorised
* Delete a staff account without deleting the patient records uploaded by that staff member
* Keep uploaded files inside private storage

## How RapidLab Works

1. A staff member creates an account and verifies their email.
2. The staff member creates or joins a hospital workspace.
3. A new or existing patient is selected.
4. One or more lab reports are scanned or uploaded.
5. RapidLab attempts to extract supported laboratory values.
6. The staff member reviews and corrects the information.
7. The report is saved under the patient and hospital record.
8. Other authorised hospital workers can view or verify it.

## Primary Users

* Nurses
* Doctors
* Laboratory staff
* Supervisors
* Hospital administrators

## Problem Addressed

RapidLab aims to reduce:

* Repeated manual data entry
* Typing errors in laboratory values
* Time spent switching between paper reports and computers
* Difficulty finding older patient reports
* Loss of work after interruptions
* Mixing reports belonging to different patients
* Dependence on the account of the person who uploaded the report

## Technology Used

* Next.js
* TypeScript
* PostgreSQL
* Supabase Database
* Private Supabase Storage
* Drizzle ORM
* Vercel deployment

## Team 

* Shishir
* Shristi

## Project Status

RapidLab is a working academic prototype created using the Human-Centred Design process. It is currently intended for demonstration and testing. Future development will include feedback from hospital staff, usability testing and additional security improvements for real-world use.

## Data Security

Database credentials, email-service keys and other sensitive settings are securely managed through environment variables and are not included in the public source code.

