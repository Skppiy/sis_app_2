# Alembic Migration Procedures - SIS App Operating Guide

## Overview

Alembic supports **TWO** approaches for creating database migrations:

1. **Autogenerate** (automatic) - Alembic compares models to database and generates SQL
2. **Manual** (explicit) - You write the SQL yourself

**This project uses:** **Manual migrations** for complex changes, autogenerate only for simple additions.

---

## Understanding Alembic Modes

### Autogenerate (Automatic)

**Command:**
```bash
cd backend
.venv/Scripts/python -m alembic revision --autogenerate -m "description"
```

**How it works:**
1. Alembic connects to your database
2. Reads all SQLAlchemy model definitions
3. Compares models to current database schema
4. Generates SQL to make database match models
5. Creates a migration file with `upgrade()` and `downgrade()` functions

**Pros:**
- Fast for simple changes
- Catches things you might forget
- Good for adding new tables with simple relationships

**Cons:**
- Can get confused with complex relationships
- May detect false "removals" (like we saw with gradebook)
- Doesn't handle data migrations
- Can't detect renamed columns (sees as drop + add)

### Manual (Explicit)

**Command:**
```bash
cd backend
.venv/Scripts/python -m alembic revision -m "description"
```

**How it works:**
1. Alembic creates empty migration file with skeleton
2. You write SQL in `upgrade()` function yourself
3. You write reverse SQL in `downgrade()` function
4. Full control over what happens

**Pros:**
- Complete control
- Can handle complex data migrations
- No false detections
- Clear and explicit
- Better for team collaboration

**Cons:**
- More work
- You have to write SQL
- Easy to make mistakes if not careful

---

## Recommended Workflow for This Project

### ✅ Use MANUAL for:
- Complex table additions (like gradebook system)
- Data migrations (updating existing data)
- Schema changes with dependencies
- Renaming columns or tables
- Index changes
- When autogenerate produces confusing output

### ✅ Use AUTOGENERATE for:
- Adding a single new simple table
- Adding columns to existing tables (no data migration needed)
- Quick prototyping
- **BUT ALWAYS REVIEW THE GENERATED FILE BEFORE RUNNING**

---

## Step-by-Step Procedures

## Procedure 1: Creating a Manual Migration

### Step 1: Create Empty Migration File

```bash
cd backend
.venv/Scripts/python -m alembic revision -m "add_gradebook_tables"
```

**Result:** Creates file like `alembic/versions/abc123_add_gradebook_tables.py`

### Step 2: Edit the Migration File

Open the created file and add your SQL:

```python
"""add gradebook tables

Revision ID: abc123
Revises: xyz789
Create Date: 2025-10-21 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'abc123'
down_revision = 'xyz789'  # ID of previous migration
branch_labels = None
depends_on = None


def upgrade():
    # Create grading_scales table
    op.create_table(
        'grading_scales',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('school_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('schools.id'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('scale_type', sa.String(20), nullable=False),
        sa.Column('grade_level_start', sa.String(5)),
        sa.Column('grade_level_end', sa.String(5)),
        sa.Column('standards_definition', postgresql.JSONB),
        sa.Column('percentage_definition', postgresql.JSONB),
        sa.Column('is_default', sa.Boolean, default=False),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('now()'))
    )

    # Create indexes
    op.create_index('ix_grading_scales_school_id', 'grading_scales', ['school_id'])
    op.create_index('ix_grading_scales_scale_type', 'grading_scales', ['scale_type'])

    # ... more tables ...


def downgrade():
    # Drop in REVERSE order (because of foreign keys)
    op.drop_index('ix_grading_scales_scale_type', 'grading_scales')
    op.drop_index('ix_grading_scales_school_id', 'grading_scales')
    op.drop_table('grading_scales')

    # ... more drops ...
```

### Step 3: Review the Migration

**Checklist:**
- [ ] All foreign keys correct?
- [ ] Indexes on foreign keys?
- [ ] Default values appropriate?
- [ ] Nullable fields correct?
- [ ] Downgrade drops tables in reverse order?
- [ ] No existing tables accidentally dropped?

### Step 4: Test the Migration (Development)

```bash
# Check current revision
.venv/Scripts/python -m alembic current

# Show what will happen (dry run)
.venv/Scripts/python -m alembic upgrade head --sql

# Actually run it
.venv/Scripts/python -m alembic upgrade head
```

### Step 5: Verify Tables Created

```bash
# Option 1: Use psql
psql -h localhost -p 5433 -U postgres -d sis_db -c "\dt"

# Option 2: Check in Python
.venv/Scripts/python -c "from app.db import engine; from sqlalchemy import inspect; inspector = inspect(engine); print(inspector.get_table_names())"
```

### Step 6: Test Downgrade (Optional but Recommended)

```bash
# Rollback one migration
.venv/Scripts/python -m alembic downgrade -1

# Verify tables dropped
# ... check database ...

# Re-upgrade
.venv/Scripts/python -m alembic upgrade head
```

---

## Procedure 2: Using Autogenerate (When Appropriate)

### Step 1: Ensure Database is Current

```bash
.venv/Scripts/python -m alembic current
```

Should show latest migration ID. If not, run:
```bash
.venv/Scripts/python -m alembic upgrade head
```

### Step 2: Make Model Changes

Edit your SQLAlchemy models in `backend/app/models/`

### Step 3: Generate Migration

```bash
.venv/Scripts/python -m alembic revision --autogenerate -m "add_new_column"
```

### Step 4: **CRITICAL - REVIEW GENERATED FILE**

**DO NOT BLINDLY RUN AUTOGENERATED MIGRATIONS**

Open the generated file and check:
- [ ] Does it only add what you intended?
- [ ] Are there unexpected table drops? ⚠️
- [ ] Are there unexpected index removals? ⚠️
- [ ] Does the downgrade make sense?

**If you see unexpected changes:**
1. **DELETE the generated migration file**
2. Switch to **manual migration** approach instead
3. Figure out why autogenerate got confused

### Step 5: Edit if Needed

You can manually edit autogenerated migrations:
- Remove unwanted operations
- Add data migrations
- Adjust SQL as needed

### Step 6: Run Migration

```bash
.venv/Scripts/python -m alembic upgrade head
```

---

## Common Alembic Issues & Solutions

### Issue 1: "Detected removed table" (FALSE DETECTION)

**Symptoms:**
```
INFO [alembic.autogenerate.compare] Detected removed table 'users'
INFO [alembic.autogenerate.compare] Detected removed table 'students'
```

**Cause:** Alembic can't see the models (import error or comparison confusion)

**Solution:**
1. Verify models import: `python -c "from app.models import *"`
2. If import works, **use manual migration instead**
3. Never run autogenerate output that wants to drop tables unless you're 100% sure

### Issue 2: "Could not determine revision id from filename"

**Symptoms:**
```
FAILED: Could not determine revision id from filename xyz.py
```

**Cause:** Migration file created but Alembic didn't populate revision IDs properly

**Solution:**
1. Open the generated file
2. Look for these lines near the top:
```python
revision = 'abc123'  # Should have a value
down_revision = 'xyz789'  # Should reference previous migration
```
3. If missing, manually add them:
   - `revision` = any unique string (Alembic usually generates)
   - `down_revision` = the revision ID of the previous migration

**Find previous revision ID:**
```bash
.venv/Scripts/python -m alembic current
```

### Issue 3: "Multiple head revisions"

**Symptoms:**
```
Multiple head revisions are present
```

**Cause:** Two migrations created without properly referencing each other (branching)

**Solution:**
```bash
# Show the problem
.venv/Scripts/python -m alembic heads

# Merge the heads
.venv/Scripts/python -m alembic merge -m "merge heads" head1_id head2_id
```

### Issue 4: Migration fails midway

**Symptoms:**
```
sqlalchemy.exc.ProgrammingError: relation "xyz" already exists
```

**Cause:** Migration partially completed, then failed

**Solution:**
```bash
# Mark current state without running SQL (if tables already created)
.venv/Scripts/python -m alembic stamp head

# Or rollback and try again
.venv/Scripts/python -m alembic downgrade -1
.venv/Scripts/python -m alembic upgrade head
```

---

## Best Practices for This Project

### 1. Always Use Version Control

**Before creating migration:**
```bash
git status  # Ensure clean working directory
git checkout -b feature/gradebook-database
```

**After testing migration:**
```bash
git add backend/alembic/versions/abc123_*.py
git commit -m "Add gradebook database tables"
```

### 2. One Migration Per Logical Change

**Good:**
- Migration 1: Add gradebook tables
- Migration 2: Add indexes for performance
- Migration 3: Migrate existing data

**Bad:**
- Migration 1: Add gradebook tables + change user table + update enrollment logic

### 3. Never Edit Old Migrations

**If migration already run in production:**
- ❌ DON'T edit the migration file
- ✅ DO create a NEW migration with the fix

**If migration only run locally:**
- ✅ You can delete it and recreate

### 4. Test Migrations in Development First

**Workflow:**
```bash
# Development database
alembic upgrade head  # Test migration

# Check everything works
pytest tests/  # Run tests

# If good, commit
git commit

# Then deploy to staging/production
```

### 5. Keep Downgrade Functions Updated

Even if you rarely rollback, having working `downgrade()` functions is important:
- Rollback in emergencies
- Helps understand what `upgrade()` does
- Required for good migration hygiene

### 6. Use Batch Operations for Large Tables

For tables with millions of rows:
```python
from alembic import op

def upgrade():
    with op.batch_alter_table('large_table', schema=None) as batch_op:
        batch_op.add_column(sa.Column('new_column', sa.String(100)))
```

---

## Quick Reference Commands

### Check Status
```bash
cd backend
.venv/Scripts/python -m alembic current          # Current migration
.venv/Scripts/python -m alembic history          # All migrations
.venv/Scripts/python -m alembic heads            # Latest migrations
```

### Create Migration
```bash
# Manual (recommended)
.venv/Scripts/python -m alembic revision -m "description"

# Autogenerate (review carefully!)
.venv/Scripts/python -m alembic revision --autogenerate -m "description"
```

### Run Migrations
```bash
.venv/Scripts/python -m alembic upgrade head     # Latest
.venv/Scripts/python -m alembic upgrade +1       # Next one
.venv/Scripts/python -m alembic upgrade abc123   # Specific revision
```

### Rollback
```bash
.venv/Scripts/python -m alembic downgrade -1     # Previous
.venv/Scripts/python -m alembic downgrade base   # All the way back (⚠️ DANGER)
.venv/Scripts/python -m alembic downgrade abc123 # Specific revision
```

### Show SQL Without Running
```bash
.venv/Scripts/python -m alembic upgrade head --sql > migration.sql
```

### Mark Database (Without Running SQL)
```bash
.venv/Scripts/python -m alembic stamp head       # Mark as current
.venv/Scripts/python -m alembic stamp abc123     # Mark specific revision
```

---

## Decision Tree: Manual vs Autogenerate

```
Are you adding a completely new table with no existing data?
├─ YES → Are the relationships simple (just foreign keys)?
│   ├─ YES → Try autogenerate, but REVIEW output carefully
│   │         If it detects ANY unexpected changes → Use manual
│   └─ NO → Use manual (complex relationships confuse autogenerate)
└─ NO → Are you modifying existing tables?
    └─ Use manual (autogenerate bad at modifications)

Are you migrating existing data?
└─ Always manual (autogenerate can't do data migrations)

Did autogenerate want to DROP existing tables?
└─ DELETE that migration! Use manual instead!

In doubt?
└─ Use manual. It's safer.
```

---

## Gradebook Migration - Recommended Approach

For the gradebook system we just built:

**✅ Use Manual Migration** because:
1. 8 new tables with complex relationships
2. Autogenerate detected false "table removals"
3. Need precise control over foreign keys
4. Need to add trigger functions for weight validation
5. Need default data (K-3 scale, 4-8 scale, default template)

**Steps:**
1. Create manual migration file ✅ (already done)
2. Write CREATE TABLE statements for all 8 tables
3. Add indexes on foreign keys
4. Add check constraints (weights = 100%)
5. Add trigger function for weight validation
6. Insert default data (scales, templates)
7. Test upgrade
8. Test downgrade
9. Commit to git

---

## Production Deployment Checklist

When deploying migrations to production:

- [ ] Migration tested in development
- [ ] Migration tested in staging
- [ ] All tests pass
- [ ] Backup database before migration
- [ ] Run migration during low-traffic window
- [ ] Monitor application logs after migration
- [ ] Have rollback plan ready
- [ ] Document any manual steps needed

**Rollback command ready:**
```bash
.venv/Scripts/python -m alembic downgrade -1
```

---

## Example: Complete Manual Migration for Gradebook

See `backend/alembic/versions/f90f4fe903d5_add_gradebook_system.py`

This file needs to contain:
1. All 8 table CREATE statements
2. Foreign key constraints
3. Indexes on frequently queried columns
4. Trigger function for weight validation
5. Default data inserts
6. Proper downgrade (drop in reverse order)

I can populate this file next if you'd like to proceed with the migration.

---

## Summary

**For This Project:**
- **Default to MANUAL migrations** - safer, more control
- **Autogenerate only for simple additions** - and always review
- **Never trust autogenerate blindly** - it can suggest dropping tables
- **Always test migrations in development first**
- **Keep downgrade functions working**

**Remember:** Alembic autogenerate is a *suggestion tool*, not a decision-maker. You have final say!
