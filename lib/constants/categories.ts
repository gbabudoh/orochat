// Browsable category labels for Explore. Matching against user profiles is
// done semantically (embedding similarity) in app/api/explore/search/route.ts,
// not by keyword lookup, so no synonym list is needed here.
export const PROFESSIONAL_CATEGORIES: { label: string }[] = [
  { label: 'Software Engineering' },
  { label: 'Product Management' },
  { label: 'Marketing' },
  { label: 'Sales' },
  { label: 'Design' },
  { label: 'Finance' },
  { label: 'Consulting' },
  { label: 'Healthcare' },
  { label: 'Education' },
  { label: 'Legal' },
  { label: 'Real Estate' },
  { label: 'Entrepreneurship' },
];
