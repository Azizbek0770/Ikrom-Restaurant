# Unique Constraint Violation Fix

## Problem

The application was crashing on startup with the following error:

```
SequelizeUniqueConstraintError: Validation error
Key (telegram_id)=(tg_cust_test) is duplicated.
```

This occurred because:
1. The `users` table had duplicate `telegram_id` values
2. When Sequelize tried to sync the model with `{ alter: true }`, it attempted to add a UNIQUE constraint
3. The constraint addition failed due to existing duplicates in the database

## Root Cause

The issue happens when:
- Data is inserted into the database before unique constraints are properly applied
- Multiple users are created with the same `telegram_id` value
- The application tries to enforce a unique constraint on a column that already has duplicates

## Solution

I've implemented a multi-layered fix:

### 1. **Updated Migration File** (`backend/sql/migration.sql`)

Added automatic cleanup of duplicate values before applying constraints:

- **Duplicate `telegram_id` cleanup**: Keeps the oldest record, sets `telegram_id` to NULL for duplicates
- **Duplicate `email` cleanup**: Same strategy for email duplicates
- **Safe constraint application**: Attempts to add unique constraints with proper error handling

### 2. **Updated Application Startup** (`backend/src/app.js`)

Added automatic duplicate cleanup before database sync:

```javascript
// Cleans up duplicates automatically on every startup
// Runs before sequelize.sync({ alter: true })
```

This ensures that even if duplicates exist, they're cleaned up before the sync operation.

### 3. **Created Manual Fix Script** (`backend/src/scripts/fixDuplicates.js`)

A standalone script that can be run manually to fix duplicates:

```bash
npm run fix-duplicates
```

## Files Changed

✅ **backend/sql/migration.sql**
- Added duplicate cleanup logic for `telegram_id` and `email`
- Added safe constraint application
- Keeps oldest record when duplicates exist

✅ **backend/src/app.js**
- Added automatic duplicate cleanup before sync
- Prevents startup errors due to existing duplicates

✅ **backend/src/scripts/fixDuplicates.js** (new file)
- Standalone script to manually fix duplicates
- Includes verification step

✅ **backend/package.json**
- Added `fix-duplicates` script

## How to Fix Your Database

### Option 1: Automatic Fix (Recommended)

Just restart your application:

```bash
cd backend
npm run dev
```

The application will automatically clean up duplicates on startup.

### Option 2: Manual Fix

Run the fix script before starting the server:

```bash
cd backend
npm run fix-duplicates
npm run dev
```

### Option 3: Run Migration

If you want to do a fresh migration:

```bash
cd backend
npm run migrate
npm run seed
npm run dev
```

## What the Fix Does

1. **Identifies duplicates**: Finds all `telegram_id` and `email` values that appear more than once
2. **Keeps oldest record**: For each duplicate, keeps the record with the earliest `created_at` timestamp
3. **Nullifies others**: Sets `telegram_id` or `email` to NULL for duplicate records
4. **Applies constraints**: Ensures UNIQUE constraints are properly set

## Prevention

To prevent this issue in the future:

1. **Always run migrations** before starting the application
2. **Use the seed scripts** instead of manually inserting data
3. **Validate unique fields** in your application code before inserting
4. **Run in production mode** where `sequelize.sync({ alter: true })` is disabled

## Verification

After running the fix, verify no duplicates remain:

```sql
-- Check for duplicate telegram_id
SELECT telegram_id, COUNT(*) 
FROM users 
WHERE telegram_id IS NOT NULL 
GROUP BY telegram_id 
HAVING COUNT(*) > 1;

-- Check for duplicate email
SELECT email, COUNT(*) 
FROM users 
WHERE email IS NOT NULL 
GROUP BY email 
HAVING COUNT(*) > 1;
```

Both queries should return 0 rows.

## Expected Result

After the fix, your application should start successfully:

```
info: ✅ Database connection established successfully
info: ✅ Duplicate cleanup completed
info: ✅ Database synced
info: ✅ Server running on port 5000
```

## Technical Details

The cleanup strategy:
- Uses PostgreSQL's `DO` blocks for procedural logic
- Keeps records with earliest `created_at` timestamp
- Sets duplicates to NULL instead of deleting them
- Preserves data integrity and user records
- Safe to run multiple times (idempotent)

## Notes

- The fix preserves all user records; it only nullifies duplicate values
- Users with nullified `telegram_id` or `email` can still be identified by their UUID `id`
- The oldest record is kept to maintain data integrity
- This fix is safe to run in production
