# UAV ERP Fullstack

He thong theo doi chuyen bay/giao hang UAV voi React + Node.js.

## Tinh nang

- Dang nhap JWT va phan quyen theo vai tro:
  - `admin`: tao/sua/xoa, xoa tat ca
  - `dispatcher`: tao/sua
  - `viewer`: chi xem
- Quan ly log chuyen bay day du cac truong nghiep vu
- Bo loc va KPI dashboard
- Sua/xoa tung record
- Export CSV theo bo loc hien tai

## Tai khoan mau

- `admin / admin123`
- `dispatcher / dispatcher123`
- `viewer / viewer123`

## Chay local

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Mo: `http://localhost:5173`

## Chay 1 lenh bang Docker

```bash
docker compose up --build
```

Mo: `http://localhost:5173`
