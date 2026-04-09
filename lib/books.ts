export type BookStatus = "reading" | "queued" | "finished";

export type Book = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  progress: number;
};
