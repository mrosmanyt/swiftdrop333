# Website admin — setup and guide

This adds a **Website** area to the SwiftDrop admin console. From it you and
your staff can change the public website's text, see who is visiting, answer
enquiries and manage staff — without touching code.

It lives inside the admin console you already have: sign in as before, and
look for the **Website** group in the left menu.

> **Nothing on the public website changes until you press Publish.** Until
> then every page shows exactly what it showed before.

---

## 1. Put it live (Vercel)

You already have the database (Neon) connected. There is nothing new to
install and **no new required setting**.

1. **Push the code to GitHub.** Vercel builds and deploys it by itself.
2. **The database updates itself.** The first time the new version runs it
   adds four tables (`cms_content`, `cms_pageviews`, `enquiries`,
   `cms_media`) and two columns on `users`. You do not run anything.
3. **Picture uploads** use the Vercel Blob store the app already uses for
   delivery photos. If you have never connected one:
   Vercel → your project → **Storage** → **Create** → **Blob** → **Connect**,
   then **Redeploy**. (This sets `BLOB_READ_WRITE_TOKEN` for you.)
4. **Sign in** at `your-site.com/login` with your normal admin email and
   password. Every admin that already exists is an **Owner**.
   - No admin on the live site yet? On your computer run
     `npm run create-admin -- you@example.com` (see the README).
5. **Add your staff:** Website → **Staff & roles** → **Add staff member**.
   Give each person their email and starting password, and ask them to
   change it under **Account & privacy** after they sign in.
6. **Optional — email alerts for new enquiries.** Create a free account at
   resend.com, then in Vercel → Settings → Environment Variables add
   `RESEND_API_KEY` and `EMAIL_FROM` (for example
   `SwiftDrop <hello@yourdomain.com>`), and redeploy. Then turn alerts on in
   Website → Website content → **Email alerts**. Without these two settings
   the alert is only written to the Notifications log, not emailed.
7. **Optional — share pictures.** Set `NEXT_PUBLIC_APP_URL` to your full
   address (`https://yourdomain.com`) so share pictures get a complete link.

### First things to do after it is live

- Website content → **Menu, footer & contact details**: fill in your phone,
  WhatsApp, email, address and social links, switch on **Show a "Contact"
  link in the footer**, and press **Publish**. (They are empty to start
  with, and anything left empty is simply not shown.)
- Website content → **Email alerts**: add who should be emailed.
- Send yourself a test message from `your-site.com/contact` and check that
  it appears in **Enquiries**.

---

## 2. How editing works

| Button | What it does |
|---|---|
| **Save draft** | Keeps your work. The website does **not** change. |
| **Publish** | Makes it live. It can take up to 20 seconds to appear. |
| **Restore original** | Removes every edit to that section. The website shows the original text again. |

In lists (questions, cards, tiers…): **Edit** opens an entry, **↑ ↓** or
dragging the ⠿ handle changes the order, **Hide** keeps it but takes it off
the website, **Delete** removes it, **+ Add** makes a new one.

---

## 3. Every section and what it controls

### Website (left menu)

| Section | What it is for |
|---|---|
| **Website overview** | Page views, visitors, top pages, devices, where visitors came from, enquiries per day, the enquiry pipeline, and follow-ups due today or overdue. Also **Sign out everywhere**. |
| **Enquiries** | Every message from the contact page. Search, filter by status / type / date, open one to set its status, add notes, set a follow-up date, assign a colleague, and WhatsApp / call / email in one tap. **Download for Excel** saves what you have filtered. |
| **Website content** | All the editors below. |
| **Staff & roles** | Add staff, change roles, reset a password, sign someone out everywhere, turn access off. |
| **Activity log** | Who signed in, edited, published or deleted what, and when. |
| **Backup & restore** | Download all content and enquiries as one file; restore content from a file. |

### Website content

| Editor | Controls |
|---|---|
| **Homepage** | Headline, text and buttons at the top, the numbers strip, "How it works" steps, feature cards, city list, courier box, closing section. |
| **Features page** | Headings, the four big blocks (text and tick points), the grid of feature cards, closing section. |
| **Pricing page** | Headings, the four service cards (wording only), the note under the rates table, the "included" list. |
| **Drive with us page** | Headline, reasons to drive, tiers, requirements, the apply box. |
| **Questions (FAQ)** | The questions and answers on the homepage. |
| **Contact page** | Wording on the contact page and the list of enquiry types. |
| **Privacy page** | Your privacy notice. Have a lawyer check changes. |
| **Menu, footer & contact details** | Top menu links, footer text, phone, WhatsApp, email, address, map link, opening hours, social links. |
| **Announcement bar** | A coloured bar on top of every page: message, button, colour, start and end dates. |
| **Popup** | A box that appears after a few seconds: picture, text, button, which pages, how often, start and end dates. |
| **Google & sharing** | For each page: the title and description Google shows, and the picture used when a link is shared. |
| **Email alerts** | Switch email alerts for new enquiries on or off and choose who receives them. |

### What is deliberately NOT editable here

- **Prices.** Zone rates come from **Zones & pricing**; the service
  multipliers (0.7×, 0.85×, 1×, 1.6×) come from the pricing engine. This
  stops the website ever showing a price customers are not charged.
- **Screenshots** on the Features page and the moving tracking preview on
  the homepage. They are real captures of the app.
- **The footer's three link columns.**

---

## 4. Staff roles

| Role | Can do |
|---|---|
| **Owner** | Everything, including adding and removing owners. |
| **Administrator** | Everything except changing owners. |
| **Content Editor** | Edit and publish website content, see website stats. |
| **Sales & Enquiries** | Work the enquiries inbox and download it, see website stats. |
| **Viewer** | Look at stats, content and enquiries. Cannot change anything. |

Content Editor, Sales & Enquiries and Viewer **cannot open the operations
side at all** — orders, finance, couriers, merchants, live map and the rest.
This is checked on the server for every page and every request, not just
hidden from the menu.

Changing someone's role, resetting their password or turning their access
off signs them out straight away.

---

## 5. How it is protected

- Every request checks the signed-in person's live record and role on the server.
- Every change needs a special header and must come from this website (stops other sites acting as you).
- Admin pages are never cached, cannot be shown inside another site, and are hidden from search engines.
- Website text is always shown as text, never run as code; only normal links (`/page`, `https://`, `mailto:`, `tel:`) are accepted.
- Uploaded pictures are checked for their real type (JPG, PNG, WebP), limited to 2 MB, and have hidden location data removed.
- The contact form has a hidden trap field for bots, length limits, and a limit of 5 messages per 10 minutes and 10 per day from one address.
- Visitor counting sets **no cookie**. It keeps a one-day scrambled code, never the visitor's IP address.
- Excel downloads are protected against cells that would run as formulas.

---

## 6. File map

```
migrations/004-website-cms.sql        new tables and columns
src/lib/cms/
  defaults.ts        the ORIGINAL website text (the seed every editor starts from)
  sections.ts        what each editor shows: fields, labels, hints
  content.ts         read / save draft / publish / restore, cleaning, backup
  permissions.ts     staff roles and what each may do
  staff.ts           server guards used by every admin page and API route
  staffRepo.ts       add staff, change role, sign out everywhere
  enquiries.ts       enquiries inbox data        enquiryStatus.ts  the pipeline
  analytics.ts       cookie-free page views      media.ts          picture uploads
  seo.ts             page titles, descriptions, share pictures
src/app/admin/website/                 the admin screens
  page.tsx (overview) · content/ · enquiries/ · staff/ · activity/ · backup/
src/components/cms/                    CmsEditor, EnquiriesInbox, StaffManager, BackupPanel, Toast
src/app/api/admin/cms/                 content, enquiries (+export), staff, session, backup, upload
src/app/api/enquiries/                 public contact form
src/app/api/cms/hit · media/           page-view counter · uploaded pictures
src/app/(marketing)/contact/           new Contact page
src/components/marketing/              AnnouncementBar, SitePopup, PageViewBeacon, ContactForm, icons
```

Changed existing files: the five marketing pages, `MarketingNav`,
`MarketingFooter`, `FAQ` and the marketing `layout.tsx` (they now read their
text from the editor); `admin/layout.tsx` and `PortalSidebar` (Website
menu); `session.ts`, `auth.ts`, `middleware.ts`, `repo.ts` (staff roles);
`sitemap.ts`, `robots.ts`, `next.config.mjs`.

**To make something new editable:** add it to `defaults.ts`, describe it in
`sections.ts`, and use it in the page with `getContent("…")`.

---

## 7. Good to know

- The public marketing pages are now built on each visit instead of once at
  build time, so they can show published changes. Published content is
  remembered for about 20 seconds, so this adds very little database work.
- A restore from backup replaces website **content** only. Enquiries are
  never overwritten.
- Page views older than about 13 months are removed automatically.
- The Excel download is a `.csv` file. Excel and Google Sheets open it directly.
