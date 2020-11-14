export interface AsideForm {
  mode: "single" | "recent" | "folders";
  picMode: "picture" | "manga";
  size: "100" | "300" | "500" | "700";
  sort: "timeAsc" | "timeDesc" | "nameAsc" | "nameDesc";
  folder: string;
  days: number;
}

export interface ImageItem {
  path: string;
  cTime: number;
  name: string;
  src: string | null;
  loading: boolean;
}
