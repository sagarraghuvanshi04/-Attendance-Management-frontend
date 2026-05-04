# Attendance Management System

A full-stack web application for managing employee attendance with face recognition, location tracking, overtime workflows, and role-based dashboards.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Default Credentials](#default-credentials)
- [API Reference](#api-reference)
- [Assumptions](#assumptions)

---

## Tech Stack

**Frontend**
- React 19 + Vite
- Redux Toolkit + RTK Query (state management and API calls)
- Tailwind CSS (styling)
- face-api.js (in-browser face recognition)
- jsPDF + jspdf-autotable (PDF export)
- react-hot-toast (notifications)

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose
- JSON Web Tokens (authentication)
- bcryptjs (password hashing)
- Winston + Morgan (logging)

**Database**
- MongoDB Atlas (cloud) — database name: `managment`

---

## Features

### Authentication & Authorization
- Secure signup and login with JWT (7-day expiry)
- Role-based access control — three roles: Employee, Manager, Admin
- Protected routes on both frontend (WorkPrivateRoute) and backend (authMiddleware)
- Passwords hashed with bcryptjs before storage

### Attendance — Punch In / Punch Out
- Live camera selfie capture using the browser's MediaDevices API (no file upload)
- GPS location captured (latitude and longitude) at both punch-in and punch-out
- Face recognition powered by face-api.js using three models:
  - TinyFaceDetector — detects face presence
  - FaceLandmark68Net — maps 68 facial landmarks
  - FaceRecognitionNet — generates a 128-float face descriptor
- The 128-float descriptor from punch-in is stored on the attendance record
- At punch-out, Euclidean distance is computed between the stored and incoming descriptor
- If distance > 0.5, punch-out is rejected with a 403 response — proxy attendance is blocked
- Stores: punch-in time, punch-out time, selfie image (base64), location, working hours

### Working Hours Logic
- Standard shift is 8 hours
- `shiftStatus` is set automatically:
  - `Completed` — working hours ≥ 8
  - `Incomplete` — working hours < 8
  - `Absent` — no punch-in recorded

### Overtime Workflow
- Employee submits an OT request with hours and reason after punching in
- Manager (or Admin) receives an in-app notification
- Manager/Admin can approve or reject from the OT Requests page
- Employee receives an in-app notification on approval or rejection
- OT status is reflected on the attendance record and employee dashboard

### Dashboards

**Employee**
- Today's punch-in/out times and working hours
- Shift completion status
- Recent attendance history
- Overtime request tracking

**Manager**
- Personal attendance (manager also punches in/out)
- Team attendance for today with present/absent breakdown
- Pending OT requests count
- Team member list with real-time status

**Admin**
- System-wide attendance overview
- User role breakdown (Employee / Manager / Admin counts)
- Pending OT and pending validation counts
- Today's attendance for all users

### Attendance Validation
- Manager and Admin can view employee selfies for a selected date
- Each record can be marked as Valid, Invalid, or left as Pending
- Remarks/notes can be added per record
- Validation status is visible to the employee on their dashboard

### Reports
- Daily attendance report filterable by date
- Includes: name, role, department, punch-in/out times, working hours, shift status, GPS coordinates, selfie thumbnail, validation status
- Access is role-filtered:
  - Employee sees only their own data
  - Manager sees their team's data
  - Admin sees all users
- Admin can export reports as PDF or CSV

### User Management (Admin)
- Create new users with name, email, password, role, department, and assigned manager
- Edit existing users (role, department, manager assignment, active status)
- Delete users
- Search and paginate the user list

### Notifications
- In-app notification bell with unread count badge
- Notifications for: OT approved, OT rejected, OT request received (manager)
- Mark individual or all notifications as read

### Filters & Pagination
- Date range filters on attendance history, team attendance, and all-attendance views
- User filter on admin attendance view
- Pagination on the manage users table (10 per page)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        Frontend                         │
│                                                         │
│  React + Vite                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Employee   │  │   Manager    │  │    Admin     │  │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  Redux Store (authSlice)                                │
│  RTK Query (attendanceApi) ──── all API calls           │
│  face-api.js ──── runs entirely in browser              │
│  WorkPrivateRoute ──── role-based route protection      │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / REST
┌────────────────────────▼────────────────────────────────┐
│                        Backend                          │
│                                                         │
│  Express 5 + Node.js                                    │
│  Morgan (HTTP logging) → Winston (file + console)       │
│                                                         │
│  Routes:                                                │
│  /api/work/auth          → userAuthRoute                │
│  /api/work/attendance    → workAttendanceRoute          │
│  /api/work/notifications → workNotificationRoute        │
│                                                         │
│  authMiddleware → JWT verification + role check         │
│                                                         │
│  Face Verification:                                     │
│  Euclidean distance between 128-float descriptors       │
│  Threshold: 0.5 (stricter than face-api default 0.6)    │
└────────────────────────┬────────────────────────────────┘
                         │ Mongoose ODM
┌────────────────────────▼────────────────────────────────┐
│                     MongoDB Atlas                       │
│                   database: managment                   │
│                                                         │
│  Collections:                                           │
│  users             → credentials, role, faceDescriptor  │
│  workattendances   → punch times, selfies, descriptors  │
│  worknotifications → in-app alerts                      │
└─────────────────────────────────────────────────────────┘
```

### Face Recognition Flow

```
Punch In
  │
  ├── Browser captures live video frame
  ├── face-api.js detects face + extracts 128-float descriptor
  ├── Descriptor + selfie + GPS sent to backend
  ├── Backend stores descriptor on attendance record (punchInFaceDescriptor)
  └── Punch-in saved ✓

Punch Out
  │
  ├── Browser captures live video frame
  ├── face-api.js extracts 128-float descriptor
  ├── Descriptor + selfie + GPS sent to backend
  ├── Backend loads today's attendance record
  ├── Computes Euclidean distance(punchInFaceDescriptor, incomingDescriptor)
  ├── distance ≤ 0.5 → same person → punch-out saved ✓
  └── distance > 0.5 → different person → 403 rejected ✗
```

---

## Project Structure

```
├── LibraryManagementBackend/
│   ├── controller/
│   │   ├── userAuthController.js       # login, signup, getMe
│   │   ├── workAttendanceController.js # punch in/out, OT, validation, reports
│   │   └── workNotificationController.js
│   ├── middleware/
│   │   └── authMiddleware.js           # JWT + role verification
│   ├── model/
│   │   ├── userModel.js                # User schema with faceDescriptor
│   │   ├── workAttendanceModel.js      # Attendance schema with punchInFaceDescriptor
│   │   └── workNotificationModel.js
│   ├── routes/
│   │   ├── userAuthRoute.js
│   │   ├── workAttendanceRoute.js
│   │   └── workNotificationRoute.js
│   ├── utils/
│   │   ├── db.js                       # MongoDB connection (forces managment db)
│   │   └── logger.js                   # Winston logger
│   └── index.js
│
└── LibraryManagementFrontend-1/
    ├── public/
    │   └── models/                     # face-api.js model weight files
    └── src/
        ├── components/
        │   ├── FaceRecognition.jsx     # Live camera + face detection + descriptor
        │   ├── SelfieCapture.jsx       # Basic camera capture (fallback)
        │   └── WorkPrivateRoute.jsx    # Route guard using Redux auth state
        ├── pages/work/
        │   ├── admin/                  # AdminDashboard, ManageUsers, AllAttendance, AdminReports
        │   ├── employee/               # EmployeeDashboard, Attendance, Overtime, Reports
        │   ├── manager/                # ManagerDashboard, TeamAttendance, OTManagement, Validation
        │   ├── PunchPage.jsx           # Punch in/out with face recognition
        │   ├── WorkAuth.jsx            # Login / Signup
        │   ├── WorkLayout.jsx          # Sidebar layout with notification bell
        │   └── WorkNotifications.jsx
        └── store/
            ├── attendanceApi.js        # RTK Query — all API endpoints
            ├── authSlice.js            # Redux slice for auth state
            └── store.js                # Redux store configuration
```

---

## Setup Instructions

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- A MongoDB Atlas account (or local MongoDB)
- Git

---

### 1. Clone the Repository

```bash
git clone <https://github.com/sagarraghuvanshi04/Attendance-Management-backend.git>
          <https://github.com/sagarraghuvanshi04/-Attendance-Management-frontend.git>
```

---

### 2. Backend Setup

```bash
cd LibraryManagementBackend
npm install
```

Create a `.env` file in the `LibraryManagementBackend` folder:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/managment?retryWrites=true&w=majority
PORT=5000
JWT_SECRET=your_strong_secret_key_here
```

> The database name **must** be `managment` in the URI. The `db.js` utility enforces this.

Start the backend:

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

On first startup, a default admin account is created automatically:
- Email: `admin@company.com`
- Password: `admin123`

Logs are written to `logs/combined.log` and `logs/error.log`.

---

### 3. Frontend Setup

```bash
cd LibraryManagementFrontend-1
npm install
```

Create a `.env` file in the `LibraryManagementFrontend-1` folder:

```env
VITE_API_URL=http://localhost:5000/api
```

For production builds, create `.env.production`:

```env
VITE_API_URL=https://your-backend-domain.com/api
```

Start the frontend:

```bash
# Development
npm run dev

# Production build
npm run build
npm run preview
```

The app will be available at `http://localhost:5173`.

---

### 4. Face Recognition Model Files

The face-api.js models must be present in `public/models/`. The following files are required:

```
public/models/
├── tiny_face_detector_model-weights_manifest.json
├── tiny_face_detector_model-shard1
├── face_landmark_68_model-weights_manifest.json
├── face_landmark_68_model-shard1
├── face_recognition_model-weights_manifest.json
├── face_recognition_model-shard1
└── face_recognition_model-shard2
```

If these files are missing, download them from the official face-api.js repository:

```bash
cd LibraryManagementFrontend-1/public/models

# Tiny Face Detector
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1

# Face Landmark 68
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1

# Face Recognition
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2
```

---

## Environment Variables

### Backend

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string — must include `/managment` as the database name |
| `PORT` | No | Server port (default: 5000) |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens — use a long random string in production |

### Frontend

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Full base URL of the backend API including `/api` suffix |

---

## Default Credentials

When the backend starts for the first time, it seeds a default admin account:

| Field | Value |
|---|---|
| Email | admin@company.com |
| Password | admin123 |
| Role | ADMIN |

**Change this password immediately after first login in a production environment.**

To create Manager and Employee accounts, log in as Admin, go to **Manage Users**, and use the **Add User** form.

---

## API Reference

All routes are prefixed with `/api`.

### Auth — `/api/work/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/signup` | Public | Create a new user account |
| POST | `/login` | Public | Login and receive JWT token |
| GET | `/me` | All roles | Get current user profile |

### Attendance — `/api/work/attendance`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/punch-in` | All roles | Punch in with selfie, location, face descriptor |
| POST | `/punch-out` | All roles | Punch out — verifies face against punch-in descriptor |
| GET | `/today` | All roles | Get today's attendance record |
| GET | `/my` | All roles | Get personal attendance history (supports `from`, `to` filters) |
| POST | `/ot-request` | All roles | Submit overtime request |
| GET | `/team` | Manager, Admin | Get team attendance (supports `date`, `from`, `to` filters) |
| GET | `/ot-pending` | Manager, Admin | Get pending OT requests |
| PUT | `/ot/:id` | Manager, Admin | Approve or reject an OT request |
| PUT | `/validate/:id` | Manager, Admin | Mark attendance as Valid or Invalid with remarks |
| GET | `/all` | Admin | Get all attendance records (supports `userId`, `date`, `from`, `to`) |
| GET | `/users` | Admin | Get all users |
| POST | `/users` | Admin | Create a new user (via auth/signup) |
| PUT | `/users/:id` | Admin | Update user details |
| DELETE | `/users/:id` | Admin | Delete a user |
| GET | `/report/daily` | All roles | Daily attendance report (role-filtered) |

### Notifications — `/api/work/notifications`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | All roles | Get notifications with unread count |
| PUT | `/:id/read` | All roles | Mark a single notification as read |
| PUT | `/read-all` | All roles | Mark all notifications as read |

---

## Assumptions

1. **One attendance record per employee per day.** The system does not support multiple shifts or split shifts in a single day.

2. **Face registration happens at first punch-in.** There is no separate face enrollment step. The first time an employee punches in, their face descriptor is captured and stored. All subsequent punch-outs are verified against the descriptor from that day's punch-in record.

3. **Face verification threshold is 0.5.** The Euclidean distance between two 128-float face descriptors must be ≤ 0.5 for a match. The face-api.js default is 0.6 — we use a stricter value to reduce false positives. Lighting conditions and camera quality can affect this.

4. **Face recognition runs entirely in the browser.** No face images or descriptors are sent to any third-party service. The face-api.js models are loaded from the `/public/models/` folder and all computation happens client-side.

5. **Manager-team relationship is set by the Admin.** An employee is assigned to a manager via the `managerId` field. A manager can only see attendance and OT requests for employees assigned to them. Employees with no manager assigned are only visible to Admin.

6. **GPS location is required for punch-in and punch-out.** If the browser blocks location access, the punch action is disabled. The app provides step-by-step instructions to reset location permissions in Chrome.

7. **Selfie images are stored as base64 strings in MongoDB.** This was chosen to keep the setup simple without requiring a separate file storage service. For production at scale, these should be moved to object storage (e.g., AWS S3 or Cloudinary) and only the URL stored in the database.

8. **The standard shift is 8 hours.** Shift status is calculated purely based on the difference between punch-in and punch-out times. There is no concept of scheduled shifts, late arrivals, or early departures beyond the Completed/Incomplete label.

9. **OT requests are per-day and limited to one per day.** An employee can only submit one OT request per attendance record. Once a request is Pending or Approved, a new one cannot be submitted for the same day.

10. **The backend is deployed on Render's free tier.** The server spins down after 15 minutes of inactivity. The first request after a period of inactivity may take 30–60 seconds while the server wakes up. This is a hosting limitation, not a code issue.

---

## Notes for Reviewers

- The face recognition threshold (0.5) was chosen after testing with multiple faces under different lighting conditions. It can be adjusted in `workAttendanceController.js` if needed.
- All HTTP requests are logged via Morgan and written to `logs/combined.log` using Winston. Errors are separately written to `logs/error.log`.
- The frontend handles offline detection and shows a banner when the network is unavailable, preventing confusing error states.
- RTK Query handles caching and cache invalidation automatically — for example, after a punch-in, the today's status query is automatically refetched without a manual reload.
