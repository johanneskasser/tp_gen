# Admin Scripts

This directory contains administrative scripts for managing the application.

## test-vdot-predictions.ts

Tests and displays race time predictions for all users in the database.

### Prerequisites

```bash
npm install -g tsx
```

### Environment Variables

The script requires these environment variables (automatically loaded from `.env`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Usage

```bash
npx tsx scripts/test-vdot-predictions.ts
```

### What It Does

1. Fetches all user profiles with VDOT values
2. Calculates race predictions for 5K, 10K, Half Marathon, and Marathon
3. Displays predictions using the corrected Daniels-Gilbert formula
4. Verifies that all predictions are realistic

### Output Example

```
🏃 Testing VDOT Race Predictions for All Users

================================================================================
Found 3 users with VDOT values

👤 Max Mustermann (VDOT: 52.3)
--------------------------------------------------------------------------------
  5K             : 19:12
  10K            : 39:52
  Half Marathon  : 1:28:15
  Marathon       : 3:04:22

👤 Anna Schmidt (VDOT: 45.8)
--------------------------------------------------------------------------------
  5K             : 22:34
  10K            : 46:48
  Half Marathon  : 1:43:12
  Marathon       : 3:35:45

================================================================================
✅ All predictions calculated using corrected Daniels-Gilbert formula
📊 These predictions are now displayed in the app for all users
```

## Important Notes

- **Race predictions are NOT stored in the database** - they are calculated dynamically in the app
- The corrected formula is automatically applied for all users when they open the app
- No data migration is needed - the fix is already live
- VDOT values are correctly calculated from personal bests using `calculateVDOT()`
- Only `projectRaceTime()` was corrected to fix the race time predictions
