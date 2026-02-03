# Email Templates

This folder contains HTML email templates used throughout the application.

## Templates

### 1. `welcome-mail.html`
Sent when a user signs up and needs to verify their email address.

**Placeholders:**
- `{{username}}` - User's username
- `{{verifyUrl}}` - Email verification URL with token

### 2. `forgot-password-mail.html`
Sent when a user requests a password reset.

**Placeholders:**
- `{{username}}` - User's username
- `{{resetUrl}}` - Password reset URL with token

## Usage

Email templates are loaded and processed by the `getEmailTemplate` function in `lib/email-templates.ts`.

```typescript
import { getEmailTemplate } from '@/lib/email-templates';

const html = getEmailTemplate('welcome-mail', {
  username: 'John',
  verifyUrl: 'https://example.com/verify?token=abc123'
});
```

## Adding New Templates

1. Create a new `.html` file in this folder
2. Use `{{placeholderName}}` syntax for dynamic content
3. Update the `getEmailTemplate` function type in `lib/email-templates.ts` to include your new template name
4. Use the template in your collection config or server action

## Template Design Guidelines

- **Responsive**: Templates should work on mobile and desktop
- **Inline CSS**: All styles must be inline for email client compatibility
- **Tested**: Test templates across different email clients
- **Brand Consistent**: Use Stond Emporium colors and branding
- **Accessible**: Include alt text for images and proper semantic HTML
