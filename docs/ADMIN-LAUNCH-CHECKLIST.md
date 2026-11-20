# Purple Friday Admin Dashboard — Client Launch Checklist & Staff Handbook

> Project: Purple Friday (Custom-Print & Corporate Gifting Platform for India)  
> Scope: Pre-Launch Operational Runbook & Role Guides  
> Document: `docs/ADMIN-LAUNCH-CHECKLIST.md`  

---

## Part I: Pre-Launch Technical Checklist

Complete these 7 steps before announcing the platform or turning on public marketing campaigns:

### 1. Rotate Initial Admin Password
- [ ] Navigate to `/admin/login` and sign in with default credentials (`admin@purplefriday.in`).
- [ ] Immediately open **Settings** (`/admin/settings`) -> **Change Password**.
- [ ] Choose a strong, unique password (minimum 12 characters, including uppercase, lowercase, numbers, and symbols).

### 2. Create Staff Accounts for Each Role
- [ ] Open **Team & Roles** (`/admin/team`).
- [ ] Create at least one dedicated account for each department:
  - **Graphic Designer**: for handling logo pre-flight and mockup generation.
  - **Factory Manager**: for viewing print queues, printing jobsheets, and marking dispatch.
  - **Support Agent**: for resolving tickets, customer inquiries, and reviews.
- [ ] Never share the Super Admin login across team members.

### 3. Enter Business & GST Tax Configuration
- [ ] Open **Settings** (`/admin/settings`) -> **Tax & GST Profile**.
- [ ] Enter your company's official 15-digit **GSTIN** (e.g. `29AAAAA0000A1Z5`).
- [ ] Enter the registered **Legal Entity Name** and **State of Supply** (e.g. Karnataka - Code 29).
- [ ] Confirm product GST rates (default 18% on customized merchandise).

### 4. Configure COD Rules & Dispatch SLA Limits
- [ ] Open **Settings** (`/admin/settings`) -> **COD & Risk Settings**:
  - Set **COD Enabled**: ON.
  - Set **Advance Payment Percentage**: 25% (allowed 20% to 30%).
  - Set **Maximum COD Order Value**: ₹15,000 (orders above this require full prepaid).
  - Set **Cancellation Window**: 2 hours (blocks cancellations after 2h or once production begins).
  - Set **Dispatch SLA**: 48 hours.

### 5. Execute Full End-to-End Test Order
- [ ] Place a test order on the storefront (`/design/classic-crewneck-tshirt`) choosing **Partial COD**.
- [ ] Verify Razorpay test payment captures the 25% advance.
- [ ] In Admin -> **Design Approvals** (`/admin/designs`), upload artwork and generate 3D mockup.
- [ ] Send proof to your test email / WhatsApp.
- [ ] Open the customer proof link (`/proof/[token]`) on mobile and click **Approve Design Proof**.
- [ ] In Admin -> **Production** (`/admin/production`), download the PDF Job Sheet and mark **IN_PRINTING**, then **QC_PASSED**.
- [ ] In Admin -> **Dispatch** (`/admin/dispatch`), manifest test shipment and verify the 4x6" thermal label displays **COLLECT ₹X ON DELIVERY**.

### 6. Connect Razorpay LIVE Keys
- [ ] Only after the test order succeeds, log in to your live Razorpay Dashboard.
- [ ] Generate **LIVE** Key ID and Key Secret.
- [ ] Update hosting environment variables:
  ```env
  RAZORPAY_KEY_ID="rzp_live_..."
  RAZORPAY_KEY_SECRET="..."
  RAZORPAY_WEBHOOK_SECRET="..."
  ```
- [ ] Configure live webhook URL: `https://yourdomain.com/api/webhooks/razorpay`.

### 7. Enable Automated Database Backups
- [ ] Log in to Neon Console -> Your Database Project -> **Settings** -> **Backups**.
- [ ] Ensure **Point-in-Time Recovery (PITR)** is active with at least 7 days retention.

---

## Part II: Plain-Language Staff Guide (1 Page Per Role)

---

### Guide 1: Super Admin (Store Owner / Executive)

**Your Responsibility**: Oversee business health, margins, pricing, storefront content, and system permissions.

#### Key Daily Workflows:
1. **Morning Health Check (`/admin`)**:
   - Check the **Funnel Strip**: Are any orders overdue (>48h) or stuck in pending approval?
   - Check the **Needs Attention** alert cards.
2. **True Net Margin Tracking (`/admin/margin`)**:
   - Review profit after GST, raw blanks, print cost, courier fees, and RTO losses.
   - Investigate any orders flagged with **Low Margin (<15%)** or **Negative Margin**.
   - Record monthly marketing ad spend to view true EBITDA net profit.
3. **Storefront No-Code CMS Studio (`/admin/cms`)**:
   - Update homepage headlines, announcement bar banners, and FAQ answers without editing code.
   - Always click **Preview Live** to check your draft before clicking **Publish to Storefront**.
   - If an error is published, use **Version History** to rollback with 1-click.

---

### Guide 2: Graphic Designer (Prepress & Proofing Atelier)

**Your Responsibility**: Check customer artwork quality, position logos accurately, and send 3D proof approvals to clients.

#### Key Daily Workflows:
1. **Design Approvals Queue (`/admin/designs`)**:
   - Oldest pending orders appear at the top.
   - Click an order item to inspect the customer's uploaded logo.
2. **Pre-Flight Inspection**:
   - Check the **Effective DPI**: Green (>=300 DPI) is print-ready; Yellow (150-299 DPI) needs vectorization; Red (<150 DPI) requires customer contact.
   - Confirm Pantone PMS colour codes match brand guidelines.
3. **Mockup Atelier Placement**:
   - Use the canvas controls to position and scale the logo within the bounded print zone.
   - Select print method: **DTF**, **Sublimation**, **Embroidery**, or **Laser Engraving**.
   - Click **Save Mockup & Send Proof**. This automatically generates a mobile approval link for the customer.

---

### Guide 3: Factory & Fulfillment Manager

**Your Responsibility**: Organize print batches, ensure quality control (QC), print thermal labels, and dispatch on time.

#### Key Daily Workflows:
1. **Production Queue (`/admin/production`)**:
   - Orders are grouped by print method for batch press runs.
   - Click **Download Job Sheet** to print the physical PDF with apparel sizes and operator checkboxes.
   - Move orders from **Customer Approved** to **IN_PRINTING**.
2. **Quality Control (QC)**:
   - Verify print alignment, fabric tension, and Pantone colour matching against daylight standard.
   - If defective, click **QC Rework** and log failure reason.
   - When verified, click **Mark QC Passed**.
3. **Dispatch & Multi-Address Split (`/admin/dispatch`)**:
   - For single shipments, select courier (Bluedart, Delhivery, etc.) and enter AWB.
   - For corporate bulk orders shipping to employees' homes, upload the client's destination CSV. The system checks all PIN codes and manifests shipments automatically.
   - Print 4x6" thermal shipping labels.

---

### Guide 4: Customer Support Agent

**Your Responsibility**: Resolve customer inquiries, assist with order tracking, moderate reviews, and issue partial refunds within policy limits.

#### Key Daily Workflows:
1. **Support Tickets Desk (`/admin/support`)**:
   - Review open tickets. Note: 1-star to 3-star customer reviews automatically spawn a private support ticket for proactive resolution.
   - Reply to clients directly through the ticket conversation thread.
2. **Customer Reviews Moderation (`/admin/reviews`)**:
   - 4-star and 5-star verified customer reviews are auto-approved to appear on the storefront.
   - Quarantined reviews can be inspected and approved once customer issues are addressed.
3. **Cancellations & Partial Refunds (`/admin/orders`)**:
   - Customers may cancel within 2 hours of ordering (if printing has not started).
   - Support Agents can authorize refunds up to ₹5,000. Larger refunds require Super Admin authorization.
