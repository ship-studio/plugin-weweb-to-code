/**
 * Lookup table mapping wwObjectBaseId UUID prefixes to human-readable component type labels.
 * Keys are the first 8 characters of the wwObjectBaseId (prefix before the first hyphen).
 * Verified against all 17 pages of the sample WeWeb export (33 unique wwObjectBaseId values).
 */
export const COMPONENT_LOOKUP: Record<string, string> = {
  b783dc65: 'Container',
  d7904e9d: 'Text',
  '1b1e2173': 'Icon',
  '83d890fb': 'Icon',
  '6f8796b1': 'Button',
  '59dca300': 'Button',
  deb10a01: 'TextInput',
  aeb78b9a: 'TextInput',
  '6145eb60': 'Select',
  '0d3e75d1': 'Select',
  '9ecb2cfc': 'Form',
  aa29a661: 'Checkbox',
  '6ba133b6': 'Checkbox',
  '3a7d6379': 'Image',
  a823467c: 'FileUpload',
  '9202d35c': 'FileInput',
  '985570fc': 'DatePicker',
  d2eeb897: 'DataGrid',
  a6cb6a4d: 'Tabs',
  '9256b033': 'Modal',
  '9ccf84b0': 'ImageSlider',
  aa27b26f: 'Loader',
  '70a53858': 'Category',
  '97a63460': 'Checkbox',
  '85044fa4': 'DateDisplay',
  c8199d0d: 'Select',
};

/**
 * Resolve a wwObjectBaseId to a human-readable component type label.
 *
 * Strategy (in order):
 * 1. Look up the first 8 characters of the UUID in COMPONENT_LOOKUP.
 * 2. Fall back to the object's name field if present.
 * 3. Final fallback: 'custom-component'.
 */
export function lookupComponentType(
  wwObjectBaseId: string,
  name: string | null,
): string {
  const prefix = wwObjectBaseId.slice(0, 8);
  const found = COMPONENT_LOOKUP[prefix];
  if (found) return found;
  if (name) return name;
  return 'custom-component';
}
