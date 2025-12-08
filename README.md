# Scriptle https://scriptle.netlify.app/

**Scriptle** is a beautifully designed, flashcard-style web application dedicated to the mastery of world writing systems. Combining an "Dark Academia" aesthetic with rapid-fire game mechanics, it helps users learn to identify characters from various alphabets, abjads, and syllabaries—from Cyrillic to Katakana.

## Overview

Scriptle gamifies the process of memorizing scripts. It tracks your progress, allowing you to "Master" a script by completing it, or "Perfect" it by completing it without errors in **Strict Mode**. The application features a responsive, distraction-free interface that mimics the feel of reviewing archival documents or museum exhibits.

## Features

### Game Modes

  * **Standard Assessment:** A timed quiz where you must identify every character in a specific script.
  * **Strict Mode:** For the perfectionist. Disables fuzzy matching; answers must be exact. Earning a perfect score here unlocks the **Gold/Perfected** card styling.
  * **Practice Mode:** Removes the timer and penalties. Ideal for studying new scripts. Includes a "Reveal" button for learning.
  * **Chaos Mode:** An endless, randomized stream of characters from all available scripts. Great for testing retention across different writing systems.

### Progression & Feedback

  * **Mastery System:** Unlocks a "Mastered" badge for completing a script.
  * **Perfection System:** Unlocks a shimmering Gold card theme and "Perfected" badge for 100% accuracy in Strict Mode.
  * **Visual Feedback:** Shake animations for errors, card flips for reveals, and confetti/shimmer effects for achievements.
  * **Local Storage:** Progress is saved automatically to your browser.

### Design & UI

  * **Layouts:** Toggle between a **Grid View** (seeing the whole alphabet at once) or **Card View** (focused single-character flashcards).
  * **Aesthetic:** Uses a "Light/Dark Academia" palette (Stone, Amber, Off-White) with serif typography and binder-hole details.
  * **Responsive:** Fully optimized for desktop and mobile play.

## Tech Stack

  * **Framework:** React 18
  * **Language:** TypeScript
  * **Styling:** Tailwind CSS
  * **Icons:** Lucide React
  * **Build Tool:** Vite

## Getting Started

To run Scriptle locally on your machine, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/scriptle.git
    cd scriptle
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

4.  **Open your browser:**
    Navigate to `http://localhost:5173` (or the port shown in your terminal).

## How to Add New Scripts

Scriptle is designed to be extensible. To add a new writing system (e.g., Greek, Arabic, Runes):

1.  Open `src/scripts.ts`.
2.  Add a new entry to the `SCRIPTS` array following this schema:
    ```typescript
    {
      id: 'greek',
      title: 'Greek',
      description: 'The script of philosophy and mathematics.',
      color: 'bg-blue-600', // Tailwind class for the accent line
      items: [
        { char: 'Α', name: 'Alpha', accepted: ['alpha', 'a'] },
        { char: 'Β', name: 'Beta', accepted: ['beta', 'b'] },
        // ...
      ]
    }
    ```
3.  Save the file. The new script will automatically appear in the menu.

## Contributing

Contributions are welcome\! If you have suggestions for new features, bug fixes, or new script data files:

1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/NewScript`).
3.  Commit your changes (`git commit -m 'Added Ancient Runes'`).
4.  Push to the branch (`git push origin feature/NewScript`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.
