# TodoList Application

## 📁 Project Structure

```
/home/alterxue/projet/todolist/
├── server/          ← Backend API (Express + PostgreSQL)
├── client/          ← Web Frontend (React + Vite)
├── expo-app/        ← Native Mobile App (React Native + Expo)
└── README.md
```

## 🚀 Quick Start

### 1️⃣ Start Backend
```bash
cd server
npm run dev
# → http://localhost:3001
```

### 2️⃣ Start Web Frontend
```bash
cd client
npm run dev -- --host
# → http://localhost:5173
# → http://172.20.10.6:5173 (Mobile access)
```

### 3️⃣ Start Expo Mobile App
```bash
cd expo-app
expo start --lan
# Scan QR Code with Expo Go
```

## 📱 Access Methods

**Computer:**
- Web: http://localhost:5173

**Mobile:**
- Web: http://172.20.10.6:5173
- Expo: Scan QR Code (requires Expo Go app)

## ✨ Features

✅ User registration and login (JWT auth)
✅ Project management (create/delete)
✅ Todo management (create/complete/delete)
✅ Project due dates
✅ Multi-device sync
✅ Responsive design
✅ Native mobile app (Expo)

## 🛠 Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT authentication
- bcrypt password encryption

**Frontend:**
- React 19
- Vite 7
- React Router 7
- Tailwind CSS 4
- Axios

**Mobile:**
- React Native (Expo)
- Native UI components
- Secure token storage