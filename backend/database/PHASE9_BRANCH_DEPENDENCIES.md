# Phase 9 integration prerequisites

Base: Phase 8 feature branch (not main). Phase 4, 5, 6 and 7 feature branches are independent, unmerged and not verified together. Do not deploy or merge Phase 9 without reconciling them.

Live database inspection and migration execution are blocked: repository connection provides no database access. No migrations have been applied.

Critical security: public privileged registration and unauthenticated direct password reset require remediation before deployment.
