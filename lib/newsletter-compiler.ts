export interface NewsletterPost {
  id?: string;
  title: string;
  slug: string;
  description?: string | null;
  created_at?: string | null;
  cover_image?: string | null;
}

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function compileDigestHtml(posts: NewsletterPost[], appUrl: string, recipientEmail?: string): string {
  const postItemsHtml = posts
    .map(
      (post) => `
    <article style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
      
      ${
        post.cover_image
          ? `<div style="margin-bottom: 14px; overflow: hidden; border-radius: 6px; border: 1px solid #e5e7eb; background-color: #f9fafb;">
              <a href="${appUrl}/blog/${post.slug}" style="display: block; text-decoration: none;">
                <img src="${post.cover_image}" alt="${post.title}" style="width: 100%; max-width: 100%; height: auto; max-height: 240px; object-fit: cover; display: block; border: 0;" />
              </a>
            </div>`
          : ""
      }

      <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">
        ${formatDate(post.created_at)}
      </div>

      <h2 style="font-size: 19px; font-weight: 600; line-height: 1.3; margin: 0 0 8px 0; letter-spacing: -0.01em;">
        <a href="${appUrl}/blog/${post.slug}" style="color: #1e3a8a; text-decoration: none;"> <!-- blue-900 -->
          ${post.title}
        </a>
      </h2>

      ${
        post.description
          ? `<p style="font-size: 15px; line-height: 1.55; color: #374151; margin: 0 0 16px 0; font-weight: 400;">
              ${post.description}
            </p>`
          : ""
      }

      <!-- Mobile-friendly 44px tap target button -->
      <a href="${appUrl}/blog/${post.slug}" style="display: inline-block; background-color: #6d596f; color: #ffffff; font-size: 13px; font-weight: 500; padding: 10px 18px; border-radius: 4px; text-decoration: none; -webkit-text-size-adjust: none;"> <!-- mauve-600 -->
        Read post &rarr;
      </a>
    </article>
  `
    )
    .join("");

  const unsubUrl = recipientEmail 
    ? `${appUrl}/api/unsubscribe?email=${encodeURIComponent(recipientEmail)}`
    : `${appUrl}/api/unsubscribe`;

  return `
    <!DOCTYPE html>
    <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="x-apple-disable-message-reformatting">
        <title>Nirav Pandey</title>
      </head>
      <body style="background-color: #ffffff; color: #111827; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; -webkit-font-smoothing: antialiased;">
        
        <!-- Main Wrapper Table -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; width: 100%;">
          <tr>
            <td align="center" style="padding: 24px 12px 40px 12px;">
              
              <!-- Content Container (Max Width 580px) -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; width: 100%; margin: 0 auto; text-align: left;">
                <tr>
                  <td>
                    
                    <!-- Header -->
                    <header style="margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
                      <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #826d84;"> <!-- mauve-500 -->
                        Nirav Pandey
                      </span>
                      <h1 style="font-size: 24px; font-weight: 700; color: #1e3a8a; margin: 6px 0 0 0; letter-spacing: -0.02em;"> <!-- blue-900 -->
                        Latest Articles
                      </h1>
                    </header>

                    <!-- Article List -->
                    <main>
                      ${postItemsHtml}
                    </main>

                    <!-- Footer -->
                    <footer style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: left;">
                      <p style="font-size: 12px; color: #9ca3af; margin: 0; line-height: 1.5;">
                        Sent via newsletter broadcast · <a href="${appUrl}" style="color: #1e3a8a; text-decoration: underline;">Visit website</a>
                      </p>
                      <p style="font-size: 11px; color: #9ca3af; margin: 6px 0 0 0;">
                        No longer wish to receive these? <a href="${unsubUrl}" style="color: #826d84; text-decoration: underline;">Unsubscribe</a>
                      </p>
                    </footer>

                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

      </body>
    </html>
  `;
}