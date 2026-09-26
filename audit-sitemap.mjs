#!/usr/bin/env node

const SITE = 'https://oldtownswalks.com';
const DEFAULT_SITEMAPS = [
  `${SITE}/sitemap-index.xml`,
  `${SITE}/sitemap.xml`
];

const CONCURRENCY = Math.max(
  1,
  Math.min(
    40,
    Number(process.env.AUDIT_CONCURRENCY || 16)
  )
);

const REQUEST_TIMEOUT_MS = Math.max(
  3000,
  Number(process.env.AUDIT_TIMEOUT_MS || 15000)
);

const MAX_REDIRECTS = 8;
const MAX_HTML_BYTES = 256 * 1024;

const OUTPUT_DIR = new URL(
  './search-console-audit/',
  `file://${process.cwd().replace(/\\/g, '/')}/`
);

function decodeXml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractLocs(xml) {
  return [...String(xml).matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => decodeXml(match[1]).trim())
    .filter(Boolean);
}

function isSitemapIndex(xml) {
  return /<sitemapindex\b/i.test(String(xml));
}

function isUrlSet(xml) {
  return /<urlset\b/i.test(String(xml));
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent':
          'OldTownsWalks-Technical-Audit/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(
        `${response.status} ${response.statusText}`
      );
    }

    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function discoverSitemapRoots() {
  for (const candidate of DEFAULT_SITEMAPS) {
    try {
      const xml = await fetchText(candidate);

      if (
        isSitemapIndex(xml) ||
        isUrlSet(xml)
      ) {
        return [{ url: candidate, xml }];
      }
    } catch {
      // Try the next candidate.
    }
  }

  try {
    const robots = await fetchText(
      `${SITE}/robots.txt`
    );

    const sitemapLines = robots
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) =>
        /^sitemap\s*:/i.test(line)
      )
      .map((line) =>
        line.replace(/^sitemap\s*:/i, '').trim()
      )
      .filter(Boolean);

    const roots = [];

    for (const sitemapUrl of sitemapLines) {
      try {
        roots.push({
          url: sitemapUrl,
          xml: await fetchText(sitemapUrl)
        });
      } catch {
        // Ignore broken sitemap declarations.
      }
    }

    if (roots.length) return roots;
  } catch {
    // Continue to the final error.
  }

  throw new Error(
    'No working sitemap index or sitemap could be found.'
  );
}

async function collectSitemapUrls() {
  const roots = await discoverSitemapRoots();
  const queue = [...roots];
  const seenSitemaps = new Set();
  const pageUrls = new Set();

  while (queue.length) {
    const item = queue.shift();

    if (!item || seenSitemaps.has(item.url)) {
      continue;
    }

    seenSitemaps.add(item.url);

    const xml =
      item.xml || await fetchText(item.url);

    const locs = extractLocs(xml);

    if (isSitemapIndex(xml)) {
      for (const sitemapUrl of locs) {
        if (!seenSitemaps.has(sitemapUrl)) {
          queue.push({
            url: sitemapUrl,
            xml: null
          });
        }
      }

      continue;
    }

    if (isUrlSet(xml)) {
      for (const pageUrl of locs) {
        pageUrls.add(pageUrl);
      }
    }
  }

  return {
    sitemapCount: seenSitemaps.size,
    urls: [...pageUrls]
  };
}

async function readLimitedHtml(response) {
  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let html = '';

  try {
    while (size < MAX_HTML_BYTES) {
      const { done, value } =
        await reader.read();

      if (done) break;

      if (!value) continue;

      const remaining =
        MAX_HTML_BYTES - size;

      const chunk =
        value.byteLength > remaining
          ? value.slice(0, remaining)
          : value;

      size += chunk.byteLength;
      html += decoder.decode(
        chunk,
        { stream: true }
      );

      if (/<\/head\s*>/i.test(html)) {
        break;
      }
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // Ignore cancellation errors.
    }
  }

  html += decoder.decode();
  return html;
}

function getMetaRobots(html) {
  const tags = String(html)
    .match(/<meta\b[^>]*>/gi) || [];

  for (const tag of tags) {
    const nameMatch =
      tag.match(/\bname\s*=\s*["']?([^"'\s>]+)/i);

    if (
      !nameMatch ||
      !/^(robots|googlebot)$/i.test(
        nameMatch[1]
      )
    ) {
      continue;
    }

    const contentMatch =
      tag.match(
        /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i
      );

    if (contentMatch) {
      return (
        contentMatch[1] ||
        contentMatch[2] ||
        contentMatch[3] ||
        ''
      ).trim();
    }
  }

  return '';
}

function getCanonical(html) {
  const tags = String(html)
    .match(/<link\b[^>]*>/gi) || [];

  for (const tag of tags) {
    const relMatch =
      tag.match(
        /\brel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i
      );

    const rel =
      (
        relMatch?.[1] ||
        relMatch?.[2] ||
        relMatch?.[3] ||
        ''
      ).toLowerCase();

    if (
      !rel
        .split(/\s+/)
        .includes('canonical')
    ) {
      continue;
    }

    const hrefMatch =
      tag.match(
        /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i
      );

    return (
      hrefMatch?.[1] ||
      hrefMatch?.[2] ||
      hrefMatch?.[3] ||
      ''
    ).trim();
  }

  return '';
}

function normalizeComparableUrl(value) {
  try {
    const url = new URL(value, SITE);
    url.hash = '';

    if (
      url.pathname.length > 1 &&
      url.pathname.endsWith('/')
    ) {
      url.pathname =
        url.pathname.replace(/\/+$/, '');
    }

    return url.toString();
  } catch {
    return String(value || '').trim();
  }
}

function hasNoindex(value) {
  return /(?:^|[,\s])noindex(?:$|[,\s])/i
    .test(String(value || ''));
}

async function requestUrl(originalUrl) {
  let currentUrl = originalUrl;
  const redirectChain = [];

  for (
    let redirectCount = 0;
    redirectCount <= MAX_REDIRECTS;
    redirectCount += 1
  ) {
    const controller =
      new AbortController();

    const timer = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    );

    let response;

    try {
      response = await fetch(currentUrl, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent':
            'OldTownsWalks-Technical-Audit/1.0',
          accept:
            'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1'
        }
      });
    } catch (error) {
      clearTimeout(timer);

      return {
        originalUrl,
        finalUrl: currentUrl,
        status: 0,
        redirects: redirectChain.length,
        redirectChain,
        noindex: false,
        canonical: '',
        canonicalMismatch: false,
        missingCanonical: false,
        error:
          error?.name === 'AbortError'
            ? 'TIMEOUT'
            : String(error?.message || error)
      };
    }

    clearTimeout(timer);

    const status = response.status;

    if (
      status >= 300 &&
      status < 400
    ) {
      const location =
        response.headers.get('location');

      if (!location) {
        return {
          originalUrl,
          finalUrl: currentUrl,
          status,
          redirects: redirectChain.length,
          redirectChain,
          noindex: false,
          canonical: '',
          canonicalMismatch: false,
          missingCanonical: false,
          error: 'REDIRECT_WITHOUT_LOCATION'
        };
      }

      const nextUrl =
        new URL(location, currentUrl)
          .toString();

      redirectChain.push({
        status,
        from: currentUrl,
        to: nextUrl
      });

      currentUrl = nextUrl;
      continue;
    }

    const contentType =
      response.headers.get(
        'content-type'
      ) || '';

    let html = '';

    if (
      status >= 200 &&
      status < 300 &&
      /text\/html|application\/xhtml\+xml/i
        .test(contentType)
    ) {
      html = await readLimitedHtml(response);
    } else {
      try {
        await response.body?.cancel();
      } catch {
        // Ignore cancellation errors.
      }
    }

    const metaRobots =
      getMetaRobots(html);

    const headerRobots =
      response.headers.get(
        'x-robots-tag'
      ) || '';

    const noindex =
      hasNoindex(metaRobots) ||
      hasNoindex(headerRobots);

    const canonical =
      getCanonical(html);

    const canonicalResolved =
      canonical
        ? new URL(
            canonical,
            currentUrl
          ).toString()
        : '';

    const canonicalMismatch =
      Boolean(canonicalResolved) &&
      normalizeComparableUrl(
        canonicalResolved
      ) !==
        normalizeComparableUrl(currentUrl);

    return {
      originalUrl,
      finalUrl: currentUrl,
      status,
      redirects: redirectChain.length,
      redirectChain,
      noindex,
      canonical: canonicalResolved,
      canonicalMismatch,
      missingCanonical:
        status >= 200 &&
        status < 300 &&
        !canonicalResolved,
      error: ''
    };
  }

  return {
    originalUrl,
    finalUrl: currentUrl,
    status: 0,
    redirects: redirectChain.length,
    redirectChain,
    noindex: false,
    canonical: '',
    canonicalMismatch: false,
    missingCanonical: false,
    error: 'TOO_MANY_REDIRECTS'
  };
}

function classify(result) {
  if (result.error) {
    return 'REQUEST_ERROR';
  }

  if (
    result.status >= 500 &&
    result.status <= 599
  ) {
    return '5XX';
  }

  if (result.status === 404) {
    return '404';
  }

  if (
    result.status >= 400 &&
    result.status <= 499
  ) {
    return 'OTHER_4XX';
  }

  if (
    result.status >= 200 &&
    result.status <= 299
  ) {
    if (result.noindex) {
      return 'NOINDEX';
    }

    if (result.canonicalMismatch) {
      return 'CANONICAL_MISMATCH';
    }

    if (result.redirects > 0) {
      return 'REDIRECT_TO_OK';
    }

    return '200_INDEXABLE';
  }

  if (
    result.status >= 300 &&
    result.status <= 399
  ) {
    return 'UNRESOLVED_REDIRECT';
  }

  return 'OTHER';
}

function csvEscape(value) {
  const text = String(
    value ?? ''
  );

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

async function ensureDir(pathUrl) {
  const fs =
    await import('node:fs/promises');

  await fs.mkdir(pathUrl, {
    recursive: true
  });

  return fs;
}

async function main() {
  console.log(
    `Sitemap audit starting for ${SITE}`
  );
  console.log(
    `Concurrency: ${CONCURRENCY}`
  );

  const sitemapInfo =
    await collectSitemapUrls();

  const urls = sitemapInfo.urls;

  console.log(
    `Sitemaps discovered: ${sitemapInfo.sitemapCount}`
  );
  console.log(
    `URLs discovered: ${urls.length.toLocaleString()}`
  );

  if (!urls.length) {
    throw new Error(
      'The sitemap contains no URLs.'
    );
  }

  const results =
    new Array(urls.length);

  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= urls.length) return;

      const result =
        await requestUrl(urls[index]);

      result.category =
        classify(result);

      results[index] = result;

      completed += 1;

      if (
        completed % 100 === 0 ||
        completed === urls.length
      ) {
        console.log(
          `Checked ${completed.toLocaleString()} / ${urls.length.toLocaleString()}`
        );
      }
    }
  }

  await Promise.all(
    Array.from(
      {
        length:
          Math.min(
            CONCURRENCY,
            urls.length
          )
      },
      () => worker()
    )
  );

  const counts = {};

  for (const result of results) {
    counts[result.category] =
      (counts[result.category] || 0) + 1;
  }

  const cleanUrls = results
    .filter(
      (result) =>
        result.category ===
        '200_INDEXABLE'
    )
    .map(
      (result) =>
        result.originalUrl
    );

  const summary = {
    site: SITE,
    auditedAt:
      new Date().toISOString(),
    sitemapCount:
      sitemapInfo.sitemapCount,
    totalUrls: urls.length,
    concurrency: CONCURRENCY,
    counts,
    cleanIndexableUrls:
      cleanUrls.length
  };

  const fs =
    await ensureDir(OUTPUT_DIR);

  const jsonPath =
    new URL(
      './audit-results.json',
      OUTPUT_DIR
    );

  const csvPath =
    new URL(
      './audit-results.csv',
      OUTPUT_DIR
    );

  const summaryPath =
    new URL(
      './summary.txt',
      OUTPUT_DIR
    );

  const cleanPath =
    new URL(
      './clean-indexable-urls.txt',
      OUTPUT_DIR
    );

  await fs.writeFile(
    jsonPath,
    JSON.stringify(
      {
        summary,
        results
      },
      null,
      2
    ),
    'utf8'
  );

  const csvHeader = [
    'category',
    'status',
    'redirects',
    'noindex',
    'canonical_mismatch',
    'missing_canonical',
    'original_url',
    'final_url',
    'canonical',
    'error'
  ];

  const csvRows = [
    csvHeader.join(','),
    ...results.map((result) =>
      [
        result.category,
        result.status,
        result.redirects,
        result.noindex,
        result.canonicalMismatch,
        result.missingCanonical,
        result.originalUrl,
        result.finalUrl,
        result.canonical,
        result.error
      ]
        .map(csvEscape)
        .join(',')
    )
  ];

  await fs.writeFile(
    csvPath,
    `${csvRows.join('\n')}\n`,
    'utf8'
  );

  const orderedCategories = [
    '200_INDEXABLE',
    'REDIRECT_TO_OK',
    'NOINDEX',
    'CANONICAL_MISMATCH',
    '404',
    'OTHER_4XX',
    '5XX',
    'REQUEST_ERROR',
    'UNRESOLVED_REDIRECT',
    'OTHER'
  ];

  const summaryLines = [
    `SITE: ${summary.site}`,
    `AUDITED_AT: ${summary.auditedAt}`,
    `SITEMAPS: ${summary.sitemapCount}`,
    `TOTAL_URLS: ${summary.totalUrls}`,
    '',
    ...orderedCategories.map(
      (category) =>
        `${category}: ${counts[category] || 0}`
    ),
    '',
    `CLEAN_INDEXABLE_URLS: ${cleanUrls.length}`
  ];

  await fs.writeFile(
    summaryPath,
    `${summaryLines.join('\n')}\n`,
    'utf8'
  );

  await fs.writeFile(
    cleanPath,
    `${cleanUrls.join('\n')}\n`,
    'utf8'
  );

  console.log('');
  console.log('=== SUMMARY ===');

  for (const line of summaryLines) {
    console.log(line);
  }

  console.log('');
  console.log(
    'Reports written to:'
  );
  console.log(
    new URL('.', OUTPUT_DIR).pathname
  );
}

main().catch((error) => {
  console.error('');
  console.error(
    'AUDIT FAILED:',
    error
  );
  process.exitCode = 1;
});
