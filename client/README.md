# ZenLogger - Meditation Timer

ZenLogger is a focused, minimalist meditation timer built with React, Vite, and Capacitor. It provides a serene experience with customizable sounds, themes, and a unique focus mode.

## Features

- **Minimalist Timer**: Large, clear display with easy-to-adjust goals.
- **Themes**: 
  - **Light**: Clean and bright.
  - **Dark**: Low-light friendly.
  - **OLED Black**: Pure black theme for maximum battery savings and contrast.
- **Focus Mode**: A distraction-free mode that replaces the UI with a simple vertical line.
  - Line height indicates remaining time.
  - Anti-burn-in movement: Shifts horizontally every minute.
  - Tap anywhere to exit.
- **Alert Sounds**: Choose from a variety of calming sounds (Rain, Wind Chimes, Singing Bowls, etc.).
- **Session History**: Track your meditation progress with a List or Calendar view.
- **Background Support**: 
  - Timer stays accurate even when the app is backgrounded.
  - Local system notifications alert you when your session is complete.
- **Smart Screen Management**: Keeps the screen awake during Focus Mode, but allows it to sleep once the timer finishes.

## Tech Stack

- **Frontend**: React (TypeScript), Vite
- **Mobile Framework**: Capacitor
- **State Management**: React Hooks
- **Storage**: Capacitor Preferences
- **Native Plugins**: 
  - `@capacitor/local-notifications`
  - `@capacitor/app`
  - `@capacitor-community/keep-awake`

## Development

### Running the App

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```

### Android Development

1. Sync Capacitor with the Android project:
   ```bash
   npx cap sync android
   ```
2. Run on a connected device or emulator with live reload:
   ```bash
   npx cap run android --live-reload --host <your-ip> --port 5173
   ```
   *Note: Use `10.0.2.2` as the host for the Android Emulator.*

## Asset Credits

Sounds sourced from Freesound and Floraphonic.
