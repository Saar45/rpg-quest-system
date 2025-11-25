# RPG Quest System

A full-stack RPG quest management system with player progression, inventory, and quest completion mechanics.

## Stack

**Backend:** Node.js, Express, MongoDB, JWT Authentication  
**Frontend:** React, Vite, Context API

## Features

- User authentication (register/login)
- Player profile with level and experience
- Quest system (accept, complete quests)
- Inventory management (use items)
- Real-time UI updates after actions
- Experience-based leveling (100 XP per level)

## Setup

### Backend
```bash
cd backend
npm install
```

Create `.env`:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=3000
```

Start server:
```bash
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Access at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new player
- `POST /api/auth/login` - Login player

### Player
- `GET /api/player/profile` - Get player profile
- `POST /api/player/accept-quest/:questId` - Accept a quest
- `POST /api/player/complete-quest/:questId` - Complete a quest
- `POST /api/player/use-item/:itemId` - Use an item

### Static Data
- `GET /api/quests` - Get all quests
- `GET /api/quests/:id` - Get quest by ID
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get item by ID

## Models

**Player:** name, email, password, level, experience, inventory[], quests[]  
**Quest:** title, description, level, status, rewards{experience, item}  
**Item:** name, description, type, effects, value

## Project Structure

```
backend/
├── server.js           # Main server file
├── src/
│   ├── models/         # Mongoose models
│   ├── middleware/     # Auth middleware
│   └── controllers/    # (future)

frontend/
├── src/
│   ├── components/     # React components
│   ├── contexts/       # Context API (AuthContext)
│   └── services/       # API calls
```

## License

MIT
