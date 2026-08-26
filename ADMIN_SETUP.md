# Blog Admin Setup

The admin lives at `/blog-admin`. It commits a new post directly to the repo, which triggers auto-deploy on Netlify/Vercel.

---

## 1. Create `.env.local` in the project root

```
VITE_GITHUB_OWNER=your-github-username
VITE_GITHUB_REPO=seb-fantasy
VITE_GITHUB_TOKEN=your-fine-grained-pat
VITE_ADMIN_PASSWORD=your-password
```

`.env.local` is already in `.gitignore` — it will never be committed.

---

## 2. Generate a fine-grained GitHub PAT

1. Go to GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens**
2. Click **Generate new token**
3. Set a name like "seb-fantasy blog admin"
4. Set expiration (90 days recommended)
5. Under **Repository access** → only `seb-fantasy`
6. Under **Repository permissions** → **Contents: Read and write**
7. Click Generate and copy the token into `VITE_GITHUB_TOKEN`

---

## 3. Restart the dev server

```
npm run dev
```

Visit `http://localhost:5173/blog-admin` — log in with whatever you set as `VITE_ADMIN_PASSWORD`.

---

## How publishing works

1. Fill in the form and click **Publish Post →**
2. The admin fetches `src/data/blogPosts.js` from GitHub via the Contents API
3. Inserts your new post at the top of the array and commits it
4. Netlify/Vercel detects the push and deploys in ~60 seconds

The commit message will be: `blog: add "Your Post Title"`
