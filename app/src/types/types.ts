export interface UserType {
  login: string;
  displayname: string;
  image: {
    versions: {
      micro: string;
    };
  };
}

export interface LocationType {
  host: string;
  user: UserType;
  begin_at: string;
  campus_id: number;
}

export interface SeatType {
  id: string;
  row: string;
  seat: string;
  floor: string;
  isOccupied: boolean;
  user?: UserType;
}

export interface RowType {
  rowLabel: string;
  seats: string[];
}

export interface FloorLayoutType {
  name: string;
  hostPrefix: string;
  notes: string;
  detailedLayout: RowType[];
}

export interface CampusLayoutType {
  [key: string]: FloorLayoutType;
} 