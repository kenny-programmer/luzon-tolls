# 🚗 Luzon Toll Calculator

A modern, mobile-responsive web application designed to help motorists estimate toll fees across major expressways in Luzon, Philippines.

---

## 🌟 Features

* **Real-time Calculation:** Get instant toll fee estimates for Class 1, 2, and 3 vehicles.
* **Comprehensive Coverage:** Supports **SLEX, Skyway 3, NLEX, SCTEX, TPLEX, and STAR Tollway**.
* **Smart Search:** Filterable dropdowns for entry and exit points with expressway grouping.
* **Dark Mode Support:** Seamless transition between light and dark themes.
* **Recent History:** Saves your last 4 searches locally for quick access.
* **Popular Routes:** One-tap calculation for common trips like Manila to Baguio or Batangas.
* **Toll Matrix View:** View the full breakdown of rates in a structured table.

---

## 🛠️ Tech Stack

* **Frontend:** React.js with TypeScript
* **Styling:** Tailwind CSS (Utility-first styling)
* **Icons:** Lucide React
* **State Management:** React Hooks (useState, useEffect, useContext)
* **Deployment:** Netlify

---

## 🚀 Getting Started

1. Clone the repository:
   git clone https://github.com/kenny-programmer/luzon-tolls.git

2. Install dependencies:
   npm install

3. Run the development server:
   npm run dev

4. Open the app:
   Navigate to http://localhost:5173 in your browser.

---

## 📁 Project Structure

src/
├── components/       # Reusable UI components (ResultCard, TollMatrix, etc.)
├── contexts/         # Theme and Global state logic
├── lib/              # Core logic (Toll data and calculation algorithms)
├── App.tsx           # Main application logic and layout
└── main.tsx          # Entry point

---

## 📝 Disclaimer

This tool provides estimates based on data from the Toll Regulatory Board (TRB). Actual rates may vary due to recent price adjustments or specific entry/exit configurations.

---

## 👨‍💻 Developer

**Victor "Ken" Roxas** *Full-Stack Developer*

* **Portfolio:** https://victorroxas.vercel.app
* **GitHub:** @kenny-programmer

If this tool helped you, consider [buying me a coffee](https://buymeacoffee.com/victorroxas)!
