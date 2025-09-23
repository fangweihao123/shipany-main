import { NextResponse } from 'next/server';
import { getPostsByLocale, PostStatus } from '@/models/post';
import { locales, defaultLocale } from "@/i18n/locale";

const PUBLIC_WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;

if (!PUBLIC_WEB_URL) {
  console.error("[Posts.xml route error]: PUBLIC_WEB_URL is not configured!");
}

export async function GET() {
  try {
    // 动态获取所有语言的posts
    const postsPromises = locales.map(locale => getPostsByLocale(locale, 1, 1000));
    const allPostsByLocale = await Promise.all(postsPromises);

    const currentDate = new Date().toISOString();
    
    // 日期格式化函数
    const formatDate = (date: string | Date | null | undefined): string => {
      if (!date) return currentDate;
      return new Date(date).toISOString();
    };
    
    const postUrls: Array<{
      loc: string;
      lastmod: string;
      changefreq: string;
      priority: string;
    }> = [];
    
    // 遍历所有语言的posts
    locales.forEach((locale, index) => {
      const posts = allPostsByLocale[index];
      
      if (posts) {
        posts.forEach(post => {
          if (post.status === PostStatus.Online && post.slug) {
            // 构建URL路径
            const urlPath = locale === defaultLocale 
              ? `posts/${encodeURIComponent(post.slug)}`
              : `${locale}/posts/${encodeURIComponent(post.slug)}`;
            
            postUrls.push({
              loc: `${PUBLIC_WEB_URL}${urlPath}`,
              lastmod: formatDate(post.updated_at || post.created_at),
              changefreq: 'monthly',
              priority: locale === defaultLocale ? '0.7' : '0.6'
            });
          }
        });
      }
    });

    // 生成XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${postUrls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800', // 30分钟缓存
      },
    });
  } catch (error) {
    console.error('Posts sitemap generation error:', error);
    return new NextResponse('Error generating posts sitemap', { status: 500 });
  }
}