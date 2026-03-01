# Home Finance Tracker

A Django-based household budgeting app that follows the **4-bucket approach** (Fixed Costs, Investments, Savings, Guilt-Free Spending). Supports multiple household members, auto-categorisation of transactions, monthly snapshots, savings goals, and CSV export.

## Quick Start

```bash
# 1. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate      # macOS / Linux
# .venv\Scripts\activate       # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment variables
cp .env.example .env
# Edit .env and set a real SECRET_KEY

# 4. Apply migrations
python manage.py migrate

# 5. (Optional) Seed demo data
python manage.py seed_data
# Demo users: alex / demo1234, jordan / demo1234

# 6. Run the development server
python manage.py runserver
```

Open <http://127.0.0.1:8000/> in your browser.

## Project Structure

```
home_finance/       Django project settings & root URL config
tracker/            Main application
  models.py         Household, UserProfile, BudgetCategory, Transaction,
                    MonthlySnapshot, SavingsGoal
  views.py          Dashboard, CRUD views, reports, CSV export
  forms.py          Django forms with Bootstrap widget attrs
  serializers.py    DRF serializers (API-ready)
  signals.py        Auto-create UserProfile, auto-update snapshots
  templatetags/     Custom filters (currency, bucket colours, etc.)
  management/       seed_data management command
  templates/        Django HTML templates (Bootstrap 5)
  static/           App-specific CSS & JS
```

## Environment Variables

| Variable        | Default               | Description                                         |
| --------------- | --------------------- | --------------------------------------------------- |
| `SECRET_KEY`    | insecure fallback     | **Required in production** — random 50+ char string |
| `DEBUG`         | `True`                | Set to `False` in production                        |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated hostnames                           |
| `DATABASE_URL`  | SQLite                | Optional — e.g. `postgres://…`                      |

## Running Tests

```bash
python manage.py test tracker
```

## Production Notes

- Set `DEBUG=False` — this automatically enables HSTS, secure cookies, and SSL redirect.
- Run `python manage.py collectstatic` to gather static files into `staticfiles/`.
- Use a production-grade server (gunicorn, uvicorn) behind a reverse proxy.
