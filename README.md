# 🎮 KidSlug Warriors

Metal Slug-style web game — Phaser 3 + React + Firebase + Vercel.

## Features
- 4 stages with progressive difficulty + Final UFO Boss
- Default weapons: Pistol & Grenade
- Shop weapons: Machine Gun, Shotgun, Rocket Launcher, Combat Knife
- Coin system: earn by killing enemies + clearing stages; spend in shop
- GM Panel: top-up coins, ban/unban players, set GM status
- Google + Email auth via Firebase
- Leaderboard (top 20)
- Mobile touch controls (landscape)
- All original Metal Slug sound assets

## Controls (Keyboard)
| Key | Action |
|---|---|
| ← → / A D | Move |
| Space / W / ↑ | Jump |
| ↓ / S | Crouch |
| J | Shoot |
| E / Q | Cycle weapon |
| W (ground) | Aim up |

## Deploy to Vercel

### 1. Install dependencies
```bash
npm install
```

### 2. Add environment variables in Vercel dashboard
Copy all values from `.env.local`:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_ADMIN_UIDS` → paste your Firebase UID to get super-admin GM access

### 3. Firebase Console Setup
1. Go to https://console.firebase.google.com → your project `kidslug-warriors`
2. **Authentication** → Enable: Email/Password + Google
3. **Firestore** → Create database (production mode) → paste `firestore.rules`
4. **Authorized domains** → Add your Vercel domain

### 4. Get your UID (for VITE_ADMIN_UIDS)
Sign in to the app → open DevTools console → run:
```js
firebase.auth().currentUser.uid
```
Or check Firebase Console → Authentication → Users tab.

### 5. Deploy
```bash
npx vercel --prod
```

## GM Panel
- Go to Menu → GM Panel button (only visible if your UID is in `VITE_ADMIN_UIDS` or `isGM: true` in Firestore)
- Search player by email
- Top-up coins with reason logging
- Ban/unban players
- Promote/demote GMs (super admin only)

## Stages
| Stage | Name | Enemies | Coin Reward |
|---|---|---|---|
| 1 | Desert Outpost | Scientists + Zombies | +150 |
| 2 | Steel Valley | Tanks + Helicopters | +280 |
| 3 | Sky Fortress | Mecha Robots + Airships | +450 |
| 4 | FINAL BOSS: UFO Commander | UFO Boss + waves | +1200 |

## Weapon Shop
| Weapon | Price | Special |
|---|---|---|
| Pistol | FREE | Default |
| Grenade | FREE | Default, AoE |
| Machine Gun | 500🪙 | Rapid fire |
| Shotgun | 800🪙 | 5-spread |
| Rocket Launcher | 1200🪙 | Huge AoE |
| Combat Knife | 300🪙 | Melee, instant |
