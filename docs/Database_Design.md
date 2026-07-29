# Database Design

## Database
PostgreSQL

## Tables

### Users
- id
- full_name
- email
- password
- phone
- role
- location

### Skills
- id
- skill_name

### Volunteer_Skills
- volunteer_id
- skill_id

### Emergency_Requests
- id
- title
- description
- location
- status

### Assignments
- id
- volunteer_id
- emergency_id

### Notifications
- id
- user_id
- message