# MindBridge

An end-to-end EdTech platform where instructors can build and publish courses, and students can browse, purchase, and learn through a structured video curriculum with progress tracking. Built as a self-directed full-stack project (Jan – May 2024) to go deep on the MERN stack, third-party integrations, and production deployment end-to-end.

**Live site:** [mind-bridge-two.vercel.app](https://mind-bridge-two.vercel.app/)


---

## Table of Contents

<!-- - [Screenshots](#screenshots) -->
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Data Model](#data-model)
- [Key Flows](#key-flows)
- [Engineering Highlights](#engineering-highlights)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Roadmap](#roadmap)

---

<!-- ## Screenshots

| | |
|---|---|
| **Homepage** ![Homepage](screenshots/homepage.png) | **Course Catalog** ![Catalog](screenshots/course-catalog.png) |
| **Course Details** ![Course Details](screenshots/course-details.svg) | **Enrolled Courses & Progress Bar** ![Video Player](screenshots/enrolled_progress_bar.png) |
| **Student Dashboard** ![Student Dashboard](screenshots/student-dashboard.svg) | **Instructor Dashboard** ![Instructor Dashboard](screenshots/instructor-dashboard.svg) |
| **Add Course Wizard** ![Add Course](screenshots/add-course.svg) | **Cart & Checkout** ![Cart](screenshots/cart-checkout.svg) |
| **MediBot Assistant** ![MediBot](screenshots/medibot.svg) | **Mobile Navigation** ![Mobile Nav](screenshots/mobile-nav.svg) |

--- -->

## Features

**For Students**
- Browse courses by category, view detailed curriculum before purchasing
- Secure checkout via Razorpay, instant enrollment on payment success
- Structured video player with per-lecture progress tracking
- Personal dashboard: enrolled courses, cart, profile management
- Rate and review completed courses

**For Instructors**
- Multi-step course builder: course info → curriculum (sections/sub-sections) → publish
- Video and thumbnail upload via Cloudinary
- Instructor dashboard with enrollment stats and revenue visualization (Chart.js)
- Draft/Published course states

**Platform-wide**
- JWT-based authentication with email OTP verification on signup
- Forgot-password flow with time-limited reset tokens
- Responsive design, including a fully functional mobile navigation menu
- **MediBot** — an in-app AI assistant (Google Gemini) for quick student Q&A
- Category-based course discovery with a live category dropdown

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Redux Toolkit, React Router v6, Tailwind CSS |
| Frontend data | Axios, TanStack React Query (caching layer) |
| Backend | Node.js, Express |
| Database | MongoDB (Atlas), Mongoose ODM |
| Auth | JWT, bcrypt, email OTP |
| Media storage | Cloudinary |
| Payments | Razorpay |
| Transactional email | Brevo (HTTP API) |
| AI Assistant | Google Gemini (`@google/genai`) |
| Hosting | Vercel (frontend), Render (backend) |

---

## System Architecture

```mermaid
graph TB
    subgraph Client["Client — Browser"]
        UI["React SPA<br/>(Redux + React Query)"]
    end

    subgraph Vercel["Vercel"]
        Static["Static Build<br/>(CDN-served, code-split routes)"]
    end

    subgraph Render["Render"]
        API["Express REST API<br/>(JWT auth middleware)"]
    end

    subgraph DataLayer["Data & Storage"]
        Mongo[("MongoDB Atlas")]
        Cloud["Cloudinary<br/>(images / video)"]
    end

    subgraph ThirdParty["Third-Party Services"]
        Razorpay["Razorpay<br/>(payments)"]
        Brevo["Brevo<br/>(transactional email)"]
        Gemini["Google Gemini<br/>(MediBot AI)"]
    end

    UI -->|"HTTPS"| Static
    UI -->|"REST calls, JWT bearer"| API
    UI -->|"direct AI calls"| Gemini
    API -->|"Mongoose ODM"| Mongo
    API -->|"signed uploads"| Cloud
    API -->|"order + verify signature"| Razorpay
    API -->|"HTTP API"| Brevo
```

**Design notes:**
- The frontend is a statically-built SPA served from Vercel's CDN, with route-level code splitting so users only download the JS for pages they actually visit.
- The backend is a stateless REST API — no server-side sessions, auth is entirely JWT-bearer-token based — which keeps it trivially horizontally scalable if it ever needed more than one instance.
- MediBot calls Gemini directly from the client rather than proxying through the backend.

---

## Data Model

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String firstName
        +String lastName
        +String email (unique)
        +String password (hashed, select:false)
        +String accountType (Admin|Student|Instructor)
        +Boolean active
        +Boolean approved
        +String image
        +String token
        +Date resetPasswordExpires
    }

    class Profile {
        +ObjectId _id
        +String gender
        +String dateOfBirth
        +String about
        +Number contactNumber
    }

    class Course {
        +ObjectId _id
        +String courseName
        +String courseDescription
        +String whatYouWillLearn
        +Number price
        +String thumbnail
        +String[] tag
        +String[] instructions
        +String status (Draft|Published)
        +Date createdAt
    }

    class Category {
        +ObjectId _id
        +String name
        +String description
    }

    class Section {
        +ObjectId _id
        +String sectionName
    }

    class SubSection {
        +ObjectId _id
        +String title
        +String timeDuration
        +String description
        +String videoUrl
    }

    class RatingAndReview {
        +ObjectId _id
        +Number rating
        +String review
    }

    class CourseProgress {
        +ObjectId _id
    }

    class OTP {
        +ObjectId _id
        +String email
        +String otp
        +Date createdAt (TTL: 5 min)
    }

    User "1" --> "1" Profile : additionalDetails
    User "1" --> "*" Course : enrolled (studentsEnroled)
    User "1" --> "1" Course : authors (instructor)
    Course "1" --> "*" Section : courseContent
    Section "1" --> "*" SubSection : subSection
    Course "*" --> "1" Category : category
    Course "1" --> "*" RatingAndReview : ratingAndReviews
    RatingAndReview "*" --> "1" User : user
    CourseProgress "*" --> "1" User : userId
    CourseProgress "*" --> "1" Course : courseID
    CourseProgress "1" --> "*" SubSection : completedVideos
```

---

## Key Flows

**Signup + Email Verification**
```mermaid
sequenceDiagram
    participant S as Student
    participant F as Frontend
    participant B as Backend
    participant M as Brevo (Email)
    participant DB as MongoDB

    S->>F: Fill signup form
    F->>B: POST /auth/sendotp
    B->>DB: Store OTP (5 min TTL)
    B->>M: Send OTP email
    M-->>S: OTP delivered
    S->>F: Enter OTP + submit signup
    F->>B: POST /auth/signup
    B->>DB: Verify OTP, create User + Profile
    B-->>F: Success
```

**Course Purchase**
```mermaid
sequenceDiagram
    participant S as Student
    participant F as Frontend
    participant B as Backend
    participant R as Razorpay
    participant DB as MongoDB

    S->>F: Click "Buy Now"
    F->>B: POST /payment/capturePayment
    B->>R: Create order
    R-->>F: Razorpay checkout modal
    S->>R: Complete payment
    R-->>F: Payment response + signature
    F->>B: POST /payment/verifyPayment
    B->>B: Verify signature (HMAC)
    B->>DB: Enroll student in course
    B->>M: Send confirmation email
    B-->>F: Enrollment confirmed
```

---

## Engineering Highlights

A few things worth calling out beyond "it's a CRUD app":

- **Route-level code splitting** — every dashboard/course route is behind `React.lazy` + `Suspense`, so the initial bundle only ships what the landing page actually needs.
- **Data-fetch caching** — category and course-list fetches moved from raw `useEffect` + Axios to React Query, cutting redundant network calls on every navigation.
- **API response shaping** — course listing endpoints are paginated server-side rather than returning the full published-course set unbounded.
- **Deployment hygiene** — gzip/brotli compression on all API responses, environment-driven config, and a documented, redeploy-triggering environment variable flow across two separate hosting platforms (Vercel + Render).

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster
- Cloudinary, Razorpay, Brevo, and Google AI Studio accounts (all have free tiers)

### Frontend
```bash
npm install
npm start
```

### Backend
```bash
cd server
npm install
npm run dev
```

---

## Environment Variables

**Frontend (`.env` at project root)**
```env
REACT_APP_SERVER_URL=http://localhost:4000/api/v1
REACT_APP_API_KEY=your_gemini_api_key
```

**Backend (`server/.env`)**
```env
PORT=4000
MONGODB_URL=your_mongodb_atlas_connection_string
JWT_SECRET=your_random_secret
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
FOLDER_NAME=your_cloudinary_folder
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_verified_sender_email
RAZORPAY_KEY=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_key_secret
```

---

## Roadmap

- [ ] Proxy MediBot's Gemini calls through the backend instead of calling the AI API directly from the client
- [ ] Redis caching layer in front of high-read, low-write endpoints (category list, published courses)
- [ ] Automated test coverage (currently none) and a CI pipeline to run it on every PR
- [ ] Aggregation-pipeline refactor of the deepest course-detail queries to cut down on chained `populate()` round-trips

---

## Author

**Harsh Goel**
Self-directed full-stack project, Jan – May 2024.
