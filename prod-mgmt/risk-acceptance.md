# Risk Acceptances

Human-reviewed decisions to accept known adversarial findings.
Each entry was approved outside the constructor/adversary loop.
The adversary must not re-evaluate, narrow, or override these entries.

## How to Use This File

- Add an entry here when the adversary raises a finding that cannot be
  remediated immediately and a human has made a deliberate decision to
  accept the residual risk.
- The adversary will suppress the finding for the duration of the acceptance
  and surface it again when the entry expires.
- DISPOSITION must be one of: ACCEPTED / DEFERRED / OUT_OF_SCOPE
    - ACCEPTED: residual risk is understood and accepted for this period
    - DEFERRED: valid finding, acknowledged, scheduled for a later iteration
    - OUT_OF_SCOPE: finding is valid but outside the boundary of this feature
- EXPIRY must be a date (YYYY-MM-DD) or a named condition (e.g. v14.0-release,
  post-migration). Use PERMANENT only if truly permanent and document why.
- A lapsed entry (EXPIRY passed) is treated by the adversary as if it does
  not exist. The finding will resurface. Update or remove the entry to
  suppress it again.

---

## Entry Format

```
RA_ID:        RA-NNN (sequential, never reuse)
SCOPE:        test ID(s) or AC clause(s) this applies to
FINDING:      the adversarial finding being accepted (verbatim or summary)
SEVERITY:     CRITICAL / HIGH / MEDIUM / LOW
DISPOSITION:  ACCEPTED | DEFERRED | OUT_OF_SCOPE
RATIONALE:    why this is accepted — be specific, not generic
APPROVED_BY:  name or role (must be outside the constructor team)
APPROVED_DATE: YYYY-MM-DD
EXPIRY:       YYYY-MM-DD | named condition | PERMANENT
```

---

## Active Risk Acceptances

(none)

---

## Expired Risk Acceptances

<!-- Move entries here when expired. Do not delete — these are audit artifacts. -->