# CertiAI — AI Certificate Review System

> Sistem berbasis AI untuk membantu mahasiswa mengunggah sertifikat, melakukan analisis otomatis, memberikan rekomendasi bobot, kemudian memungkinkan dosen melakukan verifikasi dan memberikan keputusan akhir.

---

# 1. Project Overview

CertiAI adalah aplikasi web untuk membantu proses pengelolaan dan verifikasi sertifikat mahasiswa.

Sistem menggunakan AI untuk membaca dan memahami informasi dari sertifikat, kemudian memberikan rekomendasi:

- Nama kegiatan
- Penyelenggara
- Tanggal kegiatan
- Kategori kegiatan
- Durasi kegiatan
- Rekomendasi bobot
- Confidence score
- Alasan rekomendasi

Namun, AI **tidak menjadi pengambil keputusan akhir**.

Keputusan akhir tetap berada pada dosen.

---

# 2. Main Problem

Proses verifikasi sertifikat mahasiswa secara manual memiliki beberapa masalah:

1. Mahasiswa harus mengirim sertifikat secara manual.
2. Dosen harus membaca satu per satu sertifikat.
3. Informasi sertifikat harus diperiksa secara manual.
4. Penentuan bobot dapat membutuhkan waktu.
5. Riwayat verifikasi sulit dilacak jika menggunakan proses manual.
6. Mahasiswa tidak selalu mengetahui status sertifikatnya.
7. Tidak ada sistem terpusat untuk menyimpan sertifikat dan hasil verifikasi.

CertiAI bertujuan membantu mengotomatisasi proses tersebut.

---

# 3. Main Objective

Membangun sistem yang mampu:

```text
Mahasiswa
    ↓
Upload Sertifikat
    ↓
AI membaca sertifikat
    ↓
AI mengekstrak informasi
    ↓
AI memberikan rekomendasi bobot
    ↓
Dosen melakukan review
    ↓
Dosen menentukan keputusan
    ↓
Mahasiswa menerima hasil
```

---

# 4. MVP Scope

## Student

- Register
- Login
- Upload sertifikat
- Melihat daftar sertifikat
- Melihat detail sertifikat
- Melihat hasil analisis AI
- Melihat status review
- Melihat hasil akhir
- Melihat notifikasi

## Lecturer

- Login
- Melihat sertifikat yang menunggu review
- Melihat detail sertifikat
- Melihat file sertifikat
- Melihat hasil AI
- Mengubah rekomendasi bobot
- Menambahkan catatan
- Approve sertifikat
- Reject sertifikat

## Admin

- Login
- Melihat user
- Mengelola kategori sertifikat
- Mengelola aturan bobot
- Melihat seluruh sertifikat
- Melihat aktivitas sistem

---

# 5. Technology Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- React
- Vercel

## Backend

MVP tidak menggunakan backend server terpisah.

Gunakan:

- Next.js Route Handlers
- Next.js Server Actions
- Server Components

## Authentication

- Supabase Auth

## Database

- Supabase PostgreSQL

## File Storage

- Supabase Storage

## AI

- Gemini API

## Infrastructure Management

- Supabase CLI
- Git
- GitHub

## Deployment

- Vercel

---

# 6. Architecture

## High-Level Architecture

```text
                         USER
                           |
                           v
                  +----------------+
                  |    Next.js     |
                  |    Vercel      |
                  +-------+--------+
                          |
             +------------+-------------+
             |                          |
             v                          v
      +-------------+            +-------------+
      |   Supabase  |            |   Gemini    |
      |             |            |     API     |
      | Auth        |            +-------------+
      | PostgreSQL  |
      | Storage     |
      +-------------+
             |
             v
      Certificate Data
```

---

# 7. Detailed Architecture

```text
                         INTERNET
                             |
                             v
                    +----------------+
                    |    Vercel      |
                    |    Next.js     |
                    +-------+--------+
                            |
              +-------------+-------------+
              |                           |
              v                           v
      +---------------+           +---------------+
      |   Supabase    |           |    Gemini     |
      |               |           |      API      |
      | Auth          |           +---------------+
      | PostgreSQL    |
      | Storage       |
      +---------------+
              |
              v
      Certificate Management
              |
              v
       Lecturer Verification
              |
              v
         Final Decision
              |
              v
           Student
```

---

# 8. Core Workflow

```text
Student Login
     |
     v
Upload Certificate
     |
     v
Validate File
     |
     v
Supabase Storage
     |
     v
Create Certificate Record
     |
     v
AI Processing
     |
     v
Gemini
     |
     v
Extract Information
     |
     v
AI Recommendation
     |
     v
Save AI Result
     |
     v
Waiting Lecturer Review
     |
     +--------------------+
     |                    |
     v                    v
  APPROVED             REJECTED
     |                    |
     +---------+----------+
               |
               v
         Student Notification
```

---

# 9. Why Gemini Is Used

Gemini digunakan untuk memahami isi sertifikat.

Gemini dapat membantu:

- membaca teks sertifikat
- memahami konteks kegiatan
- mengidentifikasi kategori
- mengambil informasi penting
- memberikan rekomendasi bobot
- memberikan alasan
- memberikan confidence score

Gemini bukan database.

Gemini bukan storage.

Gemini adalah AI processing layer.

---

# 10. AI Architecture

```text
Certificate
     |
     v
Supabase Storage
     |
     v
Next.js Server
     |
     v
Gemini API
     |
     v
Structured JSON
     |
     v
Supabase PostgreSQL
```

---

# 11. AI Decision Principle

AI hanya memberikan rekomendasi.

```text
AI
 |
 +-- recommendation
 +-- confidence
 +-- reasoning
 |
 v
Lecturer
 |
 v
Final Decision
```

AI tidak boleh menentukan keputusan final secara otomatis.

---

# 12. Example AI Input

```text
Kamu adalah AI assistant untuk sistem
verifikasi sertifikat mahasiswa.

Analisis sertifikat berikut.

Informasi yang harus dihasilkan:

- Nama kegiatan
- Penyelenggara
- Kategori
- Tanggal
- Durasi
- Rekomendasi bobot
- Confidence
- Alasan

Gunakan aturan bobot yang diberikan sistem.

Aturan:

Workshop 4-8 jam = bobot 1
Workshop >8 jam = bobot 2

Seminar <4 jam = bobot 1

Kompetisi lokal = bobot 1
Kompetisi nasional = bobot 2
Kompetisi internasional = bobot 3
```

---

# 13. Example AI Output

AI harus menggunakan structured JSON.

```json
{
  "title": "Workshop Cloud Computing",
  "organizer": "Google Developer Groups",
  "category": "Workshop",
  "event_date": "2026-08-10",
  "duration_hours": 8,
  "recommended_weight": 1,
  "confidence": 0.91,
  "reasoning": "Workshop memiliki durasi 8 jam sehingga masuk kategori bobot 1."
}
```

---

# 14. Important AI Rule

AI tidak boleh langsung menulis:

```text
final_weight
```

AI hanya menghasilkan:

```text
recommended_weight
```

Sedangkan:

```text
final_weight
```

ditentukan oleh dosen.

---

# 15. User Roles

## Student

Role:

```text
student
```

Permissions:

- Login
- Upload certificate
- View own certificates
- View own AI results
- View own review result
- View own notifications

Tidak boleh:

- Melihat sertifikat mahasiswa lain
- Mengubah hasil AI
- Mengubah hasil review
- Mengubah final weight

---

# 16. Lecturer

Role:

```text
lecturer
```

Permissions:

- Login
- View certificates requiring review
- View certificate details
- View AI analysis
- Edit final weight
- Add review note
- Approve certificate
- Reject certificate

---

# 17. Admin

Role:

```text
admin
```

Permissions:

- Manage users
- Manage categories
- Manage weight rules
- View all certificates
- View activity logs
- Manage system configuration

---

# 18. Certificate Status

Use:

```text
pending
processing
ai_completed
waiting_review
approved
rejected
```

Workflow:

```text
pending
   |
   v
processing
   |
   v
ai_completed
   |
   v
waiting_review
   |
   +---------> approved
   |
   +---------> rejected
```

---

# 19. Database Design

## 19.1 profiles

Stores user information.

Fields:

```text
id
full_name
email
role
student_number
lecturer_number
created_at
updated_at
```

Relationship:

```text
profiles
   |
   +---- certificates.student_id
   |
   +---- certificate_reviews.lecturer_id
   |
   +---- notifications.user_id
```

---

# 20. certificates

Stores certificate metadata.

Fields:

```text
id
student_id

file_path
file_name
file_type
file_size

status

title
organizer
category
event_date
duration_hours
certificate_number

final_weight

created_at
updated_at
```

Relationship:

```text
profiles
   |
   +---- certificates
```

---

# 21. certificate_ai_analysis

Stores AI analysis.

Fields:

```text
id
certificate_id

extracted_text

title
organizer
category
event_date
duration_hours

recommended_weight
confidence
reasoning

model_name

created_at
updated_at
```

Relationship:

```text
certificates
   |
   +---- certificate_ai_analysis
```

---

# 22. certificate_reviews

Stores lecturer review.

Fields:

```text
id
certificate_id
lecturer_id

final_weight
status
note

reviewed_at
created_at
updated_at
```

Status:

```text
approved
rejected
```

---

# 23. notifications

Stores user notifications.

Fields:

```text
id
user_id

title
message
type

reference_id

is_read

created_at
```

Examples:

```text
Certificate uploaded
AI analysis completed
Certificate waiting for review
Certificate approved
Certificate rejected
```

---

# 24. weight_rules

Stores certificate weighting rules.

Fields:

```text
id

category
min_duration
max_duration

weight

description

is_active

created_at
updated_at
```

Example:

```text
Workshop
4-8 hours
Weight 1

Workshop
>8 hours
Weight 2

Competition
Local
Weight 1

Competition
National
Weight 2

Competition
International
Weight 3
```

---

# 25. audit_logs

Stores important system actions.

Fields:

```text
id

user_id

action
entity
entity_id

old_data
new_data

created_at
```

Examples:

```text
CERTIFICATE_UPLOADED
AI_ANALYSIS_COMPLETED
LECTURER_APPROVED
LECTURER_REJECTED
WEIGHT_UPDATED
```

---

# 26. Database Relationships

```text
profiles
   |
   +-----------------------+
   |                       |
   v                       v
certificates          notifications
   |
   +---------------------------+
   |                           |
   v                           v
certificate_ai_analysis   certificate_reviews
                               |
                               v
                           profiles
```

---

# 27. Supabase Storage

Bucket:

```text
certificates
```

Bucket harus:

```text
PRIVATE
```

Jangan menggunakan public bucket untuk sertifikat.

---

# 28. Storage Structure

Recommended:

```text
certificates/
    {user_id}/
        {certificate_id}/
            original.pdf
```

Example:

```text
certificates/
    8e23...
        cert-001/
            original.pdf
```

---

# 29. Storage Security

Student hanya dapat mengakses file miliknya.

Lecturer dapat mengakses file yang diperlukan untuk proses review.

File tidak boleh tersedia melalui public URL permanen.

Gunakan:

```text
Signed URL
```

untuk menampilkan file private.

---

# 30. Row Level Security

RLS harus selalu aktif.

## Student

Can:

```text
SELECT own certificates
INSERT own certificates
SELECT own AI analysis
SELECT own notifications
```

Cannot:

```text
SELECT other student's certificates
UPDATE lecturer reviews
UPDATE final weight
```

## Lecturer

Can:

```text
SELECT certificates for review
SELECT AI analysis
INSERT review
UPDATE review
```

## Admin

Can:

```text
SELECT all
INSERT
UPDATE
DELETE when required
```

---

# 31. Supabase CLI First Principle

Supabase CLI digunakan sebagai sumber utama pengelolaan infrastructure.

Semua perubahan berikut sebisa mungkin dilakukan melalui CLI:

```text
Database
RLS
Storage Bucket
Storage Policies
Seed Data
Database Functions
Database Triggers
```

Dashboard Supabase hanya digunakan untuk:

- melihat data
- monitoring
- debugging
- melihat logs
- konfigurasi yang memang tidak tersedia secara praktis melalui CLI

Jangan menjadikan Dashboard sebagai source of truth untuk schema production.

---

# 32. Supabase CLI Installation

Install Supabase CLI sesuai sistem operasi.

Setelah terinstall:

```bash
supabase --version
```

Login:

```bash
supabase login
```

---

# 33. Initialize Supabase

Di root project:

```bash
supabase init
```

Struktur:

```text
supabase/
├── migrations/
├── functions/
├── seed.sql
└── config.toml
```

---

# 34. Link Supabase Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Project ID tidak boleh ditulis di source code secara hardcode jika tidak diperlukan.

---

# 35. Local Supabase

Start:

```bash
supabase start
```

Stop:

```bash
supabase stop
```

Reset:

```bash
supabase db reset
```

---

# 36. Database Migration

Create migration:

```bash
supabase migration new create_initial_schema
```

Migration:

```text
supabase/
└── migrations/
    └── XXXXX_create_initial_schema.sql
```

Semua schema database harus berada di migration.

---

# 37. Database Deployment

Development:

```text
Migration
   |
   v
Local Supabase
   |
   v
Test
   |
   v
Git Commit
   |
   v
supabase db push
   |
   v
Production
```

Command:

```bash
supabase db push
```

---

# 38. Storage Bucket Through Migration

Storage bucket dibuat melalui SQL migration.

Example:

```sql
insert into storage.buckets (
    id,
    name,
    public
)
values (
    'certificates',
    'certificates',
    false
);
```

---

# 39. Storage Policies

Storage policies harus dibuat melalui migration.

Konsep:

```text
Student
   |
   +---- Upload own certificate
   |
   +---- Read own certificate

Lecturer
   |
   +---- Read certificate requiring review
```

---

# 40. Seed Data

Seed file:

```text
supabase/seed.sql
```

Digunakan untuk:

```text
Categories
Weight Rules
Development users
Development data
```

Contoh:

```text
Workshop
Seminar
Training
Competition
Certification
```

---

# 41. Next.js Project Structure

Recommended:

```text
app/
├── (auth)/
│   ├── login/
│   └── register/
│
├── dashboard/
│   ├── student/
│   ├── lecturer/
│   └── admin/
│
├── certificates/
│   ├── upload/
│   └── [id]/
│
├── notifications/
│
├── api/
│   └── certificates/
│       └── analyze/
│
├── layout.tsx
└── page.tsx

components/
├── ui/
├── certificates/
├── dashboard/
├── notifications/
└── forms/

lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── admin.ts
│
└── gemini/
    └── client.ts

types/
└── database.ts

supabase/
├── migrations/
├── functions/
├── seed.sql
└── config.toml
```

---

# 42. Supabase Client

Client-side:

```text
lib/supabase/client.ts
```

Server-side:

```text
lib/supabase/server.ts
```

Admin/service-role:

```text
lib/supabase/admin.ts
```

Service-role client hanya boleh digunakan di server.

---

# 43. Environment Variables

`.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

GEMINI_API_KEY=

SUPABASE_SERVICE_ROLE_KEY=
```

Rules:

```text
NEXT_PUBLIC_*
```

boleh digunakan di browser hanya untuk value yang memang aman dipublikasikan.

Jangan menggunakan:

```text
NEXT_PUBLIC_GEMINI_API_KEY
```

Jangan menggunakan:

```text
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
```

---

# 44. Gemini Security

Gemini API harus dipanggil dari server.

Correct:

```text
Browser
   |
   v
Next.js Server
   |
   v
Gemini API
```

Incorrect:

```text
Browser
   |
   v
Gemini API
```

API key tidak boleh dikirim ke client.

---

# 45. Certificate Upload Flow

```text
Student
   |
   v
Upload File
   |
   v
Client Validation
   |
   +---- File type
   +---- File size
   |
   v
Supabase Storage
   |
   v
Create certificates row
   |
   v
status = pending
```

---

# 46. AI Processing Flow

```text
Certificate
   |
   v
Get File
   |
   v
Next.js Server
   |
   v
Gemini API
   |
   v
AI Analysis
   |
   v
Validate JSON
   |
   v
Save certificate_ai_analysis
   |
   v
Update certificate status
```

---

# 47. AI Processing Status

Before AI:

```text
pending
```

During AI:

```text
processing
```

After AI:

```text
ai_completed
```

Then:

```text
waiting_review
```

---

# 48. Lecturer Review Flow

```text
waiting_review
      |
      v
Lecturer Dashboard
      |
      v
Open Certificate
      |
      +---- View original file
      |
      +---- View extracted information
      |
      +---- View AI recommendation
      |
      v
Lecturer decision
      |
      +-------- APPROVE
      |
      +-------- REJECT
```

---

# 49. Approval Flow

```text
Lecturer
   |
   v
Approve
   |
   v
Save final_weight
   |
   v
certificate.status = approved
   |
   v
Create notification
   |
   v
Student
```

---

# 50. Rejection Flow

```text
Lecturer
   |
   v
Reject
   |
   v
Save note
   |
   v
certificate.status = rejected
   |
   v
Create notification
   |
   v
Student
```

---

# 51. Notification Flow

```text
System Event
     |
     v
Create notification
     |
     v
notifications table
     |
     v
Dashboard
     |
     v
Unread badge
```

---

# 52. Important Security Rules

1. RLS wajib aktif.
2. Storage bucket private.
3. Gemini API key hanya di server.
4. Service role key hanya di server.
5. User tidak boleh menentukan `student_id` secara bebas untuk mengakses data.
6. Authorization harus dilakukan di server.
7. File type harus divalidasi.
8. File size harus dibatasi.
9. AI output harus divalidasi sebelum disimpan.
10. Lecturer tetap menjadi final decision maker.

---

# 53. File Validation

Allowed:

```text
PDF
JPG
JPEG
PNG
```

Maximum size:

```text
10 MB
```

Initial limits dapat disesuaikan berdasarkan hasil testing.

---

# 54. AI Output Validation

AI output tidak boleh langsung dipercaya.

Flow:

```text
Gemini
   |
   v
JSON
   |
   v
Schema Validation
   |
   +---- Invalid
   |       |
   |       v
   |    Retry/Error
   |
   +---- Valid
           |
           v
       Database
```

Gunakan schema validation seperti Zod.

---

# 55. Error Handling

Possible errors:

```text
Upload failed
AI failed
Invalid AI response
Database failed
Authentication failed
Permission denied
File too large
Unsupported file type
```

Semua harus memiliki error handling.

---

# 56. Logging

Log important events:

```text
Certificate uploaded
AI processing started
AI processing completed
AI processing failed
Lecturer approved
Lecturer rejected
```

Jangan menyimpan secret/API key di logs.

---

# 57. Performance Principle

Jangan menjalankan AI processing berkali-kali untuk file yang sama tanpa alasan.

Jika AI sudah berhasil:

```text
certificate_ai_analysis
```

maka gunakan hasil tersebut.

Re-analysis hanya dilakukan jika:

- user meminta retry
- AI processing gagal
- prompt/model berubah
- admin melakukan re-analysis

---

# 58. Cost Control

Target MVP:

```text
Rp 0
```

Gunakan:

```text
Vercel Free
Supabase Free
Gemini Free Tier
```

Jangan mengaktifkan layanan berbayar jika belum diperlukan.

File upload harus memiliki limit.

AI request juga harus dibatasi.

---

# 59. MVP Cost Protection

Set initial limits:

```text
Maximum file size = 10 MB

Allowed file types:
PDF
JPG
JPEG
PNG
```

Optional:

```text
Maximum certificates per student per day
```

Tujuannya mencegah:

```text
Spam upload
AI abuse
Storage abuse
API quota abuse
```

---

# 60. Development Workflow

```text
Feature
   |
   v
Create branch
   |
   v
Develop
   |
   v
Supabase migration
   |
   v
Local testing
   |
   v
Git commit
   |
   v
Pull Request
   |
   v
Review
   |
   v
Merge
   |
   v
Deploy
```

---

# 61. Git Branch Strategy

Example:

```text
main
develop
feature/auth
feature/certificate-upload
feature/ai-analysis
feature/lecturer-review
feature/notification
```

---

# 62. Migration Rules

Never:

```text
Change production database manually
```

without creating a migration.

Correct:

```text
Create migration
      |
      v
Test locally
      |
      v
Commit migration
      |
      v
Push migration
```

---

# 63. Development Phases

## Phase 1 — Project Initialization

Tasks:

- [ ] Create Next.js project
- [ ] Configure TypeScript
- [ ] Configure Tailwind
- [ ] Setup Git
- [ ] Setup Supabase CLI
- [ ] Initialize Supabase
- [ ] Link Supabase project

Goal:

```text
Next.js + Supabase CLI ready
```

---

## Phase 2 — Database

Tasks:

- [ ] Create profiles
- [ ] Create certificates
- [ ] Create certificate_ai_analysis
- [ ] Create certificate_reviews
- [ ] Create notifications
- [ ] Create weight_rules
- [ ] Create audit_logs
- [ ] Create relationships
- [ ] Add indexes
- [ ] Add constraints

Goal:

```text
Database ready
```

---

## Phase 3 — Authentication

Tasks:

- [ ] Register
- [ ] Login
- [ ] Logout
- [ ] Session handling
- [ ] Profile creation
- [ ] Role handling
- [ ] Protected routes

Goal:

```text
Student / Lecturer / Admin authentication
```

---

## Phase 4 — Storage

Tasks:

- [ ] Create certificates bucket
- [ ] Set private bucket
- [ ] Create storage policies
- [ ] Upload certificate
- [ ] Generate signed URL
- [ ] Delete certificate

Goal:

```text
Secure certificate storage
```

---

## Phase 5 — Certificate Management

Tasks:

- [ ] Certificate upload page
- [ ] Certificate list
- [ ] Certificate detail
- [ ] Certificate status
- [ ] File preview
- [ ] Delete certificate

Goal:

```text
Student can manage certificates
```

---

## Phase 6 — Gemini Integration

Tasks:

- [ ] Create Gemini API client
- [ ] Add server-side API key
- [ ] Send certificate to Gemini
- [ ] Extract certificate information
- [ ] Generate recommendation
- [ ] Generate confidence
- [ ] Generate reasoning
- [ ] Validate JSON
- [ ] Store AI result

Goal:

```text
Certificate → AI Analysis
```

---

## Phase 7 — Lecturer Review

Tasks:

- [ ] Lecturer dashboard
- [ ] Pending certificate list
- [ ] Certificate detail
- [ ] AI result display
- [ ] Edit weight
- [ ] Add note
- [ ] Approve
- [ ] Reject

Goal:

```text
AI recommendation → Lecturer decision
```

---

## Phase 8 — Notification

Tasks:

- [ ] Notification table
- [ ] Create notification
- [ ] Notification dropdown
- [ ] Unread count
- [ ] Mark as read

Goal:

```text
Student and lecturer receive system notifications
```

---

## Phase 9 — Security

Tasks:

- [ ] Enable RLS
- [ ] Test RLS
- [ ] Storage policies
- [ ] Server authorization
- [ ] Input validation
- [ ] File validation
- [ ] API key protection
- [ ] Service role protection

Goal:

```text
Secure MVP
```

---

## Phase 10 — Testing

Test:

```text
Authentication
Authorization
Upload
Storage
AI
Database
Lecturer review
Notification
RLS
```

Test cases:

```text
Student cannot see other student's certificate
Student cannot change final weight
Lecturer can review certificate
Admin can manage rules
Invalid file rejected
Oversized file rejected
Invalid AI response handled
Unauthenticated user cannot access dashboard
```

---

## Phase 11 — Deployment

Frontend:

```text
GitHub
   |
   v
Vercel
```

Supabase:

```text
Production Supabase
```

Environment variables:

```text
Vercel Environment Variables
```

Deploy:

```text
Git push
   |
   v
Vercel deployment
```

---

# 64. Production Architecture

```text
                         USERS
                           |
                           v
                    +-------------+
                    |   Vercel    |
                    |   Next.js   |
                    +------+------+
                           |
          +----------------+----------------+
          |                                 |
          v                                 v
   +--------------+                  +--------------+
   |   Supabase   |                  |    Gemini    |
   |              |                  |      API     |
   | Auth         |                  +--------------+
   | PostgreSQL   |                         |
   | Storage      | <-----------------------+
   +--------------+
          |
          v
    Certificate
      System
          |
          v
   Lecturer Review
          |
          v
    Final Decision
```

---

# 65. Future Architecture — Google Cloud Migration

Jika nanti tersedia Google Cloud credits atau project ingin dikembangkan menjadi cloud-native architecture:

```text
Current:

Vercel
+
Supabase
+
Gemini API

             ↓

Future:

Vercel
    |
    v
Cloud Run
    |
    +----------------------+
    |                      |
    v                      v
Cloud Storage          Cloud SQL
    |
    v
Pub/Sub
    |
    v
Cloud Run Worker
    |
    +----------------+
    |                |
    v                v
Document AI       Vertex AI
                    |
                    v
                  Gemini
```

---

# 66. Migration Strategy

Migration dilakukan bertahap.

## Step 1

Supabase Storage

→ Google Cloud Storage

## Step 2

Supabase PostgreSQL

→ Cloud SQL PostgreSQL

## Step 3

Next.js Server

→ Cloud Run

## Step 4

Direct AI processing

→ Pub/Sub + Worker

## Step 5

Gemini API

→ Vertex AI

## Step 6

OCR

→ Document AI

Tidak perlu melakukan semua migrasi sekaligus.

---

# 67. Future Event-Driven Architecture

Jika sistem sudah besar:

```text
Upload
  |
  v
Storage
  |
  v
Pub/Sub
  |
  v
AI Worker
  |
  +---- OCR
  |
  +---- Gemini
  |
  v
Database
  |
  v
Notification
```

Pub/Sub berfungsi sebagai queue/event broker.

Tidak diperlukan untuk MVP.

---

# 68. Future OCR Architecture

MVP:

```text
Certificate
   |
   v
Gemini
   |
   v
Analysis
```

Future:

```text
Certificate
   |
   v
Cloud Storage
   |
   v
Document AI
   |
   v
OCR Text
   |
   v
Vertex AI / Gemini
   |
   v
Analysis
```

---

# 69. Why OCR Is Not Separate in MVP

Gemini multimodal dapat digunakan untuk memahami PDF/image.

Karena target MVP adalah:

```text
Low cost
Simple architecture
Fast development
```

maka Document AI tidak wajib digunakan pada tahap pertama.

Document AI dapat ditambahkan jika:

- volume meningkat
- OCR membutuhkan akurasi lebih tinggi
- dokumen memiliki format kompleks
- sistem membutuhkan OCR pipeline khusus

---

# 70. Final Technology Decision

## MVP

```text
Frontend
Next.js
+
Vercel

Authentication
Supabase Auth

Database
Supabase PostgreSQL

Storage
Supabase Storage

AI
Gemini API

Infrastructure
Supabase CLI

Version Control
Git + GitHub
```

## Future

```text
Frontend
Next.js
+
Vercel

Backend
Cloud Run

Database
Cloud SQL

Storage
Cloud Storage

Queue
Pub/Sub

OCR
Document AI

AI
Vertex AI + Gemini
```

---

# 71. Definition of Done

MVP selesai apabila:

- [ ] Student dapat register
- [ ] Student dapat login
- [ ] Lecturer dapat login
- [ ] Admin dapat login
- [ ] Role authorization berjalan
- [ ] Student dapat upload sertifikat
- [ ] File tersimpan di private storage
- [ ] Database certificate record dibuat
- [ ] Gemini dapat membaca sertifikat
- [ ] Gemini menghasilkan structured JSON
- [ ] Hasil AI tersimpan
- [ ] AI recommendation tampil
- [ ] Lecturer dapat melihat sertifikat
- [ ] Lecturer dapat melihat AI analysis
- [ ] Lecturer dapat mengubah bobot
- [ ] Lecturer dapat approve
- [ ] Lecturer dapat reject
- [ ] Student menerima notification
- [ ] Student dapat melihat hasil akhir
- [ ] RLS aktif
- [ ] Storage policy aktif
- [ ] API key aman
- [ ] Service role key aman
- [ ] Supabase schema dapat direproduksi menggunakan CLI
- [ ] Storage bucket dapat dibuat melalui migration
- [ ] Seed data tersedia
- [ ] Project deploy ke Vercel
- [ ] Production environment variables terkonfigurasi

---

# 72. Core Principle

CertiAI harus mengikuti prinsip:

```text
AI assists.
Human decides.
```

AI membantu:

```text
Read
Extract
Classify
Recommend
Explain
```

Dosen menentukan:

```text
Approve
Reject
Final Weight
```

---

# 73. Final System Flow

```text
                         STUDENT
                            |
                            v
                     Upload Certificate
                            |
                            v
                    +---------------+
                    | Supabase      |
                    | Storage       |
                    +-------+-------+
                            |
                            v
                    Certificate Record
                            |
                            v
                       Gemini API
                            |
                            v
                    AI Analysis Result
                            |
                            v
                    +---------------+
                    | Supabase       |
                    | PostgreSQL     |
                    +-------+-------+
                            |
                            v
                    Waiting Review
                            |
                            v
                     +-------------+
                     |  LECTURER   |
                     +------+------+
                            |
                    +-------+-------+
                    |               |
                    v               v
                 APPROVE         REJECT
                    |               |
                    +-------+-------+
                            |
                            v
                     Final Decision
                            |
                            v
                         STUDENT
                            |
                            v
                      Notification
```

---

# 74. Development Priority

Prioritas pengembangan:

```text
1. Project setup
2. Supabase CLI
3. Database migration
4. Authentication
5. Storage
6. Certificate upload
7. Gemini integration
8. AI result
9. Lecturer dashboard
10. Review
11. Notification
12. Security
13. Testing
14. Deployment
```

Jangan membangun fitur kompleks sebelum core workflow berhasil:

```text
Upload
   ↓
AI
   ↓
Review
   ↓
Approve
   ↓
Student receives result
```

Core workflow adalah prioritas utama.
