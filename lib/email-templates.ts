import fs from 'fs';
import path from 'path';

/**
 * Reads an email template from the email-templates directory
 * and replaces placeholders with actual values
 */
export function getEmailTemplate(
  templateName: 'welcome-mail' | 'forgot-password-mail',
  replacements: Record<string, string>
): string {
  const templatePath = path.join(process.cwd(), 'email-templates', `${templateName}.html`);
  let template = fs.readFileSync(templatePath, 'utf-8');
  
  // Replace all placeholders like {{username}}, {{verifyUrl}}, etc.
  Object.entries(replacements).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    template = template.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return template;
}
