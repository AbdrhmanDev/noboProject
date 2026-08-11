export type RestaurantSeatingTable = {
  restaurantTableId: string;
  code: string;
  name: string | null;
  sortOrder: number;
  isOccupied: boolean;
  openSalesOrderCount: number;
};

export type RestaurantSeatingFloor = {
  restaurantFloorId: string;
  name: string;
  sortOrder: number;
  tables: RestaurantSeatingTable[];
};
