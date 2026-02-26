# PRD Review: Beach Bar Menu

## What Works Well

1. **Clear user segmentation** - Four distinct portals (Admin, Client, Staff, Customer) with well-defined responsibilities
2. **Good validation rules** - Password requirements, email format, rate limiting (20 attempts/20 min)
3. **QR batch generation** - Smart feature for beach bars with many tables (A1-A20 pattern)
4. **Customization system** - ADD/CHOICE/REMOVE covers most menu modification needs
5. **Real-time updates** - Orders updating automatically in Staff portal
6. **Copy order details** - Practical for integration with external POS systems

---

## Missing or Unclear Elements

### 1. No Payment System
The PRD describes ordering but has no mention of payment. How do customers pay?
- Pay at order (Stripe/card)?
- Pay later (cash to waiter)?
- Tab system?

### 2. Order Status Visibility for Customers
Customers get an OrderID but can't see their order status. Consider:
- "Your order is being prepared" screen
- Push notifications (would need app or browser notifications)

### 3. No Multi-language Support Specified
For Greek beach bars serving international tourists, language is critical. The current implementation has EN/EL but the PRD doesn't mention this requirement.

### 4. Staff Portal Security
The PRD says `staff_URL` uses "elements from company name" - this is weak security. The implementation correctly uses random tokens instead, but the PRD should clarify this.

### 5. No Item Availability Toggle
What happens when an item runs out? The PRD mentions "Real-Time Menu Updates and Stock Management" in goals but doesn't specify how clients mark items as unavailable.

### 6. No Order Cancellation
- Can customers cancel orders?
- Can staff cancel/refund orders?
- What's the workflow?

### 7. No Analytics/Reporting
Business owners typically want:
- Daily/weekly sales reports
- Popular items
- Peak ordering times
- Revenue per table

### 8. No Pricing/Subscription Model
How do clients pay for the platform? Monthly subscription? Per-order fee? This affects the Admin portal design.

### 9. Image Support Missing
Menu items have no images. For a food/drink menu, photos significantly increase orders.

### 10. No Offline Handling
Beach locations often have poor connectivity. What happens if:
- Customer loses connection mid-order?
- Staff portal loses sync?

### 11. Category Management
Categories are auto-suggested but there's no way to:
- Reorder categories
- Delete unused categories
- Set category display order

### 12. No Table/Sunbed Management
The QR codes are generated but there's no way to:
- View which tables are active
- See which tables have open orders
- Reorganize table layout

---

## Ambiguities in the PRD

| Section | Issue |
|---------|-------|
| Staff URL | "uses elements from company name" - vague and insecure |
| Order History | When does an order move to history? After "done" or after a time period? |
| Multiple Orders | Can a table have multiple active orders? |
| Item Price | Is it per unit? What about items sold by weight? |
| Choice validation | PRD says "must choose one" but doesn't specify error handling |

---

## Recommendations

1. **Add a Payments section** - Even if "pay at counter", document it
2. **Add Item Images** - `item_image` column in ItemDB
3. **Add Item Active toggle** - `item_active` boolean for out-of-stock
4. **Clarify order lifecycle** - NEW → PREPARING → READY → COMPLETED → (archived after X hours)
5. **Add basic analytics** - At minimum, daily order count and revenue
6. **Document the business model** - How do you charge clients?
