##


# **xenia**

## Product Requirements Document

## 2026-01-19

# **Overview**

Web‑based **digital QR menu and ordering platform** designed for beach bars in Greece. It helps establishments replace traditional printed menus with **interactive, contact‑free digital menus** that customers access simply by scanning a QR code with their smartphone — no app download required.

# 

# **Goal**

**Enable Contactless Ordering Across Large Distances**

* Customers can **order from their sunbeds or tables** without needing to flag down a server.  
* Reduces the need for staff to constantly walk long distances, saving time and energy.

  **Optimize Staff Efficiency During Peak Season**

* Fewer waiters can serve more customers effectively because orders go directly to the bar or kitchen.  
* Reduces errors from handwritten orders and minimizes bottlenecks when it’s busy.

  **Increase Sales Opportunities**

* Customers can **order extras (drinks, snacks) without waiting**, boosting per-customer revenue.  
* Promotes upsells through menu suggestions and item variants.

  **Improve Customer Experience and Satisfaction**

* Quick access to the full menu and ordering, even when the bar is crowded.  
* Avoids long waiting times, which are common during peak season.

  **Real-Time Menu Updates and Stock Management**

* Update availability instantly if an item runs out — no customer disappointment or wasted trips by staff.  
* Keeps inventory under control in a fast-paced environment.

# 

# **Specification**

---

# **Database Design**

## **ID Strategy**

| Entity | Format | Limit | Rationale |
|--------|--------|-------|-----------|
| ClientID | 4-digit numeric | 9,999 clients | Sufficient for business scale |
| ItemID | 3-digit numeric per client | 999 items/client | Adequate for menu size |
| OrderID | Composite display code | Unlimited | Daily reset, scales with tables |

**Order Display Code Format:** `{ClientID}-{TableIdentifier}-{DailySequence}`
Example: `0042-A15-0023` (Client 42, Table A15, 23rd order today)

- Resets daily per client
- Human-readable for receipts and staff
- No artificial limits on order volume

## **Normalized Schema**

### Core Tables

```
ClientDB
├── id (internal UUID)
├── client_id (4-digit, unique)
├── company_name
├── contact_person
├── phone
├── email (unique)
├── password_hash
└── created_at

ItemDB
├── id (internal UUID)
├── item_id (3-digit, unique per client)
├── client_id (FK)
├── name
├── price
├── description
├── category
├── active (boolean)
└── created_at

ItemCustomizationDB (separate table for multiple customizations per item)
├── id (internal UUID)
├── item_id (FK → ItemDB)
├── name
├── price
└── action (ADD | CHOICE | REMOVE)

QR_CodeDB
├── id (internal UUID)
├── client_id (FK)
├── table_identifier (alphanumeric, e.g., "A1", "B12")
├── created_at
├── orders_this_hour (rate limiting)
├── hour_reset_at (rate limiting)
├── last_order_at (rate limiting)
└── pending_orders_count (rate limiting)

OrderDB
├── id (internal UUID)
├── client_id (FK)
├── qr_code_id (FK)
├── display_code (human-readable composite)
├── daily_sequence (resets daily)
├── sequence_date (for daily reset)
├── status (NEW | PREPARING | READY | COMPLETED | CANCELLED)
├── total
├── customer_note (max 500 chars)
├── created_at
├── prepared_at
├── done_at
└── archived_at

OrderItemDB (separate table for order line items)
├── id (internal UUID)
├── order_id (FK → OrderDB)
├── item_id (FK → ItemDB)
├── quantity
├── customizations (JSON)
├── subtotal
├── item_name_snapshot (preserves name at order time)
└── item_price_snapshot (preserves price at order time)

StaffDB
├── id (internal UUID)
├── client_id (FK, unique)
├── staff_token (cryptographically random 24-char token)
└── staff_password_hash (bcrypt hashed)

AuditLogDB
├── id (internal UUID)
├── timestamp
├── client_id (FK, nullable for admin actions)
├── actor_type (ADMIN | CLIENT | STAFF)
├── actor_id
├── actor_email
├── action (CREATE | UPDATE | DELETE | LOGIN | LOGIN_FAILED | LOGOUT)
├── entity_type (ADMIN | CLIENT | ITEM | ORDER | QR_CODE | STAFF_SETTINGS)
├── entity_id
├── details (JSON)
└── ip_address
```

### Why Normalized?

1. **ItemCustomizationDB as separate table**: One item can have multiple customizations (e.g., Espresso: "Single/Double" choice + "Extra shot" add-on + "Sugar" remove option)

2. **OrderItemDB as separate table**: Enables queries like "most ordered item", partial refunds, and order analytics

3. **Snapshot fields on OrderItem**: Preserves item name and price at time of order, even if menu is later updated

## **Rate Limiting (Per Table/QR Code)**

Rate limits scale naturally with business size — more tables = higher capacity.

| Limit | Value | Purpose |
|-------|-------|---------|
| Max orders per hour per table | 10 | Prevent bot abuse |
| Max pending orders per table | 3 | Avoid order backlog |
| Cooldown after submit | 30 seconds | Prevent double-submit |
| Max items per order | 50 | Reasonable order size |
| Max customizations per item | 20 | UI/UX constraint |
| Max customer note length | 500 characters | Storage constraint |

**Scaling Examples:**

| Venue Size | Tables | Max Orders/Hour | Max Orders/Day (10hr) |
|------------|--------|-----------------|----------------------|
| Small beach bar | 20 | 200 | 2,000 |
| Medium venue | 80 | 800 | 8,000 |
| Large resort | 300 | 3,000 | 30,000 |

---

# **Security & Authentication**

## **Password Policies**

| Role | Min Length | Requirements | Storage |
|------|------------|--------------|---------|
| Admin | 10 chars | Uppercase, lowercase, number, special character | bcrypt (12 rounds) |
| Client | 10 chars | Uppercase, lowercase, number, special character | bcrypt (12 rounds) |
| Staff | 6 chars | At least 1 letter, 1 number | bcrypt (12 rounds) |

## **Session Management**

| Role | Session Duration | Cookie Settings |
|------|------------------|-----------------|
| Admin | 1 hour | HTTP-only, Secure, SameSite=strict |
| Client | 8 hours | HTTP-only, Secure, SameSite=strict |
| Staff | 12 hours | HTTP-only, Secure, SameSite=strict |

- JWT tokens with HS256 algorithm
- Separate cookies per role (`auth-token-admin`, `auth-token-client`, `auth-token-staff`)
- JWT_SECRET environment variable required (no fallback)

## **Rate Limiting**

| Portal | Max Attempts | Lockout Period |
|--------|--------------|----------------|
| Admin | 5 failed attempts | 15 minutes |
| Client | 5 failed attempts | 15 minutes |
| Staff | 10 failed attempts per token | 10 minutes |

- Rate limiting is per email/token identifier
- Successful login clears attempt counter

## **HTTPS & Transport Security**

- HTTPS redirect in production (checks `X-Forwarded-Proto` header)
- HSTS header enabled via `ENABLE_HSTS=true` environment variable
- Only enable HSTS after confirming HTTPS is fully working

## **Security Headers**

All responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0`
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## **Soft Deletes**

The following tables use soft deletes (set `deleted_at` instead of removing):
- Client
- Item
- QRCode

- Prisma middleware automatically filters out deleted records
- Hard delete functions available for GDPR compliance
- Records can be recovered within 30-day retention period

## **Multi-Tenant Data Isolation**

- All API routes verify `client_id` ownership before data access
- Queries are scoped to authenticated user's client
- Staff can only access orders for their assigned client

## **Staff URL Security**

- Staff tokens are 24-character cryptographically random strings
- Generated using `crypto.randomBytes(24)`
- Clients can regenerate staff URL to revoke old access
- Staff URLs follow pattern: `/staff/{24-char-token}/login`

## **Audit Logging**

All security-relevant events are logged:
- Login (successful and failed)
- Logout
- Create/Update/Delete operations on entities
- IP address captured when available

Admin portal includes audit log viewer for compliance review.

## **Input Validation**

- All database queries use Prisma (parameterized by default)
- Text inputs sanitized to prevent XSS
- Server-side validation for all data types
- Table identifiers: alphanumeric, 1-10 characters
- Customer notes: max 500 characters
- Prices: positive numbers only
- Quantities: positive integers only

---

**ADMIN PORTAL**

Admin Portal is designed for the internal team of the platform to **manage client acquisition** for all B2B operations.

**Admin Portal login page**

1. Admin log-in, both user name and user password, the password need to be 10 digits with special characters and number, upper and lower case.  
2. Admin has automatically all permissions

**When logged in the Admin Portal**

1. A “**client**”-table with all existing clients is visible, it fetches the data from the database “**ClientDB**” 

   *For context: from here the admin can create, edit and delete clients.* 

2. The database “**ClientDB**” contain the following columns **ClientID, client\_company*\_name, client\_contact\_person, client\_phone\_number and client\_email*** and ***client\_password***  
3. Over the “**client**”-table there is a “**create client**”-button.  
   1. When pressing the “**create client**”-button a “**create client**”-window appears, a unique stochastic 4-digit **ClientID** is automatically generated in “**ClientDB**” that appears in a locked text box. Below are additionally five unlocked text boxes with respective titles ***“Company Name\*”, “Contact Person”, “Phone number”,*** “***Email\*”, “Password\*”***. In the end of the window there is a “**comfirm**”-button.  
      1. The “**Email\***” text box has to finish with an email format  
         1. If not there will appear a red banner below the text box stating “invalid email”.  
         2. The banner will remain active until there is a correct email format.  
      2. The "**Password\***" text box must be at least 10 characters with uppercase, lowercase, number, and special character
         1. If not there will appear a red banner below the text box stating the missing requirements
         2. The banner will remain active until the password meets all requirements.  
      3. The “**comfirm**”-button are locked until the text box under “***Email\*”, “Company Name\*”*** and ***“Password\*”*** have a value and there are no red banners that are still active.  
      4. When pressing the unlocked “**confirm**”-button, the “**create client**”-window disappears, the database “**ClientDB**” is updated with a new row of data with **ClientID** together with the input values in the text boxes for.  
         1. ***“Company Name\*”***   
         2. ***“Contact Person”***   
         3. ***“Phone number”***   
         4. “***Email\*”***  
         5. ***“Password\*”***   
      5. The input values are stored in the following columns respectively:   
         1. **client\_company*\_name***  
         2. ***client\_contact\_person***  
         3. ***client\_phone\_number***  
         4. ***client\_email***  
         5. ***client\_password***  
4. The “**client**”-table automatically updates after pressing “**comfirm**”-button  
   1. Client password are always hidden with “\*\*\*\*\*\*”  
5. In the “**client**”-table, each client has one row and populates the following columns: **ClientID, company *name, contact person, phone number, email and password.*** There is also an “***edit”-*** and ***“delete”-**button* on the same row connected to the **ClientID**.  
   1. When pressing the “**edit**”-button, each cell in the columns **company *name, contact person, phone number, email and password*** in that row generates a text box with the unlocked string inside(see 4.1.1) and the “***edit”-*** and ***“delete”-button*** are replaced with **“OK”-** and **“X”-buttons.** 

   *For context: The user should be able to change the text in the text box.* 

      1. The values returned to the text box in each cell must match the ClientID in both the “**client**”-table and the database “**ClientDB**” and the columns. e.g. “**client\_email**” in **ClientDB** with “**email**” in “**client**”-table  
      2. The “**OK**”-button is locked if the cell for **email** is not in an email format.  
      3. The **password** before and after the text box appears are always hidden with "\*\*\*\*\*\*", if changed during edit mode, it must meet password policy (10+ chars with complexity) for the "**OK**"-button to be unlocked.  
      4. When pressing the “**OK**”-button, the existing values in the text boxes will replace the string in the database “**ClientDB**”.  
      5. When pressing the **“X”-**button the values in the text boxes will **not** replace the string in the database “**ClientDB**”.  
      6. After pressing either “**OK**”- or “**X**”-button, the text boxes in the “**client**”-table are replaced with the value from “**ClientDB**”  
   2. When pressing the “**delete**”-button, a “**delete**”-window will show up with a “**Yes**”- and “**No**”-buttons and a text above the buttons: 

      “Are you sure you want to delete the client data? This action is irreversible and will delete all items and QR code the client has”

      1. When pressing the “**No**”-button, the “**delete**”-window disappears  
      2. When pressing the “**Yes**”-button, the row in **ClientDB** matching with the **ClientID** in the “**client**”-table will be deleted.  
         1. \[Any related DB such as “**ItemDB**”, “**StaffDB**”  or “**QR\_CodeDB**” with client data such as ItemDB and QRcodeDB will also be impacted\] 

**CLIENT PORTAL**

Client Portal is designed for the enterprise owner to **manage the menu, QR-codes** and **settings for the staff portal** for the ordering management system. 

**Client Portal Login Page**

1. Clients log in by writing the email and the password in two separated text boxes called "**Email Address**" and "**Client Password**" and a "**login**"-button.
2. If input for both "**Email Address**" and "**Client Password**" matches with ***client\_email*** and ***client\_password\_hash*** in ***"ClientDB"*** on the same row then they gain permission to the Client Portal containing all the data related to the "**ClientID**" on the same row as the matching ***client\_email*** and ***client\_password\_hash***.
3. If more than 5 failed login attempts have been made, then the login is blocked for 15 minutes.

**When logged in the Client Portal**

1. There is an "**Edit Menu**"-button for "Add, update, or remove items from your catalogue", "**QR Codes**"-button for "Generate and manage table QR codes", "**Settings**"-button for "Configurate your business profile" and an "**Analysis**"-button  
2. When pressing “**Edit Menu**”-button, the user are redirected to a “**Edit Menu**”-page  
   1. The client can add, edit and remove items to/from the database “**ItemDB**”. it contains:  
      1. **ClientID**  
      2. **ItemID**   
      3. **item\_name**  
      4. **item\_price**  
      5. **item\_description**  
      6. **item\_category**  
      7. **item\_customizations\_name**
      8. **item\_customization\_price**
      9. **item\_customization\_action** with values(null, add, choice, remove)
      10. **item\_active** for the staff to inactivate items in case they are out of stock with a toggle  
   2. The “**Edit Menu**”-page contains all the existing items in a “**Item**”-table with the following columns: **“Item Name”, “Price”, “Description”, “Category”**   
      1. For more details about that item, there should be a drop down arrow that gives more details with options, price and action if there is any for that specific item.  
   3. In the “**Edit Menu**”-page, the user can add new items by pressing a “**new item**”-button.  
   4. When pressing a “**new item**”-button, a “**new item**”-window pops up with the text boxes for each parameter with the following titles:  
      1. **“Client ID” (number, hidden from CI) see 2.9.3**  
      2. **“Item ID” (number, hidden from CI) see 2.9.3**  
      3. **“Item Name” (string)**  
      4. **“Price” (number)**  
      5. **“Description” (string)**  
      6. **“Category” (string)**  
      7. **“Add Option” (string)**  
      8. **“Option Price” (number)**  
      9. **“Add/Choice/Remove”**   
   5. For "**Category**", existing categories(for other items), should show up as alternatives.
      1. Categories are removed if there are no items holding these categories in the database any more.  
   6. For “**Add/Choice/Remove**”, there should only be those options available to choose from.  
      1. Null  
      2. “**Add**”  
      3. “**Choice**”  
      4. “**Remove**”  
   7. The text boxes for **“Add Option”, “Option Price”, “Add/Choice/Remove”** must be placed next to each other, horizontally.  
   8. It must be possible to add multiple options to the same item.  
      1. When filling the text box “**Add Option**” a new row with three blank text box must appear under the input values **“Add Option”, “Option Price”, “Add/Choice/Remove”**. 

         *Context*: *In case the user want to add multiple options*

      2. All or none of the **“Add Option”, “Option Price”, “Add/Choice/Remove”** must have values.  
         1. If left empty then the item does not have additional options  
         2. If values are inputted, then it is an additional option  
   9. In the bottom there is an “**Add Item**”-button.  
      1. It is unlocked when the text boxes for **“Item Name”, “Price”, “Description”, “Category”** contain the right values.  
      2. It is locked if at least one but not all of the text boxes has any value **“Add Option”, “Option Price”, “Add/Choice/Remove”**   
      3. When pressed the “**Add Item**”-button, the “**new item**”-window disappears after the “**ItemDB**” have registered a new row with the client’s “**ClientID**” number and a unique 3-digit “**ItemID**” together with all the values from the “**new item**”-window. Thereafter, the “**Item**”-table are automatically updated and returns the values from the database “**ItemDB**”. The rows in “Item”-table should have the following columns:   
         1. **“Client ID” (number, hidden from CI)**  
         2. **“Item ID” (number, hidden from CI)**   
         3. **“Item Name” (string)**  
         4. **“Price” (number)**  
         5. **“Description” (string)**  
         6. **“Category” (string)**  
      4. The row should have the following drop down list with the following columns:  
         1. **“Add Option” (string)**  
         2. **“Option Price” (number)**  
         3. **“Add/Choice/Remove”** 

         *Note: Important that the item is linked to the “**ClientID**” to prevent items being mixed with other clients.* 

         4. It returns only the items that matches the “**ClientID**” between the database “**ItemDB”** and the “**item**”-table and only if it is a unique “**ItemID”** that is not already in the “**item**”-table, no duplicates in the “**item**”-table are allowed.  
      5. To edit or delete any items in the “**item**”-table there is an “***edit”-*** and ***“delete”-button*** on each row with an item.  
         1. When pressing the “**edit**”-button, each cell in the columns **“Item Name”, “Price”, “Description”, “Category”** in that row generates a text box with the unlocked string inside and the “***edit”-*** and ***“delete”-button*** are replaced with **“OK”-** and **“X”-buttons.**   
            1. Also, when pressing the “**edit**”-button, a drop down list with all additional options also appears if the item has them, they should be able to remove them with an **“remove”-**buttons. The drop down list has the following columns: **“Add Option”, “Option Price”, “Add/Choice/Remove”** and there are text boxes with the returned values from “**ItemDB**”.  
            2. There is always one empty row for adding new options with an “**add**”-button that is unlocked when the values **“Add Option”, “Option Price”, “Add/Choice/Remove”** have been added.   
               1. When pressing the “**add**”-button, the button is changed from “add” to “remove”.

   *For context: The user should be able to change the text in the text box.* 

            3. The values returned to the text box in edit mode in each cell must match the **ClientID** with the hidden **ClientID** in the “**item**”-table and the **ClientID** in the database “**ItemDB**” and the columns. e.g. “**item\_price**” in **ItemDB** with “**price**” in “**item**”-table  
            4. The “**OK**”-button is locked if the **“Item Name”, “Price”, “Description”, “Category”** have no values.  
            5. When pressing the “**OK**”-button, the existing values in the text boxes will replace the string in the database “**ItemDB**”. 

               *For example: the value in **“Item Name”** in “**item**”-table replaces the **item\_name** in database “**ItemDB**”*

            6. When pressing the **“X”-**button the values in the text boxes will **not** replace the string in the database “**ItemDB**”. Thus, keeping the same values as before the client pressed the “**edit**”-button.  
            7. After pressing either the “**OK**”- or “**X**”-button, the text boxes in the “**item**”-table are replaced with the value from “**ItemDB**”.  
         2. When pressing the "**delete**"-button, the row in **ItemDB** matching with the **ClientID** and **ItemID** with the values in the "**item**"-table, will be deleted. After, the "**item**"-table is automatically updated and it should result in that the row with the same "**delete**"-button pressed disapears.
   10. Over the "**item**"-table, there will be a "**scan menu**"-button that is a type of Menu Digitization feature that takes a PDF/Image and converts it to the web menu according to the ItemDB structure.
       1. When pressing the button, a "**scan menu**"-window appears where the client can add the file.
       2. Support for: PDF, PNG, JPG, WEBP
       3. Use an OCR engine
       4. Extract the data:
          1. Raw text
          2. Bounding boxes
          3. Line and block grouping
       5. Identify structural elements:
          1. Category headers (e.g. "Starters", "Mains")
          2. Menu items
          3. Prices
       6. Normalize currency and price formats
          1. Price must be numeric (if present)
       7. Descriptions
       8. Create new rows in the database "**ItemDB**" for each identified item
          1. Item must have name for the row to be created
       9. After pressing the "**scan menu**"-button, the "**item**"-table is updated and the client can easily review and change any errors before pressing a "**save**"-button in the bottom of the "**item**"-table.
3. When pressing the "**QR-Code**"-button, the client is redirected to a “**QR-Code**”-page, where the client can generate QR-codes for each table. When customers scan the code, they do not have to add the table number manually. 

   *Context: This is so that we avoid the risk that customers type the wrong table number in the ordering system.*

   1. The database “**QR\_codeDB**” contains the following columns  
      1. **ClientID**  
      2. **QR\_codeID**  
      3. **QR\_code\_image (.png format)**  
      4. **QR\_code\_URL**  
      5. **QR\_code\_table\_number**  
      6. **QR\_code\_date**

         

   2. The client should be able to generate a batch of QR-codes simultaneously. That can also have letters.

      *For example: Batch generation all combinations between A1-A20.*

   3. All generated QR-codes are stored in database “**QR\_codeDB**” and the “**QR-code”**\-list returns the values from “**QR\_codeDB**”. visible in a “**QR-code”**\-list with an image of the QR code and the link to the catalogue, it should also be visible when the QR-code was created.  
      1. The client should have the following actions for each QR code, download, print(pdf) and delete.  
         1. If deleted QR-code, the “**QR\_codeDB**” need to remove the row, search for the **QR\_codeID** to find the matching QR code  
4. When pressing the “**Staff**”-button, the client is redirected to a “**Staff**”-page, where the client can share the hyperlink to the “**Staff**”-portal with their staff, and choose the password to enter.

   	*Objective: the staff portal will host the order management system*

   1. The data is stored in the database “**StaffDB**” and contain the following columns:  
      1. **ClientID**  
      2. **staff\_URL**  
      3. **staff\_password**  
   2. The "**staff\_URL**" is a unique URL that uses elements from the **client\_company*\_name*** *in the database **"ClientDB"*** in combination with random tokens in order for it to be secure.
5. When pressing the "**Analysis**"-button, the client is redirected to the "**Analysis**"-page.
   1. Here they can see an "**Analysis**"-table with a new row for every day and the columns are the total number of orders completed each day and the total revenue from these orders.
   2. The data is fetched from the database "**OrderDB**".
      1. Total number of orders completed is calculated by counting the number of orders with a unique **OrderID** for that specific day that have a timestamp in "**order\_done\_at**"
      2. Total revenue is calculated by taking each unique **OrderID** for that row's day and calculating the sum of **order\_total\_amount**

**STAFF PORTAL**

Staff Portal is designed for the enterprise staff to **receive orders** and **update status on the order.** This portal should be designed to be on a tablet or a screen in the bar, with buttons that are easy to press.

**Staff Portal log in**

1. Staff log in by using the “**staff\_password**” for that specific “**staff\_URL**”.

**When logged in the Staff Portal**

1. In the "**Staff**"-portal, the staff can see three tabs, "**orders**"-tab, "**order history**"-tab and "**menu**"-tab  
   1. The “**orders**”-tab contain an “**orders**”-list that fetches and return data from and to database “**OrderDB**”  
   2. The database “**OrderDB**” has the following columns  
      1. **ClientID**  
      2. **OrderID**  
      3. **order\_item (item name, quantity, additional options, item price, additional option price)**  
      4. **order\_table\_number**  
      5. **order\_customer\_comment**  
      6. **order\_created\_at (time & date)**  
      7. **order\_prepare\_at (time & date)**  
      8. **order\_done\_at (time & date)**  
      9. **order\_archived\_at (time & date)**  
      10. **order\_total\_amount**  
2. The "**orders**"-list is updated when a change in the happens in the database "**OrderDB**"
3. The order lifecycle follows the following steps:
   1. **New** - orders have been received and have still not been pushed into the next step that the staff have to do.
   2. **Prepare** - the order have now been pushed to the next step.
   3. **Done** - the order have been delivered and the payment completed.
4. There is first a "**prepare**"-button, when pressed, the database “**OrderDB**” is updated with a timestamp in **order\_prepare\_at (time & date)**  
   1. The order in the “**orders**”-list is updated with the new time fetched from database “**OrderDB**” in **order\_prepare\_at (time & date)**  
   2. The “**prepare**”-button changes into “**done**”-button  
5. When "**done**"-button is pressed, the database "**OrderDB**" is updated with a timestamp in **order\_done\_at (time & date)**
   1. When "**done**"-button is pressed, the order in the "**orders**"-list is updated with the new time fetched from database "**OrderDB**" in **order\_done\_at (time & date)**
   2. The rolling last 5 orders that are marked as "done" for that same day are visible in the bottom of the "**orders**"-list in the "**orders**"-tab
   3. The "**order history**"-list in the "**order history**"-tab lists all the orders that are marked "done".

      *Context: the last 5 orders of the same day will therefore be visible in two places, both in the "orders"-list and the "order history"-list*

6. Each order has a "**copy**"-icon that copies the:  
   1. Order number  
   2. Table number  
   3. Time  
   4. Items & Price  
   5. Total amount

	*Context: This is so the staff can easily put the order in a different system if needed.*

7. If multiple orders come from the same table and they are still not marked as "done", they need to be listed below the first order that came from that table, even if the "**prepare**"-button has been pressed.

   *Context: That way, orders from the same table receive the same priority. Minimizing the need for the distance waiters need to cover.*

8. In the "**menu**"-tab, the staff can get an overview of all the items in the menu which are fetched from the database "**ItemDB**" and presented in a list.
   1. The staff can toggle on and off the item as out-of-stock. If they do toggle off the item, the database "**ItemDB**" is updated.
      1. When an item is toggled off, the item in the catalogue is viewed as not available.
   2. The staff can hide items from the menu also, when they do it, the items will not be visible for the customers.
   3. On the "**menu**"-tab, a number is highlighting the total number of items in that client's item list that are inactive.

      *Context: this is in order for the staff to have that visibility even when they are in a different tab, to not forget to reactivate inactive items.*

**ONLINE MENU**

Online Menu is designed for the enterprise customers to **have fast access to the menu** and **place orders digitally.** The user will interact with the menu on the beach. Beach locations often have weak mobile coverage and overloaded networks during peak hours. The menu must be available as a lightweight web app.  

**Online Menu access via QR-code**

1. Customer access it by scanning the QR code

**When inside the Online Menu**

1. The customer can see a “**menu**”-list with all the item, this is done by the URL returning the values by matching the **ClientID** from the “**QR\_CodeDB**” with the **ClientID** in the “**ItemDB**” and returns all values from unique **ItemID** and populate the “**menu**”-list with the following data:  
   1. **item\_name**  
   2. **item\_price**  
   3. **item\_description**  
   4. **item\_category**  
2. Dropdown for additional order customization fetched from “**ItemDB**”  
   1. **item\_customizations\_name**  
   2. **item\_customization\_price**  
   3. **item\_customization\_action**   
3. Each item in the “**menu**”-list has an “**\+**”-button, when pressed, a “**menu item**”-window appears if there is values in the following in the database “**ItemDB**”:  
   1. **item\_customizations\_name**  
   2. **item\_customization\_price**  
   3. **item\_customization\_action**  
4. The “**menu item**”-window has always some of the following options if it appears: “add, “choice” and “remove”.   
   1. Next to the “**customization name”** is also the price, if not “0”,   
   2. Between the choice, the customer must choose one. The remaining “add” and “remove” has no limit.

      *Context: It is important that it is clear for the customers what they can add, remove and choose between. For example: if it is an Espresso, choose between "Single" and “Double”*

5. If there are no values, then the item is automatically adds to the "**Your Order**"-list
   1. The customer can increase and decrease the quantity in "**Your Order**"-list with a "**\+**"- and "**\-**"-button
      1. If they increase the item, then an exact copy of the item together with the additional options are created.  
6. In “**Your Order**”-list, the table number is already added from the URL if it was scanned, otherwise it need to be added manually.  
7. In “**Your Order**”-list under selected items, there is antext box with the text “leave note to the bar and kitchen”.  
8. In “**Your Order**”-list under the note section, is the sum of the calculated total with the title “**Total amount**” calculated on all the prices in the “**Your Order**”-list, also taking into consideration quantity.  
9. In the bottom of “**Your Order**”-list there is two buttons, “**Clear**”-button which removes all items in “**Your Order**”-list and a “**Submit Order**”-button.  
   1. The “**Submit Order**”-button is locked if there is no items in the basket.  
   2. When pressing the “**Submit Order**”-button the “**OrderDB**” generates and returns a 6 digit **OrderID** to the customer, confirming the order.  
   3. The “**OrderDB**” are updated and create a new row with values for the following columns:  
      1. **ClientID**  
      2. **OrderID**  
      3. **order\_item (item name, quantity, additional options, item price, additional option price)**  
      4. **order\_table\_number**  
      5. **order\_customer\_comment**  
      6. **order\_created\_at (time & date)**  
      7. **order\_total\_amount**  
   4. When pressing the "**Submit Order**", the "**orders**"-list in the Staff Portal is updated automatically.
   5. After pressing "**Submit Order**" the page checks if the database has received the "**OrderID**" in "**OrderDB**". If it has been registered then, a message should appear with the following message: "Your order is being prepared" together with the **OrderID** number in case they want to save it.

---

# **Design Guidelines**

Think warm Mediterranean vibes meets modern SaaS clarity—inspired by Toast POS, Squarespace and Zeus is loose but with coastal summer aesthetics.

**Reference Links:**
- https://www.squarespace.com/
- https://pos.toasttab.com/
- https://www.zeusisloose.com/

**Design direction:**
- Warm ocean blues + sandy cream + sunset coral accents
- Playful but professional typography
- Wave-inspired subtle patterns
- Clean cards with soft shadows
- Greek antiquity design in a modern setting

**Design system:** Ocean blues, coral accents, sandy warmth with custom gradients, floating animations, and Outfit + Fraunces typography.

---

# **Out of Scope**

**Payment System**
For the first iteration, the customer has to pay directly to the waiter.
Next step would be to have a flow from in-app payment methods directly to client preferred account.

**Order Status Visibility for Customers**
No log in is required for this iteration, the system needs to support customers with minimal barriers, thus no way to track users in case they want to check the status of their order etc.
Next step: either asking for their email to send them a link with the order status, or a social SSO to track progress of the order/check order history.

**Multi-language Support**
This iteration does not require multiple language support, it can be solved now by providing both languages, if desired. Many menu items at Greek bars go by their English name. In the description, the client can have both languages to accommodate different users' language.
For the first iteration, it is okay that the language with the client is in English, however, that will probably be changed to Greek if the clients are asking for that.

**Order Cancellation**
Without having a way to authenticate users, we cannot offer customers to cancel order, if they wish to cancel an order they have to reach out to a waiter.

**Analytics/Report**
Advanced analytics are not included in this iteration, however, something we want to include in the next iteration after we receive a bit of feedback.

**Pricing Model**
The pricing model will either be subscription-based or per transaction. The invoicing will happen in a separate system, we will manually send out emails with the invoice until the product takes off.

**Images**
Due to the risk for unreliable and weak internet connection, we do not want to add images. This would increase the internet traffic during peak hours making it difficult to handle orders.

**Offline Handling**
In case of poor connectivity, the back-up is to rely on the staff to manage orders manually. This service will not fully replace staff, only make them more efficient as long as internet connectivity allows for it.

---

# **Future Ideas**

- Dynamic prices during rush hours, since there is limited output capacity, make sure to maximize the possible profit from the output.
- Staff scheduling, early identify over or under staffing
- Revenue forecasting based on historical data & weather patterns
- Suggest staffing needs the coming week
- Generate beach layout based on satellite images
- Use the beach bar layout to automatically generate the needed QR codes
- Help hosts with placement of new guests during rush hours by observing the status of available sunbeds
- Use the beach bar layout to zone out the responsibility for each waiter
- Dynamic menu item/category placement based on user data, for example during evenings, push for drinks and cocktails, in the morning push for coffee and juices.
- Analyze delivery bottle-necks and suggest improvements in staffing
- Analyze customer waiting time
- Integrate stock ordering system
- Add kitchen/bar display system