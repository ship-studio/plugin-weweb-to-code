export interface AssetEntry {
  filename: string;
  projectRelativePath: string;
}

export interface AssetManifest {
  images: AssetEntry[];
  icons: AssetEntry[];
  googleFonts: string[];
  totalCopied: number;
}
