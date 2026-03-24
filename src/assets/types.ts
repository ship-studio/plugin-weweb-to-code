export interface AssetEntry {
  filename: string;
  projectRelativePath: string; // .shipstudio/assets/images/foo.jpg
}

export interface AssetManifest {
  images: AssetEntry[];
  icons: AssetEntry[];
  googleFonts: string[]; // extracted CDN URLs for brief
  totalCopied: number;
}
