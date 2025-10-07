**S3 Sports Arena - Academy Management System**
S3 Sports Arena is a comprehensive, full-stack web application meticulously engineered to modernize the management and operational workflow of a dynamic sports academy. Born from a real-world need for greater transparency and improved communication, this platform bridges the gap between academy staff, athletes, and their families. It directly addresses the common concern from parents regarding their child's development by providing a clear, digital window into daily training activities, assigned tasks, and performance metrics.

The application operates on a sophisticated role-based access system, delivering a unique, tailored experience for four key user groups: Management, Coaches, Players, and Parents.

**Key Features**
Role-Based Access Control: Secure, dedicated dashboards and functionality for each of the four user roles.

**Management Dashboard:** A powerful administrative overview with a complete list of all users. Features advanced filtering by sport and the ability to track player membership dates. Admins can inspect the tasks assigned to any specific player.

**Coach Dashboard:** An intuitive two-column layout displaying the coach's full player roster alongside a task management system. Coaches can create detailed tasks with due dates and time limits, assign them to individuals, and monitor progress by marking tasks as complete.

**Player Dashboard:** A personalized hub for athletes. It prominently displays their unique Player ID (for sharing with parents), lists all assigned tasks with a live timer for time-sensitive activities, and shows relevant, sport-specific opportunities like local tournaments and scholarships.

**Parent Dashboard:** A secure portal for parents to stay informed. After registering and linking to their child's account via the Player ID, parents get a read-only view of their child's profile, all assigned tasks, and their real-time completion status.

User Profiles & Image Uploads: All users have a personal profile page where they can view their details and upload a custom profile picture.

**Tech Stack
Backend: Django, Django REST Framework, djangorestframework-simplejwt**

****Frontend: React.js (with Hooks), React Router**

**Styling: Tailwind CSS with the DaisyUI component library (using a custom "corporate" theme).**

**Database: SQLite (for development)****

Getting Started
To get a local copy up and running, follow these simple steps.

Prerequisites
**Python 3.8+ and Pip**

**Node.js and npm**

**Backend Setup (Django)
Clone the repository.**

Navigate to the backend directory:

cd sports_academy

Create and activate a virtual environment:

# For Windows
python -m venv venv
venv\Scripts\activate

Install Python dependencies:

pip install -r requirements.txt

Run database migrations:

python manage.py makemigrations
python manage.py migrate

Create a superuser to access the admin panel:

python manage.py createsuperuser

Start the backend server:

python manage.py runserver

The backend API will be running at http://127.0.0.1:8000.

Frontend Setup (React)
Navigate to the frontend directory:

cd frontend2

Install JavaScript dependencies:

npm install

Start the frontend development server:

npm start
