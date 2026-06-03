# Creator Marketplace – Full Stack Social Networking Platform

A full-stack **Creator & Brand Marketplace** built with React, Node.js, Express, MongoDB, JWT Auth, and Cloudinary.

---

# Images – 

<img width="867" height="904" alt="image" src="https://github.com/user-attachments/assets/b49e2bc7-9088-4200-8888-264e0bd7b65c" />

<img width="1878" height="897" alt="image" src="https://github.com/user-attachments/assets/7dcb6162-0d70-4353-a949-65bee3a90af7" />

<img width="1913" height="906" alt="image" src="https://github.com/user-attachments/assets/b0c03b2a-295e-4813-894b-1765560e159a" />

<img width="1914" height="910" alt="image" src="https://github.com/user-attachments/assets/69828a43-4350-4b35-bcb8-03db208ff220" />

<img width="1905" height="903" alt="image" src="https://github.com/user-attachments/assets/347784b1-188a-4a93-9621-7d15b7043eb1" />

<img width="1908" height="908" alt="image" src="https://github.com/user-attachments/assets/0b795581-129e-43a0-b3e6-30a6942a9617" />

## 🚀 Tech Stack

| Layer      | Tech                                  |
|------------|---------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS v3       |
| Backend    | Node.js, Express.js                   |
| Database   | MongoDB + Mongoose                    |
| Auth       | JWT (access token + httpOnly refresh) |
| Media      | Cloudinary (images & videos)          |

---

## 📁 Folder Structure

```
pbl11/
├── backend/          # Express API
│   ├── config/       # DB + Cloudinary
│   ├── controllers/  # Business logic
│   ├── middleware/   # Auth, role, upload
│   ├── models/       # 9 Mongoose models
│   ├── routes/       # 9 route files
│   ├── utils/        # Token helpers
│   └── server.js
└── frontend/         # React + Vite app
    └── src/
        ├── api/        # Axios instance
        ├── components/ # Layout + feature components
        ├── context/    # AuthContext
        ├── pages/      # All pages + admin
        └── routes/     # PrivateRoute + AdminRoute
```

---

## ⚙️ Setup & Run

### 1. Backend
```bash
cd backend
# Fill in your values in .env
npm install
npm run dev        # runs on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev        # runs on http://localhost:5173
```

### 3. `.env` (backend)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/creator_marketplace
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

---

## 🔐 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register (creator/brand) |
| POST | `/api/auth/login`    | Login |
| GET  | `/api/auth/me`       | Get current user |
| POST | `/api/auth/logout`   | Logout |

### Users
| GET  | `/api/users/search`       | Search users |
| GET  | `/api/users/:id`          | Get profile |
| PUT  | `/api/users/profile`      | Update profile |
| POST | `/api/users/:id/follow`   | Follow/Unfollow |
| GET  | `/api/users/:id/posts`    | User post grid |

### Posts
| GET  | `/api/posts`              | Explore all posts |
| GET  | `/api/posts/feed`         | Personalized feed |
| POST | `/api/posts`              | Create post |
| POST | `/api/posts/:id/like`     | Like/unlike |
| GET  | `/api/posts/:id/comments` | Get comments |
| POST | `/api/posts/:id/comments` | Add comment |

### Campaigns
| GET  | `/api/campaigns`          | Browse campaigns |
| POST | `/api/campaigns`          | Create (brand) |
| GET  | `/api/campaigns/:id`      | Campaign detail |

### Applications
| POST | `/api/applications/:campaignId` | Apply (creator) |
| GET  | `/api/applications/my`          | My applications |
| PUT  | `/api/applications/:id/status`  | Accept/Reject (brand) |

### Messages
| GET  | `/api/messages/inbox`             | Inbox |
| GET  | `/api/messages/conversation/:id`  | Thread |
| POST | `/api/messages/send/:receiverId`  | Send message |

### Products & Orders
| GET  | `/api/products`           | Browse products |
| POST | `/api/products`           | List product (brand) |
| POST | `/api/orders/:productId`  | Place order |
| GET  | `/api/orders/my`          | My orders |
| PUT  | `/api/orders/:id/status`  | Update status (brand) |

### Admin (admin only)
| GET  | `/api/admin/dashboard`       | Stats |
| GET  | `/api/admin/users`           | All users |
| PUT  | `/api/admin/users/:id/ban`   | Ban/Unban |
| GET  | `/api/admin/posts`           | All posts |
| DELETE | `/api/admin/posts/:id`    | Remove post |

---

## 🎨 Features

- ✅ JWT auth with role-based access (creator / brand / admin)
- ✅ Creator profiles with post grid, follower stats, follow/unfollow
- ✅ Personalized feed + Explore by hashtag/category
- ✅ Like, comment, share posts
- ✅ Campaign marketplace: create, browse, apply, accept/reject
- ✅ Direct messaging with inbox + conversation threads
- ✅ Shopping module: list products, place orders, track status
- ✅ Admin panel: dashboard, user management (ban/delete), post moderation
- ✅ Cloudinary media uploads (images & videos)
- ✅ Dark mode glassmorphism UI with Tailwind CSS

---

## 🗃️ Database Models

`User` · `Post` · `Comment` · `Follow` · `Campaign` · `Application` · `Product` · `Order` · `Message`
