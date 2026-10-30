# RapidLab Care

**Scan Fast. Store Safely. Care Better.**

RapidLab Care is a laboratory record-management system designed to help healthcare staff upload, scan, verify and manage patient lab reports in one organised portal.

## Live Website

🌐 [Visit RapidLab Care](https://rapidlab-care.vercel.app/)

## About the Project

Hospital staff may receive several paper lab reports containing many different values. Entering every value manually takes time, can cause typing mistakes and makes previous reports difficult to find.

RapidLab Care simplifies this process by allowing authorised staff to upload multiple reports, review extracted information and save everything under the correct patient and hospital record.

## Main Features

* Staff sign-up and sign-in with email OTP verification
* Role-based access for nurses, doctors, supervisors and hospital administrators
* Create or join a hospital workspace
* Add and manage patient records
* Upload multiple lab-report images or PDF files
* OCR-assisted extraction of laboratory values from clear printed report images
* Handwritten or mixed reports are saved without automatic extraction to prevent guessed values
* Review and correct extracted values before saving
* Show a red warning icon and High label beside numeric results above the report's reference range, during entry and when viewing saved records
* Use the reference range in the same units as the result; missing or unrecognised ranges are not automatically classified
* Save a report even when no laboratory value is extracted
* Select the report date when creating a record or adding report files later
* Search patients by name, record ID and report date together
* Store reports using the patient’s name, age, date and hospital
* View complete patient history from authorised staff accounts
* Verify reports through doctors, supervisors or hospital administrators
* Automatically display updated team, patient and report information
* Delete individual reports or patient records when authorised
* Delete a staff account without deleting patient records uploaded by that staff member
* Keep uploaded files in private storage

## How RapidLab Care Works

1. A staff member creates an account and verifies their email.
2. The staff member creates or joins a hospital workspace.
3. A new or existing patient is selected.
4. The staff member selects whether the report is printed or handwritten/mixed.
5. One or more lab reports are scanned or uploaded.
6. RapidLab Care attempts extraction only for printed report images; handwritten/mixed reports are saved as original files without extraction.
7. The staff member reviews and corrects any extracted information.
8. The report is saved under the patient and hospital record.
9. Other authorised hospital workers can view or verify it.

## Primary Users

* Nurses
* Doctors
* Laboratory staff
* Supervisors
* Hospital administrators

## Problem Addressed

RapidLab Care aims to reduce:

* Repeated manual data entry
* Typing errors in laboratory values
* Time spent switching between paper reports and computers
* Difficulty finding previous patient reports
* Loss of progress after interruptions
* Mixing reports belonging to different patients
* Dependence on the account of the person who uploaded a report

## Technology Used

- **Next.js** – Builds the website and server functions
- **TypeScript** – Programming language used for the application
- **Supabase PostgreSQL** – Stores accounts, hospitals, patients and report details
- **Supabase Storage** – Privately stores uploaded lab-report images and PDF files
- **Drizzle ORM** – Connects the application to the database
- **Vercel** – Hosts and publishes the website online
  
## Team

* Shishir
* Shristi

## Project Status

RapidLab Care is a working academic prototype created using the Human-Centred Design process. It is currently intended for demonstration and testing. Future development will include feedback from hospital staff, usability testing and additional security improvements for real-world use.

## Data Security

Database credentials, email-service keys and other sensitive settings are managed through environment variables and are not included in the public source code.

## Report date update

For an **existing deployment**, first run the following in the Supabase SQL Editor, then deploy the updated code:

```sql
alter table public.lab_records add column if not exists report_date date;
alter table public.lab_report_files add column if not exists report_date date;
create index if not exists idx_lab_records_hospital_report_date on public.lab_records (hospital_id, report_date);
create index if not exists idx_lab_report_files_hospital_report_date on public.lab_report_files (hospital_id, report_date);
```

The same additive migration is in `drizzle-postgres/0001_report_dates.sql`. New installations can use `supabase-setup.sql` as usual. Existing records and files are retained; dates that were never recorded remain blank rather than being inferred from upload times.

- **Upload:** choose **Report date** before saving a new record. It defaults to today and can be changed to the date written on the report. Every file in that upload receives the selected date. For reports from different dates, save them in separate batches.
- **Add reports later:** open the patient, choose **Add reports**, and set **New reports date**. Previously saved attachments keep their dates. The separate **Record report date** can be corrected without changing attachment dates.
- **Search:** open **Patients**, enter a name or record ID, choose **Report date**, or combine these filters. A patient matches if the record date or any attached report date matches. Filters are applied on the server before the 200-record display limit, including reports on older patient records. More than 200 matches produce a message asking for narrower filters.
- **Clear filters:** restores the recent patient list. Historical reports with no known date remain available without a date filter and display **Not recorded**.
- Dates use calendar values (`YYYY-MM-DD`) and display as `DD/MM/YYYY`, so a timezone conversion cannot move the report to another day. Upload timestamps remain separate.

Validation: `npm test` builds the app and runs the regression tests; `npm run lint` checks the source. No production credentials or patient data are required for the tests.
