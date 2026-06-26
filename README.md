# 💎 Ananya Aura Jewellery

Ananya Aura Jewellery is a modern jewellery shopping website developed as a B.Tech Mini Project. The project provides an attractive online shopping experience with user authentication, wishlist, shopping cart, order management, and MySQL database integration.

---

## 📌 Features

### 👤 User Module
- User Registration
- User Login
- Profile Management
- Logout

### 🛍 Shopping Features
- Browse Jewellery Products
- Category Filtering
- Search Products
- Wishlist
- Shopping Cart
- Buy Now
- Checkout
- Place Orders
- Order History
- Invoice Generation

### 💳 Payment Options
- Cash on Delivery
- UPI Payment
- Credit/Debit Card
- Net Banking

### 🎨 UI Features
- Responsive Design
- Amazon/Meesho Inspired UI
- Dark/Light Theme
- Toast Notifications
- Wishlist Count
- Cart Count
- Search Suggestions

---

# 🛠 Technologies Used

## Frontend
- HTML5
- CSS3
- JavaScript
- Bootstrap 5

## Backend
- Python
- Flask
- Flask-CORS

## Database
- MySQL

---

# 📂 Project Structure

```
AnanyaAuraJewellery/
│
├── home.html
├── login.html
├── register.html
├── profile.html
├── wishlist.html
├── cart.html
├── orders.html
├── myorders.html
├── invoice.html
├── success.html
│
├── css/
│
├── js/
│   ├── home.js
│   ├── search.js
│
├── images/
│
├── backend/
│   ├── app.py
│
└── README.md
```

---

# 🗄 Database Tables

## Users

| Column | Type |
|---------|------|
| id | INT |
| name | VARCHAR |
| email | VARCHAR |
| password | VARCHAR |

---

## Products

| Column | Type |
|---------|------|
| id | INT |
| name | VARCHAR |
| price | DECIMAL |
| image | VARCHAR |
| category | VARCHAR |
| description | TEXT |

---

## Orders

| Column | Type |
|---------|------|
| id | INT |
| order_id | VARCHAR |
| customer_name | VARCHAR |
| phone | VARCHAR |
| address | TEXT |
| city | VARCHAR |
| state | VARCHAR |
| pincode | VARCHAR |
| payment | VARCHAR |
| total_amount | DECIMAL |

---

# ⚙ Installation

## Clone Project

```bash
git clone https://github.com/yourusername/ananya-aura-jewellery.git
```

---

## Install Python Packages

```bash
pip install flask
pip install flask-cors
pip install mysql-connector-python
```

---

## Create Database

```sql
CREATE DATABASE ananya_aura_jewellery;
```

---

## Run Backend

```bash
python app.py
```

Server:

```
http://127.0.0.1:5000
```

---

## Open Website

Open

```
home.html
```

in your browser.

---

# 📸 Screens

- Home Page
- Login Page
- Register Page
- Wishlist
- Cart
- Checkout
- My Orders
- Invoice
- Profile

---

# 🚀 Future Enhancements

- Online Payment Gateway
- OTP Verification
- Email Notifications
- Admin Dashboard
- Product Reviews
- Ratings
- AI Product Recommendations

---

# 👨‍💻 Developed By

**Gunukula Chaithanya**

B.Tech Mini Project

---

# 📄 License

This project is developed for educational purposes only.
