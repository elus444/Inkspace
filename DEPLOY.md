# Deploying Inkspace for free (Render + MongoDB Atlas)

This repo includes a [render.yaml](./render.yaml) Blueprint that provisions all 5
pieces of the app (4 backend services + the frontend) on Render's free tier in
one shot. You need two free accounts first — Claude can't create these for you.

## 1. MongoDB Atlas (free database)

1. Sign up at https://www.mongodb.com/cloud/atlas/register (Google sign-in is fastest).
2. Create a free **M0** cluster (any provider/region is fine).
3. **Database Access** → add a database user (username + password). Save the password.
4. **Network Access** → add IP address `0.0.0.0/0` (allow from anywhere) — Render's
   free tier uses dynamic outbound IPs, so this is required.
5. Click **Connect → Drivers**, copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. You'll turn this into **4** connection strings, one per service, by inserting
   the database name before the `?`:
   - `.../authService?retryWrites=true&w=majority`
   - `.../postService?retryWrites=true&w=majority`
   - `.../commentService?retryWrites=true&w=majority`
   - `.../likeService?retryWrites=true&w=majority`

   All 4 databases live in the same free cluster — that's within the M0 limits.

## 2. Render (free hosting)

1. Sign up at https://dashboard.render.com/register — choose **Sign up with GitHub**
   so the repo connection is instant.
2. Dashboard → **New +** → **Blueprint**.
3. Select the `elus444/Inkspace` repo. Render will detect `render.yaml` and list
   5 services: `inkspace-auth`, `inkspace-post`, `inkspace-comment`, `inkspace-like`,
   `inkspace-frontend`.
4. Render will prompt for the env vars marked `sync: false` — paste in the
   matching connection string from step 1 for each service's `MONGO_URI` /
   `MONGO_URL`. (`JWT_SECRET` is generated automatically and shared across all
   4 backend services — you don't need to touch it.)
5. Click **Apply**. Render builds and deploys all 5 services (free instances
   spin down after 15 min idle and take ~30–50s to wake back up on the next
   request — normal for the free tier).
6. Once live, open the `inkspace-frontend` service's URL
   (`https://inkspace-frontend.onrender.com`) — that's your app.

## If a service name was already taken

Render service names are global. If `inkspace-auth` (etc.) was unavailable,
Render will have assigned a different subdomain for that service. In that
case, open the `inkspace-frontend` service → **Environment**, update the
`VITE_*_URL` variable(s) to match the actual backend URL(s) shown in your
Render dashboard, and trigger **Manual Deploy** to rebuild the frontend with
the corrected URLs.
