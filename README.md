# Adamas (Call Center Helper) [BETA]

**Current Status**: 🚧 Public Beta

Adamas is a modern React web app built with Vite, designed to assist call center agents with workflows, note-taking, and number formatting. It features a responsive UI, modular SCSS styling, and persistent local storage for data management. Structured with reusable components, it provides a streamlined experience for daily operations.

## Features

- **Call Flow Builder**: Create, edit, reorder, and track call flow steps with checkboxes.
- **Notes Management**: Take and organize notes per call or session with persistent storage.
- **Pattern Formatter**: Format phone numbers and other data using customizable patterns with auto-copy functionality.
- **Timer**: Integrated hold timer with pause/resume capabilities.
- **Settings & Themes**: Switch between light and dark modes, customize preferences.
- **Modern Stack**: Developed with React and Vite for fast builds and a declarative UI.

## Project Structure

Adamas/
├── src/
│   ├── components/      # Reusable React components
│   ├── styles/          # Modular SCSS files
│   ├── App.jsx          # Main application logic
│   └── main.jsx         # React entry point
├── public/              # Static assets
├── vite.config.js       # Vite configuration
├── package.json         # Dependencies and scripts
└── README.md

## Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
   `git clone https://github.com`
2. Enter directory:
   `cd Adamas`
3. Install dependencies:
   `npm install`

## Development

Start the development server:
`npm run dev`
The application will be available at `http://localhost:5173`.

## Building

Create a production build:
`npm run build`
This generates optimized files in the `dist/` directory.

## Usage

- Launch the app to access the **Call Flow Builder**.
- Use the **Pattern Formatter** for quick data entry.
- All notes and settings are saved automatically via **Local Storage**.

## License

**License:** [CC BY-NC-ND 4.0](https://creativecommons.org)

This software and its documentation are the exclusive property of Daniel Hipskind. Unauthorized reproduction or distribution of this work is prohibited.