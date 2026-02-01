# AI Virtual Assistant

A complete AI-powered virtual assistant that can manage files and send emails through natural language commands.

## Features

- **File Management**: Create, read, edit, delete, and search files
- **Email Sending**: Send emails through natural language commands
- **Command History**: Track all executed commands
- **Dashboard**: View statistics and recent activity
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
virtual-assistant/
├── frontend/
│   ├── index.html          # Landing page
│   ├── dashboard.html      # Dashboard with assistant
│   ├── files.html          # File manager
│   ├── about.html          # About page
│   ├── contact.html        # Contact form
│   ├── css/
│   │   └── style.css       # All styles
│   └── js/
│       ├── main.js         # Common functions
│       ├── assistant.js    # AI assistant logic
│       └── files.js        # File manager logic
├── backend/
│   ├── config/
│   │   └── db.php          # Database configuration
│   ├── api/
│   │   ├── command_handler.php  # Main command processor
│   │   ├── file_list.php        # List files API
│   │   ├── contact.php          # Contact form handler
│   │   ├── history.php          # Command history API
│   │   └── stats.php            # Statistics API
│   ├── actions/
│   │   ├── file_create.php      # Create file action
│   │   ├── file_read.php        # Read file action
│   │   ├── file_edit.php        # Edit file action
│   │   ├── file_delete.php      # Delete file action
│   │   ├── file_search.php      # Search files action
│   │   └── send_email.php       # Send email action
│   ├── helpers/
│   │   └── functions.php        # Helper functions
│   └── .htaccess                # Apache configuration
└── database/
    └── setup.sql           # Database schema
```

## Installation

### Requirements

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache or Nginx web server
- SMTP server for email functionality (optional)

### Setup Steps

1. **Clone or download the project**

2. **Create the database**
   ```bash
   mysql -u root -p < database/setup.sql
   ```

3. **Configure database connection**
   Edit `backend/config/db.php`:
   ```php
   private $host = 'localhost';
   private $username = 'your_username';
   private $password = 'your_password';
   private $database = 'virtual_assistant';
   ```

4. **Configure email settings** (optional)
   Edit `backend/actions/send_email.php` to set your SMTP server details.

5. **Set up web server**
   Point your web server to the `frontend` directory or the project root.

6. **Set permissions**
   Ensure the web server can write to the database and logs.

## Usage

### Command Examples

**Create a file:**
- "create file notes.txt with content My important notes"
- "make a file called readme.md containing # Hello World"

**Read a file:**
- "read file notes.txt"
- "show me notes.txt"
- "what's in readme.md"

**Edit a file:**
- "edit file notes.txt with new content here"
- "update readme.md to # Updated Title"

**Delete a file:**
- "delete file notes.txt"
- "remove readme.md"

**Search files:**
- "find files named notes"
- "search for readme"

**Send email:**
- "send email to user@example.com subject Hello message This is the email body"

**Help:**
- "help"
- "what can you do"

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/command_handler.php` | POST | Process commands |
| `/api/file_list.php` | GET | List all files |
| `/api/history.php` | GET/DELETE | Manage command history |
| `/api/stats.php` | GET | Get statistics |
| `/api/contact.php` | POST | Submit contact form |

## Security Considerations

- All inputs are sanitized and validated
- SQL injection prevention through prepared statements
- XSS prevention through output escaping
- File operations are restricted to the designated directory
- CORS headers are configured for API access

## Customization

### Changing Colors

Edit the CSS variables in `frontend/css/style.css`:
```css
:root {
    --primary-color: #0f172a;
    --secondary-color: #1e293b;
    --accent-color: #3b82f6;
    /* ... more variables */
}
```

### Adding New Commands

1. Add a new pattern in `backend/helpers/functions.php` in the `parseCommand()` function
2. Create a new action file in `backend/actions/`
3. Add the action handling in `backend/api/command_handler.php`

## License

MIT License - Feel free to use and modify as needed.

## Support

For questions or issues, please use the contact form on the website or open an issue on the repository.
