# Study Resource Saver

A simple, private study library. Save useful links (YouTube videos, websites, PDFs, GitHub repos, courses, Google Drive files), sort them by subject, tag them, add notes, and track what you have studied.

**What you can do**

- Sign up, log in, log out. Everyone sees only their own resources.
- Save a link with a title, category, tags, notes and a study status.
- The app guesses the type from the link (YouTube, GitHub, PDF, Google Drive, Course, Website). You can change it.
- Search across titles, categories, tags and notes from one box.
- Filter by category, tag, status, type or favorites. Sort by newest, oldest or title.
- Mark resources To Study / In Progress / Completed, and star your favorites.
- Light and dark mode. Works on phones.

---

## 1. What you need first

1. **Node.js** version 20.9 or newer. Node.js is the program that runs the app on your computer.
   - Download the "LTS" version from <https://nodejs.org> and install it with the default options.
   - Check it worked: open a terminal (Windows: search for "PowerShell"; Mac: search for "Terminal"), type `node -v` and press Enter. You should see something like `v22.x.x`.
2. **A free Supabase account** at <https://supabase.com>. Supabase is the online database and login system the app uses.

---

## 2. Set up Supabase (one time)

> If someone already set up the Supabase project for you, skip to step 2.3.

### 2.1 Create a project

1. Go to <https://supabase.com/dashboard> and sign in.
2. Click **New project**.
3. Give it a name (for example `study-resource-saver`), choose a **database password** and save it somewhere safe, and pick the **region** nearest to you.
4. Click **Create new project** and wait about two minutes until it stops saying "Setting up".

### 2.2 Create the tables (apply the migrations)

A *migration* is a file of database instructions. This project has three, in the folder `supabase/migrations/`. Run them **in order**:

1. In the Supabase dashboard, click **SQL Editor** in the left menu.
2. Click **New query**.
3. On your computer, open `supabase/migrations/20260930100000_initial_schema.sql` in a text editor (Notepad is fine). Select everything, copy it, paste it into the SQL Editor, and click **Run**. You should see "Success. No rows returned".
4. Do the same with `20260930100100_row_level_security.sql`.
5. Do the same with `20260930100200_harden_default_function.sql`.

That's it. You now have four tables (`categories`, `tags`, `resources`, `resource_tags`), each protected by *Row Level Security* (RLS): database rules that make sure each person can only read and change their own rows.

### 2.3 Find your two keys

1. In the Supabase dashboard, open your project and click **Connect** at the top of the page (or go to **Project Settings → API Keys**).
2. Copy the **Project URL**. It looks like `https://abcdefghijklmnop.supabase.co`.
3. Copy the **Publishable key**. It starts with `sb_publishable_`. (Older projects call this the "anon public" key; that one works too.)

Both values are safe to be seen in a browser. **Never** use or share the key called `service_role` or `secret`. This app does not need it.

### 2.4 Decide how sign-up emails work

By default Supabase asks new users to click a confirmation link in an email before they can log in. That works out of the box, but the free plan only sends a couple of these emails per hour.

If this is a personal or class project, the easiest option is to switch confirmation off:

1. Supabase dashboard → **Authentication** → **Sign In / Providers** → **Email**.
2. Turn **Confirm email** off and click **Save**.

New users are then logged in straight after signing up.

---

## 3. Run the app on your computer

Open a terminal **inside the project folder** (the folder that contains `package.json`), then:

1. Install the building blocks the app needs (takes a minute, only needed once):

   ```
   npm install
   ```

2. Make a copy of `.env.example` and name the copy `.env.local`:

   - Mac / Linux: `cp .env.example .env.local`
   - Windows PowerShell: `Copy-Item .env.example .env.local`

   An *environment variable* is a setting kept outside the code. `.env.local` holds yours and is never uploaded anywhere.

3. Open `.env.local` in a text editor and replace the two placeholder values with the Project URL and Publishable key from step 2.3. Save the file. It should look like this:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
   ```

4. Start the app:

   ```
   npm run dev
   ```

5. Open <http://localhost:3000> in your browser. Click **Sign up free**, create an account, and add your first resource.

To stop the app, click the terminal and press `Ctrl + C`.

### Optional: demo data

`supabase/seed.sql` adds a few example resources to one account. Sign up in the app first, open the file, change the email near the top to yours, then paste the whole file into the Supabase **SQL Editor** and click **Run**.

---

## 4. Put it online with Vercel (optional)

Vercel is a free hosting service made by the creators of Next.js.

1. Put the project on GitHub: create a free account at <https://github.com>, create a **New repository**, and upload the project folder. (`.env.local` and `node_modules` are skipped automatically, which is what you want.)
2. Go to <https://vercel.com>, sign up with your GitHub account, and click **Add New… → Project**.
3. Pick your repository and click **Import**.
4. Open the **Environment Variables** section and add these two, with the same values as in your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. Click **Deploy** and wait about a minute. Vercel gives you an address like `https://your-app.vercel.app`.
6. Tell Supabase about that address so email links point to it: Supabase dashboard → **Authentication** → **URL Configuration**. Set **Site URL** to your Vercel address, and add `https://your-app.vercel.app/**` under **Redirect URLs**. Click **Save**.

---

## 5. Troubleshooting

| What you see | What to do |
| --- | --- |
| A page saying **"One setup step is missing"** | `.env.local` is missing or still has the placeholder values. Redo step 3.2–3.3, then stop the app (`Ctrl + C`) and run `npm run dev` again. Settings are only read when the app starts. |
| `'npm' is not recognized` / `command not found: npm` | Node.js isn't installed, or the terminal was open during the install. Install Node.js (section 1), close the terminal, open a new one. |
| **"We couldn't load this page"** after logging in | Usually the tables don't exist yet (run the three migration files, section 2.2) or the URL/key in `.env.local` is wrong. Also check your internet connection. |
| **"Please confirm your email first"** when logging in | Click the link in the confirmation email (check spam). Or turn confirmation off (section 2.4). |
| **"Too many attempts right now"** when signing up | Supabase's free email limit was reached. Wait an hour, or turn confirmation off (section 2.4). |
| Confirmation link opens a page that can't be reached | The link points to `localhost:3000`, which only works on the computer running the app, while it is running. For an online app, do step 4.6. |
| `Port 3000 is in use` | Another copy of the app is running. Close that terminal, or open the address the new one prints (for example `http://localhost:3001`). |
| SQL Editor says `relation "categories" already exists` | That migration was already run. Skip to the next file. |
| The project stopped working after a week of no use | Free Supabase projects pause when idle. Open the Supabase dashboard and click **Restore project**. |

---

## 6. How the project is organized

```
study-resource-saver/
├─ app/                        The pages (each folder = one web address)
│  ├─ page.tsx                 /            landing page
│  ├─ (auth)/login, signup     /login, /signup
│  ├─ (app)/dashboard          /dashboard   the main library
│  ├─ (app)/favorites          /favorites
│  ├─ (app)/categories         /categories
│  ├─ (app)/layout.tsx         header shared by the private pages
│  ├─ (app)/error.tsx          friendly "couldn't load" screen
│  ├─ auth/confirm/route.ts    where email-confirmation links land
│  └─ actions/                 Server Actions: code that saves/changes data
│     ├─ auth.ts               sign up, log in, log out
│     ├─ resources.ts          add, edit, delete, status, favorite
│     └─ categories.ts         add, rename, delete
├─ components/                 Reusable pieces of the screen
│  ├─ resource-card.tsx        one saved resource
│  ├─ resource-dialog.tsx      the add / edit form
│  ├─ resource-toolbar.tsx     search box, filters, sort
│  ├─ resource-results.tsx     the list, empty states, "Load more"
│  ├─ category-manager.tsx     the categories page
│  └─ ...                      toasts, pop-ups, icons, loading placeholders
├─ lib/
│  ├─ supabase/client.ts       Supabase connection used in the browser
│  ├─ supabase/server.ts       Supabase connection used on the server
│  ├─ supabase/proxy.ts        keeps you logged in, guards private pages
│  ├─ queries.ts               all the "read data" requests
│  ├─ validation.ts            input checks (Zod)
│  ├─ detect-type.ts           guesses YouTube / GitHub / PDF… from a link
│  ├─ filters.ts               reads filters from the page address
│  └─ constants.ts             types, statuses, limits
├─ types/                      TypeScript descriptions of the data
├─ supabase/
│  ├─ migrations/              SQL that creates tables, security rules, indexes
│  └─ seed.sql                 optional demo data
├─ proxy.ts                    runs before every page (Next.js 16 name for "middleware")
├─ .env.example                template for your settings
└─ package.json                list of building blocks and commands
```

**Handy commands**

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app for development at <http://localhost:3000> |
| `npm run build` | Build the fast, production version (also checks for errors) |
| `npm run start` | Run the production version after building |
| `npm run lint` | Check code style |
| `npm run typecheck` | Check TypeScript types |

**Regenerating types** (only if you change the database later): `npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/database.ts`

---

## 7. Ideas for later

The code is organized so these can be added without rewrites:

- **Chrome extension**: save the current tab in one click (it would call the same `saveResource` logic).
- **AI auto-categorization**: suggest a category and tags from the page title (`lib/detect-type.ts` is the natural place to grow).
- **Reminders**: a `remind_at` column on `resources` plus a daily email.
- **Recommendations**: "you completed X, try Y".
- **Sharing**: share a category with classmates through a public read-only link.
