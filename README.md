# 🌱 Seed Inventory Tracker

A full-stack seed inventory management system designed for gardeners, urban farms, and small-scale agricultural projects to track seed stock, planting data, and inventory levels.

This application provides a clean, modern interface for managing crops, combined with secure authentication and cloud-backed data storage.

---

## 🚀 Live Demo

👉 https://seed-inventory-tracker.vercel.app/

---

## ✨ Features

### 🌾 Inventory Management

* Create, read, update, and delete crop records
* Track seed quantities and availability
* Prevent invalid operations (e.g., negative stock)

### 🔐 Authentication

* Google OAuth login via Supabase
* Per-user data isolation (each user has their own inventory)

### 📊 Data Organization

* Search, filter, and sort crops
* Clean card-based UI for quick scanning
* Mobile-friendly responsive design

### ⚡ Performance & UX

* Fast React frontend built with Vite
* Optimized rendering using React hooks
* Smooth and modern UI design

### 📱 Progressive Web App (PWA)

* Installable on desktop and mobile devices
* Runs as a standalone app (no browser UI)
* Offline-ready architecture (UI caching enabled)

---

## 📸 Screenshots

### 🔐 Login

![Login](assets/login.png)

### 🌾 Dashboard

![Dashboard](assets/dashboard.png)

### 📊 Inventory View

![Dashboard View](assets/dashboard2.png)

---

## 📱 Mobile Install (PWA)

Installable on mobile devices for a native app experience.

<p align="center">
  <img src="assets/mobile.png" width="250"/>
</p>

---

## 🛠️ Tech Stack

### Frontend (`/webapp`)

* React (Vite)
* Supabase (Auth + Database)
* CSS (custom styling)

### Backend (root)

* Java
* Spring Boot
* Spring Data JPA
* PostgreSQL
* Maven

---

## 📁 Project Structure

```
seed-inventory-app/
├── src/                # Spring Boot backend
├── pom.xml
├── webapp/             # React + Vite frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
```

---

## ▶️ Running the App Locally

### Backend

```bash
./mvnw spring-boot:run
```

### Frontend

```bash
cd webapp
npm install
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file inside `/webapp`:

```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

## 🔮 Future Improvements

* Full offline support (local caching + sync)
* Push notifications for low inventory
* Crop planting/harvest tracking
* Image uploads for crops
* Analytics dashboard

---

## 👤 Author

Built and maintained by Danny Hasen
