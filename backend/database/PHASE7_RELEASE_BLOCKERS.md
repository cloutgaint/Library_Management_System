# Phase 7 release blockers

Do not enable LMS_PHASE7_INVENTORY_ENABLED until existing loans are mapped to copies and global counts reconcile. The legacy circulation model does not update copy rows. Production release requires copy-aware issue/return, reservation pickup branch handling, and database-backed concurrency tests.
