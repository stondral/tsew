export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
  images: string[];
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}
