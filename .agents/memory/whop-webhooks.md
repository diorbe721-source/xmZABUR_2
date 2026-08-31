---
name: Whop webhook event naming
description: Whop API webhook registration and delivered event naming differ in the current API.
---

Whop webhook creation accepts event names such as `payment_succeeded`, `payment_failed`, `refund_created`, and `refund_updated`, while v1 delivery payloads identify them as `payment.succeeded`, `payment.failed`, `refund.created`, and `refund.updated`.

**Why:** The API rejected dotted event names during webhook registration even though the delivery envelope uses dotted `resource.action` types.

**How to apply:** Translate registration names and delivery names separately whenever adding or changing Whop webhook subscriptions.