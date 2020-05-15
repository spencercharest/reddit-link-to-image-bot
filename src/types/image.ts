export interface Image {
  source: ImageInfo;
  variants: {
    gif?: Image;
    mp4?: Image;
  };
  resolutions: ImageInfo[];
}

export interface ImageInfo {
  url: string;
  width: number;
  height: number;
}

export interface ProcessedImage {
  url: string;
  isVideo: boolean;
}
