import { Image } from './image';

export interface Post {
  kind: string;
  data: {
    children: Array<{
      data: {
        title: string;
        preview: {
          images: Image[];
        };
      };
    }>;
  };
}
