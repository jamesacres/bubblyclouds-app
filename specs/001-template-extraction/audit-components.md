# Component Audit: Generic vs Sudoku-Specific

## Generic Components (Move to Template)

### Core UI Components
- **ErrorBoundary/** - Generic error boundary wrapper
- **GlobalErrorHandler/** - Generic error handler
- **Header/** - Generic header component
- **HeaderBack/** - Generic back button header
- **HeaderUser/** - Generic user display in header
- **HeaderOnline/** - Generic online status indicator
- **Footer/** - Generic footer component

### Theme & Settings
- **ThemeSwitch/** - Theme switcher component
- **ThemeControls/** - Theme control panel
- **ThemeColorSwitch/** - Color theme switcher

### Utility Components
- **CopyButton/** - Generic copy-to-clipboard button
- **Toggle/** - Generic toggle component
- **SocialProof/** - Generic social proof display
- **CelebrationAnimation/** - Generic celebration/confetti animation
- **PremiumFeatures/** - Generic premium features display
- **AppDownloadModal/** - Generic app download modal

### Tab Navigation
- **tabs/** directory - Generic tab navigation components

## Sudoku-Specific Components (Keep in Sudoku)

### Game Components
- **Sudoku/** - Main Sudoku game component
- **SudokuBox/** - Sudoku cell component
- **SudokuInput/** - Sudoku input component
- **SudokuInputNotes/** - Sudoku notes input
- **SudokuControls/** - Game controls
- **SudokuSidebar/** - Game sidebar
- **SimpleSudoku/** - Simple sudoku display
- **NumberPad/** - Number input pad for sudoku
- **HintBox/** - Hint display for puzzles

### Session/Party Components
- **IntegratedSessionRow.tsx** - Session list item
- **ActivityWidget.tsx** - Activity display widget
- **PartyRow/** - Party list item
- **PartyInviteButton/** - Invite to party button
- **PartyConfirmationDialog/** - Party confirmation modal
- **RaceTrack/** - Racing visualization
- **RacingPromptModal/** - Racing prompt

### Book/Content Components
- **BookCovers/** - Book cover displays

### Game UI
- **TimerDisplay/** - Timer for puzzles
- **TrafficLight/** - Race status indicator
- **leaderboard/** - Leaderboard components
- **SidebarButton/** - Sidebar navigation button

## Summary
- **Generic**: 16 components to extract
- **Sudoku-Specific**: 22+ components to keep
