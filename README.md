# 🎓 Modern GPA Calculator (SGPA & CGPA)

A **modern, responsive, and accurate GPA Calculator** built using **HTML, CSS, and Vanilla JavaScript**.  
This project helps students calculate their **Semester GPA (SGPA)** and **Cumulative GPA (CGPA)** with **support for repeated courses and grade replacement logic**.

Designed with a clean UI, smooth animations, and realistic academic workflows.

---

## ✨ Features

- ✅ Calculate **SGPA (Semester GPA)**
- ✅ Calculate **updated CGPA**
- 🔁 Supports **repeated courses (grade replacement)**
- 📊 Handles **existing CGPA & earned credits**
- 🎨 Modern UI with animations & micro-interactions
- 📱 Fully responsive (desktop & mobile)
- ⚡ Instant calculation (no backend required)

---

## 🧠 GPA Logic (How It Works)

### SGPA
Calculated using only **current semester courses**:


---

### CGPA (with Repeated Courses)

- Existing CGPA & credits are converted into **quality points**
- For **new courses**:
  - Credits & quality points are added
- For **repeated courses**:
  - Old grade quality points are **removed**
  - New grade quality points are **added**
  - Credits are **not duplicated**

This matches real university grade-replacement logic.

---

## 🎯 Grading Scale

| Grade | Points |
|------|--------|
| A    | 4.00   |
| A-   | 3.67   |
| B+   | 3.33   |
| B    | 3.00   |
| B-   | 2.67   |
| C+   | 2.33   |
| C    | 2.00   |
| C-   | 1.67   |
| D+   | 1.33   |
| D    | 1.00   |
| F    | 0.00   |

---

## 🖥️ Tech Stack

- **HTML5** – semantic structure
- **CSS3** – modern UI, animations, responsive layout
- **JavaScript (Vanilla)** – GPA logic & DOM handling
- **Google Fonts (Inter)**
- **Font Awesome Icons**

No frameworks. No libraries. Just clean fundamentals.

---
