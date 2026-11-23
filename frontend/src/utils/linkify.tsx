import React from 'react';
import { Link } from '@mui/material';

// Enhanced regular expression to detect various URL patterns
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;

// A bare "name.ext" is only a link when it ends in a common web domain. Without this,
// file names like SKILL.md, CLAUDE.md or index.html became links to unrelated sites.
const BARE_DOMAIN_TLDS = new Set(['com', 'net', 'org', 'jp', 'io', 'dev', 'app', 'ai', 'co', 'info', 'me', 'so', 'tv']);
const URL_TEST = new RegExp(URL_REGEX.source); // non-global: .test() on a /g regex keeps state between calls

const looksLikeLink = (part: string): boolean => {
  if (!URL_TEST.test(part) || !part.includes('.') || part.includes('@')) return false;
  if (/^(https?:\/\/|www\.)/i.test(part)) return true;
  const host = part.split('/')[0];
  const tld = host.split('.').pop()?.toLowerCase() || '';
  return BARE_DOMAIN_TLDS.has(tld);
};

// Function to normalize URLs (add https if missing)
const normalizeUrl = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('www.')) {
    return `https://${url}`;
  }
  // For domain-only URLs, check if they look like websites
  if (url.includes('.') && !url.includes('@')) {
    return `https://${url}`;
  }
  return url;
};

// Function to detect if a string contains URLs and convert them to clickable links
export const linkifyText = (text: string): React.ReactNode[] => {
  if (!text) return [text];

  const parts = text.split(URL_REGEX);
  
  return parts.map((part, index) => {
    if (looksLikeLink(part)) {
      // This looks like a URL, make it clickable
      const normalizedUrl = normalizeUrl(part);
      return (
        <Link
          key={index}
          href={normalizedUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: 'primary.main',
            textDecoration: 'underline',
            wordBreak: 'break-all',
            '&:hover': {
              textDecoration: 'none',
            },
          }}
        >
          {part}
        </Link>
      );
    }
    // This is regular text
    return part;
  });
};

// Alternative function that returns JSX directly for Typography components
export const LinkifiedText: React.FC<{ children: string }> = ({ children }) => {
  const linkedContent = linkifyText(children);
  
  return (
    <>
      {linkedContent}
    </>
  );
};